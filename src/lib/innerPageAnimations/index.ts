export {
  initAboutRoadmap,
  initMissionVision,
  initPillars,
} from './about'
export { initStoryRail, initStoryHero } from './story'
export { initLabPlatform } from './lab'
export { initCareersLifeFlow } from './careers'
export { waitForScroller, refreshScrollTriggers } from './shared'

import { initAboutRoadmap, initMissionVision, initPillars } from './about'
import { initCareersLifeFlow } from './careers'
import { initLabPlatform } from './lab'
import { initStoryHero, initStoryRail } from './story'
import { refreshScrollTriggers, waitForScroller } from './shared'

/** Boot all inner-page scroll animations present in the DOM. */
export function initInnerPageAnimations(): () => void {
  const disposers: (() => void)[] = []

  disposers.push(initAboutRoadmap())
  disposers.push(initMissionVision())
  disposers.push(initPillars())
  disposers.push(initStoryRail())
  disposers.push(initStoryHero())
  disposers.push(initLabPlatform())
  disposers.push(initCareersLifeFlow())

  refreshScrollTriggers()

  return () => {
    disposers.forEach((dispose) => dispose())
  }
}

/** Wait for Lenis (or reduced-motion) then init; returns full cleanup. */
export function mountInnerPageAnimations(): () => void {
  let disposeAnimations: (() => void) | null = null
  const cancelWait = waitForScroller(() => {
    disposeAnimations = initInnerPageAnimations()
  })

  return () => {
    cancelWait()
    disposeAnimations?.()
  }
}
