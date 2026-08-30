import { useCallback, useEffect, useRef } from 'react'
import { MeolaaEMark } from '../brand/MeolaaEMark'
import { getLenisInstance } from '../../lib/lenisInstance'
import { initLabStack } from '../../lib/labAnimations'
import { ParallaxHeading } from './ParallaxHeading'
import './LabSection.css'

type LabCard = {
  id: string
  theme: 'intro' | 'lilac' | 'yellow' | 'blue' | 'green'
  num?: string
  title: string
  titleLines?: [string, string]
  desc: string
  image?: string
}

const LAB_CARDS: LabCard[] = [
  {
    id: 'intro',
    theme: 'intro',
    title: 'One system. Four capabilities.',
    titleLines: ['One system.', 'Four capabilities.'],
    desc: 'Four capabilities on one operating system, each one compounding the rest.',
  },
  {
    id: 'reading-demand',
    theme: 'lilac',
    num: '01',
    title: 'Reading demand',
    desc: 'Consumer signals, whitespace and demand patterns scored into a single opportunity read.',
    image: '/assets/lab-reading-demand.png',
  },
  {
    id: 'product-brand',
    theme: 'yellow',
    num: '02',
    title: 'Product & brand',
    desc: 'Formulation, packaging, identity and launch assets assembled by the build system.',
    image: '/assets/lab-product-brand.png',
  },
  {
    id: 'go-to-market',
    theme: 'blue',
    num: '03',
    title: 'Go to market',
    desc: 'Content, channels and campaigns orchestrated from one operating layer.',
    image: '/assets/lab-go-to-market.png',
  },
  {
    id: 'distribution-ops',
    theme: 'green',
    num: '04',
    title: 'Distribution & ops',
    desc: 'Inventory, fulfilment and performance loops kept running after launch.',
    image: '/assets/lab-distribution-ops.png',
  },
]

/**
 * Brand Lab — Get Hyped–style scroll stack.
 * Intro (white) + four themed capability cards; each card except the last
 * pins and recedes in 3D while the next slides over it.
 */
export function LabSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    let cancelled = false
    let cleanup: (() => void) | undefined
    let poll = 0

    const boot = () => {
      if (cancelled || !sectionRef.current) return
      cleanup = initLabStack(sectionRef.current)
    }

    const tryBoot = () => {
      if (cancelled) return
      if (
        getLenisInstance() ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        boot()
        return
      }
      poll = window.setTimeout(tryBoot, 16)
    }
    tryBoot()

    return () => {
      cancelled = true
      if (poll) window.clearTimeout(poll)
      cleanup?.()
    }
  }, [])

  const goToCard = useCallback((index: number) => {
    const slide = stackRef.current?.querySelectorAll<HTMLElement>(
      '[data-lab-slide]',
    )[index]
    if (!slide) return
    const top = slide.getBoundingClientRect().top + window.scrollY
    const lenis = getLenisInstance()
    if (lenis) lenis.scrollTo(top, { immediate: false })
    else window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  return (
    <section
      ref={sectionRef}
      className="meola-lab"
      data-section="lab"
      id="lab"
    >
      <div
        ref={stackRef}
        className="meola-lab__stack"
        role="list"
        aria-label="Brand Lab capabilities"
      >
        {LAB_CARDS.map((card, index) => {
          const isIntro = card.theme === 'intro'
          const numDigits = card.num ? card.num.split('') : []

          return (
            <div
              key={card.id}
              className="meola-lab__slide"
              data-lab-slide
              data-lab-index={index}
              role="listitem"
            >
              <div className="meola-lab__wrap">
                <article
                  className={`meola-lab__card meola-lab__card--${card.theme}`}
                  data-lab-card={card.id}
                  data-lab-theme={card.theme}
                  tabIndex={0}
                  aria-label={
                    card.num
                      ? `${card.num}. ${card.title}`
                      : `Brand Lab. ${card.title}`
                  }
                  onClick={() => goToCard(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      goToCard(index)
                    }
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      goToCard(Math.min(LAB_CARDS.length - 1, index + 1))
                    }
                    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                      e.preventDefault()
                      goToCard(Math.max(0, index - 1))
                    }
                  }}
                >
                  <div className="meola-lab__card-top">
                    <p className="meola-lab__label">Brand Lab</p>
                    {isIntro && card.titleLines ? (
                      <ParallaxHeading
                        as="h2"
                        className="meola-lab__headline"
                        align="start"
                      >
                        <span className="meola-lab__headline-line">
                          {card.titleLines[0]}
                        </span>
                        <span className="meola-lab__headline-line">
                          {card.titleLines[1]}
                        </span>
                      </ParallaxHeading>
                    ) : (
                      <h3 className="meola-lab__title">{card.title}</h3>
                    )}
                    {numDigits.length > 0 ? (
                      <div className="meola-lab__num" aria-hidden="true">
                        {numDigits.map((digit, i) => (
                          <span key={`${card.id}-d${i}`}>{digit}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {isIntro ? (
                    <div className="meola-lab__mark" aria-hidden="true">
                      <MeolaaEMark />
                    </div>
                  ) : card.image ? (
                    <div className="meola-lab__media">
                      <img
                        className="meola-lab__img"
                        src={card.image}
                        alt=""
                        draggable={false}
                      />
                    </div>
                  ) : null}

                  <div className="meola-lab__card-bottom">
                    <p
                      className={
                        isIntro ? 'meola-lab__sub' : 'meola-lab__desc'
                      }
                    >
                      {card.desc}
                    </p>
                  </div>
                </article>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
