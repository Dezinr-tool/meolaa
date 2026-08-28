/**
 * Homepage scroll interactions — ported from prototype main.js.
 */
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../lib/motion'
import { getLenisInstance } from '../../lib/lenisInstance'
import {
  LOOP_CAM_SCALE_VALUES,
  LOOP_END_TIP_HIDE,
  LOOP_ENTRY_VIEW_X,
  LOOP_PATH_LOWEST_ARTBOARD,
  LOOP_START_FOCUS,
  LOOP_STEPS,
  PATH_ENTRY,
  artboardToContainerFraction,
  loopCamEase,
  loopCamKeys,
  loopClampFocusY,
  loopCopyVisible,
  loopDrawProgress,
  loopEntryFocusY,
  loopFlushLeftFocus,
  loopFocusYCeil,
  loopFocusYFloor,
  loopRingVisible,
  loopStrokeEdgePx,
  mapPathPointToArtboard,
  resolveLoopDrawStart,
  samplePathTipLocal,
} from '../../lib/loopPath'
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

/* ——— The Loop ——— */
/** Pin travel — enough scroll for draw + three camera beats. */
const LOOP_PIN_VH_DESKTOP = 3
const LOOP_PIN_VH_MOBILE = 3.4
/** 1:1 scrub — numeric lag + Lenis read as spring/overshoot on pin enter. */
const LOOP_SCRUB = true
/** Per-frame camera damp toward target (1 = snap). Higher = less trail bounce. */
const LOOP_CAM_DAMP = 0.48

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
/** Dock scrub progress at which glass + dark mark apply. Tied to the morph
 *  itself (not raw scrollY) so Lenis/pin drift can't darken the logo mid-hero. */
const LOGO_DARK_AT = 0.98

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

