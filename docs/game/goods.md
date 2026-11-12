# Goods: prices, stars, the bin and gold

**Built in F19, live from F24.** Selling is the
loop's spine: what the farm grows, gathers and refines goes in the shipping bin, the bin pays overnight, and the gold buys
seeds, land, beds and buildings. This page is the catalogue's prices, stars, the bin, gold, the shop and the Warehouse by
stars, as built. The rules are in `@farm/domain` (`goods/rule.ts`, `goods/ids.ts`, `goods/prices.ts`,
`goods/stars.ts`, `save/bin.ts`, `save/shop.ts`); the screens in `apps/web/src/loop/` (`GoodsSheets.tsx`,
`WarehousePage.tsx`, `goods-view.ts`) and `shell/Bars.tsx`. The spec is [core-spec.md](../design/core-spec.md) CS9,
CS10, CS19 and CS26; the calls are D32.

```
 ┌──────────────────────────────────┐
 │ (L)            ● 3   (g) 1,240  sync │  the date chip, then gold: opens the bin
 ├──────────────────────────────────┤
 │   /warehouse            the Warehouse by stars: families in tabs, five stars a good
 │   /warehouse?pick=bin   the same, to ship: a tap ships one, Ship all every star
 │   ?sheet=bin            the shipping bin: today's lines, Take back, "About 1,240g tonight", Ship
 │   ?sheet=shop           the shop: lines, a price, a gate, Buy · 180g
 ├──────────────────────────────────┤
 │ Farm  Roster  (End day)  Diary  Menu │
 └──────────────────────────────────┘

 Warehouse ──Ship──► bin ──End the day (step 1)──► gold, gold-shipped, diary.shipped
     ▲                │
     └──Take back─────┘  (until the night; after it, final)
```

## One price rule (CS9)

Every good's price ★1 comes from one rule, in this order:

