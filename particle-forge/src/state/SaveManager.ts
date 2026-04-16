import { SAVE_KEY } from '../config';
import { GameState, createGameState } from './GameState';
import { ELEMENT_COUNT } from '../data/elements';

const SAVE_VERSION = 1;

interface SaveData {
  v: number;
  s: GameState;
}

export class SaveManager {
  save(state: GameState): void {
    try {
      state.lastSaveTime = Date.now();
      const data: SaveData = { v: SAVE_VERSION, s: state };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // storage full or disabled
    }
  }

  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data: SaveData = JSON.parse(raw);
      if (!data || data.v !== SAVE_VERSION || !data.s) return null;
      return this.migrate(data.s);
    } catch {
      return null;
    }
  }

  export(state: GameState): string {
    return btoa(JSON.stringify({ v: SAVE_VERSION, s: state }));
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  private migrate(s: GameState): GameState {
    const fresh = createGameState();
    while (s.elements.length < ELEMENT_COUNT) s.elements.push(0);
    while (s.totalCreated.length < ELEMENT_COUNT) s.totalCreated.push(0);

    return {
      ...fresh,
      ...s,
      elements: s.elements.slice(0, ELEMENT_COUNT),
      totalCreated: s.totalCreated.slice(0, ELEMENT_COUNT),
      research: s.research ?? {},
    };
  }
}
