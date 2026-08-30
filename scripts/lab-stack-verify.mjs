import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch({ headless: true })

async function measureLab(page) {
  return page.evaluate(() => {
    const section = document.querySelector('[data-section="lab"]')
    const slides = [...section.querySelectorAll('[data-lab-slide]')]
    const cards = [...section.querySelectorAll('[data-lab-card]')]
    const pinSpacers = [...section.querySelectorAll('.pin-spacer')]
    const stacked = section.classList.contains('meola-lab--stacked')

    const cardState = cards.map((card) => {
      const cs = getComputedStyle(card)
      const tr = cs.transform
      let scale = 1
      if (tr && tr !== 'none') {
        const m = new DOMMatrix(tr)
        scale = Math.hypot(m.m11, m.m12, m.m13)
      }
      return {
        id: card.getAttribute('data-lab-card'),
        theme: card.getAttribute('data-lab-theme'),
        bg: cs.backgroundColor,
        opacity: Number(cs.opacity),
        transform: tr,
        scale: Number(scale.toFixed(3)),
        front: card.classList.contains('is-front'),
        title: card
          .querySelector('.meola-lab__title, .meola-lab__headline')
          ?.textContent?.trim(),
      }
    })

    return {
      stacked,
      slideCount: slides.length,
      pinSpacers: pinSpacers.length,
      sectionH: Math.round(section.getBoundingClientRect().height),
      vh: window.innerHeight,
      cardState,
    }
  })
}

async function scrollY(page, y) {
  await page.evaluate((scrollY) => {
    window.scrollTo(0, scrollY)
    window.dispatchEvent(new Event('scroll'))
  }, y)
  await page.waitForTimeout(500)
}

async function runViewport(name, viewport) {
  const page = await browser.newPage({ viewport })
  page.setDefaultTimeout(60000)
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('meolaa-preloader-v7', '1')
    } catch {}
  })

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-section="lab"]', { state: 'attached' })
  await page.waitForTimeout(2800)
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-section="lab"]')
        ?.classList.contains('meola-lab--stacked'),
    { timeout: 15000 },
  )

  const range = await page.evaluate(() => {
    const section = document.querySelector('[data-section="lab"]')
    const slides = [...section.querySelectorAll('[data-lab-slide]')]
    const first = slides[0]
    const second = slides[1]
    return {
      top: section.getBoundingClientRect().top + window.scrollY,
      firstTop: first.getBoundingClientRect().top + window.scrollY,
      secondTop: second.getBoundingClientRect().top + window.scrollY,
      height: section.getBoundingClientRect().height,
    }
  })

  await scrollY(page, range.firstTop)
  const idle = await measureLab(page)
  await page.screenshot({
    path: path.join(outDir, `tmp-lab-stack-${name}-idle.png`),
    fullPage: false,
  })

  const midY = range.firstTop + viewport.height * 0.62
  await scrollY(page, midY)
  const mid = await measureLab(page)
  const midOverlap = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-lab-card]')]
    const a = cards[0]?.getBoundingClientRect()
    const b = cards[1]?.getBoundingClientRect()
    return {
      introTop: a ? Math.round(a.top) : null,
      nextTop: b ? Math.round(b.top) : null,
      nextVisible: b ? b.top < window.innerHeight && b.bottom > 0 : false,
      gap: a && b ? Math.round(b.top - a.top) : null,
    }
  })
  await page.screenshot({
    path: path.join(outDir, `tmp-lab-stack-${name}-mid.png`),
    fullPage: false,
  })

  const lateY = range.firstTop + viewport.height * 0.92
  await scrollY(page, lateY)
  const late = await measureLab(page)
  await page.screenshot({
    path: path.join(outDir, `tmp-lab-stack-${name}-late.png`),
    fullPage: false,
  })

  await page.close()
  return { idle, mid, late, midOverlap, range }
}

const desktop = await runViewport('desktop', { width: 1440, height: 900 })
const mobile = await runViewport('mobile', { width: 390, height: 844 })

console.log(JSON.stringify({ desktop, mobile }, null, 2))

const d = desktop.idle
if (d.slideCount !== 5) throw new Error(`expected 5 slides, got ${d.slideCount}`)
if (d.pinSpacers < 4) throw new Error(`expected ≥4 pin-spacers, got ${d.pinSpacers}`)
if (d.sectionH < d.vh * 4.5 || d.sectionH > d.vh * 12) {
  throw new Error(`Lab section height unexpected for stack: ${d.sectionH} vs ${d.vh}`)
}

const introMid = desktop.mid.cardState[0]
const nextMid = desktop.mid.cardState[1]
if (introMid.scale >= 0.98) {
  throw new Error(`intro should shrink mid-pin, scale=${introMid.scale}`)
}
if (!desktop.midOverlap.nextVisible) {
  throw new Error(
    `next card should overlap mid-pin: ${JSON.stringify(desktop.midOverlap)}`,
  )
}
if (!nextMid || nextMid.opacity < 0.9) {
  throw new Error(`next card should be visible mid-stack: ${JSON.stringify(nextMid)}`)
}

const introLate = desktop.late.cardState[0]
if (introLate.opacity > 0.55) {
  throw new Error(`intro should fade late-pin, opacity=${introLate.opacity}`)
}

await browser.close()
console.log('lab stack verify: ok')
