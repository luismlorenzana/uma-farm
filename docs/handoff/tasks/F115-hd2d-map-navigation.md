# F115 · Painted maps, HD-2D locations and building interiors

**Status · Implemented.** The farm overview becomes a painted map with six tappable regions. Each opens a local HD-2D scene. Doors and other entrances open the destination at that location. Tapping an available Uma opens the separate full-screen conversation.

[Field and Pond](F103-hd2d-farm.md) is the live exterior and performance pilot. [F114](F114-hd2d-actors.md) supplied the live Tier 1 walking sprites. F113 supplied the painted town, its six districts and 17 destinations. Keep the existing save, stable place IDs, job rules and action costs as the source for this work.

## Navigation

| Layer | Farm | Town |
| --- | --- | --- |
| Overview | Illustrated map with Farm, Forest, Pond, Barns, Living and Work. A road sign opens Town. | The painted town overview opens the existing six districts. A road sign leads back to the farm overview. |
| Section | Local HD-2D exterior with current crops, animals, buildings and occupants. Show only the area being visited. | District painting with individual building entrances and outdoor destinations. Streets can show outdoors Umas from the current schedule. |
| Destination | A door opens a separate interior. A field sign, trail, fishing spot or station without an interior opens its existing activity at that location. | A building door opens its illustrated interior with tappable standing sprites and the service controls. A plaza, harbour or track stays an outdoor destination. |
| Conversation | An available Uma opens the full-screen conversation stage directly from any of these views. Back returns to the same place. | The same conversation entry and return behavior as the farm. |

The overview is the default Home entry. Use labeled hotspots on the painting and a matching compact destination list. Show relevant open, under-construction and locked states from the save. Panning and zooming must keep hotspot geometry tied to the illustrated landmark. Section entrances, doors, exits and sprite taps are free navigation. The selected gameplay action spends its normal cost when confirmed.

Assign stable place IDs to the painting hotspots and to every section and interior entrance. Routes preserve the current section, building, selected plot or house and current camera position on return. Direct links from What Next, Work, the calendar, requests and story scenes resolve the same destinations as map taps. An invalid or stale deep link falls back to the nearest valid ancestor and shows the current lock reason where applicable. A story that moves the player deliberately returns to its resolved destination.

## Farm coverage

Every place has a single physical home in the navigation. A related building or activity can link across sections through its existing route.

| Region | Exterior and live state | Entrances and activity targets |
| --- | --- | --- |
| **Farm** | Cleared fields and orchard rows, using real plot and tile positions. Show crop type and growth stage, watered or dry soil, ripe produce and cleared or uncleared ground. Show active hands at their assigned plots. | Plot signs open Fields and its tile actions. Orchard rows use the same plot system with the woody crops and growth states. Mill door opens the Mill. Gate marks the road to town. |
| **Forest** | Woods and trailheads for the six existing forest areas. Show the actual gathering area, seasonal props and recorded forage or chop work. | Trails select Woods, Hills, Old Forest, Mountain, Misty Vale or World Tree under existing reach rules. The Sawmill door opens its station. |
| **Pond** | Pond bank, fishing markers and the Dock and Boat as built. Show workers at their assigned fishing spots, and shift/availability status at the bank. | Reach the Pond, River, Lake, Falls, Moon Pool, Sea Pier and Deep Sea through the existing fishing rules. Dock is the shared location for the pier and moored Boat. The Smokehouse door opens the Smokehouse. |
| **Barns** | Coop and Barn lots, pasture, feed and water props, and the current animals with an identifiable home. Show built levels and current feeding or collection states where the game records them. | Coop and Barn doors open their rooms and existing animal management actions. Show the Silo with the Coop under its current feed rules. |
| **Living** | Farmhouse, existing built houses and applicable lodge wings. Group households by actual room assignment and make the full resident roll reachable from the section. | Each occupied home has a distinct door and resident list. Enter the assigned home or select a room within it. Keep room assignment, moving in, meals and night visits on their existing routes. |
| **Work** | Production and shipping yard. Show construction state, station queues, the ready shipping crate and actual jobs at their respective stops. | Doors or entrances for Kitchen, Mine, Smelter, Quarry, Cutter, Forge, Warehouse and Restaurant. Shipping bin and Requests board are exterior targets. Work planning stays available from the Work section. |

The overview road links to Town. Shop, Festival ground and Expedition post keep their existing routes and unlocks. Surface them from town and its existing service shortcuts. The farm expedition destination and the town district's dispatch service share the same underlying facility. The Ring Bench and Forge Workshop keep their separate access rules beneath the Forge entrance, including saves that have the Bench before the Workshop. Open lots, buildings queued for tomorrow and completed buildings use the save's current state.

### Town districts

| District | Doors and destinations |
| --- | --- |
| Plaza | Plaza, Mayor's Office, Estate Office, Little Studio |
| Market | Market, General Store, Little Bakery, Salon |
| Library & Café | Library, Café |
| Harbour | Harbour, Harbour Inn |
| Smithy & Ranch | Smithy, Garage, Rancher |
| Hilltop | Track, Expedition post |

Keep storefront, counter and person interactions distinct. An interior can be an authored still plate with standing sprites at stable authored positions. The Library research, Kitchen and Café handoff, Requests board and profession services open their existing controls from their matching desks and counters. A scheduled keeper can be present without requiring the player to speak to her before using an existing self-service route. Town interiors use the same exact ID that schedules and dialogues already resolve.

## Presence, residence and work

