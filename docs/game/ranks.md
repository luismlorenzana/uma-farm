# Talents and ranks

**Built in F21, live from F24** (dark until then: the loop plays only with `VITE_FARM_LOOP=1`, D29). Every Uma is a
specialist: she has a **talent**, G to S, in each of the nine activities, read from her own stats by one rule, and she
climbs **six ranks** in each by working and meeting a challenge. Talents are why one Uma suits the Fields and another the
Pond; ranks are how the farm goes deeper and better. Her calling's line is her **favourite**, where she ranks up a little
faster, but she can work anywhere. This page is talents and ranks as built. The rules are in `@farm/domain`
(`farm/talents.ts`, `farm/rank-rules.ts`, the ladder in `farm/ranks.ts`, night step 6 in `night/end-day.ts`); the screens
in `apps/web/src/loop/` (`RosterPage.tsx`, `roster-view.ts`, `UmaMarks.tsx`, `talents.ts`). The spec is
[core-spec.md](../design/core-spec.md) CS26–CS33, with CS5, CS7, CS45 and CS46; the calls are D35.

```
 master data's outfit                 her talents (not saved)            her ranks (the save, CS53)
 ┌────────────────────┐   CS27        ┌──────────────────────────┐       ┌───────────────────────────────┐
 │ 5★ stats  Spe Sta  │ ────────────► │ farming  S   (Stamina)   │       │ farming  Hand   52 / 160 pts  │
 │ Pow Gut Wit        │  score =      │ fishing  B   (Wit)       │       │          next: 40 crops ★3+   │
 │ growth %  ...      │  5★ × (100 +  │ foraging C   (Speed) ... │       │ fishing  Novice 12 / 40 pts   │
 └────────────────────┘  growth) ÷ 100│ expeditions: best three  │       │ ... nine activities           │
                                      └──────────────────────────┘       └───────────────────────────────┘
 a day of work ──► night step 6: 10 pts × talent × 1.2 favourite × 1.25 well fed × hearts ──► points
 her work all day ─► countChallenge(save, id, activity, event) ──► challenge (toward her next rank only)
 night step 6: points ≥ next threshold AND challenge met ──► rank + 1, challenge 0 ──► "Aster · Farming Hand"
```

## Talents (CS27)

For each activity, her **talent score** is her **5★ base stat × (100 + her growth rate for that stat) ÷ 100**, read from
master data's outfit. Expeditions read **the mean of her three best scores**. Scores are kept to a millionth.

<!-- live:talent-stats -->
| Stat | Activities | Temperament (her top stat) |
|---|---|---|
| Speed | Foraging, Serving | Breezy |
| Stamina | Farming | Steady |
| Power | Mining, Forging | Bold |
| Guts | Ranch | Gritty |
| Wit | Fishing, Cooking | Clever |
| All five: the mean of her three best scores | Expeditions | — |
<!-- /live -->

The cut-offs are the same for everyone (`STAT_CUTOFFS`, `EXPEDITION_CUTOFFS`, `gradeStep`): 150 is S and 149.9 A.

<!-- live:talent-cutoffs -->
| Grade | S | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|---|
| A stat’s score | ≥ 150 | ≥ 138 | ≥ 126 | ≥ 114 | ≥ 104 | ≥ 96 | ≥ 88 | < 88 |
| Expeditions (mean of best three) | ≥ 136 | ≥ 132 | ≥ 129 | ≥ 126 | ≥ 124 | ≥ 122 | ≥ 120 | < 120 |
<!-- /live -->

- **Her best talent** (the badge on her face) is her highest step among the eight activities that read one stat, then
  the higher score, then the activities' order (farming, the ranch, mining, fishing, foraging, cooking, serving,
  forging). Expeditions, on their own scale, aren't in it, as in CS27's "best talent" count.
- **Talents aren't saved** (CS53): a fixed release always gives the same talents. An outfit a later release drops reads D.
- The rules: `talentScores(outfit)`, `talentOf(scores, activity)`, `expeditionScore`, `expeditionTalent`,
  `activityScore` (the album's sort), `talentsOf(outfit)` (every step, her best, her temperament), `TalentOf` and
  `talentResolver(table)`; `talentsD` is everyone D, for tests.

**The release's spread** (decision 8; checked locally on 2026-11-09 against uma-platform's release by a script that is
never committed; aggregate counts only). It matches CS27's counts exactly: every outfit's 5★ stats sum to 550 and her
growth rates to 30%, scores run 65–182.4 and the expedition mean 118.05–142.70.

