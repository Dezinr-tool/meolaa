import * as THREE from 'three'
import { cauchyIndex, refract, VIBGYOR_WAVELENGTHS } from './dispersion.js'

const SELF_HIT_EPSILON = 0.01
const MIN_EXIT_HIT_DISTANCE = 0.005

/**
 * Transform a face normal from mesh-local to world space.
 * @param {THREE.Vector3} localNormal
 * @param {THREE.Object3D} mesh
 * @returns {THREE.Vector3}
 */
function toWorldNormal(localNormal, mesh) {
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
  return localNormal.clone().applyMatrix3(normalMatrix).normalize()
}

function withDoubleSide(prismMesh, fn) {
  const materials = Array.isArray(prismMesh.material)
    ? prismMesh.material
    : prismMesh.material
      ? [prismMesh.material]
      : []
  const previousSides = materials.map((m) => m.side)
  for (const m of materials) m.side = THREE.DoubleSide
  try {
    return fn()
  } finally {
    materials.forEach((m, i) => {
      m.side = previousSides[i]
    })
  }
}

/**
 * Core tracer. When `quiet` is true, skips verbose per-band console spam (for sweeps).
 * Always returns per-band diagnostics including exit TIR margins.
 */
function tracePrismDispersionInternal(
  prismMesh,
  incomingOrigin,
  incomingDirection,
  { quiet = false } = {},
) {
  prismMesh.updateMatrixWorld(true)

  const direction = incomingDirection.clone().normalize()
  const raycaster = new THREE.Raycaster(
    incomingOrigin.clone(),
    direction.clone(),
  )

  const empty = {
    entryPoint: null,
    entryNormal: null,
    bands: [],
    diagnostics: [],
  }

  return withDoubleSide(prismMesh, () => {
    const entryHits = raycaster.intersectObject(prismMesh, false)
    if (entryHits.length === 0) {
      if (!quiet) console.warn('[raytracer] No entry intersection with prismMesh')
      return empty
    }

    const entryHit = entryHits[0]
    const entryPoint = entryHit.point.clone()
    let entryNormal = toWorldNormal(entryHit.face.normal, prismMesh)
    // Guarantee outward-vs-incident: normal must face against the incoming ray
    if (entryNormal.dot(direction) > 0) entryNormal.negate()
    const entryFaceIndex = entryHit.faceIndex

    const meshWorldCenter = new THREE.Vector3()
    prismMesh.getWorldPosition(meshWorldCenter)

    const bands = []
    const diagnostics = []

    for (const band of VIBGYOR_WAVELENGTHS) {
      const { name, hex, wavelengthNm } = band
      const n2 = cauchyIndex(wavelengthNm)

      const refractedDir = refract(direction, entryNormal, 1.0, n2)
      if (!refractedDir) {
        diagnostics.push({
          name,
          wavelengthNm,
          n2,
          ok: false,
          reason: 'tir_entry',
          angleDeg: null,
          criticalDeg: null,
          marginDeg: null,
          entryFaceIndex,
        })
        if (!quiet) {
          console.warn(`[raytracer] TIR at entry for ${name} (${wavelengthNm}nm) — skipping`)
        }
        continue
      }

      const innerOrigin = entryPoint
        .clone()
        .addScaledVector(refractedDir, SELF_HIT_EPSILON)

      raycaster.set(innerOrigin, refractedDir)
      const rawExitHits = raycaster.intersectObject(prismMesh, false)
      const exitHits = rawExitHits.filter((hit) => hit.distance >= MIN_EXIT_HIT_DISTANCE)

      if (exitHits.length === 0) {
        diagnostics.push({
          name,
          wavelengthNm,
          n2,
          ok: false,
          reason: 'no_exit',
          angleDeg: null,
          criticalDeg: null,
          marginDeg: null,
          entryFaceIndex,
        })
        if (!quiet) {
          console.warn(
            `[raytracer] No exit intersection for ${name} (${wavelengthNm}nm) — skipping`,
          )
        }
        continue
      }

      const exitHit = exitHits[0]
      const exitPoint = exitHit.point.clone()
      let exitNormalOutward = toWorldNormal(exitHit.face.normal, prismMesh)
      // Outward = pointing away from mesh center (works for tetrahedron + prism)
      if (exitNormalOutward.dot(exitPoint.clone().sub(meshWorldCenter)) < 0) {
        exitNormalOutward.negate()
      }
      const exitNormal = exitNormalOutward.clone().negate()

      const cosI = -exitNormal.dot(refractedDir)
      const cosIClamped = Math.min(1, Math.max(-1, cosI))
      const angleDeg = (Math.acos(cosIClamped) * 180) / Math.PI
      const criticalDeg = (Math.asin(Math.min(1, 1 / n2)) * 180) / Math.PI
      // Positive margin = safely below critical (transmitting)
      const marginDeg = criticalDeg - angleDeg

      const exitRefractedDir = refract(refractedDir, exitNormal, n2, 1.0)
      if (!exitRefractedDir) {
        diagnostics.push({
          name,
          wavelengthNm,
          n2,
          ok: false,
          reason: 'tir_exit',
          angleDeg,
          criticalDeg,
          marginDeg,
          entryFaceIndex,
          exitFaceIndex: exitHit.faceIndex,
        })
        if (!quiet) {
          console.warn(
            `[raytracer] TIR at exit for ${name} (${wavelengthNm}nm) — skipping (angleDeg=${angleDeg.toFixed(1)} criticalDeg=${criticalDeg.toFixed(1)})`,
          )
        }
        continue
      }

      diagnostics.push({
        name,
        wavelengthNm,
        n2,
        ok: true,
        reason: 'ok',
        angleDeg,
        criticalDeg,
        marginDeg,
        entryFaceIndex,
        exitFaceIndex: exitHit.faceIndex,
      })

      bands.push({
        name,
        hex,
        wavelengthNm,
        exitPoint,
        exitDirection: exitRefractedDir,
        exitFaceIndex: exitHit.faceIndex,
      })
    }

    return { entryPoint, entryNormal, entryFaceIndex, bands, diagnostics }
  })
}

