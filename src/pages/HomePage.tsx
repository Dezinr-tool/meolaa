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

export function HomePage() {
  return (
    <>
      {/* Portal to body; Lenis lives in App SmoothScroll — lock/unlock via getLenisInstance */}
      <Preloader />
      <div className="app app--home">
        <SiteNav variant="home" />
        <HomeAnimations />
        <main>
          <HeroSection />
          <VisionSection />
          {/* Own DOM node, not part of either pinned section — a plain
              margin/padding here gets fought by GSAP's inline pin styles
              on the sections themselves, and any gap it leaves exposes
              the page background instead of staying white. */}
          <div
            aria-hidden="true"
            style={{ height: 100, background: '#fff' }}
          />
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
