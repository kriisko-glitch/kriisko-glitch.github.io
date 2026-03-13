(function () {
  var BUS = new Phaser.Events.EventEmitter();

  var CONFIG = {
    GAME: {
      WIDTH: 800,
      HEIGHT: 600,
      PARENT: "game-root",
      BACKGROUND_COLOR: "#0d0d1a"
    },
    WORLD: {
      CAMERA_LERP: 0.1,
      BASE_BG_COLOR: 0x0d0d1a,
      GRID_COLOR: 0x1f2340,
      GRID_SPACING: 32
    },
    PLAYER: {
      START_HP: 100,
      START_SPEED: 180,
      START_X: 400,
      START_Y: 300,
      INVINCIBLE_MS: 500,
      REGEN_AMOUNT: 1,
      REGEN_INTERVAL_MS: 3000,
      TRAIL_INTERVAL_MS: 45
    },
    WEAPONS: {
      ORB: {
        DAMAGE: 10,
        COOLDOWN_MS: 800,
        SPEED: 380,
        LIFETIME_MS: 1800
      },
      SLASH: {
        DAMAGE: 15,
        COOLDOWN_MS: 1200,
        RADIUS: 96
      },
      LIGHTNING: {
        DAMAGE: 8,
        COOLDOWN_MS: 2000,
        CHAINS: 3,
        RANGE: 260
      },
      SHIELD: {
        DAMAGE: 12,
        COOLDOWN_MS: 3000,
        RADIUS: 150
      },
      PROJECTILE_SPREAD_DEG: 14
    },
    ENEMIES: {
      MAX_ACTIVE: 200,
      SPAWN_START_PER_SEC: 1.4,
      SPAWN_GROWTH_EVERY_MS: 30000,
      SPAWN_GROWTH_MULTIPLIER: 1.2,
      ELITE_START_MS: 300000,
      SPAWN_OUTSIDE_PADDING: 50,
      CONTACT_KILL: true,
      TYPES: {
        bat: {
          key: "enemy-bat",
          speed: 100,
          hp: 15,
          damage: 5,
          xp: 1,
          score: 1,
          color: 0x9c27b0,
          wobbleAmp: 3,
          wobbleSpeed: 0.014
        },
        zombie: {
          key: "enemy-zombie",
          speed: 55,
          hp: 40,
          damage: 10,
          xp: 3,
          score: 3,
          color: 0x4caf50,
          wobbleAmp: 2,
          wobbleSpeed: 0.008
        },
        ghost: {
          key: "enemy-ghost",
          speed: 80,
          hp: 25,
          damage: 8,
          xp: 2,
          score: 2,
          color: 0xffffff,
          wobbleAmp: 8,
          wobbleSpeed: 0.01,
          alpha: 0.62
        },
        elite: {
          key: "enemy-elite",
          speed: 70,
          hp: 120,
          damage: 20,
          xp: 10,
          score: 10,
          color: 0xf44336,
          wobbleAmp: 4,
          wobbleSpeed: 0.009
        }
      }
    },
    XP: {
      START_LEVEL: 1,
      START_TO_NEXT: 10,
      NEXT_MULTIPLIER: 1.15,
      GEM_MAGNET_RADIUS: 80,
      GEM_SPEED_MIN: 80,
      GEM_SPEED_MAX: 500,
      GEM_SPARKLE_INTERVAL_MS: 150
    },
    LEVEL_UP: {
      CARD_COUNT: 3,
      CARD_WIDTH: 210,
      CARD_HEIGHT: 150,
      CARD_SPACING: 240
    },
    UPGRADE_VALUES: {
      DAMAGE_MULTIPLIER: 1.2,
      SPEED_MULTIPLIER: 1.15,
      HP_ADD: 25,
      FIRE_RATE_MULTIPLIER: 0.85,
      MAGNET_ADD: 40,
      PROJECTILE_ADD: 1,
      REGEN_MULTIPLIER: 0.5
    },
    HUD: {
      BAR_WIDTH: 200,
      BAR_HEIGHT: 16,
      HEALTH_X: 22,
      HEALTH_Y: 20,
      XP_Y: 46,
      LEVEL_BADGE_X: 236,
      LEVEL_BADGE_Y: 54,
      TIMER_Y: 20,
      SCORE_X: 760,
      SCORE_Y: 22
    },
    VFX: {
      DAMAGE_SHAKE_MS: 200,
      DAMAGE_SHAKE_INTENSITY: 0.008,
      DAMAGE_FLASH_MS: 100,
      LEVEL_UP_FLASH_MS: 150,
      BOOT_FADE_MS: 500,
      DEATH_ZOOM_DURATION_MS: 700,
      DEATH_TRANSITION_MS: 800,
      SCORE_POPUP_MS: 600
    },
    AUDIO: {
      MASTER_GAIN: 0.12
    },
    EVENTS: {
      HUD_UPDATE: "hud:update",
      HUD_CLICK_CONSUMED: "hud:click-consumed",
      AUDIO_TOGGLE_REQUEST: "audio:toggle-request",
      AUDIO_STATE: "audio:state",
      GAME_OVER: "game:over"
    },
    BUS: BUS,
    TEXTURES: {
      PLAYER: "player-main",
      ORB: "weapon-orb",
      SLASH: "weapon-slash",
      SHIELD: "weapon-shield",
      GEM: "xp-gem",
      TRAIL_DOT: "trail-dot",
      STAR_LAYER: "parallax-star",
      MID_LAYER: "parallax-mid",
      FLOOR_GRID: "floor-grid",
      CARD_BG: "ui-card",
      SKULL_ICON: "ui-skull",
      ENEMY_BAT: "enemy-bat",
      ENEMY_ZOMBIE: "enemy-zombie",
      ENEMY_GHOST: "enemy-ghost",
      ENEMY_ELITE: "enemy-elite",
      POP_PARTICLE: "particle-pop",
      RING_PARTICLE: "particle-ring"
    }
  };

  var phaserConfig = {
    type: Phaser.AUTO,
    width: CONFIG.GAME.WIDTH,
    height: CONFIG.GAME.HEIGHT,
    parent: CONFIG.GAME.PARENT,
    backgroundColor: CONFIG.GAME.BACKGROUND_COLOR,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [window.BootScene, window.GameScene, window.HUDScene, window.GameOverScene],
    pixelArt: false,
    roundPixels: false
  };

  window.SurvivorsArena = {
    CONFIG: CONFIG
  };

  var game = new Phaser.Game(phaserConfig);

  window.SurvivorsArena = {
    CONFIG: CONFIG,
    game: game
  };
})();