/**
 * Trace white light through a dispersive solid (tetrahedron / prism mesh),
 * returning entry data plus one exit ray per VIBGYOR band.
 */
export function tracePrismDispersion(prismMesh, incomingOrigin, incomingDirection) {
  const { entryPoint, entryNormal, entryFaceIndex, bands } =
    tracePrismDispersionInternal(prismMesh, incomingOrigin, incomingDirection, {
      quiet: false,
    })
  return { entryPoint, entryNormal, entryFaceIndex, bands }
}

/**
 * DEV utility: legacy +X-about-Z sweep (prism-era). Prefer the face-normal
 * incidence model in optics/entryBeam.js for the tetrahedron.
 */
export function findWorkingEntryAngle(prismMesh, options = {}) {
  const {
    minDeg = 5,
    maxDeg = 45,
    stepDeg = 1,
    minMarginDeg = 4,
  } = options

  const zAxis = new THREE.Vector3(0, 0, 1)
  const rows = []
  const step = Math.sign(maxDeg - minDeg) * Math.abs(stepDeg) || stepDeg

  for (let deg = minDeg; step > 0 ? deg <= maxDeg : deg >= maxDeg; deg += step) {
    const angleRad = THREE.MathUtils.degToRad(deg)
    const direction = new THREE.Vector3(1, 0, 0).applyAxisAngle(zAxis, angleRad).normalize()
    const start = new THREE.Vector3(0, 0, 0).addScaledVector(direction, -8)

    const { bands, diagnostics } = tracePrismDispersionInternal(
      prismMesh,
      start,
      direction,
      { quiet: true },
    )

    const allPass = bands.length === VIBGYOR_WAVELENGTHS.length
    const byName = Object.fromEntries(diagnostics.map((d) => [d.name, d]))
    const violet = byName.violet
    const red = byName.red
    const margins = diagnostics.filter((d) => d.ok).map((d) => d.marginDeg)
    const worstMargin = margins.length ? Math.min(...margins) : null

    rows.push({
      angleDeg: deg,
      allPass,
      bandCount: bands.length,
      violetMarginDeg:
        violet?.marginDeg != null && Number.isFinite(violet.marginDeg)
          ? +violet.marginDeg.toFixed(2)
          : null,
      redMarginDeg:
        red?.marginDeg != null && Number.isFinite(red.marginDeg)
          ? +red.marginDeg.toFixed(2)
          : null,
      worstMarginDeg: worstMargin != null ? +worstMargin.toFixed(2) : null,
      // User-requested sign convention: angleDeg - criticalDeg (negative ⇒ below critical)
      violetAngleMinusCritical:
        violet?.angleDeg != null && violet?.criticalDeg != null
          ? +(violet.angleDeg - violet.criticalDeg).toFixed(2)
          : null,
      failReasons: diagnostics
        .filter((d) => !d.ok)
        .map((d) => `${d.name}:${d.reason}`)
        .join(','),
    })
  }

  console.log('[findWorkingEntryAngle] sweep results:')
  console.table(rows)

  const candidates = rows.filter(
    (r) =>
      r.allPass &&
      r.worstMarginDeg != null &&
      r.worstMarginDeg >= minMarginDeg,
  )
  // Prefer smallest |angle| that still clears the margin
  candidates.sort((a, b) => Math.abs(a.angleDeg) - Math.abs(b.angleDeg))
  const chosen = candidates[0] ?? null

  if (chosen) {
    console.log(
      `[findWorkingEntryAngle] chosen angleDeg=${chosen.angleDeg} worstMarginDeg=${chosen.worstMarginDeg} violetMarginDeg=${chosen.violetMarginDeg} (minMargin=${minMarginDeg}°)`,
    )
  } else {
    console.warn(
      `[findWorkingEntryAngle] no angle in ${minDeg}→${maxDeg}° passed all 7 bands with ≥${minMarginDeg}° worst-band margin`,
    )
  }

  return {
    chosenAngleDeg: chosen?.angleDeg ?? null,
    chosenMarginDeg: chosen?.worstMarginDeg ?? null,
    rows,
  }
}
