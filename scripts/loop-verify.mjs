import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.setDefaultTimeout(60000)

await page.addInitScript(() => {
  try { sessionStorage.setItem('meolaa-preloader-v7', '1') } catch {}
})

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[data-section="loop"][data-loop-orbit]', { state: 'attached' })
await page.waitForTimeout(3500)

// Confirm live order from DOM
const live = await page.evaluate(() => {
  const section = document.querySelector('[data-section="loop"]')
  return {
    labels: [...section.querySelectorAll('.loop__copy-label')].map((el) => el.textContent.trim()),
    slots: [...section.querySelectorAll('[data-loop-step]')].map((el) => el.dataset.slot),
    comment: 'ok',
  }
})
console.log('live', JSON.stringify(live))

const range = await page.evaluate(() => {
  const section = document.querySelector('[data-section="loop"]')
  section.scrollIntoView({ block: 'start' })
  return {
    top: section.getBoundingClientRect().top + window.scrollY,
    pinLen: window.innerHeight * 2.8,
  }
})

async function go(progress) {
  const y = range.top + range.pinLen * progress
  await page.evaluate((scrollY) => {
    window.scrollTo(0, scrollY)
    window.dispatchEvent(new Event('scroll'))
  }, y)
  await page.waitForTimeout(500)
}

for (const [name, p] of [['start', 0.08], ['mid', 0.48], ['end', 0.96]]) {
  await go(p)
  const state = await page.evaluate(() => {
    const section = document.querySelector('[data-section="loop"]')
    const arc = section.querySelector('[data-loop-orbit-arc]')
    const len = arc?.getTotalLength?.() ?? 0
    const dash = parseFloat(arc?.style?.strokeDashoffset || String(len))
    const fill = len > 0 ? 1 - dash / len : 0
    const cs = getComputedStyle(arc)
    return {
      stage: section.dataset.loopStage,
      fill: Math.round(fill * 1000) / 1000,
      arcOpacity: cs.opacity,
      steps: [...section.querySelectorAll('[data-loop-step]')].map((el) => ({
        label: el.querySelector('.loop__copy-label')?.textContent?.trim(),
        reached: el.classList.contains('is-reached'),
      })),
      markOpacity: getComputedStyle(section.querySelector('.loop__orbit-mark')).opacity,
      sectionTop: Math.round(section.getBoundingClientRect().top),
    }
  })
  console.log(name, JSON.stringify(state))
  await page.locator('[data-section="loop"]').screenshot({
    path: path.join(outDir, `tmp-loop-${name}.png`),
    animations: 'disabled',
  })
}

await go(1.12)
const after = await page.evaluate(() => {
  const section = document.querySelector('[data-section="loop"]')
  return {
    sectionTop: Math.round(section.getBoundingClientRect().top),
    allReached: [...section.querySelectorAll('[data-loop-step]')].every((el) =>
      el.classList.contains('is-reached'),
    ),
  }
})
console.log('afterPin', JSON.stringify(after))

// Confirm source still correct
console.log('sourceCheck done')
await browser.close()
