import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ParallaxHeading } from './ParallaxHeading'
import { VideoModal } from './VideoModal'

/** Brand gradient hero stage — Planet Blue → teal, whisper of Joyous Yellow. */
export function HeroSection() {
  const [isFilmOpen, setFilmOpen] = useState(false)

  return (
    <section className="fold hero hero--blank" data-section="hero">
      <div className="hero__stage" aria-hidden="true">
        <div className="hero__bg" />
        <div className="hero__shade" />
      </div>
      {/* Display type behind the prism — the Next.js Conf hero puts its title
          on the same plane so the crystal occludes part of it. */}
      {/* The big centre wordmark lives in SiteNav, not here — it's one element
          that starts scaled up over this fold and docks into the nav on scroll
          (see the dock ScrollTrigger in HomeAnimations). A separate hero copy
          would mean cross-fading two marks instead of moving one. */}
      <div className="hero__bottom">
        <ParallaxHeading as="h1" className="hero__headline" align="start">
          <span>
            The{' '}
            <span className="hero__headline-word--fill">consumer</span>
          </span>
          <span>company of the</span>
          <span>
            <span className="hero__headline-word--outline">AI era</span>
          </span>
        </ParallaxHeading>
        <div className="hero__panel">
          <p className="hero__lede">
            We turn signals from how people live into products and brands that
            earn a place in everyday life
          </p>
          <div className="hero__actions">
            <Link className="hero__btn hero__btn--solid" to="/story">
              Read Our Story
            </Link>
            <button
              className="hero__btn hero__btn--ghost"
              type="button"
              onClick={() => setFilmOpen(true)}
            >
              ▶ Watch the film
            </button>
          </div>
        </div>
      </div>
      <VideoModal
        open={isFilmOpen}
        onClose={() => setFilmOpen(false)}
        src="/videos/Sales-Marketing_s-Video-Jun-30-2026-2.mp4"
        poster="/assets/imgImage234.png"
      />
    </section>
  )
}

/** Lifestyle collage still — first paint for Vision (not the film's t=0 frame). */
export const VISION_COLLAGE_POSTER = '/assets/vision-collage.jpg'

export function VisionSection() {
  return (
    <section className="fold vision" data-section="vision">
      <div className="vision__stage">
        <div className="vision__video-wrap" data-vision-media>
          <div className="vision__video" data-video-box>
            {/* Static collage under the film so reload never flashes a mid-cut frame. */}
            <img
              className="vision__poster"
              src={VISION_COLLAGE_POSTER}
              alt=""
              decoding="async"
              fetchPriority="high"
              draggable={false}
            />
            <video
              muted
              loop
              playsInline
              preload="auto"
              poster={VISION_COLLAGE_POSTER}
              data-vision-video
            >
              <source
                src="/videos/Sales-Marketing_s-Video-Jun-30-2026-2.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
        <div className="vision__copy">
          <p className="vision__eyebrow section-head__eyebrow">Meolaa</p>
          <div className="vision__headline-stack">
            <h2 className="vision__headline">
              {/* The splitter below rebuilds these lines into per-word and
                  per-char spans, so styling has to be declared as word indices
                  it can tag rather than as spans here — anything nested gets
                  discarded. See splitVisionLines in visionAnimations. */}
              <span data-vision-line="primary" data-vision-outline="1">
                From signal to home,
              </span>
              <span data-vision-line="secondary">
                we create what you&rsquo;ll
              </span>
              <span
                className="vision__headline-line--faded"
                data-vision-line="tertiary"
                data-vision-fill="0,1"
              >
                choose next.
              </span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  )
}

export { LoopSection } from './LoopSection'

export { LabSection } from './LabSection'

export { FoundingSection } from './FoundingSection'

/* Portfolio — title + filters + brand bento grid (see PortfolioSection). */
export { PortfolioSection } from './PortfolioSection'

/** Stair washes from Figma 8i9eIHImFGm2Mrf9haxErD / 10:2 — soft pastel blobs. */
const METRIC_STAIRS = [
  {
    value: '—',
    label: 'Tech-forward numbers (model calibrations)',
    hPct: '50%',
    wash: '/assets/metrics/bar-1.svg',
  },
  {
    value: '5',
    label: 'Tech institutional investors',
    hPct: '64%',
    wash: '/assets/metrics/bar-2.svg',
  },
  {
    value: '18',
    label: 'Months since launch',
    hPct: '80%',
    wash: '/assets/metrics/bar-3.svg',
  },
  {
    value: '$10M',
    label: 'Raised across rounds',
    hPct: '100%',
    wash: '/assets/metrics/bar-4.svg',
  },
] as const

