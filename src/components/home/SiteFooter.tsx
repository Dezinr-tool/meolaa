/**
 * Site footer — white pre-stage (matches Press), black circle expand
 * (GSAP pin + scrub), jump rows → column grid → legal → liquid-fill MEOLAA.
 * Lenis sync via SmoothScroll (ScrollTrigger.update only; no scrollerProxy).
 *
 * Reveal runs only while the footer is pinned (flush-top). Copy uses a
 * scrubbed clip-path wipe; mark plays once and stays visible.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  MEOLAA_MARK_VIEWBOX_TIGHT,
  MeolaaLogoMark,
} from '../brand/MeolaaLogoMark'
import { gsap, ScrollTrigger } from '../../lib/motion'
import './SiteFooter.css'

const PRIMARY = '#000000'
/** Expand only once footer owns the fold — avoids covering Press. */
const REVEAL_START = 'top top'
/** Pin when footer is flush; longer travel so the disc expands more slowly. */
const PIN_START = 'top top'
const PIN_END = '+=175%'
/** Same window as pin — slow scrubbed expand across the pinned stage. */
const REVEAL_END = 'top top+=175%'
/** Soft catch-up behind Lenis — higher = gentler, less “snap open”. */
const STAGE_SCRUB = 1.9
/**
 * Wait until the disc covers the fold — revealing earlier left text clipped by
 * the circle edge and a flat chord across the top of the box.
 */
const CONTENT_MASK_AT = 0.66
const CONTENT_MASK_DUR = 0.32
/** Brand mark clip reveal shortly after content is readable. */
const LOGO_FILL_AT = 0.78
const LOGO_FILL_DUR = 0.75
/**
 * vmax radius covers viewport corners from bottom-center regardless of
 * host height (%-of-box left white wedges on tall/short stages).
 */
const CIRCLE_END = 'circle(150vmax at 50% 100%)'
const MOBILE_MQ = '(max-width: 900px)'
const DESKTOP_MQ = '(min-width: 901px)'
const REDUCED_MQ = '(prefers-reduced-motion: reduce)'

const CLIP_HIDDEN = 'inset(100% 0 0 0)'
/** Slight bottom outset avoids antialiased hairline under glyphs. */
const CLIP_VISIBLE = 'inset(0% 0 -2px 0)'
const CONTENT_MASK_END = CONTENT_MASK_AT + CONTENT_MASK_DUR

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

/** Reveal once; class locks CSS so inset(100%) cannot hide it again. */
function playLogoFill(el: HTMLElement) {
  gsap.killTweensOf(el)
  el.classList.remove('is-revealed')
  gsap.fromTo(
    el,
    { clipPath: CLIP_HIDDEN },
    {
      clipPath: CLIP_VISIBLE,
      duration: LOGO_FILL_DUR,
      ease: 'power3.out',
      overwrite: true,
      onComplete: () => {
        gsap.set(el, { clipPath: 'none' })
        el.classList.add('is-revealed')
      },
    },
  )
}

function resetLogoFill(el: HTMLElement) {
  gsap.killTweensOf(el)
  el.classList.remove('is-revealed')
  gsap.set(el, { clipPath: CLIP_HIDDEN })
}

function showLogoFilled(el: HTMLElement) {
  gsap.killTweensOf(el)
  gsap.set(el, { clipPath: 'none' })
  el.classList.add('is-revealed')
}

/** CSS lock only — keep GSAP at CLIP_VISIBLE so scrub reverse still interpolates. */
function lockCopyReveal(el: HTMLElement) {
  el.classList.add('is-revealed')
}

function resetCopyReveal(el: HTMLElement) {
  el.classList.remove('is-revealed')
  gsap.set(el, { clipPath: CLIP_HIDDEN })
}

/** Final settle — clear clip so nothing stays inset-hidden. */
function showCopyRevealed(el: HTMLElement) {
  gsap.set(el, { clipPath: 'none' })
  el.classList.add('is-revealed')
}

type SiteFooterProps = {
  /** Static footer for inner pages — no pin / circle reveal. */
  simple?: boolean
}

