import Phaser from "phaser";

export class WalletScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WalletScene' });
    }

    preload() {
        this.load.image('bg', '/assets/images/world/Bg04.png'); // your background
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // === Background ===
        const bg = this.add.image(centerX, centerY, 'bg');
        bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // === Dim overlay ===
        this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.4);

        // === Glassy panel ===
        let panel = this.add.rectangle(centerX, centerY, 400, 250, 0x000000, 0.6)
            .setStrokeStyle(3, 0xffffff, 0.3)
            .setOrigin(0.5)
            .setAlpha(0);
        this.tweens.add({
            targets: panel,
            alpha: 1,
            scaleX: { from: 0.8, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            ease: 'Back.Out',
            duration: 600
        });

        // === Title ===
        this.add.text(centerX, centerY - 70, "Connect Your Wallet", {
            fontFamily: 'Arial',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // === Connect Button ===
        const connectBtn = this.add.rectangle(centerX, centerY, 220, 60, 0x1e90ff, 1)
            .setStrokeStyle(2, 0xffffff)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Glow effect
        this.tweens.add({
            targets: connectBtn,
            alpha: { from: 0.85, to: 1 },
            repeat: -1,
            yoyo: true,
            duration: 1000
        });

        // Button hover effect
        connectBtn.on('pointerover', () => {
            connectBtn.setFillStyle(0x3cb0ff, 1);
        });
        connectBtn.on('pointerout', () => {
            connectBtn.setFillStyle(0x1e90ff, 1);
        });

        // Button label
        const btnText = this.add.text(centerX, centerY, 'Connect Wallet', {
            fontFamily: 'Arial',
            fontSize: '22px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        connectBtn.on('pointerdown', () => {
            this.connectWallet();
        });

        // === Skip option ===
        const skipText = this.add.text(centerX, centerY + 100, '[DEV] Skip wallet connection', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#cccccc'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        skipText.on('pointerover', () => skipText.setColor('#ffffff'));
        skipText.on('pointerout', () => skipText.setColor('#cccccc'));
        skipText.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    async connectWallet() {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('Connected account:', accounts[0]);
                this.scene.start('MenuScene');
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
