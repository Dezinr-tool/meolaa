/**
 * Site footer — white pre-stage (matches Press), then a Luke-style black
 * scale-blob expands from bottom-center (GSAP pin + scrub). Jump rows →
 * column grid → legal → liquid-fill MEOLAA.
 * Lenis sync via SmoothScroll (ScrollTrigger.update only; no scrollerProxy).
 *
 * Blob + copy reveal run only while pinned (flush-top). Mark plays once.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  MEOLAA_MARK_VIEWBOX_TIGHT,
  MeolaaLogoMark,
} from '../brand/MeolaaLogoMark'
import { gsap, ScrollTrigger } from '../../lib/motion'
import { getLenisInstance, refreshScrollAndLenis } from '../../lib/lenisInstance'
import './SiteFooter.css'

const PRIMARY = '#000000'
/** Expand only once footer owns the fold — avoids covering Press. */
const REVEAL_START = 'top top'
/** Pin when footer is flush; longer travel so the disc expands more slowly. */
const PIN_START = 'top top'
const PIN_END = '+=280%'
/**
 * Same window as pin — slow scrubbed expand across the pinned stage.
 * Must stay a relative end (`+=`): the two-value form `top top+=280%`
 * resolves to start === end, so the trigger fires onLeave immediately and
 * settleFooterStage() collapses the pin spacer mid-Press.
 */
const REVEAL_END = PIN_END
/** Soft catch-up behind Lenis — higher = gentler, less “snap open”. */
const STAGE_SCRUB = 3.0
/**
 * Wait until the disc covers the fold — revealing earlier left text clipped by
 * the circle edge and a flat chord across the top of the box.
 */
const CONTENT_MASK_AT = 0.64
const CONTENT_MASK_DUR = 0.34
/** Brand mark clip reveal shortly after content is readable. */
const LOGO_FILL_AT = 0.76
const LOGO_FILL_DUR = 0.75
/** Blob rests half-below the fold (Luke pattern) so scale grows upward. */
const BLOB_X_PERCENT = -50
const BLOB_Y_PERCENT = 50
const MOBILE_MQ = '(max-width: 900px)'
const DESKTOP_MQ = '(min-width: 901px)'
const REDUCED_MQ = '(prefers-reduced-motion: reduce)'

function showBlobOpen(el: HTMLElement) {
  gsap.set(el, {
    xPercent: BLOB_X_PERCENT,
    yPercent: BLOB_Y_PERCENT,
    scale: 1,
    backgroundColor: PRIMARY,
  })
}

