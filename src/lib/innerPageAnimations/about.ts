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

const MV_MQ = '(max-width: 900px)'
const START_SCALE = 0.42
const START_Y_VH = 0.78
const SCRUB_VH = 1.65
const GROW_DUR = 0.85

export function initMissionVision(): () => void {
  const root = document.querySelector<HTMLElement>('[data-mv-scroll], .au2-mv')
  if (!root) return () => {}

  /* Inner pages use stacked static panels (inner-pages.css) — skip pin/scrub. */
  if (document.querySelector('.app--inner')) {
    root.classList.add('is-static')
    return () => {
      root.classList.remove('is-static')
    }
  }

  const pin = root.querySelector<HTMLElement>('[data-mv-pin]')
  const frame = root.querySelector<HTMLElement>('[data-mv-frame]')
  const thesis = root.querySelector<HTMLElement>('[data-mv-thesis]')
  const imgMission = root.querySelector<HTMLElement>('[data-mv-img="mission"]')
  const imgVision = root.querySelector<HTMLElement>('[data-mv-img="vision"]')
  const panelMission = root.querySelector<HTMLElement>('[data-mv-panel="mission"]')
  const panelVision = root.querySelector<HTMLElement>('[data-mv-panel="vision"]')
  if (!pin || !frame) return () => {}

  const missionFades = panelMission
    ? Array.from(panelMission.querySelectorAll<HTMLElement>('[data-mv-fade]'))
    : []
  const visionFades = panelVision
    ? Array.from(panelVision.querySelectorAll<HTMLElement>('[data-mv-fade]'))
    : []

  let mode: 'desktop' | 'mobile' | 'reduced' | null = null
  let tween: gsap.core.Timeline | null = null
  let mobileObserver: IntersectionObserver | null = null
  const triggers: ST[] = []
  const cleanups: (() => void)[] = []

  function isMobile() {
    return window.matchMedia(MV_MQ).matches
  }

  function startY() {
    return Math.round(window.innerHeight * START_Y_VH)
  }

  function layoutMetrics() {
    const w = window.innerWidth
    const h = window.innerHeight
    const left = w * 0.02
    const width = w * 0.46
    const sideLeft = w - left - width
    return {
      top: h * 0.04,
      left,
      width,
      height: h * 0.92,
      sideX: sideLeft - left,
    }
  }

  function killDesktop() {
    if (tween) {
      tween.kill()
      tween = null
    }
    triggers.forEach((t) => t.kill())
    triggers.length = 0
    const clearTargets = [
      frame,
      thesis,
      imgMission,
      imgVision,
      panelMission,
      panelVision,
      ...missionFades,
      ...visionFades,
    ].filter(Boolean) as gsap.TweenTarget[]
    gsap.set(clearTargets, { clearProps: 'all' })
    imgMission?.classList.add('is-active')
    imgVision?.classList.remove('is-active')
    root!.classList.remove('is-ready', 'is-static')
  }

  function killMobile() {
    mobileObserver?.disconnect()
    mobileObserver = null
    root!.querySelectorAll('.au2-mv__panel.is-in').forEach((el) => {
      el.classList.remove('is-in')
    })
  }

  function applyReduced() {
    killDesktop()
    killMobile()
    root!.classList.add('is-reduced')
    root!.classList.remove('is-ready')
    imgVision?.classList.add('is-active')
    imgMission?.classList.remove('is-active')
  }

  function setupMobile() {
    killDesktop()
    root!.classList.remove('is-ready', 'is-static', 'is-reduced')
    const panels = root!.querySelectorAll('.au2-mv__panel')
    mobileObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            mobileObserver?.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.28, rootMargin: '0px 0px -8% 0px' },
    )
    panels.forEach((p) => mobileObserver!.observe(p))
  }

  function setupDesktop() {
    killDesktop()
    killMobile()
    root!.classList.remove('is-reduced', 'is-static')

    const box = layoutMetrics()
    gsap.set(frame, {
      top: box.top,
      left: box.left,
      width: box.width,
      height: box.height,
      x: 0,
      y: startY(),
      scale: START_SCALE,
      transformOrigin: 'center bottom',
      borderRadius: 0,
      force3D: true,
    })
    if (thesis) gsap.set(thesis, { opacity: 1, y: 0, scale: 1 })
    gsap.set(missionFades, { opacity: 0, y: 48, x: 0 })
    gsap.set(visionFades, { opacity: 0, x: -56, y: 0 })
    gsap.set(imgMission, {
      opacity: 1,
      scale: 1.12,
      transformOrigin: 'center bottom',
    })
    gsap.set(imgVision, {
      opacity: 0,
      scale: 1.12,
      transformOrigin: 'center bottom',
    })
    imgMission?.classList.add('is-active')
    imgVision?.classList.remove('is-active')
    root!.classList.add('is-ready')

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * SCRUB_VH)}`,
        pin,
        pinSpacing: true,
        pinType: 'transform',
        scrub: true,
        anticipatePin: 0,
        invalidateOnRefresh: true,
      },
    })

    if (thesis) {
      tl.to(
        thesis,
        {
          opacity: 0,
          y: () => -Math.round(window.innerHeight * 0.32),
          scale: 0.94,
          duration: GROW_DUR,
        },
        0,
      )
    }
    tl.to(frame, { y: 0, scale: 1, duration: GROW_DUR }, 0)
    tl.to(imgMission, { scale: 1, duration: GROW_DUR }, 0)
    if (imgVision) tl.to(imgVision, { scale: 1, duration: GROW_DUR }, 0)

    missionFades.forEach((el, i) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.5 }, GROW_DUR * 0.55 + i * 0.06)
    })
    tl.to({}, { duration: 0.18 }, GROW_DUR + 0.25)

    const slideAt = GROW_DUR + 0.45
    tl.to(frame, { x: () => layoutMetrics().sideX, duration: 0.9 }, slideAt)
    missionFades.forEach((el, i) => {
      tl.to(el, { opacity: 0, y: -8, duration: 0.4 }, slideAt + 0.06 + i * 0.035)
    })
    visionFades.forEach((el, i) => {
      tl.to(el, { opacity: 1, x: 0, duration: 0.5 }, slideAt + 0.22 + i * 0.06)
    })
    if (imgMission && imgVision) {
      tl.to(imgMission, { opacity: 0, duration: 0.5 }, slideAt + 0.15)
      tl.to(imgVision, { opacity: 1, scale: 1, duration: 0.5 }, slideAt + 0.15)
    }
    tl.to({}, { duration: 0.2 })

    tween = tl
    if (tl.scrollTrigger) triggers.push(tl.scrollTrigger)
    refreshScrollTriggers()
  }

  function syncMode(force = false) {
    const next = prefersReducedMotion()
      ? 'reduced'
      : isMobile()
        ? 'mobile'
        : 'desktop'
    if (!force && next === mode) {
      if (next === 'desktop') ScrollTrigger.refresh()
      return
    }
    mode = next
    if (next === 'reduced') applyReduced()
    else if (next === 'mobile') setupMobile()
    else setupDesktop()
  }

  syncMode(true)

  let resizeTimer: ReturnType<typeof setTimeout>
  const onResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const next = prefersReducedMotion()
        ? 'reduced'
        : isMobile()
          ? 'mobile'
          : 'desktop'
      if (next !== mode) syncMode(true)
      else if (mode === 'desktop') setupDesktop()
    }, 160)
  }
  window.addEventListener('resize', onResize)
  cleanups.push(() => window.removeEventListener('resize', onResize))

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onReduceChange = () => syncMode(true)
  reduceMq.addEventListener('change', onReduceChange)
  cleanups.push(() => reduceMq.removeEventListener('change', onReduceChange))

  return () => {
    cleanups.forEach((fn) => fn())
    killDesktop()
    killMobile()
    root.classList.remove('is-ready', 'is-static', 'is-reduced')
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
