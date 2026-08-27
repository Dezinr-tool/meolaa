import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Scene from './Scene'
import ScrollToContinue from './ScrollToContinue'
import { HeroErrorBoundary } from '../hero/HeroErrorBoundary'
import {
  markPrismSceneReady,
  resetPrismSceneReady,
} from '../../lib/prismReady'
import { PAUSE_LIGHT_AND_SCROLL, PRISM_SECTION_BG } from './debugFlags'
import './PrismDispersionSection.css'

/**
 * Re-sync R3F size if the hero box changes after mount (scrollbar-gutter /
 * Lenis). Avoids a stale first-paint size if the layout width shifts.
 */
function CanvasSizeSync({
  targetRef,
}: {
  targetRef: RefObject<HTMLElement | null>
}) {
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

/**
 * Physics-driven prism light-dispersion hero (ported from prism-old).
 * ScrollTrigger pin id: `prism-dispersion-pin` on `#prism-dispersion`.
 */
export function PrismDispersionSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    resetPrismSceneReady()
    return () => {
      // If the section unmounts mid-load, never block the preloader forever
      markPrismSceneReady(true)
    }
  }, [])

  return (
    <section
      id="prism-dispersion"
      ref={sectionRef}
      className="prism-dispersion"
      data-section="prism-dispersion"
      aria-label="Meolaa light dispersion"
      style={
        PRISM_SECTION_BG != null
          ? { background: PRISM_SECTION_BG }
          : undefined
      }
    >
      <HeroErrorBoundary
        onError={() => {
          markPrismSceneReady(true)
        }}
      >
        <Canvas
          className="prism-dispersion__canvas"
          camera={{ position: [4, 2.5, 7], fov: 45 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.setClearColor(PRISM_SECTION_BG ?? '#000000')
          }}
        >
          <CanvasSizeSync targetRef={sectionRef} />
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </HeroErrorBoundary>
      {!PAUSE_LIGHT_AND_SCROLL ? <ScrollToContinue /> : null}
    </section>
  )
}
