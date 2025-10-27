import Phaser from "phaser";
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { pingServer } from "../api";
import { PACKAGE_ID , MODULE_NAME , SCORES_OBJECT_ID } from "../oneConfig";
export class WalletScene extends Phaser.Scene {
  constructor() {
    super({ key: "WalletScene" });
    this.userAddress = null;
    this.suiClient = null;
  }

  preload() {
    this.load.video(
      "bg_video",
      "assets/cut-scene/bg04_animated.mp4",
      "loadeddata",
      false,
      true
    );
    this.load.audio("intro_music", "assets/music/intro_music.MP3");
    this.load.image("gaming_frame", "assets/images/ui/gaming_frame.png");
  }

  create() {
    const ONECHAIN_TESTNET_URL = 'https://rpc-testnet.onelabs.cc:443';
    this.suiClient = new SuiClient({ url: ONECHAIN_TESTNET_URL });

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
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const bgVideo = this.add.video(centerX, centerY, "bg_video");
    bgVideo.play(true);
    const zoomOutFactor = 0.45;
    
    const scaleX = this.scale.width / (bgVideo.width || this.scale.width);
    const scaleY = this.scale.height / (bgVideo.height || this.scale.height);
    const scale = Math.min(scaleX, scaleY) * zoomOutFactor;
    bgVideo.setScale(scale).setScrollFactor(0).setOrigin(0.5);
    bgVideo.setVolume(15);
    bgVideo.isMuted(false);
    bgVideo.setMute(false);
    bgVideo.setActive(true);
    this.input.once(
      "pointerdown",
      () => {
        bgVideo.setMute(false);
      },
      this
    );

    this.add
      .rectangle(
        0,
        0,
        this.cameras.main.width,
        this.cameras.main.height,
        0x000000,
        0.7
      )
      .setOrigin(0);

    const panelWidth = 500;
    const panelHeight = 400;
    this.add
      .graphics()
      .fillStyle(0x1a1a1a, 0.9)
      .fillRoundedRect(
        centerX - panelWidth / 2,
        centerY - panelHeight / 2,
        panelWidth,
        panelHeight,
        20
      )
      .lineStyle(2, 0xd4af37, 1)
      .strokeRoundedRect(
        centerX - panelWidth / 2,
        centerY - panelHeight / 2,
        panelWidth,
        panelHeight,
        20
      );

    this.add
      .text(centerX, centerY - 120, "Connect Your Wallet", {
        fontFamily: "Georgia, serif",
        fontSize: "40px",
        color: "#ffffff",
        align: "center",
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: "#000",
          blur: 5,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5);

    this.createButton(
      centerX,
      centerY + 20,
      'Connect Wallet',
      () => this.connectWallet()
    );

  }

  createButton(x, y, text, callback) {
    const buttonWidth = 280;
    const buttonHeight = 60;

    const button = this.add.container(x, y);

    const background = this.add
      .graphics()
      .fillStyle(0x333333, 1)
      .fillRoundedRect(
        -buttonWidth / 2,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        15
      );

    const border = this.add
      .graphics()
      .lineStyle(2, 0xd4af37, 1)
      .strokeRoundedRect(
        -buttonWidth / 2,
        -buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        15
      );

    const buttonText = this.add
      .text(0, 0, text, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    button.add([background, border, buttonText]);
    button.setSize(buttonWidth, buttonHeight);
    button.setInteractive({ useHandCursor: true });

    button.on("pointerover", () => {
      background
        .clear()
        .fillStyle(0x444444, 1)
        .fillRoundedRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight,
          15
        );
      border
        .clear()
        .lineStyle(2, 0xffe74a, 1)
        .strokeRoundedRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight,
          15
        );
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
        .fillRoundedRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight,
          15
        );
      border
        .clear()
        .lineStyle(2, 0xd4af37, 1)
        .strokeRoundedRect(
          -buttonWidth / 2,
          -buttonHeight / 2,
          buttonWidth,
          buttonHeight,
          15
        );
      this.tweens.add({
        targets: button,
        scale: 1,
        duration: 150,
        ease: "Sine.easeInOut",
      });
    });

    button.on("pointerdown", callback);

