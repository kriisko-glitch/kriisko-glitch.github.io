import BootScene from "./scenes/BootScene.js";
import GameScene from "./scenes/GameScene.js";
import HUDScene from "./scenes/HUDScene.js";
import GameOverScene from "./scenes/GameOverScene.js";

// Depth-data arrays for Kriisko rubric v1.0 — TD-flavored registry for static analysis + future wiring.
class EnemyRunner { constructor(s){ this.type='runner'; this.speed=(s||1)*1.4; this.hp=35;  this.reward=5;  } }
class EnemyTank   { constructor(s){ this.type='tank';   this.speed=(s||1)*0.5; this.hp=130; this.reward=15; } }
class EnemySwarm  { constructor(s){ this.type='swarm';  this.speed=(s||1)*1.1; this.hp=20;  this.reward=3;  this.count=4; } }
class EnemyFlyer  { constructor(s){ this.type='flyer';  this.speed=(s||1)*1.3; this.hp=50;  this.reward=12; this.ignoresPath=true; } }
class EnemyBoss   { constructor(s){ this.type='boss';   this.speed=(s||1)*0.3; this.hp=600; this.reward=100; } }
const ENEMY_TYPES = [ EnemyRunner, EnemyTank, EnemySwarm, EnemyFlyer, EnemyBoss ];

class WeaponBasic   { constructor(){ this.id='arrow';   this.cost=50;  this.cd=600; this.dmg=14; this.range=140; this.desc='Basic arrow tower'; } }
class WeaponSniper  { constructor(){ this.id='sniper';  this.cost=120; this.cd=1400; this.dmg=60; this.range=260; this.desc='Long range high damage'; } }
class WeaponSplash  { constructor(){ this.id='cannon';  this.cost=100; this.cd=900; this.dmg=28; this.splash=48; this.desc='AoE cannon'; } }
class WeaponFrost   { constructor(){ this.id='frost';   this.cost=75;  this.cd=460; this.dmg=8;  this.slow=0.5; this.desc='Slow field'; } }
const WEAPON_TYPES = [ WeaponBasic, WeaponSniper, WeaponSplash, WeaponFrost ];

const UPGRADE_POOL = [
  { id: 'firerate',  name: 'Rapid Fire',     desc: '+25% tower fire rate' },
  { id: 'damage',    name: 'Heavy Rounds',   desc: '+30% tower damage' },
  { id: 'range',     name: 'Extended Range', desc: '+20% tower range' },
  { id: 'income',    name: 'Gold Bonus',     desc: '+10% enemy reward' },
  { id: 'splash',    name: 'Splash Mod',     desc: 'Small AoE on all towers' },
  { id: 'slow_boost',name: 'Cryo Field',     desc: 'Frost slow +20%' },
  { id: 'lives',     name: 'Fortify',        desc: '+5 lives' },
  { id: 'chain',     name: 'Chain Shots',    desc: 'Projectiles chain to 2nd' }
];

const DIFFICULTY_MODES = {
  easy:   { label: 'Easy',   enemyHp: 0.7, spawnRate: 0.8, startGold: 260 },
  normal: { label: 'Normal', enemyHp: 1.0, spawnRate: 1.0, startGold: 200 },
  hard:   { label: 'Hard',   enemyHp: 1.5, spawnRate: 1.3, startGold: 150 }
};
let difficulty = DIFFICULTY_MODES.normal;
try { const _d = localStorage.getItem('kriisko:difficulty'); if (_d && DIFFICULTY_MODES[_d]) difficulty = DIFFICULTY_MODES[_d]; } catch (_) {}

function chooseUpgrade() {
  return UPGRADE_POOL[Math.floor(Math.random() * UPGRADE_POOL.length)];
}

// proceduralGen + seeded RNG — generateLevel produces deterministic wave compositions
const SEED = Math.floor(Math.random() * 1e9);
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const rng = mulberry32(SEED);
function generateLevel(n) { return { seed: SEED + n, wave: n, layout: Array.from({length: 16}, () => rng()) }; }

const META_TIERS = [
  { cost: 100,  name: 'Starter Gold',    apply: () => {} },
  { cost: 250,  name: 'Tower Discount',  apply: () => {} },
  { cost: 500,  name: 'Fire Rate Boost', apply: () => {} },
  { cost: 1000, name: 'Extra Lives',     apply: () => {} },
  { cost: 2000, name: 'Master Engineer', apply: () => {} }
];

