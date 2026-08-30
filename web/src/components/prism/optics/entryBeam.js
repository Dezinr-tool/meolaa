import * as THREE from 'three'
import {
  PRISM_SCALE,
  PYRAMID_RADIUS,
  PYRAMID_HEIGHT,
  PYRAMID_BASE_SIDE,
} from '../constants/prism.js'

/**
 * Optical path for the square-pyramid rest pose (PYRAMID_REST_EULER).
 *
 * ConeGeometry(radius, height, 4) triangle indices:
 *   0–3: slant faces (isosceles), adjacent around the apex
 *   4–7: square base (four tris, common outward normal −Y)
 *
 * Adjacent slant→slant cannot transmit through the solid (a ray that enters
 * one slant hits the opposite slant or the base). Pairing used:
 *   enter face 2 → exit face 0  (opposite slants)
 * Nearly horizontal world +X, left→right under the apex.
 */

/** Outward normal of entry slant face 2 (local ConeGeometry). */
export const ENTRY_FACE_NORMAL_LOCAL = new THREE.Vector3(
  -0.6527139516650942,
  0.38461538529220857,
  -0.6527139516650945,
).normalize()

/**
 * Aim near face-2 centroid (local). Slightly inset toward the apex (+Y)
 * keeps the hit on the slant body rather than the base edge.
 */
export const ENTRY_AIM_LOCAL = new THREE.Vector3(-0.231, -0.196, -0.231)

/**
 * Incidence from the entry-face outward normal (0° = head-on).
 * Tuned with ENTRY_AZIMUTH_DEG for 7/7 transmit on this pyramid.
 */
export const ENTRY_ANGLE_DEG = 30

/** Azimuth of the incidence tilt around the entry-face normal (degrees). */
export const ENTRY_AZIMUTH_DEG = 270

/** Expected faces for diagnostics. */
export const ENTRY_FACE_INDEX = 2
export const EXIT_FACE_INDEX = 0

const BASE_PRISM_SCALE = 1.1
const BACK_DISTANCE_AT_BASE = 8

/**
 * Build local incident direction: −normal, tilted by ENTRY_ANGLE toward an
 * in-face azimuth of ENTRY_AZIMUTH.
 */
export function entryDirectionLocal({
  normalLocal = ENTRY_FACE_NORMAL_LOCAL,
  angleDeg = ENTRY_ANGLE_DEG,
  azimuthDeg = ENTRY_AZIMUTH_DEG,
} = {}) {
  const n = normalLocal.clone().normalize()
  const tmp =
    Math.abs(n.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0)
  const t1 = new THREE.Vector3().crossVectors(n, tmp).normalize()
  const t2 = new THREE.Vector3().crossVectors(n, t1).normalize()
  const phi = THREE.MathUtils.degToRad(azimuthDeg)
  const tilt = t1
    .clone()
    .multiplyScalar(Math.cos(phi))
    .addScaledVector(t2, Math.sin(phi))
  return n
    .clone()
    .multiplyScalar(-1)
    .addScaledVector(tilt, Math.tan(THREE.MathUtils.degToRad(angleDeg)))
    .normalize()
}

export function entryBeamBackDistance(scale = PRISM_SCALE) {
  return BACK_DISTANCE_AT_BASE * (scale / BASE_PRISM_SCALE)
}

/**
 * Build world-space entry ray from the live mesh matrix (rest orient + yaw).
 */
export function computeEntryBeamFromMesh(
  mesh,
  {
    aimLocal = ENTRY_AIM_LOCAL,
    angleDeg = ENTRY_ANGLE_DEG,
    azimuthDeg = ENTRY_AZIMUTH_DEG,
  } = {},
) {
  mesh.updateMatrixWorld(true)

  const scaleX = mesh.scale.x
  const aim = aimLocal.clone()
  mesh.localToWorld(aim)

  const direction = entryDirectionLocal({
    angleDeg,
    azimuthDeg,
  })
  direction.transformDirection(mesh.matrixWorld).normalize()

  const backDistance = entryBeamBackDistance(scaleX)
  const origin = aim.clone().addScaledVector(direction, -backDistance)

  return {
    aim,
    direction,
    origin,
    aimLocal: aimLocal.clone(),
    backDistance,
    scale: scaleX,
    angleDeg,
    azimuthDeg,
  }
}

