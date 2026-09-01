/** Viewport radius that fully covers corners from bottom-center origin. */
export function footerCircleClipEnd(): string {
  const r = footerCircleRadiusPx()
  return `circle(${r}px at 50% 100%)`
}

/** Min height for the clip-path element — must fit the full end radius. */
export function footerCircleMinHeightPx(): number {
  return footerCircleRadiusPx()
}

function footerCircleRadiusPx(): number {
  return Math.ceil(Math.hypot(window.innerWidth, window.innerHeight))
}

export const FOOTER_CIRCLE_CLIP_START = 'circle(0.5% at 50% 100%)'
