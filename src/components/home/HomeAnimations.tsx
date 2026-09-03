/**
 * Homepage scroll interactions — ported from prototype main.js.
 */
import { useEffect } from 'react'
import { gsap } from '../../lib/motion'
import { getLenisInstance, refreshScrollAndLenis } from '../../lib/lenisInstance'
import { initLoop } from '../../lib/loopAnimations'
import { initVision } from '../../lib/visionAnimations'
import { initPress } from '../../lib/pressAnimations'
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
  '.brand-hero__desc',
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
      paragraph.closest('.vision__copy') ||
      paragraph.closest('[data-section="press"]')
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
      const hero = document.querySelector('[data-section="hero"]')
      let lastY = window.scrollY
      let unsubLenis: (() => void) | null = null
      let navPollId = 0
      let usingWindowScroll = false
      /* When the hero dock ScrollTrigger exists it owns `.is-scrolled` (logo
       * color + glass). scrollY thresholds alone fire too early under pin. */
      let dockOwnsScrolled = false

      /* The Prism scene (Scene.jsx) pins [data-section="hero"] for its own
       * beam-reveal timeline — total scroll the hero consumes is now its own
       * height plus that pin's extra distance, not a fixed handful of
       * pixels. NAV_GLASS_Y alone flipped `.is-scrolled` (and so the nav's
       * ink colour) within the first 40px of scroll, while the hero — still
       * fully in view, dark, mid-pin — sat there for hundreds more: the nav
       * read as flipping over its own dark background. Read the pin-spacer
       * GSAP inserts for the hero (its height *is* that total scroll span)
       * so the threshold tracks the pin instead of guessing a constant.
       * Polled briefly since the spacer is created by a different
       * component's effect and may not exist on the very first tick. */
      let heroSpanPx = 0
      let heroNaturalPx = 0
      const measureHeroSpan = () => {
        if (!hero) return
        heroNaturalPx = (hero as HTMLElement).offsetHeight
        const spacer = hero.closest('.pin-spacer') as HTMLElement | null
        heroSpanPx = spacer ? spacer.offsetHeight : heroNaturalPx
      }
      /* Scene.jsx's reveal timeline finishes at label time 0.9 of a 2.1-long
       * timeline (0.9 + a 1.2 hold) — keep this ratio in sync with that
       * file. Used below to hide the nav (not flip its colour — it's still
       * over the same dark hero) once the reveal is actually done and the
       * user keeps scrolling through the hold, rather than making them
       * scroll all the way to the pin's release first. */
      const REVEAL_COMPLETE_FRACTION = 0.9 / 2.1
      measureHeroSpan()
      let heroSpanPollId = 0
      if (hero) {
        let tries = 0
        heroSpanPollId = window.setInterval(() => {
          tries += 1
          measureHeroSpan()
          if (heroSpanPx > window.innerHeight || tries > 40) {
            window.clearInterval(heroSpanPollId)
            heroSpanPollId = 0
          }
        }, 100)
      }
      const onHeroResize = () => measureHeroSpan()
      window.addEventListener('resize', onHeroResize)
      /* Cumulative upward distance since the last downward tick — the bar
         only reappears once this clears NAV_REAPPEAR_DELTA, instead of on
         the very first upward pixel. Was popping back in instantly on any
         upward wobble, which read as no delay at all. */
      let upAccum = 0
      const NAV_REAPPEAR_DELTA = 120

      const syncNav = (y: number, direction: 1 | -1 | 0) => {
        if (!siteNav) return
        if (!dockOwnsScrolled) {
          /* No hero: Vision (ecru) is the first fold — keep dark-on-light
           * nav from y=0 so ecru type never sits on ecru. With a hero,
           * stay in the "over dark" (not-scrolled) state for its entire
           * pinned span, not just the first NAV_GLASS_Y px — the ink
           * should only flip once the hero has actually scrolled away and
           * the next (light) fold is what's really behind the nav. */
          const glassThreshold = hero ? Math.max(NAV_GLASS_Y, heroSpanPx) : NAV_GLASS_Y
          siteNav.classList.toggle('is-scrolled', !hero || y > glassThreshold)
        }

        if (y <= NAV_TOP_Y) {
          siteNav.classList.remove('is-hidden')
          upAccum = 0
          lastY = y
          return
        }

        const dir = direction !== 0 ? direction : y > lastY ? 1 : y < lastY ? -1 : 0
        /* Hold the bar open until the Prism reveal itself has actually
         * finished (not the whole pin, which keeps going through the hold
         * for a beat afterwards) — once the user scrolls past that point
         * the nav tucks away, rather than staying pinned on screen for the
         * entire hold too. */
        const heroRevealDonePx =
          heroNaturalPx + (heroSpanPx - heroNaturalPx) * REVEAL_COMPLETE_FRACTION
        const hideFloor = hero
          ? Math.max(NAV_HIDE_Y, window.innerHeight * DOCK_VH, heroRevealDonePx)
          : NAV_HIDE_Y
        if (dir === 1 && y > hideFloor) {
          siteNav.classList.add('is-hidden')
          upAccum = 0
        } else if (dir === -1) {
          upAccum += lastY - y
          if (upAccum >= NAV_REAPPEAR_DELTA) {
            siteNav.classList.remove('is-hidden')
          }
        } else {
          upAccum = 0
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
        if (heroSpanPollId) window.clearInterval(heroSpanPollId)
        window.removeEventListener('resize', onHeroResize)
        unsubLenis?.()
        if (usingWindowScroll) {
          window.removeEventListener('scroll', onWindowScroll)
        }
        siteNav?.classList.remove('is-hidden', 'is-scrolled')
      }

    ctx = gsap.context(() => {
      const vision = document.querySelector('[data-section="vision"]')
      const loop = document.querySelector('[data-section="loop"]')
      const lab = document.querySelector('[data-section="lab"]')
      const founding = document.querySelector('[data-section="founding"]')
      const portfolio = document.querySelector('[data-section="brands"]')
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

      /* ——— Vision: video above copy in-fold → pin + scrub full-bleed expand ——— */
      if (vision) {
        initVision()
      }

      /* ——— The Loop: pin + path draw + camera zoom (Build → Run → Signal) ——— */
      initLoop()

      /* ——— Loop fades out as it hands over to Lab ———
       * Same treatment as Lab → Founding below: un-scrubbed (fires once the
       * scroll crosses the trigger point and plays out on its own clock, not
       * welded to the scrollbar), reverses on the way back up. Targets the
       * artboard (title/orbit/copy) and the particle canvas host, not the
       * section itself — `.loop`'s white ground stays put so the dissolve
       * doesn't expose whatever's behind it. */
      if (loop) {
        const loopLayers = gsap.utils.toArray<Element>(
          loop.querySelectorAll('.loop__artboard, .loop__particles'),
        )
        if (loopLayers.length && !reduceMotion) {
          gsap.to(loopLayers, {
            opacity: 0,
            duration: LAB_FADE_OUT,
            ease: 'none',
            scrollTrigger: {
              trigger: loop,
              start: 'bottom 85%',
              toggleActions: 'play none none reverse',
            },
          })
        }
      }

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

        /* .founding__statement uses Vision-style scroll-scrub char fill in
           FoundingSection — do not blur/fade the whole title over that. */
        const titleInners = gsap.utils.toArray<HTMLElement>(
          founding.querySelectorAll('.founding__title-inner'),
        )
        const foundingTitles = titleInners.length
          ? titleInners
          : gsap.utils
              .toArray<HTMLElement>(founding.querySelectorAll('.founding__title'))
              .filter((el) => !el.classList.contains('founding__statement'))
        if (foundingTitles.length) {
          revealTitleLikeHero(
            foundingTitles,
            founding.querySelector('.founding__title') || revealRoot,
            { start: 'top 92%' },
          )
        }

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
            '.section-head__eyebrow',
          ),
        )
        revealTitleLikeHero(portfolioIntroBits, portfolioTrigger, {
          start: 'top 82%',
          stagger: 0.08,
        })
      }

      /* HIRA hero tile: same rise-from-bottom treatment as the rows below it,
         triggered off its own position (not the whole section — same fix
         as the rows). */
      if (portfolio && !reduceMotion) {
        const heroTile = portfolio.querySelector('.brand-hero')
        if (heroTile) {
          gsap.fromTo(
            heroTile,
            { y: 90, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1.0,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: heroTile,
                start: 'top 92%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        }

        /* "Coming soon" rows: rise in from below, one at a time, stacking as
           each individually scrolls into view — a single group trigger
           (whether on the section or the row list) fires the instant that
           trigger element's own top crosses the line, which sits well
           above the lower rows, so the animation finished off-screen
           before they were visible on a normal scroll down. Each row now
           gets its own ScrollTrigger keyed to its own position, and the
           reveal is slower so it actually reads while scrolling instead of
           snapping in. */
        const brandRows = gsap.utils.toArray<Element>(
          portfolio.querySelectorAll('.brand-row'),
        )
        brandRows.forEach((rowEl) => {
          gsap.fromTo(
            rowEl,
            { y: 90, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1.0,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: rowEl,
                start: 'top 92%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        })
      } else if (portfolio && reduceMotion) {
        gsap.set(portfolio.querySelectorAll('.brand-hero, .brand-row'), {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
        })
      }

      /* ——— Metrics ———
       * Prototype match (prototype-tau-ebon): physical stair heights via --h-pct,
       * clip-path reveal bottom→top, stagger from end. Final state keeps stairs. */
      const metricBlocks = gsap.utils.toArray<HTMLElement>('[data-metric]')
      if (metricBlocks.length) {
        const metricStrong = metricBlocks
          .map((m) => m.querySelector('strong'))
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

        if (reduceMotion) {
          gsap.set(metricBlocks, { clipPath: 'inset(0% 0 0 0)', autoAlpha: 1 })
        } else {
          gsap.set(metricBlocks, { clipPath: 'inset(100% 0 0 0)' })
          gsap.to(metricBlocks, {
            clipPath: 'inset(0% 0 0 0)',
            /* Slower rise so each stair reads before the next starts. */
            duration: 1.35,
            ease: 'power2.out',
            stagger: { each: 0.32, from: 'end' },
            scrollTrigger: {
              trigger: "[data-section='metrics']",
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          })

          gsap.from(
            metricStrong,
            {
              autoAlpha: 0,
              y: 18,
              duration: 0.95,
              stagger: { each: 0.28, from: 'end' },
              ease: REVEAL_EASE,
              delay: 0.18,
              scrollTrigger: {
                trigger: "[data-section='metrics']",
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            },
          )

          const countStagger = 0.28
          const countFromEnd = parsedMetrics.length - 1
          parsedMetrics.forEach(({ el, parsed }, i) => {
            el.textContent = formatMetricDisplay(parsed, 0)
            const obj = { val: 0 }
            gsap.to(obj, {
              val: parsed.value,
              duration: 2.6,
              ease: 'power2.out',
              delay: (countFromEnd - i) * countStagger + 0.45,
              onUpdate: () => {
                el.textContent = formatMetricDisplay(parsed, obj.val)
              },
              scrollTrigger: {
                trigger: "[data-section='metrics']",
                start: 'top 75%',
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

      /* ——— Investors ticker — no enter reveal; logos paint immediately ——— */

      /* ——— Press: one-time entrance + drag carousel (no pin) ——— */
      if (press) {
        initPress()
      }

      /* ——— Word stagger: all homepage subtexts / paragraphs (hero lede pattern) ——— */
      revealWordsOnEnter(document, { start: 'top 88%' })

      const refreshAll = () => {
        refreshScrollAndLenis()
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