export function SiteFooter({ simple = false }: SiteFooterProps) {
  const rootRef = useRef<HTMLElement>(null)
  const runwayRef = useRef<HTMLDivElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const circleRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(REDUCED_MQ).matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(REDUCED_MQ)
    const onChange = () => setReducedMotion(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (simple) return

    const root = rootRef.current
    const runway = runwayRef.current
    const pin = pinRef.current
    const circle = circleRef.current
    const content = contentRef.current
    if (!root || !runway || !pin || !content) return

    const markWrap =
      content.querySelector<HTMLElement>('.site-footer__mark-wrap')
    const copyReveal =
      content.querySelector<HTMLElement>('.footer-copy-reveal')

    if (reducedMotion || !circle) {
      gsap.set(content, { clearProps: 'opacity,transform,clipPath' })
      if (copyReveal) showCopyRevealed(copyReveal)
      if (markWrap) showLogoFilled(markWrap)
      return
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(MOBILE_MQ, () => {
        circle.classList.add('is-visible')
        gsap.set(circle, {
          clipPath: CIRCLE_END,
          backgroundColor: PRIMARY,
        })
        if (copyReveal) showCopyRevealed(copyReveal)

        let fillPlayed = false
        if (markWrap) {
          gsap.set(markWrap, { clipPath: CLIP_HIDDEN })
          markWrap.classList.remove('is-revealed')
          ScrollTrigger.create({
            id: 'footer-logo-fill',
            trigger: markWrap,
            start: 'top 92%',
            onEnter: () => {
              if (fillPlayed) return
              fillPlayed = true
              playLogoFill(markWrap)
            },
            onLeaveBack: () => {
              fillPlayed = false
              resetLogoFill(markWrap)
            },
          })
        }

        return () => {
          circle.classList.remove('is-visible')
          ScrollTrigger.getById('footer-logo-fill')?.kill()
          gsap.set(circle, { clearProps: 'clipPath,backgroundColor' })
          if (copyReveal) {
            copyReveal.classList.remove('is-revealed')
            gsap.set(copyReveal, { clearProps: 'clipPath' })
          }
          if (markWrap) {
            markWrap.classList.remove('is-revealed')
            gsap.set(markWrap, { clearProps: 'clipPath' })
          }
        }
      })

      mm.add(DESKTOP_MQ, () => {
        circle.classList.remove('is-visible')
        gsap.set(circle, {
          clipPath: 'circle(0% at 50% 100%)',
          backgroundColor: PRIMARY,
        })
        if (copyReveal) resetCopyReveal(copyReveal)
        if (markWrap) {
          markWrap.classList.remove('is-revealed')
          gsap.set(markWrap, { clipPath: CLIP_HIDDEN })
        }

        let fillPlayed = false

        /* Pin + reveal share flush-top → +=150% so the disc never grows
           while Press still owns the viewport. */
        ScrollTrigger.create({
          id: 'footer-circle-stage',
          trigger: runway,
          start: PIN_START,
          end: PIN_END,
          pin,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onEnter: () => circle.classList.add('is-visible'),
          onEnterBack: () => circle.classList.add('is-visible'),
          onLeaveBack: () => {
            fillPlayed = false
            if (markWrap) resetLogoFill(markWrap)
            if (copyReveal) resetCopyReveal(copyReveal)
          },
        })

        /* Scrubbed expand across the pinned stage only.
           Logo fill fires once — never re-hidden by scrub bounce. */
        const tl = gsap.timeline({
          scrollTrigger: {
            id: 'footer-circle-reveal',
            trigger: runway,
            start: REVEAL_START,
            end: REVEAL_END,
            scrub: STAGE_SCRUB,
            invalidateOnRefresh: true,
            onEnter: () => circle.classList.add('is-visible'),
            onEnterBack: () => circle.classList.add('is-visible'),
            onLeave: () => {
              /* Pin settle complete — guarantee copy + logo stay painted. */
              if (copyReveal) showCopyRevealed(copyReveal)
              if (markWrap && !markWrap.classList.contains('is-revealed')) {
                fillPlayed = true
                showLogoFilled(markWrap)
              }
            },
            onLeaveBack: () => {
              circle.classList.remove('is-visible')
              fillPlayed = false
              if (markWrap) resetLogoFill(markWrap)
              if (copyReveal) resetCopyReveal(copyReveal)
            },
            onUpdate: (self) => {
              if (copyReveal) {
                if (self.progress >= CONTENT_MASK_END) {
                  if (!copyReveal.classList.contains('is-revealed')) {
                    lockCopyReveal(copyReveal)
                  }
                } else if (copyReveal.classList.contains('is-revealed')) {
                  /* Unlock so scrub can reverse the wipe cleanly. */
                  copyReveal.classList.remove('is-revealed')
                }
              }
              if (!markWrap || fillPlayed) return
              if (self.progress >= LOGO_FILL_AT) {
                fillPlayed = true
                playLogoFill(markWrap)
              }
            },
          },
        })

        tl.fromTo(
          circle,
          { clipPath: 'circle(0% at 50% 100%)' },
          {
            clipPath: CIRCLE_END,
            duration: 1,
            ease: 'none',
          },
          0,
        )

        if (copyReveal) {
          tl.fromTo(
            copyReveal,
            { clipPath: CLIP_HIDDEN },
            {
              clipPath: CLIP_VISIBLE,
              duration: CONTENT_MASK_DUR,
              ease: 'power1.inOut',
            },
            CONTENT_MASK_AT,
          )
        }

        const onResize = () => ScrollTrigger.refresh()
        window.addEventListener('resize', onResize)
        requestAnimationFrame(() => ScrollTrigger.refresh())

        return () => {
          window.removeEventListener('resize', onResize)
          ScrollTrigger.getById('footer-circle-stage')?.kill()
          ScrollTrigger.getById('footer-circle-reveal')?.kill()
          tl.kill()
          circle.classList.remove('is-visible')
          gsap.set(circle, { clearProps: 'clipPath,backgroundColor' })
          if (copyReveal) {
            copyReveal.classList.remove('is-revealed')
            gsap.set(copyReveal, { clearProps: 'clipPath' })
          }
          if (markWrap) {
            markWrap.classList.remove('is-revealed')
            gsap.set(markWrap, { clearProps: 'clipPath' })
          }
        }
      })
    }, root)

    return () => ctx.revert()
  }, [reducedMotion, simple])

  const animated = !reducedMotion && !simple

  const content = (
    <div ref={contentRef} className="footer-content site-footer">
      <FooterBody />
    </div>
  )

  if (simple) {
    return (
      <footer
        ref={rootRef}
        className="footer-reveal-section footer-reveal-section--static"
        aria-label="Footer"
      >
        {content}
      </footer>
    )
  }

  return (
    <footer
      ref={rootRef}
      className={
        animated
          ? 'footer-reveal-section footer-reveal-section--animated'
          : 'footer-reveal-section footer-reveal-section--static'
      }
      id="careers"
      aria-label="Footer"
    >
      <div ref={runwayRef} className="footer-runway">
        <div ref={pinRef} className="footer-pin">
          {animated ? (
            <div ref={circleRef} className="footer-circle-reveal">
              {content}
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    </footer>
  )
}
