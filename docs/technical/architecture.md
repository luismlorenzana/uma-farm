# Architecture

How uma-farm is built and run. The game's rules are in [the game mechanics document](../game-mechanics.md). Every cloud
value (the project, the services, the database, the buckets, the accounts and their roles) is in
[infrastructure.md](infrastructure.md), the one place to read or change them.

## The pieces

```
 iPhone (Home Screen web app)
   └─ apps/web   React 19 + Vite 7 + Tailwind 4 + Zustand + Dexie, laid out in landscape; uma-kit for the theme, the
                 landscape stage, the frame and side panels, sign-in, content loading, the update prompt, the Hub map
                 (Phaser, on demand), the album and the work screens
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

   packages/domain   @farm/domain: the rules, and the save (v6) and its parse; pure TypeScript with no I/O. The web reads its source; the API reads its CommonJS build.
```

### Packages and versions

The `@luismlorenzana/*` packages are uma-platform's, from GitHub Packages, pinned exactly. Changes to them happen in
uma-platform, never in a copy here.

| Package | Version | Used by | For |
|---|---|---|---|
| `@farm/domain` | workspace | web, api | The rules and the save (below) |
| `@luismlorenzana/uma-kit` | 0.20.0 | web | Theme and appearance, the landscape stage (`KitStage`), the app frame with its left rail and top bar (0.20.0's landscape variants), its side panels (regular and wide) and the quick look's panel, boot gates, Google sign-in, the content client, the update prompt, the Hub map, the album |
| `@luismlorenzana/uma-art` | 2.30.0 | web | The bar's, map's, item and emote art |
| `@luismlorenzana/uma-data` | 1.10.0 | web, domain | Master data's types and readers (the `dialogue-portraits` family from 1.7.0, its profile pictures from 1.9.0); test fixtures from `/testing` |
| `@luismlorenzana/uma-work` | 0.1.0 | web, domain | The Warehouse's stock types (the work engine's screens are retired with the work board) |
| `@luismlorenzana/uma-server` | 0.2.0 | api | The owner guard, the master data proxy, the private pack route |

| Elsewhere | Versions |
|---|---|
| Workspace | Node 22 or later, pnpm 10.33.0, Turborepo ^2.10.13, TypeScript ~5.9.3, Vitest ^3.2.7 |
| Web | react and react-dom ^19.3.0, react-router ^7.18.3, zustand ^5.0.15, dexie ^4.4.6, firebase ^12.19.0, motion ^12.43.0, workbox-window ^7.4.0; **phaser 4.2.1** pinned; vite ^7.3.6, vite-plugin-pwa ^1.3.0, tailwindcss ^4.3.3 |
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

- **`src/main.tsx`** sets uma-kit's device-key prefix (`farm.`), the appearance, the update watcher and the API's
  token, and mounts the providers: motion, uma-art's atlases for the bar and the map, Firebase auth, the content client,
  and the album's art, then the router.
- **`src/app/Root.tsx`** puts the whole app on uma-kit's landscape stage (`KitStage layout="landscape"`, not turned, in a
  fixed full-screen box), with uma-kit's `BootGates` (splash → Google sign-in → boot → the app) and its `UpdateNotice`
  beside them, so a boot that stopped still offers the new build; and, outside the stage, the upright card
  (`app/Upright.tsx`). It starts the sync triggers and turns the newer-save
  error into its own words (below). A production build without its sign-in config refuses to run.
- **`src/app/router.tsx`:** every page inside the shell, and every page but Account loaded on demand.

| Path | Page |
|---|---|
| `/` | Home: the farm's tile map (`loop/FarmMap.tsx`; `?tile=<n>` a tile's panel) |
| `/warehouse` | The Warehouse; `?pick=bin` picks a crate to ship |
| `/diary` | The Diary |
| `/hearts` | People, the Umas' page (`?view=work` the roster's album, `?uma=<id>` her profile) |
| `/roster` | Redirects to `/hearts?view=work`, keeping `?uma=` |
| `/town` | The Town (`town/TownPage.tsx`; `?view=people` everyone in town, `?talk=<id>` a talk) |
| `/book` | The farm's book (`book/BookPage.tsx`) |
| `/account` | Account, in the main chunk |
| anything else | Redirects to `/` |

