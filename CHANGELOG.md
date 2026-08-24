# Changelog

## [Unreleased]

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
