# F26 — The Mine and the Quarry, the Smelter and the Cutter, chapter 3 (save v5)

**uma-farm · Claude · M · Needs: F27 (chapter 3 follows chapter 2; v5 follows v4) · Pins: F25's and F29's uma-art
releases if shipped and not yet pinned · Unblocks: F8 (chapter 4 follows chapter 3) · Milestone M5, more to do**

## Why

Chapter 3 opens mining: Gus Talbot reopens the Mine and the Quarry, thirty floors each, ore from one and stone and gems
from the other. Ranks decide how deep an Uma may dig, and digging the deepest floor finds the stairs to the next, so the
farm goes down floor by floor. The Smelter and the Cutter turn what comes up into ingots, cut gems and blocks, the
Forge's inputs in M6. It's F22's gathering again, on floors instead of areas.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS14** (floors, grades, the stairs), **CS17** (a day's haul, base 4),
  **CS18** (the Smelter and the Cutter), **CS43** (chapter 3's line), CS3 (what opens with chapter 3), CS9 (stones
  ×0.8, crystals ×1.6), CS26 (gathering's quality), CS28, CS30 (mining's challenges), CS31 (the deepest floor by rank),
  CS38 (Mine floors 10, 20, 30), CS41 (Gus Talbot), CS53 (`places`), CS55.
- [core-loop.md](../../design/core-loop.md): FC7, FC11, and "Notes from drawing the page" #2, #6, #7 (the Monster Den
  becomes the Quarry) and #9.
