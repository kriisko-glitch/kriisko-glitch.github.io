const getConfig = () => window.TowerDefense?.CONFIG || window.__TD_CONFIG__;

export default class HUDScene extends Phaser.Scene {
  constructor() {
    super("HUDScene");
  }

  create() {
    this.cfg = getConfig();
    this.bus = this.game.events;
    this.betweenWaves = true;
    this.countdownEnd = 0;
    this.menuContainer = null;

    this.drawTopBar();
    this.createTopBarText();
    this.createNextWaveButton();
    this.registerEvents();
    this.pullInitialState();
  }

  pullInitialState() {
    const gs = this.scene.get("GameScene");
    if (!gs) {
      return;
    }

    this.onStatsUpdated({
      gold: gs.gold || 0,
      lives: gs.lives || 0,
      wave: gs.wave || 0,
      score: gs.score || 0
    });

    this.onWaveStateChanged({
      betweenWaves: gs.betweenWaves !== undefined ? gs.betweenWaves : true,
      countdownEnd: gs.waveCountdownEnd || 0
    });
  }

  update() {
    this.refreshNextWaveLabel();
  }

  shutdown() {
    this.bus.off("statsUpdated", this.onStatsUpdated, this);
    this.bus.off("showTowerMenu", this.showTowerMenu, this);
    this.bus.off("hideTowerMenu", this.hideTowerMenu, this);
    this.bus.off("waveStateChanged", this.onWaveStateChanged, this);
    this.bus.off("gameOver", this.onGameOver, this);
  }

  registerEvents() {
    this.bus.on("statsUpdated", this.onStatsUpdated, this);
    this.bus.on("showTowerMenu", this.showTowerMenu, this);
    this.bus.on("hideTowerMenu", this.hideTowerMenu, this);
    this.bus.on("waveStateChanged", this.onWaveStateChanged, this);
    this.bus.on("gameOver", this.onGameOver, this);
    this.events.on("shutdown", this.shutdown, this);
    this.events.on("destroy", this.shutdown, this);
  }

  drawTopBar() {
    const bar = this.add.rectangle(
      this.cfg.WORLD_WIDTH / 2,
      this.cfg.UI.TOP_BAR_HEIGHT / 2,
      this.cfg.WORLD_WIDTH,
      this.cfg.UI.TOP_BAR_HEIGHT,
      0x000000,
      this.cfg.UI.TOP_BAR_ALPHA
    );
    bar.setDepth(this.cfg.DEPTH.HUD);
  }

  createTopBarText() {
    const textStyle = {
      fontFamily: this.cfg.UI.FONT_FAMILY,
      fontSize: this.cfg.UI.FONT_SIZE,
      color: "#f4f4f4"
    };

    this.goldText = this.add.text(
      this.cfg.UI.UI_PADDING,
      this.cfg.UI.UI_PADDING - 2,
      "Gold: 0",
      textStyle
    );
    this.goldText.setDepth(this.cfg.DEPTH.HUD);

    this.livesText = this.add.text(
      this.cfg.WORLD_WIDTH * 0.39,
      this.cfg.UI.UI_PADDING - 2,
      "Lives: 0",
      textStyle
    );
    this.livesText.setDepth(this.cfg.DEPTH.HUD);

    this.waveText = this.add.text(
      this.cfg.WORLD_WIDTH * 0.64,
      this.cfg.UI.UI_PADDING - 2,
      "Wave: 0",
      textStyle
    );
    this.waveText.setDepth(this.cfg.DEPTH.HUD);

    this.scoreText = this.add.text(
      this.cfg.WORLD_WIDTH - this.cfg.UI.UI_PADDING,
      this.cfg.UI.UI_PADDING - 2,
      "Score: 0",
      textStyle
    );
    this.scoreText.setOrigin(1, 0);
    this.scoreText.setDepth(this.cfg.DEPTH.HUD);
  }