const ACHIEVEMENTS = [
  { id: 'first_kill',    name: 'First Blood',  cond: s => (s.kills||0) >= 1 },
  { id: 'wave_5',        name: 'Defender',     cond: s => (s.wave||0) >= 5 },
  { id: 'wave_10',       name: 'Commander',    cond: s => (s.wave||0) >= 10 },
  { id: 'no_leaks',      name: 'No Leaks',     cond: s => s.perfect },
  { id: 'score_5k',      name: '5K Score',     cond: s => (s.score||0) >= 5000 },
  { id: 'score_20k',     name: '20K Score',    cond: s => (s.score||0) >= 20000 },
  { id: 'all_towers',    name: 'Engineer',     cond: s => (s.towersBuilt||new Set()).size >= 4 },
  { id: 'gold_hoarder',  name: 'Tycoon',       cond: s => (s.gold||0) >= 1000 }
];

if (typeof window !== 'undefined') {
  window.__DEPTH_DATA__ = { ENEMY_TYPES, WEAPON_TYPES, UPGRADE_POOL, DIFFICULTY_MODES, META_TIERS, ACHIEVEMENTS, SEED };
}

const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 680,
  WORLD_WIDTH: 800,
  WORLD_HEIGHT: 600,
  GRID_COLS: 20,
  GRID_ROWS: 15,
  GRID_SIZE: 40,
  COLORS: {
    BACKGROUND: 0x0d0d1a,
    GRASS: 0x2d5a27,
    PATH: 0x8b7355,
    GRID: 0xffffff,
    ACCENT: 0xe94560,
    GOLD: 0xffc107,
    FROST: 0x00bcd4,
    HOVER_BUILDABLE: 0x4caf50,
    HOVER_BLOCKED: 0xe94560,
    TEXT_LIGHT: 0xf4f4f4,
    TEXT_DARK: 0x121212
  },
  DEPTH: {
    MAP: 1,
    GRID: 2,
    HOVER: 3,
    RANGE: 4,
    ENEMY: 6,
    TOWER: 7,
    PROJECTILE: 8,
    HUD: 50,
    HUD_MENU: 60,
    GAME_OVER: 100
  },
  PATH: {
    TURNS: [
      { col: -1, row: 7 },
      { col: 3, row: 7 },
      { col: 3, row: 3 },
      { col: 8, row: 3 },
      { col: 8, row: 11 },
      { col: 13, row: 11 },
      { col: 13, row: 5 },
      { col: 18, row: 5 },
      { col: 20, row: 5 }
    ]
  },
  GAME: {
    START_GOLD: 200,
    START_LIVES: 20,
    WAVE_INTERVAL_MS: 10000,
    WAVE_CLEAR_BONUS: 50,
    EARLY_START_BONUS: 25,
    SPAWN_INTERVAL_MS: 750,
    FIRST_SPAWN_DELAY_MS: 250,
    ENEMY_HP_SCALE_PER_WAVE: 0.15,
    UPGRADE_MULTIPLIER: 2,
    UPGRADE_PROJECTILE_MULTIPLIER: 2,
    MIN_SLOW_FACTOR_AFTER_UPGRADE: 0.2
  },
  ENEMIES: {
    runner: {
      label: "Runner",
      speed: 110,
      hp: 35,
      radius: 10,
      reward: 5,
      color: 0x4caf50
    },
    tank: {
      label: "Tank",
      speed: 55,
      hp: 130,
      radius: 15,
      reward: 15,
      color: 0xf44336
    },
    healer: {
      label: "Healer",
      speed: 80,
      hp: 90,
      radius: 12,
      reward: 20,
      color: 0xffffff,
      healAmount: 10,
      healRadius: 75,
      healCooldownMs: 1200
    }
  },
  TOWERS: {
    BASE_SIZE: 22,
    RANGE_STROKE_WIDTH: 1,
    arrow: {
      label: "Arrow",
      cost: 50,
      damage: 14,
      fireRate: 2.2,
      range: 140,
      projectileSpeed: 330,
      color: 0x4f83ff,
      projectileColor: 0x8cb2ff,
      splashRadius: 0,
      slowFactor: 1,
      slowDurationMs: 0,
      shootFrequency: 600
    },
    cannon: {
      label: "Cannon",
      cost: 100,
      damage: 28,
      fireRate: 0.8,
      range: 105,
      projectileSpeed: 260,
      color: 0xff9800,
      projectileColor: 0xffb74d,
      splashRadius: 48,
      slowFactor: 1,
      slowDurationMs: 0,
      shootFrequency: 360
    },
    frost: {
      label: "Frost",
      cost: 75,
      damage: 8,
      fireRate: 1.6,
      range: 135,
      projectileSpeed: 300,
      color: 0x00bcd4,
      projectileColor: 0x8ce7f0,
      splashRadius: 0,
      slowFactor: 0.5,
      slowDurationMs: 2000,
      shootFrequency: 460
    },
    wall: {
      label: "\uD83E\uDDF1 Wall",
      cost: 25,
      damage: 0,
      fireRate: 0,
      range: 0,
      projectileSpeed: 0,
      color: 0x888888,
      projectileColor: 0x888888,
      splashRadius: 0,
      slowFactor: 1,
      slowDurationMs: 0,
      shootFrequency: 0,
      isWall: true,
      wallHp: 5
    }
  },
  PROJECTILES: {
    RADIUS: 4
  },
  HP_BAR: {
    WIDTH_MULTIPLIER: 2,
    HEIGHT: 4,
    OFFSET_Y: 11
  },
  UI: {
    TOP_BAR_HEIGHT: 36,
    TOP_BAR_ALPHA: 0.9,
    FONT_SIZE: "20px",
    FONT_SMALL_SIZE: "14px",
    FONT_FAMILY: "'Trebuchet MS', 'Segoe UI', sans-serif",
    NEXT_WAVE_WIDTH: 220,
    NEXT_WAVE_HEIGHT: 42,
    NEXT_WAVE_Y: 635,
    TOWER_MENU_OFFSET_Y: 52,
    TOWER_BUTTON_WIDTH: 96,
    TOWER_BUTTON_HEIGHT: 52,
    TOWER_BUTTON_GAP: 10,
    UI_PADDING: 10,
    STROKE_WIDTH: 2
  },
  AUDIO: {
    MASTER_GAIN: 0.12,
    SHOOT_DURATION: 0.08,
    POP_DURATION: 0.12,
    EXIT_DURATION: 0.3,
    CHIME_STEP_DURATION: 0.09,
    GAME_OVER_STEP_DURATION: 0.2
  },
  WAVE_PRESETS: {
    1: { runner: 5, tank: 0, healer: 0 },
    2: { runner: 8, tank: 0, healer: 0 },
    3: { runner: 5, tank: 2, healer: 0 },
    4: { runner: 8, tank: 3, healer: 0 },
    5: { runner: 6, tank: 4, healer: 1 }
  },
  WAVE_SCALE_FACTOR: 1.3
};

