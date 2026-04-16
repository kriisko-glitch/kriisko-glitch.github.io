interface Notif {
  el: HTMLElement;
  startTime: number;
  duration: number;
}

const NOTIF_DURATION = 1500;

export class Notifications {
  private root: HTMLElement;
  private active: Notif[] = [];

  constructor(root: HTMLElement) {
    this.root = root;
  }

  show(text: string, color: string, x: number, y: number): void {
    const el = document.createElement('div');
    el.className = 'notification';
    el.textContent = text;
    el.style.color = color;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.root.appendChild(el);

    this.active.push({ el, startTime: performance.now(), duration: NOTIF_DURATION });
  }

  update(now: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const n = this.active[i];
      const elapsed = now - n.startTime;
      const t = elapsed / n.duration;

      if (t >= 1) {
        n.el.remove();
        this.active.splice(i, 1);
        continue;
      }

      n.el.style.transform = `translateY(${-40 * t}px)`;
      n.el.style.opacity = String(1 - t);
    }
  }
}
