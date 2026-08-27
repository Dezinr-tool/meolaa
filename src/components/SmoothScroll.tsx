/**
 * Lenis smooth scroll + GSAP ScrollTrigger sync (matches prototype).
 *
 * Lerp-only (no duration/easing): when both are set, Lenis prefers a timed ease
 * that restarts on every wheel tick and fights pinned sections (Lab / Founding /
 * Footer). Continuous damp lerp stays buttery without springy pin bounce.
 */
import { useEffect, type ReactNode } from 'react'
import { Lenis, ScrollTrigger, gsap } from '../lib/motion'
import { setLenisInstance } from '../lib/lenisInstance'

type SmoothScrollProps = {
  children: ReactNode
}

/**
 * Frame-rate–independent damp (Lenis v1). Lower = silkier; floor ~0.06 so
 * ScrollTrigger pins stay glued instead of lagging behind the scroller.
 */
const LENIS_LERP = 0.068
/** Slight boost so low lerp still feels responsive on trackpads. */
const LENIS_WHEEL_MULTIPLIER = 1.05
const REDUCED_MQ = '(prefers-reduced-motion: reduce)'

export function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    /* Native scroll when the user prefers reduced motion — no Lenis inertia. */
    if (window.matchMedia(REDUCED_MQ).matches) {
      requestAnimationFrame(() => ScrollTrigger.refresh())
      return
    }

    const lenis = new Lenis({
      lerp: LENIS_LERP,
      wheelMultiplier: LENIS_WHEEL_MULTIPLIER,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      respectReducedMotion: true,
    })

    setLenisInstance(lenis)
    document.documentElement.classList.add('lenis', 'lenis-smooth')

    // Match prototype: Lenis native window scroll + ST.update (no scrollerProxy).
    // scrollerProxy double-registers under React StrictMode and breaks all triggers.
    lenis.on('scroll', ScrollTrigger.update)

    const ticker = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)
    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      window.removeEventListener('resize', onResize)
      gsap.ticker.remove(ticker)
      setLenisInstance(null)
      lenis.destroy()
      document.documentElement.classList.remove('lenis', 'lenis-smooth')
    }
  }, [])

  return children
}
