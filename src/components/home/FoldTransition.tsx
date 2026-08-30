/**
 * Fold-to-fold wipe.
 *
 * A single fixed panel rises from the bottom as you approach a section
 * boundary, covers the viewport at the boundary itself, then keeps rising to
 * reveal the next fold — so a section change reads as a deliberate transition
 * rather than content sliding past.
 *
 * Why one panel driven by scrollY, rather than a ScrollTrigger per boundary:
 * this page has several pinned folds, and a pinned section's own rect is
 * `fixed` while it's parked, so triggers keyed to it fight the pin. The
 * boundaries are read off the pin-spacers instead (those stay in normal flow),
 * and the panel is positioned from raw scroll position — nothing to desync.
 */
import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../lib/motion'
import './FoldTransition.css'

/** Half the transition window, as a fraction of the viewport. The wipe starts
 *  this far before a boundary and finishes this far after. Larger = slower,
 *  more languid; smaller = snappier. */
const WIPE_HALF_VH = 0.42

export function FoldTransition() {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /* Scroll positions where one fold hands over to the next. For a pinned
       section that is its pin-spacer's top (the spacer stays in normal flow,
       so its rect is honest); for an unpinned one, the section's own top. */
    let boundaries: number[] = []

    const measure = () => {
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('main section[data-section]'),
      )
      boundaries = sections
        .map((section) => {
          const parent = section.parentElement
          const box =
            parent && parent.classList.contains('pin-spacer') ? parent : section
          return Math.round(box.getBoundingClientRect().top + window.scrollY)
        })
        /* Drop the first — there is no fold before the hero to wipe from. */
        .filter((y) => y > 1)
        .sort((a, b) => a - b)
    }

    measure()
    ScrollTrigger.addEventListener('refresh', measure)

    /* GSAP owns the transform from here — see the note in the stylesheet. */
    gsap.set(panel, { yPercent: 100, visibility: 'visible' })

    const setY = gsap.quickSetter(panel, 'yPercent') as (v: number) => void
    let lastY = 100

    const update = () => {
      const y = window.scrollY
      const half = window.innerHeight * WIPE_HALF_VH

      /* Nearest boundary within the window; -1..0..1 across it. */
      let t = 1
      for (const b of boundaries) {
        const d = (y - b) / half
        if (Math.abs(d) < Math.abs(t)) t = d
      }
      t = Math.max(-1, Math.min(1, t))

      /* t = -1 → panel just below the viewport, 0 → covering, +1 → just above.
         Linear by design: the ask was a steady wipe, not an eased one. */
      const next = -t * 100
      if (next !== lastY) {
        lastY = next
        setY(next)
      }
    }

    gsap.ticker.add(update)
    update()

    return () => {
      gsap.ticker.remove(update)
      ScrollTrigger.removeEventListener('refresh', measure)
    }
  }, [])

  return (
    <div className="fold-wipe" aria-hidden="true">
      <div className="fold-wipe__panel" ref={panelRef} />
    </div>
  )
}
