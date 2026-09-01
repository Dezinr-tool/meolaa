/**
 * Brand Lab mark — swaps between four particle-art icons (one per
 * capability) as the accordion's active panel changes, replacing the
 * static E-mark:
 *
 *   01 Demand               → growth bars + trend arrow
 *   02 Product Development  → lightbulb
 *   03 Go-to-Market         → target + arrow
 *   04 Distribution & Ops   → hub-and-spoke network
 *
 * These are the actual reference art (not a procedural recreation — that
 * kept missing the reference's exact stipple texture/shape). The
 * "converting into shape" feel comes from the transition: a soft-edged
 * iris — the incoming icon opens outward from the center over the
 * outgoing one, like it's materializing into view, rather than a flat
 * crossfade or a busy cell-based dissolve (tried first, read as noisy
 * rather than a clean shape change).
 */
import { useEffect, useRef } from 'react'

const SOURCES = [
  '/assets/lab-particles/demand.png',
  '/assets/lab-particles/product-development.png',
  '/assets/lab-particles/go-to-market.png',
  '/assets/lab-particles/distribution-ops.png',
]

const DUR = 850

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function LabParticles({ activeIndex }: { activeIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const fromIdxRef = useRef(activeIndex)
  const toIdxRef = useRef(activeIndex)
  const tRef = useRef(1)
  const activeIndexRef = useRef(activeIndex)
  const rafRef = useRef<number>()
  const sizeRef = useRef(360)

  useEffect(() => {
    let cancelled = false

    Promise.all(SOURCES.map(loadImage)).then((imgs) => {
      if (!cancelled) imagesRef.current = imgs
    })

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const offscreen = document.createElement('canvas')
    const octx = offscreen.getContext('2d')

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      if (!canvas || !offscreen) return
      const rect = canvas.getBoundingClientRect()
      const size = Math.max(1, Math.round(rect.width))
      sizeRef.current = size
      canvas.width = size * dpr
      canvas.height = size * dpr
      offscreen.width = size * dpr
      offscreen.height = size * dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let start = 0

    function drawImageCover(
      targetCtx: CanvasRenderingContext2D,
      size: number,
      image: HTMLImageElement,
    ) {
      const iw = image.naturalWidth || 1
      const ih = image.naturalHeight || 1
      const scale = Math.max(size / iw, size / ih)
      const w = iw * scale
      const h = ih * scale
      targetCtx.drawImage(image, (size - w) / 2, (size - h) / 2, w, h)
    }

    function frame(ts: number) {
      rafRef.current = requestAnimationFrame(frame)
      const imgs = imagesRef.current
      if (!ctx || !octx || !canvas || imgs.length < SOURCES.length) return
      const size = sizeRef.current

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      const fromImg = imgs[fromIdxRef.current]
      const toImg = imgs[toIdxRef.current]

      if (tRef.current >= 1) {
        drawImageCover(ctx, size, toImg)
        return
      }

      if (!start) start = ts
      const raw = Math.min(1, (ts - start) / DUR)
      tRef.current = raw
      const e = easeInOutCubic(raw)

      // Base layer — the icon we're leaving.
      drawImageCover(ctx, size, fromImg)

      // Incoming icon, masked by a soft-edged iris opening outward from
      // the center as progress advances.
      octx.setTransform(dpr, 0, 0, dpr, 0, 0)
      octx.clearRect(0, 0, size, size)
      drawImageCover(octx, size, toImg)

      const maxR = size * 0.75
      const feather = size * 0.22
      const r = e * (maxR + feather)
      const cx = size / 2
      const cy = size / 2

      octx.globalCompositeOperation = 'destination-in'
      const grad = octx.createRadialGradient(
        cx,
        cy,
        Math.max(0, r - feather),
        cx,
        cy,
        r,
      )
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      octx.fillStyle = grad
      octx.fillRect(0, 0, size, size)
      octx.globalCompositeOperation = 'source-over'

      ctx.drawImage(offscreen, 0, 0, offscreen.width, offscreen.height, 0, 0, size, size)

      if (raw >= 1) {
        start = 0
        fromIdxRef.current = toIdxRef.current
      }
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  useEffect(() => {
    if (activeIndexRef.current === activeIndex) return
    activeIndexRef.current = activeIndex
    fromIdxRef.current = toIdxRef.current
    toIdxRef.current = activeIndex
    tRef.current = 0
  }, [activeIndex])

  return <canvas ref={canvasRef} className="meola-lab__particles" aria-hidden="true" />
}
