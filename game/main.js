import { WalletScene } from "./scenes/WalletScene.js";
import { MenuScene } from "./scenes/MenuScene.js";
import { LoadingScene } from "./scenes/LoadingScene.js";
import { HomeScene } from "./scenes/HomeScene.js";
import { LeaderboardScene } from "./scenes/LeaderboardScene.js";

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    antialias: false,
    parent: 'game-container',
    roundPixels: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [WalletScene, MenuScene, LoadingScene, HomeScene, LeaderboardScene]
};

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

const game = new Phaser.Game(config);