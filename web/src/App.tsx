/**
 * Meolaa React homepage — prism dispersion → pyramid stage → Planet Blue hero + Lenis/GSAP.
 */
import { Preloader } from './components/Preloader'
import { SmoothScroll } from './components/SmoothScroll'
import { SiteNav } from './components/SiteNav'
import { HomeAnimations } from './components/home/HomeAnimations'
import { PrismDispersionSection } from './components/prism/PrismDispersionSection'
import { PyramidHeroSection } from './components/home/PyramidHeroSection'
import {
  FoundingSection,
  HeroSection,
  InvestorsSection,
  LabSection,
  MetricsSection,
  LoopSection,
  PortfolioSection,
  PressSection,
  SiteFooter,
  VisionSection,
  WhereNextSection,
} from './components/home/HomeSections'
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
            <PrismDispersionSection />
            <PyramidHeroSection />
            <HeroSection />
            <VisionSection />
            <LoopSection />
            <LabSection />
            <FoundingSection />
            <PortfolioSection />
            <MetricsSection />
            <InvestorsSection />
            <PressSection />
            <WhereNextSection />
          </main>
          <SiteFooter />
        </div>
      </SmoothScroll>
    </>
  )
}

export default App
