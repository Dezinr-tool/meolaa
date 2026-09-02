export {
  initAboutFold1Intro,
  initAboutLoop,
  initAboutRoadmap,
  initMissionVision,
  initPillars,
} from './about'
export { initStoryRail, initStoryHero } from './story'
export { initLabPlatform } from './lab'
export { initCareersLifeFlow } from './careers'
export { waitForScroller, refreshScrollTriggers } from './shared'

import {
  initAboutFold1Intro,
  initAboutLoop,
  initAboutRoadmap,
  initMissionVision,
  initPillars,
} from './about'
import { initCareersLifeFlow } from './careers'
import { initLabPlatform } from './lab'
import { initStoryHero, initStoryRail } from './story'
import { refreshScrollTriggers, waitForScroller } from './shared'

function safeInit(name: string, init: () => () => void): () => void {
  try {
    return init()
  } catch (err) {
    console.warn(`[inner-pages] ${name} failed:`, err)
    return () => {}
  }
}

/** Boot all inner-page scroll animations present in the DOM. */
export function initInnerPageAnimations(): () => void {
  const disposers: (() => void)[] = []

  disposers.push(safeInit('aboutFold1Intro', initAboutFold1Intro))
  disposers.push(safeInit('aboutLoop', initAboutLoop))
  disposers.push(safeInit('aboutRoadmap', initAboutRoadmap))
  disposers.push(safeInit('missionVision', initMissionVision))
  disposers.push(safeInit('pillars', initPillars))
  disposers.push(safeInit('storyRail', initStoryRail))
  disposers.push(safeInit('storyHero', initStoryHero))
  disposers.push(safeInit('labPlatform', initLabPlatform))
  disposers.push(safeInit('careersLifeFlow', initCareersLifeFlow))

  try {
    refreshScrollTriggers()
  } catch (err) {
    console.warn('[inner-pages] ScrollTrigger refresh failed:', err)
  }

  // Images loading in after the first refresh grow the page (and shift every
  // pinned trigger's start/end below them) without re-measuring on their
  // own — one more refresh once everything is actually in fixes triggers
  // that were computed against a still-short page.
  const onWindowLoad = () => {
    try {
      refreshScrollTriggers()
    } catch (err) {
      console.warn('[inner-pages] post-load ScrollTrigger refresh failed:', err)
    }
  }
  if (document.readyState === 'complete') {
    onWindowLoad()
  } else {
    window.addEventListener('load', onWindowLoad, { once: true })
  }
  disposers.push(() => window.removeEventListener('load', onWindowLoad))

  return () => {
    disposers.forEach((dispose) => {
      try {
        dispose()
      } catch (err) {
        console.warn('[inner-pages] animation cleanup failed:', err)
      }
    })
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
