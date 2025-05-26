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
  }

  create() {
    const screenWidth = this.sys.game.config.width;
    const screenHeight = this.sys.game.config.height;

    // Fondo cielo
    this.cielo1 = this.add.image(0, 0, 'cielo').setOrigin(0, 0);
    this.cielo2 = this.add.image(screenWidth, 0, 'cielo').setOrigin(0, 0);
    this.cielo1.setDisplaySize(screenWidth, screenHeight * 0.3);
    this.cielo2.setDisplaySize(screenWidth, screenHeight * 0.3);
    this.cielo1.setDepth(-1);
    this.cielo2.setDepth(-1);
    this.cieloSpeed = 0.5;

    // Suelo
    this.suelo = this.physics.add.staticImage(0, 180, 'suelo').setOrigin(0, 0);
    const escalaSuelo = (screenWidth / this.suelo.width) * 0.5;
    this.suelo.setDisplaySize(screenWidth + 10, this.suelo.height * escalaSuelo);
    this.suelo.refreshBody();

    // Posicion Y del suelo para comparar con el jugador
    this.ySuelo = this.suelo.y;

    // Agua
    const agua = this.add.image(0, screenHeight, 'agua').setOrigin(0, 1);
    const alturaDesdeSuelo = screenHeight + 380;
    agua.setDisplaySize(screenWidth, alturaDesdeSuelo);

    this.tweens.add({
      targets: agua,
      y: "-=15",
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Plataformas
    this.platforms = [];
    const plataformaWidth = 160;
    const espacio = 10;

    const filas = [
      { y: 300, startX: 0, dir: 1 },
      { y: 420, startX: 300, dir: -1 },
      { y: 540, startX: 0, dir: 1 }
    ];

    filas.forEach(fila => {
      let filaPlataformas = [];
      for (let i = 0; i < 3; i++) {
        const plat = this.physics.add.staticImage(
          fila.startX + i * (plataformaWidth + espacio),
          fila.y,
          'plataforma'
        ).setOrigin(0, 0);
        plat.body.allowGravity = false;
        plat._filaDir = fila.dir;
        plat._filaY = fila.y;
        filaPlataformas.push(plat);
      }
      this.platforms.push(filaPlataformas);
    });

    // jugador sobre suelo
    this.player = this.physics.add.sprite(50, 100, 'player', 0);
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(600);
    this.player.setCrop(0, 10, 84.75, 80);

    // Colisión con suelo
    this.sueloCollider = this.physics.add.collider(this.player, this.suelo);
    this.sueloColisionActiva = true;

    // Colisiones con plataformas
    this.platformColliders = [];
    this.platforms.forEach(fila => {
      fila.forEach(plat => {
        const col = this.physics.add.collider(this.player, plat);
        this.platformColliders.push(col);
      });
    });
    this.platformsColisionActiva = true;

    // Animaciones del jugador
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

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    // Movimiento infinito del cielo
    this.cielo1.x -= this.cieloSpeed;
    this.cielo2.x -= this.cieloSpeed;

    if (this.cielo1.x + this.cielo1.displayWidth <= 0) {
      this.cielo1.x = this.cielo2.x + this.cielo2.displayWidth;
    }
    if (this.cielo2.x + this.cielo2.displayWidth <= 0) {
      this.cielo2.x = this.cielo1.x + this.cielo1.displayWidth;
    }

    const onGround = this.player.body.blocked.down;

    // Movimiento horizontal
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play(onGround ? 'walk-left' : 'jump-left', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play(onGround ? 'walk-right' : 'jump-right', true);
    } else {
      this.player.setVelocityX(0);
      if (onGround) {
        const prevAnim = this.player.anims.currentAnim?.key;
        this.player.anims.play(prevAnim?.includes('left') ? 'idle-left' : 'idle-right');
      }
    }

    // Salto
    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(-421);
    }

    // Pulsar ↓ para desactivar colisiones suelo
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down) && (this.sueloColisionActiva)) {
      if (this.sueloColisionActiva) {
        this.physics.world.removeCollider(this.sueloCollider);
        this.sueloColisionActiva = false;
      }
    }

    // Reactivar colisión suelo solo si jugador está subiendo y pasa por encima del suelo
    if (!this.sueloColisionActiva && this.player.body.velocity.y < 0 && (this.player.y + this.player.height / 2) <= this.ySuelo) {
      this.sueloCollider = this.physics.add.collider(this.player, this.suelo);
      this.sueloColisionActiva = true;
    }

    // Movimiento de plataformas
    const screenWidth = this.sys.game.config.width;
    const velocidad = 2;

    this.platforms.forEach(fila => {
      fila.forEach(plat => {
        plat.x += velocidad * plat._filaDir;

        if (plat._filaDir === 1 && plat.x > screenWidth) {
          plat.x = -plat.width;
        } else if (plat._filaDir === -1 && plat.x + plat.width < 0) {
          plat.x = screenWidth;
        }

        plat.refreshBody();
      });
    });
  }
}
