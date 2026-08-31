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
const DEFAULT_BASE = 0.95
const DEFAULT_HEIGHT = 1.07

/**
 * Square-base pyramid with four equilateral side faces.
 * Geometry height is computed from baseSide; `height` mirrors that for the panel.
 */
export const DEFAULT_PRISM_SETTINGS: HeroPrismSettings = {
  baseSide: DEFAULT_BASE,
  height: DEFAULT_HEIGHT,
  /* Slight tip so a hint of the base reads; Y≈0 keeps a front edge toward camera. */
  rotX: -0.15,
  rotY: 0.78,
  rotZ: 0.04,
  posY: 0.09,
  /* No idle drift — the crystal holds still. The sin terms in the frame loop
     multiply through this, so 0 disables the float without removing the
     mechanism from the panel. */
  idleAmount: 0,

  /* Physical glass. envMapIntensity/reflectivity were low enough that the
     faces read as matte grey — the HDRI is the only thing giving the crystal
     its highlights on an otherwise empty stage, so it has to carry. */
  roughness: 0.285,
  thickness: 1.05,
  ior: 1.23,
  chromaticAberration: 0.83,
  envMapIntensity: 0.9,
  reflectivity: 0.38,

  /* Left / right lateral faces at y≈0 (apex→corner mid ~±0.41). */
  beamEntryX: -0.49,
  beamEntryY: 0,
  beamLength: 6.35,
  beamWidth: 0.05,
  beamOpacity: 0.68,
  beamAngle: 0,

  spectrumExitX: 0.3,
  spectrumExitY: 0,
  spectrumLength: 2.2,
  spectrumWidth: 0.19,
  spectrumAngle: 0.48,
  spectrumSpread: 0.065,
  spectrumFan: 0.08,
  spectrumOpacity: 0.9,
  spectrumLayers: 8,

  /* Crisp lit edges — the reference crystal is read almost entirely by the
     bright lines along its arrises. */
  edgeCyanOpacity: 0.34,
  edgeWhiteOpacity: 0.52,

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
