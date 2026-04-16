import * as THREE from 'three';

const TRAIL_LENGTH = 20;

export class EngineTrail {
  line: THREE.Line;
  private positions: THREE.Vector3[] = [];
  private positionAttr: THREE.BufferAttribute;
  private colorAttr: THREE.BufferAttribute;

  constructor() {
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      this.positions.push(new THREE.Vector3(0, 0, 0));
    }

    const posArray = new Float32Array(TRAIL_LENGTH * 3);
    const colorArray = new Float32Array(TRAIL_LENGTH * 3);

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const t = i / TRAIL_LENGTH;
      colorArray[i * 3] = 1.0;
      colorArray[i * 3 + 1] = 0.5 * (1 - t);
      colorArray[i * 3 + 2] = 0.1 * (1 - t);
    }

    const geo = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(posArray, 3);
    this.colorAttr = new THREE.BufferAttribute(colorArray, 3);
    geo.setAttribute('position', this.positionAttr);
    geo.setAttribute('color', this.colorAttr);

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1,
    });

    this.line = new THREE.Line(geo, mat);
  }

  update(shipPos: THREE.Vector3): void {
    const enginePos = shipPos.clone().add(new THREE.Vector3(0, 0, 2.5));

    for (let i = TRAIL_LENGTH - 1; i > 0; i--) {
      this.positions[i].copy(this.positions[i - 1]);
    }
    this.positions[0].copy(enginePos);

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const i3 = i * 3;
      this.positionAttr.array[i3] = this.positions[i].x;
      this.positionAttr.array[i3 + 1] = this.positions[i].y;
      this.positionAttr.array[i3 + 2] = this.positions[i].z;
    }
    this.positionAttr.needsUpdate = true;
  }
}
