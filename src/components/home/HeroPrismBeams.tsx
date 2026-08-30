import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import { gsap } from '../../lib/motion'
import {
  isPreloaderComplete,
  subscribePreloaderComplete,
} from '../../lib/preloaderComplete'
import {
  getPrismSettings,
  subscribePrismSettings,
  type HeroPrismSettings,
} from './heroPrismSettings'

const SPECTRUM_COLORS = [
  '#4d7fff',
  '#5b8cff',
  '#7b5cff',
  '#a04dff',
  '#c44dff',
  '#ff4d8a',
  '#ff6a4d',
  '#ff8c42',
  '#ffb340',
  '#ffd24d',
  '#ffe66d',
] as const

const WHITE_DRAW_DURATION = 1.05
const SPECTRUM_DRAW_DURATION = 1.0
/** Spectrum starts just before white finishes — light in, then light out. */
const SPECTRUM_OVERLAP = 0.18

function usePrismSettings() {
  return useSyncExternalStore(subscribePrismSettings, getPrismSettings, getPrismSettings)
}

function makeSoftBeamTexture(opts: {
  r: number
  g: number
  b: number
  mode: 'exit' | 'enter'
}): THREE.CanvasTexture {
  const w = 256
  const h = 128
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
    const softY = Math.exp(-dy * dy * 2.4)
    const coreY = Math.exp(-dy * dy * 9)
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w
      const axial =
        mode === 'exit'
          ? Math.pow(1 - u, 0.9) * (0.88 + 0.12 * Math.sin(Math.min(1, u * 1.15) * Math.PI))
          : Math.pow(Math.min(1, u * 1.35), 0.45)
      const a = Math.min(1, softY * axial * 0.7 + coreY * axial * 0.85)
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
  return tex
}

function makeSpectrumGradientTexture(): THREE.CanvasTexture {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  ;(
    [
      [0, '#3d6fff'],
      [0.18, '#7b5cff'],
      [0.34, '#c44dff'],
      [0.5, '#ff4d8a'],
      [0.66, '#ff8c42'],
      [0.82, '#ffd24d'],
      [1, '#ffe66d'],
    ] as const
  ).forEach(([t, c]) => grad.addColorStop(t, c))
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data
  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h
    const edge = Math.sin(v * Math.PI)
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w
      const axial = Math.pow(1 - u, 0.85) * (0.9 + 0.1 * Math.sin(Math.min(1, u * 1.1) * Math.PI))
      const a = Math.min(1, edge * axial)
      data[(y * w + x) * 4 + 3] = Math.round(a * 255)
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
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

function WhiteBeam({
  progress,
  settings,
}: {
  progress: { current: number }
  settings: HeroPrismSettings
}) {
  const root = useRef<THREE.Group>(null)
  const reveal = useRef<THREE.Group>(null)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)
  const coreMat = useRef<THREE.MeshBasicMaterial>(null)
  const textures = useMemo(() => {
    const white = { r: 255, g: 255, b: 255 }
    return {
      soft: makeSoftBeamTexture({ ...white, mode: 'enter' }),
      core: makeSoftBeamTexture({ ...white, mode: 'enter' }),
    }
  }, [])

  useFrame(() => {
    if (!root.current || !reveal.current || !glowMat.current || !coreMat.current) return
    const p = progress.current
    const { beamEntryX, beamEntryY, beamLength, beamWidth, beamOpacity, beamAngle } =
      settings

    /* Pivot at prism entry (local x=0); beam grows right←left from -beamLength. */
    root.current.position.set(beamEntryX, beamEntryY, -0.55)
    root.current.rotation.z = beamAngle
    reveal.current.position.set(-beamLength, 0, 0)
    reveal.current.scale.set(Math.max(0.0001, p), 1, 1)

    const visible = p > 0.001
    glowMat.current.opacity = visible ? beamOpacity * 0.75 : 0
    coreMat.current.opacity = visible ? beamOpacity : 0

    const glow = reveal.current.children[0] as THREE.Mesh
    const core = reveal.current.children[1] as THREE.Mesh
    glow.position.set(beamLength / 2, 0, 0)
    core.position.set(beamLength / 2, 0, 0.001)
    glow.scale.set(1, beamWidth / 0.14, 1)
    core.scale.set(1, (beamWidth * 0.35) / 0.05, 1)
  })

  return (
    <group ref={root}>
      <group ref={reveal} scale={[0.0001, 1, 1]}>
        <mesh position={[settings.beamLength / 2, 0, 0]}>
          <planeGeometry args={[settings.beamLength, 0.14]} />
          <meshBasicMaterial
            ref={glowMat}
            map={textures.soft}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[settings.beamLength / 2, 0, 0.001]}>
          <planeGeometry args={[settings.beamLength, 0.05]} />
          <meshBasicMaterial
            ref={coreMat}
            map={textures.core}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  )
}

