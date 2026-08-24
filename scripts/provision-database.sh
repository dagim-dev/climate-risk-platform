#!/usr/bin/env bash
# Step 87 — Provision managed PostgreSQL (Supabase recommended for MVP).
set -euo pipefail

echo "==> Managed PostgreSQL provisioning (Supabase)"
echo ""
echo "1. Create a free project at https://supabase.com/dashboard"
echo "2. Go to Project Settings → Database → Connection string"
echo "3. Copy the URI connection string (Transaction pooler or Direct)"
echo "4. Convert to asyncpg format for SQLAlchemy:"
echo ""
echo "   postgresql+asyncpg://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
echo ""
echo "5. Store as DATABASE_URL in your secret manager:"
echo "   - Google Cloud: gcloud secrets create DATABASE_URL --replication-policy=automatic"
echo "   - Vercel (if needed): not required — backend only"
echo ""
echo "6. Run migrations against production (Step 90):"
echo "   cd backend && DATABASE_URL='<production-url>' alembic upgrade head"
echo ""
echo "Alternative providers:"
echo "  - AWS RDS: create a PostgreSQL 16 instance, enable public access or VPC peering"
echo "  - Google Cloud SQL: gcloud sql instances create climate-risk-db --database-version=POSTGRES_16"
echo ""

read -r -p "Have you saved DATABASE_URL to your secret manager? [y/N] " DONE
if [[ "${DONE}" =~ ^[Yy]$ ]]; then
  echo "Database provisioning checklist complete."
else
  echo "Complete the steps above, then re-run this script to confirm."
  exit 1
fi
