/**
 * Verify homepage scroll reaches footer past Press.
 */
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://127.0.0.1:5173'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(5000)

  await page.evaluate(() => {
    const press = document.querySelector('[data-section="press"]')
    const y = press.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, y)
  })
  await page.waitForTimeout(400)

  const before = await page.evaluate(() => Math.round(window.scrollY))

  const box = await page.locator('[data-press-slider]').boundingBox()
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

  for (let i = 0; i < 35; i++) {
    await page.mouse.wheel(0, 500)
    await page.waitForTimeout(40)
  }
  await page.waitForTimeout(1500)

  const end = await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - innerHeight
    const jumps = document.querySelector('.site-footer__jumps')?.getBoundingClientRect()
    const mark = document.querySelector('.site-footer__wordmark')?.getBoundingClientRect()
    const copyClip = getComputedStyle(
      document.querySelector('.footer-copy-reveal') || document.body,
    ).clipPath
    return {
      scrollY: Math.round(window.scrollY),
      max,
      jumpsVisible: !!(jumps && jumps.top < innerHeight && jumps.bottom > 0),
      markVisible: !!(mark && mark.top < innerHeight && mark.bottom > 0),
      copyClip,
      settled: document
        .querySelector('.footer-reveal-section')
        ?.classList.contains('is-settled'),
      footerInDom: !!document.querySelector('.footer-reveal-section'),
    }
  })

  console.log(JSON.stringify({ beforeY: before, ...end }, null, 2))

  const scrolledPastPress = end.scrollY > before + 200
  const reachedFooter =
    end.jumpsVisible || end.markVisible || end.settled || end.scrollY >= end.max - 100

  if (!end.footerInDom || !scrolledPastPress || !reachedFooter) {
    console.error('FAIL')
    process.exit(1)
  }
  console.log('PASS')
} catch (e) {
  console.error(e)
  process.exit(1)
} finally {
  await browser.close()
}
