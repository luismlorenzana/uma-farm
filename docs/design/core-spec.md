# uma-farm: the core spec

> **Status: drafted 2026-11-08 (D27), F7's rewrite.** The owner accepted [core-loop.md](core-loop.md) whole (FC1–FC34,
> D26) on [hd2d-farm.md](hd2d-farm.md) (FR1–FR24, D21). This spec turns those calls into numbers and rules that M4's
> packets can be built from: every price, day, yield, rank, cost and reward, worked. Calls are **CS1–CS55**, each one
> decided; there are no questions for the owner. Visual page: [previews/core-spec.html](previews/core-spec.html).
>
> - **It supersedes [spec.md](spec.md)** (FS1–FS32): gold, the requests board and the workshops replace its orders, its
>   no-currency economy and its smithing Forge. Its economy analysis (§3) and minigame contract carried into §3, §4 and
>   §11 here.
> - **Time is turns (D25):** every number is in farm days. Nothing moves while the app is closed.
> - **Goods use the farm's own names,** and 366 of the 370 goods in the catalogue already have an icon in uma-art 2.21.0.
> - **No original-game content:** talents come from master data's stats by one rule; only aggregate counts and cut-offs
>   are written here. The town's cast is original; Umas appear in roles filled in at runtime.
> - **The numbers are checked by a sim** of the first year (§11): 30 runs of a sensible player, every number in this
>   doc as its input.

## The short answer

- **Day 1:** you pick 3 Umas from 6, with 500g, one block of 9 plots, 9 free Carrot seeds, the Woods and the Pond
  (CS2, CS3).
- **The calendar:** 4 seasons of 12 days. Each season sets the seeds, the fish, the forest's fruit, nuts or sweets, the
  goods in demand (+20%) and its festival on day 10 (CS4). **End the day** settles the night in nine fixed steps, and the
  morning opens on a summary (CS5–CS7).
- **One price rule:** a ladder of ten grades (30g to 300g, by family), refined goods ×1.5, made goods and dishes ×1.25
  their inputs, and **+25% a star**, not compounded (CS9, CS26).
- **Work in days:** a gatherer brings home 3–5 items a day at Novice, up to twice that at Legend. Stations turn 8 items
  a day. Crops take 4–10 days, faster when tended (CS11–CS18).
- **Talents S–G** from her 5★ stat × her growth rate, cut at 150/138/126/114/104/96/88, the same for everyone (CS27).
  **Six ranks** at 40/160/400/900/2,000 points, 10 a day of work: Hand in about 4 days, Skilled in 2 weeks, Expert by
  the end of year 1, Master in year 2, Legend in year 3 or 4 (CS29–CS31).
- **The roster:** the Dorm grows 3 → 60 beds for 520,000g in all; visitors come every fourth day while a bed is free,
  and from chapters, festivals and requests (CS34–CS36).
- **Goals:** a requests board, the Diary, ten Farm Ranks and five festivals against two rival farms; chapter 1's six
  goals and two scenes are written out (CS37–CS43).
- **The first year, worked (medians of 30 runs):** gold **2,871 at day 12, 8,945 at day 24, 56,025 at day 48**; about
  303,000g earned; **20 Umas**, Farm Rank 6, chapters 1–5 done, 3 Experts. Never stingy, never runaway (§11).
- **M4 is nine packets, F17–F25** (CS55): the save, the calendar, goods and the bin, fields, talents and ranks, the
  Woods and the Pond with three stations, the roster, Farm Rank and chapter 1, and their art.

## 0. Conventions (CS1)

**CS1: the units.**

| Unit | Rule |
|---|---|
| A **farm day** | One turn, ended by the player. Day 1 is Spring 1, year 1. Day *d* is year ⌈*d*/48⌉, season ⌊((*d*−1) mod 48)/12⌋, day ((*d*−1) mod 12) + 1 |
| **Gold** (g) | Whole numbers. Prices round to 5g, rewards to 10g |
| **Stars** (★) | 1–5 on every crop, product, catch, refined good and dish (CS26) |
| **Grades** (G1–G10) | A family's ten items, in uma-art's own order (`items/atlas.json`); a grade sets the price ladder |
| **Seeded draws** | Every random number comes from a seed of the account, the day and what's drawn (`hash(uid, day, slot, n)`), so a night settles the same way however often it's replayed (CS8) |
| **Rounding** | Counts round half up (`Math.round`), never below 1 for a job that ran |

## 1. The start (CS2–CS3)

**CS2: three starting picks, from six.** The first boot shows **six candidates**, each a face card with her three day-1
talents (farming, foraging, fishing) and her favourite line. You **pick any three**. One free **redraw** replaces all
six. The six are a seeded draw from the whole release, nudged so the sheet always holds a C-or-better farmer, forager
and fisher (redrawing a card that would leave a gap). They become "your first hands" in chapter 1's scene.

**CS3: day 1.**

| What | Day 1 |
|---|---|
| Gold | **500g** |
| Seeds | **9 Carrot seeds** (from Old Ben, in the opening scene) |
| Fields | **Block A**, 9 plots, tilled |
| Places open | **The Fields, the Woods** (Forest), **the Pond** (Fishery) |
| The yard | The shipping bin, the Dorm (level 1, 3 beds), the Warehouse, the Gate |
| The town edge | The shop (Spring's tier-1 seeds: Carrot, Potato, Mint); the festival ground (the Flower Show on day 10) |
| Locked, with what opens them | Block B (Farm Rank 2), the Mill (chapter 1), the Sawmill and the Smokehouse (Farm Rank 3), the Coop (chapter 2), the Mine and the Quarry (chapter 3), the Kitchen (chapter 4), the expedition post (chapter 5), the Restaurant (chapter 6), the Forge and the sea (chapter 7) |
| Chapter | Chapter 1 opens with its scene (CS42) |

In M4 the festival ground, the requests board and the Diary's screen show "Soon" (they come in M6, as FC32 orders);
everything else in the table plays.

A sensible first day: plant the 9 carrots, tend Block A with the best farmer, send one Uma to the Woods and one to the
Pond, end the day. The sim's day 1 to day 12 is in [§11](#11-the-economy-worked-cs51cs52).

## 2. The calendar (CS4–CS8)

**CS4: four seasons of 12 days.** The calendar shows the date, the season and the next festival in the account bar.

| | Spring (days 1–12) | Summer (13–24) | Autumn (25–36) | Winter (37–48) |
|---|---|---|---|---|
| **Seeds in the shop** | Carrot, Potato, Mint · Onion, Cabbage · Asparagus | Tomato, Basil, Bell Pepper · Eggplant, Sunflower · Corn | Wheat, Peanut, Rice · Sugar Beet, Onion · Emperor Pumpkin | Buckwheat, Oats, Barley · Rye, Cabbage · Ginger |
| **The forest's seasonal family** | Sweets (honeycomb, sugarcane…) | Fruits (apple, pear…) | Nuts and seeds (peanut, walnut…) | More mushrooms |
| **Fish** | Trout and salmon run | Eel, the Pond's rare koi | Salmon, silverfin at the Lake | Trout, silverfin |
| **In demand (+20% at the bin)** | Vegetables, sweets | Fruits, fish | Grains, mushrooms, nuts and seeds | Dishes, cloth, preserves |
| **Festival, day 10** | Flower Show | Fishing Derby | Cooking Contest | Animal Show; **Harvest Cup on day 12** |

- **A season's last night:** crops still growing that don't grow in the next season **wither**. Ready crops wait to be
  harvested. Corn (Summer–Autumn), Onion (Spring–Autumn) and Cabbage (Spring, Winter) carry over where the seasons join.
- **Shop tiers:** the first three seeds of each season from Farm Rank 1, the next two from FR2, the last from FR4.

**CS5: the morning summary.** It opens after every night, one card, in this order, each line a tap to its place:
1. **The bin:** yesterday's sales by item (count, stars, gold) and the total, with the season's demand marked;
2. **Work done:** jobs finished by place, crops ready by block, animal products, an expedition home (its grade and log);
3. **Ranks:** rank-ups, and Umas whose points are full with their challenge named;
4. **Bonds and affinity:** new hearts, each with its conversation ("Read");
5. **New today:** visitors at the Gate, requests posted or leaving, a chapter scene, a festival today or tomorrow,
   the season's first day (new seeds, fish, demand), Diary entries and milestones;
6. **Today's nudges:** idle Umas, empty plots with seeds in the Warehouse, a workshop not played.

**CS6: the nudge.** End the day's button glows and shows "All set" when **every Uma on the farm has work, nothing
waits to be collected, and each open workshop has been played or lacks inputs**. Otherwise it shows a count badge (idle
Umas plus uncollected bubbles). Tapping it with something left opens a one-line sheet: "2 Umas idle · 3 to collect —
End anyway / Back". Menu has a switch to skip that sheet. The game never ends a day by itself.

**CS7: End the day settles the night, in this order.** One pass, one save write:

| Step | What happens |
|---|---|
| 1 | **The bin pays:** everything shipped today, at price × stars × demand (CS9) |
| 2 | **Crops grow:** each planted plot adds its block's growth (1 untended; the tender's rate, CS12); plots that reach their days turn Ready |
| 3 | **Animals:** fed from the Warehouse (feed bought at the shop), affection moves (CS13), products are laid by the morning |
| 4 | **Jobs move a day on:** uma-work's clock advances one day (`86,400,000` ms); finished jobs turn Ready; queues start their next job; expeditions advance and return |
| 5 | **Workshops reset:** each may be played again tomorrow |
| 6 | **Ranks, bonds and affinity tick:** rank points for every Uma who worked, bond points for pairs who shared, the well-fed days count down |
| 7 | **The calendar turns:** the date moves; on a season's last night out-of-season crops wither; the shop restocks |
| 8 | **Goals:** requests past due leave and new ones post; visitors come and go; chapter goals, Diary entries and milestones are checked; the Farm Rank is recomputed |
| 9 | **The morning summary** is built from what changed (CS5) |

Rank-ups and conversations from step 6 show in the morning, never mid-night. Ranks use the points after the night, so
a rank reached tonight speeds tomorrow's work.

**CS8: nights are seeded and replay the same.** Every draw (a floor's ore, a catch's size, a star, a visitor) comes
from `hash(uid, day, what, n)`. Ending a day twice from the same save, on two devices, gives the same morning, so a
sync conflict can never re-roll luck. The save holds no random state.

## 3. Goods (CS9–CS19)

### 3.1 Prices (CS9, CS10)

**CS9: one price rule.**

