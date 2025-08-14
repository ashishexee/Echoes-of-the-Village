import Phaser from "phaser";
export class HomeScene extends Phaser.Scene {
  constructor() {
    super({ key: "HomeScene" });
    this.player = null;
    this.cursors = null;
    this.isWalkablePixel = null;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const tileSize = 32;
    const tilesX = Math.ceil(width / tileSize);
    const tilesY = Math.floor(height / tileSize);

    // Create background tiles
    for (let x = 0; x < tilesX; x++) {
      for (let y = 0; y < tilesY; y++) {
        this.add
          .image(x * tileSize, y * tileSize, "background")
          .setOrigin(0)
          .setDisplaySize(tileSize, tileSize);
      }
    }

    // Create path tiles for visual reference
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
          this.add
            .image(x * tileSize, y * tileSize, "path")
            .setOrigin(0)
            .setScale(0.1);
        }
      }
    });

    this.createBuilding(0, 0.56, "house01");
    this.createBuilding(0.23, 18, "house03");
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

    // Setup canvas pixel collision detection
    this.setupCanvasPixelCollision();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,S,A,D");
  }

  setupCanvasPixelCollision() {
    // Get the Phaser canvas
    const canvas = this.game.canvas;
    const ctx = canvas.getContext('2d');

    if(!ctx){
      console.warn('Pixel collsion detection failed');
      this.isWalkablePixel = () => true;
      return;
    }

    this.isWalkablePixel = (worldX, worldY) => {
      try {
        // Convert world coordinates to screen coordinates
        const camera = this.cameras.main;
        const screenX = Math.floor((worldX - camera.scrollX) * camera.zoom);
        const screenY = Math.floor((worldY - camera.scrollY) * camera.zoom);

        // Ensure coordinates are within canvas bounds
        if (screenX < 0 || screenY < 0 || screenX >= canvas.width || screenY >= canvas.height) {
          return false;
        }

        // Get pixel data from the rendered canvas
        const pixelData = ctx.getImageData(screenX, screenY, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        if (this.player && Math.abs(worldX - this.player.x) < 2 && Math.abs(worldY - this.player.y) < 2) {
          console.log(`Canvas pixel RGB at (${screenX}, ${screenY}): (${r}, ${g}, ${b})`);
        }

        const isPathColor = this.isPathPixel(r, g, b);
        
        return isPathColor;
      } catch (error) {
        console.warn('Canvas pixel check failed:', error);
        return false;
      }
    };
  }

  isPathPixel(r, g, b) {
    const pathColor1 = { r: 218, g: 165, b: 32 }; // Golden rod (example)
    const pathColor2 = { r: 255, g: 218, b: 185 }; // Peach puff (example)
    
    const tolerance = 30; // Color tolerance
    
    const matchesPath1 = Math.abs(r - pathColor1.r) < tolerance && 
                        Math.abs(g - pathColor1.g) < tolerance && 
                        Math.abs(b - pathColor1.b) < tolerance;
                        
    const matchesPath2 = Math.abs(r - pathColor2.r) < tolerance && 
                        Math.abs(g - pathColor2.g) < tolerance && 
                        Math.abs(b - pathColor2.b) < tolerance;

    // Option 2: Check for non-green colors (since background is green)
    const isNotGreen = !(r < 100 && g > 140 && b < 50);
    
    return matchesPath1 || matchesPath2 || isNotGreen;
  }

  createBuilding(x, y, texture) {
    const building = this.add.image(x * 32, y * 32, texture).setOrigin(0);
    building.setScale(0.34, 0.34);
  }

  createObstacle(x, y, texture, width = 1, height = 1) {
    this.add
      .image(x * 32, y * 32, texture)
      .setOrigin(0)
      .setDisplaySize(32, 32);
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
    const tileX = 1;
    const tileY = 9;
    this.player = this.physics.add
      .sprite(tileX * 32 + 16, tileY * 32 + 16, "player")
      .setOrigin(0.5)
      .setDisplaySize(32, 32);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;
  }

  update() {
    if (!this.player || !this.isWalkablePixel) return;

    const speed = 160;
    let velocityX = 0;
    let velocityY = 0;

    // Store current position before movement
    this.player.prevX = this.player.x;
    this.player.prevY = this.player.y;

    // Check movement inputs
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

    // Calculate the next position
    const nextX = this.player.x + (velocityX * this.game.loop.delta) / 1000;
    const nextY = this.player.y + (velocityY * this.game.loop.delta) / 1000;

    // Check if the next position is walkable using canvas pixel detection
    if (velocityX !== 0 || velocityY !== 0) {
      // Check center point of player at next position
      const isWalkable = this.isWalkablePixel(nextX, nextY);

      if (isWalkable) {
        this.player.setVelocity(velocityX, velocityY);
      } else {
        this.player.setVelocity(0, 0);
      }
    } else {
      this.player.setVelocity(0, 0);
    }
  }
}
