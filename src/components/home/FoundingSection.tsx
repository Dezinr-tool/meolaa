import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../../lib/motion'
import './FoundingSection.css'

/** Extra scroll the fold holds for, as a fraction of the viewport. This is the
 *  "slow down and read it" dial: the section parks on screen for this much
 *  additional scrolling before the page moves on. Sized so the Vision-style
 *  per-char fill can scrub across the pin, then stickers still have room. */
const FOUNDING_HOLD_VH = 1.3

/** Faded (unfilled) char opacity — same language as Vision headline scrub. */
const FOUNDING_CHAR_DIM = 0.14

/** Hotspot near the pixel finger tip (72×72 display of trimmed hand art). */
const CURSOR_HOT_X = 11
const CURSOR_HOT_Y = 4

/**
 * Split statement text into per-char spans (Vision `splitVisionLines` pattern).
 * Preserves `.founding__mark-word` wrappers so yellow highlights + hover deal
 * still bind to the same elements.
 */
function splitFoundingStatement(root: HTMLElement) {
  if (root.querySelector('.founding__char')) return

  const plain = (root.textContent || '').replace(/\s+/g, ' ').trim()
  if (plain) root.setAttribute('aria-label', plain)

  const appendTokens = (parent: HTMLElement, text: string, wrapWords: boolean) => {
    text.split(/(\s+)/).forEach((token) => {
      if (!token) return
      if (/^\s+$/.test(token)) {
        const space = document.createElement('span')
        space.className = 'founding__char is-space'
        space.textContent = '\u00a0'
        space.setAttribute('aria-hidden', 'true')
        parent.appendChild(space)
        return
      }
      const host = wrapWords ? document.createElement('span') : parent
      if (wrapWords) {
        host.className = 'founding__word'
        host.setAttribute('aria-hidden', 'true')
      }
      ;[...token].forEach((char) => {
        const span = document.createElement('span')
        span.className = 'founding__char'
        span.textContent = char
        span.setAttribute('aria-hidden', 'true')
        host.appendChild(span)
      })
      if (wrapWords) parent.appendChild(host)
    })
  }

  const nodes = Array.from(root.childNodes)
  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (!text) {
        node.parentNode?.removeChild(node)
        return
      }
      const frag = document.createDocumentFragment()
      const holder = document.createElement('span')
      frag.appendChild(holder)
      appendTokens(holder, text, true)
      while (holder.firstChild) frag.appendChild(holder.firstChild)
      frag.removeChild(holder)
      node.parentNode?.replaceChild(frag, node)
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    if (el.classList.contains('founding__mark-word')) {
      const text = (el.textContent || '').trim()
      el.textContent = ''
      appendTokens(el, text, false)
    }
  })
}

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

/* Rendered pool is larger than the image list: at a 90ms interval and a ~0.75s
   lifetime about 8 cards are alive at once, so 10 nodes left almost no
   headroom and a card could be recycled mid-fade. Repeating the first few
   images gives 14 nodes — the same photo showing twice is invisible in
   practice because the two are at different positions and moments. */
const DEAL_POOL = [...DEAL_IMAGES, ...DEAL_IMAGES.slice(0, 4)]

/* Cards on screen at once ≈ lifetime / interval, where lifetime is
   IN + HOLD + OUT. These are balanced against the 10-card pool: at 90ms with a
   ~0.73s lifetime that's ~8 of 10, so a card is never recycled while still
   visible. Shortening the interval without shortening HOLD would overrun the
   pool and yank fading cards back to a new position. */

/** Minimum gap between cards (ms) while the cursor is over a word. */
const DEAL_INTERVAL_MS = 90
/** Cursor travel required before the next card (px) — stops a resting pointer
 *  from spraying cards on its own micro-jitter. */
const DEAL_MIN_TRAVEL = 16
/** Pop-in. */
const DEAL_IN = 0.28
/** How long each card stays at full opacity before it fades. */
const DEAL_HOLD = 0.45
/** Fade-out. */
const DEAL_OUT = 0.3

/**
 * About / founding — near-black ground, small eyebrow, one large centred
 * statement with the key words underlined, and brand photos dealing themselves
 * over the type on a loop. Layout follows madewithgsap tutorial 036.
 */
