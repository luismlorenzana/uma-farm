# Goals: the Farm Rank, the Diary and chapter 1

**Built in F24, live from F24** (the packet that turned the loop on). The farm has a ladder of its own, the **Farm
Rank**, whose points come from shipping, the **Diary's** collections and milestones, and chapters; the story's
**chapter 1, "A Field Again"**, gives the first days six goals, and two **scenes** open and close it. This page is the
goals as built. The rules are in `@farm/domain` (`farm/milestones.ts`, `farm/diary.ts`, `story/chapters.ts`,
`story/scenes.ts`, `story/chapter-1.ts`, `story/cast.ts`, night step 8 in `night/end-day.ts`); the screens in
`apps/web/src/loop/` (`DiaryPage.tsx`, `ScenePlayer.tsx`, the rank's sheet in `LoopSheets.tsx`, `goal-words.ts`) and the
chip in `apps/web/src/shell/Bars.tsx`. The spec is [core-spec.md](../design/core-spec.md) CS38, CS39, CS41 and CS42; the
calls are D38.

```
 day 1: the start's three ──► the opening scene ──► "Plant the carrots"
                                                          │
 the day: plant, tend, ship, gather ──► End the day ──► the night's step 8, `checkGoals`:
                                                          │  1. the Diary pays what's reached (milestones, rows)
                                                          │  2. the Farm Rank's points are recomputed from the save
                                                          │  3. every goal met? the chapter completes: 500g, the
                                                          │     Mill's plans, a recruit; chapter 2 opens
                                                          │  4. the Diary and the rank again (the recruit, +250)
                                                          ▼
 the morning: "Chapter 1 done", "Farm Rank 2 · …", "First Uma at Hand · +300g" ──► Start the day
                                                          │
                                                          ▼  (the morning after the chapter, once put away)
                                                  the closing scene ──► chapter 2: Soon (M5)
```

## The Farm Rank (CS39; decisions 1 and 8)

The farm's own rank, 1 to 10. **Its points are recomputed at night step 8 from the save** and stored in
`farm.points`: ⌊gold shipped ÷ 100⌋ + 5 × Diary entries + 25 × milestones + 250 × chapters done (`farmPointsOf`,
`withFarmPoints`). Every term only grows, so the rank never falls. `farmRankOf(points)` reads it everywhere: the Fields'
blocks, the Dorm's levels, the shop's seed tiers and the Sawmill and Smokehouse gate on it.

<!-- live:farm-rank-points -->
| Source | Points | In M4 |
|---|---|---|
| Gold shipped at the bin | 1 per 100g | Yes: `farm.counts['gold-shipped']` |
| A Diary entry: a good shipped once | 5 | Yes: `diary.shipped` |
| A milestone | 25 | Yes: `diary.milestones` |
| A chapter done | 250 | Yes: `farm.chapter` − 1 |
| A festival's 1st / 2nd / 3rd | 150 / 75 / 25 | M6 |
| Decorations | 1 per 100g | M6 |
<!-- /live -->

**What each rank opens** is read from the rules that gate on it (`farmRankOpens`), so the sheet and the morning can't
drift from the game. More of what's open, not new places (D24 #4); CS39's later rows (the Barn, regions, Coop and Kitchen
levels, boards and parties) join with their packets.

<!-- live:farm-rank-opens -->
| Farm Rank | Points | Opens |
|---|---|---|
| 1 | 0 | Block A, tier-1 seeds (the start); Dorm level 2 |
| 2 | 150 | Block B (800g), Dorm level 3 (8 beds), New seeds at the shop |
| 3 | 500 | Dorm level 4 (12 beds), The Sawmill (1,500g), The Smokehouse (2,000g) |
| 4 | 1,200 | Block C (3,000g), Dorm level 5 (16 beds), New seeds at the shop |
| 5 | 2,400 | Dorm level 6 (22 beds) |
| 6 | 4,000 | Block D (8,000g), Dorm level 7 (30 beds) |
| 7 | 6,500 | Dorm level 8 (40 beds) |
| 8 | 10,000 | Dorm level 9 (50 beds) |
| 9 | 15,000 | Dorm level 10 (60 beds) |
| 10 | 22,000 | The farm’s gold crest |
<!-- /live -->

- **A rank-up is news:** the morning's **New today** says "Farm Rank 2 · Block B (800g), Dorm level 3 (8 beds), New
  seeds at the shop", tagged Farm Rank, opening the rank's sheet. Two ranks in one night are two lines.
- **The chip** (decision 8): the account bar's third chip, after the date and the gold: the crest (`farm/rank`, F25's part A,
  pinned from F49; a green "FR" shield without it) and the rank. Its name is "Farm Rank 2: 400 points". uma-kit's tier crest stops at
  3, so the rank isn't drawn there.
