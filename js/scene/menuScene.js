// note: levels: ['level_corgi', 'level_1', 'level_5', 'level_corgi'],


// MenuScene.js
class MenuScene extends Scene {
    constructor() {
        super();

        // this.backgroundSprite = new Sprite(Loader.images['EchoesOfTheRiddleLords.png'], WIDTH, HEIGHT);

        this.menuOptions = ['Story Mode', 'Level Select'];
        this.options = this.menuOptions;
        this.levelSelectOptions = CONSTANTS.levels;

        this.selectedOption = 0;
        // For Level Select submenu
        this.inLevelSelect = false;
        this.levelOptions = CONSTANTS.levels;
        this.selectedLevel = 0;


        this.delayClock = new Clock();
    }

    update() {

        // console.log('menuScene update()');

        // // loop through all members of Input object and if any are true, exit the start menu
        // for (let key in Inputs) {
        //     if (Inputs[key]) {
        //         currentScene = new WorldMapScene();
        //     }
        // }

        // return;
        // Handle inputs
        if(this.delayClock.getTime() > 10) {
            if (Inputs.up || Inputs.left) {
                if (this.inLevelSelect) {
                    this.selectedLevel = (this.selectedLevel - 1 + this.levelOptions.length) % this.levelOptions.length;
                } else {
                    this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
                }
            } else if (Inputs.down || Inputs.right) {
                if (this.inLevelSelect) {
                    this.selectedLevel = (this.selectedLevel + 1) % this.levelOptions.length;
                } else {
                    this.selectedOption = (this.selectedOption + 1) % this.options.length;
                }
            } else if (Inputs.enter) {
                if (this.inLevelSelect) {
                    // Start the selected level
                    gameMode = 'levelselect';
                    loadScene(this.levelOptions[this.selectedLevel]);
                } else {
                    if (this.selectedOption === 0) {
                        // Quick Play
                        gameMode = 'quickplay';
                        level = 0;
                        loadScene(CONSTANTS.levels[level]);
                    } else if (this.selectedOption === 1) {
                        // Level Select
                        this.inLevelSelect = true;
                    }
                }
            } else if (Inputs.back) {
                if (this.inLevelSelect) {
                    this.inLevelSelect = false;
                }
            }

            if(Inputs.up || Inputs.down || Inputs.shoot || Inputs.enter || Inputs.back || Inputs.left || Inputs.right) {
                this.delayClock.restart();
            }
        }
    }

    draw(context) {
        // Draw the menu
        context.fillStyle = '#151515';
        context.fillRect(0, 0, WIDTH, HEIGHT);


        // this.backgroundSprite.draw(context, 0, 0);


        // Draw the title
        // this.drawBitmapText(context, 'Echoes of the Riddle Lords', WIDTH / 2, 20, 'center', 'white');

        // Draw the options
        
        let y = 70;
        context.fillStyle = 'rgba(0, 0, 0)';
        context.fillRect(WIDTH / 2 - 28, y - 6, 60, 50);
        context.fillStyle = 'rgba(30, 30, 30)';
        context.fillRect(WIDTH / 2 - 30, y - 8, 60, 50);
        for (let i = 0; i < this.options.length; i++) {
            let option = this.options[i];
            if (this.inLevelSelect && i === 1) {
                option = this.levelOptions[this.selectedLevel];
            }
            let color = this.selectedOption === i ? 'white' : '';
            this.drawBitmapText(context, option, WIDTH / 2, y, 'center', 'gray', color);
            y += 20;
        }

        
    }

    handleInput(e) {
        // Inputs are handled in update() method
    }
}
