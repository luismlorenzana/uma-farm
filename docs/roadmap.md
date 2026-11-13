# The road to a full game

**Start here.** This page says where the farm stands, what "a full game" means for it, and the phases that get it
there. How the game works today is in [game-mechanics.md](game-mechanics.md). How it's built is in
[technical/architecture.md](technical/architecture.md), and the cloud in
[technical/infrastructure.md](technical/infrastructure.md). The page view is [pages/roadmap.html](pages/roadmap.html).

## Where we are: a sandbox

The farm runs on your phone every day, but it's still a sandbox: several tracks were started side by side, and none is
finished.

| Part | State | What that means |
|---|---|---|
| **The farm's loop** | **Live** (save v3) | The days, the Fields, the forest and the Fishery, the Mill, the Sawmill and the Smokehouse, goods and the bin, talents and ranks, the roster, the Farm Rank. **Chapter 1 is the whole game:** chapter 2's card says "Soon" |
| **The romance** | **Built, switched off** | The cast of 20, hearts, heart events and plays, evenings, perks, the ring and the wedding, married life, the homestead, bonds between Umas. It runs only in the romance build, on a v4 save, and waits for the story |
| **The story** | **Being written** | You write and read it in the Farm Story Sandbox (on this Mac). Layer 1 (the world, the characters, the relationships) is written; layer 2, each Uma's route with her arrival scene, is next. The release needs all 20 arrival scenes |
| **The HD-2D farm** | **Opt-in preview** | The farm and its Umas on the shared HD-2D stage (Account → HD-2D farm). The 2D Hub is still Home. A working Uma doesn't nod yet: uma-stage 0.5.0 can now play it, so it's the next small piece. There are no farm-work animations |
| **Art** | **Mixed** | The farm kit's first wave is painted; its second wave is still the stand-in's frames. Umas whose outfits have no sprite set show as cards with their faces. The town cast's busts aren't drawn |
| **The workshops** | **Not built** | The ranch, the Mine and the Quarry, the Kitchen and its cooking game, the Cooking Contest, expeditions, and the Restaurant's and the Forge's games: chapters 2–5 |
| **Sound** | **None** | No music and no sound effects |
| **Players** | **One** | Your account only: the API lets one email in |
| **Safety nets** | **Partial** | The save syncs with rescues and backups; there's no error reporting and no end-to-end test |
| **Parcels to the other games** | **Parked** | The farm sending items to uma-quest, uma-rpg and uma-racer comes after the farm's own game |

**What makes it a sandbox:**
- three ways to run it: the deployed build, the romance build, and the HD-2D switch;
- stand-ins wherever the art or the story isn't ready;
- a story written in a separate tool;
- one chapter of content.

## The finish line

The farm is a full game when all seven of these hold:

1. **One build, one look.** No build flags, no preview switch. The HD-2D farm is Home, and the 2D Hub is retired.
2. **The story is in.** All 20 Umas arrive, with their routes, heart events, confessions, weddings and married life,
   from your story. No stand-in pack outside the tests.
3. **A whole arc.** Chapters 1–5 play start to finish, there's an ending, and the game keeps going after it: seasons and
   years, festivals, the household, records.
4. **Every place works.** The ranch, the Mine and the Quarry, the Kitchen with its cooking game, the Cooking Contest,
   expeditions, and the Restaurant's and the Forge's games.
5. **Real art and sound everywhere.** No cast standees, no stand-in frames, farm-work animations, music and sound
   effects.
6. **It feels finished.** A first run that teaches by playing, settings (sound, motion, text size), every control
   labelled and easy to tap, and pacing proven by simulation and by your play.
7. **It's safe and steady.** A save that never loses progress, error reports that reach us, a full playthrough tested
   on every push, and a release routine with a check on your phone before production.

## The audience gate

**Who is the full game for?** Decide this before Phase 5. Phases 1–4 are the same either way.

- **Recommended: a full game for you, private.** It stays what it is today: your farm, on your phone, behind your
  sign-in.
- **Public, later, only by choice.** The game is built on *Umamusume: Pretty Derby*. Its Umas, outfits, names and the
  art drawn from them belong to Cygames, so a public game needs an original cast and art in their place. It also needs
  accounts for many players, a privacy policy and terms, costs that grow with players, and support. Phase 5 lists that
  work.

## The phases

```text
Phase 0  Clean slate            ── done with this change
Phase 1  One game, not three    ── the story live, the HD-2D farm as Home, no switches
Phase 2  The whole farm         ── the workshops, chapters 2–5, the ending and the long game
Phase 3  Feel and polish        ── sound, animation, first run, settings, balance, speed
Phase 4  Production-ready       ── error reports, save safety, a tested playthrough, releases
Phase 5  Public (only by choice) ── an original cast, many players, legal, costs, distribution
```

Phases 1 and 2 can run as two tracks at once, one piece at a time each, as the romance and the HD-2D farm do now.
Phase 3 starts once a workshop stands on the stage. Phase 4's error reports and save safety can come any time; they're
small.

### Phase 0: Clean slate (this change)

- The decision log, the finished task packets, the old specs and their pages are deleted. Git keeps them: commit
  `70071ac` is the last that has them all.
- One document says what the game is ([game-mechanics.md](game-mechanics.md)), with its tables generated from the code.
  This roadmap says where it's going.
- Code and files with no purpose are removed, and comments no longer point at deleted documents.

### Phase 1: One game, not three

**Goal:** the deployed game is the game we're building, with no switches.

