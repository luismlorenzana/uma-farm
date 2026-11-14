# The road to a full game

**Start here.** This page says what the farm is, where it stands, what "a full game" means for it, and the phases that
get it there. How the game works today is in [game-mechanics.md](game-mechanics.md), the farm's progression in [the
farm's progress](game-mechanics.md#the-farms-progress). How it's built is in
[technical/architecture.md](technical/architecture.md), and the cloud in
[technical/infrastructure.md](technical/infrastructure.md). The page view is [pages/roadmap.html](pages/roadmap.html).

## What this game is

- **Personal, never public.** It's the owner's own game, on the owner's iPhone, reachable only with the owner's Google
  account. Nothing here plans for other players, stores or distribution.
- **Still being built.** The deployed site is the work in progress, not something to preserve: saves can start over,
  and rules can change, whenever the game needs it.
- **Built whole, played live.** Every system ships and plays from day one, with plain placeholders wherever the story
  hasn't reached yet. The story arrives over time in packs, and each pack unlocks more of what the game already has. No
  pack has to be complete.
- **The story is free.** The story session builds the world, the backgrounds and the characters however it wants. Much
  of it may never appear in the game; it informs the dialogue that does. The game asks the story for nothing it can't
  play without.
- **No global chapters, no farm-wide story.** Each Uma's story is hers, in her own chapters, from the day you meet her to
  married life.
- **The farm grows by what you earn and grow.** The Farm Rank, from income and farmed goods, says what you may build,
  and you build it with gold and goods. The homestead and the town grow with your life with the Umas: the *n*-th
  wedding opens house *n*.
- **A lean start, then the town.** You name your farmer, read a few lines, and you're on the farm. Every character lives
  in town. You choose who to talk to, and a character's story begins when her trigger is met. The story's welcome list
  (five by default) comes to you in the first days.

## Where we are

