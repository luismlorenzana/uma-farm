# F112 — Conversation environments and game art coverage

**Status:** Authoring packet. Three new location studies and a Forge icon style sheet are in private review. Two existing interior studies have owner approval. The running game is still on the pre-F112 art mappings.

## What the player sees

Every conversation opens in a recognizable place. An arrival can start at the farm gate, a café date happens at the café, and a spouse visit can move from the sitting room to the bedroom and then to the same room in morning light. The background stays in place while the speaker, expression, text, or choice changes. Character illustrations still take over for their authored beats. The Library still collects and replays the character scenes the player earned.

Every inventory entry has art that identifies what it is. Rings look like finished rings, a jar of jam looks different from berries, and a Restaurant recipe has its own plated dish. The same icon follows the item from a recipe or commission to inventory, shipping, gifts, or meals. A grade or star badge can distinguish lots of the same item. A shop seed packet and a farm-saved seed remain visibly distinct. Shared tool upgrades and heirlooms have art in their respective Forge and relationship screens.

## Location catalogue

The built-in input set is the 34 distinct `STORY_PLACES` and 10 town locations. The art keys below describe the camera or physical setting and can resolve multiple game keys where they really share a location. Check all keys against the current code and aggregate the latest private pack's place usage, including branching steps and `town.json` locations, before deciding the size of the final export. Keep the private story's location names and dialogue in its own repository.

| Batch | Location keys and backgrounds | Variants and visible landmarks |
|---|---|---|
| 1 · Everyday farm | `gate` lane and open gate, `fields` eye-level crop rows, `fishery` pond bank, `pond-night` the same bank after dark, `forest` a wooded path, `orchard-bench` a seat beneath fruit trees | Quiet early-farm view at the gate. Seasonal colour and crop silhouette on the open farm. Reuse the pond geography between daylight and moonlight. |
| 1 · Town and dates | `town`/`plaza` square and fountain, `cafe` café, `market` covered stalls, `library` reading room, `track` town racing oval, `harbour` waterfront promenade, `harbour-wall` low stone seawall, `hilltop-track` grassy ridge course, `overlook` ridge view, `sea-pier` open sea pier | Café morning and afternoon. Market under awnings. Dawn and dusk where date options need them. Harbour promenade, stone wall, and pier use one coast design with separate camera positions. |
| 1 · Home life | Farmhouse table and kitchen corner, home threshold, solo armchair, duo armchairs, bedroom | Table at breakfast and dinner. Sitting room has a single chair and a two-chair view. Bedroom at night and morning with the same furniture. Review the existing bedroom study's mattress and bedframe fit before selection. |
| 2 · Farm jobs | `mill` flour workroom, `coop` run, `barn` stalls, `sawmill` timber shed, `smokehouse` curing racks, `kitchen` farm cook's counter, `mine` entrance, `smelter` furnace, `quarry` stone cuts, `cutter` stone-working bench, `restaurant` dining room, `forge` anvil bay | Fixed architecture and role-defining tools. Use a separate close bench view for ring commissions or heirloom handoffs if the wide anvil bay cannot read. Restaurant and town café have distinct rooms. |
| 2 · Errands and travel | `bin` shipping yard, `warehouse` shelves, `board` farm-side noticeboard, `dock` farm mooring, `boat` deck, `shop`/`store` general-store counter, `rancher` ranch counter, `mayor` town office, `smith` town smithy, `expeditions` staging lodge | Farm Forge and town smithy have separate contexts. Check the authored scene before assigning `shop` to the shared public counter. A story-specific shop gets its own mapping. |
| 2 · Ceremonies and town history | `festival` festival grounds, `chapel-bell` chapel steps and belfry, `dorm` retired dorm exterior, `dorm-porch` porch view | Wedding venue follows the player's selection. Festival grounds first get normal contest and lantern celebration views. Add a dedicated perspective when a flower, fishing, cooking, animal, harvest, or Greater Festival scene's staging calls for it. Dorm art remains available to scenes independent of the map. |

The scope includes every distinct setting actually used in play. A second palette is enough for some times of day. A bench, indoor counter, or ceremony with a materially different view gets a separate composition. Add a seasonal plate when a date or event explicitly depends on seasonal scenery, such as blossoms or snow. Validate that a gate scene on a fresh save avoids suggesting late-game buildings are already present. Background artwork and mechanical place unlocks are independent.

### Scene context and the shared engine

