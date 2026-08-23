# Design System

This document defines the Climate Risk Intelligence Platform color palette and usage rules for the frontend.

## Color Palette

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#1e3a5f` | Headers, footers, primary navigation, key UI chrome |
| `brand-accent` | `#38bdf8` | Links, buttons, highlights, interactive affordances |

### Risk Level Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `risk-low` | `#22c55e` | Low hazard scores, Go verdicts |
| `risk-moderate` | `#f59e0b` | Moderate hazard scores, Caution verdicts |
| `risk-high` | `#ef4444` | High hazard scores, elevated warnings |
| `risk-extreme` | `#7f1d1d` | Extreme hazard scores, Avoid verdicts |

## Usage Rules

1. **Brand primary** is the default background for global layout chrome (Header, Footer). Use white or `brand-accent` for text and links on primary backgrounds.
2. **Brand accent** is reserved for interactive elements: links, primary buttons, and focus states. Do not use it for large background fills.
3. **Risk colors** map directly to hazard severity and verdict tiers. Use them consistently across score badges, charts, and summary cards — never repurpose them for unrelated UI states.
4. **Contrast**: Ensure text on risk-colored backgrounds meets WCAG AA contrast. Prefer white text on `risk-high` and `risk-extreme`; use dark text on `risk-low` and `risk-moderate`.
5. **Tailwind classes**: Reference tokens as utility classes, e.g. `bg-brand-primary`, `text-risk-moderate`, `border-risk-high`.

## Configuration

Colors are defined in `frontend/tailwind.config.ts` and loaded via `@config` in `frontend/src/app/globals.css`.
