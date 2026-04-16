import { MERGE_PARTICLE_COUNT, MERGE_PARTICLE_LIFE_MS } from '../config';

interface VFXParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export class ParticleVFX {
  private particles: VFXParticle[] = [];
  private pool: VFXParticle[] = [];

  spawnBurst(x: number, y: number, color: string, count = MERGE_PARTICLE_COUNT): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 60 + Math.random() * 120;
      const p = this.acquire();
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.color = color;
      p.life = MERGE_PARTICLE_LIFE_MS;
      p.maxLife = MERGE_PARTICLE_LIFE_MS;
      p.size = 2 + Math.random() * 3;
      this.particles.push(p);
    }
  }

  spawnClickBurst(x: number, y: number): void {
    this.spawnBurst(x, y, '#00ffff', 8);
  }

  update(dtMs: number): void {
    const dtSec = dtMs / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dtMs;
      if (p.life <= 0) {
        this.pool.push(this.particles.splice(i, 1)[0]);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  get count(): number {
    return this.particles.length;
  }

  private acquire(): VFXParticle {
    return this.pool.pop() ?? { x: 0, y: 0, vx: 0, vy: 0, color: '', life: 0, maxLife: 0, size: 0 };
  }
}
