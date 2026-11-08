# F4 — The rules

**uma-farm · Claude · M · Needs: F1 ✓ · Beside: F3 · Unblocks: F5, F6, F7 (to start) · Milestone M2**

## Why

The farm is uma-rpg's Wilds as its own app (FM2). This packet copies the Wilds' rules into `@farm/domain` at one recorded
commit, with their tests, and gives them a save to run in. Everything after it, the screens (F5), push (F6) and the
design spec (F7), reads these rules. It is pure domain, so it runs beside F3 (FW4).

## Context (read first)

- [first-playable.md](../../design/first-playable.md): R2–R5, R7, R9, N4–N6, N8 and FW3–FW5, FW11, FW13.
- [plan.md](../../design/plan.md): FM2–FM8 (what is copied and what stays behind) and FM16.
- **uma-rpg at `30a322ac9b9dc9a215aaedc4b3892a4f3c81e026`** (its `main` on 2026-11-08), in `~/workspace/uma-rpg`. Read it
  with `git -C ../uma-rpg show 30a322a:<path>`, never from a moving checkout:
  - `packages/domain/src/items/`: `lines.ts`, `made-id.ts`, `made.ts`, `made-v4.ts`, `catalog.ts` (`gradeUnlockLevel`),
    `stock-id.ts`, with `lines.test.ts` and `made.test.ts`;
  - `packages/domain/src/economy/`: `places-v4.ts`, `professions.ts`, `pacing.ts`, `stock.ts`, `jobs.ts`, with
    `professions.test.ts`, `professions-v19.test.ts` and `materials.test.ts`;
  - `packages/domain/src/work/`: `env.ts`, `env-v3.ts`, `env-v4.ts`, `request.ts`, `kinds/shared.ts`, `kinds-v3/`,
    `kinds-v4/`, with `kinds-v4.test.ts`;
  - `packages/domain/src/roster/template.ts`: the calling rule (`umaCallingRowV3`, `UMA_ROW_CALLING_V3`), with
    `template-v19.test.ts`;
  - `packages/domain/src/save/work.ts` and `save/notify.ts`: the save wrappers over `uma-work`, with `work.test.ts`,
    `work-v3.test.ts`, `work-finish-all.test.ts` and `notify.test.ts`;
  - `packages/domain/src/docs/render.ts` and `docs/game/materials.md`, `loops.md`: how the manual's live blocks are
    generated.
- **`@luismlorenzana/uma-work` 0.1.0** (already installed): the engine. Read its types (`WorkState`, `WorkRow`,
  `WorkEnv`, `WorkKindRules`) before writing the save.
- F3's save v1 ([F3](F3-hello-app.md)): `{ version: 1, account: { uid, createdAt, updatedAt } }`. If F3 has landed, its
  `packages/domain/src/save/` is the base; if not, write v2 against that shape and rebase.

## Decisions made

- **The commit (FW3):** uma-rpg `30a322a`, its `main` on 2026-11-08, picked at this packet's start. uma-quest's Q4, which
  freezes uma-rpg, hasn't started. Every copied file names it. If a later fix in uma-rpg matters, a new F-packet copies it
  on purpose; nothing follows uma-rpg by itself.
