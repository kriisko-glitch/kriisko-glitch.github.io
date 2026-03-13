(function () {
  function BootScene() {
    Phaser.Scene.call(this, { key: "BootScene" });
    this.progressGraphics = null;
    this.progressText = null;
  }

  BootScene.prototype = Object.create(Phaser.Scene.prototype);
  BootScene.prototype.constructor = BootScene;

  BootScene.prototype.create = function () {
    var config = window.SurvivorsArena.CONFIG;
    var width = config.GAME.WIDTH;
    var height = config.GAME.HEIGHT;

    this.cameras.main.setBackgroundColor("#0d0d1a");

    this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x0a0a16, 1);
    this.add.rectangle(width * 0.5, height * 0.5, width * 0.85, height * 0.32, 0x131327, 0.95).setStrokeStyle(2, 0x2b2b48, 1);
    this.add.text(width * 0.5, height * 0.38, "SURVIVORS ARENA", {
      fontFamily: "Trebuchet MS",
      fontSize: "36px",
      color: "#e94560",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width * 0.5, height * 0.46, "Generating procedural assets", {
      fontFamily: "Trebuchet MS",
      fontSize: "16px",
      color: "#d0d2e5"
    }).setOrigin(0.5);

    this.add.rectangle(width * 0.5, height * 0.54, 420, 24, 0x090914, 1).setStrokeStyle(2, 0x2f2f49, 1);

    this.progressGraphics = this.add.graphics();
    this.progressText = this.add.text(width * 0.5, height * 0.59, "0%", {
      fontFamily: "Trebuchet MS",
      fontSize: "15px",
      color: "#ffffff"
    }).setOrigin(0.5);

    var tasks = [
      this.generateBackgroundTextures,
      this.generatePlayerTexture,
      this.generateEnemyBatTexture,
      this.generateEnemyZombieTexture,
      this.generateEnemyGhostTexture,
      this.generateEnemyEliteTexture,
      this.generateOrbTexture,
      this.generateSlashTexture,
      this.generateShieldTexture,
      this.generateGemTexture,
      this.generateCardTexture,
      this.generateSkullIcon,
      this.generateParticleTextures
    ];

    var self = this;
    var index = 0;
    var total = tasks.length;

    this.time.addEvent({
      delay: 45,
      repeat: total,
      callback: function () {
        if (index < total) {
          tasks[index].call(self);
          index += 1;
          self.drawProgress(index / total);
          return;
        }

        self.drawProgress(1);
        self.time.delayedCall(140, function () {
          self.scene.start("GameScene");
          self.scene.launch("HUDScene");
        });
      }
    });
  };

  BootScene.prototype.drawProgress = function (ratio) {
    var clamped = Phaser.Math.Clamp(ratio, 0, 1);
    var fillWidth = 412 * clamped;
    this.progressGraphics.clear();
    this.progressGraphics.fillStyle(0xe94560, 1);
    this.progressGraphics.fillRoundedRect(194, 314, fillWidth, 16, 6);
    this.progressText.setText(Math.floor(clamped * 100) + "%");
  };

  BootScene.prototype.resetTexture = function (key) {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
  };

  BootScene.prototype.generateBackgroundTextures = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;

    this.resetTexture(t.FLOOR_GRID);
    this.resetTexture(t.STAR_LAYER);
    this.resetTexture(t.MID_LAYER);

    var grid = this.make.graphics({ x: 0, y: 0, add: false });
    grid.fillStyle(0x0d0d1a, 1);
    grid.fillRect(0, 0, 128, 128);
    grid.fillStyle(0x12152a, 0.75);
    grid.fillRect(0, 0, 128, 128);
    grid.lineStyle(1, 0x1f2340, 0.85);
    var i;
    for (i = 0; i <= 128; i += 32) {
      grid.beginPath();
      grid.moveTo(i, 0);
      grid.lineTo(i, 128);
      grid.strokePath();
      grid.beginPath();
      grid.moveTo(0, i);
      grid.lineTo(128, i);
      grid.strokePath();
    }
    grid.lineStyle(1, 0x2b3158, 0.25);
    for (i = 16; i <= 128; i += 32) {
      grid.beginPath();
      grid.moveTo(i, 0);
      grid.lineTo(i, 128);
      grid.strokePath();
      grid.beginPath();
      grid.moveTo(0, i);
      grid.lineTo(128, i);
      grid.strokePath();
    }
    grid.generateTexture(t.FLOOR_GRID, 128, 128);
    grid.destroy();

    var stars = this.make.graphics({ x: 0, y: 0, add: false });
    stars.fillStyle(0x060812, 1);
    stars.fillRect(0, 0, 128, 128);
    var starPoints = [
      [10, 15, 2], [28, 50, 1], [61, 26, 2], [90, 40, 1], [114, 10, 2],
      [12, 88, 1], [34, 110, 2], [58, 74, 1], [74, 103, 2], [101, 90, 1],
      [116, 66, 2], [93, 118, 1], [46, 12, 1], [82, 15, 1]
    ];
    var idx;
    for (idx = 0; idx < starPoints.length; idx += 1) {
      stars.fillStyle(0xcfd8ff, starPoints[idx][2] === 2 ? 0.7 : 0.45);
      stars.fillCircle(starPoints[idx][0], starPoints[idx][1], starPoints[idx][2]);
    }
    stars.generateTexture(t.STAR_LAYER, 128, 128);
    stars.destroy();

    var mid = this.make.graphics({ x: 0, y: 0, add: false });
    mid.fillStyle(0x0a0d1d, 1);
    mid.fillRect(0, 0, 256, 256);
    mid.fillStyle(0x1a213d, 0.32);
    mid.fillEllipse(70, 160, 170, 80);
    mid.fillEllipse(190, 90, 120, 60);
    mid.fillStyle(0x243055, 0.24);
    mid.fillEllipse(128, 216, 210, 70);
    mid.lineStyle(2, 0x2f3b66, 0.22);
    mid.strokeEllipse(64, 166, 130, 45);
    mid.strokeEllipse(202, 98, 95, 35);
    mid.generateTexture(t.MID_LAYER, 256, 256);
    mid.destroy();
  };

  BootScene.prototype.generatePlayerTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.PLAYER);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x5c1322, 0.9);
    g.fillTriangle(12, 20, 3, 31, 21, 31);

    g.fillStyle(0xe94560, 1);
    g.fillRoundedRect(5, 10, 14, 15, 4);

    g.fillStyle(0xffc107, 1);
    g.fillCircle(12, 8, 6);
    g.fillStyle(0xffda5f, 0.8);
    g.fillCircle(10, 7, 1.5);

    g.fillStyle(0x0d0d1a, 1);
    g.fillCircle(9, 8, 1.1);
    g.fillCircle(15, 8, 1.1);

    g.fillStyle(0xffc107, 1);
    g.fillRect(7, 16, 10, 2);

    g.fillStyle(0xb81f39, 0.9);
    g.fillRect(4, 24, 16, 2);

    g.generateTexture(t.PLAYER, 24, 32);
    g.destroy();
  };

  BootScene.prototype.generateEnemyBatTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.ENEMY_BAT);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x341047, 1);
    g.fillTriangle(10, 8, 2, 14, 10, 16);
    g.fillTriangle(14, 8, 22, 14, 14, 16);
    g.fillStyle(0x9c27b0, 1);
    g.fillTriangle(12, 6, 8, 16, 16, 16);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(10.5, 12, 1);
    g.fillCircle(13.5, 12, 1);
    g.generateTexture(t.ENEMY_BAT, 24, 20);
    g.destroy();
  };

  BootScene.prototype.generateEnemyZombieTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.ENEMY_ZOMBIE);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x325f34, 1);
    g.fillRoundedRect(4, 7, 20, 23, 5);
    g.fillStyle(0x4caf50, 1);
    g.fillRoundedRect(6, 5, 16, 22, 5);
    g.fillStyle(0x263238, 0.9);
    g.fillRect(9, 11, 3, 3);
    g.fillRect(16, 11, 3, 3);
    g.fillStyle(0x7fd982, 0.9);
    g.fillRect(8, 19, 12, 3);
    g.fillStyle(0x2a5f2d, 0.95);
    g.fillRect(6, 27, 16, 3);
    g.generateTexture(t.ENEMY_ZOMBIE, 28, 32);
    g.destroy();
  };

  BootScene.prototype.generateEnemyGhostTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.ENEMY_GHOST);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 0.65);
    g.fillCircle(14, 10, 8);
    g.fillRoundedRect(6, 10, 16, 16, 6);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(10, 24, 3);
    g.fillCircle(15, 24, 3);
    g.fillCircle(20, 24, 3);
    g.fillStyle(0x5a6a8a, 0.8);
    g.fillCircle(11, 11, 1.3);
    g.fillCircle(17, 11, 1.3);
    g.generateTexture(t.ENEMY_GHOST, 28, 30);
    g.destroy();
  };

  BootScene.prototype.generateEnemyEliteTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.ENEMY_ELITE);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x6b0f14, 1);
    g.fillCircle(16, 16, 14);
    g.fillStyle(0xf44336, 1);
    g.fillCircle(16, 14, 12);
    g.fillStyle(0x2d080b, 0.9);
    g.fillCircle(11, 13, 3);
    g.fillCircle(21, 13, 3);
    g.fillRect(11, 21, 10, 2);
    g.fillStyle(0xff8a80, 0.95);
    g.fillCircle(11, 13, 1.2);
    g.fillCircle(21, 13, 1.2);
    g.fillStyle(0xffffff, 0.75);
    g.fillCircle(16, 8, 2);
    g.generateTexture(t.ENEMY_ELITE, 32, 32);
    g.destroy();
  };

  BootScene.prototype.generateOrbTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.ORB);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1e3d7a, 0.9);
    g.fillCircle(8, 8, 8);
    g.fillStyle(0x4f83ff, 1);
    g.fillCircle(8, 8, 6);
    g.fillStyle(0xaed0ff, 0.9);
    g.fillCircle(6, 6, 2.4);
    g.generateTexture(t.ORB, 16, 16);
    g.destroy();
  };

  BootScene.prototype.generateSlashTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.SLASH);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(8, 0xe94560, 0.9);
    g.beginPath();
    g.arc(56, 56, 46, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false);
    g.strokePath();
    g.lineStyle(3, 0xff9dac, 0.85);
    g.beginPath();
    g.arc(56, 56, 40, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false);
    g.strokePath();
    g.generateTexture(t.SLASH, 112, 112);
    g.destroy();
  };

  BootScene.prototype.generateShieldTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.SHIELD);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(5, 0x00bcd4, 0.88);
    g.strokeCircle(64, 64, 56);
    g.lineStyle(2, 0xa6f2ff, 0.8);
    g.strokeCircle(64, 64, 48);
    g.generateTexture(t.SHIELD, 128, 128);
    g.destroy();
  };

  BootScene.prototype.generateGemTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.GEM);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x2f7a34, 1);
    g.fillTriangle(8, 1, 1, 8, 8, 15);
    g.fillTriangle(8, 1, 15, 8, 8, 15);
    g.fillStyle(0x4caf50, 1);
    g.fillTriangle(8, 3, 3, 8, 8, 13);
    g.fillTriangle(8, 3, 13, 8, 8, 13);
    g.fillStyle(0xb8ffbf, 0.8);
    g.fillTriangle(8, 4, 6, 7, 9, 7);
    g.generateTexture(t.GEM, 16, 16);
    g.destroy();
  };

  BootScene.prototype.generateCardTexture = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.CARD_BG);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x1a1a2e, 0.96);
    g.fillRoundedRect(0, 0, 210, 150, 14);
    g.lineStyle(3, 0xe94560, 0.95);
    g.strokeRoundedRect(1, 1, 208, 148, 14);
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(12, 12, 186, 34, 8);
    g.generateTexture(t.CARD_BG, 210, 150);
    g.destroy();
  };

  BootScene.prototype.generateSkullIcon = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.SKULL_ICON);

    var g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(2, 2, 20, 16, 6);
    g.fillRect(6, 16, 12, 6);
    g.fillStyle(0x0d0d1a, 1);
    g.fillCircle(8, 10, 2);
    g.fillCircle(16, 10, 2);
    g.fillRect(10, 15, 4, 2);
    g.generateTexture(t.SKULL_ICON, 24, 24);
    g.destroy();
  };

  BootScene.prototype.generateParticleTextures = function () {
    var t = window.SurvivorsArena.CONFIG.TEXTURES;
    this.resetTexture(t.TRAIL_DOT);
    this.resetTexture(t.POP_PARTICLE);
    this.resetTexture(t.RING_PARTICLE);

    var trail = this.make.graphics({ x: 0, y: 0, add: false });
    trail.fillStyle(0xffd9de, 0.7);
    trail.fillCircle(3, 3, 3);
    trail.generateTexture(t.TRAIL_DOT, 6, 6);
    trail.destroy();

    var pop = this.make.graphics({ x: 0, y: 0, add: false });
    pop.fillStyle(0xffffff, 0.95);
    pop.fillTriangle(4, 0, 8, 8, 0, 8);
    pop.generateTexture(t.POP_PARTICLE, 8, 8);
    pop.destroy();

    var ring = this.make.graphics({ x: 0, y: 0, add: false });
    ring.lineStyle(2, 0xa6f2ff, 0.9);
    ring.strokeCircle(5, 5, 4);
    ring.generateTexture(t.RING_PARTICLE, 10, 10);
    ring.destroy();
  };

  window.BootScene = BootScene;
})();
