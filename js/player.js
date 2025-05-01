// Define a set of player states for our FSM.
const PLAYER_STATES = {
    IDLE: "IDLE",
    RUNNING: "RUNNING",
    JUMPING: "JUMPING",
    FALLING: "FALLING",
    DASHING: "DASHING",
    WALL_SLIDING: "WALL_SLIDING",
    GLIDING: "GLIDING",
    FLYING: "FLYING",
    DEAD: "DEAD"
};

class Player extends Entity {
    constructor(x, y) {
        super(x, y, 8, 8);
        // Save the spawn position.
        this.spawnPosition = { x: x, y: y };

        // Animation and sprite.
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.Theo, "Run", this.animationSpeed);

        // Lives.
        this.maxLives = CONSTANTS.playerMaxLives;
        this.lives = this.maxLives;

        // Movement parameters.
        this.defaultSpeed = 0.666;
        this.speed = 1;
        this.friction = 0.94;
        this.xVelLowerThreshold = 0.3;

        // Gravity and jumping.
        this.gravity = 0.12;
        this.defaultGravity = 0.12;
        this.jumpReleaseMultiplier = 0.7;
        this.maxJumpHoldTime = 11;
        this.jumpHoldTimer = new Clock();
        this.jumpHoldTimer.add(this.maxJumpHoldTime + 6);
        this.hasCutJumpVelocity = false;
        this.canJump = true;
        this.jumpSpeed = 2.3;
        this.jumpGracePeriodFrames = 5;
        this.jumpGracePeriodTimer = new Clock();

        // Wall mechanics.
        this.canWallJump = false;
        this.wallJumpSpeed = 1.6;
        this.isWallJumping = false;
        this.wallSlideDownSpeed = 0.5;

        // Spike collision handling.
        this.framesAllowedTouchSpike = 2;
        this.framesTouchingSpike = 0;

        // Attack clock (if needed).
        this.attackClock = new Clock();

        // Invincibility.
        this.invincibilityDuration = 60;
        this.invincibilityTimer = new Clock();
        this.isInvincible = false;

        // Death.
        this.dead = false;
        this.framesCollindingWithEnemy = 0;
        this.allowedFramesCollidingWithEnemy = 4;

        // Dash parameters.
        this.canDash = true;
        this.dashSpeed = 3.5;
        this.dashDuration = 9;
        this.dashCooldown = 20;
        this.isDashing = false;
        this.dashTimer = new Clock();
        this.dashClock = new Clock();

        // Gliding.
        this.canGlide = true;
        this.glideFallSpeed = 0.2;

        // Ground tracking for respawning.
        this.lastGroundedPositions = [{ x: this.x, y: this.y }, { x: this.x, y: this.y }];

        // Flying mode.
        this.FLYING_MODE = false;

