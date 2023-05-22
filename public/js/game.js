const FLOOR_OBSTACLE_SPEED = -200;
let score = 0;
let isGameOver = false;
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 450,
    },
    backgroundColor: '#000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false,
        },
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
    },
};

const game = new Phaser.Game(config);

function preload() {
    // Load game assets here
    loadBackgroundLayers.call(this);
    loadAlitu.call(this);
    loadFactoryFloor.call(this);
    loadObstacles.call(this);

    // Load game over background image
    this.load.image('game_over_bg', 'assets/game_over_bg.png');
    // Load the QR code image
    this.load.image('qr_code', 'assets/qr_code.png');

}

function create() {
    // Set up game objects here
    createBackgroundLayers.call(this);
    createFactoryFloor.call(this);
    createAlitu.call(this);
    this.physics.add.collider(this.alitu, this.floor);
    createObstacles.call(this);
    createUI.call(this);

    this.spawnObstacle = spawnObstacle.bind(this); // Added this line
    this.obstacleSpawnCounter = getRandomSpawnDelay();
    this.spawnDelay = getRandomSpawnDelay(); // Initialize the spawn delay
}

function update() {
    if (isGameOver) {
        return;
    }

    handleObstacleSpawn.call(this);
    updateBackgroundLayers.call(this);
    updateFactoryFloor.call(this);
    updateObstacles.call(this);
    updateAlitu.call(this);
    updateUI.call(this);

}

// Loading assets
function loadBackgroundLayers() {
    for (let i = 1; i <= 5; i++) {
        if (i === 4) {
            for (let j = 0; j < 11; j++) {
                this.load.image(`bg_layer${i}_${j}`, `assets/city${i}_${j}.png`);
            }
        } else {
            this.load.image(`bg_layer${i}`, `assets/city${i}.png`);
        }
    }
}

function loadAlitu() {
    this.load.spritesheet('alitu_run', 'assets/alitu_run.png', { frameWidth: 38, frameHeight: 64 });
    this.load.spritesheet('alitu_jump', 'assets/alitu_jump.png', { frameWidth: 38, frameHeight: 64 });
}

function loadFactoryFloor() {
    this.load.image('factory_floor', 'assets/city_floor.png');
}

function loadObstacles() {
    this.load.image('barrel', 'assets/barrel.png');
}

function handleObstacleSpawn() {
    this.obstacleSpawnCounter++;

    if (this.obstacleSpawnCounter >= this.spawnDelay) {
        this.obstacleSpawnCounter = 0;
        this.spawnDelay = getRandomSpawnDelay(); // Update the spawn delay
        this.spawnObstacle();
    }
}


function getRandomSpawnDelay() {
    const minDelay = 60; // 1 second (assuming 60 FPS)
    const maxDelay = 180; // 3 seconds (assuming 60 FPS)
    return Phaser.Math.Between(minDelay, maxDelay);
}

// Create game objects
function createBackgroundLayers() {
    this.backgroundLayers = [];
    const speedFactors = [0.1, 0.3, 0.5, 0.7, 0.9];

    for (let i = 0; i < 5; i++) {
        if (i === 3) {
            let j = 0;
            const layer1 = this.add.image(0, 0, `bg_layer${i + 1}_${j}`);
            const scaleX = config.scale.width / layer1.width;
            const scaleY = config.scale.height / layer1.height;
            const scale = Math.min(scaleX, scaleY);
            layer1.setScale(scale);
            const layer2 = this.add.image(layer1.width * scale, 0, `bg_layer${i + 1}_${(j + 1) % 11}`);
            layer2.setScale(scale);
            layer1.setOrigin(0, 0);
            layer2.setOrigin(0, 0);
            this.backgroundLayers.push({ layer1, layer2, speedFactor: speedFactors[i], variation: j });
        } else {
            const layer1 = this.add.image(0, 0, `bg_layer${i + 1}`);
            const scaleX = config.scale.width / layer1.width;
            const scaleY = config.scale.height / layer1.height;
            const scale = Math.min(scaleX, scaleY);
            layer1.setScale(scale);
            const layer2 = this.add.image(layer1.width * scale, 0, `bg_layer${i + 1}`);
            layer2.setScale(scale);
            layer1.setOrigin(0, 0);
            layer2.setOrigin(0, 0);
            this.backgroundLayers.push({ layer1, layer2, speedFactor: speedFactors[i] });
        }
    }
}

function createAlitu() {
    this.alitu = this.physics.add.sprite(100, config.scale.height - 120, 'alitu_run');
    this.alitu.setScale(1.2);  // Add this line
    this.alitu.setCollideWorldBounds(true);

    // Calculate the new width for the collider
    const colliderWidth = this.alitu.width * 0.3; 

    // Set the collider's size and offset
    this.alitu.body.setSize(colliderWidth, this.alitu.height);
    this.alitu.body.setOffset((this.alitu.width - colliderWidth) / 2, 0);

    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('alitu_run', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
    });

    this.anims.create({
        key: 'alitu_jump',
        frames: this.anims.generateFrameNumbers('alitu_jump', { start: 0, end: 3 }),
        frameRate: 10,
    });

    this.alitu.play('run');
}

