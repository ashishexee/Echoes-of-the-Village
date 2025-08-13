import Phaser from "phaser";
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Images are commented out, so don't use them in create()
    }

    create() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x333333);

        this.add.text(centerX, centerY - 200, 'Echoes of the Village', {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const playBtn = this.add.text(centerX, centerY - 50, 'Enter Game', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            backgroundColor: '#555555',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const leaderboardBtn = this.add.text(centerX, centerY + 50, 'Leaderboard', {
            fontFamily: 'Arial',
            fontSize: 24, 
            color: '#ffffff',
            backgroundColor: '#555555',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playBtn.on('pointerdown', () => {
            this.scene.start('LoadingScene');
        });

        leaderboardBtn.on('pointerdown', () => {
            this.scene.start('LeaderboardScene');
        });

        this.add.text(centerX, centerY + 200, 'Connected: 0x71C...9E3f', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#aaaaaa'
        }).setOrigin(0.5);
    }
}
