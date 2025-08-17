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
    this.createBuilding(0.5, 0.7, "house01", 4, 4);
    this.createBuilding(5.5, 13.7, "house01", 5, 5);
    this.createBuilding(14, 0.8, "house01", 4.5, 4.5);
    this.createBuilding(2, 6.5, "house01", 4, 4);
    this.createBuilding(17, 9, "house02", 5, 5);
    this.createObstacle(10.4, 10.5, "house05", 6, 6);
    this.createBuilding(11, 6, "house02", 5, 5);
    this.createBuilding(28 , 9, "house05", 4, 4);
    this.createBuilding(30.6, 9, "house01", 4, 4);
    this.createBuilding(35.7, 11.2, "house01", 4, 4);
    this.createBuilding(27.6, 1.2, "church01", 7  , 7);
    this.createBuilding(36, 3.28, "windmill", 4.3, 4.3);
    this.createObstacle(37 , 0, "lake02", 5, 4);
    this.createObstacle(23, 9.8, "well01", 4, 4);
    this.createObstacle(21.5, 13.7, "shop01", 4, 4);
    this.createObstacle(25, 13.7, "shop01", 4, 4);
    this.createObstacle(34, 16.4, "stove01", 4, 4);
    this.createObstacle(27, 10.7, "animals01", 8, 8);
    this.createObstacle(36, 14.56, "forest01", 2, 2);
    this.createObstacle(31, 14.56, "forest01", 2, 2);
    this.createObstacle(0.2, 14.56, "forest01", 2, 2);
    this.createObstacle(7, 16.3, "forest01", 2, 2);
    this.createObstacle(-1, 14, "forest01", 2, 2);
    this.createObstacle(37, 13, "forest01", 2, 2);
    this.createObstacle(5.5, 10.6, "lake01", 5, 4.5);
    this.createObstacle(26.5, 15.4, "lake01", 7, 7);

    // Trees
    this.createObstacle(5.3, 6.5, "tree01", 4, 4);
    this.createObstacle(6.8, 6.5, "tree01", 4, 4);
    this.createObstacle(8.3, 6.5, "tree01", 4, 4);
    this.createObstacle(11.2, 1.58, "tree05", 2, 3);
    this.createObstacle(12.4, 1.8, "tree05", 2, 3);
    this.createObstacle(10, 1.8, "tree05", 2, 3);
    this.createObstacle(26.4, 3, "tree05", 2, 3);
    this.createObstacle(26.4, 0.6, "tree05", 2, 3);
    this.createObstacle(28.4, 0.6, "tree05", 2, 3);
    this.createObstacle(31.5, 0.6, "tree05", 2, 3);
    this.createObstacle(33.5, 0.6, "tree05", 2, 3);
    this.createObstacle(33.5, 3, "tree05", 2, 3);
    this.createObstacle(35.5, 8, "tree01", 4, 4);

    //Farmhouse
    this.createObstacle(41.3, 0.7, "farmhouse", 3, 3);
    this.createObstacle(44, 0.7, "farmhouse", 3, 3);
    //dkejhte h ab

    //Crops
    this.createObstacle(12.2, 16, "crop02", 2.5, 2);
    this.createObstacle(12.2, 18.3, "crop03", 2.5, 2);
    this.createObstacle(15.2, 18.3, "crop02", 2.5, 2);
    this.createObstacle(18.2, 18.3, "crop03", 2.5, 2);
    this.createObstacle(18.2, 20.5, "crop02", 2.5, 2);
    this.createObstacle(18.2, 16, "crop02", 2.5, 2);
    this.createObstacle(21.2, 18.3, "crop02", 2.5, 2);
    this.createObstacle(21.2, 20.5, "crop03", 2.5, 2);
    this.createObstacle(24.2, 20.5, "crop02", 2.5, 2);
    this.createObstacle(24.2, 18.3, "crop03", 2.5, 2);
    this.createObstacle(27.2, 20.5, "crop03", 2.5, 2);
    this.createObstacle(18.2, 13.7, "crop03", 2.5, 2);
    this.createObstacle(41.75, 3.6, "crop02", 2, 2);
    this.createObstacle(1.5, 16.15, "crop02", 2.3, 2);
    this.createObstacle(4.1, 16.15, "crop03", 2.2 , 2);
    this.createObstacle(4.1, 14, "crop02", 2.2 , 2);
    this.createObstacle(1.5, 14, "crop03", 2.2 , 2);
    this.createObstacle(41.75, 5.6, "crop03", 2, 2);
    this.createObstacle(41.75, 7.6, "crop02", 2, 2);
    this.createObstacle(41.75, 9.6, "crop03", 2, 2);
    this.createObstacle(41.75, 11.6, "crop02", 2, 2);
    this.createObstacle(41.75, 13.6, "crop02", 2, 2);
    this.createObstacle(44.5, 3.6, "crop03", 2, 2);
    this.createObstacle(44.5, 5.6, "crop02", 2, 2);
    this.createObstacle(44.5, 7.6, "crop03", 2, 2);
    this.createObstacle(44.5, 9.6, "crop02", 2, 2);
    this.createObstacle(44.5, 11.6, "crop03", 2, 2);
    this.createObstacle(44.5, 13.6, "crop02", 2, 2);

    // Forests
    this.createBuilding(19.85, 3.2, "house01", 4.5, 4.5 );

    
    this.createObstacle(18.1, 3.4, "crop03", 2, 2); 
    this.createObstacle(18.1, 5.65, "crop02", 2, 2); 
    this.createObstacle(24.15, 3.4, "crop02", 2, 2);
    this.createObstacle(24.15, 5.65, "crop03", 2, 2);
    this.createObstacle(18.15, 1.2, "crop02", 2, 2); 
    this.createObstacle(20.15, 1.2, "crop03", 2, 2);
    this.createObstacle(22.15, 1.2, "crop02", 2, 2); 
    this.createObstacle(24.15, 1.2, "crop03", 2, 2);

    
    const flowerTypes = ["flower01", "flower02", "flower03"];
    const greenSpaces = [];
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        if (!this.occupiedGrid[y][x]) {
          greenSpaces.push({ x, y });
        }
      }
    }

    const numberOfFlowers = 50; 
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
