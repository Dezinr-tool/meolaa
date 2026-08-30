/**
 * Homepage scroll interactions — ported from prototype main.js.
 */
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '../../lib/motion'
import { getLenisInstance } from '../../lib/lenisInstance'
import {
  LOOP_CAM_KEYS,
  LOOP_CAM_SCALE_VALUES,
  LOOP_START_FOCUS,
  LOOP_STEPS,
  LOOP_TIP_FADE,
  PATH_ENTRY,
  artboardToContainerFraction,
  loopCopyVisible,
  loopDrawProgress,
  samplePathTipLocal,
} from '../../lib/loopPath'
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'
import type Lenis from 'lenis'

/* ——— The Loop ——— */
/** Pin travel — enough scroll for draw + three camera beats. */
const LOOP_PIN_VH_DESKTOP = 3
const LOOP_PIN_VH_MOBILE = 3.4
const LOOP_SCRUB = 0.65

const NAV_GLASS_Y = 40
const NAV_HIDE_Y = 72
const NAV_TOP_Y = 8

const REVEAL_EASE = 'power2.out'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type RevealOpts = {
  start?: string
  end?: string
  y?: number
  blur?: number
  duration?: number
  stagger?: number
  delay?: number
  scale?: number
  scrub?: boolean | number
  toggleActions?: string
}

