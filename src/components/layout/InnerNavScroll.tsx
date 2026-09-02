import { useEffect } from 'react'
import { getLenisInstance } from '../../lib/lenisInstance'
import type Lenis from 'lenis'

const NAV_GLASS_Y = 40
const NAV_HIDE_Y = 72
const NAV_TOP_Y = 8
/* Cumulative upward distance since the last downward tick — the bar only
   reappears once this clears NAV_REAPPEAR_DELTA, matching the home nav. */
const NAV_REAPPEAR_DELTA = 120

/**
 * Toggles `.is-scrolled` / `.is-hidden` on the editorial nav as the user
 * scrolls inner pages — same glass + direction-hide behaviour as the home
 * nav (HomeAnimations), Lenis-synced when Lenis is running on the page.
 */
export function InnerNavScroll() {
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('.site-nav')
    if (!nav) return

    let lastY = window.scrollY
    let upAccum = 0
    let unsubLenis: (() => void) | null = null
    let navPollId = 0
    let usingWindowScroll = false

    const syncNav = (y: number, direction: 1 | -1 | 0) => {
      nav.classList.toggle('is-scrolled', y > NAV_GLASS_Y)

      if (y <= NAV_TOP_Y) {
        nav.classList.remove('is-hidden')
        upAccum = 0
        lastY = y
        return
      }

      const dir = direction !== 0 ? direction : y > lastY ? 1 : y < lastY ? -1 : 0
      if (dir === 1 && y > NAV_HIDE_Y) {
        nav.classList.add('is-hidden')
        upAccum = 0
      } else if (dir === -1) {
        upAccum += lastY - y
        if (upAccum >= NAV_REAPPEAR_DELTA) {
          nav.classList.remove('is-hidden')
        }
      } else {
        upAccum = 0
      }
      lastY = y
    }

    const onLenisScroll = (lenis: Lenis) => {
      syncNav(lenis.scroll, lenis.direction)
    }

    const onWindowScroll = () => {
      const delta = window.scrollY - lastY
      const direction: 1 | -1 | 0 = delta > 0 ? 1 : delta < 0 ? -1 : 0
      syncNav(window.scrollY, direction)
    }

    const attachNavScroll = () => {
      const lenis = getLenisInstance()
      if (lenis) {
        unsubLenis = lenis.on('scroll', onLenisScroll)
        syncNav(lenis.scroll, lenis.direction)
        return true
      }
      return false
    }

    if (!attachNavScroll()) {
      let tries = 0
      navPollId = window.setInterval(() => {
        tries += 1
        if (attachNavScroll() || tries > 40) {
          window.clearInterval(navPollId)
          navPollId = 0
          if (!unsubLenis) {
            usingWindowScroll = true
            syncNav(window.scrollY, 0)
            window.addEventListener('scroll', onWindowScroll, { passive: true })
          }
        }
      }, 16)
    }

    return () => {
      if (navPollId) window.clearInterval(navPollId)
      unsubLenis?.()
      if (usingWindowScroll) {
        window.removeEventListener('scroll', onWindowScroll)
      }
      nav.classList.remove('is-hidden', 'is-scrolled')
    }
  }, [])

  return null
}
