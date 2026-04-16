import * as THREE from 'three';

export function checkSphereCollision(
  posA: THREE.Vector3, radiusA: number,
  posB: THREE.Vector3, radiusB: number
): boolean {
  const distSq = posA.distanceToSquared(posB);
  const radSum = radiusA + radiusB;
  return distSq <= radSum * radSum;
}
