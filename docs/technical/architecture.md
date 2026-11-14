# Architecture

How uma-farm is built and run. The game's rules are in [the game mechanics document](../game-mechanics.md). Every cloud
value (the project, the services, the database, the buckets, the accounts and their roles) is in
[infrastructure.md](infrastructure.md), the one place to read or change them.

## The pieces

```
 iPhone (Home Screen web app)
   └─ apps/web   React 19 + Vite 7 + Tailwind 4 + Zustand + Dexie; uma-kit for the theme, the frame and bars, sign-in,
                 content loading, the update prompt, the Hub map (Phaser, on demand), the album and the work screens;
                 uma-stage's HD-2D band stage (three.js, on demand) for Home's preview
        │  /api/**  (Firebase Hosting rewrites it to Cloud Run)
        ▼
   apps/api      NestJS 11 on Cloud Run, every route behind uma-server's owner guard unless it checks its own token
        ├─ /api/save ────────► Firestore `farm`: saves, saveBackups, saveRescues  (local: apps/api/.data/save.json)
        ├─ /api/master/** ───► uma-platform's master data release, a bucket       (local: ../uma-platform/content/release)
        ├─ /api/content/** ──► the story pack's private bucket                    (local: content/story-release/)
        ├─ /api/push/** ─────► Firestore `farm`: push; Web Push with the VAPID keys (local: in memory, push off)
        └─ /api/post/ping ───► the parcel ping, checked by its own Google ID token
        ▲
        │  POST /api/push/tick every five minutes, with an OIDC token (the job is paused)
   Cloud Scheduler

   packages/domain   @farm/domain: the rules, the save (v4) and its parse, and the farm's design for the stage;
                     pure TypeScript with no I/O. The web reads its source; the API reads its CommonJS build.
```

### Packages and versions

The `@luismlorenzana/*` packages are uma-platform's, from GitHub Packages, pinned exactly. Changes to them happen in
uma-platform, never in a copy here.

| Package | Version | Used by | For |
|---|---|---|---|
| `@farm/domain` | workspace | web, api | The rules and the save (below) |
| `@luismlorenzana/uma-kit` | 0.19.0 | web | Theme and appearance, the app frame and bars, boot gates, Google sign-in, the content client, the update prompt, the Hub map, the album, the work screens |
| `@luismlorenzana/uma-stage` | 0.4.0 | web; domain (dev, types only) | The HD-2D band stage and its stand-in farm kit; the domain's design types and its test's checks (`/formats`, three-free) |
| `@luismlorenzana/uma-art` | 2.27.0 | web | The bars', map's, item and emote art; the `kit-farm` kit |
| `@luismlorenzana/uma-data` | 1.4.0 | web, domain | Master data's types and readers; test fixtures from `/testing` |
| `@luismlorenzana/uma-work` | 0.1.0 | web, domain | The work engine: slots, queues and entries |
| `@luismlorenzana/uma-server` | 0.2.0 | api | The owner guard, the master data proxy, the private pack route |

| Elsewhere | Versions |
|---|---|
| Workspace | Node 22 or later, pnpm 10.33.0, Turborepo ^2.10.13, TypeScript ~5.9.3, Vitest ^3.2.7 |
| Web | react and react-dom ^19.3.0, react-router ^7.18.3, zustand ^5.0.15, dexie ^4.4.6, firebase ^12.19.0, motion ^12.43.0, workbox-window ^7.4.0; **three 0.187.0** and **phaser 4.2.1** pinned; vite ^7.3.6, vite-plugin-pwa ^1.3.0, tailwindcss ^4.3.3 |
| API | @nestjs/common, core and platform-express ^11.2.4, @nestjs/config ^4.0.4, firebase-admin ^13.10.0, @google-cloud/storage ^7.22.0, google-auth-library ^11.2.0, web-push ^3.6.7 |

### The rules of the codebase

- **The domain decides.** The web app runs the rules locally for instant play. The API parses every upload with the
  same code and refuses one it can't read.
- **The server never writes into a save.** It stores what the app sent, or refuses it and keeps it aside. A new farm
  over an older save is made in the app.
