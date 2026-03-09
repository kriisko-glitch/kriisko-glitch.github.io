export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {}

  create() {
    const C = window.SpaceShooter.CONFIG;
    const centerX = C.GAME.WIDTH * 0.5;
    const centerY = C.GAME.HEIGHT * 0.5;

    this.cameras.main.setBackgroundColor(C.COLORS.BACKGROUND);

    const studioText = this.add
      .text(centerX, centerY, 'KRIISKO STUDIOS', {
        fontFamily: C.UI.FONT_FAMILY,
        fontSize: C.UI.BOOT_FONT_SIZE,
        color: C.COLORS.WHITE,
      })
      .setOrigin(0.5)
      .setAlpha(C.BOOT.TEXT_ALPHA_START);

    this.tweens.add({
      targets: studioText,
      alpha: 1,
      duration: C.BOOT.FLASH_TWEEN_MS,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(C.BOOT.DURATION_MS, () => {
      this.scene.start('GameScene');
    });
  }

  update() {}
}
