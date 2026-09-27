# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Monorepo for an address-level climate risk tool: `backend/` (FastAPI, Python 3.12, async SQLAlchemy + Alembic, PostgreSQL) and `frontend/` (Next.js App Router, TypeScript, Tailwind, NextAuth v5). A user enters a U.S. address and gets four hazard scores (flood, hurricane, heat, wildfire), an overall score, a Go / Caution / Avoid verdict and an OpenAI-generated summary. The product is free; there is no paid tier or feature gating (billing code was removed on purpose, so don't reintroduce it).

Versions: Next 16, React 19, Tailwind 4 (palette in `globals.css` `@theme`, no `tailwind.config.ts`), Auth.js v5 beta. `next.config.ts` pins `turbopack.root`; without it dev output leaks into `frontend/frontend/.next`.

## Commands

Backend (run from `backend/`, with `.venv` activated):

```bash
pip install -r requirements-dev.txt          # runtime deps + pytest/aiosqlite
uvicorn app.main:app --reload --port 8000
alembic upgrade head
alembic revision -m "description"           # new migration in alembic/versions/
pytest tests/ -v                             # full suite
pytest tests/test_risk_scoring.py -v         # one file
pytest tests/test_risk_scoring.py::test_name # one test
pytest tests/ --cov=app --cov-report=term-missing
```

Backend tests need no real Postgres or API keys. The `client` fixture in `tests/conftest.py` swaps `get_db` for a temp SQLite (aiosqlite) database. External HTTP calls are mocked with `unittest.mock.patch`/`AsyncMock`. CI sets dummy `DATABASE_URL`, `GOOGLE_MAPS_API_KEY`, `OPENAI_API_KEY` and `JWT_SECRET` env vars.

Frontend (run from `frontend/`):

```bash
npm run dev
npm run build
npm run lint
npx playwright test --project=chromium                       # what CI runs
npx playwright test tests/e2e/address-search.spec.ts --project=chromium
```

Playwright starts `npm run dev` itself with `E2E_AUTH_BYPASS=true`, which makes `src/proxy.ts` (Next 16's renamed middleware) skip auth redirects. E2E tests mock the backend with `page.route` (see `tests/e2e/fixtures.ts`), so no backend has to be running.

Full stack: `docker-compose up --build` from the repo root (the backend container runs `alembic upgrade head` on start and talks to Postgres at `db:5432`).

## Backend architecture

`POST /api/v1/analyze` (`app/api/v1/endpoints/risk.py`) is the core flow:

1. `services/geocoding.py` turns the address into `Coordinates` (Google Maps). A `ValueError` becomes an HTTP 400.
2. `services/scoring/aggregator.build_risk_report` fetches the four climate sources concurrently with `asyncio.gather`. There is one module per source in `services/climate/`.
3. Each climate fetcher returns a `SourceResult` (`status` is `ok`, `stale` or `unavailable`) via `source_cache.fetch_with_cache`. It tries the live fetch and persists the payload to the `climate_source_cache` table, keyed by source and a lat/lon cell quantized to 0.01°. If the live fetch fails, it falls back to the cached row when that row is within the source's `STALE_TTL`. If a fetcher's data model or query changes, bump its `SOURCE_*` key string in `source_cache.py` so old cache rows are not reused.
4. `scoring/hazard_utils.score_hazard_from_source` runs the per-hazard scorer (`*_scorer.py`) or produces an "unavailable" `HazardScore` with `score=None`.
5. `compute_overall_score` takes a weighted average (flood 0.30, hurricane 0.30, heat 0.20, wildfire 0.20) over the available hazards only, so the status can be `complete`, `partial` or `unavailable`. `compute_verdict` gives **no verdict unless all four hazards were assessed**. A single hazard at or above 70 raises "Go" to "Caution", with a `verdict_reason`.
6. `trend_builder` emits today's scores plus linear projections for 2030/2040/2050 (`is_projection=True`). No history is back-filled, and an unassessed hazard is `null` in every point, never 0.
7. The AI summary (`services/ai/`) is best-effort. If it fails, `ai_summary` is set to `None` and the request still succeeds.

Data honesty is a deliberate product rule, and recent commits enforce it. Never fabricate or default a score when a source is missing: surface it as unavailable. For flood, zone D and points with no NFHL polygon raise `FloodZoneUndetermined` (unavailable, no mirror fallback); a miss on the reduced-set mirror is scored minimal with Low confidence. Heat prefers a nearby first-order (`GHCND:USW`) station at a similar elevation. NASA is documented but not queried. See `docs/data-sources.md` for endpoints, zone scoring and station selection. Verify data changes against live APIs with real addresses; `hazards.fema.gov` resets connections from some networks, so the Esri mirror is what runs there.

Other backend pieces:
- Auth: the backend issues its own JWTs (`core/security.py`, `JWT_SECRET`, which is required in production). `api/deps.py` provides `get_current_user` and `get_optional_user`. `POST /auth/oauth` verifies a Google ID token (`core/google_oauth.py`) before issuing a JWT.
- Saved properties store the full report. PDFs (`services/pdf/`) are rendered from `templates/report.html`, written to local disk (`PDF_STORAGE_DIR`) and served through signed download tokens.
- Settings come from `core/config.py` (pydantic-settings, reading `backend/.env`).

## Frontend architecture

- Pages under `src/app/(site)/` share the Header/Footer layout. `src/app/report/` is the standalone printable report and is public. It reads the last report from `sessionStorage` via `useStoredReport()` (`lib/report-storage.ts`, hydration-safe `useSyncExternalStore`).
- All backend calls go through `src/lib/api-client.ts`, using `NEXT_PUBLIC_API_URL` + `/api/v1`.
- NextAuth (`src/auth.config.ts`): the Credentials provider calls the backend's `/auth/login`, and Google sign-in posts the `id_token` to the backend's `/auth/oauth`. The backend JWT is kept on the session as `accessToken` and sent as a Bearer token for saved properties and PDFs. `proxy.ts` protects `/properties` and hides `/debug` in production. The session ends when the backend JWT expires. Signed PDF links are requested fresh each time (never stored).
- `src/types/risk.ts` mirrors `backend/app/schemas/risk.py`. Keep them in sync, including nullable `score`/`verdict` and `status` fields.

## Workflow conventions (from TODO.md)

- `develop` is the integration branch. Cut a `feature/*` or `fix/*` branch from `develop` and merge locally back into `develop`. Don't open PRs unless necessary. `main` is release-only and tagged.
- Commit messages follow Conventional Commits: `type(scope): description`, with types `feat`, `fix`, `chore`, `ci`, `test`, `docs` and `refactor`.
- Production deploy (Vercel + Cloud Run) is scaffolding only (`deploy.yml` is manual). Don't assume deployed URLs exist.
