#!/usr/bin/env bash
set -euo pipefail
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-southamerica-west1}"
SERVICE="${SERVICE:-link-world}"
if [[ -z "$PROJECT_ID" ]]; then
  echo "Usage: PROJECT_ID=your-google-cloud-project REGION=southamerica-west1 bash deploy-cloud-run.sh"
  exit 2
fi
command -v gcloud >/dev/null || { echo 'Google Cloud CLI (gcloud) required.'; exit 2; }
echo "Project: $PROJECT_ID | Region: $REGION | Service: $SERVICE"
echo 'Cloud Run will be PRIVATE. Google IAM authentication is required to open it.'
echo 'Google Cloud project billing and Cloud Build/Cloud Run APIs must be configured.'
read -r -p 'Build and deploy from this directory? [y/N] ' approve
[[ "$approve" == 'y' || "$approve" == 'Y' ]] || exit 0
gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" --source . \
  --port 8080 --memory 512Mi --cpu 1 \
  --min-instances 0 --max-instances 2 \
  --no-allow-unauthenticated
