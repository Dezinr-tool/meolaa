/**
 * About roadmap — timeline path geometry and milestone sampling.
 */

export const VIEW_MIN_X = -460
export const VIEW_MIN_Y = -140
export const VIEW_W = 2660
export const VIEW_H = 1000

export const ROADMAP_PATH =
  'M-420.829 110.055C-280.522 86.0044 -2.13923 98.8628 -11.0647 342.7C-22.2215 647.495 -171.048 599.019 -208.796 564.115C-237.574 537.505 -216.001 264.93 378.136 139.3C541.499 104.757 885.2 82.6297 1074 161.43C1136 187.307 1220.21 246.43 1239.5 318.43C1258.79 390.43 1233.5 497.03 1149.5 513.43C1044.5 533.93 936 314.43 1446.5 69.9297C1854.9 -125.67 2081.33 208.096 2143.5 399.43'

export const PATH_STROKE_WIDTH = 21
export const ROADMAP_TIP_RADIUS = 17

export type RoadmapStepDef = {
  capsule: string
  label: string
  title: string
  body: string
  s: number
  x: number
  y: number
  dx: number
  dy: number
  copyAnchor: 'below' | 'above' | 'left' | 'right'
}

export const ROADMAP_STEPS: RoadmapStepDef[] = [
  {
    capsule: '2022 · Founded',
    label: '2022 · Founded',
    title: 'Meolaa incorporated.',
    body: 'Pre-seed from Ranjan Pai — the house of brands thesis begins.',
    s: 0.2,
    x: -179,
    y: 582,
    dx: -95,
    dy: 15.536,
    copyAnchor: 'below',
  },
  {
    capsule: '2022 · Seed',
    label: '2022 · Seed',
    title: '$6M seed raised.',
    body: 'Colossa Ventures, General Catalyst and Turbostart back the capital to scale the model.',
    s: 0.38,
    x: 340,
    y: 152,
    dx: 28,
    dy: 64,
    copyAnchor: 'below',
  },
  {
    capsule: '2024 · HIRA',
    label: '2024 · HIRA',
    title: 'HIRA launches.',
    body: 'The first brand built end-to-end on the platform — proof from insight to shelf.',
    s: 0.66,
    x: 1130,
    y: 505,
    dx: 12,
    dy: 38,
    copyAnchor: 'below',
  },
  {
    capsule: '2025 · Platform',
    label: '2025 · Platform',
    title: 'Platform V2 ships.',
    body: 'CMI and Brand Co-pilot unified into one operating system for the house.',
    s: 0.8,
    x: 1442,
    y: 72,
    dx: -16,
    dy: 68,
    copyAnchor: 'below',
  },
]

export const ROADMAP_END_TIP_HIDE = 0.985

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

export type RoadmapPoint = { x: number; y: number; s: number }
export type RoadmapScreenPoint = { x: number; y: number; s?: number }

type SvgViewMetrics = {
  scale: number
  ox: number
  oy: number
  cw: number
  ch: number
  vx: number
  vy: number
  vw: number
  vh: number
}

function getSvgViewMetrics(svg: SVGSVGElement): SvgViewMetrics {
  const vb = svg.viewBox.baseVal
  const vx = vb.width > 0 ? vb.x : VIEW_MIN_X
  const vy = vb.height > 0 ? vb.y : VIEW_MIN_Y
  const vw = vb.width > 0 ? vb.width : VIEW_W
  const vh = vb.height > 0 ? vb.height : VIEW_H
  const { width: cw, height: ch } = svg.getBoundingClientRect()

  if (cw <= 0 || ch <= 0) {
    return { scale: 1, ox: 0, oy: 0, cw, ch, vx, vy, vw, vh }
  }

  const scale = Math.min(cw / vw, ch / vh)
  const rw = vw * scale
  const rh = vh * scale

  return {
    scale,
    ox: (cw - rw) / 2,
    oy: (ch - rh) / 2,
    cw,
    ch,
    vx,
    vy,
    vw,
    vh,
  }
}

export function artboardToContainerFraction(
  svg: SVGSVGElement,
  ax: number,
  ay: number,
): { x: number; y: number } {
  const m = getSvgViewMetrics(svg)

  if (m.cw <= 0 || m.ch <= 0) {
    return { x: (ax - m.vx) / m.vw, y: (ay - m.vy) / m.vh }
  }

  return {
    x: (m.ox + (ax - m.vx) * m.scale) / m.cw,
    y: (m.oy + (ay - m.vy) * m.scale) / m.ch,
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
