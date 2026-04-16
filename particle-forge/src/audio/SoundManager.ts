export class SoundManager {
  private ctx: AudioContext | null = null;
  private _muted = false;

  get muted(): boolean { return this._muted; }

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute(): void {
    this._muted = !this._muted;
  }

  playClick(): void {
    this.playTone(880, 0.06, 'sine', 0.15);
  }

  playMerge(): void {
    this.playTone(440, 0.12, 'triangle', 0.2);
    setTimeout(() => this.playTone(660, 0.1, 'triangle', 0.15), 60);
  }

  playBuy(): void {
    this.playTone(523, 0.08, 'square', 0.1);
    setTimeout(() => this.playTone(659, 0.08, 'square', 0.08), 50);
  }

  playResearch(): void {
    this.playTone(392, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(523, 0.12, 'sine', 0.18), 80);
    setTimeout(() => this.playTone(784, 0.2, 'sine', 0.15), 160);
  }

  playPrestige(): void {
    const notes = [262, 330, 392, 523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.2 - i * 0.02), i * 80);
    });
  }

  playUnlock(): void {
    this.playTone(330, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(440, 0.12, 'sine', 0.18), 100);
    setTimeout(() => this.playTone(660, 0.25, 'sine', 0.15), 200);
  }

  private playTone(freq: number, duration: number, type: OscillatorType, volume: number): void {
    if (this._muted) return;
    try {
      const ctx = this.ensure();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.05);
    } catch {
      // audio context not available
    }
  }
}
