const getConfig = () => window.TowerDefense?.CONFIG || window.__TD_CONFIG__;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const cfg = getConfig();
    this.cameras.main.setBackgroundColor(cfg.COLORS.BACKGROUND);
    this.scene.start("GameScene");
    this.scene.launch("HUDScene");
  }
}
