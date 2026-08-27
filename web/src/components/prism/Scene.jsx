import { useMemo, useRef } from 'react'
import {
  Environment,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
} from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Prism from './Prism'
import TransmissionPrism from './TransmissionPrism'
import HeroLogo from './HeroLogo'
import {
  ChromaticAberrationPass,
  FilmGrainPass,
} from './effects/ShaderPasses'
import { markPrismSceneReady } from '../../lib/prismReady'
import {
  PRISM_CAMERA_POSITION,
  PYRAMID_REST_EULER,
} from './constants/prism'
import { PRISM_SECTION_BG } from './debugFlags'

/**
 * Prefer MeshTransmissionMaterial pyramid. When false, use physical Prism.
 */
const ENABLE_HERO_REFRACTION = true

/**
 * Extra yaw around the pyramid rest pose (PYRAMID_REST_EULER).
 * 0 keeps apex-up / vertex-forward; OrbitControls still free-look.
 */
const PRISM_YAW_DEG = 0
const PRISM_YAW_RAD = THREE.MathUtils.degToRad(PRISM_YAW_DEG)
const PRISM_ROTATION = [
  PYRAMID_REST_EULER[0],
  PYRAMID_REST_EULER[1] + PRISM_YAW_RAD,
  PYRAMID_REST_EULER[2],
]

const SCENE_CLEAR =
  PRISM_SECTION_BG != null ? PRISM_SECTION_BG : '#000000'

/**
 * Signal the homepage preloader once the live scene has rendered a few frames
 * and WebGL has compiled MeshTransmissionMaterial.
 *
 * Armed as soon as Scene mounts — must NOT depend on optional traces, or a
 * failed path would block the preloader forever.
 */
function PrismReadyReporter({ armed = true }) {
  const { gl, scene, camera } = useThree()
  const framesRef = useRef(0)
  const doneRef = useRef(false)

  useFrame(() => {
    if (doneRef.current || !armed) return
    framesRef.current += 1
    // Transmission materials allocate FBOs on first draws — wait a few frames
    if (framesRef.current < 4) return

    doneRef.current = true
    try {
      gl.compile(scene, camera)
    } catch (err) {
      console.warn('[prism] gl.compile failed; marking ready anyway', err)
    }
    markPrismSceneReady(true)
  })

  return null
}

/** Large BackSide sphere — near-black centre → slightly cooler rim vignette. */
function GradientBackdrop() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uCenter: { value: new THREE.Color('#060608') },
          uEdge: { value: new THREE.Color('#000000') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uCenter;
          uniform vec3 uEdge;
          varying vec3 vDir;

          void main() {
            float radial = length(vDir.xz);
            float t = smoothstep(0.05, 0.9, radial * 0.8 + abs(vDir.y) * 0.5);
            gl_FragColor = vec4(mix(uCenter, uEdge, t), 1.0);
          }
        `,
      }),
    [],
  )

  return (
    <mesh scale={80} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default function Scene({ enableHeroRefraction = ENABLE_HERO_REFRACTION }) {
  const cameraRefCallback = useMemo(
    () => (cam) => {
      if (cam) cam.lookAt(0, 0, 0)
    },
    [],
  )

  return (
    <>
      <PrismReadyReporter armed />
      <color attach="background" args={[SCENE_CLEAR]} />
      {PRISM_SECTION_BG == null ? <GradientBackdrop /> : null}
      {/* Prism mesh centroid at world origin → true viewport center */}
      <PerspectiveCamera
        makeDefault
        position={PRISM_CAMERA_POSITION}
        fov={42}
        ref={cameraRefCallback}
      />

      {/*
        Brighter fill than the beam-era rim-only rig — glass body must read
        clear against black, not as a near-invisible silhouette with one glare.
      */}
      <ambientLight intensity={0.85} />
      <directionalLight position={[0, 4, 7]} intensity={0.7} color="#ffffff" />
      <directionalLight position={[-3, 2, 5]} intensity={0.35} color="#dce8ff" />

      <Environment resolution={256} environmentIntensity={2.0}>
        <color attach="background" args={['#000000']} />
        <Lightformer
          intensity={3.2}
          color="#ffffff"
          position={[0, 1.2, 9]}
          scale={[22, 16, 1]}
        />
        <Lightformer
          intensity={1.8}
          color="#eef3ff"
          position={[-5, 3, 5]}
          scale={[12, 10, 1]}
        />
        <Lightformer
          intensity={1.6}
          color="#fff0e4"
          position={[5, 2, 5]}
          scale={[12, 10, 1]}
        />
        <Lightformer
          intensity={1.0}
          color="#dce8ff"
          position={[-4, 5, -4]}
          scale={[10, 10, 1]}
        />
        <Lightformer
          intensity={0.8}
          color="#ffc9a8"
          position={[5, -3, -3]}
          scale={[8, 8, 1]}
        />
        <Lightformer
          intensity={0.45}
          color="#ff8ad4"
          position={[3, -2, 4]}
          scale={[4, 0.3, 1]}
        />
        <Lightformer
          intensity={0.4}
          color="#4ae0ff"
          position={[-3, 2, 4]}
          scale={[4, 0.3, 1]}
        />
      </Environment>
      <OrbitControls target={[0, 0, 0]} enableZoom={false} enablePan={false} />

      {/* Shared origin: pyramid centroid; wordmark behind the glass. */}
      <group position={[0, 0, 0]}>
        {enableHeroRefraction && <HeroLogo />}
        {enableHeroRefraction ? (
          <TransmissionPrism rotation={PRISM_ROTATION} />
        ) : (
          <Prism rotation={PRISM_ROTATION} />
        )}
      </group>

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.65}
          luminanceSmoothing={0.9}
          intensity={0.7}
          mipmapBlur
          radius={0.5}
        />
        <ChromaticAberrationPass offsetPx={0.6} />
        <Vignette eskil={false} offset={0.4} darkness={0.35} />
        <FilmGrainPass opacity={0.012} />
      </EffectComposer>
    </>
  )
}
