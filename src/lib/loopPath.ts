/**
 * The Loop — closed continuous path (Signal → Build → Run → Signal).
 *
 * Geometry follows Figma node positions (frame 0:28 ring centres) on the
 * 1422×862 artboard. Path is a closed cubic loop — not an open left→right stroke.
 *
 * Scroll pin 0→1 draws one full circuit; the tip returns to Signal at completion.
 */

export const VIEW_W = 1422
export const VIEW_H = 862

/**
 * Closed organic loop through Signal → Build → Run (prototype / Figma order).
 * M starts at Signal; Z closes back to the origin.
 */
export const LOOP_PATH =
  'M 1133 385 C 960 530 300 530 127 404 C 55 275 360 215 594 304 C 830 255 1090 305 1133 385 Z'

/** @deprecated Open Figma stroke — retained for reference only. */
export const LOOP_PATH_LEGACY_OPEN =
  'M2.15134 187.252C141.485 158.085 420.151 160.752 420.151 404.752C420.151 709.752 269.651 666.752 230.651 633.252C200.919 607.713 69.6513 384.752 801.651 187.252C963.641 146.756 1306.3 112.071 1497.86 183.912C1560.76 207.504 1647.08 263.507 1668.99 334.753C1690.9 405.999 1669.53 513.453 1586.18 532.915C1482 557.242 1365.55 341.858 1866.76 78.8474C2267.73 -131.561 2506.23 193.7 2575.35 382.631'

/** Path origin = Signal (cycle start). */
export const LOOP_START_TIP_LOCAL = { x: 1133, y: 385 } as const

/** Identity — path is already in artboard space. */
export const PATH_TRANSFORM = ''

export const PATH_STROKE_WIDTH = 28

/** Tip disc radius (px in path space). */
export const LOOP_TIP_RADIUS = 14

export const PATH_STROKE_COLOR = '#fdf28c'

export type LoopStepDef = {
  label: string
  title: string
  body: string
  /** Normalised position along the closed path (0–1). */
  s: number
  /** Dot centre in artboard px (Figma frame 0:28). */
  x: number
  y: number
  copyAnchor: 'below-left' | 'above-left' | 'right'
}

/**
 * Signal → Build → Run — continuous cycle (prototype order).
 * `s` values are evenly spaced thirds on the closed path; dots snap on mount.
 */
export const LOOP_STEPS: LoopStepDef[] = [
  {
    label: 'Signal',
    title: 'We read the market before it moves.',
    body: 'Consumer behaviour, demand and whitespace, sorted into a single opportunity score.',
    s: 0,
    x: 1133,
    y: 385,
    copyAnchor: 'above-left',
  },
  {
    label: 'Build',
    title: 'AI does the heavy lifting.',
    body: 'Product, brand and go-to-market assembled by a small team, not a large one.',
    s: 0.333,
    x: 127,
    y: 404,
    copyAnchor: 'below-left',
  },
  {
    label: 'Run',
    title: 'The system keeps it running.',
    body: 'Distribution, content and operations kept alive by the same engine that built it.',
    s: 0.666,
    x: 594,
    y: 304,
    copyAnchor: 'below-left',
  },
]

export const LOOP_COPY_GAP = {
  below: 34,
  above: 47,
  right: 24,
} as const

/** Hide leading tip when the circuit completes (tip back at Signal). */
export const LOOP_END_TIP_HIDE = 0.985

/** Cumulative copy — each stage stays visible once reached. */
export function loopCopyVisible(stepIndex: number, activeStage: number): boolean {
  if (activeStage < 0) return false
  return stepIndex <= activeStage
}

/** Rings stay once the tip passes each node; all three at loop completion. */
export function loopRingVisible(
  stepIndex: number,
  activeStage: number,
  drawProgress: number,
): boolean {
  if (drawProgress >= LOOP_END_TIP_HIDE) {
    return activeStage >= 0
  }
  return activeStage >= stepIndex
}

export const LOOP_PROGRESS = {
  signal: LOOP_STEPS[0].s,
  build: LOOP_STEPS[1].s,
  run: LOOP_STEPS[2].s,
} as const

/** Pin 0 = undrawn at Signal; pin 1 = full circuit drawn. */
export const LOOP_DRAW_ENTRY = 0

export let LOOP_DRAW_START = LOOP_DRAW_ENTRY

/** Map ScrollTrigger pin progress (0–1) → path draw progress (0–1). */
export function loopDrawProgress(pinProgress: number): number {
  const p = Math.max(0, Math.min(1, pinProgress))
  return p
}

export function resolveLoopDrawStart(_pathEl: SVGPathElement): number {
  LOOP_DRAW_START = LOOP_DRAW_ENTRY
  return LOOP_DRAW_START
}

export function resolveLoopBuildTipS(_pathEl: SVGPathElement): number {
  return LOOP_PROGRESS.build
}

/**
 * Camera scale — gentle settle while orbiting the closed loop.
 */
export const LOOP_CAMERA_SCALES = {
  start: 1,
  signal: 1,
  build: 0.98,
  run: 0.96,
  end: 0.94,
} as const

