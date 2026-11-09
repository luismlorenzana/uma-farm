# Architecture and technical setup

How uma-farm is built and run, as of F18: save v2 and the Wilds live, their rules in the domain and their screens on the phone ([wilds.md](wilds.md)), "work done" notifications, and save v3 for the farm's own loop with its calendar, End the day and the farm map ([days.md](days.md)), built and dark until F24 ([the dark launch](#the-dark-launch-f17)). Values come from the code and
[infrastructure.md](../technical/infrastructure.md), which holds every production value and is the place to change them.

## The pieces

```
 iPhone (Home Screen PWA)
   └─ apps/web  React 19 + Vite 7 + Tailwind 4 + Zustand + Dexie; uma-kit for the theme, shell, sign-in,
                content loading, the update prompt, the Hub map (Phaser, on demand), the album and the work
                screens (F5)
        │  /api/*  (Firebase Hosting rewrites to Cloud Run)
        ▼
   apps/api  NestJS 11 on Cloud Run `farm-api`, behind uma-server's owner guard
        ├─ saves ──────────► Firestore database `farm`: saves/{uid} (local: apps/api/.data/save.json)
        ├─ push ───────────► Firestore database `farm`: push/{uid} (local: in memory); Web Push with `farm-vapid` (F6)
        ├─ master data ────► gs://uma-platform-master-data (local: ../uma-platform/content/release)
        └─ the parcel ping ► /api/post/ping, checked by its own Google ID token (IN18)
        ▲
        │  POST /api/push/tick every five minutes, with an OIDC token for `farm-push-scheduler`
   Cloud Scheduler `farm-push-tick`

   packages/domain  @farm/domain: the save (v1–v3) and its migrations, the Wilds' rules (copied from uma-rpg, F4) and the
                    loop's units and goods (F17); pure TypeScript, shared by web and API
```

**The rules of the codebase:**
- **The domain decides.** The web app runs the rules locally for instant play; the API parses every upload with the same
  code and refuses one it can't read.
- **The server never writes into a save** (FM10). It stores what the app sent, or refuses it and keeps it aside.
- **Nothing is imported from uma-rpg.** Its code is copied at a recorded commit (`30a322a`) and the farm owns it from
  then on (FM2).

## Web app

| Piece | Where | What |
|---|---|---|
| Entry | `src/main.tsx` | The kit's keys (`farm.`), appearance, uma-art's bar and map art, sign-in, content client, the album's outfit art and the work screens' item icons, and the router |
| Gates | `src/app/Root.tsx` | The kit's `BootGates`: splash → Google sign-in → boot → the app; the kit's **Update ready · Restart** |
| Pages | `src/app/router.tsx` | `/` the Wilds (`?peek=<place>` a quick look), `/wilds/<place>` a place's page, `/warehouse` and `/account`, inside the shell; `/wilds` and anything else go to `/`. The Wilds, the place pages and the Warehouse load on demand ([wilds.md](wilds.md)). The loop's build (F18): `/` the farm map (`?peek=<place>`), `/roster`, `/diary` and `/account`, the first three on demand ([days.md](days.md)) |
| The loop's switch | `src/app/loop.ts` | `loopOn()`: `VITE_FARM_LOOP` is `'1'` (F17). On in the dev server (`.env.development`), Vitest and the `loop` build (`.env.loop`); unset in production. F24 deletes it |
| The loop | `src/loop/` | Loaded on demand, in the loop's build only: its boot (`toLoopSave`: the migration once master data has loaded, and the temporary picks), the farm map with its quick looks and the morning summary (`FarmMap.tsx`), the roster and the Diary, End the day and the calendar (`LoopSheets.tsx`) and the day's actions (`actions.ts`: End the day, put the morning away, Collect all). Its words (`words.ts`) and the Menu's switch (`ask.ts`) are small and load with the shell (F18, [days.md](days.md)) |
| Shell | `src/shell/` | The kit's `AppFrame` unchanged (FM18): the account bar with the sync chip, the bottom bar (Wilds with its Ready count, Warehouse, Menu), the menu sheet (`?sheet=menu`: every place with its Ready count, the Warehouse, Account and the build id), and the sync warning. The loop's build (F18): the date chip, Farm · Roster · End the day (raised) · Diary · Menu, the menu by the farm's rows with "Ask before ending the day", and `?sheet=end` and `?sheet=calendar` |
| The Wilds | `src/wilds/` | The Hub map on uma-kit (`HubMap`), the quick looks, Collect all, the help, the Forge and the Post as placeholders, the Ready counts |
| Places | `src/places/` | A place's page on uma-kit/work (`work/`: the farm's provider, the slot rows, the job sheet, the What step) and the Warehouse (`warehouse/`) |
| Picker | `src/album/rows.ts` | Every outfit as a row of uma-kit's album: Craft Level, free or busy, and the Trade, rarity and aptitude facets |
| Items | `src/items/` | uma-art's item icons placed from the ids (`frames.ts`), and the items' words |
| Account | `src/home/AccountView.tsx` | The kit's Account page: appearance, the Notifications switch (F6; in the loop's build "Off: days are turns"), sign-in, save state, last sync, build, master data's release, safety copies, sign out |
| Push | `src/push/`, `public/push-sw.js` | The Notifications switch and its "Send a test", the subscription, the schedule sent on every sync, the badge cleared on open; the service worker's push and tap handlers (below) |
| Save | `src/save/` | The device save in Dexie, the store and its sync engine (below), the work actions (`edit`) and the trade words; every sync sends the push schedule. The store holds the save as stored (`StoredSave`): the Wilds read it through `useWildsSave`, the loop through `useLoopSave` |
| Master data | `src/master/` | The release's manifest, characters, outfits and art through `/api/master`, cached by hash on the device; the roster (`farmRoster`) and the album's rows; the album art adapter; `masterReady()`, which the loop's boot waits on |
| PWA | `vite.config.ts` | Portrait, standalone, the icons from `scripts/draw-icons.mjs`; Workbox precaches the app, keeps master data's files for good, and imports `push-sw.js` into the service worker |

