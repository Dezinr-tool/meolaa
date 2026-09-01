/**
 * THE LOOP — Figma circular orbit (Untitled 0:3).
 * Layout: Build at BL, Run at top, Signal at BR.
 * Pin + scrub: yellow fill travels BL → top → BR → BL
 * (Build → Run → Signal). Increasing atan2 in SVG Y-down.
 */
import { LOOP_STEPS } from '../../lib/loopPath'
import { LoopParticles } from './LoopParticles'
import { LoopTitleTuner } from './LoopTitleTuner'
import { ParallaxHeading } from './ParallaxHeading'
import './LoopSection.css'

/** Orbit geometry in Figma artboard space (1422×1117). */
const AB_W = 1422
const AB_H = 1117
/** Ellipse 0:26 — size 578, top 340, centred → centre (711, 629). */
const CX = 711
const CY = 629
/** Ghost + yellow centerline = Figma ellipse radius (578 / 2). */
const TRACK_R = 289
/** Outer node disc (Figma 63px) — connector stops at its rim. */
const DOT_OUTER_R = 31.5

/** Angle seeds from Figma node centres (Build BL / Run top / Signal BR). */
const ANGLE_SEED = {
  bl: { x: 469.5, y: 787.5 },
  top: { x: 714.5, y: 340.5 },
  br: { x: 949.5, y: 792.5 },
} as const

function polar(angle: number, r = TRACK_R) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

const A_BL = Math.atan2(ANGLE_SEED.bl.y - CY, ANGLE_SEED.bl.x - CX)
const A_TOP = Math.atan2(ANGLE_SEED.top.y - CY, ANGLE_SEED.top.x - CX)
const A_BR = Math.atan2(ANGLE_SEED.br.y - CY, ANGLE_SEED.br.x - CX)

/** On-track centres — same radius the yellow track used to sit on. */
const ON_TRACK_RAW = {
  bl: polar(A_BL),
  top: polar(A_TOP),
  br: polar(A_BR),
} as const

/**
 * The Three.js ring's world position has been retuned several times since
 * this polar geometry was set up, so the "top" dot has drifted off the
 * ring's actual on-screen top edge. Nudging it down here (Figma-space
 * units) re-lands it on the ring without touching bl/br, which are still
 * correctly aligned.
 */
const ON_TRACK = {
  ...ON_TRACK_RAW,
  top: { x: ON_TRACK_RAW.top.x, y: ON_TRACK_RAW.top.y + 90 },
} as const

function pctX(x: number) {
  return `${((x / AB_W) * 100).toFixed(3)}%`
}
function pctY(y: number) {
  return `${((y / AB_H) * 100).toFixed(3)}%`
}

/**
 * Increasing-atan2 arc length (SVG Y-down polar):
 * BL → left → top → right → BR → bottom → BL.
 */
function orbitDelta(from: number, to: number) {
  let d = to - from
  while (d < 0) d += Math.PI * 2
  while (d >= Math.PI * 2) d -= Math.PI * 2
  return d
}

const TWO_PI = Math.PI * 2
const SEG_BL_TOP = orbitDelta(A_BL, A_TOP)
const SEG_TOP_BR = orbitDelta(A_TOP, A_BR)

/** Normalised arc positions (BL → Run → Signal → BL). */
const ARC_S = {
  build: 0,
  run: SEG_BL_TOP / TWO_PI,
  signal: (SEG_BL_TOP + SEG_TOP_BR) / TWO_PI,
} as const

/**
 * Pin progress when each beat activates.
 * Build (BL) → Run (top) → Signal (BR), then close the loop.
 */
const ORBIT_STEPS = [
  {
    ...LOOP_STEPS[0],
    slot: 'bl' as const,
    s: 0.22,
    arcS: ARC_S.build,
    /* Copy left of Build — line ends at left rim of the dark disc. */
    line: {
      x1: 355,
      y1: ON_TRACK.bl.y,
      x2: ON_TRACK.bl.x - DOT_OUTER_R,
      y2: ON_TRACK.bl.y,
    },
  },
  {
    ...LOOP_STEPS[1],
    slot: 'top' as const,
    s: 0.42,
    arcS: ARC_S.run,
    line: {
      x1: 249,
      y1: ON_TRACK.top.y,
      x2: ON_TRACK.top.x - DOT_OUTER_R,
      y2: ON_TRACK.top.y,
    },
  },
  {
    ...LOOP_STEPS[2],
    slot: 'br' as const,
    s: 0.62,
    arcS: ARC_S.signal,
    line: {
      x1: ON_TRACK.br.x + DOT_OUTER_R,
      y1: ON_TRACK.br.y,
      x2: 1058,
      y2: ON_TRACK.br.y,
    },
  },
]

/** CSS custom props — dots + copy share polar TRACK_R with the SVG path. */
const ORBIT_STYLE = {
  ['--loop-dot-bl-x' as string]: pctX(ON_TRACK.bl.x),
  ['--loop-dot-bl-y' as string]: pctY(ON_TRACK.bl.y),
  ['--loop-dot-br-x' as string]: pctX(ON_TRACK.br.x),
  ['--loop-dot-br-y' as string]: pctY(ON_TRACK.br.y),
  ['--loop-dot-top-x' as string]: pctX(ON_TRACK.top.x),
  ['--loop-dot-top-y' as string]: pctY(ON_TRACK.top.y),
  /* Shifted further left than the Figma seed value — the wider copy card
     (widened separately for readability) was overlapping the Build dot
     at this artboard scale otherwise. */
  ['--loop-copy-bl-x' as string]: pctX(-20),
  ['--loop-copy-bl-y' as string]: pctY(ON_TRACK.bl.y),
  ['--loop-copy-br-x' as string]: pctX(1092),
  ['--loop-copy-br-y' as string]: pctY(ON_TRACK.br.y),
  ['--loop-copy-top-x' as string]: pctX(149),
  ['--loop-copy-top-y' as string]: pctY(ON_TRACK.top.y),
} as const

export function LoopSection() {
  return (
    <section
      className="fold loop"
      data-section="loop"
      data-loop-orbit
      aria-labelledby="loop-title"
    >
      <LoopParticles />
      <LoopTitleTuner />

      <div
        className="loop__artboard"
        data-loop-orbit-stage
        style={ORBIT_STYLE}
      >
        <header className="loop__header section-head">
          <p className="section-head__eyebrow">The Loop</p>
          <ParallaxHeading
            id="loop-title"
            className="section-head__title loop__title"
          >
            <span className="loop__title-line">
              <span className="loop__title-word loop__title-word--solid">
                Turning
              </span>{' '}
              <span className="loop__title-word loop__title-word--fill">
                intelligence
              </span>
            </span>
            <span className="loop__title-line">
              <span className="loop__title-word loop__title-word--solid">
                into
              </span>{' '}
              <span className="loop__title-word loop__title-word--outline">
                brands
              </span>
            </span>
          </ParallaxHeading>
        </header>

        <svg
          className="loop__orbit-svg"
          viewBox={`0 0 ${AB_W} ${AB_H}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {ORBIT_STEPS.map((stage) => (
            <line
              key={`line-${stage.slot}`}
              className="loop__orbit-line"
              data-loop-orbit-line={stage.slot}
              x1={stage.line.x1}
              y1={stage.line.y1}
              x2={stage.line.x2}
              y2={stage.line.y2}
              stroke="var(--loop-line)"
              strokeWidth="1"
            />
          ))}
        </svg>

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
