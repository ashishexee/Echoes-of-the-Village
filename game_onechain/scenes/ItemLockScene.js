import Phaser from "phaser";
import { Transaction } from '@mysten/sui/transactions';

import { PACKAGE_ID, MODULE_NAME, itemNftStructType } from "../oneConfig.js";

export class ItemLockScene extends Phaser.Scene {
    constructor() {
        super({ key: "ItemLockScene" });
        this.villager = null;
        this.suiClient = null;
        this.account = null;
        this.gameData = null;
        this.statusText = null;
        this.playerInventory = null; // Add this property
    }

    init(data) {
        this.villager = data.villager;
        this.suiClient = data.suiClient;
        this.account = data.account;
        this.gameData = data.gameData;
        this.playerInventory = data.playerInventory; // Get inventory from HomeScene
    }

    create() {
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7).setOrigin(0);
        const panelWidth = this.cameras.main.width * 0.7;
        const panelHeight = this.cameras.main.height * 0.6;
        const panelX = this.cameras.main.centerX;
        const panelY = this.cameras.main.centerY;

        this.add.graphics()
            .fillStyle(0x1a1a1a, 1)
            .fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16)
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16);

        const villagerInfo = this.gameData.villagers.find(v => v.id === this.villager.name);
        const requiredItemName = this.villager.requiredItem.replace(/_/g, ' ');

        this.add.text(panelX, panelY - panelHeight / 2+ 50, `Villager Requires ${requiredItemName}`, {
            fontFamily: 'Georgia, serif', fontSize: '32px', color: '#ffffff', align: 'center'
        }).setOrigin(0.5);

        this.add.text(panelX, panelY - panelHeight / 2 + 120, `This villager will only talk if you trade them a ${requiredItemName}. This will remove the item from your wallet.`, {
            fontFamily: 'Arial', fontSize: '20px', color: '#dddddd', align: 'center', wordWrap: { width: panelWidth - 80 }
        }).setOrigin(0.5);

        // Check if player has the item and show appropriate status
        const hasItem = this.playerInventory && this.playerInventory.has(this.villager.requiredItem);
        
        this.statusText = this.add.text(panelX, panelY + 50, 
            hasItem ? `You have the ${requiredItemName}!` : `You need to find a ${requiredItemName} first.`, 
            {
                fontFamily: 'Arial', fontSize: '22px', 
                color: hasItem ? '#4CAF50' : '#ff6b6b', 
                align: 'center'
            }
        ).setOrigin(0.5);

        // Buttons
        if (hasItem) {
            this.createButton(panelX, panelY + panelHeight / 2 - 120, 'Trade Item', () => this.tradeAndBurnItem());
        }
        this.createButton(panelX, panelY + panelHeight / 2 - 60, 'Close', () => this.closeScene());
    }

    async tradeAndBurnItem() {
        if (!this.suiClient || !this.account) {
            this.statusText.setText("Wallet is not connected.");
            return;
        }

        this.statusText.setText("Checking your wallet for the item...");

        try {
            const itemNftType = itemNftStructType();
            const objects = await this.suiClient.getOwnedObjects({
                owner: this.account,
                filter: { StructType: itemNftType },
                options: { showContent: true },
            });

            let itemToBurn = null;
            for (const item of objects.data) {
                if (item.data?.content?.fields) {
                    const itemName = String.fromCharCode.apply(null, item.data.content.fields.name);
                    if (itemName === this.villager.requiredItem) {
                        itemToBurn = item.data;
                        break;
                    }
                }
            }

            if (!itemToBurn) {
                this.statusText.setText(`You do not have a ${this.villager.requiredItem.replace(/_/g, ' ')}.`);
                return;
            }

            this.statusText.setText(`Found ${this.villager.requiredItem.replace(/_/g, ' ')}! Preparing trade...`);

            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::${MODULE_NAME}::burn_item`,
                arguments: [tx.object(itemToBurn.objectId)],
            });

            await window.onechainWallet.signAndExecuteTransaction({ transaction: tx });

            // Get a reference to HomeScene to update its inventory directly
            const homeScene = this.scene.get('HomeScene');
            if (homeScene && homeScene.playerInventory) {
                // Remove the item from the local inventory immediately
                homeScene.playerInventory.delete(this.villager.requiredItem);
            }

            this.statusText.setText("Trade successful! The villager will talk to you now.");
            this.events.emit('villagerUnlocked', this.villager.name);
            
            // Update the parent scene's inventory from blockchain
            this.time.delayedCall(500, () => {
                if (homeScene) {
                    homeScene.updateInventory();
                }
            });

            this.time.delayedCall(2000, () => this.closeScene());

        } catch (error) {
            console.error("Trade/Burn failed:", error);
            this.statusText.setText("The trade failed. See console for details.");
        }
    }

    closeScene() {
        this.scene.resume('HomeScene');
        this.scene.stop();
    }

    createButton(x, y, text, callback) {
        const button = this.add.text(x, y, text, {
            fontFamily: 'Arial', fontSize: '24px', color: '#000000',
            backgroundColor: '#d4af37', padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        button.on('pointerover', () => button.setBackgroundColor('#f5d56b'));
        button.on('pointerout', () => button.setBackgroundColor('#d4af37'));
        button.on('pointerdown', callback);
        return button;
    }
}
