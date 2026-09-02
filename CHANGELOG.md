# Changelog

## [Unreleased]

### Removed

- Interactive property map (Mapbox) from the risk dashboard

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