1. **The ladder:** a family's grade *g* sells at `LADDER[g] × the family's factor`, rounded to 5g.
2. **Refined** (a station's 1 → 1 output) sells at **×1.5** its input.
3. **Made goods and dishes** (the workshops) sell at **×1.25** the sum of their inputs at 1★.
4. **Crops** have their own prices (the table in CS11), so a crop found wild sells at its crop price.
5. **Stars** add **+25% a star**, not compounded: ★1 ×1, ★2 ×1.25, ★3 ×1.5, ★4 ×1.75, ★5 ×2 (D24 #12).
6. **Demand** adds **+20%** to the season's families (CS4), on top.

| Grade | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 |
|---|---|---|---|---|---|---|---|---|---|---|
| **The ladder** | 30 | 40 | 50 | 65 | 85 | 110 | 140 | 180 | 230 | 300 |

| Family | Factor | Where from | Family | Factor | Where from |
|---|---|---|---|---|---|
| Ores | ×1.0 | The Mine | Fruits | ×1.1 | The forest (Summer) |
| Stones | ×0.8 | The Quarry | Nuts and seeds | ×1.0 | The forest (Autumn) |
| Crystals | ×1.6 | The Quarry | Sweets | ×1.1 | The forest (Spring) |
| Woods | ×0.8 | The forest | Fish | ×1.3 | The Fishery |
| Mushrooms | ×1.0 | The forest | Hides and scales | ×1.5 | Expeditions |
| Herbs and spices | ×0.9 | The forest, some crops | Bones and horns | ×1.6 | Expeditions |
| | | | Essences | ×1.8 | Expeditions |

Worked: Silver Ore is ores G4: 65 × 1.0 = **65g**; a Silver Ingot 65 × 1.5 = 97.5 → **100g**; a 3★ Silver Ingot
100 × 1.5 = **150g**. A Salmon (fish G5) 85 × 1.3 = 110.5 → **110g**; in Summer, a 2★ Salmon sells for
110 × 1.25 × 1.2 = **165g**.

**CS10: the bin is the floor price.** It takes anything with a price at any time in the day and pays at night. The
requests board (×1.5), the Restaurant (+20–40% tips) and festival prizes pay more; nothing pays less. There's no
selling cap and no buying back.

### 3.2 Crops and the Fields (CS11, CS12)

**CS11: the crops.** 22 from the shop, 5 rare ones from expeditions, requests and prizes. "Days" is untended · tended
by a Novice · tended by an Expert (CS12's rule). Yield is per plot per harvest.

| Id | Crop | Season | In the shop | Seed | Days: untended · Novice · Expert | Yield | Regrows | Price ★1 | Refined at a station | Art |
|---|---|---|---|---|---|---|---|---|---|---|
| `carrot` | Carrot | Spring | FR1 | 20 | 4 · 3 · 3 | 1 | — | 60 | — | uma-art |
| `potato` | Potato | Spring | FR1 | 35 | 6 · 5 · 4 | 2 | — | 55 | — | uma-art |
| `mint` | Mint | Spring | FR1 | 40 | 4 · 3 · 3 | 1 | every 3 | 45 | Dried Mint (Sawmill) | uma-art |
| `onion` | Onion | Spring and Autumn | FR2 | 30 | 5 · 4 · 3 | 1 | — | 100 | — | uma-art |
| `cabbage` | Cabbage | Spring and Winter | FR2 | 90 | 8 · 6 · 5 | 1 | — | 260 | — | uma-art |
| `asparagus` | Asparagus | Spring | FR4 | 150 | 10 · 8 · 7 | 1 | — | 480 | — | uma-art |
| `tomato` | Tomato | Summer | FR1 | 50 | 7 · 6 · 5 | 1 | every 3 | 70 | — | uma-art |
| `basil` | Basil | Summer | FR1 | 40 | 4 · 3 · 3 | 1 | every 3 | 45 | Dried Basil (Sawmill) | uma-art |
| `bell-pepper` | Bell Pepper | Summer | FR1 | 60 | 6 · 5 · 4 | 1 | every 3 | 60 | — | uma-art |
| `eggplant` | Eggplant | Summer | FR2 | 70 | 6 · 5 · 4 | 1 | every 4 | 95 | — | uma-art |
| `sunflower-seed` | Sunflower | Summer | FR2 | 70 | 8 · 6 · 5 | 3 | — | 75 | Sunflower Oil (Mill) | uma-art |
| `corn` | Corn | Summer and Autumn | FR4 | 80 | 9 · 7 · 6 | 1 | every 4 | 140 | Cornmeal (Mill) | uma-art |
| `wheat` | Wheat | Autumn | FR1 | 25 | 5 · 4 · 3 | 2 | — | 40 | Wheat Flour (Mill) | uma-art |
| `peanut` | Peanut | Autumn | FR1 | 30 | 4 · 3 · 3 | 2 | — | 35 | Peanut Butter (Mill) | uma-art |
| `rice` | Rice | Autumn | FR1 | 35 | 6 · 5 · 4 | 2 | — | 50 | Polished Rice (Mill) | uma-art |
| `sugar-beet` | Sugar Beet | Autumn | FR2 | 40 | 6 · 5 · 4 | 1 | — | 120 | Beet Sugar (Mill) | uma-art |
| `emperor-pumpkin` | Emperor Pumpkin | Autumn | FR4 | 250 | 10 · 8 · 7 | 1 | — | 600 | — | uma-art |
| `buckwheat` | Buckwheat | Winter | FR1 | 30 | 4 · 3 · 3 | 1 | — | 75 | Buckwheat Flour (Mill) | uma-art |
| `oats` | Oats | Winter | FR1 | 25 | 5 · 4 · 3 | 2 | — | 40 | Rolled Oats (Mill) | uma-art |
| `barley` | Barley | Winter | FR1 | 30 | 5 · 4 · 3 | 2 | — | 45 | Pearl Barley (Mill) | uma-art |
| `rye` | Rye | Winter | FR2 | 40 | 6 · 5 · 4 | 2 | — | 60 | Rye Flour (Mill) | uma-art |
| `ginger` | Ginger | Winter | FR4 | 120 | 9 · 7 · 6 | 2 | — | 200 | Ground Ginger (Sawmill) | uma-art |
| `golden-carrot` | Golden Carrot (rare) | Spring | seeds from expeditions, requests, prizes | — | 6 · 5 · 4 | 1 | — | 600 | — | uma-art |
| `sunwheat` | Sunwheat (rare) | Summer | seeds from expeditions, requests, prizes | — | 7 · 6 · 5 | 2 | — | 260 | Sunwheat Flour (Mill) | uma-art |
| `moonrice` | Moonrice (rare) | Autumn | seeds from expeditions, requests, prizes | — | 7 · 6 · 5 | 2 | — | 240 | Moonrice Flour (Mill) | uma-art |
| `wild-rice` | Wild Rice (rare) | Summer | seeds from expeditions, requests, prizes | — | 6 · 5 · 4 | 2 | — | 160 | Hulled Wild Rice (Mill) | uma-art |
| `mandrake` | Mandrake (rare) | Winter | seeds from expeditions, requests, prizes | — | 8 · 6 · 5 | 1 | — | 520 | Mandrake Powder (Sawmill) | uma-art |

- **Seeds back:** each harvested plot drops one seed of its crop with a chance of **5% untended**, or the tender's
  **10% (Novice) to 35% (Legend)** plus 5% a Hoe tier. Seeds back are "own seeds" and plant like shop seeds.
- **Crop level (Rune Factory's idea, FC8):** each crop kind has a level 1–10 on your farm. Every harvested plot adds
  **1 crop point** (2 if planted from own seeds). Level *L* → *L*+1 takes **20 × L** points: level 2 at 20 plots,
  3 at 60, 4 at 120, 5 at 200, 10 at 900. Each level adds **+0.1 quality** (CS26) and **+2 at the Flower Show**.
- **Per plot, per season** (Spring, seed included): Carrot untended **10g a day**, tended by a Novice 16, by a Skilled
  Uma 23; Cabbage 14 · 34 · 50; Asparagus 28 · 33 · 48. Tending roughly doubles a plot's worth, and premium crops
  pay three times the cheap ones.

**CS12: blocks, plots and tending.**

| Block | Plots | Opens at | Costs |
|---|---|---|---|
| A | 9 | Day 1 | — |
| B | 9 | Farm Rank 2 | 800g |
| C | 9 | Farm Rank 4 | 3,000g |
| D | 9 | Farm Rank 6 | 8,000g |

- **You tap** a plot to plant (a seed from the Warehouse) and tap a Ready plot to harvest; "Plant all" and "Harvest
  all" do a block. Any crop in season can go in any plot.
- **The Fields' four slots tend one block each.** A tended block grows **1.25 a night at Novice, +0.1 a rank (1.75 at
  Legend)**, +0.05/0.10/0.15 for a B/A/S farming talent, ×(1 + 0.1 a Watering Can tier above Basic), ×1.25 well fed. A
  crop is Ready once its growth reaches its days − 0.5, so tending rounds to the nearest night: a 4-day Carrot takes
  3 nights tended, a 10-day Asparagus 8 at Novice and 7 at Expert.
- **Regrowing crops** turn Ready again every *n* days after the first harvest until they wither.
- **Untended blocks still grow** at 1 a night, at 1★ (only the crop level and the Hoe lift them).

### 3.3 The ranch (CS13)

**CS13: animals, feed, affection and products.** The Coop comes with chapter 2 and two free chickens; the Barn is
bought from Farm Rank 3 after chapter 2.

| Animal | Lives in | Price | Feed a day | Product | Gives | Price ★1 | At the Mill | How you get one | Product art |
|---|---|---|---|---|---|---|---|---|---|
| Chicken | Coop | 800 | 10g (Chicken Feed) | Egg (`egg`) | every 1 day | 50 | — | Shop, from chapter 2 (two come free) | **new** |
| Duck | Coop | 1,500 | 10g (Chicken Feed) | Duck Egg (`duck-egg`) | every 2 days | 130 | — | Expeditions (Misty Marsh) and requests | **new** |
| Cow | Barn | 3,000 | 20g (Fodder) | Milk (`milk`) | every 1 day | 110 | — | Shop, once the Barn is built (Farm Rank 3) | **new** |
| Goat | Barn | 2,200 | 20g (Fodder) | Goat Milk (`goat-milk`) | every 1 day | 85 | — | Shop, once the Barn is built | **new** |
| Sheep | Barn | 2,600 | 20g (Fodder) | Wool (`wool`) | every 3 days | 300 | Wool Cloth | Shop, once the Barn is built | uma-art |
| Alpaca | Barn | 4,800 | 20g (Fodder) | Alpaca Fleece (`alpaca-fleece`) | every 3 days | 460 | Alpaca Cloth | Shop, from Farm Rank 5 | uma-art |
| Cashmere Goat | Barn | 8,000 | 20g (Fodder) | Cashmere Fleece (`cashmere-fleece`) | every 3 days | 700 | Cashmere Cloth | Expeditions (Ember Peak) and the Animal Show | uma-art |

| Building | Level 1 | Level 2 | Level 3 | Level 4 |
|---|---|---|---|---|
| **Coop** | 4 animals, chapter 2 (free) | 8, 5,000g, FR4 | 12, 12,000g, FR7 | — |
| **Barn** | 4, 8,000g, FR3 | 8, 15,000g, FR5 | 12, 30,000g, FR7 | 16, 50,000g, FR9 |

- **A carer looks after a pen of 4** (one slot each; every place keeps four slots, D24 #13).
- **Affection** is points, and hearts come at **40, 100, 180, 280, 400, 540, 700, 880, 1,080 and 1,300**: early
  hearts are quick, the last ones slow.

| A night with | Affection |
|---|---|
| A carer | **+(8 + 3 × her ranch rank + her talent step (G 0 … S 7) + 1 a day in a row with the same carer, up to +5)** ×1.25 well fed, +3 a Brush tier |
| No carer, fed | **−10** |
| Unfed (no feed in the Warehouse) | **−40, and no product** |

- **Products:** fed animals lay by the morning, every *n* days by kind. **Stars come from hearts:** quality points
  = hearts ÷ 2.5, +0.25 a Brush tier (CS26). 0 hearts is 1★, 5 hearts averages 3★, 10 hearts is always 5★.
- **Worked:** a Novice C carer gains 8 + 0 + 4 + 5 = **17 a day**: 2 hearts in 6 days, 5 in 24, 10 in 77. A Skilled
  A carer gains 8 + 6 + 6 + 5 = **25 a day**: 10 hearts in 52. A chicken cared for from day 9 has about 7 hearts at
  the Animal Show (day 46).
- A chicken pays for itself in about 16 days (40g a day net at 0 hearts, 90g at 10); a cow in about 22.
- Animals never die or leave. An animal at 10 hearts can enter the Animal Show (CS40).

### 3.4 Gathering places (CS14–CS17)

**CS14: the Mine and the Quarry go down 30 floors.** A floor's **main grade is ⌈floor ÷ 3⌉** (70%), with the grade
below (20%) and above (10%). The Mine gives ore; the Quarry gives stone (70%) or a gem (30%) of the same grade. Her
rank sets the deepest floor she can dig.

| Floors | Dug from | Main grades | The Mine: main ore | Mine: gold an item | The Quarry: main stone / gem | Quarry: gold an item | Uma-days to find each floor's stairs |
|---|---|---|---|---|---|---|---|
| 1–5 | Novice | G1, G2 | Copper Ore → Tin Ore | 31 → 39 | Limestone / Quartz → Sandstone / Amethyst | 33 → 40 | 1 |
| 6–10 | Hand | G2, G3, G4 | Tin Ore → Iron Ore → Silver Ore | 39 → 64 | Sandstone / Amethyst → Slate / Citrine → Granite / Garnet | 40 → 66 | 2 |
| 11–15 | Skilled | G4, G5 | Silver Ore → Cobalt Ore | 64 → 84 | Granite / Garnet → Basalt / Emerald | 66 → 88 | 3 |
| 16–20 | Expert | G6, G7 | Gold Ore → Platinum Ore | 108 → 138 | Marble / Sapphire → Obsidian / Ruby | 113 → 143 | 4 |
| 21–25 | Master | G7, G8, G9 | Platinum Ore → Titanium Ore → Mythril Ore | 138 → 227 | Obsidian / Ruby → Jade / Diamond → Runestone / Starstone | 143 → 237 | 5 |
| 26–30 | Legend | G9, G10 | Mythril Ore → Orichalcum Ore | 227 → 286 | Runestone / Starstone → Meteorite / Philosopher's Stone | 237 → 298 | 6 |

- **Finding the stairs:** the deepest floor reached is the farm's. An Uma digging the deepest floor, with a rank that
  allows deeper, adds 1 a day (1.25 well fed); floor *f*'s stairs need **⌈f ÷ 5⌉** of those days. Floor 10 takes
  15 Uma-days from the top, floor 20 takes 65, floor 30 takes 105.
- She picks any floor down to the deepest she can reach; the job sheet defaults to it.

| Family | Raw G1 → G10 | Refined G1 → G10 |
|---|---|---|
| Ores | 30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | 45 · 60 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450 |
| Stones | 25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240 | 40 · 45 · 60 · 75 · 105 · 135 · 165 · 220 · 280 · 360 |
| Crystals | 50 · 65 · 80 · 105 · 135 · 175 · 225 · 290 · 370 · 480 | 75 · 100 · 120 · 160 · 205 · 265 · 340 · 435 · 555 · 720 |

**CS15: fishing spots by season.** Seven spots; her fishing rank opens them, the sea waits for chapter 7 and the deep
sea for the boat (40,000g).

| Spot | Opens at | Spring | Summer | Autumn | Winter | Gold a fish |
|---|---|---|---|---|---|---|
| The Pond | Novice | Carp 60%, Trout 40% | Carp 98%, Rainbow Koi 2% | Carp 60%, Trout 40% | Carp 70%, Trout 30% | 44 |
| The River | Hand | Trout 40%, Carp 20%, Salmon 40% | Eel 40%, Trout 40%, Carp 20% | Salmon 50%, Trout 50% | Trout 60%, Salmon 20%, Carp 20% | 78 |
| The Lake | Skilled | Salmon 50%, Trout 20%, Eel 30% | Eel 50%, Salmon 47%, Rainbow Koi 3% | Salmon 50%, Eel 30%, Silverfin 20% | Silverfin 20%, Trout 30%, Salmon 50% | 143 |
| The Falls | Expert | Eel 50%, Salmon 25%, Silverfin 20%, Rainbow Koi 5% | Eel 60%, Silverfin 30%, Rainbow Koi 10% | Silverfin 30%, Salmon 40%, Eel 25%, Rainbow Koi 5% | Silverfin 40%, Trout 50%, Rainbow Koi 10% | 204 |
| The Sea Pier | Hand + chapter 7 | Sardine 60%, Sea Bream 40% | Sardine 50%, Mackerel 20%, Sea Bream 30% | Mackerel 60%, Sea Bream 40% | Mackerel 70%, Sardine 30% | 94 |
| The Deep Sea | Master + chapter 7 and the boat | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 30%, Sea Bream 10% | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 40% | 265 |
| The Moon Pool | Legend | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | 354 |

| Id | Fish | Price ★1 | At the Smokehouse | Price ★1 | Size |
|---|---|---|---|---|---|
| `carp` | Carp | 40 | Carp Fillet | 60 | 20–60 cm |
| `trout` | Trout | 50 | Trout Fillet | 75 | 25–70 cm |
| `sardine` | Sardine | 65 | Sardine Fillet | 100 | 12–25 cm |
| `mackerel` | Mackerel | 85 | Mackerel Fillet | 130 | 25–50 cm |
| `salmon` | Salmon | 110 | Salmon Fillet | 165 | 50–120 cm |
| `sea-bream` | Sea Bream | 145 | Sea Bream Fillet | 220 | 30–70 cm |
| `eel` | Eel | 180 | Eel Fillet | 270 | 40–120 cm |
| `tuna` | Tuna | 235 | Tuna Fillet | 355 | 80–250 cm |
| `silverfin` | Silverfin | 300 | Silverfin Fillet | 450 | 40–90 cm |
| `rainbow-koi` | Rainbow Koi | 390 | Rainbow Koi Fillet | 585 | 40–100 cm |

- **Sizes** feed the Diary's records and the Derby: a catch's size is `min + (max − min) × u^(8/k)`, with
  `k = 1 + 0.25 × rank + 0.1 × talent step + 0.05 × Rod tier`. Better anglers land bigger fish.

**CS16: foraging areas.** Six areas, opened by her foraging rank. Each yields its two grades (65/35) of **woods 40%,
mushrooms 30%, herbs and spices 15%, and the season's family 15%** (sweets, fruits, nuts and seeds, or more mushrooms).

| Area | Opens at | Grades | Spring | Summer | Autumn | Winter | Gold an item |
|---|---|---|---|---|---|---|---|
| The Woods | Novice | G1–G2 | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Honeycomb 10%, Mint 5%, Sugarcane 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Apple 10%, Mint 5%, Pear 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Peanut 10%, Mint 5%, Sunflower Seed 5% | Button Mushroom 29%, Pine Log 26%, Shiitake 16%, Birch Log 14%, Basil 10%, Mint 5% | 33 |
| The Hills | Hand | G3–G4 | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sugar Beet 10%, Thyme 5%, Maple Sap 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Peach 10%, Thyme 5%, Plum 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sesame 10%, Thyme 5%, Walnut 5% | Oyster Mushroom 29%, Cedar Log 26%, Enoki 16%, Maple Log 14%, Rosemary 10%, Thyme 5% | 52 |
| The Old Forest | Skilled | G4–G5 | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Maple Sap 10%, Ginger 5%, Cacao Pod 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Plum 10%, Ginger 5%, Orange 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Walnut 10%, Ginger 5%, Chestnut 5% | Enoki 29%, Maple Log 26%, Chanterelle 16%, Oak Log 14%, Thyme 10%, Ginger 5% | 72 |
| The Mountain | Expert | G6–G7 | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Vanilla Pod 10%, Cinnamon 5%, Agave Heart 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Grape 10%, Cinnamon 5%, Mango 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Almond 10%, Cinnamon 5%, Pistachio 5% | Porcini 29%, Cherry Log 26%, Morel 16%, Mahogany Log 14%, Peppercorn 10%, Cinnamon 5% | 110 |
| The Misty Vale | Master | G8–G9 | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Palm Sap 10%, Mandrake 5%, Fairy Honeycomb 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Pomegranate 10%, Mandrake 5%, Starpeach 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Macadamia 10%, Mandrake 5%, Thundernut 5% | Truffle 29%, Ebony Log 26%, Glowcap 16%, Elderwood Log 14%, Saffron 10%, Mandrake 5% | 197 |
| The World Tree | Legend | G9–G10 | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Fairy Honeycomb 10%, Phoenix Pepper 5%, Ambrosia Blossom 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Starpeach 10%, Phoenix Pepper 5%, Golden Apple 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Thundernut 10%, Phoenix Pepper 5%, Worldseed 5% | Glowcap 29%, Elderwood Log 26%, King Reishi 16%, Yggdrasil Branch 14%, Mandrake 10%, Phoenix Pepper 5% | 263 |

| Family | Station | Raw G1 → G10 | Refined G1 → G10 |
|---|---|---|---|
| Woods | Sawmill | 25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240 | 40 · 45 · 60 · 75 · 105 · 135 · 165 · 220 · 280 · 360 |
| Mushrooms | Sawmill | 30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | 45 · 60 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450 |
| Herbs and spices | Sawmill | 45 · 45 · 45 · 60 · 200 · 100 · 125 · 160 · 520 · 270 | 70 · 70 · 70 · 90 · 300 · 150 · 190 · 240 · 780 · 405 |
| Fruits | Mill | 35 · 45 · 55 · 70 · 95 · 120 · 155 · 200 · 255 · 330 | 55 · 70 · 85 · 105 · 145 · 180 · 235 · 300 · 385 · 495 |
| Nuts and seeds | Mill | 35 · 75 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | 55 · 115 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450 |
| Sweets | Mill | 35 · 45 · 120 · 70 · 95 · 120 · 155 · 200 · 255 · 330 | 55 · 70 · 180 · 105 · 145 · 180 · 235 · 300 · 385 · 495 |

Seven of these are also crops and keep their crop price wherever they come from: Basil, Mint, Ginger and Mandrake
(herbs), Peanut and Sunflower Seed (nuts and seeds), and Sugar Beet (sweets). That is why their columns step out of
the ladder.

**CS17: what a day of gathering brings home.**

`items = round(base × rank × talent × tool × well fed × bond)`

| Factor | Values |
|---|---|
| **Base**, at Novice | The Forest **5**, the Mine **4**, the Quarry **4**, the Fishery **3** |
| **Rank** | ×1.0 · 1.15 · 1.3 · 1.5 · 1.7 · 2.0 (Novice → Legend) |
| **Talent** | ×0.85 · 0.9 · 0.95 · 1.0 · 1.05 · 1.1 · 1.15 · 1.2 (G → S) |
| **Tool** | ×1.0 · 1.15 · 1.3 · 1.45 · 1.6 (Basic → Mythril) |
| **Well fed** | ×1.25 (the staff meal, CS22) |
| **Bond** | ×1.1 beside an Uma she has 3 hearts or more with (CS44) |

What a day is worth, a C-talent Uma at her rank's deepest place, with the tool a sensible player has by then:

| Rank (tool) | The Mine | The Quarry | The forest | The Fishery |
|---|---|---|---|---|
| Novice (Basic) | 166g | 170g | 178g | 142g |
| Hand (Basic) | 380g | 391g | 369g | 370g |
| Skilled (Copper) | 689g | 722g | 793g | 982g |
| Expert (Iron) | 1,725g | 1,789g | 1,722g | 1,914g |
| Master (Gold) | 3,972g | 4,152g | 4,482g | 3,708g |
| Legend (Mythril) | 7,204g | 7,498g | 8,666g | 6,859g |

The four stay within about 40% of each other at every rank, and which one leads changes from rank to rank, so an
Uma's talent, more than the place, decides where she's best. A Novice day (~160g) is about a tended block's (~150g), so day 1's three jobs are all worth doing.

### 3.5 Stations (CS18)

**CS18: one station a gathering place, 8 items a day.** A station job takes its inputs from the Warehouse at the start;
its stars carry through. An Uma processes **`round(8 × rank × talent × well fed)` items a day** using the station's
place's rank (D24 #9's lines). The output sells at **×1.5** its input, so a station day adds 8 × 0.5 = **4 inputs'
worth**, the same as a gatherer brings in. Making jobs run 2–3 days on 2–3 days' batch: the same value a day, fewer
taps.

| Station | At | Rank used | Builds for | Opens | Jobs |
|---|---|---|---|---|---|
| **Mill** | Fields | Farming | 1,200g | Chapter 1's reward | **Flour** (1 day): every grain → its flour (Wheat Flour, Rolled Oats, Pearl Barley, Polished Rice, Cornmeal, Rye Flour, Buckwheat Flour, Hulled Wild Rice, Moonrice Flour, Sunwheat Flour) · **Sugars and oils** (1 day): every sweet and nut → its refined form (Honey, Beet Sugar, Peanut Butter, Sunflower Oil …) · **Preserves** (2 days): a fruit → its preserve · **Cloth** (3 days): 2 Wool, Alpaca or Cashmere Fleece → 1 cloth |
| **Sawmill** | Forest | Foraging | 1,500g | Farm Rank 3 | **Planks** (1 day): a log → its plank · **Drying** (1 day): a mushroom or a herb → its dried or ground form |
| **Smokehouse** | Fishery | Fishing | 2,000g | Farm Rank 3 | **Smoking** (1 day): a fish → its fillet |
| **Smelter** | Mine | Mining | 3,000g | Chapter 3 | **Smelting** (1 day): an ore → its ingot |
| **Cutter** | Quarry | Mining | 4,000g | Chapter 3's reward | **Cutting** (1 day): a gem → its cut gem; a stone → its block |

Worked: a Hand C miner at the Smelter smelts round(8 × 1.15 × 1.05) = **10 Iron Ore** (50g) into 10 Iron Ingots (75g):
+250g at 1★, on top of the 500g the ore was worth. Cloth: 2 Wool (300g) → 1 Wool Cloth (900g).

### 3.6 The catalogue's art (CS19)

**CS19: 366 of the 370 goods have their icon already; four need one.** Every good's id is uma-art's own (its `items`
or `dishes` atlas), so names come from ids as today ([materials](../game/materials.md)). The Forge's goods reuse the
made-item rows under the farm's names (Copper Ring is `accessory-setting-g1`'s frame).

| Catalogue | Goods | Icons in uma-art 2.21.0 |
|---|---|---|
| Farming: 27 crops and 10 flours | 37 | 37 |
| Foraging: woods, mushrooms, herbs and spices, fruits, nuts and seeds, sweets (raw and refined, less the 7 that are crops) | 113 | 113 |
| Mining: ores, stones, crystals (raw and refined) | 60 | 60 |
| Fishing: fish and fillets | 20 | 20 |
| The ranch: 7 products and 3 cloths | 10 | 6; **Egg, Duck Egg, Milk, Goat Milk new** |
| Dishes: 8 kinds × 10 grades | 80 | 80 (`dish-<family>-<grade>`) |
| Forge goods: Rings and Fittings | 20 | 20 (renamed frames) |
| Expedition loot: hides and scales, bones and horns, essences | 30 | 30 |
| **All** | **370** | **366** |

The page's catalogue ([core-spec.html](previews/core-spec.html#catalogue)) lists all 370 with price, days, season,
station and art.

**What needs new art** (input for the art packets F25, F29, F38):

| For | Art | Size | Milestone |
|---|---|---|---|
| Goods | **Egg, Duck Egg, Milk, Goat Milk** (items atlas, 32×32) | 4 icons | M5 |
| Shop goods | **Chicken Feed, Fodder** (32×32); a **seed packet** badge drawn over a crop's icon | 3 | M4 (packet), M5 (feed) |
| Animals | **Chicken, Duck, Cow, Goat, Sheep, Alpaca, Cashmere Goat**, portrait icons (48×48) | 7 | M5 |
| Tools | **Watering Can, Hoe, Brush, Pick, Hammer, Rod, Axe**, each in 5 tiers (Basic, Copper, Iron, Gold, Mythril) as tints of one drawing | 7 × 5 | M6 |
| Places on today's map | **Dorm, Coop, shipping bin, requests board, expedition post** (Hub buildings, 48×48). The rest reuse uma-art's: the workbenches become the stations, `stable` the Barn, `kitchen`, `party-hall` the Restaurant, `forge`, `exchange` the shop, `racecourse` the festival ground | 5 | M4: Dorm, bin; M5: Coop, post; M6: board |
| The town's cast | **Mayor Hollis Pryor, Marta Quill, Old Ben Carver** (M4); **Dale Hart, Gus Talbot, Rosa Bell, Juno Park** (M5); **Ida Stone, Captain Nils Berg, Wren Ashby, Cole Varga** (M6): bust portraits for scenes | 11 | M4–M6 |
| Story and Diary | 8 story items (one a chapter), 5 festival trophies, 3 ribbons, 12 decorations | 28 | M5–M6 |
| UI marks | Gold coin, star, heart (bond), heart (affinity), Farm Rank crest, calendar seasons ×4 | 9 | M4 |

## 4. Workshops (CS20–CS25)

**CS20: what every workshop shares.**
- **One play a day** each (FC34), reset in the night's step 5. The Kitchen, the Restaurant and the Forge each have
  **one assistant post** (D23 #8): you pick the Uma when you start a play, and that day is hers (she holds no slot).
- **FR21's contract** holds: 30–90 seconds, a seed shown before the play, a score 0–100 into four tiers, inputs taken
  at Start and never lost, an unfinished play counted Rough, a practice mode with no inputs and no yield.

| Score | Tier | Yield | Well fed (CS22) |
|---|---|---|---|
| 0–49 | Rough | ×1 (the base) | 1 day |
| 50–74 | Good | ×1.25 | 1 day |
| 75–89 | Fine | ×1.5 | 2 days |
| 90–100 | Masterwork | ×2 | 3 days |

- **The assistant** adds **+10% yield a rank** (×1.0 Novice … ×1.5 Legend), her rank and talent lift the stars
  (CS26), and the play pays her **10 rank points**.
- **Levels** are bought at the workshop; the Farm Rank gates them.

**CS21: the Kitchen** (chapter 4). Its game is FR18's: tickets, burners, pull each part in the green.

| Level | Base dishes a play | Costs | Farm Rank |
|---|---|---|---|
| 1 | 6 | Chapter 4 (free) | — |
| 2 | 8 | 6,000g | 4 |
| 3 | 10 | 15,000g | 5 |
| 4 | 12 | 35,000g | 6 |
| 5 | 15 | 70,000g | 8 |

- **A play** cooks a menu of up to **3 recipes**, splitting the base between them. Start takes the inputs for the
  base. Out come `round(base × tier × (1 + 0.1 × her cooking rank))` dishes, the extra shared in proportion.
- **Recipes:** every dish is **2 of its main ingredient + 1 side**, and sells at **×1.25 its inputs at 1★**.
  You start with 3 (Carrot Salad, Wheat Bread, Carp Grill); the rest are bought at the shop for **5× the dish's
  price**, or come from requests and chapter rewards. The dishes' art and names are uma-art's.

| Dish | Recipe | Main ingredient and price ★1, G1 → G10 |
|---|---|---|
| Salad (`dish-vegetables-1…10`) | 2 raw vegetables of its grade + 1 any herb | Carrot 190, Potato 175, Cabbage 690, Onion 290, Tomato 215, Bell Pepper 190, Eggplant 275, Asparagus 1240, Golden Carrot 1540, Emperor Pumpkin 1540 |
| Bread (`dish-grains-1…10`) | 2 refined grains of its grade + 1 Egg | Wheat Flour 215, Rolled Oats 215, Pearl Barley 240, Polished Rice 250, Cornmeal 590, Rye Flour 290, Buckwheat Flour 350, Hulled Wild Rice 665, Moonrice Flour 965, Sunwheat Flour 1040 |
| Tart (`dish-fruits-1…10`) | 2 raw fruits of its grade + 1 any flour | Apple 170, Pear 195, Peach 220, Plum 255, Orange 320, Grape 380, Mango 470, Pomegranate 580, Starpeach 720, Golden Apple 905 |
| Grill (`dish-fish-1…10`) | 2 raw fish of its grade + 1 any herb | Carp 140, Trout 165, Sardine 200, Mackerel 250, Salmon 315, Sea Bream 400, Eel 490, Tuna 625, Silverfin 790, Rainbow Koi 1015 |
| Curry (`dish-herbs-spices-1…10`) | 2 raw herbs and spices of its grade + 1 any vegetable | Basil 200, Mint 200, Rosemary 200, Thyme 240, Ginger 590, Peppercorn 340, Cinnamon 400, Saffron 490, Mandrake 1390, Phoenix Pepper 765 |
| Soup (`dish-mushrooms-1…10`) | 2 raw mushrooms of its grade + 1 Milk | Button Mushroom 215, Shiitake 240, Oyster Mushroom 265, Enoki 300, Chanterelle 350, Porcini 415, Morel 490, Truffle 590, Glowcap 715, King Reishi 890 |
| Cake (`dish-sweets-1…10`) | 2 refined sweets of its grade + 1 Egg | Honey 200, Cane Sugar 240, Beet Sugar 515, Maple Syrup 325, Chocolate 425, Vanilla Extract 515, Agave Syrup 650, Palm Sugar 815, Fairy Honey 1025, Ambrosia 1300 |
| Cookies (`dish-nuts-seeds-1…10`) | 2 raw nuts and seeds of its grade + 1 any flour | Peanut 170, Sunflower Seed 270, Sesame 205, Walnut 245, Chestnut 295, Almond 355, Pistachio 430, Macadamia 530, Thundernut 655, Worldseed 830 |

- **Worked play:** Kitchen level 1, a Hand assistant, 3 Carrot Salads and 3 Carp Grills. Start takes 6 Carrots,
  6 Carp and 6 herbs (870g of goods). The play scores 78, Fine: round(6 × 1.5 × 1.1) = **10 dishes**, 5 of each,
  worth **1,650g** at 1★. That's +780g, before stars and before a staff meal.

**CS22: the staff meal.** After a Kitchen play, "Serve the staff meal" takes **one dish for every three Umas fed**
(rounded up; everyone on the farm by default) from that play's dishes. They're **well fed** for 1, 2 or 3 days by the
play's tier:
- 1-day jobs (gathering, processing) make **×1.25** their day's items;
- longer work (making, tended crops, expeditions) gains a quarter day a night, through uma-work's `acceleratedMs`;
- +0.25 quality, ×1.25 rank points, ×1.25 affection given;
- a new meal replaces the old one; it never stacks. Eating together pays the pair bond points (CS44).

Worked: 12 Umas, a Fine meal of 4 Salads (760g): two days at +25%, about 2 × 0.25 × 12 × 400g = **2,400g** more work.

**CS23: the Restaurant** (chapter 6). Its game is FR19's serving rush, now earning gold (FC14).

| Level | Covers a shift | Costs | Farm Rank |
|---|---|---|---|
| 1 | 8 | Chapter 6 (free) | — |
| 2 | 12 | 10,000g | 6 |
| 3 | 16 | 25,000g | 7 |
| 4 | 20 | 50,000g | 8 |
| 5 | 25 | 100,000g | 9 |

- **A shift** puts up to 4 dish kinds from the Warehouse on the menu; guests order from it, up to the covers.
- **Pay:** each dish served pays its bin price (with stars and demand), **plus tips: 20% of the dishes' price × the
  tier** (20% Rough, 25% Good, 30% Fine, 40% Masterwork), ×(1 + 0.05 × the server's serving rank). The tips are the
  game's yield, so FR21 holds; the Restaurant always beats the bin.
- Dishes not served stay in the Warehouse. Worked: 8 Carp Grills at 2★ (175g each, 1,400g) served at Fine by a Hand:
  1,400 + 1,400 × 0.30 × 1.05 = **1,841g**.

**CS24: the Forge's merge game** (chapter 7; FR20, the owner's genre).

| Rule | Value |
|---|---|
| Board | **5 × 5** cells, portrait, one thumb |
| Length | **90 seconds** at most |
| Pieces | Two kinds set by the recipe: **metal** (its ingot) and **accent** (its gem, plank or hide). Four tiers: **Scrap → Bar → Blank → Part** |
| Drops | One Scrap a second into a seeded empty cell; the seed and the next three drops show. Kinds come in shuffled bags of 8 metal + 8 accent, so luck never starves a kind |
| Merge | Drag a piece onto one of the same kind and tier: they become one a tier up |
| Forge | Drag a metal Part onto an accent Part: the **forged piece** leaves the board, **+20** |
| End | 90 s, or a drop finds the board full. Each Part left scores **+4** |
| Score | min(100, 20 × forged + 4 × Parts left): 2 forged is Rough, 3 Good, 4 Fine, 5 (or 4 and 3 Parts) Masterwork |

A forged piece takes 8 + 8 drops, so 5 take 80 of the 90: a perfect player has about 10 seconds to spare. Mashing
can't work, since every merge is a drag between two alike pieces.

**CS25: what the Forge makes.**

| Level | Base goods a play | Costs | Farm Rank |
|---|---|---|---|
| 1 | 4 | Chapter 7 (free) | — |
| 2 | 6 | 20,000g | 7 |
| 3 | 8 | 50,000g | 8 |

- **Goods:** Rings (jewellery) and Fittings, ten grades each, at ×1.25 their inputs, out `round(base × tier × (1 +
  0.1 × her forging rank))`.

| Id | Good | Grade | Recipe | Price ★1 | Art frame |
|---|---|---|---|---|---|
| `ring-g1` | Copper Ring | 1 | 2 Copper Ingot + 1 Cut Quartz | 205 | `accessory-setting-g1` (renamed) |
| `fittings-g1` | Copper Fittings | 1 | 2 Copper Ingot + 2 Pine Plank | 215 | `armor-fittings-g1` (renamed) |
| `ring-g2` | Tin Ring | 2 | 2 Tin Ingot + 1 Cut Amethyst | 275 | `accessory-setting-g2` (renamed) |
| `fittings-g2` | Tin Fittings | 2 | 2 Tin Ingot + 2 Birch Plank | 265 | `armor-fittings-g2` (renamed) |
| `ring-g3` | Iron Ring | 3 | 2 Iron Ingot + 1 Cut Citrine | 340 | `accessory-setting-g3` (renamed) |
| `fittings-g3` | Iron Fittings | 3 | 2 Iron Ingot + 2 Cedar Plank | 340 | `armor-fittings-g3` (renamed) |
| `ring-g4` | Silver Ring | 4 | 2 Silver Ingot + 1 Cut Garnet | 450 | `accessory-setting-g4` (renamed) |
| `fittings-g4` | Silver Fittings | 4 | 2 Silver Ingot + 2 Maple Plank | 440 | `armor-fittings-g4` (renamed) |
| `ring-g5` | Cobalt Ring | 5 | 2 Cobalt Ingot + 1 Cut Emerald | 580 | `accessory-setting-g5` (renamed) |
| `fittings-g5` | Cobalt Fittings | 5 | 2 Cobalt Ingot + 2 Oak Plank | 590 | `armor-fittings-g5` (renamed) |
| `ring-g6` | Gold Ring | 6 | 2 Gold Ingot + 1 Cut Sapphire | 745 | `accessory-setting-g6` (renamed) |
| `fittings-g6` | Gold Fittings | 6 | 2 Gold Ingot + 2 Cherry Plank | 750 | `armor-fittings-g6` (renamed) |
| `ring-g7` | Platinum Ring | 7 | 2 Platinum Ingot + 1 Cut Ruby | 950 | `accessory-setting-g7` (renamed) |
| `fittings-g7` | Platinum Fittings | 7 | 2 Platinum Ingot + 2 Mahogany Plank | 940 | `armor-fittings-g7` (renamed) |
| `ring-g8` | Titanium Ring | 8 | 2 Titanium Ingot + 1 Cut Diamond | 1220 | `accessory-setting-g8` (renamed) |
| `fittings-g8` | Titanium Fittings | 8 | 2 Titanium Ingot + 2 Ebony Plank | 1225 | `armor-fittings-g8` (renamed) |
| `ring-g9` | Mythril Ring | 9 | 2 Mythril Ingot + 1 Cut Starstone | 1555 | `accessory-setting-g9` (renamed) |
| `fittings-g9` | Mythril Fittings | 9 | 2 Mythril Ingot + 2 Elderwood Plank | 1565 | `armor-fittings-g9` (renamed) |
| `ring-g10` | Orichalcum Ring | 10 | 2 Orichalcum Ingot + 1 Cut Philosopher's Stone | 2025 | `accessory-setting-g10` (renamed) |
| `fittings-g10` | Orichalcum Fittings | 10 | 2 Orichalcum Ingot + 2 Yggdrasil Plank | 2025 | `armor-fittings-g10` (renamed) |

- **Tool upgrades,** one a play, a tier at a time. A tool lifts every job at its place (FC13). The tier is always
  made (Rough); better play **refunds part of the inputs**: Good 15%, Fine 30%, Masterwork 50%, rounded down.

| Tier | Name | Recipe | Effect over Basic |
|---|---|---|---|
| 1 | Basic | Every place starts with it | — |
| 2 | Copper | 8 Copper Ingot + 4 Pine Plank | Yield ×1.15, quality +0.25 |
| 3 | Iron | 8 Iron Ingot + 4 Cedar Plank + 2 Boarling Hide | ×1.30, +0.5 |
| 4 | Gold | 8 Gold Ingot + 4 Oak Plank + 2 Ironback Hide + 2 Cut Sapphire | ×1.45, +0.75 |
| 5 | Mythril | 8 Mythril Ingot + 4 Elderwood Plank + 2 Wyvern Scale + 2 Cut Starstone | ×1.60, +1.0 |

| Place | Tool | A tier adds |
|---|---|---|
| Fields | Watering Can | Tended growth +0.1 a night |
| Fields | Hoe | Crop quality +0.25; seeds back +5% |
| Coop and Barn | Brush | Affection +3 a day; product quality +0.25 |
| Mine | Pick | Yield ×1.15 (cumulative as above), quality +0.25 |
| Quarry | Hammer | The same |
| Fishery | Rod | The same, and fish size (CS15's *k* +0.05) |
| Forest | Axe | The same |

## 5. Quality (CS26)

**CS26: the star formula.** Each good adds up **quality points Q** from its sources, then draws its stars:

`stars = 1 + ⌊Q + u⌋`, clamped to 1–5, with `u` a seeded draw in [0, 1). So **the expected stars are 1 + Q** for Q
from 0 to 4, and Q = 4 or more is always ★5.

| Source | Gathering | Farming (tended) | Ranch | Kitchen and Forge | Stations |
|---|---|---|---|---|---|
| Her rank | 0.5 × rank (0 → 2.5) | The tender's | — | The assistant's | — |
| Her talent | G −0.75, F −0.5, E −0.25, D 0, C +0.25, B +0.5, A +0.75, S +1 | The tender's | — | The assistant's | — |
| Care | — | +0.25 for being tended | **Hearts ÷ 2.5** (0 → 4) | — | — |
| Crop level | — | +0.1 × (level − 1) | — | — | — |
| Inputs | — | — | — | Mean input ★ − 1 | **The input's stars carry** |
| Tool | +0.25 a tier | Hoe +0.25 a tier | Brush +0.25 a tier | — | — |
| Boost | Well fed +0.25 | Well fed +0.25 | — | — | — |

| Worked | Q | Stars | Price |
|---|---|---|---|
| A Novice C forager | 0 + 0.25 = **0.25** | ★1 75%, ★2 25% | ×1.06 |
| An untended block, crop level 1 | **0** | ★1 | ×1 |
| A Skilled B miner, Copper Pick | 1 + 0.5 + 0.25 = **1.75** | ★2 25%, ★3 75% | ×1.44 |
| An Expert A tender, Iron Hoe, level-4 crop, well fed | 1.5 + 0.75 + 0.25 + 0.5 + 0.3 + 0.25 = **3.55** | ★4 45%, ★5 55% | ×1.89 |
| A 10-heart cow | **4** | ★5 | ×2 |
| A Fine Kitchen play, inputs averaging ★2, a Hand C cook | 1 + 0.5 + 0.25 = **1.75** | ★2 25%, ★3 75% | ×1.44 |

Price is the base × (1 + 0.25 × (★ − 1)), never compounded: a ★5 good is worth exactly twice a ★1.

## 6. Talents and ranks (CS27–CS33)

**CS27: a talent from her stats, by one rule.** For each activity, her **talent score is her 5★ base stat × (100 + her
growth rate for that stat) ÷ 100**, read from master data's outfits. FC17's stats: Stamina farming; Guts the ranch;
Power mining and forging; Wit cooking and fishing; Speed foraging and serving. Expeditions read **the mean of her three
best scores**. The cut-offs are the same for everyone:

| Grade | S | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|---|
| **A stat's score** | ≥ 150 | ≥ 138 | ≥ 126 | ≥ 114 | ≥ 104 | ≥ 96 | ≥ 88 | < 88 |
| **Expeditions** (mean of best three) | ≥ 136 | ≥ 132 | ≥ 129 | ≥ 126 | ≥ 124 | ≥ 122 | ≥ 120 | < 120 |

**How the release's 272 outfits fall** (counts only; read from the local release on 2026-11-08). Every outfit's 5★
stats sum to 550 and her growth rates to 30%, so the rule ranks how her 550 are spread:

| Stat (activities) | S | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|---|
| Speed (foraging, serving) | 4 | 30 | 68 | 75 | 63 | 20 | 8 | 4 |
| Stamina (farming) | 12 | 20 | 33 | 44 | 63 | 54 | 19 | 27 |
| Power (mining, forging) | 18 | 31 | 57 | 62 | 50 | 30 | 17 | 7 |
| Guts (the ranch) | 3 | 20 | 38 | 83 | 63 | 48 | 13 | 4 |
| Wit (cooking, fishing) | 2 | 19 | 43 | 81 | 69 | 46 | 11 | 1 |
| **All five, together** | **3%** | **9%** | **18%** | **25%** | **23%** | **15%** | **5%** | **3%** |
| Expeditions | 11 | 33 | 37 | 69 | 55 | 42 | 23 | 2 |

- **Every outfit has at least one C or better:** her best talent is S for 38 outfits, A for 101, B for 121 and C for
  12. So any recruit is good at something.
- Scores run 65–182 across the five stats; the expedition mean runs 118–143.
- When the release adds outfits, the rule grades them with no change; the cut-offs are revisited only if a new release
  moves these shares by more than 5 points.

**CS28: what a talent gives.**

| Talent | G | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| Step | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| Yield (gathering, stations) | ×0.85 | ×0.90 | ×0.95 | ×1.00 | ×1.05 | ×1.10 | ×1.15 | ×1.20 |
| Quality points | −0.75 | −0.5 | −0.25 | 0 | +0.25 | +0.5 | +0.75 | +1.0 |
| Rank points | ×0.8 | ×0.85 | ×0.9 | ×1.0 | ×1.1 | ×1.2 | ×1.3 | ×1.5 |
| Tended growth | — | — | — | — | — | +0.05 | +0.10 | +0.15 |
| Affection a day (ranch) | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
| Expedition power | +0 | +2 | +4 | +6 | +8 | +10 | +12 | +14 |

**CS29: rank points, and the six ranks.** Nine activities, six ranks each (FC18, D24 #8):

- **A day of work pays 10 points** in its activity × her talent's rank-point factor, **×1.2 in her favourite line**
  (CS33), ×1.25 well fed.
- A workshop play pays its assistant **10**; an expedition pays **10 a day**, +10 on a Success, +20 on a Great.
- Points go on past a rank's threshold; the rank comes when its **challenge** is met (CS30).

Days of work to reach each rank in one activity, by talent (in her favourite line in brackets):

| Rank | Points | G | D | C | A | S |
|---|---|---|---|---|---|---|
| Novice | 0 | — | — | — | — | — |
| Hand | 40 | 5 (5) | 4 (4) | 4 (4) | 4 (3) | 3 (3) |
| Skilled | 160 | 20 (17) | 16 (14) | 15 (13) | 13 (11) | 11 (9) |
| Expert | 400 | 50 (42) | 40 (34) | 37 (31) | 31 (26) | 27 (23) |
| Master | 900 | 113 (94) | 90 (75) | 82 (69) | 70 (58) | 60 (50) |
| Legend | 2,000 | 250 (209) | 200 (167) | 182 (152) | 154 (129) | 134 (112) |

The arc: Hand in the first week, Skilled within the first season, **Expert late in year 1** for a dedicated Uma in her
line, Master in year 2, Legend in year 3 or 4 (a year is 48 days).

**CS30: the challenge for each rank.** Counted from her own work since she joined.

| Activity | Hand | Skilled | Expert | Master | Legend |
|---|---|---|---|---|---|
| Farming | Harvest 30 crops she tended | 40 crops of ★3+ she tended | Tend a crop of level 4+ to harvest | 30 crops of ★5 | 1st at a Flower Show with a crop she tended |
| Ranch | Care for animals 10 days | An animal in her care reaches 4 hearts | 7 hearts | 10 hearts | 1st at an Animal Show with an animal in her care |
| Mining | Dig 40 ores or stones | Dig at floor 10 (Mine or Quarry) | Floor 15 | Floor 20 | Floor 25 |
| Fishing | Catch 30 fish | 10 fish at the River | 10 at the Lake | 10 at the Falls | 1st at a Fishing Derby, on the team |
| Foraging | Gather 50 items | 20 items in the Hills | 20 in the Old Forest | 20 on the Mountain | 20 in the Misty Vale |
| Cooking | Assist 5 plays | A Fine play | 10 dishes of ★4+ | A Masterwork | 1st at a Cooking Contest as the cook |
| Serving | Assist 5 shifts | A Fine shift | Serve 100 guests | A Masterwork shift | Serve 1,000 guests |
| Forging | Assist 5 plays | A Fine merge | Forge a tool upgrade | A Masterwork | Forge a Mythril tool |
| Expeditions | Return from 2 | A Success at level 10+ | A Success at level 20+ | A Great at level 20+ | A Success at the Sky Ruins |

Each depth challenge is "reach the deepest place your rank allows", so ranking up is how the farm goes deeper.

**CS31: what each rank gives.**

| Rank | Yield | Tended growth | Quality | Deepest place: Mine and Quarry · forest · Fishery | Expedition power | Seeds back | Affection a day | Workshop yield |
|---|---|---|---|---|---|---|---|---|
| Novice | ×1.0 | 1.25 | +0 | Floor 5 · the Woods · the Pond | 10 | 10% | +0 | ×1.0 |
| Hand | ×1.15 | 1.35 | +0.5 | Floor 10 · the Hills · the River | 20 | 15% | +3 | ×1.1 |
| Skilled | ×1.3 | 1.45 | +1.0 | Floor 15 · the Old Forest · the Lake | 30 | 20% | +6 | ×1.2 |
| Expert | ×1.5 | 1.55 | +1.5 | Floor 20 · the Mountain · the Falls | 40 | 25% | +9 | ×1.3 |
| Master | ×1.7 | 1.65 | +2.0 | Floor 25 · the Misty Vale · the Deep Sea | 50 | 30% | +12 | ×1.4 |
| Legend | ×2.0 | 1.75 | +2.5 | Floor 30 · the World Tree · the Moon Pool | 60 | 35% | +15 | ×1.5 |

**CS32: today's Craft Level becomes her rank in her calling's line** (FC18, FC31, D24 #9). Metal and Stone → mining,
Wood → foraging, Fish → fishing, Vegetables → farming.

| Craft Level | Rank | Points set to |
|---|---|---|
| 1–5 | Novice | 8 a level above 1 (Lv 5: 32) |
| 6–15 | Hand | 40 + 12 a level above 6 (Lv 15: 148) |
| 16–25 | Skilled | 160 + 24 a level above 16 (Lv 25: 376) |
| 26–35 | Expert | 400 + 50 a level above 26 (Lv 35: 850) |
| 36–45 | Master | 900 + 110 a level above 36 (Lv 45: 1,890) |
| 46–50 | Legend | 2,000 |

Every challenge up to the mapped rank counts as done. Her other eight activities start at Novice, 0 points.

**CS33: her calling is her favourite line** (FC17). In her calling's activity she earns **×1.2 rank points**, and a pair
who share a favourite line and work it together earn **×1.5 bond points** (CS44). Her favourite shows on her card; she
can work anywhere. The ranch, the workshops and expeditions are nobody's favourite.

## 7. The roster (CS34–CS36)

**CS34: the Dorm, 3 → 60 beds.** Beds cap who lives and works on the farm at once (D24 #11). Upgrades are bought at the
Dorm and take effect the next morning.

| Level | Beds | Costs | Farm Rank | Cumulative |
|---|---|---|---|---|
| 1 | 3 | — | — | 0 |
| 2 | 5 | 1,000g | 1 | 1,000 |
| 3 | 8 | 3,000g | 2 | 4,000 |
| 4 | 12 | 8,000g | 3 | 12,000 |
| 5 | 16 | 15,000g | 4 | 27,000 |
| 6 | 22 | 28,000g | 5 | 55,000 |
| 7 | 30 | 50,000g | 6 | 105,000 |
| 8 | 40 | 85,000g | 7 | 190,000 |
| 9 | 50 | 130,000g | 8 | 320,000 |
| 10 | 60 | 200,000g | 9 | 520,000 |

60 beds fill 12 places × 4 slots (48), 3 assistant posts and up to 3 expedition parties: the farm has work for all.

**CS35: how visitors come and join.**

| Way | Who | When she joins |
|---|---|---|
| **The Gate** | While a bed is free and no visitor waits, a visitor stops by **every fourth morning** (days 4, 8, 12 …), a seeded draw from outfits not yet met | When your **affinity reaches 2 hearts** (200 points, CS45): about 4 days of a chat and a liked gift. She waits 6 days, then leaves (she may come again) |
| **Chapters** | Each chapter's end brings one, drawn for the farm's weakest open activity | At once |
| **Festivals** | 1st place: a visitor joins; 2nd: a visitor comes to the Gate | 1st: at once; 2nd: by affinity |
| **Requests** | 20% of a request's extras (about 1 request in 25) | At once |
| **Expeditions** | A Great at a region for the first time: a visitor met on the road | At the Gate, by affinity |

- A recruit with no free bed joins **on her off-season** (CS36).
- In the sim's year 1, **21 Umas**: the 3 starters, 5 from chapters, 4 from festivals, 8 from the Gate and 1 from a
  request. That's the first year's pace; 60 beds take about three years, all 272 outfits longer.

**CS36: the off-season.** The roster can grow past the beds. Umas beyond them are **on their off-season**: away, keeping
their ranks, bonds and affinity, earning nothing. At the Dorm, **swap** an idle Uma home for one away; she arrives the
next morning. Swaps are free and unlimited. Every outfit on the release can join in the end (FC16).

## 8. Goals (CS37–CS43)

**CS37: the requests board** (FC20). It stands in the yard.

| Rule | Value |
|---|---|
| Open at once | **3**; 4 from Farm Rank 4; 5 from Farm Rank 7 |
| Each morning | Requests past their date leave (no penalty). One new request posts if the board has room (two if it's empty) |
| The good | Something the farm can make now: shipped at least once, from an open place, or a crop in season; goods in the season's demand twice as likely |
| How many | Enough to be worth **about 40% of the farm's average daily shipping** over the last 3 days, from 2 to 30 of the good |
| Stars | At least ★1 (60%), ★2 (30%) or ★3 (10%); from Farm Rank 4, one star more |
| Due | In 3–6 days (seeded) |
| Reward | **1.5 × the goods' price at the asked stars**, to 10g, and FR points as shipped gold |
| Extra, 1 in 5 | A recipe (35%), rare seeds (30%), an animal (15%) or **a recruit** (20%) |
| From | The town's cast (CS41), each with a one-line ask from templates |

Worked: a farm shipping 2,000g a day (early Summer) sees "Marta needs 12 Potatoes, ★2 or better, by Summer 8": 12 ×
55 × 1.25 = 825g of potatoes, rewarded **1,240g**.

**CS38: the Farm Diary** (FC21).
- **Collections:** each of the 370 goods shipped once is an entry (**5 FR points**); completing a family's ten grades
  pays **500g and a decoration**.
- **Records:** the biggest fish of each kind (cm), the best dish score, each festival's best score, the best merge and
  the best shift.
- **Conversations** read so far, and each Uma's story beats.
- **Milestones** (25 FR points each, and gold):

| Milestone | Steps and gold |
|---|---|
| Shipped at the bin, in gold | 10,000 (300g) · 50,000 (1,000g) · 100,000 (2,000g) · 250,000 (4,000g) · 500,000 (8,000g) · 1,000,000 (15,000g) |
| Umas recruited | 5 (300g) · 10 (1,000g) · 20 (2,500g) · 40 (6,000g) · 60 (10,000g) · 100 and 272 (a decoration) |
| First rank reached | Hand 300g · Skilled 600g · Expert 900g · Master 1,200g · Legend 1,500g |
| Festivals won | 1 · 3 · 5 · 10 (a decoration each) |
| Depth | Mine floor 10, 20, 30; every fishing spot; every forest area (500g each) |
| Care and craft | An animal at 10 hearts; a crop at level 5 and 10; a Masterwork in each workshop (500g each) |
| Story | Each chapter (its reward, CS42–CS43) |

**CS39: the Farm's Rank** (FC23). Points: **1 per 100g shipped** (requests and the Restaurant count), **5 a Diary
entry**, **25 a milestone**, **250 a chapter**, **150 / 75 / 25** for a festival's 1st / 2nd / 3rd, and **1 per 100g of
decorations** (the open-ended sink, sold at the shop from 1,000g to 100,000g).

| Rank | Points | Opens (D24 #4: more of what's open) | Reached in the sim |
|---|---|---|---|
| 1 | 0 | Block A; Dorm 2; tier-1 seeds; the Old Fort Ruins | Day 1 |
| 2 | 150 | Block B (800g); Dorm 3; tier-2 seeds; Echo Cave | Day 7 |
| 3 | 500 | The Barn (8,000g, after chapter 2); Dorm 4 | Day 10 |
| 4 | 1,200 | Block C (3,000g); Dorm 5; Coop 2; Kitchen 2; tier-3 seeds; Hilltop Track; board of 4 | Day 19 |
| 5 | 2,400 | Dorm 6; Barn 2; Kitchen 3; alpacas; Misty Marsh; 2 parties out | Day 31 |
| 6 | 4,000 | Block D (8,000g); Dorm 7; Kitchen 4; Restaurant 2; the Sunken Temple | Day 41 |
| 7 | 6,500 | Dorm 8; Coop 3; Barn 3; Restaurant 3; Forge 2; board of 5 | Year 2, Spring |
| 8 | 10,000 | Dorm 9; Kitchen 5; Restaurant 4; Forge 3; Ember Peak | Year 2 |
| 9 | 15,000 | Dorm 10; Barn 4; Restaurant 5; 3 parties out | Year 2–3 |
| 10 | 22,000 | The Sky Ruins; the farm's gold crest | Year 3–4 |

**CS40: festivals against two rival farms** (FC22). Each entry scores 0–100; the rivals' scores follow your Farm Rank
(FR), so they stay a match. Ties go to you.

| Festival | Day | You enter | Your score | Ashby Orchards (Wren Ashby) | Varga Ranch (Cole Varga) |
|---|---|---|---|---|---|
| **Flower Show** | Spring 10 | One crop harvested this season, from the Warehouse | 14 × ★ + 2 × its crop level + its days to grow (max 10) | 34 + 6 × FR **+ 6** | 26 + 7 × FR |
| **Fishing Derby** | Summer 10 | Up to 3 anglers, who fish the Derby lake that day (the Lake's Summer fish) instead of working | 100 × the biggest catch's size as a share of its kind's maximum (CS15's draw) | 34 + 6 × FR | 26 + 7 × FR **+ 6** |
| **Cooking Contest** | Autumn 10 | A dish cooked live: a Kitchen play (it uses the day's play) | 10 × the dish's ★ + 0.5 × the play's score | 34 + 6 × FR **+ 6** | 26 + 7 × FR |
| **Animal Show** | Winter 10 | Your best animal | 6 × hearts + 8 × its last product's ★ | 34 + 6 × FR | 26 + 7 × FR **+ 6** |
| **Harvest Cup** | Winter 12 | A team of 3 Umas in a short race | The runners' mean of [40 × (race value − 110) ÷ 16, held to 0–40, + 8 × expedition rank] + 4 × the team's mean bond hearts + a seeded −4 to +4 | 34 + 6 × FR | 26 + 7 × FR |

- **Race value** = 0.30 Speed + 0.20 Stamina + 0.20 Power + 0.15 Guts + 0.15 Wit, each her talent score (CS27). On the
  release it runs **112–126** (median 117). Until M7 the Cup shows as a results card with a race bar (D24 #3).
- Rivals are capped at 96. **Prizes:** 1st **600g × the season's number × the year**, a trophy, a decoration and a
  recruit; 2nd half the gold and a visitor at the Gate; 3rd a fifth and a ribbon. The Cup: **5,000g × the year**, the
  Cup itself and a recruit.
- **Year 1, worked (the sim's median run):** Flower Show 52 against 52 and 40 (1st, on the tie); Derby 62 against 58
  and 60 (1st); Contest 70 against 70 and 61 (1st, on the tie); Animal Show 82 against 70 and 74 (1st); **Harvest Cup
  45 against 70 and 68 (3rd)**. A sensible player is within a few points of the rivals all year, so the day's play
  decides. The Cup can't be won in year 1: it needs Expert runners and 3-heart bonds, which chapter 8 asks for in
  year 2 (about 80 against 82).

**CS41: the town's cast is original** (FC24); their names and lines live in git. Umas appear only in roles.

| Who | Is | First seen |
|---|---|---|
| **Mayor Hollis Pryor** | Runs the town; opens each chapter | Chapter 1 |
| **Marta Quill** | Keeps the general store (the shop) | Chapter 1 |
| **Old Ben Carver** | Kept the farm before you; gives the first seeds | Chapter 1 |
| **Dale Hart** | Rancher; sells animals and feed | Chapter 2 |
| **Gus Talbot** | Retired miner; reopens the Mine and the Quarry | Chapter 3 |
| **Rosa Bell** | Cook; judges the Cooking Contest, first guest at the Restaurant | Chapter 4 |
| **Juno Park** | Runs the expedition post | Chapter 5 |
| **Ida Stone** | Smith; lights the Forge | Chapter 7 |
| **Captain Nils Berg** | Sails the boat to the deep sea | Chapter 7 |
| **Wren Ashby** | Rival: Ashby Orchards, crops and cooking | Chapter 1 (the Flower Show) |
| **Cole Varga** | Rival: Varga Ranch, animals and fishing | Chapter 1 (the Flower Show) |

**Umas' roles,** filled at runtime from master data: *your first hands* (the three picks), *your newest hand*, *your
best <activity>* (highest rank, then talent), *the Uma you're closest to* (highest affinity), *your team* (a
festival's).

**CS42: chapter 1, "A Field Again"** (M4). It opens on day 1.

| # | Goal | Teaches |
|---|---|---|
| 1 | **Plant and harvest 9 crops** | Planting, tending, Ready plots |
| 2 | **Ship 1,000g** at the bin | The bin, the overnight payout |
| 3 | **Bring home 10 things** from the Woods or the Pond | Assigning, the job sheet, collecting |
| 4 | **Grow a second kind of crop** | The shop |
| 5 | **Rank an Uma up to Hand** | Ranks and challenges |
| 6 | **Reach Farm Rank 2** | The Farm's Rank, Block B |

**Reward:** 500g, the Mill's plans (build it for 1,200g), a recruit, 250 FR points, and chapter 2. The sim finishes it
on **day 8** (days 7–9 across 30 runs).

**The opening scene, "The Overgrown Farm"** (day 1, before the first tap):
1. The farm gate at morning, weeds to the fence. **Mayor Hollis Pryor** welcomes the trainer: the farm has stood empty
   since Old Ben retired, and the town hopes the Umas who spend their off-season here can bring it back.
2. **Old Ben Carver** walks the one block he kept tilled, hands over a pouch of **9 Carrot seeds**, and shows how a
   tended row grows faster ("tap a plot, then pick who tends it").
3. **Your first hands** come in through the Gate, one at a time; each says a hello line from her temperament's
   templates (CS46), with her name from master data.
4. **Marta Quill** calls from the town edge that the shop is open; the shipping bin is pointed out ("anything you put
   in pays tonight").
5. The chapter card shows the six goals. The first tap is planting.

**The closing scene, "First Shipment"** (the morning after the goals are met):
1. The morning summary's total is the farm's best yet; the Mayor and Marta stop by the bin.
2. Old Ben unrolls **the Mill's plans** and says where the Fields could use one.
3. A visitor walks in at the Gate and asks to stay: **your newest hand** (the chapter's recruit).
4. A wagon is heard on the road: **Dale Hart** will bring two chickens tomorrow. Chapter 2 opens.

**CS43: chapters 2–8, one line each.** Each opens with a scene, holds 4–5 goals and ends with a recruit, gold
(500g × the chapter) and 250 FR points.

| Ch | Title | Opens | Goals | Sim |
|---|---|---|---|---|
| 2 | Feathers and Fences | The Coop and 2 chickens (Dale Hart) | Own 4 chickens, collect 20 eggs, a chicken at 2 hearts, build the Sawmill or the Smokehouse, ship 5,000g in all | Day 14 |
| 3 | Down the Mine | The Mine and the Quarry (Gus Talbot) | Reach Mine floor 5 and Quarry floor 5, build the Smelter, dig 30 ores, reach FR3 | Day 19 |
| 4 | Something Cooking | The Kitchen and 3 recipes (Rosa Bell) | Cook 3 kinds of dish, a Good play or better, serve a staff meal, enter the Cooking Contest | Day 34 |
| 5 | Beyond the Hills | The expedition post (Juno Park) | Return from 2 expeditions, a Success at Echo Cave, bring home rare seeds, reach FR5 | Day 41 |
| 6 | Open for Business | The Restaurant (Rosa Bell) | Run 3 shifts, a Fine shift, serve 50 guests, win a festival, reach FR6 | Year 2 |
| 7 | Iron and Tide | The Forge and the Sea Pier (Ida Stone, Captain Nils Berg) | Forge a tool upgrade, a Masterwork merge, catch 10 sea fish, buy the boat (40,000g) | Year 2 |
| 8 | The Harvest Cup | The final (the Mayor) | An Uma at Master, a pair at 5 hearts, place in 3 festivals this year, **win the Harvest Cup** | Year 2, Winter 12 |

The story ends with chapter 8's scene; the farm, the calendar and the festivals go on.

## 9. Relationships (CS44–CS47)

**CS44: bonds grow by working together** (FC25). Each pair holds bond points.

| Shared | Points a day |
|---|---|
| Working the same place the same day | **+10** (×1.5 in a favourite line they share) |
| An expedition party, a day away | **+15** |
| A festival team | **+20** |
| The same staff meal | **+5** |

| Hearts | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Points | 50 | 150 | 300 | 500 | 750 |
| Two at the same place every day | Day 5 | Day 15 | Day 30 | Day 50 | Day 75 |

- **3 hearts or more:** side by side at a place they work **10% faster** (CS17's bond factor; growth and affection too).
- **5 hearts:** on an expedition, the pair has a **duo move**, **+10% party power** (two pairs at most).
- Each heart opens one conversation (CS46). Bonds never fall.

**CS45: your affinity with each Uma** (FC26): 0–10 hearts, 100 points each.

| Act | Points | Limit |
|---|---|---|
| **Chat** (tap her) | +15 | Once a day |
| **Gift** | Loved +60, liked +30, neutral +10, disliked −20 | One a day |
| **Praise** (after a ★3+ day's work, a rank-up or a Fine play) | +20 | Once a day |

- **What she loves:** the dish kind of her best talent (farming Salads, ranch Cakes, mining Curries, fishing Grills,
  foraging Soups, cooking Tarts, serving Cookies, forging Breads, expeditions any dish ★4+). **Likes:** goods of her
  favourite line. **Dislikes:** feed and raw stone (miners excepted).
- **2 hearts:** a visitor asks to stay (CS35). **2, 4, 6, 8, 10 hearts:** her five **story beats**, from templates.
- **5 hearts:** +5% rank points; **10 hearts:** +10%. Affinity never falls.

**CS46: conversations come from templates** (FC27). The data, in `@farm/domain` (no names, only roles):

```ts
type Temperament = 'breezy' | 'steady' | 'bold' | 'gritty' | 'clever' // her top talent score: Speed, Stamina, Power, Guts, Wit
type Line = 'metal' | 'stone' | 'wood' | 'fish' | 'vegetables'           // her calling
type Distance = 'sprint' | 'mile' | 'medium' | 'long'                   // her best distance aptitude

