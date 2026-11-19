# The road to a full game

**Start here.** This page says what the farm is, where it stands, what "a full game" means for it, and the phases that
get it there. How the game works today is in [game-mechanics.md](game-mechanics.md), the farm's progression in [the
farm's progress](game-mechanics.md#the-farms-progress). How it's built is in
[technical/architecture.md](technical/architecture.md), and the cloud in
[technical/infrastructure.md](technical/infrastructure.md). The page view is [pages/roadmap.html](pages/roadmap.html).

## What this game is

- **Personal, never public.** It's the owner's own game, on the owner's iPhone, reachable only with the owner's Google
  account. Nothing here plans for other players, stores or distribution.
- **The owner's real game, built up in place.** The deployed site is the game the owner plays, never a sandbox: no
  testing tools, cheats, jump-ahead shortcuts or debug panels. Each new piece lands in the game itself, long paths are
  checked by the domain's simulations and local runs, and the owner only plays.
- **The farm is kept.** Save v5 is the farm the owner plays and keeps. A later change grows v5 in place, or migrates it:
  no more start-overs. The server keeps older saves in `saveBackups`.
- **Built whole, played live.** Every system plays from day one. Where the story hasn't reached yet, the default story
  plays, and where the art hasn't, the blank bust. The story arrives over time in packs, and each pack replaces the
  default piece by piece. No pack has to be complete.
