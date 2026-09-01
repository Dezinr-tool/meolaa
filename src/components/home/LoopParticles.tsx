/**
 * Loop scene — Three.js ring + terrain, ported from the reference
 * particle-scene prototype (orbiting dust torus + flowing dune terrain,
 * same particle counts, same noise math, same camera). One shared canvas —
 * two side-by-side WebGL contexts (ring + terrain each on their own canvas)
 * blacked out the whole section in testing, so both live in one scene here.
 *
 * The canvas is full-bleed to the section (not boxed to the orbit artboard)
 * so the terrain reaches both edges the way the prototype's own
 * full-viewport wrap did. To keep the ring's pixel size matching the
 * artboard-scoped yellow track (which didn't move), the camera's vertical
 * FOV is corrected each resize by the ratio of the full canvas height to
 * the artboard's height — see `fovForHeight` below.
 *
 * Scroll progress is read off this section's own position in the page's
 * normal scroll, since the prototype's own nested `#scroller` doesn't fit
 * into the site.
 */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createDustSprite } from './loopDustSprite'
import './LoopParticles.css'

function noise2(x: number, y: number) {
  return (
    Math.sin(x * 1.0 + y * 0.7) * 0.5 +
    Math.sin(x * 2.1 - y * 1.3 + 1.7) * 0.25 +
    Math.sin(x * 3.7 + y * 2.6 + 4.1) * 0.15 +
    Math.sin(x * 0.5 - y * 0.4 + 2.3) * 0.35
  )
}

const MAIN_R = 150
const TUBE_R = 26
const RING_MAX_OPACITY = 0.8
/* Whole-ring rigid rotation, on top of each mote's own drift below — kept
   at 0 so the ring doesn't visibly spin as a unit on every scroll/idle tick.
   The individual per-mote revolve/wobble motion still gives it life. */
const RING_IDLE_SPIN = 0
const SCROLL_SPIN_TOTAL = 0
const BASE_FOV = 45

type RingSeed = {
  theta: number
  phi: number
  rJitter: number
  revolveSpeed: number
  speed: number
  wob: number
  wobSpeed: number
  wobAmp: number
  /** Fixed per-mote scatter direction — hover push flings each mote along
      its own direction instead of radially from the cursor, which read as
      the ring's silhouette smoothly deforming ("liquid") rather than dust
      scattering. */
  scatterX: number
  scatterY: number
  /** This mote's threshold in the scroll-driven reveal (0..1) — only
      consulted for inner-band motes (see isInner); outer motes ignore it
      and stay always visible. */
  revealAt: number
  /** True for the tight, bright band riding the ring's INNER edge — this
      is the layer that's sparse by default and fills in on scroll (see
      reference: a loose outer scatter that's always there, and a denser
      bright inner rim that builds up). Outer motes are unaffected by
      reveal and stay visible always. */
  isInner: boolean
}

/**
 * Density around the ring, 0..1 — an evenly populated band reads as a
 * machined torus; layered sines give it dense arcs and thin gaps instead,
 * so the ring looks like a naturally uneven scatter of dust rather than a
 * perfect uniform circle.
 */
