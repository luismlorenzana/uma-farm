# F9 — `kit-farm`: the HD-2D farm's kit, in two waves

**uma-platform's `packages/art` (uma-art) · Claude, in a uma-platform session · M · Needs: the contract,
[kit-farm.md](../../design/kit-farm.md), and the owner's go for wave 2 · Unblocks: the farm pins wave 2 and drops the
stand-in's last frames · [Roadmap](../../roadmap.md#phase-1-one-game-not-three): Phase 1, step 1.4**

> **Take it in a uma-platform session** ("Take F9, wave 2"). ChatGPT draws character art only, so the kit is
> **Claude's, drawn in code**, end to end: the drawing code, the export, the review sheets and the uma-art release.
> **Wave 1 has shipped** (uma-art 2.27.0, 87 frames): the farm pins it and the owner approved its look. **Wave 2 is
> open** and starts on the owner's go.

## Why

The farm is moving onto the HD-2D stage: uma-quest's engine, shared through uma-platform as uma-stage. The stage builds
a 3D-looking world from a 2D kit, so the farm needs one. The contract lists:
- every frame, with its role, size and foot;
- the places' recipes;
- the crop families;
- the overgrown lot;
- the two waves.

This packet draws it. Until a wave ships, the stage's stand-in kit draws its frames in flat colours by the same names
(today, wave 2's 30), so nothing waits on the art, and the art swaps in with no code change (KF14).

## Context (read first)

- **The contract:** [kit-farm.md](../../design/kit-farm.md) ([page](../../pages/kit-farm.html)), KF1–KF14.
  Every frame's name, role and size is there. §6 lists each wave's frames.
- **The format:** uma-quest's [kits.md](https://github.com/luismlorenzana/uma-quest/blob/a88838b/docs/design/kits.md)
  (its last version; the code, uma-stage's, is the final word):
  - the atlas and `atlas.json`, the roles and sizes, the style;
  - §8, how a kit is delivered.

  `kit-forest` (uma-art 2.23.0) is the model kit, drawn the same way.
- **Wave 1, which wave 2 extends:** uma-platform's `scripts/kit-art` (`pnpm art:kit-farm`), its tests, and its review
  sheets in `assets/authored/kit-farm/review/`.
- **The openings the farm kind needs,** shipped in uma-stage 0.2.1
  ([its README](https://github.com/luismlorenzana/uma-platform/blob/main/packages/stage/README.md#the-farms-openings-020-st2)):
  - kind `farm`;
  - a `set` on building pieces;
  - doors two columns wide;
  - mounted pieces placed by the design.
- **How the farm's other code-drawn art is made:** uma-platform's `scripts/pixel-art` (`pnpm art:draw`), its tests and
  legacy freezes. The kit is drawn the same way, deterministic code in place of painted masters, at full colour rather
  than pixel density.
- **The style references:**
  - uma-platform's sprites
    [format.md §10](https://github.com/luismlorenzana/uma-platform/blob/main/docs/sprites/format.md#10-style), the light
    and the shading;
  - today's Hub buildings on the farmlands page (uma-art's `buildings`: the Dorm, the shipping bin, the Farmhouse and
    the house), the farm's look in pixel form.
- **uma-platform:** its CLAUDE.md, its
  [change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md),
  `packages/art/README.md`, `packages/art/CHANGELOG.md`, and its rule for full-colour families: masters (or the code
  that draws them) committed, with a deterministic export.
- **The farm side:** [game mechanics](../../game-mechanics.md#the-kit) says how the farm loads the kit and which frames
  the stand-in still draws.

## Decisions made

### From the contract

- **KF1, KF12:** one family `kit-farm/`, `kind: "farm"`, tile 128, wave 1's 87 frames by the names in §6, then wave 2's
  30.
- **KF3, KF4:** buildings are modular fronts in sets. Walls are `plank`, `plaster` and (wave 2) `stone`; roofs are
  `red`, `thatch`, `shingle` and `slate`. Places are told apart by their landmarks. There are no signs and no words.
- **KF5–KF7:** places keep one look; crops come as three stages plus twelve ripe families; a place not yet open is an
  overgrown lot.
- **KF8–KF10:**
  - sizes at the sprites' density;
  - kits.md's style, warm and sunny;
  - seasons are the stage's light, so draw everything once in a neutral late-spring light.
- **KF13:** one uma-art minor a wave. The owner approves the look.

### Decided here

0. **Drawn in code, painted in look.** Each frame is drawn by deterministic code (layered shapes, gradients, seeded
   procedural textures for planks, plaster, stone, roof tiles, thatch, grass, soil and water; painted ambient occlusion
   and top-left highlights; antialiased edges into transparency), so the export is byte for byte the same each run and
   the code is the master. The cheapest look that reads well at one texel a pixel (lean assets).
1. **Two parts, one a wave.** Wave 1 was the first delivery and stood alone. Wave 2 adds its frames to the same family
   in a later minor, and every frame from wave 1 stays byte-identical (a legacy test, as the pixel families do).
2. **The family's layout** is kits.md §2's: `atlas.png`, `atlas.json`, `masters/`, the export script, and `review/`.
   **Wave 2 stays on the one 2048 page:** the farm's loader (`apps/web/src/loop/farm-kit.ts`) reads frames from the
   first page only, and a frame on `atlas-1.png` counts as missing. A second page needs that loader to learn it first.
3. **`atlas.json`'s new fields** follow uma-stage 0.2.1's parser (`parseKitAtlas`, `KIT_REQUIRED.farm`, `FARM_WAVE_2`):
   - each building piece carries `"set": "<set>"`;
   - a wide door is a `door` frame 256 wide;
   - mounted frames (`mill-sails`, `chimney`, `forge-chimney`, `awning`, `flower-box`, `herb-box`, `mine-mouth`) carry
     role `sign` with their `foot`.

   A mount may be a `sign` or a `prop` frame, placed at its foot (0.2.1). The export follows the parser; the frames
   don't change.
4. **Review sheets** (KF13, kits.md §8):
   - the kit on light and dark grounds;
   - a **sample band**: the Fields, the Mill and an overgrown Coop over a path row, from a stand-in render. The builder
     can be uma-stage's (`BandStage` over a `FarmDesign`, as its `SAMPLE_FARM`);
   - a scale sheet with uma-quest's stand-in traveler beside a door, a tree and the bin;
   - every ripe crop family in a row.

   Sheets stay text-free and Uma-free.
5. **Versioning:** a uma-art minor after whatever is current when it lands, with a changeset naming the farm kit's wave.

## Do

Wave 2, on the owner's go, as a second minor, the way wave 1 was made:

1. **Draw wave 2's 30 frames in code** to the contract's roles and sizes (KF8, kits.md §3), in KF9's style (decision
   0), with tests like the pixel families' (every name, role, size and foot; every earlier frame byte-identical).
2. **Export** them into `kit-farm/atlas.png` and `atlas.json` with the deterministic script, byte for byte the same each
   run. Update the family in `packages/art/README.md` (its frames, roles, sets and waves), and add the changeset.
3. **Make the review sheets** (decision 4).
4. **Commit and push to uma-platform's `main`** (its CLAUDE.md), then `pnpm version-packages`, push, and read the
   release back: its `kit-farm/atlas.json` lists every name in kit-farm.md §6, both waves. Log the decision in
   uma-platform's own log.

## Done when

- uma-art's checks pass, and every frame published before is byte-identical.
- The release is on GitHub Packages. Its `kit-farm/atlas.json` has `kind: "farm"` and every frame of both waves by name,
  at its role and size, with `set` on the building pieces, `foot` on the props and mounted pieces, and `blocks` and
  `light` as §4's table says.
- The review sheets show the kit on both grounds, the sample band, the scale sheet and the crop families.
- **The owner approves the look** (KF13).
- The farm side, for whoever pins it: `@luismlorenzana/uma-art` at the new version installs in uma-farm, and its
  `pnpm lint`, `pnpm test` and `pnpm build` pass unchanged.

## Deliver

In uma-platform: the uma-art release, published by its Claude session, and the decision in its log. Then in uma-farm,
on a branch and a pull request for the main session to merge:
- this packet deleted, and its rows taken out of [the handoff](../README.md) and step 1.4 out of
  [the roadmap](../../roadmap.md#phase-1-one-game-not-three);
- the pull request naming the release's version and the review sheets; the commit says what shipped.

The first uma-farm change that draws wave 2 pins the version and updates
[the game mechanics](../../game-mechanics.md#the-kit), whose kit section lists the frames the stand-in still draws.

## Rules that hold

- **No original-game content:**
  - no Uma, no original character or likeness, no master-data art in the masters, the atlas or the sheets;
  - review sheets with real Uma art stay local;
  - no text anywhere in the kit (KF9).
- **Lean assets:** the cheapest art that looks fine at one texel to one device pixel; no new pipeline beyond kits.md
  §8's.
- **Only what the contract lists.** A frame the contract doesn't name goes back to uma-farm as a contract change first,
  so the stand-in kit and the names stay in step (KF14).
- **`uma-kit`, `uma-work` and the stage aren't touched** by this packet; the stage's farm openings are already in
  uma-stage.

## Left to the worker

The drawing code's design within `scripts/kit-art`, within the contract; the exact colours within KF9; how many variants
look natural, within the counts; the review sheets' layout; anything the export needs that the farm doesn't see.
