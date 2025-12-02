import Phaser from "phaser";
import { Transaction } from '@mysten/sui/transactions';
import { AvatarUtils } from "../utils/avatarUtils.js";

import { PACKAGE_ID, MODULE_NAME, AVATAR_REGISTRY_OBJECT_ID, RANDOM_OBJECT_ID } from "../oneConfig.js";

export class AvatarScene extends Phaser.Scene {
  constructor() {
    super({ key: "AvatarScene" });
    this.suiClient = null;
    this.account = null;
    this.selectedAvatarId = null;
    this.previousSelectedBox = null;
  }

  init(data) {
    this.suiClient = data?.suiClient;
    this.account = data?.account;
  }

  preload() {
    // Load all 10 avatar images
    for (let i = 1; i <= 10; i++) {
      this.load.image(`mc_${i}`, `/assets/images/characters/mc_${i}.png`);
    }

    // --- NEW: Load assets for the premium design ---
    this.load.video('bg04_animated', '/assets/cut-scene/bg04_animated.mp4', 'loadeddata', false, true);
  }

  async create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // --- NEW: Add looping video background ---
    const bgVideo = this.add.video(width / 2, height / 2, 'bg04_animated');
    bgVideo.play(true);
    const zoomOutFactor = 0.45;
    
    const scaleX = this.scale.width / (bgVideo.width || this.scale.width);
    const scaleY = this.scale.height / (bgVideo.height || this.scale.height);
    const scale = Math.min(scaleX, scaleY) * zoomOutFactor;
    bgVideo.setScale(scale).setScrollFactor(0).setOrigin(0.5);

    // Add a dark overlay to match other scenes
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // Check if user already has an avatar
    const hasAvatar = await this.checkUserHasAvatar();
    if (hasAvatar) {
      console.log("User already has an avatar, proceeding to game...");
      const userAvatar = await AvatarUtils.getUserAvatar(this.suiClient, this.account);
      this.scene.start("MenuScene", { 
        suiClient: this.suiClient, 
        account: this.account,
        userAvatar: userAvatar
      });
      return;
    }

