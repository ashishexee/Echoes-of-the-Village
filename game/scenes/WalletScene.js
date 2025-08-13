import Phaser from "phaser";
export class WalletScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WalletScene' });
    }

    preload() {
         this.load.image('connect_btn', '/assets/images/ui/connect_btn.png');
        // this.load.image('logo', '/assets/images/ui/logo.png');
    }

   create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Create blue rectangle as button
    const connectBtn = this.add.rectangle(centerX, centerY + 70, 200, 50, 0x0000ff) // blue fill
        .setInteractive({ useHandCursor: true });

    // Add text over the button
    const btnText = this.add.text(centerX, centerY + 70, 'Connect Wallet', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);

    // Button click
    connectBtn.on('pointerdown', () => {
        this.connectWallet();
    });

    // Instruction text
    this.add.text(centerX, centerY - 20, 'Connect your MetaMask wallet to start', {
        fontFamily: 'Arial',
        fontSize: 22,
        color: '#ffffff'
    }).setOrigin(0.5);

    // Skip option for development
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
            if (window.ethereum) {
                // Request account access if needed
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('Connected account:', accounts[0]);
                this.scene.start('MenuScene');
            } else {
                throw new Error('MetaMask not found. Please install MetaMask.');
            }
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