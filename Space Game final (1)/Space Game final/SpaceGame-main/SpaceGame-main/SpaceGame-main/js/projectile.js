class Projectile {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 10;
        this.speed = 10;
        this.markedForDeletion = false;
        this.image = document.getElementById('player-charge'); // Imagem do laser
    }

    update() {
        this.x += this.speed;
        if (this.x > this.game.width) this.markedForDeletion = true;

        // Verificar colisão com os inimigos
        this.game.enemys.forEach(enemy => {
            if (this.checkCollision(enemy)) {
                enemy.markedForDeletion = true;
                this.markedForDeletion = true;
                this.game.score += 1; // Aumentar a pontuação ao destruir um inimigo
                this.game.playSound('explosion');

                // Get current difficulty settings
                const settings = this.game.difficultySettings[this.game.difficulties[this.game.selectedDifficulty]];
                
                // Check for victory condition based on difficulty
                if (this.game.score >= settings.scoreToWin) {
                    this.game.gameOver = true;
                    this.game.isWinner = true;
                }

                // Original game over condition (all enemies destroyed)
                else if (this.game.enemys.filter(e => !e.markedForDeletion).length === 0 && this.game.enemyCount >= this.game.numberOfEnemys) {
                    this.game.gameOver = true;
                }
            }
        });
    }

    draw() {
        this.game.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    checkCollision(enemy) {
        const dx = this.x - enemy.x;
        const dy = this.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.width / 2.5 + enemy.width / 2.5);  // Reduced from /2 to /2.5 for smaller hitbox
    }
}