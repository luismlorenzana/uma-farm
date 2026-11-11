# Architecture and technical setup

How uma-farm is built and run, as of F24: the farm's own loop is the app, on save v3 ([days.md](days.md) and the pages
after it), and a v2 from the Wilds (F4–F6, retired in F24) migrates on its first open ([the go-live](#the-go-live-f24)). Values come from the code and
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
        ├─ push ───────────► Firestore database `farm`: push/{uid} (local: in memory); Web Push with `farm-vapid` (F6;
        │                    the app sends nothing since F24)
        ├─ master data ────► gs://uma-platform-master-data (local: ../uma-platform/content/release)
        └─ the parcel ping ► /api/post/ping, checked by its own Google ID token (IN18)
        ▲
        │  POST /api/push/tick every five minutes, with an OIDC token for `farm-push-scheduler`
   Cloud Scheduler `farm-push-tick`

   packages/domain  @farm/domain: the save (v1–v3) and its migrations, the farm's rules (F17–F24), and the Wilds' rules
                    copied from uma-rpg (F4), kept for the v2 → v3 migration; pure TypeScript, shared by web and API
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
| Pages | `src/app/router.tsx` | Inside the shell: `/` the farm map (`?peek=<place>` a quick look), `/roster`, `/diary`, `/warehouse` (`?pick=bin`), `/fields`, `/forest`, `/fishery`, `/mill`, `/sawmill`, `/smokehouse`, `/dorm` and `/account`; anything else (the Wilds' old `/wilds/<place>` among them) goes to `/`. Every page but Account loads on demand |
| The farm | `src/loop/` | Loaded on demand: the boot (`toLoopSave`: the migration once master data has loaded), the farm map with its quick looks and the morning summary (`FarmMap.tsx`), the pages above, the global sheets (`LoopSheets.tsx`: End the day, the calendar, the bin, the shop, the Farm Rank), the start's sheet, the scene player (`ScenePlayer.tsx`), and the actions (`actions.ts`). Its words for the bars (`words.ts`) and the Menu's switch (`ask.ts`) are small and load with the shell ([days.md](days.md) and the pages after it) |
| Shell | `src/shell/` | The kit's `AppFrame` unchanged (FM18): the account bar (the date, gold and Farm Rank chips, the sync chip), Farm · Roster · End the day (raised) · Diary · Menu, the menu sheet (`?sheet=menu`: the farm's places by its rows, Account, "Ask before ending the day", the build id), the sync warning; over everything, the start's sheet while picks are pending, then a scene due (F24) |
| Items | `src/items/` | uma-art's item icons placed from the ids (`frames.ts`) |
| Account | `src/home/AccountView.tsx` | The kit's Account page: appearance, Notifications "Off: days are turns", sign-in, save state, last sync, build, master data's release, safety copies, sign out |
| Push | `public/push-sw.js` | The service worker's push and tap handlers, kept so the server's push stays deliverable; F6's switch, subscription and schedule left the app with the Wilds (F24) |
| Save | `src/save/` | The device save in Dexie, the store and its sync engine (below). The store holds save v3 (`useLoopSave`): every v2 it meets migrates first |
| Master data | `src/master/` | The release's manifest, characters, outfits and art through `/api/master`, cached by hash on the device; the roster (`farmRoster`) and the album's rows; the album art adapter; `masterReady()`, which the loop's boot waits on |
| PWA | `vite.config.ts` | Portrait, standalone, the icons from `scripts/draw-icons.mjs`; Workbox precaches the app, keeps master data's files for good, and imports `push-sw.js` into the service worker. A new build waits for the kit's **Update ready · Restart** |

Main JS is 164.0 KB gzip against the 180 KB budget (FM20) as CI measured F24: one build, size-checked by `pnpm build`.
Firebase, the farm's pages, sheets, actions, boot and night, the scene player and the goals' rules, and the Hub map's
Phaser scene (`createHubGame`, 377 KB gzip) load on demand; `scripts/check-size.mjs`'s `LAZY_MODULES` refuses them in
the initial JS.

## API

| Route | Guard | What |
|---|---|---|
| `GET /api/health` | Public | `{ ok, build }`: the deploy's commit |
| `GET /api/save` | Owner | The stored envelope `{ revision, save }`, or `{ revision: 0, save: null }`; the save at the version stored, v2 or v3 (a v1 reads as v2) |
| `PUT /api/save` | Owner | `{ baseRevision, save }`, v2 or v3 as sent (the app writes v3 from F24): stored as `baseRevision + 1`, or 409 with what's stored. A save older than the stored one is a 409 too, and kept in `saveRescues`. The first v3 over a stored v2 copies the v2 document to `saveBackups/{uid}-v2` |
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
| 3 | F17 | **Built in F17, grown in place by M4, live from F24.** The farm's own loop (core spec CS53): the calendar, gold, the roster and its ranks, the Dorm, the Warehouse by stars, the fields and the rest of the loop. v2 migrates in the app with master data ([below](#v2--v3-f17-cs54)), `updatedAt` unchanged |
| 4 | F46 | **Built dark from F46, grown in place by F47–F55, live from F56.** The romance core (RM10): the farmer's name, `love`, `homestead`, `memories`, `arrivals` and v4's `today`; the roster, the Dorm, work and bonds keyed by character id; no `start`, `visitors` or affinity. **A wipe:** the romance build turns any v1–v3 into a fresh v4 in the app ([below](#save-v4-and-the-wipe-f46)), `account` copied whole. Any change after F56 is v5 |

### The shape: v2, the Wilds' (read once, to migrate)

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

The Wilds' rules that changed it are copied from uma-rpg, listed file by file in
[wilds-copy.md](../technical/wilds-copy.md); the migration still runs them to finish a v2's jobs. Their manual pages
(their loop, materials and screens) were retired with the screens in F24 and are in git's history.

`parseSave` reads every version the farm has written: v1 becomes v2, and v2 and v3 come back at the version stored, for
the app to migrate a v2 (below). A newer version than the app knows is refused, and unknown keys are refused, so an old
client can never half-write a newer save.

### The go-live (F24)

M4 was built behind a switch (F17–F23, D29): production kept the Wilds on v2 while the loop played only in a switched
build. F24 deleted the switch and the Wilds' screens, so the loop is the app.
- **The owner's save migrates on its first open.** It's a v2 made with F4 (D17), with no Umas, no items and no jobs.
  The new build reads it from the phone (or the server), migrates it once master data has loaded (CS54, below), commits
  it unstamped, and uploads it: the first upload is v3 with `account.updatedAt` where the v2 had it. Then the start's
  sheet offers three picks, and the opening scene plays.
- **The server backs the v2 up:** the first v3 write over the stored v2 copies the v2 document to
  `saveBackups/{uid}-v2` (F3's mechanism, D9/D11), and later writes leave it.
- **An old cached Wilds build stops at a v3** (D30 e): its boot fails with Try again rather than play it, its sync reads
  the v3 and stops before any upload, and a v2 it sends anyway is a 409, kept in `saveRescues/{uid}`.
- **The update prompt** (the kit's **Update ready · Restart**) sits beside the boot gates, not inside them, so an old
  build that stopped still offers the new one, and Restart takes it.
- **v3 is live:** any change to its shape (a summary line, a counter the parse checks) is v4, with its migration.

### Save v4 and the wipe (F46)

**Romance build; live from F56.** `packages/domain/src/save/v4.ts`, RM10 written whole now with the later packets'
slots, so each fills its own while v4 grows in place (F46 decision 1, as v3 did in M4):

```ts
type CharacterId = string                             // master data's character id (P8)
interface SaveV4 {
  version: 4
  account: Account                                    // as stored: the wipe never changes it
  farmer: { name: string }                            // '' until the name sheet (RM8)
  calendar, gold, items, bin, work, fields, crops, ranch, places, buildings, tools, workshops, expeditions,
  board, diary, farm                                  // as v3 (`work` keyed by character id)
  today: { chats, gifts, praise, praised, events: CharacterId[]; evenings: { with, kind }[]; invites: { id, kind, answer }[] }
  roster: Record<CharacterId, { joined: number; ranks: Record<Activity, RankState>; wellFed: number }>
  love: Record<CharacterId, Love>                     // one per roster Uma, from the day she joins
  dorm: { level: number; home: CharacterId[]; swaps: DormSwap[] }   // levels 1–8 (RM5)
  homestead: { houses: { name: string; extended: boolean }[]; tonight: number | null; slept: number[] }  // house 0 the Farmhouse
  memories: Record<CharacterId, string[]>             // her route's event ids played, in order
  arrivals: CharacterId[]                             // arrival scenes played or skipped
  bonds: Record<string, number>                       // pairKey of character ids
  summary: MorningSummaryV4 | null                    // v3's, with §4 `bonds: []` replaced by `hearts`
}
interface Love { stage, level, points, last, friend?, ring?, wed?, house?, known: string[], flags: string[], evening }
```

- **The parse** (`parse-v4.ts`, sharing v3's parts in `parse-loop.ts`) is as strict as v3's: unknown keys and v3-only
  keys (`start`, `visitors`, a roster Uma's `affinity`) refused; roster keys by form; `love` exactly the roster's keys,
  each in range (a level 0–10, spouse 0–5; points finite and ≥ 0; `last` and `evening` no later than today; `friend` only
  while the confession waits; `ring` from the proposal on; `wed` and `house` a spouse's); `memories` and `arrivals` on
  the roster; the farmer's name empty or within RM8's rule; the Dorm on 1–8 with home within its beds; the morning's
  Hearts lines on the roster, once each, ids only. `parseSave` returns v2, v3 and v4 as stored; `NEWEST_SAVE_VERSION` is
  4 and `SAVE_VERSION` (what production writes) stays 3 until F56.
- **The wipe runs in the app, never in the parse** (F46 decision 2): the API, shared with production and deployed on
  every push, reads what's stored and never makes a save (FM10). The romance build's boot turns any v1–v3 it meets (on
  the device, from the server, in a 409) into `freshV4(stored)`: day 1, 500g, Block A, 9 Carrot seeds, Dorm level 1, the
  Farmhouse, the name empty, and `account` copied whole. It's committed **without stamping**, so it uploads with
  `updatedAt` where the old save had it; **the farmer's name is the first stamp**.
- **Nothing disappears silently:** a dirty v3 on the device is kept first as a safety copy (reason `wiped`, "Before the
  new farm" in Account, which offers no Restore for a pre-v4 copy, since that would wipe again). The server's
  version-bump backup copies the stored v3 document to `saveBackups/{uid}-v3` on the first v4 write; a v3 upload over a
  stored v4 is a 409, kept in `saveRescues/{uid}`.
- **The live M4 build stops at a v4** ("This save is from a newer version of the farm."): its boot fails with Try again,
  its sync stops before any upload, and the kit's update prompt brings the build that can play it.

### The romance core's dark switch and two builds (F46)

As F17 did for M4 (D29): `romanceOn()` (`apps/web/src/app/romance.ts`) reads `VITE_FARM_ROMANCE` at call time. It's `1`
in `apps/web/.env.development` (the dev server) and `apps/web/.env.romance`; production leaves it unset. **`pnpm build`
size-checks both:** the deployed build in `dist/`, then `vite build --mode romance --outDir dist-romance` (never
deployed). Vitest leaves it off, so M4's web tests run unchanged; a romance test turns it on with `vi.stubEnv`.
`VITE_FARM_ROMANCE=0 pnpm web` plays M4 on the dev server. The switch only picks the web's build: **inside
`@farm/domain` the romance's rules key off `save.version`**, and the shared rules (the Fields, gathering, stations, ranks,
the bin, the night) take `FarmSave = SaveV3 | SaveV4`.

**The story pack at runtime** (`story/pack.ts`, `StoryPack`): the cast, the ties, the bibles by character id and which
events each route scripts, validated by F40's validator as it loads (routes partial); scripts load on demand. The web
loads it once through one seam (`apps/web/src/story/load.ts`: the stand-in until F56) and sees master data through the
cast (`outfitOf`): each cast Uma's character id reads her outfit's album row, stats and art. See
[hearts.md](hearts.md#the-cast-and-the-pack-rm1rm3-rm58-rm59).

### The shape: v3, the farm's (built in F17, live from F24)

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

- **Talents aren't saved:** the app computes them from master data once a release (F21, [ranks.md](ranks.md)).
- **The nine activities:** farming, the ranch, mining, fishing, foraging, cooking, serving, forging, expeditions; six
  ranks each (Novice, Hand, Skilled, Expert, Master, Legend). `points` go on past a threshold; `challenge` counts toward
  her next rank's challenge only, stops at its target and resets at the rank-up (F21, [ranks.md](ranks.md)).
- **The Dorm:** `buildings.dorm` is the level bought, `dorm.level` the level in effect, which catches up overnight.
  `dorm.home` is who's on the farm, within the roster and the beds; the rest of the roster is away.
- **The Warehouse's ids** are the 260 goods in `goods/ids.ts` (27 crops and 10 flours, the forest's 113, mining's 60,
  fishing's 20, expeditions' 30), every one uma-art's own item, plus seeds: `seed-<crop>` from the shop and
  `seed-<crop>-own` from harvests, ★1 only. The bin takes goods, never seeds. Each good carries its price ★1 and, refined,
  its input (F19, [goods.md](goods.md)); the night pays the bin into `gold`, `farm.counts['gold-shipped']` and
  `diary.shipped`, and lists it in `summary.bin`.
- **uma-work's flat stock:** the engine sees the Warehouse as `<id>@<stars>` keys (`carp@2`), through `workStock` and
  `fromWorkStock`; v3 work rows hold those keys. Rows sit at the v3 work places (the forest, the Fishery, the Mill, the
  Sawmill, the Smokehouse; the Mine, the Quarry, the Smelter and the Cutter from M5), four slots each, and each kind
  checks its own requests through `LOOP_REQUESTS` (F22: foraging, fishing and the stations' six jobs,
  [gathering.md](gathering.md#the-save-decisions-1-and-2-f17-decision-11)), which stays in the initial JS while the
  kinds' rules load with the screens. F18 runs them on the day clock ([days.md](days.md#work-in-days-fc6-decisions-1-and-4)).
- **The parse** is strict: unknown keys, bad ids (outfits, goods, seeds, crops, buildings, tools, activities, blocks,
  regions, dishes), a block of other than 9 plots, an unsorted bond key, an Uma home off the roster or past the beds are
  each refused with their path.
- **Size:** the largest save (60 Umas × 9 ranks, 1,770 bonds, every good at every star, 48 work rows) is about 210 KB,
  well under Firestore's 1 MiB.

Day 1 (`newSave`, CS3): day 1, 500g, 9 Carrot seeds, Block A of 9 tilled plots, the Dorm at level 1, chapter 1, the
seven tools at Basic, everything else empty, nobody on the roster. While the roster holds fewer than three, the start's
sheet asks for the picks (F23, [roster.md](roster.md#the-start-cs2)); a migrated save keeps its Umas and picks the rest.
F17's temporary picks (a seeded fill to three) are gone.

The Dorm's beds (CS34):

<!-- live:beds -->
| Dorm level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Beds | 3 | 5 | 8 | 12 | 16 | 22 | 30 | 40 | 50 | 60 |
<!-- /live -->

The Farm Rank's thresholds (CS39; its points counted each night from F24, [goals.md](goals.md#the-farm-rank-cs39-decisions-1-and-8)):

<!-- live:farm-ranks -->
| Farm Rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 150 | 500 | 1,200 | 2,400 | 4,000 | 6,500 | 10,000 | 15,000 | 22,000 |
<!-- /live -->

### v2 → v3 (F17, CS54)

It runs once, in the app, on the first boot after master data's roster has loaded (her calling's line comes from
it, and the API has no master data). It's pure and deterministic, so two devices carry a save over alike, and it never
moves `account.updatedAt`, `createdAt` or `uid`. Every v2 the app meets goes through it: the device's save, the
server's, a 409's stored save, a safety copy restored. The result is committed without stamping, so it uploads and the
next boot reads v3.

| Step | What |
|---|---|
| 1 | **Running jobs finish:** every started entry completes into the Warehouse as if its last night had come, paying its Craft EXP first, so a level it earns counts in step 3. Queues and stopped queues drop; uma-work reserves nothing for a queued job, so nothing comes back |
| 2 | **Materials:** what is still a good carries over at ★1; what leaves the game is refunded per grade (below) |
| 3 | **Craft Level becomes her rank** in her calling's activity (below). An outfit the release no longer has joins at Novice everywhere |
| 4 | **The roster:** every Uma in `umas` joins on day 1; the Dorm's level is the lowest with a bed for each, bought and in effect, free. Past 60, the 60 with the most mapped points live home (ties by outfit id) and the rest are away |
| 5 | **The calendar starts:** day 1, 500g plus the refunds, Block A, 9 Carrot seeds, chapter 1. A roster under three picks the rest on the start's sheet (F23) |
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

**Since F24 the app sends nothing:** days are turns, so nothing finishes while it's closed (D25), and the Wilds' switch,
subscription and schedule left with their screens; Account says "Off: days are turns". The server side below, the
service worker's handlers and `farm-push-tick` are untouched, so notifications can come back without new plumbing. What
follows is F6's design as built.

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
a time), build with the size check; then the API image to Cloud Run `farm-api`, the web to Hosting site `uma-farm`, and
the checks: health with the commit, `/api/save` 401 without a token, the ping 401, the shell `no-cache`, and uma-rpg's own
health. Docs-only pushes skip it. `VAPID_KEYS` comes from Secret Manager's `farm-vapid`.

## Local development

```bash
NODE_AUTH_TOKEN=$(gh auth token) pnpm install
pnpm api   # :8101, auth off (the local user), saves in apps/api/.data/save.json, push in memory and off
pnpm web   # :5194, /api proxied to :8101: the romance build on save v4 (F46); VITE_FARM_ROMANCE=0 pnpm web plays M4
```

The dev server wipes a dev v3 into a fresh v4 once; the M4 dev server then stops at it. Reset `apps/api/.data/save.json`
(and the browser's `uma-farm` database) to switch back.

Master data comes from `../uma-platform/content/release` (set `MASTER_DIR` to point elsewhere). The preview pane starts both
from `.claude/launch.json`. To try the owner guard, run the built API with `ALLOWED_EMAIL` set and no `AUTH_MODE`.