/** Proof / By the numbers — one section: shared section-head + primary stats band. */
export function MetricsSection() {
  return (
    <section
      className="metrics"
      data-section="metrics"
      aria-labelledby="metrics-title"
    >
      <header className="metrics__head section-head section-head--on-light">
        <p className="section-head__eyebrow">By the numbers</p>
        <ParallaxHeading id="metrics-title" className="section-head__title">
          Proof, not <span className="portfolio-title__word--fill">promises.</span>
        </ParallaxHeading>
        <p className="section-head__sub">
          Where the system stands today, capital raised, categories mapped,
          brands live and markets served.
        </p>
      </header>

      <div className="metrics__chart" aria-label="Key metrics">
        {METRIC_STAIRS.map((stair) => (
          <div
            key={stair.value}
            className="metric"
            data-metric
            style={{ ['--h-pct' as string]: stair.hPct }}
          >
            <div className="metric__wash" aria-hidden="true">
              <img
                className="metric__wash-img"
                src={stair.wash}
                alt=""
                draggable={false}
              />
            </div>
            <strong>{stair.value}</strong>
            <span>{stair.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

const INVESTOR_LOGOS = [
  {
    src: '/assets/partners/colossa-ventures.svg',
    alt: 'Colossa Ventures',
  },
  {
    src: '/assets/partners/general-catalyst.svg',
    alt: 'General Catalyst',
  },
  {
    src: '/assets/partners/turbostart.svg',
    alt: 'Turbostart',
  },
  {
    src: '/assets/partners/ranjan-pai-family-office.svg',
    alt: 'Ranjan Pai Family Office',
  },
] as const

/** One marquee unit: logos repeated so the set stays wider than typical viewports. */
const INVESTOR_MARQUEE_UNIT = [...INVESTOR_LOGOS, ...INVESTOR_LOGOS] as const

function InvestorLogoSet({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul className="investor-logos__set" aria-hidden={ariaHidden || undefined}>
      {INVESTOR_MARQUEE_UNIT.map((logo, i) => (
        <li
          key={`${ariaHidden ? 'b' : 'a'}-${i}-${logo.src}`}
          className="investor-logos__item"
        >
          <img
            src={logo.src}
            alt={ariaHidden || i >= INVESTOR_LOGOS.length ? '' : logo.alt}
            width={208}
            height={48}
            draggable={false}
          />
        </li>
      ))}
    </ul>
  )
}

/** Logo ticker only — Investors header and Partner CTA stay removed. */
export function InvestorsSection() {
  return (
    <section
      className="investors"
      data-section="investors"
      id="partners"
      aria-label="Investor partners"
    >
      <div
        className="investor-logos"
        role="region"
        aria-label="Investor partners"
      >
        <div className="investor-logos__viewport">
          <div className="investor-logos__track">
            <InvestorLogoSet />
            <InvestorLogoSet ariaHidden />
          </div>
        </div>
      </div>
    </section>
  )
}

const PRESS_ITEMS = [
  {
    outlet: 'TECHCRUNCH',
    date: 'Jan 12, 2026',
    headline: 'Meolaa raises $6M to build an AI native house of brands',
    excerpt:
      'How a small team is using AI to read demand and launch consumer brands faster than traditional FMCG players.',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=960&h=720&q=80',
    alt: 'Leadership team in a strategy session',
  },
  {
    outlet: 'FORBES',
    date: 'Nov 3, 2025',
    headline: 'Inside the operating system replacing the brand incubator',
    excerpt:
      "Meolaa's founder on why one system, not one brand, is the real product.",
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=960&h=720&q=80',
    alt: 'Bright modern office',
  },
  {
    outlet: 'MODERN RETAIL',
    date: 'Sep 18, 2025',
    headline: "HIRA's launch playbook, built and run by AI",
    excerpt:
      'A look at how Meolaa took its first brand from signal to shelf in under four months.',
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=960&h=720&q=80',
    alt: 'Retail store aisle',
  },
] as const

export function PressSection() {
  return (
    <section className="press-feed" data-section="press" id="press">
      {/* Split header: type stack left, action right. The stack wrapper is what
          lets the CTA be a row sibling rather than a fourth item in the
          centred column — see .section-head--split. */}
      <div className="press-feed__head section-head section-head--on-light section-head--split">
        <div className="section-head__stack">
          <p className="section-head__eyebrow">Media</p>
          <ParallaxHeading className="section-head__title" align="start">
            Press
          </ParallaxHeading>
          <p className="section-head__sub">
            Coverage and conversations about the system we&apos;re building.
          </p>
        </div>
        <div className="press-feed__head-actions">
          <Link className="btn-ghost-dark" to="/press">
            View all →
          </Link>
        </div>
      </div>
      <div className="press-feed__slider" data-press-slider>
        <div className="press-feed__grid" data-press-track>
          {PRESS_ITEMS.map((item) => (
            <article
              key={`${item.outlet}-${item.date}`}
              className="press-card"
            >
              <div className="press-card__content">
                <div className="press-card__media">
                  <img
                    src={item.image}
                    alt={item.alt}
                    width={480}
                    height={360}
                    loading="lazy"
                  />
                </div>
                <p className="press-card__meta">
                  {item.outlet} · {item.date}
                </p>
                <h3>{item.headline}</h3>
                <p className="press-card__excerpt">{item.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}


