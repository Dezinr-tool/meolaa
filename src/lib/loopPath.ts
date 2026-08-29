/**
 * The Loop — path geometry from Figma file wyTuBCCcA5sE0gPtyBc7aX · node 173-391.
 *
 * Path `d` source: Vector 1 on frame 0:28 (node 0:30) ≡ public/loop/vector-full.svg
 * Start tip local point: end of Vector 1 on frame 0:4 (node 0:6) ≡ vector-build.svg
 *   (same geometry in full-path space: 801.651, 187.252)
 *
 * Placement: Figma rotates Vector 1 2.1° around its centre, then positions the
 * AABB at (-438, 126.99) on the 1422×862 artboard — NOT rotate-about-origin.
 *
 * Pin progress 0 = tip parked off-screen left, draw at 0 — path enters on scroll.
 */

export const VIEW_W = 1422
export const VIEW_H = 862

/**
 * Exact Figma start-frame Vector 1 `d` — node 0:6 / public/loop/vector-build.svg
 * (export Y is bbox-normalised; +164.119 aligns into full-path space).
 */
export const LOOP_PATH_START =
  'M2.15134 23.133C141.485 -6.03363 420.151 -3.36697 420.151 240.633C420.151 545.633 269.651 502.633 230.651 469.133C200.919 443.594 69.6513 220.633 801.651 23.133'

/**
 * Exact Figma full Vector 1 `d` — node 0:30 / public/loop/vector-full.svg.
 */
export const LOOP_PATH_FULL =
  'M2.15134 187.252C141.485 158.085 420.151 160.752 420.151 404.752C420.151 709.752 269.651 666.752 230.651 633.252C200.919 607.713 212.508 334.531 801.651 187.252C963.641 146.756 1306.3 112.071 1497.86 183.912C1560.76 207.504 1647.08 263.507 1668.99 334.753C1690.9 405.999 1669.53 513.453 1586.18 532.915C1482 557.242 1365.55 341.858 1866.76 78.8474C2267.73 -131.561 2506.23 193.7 2575.35 382.631'

/**
 * Continuous stroke used for scroll-draw:
 * - Through start tip: Figma 0:6 geometry (Y-aligned) — exact left loop + tip
 * - After tip: Figma 0:30 continuation from cubic 5 onward
 *
 * Start exit cubic uses control (69.6513, 384.752) from 0:6, not (212.508, 334.531)
 * from the trimmed 0:30 export — required so pin-start matches frame 0:4.
 */
export const LOOP_PATH =
  'M2.15134 187.252C141.485 158.085 420.151 160.752 420.151 404.752C420.151 709.752 269.651 666.752 230.651 633.252C200.919 607.713 69.6513 384.752 801.651 187.252C963.641 146.756 1306.3 112.071 1497.86 183.912C1560.76 207.504 1647.08 263.507 1668.99 334.753C1690.9 405.999 1669.53 513.453 1586.18 532.915C1482 557.242 1365.55 341.858 1866.76 78.8474C2267.73 -131.561 2506.23 193.7 2575.35 382.631'

/** End of the start-frame stroke in full-path local coords (node 0:6 tip → 0:30 space). */
export const LOOP_START_TIP_LOCAL = { x: 801.651, y: 187.252 } as const

/**
 * Figma frame 0:28 Vector 1 placement:
 * AABB (-438, 126.99) · inner 2573.198×646.178 · rotate 2.1° about centre
 * → equivalent origin rotate: translate(tx ty) rotate(2.1)
 */
export const PATH_TRANSFORM = 'translate(-413.956 116.447) rotate(2.1)'

export const PATH_STROKE_WIDTH = 28

/** Tip disc radius (px in path/artboard space) — solid leading tip. */
export const LOOP_TIP_RADIUS = 14

/**
 * Solid track color — CSS var; SVG presentation attrs resolve against the
 * document. Prefer CSS `stroke: var(--loop-track)` on `.loop__drawn`.
 * Joyous Yellow (secondary family) — readable on white section bg.
 */
export const PATH_STROKE_COLOR = '#fdf28c'

export type LoopStepDef = {
  label: string
  title: string
  body: string
  /** Normalised position along the path where this step activates (0–1). */
  s: number
  /** Dot centre in artboard px (Figma frame 0:28 — ring frame centres). */
  x: number
  y: number
  /** Where the copy block sits relative to the node (desktop). */
  copyAnchor: 'below-left' | 'above-left' | 'right'
}

/**
 * Build → Run → Signal.
 * Dot centres from Figma 0:28 frames 0:31 / 0:34 / 0:37 (+17 for 34px ring centre).
 * `s` = closest point on LOOP_PATH under PATH_TRANSFORM.
 *
 * Copy anchors match Figma keyframes (0:4 / 0:13 / 0:28): Build+Run below,
 * Signal above — never “right of tip” (0:4 places copy under the tip).
 */