interface Who { temperament?: Temperament; line?: Line; distance?: Distance }

interface ConversationTemplate {
  id: string                       // 'conv.mine.2.bold-clever.a'
  place: PlaceId | 'any'           // where it can play
  hearts: 1 | 2 | 3 | 4 | 5        // the bond level it opens at
  a: Who                           // the first speaker's filters; empty matches anyone
  b: Who
  lines: { by: 'a' | 'b'; text: string }[] // 3–6 lines; {a}, {b}, {place}, {item}, {farm} filled at runtime
}

interface StoryBeat { id: string; temperament: Temperament; hearts: 2 | 4 | 6 | 8 | 10; lines: { by: 'her' | 'you'; text: string }[] }
```

- **Choosing:** of the templates for that heart, at the pair's place or `any`, score **3 for the place, 2 for each
  temperament matched, 1 for each line or distance matched**, trying both orders of the pair; the best wins, ties
  broken by a seed from the two outfit ids. The same pair always gets the same conversation.
- **Temperament** is read from master data by one rule. On the release: Bold 76, Breezy 69, Steady 54, Clever 42,
  Gritty 31.
- **Authoring target (M6):** 20 `any` templates per heart and 2 per place per heart (15 places): 5 × (20 + 2 × 15) =
  **250**, plus 25 story beats (5 temperaments × 5). Every pair always has a match.
- Expedition logs and request asks use the same shape (a `kind` and filters, lines with placeholders).

**CS47: example lines.**

| Place, hearts, who | Lines |
|---|---|
| The Mine, 1, Bold and Clever | **{a}:** Another wall, another swing. Are you counting, {b}? · **{b}:** Forty-two. You hit the same rock twice. · **{a}:** It's a very stubborn rock. |
| The Fields, 2, Steady and Breezy | **{b}:** Done with my rows already! · **{a}:** Then help with mine. Slowly, this time. Carrots like slow. · **{b}:** ...Slowly. Right. |
| The Kitchen, 3, any | **{a}:** Taste this. · **{b}:** Is that ginger? · **{a}:** A secret. Keep cooking with me and you'll find out. |
| The Pond, 4, Gritty and anyone | **{a}:** I'm not leaving till it bites. · **{b}:** It's been three hours. · **{a}:** Then you'd better fetch us lunch. · **{b}:** ...Grilled? · **{a}:** Grilled. |
| An expedition, 5, any | **{a}:** On three? · **{b}:** On three. *(Their duo move is ready: {a} and {b}'s Twin Charge.)* |
| A story beat, Clever, 2 hearts | **Her:** You keep a list of everything, don't you? · **You:** Only the important things. · **Her:** Then put me on it. |

## 10. Expeditions (CS48–CS50)

**CS48: the regions.** The expedition post opens with chapter 5; the Farm's Rank opens higher regions. **One party out
at a time** to FR4, two from FR5, three from FR9; a party is 3 or 4 Umas.

| Region | Level | Days | Opens at | Needs (power) | Grades | Special finds |
|---|---|---|---|---|---|---|
| Old Fort Ruins | 1 | 2 | FR1 | 48 | G1–G2 | Golden Carrot seeds |
| Echo Cave | 5 | 3 | FR2 | 80 | G2–G3 | Sunwheat seeds; the chapter 5 story item |
| Hilltop Track | 10 | 3 | FR4 | 120 | G3–G4 | Moonrice seeds; an old Cup ribbon (chapter 8) |
| Misty Marsh | 15 | 4 | FR5 | 160 | G4–G5 | **Ducks**; Wild Rice seeds |
| Sunken Temple | 20 | 4 | FR6 | 200 | G5–G6 | Mandrake seeds |
| Ember Peak | 30 | 5 | FR8 | 280 | G7–G8 | **Cashmere Goats** |
| Sky Ruins | 40 | 5 | FR10 | 360 | G9–G10 | Decorations, Wyvern Scales for Mythril tools |

**CS49: power and the result.**

- **Her power** = 10 × (her expedition rank + 1) + 2 × her expedition talent step: a Novice C is **18**, a Skilled A
  **42**, an Expert S **54**, a Legend S **74**.
- **The party's power** = the sum × (1 + supplies + duo moves) × 1.1 if all are well fed. **Supplies:** each dish
  packed (up to 4) adds 4% + 1% a star above ★1. **Duo moves:** +10% a 5-heart pair, two at most.
- **The result** reads `ratio = power ÷ the region's need × v`, with `v` a seeded draw in 0.9–1.1:

