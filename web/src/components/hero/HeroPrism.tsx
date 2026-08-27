import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { ACESFilmicToneMapping } from 'three'
import { HeroErrorBoundary } from './HeroErrorBoundary'
import { PrismScene } from './PrismScene'
import './HeroPrism.css'

/**
 * 3D prism stage only — parent section provides fold + hero copy.
 * Camera sits low and looks up so the square base reads as a thin diamond
 * (matches the reference pyramid pose).
 */
export function HeroPrism() {
  return (
    <div className="hero-prism" aria-hidden="true">
      <div className="hero-prism__stage">
        <HeroErrorBoundary>
          <Canvas
            className="hero-prism__canvas"
            dpr={[1, 2]}
            camera={{
              // Low angle → looking up at apex; base foreshortens into a wide diamond
              position: [0, -1.35, 4.05],
              fov: 36,
              near: 0.1,
              far: 40,
            }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
              toneMapping: ACESFilmicToneMapping,
            }}
            onCreated={({ gl }) => {
              gl.setClearColor('#000000')
            }}
          >
            <Suspense fallback={null}>
              <PrismScene />
            </Suspense>
          </Canvas>
        </HeroErrorBoundary>
      </div>
    </div>
  )
}
