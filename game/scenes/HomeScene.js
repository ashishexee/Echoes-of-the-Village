import Phaser from "phaser";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "HomeScene" });
    this.player = null;
    this.cursors = null;
    this.wasd = null;
    this.walkableGrid = [];
    this.tileSize = 32;

    // --- Properties for Interaction with Villagers---
    this.villagers = null;
    this.nearbyVillager = null;
    this.enterKey = null;
    this.interactionText = null;
  }

  create() {
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
          .setDisplaySize(this.tileSize, this.tileSize); // Corrected display size
      }
    }

    const pathTiles = [
      { x: 1, y: 9, width: 1, height: 3 }, { x: 10, y: 12, width: 1, height: 9 },
      { x: 4, y: 0, width: 1, height: 6 }, { x: 9, y: 1, width: 1, height: 4 },
      { x: 9, y: 1, width: 4, height: 1 }, { x: 1, y: 8, width: 1, height: 1 },
      { x: 1, y: 7, width: 1, height: 1 }, { x: 1, y: 6, width: 1, height: 1 },
      { x: 1, y: 5, width: 1, height: 1 }, { x: 2, y: 5, width: 15, height: 1 },
      { x: 16, y: 8, width: 24, height: 1 }, { x: 22, y: 8, width: 1, height: 6 },
      { x: 27, y: 6, width: 1, height: 6 }, { x: 34, y: 8, width: 1, height: 9 },
      { x: 34, y: 16, width: 3, height: 1 }, { x: 40, y: 3, width: 1, height: 11 },
      { x: 38, y: 3, width: 3, height: 1 }, { x: 16, y: 5, width: 1, height: 13 },
      { x: 1, y: 11, width: 16, height: 1 },
    ];

    pathTiles.forEach((path) => {
      for (let x = path.x; x < path.x + path.width; x++) {
        for (let y = path.y; y < path.y + path.height; y++) {
          if (this.walkableGrid[y] && this.walkableGrid[y][x] !== undefined) {
            this.add
              .image(x * this.tileSize, y * this.tileSize, "path")
              .setOrigin(0)
              .setDisplaySize(this.tileSize, this.tileSize);
            this.walkableGrid[y][x] = true;
          }
        }
      }
    });

    this.createBuilding(0, 0.5, "house01", 4, 4);
    this.createBuilding(0, 16, "house01", 5, 5);
    this.createBuilding(5, 16, "house01", 5, 5);
    this.createBuilding(0.5, 12, "house02", 4, 4);
    this.createBuilding(14, 0, "house01", 4, 4);
    this.createBuilding(25.6, 1.5, "church01", 4, 4);
    this.createBuilding(17.4, 10, "house02", 4, 4);
    this.createBuilding(32, 2, "house02", 4, 4);
    this.createBuilding(11.5, 14.7, "house02", 4, 4);
    this.createBuilding(11, 6, "house02", 4, 4);
    this.createBuilding(30, 10, "house02", 4, 4);

    this.createObstacle(6, 4, "tree01");
    this.createObstacle(6.4, 4, "tree01");
    this.createObstacle(6.8, 4, "tree01");
    this.createObstacle(5.6, 4, "tree01");
    this.createObstacle(7.2, 4, "tree01");
    this.createObstacle(7.6, 4, "tree01");
    this.createObstacle(8, 4, "tree01");
    this.createObstacle(10, 7, "tree02");
    this.createObstacle(8, 4, "tree01");
    this.createObstacle(15, 6, "tree01");
    this.createObstacle(25, 3, "tree02");
    this.createObstacle(32, 14, "tree02");
    this.createObstacle(39, 12, "tree01");
    this.createObstacle(11, 3, "flower02", 2, 1);
    this.createObstacle(19, 4, "flower01", 1, 2);
    this.createObstacle(26, 16, "flower02", 2, 2);
    this.createObstacle(33, 6, "flower02", 1, 1);
    this.createObstacle(41, 2, "flower01", 2, 1);

    // --- Initialize Villager Group ---
    this.villagers = this.physics.add.group({ immovable: true });

    this.createVillager(8, 10, "villager02", 0.069);
    this.createVillager(16, 8, "villager02", 0.069);
    this.createVillager(12, 16, "villager03", 0.069);
    this.createVillager(20, 20, "villager04", 0.069);
    this.createVillager(6, 3, "villager03", 0.069);
    this.createVillager(25, 10, "villager02", 0.069);
    this.createVillager(35, 6, "villager03", 0.089);
    this.createVillager(15, 14, "vilager04", 0.069); // Corrected typo in original code

    this.createPlayer(1, 9);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,S,A,D");

    // --- Setup for Interaction ---
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.interactionText = this.add.text(0, 0, 'Press ENTER to talk', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 1).setDepth(30).setVisible(false);
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
    this.add.image(pixelX, pixelY, texture)
      .setOrigin(0)
      .setDisplaySize(tileWidth * this.tileSize, tileHeight * this.tileSize);
    for (let y = Math.floor(tileY); y < Math.floor(tileY + tileHeight); y++) {
      for (let x = Math.floor(tileX); x < Math.floor(tileX + tileWidth); x++) {
        if (this.walkableGrid[y]) {
          this.walkableGrid[y][x] = false;
        }
      }
    }
  }

  createObstacle(tileX, tileY, texture, tileWidth = 1, tileHeight = 1) {
    this.add
      .image(tileX * this.tileSize, tileY * this.tileSize, texture)
      .setOrigin(0)
      .setDisplaySize(tileWidth * this.tileSize, tileHeight * this.tileSize);
    for (let y = Math.floor(tileY); y < Math.floor(tileY + tileHeight); y++) {
      for (let x = Math.floor(tileX); x < Math.floor(tileX + tileWidth); x++) {
        if (this.walkableGrid[y]) {
          this.walkableGrid[y][x] = false;
        }
      }
    }
  }

  createLake(tileX, tileY, texture, tileWidth = 10, tileHeight = 10) {
    this.createObstacle(tileX, tileY, texture, tileWidth, tileHeight);
  }

  createVillager(tileX, tileY, name, scaleSize) {
    // --- Add villager to the group ---
    const villager = this.villagers.create(
        tileX * this.tileSize + 16,
        tileY * this.tileSize + 16,
        name
    );
    villager.setOrigin(0.5)
      .setDisplaySize(32, 32)
      .setScale(scaleSize);
  }

  createPlayer(tileX, tileY) {
    const pixelX = tileX * this.tileSize + (this.tileSize / 2);
    const pixelY = tileY * this.tileSize + (this.tileSize / 2);
    this.player = this.physics.add
      .sprite(pixelX, pixelY, "player")
      .setOrigin(0.5)
      .setDisplaySize(this.tileSize, this.tileSize).setScale(0.089);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
  }

  // --- New method to handle interaction logic ---
  handleInteraction() {
    let closestVillager = null;
    let minDistance = 50; // Max distance to interact

    this.villagers.getChildren().forEach(villager => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        villager.x, villager.y
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
      this.scene.launch('DialogueScene', { villager: this.nearbyVillager });
    }
  }

  update() {
    if (!this.player) return;

    // --- Player Movement Logic (unchanged) ---
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
      const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
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

    // --- Call the new interaction handler every frame ---
    this.handleInteraction();
  }
}
