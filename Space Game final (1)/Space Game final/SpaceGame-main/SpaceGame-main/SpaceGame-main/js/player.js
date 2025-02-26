class Player {
    constructor(game) {
        this.game = game;
        this.x = 20;
        this.y = 0;
        this.spriteWidth = 192;
        this.spriteHeight = 192;
        this.width;
        this.height;
        this.speedY = 0; // Inicializando a velocidade vertical
        this.maxSpeedY = 5; // Máxima velocidade vertical
        this.collisionX;
        this.collisionY;
        this.collisionRadius;
        this.collided;
        this.energy = 30;
        this.maxEnergy = this.energy * 2;
        this.minEnergy = 15;
        this.charging;
        this.barSize;
        this.imageIdle = document.getElementById('player-idle');
        this.imageBoost = document.getElementById('player-boost');
        this.frameX;
        this.state;
        this.projectiles = []; // Lista de projéteis disparados
        this.canShoot = true; // Flag para controlar o cooldown do disparo
        this.shootCooldown = 500; // Normal cooldown: 0.5 seconds
        this.depletedShootCooldown = 2000; // Depleted cooldown: 2 seconds
        this.shootCost = 10;  // Normal energy cost for shooting
        this.depletedShootCost = 5;  // Reduced energy cost when depleted
        this.lastShootTime = 0;  // Initialize the last shoot time
        this.boostCost = 15;  // Energy cost for boosting
        this.boostSound = null; // Track the boost sound
        this.boostSoundTimeout = null; // Track the timeout for boost sound
        this.canBoost = true;  // New flag for boost cooldown
        this.boostCooldown = 500;  // Normal cooldown: 0.5 seconds
        this.longBoostCooldown = 10000;  // Long cooldown: 10 seconds when energy depleted
        this.lastBoostTime = 0;  // Track last boost time
        this.isBoostDepleted = false;  // Track if boost was depleted
    }

    draw() {
        if (this.state) {
            this.game.ctx.drawImage(this.imageBoost, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        } else {
            this.game.ctx.drawImage(this.imageIdle, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }

        ++this.frameX;

        if (this.game.debug) {
            this.game.ctx.beginPath();
            this.game.ctx.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
            this.game.ctx.stroke();
        }

        this.projectiles.forEach(projectile => projectile.draw());
    }

    update() {
        if (this.state) {
            this.frameX = this.frameX % 5;
        } else {
            this.frameX = this.frameX % 6;
        }

        this.handleEnergy();

        // Atualizar a posição do jogador de acordo com a velocidade
        this.y += this.speedY;

        // Limitar a posição do jogador dentro dos limites da tela
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > this.game.height) this.y = this.game.height - this.height;

        this.collisionY = this.y + this.height * 0.5;

        // Check for collisions with enemies
        this.game.enemys.forEach(enemy => {
            const dx = this.collisionX - (enemy.x + enemy.width * 0.5);
            const dy = this.collisionY - (enemy.y + enemy.height * 0.5);
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.collisionRadius + enemy.width * 0.3) {
                this.collided = true;
                this.game.gameOver = true;
            }
        });

        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
    }

    resize() {
        this.width = (this.spriteWidth * this.game.ratio) * 0.4;
        this.height = (this.spriteHeight * this.game.ratio) * 0.6;
        this.y = this.game.height * 0.5 - this.height * 0.5;
        this.collisionX = this.x + this.width * 0.5;
        this.collisionRadius = 15 * this.game.ratio;  // Significantly reduced from 25 to 15 for much smaller hitbox
        this.collided = false;
        this.barSize = Math.floor(5 * this.game.ratio);
        this.frameX = 0;
        this.state = 0;
        this.charging = false;
        this.energy = 30;
        this.lastShootTime = 0; // Reset shooting cooldown on resize
        this.canShoot = true;   // Reset shooting flag on resize
    }

    handleEnergy() {
        if (this.game.eventUpdate) {
            // Normal energy regeneration when not depleted
            if (this.energy < this.maxEnergy && !this.isBoostDepleted) {
                this.energy += 1;
            }
            // Slower energy regeneration when depleted (just enough to shoot)
            else if (this.isBoostDepleted && this.energy < this.depletedShootCost * 2) {
                this.energy += 0.5;  // Regenerate energy at half speed when depleted
            }

            if (this.charging) {
                this.energy -= 3;  // Reduced energy consumption while charging

                if (this.energy <= 0) {
                    this.energy = 0;
                    this.isBoostDepleted = true;  // Mark boost as depleted
                    this.lastBoostTime = Date.now();  // Start the long cooldown
                    this.stopCharge();
                }
            }

            // Check if long cooldown has passed after depletion
            if (this.isBoostDepleted && Date.now() - this.lastBoostTime >= this.longBoostCooldown) {
                this.isBoostDepleted = false;
                this.energy = this.maxEnergy * 0.5;  // Restore 50% energy after cooldown
            }
        }
    }

    startCharge() {
        const currentTime = Date.now();
        // Don't allow boost if depleted and in long cooldown
        if (this.isBoostDepleted) {
            return;
        }
        
        if (this.energy >= this.boostCost && this.canBoost && currentTime - this.lastBoostTime >= this.boostCooldown) {
            // Stop any existing boost sound and clear timeout
            if (this.boostSound) {
                this.boostSound.pause();
                this.boostSound.currentTime = 0;
            }
            if (this.boostSoundTimeout) {
                clearTimeout(this.boostSoundTimeout);
            }

            // Play the boost sound
            this.boostSound = this.game.sounds['boost'].cloneNode();
            this.boostSound.play();

            // Stop the sound after 1 second
            this.boostSoundTimeout = setTimeout(() => {
                if (this.boostSound) {
                    this.boostSound.pause();
                    this.boostSound.currentTime = 0;
                    this.boostSound = null;
                }
            }, 1000);

            this.charging = true;
            this.state = 1;
            this.game.speed = this.game.maxSpeed;
            this.energy -= this.boostCost;
            this.lastBoostTime = currentTime;
        }
    }

    stopCharge() {
        // No sound on stop charge anymore
        this.charging = false;
        this.game.speed = this.game.minSpeed;
        this.state = 0;
    }

    wingsIdle() {
        this.state = 0;
    }

    wingsDown() {
        if (!this.charging) {
            // this.frameX = 1; // Player Spritesheet
        }
    }

    wingsUp() {
        if (!this.charging) {
            // this.frameX = 2; // Player Spritesheet
        }
    }

    wingsCharge() {
        this.state = 1;
    }

    shoot() {
        const currentTime = Date.now();
        const currentCooldown = this.isBoostDepleted ? this.depletedShootCooldown : this.shootCooldown;
        const currentShootCost = this.isBoostDepleted ? this.depletedShootCost : this.shootCost;

        if (this.canShoot && this.energy >= currentShootCost && currentTime - this.lastShootTime >= currentCooldown) {
            // Create and add the projectile first
            const projectile = new Projectile(this.game, this.x + this.width, this.y + this.height * 0.5);
            this.projectiles.push(projectile);
            
            // Play the sound effect
            this.game.playSound('laser');
            
            // Update energy and cooldown
            this.energy -= currentShootCost;
            this.lastShootTime = currentTime;
        }
    }
}