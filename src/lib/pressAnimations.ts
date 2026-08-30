/**
 * Press feed — pin section, scrub horizontal card track (Lenis-aware).
 * Mirrors loop/vision pin conventions: scrub: true, anticipatePin: 0,
 * invalidateOnRefresh, cleanup via returned disposer.
 *
 * Travel = track.scrollWidth − slider.clientWidth. Edge insets live on the
 * first/last cards (CSS --press-pad-x), so scrollWidth already includes them
 * and flush start/end align with the header without duplicating pad math in JS.
 */
import {
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
} from './innerPageAnimations/shared'

/** Match Loop — 1:1 scrub; numeric lag + Lenis reads as spring/overshoot. */
const PRESS_SCRUB = true

export function initPress(): () => void {
  const press = document.querySelector(
    '[data-section="press"]',
  ) as HTMLElement | null
  if (!press) return () => {}

  const slider = press.querySelector(
    '[data-press-slider]',
  ) as HTMLElement | null
  const track = press.querySelector(
    '[data-press-track]',
  ) as HTMLElement | null
  if (!slider || !track) return () => {}

  if (prefersReducedMotion()) {
    press.classList.add('press-feed--static')
    return () => {
      press.classList.remove('press-feed--static')
    }
  }

  press.classList.remove('press-feed--static')

  /** Full track (cards + gaps + first/last edge margins) minus visible slider. */
  const getTravel = () =>
    Math.max(0, track.scrollWidth - slider.clientWidth)

  const tween = gsap.fromTo(
    track,
    { x: 0 },
    {
      x: () => -getTravel(),
      ease: 'none',
      immediateRender: false,
      scrollTrigger: {
        trigger: press,
        start: 'top top',
        end: () => `+=${getTravel()}`,
        pin: true,
        scrub: PRESS_SCRUB,
        anticipatePin: 0,
        invalidateOnRefresh: true,
        onRefresh: (self) => {
          /* getTravel() is re-read for x/end via invalidateOnRefresh —
             keep progress mapped to the latest track/slider widths. */
          gsap.set(track, { x: -getTravel() * self.progress })
        },
      },
    },
  )

  const refreshTravel = () => {
    tween.scrollTrigger?.refresh()
  }

  /* Images loading can change scrollWidth after the first measure. */
  const images = Array.from(track.querySelectorAll('img'))
  const onImg = () => refreshTravel()
  images.forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', onImg, { once: true })
      img.addEventListener('error', onImg, { once: true })
    }
  })

  refreshScrollTriggers()

  return () => {
    images.forEach((img) => {
      img.removeEventListener('load', onImg)
      img.removeEventListener('error', onImg)
    })
    tween.scrollTrigger?.kill()
    tween.kill()
    gsap.set(track, { clearProps: 'x,transform' })
    press.classList.remove('press-feed--static')
  }
}
