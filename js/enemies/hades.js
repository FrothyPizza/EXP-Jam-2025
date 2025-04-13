
class HadesEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        // super(x, y, 32, 24, 7200);
        super(x, y, 32, 24, 7200);


        this.direction = 1;

        this.velocity.x = 0;

        this.gravity = 0;
        this.defaultGravity = 0;
        this.collidesWithMap = false;

        // Animation setup
        this.animationSpeed = 8;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.Hades, "Idle", this.animationSpeed);
        this.sprite.direction = this.direction;



        this.stageThresholds = [
            { health: this.maxHealth * 2 / 3, stage: 2 },
            { health: this.maxHealth * 1 / 3, stage: 3 },
            { health: 1, stage: 4 }
        ];


        this.moving = true;
        this.movementFrameCounter = 0;



        this.hasReachedEnd = false;

    }

    update(map, entities) {
        super.update(map, entities);

        this.sprite.direction = this.direction;

        
    }

    stage1Behavior(map, entities) {
        this.health -= 1; // lose 1 health every frame

        
    }




    stage2Behavior(map, entities) {
        this.stage1Behavior(map, entities);
    }

    stage3Behavior(map, entities) {
        this.stage1Behavior(map, entities);
    }



    stage4Behavior(map, entities) {
        
    


    }





      


    setupStage() {
        switch (this.currentStage) {
            case 1:
                console.log("Stage 1");
                Loader.playSound("EvilLaugh.wav", 0.3);
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


    }
}






