class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  preload() {}

  create(data) {
    const C = window.SpaceShooter.CONFIG;
    const centerX = C.GAME.WIDTH * 0.5;
    const centerY = C.GAME.HEIGHT * 0.5;

    const score = data?.score ?? 0;
    const highScore = data?.highScore ?? 0;

    try {
      if (window.KriiskoLeaderboard && window.KriiskoLeaderboard.qualifies('space-shooter', score)) {
        window.KriiskoLeaderboard.promptInitials('space-shooter', score, (initials) => {
          try {
            if (initials && window.KriiskoLeaderboard) window.KriiskoLeaderboard.submit('space-shooter', score, initials);
            if (window.KriiskoLeaderboard) window.KriiskoLeaderboard.show('space-shooter');
          } catch (_) {}
        });
      }
    } catch (_) {}

    this.cameras.main.setBackgroundColor(C.COLORS.BACKGROUND);

    this.add
      .text(centerX, centerY - 110, 'GAME OVER', {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.TITLE_FONT_SIZE,
        color: C.COLORS.ACCENT_RED_HEX,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 20, `SCORE ${score}`, {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.LARGE_FONT_SIZE,
        color: C.COLORS.ACCENT_GOLD_HEX,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 26, `HIGH SCORE ${highScore}`, {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.MEDIUM_FONT_SIZE,
        color: C.COLORS.WHITE,
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 112, 'PRESS SPACE TO PLAY AGAIN', {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.SMALL_FONT_SIZE,
        color: C.COLORS.WHITE,
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    this.input.keyboard.once('keydown-SPACE', this.restartGame, this);
    this.input.once('pointerdown', this.restartGame, this);
  }

  update() {}

  restartGame() {
    this.scene.start('GameScene');
  }
}
