import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  MeolaaLogoMark,
  MEOLAA_MARK_VIEWBOX_TIGHT,
} from '../brand/MeolaaLogoMark'
import { gsap, ScrollTrigger } from '../../lib/motion'
import './FoundingSection.css'

/** Extra scroll the fold holds for, as a fraction of the viewport. This is the
 *  "slow down and read it" dial: the section parks on screen for this much
 *  additional scrolling before the page moves on. Every other major fold is
 *  pinned; this one wasn't, which is why it read too fast. */
const FOUNDING_HOLD_VH = 0.9

/* ——— "Deal the cards" hover effect (madewithgsap tutorial 036) ———
 * Hovering a marked word in the lede flicks brand images out around the
 * cursor, cycling fast and landing at random angles like cards being dealt.
 * The tutorial's own source is members-only, so this is a from-scratch build
 * to the described behaviour: rapid cycling, random placement, stacking. */

/** Cycled in order; index wraps, so the set just needs to be long enough that
 *  you rarely see the same card twice in one pass. */
const DEAL_IMAGES = [
  '/assets/portfolio-hira.jpg',
  '/assets/portfolio-fragrance-01.jpg',
  '/assets/portfolio-beauty-01.jpg',
  '/assets/portfolio-kitchen-01.jpg',
  '/assets/portfolio-fragrance-02.jpg',
  '/assets/portfolio-kitchen-02.jpg',
] as const

/** Words in the lede that deal cards. Matched on normalised text because the
 *  paragraph is re-split into per-word spans at runtime. */
const DEAL_WORDS = new Set(['demand', 'brands'])

/** Minimum gap between cards (ms). Lower = denser trail. */
const DEAL_INTERVAL_MS = 95
/** Cursor travel required before the next card (px) — stops a resting pointer
 *  from spraying cards on its own micro-jitter. */
const DEAL_MIN_TRAVEL = 26
/** How long a card sits before it fades. */
const DEAL_HOLD = 0.5

/**
 * About / founding — white section ground, full-bleed team cutout as hero stage,
 * large primary Meolaa wordmark watermark behind subjects (shows through PNG alpha),
 * bottom row mirrors hero (title + sub | lede + CTA).
 *
 * Layering: bg → mark (Planet Blue) → cutout photo → veil → copy
 */
