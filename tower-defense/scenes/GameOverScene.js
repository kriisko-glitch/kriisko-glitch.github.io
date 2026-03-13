const getConfig = () => window.TowerDefense?.CONFIG || window.__TD_CONFIG__;

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data) {
    this.cfg = getConfig();

    const centerX = this.cfg.CANVAS_WIDTH / 2;
    const centerY = this.cfg.CANVAS_HEIGHT / 2;

    const backdrop = this.add.rectangle(
      centerX,
      centerY,
      this.cfg.CANVAS_WIDTH,
      this.cfg.CANVAS_HEIGHT,
      0x000000,
      0.78
    );
    backdrop.setDepth(this.cfg.DEPTH.GAME_OVER);

    const panel = this.add.rectangle(centerX, centerY, 480, 320, 0x161624, 0.96);
    panel.setDepth(this.cfg.DEPTH.GAME_OVER + 1);
    panel.setStrokeStyle(3, this.cfg.COLORS.ACCENT, 0.95);

    const title = this.add.text(centerX, centerY - 116, "Game Over", {
      fontFamily: this.cfg.UI.FONT_FAMILY,
      fontSize: "46px",
      color: "#e94560"
    });
    title.setOrigin(0.5, 0.5);
    title.setDepth(this.cfg.DEPTH.GAME_OVER + 2);

    const stats = [
      `Waves Survived: ${Math.floor(data.wave || 0)}`,
      `Total Score: ${Math.floor(data.score || 0)}`,
      `Towers Placed: ${Math.floor(data.towersPlaced || 0)}`
    ];

    const statsText = this.add.text(centerX, centerY - 24, stats.join("\n"), {
      fontFamily: this.cfg.UI.FONT_FAMILY,
      fontSize: "28px",
      color: "#f4f4f4",
      align: "center",
      lineSpacing: 10
    });
    statsText.setOrigin(0.5, 0.5);
    statsText.setDepth(this.cfg.DEPTH.GAME_OVER + 2);

    const restartButton = this.add.rectangle(centerX, centerY + 105, 210, 56, this.cfg.COLORS.GOLD, 1);
    restartButton.setDepth(this.cfg.DEPTH.GAME_OVER + 2);
    restartButton.setStrokeStyle(2, 0x111111, 0.95);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on("pointerdown", () => {
      this.scene.stop("HUDScene");
      this.scene.stop("GameScene");
      this.scene.stop("GameOverScene");
      this.scene.start("BootScene");
    });

    const restartText = this.add.text(centerX, centerY + 105, "Restart", {
      fontFamily: this.cfg.UI.FONT_FAMILY,
      fontSize: "30px",
      color: "#111111"
    });
    restartText.setOrigin(0.5, 0.5);
    restartText.setDepth(this.cfg.DEPTH.GAME_OVER + 3);
  }
}
