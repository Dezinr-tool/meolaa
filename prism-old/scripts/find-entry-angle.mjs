/**
 * Angle sweep + candidate comparison on the CURRENT equilateral Prism mesh
 * (same bevel/depth/scale/yaw as Scene). Does not change Scene wiring.
 *
 * Run: node scripts/find-entry-angle.mjs
 */
import * as THREE from 'three'
import { findWorkingEntryAngle, tracePrismDispersion } from '../src/physics/raytracer.js'
import { PRISM_DEPTH, PRISM_SCALE } from '../src/constants/prism.js'
import {
  computeEntryBeamFromMesh,
  ENTRY_AIM_LOCAL,
  logHeroBeamDiagnostics,
} from '../src/optics/entryBeam.js'

const PRISM_YAW_DEG = 24
const CANDIDATES = [7, 20, 28, 35]

function createPrismGeometry() {
  // Match Prism.jsx / TransmissionPrism.jsx exactly
  const shape = new THREE.Shape()
  shape.moveTo(-0.7, -0.404)
  shape.lineTo(0.7, -0.404)
  shape.lineTo(0, 0.808)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: PRISM_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.055,
    bevelSegments: 4,
  })
  geometry.center()
  return geometry
}

function makeSceneMesh() {
  const mesh = new THREE.Mesh(
    createPrismGeometry(),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  )
  mesh.scale.setScalar(PRISM_SCALE)
  mesh.rotation.y = THREE.MathUtils.degToRad(PRISM_YAW_DEG)
  mesh.updateMatrixWorld(true)
  return mesh
}

/** Spectral spread = max−min of atan2(exitDir.y, exitDir.x) across bands. */
function measureAtAngle(mesh, angleDeg) {
  const setup = computeEntryBeamFromMesh(mesh, { angleDeg })
  const trace = tracePrismDispersion(mesh, setup.origin, setup.direction)

  const angles =
    trace.bands?.map((b) => {
      const deg = (Math.atan2(b.exitDirection.y, b.exitDirection.x) * 180) / Math.PI
      return {
        name: b.name,
        exitAngleDeg: +deg.toFixed(2),
        exitWorld: b.exitPoint.toArray().map((n) => +n.toFixed(4)),
        exitDir: b.exitDirection.toArray().map((n) => +n.toFixed(4)),
      }
    }) ?? []

  const vals = angles.map((a) => a.exitAngleDeg)
  const spreadAtan2Deg =
    vals.length >= 2 ? +(Math.max(...vals) - Math.min(...vals)).toFixed(3) : null

  // True fan between extreme bands (not projected into XY atan2)
  let spread3dDeg = null
  if (trace.bands?.length >= 2) {
    const v = trace.bands[0].exitDirection
    const r = trace.bands[trace.bands.length - 1].exitDirection
    spread3dDeg = +((Math.acos(THREE.MathUtils.clamp(v.dot(r), -1, 1)) * 180) / Math.PI).toFixed(3)
  }

  const meanExit = trace.bands?.length
    ? trace.bands
        .reduce((acc, b) => acc.add(b.exitPoint.clone()), new THREE.Vector3())
        .multiplyScalar(1 / trace.bands.length)
    : null

  const meanExitDir = trace.bands?.length
    ? trace.bands
        .reduce((acc, b) => acc.add(b.exitDirection.clone()), new THREE.Vector3())
        .normalize()
    : null

  const meanExitAngleDeg = meanExitDir
    ? +((Math.atan2(meanExitDir.y, meanExitDir.x) * 180) / Math.PI).toFixed(2)
    : null

  return {
    angleDeg,
    bandCount: trace.bands?.length ?? 0,
    entryWorld: trace.entryPoint?.toArray().map((n) => +n.toFixed(4)) ?? null,
    meanExitWorld: meanExit?.toArray().map((n) => +n.toFixed(4)) ?? null,
    meanExitDir: meanExitDir?.toArray().map((n) => +n.toFixed(4)) ?? null,
    meanExitAngleDeg,
    spreadAtan2Deg,
    spread3dDeg,
    bands: angles,
    entryToExitDist:
      trace.entryPoint && meanExit
        ? +trace.entryPoint.distanceTo(meanExit).toFixed(4)
        : null,
  }
}

const mesh = makeSceneMesh()
mesh.geometry.computeBoundingBox()
const box = mesh.geometry.boundingBox
console.log('[geom] current equilateral (Scene-matched)', {
  PRISM_SCALE,
  PRISM_DEPTH,
  yawDeg: PRISM_YAW_DEG,
  localAABB: {
    min: box.min.toArray().map((n) => +n.toFixed(4)),
    max: box.max.toArray().map((n) => +n.toFixed(4)),
  },
  ENTRY_AIM_LOCAL: ENTRY_AIM_LOCAL.toArray(),
})

