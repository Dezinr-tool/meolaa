/**
 * Portfolio — section-head + filters + responsive brand bento grid.
 * HIRA is the featured live tile; other brands are photo / text / CTA tiles.
 * No pin/scrub stack — CSS grid only.
 * Scroll-enter stagger lives in HomeAnimations; filter swaps get a light appear here.
 */
import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/motion'
import { ParallaxHeading } from './ParallaxHeading'
import './PortfolioSection.css'

type Category = 'beauty' | 'fragrance' | 'kitchen'
type FilterId = 'all' | Category
type TileKind = 'featured' | 'photo' | 'text' | 'cta'

type Brand = {
  cat: Category
  num: string
  name: string
  soon: boolean
  desc: string
  cta: string
  ctaHref?: string
  img: string
  alt: string
  /** Bento role when filter is All */
  tile: TileKind
}

const FILTERS: readonly { id: FilterId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fragrance', label: 'Fragrance' },
  { id: 'beauty', label: 'Beauty & Personal Care' },
  { id: 'kitchen', label: 'Kitchen Essentials' },
]

/** HIRA live + five pipeline brands (real Meolaa imagery). */
const BRANDS: readonly Brand[] = [
  {
    cat: 'beauty',
    num: '1',
    name: 'HIRA',
    soon: false,
    desc: "Beauty & Personal Care — Meolaa's first brand, live and shipping.",
    cta: 'View brand ↗',
    ctaHref: '#story',
    img: '/assets/portfolio-hira.jpg',
    alt: 'HIRA Desert Siren bottles on the production line',
    tile: 'featured',
  },
  {
    cat: 'fragrance',
    num: '2',
    name: 'Brand 02',
    soon: true,
    desc: 'Fragrance — validated opportunity, in build.',
    cta: 'Coming soon',
    img: '/assets/portfolio-fragrance-01.jpg',
    alt: 'HIRA Dive Club eau de parfum on the assembly line',
    tile: 'photo',
  },
  {
    cat: 'kitchen',
    num: '3',
    name: 'Brand 03',
    soon: true,
    desc: 'Kitchen Essentials — next signal in the pipeline.',
    cta: 'Coming soon',
    img: '/assets/portfolio-kitchen-01.jpg',
    alt: 'Product packaging stacked in Meolaa fulfillment',
    tile: 'text',
  },
  {
    cat: 'beauty',
    num: '4',
    name: 'NURA',
    soon: true,
    desc: 'Beauty & Personal Care — concept validated, brand in formation.',
    cta: 'Coming soon',
    img: '/assets/portfolio-beauty-01.jpg',
    alt: 'Packaging design workspace for a Meolaa beauty brand',
    tile: 'photo',
  },
  {
    cat: 'fragrance',
    num: '5',
    name: 'AURA',
    soon: true,
    desc: 'Fragrance — demand signal locked, build next.',
    cta: 'Coming soon',
    img: '/assets/portfolio-fragrance-02.jpg',
    alt: 'HIRA Oak and Smoke eau de parfum being filled',
    tile: 'photo',
  },
  {
    cat: 'kitchen',
    num: '6',
    name: 'KORA',
    soon: true,
    desc: 'Kitchen Essentials — pipeline brand, coming soon.',
    cta: 'Coming soon',
    img: '/assets/portfolio-kitchen-02.jpg',
    alt: 'Meolaa studio set for product photography',
    tile: 'cta',
  },
]

const CAT_LABEL: Record<Category, string> = {
  beauty: 'Beauty & Personal Care',
  fragrance: 'Fragrance',
  kitchen: 'Kitchen Essentials',
}

export function PortfolioSection() {
  const [filter, setFilter] = useState<FilterId>('all')
  const isAll = filter === 'all'
  const visible = isAll ? BRANDS : BRANDS.filter((b) => b.cat === filter)
  const bentoRef = useRef<HTMLDivElement>(null)
  const skipFilterAppear = useRef(true)

  /* Light staggered appear when the filter set changes (not on first paint). */
  useEffect(() => {
    const root = bentoRef.current
    if (!root) return

    const tiles = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll('.brand-tile'),
    )
    if (!tiles.length) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (skipFilterAppear.current) {
      skipFilterAppear.current = false
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return
    }

    if (reduceMotion) {
      gsap.set(tiles, { autoAlpha: 1, y: 0, scale: 1 })
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return
    }

    const tween = gsap.fromTo(
      tiles,
      { autoAlpha: 0, y: 18, scale: 0.97 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.05,
        ease: 'power2.out',
        onComplete: () => ScrollTrigger.refresh(),
      },
    )

    requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      tween.kill()
    }
  }, [filter])

  return (
    <section
      className={`brands${isAll ? ' brands--bento' : ' brands--filtered'}`}
      id="brands"
      data-section="brands"
      aria-labelledby="portfolio-heading"
    >
      <header className="portfolio-title section-head section-head--on-light">
        <p className="section-head__eyebrow">Brands</p>
        <ParallaxHeading className="section-head__title" id="portfolio-heading">
          The portfolio
        </ParallaxHeading>
        <div
          className="brand-filters"
          role="tablist"
          aria-label="Filter brands"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`brand-filter${active ? ' is-active' : ''}`}
                data-filter={f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </header>

      <div
        ref={bentoRef}
        className="brands__bento"
        data-count={visible.length}
        role="list"
      >
        {visible.map((b, i) => {
          const kind = isAll ? b.tile : b.soon ? 'photo' : 'featured'
          return (
            <article
              key={b.num}
              className={`brand-tile brand-tile--${kind}${b.soon ? '' : ' brand-tile--live'}`}
              data-category={b.cat}
              data-tile={kind}
              role="listitem"
              aria-labelledby={`brand-${b.num}-name`}
            >
              {kind !== 'text' ? (
                <div
                  className={`brand-tile__media${kind === 'cta' ? ' brand-tile__media--dim' : ''}`}
                  aria-hidden={kind === 'featured' ? undefined : true}
                >
                  <img
                    src={b.img}
                    alt={kind === 'featured' ? b.alt : ''}
                    width={1600}
                    height={1200}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="brand-tile__media brand-tile__media--wash" aria-hidden="true">
                  <img
                    src={b.img}
                    alt=""
                    width={1600}
                    height={1200}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              <div className="brand-tile__inner">
                <p className="brand-tile__num" aria-hidden="true">
                  {b.num.padStart(2, '0')}
                </p>
                <div className="brand-tile__body">
                  {b.soon ? (
                    <p className="brand-tile__soon">Coming soon</p>
                  ) : (
                    <p className="brand-tile__live">Live</p>
                  )}
                  <h3 id={`brand-${b.num}-name`}>{b.name}</h3>
                  {kind === 'text' || kind === 'featured' || kind === 'cta' ? (
                    <p className="brand-tile__desc">{b.desc}</p>
                  ) : (
                    <p className="brand-tile__cat">{CAT_LABEL[b.cat]}</p>
                  )}
                  {kind === 'featured' && b.ctaHref ? (
                    <a className="brand-tile__cta" href={b.ctaHref}>
                      {b.cta}
                    </a>
                  ) : kind === 'cta' || kind === 'text' ? (
                    <span className="brand-tile__soon-cta">{b.cta}</span>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
