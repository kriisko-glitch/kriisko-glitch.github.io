import Phaser from 'phaser';
import { COLORS, DEPTH, UPGRADES } from '../config';
import type { UpgradeType } from '../config';

const UPGRADE_COLORS: Record<UpgradeType, number> = {
  RAPID_FIRE: COLORS.RAPID_FIRE_COLOR,
  SPREAD_SHOT: COLORS.SPREAD_SHOT_COLOR,
  DAMAGE_BOOST: COLORS.DAMAGE_COLOR,
  SHIELD: COLORS.SHIELD_COLOR,
  SPEED_BURST: COLORS.SPEED_COLOR,
};

const UPGRADE_LABELS: Record<UpgradeType, string> = {
  RAPID_FIRE: 'RF',
  SPREAD_SHOT: 'SS',
  DAMAGE_BOOST: 'DM',
  SHIELD: 'SH',
  SPEED_BURST: 'SP',
};

export class Upgrade extends Phaser.GameObjects.Container {
  public upgradeType: UpgradeType;
  public body!: Phaser.Physics.Arcade.Body;
  private orbGfx!: Phaser.GameObjects.Graphics;
  private spawnTime: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: UpgradeType) {
    super(scene, x, y);
    this.upgradeType = type;
    this.spawnTime = scene.time.now;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.UPGRADES);
    this.setSize(UPGRADES.ORB_SIZE * 2, UPGRADES.ORB_SIZE * 2);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(UPGRADES.ORB_SIZE, -UPGRADES.ORB_SIZE, -UPGRADES.ORB_SIZE);
    body.setAllowGravity(false);

    this.drawOrb();
  }

  private drawOrb(): void {
    const color = UPGRADE_COLORS[this.upgradeType];

    this.orbGfx = this.scene.add.graphics();
    this.orbGfx.fillStyle(color, 0.2);
    this.orbGfx.fillCircle(0, 0, UPGRADES.ORB_SIZE);
    this.orbGfx.fillStyle(color, 0.6);
    this.orbGfx.fillCircle(0, 0, UPGRADES.ORB_SIZE * 0.6);
    this.orbGfx.fillStyle(COLORS.WHITE, 0.8);
    this.orbGfx.fillCircle(0, 0, UPGRADES.ORB_SIZE * 0.25);
    this.add(this.orbGfx);

    const label = this.scene.add.text(0, 0, UPGRADE_LABELS[this.upgradeType], {
      fontFamily: 'Trebuchet MS, sans-serif',
      fontSize: '8px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add(label);
  }

  update(): void {
    const elapsed = this.scene.time.now - this.spawnTime;
    const pulse = 1 + 0.2 * Math.sin(elapsed * UPGRADES.ORB_PULSE_SPEED);
    this.setScale(pulse);
  }
}