function ringDensity(angle: number) {
  const n =
    0.55 +
    0.3 * Math.sin(angle * 2.0 + 0.7) +
    0.22 * Math.sin(angle * 3.7 + 2.1) +
    0.14 * Math.sin(angle * 6.3 + 4.4)
  return Math.max(0.15, Math.min(1, n))
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** Vertical FOV that keeps a fixed-depth object's pixel size constant as canvas height changes from `baseH`. */
function fovForHeight(canvasH: number, baseH: number) {
  if (baseH <= 0) return BASE_FOV
  const halfBase = (BASE_FOV * Math.PI) / 360
  const halfNew = Math.atan(Math.tan(halfBase) * (canvasH / baseH))
  return (halfNew * 360) / Math.PI
}

export function LoopParticles() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const section = host.closest('[data-section="loop"]') as HTMLElement | null
    const artboard = section?.querySelector('.loop__artboard') as HTMLElement | null

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 900px)').matches
    const RING_COUNT = small ? 6000 : 13000
    const GRID_X = small ? 200 : 320
    const GRID_Z = small ? 92 : 156
    const SPACING = 6.36

    let W = host.clientWidth
    let H = host.clientHeight

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0xffffff, 0.0011)

    const camera = new THREE.PerspectiveCamera(BASE_FOV, W / H, 1, 4000)
    camera.position.set(0, 40, 720)
    camera.lookAt(0, 60, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0xffffff, 1)
    host.appendChild(renderer.domElement)

    const sprite = createDustSprite()

    /* ================= RING ================= */
    const ringGroup = new THREE.Group()
    ringGroup.position.set(0, -10, -40)
    scene.add(ringGroup)

    const ringGeo = new THREE.BufferGeometry()
    const ringPos = new Float32Array(RING_COUNT * 3)
    const ringData: RingSeed[] = []

    /* Two populations sharing the RING_COUNT budget, matching the
       reference: a loose OUTER scatter (always fully visible) and a
       tight, bright INNER rim that's sparse by default and fills in on
       scroll. */
    const INNER_COUNT = Math.round(RING_COUNT * 0.42)
    const OUTER_COUNT = RING_COUNT - INNER_COUNT

    /* Sweep starts at "point one" (Build, bottom-left dot) rather than an
       arbitrary theta=0. Derived from the live DOM: the Build/Run/Signal
       dots' on-screen angles were measured (circumcenter fit) and mapped
       through this scene's screen↔theta relationship — screenAngle ≈ -theta
       (perspective camera looks near-straight-on along Z, so world Y-up
       flips to screen Y-down and world/screen X match). Build measured at
       ~154.9° on screen ⇒ theta ≈ 360 - 154.9 ≈ 205°. */
    const SWEEP_START_ANGLE = (205 * Math.PI) / 180

    function makeRevealAt(theta: number) {
      /* Ordered by angular position, starting from SWEEP_START_ANGLE (with
         a little jitter so it isn't a perfectly mechanical sweep) instead
         of pure random — motes fill in going around the ring starting at
         Build, reading as a connected flow building up from point one. */
      const rel =
        ((SWEEP_START_ANGLE - theta + Math.PI * 2) % (Math.PI * 2)) /
        (Math.PI * 2)
      return Math.max(0, Math.min(1, rel + (Math.random() - 0.5) * 0.06))
    }

    {
      let guard = 0
      while (ringData.length < OUTER_COUNT && guard < OUTER_COUNT * 40) {
        guard++
        const theta = Math.random() * Math.PI * 2
        /* Rejection-sample against the density curve so the gaps are real gaps. */
        if (Math.random() > ringDensity(theta)) continue

        const phi = Math.random() * Math.PI * 2
        const rJitter = TUBE_R * (0.55 + Math.random() * 0.5)
        const scatterAngle = Math.random() * Math.PI * 2
        ringData.push({
          theta,
          phi,
          rJitter,
          /* Was 0.12–0.16 rad/s — every mote slowly orbiting independently
             still reads as "the ring is spinning" even with the whole-ring
             RING_IDLE_SPIN at 0. Zeroed so the ring is genuinely static
             apart from wobble/hover/reveal. */
          revolveSpeed: 0,
          speed: 0.15 + Math.random() * 0.25,
          wob: Math.random() * Math.PI * 2,
          wobSpeed: 0.4 + Math.random() * 0.6,
          wobAmp: 1.5 + Math.random() * 3.5,
          scatterX: Math.cos(scatterAngle),
          scatterY: Math.sin(scatterAngle),
          revealAt: makeRevealAt(theta),
          isInner: false,
        })
      }
      /* Rejection sampling can fall a little short of OUTER_COUNT — pad
         with uniform fallbacks so the buffer sizes below stay exact. */
      while (ringData.length < OUTER_COUNT) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.random() * Math.PI * 2
        const scatterAngle = Math.random() * Math.PI * 2
        ringData.push({
          theta,
          phi,
          rJitter: TUBE_R * (0.55 + Math.random() * 0.5),
          revolveSpeed: 0,
          speed: 0.15 + Math.random() * 0.25,
          wob: Math.random() * Math.PI * 2,
          wobSpeed: 0.4 + Math.random() * 0.6,
          wobAmp: 1.5 + Math.random() * 3.5,
          scatterX: Math.cos(scatterAngle),
          scatterY: Math.sin(scatterAngle),
          revealAt: makeRevealAt(theta),
          isInner: false,
        })
      }

      /* Inner rim — tight radius (rJitter kept small so it hugs the
         torus's own inner edge instead of spreading across the tube),
         sparse by default (see REVEAL_START_INNER below), builds up on
         scroll. */
      while (ringData.length < RING_COUNT) {
        const theta = Math.random() * Math.PI * 2
        if (Math.random() > ringDensity(theta)) continue
        const phi = Math.PI + (Math.random() - 0.5) * 0.5 // hugs the inner wall (cos(phi) ≈ -1)
        const rJitter = TUBE_R * (0.08 + Math.random() * 0.14)
        const scatterAngle = Math.random() * Math.PI * 2
        ringData.push({
          theta,
          phi,
          rJitter,
          revolveSpeed: 0,
          speed: 0.15 + Math.random() * 0.25,
          wob: Math.random() * Math.PI * 2,
          wobSpeed: 0.4 + Math.random() * 0.6,
          wobAmp: 0.6 + Math.random() * 1.2,
          scatterX: Math.cos(scatterAngle),
          scatterY: Math.sin(scatterAngle),
          revealAt: makeRevealAt(theta),
          isInner: true,
        })
      }
    }

    /* Single color — black — brightness jittered per-particle so the ring
       keeps dust-like depth. */
    const RING_BASE_COLOR = new THREE.Color(0x000000)
    const ringColors = new Float32Array(RING_COUNT * 3)
    for (let i = 0; i < RING_COUNT; i++) {
      /* Inner-rim motes read darker/more saturated (denser, more prominent
         per the reference) than the loose outer scatter. */
      const b = ringData[i].isInner
        ? 0.82 + Math.random() * 0.18
        : 0.4 + Math.random() * 0.4
      ringColors[i * 3] = RING_BASE_COLOR.r * b
      ringColors[i * 3 + 1] = RING_BASE_COLOR.g * b
      ringColors[i * 3 + 2] = RING_BASE_COLOR.b * b
    }

    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))
    ringGeo.setAttribute('color', new THREE.BufferAttribute(ringColors, 3))

    const ringMat = new THREE.PointsMaterial({
      size: 3.0,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    })

    const ringPoints = new THREE.Points(ringGeo, ringMat)
    ringGroup.add(ringPoints)

    /* Hover — motes near the cursor scatter outward (no color change, or the
       dense motes near the cursor read as invisible against the ground).
       Radius/push are in the same local units as MAIN_R/TUBE_R (ring) and
       grid spacing (terrain), not pixels. */
    const RING_HOVER_R = 130
    const RING_HOVER_PUSH = 85
    const ringBaseColor = new THREE.Color()

    /* Scroll-driven fill — sparse by default, then fills in clockwise as
       you scroll through the pin (ordered by angle — see revealAt above),
       so it reads as connectivity establishing itself around the ring
       rather than the full count just being there or particles randomly
       blinking on. */
    /* Outer scatter (isInner: false) is always fully visible — hiding a
       chunk of it by default killed the section's whole feel ("poora zero
       kar diya"). Only the tight inner rim (isInner: true) is sparse by
       default and fills in on scroll, matching the reference: a loose
       outer halo that's always there, and a denser bright inner ring
       that builds up as you scroll. */
    const REVEAL_START_INNER = 0
    const REVEAL_END_INNER = 1

    function updateRing(
      t: number,
      scrollProgress: number,
      hover: THREE.Vector3 | null,
    ) {
      const pos = ringGeo.attributes.position.array as Float32Array
      const col = ringGeo.attributes.color.array as Float32Array
      const spin = -(t * RING_IDLE_SPIN + scrollProgress * SCROLL_SPIN_TOTAL)
      const innerRevealFrac =
        REVEAL_START_INNER +
        (REVEAL_END_INNER - REVEAL_START_INNER) * smoothstep(0, 1, scrollProgress)
      for (let i = 0; i < RING_COUNT; i++) {
        const d = ringData[i]
        if (d.isInner && d.revealAt > innerRevealFrac) {
          const c = i * 3
          pos[c] = 1e6
          pos[c + 1] = 1e6
          pos[c + 2] = 1e6
          continue
        }
        const theta = d.theta - t * d.revolveSpeed
        const phi = d.phi + t * d.speed
        const wobble = Math.sin(t * d.wobSpeed + d.wob) * d.wobAmp
        const tubeR = d.rJitter + wobble
        const rad = MAIN_R + tubeR * Math.cos(phi)

        let x = rad * Math.cos(theta)
        let y = rad * Math.sin(theta)
        const z = tubeR * Math.sin(phi)

        const c = i * 3
        ringBaseColor.setRGB(ringColors[c], ringColors[c + 1], ringColors[c + 2])

        if (hover) {
          /* `hover` already arrives in the ring's local (pre-spin) frame —
             see `ringGroup.worldToLocal` at the call site — so it compares
             directly against these particle coordinates.
             Each mote flings along its OWN fixed scatter direction (not
             radially away from the cursor) — a radial push smoothly bulges
             the ring's silhouette outward, which read as the shape
             deforming ("liquid") rather than dust scattering apart. */
          const dx = x - hover.x
          const dy = y - hover.y
          const dz = z - hover.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < RING_HOVER_R) {
            const f = 1 - dist / RING_HOVER_R
            const push = f * f * RING_HOVER_PUSH
            x += d.scatterX * push
            y += d.scatterY * push
          }
        }

        pos[i * 3] = x
        pos[i * 3 + 1] = y
        pos[i * 3 + 2] = z
        col[c] = ringBaseColor.r
        col[c + 1] = ringBaseColor.g
        col[c + 2] = ringBaseColor.b
      }
      ringGeo.attributes.position.needsUpdate = true
      ringGeo.attributes.color.needsUpdate = true
      ringGroup.rotation.z = spin
    }

    /* Small bright accent particle above the ring. */
    const dotGeo = new THREE.BufferGeometry()
    dotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3))
    const dotMat = new THREE.PointsMaterial({
      size: 6,
      map: sprite,
      color: 0x000000,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })
    const dot = new THREE.Points(dotGeo, dotMat)
    dot.position.set(0, 160, -40)
    scene.add(dot)

    /* ================= TERRAIN ================= */
    const terrainCount = GRID_X * GRID_Z
    const terrainGeo = new THREE.BufferGeometry()
    const terrainPos = new Float32Array(terrainCount * 3)
    const terrainColor = new Float32Array(terrainCount * 3)
    const basePos: [number, number][] = []

    /* Single brand color (Secondary — Ecru Deep #f0d5cc) — distinct from
       the black ring so the two fields don't merge visually. */
    const TERRAIN_BASE_COLOR = new THREE.Color(0xf0d5cc)

    let idx = 0
    for (let ix = 0; ix < GRID_X; ix++) {
      for (let iz = 0; iz < GRID_Z; iz++) {
        const x = (ix - GRID_X / 2) * SPACING + (Math.random() - 0.5) * SPACING * 0.6
        const z = iz * SPACING + (Math.random() - 0.5) * SPACING * 0.6
        basePos.push([x, z])
        terrainPos[idx * 3] = x
        terrainPos[idx * 3 + 1] = 0
        terrainPos[idx * 3 + 2] = z
        idx++
      }
    }

    terrainGeo.setAttribute('position', new THREE.BufferAttribute(terrainPos, 3))
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(terrainColor, 3))

    const terrainMat = new THREE.PointsMaterial({
      size: 4.4,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    })

    const terrainPoints = new THREE.Points(terrainGeo, terrainMat)
    terrainPoints.position.set(0, -150, -260)
    scene.add(terrainPoints)

    /* Highlight cap stays a pale neutral, not pure white — noise peaks get
       lit without turning the field into white space. */
    const cHi = new THREE.Color(0xf8ece4)
    const TERRAIN_DARK_MUL = 0.32

    const terrainDark = new THREE.Color()
    const terrainMixed = new THREE.Color()
    const terrainWithHi = new THREE.Color()

    /* No hover interaction here on purpose — the ring's hover scatter and
       the terrain's own flowing noise fought each other and read as an odd,
       inconsistent effect. Hover stays on the ring only. */
    function updateTerrain(t: number) {
      const pos = terrainGeo.attributes.position.array as Float32Array
      const col = terrainGeo.attributes.color.array as Float32Array
      for (let i = 0; i < terrainCount; i++) {
        const [bx, bz] = basePos[i]
        const n = noise2(bx * 0.012 + t * 0.22, bz * 0.02 - t * 0.13)
        const hgt = n * 26 + Math.sin(bz * 0.05 + t * 0.4) * 4

        const shade = (n + 1) / 2

        pos[i * 3] = bx
        pos[i * 3 + 1] = hgt
        pos[i * 3 + 2] = bz

        terrainDark.copy(TERRAIN_BASE_COLOR).multiplyScalar(TERRAIN_DARK_MUL)
        terrainMixed.copy(terrainDark).lerp(TERRAIN_BASE_COLOR, Math.min(1, shade * 1.3))
        terrainWithHi.copy(terrainMixed).lerp(cHi, Math.max(0, shade - 0.75) * 2.5)

        col[i * 3] = terrainWithHi.r
        col[i * 3 + 1] = terrainWithHi.g
        col[i * 3 + 2] = terrainWithHi.b
      }
      terrainGeo.attributes.position.needsUpdate = true
      terrainGeo.attributes.color.needsUpdate = true
    }

    /* ================= SCROLL PROGRESS ================= */
    let scrollProgress = 0

    /* While the section is pinned, its own getBoundingClientRect().top sits
       at ~0 for the entire pin duration (that's what pinning means), so a
       progress read off the SECTION never moves during the pin — which is
       most of the scroll range the ring reveal/step activation happens
       across. Read it off the GSAP pin-spacer instead: its extra height
       *is* the pin's scroll distance, so how far we've scrolled through it
       gives the true 0..1 pin progress regardless of the section being
       visually fixed. */
    const readScrollProgress = () => {
      if (!section) return
      const spacer = section.closest('.pin-spacer') as HTMLElement | null
      if (spacer) {
        const spacerRect = spacer.getBoundingClientRect()
        const total = spacerRect.height - window.innerHeight
        if (total > 0) {
          scrollProgress = Math.min(1, Math.max(0, -spacerRect.top / total))
          return
        }
      }
      const rect = section.getBoundingClientRect()
      const span = rect.height + window.innerHeight
      const raw = (window.innerHeight - rect.top) / span
      scrollProgress = Math.min(1, Math.max(0, raw))
    }
    readScrollProgress()

    let scrollTicking = false
    const onScroll = () => {
      if (scrollTicking) return
      scrollTicking = true
      requestAnimationFrame(() => {
        readScrollProgress()
        scrollTicking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    /*
     * ================= POINTER HOVER =================
     * `host` is `pointer-events: none` on purpose — the canvas sits full-bleed
     * over the section and must never block clicks on real content above it.
     * That also means it never receives pointer events itself, so this
     * listens on the window instead and does its own bounds check against
     * the host's rect (a host-scoped listener would just never fire).
     */
    const pointerNDC = new THREE.Vector2()
    let pointerActive = false
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      if (!inside) {
        pointerActive = false
        return
      }
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      pointerActive = true
    }
    if (!coarsePointer && !reduced) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
    }

    const unprojectVec = new THREE.Vector3()
    const rayDir = new THREE.Vector3()
    /** World-space point where the cursor ray crosses the plane z = targetZ. */
    function pointerWorldAt(targetZ: number): THREE.Vector3 | null {
      if (!pointerActive) return null
      unprojectVec.set(pointerNDC.x, pointerNDC.y, 0.5).unproject(camera)
      rayDir.copy(unprojectVec).sub(camera.position).normalize()
      if (Math.abs(rayDir.z) < 1e-6) return null
      const dist = (targetZ - camera.position.z) / rayDir.z
      if (dist <= 0) return null
      return camera.position.clone().addScaledVector(rayDir, dist)
    }

    const ringHoverLocal = new THREE.Vector3()

    /* ================= ANIMATE ================= */

    const clock = new THREE.Clock()
    let raf = 0
    let running = false

    /*
     * A resize (canvas.width/height write) clears the GL buffer. If the rAF
     * loop is paused at that moment — e.g. the IntersectionObserver dropped
     * this host briefly during the pin's own layout churn — nothing repaints
     * the clear, leaving the canvas blank until the next scroll/visibility
     * event. Every caller of a size/state change should follow it with one
     * of these so the canvas is never left showing a bare clear.
     */
    const renderFrame = () => {
      const t = reduced ? 0 : clock.getElapsedTime()

      const ringWorldHover = pointerWorldAt(ringGroup.position.z)
      const ringHover = ringWorldHover
        ? ringGroup.worldToLocal(ringHoverLocal.copy(ringWorldHover))
        : null

      updateRing(t, scrollProgress, ringHover)
      updateTerrain(t)

      /* Ring is fully visible from the moment this section lands — only the
         inner bright band's density still grows with scroll (handled in
         updateRing). This used to fade the whole ring in from 0 over the
         first 30% of the pin, so it read as "missing" on landing. */
      const ringReveal = 1
      ringMat.opacity = ringReveal * RING_MAX_OPACITY
      dot.material.opacity = ringReveal * (0.6 + Math.sin(t * 1.6) * 0.35)
      dot.position.y = 160 + Math.sin(t * 0.5) * 6

      renderer.render(scene, camera)
    }

    const animate = () => {
      raf = requestAnimationFrame(animate)
      renderFrame()
    }

    const start = () => {
      if (running) return
      running = true
      clock.start()
      raf = requestAnimationFrame(animate)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '10% 0px' },
    )
    io.observe(host)

    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    const onResize = () => {
      W = host.clientWidth
      H = host.clientHeight
      camera.aspect = W / H
      camera.fov = fovForHeight(H, artboard?.clientHeight ?? H)
      camera.updateProjectionMatrix()
      renderer.setSize(W, H)
      renderFrame()
    }
    onResize()
    window.addEventListener('resize', onResize)

    /*
     * GSAP's pin/unpin doesn't fire a window `resize` event, but it does
     * change this host's own box (e.g. once the pin-spacer collapses at the
     * end of the scroll range) — catch that directly instead of relying on
     * window resize alone, or the canvas can end up cleared-but-unpainted.
     */
    const ro = new ResizeObserver(() => onResize())
    ro.observe(host)

    /* Re-render on context restore — a lost context also clears the buffer. */
    const onContextRestored = () => renderFrame()
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      ro.disconnect()
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
      cancelAnimationFrame(raf)
      renderer.dispose()
      ringGeo.dispose()
      ringMat.dispose()
      dotGeo.dispose()
      dotMat.dispose()
      terrainGeo.dispose()
      terrainMat.dispose()
      sprite.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={hostRef} className="loop__particles" aria-hidden="true" />
}
