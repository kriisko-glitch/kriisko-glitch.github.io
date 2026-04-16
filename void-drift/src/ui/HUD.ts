import Phaser from 'phaser';
import { COLORS, UI, PLAYER, DEPTH } from '../config';

export class HUD {
  private scene: Phaser.Scene;
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private hpLabel!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    this.panel = this.scene.add.graphics();
    this.panel.setDepth(DEPTH.HUD - 1);
    this.panel.fillStyle(COLORS.HUD_PANEL, 0.7);
    this.panel.fillRoundedRect(4, 4, 220, 88, 6);
    this.panel.lineStyle(1, COLORS.HUD_ACCENT, 0.4);
    this.panel.strokeRoundedRect(4, 4, 220, 88, 6);

    this.hpBarBg = this.scene.add.graphics();
    this.hpBarBg.setDepth(DEPTH.HUD);
    this.hpBarBg.fillStyle(COLORS.HP_BAR_BG, 1);
    this.hpBarBg.fillRoundedRect(UI.HP_BAR_X, UI.HP_BAR_Y, UI.HP_BAR_WIDTH, UI.HP_BAR_HEIGHT, 4);

    this.hpBarFill = this.scene.add.graphics();
    this.hpBarFill.setDepth(DEPTH.HUD);

    this.hpLabel = this.scene.add.text(
      UI.HP_BAR_X + UI.HP_BAR_WIDTH / 2,
      UI.HP_BAR_Y + UI.HP_BAR_HEIGHT / 2,
      `${PLAYER.MAX_HP} / ${PLAYER.MAX_HP}`,
      { fontFamily: UI.FONT_FAMILY, fontSize: '10px', color: '#ffffff' },
    ).setOrigin(0.5).setDepth(DEPTH.HUD + 1);

    this.scoreText = this.scene.add.text(UI.SCORE_X, UI.SCORE_Y, 'SCORE: 0', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '16px',
      color: '#ffffff',
    }).setDepth(DEPTH.HUD);

    this.waveText = this.scene.add.text(UI.WAVE_X, UI.WAVE_Y, 'WAVE: 1', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '14px',
      color: '#00e5ff',
    }).setDepth(DEPTH.HUD);

    this.timerText = this.scene.add.text(UI.TIMER_X, UI.TIMER_Y, '0:00', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '14px',
      color: '#6688cc',
    }).setDepth(DEPTH.HUD);
  }

  updateHP(hp: number): void {
    this.hpBarFill.clear();
    const ratio = hp / PLAYER.MAX_HP;
    const fillColor = ratio > 0.3 ? COLORS.HP_BAR_FILL : COLORS.HP_BAR_LOW;
    const width = UI.HP_BAR_WIDTH * ratio;

    this.hpBarFill.fillStyle(fillColor, 1);
    if (width > 0) {
      this.hpBarFill.fillRoundedRect(UI.HP_BAR_X, UI.HP_BAR_Y, width, UI.HP_BAR_HEIGHT, 4);
    }

    this.hpLabel.setText(`${hp} / ${PLAYER.MAX_HP}`);
  }

  updateScore(score: number): void {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  updateWave(wave: number): void {
    this.waveText.setText(`WAVE: ${wave}`);
  }

  updateTimer(elapsedSeconds: number): void {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = Math.floor(elapsedSeconds % 60);
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
  }

  destroy(): void {
    this.panel.destroy();
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.hpLabel.destroy();
    this.scoreText.destroy();
    this.waveText.destroy();
    this.timerText.destroy();
  }
}
