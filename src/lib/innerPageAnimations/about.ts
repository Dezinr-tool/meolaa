import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'
import { initLoop } from '../loopAnimations'
import {
  ROADMAP_END_TIP_HIDE,
  ROADMAP_STEPS,
  VIEW_MIN_X,
  VIEW_W,
  roadmapBulletsVisible,
  roadmapDrawProgress,
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
const PIN_VH_DESKTOP = 3.2
const PIN_VH_MOBILE = 2.3
const STEP_ARRIVE_BIAS = 0.015

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
  const track = root.querySelector<HTMLElement>('[data-au-roadmap-track]')
  const camera = root.querySelector<HTMLElement>('[data-au-roadmap-camera]')
  const viewport = root.querySelector<HTMLElement>('[data-au-roadmap-viewport]')
  const steps = Array.from(
    root.querySelectorAll<HTMLElement>('[data-au-roadmap-step]'),
  )
  if (!pin || !drawn || !steps.length) return () => {}

  const stepThresholds = steps.map(
    (el) => Number(el.dataset.s) || 0,
  )

  let scrollTrigger: ST | null = null
  let mode: 'static' | 'scrub' | null = null
  const cleanups: (() => void)[] = []

  function isNarrow() {
    return window.matchMedia('(max-width: 720px)').matches
  }

  function pinVh() {
    return isNarrow() ? PIN_VH_MOBILE : PIN_VH_DESKTOP
  }

  function activeIndex(progress: number) {
    if (progress <= 0.001) return -1
    let idx = -1
    for (let i = 0; i < stepThresholds.length; i += 1) {
      if (progress >= stepThresholds[i] - STEP_ARRIVE_BIAS) idx = i
    }
    return idx
  }

  function applyStepFocus(stage: number, progress: number) {
    root!.dataset.auRoadmapStage = String(stage)
    steps.forEach((step, i) => {
      const reached = roadmapRingVisible(i, stage, progress)
      step.classList.toggle('is-reached', reached)
      step.classList.toggle('is-copy-visible', roadmapBulletsVisible(i, stage))
      step.setAttribute('aria-current', i === stage ? 'step' : 'false')
    })
  }

  function syncTipGraphics(progress: number, pathLen: number) {
    const tipDist = progress * pathLen
    gsap.set(drawn!, { strokeDashoffset: pathLen - tipDist })

    const tip = samplePathTipLocal(drawn!, progress)
    if (tipEl && tip) {
      tipEl.setAttribute('cx', String(tip.x))
      tipEl.setAttribute('cy', String(tip.y))
      tipEl.style.opacity =
        progress <= 0.001 || progress >= ROADMAP_END_TIP_HIDE ? '0' : '1'
    }
  }

  /**
   * Camera pan — the Figma frames show the viewport tracking along a path
   * far wider than the frame, so the drawing tip stays on screen while the
   * rest of the curve scrolls past. Pans by the tip's own x rather than
   * linearly with progress: the path doubles back on itself twice, so a
   * linear pan would run ahead of the tip through the loops.
   */
  function syncCamera(progress: number) {
    if (!camera || !viewport) return
    if (isNarrow()) {
      camera.style.transform = ''
      return
    }
    const tip = samplePathTipLocal(drawn!, progress)
    if (!tip) return

    const camW = camera.scrollWidth || camera.getBoundingClientRect().width
    const viewW = viewport.clientWidth
    if (camW <= 0 || viewW <= 0) return

    /* Path units → camera px. */
    const tipPx = ((tip.x - VIEW_MIN_X) / VIEW_W) * camW
    const maxPan = Math.max(0, camW - viewW)
    const pan = Math.min(maxPan, Math.max(0, tipPx - viewW / 2))
    camera.style.transform = `translate3d(${-pan}px, 0, 0)`
  }

  function sync(progress: number, immediate = false) {
    const pathLen = drawn!.getTotalLength()
    syncTipGraphics(progress, pathLen)
    syncCamera(progress)
    const stage = activeIndex(progress)
    applyStepFocus(stage, progress)
    root!.classList.add('is-roadmap-ready')

    if (immediate && isNarrow() && stage >= 0) {
      scrollActiveIntoView(stage)
    }
  }

  function scrollActiveIntoView(index: number) {
    if (!isNarrow() || !track) return
    const el = steps[index]
    if (!el) return
    const viewport = root!.querySelector<HTMLElement>('[data-au-roadmap-viewport]')
    if (!viewport) return
    const left = el.offsetLeft - (viewport.clientWidth - el.offsetWidth) / 2
    viewport.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }

  function killScrollTrigger() {
    scrollTrigger?.kill()
    scrollTrigger = null
    root!.classList.remove('is-pinning')
  }

  function buildScrub() {
    killScrollTrigger()
    root!.classList.remove('is-static')

    const pathLen = drawn!.getTotalLength()
    gsap.set(drawn, {
      strokeDasharray: pathLen,
      strokeDashoffset: pathLen,
    })

    scrollTrigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: () => `+=${window.innerHeight * pinVh()}`,
      pin,
      pinSpacing: true,
      pinType: editorialPinType(),
      scrub: SCRUB,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      fastScrollEnd: true,
      onEnter: () => root!.classList.add('is-pinning'),
      onEnterBack: () => root!.classList.add('is-pinning'),
      onLeave: () => root!.classList.remove('is-pinning'),
      onLeaveBack: () => root!.classList.remove('is-pinning'),
      onUpdate: (self) => {
        const progress = roadmapDrawProgress(self.progress)
        sync(progress)
        if (isNarrow()) scrollActiveIntoView(activeIndex(progress))
      },
      onRefresh: (self) => {
        const pathLenRefresh = drawn!.getTotalLength()
        gsap.set(drawn, {
          strokeDasharray: pathLenRefresh,
        })
        sync(roadmapDrawProgress(self.progress), true)
      },
    })

    sync(0, true)
  }

  function buildStatic() {
    killScrollTrigger()
    root!.classList.add('is-static')

    const pathLen = drawn!.getTotalLength()
    gsap.set(drawn, {
      strokeDasharray: pathLen,
      strokeDashoffset: 0,
    })

    if (tipEl) tipEl.style.opacity = '0'

    steps.forEach((step, i) => {
      step.classList.toggle('is-reached', true)
      step.classList.toggle(
        'is-copy-visible',
        i === ROADMAP_STEPS.length - 1,
      )
      step.setAttribute(
        'aria-current',
        i === ROADMAP_STEPS.length - 1 ? 'step' : 'false',
      )
    })

    root!.classList.add('is-roadmap-ready')
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
        applyStepFocus(i, stepThresholds[i] ?? 0)
        scrollActiveIntoView(i)
        return
      }
      const p = steps.length <= 1 ? 0 : i / (steps.length - 1)
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
      else if (mode === 'scrub') ScrollTrigger.refresh()
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
    killScrollTrigger()
    root.classList.remove('is-roadmap-ready', 'is-static', 'is-pinning')
    gsap.set(drawn, { clearProps: 'strokeDasharray,strokeDashoffset' })
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

  if (prefersReducedMotion()) return () => {}

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
const REVEAL_SCRUB_VH = 1.5

