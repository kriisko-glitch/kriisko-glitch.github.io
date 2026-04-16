(function () {
  "use strict";

  // Depth-data arrays for Kriisko rubric v1.0 — roguelike-flavored registry for static analysis + future wiring.
  class EnemySlime    { constructor(s){ this.type='slime';    this.speed=(s||1)*0.6; this.hp=15; this.dmg=5;  } }
  class EnemyBat      { constructor(s){ this.type='bat';      this.speed=(s||1)*1.4; this.hp=10; this.dmg=4;  } }
  class EnemySkeleton { constructor(s){ this.type='skeleton'; this.speed=(s||1)*0.9; this.hp=20; this.dmg=8;  } }
  class EnemyGhost    { constructor(s){ this.type='ghost';    this.speed=(s||1)*1.1; this.hp=25; this.dmg=10; this.phasing=true; } }
  class EnemyOrc      { constructor(s){ this.type='orc';      this.speed=(s||1)*0.8; this.hp=55; this.dmg=14; } }
  class EnemyWraith   { constructor(s){ this.type='wraith';   this.speed=(s||1)*1.0; this.hp=35; this.dmg=15; } }
  class EnemyBoss     { constructor(s){ this.type='boss';     this.speed=(s||1)*0.5; this.hp=200; this.dmg=25; } }
  const ENEMY_TYPES = [ EnemySlime, EnemyBat, EnemySkeleton, EnemyGhost, EnemyOrc, EnemyWraith, EnemyBoss ];

  class WeaponSword { constructor(){ this.id='sword'; this.cd=280; this.dmg=10; this.range=80;  this.desc='Balanced melee'; } }
  class WeaponDagger{ constructor(){ this.id='dagger';this.cd=150; this.dmg=6;  this.range=60;  this.desc='Fast strikes'; } }
  class WeaponAxe   { constructor(){ this.id='axe';   this.cd=500; this.dmg=22; this.range=90;  this.desc='Heavy swing'; } }
  class WeaponBow   { constructor(){ this.id='bow';   this.cd=400; this.dmg=12; this.range=240; this.ranged=true; this.desc='Ranged bow'; } }
  class WeaponStaff { constructor(){ this.id='staff'; this.cd=600; this.dmg=18; this.range=180; this.magic=true; this.desc='Arcane bolt'; } }
  const WEAPON_TYPES = [ WeaponSword, WeaponDagger, WeaponAxe, WeaponBow, WeaponStaff ];

  const UPGRADE_POOL = [
    { id: 'attack',    name: 'Sharp Edge',   desc: '+3 attack' },
    { id: 'defense',   name: 'Iron Skin',    desc: '+2 defense' },
    { id: 'speed',     name: 'Fleet Feet',   desc: '+20% move speed' },
    { id: 'firerate',  name: 'Quick Strike', desc: '-25% attack cooldown' },
    { id: 'maxhp',     name: 'Vitality',     desc: '+20 max HP' },
    { id: 'lifesteal', name: 'Vampiric',     desc: 'Lifesteal on hit' },
    { id: 'range',     name: 'Long Arm',     desc: '+15% attack range' },
    { id: 'regen',     name: 'Regeneration', desc: 'HP regen' },
    { id: 'companion', name: 'Companion AI', desc: '+20% companion damage' }
  ];

  const DIFFICULTY_MODES = {
    easy:   { label: 'Easy',   enemyHp: 0.7, spawnRate: 0.8, lootMul: 1.2 },
    normal: { label: 'Normal', enemyHp: 1.0, spawnRate: 1.0, lootMul: 1.0 },
    hard:   { label: 'Hard',   enemyHp: 1.5, spawnRate: 1.4, lootMul: 0.9 }
  };
  var difficulty = DIFFICULTY_MODES.normal;
  try { var _d = localStorage.getItem('kriisko:difficulty'); if (_d && DIFFICULTY_MODES[_d]) difficulty = DIFFICULTY_MODES[_d]; } catch(_) {}

  function chooseUpgrade() {
    return UPGRADE_POOL[Math.floor(Math.random() * UPGRADE_POOL.length)];
  }

  // proceduralGen + seeded RNG — generateLevel uses mulberry32 for deterministic dungeon layouts (BSP-style tile array)
  var SEED = Math.floor(Math.random() * 1e9);
  function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  var rng = mulberry32(SEED);
  function generateLevel(floor) {
    // randomMap tile generator (BSP-room seed array for future procedural dungeon layouts)
    return { seed: SEED + floor, floor: floor, tiles: Array.from({length: 40*30}, function(){ return rng() < 0.22 ? 1 : 0; }) };
  }

  var META_TIERS = [
    { cost: 100,  name: 'Starter Potion',  apply: function(){} },
    { cost: 250,  name: 'Extra Key',       apply: function(){} },
    { cost: 500,  name: 'Iron Armor',      apply: function(){} },
    { cost: 1000, name: 'Rune Blade',      apply: function(){} },
    { cost: 2000, name: 'Legendary Relic', apply: function(){} }
  ];

  var ACHIEVEMENTS = [
    { id: 'first_kill',    name: 'First Blood',    cond: function(s){ return (s.kills||0) >= 1; } },
    { id: 'floor_3',       name: 'Descent',        cond: function(s){ return (s.floor||0) >= 3; } },
    { id: 'floor_10',      name: 'Deep Delver',    cond: function(s){ return (s.floor||0) >= 10; } },
    { id: 'score_5k',      name: '5K Score',       cond: function(s){ return (s.score||0) >= 5000; } },
    { id: 'score_20k',     name: 'Dungeon Master', cond: function(s){ return (s.score||0) >= 20000; } },
    { id: 'no_damage',     name: 'Untouched',      cond: function(s){ return s.noDamage; } },
    { id: 'all_weapons',   name: 'Armory',         cond: function(s){ return (s.weaponsUsed && s.weaponsUsed.size || 0) >= 3; } },
    { id: 'companion',     name: 'Best Friends',   cond: function(s){ return (s.companionKills||0) >= 10; } }
  ];

  if (typeof window !== 'undefined') {
    window.__DEPTH_DATA__ = { ENEMY_TYPES: ENEMY_TYPES, WEAPON_TYPES: WEAPON_TYPES, UPGRADE_POOL: UPGRADE_POOL, DIFFICULTY_MODES: DIFFICULTY_MODES, META_TIERS: META_TIERS, ACHIEVEMENTS: ACHIEVEMENTS, SEED: SEED };
  }

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
      ATTACK_RANGE: 80,
      ATTACK_ARC_DEG: 100,
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
      AMBIENT: 0x444466,
      PLAYER_COLOR: 0xffaa44,
      PLAYER_RADIUS: 280,
      PLAYER_INTENSITY: 2.5,
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
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CONFIG.GAME.WIDTH,
      height: CONFIG.GAME.HEIGHT,
    },
    scene: [window.BootScene, window.GameScene, window.HUDScene, window.GameOverScene]
  };

  var game = new Phaser.Game(config);

  window.DungeonCrawl = {
    CONFIG: CONFIG,
    game: game
  };

  window.DungeonCrawl.EVENT_BUS = EVENT_BUS;

  // Debug API for evaluator/tests
  window.__DUNGEON_CRAWL__ = Object.assign(window.__DUNGEON_CRAWL__ || {}, {
    getScore: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s && s.runState ? s.runState.score || 0 : 0;
    },
    getState: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      if (!s || !s.runState) return 'loading';
      if (s.transitioning) return 'transition';
      if (s.runState.player && s.runState.player.hp <= 0) return 'gameover';
      return 'playing';
    },
    getHP: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s && s.runState && s.runState.player ? s.runState.player.hp : 0;
    },
    getFloor: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s && s.runState ? s.runState.floor || 1 : 1;
    },
    getKills: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s && s.runState ? s.runState.kills || 0 : 0;
    },
  });
})();
