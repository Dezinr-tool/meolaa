# Meolaa — Color Palette Reference

For client planning discussions. Visual screenshot reference: open **`/color-palette.html`** while the dev server is running (`npm run dev` → `http://127.0.0.1:5173/color-palette.html`).

**Sources:** `docs/BRAND.md`, `docs/Meolaa_Brand_Guidelines.pdf`, `src/styles/tokens.css`, codebase audit (Aug 2026).

---

## Primary

| Color name | Hex | CSS token | Current usage | Suggested / planned usage |
|------------|-----|-----------|---------------|---------------------------|
| Planet Blue | `#002f3a` | `--color-planet-blue`, `--color-primary`, `--color-ink`, `--color-bg` | Default dark shell; Hero overlay; Loop section bg; Inner-page hero bands; Inverse CTAs; Nav dark glass; Logo on light nav; Video modal; About roadmap milestones; Founding ink; Portfolio ink | |
| Joyous Yellow | `#fdf28c` | `--color-joyous-yellow`, `--color-secondary` | Primary CTA buttons; Loop path track; Founding CTA; About roadmap path; Button focus ring; Portfolio accent shape | |
| Ecru | `#f8ece4` | `--color-ecru`, `--color-cream`, `--color-surface`, `--color-vision-bg`, `--color-lab-bg`, `--color-fg` | Vision section ground; Warm section backgrounds; Text on dark; Footer copy; Ghost buttons; Hero body on dark; Nav dark-glass border | |
| White | `#ffffff` | `--color-white` | Inner pages bg; Press section; Footer pre-reveal; Nav light glass; Cards; Titles on dark; Green CTA text | |

---

## Secondary & Accents

| Color name | Hex | CSS token | Current usage | Suggested / planned usage |
|------------|-----|-----------|---------------|---------------------------|
| Sustainable Green | `#41857a` | `--color-sustainable-green`, `--color-sage`, `--section-head-accent` | **All section eyebrows**; Accent green button; Portfolio green; Founding eyebrow | |
| Lilac | `#a8a3e3` | `--color-lilac` | Portfolio decorative shape; Brand Lab swatch | |
| Deep Lilac (Generous Lilac) | `#5656ad` | `--color-lilac-deep` | Token only — not yet on live pages | |
| Deep Ecru | `#f0d5cc` | `--color-ecru-deep` | Portfolio decorative shape; Brand Lab swatch | |

---

## Neutrals

| Color name | Hex | CSS token | Current usage | Suggested / planned usage |
|------------|-----|-----------|---------------|---------------------------|
| Black | `#000000` | `--color-black`, `--section-head-on-light-ink` | Footer circle & mark band; Body/headlines on light grounds; Nav links (light); Inner page text | |

---

## Semantic — Text, Backgrounds & Borders

| Color name | Hex / value | CSS token | Current usage | Suggested / planned usage |
|------------|-------------|-----------|---------------|---------------------------|
| Foreground Muted | `rgba(248, 236, 228, 0.78)` | `--color-fg-muted` | Hero subcopy on dark; Secondary body on Planet Blue | |
| Foreground Soft | `rgba(248, 236, 228, 0.55)` | `--color-fg-soft` | Tertiary text on dark | |
| Border Ghost | `rgba(248, 236, 228, 0.40)` | `--color-border-ghost` | Ghost button borders on dark | |
| Border Dark | `rgba(0, 47, 58, 0.28)` | `--color-border-dark` | Ghost button borders on light | |
| Nav Glass — Light BG | `rgba(255, 255, 255, 0.50)` | `--nav-glass-light-bg` | Sticky nav on scroll (light) | |
| Nav Glass — Light Border | `rgba(0, 0, 0, 0.10)` | `--nav-glass-light-border` | Nav border on light glass | |
| Nav Glass — Dark BG | `rgba(0, 47, 58, 0.25)` | `--nav-glass-dark-bg` | Nav over dark hero | |
| Nav Glass — Dark Border | `rgba(248, 236, 228, 0.16)` | `--nav-glass-dark-border` | Nav border over dark hero | |
| Section Sub — On Light | `color-mix(black 58%)` | `--section-head-on-light-muted` | Section subheads on light grounds | |
| Section Sub — On Dark | `color-mix(white 70%)` | `--section-head-on-dark-muted` | Section subheads on dark grounds | |

---

## Not brand tokens (informational)

| Notes | Details |
|-------|---------|
| Hero prism rainbow | Decorative animation only (`HeroPrismFallback.tsx`, `HeroPrismScene.tsx`) — not part of the brand palette |
| Legacy secondary fallback | `#fef8c0` in `inner-pages.css` — should align to `#fdf28c` |

---

## Quick count — colors found

**Solid brand colors (9):** Planet Blue, Joyous Yellow, Ecru, White, Sustainable Green, Lilac, Deep Lilac, Deep Ecru, Black

**Semantic / alpha tokens (10):** fg-muted, fg-soft, border-ghost, border-dark, 4× nav glass, 2× section-head muted

**Total documented:** 19 swatches on `/color-palette.html`
