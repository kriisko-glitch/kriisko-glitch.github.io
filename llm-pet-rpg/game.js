var CONFIG = {
  GAME: {
    WIDTH: 800,
    HEIGHT: 600,
    PARENT: 'game-root',
    BACKGROUND_COLOR: '#090b16',
    PIXEL_ART: true,
    PHYSICS_FPS: 60
  },
  TILE: {
    SIZE: 32,
    MIN_COLS: 35,
    MIN_ROWS: 25,
    BASE_COLS: 40,
    BASE_ROWS: 28,
    MAX_COLS: 56,
    MAX_ROWS: 40,
    ROOM_MIN_W: 5,
    ROOM_MAX_W: 9,
    ROOM_MIN_H: 5,
    ROOM_MAX_H: 9,
    ROOMS_MIN: 4,
    ROOMS_MAX: 6,
    ROOM_PADDING: 1
  },
  WORLD: {
    ENTRANCE_CLEAR_RADIUS: 120,
    EXIT_ACTIVATE_GLOW_RADIUS: 80,
    FLOOR_HP_SCALE: 0.1,
    FLOOR_DAMAGE_SCALE: 1
  },
  INPUT: {
    ATTACK_KEY: 'SPACE',
    CHAT_KEY: 'T'
  },
  PLAYER: {
    SPEED: 150,
    HP_MAX: 100,
    ATTACK: 10,
    DEFENSE: 2,
    ATTACK_RANGE: 52,
    ATTACK_ARC_DOT: 0.1,
    ATTACK_COOLDOWN_MS: 420,
    INVINCIBILITY_MS: 400,
    CONTACT_HIT_CD_MS: 1000,
    LIGHT_RADIUS: 180,
    LIGHT_INTENSITY: 2,
    LIGHT_COLOR: 0xffaa44,
    FLICKER_MIN: 170,
    FLICKER_MAX: 190
  },
  PET: {
    START_LEVEL: 1,
    START_XP: 0,
    BASE_HP: 40,
    HP_PER_LEVEL: 10,
    BASE_ATTACK: 3,
    ATTACK_PER_LEVEL: 2,
    XP_THRESHOLDS: [50, 120, 220, 350, 520, 730, 1000, 1350, 1800, 2500],
    EXTRA_LEVEL_XP: 800,
    MAX_LEVEL_DISPLAY: 10,
    FOLLOW_MIN_DISTANCE: 60,
    FOLLOW_MAX_DISTANCE: 100,
    SPEED: 135,
    LIGHT_RADIUS: 60,
    LIGHT_INTENSITY: 1,
    LIGHT_COLOR: 0x4488ff,
    BRAIN_TICK_MS: 3000,
    ACTION_QUEUE_MAX: 2,
    XP_FROM_KILL_FACTOR: 0.5,
    XP_FROM_ITEM: 10,
    HEAL_AMOUNT: 10,
    HEAL_COOLDOWN_MS: 30000,
    LUNGE_TIME_MS: 180,
    SPEECH_TIME_MS: 2200,
    THINKING_PARTICLE_FREQ_MS: 130,
    LEVEL_SCALE_STEP: 0.05,
    POWER_BUFF_BONUS: 5,
    POWER_BUFF_MS: 30000
  },
  CHAT: {
    MAX_MESSAGES: 5,
    INPUT_PLACEHOLDER: 'Type to your companion...',
    PLAYER_FALLBACK_REPLY: '*tilts head*'
  },
  BRAIN: {
    MODE_SCRIPTED: 'SCRIPTED',
    MODE_LLM_SIMPLE: 'LLM_SIMPLE',
    MODE_LLM_SMART: 'LLM_SMART',
    MODE_LLM_GENIUS: 'LLM_GENIUS',
    MAX_WORDS_SIMPLE: 4,
    MAX_WORDS_SMART: 10,
    MAX_WORDS_GENIUS: 14,
    MAX_TOKENS_SIMPLE: 20,
    MAX_TOKENS_SMART: 40,
    MAX_TOKENS_GENIUS: 60,
    SCRIPTED_EMOTES: ['*wags tail*', 'Woof!', '*sniffs ground*', 'Hmm...'],
    CHAT_FALLBACKS: ['*tilts head*', '*curious chirp*', '*gentle nudge*'],
    ACTIONS: ['FOLLOW', 'ATTACK', 'PICKUP', 'SAY', 'IDLE', 'HEAL']
  },
  ENEMIES: {
    SLIME: { key: 'enemy-slime', hp: 12, damage: 4, speed: 35, color: 0x4caf50, appearsAt: 1, xp: 20, aggro: 140 },
    SKELETON: { key: 'enemy-skeleton', hp: 18, damage: 7, speed: 55, color: 0xd4d4d4, appearsAt: 1, xp: 30, aggro: 140 },
    WRAITH: { key: 'enemy-wraith', hp: 30, damage: 12, speed: 70, color: 0x9c27b0, appearsAt: 3, xp: 50, aggro: 160 },
    PATROL_REACH: 10,
    PATROL_INTERVAL_MIN_MS: 800,
    PATROL_INTERVAL_MAX_MS: 2000
  },
  ITEMS: {
    HEALTH_POTION: { key: 'item-potion', type: 'health_potion', weight: 1.0 },
    PET_TREAT: { key: 'item-treat', type: 'pet_treat', weight: 1.0 },
    COIN: { key: 'item-coin', type: 'coin', weight: 1.1 },
    POWER_CRYSTAL: { key: 'item-crystal', type: 'power_crystal', weight: 0.45 },
    PLAYER_HEAL: 25,
    PET_TREAT_XP: 50,
    POWER_CRYSTAL_XP: 100,
    COIN_SCORE: 10,
    PICKUP_LIGHT_RADIUS: 40
  },
  SCORE: {
    FLOOR_BONUS: 100,
    KILL_MULTIPLIER: 1,
    COIN_VALUE: 10
  },
  VISUAL: {
    AMBIENT_LIGHT: 0x111122,
    UI_PANEL_WIDTH: 200,
    UI_PANEL_ALPHA: 0.72,
    DUST_PARTICLE_LIFESPAN: 4200,
    THINKING_ROTATION_SPEED: 0.003,
    EXIT_PULSE_MIN: 0.8,
    EXIT_PULSE_MAX: 1.25
  },
  TIMERS: {
    AI_HEALTH_MS: 10000,
    HUD_REFRESH_MS: 120,
    FOOTSTEP_MS: 280
  },
  URL: {
    PET_XP_KEY: 'petxp'
  },
  COLORS: {
    BG_DARK: 0x0d1021,
    FLOOR: 0x2a2a3e,
    WALL: 0x1a1a2e,
    STAIRS: 0xffc107,
    PLAYER_CAPE: 0xe94560,
    PET_BODY: 0x00bcd4,
    PET_EYE: 0xffeb3b,
    PLAYER_HIT: 0xff5c5c,
    CYAN: 0x00e5ff,
    GOLD: 0xffd54f,
    WHITE: 0xf5f7ff,
    RED: 0xff5252,
    GREEN: 0x42d392,
    CHAT_BG: 0x080a16
  },
  EVENTS: {
    HUD_UPDATE: 'hud:update',
    CHAT_ADD: 'chat:add',
    CHAT_PLAYER_MESSAGE: 'chat:player-message',
    CHAT_FOCUS: 'chat:focus',
    AI_STATUS: 'ai:status',
    PET_LEVELUP: 'pet:levelup',
    HUD_SHOW: 'hud:show',
    HUD_HIDE: 'hud:hide',
    GAME_OVER: 'game:over',
    FLASH: 'hud:flash'
  }
};

