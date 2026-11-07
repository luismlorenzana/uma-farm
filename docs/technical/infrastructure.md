# Infrastructure

> **Status: 2026-11-07, planned. Nothing in the cloud exists yet.** F2 creates it and replaces "planned" with live values.
> The plan for all three apps in the project is uma-rpg's
> [cloud plan](https://github.com/luismlorenzana/uma-rpg/blob/main/docs/design/cloud/plan.md) (IN1–IN26).

## The shared project

uma-farm lives in GCP project **`uma-rpg`** (number 727687479415, billing account `0101E5-D99B49-A8B713`), beside
uma-rpg (live) and uma-quest (planned). Each app has its own pieces, and none can reach another's (IN2, IN5, IN6). Four
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

## uma-farm's pieces (planned, F2)

| Piece | Value |
|---|---|
| Repo | `luismlorenzana/uma-farm`, private until the owner's word, then public (D1) |
| Site | `https://uma-farm.web.app`, Hosting site `uma-farm` (`uma-farm-lm` if taken), 20 versions kept |
| Firebase web app | Uma Farm web; its public config goes in `apps/web/.env.production` |
| API | Cloud Run `farm-api`, `us-central1`, min 0, max 1, 512 MiB, 1 CPU, public at the edge. The owner guard covers every route except `/api/health`, and `/api/post/*` and `/api/push/tick`, which check their own tokens |
| Runtime account | `farm-api-runtime`: `datastore.user` only on `projects/uma-rpg/databases/farm`; reader of the master bucket; accessor of `farm-vapid` |
| Database | Firestore `farm`, Native, `us-central1`, delete protection and point-in-time recovery on: `saves/{uid}`, `saveRescues/{uid}`, `parcels/{id}`, `push/{uid}` |
| Images | Artifact Registry `farm`, keeping the last 3 |
| Deployer | `farm-deploy`: writer on `farm` images, admin of `farm-api`, user of `farm-api-runtime`, Hosting admin (project-wide, so the workflow names its site and CI checks it, IN7) |
| Deploy sign-in | Provider `uma-farm` in pool `github-actions`, `main` of `luismlorenzana/uma-farm` only |
| Push (IN17) | Secret `farm-vapid`; account `farm-push-scheduler` with `run.invoker` on `farm-api` only; Cloud Scheduler `farm-push-tick` every five minutes, **paused** until F6 |
| Parcels (IN18) | Sender: `/api/post/*` accepts a Google ID token whose audience is `FARM_API_URL` and whose account is on `POST_CALLERS` (`quest-api-runtime` first; `rpg-api-runtime` and `racer-api-runtime@uma-racer` when they receive). No IAM grant, no keys |
| Private content | None (IN16): its art is uma-art's, its Umas come through master data |
| Label | `app=farm` |
| Local | API on 8101, web on 5194 (uma-rpg uses 8081 and 5174, uma-quest 8091 and 5184) |

**Repository variables (F2):** `GCP_PROJECT_ID=uma-rpg`, `WIF_PROVIDER`, `DEPLOY_SA`, `ALLOWED_EMAIL`, `MASTER_BUCKET`,
`FIRESTORE_DATABASE=farm`, `HOSTING_SITE=uma-farm`, `PUSH_AUDIENCE`, `POST_CALLERS`, `DEPLOY_ENABLED`.

## What it costs

uma-farm's share of the cloud plan's bill: the `farm` database and its recovery, a few cents a month (Google's free
Firestore quota covers only `(default)`). The site, `farm-api`, the images, the push tick (the second of three free
scheduler jobs) and `farm-vapid` (the second of six free secret versions) stay inside the free tiers they share with
uma-rpg and uma-quest. The full table is in [the plan](../design/plan.md#what-it-costs).

## Production saves (from F3)

uma-rpg's rules, from its 2026-10-30 incident, where a hand grant wiped unsynced progress:
- never move `save.account.updatedAt`;
- no server ever writes into a save;
- a stale server date means stop and ask the owner.

Parcels keep to them (FM10): they live in `parcels`, never inside a save, and each game records its claims in its own
save.
