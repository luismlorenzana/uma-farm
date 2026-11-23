# F103 — HD-2D farm

**Status · Field and Pond opens on Home.** [Open the farm](https://uma-farm.web.app/) on a WebGL 2 phone.
Home starts in Saver and **All farm places** opens the tile map. The iPhone look and ten-minute
measurements are open. The [original composition study](F103-field-and-pond.html) is available for comparison.

## Why

Home is where the player reads the farm, finds work and sees what the Umas have been doing. HD-2D can give the
farm a sense of place and make that work visible. The first question is whether depth and light improve that
experience at phone size. A single band makes it possible to answer before authoring a farm's worth of buildings.

Read the [current farm map](../../game-mechanics.md#home-the-farm-map), the [farm map data](../../../apps/web/src/loop/farm-map.ts),
and the platform's [look bible](https://github.com/luismlorenzana/uma-platform/blob/4d9a1db650e6a794ff3e0945421505769ec12f91/docs/look/bible.md).
The old Farm preview at `aae0eb1` had the Farm kit and Uma work animations. F74 retired the preview when the game
went landscape. Use it as a record of the assets and work poses that existed.

## Research findings

- **Render the space in depth and keep characters on one pixel scale.** Acquire's *Octopath Traveler* team
  describes the combination of 2D pixel characters with 3D environments and lights that cast characters' shadows.
  For the Farm, author the bank, paths, fences and buildings as volumes. Use camera-facing character sprites with
  consistent foot anchors and texel density. Put the first sprite review beside the crop rows and a farmhouse door,
  where drift in scale is obvious.
  [Acquire and Square Enix interview](https://www.unrealengine.com/spotlights/octopath-traveler-s-hd-2d-art-style-and-story-make-for-a-jrpg-dream-come-true).
- **Design two light states around farm activity.** Acquire describes brighter outdoor light and strong night
  contrast in its sequel. Try warm morning across the field and a cooler late-day base with light from the windows.
  Preserve the legibility of tilled soil, ripe crops, the shoreline and the work sprites in both. The game advances
  in turns. Review the presets by hand first, then derive any automatic transition from existing action/day state.
  [Octopath Traveler II developer interview](https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style).
- **Start with the shared renderer's mobile constraints.** WebKit supports WebGL 2 on Metal and Three.js's
  WebGLRenderer uses WebGL 2. That establishes compatibility for the renderer. The Farm needs device measurements
  for real scene load, frame pacing, heat and context recovery.
  [WebKit](https://webkit.org/blog/11989/new-webkit-features-in-safari-15/) ·
  [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer).

The platform's LK1 square and tavern passed the owner's visual review. The handoff still lists the phone run
as pending and LK2 as in progress. LK2's kit manifest describes piece type, footprint, height and sockets. The Farm
can author scene coordinates, props, targets and fixture saves against that contract now. The supported kit loader,
published assets and artwork review are the gates for a player-facing rollout.
[Shared look handoff at the reviewed revision](https://github.com/luismlorenzana/uma-platform/blob/4d9a1db650e6a794ff3e0945421505769ec12f91/docs/handoff/README.md#the-look-lk)
· [LK2 packet](https://github.com/luismlorenzana/uma-platform/blob/4d9a1db650e6a794ff3e0945421505769ec12f91/docs/handoff/tasks/LK2-look-pipeline.md).

## Decided for this slice

- **Field and Pond.** Frame the woods' edge, the field's sign, the fishable bank, and the path to the Shipping
  bin and Farmhouse. Work from the Farm's usual left-to-right geography. Show the existing 8 × 5 plot as a miniature
  and keep the dedicated Fields screen as the place to choose tiles.
- **Farm as a lived-in scene.** Establish the crops, shoreline and yard as three distinct silhouettes. Put
  deliberate clusters of reeds, split logs, crates, stakes and fence ends around them. Keep the path and labels clear.
  Suggested shared kit pieces are loam and grass surfaces, an irregular bank, shallow water, simple timber and stone
  pieces, and a gabled farmhouse in separable sections. Request common pieces through the platform's change protocol.
- **Worker placement from the turn.** A fixture can show three invented workers standing in for a real crew.
  In the WebGL slice use eligibility from today's rota and the next planned work or reported completed work. Put Umas
  at the job that supplies their displayed pose. Keep town shifts, days off and expedition absence visible through
  existing game data. Use a small number of foreground sprites and a readable count where a 50-Uma roster assigns
  many workers to one spot. Enforce a scene budget independent of total roster size.
- **World positions and tap targets are data.** Map each named spot to its `FarmPlaceId`, a world anchor, and
  a screen-space hit area. Reuse the current destination and lock calculation and the field's live counts. Leave
  screen text and buttons in the app layer above the scene, with 44-point targets and the existing right sheets.
- **Start with one exterior.** Phase 3.7 is the map work this informs. Town, homestead expansion, orchards and
  later farm bands get their own layout pass after the Field and Pond review. Keep the existing map available
  as the immediate fallback for renderer load failure, context loss or a low graphics setting.

## Implemented pilot

- The app mounts `LookStage` from `@luismlorenzana/uma-stage/look` 0.7.0 with Three.js 0.187.0. The published
  stage loads its two stock scenes through `load()`. The Farm supplies a `LookScene` through its public stage
  state, with a local instanced kit. The branded sprite and published kit pipeline stays with platform LK2/LK3.
- The view projects plot 1's tiles and the real aggregate field counts. Daytime assignments use the work board's
  forecast, and the morning view uses the actual report. The six sprite positions represent work in this band.
  The worker counts include the other hands doing the same work. Original review sprites show the type of work.
- The high-resolution app links use the existing destinations. When an open sheet narrows the map, the links
  move into a compact grid. Context loss and a failed lazy import restore the tile map. The map choice stays
  in the session; the renderer is downloaded on first entry and cached separately from the main app.
- The camera looks down at 41 degrees, facing the yard straight on so the main path reads horizontally.
- The **Phone test** HUD records up to ten minutes with the map in the foreground. It gives FPS, p95 frame gap,
  draw calls, and a renderer memory estimate. Record the phone model, quality tier, roster, transferred bytes
  on first entry and any dimming or heat beside those numbers.

## Review sequence

1. Review the landscape study. **Diorama** and **Tile plan** share the same five spots. Switch between Spring,
   Summer, Autumn and Winter, Morning and Dusk, and Early farm and Farmhands at work. Pick a spot for its label
   and test 844 × 390 and 667 × 375. The study uses Canvas 2D projection and synthetic fixtures to test
   composition and legibility. The stated crop counts describe the illustrated rows.
2. Make a lazy-loaded review using the shared `@luismlorenzana/uma-stage/look` path and a pinned Three.js peer.
   Host that review outside the startup path. Represent the band as authored scene data with consistent unit
   scales and dependency manifests. Begin with directional light, ambient fill, tight contact shadows, graded
   color, and a restrained far-depth falloff. Add soft focus only at a distance from actionable areas. Test scene
   streaming, static batching, one low-resolution shadow map, quality tiers and clean disposal.
3. Wire real read-only Day 1, first-carrot-harvest, staffed, and 50-roster fixtures through save-derived place
   selectors. In the interactive spike, drive the regular route and panel handlers for field, woods, pond, bin
   and home. At plot unlock, board assignment, and a night transition, verify the rendered counts and
   eligibility update from the game without requiring a reload. A night pass uses the actual morning report.
4. Run the same task sequence in 844 × 390 and 667 × 375. Open and close each right sheet, pan and return to
   the active place, open Fields and return, and cross a season boundary. Test standalone iPhone mode, a fresh
   load, an offline reload after caching, background/foreground, and forced loss of the WebGL context.
   Keep the map usable throughout the transition to fallback.
5. Measure on the owner's iPhone for a ten-minute foreground run with a staffed farm, including water and
   shadows. Compare early farm and the 50-roster fixture. Record scene bytes transferred, visible draws,
   renderer-estimated texture and render-target memory, median FPS, 95th percentile frame gap, context loss,
   and whether the phone gets hot or dims. Draft slice targets are **at least 30 FPS sustained**, **95th
   percentile frame gap at most 40 ms**, **at most 5 MB of first-load scene transfer** including the lazy
   renderer, and **at most 128 MB of estimated graphics resources** for this band. Keep **main JS at or
   below 180 KB gzip** and verify that the map and renderer stay off the entry chunk. Use the draft targets
   to compare quality tiers. The actual device run establishes the production tier.

The composition study exercised both landscape sizes, all 16 combinations of season, light and crew, and
the compact layout. The WebGL pilot passed a Chrome playthrough at 844 × 390 and 667 × 375 with synthetic
saves. It opened all five normal destinations, panned, displayed a first ripe carrot and a staffed forecast,
updated after a season boundary and restored the tile map when WebGL context loss was forced. Domain tests cover
the actual morning report and forecast with 10, 20 and 50 farmhands. A short desktop Saver run reported 51 draws
and 3.6 MiB of estimated graphics resources. The standalone iPhone run is the performance gate.

## Done when

The owner approves the field composition and approves the phone measurements at a readable tier. The two
landscape sizes have clear targets and reliable fallback. A Day 1 save, a first harvest and the 50-Uma fixture
agree with today's farm rules and routes. The shared look pilot and the asset ownership needed to extend it
are recorded with the slice. The [F115 map packet](F115-hd2d-map-navigation.md) applies the pilot to separate Farm sections reached from a painted overview.

## Deliver

Keep this packet in the handoff until F103 is complete. Land the review and captured measurements together.
Update game mechanics with the eventual player-facing experience. Publish any shared kit and its manifest from
uma-platform according to the change protocol.
