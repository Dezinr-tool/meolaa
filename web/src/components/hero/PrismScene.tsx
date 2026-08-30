import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
} from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { colors } from '../../lib/brand'

type HoverState = { current: number }

/**
 * Reference-matched square pyramid (measured silhouette ≈ H/W 0.58–0.62).
 *
 * Tunables:
 * - PYRAMID_BASE_SIDE — square edge length (drives how wide the base diamond reads)
 * - PYRAMID_HEIGHT — apex→base (ref is slightly shorter than side → shallow~60° faces)
 * - Corner faces +Z; slight yaw opens the cyan right face like the photo
 */
/** ~28% smaller than prior (2.45 / 2.05) — still readable as hero glass pyramid */
const PYRAMID_BASE_SIDE = 1.76
const PYRAMID_HEIGHT = 1.48
/** Half-diagonal of square base = silhouette half-width when corner-on */
const PYRAMID_RADIUS = PYRAMID_BASE_SIDE / Math.SQRT2
const PYRAMID_THICKNESS = PYRAMID_BASE_SIDE * 0.48
/** Beam anchors at silhouette extremes (corner-on half-width) */
const PRISM_HALF_W = PYRAMID_RADIUS

const SPECTRUM = [
  '#ff4d4d',
  '#ff8c42',
  colors.joyousYellow,
  '#7dff9a',
  '#4ecdc4',
  colors.lilac,
  colors.lilacDeep,
] as const

/** Soft light-beam texture: bright core + radial falloff + axial fade. */
function makeSoftBeamTexture(opts: {
  r: number
  g: number
  b: number
  mode: 'exit' | 'enter'
}): THREE.CanvasTexture {
  const w = 256
  const h = 96
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const img = ctx.createImageData(w, h)
  const data = img.data
  const { r, g, b, mode } = opts

  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h
    const dy = (v - 0.5) * 2
    const softY = Math.exp(-dy * dy * 4.2)
    const coreY = Math.exp(-dy * dy * 18)

    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w
      const axial =
        mode === 'exit' ? Math.pow(1 - u, 1.55) : Math.pow(u, 1.35)
      const glow = softY * axial
      const core = coreY * axial
      const a = Math.min(1, glow * 0.55 + core * 0.9)
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = Math.round(a * 255)
    }
  }

  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  tex.premultiplyAlpha = false
  return tex
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Explicit square-based pyramid — 4 lateral triangles + square base.
 * Corners on ±X/±Z so a ridge faces the camera (same as reference pose).
 */
function buildSquarePyramidGeometry(side: number, height: number) {
  const R = side / Math.SQRT2
  const yA = height / 2
  const yB = -height / 2

  // Front(+Z), Right(+X), Back(-Z), Left(-X)
  const C = [
    new THREE.Vector3(0, yB, R),
    new THREE.Vector3(R, yB, 0),
    new THREE.Vector3(0, yB, -R),
    new THREE.Vector3(-R, yB, 0),
  ]
  const A = new THREE.Vector3(0, yA, 0)

  const positions: number[] = []
  const push = (p: THREE.Vector3) => positions.push(p.x, p.y, p.z)
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    push(a)
    push(b)
    push(c)
  }

  // Lateral faces (outward winding)
  for (let i = 0; i < 4; i++) {
    tri(A, C[i], C[(i + 1) % 4])
  }
  // Base (two tris, normal -Y)
  tri(C[0], C[2], C[1])
  tri(C[0], C[3], C[2])

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.computeVertexNormals()
  return geo
}

/** 8 crisp edges: 4 base + 4 apex ridges (independent of face normals). */
function buildPyramidEdges(side: number, height: number, mode: 'all' | 'base' = 'all') {
  const R = side / Math.SQRT2
  const yA = height / 2
  const yB = -height / 2
  const A = [0, yA, 0]
  const C = [
    [0, yB, R],
    [R, yB, 0],
    [0, yB, -R],
    [-R, yB, 0],
  ]
  const segs: number[] = []
  const line = (a: number[], b: number[]) => segs.push(...a, ...b)
  for (let i = 0; i < 4; i++) {
    line(C[i], C[(i + 1) % 4])
    if (mode === 'all') line(A, C[i])
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3))
  return geo
}

function useGlassPyramidGeometry() {
  return useMemo(
    () => buildSquarePyramidGeometry(PYRAMID_BASE_SIDE, PYRAMID_HEIGHT),
    [],
  )
}

function usePyramidEdges() {
  return useMemo(() => {
    return {
      all: buildPyramidEdges(PYRAMID_BASE_SIDE, PYRAMID_HEIGHT, 'all'),
      base: buildPyramidEdges(PYRAMID_BASE_SIDE, PYRAMID_HEIGHT, 'base'),
    }
  }, [])
}

