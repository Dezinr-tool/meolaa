import { useState } from 'react'
import { ParallaxHeading } from './ParallaxHeading'
import { VideoModal } from './VideoModal'

/** Full-bleed hero photo on Planet Blue — headline + CTAs over a soft brand veil. */
export function HeroSection() {
  const [isFilmOpen, setFilmOpen] = useState(false)

  return (
    <section className="fold hero hero--blank" data-section="hero">
      <div className="hero__stage" aria-hidden="true">
        <img
          className="hero__bg"
          src="/assets/hero-bg.jpg"
          alt=""
          width={1024}
          height={576}
          decoding="async"
          fetchPriority="high"
        />
        <div className="hero__shade" />
      </div>
      {/* The big centre wordmark lives in SiteNav, not here — it's one element
          that starts scaled up over this fold and docks into the nav on scroll
          (see the dock ScrollTrigger in HomeAnimations). A separate hero copy
          would mean cross-fading two marks instead of moving one. */}
      <div className="hero__bottom">
        <ParallaxHeading as="h1" className="hero__headline" align="start">
          <span>The operating system</span>
          <span>for consumer brands.</span>
        </ParallaxHeading>
        <div className="hero__panel">
          <p className="hero__lede">
            Meolaa is an AI native house of consumer brands reading demand,
            building products and running go to market as one connected system.
          </p>
          <div className="hero__actions">
            <a className="hero__btn hero__btn--solid" href="#story">
              Read Our Story
            </a>
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
          <p data-vision-line>We find it, build for it, and run it</p>
          <p data-vision-line>faster than anyone else can</p>
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

export function MetricsSection() {
  return (
    <section className="metrics" data-section="metrics">
      <header className="section-head section-head--on-light">
        <p className="section-head__eyebrow">By the numbers</p>
        <ParallaxHeading className="section-head__title">
          Proof, not promises.
        </ParallaxHeading>
        <p className="section-head__sub">
          Where the system stands today, capital raised, categories mapped,
          brands live and markets served.
        </p>
      </header>

      <div className="metrics__chart">
        <div className="metric" data-metric>
          <strong>$6M</strong>
          <span>Raised across seed rounds</span>
        </div>
        <div className="metric" data-metric>
          <strong>120+</strong>
          <span>Categories mapped</span>
        </div>
        <div className="metric" data-metric>
          <strong>1</strong>
          <span>Brand live</span>
        </div>
        <div className="metric" data-metric>
          <strong>3</strong>
          <span>Market Served</span>
        </div>
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
const INVESTOR_MARQUEE_UNIT = [
  ...INVESTOR_LOGOS,
  ...INVESTOR_LOGOS,
] as const

function InvestorLogoSet({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul
      className="investor-logos__set"
      aria-hidden={ariaHidden || undefined}
    >
      {INVESTOR_MARQUEE_UNIT.map((logo, i) => (
        <li
          key={`${ariaHidden ? 'b' : 'a'}-${i}-${logo.src}`}
          className="investor-logos__item"
        >
          <img
            src={logo.src}
            alt={ariaHidden || i >= INVESTOR_LOGOS.length ? '' : logo.alt}
            width={160}
            height={36}
            draggable={false}
          />
        </li>
      ))}
    </ul>
  )
}

export function InvestorsSection() {
  return (
    <section className="investors" data-section="investors" id="partners">
      <header className="section-head">
        <p className="section-head__eyebrow">Backed by</p>
        <ParallaxHeading className="section-head__title investors__title">
          <span className="investors__title-line">Investors who back systems,</span>
          <span className="investors__title-line">not just brands.</span>
        </ParallaxHeading>
        <p className="section-head__sub">
          Capital from partners who underwrote the operating layer, not a
          single product line.
        </p>
      </header>
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
      <a className="btn-ghost" href="#partners">
        Partner with us →
      </a>
    </section>
  )
}

export function PressSection() {
  return (
    <section className="press-feed" data-section="press" id="press">
      {/* Split header: type stack left, action right. The stack wrapper is what
          lets the CTA be a row sibling rather than a fourth item in the
          centred column — see .section-head--split. */}
      <div className="press-feed__head section-head section-head--on-light section-head--split">
        <div className="section-head__stack">
          <p className="section-head__eyebrow">Media</p>
          <ParallaxHeading
            className="press-feed__title section-head__title"
            align="start"
          >
            Press
          </ParallaxHeading>
          <p className="section-head__sub">
            Coverage and conversations about the system we&apos;re building.
          </p>
        </div>
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
          <h3>Meolaa raises $6M to build an AI native house of brands</h3>
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


