#!/usr/bin/env bash
# Step 87 — Connect the GitHub repo to Vercel and enable auto-deploy from main.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"

echo "==> Vercel frontend provisioning"
echo ""
echo "Prerequisites:"
echo "  - Vercel CLI installed: npm i -g vercel"
echo "  - Logged in: vercel login"
echo ""

if ! command -v vercel >/dev/null 2>&1; then
  echo "ERROR: vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

cd "${FRONTEND_DIR}"

echo "==> Linking project (run once)"
echo "    When prompted:"
echo "      - Set root directory to: frontend"
echo "      - Framework preset: Next.js"
vercel link

echo ""
echo "==> Configure production branch"
echo "    In Vercel Dashboard → Project Settings → Git:"
echo "      - Production Branch: main"
echo "      - Auto-deploy on push: enabled"
echo ""

echo "==> Set production environment variables (Step 88)"
echo "    Run these commands and paste real values when prompted:"
echo ""
echo "  vercel env add NEXT_PUBLIC_API_URL production"
echo "  vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production"
echo ""
echo "    NEXT_PUBLIC_API_URL should be: https://api.climaterisk.io"
echo ""

read -r -p "Deploy a production preview now? [y/N] " DEPLOY_NOW
if [[ "${DEPLOY_NOW}" =~ ^[Yy]$ ]]; then
  vercel --prod
  echo ""
  echo "Frontend deployed. Verify at the URL printed above."
fi

echo ""
echo "Done. Every push to main will auto-deploy via Vercel Git integration."
