/**
 * Homepage scroll interactions — ported from prototype main.js.
 */
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../lib/motion'
import { getLenisInstance } from '../../lib/lenisInstance'
import { initLoop } from '../../lib/loopAnimations'
import { initVision } from '../../lib/visionAnimations'
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

const NAV_GLASS_Y = 40
const NAV_HIDE_Y = 72
const NAV_TOP_Y = 8

/** Scroll distance the hero wordmark's dock consumes, as a fraction of the
 *  viewport. The hero is pinned for exactly this span, so the page holds still
 *  while the mark travels — keep it short enough that the hold doesn't read as
 *  the page being stuck.
 *  Also gates the nav's scroll-down auto-hide (see syncNav): letting the bar
 *  tuck away mid-dock would yank the mark off screen half-way through. */
const DOCK_VH = 0.6
/** Lab's departure fade, in seconds. Self-playing rather than scrubbed — tune
 *  the feel here, not by widening a scroll range. */
const LAB_FADE_OUT = 0.6

const REVEAL_EASE = 'power2.out'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Parse metric copy like "$6M", "120+", "3x" into prefix / number / suffix. */
type ParsedMetric = {
  prefix: string
  value: number
  suffix: string
  decimals: number
}

function parseMetricDisplay(raw: string): ParsedMetric | null {
  const trimmed = raw.trim()
  const match = trimmed.match(/^([^0-9.-]*)(-?\d+(?:\.\d+)?)(.*)$/)
  if (!match) return null
  const [, prefix, numStr, suffix] = match
  const value = Number(numStr)
  if (!Number.isFinite(value)) return null
  const decimals = numStr.includes('.')
    ? (numStr.split('.')[1]?.length ?? 0)
    : 0
  return { prefix, value, suffix, decimals }
}

function formatMetricValue(n: number, decimals: number): string {
  if (decimals > 0) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }
  return Math.round(n).toLocaleString()
}

function formatMetricDisplay(parsed: ParsedMetric, n: number): string {
  return `${parsed.prefix}${formatMetricValue(n, parsed.decimals)}${parsed.suffix}`
}

type RevealOpts = {
  start?: string
  end?: string
  y?: number
  blur?: number
  duration?: number
  stagger?: number
  delay?: number
  /** Starting scale; animates to 1. Omit / pass 1 for no scale. */
  scale?: number
  scrub?: boolean | number
  toggleActions?: string
  ease?: string
}