- [decisions.md](../../decisions.md): D24, D29, D35 (`PLACE_ACTIVITY` already maps the Mine, the Quarry, the Smelter and
  the Cutter to mining; `countChallenge`'s `dig`), **D36** (F22's whole pattern: the kinds, the frozen plan, the What
  step, `countHauls`, the stations, `buildStation`, the `home:*` counts), D38 (depth milestones; chapters), and F27's
  decision 1 (the version pattern) and 12 (the chapters' machinery).
- The manual: [gathering.md](../../game/gathering.md) (the model for every rule here), [ranks.md](../../game/ranks.md),
  [goals.md](../../game/goals.md), [days.md](../../game/days.md), [architecture.md](../../game/architecture.md).
- Code: `gathering/` (`ids.ts`: `LOOP_REQUESTS`, `STATIONS`, `STATION_JOBS`; `tables.ts`: `HAUL_BASE`, `TOOL_YIELD`,
  `STATION_JOB_RULES`; `kinds.ts`: `planHaul`, `planStation`, `loopKinds`, `haulsTonight`; `stations.ts`:
  `stationLock`, `buildStation`), `save/parse-v3.ts` (`LOOP_WORK_PLACES` already holds the four places), `save/v3.ts`
  (`Dig`, `DEEPEST_FLOOR`), `farm/places.ts` (the Cutter's lock), `farm/milestones.ts`, `farm/diary.ts`,
  `night/end-day.ts` (`countHauls`), `story/`; on the web `loop/WorkPlace.tsx`, `work-view.ts`, `farm-map.ts`.

## Decisions made

### From the spec

- **Thirty floors (CS14):** a floor's **main grade is ⌈floor ÷ 3⌉** (70%), with the grade below (20%) and above (10%).
  The Mine gives **ore**; the Quarry gives **stone (70%) or a gem (30%)** of the same grade.

  | Floors | Dug from | Main grades | The Mine | The Quarry |
  |---|---|---|---|---|
  | 1–5 | Novice | G1, G2 | Copper Ore → Tin Ore | Limestone / Quartz → Sandstone / Amethyst |
  | 6–10 | Hand | G2–G4 | Tin → Iron → Silver Ore | Sandstone / Amethyst → Slate / Citrine → Granite / Garnet |
  | 11–15 | Skilled | G4, G5 | Silver → Cobalt Ore | Granite / Garnet → Basalt / Emerald |
  | 16–20 | Expert | G6, G7 | Gold → Platinum Ore | Marble / Sapphire → Obsidian / Ruby |
  | 21–25 | Master | G7–G9 | Platinum → Titanium → Mythril Ore | Obsidian / Ruby → Jade / Diamond → Runestone / Starstone |
  | 26–30 | Legend | G9, G10 | Mythril → Orichalcum Ore | Runestone / Starstone → Meteorite / Philosopher's Stone |

- **The stairs (CS14):** the deepest floor reached is the farm's. An Uma digging the deepest floor, with a rank that
  allows deeper, adds **1 a day (1.25 well fed)**; floor *f*'s stairs need **⌈f ÷ 5⌉** of those days. Floor 10 takes
  15 Uma-days from the top and floor 30 takes 105. (CS14's "floor 20 takes 65" is a slip: the rule gives **50**.) She
  picks any floor down to the deepest she can reach, and the job sheet defaults to it.
- **A day's haul (CS17):** `round(4 × rank × talent × tool × well fed × bond)`, the Pick at the Mine and the Hammer at
  the Quarry (Basic until M6's Forge), bond ×1.1 from M6.
- **Quality (CS26):** 0.5 × her rank, her talent's points, +0.25 a tool tier above Basic, +0.25 well fed.
- **The stations (CS18):** the **Smelter** (at the Mine, mining's rank, **3,000g**, opens with chapter 3): **Smelting**
  (1 day), an ore → its ingot; the **Cutter** (at the Quarry, mining's rank, **4,000g**, opens with **chapter 3's
  reward**): **Cutting** (1 day), a gem → its cut gem, a stone → its block. 8 items a day × rank × talent × well fed;
  stars carry through; the output sells at ×1.5. Worked: a Hand C miner smelts round(8 × 1.15 × 1.05) = **10** Iron
  Ore (50g) into 10 Iron Ingots (75g), +250g.
- **Mining's challenges (CS30):** Hand, dig 40 ores or stones; Skilled, dig at floor 10 (the Mine or the Quarry);
  Expert floor 15; Master floor 20; Legend floor 25.
- **Milestones (CS38):** Mine floor 10, 20 and 30, **500g** each and 25 points.
- **Chapter 3, "Down the Mine" (CS43):** opens the Mine and the Quarry (Gus Talbot); goals: reach Mine floor 5 and
  Quarry floor 5, build the Smelter, dig 30 ores, reach FR3; the reward is a recruit, **1,500g**, 250 Farm Rank points
  and **the Cutter's plans** (CS18); the sim finishes it on day 19.
- **The cast (CS41):** Gus Talbot, the retired miner who reopens the Mine and the Quarry.
- **Art (CS19):** nothing new: uma-art's `mine`, `quarry`, `mine-workbench` (the Smelter) and `den-workbench` (the
  Cutter), and the 60 ores, stones and crystals with their refined forms; Gus's bust is F29's.

### Decided here (the spec left these open)

1. **Save v5:** `dig`, `smelting` and `cutting` join `LOOP_REQUESTS`; the summary gains `{ kind: 'floor', place, floor
   }`; the milestones gain `depth:mine-10`, `depth:mine-20` and `depth:mine-30`. `migrateToV5` sets the version only.
   F27's pattern (decision 1) holds: if the queue's order changes, this is the next version after the newest live one.
2. **Floors and the frontier:** `places.<mine | quarry>.deepest` is the deepest floor reached (0 before the first).
   **Floor deepest + 1 is the frontier.** She may dig any floor from 1 to the frontier, no deeper than her rank allows
   (CS31: floor 5 at Novice … 30 at Legend). Each night she digs the frontier adds a stairs-day (1.25 well fed) to
   `places.<p>.stairs`; when it reaches ⌈f ÷ 5⌉, floor *f* is reached and `stairs` returns to 0. **One floor a night at
   most a place;** days past the need are dropped, so several Umas speed a floor without skipping one. This gives CS14's
   15 Uma-days to floor 10, 50 to floor 20 and 105 to floor 30.
3. **A dig job** is `{ kind: 'dig', item: 'down' | '<floor>', count: days }` (1–4 days, a queue adding up to three
   more jobs) at the Mine or the Quarry, its slot's place. **`'down'` explores:** each night she digs, she's at the
   frontier (while her rank allows it, else her rank's last floor), so she follows the stairs as they're found; her
   haul is planned when the job starts, at the floor she starts on (uma-work's frozen plan, F22 decision 1), so a long
   explore can bring up the grade above's goods a floor late. **A named floor** digs that floor every day; if it's the
   frontier its days count toward its stairs until it's reached. The plan: each day's count by CS17 with her rank,
   talent, tool and well-fed days at the start; each item's grade 70/20/10 around the floor's main, clamped to G1–G10
   (the share past an end goes to the main); the Quarry's item stone or gem 70/30; stars by CS26; draws
   `draw(uid, startDay + k, '<place>:<slot>:<n>', …)`, as F22's.
4. **The night:** step 4's `countHauls` gains digs: for each Uma who dug tonight, the challenge event `{ kind: 'dig',
   floor, items }` (her floor tonight; "40 ores or stones" counts every item dug, gems too), then **`digStairs`** (the
   frontier's days, one floor a night a place), with `notes.floors` for the morning and the depth milestones at step 8.
   A job queued to start tonight reads the new deepest, since the settle is stored at step 7 (F18 decision 3).
   `farm.counts['home:mine']` and `['home:quarry']` rise by the items collected (F22's pattern).
5. **The stations:** `STATIONS` gains the Smelter and the Cutter; **Smelting** takes the ores, **Cutting** the stones
   and crystals, each 1 day on F22's station rules (decision 2: items at one good and star, its rate, the job sheet's
   sizes). `buildStation`: the Smelter for 3,000g once chapter 3 has opened; the Cutter for 4,000g with its plans
   (`buildings.cutter = 0`, chapter 3's reward). **The Cutter's lock follows CS18,** chapter 3's reward: `places.ts`
   changes its `opens` from the built "Chapter 3" to `{ by: 'reward', chapter: 3 }` (the map then says "Chapter 3's
   reward", as the Mill says "Chapter 1's").
6. **Depth milestones are the Mine's only,** as CS38 lists them: floors 10, 20 and 30 pay 500g each; the Quarry's
   floors pay none.
7. **The morning (CS5):** Work done gains `{ kind: 'floor', place, floor }` ("Mine · floor 6 reached", opening the
   Mine), after the jobs; the milestone shows in New today as ever ("Mine floor 10 · +500g"). Strictly parsed: a place
   other than the Mine or the Quarry, a floor outside 1–30 and a place twice are refused.
8. **The screens:** the Mine's and the Quarry's quick looks and pages are F22's `WorkPlace`, with the place's line
   "Deepest · floor 3 · stairs 1 of 1" and a What step of floors: **Explore down · floor 4 · 1 day to the stairs**
   first (when her rank allows deeper), then each floor she can dig with its grades and "About 4 a day", deeper ones
   greyed ("From Hand"). The Smelter's and the Cutter's quick looks offer **Build** as F22's stations do.
   `PLACE_SCREENS` gains all four; the map's pips, Ready badges and Collect all follow F22's.
9. **Chapter 3** (`CHAPTERS[2]`): (1) **Reach Mine floor 5 and Quarry floor 5** (one goal: the lower of the two
   deepest, need 5; the card shows both, "Mine 5 · Quarry 3"); (2) **Build the Smelter**; (3) **Dig 30 ores**
   (`home:mine` since the chapter); (4) **Reach Farm Rank 3**. No opening gifts: the places open with the chapter.
   Reward: 1,500g, the Cutter's plans, a recruit, 250 points. **Chapter 4's line** ("Something Cooking", Rosa Bell) says
   **Soon** until F8.
10. **The scenes** (`story/chapter-3.ts`), original and short, Umas in roles (*your best miner*, the highest mining
    rank, then talent):
    - **Opening:** Gus Talbot at the boarded-up Mine; he pries off the boards and lights his lamp; floor by floor, "the
      stairs don't find themselves: dig the deepest floor and you'll find the way down"; the Quarry next door gives
      stone and the odd gem; where a smelter could stand; the goals card.
    - **Closing:** Gus on floor 5, pleased; he unrolls the Cutter's plans for the Quarry; **your newest hand** at the
      Gate; a smell of baking drifts up from town (Rosa Bell, chapter 4 "Soon"). The story item, **Gus's lamp** (F29's
      `story-miners-lamp`), shows beside the reward.
11. **Stand-ins until F29:** Gus's bust a lettered disc; the lamp a plain mark. Everything else is uma-art's.

### Rules that hold (every M5 packet)

- **No original-game content in git:** no outfit or character names in code, tests, docs, commits or pull request
  bodies; names, titles and art come from master data at runtime only; tests use `@luismlorenzana/uma-data/testing`
  fixtures or invented ids. Scenes speak with the original cast (CS41) and name Umas only as runtime roles. Run
  `git status` and the private-content guard before committing.
- **Main JS ≤ 180 KB gzip** (164.0 KB live after F24): new screens, tables, scenes and rules load lazily
  (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **Every save change is a new version** (v4 or later, F27's pattern) with its migration and tests;
  `account.updatedAt` never moves in a migration; no server writes a save.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a uma-platform request the main session sends,
  pinned when released.
- **Each minigame is an original game in its genre,** never a recreation of a specific title; its rules are pure and
  tested in `@farm/domain` before any scene draws them (FR22).
- **The farm runs on today's map** (uma-kit's Phaser Hub) until M7; M5's scenes are flat; the HD-2D scenes and
  `kit-farm` are M7's.
- **Nights are seeded** (`draw(uid, day, what, n)`): the same save always gives the same morning.
- **The manual (`docs/game/`) changes in the same commit as each rule;** live blocks through `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short, explanations behind
  a help button.
- **Art:** the first packet built after F25's uma-art release pins it and drops F24's stand-ins; the first after F29's
  pins that; stand-ins until then.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.
- The copied uma-rpg code stays copied, never imported.

### Left to the worker

The modules' layout (beside `gathering/`, or a `mining/` folder); the What step's drawing; whether `'down'` reads
"Explore down" or "Keep digging" (short, and the help says how the stairs work); the scenes' lines within decision 10's
beats.

## Do

1. **Save v5** (decision 1).
2. **The data:** CS14's floors (grades by floor, the Mine's ores, the Quarry's stones and gems by grade) and the stairs'
   need, in `@farm/domain`.
3. **The dig kind** (decisions 2, 3), registered through `loopKinds(talentOf)`, with its request's parse.
4. **The night** (decision 4): the challenge events, `digStairs`, the notes, the milestones (decision 6), the morning's
   line (decision 7).
5. **The Smelter and the Cutter** (decision 5) and the Cutter's lock.
6. **The screens** (decision 8).
7. **Chapter 3 and its scenes** (decisions 9, 10).
8. **Art:** pin F25's and F29's releases if out (decision 11 otherwise).
9. **The manual:** a new [docs/game/mining.md](../../game/mining.md) with live blocks (floors and their grades, the
   Mine's and the Quarry's goods by grade, the stairs' days, a day's haul by rank, the Smelter's and the Cutter's
   recipes) and its row in [the manual's index](../../game/README.md); [gathering.md](../../game/gathering.md) (the
   stations' table grows), [goals.md](../../game/goals.md) (chapter 3, its scenes, the Mine's milestones),
   [days.md](../../game/days.md) (the map's Cutter, the new line), [ranks.md](../../game/ranks.md) (mining's
   challenges counted), [architecture.md](../../game/architecture.md) (v5).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the size check is ≤ 180 KB gzip (the number in the pull request);
  the private-content guard passes.
- Domain tests:
  - a Novice C miner on floor 1 brings round(4 × 1.0 × 1.05) = **4** items a day; a Hand C at the Quarry round(4 ×
    1.15 × 1.05) = **5**;
  - floor 4's main grade is G2; over a seeded sample, 70/20/10 around it; floors 1 and 30 clamp; the Quarry gives stone
    70% and gems 30% at the floor's grades;
  - **the stairs:** one Uma exploring from the top reaches floor 5 on night 5, floor 10 on night 15, floor 20 on night
    50 and floor 30 on night 105 (ranks set for the test); well fed adds 1.25; two Umas at the frontier reach a floor
    sooner but never two floors in a night;
  - `'down'` follows the frontier through a 4-day job; a Novice stops at floor 5 and can't name floor 6; a Hand can;
  - the same save plans the same haul twice; a queued job starting the night a floor is found reads the new deepest;
  - CS18's worked case: 10 Iron Ore smelted into 10 Iron Ingots (+250g); a gem cut and a stone blocked at their stars;
    the Cutter refused without its plans, the Smelter before chapter 3 or without 3,000g;
  - mining's challenges: 40 items dug ranks her to Hand with her points; digging floor 10 meets Skilled;
  - Mine floor 10 pays 500g once; Quarry floor 10 pays nothing;
  - **v5:** a v4 migrates with `updatedAt` unchanged; a v4 holding a dig job or a floor line is refused; a v5
    round-trips;
  - **chapter 3:** its goals count from the chapter's start; it completes paying 1,500g, the Cutter's plans, a recruit
    and 250 points; chapter 4 says Soon.
- `pnpm docs:update` leaves every live page unchanged.
- Locally at 390×844 (and 375×667): a dev save at chapter 2's end sees its closing scene, then chapter 3's opening;
  send a Novice to explore the Mine a day at a time and see "Mine · floor 1 reached" … to floor 5; the same at the
  Quarry; build the Smelter and smelt a day of ore; chapter 3 completes; build the Cutter and cut a gem. Record the night
  chapter 3 completed (not retuned).
- Production, after the merge's deploy: health shows the commit; once the owner has opened the app, a read-only check:
  `saves/{uid}` is v5, its `account.updatedAt` equals `saveBackups/{uid}-v4`'s, and `saveRescues` holds nothing new. A
  stale or wrong date: stop and ask.

## Deliver

On a branch, `feat/f26-mine-quarry`, and a pull request for the main session to merge and deploy (`feat: the Mine and
the Quarry, chapter 3; save v5 (F26)`; `git status` and the private-content guard first). In the same branch: delete
this packet, add a Done row in [the handoff](../README.md) with the pull request, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–11 and anything settled while
building. The main session merges, watches the deploy (`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`)
and adds the run's link and the production read to the Done row.
