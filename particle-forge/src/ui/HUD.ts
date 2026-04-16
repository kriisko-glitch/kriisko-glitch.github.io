import { ELEMENTS } from '../data/elements';
import { GameState } from '../state/GameState';
import { MergeSystem } from '../systems/MergeSystem';
import { AutomationSystem } from '../systems/AutomationSystem';
import { formatNumber } from '../config';

export type MergeCallback = (elementIndex: number) => void;

export class HUD {
  private container: HTMLElement;
  private rows: HTMLElement[] = [];
  private onMerge: MergeCallback;
  private rateEl: HTMLElement | null = null;
  private statsEl: HTMLElement | null = null;

  constructor(container: HTMLElement, onMerge: MergeCallback) {
    this.container = container;
    this.onMerge = onMerge;
    this.buildStatic();
  }

  private buildStatic(): void {
    this.container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Elements';
    this.container.appendChild(title);

    this.rateEl = document.createElement('div');
    this.rateEl.className = 'mono';
    this.rateEl.style.cssText = 'font-size:12px;color:#00ffc8;margin-bottom:8px;';
    this.container.appendChild(this.rateEl);

    const list = document.createElement('div');
    list.id = 'element-list';
    this.container.appendChild(list);

    this.rows = [];
    for (let i = 0; i < ELEMENTS.length; i++) {
      const row = document.createElement('div');
      row.className = 'element-row';
      row.style.display = 'none';
      row.dataset.idx = String(i);

      const orb = document.createElement('div');
      orb.className = 'element-orb';
      orb.style.background = ELEMENTS[i].color;
      orb.style.boxShadow = `0 0 8px ${ELEMENTS[i].glowColor}`;
      orb.textContent = ELEMENTS[i].symbol;

      const info = document.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `<span class="elem-count mono">0</span><span class="elem-rate" style="color:#8899bb;font-size:11px;margin-left:4px"></span>`;

      row.appendChild(orb);
      row.appendChild(info);

      if (i > 0) {
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'btn';
        mergeBtn.style.cssText = 'width:auto;padding:2px 8px;font-size:11px;flex-shrink:0;';
        mergeBtn.textContent = `\u25B6`;
        mergeBtn.title = `Merge ${ELEMENTS[i - 1].symbol} \u2192 ${ELEMENTS[i].symbol}`;
        mergeBtn.addEventListener('click', () => this.onMerge(i));
        row.appendChild(mergeBtn);
      }

      list.appendChild(row);
      this.rows.push(row);
    }

    this.statsEl = document.createElement('div');
    this.statsEl.style.cssText = 'margin-top:8px;font-size:11px;color:#6688aa;border-top:1px solid rgba(0,200,255,0.15);padding-top:6px;';
    this.container.appendChild(this.statsEl);
  }

  update(state: GameState): void {
    const hps = AutomationSystem.getHPerSec(state);
    if (this.rateEl) {
      this.rateEl.textContent = `${formatNumber(hps)} H/sec`;
    }

    for (let i = 0; i < ELEMENTS.length; i++) {
      const row = this.rows[i];
      const visible = i <= state.highestUnlocked + 1 && i < ELEMENTS.length;
      row.style.display = visible ? 'flex' : 'none';

      if (!visible) continue;

      const countEl = row.querySelector('.elem-count') as HTMLElement;
      countEl.textContent = formatNumber(state.elements[i]);

      if (i > 0) {
        const rateEl = row.querySelector('.elem-rate') as HTMLElement;
        const income = ELEMENTS[i].passiveHPerSec * state.elements[i];
        rateEl.textContent = income > 0 ? `(+${formatNumber(income)}/s)` : '';

        const btn = row.querySelector('.btn') as HTMLButtonElement | null;
        if (btn) {
          const cost = MergeSystem.getEffectiveMergeCost(i, state);
          btn.textContent = `${cost} ${ELEMENTS[i - 1].symbol} \u25B6`;
          btn.disabled = !MergeSystem.canMerge(i, state);
        }
      }
    }

    if (this.statsEl) {
      this.statsEl.innerHTML = `Merges: ${formatNumber(state.totalMerges)}<br>Prestige: ${state.prestigeCount}`;
      if (state.darkEnergy > 0 || state.totalDarkEnergy > 0) {
        this.statsEl.innerHTML += `<br>Dark Energy: ${formatNumber(Math.floor(state.darkEnergy))}`;
      }
    }
  }
}
