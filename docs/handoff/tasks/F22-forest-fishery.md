# F22 — The forest, the Fishery, and the Mill, Sawmill and Smokehouse

**uma-farm · Claude · M · Needs: F19, F21 · Beside: F20 · Unblocks: F24 · Milestone M4, the loop on today's map**

## Why

Day 1 sends one Uma to the Woods and one to the Pond (CS3). Foraging and fishing are the first jobs of the loop, and the
stations turn what they bring into goods worth half again as much. This packet moves gathering onto days on uma-work,
with every forest area and freshwater spot opened by rank (CS55 moved them into M4), the catch's sizes, and the three
stations M4 opens: the Mill, the Sawmill and the Smokehouse.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS15, CS16, CS17, CS18**; CS4 (the season's fish and forest family),
  CS26 (gathering's and stations' quality), CS28 and CS31 (yield, the deepest place), CS30 (fishing's and foraging's
  challenges), CS22 (well fed), CS42 (chapter 1's goal 3), CS53 (`work`, `buildings`, `diary.records`), CS55's scope
  move.
- [core-loop.md](../../design/core-loop.md): FC6, FC7, FC11, and "Notes from drawing the page" #6.
- [hd2d-farm.md](../../design/hd2d-farm.md): FR8, FR9 (a place's sheet, the taps).
- [decisions.md](../../decisions.md): D24 #6 and #9, D25, D28 (the Mill also spins cloth, the Sawmill dries herbs and
  mushrooms).
- The manual: [wilds.md](../../game/wilds.md) (a place's page, the job sheet, queues, Recall, Repeat),
  [days.md](../../game/days.md), [goods.md](../../game/goods.md), [ranks.md](../../game/ranks.md).
- Code: F17's Warehouse bridge (`<id>@<stars>` keys), `draw`, `workNow`, `buildings`, `farm.counts`; F18's
  `farmEnvV3` and its kind registry, `endDay` step 4; F19's catalogue, `quality`, `drawStars`; F21's
  `talentOf`, `rankBenefits`, `countChallenge`, `favouriteActivity`; `packages/domain/src/work/kinds-v4/` (how a kind
  plans and pays, as copied), `save/work.ts`; `apps/web/src/places/work/` (`FarmWork.tsx`, `What.tsx`,
  `PlaceBody.tsx`); uma-work's `WorkKindRules` (`plan`, `pay`, `count`, `maxItems`) and `PlannedItem`.

## Decisions made

### From the spec

- **Foraging areas (CS16):** six, opened by her foraging rank: **the Woods** (Novice, G1–G2), **the Hills** (Hand,
  G3–G4), **the Old Forest** (Skilled, G4–G5), **the Mountain** (Expert, G6–G7), **the Misty Vale** (Master, G8–G9),
  **the World Tree** (Legend, G9–G10). Each yields its two grades 65/35, of **woods 40%, mushrooms 30%, herbs and spices
  15%, and the season's family 15%** (Spring sweets, Summer fruits, Autumn nuts and seeds, Winter more mushrooms).
  CS16's area table is the data, row for row, with each season's items and shares (the Woods in Spring: Pine Log 26%,
  Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Honeycomb 10%, Mint 5%, Sugarcane 5%).
- **Fishing spots (CS15):** seven, opened by her fishing rank: **the Pond** (Novice), **the River** (Hand), **the Lake**
  (Skilled), **the Falls** (Expert), **the Moon Pool** (Legend); **the Sea Pier** (Hand and chapter 7) and **the Deep
  Sea** (Master, chapter 7 and the boat) wait for M6. CS15's spot table is the data, with each season's fish and shares
  (the Pond in Spring: Carp 60%, Trout 40%).
- **Sizes (CS15):** a catch's size is `min + (max − min) × u^(8/k)`, with `k = 1 + 0.25 × rank + 0.1 × talent step +
  0.05 × Rod tier`, and each fish's range from CS15's table (Carp 20–60 cm … Tuna 80–250 cm). Sizes feed the Diary's
  records and the Derby (M6).
- **A day's haul (CS17):** `items = round(base × rank × talent × tool × well fed × bond)`: base **5** the forest, **3**
  the Fishery (4 the Mine and the Quarry, M5); rank ×1.0, 1.15, 1.3, 1.5, 1.7, 2.0; talent ×0.85 … ×1.2; tool ×1.0 …
  ×1.6 (Basic in M4); well fed ×1.25; bond ×1.1 beside an Uma she has 3+ hearts with (M6). CS17's "what a day is worth"
  table is a check, not a rule.
- **Quality (CS26), gathering:** 0.5 × her rank, her talent's points, the tool +0.25 a tier, well fed +0.25.
- **Stations (CS18):** one per gathering place, **8 items a day**: an Uma processes `round(8 × rank × talent × well
  fed)` items a day, with the rank and talent of **the station's place's activity**. A station job takes its inputs
  from the Warehouse at the start; **its stars carry through**. The output sells at ×1.5 its input. Making jobs run
  2–3 days on 2–3 days' batch.

  | Station | At | Rank used | Builds for | Opens | Jobs in M4 |
  |---|---|---|---|---|---|
  | **Mill** | Fields | Farming | 1,200g | Chapter 1's reward (its plans) | **Flour** (1 day): every grain → its flour · **Sugars and oils** (1 day): every sweet and nut → its refined form · **Preserves** (2 days): a fruit → its preserve |
  | **Sawmill** | Forest | Foraging | 1,500g | Farm Rank 3 | **Planks** (1 day): a log → its plank · **Drying** (1 day): a mushroom or a herb → its dried or ground form |
  | **Smokehouse** | Fishery | Fishing | 2,000g | Farm Rank 3 | **Smoking** (1 day): a fish → its fillet |

  The Mill's **Cloth** (3 days, 2 fleece → 1 cloth) waits for the ranch's wool (M5, F27). The refined forms are the
  atlas's refined rows (Wheat → Wheat Flour, Honeycomb → Honey, Sunflower Seed → Sunflower Oil, Apple → Apple
  Preserve, Pine Log → Pine Plank, Shiitake → Dried Shiitake, Ginger → Ground Ginger, Carp → Carp Fillet). The
  vegetables have no station (CS11).
- **Work in days (FC6):** gathering and processing take 1 day; a queue means "keep at this for N days"; Repeat starts
  the same job the next morning; Recall and stopped queues stay uma-work's.
- **Challenges (CS30)** this packet counts: fishing, catch 30 fish (Hand), 10 at the River (Skilled), 10 at the Lake
  (Expert), 10 at the Falls (Master); foraging, gather 50 items (Hand), 20 in the Hills, 20 in the Old Forest, 20 on
  the Mountain, 20 in the Misty Vale (Legend). Station days pay rank points to the station's activity.

### Decided here (the spec left these open)

1. **A gathering job is a number of days, and its haul is planned when it starts.** The request is
   `{ kind: 'forage' | 'fish', item: <area or spot>, count: days }` (1 to 4; a queue adds up to three more jobs).
   The kind's `plan` returns each day's items: their count by CS17 with her rank, talent and well-fed days as they stand
   at the start, their goods and stars drawn with `draw(uid, startDay + k, '<place>:<slot>:<n>', …)`, as starred
   outputs (`pine-log@2`); each day's items take seconds that sum to exactly 86,400. This is uma-work's frozen plan:
   the same save always gives the same haul, and a queued day starting at a boundary is planned with that night's
   ranks (F18's decision 3). The v3 parse accepts an entry whose item count differs from the request's days.
2. **A station job is a number of items,** `{ kind: <station job>, item: '<output>@<stars>', count }` (up to 100):
   one input of one good at one star each, the output at the same stars. Its time is ⌈count ÷ the day's rate⌉ days, at
   least the job's days (preserves 2). The job sheet offers "1 day · 8", "2 days · 16" and "All held · 5".
3. **Pay is plain:** collecting adds the starred outputs to the Warehouse through F17's bridge. A fish's size is drawn
   in the kind's `pay` (outputs carry no size), seeded by the account, the collect's day, the Uma and the fish's index,
   so the same collect always measures the same; the biggest of each kind goes in `diary.records['size:<fish>']`.
4. **Well fed:** a 1-day kind's plan takes ×1.25 items for each day she'll be well fed; the preserves' 2-day job gains
   its quarter days through F18's night (`acceleratedMs`).
5. **The places:** the Forest and the Fishery each keep four slots (D24 #13); her job sheet's What step lists the areas
   or spots, the ones her rank hasn't opened greyed ("From Hand"), each with what it gives this season and "about 5 a
   day" for her. The stations are their own map places (F18's row 1–3 centre), each with four slots, locked until built:
   the quick look says what opens it, then **Build · 1,200g**.
6. **Building a station** sets `buildings.<station>` to 1 (F17's decision 5): the Mill needs its plans (`0`, chapter 1's
   reward, F24), the Sawmill and the Smokehouse Farm Rank 3 (`farmRankOf`). CS39's table leaves them out of FR3's
   "Opens"; CS18 is followed.
7. **What it counts:** `farm.counts['home:forest']` and `farm.counts['home:fishery']` rise by the items collected
   (chapter 1's goal 3, F24); F21's challenges count catches and items per place; the summary's "work done" lists jobs
   finished by place and the night's best catch.
8. **Words:** the job sheet and slot rows say days ("2 days", "Back tomorrow") where the farm draws them; uma-kit's own
   rows say "24h" until F18's duration request ships.

### Rules that hold (every M4 packet)

- No original-game content in git: names, titles and art come from master data at runtime only; tests use
  `@luismlorenzana/uma-data/testing` fixtures or invented ids. Run `git status` and the private-content guard before
  committing.
- Main JS ≤ 180 KB gzip, in both builds while M4 is dark (F17).
- The farm runs on today's map, uma-kit's Phaser Hub, until M7.
- Portrait 390×844 first (check 375×667), 44 pt targets, safe areas.
- Player-facing text is short; explanations go behind a help button.
- `uma-work` and `uma-kit/work` aren't forked: anything they lack is a uma-platform request, pinned when released.
- Every save change is a new version with its migration and tests, and `account.updatedAt` never moves in a migration.
  v3 is unreleased until F24, so an M4 packet may extend v3 in place, with parse tests; from F24 on, a change is v4.
- The copied uma-rpg code stays copied, never imported.
- The manual (`docs/game/`) changes in the same commit as each rule.

### Left to the worker

The kinds' module layout; the What step's drawing; the job sheet's day sizes beyond decision 1's range if play shows
another is wanted (log it).

## Do

1. **The data:** CS16's areas and CS15's spots by season, the fish sizes, the stations' recipes (every refined pair
   from F19's catalogue), in `@farm/domain`.
2. **The kinds:** `forage`, `fish` and the station jobs (decisions 1–4), registered in F18's env, with their request
   checks for the v3 parse.
3. **Building stations** (decision 6) and the summary's work lines (decision 7).
4. **The screens:** the Forest's and the Fishery's pages and quick looks on uma-kit/work with the farm's What step;
   the three stations' pages; Collect and Collect all filling the Warehouse by stars.
5. **The manual:** a new [docs/game/gathering.md](../../game/gathering.md) with live blocks (the areas and spots by
   season, the haul's factors, the fish sizes, the stations and their recipes) and hand-written rules ("built in F22,
   live from F24"); its row in [the manual's index](../../game/README.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks are ≤ 180 KB gzip; the private-content guard passes.
- Domain tests:
  - a Novice C forager in the Woods brings home round(5 × 1.0 × 1.05) = **5** items a day, a Hand C angler at the River
    round(3 × 1.15 × 1.05) = **4**;
  - the Hills are refused at Novice and opened at Hand; the Sea Pier is refused in M4;
  - over a seeded sample, the Woods in Spring give woods 40%, mushrooms 30%, herbs 15% and sweets 15% at G1/G2 65/35;
  - the same save plans the same haul twice; a queued day starting after a rank-up uses the new rank;
  - CS18's worked case, re-cast to the Sawmill: a Hand C forager saws round(8 × 1.15 × 1.05) = **10** logs a day, and
    ★3 logs make ★3 planks;
  - a 2-day preserves job takes two nights; a station job longer than the Warehouse holds is refused as short;
  - the Mill can't be built without its plans, nor the Sawmill before Farm Rank 3 or without 1,500g;
  - sizes stay in each fish's range and grow with *k*; the biggest is kept per kind;
  - challenges count catches and items at the right places.
- `pnpm docs:update` leaves `gathering.md` unchanged.
- Locally (loop build) at 390×844: on day 1, send one Uma to the Woods and one to the Pond for a day each, end the day,
  collect: the Warehouse holds the haul by stars; queue three more days at the Woods, end three days, and collect each
  morning; build the Sawmill on a dev save at Farm Rank 3 and saw a day of logs.
- Production: the deploy passes, health shows the commit, and https://uma-farm.web.app plays the Wilds as before.

## Deliver

Commit to `main` (`feat: the forest, the Fishery and three stations (F22)`, `git status` first), push, and watch the
run (`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a
Done row in [the handoff](../README.md) with the run's link, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–8.