    return button;
  }

  async connectWallet() {
     pingServer();
    if (!this.scale.isFullscreen) {
      this.scale.startFullscreen();
    }

    function getWallet() {
      if (window.onechainWallet) return window.onechainWallet;
      if (window.sui) return window.sui;
      if (window.one) return window.one;
      return null;
    }

    const wallet = getWallet();

    if (!wallet) {
      console.error("Wallet not found. Please install a compatible wallet.");
      const centerX = this.cameras.main.width / 2;
      this.add
        .text(centerX, this.cameras.main.height / 2 + 150, "Wallet not found. Please install a compatible wallet.", {
          fontFamily: "Arial",
          fontSize: 16,
          color: "#ff0000",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5);
      return;
    }

    try {
      if (typeof wallet.requestPermissions === "function") {
        await wallet.requestPermissions();
      } else if (typeof wallet.request === "function") {
        await wallet.request({ method: "eth_requestAccounts" });
      }

      let accounts = [];
      if (typeof wallet.getAccounts === "function") {
        accounts = await wallet.getAccounts();
      } else if (typeof wallet.request === "function") {
        accounts = await wallet.request({ method: "eth_accounts" });
      }

      if (accounts && accounts.length > 0) {
        const userAddress = accounts[0].address ? accounts[0].address : accounts[0];
        console.log("Connected account:", userAddress);

        this.userAddress = userAddress;
        await this.registerUserInContract(wallet);

      } else {
        throw new Error("No accounts found in the wallet.");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      const centerX = this.cameras.main.width / 2;
      this.add
        .text(
          centerX,
          this.cameras.main.height / 2 + 150,
          "Failed to connect. Please try again.",
          {
            fontFamily: "Arial",
            fontSize: 16,
            color: "#ff0000",
            stroke: "#000000",
            strokeThickness: 3,
          }
        )
        .setOrigin(0.5);
    }
  }

  async findWalletProvider() {
    if (window.onechainWallet) return window.onechainWallet;
  }

  async registerUserInContract(walletProvider) {
    try {

      const isRegistered = await this.checkIfUserRegistered();
      
      if (isRegistered) {
        console.log("User already registered, proceeding to game...");
        this.proceedToGame();
        return;
      }

      console.log("User not registered, registering and setting initial score to 10,000...");

      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::register_user`,
        arguments: [
          tx.object(SCORES_OBJECT_ID),
          tx.pure.address(this.userAddress)
        ],
      });

      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::update_score`,
        arguments: [
          tx.object(SCORES_OBJECT_ID),
          tx.pure.address(this.userAddress),
          tx.pure.u64(10000)
        ],
      });

      const result = await walletProvider.signAndExecuteTransaction({
        transaction: tx,
      });

      console.log("User registered and score set to 10,000 successfully!", result);
      
      this.proceedToGame();

    } catch (error) {
      console.error("Registration failed:", error);
      alert("Failed to register user: " + error.message);
    }
  }

  async checkIfUserRegistered() {
    try {

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::get_leaderboard`,
        arguments: [tx.object(SCORES_OBJECT_ID)],
      });

      const result = await this.suiClient.devInspectTransactionBlock({
        sender: this.userAddress,
        transactionBlock: tx,
      });

      if (result.effects.status.status !== 'success' || !result.results?.[0]?.returnValues) {
        console.error("Could not check registration status from leaderboard:", result.effects.status.error);
        return false;
      }

      const [addressBytes] = result.results[0].returnValues[0];
      const addresses = this.parseAddressVector(new Uint8Array(addressBytes));
      
      const isRegistered = addresses.some(addr => addr.toLowerCase() === this.userAddress.toLowerCase());
      
      console.log(`User registration check: ${isRegistered ? 'User is registered.' : 'User not found, proceeding to register.'}`);
      return isRegistered;

    } catch (error) {
      console.error("Error checking user registration:", error);
      return false;
    }
  }

  parseAddressVector(bytes) {
    const len = bytes[0];
    const addresses = [];
    let offset = 1;
    const addressSize = 32;
    for (let i = 0; i < len; i++) {
        const addressBytes = bytes.slice(offset, offset + addressSize);
        addresses.push('0x' + Array.from(addressBytes, byte => byte.toString(16).padStart(2, '0')).join(''));
        offset += addressSize;
    }
    return addresses;
  }

  proceedToGame() {
    this.scene.start('AvatarScene', { 
      account: this.userAddress,
      suiClient: this.suiClient 
    });
  }
}