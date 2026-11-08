# uma-farm: the HD-2D farm

> **Status: 2026-11-08, accepted whole by the owner (D21):** every question answered as recommended, the Forge's genre merge. [core-loop.md](core-loop.md) (D22) then refocused the loop on the farm's own economy: it amends FR19 (the Restaurant earns gold; the crew's boost moves to the Kitchen's staff meal) and parks FR23's parcels.
>
> **Drafted 2026-11-08 for the owner's review (D20).** On 2026-11-08 the owner refocused the farm. It moves to the
> HD-2D engine being built for uma-quest, with lots of taps to put Umas to work. The Umas walk to their slots as
> uma-quest's sprites, and the farm's buildings and plots are built for that engine. Instead of one themed smithing game,
> the loop ends in **several workshops, each with a fun minigame in a popular mobile genre**: a cooking game and a
> restaurant-serving game first. This doc turns that into calls (FR1–FR24), with a recommendation for each.
> Visual page: [previews/hd2d-farm.html](previews/hd2d-farm.html).
>
> **What it changes once answered:**
> - [plan.md](plan.md): FM18 (portrait on uma-kit's shell), FM19 (Home on uma-kit's Hub map) and FM9 (the Forge);
> - [first-playable.md](first-playable.md): FW6, and the M4 tasks F8 and F9;
> - [spec.md](spec.md): §4 (FS12–FS21, the smithing game) and FS32 (the queue).
>
> Until then nothing is built, and the farm keeps playing on today's map.
>
> **Facts as of 2026-11-08,** from uma-quest `fc8eee8` and uma-platform `1e9e200`: P90, P91, P93, P103, P108; uma-quest D10,
> D14–D16, `docs/design/kits.md`; uma-platform `docs/sprites/format.md`.

## The short answer

- **One engine, shared, not copied.** uma-quest's HD-2D stage (three.js, a tile-built world, pixel sprites, lights and
  fog) becomes a shared uma-platform package once it has been measured on the phone. The farm is its second user, so the
  platform extracts it (P11). The farm never imports uma-quest, and it doesn't copy an engine that's still changing.
- **Home becomes a walkable farm**, still portrait:
  - five rows of three for the lines, a workshop row, the Warehouse and the Post, and a Gate the Umas come in by;
  - about 9 tiles across, so each place gets 3 tiles of width, and the farm scrolls up and down.
- **Lots of taps.** Tap a place, tap a slot, pick an Uma. She walks in through the Gate to her slot. Tap the bubble over
  her when the work is done, and the items fly to the Warehouse. Tap Repeat, or call her home and she runs back out.
- **Umas are uma-quest's sprites** with their walks and runs reused whole: 8 outfits today, and at most 170 of the 272
  ever. The rest stand as **standees**, her face on an upright card, and become sprites when their set is published. Every
  outfit still works (FM6). Farm-work poses are a request for later.
- **The buildings and plots are a farm kit** in uma-quest's kit format, drawn by ChatGPT. "3D" means the HD-2D look: tiles
  given height, and modular fronts and upright cards lit in 3D. There are no 3D models.
- **The loop ends in workshops,** each a building with its own minigame, each an original game in a popular mobile genre:
  - **the Kitchen,** a cooking game: several dishes on the go, each pulled at the right moment;
  - **the Restaurant,** a serving game: seat, serve and clear a rush of guests;
  - **the Forge,** whose genre is the owner's pick (merge is the recommendation).

  They turn made items into the games' items, inputs are never lost, and better play makes more (FM9 stands).
