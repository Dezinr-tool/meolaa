/**
 * Static display heading wrapper (formerly scroll-scrub parallax).
 * Keeps layout class hooks; GSAP enter/reveal tweens still target the inner tag.
 */
import { createElement, type ElementType, type ReactNode } from 'react'
import './ParallaxHeading.css'

type Align = 'center' | 'start'

type ParallaxHeadingProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  id?: string
  align?: Align
  /** @deprecated No longer applied — scroll parallax removed. */
  midY?: number
  /** @deprecated No longer applied — scroll parallax removed. */
  scrub?: number
}

export function ParallaxHeading({
  as: Tag = 'h2',
  children,
  className,
  id,
  align = 'center',
}: ParallaxHeadingProps) {
  return (
    <div className={`parallax-heading parallax-heading--${align}`}>
      <div className="parallax-heading__mid">
        {createElement(Tag, { className, id }, children)}
      </div>
    </div>
  )
}
