import { OFFLINE_MAX_MS, OFFLINE_EFFICIENCY, TICK_MS } from '../config';
import { GameState, getResearchLevel } from './GameState';
import { AutomationSystem } from '../systems/AutomationSystem';

export interface OfflineResult {
  elapsedMs: number;
  hGained: number;
  mergesDone: number;
}

export function calculateOfflineProgress(state: GameState): OfflineResult | null {
  const now = Date.now();
  const elapsed = Math.min(now - state.lastSaveTime, OFFLINE_MAX_MS);

  if (elapsed < 60_000) return null;

  const idleBoostLevel = getResearchLevel(state, 'eff_idle_boost');
  const efficiency = OFFLINE_EFFICIENCY * (1 + 0.25 * idleBoostLevel);

  const ticks = Math.floor(elapsed / TICK_MS);
  const dtSec = TICK_MS / 1000;
  let totalHGained = 0;
  let totalMerges = 0;

  const simState = structuredClone(state);

  const maxSimTicks = Math.min(ticks, 5000);
  const tickMultiplier = ticks / maxSimTicks;

  for (let i = 0; i < maxSimTicks; i++) {
    const before = simState.elements[0];
    const beforeMerges = simState.totalMerges;
    AutomationSystem.update(simState, dtSec * tickMultiplier * efficiency);
    totalHGained += (simState.elements[0] - before) + (simState.totalHProduced - (state.totalHProduced + totalHGained));
    totalMerges += simState.totalMerges - beforeMerges;
  }

  const hGained = Math.max(0, simState.totalHProduced - state.totalHProduced);

  Object.assign(state, {
    elements: simState.elements,
    totalCreated: simState.totalCreated,
    highestUnlocked: simState.highestUnlocked,
    totalMerges: simState.totalMerges,
    totalHProduced: simState.totalHProduced,
    lastSaveTime: now,
  });

  return {
    elapsedMs: elapsed,
    hGained,
    mergesDone: totalMerges,
  };
}
