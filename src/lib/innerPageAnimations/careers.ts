import {
  editorialPinType,
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
  ScrollTrigger,
} from './shared'

const SCRUB = 0.55

export function initCareersLifeFlow(): () => void {
  const root = document.querySelector<HTMLElement>('[data-life-flow]')
  if (!root) return () => {}

  /* Inner pages: static photo grid (inner-pages.css) — skip pin/scrub. */
  if (document.querySelector('.app--inner')) {
    root.classList.add('is-static')
    return () => {
      root.classList.remove('is-static')
    }
  }

  const pinHeight = root.querySelector<HTMLElement>('[data-life-pin-height]')
  const container = root.querySelector<HTMLElement>('[data-life-container]')
  const medias = Array.from(
    root.querySelectorAll<HTMLElement>('.ct-life__media'),
  )
  if (!pinHeight || !container || !medias.length) return () => {}

  let tween: gsap.core.Timeline | null = null
  let mode: 'static' | 'flow' | null = null
  let pathSeed: { yJitter: number }[] = []
  const cleanups: (() => void)[] = []

  function travelX() {
    return Math.round(window.innerWidth * 0.72)
  }

  function peakScale() {
    return window.matchMedia('(max-width: 640px)').matches ? 1.08 : 1.14
  }

  function seedPaths() {
    pathSeed = medias.map((_, i) => ({ yJitter: ((i % 5) - 2) * 28 }))
  }

  function killTween() {
    if (tween) {
      tween.scrollTrigger?.kill()
      tween.kill()
      tween = null
    }
    gsap.set(medias, { clearProps: 'transform,visibility,opacity' })
    root!.classList.remove('is-flowing')
  }

  function showStatic() {
    killTween()
    root!.classList.add('is-static')
  }

  function buildFlow() {
    killTween()
    root!.classList.remove('is-static')
    root!.classList.add('is-flowing')
    seedPaths()

    const xSpan = travelX()
    const scalePeak = peakScale()
    const n = medias.length
    const dur = Math.max(0.26, Math.min(0.4, 1.05 / n))
    const stagger = (0.42 - dur * 0.12) / Math.max(1, n - 1)
    const wave2 = (n - 1) * stagger + dur * 0.45

    medias.forEach((img, i) => {
      const { yJitter } = pathSeed[i]!
      gsap.set(img, {
        xPercent: -50,
        yPercent: -50,
        x: xSpan,
        y: yJitter,
        scale: 0,
        rotation: 0,
        autoAlpha: 1,
        visibility: 'visible',
        transformOrigin: '50% 50%',
        force3D: true,
      })
    })

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pinHeight,
        start: 'top top',
        end: 'bottom bottom',
        pin: container,
        pinSpacing: false,
        pinType: editorialPinType(),
        scrub: SCRUB,
        anticipatePin: 0,
        invalidateOnRefresh: true,
      },
    })

    const waves = [
      { offset: 0, ySign: 1, peak: scalePeak },
      { offset: wave2, ySign: -1, peak: scalePeak * 0.96 },
    ]

    waves.forEach(({ offset, ySign, peak }) => {
      medias.forEach((img, i) => {
        const { yJitter } = pathSeed[i]!
        const y0 = yJitter * ySign
        const t0 = offset + i * stagger

        tl.fromTo(
          img,
          { x: xSpan, y: y0, scale: 0 },
          {
            x: 0,
            y: y0 * 0.35,
            scale: peak,
            duration: dur * 0.5,
            ease: 'power2.out',
          },
          t0,
        )
        tl.to(
          img,
          {
            x: -xSpan,
            y: -y0 * 0.5,
            scale: 0,
            duration: dur * 0.5,
            ease: 'power2.in',
          },
          t0 + dur * 0.5,
        )
      })
    })

    tween = tl
  }

  function applyMode() {
    const next = prefersReducedMotion() ? 'static' : 'flow'
    if (next === mode) {
      if (next === 'flow' && tween) ScrollTrigger.refresh()
      return
    }
    mode = next
    if (next === 'static') showStatic()
    else buildFlow()
  }

  applyMode()

  const reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onReduceChange = () => {
    mode = null
    applyMode()
  }
  reduceMq.addEventListener('change', onReduceChange)
  cleanups.push(() => reduceMq.removeEventListener('change', onReduceChange))

  let resizeTimer: ReturnType<typeof setTimeout>
  const onResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (mode !== 'flow') return
      mode = null
      applyMode()
    }, 180)
  }
  window.addEventListener('resize', onResize)
  cleanups.push(() => window.removeEventListener('resize', onResize))

  refreshScrollTriggers()

  return () => {
    cleanups.forEach((fn) => fn())
    killTween()
    root.classList.remove('is-static', 'is-flowing')
  }
}
