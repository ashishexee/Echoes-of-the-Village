import Phaser from "phaser";
export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    preload() {
        this.load.image('menu_background', 'assets/images/world/Bg04.png');
    }

    create() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Add background image and overlay
        this.add.image(0, 0, 'menu_background').setOrigin(0).setDisplaySize(this.scale.width, this.scale.height);
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0);

        // Main Panel
        const panelWidth = 700;
        const panelHeight = 500;
        this.add.graphics()
            .fillStyle(0x1a1a1a, 0.9)
            .fillRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, 20)
            .lineStyle(2, 0xd4af37, 1) // Gold-like border
            .strokeRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, 20);

        // Title
        this.add.text(centerX, centerY - 180, 'Leaderboard', {
            fontFamily: 'Georgia, serif',
            fontSize: '56px',
            color: '#ffffff',
            align: 'center',
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5 }
        }).setOrigin(0.5);

        // Coming Soon Text
        this.add.text(centerX, centerY - 20, 'Coming Soon...', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#cccccc',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // Back Button
        this.createButton(centerX, centerY + 180, 'Back to Menu', () => {
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, text, callback) {
        const buttonWidth = 280;
        const buttonHeight = 60;
        const button = this.add.container(x, y);

        const background = this.add.graphics()
            .fillStyle(0x333333, 1)
            .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

        const border = this.add.graphics()
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
        }).setOrigin(0.5);

        button.add([background, border, buttonText]);
        button.setSize(buttonWidth, buttonHeight);
        button.setInteractive({ useHandCursor: true });

        button.on('pointerover', () => {
            background.clear().fillStyle(0x444444, 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            border.clear().lineStyle(2, 0xffe74a, 1).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            this.tweens.add({ targets: button, scale: 1.05, duration: 150, ease: 'Sine.easeInOut' });
        });

        button.on('pointerout', () => {
            background.clear().fillStyle(0x333333, 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            border.clear().lineStyle(2, 0xd4af37, 1).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            this.tweens.add({ targets: button, scale: 1, duration: 150, ease: 'Sine.easeInOut' });
        });

        button.on('pointerdown', callback);
        return button;
    }
}