/** Fade-up / blur reveal on scroll enter — skipped when prefers-reduced-motion. */
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
  } = opts

  const from: gsap.TweenVars = {
    autoAlpha: 0,
    y,
    filter: blur > 0 ? `blur(${blur}px)` : 'blur(0px)',
  }
  if (scale !== 1) from.scale = scale * 0.96

  const to: gsap.TweenVars = {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    duration,
    ease: REVEAL_EASE,
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

function mixArrowColor(t: number) {
  const r = gsap.utils.interpolate(255, 10, t)
  const g = gsap.utils.interpolate(255, 48, t)
  const b = gsap.utils.interpolate(255, 56, t)
  const a = gsap.utils.interpolate(1, 0.22, t)
  return `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a.toFixed(2)})`
}

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

      const syncNav = (y: number, direction: 1 | -1 | 0) => {
        if (!siteNav) return
        siteNav.classList.toggle('is-scrolled', y > NAV_GLASS_Y)

        if (y <= NAV_TOP_Y) {
          siteNav.classList.remove('is-hidden')
          lastY = y
          return
        }

        const dir = direction !== 0 ? direction : y > lastY ? 1 : y < lastY ? -1 : 0
        if (dir === 1 && y > NAV_HIDE_Y) {
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
      const whereNext = document.querySelector('[data-section="where-next"]')
      const reduceMotion = prefersReducedMotion()

      /* ——— Hero: headline + panel settle on load ——— */
      if (hero && !reduceMotion) {
        const headlineSpans = gsap.utils.toArray<Element>(
          hero.querySelectorAll('.hero__headline span'),
        )
        const panel = hero.querySelector('.hero__panel')
        gsap.from([...headlineSpans, panel].filter(Boolean), {
          autoAlpha: 0,
          y: 32,
          filter: 'blur(8px)',
          duration: 1.05,
          stagger: 0.11,
          ease: REVEAL_EASE,
          delay: 0.2,
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
      const VISION_SCRUB = 0.8

      if (vision && videoBox && lines.length) {
        splitVisionLines(lines)
        const chars = gsap.utils.toArray<HTMLElement>('.vision__char')
        const reduceMotionVision = reduceMotion

        gsap.set(chars, { opacity: 0.14, filter: 'blur(5px)' })
        visionVideo?.play().catch(() => {})

        if (visionVideoWrap && !reduceMotionVision) {
          revealOnEnter(visionVideoWrap, vision, {
            start: 'top 92%',
            y: 36,
            blur: 4,
            duration: 1,
            scale: 1,
          })
        }

        if (reduceMotionVision) {
          gsap.set(chars, { opacity: 1, filter: 'blur(0px)' })
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
                'position,top,left,width,height,maxWidth,maxHeight,inset,display,padding,margin,zIndex,borderRadius,x,y',
            })
          }

          /** Freeze video-above-copy geometry once the pin is active / in view. */
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
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onEnter: lockInFoldLayout,
              onEnterBack: lockInFoldLayout,
              onRefresh: (self) => {
                if (self.progress === 0) {
                  clearLayoutLock()
                  if (self.isActive) lockInFoldLayout()
                }
              },
            },
          })

          /* Brief type settle while both video + copy still read in-fold. */
          vtl.fromTo(
            chars,
            { opacity: 0.14, filter: 'blur(5px)' },
            {
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.08,
              stagger: 0.006,
              ease: 'power1.out',
            },
            0,
          )

          /* Copy yields as the frame starts expanding. */
          if (visionCopy) {
            vtl.to(
              visionCopy,
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
        const header = loopSection.querySelector('.loop__header')
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

        if (header) {
          gsap.fromTo(
            header,
            { opacity: 0.35, y: 30 },
            {
              opacity: 1,
              y: 0,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: loopSection,
                start: 'top 78%',
                end: 'top 40%',
                scrub: 1,
              },
            },
          )
        }

        const reduceMotionLoop = reduceMotion

        if (drawn && camera && viewport && steps.length && !reduceMotionLoop) {
          const svg = loopSection.querySelector('.loop__svg') as SVGSVGElement | null
          const tip = loopSection.querySelector(
            '[data-loop-tip]',
          ) as SVGCircleElement | null
          const gradient = loopSection.querySelector(
            '[data-loop-gradient]',
          ) as SVGLinearGradientElement | null
          const pathLen = drawn.getTotalLength()
          gsap.set(drawn, {
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen * (1 - loopDrawProgress(0)),
          })

          const setDash = gsap.quickSetter(drawn, 'strokeDashoffset')
          const setCamera = gsap.quickSetter(camera, 'transform')

          /* Timeline segments (progress 0→1) — keys/scales from loopPath.ts */
          const CAM_SCALES = LOOP_CAM_SCALE_VALUES
          const CAM_KEYS = LOOP_CAM_KEYS

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

          const focusTargets = () => {
            const pts = stepPoints()
            return [
              LOOP_START_FOCUS,
              LOOP_START_FOCUS,
              pts[1] ?? LOOP_START_FOCUS,
              pts[2] ?? pts[1] ?? LOOP_START_FOCUS,
              pts[2] ?? LOOP_START_FOCUS,
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
            return `translate3d(${x}px, ${y}px, 0) scale(${scale})`
          }

          const cameraAt = (progress: number) => {
            const targets = focusTargets()
            const apply = (
              focus: { x: number; y: number },
              scale: number,
            ) => {
              camera.style.setProperty('--loop-cam-scale', String(scale))
              return cameraTransform(focus, scale)
            }
            for (let i = 0; i < CAM_KEYS.length - 1; i += 1) {
              const a = CAM_KEYS[i]
              const b = CAM_KEYS[i + 1]
              if (progress <= b) {
                const t = b === a ? 0 : (progress - a) / (b - a)
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
                return apply({ x: fx, y: fy }, scale)
              }
            }
            const last = targets[targets.length - 1]
            return apply(last, CAM_SCALES[CAM_SCALES.length - 1])
          }

          let lastStage = -2

          const activeIndex = (progress: number) => {
            let idx = -1
            for (let i = 0; i < stepThresholds.length; i += 1) {
              if (progress >= stepThresholds[i] - 0.015) idx = i
            }
            return idx
          }

          const applyStepFocus = (stage: number) => {
            loopSection.dataset.loopStage = String(stage)
            steps.forEach((step, i) => {
              step.classList.toggle('is-active', i === stage)
              step.classList.toggle('is-reached', i <= stage && stage >= 0)
              step.classList.toggle('is-copy-visible', loopCopyVisible(i, stage))
            })
          }

          const syncTipFade = (progress: number) => {
            if (!gradient) return
            const tipLen = pathLen * progress
            const fadeLen = pathLen * LOOP_TIP_FADE
            const behindLen = Math.max(0, tipLen - fadeLen)
            const tipPt = drawn.getPointAtLength(tipLen)
            const behindPt = drawn.getPointAtLength(behindLen)
            gradient.setAttribute('x1', String(behindPt.x))
            gradient.setAttribute('y1', String(behindPt.y))
            gradient.setAttribute('x2', String(tipPt.x))
            gradient.setAttribute('y2', String(tipPt.y))
          }

          const sync = (progress: number) => {
            setDash(pathLen * (1 - progress))
            setCamera(cameraAt(progress))
            syncTipFade(progress)

            if (tip) {
              const local = samplePathTipLocal(drawn, progress)
              if (local && progress > 0.002) {
                tip.setAttribute('cx', String(local.x))
                tip.setAttribute('cy', String(local.y))
                tip.setAttribute('opacity', progress >= 0.998 ? '0' : '1')
              } else {
                tip.setAttribute('opacity', '0')
              }
            }

            const stage = activeIndex(progress)
            steps.forEach((step, i) => {
              const atHead =
                Math.abs(progress - stepThresholds[i]) < 0.02
              step.classList.toggle('is-at-head', atHead)
            })
            if (stage !== lastStage) {
              lastStage = stage
              applyStepFocus(stage)
            }

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
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => sync(loopDrawProgress(self.progress)),
            onRefresh: (self) => {
              lastStage = -2
              sync(loopDrawProgress(self.progress))
            },
          })

          sync(loopDrawProgress(0))
        } else if (reduceMotionLoop) {
          loopSection.classList.add('is-static')
          if (drawn) {
            const pathLen = drawn.getTotalLength()
            gsap.set(drawn, {
              strokeDasharray: pathLen,
              strokeDashoffset: 0,
            })
          }
          steps.forEach((step, i) => {
            step.classList.toggle('is-active', i === steps.length - 1)
            step.classList.toggle('is-reached', true)
            step.classList.toggle('is-copy-visible', true)
          })
        }
      }

      /* ——— Lab: intro stagger + rail panels rise ——— */
      if (lab) {
        const labIntroBits = gsap.utils.toArray<Element>(
          lab.querySelectorAll(
            '.meola-lab__eyebrow, .meola-lab__mark, .meola-lab__headline',
          ),
        )
        revealOnEnter(labIntroBits, lab, {
          start: 'top 88%',
          y: 24,
          blur: 4,
          stagger: 0.1,
          duration: 0.8,
        })

        const labPanels = gsap.utils.toArray<Element>(
          lab.querySelectorAll('.meola-lab__panel'),
        )
        revealOnEnter(labPanels, lab, {
          start: 'top 82%',
          y: 48,
          blur: 0,
          stagger: 0.07,
          duration: 0.9,
        })
      }

      /* ——— Founding story ——— */
      if (founding) {
        const foundingCopy = gsap.utils.toArray<Element>(
          founding.querySelectorAll(
            '.founding__eyebrow, .founding__text h2, .founding__body, .founding__text .hero__btn',
          ),
        )
        revealOnEnter(foundingCopy, founding, {
          start: 'top 85%',
          y: 26,
          blur: 5,
          stagger: 0.1,
          duration: 0.85,
        })

        const foundingImg = founding.querySelector('.founding__media img')
        if (foundingImg) {
          revealOnEnter(foundingImg, founding, {
            start: 'top 80%',
            y: 0,
            blur: 3,
            scale: 1.04,
            duration: 1.1,
          })
        }
      }

      /* ——— Portfolio title ——— */
      const portfolioTitle = document.querySelector('.portfolio-title h2')
      if (portfolioTitle && portfolio) {
        if (reduceMotion) {
          gsap.set(portfolioTitle, { filter: 'blur(0px)', opacity: 1, y: 0 })
        } else {
          gsap.fromTo(
            portfolioTitle,
            { filter: 'blur(9px)', opacity: 0.55, y: 24 },
            {
              filter: 'blur(0px)',
              opacity: 1,
              y: 0,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: '.portfolio-title',
                start: 'top 75%',
                end: 'top 25%',
                scrub: 1,
              },
            },
          )
        }

        const portfolioShapes = gsap.utils.toArray<Element>(
          portfolio.querySelectorAll('.portfolio__shape'),
        )
        revealOnEnter(portfolioShapes, portfolio, {
          start: 'top 90%',
          y: 0,
          blur: 0,
          scale: 1,
          stagger: 0.06,
          duration: 1.15,
        })

        const portfolioIntroBits = gsap.utils.toArray<Element>(
          portfolio.querySelectorAll(
            '.portfolio__intro .section-head__eyebrow, .portfolio__intro .section-head__sub, .portfolio__cats',
          ),
        )
        revealOnEnter(portfolioIntroBits, portfolio, {
          start: 'top 82%',
          y: 20,
          blur: 4,
          stagger: 0.08,
          duration: 0.75,
        })

        const portfolioDeck = portfolio.querySelector('.portfolio__deck')
        if (portfolioDeck) {
          revealOnEnter(portfolioDeck, portfolio, {
            start: 'top 78%',
            y: 40,
            blur: 5,
            duration: 1,
          })
        }

        const portfolioChrome = portfolio.querySelector('.portfolio__chrome')
        if (portfolioChrome) {
          revealOnEnter(portfolioChrome, portfolio, {
            start: 'top 72%',
            y: 16,
            blur: 0,
            duration: 0.7,
            delay: 0.12,
          })
        }
      } else if (portfolioTitle) {
        gsap.fromTo(
          portfolioTitle,
          { filter: 'blur(9px)', opacity: 0.55, y: 24 },
          {
            filter: 'blur(0px)',
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.portfolio-title',
              start: 'top 75%',
              end: 'top 25%',
              scrub: 1,
            },
          },
        )
      }

      /* ——— Metrics ——— */
      const metricBlocks = gsap.utils.toArray<HTMLElement>('[data-metric]')
      if (metricBlocks.length) {
        if (reduceMotion) {
          gsap.set(metricBlocks, { clipPath: 'inset(0% 0 0 0)', autoAlpha: 1 })
        } else {
          gsap.set(metricBlocks, { clipPath: 'inset(100% 0 0 0)' })
          gsap.to(metricBlocks, {
            clipPath: 'inset(0% 0 0 0)',
            duration: 0.7,
            ease: 'power3.out',
            stagger: { each: 0.16, from: 'end' },
            scrollTrigger: {
              trigger: "[data-section='metrics']",
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          })

          gsap.from(
            metricBlocks.map((m) => m.querySelector('strong')).filter(Boolean),
            {
              autoAlpha: 0,
              y: 18,
              duration: 0.55,
              stagger: { each: 0.12, from: 'end' },
              ease: REVEAL_EASE,
              scrollTrigger: {
                trigger: "[data-section='metrics']",
                start: 'top 70%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        }
      }

      /* ——— Investors ——— */
      if (investors) {
        const investorCopy = gsap.utils.toArray<Element>(
          investors.querySelectorAll(
            '.section-head__eyebrow, .section-head__title, .section-head__sub, .btn-ghost',
          ),
        )
        revealOnEnter(investorCopy, investors, {
          start: 'top 85%',
          y: 24,
          blur: 4,
          stagger: 0.1,
          duration: 0.8,
        })

        const investorLogos = gsap.utils.toArray<Element>(
          investors.querySelectorAll('.investor-logos__item'),
        )
        revealOnEnter(investorLogos, investors, {
          start: 'top 78%',
          y: 20,
          blur: 0,
          stagger: 0.08,
          duration: 0.7,
          delay: 0.08,
        })
      }

      /* ——— Press ——— */
      if (press) {
        const pressHead = gsap.utils.toArray<Element>(
          press.querySelectorAll(
            '.press-feed__head .section-head__eyebrow, .press-feed__title, .press-feed__head .section-head__sub, .btn-ghost-dark',
          ),
        )
        revealOnEnter(pressHead, press, {
          start: 'top 86%',
          y: 26,
          blur: 5,
          stagger: 0.09,
          duration: 0.85,
        })

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

      /* ——— Where to next ——— */
      if (whereNext) {
        const whereHead = whereNext.querySelector('.section-head')
        if (whereHead) {
          revealOnEnter(whereHead, whereNext, {
            start: 'top 88%',
            y: 20,
            blur: 4,
            duration: 0.75,
          })
        }

        const whereCards = gsap.utils.toArray<Element>(
          whereNext.querySelectorAll('.pg-where-next__card'),
        )
        revealOnEnter(whereCards, whereNext, {
          start: 'top 82%',
          y: 28,
          blur: 0,
          stagger: 0.11,
          duration: 0.85,
        })
      }

      /* Portfolio deck interaction lives in PortfolioSection (one-fold stack). */

      requestAnimationFrame(() => {
        ScrollTrigger.sort()
        ScrollTrigger.refresh()
      })
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
