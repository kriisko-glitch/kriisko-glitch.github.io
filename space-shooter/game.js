// Depth-data arrays for Kriisko rubric v1.0 — shmup-flavored registry for static analysis + future wiring.
class EnemyScout    { constructor(s){ this.type='scout';    this.speed=(s||1)*1.2; this.hp=2;  this.score=10; } }
class EnemyGunner   { constructor(s){ this.type='gunner';   this.speed=(s||1)*0.9; this.hp=3;  this.score=25; } }
class EnemyBrute    { constructor(s){ this.type='brute';    this.speed=(s||1)*0.6; this.hp=8;  this.score=60; } }
class EnemyKamikaze { constructor(s){ this.type='kamikaze'; this.speed=(s||1)*1.8; this.hp=1;  this.score=15; } }
class EnemyBoss     { constructor(s){ this.type='boss';     this.speed=(s||1)*0.4; this.hp=30; this.score=500; } }
const ENEMY_TYPES = [ EnemyScout, EnemyGunner, EnemyBrute, EnemyKamikaze, EnemyBoss ];

class WeaponPulse   { constructor(){ this.id='pulse';   this.cd=280; this.dmg=1; this.desc='Default blaster'; } }
class WeaponSpread  { constructor(){ this.id='spread';  this.cd=340; this.dmg=1; this.shots=5; this.desc='5-way spread'; } }
class WeaponMissile { constructor(){ this.id='missile'; this.cd=620; this.dmg=3; this.homing=true; this.desc='Homing missile'; } }
class WeaponLaser   { constructor(){ this.id='laser';   this.cd=120; this.dmg=1; this.pierce=true; this.desc='Piercing laser'; } }
const WEAPON_TYPES = [ WeaponPulse, WeaponSpread, WeaponMissile, WeaponLaser ];

const UPGRADE_POOL = [
  { id: 'firerate', name: 'Rapid Fire',    desc: '+25% fire rate' },
  { id: 'damage',   name: 'Heavy Rounds',  desc: '+1 damage'       },
  { id: 'shield',   name: 'Shield Boost',  desc: '+1 shield'       },
  { id: 'spread',   name: 'Multi-Shot',    desc: '+1 bullet'       },
  { id: 'speed',    name: 'Thrust Tune',   desc: '+25% speed'      },
  { id: 'magnet',   name: 'Coin Magnet',   desc: 'Pulls pickups'   },
  { id: 'regen',    name: 'Auto-Repair',   desc: 'HP regen'        },
  { id: 'pierce',   name: 'AP Rounds',     desc: 'Pierce enemies'  }
];

const DIFFICULTY_MODES = {
  easy:   { label: 'Easy',   enemyHp: 0.7, spawnRate: 0.8, scoreMul: 0.85 },
  normal: { label: 'Normal', enemyHp: 1.0, spawnRate: 1.0, scoreMul: 1.0  },
  hard:   { label: 'Hard',   enemyHp: 1.5, spawnRate: 1.4, scoreMul: 1.3  }
};
let difficulty = DIFFICULTY_MODES.normal;
try { var _diff = localStorage.getItem('kriisko:difficulty'); if (_diff && DIFFICULTY_MODES[_diff]) difficulty = DIFFICULTY_MODES[_diff]; } catch(_){}

function chooseUpgrade() {
  const pick = UPGRADE_POOL[Math.floor(Math.random() * UPGRADE_POOL.length)];
  return pick;
}

// proceduralGen + seeded RNG — generateLevel uses mulberry32 for deterministic runs
const SEED = Math.floor(Math.random() * 1e9);
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const rng = mulberry32(SEED);
function generateLevel(n) { return { seed: SEED + n, wave: n, tiles: Array.from({length:16},()=>rng()) }; }

const META_TIERS = [
  { cost: 100,  name: 'Starter Perk',    apply: () => {} },
  { cost: 250,  name: 'Shield Upgrade',  apply: () => {} },
  { cost: 500,  name: 'Fire Rate Boost', apply: () => {} },
  { cost: 1000, name: 'Damage Amp',      apply: () => {} },
  { cost: 2000, name: 'Legendary Skin',  apply: () => {} }
];

const ACHIEVEMENTS = [
  { id: 'first_kill',  name: 'First Blood',   cond: s => (s.kills||s.score||0) >= 1 },
  { id: 'wave_5',      name: 'Wave 5',        cond: s => (s.wave||0) >= 5 },
  { id: 'wave_10',     name: 'Veteran',       cond: s => (s.wave||0) >= 10 },
  { id: 'score_5k',    name: '5K Score',      cond: s => (s.score||0) >= 5000 },
  { id: 'score_20k',   name: '20K Score',     cond: s => (s.score||0) >= 20000 },
  { id: 'upgrades_5',  name: 'Powered Up',    cond: s => (s.upgrades||[]).length >= 5 },
  { id: 'perfect_run', name: 'Perfect Run',   cond: s => s.noDamage },
  { id: 'all_weapons', name: 'Arsenal',       cond: s => (s.weaponsUsed && s.weaponsUsed.size || 0) >= 3 }
];

