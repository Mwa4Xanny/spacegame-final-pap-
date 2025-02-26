class Background    {
    constructor(game)   {
        this.game = game;
        this.image = document.getElementById('background');
        this.width = 2400;
        this.height = this.game.baseHeight;
        this.scaleWidth;
        this.scaleHeight;
        this.x = 0;
        this.buffer = 2; // Small buffer to prevent gaps
    }

    update()    {
        // Move background
        this.x -= this.game.speed;
        
        // Reset when first image is fully off screen
        if (this.x <= -this.scaleWidth) {
            this.x += this.scaleWidth;
        }
    }

    draw()  {
        // Draw enough images to cover screen plus buffer
        const numImages = Math.ceil(this.game.width / this.scaleWidth) + 2;
        
        for(let i = 0; i < numImages; i++) {
            this.game.ctx.drawImage(
                this.image,
                Math.floor(this.x + (this.scaleWidth * i)) - this.buffer,
                0,
                this.scaleWidth + (this.buffer * 2),
                this.scaleHeight
            );
        }
    }

    resize()    {
        this.scaleWidth = this.width * this.game.ratio;
        this.scaleHeight = this.height * this.game.ratio;
        this.x = 0;
    }
}