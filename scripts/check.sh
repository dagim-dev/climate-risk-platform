#!/usr/bin/env bash
# Run the same checks as CI (.github/workflows/ci.yml) before merging into develop.
#
#   scripts/check.sh            # everything
#   scripts/check.sh --quick    # skip Playwright
#
# Stops at the first failing step. Uses the same dummy env vars as CI, so no
# real database or API keys are needed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
QUICK=false
[[ "${1:-}" == "--quick" ]] && QUICK=true

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }

step "Backend tests (pytest)"
(
  cd "$ROOT/backend"
  PYTEST=pytest
  [[ -x .venv/bin/pytest ]] && PYTEST=.venv/bin/pytest
  DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/climate_risk_test \
  GOOGLE_MAPS_API_KEY=test-key \
  OPENAI_API_KEY=test-key \
  JWT_SECRET=test-jwt-secret \
  APP_VERSION=2.0.0 \
    "$PYTEST" tests/ -q
)

step "Frontend lint"
(cd "$ROOT/frontend" && npm run lint)

step "Frontend type check"
(cd "$ROOT/frontend" && npx next typegen && npx tsc --noEmit)

if $QUICK; then
  step "Skipping Playwright (--quick)"
else
  step "Playwright (chromium)"
  (cd "$ROOT/frontend" && NEXT_PUBLIC_API_URL=http://localhost:8000 npx playwright test --project=chromium)
fi

printf '\n\033[1;32mAll checks passed. Safe to merge into develop.\033[0m\n'
