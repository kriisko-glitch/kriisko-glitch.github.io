import * as THREE from 'three';

const STAR_COUNT = 15000;
const STAR_RADIUS = 2000;

const vertexShader = `
  attribute float size;
  attribute float phase;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    vAlpha = 0.6 + 0.4 * sin(uTime * 1.5 + phase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(vec3(0.9, 0.92, 1.0), glow * vAlpha);
  }
`;

export class Starfield {
  points: THREE.Points;
  nebulae: THREE.Mesh[] = [];
  private material: THREE.ShaderMaterial;

  constructor(scene: THREE.Scene) {
    const positions = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = STAR_RADIUS * (0.5 + Math.random() * 0.5);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 1 + Math.random() * 3;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, this.material);
    scene.add(this.points);

    this.createNebulae(scene);
  }

  private createNebulae(scene: THREE.Scene): void {
    const nebulaColors = [
      [0.3, 0.1, 0.5],
      [0.1, 0.15, 0.4],
      [0.4, 0.05, 0.3],
    ];
    const positions: [number, number, number][] = [
      [500, 200, -1500],
      [-600, -100, -1200],
      [200, 400, -1800],
    ];

    for (let i = 0; i < 3; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      const [r, g, b] = nebulaColors[i];
      gradient.addColorStop(0, `rgba(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)}, 0.3)`);
      gradient.addColorStop(0.5, `rgba(${Math.floor(r * 200)}, ${Math.floor(g * 200)}, ${Math.floor(b * 200)}, 0.1)`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      const tex = new THREE.CanvasTexture(canvas);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(600, 600),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        })
      );
      const [px, py, pz] = positions[i];
      plane.position.set(px, py, pz);
      plane.lookAt(0, 0, 0);
      scene.add(plane);
      this.nebulae.push(plane);
    }
  }

  update(time: number): void {
    this.material.uniforms.uTime.value = time;
  }
}
