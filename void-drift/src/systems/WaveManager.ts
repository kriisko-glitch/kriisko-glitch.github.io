import Phaser from 'phaser';
import { WAVES, ENEMIES, GAME } from '../config';
import { Enemy } from '../entities/Enemy';
import type { EnemyType, EnemyConfig } from '../entities/Enemy';

const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  drone: {
    hp: ENEMIES.DRONE.HP,
    speed: ENEMIES.DRONE.SPEED,
    ramDamage: ENEMIES.DRONE.RAM_DAMAGE,
    points: ENEMIES.DRONE.POINTS,
    dropChance: ENEMIES.DRONE.DROP_CHANCE,
    size: ENEMIES.DRONE.SIZE,
  },
  bruiser: {
    hp: ENEMIES.BRUISER.HP,
    speed: ENEMIES.BRUISER.SPEED,
    ramDamage: ENEMIES.BRUISER.RAM_DAMAGE,
    points: ENEMIES.BRUISER.POINTS,
    dropChance: ENEMIES.BRUISER.DROP_CHANCE,
    dropCount: ENEMIES.BRUISER.DROP_COUNT,
    size: ENEMIES.BRUISER.SIZE,
  },
  cruiser: {
    hp: ENEMIES.CRUISER.HP,
    speed: ENEMIES.CRUISER.SPEED,
    ramDamage: ENEMIES.CRUISER.RAM_DAMAGE,
    points: ENEMIES.CRUISER.POINTS,
    dropChance: ENEMIES.CRUISER.DROP_CHANCE,
    size: ENEMIES.CRUISER.SIZE,
    fireRateMs: ENEMIES.CRUISER.FIRE_RATE_MS,
    bulletSpeed: ENEMIES.CRUISER.BULLET_SPEED,
    bulletDamage: ENEMIES.CRUISER.BULLET_DAMAGE,
  },
};

export class WaveManager {
  public currentWave: number = 0;
  public waveTimer: number = 0;
  public waveActive: boolean = false;
  public waveStartTime: number = 0;

  private scene: Phaser.Scene;
  private enemyGroup: Phaser.GameObjects.Group;
  private onWaveStart?: (wave: number) => void;

  constructor(
    scene: Phaser.Scene,
    enemyGroup: Phaser.GameObjects.Group,
    onWaveStart?: (wave: number) => void,
  ) {
    this.scene = scene;
    this.enemyGroup = enemyGroup;
    this.onWaveStart = onWaveStart;
  }

  startNextWave(time: number): void {
    this.currentWave++;
    this.waveActive = true;
    this.waveStartTime = time;
    this.waveTimer = 0;

    const def = this.getWaveDefinition();
    this.spawnEnemies('drone', def.drones);
    this.spawnEnemies('bruiser', def.bruisers);
    this.spawnEnemies('cruiser', def.cruisers);

    this.onWaveStart?.(this.currentWave);
  }

  private getWaveDefinition(): { drones: number; bruisers: number; cruisers: number } {
    const idx = this.currentWave - 1;
    const maxTotal = WAVES.MAX_ENEMIES_ALIVE;

    if (idx < WAVES.DEFINITIONS.length) {
      const raw = WAVES.DEFINITIONS[idx];
      let drones: number = raw.drones;
      let bruisers: number = raw.bruisers;
      let cruisers: number = raw.cruisers;
      const total = drones + bruisers + cruisers;
      if (total > maxTotal) {
        const ratio = maxTotal / total;
        drones = Math.max(1, Math.round(drones * ratio));
        bruisers = Math.round(bruisers * ratio);
        cruisers = Math.round(cruisers * ratio);
      }
      return { drones, bruisers, cruisers };
    }

    const base = WAVES.DEFINITIONS[WAVES.DEFINITIONS.length - 1];
    const cappedWave = Math.min(idx - WAVES.DEFINITIONS.length + 1, 6);
    const scale = Math.pow(WAVES.SCALE_FACTOR, cappedWave);
    const extraCruisers = Math.floor(cappedWave / 2);

    let drones = Math.round(base.drones * scale);
    let bruisers = Math.round(base.bruisers * scale);
    let cruisers = base.cruisers + extraCruisers;

    const total = drones + bruisers + cruisers;
    if (total > maxTotal) {
      const ratio = maxTotal / total;
      drones = Math.max(1, Math.round(drones * ratio));
      bruisers = Math.round(bruisers * ratio);
      cruisers = Math.round(cruisers * ratio);
    }

    return { drones, bruisers, cruisers };
  }

  private spawnEnemies(type: EnemyType, count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.enemyGroup.getLength() >= WAVES.MAX_ENEMIES_ALIVE) return;
      const pos = this.getEdgeSpawnPosition();
      const config = { ...ENEMY_CONFIGS[type] };
      if (this.currentWave > WAVES.ENEMY_SPEED_CAP_WAVE) {
        config.speed = Math.min(config.speed, ENEMY_CONFIGS[type].speed);
      }
      const enemy = new Enemy(this.scene, pos.x, pos.y, type, config);
      this.enemyGroup.add(enemy);
    }
  }

  private getEdgeSpawnPosition(): { x: number; y: number } {
    const edge = Phaser.Math.Between(0, 3);
    const margin = WAVES.SPAWN_MARGIN;

    switch (edge) {
      case 0: return { x: Phaser.Math.Between(0, GAME.WIDTH), y: -margin };
      case 1: return { x: GAME.WIDTH + margin, y: Phaser.Math.Between(0, GAME.HEIGHT) };
      case 2: return { x: Phaser.Math.Between(0, GAME.WIDTH), y: GAME.HEIGHT + margin };
      default: return { x: -margin, y: Phaser.Math.Between(0, GAME.HEIGHT) };
    }
  }

  update(_time: number, delta: number): void {
    if (this.waveActive) {
      this.waveTimer += delta;
    }
  }

  shouldSpawnNextWave(): boolean {
    if (!this.waveActive) return true;
    const allDead = this.enemyGroup.getLength() === 0;
    const timedOut = this.waveTimer >= WAVES.INTERVAL_MS;
    return allDead || timedOut;
  }

  getTimeSurvived(): number {
    return this.waveTimer / 1000;
  }
}
