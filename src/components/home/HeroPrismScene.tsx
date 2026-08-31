import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
} from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import {
  getPrismSettings,
  subscribePrismSettings,
  type HeroPrismSettings,
} from './heroPrismSettings'

/**
 * Square-base pyramid — four equilateral triangular sides, apex up.
 * Hand-built BufferGeometry (no ExtrudeGeometry). Glass reads from HDRI + fringe.
 */

function usePrismSettings() {
  return useSyncExternalStore(subscribePrismSettings, getPrismSettings, getPrismSettings)
}

function quality() {
  if (typeof window === 'undefined') {
    return { samples: 14, resolution: 640, envRes: 128 }
  }
  const mobile = window.matchMedia('(max-width: 900px)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || mobile) {
    return { samples: 10, resolution: 512, envRes: 64 }
  }
  return { samples: 48, resolution: 1024, envRes: 256 }
}

/** Height that makes all four lateral faces equilateral for base side `s`. */
export function equilateralPyramidHeight(baseSide: number) {
  return baseSide / Math.SQRT2
}

function pyramidCorners(baseSide: number, height?: number) {
  const s = baseSide
  const h = height && height > 0 ? height : equilateralPyramidHeight(s)
  const yA = h * 0.55
  const yB = -h * 0.45
  const half = s / 2

  const A = new THREE.Vector3(0, yA, 0)
  /* Square base, axis-aligned — front edge (B0–B1) faces +Z. */
  const B0 = new THREE.Vector3(-half, yB, half) // front-left
  const B1 = new THREE.Vector3(half, yB, half) // front-right
  const B2 = new THREE.Vector3(half, yB, -half) // back-right
  const B3 = new THREE.Vector3(-half, yB, -half) // back-left

  return { s, h, yA, yB, half, A, B: [B0, B1, B2, B3] as const }
}

/**
 * Square-base pyramid with four equilateral side faces.
 * Apex → each base corner distance equals `baseSide`.
 */
function buildSquarePyramid(baseSide: number, height?: number) {
  const { A, B } = pyramidCorners(baseSide, height)
  const [B0, B1, B2, B3] = B

  const positions: number[] = []
  const push = (p: THREE.Vector3) => positions.push(p.x, p.y, p.z)
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    push(a)
    push(b)
    push(c)
  }

  /* Lateral faces — CCW from outside so normals point outward. */
  tri(A, B0, B1) // front (+Z)
  tri(A, B1, B2) // right (+X)
  tri(A, B2, B3) // back (−Z)
  tri(A, B3, B0) // left (−X)
  /*
   * No base cap. With backside off, the cap is a flat face with nothing behind
   * it to transmit, so it took the environment as a near-white specular slab
   * (measured 228,229,232 against 77,108,136 on the sides) and read as a solid
   * lid rather than glass. Leaving it open lets the eye through to the inner
   * surfaces of the far faces, which is the glass read. The base outline is
   * still drawn by the edge pass.
   */

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.computeVertexNormals()
  return geo
}

function buildPyramidEdges(baseSide: number, height?: number) {
  const { A, B } = pyramidCorners(baseSide, height)
  const segs: number[] = []
  const line = (a: THREE.Vector3, b: THREE.Vector3) =>
    segs.push(a.x, a.y, a.z, b.x, b.y, b.z)

  for (let i = 0; i < 4; i++) {
    line(A, B[i])
    line(B[i], B[(i + 1) % 4])
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3))
  return geo
}

function CameraRig({ settings }: { settings: HeroPrismSettings }) {
  const { camera } = useThree()
  useFrame(() => {
    camera.position.set(settings.camX, settings.camY, settings.camZ)
    if ('fov' in camera) {
      const persp = camera as THREE.PerspectiveCamera
      if (persp.fov !== settings.camFov) {
        persp.fov = settings.camFov
        persp.updateProjectionMatrix()
      }
    }
    camera.lookAt(settings.lookX, settings.lookY, settings.lookZ)
  })
  return null
}

/**
 * FBO clear behind the glass. The reference crystal is a bright, clear solid on
 * black — its body is lit, not dark — so this is a light clear. A dark clear
 * gave a transparent-but-dim body, which is the opposite read.
 */
const TRANSMISSION_BG = new THREE.Color('#4d6b7d')

