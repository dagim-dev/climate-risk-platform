# Changelog

## [Unreleased]

### Removed

- The Risk Outlook chart is gone from the dashboard and printable report. Its
  2030–2050 points were straight-line estimates from today's scores, not
  climate projections. Reports you saved earlier still open and download as PDFs.

### Changed

- README rewritten around the live app (data-honesty rules, architecture,
  endpoint list, known limits); `docs/production-deployment.md` marked live

## [2.2.0] - 2026-11-09

### Added

- Methodology page explaining how each hazard is scored, linked from the footer,
  score cards, terms and about pages
- Homepage redesign: theme tokens, fonts and dark mode; shared UI primitives and
  hazard icons; restyled dashboard, printable report, saved properties, sign-in
  and content pages
- U.S.-framed Earth hero built from NASA Blue Marble and NOAA GOES imagery, with
  drifting clouds and an address pin; lighter images are served to phones
- Clickable example addresses by hazard (Hurricane, Flood, Wildfire, Heat, Lower
  risk) and a Google Maps link for finding an address
- "Warming up" message when a search is slow; the home page pings `/health` so an
  idle Cloud Run instance starts early
- ClimateRisk pin logo in the header, footer, report, PDF and app icons

### Security

- `/analyze` is rate limited per IP (10 per minute, 100 per day, configurable)
  and addresses are capped at 300 characters; the unused public `/geocode`
  endpoint was removed and Cloud Run is capped at 3 instances
- Saved reports are size-checked (text trimmed, lists and coordinates
  range-checked), each user can save up to 200 properties, and request bodies
  over 256 KB get a 413
- Backend dependencies upgraded to clear every pip-audit finding; `python-jose`
  replaced by PyJWT (same HS256 tokens, existing sessions keep working)
- Next.js upgraded to 16.4.5 and `@sentry/nextjs` to 10.78, past critical image
  optimizer advisories

### Changed

- Privacy policy rewritten and terms finalized for Google OAuth review
- `docs/data-sources.md` updated to match flood scoring, zone D caching and the
  heat outlook in code

### Removed

- `cobe` globe dependency

## [2.1.0] - 2026-10-01

### Fixed

- Flood: shaded zone X (0.2% / levee) was scored as minimal; `STATIC_BFE` -9999 was
  shown as a real elevation; A99/AR zones ranked below X; zone D and areas with no
  FEMA map were reported as confirmed minimal risk (now unavailable / Low confidence)
- Hurricane: storm peak wind overwrote segment wind, inflating close-pass counts
- Heat: trend slope ignored gaps in the record; unrepresentative co-op and valley
  gauges were chosen (Miami Beach, Honolulu); factor text claimed a fixed 30 years
- Wildfire: an NIFC outage discarded the USFS WHP score
- Cache write/read failures no longer drop live data or cause a 500; provider
  errors shown to users no longer include upstream URLs
- Geocoding provider/key failures return 502 instead of "bad address"
- Google sign-in requires a verified email before linking accounts; emails are
  case-insensitive; PDF tokens are rejected as access tokens
- PDF links are issued fresh (no stored expired links) and stop working once a
  property is deleted; the PDF file is removed with the property
- Frontend: "Today" marker drawn at 2000; second-search errors lost; properties page
  stuck loading; expired sessions looked signed in; open redirect on sign-in;
  hydration-unsafe report page; null severity shown as "Moderate"; sign-up crash on
  validation errors; Next.js dev output written to `frontend/frontend/.next`
- asyncpg's statement cache is disabled for Postgres so the backend works behind
  Supabase's transaction pooler

### Changed

- Trend chart is now a "Risk Outlook": today's scores plus labelled linear
  projections; no back-filled history, unassessed hazards not plotted
- Removed the 56-point coastline heuristic (+10 flood / +10 hurricane); it missed
  most of the coast. Hurricane exposure comes from IBTrACS pass counts alone
- `/report` is public; saved properties and PDFs still need an account
- `middleware.ts` renamed to `proxy.ts` (Next.js 16); Tailwind palette moved to `@theme`
- Test-only Python packages moved to `requirements-dev.txt`
- Docker image installs WeasyPrint's system libraries and runs as non-root;
  Compose waits for Postgres and runs migrations on start
- `properties.pdf_url` column dropped (migration `a7b8c9d0e1f2`)
- PDFs are rendered on demand for each download instead of being stored on disk
- Backend source deploys use a `.gcloudignore` that excludes `.env` and `.venv`

### Removed

- Interactive property map (Mapbox) from the risk dashboard
- Obsolete planning docs (`polish.md`, `docs/superpowers/`), default Next.js SVGs,
  unused Geist font downloads, unused `getCurrentUser` / `TokenResponse`

## [2.0.0] - 2026-08-26

### Added

- Email/password and Google OAuth authentication (Google ID tokens are verified before a JWT is issued)
- Saved properties CRUD and signed PDF downloads
- Server-generated PDF reports (local disk storage)
- Historical trend chart with interpolated past points and projected future years
- Interactive Mapbox property map with FEMA flood zone overlay
- Privacy, Terms, and Contact pages
- MIT LICENSE
- Backend tests for auth, properties, and FEMA/NOAA response parsing
- Playwright job in GitHub Actions CI

### Changed

- Product is free for everyone: subscription tiers and anonymous analysis caps removed
- App version is `2.0.0`
- Production `JWT_SECRET` is required (development default is rejected)
- Attribution names NOAA, FEMA, and USGS only (NASA is not queried)
- Cloud deploy remains deferred; `deploy.yml` is manual (`workflow_dispatch`)

### Notes

- PDFs are local-only until object storage is added
- Historical trend points are interpolations, not independent checkpoint scores
- WUI / fire-weather labels are inferred from fire count and lat/lng

## [1.0.0] - 2026-08-24

### Added

- Four-hazard climate risk scoring (flood, hurricane, heat, wildfire) with Go/Caution/Avoid verdict
- AI-generated plain-English risk summaries via OpenAI
- Printable risk report export
- Playwright end-to-end tests for address search, dashboard, and report flow
- Sentry error monitoring for FastAPI backend and Next.js frontend
- GitHub Actions `deploy.yml` workflow (tests, Vercel frontend, Cloud Run backend)
- Production deployment scaffolding: Vercel config, Cloud Run service definition, provisioning scripts
- Local development guide in `README.md`

### Notes

- v1.0.0 MVP is **local-ready**. Production cloud deployment is deferred; see
  `docs/production-deployment.md` when provisioning infrastructure.
