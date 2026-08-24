#!/usr/bin/env bash
# Step 87 — Deploy the FastAPI backend to Google Cloud Run.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID to your Google Cloud project ID}"
: "${GCP_REGION:=us-central1}"
SERVICE_NAME="${SERVICE_NAME:-climate-risk-api}"

echo "==> Google Cloud Run backend provisioning"
echo "    Project: ${GCP_PROJECT_ID}"
echo "    Region:  ${GCP_REGION}"
echo "    Service: ${SERVICE_NAME}"
echo ""

if ! command -v gcloud >/dev/null 2>&1; then
  echo "ERROR: gcloud CLI not found. Install: https://cloud.google.com/sdk/docs/install"
  exit 1
fi

gcloud config set project "${GCP_PROJECT_ID}"

echo "==> Enabling required APIs"
gcloud services enable run.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com

echo ""
echo "==> Creating secrets in Google Secret Manager (Step 88)"
echo "    Run each command once and paste the real value when prompted:"
echo ""
for SECRET in DATABASE_URL GOOGLE_MAPS_API_KEY OPENAI_API_KEY NOAA_API_KEY; do
  echo "  gcloud secrets create ${SECRET} --replication-policy=automatic 2>/dev/null || true"
  echo "  echo -n 'YOUR_VALUE' | gcloud secrets versions add ${SECRET} --data-file=-"
done
echo ""

read -r -p "Build and deploy to Cloud Run now? [y/N] " DEPLOY_NOW
if [[ ! "${DEPLOY_NOW}" =~ ^[Yy]$ ]]; then
  echo "Skipping deploy. Re-run with DEPLOY_NOW when secrets are ready."
  exit 0
fi

echo "==> Deploying from source"
gcloud run deploy "${SERVICE_NAME}" \
  --source "${BACKEND_DIR}" \
  --region "${GCP_REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars "ENVIRONMENT=production,APP_VERSION=1.0.0,CORS_ORIGINS=https://climaterisk.io,https://www.climaterisk.io" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,NOAA_API_KEY=NOAA_API_KEY:latest"

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" --region "${GCP_REGION}" --format='value(status.url)')"
echo ""
echo "Backend deployed: ${SERVICE_URL}"
echo "Verify health: curl ${SERVICE_URL}/health"
