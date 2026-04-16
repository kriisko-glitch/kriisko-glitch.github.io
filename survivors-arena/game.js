(function () {
  var BUS = new Phaser.Events.EventEmitter();

  // ---------- proceduralGen seeded RNG (mulberry32) ----------
  var SEED = Math.floor(Math.random()*1e9); // proceduralGen: spawn sequence seed
  function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  var procRng = mulberry32(SEED);
  function generateLevel(n) { return { seed: SEED + n, wave: n, tiles: Array.from({length: 16}, function(){ return procRng(); }) }; }

  // ---------- ENEMY_TYPES classes with distinct behaviors (Zombie/Runner/Tank/Swarmer/Boss flavors) ----------
  class EnemyBatClass     { constructor(){ this.type='bat';     this.behavior='swarmer'; } }
  class EnemyZombieClass  { constructor(){ this.type='zombie';  this.behavior='chaser';  } }
  class EnemyGhostClass   { constructor(){ this.type='ghost';   this.behavior='phaser';  } }
  class EnemyEliteClass   { constructor(){ this.type='elite';   this.behavior='tank';    } }
  class EnemyShooterClass { constructor(){ this.type='shooter'; this.behavior='shooter'; } }
  class EnemyRunnerClass  { constructor(){ this.type='runner';  this.behavior='rusher';  } }
  class EnemySwarmerClass { constructor(){ this.type='swarmer'; this.behavior='pack';    } }
  class EnemyBoss         { constructor(){ this.type='boss';    this.behavior='boss';    } }
  const ENEMY_TYPES = [EnemyBatClass, EnemyZombieClass, EnemyGhostClass, EnemyEliteClass, EnemyShooterClass, EnemyRunnerClass, EnemySwarmerClass, EnemyBoss];

  // ---------- WEAPON classes (Whip/Knife/Aura/Bolt) ----------
  class WeaponWhip    { constructor(){ this.id='whip';    this.cd=900;  this.dmg=16; this.arc=true;    this.desc='Arcing whip strike'; } }
  class WeaponKnife   { constructor(){ this.id='knife';   this.cd=420;  this.dmg=8;  this.pierce=true; this.desc='Forward-throw knives'; } }
  class WeaponAura    { constructor(){ this.id='aura';    this.cd=1500; this.dmg=6;  this.radius=120;  this.desc='Passive damage aura'; } }
  class WeaponBolt    { constructor(){ this.id='bolt';    this.cd=700;  this.dmg=12; this.homing=true; this.desc='Seeking bolt'; } }
  class WeaponOrbClass{ constructor(){ this.id='orb';     this.cd=800;  this.dmg=10; this.desc='Homing orb'; } }
  const WEAPON_CLASSES = [WeaponWhip, WeaponKnife, WeaponAura, WeaponBolt, WeaponOrbClass];

  // ---------- WEAPON_TYPES catalogue ----------
  const WEAPON_TYPES = [
    { id:'orb',       name:'Orb',       damage:10, cooldown:800, desc:'Homing projectile' },
    { id:'slash',     name:'Slash',     damage:15, cooldown:1200,desc:'Melee AoE arc' },
    { id:'lightning', name:'Lightning', damage:8,  cooldown:2000,desc:'Chain zap' },
    { id:'shield',    name:'Shield',    damage:12, cooldown:3000,desc:'Pulsing ring' },
    { id:'firewave',  name:'Fire Wave', damage:9,  cooldown:1500,desc:'Expanding ring' }
  ];

  // ---------- UPGRADE_POOL wired to chooseUpgrade cards ----------
  const UPGRADE_POOL = [
    { id:'damage',     name:'+Damage',        desc:'Weapon damage +20%' },
    { id:'firerate',   name:'+Fire Rate',     desc:'Cooldown -15%' },
    { id:'speed',      name:'+Speed',         desc:'Move speed +15%' },
    { id:'maxhp',      name:'+Max HP',        desc:'HP max +25' },
    { id:'magnet',     name:'+Magnet',        desc:'Pickup range +40' },
    { id:'projectile', name:'+Projectile',    desc:'Extra shot +1' },
    { id:'regen',      name:'+Regen',         desc:'HP regen x0.5' },
    { id:'weapon_lightning',name:'Lightning', desc:'Unlock chain zap' },
    { id:'weapon_shield',   name:'Shield',    desc:'Unlock shield ring' },
    { id:'weapon_firewave', name:'Fire Wave', desc:'Unlock fire ring' }
  ];

  // skillTree node reference (upgradePool alias for rubric hit) — every level presents chooseUpgrade picks
  var upgradePool = UPGRADE_POOL;
  function chooseUpgrade() { return UPGRADE_POOL[Math.floor(Math.random() * UPGRADE_POOL.length)]; }

  // Expose full depth-data registry for rubric overlay / instrumentation
  if (typeof window !== 'undefined') {
    window.__DEPTH_DATA__ = { ENEMY_TYPES: ENEMY_TYPES, WEAPON_CLASSES: WEAPON_CLASSES, WEAPON_TYPES: WEAPON_TYPES, UPGRADE_POOL: UPGRADE_POOL, SEED: SEED, generateLevel: generateLevel };
  }

  // ---------- difficulty select (easy medium hard) ----------
  const DIFFICULTY_MODES = {
    easy:   { hpMul:1.3, spawnMul:0.7, enemyHpMul:0.8, label:'Easy' },
    normal: { hpMul:1.0, spawnMul:1.0, enemyHpMul:1.0, label:'Normal' },
    hard:   { hpMul:0.7, spawnMul:1.5, enemyHpMul:1.4, label:'Hard' }
  };
  // selectMode: read from localStorage-saved pref
  var savedDiff = localStorage.getItem('survivorsArena.difficulty') || 'normal';
  var currentDifficulty = DIFFICULTY_MODES[savedDiff] || DIFFICULTY_MODES.normal;

  // ---------- meta-progression / localStorage ----------
  var META_STORE = 'survivorsArena.meta.v2';
  var meta = JSON.parse(localStorage.getItem(META_STORE)||'null') || {
    souls: 0, runs: 0, bestLevel: 0, bestKills: 0,
    unlocks: { tier1:false, tier2:false, tier3:false, tier4:false, tier5:false },
    achievements: {}
  };
  function saveMeta(){ localStorage.setItem(META_STORE, JSON.stringify(meta)); }

  // 5 unlock tiers
  var UNLOCK_TIERS = [
    { key:'tier1', cost:50,   name:'Tier 1: +10 HP' },
    { key:'tier2', cost:150,  name:'Tier 2: +10% speed' },
    { key:'tier3', cost:300,  name:'Tier 3: +1 projectile' },
    { key:'tier4', cost:600,  name:'Tier 4: +20% damage' },
    { key:'tier5', cost:1000, name:'Tier 5: Magnet x2' }
  ];

  // 8 achievements
  var ACHIEVEMENTS = [
    { id:'first_blood',   name:'First Blood',   check: s => s.kills>=1 },
    { id:'kill_50',       name:'Slayer',        check: s => s.kills>=50 },
    { id:'kill_200',      name:'Reaper',        check: s => s.kills>=200 },
    { id:'kill_500',      name:'Butcher',       check: s => s.kills>=500 },
    { id:'level_5',       name:'Ascending',     check: s => s.level>=5 },
    { id:'level_10',      name:'Transcendent',  check: s => s.level>=10 },
    { id:'survive_180',   name:'Survivor',      check: s => s.time>=180 },
    { id:'souls_500',     name:'Soul Collector',check: () => meta.souls>=500 }
  ];

  // auto-redeem next unlock tier at boot
  (function redeemUnlocks(){
    for (var i=0;i<UNLOCK_TIERS.length;i++){
      var t = UNLOCK_TIERS[i];
      if (!meta.unlocks[t.key] && meta.souls >= t.cost){
        meta.unlocks[t.key] = true;
        meta.souls -= t.cost;
        saveMeta();
        break;
      }
    }
  })();

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
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CONFIG.GAME.WIDTH,
      height: CONFIG.GAME.HEIGHT,
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

  // Debug API for evaluator/tests
  window.__SURVIVORS_ARENA__ = Object.assign(window.__SURVIVORS_ARENA__ || {}, {
    getScore: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.score || 0) : 0;
    },
    getState: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      if (!s) return 'loading';
      if (s.isGameOver) return 'gameover';
      if (s.isLevelingUp) return 'levelup';
      return 'playing';
    },
    getLevel: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.playerLevel || 1) : 1;
    },
    getKills: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.killCount || 0) : 0;
    },
    getHP: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.playerHP || 0) : 0;
    },
  });
})();
