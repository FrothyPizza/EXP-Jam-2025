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