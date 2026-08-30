/**
 * THE LOOP — Figma circular orbit (Untitled 0:3).
 * Pin + scrub: yellow fill travels clockwise BL → BR → top → BL
 * (Build → Run → Signal). Reverses prior anticlockwise left-arc draw.
 */
import { MeolaaEMark } from '../brand/MeolaaEMark'
import { LOOP_STEPS } from '../../lib/loopPath'
import { ParallaxHeading } from './ParallaxHeading'
import './LoopSection.css'

/** Orbit geometry in Figma artboard space (1422×1117). */
const CX = 711
const CY = 629
/** Ghost + yellow share this centerline radius. */
const TRACK_R = 248
/** Shared stroke width — ghost and yellow sit on the same track. */
const TRACK_SW = 56

const NODE = {
  bl: { x: 469.5, y: 787.5 },
  top: { x: 714.5, y: 340.5 },
  br: { x: 949.5, y: 792.5 },
} as const

function polar(angle: number, r = TRACK_R) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

const A_BL = Math.atan2(NODE.bl.y - CY, NODE.bl.x - CX)
const A_TOP = Math.atan2(NODE.top.y - CY, NODE.top.x - CX)
const A_BR = Math.atan2(NODE.br.y - CY, NODE.br.x - CX)

/**
 * Clockwise delta (user feedback). Decreasing atan2 under SVG Y-down:
 * BL → bottom → BR → right → top → BL.
 */
function cwDelta(from: number, to: number) {
  let d = from - to
  while (d < 0) d += Math.PI * 2
  while (d >= Math.PI * 2) d -= Math.PI * 2
  return d
}

const TWO_PI = Math.PI * 2
const SEG_BL_BR = cwDelta(A_BL, A_BR)
const SEG_BR_TOP = cwDelta(A_BR, A_TOP)

/** Normalised arc positions (BL → Run → Signal → BL). */
const ARC_S = {
  build: 0,
  run: SEG_BL_BR / TWO_PI,
  signal: (SEG_BL_BR + SEG_BR_TOP) / TWO_PI,
} as const

/**
 * Polyline circle — identical `d` for ghost + yellow.
 * Decreasing atan2 reverses the prior anticlockwise left-arc path.
 */
function buildOrbitPath(startAngle: number, segments = 96): string {
  const parts: string[] = []
  for (let i = 0; i <= segments; i += 1) {
    const a = startAngle - (i / segments) * TWO_PI
    const { x, y } = polar(a)
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return parts.join(' ')
}

const ORBIT_ARC_D = buildOrbitPath(A_BL)

/**
 * Pin progress when each beat activates.
 * Build (BL) → Run (BR) → Signal (top), then close the loop.
 */
const ORBIT_STEPS = [
  {
    ...LOOP_STEPS[0],
    slot: 'bl' as const,
    s: 0.22,
    arcS: ARC_S.build,
    line: { x1: 355, y1: 789, x2: 461, y2: 789 },
  },
  {
    ...LOOP_STEPS[1],
    slot: 'br' as const,
    s: 0.42,
    arcS: ARC_S.run,
    line: { x1: 952, y1: 793, x2: 1058, y2: 793 },
  },
  {
    ...LOOP_STEPS[2],
    slot: 'top' as const,
    s: 0.62,
    arcS: ARC_S.signal,
    line: { x1: 249, y1: 340, x2: 683, y2: 340 },
  },
]

export function LoopSection() {
  return (
    <section
      className="fold loop"
      data-section="loop"
      data-loop-orbit
      aria-labelledby="loop-title"
    >
      <div className="loop__artboard" data-loop-orbit-stage>
        <header className="loop__header section-head">
          <p className="section-head__eyebrow">The Loop</p>
          <ParallaxHeading
            id="loop-title"
            className="section-head__title"
          >
            How we build brands
          </ParallaxHeading>
          <p className="section-head__sub">
            Signal feeds Build. Build feeds Run. Run feeds Signal — one continuous
            system.
          </p>
        </header>

        <svg
          className="loop__orbit-svg"
          viewBox="0 0 1422 1117"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Ghost + yellow: same `d`, same stroke width; yellow paints above */}
          <path
            className="loop__orbit-ghost"
            data-loop-orbit-ghost
            d={ORBIT_ARC_D}
            strokeWidth={TRACK_SW}
            strokeLinecap="round"
            fill="none"
          />
          <path
            className="loop__orbit-arc"
            data-loop-orbit-arc
            d={ORBIT_ARC_D}
            stroke="var(--loop-track)"
            strokeWidth={TRACK_SW}
            strokeLinecap="round"
            fill="none"
          />

          {ORBIT_STEPS.map((stage) => (
            <line
              key={`line-${stage.slot}`}
              className="loop__orbit-line"
              data-loop-orbit-line={stage.slot}
              x1={stage.line.x1}
              y1={stage.line.y1}
              x2={stage.line.x2}
              y2={stage.line.y2}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="loop__orbit-mark">
          <MeolaaEMark className="loop__orbit-e" aria-hidden="true" />
        </div>

        {ORBIT_STEPS.map((stage) => (
          <article
            key={stage.label}
            className={`loop__step loop__step--orbit-${stage.slot}`}
            data-loop-step
            data-s={stage.s}
            data-arc-s={stage.arcS}
            data-slot={stage.slot}
          >
            <span className="loop__dot" data-loop-dot aria-hidden="true" />
            <div className="loop__copy" data-loop-copy>
              <p className="loop__copy-label">{stage.label}</p>
              <h3 className="loop__copy-title">{stage.title}</h3>
              <p className="loop__copy-body">{stage.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