Keep a single environment resolver with a small per-player context consisting of `place`, `phase`, `season`, and an optional semantic `view` such as `sitting-duo`. A valid place step on the active script branch replaces the previous place at the next visible beat. An explicit scripted night place or view takes precedence over the current clock. A start or resume feed supplies the place when the scene opens without a place cue. An unresolved authored place keeps its written name and receives a place-kind fallback.

| Player surface | Where it gets the setting |
|---|---|
| Opening, first meeting, work invitation, moving in | Active script place, then the opening, arrival, farm gate, or house entry for that scene. |
| Friendship, romance, confession, proposal, wedding, spouse ladder | The actual played route/alternative and selected venue, then the event's opener. Keep the same setting through narration, choices, and the return from an in-scene minigame. |
| Morning outings, afternoon dates, after-play conversations | Use the location and time of the chosen outing. Preserve a scripted move within a date. Use café in contextual breakfast dates and the home table for meals. |
| Town talk, gifts, shopkeepers, farm talk | Actual interaction spot or counter from the caller or her working location. Use the town location's approved alias or kind for custom places. |
| Solo and duo spouse visits, birthdays, anniversaries, wedding night, night rank scenes | Choose solo/duo sitting room, bedroom, farewell threshold, and morning room by beat. The outfit system still supplies each person's look. |
| Pair bonds, Day/world occasions, household celebrations, Greater Festival | The location attached to the active script or party venue. Duo relationship partners and household guests remain the existing data. |
| Library replays | Use the replay's actual scene variant and historic day/phase when present. Resolve ambient art even in text-only replays. If an older receipt has no location or time, use script context and that scene type's default. |

Implementation belongs to Farm's [dialogue Stage](../../../apps/web/src/dialogue/Stage.tsx) and its callers. Run context resolution over the displayed step stream after choice expansion, including before a player skips silent place and illustration instructions. Pass context through shared script and choice components so narration and branching choices keep the same environment as spoken lines. Use the stage bounds for the image and keep the portrait, look provider, dialogue plate, header, choices, and contrast scrim as independent layers. Both displayed and preloaded busts use existing portrait rules. Keep pass-through art tap behavior and the frame's skip and back controls.

Resolve a registered explicit view first, then a matching place and phase with a matching or all-season revision, then the place's compatible default. Finish with an approved fallback for the place kind and light, such as exterior day, interior day, interior night, or dark outdoors. A missing file or failed decode falls through once to a compatible fallback. Avoid using daytime exteriors for an explicitly dark stage. Reuse a rendered image across steps with the same key and fetch only the current plate and the next known distinct place. Full-screen character art uses the existing `ArtCue` and illustration rules and can restore the underlying plate when it closes. Only character illustrations generate gallery receipts.

### Composition and delivery

- Author character-free 16:9 masters around 1680×945 or larger. Compare the central crop with the actual 844×390 and 667×375 stage bounds, safe areas, portrait silhouette, longest dialogue line, and multi-choice card. Use a focal point per variant and restrained values behind text. Keep the landmarks readable beside the portrait at both sizes.
- Export optimized WebP at approximately 896 and 1600 px wide as required by the looks at device pixel density. Start with 180 KB for the smaller plate, 320 KB for the larger plate and 500 KB total extra transfer for a normal first scene including a probable transition. Record exceptions against device captures. Maintain the existing 180 KB gzip shell budget.
- Original shared environment art can ship as a dedicated `farm-scenes` family in `@luismlorenzana/uma-art`. Keep the images in separate Vite assets, with a scene-lazy index and hash-versioned URLs, so Farm can ship or roll back a pin independently of its story. Any asset bearing private character or extracted imagery follows the existing private art channel.
- A release manifest row identifies `artKey`, `variant`, eligible `phase` and `seasons`, `kind`, normalized `focal`, approved `sourceSha256`, and output filenames, dimensions, and hashes. Put gameplay-place-to-art mappings in Farm. A schema/coverage check must catch unknown keys, overlapping defaults, missing output, invalid focal points, or unapproved sources.

## Inventory and other art coverage

The baseline audit enumerated **924 unique stock IDs** using the domain catalogue and looked up their actual frames. All stock IDs resolve to a current sprite position, but **166 use borrowed subject art**. Seven tools at five tiers and four heirlooms add **39 non-stock appearances** to wire. These counts describe the F111 baseline and get regenerated at release. The private row-by-row baseline is at `uma-art-authoring/content/authoring/item-studies/farm-life/coverage/f111-baseline.csv`.

