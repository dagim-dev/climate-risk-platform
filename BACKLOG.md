# Backlog

Running list of improvements and fixes to make. Add new items at the top of
"Open", move them to "Done" (with the date and commit) when finished.

Format: `- [ ] Short title` followed by indented notes (why, where, decision).

## Open

- [ ] Real 2050 heat outlook
  - Why: the old outlook chart was a straight-line extension of past hot days
    and was removed. Replace it with real climate-model projections, shown as
    a range. Already announced in the header "Next up" panel
    (`frontend/src/lib/roadmap.ts`), so keep the two in sync.
  - Where: a new source module in `backend/app/services/climate/` (plus an
    offline precompute script and storage table), the scoring pipeline
    (`services/scoring/`, `schemas/risk.py` and `frontend/src/types/risk.ts`),
    the dashboard heat card, `docs/data-sources.md` and the methodology page.
  - Notes: NASA NEX-GDDP-CMIP6 (35 CMIP6 models, daily BCSD, 0.25°, daily
    `tasmax`/`tasmin`, historical 1950–2014, SSPs 2015–2100, public S3 bucket
    `nex-gddp-cmip6`; Thrasher et al. 2022, doi:10.1038/s41597-022-01393-4).
    Scenarios SSP2-4.5 and SSP5-8.5. Delta method: per model, days/yr with
    `tasmax` ≥ 32.2°C in 1995–2014 vs 2041–2060; add each change to the heat
    station's observed GSOY `DX90` mean over 1995–2014; report the median and
    10th–90th percentile across models. Warm nights: same with `tasmin` ≥
    23.9°C, but GSOY has no matching count, so the observed baseline needs
    GHCN-Daily `TMIN` (the slow path `heat_data.py` moved away from). Not every
    model has every variable and scenario (paper's Table 2). Precompute for the
    U.S. offline. If the station or model data is missing, return unavailable;
    never fall back to the old straight line. The NASA section in
    `docs/data-sources.md` (S3 paths, 0–360° longitude, Kelvin, v2.0 file
    suffixes) is the starting point.
  - Decision: TBD (store results per 0.25° grid cell or per station; which
    models, all available or a vetted subset; whether warm nights ship in the
    first version; whether the "today" figure is the heat score's 30-year
    average or the 1995–2014 baseline the delta is added to).

- [ ] Use the source cache as a real cache
  - Why: the cache table is only read when a live fetch fails, so every search
    waits on four slow government APIs. Flood zones and 50-year storm history
    do not change hour to hour.
  - Where: `backend/app/services/climate/source_cache.py`, `fetch_with_cache`.
  - Notes: check the cache first and return the row when it is younger than a
    per-source "fresh" age; otherwise fetch live as now. Keep the existing
    stale fallback for outages. Related to the `STALE_TTL` review below.
  - Decision: TBD (fresh age per source; whether a fresh cache hit is shown
    as `ok` with its `as_of` date).

- [ ] Stream the analysis result
  - Why: one request waits for everything, including an OpenAI call that can
    take up to 20 seconds, while most of the data is ready in a few seconds.
  - Where: `backend/app/api/v1/endpoints/risk.py`, `services/ai/`,
    `frontend/src/lib/api-client.ts`, `use-address-search.ts`, dashboard
    components.
  - Notes: simpler version: `/analyze` returns the scores straight away and
    the summary comes from a second endpoint. Fuller version: Server-Sent
    Events, with the frontend filling in cards as each source finishes.
  - Decision: TBD (two endpoints vs. SSE).

- [ ] Tighten backend CI (ruff, mypy, coverage threshold)
  - Why: the frontend is linted and type-checked on every push, but the
    backend only runs tests.
  - Where: `backend/requirements-dev.txt`, new `backend/pyproject.toml`,
    `.github/workflows/ci.yml`, coverage badge in `README.md`.
  - Notes: fix what the tools flag, then add `--cov-fail-under` to the pytest
    step.
  - Decision: TBD (coverage threshold; how strict mypy should be).

- [ ] Automate deploy on version tags
  - Why: deploys and migrations are done by hand, which is easy to get wrong
    or forget.
  - Where: `.github/workflows/deploy.yml`.
  - Notes: trigger on `v*` tags, run `alembic upgrade head` before the Cloud
    Run deploy, and set `APP_VERSION` from the tag (the live `/health` still
    reports 2.0.0). Needs GCP and Vercel credentials added as GitHub secrets.
    Also bump the hardcoded 2.0.0 in `core/config.py`, `ci.yml`,
    `infrastructure/` and `frontend/package.json`.

- [ ] Trim unused backend dependencies
  - Why: a smaller Docker image, faster builds and fewer security advisories.
  - Where: `backend/requirements.txt`, `backend/app/services/pdf/generator.py`.
  - Notes (checked 2026-11-09): keep `psycopg2-binary`, Alembic uses it
    (`core/database_url.py`). `xhtml2pdf` is only the fallback when WeasyPrint
    fails; the Docker image already installs WeasyPrint's system libraries.
    `python-dotenv` and the direct `requests` pin look unused in app code
    (`google-auth` needs `requests`). Confirm each, remove, run the tests and
    build the image to check PDFs still render.
  - Decision: TBD (keep or drop the `xhtml2pdf` fallback).

- [ ] Let users delete their own accounts
  - Why: today account deletion only happens when a user emails me and I do it
    by hand. Users should be able to do it themselves.
  - Where: backend auth/users endpoints (`app/api/`, `api/deps.py`
    `get_current_user`), plus a delete option in the frontend account area.
  - Notes: should also remove the user's saved properties (stored reports).
    Sign the user out afterwards. Update the privacy policy/contact copy that
    says to email for deletion.
  - Decision: TBD (confirmation step, hard vs. soft delete).

- [ ] Review stale-cache age limits per climate source
  - Where: `backend/app/services/climate/source_cache.py`, `STALE_TTL`.
  - What it controls: the cached copy is only used when the live fetch fails.
    Every successful request overwrites it. So the limit is "how old a copy we
    will still show (marked stale) when the provider is down".
  - Current values (verified 2026-11-08):
    - FEMA flood (`fema_nfhl_v2`): 30 days
    - Hurricane, IBTrACS (`ibtracs_v2`): 7 days
    - Wildfire, WHP + NIFC (`wfigs_whp_v2`): 7 days
    - Heat, NOAA GSOY DX90 (`noaa_heat_dx90_v2`): 24 hours
  - Decision: TBD (new values + reasoning).

## Done

- [x] Add a methodology page (2026-11-09, d9d9a3f, 9157dbd on `feature/methodology-page`)
  - Why: the scoring rules and data-honesty rule are only visible in the code.
    Showing them builds user trust and shows how the model works.
  - Where: new `frontend/src/app/(site)/methodology/page.tsx`; link from each
    score card and the footer.
  - Notes: for each hazard, give the formula, the source and the known limits.
    Take the content from `docs/data-sources.md` and the scorer constants in
    `backend/app/services/scoring/`. Say plainly that the 2030–2050 outlook is
    a linear projection.
  - Done: hard-coded page from the scorer constants; linked from the footer,
    every score card, Terms and About (About's stale scoring bullets replaced).
    Playwright test in `tests/e2e/methodology.spec.ts`. Merged into `develop` in ff6e68d.