function createFactoryFloor() {
    const floorTileWidth = 32;
    const floorTileHeight = 32;
    const floorTilesCount = Math.ceil(config.scale.width / floorTileWidth) + 1;
    this.floor = this.physics.add.staticGroup();

    for (let i = 0; i < floorTilesCount; i++) {
        const floorTile = this.floor.create(i * floorTileWidth, config.scale.height - floorTileHeight, 'factory_floor');
        floorTile.setOrigin(0, 0);
        floorTile.refreshBody();
    }

    this.floor.setOrigin(0, 0);
}

function spawnObstacle() {
    const obstacleTypes = ['barrel']; // Add more obstacle keys here if you have more types
    const randomObstacleKey = Phaser.Utils.Array.GetRandom(obstacleTypes);
    const obstacle = this.obstacles.create(config.scale.width, config.scale.height - 32 - 32 - 32, randomObstacleKey); // Subtract 32 for the obstacle height

    obstacle.setVelocityX(FLOOR_OBSTACLE_SPEED);
    obstacle.setOrigin(0, 0);
    this.physics.add.collider(obstacle, this.floor);
    this.physics.add.overlap(this.alitu, obstacle, alituHitObstacle, null, this);
    console.log("Obstacle spawned:", obstacle); // Added this line

}

function createObstacles() {
    this.obstacles = this.physics.add.group();
}

function createUI() {
    const topMargin = config.scale.height * 0.1;
    this.scoreText = this.add.text(config.scale.width / 2, topMargin, score, { fontFamily: 'arcadegamer', fontSize: '24px', fill: '#ffffff', lineHeight: '42px' }).setOrigin(0.5);
    this.scoreText.setPadding(10,10,10,10);

    const highscore = localStorage.getItem('highscore') || 0;
    this.highscoreText = this.add.text(config.scale.width / 2, topMargin + 20, `hi: ${highscore}`, { fontFamily: 'arcadegamer', fontSize: '10px', fill: '#ffffff' }).setOrigin(0.5);
}

// Update game objects
function updateBackgroundLayers() {
    this.backgroundLayers.forEach((bgLayer) => {
        const { layer1, layer2, speedFactor, variation } = bgLayer;
        layer1.x -= speedFactor;
        layer2.x -= speedFactor;

        // Reposition the layer when it's off the screen
        if (layer1.x <= -layer1.width * layer1.scaleX) {
            layer1.x = layer2.x + layer2.width * layer2.scaleX - 1;
            if (variation !== undefined) {
                bgLayer.variation = (variation + 1) % 11; // Update the variation directly
                layer1.setTexture(`bg_layer4_${bgLayer.variation}`);
            }
        }

        if (layer2.x <= -layer2.width * layer2.scaleX) {
            layer2.x = layer1.x + layer1.width * layer1.scaleX - 1;
            if (variation !== undefined) {
                bgLayer.variation = (variation + 1) % 11; // Update the variation directly
                layer2.setTexture(`bg_layer4_${bgLayer.variation}`);
            }
        }
    });
}

function updateFactoryFloor() {
    this.floor.children.iterate(function (child) {
        child.x += FLOOR_OBSTACLE_SPEED * (1 / 60);
        if (child.x <= -child.width) {
            child.x += child.width * (Math.ceil(config.scale.width / child.width) + 1);
        }
    });
}

function updateObstacles() {
    this.obstacles.children.iterate(function (child) {
        if (child.x <= -child.width) {
            child.x = config.scale.width + Phaser.Math.Between(200, 400);
            child.y = config.scale.height - 32 - 32 - 32;
            console.log("Obstacle moved:", child); // Added this line
        }
    });
}


function updateAlitu() {
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    if (this.spaceKey.isDown && this.alitu.body.onFloor()) {
        this.alitu.setVelocityY(-300);
    }

    if (this.alitu.body.onFloor() && this.alitu.anims.currentAnim.key !== 'run') {
        this.alitu.play('run');
    } else if (!this.alitu.body.onFloor() && this.alitu.anims.currentAnim.key !== 'alitu_jump') {
        this.alitu.play('alitu_jump', true);
    }
}

function updateUI() {
    score += 1;
    this.scoreText.setText(score);
}


function alituHitObstacle() {
    if (!isGameOver) {
        isGameOver = true;
        gameOver.call(this);
    }
}

async function displayQRCode(data, blackRect) {
    const qrTypeNumber = 0;
    const qrErrorCorrectLevel = 'H';
    const qr = qrcode(qrTypeNumber, qrErrorCorrectLevel);
    qr.addData(data);
    qr.make();
    const qrImageDataUri = qr.createDataURL(8, 4);
  
    // Remove the existing 'qr_code' texture if it exists
    if (this.textures.exists('qr_code')) {
        this.textures.remove('qr_code');
    }
  
    // Add the new 'qr_code' texture
    this.textures.addBase64('qr_code', qrImageDataUri).once('onload', () => {
        // Update the QR code image position
        const qrImage = this.add.image(config.scale.width * 0.5, config.scale.height * 0.6, 'qr_code'); // Moved the QR code down
        qrImage.setOrigin(0.5, 0.5);
        qrImage.setScale(0.5);
        qrImage.setInteractive();
        qrImage.on('pointerdown', () => {
            blackRect.destroy();
            qrImage.destroy();
            this.gameOverText.destroy();
            this.finalScoreText.destroy();
            this.qrInstructionText.destroy();
            this.scene.restart();
            score = 0;
            isGameOver = false;
        });
    }, this);
}