export function loopCamKeys(_drawStart: number = LOOP_DRAW_ENTRY): readonly number[] {
  return [
    LOOP_PROGRESS.signal,
    LOOP_PROGRESS.build,
    LOOP_PROGRESS.run,
    1,
  ]
}

export const LOOP_CAM_SCALE_VALUES = [
  LOOP_CAMERA_SCALES.start,
  LOOP_CAMERA_SCALES.build,
  LOOP_CAMERA_SCALES.run,
  LOOP_CAMERA_SCALES.end,
] as const

export function loopCamEase(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/** Opening camera focus — centred on the loop. */
export const LOOP_START_FOCUS = { x: 0.5, y: 0.48 } as const

/** Deepest point on the closed path (Build bowl) for focus floor. */
export const LOOP_PATH_LOWEST_ARTBOARD = { x: 127, y: 404 } as const

export const LOOP_ENTRY_VIEW_Y = 0.48
export const LOOP_ENTRY_VIEW_X = 0.5

export const PATH_ENTRY = LOOP_START_FOCUS

export const LOOP_FOCUS_BOTTOM_PAD_PX = 10

export function loopStrokeEdgePx(
  svgWidth: number,
  svgHeight: number,
  camScale: number,
  padPx: number = LOOP_FOCUS_BOTTOM_PAD_PX,
): number {
  if (svgWidth <= 0 || svgHeight <= 0 || camScale <= 0) {
    return PATH_STROKE_WIDTH / 2 + padPx
  }
  const slice = Math.max(svgWidth / VIEW_W, svgHeight / VIEW_H)
  return (PATH_STROKE_WIDTH / 2) * slice * camScale + padPx
}

export function loopFocusYFloor(
  lowestPointY: number,
  scale: number,
  viewportHeight: number,
  cameraHeight: number,
  strokeEdgePx: number,
): number {
  if (scale <= 0 || cameraHeight <= 0 || viewportHeight <= 0) {
    return LOOP_START_FOCUS.y
  }
  const room = viewportHeight / 2 - strokeEdgePx
  if (room <= 0) return Math.max(lowestPointY, LOOP_START_FOCUS.y)
  return lowestPointY - room / (cameraHeight * scale)
}

export function loopFocusYCeil(
  startPointY: number,
  scale: number,
  viewportHeight: number,
  cameraHeight: number,
  topPadPx = 16,
): number {
  if (scale <= 0 || cameraHeight <= 0 || viewportHeight <= 0) {
    return 1
  }
  const room = viewportHeight / 2 - topPadPx
  if (room <= 0) return startPointY
  return startPointY + room / (cameraHeight * scale)
}

export function loopFlushLeftFocus(
  pointX: number,
  scale: number,
  focusY: number = LOOP_START_FOCUS.y,
  viewportWidth = 1,
  cameraWidth = 1,
  viewX: number = LOOP_ENTRY_VIEW_X,
): { x: number; y: number } {
  if (scale <= 0 || cameraWidth <= 0) {
    return { x: LOOP_START_FOCUS.x, y: focusY }
  }
  return {
    x: pointX + ((0.5 - viewX) * viewportWidth) / (cameraWidth * scale),
    y: focusY,
  }
}

export function loopEntryFocusY(
  startPointY: number,
  scale: number,
  viewportHeight = 1,
  cameraHeight = 1,
  targetViewY: number = LOOP_ENTRY_VIEW_Y,
  focusFloor: number = LOOP_START_FOCUS.y,
  focusCeil: number = Number.POSITIVE_INFINITY,
): number {
  if (scale <= 0 || cameraHeight <= 0) return focusFloor
  const ideal =
    startPointY + (0.5 * viewportHeight - targetViewY * viewportHeight) / (cameraHeight * scale)
  const floored = Math.max(ideal, focusFloor)
  if (!Number.isFinite(focusCeil)) return floored
  if (focusFloor > focusCeil) return focusFloor
  return Math.min(floored, focusCeil)
}

export function loopClampFocusY(
  focusY: number,
  focusFloor: number,
  focusCeil: number = Number.POSITIVE_INFINITY,
): number {
  const floored = Math.max(focusY, focusFloor)
  if (!Number.isFinite(focusCeil) || focusFloor > focusCeil) return floored
  return Math.min(floored, focusCeil)
}

export type LoopPoint = { x: number; y: number; s: number }
export type LoopScreenPoint = { x: number; y: number; s?: number }

/** Path is in artboard space — no extra transform. */
export function mapPathPointToArtboard(lx: number, ly: number): { x: number; y: number } {
  return { x: lx, y: ly }
}

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

/** Sample step dots on the closed path in artboard space. */
export function sampleLoopStepPoints(pathEl: SVGPathElement): LoopPoint[] {
  const total = pathEl.getTotalLength()

  if (total <= 0) {
    return LOOP_STEPS.map((step) => ({ s: step.s, x: step.x, y: step.y }))
  }

  return LOOP_STEPS.map((step) => {
    const pt = pathEl.getPointAtLength(step.s * total)
    return { s: step.s, x: pt.x, y: pt.y }
  })
}

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

export function pathLength(pathEl: SVGPathElement): number {
  return pathEl.getTotalLength()
}
