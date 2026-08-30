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

/**
 * Apex-up triangular pyramid — defaults from live panel tune.
 */
export const DEFAULT_PRISM_SETTINGS: HeroPrismSettings = {
  baseSide: 1.48,
  height: 1.07,
  rotX: -0.17,
  rotY: 0.04,
  rotZ: 0,
  posY: 0.02,
  idleAmount: 0,

  roughness: 0.3,
  thickness: 0.71,
  ior: 1.48,
  chromaticAberration: 0,
  envMapIntensity: 2.1,
  reflectivity: 1,

  beamEntryX: 0,
  beamEntryY: -0.05,
  beamLength: 6.35,
  beamWidth: 0.05,
  beamOpacity: 0.68,
  beamAngle: 0,

  spectrumExitX: 0.45,
  spectrumExitY: 0.02,
  spectrumLength: 1,
  spectrumWidth: 0.11,
  spectrumAngle: 0.48,
  spectrumSpread: 0.039,
  spectrumFan: 0.05,
  spectrumOpacity: 0.85,
  spectrumLayers: 8,

  edgeCyanOpacity: 0.74,
  edgeWhiteOpacity: 0.72,

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
