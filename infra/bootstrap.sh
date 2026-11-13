#!/usr/bin/env bash
set -euo pipefail

# uma-farm's cloud inside the shared `uma-rpg` project (uma-rpg's cloud plan). Idempotent: every
# piece is described before it's created, and grants are re-applied as they are. Run it with the owner's login, never
# changing the active configuration:
#
#   CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg bash infra/bootstrap.sh
#
# It never touches uma-rpg's or the other app's pieces: `(default)`, `rpg-*`, `github-deployer`, the uma-rpg site, and
# the other app's database, services, accounts and site. Every piece it makes is labeled app=farm where labels apply.

APP="farm"
PROJECT_ID="${PROJECT_ID:-uma-rpg}"
REGION="us-central1"
REPOSITORY="luismlorenzana/uma-farm"
DB="farm"
SERVICE="farm-api"
AR_REPO="farm"
SITE="uma-farm"
POOL_ID="github-actions"
PROVIDER_ID="uma-farm"
RUNTIME_SA_ID="farm-api-runtime"
DEPLOY_SA_ID="farm-deploy"
RUNTIME_SA="${RUNTIME_SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOY_SA="${DEPLOY_SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
MASTER_PROJECT="uma-platform-lm"
MASTER_BUCKET="uma-platform-master-data"
SECRET="farm-vapid"
JOB="farm-push-tick"
SCHEDULER_SA_ID="farm-push-scheduler"
SCHEDULER_SA="${SCHEDULER_SA_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
STORY_BUCKET="uma-farm-content"

export CLOUDSDK_ACTIVE_CONFIG_NAME="${CLOUDSDK_ACTIVE_CONFIG_NAME:-default}" CLOUDSDK_CORE_PROJECT="${PROJECT_ID}"
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
POOL_NAME="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}"
PROVIDER_NAME="${POOL_NAME}/providers/${PROVIDER_ID}"

say() { echo "• $*"; }
ensure_sa() {
  if gcloud iam service-accounts describe "$1@${PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then say "account $1 exists"
  else gcloud iam service-accounts create "$1" --display-name="$2" >/dev/null; say "created account $1"; fi
}
# The REST APIs gcloud lacks (Hosting sites, Firebase web apps, Auth's domains), as the owner, billed to this project.
rest() {
  curl --silent --show-error -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "x-goog-user-project: ${PROJECT_ID}" -H "Content-Type: application/json" "$@"
}

# --- 1. Database, with delete protection and point-in-time recovery ---------------------------------------------------
if gcloud firestore databases describe --database="${DB}" >/dev/null 2>&1; then say "database ${DB} exists"
else
  gcloud firestore databases create --database="${DB}" --location="${REGION}" --type=firestore-native \
    --delete-protection --enable-pitr >/dev/null
  say "created database ${DB}"
fi

# --- 2. Runtime account: its own database only, and reading master data -----------------------------------------------
ensure_sa "${RUNTIME_SA_ID}" "Uma Farm API runtime"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${RUNTIME_SA}" --role="roles/datastore.user" \
  --condition='expression=resource.name == "projects/'"${PROJECT_ID}"'/databases/'"${DB}"'",title=farm-database-only,description=uma-farm only (IN5)' >/dev/null
CLOUDSDK_CORE_PROJECT="${MASTER_PROJECT}" gcloud storage buckets add-iam-policy-binding "gs://${MASTER_BUCKET}" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/storage.objectViewer" >/dev/null

# --- 3. Images: keep the last 3 --------------------------------------------------------------------------------------
if gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" >/dev/null 2>&1; then say "images ${AR_REPO} exist"
else
  gcloud artifacts repositories create "${AR_REPO}" --location="${REGION}" --repository-format=docker \
    --description="Uma Farm API images" --labels="app=${APP}" >/dev/null
  say "created images ${AR_REPO}"
fi
POLICY_FILE="$(mktemp)"
cat > "${POLICY_FILE}" <<'JSON'
[
  { "name": "keep-last-3", "action": { "type": "Keep" }, "mostRecentVersions": { "keepCount": 3 } },
  { "name": "delete-older", "action": { "type": "Delete" }, "condition": { "olderThan": "86400s" } }
]
JSON
gcloud artifacts repositories set-cleanup-policies "${AR_REPO}" --location="${REGION}" --policy="${POLICY_FILE}" --no-dry-run >/dev/null
rm -f "${POLICY_FILE}"

# --- 4. The API, created once from Google's sample image; the workflow replaces the image ------------------------------
if gcloud run services describe "${SERVICE}" --region="${REGION}" >/dev/null 2>&1; then say "service ${SERVICE} exists"
else
  gcloud run deploy "${SERVICE}" --region="${REGION}" --image=us-docker.pkg.dev/cloudrun/container/hello \
    --service-account="${RUNTIME_SA}" --min-instances=0 --max-instances=1 --memory=512Mi --cpu=1 \
    --allow-unauthenticated --labels="app=${APP}" >/dev/null
  say "created service ${SERVICE}"
fi
API_URL="$(gcloud run services describe "${SERVICE}" --region="${REGION}" --format='value(status.url)')"

# --- 5. Deployer: its own service and images; Hosting and service usage on the project, as uma-rpg's has ---------------
ensure_sa "${DEPLOY_SA_ID}" "Uma Farm deployer (GitHub Actions)"
gcloud artifacts repositories add-iam-policy-binding "${AR_REPO}" --location="${REGION}" \
  --member="serviceAccount:${DEPLOY_SA}" --role="roles/artifactregistry.writer" >/dev/null
gcloud run services add-iam-policy-binding "${SERVICE}" --region="${REGION}" --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/run.admin" >/dev/null
gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA}" --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/iam.serviceAccountUser" >/dev/null
for role in roles/firebasehosting.admin roles/serviceusage.serviceUsageConsumer roles/serviceusage.apiKeysViewer; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${DEPLOY_SA}" --role="${role}" \
    --condition=None >/dev/null
