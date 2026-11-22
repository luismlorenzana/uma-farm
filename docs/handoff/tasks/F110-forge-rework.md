# F110 — The Forge and the crew's tools

**Status · Authoring draft for owner review.** The Forge remains deferred on the active roadmap. Prices,
gates, action savings and crafting rules below are proposed. Ring integration is a separate approval.

## Why

Tools are a capital investment in the farm. A solo farmer buys back time for town and relationships. At 10, 20
and 50 Umas, one improvement follows the work across staggered shifts and pays off even if the player rarely
waters, digs or fishes. The usual work assignment is all an Uma needs. The Forge should let you see the effect
on tomorrow's jobs and have a reason to come back when your bottleneck changes.

### What exists today

| Live | Where the rework starts |
|---|---|
| Seven Basic, farm-wide tool slots, with five legal tier values | Keep the seven slots and make upgrades install into them. |
| The crew settles once at the end of Morning. Assignment, skill tricks, available actions and actual tasks govern what gets done. | Use the same job rules for crew, player and forecast. Keep the town rota, expedition absences and Night visits. |
| The Hoe's latent tier affects seed return and crop stars. Axe, Rod, Pick and Hammer have latent gathering hooks, including a scaling factor that reaches ×1.60. The Can and Brush have no operational upgrade path. | Activate deliberate effects for all seven. Explicitly bound gathering across the farm before it can scale with 50 workers. |
| The old disabled Forge card calls for Rank 8, 60,000g, 120 planks and 60 logs. | Replace that initial cliff with one small restoration. Higher work still requires real F99 supply chains. |
| The Ring Bench opens the dawn after the first played Romance 8. A solo farmer can make a Copper Ring with six Pine Logs. | Keep that direct route, counter and marriage flow whichever room layout is approved. |

