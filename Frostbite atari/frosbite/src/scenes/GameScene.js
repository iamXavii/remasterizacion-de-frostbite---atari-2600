export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.spritesheet('player', 'assets/sprites/frostbite.png', {
      frameWidth: 84.75,
      frameHeight: 90.5
    });
    this.load.image('cielo', 'assets/sprites/cielo.png');
    this.load.image('plataforma', 'assets/sprites/plataforma.png');
    this.load.image('agua', 'assets/sprites/agua.png');
    this.load.image('suelo', 'assets/sprites/suelo.png');
    this.load.spritesheet('iglu', 'assets/sprites/iglu.png', {
      frameWidth: 141,
      frameHeight: 111

    });
  }

create() {
  const W = this.sys.game.config.width;
  const H = this.sys.game.config.height;

  // VIDAS
  if (this.registry.get('lives') === undefined) {
    this.registry.set('lives', 3);
  }
  this.lives = this.registry.get('lives');
  this.livesText = this.add.text(10, 10, 'Vidas: ' + this.lives, {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '20px',
    color: '#fff'
  }).setScrollFactor(0);

  // IGLÚ
  this.iglu = this.add.sprite(W - 30, 80, 'iglu', 8);
  this.iglu.setOrigin(1, 0);
  this.iglu.setScrollFactor(0);
  this.iglu.setScale(1);

  

  // Bind para callbacks
  this.handlePlatformCollision = this.handlePlatformCollision.bind(this);
  this.handleHazardOverlap = this.handleHazardOverlap.bind(this);

  // FONDO
  this.cielo1 = this.add.image(0, 0, 'cielo').setOrigin(0);
  this.cielo2 = this.add.image(W, 0, 'cielo').setOrigin(0);
  [this.cielo1, this.cielo2].forEach(c => c.setDisplaySize(W, H * 0.3).setDepth(-1));
  this.cieloSpeed = 0.5;

  // SUELO
  this.suelo = this.physics.add.staticImage(0, 180, 'suelo').setOrigin(0);
  const escalaSuelo = (W / this.suelo.width) * 0.5;
  this.suelo.setDisplaySize(W + 10, this.suelo.height * escalaSuelo).refreshBody();
  this.suelo.body.checkCollision.up = true;
  this.suelo.body.checkCollision.down = false;
  this.suelo.body.checkCollision.left = false;
  this.suelo.body.checkCollision.right = false;
  this.ySuelo = this.suelo.y;

  // AGUA
  this.agua = this.add.image(0, H, 'agua').setOrigin(0, 1);
  this.agua.setDisplaySize(W, H + 380);
  this.tweens.add({
    targets: this.agua,
    y: this.agua.y - 15,
    duration: 2000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // JUGADOR
  this.player = this.physics.add.sprite(50, 100, 'player', 0);
  this.player.setCollideWorldBounds(true);
  this.player.body.setGravityY(600);
  this.player.setCrop(0, 10, 84.75, 80);
  this.player.body.setSize(50, 90, true);

  // ANIMACIONES
  this.anims.create({ key: 'idle-left', frames: [{ key: 'player', frame: 1 }], frameRate: 1 });
  this.anims.create({ key: 'jump-left', frames: [{ key: 'player', frame: 0 }], frameRate: 1 });
  this.anims.create({ key: 'jump-right', frames: [{ key: 'player', frame: 3 }], frameRate: 1 });
  this.anims.create({ key: 'idle-right', frames: [{ key: 'player', frame: 2 }], frameRate: 1 });
  this.anims.create({
    key: 'walk-left',
    frames: [{ key: 'player', frame: 4 }, { key: 'player', frame: 5 }],
    frameRate: 6,
    repeat: -1
  });
  this.anims.create({
    key: 'walk-right',
    frames: [{ key: 'player', frame: 6 }, { key: 'player', frame: 7 }],
    frameRate: 6,
    repeat: -1
  });
  this.anims.create({ key: 'lie-down', frames: [{ key: 'player', frame: 0 }], frameRate: 1 });

  // PLATAFORMAS
  this.platforms = this.physics.add.staticGroup();
  const filas = [
    { y: 300, startX: 0, dir: 1 },
    { y: 420, startX: 300, dir: -1 },
    { y: 540, startX: 0, dir: 1 }
  ];
  const anchoPlat = 160, espacio = 10;
  filas.forEach(fila => {
    for (let i = 0; i < 3; i++) {
      const plat = this.platforms.create(
        fila.startX + i * (anchoPlat + espacio),
        fila.y,
        'plataforma'
      ).setOrigin(0);
      plat.body.checkCollision.up = true;
      plat.body.checkCollision.down = false;
      plat.body.checkCollision.left = false;
      plat.body.checkCollision.right = false;
      plat._dir = fila.dir;
      plat.setSize(anchoPlat, 20, true);
    }
  });

  // COLISIONES
  this.sueloCollider = this.physics.add.collider(this.player, this.suelo);
  this.platformCollider = this.physics.add.collider(
    this.player,
    this.platforms,
    this.handlePlatformCollision,
    null,
    this
  );

  // PELIGROS
  this.hazards = this.physics.add.staticGroup();
  const hazardPositions = [320, 440, 560];
  const hazardOffset = 5;
  hazardPositions.forEach(yPos => {
    const hz = this.add.rectangle(0, yPos + hazardOffset, W, 2, 0x000000, 0).setOrigin(0);
    this.physics.add.existing(hz, true);
    this.hazards.add(hz);
  });
  this.physics.add.overlap(this.player, this.hazards, this.handleHazardOverlap, null, this);

  // CONTROLES Y PAUSA
  this.cursors = this.input.keyboard.createCursorKeys();
  this.isPaused = false;
  this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  this.createPauseOverlay(W, H);

  // TEMPORIZADORES
  this.canFallThrough = false;
  this.platformTimer = 0;
  this.platformCooldown = 500;
  this.floorPassTimer = 0;
  this.floorPassCooldown = 500;
}



  update(time, delta) {
  // Fondo en movimiento
  [this.cielo1, this.cielo2].forEach(c => {
    c.x -= this.cieloSpeed;
    if (c.x + c.displayWidth <= 0) {
      c.x = (c === this.cielo1 ? this.cielo2 : this.cielo1).x + c.displayWidth;
    }
  });

  const onGround = this.player.body.blocked.down;
  const onPlatform = this.player.body.touching.down && !onGround;

  // Movimiento lateral y animaciones
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-160).anims.play(onGround ? 'walk-left' : 'jump-left', true);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(160).anims.play(onGround ? 'walk-right' : 'jump-right', true);
  } else {
    this.player.setVelocityX(0);
    if (onGround) {
      const prev = this.player.anims.currentAnim?.key;
      this.player.anims.play(prev?.includes('left') ? 'idle-left' : 'idle-right', true);
    }
  }

  // Salto
  if (this.cursors.up.isDown && (onGround || onPlatform)) {
    this.player.setVelocityY(-421);
  }

  // Caer a través de plataformas/suelo
  if (this.cursors.down.isDown && (onPlatform || onGround)) {
    if (this.platformTimer <= 0) {
      this.canFallThrough = true;
      this.platformTimer = this.platformCooldown;
      if (onPlatform) this.player.setVelocityY(300);
      if (onGround && this.player.y + this.player.height / 2 >= this.ySuelo - 5) {
        this.physics.world.removeCollider(this.sueloCollider);
        this.suelo.body.checkCollision.up = false;
        this.floorPassTimer = this.floorPassCooldown;
      }
    }
  }
  
  if (this.floorPassTimer > 0) this.floorPassTimer -= delta;
  if (!this.suelo.body.checkCollision.up && this.player.body.velocity.y < 0 &&
      this.player.y + this.player.height / 2 <= this.ySuelo) {
    this.sueloCollider = this.physics.add.collider(this.player, this.suelo);
    this.suelo.body.checkCollision.up = true;
  }
  if (this.platformTimer > 0) this.platformTimer -= delta;

  // Movimiento de plataformas
  const speedPlat = 2;
  this.platforms.getChildren().forEach(plat => {
    plat.x += speedPlat * plat._dir;
    if (plat._dir === 1 && plat.x > this.sys.game.config.width) {
      plat.x = -plat.displayWidth;
    } else if (plat._dir === -1 && plat.x + plat.displayWidth < 0) {
      plat.x = this.sys.game.config.width;
    }
    plat.refreshBody();
  });
}

