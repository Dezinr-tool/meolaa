# Meolaa website architecture

Meolaa is a **multi-page website**, not a single-page app. Each route is an independent page with its own URL, document title, and meta description. The homepage (`/`) remains a scroll-driven experience; inner pages are standalone layouts.

## Routes

| Route | Page component | Document title |
|-------|----------------|----------------|
| `/` | `HomePage` | Meolaa — AI-native house of brands |
| `/about` | `AboutPage` | About Us \| Meolaa |
| `/story` | `StoryPage` | Our Story \| Meolaa |
| `/lab` | `LabPage` | Meolaa Lab \| Meolaa |
| `/press` | `PressPage` | Press & Media \| Meolaa |
| `/partners` | `PartnersPage` | Partners \| Meolaa |
| `/careers` | `CareersPage` | Careers \| Meolaa |
| `/contact` | `ContactPage` | Contact \| Meolaa |

Route metadata lives in `src/data/pageMeta.json` and is consumed by:

- `src/lib/pageMeta.ts` — runtime lookups for `PageMeta` (react-helmet-async)
- `scripts/prerender.mjs` — build-time HTML injection

## Build output

```bash
npm run build   # tsc → vite build → prerender
```

After build, `dist/` contains one HTML file per route:

```
dist/
  index.html           # /
  about/index.html
  story/index.html
  lab/index.html
  press/index.html
  partners/index.html
  careers/index.html
  contact/index.html
  assets/              # shared JS/CSS bundles
```

Each `index.html` includes route-specific `<title>`, `<meta name="description">`, and Open Graph / Twitter tags before the React bundle loads.

Optional full DOM prerender (Playwright captures rendered markup):

```bash
npm run build:full-prerender
```

## Runtime behavior

1. **Direct URL / reload** — Vercel serves the matching static HTML file (e.g. `/about` → `dist/about/index.html`). Title and description are correct before JavaScript runs.
2. **In-app navigation** — React Router (`BrowserRouter`) swaps page components client-side. `PageMeta` updates the document head via react-helmet-async.
3. **Homepage** — Scroll sections, Lenis, GSAP, and the animated footer pin/reveal. Inner pages use `PageLayout` with independent content and simpler footer.

Navigation uses React Router `<Link to="…">` for internal routes. Hash links (e.g. `/#brands`) stay as `<a href>` for same-page anchors on the homepage.

## Vercel deployment

`vercel.json` sets `outputDirectory: dist` and `trailingSlash: false`. Static files are served first; a catch-all rewrite to `/index.html` exists only as a fallback for unmatched paths (client-side routing during preview). Known routes always resolve to their prerendered HTML.

Deploy:

```bash
vercel --prod
```

Production URL: https://meola-eight.vercel.app

## How this differs from a SPA

| SPA mental model | Meolaa (multi-page website) |
|------------------|----------------------------|
| One `index.html` for all routes | One HTML file per route in `dist/` |
| Title/meta set only via JavaScript | Baked into static HTML at build time |
| Reload on `/about` needs server rewrite to `index.html` | Reload serves `about/index.html` directly |
| All “pages” are sections on one scroll view | Inner pages are separate React page components |
| SEO depends on crawlers executing JS | Crawlers get correct title/description in initial HTML |

The app still uses React and a shared JS bundle — this is a **static multi-page site with client hydration**, not separate codebases per page.
