import { GameState } from '../state/GameState';
import { AutomationSystem, SHOP_ITEMS, ShopItemDef } from '../systems/AutomationSystem';
import { formatNumber } from '../config';

export type BuyCallback = (item: ShopItemDef) => void;
export type PanelToggle = (panel: 'research' | 'prestige') => void;

export class ShopPanel {
  private container: HTMLElement;
  private itemEls: HTMLButtonElement[] = [];
  private onBuy: BuyCallback;
  private onToggle: PanelToggle;

  constructor(container: HTMLElement, onBuy: BuyCallback, onToggle: PanelToggle) {
    this.container = container;
    this.onBuy = onBuy;
    this.onToggle = onToggle;
    this.buildStatic();
  }

  private buildStatic(): void {
    this.container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'Particle Shop';
    this.container.appendChild(title);

    this.itemEls = [];
    for (const item of SHOP_ITEMS) {
      const wrap = document.createElement('div');
      wrap.className = 'shop-item';

      const btn = document.createElement('button') as HTMLButtonElement;
      btn.className = 'btn';
      btn.dataset.key = item.key;
      btn.addEventListener('click', () => this.onBuy(item));

      wrap.appendChild(btn);
      this.container.appendChild(wrap);
      this.itemEls.push(btn);
    }

    const spacer = document.createElement('div');
    spacer.style.height = '8px';
    this.container.appendChild(spacer);

    const researchBtn = document.createElement('button');
    researchBtn.className = 'btn btn-accent';
    researchBtn.innerHTML = '<strong>Research</strong> <span style="float:right;opacity:0.6">[R]</span>';
    researchBtn.addEventListener('click', () => this.onToggle('research'));
    this.container.appendChild(researchBtn);

    const spacer2 = document.createElement('div');
    spacer2.style.height = '6px';
    this.container.appendChild(spacer2);

    const prestigeBtn = document.createElement('button');
    prestigeBtn.className = 'btn btn-prestige';
    prestigeBtn.innerHTML = '<strong>Big Bang</strong> <span style="float:right;opacity:0.6">[P]</span>';
    prestigeBtn.addEventListener('click', () => this.onToggle('prestige'));
    this.container.appendChild(prestigeBtn);
  }

  update(state: GameState): void {
    for (let i = 0; i < SHOP_ITEMS.length; i++) {
      const item = SHOP_ITEMS[i];
      const btn = this.itemEls[i];
      const owned = state[item.key] as number;
      const cost = AutomationSystem.getShopCost(item, owned);
      const canAfford = state.elements[0] >= cost;

      btn.disabled = !canAfford;
      btn.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>${item.name}</span>
          <span class="mono" style="font-size:11px">x${owned}</span>
        </div>
        <div class="desc">${item.description}</div>
        <div class="cost mono">${formatNumber(cost)} H</div>
      `;
    }
  }
}
