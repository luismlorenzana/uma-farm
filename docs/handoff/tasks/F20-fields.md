# F20 — The Fields: plots, seeds, tending, crop levels

**uma-farm · Claude · M · Needs: F18, F19 · Beside: F22 · Unblocks: F24 · Milestone M4, the loop on today's map**

## Why

Farming is hands-on (FC8): you buy seeds, tap a plot to plant and tap it to harvest, and an Uma who tends a block makes
it grow faster and better. Crops are the first thing the player does on day 1 and chapter 1's first goal. This packet
builds the Fields whole: the four blocks, planting and harvesting, tending and growth, regrowing, seeds back, crop
levels, withering, and the shop's seeds by tier.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS11, CS12**; CS4 (the season's seeds, shop tiers, the last night),
  CS3 (day 1), CS7 (steps 2 and 7), CS26 (farming's quality terms), CS28 and CS31 (what talent and rank give a tender),
  CS30 (farming's challenges), CS42 (chapter 1's goals 1 and 4), CS53 (`fields`, `crops`, `Plot`), CS55.
- [core-loop.md](../../design/core-loop.md): **FC8**, FC4, FC10.
- [decisions.md](../../decisions.md): D25, D27, D28 (crops take 4–10 days).
- The manual: [days.md](../../game/days.md) (F18) and [goods.md](../../game/goods.md) (F19).
- Code: F17's v3 (`fields`, `crops`, seeds as `seed-<crop>` and `seed-<crop>-own`, `spendGold`, `draw`,
  `farmRankOf`, `farm.counts`); F18's `endDay` steps 2 and 7, the nudge (`daySetState`), the map and the summary;
  F19's `drawStars`, `quality`, the shop's sheet, the catalogue; F21's rank and talent terms (if landed:
  `growthOf`, `seedsBackOf`, `qualityOf`, `countChallenge`); `apps/web/src/places/` (a place's page) and
  `wilds/WildsScreen.tsx`'s quick looks.

## Decisions made

### From the spec

- **The crops (CS11):** CS11's table is the data, row for row: 27 crops (22 from the shop, 5 rare from expeditions,
  requests and prizes), each with its id, season or seasons, shop tier (FR1, FR2, FR4 or rare), seed price, **days
  untended**, yield per plot per harvest, regrowth (every *n* days or none), price ★1, and its station's refined form
  (F22's). The Novice and Expert day columns follow from CS12's rule, and a test checks every row (Carrot 4 · 3 · 3,
  Potato 6 · 5 · 4, Asparagus 10 · 8 · 7).
- **The shop's seeds by season and tier (CS4):** the first three of a season from Farm Rank 1, the next two from FR2,
  the last from FR4.

  | | FR1 | FR2 | FR4 |
  |---|---|---|---|
  | Spring | Carrot, Potato, Mint | Onion, Cabbage | Asparagus |
  | Summer | Tomato, Basil, Bell Pepper | Eggplant, Sunflower | Corn |
  | Autumn | Wheat, Peanut, Rice | Sugar Beet, Onion | Emperor Pumpkin |
  | Winter | Buckwheat, Oats, Barley | Rye, Cabbage | Ginger |
- **Blocks (CS12):** four of 9 plots: **A** on day 1; **B** at Farm Rank 2 for 800g; **C** at FR4 for 3,000g; **D** at
  FR6 for 8,000g.
- **Planting and harvesting (CS12):** tap a plot to plant a seed from the Warehouse; tap a Ready plot to harvest;
  **Plant all** and **Harvest all** do a block. Any crop in season goes in any plot.
- **Tending (CS12, CS28, CS31):** the Fields' four slots tend one block each. A tended block grows **1.25 a night at
  Novice, +0.1 a rank** (1.35, 1.45, 1.55, 1.65, **1.75 at Legend**), **+0.05 / 0.10 / 0.15 for a B / A / S** farming
  talent, ×(1 + 0.1 a Watering Can tier above Basic), ×1.25 well fed. **Untended blocks grow 1 a night**, at ★1 (only
  the crop level and the Hoe lift them).
- **Ready at days − 0.5:** a crop is Ready once its growth reaches its untended days − 0.5, so a 4-day Carrot takes 3
  nights tended and a 10-day Asparagus 8 at Novice and 7 at Expert.
- **Regrowing crops** turn Ready again every *n* days after the first harvest, until they wither.
- **Seeds back (CS11):** each harvested plot drops one seed of its crop with a chance of **5% untended**, or the
  tender's **10% (Novice) to 35% (Legend)**, +5% a rank (CS31), **+5% a Hoe tier**. Seeds back are own seeds and plant
  like shop seeds.
- **Crop level (CS11, FC8):** each crop kind has a level 1–10 on the farm. Every harvested plot adds **1 crop point**
  (**2** if planted from own seeds). Level *L* → *L* + 1 takes **20 × L** points: level 2 at 20, 3 at 60, 4 at 120,
  5 at 200, 10 at 900. Each level adds **+0.1 quality** (and +2 at the Flower Show, M6).
- **Quality (CS26), farming:** the tender's rank (0.5 × rank) and talent (G −0.75 … S +1), +0.25 for being tended,
  +0.1 × (crop level − 1), the Hoe +0.25 a tier, well fed +0.25. Stars draw by F19's rule.
- **A season's last night (CS4, CS7 step 7):** crops still growing that don't grow in the next season **wither**;
  Ready crops wait to be harvested.
- **Tools are Basic in M4** (the Forge is M6), so the Watering Can and the Hoe add nothing yet; the terms are in the
  rule with tier 1.
- **Farming's challenges (CS30)** this packet counts: Hand, harvest 30 crops she tended; Skilled, 40 crops of ★3+ she
  tended; Expert, tend a crop of level 4+ to harvest; Master, 30 crops of ★5 (Legend's is the Flower Show, M6).

### Decided here (the spec left these open)

1. **Tending is the block's `tender` (CS53), not an uma-work job.** Slot *k* of the Fields is block A, B, C or D; the
   tender stays until moved, across nights. She's busy both ways: a tender can't start an uma-work job, and an Uma with a
   running job can't tend. The picker and the nudge read one `isBusy(save, id)`.
2. **A tender works a night only when her block has a growing plot.** Then she earns farming's day of rank points
   (F21's step 6) and counts as having work for "All set"; tending an empty or all-Ready block is idle.
3. **Stars and challenges read the tender at harvest:** a plot's stars use the block's tender when it's harvested (none
   is untended), and "she tended" means she was its tender then. No new field: CS53's plot stays as it is.
4. **One star draw per item:** a harvest of *y* items draws each one, `draw(uid, day, 'harvest:<block>:<plot>', n)`.
5. **Regrowth uses the block's growth rate:** a regrowing plot restarts at 0 and is Ready at *n* − 0.5, so tending
   speeds it as it speeds a first crop.
6. **Only Corn and Cabbage carry over.** CS4's bullet names Onion with them, but CS11 and the shop put Onion in Spring
   and Autumn only, which don't join; so a growing Onion withers at both seasons' ends. Corn carries Summer → Autumn and
   Cabbage Winter → Spring.
7. **Planting is in season only,** and from the season's list: a seed out of season stays in the Warehouse.
8. **The shop doesn't run out:** "the shop restocks" (CS7 step 7) means the season's list changes on its first day; no
   stock limits in M4.
9. **Own seeds plant first:** Plant all takes own seeds of the chosen crop before shop seeds, so crop points come
   faster; a single plant offers both when both are held.
10. **What it counts:** `crops[id]` gets an entry (0 points) the first time a kind is planted, so "a second kind" is two
    entries; `farm.counts['plots-harvested']` and `farm.counts['plots-planted']` rise with each plot (chapter 1's goals 1
    and 4, F24).
11. **The Fields' page** is the farm's own, not uma-kit/work's slot rows: four block cards (a locked one shows its cost
    and Farm Rank, with **Buy · 800g**), each with its tender's row and a 3 × 3 grid of plots. A plot shows its crop's
    icon, the nights left, or Ready; a tap plants, shows, or harvests. Seeds' icons are the crop's with F25's
    seed-packet badge (a plain corner tag until then).

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

The plant sheet's drawing; how the tender is picked (uma-kit's picker over the Umas home, as F18's rows give them).
If F21 hasn't landed, use Novice and talent D for the tender and wire F21's terms when it does.

## Do

1. **The crop data** (CS11, the shop's tiers) in `@farm/domain`, with the derived-days test.
2. **The rules:** `plant`, `plantAll`, `harvest`, `harvestAll`, `setTender`, `buyBlock`, and night steps 2 (growth,
   Ready, regrowth) and 7's withering, each with tests. Seeds back, crop points and levels, stars, challenge counts
   (through F21's `countChallenge`) and `farm.counts` on harvest.
3. **The shop's seeds** in F19's sheet: the season's list by tier, locked tiers saying their Farm Rank.
4. **The screens:** the Fields' page (decision 11), the Fields' quick look and pips (tenders' faces), Ready plots in
   the map's badge and Collect all (Harvest all on every block), the summary's "crops ready by block" and "withered"
   lines and the "empty plots with seeds" nudge.
5. **The manual:** a new [docs/game/fields.md](../../game/fields.md) with live blocks (the crops table, the shop's
   seeds by season and tier, growth by rank and talent, crop levels) and hand-written rules ("built in F20, live from
   F24"); its row in [the manual's index](../../game/README.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks are ≤ 180 KB gzip; the private-content guard passes.
- Domain tests:
  - every crop's Novice and Expert days follow from its untended days by CS12's rule;
  - a Carrot planted on day 1 and tended by a Novice is Ready on day 4's morning; untended, on day 5's;
  - a Tomato regrows every 3 days and withers on Summer's last night unless Ready; a growing Corn carries into Autumn;
    a growing Onion withers at Spring's end;
  - seeds back land at 5% untended and 10% for a Novice tender over a seeded sample; own seeds give 2 crop points;
    level 2 comes at 20 points and level 5 at 200;
  - the stars' shares match CS26 for an untended level-1 crop (always ★1) and a Novice D tender (★1 75%, ★2 25%);
  - Block B is refused before Farm Rank 2 and without 800g; a tender can't take a job, and a working Uma can't tend;
  - the shop sells Spring's tier-1 seeds at FR1 and refuses Asparagus before FR4.
- `pnpm docs:update` leaves `fields.md` unchanged.
- Locally (loop build) at 390×844: on a new save, plant the 9 Carrot seeds with Plant all, set a tender, end the day
  three times, Harvest all; the Warehouse holds the carrots by stars; buy Potato seeds at the shop and plant them; ship
  a carrot and see it paid in the morning.
- Production: the deploy passes, health shows the commit, and https://uma-farm.web.app plays the Wilds as before.

## Deliver

Commit to `main` (`feat: the Fields, plots, seeds and tending (F20)`, `git status` first), push, and watch the run
(`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a Done
row in [the handoff](../README.md) with the run's link, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–11.
