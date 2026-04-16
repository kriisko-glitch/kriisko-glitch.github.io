import { ELEMENT_COUNT } from '../data/elements';

export interface GameState {
  elements: number[];
  totalCreated: number[];
  highestUnlocked: number;

  protonEmitters: number;
  fusionReactors: number;
  ionCondensers: number;
  quantumForges: number;
  darkMatterInjectors: number;

  research: Record<string, number>;

  prestigeCount: number;
  darkEnergy: number;
  totalDarkEnergy: number;

  totalClicks: number;
  totalMerges: number;
  totalHProduced: number;

  lastSaveTime: number;
  startTime: number;
}

export function createGameState(): GameState {
  return {
    elements: new Array(ELEMENT_COUNT).fill(0),
    totalCreated: new Array(ELEMENT_COUNT).fill(0),
    highestUnlocked: 0,

    protonEmitters: 0,
    fusionReactors: 0,
    ionCondensers: 0,
    quantumForges: 0,
    darkMatterInjectors: 0,

    research: {},

    prestigeCount: 0,
    darkEnergy: 0,
    totalDarkEnergy: 0,

    totalClicks: 0,
    totalMerges: 0,
    totalHProduced: 0,

    lastSaveTime: Date.now(),
    startTime: Date.now(),
  };
}

export function getResearchLevel(state: GameState, id: string): number {
  return state.research[id] ?? 0;
}
