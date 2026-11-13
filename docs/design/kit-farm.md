# kit-farm: the farm kit's contract

> The contract `kit-farm` is drawn to: the full-colour 2D art the HD-2D stage builds the farm from, in uma-quest's kit
> format. Claude draws it in code from this doc, as a uma-art family, in two waves
> ([F9](../handoff/tasks/F9-kit-farm.md)). **Wave 1 has shipped** (uma-art 2.27.0) and the farm draws it; **wave 2 is
> open.** Until a frame ships, the stage's stand-in kit draws it in flat colours under the same name. Visual page:
> [kit-farm.html](../pages/kit-farm.html).
>
> It rests on:
> - uma-quest's kit spec, [kits.md](https://github.com/luismlorenzana/uma-quest/blob/a88838b/docs/design/kits.md) (the
>   format: atlas, roles, sizes, style, delivery). The link is its last version: uma-quest has since retired the doc,
>   and the code, uma-stage's, is the final word;
> - the HD-2D farm as it plays ([game mechanics](../game-mechanics.md#the-hd-2d-farm-an-opt-in-preview));
> - the farm as built: `farm/places.ts`'s 23 places and `romance/homestead.ts`'s homestead;
> - the openings uma-stage 0.2.1 made for a farm
>   ([its README](https://github.com/luismlorenzana/uma-platform/blob/main/packages/stage/README.md#the-farms-openings-020-st2)).

## The short answer

- **One kit, `kit-farm`, of a new kind `farm`,** in uma-quest's format:
  - 128-texel tiles;
  - a camera at 35° from the south that never turns, so only tops and south faces are drawn;
  - props as upright cards;
  - full colour, lit from the top front-left.
- **It's drawn for the farm as it plays today:** 23 places on 8 rows, plus the homestead's up to 3 rows, laid out
  portrait, 9 tiles across: three plots of 3 × 3 tiles a row.
- **Buildings are built, not painted whole:** a building's front is put together from modular wall, window, door and
  roof pieces. There are three wall materials (plank, plaster, stone) and four roof colours (red, thatch, shingle,
  slate). One or two **landmark props** tell each place apart: the Mill's sails, the Forge's anvil.
- **Places don't change with work:** the Umas at their slots and the kit's Ready bubbles show what's happening. Only
  crops grow, and they're drawn by **family** (12 ripe shapes for 27 crops), not one by one.
- **A place that isn't open yet is an overgrown lot:** weeds, brambles and a broken fence, cleared when it opens. That's
  the farm's own opening, "The Overgrown Farm", and it lets wave 1 ship without the later places' pieces.
- **Two waves:**
  - **wave 1** (87 frames, shipped) is everything chapter 1 opens, and the romance's homestead: the Fields, the forest,
    the Fishery, the three stations, the yard, the Shop and the homestead;
  - **wave 2** (30 frames, open) is the places the later chapters open: the ranch, the Mine and the Quarry, the Smelter
    and the Cutter, the Kitchen, the Restaurant, the Forge, the board, the festival ground and the expedition post.

## 1. The farm it's drawn for (KF1, KF2)

**KF1: one kit, kind `farm`.** `kit-farm` ships as a uma-art family in uma-quest's format (kits.md §2–§5), with four
openings the farm needed of the shared stage, shipped in uma-stage 0.2.1
([its README](https://github.com/luismlorenzana/uma-platform/blob/main/packages/stage/README.md#the-farms-openings-020-st2)):
1. **A third kind, `farm`,** with its own required list (§6).
2. **A `set` on building pieces,** so a design can pick a building's material.
3. **Doors two columns wide** (256 × 256).
4. **Mounted pieces placed by the design** at a level and column on a front, beyond the town format's sign beside the
   door.

Everything else is kits.md as written:
- tile 128;
- one level = one tile high, a wall = two levels;
- variants picked by a position hash;
- 2 px between frames;
- `foot`, `blocks` and `light` on props.

**KF2: the layout, portrait, 9 tiles across:**

```
 ┌────────── 9 tiles: three plots of 3 × 3, a path row under each band ──────────┐
 │ 1  Fields          │ Mill              │ Coop ▒            │  crops · grain · eggs
 │ 2  Forest          │ Sawmill           │ Barn ▒            │  wood · planks · milk
 │ 3  Fishery         │ Smokehouse        │ Kitchen ▒         │  fish · fillets · dishes
 │ 4  Mine ▒          │ Smelter ▒         │ Restaurant ▒      │  ore · ingots · gold
 │ 5  Quarry ▒        │ Cutter ▒          │ Forge ▒           │  stone · gems · tools, rings
 │ 6  Shipping bin    │ Warehouse         │ Dorm              │  the yard
 │ 7  Requests board ▒│ Gate ▲            │ (open ground)     │
 │ H  Farmhouse       │ House 1           │ House 2           │  the homestead (the romance):
 │ H  House 3         │ House 4           │ House 5           │  0–3 rows, a row at a time
 │ H  House 6         │                   │                   │
 │ 8  Shop            │ Festival ground ▒ │ Expedition post ▒ │  the town edge, always last
 └───────────────────────────────────────────────────────────────────────────────┘
   ▒ = not open yet (a wave-2 place): drawn as an overgrown lot until it opens (KF7)
```

- **Rows are today's map rows** (`FARM_MAP_ROWS`; [game mechanics](../game-mechanics.md#home-the-farm-map)), gather →
  process → make from left to right. The homestead's rows sit between the yard and the town.
- **A band is 4 tiles deep:** a 3 × 3 plot for each place, then a path row. The farm is 32 to 44 tiles tall.
- **In each plot,** a building stands on the back two tiles, facing south onto the **apron**, the front row of tiles
  where its slots are and the Umas stand.
- **Levels:** the farm's ground is **level 1**. The pond and the quarry pit are **level 0**, so their banks are risers
  from the geometry with no edge art (kits.md: edges and corners come from the geometry, not autotile masks). The Mine's
  cliff is a `wall` along its plot's back.
- **The farm's layout code sets the exact tiles:** the lanes between columns, the Gate's opening and the path network
  ([game mechanics](../game-mechanics.md#the-farm-laid-out-from-the-save)).
- **Two things the stage handles, not the kit:**
  - at 35° a one-storey roof hides about 4 tiles behind it (a two-storey about 7, the Gate's arch about 5), so 4-tile
    bands hide the band above's apron and path; the stage fades what stands in front
    ([game mechanics](../game-mechanics.md#light-fade-and-the-camera));
  - 9 tiles (1,152 px at one texel a pixel) overflow a 2× phone (750 to 828 px); the stage fits the farm to the phone's
    width.

  Neither changes a frame in this contract.

## 2. Buildings (KF3, KF4)

**KF3: fronts from modular sets.** A building is a box the builder makes:
- its south face, from `building-wall`, `window` and `door` pieces, one level a module;
- a roof slope, from `roof` pieces.

Each piece belongs to a **set** (the stage's second farm opening), and a building names its wall set and roof set:

| Set | Kind | Look | Used by |
|---|---|---|---|
| `plank` | Walls | Weathered vertical boards, a darker sill | The Sawmill, the Smokehouse, the Warehouse, the Coop, the Barn, the Expedition post |
| `plaster` | Walls | Warm whitewash on a stone footing, timber corners | The Mill, the Dorm, the Kitchen, the Restaurant, the Shop, the Farmhouse, the houses |
| `stone` | Walls | Rough grey stone, mortar lines (wave 2) | The Smelter, the Cutter, the Forge |
| `red` | Roof | Red clay tiles | The Warehouse, the Barn, the Dorm, the Kitchen, the Farmhouse |
| `thatch` | Roof | Golden straw, a rounded ridge | The Mill, the houses |
| `shingle` | Roof | Green-brown wooden shingles | The Sawmill, the Coop, the Restaurant, the Shop, the Expedition post |
| `slate` | Roof | Blue-grey slate | The Smokehouse, the Smelter, the Cutter, the Forge |

Each wall set holds two `building-wall` variants, two `window` variants and one `door` (128 × 256). The `plank` set adds
a **wide door** (`door-wide-plank`, 256 × 256: the Warehouse's and the Barn's double doors). The `plaster` set adds the
Shop's glazed door (`door-shop`). Each roof set holds two `roof` variants.

**KF4: each place is a recipe and its landmarks,** with no signs and no words. Place names are the name pills over the
stage ([game mechanics](../game-mechanics.md#names-locks-badges-and-pips)), so nothing in the kit is written, and a
renamed house needs no art.

| Place | Plot | Building (walls · roof · width × storeys · door) | Landmarks | Wave |
|---|---|---|---|---|
| Fields | Tilled soil, the crops (KF6) | — | `scarecrow` | 1 |
| Mill | Grass | plaster · thatch · 2 × 1 · door | `mill-sails` (mounted on the gable) | 1 |
| Coop | Paddock dirt, fences | plank · shingle · 2 × 1 · door | `trough` | 2 |
| Forest | Forest floor | — | `tree-1`–`3`, `stump`, `mushroom-patch`, `herb-patch` | 1 |
| Sawmill | Grass | plank · shingle · 2 × 1, open-fronted (windows only) | `log-pile`, `saw-bench` | 1 |
| Barn | Paddock dirt, fences | plank · red · 3 × 2 · door-wide | `hay-bale` | 2 |
| Fishery | The pond (water, level 0) | — | `dock`, `reeds` | 1 |
| Smokehouse | Grass | plank · slate · 2 × 1 · door | `smoker` | 1 |
| Kitchen | Grass | plaster · red · 2 × 1 · door | `chimney`, `herb-box` | 2 |
| Mine | Rock cliff at the back | — | `mine-mouth` (mounted on the cliff), `ore-cart`, `lantern` | 2 |
| Smelter | Grass | stone · slate · 2 × 1 · door | `furnace` (a live light) | 2 |
| Restaurant | Paving | plaster · shingle · 3 × 2 · door | `awning` (mounted), `cafe-table` | 2 |
| Quarry | The pit (quarry floor, level 0) | — | `quarry-rock-1`, `quarry-rock-2`, `stone-stack` | 2 |
| Cutter | Grass | stone · slate · 2 × 1 · door | `grindstone` | 2 |
| Forge | Grass | stone · slate · 2 × 1 · door | `anvil`, `forge-chimney` (mounted, a live light), `ring-bench` (the romance's) | 2 |
| Shipping bin | Grass | — | `bin` | 1 |
| Warehouse | Grass | plank · red · 3 × 2 · door-wide | `crates` | 1 |
| Dorm | Grass | plaster · red · 3 × 2 · door | `flower-box` (mounted under the windows) | 1 |
| Requests board | Grass | — | `notice-board` | 2 |
| Gate | Path | — | `gate-arch` (3 tiles wide), `fence-1`, `fence-2` either side | 1 |
| Shop | Paving | plaster · shingle · 2 × 1 · door-shop | `stall-awning` | 1 |
| Festival ground | Paving | — | `bunting`, `flagpole` | 2 |
| Expedition post | Grass | plank · shingle · 2 × 1 · door | `signpost`, `flagpole` | 2 |
| Farmhouse | Grass | plaster · red · 3 × 2 · door | `porch`, `chimney`, `flower-box` | 1 |
| House 1–6 | Grass | plaster · thatch · 2 × 1 · door | `flower-box`, `chimney` | 1 |
| An empty house lot | Grass | — | `lot-stakes` | 1 |

**One drawing for every house:** the six houses share their recipe, and each is named by the player, so nothing about a
house is drawn on it. A locked lot (the next house you can build) is `lot-stakes`. The engine dims a building that isn't
built yet, as the Hub does today.

## 3. Work, crops and locked places (KF5–KF7)

**KF5: places keep one look; the Umas show the work.** The Umas make the farm move
([game mechanics](../game-mechanics.md#the-umas-on-the-farm)): an Uma walks in, stands at her slot with an emote, waves
when she's done, and a Ready bubble rises over her. A place therefore needs no empty, working and ready art of its own.
The kit draws each place once, and adds:
- `crates`, `barrel` and `sack` as the yard's stock;
- live lights (the furnace, the forge's chimney, the lanterns), which glow at night (the evenings);
- **crops**, the one thing that grows on the map (KF6).

**KF6: crops by family.** The Fields' plots each hold a crop at a stage. The kit draws:
- three shared stages: `crop-sprout`, `crop-growing`, and `crop-withered` (a crop left at a season's end,
  [game mechanics](../game-mechanics.md#withering));
- **twelve ripe families**, each a 128-wide card standing on its plot's tile.

The farm's code maps each of the 27 crops ([game mechanics](../game-mechanics.md#the-crops)) to its family:

| Ripe frame | Shape | Crops |
|---|---|---|
| `crop-root` | Leafy tops over soil, a shoulder showing | Carrot, Potato, Onion, Sugar Beet, Ginger, Peanut, Golden Carrot, Mandrake |
| `crop-leafy` | A round head of leaves | Cabbage |
| `crop-herb` | A low bushy clump | Mint, Basil |
| `crop-grain` | Tall golden stalks, heavy heads | Wheat, Oats, Barley, Rye, Buckwheat, Sunwheat |
| `crop-rice` | Bowing green-gold stalks | Rice, Moonrice, Wild Rice |
| `crop-staked-red` | A staked vine, red fruit | Tomato |
| `crop-staked-green` | A staked plant, green fruit | Bell Pepper |
| `crop-staked-purple` | A staked plant, purple fruit | Eggplant |
| `crop-corn` | Tall stalks, cobs | Corn |
| `crop-sunflower` | A tall stem, a big face | Sunflower Seed |
| `crop-spear` | Green spears | Asparagus |
| `crop-gourd` | A huge orange fruit on vines | Emperor Pumpkin |

The crop's own icon (uma-art's `items`) shows in the Ready bubble and the Fields' sheet, so a family never hides which
crop it is.

**KF7: a place that isn't open is an overgrown lot.** Its plot is drawn as grass with `weeds-1`, `weeds-2`, `brambles`
and a `fence-broken`, placed by the farm's layout. Its name pill shows the lock, as today. When it opens, the lot clears
and its recipe stands. This:
- tells the farm's story (it starts overgrown and you bring it back);
- lets wave 1 ship with only the places chapter 1 opens;
- costs four frames in place of twelve locked buildings.

## 4. Size, style and seasons (KF8–KF10)

**KF8: props at the sprites' density** (kits.md §3; a traveler stands about 1.6 tiles, 200 texels, tall):

| Frame | Size (w × h texels) | `blocks` | Notes |
|---|---|---|---|
| `tree-1`–`3` | 256 × 384 | yes | About 3 tiles tall, broad crowns, three different shapes |
| `stump`, `rock-small` | 128 × 96, 96 × 64 | yes, no | |
| `mushroom-patch`, `herb-patch` | 128 × 64 | no | Low ground clumps |
| `scarecrow` | 128 × 256 | yes | Hat and outstretched arms, no face |
| `crop-*` | 128 × 64–192 | no | One a plot tile, foot at the bottom middle |
| `dock`, `reeds` | 256 × 128, 128 × 128 | no | The dock reaches over the water |
| `mill-sails` | 384 × 384 | — | Mounted on the Mill's gable |
| `chimney`, `forge-chimney` | 64 × 192, 96 × 256 | — | Mounted on a roof; the forge's glows (light `#ff8a3d`, radius 3, flicker) |
| `smoker`, `furnace` | 128 × 192, 192 × 256 | yes | The furnace glows (light `#ff7b2e`, radius 4, flicker) |
| `log-pile`, `saw-bench` | 256 × 128, 192 × 128 | yes | |
| `bin` | 128 × 128 | yes | A wooden bin with a lid |
| `crates`, `barrel`, `sack` | 192 × 160, 96 × 128, 96 × 96 | yes | |
| `gate-arch` | 384 × 384 | no | Umas walk through it |
| `fence-1`, `fence-2`, `fence-broken` | 128 × 128 | yes, yes, no | Straight segments; the broken one leans |
| `stall-awning`, `awning` | 256 × 192, 384 × 192 | no, — | The Restaurant's is mounted |
| `porch` | 256 × 192 | no | Steps and a rail in front of the Farmhouse's door |
| `flower-box`, `herb-box` | 128 × 64 | — | Mounted under a window |
| `lot-stakes` | 384 × 128 | no | Four stakes and a rope around an empty plot |
| `weeds-1`, `weeds-2`, `brambles` | 128 × 128, 128 × 128, 192 × 160 | no, no, yes | |
| `flowers-1`, `flowers-2`, `bush-1`, `bush-2` | 128 × 64, 128 × 64, 160 × 128, 160 × 128 | no, no, yes, yes | Decorations the farm's layout scatters |
| `lantern` | 64 × 192 | yes | Light `#ffc46b`, radius 4, flicker |
| `mine-mouth` | 384 × 384 | — | Timber-framed, mounted on the cliff; the dark inside is part of the frame |
| `ore-cart`, `quarry-rock-1`–`2`, `stone-stack` | 192 × 160, 192 × 192, 192 × 128 | yes | |
| `grindstone`, `anvil`, `ring-bench` | 160 × 160, 160 × 128, 192 × 128 | yes | The ring bench is a small jeweller's bench beside the anvil |
| `trough`, `hay-bale` | 192 × 96, 160 × 128 | yes | |
| `cafe-table` | 192 × 160 | yes | Two chairs, a parasol |
| `bunting`, `flagpole`, `signpost` | 384 × 192, 64 × 384, 96 × 192 | no, yes, yes | |
| `notice-board` | 128 × 192 | yes | Pinned papers, no writing |

**KF9: the style is kits.md §5's,** with three farm notes:
- **warm and sunny:** greens and straw golds, as the Hub's farmlands page is today;
- **every building readable at a glance:** each place's wall set, roof colour and landmark together make it unique on
  its row;
- **no text and no Uma art:** even the notice board's papers and the Shop's sign are blank shapes.

**KF10: the seasons are the stage's light, not the kit's tiles.** The four seasons
([game mechanics](../game-mechanics.md#seasons-days-and-the-year)) change the light and a colour grade: a fresh spring,
a bright summer, an amber autumn, and a cold, pale winter. The engine does that live, so the kit is drawn once in a
neutral late-spring light. Snow on the roofs and bare trees in winter are a later wave, if the light alone doesn't sell
it.

## 5. What isn't in this kit (KF11)

**KF11: the kit is the farm's ground and buildings only.** These come from elsewhere:
- **Umas:** sprite sets from uma-platform's sprite pipeline, and standees for outfits without one.
- **Animals** (the Coop's and the Barn's): the ranch's work adds them to the stage, with a kit minor or a sprite request
  then ([the roadmap](../roadmap.md#phase-2-the-whole-farm)).
- **Items:** uma-art's `items` and the UI marks, drawn by uma-kit over the stage.
- **The minigames' scenes:** the Kitchen's counter, the Restaurant's floor and the Forge's board are their own kits,
  made with each workshop's game ([the roadmap](../roadmap.md#phase-2-the-whole-farm)).
- **The romance's event backdrops:** heart events keep their full-screen sheet
  ([game mechanics](../game-mechanics.md#heart-events-and-plays)) until the stage plays events (later work).

## 6. What the kit must hold (KF12)

**KF12: `kitMissing` for kind `farm`** (uma-stage 0.2.1's `KIT_REQUIRED.farm`, and `FARM_WAVE_2` for wave 2) checks wave
1's frames by name:
- **Roles:** `floor*`, `riser*`, `building-wall*`, `window*`, `door*`, `roof*`. Each of the `plank` and `plaster` sets
  has 2 walls, 2 windows and a door, and each of the four roof sets has 2 roofs.
- **Floors:**
  - `grass-1`–`4`, `path-1`–`2`, `tilled-1`–`2`, `forest-floor-1`–`2`, `water-1`–`2`, `paving-1`–`2` (14);
  - risers: `riser-grass-1`–`2` (a grassy lip) and `riser-bank` (wet stones over water) (3).
- **Buildings (20):**
  - `building-wall-plank-1`–`2`, `window-plank-1`–`2`, `door-plank`, `door-wide-plank`;
  - `building-wall-plaster-1`–`2`, `window-plaster-1`–`2`, `door-plaster`, `door-shop`;
  - `roof-red-1`–`2`, `roof-thatch-1`–`2`, `roof-shingle-1`–`2`, `roof-slate-1`–`2`.
- **Props (35):**
  - the forest: `tree-1`–`3`, `stump`, `mushroom-patch`, `herb-patch`;
  - the Fields and the Fishery: `scarecrow`, `dock`, `reeds`;
  - the stations: `mill-sails`, `chimney`, `smoker`, `log-pile`, `saw-bench`;
  - the yard and the town: `bin`, `crates`, `barrel`, `sack`, `gate-arch`, `fence-1`, `fence-2`, `fence-broken`,
    `stall-awning`;
  - the homestead: `porch`, `flower-box`, `lot-stakes`;
  - overgrown lots and decorations: `weeds-1`, `weeds-2`, `brambles`, `flowers-1`, `flowers-2`, `bush-1`, `bush-2`,
    `rock-small`, `lantern`.
- **Crops (15):** `crop-sprout`, `crop-growing`, `crop-withered`, and the twelve ripe families of KF6.

**Wave 1 is 87 frames.** Wave 2 adds **30**, and `kitMissing` checks them once the farm draws a wave-2 place on the
stage:
- **floors and walls (11):**
  - the `stone` set: `building-wall-stone-1`–`2`, `window-stone-1`–`2`, `door-stone`;
  - the Mine's cliff: `wall-rock` and `wall-top-rock`;
  - the Quarry's pit: `quarry-1`–`2` and `riser-quarry`;
  - the ranch's ground: `paddock`;
- **props (19):** `mine-mouth`, `ore-cart`, `quarry-rock-1`–`2`, `stone-stack`, `furnace`, `grindstone`, `anvil`,
  `forge-chimney`, `ring-bench`, `trough`, `hay-bale`, `awning`, `cafe-table`, `herb-box`, `bunting`, `flagpole`,
  `signpost`, `notice-board`.

Both waves fit in two 2048 pages (about 3.7 million texels of 8.4 million).

## 7. Delivery (KF13, KF14)

**KF13: delivered as kits.md §8 says, one uma-art minor a wave** ([F9](../handoff/tasks/F9-kit-farm.md)):
1. Draw the wave's frames to §2–§4, in KF9's style.
2. Pack them with the export script into `atlas.png` (and `atlas-1.png`) and `atlas.json`. Commit the masters and the
   script, so the export is the same byte for byte each run.
3. Make the review sheets:
   - the kit on light and dark;
   - a **sample band** (the Fields, the Mill and the Coop as an overgrown lot, with the path row under them), built by a
     stand-in render or uma-stage's builder;
   - a scale sheet with the stand-in traveler beside a door, a tree and the bin.
4. Release the uma-art minor. **The owner approves the look** (the gate). The first farm change that draws the wave
   pins the release and swaps out the stand-in's frames.

**KF14: the names are the farm's API.** The stage's stand-in kit draws every name in flat colours: soil brown, plaster
cream, red roofs. So the art swaps in with no code change, and a missing frame falls back to its stand-in rather than
breaking the farm.

## Calls

| Id | Call |
|---|---|
| KF1 | One kit, `kit-farm`, of a new kind `farm`, in uma-quest's format, with uma-stage's four farm openings (the kind, a `set` on building pieces, two-column doors, mounted pieces placed by the design) |
| KF2 | Portrait, 9 tiles across: three 3 × 3 plots a band and a path row; today's 8 map rows plus the homestead's 0–3 between the yard and the town; ground at level 1, the pond and the pit at level 0, the Mine's cliff a wall; the farm's layout code sets the exact tiles |
| KF3 | Buildings are modular fronts from three wall sets (plank, plaster, stone) and four roof sets (red, thatch, shingle, slate); plank adds a wide door, plaster the Shop's door |
| KF4 | Each place is a recipe (walls, roof, width × storeys, door) plus one or two landmark props; no signs, no words; one drawing for every house |
| KF5 | Places keep one look: the Umas at their slots and the Ready bubbles show work; lights glow at night |
| KF6 | Crops by family: three shared stages and twelve ripe families for the 27 crops; the crop's icon shows in its bubble |
| KF7 | A place not yet open is an overgrown lot (weeds, brambles, a broken fence) that clears when it opens |
| KF8 | Props at the sprites' density, sized as the table says |
| KF9 | kits.md's style; warm and sunny; each place unique on its row by walls, roof and landmark; no text and no Uma art |
| KF10 | Seasons are the stage's live light and grade, not repainted tiles; snow is a later wave if needed |
| KF11 | Not in the kit: Umas, animals (the ranch's), items and marks, the minigames' scenes, the romance's backdrops |
| KF12 | `kitMissing` for `farm` checks wave 1's 87 frames by name; wave 2's 30 are checked once the farm draws a wave-2 place |
| KF13 | Two uma-art minors, one a wave, delivered as kits.md §8 says, with a sample band; the owner approves the look; the first farm change that draws a wave pins it |
| KF14 | The names are the farm's API: the stage's stand-in draws every one, so the art swaps in with no code change |
