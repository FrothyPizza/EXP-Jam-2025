

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