done

# --- 6. Deploy sign-in: this repo's main branch only, in the shared pool ------------------------------------------------
PROVIDER_FLAGS=(
  --location=global
  --workload-identity-pool="${POOL_ID}"
  --display-name="uma-farm main branch"
  --issuer-uri="https://token.actions.githubusercontent.com"
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref"
  --attribute-condition="assertion.repository == '${REPOSITORY}' && assertion.ref == 'refs/heads/main'"
)
if gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" --location=global --workload-identity-pool="${POOL_ID}" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "${PROVIDER_ID}" "${PROVIDER_FLAGS[@]}" >/dev/null
  say "provider ${PROVIDER_ID} exists"
else
  gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" "${PROVIDER_FLAGS[@]}" >/dev/null
  say "created provider ${PROVIDER_ID}"
fi
gcloud iam service-accounts add-iam-policy-binding "${DEPLOY_SA}" --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/${POOL_NAME}/attribute.repository/${REPOSITORY}" >/dev/null

# --- 7. Site, web app and sign-in domain --------------------------------------------------------------------------------
HOSTING="https://firebasehosting.googleapis.com/v1beta1"
if [[ "$(rest -o /dev/null -w '%{http_code}' "${HOSTING}/projects/${PROJECT_ID}/sites/${SITE}")" == "200" ]]; then say "site ${SITE} exists"
elif [[ "$(rest -o /dev/null -w '%{http_code}' -X POST "${HOSTING}/projects/${PROJECT_ID}/sites?siteId=${SITE}" -d '{}')" == "200" ]]; then
  say "created site ${SITE}"
else
  SITE="${SITE}-lm"
  if [[ "$(rest -o /dev/null -w '%{http_code}' "${HOSTING}/projects/${PROJECT_ID}/sites/${SITE}")" != "200" ]]; then
    rest --fail -X POST "${HOSTING}/projects/${PROJECT_ID}/sites?siteId=${SITE}" -d '{}' >/dev/null
  fi
  say "the first name was taken: site ${SITE}"
fi
rest --fail -X PATCH "${HOSTING}/sites/${SITE}/config?updateMask=maxVersions" -d '{"maxVersions": 20}' >/dev/null
if rest --fail "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps" \
    | python3 -c 'import json,sys; sys.exit(0 if any(a.get("displayName")=="Uma Farm web" for a in json.load(sys.stdin).get("apps",[])) else 1)'; then
  say "web app Uma Farm web exists"
else
  rest --fail -X POST "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps" -d '{"displayName": "Uma Farm web"}' >/dev/null
  say "created web app Uma Farm web"
fi
# Auth's authorized domains: read the list and add to it, never replace it.
AUTH_CONFIG="https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config"
DOMAINS="$(rest --fail "${AUTH_CONFIG}" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin).get("authorizedDomains",[])))')"
NEW_DOMAIN="${SITE}.web.app"
if python3 -c 'import json,sys; sys.exit(0 if sys.argv[2] in json.loads(sys.argv[1]) else 1)' "${DOMAINS}" "${NEW_DOMAIN}"; then
  say "domain ${NEW_DOMAIN} is authorized"
else
  BODY="$(python3 -c 'import json,sys; print(json.dumps({"authorizedDomains": json.loads(sys.argv[1]) + [sys.argv[2]]}))' "${DOMAINS}" "${NEW_DOMAIN}")"
  rest --fail -X PATCH "${AUTH_CONFIG}?updateMask=authorizedDomains" -d "${BODY}" >/dev/null
  say "authorized domain ${NEW_DOMAIN}"
