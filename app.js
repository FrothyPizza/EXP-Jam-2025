// app.js

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
context.imageSmoothingEnabled = false;
const WIDTH = 30 * 8;
const HEIGHT = 22 * 8;

let PIXEL_SIZE = 5;
canvas.height = HEIGHT;
canvas.width = WIDTH;

let APP_ELAPSED_FRAMES = 0;
let APP_FPS = 60;

context.view = {x: 0, y: 0, width: WIDTH, height: HEIGHT, offsetX: 0, offsetY: 0};
function shakeScreen(amount) {
    let angle = Math.random() * Math.PI * 2;
    context.view.offsetX = Math.cos(angle) * amount;
    context.view.offsetY = Math.sin(angle) * amount;
    context.view.wasLockedToPlayer = context.view.lockedToPlayer;
    context.view.lockedToPlayer = true;

    // lerp back
    executeForXFrames(() => {
        context.view.offsetX = context.view.offsetX * 0.7;
        context.view.offsetY = context.view.offsetY * 0.7;
    }, 10);
    setFrameTimeout(() => {
        context.view.offsetX = 0;
        context.view.offsetY = 0;
        context.view.lockedToPlayer = context.view.wasLockedToPlayer;
    }, 10);

    // if gamepad connected, vibrate
    if(navigator.getGamepads()[0]) {
        navigator.getGamepads()[0].vibrationActuator.playEffect("dual-rumble", {
            duration: 100,
            strongMagnitude: 1.0,
            weakMagnitude: 1.0
        });
    }
}

// define method context.view.drawRect(x, y, w, h) that draws a rectangle at the given position and size, but offset by context.view.x and context.view.y
context.view.drawRect = function(x, y, w, h) {
    context.fillRect(x - this.x, y - this.y, w, h);
};


function resize() {
    let browserHeight = window.innerHeight;
    PIXEL_SIZE = Math.floor(browserHeight / HEIGHT + 0.1);
    canvas.style.height = HEIGHT * PIXEL_SIZE + 'px';
    canvas.style.width = WIDTH * PIXEL_SIZE + 'px';
} 
resize();
addEventListener('resize', resize);


// some confusing code that makes it so that if the monitor is 60 fps, then the game will run using requestAnimationFrame at 60 fps
// otherwise, the game will run at 60 fps using setInterval, since requestAnimationFrame uses the monitor's refresh rate
function startGameloop() {
    const getFPS = () =>
        new Promise(resolve =>
            requestAnimationFrame(t1 =>
                requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
        ));

    let is60FPS = true;
    function setFPS() {
        getFPS().then(fps => {
            // console.log("detected fps: " + fps);
            is60FPS = !(fps > 80 || fps < 30);
        });
    }
    setTimeout(() => {
        setFPS();
        setInterval(() => {
            setFPS();
        }, 1000);
    }, 100);

    let u = () => {
        if(is60FPS)
            update();
        requestAnimationFrame(u);
    };
    requestAnimationFrame(u);

    setInterval(() => {
        if(!is60FPS)
            update();
    }, 1000 / 60);
}

let currentScene;
let gameMode = 'quickplay';

function loadScene(levelName) {
    currentScene = new LevelScene(levelName);
}

let level = 0;
function init() {
    console.log(CONSTANTS.levels[level]);

    // loadScene(CONSTANTS.levels[level]);
    currentScene = new MenuScene();
    // currentScene = new WorldMapScene();
    startGameloop();
}

// Main Game Loop
function update() {
    context.fillStyle = '#151515';
    context.fillRect(0, 0, WIDTH, HEIGHT);




    currentScene.update();

    // if(currentScene.sceneComplete) {
    //     level++;
    //     if(level >= CONSTANTS.levels.length) {
    //         level = 0;
    //     }
    //     loadScene(CONSTANTS.levels[level], currentScene.playerLives);
    // }


    if(!(currentScene instanceof MenuScene) && !(currentScene instanceof WorldMapScene)) {
        // Handle view position based on player
        let player = currentScene.player;

        if(context.view.lockedToPlayer) {
            let maxOffset = 1/32;
            let playerXRelativeToView = player.x - context.view.x;
            // let playerYRelativeToView = player.y - context.view.y;
            if(playerXRelativeToView > WIDTH * (1/2 + maxOffset)) {
                context.view.x = player.x - Math.round(WIDTH * (1/2 + maxOffset));
            } else if(playerXRelativeToView < WIDTH * (1/2 - maxOffset)) {
                context.view.x = player.x - Math.round(WIDTH * (1/2 - maxOffset));
            }
            // if(playerYRelativeToView > HEIGHT * (1/2 + maxOffset)) {
            //     context.view.y = player.y - Math.round(HEIGHT * (1/2 + maxOffset));
            // } else if(playerYRelativeToView < HEIGHT * (1/2 - maxOffset)) {
            //     context.view.y = player.y - Math.round(HEIGHT * (1/2 - maxOffset));
            // }

            // // actually, just center the view on the player
            // if(context.view.lockedToPlayer) {
            //     context.view.x = Math.round(player.x) - WIDTH / 2;
                context.view.y = Math.round(player.y) - HEIGHT / 2;
            // }
        }



        // Constrain view position
        context.view.x = constrain(context.view.x, 0, Loader.levels[currentScene.levelName].width * 8 - WIDTH);
        context.view.y = constrain(context.view.y, 0, Loader.levels[currentScene.levelName].height * 8 - HEIGHT);
        // Round view position
        context.view.x = Math.round(context.view.x) + Math.round(context.view.offsetX);
        context.view.y = Math.round(context.view.y) + Math.round(context.view.offsetY);


    }


    currentScene.draw(context);


    
    // draw border around outside of screen
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.strokeRect(0, 0, WIDTH, HEIGHT);


    updateFrameTimeouts();
    APP_ELAPSED_FRAMES++;




}
