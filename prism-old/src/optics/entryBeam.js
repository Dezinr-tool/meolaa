import * as THREE from 'three'
import { PRISM_SCALE } from '../constants/prism.js'

/**
 * Designed entry aim in mesh-local space AFTER geometry.center(), at unit scale.
 * Left slant, slightly below mid-height — same relative face point used at scale 1.1.
 * World aim = mesh.localToWorld(ENTRY_AIM_LOCAL) so PRISM_SCALE / yaw cannot drift.
 */
export const ENTRY_AIM_LOCAL = new THREE.Vector3(-0.35, -0.04, 0)

/** Incidence about local +Z on the upright XY triangle (equilateral sweep → 7°). */
export const ENTRY_ANGLE_DEG = 7

/** Original design scale the −8 world standoff was tuned against. */
const BASE_PRISM_SCALE = 1.1
const BACK_DISTANCE_AT_BASE = 8

const Z_AXIS = new THREE.Vector3(0, 0, 1)

/** Approach distance scales with the prism so the beam stays proportionally framed. */
export function entryBeamBackDistance(scale = PRISM_SCALE) {
  return BACK_DISTANCE_AT_BASE * (scale / BASE_PRISM_SCALE)
}

/**
 * Build world-space entry ray from the live mesh matrix (scale + yaw + position).
 * Direction is +X rotated by ENTRY_ANGLE about local Z, then transformed by the mesh.
 */
export function computeEntryBeamFromMesh(
  mesh,
  {
    aimLocal = ENTRY_AIM_LOCAL,
    angleDeg = ENTRY_ANGLE_DEG,
  } = {},
) {
  mesh.updateMatrixWorld(true)

  const scaleX = mesh.scale.x
  const aim = aimLocal.clone()
  mesh.localToWorld(aim)

  const direction = new THREE.Vector3(1, 0, 0).applyAxisAngle(
    Z_AXIS,
    THREE.MathUtils.degToRad(angleDeg),
  )
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
  }
}

/** Left-slant endpoints in local XY after geometry.center() (pre-bevel verts). */
const LEFT_FACE_A = new THREE.Vector2(-0.7, -0.6254) // base-left
const LEFT_FACE_B = new THREE.Vector2(0, 0.5866) // toward apex

/**
 * Log entry/exit hit positions, internal-ray endpoints, and the exact props
 * consumed by VolumetricBeam / DispersionRibbon (to catch stale/hardcoded origins).
 *
 * @param {THREE.Mesh} mesh
 * @param {object} setup  from computeEntryBeamFromMesh
 * @param {object} trace  from tracePrismDispersion
 * @param {{ start: THREE.Vector3, direction: THREE.Vector3 } | null} [ribbon]
 * @param {{
 *   entryBeam?: { start: THREE.Vector3, direction: THREE.Vector3, length: number },
 *   ribbonLiftDeg?: number,
 * }} [renderProps]  what Scene actually passes into the beam meshes
 */
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

  let faceT = null
  if (localEntry) {
    const ab = LEFT_FACE_B.clone().sub(LEFT_FACE_A)
    const ap = new THREE.Vector2(localEntry.x, localEntry.y).sub(LEFT_FACE_A)
    faceT = ap.dot(ab) / ab.lengthSq()
  }

  const bandRows =
    trace?.bands?.map((b) => {
      const exitLocal = b.exitPoint.clone().applyMatrix4(inv)
      const exitWorldFromLocal = exitLocal.clone()
      mesh.localToWorld(exitWorldFromLocal)
      const exitAngleDeg =
        (Math.atan2(b.exitDirection.y, b.exitDirection.x) * 180) / Math.PI
      return {
        name: b.name,
        exitAngleDeg: +exitAngleDeg.toFixed(2),
        // Internal ray endpoints (world) — what an in-glass segment must use
        internalEntryWorld: round4(trace.entryPoint),
        internalExitWorld: round4(b.exitPoint),
        exitLocal: round4(exitLocal),
        localToWorldCheck: round4(exitWorldFromLocal),
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

  // --- VolumetricBeam (entry only): derive the world endpoint it will draw to
  const entryBeam = renderProps.entryBeam
  let volumetricBeamLog = null
  if (entryBeam) {
    const dir = entryBeam.direction.clone().normalize()
    const renderStart = entryBeam.start.clone()
    const renderEnd = renderStart
      .clone()
      .addScaledVector(dir, entryBeam.length)
    volumetricBeamLog = {
      propStart: round4(renderStart),
      propDirection: round4(dir),
      propLength: +entryBeam.length.toFixed(4),
      /** group at start, geometry along +Y → this is the far tip of the shaft */
      computedRenderEnd: round4(renderEnd),
      raytracerEntryHit: round4(trace?.entryPoint),
      endMinusEntryHit:
        trace?.entryPoint != null
          ? round4(renderEnd.clone().sub(trace.entryPoint))
          : null,
      note: 'Only entry shaft exists — Scene does NOT render an in-glass VolumetricBeam.',
    }
  }

  console.log('[hero-beam] setup', {
    PRISM_SCALE,
    meshScale: setup.scale,
    backDistance: +setup.backDistance.toFixed(4),
    aimLocal: round4(setup.aimLocal),
    aimWorld: round4(setup.aim),
    origin: round4(setup.origin),
    direction: round4(setup.direction),
  })

  console.log('[hero-beam] entry hit (raytracer)', {
    world: round4(trace?.entryPoint),
    local: round4(localEntry),
    faceT: faceT != null ? +faceT.toFixed(3) : null,
    bandCount: trace?.bands?.length ?? 0,
  })

  console.log(
    '[hero-beam] INTERNAL RAY endpoints (entryHit → exitHit) per band — world space',
  )
  console.table(
    bandRows.map((r) => ({
      name: r.name,
      entryWorld: r.internalEntryWorld?.join(', '),
      exitWorld: r.internalExitWorld?.join(', '),
      exitLocal: r.exitLocal?.join(', '),
      exitAngleDeg: r.exitAngleDeg,
    })),
  )

  // Spotlight 2 bands as requested
  const sample = bandRows.filter((r) => r.name === 'violet' || r.name === 'red')
  console.log('[hero-beam] sample internal rays (violet + red)', sample)

  console.log('[hero-beam] VolumetricBeam ENTRY mesh — props actually consumed', volumetricBeamLog)

  console.log('[hero-beam] DispersionRibbon — origin wiring', {
    meanExitWorld: round4(meanExit),
    ribbonPropStart: round4(ribbon?.start),
    ribbonStartMinusMeanExit:
      ribbon?.start && meanExit
        ? round4(ribbon.start.clone().sub(meanExit))
        : null,
    ribbonPropDirection: round4(ribbon?.direction),
    meanExitDirRaw: round4(meanExitDir),
    ribbonLiftDeg: renderProps.ribbonLiftDeg ?? null,
    entryToMeanExitDist:
      trace?.entryPoint && meanExit
        ? +trace.entryPoint.distanceTo(meanExit).toFixed(4)
        : null,
    spectralSpreadDeg: spreadDeg,
    /** Explicit: no mesh is drawn along entry→exit inside the glass today */
    internalBeamMeshRendered: false,
    internalBeamMeshNote:
      'Scene only has (1) entry VolumetricBeam origin→entryHit and (2) DispersionRibbon meanExit→out. Any “internal” shaft toward the apex is NOT a raytracer-driven mesh.',
  })

  return { meanExit, meanExitDir, spreadDeg, bandRows, volumetricBeamLog }
}