export function FoundingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const mediasRef = useRef<HTMLDivElement>(null)

  /* Hold the fold still for FOUNDING_HOLD_VH of scroll so the story can be
   * read. Pin only — no scrubbed animation attached, so there is nothing here
   * to fall out of sync; the existing reveals keep their own triggers.
   * Created in this component (not HomeAnimations) to match how Lab and
   * Portfolio register their pins, which keeps pin creation in document order. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const mm = gsap.matchMedia()

    /* Desktop only: on short/mobile viewports a pinned fold plus the address
       bar makes the page feel stuck rather than readable. */
    mm.add('(min-width: 901px)', () => {
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * FOUNDING_HOLD_VH)}`,
        pin: true,
        pinSpacing: true,
        /* No anticipatePin — with Lenis it overshoots and reads as a spring. */
        anticipatePin: 0,
        invalidateOnRefresh: true,
      })
      return () => st.kill()
    })

    return () => {
      mm.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  /* ——— Deal-the-cards on word hover ———
   * Pointer moving across a marked word flicks the next brand image out at the
   * cursor with a random angle and offset, then fades it. Cards come from a
   * fixed recycled pool, so the DOM count stays constant however fast you move.
   *
   * The trigger words are found at runtime rather than written in JSX:
   * HomeAnimations' word-stagger calls splitTextWords() on .founding__lede,
   * which clears the paragraph and rebuilds it as one span per word. Anything
   * React put inside is destroyed by that. So we tag the *generated* spans, and
   * re-tag via MutationObserver whenever the paragraph is rebuilt.
   *
   * Gated to fine-pointer devices: on touch there is no hover, and firing this
   * on tap would drop a card over the CTA the user is aiming for. */
  useEffect(() => {
    const section = sectionRef.current
    const medias = mediasRef.current
    if (!section || !medias) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const lede = section.querySelector<HTMLElement>('.founding__lede')
    const cards = Array.from(
      medias.querySelectorAll<HTMLImageElement>('.founding__card'),
    )
    if (!lede || !cards.length) return

    const normalise = (t: string) => t.trim().toLowerCase().replace(/[^a-z]/g, '')

    /* Mark whichever spans currently hold the trigger words. Idempotent, so the
       observer can call it on every rebuild. */
    const tagWords = () => {
      lede.querySelectorAll('span').forEach((span) => {
        if (span.children.length) return
        span.classList.toggle(
          'founding__deal-word',
          DEAL_WORDS.has(normalise(span.textContent ?? '')),
        )
      })
    }
    tagWords()
    const observer = new MutationObserver(tagWords)
    observer.observe(lede, { childList: true, subtree: true })

    let next = 0
    let top = 0
    let lastAt = 0
    let lastX = 0
    let lastY = 0
    let primed = false

    const deal = (clientX: number, clientY: number) => {
      const now = performance.now()
      if (now - lastAt < DEAL_INTERVAL_MS) return
      if (primed && Math.hypot(clientX - lastX, clientY - lastY) < DEAL_MIN_TRAVEL) {
        return
      }
      lastAt = now
      lastX = clientX
      lastY = clientY
      primed = true

      /* Position against the layer's box, not the page — this fold is pinned,
         so page coords drift out from under the cards while it's parked. */
      const box = medias.getBoundingClientRect()
      const card = cards[next % cards.length]
      next += 1
      top += 1
      if (!card) return

      gsap.killTweensOf(card)
      gsap.set(card, {
        x: clientX - box.left + gsap.utils.random(-38, 38),
        y: clientY - box.top + gsap.utils.random(-30, 30),
        rotate: gsap.utils.random(-20, 20),
        xPercent: -50,
        yPercent: -50,
        zIndex: top,
        scale: 0.82,
        autoAlpha: 1,
      })
      gsap.to(card, { scale: 1, duration: 0.42, ease: 'power3.out' })
      gsap.to(card, {
        autoAlpha: 0,
        duration: 0.45,
        delay: DEAL_HOLD,
        ease: 'power2.out',
      })
    }

    /* Delegated: the spans are replaced wholesale by the splitter, so listeners
       bound to them individually would die with them. The <p> survives. */
    const hitWord = (e: PointerEvent) =>
      (e.target as HTMLElement | null)?.closest?.('.founding__deal-word') ?? null

    const onMove = (e: PointerEvent) => {
      if (!hitWord(e)) return
      deal(e.clientX, e.clientY)
    }
    /* Reset travel gating on entry so the first move over a word always deals,
       rather than waiting out the distance from the previous one. */
    const onOver = (e: PointerEvent) => {
      if (hitWord(e)) primed = false
    }

    lede.addEventListener('pointermove', onMove)
    lede.addEventListener('pointerover', onOver)

    return () => {
      observer.disconnect()
      lede.removeEventListener('pointermove', onMove)
      lede.removeEventListener('pointerover', onOver)
      gsap.killTweensOf(cards)
      gsap.set(cards, { autoAlpha: 0 })
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="founding"
      data-section="founding"
      id="story"
      aria-labelledby="founding-title"
    >
      <div className="founding__bg" aria-hidden="true" />

      <div className="founding__inner" data-founding-reveal>
        <figure className="founding__photo" data-founding-photo>
          <div className="founding__frame">
            {/* Watermark under cutout so it reads on the wall behind people */}
            <div className="founding__mark" aria-hidden="true">
              <MeolaaLogoMark
                className="founding__mark-svg"
                viewBox={MEOLAA_MARK_VIEWBOX_TIGHT}
                role="presentation"
                aria-hidden="true"
              />
            </div>
            <img
              className="founding__cutout"
              src="/assets/founding-hero.png"
              alt="Meolaa team collaborating in a meeting"
              draggable={false}
            />
            <span className="founding__veil" aria-hidden="true" />
          </div>
        </figure>

        <div className="founding__bottom">
          <div className="founding__lead">
            <p className="founding__eyebrow">Founding</p>
            <h2 id="founding-title" className="founding__title">
              <span className="founding__title-line">
                <span className="founding__title-inner">
                  It started with a question
                </span>
              </span>
              <span className="founding__title-line">
                <span className="founding__title-inner">
                  no one else was asking.
                </span>
              </span>
            </h2>
            <p className="founding__sub">
              How one question became an operating system for consumer brands.
            </p>
          </div>

          <div className="founding__panel">
            {/* Trigger words are tagged at runtime, not here: HomeAnimations'
                word-stagger rebuilds this paragraph's innerHTML, so any span
                written in JSX is destroyed before it can be hovered. */}
            <p className="founding__lede">
              We turn emerging demand into a system that launches brands faster
              than traditional FMCG can move.
            </p>
            <div className="founding__actions">
              <Link className="hero__btn founding__cta" to="/story">
                Read Our Story →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Card pool for the hover deal. Decorative, so aria-hidden and no alt;
          a fixed pool that gets recycled rather than nodes created per move. */}
      <div className="founding__medias" ref={mediasRef} aria-hidden="true">
        {DEAL_IMAGES.map((src) => (
          <img
            key={src}
            className="founding__card"
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ))}
      </div>
    </section>
  )
}
