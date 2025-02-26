resize() {
    this.width = (this.spriteWidth * this.game.ratio) * 0.6;  // Increased from 0.4
    this.height = (this.spriteHeight * this.game.ratio) * 0.8;  // Increased from 0.6
    this.y = this.game.height * 0.5 - this.height * 0.5;
    this.collisionX = this.x + this.width * 0.5;
    this.collisionRadius = 45 * this.game.ratio;  // Increased from 30 to match new size
} 