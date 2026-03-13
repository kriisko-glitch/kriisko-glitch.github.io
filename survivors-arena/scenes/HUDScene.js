(function () {
  function HUDScene() {
    Phaser.Scene.call(this, { key: "HUDScene" });

    this.cfg = null;
    this.bus = null;

    this.state = null;

    this.healthFill = null;
    this.xpFill = null;
    this.levelBadge = null;
    this.levelText = null;
    this.timerText = null;
    this.killText = null;
    this.scoreText = null;
    this.audioButton = null;
    this.audioButtonLabel = null;

    this.displayedHP = 0;
    this.displayedXP = 0;
  }

  HUDScene.prototype = Object.create(Phaser.Scene.prototype);
  HUDScene.prototype.constructor = HUDScene;

  HUDScene.prototype.create = function () {
    this.cfg = window.SurvivorsArena.CONFIG;
    this.bus = this.cfg.BUS;

    this.state = {
      currentHP: this.cfg.PLAYER.START_HP,
      maxHP: this.cfg.PLAYER.START_HP,
      xp: 0,
      xpToNext: this.cfg.XP.START_TO_NEXT,
      level: this.cfg.XP.START_LEVEL,
      timerMs: 0,
      killCount: 0,
      score: 0,
      audioEnabled: true
    };

    this.displayedHP = this.state.currentHP;
    this.displayedXP = this.state.xp;

    this.createFrame();

    this.bus.on(this.cfg.EVENTS.HUD_UPDATE, this.onHudUpdate, this);
    this.bus.on(this.cfg.EVENTS.AUDIO_STATE, this.onAudioState, this);

    this.events.on("shutdown", this.onShutdown, this);
    this.events.on("destroy", this.onShutdown, this);

    this.pullInitialState();
  };

  HUDScene.prototype.createFrame = function () {
    var hud = this.cfg.HUD;

    var panel = this.add.graphics();
    panel.fillStyle(0x090914, 0.7);
    panel.fillRoundedRect(12, 10, 268, 64, 10);

    var healthBg = this.add.graphics();
    healthBg.fillStyle(0x1a1a2e, 0.95);
    healthBg.fillRoundedRect(hud.HEALTH_X, hud.HEALTH_Y, hud.BAR_WIDTH, hud.BAR_HEIGHT, 8);

    this.healthFill = this.add.graphics();

    var xpBg = this.add.graphics();
    xpBg.fillStyle(0x1a1a2e, 0.95);
    xpBg.fillRoundedRect(hud.HEALTH_X, hud.XP_Y, hud.BAR_WIDTH, hud.BAR_HEIGHT, 8);

    this.xpFill = this.add.graphics();

    this.levelBadge = this.add.circle(hud.LEVEL_BADGE_X, hud.LEVEL_BADGE_Y, 15, 0x1a1a2e, 1).setStrokeStyle(2, 0xe94560, 1);
    this.levelText = this.add.text(hud.LEVEL_BADGE_X, hud.LEVEL_BADGE_Y, "1", {
      fontFamily: "Trebuchet MS",
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.timerText = this.add.text(this.cfg.GAME.WIDTH * 0.5, hud.TIMER_Y, "00:00", {
      fontFamily: "Trebuchet MS",
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5, 0);

    this.add.image(this.cfg.GAME.WIDTH - 86, 20, this.cfg.TEXTURES.SKULL_ICON).setOrigin(0, 0);

    this.killText = this.add.text(this.cfg.GAME.WIDTH - 58, 20, "0", {
      fontFamily: "Trebuchet MS",
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0, 0);

    this.scoreText = this.add.text(this.cfg.GAME.WIDTH - 128, 52, "Score: 0", {
      fontFamily: "Trebuchet MS",
      fontSize: "18px",
      color: "#ffc107"
    }).setOrigin(0, 0);

    this.createAudioButton();

    this.redrawBars(true);
  };

  HUDScene.prototype.createAudioButton = function () {
    var box = this.add.rectangle(this.cfg.GAME.WIDTH * 0.5, 56, 84, 24, 0x1a1a2e, 0.95).setStrokeStyle(2, 0xe94560, 1);
    this.audioButtonLabel = this.add.text(box.x, box.y, "SFX ON", {
      fontFamily: "Trebuchet MS",
      fontSize: "12px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    box.setInteractive({ useHandCursor: true });
    box.on("pointerover", function () {
      box.setFillStyle(0x272744, 0.98);
    });
    box.on("pointerout", function () {
      box.setFillStyle(0x1a1a2e, 0.95);
    });

    box.on("pointerdown", function () {
      this.bus.emit(this.cfg.EVENTS.HUD_CLICK_CONSUMED);
      this.bus.emit(this.cfg.EVENTS.AUDIO_TOGGLE_REQUEST);
    }, this);

    this.audioButton = box;
  };

  HUDScene.prototype.onHudUpdate = function (state) {
    this.state = state;
    this.updateLabels();
  };

  HUDScene.prototype.onAudioState = function (payload) {
    this.state.audioEnabled = !!payload.enabled;
    if (this.audioButtonLabel) {
      this.audioButtonLabel.setText(this.state.audioEnabled ? "SFX ON" : "SFX OFF");
    }
  };

  HUDScene.prototype.updateLabels = function () {
    this.levelText.setText(String(this.state.level));
    this.killText.setText(String(this.state.killCount));
    this.scoreText.setText("Score: " + this.state.score);
    this.timerText.setText(this.formatTime(this.state.timerMs));
  };

  HUDScene.prototype.redrawBars = function (instant) {
    var hud = this.cfg.HUD;

    if (instant) {
      this.displayedHP = this.state.currentHP;
      this.displayedXP = this.state.xp;
    } else {
      this.displayedHP = Phaser.Math.Linear(this.displayedHP, this.state.currentHP, 0.16);
      this.displayedXP = Phaser.Math.Linear(this.displayedXP, this.state.xp, 0.2);
    }

    var hpRatio = Phaser.Math.Clamp(this.displayedHP / Math.max(1, this.state.maxHP), 0, 1);
    var xpRatio = Phaser.Math.Clamp(this.displayedXP / Math.max(1, this.state.xpToNext), 0, 1);

    this.healthFill.clear();
    this.healthFill.fillStyle(0xe94560, 1);
    this.healthFill.fillRoundedRect(hud.HEALTH_X, hud.HEALTH_Y, hud.BAR_WIDTH * hpRatio, hud.BAR_HEIGHT, 8);

    this.xpFill.clear();
    this.xpFill.fillStyle(0x4caf50, 1);
    this.xpFill.fillRoundedRect(hud.HEALTH_X, hud.XP_Y, hud.BAR_WIDTH * xpRatio, hud.BAR_HEIGHT, 8);
  };

  HUDScene.prototype.pullInitialState = function () {
    var gameScene = this.scene.get("GameScene");
    if (!gameScene || !gameScene.scene || !gameScene.scene.isActive()) {
      return;
    }

    if (typeof gameScene.getHudState === "function") {
      this.onHudUpdate(gameScene.getHudState());
    }
  };

  HUDScene.prototype.update = function () {
    this.redrawBars(false);
  };

  HUDScene.prototype.formatTime = function (ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  };

  HUDScene.prototype.onShutdown = function () {
    if (!this.bus) {
      return;
    }
    this.bus.off(this.cfg.EVENTS.HUD_UPDATE, this.onHudUpdate, this);
    this.bus.off(this.cfg.EVENTS.AUDIO_STATE, this.onAudioState, this);
  };

  window.HUDScene = HUDScene;
})();
