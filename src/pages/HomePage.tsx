/**
 * Meolaa React homepage — photo hero on Planet Blue + prototype sections + Lenis/GSAP.
 */
import { Preloader } from '../components/Preloader'
import { SiteNav } from '../components/SiteNav'
import { SectionErrorBoundary } from '../components/SectionErrorBoundary'
import { HomeAnimations } from '../components/home/HomeAnimations'
import {
  FoundingSection,
  HeroSection,
  InvestorsSection,
  LabSection,
  MetricsSection,
  LoopSection,
  PortfolioSection,
  PressSection,
  VisionSection,
} from '../components/home/HomeSections'
import { SiteFooter } from '../components/home/SiteFooter'
import '../App.css'

/** Scroll arrow motif — sits above the hero prism, travels into Vision on scroll. */
const SHOW_SCROLL_ARROW = true

export function HomePage() {
  return (
    <>
      {/* Portal to body; Lenis lives in App SmoothScroll — lock/unlock via getLenisInstance */}
      <Preloader />
      <div className="app app--home">
        <SiteNav variant="home" />
        {SHOW_SCROLL_ARROW ? (
          <div id="arrow" className="arrow" aria-hidden="true">
            <div className="arrow__float">
              <div className="arrow__shape" />
            </div>
          </div>
        ) : null}
        <HomeAnimations />
        <main>
          <HeroSection />
          <VisionSection />
          <LoopSection />
          <LabSection />
          <FoundingSection />
          <PortfolioSection />
          <MetricsSection />
          <InvestorsSection />
          <SectionErrorBoundary name="Press">
            <PressSection />
          </SectionErrorBoundary>
        </main>
        <SiteFooter />
      </div>
    </>
  )
}
