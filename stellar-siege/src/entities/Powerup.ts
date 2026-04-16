import * as THREE from 'three';

export type PowerupType = 'health' | 'rapidfire' | 'shield';

const COLOR_MAP: Record<PowerupType, number> = {
  health: 0x44ff44,
  rapidfire: 0xffff00,
  shield: 0x00ffff,
};

export class Powerup {
  mesh: THREE.Mesh;
  light: THREE.PointLight;
  type: PowerupType;
  alive = true;
  readonly collisionRadius = 1.5;
  private elapsed = 0;
  private baseY: number;

  constructor(position: THREE.Vector3, type: PowerupType) {
    this.type = type;
    const color = COLOR_MAP[type];

    const geo = new THREE.OctahedronGeometry(0.8, 0);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.5,
      toneMapped: false,
      transparent: true,
      opacity: 0.9,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(position);
    this.baseY = position.y;

    this.light = new THREE.PointLight(color, 2, 10);
    this.light.position.copy(position);
  }

  update(dt: number): void {
    this.elapsed += dt;
    this.mesh.rotation.y += dt * 2;
    this.mesh.rotation.x += dt * 0.5;
    this.mesh.position.y = this.baseY + Math.sin(this.elapsed * 3) * 0.5;
    this.light.position.copy(this.mesh.position);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
