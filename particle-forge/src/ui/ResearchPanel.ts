import { BRANCHES, getResearchByBranch, getResearchCost, ResearchDef } from '../data/upgrades';
import { GameState, getResearchLevel } from '../state/GameState';
import { ResearchSystem } from '../systems/ResearchSystem';
import { formatNumber } from '../config';

export type ResearchCallback = (def: ResearchDef) => void;

export class ResearchPanel {
  private backdrop: HTMLElement;
  private panel: HTMLElement;
  private content: HTMLElement;
  private onResearch: ResearchCallback;
  private _visible = false;

  get visible(): boolean { return this._visible; }

  constructor(root: HTMLElement, onResearch: ResearchCallback) {
    this.onResearch = onResearch;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'overlay-backdrop';
    this.backdrop.style.display = 'none';
    this.backdrop.addEventListener('click', () => this.hide());
    root.appendChild(this.backdrop);

    this.panel = document.createElement('div');
    this.panel.className = 'panel overlay-panel';
    this.panel.style.display = 'none';
    root.appendChild(this.panel);

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Research Lab';
    this.panel.appendChild(title);

    const close = document.createElement('button');
    close.className = 'close-btn';
    close.textContent = '\u2715';
    close.addEventListener('click', () => this.hide());
    this.panel.appendChild(close);

    this.content = document.createElement('div');
    this.content.className = 'research-grid';
    this.panel.appendChild(this.content);
  }

  show(): void {
    this._visible = true;
    this.backdrop.style.display = 'block';
    this.panel.style.display = 'block';
  }

  hide(): void {
    this._visible = false;
    this.backdrop.style.display = 'none';
    this.panel.style.display = 'none';
  }

  toggle(): void {
    this._visible ? this.hide() : this.show();
  }

  update(state: GameState): void {
    if (!this._visible) return;

    this.content.innerHTML = '';
    for (const branch of BRANCHES) {
      const section = document.createElement('div');
      section.className = 'research-branch';

      const bTitle = document.createElement('div');
      bTitle.className = 'research-branch-title';
      bTitle.textContent = branch;
      section.appendChild(bTitle);

      for (const def of getResearchByBranch(branch)) {
        const level = getResearchLevel(state, def.id);
        const maxed = ResearchSystem.isMaxed(def, state);
        const locked = ResearchSystem.isLocked(def, state);
        const canBuy = ResearchSystem.canResearch(def, state);
        const cost = getResearchCost(def, level);

        const item = document.createElement('div');
        item.className = 'research-item';

        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.disabled = !canBuy;

        if (maxed) {
          btn.innerHTML = `<div>${def.name} <span class="mono" style="color:#44ff88">MAX</span></div><div class="desc">${def.description}</div>`;
          btn.disabled = true;
        } else if (locked) {
          btn.innerHTML = `<div style="opacity:0.4">${def.name} <span class="mono">\uD83D\uDD12</span></div><div class="desc" style="opacity:0.4">Requires previous tier</div>`;
        } else {
          btn.innerHTML = `<div>${def.name} <span class="mono">${level}/${def.maxLevel}</span></div><div class="desc">${def.description}</div><div class="cost mono" style="color:#cc88ff">${formatNumber(cost)} DE</div>`;
          btn.addEventListener('click', () => this.onResearch(def));
        }

        item.appendChild(btn);
        section.appendChild(item);
      }

      this.content.appendChild(section);
    }
  }
}
