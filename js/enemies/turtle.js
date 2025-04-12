class TurtleEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 54, 39, 8000); // Adjusted health for TurtleBoss
        this.speed = 0.15;
        this.direction = -1;

        // Animation setup
        this.animationSpeed = 8;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.turtle, "Run", this.animationSpeed);
        this.sprite.isBackwards = true;
        this.sprite.direction = this.direction;

        // Protection aura properties
        this.protectionAuraRadius = 30;

        // Movement properties
        this.jumpSpeed = 4;
        this.gravity = 0.17;
        this.canJump = true;

        // Contracting behavior properties
        this.isContracted = false;
        this.contractTimer = new Clock();
        this.contractTime = 400;
        this.contractTimeRange = { min: 400, max: 600 };

        // Shooting properties
        this.tadpoles = [];
        this.tadpoleSpawnTimer = new Clock();
        this.tadpoleSpawnInterval = 1000; // Milliseconds between tadpole spawns
        this.tadpolesToSpawn = 5; // Number of tadpoles spwaned per interval
        this.spawnsHorizontalTadpoles = false;
        this.rainTadpolesAmount = 0;

        // Laser properties (for Stage 3)
        this.laserChargeDuration = 120;    // How many frames to charge
        this.laserShootDuration = 120;     // How many frames to shoot
        this.laserCooldownDuration = 500;  // How many frames before it can shoot again
        this.laserState = 'idle';          // 'idle' | 'charging' | 'shooting' | 'cooldown'
        this.laserTimer = 0;              // Counts frames in the current laser state
        this.laserLength = 500;           // How far the laser beam extends
        this.laserWidth = 24;             // Width of the laser beam

        // Stage thresholds
        this.stageThresholds = [
            { health: this.maxHealth * 2 / 3, stage: 2 },
            { health: this.maxHealth / 3, stage: 3 }
        ];

        // Initialize behaviors based on initial stage
        this.setupStage(false); // Stage 1 starts without strength modification
    }

    setupStage(isStronger) {
        switch (this.currentStage) {
            case 1:
                // Stage 1: Basic movement, minimal tadpole shooting
                this.tadpolesToSpawn = 2;
                this.tadpoleSpawnInterval = isStronger ? 200 : 300;
                break;
            case 2:
                // Stage 2: Start shooting tadpoles
                this.tadpolesToSpawn = isStronger ? 2 : 1; // More tadpoles if stronger
                this.tadpoleSpawnInterval = isStronger ? 150 : 200;
                this.contractTimeRange = isStronger ? { min: 400, max: 600 } : { min: 500, max: 700 };
                this.speed = 0.333333;
                this.rainTadpolesAmount = 5;
                this.contractTimer.add(1000); // Start with a delay before contracting
                // this.spawnsHorizontalTadpoles = true;
                break;
            case 3:
                // Stage 3: Advanced behavior with increased tadpole rate, protection aura, and laser
                this.tadpolesToSpawn = isStronger ? 2 : 2;
                this.tadpoleSpawnInterval = isStronger ? 100 : 200;
                this.contractTimeRange = isStronger ? { min: 300, max: 400 } : { min: 300, max: 400 };
                this.speed = 0.5;
                this.rainTadpolesAmount = 6;
                this.spawnsHorizontalTadpoles = false;
                break;
            default:
                break;
        }
    }

    update(map, entities) {
        super.update(map, entities);
        this.handleShooting(map, entities);
        this.handleLaser();

        // If we rely on sharedStageBehavior for movement and contracting, do it here:
        this.sharedStageBehavior(map, entities);

        // Stage-specific behaviors
        if (this.currentStage === 1) {
            this.stage1Behavior(map, entities);
        } else if (this.currentStage === 2) {
            this.stage2Behavior(map, entities);
        } else if (this.currentStage === 3) {
            this.stage3Behavior(map, entities);
        }
    }

    sharedStageBehavior(map, entities) {
        // Handle direction change upon hitting walls or obstacles
        // if (this.collidesWithMap &&
        //     (this.rightHit || this.leftHit
        //         || !map.pointIsCollidingWithWall(this.x + this.width - 2, this.y + this.height + 1)
        //         || !map.pointIsCollidingWithWall(this.x + 2, this.y + this.height + 1))) {
        //     this.direction *= -1;
        //     this.x += this.direction;

        // }

        if(this.collidesWithMap) {
            if(this.rightHit || map.pointIsCollidingWithWall(this.x + this.width, this.y + this.height - 1)) {
                this.direction = -1;
            } else if(this.leftHit || map.pointIsCollidingWithWall(this.x, this.y + this.height - 1)) {
                this.direction = 1;
            }
        }

        // If the turtle is either charging or shooting the laser, stop walking/contracting
        // Otherwise, continue the usual contract/expand logic
        if (this.laserState !== 'charging' && this.laserState !== 'shooting') {
            // Contract and expand behavior
            if (this.contractTimer.getTime() > this.contractTime && this.currentStage > 1 && (this.laserState === 'cooldown' || this.laserState === 'idle')) {
                if (!this.isContracted) {
                    this.sprite.setAnimation("Contract");
                    this.sprite.nextAnimation = "Idle-Contracted";

                    this.sprite.onAnimationComplete = () => {
                        this.hasProtectionAura = true;
                        this.sprite.onAnimationComplete = null;
                    };

                    this.isContracted = true;
                    this.velocity.x = 0;
                }
                else {
                    this.sprite.setAnimation("Run");
                    this.isContracted = false;
                    this.hasProtectionAura = false;
                }

                this.contractTimer.restart();
                this.contractTime = Math.random() * (this.contractTimeRange.max - this.contractTimeRange.min) + this.contractTimeRange.min;
            }

            // If not contracted, move
            if (!this.isContracted) {
                this.velocity.x = this.speed * this.direction;
                this.sprite.direction = this.direction;
                this.sprite.setAnimation("Run");
            }
        } else {
            // While charging or shooting, do not move
            this.velocity.x = 0;
        }
    }

    stage1Behavior(map, entities) {
        // No additional behavior in stage 1
    }

    stage2Behavior(map, entities) {
        // No additional behavior specifically for stage 2 (tadpole shooting is handled in handleShooting)
    }

    stage3Behavior(map, entities) {
        // Laser logic is handled in handleLaser (and sharedStageBehavior stops movement if charging/shooting)
    }

    handleShooting(map, entities) {
        // If the turtle is charging/shooting the laser, let's still allow tadpole shooting unless you want to disable.
        // The user didn't explicitly say to disable tadpoles, so we'll keep them.

        let shootTimeModifier = this.isContracted ? 0.5 : 1;
        if (this.tadpoleSpawnTimer.getTime() > this.tadpoleSpawnInterval * shootTimeModifier) {
            for (let i = 0; i < this.tadpolesToSpawn; i++) {
                this.spawnTadpole(entities);
            }
            this.tadpoleSpawnTimer.restart();

            if (this.currentStage === 3 || this.currentStage === 2) {
                this.rainTadpoles(map, entities);
            }
        }
    }

    // -- LASER LOGIC FOR STAGE 3 --
    handleLaser() {
        // Only do laser logic in Stage 3
        if (this.currentStage < 3) return;

        // Update the timer each frame
        this.laserTimer++;

        switch (this.laserState) {
            case 'idle':
                // We can decide to start charging immediately or use a condition. 
                // For simplicity, just start charging right away if in stage 3 and in 'idle'.
                
                this.direction = this.x < currentScene.player.x ? 1 : -1;
                this.sprite.direction = this.direction;
                this.laserState = 'charging';
                this.laserTimer = 0;
                break;

            case 'charging':
                // During charging, do nothing but wait
                if (this.laserTimer >= this.laserChargeDuration) {
                    this.laserState = 'shooting';
                    this.laserTimer = 0;

                    Loader.playSoundRepeat("turtle_laser.wav", 0.1, 5);

                    // create a collider for the laser beam
                    let laserCollider = null;
                    // if(this.direction === 1) {
                    //     laserCollider = new Collider(this.x + this.width, this.y + this.height / 2 - 5, this.laserLength, 10, 1, this.laserShootDuration);
                    // } else {
                    //     laserCollider = new Collider(this.x - this.laserLength, this.y + this.height / 2 - 5, this.laserLength, 10, 1, this.laserShootDuration);
                    // }
                    // adjust for laser width
                    if(this.direction === 1) {
                        laserCollider = new Collider(this.x + this.width, this.y + this.height / 2 - this.laserWidth / 2, this.laserLength, this.laserWidth, 1, this.laserShootDuration);
                    } else {
                        laserCollider = new Collider(this.x - this.laserLength, this.y + this.height / 2 - this.laserWidth / 2, this.laserLength, this.laserWidth, 1, this.laserShootDuration);
                    }
                    laserCollider.damagesPlayer = true;
                    currentScene.entities.push(laserCollider);
                }
                break;

            case 'shooting':
                // During shooting, the turtle holds still (handled in sharedStageBehavior)
                if (this.laserTimer >= this.laserShootDuration) {
                    this.laserState = 'cooldown';
                    this.laserTimer = 0;
                }
                break;

            case 'cooldown':
                // After shooting, do not charge again until cooldown is done
                if (this.laserTimer >= this.laserCooldownDuration && !this.isContracted) {
                    this.laserState = 'idle';
                    this.laserTimer = 0;
                }
                break;
        }
    }

    spawnTadpole(entities) {
        // spawn the tadpole from its butt, i.e. the outer edge of the sprite away from where it's facing
        const tadpole = new TurtleTadpoleEnemy(
            this.x + this.width / 2 + (this.width / 3) * -this.direction,
            this.y + this.height / 2,
            this.direction
        );
        this.tadpoles.push(tadpole);
        currentScene.addEntity(tadpole); // Assuming currentScene manages entities
    }

    removeAllTadpoles() {
        this.tadpoles.forEach(tadpole => {
            tadpole.dead = true;
        });
        this.tadpoles = [];
    }

    rainTadpoles(map, entities) {
        // spawn tadpoles evenly spaced at the top of the screen with downward and either slight left or right velocity
        let xVel = Math.random() > 0.5 ? 0.25 : -0.25;
        let tadpoles = this.rainTadpolesAmount;
        let xSpacing = 240 / tadpoles;

        for (let i = 0; i < tadpoles; i++) {
            const tadpole = new TurtleTadpoleEnemy(i * xSpacing + xSpacing / 2, 0, 1);
            tadpole.velocity.y = 1.5;
            tadpole.velocity.x = xVel;
            tadpole.targetsPlayer = false;
            tadpole.gravity = 0;
            tadpole.maxHealth = 50; 
            tadpole.health = 50;
            tadpole.collidesWithMap = false;
            this.tadpoles.push(tadpole);
            currentScene.addEntity(tadpole);
        }

        if (this.spawnsHorizontalTadpoles) {
            let yVel = 0;
            let ySpacing = 196 / tadpoles;
            for (let i = 0; i < tadpoles; i++) {
                const tadpole = new TurtleTadpoleEnemy(0, i * ySpacing + ySpacing / 2 + 8, 1);
                tadpole.velocity.x = 1.5;
                tadpole.velocity.y = yVel;
                tadpole.targetsPlayer = false;
                tadpole.gravity = 0;
                tadpole.collidesWithMap = false;
                this.tadpoles.push(tadpole);
                currentScene.addEntity(tadpole);
            }
        }
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);

        // Draw protection aura if active
        if (this.hasProtectionAura) {
            context.strokeStyle = "rgba(0, 255, 255, 0.5)";
            context.lineWidth = 2;
            context.beginPath();
            context.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.protectionAuraRadius,
                0,
                2 * Math.PI
            );
            context.stroke();
        }

        // Laser charge indicator: draw a red square in the center if charging
        if (this.laserState === 'charging') {
            context.fillStyle = 'red';
            context.fillRect(
                this.direction == 1 ? this.x + this.width - 5 : this.x + 5,
                this.y + 8,
                5,
                5
            );
        }

        // Laser beam: draw a thick red line if shooting
        if (this.laserState === 'shooting') {
            context.strokeStyle = 'red';
            context.lineWidth = this.laserWidth;
            context.beginPath();

            // Draw the laser beam in the direction the turtle is facing
            if (this.direction === 1) {
                context.moveTo(this.x + this.width, this.y + this.height / 2);
                context.lineTo(this.x + this.width + this.laserLength, this.y + this.height / 2);
            } else {
                context.moveTo(this.x, this.y + this.height / 2);
                context.lineTo(this.x - this.laserLength, this.y + this.height / 2);
            }

            context.stroke();

            // draw a white line in the middle of the laser beam
            context.strokeStyle = 'white';
            context.lineWidth = this.laserWidth - 4;
            context.beginPath();

            if (this.direction === 1) {
                context.moveTo(this.x + this.width, this.y + this.height / 2);
                context.lineTo(this.x + this.width + this.laserLength, this.y + this.height / 2);
            } else {
                context.moveTo(this.x, this.y + this.height / 2);
                context.lineTo(this.x - this.laserLength, this.y + this.height / 2);
            }

            context.stroke();
        }
    }

    onDeath() {
        // Remove all tadpoles upon death
        this.removeAllTadpoles();
    }

    interactWith(other) {
        // Define interactions as needed
    }
}



