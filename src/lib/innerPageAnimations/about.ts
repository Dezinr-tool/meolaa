import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'
import { initLoop } from '../loopAnimations'
import {
  ROADMAP_END_TIP_HIDE,
  ROADMAP_STEPS,
  roadmapRingVisible,
  samplePathTipLocal,
} from '../aboutRoadmapPath'
import {
  editorialPinType,
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
  scrollToY,
  ScrollTrigger,
} from './shared'

const SCRUB = 0.55
const SCRUB_MOBILE = 0.85
const PIN_VH_DESKTOP = 3.2
const PIN_VH_MOBILE = 5.2
const STEP_ARRIVE_BIAS = 0.015
const ABOUT_MOBILE_MQ = '(max-width: 900px)'

function aboutIsMobile() {
  return window.matchMedia(ABOUT_MOBILE_MQ).matches
}

/** Homepage Loop fold on About — scroll-pinned path draw + camera. */
export function initAboutLoop(): () => void {
  if (!document.querySelector('.page-editorial [data-section="loop"]')) {
    return () => {}
  }
  return initLoop({ innerPage: true })
}

export function initAboutRoadmap(): () => void {
  const root = document.querySelector<HTMLElement>('[data-au-roadmap]')
  if (!root) return () => {}

  const pin = root.querySelector<HTMLElement>('[data-au-roadmap-pin]')
  const drawn = root.querySelector<SVGPathElement>('[data-au-roadmap-drawn]')
  const tipEl = root.querySelector<SVGCircleElement>('[data-au-roadmap-tip]')
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-au-roadmap-step]'))
  if (!pin || !drawn || !steps.length) return () => {}

  const stepThresholds = steps.map((el) => Number(el.dataset.s) || 0)
  const headerLines = Array.from(
    root.querySelectorAll<HTMLElement>(
      '.au-roadmap__header .section-head__eyebrow, .au-roadmap__header .section-head__title, .au-roadmap__header .section-head__sub',
    ),
  )
  const artboard = root.querySelector<HTMLElement>('[data-au-roadmap-artboard]')
  const ghost = root.querySelector<SVGPathElement>('.au-roadmap__ghost')
  const caption = root.querySelector<HTMLElement>('[data-au-roadmap-caption]')
  const captionLabel = caption?.querySelector<HTMLElement>('.au-roadmap__copy-label')
  const captionTitle = caption?.querySelector<HTMLElement>('.au-roadmap__copy-title')
  const captionBody = caption?.querySelector<HTMLElement>('.au-roadmap__copy-body')

  let scrollTrigger: ST | null = null
  let introTrigger: ST | null = null
  let captionTween: gsap.core.Tween | null = null
  let mode: 'static' | 'scrub' | null = null
  let lastCaptionStage = -1
  const cleanups: (() => void)[] = []

  function activeIndex(progress: number) {
    if (progress <= 0.001) return -1
    let idx = -1
    for (let i = 0; i < stepThresholds.length; i += 1) {
      if (progress >= stepThresholds[i] - STEP_ARRIVE_BIAS) idx = i
    }
    return idx
  }

  function setCaption(stage: number) {
    if (!aboutIsMobile() || stage < 0 || stage === lastCaptionStage || !caption) return
    lastCaptionStage = stage
    const data = ROADMAP_STEPS[stage]
    if (!data) return

    if (captionLabel) captionLabel.textContent = data.label
    if (captionTitle) captionTitle.textContent = data.title
    if (captionBody) captionBody.textContent = data.body

    if (prefersReducedMotion()) {
      gsap.set(caption, { opacity: 1, y: 0 })
      return
    }

    captionTween?.kill()
    captionTween = gsap.fromTo(
      caption,
      { opacity: 0.35, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
    )
  }

  function applyStepFocus(stage: number, progress: number) {
    steps.forEach((step, i) => {
      const reached = roadmapRingVisible(i, stage, progress)
      step.classList.toggle('is-reached', reached)
      step.classList.toggle('is-copy-visible', i === stage && stage >= 0)
      step.setAttribute('aria-current', i === stage ? 'step' : 'false')
    })
    if (aboutIsMobile() && stage >= 0) setCaption(stage)
  }

  function syncTipGraphics(progress: number, pathLen: number) {
    gsap.set(drawn, { strokeDashoffset: pathLen - progress * pathLen })

    const tip = samplePathTipLocal(drawn!, progress)
    if (tipEl && tip) {
      tipEl.setAttribute('cx', String(tip.x))
      tipEl.setAttribute('cy', String(tip.y))
      tipEl.style.opacity = progress >= ROADMAP_END_TIP_HIDE ? '0' : '1'
    }
  }

  function sync(progress: number) {
    const pathLen = drawn!.getTotalLength()
    syncTipGraphics(progress, pathLen)
    applyStepFocus(activeIndex(progress), progress)
    root!.classList.add('is-roadmap-ready')
  }

  function setupIntro() {
    introTrigger?.kill()
    introTrigger = null
    gsap.set([...headerLines, artboard, ghost].filter(Boolean), {
      clearProps: 'opacity,transform,y',
    })

    if (prefersReducedMotion() || mode === 'static') return

    if (headerLines.length) gsap.set(headerLines, { opacity: 0, y: 28 })
    if (artboard) gsap.set(artboard, { opacity: 0 })
    if (ghost) gsap.set(ghost, { opacity: 0 })

    introTrigger = ScrollTrigger.create({
      trigger: root,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        if (headerLines.length) {
          gsap.to(headerLines, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.11,
            ease: 'power3.out',
          })
        }
        if (artboard) {
          gsap.to(artboard, { opacity: 1, duration: 0.9, delay: 0.15, ease: 'power2.out' })
        }
        if (ghost) {
          gsap.to(ghost, { opacity: 1, duration: 0.85, delay: 0.35, ease: 'power2.out' })
        }
      },
    })
  }

  function killCaption() {
    captionTween?.kill()
    captionTween = null
  }

  function killScrollTrigger() {
    scrollTrigger?.kill()
    scrollTrigger = null
    root!.classList.remove('is-pinning')
  }

  function buildScrub() {
    killCaption()
    killScrollTrigger()
    introTrigger?.kill()
    introTrigger = null
    root!.classList.remove('is-static')
    root!.classList.toggle('is-mobile-play', aboutIsMobile())
    lastCaptionStage = -1

    const pathLen = drawn!.getTotalLength()
    gsap.set(drawn, { strokeDasharray: pathLen, strokeDashoffset: pathLen })
    if (aboutIsMobile() && caption) gsap.set(caption, { opacity: 0, y: 12 })

    scrollTrigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: () => `+=${window.innerHeight * (aboutIsMobile() ? PIN_VH_MOBILE : PIN_VH_DESKTOP)}`,
      pin,
      pinSpacing: true,
      pinType: editorialPinType(),
      scrub: aboutIsMobile() ? SCRUB_MOBILE : SCRUB,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onEnter: () => root!.classList.add('is-pinning'),
      onEnterBack: () => root!.classList.add('is-pinning'),
      onLeave: () => root!.classList.remove('is-pinning'),
      onLeaveBack: () => root!.classList.remove('is-pinning'),
      onUpdate: (self) => sync(self.progress),
      onRefresh: (self) => {
        const pathLenRefresh = drawn!.getTotalLength()
        gsap.set(drawn, { strokeDasharray: pathLenRefresh })
        sync(self.progress)
      },
    })

    setupIntro()
    sync(0)
  }

  function buildStatic() {
    killCaption()
    killScrollTrigger()
    introTrigger?.kill()
    introTrigger = null
    root!.classList.add('is-static')
    root!.classList.remove('is-mobile-play')

    const pathLen = drawn!.getTotalLength()
    gsap.set(drawn, { strokeDasharray: pathLen, strokeDashoffset: 0 })

    if (tipEl) tipEl.style.opacity = '0'

    steps.forEach((step, i) => {
      step.classList.toggle('is-reached', true)
      step.classList.toggle('is-copy-visible', i === 0)
      step.setAttribute('aria-current', i === 0 ? 'step' : 'false')
    })
    lastCaptionStage = -1

    root!.classList.add('is-roadmap-ready')
    setupIntro()
  }

  function applyMode(force = false) {
    const next = prefersReducedMotion() ? 'static' : 'scrub'
    if (!force && next === mode) return
    mode = next
    if (next === 'static') buildStatic()
    else buildScrub()
    refreshScrollTriggers()
  }

  steps.forEach((el, i) => {
    const onClick = () => {
      if (mode !== 'scrub' || !scrollTrigger) {
        applyStepFocus(i, 1)
        return
      }
      const p = stepThresholds[i] ?? (steps.length <= 1 ? 0 : i / (steps.length - 1))
      scrollToY(scrollTrigger.start + (scrollTrigger.end - scrollTrigger.start) * p)
    }
    el.addEventListener('click', onClick)
    cleanups.push(() => el.removeEventListener('click', onClick))
  })

  applyMode(true)

  let resizeTimer: ReturnType<typeof setTimeout>
  const onResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const next = prefersReducedMotion() ? 'static' : 'scrub'
      if (next !== mode) applyMode(true)
      else if (mode === 'scrub') applyMode(true)
    }, 160)
  }
  window.addEventListener('resize', onResize)
  cleanups.push(() => window.removeEventListener('resize', onResize))

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onReduceChange = () => applyMode(true)
  reduceMq.addEventListener('change', onReduceChange)
  cleanups.push(() => reduceMq.removeEventListener('change', onReduceChange))

  return () => {
    cleanups.forEach((fn) => fn())
    killCaption()
    killScrollTrigger()
    introTrigger?.kill()
    root.classList.remove('is-roadmap-ready', 'is-static', 'is-pinning', 'is-mobile-play')
    gsap.set(drawn, { clearProps: 'strokeDasharray,strokeDashoffset' })
    gsap.set([...headerLines, artboard, ghost, caption].filter(Boolean), {
      clearProps: 'opacity,transform,y',
    })
  }
}

