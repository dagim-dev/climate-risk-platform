# v0.3 Static Pages and AI Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete TODO Steps 64–71 by committing the dashboard, shipping and releasing the v0.3-alpha frontend, and implementing a tested AI risk-summary prompt builder.

**Architecture:** Keep the two marketing pages as independent Next.js server components with page-local typed content. Keep prompt construction as a deterministic Python function that accepts `ClimateRiskReport` and returns system/user prompt strings without network access.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Tailwind CSS 4, Python 3.9, Pydantic 2, pytest 8, GitHub CLI.

## Global Constraints

- Follow the repository workflow in TODO.md: feature branches start from `develop`, PRs merge into `develop`, and release tags are created on `develop`.
- Preserve `FINALREADME.md` as untracked; never stage or commit it.
- Change TODO.md checkbox states only; do not alter its text, formatting, or ordering.
- Do not add a frontend test framework. Verify static pages with ESLint and a production build.
- Do not implement Step 72 or make an OpenAI API call.

## File Map

- Modify `frontend/src/app/page.tsx`: retain the completed dashboard integration for Step 64.
- Create `frontend/src/app/about/page.tsx`: mission, sources, methodology, and founder content.
- Create `frontend/src/app/pricing/page.tsx`: three pricing tiers and enterprise contact link.
- Create `backend/tests/test_prompt_builder.py`: behavioral prompt-builder coverage.
- Create `backend/app/services/ai/__init__.py`: mark the AI service package.
- Create `backend/app/services/ai/prompt_builder.py`: pure prompt-construction function.
- Modify `TODO.md`: checkbox state updates only after verification.

---

### Task 1: Commit the Risk Dashboard (Step 64)

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/dashboard/LoadingSkeleton.tsx`
- Create: `frontend/src/components/dashboard/RiskDashboard.tsx`
- Create: `frontend/src/components/dashboard/ScoreCard.tsx`
- Create: `frontend/src/components/dashboard/VerdictBadge.tsx`
- Create: `frontend/src/lib/risk-styles.ts`

**Interfaces:**
- Consumes: `ClimateRiskReport`, `AddressSearch`, and `Severity`/`Verdict` types from the address-search branch.
- Produces: a home page that renders loading and completed dashboard states.

- [ ] **Step 1: Verify the existing dashboard**

Run:

```bash
cd frontend
npm run lint
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 2: Review the exact commit set**

Run:

```bash
git status --short
git diff -- frontend/src/app/page.tsx
```

Expected: only the dashboard files, home page, approved planning documents, TODO checkbox updates, and unrelated untracked `FINALREADME.md` are visible.

- [ ] **Step 3: Commit only dashboard implementation files**

```bash
git add frontend/src/app/page.tsx \
  frontend/src/components/dashboard/LoadingSkeleton.tsx \
  frontend/src/components/dashboard/RiskDashboard.tsx \
  frontend/src/components/dashboard/ScoreCard.tsx \
  frontend/src/components/dashboard/VerdictBadge.tsx \
  frontend/src/lib/risk-styles.ts
git commit -m "feat(frontend): build risk dashboard with score cards, verdict badge, and loading skeleton"
```

Expected: commit succeeds and `FINALREADME.md` remains untracked.

### Task 2: Create the Static Pages Branch (Step 65)

**Files:** No source files change.

**Interfaces:**
- Consumes: updated `origin/develop`.
- Produces: `feature/about-pricing-pages`.

- [ ] **Step 1: Preserve TODO checkbox changes while switching branches**

```bash
git stash push -m "TODO checkbox updates" -- TODO.md
git checkout develop
git pull origin develop
git checkout -b feature/about-pricing-pages
git stash pop
```

Expected: current branch is `feature/about-pricing-pages`; TODO.md contains only checkbox changes.

### Task 3: Build the About Page (Step 66)

**Files:**
- Create: `frontend/src/app/about/page.tsx`

**Interfaces:**
- Consumes: existing Tailwind brand/risk tokens after Step 69 merges app-layout.
- Produces: static `/about` route.

- [ ] **Step 1: Create the page with local source data**

Implement:

```tsx
const dataSources = [
  { name: "NOAA", detail: "Weather observations, extreme heat records, and hurricane history." },
  { name: "NASA EarthData", detail: "Satellite-derived environmental and wildfire signals." },
  { name: "FEMA NFHL", detail: "Official flood-zone and flood-hazard information." },
  { name: "USGS", detail: "Geographic and hazard datasets that support location-level analysis." },
] as const;

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-brand-primary px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-accent">About ClimateRisk</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Better property decisions start with clearer climate data.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">ClimateRisk helps investors, developers, and lenders understand address-level climate exposure before capital is committed.</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold text-brand-primary">Data sources</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {dataSources.map((source) => (
            <article key={source.name} className="rounded-lg border border-zinc-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-brand-primary">{source.name}</h3>
              <p className="mt-2 leading-7 text-zinc-600">{source.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-zinc-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-semibold text-brand-primary">How scoring works</h2>
          <p className="mt-5 leading-8 text-zinc-700">Flood, hurricane, heat, and wildfire measurements are normalized into 0–100 hazard scores. Weighted scores produce an overall result and a Go, Caution, or Avoid verdict.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-semibold text-brand-primary">Founder</h2>
        <div className="mt-6 rounded-lg border border-zinc-200 p-6">
          <h3 className="text-xl font-semibold text-brand-primary">Dagim — Founder</h3>
          <p className="mt-3 leading-7 text-zinc-600">Dagim founded ClimateRisk to make fragmented public climate data practical for consequential property decisions, turning complex hazard signals into clear and actionable risk intelligence.</p>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Verify the About route compiles**

Run: `cd frontend && npm run lint && npm run build`

Expected: exit 0 and build output includes `/about`.

### Task 4: Build and Commit the Pricing Page (Steps 67–68)

**Files:**
- Create: `frontend/src/app/pricing/page.tsx`

**Interfaces:**
- Produces: static `/pricing` route with disabled v2.0 CTAs.

- [ ] **Step 1: Create typed pricing data and page**

Implement:

```tsx
import Link from "next/link";

const tiers = [
  { name: "Individual", price: "$49", suffix: "/month", features: ["10 property analyses per month", "Four-hazard risk dashboard", "Go / Caution / Avoid verdict"] },
  { name: "Professional", price: "$99", suffix: "/month", features: ["50 property analyses per month", "Everything in Individual", "Priority data refreshes"], featured: true },
  { name: "Business", price: "$500–$5,000", suffix: "/month", features: ["Custom analysis volume", "Portfolio-scale workflows", "Dedicated support"] },
] as const;

export default function PricingPage() {
  return (
    <div className="bg-zinc-50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl">Plans for every property workflow</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">Choose the analysis capacity that matches how your team evaluates climate exposure.</p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className={`flex flex-col rounded-xl border bg-white p-7 text-left shadow-sm ${tier.featured ? "border-brand-accent ring-2 ring-brand-accent/20" : "border-zinc-200"}`}>
              <h2 className="text-xl font-semibold text-brand-primary">{tier.name}</h2>
              <p className="mt-4"><span className="text-3xl font-bold text-brand-primary">{tier.price}</span><span className="text-zinc-500">{tier.suffix}</span></p>
              <ul className="mt-6 flex-1 space-y-3 text-zinc-700">
                {tier.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
              </ul>
              <button type="button" disabled title="Available in v2.0" className="mt-8 rounded-md bg-brand-primary px-5 py-3 font-semibold text-white opacity-60 cursor-not-allowed">Get Started</button>
            </article>
          ))}
        </div>
        <p className="mt-10 text-zinc-600">Need an enterprise plan? <Link href="/contact" className="font-semibold text-brand-primary underline">Contact us</Link>.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify both static routes**

Run: `cd frontend && npm run lint && npm run build`

Expected: exit 0 and build output includes `/about` and `/pricing`.

- [ ] **Step 3: Commit static pages**

```bash
git add frontend/src/app/about/page.tsx frontend/src/app/pricing/page.tsx
git commit -m "feat(frontend): add about and pricing pages with feature comparison table"
```

### Task 5: Merge and Tag v0.3-alpha (Step 69)

**Files:**
- Modify: `TODO.md` (checkboxes only, after successful release verification).

**Interfaces:**
- Produces: merged `develop`, four merged PRs, and pushed `v0.3-alpha` tag.

- [ ] **Step 1: Push feature branches**

```bash
git push -u origin feature/app-layout
git push -u origin feature/address-search-ui
git push -u origin feature/risk-dashboard
git push -u origin feature/about-pricing-pages
```

- [ ] **Step 2: Open and merge PRs sequentially**

For each branch, run `gh pr create --base develop --head <branch>` with a summary and lint/build test plan, wait for required checks, then run `gh pr merge <url> --merge`. Use this order:

1. `feature/app-layout`
2. `feature/address-search-ui`
3. `feature/risk-dashboard`
4. `feature/about-pricing-pages`

Before each later merge, update its branch from the newly merged `develop` if GitHub reports conflicts.

- [ ] **Step 3: Verify integrated develop**

```bash
git checkout develop
git pull origin develop
cd frontend
npm run lint
npm run build
```

Expected: both commands exit 0 and routes include `/`, `/about`, and `/pricing`.

- [ ] **Step 4: Tag and push the release**

```bash
git tag -a v0.3-alpha -m "v0.3-alpha: complete frontend with address search, risk dashboard, and verdict badge"
git push origin v0.3-alpha
```

