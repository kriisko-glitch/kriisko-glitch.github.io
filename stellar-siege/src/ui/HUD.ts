export class HUD {
  private healthBar: HTMLElement;
  private scoreEl: HTMLElement;
  private waveEl: HTMLElement;
  private waveAnnounce: HTMLElement;
  private gameOverEl: HTMLElement;
  private finalScoreEl: HTMLElement;
  private shieldIndicator: HTMLElement;
  private crosshair: HTMLElement;

  constructor() {
    this.healthBar = document.getElementById('health-bar')!;
    this.scoreEl = document.getElementById('score')!;
    this.waveEl = document.getElementById('wave-display')!;
    this.waveAnnounce = document.getElementById('wave-announce')!;
    this.gameOverEl = document.getElementById('game-over')!;
    this.finalScoreEl = document.getElementById('final-score')!;
    this.shieldIndicator = document.getElementById('shield-indicator')!;
    this.crosshair = document.getElementById('crosshair')!;
  }

  updateHP(hp: number, maxHp: number): void {
    const pct = Math.max(0, (hp / maxHp) * 100);
    this.healthBar.style.width = `${pct}%`;

    if (pct > 60) {
      this.healthBar.style.background = 'linear-gradient(90deg, #44ff44, #88ff44)';
    } else if (pct > 30) {
      this.healthBar.style.background = 'linear-gradient(90deg, #ff8844, #ffaa44)';
    } else {
      this.healthBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6644)';
    }
  }

  updateScore(score: number): void {
    this.scoreEl.textContent = `SCORE: ${String(score).padStart(6, '0')}`;
  }

  updateWave(wave: number): void {
    this.waveEl.textContent = `WAVE ${wave}`;
  }

  showWaveAnnounce(wave: number): void {
    this.waveAnnounce.textContent = `WAVE ${wave}`;
    this.waveAnnounce.style.opacity = '1';
  }

  hideWaveAnnounce(): void {
    this.waveAnnounce.style.opacity = '0';
  }

  showShield(active: boolean): void {
    this.shieldIndicator.style.display = active ? 'block' : 'none';
    if (active) {
      this.crosshair.classList.add('shielded');
    } else {
      this.crosshair.classList.remove('shielded');
    }
  }

  showGameOver(score: number): void {
    this.finalScoreEl.textContent = `SCORE: ${String(score).padStart(6, '0')}`;
    this.gameOverEl.style.display = 'flex';
  }

  hideGameOver(): void {
    this.gameOverEl.style.display = 'none';
  }

  reset(): void {
    this.hideGameOver();
    this.hideWaveAnnounce();
    this.showShield(false);
    this.updateHP(100, 100);
    this.updateScore(0);
    this.updateWave(1);
  }
}
