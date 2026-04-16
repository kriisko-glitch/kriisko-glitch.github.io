import Phaser from 'phaser';
import { COLORS, DEPTH } from '../config';

export type BulletOwner = 'player' | 'enemy';

export class Bullet extends Phaser.GameObjects.Graphics {
  public owner: BulletOwner = 'player';
  public damage: number = 20;
  public body!: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene) {
    super(scene);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.BULLETS);
    this.setActive(false);
    this.setVisible(false);
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    owner: BulletOwner,
    damage: number,
  ): void {
    this.owner = owner;
    this.damage = damage;
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);

    this.clear();
    const color = owner === 'player' ? COLORS.BULLET_PLAYER : COLORS.BULLET_ENEMY;
    const glowColor = owner === 'player' ? COLORS.PLAYER_CYAN : COLORS.BULLET_ENEMY;

    this.fillStyle(glowColor, 0.3);
    this.fillCircle(0, 0, 6);
    this.fillStyle(color, 0.8);
    this.fillCircle(0, 0, 3);
    this.fillStyle(COLORS.WHITE, 1);
    this.fillCircle(0, 0, 1.5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(4, -4, -4);
    body.setVelocity(vx, vy);
    body.setAllowGravity(false);
  }

  preUpdate(): void {
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const { x, y } = body.position;
    const margin = 20;
    const scene = this.scene;
    if (
      x < -margin ||
      x > scene.scale.width + margin ||
      y < -margin ||
      y > scene.scale.height + margin
    ) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.stop();
  }
}
