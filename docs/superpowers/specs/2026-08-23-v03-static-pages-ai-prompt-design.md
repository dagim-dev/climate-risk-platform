# v0.3 Static Pages and AI Prompt Design

## Scope

This specification covers TODO Steps 64 through 71:

- Commit the completed risk dashboard.
- Build and commit the About and Pricing pages.
- Merge all v0.3-alpha feature branches into `develop` in the prescribed order and tag the release.
- Create the AI summaries branch.
- Design and implement the risk-summary prompt builder.

It does not implement AI API calls, render AI summaries in the frontend, or begin Step 72.

## Branch and Release Workflow

1. Verify the existing risk dashboard, commit it on `feature/risk-dashboard`, and preserve unrelated `FINALREADME.md` as untracked.
2. Create `feature/about-pricing-pages` from the latest remote `develop`.
3. Build and verify the static pages, then commit them using the Step 68 message.
4. Push all four v0.3-alpha branches.
5. Open and merge pull requests into `develop` in this exact order:
   - `feature/app-layout`
   - `feature/address-search-ui`
   - `feature/risk-dashboard`
   - `feature/about-pricing-pages`
6. Pull the merged `develop`, run full frontend verification, create annotated tag `v0.3-alpha`, and push it.
7. Create `feature/ai-risk-summaries` from the updated `develop`.

TODO.md changes are limited to changing completed checklist markers from `[ ]` to `[x]`. No other TODO text, formatting, or ordering will change.

## About Page

The About page will be a server-rendered Next.js page with four sections:

1. A concise mission statement focused on helping property investors, developers, and lenders understand address-level climate exposure.
2. A four-item data-source section:
   - NOAA: weather, heat, and hurricane observations.
   - NASA EarthData: satellite-derived environmental and wildfire signals.
   - FEMA NFHL: flood-zone and flood-hazard information.
   - USGS: supporting geographic and hazard datasets.
3. A methodology overview explaining that source measurements are normalized into 0–100 hazard scores and aggregated into Go, Caution, or Avoid verdicts.
4. A founder section for “Dagim — Founder,” with a short mission-oriented bio and no invented credentials.

The page will use existing brand and risk color tokens after the app-layout branch is merged.

## Pricing Page

The Pricing page will be a responsive three-tier comparison:

- Individual: $49/month.
- Professional: $99/month.
- Business: $500–$5,000/month.

Each tier will define its own feature list in a local typed array and render as a card. “Get Started” controls will be visibly disabled placeholders with an explanation that account and payment functionality arrives in v2.0. An enterprise contact link will point to the future Contact route.

The implementation remains local to the page because two static marketing pages do not justify a shared component library or content-management abstraction.

## Prompt Builder

`backend/app/services/ai/prompt_builder.py` will expose:

```python
def build_risk_prompt(report: ClimateRiskReport) -> tuple[str, str]:
    ...
```

The system prompt will instruct the model to:

- Act as a senior climate-risk analyst writing for property investors.
- Remain factual and direct.
- Name contributing risk factors.
- Produce 150–250 words.
- Avoid unsupported conclusions and professional financial or legal advice.

The user prompt will include:

- Formatted address.
- Flood, hurricane, heat, and wildfire scores and severities.
- Primary factors for each hazard.
- Overall risk score and verdict.
- Explicit requests for a plain-English four-hazard summary, the dominant driver, an “Over the next 10–30 years...” outlook, a justified verdict restatement, and a closing data-attribution line.

The function is pure and performs no network calls, making it deterministic and independently testable.

## Error and Edge-Case Handling

- Empty primary-factor lists will be rendered as “No primary factors reported” instead of producing malformed prompt sections.
- Prompt construction will preserve backend-provided values without silently altering scores or verdicts.
- No AI call is made in this scope, so API failures and model-output validation belong to Step 72 or later.

## Verification

- Static pages: run frontend ESLint and a production Next.js build. No frontend test framework will be added.
- Prompt builder: use test-first pytest coverage. Tests will initially fail because the module does not exist, then pass after implementation.
- Release integration: after all PRs merge, run frontend lint/build on updated `develop` before tagging.
- Git: inspect branch history, PR state, tag state, and working tree after each workflow transition.

