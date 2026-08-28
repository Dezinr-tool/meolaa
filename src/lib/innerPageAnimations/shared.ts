import { ScrollTrigger, gsap } from '../motion'
import { getLenisInstance } from '../lenisInstance'

export const REDUCED_MQ = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MQ).matches
}

export function scrollToY(y: number, duration = 0.85): void {
  const lenis = getLenisInstance()
  if (lenis) {
    lenis.scrollTo(y, { duration })
  } else {
    window.scrollTo({ top: y, behavior: duration ? 'smooth' : 'auto' })
  }
}

export function scrollToElement(
  el: HTMLElement,
  offset = -88,
  duration?: number,
): void {
  const lenis = getLenisInstance()
  if (lenis) {
    lenis.scrollTo(el, {
      offset,
      duration: duration ?? (prefersReducedMotion() ? 0 : 1.15),
    })
    return
  }
  const top = el.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}

/** Editorial pages use overflow-x:clip — transform pins survive it. */
export function editorialPinType(): 'transform' | 'fixed' {
  return document.querySelector('.page-editorial') ? 'transform' : 'fixed'
}

export function refreshScrollTriggers(): void {
  requestAnimationFrame(() => {
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
  })
}

export function killAll(triggers: ScrollTrigger[]): void {
  triggers.forEach((st) => st.kill())
  triggers.length = 0
}

export function waitForScroller(onReady: () => void): () => void {
  let cancelled = false
  let raf = 0

  const tick = () => {
    if (cancelled) return
    if (getLenisInstance() || prefersReducedMotion()) {
      onReady()
      return
    }
    raf = requestAnimationFrame(tick)
  }

  tick()
  return () => {
    cancelled = true
    cancelAnimationFrame(raf)
  }
}

export { gsap, ScrollTrigger }
