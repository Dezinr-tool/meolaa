import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from '../lib/motion'
import { getLenisInstance } from '../lib/lenisInstance'

/** Reset scroll + refresh ScrollTrigger when React Router changes pages. */
export function RouteScrollManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    const lenis = getLenisInstance()
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    } else {
      window.scrollTo(0, 0)
    }

    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [pathname])

  return null
}
