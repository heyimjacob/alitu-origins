const FLOOR_OBSTACLE_SPEED = -600;
const FLYING_OBSTACLE_SPEED = -900; // Set the flying obstacle speed

let score = 0;
let isGameOver = false;
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080,
    },
    backgroundColor: '#000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: true,
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

    // Load flying obstacle
    this.load.image('roejogan', 'assets/roejogan.png');
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

    // Set up flying obstacles
    this.flyingObstacles = this.physics.add.group();

    // Bind the new spawn functions
    this.spawnFlyingObstacle = spawnFlyingObstacle.bind(this);
    this.flyingObstacleSpawnCounter = getRandomSpawnDelay();
    this.flyingObstacleSpawnDelay = getRandomFlyingObstacleSpawnDelay();
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

    if (score >= 200) {
        this.flyingObstacleSpawnCounter++;

        if (this.flyingObstacleSpawnCounter >= this.flyingObstacleSpawnDelay) {
            this.flyingObstacleSpawnCounter = 0;
            this.flyingObstacleSpawnDelay = getRandomSpawnDelay();
            this.spawnFlyingObstacle();
        }
    }

    updateObstacles.call(this);
    updateAlitu.call(this);
    updateUI.call(this);

}

// ------- LOAD ASSETS -------

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

// ----- BACKGROUND -------

let currentVariation = 0;

// Create game objects
function createBackgroundLayers() {
    this.backgroundLayers = [];
    const speedFactors = [1, 1.2, 1.6, 1.8, 2];
    // For debug: const speedFactors = [10,10, 10, 10, 10];

    for (let i = 0; i < 5; i++) {
        if (i === 3) {
            let layers = [];
            let xPosition = 0;
            for (let j = 0; j < 11; j++) {
                const layer = this.add.image(xPosition, 0, `bg_layer${i + 1}_${j}`);
                const scaleX = config.scale.width / layer.width;
                const scaleY = config.scale.height / layer.height;
                const scale = Math.min(scaleX, scaleY);
                layer.setScale(scale);
                layer.setOrigin(0, 0);
                layers.push(layer);
                xPosition += layer.width * scale;
            }
            this.backgroundLayers.push({ layers, speedFactor: speedFactors[i] });
        } else {
            const layer1 = this.add.image(0, 0, `bg_layer${i + 1}`);
            const scaleX = config.scale.width / layer1.width;
            const scaleY = config.scale.height / layer1.height;
            const scale = Math.min(scaleX, scaleY);
            layer1.setScale(scale);
            layer1.setOrigin(0, 0);
            const layer2 = this.add.image(layer1.width * scale, 0, `bg_layer${i + 1}`);
            layer2.setScale(scale);
            layer2.setOrigin(0, 0);
            this.backgroundLayers.push({ layers: [layer1, layer2], speedFactor: speedFactors[i] });
        }
    }
}

function updateBackgroundLayers() {
    this.backgroundLayers.forEach((bgLayer) => {
        const { layers, speedFactor } = bgLayer;
        layers.forEach(layer => {
            layer.x -= speedFactor;
            // When the layer moves off screen to the left, move it to the far right
            if (layer.x <= -layer.width * layer.scaleX) {
                const lastLayer = layers[layers.length - 1];
                layer.x = lastLayer.x + lastLayer.width * lastLayer.scaleX - 1;
                // Move the layer to the end of the layers array
                layers.push(layers.shift());
            }
        });
    });
}

// ----- ALITU -----

function createAlitu() {
    this.alitu = this.physics.add.sprite(300, config.scale.height - 160, 'alitu_run');
    this.alitu.setScale(3);  // Add this line
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
        frameRate: 15,
    });

    this.alitu.play('run');
}

function updateAlitu() {
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    if (this.spaceKey.isDown && this.alitu.body.onFloor()) {
        this.alitu.setVelocityY(-620);
    }

    if (this.alitu.body.onFloor() && this.alitu.anims.currentAnim.key !== 'run') {
        this.alitu.play('run');
    } else if (!this.alitu.body.onFloor() && this.alitu.anims.currentAnim.key !== 'alitu_jump') {
        this.alitu.play('alitu_jump', true);
    }
}

// ----- FLOOR -----

function createFactoryFloor() {
    const floorTileWidth = 46;
    const floorTileHeight = 46;
    const floorTilesCount = Math.ceil(config.scale.width / floorTileWidth) + 1;
    this.floor = this.physics.add.staticGroup();

    for (let i = 0; i < floorTilesCount; i++) {
        const floorTile = this.floor.create(i * floorTileWidth, config.scale.height - floorTileHeight, 'factory_floor');
        floorTile.setOrigin(0, 0);
        floorTile.refreshBody();
    }

    this.floor.setOrigin(0, 0);
}

function updateFactoryFloor() {
    this.floor.children.iterate(function (child) {
        child.x += FLOOR_OBSTACLE_SPEED * (1 / 60);
        if (child.x <= -child.width) {
            child.x += child.width * (Math.ceil(config.scale.width / child.width) + 1);
        }
    });
}

// ------ OBSTACLES -------

