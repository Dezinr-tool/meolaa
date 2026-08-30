import { Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import {
  getPrismSettings,
  subscribePrismSettings,
  type HeroPrismSettings,
} from './heroPrismSettings'

/**
 * Triangle-based pyramid (tetrahedron): apex up, triangular base down.
 * Matches the classic ¾ textbook silhouette — center ridge + two front faces.
 * Beams live on a separate Canvas so they never tint the crystal.
 */

function usePrismSettings() {
  return useSyncExternalStore(subscribePrismSettings, getPrismSettings, getPrismSettings)
}

function quality() {
  if (typeof window === 'undefined') {
    return { samples: 14, resolution: 640, lightRes: 256 }
  }
  const mobile = window.matchMedia('(max-width: 900px)').matches
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || mobile) {
    return { samples: 8, resolution: 384, lightRes: 128 }
  }
  return { samples: 16, resolution: 896, lightRes: 256 }
}

/**
 * Explicit triangular pyramid:
 * - apex on +Y
 * - equilateral triangular base on -Y
 * - one base vertex toward +Z so the front center ridge reads like the diagram
 */
function buildTrianglePyramid(baseSide: number, height: number) {
  const R = baseSide / Math.sqrt(3) // circumradius of equilateral triangle
  const yA = height * 0.55
  const yB = -height * 0.45

  const A = new THREE.Vector3(0, yA, 0)
  // Front vertex (+Z), then CW when viewed from above
  const B0 = new THREE.Vector3(0, yB, R) // front — center ridge lands here
  const B1 = new THREE.Vector3(R * Math.cos(Math.PI / 6), yB, -R * Math.sin(Math.PI / 6))
  const B2 = new THREE.Vector3(-R * Math.cos(Math.PI / 6), yB, -R * Math.sin(Math.PI / 6))

  const positions: number[] = []
  const push = (p: THREE.Vector3) => positions.push(p.x, p.y, p.z)
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    push(a)
    push(b)
    push(c)
  }

  // Lateral faces (outward winding)
  tri(A, B0, B1)
  tri(A, B1, B2)
  tri(A, B2, B0)
  // Base (normal -Y)
  tri(B0, B2, B1)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.computeVertexNormals()
  return geo
}

function pyramidCorners(baseSide: number, height: number) {
  const R = baseSide / Math.sqrt(3)
  const yA = height * 0.55
  const yB = -height * 0.45
  return {
    A: new THREE.Vector3(0, yA, 0),
    B: [
      new THREE.Vector3(0, yB, R),
      new THREE.Vector3(R * Math.cos(Math.PI / 6), yB, -R * Math.sin(Math.PI / 6)),
      new THREE.Vector3(-R * Math.cos(Math.PI / 6), yB, -R * Math.sin(Math.PI / 6)),
    ],
  }
}

function buildPyramidEdges(baseSide: number, height: number) {
  const { A, B } = pyramidCorners(baseSide, height)
  const segs: number[] = []
  const line = (a: THREE.Vector3, b: THREE.Vector3) =>
    segs.push(a.x, a.y, a.z, b.x, b.y, b.z)
  for (let i = 0; i < 3; i++) {
    line(A, B[i])
    line(B[i], B[(i + 1) % 3])
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
    () => buildTrianglePyramid(settings.baseSide, settings.height),
    [settings.baseSide, settings.height],
  )
  const edges = useMemo(
    () => buildPyramidEdges(settings.baseSide, settings.height),
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
    if (cyanMat.current) cyanMat.current.opacity = settings.edgeCyanOpacity
    if (whiteMat.current) whiteMat.current.opacity = settings.edgeWhiteOpacity
  })

  const thickness = settings.thickness

  return (
    <group ref={group} position={[0, settings.posY, 0]}>
      <mesh geometry={geo} scale={0.97}>
        <meshPhysicalMaterial
          color="#061018"
          roughness={0.4}
          metalness={0.02}
          transparent
          opacity={0.18}
          transmission={0.7}
          thickness={thickness * 0.35}
          ior={1.38}
          envMapIntensity={0.5}
        />
      </mesh>

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
          anisotropicBlur={0.05}
          anisotropy={0.03}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          color="#eef6ff"
          attenuationColor="#9fd4ff"
          attenuationDistance={1.5}
          clearcoat={0.85}
          clearcoatRoughness={0.05}
          metalness={0}
          reflectivity={settings.reflectivity}
          envMapIntensity={settings.envMapIntensity}
        />
      </mesh>

      {settings.edgeCyanOpacity > 0.01 && (
        <lineSegments geometry={edges} renderOrder={2}>
          <lineBasicMaterial
            ref={cyanMat}
            color="#5ef0ff"
            transparent
            opacity={settings.edgeCyanOpacity}
            depthTest
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}
      {settings.edgeWhiteOpacity > 0.01 && (
        <lineSegments geometry={edges} scale={1.012} renderOrder={2}>
          <lineBasicMaterial
            ref={whiteMat}
            color="#ffffff"
            transparent
            opacity={settings.edgeWhiteOpacity}
            depthTest
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      )}

      <pointLight position={[0.55, 0.45, 0.75]} color="#4ef0ff" intensity={2.4} distance={3.8} decay={2} />
      <pointLight position={[-0.5, 0.1, 0.55]} color="#7b5cff" intensity={1.1} distance={3.0} decay={2} />
      <pointLight position={[0.4, -0.35, 0.35]} color="#ff8c42" intensity={1.0} distance={2.8} decay={2} />
      <pointLight position={[0.1, 0.7, 0.4]} color="#ffffff" intensity={1.2} distance={3.2} decay={2} />
    </group>
  )
}

export default function HeroPrismScene() {
  const q = useMemo(() => quality(), [])
  const settings = usePrismSettings()

  return (
    <>
      <CameraRig settings={settings} />

      <ambientLight intensity={0.05} color="#c8d4e8" />
      <directionalLight position={[-5, 0.8, 2.8]} intensity={0.7} color="#ffffff" />
      <directionalLight position={[3.2, 1.5, 2]} intensity={0.45} color="#7af8ff" />
      <directionalLight position={[1.5, -1.8, 1.5]} intensity={0.35} color="#ff9a60" />
      <directionalLight position={[0, 3.5, 2]} intensity={0.3} color="#ffffff" />

      <Environment resolution={q.lightRes} environmentIntensity={0.95} background={false}>
        <group>
          <Lightformer
            form="rect"
            intensity={5.5}
            position={[-6, 1.4, 3]}
            scale={[8, 0.5, 1]}
            color="#e8f2ff"
          />
          <Lightformer
            form="rect"
            intensity={4}
            position={[5, 1.2, 2.5]}
            scale={[0.55, 6, 1]}
            color="#7af8ff"
          />
          <Lightformer
            form="rect"
            intensity={2.8}
            position={[3.5, -2.2, 2]}
            scale={[4, 0.6, 1]}
            color="#ff9a60"
          />
          <Lightformer
            form="rect"
            intensity={2.4}
            position={[3, 0.6, 2.2]}
            scale={[0.7, 3.2, 1]}
            color="#c44dff"
          />
          <Lightformer
            form="rect"
            intensity={3}
            position={[0, 5.5, 2]}
            scale={[7, 0.55, 1]}
            color="#ffffff"
          />
        </group>
      </Environment>

      <GlassPyramid samples={q.samples} resolution={q.resolution} settings={settings} />
    </>
  )
}
