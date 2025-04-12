

class Clock {
    constructor() {
        this.startTime = APP_ELAPSED_FRAMES;
    }

    restart() {
        this.startTime = APP_ELAPSED_FRAMES;
    }

    getTime() {
        return APP_ELAPSED_FRAMES - this.startTime;
    }

    add(frames) {
        this.startTime -= frames;
    }

}

let round = Math.round;

let queuedFrameTimeouts = [];
function setFrameTimeout(func, frames) {
    queuedFrameTimeouts.push({
        func: func,
        frames: frames,
        startTime: APP_ELAPSED_FRAMES
    });
}

function updateFrameTimeouts() {
    for(let i = 0; i < queuedFrameTimeouts.length; i++) {
        let timeout = queuedFrameTimeouts[i];
        if(APP_ELAPSED_FRAMES - timeout.startTime >= timeout.frames) {
            timeout.func();
            queuedFrameTimeouts.splice(i, 1);
            i--;
        }
    }
}

function executeForXFrames(func, frames) {
    for(let i = 0; i < frames; i++) {
        setFrameTimeout(func, i);
    }
}


function shuffle(array) {
    for(let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function XOR(a, b) {
    return (a || b) && !(a && b);
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function distance(x1, y1, x2, y2) {
    return dist(x1, y1, x2, y2);
}

// function distance(obj1, obj2) {
//     return dist(obj1.x, obj1.y, obj2.x, obj2.y);
// }


function bresenham(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;
 
    let points = [];
    let count = 0;
    while(true) {
        points.push({ x: x0, y: y0 });
 
        if ((x0 === x1) && (y0 === y1)) return points;
        var e2 = 2*err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }

    }
}




function mod(x, y) {
    if(x < 0) {
        return x + y;
    } else {
        return x % y;
    }
}


function lerp(a, b, t) {
    return a + (b - a) * t;
}

function constrain(a, b, c) {
    if(a < b) return b;
    if(a > c) return c;
    return a;
}

function line(x0, y0, x1, y1, ctx, color) {
    ctx.beginPath();
    ctx.moveTo(x0 - ctx.view.x, y0 - ctx.view.y);
    ctx.lineTo(x1 - ctx.view.x, y1 - ctx.view.y);
    ctx.strokeStyle = color;
    ctx.stroke();
}

function rect(x, y, w, h, ctx, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - ctx.view.x, y - ctx.view.y, w, h);
}

