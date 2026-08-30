import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, NoToneMapping } from 'three'
import { HeroErrorBoundary } from './HeroErrorBoundary'
import { HeroPrismDebugPanel } from './HeroPrismDebugPanel'
import { HeroPrismFallback } from './HeroPrismFallback'
import { DEFAULT_PRISM_SETTINGS } from './heroPrismSettings'
import './HeroPrism.css'

const HeroPrismScene = lazy(() => import('./HeroPrismScene'))
const HeroPrismBeams = lazy(() => import('./HeroPrismBeams'))

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function HeroPrismCanvas({ onReady }: { onReady: () => void }) {
  const isMobile = window.matchMedia('(max-width: 900px)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dpr = reducedMotion ? 1 : isMobile ? 1 : Math.min(window.devicePixelRatio, 2)
  const s = DEFAULT_PRISM_SETTINGS

  return (
    <>
      {/* Beams under the glass — white beam reads as entering behind the crystal;
          spectrum still shows to the right where the glass canvas is clear. */}
      <Canvas
        className="hero-prism__canvas hero-prism__canvas--beams"
        dpr={dpr}
        camera={{
          position: [s.camX, s.camY, s.camZ],
          fov: s.camFov,
          near: 0.1,
          far: 40,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: NoToneMapping,
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0)
          camera.lookAt(s.lookX, s.lookY, s.lookZ)
        }}
      >
        <Suspense fallback={null}>
          <HeroPrismBeams />
        </Suspense>
      </Canvas>

      <Canvas
        className="hero-prism__canvas hero-prism__canvas--glass"
        dpr={dpr}
        camera={{
          position: [s.camX, s.camY, s.camZ],
          fov: s.camFov,
          near: 0.1,
          far: 40,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0)
          camera.lookAt(s.lookX, s.lookY, s.lookZ)
          onReady()
        }}
      >
        <Suspense fallback={null}>
          <HeroPrismScene />
        </Suspense>
      </Canvas>
    </>
  )
}

/** Apex-up triangular pyramid glass prism + dispersion beams (tunable with P). */
export function HeroPrism() {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)
  const [webglReady, setWebglReady] = useState(false)

  useEffect(() => {
    const supported = detectWebGL()
    setWebglSupported(supported)
    if (supported) {
      void import('./HeroPrismScene')
      void import('./HeroPrismBeams')
    }
  }, [])

  return (
    <>
      <div className="hero-prism" data-hero-prism aria-hidden="true">
        <div className="hero-prism__float">
          {!webglReady && <HeroPrismFallback />}
          {webglSupported === true && (
            <div className={`hero-prism__webgl${webglReady ? ' is-ready' : ''}`}>
              <HeroErrorBoundary
                fallback={webglReady ? null : <HeroPrismFallback />}
              >
                <HeroPrismCanvas onReady={() => setWebglReady(true)} />
              </HeroErrorBoundary>
            </div>
          )}
          {webglSupported === false && <HeroPrismFallback />}
        </div>
      </div>
      <HeroPrismDebugPanel />
    </>
  )
}
