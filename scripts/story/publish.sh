#!/usr/bin/env bash
# Publishes the story pack: builds the release from the ignored content/story/ (`pnpm story:release`, which releases
# any pack as the game reads it, skipping only the parts the game can't read, and refuses only a missing pack), then uploads
# the hash-named files first and `story.json` last, so a reader never sees an index that points at missing files. Old
# hash-named files stay in the bucket, so a phone holding an older index still reads it; the bucket's versioning keeps
# the older indexes. Never changes the gcloud account or its configuration: every call is scoped by the environment.
#
#   pnpm story:publish              to gs://uma-farm-content (or $STORY_BUCKET)
#   pnpm story:publish --dry-run    lists what it would upload, uploads nothing
set -euo pipefail
cd "$(dirname "$0")/../.."
export CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg
BUCKET="${STORY_BUCKET:-uma-farm-content}"
DIR="${STORY_OUT:-content/story-release}"
DRY_RUN=()
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=(--dry-run)

node --no-warnings scripts/story/release.mjs
test -f "${DIR}/story.json" || { echo "No release in ${DIR}" >&2; exit 1; }
gcloud storage rsync "${DIR}/story" "gs://${BUCKET}/story" --checksums-only ${DRY_RUN[@]+"${DRY_RUN[@]}"} \
  --cache-control="private, max-age=31536000, immutable" --content-type=application/json
if [[ ${#DRY_RUN[@]} -gt 0 ]]; then
  echo "Would upload ${DIR}/story.json to gs://${BUCKET}/story.json (private, no-cache)"
  exit 0
fi
gcloud storage cp "${DIR}/story.json" "gs://${BUCKET}/story.json" --cache-control="private, no-cache" --content-type=application/json
echo "Published release $(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).release)' "${DIR}/story.json"): $(ls "${DIR}/story" | wc -l | tr -d ' ') files and story.json to gs://${BUCKET}"
