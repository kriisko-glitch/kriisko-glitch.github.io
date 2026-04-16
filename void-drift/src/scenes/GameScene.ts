import Phaser from 'phaser';
import {
  GAME, COLORS, DEPTH, PLAYER, ENEMIES, WAVES, UPGRADES, STARFIELD,
  CAMERA, PARTICLES as PARTICLE_CFG, UI,
} from '../config';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { Upgrade } from '../entities/Upgrade';
import { WaveManager } from '../systems/WaveManager';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { HUD } from '../ui/HUD';
import { UpgradeCard } from '../ui/UpgradeCard';
import { audio } from '../audio/ProceduralAudio';

interface StarLayer {
  stars: { gfx: Phaser.GameObjects.Graphics; speed: number }[];
}

export class GameScene extends Phaser.Scene {
  public player!: Player;
  public score: number = 0;
  public gameState: 'playing' | 'gameover' = 'playing';

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  private playerBullets!: Phaser.GameObjects.Group;
  private enemyBullets!: Phaser.GameObjects.Group;
  private enemyGroup!: Phaser.GameObjects.Group;
  private upgradeGroup!: Phaser.GameObjects.Group;

  private waveManager!: WaveManager;
  private upgradeSystem!: UpgradeSystem;
  private particleSystem!: ParticleSystem;
  private hud!: HUD;
  private upgradeCard!: UpgradeCard;

  private starLayers: StarLayer[] = [];
  private gameStartTime: number = 0;
  private engineTrailTimer: number = 0;
  private waveAnnouncementActive: boolean = false;
  private fireKey!: Phaser.Input.Keyboard.Key;
  private manualFirePressed: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.gameState = 'playing';

    this.cameras.main.setBackgroundColor(COLORS.BG);
    this.physics.world.setBounds(0, 0, GAME.WIDTH, GAME.HEIGHT);

    this.createStarfield();
    this.createGroups();
    this.createPlayer();
    this.setupInput();
    this.setupCollisions();

    this.particleSystem = new ParticleSystem(this);
    this.upgradeSystem = new UpgradeSystem(this, this.upgradeGroup);
    this.waveManager = new WaveManager(this, this.enemyGroup, (wave) => {
      this.announceWave(wave);
      audio.waveStart();
    });

    this.hud = new HUD(this);
    this.upgradeCard = new UpgradeCard(this);

    (window as any).__gameAPI = {
      ...((window as any).__gameAPI || {}),
      fire: () => { this.manualFirePressed = true; },
    };
    this.events.once('shutdown', () => {
      const api = (window as any).__gameAPI;
      if (api && typeof api === 'object') {
        delete api.fire;
      }
      this.manualFirePressed = false;
    });

