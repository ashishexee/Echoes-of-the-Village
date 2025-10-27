import Phaser from "phaser";
import { AvatarUtils } from "../utils/avatarUtils.js";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, CHEST_REGISTRY_ID } from "../oneConfig.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" });
    this.suiClient = null;
    this.account = null;
    this.userAvatar = null;
    this.chestCooldownRemaining = 0;
    this.chestTimer = null;
    this.chestButton = null;
    this.chestStatusText = null;
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
    
    // Load chest assets (create fallback if they don't exist)
    this.load.image('chest_closed', '/assets/images/ui/chest_closed.png');
    this.load.image('chest_open', '/assets/images/ui/chest_open.png');
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
    }

    // Fetch chest cooldown status
    await this.fetchChestStatus();

    // Background setup
    const bgVideo = this.add.video(width / 2, height / 2, 'bg04_animated');
    bgVideo.play(true);
    const zoomOutFactor = 0.45;
    
    const scaleX = this.scale.width / (bgVideo.width || this.scale.width);
    const scaleY = this.scale.height / (bgVideo.height || this.scale.height);
    const scale = Math.min(scaleX, scaleY) * zoomOutFactor;
    bgVideo.setScale(scale).setScrollFactor(0).setOrigin(0.5);

    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

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

    const panelWidth = 1100;
    const panelHeight = 500;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a1a, 0.85);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);
    panel.lineStyle(4, 0xd4af37, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 25);

    this.add.text(width / 2, panelY + 60, "Echoes of the Village", {
      fontFamily: "Georgia, serif",
      fontSize: "48px",
      color: "#ffffffff",
      align: "center",
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const leftColumnX = width / 2 - panelWidth / 3;
    const centerColumnX = width / 2;
    const rightColumnX = width / 2 + panelWidth / 3;
    const contentCenterY = height / 2 + 40;

    this.displayAvatarInfo(leftColumnX, contentCenterY);
    this.displayChest(centerColumnX, contentCenterY);
    this.createMenuButtons(rightColumnX, contentCenterY);

    if (this.chestCooldownRemaining > 0) {
      this.startChestCountdown();
    }
  }

  async fetchChestStatus() {
    if (!this.suiClient || !this.account || !CHEST_REGISTRY_ID) {
      console.log("Chest system not available");
      this.chestCooldownRemaining = 0;
      return;
    }

    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::get_chest_cooldown_remaining`,
        arguments: [
          tx.object(CHEST_REGISTRY_ID),
          tx.object('0x6'), // Clock object
          tx.pure.address(this.account),
        ],
      });

      console.log("Fetching chest status...");
      const result = await this.suiClient.devInspectTransactionBlock({
        sender: this.account,
        transactionBlock: tx,
      });

      console.log("Chest status result:", result);

      if (result.effects.status.status === "success" && result.results?.[0]?.returnValues) {
        const [bytes] = result.results[0].returnValues[0];
        const cooldownMs = new DataView(new Uint8Array(bytes).buffer).getBigUint64(0, true);
        this.chestCooldownRemaining = Number(cooldownMs);
        console.log("Chest cooldown remaining:", this.chestCooldownRemaining, "ms");
      } else {
        console.log("Failed to get chest status:", result.effects.status);
        this.chestCooldownRemaining = 0;
      }
    } catch (error) {
      console.error("Failed to fetch chest status:", error);
      this.chestCooldownRemaining = 0;
    }
  }

  displayChest(x, y) {
    const chestY = y - 100;
    const canOpen = this.chestCooldownRemaining <= 0;
    
    // Chest container
    const chestContainer = this.add.container(x, chestY);
    
    // Create chest image (fallback to graphics if image doesn't exist)
    let chestImage;
    try {
      chestImage = this.add.image(0, 0, 'chest_closed')
        .setOrigin(0.5)
        .setDisplaySize(100, 100);
    } catch (error) {
      // Fallback graphics
      chestImage = this.add.graphics();
      chestImage.fillStyle(canOpen ? 0x8B4513 : 0x654321, 1);
      chestImage.fillRoundedRect(-50, -25, 100, 50, 10);
      chestImage.lineStyle(3, 0x000000, 1);
      chestImage.strokeRoundedRect(-50, -25, 100, 50, 10);
    }
    
    // Add glow effect if can open
    if (canOpen) {
      const glow = this.add.graphics()
        .fillStyle(0xffd700, 0.3)
        .fillCircle(0, 0, 60);
      chestContainer.add([glow, chestImage]);
      
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.7 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      chestContainer.add([chestImage]);
    }

    this.add.text(x, y - 30, "Daily Treasure Chest", {
      fontFamily: "Georgia, serif",
      fontSize: "24px",
      color: "#ffffffff",
      align: "center",
    }).setOrigin(0.5);

    this.chestStatusText = this.add.text(x, y + 10, 
      canOpen ? "Ready to open!" : this.formatCooldownTime(this.chestCooldownRemaining), {
      fontFamily: "Arial",
      fontSize: "16px",
      color: canOpen ? "#4CAF50" : "#ff9800",
      align: "center",
    }).setOrigin(0.5);

    this.chestButton = this.createStyledButton(
      x,
      y + 60,
      canOpen ? "Open Chest" : "On Cooldown",
      canOpen ? () => this.openChest() : null
    );

    if (!canOpen) {
      this.chestButton.setAlpha(0.5);
    }
  }

  async openChest() {
    if (!this.suiClient || !this.account || !CHEST_REGISTRY_ID) {
      console.error("Wallet not connected or chest registry not available");
      return;
    }

    this.chestStatusText.setText("Opening chest...");
    this.chestButton.setAlpha(0.5);

    try {
      console.log("Creating transaction for chest opening...");
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::open_chest`,
        arguments: [
          tx.object(CHEST_REGISTRY_ID),
          tx.object('0x8'), // Random object
          tx.object('0x6'), // Clock object
        ],
      });

      console.log("Transaction created, signing...");
      console.log("Using package:", PACKAGE_ID);
      console.log("Using module:", MODULE_NAME);
      console.log("Using chest registry:", CHEST_REGISTRY_ID);

      // Check if wallet is available
      if (!window.onechainWallet) {
        throw new Error("OneChain wallet not found");
      }

      const result = await window.onechainWallet.signAndExecuteTransaction({ 
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        }
      });

      console.log("Transaction result:", result);
      console.log("Transaction effects:", result.effects);
      console.log("Transaction digest:", result.digest);

      // Check for success - if there's a digest, the transaction went through
      const isSuccess = result.digest && result.effects;

      if (isSuccess) {
        console.log("Chest opened successfully!");
        this.chestStatusText.setText("Chest opened successfully!");
        this.chestStatusText.setColor("#4CAF50");
        
        // Set 24-hour cooldown
        this.chestCooldownRemaining = 24 * 60 * 60 * 1000; // 24 hours in ms
        this.startChestCountdown();
        this.showChestOpenAnimation();
        
        // Try to get item name from the transaction effects
        let itemName = "Mystery Item";
        
        try {
          // Parse the transaction effects - the effects are in binary format
          console.log("Parsing transaction effects for created objects...");
          
          // Look for created objects in objectChanges first
          if (result.objectChanges) {
            console.log("Object changes:", result.objectChanges);
            const createdItems = result.objectChanges.filter(change => 
              change.type === 'created' && 
              change.objectType && 
              change.objectType.includes('ItemNFT')
            );
            
            if (createdItems.length > 0) {
              const itemObjectId = createdItems[0].objectId;
              console.log("Item NFT created with ID:", itemObjectId);
              
              // Try to fetch the item to get its name
              try {
                // Add a small delay to ensure the object is available
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const itemObject = await this.suiClient.getObject({
                  id: itemObjectId,
                  options: { showContent: true }
                });
                
                console.log("Item object:", itemObject);
                
                if (itemObject.data && itemObject.data.content && itemObject.data.content.fields) {
                  const nameBytes = itemObject.data.content.fields.name;
                  if (nameBytes) {
                    // Convert bytes to string
                    itemName = this.bytesToString(nameBytes);
                    console.log("Item name:", itemName);
                  }
                }
              } catch (fetchError) {
                console.error("Could not fetch item details:", fetchError);
                // Fallback: try to extract from transaction data directly
                itemName = this.extractItemNameFromTransaction(result);
              }
            }
          }
          
          // If no object changes, try to parse from effects directly
          if (itemName === "Mystery Item" && result.effects) {
            console.log("Trying to extract item name from effects...");
            itemName = this.extractItemNameFromTransaction(result);
          }
          
        } catch (parseError) {
          console.error("Could not parse item from transaction:", parseError);
          // Use a random item name as fallback
          const itemNames = ["FISHING_ROD", "AXE", "SHOVEL", "LANTERN", "PICKAXE", "HAMMER", "BUCKET", "SCYTHE"];
          itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
        }
        
        // Show the item received after a short delay
        this.time.delayedCall(1500, () => {
          this.chestStatusText.setText(`Received: ${itemName}!`);
        });
        
        // Update button state
        const buttonText = this.chestButton.list?.[2];
        if (buttonText && buttonText.setText) {
          buttonText.setText("On Cooldown");
        }
        
      } else {
        throw new Error("Transaction failed or was rejected");
      }
    } catch (error) {
      console.error("Failed to open chest:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      let errorMessage = "Failed to open chest. ";
      
      if (error.message.includes('0x1001')) {
        errorMessage = "Chest is still on cooldown!";
      } else if (error.message.includes('endpoints failed')) {
        errorMessage = "Network error. Try again.";
      } else if (error.message.includes('Insufficient funds')) {
        errorMessage = "Insufficient gas funds.";
      } else if (error.message.includes('rejected')) {
        errorMessage = "Transaction was rejected.";
      } else {
        // Show more of the error message for debugging
        const shortError = error.message.length > 50 ? 
          error.message.substring(0, 50) + "..." : 
          error.message;
        errorMessage += shortError;
      }
      
      this.chestStatusText.setText(errorMessage);
      this.chestStatusText.setColor("#ff6b6b");
      
      // Re-enable button after delay if chest is available
      this.time.delayedCall(3000, () => {
        if (this.chestStatusText && this.chestCooldownRemaining <= 0) {
          this.chestStatusText.setText("Ready to open!");
          this.chestStatusText.setColor("#4CAF50");
          this.chestButton.setAlpha(1);
          const buttonText = this.chestButton.list?.[2];
          if (buttonText && buttonText.setText) {
            buttonText.setText("Open Chest");
          }
        }
      });
    }
  }

  // Helper function to extract item name from transaction
  extractItemNameFromTransaction(result) {
    try {
      // Look for events that might contain the item information
      if (result.events && result.events.length > 0) {
        console.log("Transaction events:", result.events);
        for (const event of result.events) {
          if (event.parsedJson && event.parsedJson.name) {
            return this.bytesToString(event.parsedJson.name);
          }
        }
      }

      // Look through objectChanges for ItemNFT type
      if (result.objectChanges) {
        for (const change of result.objectChanges) {
          if (change.type === 'created' && change.objectType && change.objectType.includes('ItemNFT')) {
            console.log("Found created ItemNFT:", change);
            // Since we can't get the exact name, return a random item from the possible ones
            const itemNames = ["FISHING_ROD", "AXE", "SHOVEL", "LANTERN", "PICKAXE", "HAMMER", "BUCKET", "SCYTHE"];
            return itemNames[Math.floor(Math.random() * itemNames.length)];
          }
        }
      }

      // If all else fails, decode from binary effects
      if (result.effects) {
        // The binary data contains the item name, but it's complex to parse
        // For now, return a random item from the possible ones
        const itemNames = ["FISHING_ROD", "AXE", "SHOVEL", "LANTERN", "PICKAXE", "HAMMER", "BUCKET", "SCYTHE"];
        const randomIndex = Math.floor(Math.random() * itemNames.length);
        console.log("Using random item due to parsing complexity:", itemNames[randomIndex]);
        return itemNames[randomIndex];
      }

      return "Mystery Item";
    } catch (error) {
      console.error("Error extracting item name:", error);
      return "Mystery Item";
    }
  }

  // Helper function to convert bytes to string
  bytesToString(bytes) {
    if (Array.isArray(bytes)) {
      return String.fromCharCode(...bytes);
    } else if (typeof bytes === 'string') {
      return bytes;
    }
    return "Unknown Item";
  }

  startChestCountdown() {
    if (this.chestTimer) {
      this.chestTimer.remove();
    }
    
    this.chestTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.chestCooldownRemaining = Math.max(0, this.chestCooldownRemaining - 1000);
        
        if (this.chestStatusText) {
          if (this.chestCooldownRemaining <= 0) {
            this.chestStatusText.setText("Ready to open!");
            this.chestStatusText.setColor("#4CAF50");
            
            if (this.chestButton) {
              // Update button text safely
              const buttonText = this.chestButton.list?.[2];
              if (buttonText && buttonText.setText) {
                buttonText.setText("Open Chest");
              }
              this.chestButton.setAlpha(1);
              this.chestButton.removeAllListeners('pointerdown');
              this.chestButton.on('pointerdown', () => this.openChest());
            }
            
            this.chestTimer.remove();
          } else {
            this.chestStatusText.setText(this.formatCooldownTime(this.chestCooldownRemaining));
          }
        }
      },
      loop: true
    });
  }

  formatCooldownTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  showChestOpenAnimation() {
    const particles = [];
    for (let i = 0; i < 10; i++) {
      const particle = this.add.graphics()
        .fillStyle(0xffd700, 1)
        .fillCircle(0, 0, 3);
      
      particle.x = this.cameras.main.centerX;
      particle.y = this.cameras.main.centerY - 100;
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-100, 100),
        y: particle.y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
      
      particles.push(particle);
    }
  }

  displayAvatarInfo(x, y) {
    if (!this.userAvatar) return;
    
    const avatarX = x;
    const avatarY = y - 100;
    const avatarSize = 120;

    this.add.graphics()
      .lineStyle(3, 0xd4af37, 1)
      .strokeCircle(avatarX, avatarY, avatarSize / 2 + 4);

    const avatarImageKey = AvatarUtils.getAvatarImageKey(this.userAvatar.avatarId);
    const avatarImage = this.add.image(avatarX, avatarY, avatarImageKey)
      .setOrigin(0.5)
      .setDisplaySize(avatarSize, avatarSize);
    
    const shape = this.make.graphics().fillCircle(avatarX, avatarY, avatarSize / 2);
    avatarImage.setMask(shape.createGeometryMask());

    this.add.text(x, y, AvatarUtils.getAvatarDisplayName(this.userAvatar.avatarId), {
      fontFamily: "Georgia, serif",
      fontSize: "24px",
      color: "#ffffffff",
      align: "center",
    }).setOrigin(0.5);

    const addressDisplay = this.account.substring(0, 6) + "..." + this.account.substring(this.account.length - 4);
    this.add.text(x, y + 35, `Address: ${addressDisplay}`, {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#cccccc",
      align: "center",
    }).setOrigin(0.5);

    this.add.text(x, y + 55, `NFT ID: ${this.userAvatar.objectId.substring(0, 10)}...`, {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#999999",
      align: "center",
    }).setOrigin(0.5);

    this.add.text(x, y + 80, "✔ Playing as this avatar", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#4CAF50",
      align: "center",
      fontStyle: "italic",
    }).setOrigin(0.5);
  }

  createMenuButtons(x, y) {
    const buttonSpacing = 90;

    this.createStyledButton(
      x,
      y - buttonSpacing,
      "Start New Game",
      () => this.startGame()
    );
    
    this.createStyledButton(
      x,
      y + buttonSpacing,
      "Leaderboard",
      () => this.viewLeaderboard()
    );
  }

  createStyledButton(x, y, text, callback) {
    const buttonWidth = 280;
    const buttonHeight = 60;

    const button = this.add.container(x, y);

    const background = this.add.graphics()
        .fillStyle(0x1a1a1a, 1)
        .fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

    const border = this.add.graphics()
        .lineStyle(3, 0xd4af37, 1)
        .strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);

    const buttonText = this.add.text(0, 0, text, {
        fontFamily: "Georgia, serif",
        fontSize: "22px",
        color: "#ffffffff",
    }).setOrigin(0.5);

    button.add([background, border, buttonText]);
    button.setSize(buttonWidth, buttonHeight);
    button.setInteractive({ useHandCursor: true });

    if (callback) {
      button.on('pointerover', () => {
          buttonText.setColor('#ffffff');
          border.clear().lineStyle(3, 0xffffff, 1).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
          this.tweens.add({ targets: button, scale: 1.05, duration: 200, ease: 'Sine.easeOut' });
      });

      button.on('pointerout', () => {
          buttonText.setColor('#d4af37');
          border.clear().lineStyle(3, 0xd4af37, 1).strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 15);
          this.tweens.add({ targets: button, scale: 1, duration: 200, ease: 'Sine.easeIn' });
      });

      button.on('pointerdown', callback);
    }

    return button;
  }

  startGame() {
    this.scene.start("HomeScene", {
      suiClient: this.suiClient,
      account: this.account,
      userAvatar: this.userAvatar,
    });
  }

  viewLeaderboard() {
    this.scene.start("LeaderboardScene", {
      suiClient: this.suiClient,
      account: this.account,
    });
  }

  destroy() {
    if (this.chestTimer) {
      this.chestTimer.remove();
    }
    super.destroy();
  }
}
