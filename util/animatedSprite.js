class AnimatedSprite {
    constructor(jsonData, startingAnimation, animationSpeed) {
        this.jsonData = jsonData;
        this.image = Loader.images[jsonData.meta.image];

        this.width = jsonData.frames[0].frame.w;
        this.height = jsonData.frames[0].frame.h;

        this.tint = null;
        this.currentAnimationFrom = 0;
        this.currentAnimationTo = 0;
        this.currentFrame = 0;
        this.frameCount = 0;
        this.direction = 1;
        this.isBackwards = false;
        this.nextAnimation = "";
        this.paused = false;
        this.onAnimationComplete = null;
        this.rotation = 0; // rotation in degrees

        this.setAnimation(startingAnimation);
        this.animationSpeed = animationSpeed ||
            this.jsonData.frames[0].duration / (1000 / APP_FPS);

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.width;
        this.offscreenCanvas.height = this.height;
        this.offscreenContext = this.offscreenCanvas.getContext('2d');
    }

    setAnimation(animation) {
        if (this.currentAnimation === animation) return;
        this.currentAnimation = animation;
        for (let tag of this.jsonData.meta.frameTags) {
            if (tag.name === animation) {
                this.currentAnimationFrom = tag.from;
                this.currentAnimationTo = tag.to;
                this.currentFrame = this.currentAnimationFrom;
                break;
            }
        }
    }

    restartAnimation() {
        this.currentFrame = this.currentAnimationFrom;
    }

    setRotation(degrees) {
        this.rotation = degrees;
    }

    draw(context, x, y) {
        x = Math.round(x);
        y = Math.round(y);

        // cull off-screen
        if (x + this.width < context.view.x || x > context.view.x + context.canvas.width ||
            y + this.height < context.view.y || y > context.view.y + context.canvas.height) {
            return;
        }

        // draw frame into offscreen canvas
        let frame = this.jsonData.frames[this.currentFrame];
        this.offscreenContext.clearRect(0, 0, this.width, this.height);
        this.offscreenContext.drawImage(
            this.image,
            frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h,
            0, 0, frame.frame.w, frame.frame.h
        );
        if (this.tint) {
            this.offscreenContext.fillStyle = this.tint;
            this.offscreenContext.globalCompositeOperation = 'source-atop';
            this.offscreenContext.fillRect(0, 0, frame.frame.w, frame.frame.h);
            this.offscreenContext.globalCompositeOperation = 'source-over';
        }

        if (this.paused) return;

        // compute effective scale for horizontal flipping
        let scaleX = this.isBackwards ? -1 : 1;
        scaleX *= this.direction;

        // apply rotation before flip
        context.save();
        const cx = x - context.view.x + this.width / 2;
        const cy = y - context.view.y + this.height / 2;
        context.translate(cx, cy);
        // rotate first
        context.rotate(this.rotation * Math.PI / 180);
        // then apply horizontal flip
        context.scale(scaleX, 1);
        context.drawImage(
            this.offscreenCanvas,
            -this.width / 2,
            -this.height / 2
        );
        context.restore();

        this.incrementAnimationFrame();
    }

    incrementAnimationFrame() {
        this.frameCount++;
        if (this.frameCount >= this.animationSpeed) {
            this.frameCount = 0;
            this.currentFrame++;
            if (this.currentFrame > this.currentAnimationTo) {
                this.currentFrame = this.currentAnimationFrom;
                if (this.onAnimationComplete) this.onAnimationComplete();
                if (this.nextAnimation) {
                    this.setAnimation(this.nextAnimation);
                    this.nextAnimation = "";
                }
            }
        }
    }
}

// Simple static sprite
class Sprite {
    constructor(image, width, height) {
        this.image = image;
        this.width = width;
        this.height = height;
        this.tint = null;
    }

    draw(context, x, y) {
        x = Math.round(x);
        y = Math.round(y);

        if (this.tint) {
            context.fillStyle = this.tint;
            context.globalCompositeOperation = 'source-atop';
            context.fillRect(x - context.view.x, y - context.view.y, this.width, this.height);
            context.globalCompositeOperation = 'source-over';
        }
        context.drawImage(this.image, x - context.view.x, y - context.view.y);
    }
}

// Example JSON data
/*
{ "frames": [
   {
    "filename": "player 0.aseprite",
    "frame": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 1.aseprite",
    "frame": { "x": 8, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 2.aseprite",
    "frame": { "x": 16, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 3.aseprite",
    "frame": { "x": 24, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 4.aseprite",
    "frame": { "x": 32, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 5.aseprite",
    "frame": { "x": 40, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 6.aseprite",
    "frame": { "x": 48, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 7.aseprite",
    "frame": { "x": 56, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 8.aseprite",
    "frame": { "x": 64, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 9.aseprite",
    "frame": { "x": 72, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   }
 ],
 "meta": {
  "app": "http://www.aseprite.org/",
  "version": "1.3-dev",
  "image": "testplayer.png",
  "format": "RGBA8888",
  "size": { "w": 80, "h": 8 },
  "scale": "1",
  "frameTags": [
   { "name": "Default", "from": 0, "to": 0, "direction": "forward" },
   { "name": "Idle", "from": 1, "to": 3, "direction": "forward" },
   { "name": "Run", "from": 4, "to": 7, "direction": "forward" },
   { "name": "Fall", "from": 8, "to": 8, "direction": "forward" },
   { "name": "Jump", "from": 9, "to": 9, "direction": "forward" }
  ]
 }
}

*/