- **Nothing is imported from the other Uma games.** A few pieces were copied from uma-rpg at a recorded commit (30a322a)
  and are owned here, each saying so at its top: the save's envelope and conflict rule, the device store, its sync and
  Dexie, the API client, the API's save and push modules, and the save's rule errors. uma-rpg's work engine is gone.
- **Original-game content never goes in git.** Master data arrives at runtime from uma-platform's private release; the
  story pack lives in the ignored `content/` folder and a private bucket; test fixtures come from
  `@luismlorenzana/uma-data/testing`. `scripts/check-private-content.test.mjs` runs in CI.

## The web app

### Entry and routing

- **`src/main.tsx`** imports `app/stage-boot.ts` first (it reads `?stage=` before the router does), then sets uma-kit's
  device-key prefix (`farm.`), the appearance, the update watcher and the API's token, and mounts the providers: motion,
  uma-art's atlases for the bars and the map, Firebase auth, the content client, the album's art and the work screens'
  item icons, then the router.
- **`src/app/Root.tsx`** holds uma-kit's `BootGates` (splash → Google sign-in → boot → the app) and its `UpdateNotice`
  beside them, so a boot that stopped still offers the new build. It starts the sync triggers and turns the newer-save
  error into its own words (below). A production build without its sign-in config refuses to run.
- **`src/app/router.tsx`:** every page inside the shell, and every page but Account loaded on demand.

| Path | Page |
|---|---|
| `/` | Home: the Hub map (`loop/FarmMap.tsx`), or the HD-2D stage with the preview on |
| `/forest`, `/fishery`, `/mill`, `/sawmill`, `/smokehouse` | A work place (`loop/WorkPlace.tsx`) |
| `/fields` | The Fields |
| `/warehouse` | The Warehouse; `?pick=bin` ships from it |
| `/dorm` | The Dorm |
| `/diary` | The Diary |
| `/hearts` | The Hearts tab (`?view=work` the roster's album, `?uma=<id>` her profile) |
| `/roster` | Redirects to `/hearts?view=work`, keeping `?uma=` |
| `/account` | Account, in the main chunk |
| anything else | Redirects to `/` |

Sheets and scenes are query parameters on the page under them:
- **`?peek=<place>`**, a place's quick look;
- **`?sheet=`** `menu`, `end`, `calendar`, `bin`, `shop`, `rank`, `homestead` (with `&house=<n>`) and `bench`;
- **full-screen scenes** `?event=`, `?ask=`, `?memory=`, `?album=`, `?read=`, `?evening=`, `?level=` and
  `?household=`, under which the HD-2D stage rests.

| Folder | What |
|---|---|
| `src/app/` | Root and the start-over card, the router, the build id, the Firebase config, the stage switch and its boot |
| `src/shell/` | uma-kit's `AppFrame`: the account bar (date, gold, Farm Rank, sync chip), the bottom bar, the Menu sheet, the sync warning |
| `src/home/` | Account |
| `src/loop/` | The farm: its pages, sheets, scenes, actions and views, and the HD-2D stage |
| `src/save/` | Dexie, the store and its sync |
| `src/master/` | Master data |
| `src/story/` | The story pack's loader |
| `src/content/`, `src/api/` | The content client and the API client (same-origin `/api`, with the Firebase ID token) |
| `src/items/` | uma-art's item icons by id |
| `public/push-sw.js` | The service worker's push and tap handlers |

### State

- **The save store** (`src/save/game.ts`): a Zustand store, `useGame`, holding the uid, the boot status, the save, its
  server revision, whether it's dirty, the sync state, the last good sync and when a newer save last replaced local
  changes.
  - **Every change goes through `commit(save)`:** the store, then the device, then a sync 1.5 s later. `commit` never
    stamps `account.updatedAt`; a player's action stamps it with `touched`.
  - **`madeHere(save)`** says whether a save is the one this device's last commit made. The HD-2D stage walks the Umas
    for those, and places everyone at once for any other.
- **Boot** (`boot(uid)`) waits for the story pack, then opens the device save, else the server's, else starts a new
  farm (`newSave`), and resolves `{ startOver }`:
  - a v4 plays as it is;
  - a save older than v4 (read as its version and account) stops at uma-kit's first-launch step, the start-over card
    (`app/StartOverCard.tsx`), with nothing written; its button (`startOver`) keeps a dirty device save as a `wiped`
    safety copy (the raw row, `readStoredRow`), then commits `freshV4`, unstamped, so it uploads and the next boot reads
    v4;
  - a save newer than v4 throws `NEWER_SAVE_WORDS` (below).
- **What a sync plays** (`playable`): a v4 as it is, an older save as the same fresh v4 (uploaded on the next pass), a
  newer one refused before any upload.
- **Sync** (`syncNow`, `reconcile.ts`): one pass reads `GET /api/save`, then `reconcile` decides to adopt, push or do
  nothing; a push sends `PUT /api/save` with its base revision, and a 409 reconciles against the stored envelope it
  carries, up to three times a pass. Passes coalesce, and a change made during one runs another. Triggers: a commit
  (1.5 s later), the page becoming visible, the network returning, and boot with a device save. The player-facing rules
  are in the mechanics document's save section.
- **Master data** (`src/master/master.ts`): a small external store read with `useSyncExternalStore`: the release's
  manifest, the album's rows of every outfit with a stable id, stats, birthdays, each outfit's character and variant, and
  the art index, through the content client from `/api/master`, seen through the story pack's cast once it loads.
- **The story pack** (`src/story/story.ts`): loaded once, by boot, with master data's placeholders (the domain's
  `storyOf`: each character's default outfit, and each outfit's line from its stats); the boot waits for both.
  `outfitFor` resolves a roster key (a character id) to her outfit: the cast's, else her default. As a save comes in, an
  Uma on its roster the cast doesn't hold joins the cast bare (`keepOnCast`) and plays on placeholders.
