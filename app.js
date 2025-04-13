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
    // context.view.lockedToPlayer = true;

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
    currentScene.draw(context);

    // if(currentScene.sceneComplete) {
    //     level++;
    //     if(level >= CONSTANTS.levels.length) {
    //         level = 0;
    //     }
    //     loadScene(CONSTANTS.levels[level], currentScene.playerLives);
    // }

    
    // draw border around outside of screen
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.strokeRect(0, 0, WIDTH, HEIGHT);


    updateFrameTimeouts();
    APP_ELAPSED_FRAMES++;


    if(!(currentScene instanceof MenuScene) && !(currentScene instanceof WorldMapScene)) {
        // Handle view position based on player
        let player = currentScene.player;
        // let playerXRelativeToView = player.x - context.view.x;
        // let playerYRelativeToView = player.y - context.view.y;
        // if(playerXRelativeToView > WIDTH * 3 / 5) {
        //     context.view.x = player.x - WIDTH * 3 / 5;
        // } else if(playerXRelativeToView < WIDTH * 2 / 5) {
        //     context.view.x = player.x - WIDTH * 2 / 5;
        // }
        // if(playerYRelativeToView > HEIGHT * 3 / 5) {
        //     context.view.y = player.y - HEIGHT * 3 / 5;
        // } else if(playerYRelativeToView < HEIGHT * 2 / 5) {
        //     context.view.y = player.y - HEIGHT * 2 / 5;
        // }

        // actually, just center the view on the player
        if(context.view.lockedToPlayer) {
            context.view.x = Math.round(player.x - WIDTH / 2);
            context.view.y = Math.round(player.y - HEIGHT / 2);
        }



        // Constrain view position
        context.view.x = constrain(context.view.x, 0, Loader.levels[currentScene.levelName].width * 8 - WIDTH);
        context.view.y = constrain(context.view.y, 0, Loader.levels[currentScene.levelName].height * 8 - HEIGHT);
        // Round view position
        context.view.x = Math.round(context.view.x) + Math.round(context.view.offsetX);
        context.view.y = Math.round(context.view.y) + Math.round(context.view.offsetY);





        // // Check if the player is out of bounds; if so, change the current level
        // let height = Loader.levels[currentScene.levelName].height * Loader.levels[currentScene.levelName].tileheight;
        // let width = Loader.levels[currentScene.levelName].width * Loader.levels[currentScene.levelName].tilewidth;
        // if(player.x > width - 4 || player.x < -4 || player.y > height - 4 || player.y < 4) {
        //     let horizDir = player.x > WIDTH - 4 ? 1 : player.x < 5 ? -1 : 1;

        //     let playerRealPos = {x: 0, y: 0};
        //     let currentMap;
        //     for(let i = 0; i < Loader.gameWorld.maps.length; i++) {
        //         if(Loader.gameWorld.maps[i].fileName === currentScene.levelName + '.tmx') {
        //             playerRealPos.x = Loader.gameWorld.maps[i].x + player.x;
        //             playerRealPos.y = Loader.gameWorld.maps[i].y + player.y;
        //             currentMap = Loader.gameWorld.maps[i];
        //             // console.log("playerRealPos: " + playerRealPos.x + ", " + playerRealPos.y);
        //         }
        //     }

        //     for(let i = 0; i < Loader.gameWorld.maps.length; i++) {
        //         // if player is contained in map
        //         let map = Loader.gameWorld.maps[i];
        //         if(map.fileName !== currentScene.levelName + '.tmx'
        //         && playerRealPos.x >= map.x - 4
        //         && playerRealPos.x <= map.x + map.width 
        //         && playerRealPos.y >= map.y 
        //         && playerRealPos.y <= map.y + map.height) {

        //             // Update player position based on the new map's spawn point
        //             let newLevelName = map.fileName.split('.')[0];
        //             loadScene(newLevelName);
        //             currentScene.player.x = playerRealPos.x - map.x + horizDir;
        //             currentScene.player.y = playerRealPos.y - map.y - 1;
        //             currentScene.resetPlayerPosition();

        //             break;
        //         }
        //     }
        // }
    }

}

// document.body.onload = () => {
//     setTimeout(() => {
//         Loader.load(
//             'assets/images/testplayer.json',
//             'assets/images/spider.json',
//             'assets/images/enemies/unicyclist.json',
//             'assets/images/enemies/mime_head.json',
//             'assets/images/enemies/turtle.json',
//             'assets/images/enemies/bee.json',
//             'assets/images/enemies/corgi.json',
//             'assets/images/enemies/sheep.json',

//             'assets/images/weapons/cannon.json',
//             'assets/images/weapons/drill.json',
//             'assets/images/weapons/hammer.json',
//             'assets/images/weapons/shuriken.json',
//             'assets/images/weapons/sword.json',
//             'assets/images/weapons/spear.json',

//             'assets/images/tiled/tower-tileset.tsx',
//             'assets/images/new-tiles.png',
//             'assets/images/tiled/levels/game_world.world',
//         ).then(() => {
//             let levels = [];
//             for (let i = 0; i < Loader.gameWorld.maps.length; i++) {
//                 levels.push('assets/images/tiled/levels/' + Loader.gameWorld.maps[i].fileName);
//             }
//             Loader.tilesetImage = Loader.images['new-tiles.png'];

//             Loader.load(...levels).then(() => {
//                 init();
//             });
//         });
//     }, 100);
// }
