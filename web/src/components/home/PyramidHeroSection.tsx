import { HeroPrism } from '../hero/HeroPrism'
import '../prism/PrismDispersionSection.css'

/**
 * Unused approximate-pyramid R3F stage (HeroPrism / PrismScene), mounted as its
 * own fold below the physics dispersion section. Kept separate — not merged.
 */
export function PyramidHeroSection() {
  return (
    <section
      id="pyramid-hero"
      className="pyramid-hero"
      data-section="pyramid-hero"
      aria-hidden="true"
    >
      <HeroPrism />
    </section>
  )
}
