

class Flag extends Entity {
    constructor(x, y) {
        super(x, 0, 8, 8);

        this.sprite = new AnimatedSprite(Loader.spriteSheets.flag, "Waving", 12);


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

