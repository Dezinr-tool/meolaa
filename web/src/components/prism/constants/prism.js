import * as THREE from 'three'

/**
 * Shared mesh scale — Prism / TransmissionPrism / entry-beam standoff.
 */
export const PRISM_SCALE = 1.1 * 1.4

/**
 * Square-pyramid proportions (pre-scale).
 * Base is a square of side PYRAMID_BASE_SIDE; height = 1.2 × side.
 * ConeGeometry radius = circumradius of that square (= side / √2).
 */
export const PYRAMID_BASE_SIDE = 1.4
export const PYRAMID_RADIUS = PYRAMID_BASE_SIDE / Math.SQRT2
export const PYRAMID_HEIGHT = 1.2 * PYRAMID_BASE_SIDE

/**
 * Approximate glass thickness for MeshTransmissionMaterial / physical material.
 */
export const PRISM_DEPTH = PYRAMID_HEIGHT * 0.55

/** @deprecated Prefer PYRAMID_RADIUS / PYRAMID_BASE_SIDE */
export const TETRA_RADIUS = PYRAMID_RADIUS
/** @deprecated Prefer PYRAMID_BASE_SIDE */
export const PRISM_SIDE = PYRAMID_BASE_SIDE

/**
 * Default hero camera (matches Scene PerspectiveCamera).
 */
export const PRISM_CAMERA_POSITION = [2.6, 1.1, 6.2]

/**
 * Resting orientation: apex up (ConeGeometry default), yaw so a vertical edge
 * seam sits toward the camera between two front slant faces, mild look-down
 * so the square base reads under the silhouette.
 *
 * Euler XYZ, degrees baked as radians:
 *   x = −18° (look-down), y = 45° (seam-forward), z = 0
 */
export const PYRAMID_REST_EULER = [
  THREE.MathUtils.degToRad(-18),
  THREE.MathUtils.degToRad(45),
  0,
]

/** @deprecated Prefer PYRAMID_REST_EULER */
export const TETRA_REST_EULER = PYRAMID_REST_EULER

/**
 * Square-based pyramid via ConeGeometry(radius, height, 4):
 *   - 4 isosceles triangular slant faces (tris 0–3)
 *   - 1 square base (tris 4–7, planar, shared outward normal −Y)
 * Indexed BufferGeometry; Raycaster faceIndex maps 1:1 to those tris.
 * Prefer this over a hand-built BufferGeometry — face normals and indexing
 * are already correct for the existing raytracer.
 */
export function createPyramidGeometry(
  radius = PYRAMID_RADIUS,
  height = PYRAMID_HEIGHT,
) {
  return new THREE.ConeGeometry(radius, height, 4)
}

/** @deprecated Use createPyramidGeometry */
export function createTetrahedronGeometry(
  radius = PYRAMID_RADIUS,
  height = PYRAMID_HEIGHT,
) {
  return createPyramidGeometry(radius, height)
}

/** @deprecated Use createPyramidGeometry */
export function createEquilateralPrismGeometry(
  radius = PYRAMID_RADIUS,
  height = PYRAMID_HEIGHT,
) {
  return createPyramidGeometry(radius, height)
}