console.log('\n========== 1) EXIT / RIBBON WIRING @ current ENTRY_ANGLE (7°) ==========')
{
  const setup = computeEntryBeamFromMesh(mesh, { angleDeg: 7 })
  const trace = tracePrismDispersion(mesh, setup.origin, setup.direction)
  // Scene ribbon start = mean exit (direction lift is framing — logged separately)
  const meanExit = trace.bands
    .reduce((acc, b) => acc.add(b.exitPoint.clone()), new THREE.Vector3())
    .multiplyScalar(1 / trace.bands.length)
  const meanDir = trace.bands
    .reduce((acc, b) => acc.add(b.exitDirection.clone()), new THREE.Vector3())
    .normalize()
  logHeroBeamDiagnostics(mesh, setup, trace, { start: meanExit, direction: meanDir })
}

console.log('\n========== 2) FULL SWEEP (same method as original findWorkingEntryAngle) ==========')
// Sweep uses origin along -dir from world 0 (original helper). Also report Scene-aim candidates.
const positive = findWorkingEntryAngle(mesh, {
  minDeg: 5,
  maxDeg: 45,
  stepDeg: 1,
  minMarginDeg: 4,
})

console.log('\n========== 3) CANDIDATE ANGLES via Scene aim (ENTRY_AIM_LOCAL + yaw) ==========')
const candidateRows = CANDIDATES.map((deg) => {
  try {
    return measureAtAngle(mesh, deg)
  } catch (e) {
    return { angleDeg: deg, error: String(e) }
  }
})

console.log('[candidates] summary')
console.table(
  candidateRows.map((r) => ({
    angleDeg: r.angleDeg,
    bandCount: r.bandCount,
    spreadAtan2Deg: r.spreadAtan2Deg,
    spread3dDeg: r.spread3dDeg,
    meanExitAngleDeg: r.meanExitAngleDeg,
    entryToExitDist: r.entryToExitDist,
    entryWorld: r.entryWorld?.join(', '),
    meanExitWorld: r.meanExitWorld?.join(', '),
  })),
)

for (const r of candidateRows) {
  console.log(`\n[candidates] detail @ ${r.angleDeg}°`)
  if (r.bands) console.table(r.bands)
}

// Scene framing note (not applied here): RIBBON_LIFT_DEG=71 rotates mean exit dir
const RIBBON_LIFT_DEG = 71
const at7 = candidateRows.find((r) => r.angleDeg === 7)
if (at7?.meanExitDir) {
  const raw = new THREE.Vector3(...at7.meanExitDir)
  const lifted = raw
    .clone()
    .applyAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(RIBBON_LIFT_DEG))
    .normalize()
  const kinkDeg =
    (Math.acos(THREE.MathUtils.clamp(raw.dot(lifted), -1, 1)) * 180) / Math.PI
  console.log('\n[framing-note] Scene RIBBON_LIFT_DEG effect @7° (start unchanged, dir only)', {
    rawMeanExitDir: raw.toArray().map((n) => +n.toFixed(4)),
    liftedDir: lifted.toArray().map((n) => +n.toFixed(4)),
    directionKinkDeg: +kinkDeg.toFixed(2),
    note: 'This +71° is applied in buildRibbon — a likely visual kink source, separate from exit-point wiring.',
  })
}

// Max-margin pick (original "28° with max TIR margin" intent) vs min-|angle| with margin≥4
const maxMarginRow = [...positive.rows]
  .filter((r) => r.allPass)
  .sort((a, b) => b.worstMarginDeg - a.worstMarginDeg)[0]

console.log(
  '\n' +
    JSON.stringify(
      {
        sweepMinAbsAngleWithMargin4: {
          angleDeg: positive.chosenAngleDeg,
          worstMarginDeg: positive.chosenMarginDeg,
        },
        sweepMaxMarginAmongAllPass: maxMarginRow
          ? {
              angleDeg: maxMarginRow.angleDeg,
              worstMarginDeg: maxMarginRow.worstMarginDeg,
              violetMarginDeg: maxMarginRow.violetMarginDeg,
            }
          : null,
        candidates: candidateRows.map((r) => ({
          angleDeg: r.angleDeg,
          bandCount: r.bandCount,
          spreadAtan2Deg: r.spreadAtan2Deg,
          spread3dDeg: r.spread3dDeg,
          meanExitAngleDeg: r.meanExitAngleDeg,
        })),
        wiring:
          'ribbon.start === mean(exitPoint) exactly (Δ=0). entry≠exit by ~1.3 units through glass is expected, not a bounce bug.',
      },
      null,
      2,
    ),
)
