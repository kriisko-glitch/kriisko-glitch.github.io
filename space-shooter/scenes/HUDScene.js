class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUDScene');
    this.lifeIcons = [];
    this.waveTween = null;
  }

  preload() {}

  create() {
    const C = window.SpaceShooter.CONFIG;

    this.scoreText = this.add
      .text(C.UI.HUD_MARGIN_X, C.UI.HUD_MARGIN_Y, 'SCORE 0', {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.SMALL_FONT_SIZE,
        color: C.COLORS.ACCENT_GOLD_HEX,
      })
      .setDepth(C.DEPTH.HUD);

    this.highScoreText = this.add
      .text(C.UI.HUD_MARGIN_X, C.UI.HUD_MARGIN_Y + C.UI.LINE_GAP, 'HI 0', {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.SMALL_FONT_SIZE,
        color: C.COLORS.WHITE,
      })
      .setDepth(C.DEPTH.HUD);

    this.waveText = this.add
      .text(C.GAME.WIDTH * 0.5, C.UI.WAVE_LABEL_Y, '', {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.MEDIUM_FONT_SIZE,
        color: C.COLORS.ACCENT_RED_HEX,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(C.DEPTH.HUD);

    this.registry.events.on('changedata-score', this.onScoreChanged, this);
    this.registry.events.on('changedata-highScore', this.onHighScoreChanged, this);
    this.registry.events.on('changedata-lives', this.onLivesChanged, this);
    this.registry.events.on('changedata-wave', this.onWaveChanged, this);

    this.events.once('shutdown', this.onShutdown, this);

    this.syncFromRegistry();
  }

  update() {}

  syncFromRegistry() {
    const score = this.registry.get('score') ?? 0;
    const highScore = this.registry.get('highScore') ?? 0;
    const lives = this.registry.get('lives') ?? 0;
    const wave = this.registry.get('wave') ?? 1;

    this.onScoreChanged(this.registry, score);
    this.onHighScoreChanged(this.registry, highScore);
    this.onLivesChanged(this.registry, lives);
    this.onWaveChanged(this.registry, wave);
  }

  onScoreChanged(_parent, value) {
    this.scoreText.setText(`SCORE ${value}`);
  }

  onHighScoreChanged(_parent, value) {
    this.highScoreText.setText(`HI ${value}`);
  }

  onLivesChanged(_parent, lives) {
    const C = window.SpaceShooter.CONFIG;

    for (const icon of this.lifeIcons) {
      icon.destroy();
    }
    this.lifeIcons.length = 0;

    for (let i = 0; i < lives; i += 1) {
      const x =
        C.GAME.WIDTH -
        C.UI.LIFE_ICON_RIGHT_PADDING -
        i * C.UI.LIFE_ICON_SPACING;
      const y = C.UI.HUD_MARGIN_Y + C.UI.LINE_GAP;

      const icon = this.add
        .triangle(
          x,
          y,
          C.UI.LIFE_ICON_WIDTH * 0.5,
          0,
          0,
          C.UI.LIFE_ICON_HEIGHT,
          C.UI.LIFE_ICON_WIDTH,
          C.UI.LIFE_ICON_HEIGHT,
          C.COLORS.PLAYER,
          1,
        )
        .setDepth(C.DEPTH.HUD)
        .setOrigin(0.5, 0.5);

      this.lifeIcons.push(icon);
    }
  }

  onWaveChanged(_parent, wave) {
    const C = window.SpaceShooter.CONFIG;

    this.waveText.setText(`WAVE ${wave}`);
    this.waveText.setAlpha(1);

    if (this.waveTween) {
      this.waveTween.stop();
      this.waveTween = null;
    }

    this.waveTween = this.tweens.add({
      targets: this.waveText,
      alpha: 0,
      delay: 450,
      duration: 850,
      ease: 'Sine.easeOut',
    });
  }

  onShutdown() {
    this.registry.events.off('changedata-score', this.onScoreChanged, this);
    this.registry.events.off('changedata-highScore', this.onHighScoreChanged, this);
    this.registry.events.off('changedata-lives', this.onLivesChanged, this);
    this.registry.events.off('changedata-wave', this.onWaveChanged, this);

    if (this.waveTween) {
      this.waveTween.stop();
      this.waveTween = null;
    }
  }
}