export const LOOP_STEPS: LoopStepDef[] = [
  {
    label: 'Build',
    title: 'AI does the heavy lifting.',
    body: 'Product, brand and go to market assembled by a small team, not a large one.',
    s: 0.3642,
    x: 127,
    y: 404,
    copyAnchor: 'below-left',
  },
  {
    label: 'Run',
    title: 'The system keeps it running.',
    body: 'Distribution, content and operations kept alive by the same engine that built it.',
    s: 0.4412,
    x: 594,
    y: 304,
    copyAnchor: 'below-left',
  },
  {
    label: 'Signal',
    title: 'We read the market before it moves.',
    body: 'Consumer behaviour, demand and whitespace, sorted into a single opportunity score.',
    s: 0.5597,
    x: 1133,
    y: 385,
    copyAnchor: 'above-left',
  },
]

/** Gap from dot edge to copy block — Figma px (34 below Build/Run, 47 above Signal). */
export const LOOP_COPY_GAP = {
  below: 34,
  above: 47,
  right: 24,
} as const

/** Draw progress at which the solid tip hides (path end — Figma 0:28). */
export const LOOP_END_TIP_HIDE = 0.97

/**
 * Copy visibility per off-screen entry + 0:4 → 0:13 → 0:28:
 * - Entry (stage < 0, draw near 0): no step copy
 * - Build (stage 0): Build copy + ring at tip
 * - Run (stage 1): Build + Run copy/rings; tip at Run
 * - Signal (stage 2): all three copy blocks + rings; tip at Signal
 */
export function loopCopyVisible(stepIndex: number, activeStage: number): boolean {
  if (activeStage < 0) return false
  return stepIndex <= activeStage
}

/**
 * HTML rings pop the moment the tip arrives at that milestone
 * (`activeStage >= stepIndex` — same `s` as path draw). Tip disc remains
 * the live leading marker; rings stay once reached.
 * At path end (Figma 0:28) all three rings stay visible and the tip hides.
 */
export function loopRingVisible(
  stepIndex: number,
  activeStage: number,
  drawProgress: number,
): boolean {
  if (drawProgress >= LOOP_END_TIP_HIDE) {
    return activeStage >= 0 && stepIndex <= Math.max(activeStage, 2)
  }
  return activeStage >= stepIndex
}

/** Scroll timeline anchors — path draw + camera + step activation. */
export const LOOP_PROGRESS = {
  build: LOOP_STEPS[0].s,
  run: LOOP_STEPS[1].s,
  signal: LOOP_STEPS[2].s,
} as const

/**
 * Pin progress 0 draws nothing — tip sits off-viewport left (see
 * LOOP_ENTRY_VIEW_X). Scroll maps 0→1 onto the full stroke so the path
 * enters from outside rather than starting as a visible left-edge stub.
 */
export const LOOP_DRAW_ENTRY = 0

/** @deprecated Alias — pin start draw (now 0 / off-screen entry). */
export const LOOP_DRAW_START_FALLBACK = LOOP_DRAW_ENTRY

/** Resolved entry fraction (same as LOOP_DRAW_ENTRY; kept for callers). */
export let LOOP_DRAW_START = LOOP_DRAW_ENTRY

/** Map ScrollTrigger pin progress (0–1) → path draw progress (ENTRY–1). */
export function loopDrawProgress(pinProgress: number): number {
  const p = Math.max(0, Math.min(1, pinProgress))
  return LOOP_DRAW_ENTRY + p * (1 - LOOP_DRAW_ENTRY)
}

/**
 * Kept for mount hooks — entry draw is 0 (off-screen), not the Build tip.
 */
export function resolveLoopDrawStart(_pathEl: SVGPathElement): number {
  LOOP_DRAW_START = LOOP_DRAW_ENTRY
  return LOOP_DRAW_START
}

/** Normalised arc length of the Figma Build tip (for stage / camera beats). */
export function resolveLoopBuildTipS(pathEl: SVGPathElement): number {
  const total = pathEl.getTotalLength()
  if (total <= 0) return LOOP_PROGRESS.build

  const { x: tx, y: ty } = LOOP_START_TIP_LOCAL
  let bestS = LOOP_PROGRESS.build
  let bestD = Number.POSITIVE_INFINITY
  const samples = 4000
  for (let i = 0; i <= samples; i += 1) {
    const s = i / samples
    const pt = pathEl.getPointAtLength(s * total)
    const d = (pt.x - tx) ** 2 + (pt.y - ty) ** 2
    if (d < bestD) {
      bestD = d
      bestS = s
    }
  }
  return bestS
}

/**
 * Camera scale at each beat (inside fixed pinned viewport).
 * Large from pin entry — no small→zoom-in. Held near-constant for most of
 * the pin; only a very gentle settle toward Signal/end.
 *
 * Kept ≤~1.06 so header-shrunk diagram viewports still fit the left bowl +
 * right loop bottoms under overflow:hidden (was 1.1/1.08/1.04).
 */
