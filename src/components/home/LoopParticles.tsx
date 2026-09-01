/**
 * Loop orbit dust — a particle ring sitting on the same track as the yellow
 * orbit (artboard centre 711,629, radius 289).
 *
 * Drawn on a 2D canvas rather than a third <Canvas>: the homepage already runs
 * two WebGL contexts for the hero prism, and this is fine dust, so writing
 * pixels directly is cheaper than a GL pipeline and maps 1:1 onto the
 * artboard's coordinate space.
 *
 * The backing store is capped well under CSS size — dust does not need full
 * resolution, and clearing a full-res buffer every frame is the expensive part.
 */
import { useEffect, useRef } from 'react'
import './LoopParticles.css'

/** Artboard space — matches LoopSection's AB_W / AB_H / CX / CY / TRACK_R. */
const AB_W = 1422
const AB_H = 1117
const CX = 711
const CY = 629
const TRACK_R = 289

/**
 * Backing-store width; height follows the artboard ratio.
 *
 * Deliberately small. At ~1:1 with CSS size every mote resolved as a distinct
 * speck and the band read as noise; drawn small and scaled up, the browser's
 * bilinear filter turns each one into a soft blob and the field reads as mist.
 * The upscale is the blur — no filter pass needed.
 */
const MAX_W = 420
const MAX_W_SMALL = 260

type P = {
  /** Angle on the ring. */
  a: number
  /** Signed offset from the track radius — the band's thickness. */
  dr: number
  /** Angular velocity. */
  va: number
  /** Base brightness 0..1. */
  b: number
  /** Twinkle phase + rate. */
  tp: number
  tr: number
}

/** Gaussian-ish via summed uniforms — cheap and tight enough for a dust band. */
function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
}

/**
 * Density around the ring, 0..1. Layered sines stand in for noise — an evenly
 * populated band reads as a machined torus; the reference has dense arcs and
 * near-empty gaps, and that unevenness is most of its character.
 */
function ringDensity(angle: number) {
  const n =
    0.55 +
    0.3 * Math.sin(angle * 2.0 + 0.7) +
    0.22 * Math.sin(angle * 3.7 + 2.1) +
    0.14 * Math.sin(angle * 6.3 + 4.4)
  return Math.max(0.06, Math.min(1, n))
}

function makeParticles(count: number): P[] {
  const out: P[] = []
  let guard = 0
  while (out.length < count && guard < count * 40) {
    guard++
    const a = Math.random() * Math.PI * 2
    /* Rejection-sample against the density curve so the gaps are real gaps. */
    if (Math.random() > ringDensity(a)) continue

    /* ~8% fling well clear of the band as loose scatter. */
    const stray = Math.random() < 0.08
    const dr = stray
      ? (Math.random() < 0.5 ? -1 : 1) * (48 + Math.random() * 120)
      : gauss() * 40 + gauss() * 18

    out.push({
      a,
      dr,
      /* Inner particles orbit slightly faster — reads as depth, not a rigid disc. */
      va: (0.00022 + Math.random() * 0.00030) * (1 - dr / 900),
      b: (stray ? 0.02 + Math.random() * 0.04 : 0.035 + Math.random() * 0.085),
      tp: Math.random() * Math.PI * 2,
      /* Slow: the old 0.6–2.4 range read as flicker rather than shimmer. */
      tr: 0.1 + Math.random() * 0.26,
    })
  }
  return out
}

export function LoopParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const host = canvas.parentElement
    if (!host) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = window.matchMedia('(max-width: 900px)').matches

    const w = small ? MAX_W_SMALL : MAX_W
    const h = Math.round((w * AB_H) / AB_W)
    canvas.width = w
    canvas.height = h

    /* Artboard units → backing-store pixels. */
    const s = w / AB_W
    const cx = CX * s
    const cy = CY * s
    const r = TRACK_R * s

    const particles = makeParticles(small ? 14000 : 42000)
    const img = ctx.createImageData(w, h)
    const data = img.data

    /*
     * Planet blue. The band was ecru, which read on the old dark fold but
     * washed out completely once the section went white. Accumulation still
     * works with a dark colour: RGB stays near the target while alpha builds,
     * so overlapping motes deepen rather than brighten.
     */
    const COL = { r: 0, g: 47, b: 58 }

    let raf = 0
    let running = false
    let t = 0

    const draw = () => {
      t += 1 / 60
      data.fill(0)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (!reduced) p.a += p.va
        const rad = r + p.dr * s
        const x = (cx + Math.cos(p.a) * rad) | 0
        const y = (cy + Math.sin(p.a) * rad) | 0
        if (x < 0 || y < 0 || x >= w || y >= h) continue

        /* Shallow + slow — a gentle breath, not a strobe. */
        const twinkle = reduced ? 1 : 0.82 + 0.18 * Math.sin(t * p.tr + p.tp)
        /* Fade with distance from the track so the band has soft shoulders. */
        const falloff = Math.max(0, 1 - Math.abs(p.dr) / 130)
        const a = p.b * twinkle * falloff
        if (a <= 0.01) continue

        /*
         * One pixel, low alpha. Individually almost nothing; it is the
         * accumulation of many overlapping motes that forms the band, which is
         * what keeps it reading as a cloud instead of a scatter of dots.
         */
        const o = (y * w + x) * 4
        data[o] = Math.min(255, data[o] + COL.r * a)
        data[o + 1] = Math.min(255, data[o + 1] + COL.g * a)
        data[o + 2] = Math.min(255, data[o + 2] + COL.b * a)
        data[o + 3] = Math.min(255, data[o + 3] + 255 * a)
      }

      ctx.putImageData(img, 0, 0)
      if (running) raf = requestAnimationFrame(draw)
    }

    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(draw)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    /* Only burn frames while the fold is on screen. */
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '10% 0px' },
    )
    io.observe(host)

    /* Reduced motion still paints one static frame. */
    if (reduced) {
      draw()
      io.disconnect()
      return () => {}
    }

    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [])

  return <canvas ref={canvasRef} className="loop__particles" aria-hidden="true" />
}
