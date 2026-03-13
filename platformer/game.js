const CONFIG = {
  GAME: {
    WIDTH: 480,
    HEIGHT: 640,
    WORLD_WIDTH: 4800,
    WORLD_HEIGHT: 640,
    LEVEL_COUNT: 3
  },
  PLAYER: {
    WIDTH: 28,
    HEIGHT: 36,
    MOVE_SPEED: 220,
    JUMP_VELOCITY: -580,
    GRAVITY: 900,
    COYOTE_MS: 80,
    JUMP_BUFFER_MS: 100,
    WALL_SLIDE_SPEED: 170,
    WALL_JUMP_X: 280,
    WALL_JUMP_Y: -540
  },
  PLATFORM: {
    GROUND_Y: 560,
    MIN_WIDTH: 80,
    MAX_WIDTH: 200,
    MIN_GAP: 60,
    MAX_GAP: 180
  },
  GAMEPLAY: {
    START_LIVES: 3,
    COINS_PER_LEVEL: 50,
    GEMS_PER_LEVEL: 5,
    COIN_SCORE: 10,
    GEM_SCORE: 100,
    STOMP_SCORE: 50,
    ENEMY_PROJECTILE_COOLDOWN: 2500,
    LOOP_SPEED_INCREMENT: 0.12
  },
  COLORS: {
    SKY_TOP: 0x0d0d1a,
    SKY_BOTTOM: 0x1a1a4e,
    GROUND: 0x1a3320,
    GROUND_EDGE: 0x2d5a3d,
    ACCENT: 0xe94560,
    COIN: 0xffc107,
    GEM: 0x00bcd4,
    WHITE: 0xfafafa
  },
  ZONES: [
    { x: 0, tint: 0x12331f, alpha: 0.1, background: "#0f1826" },
    { x: 1600, tint: 0x2f2624, alpha: 0.12, background: "#1b1528" },
    { x: 3200, tint: 0x183458, alpha: 0.12, background: "#14243a" }
  ],
  STORAGE: {
    HIGH_SCORE_KEY: "kriisko_platformer_high_score"
  }
};

class ProceduralAudio {
  constructor() {
    this.master = 0.18;
    this.ctx = null;
    this.supported = typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
    if (this.supported) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctor();
    }
  }

  unlock() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => undefined);
    }
  }

  now() {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  osc({
    freq = 440,
    type = "sine",
    duration = 0.1,
    volume = 0.2,
    attack = 0.005,
    release = 0.05,
    offset = 0,
    sweepTo = null
  }) {
    if (!this.ctx) {
      return;
    }
    const t0 = this.now() + offset;
    const t1 = t0 + duration;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweepTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t1);
    }

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume * this.master), t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1 + release);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t1 + release + 0.01);
  }

  noise({ duration = 0.06, volume = 0.2, offset = 0 } = {}) {
    if (!this.ctx) {
      return;
    }
    const sampleRate = this.ctx.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      const envelope = 1 - i / frameCount;
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const start = this.now() + offset;

    src.buffer = buffer;
    gain.gain.setValueAtTime(volume * this.master, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(start);
    src.stop(start + duration + 0.02);
  }

  jump() {
    this.unlock();
    this.osc({ freq: 520, sweepTo: 440, duration: 0.08, type: "sine", volume: 0.38, release: 0.03 });
  }

  land() {
    this.unlock();
    this.noise({ duration: 0.06, volume: 0.24 });
  }

  coin() {
    this.unlock();
    this.osc({ freq: 880, duration: 0.1, type: "sine", volume: 0.3, release: 0.06 });
  }

  gem() {
    this.unlock();
    this.osc({ freq: 660, duration: 0.09, type: "triangle", volume: 0.25, offset: 0.0, release: 0.05 });
    this.osc({ freq: 880, duration: 0.09, type: "triangle", volume: 0.25, offset: 0.08, release: 0.05 });
    this.osc({ freq: 1175, duration: 0.12, type: "triangle", volume: 0.27, offset: 0.16, release: 0.06 });
  }

  stomp() {
    this.unlock();
    this.osc({ freq: 220, duration: 0.08, type: "square", volume: 0.35, release: 0.03, sweepTo: 170 });
  }

  hurt() {
    this.unlock();
    this.osc({ freq: 200, duration: 0.2, type: "sawtooth", volume: 0.22, sweepTo: 120 });
    this.osc({ freq: 288, duration: 0.2, type: "square", volume: 0.16, sweepTo: 170 });
  }

  levelClear() {
    this.unlock();
    const notes = [523, 659, 784, 988, 1175];
    notes.forEach((freq, i) => {
      this.osc({ freq, duration: 0.14, type: "triangle", volume: 0.25, offset: i * 0.09, release: 0.07 });
    });
  }

  gameOver() {
    this.unlock();
    const notes = [523, 466, 392, 330, 262];
    notes.forEach((freq, i) => {
      this.osc({ freq, duration: 0.12, type: "sawtooth", volume: 0.2, offset: i * 0.1, release: 0.08 });
    });
  }
}

window.Platformer = window.Platformer || {};
window.Platformer.CONFIG = CONFIG;
window.Platformer.AUDIO = new ProceduralAudio();

const highScore = Number(localStorage.getItem(CONFIG.STORAGE.HIGH_SCORE_KEY) || 0);
window.Platformer.HIGH_SCORE = Number.isFinite(highScore) ? highScore : 0;

const phaserConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: CONFIG.GAME.WIDTH,
  height: CONFIG.GAME.HEIGHT,
  backgroundColor: "#0d0d1a",
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: CONFIG.PLAYER.GRAVITY },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CONFIG.GAME.WIDTH,
    height: CONFIG.GAME.HEIGHT
  },
  render: {
    preserveDrawingBuffer: true,
  },
  scene: [BootScene, GameScene, HUDScene, GameOverScene]
};

window.Platformer.game = new Phaser.Game(phaserConfig);