- **The sheet** (`?sheet=rank`, over any page): the points, a bar to the next rank with "100 more for Farm Rank 3
  (500)", what the next rank opens, and the points so far by source (shipping, Diary entries, milestones, chapters). The
  rules sit behind its help button.

## The Diary's counts (CS38; decisions 2 and 3)

The Diary's own screen is M6's (CS55). M4 counts what it will show and pays for it.

- **Entries:** each good shipped at least once (`diary.shipped`, F19) is an entry, **5 points**. The catalogue is the
  260 goods; dishes, the ranch's goods and the Forge's join with their packets.
- **Collection rows** (decision 3): a family's ten raw goods, or its ten refined ones, each shipped once, is a row. A
  row pays **500g once** (and a decoration, M6). A row isn't a milestone: its goods are already entries.
- **Milestones** (decision 2): each pays its gold **once** and is worth **25 points**. They're checked at night step 8
  and paid that night, their gold with the bin's, each listed in **New today** ("10,000g shipped · +300g", tagged
  Milestone, opening the Diary). `diary.milestones` keeps the ids paid, milestones and rows alike.
- **Depth** counts each area and spot **past the first**: the first night a haul comes in from the Hills, the River and
  so on pays 500g (the night's step 4 notes what finished where). The Woods and the Pond are open on day 1 and pay none.
- **"Umas recruited"** counts the roster, the starters included, so a fifth Uma pays 300g.
- **Not yet:** "Umas recruited" at 100 and 272 (a decoration), festivals won (M6), Mine floors (M5), an animal at 10
  hearts and a Masterwork (later), and records (F22 keeps the sizes; the Diary's screen shows them in M6).

<!-- live:milestones -->
| Milestone | Id | Gold | Points |
|---|---|---|---|
| 10,000g shipped at the bin | `shipped:10000` | 300g | 25 |
| 50,000g shipped at the bin | `shipped:50000` | 1,000g | 25 |
| 100,000g shipped at the bin | `shipped:100000` | 2,000g | 25 |
| 250,000g shipped at the bin | `shipped:250000` | 4,000g | 25 |
| 500,000g shipped at the bin | `shipped:500000` | 8,000g | 25 |
| 1,000,000g shipped at the bin | `shipped:1000000` | 15,000g | 25 |
| 5 Umas on the roster (the starters count) | `recruited:5` | 300g | 25 |
| 10 Umas on the roster (the starters count) | `recruited:10` | 1,000g | 25 |
| 20 Umas on the roster (the starters count) | `recruited:20` | 2,500g | 25 |
| 40 Umas on the roster (the starters count) | `recruited:40` | 6,000g | 25 |
| 60 Umas on the roster (the starters count) | `recruited:60` | 10,000g | 25 |
| The first Uma at Hand, in any activity | `rank:hand` | 300g | 25 |
| The first Uma at Skilled, in any activity | `rank:skilled` | 600g | 25 |
| The first Uma at Expert, in any activity | `rank:expert` | 900g | 25 |
| The first Uma at Master, in any activity | `rank:master` | 1,200g | 25 |
| The first Uma at Legend, in any activity | `rank:legend` | 1,500g | 25 |
| The first haul from the Hills | `depth:hills` | 500g | 25 |
| The first haul from the Old Forest | `depth:old-forest` | 500g | 25 |
| The first haul from the Mountain | `depth:mountain` | 500g | 25 |
| The first haul from the Misty Vale | `depth:misty-vale` | 500g | 25 |
| The first haul from the World Tree | `depth:world-tree` | 500g | 25 |
| The first haul from the River | `depth:river` | 500g | 25 |
| The first haul from the Lake | `depth:lake` | 500g | 25 |
| The first haul from the Falls | `depth:falls` | 500g | 25 |
| The first haul from the Moon Pool | `depth:moon-pool` | 500g | 25 |
| The first haul from the Sea Pier | `depth:sea-pier` | 500g | 25 |
| The first haul from the Deep Sea | `depth:deep-sea` | 500g | 25 |
| The first crop at level 5 | `crop-level:5` | 500g | 25 |
| The first crop at level 10 | `crop-level:10` | 500g | 25 |
<!-- /live -->

<!-- live:diary-rows -->
| Row | Id | Its ten goods | Gold |
|---|---|---|---|
| Grains | `row:grains` | Wheat, Oats, Barley, Rice, Corn, Rye, Buckwheat, Wild Rice, Moonrice, Sunwheat | 500g |
| Vegetables | `row:vegetables` | Carrot, Potato, Cabbage, Onion, Tomato, Bell Pepper, Eggplant, Asparagus, Golden Carrot, Emperor Pumpkin | 500g |
| Herbs and spices | `row:herbs-spices` | Basil, Mint, Rosemary, Thyme, Ginger, Peppercorn, Cinnamon, Saffron, Mandrake, Phoenix Pepper | 500g |
| Nuts and seeds | `row:nuts-seeds` | Peanut, Sunflower Seed, Sesame, Walnut, Chestnut, Almond, Pistachio, Macadamia, Thundernut, Worldseed | 500g |
| Sweets | `row:sweets` | Honeycomb, Sugarcane, Sugar Beet, Maple Sap, Cacao Pod, Vanilla Pod, Agave Heart, Palm Sap, Fairy Honeycomb, Ambrosia Blossom | 500g |
| Fruits | `row:fruits` | Apple, Pear, Peach, Plum, Orange, Grape, Mango, Pomegranate, Starpeach, Golden Apple | 500g |
| Mushrooms | `row:mushrooms` | Button Mushroom, Shiitake, Oyster Mushroom, Enoki, Chanterelle, Porcini, Morel, Truffle, Glowcap, King Reishi | 500g |
| Woods | `row:woods` | Pine Log, Birch Log, Cedar Log, Maple Log, Oak Log, Cherry Log, Mahogany Log, Ebony Log, Elderwood Log, Yggdrasil Branch | 500g |
| Ores | `row:ores` | Copper Ore, Tin Ore, Iron Ore, Silver Ore, Cobalt Ore, Gold Ore, Platinum Ore, Titanium Ore, Mythril Ore, Orichalcum Ore | 500g |
| Stones | `row:stones` | Limestone, Sandstone, Slate, Granite, Basalt, Marble, Obsidian, Jade, Runestone, Meteorite | 500g |
| Crystals | `row:crystals` | Quartz, Amethyst, Citrine, Garnet, Emerald, Sapphire, Ruby, Diamond, Starstone, Philosopher's Stone | 500g |
| Fish | `row:fish` | Carp, Trout, Sardine, Mackerel, Salmon, Sea Bream, Eel, Tuna, Silverfin, Rainbow Koi | 500g |
| Hides and scales | `row:hides-scales` | Puffbun Pelt, Boarling Hide, Wolfkin Pelt, Rock Lizard Scale, Ironback Hide, Basilisk Scale, Manticore Hide, Behemoth Hide, Wyvern Scale, Dragon Scale | 500g |
| Bones and horns | `row:bones-horns` | Seashell, Ammonite, Trilobite, Fossil Bone, Mammoth Tusk, Saber Fang, Raptor Claw, Tyrant Tooth, Titan Bone, Unicorn Horn | 500g |
| Essences | `row:essences` | Mist Essence, Dew Essence, Breeze Essence, Ember Essence, Tide Essence, Spark Essence, Glimmer Essence, Shadow Essence, Aether, Prismatic Essence | 500g |
| Grains, refined | `row:grains:refined` | Wheat Flour, Rolled Oats, Pearl Barley, Polished Rice, Cornmeal, Rye Flour, Buckwheat Flour, Hulled Wild Rice, Moonrice Flour, Sunwheat Flour | 500g |
| Herbs and spices, refined | `row:herbs-spices:refined` | Dried Basil, Dried Mint, Dried Rosemary, Dried Thyme, Ground Ginger, Ground Pepper, Ground Cinnamon, Saffron Threads, Mandrake Powder, Phoenix Spice | 500g |
| Nuts and seeds, refined | `row:nuts-seeds:refined` | Peanut Butter, Sunflower Oil, Sesame Paste, Walnut Paste, Chestnut Paste, Almond Paste, Pistachio Paste, Macadamia Butter, Thundernut Oil, Worldseed Oil | 500g |
| Sweets, refined | `row:sweets:refined` | Honey, Cane Sugar, Beet Sugar, Maple Syrup, Chocolate, Vanilla Extract, Agave Syrup, Palm Sugar, Fairy Honey, Ambrosia | 500g |
| Fruits, refined | `row:fruits:refined` | Apple Preserve, Pear Preserve, Peach Preserve, Plum Preserve, Orange Marmalade, Grape Jelly, Mango Pulp, Pomegranate Molasses, Starpeach Nectar, Golden Apple Preserve | 500g |
| Mushrooms, refined | `row:mushrooms:refined` | Dried Button Mushroom, Dried Shiitake, Dried Oyster Mushroom, Dried Enoki, Dried Chanterelle, Dried Porcini, Dried Morel, Shaved Truffle, Glowcap Powder, Reishi Powder | 500g |
| Woods, refined | `row:woods:refined` | Pine Plank, Birch Plank, Cedar Plank, Maple Plank, Oak Plank, Cherry Plank, Mahogany Plank, Ebony Plank, Elderwood Plank, Yggdrasil Plank | 500g |
| Ores, refined | `row:ores:refined` | Copper Ingot, Tin Ingot, Iron Ingot, Silver Ingot, Cobalt Ingot, Gold Ingot, Platinum Ingot, Titanium Ingot, Mythril Ingot, Orichalcum Ingot | 500g |
| Stones, refined | `row:stones:refined` | Limestone Block, Sandstone Block, Slate Block, Granite Block, Basalt Block, Marble Block, Obsidian Block, Jade Block, Runestone Block, Meteorite Block | 500g |
| Crystals, refined | `row:crystals:refined` | Cut Quartz, Cut Amethyst, Cut Citrine, Cut Garnet, Cut Emerald, Cut Sapphire, Cut Ruby, Cut Diamond, Cut Starstone, Cut Philosopher's Stone | 500g |
| Fish, refined | `row:fish:refined` | Carp Fillet, Trout Fillet, Sardine Fillet, Mackerel Fillet, Salmon Fillet, Sea Bream Fillet, Eel Fillet, Tuna Fillet, Silverfin Fillet, Rainbow Koi Fillet | 500g |
<!-- /live -->

## Chapter 1, "A Field Again" (CS42; decisions 4 and 5)

Chapter 1 opens on day 1. Each goal reads a counter or the save (decision 4); a counter counts **from the chapter's
start**: `farm.goals` holds each counter as it stood when the chapter opened (empty for chapter 1, so it's all of it), and
chapter 2 starts from a copy of `farm.counts` taken the night chapter 1 completes.

<!-- live:chapter-1 -->
| # | Goal | Done at | Read from | Teaches |
|---|---|---|---|---|
| 1 | Plant and harvest 9 crops | 9 | `farm.counts['plots-harvested']` since the chapter opened | Planting, tending, Ready plots |
| 2 | Ship 1,000g at the bin | 1,000g | `farm.counts['gold-shipped']` since the chapter opened | The bin, the overnight payout |
| 3 | Bring home 10 things from the Woods or the Pond | 10 | `farm.counts['home:forest']` + `['home:fishery']` since the chapter opened | Assigning, the job sheet, collecting |
| 4 | Grow a second kind of crop | 2 | Kinds planted: entries in `crops` | The shop |
| 5 | Rank an Uma up to Hand | 1 | Any Uma at Hand or above, in any activity | Ranks and challenges |
| 6 | Reach Farm Rank 2 | 2 | The Farm Rank from `farm.points` | The Farm’s Rank, Block B |
<!-- /live -->

- **Goal 4 is planting** a second kind (two entries in `crops`), since a planted Potato isn't Ready by day 8.
- **The chapter completes at night step 8** the night its last goal is met, whether a goal was met in the day (a ninth
  harvest) or by the night itself (the bin's payout, a rank-up at step 6, Farm Rank 2 from tonight's milestones). Its
  reward is paid at once: **500g**, **the Mill's plans** (`buildings.mill = 0`, so the Mill's quick look offers
  **Build · 1,200g**; plans already held are left alone), **a recruit** and the chapter's **250 points**; then chapter 2
  opens.
- **The recruit** is F23's `recruitFor(save, release, talentOf)`: an outfit not on the roster and not waiting at the
  Gate, C or better in the farm's weakest open activity, drawn by the account, the day and the chapter; she joins with
  `joinRoster`, home while a bed is free, else away. The morning's news names her ("… joined", tagged New) with no more
  code. A release with none left gives no recruit.
- **The morning's New today** opens with "Chapter 1 done · +500g, the Mill's plans, a new hand, 250 Farm Rank points",
  tagged Chapter, opening the Diary.
- **Chapter 2** is a line until M5: its card says **Soon**, and nothing completes again.

<!-- live:chapters -->
| Chapter | Title | Opens with | Goals | Reward |
|---|---|---|---|---|
| 1 | A Field Again | The Fields, the Woods and the Pond | 6 | 500g, the Mill's plans (`buildings.mill = 0`), a recruit, 250 Farm Rank points |
| 2 | Feathers and Fences | The Coop and two chickens (Dale Hart) | Soon (M5) | — |
<!-- /live -->

## The night's step 8 (`checkGoals`)

Step 8 runs three named functions in order: F23's `settleDorm` and `gateVisitors`, then `checkGoals`
(`checkGoalsNight(save, release, talentOf, made)`):

1. **`payDiary`**: every milestone and row reached and not yet paid, its gold now (milestones in CS38's order, then rows).
2. **`withFarmPoints`**: the points recomputed.
3. **`chapterMet`**: every goal of the current chapter met? Then **`completeChapter`**, and `payDiary` and
   `withFarmPoints` again, so the recruit counts toward "Umas recruited" and the chapter's 250 points toward the rank.
4. The Farm Ranks reached tonight, lowest first, from the rank before the night.

The night's notes carry `goals: { chapter, paid, ranks }` to step 9, which writes New today's lines in this order: the
season and festivals, `{ kind: 'chapter', chapter }`, `{ kind: 'farm-rank', rank }`, `{ kind: 'milestone', id }`, then
the roster's news. The save's parse is strict: a chapter 1–8, a rank 2–10, a milestone or row id it knows, each once.

## The scenes (CS41, CS42; decisions 6 and 7)

> **On save v4 (romance build; live from F56; F46 decision 9):** the farmer's name comes first; the opening is re-cut
> (no hello lines, the Mayor greets you by name, it ends "Three Umas come up the road.") and reading it brings the cast's
> opening three; each then plays her **arrival scene**, the third ending on chapter 1's card. A chapter's recruit is its
> **authored arrival** (`completeChapter` on v4, nothing drawn), the closing scene's newest hand, whose arrival scene
> follows it. See [hearts.md](hearts.md#the-opening-rm9). v3's scenes below are what production plays.

**The town's cast is original** (CS41): their names and lines live in git. **Umas appear only in roles** the app fills at
runtime from master data: *your first hands* (the start's three, by the day they joined, then by id) and *your newest
hand* (the last to join: the chapter's recruit). A role nobody fills drops its line. M4 speaks three of the cast and
names a fourth.

<!-- live:cast -->
| Who | Is | From chapter | Bust (F25) |
|---|---|---|---|
| Mayor Hollis Pryor | Runs the town; opens each chapter | 1 | `cast/hollis-pryor` |
| Marta Quill | Keeps the general store (the shop) | 1 | `cast/marta-quill` |
| Old Ben Carver | Kept the farm before you; gives the first seeds | 1 | `cast/ben-carver` |
| Dale Hart | Rancher; sells animals and feed | 2 | `cast/dale-hart` |
| Gus Talbot | Retired miner; reopens the Mine and the Quarry | 3 | `cast/gus-talbot` |
| Rosa Bell | Cook; judges the Cooking Contest, first guest at the Restaurant | 4 | `cast/rosa-bell` |
| Juno Park | Runs the expedition post | 5 | `cast/juno-park` |
| Ida Stone | Smith; lights the Forge | 7 | `cast/ida-stone` |
| Captain Nils Berg | Sails the boat to the deep sea | 7 | `cast/nils-berg` |
| Wren Ashby | Rival: Ashby Orchards, crops and cooking | 1 | `cast/wren-ashby` |
| Cole Varga | Rival: Varga Ranch, animals and fishing | 1 | `cast/cole-varga` |
<!-- /live -->

**Each scene plays once:** its id goes in `diary.read` when it's played through or skipped (`readScene`, a player's
change). `sceneDue(save)` says which plays now:
- **the opening scene** once the start's three are picked (the picks come first), before the first tap of day 1. A
  migrated save, already holding its Umas, sees it once too;
- **the closing scene** the morning after chapter 1 completes, once the morning summary is put away.

The lines are data (`story/chapter-1.ts`), one to a tap, original and short, with `{name}` where an Uma's name goes:

<!-- live:scenes -->
**The Overgrown Farm** (`scene:1:open`)

| # | Who | Line |
|---|---|---|
| 1 | (narration) | Morning at the farm gate. The weeds stand as high as the fence. |
| 2 | Mayor Hollis Pryor | “Welcome! I’m Hollis Pryor, mayor of the town down the road.” |
| 3 | Mayor Hollis Pryor | “This farm has stood empty since Old Ben retired. We hope the Umas who spend their off-season here can bring it back.” |
| 4 | Old Ben Carver | “I kept one block tilled, just in case. Here: nine Carrot seeds to start you off.” |
| 5 | Old Ben Carver | “A tended row grows faster. Tap a plot, then pick who tends it.” |
| 6 | (narration) | Your first hands come in through the Gate. |
| 7 | Your first hand #1 (her hello) | — |
| 8 | Your first hand #2 (her hello) | — |
| 9 | Your first hand #3 (her hello) | — |
| 10 | Marta Quill | “Marta Quill, from the general store at the town edge. The shop is open whenever you need seeds.” |
| 11 | Marta Quill | “And that’s the shipping bin. Anything you put in pays tonight.” |
| 12 | Mayor Hollis Pryor | “Here’s what the town hopes to see first.” |

**First Shipment** (`scene:1:close`)

| # | Who | Line |
|---|---|---|
| 1 | (narration) | Word of the farm’s shipments has reached the town. |
| 2 | Mayor Hollis Pryor | “Marta and I couldn’t stay away. The whole town heard about that bin!” |
| 3 | Marta Quill | “Keep it full, and my shelves will follow.” |
| 4 | (narration) | Old Ben unrolls a set of plans. |
| 5 | Old Ben Carver | “A mill. Build it beside the Fields, and your grain comes back as flour.” |
| 6 | (narration) | A visitor walks in at the Gate. |
| 7 | Your newest hand | “I’m {name}. I heard this farm is coming back to life. May I stay?” |
| 8 | (narration) | A wagon rattles up the road. |
| 9 | Mayor Hollis Pryor | “That’ll be Dale Hart, the rancher. He’ll bring you two chickens once there’s a coop to keep them in.” |
<!-- /live -->

**The hello lines** (decision 7): each first hand says her temperament's (F21's top stat, [ranks.md](ranks.md)).

<!-- live:hello-lines -->
| Temperament | Her hello |
|---|---|
| Breezy | “Hi, I’m {name}! Point me at the work and I’m off.” |
| Steady | “{name}. I’ll be here every morning, rain or shine.” |
| Bold | “I’m {name}, and this farm is about to wake up.” |
| Gritty | “{name} here. Weeds don’t scare me.” |
| Clever | “Hello, I’m {name}. I’ve counted the plots already: nine.” |
<!-- /live -->

## The screens

- **The scene player** (`ScenePlayer.tsx`, decision 6): a full-screen sheet over the farm and its bars. The scene's
  title and **Skip** at the top; a bust (a cast member's lettered disc until F25's busts ship, an Uma's bust from master
  data through uma-kit's `UmaBust`, none for narration); the speaker's name in the accent and the line; "Tap to go on ·
  3/12". It loads master data itself (names, busts, temperaments), since a new account's boot doesn't wait for it, and
  **Skip** works without it. The opening scene ends on chapter 1's card, its six goals and reward, and **Plant the
  carrots**, which opens the Fields; the closing scene on "Chapter 1 done", its reward and chapter 2's title, **Soon**,
  and **Start the day**.
- **The Diary tab** (`/diary`, CS55): the chapter's card, its number, title and "4 of 6", each goal with a check when met
  and its count in its own unit ("4 / 9", "620g / 1,000g", "1 / 2 kinds", "Not yet", "Farm Rank 1 / 2"), and the reward;
  then **Farm Rank · 400 points ›** (the rank's sheet), and the milestones paid with their gold and "12 goods shipped so
  far". Once chapter 1 is done: "Chapter 1 done · …", chapter 2's title and **Soon**.
- **The Diary's Conversations** (romance build; live from F56; F52 decision 11; CS38 as RM65 amends it), on save v4:
  one row a pair with a bond heart, the most hearts first (then the most points, then the cast's order). Each shows the
  two faces, "Stand-in 1 & Stand-in 2" and the five bond hearts; then a **Bond n** chip for each conversation read, which
  replays it (pays nothing, marks nothing new), and **♥♥ Read** for any opened and unread; a pair with none written shows
  its tie's line ("Closer now" for a pair the ties don't hold). Empty: "None yet. Umas who work together grow close." The
  help adds one line. Conversations are read once into `diary.read` as `pair:<a>-<b>:<hearts>`
  ([hearts.md](hearts.md#pair-conversations-rm50-decisions-9-and-10)). The M4 build's Diary is unchanged.
- **The chip and the rank's sheet** (above).

## A local play of days 1–12 (decision 12)

Played locally on the real release (F24): an owner-shaped v2 migrated, three picks (a farming-A tender, a foraging-S
forager and a fisher), the carrots planted and tended, one Uma to the Woods and one to the Pond on day 1 through the
screens; days 2–12 through the app's own actions, CS51's sensible play (both gatherers in the Woods from day 4, Potatoes
in Block A on days 4 and 9, Dorm level 2 on day 5, a chat and a gift to the visitor from day 9, Block B, its seeds and the
Mill on day 12). No requests board (M6).

| Day | Gold at night's end | CS51 | What happened |
|---|---|---|---|
| 1 | 500 | 530 | Nothing shipped yet |
| 2 | 910 | 947 | Goal 3 (10 home) |
| 3 | 1,320 | 1,383 | |
| 4 | 2,245 | 2,520 | The carrots: goals 1, 2 and 4 |
| 5 | 1,670 | 2,001 | Dorm level 2 |
| 6 | 2,090 | 2,484 | |
| 7 | 2,520 | 3,482 | |
| 8 | 2,970 | 3,979 | A visitor at the Gate |
| 9 | 4,905 | 2,991 | The potatoes; the forager at Hand: goal 5 and "First Uma at Hand" (+300g) |
| 10 | 5,300 | 4,410 | |
| 11 | 6,255 | 2,523 | **Farm Rank 2 (goal 6): chapter 1 done**, the recruit joins home |
| 12 | 4,025 | 2,871 | The closing scene in the morning; Block B, Cabbage and the Mill built |

**Chapter 1 completed on night 11** (the closing scene on day 12), against the sim's day 8. Goals 1–4 were met by day 4
and goal 5 on night 9; **Farm Rank 2 (150 points) was the last**: 65 from shipping, 60 from twelve entries and 25 from
the Hand milestone. The sim's day 8 counts the requests board's premium (CS51's note), which M4 doesn't have, and its
farming Hand on day 4 isn't reachable as built (Hand asks 30 tended crops: two harvests of a tended block). Past day
10, so D38 says so; nothing is retuned without the owner.

## For M5

- **Chapter 2's goals** go in `CHAPTERS[1].goals`, counting from `farm.goals` (the copy of `farm.counts` taken the night
  chapter 1 completed); its reward, scene ids and lines follow chapter 1's shape. The closing scene's Dale Hart line
  promises two chickens "once there's a coop to keep them in".
- **Save v3 is live:** a new summary line, a new counter key the parse checks, or any other change to its shape is v4,
  with its migration and tests.
- F25's part B busts replace the lettered discs (`CastBust`) once that release is pinned; its part A marks (the crest,
  the seasons, the coin, the seed packet, the Dorm and the bin) are pinned from F49.