| Part | State | What changes |
|---|---|---|
| **The farm's loop** | **Deployed** (save v4, one build) | The days, the Fields, the forest and the Fishery, the Mill, the Sawmill and the Smokehouse, goods and the bin, talents and ranks, the roster, the Farm Rank. **The farm grows by building:** no global chapters; the Farm Rank from income and goods offers each place, built with gold and goods; the Dock and the Boat open the sea; weddings open houses; the Diary's projects |
| **The romance** | **Deployed, part of the one game** | Hearts, heart events and plays, evenings, perks, the ring and the wedding, married life, the homestead, bonds. Its cast arrives as the story pack says. **Being reworked:** the town and meeting replace arrivals (F66, F67), and her chapters frame her route (F68) |
| **The story** | **Being written** | In the Farm Story Sandbox on this Mac. The pack is open: every part optional, any number of characters, notes instead of blocks, and any pack releases. [The story pack's menu](story-pack.md) lists what the game reads, with the welcome list, her trigger to meet and her chapters |
| **The HD-2D farm** | **Opt-in preview** | The farm and its Umas on the shared HD-2D stage (Account → HD-2D farm). The 2D Hub is still Home. A working Uma doesn't nod yet: uma-stage 0.5.0 can now play it |
| **Art** | **Mixed** | The farm kit's first wave is painted; its second wave is still the stand-in's frames. Umas whose outfits have no sprite set show as cards with their faces. The town cast's busts aren't drawn |
| **The workshops** | **Not built** | The ranch, the Mine and the Quarry, the Kitchen and its cooking game, expeditions, the Restaurant and the Forge's games |
| **Sound** | **None** | No music and no sound effects |
| **Safety nets** | **Partial** | The save syncs with rescues and backups; there's no error reporting and no end-to-end test |
| **Parcels to the other games** | **Parked** | The farm sending items to uma-quest, uma-rpg and uma-racer comes after the farm's own game |

## The finish line

The farm is a full game when all eight of these hold:

1. **One build, one look.** No build flags, no preview switch. The HD-2D farm is Home, and the 2D Hub is retired.
2. **Everything live, filled by the story over time.** Every system plays with placeholders, and each story pack adds
   what it has.
3. **The town of everyone.** Every character lives in town. You choose who to talk to, and her story begins when her
   trigger is met.
4. **Each Uma's story to its end, and the farm built out.** Her chapters play from meeting her to married life. Every
   place can be built, and the homestead fills with houses. The game keeps going: years, festivals, the household,
   records.
5. **Every place works.** The ranch, the Mine and the Quarry, the Kitchen with its cooking game, expeditions, and the
   Restaurant's and the Forge's games.
6. **Real art and sound everywhere.** No cast standees, no stand-in frames, farm-work animations, music and sound
   effects.
7. **It feels finished.** A quick start, places that explain themselves the first time, settings (sound, motion, text
   size), every control labelled and easy to tap, and pacing proven by simulation and by your play.
8. **It's safe and steady.** A save that never loses progress, error reports that reach us, a full playthrough tested on
   every push, and a check on your phone before each release.

## The phases

```text
Phase 0  Clean slate                       ── done
Phase 1  One game, built around the Umas   ── one build on v4, placeholders, the farm by building, the lean start,
                                              the town, meeting her, her chapters
Phase 2  The whole farm                    ── each workshop's game, the sea, festivals and the long game
Phase 3  Feel and polish                   ── sound, animation, settings, balance, speed
Phase 4  Steady                            ── error reports, save safety, a tested playthrough, releases
```

Phase 1 runs as two tracks, one piece at a time each: the game's frame, and the HD-2D farm. Phase 3 starts once a
workshop stands on the stage. Phase 4's error reports and save safety are small and can come any time.

### Phase 0: Clean slate (done)

- The decision log, the finished task packets, the old specs and their pages are deleted. Git keeps them: commit
  `70071ac` is the last that has them all.
- One document says what the game is ([game-mechanics.md](game-mechanics.md)), with its tables generated from the code.
  This roadmap says where it's going.
- Code and files with no purpose are removed, and comments no longer point at deleted documents.

### Phase 1: One game, built around the Umas

**Goal:** the deployed game is one game: built whole, played live, its farm growing by building, its people met in
town, each with her own story.

**Track A, the game's frame,** in this order. Each is a small packet, built, merged and deployed in turn.

| Step | What | Packet |
|---|---|---|
| 1.6 **The town** | Every character in town, a different few out each day, talk, the People list | [F66](handoff/tasks/F66-the-town.md) |
| 1.7 **Meeting her** | Her trigger starts her story; the welcome list comes in the first days; the beds cap who lives on the farm | [F67](handoff/tasks/F67-meeting-her.md) |
| 1.8 **Her chapters** | Her own chapters, from the story or four defaults, with optional farm gates, on her profile and the Hearts tab | [F68](handoff/tasks/F68-her-chapters.md) |

**Track B, the HD-2D farm:**

| Step | What | Who |
|---|---|---|
| 1.9 **The working nod** | An Uma at work nods every 4–7 seconds, on uma-stage 0.5.0 | Claude |
| 1.10 **The kit's second wave** | The 30 frames still drawn by the stand-in, painted in code | Claude, in a uma-platform session ([F9](handoff/tasks/F9-kit-farm.md)) |
| 1.11 **The HD-2D farm reaches the Hub** | Everything the Hub does, on the stage: every place, the build sheets, the homestead's rows, the town | Claude |
| 1.12 **The HD-2D farm becomes Home** | After your phone look: the switch and the 2D Hub go | Claude |
| 1.13 **The cast's busts** | The town cast's portraits | ChatGPT ([F25](handoff/tasks/F25-art-m4.md)) |

**Track C, her look** ([design](design/her-look.md)): a wardrobe for each Uma (four seasons, spring her default, a kimono, a
dinner dress, a wedding dress, pajamas), and busts that change expression: a face for each expression over a bust for
each outfit.

| Step | What | Who |
|---|---|---|
| 1.14 **The bust art** | Her outfits (8) and her expressions (22); the pilot first: the two Umas with the new full art | ChatGPT ([F69](handoff/tasks/F69-bust-art-spec.md)); the delivery's private art family is requested of uma-platform |
| 1.15 **Busts that change expression** | The game puts the face over the bust; the story's `emote` picks the face | Claude ([F70](handoff/tasks/F70-expressive-busts.md)) |
| 1.16 **Her wardrobe** | The occasion picks the outfit; Dinner in town and A night in join the evenings | Claude ([F71](handoff/tasks/F71-her-wardrobe.md)) |

**Your steps:**
- write the story, freely;
- a phone check after the town and meeting land;
- the HD-2D farm on your phone;
- the bust art: hand [F69](handoff/tasks/F69-bust-art-spec.md) to the character art session, and approve the pilot.

### Phase 2: The whole farm

**Goal:** every place you can build has its full game.

| Step | What |
|---|---|
| 2.1 **The ranch** | The Coop and the Barn: animals and their feed, carers and affection, eggs, milk and wool, cloth at the Mill |
| 2.2 **The Mine and the Quarry** | Floors and stairs, ore and stone, the Smelter and the Cutter |
| 2.3 **The Kitchen** | The cooking game on the stage, recipes, the staff meal and well fed; the Cooking Contest as a festival |
| 2.4 **The sea and expeditions** | The dock and the boat's spots; regions, parties and their power, results and loot, the log |
| 2.5 **The Restaurant's and the Forge's games** | The serving game and the merge game, on the stage |
| 2.6 **The long game** | Years, festivals, the household's milestones, records, and what the town gives back as you meet more of it |

How each workshop is built:
- **Planned fresh, one at a time,** live from its first day, opened by Farm Rank and its build, with placeholders where
  the story hasn't reached.
- **Its art:** the kit's frames and icons drawn in code by Claude; its people drawn by ChatGPT.
- **The save:** v4 grows in place while the game is being built; a new version comes only when a save shape must change
  in a way old fields can't carry, with a migration or a fresh start.

### Phase 3: Feel and polish

| Step | What |
|---|---|
| 3.1 **Sound** | Music by season and time of day, and effects for taps, harvests, the bin and heart events. Mute and volume in settings. A small set, cached on first use |
| 3.2 **Animation** | The farm-work animations from the sprite pipeline, and the items' flights |
| 3.3 **First times** | Each new place explains itself the first time you open it |
| 3.4 **Settings and access** | Sound, motion and text size. Every control labelled for VoiceOver, every tap target 44 points |
| 3.5 **Balance** | A test that simulates a long run (Farm Rank 10 and a year after) and checks the pacing; then your play notes |
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

- **The farm starts over on your phone:** open uma-farm.web.app, see the start-over card, start the new farm, and play a
  day.
- **Say go on the rest of Phase 1,** from F66 (the town).
- **Keep writing the story** however you like.
- **The HD-2D farm on your phone,** when you have a minute.
