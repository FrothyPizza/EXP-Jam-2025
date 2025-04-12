

class Flag extends Entity {
    constructor(x, y) {
        super(x, 0, 8, 8);

        this.sprite = new AnimatedSprite(Loader.spriteSheets.flag, "Waving", 12);

        this.target = {x: x, y: y};

        this.collidesWithMap = false;

        this.gravity = this.defaultGravity/4;
    }

    draw(context) {
        this.sprite.draw(context, this.x, this.y);

        // // draw a crate at all locations
        // for(let location of this.locations) {
        //     context.fillStyle = "red";
        //     context.fillRect(location.x - context.view.x, location.y - context.view.y, 8, 8);
        // }
    }

    update(map, entities) {
        super.update(map, entities);

        if(this.velocity.y > 6) {
            this.velocity.y = 6;
        }

        // if distance between this and target is < 10, collides with map is true, otherwise false
        if(this.y - this.target.y > -8 && !this.collidesWithMap) {
            this.collidesWithMap = true;
        }
        console.log(this.y - this.target.y);
    }
}