/** CSS clamp() in JS — the dock maths needs these as numbers. */
function clampPx(min: number, preferred: number, max: number) {
  return Math.min(Math.max(min, preferred), max)
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
      toggleActions: 'play none none reverse',
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

/** Per-char spans for vision headline stagger (opacity + y — no blur). */
function splitVisionLines(lines: Element[]) {
  lines.forEach((line) => {
    const text = (line.textContent || '').trim()
    line.textContent = ''
    line.setAttribute('aria-label', text)

    text.split(/(\s+)/).forEach((token) => {
      if (/^\s+$/.test(token)) {
        const space = document.createElement('span')
        space.className = 'vision__char is-space'
        space.textContent = '\u00a0'
        line.appendChild(space)
        return
      }

      const word = document.createElement('span')
      word.className = 'vision__word'
      ;[...token].forEach((char) => {
        const span = document.createElement('span')
        span.className = 'vision__char'
        span.textContent = char
        word.appendChild(span)
      })
      line.appendChild(word)
    })
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
      const loopSection = document.querySelector(
        '[data-section="loop"]',
      ) as HTMLElement | null
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

      /* ——— Hero wordmark docks into the nav ———
       * One element, not two: the nav logo starts scaled up and translated
       * into the middle of the hero fold, then scrubs back to its identity
       * transform (= its real nav slot) over DOCK_VH of scroll. Because the
       * end state is identity there's no landing maths to drift — it lands
       * exactly where the flex layout already puts it.
       *
       * Transforming the SVG (not its anchor) keeps the anchor's layout box
       * nav-sized throughout, which both holds the nav layout still and gives
       * us a transform-independent rect to measure the docked geometry from.
       */
      const navLogo = document.querySelector('[data-nav-logo]') as HTMLElement | null
      const navMark = document.querySelector(
        '[data-nav-logo-mark]',
      ) as SVGSVGElement | null

      if (navLogo && navMark) {
        /* Both ends of the dock, in the mark's own top-left origin space.
         *
         * The mark is laid out at its full raster width (see
         * .site-nav__logo-img) and only ever scaled DOWN — at the hero end to
         * heroWidth, at the docked end to the anchor's footprint. Reading the
         * raster width and aspect back off computed style keeps CSS the single
         * source of truth for both.
         *
         * transform-origin is 0 0, so a translate lands the mark's top-left
         * exactly where we ask; the anchor is untransformed, so its rect stays
         * a stable reference for both the origin and the docked size. */
        const dockGeometry = () => {
          const vw = window.innerWidth
          const vh = window.innerHeight
          const narrow = vw <= 900
          const cs = window.getComputedStyle(navMark)
          const rasterW = parseFloat(cs.width)
          const aspect = rasterW / parseFloat(cs.height)
          const anchor = navLogo.getBoundingClientRect()

          /* Mirrors the old .hero__brandmark placement: centred in the fold on
           * desktop, but pinned to the blank strip under the nav below 900px,
           * where the headline+lede stack fills the fold and a centred mark
           * would land on top of the headline. */
          const heroW = narrow
            ? clampPx(200, vw * 0.44, 300)
            : clampPx(320, vw * 0.46, 860)
          const heroH = heroW / aspect
          const heroCx = vw / 2
          const heroCy = narrow
            ? clampPx(108, vh * 0.15, 148) + heroH / 2
            : (vh - clampPx(60, vh * 0.12, 140)) / 2

          return {
            heroX: heroCx - heroW / 2 - anchor.left,
            heroY: heroCy - heroH / 2 - anchor.top,
            heroScale: heroW / rasterW,
            dockScale: anchor.width / rasterW,
          }
        }

        if (reduceMotion) {
          gsap.set(navMark, { x: 0, y: 0, scale: dockGeometry().dockScale })
        } else {
          dockOwnsScrolled = true
          const syncLogoDocked = (progress: number) => {
            siteNav?.classList.toggle('is-scrolled', progress >= LOGO_DARK_AT)
          }
          gsap.fromTo(
            navMark,
            {
              x: () => dockGeometry().heroX,
              y: () => dockGeometry().heroY,
              scale: () => dockGeometry().heroScale,
            },
            {
              x: 0,
              y: 0,
              scale: () => dockGeometry().dockScale,
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: () => `+=${window.innerHeight * DOCK_VH}`,
                scrub: true,
                /* Hold the fold still for the whole dock, then release into
                 * normal scrolling — the mark finishes travelling before the
                 * page moves at all, rather than racing it. pinSpacing adds
                 * the DOCK_VH of scroll this consumes, so nothing below is
                 * swallowed. */
                pin: true,
                /* Flush with Lenis — anticipatePin overshoots on Vision reverse. */
                anticipatePin: 0,
                invalidateOnRefresh: true,
                /* Dark mark + glass only when the morph has essentially landed
                 * in the nav slot — keeps ecru readable over the hero fold. */
                onUpdate: (self) => syncLogoDocked(self.progress),
                onRefresh: (self) => syncLogoDocked(self.progress),
              },
            },
          )
          syncLogoDocked(0)
        }
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
      const lines = gsap.utils.toArray<Element>('[data-vision-line]')
      const videoBox = document.querySelector('[data-video-box]') as HTMLElement | null
      const visionCopy = document.querySelector('.vision__copy') as HTMLElement | null
      const visionVideo = videoBox?.querySelector('video')
      const visionStage = document.querySelector('.vision__stage') as HTMLElement | null
      const visionVideoWrap = document.querySelector(
        '.vision__video-wrap',
      ) as HTMLElement | null
      /* Tweak knobs — pin travel + scrub feel (also mirrored on arrow ST) */
      const VISION_PIN_END = '+=140%'
      const VISION_SCRUB = true

      if (vision && videoBox && lines.length) {
        splitVisionLines(lines)
        const chars = gsap.utils.toArray<HTMLElement>('.vision__char')
        const reduceMotionVision = reduceMotion

        gsap.set(chars, { opacity: 0.14, y: 10 })
        visionVideo?.play().catch(() => {})

        if (visionVideoWrap && !reduceMotionVision) {
          /* Once in — stay. Reverse on leaveBack fought the pin layout lock. */
          revealOnEnter(visionVideoWrap, vision, {
            start: 'top 92%',
            y: 36,
            blur: 4,
            duration: 1,
            scale: 1,
            toggleActions: 'play none none none',
          })
        }

        if (reduceMotionVision) {
          gsap.set(chars, { opacity: 1, y: 0 })
        } else {
          let layoutLocked = false
          let fromTop = 0
          let fromLeft = 0
          let fromW = 0
          let fromH = 0

          const clearLayoutLock = () => {
            layoutLocked = false
            gsap.set([visionCopy, visionVideoWrap, videoBox].filter(Boolean), {
              clearProps:
                'position,top,left,width,height,maxWidth,maxHeight,inset,display,padding,margin,zIndex,borderRadius,x,y,opacity,transform,filter',
            })
          }

          /** Reset scrub-owned visuals so leaveBack never leaves stuck fade. */
          const resetVisionScrubVisuals = () => {
            if (visionCopy) {
              gsap.set(visionCopy, { clearProps: 'opacity,transform' })
            }
            gsap.set(chars, { opacity: 0.14, y: 10 })
          }

          /** Freeze video-above-copy geometry once the pin is active / in view.
           *  Only measure in-fold (progress ~0). Measuring at full-bleed
           *  (enterBack from Loop) would poison the expand from-state. */
          const lockInFoldLayout = () => {
            if (
              layoutLocked ||
              !visionStage ||
              !visionCopy ||
              !visionVideoWrap ||
              !videoBox
            ) {
              return
            }
            layoutLocked = true

            const stageRect = visionStage.getBoundingClientRect()
            const boxRect = videoBox.getBoundingClientRect()
            const copyRect = visionCopy.getBoundingClientRect()

            fromTop = boxRect.top - stageRect.top
            fromLeft = boxRect.left - stageRect.left
            fromW = boxRect.width
            fromH = boxRect.height

            gsap.set(visionCopy, {
              position: 'absolute',
              left: copyRect.left - stageRect.left,
              top: copyRect.top - stageRect.top,
              width: copyRect.width,
              minWidth: copyRect.width,
              margin: 0,
              zIndex: 2,
            })
            gsap.set(visionVideoWrap, {
              position: 'absolute',
              inset: 0,
              maxWidth: 'none',
              width: '100%',
              height: '100%',
              display: 'block',
              padding: 0,
              zIndex: 1,
            })
            gsap.set(videoBox, {
              position: 'absolute',
              top: fromTop,
              left: fromLeft,
              width: fromW,
              height: fromH,
              maxHeight: 'none',
              borderRadius: 4,
              x: 0,
              y: 0,
            })
          }

          const vtl = gsap.timeline({
            scrollTrigger: {
              trigger: vision,
              start: 'top top',
              end: VISION_PIN_END,
              pin: true,
              scrub: VISION_SCRUB,
              anticipatePin: 0,
              invalidateOnRefresh: true,
              onEnter: lockInFoldLayout,
              onEnterBack: (self) => {
                if (!layoutLocked && self.progress < 0.05) lockInFoldLayout()
              },
              onLeaveBack: () => {
                clearLayoutLock()
                resetVisionScrubVisuals()
              },
              onRefresh: (self) => {
                if (self.progress === 0) {
                  clearLayoutLock()
                  resetVisionScrubVisuals()
                  if (self.isActive) lockInFoldLayout()
                }
              },
            },
          })

          /* Char settle — opacity + y only (no blur). */
          vtl.fromTo(
            chars,
            { opacity: 0.14, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.08,
              stagger: 0.006,
              ease: 'power1.out',
            },
            0,
          )

          /* Copy yields as the frame starts expanding. */
          if (visionCopy) {
            vtl.fromTo(
              visionCopy,
              { opacity: 1, y: 0 },
              { opacity: 0, y: -28, duration: 0.18, ease: 'power1.in' },
              '+=0.06',
            )
          } else {
            vtl.to({}, { duration: 0.06 })
          }

          /* Short hold on in-fold media, then expand to full bleed. */
          vtl.to({}, { duration: 0.08 })
          vtl.fromTo(
            videoBox,
            {
              top: () => fromTop,
              left: () => fromLeft,
              width: () => fromW,
              height: () => fromH,
              borderRadius: 4,
            },
            {
              top: 0,
              left: 0,
              width: () => visionVideoWrap?.offsetWidth || window.innerWidth,
              height: () => visionVideoWrap?.offsetHeight || window.innerHeight,
              borderRadius: 0,
              duration: 0.85,
              ease: 'power2.inOut',
              immediateRender: false,
              onStart: lockInFoldLayout,
            },
            '+=0.02',
          )
        }
      }

      /* ——— The Loop: pin + path draw + camera zoom (Build → Run → Signal) ——— */
      if (loopSection) {
        const viewport = loopSection.querySelector(
          '[data-loop-viewport]',
        ) as HTMLElement | null
        const camera = loopSection.querySelector(
          '[data-loop-camera]',
        ) as HTMLElement | null
        const drawn = loopSection.querySelector(
          '[data-loop-drawn]',
        ) as SVGPathElement | null
        const steps = gsap.utils.toArray<HTMLElement>(
          loopSection.querySelectorAll('[data-loop-step]'),
        )
        const stepThresholds = steps.map(
          (el) => Number(el.dataset.s) || 0,
        )

        /* Eyebrow + title — same load as hero headline (100% opacity settled). */
        const loopHeadBits = gsap.utils.toArray<Element>(
          loopSection.querySelectorAll(
            '.loop__header .section-head__eyebrow, .loop__header .section-head__title',
          ),
        )
        revealTitleLikeHero(loopHeadBits, loopSection, { start: 'top 82%' })

        const reduceMotionLoop = reduceMotion

        if (drawn && camera && viewport && steps.length && !reduceMotionLoop) {
          const svg = loopSection.querySelector('.loop__svg') as SVGSVGElement | null
          const tipEl = loopSection.querySelector(
            '[data-loop-tip]',
          ) as SVGCircleElement | null
          const pathLen = drawn.getTotalLength()
          const drawStart = resolveLoopDrawStart(drawn)
          const entryProgress = loopDrawProgress(0)

          gsap.set(drawn, {
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen,
          })

          const setDash = gsap.quickSetter(drawn, 'strokeDashoffset')
          /* GSAP quickSetter(el, 'transform') is a no-op in 3.x — set CSS directly. */
          const setCamera = (transform: string) => {
            camera.style.transform = transform
          }

          /* Timeline segments in draw-progress space — keys/scales from loopPath.ts */
          const CAM_SCALES = LOOP_CAM_SCALE_VALUES
          const CAM_KEYS = loopCamKeys(drawStart)

          const stepPoints = () =>
            steps.map((el, i) => {
              const fx = Number(el.dataset.focusX)
              const fy = Number(el.dataset.focusY)
              if (Number.isFinite(fx) && Number.isFinite(fy)) {
                return { x: fx, y: fy }
              }
              const fallback = LOOP_STEPS[i]
              if (!svg || !fallback) return { x: PATH_ENTRY.x, y: PATH_ENTRY.y }
              return artboardToContainerFraction(svg, fallback.x, fallback.y)
            })

          const tipScreenPoint = (progress: number) => {
            if (!svg) return LOOP_START_FOCUS
            const local = samplePathTipLocal(drawn, progress)
            if (!local) return LOOP_START_FOCUS
            const art = mapPathPointToArtboard(local.x, local.y)
            return artboardToContainerFraction(svg, art.x, art.y)
          }

          /** Continuous solid stroke to tip + tip disc flush on the end (no tip-fade gap). */
          const syncTipGraphics = (progress: number) => {
            const tipDist = progress * pathLen
            setDash(pathLen - tipDist)

            const tip = samplePathTipLocal(drawn, progress)
            if (tipEl && tip) {
              tipEl.setAttribute('cx', String(tip.x))
              tipEl.setAttribute('cy', String(tip.y))
              /* Hidden until draw starts (off-screen park) and at path end. */
              tipEl.style.opacity =
                progress <= 0.001 || progress >= LOOP_END_TIP_HIDE ? '0' : '1'
            }
          }

          /**
           * Park path M (s=0) off the left edge at near-mid height so the
           * stroke/tip enter from outside on scroll (not a visible stub).
           * Focus Y is floored so the deepest path + stroke stay above the
           * viewport clip (fixes right-loop bottom truncation).
           */
          const lowestScreenY = () => {
            if (!svg) return 0.91
            return artboardToContainerFraction(
              svg,
              LOOP_PATH_LOWEST_ARTBOARD.x,
              LOOP_PATH_LOWEST_ARTBOARD.y,
            ).y
          }

          const focusYBounds = (scale: number) => {
            const vh = viewport.offsetHeight
            const ch = camera.offsetHeight
            const edge = loopStrokeEdgePx(
              svg?.clientWidth ?? camera.offsetWidth,
              svg?.clientHeight ?? ch,
              scale,
            )
            const floor = loopFocusYFloor(
              lowestScreenY(),
              scale,
              vh,
              ch,
              edge,
            )
            const startPt = tipScreenPoint(0)
            const ceil = loopFocusYCeil(startPt.y, scale, vh, ch)
            return { floor, ceil, startPt }
          }

          const entryFocus = () => {
            const scale = CAM_SCALES[0]
            const { floor, ceil, startPt } = focusYBounds(scale)
            const focusY = loopEntryFocusY(
              startPt.y,
              scale,
              viewport.offsetHeight,
              camera.offsetHeight,
              undefined,
              Math.max(floor, LOOP_START_FOCUS.y),
              ceil,
            )
            return loopFlushLeftFocus(
              startPt.x,
              scale,
              focusY,
              viewport.offsetWidth,
              camera.offsetWidth,
              LOOP_ENTRY_VIEW_X,
            )
          }

          /**
           * Focus targets — hold off-left entry framing through Build so
           * activating copy does not pan. After Build, very gentle drift
           * toward Run/Signal (blended, not hard step snaps). Milestone DOM
           * stays fixed. Y is always clamped so the loop bottom never clips.
           */
          const focusTargets = () => {
            const entry = entryFocus()
            const pts = stepPoints()
            const run = pts[1] ?? entry
            const signal = pts[2] ?? run
            const soft = (
              a: { x: number; y: number },
              b: { x: number; y: number },
              t: number,
            ) => ({
              x: a.x + (b.x - a.x) * t,
              y: a.y + (b.y - a.y) * t,
            })
            const clampY = (
              focus: { x: number; y: number },
              scale: number,
            ) => {
              const { floor, ceil } = focusYBounds(scale)
              return {
                x: focus.x,
                y: loopClampFocusY(
                  focus.y,
                  Math.max(floor, LOOP_START_FOCUS.y),
                  ceil,
                ),
              }
            }
            return [
              clampY(entry, CAM_SCALES[0]),
              clampY(entry, CAM_SCALES[1]),
              clampY(soft(entry, run, 0.35), CAM_SCALES[2]),
              clampY(soft(entry, signal, 0.45), CAM_SCALES[3]),
              clampY(soft(entry, signal, 0.5), CAM_SCALES[4]),
            ]
          }

          const cameraTransform = (
            focus: { x: number; y: number },
            scale: number,
          ) => {
            const vw = viewport.offsetWidth
            const vh = viewport.offsetHeight
            const cw = camera.offsetWidth
            const ch = camera.offsetHeight
            const px = focus.x * cw
            const py = focus.y * ch
            const x = vw / 2 - px * scale
            const y = vh / 2 - py * scale
            return { x, y, scale }
          }

          const camLive: {
            x: number
            y: number
            scale: number
            primed: boolean
          } = { x: 0, y: 0, scale: CAM_SCALES[0], primed: false }

          const applyCamera = (
            focus: { x: number; y: number },
            scale: number,
            immediate = false,
          ) => {
            const target = cameraTransform(focus, scale)
            if (!camLive.primed || immediate) {
              camLive.x = target.x
              camLive.y = target.y
              camLive.scale = target.scale
              camLive.primed = true
            } else {
              const d = LOOP_CAM_DAMP
              camLive.x += (target.x - camLive.x) * d
              camLive.y += (target.y - camLive.y) * d
              camLive.scale += (target.scale - camLive.scale) * d
            }
            camera.style.setProperty('--loop-cam-scale', String(camLive.scale))
            setCamera(
              `translate3d(${camLive.x}px, ${camLive.y}px, 0) scale(${camLive.scale})`,
            )
          }

          const cameraAt = (progress: number, immediate = false) => {
            const targets = focusTargets()
            for (let i = 0; i < CAM_KEYS.length - 1; i += 1) {
              const a = CAM_KEYS[i]
              const b = CAM_KEYS[i + 1]
              if (progress <= b) {
                const raw = b === a ? 0 : (progress - a) / (b - a)
                const t = loopCamEase(raw)
                const scale = gsap.utils.interpolate(
                  CAM_SCALES[i],
                  CAM_SCALES[i + 1],
                  t,
                )
                const fx = gsap.utils.interpolate(
                  targets[i].x,
                  targets[i + 1].x,
                  t,
                )
                const fy = gsap.utils.interpolate(
                  targets[i].y,
                  targets[i + 1].y,
                  t,
                )
                applyCamera({ x: fx, y: fy }, scale, immediate)
                return
              }
            }
            const last = targets[targets.length - 1]
            applyCamera(last, CAM_SCALES[CAM_SCALES.length - 1], immediate)
          }

          /* Activate when tip reaches milestone `s` (slight early bias so the
           * ring pops with the visual tip, not after CSS fade lag). */
          const STEP_ARRIVE_BIAS = 0.02
          const activeIndex = (progress: number) => {
            let idx = -1
            for (let i = 0; i < stepThresholds.length; i += 1) {
              if (progress >= stepThresholds[i] - STEP_ARRIVE_BIAS) idx = i
            }
            return idx
          }

          const applyStepFocus = (stage: number, progress: number) => {
            loopSection.dataset.loopStage = String(stage)
            steps.forEach((step, i) => {
              /* Ring + copy at the same `s` the tip arrives — opacity/class
               * only; never mutate left/top (Build/Run position lock). */
              const showRing = loopRingVisible(i, stage, progress)
              step.classList.toggle('is-reached', showRing)
              step.classList.toggle('is-active', false)
              step.classList.toggle('is-copy-visible', loopCopyVisible(i, stage))
            })
          }

          const sync = (progress: number, immediate = false) => {
            syncTipGraphics(progress)
            cameraAt(progress, immediate)

            const stage = activeIndex(progress)
            applyStepFocus(stage, progress)

            loopSection.classList.add('is-loop-ready')
          }

          const pinVh = () =>
            window.matchMedia('(max-width: 900px)').matches
              ? LOOP_PIN_VH_MOBILE
              : LOOP_PIN_VH_DESKTOP

          ScrollTrigger.create({
            trigger: loopSection,
            start: 'top top',
            end: () => `+=${window.innerHeight * pinVh()}`,
            pin: true,
            scrub: LOOP_SCRUB,
            /* Flush pin — anticipatePin overshoots with Lenis (springy enter). */
            anticipatePin: 0,
            invalidateOnRefresh: true,
            onUpdate: (self) => sync(loopDrawProgress(self.progress)),
            onRefresh: (self) => {
              camLive.primed = false
              sync(loopDrawProgress(self.progress), true)
            },
          })

          sync(entryProgress, true)
        } else if (reduceMotionLoop) {
          loopSection.classList.add('is-static')
          if (drawn) {
            const pathLen = drawn.getTotalLength()
            gsap.set(drawn, {
              strokeDasharray: pathLen,
              strokeDashoffset: 0,
            })
          }
          const tipEl = loopSection.querySelector(
            '[data-loop-tip]',
          ) as SVGCircleElement | null
          if (tipEl && drawn) {
            const end = drawn.getPointAtLength(drawn.getTotalLength())
            tipEl.setAttribute('cx', String(end.x))
            tipEl.setAttribute('cy', String(end.y))
            tipEl.style.opacity = '0'
          }
          steps.forEach((step) => {
            step.classList.toggle('is-active', false)
            step.classList.toggle('is-reached', true)
            step.classList.toggle('is-copy-visible', true)
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