### Task 6: Create the AI Summaries Branch (Step 70)

**Files:** No source files change.

- [ ] **Step 1: Create the branch from released develop**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ai-risk-summaries
```

### Task 7: Test-Drive the Prompt Builder (Step 71)

**Files:**
- Create: `backend/tests/test_prompt_builder.py`
- Create: `backend/app/services/ai/__init__.py`
- Create: `backend/app/services/ai/prompt_builder.py`

**Interfaces:**
- Consumes: `ClimateRiskReport`.
- Produces: `build_risk_prompt(report: ClimateRiskReport) -> tuple[str, str]`.

- [ ] **Step 1: Write the failing tests**

```python
from app.schemas.risk import ClimateRiskReport, HazardScore
from app.services.ai.prompt_builder import build_risk_prompt


def _hazard(score: int, severity: str, factors: list[str]) -> HazardScore:
    return HazardScore(score=score, severity=severity, confidence="High", primary_factors=factors)


def _report() -> ClimateRiskReport:
    return ClimateRiskReport(
        address="123 Ocean Dr, Miami Beach, FL",
        latitude=25.79,
        longitude=-80.13,
        flood_risk=_hazard(82, "High", ["FEMA AE flood zone"]),
        hurricane_risk=_hazard(91, "Extreme", ["45 historical storms"]),
        heat_risk=_hazard(63, "Moderate", ["Increasing extreme heat days"]),
        wildfire_risk=_hazard(12, "Low", []),
        overall_risk_score=72,
        verdict="Avoid",
        generated_at="2026-08-23T12:00:00+00:00",
    )


def test_build_risk_prompt_includes_role_length_and_style_rules():
    system_prompt, _ = build_risk_prompt(_report())
    assert "senior climate risk analyst" in system_prompt.lower()
    assert "property investors" in system_prompt.lower()
    assert "150–250 words" in system_prompt
    assert "factual" in system_prompt.lower()


def test_build_risk_prompt_includes_report_values_and_requested_sections():
    _, user_prompt = build_risk_prompt(_report())
    for value in ["123 Ocean Dr", "Flood: 82/100", "Hurricane: 91/100", "Heat: 63/100", "Wildfire: 12/100", "Avoid", "FEMA AE flood zone", "45 historical storms"]:
        assert value in user_prompt
    assert "Over the next 10–30 years..." in user_prompt
    assert "NOAA, NASA EarthData, FEMA NFHL, and USGS" in user_prompt
    assert "No primary factors reported" in user_prompt
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
cd backend
.venv/bin/pytest tests/test_prompt_builder.py -v
```

Expected: collection fails with `ModuleNotFoundError: No module named 'app.services.ai'`.

- [ ] **Step 3: Implement the minimal prompt builder**

```python
from app.schemas.risk import ClimateRiskReport, HazardScore


def _format_hazard(name: str, hazard: HazardScore) -> str:
    factors = ", ".join(hazard.primary_factors) or "No primary factors reported"
    return (
        f"{name}: {hazard.score}/100 ({hazard.severity}; "
        f"confidence: {hazard.confidence}). Primary factors: {factors}."
    )


def build_risk_prompt(report: ClimateRiskReport) -> tuple[str, str]:
    system_prompt = (
        "Act as a senior climate risk analyst writing for property investors. "
        "Write a factual, direct assessment that names contributing risk factors. "
        "Keep the response between 150–250 words. Do not invent facts or present "
        "the analysis as professional financial or legal advice."
    )
    hazard_lines = "\n".join(
        [
            _format_hazard("Flood", report.flood_risk),
            _format_hazard("Hurricane", report.hurricane_risk),
            _format_hazard("Heat", report.heat_risk),
            _format_hazard("Wildfire", report.wildfire_risk),
        ]
    )
    user_prompt = f"""Analyze climate risk for {report.address}.

{hazard_lines}
Overall climate risk score: {report.overall_risk_score}/100.
Verdict: {report.verdict}.

Write:
1. A plain-English summary covering all four hazards.
2. The single biggest risk driver for this address.
3. A forward-looking statement beginning exactly: "Over the next 10–30 years..."
4. A restatement of the {report.verdict} verdict with justification.
5. A closing attribution naming NOAA, NASA EarthData, FEMA NFHL, and USGS.
"""
    return system_prompt, user_prompt
```

- [ ] **Step 4: Run focused and full backend tests**

Run:

```bash
cd backend
.venv/bin/pytest tests/test_prompt_builder.py -v
.venv/bin/pytest -v
```

Expected: all tests pass.

- [ ] **Step 5: Update TODO checkboxes only**

Change the completed checkbox lines for Steps 66, 67, 69, and 71 from `[ ]` to `[x]`. Retain all other TODO content byte-for-byte.

