class AudioControl {
    constructor(game) {
        this.game = game;
        this.charge = document.getElementById('charge');
    }

    play(audioElement) {
        audioElement.currentTime = 0;
        audioElement.play();
    }
}