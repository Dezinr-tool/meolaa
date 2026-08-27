import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Wire Lenis → ScrollTrigger (GSAP ticker drives Lenis.raf; scroll events
 * call ScrollTrigger.update). Call once from App; returns a disposer.
 */
export function setupLenis() {
  const lenis = new Lenis({
    autoRaf: false,
    // Keep the native scrollbar (paired with scrollbar-gutter: stable in CSS)
    // so layout width stays constant; Lenis only smooths scroll position.
    syncTouch: false,
  })

  lenis.on('scroll', ScrollTrigger.update)

  const onTick = (time) => {
    lenis.raf(time * 1000)
  }
  gsap.ticker.add(onTick)
  gsap.ticker.lagSmoothing(0)

  const onResize = () => {
    ScrollTrigger.refresh()
  }
  window.addEventListener('resize', onResize)

  // Layout may settle after first paint (fonts, canvas, scrollbar gutter)
  requestAnimationFrame(() => ScrollTrigger.refresh())

  return () => {
    window.removeEventListener('resize', onResize)
    gsap.ticker.remove(onTick)
    lenis.destroy()
  }
}
