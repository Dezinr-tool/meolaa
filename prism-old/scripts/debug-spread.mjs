import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

page.on('console', async (msg) => {
  const text = msg.text()
  if (text.includes('[spread]')) {
    console.log(text)
  }
  // console.table from page shows up as a special type sometimes
  if (msg.type() === 'table' || text.includes('rawDeg') || text.includes('violet')) {
    try {
      const args = await Promise.all(msg.args().map((a) => a.jsonValue().catch(() => null)))
      if (args.length) console.log('TABLE:', JSON.stringify(args, null, 2))
    } catch {
      console.log(text)
    }
  }
})

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 })
await page.waitForSelector('canvas', { timeout: 15000 })
await page.waitForTimeout(3000)
await browser.close()
