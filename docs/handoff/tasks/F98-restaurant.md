# F98 — The Restaurant

**uma-farm · Design packet · Phase 2.5 · 2026-11-18**

> Work a short Restaurant shift to open a new page in the recipe book. Learn the recipes on that page by producing
> their ingredients at the farm. Cook them at the Kitchen and choose what to sell, put into another recipe, or save
> for the farm's meals.

## Scope

This packet authors the Restaurant and its menu. **120 new recipes across eight stages** ship with the future
Restaurant implementation, alongside the Kitchen's existing 80. The [roster-run farm](../../game-mechanics.md#the-catalogue)
provides the exact grades and discovery ledger this menu uses. The Forge follows separately.

## Read first

- [The crops and their levels](../../game-mechanics.md#the-crops), [the ranch](../../game-mechanics.md#the-ranch),
  [the Fishery's spots](../../game-mechanics.md#the-fisherys-spots), [stations](../../game-mechanics.md#the-stations),
  [stars and prices](../../game-mechanics.md#stars-and-prices), [food](../../game-mechanics.md#food) and
  [the Kitchen](../../game-mechanics.md#the-kitchen).
- The Restaurant is already a planned Farm Rank 7 building for **40,000g · 80 planks · 40 fillets · 30 vegetables**.
  Its Serving ranks, Diary challenges, and romance perks already have entries. Reuse those and the building art.
  Read `farm/places.ts`, `farm/rank-rules.ts`, `romance/perks.ts` and `romance/plays/which.ts`.
- The Kitchen lets you cook up to three recipes in one stove play. Its 80 recipes use a main of a specified family and
  grade and a side from an allowed family. Finished dishes currently go to staff meals, gifts, wedding receptions and
  expedition supplies. Read `kitchen/recipes.ts`, `kitchen/kitchen.ts`, `farm/food.ts` and `expeditions/stock.ts`.
- Grade (G1–G10) identifies an ingredient in its family. Stars (★1–5) measure the quality of a particular lot. Today
  G1 Carrot and G9 Golden Carrot are different goods. Growing a better G1 Carrot raises its stars, and own seeds
  double the crop experience gained on harvest. Neither changes the item's grade. Keep the distinction visible.

## Research and fit

| Reference | What it does | What to use here |
|---|---|---|
| Rune Factory 5 | Crops have suitable seasons. The official field guide describes taking higher-level seed from a ripe crop with the sickle. Soil condition affects that progression. Its life overview also ties larger recipe selections to discovery and higher-tier crafting to skills. | Give players a deliberate way to improve a crop over successive plantings if the farm expands. Use the farm's existing till, water, harvest and own-seed loop. The Restaurant uses deterministic recipe pages and ingredient discovery. [Field guide](https://runefactory.marv.jp/series/rf5/guide/field/) · [Life overview](https://runefactory.marv.jp/series/rf5/system/life/) |
| Harvest Moon: The Lost Valley | Its developer diary ties product quality and quantity to animal affection and describes breeding for stronger production traits. Crop expansions include discoverable mutations. | Build on the Coop and Barn's existing feed, care and fondness. Give a later production tier to the animal and its handler before adding breeding. Make any future crop variants discoverable and show their requirements. [Animal developer diary](https://www.natsume.com/news/news_pdffiles/pid_156_HM%20TLV%20Dev_Diary%20Animals.pdf) · [Crop and recipe announcement](https://www.natsume.com/news/news_pdffiles/pid_176_HMTLV_DLC2.pdf) |
| Story of Seasons: A Wonderful Life | This remake of Harvest Moon: A Wonderful Life includes hybrid crops, upgradeable facilities, and animal goods that can become recipes, gifts or sales. | Make harvest choices matter across several uses. Reserve hybrid crops for a later expansion where they can add variety without becoming prerequisites for the core Restaurant. [Marvelous game overview](https://marvelousgames.com/games/story-of-seasons-a-wonderful-life/) |
| Story of Seasons: Pioneers of Olive Town | Shipping a wild plant can open its seeds at the shop. Animal goods can be sold, cooked or processed. | Let discovery reveal a dependable source of a new plant. Keep a distinction between discovering an ingredient and using up the inventory to make a dish. Reuse stations for the added food-processing work. [Build Your Farm](https://www.storyofseasons.com/PoOT/buildyourfarm/) |
| Story of Seasons: Grand Bazaar | Players stock goods ahead of a shift, fill customer orders and earn later progression from sales. Its cooking manual distinguishes learning a recipe, possessing ingredients and improving the resulting quality. Windmills make different products in batches. | Use a small, player-chosen plated menu and short ticket service that fits a ten-action day. Earn recipe pages from shifts, use a separate discovery check for each recipe, and keep batch processing at the existing stations. [Bazaar manual](https://www.storyofseasons.com/grandbazaar/manuals/xbox/03/) · [Farm and cooking manual](https://www.storyofseasons.com/grandbazaar/manuals/xbox/01/) |

## The shift and recipe stages

1. **Open the Restaurant.** The existing build stands the following morning. A shift also needs the Kitchen and its
   finished dishes. Through the Restaurant side panel, choose a stage and stock up to 12 portions from up to three
   distinct recipes. A portion is one stored dish at its stars. Show the stocked counts, the shift's clear target,
   and the next page before charging an action.
2. **Play one shift a day for one action.** Give each stage a short seeded ticket queue. Tap a ticket, then the
   matching plated dish from the stocked menu. Correct orders consume one portion and earn its sale. A wrong dish
   leaves the portion in the tray and costs time. Missed tickets expire and earn nothing. Generate orders from the
   stocked menu with no demand for more units than the player brought. Timings below are for the first balance pass.
3. **Clear a stage once to open its page.** The first stage accepts old Kitchen dishes. Later shifts ask for
   variety. From stage 3, at least one successful order must use any previously learned Restaurant recipe. Never ask
   for a particular named seasonal dish to clear a stage. Let the player replay any unlocked stage for practice and
   sales. Clears and learned pages persist across years. Nothing resets when a season or year changes.
4. **Learn each recipe independently.** A clear opens 15 entries. Any entry with all ingredients discovered becomes
   known immediately. Otherwise it shows what remains. Discovering the final missing ingredient later learns the
   recipe automatically. Mastering one recipe never blocks its neighbors. The next shift requires the previous
   stage clear and the menu rules above.
5. **Optional server.** One eligible farmhand can assist, spending one of her work actions that night. Respect farm
   days, expeditions and existing Kitchen or Contest commitments in both directions. Serving talent and perks soften
   timing and improve tips, not ingredient prerequisites. Pay the existing Serving Diary challenges from actual
   successful covers, and test the romance Serving perk and story-play fallback.

| Stage | Page opened | Menu minimum | Clear target | Trial time |
|---|---|---|---:|---:|
| 1 | Farm Counter (R001–R015) | 1 dish type | 4 of 6 | 45 s |
| 2 | The Pantry (R016–R030) | 2 dish types | 5 of 7 | 45 s |
| 3 | From the Water (R031–R045) | 2 dish types, including a learned Restaurant dish | 6 of 8 | 50 s |
| 4 | Orchard Table (R046–R060) | 2 dish types, including a learned Restaurant dish | 7 of 9 | 50 s |
| 5 | Barn and Mill (R061–R075) | 3 dish types, including a learned Restaurant dish | 7 of 10 | 55 s |
| 6 | Woodland Supper (R076–R090) | 3 dish types, including a learned Restaurant dish | 8 of 10 | 55 s |
| 7 | Coastal Table (R091–R105) | 3 dish types, including a learned Restaurant dish | 9 of 11 | 60 s |
| 8 | House Menu (R106–R120) | 3 dish types, including a learned Restaurant dish | 10 of 12 | 60 s |

Opening a shift requires at least as many stocked portions as its ticket count. Schedule at least one valid order
for a stocked Restaurant dish when the clear requires it. Grade shifts by covers served divided by available covers
using the existing play-grade ladder. A failed shift can still pay for covers served. Settle an interrupted shift once
using its persisted progress and return every unserved portion. The same dish cannot be promised to a shift and a meal,
gift, reception or expedition.

Landscape sheet at 844×390 and 667×375. Use **Shift** and **Recipes** tabs. During a shift, use one visible ticket queue
and three large dish targets with names, icons and remaining portions. The result shows covers, sales, stage clear
and new recipes. A locked recipe shows the missing good, grade and an attainable source, for example **Apple G1 ·
Woods in Summer**. Offer filters for **Ready**, **Need ingredients**, and **By stage**, and a link to the Kitchen.
Keep the screens and data out of the initial bundle.

## Ingredient discovery and cooking

- A material is discovered for its **specific item and grade** when the player or a farmhand actually harvests it,
  collects it from an animal, forages it, catches it, or finishes processing or cooking it. A purchase, gift, bin
  shipment, recipe hint, or seed in the Warehouse alone grants no discovery. Record completed output, including
  farmhand shifts and stations overnight, with the same rule as daytime actions. Stars do not gate these 120 recipes.
- Discovery is a permanent record. A recipe also needs its live stock when you cook it, in the stated quantities.
  Once an ingredient is discovered, matching stock may come from any source. The variant and grade must match the
  row. Higher stars at that grade qualify. A different species, raw substitute for a processed good, or higher
  grade does not substitute unless the recipe explicitly allows it. This menu uses no grade substitutions.
- Check the full ingredient chain. A Wheat Flour gate requires growing G1 Wheat and finishing a G1 Wheat Flour
  load. A recipe that uses Plain Pastry Shell requires cooking that dish once and knowing how to produce its leaf
  ingredients. Count discovery separately from the units being spent. Prior-stage components have acyclic
  dependencies and may use different stars at the same grade. For launch, track discovery at the item/grade level,
  without provenance on individual units of stock.
- Add the 120 recipes to the existing Kitchen menu when learned. Preserve recipe IDs, known recipes, stock, and the
  contest and story uses for the legacy 80. The stage number sets the new dish's grade. Start with the current
  quantity-weighted ingredient-star average rounded down, plus stove performance lift, capped at ★5. Use the
  Kitchen's existing action, throughput, assistant rules and at-most-three-recipes limit for both menus.
- Keep the recipe book, discovery list, shift state and learned pages as additive client save fields. Walk the
  actual saved fields for evidence when loading an existing v5 farm. Credit only existing per-item records that prove
  production, for example a harvested crop counter or the caught-size record for a fish. Aggregate quantities,
  shopping, and generic stock do not prove how a good was obtained. A missing record can always be added once by
  doing the farm activity. Preserve any save with a legacy stove play in progress.

### What to do with a cooked dish

| Choice | Rule |
|---|---|
| Sell | Bin all 120 new dishes using the existing overnight shipping, Farm Rank credit and quantity easing. A dish sold on a Restaurant ticket pays the same base price and a capped service tip. Legacy dishes can be sold on tickets to start the loop. Count each unit once, through the bin or through a ticket. |
| Cook with it | Put a finished component dish into a later recipe exactly as specified. Reserve stock at start and consume it once. Finished components may also be sold or saved for meals. |
| Feed the farm | From the Kitchen or Book, **Save for meals** turns one chosen finished dish into six pantry portions at its stars, using normal pantry expiry and well-fed rules. **Serve staff meal** keeps its current one-dish-per-three-mouths option. Ordinary nightly consumption uses the pantry, including its converted portions. The player chooses which dishes go into the pantry. |

For initial prices, value exact quantities at the ingredients' ★1 base prices. Put a modest cooking premium on top
and cap the chain premium against the raw ingredients' opportunity cost, so cooking a cooked component twice adds
value without compounding margins indefinitely. Start the pass at a +15% ingredient premium with a +35% cap against leaf
inputs, including station processing costs. Set explicit prices after testing large Kitchen batches, stars, market
easing, household takeout savings and up to one Restaurant shift per day. Include the value of a farmhand's missed
work and her Serving-tip perks. Check that raw shipping, cooking and using meals each have a defensible purpose.

## Farm prerequisite

The [farm's catalogue](../../game-mechanics.md#the-catalogue) records grades earned by the player or roster.
The source audit covers all 120 rows, exact stock grades, and every component's earlier recipe. It checks a fresh
Stage 1 entry in every season. The four upgraded entries use Carrot G2 in R026, Carp Fillet G2 in R044,
Apple Preserve G2 in R051 and Milk G3 in R063. R051 requires separate Apple G2 proof. Keep the base-grade
routes for Stage 1 and point the source audit at the runtime menu when this packet is retired.

## Implement and verify

1. Inventory exact outputs from crop, forage, fishing, ranch, station and Kitchen paths. Use one domain lookup for
   discovery and inventory checks, a save parser for all new state, and a validator for authored recipe entries.
   Prove every leaf has a real source at its grade and that station intermediates belong to those chains.
2. Implement a reusable, deterministic serving engine and the Restaurant sheet. Persist the reservation, result and
   stage progress together. Add results and discovery cues to the Kitchen, Book and morning summary. Hook Serving
   ranks, existing work perks and expedition availability into the same rule set.
3. Add the 120 entries below as game data. Provide a cookable preview from real stock and show high-priority missing
   ingredients. Make old and new recipes coexist in the Kitchen, account for legacy in-progress stove plays, and
   link the new eligible stocks to the bin and pantry.
4. Verify discovery by the player and by farmhands, wrong species and grade, bounds on stars and stock quantities,
   raw and processed prerequisites, repeat-free unlocks, and cycles. Test a late-year farm, a v5 save without
   discovery info, scarcity in winter, and a full Stage 1 → Stage 8 route. Use the farm-at-scale simulator at 10, 20
   and 50 farmhands. Report nights since the build, shipped and served income, meals, misses, and how often a
   required ingredient or shift stalls. Exercise recipe components through resale, cooking and meal consumption.
5. Run project checks and a local send-through of the Restaurant shift and its recipes at both landscape sizes.
   Validate that consuming, cooking, donating, selling and packing the same stock cannot double spend it, that
   an interrupted shift resumes or settles once, and that no server creates save state. Use tests with invented
   fixtures. Update game mechanics and generated pages when the rules land. Remove F98 from the handoff after it ships
   and leave the Forge in Phase 2.5.

## Authored launch menu

Each entry makes one dish before the Kitchen's existing batch output rules. Every ingredient is an exact stock ID
or a previously learned Restaurant component with its grade. IDs in the `R001`–`R120` series are authoring keys.
Freeze a namespaced runtime ID for each when the catalogue is implemented. Output grade is the page number.
Same-grade stocks at any stars count. The tables below contain **120 distinct new recipes**, with 15 per stage.

### 1. Farm Counter

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R001 | Mint Carrot Ribbons | 2 × `carrot` G1 + 1 × `mint` G2 |
| R002 | Warm Basil Carrots | 2 × `carrot` G1 + 1 × `basil` G1 |
| R003 | Crisp Potato Coins | 2 × `potato` G2 + 1 × `rosemary` G3 |
| R004 | Warm Cabbage Ribbons | 2 × `cabbage` G3 + 1 × `mint` G2 |
| R005 | Slow Onion Cups | 2 × `onion` G4 + 1 × `thyme` G4 |
| R006 | Carrot and Egg Skillet | 1 × `carrot` G1 + 1 × `egg` G1 |
| R007 | Potato Egg Cake | 1 × `potato` G2 + 1 × `egg` G1 |
| R008 | Basil Carp Parcels | 1 × `carp` G1 + 1 × `basil` G1 |
| R009 | Mint Trout Bites | 1 × `trout` G2 + 1 × `mint` G2 |
| R010 | Button and Onion Broth | 1 × `button-mushroom` G1 + 1 × `onion` G4 |
| R011 | Toasted Shiitake | 2 × `shiitake` G2 + 1 × `basil` G1 |
| R012 | Carrot Milk Soup | 1 × `carrot` G1 + 1 × `milk` G2 |
| R013 | Oat Breakfast Bowl | 1 × `oats` G2 + 1 × `milk` G2 |
| R014 | Honey Custard Cup | 1 × `honeycomb` G1 + 1 × `egg` G1 + 1 × `milk` G2 |
| R015 | Herb Stock | 1 × `button-mushroom` G1 + 1 × `carrot` G1 + 1 × `basil` G1 |

### 2. The Pantry

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R016 | Pear and Oat Cups | 1 × `pear` G2 + 1 × `rolled-oats` G2 |
| R017 | Honey Apple Spoon | 1 × `apple` G1 + 1 × `honey` G1 |
| R018 | Rye Onion Crisp | 1 × `rye-flour` G6 + 1 × `onion` G4 |
| R019 | Wheat and Herb Flatbread | 1 × `wheat-flour` G1 + 1 × `dried-basil` G1 |
| R020 | Buckwheat Breakfast Cake | 1 × `buckwheat-flour` G7 + 1 × `egg` G1 + 1 × `milk` G2 |
| R021 | Apple Hand Pie | 1 × `apple` G1 + 1 × `wheat-flour` G1 + 1 × `egg` G1 |
| R022 | Pear Milk Pudding | 1 × `pear` G2 + 1 × `milk` G2 + 1 × `egg` G1 |
| R023 | Barley Mushroom Pilaf | 1 × `pearl-barley` G3 + 1 × `shiitake` G2 |
| R024 | Cornmeal Griddle Cakes | 1 × `cornmeal` G5 + 1 × `milk` G2 |
| R025 | Peanut Oat Crumble | 1 × `peanut-butter` G1 + 1 × `rolled-oats` G2 |
| R026 | Sunflower Carrot Roast | 1 × `sunflower-oil` G2 + 1 × `carrot-grade-2` G2 + 1 × `R015` G1 |
| R027 | Herb Cream | 1 × `milk` G2 + 1 × `dried-rosemary` G3 |
| R028 | Tomato Pan Sauce | 2 × `tomato` G5 + 1 × `dried-basil` G1 |
| R029 | Ginger Beet Glaze | 1 × `beet-sugar` G3 + 1 × `ground-ginger` G5 |
| R030 | Plain Pastry Shell | 1 × `wheat-flour` G1 + 1 × `egg` G1 |

### 3. From the Water

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R031 | Carp and Herb Rice | 1 × `carp` G1 + 1 × `polished-rice` G4 + 1 × `R015` G1 |
| R032 | Pepper Trout Toast | 1 × `trout-fillet` G2 + 1 × `bell-pepper` G6 + 1 × `R019` G2 |
| R033 | Sardine Potato Plate | 1 × `sardine` G3 + 1 × `potato` G2 + 1 × `rosemary` G3 |
| R034 | Tomato Sardine Toast | 1 × `sardine-fillet` G3 + 1 × `R028` G2 + 1 × `R019` G2 |
| R035 | Mackerel with Thyme | 1 × `mackerel` G4 + 1 × `thyme` G4 |
| R036 | Mackerel Cream Bake | 1 × `mackerel-fillet` G4 + 1 × `R027` G2 + 1 × `potato` G2 |
| R037 | Salmon Rice Cakes | 1 × `salmon` G5 + 1 × `polished-rice` G4 + 1 × `egg` G1 |
| R038 | Ginger Eel Bowl | 1 × `eel` G7 + 1 × `ground-ginger` G5 + 1 × `polished-rice` G4 |
| R039 | Carp Cabbage Rolls | 1 × `carp` G1 + 1 × `cabbage` G3 + 1 × `R015` G1 |
| R040 | Trout and Mint Potatoes | 1 × `trout` G2 + 1 × `potato` G2 + 1 × `mint` G2 |
| R041 | Shiitake Salmon Soup | 1 × `salmon` G5 + 1 × `shiitake` G2 + 1 × `R015` G1 |
| R042 | Oat Crusted Sardines | 1 × `sardine` G3 + 1 × `rolled-oats` G2 + 1 × `egg` G1 |
| R043 | Smoked Trout Pastry | 1 × `trout-fillet` G2 + 1 × `R030` G2 + 1 × `onion` G4 |
| R044 | Rosemary Fillet Supper | 1 × `carp-fillet-grade-2` G2 + 1 × `dried-rosemary` G3 + 1 × `potato` G2 |
| R045 | Harbour Fish Stock | 1 × `carp-fillet` G1 + 1 × `onion` G4 + 1 × `thyme` G4 |

### 4. Orchard Table

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R046 | Apple Basket Tart | 1 × `apple` G1 + 1 × `R030` G2 |
| R047 | Honey Pear Galette | 1 × `pear` G2 + 1 × `honey` G1 + 1 × `R030` G2 |
| R048 | Peach Custard Tart | 1 × `peach` G3 + 1 × `milk` G2 + 1 × `R030` G2 |
| R049 | Plum Oat Squares | 1 × `plum` G4 + 1 × `rolled-oats` G2 + 1 × `egg` G1 |
| R050 | Orange Peel Cakes | 1 × `orange` G5 + 1 × `wheat-flour` G1 + 1 × `cane-sugar` G2 |
| R051 | Apple Rye Pudding | 1 × `apple-preserve-grade-2` G2 + 1 × `rye-flour` G6 + 1 × `milk` G2 |
| R052 | Peach Dressed Cabbage | 1 × `peach` G3 + 1 × `cabbage` G3 + 1 × `mint` G2 |
| R053 | Pear Onion Toast | 1 × `pear` G2 + 1 × `onion` G4 + 1 × `R019` G2 |
| R054 | Maple Plum Turnover | 1 × `plum-preserve` G4 + 1 × `maple-syrup` G4 + 1 × `R030` G2 |
| R055 | Orange Herb Trout | 1 × `orange` G5 + 1 × `trout` G2 + 1 × `mint` G2 |
| R056 | Milk Poached Pears | 1 × `pear` G2 + 1 × `R027` G2 |
| R057 | Ginger Peach Compote | 1 × `peach` G3 + 1 × `ground-ginger` G5 + 1 × `cane-sugar` G2 |
| R058 | Plum and Onion Chutney | 1 × `plum` G4 + 1 × `onion` G4 + 1 × `beet-sugar` G3 |
| R059 | Orange Syrup | 1 × `orange` G5 + 1 × `cane-sugar` G2 |
| R060 | Apple Oat Filling | 1 × `apple-preserve` G1 + 1 × `rolled-oats` G2 |

### 5. Barn and Mill

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R061 | Duck Egg Rye Toast | 1 × `duck-egg` G3 + 1 × `rye-flour` G6 + 1 × `R028` G2 |
| R062 | Goat Milk Barley Bowl | 1 × `goat-milk` G4 + 1 × `pearl-barley` G3 |
| R063 | Duck Egg Pepper Custard | 1 × `duck-egg` G3 + 1 × `bell-pepper` G6 + 1 × `milk-grade-3` G3 |
| R064 | Goat Milk Onion Gratin | 1 × `goat-milk` G4 + 1 × `onion` G4 + 1 × `potato` G2 |
| R065 | Goat Milk Herb Tart | 1 × `goat-milk` G4 + 1 × `dried-thyme` G4 + 1 × `R030` G2 |
| R066 | Duck Egg Mushroom Parcel | 1 × `duck-egg` G3 + 1 × `oyster-mushroom` G3 + 1 × `R030` G2 |
| R067 | Eggplant and Corn Bake | 1 × `eggplant` G7 + 1 × `cornmeal` G5 + 1 × `R028` G2 |
| R068 | Asparagus in Herb Cream | 1 × `asparagus` G8 + 1 × `R027` G2 |
| R069 | Roasted Tomato Oats | 1 × `tomato` G5 + 1 × `rolled-oats` G2 + 1 × `R015` G1 |
| R070 | Walnut Barley Loaf | 1 × `walnut-paste` G4 + 1 × `pearl-barley` G3 + 1 × `egg` G1 |
| R071 | Chestnut and Oat Cakes | 1 × `chestnut-paste` G5 + 1 × `rolled-oats` G2 + 1 × `cane-sugar` G2 |
| R072 | Sesame Cabbage Parcels | 1 × `sesame-paste` G3 + 1 × `cabbage` G3 + 1 × `polished-rice` G4 |
| R073 | Goat Milk Set Custard | 1 × `goat-milk` G4 + 1 × `duck-egg` G3 + 1 × `beet-sugar` G3 |
| R074 | Roasted Mushroom Filling | 1 × `oyster-mushroom` G3 + 1 × `shiitake` G2 + 1 × `onion` G4 |
| R075 | Sweet Grain Crust | 1 × `buckwheat-flour` G7 + 1 × `cornmeal` G5 + 1 × `honey` G1 |

### 6. Woodland Supper

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R076 | Enoki and Thyme Bowl | 1 × `enoki` G4 + 1 × `thyme` G4 + 1 × `R015` G1 |
| R077 | Chanterelle and Rice Pilaf | 1 × `chanterelle` G5 + 1 × `polished-rice` G4 + 1 × `R015` G1 |
| R078 | Porcini Cream Pot | 1 × `porcini` G6 + 1 × `R027` G2 |
| R079 | Morel and Onion Toast | 1 × `morel` G7 + 1 × `onion` G4 + 1 × `R019` G2 |
| R080 | Chanterelle and Goat Milk Bake | 1 × `chanterelle` G5 + 1 × `goat-milk` G4 + 1 × `potato` G2 |
| R081 | Woodland Pastry Braid | 1 × `R074` G5 + 1 × `R030` G2 + 1 × `duck-egg` G3 |
| R082 | Sesame Enoki Ribbons | 1 × `enoki` G4 + 1 × `sesame-paste` G3 + 1 × `cabbage` G3 |
| R083 | Dried Shiitake Barley Bowl | 1 × `dried-shiitake` G2 + 1 × `pearl-barley` G3 + 1 × `R015` G1 |
| R084 | Oyster Mushroom Rye Toast | 1 × `oyster-mushroom` G3 + 1 × `rye-flour` G6 + 1 × `R027` G2 |
| R085 | Asparagus Chanterelle Tart | 1 × `asparagus` G8 + 1 × `chanterelle` G5 + 1 × `R030` G2 |
| R086 | Grape and Walnut Bowl | 1 × `grape` G6 + 1 × `walnut-paste` G4 + 1 × `rolled-oats` G2 |
| R087 | Mango Oat Custard | 1 × `mango` G7 + 1 × `milk` G2 + 1 × `egg` G1 |
| R088 | Cocoa Chestnut Slice | 1 × `chocolate` G5 + 1 × `chestnut-paste` G5 + 1 × `R075` G5 |
| R089 | Cinnamon Apple Cream | 1 × `ground-cinnamon` G7 + 1 × `R060` G4 + 1 × `R027` G2 |
| R090 | Woodland Gravy | 1 × `dried-porcini` G6 + 1 × `onion` G4 + 1 × `R015` G1 |

### 7. Coastal Table

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R091 | Sea Bream with Orange | 1 × `sea-bream` G6 + 1 × `orange` G5 + 1 × `thyme` G4 |
| R092 | Sea Bream and Cornmeal | 1 × `sea-bream-fillet` G6 + 1 × `cornmeal` G5 + 1 × `R045` G3 |
| R093 | Tuna on Herb Flatbread | 1 × `tuna-fillet` G8 + 1 × `R019` G2 + 1 × `basil` G1 |
| R094 | Ginger Tuna Rice Plate | 1 × `tuna` G8 + 1 × `polished-rice` G4 + 1 × `ground-ginger` G5 |
| R095 | Bream and Tomato Parcel | 1 × `sea-bream` G6 + 1 × `R028` G2 + 1 × `R030` G2 |
| R096 | Eel with Beet Glaze | 1 × `eel` G7 + 1 × `R029` G2 + 1 × `polished-rice` G4 |
| R097 | Salmon and Plum Supper | 1 × `salmon` G5 + 1 × `R058` G4 + 1 × `R045` G3 |
| R098 | Mackerel Pepper Pilaf | 1 × `mackerel` G4 + 1 × `bell-pepper` G6 + 1 × `R045` G3 |
| R099 | Trout and Chanterelle Pie | 1 × `trout-fillet` G2 + 1 × `chanterelle` G5 + 1 × `R030` G2 |
| R100 | Tuna and Asparagus Skillet | 1 × `tuna` G8 + 1 × `asparagus` G8 + 1 × `R027` G2 |
| R101 | Tuna and Grape Toast | 1 × `tuna-fillet` G8 + 1 × `grape` G6 + 1 × `R019` G2 |
| R102 | Seared Bream with Herb Cream | 1 × `sea-bream-fillet` G6 + 1 × `R027` G2 + 1 × `mint` G2 |
| R103 | Sardine and Mushroom Tray | 1 × `sardine-fillet` G3 + 1 × `R074` G5 + 1 × `potato` G2 |
| R104 | Ginger Harbour Stew | 1 × `mackerel-fillet` G4 + 1 × `ground-ginger` G5 + 1 × `R045` G3 |
| R105 | Orange Coastal Glaze | 1 × `R059` G4 + 1 × `R045` G3 + 1 × `dried-thyme` G4 |

### 8. House Menu

| ID | Recipe | Ingredients per dish |
|---|---|---|
| R106 | House Pumpkin and Barley | 1 × `emperor-pumpkin` G10 + 1 × `pearl-barley` G3 + 1 × `R090` G6 |
| R107 | Pumpkin Woodland Pie | 1 × `emperor-pumpkin` G10 + 1 × `R074` G5 + 1 × `R030` G2 |
| R108 | Almond Peach Tart | 1 × `almond-paste` G6 + 1 × `R057` G4 + 1 × `R030` G2 |
| R109 | Vanilla Pear Custard | 1 × `vanilla-extract` G6 + 1 × `pear` G2 + 1 × `R073` G5 |
| R110 | Pomegranate Oat Crown | 1 × `pomegranate` G8 + 1 × `R075` G5 + 1 × `R073` G5 |
| R111 | Cocoa Apple Crumble | 1 × `chocolate` G5 + 1 × `R060` G4 + 1 × `R075` G5 |
| R112 | Maple Walnut and Rye | 1 × `maple-syrup` G4 + 1 × `walnut-paste` G4 + 1 × `rye-flour` G6 |
| R113 | Spiced Grape Pastry | 1 × `grape-jelly` G6 + 1 × `ground-cinnamon` G7 + 1 × `R030` G2 |
| R114 | Mango and Goat Milk Tart | 1 × `mango` G7 + 1 × `goat-milk` G4 + 1 × `R030` G2 |
| R115 | Tuna with Orange Glaze | 1 × `tuna-fillet` G8 + 1 × `R105` G7 + 1 × `asparagus` G8 |
| R116 | Porcini Fish Pie | 1 × `sea-bream-fillet` G6 + 1 × `R090` G6 + 1 × `R030` G2 |
| R117 | Saffron Harbour Rice | 1 × `saffron-threads` G8 + 1 × `R045` G3 + 1 × `polished-rice` G4 |
| R118 | Ember Pepper Broth | 1 × `bell-pepper` G6 + 1 × `peppercorn` G6 + 1 × `R090` G6 |
| R119 | Sunday Duck Egg Gratin | 1 × `duck-egg` G3 + 1 × `R074` G5 + 1 × `R027` G2 |
| R120 | Festival Fruit Board | 1 × `pomegranate` G8 + 1 × `peach` G3 + 1 × `R059` G4 |
