import {
  LOOP_CAM_SCALE_VALUES,
  LOOP_END_TIP_HIDE,
  LOOP_PATH_LOWEST_ARTBOARD,
  LOOP_START_FOCUS,
  LOOP_STEPS,
  artboardToContainerFraction,
  loopCamEase,
  loopCamKeys,
  loopClampFocusY,
  loopCopyVisible,
  loopDrawProgress,
  loopFocusYCeil,
  loopFocusYFloor,
  loopRingVisible,
  loopStrokeEdgePx,
  mapPathPointToArtboard,
  resolveLoopDrawStart,
  samplePathTipLocal,
} from './loopPath'
import {
  editorialPinType,
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
  ScrollTrigger,
} from './innerPageAnimations/shared'
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'

/** Pin travel — one full circuit around the closed loop. */
const LOOP_PIN_VH_DESKTOP = 3.2
const LOOP_PIN_VH_MOBILE = 3.6
const LOOP_SCRUB = true
const LOOP_CAM_DAMP = 0.48
const REVEAL_EASE = 'power2.out'
const STEP_ARRIVE_BIAS = 0.015

type InitLoopOptions = {
  innerPage?: boolean
}

function revealLoopHeader(
  targets: gsap.TweenTarget,
  trigger: Element | string,
) {
  if (!targets || (Array.isArray(targets) && targets.length === 0)) return

  if (prefersReducedMotion()) {
    gsap.set(targets, { autoAlpha: 1, y: 0, filter: 'blur(0px)' })
    return
  }

  gsap.from(targets, {
    autoAlpha: 0,
    y: 32,
    filter: 'blur(8px)',
    duration: 1.05,
    stagger: 0.11,
    ease: REVEAL_EASE,
    scrollTrigger: {
      trigger,
      start: 'top 82%',
      toggleActions: 'play none none reverse',
    },
  })
}

/**
 * The Loop — pin + closed-path draw + camera orbit (Signal → Build → Run).
 */
