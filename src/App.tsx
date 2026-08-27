/**
 * Meolaa React homepage — photo hero on Planet Blue + prototype sections + Lenis/GSAP.
 */
import { Preloader } from './components/Preloader'
import { SmoothScroll } from './components/SmoothScroll'
import { SiteNav } from './components/SiteNav'
import { SectionErrorBoundary } from './components/SectionErrorBoundary'
import { HomeAnimations } from './components/home/HomeAnimations'
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
} from './components/home/HomeSections'
import { SiteFooter } from './components/home/SiteFooter'
import './App.css'

/** Temporarily hide the scroll arrow motif (float + scroll momentum). Flip to `true` to restore. */
const SHOW_SCROLL_ARROW = false

function App() {
  return (
    <>
      {/* Outside SmoothScroll / portal target — must not block app mount */}
      <Preloader />
      <SmoothScroll>
        <div className="app app--home">
          <SiteNav />
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
      </SmoothScroll>
    </>
  )
}

export default App