- **What stays:**
  - the rules (F4) and the save and sync (F3);
  - the cloud;
  - parcels, the accept lists and the Post (FS22–FS31, uma-platform's PO1).

## What changes, what stays

| | Today (F3–F6) | The HD-2D farm |
|---|---|---|
| **Rules** | uma-rpg's Wilds, copied (F4): five lines, fifteen places, Craft Level, jobs on `uma-work` | **The same** |
| **Save and sync** | Save v2, local first, revisions, safety copies (F3, F4) | **The same**; workshops add fields in a later version |
| **Home** | uma-kit's Phaser Hub map, five rows of three (F5, FM19) | **An HD-2D farm** on the shared stage, portrait (FR1–FR8) |
| **A place's page** | uma-kit's work screens (F5) | **The same screens as a sheet over the farm** (FR8) |
| **Umas** | Faces in the album and the slot rows | **Sprites walking to their slots, standees where no set exists yet** (FR9–FR14) |
| **Art** | uma-art's Hub buildings (P48) | **A farm kit** in uma-quest's kit format, drawn by ChatGPT (FR15–FR16) |
| **End of the loop** | The Forge and the Post as placeholders | **Workshops with genre minigames:** Kitchen, Restaurant, Forge (FR17–FR22) |
| **Parcels** | Planned (F10, PO1) | **The same** (FS22–FS31) |
| **Push** | Deployed, notifications off by the owner's choice (D18) | **The same** |

## 1. The engine (FR1–FR4)

**FR1: the HD-2D stage becomes a shared package, extracted in uma-platform.** uma-quest's engine is about 2,000 lines of
app code (`apps/web/src/stage/`, `apps/web/src/sprites/`) plus contracts in its private package. It also imports quest
content. There are three ways to get it into the farm:

| Option | What it means | Verdict |
|---|---|---|
| **Extract it in uma-platform** (P11, "extract on second use") | A uma-platform session lifts the stage, the kit loader, the sprite player, the lights, battery saver and the recorder into a package, working name `@luismlorenzana/uma-stage`. uma-quest moves onto it and the farm adopts it, as the Hub and the work engine moved into uma-kit and uma-work when uma-racer became their second user (P48, SC1) | **Recommended.** One engine for both apps, and its fixes reach both |
| Copy it into the farm at a recorded commit (FM2's way) | The farm owns its own 2,000-line fork | No. The engine is still changing (Q11 and Q12 are next; it hasn't been measured), so the copy would drift at once |
| Import it from uma-quest | — | Never (CLAUDE.md) |

The request goes through uma-platform's [change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)
as "Both apps", with uma-quest's `docs/design/kl1-request.md` as the template. It needs a uma-platform P-decision amending
P90, which limits three.js to uma-quest, and P14, which keeps Phaser as the default. The ask:
- the stage, camera, world builder, kit loader, sprite player, lights and fog, battery saver and measurement recorder,
  with no quest content in them;
- a **portrait, unturned** layout (FR3);
- **open kit and marker kinds**, so a farm kit and farm markers fit (FR15);
- **standees** as a sprite stand-in (FR12);
- a cap on live sprite sets (FR13).

**FR2: the extraction waits for uma-quest's engine to be measured.** The engine hasn't met its frame-rate and battery gate
yet (HD5): the owner's two measured plays for Q4 and Q6 are pending. Extracting before then would freeze code that may
still change. Until the package exists, the farm keeps playing on today's map, and the work that doesn't need the engine
goes first (the minigames' rules, FR22; the farm kit's contract, FR16).

**FR3: the farm stays portrait** (FM18 stands), on an unturned stage:
- uma-kit 0.18.0's `KitStage` has a `layout: 'portrait'` (P103), and the engine already runs unturned when iOS has rotated
  the page;
- at uma-quest's scale (a tile is 128 texels, one texel to one device pixel), an iPhone in portrait is about 1,179 pixels
  wide, so **about 9 tiles across**;
- the farm is laid out for that width (FR5), and its sheets stay uma-kit's, since an unturned stage doesn't break the
  kit's `Sheet` the way uma-quest's turned one does.

**FR4: one engine on the device.** The farm scene and every minigame run on the shared stage, and Phaser leaves the farm
along with the Hub map. The platform's rule holds: one canvas engine alive at a time, the farm paused while a minigame
plays, and everything loaded on demand. On size, uma-quest's stage chunk is 154.7 KB gzip with three.js, against the 377 KB
of today's Phaser map. The main JS stays within 180 KB.

## 2. The farm map (FR5–FR8)

**FR5: the layout,** 9 tiles wide, scrolling up and down:

```
 ┌───────────────────────────── 9 tiles ─────────────────────────────┐
 │  Mine (gather)      │  Mine Workbench      │  Weapon Forge (make)  │  Metal
 │─────────────────────── path ──────────────────────────────────────│
 │  Fields             │  Fields Workbench    │  Tome Forge           │  Vegetables
 │───────────────────────────────────────────────────────────────────│
 │  Forest             │  Forest Workbench    │  Armorer              │  Wood
 │───────────────────────────────────────────────────────────────────│
 │  Fishery            │  Fishery Workbench   │  Charm Forge          │  Fish
 │───────────────────────────────────────────────────────────────────│
 │  Monster Den        │  Den Workbench       │  Lapidary             │  Stone
 │═══════════════════════════════════════════════════════════════════│
 │  Kitchen            │  Restaurant          │  Forge                │  workshops (FR17)
 │───────────────────────────────────────────────────────────────────│
 │  Warehouse          │  Gate ▲ (Umas come and go)   │  Post         │
 └───────────────────────────────────────────────────────────────────┘
```

- **Each place is 3 tiles wide** and about 3 deep, with its four slots marked on its plot or in front of its building.
- **Rows are the lines,** gather → process → make from left to right, as on today's map (FM19's order).
- **The workshop row** sits below the lines and holds the end of the loop.
- **The Gate** is where the Umas enter and leave. The **Warehouse** and the **Post** flank it at the bottom, where the
  thumb is.

