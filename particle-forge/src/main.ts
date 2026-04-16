import { TICK_MS, SAVE_INTERVAL_MS, formatNumber } from './config';
import { ELEMENTS } from './data/elements';
import { ResearchDef } from './data/upgrades';
import { GameState, createGameState } from './state/GameState';
import { SaveManager } from './state/SaveManager';
import { calculateOfflineProgress } from './state/OfflineProgress';
import { MergeSystem } from './systems/MergeSystem';
import { AutomationSystem, ShopItemDef } from './systems/AutomationSystem';
import { ResearchSystem } from './systems/ResearchSystem';
import { PrestigeSystem } from './systems/PrestigeSystem';
import { Renderer } from './rendering/Renderer';
import { ParticleVFX } from './rendering/ParticleVFX';
import { ElementSpriteRenderer } from './rendering/ElementSprite';
import { HUD } from './ui/HUD';
import { ShopPanel } from './ui/ShopPanel';
import { ResearchPanel } from './ui/ResearchPanel';
import { PrestigePanel } from './ui/PrestigePanel';
import { Notifications } from './ui/Notifications';
import { SoundManager } from './audio/SoundManager';

let state: GameState;
const saveManager = new SaveManager();
const sound = new SoundManager();

let renderer: Renderer;
let vfx: ParticleVFX;
let sprites: ElementSpriteRenderer;
let hud: HUD;
let shop: ShopPanel;
let researchPanel: ResearchPanel;
let prestigePanel: PrestigePanel;
let notifications: Notifications;

let lastTime = 0;
let accumulator = 0;
let saveTimer = 0;
let prevHighest = 0;

function init(): void {
  const canvas = document.getElementById('forge-canvas') as HTMLCanvasElement;
  const gameRoot = document.getElementById('game-root')!;
  const hudEl = document.getElementById('hud')!;
  const shopEl = document.getElementById('shop-panel')!;
  const accBtn = document.getElementById('accelerate-btn')!;

  renderer = new Renderer(canvas);
  vfx = new ParticleVFX();
  sprites = new ElementSpriteRenderer();
  sprites.resize(renderer.width, renderer.height);

  const saved = saveManager.load();
  state = saved ?? createGameState();
  prevHighest = state.highestUnlocked;

  if (saved) {
    const offline = calculateOfflineProgress(state);
    if (offline) {
      showOfflineBanner(gameRoot, offline.hGained, offline.mergesDone, offline.elapsedMs);
    }
  }

  hud = new HUD(hudEl, onMerge);
  shop = new ShopPanel(shopEl, onBuy, onTogglePanel);
  researchPanel = new ResearchPanel(gameRoot, onResearch);
  prestigePanel = new PrestigePanel(gameRoot, onPrestige);
  notifications = new Notifications(gameRoot);

  accBtn.addEventListener('click', onAccelerate);
  accBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    onAccelerate();
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    vfx.spawnClickBurst(x, y);
    onAccelerate();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (!prestigePanel.visible) researchPanel.toggle();
    }
    if (e.key === 'p' || e.key === 'P') {
      if (!researchPanel.visible) prestigePanel.toggle();
    }
    if (e.key === 'Escape') {
      researchPanel.hide();
      prestigePanel.hide();
    }
    if (e.key === 'm' || e.key === 'M') {
      sound.toggleMute();
    }
  });

  window.addEventListener('resize', () => {
    renderer.resize();
    sprites.resize(renderer.width, renderer.height);
  });

  window.addEventListener('beforeunload', () => {
    saveManager.save(state);
  });

  exposeTestAPI();

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function onAccelerate(): void {
  const power = AutomationSystem.getClickPower(state);
  const multiplier = AutomationSystem.getProductionMultiplier(state);
  const total = power * multiplier;
  state.elements[0] += total;
  state.totalCreated[0] += total;
  state.totalHProduced += total;
  state.totalClicks++;
  sound.playClick();

  const btn = document.getElementById('accelerate-btn')!;
  const rect = btn.getBoundingClientRect();
  notifications.show(
    `+${formatNumber(total)} H`,
    ELEMENTS[0].color,
    rect.left + rect.width / 2,
    rect.top - 10,
  );
}

function onMerge(elementIndex: number): void {
  const prevUnlocked = state.highestUnlocked;
  if (MergeSystem.doMerge(elementIndex, state)) {
    sound.playMerge();
    const elem = ELEMENTS[elementIndex];
    const cx = renderer.width * (0.3 + Math.random() * 0.4);
    const cy = renderer.height * (0.3 + Math.random() * 0.3);
    vfx.spawnBurst(cx, cy, elem.color);
    sprites.notifyMerge(elementIndex, cx, cy);

    notifications.show(
      `+1 ${elem.symbol}`,
      elem.color,
      window.innerWidth / 2,
      window.innerHeight / 2 - 40,
    );

    if (state.highestUnlocked > prevUnlocked) {
      sound.playUnlock();
      notifications.show(
        `${elem.name} Discovered!`,
        elem.color,
        window.innerWidth / 2,
        window.innerHeight / 2 - 80,
      );
    }
  }
}

function onBuy(item: ShopItemDef): void {
  if (AutomationSystem.buy(item, state)) {
    sound.playBuy();
    notifications.show(
      `${item.name}!`,
      '#00ccff',
      window.innerWidth - 140,
      80,
    );
  }
}

function onTogglePanel(panel: 'research' | 'prestige'): void {
  if (panel === 'research') {
    prestigePanel.hide();
    researchPanel.toggle();
    researchPanel.update(state);
  } else {
    researchPanel.hide();
    prestigePanel.toggle();
    prestigePanel.update(state);
  }
}

