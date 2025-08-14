import Phaser from "phaser";
export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScene" });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Load background image
    this.load.image("loading_bg", "/assets/images/world/background.png");

    this.add
      .text(width / 2, height / 2 - 60, "Loading...", {
        fontSize: "32px",
        fill: "#ffffff",
      })
      .setOrigin(0.5);

    this.load.image("background", "assets/images/world/background.png");

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();

    const boxWidth = 320;
    const boxHeight = 50;
    const boxX = (width - boxWidth) / 2;
    const boxY = height / 2 - boxHeight / 2;

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Assets for World Building
    this.load.image("grass", "/assets/images/world/grass.png");
    this.load.image("house01", "/assets/images/world/house01.png");
    this.load.image("house02", "/assets/images/world/house02.png");
    this.load.image("house03", "/assets/images/world/house03.png");
    this.load.image("house04" , "/assets/images/world/house04.png");
    this.load.image("tree01", "/assets/images/world/tree02.png");
    this.load.image("tree02", "/assets/images/world/tree03.png");
    this.load.image("flower01", "/assets/images/world/flowers01.png");
    this.load.image("flower02", "/assets/images/world/flowers02.png");
    this.load.image("path", "/assets/images/world/solid_path.png");
    this.load.image("background", "assets/images/world/background.png");
    this.load.image("windmill", "assets/images/world/windmill.png");
    this.load.image("farmhouse", "assets/images/world/farmhouse.png");
    this.load.image("lake01" , "/assets/images/world/lake01.png");
    this.load.image("church01" , "/assets/images/world/church02.png");
    this.load.image("crop01" , "/assets/images/world/crop01.png");

    // Assets for Characters Building
    this.load.image("player", "/assets/images/characters/mc.png");
    this.load.image("villager01" , "assets/images/characters/villager01.png");
    this.load.image("villager01" , "assets/images/characters/villager01.png");
    this.load.image("villager02" , "assets/images/characters/villager02.png");
    this.load.image("villager03" , "assets/images/characters/villager03.png");
    this.load.image("villager04" , "assets/images/characters/villager04.png");

    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(
        boxX + 10,
        boxY + 10,
        (boxWidth - 20) * value,
        boxHeight - 20
      );
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
    });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    this.add
      .image(width / 2, height / 2, "loading_bg")
      .setDisplaySize(width, height);
    this.scene.start("HomeScene");
  }
}
