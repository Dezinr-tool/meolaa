import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { HERO_TRIGGER } from '../animation/timeline'
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger)

/**
 * Fixed bottom hint while the hero is pinned. Fades out after ~10% of the
 * pinned range; returns if the user scrolls back to the start. Idle bounce
 * on the chevron is independent of the scrubbed hero timeline.
 */
export default function ScrollToContinue() {
  const rootRef = useRef(null)
  const iconRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (reducedMotion) {
      setShow(false)
      return
    }

    const root = rootRef.current
    if (!root) return

    const st = ScrollTrigger.create({
      trigger: HERO_TRIGGER,
      start: 'top top',
      end: '+=200%',
      onUpdate: (self) => {
        // Visible only while pinned near the start of the sequence
        setShow(self.isActive && self.progress < 0.1)
      },
      onToggle: (self) => {
        if (!self.isActive) setShow(false)
        else if (self.progress < 0.1) setShow(true)
      },
    })

    return () => st.kill()
  }, [reducedMotion])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    gsap.to(root, {
      autoAlpha: show ? 1 : 0,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: true,
    })
  }, [show])

  useEffect(() => {
    if (reducedMotion) return
    const icon = iconRef.current
    if (!icon) return

    const bounce = gsap.to(icon, {
      y: 6,
      duration: 0.9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })

    return () => bounce.kill()
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <div
      ref={rootRef}
      className="scroll-to-continue"
      aria-hidden={!show}
    >
      <span ref={iconRef} className="scroll-to-continue__icon" aria-hidden>
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
          <rect
            x="1"
            y="1"
            width="18"
            height="26"
            rx="9"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="10" cy="8" r="2" fill="currentColor" />
        </svg>
      </span>
      <span className="scroll-to-continue__label">Scroll</span>
    </div>
  )
}
