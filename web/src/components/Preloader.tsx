/**
 * First-load full-screen preloader: SVG letter popcorn-pop (svgOrigin) → T/B curtain exit,
 * with a brand progress bar + percentage gated on load readiness.
 * Portals to document.body; hard timeout.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from '../lib/motion'
import { getLenisInstance } from '../lib/lenisInstance'
import {
  isPrismSceneReady,
  subscribePrismSceneReady,
} from '../lib/prismReady'
import { MeolaaLogoMark } from './brand/MeolaaLogoMark'
import './Preloader.css'

/** Tweak timing here (seconds, except *Ms fields). */
export const PRELOADER_TIMING = {
  /** Popcorn-pop char intro */
  pop: 0.4,
  popStagger: 0.04,
  hold: 0.18,
  /** Fade logo + progress before the curtain split */
  contentFade: 0.4,
  contentFadeEase: 'power2.in' as const,
  /** Top/bottom curtain split duration */
  curtain: 1.15,
  curtainEase: 'expo.inOut' as const,
  /** Start panels this many seconds before content fade ends */
  curtainOverlap: 0.1,
  /** Minimum time on screen before we allow 100% / exit */
  minDisplayMs: 2400,
  /** Always dismiss by this wall-clock time */
  fallbackMs: 5600,
  /** Display progress lerp factor per frame (~60fps) */
  progressLerp: 0.085,
  /** Cap displayed progress until assets + min time are ready */
  progressCap: 0.92,
  /**
   * Max wait for prism WebGL compile / first frames.
   * On timeout we proceed with curtain exit anyway (section may still paint late,
   * or stay empty if WebGL failed — HeroErrorBoundary already swallows crashes).
   */
  prismReadyTimeoutMs: 4500,
} as const

/** Above-fold / brand-critical assets worth tracking when present. */
const CRITICAL_IMAGE_HINTS = [
  '/assets/imgImage234.png',
  '/assets/logo-white.png',
  '/assets/pages/story-hero-portrait.jpg',
]

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function dismissBootPreloader() {
  const boot = document.getElementById('boot-preloader')
  if (!boot) return
  boot.setAttribute('data-taken-over', '1')
  boot.remove()
}

function lockScroll() {
  document.documentElement.classList.add('is-preloading')
  try {
    getLenisInstance()?.stop()
  } catch {
    /* Lenis not ready */
  }
}

function unlockScroll() {
  document.documentElement.classList.remove('is-preloading')
  try {
    getLenisInstance()?.start()
  } catch {
    /* Lenis gone */
  }
}

function documentScore(): number {
  const rs = document.readyState
  if (rs === 'complete') return 1
  if (rs === 'interactive') return 0.65
  return 0.2
}

function collectCriticalImages(): HTMLImageElement[] {
  const found = new Map<string, HTMLImageElement>()

  for (const img of Array.from(document.images)) {
    const src = img.currentSrc || img.src
    if (!src || src.startsWith('data:')) continue
    const hinted = CRITICAL_IMAGE_HINTS.some((hint) => src.includes(hint))
    // Prefer hinted assets; otherwise keep a small above-fold sample
    if (hinted || found.size < 8) {
      found.set(src, img)
    }
  }

  return Array.from(found.values())
}

function imagesScore(images: HTMLImageElement[]): number {
  if (images.length === 0) return 1
  let loaded = 0
  for (const img of images) {
    if (!img.complete) continue
    // complete with or without naturalWidth — broken URLs shouldn't stall
    loaded += 1
  }
  return loaded / images.length
}

function fontsScore(fontsReady: boolean): number {
  return fontsReady ? 1 : 0.15
}

function videoScore(): number {
  const video = document.querySelector('video')
  if (!video) return 1
  if (video.readyState >= 3) return 1 // HAVE_FUTURE_DATA+
  if (video.readyState >= 2) return 0.7
  if (video.readyState >= 1) return 0.4
  // Poster may count via images; give a soft floor so video never stalls forever
  return 0.2
}

/** Weighted real-ish load progress in [0, 1]. */
function computeRawProgress(
  images: HTMLImageElement[],
  fontsReady: boolean,
): number {
  const doc = documentScore()
  const fonts = fontsScore(fontsReady)
  const imgs = imagesScore(images)
  const vid = videoScore()

  // Document + fonts are always available; images/video soft-weight
  return doc * 0.28 + fonts * 0.22 + imgs * 0.35 + vid * 0.15
}

