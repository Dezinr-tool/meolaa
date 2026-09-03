import * as THREE from 'three'
import { cauchyIndex, refract, VIBGYOR_WAVELENGTHS } from './dispersion.js'

const SELF_HIT_EPSILON = 0.01
const MIN_EXIT_HIT_DISTANCE = 0.005

const DEBUG_BANDS = new Set(['violet', 'green', 'red'])
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

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
    const entryNormal = toWorldNormal(entryHit.face.normal, prismMesh)
    const entryFaceIndex = entryHit.faceIndex

    if (!quiet) {
      console.log(
        `[raytracer:debug] entry faceIndex=${entryFaceIndex} point=${entryPoint
          .toArray()
          .map((v) => v.toFixed(4))
          .join(',')} normal=${entryNormal
          .toArray()
          .map((v) => v.toFixed(4))
          .join(',')} epsilon=${SELF_HIT_EPSILON}`,
      )
    }

    const bands = []
    const diagnostics = []

    for (const band of VIBGYOR_WAVELENGTHS) {
      const { name, hex, displayHex, wavelengthNm } = band
      const n2 = cauchyIndex(wavelengthNm)
      const debug = !quiet && DEBUG_BANDS.has(name)

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

      if (debug) {
        const rawSummary = rawExitHits
          .slice(0, 4)
          .map(
            (h) =>
              `face=${h.faceIndex} dist=${h.distance.toFixed(4)} sameAsEntry=${h.faceIndex === entryFaceIndex}`,
          )
          .join(' | ')
        console.log(
          `[raytracer:debug] ${name} rawExitHits(${rawExitHits.length}): ${rawSummary || '(none)'}`,
        )
      }

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
      const exitNormalOutward = toWorldNormal(exitHit.face.normal, prismMesh)
      const exitNormal = exitNormalOutward.clone().negate()

      const cosI = -exitNormal.dot(refractedDir)
      const cosIClamped = Math.min(1, Math.max(-1, cosI))
      const angleDeg = (Math.acos(cosIClamped) * 180) / Math.PI
      const criticalDeg = (Math.asin(Math.min(1, 1 / n2)) * 180) / Math.PI
      // Positive margin = safely below critical (transmitting)
      const marginDeg = criticalDeg - angleDeg

      if (debug) {
        console.log(
          `[raytracer:debug] ${name} faces entry=${entryFaceIndex} exit=${exitHit.faceIndex} match=${entryFaceIndex === exitHit.faceIndex} dist=${entryPoint.distanceTo(exitPoint).toFixed(4)}`,
        )
        console.log(
          `[raytracer:debug] ${name} angles angleDeg=${angleDeg.toFixed(2)} criticalDeg=${criticalDeg.toFixed(2)} marginDeg=${marginDeg.toFixed(2)} (critical-angle)`,
        )
      }

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
      })

      bands.push({
        name,
        hex,
        displayHex,
        wavelengthNm,
        exitPoint,
        exitDirection: exitRefractedDir,
      })
    }

    if (!quiet && isDev) {
      console.table(
        bands.map((r) => ({
          name: r.name,
          wavelengthNm: r.wavelengthNm,
          x: +r.exitDirection.x.toFixed(3),
          y: +r.exitDirection.y.toFixed(3),
          z: +r.exitDirection.z.toFixed(3),
        })),
      )
    }

    return { entryPoint, entryNormal, bands, diagnostics }
  })
}

/**
 * Trace white light through a prism mesh, returning entry data plus one exit ray per VIBGYOR band.
 */
export function tracePrismDispersion(
  prismMesh,
  incomingOrigin,
  incomingDirection,
  { quiet = true } = {},
) {
  const { entryPoint, entryNormal, bands } = tracePrismDispersionInternal(
    prismMesh,
    incomingOrigin,
    incomingDirection,
    { quiet },
  )
  return { entryPoint, entryNormal, bands }
}

/**
 * DEV utility (not on the render path): sweep entry incidence angles to find a
 * direction where all 7 bands transmit with comfortable margin below TIR.
 *
 * Angle is the rotation of +X around Y (incidence on the -X entry face for small angles).
 * Pass minDeg/maxDeg as a signed range (e.g. -45..-5 or 5..45) to pick a side of the plane.
 *
 * @param {THREE.Mesh} prismMesh
 * @param {{
 *   minDeg?: number,
 *   maxDeg?: number,
 *   stepDeg?: number,
 *   minMarginDeg?: number,
 * }} [options]
 * @returns {{
 *   chosenAngleDeg: number | null,
 *   chosenMarginDeg: number | null,
 *   rows: Array<object>,
 * }}
 */
export function findWorkingEntryAngle(prismMesh, options = {}) {
  const {
    minDeg = 5,
    maxDeg = 45,
    stepDeg = 1,
    minMarginDeg = 4,
  } = options

  const yAxis = new THREE.Vector3(0, 1, 0)
  const rows = []
  const step = Math.sign(maxDeg - minDeg) * Math.abs(stepDeg) || stepDeg

  for (let deg = minDeg; step > 0 ? deg <= maxDeg : deg >= maxDeg; deg += step) {
    const angleRad = THREE.MathUtils.degToRad(deg)
    const direction = new THREE.Vector3(1, 0, 0).applyAxisAngle(yAxis, angleRad).normalize()
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
