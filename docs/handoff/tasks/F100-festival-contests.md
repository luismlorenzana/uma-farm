# F100 — The four festival contests

**uma-farm · Authoring packet · Phase 2.6 · 2026-11-19**

Enter a crop the farm grew, fish with your team, show an animal raised on the farm, or put the year's work on display.
Each contest reads the farm as it stands. A small farm can enter in its first year, and an established roster can
prepare the entries and take on part of the event.

## Read first

- [The Cooking Contest](../../game-mechanics.md#the-cooking-contest) establishes the entry cost, seeded play,
  judging, prizes and year-by-year record. [Farmhands](../../game-mechanics.md#farmhands) defines their farm days
  and work actions. [Stars and prices](../../game-mechanics.md#stars-and-prices) distinguishes quality from grade.
- Read `farm/calendar.ts`, `farm/actions.ts`, `farm/rank-rules.ts`, `farm/milestones.ts` and
  `kitchen/contest.ts` under `packages/domain/src`. The story can move or rename each festival through
  [its calendar](../../story-pack.md#the-festivals).
- Reuse the normal production paths in `fields/fields.ts`, `farm/farmhands.ts`, `ranch/ranch.ts` and
  `gathering/hauls.ts`. The launch rules below are balance targets for the implementation playthrough.
  The Cooking Contest keeps its current rules. The Uma Book and broader long-game progression have separate scopes.

## Decided

| Contest and default date | What you enter | What preparation does | What the Umas do |
|---|---|---|---|
| **Flower Show** · Spring 10 | One exact crop or orchard lot | Better stars, higher grade and documented tending raise the score | Grow and harvest a marked entry through ordinary work orders. A named grower can earn Farming Legend credit. |
| **Fishing Derby** · Summer 10 | Three official casts at one open fishing spot | Rod, reachable spots, season, Fishing rank and aptitude affect the catch | Up to two fishers can each take an official cast. A participating fisher who lands a fish can earn Fishing Legend credit. |
| **Animal Show** · Winter 10 | One animal already on the farm | Fondness, today's feed and a week of real care raise the score | A named caretaker can earn Ranch Legend credit. If present as handler, she performs one or two show cues. |
| **Harvest Cup** · Winter 12 | Three Warehouse exhibits from different categories | The farm's stock and the range of work it supports determine the display | Up to three Umas can present categories they actually worked on in the last three completed days. |

### The festival day

Open the contest preview from the Calendar or Festival ground. The morning's **tomorrow** and **today** lines lead to
the same entry screen. Use the story's resolved day and name, and the stable festival rule ID for scoring and history.
Story-only holidays keep their occasions and event actions. Festival-night scenes and evenings keep their own slots.

Preview the actual eligible stock, animals, spots and Umas. Show the two rivals' scores, the entry cost and the first
reason a choice is blocked. An entry takes **three actions**, spending today's event actions first, as at the Cooking
Contest. The last button confirms the cost, which goods leave the Warehouse, and which Umas spend a work action.
Previewing, changing a draft and rehearsing a cue are free. The four new contests each allow one started entry per
festival rule and farm year, even if a story update moves the date later in that year.

**Give credit for the work that happened.** A grower or caretaker can receive production credit while in town
or away, without appearing in the contest. Any Uma who actively casts, handles or presents must be a farmhand
available on the farm that day with an action tonight. Confirming the entry commits one work action per active role,
including if the player ends the contest early. Respect expedition
bookings and Kitchen, Cooking Contest and Restaurant commitments in both directions. One Uma can fill one active
role. The existing festival-together heart reward goes to active participants who performed their role in a judged
entry, once per festival and year. Keep ordinary work rank points and award the existing `won` challenge only where
the rules below say who earned it.

### Judging and prizes

Each contest scores out of 100. Let `R` be the Farm Rank as of last night's settlement, frozen when the entry starts.
Each contest has two rivals. Use the named roles below for the result board, with the first listed setting the
first-place cutoff. The second rival scores 10 fewer points. Ties go to the player, following the Cooking Contest.
The screen shows the actual cutoffs before the player commits.

| Contest | Rivals | First-place score | Base first prize |
|---|---|---:|---:|
| Flower Show | The orchard · The town garden | `min(88, 36 + 5 × (R − 1))` | 500g |
| Fishing Derby | The river team · The pond team | `min(82, 34 + 5 × (R − 1))` | 700g |
| Animal Show | The ranch · The smallholding | `min(88, 42 + 5 × (R − 1))` | 900g |
| Harvest Cup | The valley growers · The town market | `min(88, 30 + 6 × (R − 1))` | 1,200g |

First prize is the base multiplied by `(1 + 0.06 × (R − 1)) × min(2, 1 + 0.15 × (year − 1))`, rounded to 5g.
Second and third get half and one fifth of the rounded first prize, rounded to 5g. Gold pays when judged. Reuse the
existing 150, 75 and 25 Farm Rank points by place, applied in the nightly rank calculation. A start with no judged
entry records the attempt and pays zero. Record the best score in the Diary and show the exhibits or catches and
credited Umas on the result. There is one result and one payout for each judged entry.

## Do

### Flower Show · one crop, judged on the table

Choose one raw plantable crop or orchard fruit from a held exact ID and star lot. The judges accept any eligible
species, including a staple carrot. Produce from an older save, bought stock and wild fruit that is also plantable
can enter from the Warehouse. Only a sample reserved through the farm's harvest earns documented tending points
or credits a named grower.

During the **ten-day window ending on the show day**, mark one tile using **Set aside next harvest**.
It can be a tile holding the chosen crop or an empty tilled tile with a matching
planting plan or chosen species. The label names the crop and slot. The marker follows the next crop or pick cycle
on that tile. Track its successful planting, watering that advanced growth and harvest dates within the window.
Count each date once. Capture at most one actual harvested unit, at the best stars in the receipt, breaking a star
tie by higher grade, then receipt order. Put that unit in the display box and send the rest to the Warehouse.
Let the player return the sample to stock and mark another tile before entering. Finish or forget the marker on
harvest, replacement, withering, orchard removal, or the festival's close.

Use the actual planting, productive watering and harvest receipts for the marked cycle. A task on the board,
crop level, purchase or generic discovery is insufficient evidence for a named grower. Farmer actions count toward
the display's tending score. Any Uma with an actual credited action on that crop cycle can be named as the grower,
including an orchard picker. The same physical sample supplies both the score and the credit, even if another
same-grade and same-star unit is in the Warehouse. Settle the entry immediately and consume the one display unit
at confirmation. On first place, emit the existing Farming `won(flower-show)` for the one named grower, if any.

**Score** · `10 × stars + 2 × grade + 6 × min(5, documented work dates)`.
A hand-grown G1 ★1 carrot with four documented days scores **36**, the Rank 1 first-place cutoff. A G2 ★4 apple
with five documented days scores **74**. Preview “Quality 40 · Grade 4 · Tending 30” before donating it.

### Fishing Derby · three casts, best two count

Choose one fishing spot this farm can reach using the existing Farm Rank and Dock or Boat restrictions. The Pond
gives a first-year route. Use the spot's season table on the actual event day. The Rod and the assigned caster's
ordinary fishing quality and size terms apply. Use the spot's selected catch mode and its real aptitude or manual
qualification rules. Show those terms and which species can bite.

Assign each of the **three casts** to the farmer or to one of up to two eligible Umas. Each Uma can take one cast.
Use the existing Cast ring and timing score for the farmer, with one tap and a 4 s turn cap per cast. An assigned Uma
takes her turn from her skills at `min(95, 50 + 4 × Fishing aptitude + Fishing rank)` timing points. A missed turn
scores zero and lands nothing. One cast always has at most one catch. Use a separate seeded draw stream and a fixed
three-cast festival allowance, so ordinary spot thinning and the contest don't use each other's allowances.

For each landed fish, use the ordinary species, stars, exact grade and size helpers with the frozen terms. For
size, give the reel timing weight by passing `u + (1 − u) × 0.65 × timing / 100` to the existing size rule, with
`u` the seeded size draw. The fish scores `40 × size percentile + 8 × stars + 0.20 × timing`. The size percentile
is the measured length's fraction from that species' minimum to maximum, clamped to 0–1. This allows a strong Pond
catch to compete with a sea fish. Round each catch score, then average and round the best two. Each unfilled
place counts as zero. For example, casts worth 58, 40 and 0 score **49**.

A judged entry needs at least one landed fish. When a turn lands one, save its exact catch receipt and advance the
ordinary grade progression together. At settlement, add each landed fish to the Warehouse once, update size records
and exact discoveries, and credit the named fishers with their actual catches.
Only participating Umas who landed a fish receive `won(fishing-derby)` on first place. Award one Fishing practice
point for each Uma who made her assigned cast. Award no catch, practice or challenge for an unplayed cast.

### Animal Show · husbandry and four cues

Choose any owned animal in a working Coop or Barn. Use its current hearts and fed state, and the animal's actual
successful care actions today and on the six previous farm days. Record at most one care receipt per animal per day,
with farmer or Uma identity. Brushing or equivalent care counts when the care rule succeeds. Feeding stays a scoring
line of its own. Passive affection perks, goods ready for collection and a board assignment give no care receipt.

Name one **caretaker** who personally cared for this animal on at least two dates in the seven-day window.
The farmer can present any owned animal. If the named caretaker is eligible and available,
the player may book her as the handler. Presenting costs her one work action and earns one Animal care practice
point on a judged entry. Credit the named caretaker with the existing Ranch `won(animal-show)` on first place,
including when the farmer presented her animal.

The ring shows four untimed seeded cues, one at a time. Pick **Stand**, **Walk**, or **Brush**. Every cue names the
judge's request in plain language. Correct choices earn 10 points. A wrong choice advances with zero. A booked
handler answers the first cue, or the first two from Animal care 6, correctly. The player answers the rest. Opening
cue lines include “Hold for inspection.” (**Stand**), “Take a lap by the fence.” (**Walk**) and “Smooth the coat.”
(**Brush**). Build four rounds by drawing from these cue types with at least two types in the ring. The show leaves
the animal on the farm, and nightly husbandry continues as usual.

**Score** · `3 × current hearts + 10 if fed today + 5 × min(4, care dates) + 10 × correct cues`.
At least one correct cue is needed for a judged entry. A fed, 3-heart chicken with four care dates and three correct
cues scores **69**. A stocked Coop and real care can therefore make the first Winter 10 competitive.

### Harvest Cup · the farm's year on one table

Fill three slots from **three distinct eligible categories**, one unit per slot. Use current available stock at the
chosen stars, including goods held from earlier seasons. Classify each ID once in this order. **Kitchen** takes
finished dishes, **Workshop** takes edible processed goods from the stations, **Ranch** takes raw animal products,
**Fish** takes raw fish, **Field** takes raw plantable crops or orchard fruit, and **Wild** takes the remaining edible
raw forage from the Forest tables. Use the existing food predicate for edible goods and the grade of the exact output.
Use the grade on the original Kitchen dish ID or Restaurant stage for dishes. A farmer with a field, the Woods and
the Pond can fill the table with Field, Wild and Fish.

Each slot may have one available Uma as its presenter. Use the **last three completed farm days**. Keep a
last-worked day per category per Uma, stamped only by a successful action.

| Category | Work that qualifies a presenter |
|---|---|
| Field | She harvested a crop or orchard pick. |
| Ranch | She fed or cared for an animal, or collected its product. |
| Fish | She landed a fish. |
| Wild | She foraged and brought back an edible good. |
| Workshop | She started a load of an eligible edible output. |
| Kitchen | She cooked a pantry batch or assisted a stove play that made dishes. |

A presenter speaks for that category of work. Her credit is independent of the origin of the specific stock unit
on display. Each presenter supports one slot and spends one work action.

**Score** · sum `4 × stars + grade` for the three exhibits, plus **3 points per** eligible presenter.
For example, G2 ★4 carrot, G4 ★3 goat milk and G6 ★4 Sea Bream give 18 + 16 + 22. Two presenters raise
the score to **62**. The first-place score at Rank 6 is **60**. Pick and preview the three entries, confirm, then
donate the three units and judge in one operation. Keep any expedition-reserved dish unavailable. The Cup uses the
shared prizes and Diary record, with no separate Legend challenge.

### Screens, state and art

Use the landscape side panel at **844×390** and **667×375**, with 44 pt targets and the existing safe areas.
Reuse the Calendar, existing item and animal icons, the Cooking Contest result board's pattern, and the Cast
ring. Show preparation, entry and result on the same route, with help behind one button. Use invented fixtures
and original UI assets only in git. Load contest screens and authored cues on demand within the 180 KB gzip budget.

```text
ANIMAL SHOW · WINTER 10                                    ?  ×
┌ Entry ─────────────────────┐ ┌ Score preview ────────────┐
│ Chicken · ♥3 · Fed         │ │ Hearts 9     Feed 10      │
│ Cared for on 4 of 7 days   │ │ Care 20      Ring up to 40│
│ Rowan · caretaker          │ │ 1st ≥ 62     2nd ≥ 52     │
│ [ Farmer presents ▾ ]      │ │ [ Enter · 3 ]             │
└────────────────────────────┘ └───────────────────────────┘
```

- **Preparation.** Flower Show links to the marked field tile and display box. Animal Show links to the animal's
  home. The Derby shows the selected spot and planned casters. The Cup shows three category slots and the last
  qualifying work date under each presenter.
- **Save v5 grows in place.** Use an optional client-owned festival section. Bound it to one Flower marker and
  box, seven rolling care receipts per animal, recent Cup category dates, one active contest and the latest detailed
  scorecard per contest. Reuse `farm.festivals` and `diary.records` for judged placements and best scores. Keep a
  small latest-attempt marker per rule to cover forfeits. Old saves start with empty new evidence. They can enter
  eligible stock and animals immediately and gain production credit through new work. Validate the stock keys,
  roster, ranges, dates, duplicate IDs and score bounds in the shared parser.
- **Commit and resume.** Recheck the date, current stock, active plays and assistants at confirmation. Flower Show
  consumes its unit and Harvest Cup consumes its three in the same save change that judges them. Other operations
  cannot use the Flower Show's boxed unit. Return the unused boxed unit on cancel, when the festival passes or when
  its rule is no longer on the calendar that year. Derby and Animal Show persist the paid entry, seed, frozen scoring
  terms and each completed turn. Reopen or reload to continue from the next turn. Explicitly ending the contest or
  ending the day settles the recorded turns once, treating unplayed turns as zero. Morning and Diary show the result or
  **No placement**. The domain calculates every change and the server validates the client's save.

### Build order

1. Wire the resolved calendar entry, eligibility, work-action bookings, shared placing and payouts. Keep contest
   state distinct from the Kitchen's stove and the Restaurant's shift, with one active play across them.
2. Add Flower Show and Animal Show evidence at the production and care actions. Add the Cup's recent work dates
   at the successful task and play calls. Keep the Warehouse's existing five star buckets per ID.
3. Add Derby turns and the Animal Show ring, then connect deterministic settlement, reload and End day to those
   plays. Route their catches and each winning worker's challenge through the existing domain updates.
4. Add the four screens, the preview and result links, and the farm-year playthroughs.

## Done when

1. Play each full contest on an invented first-year farm before relying on a roster. Confirm the Spring 10 carrot,
   the Pond, the Coop and the Field/Wild/Fish Cup entry paths using actual production. Verify a moved festival date,
   story-only holiday, event actions already spent, missed festival, and the following year's entry.
2. Play a full festival year on roster-run farms at **10, 20 and 50 Umas**. Let the hands' actual harvests, care,
   casts and station or kitchen work supply the entries. Compare solo, mixed and roster-heavy entries at low and
   high ranks. Record which inputs and workers were used, placement, gold, rank and challenge credit, work actions
   displaced, and days or entries stalled. Include a late-year farm with stock from several seasons and a winter
   with limited food. Tune the cutoffs and prices against those results.
3. Prove the credited crop and animal actually came from the named worker's actions. Try an identical bought crop,
   duplicate plant and care actions, a regrowing crop, an established orchard, stock traded away after preview,
   a different animal of the same kind, and an absent grower or caretaker. Verify Fish and Ranch winners can earn
   their existing challenges, and that Flower Show reaches the Farming challenge. Grade and stars stay separate.
4. Check ties, payout and best-score history, all-miss and partly played attempts, save reload between turns,
   End day while a contest is active, replay after sync, and an older v5 save. Verify that reservations cannot be
   sold or eaten twice, and test Kitchen, Restaurant and expedition booking conflicts in both directions.
5. Run project checks and local landscape play at both sizes. Show the owner the four entry screens and score
   breakdowns. Confirm that the existing Cooking Contest and festival nights still play.

## Deliver

Use a feature branch and pull request. Update the game mechanics and generated pages with the implemented rules
and playthrough results. Remove this packet and its roadmap row in the commit that finishes the four contests.
