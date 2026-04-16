import Phaser from 'phaser';
import { GAME, COLORS, UI } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLORS.BG);

    const barWidth = 300;
    const barHeight = 8;
    const barX = cx - barWidth / 2;
    const barY = cy + 30;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1a1a3a, 1);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    const barFill = this.add.graphics();

    const title = this.add.text(cx, cy - 30, 'VOID DRIFT', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '36px',
      color: '#00e5ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    title.setAlpha(0.5);

    const subtitle = this.add.text(cx, cy + 5, 'LOADING...', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '14px',
      color: '#6688cc',
    }).setOrigin(0.5);

    let progress = 0;
    const loadDuration = 1200;
    const startTime = this.time.now;

    this.time.addEvent({
      delay: 16,
      repeat: Math.floor(loadDuration / 16),
      callback: () => {
        progress = Math.min(1, (this.time.now - startTime) / loadDuration);
        barFill.clear();
        barFill.fillStyle(COLORS.HUD_ACCENT, 1);
        barFill.fillRoundedRect(barX, barY, barWidth * progress, barHeight, 4);
        title.setAlpha(0.5 + progress * 0.5);
      },
    });

    this.time.delayedCall(loadDuration + 200, () => {
      subtitle.setText('READY');
      this.time.delayedCall(400, () => {
        this.scene.start('MenuScene');
      });
    });
  }
}
