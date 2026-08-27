/**
 * Temporary prism-section debug switches.
 * Flip these back when shape / beam positioning is done.
 */

/** Pause VolumetricBeam / DispersionRibbon / ContactFlare / entry beam. */
export const PAUSE_LIGHT_ANIMATION = false

/** Pause ScrollTrigger pin/scrub (`prism-dispersion-pin`). */
export const PAUSE_SCROLL_PIN = true

/**
 * @deprecated Use PAUSE_LIGHT_ANIMATION + PAUSE_SCROLL_PIN.
 * True only when both are paused.
 */
export const PAUSE_LIGHT_AND_SCROLL =
  PAUSE_LIGHT_ANIMATION && PAUSE_SCROLL_PIN

/**
 * Section + WebGL clear color while positioning.
 * Dark neutral gray — enough contrast for bloom/beams without white blowout.
 * Set to `null` to restore the production near-black look.
 */
export const PRISM_SECTION_BG = '#1e1e1e'