    // Show the redesigned avatar selection UI
    this.showAvatarSelectionUI(width, height);
  }

  async checkUserHasAvatar() {
    if (!this.suiClient || !this.account) {
      console.warn("Wallet not connected, cannot check avatar");
      return false;
    }
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::has_avatar`,
        arguments: [tx.object(AVATAR_REGISTRY_OBJECT_ID), tx.pure.address(this.account)],
      });
      const result = await this.suiClient.devInspectTransactionBlock({
        sender: this.account,
        transactionBlock: tx,
      });
      if (result.effects.status.status === 'success' && result.results?.[0]?.returnValues) {
        const [bytes] = result.results[0].returnValues[0];
        return new DataView(new Uint8Array(bytes).buffer).getUint8(0) === 1;
      }
      return false;
    } catch (error) {
      console.error("Error checking for avatar:", error);
      return false;
    }
  }

  showAvatarSelectionUI(width, height) {
    // --- IMPROVED: Create a central panel with golden border ---
    const panelWidth = 1000;
    const panelHeight = 700;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x000000, 0.85); // Dark, semi-transparent background
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 30);
    panel.lineStyle(5, 0xd4af37, 1); // Golden border
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 30);

    // Title with premium styling
    this.add.text(width / 2, panelY + 50, "Choose Your Avatar", {
      fontFamily: "Georgia, serif",
      fontSize: "48px",
      color: "#d4af37",
      align: "center",
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setDepth(102);

    // Subtitle
    this.add.text(width / 2, panelY + 105, "Select an avatar to begin your journey", {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#cccccc",
      align: "center",
    }).setOrigin(0.5).setDepth(102);

    // Avatar grid - centered and properly spaced
    const avatarSize = 120;
    const gridCenterX = width / 2;
    const gridStartY = panelY + 170;
    const spacingX = 160;
    const spacingY = 165;

    for (let i = 1; i <= 10; i++) {
      const row = Math.floor((i - 1) / 5);
      const col = (i - 1) % 5;
      const xOffset = (col - 2) * spacingX; // Center around 0
      const x = gridCenterX + xOffset;
      const y = gridStartY + row * spacingY;

      const box = this.add.graphics().setDepth(102);
      box.fillStyle(0x1a1a2e, 0.8);
      box.fillRoundedRect(x - avatarSize / 2, y - avatarSize / 2, avatarSize, avatarSize, 15);
      box.lineStyle(3, 0x666699, 1);
      box.strokeRoundedRect(x - avatarSize / 2, y - avatarSize / 2, avatarSize, avatarSize, 15);

      const avatarImage = this.add.image(x, y, `mc_${i}`)
        .setOrigin(0.5)
        .setDisplaySize(avatarSize - 20, avatarSize - 20)
        .setDepth(103)
        .setInteractive();

      avatarImage.on("pointerdown", () => this.selectAvatar(i, box, x, y, avatarSize));
    }

    // --- IMPROVED: Premium button styling ---
    const randomAvatarButton = this.add.text(width / 2, panelY + panelHeight - 60, "Get Random Avatar", {
      fontFamily: "Georgia, serif",
      fontSize: "24px",
      color: "#d4af37",
      align: "center",
      stroke: '#000000',
      strokeThickness: 4,
      backgroundColor: "#1a1a2e",
      padding: { x: 30, y: 12 }
    }).setOrigin(0.5).setDepth(102).setInteractive({ useHandCursor: true });

    randomAvatarButton.on('pointerdown', () => {
      this.mintRandomAvatar();
    });
  }

  selectAvatar(avatarId, box, x, y, avatarSize) {
    // Deselect previous box
    if (this.previousSelectedBox) {
      this.previousSelectedBox.lineStyle(3, 0x666699, 1).strokeRoundedRect(
          this.previousSelectedBox.x, this.previousSelectedBox.y, 
          this.previousSelectedBox.width, this.previousSelectedBox.height, 15
      );
    }
    
    this.selectedAvatarId = avatarId;
    console.log(`Selected Avatar #${avatarId}`);

    // Highlight the new selected box
    box.lineStyle(4, 0xd4af37, 1).strokeRoundedRect(x - avatarSize / 2, y - avatarSize / 2, avatarSize, avatarSize, 15);
    this.previousSelectedBox = box;
  }


  async mintRandomAvatar() {
    if (!this.suiClient || !this.account) {
      this.showError("Wallet not connected.");
      return;
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setDepth(200);
    const loadingText = this.add.text(width / 2, height / 2 - 50, "Minting your avatar...", {
      fontFamily: "Arial", fontSize: "28px", color: "#d4af37", align: "center",
      backgroundColor: "rgba(0,0,0,0.9)", padding: { x: 30, y: 20 },
    }).setOrigin(0.5).setDepth(201);
    const statusText = this.add.text(width / 2, height / 2 + 50, "Please confirm in your wallet", {
      fontFamily: "Arial", fontSize: "16px", color: "#cccccc",
    }).setOrigin(0.5).setDepth(201);

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::ensure_avatar`,
        arguments: [tx.object(AVATAR_REGISTRY_OBJECT_ID), tx.object(RANDOM_OBJECT_ID)],
      });
      const result = await window.onechainWallet.signAndExecuteTransaction({ transaction: tx });
      console.log("Avatar minting transaction:", result);

      loadingText.setText("Avatar minted successfully!");
      statusText.setText("Fetching your avatar details...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userAvatar = await AvatarUtils.getUserAvatar(this.suiClient, this.account);
      loadingText.setText(`You got Avatar #${userAvatar.avatarId}!`);
      statusText.setText("Entering the village...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      this.scene.start("MenuScene", {
        suiClient: this.suiClient,
        account: this.account,
        userAvatar: userAvatar,
      });
    } catch (error) {
      console.error("Avatar minting failed:", error);
      loadingText.setText("Avatar minting failed");
      statusText.setText(error.message || "See console for details").setStyle({ color: "#ff6b6b" });
      this.time.delayedCall(3000, () => {
        loadingOverlay.destroy();
        loadingText.destroy();
        statusText.destroy();
      });
    }
  }

  showError(message) {
    const errorText = this.add.text(this.cameras.main.width / 2, 50, message, {
      fontFamily: "Arial", fontSize: "20px", color: "#ff6b6b",
      backgroundColor: "rgba(0,0,0,0.9)", padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(300);
    this.time.delayedCall(3000, () => errorText.destroy());
  }
}
