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
    OLLAMA_HEALTH_MS: 10000,
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

var OllamaService = {
  BASE_URL: 'http://localhost:11434',
  MODEL: 'qwen2.5:1.5b',
  online: false,

  healthCheck: function() {
    return fetch(this.BASE_URL + '/api/version')
      .then(function(r) { return r.json(); })
      .then(function() {
        OllamaService.online = true;
        return true;
      })
      .catch(function() {
        OllamaService.online = false;
        return false;
      });
  },

  chat: function(systemPrompt, userMessage, maxTokens) {
    if (!this.online) { return Promise.resolve(null); }
    return fetch(this.BASE_URL + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: false,
        format: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['FOLLOW', 'ATTACK', 'PICKUP', 'SAY', 'IDLE', 'HEAL'] },
            target: { type: 'string' },
            message: { type: 'string' }
          },
          required: ['action', 'target', 'message']
        },
        options: { num_predict: maxTokens || 60 }
      })
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        try { return JSON.parse(data.message.content); }
        catch (e) { return null; }
      })
      .catch(function() { return null; });
  }
};

(function() {
  var lastOnline = OllamaService.online;

  function emitAIStatus() {
    CONFIG.EVENT_BUS.emit(CONFIG.EVENTS.AI_STATUS, OllamaService.online);
  }

  function refreshAIStatus() {
    return OllamaService.healthCheck()
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
  window.setInterval(refreshAIStatus, CONFIG.TIMERS.OLLAMA_HEALTH_MS);

  window.LLMPetRPG = {
    CONFIG: CONFIG,
    game: game,
    OllamaService: OllamaService
  };
})();
