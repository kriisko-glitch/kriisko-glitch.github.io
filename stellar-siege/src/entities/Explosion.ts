import * as THREE from 'three';

const PARTICLE_COUNT = 80;
const LIFETIME = 0.6;

export class Explosion {
  points: THREE.Points;
  light: THREE.PointLight;
  alive = true;
  private elapsed = 0;
  private velocities: THREE.Vector3[];
  private positions: Float32Array;
  private colors: Float32Array;
  private baseColor: THREE.Color;

  constructor(position: THREE.Vector3, color: number) {
    this.baseColor = new THREE.Color(color);
    this.positions = new Float32Array(PARTICLE_COUNT * 3);
    this.colors = new Float32Array(PARTICLE_COUNT * 3);
    this.velocities = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      this.positions[i3] = position.x;
      this.positions[i3 + 1] = position.y;
      this.positions[i3 + 2] = position.z;

      this.colors[i3] = this.baseColor.r;
      this.colors[i3 + 1] = this.baseColor.g;
      this.colors[i3 + 2] = this.baseColor.b;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(15 + Math.random() * 35);
      this.velocities.push(vel);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, mat);
    this.light = new THREE.PointLight(color, 8, 30);
    this.light.position.copy(position);
  }

  update(dt: number): void {
    this.elapsed += dt;
    const t = this.elapsed / LIFETIME;

    if (t >= 1) {
      this.alive = false;
      return;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      this.positions[i3] += this.velocities[i].x * dt;
      this.positions[i3 + 1] += this.velocities[i].y * dt;
      this.positions[i3 + 2] += this.velocities[i].z * dt;
    }

    (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.points.material as THREE.PointsMaterial).opacity = 1 - t;
    this.light.intensity = 8 * (1 - t);
  }

  dispose(): void {
    this.points.geometry.dispose();
    (this.points.material as THREE.PointsMaterial).dispose();
  }
}
