(function () {
  function GameOverScene() {
    Phaser.Scene.call(this, { key: "GameOverScene" });
    this.cfg = null;
    this.stats = null;
  }

  GameOverScene.prototype = Object.create(Phaser.Scene.prototype);
  GameOverScene.prototype.constructor = GameOverScene;

  GameOverScene.prototype.init = function (data) {
    this.stats = data || {
      score: 0,
      killCount: 0,
      level: 1,
      elapsedMs: 0
    };
  };

  GameOverScene.prototype.create = function () {
    this.cfg = window.SurvivorsArena.CONFIG;

    var w = this.cfg.GAME.WIDTH;
    var h = this.cfg.GAME.HEIGHT;
    var saScore = this.stats.score || 0;

    if (window.KriiskoLeaderboard && window.KriiskoLeaderboard.qualifies('survivors-arena', saScore)) {
      window.KriiskoLeaderboard.promptInitials('survivors-arena', saScore, function(initials) {
        if (initials) window.KriiskoLeaderboard.submit('survivors-arena', saScore, initials);
        window.KriiskoLeaderboard.show('survivors-arena');
      });
    }

    this.cameras.main.setBackgroundColor("#17070b");
    this.add.rectangle(w * 0.5, h * 0.5, w, h, 0x1b0910, 0.95);

    var panel = this.add.rectangle(w * 0.5, h * 0.5, 460, 360, 0x0f1224, 0.94).setStrokeStyle(3, 0xe94560, 1);
    panel.setAlpha(0);

    var title = this.add.text(w * 0.5, h * 0.5 - 125, "GAME OVER", {
      fontFamily: "Trebuchet MS",
      fontSize: "48px",
      color: "#e94560",
      fontStyle: "bold"
    }).setOrigin(0.5).setAlpha(0);

    var summary = this.add.text(w * 0.5, h * 0.5 - 22, this.makeSummaryText(), {
      fontFamily: "Trebuchet MS",
      fontSize: "22px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0);

    var restartBtn = this.add.rectangle(w * 0.5, h * 0.5 + 122, 210, 58, 0x1a1a2e, 1).setStrokeStyle(3, 0xe94560, 1).setInteractive({ useHandCursor: true });
    var restartText = this.add.text(restartBtn.x, restartBtn.y, "RESTART", {
      fontFamily: "Trebuchet MS",
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    restartBtn.setAlpha(0);
    restartText.setAlpha(0);

    restartBtn.on("pointerover", function () {
      restartBtn.setFillStyle(0x272744, 1);
      restartBtn.setScale(1.05);
    });
    restartBtn.on("pointerout", function () {
      restartBtn.setFillStyle(0x1a1a2e, 1);
      restartBtn.setScale(1);
    });

    restartBtn.on("pointerdown", function () {
      this.restartRun();
    }, this);

    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 280,
      ease: "Quad.Out"
    });
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: title.y - 8,
      duration: 300,
      delay: 80,
      ease: "Quad.Out"
    });
    this.tweens.add({
      targets: summary,
      alpha: 1,
      y: summary.y - 4,
      duration: 300,
      delay: 140,
      ease: "Quad.Out"
    });
    this.tweens.add({
      targets: [restartBtn, restartText],
      alpha: 1,
      y: "-=6",
      duration: 300,
      delay: 220,
      ease: "Quad.Out"
    });
  };

  GameOverScene.prototype.makeSummaryText = function () {
    return [
      "Time: " + this.formatTime(this.stats.elapsedMs),
      "Kills: " + this.stats.killCount,
      "Level: " + this.stats.level,
      "Score: " + this.stats.score
    ].join("\n");
  };

  GameOverScene.prototype.formatTime = function (ms) {
    var totalSeconds = Math.floor(ms / 1000);
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  };

  GameOverScene.prototype.restartRun = function () {
    var self = this;
    this.cameras.main.fadeOut(360, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", function () {
      if (self.scene.isActive("HUDScene")) {
        self.scene.stop("HUDScene");
      }
      self.scene.start("GameScene");
      self.scene.launch("HUDScene");
    });
  };

  window.GameOverScene = GameOverScene;
})();
