

class MushroomSporeEnemy extends Enemy {
    constructor(x, y, entities, framesAlive=100000000000000000000000) {
        super(x, y, 12, 12, 150);
        this.speed = 0.125;
        this.direction = 1;


        // frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.MushroomSpore, "Idle", this.animationSpeed);

        this.amountOfTimeToWait = 300;
        this.waitTimer = new Clock();
        this.waitTimer.add(this.amountOfTimeToWait * 2);


        this.aliveClock = new Clock();
        this.framesAlive = framesAlive;




    }

    update(map, entities) {
        super.update(map, entities);

        this.velocity.x = 0;
        this.velocity.y = 0;

        if(this.aliveClock.getTime() > this.framesAlive) {
            this.collidesWithMap = false;
            setFrameTimeout(() => {
                this.removeFromScene = true;
            }
            , 120);
        }


        // if distance to player is less than 100, then
        let player = currentScene.player;
        this.direction = player.x > this.x ? 1 : -1;
        this.sprite.direction = this.direction;
        const dx = player.x + player.width/2 - this.x;
        const dy = player.y + player.height/2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);


        if(distance < 80) {


            if(this.waitTimer.getTime() > this.amountOfTimeToWait) {
                this.sprite.setAnimation("Attack");


                this.sprite.onAnimationComplete = () => {
                    Loader.playSound("ghost summon 2.wav", 0.1);

                    for(let i = 0; i < 3; i++) {
                        // spawn OrbEnemy with velocity towards player using trig
                        const orb = new OrbEnemy(this.x + this.width / 2, this.y - this.height / 2);
                        // random velocity between -1 for x and 0 and -1 for y
                        orb.velocity.x = Math.random() * 2 - 1;
                        orb.velocity.y = Math.random() * 1 - 1;
                        orb.velocity.x *= 0.5;
                        orb.velocity.y *= 0.5;

                        currentScene.addEntity(orb);
                    }

                    this.sprite.setAnimation("Idle");
                    this.waitTimer.restart();
                    
                    this.sprite.onAnimationComplete = () => {};
                }
            }


        } else {
            this.velocity.x = 0;
            this.sprite.setAnimation("Default");

            this.sprite.onAnimationComplete = () => {};

        }




    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

}