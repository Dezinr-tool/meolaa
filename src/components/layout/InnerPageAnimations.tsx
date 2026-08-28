import { useEffect } from 'react'
import { mountInnerPageAnimations } from '../../lib/innerPageAnimations'

/** GSAP ScrollTrigger animations for editorial inner pages (About, Story, Lab, Careers). */
export function InnerPageAnimations() {
  useEffect(() => mountInnerPageAnimations(), [])
  return null
}
