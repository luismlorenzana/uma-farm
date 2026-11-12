# F11 — The farm on the shared stage: Home as the HD-2D farm, on the stand-in kit

**uma-farm · Claude · M · Needs: uma-stage 0.3.0 ✓ (F57, D65; ST3, D68) · Uses F9's `kit-farm`
when it has shipped, else the stand-in · Unblocks: F12 (Umas at work) · Milestone M7, the HD-2D farm**

> **One piece, checked back with the owner (D61).** This packet draws the farm on the stage: places, crops, the
> homestead and the seasons. The Umas walking to their slots are F12's. It's an **opt-in preview** in every build, so the
> owner can try it on the phone while Home stays uma-kit's Hub for everyone else (decision 1).

## Why

The farm moves onto the HD-2D stage (M7, [hd2d-farm.md](../../design/hd2d-farm.md), accepted D21; led by the owner,
D61). The stage now exists as `@luismlorenzana/uma-stage` 0.2.1, with the farm's openings: a portrait layout, the
`farm` kit kind, `parseFarmDesign`, `BandStage`, taps, walkers, standees and grades (D64, D65). The farm kit's contract is
written (F16, [kit-farm.md](../../design/kit-farm.md)), and a stand-in of every frame ships with the stage
(`standInFarmKit()`). This packet puts the farm on it.

## Context (read first)

- [hd2d-farm.md](../../design/hd2d-farm.md):
  - FR3 (portrait), FR4 (one engine on the device), FR6 (the camera), FR7 (the frame stays uma-kit's), FR8 (a place's
    page becomes a sheet over the farm), FR13 (battery);
  - the revision note at its top.
- [kit-farm.md](../../design/kit-farm.md) ([page](../../design/previews/kit-farm.html)), KF1–KF14:
  - KF2's layout and its two findings;
  - KF4's recipes, KF5–KF7 (one look, crop families, overgrown lots), KF10 (seasons as light), KF14 (the names are the
    API).
- uma-stage 0.2.1's README, ["The farm's openings"](https://github.com/luismlorenzana/uma-platform/blob/main/packages/stage/README.md#the-farms-openings-020-st2),
  and its review page, uma-platform's `docs/stage/previews/farm-band.html`. `SAMPLE_FARM` is a 9 × 25 stand-in band
  built the way this packet builds the farm.
