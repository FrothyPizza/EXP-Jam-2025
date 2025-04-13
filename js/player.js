

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 8, 8);
        this.spawnPosition = {x: x, y: y};

        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.Theo, "Run", this.animationSpeed);

        this.maxLives = CONSTANTS.playerMaxLives;
        this.lives = this.maxLives;


        this.defaultSpeed = 0.666;
        this.speed = 1;
        this.friction = 0.94;
        this.xVelLowerThreshold = 0.3;

        this.gravity = 0.12;
        this.defaultGravity = 0.12;

		this.jumpReleaseMultiplier = 0.7;
		this.maxJumpHoldTime = 11;
		this.jumpHoldTimer = new Clock();
		this.jumpHoldTimer.add(this.maxJumpHoldTime + 6);
		this.hasCutJumpVelocity = false;
        this.canJump = true;
		this.jumpSpeed = 2.3;        
        this.wallSlideDownSpeed = 0.5;
        this.jumpGracePeriodFrames = 5;
        this.jumpGracePeriodTimer = new Clock();

        this.canGlide = true;
        this.glideFallSpeed = 0.2;


        this.lastGroundedPositions = [{x: this.x, y: this.y}, {x: this.x, y: this.y}];



        this.canWallJump = false;
        this.wallJumpSpeed = 1.6;
        this.isWallJumping = false;
        
        this.framesAllowedTouchSpike = 2;
        this.framesTouchingSpike = 0;

        this.attackClock = new Clock();

        this.invincibilityDuration = 60;
        this.invincibilityTimer = new Clock();
        this.isInvincible = false;

        this.dead = false;
        this.framesCollindingWithEnemy = 0;
        this.allowedFramesCollidingWithEnemy = 4;

        // Dash variables
        this.canDash = true;         // Can the player dash?
        this.dashSpeed = 3.5;         // Horizontal speed during dash
        this.dashDuration = 9;     // How long dash lasts (in frames)
        this.dashCooldown = 20;     // Frames before next dash allowed
        this.isDashing = false;
        this.dashTimer = new Clock();
        this.dashClock = new Clock();


        this.FLYING_MODE = false;
    }

    update(map, entities) {
        super.update(map, entities);
        this.constrainPosition(map);

        if(this.dead) {
            return;
        }

        // check for spike
        // handle spikes
        if(map.pointIsCollidingWithSpikes(this.x, this.y) 
            || map.pointIsCollidingWithSpikes(this.x + this.width - 1, this.y) 
            || map.pointIsCollidingWithSpikes(this.x, this.y + this.height - 1) 
            || map.pointIsCollidingWithSpikes(this.x + this.width - 1, this.y + this.height - 1)) {
            this.framesTouchingSpike++;
        } else {
            this.framesTouchingSpike = 0;
        }
        if(this.framesTouchingSpike >= this.framesAllowedTouchSpike) {
            // this.x = this.spawnPosition.x;
            // this.y = this.spawnPosition.y;
            this.takeDamage();
        }

        
        // Handle dashing
        if(this.canDash) {
            // Attempt to start dash if conditions are met
            if(!this.isDashing && Inputs.dash && this.dashClock.getTime() > this.dashCooldown) {
                this.isDashing = true;
                this.dashTimer.restart();
                this.velocity.x = this.sprite.direction * this.dashSpeed;
                Loader.playSound("dash01.wav", 0.1);
            }

            // If currently dashing, override normal movement
            if(this.isDashing) {
                this.sprite.setAnimation("Run");
                // Maintain horizontal dash speed, ignore normal friction and jumping
                this.velocity.y = 0; 
                this.velocity.x = this.sprite.direction * this.dashSpeed; 

                this.gravity = 0;

                for(let i = 0; i < 5; i++) {
                    // create light blue particles
                    let particle = new Particle(this.x + this.width/2 + Math.floor(Math.random() * 3) - 1, 
                        this.y + this.height/2 + Math.floor(Math.random() * 8) - 4, 
                        2, 2, "rgba(255, 0, 0, 0.5)", Math.floor(Math.random() * 10));
                    entities.push(particle);
                }

                if(this.dashTimer.getTime() > this.dashDuration) {
                    this.isDashing = false;
                    this.dashClock.restart(); // start cooldown after dash ends
                    this.velocity.x = 0;
                }
                // Skip normal handling while dashing
                
                if(this.isDashing && (this.velocity.x > 0 && Inputs.left) || (this.velocity.x < 0 && Inputs.right)) {
                    this.isDashing = false;
                    this.dashClock.restart(); // start cooldown after dash ends
                    this.velocity.x = 0;
                }

                return;
            }
        }
        this.gravity = this.defaultGravity;


        // handle basic physics
        this.velocity.x *= this.friction;
        if(this.bottomHit && this.velocity.x < 0.5) this.velocity.x = 0;
        if(Math.abs(this.velocity.x) < this.xVelLowerThreshold) this.velocity.x = 0;


        // handle jumping
        if(this.bottomHit) { 
            this.jumpGracePeriodTimer.restart();

            this.lastGroundedPositions.push({x: this.x, y: this.y});
            if(this.lastGroundedPositions.length > 8) {
                this.lastGroundedPositions.shift();
            }
        }
        if(!Inputs.jump) this.canJump = true;
        if((this.bottomHit || this.jumpGracePeriodTimer.getTime() < this.jumpGracePeriodFrames) && Inputs.jump && this.canJump) {
            this.velocity.y = -this.jumpSpeed;
            this.hasCutJumpVelocity = false;
            this.jumpHoldTimer.restart();
            this.canJump = false;

            Loader.playSound("jump.wav", 0.1);
        }
        if(this.jumpHoldTimer.getTime() < this.maxJumpHoldTime && Inputs.jump) {
            this.velocity.y = -this.jumpSpeed;
            if(this.topHit) {
                this.hasCutJumpVelocity = true;
                this.jumpHoldTimer.add(10000);
            }
        } else if(!this.hasCutJumpVelocity && this.jumpHoldTimer.getTime() < this.maxJumpHoldTime) {
            this.jumpHoldTimer.add(10000);
            this.velocity.y *= this.jumpReleaseMultiplier;
            this.hasCutJumpVelocity = true;
        }
        
        // Handle wall jumping
        if(this.canWallJump) {
            if(!this.bottomHit && this.rightHit && Inputs.jump && this.canJump && !this.isWallJumping) {
                this.canJump = false;
                this.velocity.y = -this.jumpSpeed;
                this.velocity.x = -this.wallJumpSpeed;
                this.moveH(map, -1);
                this.sprite.direction = -1;
                Inputs.shoot = false;

                Loader.playSound("jump.wav", 0.1);
            }
            if(!this.bottomHit && this.leftHit && Inputs.jump && this.canJump && !this.isWallJumping) {
                this.canJump = false;
                this.velocity.y = -this.jumpSpeed;
                this.velocity.x = this.wallJumpSpeed;
                this.moveH(map, 1);
                this.sprite.direction = 1;
                Inputs.shoot = false;

                
                Loader.playSound("jump.wav", 0.1);
            }
        }




        if(!this.FLYING_MODE) {
            if(Math.abs(this.velocity.y) < 0.25) {
                if(!XOR(Inputs.left, Inputs.right)) {
                    this.sprite.setAnimation("Idle");
                } else {
                    this.sprite.setAnimation("Run");
                }
            } else {
                if(this.velocity.y < 0) {
                    this.sprite.setAnimation("Jump");
                } else if(this.sprite.currentAnimation !== "Feather Fall") {
                    this.sprite.setAnimation("Fall");
                }
            }
        }

        if(Inputs.left && Math.abs(this.velocity.x) < this.speed && this.velocity.x <= 0.5) {
            this.moveH(map, -this.speed);
            this.sprite.direction = -1;
        }
        if(Inputs.right && Math.abs(this.velocity.x) < this.speed && this.velocity.x >= -0.5) {
            this.moveH(map, this.speed);
            this.sprite.direction = 1;
        }

        // handle wall sliding
        if(!this.bottomHit && this.rightHit && Inputs.right) {
            if(this.velocity.y > 0)
                this.velocity.y -= this.gravity/2;
            if(this.velocity.y > this.wallSlideDownSpeed) this.velocity.y = this.wallSlideDownSpeed;
            this.sprite.direction = this.rightHit ? 1 : -1;
            this.sprite.setAnimation("Wall Grab");
        }
        if(!this.bottomHit && this.leftHit && Inputs.left) {
            if(this.velocity.y > 0)
                this.velocity.y -= this.gravity/2;
            if(this.velocity.y > this.wallSlideDownSpeed) this.velocity.y = this.wallSlideDownSpeed;
            this.sprite.direction = this.rightHit ? 1 : -1;
            this.sprite.setAnimation("Wall Grab");
        }

        // handle gliding
        if(this.canGlide && !this.bottomHit && Inputs.jump) {
            if(this.velocity.y > 0) {
                this.velocity.y = this.glideFallSpeed;
                this.sprite.setAnimation("Feather Fall");
            }
        }


        this.handleOffMap(map);


        if(this.FLYING_MODE) {
            this.gravity = 0;
            this.defaultGravity = 0;
            this.velocity.x = 0;
            this.velocity.y = 0;

            this.y += 1;

            this.sprite.setAnimation("Feather Fall");

            // if up inputs, move up
            if(Inputs.up) {
                this.moveV(map, -this.speed - 0.125);
            }
            // if down inputs, move down
            if(Inputs.down) {
                this.moveV(map, this.speed + 0.25);
            }
        }
        



        // handle invincibility
        if(this.isInvincible && this.invincibilityTimer.getTime() > this.invincibilityDuration) {
            this.isInvincible = false;
            
        }

        this.isWallJumping = false;
    }

    handleOffMap(map) {
        if(this.y > map.height * map.tileheight - 6) {
            this.sprite.setAnimation("Idle");
            if(this.lives > 0) {
                this.x = this.lastGroundedPositions[0].x;
                this.y = this.lastGroundedPositions[0].y;
            }
            this.takeDamage(10);
            currentScene.freezeFrame(60);

            this.velocity.x = 0;
            this.velocity.y = 0;
            
        }
            
    }

    interactWith(other) {
        if(other instanceof Flag) {
            if(this.colliding(other)) {
                // console.log("COLLIDING WITH FLAG");
                if(other.sprite.currentAnimation !== "IdleComplete") {
                    console.log("COLLIDING WITH FLAG");
                    Loader.playSound("powerup.wav", 0.1);
                }
                other.sprite.setAnimation("IdleComplete");
                this.spawnPosition.x = other.x;
                this.spawnPosition.y = other.y + 8;

            }
        }
        if(other instanceof LevelCompleteArea) {
            if(this.colliding(other)) {
                currentScene.completeScene();
            }
        }

        if(other.isEnemy || (other instanceof Collider && other.damagesPlayer)) {
            if(this.colliding(other) && !this.isInvincible && !this.dead) {
                this.framesCollindingWithEnemy++;
                if(this.framesCollindingWithEnemy < this.allowedFramesCollidingWithEnemy)
                    return;
                this.takeDamage();
            } else {

            }
        }

    }

    takeDamage(shake) {
        if(this.isInvincible || this.dead) return;
        Loader.playSound("damage.wav", 0.3);
    
        if(this.lives > 0) {
            shakeScreen(shake | 10);
            this.lives--;
            this.isInvincible = true;
            this.invincibilityTimer.restart();
                
        } else if(this.lives <= 0) {
            currentScene.freezeFrame(60);
            context.view.lockedToPlayer = false;
            this.velocity.x = -this.sprite.direction * 3;
            this.velocity.y = -3;
            this.dead = true;
            this.collidesWithMap = false;
            this.sprite.setAnimation("Idle");
            this.sprite.paused = true;
            setFrameTimeout(() => {
                if(currentScene.restart)
                    currentScene.restart(this.spawnPosition.x, this.spawnPosition.y);
            }, 240);
        }
    }

    resetPosition() {
        this.x = this.spawnPosition.x;
        this.y = this.spawnPosition.y;
    }

    draw(context) {
        if(this.dead) {
            this.sprite.tint = "rgba(255, 0, 0, 0.5)";
        } else{
            this.sprite.tint = null;
        }

        // Draw Player
        if(this.isInvincible) {
            if(APP_ELAPSED_FRAMES % 20 < 10) {
                this.sprite.draw(context, this.x, this.y);
            }
        } else {
            
            this.sprite.draw(context, this.x, this.y);
            
        }

    }



}















