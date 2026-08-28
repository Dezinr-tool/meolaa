/**
 * About roadmap — horizontal timeline path geometry.
 * Mirrors loopPath.ts patterns for scroll-draw + milestone sampling.
 */

export const VIEW_W = 1000
export const VIEW_H = 140

/** Horizontal track through diamond centres (viewBox y = 88). */
export const ROADMAP_PATH = 'M 72 88 L 928 88'

export const PATH_TRANSFORM = ''

export const PATH_STROKE_WIDTH = 3

export const ROADMAP_TIP_RADIUS = 5

export type RoadmapStepDef = {
  capsule: string
  bullets: readonly string[]
  /** Normalised position along the path (0–1). */
  s: number
  /** Fallback dot centre in artboard px. */
  x: number
  y: number
}

export const ROADMAP_STEPS: RoadmapStepDef[] = [
  {
    capsule: '2022 · Founded',
    bullets: [
      'Meolaa incorporated',
      'Pre-seed from Ranjan Pai',
      'House of brands thesis begins',
    ],
    s: 0,
    x: 72,
    y: 88,
  },
  {
    capsule: '2022 · Seed',
    bullets: [
      '$6M seed raised',
      'Colossa Ventures, General Catalyst, Turbostart',
      'Capital to scale the model',
    ],
    s: 0.333,
    x: 357,
    y: 88,
  },
  {
    capsule: '2024 · HIRA',
    bullets: [
      'HIRA launches',
      'First brand built end-to-end on the platform',
      'Proof from insight to shelf',
    ],
    s: 0.666,
    x: 642,
    y: 88,
  },
  {
    capsule: '2025 · Platform',
    bullets: [
      'Platform v2 ships',
      'CMI and Brand Co-pilot unified',
      'One operating system for the house',
    ],
    s: 1,
    x: 928,
    y: 88,
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
  const { width: cw, height: ch } = svg.getBoundingClientRect()

  if (cw <= 0 || ch <= 0) {
    return { x: ax / vw, y: ay / vh }
  }

  const scale = Math.min(cw / vw, ch / vh)
  const rw = vw * scale
  const rh = vh * scale
  const ox = (cw - rw) / 2
  const oy = (ch - rh) / 2

  return {
    x: (ox + ax * scale) / cw,
    y: (oy + ay * scale) / ch,
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