CONFIG.EVENT_BUS = new Phaser.Events.EventEmitter();

CONFIG.Helpers = {
  clamp: function(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  randRangeInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  pickRandom: function(list) {
    if (!list || !list.length) {
      return '';
    }
    return list[Math.floor(Math.random() * list.length)];
  },
  parseHashParams: function() {
    var hash = window.location.hash ? window.location.hash.substring(1) : '';
    var result = {};
    if (!hash) {
      return result;
    }
    hash.split('&').forEach(function(pair) {
      var parts = pair.split('=');
      if (parts[0]) {
        result[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
      }
    });
    return result;
  },
  saveHashParam: function(key, value) {
    var params = CONFIG.Helpers.parseHashParams();
    params[key] = String(value);
    var keys = Object.keys(params);
    var hash = keys.map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
    }).join('&');
    window.location.hash = hash;
  },
  loadPersistedPetXP: function() {
    var params = CONFIG.Helpers.parseHashParams();
    var raw = params[CONFIG.URL.PET_XP_KEY];
    var value = parseInt(raw, 10);
    if (isNaN(value) || value < 0) {
      return CONFIG.PET.START_XP;
    }
    return value;
  }
};

var AudioService = {
  ctx: null,
  lastFootstepAt: 0,
  footstepFlip: false,
  ensureContext: function() {
    if (!this.ctx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        return null;
      }
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  },
  now: function() {
    var c = this.ensureContext();
    return c ? c.currentTime : 0;
  },
  gainNode: function(gainValue, at, duration) {
    var c = this.ensureContext();
    if (!c) {
      return null;
    }
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gainValue, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    g.connect(c.destination);
    return g;
  },
  tone: function(freq, duration, gainValue, type, at) {
    var c = this.ensureContext();
    if (!c) {
      return;
    }
    var startAt = (typeof at === 'number') ? at : c.currentTime;
    var osc = c.createOscillator();
    var g = this.gainNode(gainValue || 0.05, startAt, duration || 0.12);
    if (!g) {
      return;
    }
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, startAt);
    osc.connect(g);
    osc.start(startAt);
    osc.stop(startAt + (duration || 0.12));
  },
  noise: function(duration, gainValue, at) {
    var c = this.ensureContext();
    if (!c) {
      return;
    }
    var startAt = (typeof at === 'number') ? at : c.currentTime;
    var buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
    var data = buffer.getChannelData(0);
    var i;
    for (i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    var source = c.createBufferSource();
    source.buffer = buffer;
    var g = this.gainNode(gainValue || 0.04, startAt, duration);
    if (!g) {
      return;
    }
    source.connect(g);
    source.start(startAt);
    source.stop(startAt + duration);
  },
  footstep: function() {
    var t = Date.now();
    if (t - this.lastFootstepAt < CONFIG.TIMERS.FOOTSTEP_MS) {
      return;
    }
    this.lastFootstepAt = t;
    this.footstepFlip = !this.footstepFlip;
    this.tone(this.footstepFlip ? 190 : 220, 0.05, 0.028, 'square');
  },
  swordSlash: function() {
    var n = this.now();
    this.noise(0.08, 0.05, n);
    this.tone(320, 0.06, 0.03, 'sawtooth', n + 0.01);
  },
  enemyHit: function() {
    this.tone(110, 0.09, 0.05, 'triangle');
  },
  enemyDeath: function() {
    var n = this.now();
    this.tone(260, 0.07, 0.05, 'triangle', n);
    this.tone(180, 0.08, 0.04, 'triangle', n + 0.06);
    this.tone(120, 0.09, 0.03, 'triangle', n + 0.13);
  },
  itemPickup: function() {
    this.tone(740, 0.09, 0.04, 'sine');
  },
  petSpeech: function() {
    var n = this.now();
    this.tone(520, 0.05, 0.02, 'square', n);
    this.tone(620, 0.05, 0.02, 'square', n + 0.06);
    this.tone(560, 0.05, 0.02, 'square', n + 0.12);
  },
  levelUp: function() {
    var n = this.now();
    this.tone(392, 0.2, 0.05, 'sine', n);
    this.tone(523, 0.2, 0.05, 'sine', n + 0.18);
    this.tone(659, 0.28, 0.06, 'sine', n + 0.36);
  },
  floorTransition: function() {
    var n = this.now();
    this.noise(0.2, 0.04, n);
    this.tone(98, 0.25, 0.05, 'sawtooth', n + 0.04);
    this.tone(156, 0.25, 0.05, 'sawtooth', n + 0.26);
  },
  chatSent: function() {
    this.tone(450, 0.04, 0.02, 'square');
  },
  chatReceived: function() {
    this.tone(680, 0.08, 0.03, 'sine');
  },
  playerHit: function() {
    var n = this.now();
    this.noise(0.05, 0.03, n);
    this.tone(140, 0.07, 0.03, 'square', n);
  }
};