// --- Funciones relacionadas ---

handlePlatformCollision(player, platform) {
  if (this.canFallThrough && this.platformTimer > 0) {
    platform.body.checkCollision.up = false;
    this.time.delayedCall(300, () => {
      platform.body.checkCollision.up = true;
      if (this.platformTimer <= 0) this.canFallThrough = false;
    });
    return;
  }

  if (player.body.velocity.y > 0 &&
      player.y + player.height / 2 < platform.y + 15 &&
      !this.canFallThrough) {

    player.body.velocity.y = 0;
    player.y = platform.y - player.displayHeight / 2 + 5;

    this.addPoints(100);
  }
}

handleHazardOverlap(player, hazard) {
  if (player.body.velocity.y <= 0) return;

  const plataformas = this.platforms.getChildren();
  const margen = 15;
  
  for (let i = 0; i < plataformas.length; i++) {
    const plat = plataformas[i];
    if (player.y < plat.y && 
        player.x + player.width / 2 > plat.x && 
        player.x - player.width / 2 < plat.x + plat.width) {
      return;
    }
  }

  if (player.y + player.height / 2 < this.suelo.y + 10) {
    return;
  }

  this.playDeathAnimation();
}

playDeathAnimation() {
  if (this.player.angle !== 0) return;
  
  this.physics.world.pause();
  this.player.setVelocity(0);
  this.tweens.add({
    targets: this.player,
    angle: 90,
    duration: 300,
    ease: 'Cubic.easeOut',
    onComplete: () => {
      this.loseLifeOrGameOver();
    }
  });
}

