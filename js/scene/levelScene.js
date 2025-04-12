class LevelScene extends Scene {
    constructor(levelName, startMusic = true) {
        super();

        this.frameTimer = new Clock();

        this.levelName = levelName;
        this.map = Loader.levels[levelName];
        this.entities = [];
        this.player = null;
        // this.playerLives = playerLives == undefined ? 3 : playerLives;
        this.loadEntities();
        
        context.view.lockedToPlayer = true;

        this.frozen = false;




        this.playerLivesSprite = new AnimatedSprite(Loader.spriteSheets.Theo, "Idle", 30);
        this.playerLivesSprite.paused = false;
        this.playerLivesSprite.tint = "rgba(30, 30, 30, 0.1)";

        // Typewriter effect properties
        this.textDisplayIndex = 0;            // Current character index to display
        this.textDisplaySpeed = 1;            // Frames per character
        this.textDisplayTimer = 0;            // Timer to track frames
        this.isTextFullyDisplayed = false;    // Flag to indicate full text display

        this.sceneComplete = false;

        if(startMusic)
            Loader.playMusic(CONSTANTS.level_info[levelName].music.name, CONSTANTS.level_info[levelName].music.volume, true);

        // this.isBossLevel = this.entities.filter(entity => entity instanceof Boss).length > 0; 

        // Pause menu properties
        this.isPaused = false;
        this.pauseMenuOptions = ["Restart", "Return to Menu"];
        this.pauseMenuSelectedIndex = 0;

        // For detecting pause input toggle
        this.previousPauseInput = false;
    }

    loadEntities() {
        if(!this.map) return;

        // Initialize player
        if (!this.player) {
            this.player = new Player(this.map.playerSpawn.x, this.map.playerSpawn.y);
            this.entities.push(this.player);
        }

        // Initialize enemies based on the map's enemies
        for (let enemyData of this.map.enemies) {
            let enemy;
            // switch (enemyData.name) {
            //     case 'SentryEnemy':
            //         enemy = new SentryEnemy(enemyData.x, enemyData.y);
            //         break;
  
            enemy = eval(`new ${enemyData.name}(${enemyData.x}, ${enemyData.y}, ${enemyData.direction || 1})`);

            if (enemy) {
                this.entities.push(enemy);
            }
        }
    }




    startDialogue(text) {
        this.isTextActive = true;
        this.currentText = text;

        // Initialize typewriter effect properties
        this.textDisplayIndex = 0;
        this.textDisplayTimer = 0;
        this.isTextFullyDisplayed = false;
    }


    // hitFlagToWin() {
    //     let freezeTime = 120;
    //     this.freezeFrame(freezeTime);
    //     if(this.player) {
    //         this.player.sprite.setAnimation("Fall");
    //     }
    //     setFrameTimeout(() => {
    //         currentScene = new WorldMapScene();
    //         currentScene.completeLevel(this.levelName);
    //     }, freezeTime);
    // }

    update() {
        // Check for pause input toggle
        if (!this.isTextActive) {
            if (Inputs.pause && !this.previousPauseInput) {
                this.isPaused = !this.isPaused;
            }
            this.previousPauseInput = Inputs.pause;
        }

        if (this.isPaused) {
            if (this.delayClock === undefined) {
                this.delayClock = new Clock();
            }

            if (this.delayClock.getTime() > 10) {
                if (Inputs.up) {
                    this.pauseMenuSelectedIndex = (this.pauseMenuSelectedIndex - 1 + this.pauseMenuOptions.length) % this.pauseMenuOptions.length;
                    this.delayClock.restart();
                }
                if (Inputs.down) {
                    this.pauseMenuSelectedIndex = (this.pauseMenuSelectedIndex + 1) % this.pauseMenuOptions.length;
                    this.delayClock.restart();
                }
                if (Inputs.enter) {
                    if (this.pauseMenuSelectedIndex === 0) {
                        // Restart
                        this.restart();
                    } else if (this.pauseMenuSelectedIndex === 1) {
                        // Return to menu
                        currentScene = new MenuScene();
                    }
                    this.delayClock.restart();
                }
            }

            return; // Don't update game logic while paused
        }

        if (this.isTextActive) {
            if (!this.isTextFullyDisplayed) {
                this.textDisplayTimer++;
                if (this.textDisplayTimer >= this.textDisplaySpeed) {
                    this.textDisplayIndex++;
                    this.textDisplayTimer = 0;

                    if (this.textDisplayIndex >= this.currentText.length) {
                        this.textDisplayIndex = this.currentText.length;
                        this.isTextFullyDisplayed = true;
                    }
                }
            }

            if((Inputs.enter || Inputs.shoot || Inputs.jump || Inputs.dash || Inputs.left || Inputs.right || Inputs.up || Inputs.down) && this.isTextFullyDisplayed && this.isTextActive) {
                this.isTextActive = false;
            }   
            return;
        }

        if(this.frozen) return;


        // Update all entities
        for (let entity of this.entities) {
            entity.update(this.map, this.entities);
        }

        // Handle interactions
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i].interactWith === undefined)
                continue;
            for (let j = 0; j < this.entities.length; j++) {
                if (this.entities[j] instanceof Particle)
                    continue;
                if (i !== j) { // Prevent self-interaction
                    this.entities[i].interactWith(this.entities[j]);
                }
            }
        }

        // Remove dead entities
        this.entities = this.entities.filter(entity => {
            if (entity.removeFromScene) {
                return false; // Remove dead entity
            }
            return true; // Keep alive entity
        });


        
        // if(this.map.pointIsCollidingWithType(this.player.x, this.player.y, "checkpoint")) {
        //     this.hitFlagToWin();
        // }
    }

    getScreenPosition(gameX, gameY) {
        // Get the position relative to the view
        const relativeX = gameX - context.view.x;
        const relativeY = gameY - context.view.y;

        return { x: relativeX, y: relativeY };
    }

    resetPlayerPosition() {
        if (this.player) {
            this.player.x = this.map.playerSpawn.x;
            this.player.y = this.map.playerSpawn.y;
            this.player.velocity = { x: 0, y: 0 };
                
            this.player.sprite.paused = false;
            this.player.dead = false;
            this.player.collidesWithMap = true;

        }
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    draw(context) {
        // Draw the map
        this.map.draw(context);

        // Draw all entities
        for (let entity of this.entities) {
            entity.draw(context, this.map);
        }

        // If text is active, draw the text box
        if (this.isTextActive) {
            this.drawTextBox(context);
        }

        // If paused, dim the screen and draw pause menu
        if (this.isPaused) {
            context.fillStyle = "rgba(0,0,0,0.5)";
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
            this.drawPauseMenu(context);
        }


        // Draw player lives
        if (this.player) {
            const livesX = 2; // Adjust as needed
            const livesY = 2; // Adjust as needed

            for (let i = 0; i < this.player.lives; i++) {
                this.playerLivesSprite.draw(context, livesX + i * 10 + context.view.x, livesY + context.view.y);
            }
        }



        // // -------------------------
        // // TIMER IMPLEMENTATION START
        // // -------------------------
        // // We assume APP_ELAPSED_FRAMES is a global variable that increments each frame (60fps)
        // const timerWidth = 24;
        // const timerHeight = 16;
        // // Draw a small black rectangle at the top-left corner; some alpha
        // context.fillStyle = "rgba(0, 0, 0, 0.5)";
        // context.fillRect(0, 0, timerWidth, timerHeight);

        // // Calculate elapsed seconds
        // const elapsedSeconds = Math.floor((this.frameTimer.getTime()) / 60);

        // // Draw the timer text centered in the 24x16 rectangle
        // // Coordinates roughly center: x=12 (half of 24), y=8 (half of 16)
        // this.drawBitmapText(context, elapsedSeconds.toString(), 12, 6, 'center', '#fff');
        // // -------------------------
        // // TIMER IMPLEMENTATION END
        // // -------------------------
    }





    restart() {
        console.log("RESTARTING LEVEL");
        currentScene = new LevelScene(this.levelName, false);
    }

    freezeFrame(frames) {
        setFrameTimeout(() => {
            this.frozen = false;
        }, frames);
        this.frozen = true;
    }

    drawPauseMenu(context) {
        // Calculate the needed width and height based on text
        let maxWidth = 0;
        let lineHeight = this.charHeight + 4;
        let padding = 10;

        for (let option of this.pauseMenuOptions) {
            const w = this.measureBitmapTextWidth(option);
            if (w > maxWidth) {
                maxWidth = w;
            }
        }

        const menuWidth = maxWidth + padding * 2;
        const menuHeight = (this.pauseMenuOptions.length * lineHeight) + padding * 2;

        const x = (context.canvas.width - menuWidth) / 2;
        const y = (context.canvas.height - menuHeight) / 2;

        context.fillStyle = "rgba(0,0,0,0.8)";
        context.fillRect(x, y, menuWidth, menuHeight);
        context.strokeStyle = "#ffffff";
        context.lineWidth = 2;
        context.strokeRect(x, y, menuWidth, menuHeight);

        let textY = y + padding;
        for (let i = 0; i < this.pauseMenuOptions.length; i++) {
            let option = this.pauseMenuOptions[i];
            let color = i === this.pauseMenuSelectedIndex ? "#ff0" : "#fff";
            this.drawBitmapText(context, option, x + menuWidth / 2, textY, 'center', color);
            textY += lineHeight;
        }
    }

    drawTextBox(context) {

        if (this.currentText) {
            

            // Determine the size of the text box
            const boxWidth = 200; // example width
            const padding = 10;

            // Get the portion of the text to display
            const fullText = this.currentText;
            const textToDisplay = fullText.slice(0, this.textDisplayIndex);
            const lines = this.wrapText(textToDisplay, boxWidth - 2 * padding);

            const lineHeight = this.charHeight + 1; // Adjust as needed
            const textHeight = lines.length * lineHeight;


            let totalHeight = textHeight + 2 * padding;


            // // Calculate box position
            // let boxX = bossPosition.x - boxWidth / 2;
            // let boxY = bossPosition.y - totalHeight - 10; // 10 pixels above the boss
            let boxX = context.canvas.width / 2 - boxWidth / 2;
            let boxY = context.canvas.height - totalHeight - 10; // 10 pixels above the bottom of the screen

            // Adjust position if box goes off-screen
            if (boxX < 0) {
                boxX = 0;
            } else if (boxX + boxWidth > context.canvas.width) {
                boxX = context.canvas.width - boxWidth;
            }
            if (boxY < 0) {
                boxY = 0;
            } else if (boxY + totalHeight > context.canvas.height) {
                boxY = context.canvas.height - totalHeight;
            }

            // Draw the box
            context.fillStyle = "rgba(255, 255, 255, 0.6)";
            context.strokeStyle = "black";
            context.lineWidth = 4;

            // Draw filled rectangle
            context.fillRect(boxX, boxY, boxWidth, totalHeight);

            // Draw border
            context.strokeRect(boxX, boxY, boxWidth, totalHeight);

            // Draw the text
            let textY = boxY + padding;
            for (let line of lines) {
                this.drawBitmapText(context, line, boxX + boxWidth / 2, textY, 'center');
                textY += lineHeight;
            }

        }
    }
}


