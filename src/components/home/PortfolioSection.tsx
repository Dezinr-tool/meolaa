/**
 * Portfolio — section-head + HIRA hero row + stacked "coming soon" brand rows.
 * Figma: Meolaa / Frame 2147228113 (node 193:400).
 *
 * HIRA is the live brand: LIVE NOW pill, name, blurb, EXPLORE NOW button on the
 * left; wide product still on the right. Pipeline brands are 101px rows —
 * status / name / category. On hover a row inverts to black and the small
 * status + category labels scale up to the name's size, overflowing the row
 * edges, while two preview stills fade in beside the name.
 *
 * No pin/scrub, no filters. Scroll-enter stagger lives in HomeAnimations.
 */
import './PortfolioSection.css'
import { ParallaxHeading } from './ParallaxHeading'

type Brand = {
  num: string
  name: string
  cat: string
  /** Two stills revealed on hover, left and right of the name. */
  previews: readonly [string, string]
}

/** Pipeline brands — HIRA is rendered separately as the live hero. */
const BRANDS: readonly Brand[] = [
  {
    num: '2',
    name: 'Brand 02',
    cat: 'Fragrance',
    previews: ['/assets/portfolio/preview-01.jpg', '/assets/portfolio/preview-02.jpg'],
  },
  {
    num: '3',
    name: 'Brand 03',
    cat: 'Health Care',
    previews: ['/assets/portfolio/preview-01.jpg', '/assets/portfolio/preview-02.jpg'],
  },
  {
    num: '4',
    name: 'Brand 04',
    cat: 'Kitchen Essentials',
    previews: ['/assets/portfolio/preview-02.jpg', '/assets/portfolio/preview-01.jpg'],
  },
  {
    num: '5',
    name: 'Brand 05',
    cat: 'Beauty & Personal Care',
    previews: ['/assets/portfolio/preview-01.jpg', '/assets/portfolio/preview-02.jpg'],
  },
  {
    num: '6',
    name: 'Brand 06',
    cat: 'Kitchen Essentials',
    previews: ['/assets/portfolio/preview-02.jpg', '/assets/portfolio/preview-01.jpg'],
  },
]

export function PortfolioSection() {
  return (
    <section
      className="brands brands--portfolio"
      id="brands"
      data-section="brands"
      aria-labelledby="portfolio-heading"
    >
      <header className="portfolio-title section-head section-head--on-light">
        <p className="section-head__eyebrow">Brands</p>
        <ParallaxHeading className="section-head__title" id="portfolio-heading">
          The portfolio
        </ParallaxHeading>
        <p className="section-head__sub">
          One live brand and a pipeline behind it — each read from demand,
          built by the same system, and run end to end.
        </p>
      </header>

      <div className="brands__list">
        <article className="brand-hero" aria-labelledby="brand-hira-name">
          <div className="brand-hero__body">
            <p className="brand-hero__status">
              <img
                className="brand-hero__dot"
                src="/assets/portfolio/live-dot.svg"
                alt=""
                width={8}
                height={8}
                aria-hidden="true"
              />
              Live now
            </p>
            <h3 className="brand-hero__name" id="brand-hira-name">
              HIRA
            </h3>
            <p className="brand-hero__desc">
              Beauty &amp; Personal Care — Meolaa&rsquo;s first brand, live and
              shipping.
            </p>
            <a className="brand-hero__cta" href="#story">
              Explore now
            </a>
          </div>
          <div className="brand-hero__media">
            <img
              src="/assets/portfolio/hero-hira.jpg"
              alt="HIRA eau de parfum on a sand set, lit for a product shoot"
              width={1200}
              height={1500}
              loading="lazy"
              decoding="async"
            />
          </div>
        </article>

        {BRANDS.map((b) => (
          <article
            key={b.num}
            className="brand-row"
            aria-labelledby={`brand-${b.num}-name`}
          >
            {/* Resting state — the readable three-part line. */}
            <div className="brand-row__static">
              <p className="brand-row__status">Coming soon</p>
              <h3 className="brand-row__name" id={`brand-${b.num}-name`}>
                {b.name}
              </h3>
              <p className="brand-row__cat">{b.cat}</p>
            </div>

            {/* Hover state — the same words as a seamless marquee. Duplicated
                so translateX(-50%) lands exactly one group along; hidden from
                assistive tech since __static already carries the content. */}
            <div className="brand-row__ticker" aria-hidden="true">
              <div className="brand-row__ticker-track">
                {[0, 1].map((dup) => (
                  <div className="brand-row__ticker-group" key={dup}>
                    <span className="brand-row__ticker-word">Coming soon</span>
                    <span className="brand-row__ticker-still">
                      <img
                        src={b.previews[0]}
                        alt=""
                        width={350}
                        height={152}
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="brand-row__ticker-word">{b.name}</span>
                    <span className="brand-row__ticker-still">
                      <img
                        src={b.previews[1]}
                        alt=""
                        width={350}
                        height={152}
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <span className="brand-row__ticker-word">{b.cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