fi

# --- 8. Push: the VAPID secret, the scheduler's account and its job. A new job is created paused; a job that exists
# keeps its state, so a re-run never changes whether the tick runs -------------------------------------------------------
gcloud services enable secretmanager.googleapis.com cloudscheduler.googleapis.com >/dev/null
if gcloud secrets describe "${SECRET}" >/dev/null 2>&1; then say "secret ${SECRET} exists"
else
  gcloud secrets create "${SECRET}" --replication-policy=automatic --labels="app=${APP}" >/dev/null
  # {"publicKey","privateKey"}, piped straight into the secret: never printed or written to disk.
  npx --yes web-push@3.6.7 generate-vapid-keys --json | gcloud secrets versions add "${SECRET}" --data-file=- >/dev/null
  say "created secret ${SECRET}"
fi
gcloud secrets add-iam-policy-binding "${SECRET}" --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" --condition=None >/dev/null
ensure_sa "${SCHEDULER_SA_ID}" "Uma Farm push tick (Cloud Scheduler)"
gcloud run services add-iam-policy-binding "${SERVICE}" --region="${REGION}" --member="serviceAccount:${SCHEDULER_SA}" \
  --role="roles/run.invoker" >/dev/null
JOB_ARGS=(--location="${REGION}" --schedule='*/5 * * * *' --time-zone=Etc/UTC --uri="${API_URL}/api/push/tick" --http-method=POST
  --oidc-service-account-email="${SCHEDULER_SA}" --oidc-token-audience="${API_URL}" --attempt-deadline=60s)
if gcloud scheduler jobs describe "${JOB}" --location="${REGION}" >/dev/null 2>&1; then
  gcloud scheduler jobs update http "${JOB}" "${JOB_ARGS[@]}" >/dev/null
  say "job ${JOB} exists"
else
  gcloud scheduler jobs create http "${JOB}" "${JOB_ARGS[@]}" >/dev/null
  gcloud scheduler jobs pause "${JOB}" --location="${REGION}" >/dev/null
  say "created job ${JOB}, paused (resume it once /api/push/tick is deployed)"
fi
say "job ${JOB} is $(gcloud scheduler jobs describe "${JOB}" --location="${REGION}" --format='value(state)')"

# --- 9. The story pack's private bucket (the owner's yes, 2026-11-11): versioned, uniform access, never
# public, its one reader the runtime account; a noncurrent version goes once 10 newer ones exist. Hash-named files never
# change, so only story.json keeps a history -------------------------------------------------------------------------
if gcloud storage buckets describe "gs://${STORY_BUCKET}" >/dev/null 2>&1; then say "bucket ${STORY_BUCKET} exists"
else
  gcloud storage buckets create "gs://${STORY_BUCKET}" --location="${REGION}" --default-storage-class=STANDARD \
    --uniform-bucket-level-access --public-access-prevention >/dev/null
  say "created bucket ${STORY_BUCKET}"
fi
LIFECYCLE_FILE="$(mktemp)"
cat > "${LIFECYCLE_FILE}" <<'JSON'
{ "rule": [ { "action": { "type": "Delete" }, "condition": { "numNewerVersions": 10 } } ] }
JSON
gcloud storage buckets update "gs://${STORY_BUCKET}" --versioning --update-labels="app=${APP}" \
  --uniform-bucket-level-access --public-access-prevention --lifecycle-file="${LIFECYCLE_FILE}" >/dev/null
rm -f "${LIFECYCLE_FILE}"
gcloud storage buckets add-iam-policy-binding "gs://${STORY_BUCKET}" --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/storage.objectViewer" >/dev/null
say "bucket ${STORY_BUCKET}: versioned, private, read by ${RUNTIME_SA_ID} only"

# --- 10. The repository variables -----------------------------------------------------------------------------------
ALLOWED_EMAIL="$(gh variable get ALLOWED_EMAIL -R luismlorenzana/uma-rpg 2>/dev/null || echo '<copy uma-rpg ALLOWED_EMAIL>')"

echo
echo "GCP_PROJECT_ID=${PROJECT_ID}"
echo "WIF_PROVIDER=${PROVIDER_NAME}"
echo "DEPLOY_SA=${DEPLOY_SA}"
echo "ALLOWED_EMAIL=${ALLOWED_EMAIL}"
echo "MASTER_BUCKET=${MASTER_BUCKET}"
echo "FIRESTORE_DATABASE=${DB}"
echo "HOSTING_SITE=${SITE}"
echo "PUSH_AUDIENCE=${API_URL}"
echo "FARM_API_URL=${API_URL}"
echo "POST_CALLERS=quest-api-runtime@${PROJECT_ID}.iam.gserviceaccount.com"
echo "STORY_BUCKET=${STORY_BUCKET}"