1. **The ladder:** a family's grade *g* sells at `LADDER[g] × the family's factor`, rounded to 5g.
2. **Refined** (a station's 1 → 1 output) sells at **×1.5** its input's rounded price, rounded to 5g.
3. **Made goods and dishes** sell at **×1.25** the sum of their inputs at ★1 (`madePrice`; F8 and F36 use it).
4. **Crops have their own prices** (CS11), wherever they come from, so the seven crops that are also forest goods
   (Basil, Mint, Ginger, Mandrake, Peanut, Sunflower Seed, Sugar Beet) keep them. A crop's refined form is ×1.5.
5. **Stars add +25% a star, never compounded:** ★1 ×1, ★2 ×1.25, ★3 ×1.5, ★4 ×1.75, ★5 ×2 (D24 #12).
6. **Demand adds +20%** to the season's families, on top.

**Rounding (decision 2):** the unit price after stars and demand rounds to 5g once (half up), then × the count. So a
★2 Salmon in Summer is 110 × 1.25 × 1.2 = **165g**, and three of them **495g**.

| Worked (CS9) | Price |
|---|---|
| Silver Ore (ores G4) | 65 × 1.0 = **65g** |
| Silver Ingot | 65 × 1.5 = 97.5 → **100g** |
| ★3 Silver Ingot | 100 × 1.5 = **150g** |
| Salmon (fish G5) | 85 × 1.3 = 110.5 → **110g** |
| ★2 Salmon in Summer | 110 × 1.25 × 1.2 = **165g** |

<!-- live:price-ladder -->
| Grade | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 |
|---|---|---|---|---|---|---|---|---|---|---|
| The ladder | 30g | 40g | 50g | 65g | 85g | 110g | 140g | 180g | 230g | 300g |

| Family | Factor | Where from | Raw G1 → G10, ★1 | Refined |
|---|---|---|---|---|
| Grains | Crops (CS11) | The Fields | 40 · 40 · 45 · 50 · 140 · 60 · 75 · 160 · 240 · 260 | ×1.5 |
| Vegetables | Crops (CS11) | The Fields | 60 · 55 · 260 · 100 · 70 · 60 · 95 · 480 · 600 · 600 | — |
| Herbs and spices | ×0.9 | The forest, some crops | 45 · 45 · 45 · 60 · 200 · 100 · 125 · 160 · 520 · 270 | ×1.5 |
| Nuts and seeds | ×1.0 | The forest (Autumn), two crops | 35 · 75 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | ×1.5 |
| Sweets | ×1.1 | The forest (Spring), Sugar Beet | 35 · 45 · 120 · 70 · 95 · 120 · 155 · 200 · 255 · 330 | ×1.5 |
| Fruits | ×1.1 | The forest (Summer) | 35 · 45 · 55 · 70 · 95 · 120 · 155 · 200 · 255 · 330 | ×1.5 |
| Mushrooms | ×1.0 | The forest | 30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | ×1.5 |
| Woods | ×0.8 | The forest | 25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240 | ×1.5 |
| Ores | ×1.0 | The Mine | 30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | ×1.5 |
| Stones | ×0.8 | The Quarry | 25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240 | ×1.5 |
| Crystals | ×1.6 | The Quarry | 50 · 65 · 80 · 105 · 135 · 175 · 225 · 290 · 370 · 480 | ×1.5 |
| Fish | ×1.3 | The Fishery | 40 · 50 · 65 · 85 · 110 · 145 · 180 · 235 · 300 · 390 | ×1.5 |
| Hides and scales | ×1.5 | Expeditions | 45 · 60 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450 | — |
| Bones and horns | ×1.6 | Expeditions | 50 · 65 · 80 · 105 · 135 · 175 · 225 · 290 · 370 · 480 | — |
| Essences | ×1.8 | Expeditions | 55 · 70 · 90 · 115 · 155 · 200 · 250 · 325 · 415 · 540 | — |
<!-- /live -->

### Stars and prices

<!-- live:star-prices -->
| Stars | Factor | Silver Ingot | Salmon, Summer (in demand) | Carrot, Summer |
|---|---|---|---|---|
| ★1 | ×1 | 100g | 130g | 60g |
| ★2 | ×1.25 | 125g | 165g | 75g |
| ★3 | ×1.5 | 150g | 200g | 90g |
| ★4 | ×1.75 | 175g | 230g | 105g |
| ★5 | ×2 | 200g | 265g | 120g |
<!-- /live -->

### Demand by season (CS4, decision 3)

Demand covers a family's raw and refined goods. Winter's preserves are the fruits' refined row, cloth the fibers'
refined row (the ranch's, F27) and dishes every dish (F8). A good is in demand once, however many rules name it. A crop
follows its uma-art family, so Sugar Beet is a Spring sweet and Peanut an Autumn nut; Ginger is never in demand.

<!-- live:demand -->
| Season | In demand (+20%) | Goods lifted |
|---|---|---|
| Spring | Vegetables, Sweets | 30 of 260 |
| Summer | Fruits, Fish | 40 of 260 |
| Autumn | Grains, Mushrooms, Nuts and seeds | 60 of 260 |
| Winter | Dishes, Cloth (the refined row), Preserves (the refined row) | 10 of 260 |
<!-- /live -->

## The catalogue (CS19, decision 1)

The 260 goods of `goods/ids.ts` carry their family, grade, raw or refined, price ★1 and, for a refined good, its input
(`goodOf(id)`; `refinedOf(id)` goes the other way). Names come from the ids (`goodName`: "Sunflower Seed", "Carrot
seeds", "Carrot seeds (own)"), and icons from uma-art 2.21.0's items atlas, a family's raw row with its refined row
below. Only crops, forest goods, freshwater fish and the three stations' forms can be had in M4; the rest are priced so a
migrated Warehouse can sell them. The ranch's goods, the dishes and the Forge's are priced by F27, F8 and F36. Seeds
have no price: a seed shows its crop's icon with uma-art's seed-packet badge in its corner (F25's `farm/seed-packet`, pinned from F49), an own seed's with a green dot; without the mark, F20's corner tag (brown from the shop, green for own seeds).

### The crops' own prices (CS11)

<!-- live:crop-prices -->
| Crop | Id | Family | Price ★1 | Refined | Its price ★1 | In demand |
|---|---|---|---|---|---|---|
| Carrot | `carrot` | Vegetables | 60g | — | — | Spring |
| Potato | `potato` | Vegetables | 55g | — | — | Spring |
| Mint | `mint` | Herbs and spices | 45g | Dried Mint | 70g | — |
| Onion | `onion` | Vegetables | 100g | — | — | Spring |
| Cabbage | `cabbage` | Vegetables | 260g | — | — | Spring |
| Asparagus | `asparagus` | Vegetables | 480g | — | — | Spring |
| Tomato | `tomato` | Vegetables | 70g | — | — | Spring |
| Basil | `basil` | Herbs and spices | 45g | Dried Basil | 70g | — |
| Bell Pepper | `bell-pepper` | Vegetables | 60g | — | — | Spring |
| Eggplant | `eggplant` | Vegetables | 95g | — | — | Spring |
| Sunflower Seed | `sunflower-seed` | Nuts and seeds | 75g | Sunflower Oil | 115g | Autumn |
| Corn | `corn` | Grains | 140g | Cornmeal | 210g | Autumn |
| Wheat | `wheat` | Grains | 40g | Wheat Flour | 60g | Autumn |
| Peanut | `peanut` | Nuts and seeds | 35g | Peanut Butter | 55g | Autumn |
| Rice | `rice` | Grains | 50g | Polished Rice | 75g | Autumn |
| Sugar Beet | `sugar-beet` | Sweets | 120g | Beet Sugar | 180g | Spring |
| Emperor Pumpkin | `emperor-pumpkin` | Vegetables | 600g | — | — | Spring |
| Buckwheat | `buckwheat` | Grains | 75g | Buckwheat Flour | 115g | Autumn |
| Oats | `oats` | Grains | 40g | Rolled Oats | 60g | Autumn |
| Barley | `barley` | Grains | 45g | Pearl Barley | 70g | Autumn |
| Rye | `rye` | Grains | 60g | Rye Flour | 90g | Autumn |
| Ginger | `ginger` | Herbs and spices | 200g | Ground Ginger | 300g | — |
| Golden Carrot | `golden-carrot` | Vegetables | 600g | — | — | Spring |
| Sunwheat | `sunwheat` | Grains | 260g | Sunwheat Flour | 390g | Autumn |
| Moonrice | `moonrice` | Grains | 240g | Moonrice Flour | 360g | Autumn |
| Wild Rice | `wild-rice` | Grains | 160g | Hulled Wild Rice | 240g | Autumn |
| Mandrake | `mandrake` | Herbs and spices | 520g | Mandrake Powder | 780g | — |
<!-- /live -->

### Every family, G1 → G10

Prices out of demand; in demand, ×1.2 and rounded to 5g again.

<!-- live:goods-prices -->
### Grains

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Wheat (crop) | 40g | 80g | Wheat Flour | 60g | 120g |
| G2 | Oats (crop) | 40g | 80g | Rolled Oats | 60g | 120g |
| G3 | Barley (crop) | 45g | 90g | Pearl Barley | 70g | 140g |
| G4 | Rice (crop) | 50g | 100g | Polished Rice | 75g | 150g |
| G5 | Corn (crop) | 140g | 280g | Cornmeal | 210g | 420g |
| G6 | Rye (crop) | 60g | 120g | Rye Flour | 90g | 180g |
| G7 | Buckwheat (crop) | 75g | 150g | Buckwheat Flour | 115g | 230g |
| G8 | Wild Rice (crop) | 160g | 320g | Hulled Wild Rice | 240g | 480g |
| G9 | Moonrice (crop) | 240g | 480g | Moonrice Flour | 360g | 720g |
| G10 | Sunwheat (crop) | 260g | 520g | Sunwheat Flour | 390g | 780g |

### Vegetables

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Carrot (crop) | 60g | 120g |
| G2 | Potato (crop) | 55g | 110g |
| G3 | Cabbage (crop) | 260g | 520g |
| G4 | Onion (crop) | 100g | 200g |
| G5 | Tomato (crop) | 70g | 140g |
| G6 | Bell Pepper (crop) | 60g | 120g |
| G7 | Eggplant (crop) | 95g | 190g |
| G8 | Asparagus (crop) | 480g | 960g |
| G9 | Golden Carrot (crop) | 600g | 1,200g |
| G10 | Emperor Pumpkin (crop) | 600g | 1,200g |

### Herbs and spices

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Basil (crop) | 45g | 90g | Dried Basil | 70g | 140g |
| G2 | Mint (crop) | 45g | 90g | Dried Mint | 70g | 140g |
| G3 | Rosemary | 45g | 90g | Dried Rosemary | 70g | 140g |
| G4 | Thyme | 60g | 120g | Dried Thyme | 90g | 180g |
| G5 | Ginger (crop) | 200g | 400g | Ground Ginger | 300g | 600g |
| G6 | Peppercorn | 100g | 200g | Ground Pepper | 150g | 300g |
| G7 | Cinnamon | 125g | 250g | Ground Cinnamon | 190g | 380g |
| G8 | Saffron | 160g | 320g | Saffron Threads | 240g | 480g |
| G9 | Mandrake (crop) | 520g | 1,040g | Mandrake Powder | 780g | 1,560g |
| G10 | Phoenix Pepper | 270g | 540g | Phoenix Spice | 405g | 810g |

### Nuts and seeds

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Peanut (crop) | 35g | 70g | Peanut Butter | 55g | 110g |
| G2 | Sunflower Seed (crop) | 75g | 150g | Sunflower Oil | 115g | 230g |
| G3 | Sesame | 50g | 100g | Sesame Paste | 75g | 150g |
| G4 | Walnut | 65g | 130g | Walnut Paste | 100g | 200g |
| G5 | Chestnut | 85g | 170g | Chestnut Paste | 130g | 260g |
| G6 | Almond | 110g | 220g | Almond Paste | 165g | 330g |
| G7 | Pistachio | 140g | 280g | Pistachio Paste | 210g | 420g |
| G8 | Macadamia | 180g | 360g | Macadamia Butter | 270g | 540g |
| G9 | Thundernut | 230g | 460g | Thundernut Oil | 345g | 690g |
| G10 | Worldseed | 300g | 600g | Worldseed Oil | 450g | 900g |

### Sweets

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Honeycomb | 35g | 70g | Honey | 55g | 110g |
| G2 | Sugarcane | 45g | 90g | Cane Sugar | 70g | 140g |
| G3 | Sugar Beet (crop) | 120g | 240g | Beet Sugar | 180g | 360g |
| G4 | Maple Sap | 70g | 140g | Maple Syrup | 105g | 210g |
| G5 | Cacao Pod | 95g | 190g | Chocolate | 145g | 290g |
| G6 | Vanilla Pod | 120g | 240g | Vanilla Extract | 180g | 360g |
| G7 | Agave Heart | 155g | 310g | Agave Syrup | 235g | 470g |
| G8 | Palm Sap | 200g | 400g | Palm Sugar | 300g | 600g |
| G9 | Fairy Honeycomb | 255g | 510g | Fairy Honey | 385g | 770g |
| G10 | Ambrosia Blossom | 330g | 660g | Ambrosia | 495g | 990g |

### Fruits

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Apple | 35g | 70g | Apple Preserve | 55g | 110g |
| G2 | Pear | 45g | 90g | Pear Preserve | 70g | 140g |
| G3 | Peach | 55g | 110g | Peach Preserve | 85g | 170g |
| G4 | Plum | 70g | 140g | Plum Preserve | 105g | 210g |
| G5 | Orange | 95g | 190g | Orange Marmalade | 145g | 290g |
| G6 | Grape | 120g | 240g | Grape Jelly | 180g | 360g |
| G7 | Mango | 155g | 310g | Mango Pulp | 235g | 470g |
| G8 | Pomegranate | 200g | 400g | Pomegranate Molasses | 300g | 600g |
| G9 | Starpeach | 255g | 510g | Starpeach Nectar | 385g | 770g |
| G10 | Golden Apple | 330g | 660g | Golden Apple Preserve | 495g | 990g |

### Mushrooms

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Button Mushroom | 30g | 60g | Dried Button Mushroom | 45g | 90g |
| G2 | Shiitake | 40g | 80g | Dried Shiitake | 60g | 120g |
| G3 | Oyster Mushroom | 50g | 100g | Dried Oyster Mushroom | 75g | 150g |
| G4 | Enoki | 65g | 130g | Dried Enoki | 100g | 200g |
| G5 | Chanterelle | 85g | 170g | Dried Chanterelle | 130g | 260g |
| G6 | Porcini | 110g | 220g | Dried Porcini | 165g | 330g |
| G7 | Morel | 140g | 280g | Dried Morel | 210g | 420g |
| G8 | Truffle | 180g | 360g | Shaved Truffle | 270g | 540g |
| G9 | Glowcap | 230g | 460g | Glowcap Powder | 345g | 690g |
| G10 | King Reishi | 300g | 600g | Reishi Powder | 450g | 900g |

### Woods

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Pine Log | 25g | 50g | Pine Plank | 40g | 80g |
| G2 | Birch Log | 30g | 60g | Birch Plank | 45g | 90g |
| G3 | Cedar Log | 40g | 80g | Cedar Plank | 60g | 120g |
| G4 | Maple Log | 50g | 100g | Maple Plank | 75g | 150g |
| G5 | Oak Log | 70g | 140g | Oak Plank | 105g | 210g |
| G6 | Cherry Log | 90g | 180g | Cherry Plank | 135g | 270g |
| G7 | Mahogany Log | 110g | 220g | Mahogany Plank | 165g | 330g |
| G8 | Ebony Log | 145g | 290g | Ebony Plank | 220g | 440g |
| G9 | Elderwood Log | 185g | 370g | Elderwood Plank | 280g | 560g |
| G10 | Yggdrasil Branch | 240g | 480g | Yggdrasil Plank | 360g | 720g |

### Ores

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Copper Ore | 30g | 60g | Copper Ingot | 45g | 90g |
| G2 | Tin Ore | 40g | 80g | Tin Ingot | 60g | 120g |
| G3 | Iron Ore | 50g | 100g | Iron Ingot | 75g | 150g |
| G4 | Silver Ore | 65g | 130g | Silver Ingot | 100g | 200g |
| G5 | Cobalt Ore | 85g | 170g | Cobalt Ingot | 130g | 260g |
| G6 | Gold Ore | 110g | 220g | Gold Ingot | 165g | 330g |
| G7 | Platinum Ore | 140g | 280g | Platinum Ingot | 210g | 420g |
| G8 | Titanium Ore | 180g | 360g | Titanium Ingot | 270g | 540g |
| G9 | Mythril Ore | 230g | 460g | Mythril Ingot | 345g | 690g |
| G10 | Orichalcum Ore | 300g | 600g | Orichalcum Ingot | 450g | 900g |

### Stones

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Limestone | 25g | 50g | Limestone Block | 40g | 80g |
| G2 | Sandstone | 30g | 60g | Sandstone Block | 45g | 90g |
| G3 | Slate | 40g | 80g | Slate Block | 60g | 120g |
| G4 | Granite | 50g | 100g | Granite Block | 75g | 150g |
| G5 | Basalt | 70g | 140g | Basalt Block | 105g | 210g |
| G6 | Marble | 90g | 180g | Marble Block | 135g | 270g |
| G7 | Obsidian | 110g | 220g | Obsidian Block | 165g | 330g |
| G8 | Jade | 145g | 290g | Jade Block | 220g | 440g |
| G9 | Runestone | 185g | 370g | Runestone Block | 280g | 560g |
| G10 | Meteorite | 240g | 480g | Meteorite Block | 360g | 720g |

### Crystals

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Quartz | 50g | 100g | Cut Quartz | 75g | 150g |
| G2 | Amethyst | 65g | 130g | Cut Amethyst | 100g | 200g |
| G3 | Citrine | 80g | 160g | Cut Citrine | 120g | 240g |
| G4 | Garnet | 105g | 210g | Cut Garnet | 160g | 320g |
| G5 | Emerald | 135g | 270g | Cut Emerald | 205g | 410g |
| G6 | Sapphire | 175g | 350g | Cut Sapphire | 265g | 530g |
| G7 | Ruby | 225g | 450g | Cut Ruby | 340g | 680g |
| G8 | Diamond | 290g | 580g | Cut Diamond | 435g | 870g |
| G9 | Starstone | 370g | 740g | Cut Starstone | 555g | 1,110g |
| G10 | Philosopher's Stone | 480g | 960g | Cut Philosopher's Stone | 720g | 1,440g |

### Fish

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Carp | 40g | 80g | Carp Fillet | 60g | 120g |
| G2 | Trout | 50g | 100g | Trout Fillet | 75g | 150g |
| G3 | Sardine | 65g | 130g | Sardine Fillet | 100g | 200g |
| G4 | Mackerel | 85g | 170g | Mackerel Fillet | 130g | 260g |
| G5 | Salmon | 110g | 220g | Salmon Fillet | 165g | 330g |
| G6 | Sea Bream | 145g | 290g | Sea Bream Fillet | 220g | 440g |
| G7 | Eel | 180g | 360g | Eel Fillet | 270g | 540g |
| G8 | Tuna | 235g | 470g | Tuna Fillet | 355g | 710g |
| G9 | Silverfin | 300g | 600g | Silverfin Fillet | 450g | 900g |
| G10 | Rainbow Koi | 390g | 780g | Rainbow Koi Fillet | 585g | 1,170g |

### Hides and scales

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Puffbun Pelt | 45g | 90g |
| G2 | Boarling Hide | 60g | 120g |
| G3 | Wolfkin Pelt | 75g | 150g |
| G4 | Rock Lizard Scale | 100g | 200g |
| G5 | Ironback Hide | 130g | 260g |
| G6 | Basilisk Scale | 165g | 330g |
| G7 | Manticore Hide | 210g | 420g |
| G8 | Behemoth Hide | 270g | 540g |
| G9 | Wyvern Scale | 345g | 690g |
| G10 | Dragon Scale | 450g | 900g |

### Bones and horns

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Seashell | 50g | 100g |
| G2 | Ammonite | 65g | 130g |
| G3 | Trilobite | 80g | 160g |
| G4 | Fossil Bone | 105g | 210g |
| G5 | Mammoth Tusk | 135g | 270g |
| G6 | Saber Fang | 175g | 350g |
| G7 | Raptor Claw | 225g | 450g |
| G8 | Tyrant Tooth | 290g | 580g |
| G9 | Titan Bone | 370g | 740g |
| G10 | Unicorn Horn | 480g | 960g |

### Essences

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Mist Essence | 55g | 110g |
| G2 | Dew Essence | 70g | 140g |
| G3 | Breeze Essence | 90g | 180g |
| G4 | Ember Essence | 115g | 230g |
| G5 | Tide Essence | 155g | 310g |
| G6 | Spark Essence | 200g | 400g |
| G7 | Glimmer Essence | 250g | 500g |
| G8 | Shadow Essence | 325g | 650g |
| G9 | Aether | 415g | 830g |
| G10 | Prismatic Essence | 540g | 1,080g |
<!-- /live -->

## Stars (CS26)

Each good adds up **quality points Q** from its sources, then draws its stars: `stars = 1 + ⌊Q + u⌋`, clamped to 1–5,
with `u` a seeded draw in [0, 1) (`draw(uid, day, what, n)`, CS8). The expected stars are 1 + Q, and Q of 4 or more is
always ★5.

| Source | Gathering | Farming (tended) | Ranch | Kitchen and Forge | Stations |
|---|---|---|---|---|---|
| Her rank (F21, `rankQuality`) | 0.5 × rank (0 → 2.5) | the tender's | — | the assistant's | — |
| Her talent (F21, `talentQuality`) | G −0.75 … S +1 | the tender's | — | the assistant's | — |
| Care | — | +0.25 tended (`TENDED_QUALITY`) | hearts ÷ 2.5 (`heartsQuality`) | — | — |
| Crop level | — | +0.1 × (level − 1) (`cropLevelQuality`) | — | — | — |
| Inputs | — | — | — | mean input ★ − 1 (`inputsQuality`) | the input's stars carry |
| Tool | +0.25 a tier (`toolQuality`) | Hoe +0.25 a tier | Brush +0.25 a tier | — | — |
| Boost | well fed +0.25 (`WELL_FED_QUALITY`) | well fed +0.25 | — | — | — |
| Keepsake (save v4, F51) | +0.25 at her line from Friendship 10, +0.5 from Spouse 5 | the tender's, at her line | — | — | — |

- `quality(sources)` adds a good's sources, each already in points (`{ rank, talent, care, cropLevel, inputs, tool,
  boost, keepsake }`), to a millionth; `drawStars(q, u)` draws; `starShares(q)` gives the odds of each star. F21 gives the rank
  and talent terms (`rankQuality` from CS31's table, `talentQuality` from CS28's, [ranks.md](ranks.md)); F20 adds them up for crops (`harvestQuality`, [fields.md](fields.md#tending-cs12-cs28-cs31-decisions-1-and-2))
  and F22 for its goods (`gatherQuality`, [gathering.md](gathering.md#stars-cs26)); a station's output keeps its input's stars.
- A tool's tier runs 1 (Basic) to 5 (Mythril), so Basic adds nothing and a Copper Pick +0.25.
- **Her keepsake** (romance build; live from F56; F51 decision 8, RM31, RM33): from Friendship 10 an Uma's keepsake adds
  **+0.25** to the goods of her work at her line's place (+0.5 from Spouse 5): a haul as its job is planned
  (`planHaul` with the pack, `keepsakeQuality`), a tended block's harvest. Nowhere else, never on v3; a station's output
  still keeps its input's stars. Her keepsake's name and her line about it are her bible's, on her profile
  ([hearts.md](hearts.md#perks-rm31rm36)).

| Worked (CS26) | Q | Stars |
|---|---|---|
| A Novice C forager | 0 + 0.25 = **0.25** | ★1 75%, ★2 25% |
| An untended block, crop level 1 | **0** | ★1 |
| A Skilled B miner, Copper Pick | 1 + 0.5 + 0.25 = **1.75** | ★2 25%, ★3 75% |
| An Expert A tender, Iron Hoe, level-4 crop, well fed | 1.5 + 0.75 + 0.25 + 0.5 + 0.3 + 0.25 = **3.55** | ★4 45%, ★5 55% |
| A 10-heart cow | **4** | ★5 |

Each row is a test, over 20,000 seeded draws as well as by its exact odds.

## The shipping bin (CS10, CS7 step 1, decisions 4–6)

The bin is the floor price: it takes anything with a price, at any time in the day, and pays at night. There's no
selling cap, and nothing is ever bought back. Requests (×1.5), the Restaurant and prizes pay more, in later packets.

| Rule | What it does |
|---|---|
| `ship(save, id, stars, count)` | From the Warehouse into today's bin. Refused for a seed (`no-price`) and when the Warehouse is short (`no-items`) |
| `shipAll(save, id)` | Every star of a good ("Ship all") |
| `takeBack(save, id, stars, count)` | From the bin back to the Warehouse, until the night (`no-items` past what the bin holds) |
| `binSales(bin, day)`, `binTotal(bin, day)` | The bin's lines in the catalogue's order, ★1 first, each with its gold and demand; the night's estimate |
| `payBin(save, day)` | Night step 1: everything pays at price × stars × demand on the day it was shipped |

**What the night writes (decision 6):** `gold` rises by the bin's total; `farm.counts['gold-shipped']` by the same (the
Farm Rank's points and its milestones, F24); `diary.shipped[id]` by each good's count (the Diary's collections, F24);
the bin empties. `payTheBin` runs it before the date turns, so a season's last night pays at that season's demand.
Nothing here moves `account.updatedAt`: shipping and taking back are the player's changes, stamped by the app, and the
night stamps once.

**The morning's bin section** (`summary.bin`, CS5 §1): one line a good and star, `{ kind: 'sold', id, stars, count,
gold, demand }`, in the catalogue's order. The card says "Salmon ★2 × 3 · 495g" with "In demand" marked, then "Total ·
545g"; each line opens the bin. The parse refuses an unknown good or a seed, stars outside 1–5, a count of 0, fractional
gold, a line twice and words in a line. A line's gold is the night's and is never priced again, so a later price change
can't break an old morning.

## Gold and the account bar (decision 10)

Gold is whole and never negative (`spendGold`, `earnGold`, F17). The account bar shows it beside the date: uma-art's
`currency/gold` coin (F25's part A, pinned from F49; a plain "g" coin without it) and the number. Its name for VoiceOver is "Gold:
1,240g. The bin", and it opens the bin's sheet.

## The screens

- **The bin's sheet** (`?sheet=bin`, from the shipping bin on the map, the gold chip or a morning line): "About 1,240g
  tonight", today's lines (icon, "Carrot ★2 × 3", the line's gold, "In demand"), each with **Take back** (the whole
  line), and **Ship**, which opens the Warehouse to pick from. Empty, it says "Empty" and "Tap Ship to put goods in."
  The rules sit behind its help button.
- **The Warehouse by stars** (`/warehouse`, from the Warehouse on the map): families in a row of tabs that scrolls
  sideways, each with its count: **Crops** (the 27 crops and the flours, CS19's Farming), **Woods, Mushrooms, Herbs and
  spices, Fruits, Nuts and seeds, Sweets** (the forest's six, less the crops), **Fish**, **Mining** (ores, stones and
  crystals), **Seeds**, and **Loot** only while the Warehouse holds an expedition's. Each good shows its icon, name,
  "In demand", its total, and its five stars: the count at each and its price today. A tap opens its sheet: family,
  grade and form ("Fish · G5 · raw"), what it refines into or from, its stars (a tap on one ships one), and **Ship all ·
  665g**. Seeds show their count and "Seeds: they don't sell".
- **Pick mode** (`/warehouse?pick=bin`, from the bin's Ship): "Ship to the bin"; each star is a button that ships one,
  each good has **Ship all**, and a bar says "In the bin: about 1,240g tonight" with **Done**, back to the bin. It opens
  on the first tab holding something that sells.
- **The shop's sheet** (`?sheet=shop`, from the shop on the map): uma-kit's `ExchangeRows`, each line its icon, name,
  price and gate ("From Farm Rank 2"), and a buy sheet with ×1, ×5, ×10, ×25 or a typed count and **Buy 9 · 180g**,
  off with "Need 30g more" when gold is short. F20 fills it with the season's six seeds by tier
  ([fields.md](fields.md#the-shops-seeds-cs4-decision-8)); with no lines it would say "Nothing for sale yet."
  `buy(save, line, count)` spends through `spendGold` and puts the goods in the Warehouse at ★1; it refuses a shut line
  (`locked`), a count outside 1–99 and short gold. Land, beds and stations are bought at their own places (F20's blocks
  on the Fields' page).
- **The farm map and the Menu** open the bin, the shop and the Warehouse straight to their screens (`PLACE_SCREENS`);
  every other place keeps its quick look until its packet lands.

The Warehouse draws its own rows on the kit's `Chip`, `Sheet` and `Button`: the kit's `ShelfView` holds one count and
one price per item, and a good has five. The bin, the shop and the Warehouse load on demand.
