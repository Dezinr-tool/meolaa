import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Environment, Lightformer, PerspectiveCamera } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import Prism from './Prism'
import HeroLogo from './HeroLogo'
import VolumetricBeam from './VolumetricBeam'
import Flare from './Flare'
import DispersionRibbon from './DispersionRibbon'
import { ChromaticAberrationPass, FilmGrainPass } from './effects/ShaderPasses'
import { tracePrismDispersion } from '../physics/raytracer'
import { computeFan, makeBasePose, setupHeroBeam } from '../physics/beamSetup'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { useSettings } from '../settings/settingsStore'
import { REMOUNT_KEYS } from '../settings/schema'

gsap.registerPlugin(ScrollTrigger)

const DRAG_YAW_SPEED = 0.007

/** Camera is fixed here (see <PerspectiveCamera> below). */
const CAMERA_POSITION = [2.6, 1.1, 6.2]

/** Radial vignette sphere the prism sits inside — centre glow → base colour. */
function Backdrop({ center = '#060608', edge = '#000000' }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uCenter: { value: new THREE.Color(center) },
          uEdge: { value: new THREE.Color(edge) },
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

  useLayoutEffect(() => {
    material.uniforms.uCenter.value.set(center)
    material.uniforms.uEdge.value.set(edge)
  }, [material, center, edge])

  return (
    <mesh scale={80} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 24]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

/** GSAP master timeline: entry beam → dispersion ribbon → logo reveal. */
function buildHeroTimeline({
  entry,
  internal,
  ribbon,
  entryFlare,
  exitFlare,
  heroLogo,
  heroLogoMaterial,
}) {
  const tl = gsap.timeline({ paused: true })

  tl.set(entry.scale, { y: 0 })
  if (internal) tl.set(internal.scale, { y: 0 }, 0)
  tl.set(ribbon.scale, { y: 0 }, 0)
  tl.set(entryFlare.scale, { x: 0, y: 0, z: 0 }, 0)
  tl.set(exitFlare.scale, { x: 0, y: 0, z: 0 }, 0)
  if (heroLogo) tl.set(heroLogo.position, { x: -5, y: 0 }, 0)
  if (heroLogoMaterial) tl.set(heroLogoMaterial, { opacity: 0 }, 0)

  tl.addLabel('entryStart', 0)
  tl.to(entry.scale, { y: 1, duration: 0.45, ease: 'power2.out' }, 'entryStart')
  tl.to(
    entryFlare.scale,
    { x: 1, y: 1, z: 1, duration: 0.12, ease: 'back.out(2)' },
    'entryStart+=0.33',
  )

  tl.addLabel('dispersionStart', 0.45)
  if (internal) {
    tl.to(internal.scale, { y: 1, duration: 0.12, ease: 'power2.out' }, 'dispersionStart')
  }
  tl.to(ribbon.scale, { y: 1, duration: 0.3, ease: 'power3.out' }, 'dispersionStart+=0.06')
  tl.to(
    exitFlare.scale,
    { x: 1, y: 1, z: 1, duration: 0.18, ease: 'power2.out' },
    'dispersionStart+=0.08',
  )

  tl.addLabel('logoReveal', 0.75)
  if (heroLogo) {
    tl.to(heroLogo.position, { x: 0, duration: 0.15, ease: 'power2.out' }, 'logoReveal')
  }
  if (heroLogoMaterial) {
    tl.to(heroLogoMaterial, { opacity: 1, duration: 0.045, ease: 'power2.out' }, 'logoReveal')
  }

  // Reveal itself finishes at label time 0.9; this dummy tween stretches the
  // timeline well past that so a real, visible pause holds the completed
  // frame before the pin releases — "animation should fully finish, with a
  // beat of delay, before the next fold arrives". Reveal now lands at
  // 0.9/2.1 ≈ 43% into the pinned scroll, hold fills the remaining 57% — a
  // longer pause than before scrolling is allowed to carry through to the
  // next fold. HomeAnimations.tsx's REVEAL_COMPLETE_FRACTION mirrors this
  // 0.9/2.1 ratio (it hides the nav once the reveal's done, not only once
  // the whole pin releases) — keep the two in sync if this changes.
  tl.addLabel('hold', 0.9)
  tl.to({}, { duration: 1.2 }, 'hold')

  return tl
}

/** Reduced-motion: jump straight to the finished frame. */
function snapHeroToEnd({ entry, internal, ribbon, entryFlare, exitFlare, heroLogo, heroLogoMaterial }) {
  if (entry) entry.scale.y = 1
  if (internal) internal.scale.y = 1
  if (ribbon) ribbon.scale.y = 1
  if (entryFlare) entryFlare.scale.setScalar(1)
  if (exitFlare) exitFlare.scale.setScalar(1)
  if (heroLogo) {
    heroLogo.position.x = 0
    heroLogo.position.y = 0
  }
  if (heroLogoMaterial) heroLogoMaterial.opacity = 1
}

export default function Scene() {
  const { settings } = useSettings()
  const {
    scale,
    yawDeg,
    pitchDeg,
    posY,
    baseHalf,
    height,
    entryAngleDeg,
    liftDeg,
    textX,
    textY,
    textZ,
    textScale,
  } = settings

  const gl = useThree((s) => s.gl)
  const viewW = useThree((s) => s.size.width)

  /* Phone/tablet: shrink prism + bg logo (beams follow via raytrace on the
     scaled mesh) so the composition fits the narrower hero fold. */
  const mobileFit = useMemo(() => {
    if (viewW <= 480) return 0.5
    if (viewW <= 700) return 0.58
    if (viewW <= 900) return 0.7
    return 1
  }, [viewW])
  const fitScale = scale * mobileFit
  const fitTextScale = textScale * mobileFit
  const fitPosY = posY * mobileFit + (viewW <= 900 ? 0.35 : 0)

  const prismRef = useRef(null)
  const entryBeamRef = useRef(null)
  const internalBeamRef = useRef(null)
  const ribbonRef = useRef(null)
  const entryFlareRef = useRef(null)
  const exitFlareRef = useRef(null)
  const heroLogoRef = useRef(null)

  const [heroLogoReady, setHeroLogoReady] = useState(false)
  const [trace, setTrace] = useState(null)
  const [beam, setBeam] = useState(null)
  // Manual prism spin from cursor drag — 360° around the vertical axis only.
  const [dragYaw, setDragYaw] = useState(0)

  const reducedMotion = usePrefersReducedMotion()

  const cameraLookAt = useMemo(() => (cam) => cam?.lookAt(0, 0, 0), [])

  // Position the logo dead-centre on the camera's view axis at depth `textZ`,
  // then apply the X/Y sliders as nudges from that centred spot.
  const logoPosition = useMemo(() => {
    const [cx, cy, cz] = CAMERA_POSITION
    const k = textZ / cz
    return [cx * k + textX, cy * k + textY, textZ]
  }, [textX, textY, textZ])

  const attachHeroLogo = useCallback((node) => {
    heroLogoRef.current = node
    setHeroLogoReady(!!node)
  }, [])

  const prismRotation = useMemo(
    () => [
      THREE.MathUtils.degToRad(pitchDeg),
      THREE.MathUtils.degToRad(yawDeg) + dragYaw,
      0,
    ],
    [pitchDeg, yawDeg, dragYaw],
  )

  // Drag left/right anywhere on the canvas to spin the prism 360° in place
  // (vertical drag is ignored; the camera never moves).
  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lastX = 0

    const onDown = (e) => {
      if (e.button !== 0) return
      dragging = true
      lastX = e.clientX
      el.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      setDragYaw((y) => y + dx * DRAG_YAW_SPEED)
    }
    const onUp = (e) => {
      dragging = false
      el.releasePointerCapture?.(e.pointerId)
    }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [gl])

  // Prism remounts (geometry / transmission FBO rebuild) when these change.
  const prismKey = REMOUNT_KEYS.map((k) => settings[k]).join('|')

  // Re-trace the dispersion whenever the prism's pose changes (settings or drag),
  // so the beam + ribbon keep following it.
  useLayoutEffect(() => {
    const mesh = prismRef.current
    if (!mesh) return

    // Anchor the incoming beam to the prism's *base* pose only — a live drag
    // rotation must not swing the beam, only bend the refraction.
    const basePose = makeBasePose(
      [0, fitPosY, 0],
      new THREE.Euler(THREE.MathUtils.degToRad(pitchDeg), THREE.MathUtils.degToRad(yawDeg), 0),
      fitScale,
    )
    const setup = setupHeroBeam(mesh, { angleDeg: entryAngleDeg, basePose })
    const result = tracePrismDispersion(mesh, setup.origin, setup.direction)
    // Keep the last good result: while spinning, some angles let no light in —
    // freeze the dispersion there rather than letting anything disappear.
    if (result.entryPoint && result.bands.length > 0) {
      setBeam(setup)
      setTrace(result)
    }
  }, [
    prismKey,
    fitScale,
    yawDeg,
    pitchDeg,
    fitPosY,
    baseHalf,
    height,
    entryAngleDeg,
    dragYaw,
  ])

  const entryLength = useMemo(() => {
    if (!trace?.entryPoint || !beam) return 0
    return beam.origin.distanceTo(trace.entryPoint)
  }, [trace, beam])

  const fan = useMemo(() => computeFan(trace?.bands, liftDeg), [trace, liftDeg])

  const internalBeam = useMemo(() => {
    if (!trace?.entryPoint || !fan?.start) return null
    const start = trace.entryPoint.clone()
    const toFan = fan.start.clone().sub(start)
    const length = toFan.length()
    if (length < 1e-4) return null
    return { start, direction: toFan.multiplyScalar(1 / length), length }
  }, [trace, fan])

  // Latches true on the first good trace and never drops — keep-last-good above
  // means the beam elements stay mounted even while the prism spins through
  // angles that admit no light, so this single pinned timeline is built once
  // and never torn down (spinning can't unpin the scene / drop content).
  const readyRef = useRef(false)
  if (trace?.entryPoint && fan && internalBeam) readyRef.current = true
  const animReady = readyRef.current

  useEffect(() => {
    if (!animReady) return

    const entry = entryBeamRef.current
    const internal = internalBeamRef.current
    const ribbon = ribbonRef.current
    const entryFlare = entryFlareRef.current
    const exitFlare = exitFlareRef.current
    const heroLogo = heroLogoRef.current
    const heroLogoMaterial = heroLogo?.userData?.material ?? null

    if (!entry || !internal || !ribbon || !entryFlare || !exitFlare || !heroLogo) return

    const targets = {
      entry,
      internal,
      ribbon,
      entryFlare,
      exitFlare,
      heroLogo,
      heroLogoMaterial,
    }

    if (reducedMotion) {
      snapHeroToEnd(targets)
      return
    }

    const tl = buildHeroTimeline(targets)
    // Ported from a standalone hero (pin:true, end:'+=200%'). Pinning the
    // Canvas's own absolutely-positioned wrapper wouldn't add real scroll
    // distance (it doesn't contribute to document flow), so this pins the
    // real hero <section> instead — a normal-flow block, so the pin-spacer
    // it gets actually reserves extra scroll. Without a pin at all, the
    // reveal's completion and the hero scrolling out of view happened at
    // the same instant (the fold's own height was the entire scrub range),
    // so the finished frame was never actually seen before the next fold
    // arrived — the pin holds it in view instead, with buildHeroTimeline's
    // 'hold' tween supplying the pause before release.
    const st = ScrollTrigger.create({
      animation: tl,
      trigger: '[data-section="hero"]',
      start: 'top top',
      end: '+=70%',
      pin: true,
      anticipatePin: 1,
      scrub: 1,
    })

    return () => {
      st.kill()
      tl.kill()
    }
  }, [animReady, reducedMotion, heroLogoReady])

  return (
    <>
      <color attach="background" args={[settings.bgColor]} />
      <Backdrop center={settings.bgGlow} edge={settings.bgColor} />

      <PerspectiveCamera
        makeDefault
        position={[2.6, 1.1, 6.2]}
        fov={46}
        ref={cameraLookAt}
      />

      <ambientLight intensity={0.1} />
      <directionalLight position={[-4, 3, -5]} intensity={0.9} color="#cfe2ff" />
      <directionalLight position={[5, 2, -4]} intensity={0.6} color="#ffd9c2" />

      <Environment resolution={256}>
        <color attach="background" args={['#000000']} />
        <Lightformer intensity={1.6} color="#dcebff" position={[-5, 3, -6]} scale={[7, 7, 1]} />
        <Lightformer intensity={0.9} color="#b9d4ff" position={[-2.5, 0.5, 3.5]} scale={[3, 3, 1]} />
        <Lightformer intensity={1.1} color="#ffc79a" position={[6, -1, -3]} scale={[6, 6, 1]} />
        <Lightformer intensity={0.45} color="#5566aa" position={[3, 2, 6]} scale={[10, 10, 1]} />
        <Lightformer intensity={3} color="#ffffff" position={[0, 5, -2]} scale={[8, 0.25, 1]} />
        <Lightformer intensity={2.2} color="#9fe8ff" position={[-2, -4, 1]} scale={[6, 0.2, 1]} />
        <Lightformer intensity={2.6} color="#ff5ec4" position={[2.5, -2, 2]} scale={[3, 0.18, 1]} />
        <Lightformer intensity={2.4} color="#3fd8ff" position={[-3, 1.5, 2.5]} scale={[3, 0.18, 1]} />
        <Lightformer intensity={2} color="#ffa24d" position={[1.5, -3.2, -1]} scale={[2.5, 0.16, 1]} />
      </Environment>

      <group position={[0, 0, 0]}>
        <group position={logoPosition}>
          <HeroLogo ref={attachHeroLogo} scale={fitTextScale} bg={settings.bgColor} />
        </group>
        <Prism
          key={prismKey}
          ref={prismRef}
          position={[0, fitPosY, 0]}
          rotation={prismRotation}
          scale={fitScale}
          baseHalf={baseHalf}
          height={height}
          roughness={settings.roughness}
          transmission={settings.transmission}
          thickness={settings.thickness}
          ior={settings.ior}
          chromaticAberration={settings.chromaticAberration}
          anisotropicBlur={settings.anisotropicBlur}
          distortion={settings.distortion}
          distortionScale={settings.distortionScale}
          temporalDistortion={settings.temporalDistortion}
          samples={settings.samples}
          resolution={settings.resolution}
        />
      </group>

      {trace?.entryPoint && beam && (
        <>
          <VolumetricBeam
            ref={entryBeamRef}
            start={beam.origin}
            direction={beam.direction}
            length={entryLength}
            radius={settings.beamThickness * mobileFit}
            color={settings.beamColor}
            opacity={settings.beamOpacity}
            coreOpacity={settings.beamCoreOpacity}
            softness={settings.beamSoftness}
          />
          <Flare
            ref={entryFlareRef}
            position={trace.entryPoint}
            size={0.45 * mobileFit}
            color={settings.entryFlareColor}
            intensity={settings.entryFlareIntensity}
          />
        </>
      )}

      {internalBeam && (
        <VolumetricBeam
          ref={internalBeamRef}
          start={internalBeam.start}
          direction={internalBeam.direction}
          length={internalBeam.length}
          radius={0.016 * mobileFit}
          color={settings.internalBeamColor}
          opacity={settings.internalBeamOpacity}
          coreOpacity={0.45}
          softness={settings.beamSoftness}
          depthTest={false}
          renderOrder={3}
        />
      )}

      {fan && (
        <>
          <Flare
            ref={exitFlareRef}
            position={fan.start}
            size={1.5 * mobileFit}
            color={settings.exitFlareColor}
            intensity={settings.exitFlareIntensity}
            streak={0}
            softness={2.4}
          />
          <DispersionRibbon
            ref={ribbonRef}
            start={fan.start}
            direction={fan.direction}
            length={settings.ribbonLength * mobileFit}
            width={settings.ribbonWidth * mobileFit}
            startWidthRatio={0.045}
            widenPower={settings.ribbonWidenPower}
            intensity={settings.ribbonIntensity}
            hue={settings.ribbonHue}
            saturation={settings.ribbonSaturation}
            noiseSeed={2.4}
          />
        </>
      )}

      <EffectComposer>
        <Bloom
          luminanceThreshold={settings.luminanceThreshold}
          luminanceSmoothing={settings.luminanceSmoothing}
          intensity={settings.intensity}
          mipmapBlur
          radius={settings.radius}
        />
        <ChromaticAberrationPass offsetPx={settings.chromaticOffsetPx} />
        <Vignette eskil={false} offset={settings.vignetteOffset} darkness={settings.vignetteDarkness} />
        <FilmGrainPass opacity={settings.grainOpacity} />
      </EffectComposer>
    </>
  )
}
