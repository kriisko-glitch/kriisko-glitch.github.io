import Phaser from 'phaser';
import { GAME, COLORS, STORAGE_KEY, UI, STARFIELD, DEPTH } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLORS.BG);
    this.createStarfield();

    this.add.text(cx, cy - 100, 'VOID DRIFT', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '48px',
      color: '#00e5ff',
      fontStyle: 'bold',
      stroke: '#003344',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    this.add.text(cx, cy - 50, 'TWIN-STICK SURVIVAL', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '16px',
      color: '#6688cc',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    const highScore = this.loadHighScore();
    if (highScore > 0) {
      this.add.text(cx, cy - 10, `HIGH SCORE: ${highScore}`, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: '20px',
        color: '#ffc107',
      }).setOrigin(0.5).setDepth(DEPTH.HUD);
    }

    const playBtn = this.add.text(cx, cy + 50, '[ PLAY ]', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '28px',
      color: '#00e5ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.HUD).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: playBtn,
      alpha: { from: 1, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#00e5ff'));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.add.text(cx, cy + 110, 'WASD / Arrows to move', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '14px',
      color: '#556688',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    this.add.text(cx, cy + 130, 'Auto-aim • Survive the void', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '14px',
      color: '#556688',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('GameScene');
    });
  }

  private createStarfield(): void {
    const gfx = this.add.graphics().setDepth(DEPTH.STARFIELD_FAR);
    for (let i = 0; i < STARFIELD.FAR_COUNT; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const size = Phaser.Math.Between(STARFIELD.FAR_SIZE_MIN, STARFIELD.FAR_SIZE_MAX);
      gfx.fillStyle(COLORS.STAR_FAR, Phaser.Math.FloatBetween(0.2, 0.5));
      gfx.fillCircle(x, y, size);
    }
    for (let i = 0; i < STARFIELD.NEAR_COUNT; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const size = Phaser.Math.Between(STARFIELD.NEAR_SIZE_MIN, STARFIELD.NEAR_SIZE_MAX);
      gfx.fillStyle(COLORS.STAR_NEAR, Phaser.Math.FloatBetween(0.5, 0.9));
      gfx.fillCircle(x, y, size);
    }
  }

  private loadHighScore(): number {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
