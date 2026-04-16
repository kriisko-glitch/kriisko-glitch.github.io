import { ELEMENTS } from '../data/elements';

interface FloatingOrb {
  elementIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
}

const MAX_ORBS = 40;
const ORB_BASE_RADIUS = 14;

export class ElementSpriteRenderer {
  private orbs: FloatingOrb[] = [];
  private width = 0;
  private height = 0;

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
  }

  notifyMerge(elementIndex: number, x?: number, y?: number): void {
    if (this.orbs.length >= MAX_ORBS) {
      this.orbs.shift();
    }

    const cx = x ?? this.width * (0.25 + Math.random() * 0.5);
    const cy = y ?? this.height * (0.2 + Math.random() * 0.5);

    this.orbs.push({
      elementIndex,
      x: cx,
      y: cy,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20,
      radius: ORB_BASE_RADIUS + elementIndex * 0.5,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  update(dtSec: number): void {
    const pad = 30;
    for (const orb of this.orbs) {
      orb.x += orb.vx * dtSec;
      orb.y += orb.vy * dtSec;
      orb.pulsePhase += dtSec * 2;

      if (orb.x < pad) { orb.x = pad; orb.vx = Math.abs(orb.vx); }
      if (orb.x > this.width - pad) { orb.x = this.width - pad; orb.vx = -Math.abs(orb.vx); }
      if (orb.y < pad) { orb.y = pad; orb.vy = Math.abs(orb.vy); }
      if (orb.y > this.height - pad) { orb.y = this.height - pad; orb.vy = -Math.abs(orb.vy); }

      orb.vx += (Math.random() - 0.5) * 2 * dtSec;
      orb.vy += (Math.random() - 0.5) * 2 * dtSec;
      orb.vx *= 0.99;
      orb.vy *= 0.99;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const orb of this.orbs) {
      const elem = ELEMENTS[orb.elementIndex];
      const pulse = 1 + Math.sin(orb.pulsePhase) * 0.1;
      const r = orb.radius * pulse;

      ctx.save();

      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r * 2.5);
      grad.addColorStop(0, elem.glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = elem.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = elem.color;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.font = `bold ${Math.round(r * 0.9)}px 'Consolas', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(elem.symbol, orb.x, orb.y + 1);

      ctx.restore();
    }
  }
}