export const LOOP_CAMERA_SCALES = {
  /**
   * Large entry framing, but not so large that mid-height off-left entry
   * forces the path start above the viewport (see LOOP_START_FOCUS).
   * Was 1.28 — paired with focus.y 0.80 that clipped s=0 off the top.
   */
  start: 1.06,
  build: 1.06,
  run: 1.04,
  signal: 1.02,
} as const

/**
 * Camera keyframes in *draw progress* space.
 * Hold entry framing through Build (no focus snap on activate), then soft
 * Run → Signal → end.
 */
export function loopCamKeys(drawStart: number = LOOP_DRAW_ENTRY): readonly number[] {
  return [
    drawStart,
    LOOP_PROGRESS.build,
    LOOP_PROGRESS.run,
    LOOP_PROGRESS.signal,
    1,
  ]
}

export const LOOP_CAM_SCALE_VALUES = [
  LOOP_CAMERA_SCALES.start,
  LOOP_CAMERA_SCALES.build,
  LOOP_CAMERA_SCALES.run,
  LOOP_CAMERA_SCALES.signal,
  LOOP_CAMERA_SCALES.signal,
] as const

/** Smoothstep for camera segment t — softens keyframe joins. */
export function loopCamEase(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/**
 * Fallback opening camera focus (Y kept as a soft floor; X is usually
 * overridden so path M sits off the left edge). Path M is ~artboard x=-419
 * under PATH_TRANSFORM.
 *
 * Y history: 0.3 → 0.62 → 0.80 cleared the left bowl bottom but pushed path
 * s=0 above the viewport. 0.54 + scale 1.1 left the right loop bottom under
 * overflow:hidden once the header shrinks the diagram viewport and focus
 * soft-drifted toward Signal. 0.62 + scale ~1.06 + dynamic floor from
 * LOOP_PATH_LOWEST keeps the full loop curve in frame.
 */
export const LOOP_START_FOCUS = { x: 0.1, y: 0.62 } as const

/**
 * Deepest path centerline in artboard space under PATH_TRANSFORM (left bowl).
 * Right loop bottom is higher (~708); flooring for this point covers both.
 */
export const LOOP_PATH_LOWEST_ARTBOARD = { x: -136.874, y: 783.639 } as const

/** Extra px below stroke outer edge before the viewport clip. */
export const LOOP_FOCUS_BOTTOM_PAD_PX = 10

/**
 * Target viewport Y (0–1) for path s=0 at pin entry — vertical mid of the
 * camera, not the top. Ideal focusY is derived from this; LOOP_START_FOCUS.y
 * is the floor so the left bowl does not clip.
 */
export const LOOP_ENTRY_VIEW_Y = 0.45

/**
 * Target viewport X for path s=0 at pin entry (fraction of viewport width).
 * 0 = left edge; negative = parked off-screen left so the stroke/tip enter
 * from outside on scroll (clears tip disc + stroke width at entry scale).
 */
export const LOOP_ENTRY_VIEW_X = -0.08

/** Path entry / start focus alias. */
export const PATH_ENTRY = LOOP_START_FOCUS

/**
 * Half-stroke (+ pad) in viewport pixels at the current camera scale.
 * Uses the same slice PAR as `.loop__svg` (`xMidYMid slice`).
 */
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

/**
 * Minimum focus.y so `lowestPointY` (container fraction) + stroke edge stays
 * above the viewport bottom under `overflow: hidden`.
 */
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

/**
 * Maximum focus.y so path s=0 stays below the viewport top (left entry).
 */
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

/**
 * Camera focus that places a container-fraction point at a viewport X.
 * `screenX = vw/2 + (pointX - focusX) * cw * scale`
 * → `focusX = pointX + (0.5 - viewX) * vw / (cw * scale)`.
 * Default `viewX` is off-screen left (`LOOP_ENTRY_VIEW_X`).
 */
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

/**
 * Entry focus Y: put path s=0 at `LOOP_ENTRY_VIEW_Y`, floored so the path
 * bottom (+ stroke) stays in frame, capped so s=0 does not leave the top.
 * When floor > ceil (very short viewports), prefer the floor — bottom clip
 * is the visible bug; tip may sit slightly high.
 */
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

/** Clamp any camera focus Y into [floor, ceil] for the current scale. */
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

/** Normalised position inside the SVG viewport (0–1), accounting for slice PAR. */
export type LoopScreenPoint = { x: number; y: number; s?: number }

const PATH_ROT_RAD = (2.1 * Math.PI) / 180
const PATH_ROT_COS = Math.cos(PATH_ROT_RAD)
const PATH_ROT_SIN = Math.sin(PATH_ROT_RAD)
/** Matches PATH_TRANSFORM translate — Figma centre-rotate flattened to origin-rotate. */
const PATH_TX = -413.956
const PATH_TY = 116.447

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