function formatPct(value01: number): string {
  return `${Math.round(Math.min(1, Math.max(0, value01)) * 100)}%`
}

export function Preloader() {
  const [active, setActive] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const topPanelRef = useRef<HTMLDivElement>(null)
  const bottomPanelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<SVGSVGElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const pctRef = useRef<HTMLSpanElement>(null)
  const finishedRef = useRef(false)
  const runIdRef = useRef(0)

  useEffect(() => {
    if (!active) return

    const runId = ++runIdRef.current
    finishedRef.current = false
    lockScroll()

    const finish = () => {
      if (finishedRef.current) return
      if (runId !== runIdRef.current) return
      finishedRef.current = true
      unlockScroll()
      setActive(false)
    }

    // Hard cap — set immediately so a missing ref / thrown setup never sticks
    const fallback = window.setTimeout(() => {
      if (barRef.current) gsap.set(barRef.current, { scaleX: 1 })
      if (pctRef.current) pctRef.current.textContent = '100%'
      if (exitStarted) return
      forceComplete = true
      prismReady = true
      logoIntroDone = true
      displayProgress = 1
      tryStartExit()
      // If curtain tween couldn't start (missing panels), still dismiss
      if (!exitStarted) finish()
    }, PRELOADER_TIMING.fallbackMs)

    const lenisRetry = window.setTimeout(() => {
      try {
        getLenisInstance()?.stop()
      } catch {
        /* ignore */
      }
    }, 50)

    let ctx: ReturnType<typeof gsap.context> | null = null
    let reducedTimer: number | undefined
    let forceCompleteTimer: number | undefined
    let raf1 = 0
    let raf2 = 0
    let retryRaf = 0
    let progressRaf = 0
    let exitStarted = false
    let logoIntroDone = false
    let fontsReady = false
    let forceComplete = false
    // Latch: once true, stay true. resetPrismSceneReady() on StrictMode/
    // section remount must not re-block the exit gate after a timeout or
    // a successful PrismReadyReporter signal.
    let prismReady = isPrismSceneReady()
    let prismReadyTimeout: number | undefined
    let unsubPrism: (() => void) | undefined

    const startedAt = performance.now()
    let displayProgress = 0
    let images = collectCriticalImages()

    const refreshImages = () => {
      images = collectCriticalImages()
    }

    const onReadyState = () => refreshImages()
    document.addEventListener('readystatechange', onReadyState)
    window.addEventListener('load', onReadyState)

    if (document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (runId === runIdRef.current) fontsReady = true
      })
    } else {
      fontsReady = true
    }

    const setProgressUi = (value01: number) => {
      if (barRef.current) {
        gsap.set(barRef.current, { scaleX: value01 })
      }
      if (pctRef.current) {
        pctRef.current.textContent = formatPct(value01)
      }
    }

    let exitTween: gsap.core.Timeline | null = null

    const tryStartExit = () => {
      if (exitStarted || finishedRef.current) return
      if (runId !== runIdRef.current) return
      if (!logoIntroDone) return
      if (!prismReady && !forceComplete) return
      if (displayProgress < 0.995 && !forceComplete) return

      exitStarted = true
      displayProgress = 1
      setProgressUi(1)

      const root = rootRef.current
      const top = topPanelRef.current
      const bottom = bottomPanelRef.current
      const content = contentRef.current

      if (!root || !top || !bottom) {
        finish()
        return
      }

      const completeExit = () => {
        root.style.pointerEvents = 'none'
        top.style.willChange = 'auto'
        bottom.style.willChange = 'auto'
        finish()
      }

      // Standalone exit — intro timeline may already be complete
      exitTween = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: completeExit,
      })

      // Brief breath at 100%, then content out, then T/B curtain
      exitTween.to({}, { duration: PRELOADER_TIMING.hold, ease: 'none' })

      if (prefersReducedMotion()) {
        if (content) {
          exitTween.to(content, {
            opacity: 0,
            duration: 0.35,
            ease: 'power1.out',
          })
        }
        exitTween.to(
          root,
          {
            opacity: 0,
            duration: 0.4,
            ease: 'power1.out',
          },
          content ? '<' : '>',
        )
        return
      }

      if (content) {
        exitTween.to(content, {
          opacity: 0,
          scale: 0.96,
          duration: PRELOADER_TIMING.contentFade,
          ease: PRELOADER_TIMING.contentFadeEase,
        })
      }

      top.style.willChange = 'transform'
      bottom.style.willChange = 'transform'

      const curtainAt = content
        ? `-=${PRELOADER_TIMING.curtainOverlap}`
        : '>'

      exitTween
        .to(
          top,
          {
            yPercent: -100,
            duration: PRELOADER_TIMING.curtain,
            ease: PRELOADER_TIMING.curtainEase,
          },
          curtainAt,
        )
        .addLabel('curtain', '<')
        .to(
          bottom,
          {
            yPercent: 100,
            duration: PRELOADER_TIMING.curtain,
            ease: PRELOADER_TIMING.curtainEase,
          },
          'curtain',
        )
    }

    const tickProgress = () => {
      if (finishedRef.current || runId !== runIdRef.current) return

      const elapsed = performance.now() - startedAt
      const minMet = elapsed >= PRELOADER_TIMING.minDisplayMs
      const raw = computeRawProgress(images, fontsReady)

      // Gentle time floor so cached loads still feel progressive
      const timeFloor = Math.min(
        0.72,
        elapsed / (PRELOADER_TIMING.minDisplayMs * 1.15),
      )
      let target = Math.max(raw, timeFloor)

      const assetsReady =
        fontsReady &&
        document.readyState !== 'loading' &&
        (raw >= 0.88 || document.readyState === 'complete') &&
        prismReady
      // forceComplete alone is enough once the logo intro has finished —
      // do not re-require prismReady (that gate can flap false on remount).
      const canFinish =
        (assetsReady && minMet && logoIntroDone) ||
        (forceComplete && logoIntroDone)

      if (!canFinish) {
        target = Math.min(target, PRELOADER_TIMING.progressCap)
      } else {
        target = 1
      }

      const lerp = prefersReducedMotion()
        ? 1
        : canFinish
          ? Math.max(PRELOADER_TIMING.progressLerp, 0.18)
          : PRELOADER_TIMING.progressLerp
      displayProgress += (target - displayProgress) * lerp

      if (canFinish && displayProgress > 0.985) {
        displayProgress = 1
      }

      setProgressUi(displayProgress)
      tryStartExit()

      if (!exitStarted) {
        progressRaf = requestAnimationFrame(tickProgress)
      }
    }

    unsubPrism = subscribePrismSceneReady((ready) => {
      if (runId !== runIdRef.current) return
      if (!ready) return // ignore resets — latch only accepts true
      prismReady = true
      if (!exitStarted) {
        cancelAnimationFrame(progressRaf)
        progressRaf = requestAnimationFrame(tickProgress)
      }
    })

    prismReadyTimeout = window.setTimeout(() => {
      if (finishedRef.current || runId !== runIdRef.current) return
      if (prismReady) return
      console.warn(
        '[preloader] prism WebGL ready timed out — continuing exit gate',
      )
      prismReady = true
      if (!exitStarted) {
        cancelAnimationFrame(progressRaf)
        progressRaf = requestAnimationFrame(tickProgress)
      }
    }, PRELOADER_TIMING.prismReadyTimeoutMs)

    const start = () => {
      if (runId !== runIdRef.current || finishedRef.current) return

      const root = rootRef.current
      const logo = logoRef.current
      const top = topPanelRef.current
      const bottom = bottomPanelRef.current
      if (!root || !logo || !top || !bottom) {
        retryRaf = requestAnimationFrame(start)
        return
      }

      const armProgress = () => {
        progressRaf = requestAnimationFrame(tickProgress)
        forceCompleteTimer = window.setTimeout(() => {
          if (finishedRef.current || runId !== runIdRef.current) return
          forceComplete = true
          fontsReady = true
          logoIntroDone = true
          if (!prismReady) prismReady = true
          if (!exitStarted) {
            cancelAnimationFrame(progressRaf)
            progressRaf = requestAnimationFrame(tickProgress)
          }
        }, Math.max(0, PRELOADER_TIMING.fallbackMs - 1100))
      }

      if (prefersReducedMotion()) {
        if (barRef.current) {
          gsap.set(barRef.current, { scaleX: 0, transformOrigin: 'left center' })
        }
        gsap.set([top, bottom], { yPercent: 0 })
        gsap.set(root, { opacity: 1 })
        if (contentRef.current) {
          gsap.set(contentRef.current, { opacity: 1, scale: 1 })
        }
        logoIntroDone = true
        armProgress()
        return
      }

      const letters = gsap.utils.toArray<SVGGraphicsElement>(
        '.meolaa-logo-mark__path',
        logo,
      )

      // getBBox() is SVG user-space, but the element must be in the live tree
      void logo.getBoundingClientRect()

      let origins: string[] | null = null
      if (letters.length) {
        try {
          origins = letters.map((letter) => {
            const bbox = letter.getBBox()
            if (!bbox.width && !bbox.height) {
              throw new Error('empty getBBox')
            }
            return `${bbox.x + bbox.width / 2} ${bbox.y + bbox.height / 2}`
          })
        } catch {
          retryRaf = requestAnimationFrame(start)
          return
        }
      }

      try {
        ctx = gsap.context(() => {
          if (barRef.current) {
            gsap.set(barRef.current, { scaleX: 0, transformOrigin: 'left center' })
          }
          if (pctRef.current) {
            gsap.set(pctRef.current, { opacity: 0.85 })
          }

          gsap.set([top, bottom], { yPercent: 0 })
          gsap.set(root, { opacity: 1 })
          if (contentRef.current) {
            gsap.set(contentRef.current, { opacity: 1, scale: 1 })
          }

          if (!letters.length || !origins) {
            logoIntroDone = true
            armProgress()
            return
          }

          const pinnedOrigins = origins
          const svgOriginFor = (index: number) => pinnedOrigins[index]

          // Pin each path's origin in SVG user-space before `from` records transforms
          letters.forEach((letter, i) => {
            gsap.set(letter, { svgOrigin: svgOriginFor(i), smoothOrigin: false })
          })

          gsap.from(letters, {
            svgOrigin: svgOriginFor,
            scale: 0,
            y: 30,
            rotation: () => gsap.utils.random(-20, 20),
            stagger: { each: PRELOADER_TIMING.popStagger, from: 'random' },
            duration: PRELOADER_TIMING.pop,
            ease: 'back.out(2)',
            onComplete: () => {
              logoIntroDone = true
            },
          })

          armProgress()
        }, root)
      } catch {
        reducedTimer = window.setTimeout(finish, 400)
      }
    }

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(start)
    })

    return () => {
      runIdRef.current += 1
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      cancelAnimationFrame(retryRaf)
      cancelAnimationFrame(progressRaf)
      window.clearTimeout(fallback)
      window.clearTimeout(lenisRetry)
      if (reducedTimer) window.clearTimeout(reducedTimer)
      if (forceCompleteTimer) window.clearTimeout(forceCompleteTimer)
      if (prismReadyTimeout) window.clearTimeout(prismReadyTimeout)
      unsubPrism?.()
      document.removeEventListener('readystatechange', onReadyState)
      window.removeEventListener('load', onReadyState)
      exitTween?.kill()
      ctx?.revert()
      if (finishedRef.current) {
        unlockScroll()
      }
    }
  }, [active])

  // Hand off from the HTML first-paint overlay once the React preloader is in the DOM
  useLayoutEffect(() => {
    if (!active) return
    dismissBootPreloader()
  }, [active])

  // Safety: if component unmounts while still preloading, never leave overflow lock
  useEffect(() => {
    return () => {
      unlockScroll()
    }
  }, [])

  if (!active) return null

  return createPortal(
    <div
      ref={rootRef}
      className="preloader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Meolaa"
    >
      <div
        ref={topPanelRef}
        className="preloader__panel preloader__panel--top"
        aria-hidden="true"
      />
      <div
        ref={bottomPanelRef}
        className="preloader__panel preloader__panel--bottom"
        aria-hidden="true"
      />
      <div ref={contentRef} className="preloader__inner">
        <MeolaaLogoMark
          ref={logoRef}
          className="preloader__logo"
          pathClassName="meolaa-logo-mark__path"
        />
        <div className="preloader__progress" aria-hidden="true">
          <div className="preloader__progress-track">
            <div ref={barRef} className="preloader__progress-fill" />
          </div>
          <span ref={pctRef} className="preloader__progress-pct">
            0%
          </span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
