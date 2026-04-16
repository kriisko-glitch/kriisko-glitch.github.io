import { GameState } from '../state/GameState';
import { PrestigeSystem } from '../systems/PrestigeSystem';
import { formatNumber } from '../config';

export type PrestigeCallback = () => void;

export class PrestigePanel {
  private backdrop: HTMLElement;
  private panel: HTMLElement;
  private content: HTMLElement;
  private onPrestige: PrestigeCallback;
  private _visible = false;

  get visible(): boolean { return this._visible; }

  constructor(root: HTMLElement, onPrestige: PrestigeCallback) {
    this.onPrestige = onPrestige;

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
    title.style.color = '#cc88ff';
    title.style.textShadow = '0 0 10px rgba(200,100,255,0.6)';
    title.textContent = 'Big Bang';
    this.panel.appendChild(title);

    const close = document.createElement('button');
    close.className = 'close-btn';
    close.textContent = '\u2715';
    close.addEventListener('click', () => this.hide());
    this.panel.appendChild(close);

    this.content = document.createElement('div');
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

    const canPrestige = PrestigeSystem.canPrestige(state);
    const gain = PrestigeSystem.getDarkEnergyGain(state);
    const totalValue = PrestigeSystem.getTotalElementValue(state);
    const minElement = PrestigeSystem.getMinPrestigeElement(state);

    this.content.innerHTML = `
      <p style="margin:12px 0;color:#aabbcc;font-size:13px;">
        Collapse the universe and start anew. All elements and upgrades reset,
        but you keep your <span style="color:#cc88ff">Research</span> and gain
        <span style="color:#cc88ff">Dark Energy</span> for more research.
      </p>
      <div class="mono" style="margin:12px 0;">
        <div style="margin-bottom:4px;">Total Element Value: <span style="color:#ffcc44">${formatNumber(totalValue)}</span></div>
        <div style="margin-bottom:4px;">Dark Energy Gain: <span style="color:#cc88ff">+${formatNumber(gain)} DE</span></div>
        <div style="margin-bottom:4px;">Current DE: <span style="color:#cc88ff">${formatNumber(Math.floor(state.darkEnergy))}</span></div>
        <div style="margin-bottom:4px;">Prestige Count: <span style="color:#ffcc44">${state.prestigeCount}</span></div>
      </div>
      ${!canPrestige ? `<p style="color:#ff6666;font-size:12px;">Requires: Element ${minElement + 1}+ unlocked and element value \u2265 1,000</p>` : ''}
      <button class="btn btn-prestige" ${canPrestige ? '' : 'disabled'} style="margin-top:8px;text-align:center;font-size:15px;padding:12px;">
        \uD83D\uDCA5 BIG BANG \uD83D\uDCA5
      </button>
    `;

    const btn = this.content.querySelector('.btn-prestige') as HTMLButtonElement | null;
    if (btn && canPrestige) {
      btn.addEventListener('click', () => {
        this.onPrestige();
        this.hide();
      });
    }
  }
}
