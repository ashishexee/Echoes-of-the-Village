import { WalletScene } from "./scenes/WalletScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { HomeScene } from "./scenes/HomeScene.js";
import { LeaderboardScene } from "./scenes/LeaderboardScene.js";
import { DialogueScene } from "./scenes/DialogueScene.js";
import { VideoScene } from "./scenes/VideoScene.js";
import { UIScene } from "./scenes/UIScene.js";
const config = {
  type: Phaser.CANVAS,
  width: window.innerWidth,
  height: window.innerHeight,
  pixelArt: true,
  antialias: false,
  parent: "game-container",
  roundPixels: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 1920,
  height: 1080,
  scene: [
    WalletScene,
    MenuScene,
    LoadingScene,
    HomeScene,
    DialogueScene,
    LeaderboardScene,
    VideoScene,
    UIScene,
  ],
};

window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

const game = new Phaser.Game(config);
