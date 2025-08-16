import Phaser from "phaser";

export class VideoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VideoScene' });
    }

    preload() {
        this.load.video('intro_video', 'assets/cut-scene/intro.mp4', 'loadeddata', false, true);
    }

    create() {
          const framePadding = 20;
    const frameWidth = this.cameras.main.width - framePadding * 2;
    const frameHeight = this.cameras.main.height - framePadding * 2;
    const cornerRadius = 30;

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffff00);
    maskShape.fillRoundedRect(framePadding, framePadding, frameWidth, frameHeight, cornerRadius);
    this.cameras.main.setMask(maskShape.createGeometryMask());

    const frame = this.add.graphics();
    frame.lineStyle(10, 0xd4af37, 1);
    frame.strokeRoundedRect(framePadding, framePadding, frameWidth, frameHeight, cornerRadius);
    frame.setDepth(100);
        const video = this.add.video(this.scale.width / 2, this.scale.height / 2, 'intro_video');
        video.setVolume(15);
        video.isMuted(false);
        video.setMute(false);
        video.setActive(true);
        video.play(false);
        if (this.sound.get('intro_music') && this.sound.get('intro_music').isPlaying) {
            this.sound.stopByKey('intro_music');
        }

       
        const zoomOutFactor = 0.45;
        const scaleX = this.scale.width / (video.width || this.scale.width);
        const scaleY = this.scale.height / (video.height || this.scale.height);
        const scale = Math.min(scaleX, scaleY) * zoomOutFactor;
        video.setScale(scale).setScrollFactor(0).setOrigin(0.5);

        video.on('complete', () => {
            this.startHomeScene();
        });

        const skipButton = this.add.text(this.scale.width - 100, this.scale.height - 50, 'Skip >>', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        skipButton.on('pointerdown', () => {
            video.stop();
            this.startHomeScene();
        });
    }

    startHomeScene() {
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('HomeScene');
        });
    }
}