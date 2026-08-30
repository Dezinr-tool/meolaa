# Meolaa

Live site is the **React + Vite app at the repo root** (`src/`, `index.html`).  
`ganesh` / `rakesh` also brought in a nested snapshot and older experiments:

| Path | What it is |
|------|------------|
| `/` (root) | React + Vite rebuild — primary app, deployed from here |
| `web/` | Nested snapshot of the Vite app from `ganesh` / `rakesh` |
| `prototype/` | Static HTML/CSS/JS design source of truth |
| `next/` | Earlier Next.js experiment (optional) |

## Multi-page website

Meolaa is a **multi-page website**, not a single-page app. Each route has its own URL, static HTML file, title, and meta description. See [`docs/WEBSITE.md`](docs/WEBSITE.md).

| Route | Title |
|-------|-------|
| `/` | Meolaa — AI-native house of brands |
| `/about` | About Us \| Meolaa |
| `/story` | Our Story \| Meolaa |
| `/lab` | Meolaa Lab \| Meolaa |
| `/press` | Press & Media \| Meolaa |
| `/partners` | Partners \| Meolaa |
| `/careers` | Careers \| Meolaa |
| `/contact` | Contact \| Meolaa |

## Run the React app (port 5173)

```bash
npm install
npm run dev
```

Opens at [http://127.0.0.1:5173](http://127.0.0.1:5173).

**Keep it up:** leave that terminal running. Do **not** kill port 5173 if the server is already healthy (`curl -I http://127.0.0.1:5173` returns 200). Agents and scripts should not run `lsof -ti :5173 | xargs kill` just to “restart” — that is why the site keeps going down. `strictPort` is on, so a second `npm run dev` will fail if 5173 is already taken; that is expected, not a crash.

| Script | What it does |
|--------|----------------|
| `npm run dev` | Dev server on **5173** (strict) |
| `npm run build` | Production build + static HTML per route |
| `npm run build:full-prerender` | Build + Playwright DOM capture (optional) |
| `npm run preview` | Preview build on **5173** |

## Stack

- React (TypeScript) + Vite
- React Router — multi-page routes (`/`, `/about`, `/story`, …)
- Static HTML per route at build time (`scripts/prerender.mjs`)
- react-helmet-async — per-page title and meta at runtime
- Lenis (smooth scroll)
- GSAP + ScrollTrigger
- Three.js / R3F glass prism