function onResearch(def: ResearchDef): void {
  if (ResearchSystem.doResearch(def, state)) {
    sound.playResearch();
    notifications.show(
      `${def.name}!`,
      '#cc88ff',
      window.innerWidth / 2,
      window.innerHeight / 2 - 40,
    );
    researchPanel.update(state);
  }
}

function onPrestige(): void {
  if (!PrestigeSystem.canPrestige(state)) return;
  const totalMerges = state.totalMerges;
  const gain = PrestigeSystem.getDarkEnergyGain(state);
  state = PrestigeSystem.doPrestige(state);
  sound.playPrestige();
  vfx.spawnBurst(renderer.width / 2, renderer.height / 2, '#cc88ff', 40);
  notifications.show(
    `Big Bang! +${formatNumber(gain)} DE`,
    '#cc88ff',
    window.innerWidth / 2,
    window.innerHeight / 2,
  );
  prevHighest = state.highestUnlocked;

  const lb = (window as unknown as Record<string, unknown>).KriiskoLeaderboard as {
    qualifies: (g: string, s: number) => boolean;
    promptInitials: (g: string, s: number, cb: (i: string | null) => void) => void;
    submit: (g: string, s: number, i: string) => void;
    show: (g: string) => void;
  } | undefined;
  if (lb && totalMerges > 0 && lb.qualifies('particle-forge', totalMerges)) {
    lb.promptInitials('particle-forge', totalMerges, (initials) => {
      if (initials) lb.submit('particle-forge', totalMerges, initials);
      lb.show('particle-forge');
    });
  }
}

function update(dt: number): void {
  AutomationSystem.update(state, dt);

  if (state.highestUnlocked > prevHighest) {
    for (let i = prevHighest + 1; i <= state.highestUnlocked; i++) {
      const elem = ELEMENTS[i];
      sound.playUnlock();
      notifications.show(
        `${elem.name} Discovered!`,
        elem.color,
        window.innerWidth / 2,
        window.innerHeight / 2 - 80,
      );
      const cx = renderer.width * (0.3 + Math.random() * 0.4);
      const cy = renderer.height * (0.3 + Math.random() * 0.3);
      vfx.spawnBurst(cx, cy, elem.color, 24);
      sprites.notifyMerge(i, cx, cy);
    }
    prevHighest = state.highestUnlocked;
  }
}

function render(dtMs: number): void {
  renderer.clear();
  renderer.drawStars(dtMs / 1000);
  sprites.update(dtMs / 1000);
  sprites.draw(renderer.ctx);
  vfx.update(dtMs);
  vfx.draw(renderer.ctx);
}

function loop(timestamp: number): void {
  const frameDt = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += frameDt;

  const dtSec = TICK_MS / 1000;
  let ticks = 0;
  while (accumulator >= TICK_MS && ticks < 10) {
    update(dtSec);
    accumulator -= TICK_MS;
    ticks++;
  }
  if (accumulator > TICK_MS * 10) accumulator = 0;

  render(frameDt);
  hud.update(state);
  shop.update(state);
  researchPanel.update(state);
  prestigePanel.update(state);
  notifications.update(timestamp);

  saveTimer += frameDt;
  if (saveTimer >= SAVE_INTERVAL_MS) {
    saveManager.save(state);
    saveTimer = 0;
  }

  requestAnimationFrame(loop);
}

function showOfflineBanner(root: HTMLElement, hGained: number, merges: number, elapsedMs: number): void {
  const hours = Math.floor(elapsedMs / 3_600_000);
  const mins = Math.floor((elapsedMs % 3_600_000) / 60_000);
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const banner = document.createElement('div');
  banner.className = 'panel offline-banner';
  banner.innerHTML = `
    <div class="panel-title" style="text-align:center">Welcome Back!</div>
    <p style="margin:8px 0;font-size:14px;">You were away for <span class="mono" style="color:#00ffc8">${timeStr}</span></p>
    <p class="mono" style="color:#00ffff;">+${formatNumber(hGained)} H forged</p>
    ${merges > 0 ? `<p class="mono" style="color:#ffcc44;">${formatNumber(merges)} merges completed</p>` : ''}
  `;
  root.appendChild(banner);
}

function exposeTestAPI(): void {
  const api = {
    getState: () => ({
      elements: Object.fromEntries(ELEMENTS.map((e, i) => [e.symbol, state.elements[i]])),
      perSecond: AutomationSystem.getHPerSec(state),
      totalMerges: state.totalMerges,
      prestigeCount: state.prestigeCount,
    }),
    getElement: (symbol: string) => {
      const idx = ELEMENTS.findIndex(e => e.symbol === symbol);
      if (idx < 0) return null;
      return { count: state.elements[idx], unlocked: idx <= state.highestUnlocked };
    },
    addElement: (symbol: string, count: number) => {
      const idx = ELEMENTS.findIndex(e => e.symbol === symbol);
      if (idx < 0) return;
      state.elements[idx] += count;
      state.totalCreated[idx] += count;
      if (idx > state.highestUnlocked) state.highestUnlocked = idx;
    },
    triggerMerge: () => {
      for (let i = state.highestUnlocked + 1; i >= 1; i--) {
        if (MergeSystem.doMerge(i, state)) return;
      }
    },
    getSaveData: () => saveManager.export(state),
  };

  (window as unknown as Record<string, unknown>).__PARTICLEFORGE__ = api;
}

document.addEventListener('DOMContentLoaded', init);