function resetBlob(el: HTMLElement) {
  gsap.set(el, {
    xPercent: BLOB_X_PERCENT,
    yPercent: BLOB_Y_PERCENT,
    scale: 0,
    backgroundColor: PRIMARY,
  })
}

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
        showBlobOpen(circle)
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
          gsap.set(circle, { clearProps: 'transform,backgroundColor' })
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
        resetBlob(circle)
        if (copyReveal) resetCopyReveal(copyReveal)
        if (markWrap) {
          markWrap.classList.remove('is-revealed')
          gsap.set(markWrap, { clipPath: CLIP_HIDDEN })
        }

        let fillPlayed = false
        let settled = false
        /**
         * Settling removes ~280vh of pin-spacer, so the browser clamps scroll
         * back above the stage start and ScrollTrigger fires onLeaveBack —
         * which unsettles, restores the spacer and lets us fall into the stage
         * again, forever. Ignore leave-back until the collapse has been
         * re-anchored to the new document bottom.
         */
        let settling = false

        /** Pin leaves inline height on `.footer-pin` — collapse + remeasure. */
        const settleFooterStage = () => {
          const revealST = ScrollTrigger.getById('footer-circle-reveal')
          if (settled) return
          /* ST refresh can spuriously fire onLeave — never collapse mid-scrub. */
          if (revealST && revealST.progress < 0.995) return

          settled = true
          settling = true
          if (copyReveal) showCopyRevealed(copyReveal)
          if (markWrap && !markWrap.classList.contains('is-revealed')) {
            fillPlayed = true
            showLogoFilled(markWrap)
          }

          circle.classList.add('is-visible')
          showBlobOpen(circle)
          /* Collapsing pin-spacer remaps scrub progress to ~0 — stop the
             timeline so it cannot rewind the blob/copy after refresh. */
          if (revealST) revealST.disable(false)

          root.classList.add('is-settled')
          gsap.set(pin, {
            clearProps: 'height,minHeight,maxHeight',
          })

          const lockSettledVisuals = () => {
            showBlobOpen(circle)
            if (copyReveal) showCopyRevealed(copyReveal)
            if (markWrap) showLogoFilled(markWrap)
          }

          /* `.is-settled` CSS already collapses the spacer (height/padding are
             !important there). Setting an explicit height here re-measured the
             pin mid-collapse as 0, which shrank the document a further ~900px
             and flashed the viewport back to Press before the anchor landed. */
          refreshScrollAndLenis()
          anchorToDocumentEnd()
          requestAnimationFrame(() => {
            refreshScrollAndLenis()
            anchorToDocumentEnd()
            requestAnimationFrame(() => {
              refreshScrollAndLenis()
              lockSettledVisuals()
              anchorToDocumentEnd()
              settling = false
            })
          })
        }

        /** Re-anchor scroll (and Lenis) to the post-collapse document bottom. */
        const anchorToDocumentEnd = () => {
          const max = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight,
          )
          const lenis = getLenisInstance()
          if (lenis) lenis.scrollTo(max, { immediate: true, force: true })
          else window.scrollTo(0, max)
        }

        const unsettleFooterStage = () => {
          if (settling) return
          settled = false
          root.classList.remove('is-settled')
          const revealST = ScrollTrigger.getById('footer-circle-reveal')
          /* ScrollTrigger has no `enabled` getter (types or runtime), so the
             old `!revealST.enabled` guard was always true — enable outright. */
          if (revealST) revealST.enable(false)
          const pinSpacer = pin.parentElement
          if (pinSpacer?.classList.contains('pin-spacer')) {
            gsap.set(pinSpacer, { clearProps: 'height,paddingBottom' })
          }
          requestAnimationFrame(refreshScrollAndLenis)
        }

        /* Pin + reveal share flush-top → +=280% so the disc never grows
           while Press still owns the viewport. */
        ScrollTrigger.create({
          id: 'footer-circle-stage',
          trigger: runway,
          start: PIN_START,
          end: PIN_END,
          pin,
          pinSpacing: true,
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onEnter: () => circle.classList.add('is-visible'),
          onEnterBack: () => circle.classList.add('is-visible'),
          onLeave: settleFooterStage,
          onLeaveBack: () => {
            unsettleFooterStage()
            fillPlayed = false
            if (markWrap) resetLogoFill(markWrap)
            if (copyReveal) resetCopyReveal(copyReveal)
            resetBlob(circle)
          },
        })

        /* Scrubbed blob scale across the pinned stage.
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
              if (copyReveal) showCopyRevealed(copyReveal)
              if (markWrap && !markWrap.classList.contains('is-revealed')) {
                fillPlayed = true
                showLogoFilled(markWrap)
              }
              settleFooterStage()
            },
            onLeaveBack: () => {
              unsettleFooterStage()
              circle.classList.remove('is-visible')
              fillPlayed = false
              if (markWrap) resetLogoFill(markWrap)
              if (copyReveal) resetCopyReveal(copyReveal)
              resetBlob(circle)
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

        /* Luke-style: giant disc scales 0 → 1 from bottom-center (black). */
        tl.fromTo(
          circle,
          {
            xPercent: BLOB_X_PERCENT,
            yPercent: BLOB_Y_PERCENT,
            scale: 0,
          },
          {
            xPercent: BLOB_X_PERCENT,
            yPercent: BLOB_Y_PERCENT,
            scale: 1,
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

        const onResize = () => refreshScrollAndLenis()
        window.addEventListener('resize', onResize)
        requestAnimationFrame(refreshScrollAndLenis)
        window.setTimeout(refreshScrollAndLenis, 300)
        window.setTimeout(refreshScrollAndLenis, 900)
        window.setTimeout(refreshScrollAndLenis, 2000)

        return () => {
          window.removeEventListener('resize', onResize)
          unsettleFooterStage()
          ScrollTrigger.getById('footer-circle-stage')?.kill()
          ScrollTrigger.getById('footer-circle-reveal')?.kill()
          tl.kill()
          circle.classList.remove('is-visible')
          gsap.set(circle, { clearProps: 'transform,backgroundColor' })
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
            <div className="footer-blob-wrap" aria-hidden="true">
              <div ref={circleRef} className="footer-blob" />
            </div>
          ) : null}
          {content}
        </div>
      </div>
    </footer>
  )
}
