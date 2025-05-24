export default class Start extends Phaser.Scene {
    constructor() {
      super({ key: 'Start' });
    }
  
    create() {
      this.add.text(300, 250, 'Presiona Enter para comenzar', {
        fontSize: '20px',
        color: '#ffffff'
      });
  
      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.start('GameScene');
      });
    }
  }
  