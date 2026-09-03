/**
 * About roadmap — scroll-pinned timeline (full path visible, stroke draw on scrub).
 * Pin/scrub lives in initAboutRoadmap (innerPageAnimations/about.ts).
 */
import { useLayoutEffect, useRef, useState } from 'react'
import {
  ROADMAP_PATH,
  ROADMAP_STEPS,
  ROADMAP_TIP_RADIUS,
  PATH_STROKE_WIDTH,
  VIEW_H,
  VIEW_W,
  VIEW_MIN_X,
  VIEW_MIN_Y,
  artboardToContainerFraction,
  sampleRoadmapStepPoints,
  type RoadmapScreenPoint,
} from '../../lib/aboutRoadmapPath'
import './AboutRoadmapSection.css'

type StepPoint = RoadmapScreenPoint & { dxPx: number; dyPx: number }

const FALLBACK_POINTS: StepPoint[] = ROADMAP_STEPS.map((step) => ({
  s: step.s,
  x: (step.x - VIEW_MIN_X) / VIEW_W,
  y: (step.y - VIEW_MIN_Y) / VIEW_H,
  dxPx: 0,
  dyPx: 0,
}))

export function AboutRoadmapSection() {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [points, setPoints] = useState<StepPoint[]>(FALLBACK_POINTS)

  useLayoutEffect(() => {
    const path = pathRef.current
    const svg = svgRef.current
    if (!path || !svg) return

    const syncLayout = () => {
      path.getTotalLength()
      const artboardPts = sampleRoadmapStepPoints(path)
      const rect = svg.getBoundingClientRect()
      const unitPx = rect.width > 0 ? rect.width / VIEW_W : 0
      setPoints(
        artboardPts.map((pt, i) => {
          const frac = artboardToContainerFraction(svg, pt.x, pt.y)
          const step = ROADMAP_STEPS[i]
          return {
            s: pt.s,
            x: frac.x,
            y: frac.y,
            dxPx: (step?.dx ?? 0) * unitPx,
            dyPx: (step?.dy ?? 0) * unitPx,
          }
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
          <header className="au-roadmap__header section-head section-head--on-light">
            <p className="section-head__eyebrow">Milestones</p>
            <h2 className="section-head__title">Our Story</h2>
            <p className="section-head__sub">
              From incorporation to one operating system.
            </p>
          </header>

          <div className="au-roadmap__stage">
            <div className="au-roadmap__viewport" data-au-roadmap-viewport>
              <div className="au-roadmap__artboard" data-au-roadmap-artboard>
                <svg
                  ref={svgRef}
                  className="au-roadmap__svg"
                  viewBox={`${VIEW_MIN_X} ${VIEW_MIN_Y} ${VIEW_W} ${VIEW_H}`}
                  fill="none"
                  aria-hidden="true"
                  overflow="visible"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    className="au-roadmap__ghost"
                    d={ROADMAP_PATH}
                    strokeWidth={PATH_STROKE_WIDTH}
                  />
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
                </svg>

                <div className="au-roadmap__track" role="list">
                  {ROADMAP_STEPS.map((step, i) => {
                    const pt = points[i] ?? FALLBACK_POINTS[i]
                    return (
                      <article
                        key={step.capsule}
                        className={`au-roadmap__step au-roadmap__step--copy-${step.copyAnchor}`}
                        data-au-roadmap-step
                        data-s={step.s}
                        role="listitem"
                        style={{
                          left: `${pt.x * 100}%`,
                          top: `${pt.y * 100}%`,
                        }}
                      >
                        <span className="au-roadmap__marker" aria-hidden="true">
                          <span className="au-roadmap__diamond" />
                        </span>
                        <div
                          className="au-roadmap__copy"
                          style={{
                            '--au-rm-copy-dx': `${pt.dxPx}px`,
                            '--au-rm-copy-dy': `${pt.dyPx}px`,
                          } as React.CSSProperties}
                        >
                          <p className="au-roadmap__copy-label">{step.label}</p>
                          <h3 className="au-roadmap__copy-title">{step.title}</h3>
                          <p className="au-roadmap__copy-body">{step.body}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div
            className="au-roadmap__caption"
            data-au-roadmap-caption
            aria-live="polite"
          >
            <p className="au-roadmap__copy-label">{ROADMAP_STEPS[0]?.label}</p>
            <h3 className="au-roadmap__copy-title">{ROADMAP_STEPS[0]?.title}</h3>
            <p className="au-roadmap__copy-body">{ROADMAP_STEPS[0]?.body}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
