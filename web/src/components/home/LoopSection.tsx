/**
 * THE LOOP — Build → Run → Signal.
 *
 * Fixed full-bleed viewport; scroll draws path + drives camera zoom inside
 * `.loop__camera`. Pin/scrub lives in HomeAnimations (Lenis + ST.update).
 */
import { useLayoutEffect, useRef, useState } from 'react'
import {
  LOOP_PATH,
  LOOP_STEPS,
  PATH_GRADIENT,
  PATH_STROKE_WIDTH,
  PATH_TRANSFORM,
  VIEW_H,
  VIEW_W,
  artboardToContainerFraction,
  pathLength,
  sampleLoopStepPoints,
  type LoopScreenPoint,
} from '../../lib/loopPath'
import './LoopSection.css'

const FALLBACK_POINTS: LoopScreenPoint[] = LOOP_STEPS.map((step) => ({
  s: step.s,
  x: step.x / VIEW_W,
  y: step.y / VIEW_H,
}))

export function LoopSection() {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [points, setPoints] = useState<LoopScreenPoint[]>(FALLBACK_POINTS)

  useLayoutEffect(() => {
    const path = pathRef.current
    const svg = svgRef.current
    if (!path || !svg) return

    const syncLayout = () => {
      pathLength(path)
      const artboardPts = sampleLoopStepPoints(path)
      setPoints(
        artboardPts.map((pt) => {
          const frac = artboardToContainerFraction(svg, pt.x, pt.y)
          return { s: pt.s, x: frac.x, y: frac.y }
        }),
      )
    }

    syncLayout()
    const ro = new ResizeObserver(syncLayout)
    ro.observe(svg)
    return () => ro.disconnect()
  }, [])

  return (
    <section className="fold loop" data-section="loop">
      <div className="loop__inner">
        <header className="loop__header section-head">
          <p className="loop__eyebrow section-head__eyebrow">The Loop</p>
          <h2 className="loop__title section-head__title">
            How we build brands
          </h2>
          <p className="section-head__sub">
            Three stages, one continuous system — each one feeding the next.
          </p>
        </header>

        <div className="loop__viewport" data-loop-viewport>
          <div className="loop__camera" data-loop-camera>
            <svg
              ref={svgRef}
              className="loop__svg"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              fill="none"
              aria-hidden="true"
              preserveAspectRatio="xMidYMid slice"
            >
              <g transform={PATH_TRANSFORM}>
                <defs>
                  <linearGradient
                    id={PATH_GRADIENT.id}
                    data-loop-gradient
                    x1={PATH_GRADIENT.x1}
                    y1={PATH_GRADIENT.y1}
                    x2={PATH_GRADIENT.x2}
                    y2={PATH_GRADIENT.y2}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#ffffff" />
                    <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  ref={pathRef}
                  id="loop-path"
                  className="loop__drawn"
                  data-loop-drawn
                  d={LOOP_PATH}
                  strokeWidth={PATH_STROKE_WIDTH}
                />
                <circle
                  className="loop__tip"
                  data-loop-tip
                  r={11}
                  cx={0}
                  cy={0}
                  opacity={0}
                />
              </g>
            </svg>

            {LOOP_STEPS.map((stage, i) => {
              const pt = points[i] ?? FALLBACK_POINTS[i]
              return (
                <article
                  key={stage.label}
                  className={`loop__step loop__step--${stage.copyAnchor}`}
                  data-loop-step
                  data-s={stage.s}
                  style={{
                    left: `${pt.x * 100}%`,
                    top: `${pt.y * 100}%`,
                  }}
                  data-focus-x={pt.x}
                  data-focus-y={pt.y}
                >
                  <span className="loop__dot" data-loop-dot aria-hidden="true" />
                  <div className="loop__copy" data-loop-copy>
                    <p className="loop__copy-label">{stage.label}</p>
                    <h3 className="loop__copy-title">{stage.title}</h3>
                    <p className="loop__copy-body">{stage.body}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
