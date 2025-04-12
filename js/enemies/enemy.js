// boss.js

// ... [Previous GameObject, Entity, Collider classes remain unchanged] ...

// Updated Enemy class remains the same
class Enemy extends Entity {
    constructor(x, y, w, h, health = 100) {
        super(x, y, w, h);
        this.isEnemy = true;

        this.hasProtectionAura = false;
        this.protectionAuraRadius = 0;

        this.maxHealth = health;
        this.health = this.maxHealth;

        this.hurtboxes = [{x: 1, y: 1, w: w - 2, h: h - 2}];

        this.saveTintColor = null;
    }

    
    die(xVel, yVel) {
        this.isEnemy = false;
        this.collidesWithMap = false;
        this.velocity.x = xVel || currentScene.player.sprite.direction * 5;
        this.velocity.y = yVel || -3;
        this.gravity = this.defaultGravity;
        this.dead = true;
        setFrameTimeout(() => {
            this.removeFromScene = true;
        }, 120);
    }

    update(map, entities) {
        super.update(map, entities);

        if (this.health <= 0 && !this.dead) {
            this.dead = true;
            this.die();
        }
    }

    drawProtectionAura(context) {
        if (this.hasProtectionAura) {
            // Draw a filled circle around the enemy
            context.beginPath();
            context.arc(this.x + this.width / 2 - context.view.x, this.y + this.height / 2 - context.view.y, this.protectionAuraRadius, 0, 2 * Math.PI);
            context.fillStyle = "rgba(0, 0, 255, 0.5)";
            context.fill();
        }
    }

    hurtWithDamage(damage) {
        if(!this.hasProtectionAura) {
            this.health -= damage;
            if(this.sprite) {
                this.saveTintColor = this.sprite.tint;
                this.sprite.tint = "rgba(230, 230, 230, 0.5)";
                setFrameTimeout(() => {
                    // this.sprite.tint = null;
                    this.sprite.tint = this.saveTintColor;
                }, 5);
            }
        }
    }



    draw(context) {
        this.drawProtectionAura(context);

        super.draw(context);

        return;

        // Draw health bar above the enemy
        if(this.maxHealth == 0) return;
        if(this.health <= 0) return;
        context.fillStyle = "rgba(255, 0, 0, 0.5)";
        context.fillRect(this.x - context.view.x, this.y - 4 - context.view.y, this.width, 2);
        context.fillStyle = "rgba(0, 255, 0, 0.5)";
        context.fillRect(this.x - context.view.x, this.y - 4 - context.view.y, this.width * (this.health / this.maxHealth), 2);

        if(this instanceof Boss) {
            /* use stage thresholds ie        this.stageThresholds = [
            { health: this.maxHealth / 2, stage: 2 },
            { health: this.maxHealth / 4, stage: 3 }
        ]; */
          // and make each stage a 1 px wide orange line on the health bar
            context.fillStyle = "rgba(255, 165, 0, 0.5)";
            for(let i = 0; i < this.stageThresholds.length; i++) {
                let threshold = this.stageThresholds[i];
                context.fillRect(this.x - context.view.x + this.width * (threshold.health / this.maxHealth), this.y - 4 - context.view.y, 1, 2);
            }
        }
    }
}


