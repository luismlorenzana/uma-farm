# The Fields: plots, seeds, tending and crop levels

**Built in F20, live from F24** (dark until then: the loop plays only with `VITE_FARM_LOOP=1`, D29). Farming is
hands-on (FC8): you buy seeds at the shop, tap a plot to plant and a Ready plot to harvest, and an Uma who tends a block
makes it grow faster and better. Harvests give seeds back now and then, and every harvest raises the crop's level on the
farm. This page is the Fields as built. The rules are in `@farm/domain` (`fields/crops.ts`, `fields/fields.ts`, night
steps 2 and 7 in `night/end-day.ts`, the shop's seeds in `save/shop.ts`); the screens in `apps/web/src/loop/`
(`FieldsPage.tsx`, `FieldsPeek.tsx`, `fields-view.ts`). The spec is [core-spec.md](../design/core-spec.md) CS11 and
CS12, with CS4, CS26, CS28, CS30 and CS31; the calls are D34.

```
 the farm map                    /?peek=fields (the quick look)           /fields (the page)
 ┌───────────┐  tap   ┌──────────────────────────────┐  Open  ┌──────────────────────────────────┐
 │  Fields   │ ─────► │ (face) Block A  9 growing · … │ ─────► │ Block A   Tended · 1.25 a night   │
 │ ◔ ◔ Ready │        │  —     Block B  Farm Rank 2 · │        │ [Plant all] [Harvest all · 3]     │
 └───────────┘        │ [Harvest all · 3] [Open the  │        │ (face) Name · Novice · B · Farming│
  pips: a block's      │                    Fields]   │        │        [Stop] [Change]            │
  tender, ringed by    └──────────────────────────────┘        │ ┌────┐┌────┐┌────┐                │
  its growth                                                    │ │ +  ││ Ca ││ Ca │  empty, growing  │
                                                                │ │    ││ 2n ││Rdy │  (nights left),  │
                                                                │ └────┘└────┘└────┘  Ready          │
 the night                                                      │ … three rows of three              │
 step 2  growCrops   each growing plot + its block's rate       │ Block B   Opens at Farm Rank 2    │
                     growth ≥ days − 0.5 → Ready                │           [Buy · 800g]            │
 step 7  witherCrops a season's last night: growing crops       └──────────────────────────────────┘
                     that don't grow next season wither
```

## The crops (CS11)

27 crops: 22 from the shop and 5 rare ones (their seeds come from expeditions, requests and prizes, M5–M6). "Days" is
untended · tended by a Novice · tended by an Expert, derived from the untended days by CS12's rule (a test checks every
row against CS11's printed columns). Yield is crops a plot, each harvest. Price ★1 is the crop's own (F19,
[goods.md](goods.md#the-crops-own-prices-cs11)); the refined form is made at its station (F22, [gathering.md](gathering.md#the-stations-cs18-decisions-2-and-6)).

<!-- live:crops -->
| Crop | Id | Seasons | Shop | Seed | Days: untended · Novice · Expert | Yield | Regrows | Price ★1 | Refined at |
|---|---|---|---|---|---|---|---|---|---|
| Carrot | `carrot` | Spring | FR1 | 20g | 4 · 3 · 3 | 1 | — | 60g | — |
| Potato | `potato` | Spring | FR1 | 35g | 6 · 5 · 4 | 2 | — | 55g | — |
| Mint | `mint` | Spring | FR1 | 40g | 4 · 3 · 3 | 1 | every 3 | 45g | Dried Mint (Sawmill) |
| Onion | `onion` | Spring, Autumn | FR2 | 30g | 5 · 4 · 3 | 1 | — | 100g | — |
| Cabbage | `cabbage` | Spring, Winter | FR2 | 90g | 8 · 6 · 5 | 1 | — | 260g | — |
| Asparagus | `asparagus` | Spring | FR4 | 150g | 10 · 8 · 7 | 1 | — | 480g | — |
| Tomato | `tomato` | Summer | FR1 | 50g | 7 · 6 · 5 | 1 | every 3 | 70g | — |
| Basil | `basil` | Summer | FR1 | 40g | 4 · 3 · 3 | 1 | every 3 | 45g | Dried Basil (Sawmill) |
| Bell Pepper | `bell-pepper` | Summer | FR1 | 60g | 6 · 5 · 4 | 1 | every 3 | 60g | — |
| Eggplant | `eggplant` | Summer | FR2 | 70g | 6 · 5 · 4 | 1 | every 4 | 95g | — |
| Sunflower Seed | `sunflower-seed` | Summer | FR2 | 70g | 8 · 6 · 5 | 3 | — | 75g | Sunflower Oil (Mill) |
| Corn | `corn` | Summer, Autumn | FR4 | 80g | 9 · 7 · 6 | 1 | every 4 | 140g | Cornmeal (Mill) |
| Wheat | `wheat` | Autumn | FR1 | 25g | 5 · 4 · 3 | 2 | — | 40g | Wheat Flour (Mill) |
| Peanut | `peanut` | Autumn | FR1 | 30g | 4 · 3 · 3 | 2 | — | 35g | Peanut Butter (Mill) |
| Rice | `rice` | Autumn | FR1 | 35g | 6 · 5 · 4 | 2 | — | 50g | Polished Rice (Mill) |
| Sugar Beet | `sugar-beet` | Autumn | FR2 | 40g | 6 · 5 · 4 | 1 | — | 120g | Beet Sugar (Mill) |
| Emperor Pumpkin | `emperor-pumpkin` | Autumn | FR4 | 250g | 10 · 8 · 7 | 1 | — | 600g | — |
| Buckwheat | `buckwheat` | Winter | FR1 | 30g | 4 · 3 · 3 | 1 | — | 75g | Buckwheat Flour (Mill) |
| Oats | `oats` | Winter | FR1 | 25g | 5 · 4 · 3 | 2 | — | 40g | Rolled Oats (Mill) |
| Barley | `barley` | Winter | FR1 | 30g | 5 · 4 · 3 | 2 | — | 45g | Pearl Barley (Mill) |
| Rye | `rye` | Winter | FR2 | 40g | 6 · 5 · 4 | 2 | — | 60g | Rye Flour (Mill) |
| Ginger | `ginger` | Winter | FR4 | 120g | 9 · 7 · 6 | 2 | — | 200g | Ground Ginger (Sawmill) |
| Golden Carrot | `golden-carrot` | Spring | Rare | — | 6 · 5 · 4 | 1 | — | 600g | — |
| Sunwheat | `sunwheat` | Summer | Rare | — | 7 · 6 · 5 | 2 | — | 260g | Sunwheat Flour (Mill) |
| Moonrice | `moonrice` | Autumn | Rare | — | 7 · 6 · 5 | 2 | — | 240g | Moonrice Flour (Mill) |
| Wild Rice | `wild-rice` | Summer | Rare | — | 6 · 5 · 4 | 2 | — | 160g | Hulled Wild Rice (Mill) |
| Mandrake | `mandrake` | Winter | Rare | — | 8 · 6 · 5 | 1 | — | 520g | Mandrake Powder (Sawmill) |
<!-- /live -->

## The shop's seeds (CS4; decision 8)

The shop sells the season's six seeds, the first three from Farm Rank 1, the next two from FR2 and the last from FR4.
A line shut by its rank still shows, with "From Farm Rank 2". The list changes on a season's first day (that's "the shop
restocks"), and it never runs out. Onion sells in Spring and Autumn, Cabbage in Spring and Winter, and Corn in Summer
only, though it grows on into Autumn.

<!-- live:shop-seeds -->
| Season | Farm Rank 1 | Farm Rank 2 | Farm Rank 4 |
|---|---|---|---|
| Spring | Carrot 20g, Potato 35g, Mint 40g | Onion 30g, Cabbage 90g | Asparagus 150g |
| Summer | Tomato 50g, Basil 40g, Bell Pepper 60g | Eggplant 70g, Sunflower Seed 70g | Corn 80g |
| Autumn | Wheat 25g, Peanut 30g, Rice 35g | Sugar Beet 40g, Onion 30g | Emperor Pumpkin 250g |
| Winter | Buckwheat 30g, Oats 25g, Barley 30g | Rye 40g, Cabbage 90g | Ginger 120g |
<!-- /live -->

`shopLines(save)` gives the season's lines (`seedLines`), `buy` spends gold through `spendGold` and puts the seeds in the
Warehouse at ★1. The app re-reads the shop's lines as it buys, so a sheet left open past a season's turn can't buy last
season's seeds.

## Blocks (CS12)

Four blocks of nine plots. Block A is tilled on day 1; the others are bought on the Fields' page once the Farm Rank is
reached (`buyBlock`: `locked` before the rank, `no-gold` when short, `bad-slot` if it's the farm's already). Blocks stay
in A–D order in the save.

<!-- live:blocks -->
| Block | Plots | Opens at | Costs |
|---|---|---|---|
| A | 9 | Day 1 | — |
| B | 9 | Farm Rank 2 | 800g |
| C | 9 | Farm Rank 4 | 3,000g |
| D | 9 | Farm Rank 6 | 8,000g |
<!-- /live -->

## Planting and harvesting (CS12; decisions 3–5, 7, 9, 10)

| Rule | What it does |
|---|---|
| `plant(save, block, plot, seed)` | Plants one seed, `seed-<crop>` (the shop's) or `seed-<crop>-own`, in an empty plot. **In season only** (`out-of-season`, "Tomato grows in Summer."); the seed leaves the Warehouse (`no-items`); a planted plot refuses (`bad-slot`) |
| `plantAll(save, block, crop)` | Every empty plot of a block with one crop, **own seeds first**, then the shop's, until the plots or the seeds run out |
| `harvest(save, block, plot)` | A Ready plot (`not-ready` otherwise): each crop draws its stars into the Warehouse, a seed may come back, the crop gains its points, the tender her challenge's count, and the plot empties or regrows. Returns a receipt: crops by star, seeds back, plots |
| `harvestAll(save, blocks?)` | Every Ready plot of the given blocks (Harvest all), every block by default (the map's Collect all and the quick look's Harvest all) |

- **What counts (decision 10):** `crops[id]` gets an entry (0 points) the first time a kind is planted, so "a second kind
  of crop" is two entries (chapter 1's goal 4, F24); `farm.counts['plots-planted']` and `farm.counts['plots-harvested']`
  rise a plot at a time (goal 1 reads the second).
- **Stars (decision 4):** one draw a crop, `draw(uid, day, 'harvest:<block>:<plot>', n)` with the plot's index 0–8 and
  `n` the crop's number in the harvest; seeds back is `draw(uid, day, 'seeds:<block>:<plot>', 0)`. So a harvest replays
  the same on every device (CS8).
- **The tender at harvest (decision 3):** the stars and the challenges read the block's tender when it's harvested; a
  block with nobody on it is untended. CS53's plot holds nothing about who tended it.
- **Regrowing (decision 5):** Mint, Tomato, Basil and Bell Pepper regrow every 3 days, Eggplant and Corn every 4. After
  a harvest the plot keeps its crop, restarts at 0 and turns Ready again at *n* − 0.5, at the block's rate, so tending
  speeds regrowth as it speeds a first crop. **Out of its season a regrowing crop doesn't start again:** a Ready Tomato
  harvested on Autumn 1 leaves an empty plot.
- **None of these stamp `updatedAt`:** each tap is the player's change, stamped by the app (`change()` in
  `loop/actions.ts`).

## Tending (CS12, CS28, CS31; decisions 1 and 2)

The Fields' four slots tend one block each: a block's `tender` (CS53), not an uma-work job. She stays until moved,
across nights.

- **Busy both ways (decision 1):** a tender can't start an uma-work job (`startLoopJob`, `repeatLoopJob`,
  `restartLoopStopped` and a queue's add refuse with `busy`, "She tends Block A."), and an Uma with a running job can't
  tend (`setTender` refuses `busy`, "She's working."). One rule reads both: `isBusy(save, id)`, for the Fields' picker,
  F22's job sheet and F23's swaps. A tender of another block moves to the new one.
- **Who may tend:** an Uma home on the farm (`not-owned` otherwise).
- **A tender works a night only when her block has a growing plot (decision 2):** then she's in the night's
  `notes.tended`, for farming's rank points (F21), and has work for "All set" (F18's nudge). Tending an empty or
  all-Ready block is idle.
- **Her terms:** her farming rank from the save (`ranks.farming.rank`) and her farming talent, master data's Stamina by
  F21's rule ([ranks.md](ranks.md)). The night reads it through `NightContext.talentOf`, and the app's harvests
  (`harvestPlot`, `harvestBlock`, `harvestFields`, Collect all) wait for master data and pass it to the rules' `talentOf`
  hook; the rules default to D, for tests. Her rank's terms come from CS31's table (`rankBenefits`).

**Growth a night (CS12):** untended **1**; tended **(her rank's 1.25 … 1.75 + the talent's) × (1 + 0.1 a Watering Can tier
above Basic) × 1.25 well fed**. A crop is **Ready once its growth reaches its days − 0.5**, so tending rounds to the
nearest night: a 4-day Carrot takes 3 nights tended and 4 untended, a 10-day Asparagus 8 at Novice and 7 at Expert.
Growth is kept to a millionth with a hair of slack, so 3 × 1.35 reaches 4.05.

**Quality (CS26), farming:** the tender's rank (`rankQuality`, 0.5 a rank), her talent (`talentQuality`, G −0.75 … S +1), **+0.25 for being tended**,
the crop's level (+0.1 a level above 1), the Hoe (+0.25 a tier above Basic) and well fed (+0.25). Untended, only the
crop's level and the Hoe count. Stars draw by F19's rule (`drawStars`).

**Seeds back (CS11, CS31):** each harvested plot drops one own seed of its crop with a chance of **5% untended**, or the
tender's **10% at Novice, +5% a rank (35% at Legend)**, and +5% a Hoe tier above Basic either way.

**Tools are Basic in M4** (the Forge is M6), so the Watering Can and the Hoe add nothing yet; their terms are in the
rule at tier 1.

<!-- live:tending -->
| Tender | Growth, G | Growth, D | Growth, C | Growth, B | Growth, A | Growth, S | Stars, a D tender | Seeds back |
|---|---|---|---|---|---|---|---|---|
| Untended | 1 | 1 | 1 | 1 | 1 | 1 | ★1 100% | 5% |
| Novice | 1.25 | 1.25 | 1.25 | 1.3 | 1.35 | 1.4 | ★1 75%, ★2 25% | 10% |
| Hand | 1.35 | 1.35 | 1.35 | 1.4 | 1.45 | 1.5 | ★1 25%, ★2 75% | 15% |
| Skilled | 1.45 | 1.45 | 1.45 | 1.5 | 1.55 | 1.6 | ★2 75%, ★3 25% | 20% |
| Expert | 1.55 | 1.55 | 1.55 | 1.6 | 1.65 | 1.7 | ★2 25%, ★3 75% | 25% |
| Master | 1.65 | 1.65 | 1.65 | 1.7 | 1.75 | 1.8 | ★3 75%, ★4 25% | 30% |
| Legend | 1.75 | 1.75 | 1.75 | 1.8 | 1.85 | 1.9 | ★3 25%, ★4 75% | 35% |
<!-- /live -->

## Crop levels (CS11, FC8)

Each crop kind has a level 1–10 on the farm, from its points in `crops`. Every harvested plot adds **1 point, or 2 if it
was planted from own seeds** (a regrowing plot keeps its seed's kind, so each of its harvests counts the same). Level
*L* → *L* + 1 takes **20 × L** points. Each level adds **+0.1 quality** (and +2 at the Flower Show, M6). A harvest's
stars use the crop's level before its own points are added.

<!-- live:crop-levels -->
| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 20 | 60 | 120 | 200 | 300 | 420 | 560 | 720 | 900 |
| Quality | +0 | +0.1 | +0.2 | +0.3 | +0.4 | +0.5 | +0.6 | +0.7 | +0.8 | +0.9 |
<!-- /live -->

## Farming's challenges (CS30)

Counted at harvest for the block's tender, toward her next farming rank, in `ranks.farming.challenge`, by F21's
`countChallenge(save, tender, 'farming', { kind: 'harvest', stars, level })`; the count stops at the target and resets
at the rank-up, which comes at night ([ranks.md](ranks.md#the-challenges-cs30-decision-1)). "Crops" are crops
harvested, not plots: a Potato plot counts 2.

<!-- live:farming-challenges -->
| Toward | Challenge | Counted |
|---|---|---|
| Hand | Harvest 30 crops she tended | At harvest, for the tender (F20) |
| Skilled | 40 crops of ★3+ she tended | At harvest, for the tender (F20) |
| Expert | Tend a crop of level 4+ to harvest | At harvest, for the tender (F20) |
| Master | 30 crops of ★5 | At harvest, for the tender (F20) |
| Legend | 1st at a Flower Show with a crop she tended | M6 (F32) |
<!-- /live -->

## The night (CS7 steps 2 and 7; CS4's last night)

- **Step 2, `growCrops`:** every planted plot that isn't Ready grows by its block's rate; a plot reaching its days − 0.5
  turns Ready. Ready plots stop growing and wait. The night's notes get `tended` (tenders with a growing plot) and
  `ripened` (plots that turned Ready, by block).
- **Step 7, `witherCrops`, before `turnCalendar` (decision 6):** on a season's last night, every crop still growing
  (regrowing ones too) that doesn't grow in the next season withers, and its plot empties; Ready crops wait. **Only Corn
  (Summer → Autumn) and Cabbage (Winter → Spring) carry over.** CS4 names Onion with them, but Onion grows in Spring and
  Autumn, which don't join, so a growing Onion withers at both seasons' ends. The notes get `withered`, by block and
  crop.

**The morning summary** ([days.md](days.md#the-morning-summary-cs5-decision-11)):

| Section | Line | Words | A tap goes to |
|---|---|---|---|
| Work done | `{ kind: 'crops', block, plots }`: plots that turned Ready overnight | "Block A · 9 crops ready" | the Fields |
| Work done | `{ kind: 'withered', block, crop, plots }` | "Block A · 3 Onion withered" | the Fields |
| Today | `{ kind: 'seeds', plots }`: empty plots the seeds held could fill today | "9 plots to plant" | the Fields |

Work done lists jobs by place, then crops ready by block, then what withered, in block order. The parse refuses a plot
count outside 1–9 (1–36 for the nudge), an unknown block or crop, and a line twice.

## The screens (decision 11)

- **The farm map:** a tap on the Fields opens their quick look (`/?peek=fields`, `PLACE_SCREENS`). Their pips are one a
  block: its tender's face, ringed by the block's growth toward Ready (Ready once a plot is), or a free dot when nobody
  tends it. A Ready plot puts **Ready** on the Fields, and **Collect all** counts Ready plots with finished jobs and
  harvests every block (`collectFarm`). The Menu's Fields row counts Ready plots.
- **The quick look:** a row a block, its tender's face (or a dash, or a lock), "9 growing · ready in 2 nights", "3
  ready", "Empty", or a locked block's "Farm Rank 2 · 800g"; **Harvest all · 3** on every block, and **Open the
  Fields**.
- **The Fields' page** (`/fields`): the farm's own, not uma-kit/work's slot rows. Four block cards, A to D:
  - an owned block: "Block A", "Tended · 1.25 a night" (or "Untended · 1 a night"), **Plant all** while a plot is empty
    and **Harvest all · 3** while one is Ready; its tender's row (face, name, "Novice · B · Farming": her farming rank
    and talent, F21), **Stop** and
    **Change**, or "No tender · Grows 1 a night, at ★1" with **Tend**); and a 3 × 3 grid of plots;
  - a plot: empty (a dashed "+"; a tap plants), growing (the crop's icon, "2 nights" and a growth bar; a tap shows it),
    or Ready (the icon and **Ready**; a tap harvests, and the page says "+2 Potato · 1 seed back"). A green dot marks a
    plot from own seeds;
  - a locked block: "Opens at Farm Rank 2", or "Need 300g more", with **Buy · 800g**.
- **The plant sheet** (`?plant=A.4`, or `?plant=A` for Plant all): each seed held that plants today, own seeds first,
  with its count, "Ready in 4 nights untended" and its yield and regrowth; Plant all lists each crop with all its seeds.
  With none: "No seeds for Spring." and **Shop**.
- **A growing plot's sheet** (`?plot=A.4`): its crop, "Ready in 2 nights", regrowing and own seeds, who tends it and the
  block's rate, its yield and regrowth.
- **The tender's picker** (`?tend=A`): uma-kit's `UmaPicker` over the Umas home, each with her farming rank and talent
  ("Hand · B", F21) or "Tends Block B", her favourite line's mark and best talent on her face, the roster's filters, and
  farming's sorts; it opens by farming (rank, points, talent). A working Uma shows "Working" and can't be picked.
  Picking a tender of another block moves her ([ranks.md](ranks.md#the-screens-decision-7)).
- **Seeds' icons** are their crop's with a plain corner tag (brown from the shop, green for own seeds) until F25's
  seed-packet badge.
- Every sheet is a search parameter, so Back closes it. The rules sit behind the header's (i). The page, its rules and
  the crop table load on demand in the loop's build only (`LAZY_MODULES`).