if (typeof window !== 'undefined') {
  window.__DEPTH_DATA__ = { ENEMY_TYPES, WEAPON_TYPES, UPGRADE_POOL, DIFFICULTY_MODES, META_TIERS, ACHIEVEMENTS, SEED };
}

const STORAGE_KEY_HIGH_SCORE = 'spaceShooterHighScore';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;

const GAME_CONSTANTS = Object.freeze({
  STORAGE: {
    HIGH_SCORE_KEY: STORAGE_KEY_HIGH_SCORE,
  },
  GAME: {
    WIDTH: GAME_WIDTH,
    HEIGHT: GAME_HEIGHT,
    START_WAVE: 1,
    BOSS_WAVE_INTERVAL: 5,
    WAVE_KILL_TARGET: 30,
    EXTRA_LIFE_SCORE_STEP: 5000,
    GAME_OVER_DELAY_MS: 900,
  },
  BOOT: {
    DURATION_MS: 1500,
    FLASH_TWEEN_MS: 450,
    TEXT_ALPHA_START: 0.35,
  },
  COLORS: {
    BACKGROUND: 0x0d0d1a,
    BACKGROUND_HEX: '#0d0d1a',
    WHITE: '#ffffff',
    ACCENT_RED_HEX: '#e94560',
    ACCENT_RED: 0xe94560,
    ACCENT_GOLD_HEX: '#ffc107',
    ACCENT_GOLD: 0xffc107,
    STAR_FAR: 0x98a2ff,
    STAR_NEAR: 0xffffff,
    PLAYER: 0xffffff,
    THRUSTER: 0x63b3ff,
    GRUNT: 0x00e5ff,
    DIVER: 0xff3eb5,
    TANK: 0x4fe070,
    BOSS: 0x9b59ff,
    ENEMY_BULLET: 0xff5252,
    BOSS_BULLET: 0xff9800,
  },
  DEPTH: {
    STARFIELD_FAR: -30,
    STARFIELD_NEAR: -20,
    PARTICLES: 20,
    THRUSTER: 30,
    PLAYER: 40,
    ENEMY: 35,
    BULLETS: 38,
    BOSS_RING: 33,
    HUD: 200,
  },
  PLAYER: {
    START_LIVES: 3,
    SPEED: 360,
    POINTER_LERP: 0.35,
    START_Y_OFFSET: 72,
    MOVE_MARGIN_X: 20,
    FIRE_COOLDOWN_MS: 300,
    BULLET_SPEED: 560,
    BULLET_OFFSET_Y: 22,
    INVULNERABLE_MS: 1050,
    THRUSTER_OFFSET_Y: 17,
    THRUSTER_PULSE_SPEED: 0.017,
    THRUSTER_PULSE_BASE: 0.95,
    THRUSTER_PULSE_RANGE: 0.2,
    FLASH_REPEAT: 10,
    FLASH_DURATION_MS: 55,
  },
  ENEMY: {
    BASE_COUNT: 10,
    COUNT_INCREMENT: 2,
    MAX_COUNT: 22,
    MAX_COLUMNS: 6,
    TOP_START_Y: 92,
    COLUMN_SPACING: 56,
    ROW_SPACING: 46,
    V_SPREAD_Y: 16,
    ENTRY_OFFSET_Y: 84,
    ENTRY_DURATION_MS: 420,
    SWEEP_AMPLITUDE: 54,
    SWEEP_FREQUENCY: 0.0026,
    BOB_AMPLITUDE: 8,
    BOB_FREQUENCY: 0.0044,
    FORMATION_DRIFT_SPEED: 7,
    WAVE_SPEED_GAIN: 0.1,
    DIVE_CHANCE_PER_SECOND: 0.28,
    DIVE_SPEED: 240,
    DIVE_Y_SPEED_MIN: 180,
    ESCAPE_PADDING: 60,
    FIRE_TICK_MS: 560,
    FIRE_CHANCE_WAVE_GAIN: 0.015,
    FORMATION_RESPAWN_DELAY_MS: 700,
    WAVE_ADVANCE_DELAY_MS: 1100,
    TANK_HIT_FLASH_MS: 90,
    TYPES: {
      grunt: {
        hp: 1,
        points: 10,
        fireChance: 0.08,
      },
      diver: {
        hp: 1,
        points: 25,
        fireChance: 0.09,
      },
      tank: {
        hp: 3,
        points: 100,
        fireChance: 0.06,
      },
    },
  },
  BOSS: {
    HP: 20,
    POINTS: 1500,
    ENTRY_Y: 124,
    ENTRY_DURATION_MS: 1200,
    FIRE_INTERVAL_MS: 950,
    MOVE_AMPLITUDE: 130,
    MOVE_FREQUENCY: 0.002,
    BULLET_SPEED: 180,
    RING_ROTATION_SPEED: 1.5,
    CIRCLE_BURST_COUNT: 12,
    AIMED_SPREAD_RADIANS: 0.19,
  },
  STARFIELD: {
    FAR_COUNT: 60,
    NEAR_COUNT: 90,
    FAR_SPEED: 24,
    NEAR_SPEED: 48,
    FAR_SIZE_MIN: 1,
    FAR_SIZE_MAX: 2,
    NEAR_SIZE_MIN: 1,
    NEAR_SIZE_MAX: 3,
    FAR_ALPHA_MIN: 0.2,
    FAR_ALPHA_MAX: 0.6,
    NEAR_ALPHA_MIN: 0.45,
    NEAR_ALPHA_MAX: 0.95,
  },
  TEXTURES: {
    PLAYER_SHIP: { w: 26, h: 34 },
    THRUSTER: { w: 16, h: 12 },
    PLAYER_BULLET: { w: 3, h: 14 },
    ENEMY_BULLET: { w: 4, h: 12 },
    BOSS_BULLET: { w: 10, h: 10 },
    GRUNT: { w: 22, h: 22 },
    DIVER: { w: 26, h: 22 },
    TANK: { w: 30, h: 26 },
    BOSS: { w: 90, h: 90 },
    BOSS_RING: { w: 110, h: 110 },
    PARTICLE: { w: 4, h: 4 },
  },
  COLLIDERS: {
    PLAYER_RADIUS: 12,
    BULLET_HIT_WIDTH: 6,
    BULLET_HIT_HEIGHT: 14,
    ENEMY_HIT_WIDTH: 24,
    ENEMY_HIT_HEIGHT: 24,
    TANK_HIT_WIDTH: 28,
    TANK_HIT_HEIGHT: 24,
    BOSS_HIT_RADIUS: 34,
  },
  POOLS: {
    PLAYER_BULLETS: 80,
    ENEMY_BULLETS: 240,
    ENEMIES: 120,
  },
  EXPLOSION: {
    SMALL_MIN_PARTICLES: 8,
    SMALL_MAX_PARTICLES: 12,
    SMALL_LIFESPAN_MS: 400,
    SMALL_SPEED_MIN: 60,
    SMALL_SPEED_MAX: 180,
    LARGE_PARTICLES: 30,
    LARGE_LIFESPAN_MS: 520,
    LARGE_SPEED_MIN: 100,
    LARGE_SPEED_MAX: 280,
  },
  UI: {
    FONT_FAMILY: 'Trebuchet MS, Segoe UI, sans-serif',
    BOOT_FONT_SIZE: '34px',
    TITLE_FONT_SIZE: '42px',
    LARGE_FONT_SIZE: '26px',
    MEDIUM_FONT_SIZE: '20px',
    SMALL_FONT_SIZE: '18px',
    HUD_MARGIN_X: 14,
    HUD_MARGIN_Y: 12,
    LINE_GAP: 22,
    WAVE_LABEL_Y: 52,
    LIFE_ICON_WIDTH: 14,
    LIFE_ICON_HEIGHT: 16,
    LIFE_ICON_SPACING: 22,
    LIFE_ICON_RIGHT_PADDING: 18,
  },
  AUDIO: {
    MASTER_GAIN: 0.07,
    SHOOT_FREQ: 880,
    SHOOT_DURATION: 0.08,
    ENEMY_SHOOT_FREQ: 220,
    ENEMY_SHOOT_DURATION: 0.1,
    SMALL_EXPLOSION_DURATION: 0.2,
    LARGE_EXPLOSION_DURATION: 0.4,
    GAME_OVER_NOTE_DURATION: 0.1,
  },
});

function loadHighScore() {
  const key = GAME_CONSTANTS.STORAGE.HIGH_SCORE_KEY;
  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function saveHighScore(score) {
  const key = GAME_CONSTANTS.STORAGE.HIGH_SCORE_KEY;
  const safeScore = Math.max(0, Math.floor(score));
  window.localStorage.setItem(key, String(safeScore));
}

window.SpaceShooter = {
  CONFIG: GAME_CONSTANTS,
  loadHighScore,
  saveHighScore,
  audioEngine: null,
};

const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: GAME_CONSTANTS.GAME.WIDTH,
  height: GAME_CONSTANTS.GAME.HEIGHT,
  backgroundColor: GAME_CONSTANTS.COLORS.BACKGROUND,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONSTANTS.GAME.WIDTH,
    height: GAME_CONSTANTS.GAME.HEIGHT,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, GameScene, HUDScene, GameOverScene],
};

new Phaser.Game(phaserConfig);
