import { ELEMENTS } from '../data/elements';
import { GameState, getResearchLevel } from '../state/GameState';
import { MergeSystem } from './MergeSystem';
import {
  BASE_CLICK_POWER,
  ACCELERATOR_BASE_COST,
  ACCELERATOR_COST_SCALE,
  REACTOR_BASE_COST,
  REACTOR_COST_SCALE,
  CONDENSER_BASE_COST,
  CONDENSER_COST_SCALE,
  QUANTUM_FORGE_BASE_COST,
  QUANTUM_FORGE_COST_SCALE,
  DARK_MATTER_BASE_COST,
  DARK_MATTER_COST_SCALE,
} from '../config';

export type ShopItemKey =
  | 'protonEmitters'
  | 'fusionReactors'
  | 'ionCondensers'
  | 'quantumForges'
  | 'darkMatterInjectors';

export interface ShopItemDef {
  key: ShopItemKey;
  name: string;
  description: string;
  baseCost: number;
  costScale: number;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  { key: 'protonEmitters',      name: 'Proton Emitter',      description: '+1 H/sec',             baseCost: ACCELERATOR_BASE_COST,    costScale: ACCELERATOR_COST_SCALE },
  { key: 'fusionReactors',      name: 'Fusion Reactor',      description: 'Auto-merge H\u2192He', baseCost: REACTOR_BASE_COST,        costScale: REACTOR_COST_SCALE },
  { key: 'ionCondensers',       name: 'Ion Condenser',       description: 'Auto-merge all tiers', baseCost: CONDENSER_BASE_COST,      costScale: CONDENSER_COST_SCALE },
  { key: 'quantumForges',       name: 'Quantum Forge',       description: '2x merge speed',       baseCost: QUANTUM_FORGE_BASE_COST,  costScale: QUANTUM_FORGE_COST_SCALE },
  { key: 'darkMatterInjectors', name: 'Dark Matter Injector',description: '+50% all production',  baseCost: DARK_MATTER_BASE_COST,    costScale: DARK_MATTER_COST_SCALE },
];

export const AutomationSystem = {
  getShopCost(item: ShopItemDef, owned: number): number {
    return Math.floor(item.baseCost * Math.pow(item.costScale, owned));
  },

  canBuy(item: ShopItemDef, state: GameState): boolean {
    const cost = this.getShopCost(item, state[item.key]);
    return state.elements[0] >= cost;
  },

  buy(item: ShopItemDef, state: GameState): boolean {
    const cost = this.getShopCost(item, state[item.key]);
    if (state.elements[0] < cost) return false;
    state.elements[0] -= cost;
    (state[item.key] as number)++;
    return true;
  },

  getClickPower(state: GameState): number {
    const base = BASE_CLICK_POWER;
    const bonusFlat = getResearchLevel(state, 'acc_click_power');
    const multiLevel = getResearchLevel(state, 'acc_click_multi');
    const stormLevel = getResearchLevel(state, 'acc_particle_storm');

    let power = (base + bonusFlat) * Math.pow(2, multiLevel);
    if (stormLevel > 0) power *= 10;
    return power;
  },

  getProductionMultiplier(state: GameState): number {
    const dmBonus = 1 + 0.5 * state.darkMatterInjectors;
    const prestigeBonus = 1 + 0.1 * state.prestigeCount;
    const fusionBoostLevel = getResearchLevel(state, 'react_fusion_boost');
    const fusionBonus = 1 + 0.25 * fusionBoostLevel;
    const synergyLevel = getResearchLevel(state, 'eff_synergy');
    const synergyBonus = 1 + 0.1 * synergyLevel * Math.max(0, state.highestUnlocked);

    return dmBonus * prestigeBonus * fusionBonus * synergyBonus;
  },

  getMergeSpeed(state: GameState): number {
    const base = 1;
    const forgeMulti = Math.pow(2, state.quantumForges);
    const reactorSpeed = 1 + 0.5 * getResearchLevel(state, 'auto_fast_reactor');
    const multiMerge = 1 + getResearchLevel(state, 'auto_multi_merge');
    return base * forgeMulti * reactorSpeed * multiMerge;
  },

  getHPerSec(state: GameState): number {
    const emitterRate = state.protonEmitters;
    const superLevel = getResearchLevel(state, 'acc_super_emitter');
    const emitterMulti = Math.pow(2, superLevel);

    let elementIncome = 0;
    for (let i = 1; i < ELEMENTS.length; i++) {
      elementIncome += state.elements[i] * ELEMENTS[i].passiveHPerSec;
    }

    const autoClickLevel = getResearchLevel(state, 'acc_auto_click');
    const autoClickH = autoClickLevel * this.getClickPower(state);

    return (emitterRate * emitterMulti + elementIncome + autoClickH) * this.getProductionMultiplier(state);
  },

  update(state: GameState, dt: number): void {
    const hps = this.getHPerSec(state);
    const hGain = hps * dt;
    state.elements[0] += hGain;
    state.totalHProduced += hGain;
    state.totalCreated[0] += hGain;

    const mergeSpeed = this.getMergeSpeed(state);
    const reactorMerges = state.fusionReactors * mergeSpeed * dt;
    const condenserMerges = state.ionCondensers * mergeSpeed * dt;

    const smartLevel = getResearchLevel(state, 'auto_smart_cond');
    const condenserMulti = Math.pow(2, smartLevel);
    const hasCascade = getResearchLevel(state, 'auto_cascade') > 0;

    let reactorBudget = reactorMerges;
    while (reactorBudget >= 1 && MergeSystem.canMerge(1, state)) {
      MergeSystem.doMerge(1, state);
      reactorBudget--;
    }

    let condenserBudget = condenserMerges * condenserMulti;
    const maxTier = state.highestUnlocked + 1;
    const passes = hasCascade ? 3 : 1;

    for (let pass = 0; pass < passes; pass++) {
      for (let tier = maxTier; tier >= 1; tier--) {
        while (condenserBudget >= 1 && MergeSystem.canMerge(tier, state)) {
          MergeSystem.doMerge(tier, state);
          condenserBudget--;
        }
      }
    }

    const darkGenLevel = getResearchLevel(state, 'react_dark_gen');
    if (darkGenLevel > 0) {
      state.darkEnergy += 0.01 * darkGenLevel * dt;
      state.totalDarkEnergy += 0.01 * darkGenLevel * dt;
    }
  },
};