// TurtleTadpoleEnemy.js

class TurtleTadpoleEnemy extends Enemy {
    constructor(x, y, direction) {
        super(x, y, 6, 6, 150); // Adjusted size and health
        this.speed = 0.5;
        this.direction = direction; // 1 for right, -1 for left

        // Animation setup
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.tadpole, "Run", this.animationSpeed);

        // Zig-Zag movement properties
        this.zigZagAmplitude = 40 + Math.random() * 40; // Amplitude of the zig-zag
        this.zigZagFrequency = 0.05 + Math.random() * 0.1; // Frequency of the zig-zag
        this.zigZagTimer = 0;

        // Target reference (player)
        this.target = null;
        this.targetsPlayer = true;
    }

    update(map, entities) {
        super.update(map, entities);

        if(this.dead) return;

        // Acquire target (player)
        if (!this.target) {
            // this.target = findPlayer(entities); // Assuming a function to find the player
        }

        // if offscreen, remove
        if (this.isOffMap(map)) {
            // this.dead = true;
            this.removeFromScene = true;
        }

        // Zig-Zag movement towards the target
        this.zigZagTimer += this.zigZagFrequency;
        const zigZagOffset = Math.sin(this.zigZagTimer) * this.zigZagAmplitude;

        // Calculate velocity towards the player with zig-zag
        if (this.target && this.targetsPlayer) {
            this.direction = this.target.x > this.x ? 1 : -1;
            this.sprite.direction = this.direction;

            const deltaX = this.target.x - this.x;
            const deltaY = this.target.y - this.y;

            // Normalize direction
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
            const normX = deltaX / distance;
            const normY = deltaY / distance;

            // Apply zig-zag offset perpendicular to the direction
            const perpendicularX = -normY;
            const perpendicularY = normX;

            this.velocity.x = (normX * this.speed) + (perpendicularX * (zigZagOffset / 100));
            this.velocity.y = normY * this.speed + (perpendicularY * (zigZagOffset / 100));
        }

        // Update sprite animation
        // this.sprite.setAnimation("Run");
    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

    interactWith(other) {
        // Define interactions, e.g., damage player on collision
        if (other instanceof Player) {
            this.target = other;
        }
    }
}

// Helper function to find the player in entities
function findPlayer(entities) {
    return entities.find(entity => entity instanceof Player) || null;
}
