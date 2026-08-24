#!/usr/bin/env bash
# Step 89 — Configure custom domain DNS and verify SSL.
set -euo pipefail

DOMAIN="${DOMAIN:-climaterisk.io}"
API_SUBDOMAIN="${API_SUBDOMAIN:-api}"

echo "==> Domain and SSL configuration for ${DOMAIN}"
echo ""
echo "Prerequisites:"
echo "  - Domain purchased and registrar DNS management access"
echo "  - Vercel project linked (scripts/provision-vercel.sh)"
echo "  - Cloud Run service deployed (scripts/provision-cloud-run.sh)"
echo ""

echo "==> Frontend DNS (Vercel)"
echo "    In Vercel Dashboard → Project → Settings → Domains:"
echo "      1. Add domain: ${DOMAIN}"
echo "      2. Add domain: www.${DOMAIN}"
echo "      3. Vercel will show required DNS records. Typical setup:"
echo ""
echo "         Type   Name   Value"
echo "         A      @      76.76.21.21"
echo "         CNAME  www    cname.vercel-dns.com"
echo ""
echo "    Vercel provisions SSL automatically once DNS propagates."
echo ""

echo "==> Backend API DNS (Google Cloud Run)"
echo "    Map a custom domain to your Cloud Run service:"
echo ""
echo "      gcloud run domain-mappings create \\"
echo "        --service climate-risk-api \\"
echo "        --domain ${API_SUBDOMAIN}.${DOMAIN} \\"
echo "        --region us-central1"
echo ""
echo "    gcloud will output DNS records (typically CNAME to ghs.googlehosted.com)."
echo "    Add the CNAME record at your registrar:"
echo ""
echo "         Type   Name   Value"
echo "         CNAME  api    ghs.googlehosted.com"
echo ""
echo "    Google Cloud provisions SSL automatically for mapped domains."
echo ""

echo "==> Verification checklist"
echo "    After DNS propagation (up to 48 hours, usually minutes):"
echo ""
echo "      curl -I https://${DOMAIN}                     # expect HTTP/2 200"
echo "      curl -I https://www.${DOMAIN}                 # expect HTTP/2 200"
echo "      curl https://${API_SUBDOMAIN}.${DOMAIN}/health  # expect {\"status\":\"ok\"}"
echo ""
echo "    Confirm SSL certificates:"
echo "      openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} </dev/null 2>/dev/null | openssl x509 -noout -dates"
echo "      openssl s_client -connect ${API_SUBDOMAIN}.${DOMAIN}:443 -servername ${API_SUBDOMAIN}.${DOMAIN} </dev/null 2>/dev/null | openssl x509 -noout -dates"
echo ""

read -r -p "Have you added all DNS records at your registrar? [y/N] " DONE
if [[ "${DONE}" =~ ^[Yy]$ ]]; then
  echo "Run the verification commands above once DNS propagates."
else
  echo "Add DNS records, then re-run this script."
  exit 1
fi
