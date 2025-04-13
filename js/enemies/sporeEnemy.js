

// Enemy that runs back and forth from edge to edge
class SporeEnemy extends Enemy {
    constructor(x, y, entities, framesAlive=10000000000000000) {
        super(x, y, 8, 8, 150);
        this.speed = 0;
        this.direction = 1;


        // frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.spirit_walker, "Run", this.animationSpeed);

        this.amountOfTimeToWait = 90;
        this.waitTimer = new Clock();
        this.waitTimer.add(this.amountOfTimeToWait * 2);


        this.aliveClock = new Clock();
        this.framesAlive = framesAlive;
    }

    update(map, entities) {
        super.update(map, entities);



        if(this.waitTimer.getTime() > this.amountOfTimeToWait) {
            
            this.sprite.setAnimation("Run");

        }





    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

}
