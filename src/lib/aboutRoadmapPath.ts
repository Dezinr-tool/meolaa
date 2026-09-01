/**
 * About roadmap — horizontal timeline path geometry.
 * Mirrors loopPath.ts patterns for scroll-draw + milestone sampling.
 */

/**
 * Path + viewBox come straight from Figma (file 8i9eIHImFGm2Mrf9haxErD,
 * node 40:344 "Section 2" → Vector 1), exported via the Figma MCP and used
 * verbatim — no re-drawing, no simplification, so the curve matches the
 * design exactly. The viewBox uses the path's own natural bounds (with a
 * little margin) rather than translating every coordinate, which keeps the
 * `d` string byte-identical to the export. The vertical margin is deliberately
 * generous (path spans y≈0–600 inside a -140..860 box) so the copy hanging
 * below the lowest marker still has room instead of clipping at the card edge.
 */
export const VIEW_MIN_X = -460
export const VIEW_MIN_Y = -140
export const VIEW_W = 2660
export const VIEW_H = 1000

/** Figma frame width — how much of the path is visible at once (the camera
 *  pans across the rest as you scroll). */
export const VIEW_WINDOW_W = 1422

export const ROADMAP_PATH =
  'M-420.829 110.055C-280.522 86.0044 -2.13923 98.8628 -11.0647 342.7C-22.2215 647.495 -171.048 599.019 -208.796 564.115C-237.574 537.505 -216.001 264.93 378.136 139.3C541.499 104.757 885.2 82.6297 1074 161.43C1136 187.307 1220.21 246.43 1239.5 318.43C1258.79 390.43 1233.5 497.03 1149.5 513.43C1044.5 533.93 936 314.43 1446.5 69.9297C1854.9 -125.67 2081.33 208.096 2143.5 399.43'

export const PATH_TRANSFORM = ''

/** Figma stroke-width on Vector 1. */
export const PATH_STROKE_WIDTH = 21

export const ROADMAP_TIP_RADIUS = 17

export type RoadmapStepDef = {
  capsule: string
  bullets: readonly string[]
  /** Loop-style card copy — label/title/body, same language as the
   *  homepage Loop section's orbit cards. */
  label: string
  title: string
  body: string
  /** Normalised position along the path (0–1). */
  s: number
  /** Fallback dot centre in artboard px. */
  x: number
  y: number
  /** Copy-block offset from the marker, in path units. The curve doubles
   *  back on itself twice, so a block hanging straight below its marker
   *  collides with the stroke at several points — these nudge each one into
   *  clear space. Tuned against the rendered path, not guessed. */
  dx: number
  dy: number
}

export const ROADMAP_STEPS: RoadmapStepDef[] = [
  {
    capsule: '2022 · Founded',
    bullets: [
      'Meolaa incorporated',
      'Pre-seed from Ranjan Pai',
      'House of brands thesis begins',
    ],
    label: '2022 · Founded',
    title: 'Meolaa incorporated.',
    body: 'Pre-seed from Ranjan Pai — the house of brands thesis begins.',
    /* s values were chosen by sampling the real path in the browser and
       measuring vertical clearance below each candidate (ignoring the local
       segment): a 436×249-unit box hanging below each of these four is
       provably clear of the stroke, so the copy never lands on the curve
       (verified by sweeping every s in 0.02 steps against the real path). Fallback x/y match those sampled points;
       the live positions come from sampleRoadmapStepPoints. */
    s: 0.2,
    x: -179,
    y: 582,
    dx: 0,
    dy: 0,
  },
  {
    capsule: '2022 · Seed',
    bullets: [
      '$6M seed raised',
      'Colossa Ventures, General Catalyst, Turbostart',
      'Capital to scale the model',
    ],
    label: '2022 · Seed',
    title: '$6M seed raised.',
    body: 'Colossa Ventures, General Catalyst and Turbostart back the capital to scale the model.',
    s: 0.38,
    x: 340,
    y: 152,
    dx: 0,
    dy: 0,
  },
  {
    capsule: '2024 · HIRA',
    bullets: [
      'HIRA launches',
      'First brand built end-to-end on the platform',
      'Proof from insight to shelf',
    ],
    label: '2024 · HIRA',
    title: 'HIRA launches.',
    body: 'The first brand built end-to-end on the platform — proof from insight to shelf.',
    s: 0.66,
    x: 1130,
    y: 505,
    dx: 0,
    dy: 0,
  },
  {
    capsule: '2025 · Platform',
    bullets: [
      'Platform v2 ships',
      'CMI and Brand Co-pilot unified',
      'One operating system for the house',
    ],
    label: '2025 · Platform',
    title: 'Platform v2 ships.',
    body: 'CMI and Brand Co-pilot unified into one operating system for the house.',
    s: 0.8,
    x: 1442,
    y: 72,
    dx: 0,
    dy: 0,
  },
]

export const ROADMAP_END_TIP_HIDE = 0.985

/** Map pin progress (0–1) → draw progress (0–1). */
export function roadmapDrawProgress(pinProgress: number): number {
  const p = Math.max(0, Math.min(1, pinProgress))
  return p
}

export function roadmapRingVisible(
  stepIndex: number,
  activeStage: number,
  drawProgress: number,
): boolean {
  if (drawProgress >= ROADMAP_END_TIP_HIDE) {
    return activeStage >= 0 && stepIndex <= Math.max(activeStage, ROADMAP_STEPS.length - 1)
  }
  return activeStage >= stepIndex
}

export function roadmapBulletsVisible(stepIndex: number, activeStage: number): boolean {
  if (activeStage < 0) return false
  return stepIndex === activeStage
}

export type RoadmapPoint = { x: number; y: number; s: number }

export type RoadmapScreenPoint = { x: number; y: number; s?: number }

/** Map artboard/viewBox coords → normalised container fractions (0–1). */
export function artboardToContainerFraction(
  svg: SVGSVGElement,
  ax: number,
  ay: number,
): { x: number; y: number } {
  const vb = svg.viewBox.baseVal
  const vw = vb.width > 0 ? vb.width : VIEW_W
  const vh = vb.height > 0 ? vb.height : VIEW_H
  /* The Figma path keeps its own (negative-origin) coordinate space, so the
     viewBox min-x/min-y must be subtracted before scaling — without this
     every sampled point lands ~460u/100u off. */
  const vx = vb.width > 0 ? vb.x : VIEW_MIN_X
  const vy = vb.height > 0 ? vb.y : VIEW_MIN_Y
  const { width: cw, height: ch } = svg.getBoundingClientRect()

  if (cw <= 0 || ch <= 0) {
    return { x: (ax - vx) / vw, y: (ay - vy) / vh }
  }

  const scale = Math.min(cw / vw, ch / vh)
  const rw = vw * scale
  const rh = vh * scale
  const ox = (cw - rw) / 2
  const oy = (ch - rh) / 2

  return {
    x: (ox + (ax - vx) * scale) / cw,
    y: (oy + (ay - vy) * scale) / ch,
  }
}

export function sampleRoadmapStepPoints(pathEl: SVGPathElement): RoadmapPoint[] {
  const total = pathEl.getTotalLength()

  if (total <= 0) {
    return ROADMAP_STEPS.map((step) => ({ s: step.s, x: step.x, y: step.y }))
  }

  return ROADMAP_STEPS.map((step) => {
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

export function pathLength(pathEl: SVGPathElement): number {
  return pathEl.getTotalLength()
}
