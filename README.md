# Meolaa

| Folder | What it is |
|--------|------------|
| `web/` | React + Vite rebuild (primary app) |
| `prototype/` | Static HTML/CSS/JS design source of truth |
| `next/` | Earlier Next.js experiment (optional) |

## Run

```bash
npm run dev          # React app → http://127.0.0.1:5173
npm run prototype    # Static prototype → http://localhost:3000
npm run dev:next     # Next.js app → http://localhost:3000
```

Or from a subfolder:

```bash
cd web && npm run dev
cd prototype   # then: npm run prototype from repo root
```
