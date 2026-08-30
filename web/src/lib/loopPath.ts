/**
 * Organic loop path for The Loop section (Figma node 0:3 · frames 0:4 / 0:13 / 0:28).
 * ViewBox matches Figma artboard (1422×862). Step `s` values are normalised arc
 * positions along the path (0 = start, 1 = end).
 */

export const VIEW_W = 1422
export const VIEW_H = 862

/** Figma Vector 1 — full loop stroke (local coords, placed via PATH_TRANSFORM). */
export const LOOP_PATH =
  'M2.15134 187.252C141.485 158.085 420.151 160.752 420.151 404.752C420.151 709.752 269.651 666.752 230.651 633.252C200.919 607.713 212.508 334.531 801.651 187.252C963.641 146.756 1306.3 112.071 1497.86 183.912C1560.76 207.504 1647.08 263.507 1668.99 334.753C1690.9 405.999 1669.53 513.453 1586.18 532.915C1482 557.242 1365.55 341.858 1866.76 78.8474C2267.73 -131.561 2506.23 193.7 2575.35 382.631'

/** Placement of Vector 1 inside the 1422×862 artboard (Figma frame 0:28). */
export const PATH_TRANSFORM = 'translate(-438 127) rotate(2.1)'

export const PATH_STROKE_WIDTH = 21

/** Gradient along stroke — white/ecru head fading to transparent tail (Figma). */
export const PATH_GRADIENT = {
  id: 'loop-path-gradient',
  x1: 1619.16,
  y1: 244.516,
  x2: 1807.34,
  y2: 123.051,
} as const

export type LoopStepDef = {
  label: string
  title: string
  body: string
  /** Normalised position along the path where this step activates (0–1). */
  s: number
  /** Dot centre in artboard px (Figma frame 0:28). */
  x: number
  y: number
  /** Where the copy block sits relative to the node (desktop). */
  copyAnchor: 'below-left' | 'above-left' | 'right'
}

/** Meolaa process pillars — Build → Run → Signal (sampled on path via PATH_TRANSFORM). */
export const LOOP_STEPS: LoopStepDef[] = [
  {
    label: 'Build',
    title: 'AI does the heavy lifting.',
    body: 'Product, brand and go-to-market assembled by a small team, not a large one.',
    s: 0.331,
    x: 128,
    y: 408,
    copyAnchor: 'right',
  },
  {
    label: 'Run',
    title: 'The system keeps it running.',
    body: 'Distribution, content and operations kept alive by the same engine that built it.',
    s: 0.438,
    x: 596,
    y: 315,
    copyAnchor: 'below-left',
  },
  {
    label: 'Signal',
    title: 'We read the market before it moves.',
    body: 'Consumer behaviour, demand and whitespace, sorted into a single opportunity score.',
    s: 0.559,
    x: 1121,
    y: 404,
    copyAnchor: 'above-left',
  },
]

/** Gap from dot edge to copy block — Figma px (34 below Build/Run, 47 above Signal). */
export const LOOP_COPY_GAP = {
  below: 34,
  above: 47,
  right: 24,
} as const

/**
 * Copy visibility per Figma start frame + 0:13 → 0:28:
 * - Build (stage 0 / pin start): Build copy visible to the right of the tip
 * - Run (stage 1): Build + Run copy; Build dot stays, Run active
 * - Signal (stage 2): all three copy blocks visible
 */
export function loopCopyVisible(stepIndex: number, activeStage: number): boolean {
  if (activeStage < 0) return false
  return stepIndex <= activeStage
}

/** Scroll timeline anchors — path draw + camera + step activation. */
export const LOOP_PROGRESS = {
  build: LOOP_STEPS[0].s,
  run: LOOP_STEPS[1].s,
  signal: LOOP_STEPS[2].s,
} as const

/**
 * Pin progress 0 already draws through the left loop to Build (Figma start frame).
 * Remaining scroll maps Build → path end.
 */
export const LOOP_DRAW_START = LOOP_PROGRESS.build

/** Map ScrollTrigger pin progress (0–1) → path draw progress (DRAW_START–1). */
export function loopDrawProgress(pinProgress: number): number {
  const p = Math.max(0, Math.min(1, pinProgress))
  return LOOP_DRAW_START + p * (1 - LOOP_DRAW_START)
}

/** Path-local length of the white→transparent fade behind the draw tip. */
export const LOOP_TIP_FADE = 0.022

/** Camera scale at each beat (inside fixed pinned viewport). */
export const LOOP_CAMERA_SCALES = {
  start: 1.55,
  build: 1.55,
  run: 1.75,
  signal: 1.02,
} as const

/** Camera keyframes aligned to step thresholds + hold. */
export const LOOP_CAM_KEYS = [
  0,
  LOOP_PROGRESS.build,
  LOOP_PROGRESS.run,
  LOOP_PROGRESS.signal,
  1,
] as const