export function initLoop(options: InitLoopOptions = {}): () => void {
  const { innerPage = false } = options
  const loopSection = document.querySelector(
    '[data-section="loop"]',
  ) as HTMLElement | null
  if (!loopSection) return () => {}

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
  const stepThresholds = steps.map((el) => Number(el.dataset.s) || 0)

  const loopHeadBits = gsap.utils.toArray<Element>(
    loopSection.querySelectorAll(
      '.loop__header .section-head__eyebrow, .loop__header .section-head__title',
    ),
  )
  revealLoopHeader(loopHeadBits, loopSection)

  const reduceMotionLoop = prefersReducedMotion()
  let scrollTrigger: ST | null = null
  const cleanups: (() => void)[] = []

  if (drawn && camera && viewport && steps.length && !reduceMotionLoop) {
    const svg = loopSection.querySelector('.loop__svg') as SVGSVGElement | null
    const tipEl = loopSection.querySelector(
      '[data-loop-tip]',
    ) as SVGCircleElement | null
    const pathLen = drawn.getTotalLength()
    resolveLoopDrawStart(drawn)

    gsap.set(drawn, {
      strokeDasharray: pathLen,
      strokeDashoffset: pathLen,
    })

    const setDash = gsap.quickSetter(drawn, 'strokeDashoffset')
    const setCamera = (transform: string) => {
      camera.style.transform = transform
    }

    const CAM_SCALES = LOOP_CAM_SCALE_VALUES
    const CAM_KEYS = loopCamKeys()

    const stepPoints = () =>
      steps.map((el, i) => {
        const fx = Number(el.dataset.focusX)
        const fy = Number(el.dataset.focusY)
        if (Number.isFinite(fx) && Number.isFinite(fy)) {
          return { x: fx, y: fy }
        }
        const fallback = LOOP_STEPS[i]
        if (!svg || !fallback) return { x: LOOP_START_FOCUS.x, y: LOOP_START_FOCUS.y }
        return artboardToContainerFraction(svg, fallback.x, fallback.y)
      })

    const tipScreenPoint = (progress: number) => {
      if (!svg) return LOOP_START_FOCUS
      const local = samplePathTipLocal(drawn, progress)
      if (!local) return LOOP_START_FOCUS
      const art = mapPathPointToArtboard(local.x, local.y)
      return artboardToContainerFraction(svg, art.x, art.y)
    }

    const syncTipGraphics = (progress: number) => {
      const tipDist = progress * pathLen
      setDash(pathLen - tipDist)

      const tip = samplePathTipLocal(drawn, progress)
      if (tipEl && tip) {
        tipEl.setAttribute('cx', String(tip.x))
        tipEl.setAttribute('cy', String(tip.y))
        tipEl.style.opacity =
          progress <= 0.001 || progress >= LOOP_END_TIP_HIDE ? '0' : '1'
      }
    }

    const lowestScreenY = () => {
      if (!svg) return LOOP_START_FOCUS.y
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
      const floor = loopFocusYFloor(lowestScreenY(), scale, vh, ch, edge)
      const startPt = tipScreenPoint(0)
      const ceil = loopFocusYCeil(startPt.y, scale, vh, ch)
      return { floor, ceil, startPt }
    }

    const loopCentroid = () => {
      const pts = stepPoints()
      if (!pts.length) return LOOP_START_FOCUS
      const x = pts.reduce((sum, p) => sum + p.x, 0) / pts.length
      const y = pts.reduce((sum, p) => sum + p.y, 0) / pts.length
      return { x, y }
    }

    const focusTargets = () => {
      const pts = stepPoints()
      const signal = pts[0] ?? loopCentroid()
      const build = pts[1] ?? signal
      const run = pts[2] ?? build
      const center = loopCentroid()

      const soft = (
        a: { x: number; y: number },
        b: { x: number; y: number },
        t: number,
      ) => ({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      })

      const clampY = (focus: { x: number; y: number }, scale: number) => {
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
        clampY(soft(center, signal, 0.35), CAM_SCALES[0]),
        clampY(soft(center, build, 0.4), CAM_SCALES[1]),
        clampY(soft(center, run, 0.4), CAM_SCALES[2]),
        clampY(center, CAM_SCALES[3]),
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
          const fx = gsap.utils.interpolate(targets[i].x, targets[i + 1].x, t)
          const fy = gsap.utils.interpolate(targets[i].y, targets[i + 1].y, t)
          applyCamera({ x: fx, y: fy }, scale, immediate)
          return
        }
      }
      const last = targets[targets.length - 1]
      applyCamera(last, CAM_SCALES[CAM_SCALES.length - 1], immediate)
    }

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

    scrollTrigger = ScrollTrigger.create({
      trigger: loopSection,
      start: 'top top',
      end: () => `+=${window.innerHeight * pinVh()}`,
      pin: true,
      pinSpacing: true,
      ...(innerPage ? { pinType: editorialPinType() } : {}),
      scrub: LOOP_SCRUB,
      anticipatePin: 0,
      invalidateOnRefresh: true,
      onUpdate: (self) => sync(loopDrawProgress(self.progress)),
      onRefresh: (self) => {
        camLive.primed = false
        sync(loopDrawProgress(self.progress), true)
      },
    })

    sync(0, true)
    refreshScrollTriggers()
  } else if (reduceMotionLoop) {
    loopSection.classList.add('is-static')
    if (drawn) {
      const len = drawn.getTotalLength()
      gsap.set(drawn, {
        strokeDasharray: len,
        strokeDashoffset: 0,
      })
    }
    const tipEl = loopSection.querySelector(
      '[data-loop-tip]',
    ) as SVGCircleElement | null
    if (tipEl) {
      tipEl.style.opacity = '0'
    }
    steps.forEach((step) => {
      step.classList.toggle('is-active', false)
      step.classList.toggle('is-reached', true)
      step.classList.toggle('is-copy-visible', true)
    })
  }

  return () => {
    cleanups.forEach((fn) => fn())
    scrollTrigger?.kill()
    scrollTrigger = null
    loopSection.classList.remove('is-loop-ready', 'is-static')
    delete loopSection.dataset.loopStage
    if (drawn) {
      gsap.set(drawn, { clearProps: 'strokeDasharray,strokeDashoffset' })
    }
    if (camera) {
      camera.style.removeProperty('transform')
      camera.style.removeProperty('--loop-cam-scale')
    }
    steps.forEach((step) => {
      step.classList.remove('is-reached', 'is-active', 'is-copy-visible')
    })
  }
}