- [decisions.md](../../decisions.md):
  - D61 (the owner's pace);
  - D62 (F16), D64 and D65 (the stage's releases and the two findings), D66 (art);
  - D31 (g) and D53 (the map's places and pips);
  - D54 (the homestead's rows).
- The manual: [days.md](../../game/days.md) (the map, Tonight), [architecture.md](../../game/architecture.md).
- Code:
  - `apps/web/src/loop/FarmMap.tsx`: today's Home on uma-kit's `HubMap`. It builds every place's `HubMapPlace` (name,
    frame, position, pips, busy, lock, link), the Gate's pips, the Fields' pips, the homestead's rows on v4 and the
    quick looks. F11 keeps all of that and swaps only the renderer.
  - `loop/farm-map.ts` (`placeLink`, `lockOf`, `placeAt`, `PLACE_SCREENS`) and `loop/homestead-map.tsx`.
  - `@farm/domain`'s `farm/places.ts` (`FARM_PLACES`, `FARM_MAP_ROWS`, `placeOpen`), `romance/homestead.ts`
    (`HOMESTEAD_PLACES`, `homesteadShown`) and `fields/` (blocks, plots, crops).

## The stage request (uma-platform ST3), sent with this packet

> **Shipped: uma-stage 0.3.0** (uma-platform P146, 2026-11-12), both options off unless asked: `fade: true | { opacity,
> markers, ms }` (a marker counts by the middle half of its tile), plus `setFadeMarkers(kinds | predicate)` to change which
> markers count at any time; and `fit: 'width'` (0.65 at 375 pt on 2×, 0.72 at 414 pt; never up; the kit mipmapped only
> while scaled, sprites nearest). uma-quest pins 0.3.0 unchanged (its D57). Its finding: with the default kinds on KF2's
> layout, 7 of the sample's 10 buildings cover some slot and stand faded at rest, so decision 7 narrows the targets.

uma-stage 0.2.1's two findings (D65) are the farm's to settle. Both are settled by **two opt-in stage options**, asked of
the uma-platform session as "Both apps" (ST3, a uma-stage minor). uma-quest changes nothing.

1. **An occluder fade.** A building or a blocking prop whose screen area covers a target fades to a set opacity (default
   0.35) while it covers it, easing in and out over about 150 ms, and instantly with reduced motion.
   - Targets are live figures, markers of the kinds the game names (`slot`, `gate`, `lot`), and bubble anchors
     (`headOf`).
   - It's off by default.

   **Why:** at 35° a one-storey roof hides about 4 tiles behind it, so KF2's 4-tile bands hide the band above's apron,
   path and slots. Deeper bands don't fit 48 tiles (8 bands and 3 homestead rows are 44).
2. **Fit-to-width.** `BandStage`'s `fit: 'width'` scales the orthographic camera so the design's width fills the canvas
   when the canvas is narrower than the design at one texel a pixel. It never scales up, and kit textures are mipmapped
   while scaled.

   **Why:** 9 tiles are 1,152 px, wider than a 2× phone (750 to 828 px), which would show only the middle 6, and FR6
   allows no sideways pan. `kit-farm` is painted full colour (D66), so it scales cleanly. 3× phones stay at one texel a
   pixel.

**Done for ST3:**
- the farm-band sample at 375 pt on a 2× screen shows all 9 tiles;
- a figure behind a roof shows through it;
- uma-quest is unchanged.

The main session sends ST3 to the uma-platform session with the owner's go, as F57 was sent. **F11 builds once ST3 has
shipped.**

## Decisions made

### From the specs

- **FR3, KF2:** portrait, on an unturned stage (`<TurnedStage layout="portrait">`), 9 tiles across, today's 8 map rows
  plus the homestead's 0–3 rows on a v4 save in the romance build. Each band is 4 tiles deep: a 3 × 3 plot a place and a
  path row. The ground is level 1; the pond and the quarry pit are level 0; the Mine's cliff is a `#` wall.
- **FR6:** the camera pans up and down only. A flick glides and settles on a band (`BandStage`'s built-in). There's no
  zoom beyond ST3's fit-to-width.
- **FR7, FR8:** uma-kit's frame stays (the account bar, the bottom bar, the sync warning, the Collect all pill, the help
  button). A place's tap opens what it opens today, as a page or a sheet.
- **FR4, FR13:** one canvas engine at a time. Home on the stage never loads Phaser's Hub. Battery saver is on by default.
- **KF4–KF7:** every place from its recipe; places keep one look; crops by family; a place not yet open is an
  overgrown lot.
- **KF10:** seasons are the stage's grade (`setGrade`), not tiles.
- **KF14:** the kit's names are the API. The farm draws `standInFarmKit()` until F9's `kit-farm` ships, then pins it, and
  a missing frame falls back to its stand-in.

### Decided here

1. **An opt-in preview in every build.** A per-device switch, **Account → "HD-2D farm (preview)"**, off by default, read
   at boot and remembered on the device (`localStorage`, wrapped so a private window just reads "off"). `?stage=1` and
   `?stage=0` set it too.
   - With it on, Home draws the stage. With it off, Home is uma-kit's Hub, byte for byte as today.
   - The stage and three.js load lazily only when it's on, so neither build's main JS grows by more than the switch.
   - It works in the deployed M4 build and the romance build alike, so the owner can try it on the phone without a
     special deploy.
   - Rules never read it, and the save never changes because of it.
2. **The design is built in the domain:** `farmDesign(save, opts) → FarmDesign`, pure, in `@farm/domain`, typed from
   `@luismlorenzana/uma-stage/formats`, which is pure with no three.js, so the domain stays free of the engine. It
   follows KF4's recipes table row for row:
   - **open places:** their recipe, with a `place` marker on their apron and one `slot` marker for each of their work
     slots (four for a work place; the Fields' per block);
   - **places not yet open:** an overgrown lot (KF7) with their `place` marker kept, so a tap still shows what opens
     them;
   - **the homestead on v4:** the Farmhouse, every built house and the next lot (`lot-stakes`, a `lot` marker),
     matching `homesteadShown`;
   - **the Gate:** its arch and a `gate` marker on the bottom path, which every slot and path point must reach
     (`parseFarmDesign` checks it);
   - **the paths:** a path row under each band, a lane at each column's edge, and the spine to the Gate.

   A test parses the design for a fresh v3 save, a played v3, a v4 with three houses, and every place open. It also runs
   `farmProblems(design, standInFarmKit())`, which must come back empty.
3. **Crops per plot:** the Fields' plots map to tiles inside the Fields' 3 × 3 plot, in the block order the Fields'
   screen uses. Each plot shows `crop-sprout`, `crop-growing` or its family's ripe frame from its growth and the crop's
   family, `crop-withered` when withered, and bare `tilled` when empty. A table maps CS11's 27 crops to KF6's families,
   with a test that every crop has one. More plots than the plot's tiles show the first ones, and the Fields' sheet
   still lists all.
4. **Names and pips stay uma-kit's,** as React overlays projected from each `place` marker (`project`). Each place's name
   chip, lock and pips are the same models `FarmMap` builds today (`HubMapPlace`'s pips, busy state and lock), so a
   working Uma's face ring, a Ready ♥ and the Gate's visitor read exactly as on the Hub. They follow the camera and hide
   when off screen.
5. **Taps:** a tap's hit list is read nearest first.
   - **A place:** its `place` marker or building opens `placeLink(...)`, as the Hub's place button does.
   - **A lot:** opens the homestead's sheet.
   - **A slot:** opens its place.

   A drag never taps. The quick look (`?peek=`) stays a long-press, as on the Hub.
6. **Seasons:** four `StageGrade`s from `DAY_GRADE`, tuned on the stand-in: spring fresh and soft, summer bright and
   warm, autumn an amber tint, winter cold and pale with stronger lamps. The calendar's season sets one at load, and End
   the day's morning eases to the next one over a second (instant with reduced motion).
7. **ST3's options are on, the fade narrowed:**
   - fit-to-width is on;
   - the fade's targets are figures (F12's, later) and, through `setFadeMarkers`, **only the slots of the place whose
     sheet is open**.

   At rest nothing stands faded, so the farm reads whole. When you open a place, the roofs in front of its slots fade so
   you see them.
8. **The scroll position:** Home opens on the band of the first place with a Ready Uma, else the Fields, and keeps its
   position between visits for the session (the Hub's behaviour).
9. **Size and battery:**
   - the main JS must stay ≤ 180 KB gzip in both builds, with the stage chunk measured and named in D-decision;
   - the stage stops when Home is hidden (another tab, a full sheet, the app in the background) and starts again on
     return;
   - saver is on by default.

## Do

1. **The design:** `farmDesign`, the crop families, the recipes as data, with tests (decision 2, 3).
2. **The stage Home:** `FarmStage.tsx` (lazy): `TurnedStage` (portrait), `BandStage` with the design, the kit (the
   stand-in, or `kit-farm` if pinned), the grade, the overlays and the taps (decisions 4–8).
3. **The switch:** Account's row, `?stage`, and Home choosing the renderer (decision 1).
4. **Pin** `@luismlorenzana/uma-stage` 0.3.0 (exact) and `three` 0.187.0 in `apps/web`, both lazy. Add them to
   `LAZY_MODULES` and the size checks.
5. **The manual:** [days.md](../../game/days.md) (the farm's two looks, the switch), and
   [architecture.md](../../game/architecture.md) (the stage, the design, the kit, the preview switch).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass in both builds, the main JS is ≤ 180 KB gzip in each, and the stage
  chunk is named in the D-decision.
- With the switch off, Home is unchanged: M4's tests and the romance's pass as they are.
- With the switch on, locally at 390×844, 375×667 (a 2× screen) and 430×932:
  - the farm draws all 9 tiles on the stand-in, every place by its recipe, locked ones overgrown;
  - the Fields' crops show their stages and families;
  - the homestead's rows show on a v4 save in the romance build;
  - names and pips follow the camera;
  - a tap on each place opens what the Hub's opens;
  - with a place's sheet open, its slots behind a roof show through it, and at rest nothing is faded (ST3, decision 7);
  - the season's grade changes after End the day crosses a season;
  - the frame and the Collect all pill sit where they do today.
- **The owner's phone look**, one line: "Turn on Account → HD-2D farm (preview) at uma-farm.web.app on your phone, scroll
  the farm, tap a place, end a day."

## Deliver

Branch `feat/f11-farm-stage` and a pull request for the main session to merge and deploy. In the branch:
- delete this packet;
- mark its queue row Done and add a Done row in [the handoff](../README.md) (the stage chunk's size, the kit used);
- log the D-decision in [decisions.md](../../decisions.md), fetching `main` first for the number.

After the deploy, the main session asks the owner for the phone look.

## Rules that hold

- **Home for everyone stays the Hub until the owner says otherwise.** The switch is a preview; turning the stage on by
  default is a later call after F12 and the owner's look.
- **Rules and the save don't change:** the stage only shows the save (FR14). No save version moves.
- **No original-game content:** no Uma art in tests or screenshots committed. Screenshots with real master-data faces
  stay local.
- **Don't fork uma-stage, uma-kit or uma-work.** A missing option goes to the uma-platform session as a "Both apps"
  request.
- **Main JS ≤ 180 KB gzip in both builds;** the stage loads on demand.
- **GitHub API budget:** never poll faster than every 30 s.

## Left to the worker

- the exact tiles: the lanes, the spine, where each recipe's building sits in its plot, the Gate's opening;
- the grades' numbers;
- the overlay chips' styling within uma-kit's;
- how the Fields' plots fill the tiles;
- the long-press timing;
- anything the stage's README leaves to the game.