// // the turtle makes it rain tadpoles (that look like sperm) that the player has to dodge.
// class TurtleEnemy extends Enemy {
//     constructor(x, y) {
//         super(x, y, 54, 39);
//         this.speed = 0.2;
//         this.direction = -1;

//         this.animationSpeed = 8;
//         this.sprite = new AnimatedSprite(Loader.spriteSheets.turtle, "Run", this.animationSpeed);
//         this.sprite.isBackwards = true;

//         this.protectionAuraRadius = 30;

//         this.jumpSpeed = 4;
//         this.gravity = 0.17;
//         this.canJump = true;


//         this.isContracted = false;
//         this.contractTimer = new Clock();
//         this.contractTime = 400;
//         this.contractTimeRange = {min: 400, max: 600};
//     }

//     update(map, entities) {
//         super.update(map, entities);
        

//         // Turn around if hitting a wall
//         if(this.rightHit || this.leftHit) {
//             this.direction *= -1;
//             this.x += this.direction * 2;
//         }


//         // Contract and expand
//         if(this.contractTimer.getTime() > this.contractTime) {
//             if(!this.isContracted) {
//                 this.sprite.setAnimation("Contract");
//                 this.sprite.nextAnimation = "Idle-Contracted";

//                 this.sprite.onAnimationComplete = () => {
//                     this.hasProtectionAura = true;
//                     this.sprite.onAnimationComplete = null;
//                 }

//                 this.isContracted = !this.isContracted;

//                 this.velocity.x = 0;
//             }
//             else {
//                 this.sprite.setAnimation("Run");
//                 this.isContracted = !this.isContracted;

//                 this.hasProtectionAura = false;
//             }
            
//             this.contractTimer.restart();
//             this.contractTime = Math.random() * (this.contractTimeRange.max - this.contractTimeRange.min) + this.contractTimeRange.min;
//         }

//         // If not contracted, move
//         if(!this.isContracted) {
//             this.velocity.x = this.speed * this.direction;
//             this.sprite.direction = this.direction;
//             this.sprite.setAnimation("Run");
//         }
       
//     }

//     draw(context) {
//         super.draw(context);
//         this.sprite.draw(context, this.x, this.y);
//         // rect(this.x, this.y, this.width, this.height, context, "rgba(255, 0, 0, 0.5)");
//     }

//     interactWith(other) {
//         // if(other.isEnemy) {
//         //     if(this.colliding(other)) {
//         //         this.direction *= -1;
//         //     }
//         // }
//     }

// }