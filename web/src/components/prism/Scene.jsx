import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
import VolumetricBeam from './VolumetricBeam'
import DispersionRibbon from './DispersionRibbon'
import ContactFlare from './ContactFlare'
import {
  ChromaticAberrationPass,
  FilmGrainPass,
} from './effects/ShaderPasses'
import { tracePrismDispersion } from './physics/raytracer'
import {
  computeEntryBeamFromMesh,
  logHeroBeamDiagnostics,
  ENTRY_ANGLE_DEG,
} from './optics/entryBeam'
import {
  applyHeroFinalState,
  attachHeroScrollTrigger,
  createHeroTimeline,
} from './animation/timeline'
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion'
import { markPrismSceneReady } from '../../lib/prismReady'
import { TETRA_REST_EULER } from './constants/prism'
import {
  PAUSE_LIGHT_AND_SCROLL,
  PRISM_SECTION_BG,
} from './debugFlags'

/**
 * Prefer MeshTransmissionMaterial tetrahedron. When false, use physical Prism.
 */
const ENABLE_HERO_REFRACTION = true

/**
 * Entry: face 2 → face 0 at mid-height, near-horizontal (see entryBeam.js).
 */
const Z_AXIS = new THREE.Vector3(0, 0, 1)
/**
 * Extra yaw around the vertex-forward rest pose (TETRA_REST_EULER).
 * 0 keeps apex-up / centered seam / visible base; OrbitControls still free-look.
 */
const PRISM_YAW_DEG = 0
const PRISM_YAW_RAD = THREE.MathUtils.degToRad(PRISM_YAW_DEG)
const PRISM_ROTATION = [
  TETRA_REST_EULER[0],
  TETRA_REST_EULER[1] + PRISM_YAW_RAD,
  TETRA_REST_EULER[2],
]

/**
 * Small lift (° about world Z) on the traced mean exit — keep the fan roughly
 * horizontal (screen-left → screen-right) rather than sweeping steeply up.
 */
const RIBBON_LIFT_DEG = 12

/** Wide continuous fan — soft blend across width, not thin separated streaks. */
const RIBBON_LENGTH = 16
const RIBBON_WIDTH = 14
const RIBBON_START_WIDTH_RATIO = 0.16
const RIBBON_WIDEN_POWER = 0.62
const RIBBON_INTENSITY = 0.55

/** Entry beam — thin and understated, per the reference. */
const ENTRY_BEAM_RADIUS = 0.028
const ENTRY_BEAM_OPACITY = 0.5
const ENTRY_CORE_OPACITY = 0.85

/** In-glass segment (entryHit → mean exitHit) — dimmer/thinner than entry. */
const INTERNAL_BEAM_RADIUS = 0.016
const INTERNAL_BEAM_OPACITY = 0.28
const INTERNAL_CORE_OPACITY = 0.45

/** DEBUG: set true to hold beams at full scale (bypasses the scroll scrub). */
const DEBUG_BYPASS_GSAP =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('full')

const SCENE_CLEAR =
  PRISM_SECTION_BG != null ? PRISM_SECTION_BG : '#000000'

/**
 * Collapse the traced per-wavelength exits into the single ribbon the
 * reference shows: one origin at the mean exit point, direction = mean exit
 * vector with the creative lift applied instantly at the surface.
 */
function buildRibbon(bands) {
  if (!bands?.length) return null

  const start = bands
    .reduce((acc, band) => acc.add(band.exitPoint.clone()), new THREE.Vector3())
    .multiplyScalar(1 / bands.length)

  const direction = bands
    .reduce(
      (acc, band) => acc.add(band.exitDirection.clone()),
      new THREE.Vector3(),
    )
    .normalize()
    .applyAxisAngle(Z_AXIS, THREE.MathUtils.degToRad(RIBBON_LIFT_DEG))
    .normalize()

  return { start, direction }
}

