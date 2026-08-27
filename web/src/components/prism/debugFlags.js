/**
 * Temporary prism-section debug switches.
 * Flip these back when shape / beam positioning is done.
 */

/**
 * Pause ScrollTrigger pin/scrub (`prism-dispersion-pin`).
 * The pin currently has no animation to drive (dispersion beams were removed
 * from this section). Left paused rather than deleted so it can be repurposed
 * (e.g. logo reveal) without recreating the ScrollTrigger wiring.
 */
export const PAUSE_SCROLL_PIN = true

/**
 * @deprecated Dispersion lights were removed from this section.
 * Always true now; kept so older call sites don't break.
 */
export const PAUSE_LIGHT_ANIMATION = true

/**
 * @deprecated Use PAUSE_SCROLL_PIN.
 * True only when both are paused.
 */
export const PAUSE_LIGHT_AND_SCROLL =
  PAUSE_LIGHT_ANIMATION && PAUSE_SCROLL_PIN

/**
 * Section + WebGL clear color.
 * `null` = production near-black (matches the prism-old FUTURE reference).
 */
export const PRISM_SECTION_BG = null
