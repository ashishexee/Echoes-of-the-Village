// undo 01
import Phaser from 'phaser';
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, SCORES_OBJECT_ID, REWARD_POOL_OBJECT_ID, CLOCK_OBJECT_ID } from '../oneConfig';

export class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
        this.submissionStatusText = null;
        this.rewardAmount = null;
        this.gameSessionId = null;
        this.gameScore = 0;
        this.gameWon = false;
        this.isTrueEnding = false;
        this.proofObjectId = null;
        this.isProcessing = false;
        this.claimButton = null;
        this.suiClient = null;
    }

    init(data) {
        this.endGameData = data;
        this.gameSessionId = data?.gameSessionId || `session_${Date.now()}`;
        this.gameScore = data?.score || 0;
        this.gameWon = data?.isCorrect || false;
        this.isTrueEnding = data?.isTrueEnding || false;
        this.suiClient = data?.suiClient || null;
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
            this.add.text(centerX, centerY - 140, '⭐ You uncovered the true story! ⭐', {
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
            // perform a page reload (equivalent to Ctrl+R)
            window.location.reload();
            })
            .on('pointerover', () => mainMenuButton.setStyle({ fill: '#4aff9f' }))
            .on('pointerout', () => mainMenuButton.setStyle({ fill: '#2ecc71' }));

        this.submissionStatusText = this.add.text(centerX, centerY + 270, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#d4af37'
        }).setOrigin(0.5);

        if (this.endGameData.score > 0 && this.endGameData.account) {
            this.processGameCompletion();
        } else {
            this.submissionStatusText.setText('No wallet connected or no score to submit.');
        }
    }

    async processGameCompletion() {
        const { account } = this.endGameData;
        const walletProvider = window.onechainWallet;

        if (!account || !walletProvider) {
            this.submissionStatusText.setText('Wallet not connected.');
            return;
        }

        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Step 1: Submit score
            this.submissionStatusText.setText('Step 1/2: Submitting score...');
            await this.submitScore(this.endGameData.score);

            // Step 2: If won, create proof
            if (this.gameWon) {
                this.submissionStatusText.setText('Step 2/2: Creating reward proof...');
                const proofCreated = await this.createGameCompletionProof();
                
                if (proofCreated) {
                    this.submissionStatusText.setText('✓ Proof created! Click "Claim Reward" below.');
                    this.showClaimButton();
                } else {
                    this.submissionStatusText.setText('Score submitted! (Reward proof failed)');
                }
            } else {
                this.submissionStatusText.setText('✓ Score submitted!');
            }
        } catch (error) {
            console.error("Error:", error);
            this.submissionStatusText.setText('Error: ' + error.message);
        } finally {
            this.isProcessing = false;
        }
    }

    async submitScore(finalScore) {
        const { account } = this.endGameData;
        const walletProvider = window.onechainWallet;

        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::${MODULE_NAME}::update_score`,
            arguments: [
                tx.object(SCORES_OBJECT_ID),
                tx.pure.address(account),
                tx.pure.u64(finalScore)
            ],
        });

        const result = await walletProvider.signAndExecuteTransaction({ transaction: tx });
        console.log("Score updated:", result);
        return true;
    }

    async createGameCompletionProof() {
        const walletProvider = window.onechainWallet;
        const { account } = this.endGameData;

        try {
            const sessionIdBytes = Array.from(new TextEncoder().encode(this.gameSessionId));
            
            console.log("Creating proof with params:", {
                sessionId: this.gameSessionId,
                score: this.gameScore,
                won: this.gameWon,
                isTrueEnding: this.isTrueEnding
            });

            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::complete_game_and_create_proof`,
                arguments: [
                    tx.object(REWARD_POOL_OBJECT_ID),
                    tx.pure.vector('u8', sessionIdBytes),
                    tx.pure.u64(this.gameScore),
                    tx.pure.bool(this.gameWon),
                    tx.pure.bool(this.isTrueEnding),
                    tx.object(CLOCK_OBJECT_ID),
                ],
            });

            const result = await walletProvider.signAndExecuteTransaction({
                transaction: tx,
                options: { showEffects: true, showObjectChanges: true }
            });

            console.log("Full transaction result:", JSON.stringify(result, null, 2));

            // Method 1: Check objectChanges directly
            if (result.objectChanges && Array.isArray(result.objectChanges)) {
                for (const change of result.objectChanges) {
                    if (change.type === 'created' && change.objectType?.includes('GameCompletionProof')) {
                        this.proofObjectId = change.objectId;
                        console.log("Found proof ID from objectChanges:", this.proofObjectId);
                        break;
                    }
                }
            }

            // Method 2: If objectChanges didn't work, try to fetch from transaction details
            if (!this.proofObjectId && result.digest && this.suiClient) {
                console.log("Fetching transaction details for digest:", result.digest);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for indexing
                
                try {
                    const txDetails = await this.suiClient.getTransactionBlock({
                        digest: result.digest,
                        options: { showObjectChanges: true, showEffects: true }
                    });
                    
                    console.log("Transaction details:", JSON.stringify(txDetails, null, 2));
                    
                    if (txDetails.objectChanges) {
                        for (const change of txDetails.objectChanges) {
                            if (change.type === 'created' && change.objectType?.includes('GameCompletionProof')) {
                                this.proofObjectId = change.objectId;
                                console.log("Found proof ID from txDetails:", this.proofObjectId);
                                break;
                            }
                        }
                    }
                } catch (fetchError) {
                    console.error("Error fetching transaction details:", fetchError);
                }
            }

            // Method 3: Check effects.created if available
            if (!this.proofObjectId && result.effects?.created) {
                for (const created of result.effects.created) {
                    // The first created object is likely our proof
                    if (created.reference?.objectId) {
                        this.proofObjectId = created.reference.objectId;
                        console.log("Found proof ID from effects.created:", this.proofObjectId);
                        break;
                    }
                }
            }

            // Method 4: Query owned objects to find the proof
            if (!this.proofObjectId && this.suiClient && account) {
                console.log("Searching for proof in owned objects...");
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for indexing
                
                try {
                    const proofType = `${PACKAGE_ID}::${MODULE_NAME}::GameCompletionProof`;
                    const ownedObjects = await this.suiClient.getOwnedObjects({
                        owner: account,
                        filter: { StructType: proofType },
                        options: { showContent: true }
                    });
                    
                    console.log("Owned proof objects:", ownedObjects);
                    
                    if (ownedObjects.data && ownedObjects.data.length > 0) {
                        // Get the most recent one (should be the one we just created)
                        const latestProof = ownedObjects.data[ownedObjects.data.length - 1];
                        if (latestProof.data?.objectId) {
                            this.proofObjectId = latestProof.data.objectId;
                            console.log("Found proof ID from owned objects:", this.proofObjectId);
                        }
                    }
                } catch (queryError) {
                    console.error("Error querying owned objects:", queryError);
                }
            }

            if (!this.proofObjectId) {
                console.warn("Could not find proof object ID through any method");
                return false;
            }

            this.rewardAmount = this.calculateExpectedReward(this.gameScore, this.isTrueEnding);
            console.log("Proof created successfully! ID:", this.proofObjectId, "Reward:", this.rewardAmount / 1e9, "OCT");
            return true;

        } catch (error) {
            console.error("Failed to create proof:", error);
            console.error("Error details:", error.message);
            return false;
        }
    }

    calculateExpectedReward(score, isTrueEnding) {
        const BASE_REWARD = 100000000;
        const SCORE_MULTIPLIER = 100000;
        const MAX_REWARD = 5000000000;
        const MIN_REWARD = 100000000;
        const TRUE_ENDING_BONUS = 1000000000;

        let reward = BASE_REWARD + (score * SCORE_MULTIPLIER);
        if (isTrueEnding) reward += TRUE_ENDING_BONUS;
        return Math.max(MIN_REWARD, Math.min(reward, MAX_REWARD));
    }

    showClaimButton() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        const rewardOCT = (this.rewardAmount / 1e9).toFixed(2);
        this.add.text(centerX, centerY + 300, `Reward: ${rewardOCT} OCT`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#f1c40f',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.claimButton = this.add.text(centerX, centerY + 350, '💰 Claim Reward 💰', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#000000',
            backgroundColor: '#f1c40f',
            padding: { x: 30, y: 15 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.claimReward())
            .on('pointerover', () => this.claimButton.setBackgroundColor('#f5d56b'))
            .on('pointerout', () => this.claimButton.setBackgroundColor('#f1c40f'));
    }

    async claimReward() {
        if (!this.proofObjectId || this.isProcessing) return;

        this.isProcessing = true;
        this.claimButton.setVisible(false);
        this.submissionStatusText.setText('Claiming reward...');

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::claim_reward_with_proof`,
                arguments: [
                    tx.object(REWARD_POOL_OBJECT_ID),
                    tx.object(this.proofObjectId),
                ],
            });

            const result = await window.onechainWallet.signAndExecuteTransaction({
                transaction: tx,
                options: { showEffects: true }
            });

            console.log("Reward claimed:", result);

            // Check for success - handle different response formats
            const isSuccess = result.effects?.status?.status === 'success' || 
                              result.effects?.status === 'success' ||
                              (result.digest && !result.effects?.status?.error);

            if (isSuccess) {
                const rewardOCT = (this.rewardAmount / 1e9).toFixed(2);
                this.submissionStatusText.setText(`🎉 Claimed ${rewardOCT} OCT! Check your wallet.`);
                this.submissionStatusText.setColor('#2ecc71');
            } else {
                const errorMsg = result.effects?.status?.error || 'Unknown error';
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error("Failed to claim:", error);
            this.submissionStatusText.setText('Error: ' + (error.message || 'Failed to claim reward'));
            this.submissionStatusText.setColor('#e74c3c');
            this.claimButton?.setVisible(true);
        } finally {
            this.isProcessing = false;
        }
    }

    shutdown() {
        this.isProcessing = false;
        this.proofObjectId = null;
    }
}
