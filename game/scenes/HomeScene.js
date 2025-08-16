import Phaser from "phaser";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "HomeScene" });
    this.player = null;
    this.playerLight = null;
    this.cursors = null;
    this.wasd = null;
    this.walkableGrid = [];
    this.tileSize = 32;
    this.villagers = null;
    this.nearbyVillager = null;
    this.enterKey = null;
    this.interactionText = null;
  }

  create() {
    if (
      !this.sound.get("background_music") ||
      !this.sound.get("background_music").isPlaying
    ) {
      this.sound.play("background_music", { loop: true, volume: 0.2 });
    }

    this.lights.enable();
    this.lights.setAmbientColor(0x202040);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const tilesX = Math.ceil(width / this.tileSize);
    const tilesY = Math.floor(height / this.tileSize);

    for (let y = 0; y < tilesY; y++) {
      this.walkableGrid[y] = [];
      for (let x = 0; x < tilesX; x++) {
        this.walkableGrid[y][x] = false;
        this.add
          .image(x * this.tileSize, y * this.tileSize, "background")
          .setOrigin(0)
          .setDisplaySize(this.tileSize, this.tileSize)
          .setPipeline('Light2D');
      }
    }

    const pathTiles = [
      { x: 1, y: 9, width: 1, height: 3 },
      { x: 10, y: 12, width: 1, height: 9 },
      { x: 4, y: 0, width: 1, height: 6 },
      { x: 9, y: 1, width: 1, height: 4 },
      { x: 9, y: 1, width: 4, height: 1 },
      { x: 1, y: 8, width: 1, height: 1 },
      { x: 1, y: 7, width: 1, height: 1 },
      { x: 1, y: 6, width: 1, height: 1 },
      { x: 1, y: 5, width: 1, height: 1 },
      { x: 2, y: 5, width: 15, height: 1 },
      { x: 16, y: 8, width: 24, height: 1 },
      { x: 22, y: 8, width: 1, height: 6 },
      { x: 27, y: 6, width: 1, height: 6 },
      { x: 34, y: 8, width: 1, height: 9 },
      { x: 34, y: 16, width: 3, height: 1 },
      { x: 40, y: 3, width: 1, height: 11 },
      { x: 38, y: 3, width: 3, height: 1 },
      { x: 16, y: 5, width: 1, height: 13 },
      { x: 1, y: 11, width: 16, height: 1 },
    ];

    pathTiles.forEach((path) => {
      for (let x = path.x; x < path.x + path.width; x++) {
        for (let y = path.y; y < path.y + path.height; y++) {
          if (this.walkableGrid[y] && this.walkableGrid[y][x] !== undefined) {
            this.walkableGrid[y][x] = true;
          }
        }
      }
    });

    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        if (this.walkableGrid[y][x]) {
          const up = (this.walkableGrid[y - 1] && this.walkableGrid[y - 1][x]) || false;
          const down = (this.walkableGrid[y + 1] && this.walkableGrid[y + 1][x]) || false;
          const left = (this.walkableGrid[y] && this.walkableGrid[y][x - 1]) || false;
          const right = (this.walkableGrid[y] && this.walkableGrid[y][x + 1]) || false;
          const neighborCount = Number(up) + Number(down) + Number(left) + Number(right);

          const pixelX = x * this.tileSize + this.tileSize / 2;
          const pixelY = y * this.tileSize + this.tileSize / 2;
          let tileTexture = 'path';
          let angle = 0;

          if (neighborCount <= 1) {
            tileTexture = 'path_rounded';
            if (up) angle = 180;
            else if (left) angle = -90;
            else if (right) angle = 90;
          } else if (neighborCount === 2) {
            if (up && down) {
              angle = 90;
            } else if (!(left && right)) {
              tileTexture = 'path';
              if (down && right) angle = 0;
              else if (down && left) angle = 90;
              else if (up && left) angle = 180;
              else if (up && right) angle = -90;
            }
          }
          
          this.add
            .image(pixelX, pixelY, tileTexture)
            .setOrigin(0.5)
            .setDisplaySize(this.tileSize, this.tileSize)
            .setAngle(angle)
            .setPipeline('Light2D');
        }
      }
    }

    // Buildings
    this.createBuilding(0, 0.5, "house01", 4, 4);
    this.createBuilding(0, 16, "house01", 5, 5);
    this.createBuilding(5, 16, "house01", 5, 5);
    this.createBuilding(13, 0, "house01", 4, 4);
    this.createBuilding(0.5, 12, "house02", 4, 4);
    this.createBuilding(17.4, 10, "house02", 4, 4);
    this.createBuilding(11.5, 14.7, "house02", 4, 4);
    this.createBuilding(11, 6, "house02", 5, 5);
    this.createBuilding(30, 10, "house02", 4, 4);
    this.createBuilding(30, 13.5, "house01", 4, 4);
    this.createBuilding(27, 1.5, "church01", 4, 4);
    this.createBuilding(34, 1, "windmill", 4, 4);

    // Trees
    this.createObstacle(2, 6.5, "tree01", 4, 4);
    this.createObstacle(3, 6.5, "tree01", 4, 4);
    this.createObstacle(4, 6.5, "tree01", 4, 4);
    this.createObstacle(5, 6.5, "tree01", 4, 4);
    this.createObstacle(6, 6.5, "tree01", 4, 4);
    this.createObstacle(10.4, 1.48, "tree05", 2, 3);
    this.createObstacle(31, 4, "tree01", 4, 4);

    // Flowers
    this.createObstacle(19, 4, "flower01", 1, 1);
    this.createObstacle(41, 2, "flower01", 1, 1);
    this.createObstacle(9, 13, "flower01", 1, 1);
    this.createObstacle(38, 9, "flower01", 1, 1);
    this.createObstacle(14, 4, "flower01", 1, 1);
    this.createObstacle(11, 3, "flower02", 1, 1);
    this.createObstacle(26, 16, "flower02", 1, 1);
    this.createObstacle(33, 6, "flower02", 1, 1);
    this.createObstacle(22, 15, "flower02", 1, 1);
    this.createObstacle(3, 9, "flower02", 1, 1);
    this.createObstacle(9.47, 5.8, "flower02", 2, 2);
    this.createObstacle(10.47, 5.8, "flower02", 2, 2);
    this.createObstacle(9.47, 6.8, "flower02", 2, 2);
    this.createObstacle(10.47, 6.8, "flower02", 2, 2);
    this.createObstacle(9.47, 7.8, "flower03", 2, 2);
    this.createObstacle(10.47, 7.8, "flower03", 2, 2);
    this.createObstacle(9.47, 8.8, "flower03", 2, 2);
    this.createObstacle(10.47, 8.8, "flower03", 2, 2);

    //Farmhouse
    this.createObstacle(41.3,0.7, "farmhouse",3,3);
     this.createObstacle(44.3,0.7, "farmhouse",3,3);

    //Crops
    this.createObstacle(42, 3.6, "crop02", 2, 2);
    this.createObstacle(42, 5.6, "crop03", 2, 2);
    this.createObstacle(42, 7.6, "crop02", 2, 2);
    this.createObstacle(42, 9.6, "crop03", 2, 2);
    this.createObstacle(42, 11.6, "crop02", 2, 2);
     this.createObstacle(44.5, 3.6, "crop03", 2, 2);
    this.createObstacle(44.5, 5.6, "crop02", 2, 2);
    this.createObstacle(44.5, 7.6, "crop03", 2, 2);
    this.createObstacle(44.5, 9.6, "crop02", 2, 2);
    this.createObstacle(44.5, 11.6, "crop03", 2, 2);

    // Forests
    this.createObstacle(17, 2.2, "forest01", 1, 1);
    this.createObstacle(21, 2.2, "forest01", 1, 1);
    this.createObstacle(17, 3.8, "forest01", 1, 1);
    this.createObstacle(21, 3.8, "forest01", 1, 1);
    this.createObstacle(17, 0.6, "forest01", 1, 1);
    this.createObstacle(21, 0.6, "forest01", 1, 1);
    this.createObstacle(17, -1, "forest01", 1, 1);
    this.createObstacle(21, -1, "forest01", 1, 1);
    this.createObstacle(38, 17, "forest01", 1, 1);
    this.createObstacle(41, 17, "forest01", 1, 1);
    this.createObstacle(38, 19, "forest01", 1, 1);
    this.createObstacle(41, 19, "forest01", 1, 1);
    this.createObstacle(17, 12.5, "forest02", 1, 1);
    this.createObstacle(21, 12.5, "forest02", 1, 1);
    this.createObstacle(17, 15, "forest02", 1, 1);
    this.createObstacle(21, 15, "forest02", 1, 1);

    // Lakes
    this.createObstacle(35, 15, "lake01", 4, 4);
    this.createObstacle(25, 18, "lake03", 4, 4);

    // Villagers
    this.villagers = this.physics.add.group({ immovable: true });
    this.createVillager(8, 10, "villager02", 0.069);
    this.createVillager(16, 8, "villager02", 0.069);
    this.createVillager(12, 16, "villager03", 0.069);
    this.createVillager(20, 20, "villager04", 0.069);
    this.createVillager(6, 3, "villager03", 0.069);
    this.createVillager(7, 10, "villager02", 0.069);
    this.createVillager(17, 8, "villager02", 0.069);
    this.createVillager(11, 17, "villager03", 0.069);
    this.createVillager(21, 20, "villager04", 0.069);
    this.createVillager(5, 3, "villager03", 0.069);
    this.createVillager(26, 10, "villager02", 0.069);
    this.createVillager(35, 7, "villager03", 0.089);
    this.createVillager(15, 13, "villager04", 0.069);

    this.createPlayer(1, 9);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,S,A,D");

    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );
    this.interactionText = this.add
      .text(0, 0, "Press ENTER to talk", {
        fontFamily: "Arial",
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5, 1)
      .setDepth(30)
      .setVisible(false);

    this.time.addEvent({
        delay: Phaser.Math.Between(8000, 20000),
        callback: this.triggerLightning,
        callbackScope: this,
        loop: true
    });
  }

  triggerLightning() {
    const lightning = this.lights.addLight(
        Phaser.Math.Between(0, this.cameras.main.width), 
        Phaser.Math.Between(0, this.cameras.main.height), 
        800
    ).setColor(0xffffff).setIntensity(3.0);

    this.tweens.add({
        targets: lightning,
        intensity: 0,
        duration: 250,
        ease: 'Cubic.easeIn',
        onComplete: () => {
            this.lights.removeLight(lightning);
        }
    });

    this.time.delayedCall(Phaser.Math.Between(200, 800), () => {
        this.sound.play('thunder', { volume: 0.6 });
    });

    this.cameras.main.flash(100, 255, 255, 255);
  }

  isWalkableAt(worldX, worldY) {
    const tileX = Math.floor(worldX / this.tileSize);
    const tileY = Math.floor(worldY / this.tileSize);
    if (this.walkableGrid[tileY] && this.walkableGrid[tileY][tileX]) {
      return true;
    }
    return false;
  }

  createBuilding(tileX, tileY, texture, tileWidth = 4, tileHeight = 4) {
    const pixelX = tileX * this.tileSize;
    const pixelY = tileY * this.tileSize;
    this.add
      .image(pixelX, pixelY, texture)
      .setOrigin(0)
      .setDisplaySize(tileWidth * this.tileSize, tileHeight * this.tileSize)
      .setPipeline('Light2D');
    for (let y = Math.floor(tileY); y < Math.floor(tileY + tileHeight); y++) {
      for (let x = Math.floor(tileX); x < Math.floor(tileX + tileWidth); x++) {
        if (this.walkableGrid[y]) {
          this.walkableGrid[y][x] = false;
        }
      }
    }
  }

  createObstacle(tileX, tileY, texture, tileWidth, tileHeight) {
    const isForest = texture === "forest01" || texture === "forest02";
    const tileSize = this.tileSize;

    const effectiveTileWidth = isForest ? tileWidth * 6 : tileWidth;
    const effectiveTileHeight = isForest ? tileHeight * 6 : tileHeight;

    this.add
      .image(tileX * tileSize, tileY * tileSize, texture)
      .setOrigin(0)
      .setDisplaySize(
        effectiveTileWidth * tileSize,
        effectiveTileHeight * tileSize
      )
      .setPipeline('Light2D');

    // Intentionally do not modify walkableGrid here so the player can move through obstacles.
  }

  createLake(tileX, tileY, texture, tileWidth = 10, tileHeight = 10) {
    this.createObstacle(tileX, tileY, texture, tileWidth, tileHeight);
  }

  createVillager(tileX, tileY, name, scaleSize) {
    const villager = this.villagers.create(
      tileX * this.tileSize + 16,
      tileY * this.tileSize + 16,
      name
    );
    villager.setOrigin(0.5).setDisplaySize(32, 32).setScale(scaleSize).setPipeline('Light2D');
  }

  createPlayer(tileX, tileY) {
    const pixelX = tileX * this.tileSize + this.tileSize / 2;
    const pixelY = tileY * this.tileSize + this.tileSize / 2;
    this.player = this.physics.add
      .sprite(pixelX, pixelY, "player")
      .setOrigin(0.5)
      .setDisplaySize(this.tileSize, this.tileSize)
      .setScale(0.089)
      .setPipeline('Light2D');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.playerLight = this.lights.addLight(pixelX, pixelY, 250).setColor(0xaaccff).setIntensity(2.0);
  }

  handleInteraction() {
    let closestVillager = null;
    let minDistance = 50;

    this.villagers.getChildren().forEach((villager) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        villager.x,
        villager.y
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestVillager = villager;
      }
    });

    this.nearbyVillager = closestVillager;

    if (this.nearbyVillager) {
      this.interactionText.setVisible(true);
      this.interactionText.setPosition(
        this.nearbyVillager.x,
        this.nearbyVillager.y - this.nearbyVillager.displayHeight / 2
      );
    } else {
      this.interactionText.setVisible(false);
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey) && this.nearbyVillager) {
      this.scene.pause();
      this.sound.play("villager_accept", { volume: 6 });
      this.scene.launch("DialogueScene", { villager: this.nearbyVillager });
    }
  }

  update() {
    if (!this.player) return;

    if (this.playerLight) {
        this.playerLight.x = this.player.x;
        this.playerLight.y = this.player.y;
    }

    const speed = 110;
    let velocityX = 0;
    let velocityY = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      velocityX = -speed;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      velocityX = speed;
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      velocityY = -speed;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      velocityY = speed;
    }
    if (velocityX !== 0 && velocityY !== 0) {
      const magnitude = Math.sqrt(
        velocityX * velocityX + velocityY * velocityY
      );
      velocityX = (velocityX / magnitude) * speed;
      velocityY = (velocityY / magnitude) * speed;
    }
    const delta = this.game.loop.delta / 1000;
    const nextX = this.player.x + velocityX * delta;
    const nextY = this.player.y + velocityY * delta;
    if (velocityX !== 0 || velocityY !== 0) {
      if (this.isWalkableAt(nextX, nextY)) {
        this.player.setVelocity(velocityX, velocityY);
      } else {
        this.player.setVelocity(0, 0);
      }
    } else {
      this.player.setVelocity(0, 0);
    }

    this.handleInteraction();
  }
}