/**
 * Signal the homepage preloader once the live scene has rendered a few frames
 * and WebGL has compiled MeshTransmissionMaterial (+ optional beam shaders).
 *
 * Armed as soon as Scene mounts — must NOT depend on beam/ribbon traces, or a
 * failed/paused light path would block the preloader forever.
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
  const prismRef = useRef(null)
  const entryBeamRef = useRef(null)
  const internalBeamRef = useRef(null)
  const ribbonRef = useRef(null)
  const entryFlareRef = useRef(null)
  const exitFlareRef = useRef(null)
  const [trace, setTrace] = useState(null)
  const [beam, setBeam] = useState(null)
  const reducedMotion = usePrefersReducedMotion()

  const cameraRefCallback = useMemo(
    () => (cam) => {
      if (cam) cam.lookAt(0, 0, 0)
    },
    [],
  )

  useLayoutEffect(() => {
    if (PAUSE_LIGHT_AND_SCROLL) return

    const mesh = prismRef.current
    if (!mesh) return

    // Aim from live matrixWorld so scale/yaw stay in sync with the glass mesh.
    const setup = computeEntryBeamFromMesh(mesh, { angleDeg: ENTRY_ANGLE_DEG })
    const nextTrace = tracePrismDispersion(mesh, setup.origin, setup.direction)
    const nextRibbon = buildRibbon(nextTrace?.bands)
    const entryLength =
      nextTrace?.entryPoint != null
        ? setup.origin.distanceTo(nextTrace.entryPoint)
        : 0

    logHeroBeamDiagnostics(mesh, setup, nextTrace, nextRibbon, {
      entryBeam: {
        start: setup.origin,
        direction: setup.direction,
        length: entryLength,
      },
      ribbonLiftDeg: RIBBON_LIFT_DEG,
    })

    setBeam(setup)
    setTrace(nextTrace)
  }, [])

  const entryLength = useMemo(() => {
    if (!trace?.entryPoint || !beam) return 0
    return beam.origin.distanceTo(trace.entryPoint)
  }, [trace, beam])

  const ribbon = useMemo(() => buildRibbon(trace?.bands), [trace])

  /** Averaged white in-glass shaft: exact raytracer entryHit → mean exitHit. */
  const internalBeam = useMemo(() => {
    if (!trace?.entryPoint || !ribbon?.start) return null
    const start = trace.entryPoint.clone()
    const end = ribbon.start.clone()
    const direction = end.clone().sub(start)
    const length = direction.length()
    if (length < 1e-4) return null
    direction.multiplyScalar(1 / length)
    return { start, direction, length }
  }, [trace, ribbon])

  useEffect(() => {
    if (PAUSE_LIGHT_AND_SCROLL) return
    if (!trace?.entryPoint || !ribbon || !internalBeam) return

    const entry = entryBeamRef.current
    const internal = internalBeamRef.current
    const ribbonNode = ribbonRef.current
    const entryFlare = entryFlareRef.current
    const exitFlare = exitFlareRef.current

    if (!entry || !internal || !ribbonNode || !entryFlare || !exitFlare) return

    const targets = {
      entry,
      internal,
      ribbon: ribbonNode,
      entryFlare,
      exitFlare,
    }

    // Reduced motion / debug: skip pin+scrub, show the finished hero.
    if (reducedMotion || DEBUG_BYPASS_GSAP) {
      applyHeroFinalState(targets)
      return
    }

    const tl = createHeroTimeline(targets)
    const st = attachHeroScrollTrigger(tl)

    return () => {
      st.kill()
      tl.kill()
    }
  }, [trace, ribbon, internalBeam, reducedMotion])

  const showLights = !PAUSE_LIGHT_AND_SCROLL

  return (
    <>
      <PrismReadyReporter armed />
      <color attach="background" args={[SCENE_CLEAR]} />
      {PRISM_SECTION_BG == null ? <GradientBackdrop /> : null}
      {/* Prism mesh centroid at world origin → true viewport center */}
      <PerspectiveCamera
        makeDefault
        position={[2.6, 1.1, 6.2]}
        fov={46}
        ref={cameraRefCallback}
      />

      {/*
        Rim-lit from behind/above so the prism's facet edges read as bright
        lines against the black backdrop — the body stays dark, the edges glow.
      */}
      <ambientLight intensity={0.1} />
      <directionalLight position={[-4, 3, -5]} intensity={0.9} color="#cfe2ff" />
      <directionalLight position={[5, 2, -4]} intensity={0.6} color="#ffd9c2" />

      {/*
        Procedural env rig instead of a preset HDRI: the preset fetches from a
        CDN and silently yields no env map here, which renders a transmissive
        prism pure black. These lightformers are what the glass actually
        reflects, so they double as the prism's edge highlights.
      */}
      <Environment resolution={256}>
        <color attach="background" args={['#000000']} />
        {/*
          Key rim from behind-left. Its angle is load-bearing: swing it further
          left and the flat entry face mirrors it straight down the lens and
          blows out; pull it overhead and the prism goes black. This position
          lights the facet edges while leaving the faces dark.
        */}
        <Lightformer
          intensity={1.6}
          color="#dcebff"
          position={[-5, 3, -6]}
          scale={[7, 7, 1]}
        />
        {/* Grazing light picking out a second facet so the solid reads with depth */}
        <Lightformer
          intensity={0.9}
          color="#b9d4ff"
          position={[-2.5, 0.5, 3.5]}
          scale={[3, 3, 1]}
        />
        {/* Warm counter-rim so the lower-right facets pick up amber */}
        <Lightformer
          intensity={1.1}
          color="#ffc79a"
          position={[6, -1, -3]}
          scale={[6, 6, 1]}
        />
        {/* Cool fill from camera side keeps the body from going fully black */}
        <Lightformer
          intensity={0.45}
          color="#5566aa"
          position={[3, 2, 6]}
          scale={[10, 10, 1]}
        />
        {/* Narrow strip lights read as crisp specular lines along the edges */}
        <Lightformer
          intensity={3}
          color="#ffffff"
          position={[0, 5, -2]}
          scale={[8, 0.25, 1]}
        />
        <Lightformer
          intensity={2.2}
          color="#9fe8ff"
          position={[-2, -4, 1]}
          scale={[6, 0.2, 1]}
        />
        {/* Spectral glints — the coloured sparks along the ref's facet edges */}
        <Lightformer
          intensity={2.6}
          color="#ff5ec4"
          position={[2.5, -2, 2]}
          scale={[3, 0.18, 1]}
        />
        <Lightformer
          intensity={2.4}
          color="#3fd8ff"
          position={[-3, 1.5, 2.5]}
          scale={[3, 0.18, 1]}
        />
        <Lightformer
          intensity={2}
          color="#ffa24d"
          position={[1.5, -3.2, -1]}
          scale={[2.5, 0.16, 1]}
        />
      </Environment>
      <OrbitControls target={[0, 0, 0]} enableZoom={false} enablePan={false} />

      {/* Prism mesh centroid at world origin → true viewport center */}
      <group position={[0, 0, 0]}>
        {enableHeroRefraction ? (
          <TransmissionPrism ref={prismRef} rotation={PRISM_ROTATION} />
        ) : (
          <Prism ref={prismRef} rotation={PRISM_ROTATION} />
        )}
      </group>

      {showLights && trace?.entryPoint && beam && (
        <>
          <VolumetricBeam
            ref={entryBeamRef}
            start={beam.origin}
            direction={beam.direction}
            length={entryLength}
            radius={ENTRY_BEAM_RADIUS}
            color="#eef4ff"
            opacity={ENTRY_BEAM_OPACITY}
            coreOpacity={ENTRY_CORE_OPACITY}
          />
          <ContactFlare
            ref={entryFlareRef}
            position={trace.entryPoint}
            size={0.45}
            intensity={0.75}
          />
        </>
      )}

      {showLights && internalBeam && (
        <VolumetricBeam
          ref={internalBeamRef}
          start={internalBeam.start}
          direction={internalBeam.direction}
          length={internalBeam.length}
          radius={INTERNAL_BEAM_RADIUS}
          color="#f2f6ff"
          opacity={INTERNAL_BEAM_OPACITY}
          coreOpacity={INTERNAL_CORE_OPACITY}
          depthTest={false}
          renderOrder={3}
        />
      )}

      {showLights && ribbon && (
        <>
          {/* Hot spot where the ribbon leaves the glass — ties the two together */}
          <ContactFlare
            ref={exitFlareRef}
            position={ribbon.start}
            size={1.5}
            color="#fff0e2"
            intensity={0.42}
            streak={0}
            softness={2.4}
          />
          <DispersionRibbon
            ref={ribbonRef}
            start={ribbon.start}
            direction={ribbon.direction}
            length={RIBBON_LENGTH}
            width={RIBBON_WIDTH}
            startWidthRatio={RIBBON_START_WIDTH_RATIO}
            widenPower={RIBBON_WIDEN_POWER}
            intensity={RIBBON_INTENSITY}
            noiseSeed={2.4}
          />
        </>
      )}

      {showLights ? (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.08}
            luminanceSmoothing={0.9}
            intensity={2.4}
            mipmapBlur
            radius={0.85}
          />
          <ChromaticAberrationPass offsetPx={1.2} />
          <Vignette eskil={false} offset={0.28} darkness={0.85} />
          <FilmGrainPass opacity={0.02} />
        </EffectComposer>
      ) : null}
    </>
  )
}
