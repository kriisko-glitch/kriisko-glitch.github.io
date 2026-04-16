import * as THREE from 'three';
import type { EnemyType } from '../systems/WaveManager.ts';

const ENEMY_CONFIGS: Record<EnemyType, { hp: number; speed: number; color: number; fireRate: number }> = {
  drone:   { hp: 1, speed: 25, color: 0xff2222, fireRate: 0 },
  fighter: { hp: 3, speed: 15, color: 0xff8800, fireRate: 1.5 },
  cruiser: { hp: 8, speed: 8,  color: 0xaa44ff, fireRate: 2.5 },
};

let nextId = 0;

function createDroneMesh(): THREE.Mesh {
  const geo = new THREE.OctahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: 0xff2222,
    emissiveIntensity: 0.6,
    toneMapped: false,
    flatShading: true,
  });
  return new THREE.Mesh(geo, mat);
}

function createFighterMesh(): THREE.Group & { type: 'Group' } {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 2.5),
    new THREE.MeshStandardMaterial({
      color: 0xff8800, emissive: 0xff8800, emissiveIntensity: 0.4,
      toneMapped: false, flatShading: true,
    })
  );
  const wingL = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.1, 1.2),
    new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.3,
      toneMapped: false, flatShading: true,
    })
  );
  wingL.position.set(-1.2, 0, 0.2);
  wingL.rotation.z = -0.2;

  const wingR = wingL.clone();
  wingR.position.set(1.2, 0, 0.2);
  wingR.rotation.z = 0.2;

  const group = new THREE.Group();
  group.add(body, wingL, wingR);
  return group as THREE.Group & { type: 'Group' };
}

function createCruiserMesh(): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(1.5, 1, 5, 8);
  geo.rotateX(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xaa44ff, emissive: 0xaa44ff, emissiveIntensity: 0.5,
    toneMapped: false, flatShading: true,
  });
  return new THREE.Mesh(geo, mat);
}

export class Enemy {
  id: string;
  object3D: THREE.Object3D;
  light: THREE.PointLight;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  alive = true;
  fireRate: number;
  fireCooldown = 0;
  readonly collisionRadius: number;

  private strafeDir = (Math.random() - 0.5) * 2;
  private strafeTimer = 0;

  constructor(type: EnemyType, position: THREE.Vector3) {
    this.id = `enemy_${nextId++}`;
    this.type = type;
    const cfg = ENEMY_CONFIGS[type];
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.fireRate = cfg.fireRate;

    switch (type) {
      case 'drone':
        this.object3D = createDroneMesh();
        this.collisionRadius = 1;
        break;
      case 'fighter':
        this.object3D = createFighterMesh();
        this.collisionRadius = 1.5;
        break;
      case 'cruiser':
        this.object3D = createCruiserMesh();
        this.collisionRadius = 2.5;
        break;
    }

    this.object3D.position.copy(position);
    this.light = new THREE.PointLight(cfg.color, 1, 15);
    this.light.position.copy(position);
  }

  update(dt: number, playerPos: THREE.Vector3): boolean {
    const dir = playerPos.clone().sub(this.object3D.position);
    const dist = dir.length();
    dir.normalize();

    this.object3D.position.addScaledVector(dir, this.speed * dt);

    if (this.type === 'fighter') {
      this.strafeTimer += dt;
      if (this.strafeTimer > 2) {
        this.strafeDir = -this.strafeDir;
        this.strafeTimer = 0;
      }
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      this.object3D.position.addScaledVector(perp, this.strafeDir * this.speed * 0.5 * dt);
    }

    this.object3D.lookAt(playerPos);
    this.light.position.copy(this.object3D.position);

    let shouldFire = false;
    if (this.fireRate > 0 && dist < 120) {
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        this.fireCooldown = this.fireRate;
        shouldFire = true;
      }
    }

    if (dist < 3) {
      this.alive = false;
    }

    return shouldFire;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
    }
  }

  getFireDirection(playerPos: THREE.Vector3): THREE.Vector3 {
    return playerPos.clone().sub(this.object3D.position).normalize();
  }

  dispose(): void {
    this.object3D.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    });
  }
}
