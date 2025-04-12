

class Projectile extends Enemy {
    constructor(x, y, xVel, yVel, collider, sprite) {
        super(x, y);
        this.sprite = sprite;
        this.collider = collider;
        this.gravity = 0;

        this.velocity.x = xVel;
        // this.velocity.y = yVel;

        this.collidesWithMap = false;
    }
    
    update(map, entities) {
        super.update(map, entities);
        
        this.collider.x = this.x;
        this.collider.y = this.y;

        // if(!entities.find(this.collider)) {
        //     this.removeFromScene = true;
        // }
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);

    }

    interactWith(other) {
        return;
    }
}