Sheets and scenes are query parameters on the page under them:
- **`?tile=<n>`**, a field tile's panel; **`?peek=<place>`**, a place's quick look or panel (the woods' edge, the
  pond's, a station);
- **`?sheet=`** `menu`, `end`, `calendar`, `bin`, `shop`, `rank`, `homestead` (with `&house=<n>`) and `bench`;
- **full-screen scenes** `?event=`, `?ask=`, `?memory=`, `?album=`, `?read=`, `?evening=`, `?level=` and
  `?household=`.

| Folder | What |
|---|---|
| `src/app/` | Root and the start-over card, the upright card, the router, the build id, the Firebase config |
| `src/shell/` | uma-kit's `AppFrame` as a rail and a bar: the rail (`BottomBar side="left"`: Farm · Town · Library · Ledger · Diary), the bar (`AccountBar landscape="bar"`: date, gold, sync chip, then actions left, End the day, Menu), the Menu's panel, the sync warning |
| `src/library/` | Lazy portrait shelves and individual books, with scene and illustration viewers loaded on demand. The save holds dated proof and bounded outing receipts. Route scripts and art remain in their releases. |
| `src/hd2d/` | Default Field and Pond Home view on WebGL 2. Pure save projection, original instanced scene, and a lazy shared `LookStage` adapter. The tile map remains available for all farm places and renderer fallback. |
| `src/guide/` | Illustrated help topics shared by the contextual sheets and lazy `/guide` index. Topics carry three steps, a short rule, and optional reference details at the call site. |
| `src/home/` | Account |
| `src/book/` | The farm's book |
| `src/town/` | The Town |
| `src/loop/` | The farm: its pages, sheets, scenes, actions and views |
| `src/dialogue/` | The dialogue engine every scene plays on: the stage, the line, the bust and its portraits |
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
- **Boot** (`boot(uid)`) waits for the story pack, then opens the device save, else the server's, else starts a new
  farm (`newSave`), and resolves `{ startOver }`:
  - v6 plays as stored;
  - a v5 loads in full, expands on the phone, and syncs the v6 save without moving the player’s timestamp;
  - a save older than v5 (read as its version and account; a v4 of blocks and jobs too) stops at uma-kit's
    first-launch step, the start-over card (`app/StartOverCard.tsx`), with nothing written; its button (`startOver`)
    keeps a dirty device save as a `wiped` safety copy (the raw row, `readStoredRow`), then commits `freshV6`,
    unstamped, so it uploads and the next boot reads v6;
  - a save newer than v6 throws `NEWER_SAVE_WORDS` (below).
- **What a sync plays** (`playable`): v6 as stored, v5 as a calendar upgrade, and v1 through v4 as a fresh v6. A newer
  version stops the sync.
- **Sync** (`syncNow`, `reconcile.ts`): one pass reads `GET /api/save`, then `reconcile` decides to adopt, push or do
  nothing; a push sends `PUT /api/save` with its base revision, and a 409 reconciles against the stored envelope it
  carries, up to three times a pass. Passes coalesce, and a change made during one runs another. Triggers: a commit
  (1.5 s later), the page becoming visible, the network returning, and boot with a device save. The player-facing rules
  are in the mechanics document's save section.
- **Master data** (`src/master/master.ts`): a small external store read with `useSyncExternalStore`: the release's
  manifest, the album's rows of every outfit with a stable id, stats, birthdays, each outfit's character and variant, and
  the art index, through the content client from `/api/master`, seen through the story pack's cast once it loads.
- **Her portraits** (`src/dialogue/portraits.ts`, loaded with the players): master data's `dialogue-portraits` family,
  read per character id the first time she's on a stage (`client.dialoguePortraits`, checked against the release; an Uma
  the art index's `dialoguePortraits` map doesn't list costs no fetch), each picture then by its path through the content
  client, verified and cached by hash. `Bust.tsx` composes them: the outfit by context and the face by the expressions'
  fallbacks (the domain's `story/look.ts`), the face drawn over the base at that base's position by the browser; without
  her portraits, her master-data bust. Tests set a synthetic source (`setPortraitSource`).
- **Her picture** (`src/dialogue/Avatar.tsx` and `picture.ts`, loaded with the lists and the players): the one avatar
  every list draws an Uma's small face with, a rounded square (`rounded-avatar`). Inside it, the first of: her season's
  profile picture from `dialogue-portraits` (uma-data 1.9.0's `dialogueProfileFor`, 192 px, drawn whole); for a
  release before profiles, her season's portrait base placed in CSS so a head-and-shoulders square around its `face`
  fills the box; master data's face for her, as uma-kit's FaceTile drew it; her blank profile (`blank-profile.tsx`) in
  the season's colours. `pictureSource` is the single seam where the picture's source is chosen. uma-kit's own face
  tiles (the pickers) get no face URL from the album's art (`master/album-art.tsx`) for an Uma with portraits, so their
  fallback draws her picture; the others get master data's face as before.
- **The story pack** (`src/story/story.ts`): loaded once, by boot, with master data's placeholders (the domain's
  `storyOf`: each character's default outfit, and each outfit's line from its stats); the boot waits for both.
  `outfitFor` resolves a roster key (a character id) to her outfit: the cast's, else her default. As a save comes in, an
  Uma on its roster the cast doesn't hold joins the cast bare (`keepOnCast`) and plays on placeholders.
- **The placeholders** (`packages/domain/src/story/placeholders.ts`): every read of the pack goes through one lookup,
  the pack's or the placeholder (her outfit, line, tastes, birthday, chats, events, meeting scene, chapters, keepsake, pet
  name, ring's words, wedding places, ties and pairs, household, a play's prompt). `writtenOf` says, for each character,
  what's written and what's a placeholder: the Story Sandbox's marks.
