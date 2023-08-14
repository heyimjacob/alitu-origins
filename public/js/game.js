const FLOOR_OBSTACLE_SPEED = -500;
const FLYING_OBSTACLE_SPEED = -900;
const JUMP_SPEED = 1000;
const GRAVITY = 1600;
const DIFFICULTY = 10;
const ROGAN_INTERVAL = 5;

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
            gravity: { y: GRAVITY },
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

// Preload assets
function preload() {
    loadBackgroundLayers.call(this);
    loadAlitu.call(this);
    loadFactoryFloor.call(this);
    loadObstacles.call(this);
    this.load.image('game_over_bg', 'assets/game_over_bg.png');
    this.load.image('roejogan', 'assets/roejogan.png');
}

// Create game objects
function create() {
    createBackgroundLayers.call(this);
    createFactoryFloor.call(this);
    createAlitu.call(this);
    this.physics.add.collider(this.alitu, this.floor);
    createObstacles.call(this);
    createUI.call(this);

    this.spawnDelay = getRandomSpawnDelay();
    this.flyingObstacleSpawnDelay = getRandomFlyingObstacleSpawnDelay();

    this.spawnObstacle = spawnObstacle.bind(this);
    this.obstacleSpawnCounter = getRandomSpawnDelay();

    this.spawnFlyingObstacle = spawnFlyingObstacle.bind(this);
    this.flyingObstacleSpawnCounter = getRandomFlyingObstacleSpawnDelay();
}

// Update game objects
function update() {
    if (isGameOver) {
        return;
    }

    handleObstacleSpawn.call(this);  // This ensures ground obstacles are spawned
    handleFlyingObstacleSpawn.call(this);  // This ensures flying obstacles are spawned after a certain score

    updateBackgroundLayers.call(this);
    updateFactoryFloor.call(this);
    updateObstacles.call(this);
    updateAlitu.call(this);
    updateUI.call(this);
}


// -- Asset Loading --
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

// -- Background --
function createBackgroundLayers() {
    this.backgroundLayers = [];
    const speedFactors = [3, 3.2, 3.4, 3.6, 3.8];

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
            if (layer.x <= -layer.width * layer.scaleX) {
                const lastLayer = layers[layers.length - 1];
                layer.x = lastLayer.x + lastLayer.width * lastLayer.scaleX - 1;
                layers.push(layers.shift());
            }
        });
    });
}

// -- Alitu (Main Character) --
function createAlitu() {
    this.alitu = this.physics.add.sprite(300, config.scale.height - 160, 'alitu_run');
    this.alitu.setScale(3);
    this.alitu.setCollideWorldBounds(true);
    const colliderWidth = this.alitu.width * 0.3;
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
        frameRate: 17,
    });

    this.alitu.play('run');
}

function updateAlitu() {
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    if (this.spaceKey.isDown && this.alitu.body.onFloor()) {
        this.alitu.setVelocityY(-JUMP_SPEED);
    }

    if (this.alitu.body.onFloor() && this.alitu.anims.currentAnim.key !== 'run') {
        this.alitu.play('run');
    } else if (!this.alitu.body.onFloor() && this.alitu.anims.currentAnim.key !== 'alitu_jump') {
        this.alitu.play('alitu_jump', true);
    }
}

// -- Floor --
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

// -- Obstacles --
function spawnObstacle() {
    const obstacleTypes = ['barrel'];
    const randomObstacleKey = Phaser.Utils.Array.GetRandom(obstacleTypes);
    const obstacle = this.obstacles.create(config.scale.width, config.scale.height - 64 - 64 - 64, randomObstacleKey);

    obstacle.setVelocityX(FLOOR_OBSTACLE_SPEED);
    obstacle.setOrigin(0, 0);
    obstacle.setScale(3.5);

    this.physics.add.collider(obstacle, this.floor);
    this.physics.add.overlap(this.alitu, obstacle, alituHitObstacle, null, this);
}

