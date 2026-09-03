import { forwardRef, useMemo, useRef } from 'react'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const CORE_RADIUS_FACTOR = 0.12
const BILLBOARD_COUNT = 3
const PLANE_Z_EPS = 0.0004

const BeamSoftMaterial = shaderMaterial(
  {
    uColor: new THREE.Color('#ffffff'),
    uTime: 0,
    uOpacity: 1,
    uFalloff: 1.75,
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
    uniform float uTime;
    uniform float uOpacity;
    uniform float uFalloff;

    varying vec2 vUv;

    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    float scrollNoise(float along, float time) {
      float i = floor(along * 24.0 - time * 1.5);
      float f = fract(along * 24.0 - time * 1.5);
      float a = hash(i);
      float b = hash(i + 1.0);
      return mix(a, b, smoothstep(0.0, 1.0, f));
    }

    void main() {
      float widthT = abs(vUv.x - 0.5) * 2.0;
      float widthFalloff = pow(smoothstep(1.0, 0.0, widthT), max(uFalloff, 0.01));

      float lengthFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
      float noise = scrollNoise(vUv.y, uTime);
      float noiseMod = mix(0.88, 1.12, noise);

      float alpha = widthFalloff * lengthFade * uOpacity * noiseMod;
      vec3 rgb = uColor * (0.65 + 0.35 * widthFalloff) * noiseMod;

      gl_FragColor = vec4(rgb, alpha);
    }
  `,
)

extend({ BeamSoftMaterial })

function toVector3(value) {
  if (value instanceof THREE.Vector3) return value
  return new THREE.Vector3().fromArray(value)
}

const Y_AXIS = new THREE.Vector3(0, 1, 0)

const VolumetricBeam = forwardRef(function VolumetricBeam(
  {
    start,
    direction,
    length,
    color,
    radius = 0.08,
    opacity = 0.45,
    coreOpacity = 0.5,
    softness = 1.75,
    depthTest = true,
    renderOrder = 0,
  },
  ref,
) {
  const softMatRefs = useRef([])

  const planeGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(radius * 2.4, length, 1, 1)
    geo.translate(0, length / 2, 0)
    return geo
  }, [length, radius])

  const coreGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1, 1, length, 8, 1, true)
    geo.translate(0, length / 2, 0)
    return geo
  }, [length])

  const quaternion = useMemo(() => {
    const dir = toVector3(direction).clone().normalize()
    return new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir)
  }, [direction])

  const position = useMemo(() => toVector3(start).toArray(), [start])

  const billboards = useMemo(
    () =>
      Array.from({ length: BILLBOARD_COUNT }, (_, i) => {
        const angle = (i * Math.PI) / 3
        const eps = PLANE_Z_EPS * (i + 1)
        return {
          key: i,
          rotation: [0, angle, 0],
          position: [Math.sin(angle) * eps, 0, Math.cos(angle) * eps],
          renderOrder: i,
          polygonOffsetFactor: -1 - i,
          polygonOffsetUnits: -1 - i,
        }
      }),
    [],
  )

  // Stable ref so re-renders never reset the GSAP-driven reveal scale.
  const initialScale = useMemo(() => [1, 0, 1], [])

  useFrame((_, delta) => {
    for (const mat of softMatRefs.current) {
      if (mat) mat.uTime += delta
    }
  })

  if (length <= 0) return null

  const coreRadius = radius * CORE_RADIUS_FACTOR

  return (
    <group position={position} quaternion={quaternion}>
      <group ref={ref} scale={initialScale}>
        {billboards.map((b, index) => (
          <mesh
            key={b.key}
            geometry={planeGeometry}
            position={b.position}
            rotation={b.rotation}
            renderOrder={renderOrder + b.renderOrder}
            frustumCulled={false}
          >
            <beamSoftMaterial
              ref={(mat) => {
                softMatRefs.current[index] = mat
              }}
              uColor={color}
              uOpacity={opacity}
              uFalloff={softness}
              transparent
              depthWrite={false}
              depthTest={depthTest}
              blending={THREE.NormalBlending}
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={b.polygonOffsetFactor}
              polygonOffsetUnits={b.polygonOffsetUnits}
            />
          </mesh>
        ))}

        <mesh
          geometry={coreGeometry}
          scale={[coreRadius, 1, coreRadius]}
          renderOrder={renderOrder + 10}
          frustumCulled={false}
        >
          <meshBasicMaterial
            color={color}
            transparent
            opacity={coreOpacity}
            depthWrite={false}
            depthTest={depthTest}
            blending={THREE.NormalBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
})

export default VolumetricBeam
