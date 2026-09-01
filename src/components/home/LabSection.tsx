import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/motion'
import { getLenisInstance } from '../../lib/lenisInstance'
import { ParallaxHeading } from './ParallaxHeading'
import './LabSection.css'

type LabStep = {
  id: string
  num: string
  title: string
  desc: string
  image: string
}

const LAB_STEPS: LabStep[] = [
  {
    id: 'reading-demand',
    num: '01',
    title: 'Demand',
    desc: 'We go beyond conventional research to uncover the signals, spaces and possibilities that can shape the next generation of brands.',
    image: '/assets/lab-reading-demand.png',
  },
  {
    id: 'product-brand',
    num: '02',
    title: 'Product development',
    desc: 'We combine intelligence, creativity and technology to turn opportunity into effective products and brands.',
    image: '/assets/lab-product-brand.png',
  },
  {
    id: 'go-to-market',
    num: '03',
    title: 'Go-to-market',
    desc: 'We accelerate brands from idea to market impact through integrated brand, performance, creator and channel strategy, powered by intelligent execution.',
    image: '/assets/lab-go-to-market.png',
  },
  {
    id: 'distribution-ops',
    num: '04',
    title: 'Supply chain & distribution',
    desc: 'We connect distribution, fulfilment and performance to create the operational muscle required to grow.',
    image: '/assets/lab-distribution-ops.png',
  },
]

/** Open panel vs collapsed strip flex weights (Tutorial 109 pattern).
 *  Active grow kept modest so vertical title strips stay readable. */
const ACTIVE_GROW = 4.1
const IDLE_GROW = 0.68

/** Pin travel — ~1 viewport segment per panel (4 steps). */
const LAB_PIN_VH = 3.6
/** Direct scrub (no lag) — numeric scrub + Lenis felt springy on pin enter. */
const LAB_SCRUB = true
/** Timeline units: hold each panel, then scrub the hop to the next. */
const HOLD = 0.42
const TRANS = 0.9

/**
 * Scroll progress → panel index (inclusive holds).
 * Transitions occupy the trailing portion of each segment before the next hold.
 *
 *   progress 0.00 – ~0.25 → 01
 *   progress ~0.25 – ~0.50 → 02
 *   progress ~0.50 – ~0.75 → 03
 *   progress ~0.75 – 1.00 → 04
 */
function panelFromTimelineProgress(p: number, stepCount: number): number {
  const transitions = Math.max(0, stepCount - 1)
  const total = stepCount * HOLD + transitions * TRANS
  if (total <= 0) return 0
  let t = gsap.utils.clamp(0, 1, p) * total
  for (let i = 0; i < stepCount; i += 1) {
    if (t <= HOLD) return i
    t -= HOLD
    if (i < transitions) {
      if (t <= TRANS) return t / TRANS < 0.5 ? i : i + 1
      t -= TRANS
    }
  }
  return stepCount - 1
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return reduced
}

/**
 * Brand Lab — Tutorial 109–style two-way accordion, scroll-scrubbed.
 * Desktop: pin the fold; progress advances 01 → 04 with directional content slides.
 * Mobile: vertical scroll-snap stack (no pin).
 * prefers-reduced-motion: static first panel, no scrub.
 */
