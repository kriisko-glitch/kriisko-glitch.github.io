import Phaser from 'phaser';
import { GAME, COLORS, UPGRADES, DEPTH, UI } from '../config';
import type { UpgradeType } from '../config';

const UPGRADE_DISPLAY_NAMES: Record<UpgradeType, string> = {
  RAPID_FIRE: '+RAPID FIRE!',
  SPREAD_SHOT: '+SPREAD SHOT!',
  SHIELD: '+SHIELD RESTORED!',
  DAMAGE_BOOST: '+DAMAGE BOOST!',
  SPEED_BURST: '+SPEED BURST!',
};

const UPGRADE_DISPLAY_COLORS: Record<UpgradeType, string> = {
  RAPID_FIRE: '#ff4444',
  SPREAD_SHOT: '#aa44ff',
  SHIELD: '#22ff88',
  DAMAGE_BOOST: '#ff8800',
  SPEED_BURST: '#00ccff',
};

export class UpgradeCard {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(type: UpgradeType): void {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2 - 60;
    const color = UPGRADE_DISPLAY_COLORS[type];
    const name = UPGRADE_DISPLAY_NAMES[type];

    const text = this.scene.add.text(cx, cy, name, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '22px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY).setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      alpha: { from: 0, to: 1 },
      y: cy - 20,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          alpha: 0,
          y: cy - 50,
          delay: UPGRADES.POPUP_DURATION_MS - 600,
          duration: 300,
          onComplete: () => text.destroy(),
        });
      },
    });
  }
}
