import { lazy, Suspense, useEffect, useState } from 'react'
import { HeroPrismFallback } from './HeroPrismFallback'
import './HeroPrism.css'

const HeroPrism3D = lazy(() => import('./HeroPrism3D'))

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Glass equilateral triangle prism — sits above the hero wordmark. */
export function HeroPrism() {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setWebglSupported(detectWebGL())
  }, [])

  return (
    <div className="hero-prism" data-hero-prism aria-hidden="true">
      <div className="hero-prism__float">
        {webglSupported === false ? (
          <HeroPrismFallback />
        ) : (
          <Suspense fallback={<HeroPrismFallback />}>
            {webglSupported && <HeroPrism3D />}
          </Suspense>
        )}
      </div>
    </div>
  )
}
