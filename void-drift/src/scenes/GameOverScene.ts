import Phaser from 'phaser';
import { GAME, COLORS, STORAGE_KEY, UI, DEPTH } from '../config';

interface GameOverData {
  score: number;
  wave: number;
  elapsed: number;
  upgrades: string[];
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLORS.BG);

    const { score, wave, elapsed } = data;
    const highScore = this.loadHighScore();
    const isNewHigh = score > highScore;

    if (isNewHigh) {
      this.saveHighScore(score);
    }

    const lb = (window as unknown as Record<string, unknown>).KriiskoLeaderboard as {
      qualifies: (g: string, s: number) => boolean;
      promptInitials: (g: string, s: number, cb: (i: string | null) => void) => void;
      submit: (g: string, s: number, i: string) => void;
      show: (g: string) => void;
    } | undefined;
    if (lb && lb.qualifies('void-drift', score)) {
      lb.promptInitials('void-drift', score, (initials) => {
        if (initials) lb.submit('void-drift', score, initials);
        lb.show('void-drift');
      });
    }

    this.add.text(cx, cy - 120, 'GAME OVER', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '42px',
      color: '#ff4444',
      fontStyle: 'bold',
      stroke: '#440000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    this.add.text(cx, cy - 60, `SCORE: ${score}`, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    if (isNewHigh) {
      const newHighText = this.add.text(cx, cy - 30, 'NEW HIGH SCORE!', {
        fontFamily: UI.FONT_FAMILY,
        fontSize: '18px',
        color: '#ffc107',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH.HUD);

      this.tweens.add({
        targets: newHighText,
        alpha: { from: 1, to: 0.3 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add.text(cx, cy - 30, `HIGH SCORE: ${highScore}`, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: '16px',
        color: '#ffc107',
      }).setOrigin(0.5).setDepth(DEPTH.HUD);
    }

    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    this.add.text(cx, cy + 10, `WAVE ${wave} • ${mins}:${secs.toString().padStart(2, '0')}`, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '18px',
      color: '#6688cc',
    }).setOrigin(0.5).setDepth(DEPTH.HUD);

    const playAgainBtn = this.add.text(cx, cy + 70, '[ PLAY AGAIN ]', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '24px',
      color: '#00e5ff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH.HUD).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: playAgainBtn,
      alpha: { from: 1, to: 0.4 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    playAgainBtn.on('pointerover', () => playAgainBtn.setColor('#ffffff'));
    playAgainBtn.on('pointerout', () => playAgainBtn.setColor('#00e5ff'));
    playAgainBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.text(cx, cy + 110, '[ MENU ]', {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '18px',
      color: '#556688',
    }).setOrigin(0.5).setDepth(DEPTH.HUD).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#556688'));
    menuBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('GameScene');
    });
  }

  private loadHighScore(): number {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private saveHighScore(score: number): void {
    localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(score))));
  }
}
