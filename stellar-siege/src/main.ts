import * as THREE from 'three';
import { EffectComposer, RenderPass, BloomEffect, EffectPass } from 'postprocessing';

import { InputManager, type InputAction } from './systems/InputManager.ts';
import { WaveManager, type WaveSpawn } from './systems/WaveManager.ts';
import { checkSphereCollision } from './systems/CollisionSystem.ts';

import { Player } from './entities/Player.ts';
import { Enemy } from './entities/Enemy.ts';
import { Laser } from './entities/Laser.ts';
import { Explosion } from './entities/Explosion.ts';
import { Powerup, type PowerupType } from './entities/Powerup.ts';

import { Starfield } from './visuals/Starfield.ts';
import { EngineTrail } from './visuals/EngineTrail.ts';

import { HUD } from './ui/HUD.ts';

type GameState = 'menu' | 'playing' | 'wave-intro' | 'gameover';

// ── Scene setup ──────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000011, 0.003);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 6, 18);
camera.lookAt(0, 0, -20);

// ── Lighting ─────────────────────────────────────────────────
const ambient = new THREE.AmbientLight(0x111133, 0.4);
scene.add(ambient);

const sunLight = new THREE.DirectionalLight(0x6699ff, 1.2);
sunLight.position.set(-50, 80, 30);
scene.add(sunLight);

// ── Post-processing ──────────────────────────────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new BloomEffect({
  luminanceThreshold: 0.3,
  luminanceSmoothing: 0.4,
  intensity: 1.5,
});
composer.addPass(new EffectPass(camera, bloom));

// ── Game objects ─────────────────────────────────────────────
const player = new Player();
scene.add(player.group);

const starfield = new Starfield(scene);
const engineTrail = new EngineTrail();
scene.add(engineTrail.line);

const hud = new HUD();
const input = new InputManager(renderer.domElement);
const waveManager = new WaveManager();

const lasers: Laser[] = [];
const enemies: Enemy[] = [];
const explosions: Explosion[] = [];
const powerups: Powerup[] = [];

let gameState: GameState = 'menu';
let clock = new THREE.Clock();

const SCORE_PER_KILL: Record<string, number> = {
  drone: 10,
  fighter: 25,
  cruiser: 50,
};

// ── Spawning ─────────────────────────────────────────────────
function spawnWaveEnemies(spawns: WaveSpawn[]): void {
  for (const s of spawns) {
    for (let i = 0; i < s.count; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 30;
      const z = -80 - Math.random() * 60;
      const enemy = new Enemy(s.type, new THREE.Vector3(x, y, z));
      enemies.push(enemy);
      scene.add(enemy.object3D);
      scene.add(enemy.light);
    }
  }
}

function spawnPowerup(position: THREE.Vector3): void {
  if (Math.random() > 0.3) return;
  const types: PowerupType[] = ['health', 'rapidfire', 'shield'];
  const type = types[Math.floor(Math.random() * types.length)];
  const pu = new Powerup(position.clone(), type);
  powerups.push(pu);
  scene.add(pu.mesh);
  scene.add(pu.light);
}

function createExplosion(pos: THREE.Vector3, color: number): void {
  const exp = new Explosion(pos.clone(), color);
  explosions.push(exp);
  scene.add(exp.points);
  scene.add(exp.light);
}

// ── Cleanup helpers ──────────────────────────────────────────
function removeLaser(laser: Laser, idx: number): void {
  scene.remove(laser.mesh);
  laser.dispose();
  lasers.splice(idx, 1);
}

function removeEnemy(enemy: Enemy, idx: number): void {
  scene.remove(enemy.object3D);
  scene.remove(enemy.light);
  enemy.dispose();
  enemies.splice(idx, 1);
}

function removePowerup(pu: Powerup, idx: number): void {
  scene.remove(pu.mesh);
  scene.remove(pu.light);
  pu.dispose();
  powerups.splice(idx, 1);
}

function removeExplosion(exp: Explosion, idx: number): void {
  scene.remove(exp.points);
  scene.remove(exp.light);
  exp.dispose();
  explosions.splice(idx, 1);
}

function clearAll(): void {
  for (let i = lasers.length - 1; i >= 0; i--) removeLaser(lasers[i], i);
  for (let i = enemies.length - 1; i >= 0; i--) removeEnemy(enemies[i], i);
  for (let i = powerups.length - 1; i >= 0; i--) removePowerup(powerups[i], i);
  for (let i = explosions.length - 1; i >= 0; i--) removeExplosion(explosions[i], i);
}

// ── Game state management ────────────────────────────────────
function startGame(): void {
  clearAll();
  player.reset();
  waveManager.wave = 0;
  waveManager.state = 'idle';
  waveManager.enemiesAlive = 0;
  hud.reset();
  gameState = 'playing';
  beginNextWave();
}

function beginNextWave(): void {
  const spawns = waveManager.startNextWave();
  hud.updateWave(waveManager.wave);
  hud.showWaveAnnounce(waveManager.wave);
  gameState = 'wave-intro';

  // Enemies will be spawned when announce finishes
  (waveManager as any)._pendingSpawns = spawns;
}

function gameOver(): void {
  gameState = 'gameover';
  hud.showGameOver(player.score);
}

function restart(): void {
  hud.hideGameOver();
  startGame();
}

