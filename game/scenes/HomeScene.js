import Phaser from "phaser";
export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "HomeScene" });
    this.player = null;
    this.cursors = null;
    this.walkableTiles = [];
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const tileSize = 32;
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.floor(height / tileSize);

    for (let x = 0; x < tilesX; x++) {
      for (let y = 0; y < tilesY; y++) {
        this.add
          .image(x * tileSize, y * tileSize, "background")
          .setOrigin(0)
          .setDisplaySize(tileSize, tileSize);
        this.walkableTiles.push({ x: x * tileSize, y: y * tileSize });
      }
    }

    const pathTiles = [
      { x: 1, y: (322 - 32) / 32, width: 1, height: 3 },
      { x: 10, y: 400 / 32, width: 1, height: 9 },
      { x: 4.4, y: 0 / 32, width: 1, height: 6 },
      { x: 9.5, y: 32 / 32, width: 1, height: 4 },
      { x: 9.5, y: 32 / 32, width: 4, height: 1 },

      { x: 1, y: (322 - 32 - 32) / 32, width: 1, height: 1 },
      { x: 1, y: (322 - 32 - 32 - 32) / 32, width: 1, height: 1 },
      { x: 1, y: (322 - 32 - 32 - 32 - 32) / 32, width: 1, height: 1 },
      { x: 1, y: (322 - 32 - 32 - 32 - 32 - 32) / 32, width: 1, height: 1 },
      { x: 2, y: (322 - 32 - 32 - 32 - 32 - 32) / 32, width: 15, height: 1 },
      { x: 16, y: (322 - 32 - 32) / 32, width: 24, height: 1 },
      { x: 22.5, y: (322 - 32 - 32) / 32, width: 1, height: 6 },
      { x: 27, y: (322 - 32 - 32 - 32 - 32) / 32, width: 1, height: 6 },
      { x: 34, y: (322 - 32 - 32) / 32, width: 1, height: 9 },
      {
        x: 34,
        y: (322 + 32 + 32 + 32 + 32 + 32 + 32) / 32,
        width: 3,
        height: 1,
      },
      {
        x: 40,
        y: (322 - 32 - 32 - 32 - 32 - 32 - 32 - 32) / 32,
        width: 1,
        height: 11,
      },
      {
        x: 38,
        y: (322 - 32 - 32 - 32 - 32 - 32 - 32 - 32) / 32,
        width: 3,
        height: 1,
      },

      { x: 16, y: (322 - 32 - 32 - 32 - 32 - 32) / 32, width: 1, height: 13 },
      { x: 1, y: 360 / 32, width: 16, height: 1 },
      { x: 1, y: 360 / 32, width: 16, height: 1 },
    ];

    pathTiles.forEach((path) => {
      for (let x = path.x; x < path.x + path.width; x++) {
        for (let y = path.y; y < path.y + path.height; y++) {
          this.add
            .image(x * tileSize, y * tileSize, "path")
            .setOrigin(0)
            .setScale(0.199);
        }
      }
    });

    this.createBuilding(0, 0.56, "house01");
    this.createBuilding(0.23, 18, "house03"); // red house
    this.createBuilding(5.56, 17.38, "house01");
    this.createBuilding(0.455, 13, "house02");

    this.createObstacle(2, 10, "flower01", 3, 2);
    this.createObstacle(25, 5, "flower02", 4, 3);
    this.createObstacle(28, 18, "flower03", 3, 2);

    this.createObstacle(4, 4, "tree01");
    this.createObstacle(10, 7, "tree02");

    this.createVillager(8, 10);
    this.createVillager(16, 8);
    this.createVillager(12, 16);
    this.createVillager(20, 20);

    this.createPlayer();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,S,A,D");

    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.centerOn(width / 2, height / 2);
  }

  createWorld() {
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        this.add.image(x * 32, y * 32, "grass").setOrigin(0);
        this.walkableTiles.push({ x: x * 32, y: y * 32 });
      }
    }

    const pathTiles = [
      // { x: 5, y: 8, width: 15, height: 1 },
      // { x: 5, y: 12, width: 20, height: 1 },
      // { x: 8, y: 16, width: 12, height: 1 },
      // { x: 15, y: 20, width: 10, height: 1 },
      // { x: 12, y: 5, width: 1, height: 8 },
      // { x: 18, y: 8, width: 1, height: 10 },
      // { x: 22, y: 12, width: 1, height: 6 }
    ];

    // pathTiles.forEach(path => {
    //     for (let x = path.x; x < path.x + path.width; x++) {
    //         for (let y = path.y; y < path.y + path.height; y++) {
    //             this.add.image(x * 32, y * 32, 'path').setOrigin(0).setScale(0.45);
    //         }
    //     }
    // });

    this.createBuilding(6, 6, "house01");
    this.createBuilding(15, 6, "house02");
    this.createBuilding(20, 9, "house01");
    this.createBuilding(8, 14, "house03");
    this.createBuilding(25, 15, "house02");
    this.createBuilding(10, 18, "house01");
    this.createBuilding(5, 22, "house03");

    // Use correct asset names for obstacles
    this.createObstacle(2, 10, "flower01", 3, 2); // crops1
    this.createObstacle(25, 5, "flower02", 4, 3); // crops2
    this.createObstacle(28, 18, "flower01", 3, 2); // crops1

    this.createObstacle(4, 4, "tree02"); // tree1
    this.createObstacle(10, 7, "tree04"); // tree2
    this.createObstacle(14, 10, "tree02"); // tree1
    this.createObstacle(7, 20, "tree04"); // tree2
    this.createObstacle(23, 8, "tree02"); // tree1
    this.createObstacle(26, 12, "tree04"); // tree2

    // If you want to add lakes, make sure you have lake assets loaded and use their correct names
    // Example: this.createObstacle(2, 10, 'lake1', 3, 2);

    this.createVillager(8, 10);
    this.createVillager(16, 8);
    this.createVillager(12, 16);
    this.createVillager(20, 20);
  }

  createBuilding(x, y, texture) {
    const building = this.add.image(x * 32, y * 32, texture).setOrigin(0);
    building.setScale(0.34, 0.34);
    this.removeWalkableTile(x * 32, y * 32);
    this.removeWalkableTile((x + 1) * 32, y * 32);
    this.removeWalkableTile(x * 32, (y + 1) * 32);
    this.removeWalkableTile((x + 1) * 32, (y + 1) * 32);
  }

  createObstacle(x, y, texture, width = 1, height = 1) {
    this.add
      .image(x * 32, y * 32, texture)
      .setOrigin(0)
      .setScale(0);
    for (let wx = 0; wx < width; wx++) {
      for (let wy = 0; wy < height; wy++) {
        this.removeWalkableTile((x + wx) * 32, (y + wy) * 32);
      }
    }
  }

  createVillager(x, y) {
    const villager = this.add
      .sprite(x * 32 + 16, y * 32 + 16, "villager1")
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 2000 + Math.random() * 3000,
      callback: () => {
        const directions = ["up", "down", "left", "right"];
        const randomDir =
          directions[Math.floor(Math.random() * directions.length)];
      },
      loop: true,
    });
  }

  createPlayer() {
    this.player = this.physics.add
      .sprite(12 * 32 + 16, 8 * 32 + 16, "player")
      .setOrigin(0.5);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 24);
    // Create player animations
    this.anims.create({
      key: "walk-down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-up",
      frames: this.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-left",
      frames: this.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "walk-right",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: 0 }],
      frameRate: 1,
    });
  }

  removeWalkableTile(x, y) {
    this.walkableTiles = this.walkableTiles.filter(
      (tile) => !(tile.x === x && tile.y === y)
    );
  }

  isWalkable(x, y) {
    const tileX = Math.floor(x / 32) * 32;
    const tileY = Math.floor(y / 32) * 32;
    return this.walkableTiles.some(
      (tile) => tile.x === tileX && tile.y === tileY
    );
  }

  update() {
    if (!this.player) return;

    const speed = 160;
    let velocityX = 0;
    let velocityY = 0;

    // Check input
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

    // Calculate next position
    const nextX = this.player.x + (velocityX * this.game.loop.delta) / 1000;
    const nextY = this.player.y + (velocityY * this.game.loop.delta) / 1000;

    // Check if next position is walkable
    if (velocityX !== 0 && this.isWalkable(nextX, this.player.y)) {
      this.player.setVelocityX(velocityX);
    } else {
      this.player.setVelocityX(0);
    }

    if (velocityY !== 0 && this.isWalkable(this.player.x, nextY)) {
      this.player.setVelocityY(velocityY);
    } else {
      this.player.setVelocityY(0);
    }

    // Update animations
    if (velocityX < 0) {
      this.player.anims.play("walk-left", true);
    } else if (velocityX > 0) {
      this.player.anims.play("walk-right", true);
    } else if (velocityY < 0) {
      this.player.anims.play("walk-up", true);
    } else if (velocityY > 0) {
      this.player.anims.play("walk-down", true);
    } else {
      this.player.anims.play("idle", true);
    }
  }
}
