# F17 — Save v3 and the migration from v2

**uma-farm · Claude · M · Needs: F7 read (the owner's read of the core spec) · Unblocks: F18, F19, F21 (and F23 through
F21) · Milestone M4, the loop on today's map**

## Why

Every M4 packet keeps its state in one new save version. This packet writes it whole from the core spec (CS53), with the
migration that carries a v2 save into the new loop (CS54), the shared units every later packet reads (CS1, CS3), and the
switch that keeps production on today's Wilds until M4 is whole and F24 turns it on.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS1, CS3, CS32, CS53, CS54, CS55**, and for what this packet only
  prepares: CS2 (the start's picks, F23), CS34 (the Dorm's beds), CS39 (the Farm Rank's thresholds). Its §12 whole.
- [core-loop.md](../../design/core-loop.md): FC5, FC6, FC16, FC18, FC31, and "Notes from drawing the page" #9, #11, #14.
- [decisions.md](../../decisions.md): **D24** (#9 the lines' activities, #11 beds, #14 refunds), **D25** (time is turns;
  running jobs finish on the first night), **D27**, and **D28** ("the migration refunds what leaves the game: the making
  places' items and the vegetables' refined forms").
- The manual: [architecture.md](../../game/architecture.md) (the save, its sync, the production-save rules),
  [loops.md](../../game/loops.md) (the save), [materials.md](../../game/materials.md) (what a v2 Warehouse holds).
- Code:
  - `packages/domain/src/save/save.ts`: v1, v2, `toV2`, `parseSave`, the strict helpers (`object`, `record`, `count`,
    paths in errors), `versionOf`, `parseSavePut`;
  - `packages/domain/src/save/work.ts`: `settleWork`, `collectAll` (step 1 of the migration);
  - `packages/domain/src/work/world.ts` (`FarmWorld`), `economy/pacing.ts` (Craft Level), `items/lines.ts`,
    `items/made-id.ts`, `items/made-v4.ts` (`madeRefinedV4`, for the refunds), `items/catalog.ts`;
  - `packages/domain/src/roster/roster.ts`, `roster/template.ts`, `economy/professions.ts`: the calling rule
    (`umaTrade`, `tradeLine`) that names her line;
  - `apps/web/src/save/game.ts` (`boot`, `commit`, `edit`), `save/db.ts`, `save/reconcile.ts`, `master/master.ts`,
    `app/router.tsx`, `home/AccountView.tsx` (safety copies);
  - `apps/api/src/save/` (the controller and both repositories; Firestore's copies the stored document to
    `saveBackups/{uid}-v{n}` when a newer version first replaces it);
  - `scripts/check-size.mjs` and `apps/web/package.json`'s `build`;
  - `@luismlorenzana/uma-work` 0.1.0's `types.d.ts`: `WorkState`, `ItemStock` (a flat `Record<string, number>`), `Entry`.

## Decisions made

### From the spec

- **Units (CS1):**
  - a farm day is one turn; day *d* is year ⌈*d*/48⌉, season ⌊((*d*−1) mod 48)/12⌋ (Spring, Summer, Autumn, Winter),
    day ((*d*−1) mod 12) + 1;
  - gold is whole; prices round to 5g and rewards to 10g;
  - stars 1–5; grades G1–G10 in uma-art's order (`items/atlas.json`);
  - every random number is a seeded draw of the account, the day and what's drawn, so a night replays the same;
  - counts round half up (`Math.round`), never below 1 for a job that ran.
- **The shape is CS53's,** copied whole into `packages/domain/src/save/v3.ts`, with the additions below:
  `version: 3`, `account` (unchanged), `calendar: { day }`, `gold`, `roster` (`RosterUma`: `joined`, `ranks` for the
  nine activities as `{ points, rank 0–5, challenge }`, `affinity`, `wellFed`), `dorm: { level, home }`, `visitors`,
  `items` and `bin` (counts by ★1…★5 per id), `work` (uma-work's rows; the clock is (day − 1) × 86,400,000 ms),
  `fields.blocks` (`id` A–D, `tender`, `plots`), `crops` (crop points), `ranch.animals`, `places.mine` and
  `places.quarry` (`deepest`, `stairs`), `buildings` (levels), `tools` (tiers 1–5), `workshops`, `expeditions`, `bonds`
  (`'idA:idB'`, ids sorted), `board`, `diary` (`shipped`, `milestones`, `records`, `read`), `farm` (`points`,
  `chapter`, `goals`, `festivals`), `summary`. `Plot` is `{ crop, growth, ready, regrowing, own }`.
- **Talents aren't saved** (CS53): they're read from master data each boot (F21).
- **The nine activities** (D24 #8): farming, the ranch, mining, fishing, foraging, cooking, serving, forging,
  expeditions. **Six ranks:** Novice, Hand, Skilled, Expert, Master, Legend (0–5), at **0, 40, 160, 400, 900, 2,000**
  points (CS29).
- **Day 1 (CS3, `newSave`):** day 1, **500g**, **9 Carrot seeds**, **Block A** of 9 tilled plots, the Dorm at level 1
  (3 beds), chapter 1, everything else empty. Places open: the Fields, the Forest's Woods and the Fishery's Pond; the
  yard (bin, Dorm, Warehouse, Gate) and the shop. The rest opens later (F18 draws them locked).
- **The migration, v2 → v3 (CS54),** runs once, on the first boot of the v3 app, and **never moves `account.updatedAt`**
  (nor `createdAt` or `uid`):

  | Step | What |
  |---|---|
  | 1 | **Running jobs finish:** every started entry completes into the Warehouse as if its last night had come, paying its Craft EXP first (so a level it earns counts in step 3). Queues and stopped queues drop; uma-work reserves nothing for a queued job, so nothing comes back |
  | 2 | **Materials (with D28):** a v2 item that is still a good in v3 (ores and ingots, logs and planks, fish and fillets, crystals and cut crystals, raw vegetables) carries over at ★1. What leaves the game is refunded per grade: a refined vegetable (Chopped Carrot…) **15g × its grade**; a made item **15g × its grade × the refined items in its recipe** (an Arms Gem G3 is 15 × 3 × 10 = 450g; a Planet Jewel n is grade 2n − 1, a Moon Jewel n grade 2n). A raw item that left would be 10g × its grade, but none does |
  | 3 | **Craft Level becomes her rank** in her calling's activity (CS32, D24 #9: Metal and Stone → mining, Wood → foraging, Fish → fishing, Vegetables → farming), every challenge up to it done; her other eight activities start at Novice, 0 points |
  | 4 | **The roster:** every Uma in v2's `umas` joins (`joined: 1`); the Dorm's level is the lowest with a bed for each, free |
  | 5 | **The calendar starts:** day 1, 500g plus the refunds, Block A, 9 Carrot seeds, chapter 1 |
  | 6 | Everything else starts empty: Farm Rank 1 (0 points), the Diary, bonds, the board |

  CS32's bands, points set to:

  | Craft Level | Rank | Points |
  |---|---|---|
  | 1–5 | Novice | 8 × (Lv − 1) (Lv 5: 32) |
  | 6–15 | Hand | 40 + 12 × (Lv − 6) (Lv 15: 148) |
  | 16–25 | Skilled | 160 + 24 × (Lv − 16) (Lv 25: 376) |
  | 26–35 | Expert | 400 + 50 × (Lv − 26) (Lv 35: 850) |
  | 36–45 | Master | 900 + 110 × (Lv − 36) (Lv 45: 1,890) |
  | 46–50 | Legend | 2,000 |

  The Dorm's beds by level (CS34): 3, 5, 8, 12, 16, 22, 30, 40, 50, 60.
- **The server's first v3 write keeps the v2 document** in `saveBackups/{uid}-v2`, as the Firestore repository already
  does for any newer version.

### Decided here (the spec left these open)

1. **M4 ships dark.** Production keeps playing today's Wilds on v2 until F24 turns the loop on, so the owner never meets
   a half-built loop and v3 can still be extended before any real save holds it.
   - The web app plays the loop only when `import.meta.env.VITE_FARM_LOOP === '1'`: on in `apps/web/.env.development`
     (the dev server), in Vitest's env, and in a new `apps/web/.env.loop`; unset in production (`.env.production` is not
     touched). F24 deletes the switch and the Wilds' screens.
   - `pnpm build` checks the size of both builds: the deployed one, then `vite build --mode loop --outDir dist-loop`
     with `scripts/check-size.mjs dist-loop` (ignore `dist-loop/` in git). Both stay ≤ 180 KB gzip.
   - Nothing migrates in production before F24. Production checks for F17–F23 are "the deploy passed and the Wilds play
     as before".
2. **The migration runs in the app, not in the parse.** It needs master data (step 3's calling) and the start's picks
   are a player's choice (CS2), and the API's parse has neither. So:
   - `parseSave` returns `StoredSave = SaveV2 | SaveV3` at the version stored (v1 still becomes v2 as today). The API
     keeps storing what was sent, so production's v2 app is unaffected, and a v3 upload is accepted once the loop is on.
   - `migrateToV3(save: SaveV2, context: { lineOf(outfitId): Line | null }): SaveV3` is pure and deterministic (an
     outfit the release no longer has joins at Novice everywhere). The loop's boot runs it when it reads a v1 or v2
     save, after master data's roster has loaded, and commits the result **without stamping** `updatedAt`. Every other v2 the loop meets (a 409's stored save, a safety copy restored) goes
     through it the same way before use.
   - A stale v2 client writing over a stored v3 is already refused by the repository (an older version) and kept in
     `saveRescues`, so nothing is lost.
   - `Save` stays the v2 type for the Wilds' code until F24; v3 is `SaveV3`, and the store, Dexie row and API envelope
     hold `StoredSave`.
3. **The Warehouse by stars meets uma-work's flat stock through one bridge.** CS53 stores `items[id] = [★1…★5]`;
   uma-work reads `items` as `Record<string, number>`. The engine sees a view whose keys are `<id>@<stars>`
   (`carp@2`), built by `workStock(save.items)` and folded back by `fromWorkStock(view)`; work rows store those keys in
   their inputs and outputs. Nothing else reads the view.
4. **Additions to CS53** (each needed by a named packet; v3 is unreleased, so they're part of v3):
   - `start: { redraws: number }`: the start's one free redraw (F23, CS2);
   - `today: { chats: OutfitId[]; gifts: OutfitId[] }`: once-a-day chats and gifts, cleared each night (F23, CS45);
   - `dorm.swaps: { out: OutfitId; in: OutfitId }[]`: swaps that arrive the next morning (F23, CS36);
   - `farm.counts: Record<string, number>`: lifetime counters the goals, milestones and Farm Rank read (gold shipped,
     plots harvested, items brought home by place). Each packet names its keys in its manual page.
5. **`buildings` levels:** absent is locked, **0 is "plans held, not built"** (the Mill after chapter 1), 1 or more is
   built. `buildings.dorm` is the level **bought**; `dorm.level` is the level **in effect**, which catches up in the
   night ("upgrades take effect the next morning", CS34). CS53 had the Dorm's level twice; this gives each a meaning.
6. **Seeds are Warehouse items** with farm ids: `seed-<cropId>` from the shop and `seed-<cropId>-own` from harvests, held
   at ★1 (index 0). Day 1 holds `seed-carrot: [9, 0, 0, 0, 0]`. They have no bin price (F19, F20).
7. **The v3 Warehouse's ids** are the goods CS19 prices by the ladder or as crops (260: 27 crops and 10 flours, the
   forest's 113, mining's 60, fishing's 20, expeditions' 30), plus seeds. They're data in `@farm/domain`
   (`goods/ids.ts`, written from uma-art 2.21.0's `items/atlas.json`; a web test checks every id is on the atlas).
   The ranch's, the dishes' and the Forge's goods join with their packets (F27, F8, F36).
8. **Shared helpers live here,** so F18–F24 can land in any order their Needs allow:
   - `dateOf(day)`, `DAY_MS = 86_400_000`, `workNow(save) = (day − 1) × DAY_MS`;
   - `draw(uid, day, what, n) → [0, 1)`: FNV-1a over `uid|day|what|n`, then one mulberry32 step. Its test pins vectors,
     so the function never changes once v3 is live;
   - `round5`, `round10`, `countRound`;
   - `spendGold(save, g)` (refuses short, a new `SaveRuleReason` `'no-gold'`) and `earnGold`;
   - `RANKS` and the activities; `FARM_RANK_POINTS = [0, 150, 500, 1200, 2400, 4000, 6500, 10000, 15000, 22000]` and
     `farmRankOf(points)` (CS39's thresholds, read-only until F24 makes points);
   - `BEDS` and `dormLevelFor(count)`.
9. **Fewer than 3 Umas:** the start's picks (CS2) are F23's sheet. Until it lands, the loop build fills a save with fewer
   than 3 Umas from a seeded shuffle of the release (`draw(uid, 0, 'start', n)`), so F18–F22 can be tried locally. It
   exists only in the loop build, and F23 removes it. A migrated save keeps its Umas; the picks fill only the gap.
10. **More than 60 Umas in v2:** the 60 with the most mapped rank points live home (ties by outfit id); the rest are on
    their off-season (CS36).
11. **Work rows in v3** sit at the v3 work places (`forest`, `fishery`, `mill`, `sawmill`, `smokehouse`, and from M5
    `mine`, `quarry`, `smelter`, `cutter`). The parse checks their structure and stock keys; each kind validates its own
    requests through a registry F18 and F22 fill. A v3 save has no work rows until F22.

### Rules that hold (every M4 packet)

- No original-game content in git: names, titles and art come from master data at runtime only; tests use
  `@luismlorenzana/uma-data/testing` fixtures or invented ids. Run `git status` and the private-content guard before
  committing.
- Main JS ≤ 180 KB gzip, in both builds while M4 is dark.
- The farm runs on today's map, uma-kit's Phaser Hub, until M7.
- Portrait 390×844 first (check 375×667), 44 pt targets, safe areas.
- Player-facing text is short; explanations go behind a help button.
- `uma-work` and `uma-kit/work` aren't forked: anything they lack is a uma-platform request, pinned when released.
- Every save change is a new version with its migration and tests, and `account.updatedAt` never moves in a migration.
  v3 is unreleased until F24, so an M4 packet may extend v3 in place, with parse tests; from F24 on, a change is v4.
- The copied uma-rpg code stays copied, never imported.
- The manual (`docs/game/`) changes in the same commit as each rule.

### Left to the worker

File layout under `packages/domain/src/save/` and a new `farm/` or `goods/` folder; the parse's error words; how the
loop's boot waits for master data (a gate, as F5's place pages wait for the roster).

## Do

1. **The units and helpers** (decision 8), with tests: day 1 is Spring 1 of year 1, day 12 Spring 12, day 13 Summer 1,
   day 48 Winter 12, day 49 Spring 1 of year 2; `draw`'s pinned vectors; rounding half up.
2. **The v3 shape** (CS53 plus decision 4), `newSave` for day 1 (CS3), and `parseSaveV3`: strict keys, explicit paths,
   every id checked (outfit ids, good and seed ids, crop ids, building and tool ids, the nine activities, blocks A–D of 9
   plots, bond keys sorted, `dorm.home` within the roster and the beds).
3. **The Warehouse bridge** (decision 3): `workStock`, `fromWorkStock`, `addGoods`, `takeGoods`, round-tripping.
4. **`migrateToV3`** (CS54 with D28 and decisions 2, 10), each step its own function with its own test.
5. **`parseSave` and `parseSavePut`** return `StoredSave`; the API's types follow. v1 → v2 is unchanged.
6. **The loop's boot** in the web app (decisions 1, 2, 9): the switch, the migration after master data loads, a commit
   that keeps `updatedAt`, the store and Dexie row on `StoredSave`, reconcile migrating a v2 it adopts. The loop's `/`
   is a plain page until F18's map: the date, the gold, the roster's faces with their ranks, and the Warehouse's count.
7. **Both size checks** in `pnpm build` (decision 1).
8. **The manual:** [architecture.md](../../game/architecture.md)'s save history gets row 3 ("built in F17; live from
   F24"), the v3 shape, the migration's table and the dark launch.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks are ≤ 180 KB gzip; the private-content guard passes.
- Domain tests, all on invented outfit ids:
  - `newSave` is day 1: 500g, `seed-carrot` ×9, Block A's 9 empty plots, Dorm level 1, chapter 1;
  - a v3 save round-trips through JSON; an unknown key, a bad id and a newer version are each refused with their path;
  - a v2 save with a running job, a queue, a stopped queue, carried items and leaving items migrates: the job's items
    and Craft EXP land first, the queues drop, carried items sit at ★1, leaving items are refunded at the rates above
    (an Arms Gem G3 is 450g; a Chopped Carrot 15g; a Moon Jewel II 15 × 4 × 5 = 300g);
  - Craft Lv 1, 5, 6, 15, 16, 25, 26, 35, 36, 45, 46 and 50 map to CS32's ranks and points, in the right activity per
    line;
  - 10 Umas give Dorm level 4 (12 beds); 61 give level 10 with one away;
  - `account.uid`, `createdAt` and `updatedAt` are unchanged by every migration, v1 → v2 → v3 included;
  - `parseSave` returns a v2 save as v2 (the dark launch);
  - a full save (60 Umas × 9 ranks, 1,770 bonds, every good at five stars, 48 work rows) serializes under 1 MiB.
- Locally, from `.claude/launch.json` (`farm-api`, `farm-web`) at 390×844:
  - a local v2 save (written to `apps/api/.data/save.json` from your local release's ids, never committed) boots once
    into v3: Spring 1, 500g plus its refunds, its Umas with their ranks;
  - the stored file's `account.updatedAt` is unchanged, and a reload doesn't migrate again;
  - a fresh account starts on day 1 with 9 Carrot seeds and three Umas from the temporary picks;
  - `VITE_FARM_LOOP=0 pnpm web` still plays the Wilds on v2.
- Production: the deploy passes, health shows the commit, and https://uma-farm.web.app plays the Wilds as before.

## Deliver

Commit to `main` (`feat(domain): save v3 and the migration from v2 (F17)`, `git status` first), push, and watch the run
(`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a Done
row in [the handoff](../README.md) with the run's link, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–11.
