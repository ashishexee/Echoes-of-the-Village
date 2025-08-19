import Phaser from "phaser";
import { startNewGame, getConversation } from "../api";
import { Transaction } from '@mysten/sui/transactions';

const PACKAGE_ID = "0xf7fd6f8b100f786fcda885db47807a53af18562abc37485da97eab52ee85c6a9";

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
    this.gameData = null;
    this.resetKey = null;
    this.resetTimer = null;
    this.initialPlayerPos = { x: 1, y: 4.5};
    this.resetFeedbackText = null;

    this.suiClient = null;
    this.account = null;
    this.playerInventory = new Set();
    this.mintKey = null;
    this.activeMintZone = null;
    this.mintText = null;
  }

  init(data) {
    if (data && data.existingGameData) {
      this.gameData = data.existingGameData;
      console.log("Existing game data loaded:", this.gameData); 

    }
    // Receive wallet data from WalletScene/MenuScene safely
    this.suiClient = data ? data.suiClient : null;
    this.account = data ? data.account : null;
    this.difficulty = data ? data.difficulty || "Easy" : "Easy";
  }

  async create() {
    const loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Creating a new mystery...', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
    console.log("diffulty - ", this.difficulty);
    
    const { game_id, inaccessible_locations, villagers } = await startNewGame(this.difficulty);
    loadingText.destroy();
    if (!game_id) {
      this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Error: Could not start a new game.\nPlease check the server and refresh.', { fontSize: '24px', fill: '#ff0000', align: 'center' }).setOrigin(0.5);
      return;
    }
    this.gameData = { game_id, inaccessible_locations, villagers };
    console.log("Game data initialized:", this.gameData);

    // Listen for the unlock event from ItemLockScene
    if (this.scene.get('ItemLockScene')) {
        this.scene.get('ItemLockScene').events.on('villagerUnlocked', this.unlockVillager, this);
    }

    // Check wallet for existing items at the start of the game
    if (this.account && this.suiClient) {
        await this.updateInventory();
    }

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

    if (!this.scene.isActive('UIScene')) {
        this.scene.launch('UIScene', { inaccessibleLocations: this.gameData.inaccessible_locations });
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
      { x: 16, y: 5, width: 1, height: 15.2 },
      { x: 1, y: 11, width: 16, height: 1 },
    ];

    pathTiles.forEach((path) => {
      for (let x = path.x; x < path.x + path.width; x++) {
        for (let y = path.y; y < path.y + path.height; y++) {
          if (this.walkableGrid[y] && this.walkableGrid[y][x] !== undefined) {
            this.walkableGrid[y][x] = true;
            this.occupiedGrid[y][x] = true;
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
    this.createBuilding(28, 9, "house05", 4, 4);
    this.createBuilding(30.6, 9, "house01", 4, 4);
    this.createBuilding(35.7, 11.2, "house01", 4, 4);
    this.createObstacle(27.6, 1.2, "church01", 7, 7);
    this.createBuilding(36, 3.28, "windmill", 4.3, 4.3);
    this.createObstacle(37, 0, "lake02", 5, 4);
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

    //Crops
    this.createObstacle(12.2, 16, "crop02", 2.5, 2);
    this.createObstacle(12.2, 18.3, "crop03", 2.5, 2);
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
    this.createBuilding(19.85, 3.2, "house01", 4.5, 4.5);


    this.createObstacle(18.1, 3.4, "crop03", 2, 2);
    this.createObstacle(18.1, 5.65, "crop02", 2, 2);
    this.createObstacle(24.15, 3.4, "crop02", 2, 2);
    this.createObstacle(24.15, 5.65, "crop03", 2, 2);
    this.createObstacle(18.15, 1.2, "crop02", 2, 2);
    this.createObstacle(20.15, 1.2, "crop03", 2, 2);
    this.createObstacle(22.15, 1.2, "crop02", 2, 2);
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

    // --- Villagers Setup ---
    this.villagers = this.physics.add.group({ immovable: true });

    // --- New Dynamic Item Logic ---
    const ALL_POSSIBLE_ITEMS = [
        "FISHING_ROD", "AXE", "SHOVEL", "LANTERN",
        "PICKAXE", "HAMMER", "BUCKET", "SCYTHE"
    ];

    Phaser.Utils.Array.Shuffle(ALL_POSSIBLE_ITEMS);
    const currentGameItems = ALL_POSSIBLE_ITEMS.slice(0, 4);
    console.log("Items for this game session:", currentGameItems);
 
     const villagerSpriteMap = {
         "villager_0": { tileX: 7, tileY: 9.5, texture: "villager04", scale: 0.069 },
         "villager_1": { tileX: 15, tileY: 8, texture: "villager02", scale: 0.069 },
         "villager_2": { tileX: 11, tileY: 16, texture: "villager03", scale: 0.069 },
         "villager_3": { tileX: 17, tileY: 19.3, texture: "villager04", scale: 0.069 },
         "villager_4": { tileX: 5, tileY: 3, texture: "villager03", scale: 0.069 },
         "villager_5": { tileX: 21, tileY: 11.5, texture: "villager03", scale: 0.069 },
         "villager_6": { tileX: 24.8, tileY: 8.7, texture: "villager02", scale: 0.069 },
         "villager_7": { tileX: 26.2, tileY: 5, texture: "villager04", scale: 0.060 },
     };
 
    // Assign required_item only among villagers that will be rendered.
    (function assignLocks(gameData, spriteMap, unlockItems) {
        const availableIds = gameData.villagers
            .map(v => v.id)
            .filter(id => !!spriteMap[id]); // only those with sprites
 
        Phaser.Utils.Array.Shuffle(availableIds);
 
        const countToLock = Math.min(4, availableIds.length, unlockItems.length);
        const villagersToLock = availableIds.slice(0, countToLock);
 
        gameData.villagers.forEach(villager => {
            const lockIndex = villagersToLock.indexOf(villager.id);
            villager.required_item = lockIndex !== -1 ? unlockItems[lockIndex] : null;
        });
 
        console.log("Locked villagers (id -> required_item):",
            gameData.villagers.filter(v => v.required_item).map(v => ({ id: v.id, required_item: v.required_item }))
        );
    })(this.gameData, villagerSpriteMap, currentGameItems);
 
     this.gameData.villagers.forEach(villagerData => {
         const spriteInfo = villagerSpriteMap[villagerData.id];
         if (spriteInfo) {
             this.createVillager(
                 spriteInfo.tileX,
                 spriteInfo.tileY,
                 spriteInfo.texture,
                 spriteInfo.scale,
                 villagerData.id,
                 villagerData.required_item
             );
         }
     });
 
    this.createObstacle(6, 0.3, "crop03", 2, 2);

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

    // --- New Minting Setup ---
    this.mintKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.mintText = this.add.text(0, 0, 'Press M to mint', {
        fontFamily: 'Arial', fontSize: '16px', color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 1).setDepth(30).setVisible(false);

    this.events.on('resume', () => {
        if (this.input && this.input.keyboard) {
            this.input.keyboard.enabled = true;
        }
    });

    // --- Dynamic Minting Zone Creation ---
    const ALL_MINT_ZONES = {
        'FISHING_ROD': { x: 6, y: 10, width: 80, height: 80 },       // By the lake, on the path
        'AXE': { x: 35.5, y: 15, width: 80, height: 80 },     // Edge of the forest, on the path
        'SHOVEL': { x: 23, y: 9, width: 80, height: 80 },       // By the well, on the path
        'LANTERN': { x: 28, y: 6, width: 80, height: 80 },      // At the church entrance, on the path
        'PICKAXE': { x: 33, y: 16.5, width: 80, height: 80 },   // Near the forge, on the path
        'HAMMER': { x: 37, y: 4, width: 80, height: 80 },       // By the windmill, on the path
        'BUCKET': { x: 21, y: 13, width: 80, height: 80 },      // At the market, on the path
        'SCYTHE': { x: 40.5, y: 4, width: 80, height: 80 }      // In the fields, on the path
    };

    currentGameItems.forEach(itemName => {
        const zoneData = ALL_MINT_ZONES[itemName];
        if (zoneData) {
            this.createMintingZone(
                zoneData.x * this.tileSize,
                zoneData.y * this.tileSize,
                zoneData.width,
                zoneData.height,
                itemName
            );
        }
    });

    this.setupResetPlayer();
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

  createVillager(tileX, tileY, texture, scaleSize, id, requiredItem = null) {
    const villager = this.villagers.create(
      tileX * this.tileSize + 16,
      tileY * this.tileSize + 16,
      texture
    );
    villager
      .setOrigin(0.5)
      .setDisplaySize(32, 32)
      .setScale(scaleSize)
      .setPipeline("Light2D");

    villager.name = id;
    villager.requiredItem = requiredItem;

    // Add a lock icon so locked villagers are visible in the world
    if (requiredItem) {
      const lockIcon = this.add.text(villager.x, villager.y - 25, '🔒', {
        fontSize: '18px'
      }).setOrigin(0.5).setDepth(31);
      villager.lockIcon = lockIcon;
      // hide initially if player already has the item
      lockIcon.setVisible(!this.playerInventory.has(requiredItem));
    } else {
      villager.lockIcon = null;
    }
  }

  createPlayer(tileX, tileY) {
    const pixelX = tileX * this.tileSize + this.tileSize / 2;
    const pixelY = tileY * this.tileSize + this.tileSize / 2;
    // Store the initial position for the reset feature
    this.initialPlayerPos = { x: pixelX, y: pixelY };
    
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

  setupResetPlayer() {
    this.resetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.resetFeedbackText = this.add.text(this.cameras.main.centerX, 50, '', {
        fontFamily: 'Arial',
        fontSize: '20px',
        color: '#d4af37',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(100).setVisible(false);

    this.resetKey.on('down', () => {
        this.resetFeedbackText.setText('Hold [R] for 1.5s to reset position...').setVisible(true);
        // Start a timer to reset after 1.5 seconds
        this.resetTimer = this.time.delayedCall(1500, () => {
            this.player.setPosition(this.initialPlayerPos.x, this.initialPlayerPos.y);
            this.resetFeedbackText.setText('Position has been reset!');
            // Hide the message after another second
            this.time.delayedCall(1000, () => {
                this.resetFeedbackText.setVisible(false);
            });
        });
    });

    this.resetKey.on('up', () => {
        // If the key is released before the timer completes, cancel the reset
        if (this.resetTimer && this.resetTimer.getProgress() < 1) {
            this.resetTimer.remove(false);
            this.resetFeedbackText.setVisible(false);
        }
    });
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
      if (this.nearbyVillager.requiredItem && !this.playerInventory.has(this.nearbyVillager.requiredItem)) {
        const itemName = this.nearbyVillager.requiredItem.replace(/_/g, ' ');
        this.interactionText.setText(`Requires: ${itemName}`);
      } else {
        this.interactionText.setText("Press ENTER to talk");
      }
      this.interactionText.setVisible(true);
      this.interactionText.setPosition(
        this.nearbyVillager.x,
        this.nearbyVillager.y - this.nearbyVillager.displayHeight / 2
      );
    } else {
      this.interactionText.setVisible(false);
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey) && this.nearbyVillager) {
      // If villager requires an item, always launch the ItemLockScene
      if (this.nearbyVillager.requiredItem) {
        this.scene.pause();
        this.scene.launch('ItemLockScene', {
          villager: this.nearbyVillager,
          suiClient: this.suiClient,
          account: this.account,
          gameData: this.gameData
        });
        return;
      }
      // Otherwise, proceed with the conversation
      this.initiateConversation(this.nearbyVillager);
    }
  }

  async initiateConversation(villager) {  
    this.input.keyboard.enabled = false;
    this.player.setVelocity(0, 0);

    this.interactionText.setText("...");
    this.sound.play("villager_accept", { volume: 6 });
    console.log(villager.name);
    
    const conversationData = await getConversation(villager.name, "Hello");

    this.input.keyboard.enabled = true;
    this.interactionText.setText("Press ENTER to talk");

    if (conversationData) {
      this.scene.pause();
      // CHANGE 3: Pass the stored this.gameData object to the DialogueScene.
      this.scene.launch('DialogueScene', {
        conversationData: conversationData,
        newGameData: this.gameData, // Pass the whole stored object
        villagerSpriteKey: villager.texture.key
      });
    } else {
      console.error("Could not fetch conversation for villager:", villager.name);
    }
  }

  update() {
    if (!this.player) return;

    // --- Handle Mint Zone Visibility ---
    if (this.activeMintZone) {
        const playerBounds = this.player.getBounds();
        const zoneBounds = this.activeMintZone.getBounds();
        if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, zoneBounds)) {
            this.mintText.setVisible(false);
            this.activeMintZone = null;
        } else {
            this.mintText.setPosition(this.player.x, this.player.y - 30);
            this.mintText.setVisible(true);
        }
    }

    if (Phaser.Input.Keyboard.JustDown(this.mintKey) && this.activeMintZone) {
        // Prevent minting if the item is already in the inventory
        if (!this.playerInventory.has(this.activeMintZone.itemName)) {
            this.mintItem(this.activeMintZone.itemName);
        }
    }

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

    // Keep lock icons positioned and visible only when the player lacks the required item
    this.villagers.getChildren().forEach(villager => {
        if (villager.lockIcon) {
            villager.lockIcon.setPosition(villager.x, villager.y - 25);
            const isLocked = !!villager.requiredItem;
            villager.lockIcon.setVisible(isLocked);
        }
    });
 
     this.handleInteraction();
  }

  // --- New Methods for Minting and Inventory ---

  unlockVillager(villagerName) {
    const villager = this.villagers.getChildren().find(v => v.name === villagerName);
    if (villager) {
        console.log(`Unlocking villager: ${villagerName}`);
        villager.requiredItem = null;
        this.updateInventory();
    }
  }

  createMintingZone(x, y, width, height, itemName) {
    const zone = this.add.zone(x, y, width, height).setOrigin(0);
    this.physics.world.enable(zone);
    zone.body.setAllowGravity(false);
    zone.body.moves = false;
    zone.itemName = itemName;

    this.physics.add.overlap(this.player, zone, () => {
        this.activeMintZone = zone;
        // Check inventory and update the minting prompt accordingly
        if (this.playerInventory.has(itemName)) {
            this.mintText.setText(`You already own the ${itemName.replace(/_/g, ' ')}`);
        } else {
            this.mintText.setText(`Press M to mint ${itemName.replace(/_/g, ' ')}`);
        }
    });
  }

  async mintItem(itemName) {
    if (!this.suiClient || !this.account) {
        console.error("Wallet not connected, cannot mint.");
        return;
    }

    this.input.keyboard.enabled = false;
    const mintingStatusText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `Minting ${itemName}...`, {
        fontSize: '24px', color: '#d4af37', backgroundColor: 'rgba(0,0,0,0.8)', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(101);

    try {
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::contract_one::mint_item`,
            arguments: [
                tx.pure.address(this.account),
                tx.pure('vector<u8>',Array.from(new TextEncoder().encode(itemName))),
            ],
        });

        const result = await window.onechainWallet.signAndExecuteTransaction({
            transaction: tx,
        });

        console.log("Mint successful!", result);
        mintingStatusText.setText(`${itemName} minted successfully!`);
        await this.updateInventory();

    } catch (error) {
        console.error("Minting failed:", error);
        mintingStatusText.setText(`Minting failed. See console for details.`);
    } finally {
        this.time.delayedCall(2000, () => {
            mintingStatusText.destroy();
            this.input.keyboard.enabled = true;
        });
    }
  }

  async updateInventory() {
    if (!this.suiClient || !this.account) return;

    try {
        const itemNftType = `${PACKAGE_ID}::contract_one::ItemNFT`;
        const objects = await this.suiClient.getOwnedObjects({
            owner: this.account,
            filter: { StructType: itemNftType },
            options: { showContent: true },
        });

        const currentInventory = new Set();
        objects.data.forEach(item => {
            if (item.data && item.data.content && item.data.content.fields) {
                const nameBytes = item.data.content.fields.name;
                const itemName = String.fromCharCode.apply(null, nameBytes);
                currentInventory.add(itemName);
            }
        });
        
        this.playerInventory = currentInventory;
        console.log("Player inventory updated:", Array.from(this.playerInventory));

    } catch (error) {
        console.error("Failed to update inventory:", error);
    }
  }
}
