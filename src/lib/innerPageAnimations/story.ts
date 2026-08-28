import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'
import {
  gsap,
  prefersReducedMotion,
  scrollToElement,
  ScrollTrigger,
} from './shared'

export function initStoryRail(): () => void {
  const body = document.querySelector<HTMLElement>('[data-story-body]')
  const rail = document.querySelector<HTMLElement>('[data-story-rail]')
  if (!body || !rail) return () => {}

  const chapters = Array.from(
    body.querySelectorAll<HTMLElement>('[data-story-chapter]'),
  )
  const items = Array.from(
    rail.querySelectorAll<HTMLElement>('[data-story-rail-item]'),
  )
  const progressEl = rail.querySelector<HTMLElement>('[data-story-rail-progress]')
  const mobileBar = document.querySelector<HTMLElement>('[data-story-rail-mobile]')
  const mobileFill = mobileBar?.querySelector<HTMLElement>(
    '[data-story-rail-mobile-fill]',
  )
  const mobileLabel = mobileBar?.querySelector<HTMLElement>(
    '[data-story-rail-mobile-label]',
  )

  if (!chapters.length || !items.length) return () => {}

  let lastIndex = -1
  let progressTrigger: ST | null = null
  const spyTriggers: ST[] = []
  const cleanups: (() => void)[] = []

  function setProgress(p: number) {
    const clamped = Math.max(0, Math.min(1, p))
    const pct = `${(clamped * 100).toFixed(2)}%`
    if (progressEl) progressEl.style.height = pct
    if (mobileFill) mobileFill.style.width = pct
    rail!.style.setProperty('--story-rail-progress', String(clamped))
  }

  function labelFor(index: number) {
    const item = items[index]
    if (!item) return ''
    const year = item.querySelector('.story-rail__year')?.textContent?.trim() ?? ''
    const name = item.querySelector('.story-rail__name')?.textContent?.trim() ?? ''
    return [year, name].filter(Boolean).join(' · ')
  }

  function setActive(index: number) {
    const i = Math.max(0, Math.min(chapters.length - 1, index))
    if (i === lastIndex) return
    lastIndex = i

    items.forEach((el, n) => {
      const on = n === i
      el.classList.toggle('is-active', on)
      el.classList.toggle('is-past', n < i)
      el.setAttribute('aria-current', on ? 'step' : 'false')
    })

    chapters.forEach((el, n) => {
      el.classList.toggle('is-story-active', n === i)
    })

    if (mobileLabel) mobileLabel.textContent = labelFor(i)
  }

  function chapterProgress() {
    const first = chapters[0]
    const last = chapters[chapters.length - 1]
    if (!first || !last) return 0
    const start = first.offsetTop - window.innerHeight * 0.45
    const end = last.offsetTop + last.offsetHeight - window.innerHeight * 0.45
    if (end <= start) return 1
    return (window.scrollY - start) / (end - start)
  }

  function killTriggers() {
    progressTrigger?.kill()
    progressTrigger = null
    while (spyTriggers.length) spyTriggers.pop()?.kill()
  }

  function setupStaticFallback() {
    body!.classList.add('is-story-rail-ready', 'is-story-rail-static')
    setActive(0)
    setProgress(0)

    const onScroll = () => {
      const mid = window.scrollY + window.innerHeight * 0.42
      let best = 0
      chapters.forEach((ch, i) => {
        if (ch.offsetTop <= mid) best = i
      })
      setActive(best)
      setProgress(chapterProgress())
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    cleanups.push(() => window.removeEventListener('scroll', onScroll))
  }

  function setupScrollTrigger() {
    killTriggers()

    const first = chapters[0]
    const last = chapters[chapters.length - 1]

    progressTrigger = ScrollTrigger.create({
      trigger: first,
      endTrigger: last,
      start: 'top 45%',
      end: 'bottom 45%',
      scrub: 0.35,
      onUpdate: (self) => setProgress(self.progress),
      onEnter: () => {
        body!.classList.add('is-story-rail-engaged')
        rail!.classList.add('is-visible')
        mobileBar?.classList.add('is-visible')
      },
      onEnterBack: () => {
        body!.classList.add('is-story-rail-engaged')
        rail!.classList.add('is-visible')
        mobileBar?.classList.add('is-visible')
      },
      onLeave: () => {
        setProgress(1)
        setActive(chapters.length - 1)
      },
      onLeaveBack: () => {
        body!.classList.remove('is-story-rail-engaged')
        rail!.classList.remove('is-visible')
        mobileBar?.classList.remove('is-visible')
        setProgress(0)
      },
    })

    chapters.forEach((chapter, i) => {
      const isLast = i === chapters.length - 1
      const st = ScrollTrigger.create({
        trigger: chapter,
        start: 'top 52%',
        end: isLast ? 'bottom bottom' : 'bottom 48%',
        onToggle: (self) => {
          if (self.isActive) setActive(i)
        },
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      })
      spyTriggers.push(st)
    })

    body!.classList.remove('is-story-rail-static')
    body!.classList.add('is-story-rail-ready')
    setActive(0)
    setProgress(0)
    ScrollTrigger.refresh()
  }

  items.forEach((btn, i) => {
    const onClick = (e: Event) => {
      e.preventDefault()
      scrollToElement(chapters[i]!)
    }
    btn.addEventListener('click', onClick)
    cleanups.push(() => btn.removeEventListener('click', onClick))
  })

  if (prefersReducedMotion()) {
    setupStaticFallback()
  } else {
    setupScrollTrigger()
  }

  let resizeTimer: ReturnType<typeof setTimeout>
  const onResize = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150)
  }
  window.addEventListener('resize', onResize)
  cleanups.push(() => window.removeEventListener('resize', onResize))

  return () => {
    cleanups.forEach((fn) => fn())
    killTriggers()
    body.classList.remove(
      'is-story-rail-ready',
      'is-story-rail-static',
      'is-story-rail-engaged',
    )
    rail.classList.remove('is-visible')
    mobileBar?.classList.remove('is-visible')
  }
}

export function initStoryHero(): () => void {
  const hero = document.querySelector<HTMLElement>('.story-hero[data-pg-hero]')
  if (!hero || prefersReducedMotion()) return () => {}

  const fades = Array.from(
    hero.querySelectorAll<HTMLElement>('[data-story-hero-fade]'),
  )
  const panel = hero.querySelector<HTMLElement>('[data-story-hero-panel]')
  const panelImg = panel?.querySelector<HTMLElement>('img')
  const triggers: ST[] = []

  gsap.set(fades, { opacity: 0, y: 28 })
  if (panel) gsap.set(panel, { opacity: 0, y: 36 })
  if (panelImg) gsap.set(panelImg, { yPercent: -4, scale: 1.04 })

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  tl.to(fades, { opacity: 1, y: 0, duration: 0.85, stagger: 0.12 })
  if (panel) tl.to(panel, { opacity: 1, y: 0, duration: 1 }, '-=0.55')
  if (panelImg) {
    tl.to(
      panelImg,
      { yPercent: 0, scale: 1, duration: 1.15, ease: 'power2.out' },
      '-=0.95',
    )
  }

  if (panelImg) {
    const st = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        gsap.set(panelImg, { yPercent: self.progress * 10 })
      },
    })
    triggers.push(st)
  }

  return () => {
    triggers.forEach((t) => t.kill())
    tl.kill()
    gsap.set([...fades, panel, panelImg].filter(Boolean), { clearProps: 'all' })
  }
}
