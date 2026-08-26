# Production Deployment Guide

> **Status: deferred.** This document is scaffolding for a future cloud
> deploy. The application is **not live**. Local Docker Compose is the
> supported runtime. `deploy.yml` is `workflow_dispatch` only.

This guide covers provisioning cloud infrastructure, configuring production
environment variables, and setting up custom domains with SSL — when you
choose to go live.

## Architecture (planned, not live)

| Component | Provider | Planned URL |
|-----------|----------|-------------|
| Frontend (Next.js) | Vercel | `https://climaterisk.io` |
| Backend (FastAPI) | Google Cloud Run | `https://api.climaterisk.io` |
| Database (PostgreSQL) | Supabase | Managed connection string |

Do not treat those hostnames as a running product. The GitHub Actions
deploy workflow does **not** run on push to `main`.

## PDF storage (local-only today)

Generated PDFs are written to `PDF_STORAGE_DIR` on the backend filesystem
(`storage/pdfs` by default) and downloaded via short-lived JWT URLs. Cloud
Run disks are ephemeral, so PDFs will not survive new revisions.

**Before a real Cloud Run deploy:** move PDF storage to GCS or S3, or
document that PDF downloads are session-local and may disappear.

## Public API posture

`--allow-unauthenticated` on Cloud Run is intentional: `/health`,
`POST /api/v1/geocode`, and `POST /api/v1/analyze` are public. Saved
properties, PDF generation, and `/auth/me` still require a JWT.

Production **must** set a real `JWT_SECRET` (the development default is
rejected at startup). Also set `GOOGLE_CLIENT_ID` if Google sign-in is
enabled.

---

## Step 87 — Provision Cloud Infrastructure

### Frontend (Vercel)

```bash
chmod +x scripts/provision-vercel.sh
./scripts/provision-vercel.sh
```

In the Vercel Dashboard:

1. Import the GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Set **Production Branch** to `main`.
4. Enable automatic deployments on push.

The `frontend/vercel.json` file configures the Next.js build settings.

### Backend (Google Cloud Run)

```bash
export GCP_PROJECT_ID=your-gcp-project-id
chmod +x scripts/provision-cloud-run.sh
./scripts/provision-cloud-run.sh
```

Cloud Run was chosen for simplicity: it runs the existing `backend/Dockerfile`
with no additional orchestration. The service definition lives in
`infrastructure/cloud-run-service.yaml`.

### Database (Supabase)

```bash
chmod +x scripts/provision-database.sh
./scripts/provision-database.sh
```

Follow the prompts to create a Supabase project and store the `DATABASE_URL`
in Google Secret Manager.

---

## Step 88 — Configure Production Environment Variables

**Never commit secrets to the repository.** Use each provider's secret manager.

### Backend secrets (Google Secret Manager)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API key |
| `OPENAI_API_KEY` | OpenAI API key for AI summaries |
| `NOAA_API_KEY` | NOAA Climate Data Online token |
| `JWT_SECRET` | Required unique secret; production refuses the development default |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID used to verify ID tokens |
| `CORS_ORIGINS` | `https://climaterisk.io,https://www.climaterisk.io` |
| `ENVIRONMENT` | `production` |
| `APP_VERSION` | `2.0.0` |

Create secrets:

```bash
gcloud secrets create DATABASE_URL --replication-policy=automatic
echo -n 'postgresql+asyncpg://...' | gcloud secrets versions add DATABASE_URL --data-file=-
# Repeat for GOOGLE_MAPS_API_KEY, OPENAI_API_KEY, NOAA_API_KEY, JWT_SECRET, GOOGLE_CLIENT_ID
```

See `infrastructure/production.env.example` for the full template.

### Frontend secrets (Vercel Environment Variables)

Set in Vercel Dashboard → Project → Settings → Environment Variables (Production scope):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.climaterisk.io` |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox public token for the property map |
| `AUTH_SECRET` | NextAuth secret |
| `NEXTAUTH_URL` | Production frontend origin |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app credentials |

Or via CLI:

```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
```

### CORS configuration

The backend reads `CORS_ORIGINS` from the environment (comma-separated list).
In production this must include the Vercel frontend domain:

```
CORS_ORIGINS=https://climaterisk.io,https://www.climaterisk.io
```

This is configured in `backend/app/core/config.py` and applied in
`backend/app/main.py`.

---

## Step 91 — Error Monitoring (Sentry)

1. Create a free account at [sentry.io](https://sentry.io).
2. Create two projects: **FastAPI** (backend) and **Next.js** (frontend).
3. Copy each project's DSN into your environment:

| Component | Variable | Where to set |
|-----------|----------|--------------|
| Backend | `SENTRY_DSN` | `backend/.env` (local) or Secret Manager (production) |
| Frontend | `NEXT_PUBLIC_SENTRY_DSN` | `frontend/.env.local` or Vercel env vars |

4. Verify locally:

```bash
# Backend — expect HTTP 500
curl -i http://localhost:8000/debug/sentry-test

# Frontend — open in browser (development only)
open http://localhost:3000/debug/sentry-test
```

Events appear in the Sentry dashboard when a valid DSN is configured.

---

## Step 89 — Configure Domain and SSL

```bash
chmod +x scripts/configure-dns.sh
./scripts/configure-dns.sh
```

### Purchase a domain

Register `climaterisk.io` (or your chosen domain) at any registrar
(Namecheap, Google Domains, Cloudflare, etc.).

### Frontend DNS (Vercel)

In Vercel → Project → Settings → Domains, add `climaterisk.io` and
`www.climaterisk.io`. Vercel provides the exact DNS records. Typical setup:

| Type | Name | Value |
|------|------|-------|
| A | @ | `76.76.21.21` |
| CNAME | www | `cname.vercel-dns.com` |

Vercel provisions SSL automatically once DNS propagates.

### Backend API DNS (Cloud Run)

Map a custom domain to the Cloud Run service:

```bash
gcloud run domain-mappings create \
  --service climate-risk-api \
  --domain api.climaterisk.io \
  --region us-central1
```

Add the CNAME record gcloud outputs (typically `ghs.googlehosted.com`).
Google Cloud provisions SSL automatically for mapped domains.

### Verify SSL

After DNS propagation:

```bash
curl -I https://climaterisk.io
curl -I https://www.climaterisk.io
curl https://api.climaterisk.io/health
```

All three should return successful responses with valid TLS certificates.

---

## Local verification

Before deploying, verify the production configuration locally:

```bash
# Backend tests (includes CORS config tests)
cd backend && pytest tests/ -v

# Production Docker build
docker build -t climate-risk-api ./backend

# Run with production-like env vars
docker run --rm -p 8080:8080 \
  -e DATABASE_URL=postgresql+asyncpg://localhost/test \
  -e GOOGLE_MAPS_API_KEY=test \
  -e OPENAI_API_KEY=test \
  -e CORS_ORIGINS=https://climaterisk.io \
  -e ENVIRONMENT=production \
  -e JWT_SECRET=a-long-random-production-secret \
  -e APP_VERSION=2.0.0 \
  climate-risk-api

curl http://localhost:8080/health
```

```bash
# Frontend production build
cd frontend && npm run build
```
