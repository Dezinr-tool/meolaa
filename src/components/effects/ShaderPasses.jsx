import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useDispose } from '@react-three/postprocessing'
import { ShaderPass } from 'postprocessing'
import * as THREE from 'three'

const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

/**
 * Subtle radial chromatic aberration via postprocessing ShaderPass.
 * ~1–2px R/B split scaled by distance from screen center.
 */
export function ChromaticAberrationPass({ offsetPx = 1.5 } = {}) {
  const size = useThree((s) => s.size)

  const pass = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        inputBuffer: { value: null },
        resolution: { value: new THREE.Vector2(1, 1) },
        offsetPx: { value: offsetPx },
      },
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D inputBuffer;
        uniform vec2 resolution;
        uniform float offsetPx;
        varying vec2 vUv;

        void main() {
          vec2 fromCenter = vUv - 0.5;
          float dist = length(fromCenter);
          vec2 dir = dist > 1e-5 ? fromCenter / dist : vec2(0.0);
          // Radial strength: near-zero at center, full at corners
          vec2 px = (offsetPx / resolution) * dir * dist * 2.0;

          float r = texture2D(inputBuffer, vUv + px).r;
          float g = texture2D(inputBuffer, vUv).g;
          float b = texture2D(inputBuffer, vUv - px).b;
          float a = texture2D(inputBuffer, vUv).a;

          gl_FragColor = vec4(r, g, b, a);
        }
      `,
      depthTest: false,
      depthWrite: false,
    })

    const shaderPass = new ShaderPass(material, 'inputBuffer')
    const prevSetSize = shaderPass.setSize.bind(shaderPass)
    shaderPass.setSize = (width, height) => {
      material.uniforms.resolution.value.set(width, height)
      prevSetSize(width, height)
    }
    return shaderPass
  }, [offsetPx])

  useDispose(pass)

  // Keep resolution in sync if composer setSize hasn't fired yet
  useFrame(() => {
    pass.fullscreenMaterial.uniforms.resolution.value.set(size.width, size.height)
  })

  return <primitive object={pass} />
}

/**
 * Fine animated film grain via postprocessing ShaderPass.
 */
export function FilmGrainPass({ opacity = 0.04 } = {}) {
  const materialRef = useRef(null)

  const pass = useMemo(() => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        inputBuffer: { value: null },
        uTime: { value: 0 },
        uOpacity: { value: opacity },
      },
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: /* glsl */ `
        uniform sampler2D inputBuffer;
        uniform float uTime;
        uniform float uOpacity;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec4 color = texture2D(inputBuffer, vUv);
          float n = hash(vUv * vec2(1920.0, 1080.0) + uTime * 60.0);
          n = (n - 0.5) * 2.0;
          color.rgb += n * uOpacity;
          gl_FragColor = color;
        }
      `,
      depthTest: false,
      depthWrite: false,
    })

    materialRef.current = material
    return new ShaderPass(material, 'inputBuffer')
  }, [opacity])

  useDispose(pass)

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
  })

  return <primitive object={pass} />
}
