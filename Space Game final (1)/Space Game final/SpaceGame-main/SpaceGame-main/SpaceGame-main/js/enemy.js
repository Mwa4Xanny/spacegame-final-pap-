class Enemy {
    constructor(game, x) {
        this.game = game;
        this.x = x;
        this.y = Math.random() * (this.game.height - 100);
        this.spriteWidth = 192;
        this.spriteHeight = 192;
        this.width = this.spriteWidth * this.game.ratio * 0.4;
        this.height = this.spriteHeight * this.game.ratio * 0.4;
        // Apply difficulty-based speed multiplier
        const speedMultiplier = this.game.difficultySettings[this.game.difficulties[this.game.selectedDifficulty]].enemySpeed;
        this.speedX = (Math.random() * -1.5 - 0.5) * speedMultiplier;
        this.markedForDeletion = false;
        this.image = document.getElementById('enemy-idle');
        this.projectiles = [];
        this.shootCooldown = 3500; // Cooldown increased to 3.5 seconds
        this.lastShootTime = 0;
    }

    update(deltaTime) {
        this.x += this.speedX;
        if (this.x + this.width < this.game.width && !this.markedForDeletion) {
            // Verificar se o inimigo pode disparar
            if (Date.now() - this.lastShootTime > this.shootCooldown) {
                this.shoot();
                this.lastShootTime = Date.now();
            }
        }

        if (this.x + this.width < 0) this.markedForDeletion = true;

        // Atualizar os projéteis disparados pelo inimigo
        this.projectiles.forEach(projectile => projectile.update());
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
    }

    draw() {
        this.game.ctx.drawImage(this.image, 0, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        this.projectiles.forEach(projectile => projectile.draw());
    }

    resize() {
        this.width = this.spriteWidth * this.game.ratio * 0.4;
        this.height = this.spriteHeight * this.game.ratio * 0.4;
    }

    shoot() {
        this.projectiles.push(new EnemyProjectile(this.game, this.x, this.y + this.height / 2 - 5));
    }
}