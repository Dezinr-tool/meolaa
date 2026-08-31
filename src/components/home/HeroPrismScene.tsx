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
  /* Square base as two triangles — outward normal −Y. */
  tri(B0, B2, B1)
  tri(B0, B3, B2)

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
 * FBO clear behind the glass — what the crystal refracts. This is sampled from
 * the hero's own painted background (rgb(2,18,20)) rather than an arbitrary
 * grey, so the body reads as the page seen through glass instead of a pasted-in
 * object carrying its own unrelated colour.
 */
const TRANSMISSION_BG = new THREE.Color('#0a2c36')

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
          transmission={1}
          roughness={Math.min(settings.roughness, 0.06)}
          thickness={thickness}
          ior={settings.ior}
          chromaticAberration={settings.chromaticAberration}
          anisotropicBlur={0}
          anisotropy={0}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          color="#ffffff"
          attenuationColor="#a9d2e2"
          attenuationDistance={22}
          clearcoat={0.4}
          clearcoatRoughness={0.05}
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
      <ambientLight intensity={0.18} color="#9fc4d4" />
      <directionalLight position={[-5, 2.5, 4]} intensity={0.35} color="#ffffff" />

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
        {/* Hero ground — the dark teal the crystal sits in, wrapping it. */}
        <Lightformer
          form="rect"
          intensity={1.1}
          color="#12495a"
          scale={[26, 26, 1]}
          position={[0, 0, -10]}
        />
        {/* Key streak, ray side — lights the entry face and its top arris. */}
        <Lightformer
          form="rect"
          intensity={3.4}
          color="#ffffff"
          scale={[9, 1.1, 1]}
          position={[-4.2, 2.6, 3.4]}
          rotation={[0, 0, 0.42]}
        />
        {/* Low fill along the incoming beam. */}
        <Lightformer
          form="rect"
          intensity={1.7}
          color="#cfe8ff"
          scale={[8, 0.9, 1]}
          position={[-5.2, -0.2, 2.2]}
        />
        {/* Exit side picks up the spectrum's warm and cool ends. */}
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#ff8347"
          scale={[4.5, 0.8, 1]}
          position={[4.1, 1.4, 2.4]}
          rotation={[0, 0, -0.38]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color="#5a7dff"
          scale={[4.5, 0.8, 1]}
          position={[4.4, -0.5, 2.4]}
          rotation={[0, 0, -0.38]}
        />
      </Environment>

      <GlassPyramid
        samples={q.samples}
        resolution={q.resolution}
        settings={settings}
      />
    </>
  )
}
