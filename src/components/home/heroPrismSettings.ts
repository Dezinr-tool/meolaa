/** Tunable hero prism params — edit via the on-screen panel (press P). */

export type HeroPrismSettings = {
  baseSide: number
  height: number
  rotX: number
  rotY: number
  rotZ: number
  posY: number
  idleAmount: number

  roughness: number
  thickness: number
  ior: number
  chromaticAberration: number
  envMapIntensity: number
  reflectivity: number

  beamEntryX: number
  beamEntryY: number
  beamLength: number
  beamWidth: number
  beamOpacity: number
  beamAngle: number

  spectrumExitX: number
  spectrumExitY: number
  spectrumLength: number
  spectrumWidth: number
  spectrumAngle: number
  spectrumSpread: number
  spectrumFan: number
  spectrumOpacity: number
  spectrumLayers: number

  edgeCyanOpacity: number
  edgeWhiteOpacity: number

  camX: number
  camY: number
  camZ: number
  camFov: number
  lookX: number
  lookY: number
  lookZ: number
}

/** baseSide / √2 — keeps four lateral faces equilateral. */
const DEFAULT_BASE = 1.48
const DEFAULT_HEIGHT = DEFAULT_BASE / Math.SQRT2 // ≈ 1.0465

/**
 * Square-base pyramid with four equilateral side faces.
 * Geometry height is computed from baseSide; `height` mirrors that for the panel.
 */
export const DEFAULT_PRISM_SETTINGS: HeroPrismSettings = {
  baseSide: DEFAULT_BASE,
  height: DEFAULT_HEIGHT,
  /* Slight tip so a hint of the base reads; Y≈0 keeps a front edge toward camera. */
  rotX: -0.17,
  rotY: 0.04,
  rotZ: 0,
  posY: 0.02,
  idleAmount: 0,

  /* Physical glass — HDRI + fringe; empty stage (no behind-graphic). */
  roughness: 0.03,
  thickness: 1.35,
  ior: 1.5,
  chromaticAberration: 0.4,
  envMapIntensity: 0.55,
  reflectivity: 0.55,

  /* Left / right lateral faces at y≈0 (apex→corner mid ~±0.41). */
  beamEntryX: -0.42,
  beamEntryY: 0,
  beamLength: 6.35,
  beamWidth: 0.05,
  beamOpacity: 0.68,
  beamAngle: 0,

  spectrumExitX: 0.42,
  spectrumExitY: 0,
  spectrumLength: 2.65,
  spectrumWidth: 0.28,
  spectrumAngle: 0.48,
  spectrumSpread: 0.065,
  spectrumFan: 0.08,
  spectrumOpacity: 0.9,
  spectrumLayers: 8,

  /* Faint rim reinforce — soft, not wireframe. */
  edgeCyanOpacity: 0.18,
  edgeWhiteOpacity: 0.22,

  camX: 0.2,
  camY: -0.3,
  camZ: 4.4,
  camFov: 35,
  lookX: 0,
  lookY: -0.05,
  lookZ: 0,
}

type Listener = () => void

let current: HeroPrismSettings = { ...DEFAULT_PRISM_SETTINGS }
const listeners = new Set<Listener>()

export function getPrismSettings() {
  return current
}

export function setPrismSettings(patch: Partial<HeroPrismSettings>) {
  current = { ...current, ...patch }
  listeners.forEach((l) => l())
}

export function resetPrismSettings() {
  current = { ...DEFAULT_PRISM_SETTINGS }
  listeners.forEach((l) => l())
}

export function subscribePrismSettings(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function prismSettingsJson() {
  return JSON.stringify(current, null, 2)
}

resetPrismSettings()
