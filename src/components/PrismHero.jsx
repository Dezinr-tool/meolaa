import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import Scene from './Scene'
import SettingsDrawer from '../settings/SettingsDrawer'
import './PrismHero.css'

/**
 * Ported from prism-main's src/App.jsx, adapted to sit as a live background
 * layer inside the site's existing hero fold (replacing the old
 * <video className="hero__bg-video">) rather than owning its own top-level
 * pinned section — this site already runs one shared Lenis + GSAP
 * ScrollTrigger instance and its own hero-dock scroll pin, so PrismHero
 * does not create a second Lenis or its own pin (see Scene.jsx for the
 * matching scrub-instead-of-pin change). Camera position/fov, tone mapping,
 * and everything inside <Scene> (geometry, physics, logo-centering math)
 * are untouched.
 */

/** Keep the renderer sized to the hero fold (it fills its parent, not the window). */
function CanvasResizer({ targetRef }) {
  const setSize = useThree((s) => s.setSize)

  useLayoutEffect(() => {
    const el = targetRef.current
    if (!el) return
    const apply = () => {
      const { clientWidth, clientHeight } = el
      if (clientWidth > 0 && clientHeight > 0) setSize(clientWidth, clientHeight)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    window.addEventListener('resize', apply)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [setSize, targetRef])

  return null
}

export default function PrismHero() {
  const stageRef = useRef(null)

  return (
    <div ref={stageRef} className="prism-hero" aria-hidden="true">
      <Canvas
        camera={{ position: [4, 2.5, 7], fov: 45 }}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <CanvasResizer targetRef={stageRef} />
        <Scene />
      </Canvas>
      <SettingsDrawer />
    </div>
  )
}
