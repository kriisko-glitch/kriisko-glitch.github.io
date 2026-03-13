(function() {
  function GameOverScene() {
    Phaser.Scene.call(this, { key: 'GameOverScene' });
  }

  GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
  GameOverScene.prototype.constructor = GameOverScene;

  GameOverScene.prototype.create = function(data) {
    var w = CONFIG.GAME.WIDTH;
    var h = CONFIG.GAME.HEIGHT;

    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.HUD_HIDE);

    this.cameras.main.setBackgroundColor('#08050d');
    this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x100816, 0.95);

    this.add.text(w * 0.5, 120, 'Game Over', {
      fontFamily: 'Georgia',
      fontSize: '64px',
      color: '#ff9ca8',
      stroke: '#2a0f1a',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(w * 0.5, 200, 'Your companion still remembers this run.', {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#d3dcff'
    }).setOrigin(0.5);

    var summary = [
      'Companion: ' + (data && data.petName ? data.petName : 'Pip'),
      'Pet Level Reached: ' + (data && data.petLevel ? data.petLevel : 1),
      'Floor Reached: ' + (data && data.floor ? data.floor : 1),
      'Score: ' + (data && data.score ? data.score : 0)
    ];

    this.add.text(w * 0.5, 300, summary.join('\n'), {
      fontFamily: 'Trebuchet MS',
      fontSize: '24px',
      color: '#f1f4ff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    var button = this.add.rectangle(w * 0.5, 485, 250, 56, 0x3f2a58, 1)
      .setStrokeStyle(3, 0xc5a8ff, 0.8)
      .setInteractive({ useHandCursor: true });
    var label = this.add.text(w * 0.5, 485, 'Return To Title', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#fff'
    }).setOrigin(0.5);

    button.on('pointerover', function() {
      button.setFillStyle(0x57397b, 1);
      label.setScale(1.04);
    });
    button.on('pointerout', function() {
      button.setFillStyle(0x3f2a58, 1);
      label.setScale(1);
    });
    button.on('pointerdown', function() {
      this.scene.stop('HUDScene');
      this.scene.start('TitleScene');
    }, this);

    this.input.keyboard.once('keydown-ENTER', function() {
      this.scene.stop('HUDScene');
      this.scene.start('TitleScene');
    }, this);
  };

  window.GameOverScene = GameOverScene;
})();