// ── Update ───────────────────────────────────────────────────
function update(dt: number, elapsed: number): void {
  starfield.update(elapsed);
  engineTrail.update(player.group.position);

  if (gameState === 'gameover') return;

  // Wave state machine
  const waveEvent = waveManager.update(dt);
  if (waveEvent === 'spawn') {
    hud.hideWaveAnnounce();
    const pending = (waveManager as any)._pendingSpawns as WaveSpawn[];
    if (pending) {
      spawnWaveEnemies(pending);
      (waveManager as any)._pendingSpawns = null;
    }
    gameState = 'playing';
  } else if (waveEvent === 'next') {
    beginNextWave();
    return;
  }

  // Player
  const newLaser = player.update(dt, input);
  if (newLaser) {
    lasers.push(newLaser);
    scene.add(newLaser.mesh);
  }

  hud.updateHP(player.hp, player.maxHp);
  hud.updateScore(player.score);
  hud.showShield(player.shielded);

  // Lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].update(dt);
    if (!lasers[i].alive) {
      removeLaser(lasers[i], i);
    }
  }

  // Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const shouldFire = enemy.update(dt, player.group.position);

    if (shouldFire) {
      const dir = enemy.getFireDirection(player.group.position);
      const laser = new Laser(enemy.object3D.position.clone(), dir, false);
      lasers.push(laser);
      scene.add(laser.mesh);
    }

    if (!enemy.alive) {
      // Collision kill (rammed player)
      player.takeDamage(15);
      createExplosion(enemy.object3D.position, 0xff8800);
      waveManager.onEnemyKilled();
      removeEnemy(enemy, i);
      if (!player.alive) { gameOver(); return; }
    }
  }

  // Laser-enemy collisions
  for (let li = lasers.length - 1; li >= 0; li--) {
    const laser = lasers[li];
    if (!laser.isPlayerLaser) continue;

    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const enemy = enemies[ei];
      if (checkSphereCollision(laser.mesh.position, laser.collisionRadius, enemy.object3D.position, enemy.collisionRadius)) {
        enemy.takeDamage(1);
        laser.alive = false;
        removeLaser(laser, li);

        if (!enemy.alive) {
          player.score += SCORE_PER_KILL[enemy.type] || 10;
          const enemyColor = enemy.type === 'drone' ? 0xff2222 : enemy.type === 'fighter' ? 0xff8800 : 0xaa44ff;
          createExplosion(enemy.object3D.position, enemyColor);
          spawnPowerup(enemy.object3D.position);
          waveManager.onEnemyKilled();
          removeEnemy(enemy, ei);
        }
        break;
      }
    }
  }

  // Enemy laser-player collisions
  for (let li = lasers.length - 1; li >= 0; li--) {
    const laser = lasers[li];
    if (laser.isPlayerLaser) continue;

    if (checkSphereCollision(laser.mesh.position, laser.collisionRadius, player.group.position, player.collisionRadius)) {
      player.takeDamage(10);
      laser.alive = false;
      removeLaser(laser, li);
      if (!player.alive) { gameOver(); return; }
    }
  }

  // Powerup collection
  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    pu.update(dt);

    if (checkSphereCollision(player.group.position, player.collisionRadius, pu.mesh.position, pu.collisionRadius)) {
      switch (pu.type) {
        case 'health': player.heal(25); break;
        case 'rapidfire': player.rapidFire = true; player.rapidFireTimer = 8; break;
        case 'shield': player.shielded = true; break;
      }
      removePowerup(pu, i);
    }
  }

  // Explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update(dt);
    if (!explosions[i].alive) {
      removeExplosion(explosions[i], i);
    }
  }

  // Camera follow
  const targetCamPos = new THREE.Vector3(
    player.group.position.x * 0.2,
    6 + player.group.position.y * 0.15,
    18
  );
  camera.position.lerp(targetCamPos, 3 * dt);
  camera.lookAt(player.group.position.x * 0.3, player.group.position.y * 0.3, -20);
}

// ── Restart listener ─────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && gameState === 'gameover') {
    restart();
  }
  if (gameState === 'menu') {
    startGame();
  }
});

renderer.domElement.addEventListener('click', () => {
  if (gameState === 'menu') {
    startGame();
  }
});

// ── Resize ───────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ── Game loop ────────────────────────────────────────────────
function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;
  update(dt, elapsed);
  composer.render();
}

// ── Debug API ────────────────────────────────────────────────
declare global {
  interface Window {
    __STELLAR_SIEGE__: {
      getState: () => GameState;
      getScore: () => number;
      getHP: () => number;
      getWave: () => number;
      getEnemyCount: () => number;
      getPlayerPos: () => { x: number; y: number; z: number };
      getEnemies: () => Array<{ id: string; pos: { x: number; y: number; z: number }; hp: number; type: string }>;
      getPowerups: () => Array<{ type: string; pos: { x: number; y: number; z: number } }>;
      injectInput: (action: InputAction) => void;
      restart: () => void;
    };
  }
}

window.__STELLAR_SIEGE__ = {
  getState: () => gameState,
  getScore: () => player.score,
  getHP: () => player.hp,
  getWave: () => waveManager.wave,
  getEnemyCount: () => enemies.length,
  getPlayerPos: () => {
    const p = player.group.position;
    return { x: p.x, y: p.y, z: p.z };
  },
  getEnemies: () => enemies.map(e => ({
    id: e.id,
    pos: { x: e.object3D.position.x, y: e.object3D.position.y, z: e.object3D.position.z },
    hp: e.hp,
    type: e.type,
  })),
  getPowerups: () => powerups.map(p => ({
    type: p.type,
    pos: { x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z },
  })),
  injectInput: (action: InputAction) => input.injectAction(action),
  restart: () => restart(),
};

// ── Start ────────────────────────────────────────────────────
clock = new THREE.Clock();
startGame();
animate();
