

// Enemy that runs back and forth from edge to edge
class SpiritWalkerEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 150);
        this.speed = 0.3333333333333;
        this.direction = 1;


        // frames per animation frame
        this.animationSpeed = 10;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.spirit_walker, "Run", this.animationSpeed);

        this.amountOfTimeToWait = 90;
        this.waitTimer = new Clock();
        this.waitTimer.add(this.amountOfTimeToWait * 2);



    }

    update(map, entities) {
        super.update(map, entities);


        if(this.rightHit || this.leftHit) {
            this.direction *= -1;
            this.x += this.direction;
        }

        if(this.waitTimer.getTime() > this.amountOfTimeToWait) {
            this.velocity.x = this.speed * this.direction;
            this.sprite.direction = this.direction;
            this.sprite.setAnimation("Run");

        } else {
            this.velocity.x = 0;
            this.sprite.setAnimation("Idle");
        }



        // if the point to the down and right or left and down is empty, turn around since it's about to fall off
        if(!map.pointIsCollidingWithWall(this.x + this.width + 1, this.y + this.height + 1)
        || !map.pointIsCollidingWithWall(this.x - 1, this.y + this.height + 1)) {
            this.direction *= -1;

            this.waitTimer.restart();
            this.x += this.direction;
        }




    }

    draw(context) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);
    }

}


// // TurtleTadpoleEnemy.js

// class TurtleTadpoleEnemy extends Enemy {
//     constructor(x, y, direction) {
//         super(x, y, 6, 6, 150); // Adjusted size and health
//         this.speed = 0.5;
//         this.direction = direction; // 1 for right, -1 for left

//         // Animation setup
//         this.animationSpeed = 10;
//         this.sprite = new AnimatedSprite(Loader.spriteSheets.tadpole, "Run", this.animationSpeed);

//         // Zig-Zag movement properties
//         this.zigZagAmplitude = 40 + Math.random() * 40; // Amplitude of the zig-zag
//         this.zigZagFrequency = 0.05 + Math.random() * 0.1; // Frequency of the zig-zag
//         this.zigZagTimer = 0;

//         // Target reference (player)
//         this.target = null;
//         this.targetsPlayer = true;
//     }

//     update(map, entities) {
//         super.update(map, entities);

//         if(this.dead) return;

//         // Acquire target (player)
//         if (!this.target) {
//             // this.target = findPlayer(entities); // Assuming a function to find the player
//         }

//         // if offscreen, remove
//         if (this.isOffMap(map)) {
//             // this.dead = true;
//             this.removeFromScene = true;
//         }

//         // Zig-Zag movement towards the target
//         this.zigZagTimer += this.zigZagFrequency;
//         const zigZagOffset = Math.sin(this.zigZagTimer) * this.zigZagAmplitude;

//         // Calculate velocity towards the player with zig-zag
//         if (this.target && this.targetsPlayer) {
//             this.direction = this.target.x > this.x ? 1 : -1;
//             this.sprite.direction = this.direction;

//             const deltaX = this.target.x - this.x;
//             const deltaY = this.target.y - this.y;

//             // Normalize direction
//             const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;
//             const normX = deltaX / distance;
//             const normY = deltaY / distance;

//             // Apply zig-zag offset perpendicular to the direction
//             const perpendicularX = -normY;
//             const perpendicularY = normX;

//             this.velocity.x = (normX * this.speed) + (perpendicularX * (zigZagOffset / 100));
//             this.velocity.y = normY * this.speed + (perpendicularY * (zigZagOffset / 100));
//         }

//         // Update sprite animation
//         // this.sprite.setAnimation("Run");
//     }

//     draw(context) {
//         super.draw(context);
//         this.sprite.draw(context, this.x, this.y);
//     }

//     interactWith(other) {
//         // Define interactions, e.g., damage player on collision
//         if (other instanceof Player) {
//             this.target = other;
//         }
//     }
// }

// // Helper function to find the player in entities
// function findPlayer(entities) {
//     return entities.find(entity => entity instanceof Player) || null;
// }


// the dangling spider danges from the ceiling and moves up and down
class DanglingSpiderEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 8, 8, 100); // Adjust health as needed
        
        this.spawnPosition = {x: x, y: y};
        
        this.dangleRange = 16;
        this.dangleSpeed = 0.25;
        this.dangleDirection = 1;

        this.direction = 1;
        this.collidesWithMap = false;
        this.gravity = 0;

        // Animation setup
        this.animationSpeed = 6;
        this.sprite = new AnimatedSprite(Loader.spriteSheets.spider, "Dangle", this.animationSpeed);

    }

    findDistToCeiling(map) {
        let dist = 0;
        for(let i = 0; i < 100; i++) {
            if(map.pointIsCollidingWithWall(this.x + 4, this.y - i)) {
                dist = i;
                break;
            }
        }
        return dist;
    }

    update(map, entities) {
        super.update(map, entities);
        
        if (this.dead) return;

        // Handle movement
        this.updateDangleBehavior(map);
    }

    draw(context, map) {
        super.draw(context);
        this.sprite.draw(context, this.x, this.y);

        if(this.dead) return;
        // draw a line to the ceiling; account for view.x (add) and view.y (subtract)
        // fill white
        context.strokeStyle = "white";
        context.beginPath();
        context.moveTo(this.x + 4 - context.view.x, Math.round(this.y + context.view.y));
        context.lineTo(this.x + 4 - context.view.x, Math.round(this.y - Math.round(this.findDistToCeiling(map)) + context.view.y));
        context.stroke();

    }

    updateDangleBehavior(map) {
        if(this.y > this.spawnPosition.y + this.dangleRange) {
            this.dangleDirection = -1;
        } else if(this.y < this.spawnPosition.y) {
            this.dangleDirection = 1;
        }

        this.y += this.dangleSpeed * this.dangleDirection;
    }


}



class Run2WallEnemy extends Enemy {
    constructor(x, y) {
        super(x - 240, y, 240, 176, 1000000);
        
        this.sprite = new AnimatedSprite(Loader.spriteSheets.level_run_2_wall, "Idle", 10);
        this.collidesWithMap = false;
        this.gravity = 0;
        this.defaultGravity = 0;

        this.hurtboxes = [{ x: 0, y: 0, w: this.width - 6, h: this.height }];

        Loader.setCurrentMusicSpeed(1);
    }

    update(map, entities) {
        super.update(map, entities);

        this.velocity.x = 0.5;


        // find map BossCues WallSpeedUp
        map.bossCues.forEach(cue => {
            if(cue.name === "WallSpeedUp" && this.x + this.width > cue.x) {
                this.velocity.x = 1;

                Loader.setCurrentMusicSpeed(1.5);
            }
        });


        currentScene.player.weapon = null;
        currentScene.player.isAllowedWeapon = false;
    }

    draw(context) {
        super.draw(context);

        this.sprite.draw(context, this.x, this.y);
    }


    interactWith(other) {
        if(other instanceof Player && other.colliding(this)) {
            other.x += this.velocity.x;
        }
    }

} 