| Stat (activities) | S | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|---|
| Speed (foraging, serving) | 4 | 30 | 68 | 75 | 63 | 20 | 8 | 4 |
| Stamina (farming) | 12 | 20 | 33 | 44 | 63 | 54 | 19 | 27 |
| Power (mining, forging) | 18 | 31 | 57 | 62 | 50 | 30 | 17 | 7 |
| Guts (the ranch) | 3 | 20 | 38 | 83 | 63 | 48 | 13 | 4 |
| Wit (cooking, fishing) | 2 | 19 | 43 | 81 | 69 | 46 | 11 | 1 |
| **All five, together** | **2.9%** | **8.8%** | **17.6%** | **25.4%** | **22.6%** | **14.6%** | **5.0%** | **3.2%** |
| Expeditions | 11 | 33 | 37 | 69 | 55 | 42 | 23 | 2 |
| Her best talent (of 272) | 38 | 101 | 121 | 12 | 0 | 0 | 0 | 0 |

Every outfit has a C or better somewhere. The cut-offs are revisited only if a new release moves these shares by more
than 5 points.

## Temperament (CS46; decision 4)

Her temperament is her **top score's stat**: Speed **breezy**, Stamina **steady**, Power **bold**, Guts **gritty**, Wit
**clever**; a tie goes Speed, Stamina, Power, Guts, Wit (`temperament(scores)`). F24's hello lines and M6's
conversations read it. On the release: Bold 76, Breezy 69, Steady 54, Clever 42, Gritty 31 (the local check, matching
CS46).

## What a talent gives (CS28)

<!-- live:talent-gives -->
| Talent | G | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| Step | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| Yield (gathering, stations) | ×0.85 | ×0.90 | ×0.95 | ×1.00 | ×1.05 | ×1.10 | ×1.15 | ×1.20 |
| Quality points | −0.75 | −0.5 | −0.25 | 0 | +0.25 | +0.5 | +0.75 | +1 |
| Rank points | ×0.8 | ×0.85 | ×0.9 | ×1 | ×1.1 | ×1.2 | ×1.3 | ×1.5 |
| Tended growth | — | — | — | — | — | +0.05 | +0.1 | +0.15 |
| Affection a day (ranch) | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
| Expedition power | +0 | +2 | +4 | +6 | +8 | +10 | +12 | +14 |
<!-- /live -->

