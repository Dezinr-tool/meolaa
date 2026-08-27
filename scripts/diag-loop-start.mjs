import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../.diag')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(3000)
await page.waitForSelector('.preloader', { state: 'detached', timeout: 25000 }).catch(() => {})
await page.waitForTimeout(400)

await page.evaluate(() => {
  document.querySelector('[data-section="loop"]')?.scrollIntoView({ block: 'start' })
})
await page.waitForTimeout(1000)

const diag = await page.evaluate(() => {
  const loop = document.querySelector('[data-section="loop"]')
  const drawn = loop?.querySelector('[data-loop-drawn]')
  const ghost = loop?.querySelector('.loop__ghost')
  const tip = loop?.querySelector('[data-loop-tip]')
  const camera = loop?.querySelector('[data-loop-camera]')
  const viewport = loop?.querySelector('[data-loop-viewport]')

  const pathLen = drawn?.getTotalLength?.() ?? 0
  const dashoffset =
    drawn?.style?.strokeDashoffset || drawn?.getAttribute('stroke-dashoffset')
  const tipBox = tip?.getBoundingClientRect()
  const vpBox = viewport?.getBoundingClientRect()
  const ghostCs = ghost ? getComputedStyle(ghost) : null
  const tipCs = tip ? getComputedStyle(tip) : null
  const drawnCs = drawn ? getComputedStyle(drawn) : null

  const inVp = (box) =>
    !!box &&
    !!vpBox &&
    box.width > 0 &&
    box.x >= vpBox.x - 4 &&
    box.right <= vpBox.right + 4 &&
    box.y >= vpBox.y - 4 &&
    box.bottom <= vpBox.bottom + 4

  return {
    ready: loop?.classList.contains('is-loop-ready'),
    pathLen,
    dashoffset,
    cameraTransform: camera?.style?.transform || getComputedStyle(camera).transform,
    camScale: camera?.style?.getPropertyValue('--loop-cam-scale'),
    drawnOpacity: drawnCs?.opacity,
    ghostStroke: ghostCs?.stroke,
    tipOpacity: tipCs?.opacity,
    tipBox: tipBox && { x: tipBox.x, y: tipBox.y, w: tipBox.width, h: tipBox.height },
    vpContainsTip: inVp(tipBox),
    tipRelativeX: tipBox && vpBox ? tipBox.x - vpBox.x : null,
    tipRelativeY: tipBox && vpBox ? tipBox.y - vpBox.y : null,
    bodyLen: pathLen && dashoffset ? pathLen - parseFloat(String(dashoffset)) : null,
  }
})

console.log(JSON.stringify(diag, null, 2))
await page.locator('[data-section="loop"]').screenshot({ path: join(OUT, 'loop-pin0.png') })
await browser.close()