function spawnObstacle() {
    const obstacleTypes = ['barrel']; // Add more obstacle keys here if you have more types
    const randomObstacleKey = Phaser.Utils.Array.GetRandom(obstacleTypes);
    const obstacle = this.obstacles.create(config.scale.width, config.scale.height - 64 - 64 - 64, randomObstacleKey); // Subtract 32 for the obstacle height

    obstacle.setVelocityX(FLOOR_OBSTACLE_SPEED);
    obstacle.setOrigin(0, 0);
    obstacle.setScale(3);

    this.physics.add.collider(obstacle, this.floor);
    this.physics.add.overlap(this.alitu, obstacle, alituHitObstacle, null, this);
    console.log("Obstacle spawned:", obstacle); // Added this line

}

function spawnFlyingObstacle() {
    const minHeight = 200; // Minimum height (in pixels from the top)
    const maxHeight = 600; // Maximum height (in pixels from the top)
    const randomHeight = Phaser.Math.Between(minHeight, maxHeight);

    const flyingObstacle = this.flyingObstacles.create(config.scale.width, randomHeight, 'roejogan');

    flyingObstacle.setVelocityX(FLYING_OBSTACLE_SPEED);
    flyingObstacle.setOrigin(0, 0);
    flyingObstacle.setScale(1);
    flyingObstacle.body.setAllowGravity(false); // Prevent gravity from affecting this obstacle

    this.physics.add.collider(this.alitu, flyingObstacle, alituHitObstacle, null, this);
    console.log("Flying Obstacle spawned:", flyingObstacle);
}




function createObstacles() {
    this.obstacles = this.physics.add.group();
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

function handleObstacleSpawn() {
    this.obstacleSpawnCounter++;

    if (this.obstacleSpawnCounter >= this.spawnDelay) {
        this.obstacleSpawnCounter = 0;
        this.spawnDelay = getRandomSpawnDelay();
        this.spawnObstacle();
    }

    this.flyingObstacleSpawnCounter++;

    if (this.flyingObstacleSpawnCounter >= this.flyingObstacleSpawnDelay) {
        this.flyingObstacleSpawnCounter = 0;
        this.flyingObstacleSpawnDelay = getRandomFlyingObstacleSpawnDelay();
        this.spawnFlyingObstacle();
    }    
}


function getRandomSpawnDelay() {
    const minDelay = 60; // 1 second (assuming 60 FPS)
    const maxDelay = 180; // 3 seconds (assuming 60 FPS)
    return Phaser.Math.Between(minDelay, maxDelay);
}

function getRandomFlyingObstacleSpawnDelay() {
    const minDelay = 800; // 5 seconds (assuming 60 FPS)
    const maxDelay = 1800; // 10 seconds (assuming 60 FPS)
    return Phaser.Math.Between(minDelay, maxDelay);
}


// ------ UI ------- 



function createUI() {
    const topMargin = config.scale.height * 0.1;
    this.scoreText = this.add.text(config.scale.width / 2, topMargin, score, { fontFamily: 'arcadegamer', fontSize: '46px', fill: '#ffffff', lineHeight: '42px' }).setOrigin(0.5);
    this.scoreText.setPadding(10,10,10,10);

    const highscore = localStorage.getItem('highscore') || 0;
    this.highscoreText = this.add.text(config.scale.width / 2, topMargin + 50, `hi: ${highscore}`, { fontFamily: 'arcadegamer', fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);
}

// Update game objects



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
        const qrImage = this.add.image(config.scale.width * 0.5, config.scale.height * 0.64, 'qr_code'); // Moved the QR code down
        qrImage.setOrigin(0.5, 0.5);
        qrImage.setScale(1);
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
        
        const topMargin = config.scale.height * 0.1;
        const bottomMargin = config.scale.height - (config.scale.height * 0.1);

        this.finalScoreText = this.add.text(config.scale.width / 2, topMargin, score, { fontFamily: 'arcadegamer', fontSize: '48px', fill: '#ffffff' }).setOrigin(0.5);
        this.playerHighscoreText = this.add.text(config.scale.width / 2, topMargin + 60, `hi: ${highscore}`, { fontFamily: 'arcadegamer', fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);

        this.gameOverText = this.add.text(config.scale.width / 2, topMargin + 180, score > highscore ? 'New high score!' : 'Game Over', { fontFamily: 'arcadegamer', fontSize: '96px', fill: '#ffffff' }).setOrigin(0.5);
        
        this.qrInstructionText = this.add.text(config.scale.width / 2, topMargin + 290, 'Scan to join the leaderboard and win prizes', { fontFamily: 'arcadegamer', fontSize: '32px', fill: '#FFED2B', align: 'center', wordWrap: { width: config.scale.width * 0.5 } }).setOrigin(0.5); // Increased wordWrap width to 60%
        //this.playerNumberText = this.add.text(config.scale.width / 2, topMargin + 40, 'Player 1', { fontFamily: 'arcadegamer', fontSize: '12px', fill: '#FFED2B' }).setOrigin(0.5);

        const qrurl = `https://colingray663784.typeform.com/to/NjjCTE6D#score=${score}`;
        displayQRCode.call(this, qrurl, blackRect); // Assuming this generates the 'qr_code' texture

        if (score > highscore) {
            localStorage.setItem('highscore', score);
            this.playerHighscoreText.setText(`hi: ${score}`);
        }

        // Get the bounds of the qrInstructionText
        const instructionsBounds = this.qrInstructionText.getBounds();

        const pressToPlayText = this.add.text(config.scale.width / 2, bottomMargin, 'PRESS BUTTON TO PLAY', { fontFamily: 'arcadegamer', fontSize: '32px', fill: '#FFED2B' }).setOrigin(0.5); // Added a flashing text at the bottom center of the screen

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