- **Only the live generation is copied.** uma-rpg's rules switch by engine version (`rpgRework(stage)`); at `30a322a`
  every stage the Wilds read is on. The farm copies that branch alone, so `rpgRework`, `BATTLE_ENGINE_VERSION`, v1's
  facilities (`work/env.ts`'s buildings, `kinds/gather.ts`, `refine.ts`, `craft.ts`, `cut.ts`) and the v1 item catalog
  stay behind.
- **What stays behind (FM4):** fights, classes and their promotion, gear and its grades (so `economy/grades.ts` stays
  behind; the brief listed it, but it is gear's grades, and the one rule the farm needs, grade g at Craft Lv 5g − 4, is
  `gradeUnlockLevel`), Extra Stats, Laurels and every price, the Exchange, Speed Tickets, Uma Tickets, tiers and worlds,
  and the Branch Gem (R3's, never live).
- **How a file is copied (N4, N8):**
  - a file with no import that stays behind is copied byte for byte, apart from its import paths;
  - a file that reads something left behind is copied with only that removed. Each cut is listed in the copy manifest
    with what it was;
  - its tests are copied the same way: unchanged where they test a kept rule, and the cases for cut rules removed and
    listed.

  The copied tests run green **before** the first farm change, as their own commit, so the copy and the farm's changes
  are told apart in history.
- **Where:** `packages/domain/src/` keeps uma-rpg's folders (`items/`, `economy/`, `work/`, `roster/`, `save/`), so a
  copied file diffs against its source. `docs/technical/wilds-copy.md` is the copy manifest: the commit, every file with
  its source path, and every cut.
- **The calling rule (FM7):** uma-rpg's live rule, Classes v3's row from her best running styles (CV19), mapped to the
  trade her Tier 0 class takes (`CALLING_TRADE`): Front → Metal; Pace alone → Wood; Pace with Late or End → Stone; End →
  Fish; Late alone → Vegetables. The class names stay internal; the farm shows only the trade's line. The trade gate and
  the open shop carry over unchanged.
- **Who works (FM6, R3):** every outfit on the release. An Uma has no row in the save until she first works; her Craft
  Level is then Lv 1. The env's `isWorker` takes any outfit id the caller's roster holds, and any well-formed outfit id
  when the caller has none (the API's parse, settles), as uma-rpg's `tradeOf` does.
- **Save v2 (FW5, R5):** `{ version: 2, account, umas, items, buildings, work }`, where
  - `umas[outfitId] = { craft: { level, exp } }`;
  - `items` is the Warehouse: line items and made items by id;
  - `work` is uma-work's rows by outfit id;
  - `buildings` is uma-work's `WorkState` field, always `{}`: places have no levels (four slots at ×1.25 from day one,
    as in uma-rpg's Wilds). `parseSave` migrates v1 to v2 by
  adding the empty fields and **keeps `account.updatedAt` as it was** (the production-save rule). v1 stays parseable for
  good.
- **The made kinds (FM8, R4):** uma-rpg's five, with its ids and recipes: Arms Gems (`weapon-gem-g1`…), Tome Ink, Armor
  Fittings, Accessory Settings, and Planet and Moon Jewels. `madeName` reads as uma-rpg's.
- **Job sizes and times:** uma-rpg's Wilds: each step 24 minutes at Craft Lv 1 falling to 16 at Lv 50, at ×1.25; sizes
  ×1 … ×30; three queued behind a running job; Repeat, Recall and stopped queues, all from `uma-work`.
- **The manual (R9, FW13):** `docs/game/materials.md` and `loops.md` with live blocks rendered from the code by a copy of
  uma-rpg's renderer, cut to the farm's blocks: the lines and their items, the made items and their recipes, the places,
  the trades, Craft Level and the job times. `pnpm docs:update` rewrites them, and a test fails on a stale page.
- **No new package:** `uma-work` 0.1.0 and `uma-data` 1.4.0 as F1 installed them. Anything missing from `uma-work` is a
  platform request (FW11), not a fork.

## Do

1. **Copy.** Read each source at `30a322a` and copy it into the same path under `packages/domain/src/`, cutting only what
   stays behind. Write `docs/technical/wilds-copy.md` as you go. Commit (`feat(domain): copy uma-rpg's Wilds rules at
   30a322a (F4)`) with the copied tests green and nothing else changed.
2. **The env.** One `farmWorkEnv(context?)` from `env-v4.ts`: the fifteen places, the four kinds, Craft EXP into
   `umas[id].craft`, `isWorker` as above, and no tickets or money (both balances 0 and spending refused).
3. **Save v2.** The type, `newSave`, `parseSave` with the v1 → v2 migration, the work wrappers (start, queue, recall,
   collect, repeat, restart, dismiss, settle, finish when due), with tests: a v1 save migrates, v2 round-trips through
   JSON, a gather → process → make chain runs on fake clocks, and `account.updatedAt` never moves in a migration.
4. **The roster.** `farmRoster(release)` over master data's outfits (every one), each with her trade, from
   `uma-data/testing` fixtures in tests. No outfit or character names in code or tests.
5. **Notifications' input.** Copy `save/notify.ts`'s "what finishes when" for F6, cut to the farm.
6. **The manual.** `materials.md`, `loops.md` and their renderer; update `docs/game/README.md`'s index.
7. Export the API surface from `packages/domain/src/index.ts`; the main bundle must not grow past the budget when F5
   imports it.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the copy commit's tests were green before any farm change.
- Every line runs gather → process → make from G1 to G10 in a domain test, with grade gates at Craft Lv 5g − 4.
- Save v2 migrates v1 and round-trips; `account.updatedAt` is unchanged by the migration.
- `rg "uma-rpg|@rpg/" packages apps` finds only comments: nothing imports from uma-rpg.
- `pnpm docs:update` leaves `materials.md` and `loops.md` unchanged.
- The private-content guard passes: no outfit or character names.

## Deliver

Commit to `main` (`feat(domain): …`), push, and watch the run. Delete this packet, add a Done row in
[the handoff](../README.md) with the run's link, and log the packet's D-decision (fetch `main` first).