Main JS is 163.8 KB gzip against the 180 KB budget (FM20), and 166.2 KB in the loop's build, which `pnpm build` checks
too (F18). Firebase, the Wilds' screens, the loop's pages, sheets, actions, boot and night, and the Hub map's Phaser scene
(`createHubGame`, 377 KB gzip) load on demand; `scripts/check-size.mjs`'s `LAZY_MODULES` refuses them in the initial JS.

## API

| Route | Guard | What |
|---|---|---|
| `GET /api/health` | Public | `{ ok, build }`: the deploy's commit |
| `GET /api/save` | Owner | The stored envelope `{ revision, save }`, or `{ revision: 0, save: null }`; the save at the version stored, v2 or v3 (a v1 reads as v2) |
| `PUT /api/save` | Owner | `{ baseRevision, save }`, v2 or v3: stored as `baseRevision + 1`, or 409 with what's stored. A save older than the stored one is a 409 too, and kept in `saveRescues` |
| `GET /api/master/*` | Owner | uma-platform's release: channels, manifests and hash-named files (uma-server's proxy) |
| `POST /api/post/ping` | Its own token | `{ ok: true }` for a Google ID token on `POST_CALLERS` with the farm's audience |
| `GET /api/push/key` | Owner | `{ publicKey }`: the VAPID key the app subscribes with; 404 while push is off (no `VAPID_KEYS`, as locally) |
| `POST /api/push/subscription` | Owner | A browser's `PushSubscription` (https endpoint, `p256dh`, `auth`): kept in `push/{uid}`, the newest five; 204 |
| `PUT /api/push/schedule` | Owner | `{ entries: [{ at, place, badge }] }`, at most 60, each a Wilds place: replaces the stored schedule; 204 |
| `POST /api/push/test` | Owner | "Notifications are on" to every device; `{ devices }` still subscribed |
| `POST /api/push/tick` | Its own token | Cloud Scheduler's tick: an OIDC token for `PUSH_AUDIENCE` from `farm-push-scheduler` (`PUSH_SCHEDULER_EMAIL` overrides it). No token or a bad one 401, another account 403; then `{ accounts, sent }` |

## The save

### Save history

