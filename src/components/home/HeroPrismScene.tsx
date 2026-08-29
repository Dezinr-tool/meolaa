import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, MeshTransmissionMaterial } from '@react-three/drei'
import type { Group } from 'three'
import { ExtrudeGeometry, Shape } from 'three'

function createEquilateralPrismGeometry(side = 1, depth = 0.55) {
  const height = (side * Math.sqrt(3)) / 2
  const shape = new Shape()
  shape.moveTo(0, height / 2)
  shape.lineTo(-side / 2, -height / 2)
  shape.lineTo(side / 2, -height / 2)
  shape.closePath()

  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 1,
  })
  geometry.center()
  return geometry
}

function PrismMesh() {
  const groupRef = useRef<Group>(null)
  const geometry = useMemo(() => createEquilateralPrismGeometry(), [])
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return
    groupRef.current.rotation.y += delta * 0.28
    groupRef.current.rotation.x = Math.sin(performance.now() * 0.00035) * 0.08
  })

  return (
    <group ref={groupRef} rotation={[0.12, -0.35, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <MeshTransmissionMaterial
          backside
          samples={4}
          resolution={256}
          transmission={1}
          thickness={0.65}
          roughness={0.04}
          ior={1.52}
          chromaticAberration={0.12}
          anisotropy={0.25}
          distortion={0.08}
          distortionScale={0.25}
          temporalDistortion={0.04}
          clearcoat={1}
          clearcoatRoughness={0.05}
          attenuationDistance={0.85}
          attenuationColor="#ffffff"
          color="#ffffff"
          envMapIntensity={1.35}
        />
      </mesh>
    </group>
  )
}

/** Lazy-loaded R3F scene — must render inside an eager `<Canvas>` parent. */
export default function HeroPrismScene() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight position={[2.5, 3.5, 4]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-3, 1.5, 2]} intensity={0.55} color="#ffd6e8" />
      <pointLight position={[0, -1.2, 1.8]} intensity={0.35} color="#5ec8ff" distance={6} />
      <pointLight position={[1.4, 0.8, -1.2]} intensity={0.25} color="#ffb347" distance={5} />
      <pointLight position={[-1.2, 0.4, -0.8]} intensity={0.2} color="#b388ff" distance={5} />

      <Environment preset="city" environmentIntensity={0.45} background={false} />

      <PrismMesh />
    </>
  )
}
