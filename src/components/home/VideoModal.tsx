/**
 * Lightbox overlay for the hero "Watch the film" CTA. Portals to
 * document.body (same pattern as Preloader), stops Lenis while open so the
 * page behind it can't scroll, and closes on Escape / backdrop click / the
 * close button.
 */
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getLenisInstance } from '../../lib/lenisInstance'
import './VideoModal.css'

type VideoModalProps = {
  open: boolean
  onClose: () => void
  src: string
  poster?: string
}

export function VideoModal({ open, onClose, src, poster }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!open) return

    getLenisInstance()?.stop()
    document.body.classList.add('video-modal-open')

    // Fire-and-forget: play() can reject (autoplay policy, fast close), and
    // that's fine — the video still has controls if it doesn't autoplay.
    videoRef.current?.play().catch(() => {})

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('video-modal-open')
      getLenisInstance()?.start()
      videoRef.current?.pause()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="video-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Meolaa film"
      onClick={onClose}
    >
      <div className="video-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button
          className="video-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Close video"
        >
          ✕
        </button>
        <video
          ref={videoRef}
          className="video-modal__video"
          src={src}
          poster={poster}
          controls
          playsInline
          autoPlay
        />
      </div>
    </div>,
    document.body,
  )
}
