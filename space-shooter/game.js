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
