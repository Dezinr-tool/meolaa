import { forwardRef, useMemo } from 'react'
import {
  PRISM_DEPTH,
  PRISM_SCALE,
  createTetrahedronGeometry,
} from './constants/prism'

/**
 * Regular tetrahedron glass solid (4 equilateral faces). Geometry is shared
 * with TransmissionPrism via createTetrahedronGeometry.
 */
const Prism = forwardRef(function Prism(
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
