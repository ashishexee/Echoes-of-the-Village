import Phaser from "phaser";

export class DialogueScene extends Phaser.Scene {
    constructor() {
        super({ key: "DialogueScene" });
        this.villager = null;
    }

    init(data) {
        this.villager = {
            textureKey: data.villager.texture.key 
        };
    }

    create() {
         const framePadding = 20;
    const frameWidth = this.cameras.main.width - framePadding * 2;
    const frameHeight = this.cameras.main.height - framePadding * 2;
    const cornerRadius = 30;

    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xd4af37);
    maskShape.fillRoundedRect(framePadding, framePadding, frameWidth, frameHeight, cornerRadius);
    this.cameras.main.setMask(maskShape.createGeometryMask());

    const frame = this.add.graphics();
    frame.lineStyle(10, 0xd4af37, 1);
    frame.strokeRoundedRect(framePadding, framePadding, frameWidth, frameHeight, cornerRadius);
    frame.setDepth(100);
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0xd4af37, 0.7).setOrigin(0);
        const panelWidth = this.cameras.main.width * 0.9;
        const panelHeight = this.cameras.main.height * 0.8;
        const panelX = this.cameras.main.centerX;
        const panelY = this.cameras.main.centerY;

        this.add.graphics()
            .fillStyle(0x1a1a1a, 1)
            .fillRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16)
            .lineStyle(2, 0xd4af37, 1)
            .strokeRoundedRect(panelX - panelWidth / 2, panelY - panelHeight / 2, panelWidth, panelHeight, 16);

        this.createLeftPanel(panelX, panelY, panelWidth, panelHeight);
        this.createRightPanel(panelX, panelY, panelWidth, panelHeight);

        this.add.text(panelX, panelY + panelHeight / 2 - 20, 'Press ENTER to close', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#aaaaaa',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.stop();
            this.scene.resume('HomeScene');
        });
    }

    createLeftPanel(panelX, panelY, panelWidth, panelHeight) {
        const leftPanelX = panelX - panelWidth / 4;
        const leftPanelY = panelY;

        this.add.image(leftPanelX, leftPanelY - panelHeight / 6, this.villager.textureKey)
            .setScale(0.67)
            .setOrigin(0.5);

        this.add.text(leftPanelX, leftPanelY + panelHeight / 6, 'CHARACTERISTICS', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const statsText = [
            "Mood: Cheerful",
            "Occupation: Farmer",
            "Likes: Sunshine, Apples",
            "Dislikes: Rain, Goblins"
        ];

        this.add.text(leftPanelX, leftPanelY + panelHeight / 4 + 20, statsText, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#dddddd',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);
    }

    createRightPanel(panelX, panelY, panelWidth, panelHeight) {
        const rightPanelX = panelX + panelWidth / 4;
        const rightPanelY = panelY - panelHeight / 2 + 50;

        const conversation = [
            { speaker: 'Villager', line: 'Oh, hello there, traveler! It\'s a fine day, isn\'t it?' },
            { speaker: 'Player', line: 'It is! I was just exploring the area.' },
            { speaker: 'Villager', line: 'Be careful in the woods to the east. I\'ve heard strange noises coming from there lately.' },
            { speaker: 'Player', line: 'Thanks for the warning. I\'ll keep an eye out.' }
        ];

        let textY = rightPanelY;
        const textStyle = {
            fontFamily: 'Arial',
            fontSize: '18px',
            wordWrap: { width: panelWidth / 2 - 60 }
        };

        conversation.forEach(entry => {
            let lineText;
            if (entry.speaker === 'Player') {
                lineText = this.add.text(rightPanelX, textY, `You: ${entry.line}`, {
                    ...textStyle,
                    color: '#87ceeb'
                }).setOrigin(0.5, 0);
            } else {
                lineText = this.add.text(rightPanelX, textY, `${entry.speaker}: ${entry.line}`, {
                    ...textStyle,
                    color: '#ffffff'
                }).setOrigin(0.5, 0);
            }
            textY += lineText.getBounds().height + 20;
        });
    }
}
