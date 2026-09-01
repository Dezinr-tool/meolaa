/** Viewport radius that fully covers corners from bottom-center origin. */
export function footerCircleClipEnd(): string {
  const r = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight))
  return `circle(${r}px at 50% 100%)`
}

export const FOOTER_CIRCLE_CLIP_START = 'circle(0% at 50% 100%)'
