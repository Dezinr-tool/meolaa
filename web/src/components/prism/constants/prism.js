import * as THREE from 'three'

/**
 * Shared mesh scale — Prism / TransmissionPrism / entry-beam standoff.
 */
export const PRISM_SCALE = 1.1 * 1.4

/**
 * Circumradius of the regular tetrahedron (center → vertex), pre-scale.
 */
export const TETRA_RADIUS = 1.2

/**
 * Approximate glass thickness for MeshTransmissionMaterial / physical material.
 */
export const PRISM_DEPTH = TETRA_RADIUS

/** @deprecated Prefer TETRA_RADIUS */
export const PRISM_SIDE = TETRA_RADIUS

/**
 * Default hero camera (matches Scene PerspectiveCamera).
 */
export const PRISM_CAMERA_POSITION = [2.6, 1.1, 6.2]

/**
 * Unique local verts of THREE.TetrahedronGeometry(1, 0), insertion order.
 *   0: (−1,−1,+1)/√3
 *   1: (+1,+1,+1)/√3
 *   2: (−1,+1,−1)/√3
 *   3: (+1,−1,−1)/√3
 */
function tetraUnitVerts() {
  const geo = new THREE.TetrahedronGeometry(1, 0)
  const pos = geo.attributes.position
  const map = new Map()
  for (let i = 0; i < pos.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(pos, i)
    const key = p.toArray().map((n) => n.toFixed(5)).join(',')
    if (!map.has(key)) map.set(key, p)
  }
  geo.dispose()
  return [...map.values()]
}

/**
 * Look-down pitch (°) about screen-right after apex-up / front-vertex alignment.
 * Negative = tip apex away from camera so the base face opens toward the lens.
 * Tuned so the base is ~1/5–1/4 of visible projected area with equal side faces.
 */
export const TETRA_BASE_TILT_DEG = -48

/** Apex vertex index in tetraUnitVerts(). */
export const TETRA_APEX_VERT = 1

/** Front (near-base) vertex index — opposite the apex along the vertical seam. */
export const TETRA_FRONT_VERT = 0

/**
 * Resting orientation: apex up, vertical center seam (apex → front vertex),
 * then pitched so the base face is a clearly visible bottom facet.
 *
 * Silhouette: two equal front side faces split by a centered vertical seam,
 * plus the base triangle reading as the bottom ~fifth–quarter of the shape.
 *
 * Extra yaw (PRISM_YAW_DEG in Scene) layers on top of this rest pose.
 */
export function computeVertexForwardRestEuler({
  cameraPos = PRISM_CAMERA_POSITION,
  apexIdx = TETRA_APEX_VERT,
  frontIdx = TETRA_FRONT_VERT,
  tiltDeg = TETRA_BASE_TILT_DEG,
} = {}) {
  const V = tetraUnitVerts()
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

  // 3) Pitch to reveal the base face under the two side faces.
  q = new THREE.Quaternion()
    .setFromAxisAngle(screenRight, THREE.MathUtils.degToRad(tiltDeg))
    .multiply(q)

  const euler = new THREE.Euler().setFromQuaternion(q, 'XYZ')
  return [euler.x, euler.y, euler.z]
}

/** @deprecated Use computeVertexForwardRestEuler */
export function computeFaceForwardRestEuler(cameraPos = PRISM_CAMERA_POSITION) {
  return computeVertexForwardRestEuler({ cameraPos })
}

/** @deprecated Use computeVertexForwardRestEuler */
export function computeDiamondRestEuler(cameraPos = PRISM_CAMERA_POSITION) {
  return computeVertexForwardRestEuler({ cameraPos })
}

export const TETRA_REST_EULER = computeVertexForwardRestEuler()

/**
 * Regular tetrahedron: 4 equilateral triangular faces, 4 vertices, 4 triangles.
 */
export function createTetrahedronGeometry(radius = TETRA_RADIUS) {
  return new THREE.TetrahedronGeometry(radius, 0)
}

/** @deprecated Use createTetrahedronGeometry */
export function createEquilateralPrismGeometry(radius = TETRA_RADIUS) {
  return createTetrahedronGeometry(radius)
}
