import Phaser from 'phaser';
import { Transaction } from "@mysten/sui/transactions";

export class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
        this.submissionStatusText = null;
    }

    init(data) {
        // Receive all the final stats from HomeScene
        this.endGameData = data;
    }

    create() {
        this.cameras.main.fadeIn(800, 0, 0, 0);
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.85).setOrigin(0);

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Display a title based on whether the guess was correct
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

        // Display the "True Ending" message if applicable
        if (this.endGameData.isTrueEnding) {
            this.add.text(centerX, centerY - 140, 'You uncovered the true story!', {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#d4af37',
                fontStyle: 'italic'
            }).setOrigin(0.5);
        }

        // Display the final stats
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

        // --- Buttons ---
        const playAgainButton = this.add.text(centerX, centerY + 180, 'Play Again', { fontSize: '32px', fill: '#2ecc71' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                // Reset timer for the next game
                this.registry.set('elapsedTime', 0);
                this.scene.start('HomeScene', { 
                    account: this.endGameData.account,
                    suiClient: this.endGameData.suiClient, // Pass suiClient as well
                });
            });

        const mainMenuButton = this.add.text(centerX, centerY + 250, 'Main Menu', { fontSize: '24px', fill: '#cccccc' })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.registry.set('elapsedTime', 0);
                this.scene.start('MenuScene', { account: this.endGameData.account });
            });

        // Add a text element to show the submission status
        this.submissionStatusText = this.add.text(centerX, centerY + 300, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#d4af37'
        }).setOrigin(0.5);
            
        // Automatically submit the score to the blockchain if it's greater than 0
        if (this.endGameData.score > 0) {
            this.submitScore(this.endGameData.score);
        }
    }

    async submitScore(finalScore) {
        const { account, walletProvider } = this.endGameData;

        if (!account || !walletProvider) {
            this.submissionStatusText.setText('Wallet not connected. Cannot submit score.');
            console.error("Wallet data not available in EndScene.");
            return;
        }

        this.submissionStatusText.setText('Submitting score to the blockchain...');

        try {
            const PACKAGE_ID = "0xf7fd6f8b100f786fcda885db47807a53af18562abc37485da97eab52ee85c6a9";
            const MODULE_NAME = "contract_one";
            const SCORES_OBJECT_ID = "0x8ecdcbfb483d5aae0a22ad90d2412c15fe102b62e1cb0cc3e9e6df05e23839b6";

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