export function LabSection() {
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const sectionRef = useRef<HTMLElement>(null)
  const panelsRef = useRef<HTMLDivElement>(null)
  const pinStRef = useRef<ScrollTrigger | null>(null)
  const reduceMotion = usePrefersReducedMotion()

  const applyInstant = useCallback((next: number) => {
    const root = panelsRef.current
    if (!root) return
    const panels = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll('[data-lab-panel]'),
    )

    panels.forEach((panel, i) => {
      const isOpen = i === next
      const content = panel.querySelector<HTMLElement>('.meola-lab__content')
      const smallTitle = panel.querySelector<HTMLElement>(
        '.meola-lab__small-title',
      )
      gsap.set(panel, { flexGrow: isOpen ? ACTIVE_GROW : IDLE_GROW })
      if (content) gsap.set(content, { autoAlpha: isOpen ? 1 : 0, xPercent: 0 })
      if (smallTitle) gsap.set(smallTitle, { autoAlpha: isOpen ? 0 : 1 })
      panel.classList.toggle('is-active', isOpen)
    })
    activeRef.current = next
    setActive(next)
  }, [])

  /* Desktop pin + scrubbed two-way transitions; mobile scroll-snap. */
  useEffect(() => {
    const section = sectionRef.current
    const root = panelsRef.current
    if (!section || !root) return

    const panels = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll('[data-lab-panel]'),
    )
    if (!panels.length) return

    if (reduceMotion) {
      section.classList.add('meola-lab--static')
      applyInstant(0)
      return () => {
        section.classList.remove('meola-lab--static')
      }
    }

    const mm = gsap.matchMedia()

    mm.add('(min-width: 901px)', () => {
      section.classList.add('meola-lab--pinned')
      section.classList.remove('meola-lab--snap')

      panels.forEach((panel, i) => {
        const isOpen = i === 0
        const content = panel.querySelector<HTMLElement>('.meola-lab__content')
        const smallTitle = panel.querySelector<HTMLElement>(
          '.meola-lab__small-title',
        )
        gsap.set(panel, { flexGrow: isOpen ? ACTIVE_GROW : IDLE_GROW })
        if (content) {
          gsap.set(content, { autoAlpha: isOpen ? 1 : 0, xPercent: 0 })
        }
        if (smallTitle) gsap.set(smallTitle, { autoAlpha: isOpen ? 0 : 1 })
        panel.classList.toggle('is-active', isOpen)
      })
      activeRef.current = 0
      setActive(0)

      /* Entrance — panels travel in from off the right edge, ONE AT A TIME
         — a tight stagger (small ms gap per card), not each one taking a
         full second-plus to settle before the next starts (tried that —
         way too slow, read as the UI being broken). Quick and close
         together, essentially "all arrive within one short beat".
         Separate, un-scrubbed ScrollTrigger that fires once, only once
         the section is FULLY in view ('top top' — the same instant the
         pin below engages), not the moment it starts peeking in — the
         pin's own scroll-driven accordion timeline only starts once this
         has actually finished (enableEntranceHold below), so scrubbing
         can't fight the entrance mid-flight.
         Reverses on the way back up so re-entering from below replays it.
         A FIXED pixel offset (not xPercent) — panel 0 is ~4x wider than
         the collapsed strips (ACTIVE_GROW vs IDLE_GROW), so an xPercent
         offset moved it hundreds of px further than its neighbours, and
         that long travel swept it visually across/behind the narrower
         strips mid-flight, reading as their colours bleeding together.
         A small uniform offset keeps every panel's travel within its own
         lane. */
      gsap.fromTo(
        panels,
        { x: () => window.innerWidth * 0.4, autoAlpha: 0 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.55,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            toggleActions: 'play none none reverse',
          },
        },
      )

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * LAB_PIN_VH)}`,
          pin: true,
          scrub: LAB_SCRUB,
          /* Flush pin lock — anticipatePin + Lenis overshoots on enter. */
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = panelFromTimelineProgress(
              self.progress,
              LAB_STEPS.length,
            )
            if (idx !== activeRef.current) {
              activeRef.current = idx
              setActive(idx)
            }
          },
          onRefresh: (self) => {
            pinStRef.current = self
            const idx = panelFromTimelineProgress(
              self.progress,
              LAB_STEPS.length,
            )
            activeRef.current = idx
            setActive(idx)
          },
        },
      })

      pinStRef.current =
        (tl.scrollTrigger as ScrollTrigger | undefined) ?? null

      const addTransition = (from: number, to: number) => {
        const direction = to > from ? 1 : -1
        const leaving = panels[from]
        const entering = panels[to]
        if (!leaving || !entering) return

        const leaveContent =
          leaving.querySelector<HTMLElement>('.meola-lab__content')
        const leaveTitle =
          leaving.querySelector<HTMLElement>('.meola-lab__small-title')
        const enterContent =
          entering.querySelector<HTMLElement>('.meola-lab__content')
        const enterTitle =
          entering.querySelector<HTMLElement>('.meola-lab__small-title')

        const at = tl.duration()

        panels.forEach((panel, i) => {
          const isOpen = i === to
          tl.to(
            panel,
            {
              flexGrow: isOpen ? ACTIVE_GROW : IDLE_GROW,
              duration: TRANS,
              ease: 'power2.inOut',
            },
            at,
          )
          if (i !== from && i !== to) {
            const content =
              panel.querySelector<HTMLElement>('.meola-lab__content')
            const title =
              panel.querySelector<HTMLElement>('.meola-lab__small-title')
            if (content) tl.set(content, { autoAlpha: 0, xPercent: 0 }, at)
            if (title) tl.to(title, { autoAlpha: 1, duration: TRANS * 0.3 }, at)
          }
        })

        if (leaveContent) {
          tl.to(
            leaveContent,
            {
              xPercent: -100 * direction,
              autoAlpha: 0,
              duration: TRANS * 0.5,
              ease: 'power2.in',
            },
            at,
          )
        }
        if (leaveTitle) {
          tl.to(
            leaveTitle,
            { autoAlpha: 1, duration: TRANS * 0.45, ease: 'power1.out' },
            at + TRANS * 0.28,
          )
        }
        if (enterTitle) {
          tl.to(
            enterTitle,
            { autoAlpha: 0, duration: TRANS * 0.28, ease: 'power1.in' },
            at,
          )
        }
        if (enterContent) {
          tl.fromTo(
            enterContent,
            { xPercent: 100 * direction, autoAlpha: 0 },
            {
              xPercent: 0,
              autoAlpha: 1,
              duration: TRANS * 0.72,
              ease: 'power2.out',
            },
            at + TRANS * 0.22,
          )
        }
      }

      /* Hold panel 0, then scrub 01→02→03→04. */
      tl.to({}, { duration: HOLD })
      for (let i = 0; i < LAB_STEPS.length - 1; i += 1) {
        addTransition(i, i + 1)
        tl.to({}, { duration: HOLD })
      }

      return () => {
        section.classList.remove('meola-lab--pinned')
        pinStRef.current = null
        gsap.set(panels, { clearProps: 'flexGrow' })
        panels.forEach((panel) => {
          const content =
            panel.querySelector<HTMLElement>('.meola-lab__content')
          const title =
            panel.querySelector<HTMLElement>('.meola-lab__small-title')
          if (content) gsap.set(content, { clearProps: 'transform,opacity,visibility' })
          if (title) gsap.set(title, { clearProps: 'opacity,visibility' })
        })
      }
    })

    mm.add('(max-width: 900px)', () => {
      section.classList.add('meola-lab--snap')
      section.classList.remove('meola-lab--pinned')
      applyInstant(0)

      const observers: IntersectionObserver[] = []
      const ratios = new Map<number, number>()

      const pickActive = () => {
        let best = 0
        let bestRatio = -1
        ratios.forEach((ratio, index) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = index
          }
        })
        if (best !== activeRef.current) {
          applyInstant(best)
        }
      }

      panels.forEach((panel, index) => {
        const io = new IntersectionObserver(
          ([entry]) => {
            ratios.set(index, entry?.intersectionRatio ?? 0)
            pickActive()
          },
          {
            root: null,
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '-20% 0px -35% 0px',
          },
        )
        io.observe(panel)
        observers.push(io)
      })

      return () => {
        section.classList.remove('meola-lab--snap')
        observers.forEach((io) => io.disconnect())
      }
    })

    ScrollTrigger.refresh()

    return () => {
      mm.revert()
      pinStRef.current = null
      ScrollTrigger.refresh()
    }
  }, [applyInstant, reduceMotion])

  /** a11y: click / keys jump scroll to that panel’s progress (desktop pin). */
  const goToPanel = useCallback(
    (next: number) => {
      if (next < 0 || next >= LAB_STEPS.length) return
      if (reduceMotion) {
        applyInstant(next)
        return
      }

      const st = pinStRef.current
      const narrow =
        typeof window !== 'undefined' &&
        window.matchMedia('(max-width: 900px)').matches

      if (narrow || !st) {
        const panel = panelsRef.current?.querySelectorAll('[data-lab-panel]')[
          next
        ] as HTMLElement | undefined
        if (panel) {
          const lenis = getLenisInstance()
          const top = panel.getBoundingClientRect().top + window.scrollY - 24
          if (lenis) lenis.scrollTo(top, { offset: 0 })
          else window.scrollTo({ top, behavior: 'smooth' })
        }
        applyInstant(next)
        return
      }

      const transitions = LAB_STEPS.length - 1
      const total =
        LAB_STEPS.length * HOLD + transitions * TRANS
      /* Land mid-hold for the target panel. */
      let targetTime = 0
      for (let i = 0; i < next; i += 1) {
        targetTime += HOLD + TRANS
      }
      targetTime += HOLD * 0.5
      const progress = gsap.utils.clamp(0, 1, targetTime / total)
      const y = st.start + (st.end - st.start) * progress
      const lenis = getLenisInstance()
      if (lenis) lenis.scrollTo(y, { immediate: false })
      else window.scrollTo({ top: y, behavior: 'smooth' })
    },
    [applyInstant, reduceMotion],
  )

  return (
    <section
      ref={sectionRef}
      className="fold meola-lab"
      data-section="lab"
      id="lab"
    >
      <div className="meola-lab__intro" data-lab-arrow-slot>
        <p className="meola-lab__eyebrow">Brand Lab</p>
        <ParallaxHeading
          as="p"
          className="meola-lab__headline"
          align="start"
        >
          <span className="meola-lab__headline-line">One pioneering platform.</span>
          <span className="meola-lab__headline-line">
            <span className="meola-lab__headline-word--outline">Signal</span>{' '}
            to{' '}
            <span className="meola-lab__headline-word--fill">scale.</span>
          </span>
        </ParallaxHeading>
      </div>

      <div
        ref={panelsRef}
        className="meola-lab__panels"
        role="list"
        aria-label="Brand Lab capabilities"
      >
        {LAB_STEPS.map((step, index) => {
          const isActive = active === index
          return (
            <article
              key={step.id}
              role="listitem"
              className={`meola-lab__panel${isActive ? ' is-active' : ''}`}
              data-lab-step={step.id}
              data-lab-panel
              data-lab-index={index}
              tabIndex={0}
              aria-expanded={isActive}
              aria-label={`${step.num}. ${step.title}`}
              onClick={() => goToPanel(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  goToPanel(index)
                }
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  goToPanel(Math.min(LAB_STEPS.length - 1, index + 1))
                }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault()
                  goToPanel(Math.max(0, index - 1))
                }
              }}
            >
              <div className="meola-lab__content">
                <div className="meola-lab__head">
                  <div className="meola-lab__head-title">
                    <p className="meola-lab__num">{step.num}</p>
                    <h3 className="meola-lab__title">{step.title}</h3>
                  </div>
                  <p className="meola-lab__desc">{step.desc}</p>
                </div>
                <div className="meola-lab__media">
                  <img
                    className="meola-lab__img"
                    src={step.image}
                    alt=""
                    draggable={false}
                  />
                </div>
              </div>

              <div className="meola-lab__small-title" aria-hidden="true">
                <p>
                  <span className="meola-lab__small-num">{step.num}</span>
                  <span className="meola-lab__small-label">{step.title}</span>
                </p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