- **Work is a view of the save.** During the morning crew window, project the actual receipt when available, including auto-assigned jobs. Before the receipt, use the current eligible schedule and work plan. A forecast can place a worker on her planned approach and must read as planned if surfaced in a label. When the shift ends or its location changes, use current presence rather than leaving the worker in the finished job pose.
- **Location is specific.** Use the actual place and, where available, plot, forest area, fishing spot, animal home or station. If a receipt only proves a plot or building assignment, display that worker at an authored anchor for that plot or building. Record finer read-only evidence where justified before drawing individual task actions. A worker with multiple jobs has one current position and a visible list of her other assignments in Work. Use a stable ordering for competing destinations and keep job credit with the simulation.
- **Presence follows time and availability.** Combine existing profession shifts, outing reservations, household availability, current part of day and expedition absence. An assistant who is at the Inn, in town or away does not appear in a farm job scene for that time. At an outdoor or indoor town location, the current on-site roster comes from these same schedule rules and existing service data. One Uma is visible in one location at a time.
- **Living shows all residents.** List every Uma with a farm room under her assigned house or wing, including on large saves. On-site residents appear as sprites in their current house, room or common area. Each resident who is at work, in town or away stays listed with her actual whereabouts. A reachable place link takes you to her there. An unavailable resident has a status and a Library link. Marriage without a room assignment still follows the Inn rule. Moving or swapping a room updates the resident list and placement without changing professions or shifts.
- **Dense views stay readable.** Give every present actor a way to be selected by name. Use bounded house and wing views with the full household list, and a Here now list for crowded yards and public buildings. The list and sprites use the same tap handler. A missing walking set gets the readable stand-in with the same name, position and interactions.
- **Three variants.** Spring for general presence, town and daytime home. Farm Work for a real farm assignment. Pajamas for bedtime and overnight context. Use an authored facing for standing interiors. Publish art through F114 and Platform's existing private sprite pipeline.

## Full-screen dialogue

1. Tap a sprite's on-screen target or its matching Here now entry. Resolve current presence by identity and exact place. A moved or unavailable Uma shows her status or current location and the available actions under existing rules.
2. Open the standard full-screen conversation stage with the appropriate backdrop and greeting. Present the existing Talk, Gift, Date and Event actions as allowed. A sprite tap by itself does not spend an action or record dialogue progress.
3. Pause the exterior or interior renderer and remove its input surface while the conversation is active. For this rollout, keep the walking-sprite layer out of dialogue, cutscenes, splash reveals and Library replay. Display the authored portraits, expressions, backdrops and full-screen splash art through the conversation engine. An approach animation can happen before entry on the map.
4. Close back to the origin with the same location and framing. Re-read the save and the current presence before drawing. Use the nearest valid destination if a completed event changes the place or time.

## Art and implementation

F116 completes the indoor kit as modeled rooms with reusable furniture, equipment and props. Characters stand on the room floor as sprites, and outdoor views use profile markers or location counts. Town navigation sits in a narrow sidebar beside the map.

- **Farm painting.** Author one landscape base with six recognizable silhouettes linked by the landscape. Keep expandable lots separate so houses, wings and workshops reflect the save. Author normalized hotspot shapes against stable landmarks and review the compact landscape while selecting a door and a nearby person.
- **HD-2D section kit.** Start with F103's straight paths, 41-degree overhead camera, native sprite scale and anchors, and its lazy shared renderer. Build each exterior as its own scene with clear ground paths, work anchors, doors and gathering markers. Produce the environment art in the established shared art pipeline, with released assets loaded only for the selected scene.
- **Interior kit.** Author one recognizable room per location, with door return anchors, counters or activity anchors and visible standing positions. Reuse material palettes and lighting presets across home types. Keep painted backgrounds, approved sprites and story art in their existing publishing paths. The route and occupancy metadata can live in Farm. Private character art and story material stay outside Git.
- **Projections and controls.** Read the field, ranch, production, construction and household states through their existing selectors. Keep the renderer read-only. Use a shared location and actor target list for the painted map, scene hit targets and fallback controls. Use the same existing action handlers when a user selects a service or a conversation action.
- **Phone budget.** Load 3D only on section entry. Load one section or room at a time and release or suspend it when covered or left. Keep the initial JavaScript budget at 180 KB gzip. Validate with F103's measurements on the owner’s iPhone and keep the destination and people lists available on renderer failure, context loss and missing art.

## Rollout and acceptance

| Pass | Ship target | Checks |
| --- | --- | --- |
| Navigation pilot | Painted farm overview, Farm exterior and Mill door, plus one town district and a room such as the Library. Sprite tap opens the existing full-screen stage. | Test overview → section → door → person, Back to the same scene, old links, day-one locks, action cost and rendering fallback at 844 × 390 and 667 × 375. |
| Farm regions | Finish the six exteriors and their interiors or activity targets. | Solo, 10-, 20- and 50-Uma saves. Compare scenery and placements to planted plots, livestock and produce, station jobs, open lots, forecast and actual receipts. Include crew shift boundaries, days off and expeditions. |
| Homes and Town | Finish household doors, all 17 town destinations, interiors and service entry. | Every assigned resident remains listed in Living. Move a resident from the Inn and swap her room. Confirm daytime work, away status, bedtime return, valid actor taps and no duplicate physical presence. Tap through all six districts. |
| Release review | Verify content delivery and signed-in Home Screen use on physical iPhone. | Check portrait dialogue and splash takeover from both environments, scene return and replays, cold and cached load, background/resume, missing art and context recovery. Capture the F103 phone session before increasing visual budgets. |

Local Chrome walkthroughs covered all six farm exteriors and all 17 town destinations at 844 × 390 and 667 × 375. The solo save kept the Mill locked. Synthetic 10-, 20- and 50-Uma tests cover crew and household presence. The physical iPhone performance and signed-in Home Screen review remains open.
