import Phaser from "phaser";
export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: "LoadingScene" });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.load.image("loading_bg", "/assets/images/world/Bg04.png");
    this.load.once('complete', () => { });

    this.load.on('filecomplete-image-loading_bg', (key, type, data) => {
      this.add.image(0, 0, 'loading_bg').setOrigin(0).setDisplaySize(width, height);
      this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
    });

    const loadingText = this.add.text(width / 2, height / 2 - 100, 'Loading Assets...', {
      fontFamily: 'Georgia, serif',
      fontSize: '40px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    const progressBarWidth = 400;
    const progressBarHeight = 40;
    const progressBarX = (width - progressBarWidth) / 2;
    const progressBarY = height / 2;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1a1a1a, 0.8);
    progressBox.fillRoundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 15);
    progressBox.lineStyle(2, 0xd4af37, 1);
    progressBox.strokeRoundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 15);

    const progressBar = this.add.graphics();

    const percentText = this.add.text(width / 2, progressBarY + progressBarHeight / 2, '0%', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const assetText = this.add.text(width / 2, height / 2 + 70, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cccccc'
    }).setOrigin(0.5);

    this.load.image("grass", "/assets/images/world/grass.png");
    this.load.image("house01", "/assets/images/world/house01.png");
    this.load.image("house02", "/assets/images/world/house02.png");
    this.load.image("house03", "/assets/images/world/house03.png");
    this.load.image("house04", "/assets/images/world/house04.png");
    this.load.image("tree01", "/assets/images/world/tree02.png");
    this.load.image("tree02", "/assets/images/world/tree03.png");
    this.load.image("flower01", "/assets/images/world/flowers01.png");
    this.load.image("flower02", "/assets/images/world/flowers02.png");
    this.load.image("path", "/assets/images/world/solid_path.png");
    this.load.image("background", "assets/images/world/background.png");
    this.load.image("windmill", "assets/images/world/windmill.png");
    this.load.image("farmhouse", "assets/images/world/farmhouse.png");
    this.load.image("lake01", "/assets/images/world/lake01.png");
    this.load.image("church01", "/assets/images/world/church02.png");
    this.load.image("crop01", "/assets/images/world/crop01.png");

    this.load.image("player", "/assets/images/characters/mc.png");
    this.load.image("villager01", "assets/images/characters/villager01.png");
    this.load.image("villager02", "assets/images/characters/villager02.png");
    this.load.image("villager03", "assets/images/characters/villager03.png");
    this.load.image("villager04", "assets/images/characters/villager04.png");

    this.load.audio("background_music", "/assets/music/background_audio.mp3");
    this.load.audio("villager_accept", "/assets/music/villager_accept.ogg");


    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xd4af37, 1);
      const padding = 5;
      progressBar.fillRoundedRect(
        progressBarX + padding,
        progressBarY + padding,
        (progressBarWidth - padding * 2) * value,
        progressBarHeight - padding * 2,
        10
      );
      percentText.setText(parseInt(value * 100) + '%');
    });

    this.load.on('fileprogress', (file) => {
      assetText.setText('Loading: ' + file.key);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      percentText.destroy();
      assetText.destroy();
      loadingText.setText('Loading Complete!');
    });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("HomeScene");
      });
    });
  }
}