export function logHeroBeamDiagnostics(
  mesh,
  setup,
  trace,
  ribbon = null,
  renderProps = {},
) {
  const round4 = (v) =>
    (v?.toArray?.() ?? v)?.map?.((n) => +Number(n).toFixed(4)) ?? null
  const inv = new THREE.Matrix4().copy(mesh.matrixWorld).invert()
  const localEntry = trace?.entryPoint
    ? trace.entryPoint.clone().applyMatrix4(inv)
    : null

  const bandRows =
    trace?.bands?.map((b) => {
      const exitLocal = b.exitPoint.clone().applyMatrix4(inv)
      const exitAngleDeg =
        (Math.atan2(b.exitDirection.y, b.exitDirection.x) * 180) / Math.PI
      return {
        name: b.name,
        exitAngleDeg: +exitAngleDeg.toFixed(2),
        exitFaceIndex: b.exitFaceIndex ?? null,
        internalEntryWorld: round4(trace.entryPoint),
        internalExitWorld: round4(b.exitPoint),
        exitLocal: round4(exitLocal),
        exitDir: round4(b.exitDirection),
      }
    }) ?? []

  const meanExit =
    trace?.bands?.length > 0
      ? trace.bands
          .reduce((acc, b) => acc.add(b.exitPoint.clone()), new THREE.Vector3())
          .multiplyScalar(1 / trace.bands.length)
      : null

  const meanExitDir =
    trace?.bands?.length > 0
      ? trace.bands
          .reduce(
            (acc, b) => acc.add(b.exitDirection.clone()),
            new THREE.Vector3(),
          )
          .normalize()
      : null

  const exitAngles = bandRows.map((r) => r.exitAngleDeg)
  const spreadDeg =
    exitAngles.length >= 2
      ? +(Math.max(...exitAngles) - Math.min(...exitAngles)).toFixed(3)
      : null

  console.log('[hero-beam] square-pyramid setup', {
    PRISM_SCALE,
    PYRAMID_BASE_SIDE,
    PYRAMID_RADIUS,
    PYRAMID_HEIGHT,
    meshScale: setup.scale,
    ENTRY_ANGLE_DEG: setup.angleDeg ?? ENTRY_ANGLE_DEG,
    ENTRY_AZIMUTH_DEG: setup.azimuthDeg ?? ENTRY_AZIMUTH_DEG,
    entryFaceExpected: ENTRY_FACE_INDEX,
    exitFaceExpected: EXIT_FACE_INDEX,
    backDistance: +setup.backDistance.toFixed(4),
    aimLocal: round4(setup.aimLocal),
    origin: round4(setup.origin),
    direction: round4(setup.direction),
  })

  console.log('[hero-beam] entry hit', {
    world: round4(trace?.entryPoint),
    local: round4(localEntry),
    entryFaceIndex: trace?.entryFaceIndex ?? null,
    bandCount: trace?.bands?.length ?? 0,
  })

  console.table(
    bandRows.map((r) => ({
      name: r.name,
      exitFace: r.exitFaceIndex,
      entryWorld: r.internalEntryWorld?.join(', '),
      exitWorld: r.internalExitWorld?.join(', '),
      exitAngleDeg: r.exitAngleDeg,
    })),
  )

  console.log('[hero-beam] DispersionRibbon', {
    meanExitWorld: round4(meanExit),
    ribbonPropStart: round4(ribbon?.start),
    ribbonPropDirection: round4(ribbon?.direction),
    meanExitDirRaw: round4(meanExitDir),
    ribbonLiftDeg: renderProps.ribbonLiftDeg ?? null,
    spectralSpreadDeg: spreadDeg,
  })

  return { meanExit, meanExitDir, spreadDeg, bandRows }
}
