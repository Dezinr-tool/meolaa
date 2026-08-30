/**
 * Shared Lenis instance so scroll-driven UI (nav, etc.) stays in sync
 * with SmoothScroll rather than racing window scroll.
 */
import type Lenis from 'lenis'

let instance: Lenis | null = null

export function setLenisInstance(lenis: Lenis | null) {
  instance = lenis
}

export function getLenisInstance(): Lenis | null {
  return instance
}
