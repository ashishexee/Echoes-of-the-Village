import Phaser from "phaser";
export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create() {
        const { width, height } = this.scale;

        this.add.text(width / 2, height * 0.2, 'LEADERBOARD', {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.4, 'Coming Soon...', {
            fontSize: '24px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.8, 'Press SPACE to return to village', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('HomeScene');
        });
    }
}