import { useEffect, type RefObject } from 'react'

/** Adds `.is-in` when elements enter the viewport (press-reveal, how-work, etc.). */
export function useRevealOnScroll(
  rootRef: RefObject<HTMLDivElement | null>,
  selector = '.press-reveal, .how-work__fn',
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const items = Array.from(root.querySelectorAll<HTMLElement>(selector))
    if (!items.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      items.forEach((el) => el.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
          }
        })
      },
      { root: null, threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [rootRef, selector])
}