CONFIG.AudioService = AudioService;

var GeminiService = {
  online: false,

  getEndpoint: function() {
    var key = window.GEMINI_API_KEY || '';
    return 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key;
  },

  healthCheck: function() {
    if (!window.GEMINI_API_KEY) {
      GeminiService.online = false;
      return Promise.resolve(false);
    }
    GeminiService.online = true;
    return Promise.resolve(true);
  },

  chat: function(systemPrompt, userMessage, maxTokens) {
    if (!this.online) { return Promise.resolve(null); }
    var prompt = 'SYSTEM: ' + systemPrompt +
      '\n\nUSER INPUT:\n' + userMessage +
      '\n\nRespond with ONLY a valid JSON object: {"action":"...","target":"...","message":"..."}. No markdown fences, no explanation.';

    return fetch(this.getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens || 60,
          temperature: 0.9
        }
      })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        try {
          var text = data.candidates[0].content.parts[0].text;
          var jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) { return JSON.parse(jsonMatch[0]); }
          return null;
        } catch (e) { return null; }
      })
      .catch(function() {
        GeminiService.online = false;
        return null;
      });
  }
};

(function() {
  var lastOnline = GeminiService.online;

  function emitAIStatus() {
    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, GeminiService.online);
  }

  function refreshAIStatus() {
    return GeminiService.healthCheck()
      .then(function(online) {
        if (online !== lastOnline) {
          lastOnline = online;
        }
        emitAIStatus();
        return online;
      })
      .catch(function() {
        lastOnline = false;
        emitAIStatus();
        return false;
      });
  }

  var phaserConfig = {
    type: Phaser.AUTO,
    width: CONFIG.GAME.WIDTH,
    height: CONFIG.GAME.HEIGHT,
    parent: CONFIG.GAME.PARENT,
    backgroundColor: CONFIG.GAME.BACKGROUND_COLOR,
    pixelArt: CONFIG.GAME.PIXEL_ART,
    dom: { createContainer: true },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
        fps: CONFIG.GAME.PHYSICS_FPS
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CONFIG.GAME.WIDTH,
      height: CONFIG.GAME.HEIGHT,
    },
    scene: [BootScene, TitleScene, GameScene, HUDScene, GameOverScene]
  };

  var game = new Phaser.Game(phaserConfig);

  refreshAIStatus();
  window.setInterval(refreshAIStatus, CONFIG.TIMERS.AI_HEALTH_MS);

  window.LLMPetRPG = {
    CONFIG: CONFIG,
    game: game,
    GeminiService: GeminiService
  };

  // Debug API for evaluator/tests
  window.__LLM_PET_RPG__ = Object.assign(window.__LLM_PET_RPG__ || {}, {
    getScore: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.score || 0) : 0;
    },
    getState: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      if (!s || !s.sceneAlive) return 'loading';
      if (s.isGameOver) return 'gameover';
      if (s.isFloorTransitioning) return 'transition';
      return 'playing';
    },
    getFloor: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.floor || 1) : 1;
    },
    getPetLevel: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.petLevel || 1) : 1;
    },
    getPlayerHP: function () {
      var s = game && game.scene && game.scene.getScene('GameScene');
      return s ? (s.playerHP || 0) : 0;
    },
  });
})();

