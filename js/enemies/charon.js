
class CharonEnemy extends Boss {
    constructor(x, y, entities, options = {}) {
        super(x, y, 32, 24, 7200);

        this.speed = 1;
        this.direction = 1;

        this.velocity.x = 0;

        this.gravity = 0;
        this.defaultGravity = 0;
        this.collidesWithMap = false;

        // Animation setup
        this.animationSpeed = 8;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.Charon, "Idle", this.animationSpeed);
        this.sprite.direction = this.direction;

    }

    update(map, entities) {
        super.update(map, entities);

        
        let { x, y } = this.getPositionFig8(APP_ELAPSED_FRAMES/100);
        this.x = x;
        this.y = y;
    }


    getPositionFig8(t) {
        // Define the center of the figure eight.
        const centerX = 240 / 2 - this.width/2; // 120 pixels: center horizontally.
        const centerY = 30;      // Adjust this to place the figure eight near the top.
      
        // Amplitude values determine the extent of the movement.
        const amplitudeX = 80;  // Adjust how far the boss moves left/right.
        const amplitudeY = 20;   // Adjust how far the boss moves up/down.
      
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
                
                break;
            case 2:
                
                break;
            case 3:
                
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