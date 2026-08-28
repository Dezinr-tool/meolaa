/**
 * Static multi-page output — clones the Vite-built index.html per route with
 * route-specific document metadata. Vercel serves real files on reload; React
 * hydrates client-side for animations and navigation.
 *
 * Optional full DOM prerender (local only): PLAYWRIGHT_PRERENDER=1
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')

const ROUTES = [
  '/',
  '/about',
  '/story',
  '/lab',
  '/press',
  '/partners',
  '/careers',
  '/contact',
]

const PAGE_META = {
  '/': {
    title: 'Meolaa — AI-native house of brands',
    description:
      'Meolaa reads demand signals, builds consumer brands with AI, and runs them on one operating system — from signal to shelf.',
  },
  '/about': {
    title: 'About Us | Meolaa',
    description:
      'The thesis behind Meolaa: signal over opinion, small teams with real ownership, and a system that builds and runs brands end to end.',
  },
  '/story': {
    title: 'Our Story | Meolaa',
    description:
      'How Meolaa got built — from reading demand before it peaks to proving the system works across live and pipeline brands.',
  },
  '/lab': {
    title: 'Meolaa Lab | Meolaa',
    description:
      'Inside the Meolaa Lab: four capabilities in one loop — reading demand, product & brand, go-to-market, and distribution & ops.',
  },
  '/press': {
    title: 'Press & Media | Meolaa',
    description:
      'Press releases, announcements, and media kit downloads from Meolaa — the AI-native house of brands.',
  },
  '/partners': {
    title: 'Partners | Meolaa',
    description:
      'Investors, manufacturers, distributors, and brand collaborators building with Meolaa on one shared operating system.',
  },
  '/careers': {
    title: 'Careers | Meolaa',
    description:
      'Join a small team with real ownership. Open roles across intelligence, brand build, and growth at Meolaa.',
  },
  '/contact': {
    title: 'Contact | Meolaa',
    description:
      'Get in touch with Meolaa — general inquiries, press, careers, and investor or partnership conversations.',
  },
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
}

function injectPageMeta(html, route) {
  const meta = PAGE_META[route] ?? PAGE_META['/']
  const headTags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
  ].join('\n    ')

  return html.replace(
    /<meta charset="UTF-8"\s*\/?>/i,
    `$&\n    ${headTags}`,
  )
}

async function outputPathForRoute(route) {
  if (route === '/') return join(dist, 'index.html')
  return join(dist, route.slice(1), 'index.html')
}

async function generateStaticPages() {
  const template = await readFile(join(dist, 'index.html'), 'utf8')

  for (const route of ROUTES) {
    const html = injectPageMeta(template, route)
    const out = await outputPathForRoute(route)
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, html, 'utf8')
    console.log(`  ✓ ${route} → ${out.replace(dist, 'dist')}`)
  }
}

async function generateWithPlaywright() {
  const { spawn } = await import('node:child_process')
  const { chromium } = await import('playwright')

  const port = 4173
  const baseUrl = `http://127.0.0.1:${port}`

  function waitForServer(url, timeoutMs = 30_000) {
    const started = Date.now()
    return new Promise((resolve, reject) => {
      const tick = async () => {
        try {
          const res = await fetch(url)
          if (res.ok || res.status === 404) {
            resolve()
            return
          }
        } catch {
          /* not ready */
        }
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Preview server did not start within ${timeoutMs}ms`))
          return
        }
        setTimeout(tick, 250)
      }
      tick()
    })
  }

  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' },
    },
  )

  preview.stdout?.on('data', (chunk) => process.stdout.write(chunk))
  preview.stderr?.on('data', (chunk) => process.stderr.write(chunk))

  try {
    await waitForServer(baseUrl)
    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext()
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem('meolaa-preloader-v7', '1')
      } catch {
        /* ignore */
      }
    })
    const page = await context.newPage()

    for (const route of ROUTES) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 60_000 })
      if (route === '/') {
        await page.waitForSelector('.app--home main', { timeout: 15_000 }).catch(() => {})
      } else {
        await page.waitForSelector('.app--inner main', { timeout: 15_000 })
      }
      await page.waitForTimeout(400)

      let html = await page.content()
      html = html
        .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
        .replace(/<meta name="description"[^>]*>/gi, '')
        .replace(/<meta property="og:title"[^>]*>/gi, '')
        .replace(/<meta property="og:description"[^>]*>/gi, '')
        .replace(/<meta property="og:type"[^>]*>/gi, '')
        .replace(/<meta name="twitter:card"[^>]*>/gi, '')
        .replace(/<meta name="twitter:title"[^>]*>/gi, '')
        .replace(/<meta name="twitter:description"[^>]*>/gi, '')
      html = injectPageMeta(html, route)

      const out = await outputPathForRoute(route)
      await mkdir(dirname(out), { recursive: true })
      await writeFile(out, html, 'utf8')
      console.log(`  ✓ ${route} → ${out.replace(dist, 'dist')} (playwright)`)
    }

    await browser.close()
  } finally {
    preview.kill('SIGTERM')
  }
}

async function main() {
  console.log('Generating static pages…')

  if (process.env.PLAYWRIGHT_PRERENDER === '1') {
    await generateWithPlaywright()
  } else {
    await generateStaticPages()
  }

  console.log(`Done — ${ROUTES.length} pages written.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
