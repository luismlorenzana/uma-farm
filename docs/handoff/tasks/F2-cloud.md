# F2 — The cloud, the pipeline and the ping

**uma-farm · Claude · M · Needs: F1, uma-rpg's H169 done, and the owner's go · Unblocks: F3, and uma-quest's Q2 ping**

> **The owner's go comes first.** This packet creates resources in the live `uma-rpg` GCP project, which runs uma-rpg's
> production. Ask in one line ("F2 creates uma-farm's cloud in the uma-rpg project, a few cents a month: go?") and wait
> for a yes. H169 must be done first, so uma-rpg's own accounts are already narrowed when uma-farm's pieces appear.

## Why

The cloud plan's Steps 3 and 4 for uma-farm: its own database, API, accounts, images, deploy sign-in and site, and its
push pieces, paused. None of them can be reached by uma-rpg or uma-quest. The pipeline then deploys F1's placeholder on
every push to `main`. The live `/api/post/ping` is what uma-quest's Q2 calls to prove the parcel link, with its own
Google-signed token (IN18).

## Context (read first)

- **The cloud plan:**
  [uma-rpg docs/design/cloud/plan.md](https://github.com/luismlorenzana/uma-rpg/blob/main/docs/design/cloud/plan.md).
  Use its inventory, Step 3's table, Step 4, the "who can reach what" matrix and the bill. Its calls IN1–IN26 are this
  packet's decisions.
- **The model to copy:** uma-rpg's `infra/github-actions/bootstrap.sh` and `.github/workflows/deploy.yml`. Copy their
  shapes, but **not** the project-wide grants (`--condition=None` on `datastore.user`, and the deployer's `run.admin`
  and `artifactregistry.writer` on the project). H169 replaces those in uma-rpg; uma-farm's grants are narrow from the start.
- **uma-rpg's push setup,** `infra/push/setup.sh`, is the model for the farm's paused push pieces (IN17).
- **uma-quest's Q2** calls the ping. If it lands first, its live check waits on this packet; if this lands first, the ping
  waits for Q2's caller.

## Decisions made

- Every command runs with `CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg`. The master-bucket grant
  uses `CLOUDSDK_CORE_PROJECT=uma-platform-lm`. Never `gcloud config set`, and never touch a piece named `rpg-*`,
  `quest-*`, `(default)`, `quest`, `github-deployer` or `uma-rpg`/`uma-quest`.
- `infra/bootstrap.sh` is idempotent (describe before create), prints what it did, and ends by printing the repository
  variables.
- The labels are `app=farm` on everything that takes one.

## Do

### 1. `infra/bootstrap.sh`, in this order

| # | Piece | How |
|---|---|---|
| 1 | Database `farm` | `gcloud firestore databases create --database=farm --location=us-central1 --type=firestore-native --delete-protection --enable-pitr` |
| 2 | Runtime account `farm-api-runtime` | Create it. Grant `roles/datastore.user` on the project with the condition `resource.name == "projects/uma-rpg/databases/farm"`, titled `farm-database-only`. Grant `roles/storage.objectViewer` on `gs://uma-platform-master-data` (in `uma-platform-lm`) and `roles/secretmanager.secretAccessor` on `farm-vapid` |
| 3 | Images `farm` | Docker, `us-central1`, the label, and uma-rpg's keep-last-3 cleanup policy |
| 4 | API `farm-api` | `gcloud run deploy farm-api --image=us-docker.pkg.dev/cloudrun/container/hello` with the runtime account, `--min-instances=0 --max-instances=1 --memory=512Mi --cpu=1 --allow-unauthenticated` and the label. Created once, from Google's sample image (IN8); the workflow replaces the image |
| 5 | Deployer `farm-deploy` | Create it, then grant: `artifactregistry.writer` on the `farm` repository; `run.admin` on the `farm-api` service; `iam.serviceAccountUser` on `farm-api-runtime`; and on the project, `firebasehosting.admin`, `serviceusage.serviceUsageConsumer` and `serviceusage.apiKeysViewer`, as `github-deployer` has |
| 6 | Deploy sign-in | Provider `uma-farm` in the existing `github-actions` pool, with uma-rpg's attribute mapping and the condition `assertion.repository == 'luismlorenzana/uma-farm' && assertion.ref == 'refs/heads/main'`. Then `iam.workloadIdentityUser` on `farm-deploy` for that repository's principal set |
| 7 | Site and sign-in | Hosting site `uma-farm` (or `uma-farm-lm` if the name is taken), keeping 20 versions; Firebase web app "Uma Farm web" (its public config goes in `apps/web/.env.production` in F3); `uma-farm.web.app` **added** to Auth's authorized domains. Read the list first and add to it, never replace it |
| 8 | Push, paused (IN17) | The secret `farm-vapid`, a fresh VAPID key pair, as uma-rpg's `rpg-vapid` was made. The account `farm-push-scheduler`, with `run.invoker` on `farm-api` only. The Cloud Scheduler job `farm-push-tick`, every five minutes, `POST {farm-api}/api/push/tick` with an OIDC token for that account. **Created paused** (`gcloud scheduler jobs pause`) until F6's route ships. It's the billing account's second job of the three free |
| 9 | The variables | Print `GCP_PROJECT_ID=uma-rpg`, `WIF_PROVIDER`, `DEPLOY_SA`, `ALLOWED_EMAIL` (copied from uma-rpg's variable), `MASTER_BUCKET`, `FIRESTORE_DATABASE=farm`, `HOSTING_SITE`, `PUSH_AUDIENCE`, `POST_CALLERS=quest-api-runtime@uma-rpg.iam.gserviceaccount.com` |

Use the REST APIs (with `gcloud auth print-access-token` under the scoped configuration) for anything gcloud lacks:
the Hosting site, its version limit, the web app and the authorized domains.

### 2. The owner's step: the sign-in entries

In the Cloud console, open APIs & Services → Credentials → "Web client (auto created by Google Service)", the same client
uma-rpg uses. Add `https://uma-farm.web.app/__/auth/handler` under **Authorized redirect URIs** and
`https://uma-farm.web.app` under **Authorized JavaScript origins**. There's no API for it. F3's sign-in needs it, not
this packet's checks, so ask for it once the site exists and carry on. If uma-quest's Q2 is at the same point, ask for
both apps' four entries at once.

### 3. The pipeline

- Set the variables with `gh variable set`, and `DEPLOY_ENABLED=true` last.
- **`firebase.json`** names `"site": "uma-farm"` and rewrites `/api/**` to `farm-api` in `us-central1`. The app shell is
  served `no-cache`, as uma-rpg's is.
- **The site check** (IN7): a script test fails unless `firebase.json`'s site equals the workflow's `HOSTING_SITE`
  default, and the workflow deploys `--only hosting:uma-farm`.
- **The deploy job**, adapted from uma-rpg's:
  - keyless sign-in as `farm-deploy`;
  - build and push the API image to the `farm` images;
  - deploy `farm-api` with `PERSISTENCE=firestore`, `FIRESTORE_DATABASE`, `MASTER_BUCKET`, `ALLOWED_ORIGIN`,
    `ALLOWED_EMAIL`, `BUILD_ID`, `PUSH_AUDIENCE`, `FARM_API_URL` (its own URL, the ping's audience) and `POST_CALLERS`,
    with `VAPID_KEYS=farm-vapid:latest` as a secret;
  - build the web app and deploy it to `hosting:uma-farm`.
- **Its checks:**
  - `/api/health` answers 200 directly and through the site, with `build` equal to the commit;
  - `/api/save` answers 401, and so does `/api/post/ping` without a token;
  - the shell is served `no-cache`;
  - uma-rpg's `https://uma-rpg.web.app/api/health` still answers 200 (a guard against a site mix-up).

### 4. The ping, live (IN18, IN20)

- With `POST_CALLERS` set, `/api/post/ping` answers `{ ok: true }` for `quest-api-runtime`'s token, and 401 for no token,
  a token for another audience, or another account. Check the refusals with a token you mint for your own account
  (`gcloud auth print-identity-token --audiences=<farm-api URL>`, scoped). It must be refused, since you aren't on the list.
- The success is uma-quest's Q2 calling it. Note in the Done row which side landed first.

### 5. Isolation (IN21)

With Policy Troubleshooter (`gcloud policy-troubleshoot iam`), check uma-farm's rows of the cloud plan's matrix:
- `farm-api-runtime` is granted on `farm` and refused on `(default)` and `quest`;
- `farm-deploy` can deploy `farm-api` and push to `farm`, and is refused on `rpg-api`, `quest-api`, `rpg` and `quest`;
- `farm-push-scheduler` can invoke `farm-api` only.

Record each result in the infrastructure page.

### 6. Docs

[docs/technical/infrastructure.md](../../technical/infrastructure.md): replace "planned" with every live value, and add
the bootstrap's re-run note and the rollback (delete the scheduler job and the provider, then the service, the deployer
and the two accounts, and the secret; the database keeps its delete protection).

## Done when

- A push to `main` deploys, and the workflow's checks pass.
- `/api/post/ping` refuses every caller but `quest-api-runtime` (the success comes with uma-quest's Q2).
- `farm-push-tick` exists and is paused.
- Every uma-farm matrix cell comes back as expected.
- uma-rpg's site, `/api/health`, `/api/save` 401 and its push tick are unchanged.
- The billing budget still lists the project.

## Deliver

Commit to `main` (`feat(infra): …`), delete this packet, add a Done row in [the handoff](../README.md) with the
workflow run's link, and log the packet's D-decision (fetch `main` first). uma-rpg's handoff carries the standing
note that marks uma-farm live in its infrastructure page (IN25), so you don't edit uma-rpg from here.
