import { ELEMENTS } from '../data/elements';
import { GameState, getResearchLevel } from '../state/GameState';

export const MergeSystem = {
  getEffectiveMergeCost(elementIndex: number, state: GameState): number {
    const base = ELEMENTS[elementIndex].mergeCost;
    const reduction = getResearchLevel(state, 'eff_cost_reduce');
    return Math.max(1, Math.floor(base * Math.pow(0.9, reduction)));
  },

  canMerge(elementIndex: number, state: GameState): boolean {
    if (elementIndex <= 0 || elementIndex >= ELEMENTS.length) return false;
    if (elementIndex > state.highestUnlocked + 1) return false;
    const cost = this.getEffectiveMergeCost(elementIndex, state);
    return state.elements[elementIndex - 1] >= cost;
  },

  doMerge(elementIndex: number, state: GameState): boolean {
    if (!this.canMerge(elementIndex, state)) return false;

    const cost = this.getEffectiveMergeCost(elementIndex, state);
    const conservationLevel = getResearchLevel(state, 'eff_conservation');
    const free = Math.random() < 0.15 * conservationLevel;

    if (!free) {
      state.elements[elementIndex - 1] -= cost;
    }

    let amount = 1;
    const tunnelLevel = getResearchLevel(state, 'auto_quantum_tunnel');
    if (tunnelLevel > 0 && Math.random() < 0.1 * tunnelLevel) {
      amount = 2;
    }

    const exoticLevel = getResearchLevel(state, 'react_exotic');
    if (exoticLevel > 0 && Math.random() < 0.05 * exoticLevel) {
      amount += 1;
    }

    state.elements[elementIndex] += amount;
    state.totalCreated[elementIndex] += amount;
    state.totalMerges++;

    if (elementIndex > state.highestUnlocked) {
      state.highestUnlocked = elementIndex;
    }

    return true;
  },
};
