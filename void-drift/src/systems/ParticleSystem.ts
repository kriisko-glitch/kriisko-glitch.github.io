import Phaser from 'phaser';
import { PARTICLES, COLORS, DEPTH } from '../config';

interface Particle {
  gfx: Phaser.GameObjects.Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private scene: Phaser.Scene;
  private particles: Particle[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  explode(x: number, y: number, color: number = COLORS.EXPLOSION_OUTER, count?: number): void {
    const n = count ?? PARTICLES.EXPLOSION_COUNT;
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n + Phaser.Math.FloatBetween(-0.3, 0.3);
      const speed = Phaser.Math.Between(PARTICLES.EXPLOSION_SPEED_MIN, PARTICLES.EXPLOSION_SPEED_MAX);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const gfx = this.scene.add.graphics();
      gfx.setDepth(DEPTH.PARTICLES);
      gfx.setPosition(x, y);

      const size = Phaser.Math.Between(2, 5);
      const isInner = i % 3 === 0;
      const c = isInner ? COLORS.EXPLOSION_INNER : color;
      gfx.fillStyle(c, 1);
      gfx.fillCircle(0, 0, size);

      this.particles.push({
        gfx,
        vx,
        vy,
        life: PARTICLES.EXPLOSION_LIFESPAN_MS,
        maxLife: PARTICLES.EXPLOSION_LIFESPAN_MS,
      });
    }
  }

  spawnTrail(x: number, y: number, color: number = COLORS.ENGINE_GLOW): void {
    const gfx = this.scene.add.graphics();
    gfx.setDepth(DEPTH.ENGINE_TRAIL);
    gfx.setPosition(x, y);
    gfx.fillStyle(color, 0.6);
    gfx.fillCircle(0, 0, Phaser.Math.Between(1, 3));

    this.particles.push({
      gfx,
      vx: Phaser.Math.FloatBetween(-10, 10),
      vy: Phaser.Math.FloatBetween(20, 50),
      life: PARTICLES.ENGINE_TRAIL_LIFESPAN_MS,
      maxLife: PARTICLES.ENGINE_TRAIL_LIFESPAN_MS,
    });
  }

  update(_time: number, delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        p.gfx.destroy();
        this.particles.splice(i, 1);
        continue;
      }

      const t = p.life / p.maxLife;
      p.gfx.setAlpha(t);
      p.gfx.setScale(t);
      p.gfx.x += p.vx * (delta / 1000);
      p.gfx.y += p.vy * (delta / 1000);
    }
  }

  destroy(): void {
    for (const p of this.particles) {
      p.gfx.destroy();
    }
    this.particles = [];
  }
}
