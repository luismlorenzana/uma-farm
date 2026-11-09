# F27 — The ranch: the Coop and the Barn, cloth at the Mill, chapter 2 (save v4)

**uma-farm · Claude · L · Needs: M4 (F17–F24, done) · Pins: F25's uma-art release if it has shipped and isn't pinned
(F24's stand-ins go), and F29's likewise · Unblocks: F26 (chapter 3 follows chapter 2; v5 follows v4), F8 (eggs and
milk) · Milestone M5, more to do**

## Why

Chapter 1's closing scene promises Dale Hart's two chickens "once there's a coop to keep them in". Chapter 2 opens the
ranch: animals bought and fed, a carer for each pen raising their affection, and products whose stars come from hearts.
It's M5's first packet because chapter 2 comes first (CS43), so it also takes the first save change since the go-live,
v4, and sets the pattern F26, F8 and F28 follow. The chapters' machinery (opening gifts, scenes past chapter 1) is
generalised here once, so later chapters are data.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS13** (the ranch, whole), **CS43** (chapter 2's line), CS3 (the Coop
  with chapter 2), CS18 (the Mill's Cloth), CS7 step 3, CS5 (work done: animal products; today's nudges), CS6 (a carer
  has work), CS9 (refined ×1.5), CS19 (the ranch's ten goods; Egg, Duck Egg, Milk and Goat Milk new; the feeds), CS22
  (×1.25 affection well fed), CS26 (the ranch's quality: hearts ÷ 2.5, the Brush), CS28 (affection a day by talent),
  CS29–CS31 (rank points, the ranch's challenges, affection a day by rank), CS35 (the chapter's recruit), CS38 (an
  animal at 10 hearts), CS39 (the Barn at FR3; Coop 2 at FR4; Barn 2 and alpacas at FR5; Coop 3 and Barn 3 at FR7;
  Barn 4 at FR9), CS41 (Dale Hart), CS45 (feed disliked), CS4 (Winter's demand: cloth), CS53 (`ranch`), CS55.
- [core-loop.md](../../design/core-loop.md): FC1 (collect products), FC9, FC10, FC24, FC28, FC32 (M5 starts with the
  ranch), and "Notes from drawing the page" #2 (each milestone ships its chapters) and #13 (four slots, the Coop and
  Barn too).
- [decisions.md](../../decisions.md): D24, D25, D29, D30 (v3's shape, the migration's pattern), D31 (b: step 3's
  `tendAnimals`; d: well fed), D32 (b: quality's sources; demand), D34 (1: a block's tender, `isBusy`), D35 (f:
  `countChallenge`'s `care` and `hearts`; d: `rankPoints`), D36 (station jobs), D37 (m: feed disliked; o:
  `openActivities`), D38 (5: a chapter completes; h: the last in-place v3 change).
- The manual: [days.md](../../game/days.md) (the night's table, the summary), [fields.md](../../game/fields.md) (tending,
  the model for caring), [gathering.md](../../game/gathering.md) (the stations), [goods.md](../../game/goods.md),
  [ranks.md](../../game/ranks.md), [roster.md](../../game/roster.md) (gifts), [goals.md](../../game/goals.md) ("For
  M5"), [architecture.md](../../game/architecture.md) (v3, the go-live).
- Code: `save/v3.ts` (`ranch`, `Animal`, `ANIMAL_KINDS`, `ANIMAL_HOME`, `buildings`, `tools`), `save/parse-v3.ts`
  (`parseRanch`), `save/save.ts` (`SAVE_VERSION`, `NEWEST_SAVE_VERSION`, `parseSave`'s newer-version refusal),
  `save/migrate-v3.ts` (the pattern), `fields/fields.ts` (`setTender`, `isBusy`), `night/end-day.ts` (`tendAnimals`,
  `NightNotes`, `tickRanks`), `night/summary.ts`, `night/nudge.ts`, `farm/rank-rules.ts`, `farm/talents.ts`,
  `farm/visitors.ts` (`giftTaste`), `farm/places.ts`, `farm/milestones.ts`, `farm/diary.ts` (`farmRankOpens`,
  `DIARY_ROWS`), `story/chapters.ts`, `story/scenes.ts` (`SCENE_IDS`, `sceneDue`, `readScene`), `story/chapter-1.ts`,
  `goods/ids.ts`, `goods/rule.ts`, `goods/prices.ts`, `goods/stars.ts`, `gathering/ids.ts` and `kinds.ts`
  (`STATION_JOBS`, `planStation`), `save/shop.ts`; on the web `loop/farm-map.ts` (`PLACE_SCREENS`),
  `FieldsPage.tsx` and `FieldsPeek.tsx` (the tender's row and pips, the model here), `GoodsSheets.tsx` (the shop),
  `WarehousePage.tsx`, `ScenePlayer.tsx`, `DiaryPage.tsx`, `goal-words.ts`, `summary-words.ts`, `loop/boot.ts`; the
  API's `apps/api/src/save/` (backups by version); `scripts/check-size.mjs` (`LAZY_MODULES`).

## Decisions made

### From the spec

- **The animals (CS13):**

  | Animal | Lives in | Price | Feed a night | Product | Every | Price ★1 | At the Mill | How you get one |
  |---|---|---|---|---|---|---|---|---|
  | Chicken | Coop | 800g | Chicken Feed (10g) | Egg (`egg`) | 1 day | 50 | — | The shop, from chapter 2 (two come free) |
  | Duck | Coop | 1,500g | Chicken Feed | Duck Egg (`duck-egg`) | 2 days | 130 | — | Expeditions (Misty Marsh, F28) and requests (M6) |
  | Cow | Barn | 3,000g | Fodder (20g) | Milk (`milk`) | 1 day | 110 | — | The shop, once the Barn is built |
  | Goat | Barn | 2,200g | Fodder | Goat Milk (`goat-milk`) | 1 day | 85 | — | The shop, once the Barn is built |
  | Sheep | Barn | 2,600g | Fodder | Wool (`wool`) | 3 days | 300 | Wool Cloth | The shop, once the Barn is built |
  | Alpaca | Barn | 4,800g | Fodder | Alpaca Fleece (`alpaca-fleece`) | 3 days | 460 | Alpaca Cloth | The shop, from Farm Rank 5 |
  | Cashmere Goat | Barn | 8,000g | Fodder | Cashmere Fleece (`cashmere-fleece`) | 3 days | 700 | Cashmere Cloth | Expeditions (Ember Peak, F28) and the Animal Show (M6) |

- **The buildings (CS13):** the Coop holds **4** animals at level 1 (chapter 2, free), **8** at level 2 (5,000g, FR4),
  **12** at level 3 (12,000g, FR7); the Barn **4** at level 1 (8,000g, FR3, with chapter 2), **8** at level 2 (15,000g,
  FR5), **12** at level 3 (30,000g, FR7), **16** at level 4 (50,000g, FR9). **A carer looks after a pen of 4,** one
  slot each, so every place keeps four slots (D24 #13).
- **Affection a night (CS13):** with a carer, **+(8 + 3 × her ranch rank + her talent step (G 0 … S 7) + 1 a day in a
  row with the same carer, up to +5) × 1.25 well fed, + 3 a Brush tier** above Basic; no carer but fed **−10**; unfed
  (no feed in the Warehouse) **−40 and no product**. Hearts at **40, 100, 180, 280, 400, 540, 700, 880, 1,080 and
  1,300** points.
- **Products (CS13, CS26):** a fed animal lays by the morning every *n* days by kind. Its stars come from hearts:
  quality **Q = hearts ÷ 2.5, +0.25 a Brush tier** above Basic: 0 hearts is ★1, 5 hearts averages ★3, 10 is always ★5.
  Animals never die or leave.
- **The ranch's goods (CS13, CS19):** Egg 50g, Duck Egg 130g, Milk 110g, Goat Milk 85g, Wool 300g, Alpaca Fleece 460g,
  Cashmere Fleece 700g, and at the Mill **Cloth** (3 days): **2 Wool, Alpaca or Cashmere Fleece → 1 cloth** at ×1.5:
  Wool Cloth **900g**, Alpaca Cloth **1,380g**, Cashmere Cloth **2,100g** (CS18's worked case: 2 Wool, 600g, → 1 Wool
  Cloth, 900g). Winter's demand lifts the cloths (CS4's "cloth").
- **The ranch's challenges (CS30):** Hand, care for animals 10 days; Skilled, an animal in her care reaches 4 hearts;
  Expert, 7 hearts; Master, 10 hearts; Legend, 1st at an Animal Show with an animal in her care (M6, F32).
- **Rank points (CS29):** a carer's day pays 10 in the ranch × her talent's factor × 1.25 well fed × her hearts; the
  ranch is nobody's favourite (CS33).
- **Gifts (CS45, D37 m):** feed is disliked.
- **The Diary (CS38):** an animal at 10 hearts is a milestone, **500g** and 25 points.
- **Chapter 2, "Feathers and Fences" (CS43):** opens with the Coop and 2 chickens (Dale Hart); goals: own 4 chickens,
  collect 20 eggs, a chicken at 2 hearts, build the Sawmill or the Smokehouse, ship 5,000g in all; the reward is a
  recruit, **1,000g** (500g × the chapter) and 250 Farm Rank points; the sim finishes it on day 14.
- **The cast (CS41):** Dale Hart, the rancher, who sells animals and feed. Umas appear only in roles.
- **Art (CS19):** Egg, Duck Egg, Milk and Goat Milk, Chicken Feed and Fodder, the seven animals and the Coop are F29's;
  the Barn is uma-art's `stable`; Wool, the fleeces and the cloths are uma-art's.

### Decided here (the spec left these open)

1. **Save v4, and the pattern for M5's versions.** v3 is live (D38 h), and v3's parse refuses what the ranch adds, so
   this packet is **v4**:
   - `ranch.pens: { coop: (OutfitId | null)[]; barn: (OutfitId | null)[] }`: a carer per pen. Pen *i* is its building's
     animals 4*i* … 4*i* + 3 in the order bought, so a building has ⌈animals ÷ 4⌉ pens, never more than its level holds
     ÷ 4. `Animal` loses `carer` (it moves to the pen);
   - `ranch.laid: Warehouse`: products waiting to be collected, by good and stars (decision 5);
   - the catalogue's ten ranch goods and two feeds (decisions 7, 8), the Mill's `cloth` job (decision 9), the summary's
     new lines (decision 10) and the milestone `care:animal-10`.

   **The migration** `migrateToV4` sets the version, `ranch.pens` to `{ coop: [], barn: [] }` and `ranch.laid` to `{}`;
   no v3 save holds an animal (nothing made one), and one that does is refused. It never moves `account.updatedAt`.
   **The pattern** (F17's d, kept): `parseSave` reads v2, v3 and v4 as stored; each version's parse is strict about its
   own shape (an egg or a pen in a v3 is refused; the worker may fold the versions into one parse gated by version); the
   app's boot migrates every v3 it meets (on the device, from the server, in a 409, from a safety copy) once, committed
   without stamping, so the adopted migration uploads; the store holds v4 only; `SAVE_VERSION` and
   `NEWEST_SAVE_VERSION` are 4. The API stores either; its generic rules back up the v3 to `saveBackups/{uid}-v3` before
   the first v4 write and keep a v3 upload refused over a stored v4 in `saveRescues`. The live v3 build already stops
   at a newer save with the update prompt (`save.ts`'s refusal, F24's `root.test.tsx`). F26, F8 and F28 add v5, v6 and
   v7 the same way: if the queue's order changes, a packet takes the next version after the newest live one.
2. **A pen's carer is like a block's tender** (F20 decision 1): not an uma-work job. `setCarer(save, building, pen,
   outfitId | null)`; one rule, `isBusy`, now says a carer can't take a job, tend or care for a second pen, and a working
   Uma or a tender can't care; an Uma leaving tomorrow can't care (F23 g). A new carer resets her pen's streaks to 0. A
   carer **has work** (the nudge, step 6) while her pen holds an animal.
3. **The night's step 3, `tendAnimals`,** animal by animal in the order bought:
   - **Feed:** each eats one Chicken Feed (the Coop) or Fodder (the Barn) from the Warehouse; when it runs short, the
     newest go hungry.
   - **Affection** by CS13's table. The streak counts nights in a row with the same carer, tonight included: +1 the
     first night, +5 from the fifth. So CS13's "17 a day" for a Novice C carer comes from her fifth night, and her
     chicken reaches **2 hearts on night 7, 5 hearts on night 25 and 10 on night 78** (CS13's 6, 24 and 77 assume +5
     from the first night); a Skilled A carer's reaches 10 hearts on night 53 (CS13: 52). Well fed is read before
     `countWellFed`. Affection stays within 0–1,300.
   - **Products:** a fed animal's `next` counts down; at 0 it lays one product into `ranch.laid`, its stars drawn
     `draw(uid, day, 'laid:<animal id>', 0)` from its hearts after tonight and the Brush, and `next` restarts at its
     interval. A hungry animal's `next` doesn't move. A bought animal starts at its interval, so a chicken bought today
     lays tonight.
   - **Challenges:** each carer of a pen with an animal counts `{ kind: 'care' }` once; each animal in her pen at 4, 7
     or 10 hearts after tonight counts `{ kind: 'hearts', hearts }` for her. "Reaches" reads as "is at, after a night in
     her care", so a carer taking over a 5-heart pen meets Skilled: never impossible.
   - **Notes:** `notes.cared` (each carer and her building) for step 6's ranch points, one activity a day as F21 has it;
     `notes.laid`, `notes.hungry` and `notes.hearts` for the morning.
4. **Products wait to be collected** (FC1's "collect … products", FR9's taps), as Ready plots do: a tap on **Collect**
   on the Coop's or the Barn's page, or the map's Collect all (`collectFarm`), moves `ranch.laid` into the Warehouse and
   counts `farm.counts['collected:<good>']`. In the nudge, each building with products waiting is **one to collect**,
   and the map's Ready badge shows on it.
5. **Buying and building:**
   - the shop's sheet gains **Animals** (Chicken 800g from chapter 2; Cow 3,000g, Goat 2,200g and Sheep 2,600g once the
     Barn is built; Alpaca 4,800g once the Barn is built and at FR5; ducks and cashmere goats aren't sold) and **Feed**
     (Chicken Feed 10g once the Coop stands, Fodder 20g once the Barn does). `ShopLine` gains its kind; a bought animal
     joins its building at 0 affection, refused **"The Coop is full."** without room; its id is `<kind>-<n>`, worded
     "Chicken 2";
   - **the Barn** is built at its quick look, **Build · 8,000g**, from FR3 once chapter 2 has opened. CS13's "after
     chapter 2" is read as "once chapter 2 has opened", as the built map's lock already has it;
   - **upgrades** (Coop 2–3, Barn 2–4) are bought at the building's quick look and take effect at once (unlike the
     Dorm, nothing waits for a bed); `farmRankOpens` lists them, so the rank's sheet and the morning name them.
6. **The two free chickens and the Coop come with chapter 2's opening scene** (decision 12).
7. **The ranch's goods** are a family `ranch`: seven raw (the products) and three refined (the cloths, each with its
   fleece as input, **two** to one, ×1.5 their price). They're Diary entries (5 points each) but **form no collection
   row**: CS38's rows are "a family's ten grades", and the ranch has none, so `DIARY_ROWS` leaves it out. The
   Warehouse gets a **Ranch** tab. Winter's demand lifts the three cloths.
8. **Feed is a Warehouse item with no bin price:** a family `feed` (Chicken Feed, Fodder) held at ★1, sold at the shop,
   refused by the bin (`no-price`, as seeds are), giftable and disliked, and not a Diary entry.
9. **The Mill's Cloth** is a station job `cloth`, multi-day: `{ kind: 'cloth', item: '<cloth>@<stars>', count }`
   (cloth to make, 1 to 50), two fleece of the cloth's kind at the same stars each, taken at the start. A day spins
   round(8 × farming rank × talent × well fed) fleece into half as many cloth (8 → 4 at Novice D); the job lasts at
   least 3 days on 3 days' batch, and the job sheet offers that and all held. It uses farming's rank (the Mill's
   `PLACE_ACTIVITY`).
10. **The morning (CS5):** Work done gains `{ kind: 'laid', building, items }` ("Coop · 4 eggs to collect", opening
    the Coop), `{ kind: 'animal-hearts', id, hearts }` ("Chicken 2 · 3 hearts") and `{ kind: 'hungry', building,
    animals }` ("Coop · 2 went hungry"); Today's nudges gain `{ kind: 'feed', building, animals }` ("Coop · no feed for
    2 tonight", opening the shop). Strictly parsed: a building with no animals, a count outside 1–16, an unknown
    animal, hearts outside 1–10 and a line twice are refused.
11. **The screens:** one page for both buildings (`/ranch/coop`, `/ranch/barn`): a card per pen (its carer's row, "Hand
    · B · Ranch", her picker on uma-kit's `UmaPicker` sorted by ranch rank, **Stop**), its animals (face, "Chicken 2",
    hearts, a waiting product, "Hungry tonight" when feed is short), **Collect**; the level, "3 of 4" and **Upgrade**;
    **Buy animals** and **Feed** into the shop's sections, with "4 nights of feed held". Quick looks (`/?peek=coop`,
    `/?peek=barn`): a row a pen, Collect, Open, or Build for the Barn. Pips: a pen's carer ringed by her pen's mean
    hearts out of 10, or a free dot. `PLACE_SCREENS` gains both; the page, its rules and the ranch's tables load on
    demand.
12. **The chapters' machinery, made general,** and chapter 2 in it:
    - **Opening gifts:** a chapter may give things when it opens (`Chapter.gifts`: buildings, animals, recipes). They're
      given **when its opening scene is read or skipped** (`readScene`, a player's change), once. This one rule covers a
      save that entered chapter 2 before this packet landed (the owner's, most likely) and a new one alike.
    - **`sceneDue` over chapters:** the start's picks first; then, in order, each chapter's opening scene once the
      chapter is current or past and its scenes are built, and its closing scene the morning after it completes, once
      the summary is put away (open 1, close 1, open 2, close 2 …). `SCENE_IDS` opens to `scene:<n>:open` and
      `scene:<n>:close`; `diary.read` already takes any key.
    - **Chapter 2** (`CHAPTERS[1].goals`, counted from `farm.goals` as F24 copied it the night chapter 1 completed):
      (1) **Own 4 chickens** (chickens in the Coop); (2) **Collect 20 eggs** (`collected:egg` since the chapter); (3) **A
      chicken at 2 hearts** (any chicken at 100 points or more); (4) **Build the Sawmill or the Smokehouse**
      (`buildings`); (5) **Ship 5,000g** (`gold-shipped` since the chapter: "in all" is across the chapter, as every
      chapter counts from its own start). Gifts: the Coop at level 1 and two chickens. Reward: 1,000g, a recruit, 250
      points.
    - **Chapter 3's line** ("Down the Mine", Gus Talbot) says **Soon** until F26.
13. **The scenes** (`story/chapter-2.ts`), original and short, one line to a tap, Umas only in roles (CS41's *your best
    rancher* is new: the highest ranch rank, then talent):
    - **Opening:** Dale Hart's wagon at the Gate with two hens in a crate; he raises a coop by the Fields and settles
      them; feed (Chicken Feed from the shop, one a night each; "a hungry hen lays nothing"); care (a carer a pen of
      four; the same hands day after day; hearts make better eggs); Marta stocks feed; the Mayor reads the goals card.
    - **Closing:** a full coop at dawn; Dale says the farm is ready for a barn; **your newest hand** at the Gate; the
      Mayor mentions Gus Talbot, a retired miner, and the boarded-up Mine; chapter 3 "Soon". The chapter's story item,
      **Dale's cowbell** (F29's `story-cowbell`), shows beside the reward.
14. **Stand-ins until F29:** each animal a disc in its kind's colour with its initial; the four products and two feeds
    the same as tiles; the Coop stays on `meadow`; Dale's bust a lettered disc (F24's `CastBust`); the cowbell a plain
    mark. The web's atlas test allows exactly these until F29's release is pinned.

### Rules that hold (every M5 packet)

- **No original-game content in git:** no outfit or character names in code, tests, docs, commits or pull request
  bodies; names, titles and art come from master data at runtime only; tests use `@luismlorenzana/uma-data/testing`
  fixtures or invented ids. Scenes speak with the original cast (CS41) and name Umas only as runtime roles. Run
  `git status` and the private-content guard before committing.
- **Main JS ≤ 180 KB gzip** (164.0 KB live after F24): new screens, tables, scenes and rules load lazily
  (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **Every save change is a new version** (v4 or later, decision 1's pattern) with its migration and tests;
  `account.updatedAt` never moves in a migration; no server writes a save.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a uma-platform request the main session sends,
  pinned when released.
- **Each minigame is an original game in its genre,** never a recreation of a specific title; its rules are pure and
  tested in `@farm/domain` before any scene draws them (FR22).
- **The farm runs on today's map** (uma-kit's Phaser Hub) until M7; M5's scenes are flat; the HD-2D scenes and
  `kit-farm` are M7's.
- **Nights are seeded** (`draw(uid, day, what, n)`): the same save always gives the same morning.
- **The manual (`docs/game/`) changes in the same commit as each rule;** live blocks through `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short, explanations behind
  a help button.
- **Art:** the first packet built after F25's uma-art release pins it and drops F24's stand-ins; the first after F29's
  pins that; stand-ins until then.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.
- The copied uma-rpg code stays copied, never imported.

### Left to the worker

The modules' layout (a `ranch/` folder is the obvious home); the pages' and the pen cards' drawing; the scenes' lines
within decision 13's beats; the stand-ins' colours; the order of the shop's sections.

## Do

1. **Save v4** (decision 1): the shape, the parse, `migrateToV4`, the boot, the store, `SAVE_VERSION`; the API's backup
   and refusal checked with a v4.
2. **The catalogue** (decisions 7, 8): the ranch's goods with their prices and the cloths' inputs, the feeds, the
   Warehouse's Ranch tab, demand.
3. **The ranch's rules** (decisions 2–5): buildings and levels, buying, pens and carers, `isBusy`, step 3, products and
   collecting, the challenges, step 6's ranch points, the milestone, feed's dislike.
4. **The Mill's Cloth** (decision 9).
5. **The morning's lines** (decision 10) and the nudge (carers have work; products to collect).
6. **The screens** (decision 11) and `PLACE_SCREENS`.
7. **The chapters' machinery and chapter 2** (decisions 12, 13), the scene player reading the new scenes.
8. **Art:** pin F25's and F29's releases if out (decision 14 otherwise).
9. **The manual:** a new [docs/game/ranch.md](../../game/ranch.md) with live blocks (the animals, the buildings, a
   night's affection, the hearts, products' stars, feed) and its row in [the manual's index](../../game/README.md);
   [goals.md](../../game/goals.md) (chapter 2, the scenes, opening gifts, the milestone, "For M5" updated),
   [days.md](../../game/days.md) (step 3 filled, the new lines, the nudge), [gathering.md](../../game/gathering.md)
   (Cloth), [goods.md](../../game/goods.md) (the ranch's goods, feed), [ranks.md](../../game/ranks.md) (the ranch's
   challenges counted), [roster.md](../../game/roster.md) (feed disliked),
   [architecture.md](../../game/architecture.md) (v4, its migration and the pattern).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the size check is ≤ 180 KB gzip (the number in the pull request);
  the private-content guard passes.
- Domain tests:
  - **v4:** a v3 migrates once with `updatedAt` unchanged; a v3 holding a pen or an egg is refused; a v4 round-trips;
    the parse refuses a carer on two pens, a carer off the roster or a tender, more pens than the level holds, and a
    non-ranch good in `ranch.laid`;
  - **affection:** a Novice C carer gives 13, 14, 15, 16, 17, 17 …, and her chicken reaches 2 hearts on night 7, 5 on
    night 25, 10 on night 78; a Skilled A carer's reaches 10 on night 53; no carer −10, hungry −40, never below 0;
    well fed ×1.25; a Brush at tier 2 +3;
  - **products:** a fed chicken lays every night, a sheep every third; a hungry one lays nothing and its count
    waits; 0 hearts is always ★1 and 10 always ★5; over a seeded sample, 5 hearts averages ★3;
  - **feed:** one a night per animal, the newest hungry when short; the bin refuses feed; a feed gift is disliked;
  - **buying:** the Coop's room; the Barn refused before FR3, before chapter 2 or without 8,000g; alpacas from FR5;
    upgrades by FR and gold;
  - **carers:** a carer can't take a job or tend, and a working Uma can't care; a new carer resets the streak; ranch
    points paid; "care 10 days" ranks her up with her points; a 4-heart animal in her care meets Skilled;
  - **cloth:** a Novice D spins 8 Wool into 4 Wool Cloth a day, at the Wool's stars, 3 days for 12; the prices 900g,
    1,380g and 2,100g;
  - **chapter 2:** its goals count from the chapter's start; reading or skipping the opening scene gives the Coop at
    level 1 and two chickens once, and a second read gives nothing; the chapter completes paying 1,000g, a recruit and
    250 points; chapter 3 says Soon; an animal at 10 hearts pays 500g once.
- `pnpm docs:update` leaves every live page unchanged.
- Locally at 390×844 (and 375×667): a dev save at chapter 1's end sees the closing scene, then chapter 2's opening, and
  the Coop holds two hens; buy feed, set a carer, end the day: the morning says "Coop · 2 eggs to collect"; collect;
  buy two chickens; play on to a chicken at 2 hearts; on a dev save at FR3, build the Barn, buy a sheep, collect its
  wool after three nights and start a Cloth job at the Mill; an F24 v3 save migrates once with `updatedAt` unchanged.
  Record the night chapter 2 completed in a dev play from chapter 1's end (not retuned).
- Production, after the merge's deploy: health shows the commit; once the owner has opened the app, a read-only check
  with the scoped gcloud: `saves/{uid}` is v4, its `account.updatedAt` equals `saveBackups/{uid}-v3`'s, and
  `saveRescues` holds nothing new. A stale or wrong date: stop and ask.

## Deliver

On a branch, `feat/f27-ranch`, and a pull request for the main session to merge and deploy (`feat: the ranch and
chapter 2; save v4 (F27)`; `git status` and the private-content guard first). In the same branch: delete this packet,
add a Done row in [the handoff](../README.md) with the pull request, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–14 and anything settled while
building. The main session merges, watches the deploy (`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`)
and adds the run's link and the production read to the Done row.
