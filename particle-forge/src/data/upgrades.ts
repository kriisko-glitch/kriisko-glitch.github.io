export interface ResearchDef {
  id: string;
  name: string;
  description: string;
  branch: string;
  tier: number;
  maxLevel: number;
  baseCost: number;
  costScale: number;
}

export const BRANCHES = [
  'Acceleration',
  'Automation',
  'Reactions',
  'Efficiency',
  'Prestige',
] as const;

export type BranchName = (typeof BRANCHES)[number];

export const RESEARCH: ResearchDef[] = [
  // Acceleration
  { id: 'acc_click_power',    name: 'Click Power',       description: '+1 H per click',                   branch: 'Acceleration', tier: 0, maxLevel: 10, baseCost: 2,   costScale: 1.8 },
  { id: 'acc_click_multi',    name: 'Click Multiplier',  description: 'x2 click power',                   branch: 'Acceleration', tier: 1, maxLevel: 3,  baseCost: 10,  costScale: 3.0 },
  { id: 'acc_auto_click',     name: 'Auto Click',        description: '+1 auto-click/sec',                branch: 'Acceleration', tier: 2, maxLevel: 5,  baseCost: 25,  costScale: 2.0 },
  { id: 'acc_super_emitter',  name: 'Super Emitter',     description: 'Emitters produce 2x',              branch: 'Acceleration', tier: 3, maxLevel: 3,  baseCost: 75,  costScale: 3.0 },
  { id: 'acc_particle_storm', name: 'Particle Storm',    description: '10x all H production',             branch: 'Acceleration', tier: 4, maxLevel: 1,  baseCost: 500, costScale: 1.0 },

  // Automation
  { id: 'auto_fast_reactor',  name: 'Fast Reactors',     description: '+50% reactor speed',               branch: 'Automation',   tier: 0, maxLevel: 5,  baseCost: 3,   costScale: 1.8 },
  { id: 'auto_multi_merge',   name: 'Multi-merge',       description: 'Reactors merge 2 at once',         branch: 'Automation',   tier: 1, maxLevel: 3,  baseCost: 12,  costScale: 2.5 },
  { id: 'auto_smart_cond',    name: 'Smart Condenser',   description: 'Condensers 2x speed',              branch: 'Automation',   tier: 2, maxLevel: 3,  baseCost: 30,  costScale: 2.5 },
  { id: 'auto_cascade',       name: 'Cascade Merge',     description: 'Auto-merge chains instantly',      branch: 'Automation',   tier: 3, maxLevel: 1,  baseCost: 100, costScale: 1.0 },
  { id: 'auto_quantum_tunnel',name: 'Quantum Tunneling', description: '10% chance double output',         branch: 'Automation',   tier: 4, maxLevel: 5,  baseCost: 250, costScale: 2.0 },

  // Reactions
  { id: 'react_fusion_boost', name: 'Fusion Boost',      description: '+25% element production',          branch: 'Reactions',    tier: 0, maxLevel: 5,  baseCost: 3,   costScale: 1.8 },
  { id: 'react_exotic',       name: 'Exotic Particles',  description: 'Chance of bonus elements',         branch: 'Reactions',    tier: 1, maxLevel: 3,  baseCost: 15,  costScale: 2.5 },
  { id: 'react_dark_gen',     name: 'Dark Matter Gen',   description: 'Passive Dark Energy gain',         branch: 'Reactions',    tier: 2, maxLevel: 3,  baseCost: 50,  costScale: 2.5 },
  { id: 'react_antimatter',   name: 'Antimatter Burst',  description: 'Occasional 5x production surge',   branch: 'Reactions',    tier: 3, maxLevel: 3,  baseCost: 120, costScale: 2.5 },
  { id: 'react_stellar_core', name: 'Stellar Core',      description: 'Fe produces massive energy',       branch: 'Reactions',    tier: 4, maxLevel: 1,  baseCost: 300, costScale: 1.0 },

  // Efficiency
  { id: 'eff_cost_reduce',    name: 'Cost Reduction',    description: '-10% merge costs',                 branch: 'Efficiency',   tier: 0, maxLevel: 5,  baseCost: 2,   costScale: 1.8 },
  { id: 'eff_idle_boost',     name: 'Idle Boost',        description: '+25% offline gains',               branch: 'Efficiency',   tier: 1, maxLevel: 5,  baseCost: 8,   costScale: 2.0 },
  { id: 'eff_synergy',        name: 'Element Synergy',   description: 'Elements boost each other +10%',   branch: 'Efficiency',   tier: 2, maxLevel: 5,  baseCost: 35,  costScale: 2.0 },
  { id: 'eff_bulk_buy',       name: 'Bulk Buy',          description: 'Hold Shift to buy 10x at -5%',     branch: 'Efficiency',   tier: 3, maxLevel: 1,  baseCost: 80,  costScale: 1.0 },
  { id: 'eff_conservation',   name: 'Conservation',      description: '15% chance merge is free',         branch: 'Efficiency',   tier: 4, maxLevel: 5,  baseCost: 200, costScale: 2.0 },

  // Prestige
  { id: 'pres_early',         name: 'Early Bang',        description: 'Prestige from element 5+',         branch: 'Prestige',     tier: 0, maxLevel: 1,  baseCost: 5,   costScale: 1.0 },
  { id: 'pres_more_de',       name: 'Dark Harvest',      description: '+50% Dark Energy per prestige',    branch: 'Prestige',     tier: 1, maxLevel: 5,  baseCost: 15,  costScale: 2.0 },
  { id: 'pres_start_h',       name: 'Head Start',        description: 'Start with 100 H on prestige',    branch: 'Prestige',     tier: 2, maxLevel: 5,  baseCost: 40,  costScale: 2.0 },
  { id: 'pres_keep_elements', name: 'Element Memory',    description: 'Keep 10% of elements',            branch: 'Prestige',     tier: 3, maxLevel: 3,  baseCost: 100, costScale: 2.5 },
  { id: 'pres_auto',          name: 'Eternal Cycle',     description: 'Auto-prestige when optimal',      branch: 'Prestige',     tier: 4, maxLevel: 1,  baseCost: 500, costScale: 1.0 },
];

export function getResearchByBranch(branch: string): ResearchDef[] {
  return RESEARCH.filter(r => r.branch === branch);
}

export function getResearchCost(def: ResearchDef, currentLevel: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costScale, currentLevel));
}
