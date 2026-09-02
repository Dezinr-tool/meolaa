import { forwardRef, Suspense, useCallback, useEffect, useMemo, useRef } from 'react'
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

    // Shared gradient bounds (SVG space, after re-centring). The group flips Y,
    // so the *smallest* local y is the visual top → grad = 1 (white) there.
    const minY = box.min.y - cy
    const maxY = box.max.y - cy
    const span = maxY - minY || 1

    for (const geo of raw) {
      geo.translate(-cx, -cy, 0)
      const pos = geo.attributes.position
      const grad = new Float32Array(pos.count)
      for (let i = 0; i < pos.count; i++) {
        grad[i] = (maxY - pos.getY(i)) / span
      }
      geo.setAttribute('aGrad', new THREE.BufferAttribute(grad, 1))
    }

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
 * Meolaa wordmark behind the prism.
 * - Faces the camera 1:1 → reads straight, no keystone / tilt / spin.
 * - Vertical linear gradient: pure white at the top, easing into the scene
 *   background colour at the bottom for a rich fade-out.
 * - The scene animates `ref.position.x` (slide-in) and
 *   `ref.userData.material.opacity` (fade-in), so this group takes NO
 *   `position` prop and keeps a native `.opacity`.
 */
const HeroLogo = forwardRef(function HeroLogo(
  { scale = 1, bg = '#000000', top = '#ffffff' },
  ref,
) {
  const groupRef = useRef(null)
  const bgRef = useRef(bg)
  bgRef.current = bg

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      toneMapped: false,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: true,
    })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTop = { value: new THREE.Color(top) }
      shader.uniforms.uBottom = { value: new THREE.Color(bgRef.current) }
      shader.vertexShader =
        'attribute float aGrad;\nvarying float vGrad;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n  vGrad = aGrad;',
        )
      shader.fragmentShader =
        'uniform vec3 uTop;\nuniform vec3 uBottom;\nvarying float vGrad;\n' +
        shader.fragmentShader.replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
          'float g = clamp( vGrad, 0.0, 1.0 );\n' +
            'vec4 diffuseColor = vec4( mix( uBottom, uTop, g ), opacity * g );',
        )
      mat.userData.shader = shader
    }
    return mat
  }, [top])

  // Keep the gradient's bottom stop in sync with the scene background.
  useEffect(() => {
    const s = material.userData.shader
    if (s) s.uniforms.uBottom.value.set(bg)
  }, [material, bg])

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
