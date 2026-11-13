# The road to a full game

**Start here.** This page says where the farm stands, what "a full game" means for it, and the phases that get it
there. How the game works today is in [game-mechanics.md](game-mechanics.md). How it's built is in
[technical/architecture.md](technical/architecture.md), and the cloud in
[technical/infrastructure.md](technical/infrastructure.md). The page view is [pages/roadmap.html](pages/roadmap.html).

## What this game is

- **Personal, never public.** It's the owner's own game, on the owner's iPhone, reachable only with the owner's Google
  account. Nothing here plans for other players, stores or distribution.
- **Built whole, played live.** Every system ships live and plays from day one, with plain placeholders wherever the
  story hasn't reached yet. The story arrives over time in packs, and each pack unlocks more of what the game already
  has: characters' lines, scenes, events and routes. No pack has to be complete, and nothing waits for "the story to
  be done".
- **The story is free.** The story session builds the world, the backgrounds and the characters however it wants. Much
  of it may never appear in the game; it informs the dialogue that does. The game asks the story for nothing it can't
  play without: everything a pack holds is optional, and anything missing falls back to a placeholder.
- **A lean start, then the town.** You name your farmer, read a few lines, and you're on the farm. Every character lives
  in town from the start. You choose who to talk to, and a character's story begins when you meet her trigger. The
  story's welcome list (five by default) comes to you early, so the first friends and helpers arrive in the first days.

## Where we are: a sandbox

The farm runs on your phone every day, but it's still a sandbox: tracks were started side by side, and none is finished.

| Part | State | What that means |
|---|---|---|
| **The farm's loop** | **Live** (save v3) | The days, the Fields, the forest and the Fishery, the Mill, the Sawmill and the Smokehouse, goods and the bin, talents and ranks, the roster, the Farm Rank. **Chapter 1 is the whole game:** chapter 2's card says "Soon" |
| **The romance** | **Built, switched off** | Hearts, heart events and plays, evenings, perks, the ring and the wedding, married life, the homestead, bonds between Umas. It runs only in the romance build, on a v4 save, with a fixed cast of 20 that arrives in a set order, starting with exactly three |
| **The story** | **Being written** | In the Farm Story Sandbox on this Mac. Its checker refuses a pack unless the opening is exactly three Umas (a farmer, a forager and a fisher), every chat set has 3–20 lines, every Uma has three liked gifts and two disliked, and every cast Uma has her bible and arrival scene. That's what has blocked it |
| **The HD-2D farm** | **Opt-in preview** | The farm and its Umas on the shared HD-2D stage (Account → HD-2D farm). The 2D Hub is still Home. A working Uma doesn't nod yet: uma-stage 0.5.0 can now play it, so it's the next small piece |
| **Art** | **Mixed** | The farm kit's first wave is painted; its second wave is still the stand-in's frames. Umas whose outfits have no sprite set show as cards with their faces. The town cast's busts aren't drawn |
| **The workshops** | **Not built** | The ranch, the Mine and the Quarry, the Kitchen and its cooking game, the Cooking Contest, expeditions, and the Restaurant's and the Forge's games: chapters 2–5 |
| **Sound** | **None** | No music and no sound effects |
| **Safety nets** | **Partial** | The save syncs with rescues and backups; there's no error reporting and no end-to-end test |
| **Parcels to the other games** | **Parked** | The farm sending items to uma-quest, uma-rpg and uma-racer comes after the farm's own game |

## The finish line

The farm is a full game when all eight of these hold:

1. **One build, one look.** No build flags, no preview switch. The HD-2D farm is Home, and the 2D Hub is retired.
2. **Everything live, filled by the story over time.** Every system plays with placeholders, and each story pack adds
   what it has. There's no "story complete" gate.
3. **The town of everyone.** Every character lives in town. You choose who to talk to, and her story begins when her
   trigger is met.
4. **A whole arc.** Chapters 1–5 play start to finish, there's an ending, and the game keeps going after it: seasons and
   years, festivals, the household, records.
5. **Every place works.** The ranch, the Mine and the Quarry, the Kitchen with its cooking game, the Cooking Contest,
   expeditions, and the Restaurant's and the Forge's games.
6. **Real art and sound everywhere.** No cast standees, no stand-in frames, farm-work animations, music and sound
   effects.
7. **It feels finished.** A start that's quick, places that explain themselves the first time, settings (sound, motion,
   text size), every control labelled and easy to tap, and pacing proven by simulation and by your play.
8. **It's safe and steady.** A save that never loses progress, error reports that reach us, a full playthrough tested on
   every push, and a check on your phone before each release.

## The phases

```text
Phase 0  Clean slate                  ── done
Phase 1  Live, with the story's frame ── an open story pack, placeholders, the lean start, the town, triggers, go live
Phase 2  The whole farm               ── the workshops, chapters 2–5, the ending and the long game
Phase 3  Feel and polish              ── sound, animation, settings, balance, speed
Phase 4  Steady                       ── error reports, save safety, a tested playthrough, releases
```

Phase 1 runs as two tracks, one piece at a time each: the story's frame, and the HD-2D farm. Phase 3 starts once a
workshop stands on the stage. Phase 4's error reports and save safety are small and can come any time.

### Phase 0: Clean slate (done)

- The decision log, the finished task packets, the old specs and their pages are deleted. Git keeps them: commit
  `70071ac` is the last that has them all.
- One document says what the game is ([game-mechanics.md](game-mechanics.md)), with its tables generated from the code.
  This roadmap says where it's going.
- Code and files with no purpose are removed, and comments no longer point at deleted documents.

### Phase 1: Live, with the story's frame

