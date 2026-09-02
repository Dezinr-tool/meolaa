/**
 * Site footer — jump rows → column grid → legal → MEOLAA wordmark.
 *
 * Homepage: circle-reveal scrub as the footer enters from Press — a disc grows
 * from bottom-center over a 180vh trigger while the footer stays sticky in one
 * viewport. Inner pages render flat (`simple`).
 */
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
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
  footerCircleMinHeightPx,
} from '../../lib/footerCircleReveal'
import './SiteFooter.css'

const REDUCED_MQ = '(prefers-reduced-motion: reduce)'

/** Mostly white → soft fade — used by the cursor-reveal fill copy only;
 *  the base mark is a hollow outline (see SiteFooter.css) with no gradient. */
const FOOTER_LOGO_GRADIENT_HOVER = {
  id: 'footer-meolaa-fill-hover',
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

const FOOTER_CONTENT_RISE_Y = 48
const FOOTER_RISE_START = 0.5

function FooterBody({
  copyRevealRef,
  riseGroupRef,
}: {
  copyRevealRef?: RefObject<HTMLDivElement | null>
  riseGroupRef?: RefObject<HTMLDivElement | null>
}) {
  const markWrapRef = useRef<HTMLDivElement>(null)

  /* Cursor-follow reveal on the footer wordmark — mirrors the founding
   * pixel-cursor pattern's fine-pointer gate. Sets --mx/--my (percentages
   * within the mark wrap) that the mask-image radial-gradient reads.
   * Lerped via rAF rather than snapping straight to the pointer each move —
   * a raw 1:1 follow reads as a glitchy jump-cut when the mouse moves fast,
   * especially over a wide element like this wordmark. */
  useEffect(() => {
    const wrap = markWrapRef.current
    if (!wrap) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let targetX = -100
    let targetY = -100
    let curX = -100
    let curY = -100
    let raf = 0
    let active = false

    const tick = () => {
      curX += (targetX - curX) * 0.18
      curY += (targetY - curY) * 0.18
      wrap.style.setProperty('--mx', `${curX}%`)
      wrap.style.setProperty('--my', `${curY}%`)
      if (active || Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
        raf = requestAnimationFrame(tick)
      } else {
        raf = 0
      }
    }

    const ensureLoop = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      targetX = ((e.clientX - rect.left) / rect.width) * 100
      targetY = ((e.clientY - rect.top) / rect.height) * 100
      active = true
      ensureLoop()
    }
    const onLeave = () => {
      targetX = -100
      targetY = -100
      active = false
      ensureLoop()
    }

    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    return () => {
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const body = (
    <>
      <div className="footer-copy-reveal" ref={copyRevealRef}>
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

      <div className="site-footer__mark-wrap" ref={markWrapRef}>
        {/* Base mark — hollow line-art outline (see .site-footer__wordmark
            .meolaa-logo-mark__path). No gradient fill needed. */}
        <MeolaaLogoMark
          className="site-footer__wordmark"
          viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
          aria-label="Meolaa"
        />
        {/* Cursor-follow reveal — the same mark solid-filled, masked to a
            soft circle that tracks the pointer, so hovering/moving over it
            "fills in" the outline. Fine-pointer only; decorative, so
            aria-hidden and stacked over the real (accessible) mark. */}
        <MeolaaLogoMark
          className="site-footer__wordmark site-footer__wordmark-hover"
          viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
          verticalGradient={FOOTER_LOGO_GRADIENT_HOVER}
          aria-hidden="true"
        />
      </div>
    </>
  )

  if (riseGroupRef) {
    return (
      <div className="footer-rise-group" ref={riseGroupRef}>
        {body}
      </div>
    )
  }

  return body
}

type SiteFooterProps = {
  /** Inner pages render the same footer without the homepage circle reveal. */
  simple?: boolean
}

export function SiteFooter({ simple = false }: SiteFooterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const copyRevealRef = useRef<HTMLDivElement>(null)
  const riseGroupRef = useRef<HTMLDivElement>(null)
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
    const riseGroup = riseGroupRef.current
    if (!root || !trigger || !footer) return

    const ctx = gsap.context(() => {
      const isMobileFooter = () =>
        window.matchMedia('(max-width: 900px)').matches

      const syncCircleStageHeight = () => {
        if (isMobileFooter()) {
          /* Fill at least one viewport so the sticky shell never shows the
             white reveal ground beneath the navy panel. */
          footer.style.minHeight = `${Math.max(
            window.innerHeight,
            footer.scrollHeight,
          )}px`
          footer.style.height = 'auto'
          const runway = Math.max(0, footer.scrollHeight - window.innerHeight)
          root.style.setProperty('--footer-scroll-runway', `${runway}px`)
          return
        }
        root.style.removeProperty('--footer-scroll-runway')
        footer.style.minHeight = `${footerCircleMinHeightPx()}px`
        footer.style.height = ''
      }
      syncCircleStageHeight()

      gsap.set(footer, { clipPath: FOOTER_CIRCLE_CLIP_START })
      if (riseGroup) {
        gsap.set(riseGroup, {
          y: FOOTER_CONTENT_RISE_Y,
          autoAlpha: 0,
          force3D: true,
        })
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'footer-circle-reveal',
          trigger,
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      tl.to(
        footer,
        {
          clipPath: () => footerCircleClipEnd(),
          ease: 'none',
          duration: 1,
        },
        0,
      )

      if (riseGroup) {
        tl.to(
          riseGroup,
          {
            y: 0,
            autoAlpha: 1,
            ease: 'power2.out',
            duration: 0.55,
            force3D: true,
          },
          FOOTER_RISE_START,
        )
      }

      let resizeTimer = 0
      const onResize = () => {
        window.clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(() => {
          syncCircleStageHeight()
          refreshScrollAndLenis()
        }, 150)
      }
      window.addEventListener('resize', onResize)
      requestAnimationFrame(() => {
        syncCircleStageHeight()
        refreshScrollAndLenis()
      })
      requestAnimationFrame(() => {
        syncCircleStageHeight()
      })

      return () => {
        window.removeEventListener('resize', onResize)
        window.clearTimeout(resizeTimer)
      }
    }, root)

    return () => {
      ctx.revert()
    }
  }, [animated])

  useEffect(() => {
    if (!simple || reducedMotion) return

    const root = rootRef.current
    const riseGroup = riseGroupRef.current
    if (!root || !riseGroup) return

    const ctx = gsap.context(() => {
      gsap.set(riseGroup, { y: FOOTER_CONTENT_RISE_Y, autoAlpha: 0, force3D: true })
      gsap.to(riseGroup, {
        y: 0,
        autoAlpha: 1,
        duration: 0.85,
        ease: 'power2.out',
        force3D: true,
        scrollTrigger: {
          trigger: root,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      })
    }, root)

    return () => ctx.revert()
  }, [simple, reducedMotion])

  const content = (
    <FooterBody copyRevealRef={copyRevealRef} riseGroupRef={riseGroupRef} />
  )

  if (simple) {
    return (
      <footer
        ref={rootRef}
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
          <div className="footer-reveal-ground" aria-hidden="true" />
          <div ref={footerRef} className="footer-content site-footer">
            {content}
          </div>
        </div>
      </div>
    </footer>
  )
}
