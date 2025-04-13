class CharonEnemy extends Boss {
  constructor(x, y, entities, options = {}) {
    // super(x, y, 32, 24, 7200);
    super(x, y, 32, 24, 7200);

    this.speed = 1;
    this.direction = 1;

    this.velocity.x = 0;

    this.gravity = 0;
    this.defaultGravity = 0;
    this.collidesWithMap = false;

    // Animation setup
    this.animationSpeed = 8;
    this.sprite = new AnimatedSprite(
      Loader.spriteSheets.Charon,
      "Idle",
      this.animationSpeed
    );
    this.sprite.direction = this.direction;

    this.waterfallBackgroundSprite = new AnimatedSprite(
      Loader.spriteSheets.waterfall_background,
      "Idle",
      this.animationSpeed
    );
    this.waterfallBackgroundSprite.x = 0;
    this.waterfallBackgroundSprite.y = 0;
    setFrameTimeout(() => {
      currentScene.precedentSprites.push(this.waterfallBackgroundSprite);
    }, 2);

    this.stageThresholds = [
      { health: (this.maxHealth * 2) / 3, stage: 2 },
      { health: (this.maxHealth * 1) / 3, stage: 3 },
      { health: 1, stage: 4 },
    ];

    this.pauseMovingTimer = new Clock();
    this.timeToPauseMoving = 240;

    this.moving = true;
    this.movementFrameCounter = 0;

    this.enemiesToSpawn = 3;

    this.hasReachedEnd = false;
  }

  update(map, entities) {
    super.update(map, entities);

    this.sprite.direction = this.direction;

    console.log(this.health);
  }

  stage1Behavior(map, entities) {
    this.health -= 1; // lose 1 health every frame

    if (this.pauseMovingTimer.getTime() > this.timeToPauseMoving) {
      this.pauseMovingTimer.restart();

      this.moving = false;
      this.sprite.setAnimation("Swing");
      this.enemiesToSpawn = 3;
      if (this.currentStage === 3) {
        this.enemiesToSpawn = 3;
      }

      // choose random 0 or 1
      let random = Math.floor(Math.random() * 2);
      if (random === 0) {
        this.enemiesToSpawn = 6;
        if (this.waterfallEnemy) this.waterfallEnemy.disabled = true;
      }

      this.sprite.onAnimationComplete = () => {
        this.enemiesToSpawn--;

        if (random === 0) {
          this.spawnRotatingSpiritEnemy(entities);
        } else {
          currentScene.addEntity(
            new SpiritWalkerEnemy(
              this.x + this.width / 2,
              this.y + this.height / 2,
              entities,
              20 * 60
            )
          );
          Loader.playSound("ghost summon 2.wav", 0.2);
        }

        this.pauseMovingTimer.restart();

        if (this.enemiesToSpawn <= 0) {
          this.moving = true;
          this.sprite.setAnimation("Idle");
          this.sprite.onAnimationComplete = null;
        }
      };
    }
    if (this.moving) {
      let { x, y } = this.getPositionFig8(
        (this.movementFrameCounter / 100) * this.speed
      );
      this.direction = this.x < x ? 1 : -1;
      this.x = x;
      this.y = y;

      this.movementFrameCounter++;

      if (this.waterfallEnemy) {
        this.waterfallEnemy.disabled = false;
        this.waterfallEnemy.x =
          this.x + this.width / 2 - this.waterfallEnemy.width / 2;
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
    Loader.playSound("ghost summon 2.wav", 0.2);

    let count = 1;
    if (this.currentStage === 3) {
      count = 3;
    }

    for (let i = 0; i < count; i++) {
      let player = currentScene.player;
      let playerX = player.x + player.width / 2;
      let playerY = player.y + player.height / 2;
      let angle;
      if (i == 0) angle = Math.atan2(playerY - this.y, playerX - this.x);
      if (i == 1)
        angle = Math.atan2(playerY - this.y, playerX - this.x) + Math.PI / 8;
      if (i == 2)
        angle = Math.atan2(playerY - this.y, playerX - this.x) - Math.PI / 8;
      let spawnX = this.x + Math.cos(angle) * 20;
      let spawnY = this.y + Math.sin(angle) * 20;
      let enemy = new RotatingSpiritEnemy(spawnX, spawnY);
      enemy.direction = this.direction;
      // enemy should move towards the player
      enemy.velocity.x = Math.cos(angle) * enemy.speed;
      enemy.velocity.y = Math.sin(angle) * enemy.speed;

      currentScene.addEntity(enemy);
    }
  }

  stage4Behavior(map, entities) {
    let target = { x: 16, y: -4 };
    let distance = Math.sqrt(
      Math.pow(target.x - this.x, 2) + Math.pow(target.y - this.y, 2)
    );

    if (!this.hasReachedEnd) {
      if (distance < 2) {
        this.hasReachedEnd = true;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.direction = -1;
        this.sprite.direction = this.direction;

        currentScene.startDialogue(
          "Very well, you are strong of will. Even so I must take a toll..."
        );

        setFrameTimeout(() => {
          this.sprite.setAnimation("Defeated");
          this.velocity.x = 0;
          this.velocity.y = 0;
          this.direction = -1;

          Loader.playSound("unicyclist_death.wav", 0.5);
          CONSTANTS.playerMaxLives = 2;
          currentScene.player.maxLives = 2;
          setFrameTimeout(() => {
            currentScene.player.lives = 2;
          }, 20);

          this.sprite.onAnimationComplete = () => {
            currentScene.startDialogue(
              "Your price, your life. Easy to kill, harder to move. Dash no longer, go and find her..."
            );
            this.sprite.setAnimation("Idle");
            this.sprite.onAnimationComplete = null;

            setFrameTimeout(() => {
              currentScene.startFade(60, 120);
              setFrameTimeout(() => {
                loadScene("underworld_level");
              }, 120);
            }, 60);
          };
        }, 60);
      } else {
        // glide towards top of screen
        let angle = Math.atan2(target.y - this.y, target.x - this.x);
        this.velocity.x = Math.cos(angle) * this.speed;
        this.velocity.y = Math.sin(angle) * this.speed;

        // if distance to target is less than 2, stop moving
      }
    }
  }

  getPositionFig8(t) {
    // Define the center of the figure eight.
    const centerX = 240 / 2 - this.width / 2; // 120 pixels: center horizontally.
    const centerY = 30; // Adjust this to place the figure eight near the top.

    // Amplitude values determine the extent of the movement.
    const amplitudeX = 70; // Adjust how far the boss moves left/right.
    const amplitudeY = 20; // Adjust how far the boss moves up/down.

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
        currentScene.startDialogue(
          "Stop boy, do you really think you may merely pass into the world of the dead without a toll?"
        );
        console.log("Stage 1");
        Loader.playSound("EvilLaugh.wav", 0.3);
        break;
      case 2:
        console.log("Stage 2");
        Loader.playSound("EvilLaugh.wav", 0.2);
        this.waterfallEnemy = new WaterfallEnemy(
          this.x,
          this.y,
          currentScene.entities
        );
        currentScene.addEntity(this.waterfallEnemy);
        break;
      case 3:
        console.log("Stage 3");
        Loader.playSound("EvilLaugh.wav", 0.3);

        break;

      case 4:
        console.log("Stage 4");

        Loader.playSound("EvilLaugh.wav", 0.5);
        Loader.setCurrentMusicVolume(0);
        this.waterfallEnemy.disabled = true;
        // remove all enemies from the scene
        currentScene.entities.forEach((entity) => {
          if (entity instanceof Enemy && !(entity instanceof CharonEnemy)) {
            entity.removeFromScene = true;
          }
        });
        break;
      default:
        break;
    }
  }

  draw(context) {
    super.draw(context);
    this.sprite.draw(context, this.x, this.y);

    // given the height of the map is 128, and the starting y is 16, move the waterfall background sprite down as the boss health decreases
    let waterfallY = ((this.maxHealth - this.health) / this.maxHealth) * 128;
    this.waterfallBackgroundSprite.y = waterfallY + 16;
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
    this.sprite = new AnimatedSprite(
      Loader.spriteSheets.spirit_walker,
      "Rotate",
      this.animationSpeed
    );
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
    this.sprite = new AnimatedSprite(
      Loader.spriteSheets.waterfall,
      "Idle",
      this.animationSpeed
    );

    this.collidesWithMap = false;
    this.gravity = 0;
    this.defaultGravity = 0;

    this.disabled = false;
  }

  update(map, entities) {
    super.update(map, entities);

    this.sprite.setAnimation("Idle");

    if (this.disabled) {
      this.x = 10000;
    }
  }

  draw(context) {
    super.draw(context);
    this.sprite.draw(context, this.x, this.y);
  }
}