function GlassPyramid({
  samples,
  resolution,
  settings,
}: {
  samples: number
  resolution: number
  settings: HeroPrismSettings
}) {
  const group = useRef<THREE.Group>(null)
  const cyanMat = useRef<THREE.LineBasicMaterial>(null)
  const whiteMat = useRef<THREE.LineBasicMaterial>(null)

  const geo = useMemo(
    () => buildSquarePyramid(settings.baseSide, settings.height),
    [settings.baseSide, settings.height],
  )
  const edges = useMemo(
    () => buildPyramidEdges(settings.baseSide, settings.height),
    [settings.baseSide, settings.height],
  )

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const showEdges =
    settings.edgeCyanOpacity > 0.01 || settings.edgeWhiteOpacity > 0.01

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const idle = reducedMotion ? 0 : settings.idleAmount
    group.current.position.y = settings.posY
    group.current.rotation.x = settings.rotX + Math.sin(t * 0.28) * idle * 0.35
    group.current.rotation.y = settings.rotY + Math.sin(t * 0.22) * idle * 0.45
    group.current.rotation.z = settings.rotZ
    if (cyanMat.current) cyanMat.current.opacity = settings.edgeCyanOpacity
    if (whiteMat.current) whiteMat.current.opacity = settings.edgeWhiteOpacity
  })

  const thickness = settings.thickness

  return (
    <group ref={group} position={[0, settings.posY, 0]}>
      <mesh geometry={geo}>
        <MeshTransmissionMaterial
          /* backside double-refracts through the far faces; on a convex solid
             at this FBO resolution that showed as internal moiré. */
          backside={false}
          samples={samples}
          resolution={resolution}
          transmission={settings.transmission}
          roughness={settings.roughness}
          thickness={thickness}
          ior={settings.ior}
          chromaticAberration={settings.chromaticAberration}
          anisotropicBlur={settings.anisotropicBlur}
          anisotropy={0}
          distortion={settings.distortion}
          distortionScale={settings.distortionScale}
          temporalDistortion={0}
          color="#ffffff"
          attenuationColor="#ffffff"
          attenuationDistance={settings.attenuationDistance}
          /*
           * Thin-film iridescence is what paints the spectral sweep across the
           * faces in the reference. Nothing in the transmission/dispersion
           * settings alone produces it — chromatic aberration only fringes
           * edges, it does not colour the interior.
           */
          iridescence={settings.iridescence}
          iridescenceIOR={settings.iridescenceIOR}
          iridescenceThicknessRange={[180, settings.iridescenceThickness]}
          clearcoat={settings.clearcoat}
          clearcoatRoughness={settings.clearcoatRoughness}
          metalness={0}
          reflectivity={settings.reflectivity}
          envMapIntensity={settings.envMapIntensity}
          background={TRANSMISSION_BG}
        />
      </mesh>

      {/* Soft rim reinforce — kept faint so edges aren’t wireframe (no Extrude bevel). */}
      {showEdges && settings.edgeCyanOpacity > 0.01 && (
        <lineSegments geometry={edges} renderOrder={3}>
          <lineBasicMaterial
            ref={cyanMat}
            color="#7af8ff"
            transparent
            opacity={settings.edgeCyanOpacity}
            depthTest
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      )}
      {showEdges && settings.edgeWhiteOpacity > 0.01 && (
        <lineSegments geometry={edges} scale={1.004} renderOrder={4}>
          <lineBasicMaterial
            ref={whiteMat}
            color="#ffffff"
            transparent
            opacity={settings.edgeWhiteOpacity}
            depthTest
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      )}
    </group>
  )
}

export default function HeroPrismScene() {
  const q = useMemo(() => quality(), [])
  const settings = usePrismSettings()

  return (
    <>
      <CameraRig settings={settings} />

      {/* Soft fill so transmission has something to sample besides empty black */}
      <ambientLight intensity={0.3} color="#dbe9f2" />
      <directionalLight position={[-5, 2.5, 4]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[4, 2, 3]} intensity={0.5} color="#ffffff" />

      {/*
        Environment built from the page's own palette instead of drei's `city`
        HDRI. The preset reflected an unrelated outdoor scene, which is why the
        crystal looked pasted on — nothing it mirrored belonged to this page.
        These emitters are the hero ground plus the spectrum's own colours, so
        the reflections come from the background it actually sits in. The narrow
        rects are what produce the specular streaks along the arrises, and those
        streaks are most of what reads as "crystal".
      */}
      <Environment resolution={q.envRes} background={false} environmentIntensity={1}>
        {/* Soft white base so the crystal has body and its arrises catch. */}
        <Lightformer
          form="rect"
          intensity={settings.envBase}
          color="#e8f2f8"
          scale={[24, 24, 1]}
          position={[0, 0, -10]}
        />
        {/* Bright key + fill — the specular streaks along the edges. */}
        <Lightformer
          form="rect"
          intensity={settings.envKey}
          color="#ffffff"
          scale={[10, 2.2, 1]}
          position={[-4.2, 2.6, 3.4]}
          rotation={[0, 0, 0.42]}
        />
        <Lightformer
          form="rect"
          intensity={settings.envFill}
          color="#ffffff"
          scale={[9, 1.6, 1]}
          position={[4.4, 1.8, 3]}
          rotation={[0, 0, -0.4]}
        />

        {/*
          Spectral emitters ringing the crystal. Transmission can only show what
          it refracts, so with an all-white environment there was no rainbow
          anywhere for the faces to pick up — tuning roughness/IOR could never
          produce it. These put the colour into the environment itself, which is
          what paints the sweeps across the interior in the reference.
        */}
        <Lightformer form="rect" intensity={settings.envMagenta} color="#ff2f8e" scale={[5, 1.5, 1]} position={[-3.4, -2.4, 1.6]} rotation={[0, 0, 0.7]} />
        <Lightformer form="rect" intensity={settings.envCyan} color="#00e5ff" scale={[5, 1.5, 1]} position={[3.2, -2.2, 1.8]} rotation={[0, 0, -0.7]} />
        <Lightformer form="rect" intensity={settings.envViolet} color="#7c4dff" scale={[4.5, 1.4, 1]} position={[-2.6, 2.8, -1.6]} />
        <Lightformer form="rect" intensity={settings.envAmber} color="#ffb02e" scale={[4.5, 1.4, 1]} position={[2.8, 2.6, -1.8]} />
        <Lightformer form="rect" intensity={settings.envGreen} color="#3dff9e" scale={[4, 1.2, 1]} position={[0, -3.2, -2.2]} />
      </Environment>

      <GlassPyramid
        samples={q.samples}
        resolution={q.resolution}
        settings={settings}
      />
    </>
  )
}