  createNextWaveButton() {
    const buttonX = this.cfg.WORLD_WIDTH / 2;
    const buttonY = this.cfg.UI.NEXT_WAVE_Y;

    this.nextWaveButton = this.add.rectangle(
      buttonX,
      buttonY,
      this.cfg.UI.NEXT_WAVE_WIDTH,
      this.cfg.UI.NEXT_WAVE_HEIGHT,
      this.cfg.COLORS.ACCENT,
      0.95
    );
    this.nextWaveButton.setDepth(this.cfg.DEPTH.HUD);
    this.nextWaveButton.setStrokeStyle(this.cfg.UI.STROKE_WIDTH, this.cfg.COLORS.GOLD, 0.9);
    this.nextWaveButton.setInteractive({ useHandCursor: true });
    this.nextWaveButton.on("pointerdown", (_pointer, _localX, _localY, event) => {
      if (event) {
        event.stopPropagation();
      }
      this.bus.emit("hudClickConsumed");
      this.bus.emit("requestNextWave");
    });

    this.nextWaveText = this.add.text(buttonX, buttonY, "Next Wave", {
      fontFamily: this.cfg.UI.FONT_FAMILY,
      fontSize: this.cfg.UI.FONT_SIZE,
      color: "#f4f4f4"
    });
    this.nextWaveText.setOrigin(0.5, 0.5);
    this.nextWaveText.setDepth(this.cfg.DEPTH.HUD + 1);

    this.nextWaveButton.setVisible(false);
    this.nextWaveText.setVisible(false);
  }

  onStatsUpdated(stats) {
    this.goldText.setText(`Gold: ${Math.floor(stats.gold)}`);
    this.livesText.setText(`Lives: ${Math.floor(stats.lives)}`);
    this.waveText.setText(`Wave: ${Math.floor(stats.wave)}`);
    this.scoreText.setText(`Score: ${Math.floor(stats.score)}`);
  }

  onWaveStateChanged(waveState) {
    this.betweenWaves = waveState.betweenWaves;
    this.countdownEnd = waveState.countdownEnd;
    this.nextWaveButton.setVisible(this.betweenWaves);
    this.nextWaveText.setVisible(this.betweenWaves);
  }

  refreshNextWaveLabel() {
    if (!this.betweenWaves) {
      return;
    }

    const remainingMs = Math.max(0, this.countdownEnd - this.time.now);
    const remainingSec = (remainingMs / 1000).toFixed(1);
    this.nextWaveText.setText(`Next Wave (${remainingSec}s)`);
  }

  showTowerMenu(payload) {
    this.hideTowerMenu();

    const options = payload.options || [];
    if (options.length === 0) {
      return;
    }

    const buttonWidth = this.cfg.UI.TOWER_BUTTON_WIDTH;
    const buttonHeight = this.cfg.UI.TOWER_BUTTON_HEIGHT;
    const gap = this.cfg.UI.TOWER_BUTTON_GAP;
    const totalWidth = options.length * buttonWidth + (options.length - 1) * gap;
    const halfWidth = totalWidth / 2;
    const x = Phaser.Math.Clamp(payload.x, halfWidth + this.cfg.UI.UI_PADDING, this.cfg.WORLD_WIDTH - halfWidth - this.cfg.UI.UI_PADDING);
    const y = Phaser.Math.Clamp(
      payload.y + this.cfg.UI.TOWER_MENU_OFFSET_Y,
      this.cfg.UI.TOP_BAR_HEIGHT + buttonHeight / 2 + this.cfg.UI.UI_PADDING,
      this.cfg.WORLD_HEIGHT - buttonHeight / 2 - this.cfg.UI.UI_PADDING
    );

    this.menuContainer = this.add.container(x, y);
    this.menuContainer.setDepth(this.cfg.DEPTH.HUD_MENU);

    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      const offsetX = -halfWidth + buttonWidth / 2 + index * (buttonWidth + gap);
      const button = this.add.rectangle(offsetX, 0, buttonWidth, buttonHeight, option.color, 0.95);
      button.setStrokeStyle(this.cfg.UI.STROKE_WIDTH, 0x0f0f0f, 0.9);
      button.setInteractive({ useHandCursor: true });
      button.on("pointerdown", (_pointer, _localX, _localY, event) => {
        if (event) {
          event.stopPropagation();
        }
        this.bus.emit("hudClickConsumed");
        this.bus.emit("requestBuildTower", option.type);
      });

      const label = this.add.text(offsetX, 0, `${option.label}\n${option.cost}g`, {
        fontFamily: this.cfg.UI.FONT_FAMILY,
        fontSize: this.cfg.UI.FONT_SMALL_SIZE,
        color: "#111111",
        align: "center"
      });
      label.setOrigin(0.5, 0.5);

      this.menuContainer.add(button);
      this.menuContainer.add(label);
    }
  }

  hideTowerMenu() {
    if (!this.menuContainer) {
      return;
    }

    this.menuContainer.destroy(true);
    this.menuContainer = null;
  }

  onGameOver() {
    this.hideTowerMenu();
    this.nextWaveButton.setVisible(false);
    this.nextWaveText.setVisible(false);
  }
}
