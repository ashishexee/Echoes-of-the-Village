import Phaser from "phaser";

export class WalletScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WalletScene' });
    }

    preload() {
        this.load.image('bg', '/assets/images/world/Bg04.png');
        this.load.audio('intro_music', '/assets/music/intro_music.MP3');
        this.load.image('gaming_frame', 'assets/images/ui/gaming_frame.png');
    }

    create() {
        // Start menu music if it's not already playing
        if (!this.sound.get('intro_music') || !this.sound.get('intro_music').isPlaying) {
            this.sound.play('intro_music', { loop: true, volume: 0.5 });
        }

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Add background image and overlay
        this.add.image(0, 0, 'bg').setOrigin(0).setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7).setOrigin(0);

        // Main Panel
        const panelWidth = 500;
        const panelHeight = 400;
        this.add.graphics()
            .fillStyle(0x1a1a1a, 0.9)
            .fillRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, 20)
            .lineStyle(2, 0xd4af37, 1) // Gold-like border
            .strokeRoundedRect(centerX - panelWidth / 2, centerY - panelHeight / 2, panelWidth, panelHeight, 20);

        // Title
        this.add.text(centerX, centerY - 120, 'Connect Your Wallet', {
            fontFamily: 'Georgia, serif',
            fontSize: '40px',
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

        // Connect Button
        this.createButton(centerX, centerY + 20, 'Connect Wallet', () => {
            this.connectWallet();
        });

        // Skip Button
        const skipText = this.add.text(centerX, centerY + 120, '[DEV] Skip and Play', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        skipText.on('pointerover', () => skipText.setColor('#ffffff'));
        skipText.on('pointerout', () => skipText.setColor('#aaaaaa'));
        skipText.on('pointerdown', () => this.scene.start('MenuScene'));
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

    async connectWallet() {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('Connected account:', accounts[0]);
                this.scene.start('MenuScene', { account: accounts[0] });
            } else {
                throw new Error('MetaMask not found. Please install MetaMask.');
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            const centerX = this.cameras.main.width / 2;
            this.add.text(centerX, this.cameras.main.height / 2 + 150, 'Failed to connect. Please try again.', {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }
    }
}

