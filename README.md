# Meolaa — React rebuild (`web`)

Self-contained React + Vite app for rebuilding the Meolaa site section by section.

**Do not overwrite or replace** the static prototype at `../prototype`. That folder is the design / UX source of truth.

## Stack

- React (TypeScript) + Vite
- React Router — multi-page routes (`/`, `/about`, `/story`, …)
- Static HTML per route at build time (`scripts/prerender.mjs`)
- react-helmet-async — per-page title and meta at runtime
- Lenis (smooth scroll)
- GSAP + ScrollTrigger
- SVG animation–ready (inline SVG / motion via GSAP)

## Multi-page website

Meolaa is a **multi-page website**, not a single-page app. Each route has its own URL, static HTML file, title, and meta description. See [`docs/WEBSITE.md`](docs/WEBSITE.md) for architecture, routes, and deployment details.

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
cd web
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

| Script    | What it does                          |
|-----------|----------------------------------------|
| `npm run dev`     | Dev server on **5173** (strict) |
| `npm run build`   | Production build + static HTML per route |
| `npm run build:full-prerender` | Build + Playwright DOM capture (optional) |
| `npm run preview` | Preview build on **5173**       |

## Run the static prototype (port 3000)

From the Meolaa parent folder (not `web`):

```bash
cd ..   # uploads/Meolaa
npm run prototype
```

Prototype stays at [http://localhost:3000](http://localhost:3000). Both servers can run at once — different ports.

## Design reference

Static HTML/CSS/JS prototype: [`../prototype`](../prototype)

Rebuild sections into `src/` as they are briefed. First fold content is not in this scaffold yet.