/**
 * Low camera looking slightly UP — base collapses to a thin diamond like the photo.
 * Camera world position is set in HeroPrism; this only aims it.
 */
function CameraAim() {
  const { camera } = useThree()
  useLayoutEffect(() => {
    camera.lookAt(0, 0.28, 0)
    camera.updateProjectionMatrix()
  }, [camera])
  return null
}

function WhiteBeam({ hover }: { hover: HoverState }) {
  const group = useRef<THREE.Group>(null)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null)

  const beamLen = 2.6
  const entryX = -PRISM_HALF_W * 0.88

  const textures = useMemo(() => {
    const white = { r: 255, g: 255, b: 255 }
    return {
      soft: makeSoftBeamTexture({ ...white, mode: 'enter' }),
      core: makeSoftBeamTexture({ ...white, mode: 'enter' }),
    }
  }, [])

  useFrame(() => {
    if (!group.current || !glowMat.current || !coreMat.current) return
    const t = hover.current
    glowMat.current.opacity = t * 0.85
    coreMat.current.opacity = t * 1
    const sx = 0.75 + t * 0.35
    group.current.scale.set(sx, 0.7 + t * 0.55, 1)
    const w = beamLen * sx
    group.current.position.x = entryX - w / 2
  })

  return (
    <group
      ref={group}
      position={[entryX - beamLen / 2, -0.12, 0.55]}
      renderOrder={2}
    >
      <mesh>
        <planeGeometry args={[beamLen, 0.22]} />
        <meshBasicMaterial
          ref={glowMat}
          map={textures.soft}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[beamLen, 0.07]} />
        <meshBasicMaterial
          ref={coreMat}
          map={textures.core}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function SpectrumRays({ hover }: { hover: HoverState }) {
  const group = useRef<THREE.Group>(null)
  const exitX = PRISM_HALF_W * 0.88
  const rayLen = 2.25

  const textures = useMemo(
    () =>
      SPECTRUM.map((hex) => {
        const rgb = hexToRgb(hex)
        return {
          soft: makeSoftBeamTexture({ ...rgb, mode: 'exit' }),
          core: makeSoftBeamTexture({ ...rgb, mode: 'exit' }),
        }
      }),
    [],
  )

  useFrame(() => {
    if (!group.current) return
    const t = hover.current
    group.current.children.forEach((child, i) => {
      const ray = child as THREE.Group
      const grow = Math.max(0.001, t * (0.95 + i * 0.04))
      ray.scale.setX(grow)
      ray.position.x = (rayLen * grow) / 2

      const glow = ray.children[0] as THREE.Mesh
      const core = ray.children[1] as THREE.Mesh
      ;(glow.material as THREE.MeshBasicMaterial).opacity = t * (0.5 + (i % 3) * 0.08)
      ;(core.material as THREE.MeshBasicMaterial).opacity = t * (0.75 + (i % 2) * 0.12)
    })
  })

  const mid = (SPECTRUM.length - 1) / 2

  return (
    <group ref={group} position={[exitX, -0.12, 0.55]} renderOrder={2}>
      {SPECTRUM.map((hex, i) => {
        const spread = i - mid
        return (
          <group
            key={hex}
            position={[0.001, spread * 0.012, 0]}
            rotation={[0, 0, spread * 0.072]}
            scale={[0.001, 1, 1]}
          >
            <mesh>
              <planeGeometry args={[rayLen, 0.2]} />
              <meshBasicMaterial
                map={textures[i].soft}
                color={hex}
                transparent
                opacity={0}
                depthWrite={false}
                depthTest={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, 0, 0.001]}>
              <planeGeometry args={[rayLen, 0.055]} />
              <meshBasicMaterial
                map={textures[i].core}
                color="#ffffff"
                transparent
                opacity={0}
                depthWrite={false}
                depthTest={false}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function GlassPyramid({
  hover,
  onHoverChange,
}: {
  hover: HoverState
  onHoverChange: (v: boolean) => void
}) {
  const geo = useGlassPyramidGeometry()
  const { all: edges, base: baseEdges } = usePyramidEdges()
  const group = useRef<THREE.Group>(null)

  // Slight yaw opens the right face (cyan in reference); pitch 0 — camera provides low angle
  const baseRotX = 0
  const baseRotY = 0.22
  const baseRotZ = 0

  useFrame((state) => {
    if (!group.current) return
    const h = hover.current
    const { x, y } = state.pointer
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      baseRotX + y * 0.035 * h,
      0.08,
    )
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      baseRotY + x * 0.055 * h,
      0.08,
    )
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      baseRotZ,
      0.08,
    )
  })

  const baseY = -PYRAMID_HEIGHT / 2

  return (
    <group
      ref={group}
      position={[0, 0.12, 0]}
      rotation={[baseRotX, baseRotY, baseRotZ]}
      onPointerOver={(e) => {
        e.stopPropagation()
        onHoverChange(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        onHoverChange(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <mesh geometry={geo} castShadow={false} receiveShadow={false}>
        <MeshTransmissionMaterial
          backside
          backsideThickness={PYRAMID_THICKNESS * 1.2}
          samples={16}
          resolution={1024}
          transmission={1}
          roughness={0.016}
          thickness={PYRAMID_THICKNESS}
          ior={1.52}
          chromaticAberration={0.12}
          anisotropicBlur={0.03}
          anisotropy={0.02}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          color="#f5f9ff"
          attenuationColor="#dff4ff"
          attenuationDistance={1.5}
          clearcoat={1}
          clearcoatRoughness={0.01}
          metalness={0}
          reflectivity={0.68}
          envMapIntensity={1.65}
        />
      </mesh>

      {/* White edge catchlights — all 8 pyramid edges */}
      <lineSegments geometry={edges} renderOrder={1}>
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.95}
          depthTest
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Magenta base perimeter — signature neon foot */}
      <lineSegments geometry={baseEdges} renderOrder={1}>
        <lineBasicMaterial
          color="#ff2ecf"
          transparent
          opacity={0.85}
          depthTest
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <pointLight
        position={[0, baseY + 0.04, 0]}
        color="#ff2ecf"
        intensity={3.2}
        distance={3.6}
        decay={2}
      />
      <pointLight
        position={[0.55, 0.05, 0.45]}
        color="#4ef0ff"
        intensity={1.8}
        distance={2.8}
        decay={2}
      />
      <pointLight
        position={[-0.45, -0.1, 0.35]}
        color="#c44dff"
        intensity={0.9}
        distance={2.2}
        decay={2}
      />

      {/* Floor spill — diamond aligned with corner-on square base */}
      <mesh
        position={[0, baseY - 0.02, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        renderOrder={0}
      >
        <planeGeometry args={[PYRAMID_BASE_SIDE * 1.55, PYRAMID_BASE_SIDE * 1.55]} />
        <meshBasicMaterial
          color="#ff2ecf"
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function HoverLight({ hover }: { hover: HoverState }) {
  const key = useRef<THREE.DirectionalLight>(null)

  useFrame((_, dt) => {
    const t = hover.current
    if (key.current) {
      key.current.intensity = THREE.MathUtils.damp(
        key.current.intensity,
        0.25 + t * 2.4,
        6,
        dt,
      )
    }
  })

  return (
    <directionalLight
      ref={key}
      position={[-5, 0.35, 2.4]}
      intensity={0.25}
      color="#ffffff"
    />
  )
}

/**
 * Square-based glass pyramid, low-angle corner-on pose matching the reference.
 * Hover: soft white beam in → spectrum fan out.
 */
export function PrismScene() {
  const hover = useRef(0)
  const hovering = useRef(false)

  useFrame((_, dt) => {
    hover.current = THREE.MathUtils.damp(
      hover.current,
      hovering.current ? 1 : 0,
      7,
      dt,
    )
  })

  return (
    <>
      <CameraAim />
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.045} color="#c8d4e8" />
      <directionalLight position={[0, 4, 4]} intensity={0.3} color="#ffffff" />
      <directionalLight position={[3, 0.5, 2]} intensity={0.35} color="#7af0ff" />
      <directionalLight position={[-2, -0.8, 2]} intensity={0.45} color="#ff4dd6" />
      <HoverLight hover={hover} />

      <Environment resolution={256} environmentIntensity={1.15}>
        <group>
          <Lightformer
            form="rect"
            intensity={7}
            position={[-5.5, 2.2, 2.5]}
            scale={[6, 0.35, 1]}
            color="#ffffff"
          />
          <Lightformer
            form="rect"
            intensity={5.5}
            position={[4.5, 1.8, 2]}
            scale={[0.35, 5, 1]}
            color="#ffffff"
          />
          <Lightformer
            form="rect"
            intensity={4}
            position={[0, 5.5, 2]}
            scale={[7, 0.4, 1]}
            color="#ffffff"
          />
          <Lightformer
            form="rect"
            intensity={4.5}
            position={[0, -2.6, 0.8]}
            scale={[5, 0.5, 1]}
            color="#ff2ecf"
          />
          <Lightformer
            form="rect"
            intensity={3.2}
            position={[2.8, 0.3, 2]}
            scale={[0.45, 3.2, 1]}
            color="#5ef0ff"
          />
          <Lightformer
            form="circle"
            intensity={2.4}
            position={[0, 0.2, 5]}
            scale={1.05}
            color="#ffffff"
          />
        </group>
      </Environment>

      <WhiteBeam hover={hover} />
      <GlassPyramid
        hover={hover}
        onHoverChange={(v) => {
          hovering.current = v
        }}
      />
      <SpectrumRays hover={hover} />
    </>
  )
}
