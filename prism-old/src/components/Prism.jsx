import { forwardRef, useMemo } from 'react'
import * as THREE from 'three'
import { PRISM_DEPTH, PRISM_SCALE } from '../constants/prism'

/** Extrusion along Z — close to side length so both end caps read as the same triangle. */
const DEPTH = PRISM_DEPTH

/**
 * Triangular prism: true equilateral cross-section in XY (apex up, base down),
 * extruded along Z. Slanted sides are the beam entry/exit faces; ±Z caps face
 * the camera when viewing along Z.
 *
 * Equilateral vertices (side = 1.4):
 *   apex (0, 0.808), base (−0.7, −0.404) / (0.7, −0.404)
 */
function createPrismGeometry() {
  const shape = new THREE.Shape()
  shape.moveTo(-0.7, -0.404)
  shape.lineTo(0.7, -0.404)
  shape.lineTo(0, 0.808)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    // Chunkier bevel: the edge facets are what catch the rim lights and give
    // the prism its bright outline against a black backdrop.
    bevelThickness: 0.055,
    bevelSize: 0.055,
    bevelSegments: 4,
  })
  geometry.center()

  return geometry
}

const DEFAULT_ROTATION = [0, 0, 0]

const Prism = forwardRef(function Prism(
  { position = [0, 0, 0], rotation = DEFAULT_ROTATION },
  ref,
) {
  const geometry = useMemo(() => createPrismGeometry(), [])

  return (
    <mesh
      ref={ref}
      position={position}
      rotation={rotation}
      scale={PRISM_SCALE}
      geometry={geometry}
    >
      {/*
        Smoky glass rather than clear: against a near-black background a fully
        transmissive prism vanishes. Partial transmission + a dark base colour
        keeps the body readable, while low roughness and strong clearcoat make
        the facet edges catch light the way the reference does.
      */}
      <meshPhysicalMaterial
        color="#080a10"
        transmission={0.62}
        transparent
        opacity={1}
        roughness={0.16}
        metalness={0}
        ior={1.62}
        thickness={DEPTH}
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
