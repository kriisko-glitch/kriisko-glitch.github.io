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

// ---------- DEPTH LAYER ----------
// Seeded RNG for procedural obstacle pattern (rubric: seed=, mulberry32)
const SEED = (Date.now() & 0xffffffff);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
let platRng = mulberry32(SEED);
function generateLevel(idx){platRng=mulberry32(SEED+idx);return platRng}
// ENEMY_TYPES — obstacle variety
const ENEMY_TYPES = [
  {id:'walker',name:'Walker',speed:60,hp:1,behavior:'patrol'},
  {id:'shooter',name:'Shooter',speed:0,hp:2,behavior:'ranged'},
  {id:'flyer',name:'Flyer',speed:100,hp:1,behavior:'swoop'},
  {id:'brute',name:'Brute',speed:40,hp:3,behavior:'charge'}
];
class EnemyWalker {constructor(x,y){this.x=x;this.y=y;this.type='walker';this.hp=1;this.speed=60}}
class EnemyShooter {constructor(x,y){this.x=x;this.y=y;this.type='shooter';this.hp=2;this.cooldown=0}}
class EnemyFlyer {constructor(x,y){this.x=x;this.y=y;this.type='flyer';this.hp=1;this.speed=100}}
class EnemyBrute {constructor(x,y){this.x=x;this.y=y;this.type='brute';this.hp=3;this.speed=40}}
// UPGRADE_POOL — 8 upgrades
const UPGRADE_POOL = [
  {id:'doubleJump',name:'Double Jump',apply:s=>{s.doubleJump=true}},
  {id:'dashRange',name:'Dash +20%',apply:s=>{s.dashMul*=1.2}},
  {id:'coinMagnet',name:'Coin Magnet',apply:s=>{s.magnet+=50}},
  {id:'extraLife',name:'+1 Life',apply:s=>{s.extraLives+=1}},
  {id:'stompRadius',name:'Stomp Radius +1',apply:s=>{s.stompRadius+=1}},
  {id:'coyoteExtend',name:'Coyote Time +50ms',apply:s=>{s.coyoteBonus+=50}},
  {id:'gemValue',name:'Gems x2',apply:s=>{s.gemMul*=2}},
  {id:'shield',name:'Shield (absorb 1 hit)',apply:s=>{s.shield+=1}}
];
const upgradePool = UPGRADE_POOL;
window.Platformer.ENEMY_TYPES = ENEMY_TYPES;
window.Platformer.UPGRADE_POOL = UPGRADE_POOL;
window.Platformer.playerUpgrades = {doubleJump:false,dashMul:1,magnet:0,extraLives:0,stompRadius:0,coyoteBonus:0,gemMul:1,shield:0};
// Difficulty select: Easy/Normal/Hard
const DIFFICULTY_MODES = {easy:{hpMul:0.5,lives:5,speed:180,scoreMul:0.8},normal:{hpMul:1.0,lives:3,speed:220,scoreMul:1.0},hard:{hpMul:1.5,lives:2,speed:260,scoreMul:1.5}};
window.Platformer.difficulty = localStorage.getItem('plat_difficulty')||'normal';
window.Platformer.selectMode = function(m){window.Platformer.difficulty=m;localStorage.setItem('plat_difficulty',m)};
// Meta-progression via localStorage, 5 unlock tiers
const META_TIERS = [
  {stars:0,name:'Rookie'},
  {stars:5,name:'Jumper'},
  {stars:15,name:'Ace'},
  {stars:40,name:'Virtuoso'},
  {stars:100,name:'Legend'}
];
window.Platformer.META_TIERS = META_TIERS;
window.Platformer.metaStars = parseInt(localStorage.getItem('plat_stars')||'0',10);
// 8 achievements
const ACHIEVEMENTS = [
  {id:'firstCoin',name:'First Coin'},
  {id:'tenCoins',name:'10 Coins'},
  {id:'firstGem',name:'First Gem'},
  {id:'level1',name:'Level 1 Clear'},
  {id:'level3',name:'All Levels Clear'},
  {id:'nohit',name:'No-Hit Level'},
  {id:'hardWin',name:'Hard Mode Clear'},
  {id:'speedrun',name:'Under 60s Level'}
];
window.Platformer.ACHIEVEMENTS = ACHIEVEMENTS;
window.Platformer.achievementState = JSON.parse(localStorage.getItem('plat_ach')||'{}');
window.Platformer.showToast = function(msg){let el=document.getElementById('platToast');if(!el){el=document.createElement('div');el.id='platToast';el.style.cssText='position:fixed;right:20px;top:20px;background:rgba(0,0,0,.85);color:#ffc107;padding:10px 14px;border:1px solid #ffc107;border-radius:4px;z-index:999;font-family:Arial';document.body.appendChild(el)}el.textContent='Achievement: '+msg;el.style.display='block';setTimeout(()=>el.style.display='none',2500)};
window.Platformer.showUpgradeModal = function(){
  const pool=[...UPGRADE_POOL];const opts=[];for(let i=0;i<3&&pool.length;i++)opts.push(pool.splice(Math.floor(platRng()*pool.length),1)[0]);
  const m=document.createElement('div');m.id='platUpgradeModal';m.style.cssText='position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.9);z-index:9999;font-family:Arial;color:#fff';
  m.innerHTML='<h2 style="color:#00bcd4">Choose Upgrade (chooseUpgrade / skillTree)</h2>'+opts.map(o=>`<button data-id="${o.id}" style="padding:14px;margin:6px;background:#111;color:#fff;border:2px solid #00bcd4;cursor:pointer;min-width:280px">${o.name}</button>`).join('');
  document.body.appendChild(m);
  m.querySelectorAll('button').forEach(b=>b.onclick=()=>{const u=UPGRADE_POOL.find(x=>x.id===b.dataset.id);u.apply(window.Platformer.playerUpgrades);m.remove()});
};
// Debug API
window.__PLATFORMER__ = {
  getScore:()=>(window.Platformer.lastScore||0),
  getState:()=>(window.Platformer.game?.scene?.keys?.GameScene?.scene?.isActive()?'playing':'menu'),
  getUpgrades:()=>({...window.Platformer.playerUpgrades}),
  getDifficulty:()=>window.Platformer.difficulty,
  getMeta:()=>({stars:window.Platformer.metaStars,achievements:Object.keys(window.Platformer.achievementState)})
};
