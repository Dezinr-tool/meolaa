import { forwardRef, Suspense, useCallback, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import * as THREE from 'three'

const SVG_URL = '/meolaa-logo.svg'
/** World-space width of the logo at scale = 1 (roughly matched to the old wordmark). */
const BASE_WIDTH = 6.5

function LogoMeshes({ material }) {
  const data = useLoader(SVGLoader, SVG_URL)

  const geometries = useMemo(() => {
    const raw = []
    const box = new THREE.Box3(
      new THREE.Vector3(Infinity, Infinity, 0),
      new THREE.Vector3(-Infinity, -Infinity, 0),
    )

    for (const path of data.paths) {
      for (const shape of SVGLoader.createShapes(path)) {
        const geo = new THREE.ShapeGeometry(shape)
        geo.computeBoundingBox()
        box.min.x = Math.min(box.min.x, geo.boundingBox.min.x)
        box.min.y = Math.min(box.min.y, geo.boundingBox.min.y)
        box.max.x = Math.max(box.max.x, geo.boundingBox.max.x)
        box.max.y = Math.max(box.max.y, geo.boundingBox.max.y)
        raw.push(geo)
      }
    }

    const width = box.max.x - box.min.x || 1
    const cx = (box.max.x + box.min.x) / 2
    const cy = (box.max.y + box.min.y) / 2
    const norm = BASE_WIDTH / width

    // Center on the origin and normalise so scale=1 → BASE_WIDTH wide (proportion kept).
    for (const geo of raw) geo.translate(-cx, -cy, 0)
    return { list: raw, norm }
  }, [data])

  return (
    // SVG Y points down → flip Y. Negative scale flips winding, so material is DoubleSide.
    <group scale={[geometries.norm, -geometries.norm, geometries.norm]}>
      {geometries.list.map((geo, i) => (
        <mesh key={i} geometry={geo} material={material} renderOrder={-1} frustumCulled={false} />
      ))}
    </group>
  )
}

/**
 * Meolaa wordmark behind the prism (replaces the old "FUTURE" text).
 * The scene animates `ref.position.x` (slide in) and
 * `ref.userData.material.opacity` (fade in) on scroll — so this group takes
 * NO `position` prop (React would fight GSAP for it).
 *
 * It faces the camera 1:1 (matches the camera's orientation) so the flat
 * wordmark reads perfectly straight — no perspective keystone, no tilt. The
 * camera never moves, so this never spins; rotating the prism doesn't touch it.
 */
const HeroLogo = forwardRef(function HeroLogo({ scale = 1, color = '#ffffff' }, ref) {
  const groupRef = useRef(null)

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        toneMapped: false,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    [color],
  )

  const setRefs = useCallback(
    (node) => {
      groupRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )

  useFrame(({ camera }) => {
    if (groupRef.current) groupRef.current.quaternion.copy(camera.quaternion)
  })

  return (
    <group ref={setRefs} scale={scale} userData={{ material }}>
      <Suspense fallback={null}>
        <LogoMeshes material={material} />
      </Suspense>
    </group>
  )
})

export default HeroLogo
