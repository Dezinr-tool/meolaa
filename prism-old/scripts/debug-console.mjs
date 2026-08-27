import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

page.on('console', (msg) => {
  const text = msg.text()
  if (
    text.includes('[raytracer') ||
    text.includes('[debug] trace') ||
    text.includes('bands=')
  ) {
    console.log(text)
  }
})
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message))

await page.goto('http://127.0.0.1:5173/', {
  waitUntil: 'load',
  timeout: 30000,
})
await page.waitForSelector('canvas', { timeout: 15000 })
await page.waitForTimeout(5000)
await browser.close()
