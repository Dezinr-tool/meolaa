/**
 * Shared Lenis instance so scroll-driven UI (nav, etc.) stays in sync
 * with SmoothScroll rather than racing window scroll.
 */
import type Lenis from 'lenis'
import { ScrollTrigger } from './motion'

let instance: Lenis | null = null

export function setLenisInstance(lenis: Lenis | null) {
  instance = lenis
  if (typeof window !== 'undefined') {
    ;(window as Window & { __meolaaLenis?: Lenis | null }).__meolaaLenis = lenis
  }
}

export function getLenisInstance(): Lenis | null {
  return instance
}

export function getMaxScrollY(): number {
  if (typeof window === 'undefined') return 0
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

export function scrollToY(y: number, immediate = true): void {
  const target = Math.max(0, Math.min(y, getMaxScrollY()))
  if (instance) {
    instance.scrollTo(target, { immediate })
  } else if (typeof window !== 'undefined') {
    window.scrollTo(0, target)
  }
}

/** Keep the viewport pinned to the document bottom after layout height changes. */
export function preserveBottomScroll(): void {
  scrollToY(getMaxScrollY(), true)
}

/**
 * GSAP pin-spacers extend the document after Lenis first measures
 * scrollHeight. ResizeObserver on documentElement does not fire for
 * content growth, so Lenis must be remeasured whenever ST refreshes.
 */
export function refreshScrollAndLenis(): void {
  ScrollTrigger.sort()
  ScrollTrigger.refresh()
  instance?.resize()
}
