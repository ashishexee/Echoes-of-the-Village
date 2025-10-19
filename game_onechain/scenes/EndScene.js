import Phaser from 'phaser';
import { Transaction } from "@mysten/sui/transactions";

export class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
        this.submissionStatusText = null;
    }

    init(data) {
        this.endGameData = data;
    }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.85).setOrigin(0);

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        const titleText = this.endGameData.isCorrect ? 'Mystery Solved!' : 'Case Closed...';
        const titleColor = this.endGameData.isCorrect ? '#2ecc71' : '#e74c3c';

        this.add.text(centerX, centerY - 200, titleText, {
            fontFamily: 'Georgia, serif',
            fontSize: '64px',
            color: titleColor,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        if (this.endGameData.isTrueEnding) {
            this.add.text(centerX, centerY - 140, 'You uncovered the true story!', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#d4af37',
                fontStyle: 'italic'
            }).setOrigin(0.5);
        }

        const stats = [
            `Final Score: ${this.endGameData.score}`,
            `Total Time: ${this.endGameData.time}`,
            `Total Guesses: ${this.endGameData.guesses}`,
            `NFTs Collected: ${this.endGameData.nfts}`
        ];

        this.add.text(centerX, centerY + 20, stats, {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 20
        }).setOrigin(0.5);
        const mainMenuButton = this.add.text(centerX, centerY + 200, 'Return to Main Menu', { 
            fontSize: '32px', 
            fill: '#2ecc71',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.registry.set('elapsedTime', 0);
                this.scene.start('MenuScene', { 
                    account: this.endGameData.account,
                    suiClient: this.endGameData.suiClient
                });
            })
            .on('pointerover', () => mainMenuButton.setStyle({ fill: '#4aff9f' }))
            .on('pointerout', () => mainMenuButton.setStyle({ fill: '#2ecc71' }));

        // Add a text element to show the submission status
        this.submissionStatusText = this.add.text(centerX, centerY + 270, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#d4af37'
        }).setOrigin(0.5);
            
        if (this.endGameData.score > 0) {
            this.submitScore(this.endGameData.score);
        }
    }

    async submitScore(finalScore) {
        const { account } = this.endGameData;
        const walletProvider = window.onechainWallet;

        if (!account || !walletProvider) {
            this.submissionStatusText.setText('Wallet not connected. Cannot submit score.');
            console.error("Wallet data not available in EndScene.");
            return;
        }

        this.submissionStatusText.setText('Submitting score to the blockchain...');

        try {
            const PACKAGE_ID = "0x7102f4157cdeef27cb198db30366ecd10dc7374d5a936dba2a40004371787b9d";
            const MODULE_NAME = "contracts_one";
            const SCORES_OBJECT_ID = "0xfc2f040b88dd5dfbbbd28b74bb363537c634c78c55ca6d455ae547221838845f";

            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::update_score`,
                arguments: [
                    tx.object(SCORES_OBJECT_ID),
                    tx.pure.address(account),
                    tx.pure.u64(finalScore)
                ],
            });

            const result = await walletProvider.signAndExecuteTransaction({
                transaction: tx,
            });

            console.log("Score updated successfully!", result);
            this.submissionStatusText.setText('Score submitted successfully!');

        } catch (error) {
            console.error("Failed to submit score:", error);
            this.submissionStatusText.setText('Error: Failed to submit score.');
        }
    }
}