**FR6: the camera** is uma-quest's (orthographic, pitched 35°, pixel-snapped), and it pans only up and down. A flick
glides the camera and it settles on a row. There's no zoom, since one texel to one pixel allows no free scaling, and no
sideways pan, since the farm is exactly the screen's width.

**FR7: the frame stays uma-kit's.** The account bar, the bottom bar (Farm · Warehouse · Menu) and the sync warning sit over
the stage as they do today. The Ready badges and "Collect all" stay.

**FR8: a place's page becomes a sheet over the farm.** It holds uma-kit's work screens as they are (slot rows, the job
sheet, queues, Recall, Repeat, quick looks), so F5's screens carry over. The farm stays visible above the sheet, so you
watch her walk off when you assign her.

## 3. Umas at work (FR9–FR14)

**FR9: the taps,** the heart of the farm:

| You tap | What happens |
|---|---|
| A place | Its sheet opens on its four slots |
| An empty slot, then an Uma in the album | She appears at the Gate, walks the paths to the slot and starts work; the job's timer shows over her |
| A working Uma | A quick look: her job, its time left, her Craft Level; Recall, and Repeat for when it ends |
| The **Ready bubble** over an Uma | Collect: the items pop out and fly to the Warehouse, and her Craft EXP ticks up. With Repeat on, she starts again at once |
| Recall | She drops the work, her inputs return, and **she runs back out the Gate** |
| "Collect all" (bottom bar) | Every bubble pops, row by row, as the camera sweeps |

One idea, short of a call: a **quick assign**. Long-press an Uma's face in the album and tap a place, so she walks to its
first free slot. It's left for the owner's review.

**FR10: who walks and how.** Each move reuses uma-quest's field animations whole:
- **arriving:** she enters at the Gate and walks the path to her slot, using `walk-front`, `walk-back`, `walk-left` and
  `walk-right` at 6 frames × 110 ms;
- **at work:** she stands on her turnaround still, facing the place's work, with an emote (`nod`) every few seconds to
  show she's busy;
- **done:** she plays `wave` and a Ready bubble rises over her;
- **leaving:** she runs back out with `run-*` at 6 frames × 75 ms, after Recall, after Collect without Repeat, or when a
  queue stops.

Paths follow the farm's path tiles. An Uma walks at uma-quest's field speed, so crossing the farm takes a few seconds.

