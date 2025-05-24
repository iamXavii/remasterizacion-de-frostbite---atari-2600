export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.spritesheet('player', 'assets/sprites/frostbite.png', {
      frameWidth: 166.5,
      frameHeight: 187.5
    });

    this.load.image('plataforma', 'assets/sprites/plataforma.png');
  }

  create() {
    this.platforms = [];

    const plataformaWidth = 160;
    const espacio = 10;
    const screenWidth = this.sys.game.config.width;

    // posiciones X y Y de las filas
    const filas = [
      { y: 220, startX: 0, dir: 1 },   // izquierda → derecha
      { y: 380, startX: 300, dir: -1 },  // derecha → izquierda
      { y: 520, startX: 0, dir: 1 }    // izquierda → derecha
    ];

    filas.forEach(fila => {
      let filaPlataformas = [];

      for (let i = 0; i < 3; i++) {
        const plat = this.physics.add
          .staticImage(fila.startX + i * (plataformaWidth + espacio), fila.y, 'plataforma')
          .setOrigin(0, 0);
        plat.body.allowGravity = false;

        // Guardamos datos adicionales para movimiento
        plat._filaDir = fila.dir;
        plat._filaY = fila.y;

        filaPlataformas.push(plat);
      }

      this.platforms.push(filaPlataformas);
    });

    this.player = this.physics.add.sprite(2, 200, 'player', 0);
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(600);

    // Animaciones del jugador
    this.anims.create({ key: 'idle-right', frames: [{ key: 'player', frame: 0 }], frameRate: 1 });
    this.anims.create({ key: 'jump-right', frames: [{ key: 'player', frame: 1 }], frameRate: 1 });
    this.anims.create({ key: 'jump-left', frames: [{ key: 'player', frame: 2 }], frameRate: 1 });
    this.anims.create({ key: 'idle-left', frames: [{ key: 'player', frame: 3 }], frameRate: 1 });

    this.anims.create({
      key: 'walk-right',
      frames: [{ key: 'player', frame: 4 }, { key: 'player', frame: 5 }],
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'walk-left',
      frames: [{ key: 'player', frame: 6 }, { key: 'player', frame: 7 }],
      frameRate: 6,
      repeat: -1
    });

    // colisión con cada plataforma
    this.platforms.flat().forEach(plat => {
      this.physics.add.collider(this.player, plat);
    });

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    const onGround = this.player.body.blocked.down;

    // Movimiento del jugador
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

    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(-350);
    }

    // Movimiento de plataformas
    const velocidad = 2;
    const screenWidth = this.sys.game.config.width;

    this.platforms.forEach(fila => {
      fila.forEach(plat => {
        plat.x += velocidad * plat._filaDir;

        // Reaparece desde el otro lado si sale de la pantalla
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