/**
 * About — fold 1 opener. zoox.com/about's TitleBlock plays a simple
 * staggered load-in (eyebrow → title → ctas, then the media card) rather
 * than anything scroll-driven — the pin/clip-mask reveal is fold 2 only.
 */
export function initAboutFold1Intro(): () => void {
  const root = document.querySelector<HTMLElement>('.au-fold1')
  if (!root) return () => {}

  const eyebrow = root.querySelector<HTMLElement>('.au-fold1 .section-head__eyebrow')
  const title = root.querySelector<HTMLElement>('.au-fold1__title')
  const ctas = root.querySelector<HTMLElement>('.au-fold1__ctas')
  const media = root.querySelector<HTMLElement>('.au-fold1__video-box')
  const targets = [eyebrow, title, ctas, media].filter(Boolean) as HTMLElement[]
  if (!targets.length) return () => {}

  if (prefersReducedMotion() || aboutIsMobile()) return () => {}

  const ctx = gsap.context(() => {
    gsap.set(targets, { opacity: 0, y: 24 })
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power2.out',
      stagger: 0.1,
      delay: 0.1,
    })
  }, root)

  return () => ctx.revert()
}

const REVEAL_MQ = '(max-width: 900px)'
const REVEAL_SCRUB_VH = 2.6
const REVEAL_PAD = 24

