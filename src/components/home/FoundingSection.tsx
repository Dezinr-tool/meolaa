import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../../lib/motion'
import './FoundingSection.css'

/** Extra scroll the fold holds for, as a fraction of the viewport. This is the
 *  "slow down and read it" dial: the section parks on screen for this much
 *  additional scrolling before the page moves on. Every other major fold is
 *  pinned; this one wasn't, which is why it read too fast. */
const FOUNDING_HOLD_VH = 0.9

/* ——— Auto-playing image deal (madewithgsap tutorial 036 layout) ———
 * Reference look: near-black ground, small eyebrow, one large centred
 * statement with certain words underlined, and photos flicking over the type.
 * The tutorial fires on word hover; here it plays on its own, so the section
 * performs without the reader having to find the trigger words. */

/* Pool size matters: a card is recycled once its turn comes round again, so the
   pool must be larger than the number on screen at once (see below) or a card
   still fading would get yanked back to a new position. */
const DEAL_IMAGES = [
  '/assets/portfolio-hira.jpg',
  '/assets/portfolio-fragrance-01.jpg',
  '/assets/portfolio-beauty-01.jpg',
  '/assets/portfolio-kitchen-01.jpg',
  '/assets/portfolio-fragrance-02.jpg',
  '/assets/portfolio-kitchen-02.jpg',
  '/assets/founding-product-studio.jpg',
  '/assets/founding-ops-fulfillment.jpg',
  '/assets/founding-team-office.jpg',
  '/assets/founding-hero.jpg',
] as const

/* Cards on screen at once ≈ lifetime / interval, where lifetime is
   HOLD + the 0.4s fade. At 150ms / 0.6s that's ~6-7 of a 10-card pool — a
   visible stack while the cursor moves, with headroom before recycling bites. */

/** Minimum gap between cards (ms) while the cursor is over a word. */
const DEAL_INTERVAL_MS = 150
/** Cursor travel required before the next card (px) — stops a resting pointer
 *  from spraying cards on its own micro-jitter. */
const DEAL_MIN_TRAVEL = 20
/** How long each card stays at full opacity before it fades. */
const DEAL_HOLD = 0.6

/**
 * About / founding — near-black ground, small eyebrow, one large centred
 * statement with the key words underlined, and brand photos dealing themselves
 * over the type on a loop. Layout follows madewithgsap tutorial 036.
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

  /* ——— Deal the cards on word hover (tutorial 036) ———
   * Moving the cursor across an underlined word flicks the next image out at
   * the pointer with a random angle and offset, then fades it. Cards come from
   * a fixed recycled pool, so several stack up while you sweep and the DOM
   * count stays constant however fast you move.
   *
   * Listeners bind directly to the words here — unlike .founding__lede, this
   * statement is not in HomeAnimations' WORD_STAGGER_SELECTOR, so nothing
   * rebuilds its innerHTML out from under them.
   *
   * Gated to fine-pointer devices: on touch there is no hover, and firing on
   * tap would drop cards over the CTA the user is aiming for. */
  useEffect(() => {
    const section = sectionRef.current
    const medias = mediasRef.current
    if (!section || !medias) return

    const cards = Array.from(
      medias.querySelectorAll<HTMLImageElement>('.founding__card'),
    )
    if (!cards.length) return

    /* Reduced motion: one still card, so the layout doesn't read as a missing
       image, and no hover behaviour at all. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const first = cards[0]
      if (first) {
        gsap.set(first, {
          xPercent: -50,
          yPercent: -50,
          x: medias.clientWidth * 0.3,
          y: medias.clientHeight * 0.55,
          rotate: -6,
          autoAlpha: 1,
        })
      }
      return
    }
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const words = Array.from(
      section.querySelectorAll<HTMLElement>('.founding__mark-word'),
    )
    if (!words.length) return

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
        /* Tight offsets and a shallow angle: the reference stacks the cards
           almost on top of each other so the pile reads as a deck with edges
           peeking out. Wide scatter + steep rotation reads as confetti. */
        x: clientX - box.left + gsap.utils.random(-26, 26),
        y: clientY - box.top + gsap.utils.random(-22, 22),
        rotate: gsap.utils.random(-5, 5),
        xPercent: -50,
        yPercent: -50,
        zIndex: top,
        scale: 0.84,
        autoAlpha: 1,
      })
      gsap.to(card, { scale: 1, duration: 0.45, ease: 'power3.out' })
      gsap.to(card, {
        autoAlpha: 0,
        duration: 0.4,
        delay: DEAL_HOLD,
        ease: 'power2.out',
      })
    }

    const onMove = (e: PointerEvent) => deal(e.clientX, e.clientY)
    /* Reset travel gating on entry so the first move over a word always deals,
       rather than waiting out the distance from the previous one. */
    const onEnter = () => {
      primed = false
    }

    words.forEach((w) => {
      w.addEventListener('pointerenter', onEnter)
      w.addEventListener('pointermove', onMove)
    })

    return () => {
      words.forEach((w) => {
        w.removeEventListener('pointerenter', onEnter)
        w.removeEventListener('pointermove', onMove)
      })
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

      <div className="founding__stage" data-founding-reveal>
        <p className="founding__eyebrow">Founding</p>

        {/* One flowing statement, reference-style. Underlined words are set in
            markup here (not tagged at runtime) because this paragraph is not in
            HomeAnimations' WORD_STAGGER_SELECTOR — .founding__statement is a new
            class, so nothing rebuilds its innerHTML. */}
        {/* Keeps .founding__title so HomeAnimations' existing title reveal still
            finds it — renaming the class silently dropped that animation.
            Type comes from .founding__statement, which is later in the
            stylesheet and so wins at equal specificity. */}
        <h2 id="founding-title" className="founding__title founding__statement">
          It started with a question no one else was{' '}
          <span className="founding__mark-word">asking</span>. We turn emerging{' '}
          <span className="founding__mark-word">demand</span> into a system that
          launches <span className="founding__mark-word">brands</span> faster
          than traditional FMCG can{' '}
          <span className="founding__mark-word">move</span>.
        </h2>

        <div className="founding__actions">
          <Link className="hero__btn founding__cta" to="/story">
            Read Our Story →
          </Link>
        </div>
      </div>

      {/* Card pool for the auto deal. Decorative, so aria-hidden and no alt;
          a fixed pool that gets recycled rather than nodes created per tick. */}
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