loseLifeOrGameOver() {
  this.lives--;
  this.registry.set('lives', this.lives);
  this.livesText.setText('Vidas: ' + this.lives);
  if (this.lives <= 0) {
    this.showGameOver();
  } else {
    this.time.delayedCall(500, () => {
      this.player.angle = 0;
      this.physics.world.resume();
      this.scene.restart();
    });
  }
}

showGameOver() {
  const W = this.sys.game.config.width;
  const H = this.sys.game.config.height;
  this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setDepth(100);
  this.add.text(W / 2, H / 2, 'GAME OVER', {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '50px',
    color: '#ff0000',
    stroke: '#000',
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(101);
}

createPauseOverlay(W, H) {
  this.pauseText = this.add.text(
    W / 2, H / 2, 'JUEGO PAUSADO',
    {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '50px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      align: 'center'
    }
  ).setOrigin(0.5).setDepth(100).setVisible(false);
  this.overlay = this.add.graphics();
  this.overlay.fillStyle(0x000000, 0.5);
  this.overlay.fillRect(0, 0, W, H);
  this.overlay.setDepth(99).setVisible(false);
}

togglePause() {
  this.isPaused = !this.isPaused;
  if (this.isPaused) {
    this.physics.world.pause();
    this.anims.pauseAll();
    this.pauseText.setVisible(true);
    this.overlay.setVisible(true);
  } else {
    this.physics.world.resume();
    this.anims.resumeAll();
    this.pauseText.setVisible(false);
    this.overlay.setVisible(false);
  }
  }
}