import Phaser from 'phaser';
import { PLAYER, COLORS, DEPTH, GAME, UPGRADES } from '../config';
import type { UpgradeType } from '../config';

export class Player extends Phaser.GameObjects.Container {
  public hp: number = PLAYER.MAX_HP;
  public isInvincible: boolean = false;
  public fireRate: number = PLAYER.FIRE_RATE_MS;
  public bulletDamage: number = PLAYER.BULLET_DAMAGE;
  public moveSpeed: number = PLAYER.SPEED;
  public spreadShotLevel: number = 0;
  public appliedUpgrades: UpgradeType[] = [];

  private rapidFireStacks: number = 0;
  private damageBoostStacks: number = 0;
  private speedBurstStacks: number = 0;

  private lastFireTime: number = 0;
  private shipGraphics!: Phaser.GameObjects.Graphics;
  private engineGlow!: Phaser.GameObjects.Graphics;
  private invincibilityTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this as Phaser.GameObjects.Container);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    this.setDepth(DEPTH.PLAYER);
    this.setSize(PLAYER.SHIP_WIDTH, PLAYER.SHIP_HEIGHT);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setDrag(PLAYER.DRAG, PLAYER.DRAG);
    body.setMaxVelocity(this.moveSpeed * 1.5, this.moveSpeed * 1.5);

    this.drawShip();
    this.drawEngineGlow();
    this.startInvincibility();
  }

  private drawShip(): void {
    this.shipGraphics = this.scene.add.graphics();
    const g = this.shipGraphics;

    g.lineStyle(2, COLORS.PLAYER_CYAN, 1);
    g.fillStyle(COLORS.PLAYER_BLUE, 0.6);
    g.beginPath();
    g.moveTo(0, -18);
    g.lineTo(-14, 14);
    g.lineTo(-8, 10);
    g.lineTo(0, 12);
    g.lineTo(8, 10);
    g.lineTo(14, 14);
    g.closePath();
    g.fillPath();
    g.strokePath();

    g.fillStyle(COLORS.PLAYER_CYAN, 0.8);
    g.fillCircle(0, -2, 4);

    g.lineStyle(1, COLORS.PLAYER_CYAN, 0.5);
    g.strokeCircle(0, -2, 6);

    this.add(g);
  }

  private drawEngineGlow(): void {
    this.engineGlow = this.scene.add.graphics();
    this.add(this.engineGlow);
  }

  private updateEngineGlow(isMoving: boolean): void {
    this.engineGlow.clear();
    if (!isMoving) return;

    const pulse = 0.6 + 0.4 * Math.sin(this.scene.time.now * 0.01);
    this.engineGlow.fillStyle(COLORS.ENGINE_GLOW, 0.4 * pulse);
    this.engineGlow.fillTriangle(-6, 12, 6, 12, 0, 22 + pulse * 6);
    this.engineGlow.fillStyle(COLORS.PLAYER_CYAN, 0.6 * pulse);
    this.engineGlow.fillTriangle(-3, 12, 3, 12, 0, 18 + pulse * 4);
  }

  update(
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key },
    time: number,
    _delta: number,
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let ax = 0;
    let ay = 0;

    if (cursors.left.isDown || wasd.A.isDown) ax -= 1;
    if (cursors.right.isDown || wasd.D.isDown) ax += 1;
    if (cursors.up.isDown || wasd.W.isDown) ay -= 1;
    if (cursors.down.isDown || wasd.S.isDown) ay += 1;

    const len = Math.sqrt(ax * ax + ay * ay);
    if (len > 0) {
      ax /= len;
      ay /= len;
    }

    body.setAcceleration(ax * PLAYER.ACCELERATION, ay * PLAYER.ACCELERATION);
    body.setMaxVelocity(this.moveSpeed * 1.5, this.moveSpeed * 1.5);

    const isMoving = len > 0;
    this.updateEngineGlow(isMoving);

    if (this.isInvincible) {
      this.setAlpha(Math.sin(time * 0.015) > 0 ? 1 : 0.3);
    } else {
      this.setAlpha(1);
    }
  }

  canFire(time: number): boolean {
    return time - this.lastFireTime >= this.fireRate;
  }

  markFired(time: number): void {
    this.lastFireTime = time;
  }

  takeDamage(amount: number): boolean {
    if (this.isInvincible) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.startInvincibility();

    this.shipGraphics.setAlpha(0.2);
    this.scene.time.delayedCall(PLAYER.HIT_FLASH_MS, () => {
      this.shipGraphics.setAlpha(1);
    });

    return this.hp <= 0;
  }

  heal(amount: number): void {
    this.hp = Math.min(PLAYER.MAX_HP, this.hp + amount);
  }

  applyUpgrade(type: UpgradeType): void {
    switch (type) {
      case 'RAPID_FIRE':
        if (this.rapidFireStacks >= UPGRADES.MAX_RAPID_FIRE_STACKS) return;
        this.rapidFireStacks++;
        this.fireRate = Math.max(
          UPGRADES.MIN_FIRE_RATE_MS,
          PLAYER.FIRE_RATE_MS * Math.pow(UPGRADES.RAPID_FIRE_MULTIPLIER, this.rapidFireStacks),
        );
        break;
      case 'SPREAD_SHOT':
        if (this.spreadShotLevel >= UPGRADES.MAX_SPREAD_SHOT_STACKS) return;
        this.spreadShotLevel++;
        break;
      case 'SHIELD':
        this.heal(UPGRADES.SHIELD_RESTORE);
        break;
      case 'DAMAGE_BOOST':
        if (this.damageBoostStacks >= UPGRADES.MAX_DAMAGE_BOOST_STACKS) return;
        this.damageBoostStacks++;
        this.bulletDamage = Math.round(this.bulletDamage * UPGRADES.DAMAGE_BOOST_MULTIPLIER);
        break;
      case 'SPEED_BURST':
        if (this.speedBurstStacks >= UPGRADES.MAX_SPEED_BURST_STACKS) return;
        this.speedBurstStacks++;
        this.moveSpeed = Math.min(300, Math.round(this.moveSpeed * UPGRADES.SPEED_BURST_MULTIPLIER));
        break;
    }
    this.appliedUpgrades.push(type);
  }

  private startInvincibility(): void {
    this.isInvincible = true;
    this.invincibilityTimer?.destroy();
    this.invincibilityTimer = this.scene.time.delayedCall(PLAYER.INVINCIBILITY_MS, () => {
      this.isInvincible = false;
      this.setAlpha(1);
    });
  }

  getWorldPosition(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.x, this.y);
  }

  destroy(fromScene?: boolean): void {
    this.invincibilityTimer?.destroy();
    super.destroy(fromScene);
  }
}
