import { forwardRef, useMemo } from 'react'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

export const PRISM_SCALE = 1.54

/** Extrusion depth of the prism — matches the reference (bru-prism). */
const EXTRUDE_DEPTH = 1.1

/**
 * Triangular prism, exactly as the reference: a triangle in the XY plane
 * (apex up +Y) extruded along Z with a small bevel, then centered. No standing
 * rotation — the scene tilts it via the `rotation` prop.
 *
 * Defaults (halfWidth 0.7, height 1.212) reproduce the reference cross-section
 * moveTo(-0.7,-0.404) → (0.7,-0.404) → (0,0.808).
 */
function createPrismGeometry(halfWidth = 0.7, height = 1.212) {
  const baseY = -height / 3
  const apexY = (height * 2) / 3

  const shape = new THREE.Shape()
  shape.moveTo(-halfWidth, baseY)
  shape.lineTo(halfWidth, baseY)
  shape.lineTo(0, apexY)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.055,
    bevelSegments: 4,
  })
  geometry.center()
  return geometry
}

const DEFAULT_ROTATION = [0, 0, 0]

const Prism = forwardRef(function Prism(
  {
    position = [0, 0, 0],
    rotation = DEFAULT_ROTATION,
    scale = PRISM_SCALE,
    baseHalf = 0.7,
    height = 1.212,
    roughness = 0.02,
    transmission = 1,
    thickness = 1.1,
    ior = 1.62,
    chromaticAberration = 0.28,
    anisotropicBlur = 0.4,
    distortion = 0.4,
    distortionScale = 0.3,
    temporalDistortion = 0,
    samples = 12,
    resolution = 768,
  },
  ref,
) {
  const geometry = useMemo(
    () => createPrismGeometry(baseHalf, height),
    [baseHalf, height],
  )

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={rotation}
      scale={scale}
      geometry={geometry}
      renderOrder={1}
    >
      <MeshTransmissionMaterial
        backside
        samples={samples}
        resolution={resolution}
        transmission={transmission}
        roughness={roughness}
        thickness={thickness}
        ior={ior}
        chromaticAberration={chromaticAberration}
        anisotropicBlur={anisotropicBlur}
        distortion={distortion}
        distortionScale={distortionScale}
        temporalDistortion={temporalDistortion}
        color="#e8eef8"
        attenuationColor="#ffffff"
        attenuationDistance={4}
      />
    </mesh>
  )
})

export default Prism
