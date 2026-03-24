import BootScene from "./scenes/BootScene.js";
import GameScene from "./scenes/GameScene.js";
import HUDScene from "./scenes/HUDScene.js";
import GameOverScene from "./scenes/GameOverScene.js";

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

export { CONFIG };
