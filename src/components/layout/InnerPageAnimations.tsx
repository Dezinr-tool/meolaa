import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { mountInnerPageAnimations } from '../../lib/innerPageAnimations'

/** GSAP ScrollTrigger animations for editorial inner pages (About, Story, Lab, Careers). */
export function InnerPageAnimations() {
  const { pathname } = useLocation()

  useEffect(() => mountInnerPageAnimations(), [pathname])
  return null
}