function SpectrumRibbon({
  progress,
  settings,
}: {
  progress: { current: number }
  settings: HeroPrismSettings
}) {
  const group = useRef<THREE.Group>(null)
  const baseMesh = useRef<THREE.Mesh>(null)
  const baseMat = useRef<THREE.MeshBasicMaterial>(null)
  const gradient = useMemo(() => makeSpectrumGradientTexture(), [])
  const layerCount = Math.max(5, Math.min(16, Math.round(settings.spectrumLayers)))
  const colors = useMemo(() => SPECTRUM_COLORS.slice(0, layerCount), [layerCount])
  const textures = useMemo(
    () =>
      colors.map((hex) => {
        const rgb = hexToRgb(hex)
        return makeSoftBeamTexture({ ...rgb, mode: 'exit' })
      }),
    [colors],
  )

  useFrame(() => {
    if (!group.current) return
    const t = progress.current
    const {
      spectrumExitX,
      spectrumExitY,
      spectrumLength,
      spectrumWidth,
      spectrumAngle,
      spectrumSpread,
      spectrumFan,
      spectrumOpacity,
    } = settings
    group.current.position.set(spectrumExitX, spectrumExitY, -0.55)
    group.current.rotation.z = spectrumAngle

    const visible = t > 0.001
    const grow = Math.max(0.0001, t)

    if (baseMesh.current && baseMat.current) {
      baseMesh.current.scale.set(grow, 1, 1)
      baseMesh.current.position.set((spectrumLength * grow) / 2, 0, 0)
      baseMat.current.opacity = visible ? spectrumOpacity * 0.55 : 0
    }

    const bands = group.current.children[1] as THREE.Group
    if (!bands) return
    const mid = (bands.children.length - 1) / 2
    bands.children.forEach((child, i) => {
      const ray = child as THREE.Group
      const spread = i - mid
      const rayGrow = Math.max(0.0001, grow * (0.96 + i * 0.01))
      ray.scale.set(rayGrow, 1, 1)
      ray.position.set((spectrumLength * rayGrow) / 2, spread * spectrumSpread, 0)
      ray.rotation.z = spread * spectrumFan
      const glow = ray.children[0] as THREE.Mesh
      ;(glow.material as THREE.MeshBasicMaterial).opacity = visible
        ? spectrumOpacity * (0.35 + (i % 3) * 0.06)
        : 0
      glow.scale.setY(spectrumWidth / 0.4)
    })
  })

  return (
    <group ref={group}>
      <mesh ref={baseMesh} position={[settings.spectrumLength / 2, 0, 0]} scale={[0.0001, 1, 1]}>
        <planeGeometry args={[settings.spectrumLength, settings.spectrumWidth * 1.35]} />
        <meshBasicMaterial
          ref={baseMat}
          map={gradient}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <group>
        {colors.map((hex, i) => (
          <group key={`${hex}-${i}`} scale={[0.001, 1, 1]}>
            <mesh>
              <planeGeometry args={[settings.spectrumLength, 0.4]} />
              <meshBasicMaterial
                map={textures[i]}
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
          </group>
        ))}
      </group>
    </group>
  )
}

function BeamsCamera({ settings }: { settings: HeroPrismSettings }) {
  return <CameraRig settings={settings} />
}

/** Shared reveal progress — singleton so enter/exit canvases stay in sync. */
const whiteProgress = { current: 0 }
const spectrumProgress = { current: 0 }
let revealStarted = false
let revealTween: gsap.core.Timeline | null = null

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function runBeamReveal() {
  if (revealStarted) return
  revealStarted = true

  if (prefersReducedMotion()) {
    whiteProgress.current = 1
    spectrumProgress.current = 1
    return
  }

  const proxy = { white: 0, spectrum: 0 }
  whiteProgress.current = 0
  spectrumProgress.current = 0

  revealTween?.kill()
  revealTween = gsap
    .timeline({ defaults: { ease: 'power2.out' } })
    .to(proxy, {
      white: 1,
      duration: WHITE_DRAW_DURATION,
      onUpdate: () => {
        whiteProgress.current = proxy.white
      },
    })
    .to(
      proxy,
      {
        spectrum: 1,
        duration: SPECTRUM_DRAW_DURATION,
        onUpdate: () => {
          spectrumProgress.current = proxy.spectrum
        },
      },
      `-=${SPECTRUM_OVERLAP}`,
    )
}

function useBeamReveal() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      whiteProgress.current = 1
      spectrumProgress.current = 1
      revealStarted = true
      return
    }

    if (isPreloaderComplete()) {
      runBeamReveal()
      return
    }

    return subscribePreloaderComplete(runBeamReveal)
  }, [])

  return { whiteProgress, spectrumProgress }
}

/** Incoming white beam only — drawn on a canvas *behind* the glass. */
export function HeroPrismEnterBeams() {
  const settings = usePrismSettings()
  const { whiteProgress: white } = useBeamReveal()

  return (
    <>
      <BeamsCamera settings={settings} />
      <WhiteBeam progress={white} settings={settings} />
    </>
  )
}

/** Exit spectrum only — drawn on a canvas *in front of* the glass. */
export function HeroPrismExitBeams() {
  const settings = usePrismSettings()
  const { spectrumProgress: spectrum } = useBeamReveal()

  return (
    <>
      <BeamsCamera settings={settings} />
      <SpectrumRibbon progress={spectrum} settings={settings} />
    </>
  )
}

/** Beam-only scene — separate Canvas so glass refraction never samples these. */
export default function HeroPrismBeams() {
  const settings = usePrismSettings()
  const { whiteProgress: white, spectrumProgress: spectrum } = useBeamReveal()

  return (
    <>
      <BeamsCamera settings={settings} />
      <WhiteBeam progress={white} settings={settings} />
      <SpectrumRibbon progress={spectrum} settings={settings} />
    </>
  )
}
