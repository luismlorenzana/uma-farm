# Infrastructure

Every cloud value the farm runs on, live since 2026-11-08 and checked. How the app uses them is in
[architecture.md](architecture.md). The plan for all three apps in the shared project is uma-rpg's
[cloud plan](https://github.com/luismlorenzana/uma-rpg/blob/main/docs/design/cloud/plan.md).

## The shared project

uma-farm lives in GCP project **`uma-rpg`** (number 727687479415, billing account `0101E5-D99B49-A8B713`), beside
uma-rpg and uma-quest, all live. Each app has its own pieces, and none can reach another's. Four things are shared:
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

## uma-farm's pieces

| Piece | Value |
|---|---|
| Repo | `luismlorenzana/uma-farm`, **private** (the owner's call) |
| Site | `https://uma-farm.web.app`, Hosting site `uma-farm`, 20 versions kept |
| Firebase web app | Uma Farm web; its public config is in `apps/web/.env.production` |
| API URL | `https://farm-api-dadzqf3ula-uc.a.run.app` (also the parcel ping's audience) |
| API | Cloud Run `farm-api`, `us-central1`, min 0, max 1, 512 MiB, 1 CPU, public at the edge. The owner guard covers every route except `/api/health`, and `/api/post/*` and `/api/push/tick`, which check their own tokens |
| Runtime account | `farm-api-runtime`: `datastore.user` only on `projects/uma-rpg/databases/farm`; reader of the master bucket; accessor of `farm-vapid`; `storage.objectViewer` on `gs://uma-farm-content` only |
| Database | Firestore `farm`, Native, `us-central1`, delete protection and point-in-time recovery on. Collections: `saves/{uid}` (`{ revision, save }`, the save as JSON text), `saveRescues/{uid}` (a refused upload, newest only), `saveBackups/{uid}-v{n}` (the stored document before a newer save version first replaces it), and `push/{uid}` (the devices' subscriptions, the app's schedule, `checkedAt`) |
| Images | Artifact Registry `farm`, keeping the last 3 |
| Deployer | `farm-deploy`: writer on `farm` images, admin of `farm-api`, user of `farm-api-runtime`, Hosting admin (project-wide, so the workflow names its site and CI checks it) |
| Deploy sign-in | Provider `uma-farm` in pool `github-actions`, `main` of `luismlorenzana/uma-farm` only |
| Push | Secret `farm-vapid`, mounted on `farm-api` as `VAPID_KEYS`; account `farm-push-scheduler` with `run.invoker` on `farm-api` only; Cloud Scheduler `farm-push-tick`, `*/5 * * * *` UTC, `POST {API URL}/api/push/tick` with an OIDC token for `farm-push-scheduler`, audience `PUSH_AUDIENCE` (the API URL). `/api/push/tick` answers 401 unsigned and 403 to any other account; `PUSH_SCHEDULER_EMAIL` is unset, so the code's default, `farm-push-scheduler@uma-rpg.iam.gserviceaccount.com`, is the caller. **The job is paused:** days are turns the player ends, so nothing finishes while the app is closed. Resume it with `gcloud scheduler jobs resume farm-push-tick --location=us-central1`, scoped, if real time ever returns |
| Parcels (parked) | The sender's routes `/api/post/*` accept a Google ID token whose audience is `FARM_API_URL` and whose account is on `POST_CALLERS` (`quest-api-runtime` first). No IAM grant, no keys. Only the ping is built |
| Private content | **`gs://uma-farm-content`** (created 2026-11-12): the farm's private story pack, `us-central1`, Standard, uniform access, public access prevented, versioned, a noncurrent version deleted once 10 newer ones exist, label `app=farm`; its one reader `farm-api-runtime`. `farm-api` serves it at `/api/content/story…` behind the owner guard (`STORY_BUCKET`), published by `pnpm story:ship` (or `story:publish`, the step alone). The Umas still come through master data and their art through uma-art |
| Label | `app=farm` |
| Local | API on 8101, web on 5194 (uma-rpg uses 8081 and 5174, uma-quest 8091 and 5184) |

**Repository variables:** `GCP_PROJECT_ID=uma-rpg`, `WIF_PROVIDER`, `DEPLOY_SA`, `ALLOWED_EMAIL`, `MASTER_BUCKET`,
`FIRESTORE_DATABASE=farm`, `HOSTING_SITE=uma-farm`, `PUSH_AUDIENCE`, `POST_CALLERS`, `DEPLOY_ENABLED`, and
`STORY_BUCKET=uma-farm-content` (passed to Cloud Run beside `MASTER_BUCKET`).

## Isolation, checked

Checked with the Policy Troubleshooter (`gcloud policy-troubleshoot iam`) for Cloud Run, images and secrets. It doesn't
accept Firestore database names, so the database cells come from each grant's condition (one `datastore.user` per
runtime account, on its own database) and the troubleshooter's project-level answer, which is only conditional.

| Account | Own pieces | Every other app's |
|---|---|---|
| `farm-api-runtime` | `farm` database (`resource.name == "projects/uma-rpg/databases/farm"`); `farm-vapid`; reads master data | No grant on `(default)` or `quest`; `rpg-vapid` refused |
| `farm-deploy` | Deploys `farm-api`, pushes to `farm`: granted | `rpg-api`, `quest-api`, `rpg`, `quest`: refused |
| `github-deployer`, `quest-deploy` | — | `farm-api` and `farm`: refused |
| `farm-api-runtime`, the story bucket | `storage.objects.get` on `gs://uma-farm-content`: **granted** | `rpg-api-runtime`, `quest-api-runtime`, `platform-api-runtime`: **not granted**; the bucket's only service account is `farm-api-runtime` (the rest are the project's legacy convenience bindings); signed out through the site, `/api/content/story.json` is 401 |
| `farm-push-scheduler` | `run.invoker` on `farm-api` | Its only grant. All three APIs are public at the edge (`allUsers` invoker), so the troubleshooter shows it can call any of them; each API checks the tick's OIDC token itself |

## Re-run and rollback

- **Re-run:** `CLOUDSDK_ACTIVE_CONFIG_NAME=default bash infra/bootstrap.sh` describes each piece before creating it and
  re-applies the grants as they are, then prints the repository variables. It changes nothing on a second run: it pauses
  `farm-push-tick` only when it creates it, and a job that exists keeps its state.
- **Rollback,** in this order:
  1. delete the scheduler job and the provider;
  2. unbind `farm-api-runtime` from `gs://uma-farm-content`, and delete the bucket with its versions
     (`gcloud storage rm -r --all-versions gs://uma-farm-content`);
  3. delete the service, the deployer, the two accounts and the secret.

  The database keeps its delete protection, so removing it is a separate, deliberate step.

## What it costs

The farm's share of the bill is the `farm` database and its recovery, a few cents a month: Google's free Firestore quota
covers only `(default)`. Everything else stays inside the free tiers it shares with uma-rpg and uma-quest:
- the site, `farm-api` and the images;
- the push tick, the second of three free scheduler jobs;
- `farm-vapid`, the second of six free secret versions;
- `gs://uma-farm-content`: about 3 MB a version, under 50 MB with history, and a few hundred reads a month, so $0.

## Production saves

These rules come from uma-rpg's 2026-10-30 incident, where a hand grant wiped unsynced progress:
- never move `save.account.updatedAt`;
- no server ever writes into a save;
- a stale server date means stop and ask the owner.

Parcels, when they come, keep to them: they live in `parcels`, never inside a save, and each game records its claims in
its own save.
