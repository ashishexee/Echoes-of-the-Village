import Phaser from 'phaser';
import { chooseLocation } from '../api';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.timerText = null;
        this.elapsedSeconds = 0;
        this.inaccessibleLocations = [];
        this._locationOverlay = null;
    }

    init(data) {
        if (data && data.inaccessibleLocations) {
            this.inaccessibleLocations = data.inaccessibleLocations;
        }
    }

    create() {
        this.elapsedSeconds = this.registry.get('elapsedTime') || 0;

        this.timerText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 70,
            this.formatTime(this.elapsedSeconds),
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#d4af37',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        this.createInventoryButton();

        if (this.inaccessibleLocations && this.inaccessibleLocations.length > 0) {
            this.createLocationButton();
        }

        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    createLocationButton() {
        const button = this.add.text(
            150,
            this.cameras.main.height - 70,
            'Choose Location',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#000000',
                backgroundColor: '#d4af37',
                padding: { x: 15, y: 8 },
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            this.showLocationChoices();
        });

        button.on('pointerover', () => button.setBackgroundColor('#f5d56b'));
        button.on('pointerout', () => button.setBackgroundColor('#d4af37'));
    }

    showLocationChoices() {
        if (this._locationOverlay) return;

        const { width, height } = this.cameras.main;

        const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0).setInteractive();

        const panelHeight = 80 + (this.inaccessibleLocations.length * 70);
        const panelWidth = 400;
        const panelX = width / 2 - panelWidth / 2;
        const panelY = height / 2 - panelHeight / 2;

        const panel = this.add.graphics()
            .fillStyle(0x1a1a1a, 0.95)
            .fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15)
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);

        const title = this.add.text(width / 2, panelY + 40, 'Choose a Location to Investigate', {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const locationButtons = this.inaccessibleLocations.map((location, index) => {
            const buttonY = panelY + 90 + (index * 60);
            const button = this.add.text(width / 2, buttonY, location, {
                fontFamily: 'Arial', fontSize: '20px', color: '#000000',
                backgroundColor: '#d4af37', padding: { x: 20, y: 10 },
                align: 'center',
                fixedWidth: 300
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            button.on('pointerdown', () => this.selectLocation(location));
            button.on('pointerover', () => button.setBackgroundColor('#f5d56b'));
            button.on('pointerout', () => button.setBackgroundColor('#d4af37'));
            return button;
        });

        this._locationOverlay = this.add.container(0, 0, [blocker, panel, title, ...locationButtons]);
        this._locationOverlay.setDepth(200);
    }

    async selectLocation(location) {
        if (this._locationOverlay) {
            this._locationOverlay.destroy();
            this._locationOverlay = null;
        }
        
        const feedbackText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `Investigating ${location}...`,
            {
                fontFamily: 'Arial', fontSize: '28px', color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setDepth(201);

        const result = await chooseLocation(location);

        if (result) {
            feedbackText.setText(`Investigation successful!`);
        } else {
            feedbackText.setText(`Investigation failed. Please try again.`);
        }

        this.time.delayedCall(2000, () => {
            feedbackText.destroy();
        });
    }

    createInventoryButton() {
        const button = this.add.text(
            this.cameras.main.width - 150,
            this.cameras.main.height - 70,
            'Inventory',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#000000',
                backgroundColor: '#d4af37',
                padding: { x: 15, y: 8 },
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            const homeScene = this.scene.get('HomeScene');
            if (homeScene && homeScene.scene.isActive()) {
                homeScene.scene.pause();
                this.scene.launch('InventoryScene', {
                    inventory: Array.from(homeScene.playerInventory)
                });
            }
        });

        button.on('pointerover', () => button.setBackgroundColor('#f5d56b'));
        button.on('pointerout', () => button.setBackgroundColor('#d4af37'));
    }

    updateTimer() {
        this.elapsedSeconds++;
        this.registry.set('elapsedTime', this.elapsedSeconds);
        this.timerText.setText(this.formatTime(this.elapsedSeconds));
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}