/**
 * About — "The Model" fold. zoox.com/about-style pinned clip-mask reveal:
 * a single image's clip window grows open on scroll-scrub while the copy
 * crossfades Mission → Vision over it. Sharp corners throughout (no
 * rounded clip — site-wide rule), and the image itself never swaps.
 */
export function initMissionVision(): () => void {
  const root = document.querySelector<HTMLElement>('.au-reveal')
  if (!root) return () => {}

  const pin = root.querySelector<HTMLElement>('[data-reveal-pin]')
  const img = root.querySelector<HTMLElement>('.au-reveal__img')
  const copyMission = root.querySelector<HTMLElement>('[data-reveal-copy="mission"]')
  const copyVision = root.querySelector<HTMLElement>('[data-reveal-copy="vision"]')
  if (!pin || !img) return () => {}

  let tl: gsap.core.Timeline | null = null
  let trigger: ST | null = null
  let mode: 'motion' | 'static' | null = null

  function isStatic() {
    return prefersReducedMotion() || window.matchMedia(REVEAL_MQ).matches
  }

  function kill() {
    tl?.kill()
    tl = null
    trigger?.kill()
    trigger = null
    gsap.set([img, copyMission, copyVision].filter(Boolean) as gsap.TweenTarget[], {
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

    gsap.set(img, { clipPath: 'inset(58% 4% 4% 4% round 0)' })
    if (copyMission) gsap.set(copyMission, { opacity: 1, visibility: 'visible', y: 0 })
    if (copyVision) gsap.set(copyVision, { opacity: 0, visibility: 'hidden', y: 12 })

    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * REVEAL_SCRUB_VH)}`,
        pin,
        pinSpacing: true,
        pinType: editorialPinType(),
        scrub: true,
        anticipatePin: 0,
        invalidateOnRefresh: true,
      },
    })

    // 0 → 0.55: the clip window grows from a centred inset to full bleed.
    timeline.to(img, { clipPath: 'inset(0% 0% 0% 0% round 0)', duration: 0.55 })

    // Hold the fully-revealed frame briefly before swapping copy. Both
    // visibility toggles are plain GSAP .set() calls (not a one-shot
    // onComplete callback) so they apply/unapply correctly when the user
    // scrubs backward through this point, not just moving forward.
    if (copyMission) {
      timeline.to(copyMission, { opacity: 0, y: -10, duration: 0.12 }, 0.62)
      timeline.set(copyMission, { visibility: 'hidden' }, 0.74)
    }
    if (copyVision) {
      timeline.set(copyVision, { visibility: 'visible' }, 0.62)
      timeline.to(copyVision, { opacity: 1, y: 0, duration: 0.18 }, 0.68)
    }
    timeline.to({}, { duration: 0.14 })

    tl = timeline
    trigger = timeline.scrollTrigger ?? null
    refreshScrollTriggers()

    // The pin/scrub start-end is measured off live layout at refresh time —
    // if the mission photo hasn't finished loading yet, the page is still
    // shorter than its final height, so the trigger's start/end land stale
    // (progress then reads wrong for the rest of the session). Re-refresh
    // once it's actually in.
    const imgEl = img as HTMLImageElement
    if (!imgEl.complete) {
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
    resizeTimer = setTimeout(() => sync(), 160)
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
