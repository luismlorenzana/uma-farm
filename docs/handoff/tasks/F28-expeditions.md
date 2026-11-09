# F28 — Expeditions: regions, parties, power, results, loot and the log; chapter 5 (save v7)

**uma-farm · Claude · L · Needs: F8 (dishes as supplies; v7 follows v6), F39 (chapter 5 opens when chapter 4
completes) · Pins: F25's and F29's uma-art releases if shipped and not yet pinned · Unblocks: M6 (F37's chapters 6–8
follow chapter 5) · Milestone M5, more to do (its last packet, with M5's phone check)**

## Why

Expeditions are the farm's combat with no real-time play (FC12): a party of three or four Umas goes to a region for two
to five days, and their numbers decide how it went. They bring home what nothing else does: hides, bones and essences
(the Forge's in M6), rare seeds, ducks and cashmere goats, and now and then a visitor met on the road. A log, written
from templates with the party's names filled in at runtime, tells the trip. Chapter 5 opens the expedition post (Juno
Park), and with it M5 is whole.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS48, CS49, CS50**, **CS43** (chapter 5), CS3 (the post with chapter
  5), CS9 (hides ×1.5, bones ×1.6, essences ×1.8), CS11 (the rare crops), CS13 (ducks and cashmere goats), CS22 (well
  fed), CS27 (expeditions read the mean of her best three), CS28 (expedition power by talent), CS29 (10 a day, +10 or
  +20), CS30 (expeditions' challenges), CS31 (expedition power by rank), CS35 (a visitor from a first Great), CS39
  (regions and parties by Farm Rank), CS44 (duo moves, M6), CS46 (logs share the templates' shape), CS41 (Juno Park),
  CS53 (`expeditions`), CS55.
- [core-loop.md](../../design/core-loop.md): FC6 (expeditions 2–5 days), FC12, FC25 (duo moves), FC33.
- [decisions.md](../../decisions.md): D24, D25, D29, D35 (d: `rankPoints`; f: `countChallenge`'s `expedition`;
  `expeditionTalent`), D37 (the Gate), D38, F27's decisions 1 and 12, F8's dishes, F39's Gate list.
- The manual: [ranks.md](../../game/ranks.md), [roster.md](../../game/roster.md), [goals.md](../../game/goals.md),
  [days.md](../../game/days.md), [kitchen.md](../../game/kitchen.md), [ranch.md](../../game/ranch.md),
  [fields.md](../../game/fields.md) (the rare crops).
- Code: `save/v3.ts` (`Expedition`, `REGION_IDS`), `save/parse-v3.ts` (`parseExpeditions`), `farm/talents.ts`
  (`expeditionScore`, `expeditionTalent`, `talentPower`), `farm/rank-rules.ts` (`RANK_BENEFITS`' expedition power,
  `countChallenge`, `rankPoints`), `fields/fields.ts` (`isBusy`), `night/end-day.ts` (step 4, `NightNotes`, step 6),
  `night/nudge.ts`, `night/summary.ts`, `farm/visitors.ts`, F27's ranch (room for a duck), `goods/ids.ts` (the 30 loot
  goods), `story/`; on the web `loop/farm-map.ts`, the pickers (`umaRows`, uma-kit's `UmaPicker`).

## Decisions made

### From the spec

- **The regions (CS48):**

  | Region | Level | Days | Opens at | Needs (power) | Grades | Special finds |
  |---|---|---|---|---|---|---|
  | Old Fort Ruins | 1 | 2 | FR1 | 48 | G1–G2 | Golden Carrot seeds |
  | Echo Cave | 5 | 3 | FR2 | 80 | G2–G3 | Sunwheat seeds; chapter 5's story item |
  | Hilltop Track | 10 | 3 | FR4 | 120 | G3–G4 | Moonrice seeds; an old Cup ribbon (chapter 8, M6) |
  | Misty Marsh | 15 | 4 | FR5 | 160 | G4–G5 | Ducks; Wild Rice seeds |
  | Sunken Temple | 20 | 4 | FR6 | 200 | G5–G6 | Mandrake seeds |
  | Ember Peak | 30 | 5 | FR8 | 280 | G7–G8 | Cashmere Goats |
  | Sky Ruins | 40 | 5 | FR10 | 360 | G9–G10 | Decorations (M6); Wyvern Scales for Mythril tools |

- **Parties (CS48):** 3 or 4 Umas; one party out at a time to FR4, two from FR5, three from FR9.
- **Power (CS49):** her power = **10 × (her expedition rank + 1) + 2 × her expedition talent step** (a Novice C 18, a
  Skilled A 42, an Expert S 54, a Legend S 74). The party's = the sum × **(1 + supplies + duo moves) × 1.1 if all are
  well fed**. Supplies: each dish packed (up to 4) adds **4% + 1% a star above ★1**; duo moves +10% a 5-heart pair, two
  at most (bonds are M6's, so 0 now).
- **The result (CS49):** `ratio = power ÷ the region's need × v`, *v* a seeded draw in 0.9–1.1: **≥ 1.4 Great** (loot
  ×1.5, a special-find roll, a new region's visitor, +20 rank points each); **≥ 1.0 Success** (×1, +10 each); **≥ 0.75
  Partial** (×0.5); **< 0.75 Failure** (×0.2, at least 1 item; home after 1 day; supplies come back; nothing is lost).
  Worked: 3 Novice C (54) at the Old Fort (48): 1.12, a Success; 4 Hand B (120) with 2 dishes at ★2 (×1.10) at Echo
  Cave (80): 1.65, a Great; 4 Skilled A with 4 ★3 dishes and a duo pair (225) at the Sunken Temple (200): 1.13.
- **Loot (CS50):** **3 rolls an Uma a day away**, × the grade's factor; each roll draws **hides and scales 40%, bones
  and horns 30%, essences 30%** at the region's two grades (65/35); a **special find has a 10% chance a day**. About 55g
  a roll at the Old Fort, 153g at the Sunken Temple, 413g at the Sky Ruins.
- **The log (CS50, CS46):** 3–6 lines a day from templates (setting out, a find, a fight won or lost, camp, the way
  home), the party's names filled in at runtime; it shows in the morning summary and stays in the Diary.
- **Rank points (CS29):** 10 a day, +10 on a Success, +20 on a Great; expeditions are nobody's favourite.
- **Expeditions' challenges (CS30):** Hand, return from 2; Skilled, a Success at level 10+; Expert, a Success at level
  20+; Master, a Great at level 20+; Legend, a Success at the Sky Ruins.
- **Visitors (CS35):** a Great at a region for the first time brings a visitor met on the road, to the Gate, joining by
  affinity.
- **Chapter 5, "Beyond the Hills" (CS43):** opens the expedition post (Juno Park); goals: return from 2 expeditions, a
  Success at Echo Cave, bring home rare seeds, reach FR5; the reward is a recruit, **2,500g** and 250 Farm Rank points;
  the sim finishes it on day 41.
- **The cast (CS41):** Juno Park, who runs the expedition post.
- **Art (CS19):** the expedition post is F29's; it stands on `rangers-lodge` until then. The 30 loot goods are uma-art's.

### Decided here (the spec left these open)

1. **Save v7:** an expedition gains `result` ('great' | 'success' | 'partial' | 'failure') and `power` (whole), both
   set when it leaves (decision 3); `supplies` become stock keys `<dish>@<stars>` (dishes only, 0–4); a party is 3 or 4
   Umas; `diary.trips: { region, left, back, result, power, party }[]` (up to 1,000), the record a log is rebuilt from
   (decision 8); the summary's `{ kind: 'expedition', region, result, items, finds }`. `migrateToV7` sets the version
   and `diary.trips` to `[]`, and refuses an expedition (no earlier version sent one). F27's pattern holds.
2. **Expeditions aren't uma-work jobs** (a party isn't a slot): `save.expeditions` holds the parties out, and the post
   is a place with no slots. While away, a member is busy (`isBusy`: no job, block, pen, assisting or swap), has work
   for the nudge, and keeps her bed. An Uma leaving or arriving tomorrow can't go. A party can't be called back.
3. **The result is decided when the party leaves:** power from the members' expedition ranks and talents
   (`expeditionTalent`, F21) as they stand, the supplies, and ×1.1 if every member is well fed then (duo moves 0 until
   M6); *v* = 0.9 + 0.2 × `draw(uid, left, 'expedition:<region>', 0)`. `back` is the day it left + the region's days,
   or + 1 on a Failure. The supplies leave the Warehouse at the start; a Failure gives them back when it's home. **Well
   fed's quarter day doesn't shorten a trip:** CS22 lists expeditions among "longer work", but CS49 gives well fed its
   own effect on a trip (×1.1 power) and the days are the region's; CS49 is followed.
4. **Home-coming is at night step 4** (CS7: "expeditions advance and return"), the night `back` comes, before step 6:
   - **Loot:** max(1, round(3 × the party's size × the days away × the result's factor)) rolls, each one good drawn
     `draw(uid, back, 'loot:<region>:<n>', …)`: the family 40/30/30, the grade 65/35 of the region's two; its stars from
     Q = 0.5 × the party's mean expedition rank (rounded down) + that mean talent's points (CS26's gathering terms).
     Into the Warehouse, the party unpacking (no collect step).
   - **Special finds:** a 10% roll for each day away (none on a Failure), plus one more on a Great (CS50's and CS49's
     together): the region's find. Rare seeds are **3 seeds** of its crop (Golden Carrot, Sunwheat, Moonrice, Wild Rice,
     Mandrake; `seed-<crop>`); **a duck** joins the Coop if it has room, else the roll gives Wild Rice seeds; **a
     cashmere goat** joins the Barn if it has room, else nothing; the Sky Ruins give **2 Wyvern Scales** (decorations
     are M6's); the Hilltop's Cup ribbon waits for chapter 8 (M6), so it rolls Moonrice seeds. At most one animal a
     trip. **Chapter 5's story item** (F29's `story-old-map`, an old map) comes with the first Success or better at
     Echo Cave, not by a roll.
   - **Points and challenges:** each member earns 10 a day away + 10 on a Success or +20 on a Great, × her talent,
     well fed (as of tonight) and hearts (`rankPoints`, D35 d), paid at step 6 from `notes.expeditions`; each counts
     `{ kind: 'expedition', result, level, region }`.
   - **A first Great at a region** brings a visitor to the Gate (`from: 'expedition'`), beside any waiting (F39's
     list), and the morning's "… is at the Gate".
   - **Counters:** `farm.counts['expeditions:home']`, `['expeditions:<region>:<result>']`, `['rare-seeds']`.
5. **Sending a party** (the post's page): the region (open ones by Farm Rank; the rest greyed "From Farm Rank 4"); the
   party, three or four seats, each picked from the Umas on the farm who are free, sorted by expedition rank, then
   talent ("Hand · B · 30 power"); supplies, 0–4 dishes by star; the power against the need and the odds in words from
   the ratio's range at *v* 0.9–1.1 ("A Great either way", "Likely a Success", "Could fail"); **Send · home in 3
   days**. Refusals: "Two parties are out. A third from Farm Rank 9.", "A party is 3 or 4."
6. **The morning (CS5):** Work done gains `{ kind: 'expedition', region, result, items, finds }` ("Echo Cave · Great ·
   41 items · Sunwheat seeds", opening its log); finds are ids (a seed, an animal kind, a good, the story item).
   Strictly parsed: an unknown region, result or find, items outside 1–500 and a region twice are refused.
7. **The screens:** the post's quick look (`/?peek=expeditions`): the parties out (region, "Home tomorrow", their faces
   as pips ringed by the days gone), **Send a party**, the last trip; `/expeditions`: the seven regions (level, days,
   need, grades, finds; open, or its Farm Rank), Send's sheet, and the past trips, newest first, each opening its log.
   `PLACE_SCREENS` gains the post; the page, the rules and the log's templates load on demand.
8. **The log** (`expeditions/log.ts`): templates by beat (set out, a find, a fight won, a fight lost, camp, home) and by
   result, 3–6 lines a day, with `{a}`, `{b}`, `{party}`, `{region}` and `{item}` filled at runtime from master data and
   the trip's loot; picked by `draw(uid, left, 'log:<region>:<day>', n)`; about 40 original templates (4–6 a beat), the
   full authoring being M6's with the conversations (CS46). A log is rebuilt from its `diary.trips` record, so the same
   save always reads the same log; the Diary's own screen is M6's (F31), and until then the post's page shows them.
9. **Chapter 5** (`CHAPTERS[4]`): (1) **Return from 2 expeditions** (since the chapter); (2) **A Success at Echo
   Cave** (a Success or a Great, since the chapter); (3) **Bring home rare seeds** (`rare-seeds` since the chapter);
   (4) **Reach Farm Rank 5**. No opening gifts: the post opens with the chapter. Reward: 2,500g, a recruit, 250 points.
   **Chapter 6's line** ("Open for Business", Rosa Bell) says **Soon** until M6 (F37).
10. **The scenes** (`story/chapter-5.ts`), original and short, Umas in roles (*your best explorer*, the highest
    expedition rank, then talent; *your first hands* for the first party's send-off):
    - **Opening:** Juno Park opens the post at the town edge; a map of seven regions, a few open for now; parties of
      three or four; dishes as supplies; "nobody gets left behind: a hard trip comes home early with nothing lost";
      the goals card.
    - **Closing:** the old map from Echo Cave on Juno's table, its far regions marked; **your newest hand** at the
      Gate; Rosa Bell talks of opening a restaurant in town (chapter 6 "Soon"). The old map shows beside the reward.
11. **Stand-ins until F29:** the post on `rangers-lodge`; Juno's bust a lettered disc; the old map a plain mark.
12. **M5's phone check** (the owner's step): after the deploy, ask in one line: "M5 is live: open uma-farm.web.app on
    your phone (tap Restart if it offers the update) and play on; each chapter opens the next place (the Coop, the
    Mine, the Kitchen, the post). Tell me how it feels." The owner's word goes in the D-decision.

### Rules that hold (every M5 packet)

- **No original-game content in git:** no outfit or character names in code, tests, docs, commits or pull request
  bodies; names, titles and art come from master data at runtime only; tests use `@luismlorenzana/uma-data/testing`
  fixtures or invented ids. Scenes and logs speak with the original cast (CS41) and name Umas only as runtime roles and
  placeholders. Run `git status` and the private-content guard before committing.
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

The modules' layout (an `expeditions/` folder); the post's and the send sheet's drawing; the odds' exact words; the
log's templates and the scenes' lines, within decisions 8 and 10.

## Do

1. **Save v7** (decision 1).
2. **The data:** CS48's regions, the loot tables by grade, the finds, in `@farm/domain`.
3. **The rules:** sending (decisions 2, 3, 5), home-coming at step 4 (decision 4), points and challenges at step 6,
   `isBusy`, the nudge, the morning's line (decision 6), the log (decision 8).
4. **The screens** (decision 7).
5. **Chapter 5 and its scenes** (decisions 9, 10).
6. **Art:** pin F25's and F29's releases if out (decision 11 otherwise).
7. **The manual:** a new [docs/game/expeditions.md](../../game/expeditions.md) with live blocks (the regions, power by
   rank and talent, supplies, the results' bands and what each gives, loot by region, the finds, the log's beats) and
   its row in [the manual's index](../../game/README.md); [ranks.md](../../game/ranks.md) (expeditions' challenges and
   points counted), [roster.md](../../game/roster.md) (a visitor from the road; "Festivals, requests, expeditions"
   filled), [goals.md](../../game/goals.md) (chapter 5, its scenes; M5's chapters done),
   [days.md](../../game/days.md) (step 4's home-coming, the new line), [kitchen.md](../../game/kitchen.md) (dishes as
   supplies), [ranch.md](../../game/ranch.md) (ducks and cashmere goats found), [architecture.md](../../game/architecture.md)
   (v7).
8. **M5's phone check** (decision 12), after the deploy.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the size check is ≤ 180 KB gzip (the number in the pull request);
  the private-content guard passes.
- Domain tests:
  - **power:** a Novice C 18, a Skilled A 42, an Expert S 54, a Legend S 74; CS49's three worked parties at *v* = 1
    (1.12 Success, 1.65 Great, 1.13 Success; the third with a duo pair set for the test); supplies 4% + 1% a star; ×1.1
    only when all are well fed;
  - **results:** each band's edges; a Failure comes home after 1 day with its supplies back and at least 1 item;
  - **loot:** the rolls' count by size, days and result; over a seeded sample, 40/30/30 and 65/35 at the region's
    grades; the Old Fort's mean worth near 55g a roll;
  - **finds:** about 10% a day and one more on a Great; 3 seeds; a duck only with room in the Coop, else Wild Rice
    seeds; one animal a trip at most; the old map once, on the first Success or better at Echo Cave;
  - **points and challenges:** 10 a day plus the bonus; "return from 2" ranks a member to Hand with her points; a
    Success at a level-10 region meets Skilled;
  - **the limits:** one party to FR4, two at FR5; 3 or 4 a party; a member can't take a job, tend, care, assist or
    swap; a first Great brings a Gate visitor beside one already waiting;
  - **replay:** the same save gives the same result, loot, finds and log;
  - **v7:** a v6 migrates with `updatedAt` unchanged; a v6 holding a trip is refused; a v7 round-trips;
  - **chapter 5:** its goals count from the chapter's start; it completes paying 2,500g, a recruit and 250 points;
    chapter 6 says Soon.
- `pnpm docs:update` leaves every live page unchanged.
- Locally at 390×844 (and 375×667): a dev save at chapter 4's end sees its closing scene, then chapter 5's opening;
  send three Umas to the Old Fort with two dishes; after two nights the morning's line and its log; on a dev save with
  ranks set, a Great at Echo Cave brings a visitor, Sunwheat seeds and the old map; plant the seeds; chapter 5
  completes. Record the night chapter 5 completed (not retuned).
- Production, after the merge's deploy: health shows the commit; once the owner has opened the app, a read-only check:
  `saves/{uid}` is v7, its `account.updatedAt` equals `saveBackups/{uid}-v6`'s, and `saveRescues` holds nothing new (a
  stale or wrong date: stop and ask); M5's phone check (decision 12).

## Deliver

On a branch, `feat/f28-expeditions`, and a pull request for the main session to merge and deploy (`feat: expeditions
and chapter 5; save v7 (F28)`; `git status` and the private-content guard first). In the same branch: delete this
packet, add a Done row in [the handoff](../README.md) with the pull request, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–12. The main session merges,
watches the deploy (`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`), asks for M5's phone check, and adds
the run's link, the production read and the owner's word to the Done row and the handoff's status.
