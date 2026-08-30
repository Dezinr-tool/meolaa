import { gsap, prefersReducedMotion, ScrollTrigger } from './innerPageAnimations/shared'

const STACK_SEL = '.meola-lab__slide'
const WRAP_SEL = '.meola-lab__wrap'
const CARD_SEL = '.meola-lab__card'

function pinDistance(): number {
  return window.innerHeight
}

function stackMetrics() {
  const narrow = window.matchMedia('(max-width: 720px)').matches
  return {
    scale: narrow ? 0.82 : 0.7,
    rotationX: narrow ? 22 : 40,
    rotationZSpread: narrow ? 6 : 10,
  }
}

/**
 * Brand Lab — Get Hyped expertise stack (mwg_effect031).
 * Each slide except the last pins for 1vh; the card scrubs scale + rotateX/Z,
 * then fades in the last 25% of the pin while the next card slides over.
 */
export function initLabStack(root: HTMLElement): () => void {
  const slides = Array.from(root.querySelectorAll<HTMLElement>(STACK_SEL))
  if (!slides.length) return () => {}

  if (prefersReducedMotion()) {
    root.classList.add('meola-lab--static')
    slides.forEach((slide) => {
      slide.querySelector(CARD_SEL)?.classList.add('is-front')
    })
    return () => {
      root.classList.remove('meola-lab--static')
    }
  }

  root.classList.add('meola-lab--stacked')

  const ctx = gsap.context(() => {
    const metrics = stackMetrics()

    slides.forEach((slide, index) => {
      const isLast = index === slides.length - 1
      const wrap = slide.querySelector<HTMLElement>(WRAP_SEL)
      const card = slide.querySelector<HTMLElement>(CARD_SEL)
      if (!wrap || !card) return

      const markFront = (front: boolean) => {
        card.classList.toggle('is-front', front)
      }

      if (index === 0) markFront(true)

      if (isLast) {
        ScrollTrigger.create({
          trigger: slide,
          start: 'top 70%',
          end: 'bottom top',
          onToggle: (self) => markFront(self.isActive),
        })
        return
      }

      gsap.to(card, {
        rotationZ: (Math.random() - 0.5) * metrics.rotationZSpread,
        scale: metrics.scale,
        rotationX: metrics.rotationX,
        ease: 'power1.in',
        scrollTrigger: {
          pin: wrap,
          trigger: slide,
          start: 'top top',
          end: () => `+=${pinDistance()}`,
          scrub: true,
          anticipatePin: 0,
          invalidateOnRefresh: true,
          onToggle: (self) => markFront(self.isActive && self.progress < 0.85),
          onUpdate: (self) => markFront(self.isActive && self.progress < 0.85),
        },
      })

      gsap.to(card, {
        autoAlpha: 0,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: slide,
          start: () => `top+=${pinDistance() * 0.75} top`,
          end: () => `top+=${pinDistance()} top`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
    })
  }, root)

  ScrollTrigger.refresh()

  return () => {
    ctx.revert()
    root.classList.remove('meola-lab--stacked')
    slides.forEach((slide) => {
      slide.querySelector(CARD_SEL)?.classList.remove('is-front')
    })
  }
}