- **Device preferences** go through uma-kit's prefs under the `farm.` prefix (the appearance). The story's
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
- **The manifest:** Uma Farm, standalone, landscape, `#0f1620`; the icons are drawn by `scripts/draw-icons.mjs`. iOS
  doesn't lock a Home Screen app's orientation, so the upright card covers the game while the phone is held upright.
- **The precache:** `**/*.{js,css,html,svg,png,woff2}` up to 3 MB a file. Navigation falls back
  to `/index.html`, but never for `/api/` or `/__/` (Firebase Hosting's sign-in handler). `push-sw.js` is imported into
  the service worker.
- **Runtime caches:**

| Cache | Matches | Strategy |
|---|---|---|
| `farm-master-files` | `/api/master/files/`, `/api/master/manifests/` | Cache first, 4,000 entries |
| `farm-master-channel` | `/api/master/channels/` | Network first, 4 s timeout |

- uma-kit's content client also keeps the files it has verified by hash (master data's and the story pack's) in its own
  Cache Storage, `farm-master`.
- **Hosting's headers** (`firebase.json`): `/assets/**` immutable for a year; `/`, extensionless paths, `index.html`,
  `sw.js`, `registerSW.js`, `manifest.webmanifest` and `workbox-*.js` no-cache.

### The landscape frame

The game is laid out sideways, designed at 844 × 390 and checked at 667 × 375.

- **uma-kit's landscape stage.** `Root.tsx` wraps the app in `KitStage layout="landscape"` (turn 0) inside a fixed
  full-screen box. On it, every `Sheet` is a panel from the right edge (`data-placement="side"`, portalled into the
  stage's layer): `min(26rem, 62cqw)` wide, or `min(34rem, 75cqw)` with `size="wide"` for the content-heavy ones (her
  profile, the morning summary, the homestead). The quick look's `PeekPanel` keeps clear of the right inset. The stage
  is a size container, so the panels size by it. The update prompt (`UpdateNotice clearSides`) keeps clear of the side
  insets as well as the top one.
- **The frame is the kit's left rail and top bar,** uma-kit 0.20.0's opt-in landscape variants. `shell/Shell.tsx`
  passes `AppFrame landscape="rail-and-bar"` the rail as its `bottom` (a full-height rail down the left edge) and the bar
  as its `top` (across the page column). The rail clears the left safe area, so the column zeroes `--inset-left`. Under
  the bar sit the sync warning and the page, which keeps clear of the right and bottom safe areas itself (`pr-safe
  pb-safe`).
- **The bar** (`shell/Bars.tsx`) is `AccountBar landscape="bar"`: the kit's chips, the date (the season's mark, the day
  and the season's name) and the gold, and its sync chip while offline or paused; in its `actions` slot the farm's own
  actions-left chip (it opens nothing and greys at 0, so it isn't a kit chip, which is a link) and End the day; then the
  kit's Menu. **The rail** is `BottomBar side="left"`: the five pages, labels under the icons, the active marker on its
  inner edge.
- **Two columns where they fit** come from container queries (`@container` on the page, `@lg:` / `@xl:` on its lists);
  Account's from the kit's `AccountPage columns={2}` (two CSS columns on a page at least 36rem wide).
- **Scenes** stay full-screen fixed layers, laid out as rows on the dialogue engine's `Stage` (`dialogue/Stage.tsx`: her
  bust left on an optional backdrop, the line or the choices right) for the opening, meeting her, the bench scene, heart
  events (the place card as the backdrop), and the pair and household players; the level-up and stage-up cards and the
  plays in two columns.
- **The upright card** (`app/Upright.tsx`) shows by CSS alone (Tailwind's `portrait:`), at z 1000 outside the stage.

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
  actions and night, the romance's rules and screens, the story's delivery, the town and the Book. A module matches by
  path or suffix. Which modules each chunk renders comes from
  `dist/.vite/chunks.json`, written by the `chunkModules` plugin in `vite.config.ts` (never deployed or precached).
- **`DEV_ONLY_MODULES`:** the invented stand-in story pack may be in no chunk of any build.

It prints the main and initial JS against the budget. Its own tests are
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
| `saveBackups/{uid}-v{n}` | The stored `saves/{uid}` document as it was, whole, and `backedUpAt` | In the same transaction, when an upload's version is higher than the stored version `n`: the first v6 over v5 backs up the entire stored save as `saveBackups/{uid}-v5` |
| `saveBackups/{uid}-maintenance-r{n}` | The whole cloud document at revision `n` and `backedUpAt` | In the same conditional Firestore commit as an owner maintenance adjustment |
| `saveRescues/{uid}` | `upload` (JSON text, exactly as sent), `reason`, `rescuedAt` | Each refused upload; the newest only |
| `push/{uid}` | `subscriptions` (the newest five), `active` (any subscriptions), `schedule`, `checkedAt` (ms), `updatedAt` | The push routes and the tick, each setting only its own fields |

**Locally** the saves are one JSON file, `apps/api/.data/save.json` (`LOCAL_SAVE_FILE` moves it): `{ [uid]: { revision,
save } }`, written atomically (a temporary file, then a rename) with calls serialized. A refused upload goes to
`save.json.rescue.json` beside it (the newest only). There are no backups locally, and push lives in memory.

### Owner maintenance

The command-line tool `scripts/farm-save-maintenance.mjs` uses the operator's existing Google Cloud sign-in,
scoped to the `farm` database. It previews one adjustment. It can set gold, set a Warehouse count at exact stars,
or restart the first Spring at day 1. Run `pnpm --filter @farm/domain build` first and use one of these commands.

- `node scripts/farm-save-maintenance.mjs spring-1`
- `node scripts/farm-save-maintenance.mjs gold 500`
- `node scripts/farm-save-maintenance.mjs stock carrot@1 9`

Add `--apply <preview-revision> <verified-deployed-commit>` for an owner-authorized write. Both the live revision and
the document's update time must match. Firestore stores the full prior revision and the adjustment in one commit.
The tool verifies the saved result and backup. A Spring restart records the current turn in `calendar.start`.
Signed dates, changes already made today, and every elapsed countdown stay on the same counter. A restart is available
once, in the first Spring before weddings or a live contest. The calendar uses Spring 1 at that counter and uses the
normal schedule from there. Older entries retain their original stored turns. The app uses its normal sync to adopt
the restart and saves a device recovery copy if there were unsynced changes. Restoring a device copy from the same
turn or later carries the calendar setting forward.

### Revisions and refusals

- **`GET /api/save`** returns the stored save parsed (`parseStored`): v5 and v6 in full, a save from before v5 as its version and
  account only (the rest stays in the document, unread).
- **`PUT /api/save`** takes exactly `{ baseRevision, save }`. The API parses the save strictly as v6 (`parseSavePut`) and
  checks that `save.account.uid` is the caller's. It stores the save as `baseRevision + 1` when the stored revision is
  `baseRevision` and the save's version isn't older than the stored one, and answers the new envelope.
- **A 409** carries `{ message: 'revision conflict', current }`, the stored envelope, so the app can reconcile and retry.

| Upload | Answer | Kept in `saveRescues` |
|---|---|---|
| Accepted | 200, the new envelope | — |
| Stale revision, same or newer version | 409 with `current` | No: the app just syncs again |
| A version older than v6 (an old cached build's) | 400, "expected 6" | Yes: it may hold play that can never be uploaded |
| A version older than the stored one | 409 with `current` | Yes |
| A save the parse refuses (shape, unknown keys, ids, a newer version) | 400, with the failing path | Yes |
| Another account's save | 400 | Yes |
| Any other failure | 500 | Yes |

A rescue that fails to write is logged and never hides why the upload was refused.

### Versions

| Version | What | Who writes it |
|---|---|---|
| 1–3 | Older formats, from before the farm started over | Nothing: read as `{ version, account }` (`OlderSave`) |
| 4 | The farm of blocks, the work board's and the stations' jobs | Nothing: read as `{ version, account }`, and started over |
| 5 | The farm: the farmer's name, the field's tiles, the stations' loads, the day's actions (`today.actions`, `today.eventActions`, `today.town`), the farm's accounts (`farm.loans`, `owed`, `short`, `income`), love, the homestead, memories, arrivals, rosters keyed by character id | The app (`SAVE_VERSION`) |

- **`parseSave`** (`packages/domain/src/save/save.ts`) parses v6 strictly (`parseSaveV6` in `parse-v4.ts`, with
  `parse-loop.ts`'s parts): unknown keys and bad ids are refused, each error with its path (`SaveParseError`). It
  refuses any other version: what an upload must be. **`parseStored`** reads what's stored, on the server or the
  device: v6 by `parseSave`, v5 by `parseSaveV5`, and v1–v4 as version and account only.
- **The new farm runs in the app, never on the server:** `freshV6` (`save/v4.ts`, the file keeping its name) makes day
  1 on v6 with `account` copied whole, committed unstamped, so it uploads with `updatedAt` unchanged and the next boot
  reads v6; a dirty device save it replaces is kept first as a `wiped` safety copy.
- **Why v5 and not a v4 change:** blocks became tiles and jobs became the day's actions, which a played v4 can't carry;
  a new version lets the start-over card, the safety copy, the server's backup and an older build's refusal do the work.
  v5 was the first preserved farm format. v6 expands 12-day seasons to 30. The calendar records the turn of
  the conversion and projects elapsed turns onto the original dates. Work, prices, loans, and countdowns keep
  turn order. Future dated wedding plans retain their visible date. The server keeps the chosen conversion clock
  when later uploads arrive.
- **Only a player's change moves `account.updatedAt`** (`touched`). The conflict rule (`resolveConflict`) compares it:
  the newer wins whole, a tie keeps the device's.
- **Graded production grows v5 in place.** The shared reader accepts legacy pending loads and livestock and
  validates the new stock IDs, row and station plans, collection caps, fish progress and surplus plan. The deploy
  verifies the API reader before it publishes the web app. An offline older client keeps its local copy if the
  new fields fail its sync parse. Any rollback build must retain the graded save reader and catalogue.
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

- **The source** is the ignored `content/story/` on the machine where the story is written.
- **`pnpm story:release`** (`scripts/story/release.mjs`; Node 22.18 or later, for type stripping) reads the pack with
  the game's own reader (`readStoryPack`, read in place). Any pack releases: an error (only what the game can't read)
  skips the one part it's in, notes block nothing, and both are printed; it refuses only a missing pack folder. The
  release holds the pack as the game reads it ([the menu](../story-pack.md)). It writes the ignored
  `content/story-release/`, laid out as the bucket is: the index `story.json` (each file's path, bytes and SHA-256) and
  each file minified as `story/<name>.<hash8>.json`. The same inputs give the same files, and only the pack's own files
  are read. `--stand-in` releases the invented stand-in in git, for the dev server; `--from <dir> --out <dir>` moves
  both ends; `--number <n> [--note "…"]` numbers the local index for the dev server. Tests:
  `scripts/story/release.test.mjs`.
- **`pnpm story:ship`** (`scripts/story/ship.mjs`, Node only, so it runs on macOS and Windows) is the routine, in
  order: check (the reader's errors and notes, printed; nothing blocks), release (as above), publish, back up
  (`pnpm story:push farm` in the sibling `../uma-platform` checkout, or `STORY_PLATFORM_DIR`; skipped with a note
  without one), then the number and the note.
  - **Numbering:** the publish reads the bucket's `story.json` (`gcloud storage cat`) and stamps the new index
    (`shippedIndex`) with `number` (one more, or 1; over an unnumbered index, one more than the highest of its kept
    versions), `shippedAt` and `note` (`--note`, else `ship.md`'s first line, else none; one line, at most
    `STORY_NOTE_MAX`, 160). The three are optional to `parseStoryIndex`.
  - **Order:** `gcloud storage rsync` of the hash-named files, then `gcloud storage cp` of `story.json`, with
    `story:publish`'s headers. An index whose release id the bucket already plays isn't published again, so a rerun is
    safe. `--dry-run` reads (`cat`, `ls`) and uploads nothing.
  - **Rollback:** `--release <n>` finds release *n* among `story.json`'s kept versions (`ls --all-versions`, then `cat`
    each), checks its files are all in the bucket, and uploads it alone, numbered anew, its note "Rolled back to *n*".
  - **gcloud** runs with the environment only: `CLOUDSDK_ACTIVE_CONFIG_NAME` from `STORY_GCLOUD_CONFIG` (default
    `default`), `CLOUDSDK_CORE_PROJECT` from `STORY_GCLOUD_PROJECT` (default `uma-rpg`), the bucket `STORY_BUCKET`
    (default `uma-farm-content`); on Windows `gcloud.cmd` and `pnpm.cmd` through the shell. It never runs
    `config set`. Tests: `scripts/story/ship.test.mjs`, on a fake bucket in memory and a stand-in `gcloud` on `PATH`.
- **`pnpm story:publish`** (`scripts/story/publish.sh`, the Mac's publish step alone, unnumbered) runs the release,
  then uploads the hash-named files first (`gcloud storage rsync`, `private, max-age=31536000, immutable`) and
  `story.json` last (`private, no-cache`), so a reader never sees an index pointing at missing files. Old files stay, so a phone holding an older index still reads
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
  - **a new release:** a fresh index with a `number` the last kept index doesn't have is told to `arrived` before it's
    kept (`isNewRelease`); `load.ts` keeps its number under `farm.story-news` (`story/news.ts`). The night
    (`endTheDay`) passes it as `NightContext.release`, the summary opens §5 with `{ kind: 'story', number }`, and the
    number is forgotten once committed. A new farm (`boot`'s fresh save, `startOver`) forgets it first. The morning card
    reads the note live from the pack's `release` (`StoryPack.release`, from the index) by its number; Account's Story
    row reads the same;
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
pnpm web    # :5194, /api proxied to :8101; the game on save v6
pnpm lint && pnpm test && pnpm build
```

- **[`.claude/launch.json`](../../.claude/launch.json)** starts `farm-api` (:8101), `farm-web` (:5194) and
  `farm-story-sandbox` (:4321) in the preview pane.
- **The dev server plays the game** as production does, on save v6. `VITE_FARM_STORY=stand-in pnpm web` plays the
  stand-in whatever farm-api holds. The dev server is open on the LAN (`host: true`), so a phone can load it directly.
- **The dev save** is `apps/api/.data/save.json`, its last refused upload beside it. A dev save from before v5 shows the
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

### Outfit-specific cast art

Dialogue portraits and illustrations resolve a sister’s `s<outfitId>` through the neutral outfits set. The release client requests her `outfit:<outfitId>` family entry and validates both IDs. Original numeric character entries remain separate. A missing sister entry uses the existing blank-bust fallback.
