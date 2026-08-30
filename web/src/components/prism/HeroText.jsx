import { forwardRef, Suspense, useMemo } from 'react'
import { Billboard, Text, useFont } from '@react-three/drei'
import * as THREE from 'three'

const FONT_URL = '/fonts/Inter-Bold.woff'

// Font atlas ready before first paint (same suspend-react pattern as useGLTF.preload)
useFont.preload(FONT_URL)

/**
 * Flat hero type behind the prism (no 3D tilt). Billboard keeps the plane
 * camera-facing; outer group holds world position for the slide-in (x→0 at
 * the shared prism/text origin, z=-2 behind the glass).
 *
 * renderOrder -1 so TransmissionPrism composites over the letters and
 * refracts them during the textReveal slide.
 */
const HeroText = forwardRef(function HeroText(
  {
    children = 'MEOLAA',
    position = [0, 0, -2],
    fontSize = 1.55,
    letterSpacing = 0.12,
    color = '#ffffff',
  },
  ref,
) {
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        toneMapped: false,
        depthWrite: true,
        transparent: true,
        opacity: 0,
      }),
    [color],
  )

  return (
    <Suspense fallback={null}>
      <group ref={ref} position={position} userData={{ material }}>
        <Billboard follow>
          <Text
            font={FONT_URL}
            fontSize={fontSize}
            letterSpacing={letterSpacing}
            anchorX="center"
            anchorY="middle"
            // Flush to camera — no fake perspective tilt
            rotation={[0, 0, 0]}
            material={material}
            renderOrder={-1}
            frustumCulled={false}
          >
            {String(children).toUpperCase()}
          </Text>
        </Billboard>
      </group>
    </Suspense>
  )
})

export default HeroText
