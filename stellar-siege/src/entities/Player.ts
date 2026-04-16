import * as THREE from 'three';
import { InputManager } from '../systems/InputManager.ts';
import { Laser } from './Laser.ts';

const MOVE_SPEED = 30;
const MOVE_BOUNDS = 25;
const FIRE_INTERVAL = 1 / 8;
const RAPID_FIRE_INTERVAL = 1 / 16;

export class Player {
  group: THREE.Group;
  hp = 100;
  maxHp = 100;
  score = 0;
  shielded = false;
  rapidFire = false;
  rapidFireTimer = 0;
  alive = true;
  readonly collisionRadius = 2;

  private fireCooldown = 0;
  private engineLight: THREE.PointLight;

  constructor() {
    this.group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3388cc,
      emissive: 0x112244,
      emissiveIntensity: 0.3,
      metalness: 0.8,
      roughness: 0.2,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 4),
      bodyMat
    );

    const noseMat = new THREE.MeshStandardMaterial({
      color: 0x44aaee,
      emissive: 0x224466,
      emissiveIntensity: 0.3,
      metalness: 0.9,
      roughness: 0.1,
    });
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.5, 4),
      noseMat
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -2.5;

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x2266aa,
      emissive: 0x112244,
      emissiveIntensity: 0.2,
      metalness: 0.7,
      roughness: 0.3,
    });

    const wingL = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.8), wingMat);
    wingL.position.set(-1.8, 0, 0.3);
    wingL.rotation.z = -0.15;

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.8), wingMat);
    wingR.position.set(1.8, 0, 0.3);
    wingR.rotation.z = 0.15;

    this.engineLight = new THREE.PointLight(0xff6600, 3, 15);
    this.engineLight.position.set(0, 0, 2.5);

    this.group.add(body, nose, wingL, wingR, this.engineLight);
  }

  update(dt: number, input: InputManager): Laser | null {
    if (!this.alive) return null;

    let dx = 0, dy = 0;
    if (input.moveLeft) dx -= 1;
    if (input.moveRight) dx += 1;
    if (input.moveUp) dy += 1;
    if (input.moveDown) dy -= 1;

    this.group.position.x += dx * MOVE_SPEED * dt;
    this.group.position.y += dy * MOVE_SPEED * dt;

    this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -MOVE_BOUNDS, MOVE_BOUNDS);
    this.group.position.y = THREE.MathUtils.clamp(this.group.position.y, -MOVE_BOUNDS * 0.6, MOVE_BOUNDS * 0.6);

    const tiltX = -dy * 0.25;
    const tiltZ = -dx * 0.35;
    this.group.rotation.x = THREE.MathUtils.lerp(this.group.rotation.x, tiltX, 5 * dt);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, tiltZ, 5 * dt);

    const aimTiltX = input.mouseY * 0.15;
    const aimTiltZ = -input.mouseX * 0.15;
    this.group.rotation.x += aimTiltX;
    this.group.rotation.z += aimTiltZ;

    this.engineLight.intensity = 2.5 + Math.sin(Date.now() * 0.01) * 0.5;

    if (this.rapidFire) {
      this.rapidFireTimer -= dt;
      if (this.rapidFireTimer <= 0) {
        this.rapidFire = false;
      }
    }

    this.fireCooldown -= dt;
    if (input.firing && this.fireCooldown <= 0) {
      const interval = this.rapidFire ? RAPID_FIRE_INTERVAL : FIRE_INTERVAL;
      this.fireCooldown = interval;
      const pos = this.group.position.clone().add(new THREE.Vector3(0, 0, -3));
      const dir = new THREE.Vector3(input.mouseX * 0.3, input.mouseY * 0.3, -1).normalize();
      return new Laser(pos, dir, true);
    }

    return null;
  }

  takeDamage(amount: number): void {
    if (this.shielded) {
      this.shielded = false;
      return;
    }
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  reset(): void {
    this.hp = this.maxHp;
    this.score = 0;
    this.shielded = false;
    this.rapidFire = false;
    this.rapidFireTimer = 0;
    this.alive = true;
    this.fireCooldown = 0;
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
  }
}
