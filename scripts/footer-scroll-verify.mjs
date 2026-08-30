/**
 * Footer scroll + visibility verification (Lenis-aware via keyboard).
 */
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://127.0.0.1:5173'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

try {
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3500)

  const measure = () =>
    page.evaluate(() => {
      const footer = document.querySelector('.footer-reveal-section')
      const jumps = document.querySelector('.site-footer__jumps')
      const mark = document.querySelector('.site-footer__wordmark')
      const pin = document.querySelector('.footer-pin')
      const sp = pin?.parentElement?.classList.contains('pin-spacer')
        ? pin.parentElement
        : null
      const jr = jumps?.getBoundingClientRect()
      const mr = mark?.getBoundingClientRect()
      return {
        scrollY: Math.round(window.scrollY),
        maxScroll:
          document.documentElement.scrollHeight - window.innerHeight,
        docH: document.documentElement.scrollHeight,
        footerInDom: !!footer,
        settled: footer?.classList.contains('is-settled'),
        jumpsVisible:
          jr && jr.height > 0 && jr.top < innerHeight && jr.bottom > 0,
        markVisible:
          mr && mr.height > 0 && mr.top < innerHeight && mr.bottom > 0,
        pinSpacerPad: sp ? getComputedStyle(sp).paddingBottom : null,
        copyClip: jumps
          ? getComputedStyle(
              jumps.closest('.footer-copy-reveal') || jumps,
            ).clipPath
          : null,
      }
    })

  // Keyboard scroll (bypasses press wheel capture)
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(1500)

  const end = await measure()
  console.log(JSON.stringify(end, null, 2))

  const ok =
    end.footerInDom &&
    end.scrollY >= end.maxScroll - 150 &&
    (end.jumpsVisible || end.markVisible || end.settled)

  if (!ok) {
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
