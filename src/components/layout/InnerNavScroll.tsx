import { useEffect } from 'react'

/** Toggles `.is-scrolled` on the editorial nav as the user scrolls inner pages. */
export function InnerNavScroll() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.site-nav')
    if (!nav) return

    const onScroll = () => {
      nav.classList.toggle('is-scrolled', window.scrollY > 20)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return null
}