- **The placeholders** (`packages/domain/src/story/placeholders.ts`): every read of the pack goes through one lookup,
  the pack's or the placeholder (her outfit, line, tastes, birthday, chats, events, meeting scene, chapters, keepsake, pet
  name, ring's words, wedding places, ties and pairs, household, a play's prompt). `writtenOf` says, for each character,
  what's written and what's a placeholder: the Story Sandbox's marks.
- **Device preferences** go through uma-kit's prefs under the `farm.` prefix (the appearance, `farm.stage`). The story's
  last good index is `farm.story-index` in `localStorage`.

### Dexie

Database `uma-farm`, schema version 1, loaded on demand when device I/O starts.

| Table | Key | Row |
|---|---|---|
| `save` | `id`, always `main` | `{ uid, revision, save, dirty, lastSyncedAt }`: the whole save as stored, the server revision it's based on (0: never synced), whether it changed since the last good sync, and when the server last held everything |
| `safety` | `++id`, indexed by `uid` | `{ uid, reason, at, revision, save }`, reason `replaced`, `restore`, `unreadable` or `wiped`; the newest five per account |

- A row for another uid is never read.
- A row that can't be parsed is kept as an `unreadable` safety copy, and boot reads the server's save.
- Nothing replaces unsynced changes without a safety copy: if the copy can't be written, the adopt doesn't happen.
- Where IndexedDB is unavailable (private mode), the store still holds the save and sync still backs it up.

### The PWA and the precache

- **`vite-plugin-pwa`** with `registerType: 'prompt'`: a new service worker waits, and uma-kit's `watchAppUpdates` and
  `UpdateNotice` show **Update ready** with **Restart**. Nothing reloads by itself.
