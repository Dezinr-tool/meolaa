/**
 * Press feed — one-time slide-in from the right (back.out overshoot), then
 * drag / flick browsing with Draggable + InertiaPlugin. No pin, no autoplay loop.
 */
import { Draggable, gsap, ScrollTrigger } from './motion'
import { prefersReducedMotion } from './innerPageAnimations/shared'

function getGap(track: HTMLElement, slider: HTMLElement) {
  const styles = getComputedStyle(track)
  return (
    parseFloat(styles.columnGap || styles.gap || '0') ||
    parseFloat(getComputedStyle(slider).getPropertyValue('--press-gap') || '0') ||
    28
  )
}

function getStep(track: HTMLElement, slider: HTMLElement, cards: HTMLElement[]) {
  const card = cards[0]
  if (!card) return 1
  return card.getBoundingClientRect().width + getGap(track, slider)
}

function getTravel(track: HTMLElement, slider: HTMLElement) {
  return Math.max(0, track.scrollWidth - slider.clientWidth)
}

function snapX(value: number, step: number, minX: number) {
  if (step <= 0 || minX >= 0) return 0
  const snaps: number[] = []
  for (let x = 0; x >= minX - 0.5; x -= step) {
    snaps.push(Math.max(minX, Math.round(x * 1000) / 1000))
  }
  if (snaps[snaps.length - 1] !== minX) snaps.push(minX)

  let nearest = snaps[0]
  let best = Math.abs(value - nearest)
  for (let i = 1; i < snaps.length; i++) {
    const d = Math.abs(value - snaps[i])
    if (d < best) {
      best = d
      nearest = snaps[i]
    }
  }
  return nearest
}

function entryOffset(slider: HTMLElement) {
  return Math.max(slider.clientWidth, window.innerWidth * 0.55)
}

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

  const cards = gsap.utils.toArray<HTMLElement>(
    track.querySelectorAll('.press-card'),
  )
  if (!cards.length) return () => {}

  const reduceMotion = prefersReducedMotion()
  press.classList.remove('press-feed--static')

  /* Clear any leftover per-card entrance transforms from older press motion. */
  gsap.set(cards, { clearProps: 'x,y,yPercent,transform' })
  cards.forEach((card) => {
    const content = card.querySelector('.press-card__content')
    if (content) gsap.set(content, { clearProps: 'y,yPercent,opacity,transform' })
  })

  let minX = 0
  let step = getStep(track, slider, cards)
  let entered = false

  const measure = () => {
    step = getStep(track, slider, cards)
    minX = -getTravel(track, slider)
  }

  measure()

  const [draggable] = Draggable.create(track, {
    type: 'x',
    inertia: !reduceMotion,
    cursor: 'grab',
    activeCursor: 'grabbing',
    dragResistance: 0.15,
    edgeResistance: 0.85,
    bounds: { minX, maxX: 0 },
    snap: {
      x: (value: number) => {
        measure()
        return snapX(value, step, minX)
      },
    },
    onDragEnd: () => {
      if (reduceMotion) {
        measure()
        const x = Number(gsap.getProperty(track, 'x')) || 0
        gsap.set(track, { x: snapX(x, step, minX) })
      }
    },
  })

  const enableBrowsing = () => {
    entered = true
    measure()
    draggable.applyBounds({ minX, maxX: 0 })
    draggable.enable()
    draggable.update(true)
  }

  const refreshBounds = () => {
    measure()
    draggable.applyBounds({ minX, maxX: 0 })
    if (!entered) return
    const x = Number(gsap.getProperty(track, 'x')) || 0
    const settled = snapX(gsap.utils.clamp(minX, 0, x), step, minX)
    gsap.set(track, { x: settled })
    draggable.update(true)
  }

  /* Hold drag until the entrance settles so browsing doesn't fight the tween. */
  draggable.disable()

  let entranceTween: gsap.core.Tween | null = null
  let entranceTrigger: ScrollTrigger | null = null

  if (reduceMotion) {
    gsap.set(track, { x: 0 })
    enableBrowsing()
  } else {
    gsap.set(track, { x: entryOffset(slider) })

    entranceTrigger = ScrollTrigger.create({
      trigger: press,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        entranceTween = gsap.to(track, {
          x: 0,
          duration: 1.6,
          delay: 0.3,
          ease: 'power3.out',
          onComplete: enableBrowsing,
        })
      },
    })
  }

  let wheelSnapTimer = 0
  const onWheel = (event: WheelEvent) => {
    if (!entered) return
    measure()
    if (minX >= 0) return

    const absX = Math.abs(event.deltaX)
    const absY = Math.abs(event.deltaY)
    const current = Number(gsap.getProperty(track, 'x')) || 0

    /* Vertical intent → page/Lenis scroll. Only hijack horizontal swipes. */
    if (absY > absX) {
      if (event.deltaY > 0 && current <= minX + 0.5) return
      if (event.deltaY < 0 && current >= -0.5) return
      return
    }

    const delta = event.deltaX
    if (delta === 0) return
    event.preventDefault()
    gsap.killTweensOf(track)
    const next = gsap.utils.clamp(minX, 0, current - delta)
    if (reduceMotion) {
      gsap.set(track, { x: snapX(next, step, minX) })
    } else {
      gsap.set(track, { x: next })
    }
    draggable.update(true)
    window.clearTimeout(wheelSnapTimer)
    wheelSnapTimer = window.setTimeout(() => {
      if (reduceMotion) return
      measure()
      const x = Number(gsap.getProperty(track, 'x')) || 0
      gsap.to(track, {
        x: snapX(x, step, minX),
        duration: 0.55,
        ease: 'power3.out',
        onUpdate: () => draggable.update(true),
      })
    }, 90)
  }
  slider.addEventListener('wheel', onWheel, { passive: false })

  const onResize = () => {
    if (!entered && !reduceMotion) {
      gsap.set(track, { x: entryOffset(slider) })
      measure()
      draggable.applyBounds({ minX, maxX: 0 })
      return
    }
    refreshBounds()
  }
  window.addEventListener('resize', onResize)

  const images = Array.from(track.querySelectorAll('img'))
  const onImg = () => {
    if (entered || reduceMotion) refreshBounds()
    else {
      measure()
      draggable.applyBounds({ minX, maxX: 0 })
    }
  }
  images.forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', onImg, { once: true })
      img.addEventListener('error', onImg, { once: true })
    }
  })

  return () => {
    window.clearTimeout(wheelSnapTimer)
    window.removeEventListener('resize', onResize)
    slider.removeEventListener('wheel', onWheel)
    images.forEach((img) => {
      img.removeEventListener('load', onImg)
      img.removeEventListener('error', onImg)
    })
    entranceTrigger?.kill()
    entranceTween?.kill()
    gsap.killTweensOf(track)
    draggable.kill()
    gsap.set(track, { clearProps: 'x,transform' })
  }
}
