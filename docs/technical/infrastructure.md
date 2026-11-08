# Infrastructure

> **Status: live since 2026-11-08 (F2, D5).** Every value below exists and was checked. F6 (D14) ships the push routes,
> and `farm-push-tick` runs since 2026-11-08 19:15 UTC (D15). The plan for all three
> apps in the project is uma-rpg's
> [cloud plan](https://github.com/luismlorenzana/uma-rpg/blob/main/docs/design/cloud/plan.md) (IN1–IN26).

## The shared project

uma-farm lives in GCP project **`uma-rpg`** (number 727687479415, billing account `0101E5-D99B49-A8B713`), beside
uma-rpg and uma-quest, all live. Each app has its own pieces, and none can reach another's (IN2, IN5, IN6). Four
things are shared (IN3):
- Firebase Auth: Google sign-in and the one allowed email;
- the `github-actions` Workload Identity pool;
- the $5 budget alert (emails at $1 and $5);
- read-only access to uma-platform's `gs://uma-platform-master-data`.

**Never change the active gcloud account.** Scope every command:

```bash
CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg gcloud run services describe farm-api --region=us-central1
```

Never run `gcloud config set …`, and never touch uma-rpg's or uma-quest's pieces: `(default)`, `quest`, `rpg-*`,
`quest-*`, `github-deployer`, `quest-deploy`, `gs://uma-rpg-content`, `gs://uma-quest-content`, and the `uma-rpg` and
`uma-quest` sites.

## uma-farm's pieces (live, 2026-11-08)

| Piece | Value |
|---|---|
| Repo | `luismlorenzana/uma-farm`, **private** (the owner, 2026-11-08; D4) |
| Site | `https://uma-farm.web.app`, Hosting site `uma-farm` (`uma-farm-lm` if taken), 20 versions kept |
| Firebase web app | Uma Farm web; its public config goes in `apps/web/.env.production` |
| API URL | `https://farm-api-dadzqf3ula-uc.a.run.app` (also the parcel ping's audience) |
| API | Cloud Run `farm-api`, `us-central1`, min 0, max 1, 512 MiB, 1 CPU, public at the edge. The owner guard covers every route except `/api/health`, and `/api/post/*` and `/api/push/tick`, which check their own tokens |
| Runtime account | `farm-api-runtime`: `datastore.user` only on `projects/uma-rpg/databases/farm`; reader of the master bucket; accessor of `farm-vapid` |
| Database | Firestore `farm`, Native, `us-central1`, delete protection and point-in-time recovery on. In use from F3: `saves/{uid}` (`{ revision, save }`, the save as JSON text), `saveRescues/{uid}` (a refused upload, newest only) and `saveBackups/{uid}-v{n}` (the stored document before a newer save version first replaces it). From F6: `push/{uid}` (the devices' subscriptions, the app's schedule, `checkedAt`; [the fields](../game/architecture.md#pushuid)). Later: `parcels/{id}` (F10) |
| Images | Artifact Registry `farm`, keeping the last 3 |
| Deployer | `farm-deploy`: writer on `farm` images, admin of `farm-api`, user of `farm-api-runtime`, Hosting admin (project-wide, so the workflow names its site and CI checks it, IN7) |
| Deploy sign-in | Provider `uma-farm` in pool `github-actions`, `main` of `luismlorenzana/uma-farm` only |
| Push (IN17) | Secret `farm-vapid`, mounted on `farm-api` as `VAPID_KEYS`; account `farm-push-scheduler` with `run.invoker` on `farm-api` only; Cloud Scheduler `farm-push-tick`, `*/5 * * * *` UTC, `POST {API URL}/api/push/tick` with an OIDC token for `farm-push-scheduler`, audience `PUSH_AUDIENCE` (the API URL). **The route ships with F6** (D14): `/api/push/tick` answers 401 unsigned and 403 to any other account, and `PUSH_SCHEDULER_EMAIL` is unset, so the code's default, `farm-push-scheduler@uma-rpg.iam.gserviceaccount.com`, is the caller. **The job runs** since 2026-11-08 19:15 UTC, resumed after the live tick refused unsigned and forged calls (D15) |
| Parcels (IN18) | Sender: `/api/post/*` accepts a Google ID token whose audience is `FARM_API_URL` and whose account is on `POST_CALLERS` (`quest-api-runtime` first; `rpg-api-runtime` and `racer-api-runtime@uma-racer` when they receive). No IAM grant, no keys |
| Private content | None (IN16): its art is uma-art's, its Umas come through master data |
| Label | `app=farm` |
| Local | API on 8101, web on 5194 (uma-rpg uses 8081 and 5174, uma-quest 8091 and 5184) |

**Repository variables (F2):** `GCP_PROJECT_ID=uma-rpg`, `WIF_PROVIDER`, `DEPLOY_SA`, `ALLOWED_EMAIL`, `MASTER_BUCKET`,
`FIRESTORE_DATABASE=farm`, `HOSTING_SITE=uma-farm`, `PUSH_AUDIENCE`, `POST_CALLERS`, `DEPLOY_ENABLED`.

## Isolation, checked 2026-11-08 (IN21)

Policy Troubleshooter (`gcloud policy-troubleshoot iam`) for Cloud Run, images and secrets. It doesn't accept Firestore
database names, so the database cells come from each grant's condition (one `datastore.user` per runtime account, on its
own database) and the troubleshooter's project-level answer, which is only conditional.

| Account | Own pieces | Every other app's |
|---|---|---|
| `farm-api-runtime` | `farm` database (`resource.name == "projects/uma-rpg/databases/farm"`); `farm-vapid`; reads master data | No grant on `(default)` or `quest`; `rpg-vapid` refused |
| `farm-deploy` | Deploys `farm-api`, pushes to `farm`: granted | `rpg-api`, `quest-api`, `rpg`, `quest`: refused |
| `github-deployer`, `quest-deploy` | — | `farm-api` and `farm`: refused |
| `farm-push-scheduler` | `run.invoker` on `farm-api` | Its only grant. All three APIs are public at the edge (`allUsers` invoker), so the troubleshooter shows it can call any of them; each API checks the tick's OIDC token itself |

## Re-run and rollback

- **Re-run:** `CLOUDSDK_ACTIVE_CONFIG_NAME=default bash infra/bootstrap.sh` describes each piece before creating it and
  re-applies the grants as they are, then prints the repository variables. It changes nothing on a second run: step 8
  pauses `farm-push-tick` only when it creates it, and a job that exists keeps its state (D15).
- **Rollback,** in this order: delete the scheduler job and the provider; then the
  service, the deployer and the two accounts, and the secret. The
  database keeps its delete protection, so removing it is a separate, deliberate step.

## What it costs

uma-farm's share of the cloud plan's bill: the `farm` database and its recovery, a few cents a month (Google's free
Firestore quota covers only `(default)`). The site, `farm-api`, the images, the push tick (the second of three free
scheduler jobs) and `farm-vapid` (the second of six free secret versions) stay inside the free tiers they share with
uma-rpg and uma-quest. The full table is in [the plan](../design/plan.md#what-it-costs).

## Production saves (live from F3)

uma-rpg's rules, from its 2026-10-30 incident, where a hand grant wiped unsynced progress:
- never move `save.account.updatedAt`;
- no server ever writes into a save;
- a stale server date means stop and ask the owner.

Parcels keep to them (FM10): they live in `parcels`, never inside a save, and each game records its claims in its own
save.