| Ratio | Grade | Loot | Also |
|---|---|---|---|
| ≥ 1.4 | **Great** | ×1.5 | A special-find roll; a new region's visitor (CS35); +20 rank points each |
| ≥ 1.0 | **Success** | ×1 | +10 rank points each |
| ≥ 0.75 | **Partial** | ×0.5 | |
| < 0.75 | **Failure** | ×0.2 (at least 1 item) | Home after 1 day; **supplies come back; nothing is lost** |

- Worked: 3 Novice C Umas (54) at the Old Fort (48): ratio 1.12, a Success. 4 Hand B (120) with 2 dishes at ★2 (×1.10)
  at Echo Cave (80): 1.65, a Great. 4 Skilled A with 4 ★3 dishes and a duo pair (225) at the Sunken Temple (200): 1.13.

**CS50: loot and the log.**
- **Rolls:** 3 per Uma per day away, × the grade. Each roll draws **hides and scales 40%, bones and horns 30%,
  essences 30%** at the region's two grades (65/35). A special find has a 10% chance a day.
- Worth: about **55g a roll at the Old Fort, 153g at the Sunken Temple, 413g at the Sky Ruins**, so a party earns
  about what its Umas would gathering, plus the specials and the tool materials only expeditions give.
- **The log:** 3–6 lines a day from templates (setting out, a find, a fight won or lost, camp, the way home), with the
  party's names filled in at runtime; it shows in the morning summary and stays in the Diary.

