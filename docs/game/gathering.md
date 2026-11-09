# Gathering: the forest, the Fishery and the stations

**Built in F22, live from F24.** Day 1 sends one Uma
to the Woods and one to the Pond (CS3). Foraging and fishing are the loop's first jobs: an Uma goes for a number of
days, brings home a haul each day, and her rank opens deeper places. The Mill, the Sawmill and the Smokehouse turn what
comes home into goods worth half again as much. This page is gathering as built. The rules are in `@farm/domain`
(`gathering/ids.ts` the ids and the save's parse, `gathering/tables.ts` the spec's tables, `gathering/kinds.ts` the work
kinds and the night's hauls, `gathering/stations.ts` building a station); the screens in `apps/web/src/loop/`
(`WorkPlace.tsx`, `work-view.ts`). The spec is [core-spec.md](../design/core-spec.md) CS15–CS18, with CS4, CS22, CS26,
CS28, CS30 and CS31; the calls are D36.

```
 the farm map                /?peek=forest (the quick look)        /forest?slot=0 (the page and its job sheet)
 ┌───────────┐  tap   ┌────────────────────────────┐ Open  ┌──────────────────────────────────────────┐
 │  Forest   │ ─────► │ Foraging · 4 slots         │ ────► │ Who   (face) Name · Hand · B             │
 │ ◔ ◔ Ready │        │ (face) ×5 · 0/5  Tomorrow  │       │ What  ○ Woods      About 6 a day · G1–G2  │
 └───────────┘        │ (+) Free                   │       │         [pine][mush][birch][shii]…        │
  pips: who works,     │ … four rows                │       │       ● Hills      About 6 a day · G3–G4  │
  ringed by progress   │ [Open the Forest]          │       │       ○ Old Forest From Skilled (greyed)  │
                       └────────────────────────────┘       │ How many  [×6 1 day] [×12 2 days] …       │
 the night                                                   │ [Start · ×6 · 1 day]                      │
 step 4  moveJobs    each day's haul is ready by morning     └──────────────────────────────────────────┘
 step 4  countHauls  catches and items count toward her       a station: Build · 1,500g until built, then
                     challenge; the best catch is noted       its jobs from what the Warehouse holds
```

## A job is days (decision 1)

- **A gathering job is 1 to 4 days** at one area or spot: `{ kind: 'forage' | 'fish', item: <area or spot>, count: days }`.
  A queue adds up to three more jobs behind it ("keep at this for N days"); Repeat starts the same job the next morning;
  Recall and a stopped queue are uma-work's, as everywhere (FC6).
- **The haul is planned when the job starts:** each day's items by CS17 with her rank, talent, tool and well-fed days as
  they stand then; each good and its stars drawn from the account and the day (`draw(uid, day, '<place>:<slot>:<n>', 0
  or 1)`), so the same save always plans the same haul (CS8). Each day's items take seconds adding up to exactly 86,400,
  so a day's haul is ready the next morning and can be collected while the job runs on.
- **A queued job starting at a night's boundary is planned with that night's ranks and talents:** the night stores its
  settle after step 6, and plans read master data's talents (`loopKinds(talentOf)`, below).
- **Her rank opens deeper places** (FC11): an area or spot her rank hasn't opened is refused ("Opens at Hand."). The sea
  also waits for chapter 7 ("Opens with Chapter 7.") and the Deep Sea for the boat, all M6.

## The forest's areas (CS16)

Six areas, each yielding its two grades about 65/35: **woods 40%, mushrooms 30%, herbs and spices 15%, and the season's
family 15%** (Spring sweets, Summer fruits, Autumn nuts and seeds, Winter more mushrooms). A test draws the Woods in
Spring over 2,000 seeded items and finds those shares.

<!-- live:forest-areas -->
| Area | Id | Opens at | Grades | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|---|
| The Woods | `woods` | Novice | G1–G2 | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Honeycomb 10%, Mint 5%, Sugarcane 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Apple 10%, Mint 5%, Pear 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Peanut 10%, Mint 5%, Sunflower Seed 5% | Button Mushroom 29%, Pine Log 26%, Shiitake 16%, Birch Log 14%, Basil 10%, Mint 5% |
| The Hills | `hills` | Hand | G3–G4 | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sugar Beet 10%, Thyme 5%, Maple Sap 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Peach 10%, Thyme 5%, Plum 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sesame 10%, Thyme 5%, Walnut 5% | Oyster Mushroom 29%, Cedar Log 26%, Enoki 16%, Maple Log 14%, Rosemary 10%, Thyme 5% |
| The Old Forest | `old-forest` | Skilled | G4–G5 | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Maple Sap 10%, Ginger 5%, Cacao Pod 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Plum 10%, Ginger 5%, Orange 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Walnut 10%, Ginger 5%, Chestnut 5% | Enoki 29%, Maple Log 26%, Chanterelle 16%, Oak Log 14%, Thyme 10%, Ginger 5% |
| The Mountain | `mountain` | Expert | G6–G7 | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Vanilla Pod 10%, Cinnamon 5%, Agave Heart 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Grape 10%, Cinnamon 5%, Mango 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Almond 10%, Cinnamon 5%, Pistachio 5% | Porcini 29%, Cherry Log 26%, Morel 16%, Mahogany Log 14%, Peppercorn 10%, Cinnamon 5% |
| The Misty Vale | `misty-vale` | Master | G8–G9 | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Palm Sap 10%, Mandrake 5%, Fairy Honeycomb 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Pomegranate 10%, Mandrake 5%, Starpeach 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Macadamia 10%, Mandrake 5%, Thundernut 5% | Truffle 29%, Ebony Log 26%, Glowcap 16%, Elderwood Log 14%, Saffron 10%, Mandrake 5% |
| The World Tree | `world-tree` | Legend | G9–G10 | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Fairy Honeycomb 10%, Phoenix Pepper 5%, Ambrosia Blossom 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Starpeach 10%, Phoenix Pepper 5%, Golden Apple 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Thundernut 10%, Phoenix Pepper 5%, Worldseed 5% | Glowcap 29%, Elderwood Log 26%, King Reishi 16%, Yggdrasil Branch 14%, Mandrake 10%, Phoenix Pepper 5% |
<!-- /live -->

## The Fishery's spots (CS15)

Seven spots; the five freshwater ones play in M4, the Sea Pier and the Deep Sea wait for M6.

<!-- live:fishing-spots -->
| Spot | Id | Opens at | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|
| The Pond | `pond` | Novice | Carp 60%, Trout 40% | Carp 98%, Rainbow Koi 2% | Carp 60%, Trout 40% | Carp 70%, Trout 30% |
| The River | `river` | Hand | Trout 40%, Carp 20%, Salmon 40% | Eel 40%, Trout 40%, Carp 20% | Salmon 50%, Trout 50% | Trout 60%, Salmon 20%, Carp 20% |
| The Lake | `lake` | Skilled | Salmon 50%, Trout 20%, Eel 30% | Eel 50%, Salmon 47%, Rainbow Koi 3% | Salmon 50%, Eel 30%, Silverfin 20% | Silverfin 20%, Trout 30%, Salmon 50% |
| The Falls | `falls` | Expert | Eel 50%, Salmon 25%, Silverfin 20%, Rainbow Koi 5% | Eel 60%, Silverfin 30%, Rainbow Koi 10% | Silverfin 30%, Salmon 40%, Eel 25%, Rainbow Koi 5% | Silverfin 40%, Trout 50%, Rainbow Koi 10% |
| The Moon Pool | `moon-pool` | Legend | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% |
| The Sea Pier | `sea-pier` | Hand + chapter 7 | Sardine 60%, Sea Bream 40% | Sardine 50%, Mackerel 20%, Sea Bream 30% | Mackerel 60%, Sea Bream 40% | Mackerel 70%, Sardine 30% |
| The Deep Sea | `deep-sea` | Master + chapter 7 + the boat | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 30%, Sea Bream 10% | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 40% |
<!-- /live -->

## What a day brings home (CS17)

`items = round(base × rank × talent × tool × well fed × bond)`, never below 1. Bonds (×1.1 beside an Uma she has 3+
hearts with) come in M6, tools above Basic with the Forge (M6).

<!-- live:haul-factors -->
| Factor | Values |
|---|---|
| Base, at Novice | The forest 5, the Fishery 3 |
| Rank | ×1 · ×1.15 · ×1.3 · ×1.5 · ×1.7 · ×2 |
| Talent, G → S | ×0.85 · ×0.9 · ×0.95 · ×1 · ×1.05 · ×1.1 · ×1.15 · ×1.2 |
| Tool (the Axe, the Rod), Basic → Mythril | ×1 · ×1.15 · ×1.3 · ×1.45 · ×1.6 |
| Well fed | ×1.25 |
<!-- /live -->

Items a day with the Basic tool, by rank and talent:

<!-- live:haul-day -->
| Rank | Yield | Forest D | Forest C | Forest S | Fishery D | Fishery C | Fishery S | Forest C, well fed |
|---|---|---|---|---|---|---|---|---|
| Novice | ×1 | 5 | 5 | 6 | 3 | 3 | 4 | 7 |
| Hand | ×1.15 | 6 | 6 | 7 | 3 | 4 | 4 | 8 |
| Skilled | ×1.3 | 7 | 7 | 8 | 4 | 4 | 5 | 9 |
| Expert | ×1.5 | 8 | 8 | 9 | 5 | 5 | 5 | 10 |
| Master | ×1.7 | 9 | 9 | 10 | 5 | 5 | 6 | 11 |
| Legend | ×2 | 10 | 11 | 12 | 6 | 6 | 7 | 13 |
<!-- /live -->

Worked, as the packet's checks: a Novice C forager in the Woods brings round(5 × 1.0 × 1.05) = **5** a day; a Hand C
angler at the River round(3 × 1.15 × 1.05) = **4**.

## Stars (CS26)

A gathered good's quality points: **0.5 × her rank, her talent's points (G −0.75 … S +1), +0.25 a tool tier above Basic,
well fed +0.25**; its stars are `1 + ⌊Q + u⌋` ([goods.md](goods.md#stars-cs26)). Every good of a day draws its own.

<!-- live:gather-quality -->
| Rank | Q at D | Q at C | Q at S | Stars at C | Stars at C, well fed |
|---|---|---|---|---|---|
| Novice | 0 | 0.25 | 1 | ★1 75%, ★2 25% | ★1 50%, ★2 50% |
| Hand | 0.5 | 0.75 | 1.5 | ★1 25%, ★2 75% | ★2 100% |
| Skilled | 1 | 1.25 | 2 | ★2 75%, ★3 25% | ★2 50%, ★3 50% |
| Expert | 1.5 | 1.75 | 2.5 | ★2 25%, ★3 75% | ★3 100% |
| Master | 2 | 2.25 | 3 | ★3 75%, ★4 25% | ★3 50%, ★4 50% |
| Legend | 2.5 | 2.75 | 3.5 | ★3 25%, ★4 75% | ★4 100% |
<!-- /live -->

## Well fed (CS22; decision 4)

Gathering and 1-day station jobs are 1-day kinds: her plan takes **×1.25 items for each day she'll be well fed** (and
+0.25 quality on those days), and the night gives them no time. The Mill's preserves are the one multi-day kind in M4:
they gain **a quarter day a night** through the night's `speedUp` ([days.md](days.md#work-in-days-fc6-decisions-1-and-4)).
Nothing sets well fed in M4 but tests; the staff meal is M5's.

## Collecting a haul (decisions 3 and 7)

- **Collect** (a slot's arrow, **Collect here** on the page, Collect all on the map) adds the starred goods to the
  Warehouse through F17's bridge (`pine-log@2` → `items['pine-log'][1]`), and says what came home: "+5 · ★1 × 4, ★2 × 1".
- **`farm.counts['home:forest']` and `farm.counts['home:fishery']`** rise by the items collected: chapter 1's goal 3,
  "bring home 10 things from the Woods or the Pond" ([goals.md](goals.md)).
- **Each fish is measured when it's collected.** Its size is `min + (max − min) × u^(8/k)`, with
  `k = 1 + 0.25 × rank + 0.1 × talent step + 0.05 × Rod tier` at the collect, and `u` drawn from the account, the
  collect's day, the Uma and the fish's place in the farm's catches (`farm.counts['home:fishery']` before it), so the same
  collect always measures the same. The biggest of each kind is kept in `diary.records['size:<fish>']`, to a tenth of a
  cm; the note names the biggest ("Carp 41.2 cm, a record"). Sizes feed the Diary (M6) and the Fishing Derby (M6).

<!-- live:fish-sizes -->
| Fish | Id | Size | Price ★1 | At the Smokehouse | Price ★1 |
|---|---|---|---|---|---|
| Carp | `carp` | 20–60 cm | 40g | Carp Fillet | 60g |
| Trout | `trout` | 25–70 cm | 50g | Trout Fillet | 75g |
| Sardine | `sardine` | 12–25 cm | 65g | Sardine Fillet | 100g |
| Mackerel | `mackerel` | 25–50 cm | 85g | Mackerel Fillet | 130g |
| Salmon | `salmon` | 50–120 cm | 110g | Salmon Fillet | 165g |
| Sea Bream | `sea-bream` | 30–70 cm | 145g | Sea Bream Fillet | 220g |
| Eel | `eel` | 40–120 cm | 180g | Eel Fillet | 270g |
| Tuna | `tuna` | 80–250 cm | 235g | Tuna Fillet | 355g |
| Silverfin | `silverfin` | 40–90 cm | 300g | Silverfin Fillet | 450g |
| Rainbow Koi | `rainbow-koi` | 40–100 cm | 390g | Rainbow Koi Fillet | 585g |
<!-- /live -->

Better anglers land bigger fish: `u^(8/k)` leans small, less so as *k* grows.

<!-- live:size-skill -->
| Rank | k at D | k at C | k at S | Average at C | A Carp at C, on average |
|---|---|---|---|---|---|
| Novice | 1.35 | 1.45 | 1.75 | 15% | 26.1 cm |
| Hand | 1.6 | 1.7 | 2 | 18% | 27.0 cm |
| Skilled | 1.85 | 1.95 | 2.25 | 20% | 27.8 cm |
| Expert | 2.1 | 2.2 | 2.5 | 22% | 28.6 cm |
| Master | 2.35 | 2.45 | 2.75 | 23% | 29.4 cm |
| Legend | 2.6 | 2.7 | 3 | 25% | 30.1 cm |
<!-- /live -->

## The night: hauls count (CS7 step 4, CS30; decision 7)

- **Step 4, `moveJobs`,** notes every entry's items that finished tonight, with its request.
- **Step 4, `countHauls`,** counts them toward each Uma's next rank's challenge through F21's `countChallenge`: her
  catches at a spot (`{ kind: 'catch', spot, fish }`), her items in an area (`{ kind: 'gather', area, items }`). Each
  challenge reads only what it asks: "Catch 10 fish at the River" counts the River's. It runs before step 6, so a
  challenge met tonight ranks her up tonight ([ranks.md](ranks.md#the-challenges-cs30-decision-1)).
- **Rank points** are F21's: a running job's place pays a day in its activity (`PLACE_ACTIVITY`: the forest and the
  Sawmill foraging, the Fishery and the Smokehouse fishing, the Mill farming).
- **The morning summary's work done** lists jobs finished by place ("Forest · 1 job done · 5 items") and **the night's
  best catch**, the most valuable fish caught tonight at its stars ("Best catch · Rainbow Koi ★2"), which opens the
  Fishery's quick look.

## The stations (CS18; decisions 2 and 6)

A station turns one raw good into its refined form, one for one, **keeping its stars**; the output sells at ×1.5. An
Uma processes **`round(8 × rank × talent × well fed)` items a day** with the rank and talent of the station's place's
activity. A station is locked until built: the Mill needs its plans (`buildings.mill` 0, chapter 1's reward, [goals.md](goals.md)), the
Sawmill and the Smokehouse Farm Rank 3 (CS39 leaves them out of FR3's list; CS18 is followed). Building sets
`buildings.<station>` to 1 for its gold.

<!-- live:stations -->
| Station | At | Rank used | Builds for | Opens | Jobs |
|---|---|---|---|---|---|
| Mill | Fields | Farming | 1,200g | Its plans: chapter 1’s reward (F24) | Flour (1 day): grains · Sugars and oils (1 day): sweets, nuts and seeds · Preserves (2 days): fruits |
| Sawmill | Forest | Foraging | 1,500g | Farm Rank 3 | Planks (1 day): woods · Drying (1 day): mushrooms, herbs and spices |
| Smokehouse | Fishery | Fishing | 2,000g | Farm Rank 3 | Smoking (1 day): fish |
<!-- /live -->

Items a day by rank and talent:

<!-- live:station-day -->
| Rank | D | C | S | C, well fed |
|---|---|---|---|---|
| Novice | 8 | 8 | 10 | 11 |
| Hand | 9 | 10 | 11 | 12 |
| Skilled | 10 | 11 | 12 | 14 |
| Expert | 12 | 13 | 14 | 16 |
| Master | 14 | 14 | 16 | 18 |
| Legend | 16 | 17 | 19 | 21 |
<!-- /live -->

- **A station job is items:** `{ kind: <job>, item: '<output>@<stars>', count }`, 1 to 100, one input of the output's raw
  good at the same stars for each. Its inputs leave the Warehouse when it starts; a job longer than the Warehouse holds is
  refused ("Short 3 Pine Log."), and Recall gives back what isn't made.
- **Its days:** a 1-day job fills each day at that day's rate (10 logs at 10 a day is 1 day; 12 is 2); the preserves run
  at least 2 days on their batch. Worked (CS18 re-cast to the Sawmill): a Hand C forager saws round(8 × 1.15 × 1.05) =
  **10** logs a day, and ★3 logs make ★3 planks.
- **The job sheet's sizes:** a day's batch at her rate ("×8 · 1 day"), two days' ("×16 · 2 days"), and all held
  ("×5 · 1 day"), at most 100.

<!-- live:station-recipes -->
### Flour (Mill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Wheat | 40g | Wheat Flour | 60g |
| G2 | Oats | 40g | Rolled Oats | 60g |
| G3 | Barley | 45g | Pearl Barley | 70g |
| G4 | Rice | 50g | Polished Rice | 75g |
| G5 | Corn | 140g | Cornmeal | 210g |
| G6 | Rye | 60g | Rye Flour | 90g |
| G7 | Buckwheat | 75g | Buckwheat Flour | 115g |
| G8 | Wild Rice | 160g | Hulled Wild Rice | 240g |
| G9 | Moonrice | 240g | Moonrice Flour | 360g |
| G10 | Sunwheat | 260g | Sunwheat Flour | 390g |

### Sugars and oils (Mill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Peanut | 35g | Peanut Butter | 55g |
| G2 | Sunflower Seed | 75g | Sunflower Oil | 115g |
| G3 | Sesame | 50g | Sesame Paste | 75g |
| G4 | Walnut | 65g | Walnut Paste | 100g |
| G5 | Chestnut | 85g | Chestnut Paste | 130g |
| G6 | Almond | 110g | Almond Paste | 165g |
| G7 | Pistachio | 140g | Pistachio Paste | 210g |
| G8 | Macadamia | 180g | Macadamia Butter | 270g |
| G9 | Thundernut | 230g | Thundernut Oil | 345g |
| G10 | Worldseed | 300g | Worldseed Oil | 450g |
| G1 | Honeycomb | 35g | Honey | 55g |
| G2 | Sugarcane | 45g | Cane Sugar | 70g |
| G3 | Sugar Beet | 120g | Beet Sugar | 180g |
| G4 | Maple Sap | 70g | Maple Syrup | 105g |
| G5 | Cacao Pod | 95g | Chocolate | 145g |
| G6 | Vanilla Pod | 120g | Vanilla Extract | 180g |
| G7 | Agave Heart | 155g | Agave Syrup | 235g |
| G8 | Palm Sap | 200g | Palm Sugar | 300g |
| G9 | Fairy Honeycomb | 255g | Fairy Honey | 385g |
| G10 | Ambrosia Blossom | 330g | Ambrosia | 495g |

### Preserves (Mill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Apple | 35g | Apple Preserve | 55g |
| G2 | Pear | 45g | Pear Preserve | 70g |
| G3 | Peach | 55g | Peach Preserve | 85g |
| G4 | Plum | 70g | Plum Preserve | 105g |
| G5 | Orange | 95g | Orange Marmalade | 145g |
| G6 | Grape | 120g | Grape Jelly | 180g |
| G7 | Mango | 155g | Mango Pulp | 235g |
| G8 | Pomegranate | 200g | Pomegranate Molasses | 300g |
| G9 | Starpeach | 255g | Starpeach Nectar | 385g |
| G10 | Golden Apple | 330g | Golden Apple Preserve | 495g |

### Planks (Sawmill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Pine Log | 25g | Pine Plank | 40g |
| G2 | Birch Log | 30g | Birch Plank | 45g |
| G3 | Cedar Log | 40g | Cedar Plank | 60g |
| G4 | Maple Log | 50g | Maple Plank | 75g |
| G5 | Oak Log | 70g | Oak Plank | 105g |
| G6 | Cherry Log | 90g | Cherry Plank | 135g |
| G7 | Mahogany Log | 110g | Mahogany Plank | 165g |
| G8 | Ebony Log | 145g | Ebony Plank | 220g |
| G9 | Elderwood Log | 185g | Elderwood Plank | 280g |
| G10 | Yggdrasil Branch | 240g | Yggdrasil Plank | 360g |

### Drying (Sawmill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Basil | 45g | Dried Basil | 70g |
| G2 | Mint | 45g | Dried Mint | 70g |
| G3 | Rosemary | 45g | Dried Rosemary | 70g |
| G4 | Thyme | 60g | Dried Thyme | 90g |
| G5 | Ginger | 200g | Ground Ginger | 300g |
| G6 | Peppercorn | 100g | Ground Pepper | 150g |
| G7 | Cinnamon | 125g | Ground Cinnamon | 190g |
| G8 | Saffron | 160g | Saffron Threads | 240g |
| G9 | Mandrake | 520g | Mandrake Powder | 780g |
| G10 | Phoenix Pepper | 270g | Phoenix Spice | 405g |
| G1 | Button Mushroom | 30g | Dried Button Mushroom | 45g |
| G2 | Shiitake | 40g | Dried Shiitake | 60g |
| G3 | Oyster Mushroom | 50g | Dried Oyster Mushroom | 75g |
| G4 | Enoki | 65g | Dried Enoki | 100g |
| G5 | Chanterelle | 85g | Dried Chanterelle | 130g |
| G6 | Porcini | 110g | Dried Porcini | 165g |
| G7 | Morel | 140g | Dried Morel | 210g |
| G8 | Truffle | 180g | Shaved Truffle | 270g |
| G9 | Glowcap | 230g | Glowcap Powder | 345g |
| G10 | King Reishi | 300g | Reishi Powder | 450g |

### Smoking (Smokehouse)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Carp | 40g | Carp Fillet | 60g |
| G2 | Trout | 50g | Trout Fillet | 75g |
| G3 | Sardine | 65g | Sardine Fillet | 100g |
| G4 | Mackerel | 85g | Mackerel Fillet | 130g |
| G5 | Salmon | 110g | Salmon Fillet | 165g |
| G6 | Sea Bream | 145g | Sea Bream Fillet | 220g |
| G7 | Eel | 180g | Eel Fillet | 270g |
| G8 | Tuna | 235g | Tuna Fillet | 355g |
| G9 | Silverfin | 300g | Silverfin Fillet | 450g |
| G10 | Rainbow Koi | 390g | Rainbow Koi Fillet | 585g |
<!-- /live -->

The vegetables have no station (CS11); the Mill's Cloth (3 days, 2 fleece → 1 cloth) waits for the ranch's wool (M5).

## Talents in planning

Talents aren't saved (CS53), and a kind's `plan` sees only the save. So the kinds close over the app's talents:
**`loopKinds(talentOf)`** builds the registry with master data's `TalentOf` (one registry a resolver), and every caller
passes it: the night (`NightContext.talentOf`; `kinds` left out means `loopKinds(talentOf)`), so a queued job starting
at the boundary plans with her talent; and the app's work actions and screens (`talentsFor(view)`, `useTalents()`), so a
job started by day, a collect's sizes and the kit's projections read the same. `LOOP_KINDS` is the registry with everyone
D, the default for tests. uma-work isn't forked.

## The save (decisions 1 and 2; F17 decision 11)

The save's parse reads each kind's request from **`LOOP_REQUESTS`** (`gathering/ids.ts`): a gathering request's area or
spot and 1–4 days; a station request's output at its stars, a refined good its job makes, and 1–100. An entry may hold
more items than its request's days (a day's haul is many goods). The parse stays in the initial JS; the tables and the
rules (`LOOP_KINDS`) load with the screens and the night. The morning summary's work lines gain
`{ kind: 'catch', id, stars }`, a fish once.

## The screens (decisions 5 and 8)

- **The map:** the Forest, the Fishery and the three stations open their quick looks (`/?peek=forest` …): a line
  ("Foraging · 4 slots"), the kit's four slot rows (a free one opens the page's job sheet), stopped queues and **Open the
  Forest**. A station is locked until built: before what opens it, its quick look says so ("Opens with Farm Rank 3");
  after, it offers **Build · 1,500g** ("Need 300g more" when short), and once built it works like the forest.
- **The page** (`/forest`, `/fishery`, `/mill`, `/sawmill`, `/smokehouse`): its line and **Collect here**, the kit's four
  slot rows with Collect, Repeat, the queue and Recall, the stopped queues, and the kit's job sheet:
  - **Who:** the Umas home, each card her rank and talent in the place's activity ("Hand · B"), opening by that rank,
    free ones first; a tender is shown and can't be picked ("Tends Block A").
  - **What:** at the forest or the Fishery, every area or spot with this season's goods, those her rank hasn't opened
    greyed ("From Hand", "Chapter 7"), each with "About 5 a day" for her and its grades; the sheet opens on the deepest
    she can go. At a station, its jobs ("Planks", "Drying") with what the Warehouse holds at each star ("Pine Plank ★3 ·
    12 held"), or "Nothing to process yet: bring logs, mushrooms or herbs home first."
  - **How many:** in days. The kit counts items, so a gathering size is her haul after 1–4 days ("×5 · 1 day",
    "×10 · 2 days") and the farm turns it back into days; a station's are decision 2's.
- **Days, not "24h":** uma-kit 0.19.0's `formatDuration` prints the farm's days everywhere the kit shows a time: what's
  left ("Tomorrow", "In 2 days"), a job's length ("1 day", "3 days") and a stopped queue's age ("Forest · stopped
  yesterday").
- **The help (i)** says how the place works in four or five lines.