function spawnFlyingObstacle() {
    const minHeight = 500;
    const maxHeight = 200;
    const randomHeight = Phaser.Math.Between(minHeight, maxHeight);

    const flyingObstacle = this.flyingObstacles.create(config.scale.width, randomHeight, 'roejogan');
    flyingObstacle.setVelocityX(FLYING_OBSTACLE_SPEED);
    flyingObstacle.setOrigin(0, 0);
    flyingObstacle.setScale(1);
    flyingObstacle.body.setAllowGravity(false);

    this.physics.add.collider(this.alitu, flyingObstacle, alituHitObstacle, null, this);
}

function createObstacles() {
    this.obstacles = this.physics.add.group();
    this.flyingObstacles = this.physics.add.group();
}

function updateObstacles() {
    this.obstacles.children.iterate(function (child) {
        if (child.x <= -child.width) {
            child.x = config.scale.width + Phaser.Math.Between(200, 400);
            child.y = config.scale.height - 32 - 32 - 32;
        }
    });

    this.flyingObstacles.children.iterate(function (child) {
        if (child.x <= -child.width) {
            child.destroy();  // destroy the flying obstacle when it goes out of the screen
        }
    });
}

function handleObstacleSpawn() {
    this.obstacleSpawnCounter++;

    if (this.obstacleSpawnCounter >= this.spawnDelay) {
        this.obstacleSpawnCounter = 0;
        this.spawnDelay = getRandomSpawnDelay();
        this.spawnObstacle();
        this.obstacleSpawnCounter = 0;

    }
}

function handleFlyingObstacleSpawn() {
    if (score > 2000) {
        this.flyingObstacleSpawnCounter++;

        if (this.flyingObstacleSpawnCounter >= this.flyingObstacleSpawnDelay) {
            this.flyingObstacleSpawnCounter = 0;
            this.flyingObstacleSpawnDelay = getRandomFlyingObstacleSpawnDelay();
            this.spawnFlyingObstacle();
            this.flyingObstacleSpawnCounter = 0;
        }
    }
}

function getRandomSpawnDelay() {
    const minDelay = 60 * (1 - score / (1000 * DIFFICULTY));
    const maxDelay = 200 * (1 - score / (1000 * DIFFICULTY));
    return Phaser.Math.Between(minDelay, maxDelay);
}

function getRandomFlyingObstacleSpawnDelay() {
    const minDelay = 100 * ROGAN_INTERVAL;
    const maxDelay = 400 * ROGAN_INTERVAL;
    return Phaser.Math.Between(minDelay, maxDelay);
}

// -- UI --
function createUI() {
    const topMargin = config.scale.height * 0.1;
    this.scoreText = this.add.text(config.scale.width / 2, topMargin, score, {
        fontFamily: 'arcadegamer',
        fontSize: '46px',
        fill: '#ffffff',
        lineHeight: '42px'
    }).setOrigin(0.5);

    const highscore = localStorage.getItem('highscore') || 0;
    this.highscoreText = this.add.text(config.scale.width / 2, topMargin + 50, `hi: ${highscore}`, {
        fontFamily: 'arcadegamer',
        fontSize: '24px',
        fill: '#ffffff'
    }).setOrigin(0.5);
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

function gameOver() {
    this.physics.pause();
    this.alitu.play('run', false);

    let highscore = localStorage.getItem('highscore');
    let fadeColor = highscore && score > highscore ? 0x127e1a : 0xCF372F;

    fadeToBlack(this, () => {
        const topMargin = config.scale.height * 0.1;
        this.finalScoreText = this.add.text(config.scale.width / 2, topMargin, score, {
            fontFamily: 'arcadegamer',
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.gameOverText = this.add.text(config.scale.width / 2, topMargin + 180, 
            score > highscore ? 'New high score!' : 'Game Over', {
                fontFamily: 'arcadegamer',
                fontSize: '96px',
                fill: '#ffffff'
            }).setOrigin(0.5);

        this.restartText = this.add.text(config.scale.width / 2, config.scale.height - 80, 'Press SPACE to Play Again', {
            fontFamily: 'arcadegamer',
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);
            

        this.tweens.add({
            targets: this.restartText,
            alpha: { start: 1, to: 0.2 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
            

        // TODO: Add leaderboard entry functionality here

        if (score > highscore) {
            localStorage.setItem('highscore', score);
        }

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.restart();
            score = 0;
            isGameOver = false;
        });
    }, fadeColor);
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
            callback();
        },
    });
}