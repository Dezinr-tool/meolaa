import { createElement, useMemo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Billboard } from '@react-three/drei'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import * as THREE from 'three'
import {
  MeolaaLogoMark,
  MEOLAA_LOGO_VIEWBOX,
} from '../brand/MeolaaLogoMark'
import { PRISM_CAMERA_POSITION } from './constants/prism'

/**
 * Bright white — luminous source for MeshTransmissionMaterial (matches
 * prism-old HeroText, not the preloader ecru).
 */
const LOGO_FILL = '#ffffff'

const [VB_X, VB_Y, VB_W, VB_H] = MEOLAA_LOGO_VIEWBOX.split(' ').map(Number)

/**
 * Wide enough that outer letters sit outside the pyramid silhouette, but
 * still fully in frame at the current camera.
 */
const LOGO_WIDTH = 8.2

/** Distance behind the origin along the camera look-ray (away from lens). */
const LOGO_BEHIND = 1.55

/**
 * Center the wordmark on the look axis so L/R project symmetrically in NDC.
 * Mild −Y so the wider mid-body of the pyramid crosses the letter midline.
 */
function positionOnLookAxis(behind = LOGO_BEHIND) {
  const along = new THREE.Vector3(...PRISM_CAMERA_POSITION)
    .normalize()
    .multiplyScalar(-behind)
  const toCam = new THREE.Vector3(...PRISM_CAMERA_POSITION).normalize()
  const viewUp = new THREE.Vector3(0, 1, 0)
    .addScaledVector(toCam, -new THREE.Vector3(0, 1, 0).dot(toCam))
    .normalize()
  along.addScaledVector(viewUp, -0.12)
  return along.toArray()
}

const DEFAULT_POSITION = positionOnLookAxis()

function logoSvgMarkup() {
  const markup = renderToStaticMarkup(
    createElement(MeolaaLogoMark, { fill: LOGO_FILL }),
  )
  return markup.replaceAll('<path ', `<path fill="${LOGO_FILL}" `)
}

/**
 * Camera-facing Meolaa wordmark behind the pyramid so MeshTransmissionMaterial
 * refracts it. Same letter paths as the preloader via MeolaaLogoMark.
 */
export default function HeroLogo({
  position = DEFAULT_POSITION,
  width = LOGO_WIDTH,
}) {
  const shapes = useMemo(() => {
    const data = new SVGLoader().parse(logoSvgMarkup())
    return data.paths.flatMap((path) => path.toShapes())
  }, [])

  const scale = width / VB_W
  const cx = VB_X + VB_W / 2
  const cy = VB_Y + VB_H / 2

  return (
    <Billboard follow position={position}>
      <group scale={[scale, scale, scale]}>
        <group position={[-cx, cy, 0]} scale={[1, -1, 1]}>
          {shapes.map((shape, i) => (
            <mesh key={i} renderOrder={-1} frustumCulled={false}>
              <shapeGeometry args={[shape]} />
              <meshBasicMaterial
                color={LOGO_FILL}
                toneMapped={false}
                side={THREE.DoubleSide}
                depthWrite
              />
            </mesh>
          ))}
        </group>
      </group>
    </Billboard>
  )
}