- **The manifest:** Uma Farm, standalone, portrait, `#0f1620`; the icons are drawn by `scripts/draw-icons.mjs`.
- **The precache:** `**/*.{js,css,html,svg,png,woff2}` up to 3 MB a file, except `assets/stage/**`. Navigation falls back
  to `/index.html`, but never for `/api/` or `/__/` (Firebase Hosting's sign-in handler). `push-sw.js` is imported into
  the service worker.
- **Runtime caches:**

| Cache | Matches | Strategy |
|---|---|---|
| `farm-master-files` | `/api/master/files/`, `/api/master/manifests/` | Cache first, 4,000 entries |
| `farm-master-channel` | `/api/master/channels/` | Network first, 4 s timeout |
| `farm-stage` | Same-origin `/assets/stage/` | Cache first, 16 entries; only a 200 that isn't HTML is kept |

- uma-kit's content client also keeps the files it has verified by hash (master data's and the story pack's) in its own
  Cache Storage, `farm-master`.
- **Hosting's headers** (`firebase.json`): `/assets/**` immutable for a year; `/`, extensionless paths, `index.html`,
  `sw.js`, `registerSW.js`, `manifest.webmanifest` and `workbox-*.js` no-cache.

### The HD-2D stage, out of the precache

The preview's code and art download only for a device with the switch on, then stay for offline play.

- **The build puts them in `assets/stage/`.** `vite.config.ts`'s `STAGE_MODULE` matches three.js, uma-stage and the
  stage's own modules; any chunk holding one builds as `assets/stage/[name]-[hash].js`. `STAGE_ASSET` matches uma-art's
  `kit-farm`, whose page builds as `assets/stage/kit-farm-[hash].png`.
- **The precache skips that folder** (`globIgnores`), and the `farm-stage` runtime route caches each file the first time
  it loads.
- **Only the lazy chunk imports them.** `FarmMap.tsx` imports `FarmStage` lazily, and only with the switch on;
  `farm-kit.ts` is the only module that imports the kit's files.
- **`scripts/check-size.mjs` checks it** (`checkStage`): the build fails if the service worker precaches a stage file,
  has no runtime route for `/assets/stage/`, or a chunk outside the stage imports a stage chunk statically, or if there's
  no stage chunk at all. It prints each stage file's size.

| Module | What |
|---|---|
| `src/app/stage-switch.ts`, `stage-boot.ts` | The device switch (`farm.stage`) and `?stage=1`/`0` at boot; small, in the main chunk |
| `src/loop/FarmStage.tsx` | Home on a `BandStage` (saver on, fit to width): the world, the kit, overlays, taps, the season's grade, the fade, the figures, the loop that stops at rest |
| `src/loop/farm-stage.ts` | Pure helpers: the season grades, what a tap opens, the band Home opens on, the fade's markers, the remembered scroll |
| `src/loop/farm-kit.ts` | Loads `kit-farm` once a session and copies the stand-in's frames for what it lacks onto its page |
| `src/loop/farm-figures.ts` | Pure: who stands where, their bubbles, and the moves between two readings |
| `src/loop/figure-looks.ts` | An Uma's sprite set (loaded when the stage's cap lets it go live) and her standee's face |
| `packages/domain/src/farm/stage.ts` | The save as the stage's farm design: plots, recipes, markers and crops |

- **The domain imports uma-stage's types only** (`@luismlorenzana/uma-stage/formats`, a dev dependency), so the API
  never loads it. The domain's test builds every design on the stand-in farm kit with `farmProblems`, the check the stage
  refuses a world on.
- **For debugging,** a dev build exposes `window.__farmStage` (the stage, the kit's name, the design, the plots, the
  figures, who's on the stage, who's walking, whether the loop runs). The stage's root carries `data-farm-stage`
  (`loading`, `drawn`) and `data-kit-name`.

### The build and its flags

`pnpm --filter @farm/web build` type-checks, then builds `apps/web/dist` (`vite build`) and size-checks it. Hosting
serves it.

| Variable | Set in | Read by | Effect |
|---|---|---|---|
| `VITE_FARM_STORY` | `stand-in` in Vitest; by hand on the dev server | `src/story/load.ts`, dev only | `stand-in` plays the invented stand-in pack, whatever farm-api serves |
| `VITE_FIREBASE_*` | `.env.production` | `src/app/firebase-config.ts` | The public Firebase web config. A production build without the API key, auth domain or project id fails |
| `VITE_APP_BUILD_ID`, else `GITHUB_SHA` | CI | `vite.config.ts` | The build id (its first 12 characters; `local` otherwise), shown in Account |
| `API_PROXY_TARGET` | By hand | The dev server | Where `/api` goes (default `http://localhost:8101`) |

### The size budget

`scripts/check-size.mjs` runs after the build, on `dist`:
- **180,000 bytes gzip** for the entry chunk and for the whole initial JS (the HTML's entry and everything it imports
  statically). Dynamic imports don't count.
