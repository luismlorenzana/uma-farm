# F19 — Goods, prices, the bin and gold

**uma-farm · Claude · M · Needs: F17 · Beside: F18, F21 · Unblocks: F20, F22 · Milestone M4, the loop on today's map**

## Why

Selling is the loop's spine (FC2, FC3): what the farm grows, gathers and refines goes in the shipping bin, the bin pays
overnight, and the gold buys seeds, land, beds and buildings. This packet gives every good its price by one rule, its
stars, the bin, gold in the account bar, the Warehouse by stars and the shop's sheet.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS9, CS10, CS19**, **CS26** (the star formula), and the tables it prices:
  CS11's "Price ★1" column, CS14's and CS16's family tables, CS15's fish table; CS4 (demand by season), CS7 (step 1),
  CS53 (`items`, `bin`, `gold`, `diary.shipped`), CS55.
- [core-loop.md](../../design/core-loop.md): FC2, FC3, FC10, FC31.
- [decisions.md](../../decisions.md): D24 #12 (stars not compounded), D27, D28.
- The manual: [materials.md](../../game/materials.md) (today's ids and the live-block renderer) and
  [wilds.md](../../game/wilds.md) (the Warehouse page, item icons).
- Code: F17's `goods/ids.ts`, the Warehouse bridge (`addGoods`, `takeGoods`), `spendGold`, `earnGold`, `round5`,
  `draw`, `farm.counts`; F18's `endDay` steps (if landed); `packages/domain/src/items/lines.ts` (`itemNameOf`),
  `docs/render.ts` and `docs/docs.test.ts` (live blocks); `apps/web/src/items/` (`frames.ts`, `ItemIcon.tsx`,
  `words.ts`), `places/warehouse/` (the shelf view), `shell/Bars.tsx` (the account bar's chips).
- uma-art 2.21.0's `items/atlas.json` (families, grades, names) and uma-kit's `CurrencyChip`.

## Decisions made

### From the spec

- **One price rule (CS9):**
  1. **The ladder:** a family's grade *g* sells at `LADDER[g] × the family's factor`, rounded to 5g.

     | Grade | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 |
     |---|---|---|---|---|---|---|---|---|---|---|
     | Ladder | 30 | 40 | 50 | 65 | 85 | 110 | 140 | 180 | 230 | 300 |

     Factors: ores ×1.0, stones ×0.8, crystals ×1.6, woods ×0.8, mushrooms ×1.0, herbs and spices ×0.9, fruits ×1.1,
     nuts and seeds ×1.0, sweets ×1.1, fish ×1.3, hides and scales ×1.5, bones and horns ×1.6, essences ×1.8.
  2. **Refined** (a station's 1 → 1 output) sells at **×1.5** its input, rounded to 5g.
  3. Made goods and dishes sell at ×1.25 the sum of their inputs at ★1 (their packets: F8, F36).
  4. **Crops have their own prices** (CS11), wherever they come from, so the seven crops that are also forest goods
     (Basil, Mint, Ginger, Mandrake, Peanut, Sunflower Seed, Sugar Beet) keep them. Crop prices ★1: carrot 60, potato 55,
     mint 45, onion 100, cabbage 260, asparagus 480, tomato 70, basil 45, bell-pepper 60, eggplant 95, sunflower-seed 75,
     corn 140, wheat 40, peanut 35, rice 50, sugar-beet 120, emperor-pumpkin 600, buckwheat 75, oats 40, barley 45,
     rye 60, ginger 200, golden-carrot 600, sunwheat 260, moonrice 240, wild-rice 160, mandrake 520. A crop's refined
     form (a flour, Dried Mint) is ×1.5.
  5. **Stars add +25% a star, not compounded:** ★1 ×1, ★2 ×1.25, ★3 ×1.5, ★4 ×1.75, ★5 ×2 (D24 #12).
  6. **Demand adds +20%** to the season's families, on top (CS4): Spring vegetables and sweets; Summer fruits and fish;
     Autumn grains, mushrooms, nuts and seeds; Winter dishes, cloth and preserves.
- **The worked prices are tests (CS9):** Silver Ore **65g**; Silver Ingot **100g**; a ★3 Silver Ingot **150g**; Salmon
  **110g**; a ★2 Salmon in Summer **165g**. The family tables in CS14, CS15 and CS16 are the rule's output, row for
  row, and a test checks them (Herbs and spices raw: 45 · 45 · 45 · 60 · 200 · 100 · 125 · 160 · 520 · 270).
- **The bin is the floor price (CS10):** it takes anything with a price at any time in the day and pays at night (CS7
  step 1). There's no selling cap. Requests (×1.5), the Restaurant and prizes pay more, in later packets.
- **Stars (CS26):** each good adds up quality points *Q* from its sources and draws `stars = 1 + ⌊Q + u⌋`, clamped to
  1–5, with `u` a seeded draw in [0, 1). The expected stars are 1 + *Q*; *Q* ≥ 4 is always ★5. The sources:

  | Source | Gathering | Farming (tended) | Ranch | Kitchen and Forge | Stations |
  |---|---|---|---|---|---|
  | Her rank | 0.5 × rank (0 → 2.5) | the tender's | — | the assistant's | — |
  | Her talent | G −0.75 … S +1 | the tender's | — | the assistant's | — |
  | Care | — | +0.25 for being tended | hearts ÷ 2.5 | — | — |
  | Crop level | — | +0.1 × (level − 1) | — | — | — |
  | Inputs | — | — | — | mean input ★ − 1 | the input's stars carry |
  | Tool | +0.25 a tier | Hoe +0.25 a tier | Brush +0.25 a tier | — | — |
  | Boost | well fed +0.25 | well fed +0.25 | — | — | — |

  This packet owns the draw and the price; F21 gives the rank and talent terms, F20 and F22 sum them for their goods.
  CS26's worked rows are tests (a Novice C forager *Q* 0.25: ★1 75%, ★2 25%; an Expert A tender with an Iron Hoe, a
  level-4 crop and well fed, *Q* 3.55: ★4 45%, ★5 55%).
- **The catalogue's art (CS19):** every good's id is uma-art's, names come from ids as today, and every good this packet
  prices already has its icon in uma-art 2.21.0.

### Decided here (the spec left these open)

1. **The catalogue this packet prices** is every good CS19 prices by the ladder or as a crop: the 260 goods of F17's
   `goods/ids.ts` (27 crops and 10 flours, the forest's 113, mining's 60, fishing's 20, expeditions' 30). Each carries
   its family, grade, raw or refined, price ★1 and, for refined goods, its input; F20 and F22 add seasons and stations.
   Only crops, forest goods, freshwater fish and the three stations' forms can be had in M4; the rest are priced so a
   migrated Warehouse can sell them. The ranch's, the dishes' and the Forge's goods are priced by F27, F8 and F36.
2. **Rounding:** a unit price after stars and demand rounds to 5g (half up), then × the count. A refined price is ×1.5
   of its input's rounded price, then rounded.
3. **Demand covers a family's raw and refined goods.** Winter's preserves are the fruits' refined row, cloth the fibers'
   refined row, dishes every dish. A good is in demand once, however many rules name it.
4. **Shipping can be taken back until the night:** a mis-tap on a phone shouldn't cost a good. Once the night pays,
   it's final, and nothing is ever bought back.
5. **Seeds have no bin price** (F17 decision 6): the bin refuses them.
6. **What the bin's payout writes:** `gold`; `farm.counts['gold-shipped']` (the bin's gold, for the Farm Rank and its
   milestones, F24); `diary.shipped[id] += count` (the Diary's collections, F24). The summary's bin section lists each
   good and star with its count and gold, the total, and the demand marked.
7. **The shop's sheet** opens from the shop on the map (`?sheet=shop`): lines of things to buy with a price and an
   optional gate ("From Farm Rank 2"), a count stepper, and **Buy · 180g**, refused when gold is short. In M4 only F20's
   seeds sell there; land, beds and stations are bought at their own places.
8. **The bin's sheet** opens from the shipping bin on the map (`?sheet=bin`): today's bin with each line's **Take back**,
   the night's estimate ("About 1,240g tonight"), and **Ship**, which opens the Warehouse in a pick mode (tap ships one;
   **Ship all** ships a good's every star).
9. **The Warehouse by stars:** families in tabs (Crops, the forest's six, Fish, Mining, Seeds), each good with its five
   star counts, its price at each star, and "In demand" when it is; a tap shows its family, grade, what it refines into
   or from, and **Ship**.
10. **Gold in the account bar:** a chip with `currency/gold` (F25; a plain "g" until then) and the gold; it opens the
    bin's sheet.

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

The catalogue module's layout; the sheets' drawing within the kit's `Sheet`; how the Warehouse's pick mode is routed.

## Do

1. **The catalogue and prices** in `@farm/domain` (decisions 1–3): `goodOf(id)`, `priceOf(id, stars, day)`,
   `inDemand(id, day)`, with the tables' tests.
2. **Stars** (CS26): `quality(sources)` and `drawStars(q, u)`, with the worked rows as tests.
3. **The bin:** `ship(save, id, stars, count)`, `takeBack(…)`, and night step 1, `payBin(save, day)` (decision 6). If
   F18 has landed, put it in `endDay`'s step 1; if not, F18 wires it.
4. **The shop's sheet** (decision 7) as a frame F20 fills, buying through `spendGold`.
5. **The screens:** the bin's sheet, the Warehouse by stars, the gold chip (decisions 8–10), and the summary's bin
   section.
6. **The manual:** a new [docs/game/goods.md](../../game/goods.md) with live blocks rendered from the code (the ladder
   and factors, every family's raw and refined prices G1 → G10, the crops' prices, demand by season), regenerated by
   `pnpm docs:update` and checked by the docs test; hand-written parts for stars, the bin and gold ("built in F19, live
   from F24"); its row in [the manual's index](../../game/README.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks are ≤ 180 KB gzip; the private-content guard passes.
- Domain tests: CS9's five worked prices; CS14's, CS15's and CS16's tables equal the rule's output; ★1 to ★5 are ×1,
  ×1.25, ×1.5, ×1.75 and ×2 of the same base; demand lifts a Summer Salmon and a Summer Salmon Fillet and not a Summer
  Carrot; CS26's worked *Q* rows and their star shares (over a seeded sample); shipping, taking back and paying move
  the Warehouse, the bin, gold, `farm.counts['gold-shipped']` and `diary.shipped` exactly; the bin refuses a seed.
- `pnpm docs:update` leaves `goods.md` unchanged.
- Locally (loop build) at 390×844, on a dev save holding a few goods: ship two stars of a good, take one back, end the
  day; the summary's bin section lists them with the right gold, the chip shows the new total, and the Warehouse shows
  the remaining stars.
- Production: the deploy passes, health shows the commit, and https://uma-farm.web.app plays the Wilds as before.

## Deliver

Commit to `main` (`feat: goods, prices, the bin and gold (F19)`, `git status` first), push, and watch the run
(`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a Done
row in [the handoff](../README.md) with the run's link, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–10.
