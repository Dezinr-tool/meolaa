import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

gsap.registerPlugin(ScrollTrigger)

/** "Scroll" hint pinned to the bottom — visible only near the top of the hero. */
export default function ScrollToContinue() {
  const rootRef = useRef(null)
  const iconRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (reducedMotion) {
      setVisible(false)
      return
    }
    if (!rootRef.current) return

    const st = ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: '+=200%',
      onUpdate: (self) => setVisible(self.isActive && self.progress < 0.1),
      onToggle: (self) => {
        if (self.isActive) {
          if (self.progress < 0.1) setVisible(true)
        } else {
          setVisible(false)
        }
      },
    })
    return () => st.kill()
  }, [reducedMotion])

  useEffect(() => {
    const el = rootRef.current
    if (el) {
      gsap.to(el, {
        autoAlpha: visible ? 1 : 0,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
      })
    }
  }, [visible])

  useEffect(() => {
    if (reducedMotion) return
    const el = iconRef.current
    if (!el) return
    const tween = gsap.to(el, {
      y: 6,
      duration: 0.9,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
    return () => tween.kill()
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <div ref={rootRef} className="scroll-to-continue" aria-hidden={!visible}>
      <span ref={iconRef} className="scroll-to-continue__icon" aria-hidden>
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
          <rect x="1" y="1" width="18" height="26" rx="9" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="8" r="2" fill="currentColor" />
        </svg>
      </span>
      <span className="scroll-to-continue__label">Scroll</span>
    </div>
  )
}