/** Fade-up / optional scale+blur reveal on scroll enter — skipped when prefers-reduced-motion. */
function revealOnEnter(
  targets: gsap.TweenTarget,
  trigger: Element | string,
  opts: RevealOpts = {},
) {
  if (!targets || (Array.isArray(targets) && targets.length === 0)) return

  if (prefersReducedMotion()) {
    gsap.set(targets, { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)' })
    return
  }

  const {
    start = 'top 84%',
    end = 'top 48%',
    y = 28,
    blur = 6,
    duration = 0.85,
    stagger = 0.09,
    delay = 0,
    scale = 1,
    scrub = false,
    toggleActions = 'play none none reverse',
    ease = REVEAL_EASE,
  } = opts

  const from: gsap.TweenVars = {
    autoAlpha: 0,
    y,
    filter: blur > 0 ? `blur(${blur}px)` : 'blur(0px)',
  }
  if (scale !== 1) from.scale = scale

  const to: gsap.TweenVars = {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    duration,
    ease,
    stagger,
    delay,
  }

  if (scrub) {
    gsap.fromTo(targets, from, {
      ...to,
      ease: 'none',
      scrollTrigger: { trigger, start, end, scrub },
    })
  } else {
    gsap.fromTo(targets, from, {
      ...to,
      scrollTrigger: { trigger, start, toggleActions },
    })
  }
}

/**
 * Same load as the hero headline: from fully hidden (0) → 100% opacity,
 * blur(8px) → sharp, y 32 → 0. Never settles at a partial opacity.
 */
function revealTitleLikeHero(
  targets: gsap.TweenTarget,
  trigger: Element | string,
  opts: { start?: string; delay?: number; stagger?: number } = {},
) {
  if (!targets || (Array.isArray(targets) && targets.length === 0)) return

  if (prefersReducedMotion()) {
    gsap.set(targets, { autoAlpha: 1, y: 0, filter: 'blur(0px)' })
    return
  }

  const { start = 'top 84%', delay = 0, stagger = 0.11 } = opts

  gsap.from(targets, {
    autoAlpha: 0,
    y: 32,
    filter: 'blur(8px)',
    duration: 1.05,
    stagger,
    ease: REVEAL_EASE,
    delay,
    scrollTrigger: {
      trigger,
      start,
      /* Play once — reverse left titles stuck at opacity 0 and looked “broken”. */
      toggleActions: 'play none none none',
      once: true,
    },
  })
}

function mixArrowColor(t: number) {
  const r = gsap.utils.interpolate(255, 10, t)
  const g = gsap.utils.interpolate(255, 48, t)
  const b = gsap.utils.interpolate(255, 56, t)
  const a = gsap.utils.interpolate(1, 0.22, t)
  return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a.toFixed(2)})`
}

/**
 * Manual SplitText(type: "words") — Club plugin not installed (same approach
 * as the preloader avoiding SplitText). Skips nodes already split.
 */
function splitTextWords(el: Element): HTMLElement[] {
  const existing = el.querySelectorAll<HTMLElement>('.word-split__word')
  if (existing.length > 0) return Array.from(existing)

  const text = el.textContent ?? ''
  const trimmed = text.trim()
  if (!trimmed) return []

  el.setAttribute('aria-label', trimmed)
  el.textContent = ''
  el.classList.add('word-split')

  const words: HTMLElement[] = []
  text.split(/(\s+)/).forEach((token) => {
    if (!token) return
    if (/^\s+$/.test(token)) {
      el.appendChild(document.createTextNode(token))
      return
    }
    const span = document.createElement('span')
    span.className = 'word-split__word'
    span.textContent = token
    el.appendChild(span)
    words.push(span)
  })
  return words
}

/** Homepage body / lede / subtext / paragraphs — hero lede word stagger.
 * Footer copy is excluded: SiteFooter owns its own content fade, and
 * gsap.from opacity:0 here stayed stuck inside the pinned circle stage. */
const WORD_STAGGER_SELECTOR = [
  '.hero__lede',
  '.section-head__sub',
  '.meola-lab__sub',
  '.meola-lab__desc',
  '.founding__sub',
  '.founding__lede',
  '.press-card__excerpt',
  '.brand-tile__desc',
].join(', ')

/**
 * SplitText-equivalent word stagger on scroll enter (once).
 * Vision copy uses its own reveal timeline.
 */
function revealWordsOnEnter(
  root: ParentNode = document,
  opts: { start?: string; delay?: number } = {},
) {
  const { start = 'top 88%', delay = 0 } = opts
  const paragraphs = gsap.utils.toArray<Element>(
    (root as Document | Element).querySelectorAll(WORD_STAGGER_SELECTOR),
  )

  paragraphs.forEach((paragraph) => {
    /* Never compose with vision's dedicated reveal. */
    if (
      paragraph.hasAttribute('data-vision-line') ||
      paragraph.closest('.vision__copy')
    ) {
      return
    }

    if (prefersReducedMotion()) {
      /* Leave plain text — no wrap, full opacity. */
      return
    }

    const words = splitTextWords(paragraph)
    if (!words.length) return

    gsap.from(words, {
      opacity: 0,
      y: 15,
      stagger: 0.06,
      duration: 0.5,
      ease: 'power2.out',
      delay,
      scrollTrigger: {
        trigger: paragraph,
        start,
        once: true,
      },
    })
  })
}

export function HomeAnimations() {
  useEffect(() => {
    let cancelled = false
    let ctx: ReturnType<typeof gsap.context> | null = null
    let lenisPollId = 0
    let cleanupNav: (() => void) | null = null

    const boot = () => {
      if (cancelled) return

      /* ——— Nav glass + direction hide (Lenis-synced) ——— */
      const siteNav = document.querySelector('.site-nav')
      let lastY = window.scrollY
      let unsubLenis: (() => void) | null = null
      let navPollId = 0
      let usingWindowScroll = false
      /* When the hero dock ScrollTrigger exists it owns `.is-scrolled` (logo
       * color + glass). scrollY thresholds alone fire too early under pin. */
      let dockOwnsScrolled = false

      const syncNav = (y: number, direction: 1 | -1 | 0) => {
        if (!siteNav) return
        if (!dockOwnsScrolled) {
          siteNav.classList.toggle('is-scrolled', y > NAV_GLASS_Y)
        }

        if (y <= NAV_TOP_Y) {
          siteNav.classList.remove('is-hidden')
          lastY = y
          return
        }

        const dir = direction !== 0 ? direction : y > lastY ? 1 : y < lastY ? -1 : 0
        /* Hold the bar open until the wordmark has finished docking into it —
         * the mark rides the nav's transform, so hiding early would drag it
         * off screen mid-flight. */
        const hideFloor = Math.max(NAV_HIDE_Y, window.innerHeight * DOCK_VH)
        if (dir === 1 && y > hideFloor) {
          siteNav.classList.add('is-hidden')
        } else if (dir === -1) {
          siteNav.classList.remove('is-hidden')
        }
        lastY = y
      }

      const onLenisScroll = (lenis: Lenis) => {
        syncNav(lenis.scroll, lenis.direction)
      }

      const onWindowScroll = () => {
        const delta = window.scrollY - lastY
        const direction: 1 | -1 | 0 = delta > 0 ? 1 : delta < 0 ? -1 : 0
        syncNav(window.scrollY, direction)
      }

      const attachNavScroll = () => {
        const lenis = getLenisInstance()
        if (lenis) {
          unsubLenis = lenis.on('scroll', onLenisScroll)
          syncNav(lenis.scroll, lenis.direction)
          return true
        }
        return false
      }

      if (!attachNavScroll()) {
        let tries = 0
        navPollId = window.setInterval(() => {
          tries += 1
          if (attachNavScroll() || tries > 40) {
            window.clearInterval(navPollId)
            navPollId = 0
            if (!unsubLenis) {
              usingWindowScroll = true
              syncNav(window.scrollY, 0)
              window.addEventListener('scroll', onWindowScroll, { passive: true })
            }
          }
        }, 16)
      }

      cleanupNav = () => {
        if (navPollId) window.clearInterval(navPollId)
        unsubLenis?.()
        if (usingWindowScroll) {
          window.removeEventListener('scroll', onWindowScroll)
        }
        siteNav?.classList.remove('is-hidden', 'is-scrolled')
      }

    ctx = gsap.context(() => {
      const arrow = document.getElementById('arrow')
      const arrowFloat = arrow?.querySelector('.arrow__float') as HTMLElement | null
      const arrowShape = arrow?.querySelector('.arrow__shape') as HTMLElement | null
      const hero = document.querySelector('[data-section="hero"]')
      const vision = document.querySelector('[data-section="vision"]')
      const loopSection = document.querySelector('[data-section="loop"]')
      const lab = document.querySelector('[data-section="lab"]')
      const labArrowSlot = document.querySelector('[data-lab-arrow-slot]')
      const founding = document.querySelector('[data-section="founding"]')
      const portfolio = document.querySelector('[data-section="brands"]')
      const investors = document.querySelector('[data-section="investors"]')
      const press = document.querySelector('[data-section="press"]')
      const reduceMotion = prefersReducedMotion()


      /* ——— Hero: headline + CTAs settle on load; lede uses word stagger ——— */
      if (hero && !reduceMotion) {
        const headlineSpans = gsap.utils.toArray<Element>(
          hero.querySelectorAll('.hero__headline span'),
        )
        const actions = hero.querySelector('.hero__actions')
        gsap.from([...headlineSpans, actions].filter(Boolean), {
          autoAlpha: 0,
          y: 32,
          filter: 'blur(8px)',
          duration: 1.05,
          stagger: 0.11,
          ease: REVEAL_EASE,
          delay: 0.2,
        })
      }

      /* ——— Hero prism fades as the fold leaves ———
       * The wordmark used to morph from the middle of this fold into the nav,
       * and all of the raster/scale machinery here existed to serve that. The
       * mark is now plain nav furniture sized in CSS (.site-nav__logo-img), so
       * none of it is needed — and a one-shot JS scale would have gone stale
       * anyway, since the mark's CSS width changes at the 900px breakpoint. */
      const heroPrism = document.querySelector(
        '[data-hero-prism]',
      ) as HTMLElement | null
      if (heroPrism && !reduceMotion) {
        gsap.to(heroPrism, {
          opacity: 0,
          y: -12,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: () => `+=${window.innerHeight * DOCK_VH * 0.4}`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        })
      }

      const ARROW_WHITE = '#ffffff'
      const ARROW_GREEN = 'rgba(10, 48, 56, 0.22)'

      function labSlotCenter() {
        if (!labArrowSlot) return { x: 120, y: window.innerHeight * 0.55 }
        const rect = labArrowSlot.getBoundingClientRect()
        return {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.55,
        }
      }

      function heroArrowPoint() {
        return {
          x: window.innerWidth * 0.5,
          y: window.innerHeight * 0.44,
        }
      }

      function visionArrowPoint() {
        const copy = document.querySelector('.vision__copy')
        if (!copy) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 }
        const rect = copy.getBoundingClientRect()
        return {
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.5,
        }
      }

      function loopArrowPoint() {
        const diagram = loopSection?.querySelector('.loop__ribbon')
        if (diagram) {
          const rect = diagram.getBoundingClientRect()
          return {
            x: rect.left + rect.width * 0.5,
            y: rect.top + rect.height * 0.5,
          }
        }
        if (!loopSection) return { x: window.innerWidth * 0.48, y: window.innerHeight * 0.42 }
        const rect = loopSection.getBoundingClientRect()
        return {
          x: rect.left + rect.width * 0.48,
          y: rect.top + rect.height * 0.42,
        }
      }

      /* ——— Arrow motif ——— */
      if (arrow && arrowFloat && arrowShape && hero && vision && loopSection && lab) {
        gsap.set(arrow, {
          left: '50%',
          top: '44%',
          xPercent: -50,
          yPercent: -50,
          rotation: 0,
          scale: 1,
          opacity: 1,
          visibility: 'visible',
        })
        gsap.set(arrowShape, { backgroundColor: ARROW_WHITE })

        gsap.to(arrowFloat, {
          y: 10,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })

        const setArrowAt = (x: number, y: number, rotation = 0) => {
          gsap.set(arrow, {
            left: x,
            top: y,
            xPercent: -50,
            yPercent: -50,
            rotation,
            scale: 1,
            opacity: 1,
            visibility: 'visible',
          })
        }

        const resetHeroArrow = () => {
          const p = heroArrowPoint()
          setArrowAt(p.x, p.y, 0)
          gsap.set(arrowShape, { backgroundColor: ARROW_WHITE })
          gsap.set(arrowFloat, { y: 0 })
        }

        ScrollTrigger.create({
          trigger: hero,
          start: 'top top',
          endTrigger: vision,
          end: 'top top',
          scrub: true,
          onUpdate: (self: ST) => {
            gsap.set(arrowFloat, { y: 0 })
            const p = self.progress
            const from = heroArrowPoint()
            const to = visionArrowPoint()
            setArrowAt(
              gsap.utils.interpolate(from.x, to.x, p),
              gsap.utils.interpolate(from.y, to.y, p),
              gsap.utils.interpolate(0, 18, p),
            )
            const colorP = gsap.utils.clamp(0, 1, (p - 0.2) / 0.8)
            gsap.set(arrowShape, { backgroundColor: mixArrowColor(colorP) })
          },
          onLeaveBack: resetHeroArrow,
        })

        /* Match vision pin travel so arrow holds while video expands. */
        ScrollTrigger.create({
          trigger: vision,
          start: 'top top',
          end: '+=140%',
          scrub: true,
          onUpdate: () => {
            gsap.set(arrowFloat, { y: 0 })
            const p = visionArrowPoint()
            setArrowAt(p.x, p.y, 18)
            gsap.set(arrowShape, { backgroundColor: ARROW_GREEN })
          },
        })

        ScrollTrigger.create({
          trigger: vision,
          start: '+=140% top',
          endTrigger: lab,
          end: 'top center',
          scrub: true,
          onUpdate: (self: ST) => {
            gsap.set(arrowFloat, { y: 0 })
            const p = self.progress
            const from = visionArrowPoint()
            const mid = loopArrowPoint()
            const to = labSlotCenter()
            let x: number
            let y: number
            let rot: number
            if (p < 0.45) {
              const t = p / 0.45
              x = gsap.utils.interpolate(from.x, mid.x, t)
              y = gsap.utils.interpolate(from.y, mid.y, t)
              rot = gsap.utils.interpolate(18, 28, t)
            } else {
              const t = (p - 0.45) / 0.55
              x = gsap.utils.interpolate(mid.x, to.x, t)
              y = gsap.utils.interpolate(mid.y, to.y, t)
              rot = gsap.utils.interpolate(28, 0, t)
            }
            setArrowAt(x, y, rot)
            gsap.set(arrowShape, { backgroundColor: ARROW_GREEN })
          },
        })
      }

      /* ——— Vision: video above copy in-fold → pin + scrub full-bleed expand ——— */
      if (vision) {
        initVision()
      }

      /* ——— The Loop: pin + path draw + camera zoom (Build → Run → Signal) ——— */
      initLoop()

      /* ——— Lab: intro — title like hero; sub/desc via word stagger ——— */
      if (lab) {
        const labTitleBits = gsap.utils.toArray<Element>(
          lab.querySelectorAll(
            '.meola-lab__eyebrow, .meola-lab__mark, .meola-lab__headline',
          ),
        )
        revealTitleLikeHero(labTitleBits, lab, { start: 'top 88%' })

        /* ——— Lab fades out as it hands over to Founding ———
         * Deliberately NOT scrubbed: crossing the start point fires the tween
         * and it plays out on its own clock, so the fade doesn't feel welded to
         * the scrollbar (scrubbing made it read as "dragging" the opacity).
         * Linear ease, so the dissolve is even end to end.
         * Reverses on the way back up, matching revealOnEnter's convention.
         *
         * Targets the two column containers, NOT the section — .meola-lab's
         * white ground has to stay put, or the fade would expose the black body
         * between two sections that are white and Planet Blue.
         *
         * Pin travel lives in LabSection (~3.6vh); `bottom` is the pin-spacer
         * end, so this fires on release into Founding — not mid-scrub. */
        const labColumns = gsap.utils.toArray<Element>(
          lab.querySelectorAll('.meola-lab__intro, .meola-lab__panels'),
        )
        if (labColumns.length && !reduceMotion) {
          gsap.to(labColumns, {
            opacity: 0,
            duration: LAB_FADE_OUT,
            ease: 'none',
            scrollTrigger: {
              trigger: lab,
              start: 'bottom 85%',
              toggleActions: 'play none none reverse',
            },
          })
        }
      }

      /* ——— Founding / About (layered hero) ———
       * No pin — full-bleed CSS height. Enter: logo mark, photo, title, caption. */
      if (founding) {
        const revealRoot =
          founding.querySelector('[data-founding-reveal]') || founding

        const wordmark = founding.querySelector('.founding__mark')
        if (wordmark) {
          if (reduceMotion) {
            gsap.set(wordmark, { opacity: 1, clearProps: 'filter' })
          } else {
            gsap.fromTo(
              wordmark,
              { opacity: 0, filter: 'blur(6px)' },
              {
                opacity: 1,
                filter: 'blur(0px)',
                duration: 1.0,
                ease: 'sine.out',
                scrollTrigger: {
                  trigger: founding,
                  start: 'top 85%',
                  /* Once in — stay. Reverse on leave-back was wiping people
                     when scrolling back up from the footer. */
                  toggleActions: 'play none none none',
                  once: true,
                },
              },
            )
          }
        }

        const photos = gsap.utils.toArray<HTMLElement>(
          founding.querySelectorAll('[data-founding-photo]'),
        )
        if (photos.length) {
          if (reduceMotion) {
            gsap.set(photos, { opacity: 1, y: 0, clearProps: 'filter' })
          } else {
            gsap.fromTo(
              photos,
              { opacity: 0, y: 20, filter: 'blur(4px)' },
              {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.9,
                ease: 'sine.out',
                scrollTrigger: {
                  trigger: revealRoot,
                  start: 'top 82%',
                  toggleActions: 'play none none none',
                  once: true,
                },
              },
            )
          }
        }

        const titleInners = gsap.utils.toArray<HTMLElement>(
          founding.querySelectorAll('.founding__title-inner'),
        )
        revealTitleLikeHero(
          titleInners.length
            ? titleInners
            : founding.querySelectorAll('.founding__title'),
          founding.querySelector('.founding__title') || revealRoot,
          { start: 'top 92%' },
        )

        const captionBits = gsap.utils.toArray<Element>(
          founding.querySelectorAll('.founding__eyebrow, .founding__panel'),
        )
        revealTitleLikeHero(captionBits, revealRoot, {
          start: 'top 88%',
          stagger: 0.1,
        })
        /* founding__sub + founding__lede → word stagger (same as hero lede) */
      }

      /* ——— Portfolio title + filters + bento tiles ——— */
      const portfolioTitleEl = document.querySelector(
        '.brands .portfolio-title .section-head__title, .portfolio-title .section-head__title, .portfolio-title h2',
      )
      const portfolioTitleSection = document.querySelector(
        '.brands .portfolio-title, .portfolio-title',
      )
      if (portfolioTitleEl && portfolioTitleSection) {
        const portfolioTrigger =
          portfolioTitleSection.closest('.brands') ?? portfolioTitleSection
        revealTitleLikeHero(portfolioTitleEl, portfolioTrigger, {
          start: 'top 82%',
        })

        const portfolioIntroBits = gsap.utils.toArray<Element>(
          portfolioTitleSection.querySelectorAll(
            '.section-head__eyebrow, .brand-filters',
          ),
        )
        revealTitleLikeHero(portfolioIntroBits, portfolioTrigger, {
          start: 'top 82%',
          stagger: 0.08,
        })
      }

      /* Bento tiles: staggered opacity + y lift + soft scale (no blur — cleaner on photos). */
      if (portfolio && !reduceMotion) {
        const brandTiles = gsap.utils.toArray<Element>(
          portfolio.querySelectorAll('.brand-tile'),
        )
        if (brandTiles.length) {
          revealOnEnter(brandTiles, portfolio, {
            start: 'top 82%',
            y: 28,
            blur: 0,
            scale: 0.97,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power2.out',
          })
        }
      } else if (portfolio && reduceMotion) {
        gsap.set(portfolio.querySelectorAll('.brand-tile'), {
          autoAlpha: 1,
          y: 0,
          scale: 1,
        })
      }

      /* ——— Metrics ———
       * Stair clip reveal → continuous settle to equal band (no mid hold).
       * Glitch sources we avoid:
       *  - Overlapping stair + settle tweens on the same clipPath (overwrite jumps)
       *  - Separate ScrollTriggers fighting the same section (75% vs 70%)
       *  - String clipPath mid-overwrite; use a numeric proxy per bar instead
       * prefers-reduced-motion: skip stairs; show final equal band immediately. */
      const metricBlocks = gsap.utils.toArray<HTMLElement>('[data-metric]')
      if (metricBlocks.length) {
        const metricStrong = metricBlocks
          .map((m) => m.querySelector('strong'))
          .filter((el): el is HTMLElement => el instanceof HTMLElement)
        const metricSpans = metricBlocks
          .map((m) => m.querySelector('span'))
          .filter((el): el is HTMLElement => el instanceof HTMLElement)

        const parsedMetrics = metricStrong
          .map((el) => {
            const parsed = parseMetricDisplay(el.textContent ?? '')
            return parsed ? { el, parsed } : null
          })
          .filter(
            (entry): entry is { el: HTMLElement; parsed: ParsedMetric } =>
              entry !== null,
          )

        /* Interim stair peaks — last step < 100 so every bar still has settle
         * travel (avoids a completed stair silhouette that then snaps equal). */
        const STAIR_VISIBLE_PCT = [36, 54, 72, 88] as const
        const stairTops = metricBlocks.map((_, i) => {
          const visible =
            STAIR_VISIBLE_PCT[i] ??
            STAIR_VISIBLE_PCT[STAIR_VISIBLE_PCT.length - 1]
          return 100 - visible
        })

        const applyClip = (el: HTMLElement, topPct: number) => {
          el.style.clipPath = `inset(${topPct}% 0 0 0)`
        }

        if (reduceMotion) {
          metricBlocks.forEach((block) => applyClip(block, 0))
          gsap.set(metricBlocks, { autoAlpha: 1 })
          /* Final numbers already in the DOM — leave them as-is. */
        } else {
          /* Continuous per-bar motion: rise through stair into equal settle.
           * Hitch we kill: power2.out into the mid keyframe zeros velocity so the
           * stair silhouette "sticks", then settle feels like a second phase.
           * Settle starts at 42% with power1.in through the join so bars never
           * park on the stair before equalize. */
          const stairStagger = 0.07
          const barDuration = 1.2
          /* Settle blends from ~42% — stair never fully "lands" before equalize. */
          const stairPortion = 0.42

          const clipProxies = metricBlocks.map(() => ({ top: 100 }))
          metricBlocks.forEach((block) => applyClip(block, 100))
          gsap.set([...metricStrong, ...metricSpans], { autoAlpha: 0, y: 16 })

          const metricTl = gsap.timeline({
            defaults: { overwrite: 'auto' },
            scrollTrigger: {
              trigger: "[data-section='metrics']",
              start: 'top 72%',
              toggleActions: 'play none none reverse',
              invalidateOnRefresh: true,
            },
          })

          metricBlocks.forEach((block, i) => {
            const fromEnd = metricBlocks.length - 1 - i
            const proxy = clipProxies[i]
            const stairPct = `${stairPortion * 100}%`
            /* power1.in carries speed through the stair join; power2.out lands. */
            metricTl.to(
              proxy,
              {
                duration: barDuration,
                keyframes: {
                  '0%': { top: 100 },
                  [stairPct]: { top: stairTops[i], ease: 'power1.in' },
                  '100%': { top: 0, ease: 'power2.out' },
                },
                onUpdate: () => applyClip(block, proxy.top),
              },
              fromEnd * stairStagger,
            )
          })

          /* Copy rides the same timeline as the bars (one trigger, one reverse). */
          metricTl.to(
            metricStrong,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
              stagger: { each: 0.1, from: 'end' },
              ease: REVEAL_EASE,
            },
            stairStagger * 0.5,
          )
          metricTl.to(
            metricSpans,
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: { each: 0.1, from: 'end' },
              ease: REVEAL_EASE,
            },
            stairStagger * 0.5 + 0.08,
          )

          /* Count-up: once, timed with the shared enter point. */
          const countStagger = 0.13
          const countFromEnd = parsedMetrics.length - 1
          parsedMetrics.forEach(({ el, parsed }, i) => {
            el.textContent = formatMetricDisplay(parsed, 0)
            const obj = { val: 0 }
            gsap.to(obj, {
              val: parsed.value,
              duration: 1.85,
              ease: 'power2.out',
              delay: (countFromEnd - i) * countStagger + 0.2,
              onUpdate: () => {
                el.textContent = formatMetricDisplay(parsed, obj.val)
              },
              scrollTrigger: {
                trigger: "[data-section='metrics']",
                start: 'top 72%',
                once: true,
              },
            })
          })
        }
      }

      /* ——— Metrics header ——— */
      const metricsSection = document.querySelector('[data-section="metrics"]')
      if (metricsSection) {
        const metricsHead = gsap.utils.toArray<Element>(
          metricsSection.querySelectorAll(
            '.section-head__eyebrow, .section-head__title',
          ),
        )
        revealTitleLikeHero(metricsHead, metricsSection, { start: 'top 82%' })
      }

      /* ——— Investors ——— */
      if (investors) {
        const investorHead = gsap.utils.toArray<Element>(
          investors.querySelectorAll(
            '.section-head__eyebrow, .section-head__title',
          ),
        )
        revealTitleLikeHero(investorHead, investors, { start: 'top 85%' })

        const investorCta = investors.querySelector('.btn-ghost')
        if (investorCta) {
          revealTitleLikeHero(investorCta, investors, {
            start: 'top 85%',
            delay: 0.15,
          })
        }

        /* Reveal the marquee as one unit — per-item transforms fight CSS translateX */
        const investorLogos = investors.querySelector('.investor-logos')
        if (investorLogos) {
          revealOnEnter(investorLogos, investors, {
            start: 'top 78%',
            y: 20,
            blur: 0,
            duration: 0.7,
            delay: 0.08,
          })
        }
      }

      /* ——— Press ——— */
      if (press) {
        const pressHead = gsap.utils.toArray<Element>(
          press.querySelectorAll(
            '.press-feed__head .section-head__eyebrow, .press-feed__title, .btn-ghost-dark',
          ),
        )
        revealTitleLikeHero(pressHead, press, { start: 'top 86%' })

        const pressCards = gsap.utils.toArray<Element>(
          press.querySelectorAll('.press-card'),
        )
        revealOnEnter(pressCards, press, {
          start: 'top 80%',
          y: 32,
          blur: 4,
          stagger: 0.1,
          duration: 0.8,
        })
      }

      /* ——— Word stagger: all homepage subtexts / paragraphs (hero lede pattern) ——— */
      revealWordsOnEnter(document, { start: 'top 88%' })

      const refreshAll = () => {
        ScrollTrigger.sort()
        ScrollTrigger.refresh()
      }
      requestAnimationFrame(refreshAll)
      /* Fonts + late images shift pin distances — refresh once more after settle. */
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => requestAnimationFrame(refreshAll)).catch(() => {})
      }
      window.addEventListener('load', refreshAll, { once: true })
    })
    }

    // Wait for Lenis (SmoothScroll parent effect) so StrictMode remounts get a
    // fresh ScrollTrigger pass tied to the live scroller — avoids dead triggers.
    const tryBoot = () => {
      if (cancelled) return
      if (getLenisInstance()) {
        boot()
        return
      }
      lenisPollId = window.setTimeout(tryBoot, 16)
    }
    tryBoot()

    return () => {
      cancelled = true
      if (lenisPollId) window.clearTimeout(lenisPollId)
      cleanupNav?.()
      ctx?.revert()
    }
  }, [])

  return null
}
