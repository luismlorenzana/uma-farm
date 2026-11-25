# F120 · HD-2D interior rendering and sprite fidelity

- **Status · Authoring packet for review, 2026-11-25.**
- **Roadmap · Phase 3.7, Map appearance.**
- **First playable deliverable · The Town Library in the normal game route, with a repeatable comparison at both landscape sizes.**
- **Final deliverable · Every modeled interior uses the new scene pipeline, and the selected sprite treatment works across all indoor contexts.**

## Why

In the reference comparison, the Farm Library's close camera fills the frame with floorboards, a repeated row of shelves, and three large Umas. The Thieves' Guild in *Octopath Traveler II* gives the architecture room to read. A stair opening, a foreground passage, wall trim, clustered furnishings, a chandelier and small lit figures give the picture distinct layers. The fixed bearing and the use of pixel characters in modeled rooms already give Farm a starting point. F120 brings in the framing, room construction, light, ground contact, and room-specific materials that make those layers readable in motion. [Square Enix Guild gameplay](https://www.jp.square-enix.com/octopathtraveler2/assets/mp4/system08.mp4)

Acquire describes fixed travel framing, predominantly 3D surroundings, revised sprite proportions, and higher-resolution maps with changing light. Use those principles and the published frame as review references. All rooms, props, materials, sprites, and color choices for Farm are original designs. The camera values below are Farm test values derived from the needs of its landscape UI. [Acquire and Square Enix developer interview](https://www.unrealengine.com/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style?lang=en)

### Read first

- [F115 · HD-2D map navigation](F115-hd2d-map-navigation.md) for doors, daytime presence, the action panels, and return from dialogue.
- [F103 · Field and Pond](F103-hd2d-farm.md) for the phone measurement procedure and the relationship between screen controls and the scene.
- [F114 · HD-2D actors](F114-hd2d-actors.md) for the three sprite outfits and the private asset release path.
- [Game mechanics](../../game-mechanics.md#the-farm) and [Farm architecture](../../technical/architecture.md) for the shipped game. Read Platform's `docs/look/bible.md` and UA15 walking sprite packet alongside the shared Stage source.

## Decisions and expected player experience

| Decision | Expected player experience |
| --- | --- |
| Approach and interaction | Painted map → section or district → building → HD-2D interior. Tap the floor to choose a walking destination. Tap a visible Uma or her matching Here now row to open the normal full-screen conversation. Back takes you to the same door, the last valid walking position, and the same camera mode. Counters and their existing service actions stay available from the destination UI. |
| Walk camera | Use a fixed front-facing bearing and a perspective lens. A walk shot shows the entrance, room identity, usable floor, route to main destinations, and more of the architecture than the current close shot. A close shot gives a closer look at the cast. Whole room remains a fit-to-room view for large spaces. |
| Cast | Render actual on-site Umas and animals from the existing saved and scheduled presence. Outfits follow Spring, Farm Work, or Pajamas. Logical actor size, a native pixel cell, tap target size, and screen pixel density are four independent choices. |
| Room depth | Give each interior a readable foreground, walking layer, and background. Use real geometry, coherent materials, grounded feet, and a visible source for each pool of light. Keep walkable routes and door destinations legible in dark areas. |
| Room state | Use the existing farm and town selectors for jobs, home occupancy, expeditions, time of day, building status, livestock, and service availability. Scene art and camera movement read those values. Service and conversation handlers continue to own the game actions. |
| Sprite work | Compare the existing native art with two hand-redrawn densities using one Spring outfit. Adopt the best result for exploration and close viewing after a controlled comparison. The rollout uses the established three-outfit contract and the private approval and publishing flow. |
| Engine and device | Implement in the shared Three.js/WebGL 2 Stage and Farm's lazy room route. Ship quality options selected by measured iPhone behavior, and keep the painted/static room and portrait fallback usable. Only one active 3D room owns rendering and input. |

## Baseline and ownership

The current room path is `TownPage` or `FarmWorld` → `WorldPlate` → lazy `RoomDepth` → `buildRoom` → `mountRegion` → `LookStage`. `room-specs.ts` describes each room as furniture placements in local coordinates. `room-kit.ts` builds a 12 × 8 floor with the front at positive Z, batches low-poly geometry, derives footprints, and returns a floor clearance check. `RoomDepth` projects the actor marks, fits portrait fallbacks around the phone's edges, and raycasts taps onto the floor. `room-walk.ts` routes around the furniture. `travel-camera.ts` uses elevation 41°, azimuth 0°, interior vertical FOV 29°, and a 1.36× close zoom. The existing actor height is 1.85 world units.

The shared look path already has a directional key, hemisphere fill, PCF shadow maps, tone mapping, grading, ambient occlusion, depth of field, bloom, and frame measurements. The Farm adapter assembles the scene directly and forces Saver, a 512px shadow map, and disabled AO, depth of field, and bloom. The adapter sets some light values itself, while the shared Stage's scene setup also applies the shadow camera bounds, fog, and per-scene grading. Fix that split before enabling richer room profiles. Today's Farm Uma billboards use nearest sampling and an unlit material. The shared Stage lit figure example uses an alpha-tested lit plane, normals, an alpha-aware depth material, and ground contact. Adapt its behavior to Farm's atlases and share textures by verified asset hash.

| Owner | Deliverable | Existing entry points |
| --- | --- | --- |
| **uma-farm** | Per-room design specs, location mapping, camera motion and input, selection, quality defaults, and gameplay verification. | `apps/web/src/world/RoomDepth.tsx`, `WorldPlate.tsx`, `room-specs.ts`, `room-kit.ts`, `room-walk.ts`, `travel-camera.ts`, `farm-region-stage.ts`, `pixel-billboard.ts`, `hd2d/character-art.ts` |
| **uma-platform / uma-stage** | Opt-in scene lighting and quality profile, reusable GPU texture ownership, mesh and material loading, lit atlas actors, focus targets, and measurements. | `packages/stage/src/look/stage.ts`, `post.ts`, `scene.ts`, `figures.ts`, `kit.ts`, `bench.ts` |
| **uma-platform / uma-data and packer** | Read and validate manifests, cells and foot geometry, variable-size atlas packing and per-frame candidate proofs. | `packages/data/src/character-sprites.ts`, `scripts/data/src/character-sprite-pack.ts`, the existing character-family publishing tools |
| **Art authoring** | Farm-native modular room assets and a newly drawn sprite pilot. Source studies, exact approvals, release candidates and visual QA captures in private storage. | Existing Character Sprites category for characters and the established original environment art path for the interior kit |

Use the shared package APIs for renderer mechanics. Keep Farm-specific geography, jobs, actor availability, outfit selection, and service policies in Farm. Keep the existing neutral character/outfit identity, including sisters with a distinct outfit ID.

## 1. Establish measurements and a repeatable scene

1. Capture the Library through the normal `/town?at=library` route with a disposable save, while the signed-in release uses the ordinary content loader. Use sanitized saves and synthetic data for repeatable automation. Use approved private content for visual review.
2. Record the viewport (844 × 390 and 667 × 375 CSS px), the actual scene canvas bounds, backing-buffer size, effective DPR, device, quality profile, time of day, camera pose, and current cast. Use one shared walk loop from entrance to central aisle to an Uma, around a table, to the counter, then back to the entrance.
3. Capture both the entire app and a crop of the actual room panel for each matched shot. Hold the camera target, crop, character placement, art revision, and time fixed while comparing settings. Use separate cases for whole room and close inspection.
4. Record pose samples at the start, after the camera starts following, and after it settles. Compare normalized sprite height, visible floor and wall height, entrance visibility, and projected 3D anchors. Use the existing Platform look measurements for contrast, shadows, highlights and focus as diagnostics. Perform separate human review for whether those changes make the Library read as a credible room.
5. Preserve a one-click baseline profile in the local proof scene using the old room kit, 41° pitch, close composition, unlit art and Saver settings. Record the original version. Keep the proof controls in the existing development or review surface.

## 2. Add room scene data and asset loading

### Coordinates and contract

Use current local axes, with Y up, the front at positive Z, back at negative Z, and a stable room origin. Document one consistent modeling unit for the room kit. Check asset normals, winding, collision dimensions, pivots, and texel density on import. Model repeated doors and counters against their actual use heights and measure their opening width against the avatar's safe walking radius.

Extend the existing room spec in place. The following fields are an implementation shape, with names adjusted to fit the shared API where it exists.

```ts
interface RoomSceneSpec {
  id: RoomId
  kit: string
  instances: readonly RoomPropPlacement[]
  walkable: readonly WalkSurface[]
  blockers: readonly RoomBlocker[]
  marks: readonly RoomMark[]
  camera: RoomCameraSpec
  lighting: Record<'morning' | 'afternoon' | 'night', RoomLightSpec>
}

interface RoomMark {
  id: string
  kind: 'entrance' | 'actor' | 'service' | 'animal' | 'focus'
  position: readonly [number, number, number]
  facing?: 'front' | 'back' | 'left' | 'right'
}
```

- Use `RoomId` from the current route mapping and stable mark IDs for entrances, actors, and services. Mark variants for ordinary and expanded houses. Resolve the actual house index and expansion in Farm before requesting geometry. A service mark resolves an existing service ID and handler. Validate each declared service against its owning room.
- Keep content paths, layout pivots, and bounding boxes separate. An instance points to an authored model key, a position, rotation and optional material variant. Bounds and collision come from explicit room data or named authored collision primitives with a checked unit scale. Decorative tiny props can share a counter's footprint.
- Make walkable polygons or simple convex floor sections the canonical navigation geometry for the modeled path. Connect adjacent surfaces with declared edges through doorways and stair or ramp landings. Split visual only levels from connected walkable levels. Validate that an entrance reaches each required service or speaker mark and fail private preview with a useful room and mark ID if it does not.
- Start with the existing flat-floor solver in the Library. Introduce height-aware surfaces in the room infrastructure, then exercise them in a room with a real ramp, stair or step. Project pointer rays to the closest visible walkable surface. Use its Y for walking, footprint checks, sprite feet and shadows. Confirm a table top and a far floor behind a blocking wall choose valid destinations according to the same selection rules.
- Keep current `WorldPlate` fallback content as an immediate interactive surface during load. Prefer an opt-in enhanced room spec per `RoomId` and select the current procedural kit for rooms awaiting migration. On failure, try the current kit first and then the static backdrop, portrait and destination list. A failed art asset yields a useful local diagnostic with the asset or room key.

### Meshes, materials, and reusable props

Author a compact modular room kit in glTF or GLB. Reuse the existing shared kit and loader when it supports the needed data. Load from the verified content manifest with explicit dependencies and byte budgets. Export room variants with shared meshes and material keys and internal texture dependencies. Verify unit scales, empty bounds, invalid transforms, material IDs, duplicate IDs, and axis convention before making the kit available to the app.

| Set | Initial pieces | What gives them depth |
| --- | --- | --- |
| Architecture | Floor sections and edging, plaster and timber walls, baseboards, beams, framed windows and doorway surrounds, raised or recessed floor pieces | Visible wall thickness, window recesses, trim profiles, seams at wall edges, distinct near and far surfaces |
| Library furnishings | Tall bookcase, lower shelf, reading desk, service counter, stool, bench, wall or desk lamp, carpet | Distinct shelf depths and occupied gaps, bevels where they catch light, readable counter fronts, shadows under shelves and desks |
| Small detail | Closed and open books, paper stacks, bookends, baskets, signs, ceramics, planters | Several sizes and groupings, with highlights and contact shading at the point of attachment |
| Foreground | One doorway edge, near beam or shelf end, a small set of wall pieces, exterior sill or threshold | Enough shape ahead of the walking plane to establish depth, and authored cutaway sections that yield when they block walking or selection |
| Additional families | Home furniture, kitchen appliances, service counters, storage and cargo, smithy and production fixtures, ranch fixtures, cave supports | Shared material library with purpose-specific silhouettes and layouts. Preserve the actual service, animal and work anchors. |

Use aligned UVs, a shared texel-density convention, and physically readable material variation. Wood grain follows each piece, fabric and floor boards have distinct roughness, and metal has controlled highlights. Start with albedo, roughness, selectively authored normals and optional emissive maps. Use decals for wear where it can be seen at the actual camera scale. Reserve distinctive high-detail geometry for close or silhouette-critical pieces. Keep repeated props grouped for instancing and batch static construction by material. A physical prop has a consistent footprint across variants.

### Library layout for the playable slice

- Build a timber and plaster doorway at the lower part of the shot. A near wall edge and door frame overlap the scene without narrowing the tappable entrance. Show the threshold and enough back-wall height to read the windows and shelf recess.
- Put a reading zone with bench or chairs on one side, the service counter on the other, and a clear aisle between them. Keep the front of the counter identifiable and the current Library services reachable from the panel. Place books and other detail in small clusters with quiet space between them.
- Use two or three distinct shelving forms, several book groupings and shelf gaps to establish scale. Place the main lighting source so the reading tables and nearby actor faces can share it. Make the counter and entrance readable in afternoon and night profiles.
- Provide a standing mark near the counter, walking marks where the finished room has clearance, and a clear exit. Preserve a useful focal point even with an empty cast. Prove the same room with one person and with the maximum visible cast. Use the named people list for anyone outside the current camera.
- Select the main walking composition from two working alternatives in the app. Compare the version that shows the full entrance and shelf tops with the existing close camera. Score the room by reachable controls, room identity, readable sprite silhouettes, and distinct light zones.

### Load and lifecycle

A room request acquires the selected geometry, base material library and the visible outfit pages. Deduplicate concurrent loads by manifest hash. Attach locally scoped generation tokens or abortable leases so a late result cannot draw into a different room after Back or a route change. A scene remains interactable through its fallback surface as assets decode and compile. Swap into enhanced mode as a set after required geometry and anchor validation. Resolve optional assets independently so an unavailable prop or actor page cannot block the room.

Pause animation and rendering when hidden, backgrounded, or covered by dialogue or a service sheet. Drop leases and release room-specific render targets, lights, materials, post passes and geometry when the room unmounts. Reference-count shared textures and materials. Recreate GPU resources after context restoration, select the supported quality profile, and resume at the last valid walking position. Test a room transition while textures are decoding and a background/resume cycle while the camera is moving.

## 3. Camera, walking and interaction

1. Define `walk`, `close` and `fit` presets per room or room family. Keep yaw at 0° and roll at 0° for indoor travel. Make vertical FOV, elevation, target height and camera bounds explicit. Keep the current 41° / 29° setup as the control. Compare elevation around 27°, 34°, and 41° in the Library with a consistent composition scale, then choose the pitch that preserves floor navigation, furniture silhouettes and wall height.
2. Begin with walk-view sprites around **12–16% of the visible scene height**, measured on a representative character at a central mark. Compare to the roughly 25% center sprite in the current close capture. Keep Close available for body and outfit inspection. Use authored framing or a bounds-based fit for small and long rooms. At both landscape widths, reserve room for the entrance, principal counter, and the local action target.
3. Use the walking point as camera target. Extend the existing eased follow with a small dead zone, a limited velocity look-ahead, and bounds that keep the camera from showing void beyond the shell. Compose a frame by deriving the target, camera distance and fit from the same pose. Use time-based damping and bounded deltas across resume. Reduced motion uses predictable immediate positioning or the existing short transition.
4. Support an original animated protagonist sprite as the walk marker. Its renderer reads the accepted movement vector, faces the corresponding authored direction, plays the time-based walk loop while moving, and restores the matching standing frame when still. Start with the floor marker for camera and route proof. Add the approved protagonist art through its own identity and lease when the silhouette and controls are ready. The walking point continues to be the camera and navigation authority.
5. Use depth-tested geometry for actual occlusion. Put foreground cutaway pieces in explicit groups. When a group obscures the walking point or active interaction target, ease the affected group down using a predictable fade or dither. Prefer a cutaway level with enough opacity for architecture to remain readable. Hide or disable a projected target if its actor is fully behind solid geometry or outside the canvas. Keep the corresponding list entry reachable.
6. Project foot and head positions into current canvas coordinates. Size touch targets independently with the existing 44-point convention and current safe-area behavior. Resolve overlapping tap targets by visible depth or offer the list in dense layouts. Recompute hit areas on resize, view change and camera updates without rerendering React for an animation frame that leaves the anchors stable.
7. Reuse floor pointer, keyboard pathing, Entrance, and the native room controls. Convert taps using the actual canvas client rect and its current view. Map a blocked tap to a valid nearby endpoint with a visible walking cue. Record the last position and view by room and house index for the session, revalidate on entry and after dialogue, and return to the entrance if the saved position no longer has clearance.
8. Tapping an Uma or her list entry opens the existing dialogue engine with the resolved place. Use the same selection and handler for a service marker and its button. Door entry, floor walking, zoom, and selecting a character use no action points. Existing action handlers own costs and changes. Link release proof to exact routes and verify Back from town, on-farm, and service contexts.

## 4. Light, shadow, focus, and color

### Wire the shared lighting path

1. Refactor the existing Stage scene application into an opt-in public entry point that can mount a caller-built `LookScene`. Have the current square and tavern loader call the same entry point. Apply scene lights, grade, background, shadow-frustum bounds, fog, and the selected camera in one place. Use a caller-provided quality override for Farm rooms. Match the old setup for existing callers and the Farm outdoor and plot adapters.
2. Give each room a base material response and three profiles for morning, afternoon, and night. Resolve those profiles from Farm's current day period and scene context. Where a room uses a time profile independent of action availability, define that mapping once in Farm. Crossfade lighting on an in-scene period change where supported. Apply the correct state immediately when entering or restoring a room.
3. Author a small directional key or window contribution, a low-cost ambient fill, and positioned lamp, window, and fireplace sources. Give a source an emissive mesh, a color temperature in art terms, intensity, range, falloff, and an explicit shadow mode. Limit dynamic sources by quality and room visibility. Keep falloff strong enough that the source visibly establishes a zone instead of tinting the whole room.
4. Use baked lightmaps or ambient occlusion for static contact shading and areas hidden from local light. For each room asset, declare whether baked values already include ambient or direct light. Compose them as part of the room material and avoid accumulating the same lighting in multiple passes. Use dynamic light and shadows for actors and movable props. A low tier can use a baked light pool or projected decal at a lamp and a small ambient fill.
5. Fit the directional shadow camera to the visible room and its important moving actors, with a small motion margin. Keep static shadow setup fixed per room or quantize the change to keep it stable as the camera pans. Test contact, acne, bias, shadow edge softness, bleed at wall joins, and continuous shadows when an actor crosses from the entrance into a pool of light. Start the Library comparison at 512 and 1024 and measure 2048 in the high tier. Select the tier from actual results.
6. Put soft contact shadows under feet and important furniture. Use a cached projected decal or atlas for low-cost grounding. Pair it with a silhouette shadow from the lit plane where scene lighting makes it visible. Use the actual floor height and align contact to the planted foot. Scale and soften animal contact marks by species and body size.

### Author the Library lighting

- **Morning.** A visible window defines a light direction and a brighter reading area. Cooler indirect fill keeps labels and skintones readable outside the patch. Confirm the white pages and book bindings remain distinct at normal zoom.
- **Afternoon.** Shift the window contribution and warm the reading area. Keep a legible path from the doorway to the counter. Check the shadow pattern under bookshelves, the desk and a standing Uma against the morning capture.
- **Night.** The lamps and wall fixtures create separate warm pools. Keep the door, aisle and active character readable with low ambient light. Use controlled emissive highlights. Compare the mood and contrast with the Guild reference while judging Farm at its own screen size.
- **Per room.** Choose color and contrast according to function. Home and inn use warm practical lights. Barn and Coop use visible daylight openings and an evening lamp, with readable feed indicators. The Forge and Smelter use a localized fire or furnace contribution. A mine or quarry uses a narrower lit route and visible support frames.

### Post processing

- Keep the current color space and tone mapping path explicit. Run grading after tone mapping, using warm highlights, cooler shadows where appropriate, and a restrained vignette. Compare skin, hair, book colors, and surface textures across profiles. Treat image measurements and the reference as guidance while choosing a room's final values.
- Set depth-of-field focus from the camera-space distance to the player or active walking plane. Update it when the camera follows, changes presets, or enters another room. Smooth focus changes. Tune maximum blur for the panel height. Keep the active sprite and the main walkable area clear. Use the depth buffer and the same alpha mask for sprite edges as for the color pass, so silhouette edges and shelves can overlap without rectangular halos. Keep interactive labels and the app UI composited at their normal sharpness.
- Use thresholded bloom for windows, lamps, fireplace and machine emitters. Test at a reduced internal resolution before enabling stronger bloom. Check ordinary whites on clothing, menus and notices at the exposure you choose. Verify the lighting still reads with bloom off.
- Start with baked contact shading and add budgeted screen-space AO to improve near furniture and recesses. Apply it at a lower internal resolution or select the existing higher-tier pass when it improves the room on device. Watch edges around sprite planes and wall cutaways. If a pass produces a noticeable halo, adjust the depth and mask path or select a tier that uses baked and projected contact shading.
- Add optional depth fog or a restrained light shaft only where the room needs it. Use a short depth range and enough contrast for the floor and service markers. Keep foreground softness tied to depth and the room's near geometry. Verify projections at both the fit and close poses.
- Use real time of day and a consistent light profile to drive indoor state changes. Decorative animation can consume elapsed time while a room is active. Lower or pause updates when idle or backgrounded. Reduced motion retains understandable focus and an immediate route to each action.

## 5. Sprite rendering, motion, and higher-resolution art

### Render pipeline for actors

1. Preserve `character-art.ts` as the content-resolution seam. The exact identity and requested outfit pick one approved variant. Keep the current generic outfit and portrait fallback paths. Load only the page needed for each visible actor, and prefer a reference-counted texture cache by asset hash, sampler and material needs. Reuse atlas textures across frames and actors.
2. Use a lit, alpha-tested plane for Umas in upgraded rooms. Start with the shared `figures.ts` material and shadow behavior. Bind each Farm frame as an atlas rectangle using per-actor UVs or shader uniforms. Keep the rect off the shared texture object when different actors use different frames. Update just the rect, facing and timing for each animated actor. Sprite geometry can be instanced later if profiling identifies draws as the bottleneck.
3. Keep the current sRGB albedo and nearest sampling for the native pixel art. Preserve transparent outlines and extrude each visible edge into atlas gutters during packing as appropriate for the selected sampling. For distance minification, compare nearest with a padded per-cell mip strategy or an alternative LOD. Select the version that preserves legible detail during motion and avoids samples from neighboring frames. Keep room materials free to use their own sampling.
4. Use the same frame UV, alpha threshold, transform and foot anchor in the color, depth and silhouette-shadow passes. Darken the actual surface under the actor's feet instead of the sprite plane. Set normals and light response so a sprite has shape but still reads as pixel art. Test a simple flat normal plus room fill before adding optional authored or silhouette-derived normals. Keep GPU normal resources shared or packed per atlas. Reserve normal maps for cases where they visibly improve the pilot.
5. Keep logical height, native cell size, projected height, and touch target independent. Use the measured character bounding box and normalised foot anchor to drive geometry. For the same proportions as 64 × 88 and foot (32, 84), initial validation anchors are (48, 126) on 96 × 132 and (64, 168) on 128 × 176. Map an artist's approved pivot through the same normalization, and record intentional deviations with a visible frame check. The player model and Uma sprites keep the same apparent body height and feet when resolutions swap.
6. Keep plane orientation and projected size controlled by the camera profile. Compare a vertical yaw-facing plane with the existing camera-facing billboard at the tested pitches. Tune projection compensation using the approved standing pose as the scale reference. Measure foot slip and distortion on turning and on elevated surfaces.
7. Use Platform's existing atlas animation cadence and facing rules where they fit. Drive frame timing from recorded duration and accepted movement. Preserve four independently drawn directions. Stabilize direction changes with movement thresholds and let a stationary actor stand in the last intentional facing. The current common inventory is four standing frames and 28 walk frames per outfit. Preserve approved deviations in timing and frame counts.
8. Use the existing on-site cast and occupancy resolver for blocking, idle anchors and available interactions. Apply short walking loops, room-entry steps, or task-adjacent motions only when the current activity supplies a valid position. Use anchored idles for staff on duty. Keep the number of simultaneously rendered sprites bounded by a room's marks and the device profile, with a full Here now list.
9. Apply the same lighting and placement review to livestock in Barn and Coop. Keep species scale, foot placement, feeding and ready indicators anchored independently. Prioritize accurate appearance and legibility with eight animals per building before revisiting their native 32 × 32 cells. Pens and fields can keep their tested profiles and opt into shared improvements separately on measured results.

### Native sprite candidates

The saved release readback has 50 character and outfit identities and 150 variant pages. Each reviewed page uses **64 × 88 cells**, **512 × 512 page dimensions** and an anchored alpha sprite. The reader accepts positive dimensions, page bounds and timed frame offsets. The publishing packer currently pins the source cell, foot, columns and page edge. Generalize the packer and proof to consume approved geometry before attempting a higher-resolution publication.

| Candidate | Source and role | Starting packing plan |
| --- | --- | --- |
| **A · 64 × 88 native** | Existing approved Spring frames. Baseline for shape, readability and cadence. | Existing 512 × 512 verified page. |
| **B · 96 × 132 native** | New Spring pixel drawing. Give the silhouette, hair, ears, hands, fabric folds and shadows more deliberate pixels. Keep the approved outfit and proportions comparable. | Fit the approved timed frames and padding in a page chosen from measured packing. Try 768 × 768 where supported, or a suitable 1024 page. |
| **C · 128 × 176 native** | New Spring pixel drawing for the same reference and walk cycle. Evaluate whether close viewing and the actual game canvas show enough additional authored detail. | Measure capacity and start with a padded 1024 × 1024 page. Validate device `MAX_TEXTURE_SIZE` and cache impact. |
| **Control · enlarged A** | Nearest-neighbor enlargement for the comparison only. Useful to separate a larger cell from newly drawn information. | Use the proof viewer and label the enlarged control separately from the native redraws. |

A quality comparison uses actual visible alpha bounds and actual on-screen sprite heights. A 64 × 88 cell can contain a shorter painted figure, and the effective back buffer can be significantly below CSS or physical device resolution. Record native painted height in texels, backing-buffer pixels, and visible height in CSS px. Check at both walk and close views. Avoid increasing actor screen size during a resolution comparison.

### Asset authoring brief and pilot procedure

- Pick one approved character with a clearly identifiable outline, contrasting garment shapes, and useful asymmetry between the left and right views. Use her Spring outfit. Use the same reference body proportions, palette families, intended light direction, facing and normalised planted feet in each study. Draw both left and right views. Establish a single tiny expression suitable for walk animation. Work on cloth motion, hand and foot legibility, and the silhouette before facial detail.
- Produce standing and walking sheets for four directions at each native density. A study may start with a short frame strip to reject unpromising shapes, and the selected comparison builds full walking loops. Retain the supplied per-frame timing and ordered frame geometry. Verify pose alignment next to the original using both its feet and head silhouette. Author against the known camera profile and check the sprite at actual target size.
- In the same Library room and save, compare A, B, C, and the enlarged A control. Hold camera, world size, palette intent, foot pivot, room light, filter, animation cadence, and quality scale constant. Capture every approach in walk view and close view at 844 × 390 and 667 × 375. Watch turns and stalls at the counter, changing light across the aisle, and overlap against a shelf and foreground cutaway. Repeat with a darker room profile.
- Compare render scales separately using the same native A sprite. After selecting a plausible room tier, repeat the sprite candidates on the actual phone at that tier. Judge actor identity, visible new detail, leg alignment, foot drift, temporal shimmer, lighting and atlas cost. Record the cut of the room shown in every capture.
- Choose a density that delivers a visible gain at the target view while keeping actor identity and motion stable. The preferred production density can be 64 × 88, 96 × 132, or 128 × 176. If a dense redraw yields useful gains only in Close, document the budget tradeoff before adding a separate close atlas. Try the selected density on a small approved wave with different silhouettes and all three outfits before ordering the remaining roster's redraws.
- Approve and release new native art through **Character Sprites**. Use the same three runtime variants, Spring, Farm Work, and Pajamas. Scene-specific portrait expressions, numbered wardrobes, outfits for anniversary or birthday dialogue, and gallery art remain represented by their established art systems.

### Packer and release implementation

1. Read each approved study's native cell, foot geometry, directions, timing and rectangles. Validate expected variant keys, approved revision hashes, integer dimensions, time and frame counts, bounds, duplicate or overlapping source rectangles, and unit scale. Preserve the existing 64 × 88 path and ability to compose a release with different approved densities across identities and outfits.
2. Size the atlas after calculating cells, gutters, columns and rows. Use a consistent deterministic layout and store the final dimensions and frame offsets in the manifest. Verify alpha, the visible RGBA crop round trip, frame timing, anchor, page and content hashes. Include an exact geometry record in the packer's proof. Exercise the old 512 atlas and both new example sizes with synthetic fixtures.
3. Keep runtime descriptor variants one page and one approved density per outfit for this packet. Compare several candidate studies in private preview by pinning the descriptor and asset revision outside the save. A later optional quality-selected resolution family can use a separate additive versioned contract if the measurements warrant it.
4. Use the existing guarded sprite-only candidate publication and readback. Pin the parent version, verify every selected frame and atlas, and compare the unrelated manifest families to the parent. Stage the matching shared package and Farm code before promotion when the loader needs a contract change. Promote the exact verified candidate using the existing expected-parent check. Verify authenticated readback and a real Farm launch. Keep the previous immutable revision available for the established rollback path.
5. Roll the chosen density and lighting model through approved waves. Validate Spring in Town and public settings, Farm Work on assigned jobs, and Pajamas in a qualifying night room. Check the exact sister or outfit identity, scene loading behavior, and interaction parity after every wave.

## 6. Pixel density, mobile performance, and effects scheduling

Use the same documented DPR calculation on every interior profile. The existing Stage picks the smaller of the device DPR and the tier's render-scale cap. Confirm the real canvas backing size after changing tier, resizing, or resuming. Compare the same scene at 0.75, 1.0 and 1.5 with actors at identical world positions. A 0.75-to-1.5 change quadruples the pixel count per full-size pass. A 512 × 512 RGBA8 texture occupies roughly 1 MiB before auxiliary textures or mipmaps. A 768 × 768 page takes 2.25 MiB, and a 1024 × 1024 page takes 4 MiB. Record actual allocations and distinct shared pages as well as those estimates.

| Profile to test | Scene scale cap | Lighting and shadow | Post and motion |
| --- | ---: | --- | --- |
| Saver | 0.75 | Baked lighting and contact decals, limited local emitters, 512px main shadow if it helps | Grade and legible foreground cutaway, low-rate ambient update, predictable fallback |
| Medium | 1.0 | Baked ambient shading, selected local dynamic sources, start at 1024px main shadow | Grade and restrained bloom. Test a narrow depth focus effect separately. |
| High | 1.5 | Additional useful scene lighting and optional higher-resolution shadow | Selective AO, bloom and depth of field. Compare half-resolution passes with their full-resolution versions. |

These are test profiles. Select the production default after device measurement. Keep shadow sizes, effect resolutions, atlas density and scene render scale independently tunable. Run warm conditions before changing quality based on timing. Use a rolling measure of moving-frame intervals with hysteresis so it avoids quality jumps at a doorway or during a large texture upload. Commit to a new scale after it stabilizes, resize the reusable targets once, and avoid visual popping in the interaction layer. The app can select a lower tier on a constrained device or after a lost context.

### Frame and resource lifecycle

Separate geometry and render-target allocation from the normal frame path. Move size and DPR work behind an actual change of panel size, mode or quality. Cache projection data when the camera is still. Render on camera movement, a finished asset load, visible actor or ambient animation, light phase change, and invalidation. Keep a lower animation rate for ambient motion while the player is idle and pause work when hidden. Record depth, projected feet and actionable visibility when the pose changes. One frame has a predictable order.

```text
Input → accepted destination on the walk surface
Movement + animation → feet, facing, frame UVs and active pose
Camera pose → view matrix, focus target and cutaway visibility
Scene draw → world, depth-tested sprites, lighting and the active post passes
Interaction layer → current projected marks and the ordinary Farm controls
```

Create one shared lease per verified atlas and a small bounded working set. Upload visible pages, load the selected room's geometry and shared textures, and prewarm expensive shaders after the usable fallback appears. Dispose cached GPU resources after the last reference or a budgeted eviction. Stream optional prop detail when it can fit and be seen. Batch static geometry by material and use instancing for repeated placements. Skip offscreen groups and reuse shadow and lightmap resources. For a missing atlas, keep the portrait at a valid mark and preserve the exact identity in the menu.

### What to measure

Use F103's provisional line for comparing interior profiles as well. Measure on the supported physical iPhone in landscape and installed Home Screen mode. Include a desktop Chromium check at both layouts for reproducibility, and check touch, WebGL behavior and thermals on the phone. Capture the actual user device model, iOS version, quality, room, cast count, viewport and measured values. Use the busiest fitted room and a quiet room.

| Measurement | How to capture | Starting comparison target |
| --- | --- | --- |
| Frame time | Separate idle from continuous walk and camera follow. Record median FPS, p95 frame interval, worst long stalls, and freezes by cause. Sample warm performance during a ten-minute foreground run. | At least **30 FPS sustained**, **p95 at most 40 ms** in the active motion sample. Compare to Saver and record thermal dimming or instability. |
| Scene transfer | Measure a cold start through the door, including relevant lazy renderer, room kit and visible actor pages. Report a cached return separately. | Starting reference **5 MB** for first-load scene transfer. Surface something usable promptly and report the time to the full scene. |
| Graphics memory | Record distinct atlas allocations, texture formats, geometry, render target count and size, shadow bytes, and high-water mark through a room switch. | Starting reference **128 MB estimated** scene resources. Report allocation estimates as estimates and check physical memory symptoms separately. |
| Main bundle | Run the existing production build and budget check. Inspect lazy imports and service-worker behavior on first load. | **180 KB gzip** main JS. Keep room assets and renderer behind their existing lazy entry points. |
| Stability | Rapid door changes, conversation cover and return, background and resume, context loss and restore, offline cached return, and no-WebGL entry. | A usable control surface throughout. Preserve route, valid walking position, and interaction availability after recovery. |

Log browser long tasks and renderer draws locally in the existing proof UI. Record GL limits and current quality once, texture counts after some room transitions, and the specific effect settings for each snapshot. Distinguish time spent decoding, uploading, compiling, or rendering. Use counts from the same room and selected visible cast when comparing profiles.

## 7. Rollout order and modeled-room checklist

### Milestones

1. **Baseline and shared seam.** Capture today's Library and reference sequence. Expose the shared scene mount and per-room render profile. Add synthetic tests for scene lifecycle, lighting, and correct shadow camera bounds. Verify the same interface in the Stage demo and the existing Farm exterior adapter.
2. **Library playthrough.** Build the first modular kit, annotated Library layout and daylight/night profile. Wire actual door entry, walker, new walk framing, camera follow, lit shelves, contact shadows, safe targets and normal dialogue takeover. The Library is complete through gameplay at both landscape sizes on the baseline sprites before a density decision.
3. **Native sprite and phone comparison.** Test render density on existing art. Prepare the approved baseline, the two native redraws, and the enlarged control as specified. Verify the four-facing animation and foot pivot, then choose profiles from the phone measurements. Validate package and candidate readbacks with the old and selected cell dimensions.
4. **Representative interiors.** Bring up a house with morning and bedtime residents, a customer-facing shop, a busy production room, and both Ranch rooms. Exercise height changes where they fit, limited new asset formats, practical lighting by purpose, and crowded actors and livestock. Verify the service and dialogue behavior before replicating each family.
5. **Room-by-room rollout.** Fill every modeled room spec in the table below. Track each location and relevant save-state variant with an exact route, before and after screenshots, asset receipt, first-draw metrics, and checked service and exit targets. Use shared kit assets and targeted smaller dressing additions to give a room its own identity.
6. **Release and check.** Publish any compatible shared package releases. Deploy Farm following PR and CI, then promote the verified private content candidate in the order its contract needs. Read back the production app and exact content revision. Complete the physical iPhone smoke test. Keep individual room selection and the previous compatible content revision available to reverse an affected wave.

| Wave | Existing room keys | Primary art and regression requirements |
| --- | --- | --- |
| Pilot | `library` | Reading area, distinct shelves and aisle, counter, window and lamps, four views of sprite detail and motion. Field Guides, Cookbook, and Recipe Discoveries use their existing routes. |
| Home and overnight | `home-table`, `harbour-inn` | Entrance and room or lobby identity, warm practical lighting, ordinary and extended room models. Correct resident and visitor list, day wear and bedtime Pajamas, door return, start of a standard night visit. |
| Food and service | `cafe`, `laurel-bakery`, `kitchen`, `restaurant` | Service counter, kitchen and customer paths, surface clutter related to the work, optional steam, pots and ovens. Library → Kitchen → Café handoff, self-service during absence, real station and Restaurant actions. |
| Shops and civic | `store`, `mayor`, `estate-office`, `little-studio`, `mejiro-salon`, `espoir-garage`, `rancher`, `smith` | Recognisable location signatures at walk distance, counters or work areas at reachable marks. Existing shifts, role names, shop, orders, and keeper and self-service paths. |
| Ranch | `coop`, `barn` | Feed and water fixtures, safe paths at capacity, furniture prop clearance, visible animal indicators. All seven species in total, up to eight residents in either building, distinct species scale and fed and ready states. |
| Processing and storage | `mill`, `sawmill`, `smokehouse`, `smelter`, `cutter`, `forge`, `warehouse` | Each machine and service has its own physical silhouette and placement. Open and locked station entry, actual recent work, queued processing, Ring Bench and Forge Workshop access at their own milestones. |
| Expedition and extraction | `expeditions`, `mine`, `quarry` | Map table, gear storage, work supports, readable steps or separated working surfaces where they suit the site. Departure and return routes, authorized dig levels and position across opened doors. |

Check this list against `ROOMS` and the Town and Farm route maps before each wave. Owner-facing review groups follow the places she can enter, including house and wing variants. Newly added room keys belong in the same inventory and tests before publication.

## 8. Test plan and exit checks

### Automated tests in the normal suite

- **Math and geometry.** Check fixed heading, camera framing with both aspect ratios, safe camera bounds after resize, focus distance and damping across variable frame times. Check projection/raycast correspondence on flat and raised surfaces, a route round a desk, valid foot positions on marked clear floor, and an unreachable service mark.
- **Scene and loader.** Check source profile applied once, sprite and texture leases shared, concurrent scene acquisitions deduplicated, stale loads ignored after room switch, fallback available on a failed room model or missing atlas, size buffers updated only on resize, disposed scene objects released, and context restoration through the same lazy entry point.
- **Render contract.** Inspect lit/depth/shadow UVs and alpha cutoff for the same frame, prescribed scale and foot normalization at three cell sizes, elapsed-time animation using direction and authored duration, and the stage's per-scene light and shadow profile. Use synthetic atlases and meshes in committed fixtures.
- **Packer.** Validate 64 × 88, 96 × 132 and 128 × 176 examples and different sizes in a single release. Reject invalid native anchors, rectangles outside the source or page, invalid timings, unapproved hashes, duplicate paths and malformed manifests. Verify visible-RGBA round trips and deterministic output. The normal release reader must still pick the existing approved variant on the current manifest.
- **Farm integration.** Prove the same location and saved cast go through the old room or enhanced scene and pick the same speaker. Check no action spent opening the room or selecting a character. Test no misplaced Umas after a shift change, no duplicate identity, valid household presence, and actual animal and work state. Check both sides of a service or story gate, including locked buildings and self-service on days the worker is absent.

### Walkthroughs and visual review

| Walkthrough | Procedures and expected observations |
| --- | --- |
| First-year farm | Open Town from the farm, follow the painted map to the Library, and select the real on-site person through the sprite and list in separate runs. Walk, use the counter, open dialogue, Back, exit, and open a still-locked farm location. Run each at both landscape sizes. |
| Indoor motion | Walk from the threshold past the reading zone, around the furniture to the counter and back. Inspect low and high pitches, all three view modes, safe edges, doorway overlap, location focus, sprite shadows and the correct foot on every turn. Test a raised surface in the rollout room. |
| Lighting | Capture the same Library pose at all three periods. Verify the window or local light has a visible source, feet anchor to the floor, the cast stays readable, and depth blur and glow appear only where warranted. Exercise the night house and furnace room in addition to the Library. |
| Pixel density | Compare four sprite cases at the same world size, both landscape widths, walk and close view, one brighter and one darker profile. Play matching movement, turns and idle sequences. Record the selected density and the visible reason, and publish the selected proof together with the asset and measurements. |
| Occupancy | Use fresh solo and populated 10-, 20- and 50-Uma saves. Check day jobs, household assignment and expansion, expedition absence, day off, night return and visible roster capping with a complete list. Test six reachable character marks where the room supports them and full animal occupancy. |
| Regression outside the room | Open the painted overviews, sections, gates and supported old links. Check representative first and last plots, row and crop taps, retained Grid, the Barn and Coop pens and current explicit actions. Verify direct entry and Back also work from People, Library and service panels. |
| Recovery | Force context loss, try a browser without WebGL 2, remove an optional prop or atlas, restart after backgrounding, and retry a slow room load. Walk and select only when the restored render is ready. The fallback service and dialogue controls remain usable. |
| Physical phone | Installed Home Screen build, signed-in app and published assets, both safe-area layouts where the physical devices or representative sizes are available. Check close view, camera follow, one service and one dialogue return. Warm test each candidate tier, observe heating and dimming, and verify a cached room after an offline or interrupted load. |

### Done when

- [ ] The normal Library route gives a recognisably layered space with a working entrance, separated reading and counter areas, usable walking clearance, and one visible source that sets a clear light hierarchy.
- [ ] The room's Walk, Close and Whole room modes are legible at both landscape sizes. Walking keeps the fixed bearing, seats sprites on the floor, and leaves each person and service reachable through the appropriate controls.
- [ ] The Sprite comparison and device report distinguish actual texture density, render scale and on-screen actor size. The chosen art profile has private source approvals, exact pack proofs, and recorded device results. The three active outfit variants resolve correctly across the test wave.
- [ ] All modeled entries in the room checklist have a passed route, lighting, interaction and recovery row. Every allowed room action passes through the established Farm handler and returns to the originating room or the current valid place.
- [ ] Delivery includes package checks for affected shared components, Farm type checks, tests and production build, the existing entry size check, verified manifest and hosted revision, local landscape walkthroughs, and the standalone iPhone review.
- [ ] Runtime documentation explains the player-facing view modes and recovery behavior. The handoff points to the final capture and measurement locations without committing private imagery.

## Implementation status

- The shared Stage 0.9.0 release owns the scene mount, framing, lighting, post-processing and alpha-tested sprite color, depth and shadow passes. Farm routes every modeled interior through it. The Library has new shelf, reading and service areas. The room geometry uses a small original shared model kit with a procedural fallback and gives the Mine and Quarry a walkable rear platform. Indoor AO is off across the profiles to avoid halos. Projected contact shading and room lighting provide the ground cues.
- `Character Sprites` accepts approved native 64 × 88, 96 × 132 and 128 × 176 source cells. Synthetic packaging proofs cover all three. The runtime continues to use the current approved 64 × 88 release. The larger native redraws need artist approval and a private A/B/C plus enlarged-control comparison before selecting or promoting a new density.
- The installed iPhone review still needs a signed-in walkthrough, measured frame intervals, thermal behavior and an offline return. Chromium landscape results do not supply those numbers.

## Deliver

Keep the packet branch focused on the planned changes. When implementing the packet, use the repo's standard branch and pull request workflow and deliver reusable Stage and data changes through their normal package releases. Update Farm's mechanics and generated documentation for each shipped user-facing behavior. Coordinate environment assets and approved sprite waves through the existing content release path. Attach test receipts and a short per-room checklist to each implementation PR.

Use private review storage for reference frames, local comparisons, source artwork, approval records, disposable playthrough saves, manifests and raw profiling traces. Commit the code, original design specs and small synthetic fixtures. On completion, record the final versions, remaining device findings if any, and the selected sprite density in the handoff. Close F120 and retire its working packet according to Farm's normal handoff convention.
