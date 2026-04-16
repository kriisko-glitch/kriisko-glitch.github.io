import * as THREE from 'three';

const LASER_SPEED = 200;
const LASER_MAX_DIST = 500;

const laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6);
laserGeo.rotateX(Math.PI / 2);
const laserMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x00ffff,
  emissiveIntensity: 3,
  toneMapped: false,
});

export class Laser {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  alive = true;
  distanceTraveled = 0;
  isPlayerLaser: boolean;
  readonly collisionRadius = 0.5;

  constructor(position: THREE.Vector3, direction: THREE.Vector3, isPlayerLaser = true) {
    this.mesh = new THREE.Mesh(laserGeo, isPlayerLaser ? laserMat : laserMat.clone());
    if (!isPlayerLaser) {
      (this.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xff4400);
      (this.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff4400);
    }
    this.mesh.position.copy(position);
    this.mesh.lookAt(position.clone().add(direction));
    this.velocity = direction.clone().normalize().multiplyScalar(LASER_SPEED);
    this.isPlayerLaser = isPlayerLaser;
  }

  update(dt: number): void {
    const move = this.velocity.clone().multiplyScalar(dt);
    this.mesh.position.add(move);
    this.distanceTraveled += move.length();
    if (this.distanceTraveled > LASER_MAX_DIST) {
      this.alive = false;
    }
  }

  dispose(): void {
    this.mesh.geometry?.dispose();
  }
}
