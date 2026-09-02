import { forwardRef, useMemo, useRef } from 'react'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ContactFlareMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#ffffff'),
    uIntensity: 1,
    uStreak: 0.5,
    uSoftness: 6,
  },
  /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uStreak;
    uniform float uSoftness;
    varying vec2 vUv;

    void main() {
      float d = length(vUv - 0.5) * 2.0;
      float falloff = clamp(1.0 - d, 0.0, 1.0);

      float core = pow(falloff, uSoftness);
      float halo = pow(falloff, 1.6) * 0.35;

      float streak = pow(clamp(1.0 - abs(vUv.y - 0.5) * 12.0, 0.0, 1.0), 2.0)
                   * pow(clamp(1.0 - abs(vUv.x - 0.5) * 2.0, 0.0, 1.0), 1.5)
                   * uStreak;

      float a = core + halo + streak;
      gl_FragColor = vec4(uColor * a * uIntensity, 1.0);
    }
  `,
)

extend({ ContactFlareMaterial })

const Flare = forwardRef(function Flare(
  { position, size = 0.85, color = '#eaf2ff', intensity = 1.1, streak = 0.5, softness = 6 },
  ref,
) {
  const meshRef = useRef(null)
  const pos = useMemo(
    () => (position instanceof THREE.Vector3 ? position.toArray() : Array.from(position)),
    [position],
  )

  useFrame(({ camera }) => {
    if (meshRef.current) meshRef.current.quaternion.copy(camera.quaternion)
  })

  return (
    <group position={pos}>
      <group ref={ref} scale={0}>
        <mesh ref={meshRef} frustumCulled={false} renderOrder={6}>
          <planeGeometry args={[size, size]} />
          <contactFlareMaterial
            uColor={color}
            uIntensity={intensity}
            uStreak={streak}
            uSoftness={softness}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
})

export default Flare
