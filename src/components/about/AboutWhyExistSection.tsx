import { InnerPageSectionHead } from '../layout/InnerPageSectionHead'
import './AboutWhyExistSection.css'

export function AboutWhyExistSection() {
  return (
    <section className="au-why" id="why-exist" aria-label="Why we exist">
      <InnerPageSectionHead
        className="au-why__head"
        eyebrow="Why we exist"
        title="Every category has a signal waiting to become a brand. We exist to catch it first — and build faster than anyone else can follow."
        tone="on-dark"
        align="center"
      />
    </section>
  )
}
