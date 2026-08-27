# Meolaa — React rebuild (`web`)

Self-contained React + Vite app for rebuilding the Meolaa site section by section.

**Do not overwrite or replace** the static prototype at `../prototype`. That folder is the design / UX source of truth.

## Stack

- React (TypeScript) + Vite
- Lenis (smooth scroll)
- GSAP + ScrollTrigger
- SVG animation–ready (inline SVG / motion via GSAP)

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
| `npm run build`   | Production build                |
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
