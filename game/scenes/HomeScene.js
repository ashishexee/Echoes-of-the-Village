import Phaser from "phaser";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "HomeScene" });
    this.player = null;
    this.playerLight = null;
    this.cursors = null;
    this.wasd = null;
    this.walkableGrid = [];
    this.occupiedGrid = [];
    this.tileSize = 32;
    this.villagers = null;
    this.nearbyVillager = null;
    this.enterKey = null;
    this.interactionText = null;
    
  }

  create() {
    const framePadding = 25;
    const extraBottomSpace = 110;
    const frameWidth = this.cameras.main.width - framePadding * 2;
    const frameHeight =
      this.cameras.main.height - framePadding * 2 - extraBottomSpace;
    const cornerRadius = 30;

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffff00);
    maskShape.fillRoundedRect(
      framePadding,
      framePadding,
      frameWidth,
      frameHeight,
      cornerRadius
    );
    this.cameras.main.setMask(maskShape.createGeometryMask());

    const frame = this.add.graphics();
    frame.lineStyle(10, 0xd4af37, 1);
    frame.strokeRoundedRect(
      framePadding,
      framePadding,
      frameWidth,
      frameHeight,
      cornerRadius
    );
    frame.setDepth(100);
    if (
      !this.sound.get("background_music") ||
      !this.sound.get("background_music").isPlaying
    ) {
      this.sound.play("background_music", { loop: true, volume: 0.2 });
    }

    this.lights.enable();
    this.lights.setAmbientColor(0x101020);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const tilesX = Math.ceil(width / this.tileSize);
    const tilesY = Math.floor(height / this.tileSize);

    for (let y = 0; y < tilesY; y++) {
      this.walkableGrid[y] = [];
      this.occupiedGrid[y] = []; // Initialize occupied grid
      for (let x = 0; x < tilesX; x++) {
        this.walkableGrid[y][x] = false;
        this.occupiedGrid[y][x] = false; // All tiles are initially unoccupied
        this.add
          .image(x * this.tileSize, y * this.tileSize, "background")
          .setOrigin(0)
          .setDisplaySize(this.tileSize, this.tileSize)
          .setPipeline("Light2D");
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
      { x: 34, y: 16, width: 14, height: 1 },
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
            this.occupiedGrid[y][x] = true; // Mark path tiles as occupied
          }
        }
      }
    });

    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        if (this.walkableGrid[y][x]) {
          const up =
            (this.walkableGrid[y - 1] && this.walkableGrid[y - 1][x]) || false;
          const down =
            (this.walkableGrid[y + 1] && this.walkableGrid[y + 1][x]) || false;
          const left =
            (this.walkableGrid[y] && this.walkableGrid[y][x - 1]) || false;
          const right =
            (this.walkableGrid[y] && this.walkableGrid[y][x + 1]) || false;
          const neighborCount =
            Number(up) + Number(down) + Number(left) + Number(right);

          const pixelX = x * this.tileSize + this.tileSize / 2;
          const pixelY = y * this.tileSize + this.tileSize / 2;
          let tileTexture = "path";
          let angle = 0;

          if (neighborCount <= 1) {
            tileTexture = "path_rounded";
            if (up) angle = 180;
            else if (left) angle = -90;
            else if (right) angle = 90;
          } else if (neighborCount === 2) {
            if (up && down) {
              angle = 90;
            } else if (!(left && right)) {
              tileTexture = "path";
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
            .setPipeline("Light2D");
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
    this.createObstacle(10.7, 11.3, "house05", 6, 6);
    this.createObstacle(12.2, 16.6, "crop02", 3, 3);
    this.createBuilding(11, 6, "house02", 5, 5);
    this.createBuilding(30, 10, "house02", 4, 4);
    this.createBuilding(30, 13.5, "house01", 4, 4);
    this.createBuilding(36.53, 15.2, "house01", 4, 4);
    this.createBuilding(38.53, 14.6, "house05", 5, 5);
    this.createBuilding(41.53, 15.2, "house02", 4, 4);
    this.createBuilding(43.53, 14.6, "house05", 5, 5);
    this.createBuilding(26.1, 0.2, "church01", 6.2, 6.2);
    this.createBuilding(34, 0.6, "windmill", 4.3, 4.3);
    this.createObstacle(34.3, 3.1, "lake02", 5.7, 5.7);
    this.createObstacle(23, 9.8, "well01", 4, 4);
    this.createObstacle(36, 14.56, "forest01", 2, 2);
    this.createObstacle(31, 14.56, "forest01", 2, 2);
    this.createObstacle(4.3, 11, "lake01", 6, 6);

    // Trees
    this.createObstacle(2, 6.5, "tree01", 4, 4);
    this.createObstacle(3.5, 6.5, "tree01", 4, 4);
    this.createObstacle(5, 6.5, "tree01", 4, 4);
    this.createObstacle(6.5, 6.5, "tree01", 4, 4);
    this.createObstacle(8, 6.5, "tree01", 4, 4);
    this.createObstacle(10.4, 1.48, "tree05", 2, 3);
    this.createObstacle(29.4, 0.2, "tree05", 2, 3);
    this.createObstacle(31.4, 0.2, "tree05", 2, 3);
    this.createObstacle(33.4, 0.2, "tree05", 2, 3);
    this.createObstacle(31, 4, "tree01", 4, 4);

    //Farmhouse
    this.createObstacle(41.3, 0.7, "farmhouse", 3, 3);
    this.createObstacle(44.3, 0.7, "farmhouse", 3, 3);

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
    this.createBuilding(20.43, 3.5, "house01", 4, 4);

    // Additional crops around the house
    this.createObstacle(18.5, 3.6, "crop02", 2, 2); // left-top
    this.createObstacle(18.5, 5.8, "crop03", 2, 2); // left-bottom
    this.createObstacle(24.2, 3.6, "crop03", 2, 2); // right-top
    this.createObstacle(24.2, 5.8, "crop02", 2, 2); // right-bottom
    this.createObstacle(18.15, 1.2, "crop02", 2, 2); // bottom-left
    this.createObstacle(20.15, 1.2, "crop03", 2, 2);
    this.createObstacle(22.15, 1.2, "crop02", 2, 2); // bottom-left
    this.createObstacle(24.15, 1.2, "crop03", 2, 2);

    // Randomly place flowers on green spaces
    const flowerTypes = ["flower01", "flower02", "flower03"];
    const greenSpaces = [];
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        if (!this.occupiedGrid[y][x]) {
          greenSpaces.push({ x, y });
        }
      }
    }

    const numberOfFlowers = 50; // Adjust this number as needed
    for (let i = 0; i < numberOfFlowers; i++) {
      if (greenSpaces.length > 0) {
        const randomIndex = Phaser.Math.Between(0, greenSpaces.length - 1);
        const position = greenSpaces.splice(randomIndex, 1)[0];
        const flowerType = Phaser.Math.RND.pick(flowerTypes);
        this.createObstacle(position.x, position.y, flowerType, 1, 1);
      }
    }

    // Villagers
    this.villagers = this.physics.add.group({ immovable: true });
    this.createVillager(8, 10, "villager02", 0.069);
    this.createVillager(16, 8, "villager02", 0.069);
    this.createVillager(12, 16, "villager03", 0.069);
    this.createVillager(20, 20, "villager04", 0.069);
    this.createVillager(6, 3, "villager03", 0.069);
    this.createObstacle(6, 2.7, "crop02", 2, 2);
    this.createObstacle(6, 0.3, "crop03", 2, 2);
    this.createVillager(26, 10, "villager02", 0.069);
    this.createVillager(35, 7, "villager03", 0.089);
    this.createVillager(15, 13, "villager04", 0.069);

    this.createPlayer(1, 4.5);

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
      loop: true,
    });
  }

  // triggerLightning() {
  //   const lightning = this.lights.addLight(
  //       Phaser.Math.Between(0, this.cameras.main.width),
  //       Phaser.Math.Between(0, this.cameras.main.height),
  //       800
  //   ).setColor(0xffffff).setIntensity(3.0);

  //   this.tweens.add({
  //       targets: lightning,
  //       intensity: 0,
  //       duration: 250,
  //       ease: 'Cubic.easeIn',
  //       onComplete: () => {
  //           this.lights.removeLight(lightning);
  //       }
  //   });

  //   this.time.delayedCall(Phaser.Math.Between(200, 800), () => {
  //       this.sound.play('thunder', { volume: 0.6 });
  //   });

  //   this.cameras.main.flash(100, 255, 255, 255);
  // }

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
      .setPipeline("Light2D");
    for (let y = Math.floor(tileY); y < Math.floor(tileY + tileHeight); y++) {
      for (let x = Math.floor(tileX); x < Math.floor(tileX + tileWidth); x++) {
        if (this.walkableGrid[y]) {
          this.walkableGrid[y][x] = false;
        }
        if (this.occupiedGrid[y]) {
          this.occupiedGrid[y][x] = true;
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
      .setPipeline("Light2D");

    for (
      let y = Math.floor(tileY);
      y < Math.floor(tileY + effectiveTileHeight);
      y++
    ) {
      for (
        let x = Math.floor(tileX);
        x < Math.floor(tileX + effectiveTileWidth);
        x++
      ) {
        if (this.occupiedGrid[y]) {
          this.occupiedGrid[y][x] = true;
        }
      }
    }
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
    villager
      .setOrigin(0.5)
      .setDisplaySize(32, 32)
      .setScale(scaleSize)
      .setPipeline("Light2D");
  }

  createPlayer(tileX, tileY) {
    const pixelX = tileX * this.tileSize + this.tileSize / 2;
    const pixelY = tileY * this.tileSize + this.tileSize / 2;
    this.player = this.physics.add
      .sprite(pixelX, pixelY, "player")
      .setOrigin(0.5)
      .setDisplaySize(this.tileSize, this.tileSize)
      .setScale(0.12)
      .setPipeline("Light2D");
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.playerLight = this.lights
      .addLight(pixelX, pixelY, 250)
      .setColor(0xaaccff)
      .setIntensity(2.0);
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
