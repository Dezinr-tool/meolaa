import { useEffect, useRef } from 'react'
import {
  MeolaaLogoMark,
  MEOLAA_MARK_VIEWBOX_TIGHT,
} from '../brand/MeolaaLogoMark'
import { gsap, ScrollTrigger } from '../../lib/motion'
import './FoundingSection.css'

/** Extra scroll the fold holds for, as a fraction of the viewport. This is the
 *  "slow down and read it" dial: the section parks on screen for this much
 *  additional scrolling before the page moves on. Every other major fold is
 *  pinned; this one wasn't, which is why it read too fast. */
const FOUNDING_HOLD_VH = 0.9

/**
 * About / founding — white section ground, full-bleed team cutout as hero stage,
 * large primary Meolaa wordmark watermark behind subjects (shows through PNG alpha),
 * bottom row mirrors hero (title + sub | lede + CTA).
 *
 * Layering: bg → mark (Planet Blue) → cutout photo → veil → copy
 */
export function FoundingSection() {
  const sectionRef = useRef<HTMLElement>(null)

  /* Hold the fold still for FOUNDING_HOLD_VH of scroll so the story can be
   * read. Pin only — no scrubbed animation attached, so there is nothing here
   * to fall out of sync; the existing reveals keep their own triggers.
   * Created in this component (not HomeAnimations) to match how Lab and
   * Portfolio register their pins, which keeps pin creation in document order. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const mm = gsap.matchMedia()

    /* Desktop only: on short/mobile viewports a pinned fold plus the address
       bar makes the page feel stuck rather than readable. */
    mm.add('(min-width: 901px)', () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * FOUNDING_HOLD_VH)}`,
        pin: true,
        pinSpacing: true,
        /* No anticipatePin — with Lenis it overshoots and reads as a spring. */
        anticipatePin: 0,
        invalidateOnRefresh: true,
      })
      return () => st.kill()
    })

    return () => {
      mm.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="founding"
      data-section="founding"
      id="story"
      aria-labelledby="founding-title"
    >
      <div className="founding__bg" aria-hidden="true" />

      <div className="founding__inner" data-founding-reveal>
        <figure className="founding__photo" data-founding-photo>
          <div className="founding__frame">
            {/* Watermark under cutout so it reads on the wall behind people */}
            <div className="founding__mark" aria-hidden="true">
              <MeolaaLogoMark
                className="founding__mark-svg"
                viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
                role="presentation"
                aria-hidden="true"
              />
            </div>
            <img
              className="founding__cutout"
              src="/assets/founding-hero.png"
              alt="Meolaa team collaborating in a meeting"
              draggable={false}
            />
            <span className="founding__veil" aria-hidden="true" />
          </div>
        </figure>

        <div className="founding__bottom">
          <div className="founding__lead">
            <p className="founding__eyebrow">Founding</p>
            <h2 id="founding-title" className="founding__title">
              <span className="founding__title-line">
                <span className="founding__title-inner">
                  It started with a question
                </span>
              </span>
              <span className="founding__title-line">
                <span className="founding__title-inner">
                  no one else was asking.
                </span>
              </span>
            </h2>
            <p className="founding__sub">
              How one question became an operating system for consumer brands.
            </p>
          </div>

          <div className="founding__panel">
            <p className="founding__lede">
              We turn emerging{' '}
              <span className="founding__accent">demand</span> into a system that
              launches brands faster than traditional FMCG can move.
            </p>
            <div className="founding__actions">
              <a className="hero__btn founding__cta" href="#story">
                Read Our Story →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
