import { forwardRef, useMemo } from 'react'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { PRISM_DEPTH, PRISM_SCALE } from '../constants/prism'

/**
 * Same equilateral extruded prism as Prism.jsx, but with
 * MeshTransmissionMaterial so scene content (hero text) refracts through glass.
 *
 * Raytracer coupling note: raytracer.js only temporarily sets `material.side`
 * for DoubleSide intersection tests — it does not read IOR/transmission from
 * the material. Option (a) is safe; Prism.jsx stays untouched.
 */

const DEPTH = PRISM_DEPTH

/** Match Prism.jsx visual IOR (dispersion.js Cauchy A≈1.5 is per-band physics). */
const GLASS_IOR = 1.62

function createTransmissionPrismGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(-0.7, -0.404)
  shape.lineTo(0.7, -0.404)
  shape.lineTo(0, 0.808)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.055,
    bevelSegments: 4,
  })
  geometry.center()
  return geometry
}

const DEFAULT_ROTATION = [0, 0, 0]

const TransmissionPrism = forwardRef(function TransmissionPrism(
  { position = [0, 0, 0], rotation = DEFAULT_ROTATION },
  ref,
) {
  const geometry = useMemo(() => createTransmissionPrismGeometry(), [])

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={rotation}
      scale={PRISM_SCALE}
      geometry={geometry}
      renderOrder={1}
    >
      <MeshTransmissionMaterial
        backside
        samples={12}
        resolution={768}
        transmission={1}
        roughness={0.02}
        thickness={DEPTH}
        ior={GLASS_IOR}
        chromaticAberration={0.28}
        anisotropicBlur={0.4}
        distortion={0.4}
        distortionScale={0.3}
        temporalDistortion={0}
        color="#e8eef8"
        attenuationColor="#ffffff"
        attenuationDistance={4}
      />
    </mesh>
  )
})

export default TransmissionPrism
