/**
 * Site footer — jump rows → column grid → legal → MEOLAA wordmark.
 *
 * Homepage: circle-reveal scrub as the footer enters from Press — a disc grows
 * from bottom-center over a 200vh trigger while the footer stays sticky in one
 * viewport. Inner pages render flat (`simple`).
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  MEOLAA_MARK_VIEWBOX_TIGHT,
  MeolaaLogoMark,
} from '../brand/MeolaaLogoMark'
import { gsap } from '../../lib/motion'
import { refreshScrollAndLenis } from '../../lib/lenisInstance'
import {
  FOOTER_CIRCLE_CLIP_START,
  footerCircleClipEnd,
} from '../../lib/footerCircleReveal'
import './SiteFooter.css'

const REDUCED_MQ = '(prefers-reduced-motion: reduce)'

/** Mostly white → soft fade so MEOLAA stays readable on the navy footer. */
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
  /** Inner pages render the same footer without the homepage circle reveal. */
  simple?: boolean
}

export function SiteFooter({ simple = false }: SiteFooterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(REDUCED_MQ).matches
      : false,
  )

  const animated = !simple && !reducedMotion

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MQ)
    const onChange = () => setReducedMotion(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!animated) return

    const root = rootRef.current
    const trigger = triggerRef.current
    const footer = footerRef.current
    if (!root || !trigger || !footer) return

    const ctx = gsap.context(() => {
      gsap.set(footer, { clipPath: FOOTER_CIRCLE_CLIP_START })

      gsap.to(footer, {
        clipPath: () => footerCircleClipEnd(),
        ease: 'none',
        scrollTrigger: {
          id: 'footer-circle-reveal',
          trigger,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onLeave: () => {
            root.classList.add('is-settled')
            requestAnimationFrame(() => refreshScrollAndLenis())
          },
          onEnterBack: () => {
            root.classList.remove('is-settled')
            requestAnimationFrame(() => refreshScrollAndLenis())
          },
        },
      })

      const onResize = () => refreshScrollAndLenis()
      window.addEventListener('resize', onResize)
      requestAnimationFrame(() => refreshScrollAndLenis())

      return () => {
        window.removeEventListener('resize', onResize)
      }
    }, root)

    return () => {
      root.classList.remove('is-settled')
      ctx.revert()
    }
  }, [animated])

  const content = <FooterBody />

  if (simple) {
    return (
      <footer
        className="footer-reveal-section footer-reveal-section--static"
        aria-label="Footer"
      >
        <div className="footer-content site-footer">{content}</div>
      </footer>
    )
  }

  if (!animated) {
    return (
      <footer
        ref={rootRef}
        className="footer-reveal-section footer-reveal-section--static"
        id="careers"
        aria-label="Footer"
      >
        <div className="footer-content site-footer">{content}</div>
      </footer>
    )
  }

  return (
    <footer
      ref={rootRef}
      className="footer-reveal-section footer-reveal-section--animated"
      id="careers"
      aria-label="Footer"
    >
      <div ref={triggerRef} className="footer-trigger">
        <div className="footer-reveal-shell">
          <div ref={footerRef} className="footer-content site-footer">
            {content}
          </div>
        </div>
      </div>
    </footer>
  )
}
