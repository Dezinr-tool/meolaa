import * as THREE from 'three'
import { PRISM_SCALE } from '../components/Prism'

/** Aim point in prism-local space (before scale) — slightly left of & below centre. */
const AIM_LOCAL = new THREE.Vector3(-0.35, -0.04, 0)
const REFERENCE_SCALE = 1.1
const BACK_DISTANCE_AT_REFERENCE = 8
const Z_AXIS = new THREE.Vector3(0, 0, 1)

/** How far off-screen the entry beam starts, scaled with the prism. */
function backDistanceFor(scale = PRISM_SCALE) {
  return (scale / REFERENCE_SCALE) * BACK_DISTANCE_AT_REFERENCE
}

const _pos = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scl = new THREE.Vector3()

/**
 * Compute where the white entry beam originates and which way it travels so it
 * strikes the prism's -X face at a shallow downward angle.
 *
 * The incoming beam is anchored to the prism's *base* pose only (its configured
 * position / rotation / scale). Pass `basePose` — a matrix built from those —
 * so that a live drag rotation of the prism mesh does NOT swing the beam: the
 * beam stays put, only the entry point + refraction respond to the rotation.
 */
export function setupHeroBeam(
  prismMesh,
  { aimLocal = AIM_LOCAL, angleDeg = 7, basePose = null } = {},
) {
  prismMesh.updateMatrixWorld(true)

  // Decompose the mesh's world matrix for scale / fallback position.
  prismMesh.matrixWorld.decompose(_pos, _quat, _scl)
  const scale = _scl.x

  const pose = basePose ?? prismMesh.matrixWorld

  const aim = aimLocal.clone().applyMatrix4(pose)

  const direction = new THREE.Vector3(1, 0, 0)
    .applyAxisAngle(Z_AXIS, THREE.MathUtils.degToRad(angleDeg))
    .transformDirection(pose)
    .normalize()

  const backDistance = backDistanceFor(scale)
  const origin = aim.clone().addScaledVector(direction, -backDistance)

  return { aim, direction, origin, aimLocal: aimLocal.clone(), backDistance, scale }
}

/** Build the base-pose matrix (no drag) the beam should be anchored to. */
export function makeBasePose(position, rotationEuler, uniformScale) {
  return new THREE.Matrix4().compose(
    _pos.set(position[0], position[1], position[2]),
    _quat.setFromEuler(rotationEuler),
    _scl.set(uniformScale, uniformScale, uniformScale),
  )
}

/** Ribbon "lift": how far the fanned output is rotated up around +Z (degrees). */
export const RIBBON_LIFT_DEG = 71

/**
 * Collapse the per-band exit rays into one origin + one lifted direction that
 * the gradient ribbon follows.
 */
export function computeFan(bands, liftDeg = RIBBON_LIFT_DEG) {
  if (!bands?.length) return null

  const start = bands
    .reduce((acc, b) => acc.add(b.exitPoint.clone()), new THREE.Vector3())
    .multiplyScalar(1 / bands.length)

  const direction = bands
    .reduce((acc, b) => acc.add(b.exitDirection.clone()), new THREE.Vector3())
    .normalize()
    .applyAxisAngle(Z_AXIS, THREE.MathUtils.degToRad(liftDeg))
    .normalize()

  return { start, direction }
}
