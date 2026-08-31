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

/** Backing-store width; height follows the artboard ratio. */
const MAX_W = 1100
const MAX_W_SMALL = 620

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

function makeParticles(count: number): P[] {
  const out: P[] = new Array(count)
  for (let i = 0; i < count; i++) {
    /* Bias density toward the track and thin it outward. */
    const dr = gauss() * 34 + gauss() * 14
    out[i] = {
      a: Math.random() * Math.PI * 2,
      dr,
      /* Inner particles orbit slightly faster — reads as depth, not a rigid disc. */
      va: (0.00028 + Math.random() * 0.0004) * (1 - dr / 900),
      b: 0.4 + Math.random() * 0.9,
      tp: Math.random() * Math.PI * 2,
      tr: 0.6 + Math.random() * 1.8,
    }
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

    const particles = makeParticles(small ? 6000 : 18000)
    const img = ctx.createImageData(w, h)
    const data = img.data

    /* Ecru core with a joyous-yellow lean — the orbit's own palette. */
    const COL = { r: 253, g: 246, b: 205 }

    const splat = (x: number, y: number, a: number) => {
      const add = (px: number, py: number, k: number) => {
        if (px < 0 || py < 0 || px >= w || py >= h) return
        const o = (py * w + px) * 4
        data[o] = Math.min(255, data[o] + COL.r * k)
        data[o + 1] = Math.min(255, data[o + 1] + COL.g * k)
        data[o + 2] = Math.min(255, data[o + 2] + COL.b * k)
        data[o + 3] = Math.min(255, data[o + 3] + 255 * k)
      }
      add(x, y, a)
      add(x + 1, y, a * 0.5)
      add(x - 1, y, a * 0.5)
      add(x, y + 1, a * 0.5)
      add(x, y - 1, a * 0.5)
    }

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

        const twinkle = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * p.tr + p.tp)
        /* Fade with distance from the track so the band has soft shoulders. */
        const falloff = Math.max(0, 1 - Math.abs(p.dr) / 68)
        const a = p.b * twinkle * falloff
        if (a <= 0.01) continue

        /*
         * Splat a small kernel rather than one pixel. A single pixel at ~1:1
         * backing scale is invisible against the dark ground; this gives each
         * mote a core plus dim neighbours, and overlapping motes accumulate.
         */
        splat(x, y, a)
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
