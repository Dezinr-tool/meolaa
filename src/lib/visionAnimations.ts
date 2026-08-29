import {
  editorialPinType,
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
} from './innerPageAnimations/shared'

const REVEAL_EASE = 'power2.out'
const VISION_PIN_END = '+=140%'

/** Per-char spans for vision headline scroll highlight (opacity only — no y/blur). */
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

function revealVideoWrap(
  target: Element,
  trigger: Element,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    gsap.set(target, { autoAlpha: 1, y: 0, filter: 'blur(0px)' })
    return
  }

  gsap.fromTo(
    target,
    { autoAlpha: 0, y: 36, filter: 'blur(4px)' },
    {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 1,
      ease: REVEAL_EASE,
      scrollTrigger: {
        trigger,
        start: 'top 92%',
        toggleActions: 'play none none none',
      },
    },
  )
}

type InitVisionOptions = {
  /** Use transform pins for editorial inner pages (overflow-x: clip). */
  innerPage?: boolean
}

/**
 * Vision fold — video above copy in-fold → pin + scrub full-bleed expand +
 * per-char headline highlight. Shared by homepage and About.
 */
export function initVision(options: InitVisionOptions = {}): () => void {
  const { innerPage = false } = options
  const vision = document.querySelector('[data-section="vision"]')
  if (!vision) return () => {}

  const lines = gsap.utils.toArray<Element>('[data-vision-line]')
  const videoBox = document.querySelector('[data-video-box]') as HTMLElement | null
  const visionCopy = document.querySelector('.vision__copy') as HTMLElement | null
  const visionVideo = videoBox?.querySelector('video')
  const visionStage = document.querySelector('.vision__stage') as HTMLElement | null
  const visionVideoWrap = document.querySelector(
    '.vision__video-wrap',
  ) as HTMLElement | null

  if (!videoBox || !lines.length) return () => {}

  splitVisionLines(lines)
  const chars = gsap.utils.toArray<HTMLElement>('.vision__char')
  const reduceMotion = prefersReducedMotion()

  gsap.set(chars, { opacity: reduceMotion ? 1 : 0.14 })
  visionVideo?.play().catch(() => {})

  if (visionVideoWrap) {
    revealVideoWrap(visionVideoWrap, vision, reduceMotion)
  }

  let scrollTrigger: ReturnType<typeof gsap.timeline>['scrollTrigger'] | null = null

  if (!reduceMotion) {
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

    const resetVisionScrubVisuals = () => {
      if (visionCopy) {
        gsap.set(visionCopy, { clearProps: 'opacity,transform' })
      }
      gsap.set(chars, { opacity: 0.14 })
    }

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
        pinSpacing: innerPage ? true : undefined,
        pinType: innerPage ? editorialPinType() : undefined,
        scrub: true,
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

    scrollTrigger = vtl.scrollTrigger ?? null

    vtl.fromTo(
      chars,
      { opacity: 0.14 },
      {
        opacity: 1,
        duration: 0.08,
        stagger: 0.006,
        ease: 'power1.out',
      },
      0,
    )

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

    refreshScrollTriggers()
  }

  return () => {
    scrollTrigger?.kill()
    gsap.killTweensOf([visionCopy, visionVideoWrap, videoBox, chars].filter(Boolean))
    gsap.set([visionCopy, visionVideoWrap, videoBox, chars].filter(Boolean), {
      clearProps: 'all',
    })
  }
}