- **`LAZY_MODULES`** may never render in the initial JS: Phaser and the Hub's scene, the farm's pages, sheets, scenes,
  actions and night, the romance's rules and screens, the story's delivery, three.js, uma-stage, the stage Home and
  its helpers, and the kit's atlas. A module matches by path or suffix. Which modules each chunk renders comes from
  `dist/.vite/chunks.json`, written by the `chunkModules` plugin in `vite.config.ts` (never deployed or precached).
- **`DEV_ONLY_MODULES`:** the invented stand-in story pack may be in no chunk of any build.
- **`checkStage`**, above.

It prints the main and initial JS against the budget, and each stage file. Its own tests are
`scripts/check-size.test.mjs`.

## The API

- **`apps/api/src/main.ts`:** global prefix `/api`, JSON bodies up to 1 MB, CORS for `ALLOWED_ORIGIN` (default
  `http://localhost:5194`; production is same-origin through Hosting), listening on `PORT` (8080; 8101 on the dev
  server).
- **`app.module.ts`:** config, the owner guard, the master data proxy, the story pack's route, the save and push modules,
  and the health and ping controllers.
- **Persistence:** `PERSISTENCE=firestore` uses the Firestore database `FIRESTORE_DATABASE` (default `farm`); anything
  else uses a local file for saves and memory for push.

### The owner guard

uma-server's `AuthModule`, applied to every route:
- a Firebase ID token (`Authorization: Bearer …`) whose email is `ALLOWED_EMAIL` (any case) gets in, as the token's uid;
- no token, or an invalid one: 401. A valid token for anyone else, or no `ALLOWED_EMAIL` set: 403;
- `AUTH_MODE=disabled` lets every request in as the uid `local-dev`, without calling Firebase;
- `@Public()` routes skip it: health, the parcel ping and the push tick, which check their own tokens. The master and
  content controllers also carry the guard themselves, so neither can go out unguarded.

### Routes

