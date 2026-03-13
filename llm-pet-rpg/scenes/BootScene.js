(function() {
  function BootScene() {
    Phaser.Scene.call(this, { key: 'BootScene' });
  }

  BootScene.prototype = Object.create(Phaser.Scene.prototype);
  BootScene.prototype.constructor = BootScene;

  BootScene.prototype.create = function() {
    var width = CONFIG.GAME.WIDTH;
    var height = CONFIG.GAME.HEIGHT;

    this.cameras.main.setBackgroundColor('#070910');

    var title = this.add.text(width * 0.5, height * 0.38, 'Forging Whiskers & Wands...', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#e0e6ff'
    }).setOrigin(0.5);

    var track = this.add.rectangle(width * 0.5, height * 0.5, 420, 20, 0x1f2440, 1).setStrokeStyle(2, 0x3f4a7a, 1);
    var bar = this.add.rectangle(width * 0.5 - 208, height * 0.5, 4, 14, 0x00bcd4, 1).setOrigin(0, 0.5);
    var pctText = this.add.text(width * 0.5, height * 0.56, '0%', {
      fontFamily: 'Trebuchet MS',
      fontSize: '18px',
      color: '#9fb0ef'
    }).setOrigin(0.5);

    var steps = [
      this.generateTileTextures.bind(this),
      this.generatePlayerAndPet.bind(this),
      this.generateEnemyTextures.bind(this),
      this.generateItemTextures.bind(this),
      this.generateEffects.bind(this)
    ];

    var total = steps.length;
    var self = this;
    var stepIndex = 0;

    function runStep() {
      if (stepIndex < total) {
        steps[stepIndex]();
        stepIndex += 1;
        var progress = stepIndex / total;
        bar.width = 416 * progress;
        pctText.setText(Math.round(progress * 100) + '%');
        self.time.delayedCall(120, runStep);
      } else {
        title.setText('Arcane Systems Ready');
        self.time.delayedCall(220, function() {
          self.scene.start('TitleScene');
        });
      }
    }

    track.setAlpha(0);
    bar.setAlpha(0);
    pctText.setAlpha(0);
    this.tweens.add({
      targets: [track, bar, pctText],
      alpha: 1,
      duration: 260,
      onComplete: runStep
    });
  };

  BootScene.prototype.generateTileTextures = function() {
    var g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(CONFIG.COLORS.FLOOR, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x3c3f60, 0.3);
    g.fillRect(2, 2, 8, 8);
    g.fillRect(20, 10, 10, 6);
    g.fillStyle(0x1f2138, 0.3);
    g.fillRect(12, 20, 7, 9);
    g.generateTexture('tile-floor', 32, 32);

    g.clear();
    g.fillStyle(CONFIG.COLORS.WALL, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x252444, 1);
    g.fillRect(0, 10, 32, 2);
    g.fillRect(0, 22, 32, 2);
    g.fillStyle(0x38365f, 0.6);
    g.fillRect(2, 2, 5, 6);
    g.fillRect(12, 4, 5, 6);
    g.fillRect(22, 2, 5, 6);
    g.generateTexture('tile-wall', 32, 32);

    g.clear();
    g.fillStyle(CONFIG.COLORS.FLOOR, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(CONFIG.COLORS.STAIRS, 1);
    g.fillRect(4, 24, 24, 3);
    g.fillRect(6, 20, 20, 3);
    g.fillRect(8, 16, 16, 3);
    g.fillRect(10, 12, 12, 3);
    g.fillStyle(0xffe082, 0.5);
    g.fillRect(10, 8, 12, 2);
    g.generateTexture('tile-stairs', 32, 32);

    g.destroy();
  };

  BootScene.prototype.generatePlayerAndPet = function() {
    var g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(0x2f334d, 1);
    g.fillRect(6, 8, 12, 18);
    g.fillStyle(0xe9c39b, 1);
    g.fillRect(8, 2, 8, 7);
    g.fillStyle(CONFIG.COLORS.PLAYER_CAPE, 1);
    g.fillRect(4, 11, 5, 14);
    g.fillStyle(0x8d95c5, 1);
    g.fillRect(7, 26, 4, 5);
    g.fillRect(13, 26, 4, 5);
    g.generateTexture('player', 24, 32);

    g.clear();
    g.fillStyle(CONFIG.COLORS.PET_BODY, 1);
    g.fillEllipse(10, 12, 15, 14);
    g.fillEllipse(14, 12, 10, 10);
    g.fillTriangle(6, 6, 9, 1, 11, 7);
    g.fillTriangle(15, 7, 18, 2, 20, 8);
    g.fillStyle(0x0099b3, 1);
    g.fillRect(4, 15, 12, 7);
    g.fillStyle(CONFIG.COLORS.PET_EYE, 1);
    g.fillRect(12, 10, 2, 2);
    g.fillRect(16, 10, 2, 2);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(17, 18, 3, 2);
    g.generateTexture('pet', 20, 24);

    g.destroy();
  };

  BootScene.prototype.generateEnemyTextures = function() {
    var g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(0x4caf50, 1);
    g.fillEllipse(12, 12, 20, 16);
    g.fillStyle(0x81c784, 0.55);
    g.fillEllipse(9, 10, 8, 6);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(9, 10, 1);
    g.fillCircle(14, 10, 1);
    g.generateTexture('enemy-slime', 24, 24);

    g.clear();
    g.fillStyle(0xd4d4d4, 1);
    g.fillRect(7, 3, 10, 8);
    g.fillRect(8, 11, 8, 12);
    g.fillStyle(0x777777, 1);
    g.fillRect(9, 24, 2, 4);
    g.fillRect(13, 24, 2, 4);
    g.fillStyle(0x1f1f1f, 1);
    g.fillCircle(10, 7, 1);
    g.fillCircle(14, 7, 1);
    g.generateTexture('enemy-skeleton', 24, 30);

    g.clear();
    g.fillStyle(0x9c27b0, 0.92);
    g.fillEllipse(12, 10, 15, 14);
    g.fillTriangle(4, 14, 20, 14, 12, 28);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(10, 8, 4, 2);
    g.generateTexture('enemy-wraith', 24, 30);

    g.destroy();
  };

  BootScene.prototype.generateItemTextures = function() {
    var g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(0xaa2233, 1);
    g.fillRect(7, 6, 10, 14);
    g.fillStyle(0xdd5566, 1);
    g.fillRect(8, 8, 8, 10);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(10, 4, 4, 2);
    g.generateTexture('item-potion', 24, 24);

    g.clear();
    g.fillStyle(0xffcf57, 1);
    g.fillEllipse(12, 12, 18, 10);
    g.fillStyle(0xffe082, 1);
    g.fillEllipse(8, 10, 6, 4);
    g.fillEllipse(16, 10, 6, 4);
    g.generateTexture('item-treat', 24, 24);

    g.clear();
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(12, 12, 8);
    g.fillStyle(0xfff3c4, 0.4);
    g.fillCircle(9, 9, 3);
    g.generateTexture('item-coin', 24, 24);

    g.clear();
    g.fillStyle(0x9c27b0, 1);
    g.fillTriangle(12, 3, 20, 12, 12, 21);
    g.fillTriangle(12, 3, 4, 12, 12, 21);
    g.fillStyle(0xe1bee7, 0.55);
    g.fillTriangle(12, 6, 16, 12, 12, 18);
    g.generateTexture('item-crystal', 24, 24);

    g.clear();
    g.fillStyle(0x8ce7ff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('xp-orb', 8, 8);

    g.destroy();
  };

  BootScene.prototype.generateEffects = function() {
    var g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 3);
    g.generateTexture('particle-dot', 6, 6);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(4, 0, 5, 3, 8, 4);
    g.fillTriangle(8, 4, 5, 5, 4, 8);
    g.fillTriangle(4, 8, 3, 5, 0, 4);
    g.fillTriangle(0, 4, 3, 3, 4, 0);
    g.generateTexture('particle-star', 8, 8);

    g.clear();
    g.fillStyle(0xffffff, 0.85);
    g.fillEllipse(16, 16, 22, 12);
    g.generateTexture('sword-arc', 32, 32);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, 1, 2, 2);
    g.generateTexture('dust', 4, 4);
    g.destroy();

    var gq = this.make.graphics({ x: 0, y: 0, add: false });
    gq.fillStyle(0xc8e8ff, 1);
    gq.fillCircle(7, 3, 2);
    gq.fillRect(8, 5, 2, 4);
    gq.fillRect(5, 4, 3, 2);
    gq.fillRect(7, 9, 2, 2);
    gq.fillCircle(7, 12, 1);
    gq.generateTexture('particle-question', 14, 14);
    gq.destroy();
  };

  window.BootScene = BootScene;
})();