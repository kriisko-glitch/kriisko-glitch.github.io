import { ELEMENTS } from '../data/elements';
import { PRESTIGE_BASE_THRESHOLD } from '../config';
import { GameState, getResearchLevel, createGameState } from '../state/GameState';

export const PrestigeSystem = {
  getTotalElementValue(state: GameState): number {
    let total = 0;
    for (let i = 0; i < ELEMENTS.length; i++) {
      total += state.totalCreated[i] * Math.pow(ELEMENTS[i].atomicNumber, 2);
    }
    return total;
  },

  getMinPrestigeElement(state: GameState): number {
    const earlyLevel = getResearchLevel(state, 'pres_early');
    return earlyLevel > 0 ? 4 : 9;
  },

  canPrestige(state: GameState): boolean {
    const minElement = this.getMinPrestigeElement(state);
    if (state.highestUnlocked < minElement) return false;

    const value = this.getTotalElementValue(state);
    return value >= PRESTIGE_BASE_THRESHOLD;
  },

  getDarkEnergyGain(state: GameState): number {
    const value = this.getTotalElementValue(state);
    let gain = Math.floor(Math.sqrt(value / 10));
    const harvestLevel = getResearchLevel(state, 'pres_more_de');
    gain = Math.floor(gain * (1 + 0.5 * harvestLevel));
    return Math.max(0, gain);
  },

  doPrestige(state: GameState): GameState {
    const gain = this.getDarkEnergyGain(state);
    const keepFraction = 0.1 * getResearchLevel(state, 'pres_keep_elements');
    const startHLevel = getResearchLevel(state, 'pres_start_h');

    const fresh = createGameState();

    fresh.research = { ...state.research };
    fresh.darkEnergy = state.darkEnergy + gain;
    fresh.totalDarkEnergy = state.totalDarkEnergy + gain;
    fresh.prestigeCount = state.prestigeCount + 1;
    fresh.startTime = state.startTime;

    if (keepFraction > 0) {
      for (let i = 0; i < ELEMENTS.length; i++) {
        fresh.elements[i] = Math.floor(state.elements[i] * keepFraction);
        if (fresh.elements[i] > 0 && i > fresh.highestUnlocked) {
          fresh.highestUnlocked = i;
        }
      }
    }

    if (startHLevel > 0) {
      fresh.elements[0] += 100 * startHLevel;
      fresh.totalCreated[0] += 100 * startHLevel;
    }

    return fresh;
  },
};