`talentYield`, `talentQuality` (CS26's talent term), `talentRankPoints`, `talentGrowth`, `talentAffection` and
`talentPower`. In M4 the Fields read growth and quality; F22's forest and Fishery read yield and quality.

## Rank points (CS29, CS45)

**A day of work pays 10 points** in its activity × her talent's rank-point factor, **×1.2 in her favourite line**,
**×1.25 well fed**, and **×1.05 at 5 hearts, ×1.10 at 10** of your affinity with her (`rankPointsForDay`). Points are
kept to a millionth and shown whole. **Every pay takes the same factors** (`rankPoints(base, terms)`): a workshop play
pays its assistant 10 (M5), an expedition 10 a day, +10 on a Success, +20 on a Great (M5); the ranch, the workshops and
expeditions are nobody's favourite, so ×1.2 never applies there.

Ranks come at **40, 160, 400, 900 and 2,000** points (`RANK_POINTS`). Days of work to reach each, by talent (in her
favourite line in brackets), challenges met; the table is computed from the rule (`daysToRank`), and a test climbs a C
Uma in her favourite line night by night (Hand on night 4, Skilled 13, Expert 31, Master 69, Legend 152) and a G outside
it (Hand 5, Legend 250):

<!-- live:rank-points -->
| Rank | Points | G | D | C | A | S |
|---|---|---|---|---|---|---|
| Novice | 0 | — | — | — | — | — |
| Hand | 40 | 5 (5) | 4 (4) | 4 (4) | 4 (3) | 3 (3) |
| Skilled | 160 | 20 (17) | 16 (14) | 15 (13) | 13 (11) | 11 (9) |
| Expert | 400 | 50 (42) | 40 (34) | 37 (31) | 31 (26) | 27 (23) |
| Master | 900 | 113 (94) | 90 (75) | 82 (69) | 70 (58) | 60 (50) |
| Legend | 2,000 | 250 (209) | 200 (167) | 182 (152) | 154 (129) | 134 (112) |
<!-- /live -->

## Who worked today (decision 2)

An Uma works a day when her uma-work job ran through it (`notes.worked`, by its place's activity) or she tended a block
with a growing plot (`notes.tended`, farming; a tender of an empty or all-Ready block earns nothing). **One day pays one
activity:** her first entry, jobs before tending (one rule, `isBusy`, already keeps an Uma from both).

<!-- live:place-activity -->
| Where she worked | Pays rank points in |
|---|---|
| The Fields, tending a block with a growing plot | Farming |
| Forest | Foraging |
| Sawmill | Foraging |
| Fishery | Fishing |
| Smokehouse | Fishing |
| Mill | Farming |
| Mine | Mining |
| Quarry | Mining |
| Smelter | Mining |
| Cutter | Mining |
<!-- /live -->

In M4 the Fields' tenders and, from F22, every Uma on a job at the forest, the Fishery and the stations earn points ([gathering.md](gathering.md)).

## The challenges (CS30; decision 1)

A rank comes when its points are reached **and** its challenge is met. Each depth challenge is "reach the deepest place
your rank allows", so ranking up is how the farm goes deeper.

<!-- live:challenges -->
| Activity | Hand | Skilled | Expert | Master | Legend | Counted by |
|---|---|---|---|---|---|---|
| Farming | Harvest 30 crops she tended | 40 crops of ★3+ she tended | Tend a crop of level 4+ to harvest | 30 crops of ★5 | 1st at a Flower Show with a crop she tended | F20, M6 (F32) |
| Ranch | Care for animals 10 days | An animal in her care reaches 4 hearts | An animal in her care reaches 7 hearts | An animal in her care reaches 10 hearts | 1st at an Animal Show with an animal in her care | M5 (F27), M6 (F32) |
| Mining | Dig 40 ores or stones | Dig at floor 10 | Dig at floor 15 | Dig at floor 20 | Dig at floor 25 | M5 (F26) |
| Fishing | Catch 30 fish | Catch 10 fish at the River | Catch 10 fish at the Lake | Catch 10 fish at the Falls | 1st at a Fishing Derby, on the team | F22, M6 (F32) |
| Foraging | Gather 50 items | Gather 20 items in the Hills | Gather 20 items in the Old Forest | Gather 20 items on the Mountain | Gather 20 items in the Misty Vale | F22 |
| Cooking | Assist 5 Kitchen plays | Assist a Fine play | Make 10 dishes of ★4+ | Assist a Masterwork | 1st at a Cooking Contest as the cook | M5 (F8), M6 (F32) |
| Serving | Assist 5 shifts | Assist a Fine shift | Serve 100 guests | Assist a Masterwork shift | Serve 1,000 guests | M6 (F35) |
| Forging | Assist 5 Forge plays | Assist a Fine merge | Forge a tool upgrade | Assist a Masterwork | Forge a Mythril tool | M6 (F36) |
| Expeditions | Return from 2 expeditions | A Success at level 10+ | A Success at level 20+ | A Great at level 20+ | A Success at the Sky Ruins | M5 (F28) |
<!-- /live -->

- **`challenge` counts toward her next rank's challenge only (decision 1),** from her joining or her last rank-up in
  that activity. CS53 keeps one number an activity, so it can't count every rank's since she joined. It **stops at the
  target** and **resets to 0 at the rank-up**. A migrated rank (CS32) starts at 0 toward the next.
- **`countChallenge(save, outfitId, activity, event)`** is the one way a packet counts. An event is what happened, for
  the Uma who did it: `{ kind: 'harvest', stars, level }` (farming, F20), `{ kind: 'catch', spot, fish }` (fishing, F22),
  `{ kind: 'gather', area, items }` (foraging, F22), `{ kind: 'dig', floor, items }` (mining), `{ kind: 'care' }` and
  `{ kind: 'hearts', hearts }` (the ranch), `{ kind: 'play', grade }` (a workshop play she assisted: rough, good, fine,
  masterwork; "a Fine play" is Fine or better), `{ kind: 'dishes', stars }`, `{ kind: 'guests', guests }`,
  `{ kind: 'forged', tool }`, `{ kind: 'expedition', result, level, region }` and `{ kind: 'won', festival }` (1st at a
  festival, M6). Each challenge row reads only its kind; an Uma off the roster, a Legend, or an event the row doesn't read
  changes nothing. It never stamps `updatedAt`.
- **M4 counts farming** (F20's harvests, through `countChallenge`) **and F22 fishing and foraging**; the others are data
  now and counted by their packets (the table's last column).
- `challengeFor(activity, rank)`, `challengeMet(activity, state)` and `pointsFull(state)` read a rank's state.

## The night: step 6 (decisions 2 and 3)

`tickRanks` (`tickRankRules` over `notes.worked` and `notes.tended`, CS7's step 6, before the stored settle):

1. **Points:** each Uma who worked earns a day's points in its activity, her factors as she worked (well fed is read
   before `countWellFed` counts it down; her talent through `NightContext.talentOf`; her favourite from master data's
   roster).
2. **Rank-ups:** every Uma on the roster, in every activity, ranks up where **her points have reached the next rank's
   and its challenge is met**: one rank a night, the challenge's count reset. A challenge met during the day waits for
   that night. A rank skipped by points (rare) still takes one challenge at a time, one rank a night. Points go on past
   a threshold while the challenge waits.
3. **Lines:** the rank-ups, then **points full**: an Uma whose points for her next rank filled tonight with its
   challenge still to meet, said once (the night they fill, or the night a rank-up leaves the next one already full),
   with her count. Her card keeps saying "Points full" until she ranks up.

Ranks use the points after the night, so a rank reached tonight speeds tomorrow's work (the settle that starts a queued
job is stored at step 7).

## What a rank gives (CS31)

<!-- live:rank-gives -->
| Rank | Yield | Tended growth | Quality | Deepest: Mine and Quarry · forest · Fishery | Expedition power | Seeds back | Affection a day | Workshop yield |
|---|---|---|---|---|---|---|---|---|
| Novice | ×1 | 1.25 | +0 | Floor 5 · The Woods · The Pond | 10 | 10% | +0 | ×1 |
| Hand | ×1.15 | 1.35 | +0.5 | Floor 10 · The Hills · The River | 20 | 15% | +3 | ×1.1 |
| Skilled | ×1.3 | 1.45 | +1 | Floor 15 · The Old Forest · The Lake | 30 | 20% | +6 | ×1.2 |
| Expert | ×1.5 | 1.55 | +1.5 | Floor 20 · The Mountain · The Falls | 40 | 25% | +9 | ×1.3 |
| Master | ×1.7 | 1.65 | +2 | Floor 25 · The Misty Vale · The Deep Sea | 50 | 30% | +12 | ×1.4 |
| Legend | ×2 | 1.75 | +2.5 | Floor 30 · The World Tree · The Moon Pool | 60 | 35% | +15 | ×1.5 |
<!-- /live -->

`rankBenefits(rank)` is the table; the Fields read its growth and seeds back (`tendedGrowth`, `seedsBackChance`) and
CS26's rank term is `rankQuality(rank)`. The forest's areas and the Fishery's spots (`FOREST_AREAS`, `FISHING_SPOTS`,
`AREA_NAMES`, `SPOT_NAMES`) moved to `gathering/ids.ts` in F22, which gives them their goods
([gathering.md](gathering.md)); `deepest` names the last each rank opens.

## Her favourite line (CS33; decision 6)

Her calling (her best running styles, the Wilds' rule as copied, [loops.md](loops.md#who-works)) names her line, and
the line her favourite activity (`favouriteActivity`): **Metal and Stone mining, Wood foraging, Fish fishing,
Vegetables farming**. She earns ×1.2 rank points there, and a pair sharing it will earn ×1.5 bond points (M6). The
ranch, the workshops and expeditions are nobody's favourite. **She can work anywhere:** the Wilds' trade gate ("Another
trade") and the open shop stay with the Wilds' code until F24, and the loop's work and tending never read them.

## The morning summary (CS5, CS7)

The summary's ranks section (`save.summary.ranks`, strictly parsed) is the night's lines, each a tap to her sheet on the
roster:

| Line | Words |
|---|---|
| `{ kind: 'rank-up', outfitId, activity, rank }` | "Aster · Farming Hand", tagged **Rank up** |
| `{ kind: 'full', outfitId, activity, rank, challenge }` | "Beryl · Fishing · Catch 30 fish · 12/30", tagged **Points full**: the challenge in its own words, with her count; a one-off challenge has no count ("Dig at floor 10") |

## The screens (decision 7)

- **`/roster`** is uma-kit's album chrome over the roster (the Umas home until F23, everyone since, with a Where filter,
  hearts, and Chat and Gift on her sheet; [roster.md](roster.md#the-screens)): search, sort and filters, a three-column grid of cards.
  - **Her face** carries her **favourite line's mark** (top left: a Carrot farming, a Pine Log foraging, a Carp fishing,
    Copper Ore mining, from uma-art's items atlas on a light disc) and her **best talent's grade** (bottom right, on a
    chip: S gold, A coral, B blue, C green, D and below grey).
  - **Her card** says her best rank ("Hand · Farming", or "Novice") and her best talent ("Fishing A"); sorted by an
    activity, her rank and talent in it ("Hand · C", "Fishing · 52 pts").
  - **Filters:** her talent in each activity (C+, B+, A+, S), her rank in each, her favourite line.
  - **Sorts:** joined (the default), her talent score or rank points in a chosen activity (the sort sheet's "In"
    chips), name.
  - **Her sheet** (`?uma=<id>`): her favourite line, the day she joined, and her nine activities, each with its talent
    chip, rank, points ("52 / 160"), and "Next: Catch 10 fish at the River · 3/10", "Points full · …" or "Ranks up
    tonight · …".
- **A picker for a place** (the Fields' tender now; F22's jobs next) shows her rank and talent in the place's activity
  ("Hand · B"), the same marks, filters and the activity's sorts (talent, rank points, joined, name), and **opens sorted
  by the place's activity**: rank, then points, then talent score (`activityOrder`, `pickerSorts`).
- The rules are behind the roster's help button. The page, its rows, the marks and the talents' table load on demand
  (`LAZY_MODULES`).

## Where talents are computed (decision 5)

In the app, once a release: `loop/talents.ts` computes every outfit's talents from master data's stats on first use and
keeps the table with that release's view (one view a release hash). The night (`endTheDay` passes `talentOf`), the
harvests (`harvestPlot`, `harvestBlock`, `harvestFields`, `collectFarm`, which wait for master data) and the screens
(`useTalents`) all read it. The API never needs talents.

## For F23–F24

- **A job's points:** add the job's place to `PLACE_ACTIVITY` if it's new; step 6 pays every running job's Uma from
  `notes.worked`. Nothing else is needed.
- **A job's terms:** her rank `save.roster[id].ranks[activity].rank`, her talent `talentOf(id, activity)` (from
  `NightContext.talentOf` in a kind's `plan`, or the app's `talentsFor(view)`), `rankBenefits(rank).yield`,
  `talentYield(step)`, `rankQuality(rank)` and `talentQuality(step)` into `quality(sources)`, and
  `rankBenefits(rank).deepest` for what her rank opens.
- **A job's challenge:** F22 counts catches and items at night, step 4's `countHauls`, as they finish, so a challenge
  met tonight ranks her up tonight ([gathering.md](gathering.md#the-night-hauls-count-cs7-step-4-cs30-decision-7)).
- **A job's talent:** a kind's plan reads it through `loopKinds(talentOf)` (F22): the night passes `NightContext.talentOf`,
  the app `talentsFor(view)`.
- **The roster and the start's cards (F23, done: [roster.md](roster.md)):** `talentTable(view)`, `talentsOf`,
  `favouriteActivity`, `umaRows`, `UMA_FACETS`, `umaBadges`, `TalentChip`, `FavouriteMark`. **Hello lines (F24):** `temperament`.
