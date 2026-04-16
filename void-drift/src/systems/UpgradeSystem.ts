import Phaser from 'phaser';
import { UPGRADES } from '../config';
import type { UpgradeType } from '../config';
import { Upgrade } from '../entities/Upgrade';

export class UpgradeSystem {
  private scene: Phaser.Scene;
  private upgradeGroup: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, upgradeGroup: Phaser.GameObjects.Group) {
    this.scene = scene;
    this.upgradeGroup = upgradeGroup;
  }

  spawnUpgrade(x: number, y: number): void {
    const type = this.randomUpgradeType();
    const orb = new Upgrade(this.scene, x, y, type);
    this.upgradeGroup.add(orb);
  }

  private randomUpgradeType(): UpgradeType {
    const idx = Phaser.Math.Between(0, UPGRADES.TYPES.length - 1);
    return UPGRADES.TYPES[idx];
  }

  update(): void {
    const children = this.upgradeGroup.getChildren() as Upgrade[];
    for (const orb of children) {
      orb.update();
    }
  }
}
