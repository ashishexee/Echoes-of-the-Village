import Phaser from "phaser";
import { AvatarUtils } from "../utils/avatarUtils.js";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ID, MODULE_NAME, CHEST_REGISTRY_ID , REWARD_POOL_OBJECT_ID,CLOCK_OBJECT_ID} from "../oneConfig.js";

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
    this.statusText = null; // ADD THIS LINE

    // spinner state
    this.spinner = null;
    this.spinnerTween = null;
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

    // ADD THIS: Initialize status text (hidden by default)
    this.statusText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 200,
      '',
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#d4af37',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setDepth(1000).setVisible(false);
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

    // Create a spinner next to the chest (hidden by default)
    if (!this.spinner) {
      this.spinner = this.createSpinner(x + 90, y + 10);
      this.spinner.setDepth(200);
      this.spinner.setVisible(false);
    }
  }

  async openChest() {
    if (!this.suiClient || !this.account || !CHEST_REGISTRY_ID) {
      console.error("Wallet not connected or chest registry not available");
      return;
    }

    // show spinner while processing
    this.showSpinner();
    this.chestStatusText.setText("Opening chest...");
    this.chestButton.setAlpha(0.5);

    try {
      console.log("Creating transaction for chest opening...");
      
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::open_chest`,
        arguments: [
          tx.object(CHEST_REGISTRY_ID),
          tx.object('0x8'),
          tx.object('0x6'),
        ],
      });

      console.log("Transaction created, signing...");

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

      // Extract the item name from the transaction result
      const itemName = this.extractItemNameFromTransaction(result);

      // If itemName is placeholder, wait for final parsing before showing
      if (itemName === "NEW_ITEM" || itemName === "MYSTERY_ITEM") {
        this.chestStatusText.setText("Processing item...");
        // fetchCreatedItemName will update status text when real name available
      } else {
        // immediate final name available, update UI
        this.chestStatusText.setText(`You received: ${itemName.replace(/_/g, ' ')}!`);
      }

      // Hide spinner once we've at least started background parsing
      this.hideSpinner();

      // Update cooldown (24 hours)
      this.chestCooldownRemaining = 24 * 60 * 60 * 1000;
      this.chestButton.setAlpha(0.5);
      
      // **FIX: Properly access the button text element**
      const buttonText = this.chestButton.list?.[2];
      if (buttonText && buttonText.setText) {
        buttonText.setText("On Cooldown");
      }
      
      this.startChestCountdown();
      
      // Show celebration animation
      this.showChestOpenAnimation();
      
      // **NEW: Update HomeScene inventory if it exists**
      const homeScene = this.scene.get('HomeScene');
      if (homeScene && homeScene.playerInventory) {
        homeScene.playerInventory.add(itemName);
        console.log(`Added ${itemName} to HomeScene inventory`);
      }
      
      // **NEW: Store the item globally so it can be picked up when HomeScene starts**
      const gameRegistry = this.registry;
      const currentItems = gameRegistry.get('pendingInventoryItems') || [];
      currentItems.push(itemName);
      gameRegistry.set('pendingInventoryItems', currentItems);
      
      // **NEW: If we got a placeholder item name, wait a bit for the real name**
      if (itemName === "NEW_ITEM" || itemName === "MYSTERY_ITEM") {
        console.log("Got placeholder item name, waiting for real name...");
        // fetchCreatedItemName will update UI when available
      }
      
    } catch (error) {
      console.error("Failed to open chest:", error);
      this.hideSpinner();
      this.chestStatusText.setText("Failed to open chest");
      this.chestButton.setAlpha(1);
      
      setTimeout(() => {
        this.chestStatusText.setText("Ready to open!");
      }, 3000);
    }
  }

  // Helper function to extract item name from transaction
  extractItemNameFromTransaction(result) {
    try {
      console.log("Full transaction result:", JSON.stringify(result, null, 2));
      
      // First check objectChanges (if available)
      if (result.objectChanges && result.objectChanges.length > 0) {
        for (const change of result.objectChanges) {
          console.log("Object change:", change);
          if (change.type === 'created' && change.objectType && change.objectType.includes('ItemNFT')) {
            const objectId = change.objectId;
            console.log("Found created ItemNFT with ID:", objectId);
            
            this.lastCreatedItemId = objectId;
            this.fetchCreatedItemName(objectId);
            return "NEW_ITEM";
          }
        }
      }

      // If objectChanges is empty, parse the effects field
      if (result.effects) {
        console.log("Parsing effects field...");
        
        // Try to parse the effects as base64 or hex
        let effectsData;
        if (typeof result.effects === 'string') {
          try {
            // Try to decode as base64
            const effectsBytes = Uint8Array.from(atob(result.effects), c => c.charCodeAt(0));
            effectsData = effectsBytes;
            console.log("Decoded effects bytes:", effectsData);
          } catch (e) {
            console.log("Effects is not base64, treating as string");
            effectsData = result.effects;
          }
        }
        
        // Also check if effects has created objects in different format
        if (result.effects.created) {
          for (const created of result.effects.created) {
            console.log("Created object from effects:", created);
            if (created.objectType && created.objectType.includes('ItemNFT')) {
              const objectId = created.reference?.objectId || created.objectId;
              console.log("Found ItemNFT creation from effects:", objectId);
              
              this.lastCreatedItemId = objectId;
              this.fetchCreatedItemName(objectId);
              return "NEW_ITEM";
            }
          }
        }
      }

      // NEW: Check events for Transfer events that might indicate item creation
      if (result.events && result.events.length > 0) {
        console.log("Checking events for item creation...");
        for (const event of result.events) {
          console.log("Event:", event);
          if (event.type && (event.type.includes('Transfer') || event.type.includes('ItemCreated'))) {
            if (event.parsedJson) {
              console.log("Event parsed JSON:", event.parsedJson);
              // Look for object ID in the event
              if (event.parsedJson.object_id || event.parsedJson.objectId) {
                const objectId = event.parsedJson.object_id || event.parsedJson.objectId;
                console.log("Found object ID in event:", objectId);
                this.lastCreatedItemId = objectId;
                this.fetchCreatedItemName(objectId);
                return "NEW_ITEM";
              }
            }
          }
        }
      }

      // NEW: Parse the digest to try to find created objects via a different method
      if (result.digest) {
        console.log("Using digest to fetch transaction details:", result.digest);
        this.fetchTransactionDetails(result.digest);
        return "NEW_ITEM";
      }

      console.log("Could not extract item name, using fallback");
      return "MYSTERY_ITEM";
    } catch (error) {
      console.error("Error extracting item name:", error);
      return "UNKNOWN_ITEM";
    }
  }

  // NEW: Method to fetch transaction details using the digest
  async fetchTransactionDetails(digest) {
    try {
      console.log("Fetching transaction details for digest:", digest);
      
      // Wait a bit for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const txDetails = await this.suiClient.getTransactionBlock({
        digest: digest,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
          showInput: true,
          showRawInput: false,
        }
      });
      
      console.log("Transaction details:", txDetails);
      
      // Check object changes in the detailed response
      if (txDetails.objectChanges) {
        for (const change of txDetails.objectChanges) {
          console.log("Detailed object change:", change);
          if (change.type === 'created' && change.objectType && change.objectType.includes('ItemNFT')) {
            const objectId = change.objectId;
            console.log("Found ItemNFT in detailed transaction:", objectId);
            
            this.lastCreatedItemId = objectId;
            this.fetchCreatedItemName(objectId);
            return;
          }
        }
      }
      
      // Check effects in the detailed response
      if (txDetails.effects && txDetails.effects.created) {
        for (const created of txDetails.effects.created) {
          console.log("Detailed created object:", created);
          if (created.objectType && created.objectType.includes('ItemNFT')) {
            const objectId = created.reference.objectId;
            console.log("Found ItemNFT in detailed effects:", objectId);
            
            this.lastCreatedItemId = objectId;
            this.fetchCreatedItemName(objectId);
            return;
          }
        }
      }
      
      console.log("Could not find ItemNFT in detailed transaction");
    } catch (error) {
      console.error("Error fetching transaction details:", error);
    }
  }

  // NEW: Method to fetch the created item name
  async fetchCreatedItemName(objectId) {
    try {
      console.log("Fetching item details for:", objectId);
      
      // Add a longer delay to ensure the object is available on-chain
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const objectDetails = await this.suiClient.getObject({
        id: objectId,
        options: { 
          showContent: true,
          showType: true,
          showOwner: true,
          showPreviousTransaction: true
        }
      });
      
      console.log("Object details:", objectDetails);
      
      if (objectDetails.data && objectDetails.data.content && objectDetails.data.content.fields) {
        const itemName = this.bytesToString(objectDetails.data.content.fields.name);
        console.log("Extracted item name:", itemName);
        
        // NEW: Show a celebratory text popup on screen
        const displayText = this.add.text(
          this.cameras.main.centerX,
          this.cameras.main.centerY - 150,
          `You received: ${itemName.replace(/_/g, ' ')}!`,
          {
            fontFamily: "Georgia, serif",
            fontSize: "32px",
            color: "#ffd700",
            align: "center",
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 30, y: 20 }
          }
        ).setOrigin(0.5).setDepth(500);

        // Animate it: fade in, stay, then fade out
        this.tweens.add({
          targets: displayText,
          alpha: { from: 0, to: 1 },
          duration: 300,
          ease: 'Power2.out'
        });

        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: displayText,
            alpha: 0,
            duration: 500,
            ease: 'Power2.in',
            onComplete: () => displayText.destroy()
          });
        });
        
        // Update the status text with the correct item name
        if (this.chestStatusText) {
          this.chestStatusText.setText(`You received: ${itemName.replace(/_/g, ' ')}!`);
        }
        
        // Update inventories with the correct item name
        const homeScene = this.scene.get('HomeScene');
        if (homeScene && homeScene.playerInventory) {
          // Remove the placeholder and add the real item
          homeScene.playerInventory.delete("NEW_ITEM");
          homeScene.playerInventory.delete("MYSTERY_ITEM");
          homeScene.playerInventory.add(itemName);
          console.log(`Updated HomeScene inventory with correct item: ${itemName}`);
        }
        
        // Update pending items with correct name
        const gameRegistry = this.registry;
        const currentItems = gameRegistry.get('pendingInventoryItems') || [];
        const updatedItems = currentItems.filter(item => 
          item !== "NEW_ITEM" && item !== "MYSTERY_ITEM"
        );
        updatedItems.push(itemName);
        gameRegistry.set('pendingInventoryItems', updatedItems);
        
        return itemName;
      } else {
        console.error("Could not extract item details from object, trying alternative approach");
        
        // Try to get all objects owned by the user and find the most recent ItemNFT
        await this.findRecentItemNFT();
      }
    } catch (error) {
      console.error("Error fetching created item name:", error);
      
      // Try alternative approach - get all user's ItemNFTs and find the newest one
      await this.findRecentItemNFT();
    }
  }

  // NEW: Alternative method to find the most recently created ItemNFT
  async findRecentItemNFT() {
    try {
      console.log("Trying alternative approach: finding recent ItemNFT for user");
      
      const itemNftType = `${PACKAGE_ID}::${MODULE_NAME}::ItemNFT`;
      const objects = await this.suiClient.getOwnedObjects({
        owner: this.account,
        filter: { StructType: itemNftType },
        options: { 
          showContent: true,
          showType: true,
          showPreviousTransaction: true
        },
      });

      console.log("User's ItemNFTs:", objects);

      if (objects.data && objects.data.length > 0) {
        // Sort by creation time or use the last one
        const mostRecentItem = objects.data[objects.data.length - 1];
        
        if (mostRecentItem.data && mostRecentItem.data.content && mostRecentItem.data.content.fields) {
          const itemName = this.bytesToString(mostRecentItem.data.content.fields.name);
          console.log("Found recent item:", itemName);
          
          // Update the status text with the correct item name
          if (this.chestStatusText) {
            this.chestStatusText.setText(`You received: ${itemName.replace(/_/g, ' ')}!`);
          }
          
          // Update inventories with the correct item name
          const homeScene = this.scene.get('HomeScene');
          if (homeScene && homeScene.playerInventory) {
            homeScene.playerInventory.delete("NEW_ITEM");
            homeScene.playerInventory.delete("MYSTERY_ITEM");
            homeScene.playerInventory.add(itemName);
            console.log(`Updated HomeScene inventory with correct item: ${itemName}`);
          }
          
          // Update pending items with correct name
          const gameRegistry = this.registry;
          const currentItems = gameRegistry.get('pendingInventoryItems') || [];
          const updatedItems = currentItems.filter(item => 
            item !== "NEW_ITEM" && item !== "MYSTERY_ITEM"
          );
          updatedItems.push(itemName);
          gameRegistry.set('pendingInventoryItems', updatedItems);
          
          return itemName;
        }
      }
      
      console.log("Could not find any ItemNFTs for user");
    } catch (error) {
      console.error("Error in findRecentItemNFT:", error);
    }
  }

  // Helper function to convert bytes to string
  bytesToString(bytes) {
    try {
      console.log("Converting bytes to string:", bytes);
      
      if (Array.isArray(bytes)) {
        // Convert array of numbers to string
        const result = String.fromCharCode(...bytes);
        console.log("Converted array to string:", result);
        return result;
      } else if (typeof bytes === 'string') {
        console.log("Already a string:", bytes);
        return bytes;
      } else if (bytes && typeof bytes === 'object') {
        // Handle object format that might contain the actual bytes
        if (bytes.data && Array.isArray(bytes.data)) {
          const result = String.fromCharCode(...bytes.data);
          console.log("Converted object.data to string:", result);
          return result;
        }
        // Try to convert object values if it's a different format
        const values = Object.values(bytes);
        if (values.length > 0 && typeof values[0] === 'number') {
          const result = String.fromCharCode(...values);
          console.log("Converted object values to string:", result);
          return result;
        }
      }
      
      console.log("Could not convert bytes, using fallback");
      return "Unknown Item";
    } catch (error) {
      console.error("Error in bytesToString:", error, "Input:", bytes);
      return "Unknown Item";
    }
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

  async startGame() {
    if (!this.suiClient || !this.account) {
      console.error("Wallet not connected");
      return;
    }

    const loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 150, 'Paying Entry Fee (0.05 OCT)...', {
      fontFamily: 'Arial', fontSize: '24px', color: '#d4af37', backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(1000);

    try {
      // Show and update status text
      if (this.statusText) {
        this.statusText.setVisible(true);
        this.statusText.setText('Creating transaction...');
      }
      
      const tx = new Transaction();
      
      // 1. Collect entrance fee and add to reward pool
      const ENTRANCE_FEE = 50000000; // 0.05 OCT
      const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(ENTRANCE_FEE)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::start_game_with_fee`,
        arguments: [
          tx.object(REWARD_POOL_OBJECT_ID),
          feeCoin,
          tx.object(CLOCK_OBJECT_ID),
        ],
      });

      const result = await window.onechainWallet.signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showObjectChanges: true
      }
    });
    console.log("FULL transaction result:", JSON.stringify(result, null, 2));
    
    loadingText.setText("Payment successful! Starting game...");
    loadingText.setColor("#4CAF50");

    // Hide status text
    if (this.statusText) {
      this.statusText.setVisible(false);
    }

    // Small delay before transitioning
    this.time.delayedCall(1000, () => {
      loadingText.destroy();
      this.scene.start('HomeScene', {
        account: this.account,
        suiClient: this.suiClient,
        userAvatar: this.userAvatar, 
      });
    });

    } catch (error) {
      console.error("Failed to start game:", error);
      loadingText.setText("Payment Failed or Cancelled.");
      loadingText.setColor("#ff6b6b");
      
      // Hide status text
      if (this.statusText) {
        this.statusText.setVisible(false);
      }
      
      this.time.delayedCall(3000, () => loadingText.destroy());
    }
  }

  viewLeaderboard() {
    this.scene.start("LeaderboardScene", {
      suiClient: this.suiClient,
      account: this.account,
    });
  }

  // create a simple rotating spinner (graphics) at given position
  createSpinner(x, y) {
    const container = this.add.container(x, y);

    const ring = this.add.graphics();
    ring.lineStyle(6, 0xd4af37, 0.9);
    ring.strokeCircle(0, 0, 14);
    ring.alpha = 0.9;

    const arc = this.add.graphics();
    arc.fillStyle(0xd4af37, 1);
    arc.slice(0, 0, 14, Phaser.Math.DegToRad(330), Phaser.Math.DegToRad(30), false);
    arc.fillPath();
    arc.alpha = 0.95;

    container.add([ring, arc]);

    // rotate the arc using a tween when shown
    return container;
  }

  showSpinner() {
    if (!this.spinner) return;
    this.spinner.setVisible(true);
    if (this.spinnerTween) this.spinnerTween.stop();
    this.spinnerTween = this.tweens.add({
      targets: this.spinner,
      angle: 360,
      duration: 800,
      repeat: -1,
      ease: 'Linear'
    });
  }

  hideSpinner() {
    if (!this.spinner) return;
    if (this.spinnerTween) {
      this.spinnerTween.stop();
      this.spinnerTween = null;
    }
    this.spinner.setVisible(false);
    this.spinner.angle = 0;
  }

  destroy() {
    if (this.chestTimer) {
      this.chestTimer.remove();
    }
    super.destroy();
  }
}
