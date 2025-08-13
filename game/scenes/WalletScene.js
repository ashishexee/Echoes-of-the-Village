import Phaser from "phaser";
export class WalletScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WalletScene' });
    }

    preload() {
        // this.load.image('connect_btn', '/assets/images/ui/connect_btn.png');
        // this.load.image('logo', '/assets/images/ui/logo.png');
    }

    create() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Add logo
        // this.add.image(centerX, centerY - 130, 'logo').setScale(0.8);

        // // Add wallet connection button
        // const connectBtn = this.add.image(centerX, centerY + 70, 'connect_btn')
        //     .setInteractive({ useHandCursor: true })
        //     .setScale(0.7);

        // Add text
        this.add.text(centerX, centerY - 20, 'Connect your MetaMask wallet to start', {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Connect wallet when button is clicked
        // connectBtn.on('pointerdown', () => {
        //     this.connectWallet();
        // });

        // Temporary: Skip wallet connection for development
        const skipText = this.add.text(centerX, centerY + 200, '[DEV] Skip wallet connection', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        skipText.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    async connectWallet() {
        try {
            // For now, just pretend to connect and proceed
            // You'll implement actual MetaMask connection here

            console.log('Connecting to wallet...');

            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Wallet connected!');
            this.scene.start('MenuScene');

        } catch (error) {
            console.error('Failed to connect wallet:', error);
            const centerX = this.cameras.main.width / 2;
            this.add.text(centerX, this.cameras.main.height / 2 + 130, 'Failed to connect. Please try again.', {
                fontFamily: 'Arial',
                fontSize: 16,
                color: '#ff0000'
            }).setOrigin(0.5);
        }
    }
}