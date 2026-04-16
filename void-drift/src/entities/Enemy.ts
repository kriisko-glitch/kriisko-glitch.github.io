import Phaser from 'phaser';
import { DEPTH, COLORS } from '../config';

export type EnemyType = 'drone' | 'bruiser' | 'cruiser';

export interface EnemyConfig {
  hp: number;
  speed: number;
  ramDamage: number;
  points: number;
  dropChance: number;
  size: number;
  dropCount?: number;
  fireRateMs?: number;
  bulletSpeed?: number;
  bulletDamage?: number;
}

export class Enemy extends Phaser.GameObjects.Container {
  public enemyType: EnemyType;
  public hp: number;
  public maxHp: number;
  public config: EnemyConfig;
  public lastFireTime: number = 0;
  public body!: Phaser.Physics.Arcade.Body;

  private gfx!: Phaser.GameObjects.Graphics;
  private targetX: number = 0;
  private targetY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType, config: EnemyConfig) {
    super(scene, x, y);
    this.enemyType = type;
    this.config = config;
    this.hp = config.hp;
    this.maxHp = config.hp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.ENEMIES);
    this.setSize(config.size * 2, config.size * 2);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(config.size, -config.size, -config.size);
    body.setAllowGravity(false);

    this.drawShape();
  }

  private drawShape(): void {
    this.gfx = this.scene.add.graphics();
    const s = this.config.size;

    switch (this.enemyType) {
      case 'drone':
        this.drawDrone(s);
        break;
      case 'bruiser':
        this.drawBruiser(s);
        break;
      case 'cruiser':
        this.drawCruiser(s);
        break;
    }

    this.add(this.gfx);
  }

  private drawDrone(s: number): void {
    const g = this.gfx;
    g.lineStyle(2, COLORS.DRONE_COLOR, 1);
    g.fillStyle(COLORS.DRONE_COLOR, 0.4);
    g.beginPath();
    g.moveTo(0, -s);
    g.lineTo(s * 0.87, s * 0.5);
    g.lineTo(-s * 0.87, s * 0.5);
    g.closePath();
    g.fillPath();
    g.strokePath();
    g.fillStyle(COLORS.DRONE_COLOR, 0.9);
    g.fillCircle(0, 0, 3);
  }

  private drawBruiser(s: number): void {
    const g = this.gfx;
    g.lineStyle(2, COLORS.BRUISER_COLOR, 1);
    g.fillStyle(COLORS.BRUISER_COLOR, 0.35);

    const sides = 6;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
      points.push({ x: Math.cos(angle) * s, y: Math.sin(angle) * s });
    }
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < sides; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.lineStyle(1, COLORS.BRUISER_COLOR, 0.6);
    for (let i = 0; i < sides; i++) {
      g.lineBetween(0, 0, points[i].x * 0.6, points[i].y * 0.6);
    }
    g.fillStyle(COLORS.BRUISER_COLOR, 0.8);
    g.fillCircle(0, 0, 5);
  }

  private drawCruiser(s: number): void {
    const g = this.gfx;
    g.lineStyle(2, COLORS.CRUISER_COLOR, 1);
    g.fillStyle(COLORS.CRUISER_COLOR, 0.35);
    g.beginPath();
    g.moveTo(0, -s * 1.3);
    g.lineTo(s * 0.7, 0);
    g.lineTo(0, s * 1.3);
    g.lineTo(-s * 0.7, 0);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.lineStyle(1, COLORS.CRUISER_COLOR, 0.5);
    g.lineBetween(-s * 0.4, 0, s * 0.4, 0);
    g.lineBetween(0, -s * 0.8, 0, s * 0.8);

    g.fillStyle(COLORS.CRUISER_COLOR, 0.9);
    g.fillCircle(0, 0, 4);
    g.lineStyle(1, COLORS.CRUISER_COLOR, 0.3);
    g.strokeCircle(0, 0, 7);
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  update(_time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const nx = dx / dist;
      const ny = dy / dist;
      body.setVelocity(nx * this.config.speed, ny * this.config.speed);
    }

    if (this.enemyType === 'drone') {
      this.gfx.setRotation(this.gfx.rotation + 0.03);
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;

    this.gfx.setAlpha(0.2);
    this.scene.time.delayedCall(60, () => {
      if (this.gfx && this.gfx.active) {
        this.gfx.setAlpha(1);
      }
    });

    return this.hp <= 0;
  }

  canFire(time: number): boolean {
    if (this.enemyType !== 'cruiser' || !this.config.fireRateMs) return false;
    return time - this.lastFireTime >= this.config.fireRateMs;
  }

  markFired(time: number): void {
    this.lastFireTime = time;
  }
}