## 11. The economy, worked (CS51–CS52)

The sim ([scratchpad, not in git]) plays the first year for **a sensible player**: plants the best-paying crop each block
can finish, tends every block it can, puts each Uma where her talent and the day's value meet, follows the chapter's
goals, plays each workshop at **Fine** on average (D23's casual-to-careful range), serves a staff meal when the last
one ends, buys beds when someone waits or they cost under four days' income, land and buildings as the Farm Rank opens
them, and keeps a reserve of 300g plus half a day's income. It leaves out the season's demand (+20%), so it's slightly
conservative. Recruits' talents and callings are drawn from the real release.

**CS51: Spring, day by day** (the run closest to the median of 30).

| Day | The crew | Bought, planted and what happened | The bin paid | Gold at night's end | Umas / beds | Farm Rank |
|---|---|---|---|---|---|---|
| 1 | 2 forage, 1 tend | plant the 9 free Carrot seeds in A (tended) | 30 | 530 | 3/3 | FR1 |
| 2 | 2 forage, 1 tend | — | 417 | 947 | 3/3 | FR1 |
| 3 | 2 forage, 1 tend | — | 436 | 1,383 | 3/3 | FR1 |
| 4 | 2 forage, 1 tend | plant Potato in A (tended, 315g); Uma #1 Hand in farming | 1,152 | 2,520 | 3/3 | FR1 |
| 5 | 2 forage, 1 tend | Dorm L2 (5 beds, 1,000g); Uma #2 Hand in foraging; Uma #3 Hand in foraging | 481 | 2,001 | 3/5 | FR1 |
| 6 | 2 forage, 1 tend | — | 483 | 2,484 | 3/5 | FR1 |
| 7 | 2 forage, 1 tend | Farm Rank 2 | 999 | 3,482 | 3/5 | FR2 |
| 8 | 1 forage, 2 tend | Block B (800g); plant Cabbage in A (tended, 810g); plant Cabbage in B (tended, 810g); chapter 1 done; Uma #4 joins (chapter) | 2,417 | 3,979 | 4/5 | FR2 |
| 9 | 1 forage, 1 ranch, 2 tend | a chicken (800g); a chicken (800g) | 653 | 2,991 | 4/5 | FR2 |
| 10 | 1 forage, 1 ranch, 2 tend | Farm Rank 3; Uma #5 joins (festival) | 858 | 4,410 | 5/5 | FR3 |
| 11 | 2 forage, 1 ranch, 2 tend | Dorm L3 (8 beds, 3,000g); Uma #6 joins (gate) | 854 | 2,523 | 6/8 | FR3 |
| 12 | 3 forage, 1 ranch, 2 tend | Mill (1,200g); Uma #1 Skilled in farming; Uma #3 Hand in farming | 988 | 2,871 | 6/8 | FR3 |

The sim counts the requests board as its average premium each night (half a request a day), so day 1 shows 30g before
anything has shipped.

- **Spring in sum:** 9,768g earned (forest 6,184, crops 2,132, requests 832, the ranch 620); 6 Umas by day 12; Farm
  Rank 3; chapter 1 done on day 8, the Flower Show won on the tie (52 against 52 and 40).
- **Never stingy:** after day 1 the player buys something useful every 1–4 days (beds on days 5 and 11, Block B on 8,
  two chickens on 9, the Mill on 12) and never ends a day with an Uma idle for want of gold.

**CS52: the first year's arc.**

| | Spring | Summer | Autumn | Winter | Year |
|---|---|---|---|---|---|
| **Earned** | 9,768 | 36,293 | 89,833 | 167,974 | **303,868** (+27,400 from milestones, chapters and festivals) |
| A day's income | 30 → 2,417 | 1,220 → 6,065 | 3,444 → 15,811 | 6,118 → 29,205 | |
| Biggest sources | Forest, crops | Crops, the Mine, the forest | Crops, the Kitchen, the ranch, the Mine | Crops, the Kitchen, the ranch, the Mine, requests | |
| **Gold at season's end** | **2,871** | **9,353** | **17,405** | **53,098** | |
| Umas (beds) | 6 (8) | 11 (12) | 15 (16) | 21 (30) | |
| Farm Rank | 3 | 4 | 5 | 6 | |
| Chapters done | 1 | 3 | 4 | 5 | |
| Best rank | Skilled | Skilled | Expert | Expert (3 Umas) | |
| Mine / Quarry floor | — | 10 / 6 | 13 / 8 | 15 / 10 | |
| Festival | Flower Show 1st | Derby 1st | Contest 1st | Animal Show 1st; Cup 3rd | |

**Where the gold went** (278,665g): the Dorm 105,000 (levels 2–7) · buildings 94,000 (Coop 2, the Barn and Barn 2,
Kitchen 2–4, Restaurant 2) · animals 28,800 · seeds 21,825 · land 11,800 (Blocks B–D) · stations 11,700 · feed 5,540.

**Across 30 runs** (different picks and recruits):

| | Lowest | **Median** | Highest |
|---|---|---|---|
| Gold, day 12 | 1,624 | **2,871** | 4,528 |
| Gold, day 24 | 1,443 | **8,945** | 20,215 |
| Gold, day 36 | 12,195 | **20,891** | 42,158 |
| Gold, day 48 | 25,036 | **56,025** | 134,544 |
| Earned in the year | 213,773 | **303,091** | 412,119 |
| Umas at year's end | 18 | **20** | 22 |
| Farm Rank at year's end | 6 | **6** | 6 |
| Festivals won (of 5) | 2 | **3** | 4 |
| Umas at Expert | 1 | **3** | 6 |

**By how well the workshops are played** (median of 30): a player who only ever scores **Rough** ends year 1 with
**30,000g** (218,000 earned, 19 Umas); **Fine**, 56,000g (303,000); **Masterwork**, 91,000g (372,000, 21 Umas). Skill
pays about a quarter more, never so much that a casual player falls behind.

**The verdict: neither stingy nor runaway.**
- **Not stingy:** day 1 starts with seeds in the ground and 500g; the first bed comes on day 5, the second block on
  day 8; a season's purchases always cost 1–4 days of that season's income (Block B 800g in Spring; the Barn 8,000g in
  Summer at ~3,000g a day; Kitchen 4 35,000g in Winter at ~14,000g a day).
- **Not runaway:** the year spends **84%** of what it earns, and ends with about **4 days of Winter's income** in hand
  (53,000g), less than Dorm 8 (85,000g) at FR7. Year 2's open sinks are larger than year 1's income: Dorm 8–10
  (415,000g), Restaurant 3–5 (175,000g), Kitchen 5 (70,000g), Barn 3–4 (80,000g), Forge 2–3 (70,000g), the boat
  (40,000g), Coop 3 (12,000g): **862,000g**, before decorations, which turn any surplus into Farm Rank.
- **The curve's shape:** income grows about ×50 in the year (from ~400g a day in the first week to 15,000–25,000g in
  late Winter), from three sources at once: more Umas (×7), higher ranks and deeper places (×5), and the workshops.
  The sinks grow with it: each Dorm level costs about ×1.7 the last.

