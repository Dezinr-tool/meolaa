/**
 * Lenis smooth scroll + GSAP ScrollTrigger sync (matches prototype).
 */
import { useEffect, type ReactNode } from 'react'
import { Lenis, ScrollTrigger, gsap } from '../lib/motion'
import { setLenisInstance } from '../lib/lenisInstance'

type SmoothScrollProps = {
  children: ReactNode
}

/** Silkier scroll feel — lower lerp, modest wheel boost so pins stay responsive. */
const LENIS_LERP = 0.058
const LENIS_WHEEL_MULTIPLIER = 1.04
const LENIS_DURATION = 1.28
const LENIS_EASING = (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t))

export function SmoothScroll({ children }: SmoothScrollProps) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: LENIS_LERP,
      duration: LENIS_DURATION,
      easing: LENIS_EASING,
      wheelMultiplier: LENIS_WHEEL_MULTIPLIER,
      smoothWheel: true,
      autoRaf: false,
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
