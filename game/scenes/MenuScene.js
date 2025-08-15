import Phaser from "phaser";
export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.walletAddress = null;
    }

    init(data) {
        if (data && data.account) {
            this.walletAddress = data.account;
        }
    }

    preload() {
        this.load.image('menu_background', 'assets/images/world/Bg04.png');
    }

    create() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.add.image(0, 0, 'menu_background').setOrigin(0).setDisplaySize(this.scale.width, this.scale.height);
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0);

        const panelWidth = 600;
        const panelHeight = 500;
        this.add.graphics()
            .fillStyle(0x1a1a1a, 0.9)
            .fillRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, 20)
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, 20);

        this.add.text(centerX, centerY - 160, 'Echoes of the Village', {
            fontFamily: 'Georgia, serif',
            fontSize: '56px',
            color: '#ffffff',
            align: 'center',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 5,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
 
        this.createButton(centerX, centerY, 'Enter Game', () => {
            this.scene.start('LoadingScene');
        });

        this.createButton(centerX, centerY + 90, 'Leaderboard', () => {
            this.scene.start('LeaderboardScene');
        });
 
        let footerText = 'Not Connected';
        if (this.walletAddress) {
            const formattedAddress = `${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(this.walletAddress.length - 4)}`;
            footerText = `Connected: ${formattedAddress}`;
        }
        this.add.text(centerX, centerY + 210, footerText, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
    }

    createButton(x, y, text, callback) {
        const buttonWidth = 320;
        const buttonHeight = 70;

        const button = this.add.container(x, y);

        const background = this.add.graphics()
            .fillStyle(0x333333, 1)
            .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

        const border = this.add.graphics()
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

        const buttonText = this.add.text(0, 0, text, {
            fontFamily: 'Arial',
            fontSize: '28px',
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
