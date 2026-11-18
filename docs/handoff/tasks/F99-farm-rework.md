# F99 — The roster-run farm

**Design packet · Phase 2.4 · 2026-11-18**

> Start by growing and caring for things yourself. As Umas join, decide what the farm will grow, which grades to keep,
> and who covers the work. Their harvests teach the farm everything your own harvests can.

## Scope and read first

Grow the existing farm to 51 plantables, with seed and harvest grades, seasonal orchards, graded ranch goods, fish,
and processing. Give those goods dependable manual and delegated production routes. Build the production and discovery
rules before [F98](F98-restaurant.md) uses them. This packet specifies the work in releases. The Restaurant, the Forge,
crossbreeding, greenhouse, beehives, and tool-upgrade overhaul each remain separate.

Read [the field](../../game-mechanics.md#the-field), [farmhands](../../game-mechanics.md#farmhands), [the work board](../../game-mechanics.md#the-work-board),
[the night](../../game-mechanics.md#the-night-step-by-step), [the farm at scale](../../game-mechanics.md#the-farm-at-scale-10-20-and-50-umas),
and [save versions](../../technical/architecture.md#versions). Verify behavior in `packages/domain/src` before coding.
The mechanics document describes the live game. Update it and regenerate its tables and pages when rules ship.

## What to take from the reference games

| Reference and observed rule | Uma Farm decision |
|---|---|
| **Harvest Moon: Friends of Mineral Town** and its Story of Seasons remake. Seasonal seed shelves, regrowing crops, better livestock produce with care, and befriended Nature Sprites who help with field and animal work. [Planting](https://www.marv.jp/onlinemnl/bokujo/saikai/ps4/page09.html) · [Animals](https://www.marv.jp/onlinemnl/bokujo/saikai/ps4/page10.html) · [Helpers](https://www.marv.jp/onlinemnl/bokujo/saikai/ps4/page15.html) · [Remake](https://marvelousgames.com/games/story-of-seasons-friends-of-mineral-town) | Keep the 12-day seasons, familiar seed shelf, feed and fondness. A friendship recruits the Uma. Her schedule, aptitude and assignments govern the work. Repeating assignments should survive the change of season. |
| **Harvest Moon: A Wonderful Life** and its remake. Seed varieties and hybrids extend the crop game. Trees live beyond their fruiting season. Livestock care raises product quality. A stronger rod opens more fish, and location still matters. [Original release notes](https://www.natsume.com/news/news_pdffiles/pid_221_HMAWLSE0328F.pdf) · [Field and trees](https://www.marv.jp/onlinemnl/bokujo/wlife/ps5/09/) · [Ranch](https://www.marv.jp/onlinemnl/bokujo/wlife/ps5/11/) · [Fishing](https://www.marv.jp/onlinemnl/bokujo/wlife/switch/10/) | Invest in a seasonal row of fruit and improve one species across generations. Keep orchards on the current field map. Use animal fondness and worker skill for grades. A fish keeps its habitat, and skill upgrades the catch of that species. |
| **Harvest Moon: The Lost Valley.** Affection changes animal output. Traits, special feed and breeding create further specialization. [Producer's animal diary](https://www.natsume.com/news/news_pdffiles/pid_156_HM%20TLV%20Dev_Diary%20Animals.pdf) | Give every existing animal a grade route through the care it already receives. Establish that route before introducing more daily inputs or genetic traits. |
| **Rune Factory 5.** Cutting a mature crop can produce higher-level seed. Soil condition can limit that gain. Befriended monsters can sow and harvest. Recipe Bread and crafting skill determine what the player can make. [Field guide](https://runefactory.marv.jp/series/rf5/guide/field/) · [Farm helpers](https://www.marv.jp/onlinemnl/rf5/page11/) · [Craft and recipes](https://www.marv.jp/onlinemnl/rf5/page09/) · [Life overview](https://runefactory.marv.jp/series/rf5/system/life/) | Trade a harvest unit for a reliably better seed. Use existing crop knowledge and Uma aptitude as visible thresholds. Crop stars still carry the effect of care and tools. F98's shifts and production discoveries teach the recipes. |
| **Rune Factory: Guardians of Azuma.** Residents work jobs that include farming, animal collection, fishing and shopkeeping. Residents' abilities affect job eligibility and productivity, and the town carries their food costs. [Village and jobs manual](https://www.marv.jp/onlinemnl/ryu/jp/switch/02/) | Treat delegation as the mature game. The Work board should answer what the roster will produce tonight, where coverage is thin, and what's left for the player. Keep Uma meals, town days and expeditions in that forecast. |
| **Story of Seasons: Pioneers of Olive Town and Grand Bazaar.** A wild crop can open seed stock through shipping. Raw animal goods have direct and processed uses. Windmills take parallel loads and track them on a board. [Seed sourcing and animal products](https://www.storyofseasons.com/PoOT/buildyourfarm/) · [Windmills](https://www.marv.jp/onlinemnl/kaze/jp/switch/01/) | Let orchard and wild stocks converge on the same fruit. Let the roster run farms and stations as one supply chain, with visible reserve quantities and existing overnight capacity. |

These are design references. Author original items, artwork, layouts, wording and numbers for Uma Farm.

## The player hands off the work

| Farm | What the player decides | What the roster does |
|---|---|---|
| **Opening · no help required** | Plant a small patch, choose which produce to keep for seed, cook a few meals and meet Umas. | Nothing is required from the roster. A player can prove the first grade with basic tools and no farmhand. |
| **First crew · 1–5 farmhands** | Assign repeating rows, set a seed target and keep a few ingredients for cooking. Check gaps before End day. | Umas clear, till, plant, water and harvest. A practiced harvester can make an upgraded lot. A second worker can cover a town day. |
| **Working farm · 10–20 farmhands** | Pick seasonal crops, grades and quantities for meals, processing and selling. Decide which workers to send away or train. | Umas keep field, barn, fishing and station work supplied, save seeds, cook routine meals and optionally move surplus into the bin. |
| **Established farm · up to 50** | Review a short exception list and swap seasonal plans. Choose how to use the day's ten actions in the valley, at festivals and eventually at the Restaurant. | Specialists do the planned work subject to their actual shifts. Coverage, physical capacity, ingredient stock and upkeep set the limit on useful output. |

```text
Plan the season → Assign Umas once → Forecast tonight → Run the same night rules → Read exceptions
                                          │                         │
                                          └─ cover gaps by hand     └─ stock + permanent discoveries
```

### Plans on the existing Work board

- **Field.** Set a policy per plot and row and season, with a crop and exact planting grade or **Any in season**,
  a harvest setting (**Planted grade** or one declared **Next grade**), and a saved-seed target per exact seed grade.
  Blank seasonal rules leave space idle. A tree occupies its tile across seasons. Show saved seeds first within a
  selected grade. For **Any in season**, use existing ordering and only base-grade stock by default. Use the current
  clear, till, plant, water and harvest tasks, row selection and aptitude tricks. Planned planting considers remaining
  growing nights using the crop's basic watering pace. If a named seed is unavailable or cannot finish, skip it.
- **Shared coverage.** Multiple Umas can take the same rows, ranch or station. They retain their action, appetite,
  aptitude, invitation order and six task slots. Copy an existing assignment to a second worker with one board action.
  The first one who can complete a unit of work claims it through the shared farm state. An unqualified harvester
  leaves an upgrade row ripe, and a qualified worker later in the order can take it. Watering stays independent of
  harvest eligibility. Offer a manual **Harvest planted grade** action when time matters. Keep old unplanned orders
  and tasks working. Warn if a legacy order overlaps a managed scope, and have it respect that scope's output and
  stock rules unless the player changes the plan.
- **Seed saving.** Add `Save seed` as a bounded field task that trains Planting aptitude and records Farming work.
  Each target names an exact seed grade and a same-grade or upgrade source. A worker can
  turn up to four units of one exact ingredient grade into seed in one action. Stops at the shared seed target,
  threshold, or stock floor. Use the same producer for the player's Warehouse action. Set the seed order after
  harvest and before planting when the same worker covers all three. Have the board show a task waiting on the stock
  that a later worker will make. It can run the following night under the existing worker order.
- **Ranch, fishing and stations.** Add collection grade caps by animal product and normal or graded fishing by spot.
  Station plans set a short ordered list of exact output IDs and target quantities. An unset station continues loading
  the most-held eligible input. Respect input floors in both cases. When two workers share one station, capacity and
  committed outputs count toward the same targets. Support exact-grade crop, animal, fish and orchard jobs anywhere
  their matching physical action exists.
- **Reserves and sales.** Allow a shared stock floor per exact ingredient ID across its five stars. Automatic seed saving,
  Load, plain Cook, and surplus shipping only use amounts above it. Expeditions reserve provisions through their
  existing selection and explicitly chosen stocks. Show the reduced available count and allow the player to confirm
  deliberate use of protected stock at normal entry points. Purchases can refill supplies by choice. Preserve silo
  grass cutting and the pantry's takeout fallback. Keep **Ship surplus** off by default, taking one roster action for
  one configured crate of up to 50 units across allowed IDs. It puts stock in the existing bin for the following day.
  The player can take it back, and the following evening pays it at that day's prices alongside the manual bin.
- **Forecast.** Reuse the current `handsTonight` and `tableTonight` dry run. Show the first actionable blockers,
  such as **Water · 3 tiles uncovered**, **Spring 8 · no grade harvester**, **Barn · 2 feed short**, or
  **Mill · Wheat Flour G2 ×4 tonight**. For future days show known availability and the next open or uncovered shift.
  Preview the actual current night, including queued expedition departures, town days, assistant commitments, half
  pace, and the arbitration of two workers on a task. The forecast spends nothing and changes no random state.

Keep the landscape frame and right-side sheets. Put the scope and tonight's result above worker details. A seasonal
crop picker uses the existing calendar and shop, and the Warehouse groups grades by ingredient. The morning groups
first discoveries separately from counts. Keep praise, worker practice, ranks, bonds and meal effects on the current
night paths. A decision to send an Uma on an expedition matters because her farm coverage is visible before she leaves.

## Grade, stars and discovery

| Concept | Rule | What it looks like |
|---|---|---|
| Ingredient | One stable species or product key. Form distinguishes raw from a specific processed output. | Carrot, Golden Carrot and Carrot Pickles are three different ingredient keys. |
| Grade | Each attainable grade has an explicit stock ID and a canonical grade. A common good gets its existing base grade **B**, then **B+1**, then **B+2**, capped at G10. | `carrot` G1, `carrot-grade-2` G2, `carrot-grade-3` G3. Golden Carrot stays its own G9 crop. Potato G2 and Carrot G2 coexist. |
| Stars | Keep ★1–5 in the stock key and the current quality model. Soil care represented by crop knowledge, Uma aptitude, equipment and fondness keep their existing effects where applicable. | ★4 Carrot G1 and ★1 Carrot G2 have different uses. Any star meets an exact-grade recipe requirement. |
| Discovery | Write an idempotent discovery for the exact completed output ID when normal work first puts it in the Warehouse. Keep proof after the last unit leaves. | Purchased Milk G3 can fill a recipe once the farm has collected Milk G3 itself. A bag of G2 seed alone teaches no G2 produce. |

- Use a shared explicit catalogue with an ingredient key, stable ID, base/grade, form, source hints, price and art reference.
  Today's family arrays imply grade from index, and existing Kitchen recipes pick ingredients by family and grade.
  Keep those legacy lookups on their original catalogue. Future consumers ask explicitly for exact IDs or aggregate by
  species. Save stock with the current item ID and star rows. Represent orchard, seed and job settings with optional
  validated fields. Store a planted grade independently from crop experience, which stays shared by species.
- Farmhand actions, legitimate night chores and manual production go through the same output rule. Count harvesting,
  ranch collection, fishing, eligible foraging, completed station loads and completed cooking. Leaving stock queued,
  buying, gifting, shipping, consuming, picking a recipe or receiving an expedition reward does not teach it.
  A side-by-side bonus copies the already produced ID and stars and cannot introduce a grade. A completed craft can
  teach its own output with a purchased input, while F98 still requires separate proofs for every required ancestor.
- A station must carry the exact output and consumed input stars from load start to completion. Parse pre-existing
  v5 in-flight loads and ready livestock as their legacy outputs. Initialize older saves' discovery from trustworthy
  per-ID evidence. Verify the writers of each saved counter before using it. A legitimate per-species caught-size
  record proves its only historical base grade. Crop mastery cannot prove a newly added grade. Stock, aggregate
  counts or sales do not prove an origin. A missing proof can always be earned by playing the normal action.
- Publish one discovery source per required grade with relevant season, location, building and worker or manual
  requirement. When an item has several sources, show the nearest attainable one first. Keep all base grades
  reproducible and higher grades independent of stars. Keep existing shipments, builds, gifts, talents, challenges,
  food uses, original UI ordering and art keys working through deliberate consumer audits.
- Use client-owned additive v5 fields and the same strict parser on web and API. Validate only supported variants.
  Parse old saves with defaults, preserve unknown-to-the-player progress, and leave the clock and revision rules alone.
  Deploy parser and catalogue support before enabling any client writer. Verify stale PWA and offline-client behavior
  against the current refusal and backup rules before activating. Keep a reader for graded saves in any rollback build.

## Production rules

The numbers below are first implementation defaults. Adjust them against the release checks, with particular attention
to seasonal reachability and the value of a farmhand's time.

### Crops and fruit

- Use the **22 existing shop crops and 24 added plantables** for the three-step ladders. Keep the five rare crops on
  their existing sources and grades. Base grades are per species. Existing seeds and tiles default to base when a
  grade is absent. Higher seeds are renewable by grade-preserving seed saving. Always sell existing base shop seeds
  in their current season and preserve drop tables. A natural returned seed inherits the **planted grade**, even when
  an Uma upgrades the harvested unit. Seed quantities and prices stay visible before committing.
- **Save same grade** costs one matching harvest unit per seed. **Improve seed** costs the same with a crop knowledge
  threshold of **3 points for B → B+1** and **12 points for B+1 → B+2**. Each use costs one action per batch of up to
  four units from one input grade. Own seeds keep the existing double knowledge. Purchased or foraged fruit may
  supply units, but only growing that species contributes its crop knowledge. Grades take the same growing time.
- **Harvest next grade** turns one unit per eligible tile into the immediate next grade without changing yield or
  stars. It requires Harvesting **4** for B → B+1 and **7** for B+1 → B+2. The other units keep the planted grade.
  Give each harvested tile its normal knowledge, including a regrowth harvest. Use the same harvest rules on a one-unit
  crop and a two-tile action. A solo player gets both grades through seed saving with no skill requirement.
- **Orchard.** A shrub or tree occupies one existing tile and is planted on tilled ground any season. It needs the
  listed watered nights to establish. Mature woody plants need no further watering, persist while dormant, and set
  one crop per listed bearing season. Trees already mature set fruit the first morning of that season. A sapling
  that finishes during its bearing season sets fruit upon maturing. Ripe fruit waits across seasons. An unpicked
  crop occupies that season's crop slot until collected. Clearly mark **Dormant · bears Autumn** and require a
  deliberate, one-action removal of the tree before planting a different grade, leaving tilled soil. Never auto-clear
  a tree. A berry annual follows the usual season and regrowth rules.

### Ranch

Keep the seven animals and their existing housing, feed, collection and fondness. The product grade is selected when
it enters the Warehouse. Use fondness at collection time, plus collector skill, under the selected grade cap.
Every existing type gets up to two more grades, starting with Egg G1 and Milk G2.

| Product grade | Requirement at collection |
|---|---|
| B | Always available. **Standard** caps production here, even from ten-heart animals. |
| B+1 | At least 3 hearts. |
| B+2 | At least 7 hearts and the collector has Animal care 6, or at least 9 hearts with any collector. |

An **Up to** cap chooses the highest eligible grade up to that limit. The ranch screen previews which animals meet
that cap before a building-wide collection. All existing feed and heart changes, one pending unit per animal, star
quality, grass and grass recovery remain in force. Prioritize feed coverage over quality; a backup can use a lower
collection cap by changing the shared plan, or can cover feed only via an optional care mode. Hoe, fertilizer,
breeding and specialty feed are outside this release.

### Fishing

Keep every spot, seasonal species table, thin-haul limit, length formula and species record. Base catches remain the
default and retain the spot and depth conditions. Give all fish below G9 two attainable upgrades, Silverfin G9 one
upgrade, and Rainbow Koi G10 its current tier alone.

| Target | Manual qualification | Roster qualification | Promotion |
|---|---|---|---|
| B+1 | 12 successful manual catches | Fishing aptitude 4 | Every 3rd eligible catch of that species in this mode |
| B+2 | 40 successful manual catches | Fishing aptitude 7 | Every 5th eligible catch of that species in this mode |

Choose **Standard**, **Improved catch**, or **Select catch** on the spot or assignment. Persist the eligible-catch
remainder once per species and selected grade, shared across workers and compatible spots. Off-target species keep
their own progress if eligible. A miss, an unqualified action, or a passive extra adds no promotion progress.
Grade changes only an actual species landed. Preserve seeded draws and length records by base species. A passive
night catch still proves the base fish when it produces one. Manual eligibility is based on actual player catches
recorded going forward, unless a legacy save has proof specific to manual fishing. Give visible progress on the spot
panel and the grade's discovery hint.

### Stations and crafted goods

- All existing one-input crop, fish, fiber and fruit recipes carry the grade and stars through to their matching
  refined output. Exact job keys and station lists should be explicit. Reserve a load's inputs immediately. It opens
  capacity again at the existing end of night and credits output proof then. Keep 8 units per load, 12 with the
  existing aptitude rule, and 1–5 loads per station. A job with a fixed ratio rounds down to whole batches and
  consumes only the number of complete batches. A homogeneous load keeps the input stars.
- Add these goods in the existing stations. Any worker or player can run an unlocked recipe. Grade and stars come
  from the exact selected input. These are first authored conversions, with base grade inherited from the source.

| Station job | Minimum station level | Exact input per output | Output ladder |
|---|---:|---|---|
| Mill · Cultured Yogurt | 1 | 1 Cow Milk | G2–G4 |
| Mill · Butter | 2 | 2 Cow Milk | G2–G4 |
| Mill · Farm Cheese | 3 | 2 Cow Milk | G2–G4 |
| Mill · Goat Cheese | 3 | 2 Goat Milk | G4–G6 |
| Sawmill · Carrot Pickles | 2 | 2 Carrot | G1–G3 |
| Sawmill · Preserved Egg / Preserved Duck Egg | 2 | 1 Egg or 1 Duck Egg, separate jobs | G1–G3 / G3–G5 |
| Sawmill · Tomato Sauce | 2 | 2 Tomato | G5–G7 |
| Sawmill · Fruit preserves | 1 | 1 fruit, a separate job per fruit | Existing preserves and graded forms, plus Strawberry Jam, Raspberry Jam, Blueberry Jam and Persimmon Preserve |

Keep intentional multi-input cooking in the Kitchen. Build standard refined pricing from the exact raw grade as
today. For the new jobs that take two units, start at 125% of the full raw cost, rounded to 5g. Spot-check that
crates, food and processing all stay worthwhile and output multipliers never mint an unlimited margin.

## 24 added plantables

The table gives base G, farm rank and buy price. A slash in the timing column separates first maturity and watered
regrowth. Woody plants use establishment nights and then one pick per bearing season. Values in the last column
are units per harvest. Existing wild fruit reuse the same base ID, product, price and sourcing. New seeds appear in
their named season, with all woody saplings plantable whenever held. Target a section per season, within the existing
shop. Names, grade placement and assets are Uma Farm authoring.

| Season | Crop | Type | Base | Rank | Seed | Nights | Yield |
|---|---|---|---:|---:|---:|---:|---:|
| Spring | Radish | Annual | G1 | 1 | 20g | 3 | 1 |
| Spring | Lettuce | Annual | G2 | 1 | 30g | 5 | 1 |
| Spring | Green Peas | Annual | G3 | 2 | 50g | 5/3 | 2 |
| Spring | Strawberry | Annual | G2 | 2 | 65g | 5/3 | 2 |
| Spring | Raspberry | Shrub | G3 | 3 | 130g | 6 | 3 |
| Spring | Plum | Tree | G4 | 4 | 220g | 8 | 3 |
| Summer | Cucumber | Annual | G2 | 1 | 40g | 5/3 | 1 |
| Summer | Okra | Annual | G4 | 2 | 55g | 5/3 | 1 |
| Summer | Zucchini | Annual | G3 | 2 | 50g | 6 | 2 |
| Summer | Peach | Tree | G3 | 3 | 180g | 7 | 3 |
| Summer | Blueberry | Shrub | G4 | 3 | 150g | 6 | 3 |
| Summer | Mango | Tree | G7 | 6 | 360g | 8 | 3 |
| Autumn | Turnip | Annual | G1 | 1 | 25g | 4 | 1 |
| Autumn | Sweet Potato | Annual | G3 | 2 | 50g | 5 | 2 |
| Autumn | Winter Squash | Annual | G6 | 4 | 105g | 8 | 2 |
| Autumn | Apple | Tree | G1 | 2 | 100g | 6 | 3 |
| Autumn | Pear | Tree | G2 | 3 | 160g | 7 | 3 |
| Autumn | Grape | Shrub | G6 | 4 | 260g | 7 | 3 |
| Winter | Leek | Annual | G2 | 1 | 30g | 4 | 1 |
| Winter | Cauliflower | Annual | G5 | 2 | 65g | 6 | 2 |
| Winter | Red Beet | Annual | G3 | 2 | 45g | 5 | 2 |
| Winter | Orange | Tree | G5 | 4 | 220g | 7 | 3 |
| Winter | Persimmon | Tree | G6 | 4 | 245g | 7 | 3 |
| Winter | Pomegranate | Tree | G8 | 6 | 375g | 8 | 3 |

Add IDs and art through the repository's Uma Platform catalogue release workflow. Reuse a species' icon with a grade
label where the atlas contract permits it, and use one original plant/seed/produce set per new species as needed.
Start the added vegetables at these ★1 prices and tune against current per-action profit and regrowth.
Spring has Radish 55g, Lettuce 85g, Green Peas 65g. Summer has Cucumber 85g, Okra 95g, Zucchini 80g. Autumn
has Turnip 65g, Sweet Potato 80g, Winter Squash 160g. Winter has Leek 75g, Cauliflower 115g, Red Beet 85g.
New fruit uses the existing fruit ladder. Adopt a first price curve of **1.2× / 1.45× the species' base** for its two grade variants,
rounded to 5g. Aggregate easing by the shared ingredient key plus form across grades, preserving both the old
per-good behavior for untouched goods and the 50-unit crate constraint. Keep raw and refined goods separate.
Test bin estimates, settlement, Diary and shop demand as well as grading. Rank credit records the actual grade ID
while base-family milestones aggregate appropriately, with existing milestone totals preserved.

## Release sequence and the Restaurant handoff

| Release | Slice | Play it through before moving on |
|---|---|---|
| **A · Shared contract and carrots** | Stable catalogue, v5 discovery, Carrot G1–G3, saving seeds, row plans, shared coverage, reserves and tonight's preview. | One person grows G2 within Spring. Two Umas can repeat the same loop across a town day. G1 is still produced on demand and both proofs persist after shipping. |
| **B · Fields and orchard** | 24 plantables, remaining common crop ladders, tree tiles, Grade filters and stock hints. | A four-season plan runs on the same rows. Trees survive dormancy, and existing forage routes for fruit work. Replacing a mature tree takes deliberate action. |
| **C · Ranch, stations and surplus** | All seven ranch ladders, product caps, exact load queues and food conversions, optional surplus job. | The roster gets G3 Milk, makes G3 Yogurt, protects a milk floor for cooking and sells a deliberately prepared surplus crate. No claimed input or station load is counted twice. |
| **D · Fishing and full-farm tuning** | Targeted fishing modes, preserved records, fillet ladders, source and economy checks. | G2 Carp and G2 Carp Fillet are earned through a roster shift and an overnight station load, with base catches still available. Run the multi-year portfolio and F98 source audit. |
| **F98 · Restaurant** | Use the discovery contract and revise selected authored recipes within the existing 120. | A roster can discover the entire menu. Early-stage base dishes keep the year-round entry path. Later recipes give a reason to improve production grades. |

Suggested F98 integrations to verify and adopt in its implementation. Keep existing recipe IDs, output grades and
dependencies. Leave R001 and Stage 1 available on the base routes. Use Carrot G2 in **R026 Sunflower Carrot Roast**,
Carp Fillet G2 in **R044 Rosemary Fillet Supper**, Apple Preserve G2 in **R051 Apple Rye Pudding**, and Milk G3 in
**R063 Duck Egg Pepper Custard**. R051 still requires actual Apple G2 discovery. Review all 120 exact rows and their
transitive sources after grades ship. If a test chain lacks a dependable season or skilled source, solve the sourcing
or recipe constraint before shipping that row. Ingredient discovery, recipe learning and spending stock remain
different events. F98 keeps its choices to sell, cook with, or feed the farm with the finished dishes.

### Worked pilot · a Spring carrot in nine days

The farm starts with nine clear tiles and nine Carrot seeds. With three of those tiles, all below fit the existing
ten-action daily budget using Basic tools and no perks.

| Day | Play | Actions | Result |
|---|---|---:|---|
| Spring 1 | Till 3, plant 3, water 3 | 9 | Three G1 carrots go into their first watered night. |
| Spring 2–4 | Water all three | 3 per day | Three G1 carrots are ripe the morning of Spring 5. |
| Spring 5 | Harvest 3, improve one G1 into G2 seed, plant and water it | 6 | Three crop points, proof of G1 and two G1 carrots left. |
| Spring 6–8 | Water the new crop | 1 per day | G2 crop ripens overnight on Spring 8. |
| Spring 9 | Harvest | 1 | G2 proof and one G2 carrot. G1 seed is still on the Spring shelf. |

A worker version starts with two overlapping Field assignments on the same rows, one of which can run the seed
task, and a reserve that leaves at least one G1 for seed. New Umas can run the seed path at any Harvesting
aptitude once the crop meets its knowledge threshold. At Harvesting 4, a worker on the grade row can get G2
directly from G1 planting. Preview a town day and an expedition departure with coverage in place. A player
working the same row should see the same crop, pace and discoverable ID.

## Done when

- **Rules and migration.** Test fresh and actual-shape v5 fixture farms, pending loads and stove plays, ready
  livestock, legacy tasks, any-grade lookups in the old Kitchen, and all common crop, ranch and fish ladders.
  Check deterministic manual and roster actions, grade promotion counters, retry and forecast parity. Verify that
  purchases and legacy stock alone grant no proof, and a valid receipt grants it once and survives save/load.
  Base crops, old seeds, gifts, rank goals, challenges, art, bin totals and takeout still work at their normal entry points.
- **Scheduling.** Test season turnover, town days with overlapping schedules, a spouse, a departing party, a returning
  party, assistants, short upkeep and half pace, a missed watering and an empty feed silo. Compare preview with real
  night steps. Show one clear reason when a task cannot run. Exercise same-night harvest to load, full stations,
  next-night use of a completed load, full seed targets, automatic cooking near reserves and bin settlement across
  seasons. The player can cover a gap and change a plan without losing work.
- **Scale.** Extend `farm/scale.test.ts` with a four-year table for 0, 3, 10, 20 and 50 Umas. Track worker vs manual
  routine actions, uncovered water and feed, seed stockouts, time to first and repeat grade, useful work and idling,
  station utilization, pantry/takeout, shipping revenue, and stock growth by form. At 10, 20 and 50 farmhands, target
  **at least 80% of routine farm actions by Umas** averaged across each full settled year, **at least 8 of 10 player
  actions free on a typical day**, and no daily reassignment. Count the manual actions the scenario needs to keep
  its chosen production going, including water, feed, stock work and routine shipping. Run a sustained absence case.
  Record seasonal results, capacity bottlenecks and the initial thresholds that actually hit the targets. Keep scale
  runs as balance checks with deterministic fixtures and report their parameter choices.
- **Content and screens.** Report a reachable source for each authored grade, retained wild fruit routes, a same-season
  first grade on carrots, and theoretical route to **51** plantables. Before F98, audit all 120 recipe graphs for
  cycles, obtainable leaves, valid exact outputs and a route through every season. Owner check at 844×390 and
  667×375 on the existing field, work board, Warehouse and morning view. Keep the main bundle within 180 KB gzip.
- **Deliver.** Take A–D through reviewable releases with their rule documentation and regenerated pages. Use the
  product's normal build, lint and tests, and its art release procedure as needed. Delete this packet and its
  roadmap step once all four slices ship. Keep F98 in the ledger until its own implementation ships.
