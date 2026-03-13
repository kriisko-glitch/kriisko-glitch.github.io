(function () {
  "use strict";

  var CONFIG = {
    GAME: {
      WIDTH: 800,
      HEIGHT: 600,
      PARENT: "game-root",
      BACKGROUND: "#070911",
      PIXEL_ART: true
    },
    TILE_SIZE: 32,
    DEPTH: {
      TILE: 1,
      ITEMS: 5,
      ENEMIES: 7,
      PLAYER: 10,
      COMPANION: 11,
      WORLD_UI: 20,
      SCREEN_FX: 1000
    },
    DUNGEON: {
      MIN_WIDTH: 40,
      MIN_HEIGHT: 30,
      BASE_ROOMS_MIN: 5,
      BASE_ROOMS_MAX: 8,
      ROOM_WIDTH_MIN: 5,
      ROOM_WIDTH_MAX: 10,
      ROOM_HEIGHT_MIN: 5,
      ROOM_HEIGHT_MAX: 8,
      ROOMS_PER_FLOOR_BONUS: 1,
      ROOM_PADDING: 1,
      ENEMIES_PER_ROOM_MIN: 1,
      ENEMIES_PER_ROOM_MAX: 3,
      CHEST_CHANCE: 0.6,
      AGGRO_RANGE: 150,
      EXIT_ACTIVATION_BONUS: 100
    },
    PLAYER: {
      WIDTH: 24,
      HEIGHT: 32,
      SPEED: 160,
      MAX_HP: 100,
      START_ATTACK: 10,
      START_DEFENSE: 2,
      ATTACK_COOLDOWN_MS: 280,
      INVULN_MS: 400,
      ATTACK_RANGE: 60,
      ATTACK_ARC_DEG: 80,
      HIT_KNOCKBACK: 20,
      TORCH_FLICKER_AMPLITUDE: 15
    },
    COMPANION: {
      WIDTH: 20,
      HEIGHT: 24,
      SPEED: 145,
      MAX_HP: 50,
      FOLLOW_MIN: 80,
      FOLLOW_MAX: 120,
      THINK_INTERVAL_MS: 2000,
      ACTION_TIMEOUT_MS: 1200,
      ACTION_QUEUE_MAX: 2,
      ATTACK_MULTIPLIER: 0.5,
      ATTACK_RANGE: 54,
      REVIVE_RATIO: 0.5,
      PICKUP_RANGE: 100,
      DANGER_RANGE: 60,
      BUBBLE_HOLD_MS: 3000
    },
    ENEMIES: {
      SKELETON: {
        KEY: "enemy-skeleton",
        NAME: "Skeleton",
        HP: 20,
        DAMAGE: 8,
        SPEED: 60,
        DEFENSE: 0,
        COLOR: 0xd4d4d4
      },
      SLIME: {
        KEY: "enemy-slime",
        NAME: "Slime",
        HP: 15,
        DAMAGE: 5,
        SPEED: 40,
        DEFENSE: 0,
        COLOR: 0x4caf50
      },
      WRAITH: {
        KEY: "enemy-wraith",
        NAME: "Wraith",
        HP: 35,
        DAMAGE: 15,
        SPEED: 80,
        DEFENSE: 1,
        COLOR: 0x9c27b0,
        ALPHA: 0.6
      }
    },
    FLOOR_SCALING: {
      HP_MULTIPLIER: 1.1,
      DAMAGE_ADD: 1
    },
    ITEMS: {
      POTION: "item-potion",
      COIN: "item-coin",
      KEY: "item-key",
      ATTACK_GEM: "item-attack-gem",
      DEFENSE_GEM: "item-defense-gem",
      CHEST_CLOSED: "chest-closed",
      CHEST_OPEN: "chest-open",
      POTION_HEAL: 30,
      COIN_SCORE: 10,
      ATTACK_GEM_BONUS: 3,
      DEFENSE_GEM_BONUS: 1,
      GEM_FLOOR_CHANCE: 0.2,
      CHEST_DROP_MIN: 1,
      CHEST_DROP_MAX: 3
    },
    SCORE: {
      KILL: 25,
      FLOOR_CLEAR: 100
    },
    LIGHTING: {
      AMBIENT: 0x111122,
      PLAYER_COLOR: 0xffaa44,
      PLAYER_RADIUS: 200,
      PLAYER_INTENSITY: 2.0,
      COMPANION_COLOR: 0x4488ff,
      COMPANION_RADIUS: 80,
      COMPANION_INTENSITY: 1.0,
      CHEST_COLOR: 0xffc107,
      CHEST_RADIUS: 60,
      CHEST_INTENSITY: 0.8,
      EXIT_COLOR: 0xffc107,
      EXIT_RADIUS: 110,
      EXIT_INTENSITY_IDLE: 0.25,
      EXIT_INTENSITY_ACTIVE: 1.4
    },
    FX: {
      DAMAGE_FLASH_MS: 100,
      DUST_ALPHA: 0.2,
      CAMERA_SHAKE_MS: 120,
      CAMERA_SHAKE_INTENSITY: 0.004,
      FADE_DURATION_MS: 350,
      NOTIFY_HOLD_MS: 2000
    },
    HUD: {
      PANEL_BG: 0x0f1224,
      PANEL_ALPHA: 0.9,
      BORDER: 0xe94560,
      HP_COLOR: 0xe94560,
      COMPANION_HP_COLOR: 0x00bcd4,
      SCORE_COLOR: 0xffc107,
      MINIMAP_WIDTH: 120,
      MINIMAP_HEIGHT: 90
    },
    AUDIO: {
      ENABLED: true,
      MASTER_GAIN: 0.17,
      AMBIENT_GAIN: 0.03,
      FOOTSTEP_INTERVAL_MS: 170,
      SOUND_SHORT_MS: 60,
      SOUND_MEDIUM_MS: 120,
      SOUND_LONG_MS: 300
    },
    EVENTS: {
      HUD_UPDATE: "hud:update",
      MAP_UPDATE: "map:update",
      ITEM_PICKED: "item:picked",
      NOTIFY: "hud:notify",
      ROOM_ENTERED: "room:entered",
      FLOOR_TRANSITION: "floor:transition",
      GAME_OVER: "game:over"
    },
    BRAIN_ACTIONS: {
      FOLLOW: "FOLLOW",
      ATTACK: "ATTACK",
      PICKUP: "PICKUP",
      SAY: "SAY",
      IDLE: "IDLE"
    }
  };

  var EVENT_BUS = new Phaser.Events.EventEmitter();

  var config = {
    type: Phaser.AUTO,
    parent: CONFIG.GAME.PARENT,
    width: CONFIG.GAME.WIDTH,
    height: CONFIG.GAME.HEIGHT,
    backgroundColor: CONFIG.GAME.BACKGROUND,
    pixelArt: CONFIG.GAME.PIXEL_ART,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [window.BootScene, window.GameScene, window.HUDScene, window.GameOverScene]
  };

  var game = new Phaser.Game(config);

  window.DungeonCrawl = {
    CONFIG: CONFIG,
    game: game
  };

  window.DungeonCrawl.EVENT_BUS = EVENT_BUS;
})();
