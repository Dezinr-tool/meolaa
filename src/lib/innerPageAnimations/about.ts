import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'
import {
  editorialPinType,
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
  scrollToY,
  ScrollTrigger,
} from './shared'

const SCRUB = 0.55
const PIN_VH = 2.4

export function initAboutRoadmap(): () => void {
  const root = document.querySelector<HTMLElement>('[data-au-roadmap]')
  if (!root) return () => {}

  const pin = root.querySelector<HTMLElement>('[data-au-roadmap-pin]')
  const track = root.querySelector<HTMLElement>('[data-au-roadmap-track]')
  const steps = Array.from(
    root.querySelectorAll<HTMLElement>('[data-au-roadmap-step]'),
  )
  if (!pin || !track || !steps.length) return () => {}

  let tween: gsap.core.Tween | null = null
  let lastIndex = -1
  let mode: 'static' | 'scrub' | null = null
  const cleanups: (() => void)[] = []

  function isNarrow() {
    return window.matchMedia('(max-width: 720px)').matches
  }

  function setActive(index: number) {
    const i = Math.max(0, Math.min(steps.length - 1, index))
    if (i === lastIndex) return
    lastIndex = i
    steps.forEach((el, n) => {
      const on = n === i
      el.classList.toggle('is-active', on)
      el.setAttribute('aria-current', on ? 'step' : 'false')
    })
  }

  function progressToIndex(p: number) {
    const n = steps.length
    if (n <= 1) return 0
    return Math.round(p * (n - 1))
  }

  function scrubDistance() {
    const byVh = window.innerHeight * PIN_VH
    const lagBuffer = window.innerHeight * (SCRUB + 0.25)
    return Math.round(Math.max(byVh, window.innerHeight * 1.6) + lagBuffer)
  }

  function applySectionTravelHeight() {
    const dist = scrubDistance()
    root!.style.setProperty('--au-rm-pin-travel', `${dist}px`)
    root!.style.minHeight = `calc(100vh + ${dist}px)`
    return dist
  }

  function killTween() {
    if (tween) {
      tween.scrollTrigger?.kill()
      tween.kill()
      tween = null
    }
    if (!root) return
    root.style.removeProperty('--au-rm-pin-travel')
    root.style.removeProperty('min-height')
    root.classList.remove('is-pinning')
  }

  function scrollActiveIntoView(index: number) {
    if (!isNarrow()) return
    const el = steps[index]
    if (!el) return
    const left = el.offsetLeft - (track!.clientWidth - el.offsetWidth) / 2
    track!.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }

  function buildScrub() {
    killTween()
    root!.classList.remove('is-static')
    root!.classList.add('is-ready')
    applySectionTravelHeight()

    const state = { value: 0 }
    tween = gsap.to(state, {
      value: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: () => `+=${applySectionTravelHeight()}`,
        scrub: SCRUB,
        pin,
        pinSpacing: true,
        pinType: 'transform',
        anticipatePin: 0,
        invalidateOnRefresh: true,
        fastScrollEnd: true,
        onEnter: () => root!.classList.add('is-pinning'),
        onEnterBack: () => root!.classList.add('is-pinning'),
        onLeave: () => root!.classList.remove('is-pinning'),
        onLeaveBack: () => root!.classList.remove('is-pinning'),
        onRefresh: () => {
          applySectionTravelHeight()
          setActive(progressToIndex(state.value))
        },
      },
      onUpdate: () => {
        const idx = progressToIndex(state.value)
        setActive(idx)
        if (isNarrow()) scrollActiveIntoView(idx)
      },
    })

    setActive(0)
  }

  function buildStatic() {
    killTween()
    root!.classList.add('is-ready', 'is-static')
    setActive(0)
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
      if (mode !== 'scrub' || !tween?.scrollTrigger) {
        setActive(i)
        scrollActiveIntoView(i)
        return
      }
      const st = tween.scrollTrigger as ST
      const p = steps.length <= 1 ? 0 : i / (steps.length - 1)
      scrollToY(st.start + (st.end - st.start) * p)
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
      else if (mode === 'scrub') {
        applySectionTravelHeight()
        ScrollTrigger.refresh()
      }
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
    killTween()
    root.classList.remove('is-ready', 'is-static', 'is-pinning')
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
      borderRadius: 32,
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
  if (!pillars || prefersReducedMotion()) return () => {}

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
