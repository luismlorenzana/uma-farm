# F24 — Farm Rank and chapter 1, then the owner's phone check

**uma-farm · Claude · M · Needs: F18, F19, F20, F21, F22, F23 · Pins: F25's uma-art release, if published · Unblocks:
M5 (F26, F27, F8, F28) · Milestone M4, the loop on today's map**

## Why

M4 ends here. The farm's own rank gives the loop its ladder, chapter 1 gives the first days their goals and their
story, and with both in place the loop is whole. This packet adds them, turns the loop on in production (ending F17's
dark launch), retires the Wilds' screens, and asks the owner to play it on the phone.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS39, CS41, CS42**, **CS38** (the Diary's counts; its screen is M6),
  CS3 (what's open and locked), CS35 (the chapter's recruit), CS43 (chapter 2's line), CS46 (temperament), CS51 (the sim's
  Spring), CS54 (the migration's production run), CS55.
- [core-loop.md](../../design/core-loop.md): **FC21, FC23, FC24**, FC30, and "Notes from drawing the page" #2 and #4.
- [decisions.md](../../decisions.md): D24, D25, D26, D27, D28, and every M4 packet's decision (F17–F23, F25).
- The manual: every M4 page ([days.md](../../game/days.md), [goods.md](../../game/goods.md),
  [fields.md](../../game/fields.md), [ranks.md](../../game/ranks.md), [gathering.md](../../game/gathering.md),
  [roster.md](../../game/roster.md)), and the Wilds' pages it retires ([loops.md](../../game/loops.md),
  [materials.md](../../game/materials.md), [wilds.md](../../game/wilds.md)); [architecture.md](../../game/architecture.md).
- Code: F17's `farm` (`points`, `chapter`, `goals`, `counts`), `diary`, `farmRankOf`, the loop switch
  (`VITE_FARM_LOOP`), the boot's migration; F18's `endDay` step 8 and the summary; F19's `farm.counts['gold-shipped']`
  and `diary.shipped`; F20's `crops` and `farm.counts['plots-harvested']`; F21's ranks and `temperament`; F22's
  `farm.counts['home:*']` and the places' depth; F23's `recruitFor`; `apps/web/src/wilds/`, `places/`, `push/`,
  `shell/`; `scripts/check-size.mjs` (`LAZY_MODULES`); uma-kit's `UmaBust`, `Sheet`, `CurrencyChip`.
- [infrastructure.md](../../technical/infrastructure.md) for the production read in step 9.

## Decisions made

### From the spec

