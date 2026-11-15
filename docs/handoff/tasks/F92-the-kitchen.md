# F92 — The Kitchen: the stove, dishes and the staff meal

**uma-farm · Claude · L · Needs: F90, F91 · Unblocks: F93 (the Cooking Contest) · [Roadmap step
2.3](../../roadmap.md#phase-2-the-whole-farm)**

> Cooking gets its game. Every batch the farmer cooks can be played at the stove, from day one, and a good play makes
> more and better meals. The Kitchen, a building from Farm Rank 3, cooks dishes from recipes once a day, and serves
> them as the staff meal: the whole farm fed and well fed from one play.

## Why

The owner (2026-11-15) asked for food you buy as takeout until you cook, "maybe we tie to cooking minigame". F90 built
the food; F92 is the game. Phase 2 starts with the Kitchen (the owner's go, 2026-11-15: "Start the Kitchen").

## Read first

- [Food](../../game-mechanics.md#food) (F90): `farm/food.ts`, the pantry, `cookBatch`'s `lift` (0 until now), the
  homestead's `apps/web/src/loop/Kitchen.tsx`.
- [Well fed](../../game-mechanics.md#well-fed), [farmhands](../../game-mechanics.md#farmhands), [aptitude](../../game-mechanics.md#aptitude),
  [the challenges](../../game-mechanics.md#the-challenges) (cooking's five, waiting on the Kitchen), her perks (a cook's
  "+10% at the Kitchen" and "One more dish on the Kitchen's next play", waiting on it), [her signature
  dish](../../game-mechanics.md#her-signature-dish) (recipes already land in `workshops.recipes`), the wedding's
  reception (`romance/wedding.ts`: dishes by stars, 1–3 days).
- What's already in the save and the code for it: `workshops` (`played`, `current`, `recipes`, `best`),
  `PlayInProgress`, `isDishId`, `DISH_FAMILIES`, `dishName`, `DISH_WORDS`, the Warehouse's Dishes shelf, the
  `kitchen` place (`farm/places.ts`, `game: false`), `PlayGrade`, `workshopYield`.
- **The cooking game's rules are the old sketch's**, measured then over 8 seeds (a careful player 92, a casual 73, a
  first try 34): `git show 70071ac:docs/design/previews/hd2d-farm.html`, the `KITCHEN` block and `kNew`, `kStep`,
  `kTapBurner`, `kResult` (about lines 1031–1110). The old packet `git show 70071ac:docs/handoff/tasks/F8-kitchen.md`
  has the earlier thinking; this packet wins where they differ.

## Decided

### 1. The stove: the cooking game

An original time-management cooking game, the sketch's rules and numbers kept, pure in `@farm/domain`
(`kitchen/stove.ts`) and drawn by the web from the same functions.

| Rule | |
|---|---|
| The board | Three burners, a ticket rail, the pass |
| Tickets | On the play's seed, every 2.4–3.8 s from 0.8 s, the last 12 s before the end. Half are three-part (they wait 18 s), half two-part (13 s) |
| Cooking a part | Tap an empty burner: it starts the next part of the first ticket (tap a ticket to put it first). The ring fills (a three-part ticket's parts 3.2, 2.6 and 2.0 s; a two-part's 2.4 and 1.8 s), then a 1-second green window |
| Pulling it | Tap the burner in the green: its middle 0.3 s (0.35–0.65 s in) **Perfect +4**, the rest **Good +2**. Too early: **raw −1**, cook it again. Past the green: **burnt −3**, and the pan smokes 0.7 s |
| Served | A ticket whose parts are all on the pass: **+3 a part**. A ticket whose wait runs out leaves: **late −4** |
| The score | Points ÷ the seed's most (7 a part) × 100, held to 0–100 |
| The tier | 0–49 **Rough**, 50–74 **Good**, 75–89 **Fine**, 90–100 **Masterwork** |
| What the tier gives | Count ×1, ×1.25, ×1.5, ×2 (rounded half up, never below the base); stars +0, +0, +1, +2 (held to ★5) |
| Length | A batch 30 s; the Kitchen's play 60 s |

- **The dressing:** each ticket names what's cooking and its parts its ingredients (a batch: "Meal", its two goods; a
  dish: its main, its main, its side, or its main and its side). Names never change the timings.
- **The seed** comes from the account, the day and the farm's count of plays (`farm.counts`), so every play differs and
  a replay is the same. Shown as four digits on the play's screen.
- **The score is the domain's:** the web runs the game on the domain's functions, and the finish replays the play's
  taps against its seed, so the screen can only show what the rules award.
- **Start is the commitment:** it spends the action and takes the inputs, and keeps the play in `workshops.current`.
  The end settles it from the taps. ✕ (after a one-line confirm) or leaving mid-play settles it as **Rough** the next
  time the app opens, or at the night's start. No retries, and no practice mode: it's the real game.
- **Landscape, one thumb:** the rail across the top, three burners in the middle, the pass to the right, the score and
  a time bar in the header. Timing from `pointerdown`. DOM and SVG on `requestAnimationFrame`; the game and its screen
  are their own lazy chunk. 44 pt targets.
- **Bots for the tests:** a careful bot (pulls in the green's middle, keeps three burners busy) and a casual bot (pulls
  late in the green, two burners).

### 2. The farmhouse kitchen gets the stove, from day one

Beside **Cook · 1** (the plain batch, as today), **At the stove · 1** plays a 30 s round on the same two goods:

| Tier | Rough | Good | Fine | Masterwork |
|---|---|---|---|---|
| Meals | 6 | 8 | 9 | 12 |
| Their stars | the goods' | the goods' | +1 | +2 |

Never worse than the plain batch. A household meal and a farmhand's Cook stay plain.

### 3. The Kitchen, the building

- **Offered at Farm Rank 3** (was 5) for **3,000g · 40 logs · 20 vegetables** (was 15,000g · 50 planks · 30
  vegetables), its game built. Upkeep as any building. It opens from the farm map and the Book.
- **Levels,** bought at the Kitchen as a station's are (the level the next morning):

  | Level | 1 | 2 | 3 | 4 | 5 |
  |---|---|---|---|---|---|
  | Dishes a play (the base) | 6 | 8 | 10 | 12 | 15 |
  | Opens at, costs | the build | Farm Rank 4, 5,000g | Farm Rank 5, 10,000g | Farm Rank 6, 20,000g | Farm Rank 7, 40,000g |

### 4. Dishes and recipes

The 80 dishes (`dish-<family>-<grade>`, uma-art's dishes atlas, named by `dishName`). A recipe is **two of its main**
(its family's good of its grade, raw or refined) **and one side** (any grade, raw or refined, any stars):

| Dish | Main | Side |
|---|---|---|
| Salad | vegetables | any herb or spice |
| Grill | fish | any herb or spice |
| Soup | mushrooms | any vegetable |
| Curry | herbs and spices | any vegetable |
| Bread | grains | any egg or milk |
| Cake | sweets | any egg or milk |
| Tart | fruits | any grain |
| Cookies | nuts and seeds | any grain |

- **Known when it stands:** Carrot Salad, Carp Grill and Button Mushroom Soup (all from Farm Rank 1's goods).
- **More:** the shop's **Recipes** shelf once the Kitchen stands, each **10 × its main's ★1 price, to 50g** (Carrot
  Salad 600g); her Friendship 4 (her signature dish, as now); a request's recipe extra. A recipe is known for good.
  The recipes are the workshops' first gold sink: all 80 come to a few hundred thousand gold.
- **Dishes don't ship** (as now). They feed the staff meal, are gifts (a cook's and a server's loved "★2+ dish" now
  plays), serve the wedding's reception, and enter the Cooking Contest (F93); later the Restaurant and expeditions.

### 5. The Kitchen's play

- **Once a day, 1 action, 60 s.** The menu: up to three known recipes, sharing the level's base (even by default,
  steppers), each ingredient at one good and one star from the Warehouse (the star held most to start, ties the
  lower). Refusals in the loop's words ("Short 2 Carp.").
- **What it makes:** round(base × tier × the assistant's term) dishes, the extra over the base shared by largest
  remainder (ties to the menu's order). Each dish's stars: its inputs' stars averaged, rounded down, + the tier's lift,
  held to ★5. Into the Warehouse; `farm.counts['cooked:<dish>']`; `workshops.best.kitchen` keeps the best score.
- **The assistant** (optional): a farmhand with an action tonight. One of her actions tonight is the play's (the work
  board shows it); her term is her Cooking aptitude's yield × her cooking rank's `workshopYield` × her perk's +10%; she
  gets a point of Cooking practice and counts toward cooking's challenges (`play` with the tier, `dishes` with the
  stars made). A cook's "One more dish on the Kitchen's next play" adds its dish.
- **The worked play:** level 1, no assistant, 3 Carrot Salads and 3 Carp Grills from ★1 goods, Fine: 9 dishes, ★2.

### 6. The staff meal

- **At the Kitchen, once a day, free:** serves tonight's table from the Warehouse's dishes, **one dish for every three
  mouths** (the farmer and every Uma who eats tonight, as the board stands), picked the most stars first, then the most
  held (or chosen).
- **Those mouths eat it tonight in place of their two meals:** no pantry meals and no takeout for them. Mouths past
  those counted when it was served eat from the pantry.
- **Every Uma who eats it is well fed** for the meal's days, by the lowest stars served, on the reception's table:
  ★1–2 through tomorrow, ★3–4 two days, ★5 three. Never stacking, never shortening one running. One rule for the
  reception and the staff meal.
- The morning says it ("Staff meal · 12 at the table · well fed 2 days"); `farm.counts.meals`.

### 7. The save

v5 grows in place, and nothing moves `updatedAt`:
- `workshops.current` gains what the play is (a batch or the Kitchen's), its seed and length, its menu and the inputs
  taken;
- `workshops.played.kitchen` is the day of its last play;
- `today.staff` is tonight's staff meal (its mouths and days);
- the Kitchen's level is `buildings.kitchen`.

A save from before reads as no play, no staff meal.

### 8. The simulations

The season and scale simulations build the Kitchen when the Farm Rank offers it. From then on their farmer plays it
daily as the casual bot, and serves the staff meal. 10 and 20 must stay fully in real jobs. The mechanics document gets
the new runs: the dishes made, well-fed nights, takeout and the gold.

## Do

1. **The domain:**
   - the stove's rules and bots, with tests;
   - the batch at the stove;
   - the Kitchen's build, levels, recipes, play, assistant and staff meal;
   - the night's settling, and the save's fields;
   - the simulations.
2. **The web:**
   - the stove's lazy screen;
   - the farmhouse kitchen's **At the stove · 1**;
   - the Kitchen's sheet: today's play, the menu, the assistant, the staff meal, the level, and the recipes known and
     to buy;
   - the shop's Recipes;
   - the morning's line, and the Book's food row.
3. **[The game mechanics](../../game-mechanics.md):** a new "The Kitchen" section with live tables (the tiers, the
   levels, the 80 recipes, the stove's rules), and Food, Well fed, the challenges, the perks, the Farm Rank's opens and
   the pacing updated. Run `pnpm docs:update`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the main chunk stays in its budget; the private-content guard passes.
- **Tests:**
  - **the stove:**
    - the tiers at 49/50, 74/75 and 89/90;
    - the same seed and taps always score the same, and no taps scores 0;
    - over 8 seeds the careful bot averages ≥ 85, and the casual bot 60–80;
  - the batch at the stove's 6/8/9/12 and its stars;
  - the worked play;
  - every recipe's inputs exist, and the first three need only Farm Rank 1's goods;
  - **the staff meal:** 12 mouths eat 4 dishes, the pantry is untouched for them, and well fed by stars;
  - the assistant's action and challenges;
  - an unfinished play settles as Rough;
  - an older save loads, and a new one round-trips.
- **Locally, in landscape:**
  - a stove batch played through, and one stopped (Rough);
  - the Kitchen built, its play and the staff meal, on a farm at Farm Rank 3 from the domain's simulation, loaded
    into the local app only (nothing of it ships: no tool, switch or shortcut in the game);
  - the next morning's line.
- Production after the deploy: health shows the commit.
