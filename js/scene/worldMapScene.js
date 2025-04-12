// worldMapScene.js
class WorldMapScene extends Scene {
    constructor() {
        super();
        this.backgroundSprite = new AnimatedSprite(Loader.spriteSheets.world_map, "Idle", 20);
        this.playerSprite = new AnimatedSprite(Loader.spriteSheets.samurai, "Idle", 10);

        context.view.x = 0;
        context.view.y = 0;

        // Graph of level locations with directional connections
        this.levelGraph = {
            'level_hoopoe': {
                x: 24,
                y: 148,
                connections: {
                    'right': 'level_7',
                    'up': 'level_run_2',
                },
                unlocked: false,
                completed: false,
            },
            'level_7': {
                x: 122,
                y: 152,
                connections: {
                    'left': 'level_hoopoe',
                    'right': 'level_run_1'
                },
                unlocked: false,
                completed: false,
            },
            'level_1': {
                x: 72,
                y: 56,
                connections: {
                    'down': 'level_run_2',
                    // 'right': 'level_5',

                },
                unlocked: false,
                completed: false,
            },
            'level_5': {
                x: 160,
                y: 98,
                connections: {
                    'down': 'level_run_1',
                    'right': 'level_run_1',
                    'up': 'level_corgi',
                    'left': 'level_run_2'
                },
                unlocked: false,
                completed: false,
            },
            'level_corgi': {
                x: 158,
                y: 48,
                connections: {
                    'down': 'level_5'
                },
                unlocked: false,
                completed: false,
            },
            'level_run_1': {
                x: 202,
                y: 140,
                connections: {
                    'left': 'level_7',
                    'up': 'level_5'
                },
                unlocked: false,
                completed: false,
            },
            'level_run_2': {
                x: 70,
                y: 96,
                connections: {
                    'down': 'level_hoopoe',
                    'up': 'level_1',
                    'right': 'level_5'
                },
                unlocked: false,
                completed: false,
            },
        };

        // set all of them to unlocked and completed for testing
        for (let level in this.levelGraph) {
            this.levelGraph[level].unlocked = true;
            this.levelGraph[level].completed = true;
        }


        this.currentLevel = 'level_run_2'; // Starting level
        this.delayClock = new Clock();

        this.isTransitioning = false;     // Flag to track if a transition is occurring
        this.transitionProgress = 0;      // Counter for the transition animation


        // Loader.playMusic("main_theme.mp3", 0.8);
    }

    update() {
        if (this.isTransitioning) {
            // Update transition animation
            this.transitionProgress++;
            Loader.decreaseCurrentMusicVolume(0.02);

            if (this.transitionProgress >= 60) {
                // After animation completes, load the selected level
                loadScene(this.currentLevel);
            }
        } else {
            if (this.delayClock.getTime() > 10) {
                if (Inputs.left) {
                    this.moveToConnectedLevel('left');
                } else if (Inputs.right) {
                    this.moveToConnectedLevel('right');
                } else if (Inputs.up) {
                    this.moveToConnectedLevel('up');
                } else if (Inputs.down) {
                    this.moveToConnectedLevel('down');
                } else if (Inputs.enter) {
                    // Start the transition animation
                    this.isTransitioning = true;
                    this.transitionProgress = 0;
                    // Loader.playSound('level_enter.wav', 0.2);
                }

                if (Inputs.left || Inputs.right || Inputs.up || Inputs.down || Inputs.enter) {
                    this.delayClock.restart();
                }
            }
        }
    }

    moveToConnectedLevel(direction) {
        const currentLevelData = this.levelGraph[this.currentLevel];
        const nextLevel = currentLevelData.connections[direction];

        if (nextLevel && this.levelGraph[nextLevel].unlocked) {
            this.currentLevel = nextLevel;

            if(direction === "left") {
                this.playerSprite.direction = -1;
            }
            else if(direction === "right") {
                this.playerSprite.direction = 1;
            }
        }
    }

    completeLevel(levelName) {
        // loop over all levels connected to the completed level
        if(this.levelGraph[levelName]) {
            this.levelGraph[levelName].completed = true;
            completeLevelLocalStorage(levelName);
            for (let level in this.levelGraph[levelName].connections) {
                this.levelGraph[this.levelGraph[levelName].connections[level]].unlocked = true;
                unlockLevelLocalStorage(this.levelGraph[levelName].connections[level]);
            }
        }

        
    }

    draw(context) {
        // Draw the world map background and levels
        this.backgroundSprite.draw(context, 0, 0);

        // Draw level nodes
        context.strokeStyle = '#ffffff';
        context.fillStyle = '#ffffff';

        for (let levelName in this.levelGraph) {
            const level = this.levelGraph[levelName];
            // Draw node
            if(level.unlocked) {
                let fade = APP_ELAPSED_FRAMES % 60;
                context.fillStyle = `rgba(255, 0, 0, ${0.5 + Math.sin(fade / 60 * Math.PI) * 0.5})`;
            } else {
                context.fillStyle = '#666666';
            }
            if(level.completed) {
                context.fillStyle = '#00ff00';
            }
            context.beginPath();
            context.arc(level.x, level.y, 5, 0, Math.PI * 2);
            context.fill();

            // Highlight current level
            // if (levelName === this.currentLevel) {
            //     context.strokeStyle = '#ffff00';
            //     context.beginPath();
            //     context.arc(level.x, level.y, 8, 0, Math.PI * 2);
            //     context.stroke();
            //     context.strokeStyle = '#ffffff';
            // }
        }

        // Draw player sprite at current level
        const playerX = this.levelGraph[this.currentLevel].x;
        const playerY = this.levelGraph[this.currentLevel].y;
        this.playerSprite.draw(context, playerX - 4, playerY - 6);

        // Draw transition animation if transitioning
        if (this.isTransitioning) {
            // Fade to black effect
            context.fillStyle = `rgba(0, 0, 0, ${this.transitionProgress / 60})`;
            context.fillRect(0, 0, WIDTH, HEIGHT);
        }
    }
}