- **The Farm's Rank (CS39, FC23):** points are **1 per 100g shipped** (requests and the Restaurant count, later),
  **5 a Diary entry**, **25 a milestone**, **250 a chapter**, **150 / 75 / 25** for a festival's 1st / 2nd / 3rd (M6),
  and **1 per 100g of decorations** (M6). A chapter opens what's new; the Farm Rank opens more of what's open; upgrades
  are bought within it (D24 #4).

  | Rank | Points | Opens (in M4 where it can) |
  |---|---|---|
  | 1 | 0 | Block A; Dorm 2; tier-1 seeds (the Old Fort Ruins, M5) |
  | 2 | 150 | Block B (800g); Dorm 3; tier-2 seeds (Echo Cave, M5) |
  | 3 | 500 | Dorm 4; the Sawmill and the Smokehouse (CS18); the Barn after chapter 2 (M5) |
  | 4 | 1,200 | Block C (3,000g); Dorm 5; tier-3 seeds (Coop 2, Kitchen 2, Hilltop Track, a board of 4: later) |
  | 5 | 2,400 | Dorm 6 (Barn 2, Kitchen 3, alpacas, Misty Marsh, 2 parties: later) |
  | 6 | 4,000 | Block D (8,000g); Dorm 7 (Kitchen 4, Restaurant 2, the Sunken Temple: later) |
  | 7 | 6,500 | Dorm 8 (Coop 3, Barn 3, Restaurant 3, Forge 2, a board of 5: later) |
  | 8 | 10,000 | Dorm 9 (Kitchen 5, Restaurant 4, Forge 3, Ember Peak: later) |
  | 9 | 15,000 | Dorm 10 (Barn 4, Restaurant 5, 3 parties: later) |
  | 10 | 22,000 | The farm's gold crest (the Sky Ruins: later) |
- **The Diary's counts (CS38):** each of the catalogue's goods shipped once is an entry (5 points); completing a
  family's ten grades pays **500g** (and a decoration, M6). **Milestones,** 25 points each and their gold:

  | Milestone | Steps and gold |
  |---|---|
  | Shipped at the bin, in gold | 10,000 (300g) · 50,000 (1,000g) · 100,000 (2,000g) · 250,000 (4,000g) · 500,000 (8,000g) · 1,000,000 (15,000g) |
  | Umas recruited | 5 (300g) · 10 (1,000g) · 20 (2,500g) · 40 (6,000g) · 60 (10,000g) · 100 and 272 (a decoration, M6) |
  | First rank reached | Hand 300g · Skilled 600g · Expert 900g · Master 1,200g · Legend 1,500g |
  | Depth | every fishing spot; every forest area (500g each); Mine floors (M5) |
  | Care and craft | a crop at level 5 and 10 (500g each); an animal at 10 hearts and a Masterwork (later) |
  | Story | each chapter (its reward) |

  Festivals won (M6) and records (F22 keeps the sizes) wait for the Diary's screen.
- **The town's cast is original (CS41, FC24):** their names and lines live in git; Umas appear only in roles filled at
  runtime. M4's three: **Mayor Hollis Pryor** (runs the town; opens each chapter), **Marta Quill** (keeps the general
  store, the shop), **Old Ben Carver** (kept the farm before you; gives the first seeds). The rivals **Wren Ashby** and
  **Cole Varga** are named at the Flower Show (M6). Umas' roles: *your first hands* (the three picks), *your newest
  hand*, *your best <activity>*, *the Uma you're closest to*.
- **Chapter 1, "A Field Again" (CS42),** opens on day 1:

  | # | Goal | Teaches |
  |---|---|---|
  | 1 | Plant and harvest 9 crops | Planting, tending, Ready plots |
  | 2 | Ship 1,000g at the bin | The bin, the overnight payout |
  | 3 | Bring home 10 things from the Woods or the Pond | Assigning, the job sheet, collecting |
  | 4 | Grow a second kind of crop | The shop |
  | 5 | Rank an Uma up to Hand | Ranks and challenges |
  | 6 | Reach Farm Rank 2 | The Farm's Rank, Block B |

  **Reward:** 500g, the Mill's plans (build it for 1,200g), a recruit, 250 FR points, and chapter 2. The sim finishes it
  on **day 8** (days 7–9 across 30 runs).
- **The opening scene, "The Overgrown Farm"** (day 1, before the first tap): (1) the farm gate at morning, weeds to the
  fence; Mayor Hollis Pryor welcomes the trainer: the farm has stood empty since Old Ben retired, and the town hopes
  the Umas who spend their off-season here can bring it back; (2) Old Ben Carver walks the one block he kept tilled,
  hands over a pouch of 9 Carrot seeds, and shows how a tended row grows faster ("tap a plot, then pick who tends it");
  (3) your first hands come in through the Gate, one at a time, each with a hello line from her temperament's
  templates, her name from master data; (4) Marta Quill calls from the town edge that the shop is open; the shipping bin
  is pointed out ("anything you put in pays tonight"); (5) the chapter card shows the six goals. The first tap is
  planting.
