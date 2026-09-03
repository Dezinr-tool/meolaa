/**
 * Declarative description of the tweakable scene settings.
 * `SettingsDrawer` renders this; `defaults` seeds the store.
 */
export const SETTINGS_SCHEMA = [
  {
    id: 'glass',
    label: 'Glass / Prism',
    fields: [
      { key: 'roughness', label: 'Roughness', min: 0, max: 0.5, step: 0.005 },
      { key: 'transmission', label: 'Transmission', min: 0, max: 1, step: 0.01 },
      { key: 'thickness', label: 'Thickness', min: 0, max: 4, step: 0.05 },
      { key: 'ior', label: 'IOR', min: 1, max: 2.4, step: 0.01 },
      { key: 'chromaticAberration', label: 'Chromatic aberration', min: 0, max: 1.5, step: 0.01 },
      { key: 'anisotropicBlur', label: 'Blur (anisotropic)', min: 0, max: 4, step: 0.02 },
      { key: 'distortion', label: 'Distortion', min: 0, max: 2, step: 0.02 },
      { key: 'distortionScale', label: 'Distortion scale', min: 0, max: 1, step: 0.01 },
      { key: 'temporalDistortion', label: 'Temporal distortion', min: 0, max: 1, step: 0.01 },
      { key: 'samples', label: 'Samples', min: 2, max: 24, step: 1, remount: true },
      { key: 'resolution', label: 'Buffer resolution', min: 128, max: 2048, step: 128, remount: true },
    ],
  },
  {
    id: 'shape',
    label: 'Prism',
    fields: [
      { key: 'scale', label: 'Scale', min: 0.6, max: 3, step: 0.02, retrace: true },
      { key: 'yawDeg', label: 'Yaw (°)', min: -180, max: 180, step: 1, retrace: true },
      { key: 'pitchDeg', label: 'Pitch (°)', min: -45, max: 45, step: 1, retrace: true },
      { key: 'posY', label: 'Vertical offset', min: -1, max: 1, step: 0.02, retrace: true },
      { key: 'baseHalf', label: 'Half-width', min: 0.3, max: 1.4, step: 0.02, deferred: true, retrace: true },
      { key: 'height', label: 'Height', min: 0.6, max: 2.4, step: 0.02, deferred: true, retrace: true },
    ],
  },
  {
    id: 'beams',
    label: 'Beams & Flares',
    fields: [
      { key: 'beamColor', label: 'Entry beam colour', type: 'color' },
      { key: 'beamOpacity', label: 'Entry beam glow', min: 0, max: 1, step: 0.01 },
      { key: 'beamCoreOpacity', label: 'Entry beam core', min: 0, max: 1, step: 0.01 },
      { key: 'beamThickness', label: 'Beam thickness', min: 0.004, max: 0.12, step: 0.002 },
      { key: 'beamSoftness', label: 'Beam blur', min: 0.4, max: 4, step: 0.05 },
      { key: 'internalBeamColor', label: 'In-glass beam colour', type: 'color' },
      { key: 'internalBeamOpacity', label: 'In-glass beam glow', min: 0, max: 1, step: 0.01 },
      { key: 'entryFlareColor', label: 'Entry flare colour', type: 'color' },
      { key: 'entryFlareIntensity', label: 'Entry flare intensity', min: 0, max: 3, step: 0.02 },
      { key: 'exitFlareColor', label: 'Exit flare colour', type: 'color' },
      { key: 'exitFlareIntensity', label: 'Exit flare intensity', min: 0, max: 3, step: 0.02 },
    ],
  },
  {
    id: 'logo',
    label: 'Hero Logo (Meolaa)',
    fields: [
      { key: 'textScale', label: 'Scale', min: 0.2, max: 3, step: 0.01 },
      { key: 'textX', label: 'Nudge X', min: -6, max: 6, step: 0.05 },
      { key: 'textY', label: 'Nudge Y', min: -4, max: 4, step: 0.05 },
      { key: 'textZ', label: 'Depth (Z)', min: -8, max: 2, step: 0.05 },
    ],
  },
  {
    id: 'background',
    label: 'Background',
    fields: [
      { key: 'bgColor', label: 'Base colour', type: 'color' },
      { key: 'bgGlow', label: 'Centre glow', type: 'color' },
    ],
  },
  {
    id: 'bloom',
    label: 'Bloom',
    fields: [
      { key: 'intensity', label: 'Intensity', min: 0, max: 6, step: 0.05 },
      { key: 'luminanceThreshold', label: 'Luminance threshold', min: 0, max: 1, step: 0.01 },
      { key: 'luminanceSmoothing', label: 'Luminance smoothing', min: 0, max: 1, step: 0.01 },
      { key: 'radius', label: 'Blur radius', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    id: 'post',
    label: 'Post-processing',
    fields: [
      { key: 'vignetteOffset', label: 'Vignette offset', min: 0, max: 1, step: 0.01 },
      { key: 'vignetteDarkness', label: 'Vignette darkness', min: 0, max: 2, step: 0.01 },
      { key: 'chromaticOffsetPx', label: 'Screen CA (px)', min: 0, max: 8, step: 0.1 },
      { key: 'grainOpacity', label: 'Film grain', min: 0, max: 0.15, step: 0.002 },
    ],
  },
  {
    id: 'dispersion',
    label: 'Dispersion Ribbon',
    fields: [
      { key: 'ribbonIntensity', label: 'Intensity', min: 0, max: 2, step: 0.02 },
      { key: 'ribbonWidth', label: 'Width', min: 2, max: 24, step: 0.5 },
      { key: 'ribbonWidenPower', label: 'Widen power', min: 0.2, max: 2, step: 0.02 },
      { key: 'ribbonLength', label: 'Length', min: 4, max: 30, step: 0.5 },
      { key: 'ribbonHue', label: 'Hue shift (°)', min: -180, max: 180, step: 1 },
      { key: 'ribbonSaturation', label: 'Saturation', min: 0, max: 2, step: 0.02 },
      { key: 'entryAngleDeg', label: 'Entry angle (°)', min: 0, max: 20, step: 0.5, retrace: true },
      { key: 'liftDeg', label: 'Ribbon lift (°)', min: 0, max: 120, step: 1, retrace: true },
    ],
  },
]

export const DEFAULT_SETTINGS = {
  // glass
  roughness: 0.205,
  transmission: 1,
  thickness: 1.2,
  ior: 1.24,
  chromaticAberration: 0.64,
  anisotropicBlur: 1.34,
  distortion: 0.28,
  distortionScale: 0.17,
  temporalDistortion: 0.14,
  samples: 12,
  resolution: 768,
  // prism
  scale: 1.44,
  yawDeg: 23,
  pitchDeg: 0,
  posY: 0.32,
  baseHalf: 0.7,
  height: 1.212,
  // background
  bgColor: '#1b5044',
  bgGlow: '#eeff00',
  // beams & flares
  beamColor: '#eef4ff',
  beamOpacity: 0.5,
  beamCoreOpacity: 0.85,
  beamThickness: 0.024,
  beamSoftness: 0.4,
  internalBeamColor: '#f2f6ff',
  internalBeamOpacity: 0.28,
  entryFlareColor: '#eaf2ff',
  entryFlareIntensity: 0.75,
  exitFlareColor: '#fff0e2',
  exitFlareIntensity: 0.42,
  // hero logo
  textX: 0,
  textY: 1.3,
  textZ: -2,
  textScale: 1.05,
  // bloom
  intensity: 2.4,
  luminanceThreshold: 0.08,
  luminanceSmoothing: 0.9,
  radius: 0.85,
  // post
  vignetteOffset: 0.08,
  vignetteDarkness: 0.02,
  chromaticOffsetPx: 1.2,
  grainOpacity: 0.02,
  // dispersion
  ribbonIntensity: 0.34,
  ribbonWidth: 11,
  ribbonWidenPower: 0.84,
  ribbonLength: 24,
  ribbonHue: -15,
  ribbonSaturation: 1.38,
  entryAngleDeg: 4.5,
  liftDeg: 60,
}

/** Keys that force the prism to remount (transmission FBO / sample-count rebuild). */
export const REMOUNT_KEYS = SETTINGS_SCHEMA.flatMap((g) =>
  g.fields.filter((f) => f.remount).map((f) => f.key),
)

/** Keys that require re-running the raytrace. */
export const RETRACE_KEYS = SETTINGS_SCHEMA.flatMap((g) =>
  g.fields.filter((f) => f.retrace).map((f) => f.key),
)
