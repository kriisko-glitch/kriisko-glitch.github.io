class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  create(data) {
    const { width, height } = this.scale;
    const score = data?.score ?? 0;
    const highScore = data?.highScore ?? score;

    this.cameras.main.setBackgroundColor("#06060d");

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45);

    this.add.text(width / 2, 180, "GAME OVER", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "52px",
      color: "#e94560",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(width / 2, 290, `Score: ${score}`, {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "26px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(width / 2, 330, `High Score: ${highScore}`, {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "22px",
      color: "#00bcd4"
    }).setOrigin(0.5);

    const prompt = this.add.text(width / 2, 430, "PRESS SPACE OR CLICK TO RETRY", {
      fontFamily: "Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#f5f5f5"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.25,
      duration: 550,
      yoyo: true,
      repeat: -1
    });

    const restart = () => {
      this.scene.start("GameScene", { resetRun: true });
    };

    this.input.once("pointerdown", restart);
    this.input.keyboard.once("keydown-SPACE", restart);
  }
}
