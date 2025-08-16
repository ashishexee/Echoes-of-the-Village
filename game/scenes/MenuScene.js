import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.walletAddress = null;
        this.playerGender = null;
        this._genderOverlay = null;
        this.enterButton = null;
        this.leaderboardButton = null;
    }

    init(data) {
        if (data && data.account) {
            this.walletAddress = data.account;
        }
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

        // Add semi-transparent overlay and panel
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        const panelWidth = 600;
        const panelHeight = 500;
        this.add.graphics()
            .fillStyle(0x1a1a1a, 0.9)
            .fillRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 20)
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(width / 2 - panelWidth / 2, height / 2 - panelHeight / 2, panelWidth, panelHeight, 20);

        this.add.text(width / 2, height / 2 - 160, 'Echoes of the Village', {
            fontFamily: 'Georgia, serif',
            fontSize: '56px',
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

        // Enter Game opens gender selection modal
        this.enterButton = this.createButton(width / 2, height / 2, 'Enter Game', () => {
            this.showGenderSelection();
        });

        this.leaderboardButton = this.createButton(width / 2, height / 2 + 90, 'Leaderboard', () => {
            this.scene.start('LeaderboardScene');
        });

        let footerText = 'Not Connected';
        if (this.walletAddress) {
            const formattedAddress = `${this.walletAddress.substring(0, 6)}...${this.walletAddress.substring(this.walletAddress.length - 4)}`;
            footerText = `Connected: ${formattedAddress}`;
        }
        this.add.text(width / 2, height / 2 + 210, footerText, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5);
    }

    showGenderSelection() {
        if (this._genderOverlay) return;
        const { width, height } = this.scale;

        // dark blocker to prevent clicking underlying UI
        const blocker = this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setInteractive();

        const panelW = 480;
        const panelH = 220;
        const panelX = width / 2 - panelW / 2;
        const panelY = height / 2 - panelH / 2;

        const panel = this.add.graphics();
        panel.fillStyle(0x1a1a1a, 0.98);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
        panel.lineStyle(2, 0xd4af37, 1);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);

        const title = this.add.text(width / 2, height / 2 - 50, 'Select Gender', {
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Male button
        const maleBtn = this.createButton(width / 2 - 110, height / 2 + 30, 'Male', () => {
            this.playerGender = 'Male';
            this.closeGenderSelectionAndStart();
        });

        // Female button
        const femaleBtn = this.createButton(width / 2 + 110, height / 2 + 30, 'Female', () => {
            this.playerGender = 'Female';
            this.closeGenderSelectionAndStart();
        });

        // Group overlay elements so we can destroy later
        this._genderOverlay = this.add.container(0, 0, [blocker, panel, title, maleBtn, femaleBtn]);
        this._genderOverlay.setDepth(1000);

        // visually de-emphasize underlying buttons
        if (this.enterButton) this.enterButton.alpha = 0.5;
        if (this.leaderboardButton) this.leaderboardButton.alpha = 0.5;
    }

    closeGenderSelectionAndStart() {
        if (this._genderOverlay) {
            this._genderOverlay.destroy();
            this._genderOverlay = null;
        }
        if (this.enterButton) this.enterButton.alpha = 1;
        if (this.leaderboardButton) this.leaderboardButton.alpha = 1;

        // Forward gender to LoadingScene so LoadingScene / VideoScene can consume it
        this.scene.start('LoadingScene', { playerGender: this.playerGender, nextScene: 'VideoScene' });
    }

    createButton(x, y, text, callback) {
        const buttonWidth = 280;
        const buttonHeight = 60;

        const button = this.add.container(x, y);

        const background = this.add
            .graphics()
            .fillStyle(0x333333, 1)
            .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

        const border = this.add
            .graphics()
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

        const buttonText = this.add
            .text(0, 0, text, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        button.add([background, border, buttonText]);
        button.setSize(buttonWidth, buttonHeight);
        button.setInteractive({ useHandCursor: true });

        button.on("pointerover", () => {
            background
                .clear()
                .fillStyle(0x444444, 1)
                .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            border
                .clear()
                .lineStyle(2, 0xffe74a, 1)
                .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            this.tweens.add({
                targets: button,
                scale: 1.05,
                duration: 150,
                ease: "Sine.easeInOut",
            });
        });

        button.on("pointerout", () => {
            background
                .clear()
                .fillStyle(0x333333, 1)
                .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            border
                .clear()
                .lineStyle(2, 0xd4af37, 1)
                .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
            this.tweens.add({
                targets: button,
                scale: 1,
                duration: 150,
                ease: "Sine.easeInOut",
            });
        });

        button.on("pointerdown", callback);

        return button;
    }}