export function FoundingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const mediasRef = useRef<HTMLDivElement>(null)

  /* Pixel hand while the pointer is over this fold. CSS `cursor: url()` is
   * flaky on Chromium/macOS, so a fixed <img> follower + cursor:none is the
   * reliable path. Off on leave / touch. Does not apply on /story. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (coarse) return

    const cursorEl = document.createElement('img')
    cursorEl.src = '/story/cursor-hand.png'
    cursorEl.alt = ''
    cursorEl.className = 'founding-pixel-cursor'
    cursorEl.setAttribute('aria-hidden', 'true')
    cursorEl.draggable = false
    document.body.appendChild(cursorEl)

    let lastX = 0
    let lastY = 0
    let hasPoint = false

    const pointOverSection = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y)
      return !!(hit && section.contains(hit))
    }

    const show = (x: number, y: number) => {
      section.classList.add('is-founding-cursor')
      cursorEl.style.transform = `translate3d(${x - CURSOR_HOT_X}px, ${y - CURSOR_HOT_Y}px, 0)`
      cursorEl.classList.add('is-on')
    }

    const hide = () => {
      section.classList.remove('is-founding-cursor')
      cursorEl.classList.remove('is-on')
    }

    const sync = (x: number, y: number) => {
      if (pointOverSection(x, y)) show(x, y)
      else hide()
    }

    const onMove = (e: PointerEvent) => {
      lastX = e.clientX
      lastY = e.clientY
      hasPoint = true
      sync(lastX, lastY)
    }

    const onScroll = () => {
      if (hasPoint) sync(lastX, lastY)
    }

    const onLeaveDoc = () => hide()

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeaveDoc)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.removeEventListener('mouseleave', onLeaveDoc)
      section.classList.remove('is-founding-cursor')
      cursorEl.remove()
    }
  }, [])

  /* Vision-style per-char opacity fill scrubbed across the pin. Pin lives
   * here (not HomeAnimations) so document-order pin creation stays aligned
   * with Lab / Portfolio. Cursor follower is a separate effect — leave it
   * alone. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const statement = section.querySelector<HTMLElement>('.founding__statement')
    if (!statement) return

    splitFoundingStatement(statement)
    const chars = gsap.utils.toArray<HTMLElement>(
      statement.querySelectorAll('.founding__char'),
    )

    const fillTweenVars = {
      opacity: 1,
      duration: 0.08,
      stagger: 0.006,
      ease: 'power1.out',
    } as const

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reduceMotion) {
      gsap.set(chars, { opacity: 1 })
      return
    }

    gsap.set(chars, { opacity: FOUNDING_CHAR_DIM })

    const mm = gsap.matchMedia()

    /* Desktop: pin + scrub fill. */
    mm.add('(min-width: 901px)', () => {
      const holdDuration = 0.38
      const vtl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * FOUNDING_HOLD_VH)}`,
          pin: true,
          pinSpacing: true,
          scrub: true,
          /* No anticipatePin — with Lenis it overshoots and reads as a spring. */
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onLeaveBack: () => {
            gsap.set(chars, { opacity: FOUNDING_CHAR_DIM })
          },
          onRefresh: (self) => {
            if (self.progress === 0) {
              gsap.set(chars, { opacity: FOUNDING_CHAR_DIM })
            }
          },
        },
      })

      vtl.fromTo(
        chars,
        { opacity: FOUNDING_CHAR_DIM },
        { ...fillTweenVars },
        0,
      )
      vtl.to({}, { duration: holdDuration })

      return () => {
        vtl.scrollTrigger?.kill()
        vtl.kill()
      }
    })

    /* Mobile: no pin — scrub fill as the fold crosses the viewport. */
    mm.add('(max-width: 900px)', () => {
      const vtl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          end: 'top 22%',
          scrub: true,
          onLeaveBack: () => {
            gsap.set(chars, { opacity: FOUNDING_CHAR_DIM })
          },
        },
      })

      vtl.fromTo(
        chars,
        { opacity: FOUNDING_CHAR_DIM },
        { ...fillTweenVars },
        0,
      )
      vtl.to({}, { duration: 0.16 })

      return () => {
        vtl.scrollTrigger?.kill()
        vtl.kill()
      }
    })

    return () => {
      mm.revert()
      gsap.killTweensOf(chars)
      gsap.set(chars, { clearProps: 'opacity' })
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
      gsap.to(card, { scale: 1, duration: DEAL_IN, ease: 'power3.out' })
      gsap.to(card, {
        autoAlpha: 0,
        duration: DEAL_OUT,
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
          <span className="founding__mark-word" data-founding-mark="asking">
            asking
          </span>
          . We turn emerging{' '}
          <span className="founding__mark-word" data-founding-mark="demand">
            demand
          </span>{' '}
          into a system that launches{' '}
          <span className="founding__mark-word" data-founding-mark="brands">
            brands
          </span>{' '}
          faster than traditional FMCG can{' '}
          <span className="founding__mark-word" data-founding-mark="move">
            move
          </span>
          .
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
        {DEAL_POOL.map((src, i) => (
          <img
            key={`${src}-${i}`}
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
