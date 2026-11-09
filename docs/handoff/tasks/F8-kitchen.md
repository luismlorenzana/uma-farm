# F8 — The minigame contract and the Kitchen, with the staff meal; chapter 4 (save v6)

**uma-farm · Claude · L · Needs: F26 (chapter 4 follows chapter 3; v6 follows v5), F27 (eggs and milk) · Beside: F27
and F26 for the contract's and the cooking game's rules, which need nothing else (FR22) · Pins: F25's and F29's uma-art
releases if shipped and not yet pinned · Unblocks: F39 (the Cooking Contest), F28 (dishes as supplies) · Milestone M5,
more to do**

Re-scoped from "the Forge's place and minigame" (D20, FR24, CS55): the Forge's merge game is M6's (F36).

## Why

The Kitchen is the farm's first workshop and its first played minigame. A short cooking game turns crops, products and
fish into dishes: to sell at ×1.25 their inputs, to pack for expeditions (F28), to enter in the Cooking Contest (F39),
and for the **staff meal** that makes the crew well fed for one to three days. FR21's contract is written here once, so
the Restaurant's and the Forge's games (F35, F36) reuse it. The night's step 5 and CS6's workshop clause land, and
chapter 4 opens the Kitchen (Rosa Bell).

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS20, CS21, CS22**, CS26 (the Kitchen's quality), CS9 (dishes ×1.25),
  CS19 (the 80 dishes are uma-art's), CS29 (the assistant's 10 points), CS30 (cooking's challenges), CS31 (workshop
  yield), CS38 (the best dish score; a Masterwork in each workshop), CS39 (Kitchen 2–5 at FR4, 5, 6, 8), **CS43**
  (chapter 4), CS45 (loved dishes), CS4 (Winter's demand: dishes), CS6, CS7 step 5, CS41 (Rosa Bell), CS53
  (`workshops`), CS55.
- [core-loop.md](../../design/core-loop.md): FC14, FC15, FC34.
- [hd2d-farm.md](../../design/hd2d-farm.md): **FR17, FR18, FR21, FR22**, FR20 (each game an original in its genre), and
  "Notes from drawing the page" #4, #5 and #8; **[the page's Kitchen sketch](../../design/previews/hd2d-farm.html#kitchen)**:
  its rules as built and its pure code (`KITCHEN`, `kNew`, `kStep`, `kTapBurner`, `kResult`, the shared contract above
  them).
- [decisions.md](../../decisions.md): D20, D21 (the Kitchen's cooking game), **D23** (the sketch measured: over 8 seeds
  a careful player averages 92, a casual 73, a first try 34, nothing 0; one assistant post), D24 #13, D25 (FC15's days),
  D31 (d: well fed's quarter day through uma-work's `speedUp`), D32 (`madePrice`; demand), D35 (cooking's challenges,
  `rankPoints`), D37 (m: loved waits for the dishes), D38, and F27's decisions 1 (the version pattern) and 12 (the
  chapters' machinery).
- The manual: [days.md](../../game/days.md) (well fed, the nudge, the night), [goods.md](../../game/goods.md),
  [gathering.md](../../game/gathering.md) (well fed in a haul), [fields.md](../../game/fields.md) (well fed in growth),
  [ranks.md](../../game/ranks.md), [roster.md](../../game/roster.md) (gifts), [goals.md](../../game/goals.md).
- Code: `save/v3.ts` (`workshops`, `PlayInProgress`, `WORKSHOP_IDS`, `isDishId`, `DISH_FAMILIES`), `goods/ids.ts`,
  `goods/prices.ts` (`madePrice`), `goods/stars.ts` (`quality`, `inputsQuality`), `night/end-day.ts`
  (`resetWorkshops`, `countWellFed`, the well-fed `speedUp`), `night/nudge.ts`, `night/summary.ts`,
  `farm/rank-rules.ts`, `farm/talents.ts`, `farm/visitors.ts` (`giftTaste`), `fields/fields.ts` (`isBusy`),
  `save/shop.ts`, `farm/diary.ts`, `farm/milestones.ts`, `story/`; on the web `loop/` (the shell's sheets, the scene
  player as the model for a full-screen sheet), `scripts/check-size.mjs`.

## Decisions made

### From the spec

- **What every workshop shares (CS20, FR21):** one play a day (FC34), reset at the night's step 5; **one assistant
  post**, picked when the play starts, her day taken (she holds no slot); a play of **30–90 seconds** on a **seed shown
  before it**; a score of **0–100** into four tiers; **inputs taken at Start and never lost** (the yield never falls
  below the base); **an unfinished play counts as Rough**, no retries; **a practice mode** with no inputs and no yield;
  one thumb in portrait, timing from `pointerdown`.

  | Score | Tier | Yield | Well fed |
  |---|---|---|---|
  | 0–49 | Rough | ×1 (the base) | 1 day |
  | 50–74 | Good | ×1.25 | 1 day |
  | 75–89 | Fine | ×1.5 | 2 days |
  | 90–100 | Masterwork | ×2 | 3 days |

- **The assistant (CS20):** +10% yield a rank (×1.0 Novice … ×1.5 Legend); her rank and talent lift the stars; the
  play pays her **10 rank points** in cooking.
- **The Kitchen (CS21):** level 1 cooks **6** base dishes (chapter 4, free); level 2 **8** (6,000g, FR4); level 3
  **10** (15,000g, FR5); level 4 **12** (35,000g, FR6); level 5 **15** (70,000g, FR8). A play cooks a menu of up to
  **3 recipes**, splitting the base between them; Start takes the inputs for the base; out come
  `round(base × tier × (1 + 0.1 × her cooking rank))` dishes, the extra shared in proportion.
- **Recipes (CS21):** every dish is **2 of its main ingredient + 1 side** and sells at **×1.25 its inputs at ★1**. You
  start with 3 (Carrot Salad, Wheat Bread, Carp Grill); the rest are bought at the shop for **5× the dish's price**, or
  come from requests (M6) and chapter rewards.

  | Dish | Recipe | Main and price ★1, G1 → G10 |
  |---|---|---|
  | Salad (`dish-vegetables-1…10`) | 2 raw vegetables of its grade + 1 any herb | Carrot 190, Potato 175, Cabbage 690, Onion 290, Tomato 215, Bell Pepper 190, Eggplant 275, Asparagus 1240, Golden Carrot 1540, Emperor Pumpkin 1540 |
  | Bread (`dish-grains-1…10`) | 2 refined grains of its grade + 1 Egg | Wheat Flour 215, Rolled Oats 215, Pearl Barley 240, Polished Rice 250, Cornmeal 590, Rye Flour 290, Buckwheat Flour 350, Hulled Wild Rice 665, Moonrice Flour 965, Sunwheat Flour 1040 |
  | Tart (`dish-fruits-1…10`) | 2 raw fruits of its grade + 1 any flour | Apple 170, Pear 195, Peach 220, Plum 255, Orange 320, Grape 380, Mango 470, Pomegranate 580, Starpeach 720, Golden Apple 905 |
  | Grill (`dish-fish-1…10`) | 2 raw fish of its grade + 1 any herb | Carp 140, Trout 165, Sardine 200, Mackerel 250, Salmon 315, Sea Bream 400, Eel 490, Tuna 625, Silverfin 790, Rainbow Koi 1015 |
  | Curry (`dish-herbs-spices-1…10`) | 2 raw herbs and spices of its grade + 1 any vegetable | Basil 200, Mint 200, Rosemary 200, Thyme 240, Ginger 590, Peppercorn 340, Cinnamon 400, Saffron 490, Mandrake 1390, Phoenix Pepper 765 |
  | Soup (`dish-mushrooms-1…10`) | 2 raw mushrooms of its grade + 1 Milk | Button Mushroom 215, Shiitake 240, Oyster Mushroom 265, Enoki 300, Chanterelle 350, Porcini 415, Morel 490, Truffle 590, Glowcap 715, King Reishi 890 |
  | Cake (`dish-sweets-1…10`) | 2 refined sweets of its grade + 1 Egg | Honey 200, Cane Sugar 240, Beet Sugar 515, Maple Syrup 325, Chocolate 425, Vanilla Extract 515, Agave Syrup 650, Palm Sugar 815, Fairy Honey 1025, Ambrosia 1300 |
  | Cookies (`dish-nuts-seeds-1…10`) | 2 raw nuts and seeds of its grade + 1 any flour | Peanut 170, Sunflower Seed 270, Sesame 205, Walnut 245, Chestnut 295, Almond 355, Pistachio 430, Macadamia 530, Thundernut 655, Worldseed 830 |

- **The worked play (CS21):** Kitchen level 1, a Hand assistant, 3 Carrot Salads and 3 Carp Grills: Start takes 6
  Carrots, 6 Carp and 6 herbs (870g); the play scores 78, Fine: round(6 × 1.5 × 1.1) = **10 dishes**, 5 of each, worth
  **1,650g** at ★1.
- **Quality (CS26):** the assistant's rank (0.5 × rank) and talent's points, and the inputs' **mean ★ − 1**. Worked: a
  Fine play, inputs averaging ★2, a Hand C cook: Q = 1 + 0.5 + 0.25 = **1.75** (★2 25%, ★3 75%).
- **The staff meal (CS22):** after a Kitchen play, **Serve the staff meal** takes **one dish for every three Umas fed**
  (rounded up; everyone on the farm by default) from that play's dishes. They're **well fed** for 1, 2 or 3 days by the
  play's tier: 1-day jobs make ×1.25 their day's items; longer work gains a quarter day a night (uma-work's
  `acceleratedMs`); +0.25 quality, ×1.25 rank points, ×1.25 affection given; a new meal replaces the old one and never
  stacks; eating together pays bond points (CS44, M6). Worked: 12 Umas, a Fine meal of 4 Salads, two days.
- **Cooking's challenges (CS30):** Hand, assist 5 plays; Skilled, assist a Fine play; Expert, 10 dishes of ★4+;
  Master, a Masterwork; Legend, 1st at a Cooking Contest as the cook (F39).
- **Gifts (CS45):** loved (+60) is the dish kind of her best talent.
- **The Diary (CS38):** each dish an entry; the best dish score a record; a Masterwork in each workshop a milestone
  (500g). **Demand:** dishes in Winter (CS4).
- **Chapter 4, "Something Cooking" (CS43):** opens the Kitchen and 3 recipes (Rosa Bell); goals: cook 3 kinds of dish,
  a Good play or better, serve a staff meal, enter the Cooking Contest; the reward is a recruit, **2,000g** and 250 Farm
  Rank points; the sim finishes it on day 34, the Contest's day. D24 #2 makes the festival goal wait for its feature:
  **F39 pulls the Cooking Contest into M5** so chapter 4 can end.
- **The cast (CS41):** Rosa Bell, the cook who judges the Cooking Contest.

### Decided here (the spec left these open)

1. **Save v6:** the catalogue's 80 dishes (decision 7); `workshops.current` (a play under way) gains `menu` (each
   dish and its share of the base) and `taken` (the inputs taken, by good and stars), so an unfinished play can settle
   as Rough; `workshops.last`, each workshop's last play: `{ day, assistant, score, tier, made, served }` (`made` by
   dish and stars), for the result, the staff meal, F39's entry and step 6's points; the summary's `{ kind: 'workshop',
   workshop }`; the milestone `craft:kitchen` and the eight dish rows (decision 13). `migrateToV6` sets the version,
   `last` to `{}` and refuses a `current` (no earlier version set one). F27's pattern holds.
2. **The contract** in `@farm/domain` (`workshops/contract.ts`), for every workshop: `TIERS`, `tierOf(score)`, the
   yields and the well-fed days; `startPlay` (inputs taken, `current` set, the day's play used), `finishPlay(save,
   events)` and `abandonPlay`; a play's **seed** is `draw(uid, day, '<workshop>:play', 0)` shown as four digits.
   **The score is the domain's replay of the play's tap events against its seed,** so the scene can only draw what the
   rules award. An unfinished play (the app closed mid-play) settles as **Rough** the next time the app opens, or at the
   night's step 5, whichever comes first; there are no retries. **Practice** draws its own seed, takes nothing and saves
   nothing.
3. **The assistant is optional:** a play can start with nobody free (no rank or talent terms, no points). She's an Uma
   on the farm with no running job who isn't tending or caring; once picked, the day is hers (`isBusy`: no job, block or
   pen today), she has work for the nudge, and step 6 pays her 10 cooking points (× her talent, well fed and hearts;
   nobody's favourite) from `workshops.last`. Challenge events: `{ kind: 'play', grade }` for her and `{ kind: 'dishes',
   stars }` for each dish made.
4. **The cooking game is the hd2d page's sketch, its rules and numbers kept as D23 measured them,** made pure in
   `workshops/kitchen.ts`: three burners and a pass; **60 seconds**; tickets on the seed every 2.4–3.8 s from 0.8 s,
   the last 12 s before the end; tap an empty burner to start the next part of the first ticket (tap a ticket to put it
   first); a part's ring fills, then a **1-second green window**: tapped in its middle 0.3 s **Perfect +4**, elsewhere
   in the green **Good +2**, too early **raw −1** (cook it again), past it **burnt −3** with 0.7 s of smoke; a ticket
   whose parts are all on the pass is **served, +3 a part**; one whose timer runs out leaves, **late −4**; the score is
   the points ÷ the seed's most (7 a part) × 100, held to 0–100. **The farm's dressing:** each ticket is one of the
   menu's dishes (drawn by the seed in the menu's shares), its parts its ingredients: a three-part ticket (half of them,
   18 s) is the main, the main and the side, cooking 3.2, 2.6 and 2.0 s; a two-part one (13 s) is the main and the
   side, 2.4 and 1.8 s, the sketch's own times, so a menu never makes the game harder or easier. It's an original
   time-management cooking game, not a recreation of any title.
5. **The menu sheet:** up to 3 known recipes and their shares of the base (steppers, even by default); each ingredient
   at one good and one star from the Warehouse, defaulting to the star held most (ties: the lower). The sides read as
   written: "any herb" is any raw herb or spice (Basil and Mint included), "any vegetable" any raw vegetable, "any
   flour" any refined grain; **"Egg" is Egg and "Milk" is Milk** (a Duck Egg or Goat Milk doesn't count). Refusals in
   the loop's words ("Short 2 Carp."). The assistant's picker ("Hand · B · Cooking"); the seed; **Start · 6 dishes**,
   and **Practice** beside it.
6. **What a play makes:** `round(base × tier × (1 + 0.1 × rank))` dishes, the extra over the base split by largest
   remainder (ties to the menu's order); each dish's stars drawn `draw(uid, day, 'kitchen:dish', n)` from Q = her rank's
   and talent's points + the mean input ★ − 1 (no assistant: the inputs' term alone). Into the Warehouse;
   `farm.counts['cooked:<dish>']`; `workshops.best.kitchen` keeps the best score (CS38's record).
7. **Dish prices:** each is `madePrice` of its two mains at ★1 and its side at a fixed value CS21's table implies but
   never names: **any herb 30g, any vegetable 70g, any flour 65g, Egg 50g, Milk 110g.** These five reproduce all 80 of
   CS21's prices (a test checks each), so a dish's price doesn't depend on which herb went in. The catalogue gains the
   80 dishes in eight families (`dish-vegetables` … `dish-nuts-seeds`, named Salads, Breads, Tarts, Grills, Curries,
   Soups, Cakes, Cookies), and the Warehouse a **Dishes** tab.
8. **Recipes:** `workshops.recipes` gets the three when chapter 4's opening scene is read (decision 15); the shop's
   **Recipes** section sells the other 77 at 5× the dish's price (Potato Salad 875g) once the Kitchen stands; a recipe
   is known for good.
9. **Levels:** the Kitchen's quick look and page offer **Upgrade · 6,000g** at FR4 and so on, in effect at once;
   `farmRankOpens` lists Kitchen 2–5.
10. **The staff meal:** after today's Kitchen play and until the night, **Serve the staff meal** takes ⌈fed ÷ 3⌉
    dishes from what that play made and the Warehouse still holds (the cheapest first; the player may pick), for
    everyone on the farm by default (a checklist to leave some out; Umas away, leaving or visiting aren't fed), once a
    play. Each fed Uma's `wellFed` **becomes** the tier's days, replacing any left. What it does is already built:
    F22's ×1.25 items **for the days of a job planned while she's well fed**, F18's quarter day a night for multi-day
    work, F20's ×1.25 tended growth, F19's +0.25 quality, F21's ×1.25 rank points, and F27's ×1.25 affection. **So
    serve before sending the crew out:** a job started earlier that day was planned without it (the help says so). The
    meal's bond points wait for M6 (F33). `farm.counts['meals']`.
11. **The night and the nudge:** step 5's `resetWorkshops` settles an unfinished play as Rough and closes the day's
    serving; the next day's play opens (`played` < the day). The nudge (CS6): a built workshop not played today, with
    the inputs for one dish of a known recipe, keeps End the day from "All set" and counts one in the badge. Today's
    nudges gain `{ kind: 'workshop', workshop }` ("Kitchen · ready to play", opening the Kitchen) on a morning it has
    those inputs; strictly parsed.
12. **Loved gifts read through the stat** (CS45, D37 m), so every dish kind is someone's: Stamina (farming) Salads;
    Guts (the ranch) Cakes; Power (mining, forging) Curries and Breads; Wit (fishing, cooking) Grills and Tarts; Speed
    (foraging, serving) Soups and Cookies. Her best talent's stat picks the two. (Read literally, CS45 never fires for
    Tarts, Cookies or Breads, since F21's tie-break makes fishing, foraging and mining win their shared stats, and
    expeditions' "any dish ★4+" never applies, since expeditions aren't in her best talent.)
13. **The Diary:** each dish an entry (5 points); **eight rows**, `row:dish-<kind>`, each kind's ten grades shipped
    once, 500g once; the milestone **`craft:kitchen`**, the Kitchen's first Masterwork, 500g.
14. **The screens:**
    - the Kitchen's quick look (`/?peek=kitchen`): today's play (**Play**, or "Played · Fine 78"), **Serve the staff
      meal**, the level; and **Practice from M5's landing, even while the Kitchen is locked**, so the game can be tried
      (and the owner can play it) before chapter 4;
    - `/kitchen`: the level and Upgrade, the recipes known (and Buy more, into the shop), the menu sheet, the last
      result;
    - **the play** (`/kitchen/play`, a full-screen sheet over the bars): the seed, the ticket rail, three burners, the
      pass, the score and ✕ (stop, counting Rough, after a one-line confirm). DOM and SVG on `requestAnimationFrame`,
      no Phaser; tap times from `pointerdown`, relative to the play's start; then the result: the score, the tier, the
      dishes by star, **Serve the staff meal · 4 dishes · 12 Umas, 2 days**, and Done. The play and its sheet are their
      own lazy chunk.
15. **Chapter 4** (`CHAPTERS[3]`): (1) **Cook 3 kinds of dish** (kinds with `cooked:<dish>` since the chapter); (2)
    **A Good play or better** (`farm.counts['plays:good']` since the chapter, Good or better); (3) **Serve a staff
    meal** (`meals` since the chapter); (4) **Enter the Cooking Contest** (`farm.festivals` holds a Cooking Contest
    entry since the chapter opened: F39 makes it; until then the goal reads "Autumn 10 · Soon"). **Opening gifts:** the
    Kitchen at level 1 and the three recipes. Reward: 2,000g, a recruit, 250 points. **Chapter 5's line** ("Beyond the
    Hills", Juno Park) says **Soon** until F28.
16. **The scenes** (`story/chapter-4.ts`), original and short, Umas in roles (*your best cook*):
    - **Opening:** Rosa Bell, the town's cook, carries a crate of pans into the old farm kitchen; three recipe cards;
      how a ticket works; the staff meal ("a fed crew works faster: serve it before they head out"); the Cooking Contest
      on Autumn 10, which she judges; the goals card.
    - **Closing** (after the Contest): Rosa's verdict; **your newest hand** at the Gate; Juno Park's post at the town
      edge and the hills beyond (chapter 5 "Soon"). The story item, **Rosa's recipe card** (F29's
      `story-recipe-card`), shows beside the reward.
17. **Stand-ins until F29:** Rosa's bust a lettered disc; the recipe card a plain mark. The Kitchen (`kitchen`) and the
    dishes (`dishes` atlas) are uma-art's already.
18. **The owner's play** (M5's "the workshops' look and a play"): after the deploy, ask in one line: "The Kitchen's
    game is live: open the farm, tap the Kitchen, tap Practice, and tell me how it plays." The answer goes in the
    D-decision; a change it asks for is a follow-up packet.

### Rules that hold (every M5 packet)

- **No original-game content in git:** no outfit or character names in code, tests, docs, commits or pull request
  bodies; names, titles and art come from master data at runtime only; tests use `@luismlorenzana/uma-data/testing`
  fixtures or invented ids. Scenes speak with the original cast (CS41) and name Umas only as runtime roles. Run
  `git status` and the private-content guard before committing.
- **Main JS ≤ 180 KB gzip** (164.0 KB live after F24): new screens, tables, scenes and rules load lazily
  (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **Every save change is a new version** (v4 or later, F27's pattern) with its migration and tests;
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

The modules' layout (a `workshops/` folder: the contract, the Kitchen's game, recipes, the meal); the play's drawing
within the sketch's layout (tickets on top, burners in the middle, the pass at the thumb); the menu sheet's drawing; the
scenes' lines within decision 16's beats. **If the bots' scores (Done when) fall outside their bands, the dressing's
cook times go back to the sketch's per ticket and the change is logged;** the sketch's points and timings aren't retuned
without the owner.

## Do

1. **The contract and the cooking game's rules first** (decisions 2, 4; FR22), with their tests and bots, before any
   scene. These can start beside F27 and F26.
2. **Save v6** (decision 1).
3. **The catalogue's dishes** (decision 7), recipes (decision 8), levels (decision 9).
4. **The Kitchen's rules:** the menu (decision 5), a play's lifecycle, the assistant (decision 3), what a play makes
   (decision 6), the staff meal (decision 10), step 5 and step 6, the nudge and the morning's line (decision 11), loved
   gifts (decision 12), the Diary (decision 13).
5. **The screens** (decision 14): the quick look, `/kitchen`, the play, the result.
6. **Chapter 4 and its scenes** (decisions 15, 16).
7. **Art:** pin F25's and F29's releases if out (decision 17 otherwise).
8. **The manual:** a new [docs/game/kitchen.md](../../game/kitchen.md) with live blocks (the contract's tiers, the
   Kitchen's levels, the 80 recipes and their prices, the cooking game's rules and points, the staff meal's days and
   effects, loved dishes by stat) and its row in [the manual's index](../../game/README.md);
   [days.md](../../game/days.md) (step 5 filled, the workshop nudge, the new line, well fed set by the meal),
   [goods.md](../../game/goods.md) (dishes), [ranks.md](../../game/ranks.md) (cooking's challenges counted),
   [roster.md](../../game/roster.md) (loved dishes), [goals.md](../../game/goals.md) (chapter 4, its scenes, the
   Kitchen's milestone and rows), [architecture.md](../../game/architecture.md) (v6).
9. **The owner's play** (decision 18), after the deploy.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the size check is ≤ 180 KB gzip (the number in the pull request);
  the private-content guard passes.
- Domain tests:
  - **the contract:** the tiers at 49/50, 74/75, 89/90; the yield never below the base; one play a day; an unfinished
    play settles Rough with its inputs gone and its base made; Practice changes nothing;
  - **the game:** the same seed and taps always score the same; no taps scores 0; a seed's most is 7 a part; Perfect,
    Good, raw, burnt, served and late each score as decision 4; over 8 seeds a **careful bot** (pulls in the green's
    middle, keeps three burners busy) averages **≥ 85** and a **casual bot** (pulls late in the green, two burners)
    **60–80**, close to D23's 92 and 73;
  - **the worked play:** level 1, a Hand assistant, 3 Salads and 3 Grills, Fine 78: 870g in, 10 dishes, 5 of each,
    1,650g at ★1; the worked stars (inputs ★2, a Hand C cook: Q 1.75);
  - **prices:** all 80 dishes match CS21's table; Potato Salad's recipe costs 875g;
  - **the meal:** 12 Umas eat 4 dishes; a Fine meal sets 2 days and replaces a 3-day one; served once a play; a 1-day
    forage planned after the meal makes ×1.25, one planned before doesn't;
  - **the assistant:** can't take a job after the play; 10 cooking points that night; "assist 5 plays" ranks her to
    Hand; ten ★4+ dishes meet Expert;
  - **gifts:** a Wit Uma loves Grills and Tarts; feed stays disliked;
  - **v6:** a v5 migrates with `updatedAt` unchanged; a v5 holding a dish is refused; a v6 round-trips;
  - **chapter 4:** reading its opening scene gives the Kitchen at level 1 and three recipes once; goals 1–3 count from
    the chapter's start; goal 4 waits for a Contest entry; chapter 5 says Soon.
- `pnpm docs:update` leaves every live page unchanged.
- Locally at 390×844 (and the play at 375×667): Practice on a locked Kitchen; a dev save at chapter 3's end sees its
  closing scene, then chapter 4's opening; a menu of 3 Salads and 3 Grills with an assistant; a play; the result;
  Serve the staff meal; the next morning's "Kitchen · ready to play"; a 1-day forage planned after a meal brings ×1.25;
  buy a recipe; upgrade on a dev save at FR4; quit a play mid-way and reopen: it settled Rough.
- Production, after the merge's deploy: health shows the commit; once the owner has opened the app, a read-only check:
  `saves/{uid}` is v6, its `account.updatedAt` equals `saveBackups/{uid}-v5`'s, and `saveRescues` holds nothing new (a
  stale or wrong date: stop and ask); the owner's word on the Kitchen's game (decision 18).

## Deliver

On a branch, `feat/f8-kitchen`, and a pull request for the main session to merge and deploy (`feat: the minigame
contract and the Kitchen, chapter 4; save v6 (F8)`; `git status` and the private-content guard first). In the same
branch: delete this packet, add a Done row in [the handoff](../README.md) with the pull request, and log the packet's
D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–18 and the
bots' averages. The main session merges, watches the deploy (`gh run watch <id> -R luismlorenzana/uma-farm
--exit-status`), asks the owner for the play, and adds the run's link, the production read and the owner's word to the
Done row.
