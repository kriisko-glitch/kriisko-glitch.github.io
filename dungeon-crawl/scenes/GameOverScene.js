(function () {
  "use strict";

  class GameOverScene extends Phaser.Scene {
    constructor() {
      super("GameOverScene");
      this.stats = null;
    }

    init(data) {
      this.stats = data && data.stats ? data.stats : {
        floorsReached: 1,
        kills: 0,
        score: 0,
        itemsCollected: 0
      };
    }

    create() {
      var cfg = window.DungeonCrawl.CONFIG;
      this.cameras.main.setBackgroundColor("#05060c");
      this.cameras.main.fadeIn(cfg.FX.FADE_DURATION_MS);
      var dcScore = this.stats.score || 0;

      if (window.KriiskoLeaderboard && window.KriiskoLeaderboard.qualifies('dungeon-crawl', dcScore)) {
        window.KriiskoLeaderboard.promptInitials('dungeon-crawl', dcScore, function(initials) {
          if (initials) window.KriiskoLeaderboard.submit('dungeon-crawl', dcScore, initials);
          window.KriiskoLeaderboard.show('dungeon-crawl');
        });
      }

      this.add
        .text(cfg.GAME.WIDTH * 0.5, 120, "GAME OVER", {
          fontFamily: "Georgia, serif",
          fontSize: "54px",
          color: "#e94560"
        })
        .setOrigin(0.5);

      var panel = this.add.graphics();
      panel.fillStyle(cfg.HUD.PANEL_BG, 0.92);
      panel.fillRoundedRect(cfg.GAME.WIDTH * 0.5 - 180, 190, 360, 220, 10);
      panel.lineStyle(2, cfg.HUD.BORDER, 1);
      panel.strokeRoundedRect(cfg.GAME.WIDTH * 0.5 - 180, 190, 360, 220, 10);

      var lines = [
        "Floors Reached: " + this.stats.floorsReached,
        "Enemies Slain: " + this.stats.kills,
        "Score: " + this.stats.score,
        "Items Collected: " + this.stats.itemsCollected
      ];

      for (var i = 0; i < lines.length; i += 1) {
        this.add
          .text(cfg.GAME.WIDTH * 0.5, 230 + i * 40, lines[i], {
            fontFamily: "Trebuchet MS, sans-serif",
            fontSize: "26px",
            color: i === 2 ? "#ffc107" : "#e7ecff"
          })
          .setOrigin(0.5);
      }

      this.add
        .text(cfg.GAME.WIDTH * 0.5, 458, "Press R or Click to Restart", {
          fontFamily: "Trebuchet MS, sans-serif",
          fontSize: "20px",
          color: "#9eb0d9"
        })
        .setOrigin(0.5);

      this.input.keyboard.once("keydown-R", this.restartRun, this);
      this.input.once("pointerdown", this.restartRun, this);
    }

    restartRun() {
      this.scene.stop("HUDScene");
      this.scene.start("GameScene");
      this.scene.launch("HUDScene");
    }
  }

  window.GameOverScene = GameOverScene;
})();
