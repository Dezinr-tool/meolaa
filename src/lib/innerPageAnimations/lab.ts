import { getLenisInstance } from '../lenisInstance'
import {
  gsap,
  prefersReducedMotion,
  refreshScrollTriggers,
  scrollToY,
  ScrollTrigger,
} from './shared'

export function initLabPlatform(): () => void {
  if (!document.querySelector('.page-lab')) return () => {}

  const reduceMotion = prefersReducedMotion()
  const cleanups: (() => void)[] = []
  const triggers: ScrollTrigger[] = []
  const timelines: gsap.core.Timeline[] = []

  function initHero() {
    const hero = document.querySelector<HTMLElement>('[data-lab-hero]')
    if (!hero) return

    const plate = hero.querySelector<HTMLElement>('[data-lab-hero-plate]')
    const scan = hero.querySelector<HTMLElement>('[data-lab-hero-scan]')
    const rule = hero.querySelector<HTMLElement>('[data-lab-hero-rule]')
    const frame = hero.querySelector<HTMLElement>('.lab-hero__frame')
    const cue = hero.querySelector<HTMLElement>('.lab-hero__cue')
    const clips = hero.querySelectorAll<HTMLElement>('[data-lab-hero-clip]')
    const brandInners = hero.querySelectorAll<HTMLElement>('.lab-hero__brand-inner')
    const copyFades = hero.querySelectorAll<HTMLElement>(
      '.lab-hero__copy [data-lab-hero-fade], .lab-hero__cue',
    )

    if (reduceMotion) {
      if (rule) rule.style.transform = 'scaleX(1)'
      if (scan) scan.style.opacity = '0'
      return
    }

    gsap.set(clips, { yPercent: 108 })
    if (rule) gsap.set(rule, { scaleX: 0 })
    if (plate) gsap.set(plate, { scale: 1.14, yPercent: -2 })
    if (scan) gsap.set(scan, { opacity: 0, xPercent: -55 })

    const intro = gsap.timeline({ defaults: { ease: 'power3.out' } })
    if (plate) {
      intro.to(plate, { scale: 1, yPercent: 0, duration: 2.1, ease: 'power2.out' }, 0)
    }
    if (scan) {
      intro.to(scan, { opacity: 1, duration: 0.45, ease: 'power1.out' }, 0.2)
      intro.to(scan, { xPercent: 120, duration: 1.55, ease: 'power2.inOut' }, 0.25)
      intro.to(scan, { opacity: 0, duration: 0.5, ease: 'power1.in' }, 1.35)
    }
    intro.to(clips, { yPercent: 0, duration: 1.05, stagger: 0.12, ease: 'power4.out' }, 0.35)
    if (brandInners.length) {
      intro.to(
        brandInners,
        { opacity: 1, y: 0, duration: 1.05, stagger: 0.12, ease: 'power3.out' },
        0.35,
      )
    }
    if (rule) {
      intro.to(rule, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 0.95)
    }
    if (copyFades.length) {
      intro.to(
        copyFades,
        { opacity: 1, y: 0, duration: 0.85, stagger: 0.1, ease: 'power3.out' },
        1.1,
      )
    }
    timelines.push(intro)

    const st = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress
        if (plate) {
          gsap.set(plate, { yPercent: p * 14, scale: 1 + p * 0.06 })
        }
        if (frame) {
          gsap.set(frame, { y: p * -48, opacity: 1 - p * 0.55 })
        }
        if (cue) {
          gsap.set(cue, { opacity: Math.max(0, 1 - p * 1.8) })
        }
      },
    })
    triggers.push(st)
  }

  function initIntroStats() {
    const stats = document.querySelectorAll<HTMLElement>('[data-lab-stat]')
    if (!stats.length || reduceMotion) return

    gsap.set(stats, { opacity: 0, y: 36 })
    const tween = gsap.to(stats, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.lab-intro__stats',
        start: 'top 80%',
      },
    })
    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
  }

  function initOs() {
    const root = document.querySelector<HTMLElement>('[data-lab-os]')
    if (!root) return

    const stages = Array.from(
      root.querySelectorAll<HTMLElement>('[data-lab-os-stage]'),
    )
    const progress = root.querySelector<SVGGeometryElement>('[data-lab-os-progress]')
    const vertices = Array.from(
      root.querySelectorAll<HTMLElement>('[data-lab-os-vertex]'),
    )
    const pathLen =
      progress && typeof progress.getTotalLength === 'function'
        ? progress.getTotalLength()
        : 3 * 220 * Math.sqrt(3)

    if (progress) {
      progress.style.strokeDasharray = String(pathLen)
      progress.style.strokeDashoffset = String(pathLen)
    }

    function setStage(index: number) {
      stages.forEach((el, i) => el.classList.toggle('is-active', i === index))
      vertices.forEach((el) => {
        const v = Number(el.getAttribute('data-lab-os-vertex'))
        el.classList.toggle('is-active', v === index)
      })
      if (progress && pathLen) {
        const filled = ((index + 1) / stages.length) * pathLen
        progress.style.strokeDashoffset = String(pathLen - filled)
      }
    }

    setStage(0)
    if (reduceMotion) return

    stages.forEach((stage, i) => {
      const st = ScrollTrigger.create({
        trigger: stage,
        start: 'top 65%',
        end: 'bottom 40%',
        onEnter: () => setStage(i),
        onEnterBack: () => setStage(i),
      })
      triggers.push(st)
    })
  }

  function initCaps() {
    const root = document.querySelector<HTMLElement>('[data-lab-caps]')
    if (!root) return

    const tabs = Array.from(
      root.querySelectorAll<HTMLElement>('[data-lab-cap-tab]'),
    )
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>('[data-lab-cap-panel]'),
    )
    const imgs = Array.from(
      root.querySelectorAll<HTMLElement>('[data-lab-cap-img]'),
    )
    const ways = Array.from(
      root.querySelectorAll<HTMLElement>('[data-lab-cap-way]'),
    )
    const counter = root.querySelector<HTMLElement>('[data-lab-cap-counter]')
    let active = 0
    let lock = false

    function setActive(index: number, fromTab = false) {
      const i = Math.max(0, Math.min(panels.length - 1, index))
      if (i === active && !fromTab) return
      active = i

      tabs.forEach((tab, n) => {
        const on = n === i
        tab.classList.toggle('is-active', on)
        tab.setAttribute('aria-selected', on ? 'true' : 'false')
      })

      panels.forEach((panel, n) => {
        const on = n === i
        panel.classList.toggle('is-active', on)
        if (on) panel.removeAttribute('hidden')
        else panel.setAttribute('hidden', '')
      })

      imgs.forEach((img, n) => img.classList.toggle('is-active', n === i))

      if (counter) {
        counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`
      }
    }

    tabs.forEach((tab) => {
      const onClick = () => {
        const i = Number(tab.getAttribute('data-lab-cap-tab'))
        setActive(i, true)
        if (!reduceMotion && ways[i]) {
          lock = true
          const top =
            ways[i]!.getBoundingClientRect().top +
            window.scrollY -
            window.innerHeight * 0.25
          const lenis = getLenisInstance()
          if (lenis) {
            lenis.scrollTo(top, {
              duration: 0.9,
              onComplete: () => {
                lock = false
              },
            })
          } else {
            scrollToY(top, 0.9)
            setTimeout(() => {
              lock = false
            }, 900)
          }
        }
      }
      tab.addEventListener('click', onClick)
      cleanups.push(() => tab.removeEventListener('click', onClick))
    })

    setActive(0, true)
    if (reduceMotion || !ways.length) return

    ways.forEach((way, i) => {
      const st = ScrollTrigger.create({
        trigger: way,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => {
          if (!lock) setActive(i)
        },
        onEnterBack: () => {
          if (!lock) setActive(i)
        },
      })
      triggers.push(st)
    })
  }

  function initCase() {
    const stages = Array.from(
      document.querySelectorAll<HTMLElement>('[data-lab-case-stage]'),
    )
    if (!stages.length) return

    function setActive(index: number) {
      stages.forEach((el, i) => el.classList.toggle('is-active', i === index))
    }

    setActive(0)
    if (reduceMotion) return

    stages.forEach((stage, i) => {
      const st = ScrollTrigger.create({
        trigger: stage,
        start: 'top 70%',
        end: 'bottom 45%',
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      })
      triggers.push(st)
    })

    const media = document.querySelector<HTMLElement>('[data-lab-case-media] img')
    if (media) {
      const tween = gsap.fromTo(
        media,
        { scale: 1.08, yPercent: -4 },
        {
          scale: 1,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-lab-case]',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
    }
  }

  initHero()
  initIntroStats()
  initOs()
  initCaps()
  initCase()
  refreshScrollTriggers()

  return () => {
    cleanups.forEach((fn) => fn())
    triggers.forEach((st) => st.kill())
    timelines.forEach((tl) => tl.kill())
  }
}
