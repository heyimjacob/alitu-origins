const FLOOR_OBSTACLE_SPEED = -200;
let score = 0;
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
        gravity: { y: 500 },
      },
    },
    scene: {
      preload: preload,
      create: create,
      update: update,
    },
  };
const game = new Phaser.Game(config);
  
function gameOver() {
this.physics.pause();
this.alitu.play('run', false);
this.gameOverText = this.add.text(config.scale.width / 2, config.scale.height / 2, 'Game Over', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5, 0.5);

this.input.on('pointerdown', () => {
    this.scene.restart();
    score = 0;
});
}

function alituHitObstacle() {
this.physics.pause();
this.alitu.play('run', false);
this.gameOverText = this.add.text(config.scale.width / 2, config.scale.height / 2, 'Game Over', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5, 0.5);

this.input.on('pointerdown', () => {
    this.scene.restart();
    score = 0;
});
}
  
function preload() {
// Load game assets here

for (let i = 1; i <= 5; i++) {
    this.load.image(`bg_layer${i}`, `assets/bg_layer${i}.png`);
    }
// Load Alitu character sprites
this.load.spritesheet('alitu_run', 'assets/alitu_run.png', { frameWidth: 38, frameHeight: 64 });
this.load.spritesheet('alitu_jump', 'assets/alitu_jump.png', { frameWidth: 38, frameHeight: 64 });

// Load factory floor tileset
this.load.image('factory_floor', 'assets/factory_floor.png');

// Load obstacle (e.g., barrels)
this.load.image('barrel', 'assets/barrel.png');
}
  
function create() {
// Set up game objects here

// Background layers and corresponding speed factors
this.backgroundLayers = [];
const speedFactors = [0.1, 0.3, 0.5, 0.7, 0.9];

for (let i = 0; i < 5; i++) {
    const layer1 = this.add.image(0, 0, `bg_layer${i + 1}`);
    const layer2 = this.add.image(layer1.width, 0, `bg_layer${i + 1}`);

    const scaleY = config.scale.height / layer1.height;
    layer1.setScale(1, scaleY);
    layer2.setScale(1, scaleY);

    layer1.setOrigin(0, 0);
    layer2.setOrigin(0, 0);
    this.backgroundLayers.push({ layer1, layer2, speedFactor: speedFactors[i] });
}

// Set up Alitu character
this.alitu = this.physics.add.sprite(100, config.scale.height - 64, 'alitu_run');
this.alitu.setCollideWorldBounds(true);

// Create animations for Alitu
this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('alitu_run', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
});

this.anims.create({
    key: 'jump',
    frames: this.anims.generateFrameNumbers('alitu_jump', { start: 0, end: 3 }),
    frameRate: 10,
});

// Play the 'run' animation by default
this.alitu.play('run');

// Set up factory floor
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

// Set up obstacles (e.g., barrels)
this.obstacles = this.physics.add.group({
    key: 'barrel',
    repeat: 5,
    setXY: { x: config.scale.width, y: config.scale.height - 32 - 32, stepX: Phaser.Math.Between(200, 400) },
    });

// Initial velocity for obstacles
this.obstacles.children.iterate(function (child) {
    child.setVelocityX(FLOOR_OBSTACLE_SPEED);
});

// Add collision between Alitu and obstacles
this.physics.add.collider(this.alitu, this.obstacles);

// Add collision between obstacles and floor
this.physics.add.collider(this.obstacles, this.floor);

// Collision between Alitu and the floor
this.physics.add.collider(this.alitu, this.floor);

// Reference to spacebar
this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

// UI 

// Create a score text object
this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#ffffff' });

    // Add collision between Alitu and obstacles with a callback function
this.physics.add.collider(this.alitu, this.obstacles, () => {
    this.alituHitObstacle();
}, null, this);
}
  
function update() {
// Update game logic here

// Parallax scrolling
this.backgroundLayers.forEach(({ layer1, layer2, speedFactor }) => {
    layer1.x -= speedFactor;
    layer2.x -= speedFactor;

    if (layer1.x <= -layer1.width) {
    layer1.x = layer2.x + layer2.width;
    }

    if (layer2.x <= -layer2.width) {
    layer2.x = layer1.x + layer1.width;
    }
});

// Move and reset floor tiles
this.floor.children.iterate(function (child) {
    child.x += FLOOR_OBSTACLE_SPEED * (1 / 60);
    if (child.x <= -child.width) {
    child.x += child.width * (Math.ceil(config.scale.width / child.width) + 1);
    }
});

// Move and reset obstacles
this.obstacles.children.iterate(function (child) {
    if (child.x <= -child.width) {
    child.x = config.scale.width + Phaser.Math.Between(200, 400);
    }
});


if (this.spaceKey.isDown && this.alitu.body.onFloor()) {
    this.alitu.setVelocityY(-300);
    this.alitu.play('jump', true);
  }
  // Play the 'run' animation if Alitu is on the floor and not already playing the 'run' animation
  if (this.alitu.body.onFloor() && this.alitu.anims.currentAnim.key !== 'run') {
    this.alitu.play('run');
  }

  score += 1;
  this.scoreText.setText('Score: ' + score);

}
  
  
  

  
  