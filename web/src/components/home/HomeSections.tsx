import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { MeolaaEMark } from '../brand/MeolaaEMark'

/** Blank Planet Blue field — headline + CTAs only (no prism / decorative stage). */
export function HeroSection() {
  return (
    <section className="fold hero hero--blank" data-section="hero">
      <div className="hero__bottom">
        <h1 className="hero__headline">
          <span>The operating system</span>
          <span>for consumer brands.</span>
        </h1>
        <div className="hero__panel">
          <p className="hero__lede">
            Meolaa is an AI-native house of consumer brands reading demand,
            building products and running go-to-market as one connected system.
          </p>
          <div className="hero__actions">
            <a className="hero__btn hero__btn--solid" href="#story">
              Read Our Story
            </a>
            <button className="hero__btn hero__btn--ghost" type="button">
              ▶ Watch the film
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function VisionSection() {
  return (
    <section className="fold vision" data-section="vision">
      <div className="vision__stage">
        <div className="vision__video-wrap">
          <div className="vision__video" data-video-box>
            <video muted loop playsInline poster="/assets/imgImage234.png">
              <source
                src="/videos/Sales-Marketing_s-Video-Jun-30-2026-2.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
        <div className="vision__copy">
          <p data-vision-line>Every category has an unmet need.</p>
          <p data-vision-line>
            We find it, build for it, and run it faster than anyone else can
          </p>
        </div>
      </div>
    </section>
  )
}

export { LoopSection } from './LoopSection'

export { LabSection } from './LabSection'

export function FoundingSection() {
  return (
    <section className="founding" data-section="founding" id="story">
      <div className="founding__text section-head section-head--start">
        <p className="founding__eyebrow section-head__eyebrow">
          Why we&apos;re building this
        </p>
        <h2 className="section-head__title">
          It started with a question
          <br />
          no one else was asking.
        </h2>
        <p className="founding__body section-head__sub">
          In 2022, Ishita Sawant set out to prove that emerging consumer demand
          could be identified and served faster than any traditional FMCG
          company could move. Meolaa is the system built to do exactly that —
          and this is only the beginning of that story.
        </p>
        <a className="hero__btn hero__btn--ghost" href="#story">
          Read Our Story →
        </a>
      </div>
      <div className="founding__media">
        <img src="/assets/pages/story-hero-portrait.jpg" alt="Meolaa founder" />
      </div>
    </section>
  )
}

const BRANDS = [
  {
    cat: 'beauty',
    num: '01',
    name: 'HIRA',
    status: 'Live & shipping',
    categoryLabel: 'Beauty & Personal Care',
    soon: false,
    desc: "Meolaa's first live brand — beauty and personal care built from a scored demand signal through product, identity and go-to-market.",
    cta: 'View brand ↗',
    ctaHref: '#story',
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&h=1200&q=80',
    alt: 'Beauty and personal care products',
    points: [
      'Demand scored before build',
      'Product, brand and GTM as one pass',
      'Live inventory and content loops',
    ],
  },
  {
    cat: 'fragrance',
    num: '02',
    name: 'Brand 02',
    status: 'In build',
    categoryLabel: 'Fragrance',
    soon: true,
    desc: 'A validated fragrance opportunity in build — whitespace read by the same signal engine that launched HIRA.',
    cta: 'Notify me →',
    ctaHref: '#brands',
    img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&h=1200&q=80',
    alt: 'Elegant fragrance bottle',
    points: [
      'Category whitespace confirmed',
      'Formula and scent direction underway',
      'Launch assets queued in Lab',
    ],
  },
  {
    cat: 'kitchen',
    num: '03',
    name: 'Brand 03',
    status: 'Next signal',
    categoryLabel: 'Kitchen Essentials',
    soon: true,
    desc: 'Kitchen essentials — the next signal in the pipeline, moving from opportunity score into product definition.',
    cta: 'Notify me →',
    ctaHref: '#brands',
    img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1600&h=1200&q=80',
    alt: 'Kitchen essentials and cookware',
    points: [
      'High-intent consumer demand',
      'Retail-ready format exploration',
      'Shared ops layer with HIRA',
    ],
  },
  {
    cat: 'beauty',
    num: '04',
    name: 'NURA',
    status: 'Scored',
    categoryLabel: 'Beauty & Personal Care',
    soon: true,
    desc: 'A second beauty signal — clean routines scored for repeat purchase, lined up behind HIRA on the same ops layer.',
    cta: 'Notify me →',
    ctaHref: '#brands',
    img: 'https://images.unsplash.com/photo-1570172619604-923cb19f8c5c?auto=format&fit=crop&w=1600&h=1200&q=80',
    alt: 'Skincare and beauty ritual products',
    points: [
      'Repeat-purchase demand cluster',
      'Formulation brief in review',
      'Shared content and fulfilment rails',
    ],
  },
  {
    cat: 'fragrance',
    num: '05',
    name: 'AURA',
    status: 'Opportunity',
    categoryLabel: 'Fragrance',
    soon: true,
    desc: 'A companion fragrance lane — lighter, daily wear — validated as whitespace next to Brand 02.',
    cta: 'Notify me →',
    ctaHref: '#brands',
    img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1600&h=1200&q=80',
    alt: 'Soft daylight fragrance and scent notes',
    points: [
      'Adjacent scent whitespace mapped',
      'Price and format hypotheses locked',
      'Queued after Brand 02 build',
    ],
  },
  {
    cat: 'kitchen',
    num: '06',
    name: 'KORA',
    status: 'Pipeline',
    categoryLabel: 'Kitchen Essentials',
    soon: true,
    desc: 'Kitchen staples for high-frequency baskets — the second kitchen read moving from score into assortment design.',
    cta: 'Notify me →',
    ctaHref: '#brands',
    img: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&h=1200&q=80',
    alt: 'Kitchen staples and cooking essentials',
    points: [
      'Basket-frequency demand confirmed',
      'Assortment shortlist in progress',
      'Ops shared with Brand 03',
    ],
  },
] as const

type BrandCat = 'fragrance' | 'beauty' | 'kitchen'

const PORTFOLIO_CATS: { id: BrandCat | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'fragrance', label: 'Fragrance' },
  { id: 'kitchen', label: 'Kitchen' },
]

/** Depth of a card relative to the front (0 = front). Wraps the circular deck. */
function stackDepth(index: number, active: number, total: number) {
  return (index - active + total) % total
}

/**
 * One-fold portfolio: title + decorative shapes + contained overlapping card stack.
 * All six brands peek in a single ~100svh frame; click / keys cycle the front card.
 */
export function PortfolioSection() {
  const [active, setActive] = useState(0)
  const [catFocus, setCatFocus] = useState<BrandCat>('beauty')
  const sectionRef = useRef<HTMLElement>(null)
  const total = BRANDS.length

  const selectBrand = (index: number) => {
    const clamped = Math.max(0, Math.min(total - 1, index))
    setActive(clamped)
    const brand = BRANDS[clamped]
    if (brand) setCatFocus(brand.cat)
  }

  const focusCategory = (id: BrandCat | 'all') => {
    if (id === 'all') {
      selectBrand(0)
      return
    }
    setCatFocus(id)
    const idx = BRANDS.findIndex((b) => b.cat === id)
    if (idx >= 0) selectBrand(idx)
  }

  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const section = sectionRef.current
      if (!section) return
      const rect = section.getBoundingClientRect()
      const inView =
        rect.top < window.innerHeight * 0.55 &&
        rect.bottom > window.innerHeight * 0.35
      if (!inView) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((prev) => {
          const next = (prev + 1) % total
          const brand = BRANDS[next]
          if (brand) setCatFocus(brand.cat)
          return next
        })
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((prev) => {
          const next = (prev - 1 + total) % total
          const brand = BRANDS[next]
          if (brand) setCatFocus(brand.cat)
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total])

  const current = BRANDS[active] ?? BRANDS[0]

  return (
    <section
      ref={sectionRef}
      className="portfolio portfolio--fold"
      id="brands"
      data-section="brands"
      aria-roledescription="carousel"
      aria-label="Brand portfolio"
    >
      <div className="portfolio__shapes" aria-hidden="true">
        <span className="portfolio__shape portfolio__shape--lilac" />
        <span className="portfolio__shape portfolio__shape--yellow" />
        <span className="portfolio__shape portfolio__shape--green" />
        <span className="portfolio__shape portfolio__shape--ecru" />
      </div>

      <header className="portfolio__intro portfolio-title section-head">
        <p className="section-head__eyebrow">Brands</p>
        <h2 className="section-head__title">The portfolio</h2>
        <p className="section-head__sub">
          Six consumer signals. One operating system from score to shelf.
        </p>
        <div className="portfolio__cats" role="tablist" aria-label="Jump to category">
          {PORTFOLIO_CATS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id !== 'all' && catFocus === id}
              className={`portfolio__cat${
                id !== 'all' && catFocus === id ? ' is-active' : ''
              }`}
              onClick={() => focusCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="portfolio__stage">
        <div className="portfolio__deck" role="list">
          {BRANDS.map((b, i) => {
            const depth = stackDepth(i, active, total)
            const isFront = depth === 0
            return (
              <article
                key={b.num}
                role="listitem"
                className={`case${isFront ? ' is-front' : ''}`}
                data-category={b.cat}
                data-index={i}
                data-depth={depth}
                style={
                  {
                    zIndex: total - depth,
                    ['--stack-depth' as string]: depth,
                  } as CSSProperties
                }
                aria-label={`${b.name}, ${b.categoryLabel}`}
                aria-hidden={!isFront}
                tabIndex={isFront ? 0 : -1}
                onClick={() => selectBrand(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectBrand(i)
                  }
                }}
              >
                <header className="case__bar">
                  <span className="case__bar-name">{b.name}</span>
                  <span className="case__bar-mark" aria-hidden="true">
                    <MeolaaEMark />
                  </span>
                  <span className="case__bar-meta">
                    {b.num}/{String(total).padStart(2, '0')}
                  </span>
                </header>

                <div className="case__body">
                  <div className="case__col case__col--overview">
                    <p className="case__kicker">Overview</p>
                    <h3 className="case__heading">Description</h3>
                    <p className="case__desc">{b.desc}</p>
                    {b.soon ? (
                      <span className="case__cta case__cta--muted">{b.cta}</span>
                    ) : (
                      <a
                        className="case__cta"
                        href={b.ctaHref}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {b.cta}
                      </a>
                    )}
                  </div>

                  <div className="case__col case__col--visual">
                    <p className="case__kicker">{b.categoryLabel}</p>
                    <h3 className="case__heading case__heading--name">{b.name}</h3>
                    <div className="case__media">
                      <img
                        src={b.img}
                        alt={b.alt}
                        width={800}
                        height={500}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                      <div className={`case__accent case__accent--${b.cat}`} />
                    </div>
                    <p
                      className={`case__status${b.soon ? ' case__status--soon' : ''}`}
                    >
                      {b.status}
                    </p>
                  </div>

                  <div className="case__col case__col--spotlight">
                    <p className="case__kicker">Spotlight</p>
                    <h3 className="case__heading">Signals</h3>
                    <ul className="case__points">
                      {b.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="portfolio__chrome" aria-hidden="false">
          <div
            className="portfolio__index"
            role="tablist"
            aria-label="Brand index"
          >
            {BRANDS.map((b, i) => (
              <button
                key={b.num}
                type="button"
                role="tab"
                aria-selected={active === i}
                aria-label={`${b.name} (${b.num})`}
                className={`portfolio__dot${active === i ? ' is-active' : ''}`}
                onClick={() => selectBrand(i)}
              >
                <span className="portfolio__dot-num">{b.num}</span>
                <span className="portfolio__dot-name">{b.name}</span>
              </button>
            ))}
          </div>
          <div className="portfolio__progress" aria-hidden="true">
            <div
              className="portfolio__progress-fill"
              style={{
                width: `${total <= 1 ? 100 : (active / (total - 1)) * 100}%`,
              }}
            />
          </div>
          <p className="portfolio__now">
            <span>{current.name}</span>
            <span aria-hidden="true"> — </span>
            <span>{current.status}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

export function MetricsSection() {
  return (
    <section className="metrics" data-section="metrics">
      <header className="section-head section-head--on-light">
        <p className="section-head__eyebrow">By the numbers</p>
        <h2 className="section-head__title">Proof, not promises.</h2>
        <p className="section-head__sub">
          Where the system stands today — capital raised, categories mapped,
          brands live and markets served.
        </p>
      </header>

      <div className="metrics__chart">
        <div className="metric" data-metric style={{ ['--h-pct' as string]: '39%' }}>
          <strong>$6M</strong>
          <span>Raised across seed rounds</span>
        </div>
        <div className="metric" data-metric style={{ ['--h-pct' as string]: '58%' }}>
          <strong>120+</strong>
          <span>Categories mapped</span>
        </div>
        <div className="metric" data-metric style={{ ['--h-pct' as string]: '80%' }}>
          <strong>1</strong>
          <span>Brand live</span>
        </div>
        <div className="metric" data-metric style={{ ['--h-pct' as string]: '100%' }}>
          <strong>3</strong>
          <span>Market Served</span>
        </div>
      </div>
    </section>
  )
}

export function InvestorsSection() {
  return (
    <section className="investors" data-section="investors" id="partners">
      <header className="section-head">
        <p className="section-head__eyebrow">Backed by</p>
        <h2 className="section-head__title">
          Investors who back systems, not just brands.
        </h2>
        <p className="section-head__sub">
          Capital from partners who underwrote the operating layer, not a
          single product line.
        </p>
      </header>
      <div className="investor-logos">
        <span className="investor-logos__item">
          <img
            src="/assets/partners/colossa-ventures.svg"
            alt="Colossa Ventures"
            width={140}
            height={32}
          />
        </span>
        <span className="investor-logos__item">
          <img
            src="/assets/partners/general-catalyst.svg"
            alt="General Catalyst"
            width={160}
            height={28}
          />
        </span>
        <span className="investor-logos__item">
          <img
            src="/assets/partners/turbostart.svg"
            alt="Turbostart"
            width={130}
            height={28}
          />
        </span>
        <span className="investor-logos__item">
          <img
            src="/assets/partners/ranjan-pai-family-office.svg"
            alt="Ranjan Pai Family Office"
            width={150}
            height={32}
          />
        </span>
      </div>
      <a className="btn-ghost" href="#partners">
        Partner with us →
      </a>
    </section>
  )
}

export function PressSection() {
  return (
    <section className="press-feed" data-section="press" id="press">
      <div className="press-feed__head section-head section-head--on-light">
        <p className="section-head__eyebrow">Media</p>
        <h2 className="press-feed__title section-head__title">Press</h2>
        <p className="section-head__sub">
          Coverage and conversations about the system we&apos;re building.
        </p>
        <a className="btn-ghost-dark" href="#press">
          View all press →
        </a>
      </div>
      <div className="press-feed__grid">
        <article className="press-card">
          <div className="press-card__media">
            <img
              src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=960&h=720&q=80"
              alt="Leadership team in a strategy session"
              width={480}
              height={360}
              loading="lazy"
            />
          </div>
          <p className="press-card__meta">TECHCRUNCH · Jan 12, 2026</p>
          <h3>Meolaa raises $6M to build an AI-native house of brands</h3>
          <p className="press-card__excerpt">
            How a small team is using AI to read demand and launch consumer
            brands faster than traditional FMCG players.
          </p>
        </article>
        <article className="press-card">
          <div className="press-card__media">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=960&h=720&q=80"
              alt="Bright modern office"
              width={480}
              height={360}
              loading="lazy"
            />
          </div>
          <p className="press-card__meta">FORBES · Nov 3, 2025</p>
          <h3>Inside the operating system replacing the brand incubator</h3>
          <p className="press-card__excerpt">
            Meolaa&apos;s founder on why one system, not one brand, is the real
            product.
          </p>
        </article>
        <article className="press-card">
          <div className="press-card__media">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=960&h=720&q=80"
              alt="Retail store aisle"
              width={480}
              height={360}
              loading="lazy"
            />
          </div>
          <p className="press-card__meta">MODERN RETAIL · Sep 18, 2025</p>
          <h3>HIRA&apos;s launch playbook, built and run by AI</h3>
          <p className="press-card__excerpt">
            A look at how Meolaa took its first brand from signal to shelf in
            under four months.
          </p>
        </article>
      </div>
    </section>
  )
}

export function WhereNextSection() {
  return (
    <section className="pg-where-next" data-section="where-next" id="about">
      <header className="section-head">
        <p className="section-head__eyebrow">Where to next</p>
        <h2 className="section-head__title">Three ways in.</h2>
        <p className="section-head__sub">
          The thesis behind the company, the system that builds every brand,
          and the team building it.
        </p>
      </header>
      <div className="pg-where-next__grid">
        <a className="pg-where-next__card" href="#about">
          <span className="num">02</span>
          <h3>About Us</h3>
          <p>The thesis behind an AI-native brand company. →</p>
        </a>
        <a className="pg-where-next__card" href="#lab">
          <span className="num">04</span>
          <h3>Meolaa Lab</h3>
          <p>How the OS finds and builds every brand. →</p>
        </a>
        <a className="pg-where-next__card" href="#careers">
          <span className="num">07</span>
          <h3>Careers</h3>
          <p>Build with a small team, real ownership. →</p>
        </a>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer--svg" id="careers">
      <img className="site-footer__art" src="/assets/footer.svg" alt="" />
      <img
        className="site-footer__wordmark"
        src="/assets/logo-white.png"
        alt="Meolaa"
      />
    </footer>
  )
}
