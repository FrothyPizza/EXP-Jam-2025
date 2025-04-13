
class CharonEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 32, 24, 2000);

        this.speed = 1;
        this.direction = 1;

        this.velocity.x = 0;

        this.gravity = 0;
        this.defaultGravity = 0;
        this.collidesWithMap = false;

        // Animation setup
        this.animationSpeed = 8;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.Charon, "Idle", this.animationSpeed);
        this.sprite.direction = this.direction;


        this.stageThresholds = [
            { health: this.maxHealth * 2 / 3, stage: 2 },
            { health: this.maxHealth / 3, stage: 3 }
        ];


        this.pauseMovingTimer = new Clock();
        this.timeToPauseMoving = 240;

        this.moving = true;
        this.movementFrameCounter = 0;

        this.enemiesToSpawn = 3;

    }

    update(map, entities) {
        super.update(map, entities);

        this.sprite.direction = this.direction;

        this.health -= 1; // lose 1 health every frame
        console.log(this.health);
        
    }

    stage1Behavior(map, entities) {

        if (this.pauseMovingTimer.getTime() > this.timeToPauseMoving) {
            this.pauseMovingTimer.restart();

            this.moving = false;
            this.sprite.setAnimation("Swing");
            this.enemiesToSpawn = 3;

            // choose random 0 or 1
            let random = Math.floor(Math.random() * 2);
            if(random === 0) {
                this.enemiesToSpawn = 6;
            }


            this.sprite.onAnimationComplete = () => {
                this.enemiesToSpawn--;

                if(random === 0) {
                    this.spawnRotatingSpiritEnemy(entities);
                    if(this.waterfallEnemy)
                        this.waterfallEnemy.disabled = true;
                } else {
                    currentScene.addEntity(new SpiritWalkerEnemy(this.x + this.width/2, this.y + this.height/2, entities, 20*60));
                }


                this.pauseMovingTimer.restart();

                if(this.enemiesToSpawn <= 0) {
                    this.moving = true;
                    this.sprite.setAnimation("Idle");
                    this.sprite.onAnimationComplete = null;
                }
            }
            
        }
        if(this.moving) {
            let { x, y } = this.getPositionFig8(this.movementFrameCounter/100);
            this.direction = this.x < x ? 1 : -1;
            this.x = x;
            this.y = y;

            this.movementFrameCounter++;
            

            if(this.waterfallEnemy) {
                this.waterfallEnemy.disabled = false;
                this.waterfallEnemy.x = this.x + this.width/2 - this.waterfallEnemy.width/2;
                this.waterfallEnemy.y = this.y + this.height;
            }
        }
    }




    stage2Behavior(map, entities) {
        this.stage1Behavior(map, entities);
    }

    stage3Behavior(map, entities) {
        this.stage1Behavior(map, entities);
    }

    spawnRotatingSpiritEnemy(entities) {
        let player = currentScene.player;
        let playerX = player.x + player.width/2;
        let playerY = player.y + player.height/2;
        let angle = Math.atan2(playerY - this.y, playerX - this.x);
        let spawnX = this.x + Math.cos(angle) * 20;
        let spawnY = this.y + Math.sin(angle) * 20;
        let enemy = new RotatingSpiritEnemy(spawnX, spawnY);
        enemy.direction = this.direction;
        // enemy should move towards the player
        enemy.velocity.x = Math.cos(angle) * enemy.speed;
        enemy.velocity.y = Math.sin(angle) * enemy.speed;

        currentScene.addEntity(enemy);
    }


    getPositionFig8(t) {
        // Define the center of the figure eight.
        const centerX = 240 / 2 - this.width/2; // 120 pixels: center horizontally.
        const centerY = 30;      // Adjust this to place the figure eight near the top.
      
        // Amplitude values determine the extent of the movement.
        const amplitudeX = 70;  // Adjust how far the boss moves left/right.
        const amplitudeY = 20;   // Adjust how far the boss moves up/down.
      
        // Compute x using a sine function.
        const x = centerX + amplitudeX * Math.sin(t);
      
        // Compute y using a sine function at twice the frequency.
        // Using Math.sin(2*t) creates the crossing needed for a figure eight.
        const y = centerY + amplitudeY * Math.sin(2 * t);
      
        return { x, y };
    }
    getPositionSpecial(t) {
        // Center the movement horizontally on a 240px wide screen, adjusting for boss's width.
        const centerX = 240 / 2 - this.width / 2;
        // Define a vertical center position.
        const centerY = 30;
        
        // Define amplitudes for x and y movement.
        const amplitudeX = 60; // horizontal range
        const amplitudeY = 25; // vertical range
        
        // Use different multipliers and a phase shift to get a quirky pattern:
        const x = centerX + amplitudeX * Math.sin(3 * t);
        // A phase offset (here, PI/4) and a different frequency for y produces interesting crossing paths.
        const y = centerY + amplitudeY * Math.sin(2 * t + Math.PI / 4);
        
        return { x, y };
    }



      


    setupStage() {
        switch (this.currentStage) {
            case 1:
                console.log("Stage 1");
                break;
            case 2:
                console.log("Stage 2");
                this.waterfallEnemy = new WaterfallEnemy(this.x, this.y, currentScene.entities);
                currentScene.addEntity(this.waterfallEnemy);
                break;
            case 3:
                console.log("Stage 3");
                break;
            default:
                break;
        }
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }
}







// Enemy that runs back and forth from edge to edge
class RotatingSpiritEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 150);
        this.speed = 1;
        this.direction = 1;

        this.collidesWithMap = false;
        this.gravity = 0;
        this.defaultGravity = 0;


        // frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.spirit_walker, "Rotate", this.animationSpeed);

    }

    update(map, entities) {
        super.update(map, entities);



        // // if the point to the down and right or left and down is empty, turn around since it's about to fall off
        // if(!map.pointIsCollidingWithWall(this.x + this.width + 1, this.y + this.height + 1)
        // || !map.pointIsCollidingWithWall(this.x - 1, this.y + this.height + 1)) {
        //     this.direction *= -1;

        //     this.waitTimer.restart();
        //     this.x += this.direction;
        // }




    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

}



class WaterfallEnemy extends Enemy {
    constructor(x, y, entities) {
        super(x, y, 8, 192, 150);


        // frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.waterfall, "Idle", this.animationSpeed);


        this.collidesWithMap = false;
        this.gravity = 0;
        this.defaultGravity = 0;

        this.disabled = false;

    }


    update(map, entities) {
        super.update(map, entities);

        this.sprite.setAnimation("Idle");

        if(this.disabled) {
            this.x = 10000;
        }
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }
}