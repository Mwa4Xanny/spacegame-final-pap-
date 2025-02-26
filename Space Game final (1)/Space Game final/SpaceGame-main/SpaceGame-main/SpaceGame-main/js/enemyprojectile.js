class EnemyProjectile {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 10;
        this.speed = -10;
        this.markedForDeletion = false;
        this.image = document.getElementById('enemy-charge'); // Imagem do projétil do inimigo
    }

    update() {
        this.x += this.speed;
        if (this.x < 0) this.markedForDeletion = true;

        // Verificar colisão com o jogador
        if (this.checkCollision(this.game.player)) {
            this.game.player.collided = true;
            this.markedForDeletion = true;
            this.game.gameOver = true;
        }
    }

    draw() {
        this.game.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    checkCollision(player) {
        const dx = this.x - player.collisionX;
        const dy = this.y - player.collisionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.width / 3 + player.collisionRadius;  // More precise collision using player's collision radius and smaller projectile hitbox
    }
}