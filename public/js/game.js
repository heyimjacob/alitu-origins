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
        this.load.image(`bg_layer${i}`, `assets/city${i}.png`);
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
        const layer1 = this.add.image(0, 0, `bg_layer${i + 1}`);
        
        // Calculate the scale factors based on the aspect ratio of the original image
        const scaleX = config.scale.width / layer1.width;
        const scaleY = config.scale.height / layer1.height;
        const scale = Math.min(scaleX, scaleY);

        layer1.setScale(scale);

        // Set the initial position of the second image based on the scaled width of the first image
        const layer2 = this.add.image(layer1.width * scale, 0, `bg_layer${i + 1}`);
        layer2.setScale(scale);

        layer1.setOrigin(0, 0);
        layer2.setOrigin(0, 0);
        this.backgroundLayers.push({ layer1, layer2, speedFactor: speedFactors[i] });
    }
}



function createAlitu() {
    this.alitu = this.physics.add.sprite(100, config.scale.height - 64, 'alitu_run');
    this.alitu.setCollideWorldBounds(true);
    

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
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });
}

// Update game objects
function updateBackgroundLayers() {
    this.backgroundLayers.forEach(({ layer1, layer2, speedFactor }) => {
        layer1.x -= speedFactor;
        layer2.x -= speedFactor;

        // Reposition the layer when it's off the screen
        if (layer1.x <= -layer1.width * layer1.scaleX) {
            layer1.x = layer2.x + layer2.width * layer2.scaleX - 1;
        }

        if (layer2.x <= -layer2.width * layer2.scaleX) {
            layer2.x = layer1.x + layer1.width * layer1.scaleX - 1;
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
    this.scoreText.setText('Score: ' + score);
}

function alituHitObstacle() {
    if (!isGameOver) {
        isGameOver = true;
        gameOver.call(this);
    }
}

function displayQRCode(data) {
    const qrTypeNumber = 0;
    const qrErrorCorrectLevel = 'H';
    const qr = qrcode(qrTypeNumber, qrErrorCorrectLevel);
    qr.addData(data);
    qr.make();
    const qrImageDataUri = qr.createDataURL(8, 4);

    this.textures.addBase64('qr_code', qrImageDataUri).once('onload', () => {
        const qrImage = this.add.image(config.scale.width / 2, config.scale.height / 2, 'qr_code');
        qrImage.setOrigin(0.5, 0.5);
        qrImage.setScale(0.5);
        qrImage.setInteractive();
        qrImage.on('pointerdown', () => {
            qrImage.destroy();
            this.scene.restart();
            score = 0;
            isGameOver = false;
        });
    }, this);
}



async function gameOver() {
    this.physics.pause();
    this.alitu.play('run', false);
    this.gameOverText = this.add.text(config.scale.width / 2, config.scale.height / 2, 'Game Over', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5, 0.5);

    const url = `https://yourwebsite.com/submit-score?score=${score}`;
    await displayQRCode.call(this, url);
}


// TO DO:

// 1. Fade to black and show game over with score
// 2. Show QR code scoreboard instructions
// 3. Build a route to handle the scoreboard, and a flat file to StorageEvent
// 4. Find a way to create a linear story using the background generation system
// 4. Add rules of indie podcasting to yellow buildings
// 5. Create business deisgn center
// 6. Slow down the score
// 7. Add an intro where Alitu is chasing a truck throwing things off the back
// 8. Make some of the obstacles good and others bad

