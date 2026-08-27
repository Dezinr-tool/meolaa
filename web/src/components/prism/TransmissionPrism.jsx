import { forwardRef, useMemo } from 'react'
import { MeshTransmissionMaterial } from '@react-three/drei'
import {
  PRISM_DEPTH,
  PRISM_SCALE,
  createTetrahedronGeometry,
} from './constants/prism'

/**
 * Same regular tetrahedron as Prism.jsx, with MeshTransmissionMaterial so
 * scene content (hero text) refracts through glass.
 *
 * Raytracer only flips `material.side` for intersection tests — it does not
 * read IOR/transmission from the material.
 */

const GLASS_IOR = 1.62

const TransmissionPrism = forwardRef(function TransmissionPrism(
  { position = [0, 0, 0], rotation = [0, 0, 0] },
  ref,
) {
  const geometry = useMemo(() => createTetrahedronGeometry(), [])

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
        thickness={PRISM_DEPTH}
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