| Catalogue | Coverage and art to author | Game integration |
|---|---|---|
| 522 goods | 312 underlying item identities including 12 new conversion subjects. The 36 exact-grade conversion IDs currently use their ingredient art. Draw yogurt, butter, farm cheese, goat cheese, carrot pickles, preserved egg, preserved duck egg, tomato sauce, strawberry jam, raspberry jam, blueberry jam, and persimmon preserve. Preserve existing recognizable base art and intentional grade reuse. Check the 51 crops and orchard growables, livestock products, fish, ores, crystals, stones, woods, herbs, fibers and refined outputs against their displayed names. | Warehouse, fields/growing and seed harvest, station orders, ranch, gifts, expenses/loans, shipment, discovery, and festival selection. |
| 192 seed IDs | Keep the seed-packet overlay and own/shop cue. A crop family shares its produce icon. Preserve exact crop, season and grade in text and on the stock record. | Shop rows and seed picker, warehouse, payouts and input forecasts. |
| 80 Kitchen dishes | Retain their dedicated `dish-…` atlas entries. | Include kitchen, recipes, reserved meals, wedding reception, and cooking contest in coverage checks. |
| 120 Restaurant dishes | Replace the current 30 borrowed category sprites with a dedicated frame per dish. Author eight batches of 15 from the actual recipe names and ingredients. Give near-neighbours distinct carrier/silhouette and garnish relevant to the finished dish. | Restaurant recipes, discover/unlock, ingredient choice, cooked output, sell/ship, meals and warehouse. Use exact dish IDs where another recipe consumes one. |
| 10 wedding rings | Author a distinct band and stone setting for each grade, with matching detail art for pickup and proposal. See [wedding ring art](#wedding-ring-art). | Ring Bench shop/commission and pickup, warehouse, proposal and ring upgrade, spouse details, Library and shipping. Material, grade, cost and effect stay visible. |
| 7 tools × 5 tiers | Draw a recognizable base and tier treatment for `watering-can`, `hoe`, `brush`, `pick`, `hammer`, `rod` and `axe`. Maintain a readable silhouette through tier five. Use material accents or shape details plus the tier label. | Forge upgrade and install, equipment view, relevant work previews. The artwork represents the shared fleet equipment state. |
| 4 heirlooms | `earrings` as a pair, V-shaped pendant `necklace`, horizontal `bracelet` arc, and a clasp `brooch`. Match the heirloom family and keep each silhouette distinct from a wedding band. | Forge ordering, pickup and gift, the recipient's slots and relevant outfit lock/unlock details. |
| General game art | Audit item-like rewards, minigame props, loan-type rows, chart/festival symbols, farm buildings and town markers. Farm's map marks `coop`, `board`, `dock`, `expeditions`, `town` and `boat` as borrowing building frames today. Draw originals for those six and check any remaining blank or misleading visual found in play. Keep building sprites on the map and wide conversation art in the dialogue renderer. | Surface audit records the screen, displayed object key, current asset, dedicated/intentional reuse/borrowed/missing, replacement and screenshot evidence. Covers locked, held, queued, completed, and reward states where they exist. |

Export transparent 32×32 icons through the platform's deterministic atlas pipeline. Review them at native size and on the actual light and dark UI. Keep 2× art crisp and overlays outside the subject's important features. Choose stable frame keys `ring-gN`, exact dish IDs, ungraded conversion IDs, `tool/<id>/tier-N` and `heirloom/<id>`. Add a Farm art sheet or append within an appropriate family while retaining existing frame metadata and positions. Keep `ItemIcon` as the stock renderer and use its frame contract for Forge artwork. Resolve exact named art first, then declared grade/seed composition. Keep a readable label on any unknown legacy item. A coverage command compares all stock and visual-only keys to exported frames and fails on missing art or unapproved placeholder mappings. Grade and stars still come from the game, independent of the sprite key.

### Wedding ring art

Give all ten rings the same three-quarter viewing angle and a visible band opening. Make each grade recognizable by band silhouette and setting geometry before colour. Copper should look carefully handmade. The endgame rings add finer metalwork, bolder stone cuts and more unusual band shapes.

| Ring | Band and setting |
|---|---|
| Copper · G1 | Wide hammered copper band with a tiny flush-set pale stone. |
| Tin · G2 | Pale twin-groove band, low profile and three small inlaid dots. |
| Iron · G3 | Dark squared signet with a flat inset violet stone. |
| Silver · G4 | Narrow polished band and a round four-claw solitaire. |
| Cobalt · G5 | Two sweeping blue shoulders framing an offset pear-cut stone. |
| Gold · G6 | Warm shoulders with three separate stones and a larger round center. |
| Platinum · G7 | Split shoulders and a rectangular green emerald cut. |
| Titanium · G8 | Broad, angular two-tone band and a slim angled inset. |
| Mythril · G9 | Pale intertwined shoulders beneath a wide icy marquise. |
| Orichalcum · G10 | Champagne-gold leaf shoulders and an elongated, bezel-set opal kite. |

Draft v002 contains all ten native-size sprites and a larger Orichalcum illustration. For the final set, author a matching detail illustration for each design for close views at Ring Bench pickup and proposal confirmation. The small inventory, spouse, Library and shipping views use the atlas. Resolve both assets by the same `ring-gN` key and load the larger image on demand. The atlas remains visible if a detail image is unavailable. Keep the commission's material, cost, grade and effect readable in the UI.

Review the icon beside its adjacent grades at 24 and 32 px, including on light and dark panels. Match the setting, band, stone and palette to its detail illustration. Compare the actual closed ring shape against the current borrowed frame, and verify that a commissioned ring keeps the same art through pickup, inventory, proposal, and spouse details.

## Source, review and publishing

| Location | Contents and responsibility |
|---|---|
| `uma-art-authoring/content/authoring/scene-studies/farm-life/<place>/<variant>/vNNN/` | Private native source, exact prompt and reference roles, hashes, provenance, review, crop evidence, and exact-byte approval. The three new environment plates are v001 drafts. The approved v002 solo/duo armchairs are already in Art Authoring's `assets/farm-life/scene-studies/v002/`. |
| `uma-art-authoring/content/authoring/item-studies/farm-life/<family>/vNNN/` | Private style studies, variants and review material. `forge-inventory/v001` is the rings, tools and heirlooms concept sheet. The revised ten-ring atlas and Orichalcum detail study are in `ring-icons/v002`. The first atlas stays in `ring-icons/v001` for comparison. |
| `uma-platform/packages/art` and the package's authoring/export sources | Deterministic atlas source, runtime environment manifests and optimized exports of approved original work, contact sheets and coverage tests. Add a Changeset, release the minor version, and pin it exactly in Farm. Preserve prior art exports. |
| `uma-story-authoring/content/farm/story/` | Existing script and place cues. Use `place` steps for actual moves, and only author new lines when a scene itself needs them. Keep backward-compatible keys and use the existing private `story:ship` workflow for any edited story. |
| `uma-farm/apps/web/src/dialogue/` and `apps/web/src/items/` | Resolver, stage, alias table, typed fallbacks, icon maps, and runtime QA. Visual mappings use the existing save schema. |

Keep draft and superseded versions. An approval identifies the exact candidate and hash. Approve a new revision when pixels change. The public task packet tracks what needs drawing and wiring. Keep private art and stories out of Git and reuse the established publishing channels. Keep approval and usage distinct so an approved source can have runtime states of awaiting export, exported, pinned, and live.

## Order of work and acceptance

1. Run the item lookup and scene-key inventory on the current release. Produce a private review contact sheet with current and proposed art, actual screen and alias, draft/approved revision, and game coverage. Confirm which script uses require dedicated seasonal or phase variants. Add a compatible fallback for each scene type.
2. Bring the shared stage up on the first approved group. Exercise a place change inside a branch, a character illustration, choices, visits and a historical replay. Review it at both landscape sizes before expanding the catalogue.
3. Finish the plates and sprites in batches. First cover rings, tools, heirlooms and conversions, then all eight Restaurant stages, then remaining general art. Record each new asset's mapping and verify it has a real in-game entry point. End with zero unexplained stock borrowings, missing frames, or unmapped active scene locations.
4. Run fresh and established-save tours. Cover first talk, farm and town schedules, dates, wedding in each available venue, first solo and duo night stays, birthday and anniversary, Greater Festival, and Library replays. Check default and authored packs, failed and slow image loads, returning from a minigame, and the first landscape scene after an update. Exercise the ring commission and proposal, all four heirloom rewards, and a Restaurant dish moving between sale, ingredient and meal. Use synthetic test fixtures.
5. Verify built atlas lookups, current and next image load behavior, focus/tap targets and visual contrast, shell size, and release-candidate performance in the two landscape sizes. Publish the approved art version and Farm pin through CI. On the live iPhone build, verify that the versioned files load in a standalone session and the Library receipts and saves still behave. Update the mechanics and story guides and close the packet when that work ships.
