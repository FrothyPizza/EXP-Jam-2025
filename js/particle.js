

class Particle extends GameObject {
    constructor(x, y, w, h, color, life) {
        super(x, y, w, h);
        this.color = color;
        this.life = life;

        this.velocity = {x: 0, y: 0};
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.life--;
        if(this.life <= 0) {
            this.removeFromScene = true;
        }
    }

    draw(context) {
        context.fillStyle = this.color;
        context.view.drawRect(this.x, this.y, this.width, this.height);
    }
}