import * as THREE from 'three'

/**
 * Shared mesh scale — Prism / TransmissionPrism / entry-beam standoff.
 * Slightly larger than the beam-era scale so the pyramid reads as the hero.
 */
export const PRISM_SCALE = 1.1 * 1.4 * 1.1

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
 * Same look-ray as the beam-era [2.6, 1.1, 6.2] (direction unchanged → rest
 * euler stays valid), pulled closer so the pyramid fills more of the frame.
 */
const _camDir = new THREE.Vector3(2.6, 1.1, 6.2).normalize()
export const PRISM_CAMERA_POSITION = _camDir
  .clone()
  .multiplyScalar(5.15)
  .toArray()

/**
 * Unique local verts of ConeGeometry(radius, height, 4):
 *   0: apex (0, +h/2, 0)
 *   1: +Z base corner  (front vertex)
 *   2: +X base corner
 *   3: −Z base corner
 *   4: −X base corner
 *
 * Matches CylinderGeometry's θ=0 at +Z (x = r sin θ, z = r cos θ).
 */
export function pyramidUnitVerts(
  radius = PYRAMID_RADIUS,
  height = PYRAMID_HEIGHT,
) {
  const halfH = height / 2
  const corners = [0, 1, 2, 3].map((i) => {
    const theta = (i * Math.PI) / 2
    return new THREE.Vector3(
      radius * Math.sin(theta),
      -halfH,
      radius * Math.cos(theta),
    )
  })
  return [new THREE.Vector3(0, halfH, 0), ...corners]
}

/**
 * Look-down pitch (°) about screen-right after apex-up / front-vertex alignment.
 * Negative = tip apex away from camera so the square base opens toward the lens.
 * Shallower values (~−52) collapse the square base to a knife-edge; this is
 * steeper than the tetra's −48° because the square projects as a shallow
 * trapezoid until you look down further.
 */
export const PYRAMID_BASE_TILT_DEG = -60

/** Apex vertex index in pyramidUnitVerts(). */
export const PYRAMID_APEX_VERT = 0

/** Front (near-base) corner — two slant faces + the square base meet here. */
export const PYRAMID_FRONT_VERT = 1

/**
 * Resting orientation: apex up, vertical center seam (apex → front vertex),
 * then pitched so the square base is a clearly visible bottom facet.
 *
 * Silhouette: two equal front slant faces split by a centered vertical seam,
 * plus the square base reading as the bottom ~fifth–quarter of the shape.
 *
 * Extra yaw (PRISM_YAW_DEG in Scene) layers on top of this rest pose.
 */
export function computeVertexForwardRestEuler({
  cameraPos = PRISM_CAMERA_POSITION,
  apexIdx = PYRAMID_APEX_VERT,
  frontIdx = PYRAMID_FRONT_VERT,
  tiltDeg = PYRAMID_BASE_TILT_DEG,
} = {}) {
  const V = pyramidUnitVerts()
  const apex = V[apexIdx]
  const front = V[frontIdx]

  const toCam = new THREE.Vector3(...cameraPos).normalize()
  const viewUp = new THREE.Vector3(0, 1, 0)
    .addScaledVector(toCam, -new THREE.Vector3(0, 1, 0).dot(toCam))
    .normalize()
  const screenRight = new THREE.Vector3()
    .crossVectors(viewUp, toCam)
    .normalize()

  // 1) Apex → front becomes vertical (apex up, front down).
  const downLocal = front.clone().sub(apex).normalize()
  let q = new THREE.Quaternion().setFromUnitVectors(
    downLocal,
    viewUp.clone().negate(),
  )

  // 2) Yaw so the front vertex faces the camera (centered vertical seam).
  const toCamH = toCam
    .clone()
    .addScaledVector(viewUp, -toCam.dot(viewUp))
    .normalize()
  const front1 = front.clone().applyQuaternion(q)
  const frontH = front1
    .clone()
    .addScaledVector(viewUp, -front1.dot(viewUp))
  if (frontH.lengthSq() > 1e-10) {
    frontH.normalize()
    const yaw = Math.atan2(
      new THREE.Vector3().crossVectors(frontH, toCamH).dot(viewUp),
      frontH.dot(toCamH),
    )
    q = new THREE.Quaternion().setFromAxisAngle(viewUp, yaw).multiply(q)
  }
  if (front.clone().applyQuaternion(q).dot(toCam) < 0) {
    q = new THREE.Quaternion().setFromAxisAngle(viewUp, Math.PI).multiply(q)
  }

  // 3) Pitch to reveal the square base under the two side faces.
  q = new THREE.Quaternion()
    .setFromAxisAngle(screenRight, THREE.MathUtils.degToRad(tiltDeg))
    .multiply(q)

  const euler = new THREE.Euler().setFromQuaternion(q, 'XYZ')
  return [euler.x, euler.y, euler.z]
}

export const PYRAMID_REST_EULER = computeVertexForwardRestEuler()

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
