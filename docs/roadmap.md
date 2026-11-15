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
| **Work at scale** | **Built** (F91) | A station's level is a load a day (levels 2–5 bought at the station from Farm Rank 3 to 6); each forest area, fishing spot and dig gives four full hauls a day, then thin ones; a good shipped past a crate of 50 eases its price for a few days. Simulated at 10, 20 and 50 Umas: 10 and 20 are fully in real jobs; 50 needs Phase 2's employers for about ten ([the farm at scale](game-mechanics.md#the-farm-at-scale-10-20-and-50-umas)) |
| **The farm's places** | **Deployed** | The Fields, the forest and the Fishery, the Mill, the Sawmill and the Smokehouse, goods and the bin, talents and ranks, the Farm Rank. The farm grows by building: the Farm Rank offers each place, built with gold and goods; the Dock and the Boat open the sea; weddings open houses; the Diary's projects ([the farm's progress](game-mechanics.md#the-farms-progress)) |
| **The ranch and the mine** | **Deployed** | The Coop and the Barn, with seven kinds of animal bought at the rancher's in town, fed from the silo and cared for, their goods starred by their hearts; the Mine and the Quarry, thirty floors each, a face at a time; the Smelter and the Cutter ([the ranch](game-mechanics.md#the-ranch), [the Mine and the Quarry](game-mechanics.md#the-mine-and-the-quarry)) |
| **Upkeep and loans** | **Deployed** | Each night's upkeep for what's built, who lives on the farm and who works it; short of it, a warning, then half pace for the farmhands until it's paid. The mayor's office lends toward a build, repaid from each night's income ([upkeep and loans](game-mechanics.md#upkeep-and-loans)) |
| **Food** | **Built** (F90) | Everyone who eats on the farm eats twice a night, from the pantry first; what it's short is takeout, 15g a meal, charged with the upkeep from the first night. The farmer cooks a batch in the farmhouse kitchen (six meals from two goods, 90g of takeout saved), a household meal cooks one too, and a farmhand on Cook cooks for everyone, 6 to 12 meals a batch by her Cooking; a ★2+ meal leaves an Uma well fed ([food](game-mechanics.md#food)) |
| **The calendar** | **Deployed** | The bar's date opens the year on one screen: its festivals, the story's days, birthdays, anniversaries and the faces of the Umas with an event each day. Special days add actions for events, and the occasion scenes play on their days ([the calendar](game-mechanics.md#the-calendar-screen)) |
| **The town** | **Deployed** | A map you walk around: who's at each place now (each Uma's fixed schedule: the story's home, job and routine, else her favourite spot every third day), the town's people at their posts, and her menu. You meet her by introducing yourself; there's no welcome week ([the town](game-mechanics.md#the-town), [meeting her](game-mechanics.md#meeting-her)) |
| **The Uma loop** | **Deployed** | Acquaintance, friend, farmhand, sweetheart, engaged, married: talks and gifts, hangouts and dates at two actions, Dinner in town and A night in, the ring and the wedding, the wedding night and moving in, then married life's meals and the night's companion, who greets you in the morning. Her whole romance plays in her own chapters: hearts, heart events and plays, perks, houses and bonds ([the Uma loop](game-mechanics.md#the-uma-loop), [her chapters](game-mechanics.md#her-chapters)) |
| **Farmhands** | **Deployed** | A friend invited to work does her part-time job, then gives the farm 3 actions a day (more settled in, married and well fed) on the tasks you set on the Book's work board, overnight. Each task's aptitude starts from her talent and rises with practice, for more goods, better stars and tricks ([farmhands](game-mechanics.md#farmhands)) |
| **The dialogue engine** | **Deployed** | Every scene on one engine: her portrait in the moment's outfit, her face changing line by line through 22 expressions. Three Umas have their portraits ([the dialogue engine](game-mechanics.md#the-dialogue-engine)) |
| **The default Uma** | **Deployed** | Every Uma plays whole before her story and art land: the default story, from meeting her to married life, and the blank bust, with a face for every expression. Hers replaces each piece the moment it lands ([what plays without the story](game-mechanics.md#what-plays-without-the-story)) |
| **Illustrations and the gallery** | **Deployed** | Her big moments open onto her illustration, full screen: meeting her, a summer date at the shore, the confession and her yes, the wedding, the wedding night, a night in and the morning after. Each one seen stays in the gallery on her profile. The first Uma has all nine ([her illustrations](game-mechanics.md#her-illustrations)) |
| **The pacing** | **Checked by simulation** | The domain plays whole years on the game's rules: the farmer alone pays his way and his takeout in the first year, two farmhands pay their upkeep many times over and a cook among them feeds the farm, two years with the Coop and the Mine never run short, and four years at 10, 20 and 50 Umas show who holds a real job ([the pacing](game-mechanics.md#the-pacing)) |
| **The story** | **Being written** | By the story session, read in the Farm Story Sandbox and shipped with one command at the end of each session. The pack is open: every part optional, any number of characters, notes instead of blocks, and any pack releases. [The story pack](story-pack.md) says how it reaches the game and lists what the game reads |
| **Art** | **Mixed** | The map's buildings, the items and the marks are uma-art's. The Umas' faces and busts on cards and lists are master data's, and so are three Umas' dialogue portraits and the first Uma's nine illustrations, from Uma Character Art's Farm Life. Every other Uma plays scenes on the blank bust. [The art brief](design/her-look.md#the-art-brief) says what's drawn next |
| **The HD-2D farm** | **Retired** | The tile farm is Home. The portrait preview, its stage and its kit are gone; an HD-2D look may come back when uma-platform's look path is ready |
| **The workshops still to build** | **Not built** | The Kitchen and its cooking game, expeditions, and the Restaurant's and the Forge's games: Phase 2 |
| **Sound** | **None** | No music and no sound effects |
| **Safety nets** | **Partial** | The save syncs with rescues and backups; there's no error reporting and no end-to-end test |
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
5. **Every place works.** The ranch and the Mine and the Quarry are in; the Kitchen with its cooking game, expeditions,
   and the Restaurant's and the Forge's games are still to come.
6. **Real art and sound everywhere.** Every Uma's portraits and illustrations instead of the blank bust, no stand-in
   frames, farm-work animations, music and sound effects.
7. **It feels finished.** A quick start, places that explain themselves the first time, settings (sound, motion, text
   size), every control labelled and easy to tap, and pacing proven by simulation and by your play.
8. **It's safe and steady.** A save that never loses progress, the farm kept and grown in place, error reports that reach
   us, and a full playthrough tested on every push.

## The phases

```text
Phase 0  Clean slate                       ── done
Phase 1  One game, built around the Umas   ── done: one build on v5, the farm by building, the lean start, the town,
                                              her chapters, and the rework (landscape, a day of actions, the Uma loop,
                                              farmhands, upkeep, the calendar, the ranch and the mine)
Phase 2  The whole farm                    ── each workshop's game, the sea, festivals and the long game
Phase 3  Feel and polish                   ── sound, animation, settings, balance, speed
Phase 4  Steady                            ── error reports, save safety, a tested playthrough, releases
```

Phase 2 is next, one workshop at a time, on your go: the Kitchen first. Phase 3 can start once the first workshop plays.
Phase 4's error reports and save safety are small and can come any time.

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
hauls past four a place a day, and a market that feels a flood. A simulation at 10, 20 and 50 Umas shows 10 and 20 fully
in real jobs and 50 running past the farm's jobs by about ten Umas, the work the workshops below bring
([the farm at scale](game-mechanics.md#the-farm-at-scale-10-20-and-50-umas)). Next are the workshops, on the owner's go.

| Step | What |
|---|---|
| 2.3 **The Kitchen** | The cooking game, recipes, the staff meal and well fed; the Cooking Contest as a festival |
| 2.4 **The sea and expeditions** | The dock and the boat's spots; regions, parties and their power, results and loot, the log |
| 2.5 **The Restaurant's and the Forge's games** | The serving game and the merge game |
| 2.6 **The long game** | Years, festivals, the household's milestones, records, and what the town gives back as you meet more of it; and the story's ask for group scenes (a family's, a crew's reunion, a whole group at a festival, from its families and crews), when and what they pay left to the game |

How each workshop is built:

- **Planned fresh, one at a time,** live from its first day, opened by Farm Rank and its build, with the default story
  where the story hasn't reached.
- **Its art:** the kit's frames and icons drawn in code by Claude; its people drawn by ChatGPT.
- **The save:** v5 grows in place. A new version comes only when a save shape must change in a way old fields can't
  carry, and then with a migration, never a start-over: the farm is kept.

### Phase 3: Feel and polish

| Step | What |
|---|---|
| 3.1 **Sound** | Music by season and time of day, and effects for taps, harvests, the bin and heart events. Mute and volume in settings. A small set, cached on first use |
| 3.2 **Animation** | The farm-work animations from the sprite pipeline, and the items' flights |
| 3.3 **First times** | Each new place explains itself the first time you open it |
| 3.4 **Settings and access** | Sound, motion and text size. Every control labelled for VoiceOver, every tap target 44 points |
| 3.5 **Balance** | Simulations of a long run (Farm Rank 10 and a year after) that check the pacing; then your play notes |
| 3.6 **Speed** | A frame budget on your iPhone, a memory cap, and the first load's size |
| 3.7 **Painted maps** | A painted town map and farm map in landscape, with clickable places as data over the painting, seasons and time of day as tints ([the plan](design/game-design.md#the-maps-2026-11-15)); who paints is the owner's call |

### Phase 4: Steady

| Step | What |
|---|---|
| 4.1 **Error reports** | The app's and the API's errors go to Cloud Logging, with an alert by email (free tier) |
| 4.2 **Save safety** | A save-health check when the app opens, scheduled save exports, and a tested restore |
| 4.3 **A tested playthrough** | A headless browser plays the first days on every push, and CI fails if it breaks |
| 4.4 **Releases** | A version and a short "What's new" in the app, so you see what changed as you play |

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
- **Say go on Phase 2's workshops** (the Kitchen first).
