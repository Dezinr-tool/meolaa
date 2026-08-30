import {
  editorialPinType,
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
} from './innerPageAnimations/shared'

const REVEAL_EASE = 'power2.out'
const VISION_PIN_END = '+=140%'

/**
 * Lifestyle collage beat inside the Vision film. Autoplay from t=0 flashes
 * unrelated cuts ("From strategy", "A full stack", …) before this frame.
 */
const VISION_COLLAGE_TIME = 4.25

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

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
    if (img.complete) resolve()
  })
}

function whenVideoReady(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 1) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener('loadedmetadata', done)
      video.removeEventListener('error', done)
      resolve()
    }
    video.addEventListener('loadedmetadata', done, { once: true })
    video.addEventListener('error', done, { once: true })
    window.setTimeout(done, 1600)
  })
}

function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      video.removeEventListener('seeked', finish)
      resolve()
    }
    video.addEventListener('seeked', finish, { once: true })
    try {
      const duration = Number.isFinite(video.duration) ? video.duration : time
      video.currentTime = Math.min(time, Math.max(0, duration - 0.05))
    } catch {
      finish()
      return
    }
    window.setTimeout(finish, 900)
  })
}

/**
 * Keep the Vision media wrap covered until the collage poster is decoded and
 * (when possible) the film is parked on the collage beat — then reveal once.
 */
async function armVisionMedia(
  wrap: HTMLElement,
  video: HTMLVideoElement | null | undefined,
  reduceMotion: boolean,
): Promise<() => void> {
  const poster =
    wrap.querySelector<HTMLImageElement>('.vision__poster') ||
    (video?.getAttribute('poster')
      ? ({ src: video.getAttribute('poster')! } as HTMLImageElement)
      : null)

  const posterSrc =
    poster instanceof HTMLImageElement
      ? poster.currentSrc || poster.src
      : poster?.src

  if (posterSrc) await loadImage(posterSrc)

  const cleanups: Array<() => void> = []

  if (video) {
    await whenVideoReady(video)
    await seekVideo(video, VISION_COLLAGE_TIME)
    video.classList.add('is-armed')

    /* After a full-loop restart the film returns to t≈0 — jump back so the
       first visible cut stays the collage, not a random early frame.
       Drop .is-armed while seeking so the static collage poster shows. */
    const onTimeUpdate = () => {
      if (video.currentTime < VISION_COLLAGE_TIME - 0.05) {
        video.classList.remove('is-armed')
        try {
          video.currentTime = VISION_COLLAGE_TIME
        } catch {
          /* ignore */
        }
      }
    }
    const onSeeked = () => {
      if (video.currentTime >= VISION_COLLAGE_TIME - 0.05) {
        video.classList.add('is-armed')
      }
    }
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('seeked', onSeeked)
    cleanups.push(() => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('seeked', onSeeked)
    })
    video.play().catch(() => {})
  }

  /* Prime hidden state before lifting the CSS cover so nothing peeks. */
  gsap.set(wrap, { autoAlpha: 0, y: reduceMotion ? 0 : 36, filter: reduceMotion ? 'blur(0px)' : 'blur(4px)' })
  wrap.classList.add('is-ready')
  document.documentElement.dataset.visionMedia = 'ready'

  if (reduceMotion) {
    gsap.set(wrap, { autoAlpha: 1, y: 0, filter: 'blur(0px)' })
  } else {
    gsap.to(wrap, {
      autoAlpha: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 1,
      ease: REVEAL_EASE,
      overwrite: 'auto',
    })
  }

  return () => {
    cleanups.forEach((fn) => fn())
  }
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
  const visionVideo =
    videoBox?.querySelector<HTMLVideoElement>('video[data-vision-video]') ||
    videoBox?.querySelector('video')
  const visionStage = document.querySelector('.vision__stage') as HTMLElement | null
  const visionVideoWrap = document.querySelector(
    '.vision__video-wrap',
  ) as HTMLElement | null

  if (!videoBox || !lines.length) return () => {}

  splitVisionLines(lines)
  const chars = gsap.utils.toArray<HTMLElement>('.vision__char')
  const reduceMotion = prefersReducedMotion()

  gsap.set(chars, { opacity: reduceMotion ? 1 : 0.14 })

  /* Cover until collage is armed — never let t=0 of the film paint first. */
  if (visionVideoWrap) {
    gsap.set(visionVideoWrap, { autoAlpha: 0 })
  }

  let disposeMedia: (() => void) | null = null
  let cancelled = false

  if (visionVideoWrap) {
    void armVisionMedia(visionVideoWrap, visionVideo, reduceMotion).then(
      (dispose) => {
        if (cancelled) {
          dispose()
          return
        }
        disposeMedia = dispose
      },
    )
  } else {
    visionVideo?.play().catch(() => {})
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
      /* Re-hide only if media never finished arming (teardown / leave-back). */
      if (visionVideoWrap && !visionVideoWrap.classList.contains('is-ready')) {
        gsap.set(visionVideoWrap, { autoAlpha: 0 })
      }
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
        borderRadius: 0,
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
        borderRadius: 0,
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
    cancelled = true
    disposeMedia?.()
    delete document.documentElement.dataset.visionMedia
    visionVideoWrap?.classList.remove('is-ready')
    visionVideo?.classList.remove('is-armed')
    scrollTrigger?.kill()
    gsap.killTweensOf([visionCopy, visionVideoWrap, videoBox, chars].filter(Boolean))
    gsap.set([visionCopy, visionVideoWrap, videoBox, chars].filter(Boolean), {
      clearProps: 'all',
    })
  }
}
