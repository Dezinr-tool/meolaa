import { gsap, ScrollTrigger } from '../../../lib/motion'

/**
 * Distinct from the Planet Blue `.hero` / `data-section="hero"` section.
 * Must match PrismDispersionSection root id.
 */
export const PRISM_TRIGGER = '#prism-dispersion'
/** @deprecated Use PRISM_TRIGGER — kept for local call sites during port. */
export const HERO_TRIGGER = PRISM_TRIGGER

/**
 * Master hero timeline (progress 0–1). ScrollTrigger drives this via
 * `animation` + scrub — never call `.play()`.
 *
 * Labels (retune positions freely; keep tween durations inside each window):
 *   entryStart       0.00  white beam in → glass
 *   dispersionStart  0.45  ribbon / spectral unfurl
 *   textReveal       0.75  MEOLAA slides in from left (+ fade)
 *   hold             0.90  settle before pin releases
 */
export function createHeroTimeline({
  entry,
  internal = null,
  ribbon,
  entryFlare,
  exitFlare,
  heroText = null,
  heroTextMaterial = null,
} = {}) {
  const tl = gsap.timeline({ paused: true })

  tl.set(entry.scale, { y: 0 })
  if (internal) tl.set(internal.scale, { y: 0 }, 0)
  tl.set(ribbon.scale, { y: 0 }, 0)
  tl.set(entryFlare.scale, { x: 0, y: 0, z: 0 }, 0)
  tl.set(exitFlare.scale, { x: 0, y: 0, z: 0 }, 0)

  if (heroText) {
    // Start well left of the prism silhouette; rest at shared origin x=0 (z stays −2)
    tl.set(heroText.position, { x: -5, y: 0 }, 0)
  }
  if (heroTextMaterial) {
    tl.set(heroTextMaterial, { opacity: 0 }, 0)
  }

  // 0% → ~45%: entry beam + contact flare
  tl.addLabel('entryStart', 0)
  tl.to(
    entry.scale,
    { y: 1, duration: 0.45, ease: 'power2.out' },
    'entryStart',
  )
  tl.to(
    entryFlare.scale,
    { x: 1, y: 1, z: 1, duration: 0.12, ease: 'back.out(2)' },
    'entryStart+=0.33',
  )

  // ~45% → ~75%: in-glass segment fills, then ribbon / exit flare
  tl.addLabel('dispersionStart', 0.45)
  if (internal) {
    tl.to(
      internal.scale,
      { y: 1, duration: 0.12, ease: 'power2.out' },
      'dispersionStart',
    )
  }
  tl.to(
    ribbon.scale,
    { y: 1, duration: 0.3, ease: 'power3.out' },
    'dispersionStart+=0.06',
  )
  tl.to(
    exitFlare.scale,
    { x: 1, y: 1, z: 1, duration: 0.18, ease: 'power2.out' },
    'dispersionStart+=0.08',
  )

  // ~75% → ~90%: MEOLAA slides behind/through the glass into center
  tl.addLabel('textReveal', 0.75)
  if (heroText) {
    tl.to(
      heroText.position,
      { x: 0, duration: 0.15, ease: 'power2.out' },
      'textReveal',
    )
  }
  if (heroTextMaterial) {
    // Fade over the first ~30% of the slide so the leading edge isn't a hard pop
    tl.to(
      heroTextMaterial,
      { opacity: 1, duration: 0.045, ease: 'power2.out' },
      'textReveal',
    )
  }

  // ~90% → 100%: hold / settle
  tl.addLabel('hold', 0.9)
  tl.to({}, { duration: 0.1 }, 'hold')

  return tl
}

/** Jump all hero targets to the fully revealed end state (reduced motion / debug). */
export function applyHeroFinalState({
  entry,
  internal = null,
  ribbon,
  entryFlare,
  exitFlare,
  heroText = null,
  heroTextMaterial = null,
} = {}) {
  if (entry) entry.scale.y = 1
  if (internal) internal.scale.y = 1
  if (ribbon) ribbon.scale.y = 1
  if (entryFlare) entryFlare.scale.setScalar(1)
  if (exitFlare) exitFlare.scale.setScalar(1)
  if (heroText) {
    heroText.position.x = 0
    heroText.position.y = 0
  }
  if (heroTextMaterial) heroTextMaterial.opacity = 1
}

/**
 * Pin + scrub the prism timeline. Lenis-smoothed scroll feeds ScrollTrigger
 * via SmoothScroll (do not create a second Lenis here).
 */
export function attachHeroScrollTrigger(timeline, { trigger = PRISM_TRIGGER } = {}) {
  return ScrollTrigger.create({
    id: 'prism-dispersion-pin',
    animation: timeline,
    trigger,
    start: 'top top',
    end: '+=200%',
    pin: true,
    scrub: 1,
    anticipatePin: 1,
  })
}

// Silence unused import if tree-shaken oddly — gsap used above via timeline API
void gsap
