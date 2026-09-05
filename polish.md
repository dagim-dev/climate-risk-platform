# Polish

## Working tree and stray files

- [x] Resolve uncommitted backend changes (`config.py`, `security.py`, `properties.py`, `auth.py`, `main.py`, `TODO.md`) — commit or discard
- [x] Delete root `package.json` and `package-lock.json` (Mapbox was installed at the repo root by mistake)
- [x] Delete untracked `FINALREADME.md` (duplicate of `README.md`)
- [x] Remove Next.js auto-generated `frontend/AGENTS.md` and `frontend/CLAUDE.md` unless you want to keep them

## Strip paid-tier leftovers

- [x] Delete billing API endpoints, services, and schemas
- [x] Remove billing package from `backend/requirements.txt`
- [x] Remove subscription leftovers from the User model and schema
  - [x] Drop billing customer/subscription IDs and `subscription_tier` (or stop exposing them)
  - [x] Add an Alembic migration to drop those columns if you keep the free-product model
- [x] Remove anonymous analysis cap so it matches “unlimited for everyone”
  - [x] Remove `ANONYMOUS_DAILY_ANALYSIS_LIMIT` from `config.py` and `.env.example`
  - [x] Stop calling `enforce_anonymous_analysis_limit` from `/analyze`
  - [x] Delete `backend/app/services/rate_limit.py` and `AnalysisUsage` if nothing else uses them

## Security

- [x] Fix `POST /api/v1/auth/oauth` so it does not issue a JWT without verifying a Google token
- [x] Require a real `JWT_SECRET` in production (do not fall back to `"dev-jwt-secret-change-in-production"`)
- [x] Add `/privacy`, `/terms`, and `/contact` pages, or remove those Footer links
- [x] Add a `LICENSE` file (README claims MIT)
- [x] Escape `address` before interpolating it into the Mapbox popup HTML (`setHTML`)

## Docs, versions, and product story

- [x] Pick one product story (free v2.0) and make all docs match it
- [x] Update `README.md`
  - [x] Replace `YOUR_USERNAME` with the real GitHub org/user
  - [x] Set the version badge to v2.0.0 (not `1.0.0-MVP`)
  - [x] Mark v2.0 features as shipped, not planned
  - [x] Remove paid-tier / subscription language
  - [x] Align the project-structure tree with the actual frontend (auth, properties, pricing, map, trends)
  - [x] Document Mapbox (`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`) and auth env vars
- [x] Update `CHANGELOG.md` with a `[2.0.0]` section
- [x] Set `APP_VERSION` (config default, `.env.example`, deploy workflow) to `2.0.0`
- [x] Align `TODO.md` checkboxes and product-model notes with the actual code after cleanup

## Data-source honesty

- [x] Remove NASA from marketing, About, AI prompts, PDF footer, and attribution until NASA is actually queried
- [x] Remove unused `NASA_API_KEY` (and unused `FEMA_API_KEY` if it is never sent)
- [x] Disclose that historical trend points are synthetic interpolations, or replace them with real checkpoint scores
- [x] Disclose that WUI / fire-weather labels are inferred from fire count and lat/lng, or switch to official datasets

## Production and PDF storage

- [x] Treat cloud deploy as deferred: keep `docs/production-deployment.md` and `deploy.yml` from implying the app is live
- [x] Move PDF storage off local disk (GCS/S3) before deploying to Cloud Run, or document that PDFs are local-only
- [x] Confirm `deploy.yml` secrets and `--allow-unauthenticated` match the intended production posture

## Frontend polish

- [x] Link Pricing from the Header (page exists at `/pricing`)
- [x] Add a mobile nav (current nav is `hidden sm:flex` with no menu)
- [x] Keep `/debug/sentry-test` out of production (backend and frontend)

## Tests

- [x] Add backend tests for auth (register, login, oauth, `/me`)
- [x] Add backend tests for properties CRUD and PDF download
- [x] Run Playwright in GitHub Actions CI
- [x] Add at least one live (or contract) check that FEMA/NOAA responses still parse, if scoring stays mocked
