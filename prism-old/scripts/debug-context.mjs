import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

const errors = []
const warnings = []
const logs = []

page.on('console', (msg) => {
  const text = msg.text()
  const type = msg.type()
  if (type === 'error') errors.push(text)
  else if (type === 'warning') warnings.push(text)
  else logs.push(`[${type}] ${text}`)
})
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`))

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'load', timeout: 30000 })
await page.waitForSelector('canvas', { timeout: 15000 })
await page.waitForTimeout(4000)

const sceneInfo = await page.evaluate(() => {
  // Find R3F root state via canvas __r3f or walk DOM
  const canvas = document.querySelector('canvas')
  if (!canvas) return { error: 'no canvas' }

  // R3F stores root on canvas in recent versions
  const fiber =
    canvas.__r3f ??
    Object.values(canvas).find((v) => v && v.store) ??
    null

  // Try accessing via __THREE__ or global — fallback: scan all meshes via renderer
  // In R3F v8+, use __r3f.root
  let scene = null
  let camera = null

  if (canvas.__r3f?.root) {
    const state = canvas.__r3f.root.getState?.() ?? canvas.__r3f.root
    scene = state?.scene
    camera = state?.camera
  }

  // Alternate: three.js stores nothing by default. Walk via React fiber internals is hard.
  // Use WebGLRenderer info from performance — instead list object names from a hack:
  // Attach temporarily by reading from window if app exposes nothing.

  return {
    hasCanvas: !!canvas,
    hasR3f: !!canvas.__r3f,
    r3fKeys: canvas.__r3f ? Object.keys(canvas.__r3f) : [],
    sceneChildren: scene
      ? scene.children.map((c) => ({
          type: c.type,
          name: c.name,
          isMesh: c.isMesh,
          isPoints: c.isPoints,
          isGroup: c.isGroup,
          pos: c.position?.toArray?.(),
          scale: c.scale?.toArray?.(),
          visible: c.visible,
          childCount: c.children?.length,
          materialSide: c.material?.side,
          materialType: c.material?.type,
          geoType: c.geometry?.type,
        }))
      : null,
    cameraPos: camera?.position?.toArray?.() ?? null,
  }
})

// Filter relevant console noise
const relevantErrors = errors.filter(
  (e) =>
    /grid|sparkle|gradient|backdrop|shader|WebGL|THREE|Cannot|Error/i.test(e),
)
const relevantWarnings = warnings.filter(
  (e) => /grid|sparkle|gradient|backdrop|shader/i.test(e),
)

console.log('=== ERRORS (all) ===')
console.log(errors.length ? errors.join('\n') : '(none)')
console.log('\n=== RELEVANT ERRORS ===')
console.log(relevantErrors.length ? relevantErrors.join('\n') : '(none)')
console.log('\n=== RELEVANT WARNINGS ===')
console.log(relevantWarnings.length ? relevantWarnings.join('\n') : '(none)')
console.log('\n=== SCENE INFO ===')
console.log(JSON.stringify(sceneInfo, null, 2))

await browser.close()