        // FSM state initialization.
        this.state = PLAYER_STATES.IDLE;
    }

    update(map, entities) {
        // Call the parent update.
        super.update(map, entities);
        this.constrainPosition(map);

        if (this.dead) return;

        this.handleSpikes(map);


        // Handle dash first (it overrides many controls).
        if (this.handleDash(entities)) {
            this.updateStateMachine();
            this.updateAnimation();
            return; // Skip the rest of the update while dashing.
        }

        if (!this.FLYING_MODE) {
            this.gravity = this.defaultGravity;
        }

        // Apply friction and adjust basic physics
        this.applyPhysics();

        this.handleJump(map);

        this.handleWallInteractions(map);

        this.handleMovement(map);

        this.handleGlide(map);


        if (this.FLYING_MODE) {
            this.handleFlying(map);
        }

        this.handleOffMap(map);

        this.handleInvincibility();


        // Update the finite state machine based on the current inputs and physics, and update the animation based solely on the FSM state.
        this.updateStateMachine();
        this.updateAnimation();

        
        // Reset wall jumping flag so it doesn't persist.
        this.isWallJumping = false;
    }

    // Applies friction and thresholds to the horizontal velocity.
    applyPhysics() {
        this.velocity.x *= this.friction;
        if (this.bottomHit && this.velocity.x < 0.5) this.velocity.x = 0;
        if (Math.abs(this.velocity.x) < this.xVelLowerThreshold) this.velocity.x = 0;
    }

    // Check collisions with spikes.
    handleSpikes(map) {
        if (map.pointIsCollidingWithSpikes(this.x, this.y) ||
            map.pointIsCollidingWithSpikes(this.x + this.width - 1, this.y) ||
            map.pointIsCollidingWithSpikes(this.x, this.y + this.height - 1) ||
            map.pointIsCollidingWithSpikes(this.x + this.width - 1, this.y + this.height - 1)) {
            this.framesTouchingSpike++;
        } else {
            this.framesTouchingSpike = 0;
        }
        if (this.framesTouchingSpike >= this.framesAllowedTouchSpike) {
            this.takeDamage();
        }
    }

    // Handles the dash mechanic.
    handleDash(entities) {
        if (this.canDash) {
            if (!this.isDashing && Inputs.dash && this.dashClock.getTime() > this.dashCooldown) {
                this.isDashing = true;
                this.dashTimer.restart();
                this.velocity.x = this.sprite.direction * this.dashSpeed;
                Loader.playSound("dash01.wav", 0.1);
            }
            if (this.isDashing) {
                // Override normal movement.
                this.velocity.y = 0;
                this.velocity.x = this.sprite.direction * this.dashSpeed;
                this.gravity = 0;
                // Create dash particles.
                for (let i = 0; i < 5; i++) {
                    let particle = new Particle(
                        this.x + this.width / 2 + Math.floor(Math.random() * 3) - 1,
                        this.y + this.height / 2 + Math.floor(Math.random() * 8) - 4,
                        2, 2, "rgba(255, 0, 0, 0.5)",
                        Math.floor(Math.random() * 10)
                    );
                    entities.push(particle);
                }
                if (this.dashTimer.getTime() > this.dashDuration) {
                    this.isDashing = false;
                    this.dashClock.restart(); // Start dash cooldown.
                    this.velocity.x = 0;
                }
                // Cancel dash if opposite directional input is received.
                if ((this.velocity.x > 0 && Inputs.left) || (this.velocity.x < 0 && Inputs.right)) {
                    this.isDashing = false;
                    this.dashClock.restart();
                    this.velocity.x = 0;
                }
                return true;
            }
        }
        return false;
    }

    // Handles the jumping logic.
    handleJump(map) {
        if (this.bottomHit) {
            this.jumpGracePeriodTimer.restart();
            this.lastGroundedPositions.push({ x: this.x, y: this.y });
            if (this.lastGroundedPositions.length > 8) {
                this.lastGroundedPositions.shift();
            }
        }
        if (!Inputs.jump) this.canJump = true;
        if ((this.bottomHit || this.jumpGracePeriodTimer.getTime() < this.jumpGracePeriodFrames) && Inputs.jump && this.canJump) {
            this.velocity.y = -this.jumpSpeed;
            this.hasCutJumpVelocity = false;
            this.jumpHoldTimer.restart();
            this.canJump = false;
            Loader.playSound("jump.wav", 0.1);
        }
        if (this.jumpHoldTimer.getTime() < this.maxJumpHoldTime && Inputs.jump) {
            this.velocity.y = -this.jumpSpeed;
            if (this.topHit) {
                this.hasCutJumpVelocity = true;
                this.jumpHoldTimer.add(10000);
            }
        } else if (!this.hasCutJumpVelocity && this.jumpHoldTimer.getTime() < this.maxJumpHoldTime) {
            this.jumpHoldTimer.add(10000);
            this.velocity.y *= this.jumpReleaseMultiplier;
            this.hasCutJumpVelocity = true;
        }
    }

    // Handles wall-related mechanics such as wall jumping and sliding.
    handleWallInteractions(map) {
        if (this.canWallJump) {
            if (!this.bottomHit && this.rightHit && Inputs.jump && this.canJump && !this.isWallJumping) {
                this.canJump = false;
                this.velocity.y = -this.jumpSpeed;
                this.velocity.x = -this.wallJumpSpeed;
                this.moveH(map, -1);
                this.sprite.direction = -1;
                Inputs.shoot = false;
                Loader.playSound("jump.wav", 0.1);
                this.isWallJumping = true;
            }
            if (!this.bottomHit && this.leftHit && Inputs.jump && this.canJump && !this.isWallJumping) {
                this.canJump = false;
                this.velocity.y = -this.jumpSpeed;
                this.velocity.x = this.wallJumpSpeed;
                this.moveH(map, 1);
                this.sprite.direction = 1;
                Inputs.shoot = false;
                Loader.playSound("jump.wav", 0.1);
                this.isWallJumping = true;
            }
        }
        // Wall sliding adjustments.
        if (!this.bottomHit && this.rightHit && Inputs.right) {
            if (this.velocity.y > 0) this.velocity.y -= this.gravity / 2;
            if (this.velocity.y > this.wallSlideDownSpeed) this.velocity.y = this.wallSlideDownSpeed;
            this.sprite.direction = 1;
        }
        if (!this.bottomHit && this.leftHit && Inputs.left) {
            if (this.velocity.y > 0) this.velocity.y -= this.gravity / 2;
            if (this.velocity.y > this.wallSlideDownSpeed) this.velocity.y = this.wallSlideDownSpeed;
            this.sprite.direction = -1;
        }
    }

    // Handles left/right movement based on inputs.
    handleMovement(map) {
        if (Inputs.left && Math.abs(this.velocity.x) < this.speed && this.velocity.x <= 0.5) {
            this.moveH(map, -this.speed);
            this.sprite.direction = -1;
        }
        if (Inputs.right && Math.abs(this.velocity.x) < this.speed && this.velocity.x >= -0.5) {
            this.moveH(map, this.speed);
            this.sprite.direction = 1;
        }
    }

    // Handles gliding mechanics.
    handleGlide(map) {
        if (this.canGlide && !this.bottomHit && Inputs.jump && !map.pointIsCollidingWithWall(this.x + this.width / 2, this.y + 2)) {
            if (this.velocity.y > 0) {
                this.velocity.y = this.glideFallSpeed;
            }
        }
    }

    // Handles flying mode movement if enabled.
    handleFlying(map) {
        this.gravity = 0;
        this.defaultGravity = 0;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.y += 1;
        if (Inputs.up) {
            this.moveV(map, -this.speed - 0.125);
        }
        if (Inputs.down) {
            this.moveV(map, this.speed + 0.25);
        }
    }

    // Handles when the player goes off the map.
    handleOffMap(map) {
        if (this.y > map.height * map.tileheight - 6) {
            if (this.lives > 0) {
                this.x = this.lastGroundedPositions[0].x;
                this.y = this.lastGroundedPositions[0].y;
            }
            this.takeDamage(10);
            currentScene.freezeFrame(60);
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    // Resets the invincibility state after its duration.
    handleInvincibility() {
        if (this.isInvincible && this.invincibilityTimer.getTime() > this.invincibilityDuration) {
            this.isInvincible = false;
        }
    }

    // Finite state machine: determine the current state based on physics and input.
    updateStateMachine() {
        if (this.dead) {
            this.state = PLAYER_STATES.DEAD;
        } else if (this.isDashing) {
            this.state = PLAYER_STATES.DASHING;
        } else if (this.FLYING_MODE) {
            this.state = PLAYER_STATES.FLYING;
        } else if (!this.bottomHit && ((this.rightHit && Inputs.right) || (this.leftHit && Inputs.left))) {
            this.state = PLAYER_STATES.WALL_SLIDING;
        } else if (this.canGlide && !this.bottomHit && Inputs.jump && this.velocity.y > 0 && this.velocity.y === this.glideFallSpeed) {
            this.state = PLAYER_STATES.GLIDING;
        } else if (!this.bottomHit && this.velocity.y < 0) {
            this.state = PLAYER_STATES.JUMPING;
        } else if (!this.bottomHit && this.velocity.y > 0) {
            this.state = PLAYER_STATES.FALLING;
        } else if (Inputs.left || Inputs.right) {
            this.state = PLAYER_STATES.RUNNING;
        } else {
            this.state = PLAYER_STATES.IDLE;

        }

    }

    // Updates the player animation solely based on the FSM state.
    updateAnimation() {
        switch (this.state) {
            case PLAYER_STATES.IDLE:
                this.sprite.setAnimation("Idle");
                break;
            case PLAYER_STATES.RUNNING:
                this.sprite.setAnimation("Run");
                break;
            case PLAYER_STATES.JUMPING:
                this.sprite.setAnimation("Jump");
                break;
            case PLAYER_STATES.FALLING:
                this.sprite.setAnimation("Fall");
                break;
            case PLAYER_STATES.DASHING:
                // Use the run animation or a dedicated dash animation if available.
                this.sprite.setAnimation("Run");
                break;
            case PLAYER_STATES.WALL_SLIDING:
                this.sprite.setAnimation("Wall Grab");
                break;
            case PLAYER_STATES.GLIDING:
                this.sprite.setAnimation("Feather Fall");
                break;
            case PLAYER_STATES.FLYING:
                this.sprite.setAnimation("Feather Fall");
                break;
            case PLAYER_STATES.DEAD:
                this.sprite.setAnimation("Idle");
                break;
        }
    }

    // Handle interactions with other entities.
    interactWith(other) {
        if (other instanceof Flag) {
            if (this.colliding(other)) {
                if (other.sprite.currentAnimation !== "IdleComplete") {
                    console.log("COLLIDING WITH FLAG");
                    Loader.playSound("powerup.wav", 0.1);
                }
                other.sprite.setAnimation("IdleComplete");
                this.spawnPosition.x = other.x;
                this.spawnPosition.y = other.y + 8;
            }
        }
        if (other instanceof LevelCompleteArea) {
            if (this.colliding(other)) {
                currentScene.completeScene();
            }
        }
        if (other.isEnemy || (other instanceof Collider && other.damagesPlayer)) {
            if (this.colliding(other) && !this.isInvincible && !this.dead) {
                this.framesCollindingWithEnemy++;
                if (this.framesCollindingWithEnemy < this.allowedFramesCollidingWithEnemy)
                    return;
                this.takeDamage();
            }
        }
    }

    // Applies damage to the player.
    takeDamage(shake) {
        if (this.isInvincible || this.dead) return;
        Loader.playSound("damage.wav", 0.3);
        if (this.lives > 0) {
            shakeScreen(shake || 10);
            this.lives--;
            this.isInvincible = true;
            this.invincibilityTimer.restart();
        } else if (this.lives <= 0) {
            currentScene.freezeFrame(60);
            context.view.lockedToPlayer = false;
            this.velocity.x = -this.sprite.direction * 3;
            this.velocity.y = -3;
            this.dead = true;
            this.collidesWithMap = false;
            this.sprite.setAnimation("Idle");
            this.sprite.paused = true;
            setFrameTimeout(() => {
                if (currentScene.restart)
                    currentScene.restart(this.spawnPosition.x, this.spawnPosition.y);
            }, 240);
        }
    }

    // Resets the player's position.
    resetPosition() {
        this.x = this.spawnPosition.x;
        this.y = this.spawnPosition.y;
    }

    // Draw the player sprite, taking invincibility flashing into account.
    draw(context) {
        if (this.dead) {
            this.sprite.tint = "rgba(255, 0, 0, 0.5)";
        } else {
            this.sprite.tint = null;
        }
        if (this.isInvincible) {
            if (APP_ELAPSED_FRAMES % 20 < 10) {
                this.sprite.draw(context, this.x, this.y);
            }
        } else {
            this.sprite.draw(context, this.x, this.y);
        }
    }
}