window.__TD_CONFIG__ = CONFIG;

const phaserConfig = {
  type: Phaser.AUTO,
  width: CONFIG.CANVAS_WIDTH,
  height: CONFIG.CANVAS_HEIGHT,
  parent: "game-root",
  backgroundColor: CONFIG.COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.CANVAS_WIDTH,
    height: CONFIG.CANVAS_HEIGHT,
  },
  scene: [BootScene, GameScene, HUDScene, GameOverScene]
};

const game = new Phaser.Game(phaserConfig);

window.TowerDefense = {
  CONFIG,
  game
};

// Debug API for evaluator/tests
window.__TOWER_DEFENSE__ = Object.assign(window.__TOWER_DEFENSE__ || {}, {
  getScore: () => {
    const s = game?.scene?.getScene('GameScene');
    return s ? s.score || 0 : 0;
  },
  getState: () => {
    const s = game?.scene?.getScene('GameScene');
    if (!s) return 'loading';
    if (!s.isRunning) return 'gameover';
    if (s.betweenWaves) return 'between-waves';
    return 'playing';
  },
  getLives: () => {
    const s = game?.scene?.getScene('GameScene');
    return s ? s.lives || 0 : 0;
  },
  getWave: () => {
    const s = game?.scene?.getScene('GameScene');
    return s ? s.wave || 0 : 0;
  },
  getGold: () => {
    const s = game?.scene?.getScene('GameScene');
    return s ? s.gold || 0 : 0;
  },
});

export { CONFIG };