## 12. Save v3 (CS53–CS54)

**CS53: the shape.** One version, with its parse and migration, as today (FW5, N5). Strict keys, explicit paths.

```ts
interface SaveV3 {
  version: 3
  account: Account                                  // unchanged; only a player's change moves updatedAt
  calendar: { day: number }                         // 1 = Spring 1, year 1 (CS1)
  gold: number
  roster: Record<OutfitId, RosterUma>               // every recruited Uma
  dorm: { level: number; home: OutfitId[] }          // who's on the farm (≤ beds); the rest are off-season
  visitors: { outfitId: OutfitId; from: 'gate' | 'festival' | 'expedition'; leaves: number; affinity: number }[]
  items: Record<ItemId, [number, number, number, number, number]> // the Warehouse: counts by ★1 … ★5
  bin: Record<ItemId, [number, number, number, number, number]>   // shipped today, paid tonight
  work: Record<OutfitId, WorkRow<FarmWorkRequest>>  // uma-work's rows; the clock is (day − 1) × 86,400,000 ms
  fields: { blocks: { id: 'A' | 'B' | 'C' | 'D'; tender: OutfitId | null; plots: Plot[] }[] }
  crops: Record<CropId, number>                     // crop points (levels, CS11)
  ranch: { animals: { id: string; kind: AnimalKind; building: 'coop' | 'barn'; affection: number; streak: number; carer: OutfitId | null; next: number }[] }
  places: { mine: { deepest: number; stairs: number }; quarry: { deepest: number; stairs: number } }
  buildings: Record<BuildingId, number>             // levels: dorm, coop, barn, kitchen, restaurant, forge, the stations, the boat
  tools: Record<ToolId, 1 | 2 | 3 | 4 | 5>
  workshops: { played: Record<'kitchen' | 'restaurant' | 'forge', number>; current: PlayInProgress | null; recipes: DishId[]; best: Record<string, number> }
  expeditions: { region: RegionId; party: OutfitId[]; supplies: ItemId[]; left: number; back: number }[]
  bonds: Record<PairKey, number>                    // 'idA:idB', ids sorted
  board: { id: string; from: CastId; item: ItemId; count: number; stars: number; due: number; reward: number; extra: Extra | null }[]
  diary: { shipped: Record<ItemId, number>; milestones: string[]; records: Record<string, number>; read: string[] }
  farm: { points: number; chapter: number; goals: Record<string, number>; festivals: { id: string; day: number; score: number; place: 1 | 2 | 3 }[] }
  summary: MorningSummary | null                    // the last night's, until dismissed
}

interface RosterUma {
  joined: number                                    // the day
  ranks: Record<Activity, { points: number; rank: 0 | 1 | 2 | 3 | 4 | 5; challenge: number }>
  affinity: number
  wellFed: number                                   // days left
}

interface Plot { crop: CropId | null; growth: number; ready: boolean; regrowing: boolean; own: boolean }
```

