import './AboutWhyExistSection.css'

/**
 * About — standalone statement fold between "The Model" reveal and the
 * pillars grid. Same slot zoox.com/about uses for its "Why we exist" copy
 * between the rider-revolution reveal and its Innovation/Sustainability/
 * Community grid — small eyebrow, one large centred line, dark ground so it
 * reads as a beat, not just another white section.
 */
export function AboutWhyExistSection() {
  return (
    <section className="au-why" aria-label="Why we exist">
      <p className="au-why__eyebrow section-head__eyebrow">Why We Exist</p>
      <p className="au-why__statement">
        Every category has a signal waiting to become a brand. We exist to
        catch it first — and build faster than anyone else can follow.
      </p>
    </section>
  )
}
