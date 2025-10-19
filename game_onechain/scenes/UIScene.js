import Phaser from "phaser";
import { chooseLocation } from "../api";
import { Transaction } from "@mysten/sui/transactions";

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
    this.timerText = null;
    this.elapsedSeconds = 0;
    this.inaccessibleLocations = [];
    this.account = null;
    this.suiClient = null;
    this.difficulty = "Easy";
    this._locationOverlay = null;
    this.locationButton = null;
    this.locationButtonEnabled = false;
    this.resetHintText = null; // added: small hint text property
  }

  init(data) {
    if (data && data.inaccessibleLocations) {
      this.inaccessibleLocations = data.inaccessibleLocations;
      this.account = data.account;
      this.suiClient = data.suiClient;
      this.difficulty = data.difficulty || "Easy";
    }
  }

  create() {
    this.elapsedSeconds = this.registry.get("elapsedTime") || 0;

    this.timerText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height - 70,
        this.formatTime(this.elapsedSeconds),
        {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#d4af37",
          stroke: "#000000",
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5);

    this.createInventoryButton();

    if (this.inaccessibleLocations && this.inaccessibleLocations.length > 0) {
      this.createLocationButton();
    }

    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Small reset hint at the end of the screen (bottom-right)
    this.resetHintText = this.add
      .text(
        this.cameras.main.width - 16,
        this.cameras.main.height - 8,
        "Hold [R] if your character is stuck",
        {
          fontFamily: "Arial",
          fontSize: "14px",
          color: "#aaaaaa",
          backgroundColor: "rgba(0,0,0,0.35)",
          padding: { x: 8, y: 4 },
        }
      )
      .setOrigin(1, 1)
      .setDepth(300)
      .setScrollFactor(0);
  }

  createLocationButton() {
    const button = this.add
      .text(150, this.cameras.main.height - 70, "Choose Location", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#A9A9A9",
        backgroundColor: "#555555",
        padding: { x: 15, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", () => {
      if (this.locationButtonEnabled) {
        this.showLocationChoices();
      } else {
        this.showDisabledLocationMessage();
      }
    });

    button.on("pointerover", () => {
      if (this.locationButtonEnabled) {
        button.setBackgroundColor("#f5d56b");
      }
    });
    button.on("pointerout", () => {
      if (this.locationButtonEnabled) {
        button.setBackgroundColor("#d4af37");
      }
    });
    this.locationButton = button;
  }

  showDisabledLocationMessage() {
    const remainingSeconds = 120 - this.elapsedSeconds;
    const message = `Available in ${remainingSeconds} seconds.`;

    const feedbackText = this.add
      .text(this.locationButton.x, this.locationButton.y - 50, message, {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffdddd",
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(201);

    this.time.delayedCall(1500, () => {
      feedbackText.destroy();
    });
  }

  showLocationChoices() {
    if (this._locationOverlay) return;

    const { width, height } = this.cameras.main;

    const blocker = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setInteractive();

    const panelHeight = 80 + this.inaccessibleLocations.length * 70;
    const panelWidth = 400;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    const panel = this.add
      .graphics()
      .fillStyle(0x1a1a1a, 0.95)
      .fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15)
      .lineStyle(2, 0xd4af37, 1)
      .strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);

    const title = this.add
      .text(width / 2, panelY + 40, "Choose a Location to Investigate", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const locationButtons = this.inaccessibleLocations.map(
      (location, index) => {
        const buttonY = panelY + 90 + index * 60;
        const button = this.add
          .text(width / 2, buttonY, location, {
            fontFamily: "Arial",
            fontSize: "20px",
            color: "#000000",
            backgroundColor: "#d4af37",
            padding: { x: 20, y: 10 },
            align: "center",
            fixedWidth: 300,
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });

        button.on("pointerdown", () => this.selectLocation(location));
        button.on("pointerover", () => button.setBackgroundColor("#f5d56b"));
        button.on("pointerout", () => button.setBackgroundColor("#d4af37"));
        return button;
      }
    );

    // small hint to close with Enter
    const hintText = this.add
      .text(width / 2, panelY + panelHeight - 18, "Press Enter to close", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#cccccc",
      })
      .setOrigin(0.5);

    this._locationOverlay = this.add.container(0, 0, [
      blocker,
      panel,
      title,
      ...locationButtons,
      hintText,
    ]);
    this._locationOverlay.setDepth(200);

    const closeOverlay = () => {
      if (this._locationOverlay) {
        this._locationOverlay.destroy();
        this._locationOverlay = null;
      }
    };

    // close when clicking outside (blocker)
    blocker.on("pointerdown", () => closeOverlay());

    // close on Enter key, ensure we remove handler when overlay is destroyed
    const onEnter = () => closeOverlay();
    this.input.keyboard.on("keydown-ENTER", onEnter);

    // cleanup keyboard listener if overlay is destroyed elsewhere (e.g., selectLocation)
    this._locationOverlay.once("destroy", () => {
      this.input.keyboard.off("keydown-ENTER", onEnter);
    });
  }

  async selectLocation(location) {
    if (this._locationOverlay) {
      this._locationOverlay.destroy();
      this._locationOverlay = null;
    }

    const feedbackText = this.add
      .text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2,
        `Investigating ${location}...`,
        {
          fontFamily: "Arial",
          fontSize: "28px",
          color: "#ffffff",
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: { x: 20, y: 10 },
        }
      )
      .setOrigin(0.5)
      .setDepth(201);

    const result = await chooseLocation(location);
    if (!result) {
      feedbackText.setText("Error: Game session not found.");
      this.time.delayedCall(2000, () => {
        this.scene.stop("HomeScene");
        this.scene.start("MenuScene");
      });
      return;
    }

    if (result.is_correct) {
      feedbackText.setText(`Investigation successful!`);

      // Wait a moment to show the success message before transitioning
      this.time.delayedCall(1500, async () => {
        const homeScene = this.scene.get("HomeScene");

        // --- Fetch current score from blockchain ---
        let baseScore = 0;
        try {
          // Try to get the current blockchain score
          if (this.account && window.onechainWallet) {
            feedbackText.setText(`Fetching your score from blockchain...`);

            const PACKAGE_ID =
              "0x7102f4157cdeef27cb198db30366ecd10dc7374d5a936dba2a40004371787b9d";
            const MODULE_NAME = "contracts_one";
            const SCORES_OBJECT_ID =
              "0x8ecdcbfb483d5aae0a22ad90xfc2f040b88dd5dfbbbd28b74bb363537c634c78c55ca6d455ae547221838845f0d2412c15fe102b62e1cb0cc3e9e6df05e23839b6";

            const tx = new Transaction();
            tx.moveCall({
              target: `${PACKAGE_ID}::${MODULE_NAME}::get_score`,
              arguments: [
                tx.object(SCORES_OBJECT_ID),
                tx.pure.address(this.account),
              ],
            });

            const result = await this.suiClient.devInspectTransactionBlock({
              sender: this.account,
              transactionBlock: tx,
            });

            if (
              result.effects.status.status === "success" &&
              result.results?.[0]?.returnValues
            ) {
              const [bytes] = result.results[0].returnValues[0];
              const score = new DataView(new Uint8Array(bytes).buffer).getBigUint64(
                0,
                true
              );
              baseScore = Number(score);
              console.log("Current blockchain score:", baseScore);
            }
          }
        } catch (error) {
          console.error("Error fetching blockchain score:", error);
          baseScore = 0;
        }
        baseScore = baseScore || 1000;

        const minutes = Math.floor(this.elapsedSeconds / 60);
        const timePenalty = minutes * 50;
        const guessPenalty = homeScene.guessCount * 1500;
        const nftBonus = homeScene.playerInventory.size * 250;
        const trueEndingBonus = result.is_true_ending ? 500 : 0;
        let finalScore =
          baseScore - timePenalty - guessPenalty + nftBonus + trueEndingBonus;
        // Ensure the score is not negative
        finalScore = Math.max(0, finalScore);

        const endData = {
          isCorrect: result.is_correct,
          isTrueEnding: result.is_true_ending,
          score: finalScore,
          time: this.formatTime(this.elapsedSeconds),
          guesses: homeScene.guessCount + 1,
          nfts: homeScene.playerInventory.size,
          account: this.account,
          suiClient: this.suiClient,
          difficulty: this.difficulty,
        };

        // Stop the game scenes and launch the EndScene
        this.scene.stop("HomeScene");
        this.scene.stop();
        this.scene.start("EndScene", endData);
      });
    } else {
      // If the guess is wrong, just show a message and let the player continue
      feedbackText.setText(`Investigation failed. Please try again.`);
      const homeScene = this.scene.get("HomeScene");
      if (homeScene) {
        homeScene.guessCount++; // Increment the guess counter
      }
      this.time.delayedCall(2000, () => {
        feedbackText.destroy();
      });
    }

    this.time.delayedCall(2000, () => {
      feedbackText.destroy();
    });
  }

  createInventoryButton() {
    const button = this.add
      .text(
        this.cameras.main.width - 150,
        this.cameras.main.height - 70,
        "Inventory",
        {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#000000",
          backgroundColor: "#d4af37",
          padding: { x: 15, y: 8 },
        }
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", () => {
      const homeScene = this.scene.get("HomeScene");
      if (homeScene && homeScene.scene.isActive()) {
        homeScene.scene.pause();
        this.scene.launch("InventoryScene", {
          inventory: Array.from(homeScene.playerInventory),
        });
      }
    });

    button.on("pointerover", () => button.setBackgroundColor("#f5d56b"));
    button.on("pointerout", () => button.setBackgroundColor("#d4af37"));
  }

  updateTimer() {
    this.elapsedSeconds++;
    this.registry.set("elapsedTime", this.elapsedSeconds);
    this.timerText.setText(this.formatTime(this.elapsedSeconds));

    if (
      !this.locationButtonEnabled &&
      this.elapsedSeconds >= 5 &&
      this.locationButton
    ) {
      this.locationButtonEnabled = true;
      this.locationButton.setBackgroundColor("#d4af37");
      this.locationButton.setColor("#000000");
    }
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
}
