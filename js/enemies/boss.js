class Boss extends Enemy {
    constructor(x, y, w, h, health = 1000) {
        super(x, y, w, h, health);
        this.totalStages = 3;
        this.currentStage = 0;

        this.spawnPosition = { x: x, y: y };
        // this.x = WIDTH/2;
        // this.y = 0;

        this.isEnraged = false;

        // Health thresholds for stage transitions
        this.stageThresholds = [
            { health: this.maxHealth / 2, stage: 2 },
            { health: this.maxHealth / 4, stage: 3 }
        ];




        this.isSpeaking = false;
    }




   

    advanceStage() {
        console.log(`Advancing to stage ${this.currentStage}`);
        this.setupStage();
    }

    setupStage() {
        // Implement in subclasses
        throw new Error("Method 'setupStage' must be implemented.");
    }

    update(map, entities) {

        // If riddles are disabled, handle boss logic without riddles:
        // Initial stage setup if not done
        if (this.currentStage === 0) {
            // No initial riddle, just proceed to stage 1
            this.currentStage = 1;
            this.advanceStage();
        }

        // Check for stage transitions based on health
        for (let threshold of this.stageThresholds) {
            if (this.health <= threshold.health && this.currentStage < threshold.stage) {
                // No riddles, just advance stage
                this.currentStage = threshold.stage;
                this.advanceStage(false);
            }
        }

        if(this.dead) {
            super.update(map, entities);
            return;
        }

        this.sharedStageBehavior(map, entities);

        switch (this.currentStage) {
            case 1:
                this.stage1Behavior(map, entities);
                break;
            case 2:
                this.stage2Behavior(map, entities);
                break;
            case 3:
                this.stage3Behavior(map, entities);
                break;
            default:
                break;
        }


        super.update(map, entities);



    }

    stage1Behavior(map, entities) {
        this.velocity.x = this.speed * this.direction;
        this.sprite.direction = this.direction;
        this.sprite.setAnimation("Run");
        if (this.rightHit || this.leftHit) {
            this.direction *= -1;
        }
    }

    stage2Behavior(map, entities) {
        // Implement in subclass
    }

    stage3Behavior(map, entities) {
        // Implement in subclass
    }

    sharedStageBehavior(map, entities) {
        // Shared behavior
    }

    spawnRedParticle(entities) {
        const x = this.x + Math.random() * this.width;
        const y = this.y + Math.random() * this.height;
        const particle = new Particle(x, y, 2, 2, "rgba(255, 0, 0, 0.5)", 20);
        entities.push(particle);
    }
}





