import { forwardRef, useMemo } from 'react'
import {
  PRISM_DEPTH,
  PRISM_SCALE,
  createPyramidGeometry,
} from './constants/prism'

/**
 * Square-based pyramid glass solid (4 isosceles slant faces + square base).
 * Geometry shared with TransmissionPrism via createPyramidGeometry.
 */
const Prism = forwardRef(function Prism(
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
    >
      <meshPhysicalMaterial
        color="#080a10"
        transmission={0.62}
        transparent
        opacity={1}
        roughness={0.16}
        metalness={0}
        ior={1.62}
        thickness={PRISM_DEPTH}
        envMapIntensity={1.6}
        clearcoat={0.7}
        clearcoatRoughness={0.18}
        reflectivity={0.55}
        specularIntensity={1}
        iridescence={0.55}
        iridescenceIOR={1.9}
        iridescenceThicknessRange={[120, 780]}
      />
    </mesh>
  )
})

export default Prism
