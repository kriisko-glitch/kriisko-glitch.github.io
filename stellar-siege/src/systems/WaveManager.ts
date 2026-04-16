export type EnemyType = 'drone' | 'fighter' | 'cruiser';

export interface WaveSpawn {
  type: EnemyType;
  count: number;
}

export class WaveManager {
  wave = 0;
  enemiesAlive = 0;
  state: 'idle' | 'announcing' | 'combat' | 'cleared' = 'idle';
  private announceTimer = 0;
  private clearTimer = 0;

  private static readonly ANNOUNCE_DURATION = 2.0;
  private static readonly CLEAR_DELAY = 1.5;

  getWaveSpawns(): WaveSpawn[] {
    const w = this.wave;
    const spawns: WaveSpawn[] = [];

    spawns.push({ type: 'drone', count: Math.min(3 + w * 2, 20) });

    if (w >= 2) {
      spawns.push({ type: 'fighter', count: Math.min(1 + Math.floor((w - 1) * 1.5), 10) });
    }
    if (w >= 3) {
      spawns.push({ type: 'cruiser', count: Math.min(Math.floor((w - 2) * 0.8), 5) });
    }

    return spawns;
  }

  startNextWave(): WaveSpawn[] {
    this.wave++;
    this.state = 'announcing';
    this.announceTimer = WaveManager.ANNOUNCE_DURATION;
    const spawns = this.getWaveSpawns();
    this.enemiesAlive = spawns.reduce((sum, s) => sum + s.count, 0);
    return spawns;
  }

  onEnemyKilled(): void {
    this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
    if (this.enemiesAlive <= 0 && this.state === 'combat') {
      this.state = 'cleared';
      this.clearTimer = WaveManager.CLEAR_DELAY;
    }
  }

  update(dt: number): 'announcing' | 'spawn' | 'cleared' | 'next' | null {
    if (this.state === 'announcing') {
      this.announceTimer -= dt;
      if (this.announceTimer <= 0) {
        this.state = 'combat';
        return 'spawn';
      }
      return 'announcing';
    }

    if (this.state === 'cleared') {
      this.clearTimer -= dt;
      if (this.clearTimer <= 0) {
        this.state = 'idle';
        return 'next';
      }
      return 'cleared';
    }

    return null;
  }
}
