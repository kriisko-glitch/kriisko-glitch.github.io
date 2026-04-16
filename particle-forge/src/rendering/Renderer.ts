import { STAR_COUNT } from '../config';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  phase: number;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
    this.initStars();
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (this.stars.length === 0) this.initStars();
  }

  get width(): number { return this.w; }
  get height(): number { return this.h; }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.5 + Math.random() * 1.5,
        brightness: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  clear(): void {
    const g = this.ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#020018');
    g.addColorStop(0.5, '#040028');
    g.addColorStop(1, '#020012');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  drawStars(dtSec: number): void {
    this.time += dtSec;
    for (const s of this.stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(this.time * s.twinkleSpeed + s.phase);
      const alpha = s.brightness * twinkle;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(s.x * this.w, s.y * this.h, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }
}
