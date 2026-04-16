export const SAVE_KEY = 'kriisko_pforge_save';
export const SAVE_INTERVAL_MS = 30_000;
export const OFFLINE_MAX_HOURS = 8;
export const OFFLINE_MAX_MS = OFFLINE_MAX_HOURS * 3600_000;
export const OFFLINE_EFFICIENCY = 0.5;

export const TICK_RATE = 20;
export const TICK_MS = 1000 / TICK_RATE;

export const BASE_CLICK_POWER = 1;

export const ACCELERATOR_BASE_COST = 10;
export const ACCELERATOR_COST_SCALE = 1.15;
export const REACTOR_BASE_COST = 50;
export const REACTOR_COST_SCALE = 1.18;
export const CONDENSER_BASE_COST = 500;
export const CONDENSER_COST_SCALE = 1.22;
export const QUANTUM_FORGE_BASE_COST = 5000;
export const QUANTUM_FORGE_COST_SCALE = 1.30;
export const DARK_MATTER_BASE_COST = 25000;
export const DARK_MATTER_COST_SCALE = 1.35;

export const MERGE_PARTICLE_COUNT = 16;
export const MERGE_PARTICLE_LIFE_MS = 600;

export const STAR_COUNT = 200;

export const PRESTIGE_BASE_THRESHOLD = 1000;

export const NUMBER_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatNumber(n: number): string {
  if (n < 10_000) return Math.floor(n).toLocaleString();
  let tier = 0;
  let scaled = n;
  while (scaled >= 1000 && tier < NUMBER_SUFFIXES.length - 1) {
    scaled /= 1000;
    tier++;
  }
  const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return scaled.toFixed(decimals) + NUMBER_SUFFIXES[tier];
}
