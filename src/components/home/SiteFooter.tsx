/**
 * Site footer — jump rows → column grid → legal → MEOLAA wordmark.
 *
 * Renders flat, with no pin/scrub reveal. The previous version expanded a
 * black blob across a 280vh pinned stage while clip-wiping the copy in; the
 * wipe kept the whole footer clipped to nothing for the entire stage, so the
 * content was unreadable on the way down. Removed rather than retimed.
 */
import { useEffect, useRef, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from '../../lib/motion'
import {
  MEOLAA_MARK_VIEWBOX_TIGHT,
  MeolaaLogoMark,
} from '../brand/MeolaaLogoMark'
import './SiteFooter.css'

/** Mostly white → soft fade so MEOLAA stays readable on the black footer. */
const FOOTER_LOGO_GRADIENT = {
  id: 'footer-meolaa-fill',
  top: '#ffffff',
  bottom: 'rgba(255, 255, 255, 0.55)',
} as const

const JUMP_LINKS = [
  {
    title: 'About Us',
    to: '/about',
    desc: 'The thesis behind an AI native brand company.',
  },
  {
    title: 'Brand Lab',
    to: '/lab',
    desc: 'How the OS finds and builds every brand.',
  },
  {
    title: 'Careers',
    to: '/careers',
    desc: 'Build with a small team, real ownership.',
  },
] as const

function onNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault()
}

function FooterBody() {
  return (
    <>
      {/* Mask wipe targets copy only — mark keeps its own reveal clip. */}
      <div className="footer-copy-reveal">
        <nav
          className="site-footer__jumps"
          id="about"
          aria-label="Where next"
        >
          {JUMP_LINKS.map((link) => (
            <Link key={link.to} className="site-footer__jump" to={link.to}>
              <span className="site-footer__jump-title">{link.title}</span>
              <span className="site-footer__jump-desc">
                {link.desc} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </nav>

        <div className="site-footer__grid">
          <p className="site-footer__tagline">
            Reading the market. Building what it needs.
          </p>

          <div>
            <div className="site-footer__label">COMPANY</div>
            <Link to="/lab">CMI Platform</Link>
            <Link to="/lab">Brand Copilot</Link>
            <a href="/#brands">Our Brands</a>
            <Link to="/about">Who We Are</Link>
            <Link to="/careers">Careers</Link>
          </div>

          <div>
            <div className="site-footer__label">CONNECT</div>
            <Link to="/contact">Contact</Link>
            <Link to="/press">Newsroom</Link>
            <Link to="/partners">Investors &amp; Partners</Link>
          </div>

          <div>
            <div className="site-footer__label">BRANDS</div>
            <a href="#" className="site-footer__external">
              HIRA <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="site-footer__newsletter">
            <div className="site-footer__label">NEWSLETTER</div>
            <form onSubmit={onNewsletterSubmit} noValidate>
              <label
                className="visually-hidden"
                htmlFor="footer-newsletter-email"
              >
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                name="email"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </form>
            <div className="site-footer__socials">
              <a href="#" aria-label="Instagram">
                Instagram
              </a>
              <a href="#" aria-label="LinkedIn">
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copy">© 2026 Meolaa. All rights reserved.</p>
          <div className="site-footer__legal">
            <a href="#">Privacy Policy</a>
            <span className="site-footer__legal-sep" aria-hidden="true">
              ·
            </span>
            <a href="#">Terms of Use</a>
          </div>
        </div>
      </div>

      <div className="site-footer__mark-wrap">
        <MeolaaLogoMark
          className="site-footer__wordmark"
          viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
          verticalGradient={FOOTER_LOGO_GRADIENT}
          aria-label="Meolaa"
        />
      </div>
    </>
  )
}

type SiteFooterProps = {
  /** Inner pages render the same footer without the homepage's #careers id. */
  simple?: boolean
}

export function SiteFooter({ simple = false }: SiteFooterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const arcRef = useRef<HTMLDivElement>(null)

  /* Swell the dome up as the footer approaches. Reduced motion keeps the
     shape but skips the scrub — it is a background, so a static arc is fine. */
  useEffect(() => {
    const root = rootRef.current
    const arc = arcRef.current
    if (!root || !arc) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(arc, { scaleY: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        arc,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            /* Run the swell only while the dome is actually on screen: from
               the footer's top edge touching the viewport bottom until it is
               40% up. The old range finished at `top top+=85%`, so the arc
               was already at full depth before it came into view and nothing
               appeared to animate. Scrub reverses it on the way back up. */
            start: 'top bottom',
            end: 'top 40%',
            scrub: 0.6,
          },
        },
      )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <footer
      ref={rootRef}
      className="footer-reveal-section footer-reveal-section--static"
      /* Inner pages already carry a #careers target in their own markup. */
      id={simple ? undefined : 'careers'}
      aria-label="Footer"
    >
      <div ref={arcRef} className="footer-arc" aria-hidden="true" />
      <div className="footer-content site-footer">
        <FooterBody />
      </div>
    </footer>
  )
}