| Route | Guard | What |
|---|---|---|
| `GET /api/health` | Public | `{ ok, build }`, the deploy's commit (`BUILD_ID`) |
| `GET /api/save` | Owner | The stored envelope `{ revision, save }`, or `{ revision: 0, save: null }` |
| `PUT /api/save` | Owner | `{ baseRevision, save }`: stored as the next revision, or refused ([below](#revisions-and-refusals)) |
| `GET /api/master/*` | Owner | uma-platform's release: `files/` (cached for good), `manifests/` and `channels/` (no-cache). `MASTER_BUCKET` in production, `MASTER_DIR` locally |
| `GET /api/content/*` | Owner | The story pack ([below](#the-story-packs-delivery)) |
| `POST /api/post/ping` | Its own token | `{ ok: true }` for a Google-signed ID token whose audience is `FARM_API_URL` and whose email is on `POST_CALLERS`; anything else 401 |
| `GET /api/push/key` | Owner | `{ publicKey }`, the VAPID key; 404 while push is off |
| `POST /api/push/subscription` | Owner | A browser's `PushSubscription` (an https endpoint, `p256dh`, `auth`), kept with the newest five; 204 |
| `PUT /api/push/schedule` | Owner | `{ entries: [{ at, place, badge }] }`, at most 36, replacing the stored schedule; 204 |
| `POST /api/push/test` | Owner | A test notification to every device; `{ devices }` still subscribed |
| `POST /api/push/tick` | The scheduler's token | Sends what came due; `{ accounts, sent }` |

### Push, and its paused scheduler

The push routes work, but nothing uses them: days are turns, so nothing finishes while the app is closed. The web app
sends no subscription and no schedule, and Account's Notifications card says "Off: days are turns". **The Cloud
Scheduler job that calls the tick every five minutes is paused.** The routes, the service worker's handlers and the job
stay in place, so notifications can come back without new plumbing.

- **The keys:** `VAPID_KEYS` (`{ publicKey, privateKey }`, from Secret Manager in production). Without them push is off:
  the key route answers 404 and nothing sends.
- **The tick's guard** (`SchedulerGuard`): a Google-signed OIDC token for `PUSH_AUDIENCE` from the scheduler's account
  (`PUSH_SCHEDULER_EMAIL` overrides the default). No token, a bad one, or no audience set: 401. Any other account: 403.
  Nothing lets an unsigned tick in, locally either.
- **The tick:** for each account with a subscription, every schedule entry due since its last send (six hours back at
  most) becomes one "Work done" notification, a line per place, sent to every device. A device that answers 404 or 410
  is dropped. It writes only when it sent something or a device was gone.
- **The schedule's places** are the farm's nine work places (`isPushPlace`), at most 36 entries (`PUSH_SCHEDULE_MAX`, one
  a slot); one place's notice opens its quick look (`/?peek=<place>`).

## The save on the wire

### Documents

| Document | Fields | Written |
|---|---|---|
| `saves/{uid}` | `revision`; `save`, as JSON text (Firestore refuses a list inside a list); `updatedAt`, the server's time | Each accepted upload, in a transaction |
| `saveBackups/{uid}-v{n}` | The stored `saves/{uid}` document as it was, whole, and `backedUpAt` | In the same transaction, when an upload's version is higher than the stored version `n`: the first v4 over an older save backs that one up (`saveBackups/{uid}-v3` for the owner's) |
| `saveRescues/{uid}` | `upload` (JSON text, exactly as sent), `reason`, `rescuedAt` | Each refused upload; the newest only |
| `push/{uid}` | `subscriptions` (the newest five), `active` (any subscriptions), `schedule`, `checkedAt` (ms), `updatedAt` | The push routes and the tick, each setting only its own fields |

**Locally** the saves are one JSON file, `apps/api/.data/save.json` (`LOCAL_SAVE_FILE` moves it): `{ [uid]: { revision,
save } }`, written atomically (a temporary file, then a rename) with calls serialized. A refused upload goes to
`save.json.rescue.json` beside it (the newest only). There are no backups locally, and push lives in memory.

### Revisions and refusals

- **`GET /api/save`** returns the stored save parsed (`parseStored`): a v4 whole, a save from before v4 as its version and
  account only (the rest stays in the document, unread).
- **`PUT /api/save`** takes exactly `{ baseRevision, save }`. The API parses the save strictly as v4 (`parseSavePut`) and
  checks that `save.account.uid` is the caller's. It stores the save as `baseRevision + 1` when the stored revision is
  `baseRevision` and the save's version isn't older than the stored one, and answers the new envelope.
- **A 409** carries `{ message: 'revision conflict', current }`, the stored envelope, so the app can reconcile and retry.

| Upload | Answer | Kept in `saveRescues` |
|---|---|---|
| Accepted | 200, the new envelope | — |
| Stale revision, same or newer version | 409 with `current` | No: the app just syncs again |
| A version older than v4 (an old cached build's) | 400, "expected 4" | Yes: it may hold play that can never be uploaded |
| A version older than the stored one | 409 with `current` | Yes |
| A save the parse refuses (shape, unknown keys, ids, a newer version) | 400, with the failing path | Yes |
| Another account's save | 400 | Yes |
| Any other failure | 500 | Yes |

A rescue that fails to write is logged and never hides why the upload was refused.

### Versions

| Version | What | Who writes it |
|---|---|---|
| 1–3 | Older formats, from before the farm started over | Nothing: read as `{ version, account }` (`OlderSave`) |
| 4 | The farm: the farmer's name, the loop, love, the homestead, memories, arrivals, rosters keyed by character id | The app (`SAVE_VERSION`) |

- **`parseSave`** (`packages/domain/src/save/save.ts`) parses a v4 strictly (`parse-v4.ts`, with `parse-loop.ts`'s
  parts): unknown keys and bad ids are refused, each error with its path (`SaveParseError`). It refuses any other version:
  what an upload must be. **`parseStored`** reads what's stored, on the server or the device: a v4 by `parseSave`, a
  v1–v3 as its version and account only, a newer one refused.
- **The new farm runs in the app, never on the server:** `freshV4` (`save/v4.ts`) makes day 1 on v4 with `account`
  copied whole, committed unstamped, so it uploads with `updatedAt` unchanged and the next boot reads v4; a dirty device
  save it replaces is kept first as a `wiped` safety copy.
- **v4 grows in place while the game is being built;** a shape old fields can't carry is v5, with a migration or a new
  start.
- **Only a player's change moves `account.updatedAt`** (`touched`). The conflict rule (`resolveConflict`) compares it:
  the newer wins whole, a tie keeps the device's.
- **The production-save rules:** never move `save.account.updatedAt` by hand; no server ever writes into a save; a stale
  server date means stop and ask the owner.

### The newer-save refusal

An old client never half-reads or overwrites a newer save:
- **The parse** refuses a version above `SAVE_VERSION`, on the server (a 400, rescued) and on the device (the row is kept
  as an `unreadable` safety copy and boot reads the server's).
- **A newer server save:** boot throws `NEWER_SAVE_WORDS`, so it stops on uma-kit's gate with "This save is from a newer
  version of the farm." and Try again; `Root.tsx` asks the service worker for an update at once, so the update prompt
  comes up. A sync that meets one stops before any upload.
- **The server** refuses an upload older than the stored version (a 409, rescued).

## The story pack's delivery

The game's story is a private pack: never in git, never in the bundle.

- **The source** is the ignored `content/story/` on the author's Mac.
- **`pnpm story:release`** (`scripts/story/release.mjs`; Node 22.18 or later, for type stripping) reads the pack with
  the game's own reader (`readStoryPack`, read in place). Any pack releases: an error (only what the game can't read)
  skips the one part it's in, notes block nothing, and both are printed; it refuses only a missing pack folder. The
  release holds the pack as the game reads it ([the menu](../story-pack.md)). It writes the ignored
  `content/story-release/`, laid out as the bucket is: the index `story.json` (each file's path, bytes and SHA-256) and
  each file minified as `story/<name>.<hash8>.json`. The same inputs give the same files, and only the pack's own files
  are read. `--stand-in` releases the invented stand-in in git, for the dev server; `--from <dir> --out <dir>` moves
  both ends. Tests: `scripts/story/release.test.mjs`.
- **`pnpm story:publish`** (`scripts/story/publish.sh`) runs the release, then uploads the hash-named files first
  (`gcloud storage rsync`, `private, max-age=31536000, immutable`) and `story.json` last (`private, no-cache`), so a
  reader never sees an index pointing at missing files. Old files stay, so a phone holding an older index still reads
  it, and the bucket's versioning keeps older indexes. It scopes every gcloud call by the environment and never changes
  the account. `--dry-run` lists what it would upload. The bucket is `gs://uma-farm-content`, or `$STORY_BUCKET`.
- **The route** (`apps/api/src/story/story-pack.ts`): uma-server's `PrivatePackModule` at `/api/content/`, behind the
  owner guard. It serves an allowlist only, `story.json` and `story/<name>.<hash8>.json`: the index revalidated on every
  read (`private, no-cache`), the hash-named files cached for good. It reads `STORY_BUCKET` when that's set and not empty,
  else `STORY_DIR` (default the repo's `content/story-release/`); with neither, every path answers 404.
- **The loader** (`apps/web/src/story/load.ts`, `delivery.ts`), by boot:
  - `story.json` fresh from the server through uma-kit's content client;
  - offline or failing, the **last good index** from `localStorage` (`farm.story-index`, a few KB of ids and hashes,
    never a line of the story); with none, the load throws and the boot gate offers Try again;
  - each file by its path, verified against the index's hash and kept in the content client's Cache Storage, so it
    downloads once: the cast, the ties, the bibles and the household at boot, routes and pairs on demand;
  - each file read with the same reader, a part with an error skipped; only a hash that doesn't match, or a route or
    pair that isn't what the index lists, fails the load;
  - the index is kept on the device only once the pack it names has loaded;
  - a 404 for `story.json` (nothing published yet, or no release on the dev server) plays no pack: master data's first
    five on placeholders, so a farm always opens and plays whole;
  - the invented stand-in is the tests' only (`VITE_FARM_STORY=stand-in`, dev only); `DEV_ONLY_MODULES` keeps it out of
    every production build.

## Build, CI and deploy

[`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs on every push to `main`, on pull requests and
by hand. **A push that changes only `docs/**` or Markdown files skips it.**

| Job | When | Steps |
|---|---|---|
| **Test and build** | Every run | Node 22 and pnpm; `pnpm install --frozen-lockfile`; `pnpm lint` (type-check every package); `pnpm test:ci`; `pnpm build` |
| **Deploy API and web** | After it passes, on a push to `main`, with the repository variable `DEPLOY_ENABLED` set to `true`; one deploy at a time, never cancelled | Below |

**What's checked:**
- **`pnpm lint`:** `tsc --noEmit` in every package.
- **`pnpm test:ci`:** Node's test runner on the script checks (the size check's tests, private content, the Hosting
  site's name, the Story Sandbox's libraries, the story release), then every package's Vitest, one package at a time.
- **`pnpm build`:** the domain's CommonJS build, the API's Nest build, and the web's build with its size check.

**What deploys:**
1. GitHub's OIDC token signs in to Google Cloud through Workload Identity.
2. The API's Docker image (`apps/api/Dockerfile`: a pnpm install with the package token as a build secret, the domain's
   and the API's builds, then a production-only deploy into a Node 22 slim image) is pushed to Artifact Registry and
   deployed to Cloud Run, with its environment and the VAPID secret.
3. **The API is verified:** `/api/health` answers with this commit, `/api/save` answers 401 without a token, and
   `/api/post/ping` answers 401.
4. The web builds again and deploys to Firebase Hosting, naming its site.
5. **The site is verified:** the shell answers with `cache-control: no-cache`; `/api/health` through Hosting answers with
   this commit; `/api/save` through Hosting answers 401; and uma-rpg's own site still answers, a guard against a site
   mix-up.

`scripts/check-hosting-site.mjs` keeps `firebase.json`'s site, the workflow's default and its `--only hosting:<site>` in
agreement. Every value the deploy reads is in [infrastructure.md](infrastructure.md).

## Local development

```bash
NODE_AUTH_TOKEN=$(gh auth token) pnpm install   # @luismlorenzana/* come from GitHub Packages
pnpm api    # :8101, auth off (uid local-dev); saves in apps/api/.data/save.json; push in memory and off
pnpm web    # :5194, /api proxied to :8101; the game on save v4
pnpm lint && pnpm test && pnpm build
```

- **[`.claude/launch.json`](../../.claude/launch.json)** starts `farm-api` (:8101), `farm-web` (:5194) and
  `farm-story-sandbox` (:4321) in the preview pane.
- **The dev server plays the game** as production does, on save v4. `VITE_FARM_STORY=stand-in pnpm web` plays the
  stand-in whatever farm-api holds. The dev server is open on the LAN (`host: true`), so a phone can load it directly.
- **The dev save** is `apps/api/.data/save.json`, its last refused upload beside it. A dev save from before v4 shows the
  start-over card like any other; the local store keeps no backup of it. To start afresh, reset that file and the
  browser's `uma-farm` database.
- **Master data** comes from `../uma-platform/content/release` (`MASTER_DIR` points elsewhere). **The story pack**
  comes from `content/story-release/` (`STORY_DIR`): `pnpm story:release` fills it, `pnpm story:release --stand-in`
  fills it with the stand-in, and with nothing there the dev server plays no pack, on placeholders, as a fresh phone
  does.
- **The owner guard locally:** run the built API with `ALLOWED_EMAIL` set and no `AUTH_MODE`.
- **The Story Sandbox** (`tools/story-sandbox`, [its README](../../tools/story-sandbox/README.md)): `pnpm stories` serves
  http://127.0.0.1:4321, a local page for reading, playing and reviewing the story. It reads the private
  `content/story/` (read by the game's own reader, its errors and notes shown with counts; nothing blocks), the chapter
  drafts in `docs/story/chapters/`, and the game's
  story code, on every request. Its only write is the owner's reviews, to `content/story/reviews.json`. It has no
  dependencies, binds to 127.0.0.1 and refuses other hosts. `pnpm stories:import-pack` brings in the Umas' pictures.

## The live docs

Lists in the mechanics document that come straight from the rules are rendered from the code, so they can't drift.

- **A block** is marked in [game-mechanics.md](../game-mechanics.md) as `<!-- live:<key> -->` … `<!-- /live -->`.
- **`packages/domain/src/docs/render.ts`** renders each key from the rules (`renderBlock(key)`). It's pure: no I/O.
- **`packages/domain/src/docs/docs.test.ts`** reads the document and fails when a block differs from what `render.ts`
  makes of the code today, or names an unknown key.
- **`pnpm docs:update`** (`UPDATE_DOCS=1`, the domain's docs test) rewrites every block in place. Run it in the same
  change as any rule a block shows.
