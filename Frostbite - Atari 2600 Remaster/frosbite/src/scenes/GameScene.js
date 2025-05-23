export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Cargar el sprite sheet
    this.load.spritesheet('player', 'assets/sprites/frostbite.png', {
      frameWidth: 166.5,
      frameHeight: 187.5
    });
  }

  create() {
    // agregar al jugador
    this.player = this.physics.add.sprite(400, 300, 'player', 0);
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(600); // Gravedad

    // animaciones
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

    // controles
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    const onGround = this.player.body.blocked.down;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      if (onGround) {
        this.player.anims.play('walk-left', true);
      } else {
        this.player.anims.play('jump-left', true);
      }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      if (onGround) {
        this.player.anims.play('walk-right', true);
      } else {
        this.player.anims.play('jump-right', true);
      }
    } else {
      this.player.setVelocityX(0);
      if (onGround) {
        // Determinar qué animación idle mostrar según última dirección
        const prevAnim = this.player.anims.currentAnim?.key;
        if (prevAnim?.includes('left')) {
          this.player.anims.play('idle-left');
        } else {
          this.player.anims.play('idle-right');
        }
      }
    }

    if (this.cursors.up.isDown && onGround) {
      this.player.setVelocityY(-350);
    }
  }
}
