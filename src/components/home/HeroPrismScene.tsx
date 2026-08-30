import {
  Environment,
  MeshTransmissionMaterial,
  useEnvironment,
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
 * Apex-up triangular pyramid glass prism.
 *
 * Glass reads as glass by distorting recognizable structure behind it —
 * here: bold brand-colored bars + rings (no text, so it won't clash with
 * hero copy). Dark body; brightness only where content refracts + edges.
 */

const BRAND = {
  yellow: '#fdf28c',
  lilac: '#a8a3e3',
  lilacDeep: '#5656ad',
  green: '#41857a',
  ecru: '#f8ece4',
} as const

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
  return { samples: 28, resolution: 1024, envRes: 128 }
}

function buildTrianglePyramid(baseSide: number, height: number) {
  const R = baseSide / Math.sqrt(3)
  const yA = height * 0.55
  const yB = -height * 0.45

  const A = new THREE.Vector3(0, yA, 0)
  const B0 = new THREE.Vector3(0, yB, R)
  const B1 = new THREE.Vector3(R * Math.cos(Math.PI / 6), yB, -R * Math.sin(Math.PI / 6))
  const B2 = new THREE.Vector3(-R * Math.cos(Math.PI / 6), yB, -R * Math.sin(Math.PI / 6))

  const positions: number[] = []
  const push = (p: THREE.Vector3) => positions.push(p.x, p.y, p.z)
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    push(a)
    push(b)
    push(c)
  }

  tri(A, B0, B1)
  tri(A, B1, B2)
  tri(A, B2, B0)
  tri(B0, B2, B1)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.computeVertexNormals()
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

function SoftMat({
  color,
  opacity,
}: {
  color: string
  opacity: number
}) {
  return (
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      depthWrite={false}
      toneMapped={false}
      side={THREE.DoubleSide}
    />
  )
}

/**
 * Bold graphic field behind the prism — thick bars + concentric rings in
 * brand colors. Straight edges make refractive displacement obvious; sized
 * so some structure peeks outside the silhouette for comparison.
 */
function BehindGraphic() {
  const bars = useMemo(
    () =>
      [
        { x: -1.55, color: BRAND.lilac, opacity: 0.38, w: 0.11 },
        { x: -1.1, color: BRAND.yellow, opacity: 0.42, w: 0.13 },
        { x: -0.65, color: BRAND.ecru, opacity: 0.36, w: 0.1 },
        { x: -0.2, color: BRAND.green, opacity: 0.4, w: 0.12 },
        { x: 0.25, color: BRAND.lilacDeep, opacity: 0.34, w: 0.11 },
        { x: 0.7, color: BRAND.yellow, opacity: 0.4, w: 0.13 },
        { x: 1.15, color: BRAND.ecru, opacity: 0.35, w: 0.1 },
        { x: 1.55, color: BRAND.lilac, opacity: 0.32, w: 0.11 },
      ] as const,
    [],
  )

  const rings = useMemo(
    () =>
      [
        { inner: 0.35, outer: 0.48, color: BRAND.yellow, opacity: 0.34 },
        { inner: 0.62, outer: 0.76, color: BRAND.lilac, opacity: 0.3 },
        { inner: 0.9, outer: 1.05, color: BRAND.green, opacity: 0.28 },
        { inner: 1.18, outer: 1.32, color: BRAND.ecru, opacity: 0.24 },
      ] as const,
    [],
  )

  return (
    <group position={[0.08, 0.02, -0.95]} renderOrder={-1}>
      {/* Vertical bars — strongest straight-edge refraction cue */}
      {bars.map((bar) => (
        <mesh key={bar.x} position={[bar.x, 0, 0]}>
          <planeGeometry args={[bar.w, 2.6]} />
          <SoftMat color={bar.color} opacity={bar.opacity} />
        </mesh>
      ))}

      {/* Slight diagonal accent bars for asymmetric warp */}
      <mesh position={[-0.9, 0.15, 0.02]} rotation={[0, 0, 0.38]}>
        <planeGeometry args={[0.09, 2.2]} />
        <SoftMat color={BRAND.yellow} opacity={0.28} />
      </mesh>
      <mesh position={[0.95, -0.1, 0.02]} rotation={[0, 0, -0.32]}>
        <planeGeometry args={[0.09, 2.1]} />
        <SoftMat color={BRAND.lilac} opacity={0.26} />
      </mesh>

      {/* Concentric rings centered behind the prism */}
      {rings.map((ring) => (
        <mesh key={ring.inner} position={[0, 0, 0.04]} rotation={[0, 0, 0]}>
          <ringGeometry args={[ring.inner, ring.outer, 64]} />
          <SoftMat color={ring.color} opacity={ring.opacity} />
        </mesh>
      ))}
    </group>
  )
}

/** Near-black FBO clear — glass body stays dark where no content refracts. */
const TRANSMISSION_BG = new THREE.Color('#020608')

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

  const geo = useMemo(
    () => buildTrianglePyramid(settings.baseSide, settings.height),
    [settings.baseSide, settings.height],
  )

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const idle = reducedMotion ? 0 : settings.idleAmount
    group.current.position.y = settings.posY
    group.current.rotation.x = settings.rotX + Math.sin(t * 0.28) * idle * 0.35
    group.current.rotation.y = settings.rotY + Math.sin(t * 0.22) * idle * 0.45
    group.current.rotation.z = settings.rotZ
  })

  const thickness = settings.thickness

  return (
    <group ref={group} position={[0, settings.posY, 0]}>
      <mesh geometry={geo}>
        <MeshTransmissionMaterial
          backside
          backsideThickness={thickness * 1.2}
          samples={samples}
          resolution={resolution}
          transmission={1}
          roughness={settings.roughness}
          thickness={thickness}
          ior={settings.ior}
          chromaticAberration={settings.chromaticAberration}
          anisotropicBlur={0}
          anisotropy={0}
          distortion={0.45}
          distortionScale={0.6}
          temporalDistortion={0}
          color="#ffffff"
          attenuationColor="#0a1218"
          attenuationDistance={3.5}
          clearcoat={0.08}
          clearcoatRoughness={0.12}
          metalness={0}
          reflectivity={settings.reflectivity}
          envMapIntensity={settings.envMapIntensity}
          background={TRANSMISSION_BG}
        />
      </mesh>
    </group>
  )
}

export default function HeroPrismScene() {
  const q = useMemo(() => quality(), [])
  const settings = usePrismSettings()
  const envMap = useEnvironment({ preset: 'city' })

  return (
    <>
      <CameraRig settings={settings} />

      {/* Minimal fill — dark body; brightness from refracted graphic + edges */}
      <ambientLight intensity={0.04} color="#a8b8c4" />
      <directionalLight position={[-5, 2.5, 4]} intensity={0.3} color="#ffffff" />
      <directionalLight position={[4, 1.5, 3]} intensity={0.18} color="#d8e8f0" />

      <Environment
        map={envMap}
        resolution={q.envRes}
        background={false}
        environmentIntensity={0.5}
      />

      <BehindGraphic />

      <GlassPyramid
        samples={q.samples}
        resolution={q.resolution}
        settings={settings}
      />
    </>
  )
}