| Step | What | Who |
|---|---|---|
| 1.1 **The story's release** | Layer 2 for every Uma, with all 20 arrival scenes, read in the sandbox; then the private pack is released | You and the story session |
| 1.2 **The romance goes live** | Publish the pack to the farm's private bucket. Remove the romance switch so there's one build. The save moves to v4, with the v3 save backed up first. Then your phone check | Claude ([its packet](handoff/tasks/F56-story-delivery.md)) |
| 1.3 **The HD-2D farm reaches the Hub** | Everything the Hub does, on the stage: every place and sheet, the homestead's rows, the bubbles and the labels. First the working nod, on uma-stage 0.5.0 | Claude |
| 1.4 **The kit's second wave** | The 30 frames still drawn by the stand-in, painted in code | Claude, in a uma-platform session ([its packet](handoff/tasks/F9-kit-farm.md)) |
| 1.5 **The HD-2D farm becomes Home** | After your phone look: the switch and the 2D Hub go, and with them the old map engine | Claude |
| 1.6 **The cast's busts** | The town cast's portraits | ChatGPT ([its packet](handoff/tasks/F25-art-m4.md)) |

**Your steps:**
- write and read the story;
- the HD-2D farm on your phone (below);
- the go-live phone check.

### Phase 2: The whole farm

**Goal:** every place on the farm works, and chapters 2–5 tell one arc to an ending.

| Step | What |
|---|---|
| 2.1 **The ranch**, chapter 2 | The Coop and the Barn, animals and their feed, carers and affection, eggs, milk and wool, cloth at the Mill |
| 2.2 **The Mine and the Quarry**, chapter 3 | Floors and stairs, ore and stone, the Smelter and the Cutter |
| 2.3 **The Kitchen**, chapter 4 | The cooking game on the stage, recipes, the staff meal and well fed; then the Cooking Contest closes the chapter |
| 2.4 **Expeditions**, chapter 5 | Regions, parties and their power, results and loot, the log |
| 2.5 **The Restaurant's and the Forge's games** | The serving game and the merge game, on the stage |
| 2.6 **The ending and the long game** | What chapter 5's end brings, and what keeps a farm going after it: years, festivals, the household, records |

How each workshop is built:
- **Planned fresh, one at a time,** for the romance and the stage. The old specs (in git) are inputs, not plans.
- **Its art:** the kit's frames and icons drawn in code by Claude; its people drawn by ChatGPT.
- **The save:** one version per release that changes the save, each with a tested migration and a backup.

### Phase 3: Feel and polish

| Step | What |
|---|---|
| 3.1 **Sound** | Music by season and time of day, and effects for taps, harvests, the bin and heart events. Mute and volume in settings. A small set, cached on first use |
| 3.2 **Animation** | The farm-work animations from the sprite pipeline, the working nod, the items' flights |
| 3.3 **The first run** | The opening teaches the loop by playing it, and each new place explains itself the first time |
| 3.4 **Settings and access** | Sound, motion and text size. Every control labelled for VoiceOver, every tap target 44 points |
| 3.5 **Balance** | A test that simulates a whole run (chapters 1–5 and a year after) and checks the pacing; then your play notes |
| 3.6 **Speed** | A frame budget on your iPhone, the stage's memory cap, and the first load's size |

### Phase 4: Production-ready

| Step | What |
|---|---|
| 4.1 **Error reports** | The app's and the API's errors go to Cloud Logging, with an alert by email (free tier) |
| 4.2 **Save safety** | A save-health check when the app opens, scheduled save exports, and a tested restore |
| 4.3 **A tested playthrough** | A headless browser plays the first days on every push, and CI fails if it breaks |
| 4.4 **Releases** | A version and a short "What's new" in the app, and a preview link for your phone check before production |

### Phase 5: Public (only if you choose it)

| Step | What |
|---|---|
| 5.1 **An original cast and art** | Our own Umas, names, outfits and art, and master data of our own, replacing everything from the franchise |
| 5.2 **Many players** | Anyone can sign in, each with their own save (the API already keeps saves by account), limits, and account deletion |
| 5.3 **Legal and trust** | A privacy policy, terms, data deletion, an age rating |
| 5.4 **Costs at scale** | A cost table at 100 and 1,000 players, the cloud's limits, the budget alert raised |
| 5.5 **Distribution** | The web app as it is, or the app stores through a wrapper; a landing page; support |

### Later: parcels to the other games

The farm sends items to uma-quest, uma-rpg and uma-racer, one way. It's parked until the farm's own game is done.

## How we work from here

- **[game-mechanics.md](game-mechanics.md) is what the game is.** Every rule change updates it in the same commit, and
  its tables regenerate from the code (`pnpm docs:update`).
- **This roadmap is where the game is going.** A finished step leaves it, and git keeps the history.
- **Packets are for work in progress only.** A step gets a packet in [handoff/tasks/](handoff/tasks/) when it starts,
  and the packet is deleted when it ships. [handoff/README.md](handoff/README.md) lists what's open now.
- **There's no decision log.** A commit says what changed and why. Your calls go into the roadmap or the mechanics
  document they change.

## Your steps now

- **Read this roadmap,** and give one word on the audience gate: private first (recommended), or public later.
- **Keep writing the story** in the Farm Story Sandbox.
- **The HD-2D farm on your phone:** open [uma-farm.web.app](https://uma-farm.web.app), turn on Account → HD-2D farm, put
  an Uma to work and watch her walk, end the day, and tap her bubble in the morning. Then tell us how the walk and the
  bubble feel, and whether the pips can go.
