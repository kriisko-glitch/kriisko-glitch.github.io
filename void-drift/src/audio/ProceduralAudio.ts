import { AUDIO } from '../config';

export class ProceduralAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = AUDIO.MASTER_GAIN;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sawtooth',
    volume: number = 1.0,
  ): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume * AUDIO.MASTER_GAIN, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  }

  private playNoise(duration: number, volume: number = 0.5): void {
    const ctx = this.ensureContext();
    if (!this.masterGain) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * AUDIO.MASTER_GAIN, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(ctx.currentTime);
  }

  shoot(): void {
    this.playTone(AUDIO.SHOOT_FREQ, AUDIO.SHOOT_DURATION, 'sawtooth', 0.3);
  }

  enemyDeath(): void {
    this.playNoise(AUDIO.ENEMY_DEATH_DURATION, 0.4);
    this.playTone(AUDIO.ENEMY_DEATH_FREQ, AUDIO.ENEMY_DEATH_DURATION, 'sine', 0.3);
  }

  playerHit(): void {
    this.playTone(AUDIO.PLAYER_HIT_FREQ, AUDIO.PLAYER_HIT_DURATION, 'sine', 0.6);
  }

  upgradeCollect(): void {
    const ctx = this.ensureContext();
    AUDIO.UPGRADE_NOTES.forEach((freq, i) => {
      const delay = i * AUDIO.UPGRADE_NOTE_DURATION;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3 * AUDIO.MASTER_GAIN, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + AUDIO.UPGRADE_NOTE_DURATION,
      );
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + AUDIO.UPGRADE_NOTE_DURATION + 0.01);
    });
  }

  waveStart(): void {
    const ctx = this.ensureContext();
    AUDIO.WAVE_CHORD.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15 * AUDIO.MASTER_GAIN, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3 * AUDIO.MASTER_GAIN, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + AUDIO.WAVE_CHORD_DURATION,
      );
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + AUDIO.WAVE_CHORD_DURATION + 0.01);
    });
  }
}

export const audio = new ProceduralAudio();
