/**
 * THE LOOP — Signal → Build → Run (continuous closed circuit).
 *
 * Fixed full-bleed viewport; scroll draws one full lap around the closed path
 * and drives the camera inside `.loop__camera`. Pin/scrub in initLoop.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import {
  LOOP_PATH,
  LOOP_STEPS,
  LOOP_TIP_RADIUS,
  PATH_STROKE_WIDTH,
  VIEW_H,
  VIEW_W,
  artboardToContainerFraction,
  pathLength,
  sampleLoopStepPoints,
  type LoopScreenPoint,
} from '../../lib/loopPath'
import { ParallaxHeading } from './ParallaxHeading'
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
        <header className="loop__header section-head section-head--on-light">
          <p className="loop__eyebrow section-head__eyebrow">How we build brands</p>
          <ParallaxHeading className="loop__title section-head__title">
            The Loop
          </ParallaxHeading>
          <p className="section-head__sub">
            Signal feeds Build. Build feeds Run. Run feeds Signal — one continuous
            system.
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
              overflow="visible"
              preserveAspectRatio="xMidYMid slice"
            >
              {/* Closed circuit — dash grows with the leading tip around the loop */}
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
                r={LOOP_TIP_RADIUS}
                cx="0"
                cy="0"
              />
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