- **The story is free.** The story session builds the world, the backgrounds and the characters however it wants. Much
  of it may never appear in the game; it informs the dialogue that does. The game asks the story for nothing it can't
  play without ([how the story reaches the game](story-pack.md#how-the-story-reaches-the-game)).
- **No global chapters, no farm-wide story.** Each Uma's story is hers, in her own chapters, from the day you meet her to
  married life.
- **Your day is precious.** A day is ten actions, and the farm is worked by hand at first. As the Umas you invite to
  work take the farm's tasks over, your own day turns to the people.
- **The farm grows by what you earn and grow.** The Farm Rank, from income and farmed goods, says what you may build,
  and you build it with gold and goods, or on a loan from the mayor's office. What you build costs upkeep each night, so
  the farm has to pay its way. The homestead grows with your life with the Umas: the *n*-th wedding opens house *n*.
- **A lean start, then the town.** You name your farmer, read a few lines, and you're on the farm. Every Uma lives in
  town from day one, and you meet whoever you choose by introducing yourself there. Nobody comes to the Gate on her own.

## Where we are

The owner's rework (2026-11-14, F74–F85) is all in. Each row links to how it plays.

| Part | State | What it is |
|---|---|---|
| **Landscape** | **Deployed** | The game is played sideways: a thin bar on top (the date, the actions left, the gold, End the day, the Menu), a rail down the left (Farm · Town · People · Book · Diary), sheets as side panels, scenes laid out sideways, and a "Turn your phone sideways" card held upright ([the frame](game-mechanics.md#the-frame-landscape)) |
| **A day of ten actions, and the tile farm** | **Deployed** (save v5) | Home is the tile farm: the field's sign opens the field's own screen, full screen, a plot of 40 tiles a page, cleared, tilled, planted, watered daily and harvested by hand; a forage, a chop or a catch at the woods' and the pond's edge; a station's loads, one a level; a crate shipped; going into town. Each takes an action, and the night settles the day ([a day](game-mechanics.md#a-day-ten-actions), [Home](game-mechanics.md#home-the-farm-map), [the field's screen](game-mechanics.md#the-fields-screen)) |
| **The field's plots** | **Built** (F89, F91) | The field is plots of 8 × 5, a page each: plot 1 is the field the farm always had, and up to seven more are cleared one a Farm Rank from 3 to 9 (2,500g to 50,000g and an action), wild, with no upkeep. Farmhands' field tasks name their plot and rows ([the field's plots](game-mechanics.md#the-fields-plots)) |
| **Work at scale** | **Built** (F91, F95) | A station's level is a load a day (levels 2–5 bought at the station from Farm Rank 3 to 6); each forest area, fishing spot and dig gives four full hauls a day, then thin ones; a good shipped past a crate of 50 eases its price for a few days. Simulated at 10, 20 and 50 Umas on their farm days: two thirds of them on the farm a day, all in real jobs with real work waiting, 50 included ([the farm at scale](game-mechanics.md#the-farm-at-scale-10-20-and-50-umas)) |
| **Roster-run production** | **Deployed** (F99) | The Umas can tend 51 seasonal crops and orchards, collect graded animal products, land graded fish and run processing orders. Exact-grade discoveries record what the farm has produced ([the catalogue](game-mechanics.md#the-catalogue)). |
| **The farm's places** | **Deployed** | The Fields, the forest and the Fishery, the Mill, the Sawmill and the Smokehouse, goods and the bin, talents and ranks, the Farm Rank. The farm grows by building: the Farm Rank offers each place, built with gold and goods; the Dock and the Boat open the sea; weddings open houses; the Diary's projects ([the farm's progress](game-mechanics.md#the-farms-progress)) |
| **The ranch and the mine** | **Deployed** | The Coop and the Barn, with seven kinds of animal bought at the rancher's in town, fed from the silo and cared for, their goods starred by their hearts; the Mine and the Quarry, thirty floors each, a face at a time; the Smelter and the Cutter ([the ranch](game-mechanics.md#the-ranch), [the Mine and the Quarry](game-mechanics.md#the-mine-and-the-quarry)) |
| **Upkeep and loans** | **Built** (F95) | Each night's upkeep for what's built and the spouses who live on the farm (a farmhand's cost is her meals on her farm days; no Dorm beds); short of it, a warning, then half pace for the farmhands until it's paid. The mayor's office lends toward a build, repaid from each night's income ([upkeep and loans](game-mechanics.md#upkeep-and-loans)) |
| **Food** | **Built** (F90, F92) | Everyone who eats on the farm eats twice a night, from the pantry first; what it's short is takeout, 15g a meal, charged with the upkeep from the first night. The farmer cooks a batch in the farmhouse kitchen (six meals from two goods, 90g of takeout saved), plain or **at the stove**, a 30-second cooking game (6, 8, 9 or 12 meals by its tier); a household meal cooks one too, and a farmhand on Cook cooks for everyone, 6 to 12 meals a batch by her Cooking; a ★2+ meal leaves an Uma well fed ([food](game-mechanics.md#food), [the stove](game-mechanics.md#the-stove-the-cooking-game)) |
| **The Kitchen** | **Deployed** (F92, F93, F98) | From Farm Rank 3, cook up to three recipes in one daily stove play with an optional Uma assistant. The Kitchen cooks its original 80 recipes and any Restaurant recipes learned. The staff meal takes one dish per three mouths. **The Cooking Contest** on Autumn 10 takes three actions and awards gold and Farm Rank points ([the Kitchen](game-mechanics.md#the-kitchen), [the Cooking Contest](game-mechanics.md#the-cooking-contest)). |
| **The calendar** | **Deployed** | The bar's date opens the year on one screen: its festivals, the story's days, birthdays, anniversaries and the faces of the Umas with an event each day. Special days add actions for events, and the occasion scenes play on their days ([the calendar](game-mechanics.md#the-calendar-screen)) |
| **The town** | **Built** (F95) | A map you walk around: who's at each place now (each Uma's fixed schedule: the story's home, job and routine, else her favourite spot every third day), the town's people at their posts, and her menu. You meet her by introducing yourself; there's no welcome week. Everyone you meet lives there until she marries you, and a farmhand is there on her town days ([the town](game-mechanics.md#the-town), [meeting her](game-mechanics.md#meeting-her)) |
| **The launch cast** | **Built** (F96) | The game's Umas are the Uma Ranker's Tier 1–5, 50 of them; the story's other Umas wait for a release pack, and the town's people keep their posts ([the launch cast](game-mechanics.md#the-launch-cast)) |
| **The Uma loop** | **Built** (F95) | Acquaintance, friend, farmhand, sweetheart, engaged, married: talks and gifts, hangouts and dates at two actions, Dinner in town and A night in, the ring and the wedding, the wedding night and moving in (only a spouse lives on the farm, in her room; the Dorm is retired), then married life's meals and the night's companion, who greets you in the morning. Her whole romance plays in her own chapters: hearts, heart events and plays, perks, houses and bonds ([the Uma loop](game-mechanics.md#the-uma-loop), [her chapters](game-mechanics.md#her-chapters)) |
| **Farmhands** | **Built** (F95) | A friend invited to work comes on her farm days, the days her town life leaves free, and gives the farm 3 actions (more settled in, married and well fed) on the tasks you set on the Book's work board, overnight, eating her two meals there; on her town days she's in town and costs nothing. Each task's aptitude starts from her talent and rises with practice, for more goods, better stars and tricks ([farmhands](game-mechanics.md#farmhands)) |
| **The dialogue engine** | **Deployed** | Every scene on one engine: her portrait in the moment's outfit, her face changing line by line through 22 expressions. Twelve Umas have their portraits and illustrations ([the dialogue engine](game-mechanics.md#the-dialogue-engine)) |
| **The default Uma** | **Deployed** | Every Uma plays whole before her story and art land: the default story, from meeting her to married life, and the blank bust, with a face for every expression. Hers replaces each piece the moment it lands ([what plays without the story](game-mechanics.md#what-plays-without-the-story)) |
| **Illustrations and the gallery** | **Deployed** | Her big moments open onto her illustration, full screen: meeting her, a summer date at the shore, the confession and her yes, the wedding, the wedding night, a night in and the morning after. Each one seen stays in the gallery on her profile. Twelve Umas have all nine ([her illustrations](game-mechanics.md#her-illustrations)) |
| **The pacing** | **Checked by simulation** | The domain plays whole years on the game's rules: the farmer alone pays his way and his takeout in the first year, two farmhands pay their upkeep many times over and a cook among them feeds the farm, two years with the Coop and the Mine never run short, and four years at 10, 20 and 50 Umas show who holds a real job ([the pacing](game-mechanics.md#the-pacing)) |
| **The story** | **Being written** | By the story session, read in the Farm Story Sandbox and shipped with one command at the end of each session. Tier 1's ten are complete and live (release 8, 2026-11-15), and the game plays everything it writes, read by id: every occasion (each festival's day and night, her birthday, her anniversary, the story's days), greetings, small talk and gift lines ([occasion scenes](game-mechanics.md#occasion-scenes), [talk that knows the day](game-mechanics.md#talk-that-knows-the-day)). The pack is open: every part optional, any number of characters, notes instead of blocks, and any pack releases. [The story pack](story-pack.md) says how it reaches the game and lists what the game reads |
| **Art** | **Mixed** | The map's buildings, the items and the marks are uma-art's. The Umas' faces and busts on cards and lists are master data's, and so are twelve Umas' dialogue portraits and nine illustrations each, from Uma Character Art's Farm Life. Every other Uma plays scenes on the blank bust. [The art brief](design/her-look.md#the-art-brief) says what's drawn next |
| **The HD-2D farm** | **Retired** | The tile farm is Home. The portrait preview, its stage and its kit are gone; an HD-2D look may come back when uma-platform's look path is ready |
| **Expeditions** | **Built** (F97) | The town post opens at Farm Rank 7. Farmhands take supplies to one of seven regions and return with loot, rank points and bonds. The post keeps a return log ([expeditions](game-mechanics.md#expeditions)). |
| **The Restaurant** | **Deployed** (F98) | From Farm Rank 7, clear eight stages to open 120 recipes. Learn each through exact-grade production. Sell the dishes, cook with them or save them for meals ([the Restaurant](game-mechanics.md#the-restaurant)). |
| **Sound** | **Deferred** | Music and sound effects are outside the active roadmap. |
| **Safety nets** | **Partial** | The save syncs with rescues and backups. Error reporting and restore checks are open. The browser playthrough in CI is deferred. |
| **Parcels to the other games** | **Parked** | The farm sending items to uma-quest, uma-rpg and uma-racer comes after the farm's own game |

## The finish line

The farm is a full game when all eight of these hold:

1. **One build, one look, no testing tools.** No build flags, no preview switch, no cheats or debug panels. The tile
   farm is Home, and the HD-2D farm is retired. *This holds today.*
2. **Everything live, filled by the story over time.** Every system plays with the default story and the blank bust,
   and each story pack and each Uma's art replace what they bring. *This holds today.*
3. **The town of everyone.** Every Uma lives in town, and you meet whoever you choose by introducing yourself. *This
   holds today.*
4. **Each Uma's story to its end, and the farm built out.** Her chapters play from meeting her to married life, its meals
   and the night's companion. Every place can be built, and the homestead fills with houses. The game keeps going:
   years, festivals, the household, records.
5. **Every active place works.** The ranch, the Mine and Quarry, the Kitchen, the sea, expeditions and the Restaurant are
   in. The four [Festival ground contests](game-mechanics.md#festival-contests) are complete.
6. **Real art everywhere.** Every Uma's portraits and illustrations, finished frames, and farm-work animations.
7. **It feels finished.** A quick start, places that explain themselves the first time, and pacing proven by simulation
   and by your play.
8. **It's safe and steady.** The farm's save grows in place, with a tested restore and error reports that reach us.

## The phases

```text
Phase 0  Clean slate                       ── done
Phase 1  One game, built around the Umas   ── done: one build on v5, the farm by building, the lean start, the town,
                                              her chapters, and the rework (landscape, a day of actions, the Uma loop,
                                              farmhands, upkeep, the calendar, the ranch and the mine)
Phase 2  The whole farm                    ── festivals and the long game
Phase 3  Feel and polish                   ── animation, first times, balance, speed, painted maps
Phase 4  Steady                            ── error reports, save safety, releases
Later    Release packs                     ── sets of Umas after the launch cast (the Ranker's Tier 1–5)
Later    Parcels to the other games        ── parked until the farm's own game is done
```

Phase 2 continues with the long game. The sea and expeditions (F97), roster-run production (F99), the Restaurant
(F98), the Festival ground contests (F100) and the Uma Library (F101) are complete. Phase 3 polish and Phase 4
reliability work can proceed alongside Phase 2.

### Phase 0: Clean slate (done)

- The decision log, the finished task packets, the old specs and their pages are deleted. Git keeps them: commit
  `70071ac` is the last that has them all.
- One document says what the game is ([game-mechanics.md](game-mechanics.md)), with its tables generated from the code.
  This roadmap says where it's going.
- Code and files with no purpose are removed, and comments no longer point at deleted documents.

### Phase 1: One game, built around the Umas (done)

**Goal, met:** the deployed game is one game: built whole, played live, its farm growing by building, its people met in
town, each with her own story.

- **The game's frame:** one build, the default story and the blank bust wherever the story and the art haven't reached,
  the farm growing by building, the lean start, the town, meeting her, and [her chapters](game-mechanics.md#her-chapters).
- **The story's way in:** `pnpm story:ship` checks, releases, publishes and backs up in one command, and the morning
  says "New story arrived". `world.json`'s names, history, festivals, places, seasons and Town notes reach the screen
  ([the world in the pack](game-mechanics.md#the-world-in-the-pack)). The World Book, with its "For the game", is read
  on [Uma Story's World page](https://uma-platform.web.app/story/farm/world). How it all works is [the story pack's
  first part](story-pack.md#how-the-story-reaches-the-game).
- **The owner's rework (2026-11-14):** a landscape game with a day of actions, a classic farm-life loop on a tile farm,
  Umas who take the farm over and get better at it, a navigable town, a dialogue engine, upkeep and loans, a visible
  calendar, and a default Uma so every character plays fully. **The design is
  [design/game-design.md](design/game-design.md)** ([page](pages/game-design.html)), and all ten of its steps are built
  (F74–F85), with her illustrations and the loose ends. [Where we are](#where-we-are) says what each one is.
- **Her look** folded into the dialogue engine, and the HD-2D farm retired with landscape: the tile farm is Home.

### Phase 2: The whole farm

**Goal:** every place you can build has its full game.

2.1, the ranch, and 2.2, the Mine and the Quarry, came with the rework. **The farm at scale is in** (the owner,
2026-11-15; [the analysis](design/game-design.md#the-farm-at-scale-2026-11-15)): the field's own screen in plots (F89),
food from day one with cooking in batches (F90), and work at scale (F91): up to eight plots, the stations' levels, thin
hauls past four a place a day, and a market that feels a flood. A simulation at 10, 20 and 50 Umas, each on her farm
days, shows two thirds of them on the farm a day, all in real jobs with real work still waiting
([the farm at scale](game-mechanics.md#the-farm-at-scale-10-20-and-50-umas)). The workshops came next, the Kitchen
first (the owner's go, 2026-11-15): **2.3 is done:** its stove, recipes, dishes and staff meal (F92), and the Cooking
Contest on Autumn 10, the first festival you play (F93) ([the Kitchen](game-mechanics.md#the-kitchen),
[the Cooking Contest](game-mechanics.md#the-cooking-contest)). **Before the sea** (the owner, 2026-11-17): the launch cast is
in (F96: the Ranker's Tier 1–5, 50 Umas, [the launch cast](game-mechanics.md#the-launch-cast)), and so are farm days and
home after the wedding (F95: a farmhand works the farm on the days her town life leaves free and eats her meals there;
only a spouse moves in, into a room; the Dorm is retired: [farmhands](game-mechanics.md#farmhands),
[the retired Dorm](game-mechanics.md#the-retired-dorm)). The Dock and Boat open the sea, and the Expedition post sends farmhands out from Farm Rank 7 ([expeditions](game-mechanics.md#expeditions)). **The Uma Library is in** (F101), with one shelf per launch Tier, portrait books, scene replays, discoveries and personal histories ([Uma Library](game-mechanics.md#uma-library)).

| Step | What |
|---|---|
| 2.7 **The long game** | [Town professions and staggered shifts](game-mechanics.md#town-professions-and-the-week) are in. [F102](handoff/tasks/F102-long-game.md) continues with housing, five-spouse celebrations, the Greater Festival, Year 50, Greater Love, wardrobe rotations and True Love duos. |

How each workshop is built:

- **Planned fresh, one at a time,** live from its first day, opened by Farm Rank and its build, with the default story
  where the story hasn't reached.
- **Its art:** the kit's frames and icons drawn in code by Claude; its people drawn by ChatGPT.
- **The save:** v5 grows in place. A new version comes only when a save shape must change in a way old fields can't
  carry, and then with a migration, never a start-over: the farm is kept.

### Phase 3: Feel and polish

| Step | What |
|---|---|
| 3.2 **Animation** | The farm-work animations from the sprite pipeline, and the items' flights |
| 3.3 **First times** | Each new place explains itself the first time you open it |
| 3.5 **Balance** | Simulations of a long run (Farm Rank 10 and a year after) that check the pacing; then your play notes |
| 3.6 **Speed** | A frame budget on your iPhone, a memory cap, and the first load's size |
| 3.7 **Painted maps** | A painted town map and farm map in landscape, with clickable places as data over the painting, seasons and time of day as tints ([the plan](design/game-design.md#the-maps-2026-11-15)); who paints is the owner's call |

### Phase 4: Steady

| Step | What |
|---|---|
| 4.1 **Error reports** | The app's and the API's errors go to Cloud Logging, with an alert by email (free tier) |
| 4.2 **Save safety** | A save-health check when the app opens, scheduled save exports, and a tested restore |
| 4.4 **Releases** | A version and a short "What's new" in the app, so you see what changed as you play |

### Deferred

These items are outside the active roadmap and the finish criteria.

- **The Forge:** Workshop gameplay and tool upgrades are deferred pending a redesign.
- **Sound:** Music, sound effects, mute and volume.
- **Accessibility:** The planned VoiceOver, motion, and text size pass.
- **Browser playthrough in CI:** A headless browser playing the first days on every push.

### Later: release packs

The game opens with **the launch cast**, the Uma Ranker's Tier 1–5: 50 Umas (F96, the owner, 2026-11-17). Later
releases add sets of Umas as **release packs**. How a pack is defined (by the Ranker's tiers, or by hand), published
(with master data or the story) and opened on a farm already playing is worked out when it starts.

### Later: parcels to the other games

The farm sends items to uma-quest, uma-rpg and uma-racer, one way. It's parked until the farm's own game is done.

## How we work from here

- **[game-mechanics.md](game-mechanics.md) is what the game is.** Every rule change updates it in the same commit, and
  its tables regenerate from the code (`pnpm docs:update`).
- **This roadmap is where the game is going.** A finished step leaves it, and git keeps the history.
- **The real game, never a sandbox.** No testing tools, cheats, jump-ahead shortcuts or debug panels. Long paths are
  checked by the domain's simulations and local runs; you only play.
- **Packets are for the game's work only.** A step gets a packet in [handoff/tasks/](handoff/tasks/) when it's next,
  and the packet is deleted when it ships. [handoff/README.md](handoff/README.md) lists what's open now.
- **The story and the art have standing guides, not packets:** [how the story reaches the
  game](story-pack.md#how-the-story-reaches-the-game), and [the art brief](design/her-look.md#the-art-brief) for the
  next Umas.
- **There's no decision log.** A commit says what changed and why. Your calls go into the roadmap or the mechanics
  document they change.

## Your steps now

- **Play your farm on your phone,** and tell me what feels off ([what's new to notice](handoff/README.md#your-steps)).
- **Keep writing the story** however you like, and ship it ([how the story reaches the
  game](story-pack.md#how-the-story-reaches-the-game)).