- **The closing scene, "First Shipment"** (the morning after the goals are met): (1) the morning summary's total is the
  farm's best yet; the Mayor and Marta stop by the bin; (2) Old Ben unrolls the Mill's plans and says where the Fields
  could use one; (3) a visitor walks in at the Gate and asks to stay: your newest hand (the chapter's recruit); (4) a
  wagon is heard on the road: Dale Hart will bring two chickens tomorrow. Chapter 2 opens.
- **In M4, the festival ground, the requests board and the Diary's screen show "Soon"** (CS3); the Diary tab holds the
  chapter's goals until M6 (CS55). Chapters 2–5 come with M5 (D24 #2).
- **The phone check** ends M4 (CS55).

### Decided here (the spec left these open)

1. **The Farm Rank is recomputed at step 8** from the save: ⌊`farm.counts['gold-shipped']` ÷ 100⌋ + 5 × entries + 25 ×
   milestones + 250 × chapters done (+ festivals and decorations later), stored in `farm.points`. F17's
   `farmRankOf` reads it; F20, F22 and F23 already gate on it.
2. **Milestones are checked at step 8,** paid that night (their gold with the bin's), and listed in the summary's "new
   today". **Depth counts each area and spot past the first:** the Hills, the River and so on are milestones, the Woods
   and the Pond aren't (they're open on day 1, and the sim's day 1 ends at 530g, so it paid none). "Umas recruited"
   counts the roster, the starters included.
3. **A family's ten grades** is one row: a family's ten raw goods, or its ten refined ones, each shipped once. Each row
   pays its 500g once.
4. **Goal progress reads counters:** goal 1 is `farm.counts['plots-harvested']` ≥ 9; goal 2 the bin's gold since the
   chapter opened ≥ 1,000 (chapter 1 opens on day 1, so it's all of it); goal 3 `home:forest` + `home:fishery` ≥ 10;
   goal 4 **planting** a second kind (two entries in `crops`), since the sim meets it by day 8 and a planted Potato
   isn't Ready by then; goal 5 any Uma at Hand or above in any activity; goal 6 Farm Rank 2. `farm.goals` keeps each
   goal's counter at the chapter's start, so later chapters count from their own start.
5. **The chapter completes at step 8** of the night its last goal is met: its reward is paid then (500g, `buildings.mill
   = 0`, the recruit from F23's `recruitFor(save, release, talentOf)` joined with `joinRoster(save, outfitId)`, home or
   away, which the morning's news names by itself, the chapter's 250 points), the closing scene plays the next morning after the
   summary, and `farm.chapter` becomes 2. Chapter 2's card says "Soon" until M5.
6. **The scene player** is a full-screen sheet: a bust (a cast member's from F25, or an Uma's from master data through
   uma-kit's `UmaBust`), the speaker's name, one line, tap to go on, and **Skip**. Scenes are data in `@farm/domain`
   (`story/chapter-1.ts`) with role placeholders, never Uma names. Each plays once: its id goes in `diary.read`
   (`scene:1:open`, `scene:1:close`). The order on a new farm is the start's picks (F23's `StartPicks`, shown by the
   shell while `picksLeft(save) > 0`), then the opening scene, then day 1.
   A migrated save, already on day 1 with its Umas, sees the opening scene once too.
7. **The hello lines** for the opening scene: one per temperament (F21's breezy, steady, bold, gritty, clever),
   original and short, with `{name}` filled at runtime.
8. **The account bar gets the Farm Rank:** a chip with the crest (`farm/rank`, F25; a plain "FR" until then) and the
   rank; it opens a sheet with the points, the next threshold and what the next rank opens. A rank-up is a "new today"
   line naming what it opens. The kit's tier crest stops at 3, so the rank isn't drawn there.
9. **The loop goes live here.** This packet deletes `VITE_FARM_LOOP` and the Wilds' screens (`wilds/`, the v2 place
   pages, the push client's schedule and switch), keeping the domain's v2 code the migration needs (`parseV2`,
   v2's work settle and collect) and `docs/technical/wilds-copy.md` updated to what's still used. `pnpm build`'s second
   size check goes with the switch. The owner's save migrates the first time the new app opens on the phone. The
   push server code and the paused tick stay as they are.
10. **The manual after the switch:** [loops.md](../../game/loops.md), [materials.md](../../game/materials.md) and
    [wilds.md](../../game/wilds.md) are retired (deleted, their history in git; their live blocks and test go with
    them); a new [docs/game/goals.md](../../game/goals.md) holds the Farm Rank, the Diary's counts, the milestones,
    chapter 1, the scenes and the cast; every M4 page drops its "live from F24" line; the README's index and
    [architecture.md](../../game/architecture.md) (pages, routes, the save as live, notifications off) say what plays
    now.
11. **F25's art:** if its uma-art release is out, this packet pins it (the Dorm, the bin, the seed badge, the marks, the
    three busts) and drops the fallbacks. If not, it ships on the fallbacks (borrowed buildings, plain marks, a
    lettered disc for each cast member), the phone check goes ahead, and the first packet after the release pins it.
12. **If chapter 1 runs long:** the sim's day 8 counts the requests board's premium (CS51's note), which M4 doesn't have.
    A local play of days 1–12 records the day chapter 1 completes; past day 10, the D-decision says so, and nothing is
    retuned without the owner.

### Rules that hold (every M4 packet)

- No original-game content in git: names, titles and art come from master data at runtime only; tests use
  `@luismlorenzana/uma-data/testing` fixtures or invented ids. Run `git status` and the private-content guard before
  committing.
- Main JS ≤ 180 KB gzip.
- The farm runs on today's map, uma-kit's Phaser Hub, until M7.
- Portrait 390×844 first (check 375×667), 44 pt targets, safe areas.
- Player-facing text is short; explanations go behind a help button.
- `uma-work` and `uma-kit/work` aren't forked: anything they lack is a uma-platform request, pinned when released.
- Every save change is a new version with its migration and tests, and `account.updatedAt` never moves in a migration.
  From this packet on, v3 is live: any change is v4.
- The copied uma-rpg code stays copied, never imported.
- The manual (`docs/game/`) changes in the same commit as each rule.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

### Left to the worker

The scene lines' wording within CS42's beats (original, short); the rank sheet's drawing; the chapter card's drawing in
the Diary tab.

## Do

1. **The Farm Rank** (decisions 1, 8): points at step 8, the chip and its sheet, rank-ups in the summary.
2. **The Diary's counts and milestones** (CS38, decisions 2, 3) at step 8, with their gold and points.
3. **Chapter 1** (CS42, decisions 4, 5): the goals and their progress, the reward, chapter 2's "Soon"; the Diary tab's
   chapter card.
4. **The scenes** (decisions 6, 7): the player, the opening and closing scenes, the cast's lines, the hello lines.
5. **F25's pin** (decision 11).
6. **Go live** (decision 9) and **the manual** (decision 10).
7. **A local play of days 1–12** (decision 12), noting the day chapter 1 completes and the gold on days 4, 8 and 12
   beside CS51's (2,520, 3,979, 2,871).
8. Deploy and watch the run.
9. **The owner's phone check:** ask in one line, with the link (below). After the owner has opened the app, read (never
   write) the production save with the scoped gcloud: `saves/{uid}` in the `farm` database is v3, its
   `account.updatedAt` equals the one in `saveBackups/{uid}-v2`, and `saveRescues` has nothing new. If the stored date
   looks stale or wrong, stop and ask.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the size check is ≤ 180 KB gzip; the private-content guard passes.
- Domain tests:
  - the Farm Rank's thresholds at every edge; points from shipping, entries, milestones and a chapter;
  - each milestone pays once; the Hills pay one, the Woods none; a family row pays 500g once;
  - chapter 1's six goals count from their counters; the chapter completes the night the last is met, paying 500g, the
    Mill's plans, a recruit and 250 points, and the closing scene waits for the morning;
  - each scene plays once; no scene text holds an Uma's name.
- `pnpm docs:update` leaves every live page unchanged; `rg -l "VITE_FARM_LOOP|WildsScreen" apps packages` finds
  nothing.
- Locally at 390×844 and 375×667: a new account picks three, sees the opening scene, plants the carrots, sends one Uma to
  the Woods and one to the Pond, ends the days, and finishes chapter 1 (the closing scene, the Mill's plans, the
  recruit); a local v2 save migrates and sees the opening scene once.
- Production: the deploy passes and health shows the commit; the owner's phone check passes (the owner's word, in the
  D-decision); the production save read in step 9 holds.

**The phone check, in one line:** "M4 is live: open https://uma-farm.web.app on your phone, pick your three, plant the
carrots, send one Uma to the Woods and one to the Pond, end the day, and read the morning."

## Deliver

Commit to `main` (`feat: Farm Rank and chapter 1; the loop goes live (F24)`, `git status` first), push, and watch the
run (`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a
Done row in [the handoff](../README.md) with the run's link and the phone check's result, update the handoff's status
line and the owner's steps (M4's phone check), and log the packet's D-decision in [decisions.md](../../decisions.md)
(fetch `main` first for the number), naming decisions 1–12 and the day chapter 1 completed.