Start with [building and rank](../../game-mechanics.md#building), [farmhands](../../game-mechanics.md#farmhands),
[the ring bench](../../game-mechanics.md#the-ring-bench), and the current
[place registry](../../../packages/domain/src/farm/places.ts),
[shift resolver](../../../packages/domain/src/farm/farmhands.ts) and
[work coverage](../../../packages/domain/src/farm/work-coverage.ts).

## Progression and recipes

Restore the workbench from **Farm Rank 3** for **1,000g and 12 logs** of any grade or stars. Pay from Farm, open
the following morning. Sawmill access starts at Rank 3 and is the ordinary first tool supply path. Workshop
restoration has no relationship condition, and the first tool requires no Mine. Order fees cover running costs,
so the restored workshop adds no nightly upkeep. The Rank 3 item in **What Next?**
shows the workbench, Sawmill and first recipe as separate prerequisites, then records the first delivery.

| Tool tier | Earliest rank | Exact inputs per tool, any stars | Payment | Ready | How you find it |
|---|---:|---|---:|---|---|
| Basic · T1 | 1 | Starting tool | — | Day 1 | All seven start at Basic |
| Fitted · T2 | 3 | 6 Pine Planks (G1) | 300g | Next dawn | Pines in the Woods, planks at the Sawmill |
| Iron · T3 | 4 | 4 Iron Ingots (G3) + 4 Pine Planks (G1) | 1,200g | Next dawn | Mine floors 7–9, then Smelter |
| Gold · T4 | 6 | 6 Gold Ingots (G6) + 4 Iron Ingots (G3) | 3,600g | Second dawn | Mine floors 16–18, then Smelter |
| Mythril · T5 | 8 | 8 Mythril Ingots (G9) + 4 Gold Ingots (G6) | 9,000g | Second dawn | Mine floor 25, then Smelter. Going deeper is optional. |

Each tier requires the previous tier of that tool. The Forge offers 28 orders across seven tools. Every tool uses
the four recipes in the table. Tool tiers and material grades are distinct from quality
stars. Inventory from any valid source can fulfill an order. Mine-floor labels teach the reliable source and are
independent of the craft gate. The cheapest eligible stars are shown first, honoring existing Warehouse reserves.
Any explicit use of protected stock is confirmed separately through the established stock override pattern, if enabled.

The lean first route costs **2,800g and 58 logs' worth of wood**, including the 1,500g/40-log Sawmill,
12-log restoration and six Pine Planks (one Pine Log each). A player with a Sawmill already standing spends
**1,300g, 12 logs and six Pine Planks**. Each tool can be improved for **14,100g** plus materials over its four orders.
Buying all seven is optional, and costs 98,700g before the workshop restoration and supporting buildings.

## What each tool changes

In the table, per-action capacity improves eligible work only. For crops, select from the same plot and assignment,
in row-major order. For animals, stay in the same home. Apply the greater of the tool and existing aptitude capacity.
Use the existing eligibility, sort order and attribution on each affected tile or animal. Each grouped action spends
one action and earns one action of practice. Keep per-target farm work credit, crop tenders and animal caretakers.
The quantities in the table are the proposed starting values for balance.

| Shared tool | Fitted | Iron | Gold | Mythril |
|---|---|---|---|---|
| **Watering Can** | 2 dry tiles per action | 1 dry row | 2 dry rows | 3 dry rows |
| **Hoe** | Till 2 clear tiles | Till 2 clear tiles | Till 3 clear tiles | Till 4 clear tiles |
| **Brush** | Care for 2 animals per action | Care for 3 | Care for 4 | Care for 5 |
| **Axe** | +1 normal log on the first 1 eligible chop per day | First 2 | First 3 | First 4 |
| **Pick** | +1 normal ore on the first 1 face per day | First 2 | First 3 | First 4 |
| **Hammer** | +1 normal stone or gem on the first 1 face per day | First 2 | First 3 | First 4 |
| **Rod** | +1 normal catch on the first 1 eligible cast action per day | First 2 | First 3 | First 4 |

- **Can and Hoe.** Water only crops that currently need it. A row counts when at least one eligible dry tile is
  present, and covers only eligible cells in that worker's assigned row. No cross-plot batching. A skilled worker
  keeps her existing one-row watering or clear-and-till trick when the installed tool is below it. The Hoe batches
  only clear ground. Overgrown targets still use the existing clear or clear-and-till action, one weeded tile at a
  time. On harvest the Hoe also adds **0.125 quality points and 2 percentage points to seed return per tier above
  Basic**, replacing the currently dormant higher-tier coefficients. Seed grade follows the planted crop as today.
  Harvest capacity, grade promotion and seed-ladder rules stay with the existing crop systems.
- **Brush.** Only the care step batches. Hungry animals still need their existing feed and fodder, and collecting
  goods remains a separate step. Each cared-for animal gets the usual fondness and worker credit. Tool tier alone
  adds no animal product grades, stars or volume.
- **Axe and Rod.** Only regular chops and casts eligible for a full haul can spend a charge. Foraging, thin
  spots and contest actions never spend one. For fishing, run the extra catch through the existing seasonal table,
  fishing mode, size and exact-grade rules. Show the extra fish in the solo result as well as the crew receipt.
- **Pick and Hammer.** An extra normal find uses the current floor's existing grade and family draws and can
  discover a real good. A face still gives one face of stair progress, and existing rank/reach gates still apply.
  Count ordinary finds toward per-find Mining challenges. A charge is consumed by one action.
- **Gathering balance.** Axe, Rod, Pick and Hammer use these daily caps in place of latent tool yield and tool star
  buffs across the full day. Preserve rank, aptitude, food, keepsakes, ordinary grade odds and diminishing returns.
  Give each bonus draw its own deterministic stream, so stock and discovery are real but base rolls and reach don't
  move with the upgrade. Count only base work for existing aptitude, rank challenges and contest evaluation.
  Charges are shared by all eligible jobs performed by the player and crew. Keep one tally per tool and reset it
  at dawn.

### Does it help on a busy farm?

Worked example with dry tiles in three rows of six, and two novice actions left before the shift. Each number is
calculated from the proposed capacity rules, with work assigned on one plot. These are design examples.

| Can in use | Actions for all 18 | Wet after 2 actions | Still dry |
|---|---:|---:|---:|
| Basic, novice | 18 | 2 | 16 |
| Fitted, novice or a two-tile aptitude | 9 | 4 | 14 |
| Iron, or an Uma who already waters full rows | 3 | 12 | 6 |
| Gold (two rows per action) | 2 | 18 | 0 |
| Mythril (three rows per action) | 1 | 18 | 0 |

A 50-Uma crew sees benefit through work that can be reassigned. An extra Gold Can action on a skilled field
crew can go to harvest or meal prep if those jobs are on the worker's plan. A Mythril Pick yields at most four
extra ore farm-wide that day, even if 20 Umas dig. Show the two kinds of benefit separately in previews.

## Workshop flow and staff

1. **Open Forge from Farm or What Next?** The workshop shows installed tiers, the single active order and its
   ready date, and the selected tool's next recipe. Choose a tool by the work you want improved.
2. **Review the order.** Show current → next on one line, cost and owned count by exact item, blockers, and a
   read-only preview comparing tomorrow's assignment coverage with and without the installed tier. Use the first
   upcoming Morning on or after delivery for a multi-dawn order, labeling the input snapshot date. A stat example
   is always available when the farm has no relevant scheduled work.
3. **Place an order.** Charge the shown gold and lots once, take one player Morning or Afternoon action and occupy
   one workshop slot. The old tool stays in service until delivery. No due-date dependency on a town NPC, a farmhand,
   or a return trip. Once committed, the order completes even if the page closes.
4. **Optional Uma assistant.** Book one available hired Uma's Morning farm action before the shift settles. List
   only eligible farm-day/onsite hands with a free action, from the shared booking rules. Show the affected work
   forecast before confirmation. This is assistance with preparation today. She gets the credit even if tomorrow
   is her town day or she is away on delivery. The player chooses the assistant. An Afternoon order works solo.
5. **Optional tempering.** A tap-to-strike rhythm with a Ready visual cue using the existing anvil UI vocabulary.
   Preview one strike, then play five short cues with no overall session clock. Three on cue earn a maker's stamp,
   shown on the tool in the order history. A skip, poor result, interruption, or legacy client uses standard finish
   and the same tier/date. No added action, material loss, yield multiplier or relationship gate. Commit the stamp
   at most once before delivery. Show Start and Skip before play, with one scoring attempt per order.
6. **Delivery at dawn.** Install automatically, update Farm Rank/What Next? and show one linked Daily Report line.
   Morning crew work uses the installed tool, and Work calendar uses the same effect for its forecast. A tool
   upgrade can be ordered on the delivery date because the prior slot is already free.

The Work calendar shows actual named assignments and their gaps. Add **Forge · [Uma]** for a booked Morning, and
**Gold Can ready** on the delivery date with updated forecast counts. Use the existing allocation-versus-missing
styling. Re-evaluate from the same draft save snapshot and same scheduling rules before and after the upgrade.
New planting, harvests, purchases and assignment changes can change the forecast. For gathering tools,
use **2 bonus pieces left today**
as an explanatory detail at the job, then show any extra items in the existing work receipt.

### A path for the smithing Uma

- A crew member gains Forging progress for preparing an order. For repeated skill growth, **Practice fitting**
  uses one unreserved Pine Plank plus one more Pine Plank for Fitted, or one exact-tier ingot for Iron, Gold or Mythril.
  It uses the one Forge assistant action for that Morning and completes with the shift. An active tool order can
  continue in parallel after its preparation day. Practice is limited to installed tiers, produces no Warehouse
  good and requires no minigame. Preview both the board displacement and material cost. No passive daily assignment.
- Use the existing Forging points, rank-up machinery and one rank-up per night. Proposed challenges by next rank
  are Hand (5 credits at any tier), Skilled (4 at Iron or better), Expert (4 at Gold or better), Master (4 at
  Mythril) and Legend (6 at Mythril after Master). One commission or practice equals one credit at its tier,
  awarded to the booked helper after Morning. That helper is also named separately at delivery. A rank can be
  completed via practice after all 28 upgrades have been installed. Credit goes to the named assistant.
- For activity-specific favorite-line perks, give eligible assistants the existing Forge line's +10%/+20% to
  Forging points, applied once through the normal rank path. Keep rank and tool performance separate. Retire preview
  copy for the unimplemented refund and free-Fitting placeholders from the shipped perk cards and review their
  authored references during implementation. A real salable Fitting, repeatable repair bills and added passive
  yields would need their own balance pass.

### UI, narrative and original art brief

| Surface | Content and feel |
|---|---|
| Forge on the farm | Timber lean-to, warm hearth, workbench, a vertical rack with each tool silhouette, room for an Uma at the rack. Start with the existing map tile and a static original counter illustration. A shared HD-2D interior can follow the map work without gating tools. |
| Landscape right sheet | Left set of seven tools, right selected details and date. At 667×375 keep the order button at the bottom, and let the list/detail body scroll. Make pending, affordable, missing-goods and max-tier states readable with words. |
| What Next? | Feature the Can for watering gaps, the Brush for recurring care gaps, or the tool the player tracks. Link to the actual stations and profession/crew panels. Keep farm-rank and romance paths independently useful. |
| Tutorial | A diagram shows one action watering two rows, then highlights the two freed worker actions in the forecast. A short caption covers when a new tool becomes available. A second local example explains exact ingots only when the player opens a material lock. |
| Daily Report | “Gold Watering Can installed · Two rows per action.” If assisted, “Prepared with {Uma}.” Links to the tool, with any rank-up in Ranks. |

The one-time opening note reads “Set the old tools on the rack. They'll stay in use until the new ones are ready.”
The first installation of each tool can show this delivery copy. Subsequent installations use the Daily Report.

| Tool | First-delivery line |
|---|---|
| Watering Can | “Try the back rows this morning. There should be time left for the harvest.” |
| Hoe | “Start on the clear beds. You'll get more ready before the seed crates come out.” |
| Brush | “Leave it by the stall door. The next shift can use it on the whole round.” |
| Axe | “Start while the stand is fresh. The first chops will bring an extra log.” |
| Pick | “Try it on the next face. The spare ore should get that smelter load started.” |
| Hammer | “Put a spare crate by the quarry path. We'll have another find to bring home.” |
| Rod | “Take it out while the water's fresh. Leave room for an extra catch.” |

Use a current playable assistant if present and a neutral note when alone. A town smith may speak on her
scheduled shift when available through the current role resolver. Keep retired NPC IDs out of new dialogue.
Reuse approved work/casual art if needed, with no new mandatory individual expressions. Specify separate day and
hearth-lit setups plus neutral task silhouettes in any future kit request to Platform. Character-specific dialogue
and derivative art belong in the private story/art sources and their usual publishing pipeline.

“Needs 2 more Gold Ingots” opens Smelter sourcing. “Ready Spring 14” opens the work date. “Morning crew already
worked” explains why an assistant is unavailable and leaves the solo ordering action available.

## Where rings could live

| Option | Player journey | Cost and risk |
|---|---|---|
| **Separate destinations** | Keep Ring Bench as its own map link and the direct proposal shortcut. The Forge is for tools. | Smallest mechanical change. Two adjacent destinations where one room could work. |
| **One building, two counters** · recommended | The Forge opens onto Tools and Ring Bench. The tool side unlocks with its restoration, the bench with the first R8 dawn. Proposal links jump straight to the bench, even if the tool side is still closed. | Two independent checks and tasks in one location. Keeps full solo marriage pacing and makes the room feel complete. |
| **Shared crafting system** | The same interface handles both, with a potential optional refined-ring finish using 2 ingots and 1 cut gem of the same grade once its supply chain is open. | Can make jewelry a late craft goal, but needs separate tuning for all ten rings, ring value, gifts, wedding stock and spouse bonuses. Sharing an order slot or requiring tempering for the proposal would recreate the relationship bottleneck. |

**Recommended layout** is one location with two counters that open independently. Keep the existing ten ring
IDs, grade, stars and bonuses, six-log Copper Ring, existing three-refined-goods recipes, one ring per day,
engravings, night reveal, proposal entry and wedding scheduling. Bench crafting stays self-service when the
smith is out, with its own daily counter. Treat the dormant legacy Fine/Great/Masterwork ring-bonus copy as
a separate design decision if refined-ring work ever goes ahead. The tool work is implementable once approved
even if the room-layout decision is still open.

## Implementation contract after approval

- **Pure domain.** Add a typed tool catalogue, exact recipe and lock selectors, order/booking mutations, delivery
  and shared tool-capacity helpers. Route both hand actions and crew work through the same primitives. Extend the
  Work calendar forecast and actuals using the same group sizes, charges and actual actor. Use the actual order
  duration and farm calendar. Player purchases, books and arrival all use the normal local save write path.
- **Additive save support.** Keep the current save version and legal `tools` values. Add optional Forge order data
  (ID, tool, origin tier, target tier, day ordered and due, assistant/credited or prepared status, cosmetic finish),
  compact last receipt per tool, and bounded daily charge and work data. Validate known tools, legal adjacent tiers,
  quantities and dates. Parse old saves with no order and full charges on their first playable day. For old saves
  with legal higher tiers, preserve the tiers. Existing state is authoritative for inventory, relationships and
  scene proof.
- **Disentangle old sentinel.** Separate the two capability predicates before making Forge buildable. Old
  `buildings.forge = 0` means the bench is already open. Any previously used positive Forge value retains existing
  access as well. Carry forward bench state before any restore overwrites the sentinel. A newly built workshop must
  write an explicit closed bench flag until the existing R8 night hook opens it and schedules the one-time scene.
  Replace direct Forge existence checks in the map, bench scene, built-gate alternatives, night, proposal and
  What Next? as appropriate. Keep shared story checks on the established bench/Forge alternatives for old scenes.
- **Atomic and reload-safe.** Recheck current locks, order slot, lots, gold and actions at confirmation. Stamp
  one action and booking, consume once, and never reserve the same Uma action twice. Closing mid-play leaves the
  standard order. Apply a due delivery once, at the existing night-to-morning handoff before forecast or crew
  settlement. Handle a decoded pending order already past due on its next local settlement. Preserve charge resets,
  grade lots and report attribution across retries, reload and sync. Verify that resuming a previous app build
  cannot erase a paid order. If older writers drop the new state, use the existing newer-save handling with a
  migrated version before rollout. All gameplay mutations stay on device.
- **Player surfaces.** Keep screens lazy, fit the 844×390 and 667×375 landscape frames with safe areas and 44 pt
  actions. Use contextual help near the costs and gaps. Display rank, shortages, due status and tier cap in words.
  Refresh generated mechanics pages in the implementation commit. Keep startup size ≤180 KB gzip.

## Playthrough and exit checks

| Save | Play and verify |
|---|---|
| Fresh solo | Reach Rank 3, afford the Sawmill and workbench, and install Fitted Can. Show the exact old and new action counts. Reach Iron through a self-supplied Mine. Continue to the first proposal using six Pine Logs on a farm with no Forge restoration, and repeat with the workshop built before R8. |
| 10 Umas | Keep food first and several field rows assigned. Compare baseline and Forge runs through a full 120-day year. Book a named assistant, validate her weekly shift, and show where the crew spent any freed actions. |
| 20 Umas | At Rank 6 compare Gold Can, Brush and mining tools with an existing planted exact-grade plan. Try a booking on a town day, free day, after Morning and while away. Confirm those orders can still be placed solo. |
| 50 Umas | Run the same baseline-vs-Forge policies through Rank 10 and the following year. Complete Mythril using floor 25. Show each tool's daily cap and spend a day with 20+ diggers. Collect the last tool then train a second smith through practice. |
| Existing farms | Upgrade saves with legacy bench, ring stock, Romance 8 already read or unread, and already married spouses. Test both entry paths, proposal, ring swaps, warehouse protection and existing scene replays. Reload mid-order and during tempering, cross Day 30 and a year boundary, and recover a cloud-synced pending order. |

Log days to each tier, first tool cost and elapsed days, action savings by job, work gaps at noon, wage/food/upkeep
arrears, gold and stock after orders, exact-grade min/max and days short, crop waste and flood-sensitive shipping.
At both phone sizes review the selection, active order, material locks, forecast, daily report, two bench entry
paths and no-smith states. Follow the existing local playthrough and required GitHub checks.

### First-pass tuning targets

- First fitted upgrade after one Sawmill load and one dawn in the restored workshop. No loan or crew gate.
- Gold Can saves at least one Morning action in the three-row skilled fixture. Gold Brush saves at least one
  on an eligible six-animal care round with a two-animal aptitude. Identify which open job used any released
  action, and distinguish free capacity from work actually done.
- The gathering bonus remains at most four extra items per tool per day. Recheck apparent gains in matched seeded
  A/B runs. Compare persistent arrears and the number of days with two or more reserved units of the tracked
  Restaurant ingredients. Investigate new persistent arrears or a drop of more than 5 of 120 comparable
  ingredient days before locking values.
- Old and new first-marriage routes hit the same eligible dawn, same proposal requirements and same one-ring
  allowance for identical romance actions. A tool commission or missing assistant cannot block the bench.

## Review and delivery

Approve the early restoration, the four tiers and whether tempering is worth a first build. Pick the ring layout
separately. Start by splitting access checks and implementing the Fitted Can. Validate solo and staffed coverage
before wiring the other six tools and remaining tiers. Enable commissioned assistance and practice, then add
tempering if approved. Compare all roster sizes with the live balance before locking values. Update the active
roadmap only when implementation starts. Ship via a Farm PR with regenerated mechanics, test evidence and a verified
hosted build, and remove the completed handoff packet with the implementation.
