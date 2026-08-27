import { forwardRef, useMemo } from 'react'
import { MeshTransmissionMaterial } from '@react-three/drei'
import {
  PRISM_DEPTH,
  PRISM_SCALE,
  createPyramidGeometry,
} from './constants/prism'

/**
 * Same square pyramid as Prism.jsx, with MeshTransmissionMaterial.
 *
 * Tuned toward prism-old FUTURE: thinner optical path + moderate CA so letter
 * cores stay bright white with saturated edge fringing (not muddy blobs).
 */

const TransmissionPrism = forwardRef(function TransmissionPrism(
  { position = [0, 0, 0], rotation = [0, 0, 0] },
  ref,
) {
  const geometry = useMemo(() => createPyramidGeometry(), [])

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
        samples={14}
        resolution={1024}
        transmission={1}
        roughness={0.02}
        thickness={PRISM_DEPTH * 0.35}
        ior={1.4}
        chromaticAberration={0.32}
        anisotropicBlur={0.12}
        distortion={0.35}
        distortionScale={0.28}
        temporalDistortion={0}
        color="#f4f7ff"
        attenuationColor="#ffffff"
        attenuationDistance={16}
        envMapIntensity={0.5}
      />
    </mesh>
  )
})

export default TransmissionPrism