**FR11: a work animation, later.** No sprite profile has farm-work poses: the battle actions face only image-left and
are fighting moves. The farm starts with the standing still and the emote (FR10). After the farm runs on the stage, it
requests a **farm add-on** to the sprite format: a dig (Mine, Fields), a chop (Forest), a line cast (Fishery), a
hammer or carve (workbenches and making places), and a carry, each in the field facings. It works like uma-quest's rival
add-on (CR13) and P105's added walks, with the tools as uma-art held items at each frame's grip (CR14). ChatGPT draws it
for each outfit with a set, and the owner approves it at the set gate. It's costly (P106's 12 frames for 5 Umas took 9
image calls), so it's asked for only on the owner's go.

**FR12: standees for Umas without a set.** Today 8 of the 272 outfits have a sprite set (5 travelers and 3 townsfolk;
P108). The plans stop at 100 travelers and 70 townsfolk, so about 102 outfits never get one. Every outfit still works
(FM6), so an Uma without a set is a **standee**:
- her face (master data's `outfit-faces`, which the album already shows) on an upright card on a small base;
- lit and shadowed like a sprite;
- it glides along the path with a small bob, with no walk cycle.

`client.spriteSet` returns a set or `null`, so each batch uma-platform publishes turns more standees into walkers with no
farm change.

**FR13: memory and battery.**
- **The problem:** a sprite set is about 1.6 MB to download and about 14 MB of GPU memory while on screen (uma-quest D16).
  Sixty distinct sets would be about 840 MB, far too much.
- **The rule:** only Umas in view are drawn as sprites, at most **8 live sets** (about 112 MB), nearest the camera's
  centre first. The rest stay standees until a set frees up.
- **Downloads:** sets are downloaded on first sight and cached on the phone by their hash (Workbox's cache-first rule for
  `/api/master/files/`), so each downloads once.
- **Battery:** saver is on by default (30 fps, no blur or glow), as in uma-quest (DN27). The farm records its own frame
  rate and battery through the shared recorder before the cap is raised.

**FR14: the counts stay right.** Sprites only show the save; they never change it. Where an Uma walks is drawn from her
work row (`uma-work`'s entries and timers), so the scene can't drift from the rules. A save that loads mid-job places
her at her slot at once, without the walk.

## 4. The farm kit (FR15–FR16)

**FR15: built in uma-quest's kit format** (its `docs/design/kits.md`):
- **plots** are `floor` variants: tilled soil, a quarry floor, a forest floor, a pond edge;
- **ore, crops, trees, the pond and the stalls** are `prop` cards, and each place has three stages (empty, working, ready);
- **buildings** are modular fronts (`building-wall`, `window`, `roof`, `door`, `sign`) for the workbenches, the making
  places, the workshops, the Warehouse and the Post;
- **paths and fences** are `floor` and `wall-top` pieces, and the **Gate** is a prop.

The format needs three openings, which are part of FR1's request:
- a kit `kind` beyond `biome` and `town` (`farm`);
- farm markers (`place`, `slot`, `gate`, `path`);
- town kits' `KIT_REQUIRED` signs made per kind.

There are no 3D models: the engine builds height from tiles and stands everything else up as lit cards. That's the
HD-2D look.

**FR16: art is ChatGPT's, and the contract is the farm's** (NA5). The farm writes `kit-farm`'s contract (every frame, its
role, size and foot) and a ChatGPT art packet draws it full colour with masters and a deterministic export (P97). It's
published as a uma-art release, and the first farm packet that draws it pins it. Until then the farm draws a
**stand-in kit in code**, as uma-quest did. This replaces F9's Hub-building scope.

## 5. Workshops and minigames (FR17–FR22)

**FR17: more than the Forge.** The loop ends in **workshops**: buildings on the workshop row (FR5), each with its own
minigame and its own recipes. A workshop has no slots. You play it, and the made items (and some refined items) go in.
What comes out goes to the outbox for a game, or back to the farm.

| Workshop | Its minigame (genre) | Makes | For |
|---|---|---|---|
| **Kitchen** | **Cooking** (time management) | Party Meal, Tonic | uma-quest (FS24) |
| **Restaurant** | **Serving** (time management) | Crew meals, served to your own Umas (FR19) | The farm itself |
| **Forge** | **The owner's pick** (FR20); merge is the recommendation | Revive (uma-quest), Rosette (uma-racer's flair) | uma-quest, uma-racer |

