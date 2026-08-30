import * as THREE from 'three'
import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import Scene from './components/Scene'
import ScrollToContinue from './components/ScrollToContinue'
import { setupLenis } from './scroll/setupLenis'
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion'

/**
 * Re-sync R3F size if the hero box changes after mount (scrollbar-gutter /
 * Lenis). Avoids a stale first-paint size if the layout width shifts.
 */
function CanvasSizeSync({ targetRef }) {
  const setSize = useThree((s) => s.setSize)

  useLayoutEffect(() => {
    const el = targetRef.current
    if (!el) return undefined

    const sync = () => {
      const { clientWidth: w, clientHeight: h } = el
      if (w > 0 && h > 0) setSize(w, h)
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    window.addEventListener('resize', sync)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [setSize, targetRef])

  return null
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()
  const heroRef = useRef(null)

  useEffect(() => {
    if (reducedMotion) return undefined
    return setupLenis()
  }, [reducedMotion])

  return (
    <div className="app-scroll">
      <section id="hero" className="hero" ref={heroRef}>
        <Canvas
          camera={{ position: [4, 2.5, 7], fov: 45 }}
          gl={{
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <CanvasSizeSync targetRef={heroRef} />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
        <ScrollToContinue />
      </section>
    </div>
  )
}