/**
 * About — "The Model" fold. zoox.com homepage "Spend your time…" mechanic:
 * a full-bleed photo is masked by a clip window that starts as a left-hand
 * card (copy in the right gutter), grows toward the stage on scroll-scrub,
 * then settles as a right-hand card while Mission → Vision copy crossfades.
 * Sharp corners throughout (no rounded clip — site-wide rule).
 */
export function initMissionVision(): () => void {
  const root = document.querySelector<HTMLElement>('.au-reveal')
  if (!root) return () => {}

  const pin = root.querySelector<HTMLElement>('[data-reveal-pin]')
  const clip = root.querySelector<HTMLElement>('[data-reveal-clip]')
  const copyMission = root.querySelector<HTMLElement>('[data-reveal-copy="mission"]')
  const copyVision = root.querySelector<HTMLElement>('[data-reveal-copy="vision"]')
  if (!pin || !clip) return () => {}

  let tl: gsap.core.Timeline | null = null
  let mode: 'motion' | 'static' | null = null

  function isStatic() {
    return prefersReducedMotion() || window.matchMedia(REVEAL_MQ).matches
  }

  function clipValue(top: number, right: number, bottom: number, left: number) {
    return `inset(${top}px ${right}px ${bottom}px ${left}px)`
  }

  function clips() {
    const w = pin!.clientWidth
    const gutter = Math.round(w * 0.48)
    return {
      leftCard: clipValue(REVEAL_PAD, gutter, REVEAL_PAD, REVEAL_PAD),
      expanded: clipValue(REVEAL_PAD, REVEAL_PAD + 1, REVEAL_PAD, REVEAL_PAD),
      rightCard: clipValue(REVEAL_PAD, REVEAL_PAD, REVEAL_PAD, gutter),
    }
  }

  function kill() {
    tl?.kill()
    tl = null
    gsap.set([clip, copyMission, copyVision].filter(Boolean) as gsap.TweenTarget[], {
      clearProps: 'all',
    })
  }

  function setupStatic() {
    kill()
    root!.classList.add('is-static')
  }

  function setupMotion() {
    kill()
    root!.classList.remove('is-static')

    const { leftCard, expanded, rightCard } = clips()

    gsap.set(clip, { clipPath: leftCard })
    if (copyMission) {
      gsap.set(copyMission, { opacity: 1, visibility: 'visible', x: 0 })
    }
    if (copyVision) {
      gsap.set(copyVision, { opacity: 0, visibility: 'hidden', x: -24 })
    }

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * REVEAL_SCRUB_VH)}`,
        pin,
        pinSpacing: true,
        pinType: editorialPinType(),
        scrub: 0.6,
        anticipatePin: 0,
        invalidateOnRefresh: true,
      },
    })

    /* 0 → 0.5: left card grows toward a padded full-stage window; copy
       slides off with the shrinking gutter — same move as Zoox. */
    const slideOut = Math.round(pin!.clientWidth * 0.42)
    timeline.to(clip, { clipPath: expanded, duration: 0.5 })
    if (copyMission) {
      timeline.to(
        copyMission,
        { opacity: 0, x: slideOut, duration: 0.32 },
        0,
      )
      timeline.set(copyMission, { visibility: 'hidden' }, 0.36)
    }

    /* Brief hold on the expanded frame. */
    timeline.to({}, { duration: 0.1 })

    /* 0.6 → 0.92: window settles as a right-hand card; Vision arrives
       once the left gutter is open (Zoox /about side-swap, second beat). */
    timeline.to(clip, { clipPath: rightCard, duration: 0.32 }, 0.6)
    if (copyVision) {
      timeline.set(copyVision, { visibility: 'visible' }, 0.84)
      timeline.to(
        copyVision,
        { opacity: 1, x: 0, duration: 0.14 },
        0.84,
      )
    }
    timeline.to({}, { duration: 0.08 })

    tl = timeline

    refreshScrollTriggers()

    const imgEl = clip!.querySelector('img')
    if (imgEl && !imgEl.complete) {
      imgEl.addEventListener('load', () => refreshScrollTriggers(), { once: true })
    }
  }

  function sync(force = false) {
    const next = isStatic() ? 'static' : 'motion'
    if (!force && next === mode) return
    mode = next
    if (next === 'static') setupStatic()
    else setupMotion()
  }

  sync(true)

  let resizeTimer: ReturnType<typeof setTimeout>
  const onResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => sync(true), 160)
  }
  window.addEventListener('resize', onResize)

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onReduceChange = () => sync(true)
  reduceMq.addEventListener('change', onReduceChange)

  return () => {
    window.removeEventListener('resize', onResize)
    reduceMq.removeEventListener('change', onReduceChange)
    kill()
    root.classList.remove('is-static')
  }
}

/** About — leadership grid scroll reveal. */
export function initAboutLeadership(): () => void {
  const root = document.querySelector<HTMLElement>('[data-au-leadership]')
  if (!root || prefersReducedMotion() || aboutIsMobile()) return () => {}

  const intro = root.querySelector<HTMLElement>('.lead-grid__cell--intro')
  const headerLines = intro
    ? Array.from(
        intro.querySelectorAll<HTMLElement>(
          '.section-head__eyebrow, .section-head__title, .section-head__sub',
        ),
      )
    : []
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.lead-grid__cell--person'))
  const cardImgs = cards
    .map((card) => card.querySelector<HTMLElement>('.lead-grid__img img'))
    .filter(Boolean) as HTMLElement[]

  if (!headerLines.length && !cards.length) return () => {}

  const ctx = gsap.context(() => {
    if (headerLines.length) gsap.set(headerLines, { opacity: 0, y: 28 })
    if (cards.length) gsap.set(cards, { opacity: 0, y: 40 })
    if (cardImgs.length) gsap.set(cardImgs, { scale: 1.07 })

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: 'top 80%', once: true },
      defaults: { ease: 'power3.out' },
    })

    if (headerLines.length) {
      tl.to(headerLines, { opacity: 1, y: 0, duration: 0.72, stagger: 0.1 })
    }
    if (cards.length) {
      tl.to(
        cards,
        { opacity: 1, y: 0, duration: 0.78, stagger: 0.11 },
        headerLines.length ? '-=0.38' : 0,
      )
      if (cardImgs.length) {
        tl.to(cardImgs, { scale: 1, duration: 1.05, stagger: 0.11, ease: 'power2.out' }, '<')
      }
    }
  }, root)

  refreshScrollTriggers()
  return () => ctx.revert()
}

export function initPillars(): () => void {
  const pillars = document.querySelector<HTMLElement>('[data-section="pillars"]')
  if (!pillars || prefersReducedMotion() || document.querySelector('.app--inner')) {
    return () => {}
  }

  const pillarsTitle = pillars.querySelector<HTMLElement>('.pillars__title')
  const pillarCards = gsap.utils.toArray<HTMLElement>(
    pillars.querySelectorAll('.pillar-card'),
  )
  if (!pillarsTitle || !pillarCards.length) return () => {}

  gsap.set(pillarCards, { y: 140, opacity: 0 })

  const pillarsTl = gsap.timeline({
    scrollTrigger: {
      trigger: pillars,
      start: 'top top',
      end: '+=200%',
      pin: true,
      pinSpacing: true,
      pinType: editorialPinType(),
      scrub: 1,
      anticipatePin: 0,
    },
  })

  pillarsTl.fromTo(
    pillarsTitle,
    { filter: 'blur(9px)', opacity: 0.55, y: '38vh' },
    { filter: 'blur(0px)', opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' },
    0,
  )

  pillarCards.forEach((card, i) => {
    pillarsTl.fromTo(
      card,
      { y: 140, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.28, ease: 'power2.out' },
      0.18 + i * 0.22,
    )
  })

  refreshScrollTriggers()

  return () => {
    pillarsTl.scrollTrigger?.kill()
    pillarsTl.kill()
    gsap.set([pillarsTitle, ...pillarCards], { clearProps: 'all' })
  }
}
