# Design System

The frontend's look is an "orbital" theme. The site chrome (header, landing hero, page heroes, footer) is always deep-space navy with a starfield. Content surfaces follow the visitor's light or dark system setting. Print is always light.

All tokens live in `frontend/src/app/globals.css`. Tailwind 4 reads them from `@theme`, and there is no `tailwind.config.ts`.

## Typography

| Role | Font | Utility |
|------|------|---------|
| Display (page titles, verdict word, section headings) | Instrument Serif 400 | `font-display` |
| UI and body | Inter (variable) | `font-sans` (default) |
| Eyebrows | Inter, 12px, uppercase, `tracking-[0.25em]` | `eyebrowClass` in `lib/ui.ts` |

Both fonts are self-hosted at build time through `next/font/google` in `app/layout.tsx`.

## Color

### Raw palette (`@theme`)

| Token | Hex | Usage |
|-------|-----|-------|
| `space-950` / `space-900` / `space-800` | `#050b18` / `#0a1428` / `#10203d` | Dark chrome and the starfield |
| `brand-primary` | `#1e3a5f` | Primary buttons in light mode |
| `brand-accent` | `#38bdf8` | Glow, accents and CTAs on dark chrome. Never body text on light surfaces |
| `risk-low` … `risk-extreme` | `#22c55e` … `#7f1d1d` | Raw severity hues (prefer the semantic `-fill` tokens) |

### Semantic tokens (light / dark)

The tokens are CSS variables on `:root`. Dark values apply under `@media screen and (prefers-color-scheme: dark)`. Use them as utilities such as `bg-canvas`, `bg-surface`, `text-ink` and `border-line`.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `canvas` | `#f4f6fa` | `#050b18` | Page background |
| `surface` / `surface-2` | `#ffffff` / `#eef2f7` | `#0c1729` / `#13223a` | Cards, then insets and chips |
| `ink` / `ink-muted` | `#0b1628` / `#475569` | `#e8eef7` / `#a3b3c9` | Text |
| `line` | `#d9e1ec` | `#22355a` | Borders and empty score rings |
| `accent-ink` | `#0369a1` | `#7dd3fc` | Links and accent text on surfaces |
| `focus` | `#0284c7` | `#7dd3fc` | Focus ring (`.on-dark` switches it to light sky) |
| `risk-*-ink` / `risk-*-soft` / `risk-*-fill` | | | Severity text, pill background, and ring or bar fill |
| `warn-ink` / `warn-soft` / `warn-line` | | | The "unavailable" state, which is never a severity |
| `chart-*` | | | Recharts grid, axis and hazard lines (passed as `var(--chart-…)`) |

## Rules

1. **Data honesty.** A missing value never looks like a value. `ScoreRing` with `score={null}` draws a dashed empty track with no arc and no number. Unavailable hazards use the `warn-*` tokens, never a severity color. The verdict panel shows no overall number unless there is a verdict.
2. **Severity color comes only from `severity`** (or `severityFromScore`) through `lib/risk-styles.ts`. Don't reuse risk colors for unrelated UI states. The one exception is error text, which uses `risk-high-ink`.
3. **Contrast.** Every text token pair passes WCAG AA (4.5:1) on `surface` and `canvas` in both themes. Ring and bar fills pass 3:1. When you add a pair, check it in both themes.
4. **Focus.** Don't remove outlines. The global `:focus-visible` ring applies everywhere, and anything placed on dark chrome sits inside an `.on-dark` ancestor.
5. **Motion.** `prefers-reduced-motion` turns off transitions. The globe then turns to a pin instantly instead of easing, and the pin doesn't pulse.

## Components and helpers

- `lib/ui.ts` provides `buttonClass(variant, size)` with the variants `primary`, `glow`, `secondary`, `ghost`, `onDark` and `danger`. It also provides `cardClass`, `inputClass`, `linkClass` and `eyebrowClass`.
- `components/ui/PageHero` is the starfield title band used by content, properties and legal pages.
- `components/ui/HazardIcon` provides line icons for flood, hurricane, heat, wildfire and home. `HazardBadge` puts the icon in an outlined circle.
- `components/ui/ScoreRing` is the 0–100 ring, with a dashed empty state for no score.
- `components/ui/Globe` is the WebGL globe (`cobe`). It's decorative and `aria-hidden`, and falls back to a CSS sphere without WebGL. It never spins on its own: it can be dragged in both axes (tilt clamped short of the poles), and it turns to the analyzed address and marks it with an amber pin (`.globe-pin` in `globals.css`, tied to cobe's marker anchor). It drifts back to the pin 3 s after a drag. Amber is deliberately not a risk token, so the pin doesn't read as a score. On small screens the globe has its own row under the search, because swipes on it turn it instead of scrolling the page.
- `components/auth/AuthShell` is the sign-in and sign-up backdrop and card.
- `.starfield` (in `globals.css`) is a pure-CSS star background.