**Goal:** the deployed game is the whole game, live, with the story filling in as packs arrive.

**Track A, the story's frame,** in this order. Each is a small packet.

| Step | What | Packet |
|---|---|---|
| 1.1 **An open story pack** | The pack accepts whatever the story defines: any number of characters, any welcome list, any route partly written. The checker refuses only what the game can't read; everything else becomes a note in the sandbox. Any pack can be released | [F61](handoff/tasks/F61-open-story-pack.md) |
| 1.2 **Placeholders everywhere** | Every place the game reads story has a plain placeholder: a character with no lines says a simple one, an unwritten event plays a short card and still pays. Every mechanic runs with no story at all | [F62](handoff/tasks/F62-story-placeholders.md) |
| 1.3 **The lean start** | Name your farmer, a few lines, then the farm. The picks and the opening three go | [F63](handoff/tasks/F63-lean-start.md) |
| 1.4 **The town** | Every character in town, at a few spots a day, so you meet different people; tap one to talk; a People list of everyone | [F64](handoff/tasks/F64-the-town.md) |
| 1.5 **Meeting her** | Her trigger (the story's, or a default) starts her story: her route, her place among the farm's people. The welcome list comes to you in the first days | [F65](handoff/tasks/F65-meeting-her.md) |
| 1.6 **Go live** | One build: the romance switch goes. Save v4 ships, with your v3 save backed up first. The latest pack is published, whatever it holds. Then your phone check | [F56](handoff/tasks/F56-story-delivery.md) |

**Track B, the HD-2D farm:**

| Step | What | Who |
|---|---|---|
| 1.7 **The working nod** | An Uma at work nods every 4–7 seconds, on uma-stage 0.5.0 | Claude |
| 1.8 **The kit's second wave** | The 30 frames still drawn by the stand-in, painted in code | Claude, in a uma-platform session ([F9](handoff/tasks/F9-kit-farm.md)) |
| 1.9 **The HD-2D farm reaches the Hub** | Everything the Hub does, on the stage: every place and sheet, the homestead's rows, the town | Claude |
| 1.10 **The HD-2D farm becomes Home** | After your phone look: the switch and the 2D Hub go | Claude |
| 1.11 **The cast's busts** | The town cast's portraits | ChatGPT ([F25](handoff/tasks/F25-art-m4.md)) |

**Your steps:**
- write the story, freely;
- the HD-2D farm on your phone;
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
- **Planned fresh, one at a time,** live from its first day, with placeholders where the story hasn't reached.
- **Its art:** the kit's frames and icons drawn in code by Claude; its people drawn by ChatGPT.
- **The save:** one version per release that changes the save, each with a tested migration and a backup.

### Phase 3: Feel and polish

| Step | What |
|---|---|
| 3.1 **Sound** | Music by season and time of day, and effects for taps, harvests, the bin and heart events. Mute and volume in settings. A small set, cached on first use |
| 3.2 **Animation** | The farm-work animations from the sprite pipeline, and the items' flights |
| 3.3 **First times** | Each new place explains itself the first time you open it |
| 3.4 **Settings and access** | Sound, motion and text size. Every control labelled for VoiceOver, every tap target 44 points |
| 3.5 **Balance** | A test that simulates a whole run (chapters 1–5 and a year after) and checks the pacing; then your play notes |
| 3.6 **Speed** | A frame budget on your iPhone, the stage's memory cap, and the first load's size |

### Phase 4: Steady

| Step | What |
|---|---|
| 4.1 **Error reports** | The app's and the API's errors go to Cloud Logging, with an alert by email (free tier) |
| 4.2 **Save safety** | A save-health check when the app opens, scheduled save exports, and a tested restore |
| 4.3 **A tested playthrough** | A headless browser plays the first days on every push, and CI fails if it breaks |
| 4.4 **Releases** | A version and a short "What's new" in the app, and a preview link for your phone check before production |

### Later: parcels to the other games

The farm sends items to uma-quest, uma-rpg and uma-racer, one way. It's parked until the farm's own game is done.

## How we work from here

- **[game-mechanics.md](game-mechanics.md) is what the game is.** Every rule change updates it in the same commit, and
  its tables regenerate from the code (`pnpm docs:update`).
- **This roadmap is where the game is going.** A finished step leaves it, and git keeps the history.
- **Packets are for the game's work only.** A step gets a packet in [handoff/tasks/](handoff/tasks/) when it's next,
  and the packet is deleted when it ships. [handoff/README.md](handoff/README.md) lists what's open now. The story has
  no packet of requirements: [F40](handoff/tasks/F40-story-authoring.md) only says how its work reaches the game.
- **There's no decision log.** A commit says what changed and why. Your calls go into the roadmap or the mechanics
  document they change.

## Your steps now

- **Read the progression proposal,** [design/progression.md](design/progression.md): no global chapters, the farm
  grows by income and building, the homestead by your life with the Umas, and each Uma has her own chapters. Say go,
  and F61–F67 and this roadmap follow it.
- **Read this roadmap** and the five Phase 1 packets: [F61](handoff/tasks/F61-open-story-pack.md),
  [F62](handoff/tasks/F62-story-placeholders.md), [F63](handoff/tasks/F63-lean-start.md),
  [F64](handoff/tasks/F64-the-town.md) and [F65](handoff/tasks/F65-meeting-her.md). Say go, or what to change.
- **Keep writing the story** however you like.
- **The HD-2D farm on your phone:** open [uma-farm.web.app](https://uma-farm.web.app), turn on Account → HD-2D farm, put
  an Uma to work and watch her walk, end the day, and tap her bubble in the morning.
