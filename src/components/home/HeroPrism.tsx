import { lazy, Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { HeroPrismFallback } from './HeroPrismFallback'
import './HeroPrism.css'

const HeroPrismScene = lazy(() => import('./HeroPrismScene'))

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function HeroPrismCanvas() {
  const isMobile = window.matchMedia('(max-width: 900px)').matches
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const dpr = reducedMotion ? 1 : isMobile ? 1 : Math.min(window.devicePixelRatio, 2)

  return (
    <Canvas
      className="hero-prism__canvas"
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={dpr}
      camera={{ position: [0, 0.05, 2.35], fov: 32, near: 0.1, far: 20 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <Suspense fallback={null}>
        <HeroPrismScene />
      </Suspense>
    </Canvas>
  )
}

/** Glass equilateral triangle prism — sits above the hero wordmark. */
export function HeroPrism() {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

  useEffect(() => {
    const supported = detectWebGL()
    setWebglSupported(supported)
    if (supported) {
      void import('./HeroPrismScene')
    }
  }, [])

  return (
    <div className="hero-prism" data-hero-prism aria-hidden="true">
      <div className="hero-prism__float">
        {webglSupported !== true ? <HeroPrismFallback /> : <HeroPrismCanvas />}
      </div>
    </div>
  )
}