function fadeToBlack(scene, callback, color) {
    const blackRect = scene.add.rectangle(0, 0, config.scale.width, config.scale.height, color);
    blackRect.setOrigin(0, 0);
    blackRect.alpha = 0;
    scene.tweens.add({
        targets: blackRect,
        alpha: { from: 0, to: 0.95 },
        duration: 1000,
        onComplete: () => {
            callback(blackRect);
        },
    });
}

 class TweenHelper {
    static flashElement(scene, element, repeat = true, easing = 'Linear', overallDuration = 750, visiblePauseDuration = 250) {
        if (scene && element) {
            let flashDuration = overallDuration - visiblePauseDuration / 2;

            scene.tweens.timeline({
                tweens: [
                    {
                        targets: element,
                        duration: 0,
                        alpha: 0,
                        ease: easing
                    },
                    {
                        targets: element,
                        duration: flashDuration,
                        alpha: 1,
                        ease: easing
                    },
                    {
                        targets: element,
                        duration: visiblePauseDuration,
                        alpha: 1,
                        ease: easing
                    },
                    {
                        targets: element,
                        duration: flashDuration,
                        alpha: 0,
                        ease: easing,
                        onComplete: () => {
                            if (repeat === true) {
                                this.flashElement(scene, element);
                            }
                        }
                    }
                ]
            });
        }
    }
}

async function gameOver() {
    this.physics.pause();
    this.alitu.play('run', false);

    let highscore = localStorage.getItem('highscore');
    let fadeColor = highscore && score > highscore ? 0x127e1a : 0xCF372F;

    await new Promise((resolve) => fadeToBlack(this, resolve, fadeColor)).then((blackRect) => {
        // Grouped the gameover and qr code message together at the top of the screen with a little margin.
        const topMargin = config.scale.height * 0.1;
        const bottomMargin = config.scale.height - (config.scale.height * 0.1);
        this.gameOverText = this.add.text(config.scale.width / 2, topMargin + 60, score > highscore ? 'New high score!' : 'Game Over', { fontFamily: 'arcadegamer', fontSize: '38px', fill: '#ffffff' }).setOrigin(0.5);
        this.finalScoreText = this.add.text(config.scale.width / 2, topMargin, score, { fontFamily: 'arcadegamer', fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);
        this.qrInstructionText = this.add.text(config.scale.width / 2, topMargin + 100, 'Scan to join the leaderboard', { fontFamily: 'arcadegamer', fontSize: '14px', fill: '#FFED2B', wordWrap: { width: config.scale.width * 0.6 } }).setOrigin(0.5); // Increased wordWrap width to 60%
        //this.playerNumberText = this.add.text(config.scale.width / 2, topMargin + 40, 'Player 1', { fontFamily: 'arcadegamer', fontSize: '12px', fill: '#FFED2B' }).setOrigin(0.5);
        this.playerHighscoreText = this.add.text(config.scale.width / 2, topMargin + 20, `hi: ${highscore}`, { fontFamily: 'arcadegamer', fontSize: '10px', fill: '#ffffff' }).setOrigin(0.5);
        const url = `https://colingray663784.typeform.com/to/NjjCTE6D#score=${score}`;
        displayQRCode.call(this, url, blackRect); // Assuming this generates the 'qr_code' texture

        if (score > highscore) {
            localStorage.setItem('highscore', score);
            this.playerHighscoreText.setText(`hi: ${score}`);
        }

        // Get the bounds of the qrInstructionText
        const instructionsBounds = this.qrInstructionText.getBounds();

        const pressToPlayText = this.add.text(config.scale.width / 2, bottomMargin, 'PRESS BUTTON TO PLAY', { fontFamily: 'arcadegamer', fontSize: '16px', fill: '#FFED2B' }).setOrigin(0.5); // Added a flashing text at the bottom center of the screen

        // Make the 'press to play' text flash
        TweenHelper.flashElement(this, pressToPlayText);


        // Update the QR code image position and scale to be perfectly in the center of the screen
        this.textures.once('addtexturekey', () => {
            const qrw = config.scale.width / 2;
            const qrh = config.scale.height / 2;
            const qrImage = this.add.image(qrw, qrh, 'qr_code');
            qrImage.setOrigin(0.5);
            qrImage.setScale(0.3);
            qrImage.setInteractive();
        }, this);

        // Enable the spacebar key to restart the game
        this.input.keyboard.on('keydown-SPACE', () => {
            blackRect.destroy();
            this.gameOverText.destroy();
            this.finalScoreText.destroy();
            this.qrInstructionText.destroy();
            this.scene.restart();
            score = 0;
            isGameOver = false;
        });
    });
}




