import { useCallback, useEffect, useRef, useState } from 'react'
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
    title: 'Reading demand',
    desc: 'Consumer signals, whitespace and demand patterns scored into a single opportunity read.',
    image: '/assets/imgImage22523.png',
  },
  {
    id: 'product-brand',
    num: '02',
    title: 'Product & brand',
    desc: 'Formulation, packaging, identity and launch assets assembled by the build system.',
    image: '/assets/imgImage22524.png',
  },
  {
    id: 'go-to-market',
    num: '03',
    title: 'Go-to-market',
    desc: 'Content, channels and campaigns orchestrated from one operating layer.',
    image: '/assets/imgImage22525.png',
  },
  {
    id: 'distribution-ops',
    num: '04',
    title: 'Distribution & ops',
    desc: 'Inventory, fulfilment and performance loops kept running after launch.',
    image: '/assets/imgImage22526.png',
  },
]

function useFineHover() {
  const [fineHover, setFineHover] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setFineHover(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return fineHover
}

/**
 * Meolaa Lab — full-bleed process accordion.
 * Desktop: hover expands active step rightward; siblings collapse.
 * Touch: tap toggles accordion (no hover).
 */
export function LabSection() {
  const [active, setActive] = useState(0)
  const fineHover = useFineHover()
  const railRef = useRef<HTMLDivElement>(null)

  const activate = useCallback((index: number) => {
    setActive(index)
  }, [])

  const onPanelEnter = (index: number) => {
    if (fineHover) activate(index)
  }

  const onPanelClick = (index: number) => {
    if (fineHover) return
    setActive((prev) => (prev === index ? prev : index))
  }

  return (
    <section className="fold meola-lab" data-section="lab" id="lab">
      <header
        className="meola-lab__intro section-head section-head--on-light"
        data-lab-arrow-slot
      >
        <div className="meola-lab__mark" aria-hidden="true">
          <img src="/assets/logo-white.png" alt="" />
        </div>
        <p className="meola-lab__eyebrow section-head__eyebrow">Meolaa Lab</p>
        <h2 className="meola-lab__headline section-head__title">
          One system. Four capabilities.
        </h2>
        <p className="section-head__sub">
          From reading demand to keeping brands running — four stages of one
          engine, each feeding the next.
        </p>
      </header>

      <div
        className="meola-lab__rail"
        ref={railRef}
        role="list"
        aria-label="Meolaa Lab capabilities"
      >
        {LAB_STEPS.map((step, index) => {
          const isActive = active === index
          return (
            <article
              key={step.id}
              role="listitem"
              className={`meola-lab__panel${isActive ? ' is-active' : ''}`}
              data-lab-step={step.id}
              tabIndex={0}
              aria-expanded={isActive}
              aria-label={`${step.num}. ${step.title}`}
              onMouseEnter={() => onPanelEnter(index)}
              onFocus={() => activate(index)}
              onClick={() => onPanelClick(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  activate(index)
                }
              }}
            >
              <div className="meola-lab__spine">
                <span className="meola-lab__num">{step.num}</span>
                <h3 className="meola-lab__spine-title">{step.title}</h3>
              </div>

              <div className="meola-lab__bleed" aria-hidden={!isActive}>
                <img
                  className="meola-lab__img"
                  src={step.image}
                  alt=""
                  draggable={false}
                />
                <div className="meola-lab__veil" />
                <div className="meola-lab__copy">
                  <p className="meola-lab__copy-num">{step.num}</p>
                  <h3 className="meola-lab__copy-title">{step.title}</h3>
                  <p className="meola-lab__copy-desc">{step.desc}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