export const LOOP_CAM_SCALE_VALUES = [
  LOOP_CAMERA_SCALES.start,
  LOOP_CAMERA_SCALES.build,
  LOOP_CAMERA_SCALES.run,
  LOOP_CAMERA_SCALES.signal,
  LOOP_CAMERA_SCALES.signal,
] as const

/** Opening frame focus — left loop + Build tip in view (Figma start). */
export const LOOP_START_FOCUS = { x: 0, y: 0.78 } as const

/** Path entry focus — bottom-left where stroke enters frame. */
export const PATH_ENTRY = LOOP_START_FOCUS

export type LoopPoint = { x: number; y: number; s: number }

/** Normalised position inside the SVG viewport (0–1), accounting for slice PAR. */
export type LoopScreenPoint = { x: number; y: number; s?: number }

const PATH_ROT_RAD = (2.1 * Math.PI) / 180
const PATH_ROT_COS = Math.cos(PATH_ROT_RAD)
const PATH_ROT_SIN = Math.sin(PATH_ROT_RAD)
const PATH_TX = -438
const PATH_TY = 127

/** Map path-local coords to 1422×862 artboard space (matches SVG `<g transform>`). */
export function mapPathPointToArtboard(lx: number, ly: number): { x: number; y: number } {
  return {
    x: PATH_ROT_COS * lx - PATH_ROT_SIN * ly + PATH_TX,
    y: PATH_ROT_SIN * lx + PATH_ROT_COS * ly + PATH_TY,
  }
}

/**
 * Map artboard/viewBox coords → normalised container fractions (0–1).
 * Matches `preserveAspectRatio="xMidYMid slice"` on `.loop__svg`.
 */
export function artboardToContainerFraction(
  svg: SVGSVGElement,
  ax: number,
  ay: number,
): { x: number; y: number } {
  const vb = svg.viewBox.baseVal
  const vw = vb.width > 0 ? vb.width : VIEW_W
  const vh = vb.height > 0 ? vb.height : VIEW_H
  const { width: cw, height: ch } = svg.getBoundingClientRect()

  if (cw <= 0 || ch <= 0) {
    return { x: ax / vw, y: ay / vh }
  }

  const scale = Math.max(cw / vw, ch / vh)
  const rw = vw * scale
  const rh = vh * scale
  const ox = (cw - rw) / 2
  const oy = (ch - rh) / 2

  return {
    x: (ox + ax * scale) / cw,
    y: (oy + ay * scale) / ch,
  }
}

/** Map normalised container fractions back to artboard coords (inverse of slice PAR). */
export function containerFractionToArtboard(
  svg: SVGSVGElement,
  fx: number,
  fy: number,
): { x: number; y: number } {
  const vb = svg.viewBox.baseVal
  const vw = vb.width > 0 ? vb.width : VIEW_W
  const vh = vb.height > 0 ? vb.height : VIEW_H
  const { width: cw, height: ch } = svg.getBoundingClientRect()

  if (cw <= 0 || ch <= 0) {
    return { x: fx * vw, y: fy * vh }
  }

  const scale = Math.max(cw / vw, ch / vh)
  const rw = vw * scale
  const rh = vh * scale
  const ox = (cw - rw) / 2
  const oy = (ch - rh) / 2

  return {
    x: (fx * cw - ox) / scale,
    y: (fy * ch - oy) / scale,
  }
}

/**
 * Sample step dots on the path in artboard space.
 * Uses PATH_TRANSFORM (not getCTM) — CTM is viewport pixels and would
 * double-count slice PAR when fed to artboardToContainerFraction.
 */
export function sampleLoopStepPoints(pathEl: SVGPathElement): LoopPoint[] {
  const total = pathEl.getTotalLength()

  if (total <= 0) {
    return LOOP_STEPS.map((step) => ({ s: step.s, x: step.x, y: step.y }))
  }

  return LOOP_STEPS.map((step) => {
    const local = pathEl.getPointAtLength(step.s * total)
    const artboard = mapPathPointToArtboard(local.x, local.y)
    return { s: step.s, x: artboard.x, y: artboard.y }
  })
}

/** Tip of the drawn stroke in path-local coords (same space as paths inside `<g transform>`). */
export function samplePathTipLocal(
  pathEl: SVGPathElement,
  progress: number,
): { x: number; y: number } | null {
  const total = pathEl.getTotalLength()
  if (total <= 0) return null
  const clamped = Math.max(0, Math.min(1, progress))
  const pt = pathEl.getPointAtLength(total * clamped)
  return { x: pt.x, y: pt.y }
}

/** Sample a path element at normalised arc positions. */
export function samplePath(
  pathEl: SVGPathElement,
  sValues: number[],
): LoopPoint[] {
  const total = pathEl.getTotalLength()
  return sValues.map((s) => {
    const pt = pathEl.getPointAtLength(s * total)
    return { x: pt.x, y: pt.y, s }
  })
}

/** Total path length — used for stroke-dash animation. */
export function pathLength(pathEl: SVGPathElement): number {
  return pathEl.getTotalLength()
}
