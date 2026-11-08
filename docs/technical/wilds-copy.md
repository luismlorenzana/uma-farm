# The Wilds' copy

> **uma-rpg `30a322ac9b9dc9a215aaedc4b3892a4f3c81e026`**, its `main` on 2026-11-08, before uma-quest's Q4 freezes it (F4,
> FW3, D8). The farm owns these rules from the copy on (FM2): nothing follows uma-rpg by itself, and a later fix there is
> copied on purpose by a new F-packet. Nothing imports from uma-rpg.

## The rule

- **Only the live generation:** at `30a322a` every `rpgRework(stage)` the Wilds read is on, so that branch alone is copied.
  `rpgRework`, `BATTLE_ENGINE_VERSION` and every engine-version parameter stay behind.
- **A copied file keeps uma-rpg's path** under `packages/domain/src/`, so it diffs against its source, and its first line
  names the commit. It changes only its import paths and what stays behind (FM4), each cut listed below.
- **Renames:** uma-rpg's `TierWorld` is the farm's `FarmWorld` (`work/world.ts`, the seam below), and `Rpg…` names are
  `Farm…`: `RpgWorkRequest` → `FarmWorkRequest`, `RPG_BUILDINGS_V4` → `FARM_BUILDINGS`, `rpgWorkEnvV4` → `farmWorkEnv`,
  `RPG_WORK_ENV` → `FARM_WORK_BASE` (without its kinds and buildings), `RpgQueueInput` → `FarmQueueInput`.
- **Tests:** copied the same way, unchanged where they test a kept rule; cases for cut rules are removed and listed. The
  copy's commit ran them green before any farm change (N8): **43 tests in 10 files** (8 copied, plus F3's save and the
  package's own).

## What was copied

| Farm file | uma-rpg source | Cuts |
|---|---|---|
| `items/lines.ts` | same | None |
| `items/lines.test.ts` | same | R2's sixty ids case (it reads save v29's fixture, uma-rpg's history) |
| `items/made-id.ts` | same | The Branch Gem (R3's, never live) |
| `items/made.ts` | same | The Branch Gem's name and place; `worldMaterialTier` and `WorldTier` (tiers) |
| `items/made.test.ts` | same | The Branch Gem's and the tiers' assertions; 51 made items become 50 |
| `items/made-v4.ts` | same | The Branch Gem's recipe |
| `items/catalog.ts` | same | Everything but `ITEM_GRADES`, `gradeUnlockLevel` and `highestGrade`: the 160 v1 items stay behind |
| `items/stock-id.ts` | same | v1's item ids and the Branch Gem's engine gate |
| `economy/jobs.ts` | same | v1's facilities (`FacilitySpec`, `FACILITIES`, `facilitySpec`): only `JobKind` and `JOB_KINDS` stay |
| `economy/pacing.ts` | same | v1's gather, refine and make times; facilities and their upgrades; Laurels, prices and Speed Tickets; Extra Stats points |
| `economy/professions.ts` | same | The engine switch and the calling pick: `umaTrade(outfit)` and `tradeResolver(world, outfitOf)` read the live calling only; `CALLING_TRADE` keeps the five Tier 0 classes |
| `economy/professions.test.ts` | same | The generation cases (`workPlace`, `liveWorkEnv`), the v2 classes' trades and the v18 calling pick |
| `economy/professions-v19.test.ts` | same | The v18 comparisons and the stored pick |
| `economy/places-v4.ts` | same | `workPlace` (the generation switch); the Branch Gem at the Weapon Forge |
| `economy/stock.ts` | same | None |
| `roster/template.ts` | same | Everything but the live calling rule: strides, knacks, families, templates, the calling pick and its rows, and the v1 row rule. `CallingOutfit` reads only running styles; `UmaCallingClass` is the five Tier 0 names, inlined from `rpg/kinds` |
| `roster/template-v19.test.ts` | same | Templates, Flourishes, moons and the v18 pick; the invented outfit keeps only its running styles |
| `hub/places.ts` | same | Every page but the Wilds, the v1 Wilds, slices (`opensIn`), tiers, locks and the Rift |
| `hub/places-v3.test.ts` | same | v1's hash check and the other pages' cases |
| `work/request.ts` | same | None (renamed) |
| `work/env.ts` | same | v1's kinds and buildings; Speed Tickets (the balance is always 0) and Laurels |
| `work/env-v3.ts` | same | `liveWorkEnv` (the generation switch) and `madeLive` (the Branch Gem) |
| `work/env-v4.ts` | same | The world's tier |
| `work/kinds/shared.ts` | same | None |
| `work/kinds-v3/setup.ts` | same | The world's tier |
| `work/kinds-v3/trade.ts` | same | None |
| `work/kinds-v4/make.ts` | same | `madeLive` and the tier (the Branch Gem) |
| `work/kinds-v4/material.ts` | same | None |
| `work/kinds-v4.test.ts` | same | The tiers' cases and the Branch Gem's recipe; the trade gate's classes read as Tier 0 callings |
| `save/rules.ts` | same | Everything but `SaveRuleError` and the work's reasons: tiers, worlds and their looks |
| `save/work.ts` | same | The save and the tier: each operation takes and returns the world (the save's own wrappers stamp the change, F4's save v2); Speed Tickets (`cutJobTime`, `speedWorker`, `finishWorker`, `finishAllCost`, `finishAllAt`); place upgrades (`upgradeCost`, `upgradeFacility`, `NO_PLACE_LEVELS`); v1's items in `planJob` (`JobPlan.item`) |
| `save/work-v3.test.ts` | same | Upgrades, Speed Tickets and tier-2 worlds; the trade gate's classes read as Tier 0 callings |

**New for the copy (the seam):**
- `work/world.ts`: `FarmWorld`, the state the copied rules read in place of uma-rpg's `TierWorld`: uma-work's three
  parts and each Uma's Craft Level;
- `work/world.fixture.ts`: the tests' constructors, in place of `save/economy-v3.fixture.ts`.

**Not copied:** `economy/grades.ts` (gear's grades, FM4; the farm's grade gate is `gradeUnlockLevel`), and every file
the copied ones no longer read: fights, classes, gear, gems, Extra Stats, the Exchange, the Rift, worlds and tiers.
