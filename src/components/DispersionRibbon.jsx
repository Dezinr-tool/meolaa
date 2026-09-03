import { forwardRef, useMemo, useRef } from 'react'
import { shaderMaterial } from '@react-three/drei'
import { extend, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Curated indigo→red gradient the turbulence melts together. */
const RIBBON_STOPS = [
  '#101d6b',
  '#1e5fd0',
  '#22c8f0',
  '#bfe9ff',
  '#fff3e6',
  '#ff6fd8',
  '#ff7a2f',
  '#c8180c',
]
const SEGMENTS_Y = 96
const SEGMENTS_X = 48

const DispersionRibbonMaterial = shaderMaterial(
  {
    uStops: RIBBON_STOPS.map((hex) => new THREE.Color(hex)),
    uIntensity: 1,
    uTime: 0,
    uNoiseSeed: 0,
    uStartWidth: 0.16,
    uEndWidth: 1,
    uWidenPower: 0.72,
    uHueShift: 0,
    uSaturation: 1,
  },
  /* glsl */ `
    uniform float uStartWidth;
    uniform float uEndWidth;
    uniform float uWidenPower;

    varying vec2 vUv;

    void main() {
      vUv = uv;

      float t = pow(clamp(uv.y, 0.0, 1.0), uWidenPower);
      float w = mix(uStartWidth, uEndWidth, t);

      vec3 p = position;
      p.x *= w;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  /* glsl */ `
    uniform vec3 uStops[${RIBBON_STOPS.length}];
    uniform float uIntensity;
    uniform float uTime;
    uniform float uNoiseSeed;
    uniform float uHueShift;
    uniform float uSaturation;

    varying vec2 vUv;

    vec3 hueShiftSat(vec3 c, float hueDeg, float sat) {
      const vec3 k = vec3(0.57735);
      float a = radians(hueDeg);
      vec3 rot = c * cos(a) + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - cos(a));
      float l = dot(rot, vec3(0.299, 0.587, 0.114));
      return mix(vec3(l), rot, sat);
    }

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + uNoiseSeed) * 43758.5453123);
    }

    float valueNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * valueNoise(p);
        p = p * 2.07 + 13.0;
        a *= 0.5;
      }
      return v;
    }

    vec3 spectrum(float t) {
      float scaled = clamp(t, 0.0, 1.0) * float(${RIBBON_STOPS.length} - 1);
      float idx = floor(scaled);
      float f = smoothstep(0.0, 1.0, scaled - idx);
      int i = int(idx);

      vec3 c = uStops[${RIBBON_STOPS.length} - 1];
      for (int s = 0; s < ${RIBBON_STOPS.length} - 1; s++) {
        if (s == i) {
          c = mix(uStops[s], uStops[s + 1], f);
        }
      }
      return c;
    }

    void main() {
      float along = clamp(vUv.y, 0.0, 1.0);

      float n1 = fbm(vec2(along * 2.6 + uTime * 0.05, vUv.x * 1.7));
      float n2 = fbm(vec2(along * 5.3 - uTime * 0.03, vUv.x * 3.4 + 7.0));
      float warp = (n1 - 0.5) * 0.30 + (n2 - 0.5) * 0.14;

      float band = clamp(vUv.x + warp * 0.42, 0.0, 1.0);
      vec3 col = spectrum(band);

      float edge = abs(vUv.x - 0.5) * 2.0;
      float widthFade = pow(smoothstep(1.0, 0.42, edge), 0.7);

      float ramp = smoothstep(0.0, 0.04, along);
      float tail = smoothstep(1.0, 0.82, along);
      float lengthFade = ramp * tail;

      float density = fbm(vec2(along * 3.4 + uTime * 0.04, vUv.x * 2.9 + 3.7));
      float mottle = mix(0.55, 1.25, density);

      float hotspot = fbm(vec2(along * 1.9 - uTime * 0.02, vUv.x * 1.3 + 21.0));
      hotspot = smoothstep(0.62, 0.95, hotspot);

      float core = pow(clamp(1.0 - edge * 1.35, 0.0, 1.0), 2.2);

      float mask = widthFade * lengthFade * mottle;
      vec3 rgb = col * mask;

      rgb += vec3(1.0, 0.94, 0.88) * core * lengthFade * 0.55;
      rgb += col * hotspot * lengthFade * widthFade * 0.7;

      rgb = hueShiftSat(rgb, uHueShift, uSaturation);

      gl_FragColor = vec4(rgb * uIntensity, 1.0);
    }
  `,
)

extend({ DispersionRibbonMaterial })

function toVector3(value) {
  if (value instanceof THREE.Vector3) return value
  return new THREE.Vector3().fromArray(value)
}

const Y_AXIS = new THREE.Vector3(0, 1, 0)

const DispersionRibbon = forwardRef(function DispersionRibbon(
  {
    start,
    direction,
    length,
    width = 9,
    startWidthRatio = 0.13,
    intensity = 1,
    widenPower = 0.72,
    noiseSeed = 0,
    hue = 0,
    saturation = 1,
  },
  ref,
) {
  const groupRef = useRef(null)
  const yawRef = useRef(null)
  const matRef = useRef(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, length, SEGMENTS_X, SEGMENTS_Y)
    geo.translate(0, length / 2, 0)
    return geo
  }, [length])

  const quaternion = useMemo(() => {
    const dir = toVector3(direction).clone().normalize()
    return new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir)
  }, [direction])

  const position = useMemo(() => toVector3(start).toArray(), [start])

  // Stable ref so re-renders never reset the GSAP-driven reveal scale.
  const initialScale = useMemo(() => [1, 0, 1], [])

  useFrame(({ camera }, delta) => {
    if (matRef.current) matRef.current.uTime += delta
    const g = groupRef.current
    const yaw = yawRef.current
    if (!g || !yaw) return
    g.updateMatrixWorld()
    const local = g.worldToLocal(camera.position.clone())
    yaw.rotation.y = Math.atan2(local.x, local.z)
  })

  if (length <= 0) return null

  return (
    <group ref={groupRef} position={position} quaternion={quaternion}>
      <group ref={yawRef}>
        <group ref={ref} scale={initialScale}>
          <mesh geometry={geometry} frustumCulled={false} renderOrder={4}>
            <dispersionRibbonMaterial
              ref={matRef}
              uIntensity={intensity}
              uNoiseSeed={noiseSeed}
              uStartWidth={width * startWidthRatio}
              uEndWidth={width}
              uWidenPower={widenPower}
              uHueShift={hue}
              uSaturation={saturation}
              transparent
              depthWrite={false}
              depthTest
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  )
})

export default DispersionRibbon