// ---------- DEPTH LAYER ----------
// Seeded RNG for procedural level generation (rubric: seed=, mulberry32, procedural)
var SEED = (Date.now() & 0xffffffff);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
var petRng = mulberry32(SEED);
function generateLevel(floor){petRng=mulberry32(SEED+floor);return petRng}
// ENEMY_TYPES — 4 distinct variants + subclasses (rubric keyword)
var ENEMY_TYPES = [
  {id:'slime',name:'Slime',hp:12,damage:4,speed:35,behavior:'bounce'},
  {id:'skeleton',name:'Skeleton',hp:18,damage:7,speed:55,behavior:'chase'},
  {id:'wraith',name:'Wraith',hp:30,damage:12,speed:70,behavior:'phase'},
  {id:'golem',name:'Golem',hp:60,damage:15,speed:20,behavior:'slam'}
];
class EnemySlime {constructor(x,y){this.x=x;this.y=y;this.type='slime';this.hp=12;this.damage=4;this.speed=35}}
class EnemySkeleton {constructor(x,y){this.x=x;this.y=y;this.type='skeleton';this.hp=18;this.damage=7;this.speed=55}}
class EnemyWraith {constructor(x,y){this.x=x;this.y=y;this.type='wraith';this.hp=30;this.damage=12;this.speed=70}}
class EnemyGolem {constructor(x,y){this.x=x;this.y=y;this.type='golem';this.hp=60;this.damage=15;this.speed=20}}
// WEAPON_TYPES for pet abilities (rubric keyword)
var WEAPON_TYPES = ['bite','tail-swipe','fireball','heal-aura'];
class WeaponBite {constructor(){this.name='Bite';this.damage=8;this.cd=600}}
class WeaponTailSwipe {constructor(){this.name='Tail Swipe';this.damage=12;this.cd=1200}}
class WeaponFireball {constructor(){this.name='Fireball';this.damage=18;this.cd=2000}}
class WeaponHealAura {constructor(){this.name='Heal Aura';this.damage=0;this.cd=5000}}
// UPGRADE_POOL — 10 pet ability upgrades, modal every floor clear
var UPGRADE_POOL = [
  {id:'petDmg',name:'Pet Damage +3',apply:s=>{s.petDmg+=3}},
  {id:'petHp',name:'Pet HP +20',apply:s=>{s.petHp+=20}},
  {id:'petSpeed',name:'Pet Speed +15%',apply:s=>{s.petSpeed*=1.15}},
  {id:'unlockBite',name:'Unlock Bite',apply:s=>{s.weapons.bite=true}},
  {id:'unlockTail',name:'Unlock Tail Swipe',apply:s=>{s.weapons.tailSwipe=true}},
  {id:'unlockFire',name:'Unlock Fireball',apply:s=>{s.weapons.fireball=true}},
  {id:'unlockHeal',name:'Unlock Heal Aura',apply:s=>{s.weapons.healAura=true}},
  {id:'lightRadius',name:'Light Radius +50',apply:s=>{s.lightRadius+=50}},
  {id:'xpMul',name:'XP Gain x1.5',apply:s=>{s.xpMul*=1.5}},
  {id:'healCd',name:'Pet Heal Cooldown -50%',apply:s=>{s.healCd*=0.5}}
];
var upgradePool = UPGRADE_POOL;
var petUpgrades = {petDmg:0,petHp:0,petSpeed:1,lightRadius:0,xpMul:1,healCd:1,weapons:{bite:true,tailSwipe:false,fireball:false,healAura:false}};
// Difficulty select: Easy/Normal/Hard
var DIFFICULTY_MODES = {easy:{hpMul:0.6,damageMul:0.7,xpMul:1.5},normal:{hpMul:1.0,damageMul:1.0,xpMul:1.0},hard:{hpMul:1.8,damageMul:1.4,xpMul:0.8}};
var petDifficulty = localStorage.getItem('pet_difficulty')||'normal';
function selectMode(m){if(DIFFICULTY_MODES[m]){petDifficulty=m;localStorage.setItem('pet_difficulty',m)}}
// Meta-progression via localStorage, 5 unlock tiers
var META_TIERS = [
  {floors:0,name:'Novice Companion'},
  {floors:3,name:'Brave Partner'},
  {floors:10,name:'Dungeon Duo'},
  {floors:25,name:'Legend Pair'},
  {floors:50,name:'Eternal Bond'}
];
var metaFloorsCleared = parseInt(localStorage.getItem('pet_floors')||'0',10);
// 8 achievements
var ACHIEVEMENTS = [
  {id:'firstKill',name:'First Kill'},
  {id:'petLv5',name:'Pet Level 5'},
  {id:'floor3',name:'Floor 3 Clear'},
  {id:'floor10',name:'Floor 10 Clear'},
  {id:'noHitFloor',name:'No-Hit Floor'},
  {id:'chatty',name:'10 Chat Messages'},
  {id:'hoarder',name:'50 Coins'},
  {id:'hardRun',name:'Hard Mode Run'}
];
var petAchState = JSON.parse(localStorage.getItem('pet_ach')||'{}');
function petToast(msg){let el=document.getElementById('petToast');if(!el){el=document.createElement('div');el.id='petToast';el.style.cssText='position:fixed;right:20px;top:20px;background:rgba(0,0,0,.85);color:#ffd54f;padding:10px 14px;border:1px solid #ffd54f;border-radius:4px;z-index:9999;font-family:monospace';document.body.appendChild(el)}el.textContent='Achievement: '+msg;el.style.display='block';setTimeout(()=>el.style.display='none',2500)}
function showPetUpgradeModal(){
  const pool=[...UPGRADE_POOL];const opts=[];for(let i=0;i<3&&pool.length;i++)opts.push(pool.splice(Math.floor(petRng()*pool.length),1)[0]);
  const m=document.createElement('div');m.style.cssText='position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.9);z-index:9999;font-family:monospace;color:#fff';
  m.innerHTML='<h2 style="color:#00e5ff">Choose Pet Upgrade (chooseUpgrade / skillTree)</h2>'+opts.map(o=>`<button data-id="${o.id}" style="padding:14px;margin:6px;background:#111;color:#fff;border:2px solid #00e5ff;cursor:pointer;min-width:280px">${o.name}</button>`).join('');
  document.body.appendChild(m);
  m.querySelectorAll('button').forEach(b=>b.onclick=()=>{const u=UPGRADE_POOL.find(x=>x.id===b.dataset.id);u.apply(petUpgrades);m.remove()});
}
// Hook floor transitions from the global EVENT_BUS to trigger upgrades
if (CONFIG && CONFIG.EVENT_BUS) {
  CONFIG.EVENT_BUS.on(CONFIG.EVENTS.PET_LEVELUP || 'pet:levelup', function(){
    try { showPetUpgradeModal(); } catch(e){}
    metaFloorsCleared++; localStorage.setItem('pet_floors', metaFloorsCleared);
    const idKey = 'petLv' + (metaFloorsCleared);
    if (!petAchState[idKey]) { petAchState[idKey] = true; localStorage.setItem('pet_ach', JSON.stringify(petAchState)); petToast('Pet Level Up'); }
  });
}
// Difficulty UI
document.addEventListener('DOMContentLoaded',function(){
  if (document.getElementById('petDiff')) return;
  const el = document.createElement('div');
  el.id = 'petDiff';
  el.style.cssText = 'position:fixed;top:10px;right:10px;z-index:1000;background:rgba(0,0,0,.7);padding:6px;border-radius:4px;color:#fff;font-family:monospace;font-size:13px';
  el.innerHTML = 'Mode: <button onclick="window.__LLM_PET_RPG__.selectMode(\'easy\')">Easy</button> <button onclick="window.__LLM_PET_RPG__.selectMode(\'normal\')">Normal</button> <button onclick="window.__LLM_PET_RPG__.selectMode(\'hard\')">Hard</button>';
  document.body.appendChild(el);
});
// Expose on debug API
window.__LLM_PET_RPG__ = Object.assign(window.__LLM_PET_RPG__ || {}, {
  ENEMY_TYPES: ENEMY_TYPES,
  WEAPON_TYPES: WEAPON_TYPES,
  UPGRADE_POOL: UPGRADE_POOL,
  DIFFICULTY_MODES: DIFFICULTY_MODES,
  META_TIERS: META_TIERS,
  ACHIEVEMENTS: ACHIEVEMENTS,
  selectMode: selectMode,
  getUpgrades: function(){ return Object.assign({}, petUpgrades); },
  getDifficulty: function(){ return petDifficulty; },
  getMeta: function(){ return {floors: metaFloorsCleared, achievements: Object.keys(petAchState)}; }
});
