import { RESEARCH, ResearchDef, getResearchCost, getResearchByBranch } from '../data/upgrades';
import { GameState, getResearchLevel } from '../state/GameState';

export const ResearchSystem = {
  canResearch(def: ResearchDef, state: GameState): boolean {
    const currentLevel = getResearchLevel(state, def.id);
    if (currentLevel >= def.maxLevel) return false;

    const cost = getResearchCost(def, currentLevel);
    if (state.darkEnergy < cost) return false;

    const branchUpgrades = getResearchByBranch(def.branch);
    for (const req of branchUpgrades) {
      if (req.tier < def.tier) {
        const reqLevel = getResearchLevel(state, req.id);
        if (reqLevel < 1) return false;
      }
    }

    return true;
  },

  doResearch(def: ResearchDef, state: GameState): boolean {
    if (!this.canResearch(def, state)) return false;

    const currentLevel = getResearchLevel(state, def.id);
    const cost = getResearchCost(def, currentLevel);
    state.darkEnergy -= cost;
    state.research[def.id] = currentLevel + 1;
    return true;
  },

  isMaxed(def: ResearchDef, state: GameState): boolean {
    return getResearchLevel(state, def.id) >= def.maxLevel;
  },

  isLocked(def: ResearchDef, state: GameState): boolean {
    const branchUpgrades = getResearchByBranch(def.branch);
    for (const req of branchUpgrades) {
      if (req.tier < def.tier && getResearchLevel(state, req.id) < 1) {
        return true;
      }
    }
    return false;
  },

  getAllResearch(): ResearchDef[] {
    return RESEARCH;
  },
};