| Version | Packet | What changed |
|---|---|---|
| 1 | F3 | The account: `{ version: 1, account: { uid, createdAt, updatedAt } }` |
| 2 | F4 | The Wilds' world beside it: `umas` (each Uma's Craft Level, from her first job), `items` (the Warehouse), `work` (uma-work's rows) and `buildings` (always `{}`). v1 migrates with all four empty, `updatedAt` unchanged |
| 3 | F17 | **Built in F17; live from F24.** The farm's own loop (core spec CS53): the calendar, gold, the roster and its ranks, the Dorm, the Warehouse by stars, the fields and the rest of the loop. v2 migrates in the loop's app with master data ([below](#v2--v3-f17-cs54)), `updatedAt` unchanged |

### The shape: v2, the Wilds' (live)

```ts
interface SaveV2 {
  version: 2
  account: { uid: string; createdAt: string; updatedAt: string }
  umas: Record<string, { craft: { level: number; exp: number } }>  // by outfit id
  items: Record<string, number>                                     // the Warehouse: line and made items
  buildings: {}                                                     // places have no levels
  work: Record<string, WorkRow<FarmWorkRequest>>                    // uma-work's rows, by outfit id
}
```

The rules that change it, and every number they use, are in [loops.md](loops.md) and [materials.md](materials.md); the copy
from uma-rpg is listed file by file in [wilds-copy.md](../technical/wilds-copy.md).

`parseSave` reads every version the farm has written: v1 becomes v2, and v2 and v3 come back at the version stored (the
dark launch, below). A newer version than the app knows is refused, and unknown keys are refused, so an old client can
never half-write a newer save.

### The dark launch (F17)

M4 builds the loop without anyone meeting it half-built (D29):
- **Production plays the Wilds on v2** until F24 turns the loop on. Every push to `main` still deploys, and nothing in
  M4 changes what production players see.
- **The loop plays where `VITE_FARM_LOOP` is `'1'`:** the dev server, Vitest, and `vite build --mode loop`, which
  `pnpm build` size-checks into `dist-loop/` (never deployed). `VITE_FARM_LOOP=0 pnpm web` plays the Wilds locally.
- **The API stores what it's sent,** v2 or v3, so production's v2 app is unaffected and a v3 upload is accepted once the
  loop is on. The first v3 write over a stored v2 copies it to `saveBackups/{uid}-v2`. A v2 upload over a stored v3 (a
  Wilds client after the loop) is a 409 and is kept in `saveRescues/{uid}`; the phone keeps it too.
- **The Wilds' build stops at a v3** (boot fails with Try again) rather than play or overwrite it.
- **v3 grows in place until F24:** an M4 packet may extend it, with parse tests. From F24 on, a change is v4.

### The shape: v3, the loop's (built in F17)

`packages/domain/src/save/v3.ts`, CS53 with F17's additions (`start`, `today`, `dorm.swaps`, `farm.counts`):

```ts
interface SaveV3 {
  version: 3
  account: Account                                   // unchanged; only a player's change moves updatedAt
  calendar: { day: number }                          // 1 = Spring 1, year 1
  gold: number                                       // whole
  start: { redraws: number }                         // the start's one free redraw (F23)
  today: { chats: OutfitId[]; gifts: OutfitId[] }    // once a day each, cleared each night (F23)
  roster: Record<OutfitId, RosterUma>                // every recruited Uma
  dorm: { level: number; home: OutfitId[]; swaps: { out: OutfitId; in: OutfitId }[] }
  visitors: { outfitId; from: 'gate' | 'festival' | 'expedition'; leaves: number; affinity: number }[]
  items: Record<ItemId, [n, n, n, n, n]>             // the Warehouse: counts by ★1 … ★5
  bin: Record<ItemId, [n, n, n, n, n]>               // shipped today, paid tonight
  work: Record<OutfitId, WorkRow<LoopWorkRequest>>   // uma-work's rows; the clock is (day − 1) × 86,400,000 ms
  fields: { blocks: { id: 'A' | 'B' | 'C' | 'D'; tender: OutfitId | null; plots: Plot[] }[] }
  crops: Record<CropId, number>                      // crop points
  ranch: { animals: Animal[] }
  places: { mine: { deepest; stairs }; quarry: { deepest; stairs } }
  buildings: Record<BuildingId, number>              // absent locked, 0 plans held, 1+ built; dorm = level bought
  tools: Record<ToolId, 1 | 2 | 3 | 4 | 5>           // all seven, Basic on day 1
  workshops: { played: Record<'kitchen' | 'restaurant' | 'forge', number>; current: PlayInProgress | null; recipes: DishId[]; best: Record<string, number> }
  expeditions: { region; party; supplies; left; back }[]
  bonds: Record<'idA:idB', number>                   // ids in numeric order (pairKey)
  board: { id; from; item; count; stars; due; reward; extra }[]
  diary: { shipped; milestones; records; read }
  farm: { points; chapter; goals; festivals; counts } // counts: lifetime counters each packet names
  summary: MorningSummary | null                     // the last night's, until put away (F18, days.md)
}
interface RosterUma { joined: number; ranks: Record<Activity, { points; rank: 0–5; challenge }>; affinity: number; wellFed: number }
interface Plot { crop: CropId | null; growth: number; ready: boolean; regrowing: boolean; own: boolean }
```

- **Talents aren't saved:** they're read from master data each boot (F21).
- **The nine activities:** farming, the ranch, mining, fishing, foraging, cooking, serving, forging, expeditions; six
  ranks each (Novice, Hand, Skilled, Expert, Master, Legend). `challenge` counts toward her next rank's challenge.
- **The Dorm:** `buildings.dorm` is the level bought, `dorm.level` the level in effect, which catches up overnight.
  `dorm.home` is who's on the farm, within the roster and the beds; the rest of the roster is away.
- **The Warehouse's ids** are the 260 goods in `goods/ids.ts` (27 crops and 10 flours, the forest's 113, mining's 60,
  fishing's 20, expeditions' 30), every one uma-art's own item, plus seeds: `seed-<crop>` from the shop and
  `seed-<crop>-own` from harvests, ★1 only. The bin takes goods, never seeds.
- **uma-work's flat stock:** the engine sees the Warehouse as `<id>@<stars>` keys (`carp@2`), through `workStock` and
  `fromWorkStock`; v3 work rows hold those keys. Rows sit at the v3 work places (the forest, the Fishery, the Mill, the
  Sawmill, the Smokehouse; the Mine, the Quarry, the Smelter and the Cutter from M5), four slots each, and each kind
  checks its own requests through `LOOP_KINDS`, empty until F22. F18 runs them on the day clock ([days.md](days.md#work-in-days-fc6-decisions-1-and-4)).
- **The parse** is strict: unknown keys, bad ids (outfits, goods, seeds, crops, buildings, tools, activities, blocks,
  regions, dishes), a block of other than 9 plots, an unsorted bond key, an Uma home off the roster or past the beds are
  each refused with their path.
- **Size:** the largest save (60 Umas × 9 ranks, 1,770 bonds, every good at every star, 48 work rows) is about 210 KB,
  well under Firestore's 1 MiB.

Day 1 (`newSave`, CS3): day 1, 500g, 9 Carrot seeds, Block A of 9 tilled plots, the Dorm at level 1, chapter 1, the
seven tools at Basic, everything else empty. Until F23's start sheet, the loop's build fills a roster under three from a
seeded shuffle of the release (`draw(uid, 0, 'start', n)`); a migrated save keeps its Umas and is filled only to three.

The Dorm's beds (CS34):

<!-- live:beds -->
| Dorm level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Beds | 3 | 5 | 8 | 12 | 16 | 22 | 30 | 40 | 50 | 60 |
<!-- /live -->

The Farm Rank's thresholds (CS39; read-only until F24):

<!-- live:farm-ranks -->
| Farm Rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 150 | 500 | 1,200 | 2,400 | 4,000 | 6,500 | 10,000 | 15,000 | 22,000 |
<!-- /live -->

### v2 → v3 (F17, CS54)

It runs once, in the loop's app, on the first boot after master data's roster has loaded (her calling's line comes from
it, and the API has no master data). It's pure and deterministic, so two devices carry a save over alike, and it never
moves `account.updatedAt`, `createdAt` or `uid`. Every v2 the loop meets goes through it: the device's save, the
server's, a 409's stored save, a safety copy restored. The result is committed without stamping, so it uploads and the
next boot reads v3.

| Step | What |
|---|---|
| 1 | **Running jobs finish:** every started entry completes into the Warehouse as if its last night had come, paying its Craft EXP first, so a level it earns counts in step 3. Queues and stopped queues drop; uma-work reserves nothing for a queued job, so nothing comes back |
| 2 | **Materials:** what is still a good carries over at ★1; what leaves the game is refunded per grade (below) |
| 3 | **Craft Level becomes her rank** in her calling's activity (below). An outfit the release no longer has joins at Novice everywhere |
| 4 | **The roster:** every Uma in `umas` joins on day 1; the Dorm's level is the lowest with a bed for each, bought and in effect, free. Past 60, the 60 with the most mapped points live home (ties by outfit id) and the rest are away |
| 5 | **The calendar starts:** day 1, 500g plus the refunds, Block A, 9 Carrot seeds, chapter 1 |
| 6 | Everything else starts empty: Farm Rank 1, the Diary, bonds, the board |

<!-- live:craft-ranks -->
| Craft Level | Rank | Points set to |
|---|---|---|
| 1–5 | Novice | 8 a level above 1 (Lv 5: 32) |
| 6–15 | Hand | 40 + 12 a level above 6 (Lv 15: 148) |
| 16–25 | Skilled | 160 + 24 a level above 16 (Lv 25: 376) |
| 26–35 | Expert | 400 + 50 a level above 26 (Lv 35: 850) |
| 36–45 | Master | 900 + 110 a level above 36 (Lv 45: 1,890) |
| 46–50 | Legend | 2,000 |

Her calling's line names the activity: Metal → mining, Wood → foraging, Vegetables → farming, Fish → fishing, Stone → mining. Every challenge up to the rank counts as done; her other eight activities start at Novice, 0 points.
<!-- /live -->

<!-- live:refunds -->
| Leaves the game | Refund each, by grade | Rule |
|---|---|---|
| Vegetables, refined | 15g · 30g · 45g · 60g · 75g · 90g · 105g · 120g · 135g · 150g | 15g × grade |
| Arms Gems | 150g · 300g · 450g · 600g · 750g · 900g · 1,050g · 1,200g · 1,350g · 1,500g | 15g × grade × 10 refined |
| Armor Fittings | 45g · 90g · 135g · 180g · 225g · 270g · 315g · 360g · 405g · 450g | 15g × grade × 3 refined |
| Accessory Settings | 75g · 150g · 225g · 300g · 375g · 450g · 525g · 600g · 675g · 750g | 15g × grade × 5 refined |
| Planet Jewels | 75g · 225g · 375g · 525g · 675g | 15g × grade × 5 refined |
| Moon Jewels | 150g · 300g · 450g · 600g · 750g | 15g × grade × 5 refined |
| Tome Ink | 150g · 300g · 450g · 600g · 750g · 900g · 1,050g · 1,200g · 1,350g · 1,500g | 15g × grade × 10 refined |

Everything else in a v2 Warehouse (ores and ingots, logs and planks, fish and fillets, crystals and cut crystals, raw vegetables) is still a good, and carries over at ★1.
<!-- /live -->

### Sync

Copied from uma-rpg (its D32, D45, D260):
- **Local first.** Every change writes the store and the device (Dexie `uma-farm`) at once, then syncs in the background
  1.5 s later, when the app comes back to the foreground, and when the network returns.
- **Revisions.** The server stores `{ revision, save }` in `saves/{uid}` and refuses a write whose base revision is stale,
  or whose version is older than what's stored (409 with what's stored).
- **The conflict rule.** When both sides changed, the save whose `account.updatedAt` is newer wins whole, and this
  device's on a tie. Only a player's change moves `updatedAt`.
- **Nothing is lost.** Before a newer save replaces unsynced changes, the device keeps a safety copy (the newest five,
  in Account, each with Restore). An upload the server refuses is kept in `saveRescues/{uid}`. When a newer save version
  first replaces a stored one, the stored document is copied to `saveBackups/{uid}-v{n}`.
- **A fresh device needs the server once.** With no device save, boot reads the server's; if it has none, a new account
  starts. Offline, boot stops and offers Retry, since a new save made offline could later outrank the real one.
- **The warning.** Ten minutes after a failed sync with changes waiting, every page says "Not backed up since …".

### The production-save rules

From uma-rpg's 2026-10-30 incident: never move `save.account.updatedAt` by hand; no server ever writes into a save; a stale
server date means stop and ask the owner.

## Notifications (F6)

Copied from uma-rpg's push at `30a322a` (its D63) and cut: uma-rpg's tick reads each save; the farm's server never reads
or writes one (FM10). The app does the rules and sends only times.

```
 The phone                                   farm-api                                 Cloud Scheduler
 ─────────                                   ────────                                 ───────────────
 Account → Notifications on
   allow → subscribe ── POST /subscription ──► push/{uid}.subscriptions
 every sync, and going to the background
   pushSchedule(save, now) ─ PUT /schedule ──► push/{uid}.schedule  (replaced whole)
                                             ◄── POST /tick (OIDC) ───────────────── farm-push-tick, every 5 min
                                             due = schedule in (checkedAt, now], 6 h back at most
                                             one notice: scheduleNotice(due) → each device
 service worker: show it, set the badge ◄─── Web Push (VAPID `farm-vapid`); 404/410 forgets the device
 tap → the place's page; opening clears the badge
```

- **The schedule** is `pushSchedule` in `@farm/domain` (`save/notify.ts`): every slot that goes idle after now, past its
  queue, as `{ at, place, badge }`, the badge being the slots ready to collect then. A queue moving on to its next job
  isn't news (uma-rpg's D65). The app sends it after every sync and as it goes to the background (`keepalive`), once per
  save. Every device sends it, subscribed or not, since the newest save knows what's running.
- **The tick** takes everything that came due since its last send and makes one notification of it
  (`scheduleNotice`): "Work done", a line per place in the order they finished ("Mine: 2 jobs done", four lines at most,
  then "and N more places"), never an Uma's name. One place links its page (`/wilds/mine`) and is tagged `work-mine`;
  several link the Wilds and are tagged `work`. The badge is the latest entry's. It writes only when it sent:
  `checkedAt`, and the devices still there.
- **A first subscription starts the clock** (`checkedAt`), so nothing that finished before is announced, and a tick
  looks back six hours at most.
- **Off** unsubscribes this phone; the server forgets the device the next time a push finds it gone (404 or 410).
  Opening the app clears the badge.
- **Locally** there are no VAPID keys and no service worker: the key answers 404, the switch says "Notifications work in
  the installed app", the subscription and schedule are kept in memory, and an unsigned tick is refused 401. A real
  notification needs the production build on the phone.

### push/{uid}

| Field | What |
|---|---|
| `subscriptions` | The devices' `PushSubscription`s, the newest five |
| `active` | `subscriptions` isn't empty: the tick reads only these |
| `schedule` | The app's last `[{ at, place, badge }]`, `at` in ms |
| `checkedAt` | Up to when the tick has announced (ms) |
| `updatedAt` | The server's time of the last write |

## Build and deploy

Every push to `main` that touches code runs [deploy.yml](../../.github/workflows/deploy.yml): lint, tests (one package at
a time), build with both size checks (the deployed build, then the loop's into `dist-loop/`); then the API image to Cloud Run `farm-api`, the web to Hosting site `uma-farm`, and
the checks: health with the commit, `/api/save` 401 without a token, the ping 401, the shell `no-cache`, and uma-rpg's own
health. Docs-only pushes skip it. `VAPID_KEYS` comes from Secret Manager's `farm-vapid`.

## Local development

```bash
NODE_AUTH_TOKEN=$(gh auth token) pnpm install
pnpm api   # :8101, auth off (the local user), saves in apps/api/.data/save.json, push in memory and off
pnpm web   # :5194, /api proxied to :8101; plays the loop (VITE_FARM_LOOP=1 in .env.development)
VITE_FARM_LOOP=0 pnpm web   # the Wilds on v2, as production plays them
```

Master data comes from `../uma-platform/content/release` (set `MASTER_DIR` to point elsewhere). The preview pane starts both
from `.claude/launch.json`. To try the owner guard, run the built API with `ALLOWED_EMAIL` set and no `AUTH_MODE`.
