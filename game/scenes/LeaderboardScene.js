import Phaser from "phaser";

export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    preload() {
        this.load.video(
            "bg_video",
            "assets/cut-scene/bg04_animated.mp4",
            "loadeddata",
            false,
            true
        );
    }

    create() {
          const framePadding = 20;
    const frameWidth = this.cameras.main.width - framePadding * 2;
    const frameHeight = this.cameras.main.height - framePadding * 2;
    const cornerRadius = 30;

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffff00);
    maskShape.fillRoundedRect(framePadding, framePadding, frameWidth, frameHeight, cornerRadius);
    this.cameras.main.setMask(maskShape.createGeometryMask());

    const frame = this.add.graphics();
    frame.lineStyle(10, 0xd4af37, 1);
    frame.strokeRoundedRect(framePadding, framePadding, frameWidth, frameHeight, cornerRadius);
    frame.setDepth(100);
        const { width, height } = this.scale;

        // Add animated background
        const bgVideo = this.add.video(width / 2, height / 2, "bg_video");
        bgVideo.play(true);
        const zoomOutFactor = 0.45;
        
        const scaleX = width / (bgVideo.width || width);
        const scaleY = height / (bgVideo.height || height);
        const scale = Math.min(scaleX, scaleY) * zoomOutFactor;
        bgVideo.setScale(scale).setScrollFactor(0).setOrigin(0.5);
        bgVideo.setVolume(15);
        bgVideo.setMute(false);
        bgVideo.setActive(true);

        this.input.once("pointerdown", () => {
            bgVideo.setMute(false);
        }, this);

        // Add semi-transparent overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // Create panel
        const panelWidth = 600;
        const panelHeight = 500;
        const panelX = width / 2;
        const panelY = height / 2;

        this.add.graphics()
            .fillStyle(0x1a1a1a, 0.9)
            .fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20)
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 20);

        // Add title
        this.add.text(width / 2, panelY - 180, 'LEADERBOARD', {
            fontFamily: 'Georgia, serif',
            fontSize: '48px',
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

        // Add 'Coming Soon' text
        this.add.text(width / 2, panelY, 'Coming Soon...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Add instruction text
        this.add.text(width / 2, panelY + 200, 'Press SPACE to return to village', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Add key event
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });
    }
}