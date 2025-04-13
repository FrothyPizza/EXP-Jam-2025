
class HadesEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        // super(x, y, 32, 24, 7200);
        super(x, y, 32, 24, 7200);

        this.hurtboxes = [{ x: 7, y: 5, w: this.width - 5, h: this.height - 7 }];


        this.direction = 1;

        this.velocity.x = 0;
        this.yOffset = 0;

        this.gravity = 0;
        this.defaultGravity = 0;
        this.collidesWithMap = false;

        // Animation setup
        this.animationSpeed = 8;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.Hades, "Idle", this.animationSpeed);
        this.sprite.direction = this.direction;



        this.stageThresholds = [
            { health: this.maxHealth - 1, stage: 2 },
            { health: this.maxHealth * 1 / 3, stage: 3 },
            { health: 1, stage: 4 }
        ];





        this.moving = true;
        this.movementFrameCounter = 0;

        this.shootingBeam = false;


        this.hasReachedEnd = false;

    }

    update(map, entities) {
        super.update(map, entities);


        if(this.currentStage > 1) {
            this.sprite.direction = this.direction;
            context.view.y = this.maxHealth - this.health;
        }



    }

    stage1Behavior(map, entities) {
        currentScene.player.y = 80;
        currentScene.player.x = 36;
        
        // move towards top left of screen smoothly
        let target = { x: -5, y: 3 };
        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 2) {
            this.velocity.x = dx / distance;
            this.velocity.y = dy / distance;
            this.sprite.setAnimation("Idle");

        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;

            this.sprite.setAnimation("Start");
            

            this.sprite.onAnimationComplete = () => {
                this.sprite.paused = true;
                setFrameTimeout(() => {
                    this.sprite.setAnimation("Idle");

                    // this.currentStage++;
                    // this.advanceStage();
                    this.health -= 1;
                    this.sprite.paused = false;
                }, 60);
            };

        }
        this.x += this.velocity.x;
        this.y += this.velocity.y;



    }


    glideToRelativeLocation(targetX, targetY) {
        targetY += this.yOffset;
        // Move towards the target location smoothly
        let dx = targetX - this.x;
        let dy = targetY - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 2) {
            this.velocity.x = dx / distance;
            this.velocity.y = dy / distance;
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }



    stage2Behavior(map, entities) {
        this.health -= 1; // lose 1 health every frame
        this.y++;
        this.yOffset++;

        if(!this.state) {
            this.state = "StartBeamAttack";
        }

        console.log(this.state);


        switch(this.state) {
            case "Idle":
                this.chooseAttack();
                this.sprite.setAnimation("Idle");
                break;
            case "StartShootAttack":
                this.glideToRelativeLocation(-15, 10);
                if(this.velocity.x === 0 && this.velocity.y === 0) { // then we've made it to the target location
                    this.state = "ShootAttack";
                    
                }
                break;
            case "ShootAttack":
                this.sprite.setAnimation("Summon");
                this.sprite.direction = 1;
                this.glideToRelativeLocation(220, 10);
                if(this.velocity.x === 0 && this.velocity.y === 0) { // then we've made it to the target location
                    this.state = "Idle";
                }

                if(APP_ELAPSED_FRAMES % 18 === 0) {
                    this.spawnOrb(this.width/2, this.height - 8, 0, 2);
                    this.spawnOrb(this.width/2, this.height - 8, 0.1, 2);
                    this.spawnOrb(this.width/2, this.height - 8, -0.1, 2);
                }
                

                break;
            case "StartBeamAttack":
                this.glideToRelativeLocation(220, 10);
                if(this.velocity.x === 0 && this.velocity.y === 0) { // then we've made it to the target location
                    this.state = "BeamAttack";
                }
            
                break;
            case "BeamAttack":
                this.sprite.setAnimation("Beam");
                this.sprite.direction = -1;
                this.shootingBeam = true;
                // add a hurtbox to represent the beam
                if(this.hurtboxes.length < 2) {
                    this.hurtboxes.push({x: 0, y: this.y + this.height/2, w: this.x, h: 4});
                }
                this.hurtboxes[1].x = 0;
                this.hurtboxes[1].y = this.y + this.height/2;
                this.hurtboxes[1].w = this.x;
                this.hurtboxes[1].h = 4;

                console.log(this.hurtboxes);

                this.glideToRelativeLocation(220, 160);
                if(this.velocity.x === 0 && this.velocity.y === 0) { // then we've made it to the target location
                    this.state = "Idle";
                    this.sprite.paused = false;
                    this.shootingBeam = false;
                    this.hurtboxes.pop(); // remove the beam hurtbox
                }
                break;
            default:
                break;
        }
    }

    chooseAttack() {
        let randomNum = Math.random();
        if (randomNum < 0.5) {
            this.state = "StartShootAttack";
        } else {
            this.state = "StartBeamAttack";
        }
    }

    spawnOrb(relX, relY, xVel, yVel) {
        const orb = new OrbEnemy(this.x + relX, this.y + relY, 6);
        orb.damping = 1;
        orb.velocity.x = xVel;
        orb.velocity.y = yVel;
        
        currentScene.addEntity(orb);

    }

    stage3Behavior(map, entities) {
        this.stage2Behavior(map, entities);
    }



    stage4Behavior(map, entities) {
        
    


    }





      


    setupStage() {
        switch (this.currentStage) {
            case 1:
                currentScene.player.FLYING_MODE = true; 
                context.view.lockedToPlayer = false;

                this.sprite.setAnimation("Start");
                currentScene.startDialogue("You think you can defeat me? I am the god of the underworld!");

                break;
            case 2:
                console.log("Stage 2");
                Loader.playSound("EvilLaugh.wav", 0.2);
                break;
            case 3:
                console.log("Stage 3");
                Loader.playSound("EvilLaugh.wav", 0.3);
                
                break;

            case 4:
                console.log("Stage 4");

                Loader.playSound("EvilLaugh.wav", 0.5);

                break;
            default:
                break;
        }
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);


        if(this.shootingBeam) {
            // draw purple beam from left side of screen to this.x - this.width
            context.fillStyle = "rgba(255, 0, 255, 0.5)";
            context.fillRect(0, this.y - context.view.y + this.height/2, this.x, 4);


        }
    }
}






