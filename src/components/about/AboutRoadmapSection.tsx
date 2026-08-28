/**
 * About roadmap — scroll-pinned horizontal timeline (Loop-style).
 * Pin/scrub + path draw live in initAboutRoadmap (innerPageAnimations/about.ts).
 */
import { useLayoutEffect, useRef, useState } from 'react'
import {
  ROADMAP_PATH,
  ROADMAP_STEPS,
  ROADMAP_TIP_RADIUS,
  PATH_STROKE_WIDTH,
  PATH_TRANSFORM,
  VIEW_H,
  VIEW_W,
  artboardToContainerFraction,
  pathLength,
  sampleRoadmapStepPoints,
  type RoadmapScreenPoint,
} from '../../lib/aboutRoadmapPath'
import './AboutRoadmapSection.css'

const FALLBACK_POINTS: RoadmapScreenPoint[] = ROADMAP_STEPS.map((step) => ({
  s: step.s,
  x: step.x / VIEW_W,
  y: step.y / VIEW_H,
}))

export function AboutRoadmapSection() {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [points, setPoints] = useState<RoadmapScreenPoint[]>(FALLBACK_POINTS)

  useLayoutEffect(() => {
    const path = pathRef.current
    const svg = svgRef.current
    if (!path || !svg) return

    const syncLayout = () => {
      pathLength(path)
      const artboardPts = sampleRoadmapStepPoints(path)
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
    <section
      className="au-roadmap"
      id="about-story"
      data-au-roadmap
      aria-label="Our Story"
    >
      <div className="au-roadmap__pin" data-au-roadmap-pin>
        <div className="au-roadmap__card">
          <header className="au-roadmap__header">
            <div className="au-roadmap__intro">
              <p className="au-roadmap__caption">Milestones</p>
              <h2 className="au-roadmap__title">Our Story</h2>
              <p className="au-roadmap__subtitle">
                From incorporation to one operating system.
              </p>
            </div>
            <p className="au-roadmap__desc">
              Meolaa is an AI-native house of consumer brands — built to read
              demand and launch faster than any traditional FMCG company can
              move. These are the moments that shaped the model.
            </p>
          </header>

          <div className="au-roadmap__stage">
            <div className="au-roadmap__viewport" data-au-roadmap-viewport>
              <div className="au-roadmap__camera" data-au-roadmap-camera>
                <svg
                  ref={svgRef}
                  className="au-roadmap__svg"
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  fill="none"
                  aria-hidden="true"
                  overflow="visible"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <g transform={PATH_TRANSFORM || undefined}>
                    <path
                      ref={pathRef}
                      id="au-roadmap-path"
                      className="au-roadmap__drawn"
                      data-au-roadmap-drawn
                      d={ROADMAP_PATH}
                      strokeWidth={PATH_STROKE_WIDTH}
                    />
                    <circle
                      className="au-roadmap__tip"
                      data-au-roadmap-tip
                      r={ROADMAP_TIP_RADIUS}
                      cx="0"
                      cy="0"
                    />
                  </g>
                </svg>

                <div className="au-roadmap__track" data-au-roadmap-track role="list">
                  {ROADMAP_STEPS.map((step, i) => {
                    const pt = points[i] ?? FALLBACK_POINTS[i]
                    return (
                      <article
                        key={step.capsule}
                        className="au-roadmap__step"
                        data-au-roadmap-step
                        data-s={step.s}
                        role="listitem"
                        style={{
                          left: `${pt.x * 100}%`,
                          top: `${pt.y * 100}%`,
                        }}
                      >
                        <span className="au-roadmap__capsule">{step.capsule}</span>
                        <span className="au-roadmap__marker" aria-hidden="true">
                          <span className="au-roadmap__diamond" data-au-roadmap-diamond />
                        </span>
                        <ul className="au-roadmap__bullets">
                          {step.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
