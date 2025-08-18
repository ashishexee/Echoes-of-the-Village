import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.timerText = null;
        this.elapsedSeconds = 0;
    }

    create() {
        this.elapsedSeconds = this.registry.get('elapsedTime') || 0;

        this.timerText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 70,
            this.formatTime(this.elapsedSeconds),
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#d4af37', // Yellow color
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        this.elapsedSeconds++;
        this.timerText.setText(this.formatTime(this.elapsedSeconds));
        this.registry.set('elapsedTime', this.elapsedSeconds);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(remainingSeconds).padStart(2, '0');
        return `Time: ${formattedMinutes}:${formattedSeconds}`;
    }
}