    this.gameStartTime = this.time.now;
    this.waveManager.startNextWave(this.time.now);
  }

  private createStarfield(): void {
    const layers = [
      { count: STARFIELD.FAR_COUNT, speed: STARFIELD.FAR_SPEED, sizeMin: STARFIELD.FAR_SIZE_MIN, sizeMax: STARFIELD.FAR_SIZE_MAX, color: COLORS.STAR_FAR, alphaMin: 0.15, alphaMax: 0.4, depth: DEPTH.STARFIELD_FAR },
      { count: STARFIELD.MID_COUNT, speed: STARFIELD.MID_SPEED, sizeMin: STARFIELD.MID_SIZE_MIN, sizeMax: STARFIELD.MID_SIZE_MAX, color: COLORS.STAR_MID, alphaMin: 0.3, alphaMax: 0.6, depth: DEPTH.STARFIELD_MID },
      { count: STARFIELD.NEAR_COUNT, speed: STARFIELD.NEAR_SPEED, sizeMin: STARFIELD.NEAR_SIZE_MIN, sizeMax: STARFIELD.NEAR_SIZE_MAX, color: COLORS.STAR_NEAR, alphaMin: 0.5, alphaMax: 0.9, depth: DEPTH.STARFIELD_NEAR },
    ];

    for (const layer of layers) {
      const stars: { gfx: Phaser.GameObjects.Graphics; speed: number }[] = [];
      for (let i = 0; i < layer.count; i++) {
        const gfx = this.add.graphics();
        gfx.setDepth(layer.depth);
        const x = Phaser.Math.Between(0, GAME.WIDTH);
        const y = Phaser.Math.Between(0, GAME.HEIGHT);
        gfx.setPosition(x, y);

        const size = Phaser.Math.Between(layer.sizeMin, layer.sizeMax);
        const alpha = Phaser.Math.FloatBetween(layer.alphaMin, layer.alphaMax);
        gfx.fillStyle(layer.color, alpha);
        gfx.fillCircle(0, 0, size);

        stars.push({ gfx, speed: layer.speed });
      }
      this.starLayers.push({ stars });
    }
  }

  private updateStarfield(delta: number): void {
    const dt = delta / 1000;
    for (const layer of this.starLayers) {
      for (const star of layer.stars) {
        star.gfx.y += star.speed * dt;
        if (star.gfx.y > GAME.HEIGHT + 10) {
          star.gfx.y = -10;
          star.gfx.x = Phaser.Math.Between(0, GAME.WIDTH);
        }
      }
    }
  }

  private createGroups(): void {
    this.playerBullets = this.add.group({ classType: Bullet, runChildUpdate: false });
    this.enemyBullets = this.add.group({ classType: Bullet, runChildUpdate: false });
    this.enemyGroup = this.add.group({ runChildUpdate: false });
    this.upgradeGroup = this.add.group({ runChildUpdate: false });
  }

  private createPlayer(): void {
    this.player = new Player(this, GAME.WIDTH / 2, GAME.HEIGHT / 2);
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.manualFirePressed = false;
  }

  private setupCollisions(): void {
    const playerAsCollider = this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType;

    this.physics.add.overlap(
      this.playerBullets,
      this.enemyGroup,
      this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      playerAsCollider,
      this.enemyGroup,
      this.onPlayerHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.enemyBullets,
      playerAsCollider,
      this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      playerAsCollider,
      this.upgradeGroup,
      this.onPlayerPickupUpgrade as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  update(time: number, delta: number): void {
    if (this.gameState !== 'playing') return;

    this.updateStarfield(delta);
    this.player.update(this.cursors, this.wasd, time, delta);

    this.handleShooting(time);
    this.updateEnemies(time, delta);
    this.updateBullets();
    this.handleEnemyShooting(time);
    this.upgradeSystem.update();
    this.particleSystem.update(time, delta);
    this.waveManager.update(time, delta);

    this.updateEngineTrail(time, delta);

    if (this.waveManager.shouldSpawnNextWave()) {
      const timeSurvived = this.waveManager.getTimeSurvived();
      this.score += Math.floor(timeSurvived * WAVES.SURVIVAL_BONUS_PER_SECOND);
      this.waveManager.startNextWave(time);
    }

    const elapsed = (time - this.gameStartTime) / 1000;
    this.hud.updateHP(this.player.hp);
    this.hud.updateScore(this.score);
    this.hud.updateWave(this.waveManager.currentWave);
    this.hud.updateTimer(elapsed);
  }

  private updateEngineTrail(_time: number, delta: number): void {
    this.engineTrailTimer += delta;
    if (this.engineTrailTimer >= PARTICLE_CFG.ENGINE_TRAIL_FREQUENCY) {
      this.engineTrailTimer = 0;
      const body = (this.player as any).body as Phaser.Physics.Arcade.Body;
      const speed = body.velocity.length();
      if (speed > 30) {
        this.particleSystem.spawnTrail(this.player.x, this.player.y + 14);
      }
    }
  }

  private handleShooting(time: number): void {
    const spaceDown = this.fireKey.isDown;
    const manualFire = this.manualFirePressed;
    this.manualFirePressed = false;

    if (!spaceDown && !manualFire) return;
    if (!this.player.canFire(time)) return;
    const activeBullets = this.playerBullets.getChildren().filter(b => b.active).length;
    if (activeBullets >= UPGRADES.MAX_BULLETS_GLOBAL) return;

    const target = this.findNearestEnemy();
    if (!target) return;

    this.player.markFired(time);

    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;

    this.fireBullet(nx, ny, 0);

    if (this.player.spreadShotLevel > 0) {
      const angleRad = UPGRADES.SPREAD_SHOT_ANGLE_DEG * (Math.PI / 180);
      for (let s = 0; s < this.player.spreadShotLevel; s++) {
        const spread = angleRad * (s + 1);
        this.fireBullet(
          nx * Math.cos(spread) - ny * Math.sin(spread),
          nx * Math.sin(spread) + ny * Math.cos(spread),
          0,
        );
        this.fireBullet(
          nx * Math.cos(-spread) - ny * Math.sin(-spread),
          nx * Math.sin(-spread) + ny * Math.cos(-spread),
          0,
        );
      }
    }

    audio.shoot();
  }

  private fireBullet(nx: number, ny: number, _offset: number): void {
    let bullet = this.playerBullets.getChildren().find(b => !b.active) as Bullet | undefined;
    if (!bullet) {
      bullet = new Bullet(this);
      this.playerBullets.add(bullet);
    }
    bullet.fire(
      this.player.x,
      this.player.y,
      nx * PLAYER.BULLET_SPEED,
      ny * PLAYER.BULLET_SPEED,
      'player',
      this.player.bulletDamage,
    );
  }

  private findNearestEnemy(): Enemy | null {
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    if (enemies.length === 0) return null;

    let nearest: Enemy | null = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearest = enemy;
      }
    }

    return nearest;
  }

  private updateEnemies(time: number, delta: number): void {
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      enemy.setTarget(this.player.x, this.player.y);
      enemy.update(time, delta);
    }
  }

  private updateBullets(): void {
    const playerBullets = this.playerBullets.getChildren() as Bullet[];
    for (const b of playerBullets) {
      b.preUpdate();
    }
    const enemyBullets = this.enemyBullets.getChildren() as Bullet[];
    for (const b of enemyBullets) {
      b.preUpdate();
    }
  }

  private handleEnemyShooting(time: number): void {
    const enemies = this.enemyGroup.getChildren() as Enemy[];
    for (const enemy of enemies) {
      if (!enemy.active || !enemy.canFire(time)) continue;
      enemy.markFired(time);

      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      const speed = enemy.config.bulletSpeed ?? ENEMIES.CRUISER.BULLET_SPEED;
      const dmg = enemy.config.bulletDamage ?? ENEMIES.CRUISER.BULLET_DAMAGE;

      let bullet = this.enemyBullets.getChildren().find(b => !b.active) as Bullet | undefined;
      if (!bullet) {
        bullet = new Bullet(this);
        this.enemyBullets.add(bullet);
      }
      bullet.fire(enemy.x, enemy.y, nx * speed, ny * speed, 'enemy', dmg);
    }
  }

  private onBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const bullet = bulletObj as unknown as Bullet;
    const enemy = enemyObj as unknown as Enemy;

    if (!bullet.active || !enemy.active) return;

    bullet.deactivate();

    const dead = enemy.takeDamage(bullet.damage);
    if (dead) {
      this.score += enemy.config.points;
      this.particleSystem.explode(enemy.x, enemy.y, this.getEnemyColor(enemy.enemyType));
      audio.enemyDeath();

      const dropCount = enemy.config.dropCount ?? 1;
      for (let i = 0; i < dropCount; i++) {
        if (Math.random() < enemy.config.dropChance) {
          const ox = Phaser.Math.Between(-15, 15);
          const oy = Phaser.Math.Between(-15, 15);
          this.upgradeSystem.spawnUpgrade(enemy.x + ox, enemy.y + oy);
        }
      }

      this.enemyGroup.remove(enemy, true, true);
    }
  }

  private onPlayerHitEnemy(
    playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const _player = playerObj as unknown as Player;
    const enemy = enemyObj as unknown as Enemy;

    if (!enemy.active) return;

    const dead = this.player.takeDamage(enemy.config.ramDamage);
    if (dead) {
      this.gameOver();
      return;
    }

    audio.playerHit();
    this.cameras.main.shake(CAMERA.SHAKE_DURATION_MS, CAMERA.SHAKE_INTENSITY);
  }

  private onEnemyBulletHitPlayer(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const bullet = bulletObj as unknown as Bullet;
    if (!bullet.active) return;

    bullet.deactivate();

    const dead = this.player.takeDamage(bullet.damage);
    if (dead) {
      this.gameOver();
      return;
    }

    audio.playerHit();
    this.cameras.main.shake(CAMERA.SHAKE_DURATION_MS, CAMERA.SHAKE_INTENSITY);
  }

  private onPlayerPickupUpgrade(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    upgradeObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const orb = upgradeObj as unknown as Upgrade;
    if (!orb.active) return;

    this.player.applyUpgrade(orb.upgradeType);
    this.upgradeCard.show(orb.upgradeType);
    audio.upgradeCollect();

    this.upgradeGroup.remove(orb, true, true);
  }

  private getEnemyColor(type: string): number {
    switch (type) {
      case 'drone': return COLORS.DRONE_COLOR;
      case 'bruiser': return COLORS.BRUISER_COLOR;
      case 'cruiser': return COLORS.CRUISER_COLOR;
      default: return COLORS.EXPLOSION_OUTER;
    }
  }

  private announceWave(wave: number): void {
    if (this.waveAnnouncementActive) return;
    this.waveAnnouncementActive = true;

    const cx = GAME.WIDTH / 2;
    const cy = GAME.HEIGHT / 2;

    const text = this.add.text(cx, cy, `WAVE ${wave}`, {
      fontFamily: UI.FONT_FAMILY,
      fontSize: '48px',
      color: '#00e5ff',
      fontStyle: 'bold',
      stroke: '#003344',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.OVERLAY).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1 },
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          alpha: 0,
          scale: 1.3,
          delay: WAVES.ANNOUNCE_DURATION_MS - 800,
          duration: 400,
          onComplete: () => {
            text.destroy();
            this.waveAnnouncementActive = false;
          },
        });
      },
    });
  }

  private gameOver(): void {
    this.gameState = 'gameover';

    this.particleSystem.explode(this.player.x, this.player.y, COLORS.PLAYER_CYAN, 24);

    this.time.delayedCall(800, () => {
      this.particleSystem.destroy();
      this.hud.destroy();

      this.scene.start('GameOverScene', {
        score: this.score,
        wave: this.waveManager.currentWave,
        elapsed: (this.time.now - this.gameStartTime) / 1000,
        upgrades: [...this.player.appliedUpgrades],
      });
    });
  }

  getEnemyCount(): number {
    return this.enemyGroup.getLength();
  }

  spawnEnemy(type: 'drone' | 'bruiser' | 'cruiser'): void {
    const configs: Record<string, { hp: number; speed: number; ramDamage: number; points: number; dropChance: number; size: number; fireRateMs?: number; bulletSpeed?: number; bulletDamage?: number }> = {
      drone: { hp: ENEMIES.DRONE.HP, speed: ENEMIES.DRONE.SPEED, ramDamage: ENEMIES.DRONE.RAM_DAMAGE, points: ENEMIES.DRONE.POINTS, dropChance: ENEMIES.DRONE.DROP_CHANCE, size: ENEMIES.DRONE.SIZE },
      bruiser: { hp: ENEMIES.BRUISER.HP, speed: ENEMIES.BRUISER.SPEED, ramDamage: ENEMIES.BRUISER.RAM_DAMAGE, points: ENEMIES.BRUISER.POINTS, dropChance: ENEMIES.BRUISER.DROP_CHANCE, size: ENEMIES.BRUISER.SIZE },
      cruiser: { hp: ENEMIES.CRUISER.HP, speed: ENEMIES.CRUISER.SPEED, ramDamage: ENEMIES.CRUISER.RAM_DAMAGE, points: ENEMIES.CRUISER.POINTS, dropChance: ENEMIES.CRUISER.DROP_CHANCE, size: ENEMIES.CRUISER.SIZE, fireRateMs: ENEMIES.CRUISER.FIRE_RATE_MS, bulletSpeed: ENEMIES.CRUISER.BULLET_SPEED, bulletDamage: ENEMIES.CRUISER.BULLET_DAMAGE },
    };
    const edge = Phaser.Math.Between(0, 3);
    let x: number, y: number;
    const margin = WAVES.SPAWN_MARGIN;
    switch (edge) {
      case 0: x = Phaser.Math.Between(0, GAME.WIDTH); y = -margin; break;
      case 1: x = GAME.WIDTH + margin; y = Phaser.Math.Between(0, GAME.HEIGHT); break;
      case 2: x = Phaser.Math.Between(0, GAME.WIDTH); y = GAME.HEIGHT + margin; break;
      default: x = -margin; y = Phaser.Math.Between(0, GAME.HEIGHT); break;
    }
    const enemy = new Enemy(this, x, y, type, configs[type]);
    this.enemyGroup.add(enemy);
  }

  killPlayer(): void {
    this.player.hp = 0;
    this.gameOver();
  }
}
