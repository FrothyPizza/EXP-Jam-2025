

class Flag extends Entity {
    constructor(x, y) {
        super(x, y, 8, 16);

        this.sprite = new AnimatedSprite(Loader.spriteSheets.Flag, "Idle", 12);


        this.collidesWithMap = false;

        this.gravity = 0;
        this.defaultGravity = 0;
    }

    draw(context) {
        this.sprite.draw(context, this.x, this.y);


    }

    update(map, entities) {
        super.update(map, entities);

    }
}




class LevelCompleteArea extends GameObject {
    constructor(x, y) {
        super(x, y, 16 * 8, 16);
        this.collidesWithMap = false;
        this.gravity = 0;
        this.defaultGravity = 0;
    }

    update(map, entities) {
        // super.update(map, entities);
    }

    draw(context) {
        context.fillStyle = "rgba(255, 255, 255, 0.1)";
        context.fillRect(this.x - context.view.x, this.y - context.view.y, this.width, this.height);
    }
}