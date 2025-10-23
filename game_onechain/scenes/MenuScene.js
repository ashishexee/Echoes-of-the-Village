import Phaser from "phaser";
import { AvatarUtils } from "../utils/avatarUtils.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
    this.suiClient = null;
    this.account = null;
    this.userAvatar = null; // Store user's avatar data
  }

  init(data) {
    this.suiClient = data?.suiClient;
    this.account = data?.account;
  }

  preload() {
    // Load all 10 avatar images (for preview/selection)
    for (let i = 1; i <= 10; i++) {
      this.load.image(`avatar_${i}`, `/assets/images/characters/mc_${i}.png`);
    }
    this.load.video('bg04_animated', '/assets/cut-scene/bg04_animated.mp4', 'loadeddata', false, true);
  }

  async create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fetch user's avatar
    try {
      this.userAvatar = await AvatarUtils.getUserAvatar(this.suiClient, this.account);
      if (!this.userAvatar) {
        console.error("User has no avatar");
        this.scene.start("AvatarScene", {
          suiClient: this.suiClient,
          account: this.account,
        });
        return;
      }
      console.log("User Avatar:", this.userAvatar);
    } catch (error) {
      console.error("Failed to fetch user avatar:", error);
      // Optional: Show an error message on screen
    }

    // --- NEW: Polished background and layout ---
    const bgVideo = this.add.video(width / 2, height / 2, 'bg04_animated');
    bgVideo.play(true);
    const zoomOutFactor = 0.45;
    
    const scaleX = this.scale.width / (bgVideo.width || this.scale.width);
    const scaleY = this.scale.height / (bgVideo.height || this.scale.height);
    const scale = Math.min(scaleX, scaleY) * zoomOutFactor;
    bgVideo.setScale(scale).setScrollFactor(0).setOrigin(0.5);

    // Add a dark overlay to match other scenes
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // --- Keep the screen frame effect ---
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

    // Main panel with a more refined look
    const panelWidth = 900;
    const panelHeight = 500;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a1a, 0.85); // Darker, more solid background
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);
    panel.lineStyle(4, 0xd4af37, 1); // Golden border
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);

    // Game Title
    this.add.text(width / 2, panelY + 60, "Echoes of the Village", {
      fontFamily: "Georgia, serif",
      fontSize: "48px",
      color: "#ffffffff",
      align: "center",
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Decorative separator line
    const separator = this.add.graphics();
    separator.lineStyle(2, 0xd4af37, 0.5);
    separator.moveTo(width / 2, panelY + 120);
    separator.lineTo(width / 2, panelY + panelHeight - 50);
    separator.strokePath();

    // Define layout columns
    const leftColumnX = width / 2 - panelWidth / 4;
    const rightColumnX = width / 2 + panelWidth / 4;
    const contentCenterY = height / 2 + 40;

    // Display user's avatar info in the left column
    this.displayAvatarInfo(leftColumnX, contentCenterY);

    // Display menu options in the right column
    this.createMenuButtons(rightColumnX, contentCenterY);
  }

  displayAvatarInfo(x, y) {
    // Avatar image with a border and circular mask
    const avatarX = x;
    const avatarY = y - 100;
    const avatarSize = 150;

    this.add.graphics()
      .lineStyle(3, 0xd4af37, 1)
      .strokeCircle(avatarX, avatarY, avatarSize / 2 + 4);

    const avatarImageKey = AvatarUtils.getAvatarImageKey(this.userAvatar.avatarId);
    const avatarImage = this.add.image(avatarX, avatarY, avatarImageKey)
      .setOrigin(0.5)
      .setDisplaySize(avatarSize, avatarSize);
    
    const shape = this.make.graphics().fillCircle(avatarX, avatarY, avatarSize / 2);
    avatarImage.setMask(shape.createGeometryMask());

    // Avatar name
    this.add.text(x, y, AvatarUtils.getAvatarDisplayName(this.userAvatar.avatarId), {
      fontFamily: "Georgia, serif",
      fontSize: "28px",
      color: "#ffffffff",
      align: "center",
    }).setOrigin(0.5);

    // Player address (truncated)
    const addressDisplay = this.account.substring(0, 6) + "..." + this.account.substring(this.account.length - 4);
    this.add.text(x, y + 40, `Address: ${addressDisplay}`, {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#cccccc",
      align: "center",
    }).setOrigin(0.5);

    // Avatar ID info
    this.add.text(x, y + 70, `NFT ID: ${this.userAvatar.objectId.substring(0, 10)}...`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#999999",
      align: "center",
    }).setOrigin(0.5);

    // "Playing as" label
    this.add.text(x, y + 110, "✔ Playing as this avatar", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#4CAF50",
      align: "center",
      fontStyle: "italic",
    }).setOrigin(0.5);
  }

  createMenuButtons(x, y) {
    const buttonSpacing = 90;

    // Start Game button
    this.createStyledButton(
      x,
      y - buttonSpacing,
      "Start New Game",
      () => this.startGame()
    );
    // Leaderboard button
    this.createStyledButton(
      x,
      y + buttonSpacing,
      "Leaderboard",
      () => this.viewLeaderboard()
    );
  }

  createStyledButton(x, y, text, callback) {
    const buttonWidth = 320;
    const buttonHeight = 70;

    const button = this.add.container(x, y);

    const background = this.add.graphics()
        .fillStyle(0x1a1a1a, 1)
        .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 18);

    const border = this.add.graphics()
        .lineStyle(3, 0xd4af37, 1)
        .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 18);

    const buttonText = this.add.text(0, 0, text, {
        fontFamily: "Georgia, serif",
        fontSize: "28px",
        color: "#ffffffff",
    }).setOrigin(0.5);

    button.add([background, border, buttonText]);
    button.setSize(buttonWidth, buttonHeight);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
        buttonText.setColor('#ffffff');
        border.clear().lineStyle(3, 0xffffff, 1).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 18);
        this.tweens.add({ targets: button, scale: 1.05, duration: 200, ease: 'Sine.easeOut' });
    });

    button.on('pointerout', () => {
        buttonText.setColor('#d4af37');
        border.clear().lineStyle(3, 0xd4af37, 1).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 18);
        this.tweens.add({ targets: button, scale: 1, duration: 200, ease: 'Sine.easeIn' });
    });

    button.on('pointerdown', callback);

    return button;
  }

  startGame() {
    this.scene.start("HomeScene", {
      suiClient: this.suiClient,
      account: this.account,
      userAvatar: this.userAvatar, // Pass avatar data to gameplay
    });
  }

  viewLeaderboard() {
    this.scene.start("LeaderboardScene", {
      suiClient: this.suiClient,
      account: this.account,
    });
  }
}