uma-rpg's made items still go straight through the Post, with no workshop (FS30).

**FR18: the Kitchen's cooking game.** A counter of burners and a pass:
- orders come in as tickets (a Party Meal needs its three parts cooked);
- you drop each ingredient on a burner, and its ring fills;
- you pull it in the green and plate it before the ticket's timer runs out;
- burnt or late parts cost points, never inputs.

The difficulty comes from juggling several burners at once. A play lasts about 60 seconds, and an Uma from the crew is
the cook: she runs between the burners and the pass (FR10's `run-*`).

**FR19: the Restaurant's serving game, and what it's for.** Guests arrive in waves. You seat them, take each order, bring
the dish from the hatch and clear the table, and tips go up with speed. The server is an Uma running between tables, which
is the HD-2D run reused. A play lasts about 60 seconds. What it serves is the farm's own:
- **Recommended:** the Restaurant serves the crew. A good shift gives your Umas a **"well fed" boost**, working faster
  (×1.25 for a few hours) and growing their Craft Level faster. It gives the farm an economy loop with no currency (FS8):
  Vegetables and Fish become meals, meals make the crew faster, and the crew makes more.
- **Alternative:** guests pay tips, which become a farm currency spent on boosts. It needs a currency, which FS8 rejected.

**FR20: the Forge's game** is the owner's pick from popular mobile genres. Each would be an original game with our own
rules, art and names:

| Genre | How it plays here | Fit |
|---|---|---|
| **Merge** (recommended) | Made items drop on a board; drag two alike together to merge them up a tier, and the forged item is the top tier. A play ends when the board fills | Merging reads as forging; it's calm and one-thumb |
| Match-three | Swap neighbours to match three; matches charge the item | Familiar; luck in the refills (FR21) |
| Block-fit | Fit falling shapes into a mould; full lines temper the piece | Skill-heavy; it needs care to stay one-thumb |
| Stacking | Drop each layer on the last as it slides; misses shave it | One tap; it may feel thin over a whole play |

**FR21: one contract for every minigame,** from FM9 and the spec's FS16–FS17, so the rules don't change per game:
- a play is **30–90 seconds**, on a seed the game shows, so a board can be learnt and luck never decides the result alone;
- it scores **0–100**: Rough below 50 (the base yield), Good 50–74 (×1.25), Fine 75–89 (×1.5), Masterwork 90+ (×2);
- **inputs are never lost:** the yield never falls below the base, and an unfinished play counts as Rough with no
  retries (FS17);
- a play costs its inputs only, and there's a practice mode with no inputs and no yield;
- it runs one thumb in portrait, with timing from `pointerdown`.

**FR22: rules first, scenes after.** Each minigame's rules (its seeds, scoring and tiers) are pure code in `@farm/domain`
with tests, before any scene draws them. The scene plays the events back, as the platform's rule asks. This work needs
no engine, so it can start before the stage package exists (FR2). The doc's page has a playable sketch of the Kitchen
and the Restaurant for the owner to try before anything is built.

## 6. Parcels and the Post (FR23)

**FR23: unchanged.** The accept lists, the caps and `uma-post` (FS22–FS27) don't depend on how the farm is drawn, so PO1
goes ahead as written. The Post becomes a building on the farm, and its screens are a sheet (FS28–FS31). The spec's
recipes (FS13) move to the workshops above: Kitchen, Party Meal and Tonic; Forge, Revive and Rosette.

## 7. The order (FR24)

**FR24: the queue, once the owner answers.** In order:

1. **The owner reviews this doc and picks the minigames' genres.** Nothing is requested or built before.
2. **Requests**, on the owner's yes:
   - to uma-platform: the shared stage (FR1), with portrait, open kit kinds, standees and the live-set cap; its
     P-decision amending P90 and P14;
   - and later: the farm-work add-on (FR11).
3. **F7 is rewritten:** spec §4 becomes the workshops and their minigames, with their numbers. §1–§3, §5 and §6 stand
   with small edits.
4. **Packets:**

| Id | What | Needs |
|---|---|---|
| F8 (re-scoped) | **The minigame contract and the Kitchen:** FR21's rules and the cooking game's rules in the domain, then its scene | The owner's answers; its scene needs the stage |
| F9 (re-scoped, ChatGPT) | **Art: `kit-farm`** (plots, props, buildings, the workshops, the Gate) to the farm's contract | F16's contract (below), the owner's look |
| F10 | **Parcels, the sender** (unchanged) | F8, PO1 |
| F11 | **The farm on the shared stage:** Home becomes the HD-2D farm on a stand-in kit, the frame and sheets kept | uma-platform's stage package |
| F12 | **Umas at work:** sprites and standees, walking and running, the taps, Ready bubbles, the live-set cap | F11 |
| F13 | **The Restaurant's serving game,** and the "well fed" boost | F8's contract, F11 |
| F14 | **The Forge's game** (the owner's genre) | F8's contract, F11 |
| F15 | **The farm-work animations** (a request to uma-platform's sprite pipeline) | F12, the owner's go |
| F16 | **`kit-farm`'s contract** (written here, for F9) | The owner's answers |

**What can start at once, before the engine:** F16 (the kit's contract) and F8's rules (the contract and the cooking
game's scoring). Everything that draws on the stage waits for the package.

## Risks

| Risk | What keeps it small |
|---|---|
| The engine's frame rate or battery isn't good enough | The extraction waits for uma-quest's measured plays (FR2); battery saver by default; the farm measures itself before raising the sprite cap (FR13) |
| The extraction takes a long time | The farm plays on today's map meanwhile; the minigame rules and the kit's contract go first (FR2, FR22) |
| Most Umas have no sprite for a long time | Standees are a designed look, not a hole; each batch turns more into walkers (FR12) |
| Sixty Umas are too many to draw | At most 8 live sets; the rest are standees (FR13) |
| The minigames aren't fun | The owner plays sketches before anything is built (FR22), and each is a well-known genre |
| A minigame copies a real game | Each is an original game in a genre, with its own rules, art and names (FR20) |
| The farm kit doesn't fit uma-quest's format | Its three openings are in FR1's request (FR15) |

## Notes from drawing the page (D23)

Drawing [the page](previews/hd2d-farm.html) to scale turned up eight gaps. Each is settled here, or names where it will be:

| # | Gap | Settled |
|---|---|---|
| 1 | Three places × 3 tiles fill all 9 tiles, leaving no path up between columns | Each column keeps a narrow lane on its edge, as the page draws it; F11 sets the exact tiles |
| 2 | A storey's front (256 texels) hides about 3.5 tiles behind it at 35°, more than a 3-deep row | Slots stand on the near (south) side of their place, and line buildings are one storey, so no slot is ever hidden |
| 3 | At true scale (about 73 px a tile deep) a 27-tile farm is about one screen | FR6's pan matters as the farm grows (core-loop FC28) and while a sheet is open; it stays |
| 4 | The Kitchen's recipes are open; FS13's made items don't read as ingredients | Settled by [core-loop.md](core-loop.md) FC14: dishes from the farm's own crops, products and fish; F7's rewrite gives the recipes |
| 5 | The "well fed" boost has no tier rule or base | Settled by core-loop FC15: it's the Kitchen's staff meal, ×1.25 for 4 h at Rough, longer by tier; F7 sets the ladder (the page's sketch uses 2 h, as an illustration) |
| 6 | FR24's order puts F9 late, though it needs only F16's contract; F10 would wait on F8's scene | F9 follows F16 straight away, before the stage. F10 is parked anyway (core-loop FC31, D22) |
| 7 | Two Forges: the Weapon Forge (a making place) and the workshop Forge | The making places are renamed with the farm's own goods (core-loop FC7, FC31); the workshop keeps "Forge" |
| 8 | Which Uma works a workshop, and whether she leaves her slot | A workshop has one **assistant post**: you pick the Uma when you start a play, and she holds no other slot meanwhile; her rank in that workshop lifts the yield (core-loop §4's "Assist") |

## Calls

| Id | Call |
|---|---|
| FR1 | uma-quest's HD-2D stage becomes a shared uma-platform package (working name `uma-stage`), extracted on second use; never copied or imported by the farm |
| FR2 | The extraction waits for uma-quest's engine to pass its measured plays; the farm plays on today's map until then |
| FR3 | The farm stays portrait, on an unturned stage, about 9 tiles across |
| FR4 | One engine: the farm and its minigames run on the shared stage; Phaser leaves with the Hub map |
| FR5 | The layout: five lines in rows of three, a workshop row, the Warehouse, the Gate and the Post, 9 tiles wide |
| FR6 | The camera pans up and down only and settles on a row; no zoom |
| FR7 | uma-kit's frame and bars stay over the stage |
| FR8 | A place's page is a sheet over the farm with uma-kit's work screens |
| FR9 | The taps: place → slot → Uma; tap a Ready bubble to collect; Recall sends her running out |
| FR10 | Uma-quest's field walks and runs reused whole: walk in, stand and nod at work, wave when done, run out |
| FR11 | Farm-work poses come later, as a sprite-format add-on, on the owner's go |
| FR12 | An Uma without a sprite set is a standee (her face on a card); every outfit still works |
| FR13 | At most 8 live sprite sets, nearest the centre; sets cached by hash; battery saver by default |
| FR14 | The scene draws the save's work rows and never changes them |
| FR15 | The farm's art is a kit in uma-quest's format: plots as floors, crops and ore as props, buildings from modules |
| FR16 | The farm writes `kit-farm`'s contract; ChatGPT draws it in uma-art; a stand-in kit until then |
| FR17 | The loop ends in workshops with minigames: Kitchen, Restaurant, Forge |
| FR18 | The Kitchen's minigame is a time-management cooking game; it makes Party Meals and Tonics |
| FR19 | The Restaurant's minigame is a serving game; it serves the crew a "well fed" boost (recommended) |
| FR20 | The Forge's genre is the owner's pick; merge is recommended |
| FR21 | One contract: 30–90 s, a shown seed, a score 0–100 to four tiers, inputs never lost, practice mode |
| FR22 | Minigame rules are pure and tested first; the owner plays sketches before scenes are built |
| FR23 | Parcels, accept lists, `uma-post` and the Post's rules are unchanged; the Post becomes a building |
| FR24 | The queue: owner's review, the requests, F7 rewritten, then F16 and F8's rules, then F11, F12, F8's scene, F13, F14, F9, F10 |

## Questions for the owner

Each has a recommended answer; accepting it or changing it is enough.

| # | Question | Recommended |
|---|---|---|
| 1 | Share the engine through uma-platform, waiting for it to be measured, rather than copying it into the farm now? | **Yes, share it** (FR1, FR2) |
| 2 | Keep the farm portrait? | **Yes** (FR3) |
| 3 | Umas without a sprite set work as standees, so every outfit still works? | **Yes** (FR12) |
| 4 | Run the minigames on the same HD-2D stage, dropping Phaser? | **Yes** (FR4) |
| 5 | Three workshops to start: Kitchen, Restaurant, Forge? | **Yes** (FR17) |
| 6 | The Kitchen's game: a time-management cooking game, about 60 s? | **Yes** (FR18) |
| 7 | The Restaurant serves your own crew a "well fed" boost (×1.25 for a few hours), rather than earning a currency? | **Yes** (FR19) |
| 8 | The Forge's genre: merge, match-three, block-fit or stacking? | **Merge** (FR20) |
| 9 | Ask for farm-work poses only after the farm runs on the stage? | **Yes** (FR11) |
| 10 | Start now with the kit's contract and the minigames' rules, before the engine? | **Yes** (FR2, FR22) |
