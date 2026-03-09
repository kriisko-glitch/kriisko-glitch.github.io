class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#07070f");

    this.add.text(width / 2, height / 2 - 20, "KRIISKO", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "56px",
      color: "#e94560",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 36, "STUDIOS", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "24px",
      color: "#f5f5f5",
      letterSpacing: 6
    }).setOrigin(0.5);

    this.time.delayedCall(1500, () => {
      this.scene.start("GameScene", { resetRun: true });
    });
  }
}
