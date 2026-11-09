# F21 — Talents and ranks

**uma-farm · Claude · M · Needs: F17 · Beside: F18, F19 · Unblocks: F22, F23 · Milestone M4, the loop on today's map**

## Why

The roster is a crew of specialists (FC17, FC18): each Uma has a talent in each activity, read from her own stats by one
rule, and climbs six ranks in each by working and meeting a challenge. Ranks are how the farm goes deeper and better,
and talents are why one Uma suits the Fields and another the Pond. This packet builds both, the favourite line, and
shows them on the album's cards.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS26** (the rank and talent terms of quality), **CS27, CS28, CS29,
  CS30, CS31, CS32, CS33**; CS45 (affinity's +5% and +10% rank points), CS46 (temperament), CS7 (step 6), CS53
  (`RosterUma.ranks`), CS55.
- [core-loop.md](../../design/core-loop.md): **FC17, FC18, FC19**, and "Notes from drawing the page" #8, #9, #10.
- [decisions.md](../../decisions.md): D24 (#8 nine ranks, #9 the lines, #10 the stats), D27.
- The manual: [loops.md](../../game/loops.md) (the calling rule as built: "Her trade"), [days.md](../../game/days.md)
  (F18's night).
- Code:
  - F17's `RANKS`, the nine activities, CS32's mapping, `RosterUma`;
  - `packages/domain/src/roster/template.ts`, `roster/roster.ts`, `economy/professions.ts`: the calling rule from her
    best running styles, kept as copied;
  - `apps/web/src/album/rows.ts` (the picker's rows, facets and sorts), `album/testing.ts` (invented outfits),
    `master/master.ts`;
  - uma-data 1.4.0's `Outfit`: `stats.star5` and `growthRatePercents` (speed, stamina, power, guts, wit);
  - uma-kit's album: `UmaPicker` (`renderBadges`, `renderChips`, `describe`, facets, sorts), `FaceTile`.

## Decisions made

### From the spec

- **A talent from her stats (CS27):** for each activity, her **talent score is her 5★ base stat × (100 + her growth
  rate for that stat) ÷ 100**, from master data. Stamina → farming; Guts → the ranch; Power → mining and forging; Wit →
  cooking and fishing; Speed → foraging and serving. Expeditions read **the mean of her three best scores**. Cut-offs,
  the same for everyone:

  | Grade | S | A | B | C | D | E | F | G |
  |---|---|---|---|---|---|---|---|---|
  | A stat's score | ≥ 150 | ≥ 138 | ≥ 126 | ≥ 114 | ≥ 104 | ≥ 96 | ≥ 88 | < 88 |
  | Expeditions (mean of best three) | ≥ 136 | ≥ 132 | ≥ 129 | ≥ 126 | ≥ 124 | ≥ 122 | ≥ 120 | < 120 |

  On the release (CS27's counts), all five stats together fall S 3%, A 9%, B 18%, C 25%, D 23%, E 15%, F 5%, G 3%, and
  every outfit has a C or better somewhere. Talents aren't saved (CS53).
- **What a talent gives (CS28):**

  | Talent | G | F | E | D | C | B | A | S |
  |---|---|---|---|---|---|---|---|---|
  | Step | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
  | Yield (gathering, stations) | ×0.85 | ×0.90 | ×0.95 | ×1.00 | ×1.05 | ×1.10 | ×1.15 | ×1.20 |
  | Quality points | −0.75 | −0.5 | −0.25 | 0 | +0.25 | +0.5 | +0.75 | +1.0 |
  | Rank points | ×0.8 | ×0.85 | ×0.9 | ×1.0 | ×1.1 | ×1.2 | ×1.3 | ×1.5 |
  | Tended growth | — | — | — | — | — | +0.05 | +0.10 | +0.15 |
  | Affection a day (ranch) | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
  | Expedition power | +0 | +2 | +4 | +6 | +8 | +10 | +12 | +14 |
- **Rank points (CS29):** **a day of work pays 10 points** in its activity × her talent's rank-point factor, **×1.2 in
  her favourite line**, ×1.25 well fed (and ×1.05 at 5 affinity hearts, ×1.10 at 10, CS45). A workshop play pays its
  assistant 10; an expedition 10 a day, +10 on a Success, +20 on a Great (their packets). Points go on past a
  threshold; **the rank comes when its challenge is met** (CS30). Ranks at **40, 160, 400, 900, 2,000** points: Hand in
  about 4 days, Skilled in about 2 weeks, Expert late in year 1, Master in year 2, Legend in year 3 or 4. CS29's
  days-to-rank table is a test.
- **The challenges (CS30),** counted from her own work:

  | Activity | Hand | Skilled | Expert | Master | Legend |
  |---|---|---|---|---|---|
  | Farming | Harvest 30 crops she tended | 40 crops of ★3+ she tended | Tend a crop of level 4+ to harvest | 30 crops of ★5 | 1st at a Flower Show with a crop she tended |
  | Ranch | Care for animals 10 days | An animal in her care reaches 4 hearts | 7 hearts | 10 hearts | 1st at an Animal Show |
  | Mining | Dig 40 ores or stones | Dig at floor 10 | Floor 15 | Floor 20 | Floor 25 |
  | Fishing | Catch 30 fish | 10 fish at the River | 10 at the Lake | 10 at the Falls | 1st at a Fishing Derby, on the team |
  | Foraging | Gather 50 items | 20 items in the Hills | 20 in the Old Forest | 20 on the Mountain | 20 in the Misty Vale |
  | Cooking | Assist 5 plays | A Fine play | 10 dishes of ★4+ | A Masterwork | 1st at a Cooking Contest as the cook |
  | Serving | Assist 5 shifts | A Fine shift | Serve 100 guests | A Masterwork shift | Serve 1,000 guests |
  | Forging | Assist 5 plays | A Fine merge | Forge a tool upgrade | A Masterwork | Forge a Mythril tool |
  | Expeditions | Return from 2 | A Success at level 10+ | A Success at level 20+ | A Great at level 20+ | A Success at the Sky Ruins |

  M4 counts farming (F20), fishing and foraging (F22); the others are data now and counted by their packets. Each depth
  challenge is "reach the deepest place your rank allows".
- **What each rank gives (CS31):**

  | Rank | Yield | Tended growth | Quality | Deepest: Mine and Quarry · forest · Fishery | Expedition power | Seeds back | Affection a day | Workshop yield |
  |---|---|---|---|---|---|---|---|---|
  | Novice | ×1.0 | 1.25 | +0 | Floor 5 · the Woods · the Pond | 10 | 10% | +0 | ×1.0 |
  | Hand | ×1.15 | 1.35 | +0.5 | Floor 10 · the Hills · the River | 20 | 15% | +3 | ×1.1 |
  | Skilled | ×1.3 | 1.45 | +1.0 | Floor 15 · the Old Forest · the Lake | 30 | 20% | +6 | ×1.2 |
  | Expert | ×1.5 | 1.55 | +1.5 | Floor 20 · the Mountain · the Falls | 40 | 25% | +9 | ×1.3 |
  | Master | ×1.7 | 1.65 | +2.0 | Floor 25 · the Misty Vale · the Deep Sea | 50 | 30% | +12 | ×1.4 |
  | Legend | ×2.0 | 1.75 | +2.5 | Floor 30 · the World Tree · the Moon Pool | 60 | 35% | +15 | ×1.5 |
- **Quality (CS26):** her rank gives 0.5 × rank (0 → 2.5) and her talent its quality points, in gathering, tended
  farming and the workshops.
- **Craft Level → rank (CS32)** is F17's migration; this packet reuses its thresholds.
- **Her calling is her favourite line (CS33, FC17):** Metal and Stone → mining, Wood → foraging, Fish → fishing,
  Vegetables → farming (D24 #9), from the calling rule as copied (her best running styles). She earns ×1.2 rank points
  there; a pair sharing it earns ×1.5 bond points (M6). It shows on her card; **she can work anywhere**. The ranch,
  the workshops and expeditions are nobody's favourite.
- **The album (FC19):** her ranks and talents on her card, as filters and sorts (bonds and affinity come with F23 and
  M6).
- **Rank-ups show in the morning (CS7):** the summary's ranks section lists rank-ups, and Umas whose points are full,
  with their challenge named.

### Decided here (the spec left these open)

1. **`challenge` counts toward her next rank's challenge only.** CS53 keeps one number per activity, so it can't count
   every rank's challenge since she joined (CS30). It counts from her joining or her last rank-up in that activity, and
   resets at each rank-up. The order of the challenges makes little difference: a depth challenge can't be met before
   its rank opens the place.
2. **Who worked today (step 6):** an Uma whose uma-work entry ran through the day (its place's activity: Forest and
   Sawmill foraging, Fishery and Smokehouse fishing, the Fields' tenders and the Mill farming; later the Mine, Quarry,
   Smelter and Cutter mining), or who tended a block with a growing plot (F20). One day pays one activity.
3. **Rank-ups happen at step 6,** when both the points and the challenge are met; a challenge met during the day waits
   for that night. A rank skipped by points (rare) still takes one challenge at a time, one rank a night.
4. **Temperament (CS46)** is read here, since it's the same scores: her top score's stat, Speed **breezy**, Stamina
   **steady**, Power **bold**, Guts **gritty**, Wit **clever**; ties go in that order. F24's hello lines read it.
5. **Where talents are computed:** once per release, for every outfit, cached by the release's hash, in the app; the
   night and the screens read the cache. The API never needs them.
6. **The trade gate leaves the loop:** v2's "Another trade" and the open shop stay with the Wilds' code until F24; in
   the loop every Uma may work every place.
7. **The cards:** her favourite line's mark and her best talent as a badge on the face; on the card, her rank and talent
   in the place's activity when picking a worker ("Hand · B"), else her best rank. Filters: talent in each activity
   (C+, B+, A+, S), rank in each activity, favourite line. Sorts: talent score and rank points in a chosen activity,
   joined, name. The job picker opens sorted by the place's activity.
8. **Checked against the release locally:** a script, run on your machine against `../uma-platform/content/release`
   and never committed with its output, prints the talent shares and the temperament counts and compares them with
   CS27 and CS46 (Bold 76, Breezy 69, Steady 54, Clever 42, Gritty 31). Only aggregate counts may go in git, as CS27's
   are.

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

Module names; the badge drawing; how a rank-up's summary line names her challenge.

## Do

1. **Talents** (CS27, CS28): `talentScores(outfit)`, `talentOf(scores, activity)`, `expeditionTalent`, `temperament`,
   with tests on invented outfits (copies of the synthetic one with chosen stats and growth rates).
2. **Ranks** (CS29–CS33): `rankPointsForDay`, the challenge data and `countChallenge(save, outfitId, activity, event)`
   for F20 and F22, `rankBenefits(rank)` (CS31) and the quality terms (CS26), `favouriteActivity(outfit)`.
3. **Night step 6:** rank points for who worked (decision 2), then rank-ups (decision 3), with the summary's ranks
   section. If F18 hasn't landed, ship `tickRanks` and F18 wires it.
4. **The album:** talents and ranks on the roster's cards and in the job picker (decision 7).
5. **The release check** (decision 8), locally.
6. **The manual:** a new [docs/game/ranks.md](../../game/ranks.md) with live blocks (the stat → activity map, the
   cut-offs, what a talent gives, the thresholds, the challenges, what a rank gives) and hand-written rules ("built in
   F21, live from F24"); its row in [the manual's index](../../game/README.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks are ≤ 180 KB gzip; the private-content guard passes.
- Domain tests:
  - a score of 150 is S and 149.9 A; an expedition mean of 136 is S; the grades' cut-offs at every edge;
  - CS29's days-to-rank table: a C Uma in her favourite line reaches Hand in 4 days, Skilled in 13, Expert in 31,
    Master in 69 and Legend in 152 (challenges met), and a G outside it Hand in 5 and Legend in 250;
  - points past a threshold wait for the challenge; the challenge counter resets at the rank-up;
  - a tender of an empty block earns nothing; one day pays one activity; well fed and 5 hearts lift the points;
  - CS31's table drives yield, growth, quality, the deepest place and seeds back;
  - temperament ties go Speed, Stamina, Power, Guts, Wit.
- `pnpm docs:update` leaves `ranks.md` unchanged.
- The release check prints shares within a point of CS27's and CS46's counts (not committed).
- Locally (loop build) at 390×844: the roster's cards show her favourite line and best talent; filtering to "Fishing
  B+" and sorting by fishing work; ending a day with an Uma at work (a stub job, or the Fields once F20 has landed)
  gives her 10 points times her factors, shown on her card.
- Production: the deploy passes, health shows the commit, and https://uma-farm.web.app plays the Wilds as before.

## Deliver

Commit to `main` (`feat: talents and ranks (F21)`, `git status` first), push, and watch the run
(`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a Done
row in [the handoff](../README.md) with the run's link, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–8.
