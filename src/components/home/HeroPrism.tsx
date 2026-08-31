import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ACESFilmicToneMapping, NoToneMapping } from 'three'
import { HeroErrorBoundary } from './HeroErrorBoundary'
import { HeroPrismDebugPanel } from './HeroPrismDebugPanel'
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
  const dpr: number | [number, number] = reducedMotion || isMobile ? 1 : [1, 2]
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
          /* Was unset (1.0). Lifting it makes highlights and env reflections
             pop without shifting hue, since ACES is applied after. */
          toneMappingExposure: 1.2,
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

/** Square-base pyramid glass (four equilateral faces) + dispersion beams (tunable with P). */
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
          {/*
           * No still fallback at all. The cutout that used to fill in here was
           * a stock graphic carrying "-FUTURE" branding that is not Meolaa's,
           * so showing it on a WebGL failure was worse than showing nothing —
           * the hero background covers the gap.
           */}
          {webglSupported === true && (
            <div className={`hero-prism__webgl${webglReady ? ' is-ready' : ''}`}>
              <HeroErrorBoundary fallback={null}>
                <HeroPrismCanvas onReady={() => setWebglReady(true)} />
              </HeroErrorBoundary>
            </div>
          )}
        </div>
      </div>
      <HeroPrismDebugPanel />
    </>
  )
}
