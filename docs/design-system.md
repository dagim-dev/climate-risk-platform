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
5. **Motion.** `prefers-reduced-motion` turns off transitions. The Earth's clouds then stay still, it moves to a pin instantly instead of sliding, and the pin doesn't pulse.

## Components and helpers

- `lib/ui.ts` provides `buttonClass(variant, size)` with the variants `primary`, `glow`, `secondary`, `ghost`, `onDark` and `danger`. It also provides `cardClass`, `inputClass`, `linkClass` and `eyebrowClass`.
- `components/ui/PageHero` is the starfield title band used by content, properties and legal pages.
- `components/ui/HazardIcon` provides line icons for flood, hurricane, heat, wildfire and home. `HazardBadge` puts the icon in an outlined circle.
- `components/ui/ScoreRing` is the 0–100 ring, with a dashed empty state for no score.
- `components/ui/EarthHero` is the homepage Earth, framed on the contiguous U.S. and rising from the bottom of the hero. It's decorative and `aria-hidden`. It's a pre-rendered image in two layers, not a live globe, and it can't be dragged:
  - `base` holds the surface, lighting and atmosphere, and `clouds` holds the clouds and their shadows. `lib/earth-clouds.ts` is a small WebGL canvas that turns the cloud layer around Earth's axis, 8° east and west over 130 seconds on a rounded triangle wave, so clouds move steadily at about 2 to 2.5 px/s on a 1440 screen and turn gently. It only starts once the page has loaded, and at the first frame it matches the still layer. Land never moves. With reduced motion, no WebGL or a GPU too small for the image, the still cloud layer stays, which looks the same.
  - `lib/earth-view.ts` projects a lat/lon onto the image using the camera in `assets/earth/view.json`, so a pin always matches the picture. If a pin would land under a panel or out of frame (the coasts on smaller screens, Alaska, Hawaii, Puerto Rico), the Earth slides just far enough to bring it between the panels. Places on the far side of the planet (Guam) get no pin. Amber is deliberately not a risk token, so the pin doesn't read as a score.
  - Large screens center the Earth in the hero, with the copy and search in a left `.earth-panel` and the examples, hazards and data sources in a right one. The panels overlap the planet on purpose. Their opacity is set so text passes AA over the brightest pixel in the image with no help from the blur, so it holds wherever the Earth has panned and in browsers without `backdrop-filter`. Change the panel color or opacity, or the text colors in them, only after remeasuring. `brand-accent` and `rose-300` don't pass in a panel, which is why they become `sky-200` and `rose-200` there. Small screens hang the Earth in `.earth-window`, a gap between the search box and the examples, so it's on the first screen, and `.earth-scrim` keeps the text readable.
  - Search state lives in `lib/use-address-search.ts`, so the search box and the example pills can sit in different panels.
  - Images are `src/assets/earth/{base,clouds}-{1200,1800,2500,4200,5200}.avif`, plus WebP at 1200 and 2500 for browsers without AVIF. Phones stop at 1800, which is 2x at that size: larger files add over a second to the largest paint on a slow phone. The clouds only start loading once the surface has decoded, for the same reason. If you change the Earth's size, update `SIZES` in `EarthHero.tsx` along with `--earth-radius`.
  - To change the view, edit the camera and lighting in `frontend/scripts/render_earth_hero.py` and rerun it. It rewrites the images and `view.json`.
  - Sources: terrain from NASA Blue Marble Next Generation (August 2004, 240 px/degree tiles), elevation from NASA's Blue Marble topography (GEBCO_08, 120 px/degree tiles), clouds from NOAA GOES-East and GOES-West Band 2 (29 August 2026 at 20:00Z, 114 px/degree) via NASA GIBS. GIBS only keeps the last few months of GOES, so that time will disappear; the script's docstring says what to do then. It's an illustration composited from those, not a live or current view of the weather. NASA and NOAA imagery is generally free of U.S. copyright, including for commercial use, as long as it doesn't use their logos or imply their endorsement. They and GEBCO ask for credit, so the footer carries one. Keep that credit if the image stays.
- `components/auth/AuthShell` is the sign-in and sign-up backdrop and card.
- `.starfield` (in `globals.css`) is a pure-CSS star background.