- **Talents aren't saved:** they're read from master data each boot (CS27), so a fixed release gives the same talents.
- **Size:** 60 Umas × 9 ranks, 1,770 pairs and the Warehouse stay well under Firestore's 1 MiB.

**CS54: the migration, v2 → v3** (D25, D24 #14). It runs once, on the first boot of the v3 app, and **never moves
`account.updatedAt`**.

| Step | What |
|---|---|
| 1 | **Running jobs finish:** every started entry in `work` completes into the Warehouse, as if its last night had come; queued jobs drop and return their inputs. The v3 `work` starts empty |
| 2 | **Materials are refunded per grade:** a raw line item **10g × its grade**, a refined one **15g × its grade**, a made item **15g × its grade × the refined items in its recipe** (an Arms Gem G3 is 15 × 3 × 10 = 450g). The owner's save holds none today, so in practice nothing is refunded |
| 3 | **Craft Level becomes her rank** in her calling's line (CS32), challenges done |
| 4 | **The roster:** every Uma in `umas` joins it; the Dorm's level is the lowest with a bed for each, free |
| 5 | **The calendar starts:** day 1, 500g plus the refunds, Block A, 9 Carrot seeds, chapter 1. If the roster holds fewer than 3, the start's picks (CS2) fill it to 3 |
| 6 | Everything else starts empty: Farm Rank 1, the Diary, bonds, the board |

`parseSave` reads v1, v2 and v3 and returns v3; a v1 save goes through v2. The server's first v3 write copies the v2
document to `saveBackups/{uid}-v2`, as today.

## 13. The packets (CS55)

**CS55: M4 is nine packets, F17–F25** (FR24 keeps F11–F16 for the HD-2D work). Each ships its rules in `@farm/domain`
with tests, its screens, and its manual page in `docs/game/` in the same change.

**M4 also takes one scope move, decided here:** every forest area and freshwater spot ships with ranks in M4, since
ranks open them (FC32 put "fishing spots, foraging" in M5). The sea stays with chapter 7 (M6). The Sawmill and the
Smokehouse open at Farm Rank 3, so M4 has all three of its places' stations.

| Id | What | Covers | Needs | Size |
|---|---|---|---|---|
| **F17** | **Save v3 and the migration:** the shape, `parseSave` for v1–v3, the v2 → v3 migration, `newSave` for day 1, the Warehouse by stars | CS1, CS3, CS32, CS53, CS54 | This spec | M |
| **F18** | **The calendar and End the day:** uma-work on the day clock, the night's nine steps, seeded nights, the morning summary, the nudge, the account bar's date, the bottom bar (Farm · Roster · End the day · Diary · Menu; the Diary tab holds the chapter's goals until M6). `farm-push-tick` stays paused | CS4–CS8 | F17 | M |
| **F19** | **Goods, the bin and gold:** M4's catalogue (crops, the forest, the freshwater fish, the three stations' forms), the price rule, stars, demand, the bin, gold in the account bar, the shop's sheet; the manual's generated goods page | CS9, CS10, CS19, CS26 | F18 | M |
| **F20** | **The Fields:** Blocks A–D, plots, seeds, tap to plant and harvest, tending and growth, regrowing, seeds back, crop levels, withering; the shop's seeds by tier | CS11, CS12 | F19 | M |
| **F21** | **Talents and ranks:** the stat → talent rule, nine activities' ranks and points, the challenges (M4's three activities live, the rest counted for later), what a rank gives, the favourite line; talents and ranks on the album's cards, filters and sorts | CS27–CS31, CS33 | F17 | M |
| **F22** | **The forest, the Fishery and three stations:** foraging and fishing as day jobs, every area and freshwater spot, yields, sizes; the Mill, the Sawmill and the Smokehouse | CS15–CS18 | F19, F21 | M |
| **F23** | **The roster:** the start's six cards and three picks, the Dorm's levels and beds, visitors at the Gate with chat and gifts (affinity to 2 hearts), chapter recruits, the off-season and swaps | CS2, CS34–CS36, CS45 (chat and gifts) | F21 | M |
| **F24** | **Farm Rank and chapter 1:** FR points, thresholds and M4's unlocks, Diary entries and milestones counted (the Diary's screen is M6), the goal list, the two scenes with a simple scene player (portrait, line, tap), the cast's lines; then **M4's phone check** by the owner | CS38 (counts), CS39, CS41, CS42 | F20, F22, F23, F25 | M |
| **F25** | **Art for M4 (ChatGPT, uma-art):** the Dorm and the shipping bin (Hub buildings), the seed-packet badge, the UI marks, and three cast portraits (the Mayor, Marta, Old Ben); a uma-art release that F24 pins | CS19 (M4's rows) | This spec's art table | S |

Order: F17 first; then F18 and F21 side by side; F19; F20 and F22; F23; F25 any time from now; F24 last.

**M5, one line each** (chapters 2–5):
- **F26 The Mine and the Quarry:** 30 floors, the stairs, the Smelter and the Cutter, chapter 3.
- **F27 The ranch:** the Coop and the Barn, animals, feed, affection, products, cloth at the Mill, chapter 2.
- **F8 The minigame contract and the Kitchen** (re-scoped, FR24): FR21's rules, the cooking game on a flat scene,
  recipes, the staff meal and well fed, chapter 4; the stage scene comes in M7.
- **F28 Expeditions:** regions, parties, power, results, loot, the log, chapter 5.
- **F29 Art for M5 (ChatGPT):** Egg, Duck Egg, Milk, Goat Milk, the two feeds, seven animals, the Coop and the
  expedition post, four cast portraits, chapter items.

**M6, one line each** (chapters 6–8):
- **F30 The requests board.** **F31 The Farm Diary's screens.** **F32 Festivals and the rivals,** the Cup's results
  card. **F33 Bonds and conversations** (250 templates). **F34 Affinity's praise and story beats.**
  **F35 The Restaurant's serving game** (flat scene). **F36 The Forge's merge game,** tools and goods (flat scene).
  **F37 Chapters 6–8, the sea and the boat.** **F38 Art for M6 (ChatGPT):** tools in five tiers, the board, trophies,
  ribbons, decorations, four cast portraits.

F13 and F14 stay reserved for the Restaurant's and the Forge's stage scenes in M7.

## Calls

| Id | Call |
|---|---|
| CS1 | Units: farm days, gold rounded to 5g, stars 1–5, grades G1–G10, seeded draws, counts rounded half up |
| CS2 | The start shows six seeded candidates with their day-1 talents; pick any three; one free redraw |
| CS3 | Day 1: 500g, 9 free Carrot seeds, Block A of 9 plots, the Woods and the Pond, the bin, Dorm 1 (3 beds), the shop |
| CS4 | Four 12-day seasons set seeds, fish, the forest's seasonal family, demand (+20%) and the day-10 festival; out-of-season crops wither on the last night |
| CS5 | The morning summary: the bin, work done, ranks, hearts, what's new, today's nudges, in that order |
| CS6 | End the day glows "All set" when nothing waits; otherwise a count badge and a one-line confirm, which Menu can turn off |
| CS7 | The night settles in nine fixed steps: the bin, crops, animals, jobs, workshops, ranks and bonds, the calendar, goals, the summary |
| CS8 | Nights are seeded by account, day and draw, so the same save always gives the same morning |
| CS9 | One price rule: a ten-grade ladder (30–300g) × the family's factor; refined ×1.5; made goods and dishes ×1.25 their inputs; +25% a star, not compounded; +20% demand |
| CS10 | The bin is the floor price: anything, any time, paid at night; requests, the Restaurant and prizes pay more |
| CS11 | 22 shop crops and 5 rare ones, 4–10 days, with seeds back (5–35%) and crop levels 1–10 (20 × L points a level, +0.1 quality each) |
| CS12 | Four blocks of 9 plots (free, 800g, 3,000g, 8,000g at FR1, 2, 4, 6); a tender grows her block 1.25–1.75 a night; Ready at days − 0.5 |
| CS13 | The ranch: 7 animals, feed 10–20g a day, a carer per pen of 4, affection to 10 hearts at 40…1,300 points, product stars = hearts ÷ 2.5 |
| CS14 | The Mine and the Quarry: 30 floors, main grade ⌈floor ÷ 3⌉, the deepest floor by rank, ⌈f ÷ 5⌉ Uma-days to each stairs |
| CS15 | Seven fishing spots by rank, the sea at chapter 7 and the deep sea by boat; fish by season; sizes for records and the Derby |
| CS16 | Six forest areas by rank, each two grades of woods, mushrooms, herbs and the season's family |
| CS17 | A gathering day brings round(base 3–5 × rank × talent × tool × well fed × bond) items; the four places pay within ~40% at every rank |
| CS18 | Five stations, one a gathering place, 8 items a day at ×1.5; the Mill by chapter 1, the Sawmill and Smokehouse at FR3, the Smelter and Cutter with chapter 3 |
| CS19 | 366 of 370 goods have uma-art icons; Egg, Duck Egg, Milk and Goat Milk are new, with feed, animals, tools, places, the cast and Diary art listed for F25, F29 and F38 |
| CS20 | Every workshop: one play a day, one assistant (+10% yield a rank), FR21's contract and tiers |
| CS21 | The Kitchen: 6–15 base dishes by level, up to 3 recipes a play, 80 dishes at ×1.25 their inputs, recipes at 5× the dish's price |
| CS22 | The staff meal: one dish feeds three; well fed for 1, 2 or 3 days by tier; ×1.25 work, +0.25 quality, never stacking |
| CS23 | The Restaurant: 8–25 covers, dishes at their bin price plus tips of 20% × the tier; it always beats the bin |
| CS24 | The Forge's merge: 5 × 5, 90 s, metal and accent Scrap → Bar → Blank → Part, two Parts forge for +20, Parts left +4 |
| CS25 | The Forge makes Rings and Fittings (×1.25 their inputs) and tool upgrades in four tiers, refunding 15–50% of the inputs for better play |
| CS26 | Stars = 1 + ⌊Q + u⌋ from rank, talent, care, crop level, inputs, tools and well fed; expected stars 1 + Q |
| CS27 | Talent = 5★ stat × (100 + growth) ÷ 100, cut at 150/138/126/114/104/96/88; expeditions the mean of her best three, cut at 136…120 |
| CS28 | A talent sets yield ×0.85–1.2, quality −0.75…+1, rank points ×0.8–1.5, growth, affection and expedition power |
| CS29 | 10 rank points a day of work (× talent, ×1.2 favourite, ×1.25 well fed); ranks at 40, 160, 400, 900, 2,000 |
| CS30 | A challenge for each of the 9 × 5 rank-ups, the depth ones "reach the deepest place your rank allows" |
| CS31 | A rank gives yield ×1–2, growth 1.25–1.75, quality +0–2.5, the deepest place, expedition power, seeds back and affection |
| CS32 | Craft Level maps to her calling line's rank (1–5 Novice … 46–50 Legend), points within the band, challenges done |
| CS33 | Her calling is her favourite line: ×1.2 rank points, ×1.5 bond points with a partner who shares it |
| CS34 | The Dorm: ten levels, 3 → 60 beds, 520,000g in all, gated by Farm Rank |
| CS35 | Visitors: the Gate every fourth morning while a bed is free (join at 2 hearts), chapters, festivals, requests and expeditions |
| CS36 | Recruits past the beds are off-season, keeping everything; swaps at the Dorm are free, next morning |
| CS37 | The board: 3–5 requests, one new a day, worth ~40% of a day's shipping, paid ×1.5, 1 in 5 with an extra |
| CS38 | The Diary: 370 collection entries, records, conversations and milestones with gold and FR points |
| CS39 | The Farm's Rank: points from shipping, the Diary, chapters, festivals and decorations; ten ranks at 0…22,000 opening land, capacity and regions |
| CS40 | Five festivals scored 0–100 by formula against Ashby Orchards (34 + 6 FR) and Varga Ranch (26 + 7 FR), each +6 in its specialty |
| CS41 | An original cast of eleven; Umas only in runtime roles |
| CS42 | Chapter 1, "A Field Again": six goals, an opening and a closing scene, the Mill and a recruit as rewards |
| CS43 | Chapters 2–8 with their openings, goals and timing; the Harvest Cup final in year 2 |
| CS44 | Bonds: +10 a shared day (more on trips, teams, meals), hearts at 50…750, +10% side by side at 3, duo moves at 5 |
| CS45 | Affinity: chats +15, gifts −20…+60, praise +20 a day; visitors stay at 2 hearts; story beats at 2, 4, 6, 8, 10 |
| CS46 | Conversation templates keyed by place × hearts × temperament (top stat), line and distance, chosen by score and seed; 250 in M6 |
| CS47 | Example lines with {a} and {b} |
| CS48 | Seven regions, levels 1–40, 2–5 days, opened by Farm Rank; 1–3 parties out by FR |
| CS49 | Power = 10 × (rank + 1) + 2 × talent step a member, × supplies, duo moves and well fed; graded Great, Success, Partial, Failure |
| CS50 | Loot: 3 rolls an Uma a day of hides, bones and essences at the region's grades, special finds, a templated log; nothing lost on failure |
| CS51 | Spring worked day by day: 9,768g earned, 2,871g in hand and 6 Umas at day 12 |
| CS52 | The first year (medians of 30 runs): ~303,000g earned, ~56,000g left, 20 Umas, FR6, chapters 1–5; neither stingy nor runaway |
| CS53 | Save v3's shape: calendar, gold, roster, Dorm, Warehouse by stars, fields, ranch, places, workshops, expeditions, bonds, board, Diary, farm |
| CS54 | v2 → v3: jobs finish, materials refunded per grade, Craft Level → rank, the roster from `umas`, day 1; `updatedAt` never moves |
| CS55 | M4 is F17–F25 (nine packets); M5 is F26–F29 and F8; M6 is F30–F38; F11–F16 stay M7's |
