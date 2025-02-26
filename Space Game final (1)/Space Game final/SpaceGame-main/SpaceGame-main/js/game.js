this.maxSpeed;
this.eventTimer = 0;
this.eventInterval = 0.5; // Decreased from 1 second to 0.5 seconds for more frequent spawns
this.eventUpdate = false;

createEnemys() {
    const firstX = this.width;
    const enemySpacing = 400 * this.ratio; // Decreased from 600 to 400 for closer spacing

    if (this.enemyCount < this.numberOfEnemys) {
        this.enemys.push(new Enemy(this, firstX + this.enemyCount * enemySpacing));
        this.enemyCount++;
    }
}

this.player = new Player(this);
this.sound = new AudioControl(this); // Sound
this.enemys = [];
this.numberOfEnemys = 15; // Increased from 10 to 15 for more enemies 