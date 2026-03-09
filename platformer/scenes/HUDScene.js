class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: "HUDScene" });
    this.labels = {};
  }

  create() {
    const config = window.Platformer.CONFIG;

    this.labels.score = this.add.text(12, 10, "", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff"
    }).setScrollFactor(0);

    this.labels.coins = this.add.text(12, 36, "", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#ffc107"
    }).setScrollFactor(0);

    this.labels.lives = this.add.text(12, 58, "", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#ff8f8f"
    }).setScrollFactor(0);

    this.labels.level = this.add.text(config.GAME.WIDTH - 12, 10, "", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#00bcd4"
    }).setOrigin(1, 0).setScrollFactor(0);

    this.labels.doubleJump = this.add.text(config.GAME.WIDTH - 12, 36, "", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "14px",
      color: "#e94560"
    }).setOrigin(1, 0).setScrollFactor(0);

    this.refresh();
    this.registry.events.on("changedata", this.refresh, this);
  }

  refresh() {
    const score = this.registry.get("score") || 0;
    const coins = this.registry.get("coins") || 0;
    const lives = this.registry.get("lives") || 0;
    const level = this.registry.get("level") || 1;
    const displayLevel = ((level - 1) % window.Platformer.CONFIG.GAME.LEVEL_COUNT) + 1;
    const cycle = Math.floor((level - 1) / window.Platformer.CONFIG.GAME.LEVEL_COUNT);
    const unlocked = !!this.registry.get("doubleJumpUnlocked");

    this.labels.score.setText(`Score: ${score}`);
    this.labels.coins.setText(`Coins: ${coins}`);
    this.labels.lives.setText(`Lives: ${lives}`);
    this.labels.level.setText(`Level ${displayLevel}  Loop ${cycle + 1}`);
    this.labels.doubleJump.setText(unlocked ? "Double Jump: UNLOCKED" : "Double Jump: 10 coins");
  }

  shutdown() {
    this.registry.events.off("changedata", this.refresh, this);
  }
}
