# F122 — Seasonal festivals and personal occasions

Status: Authoring packet for review. F121 surfaces current events on Start Day. F122 defines the broader in-game loop for noticing, planning, attending and remembering events.

## Why a player can miss a whole year

Uma Farm has five scored contests with working entry rules, judging, payouts, and saved results. They are scattered between the Festival Ground and the Kitchen, and the Calendar's side panel mainly describes one date at a time. The map and daily conversation flow give a player little reason to look at the Calendar ahead of time. A failed entry can be the first time a player learns they needed a Kitchen, animal or particular exhibit. An Uma's birthday can appear beside her portrait even when she has no birthday scene. Today’s **event actions** are a pooled currency. Three remaining bonus actions, three playable scenes and one three-action contest are three different facts. An end-of-year review has no single place to connect preparation, participation and what the farm earned.

The score rules and contributors already exist. Keep them as the competition layer. Add a free social layer, improve preparation and expose the full loop from places the player visits daily.

## References and design choices

| Reference | Observed design | Uma Farm application |
|---|---|---|
| [Friends of Mineral Town systems](https://www.storyofseasons.com/fomt/lifeonthefarm/) | The town has named community activities such as the Cluck-Cluck Clash and Fetch Fest, alongside everyday farm work. | Each date needs a place and a recognizable activity. Seeing your Umas at that place should be worthwhile even when your entry is missing. |
| [Grand Bazaar town manual](https://www.storyofseasons.com/grandbazaar/manuals/nsw/02/) and [calendar manual](https://www.storyofseasons.com/grandbazaar/manuals/xbox/01/) | Its Calendar combines birthdays, festivals and special occasions. The town manual distinguishes festivals and farm contests, and connects crop quality and animal affection to judging. | Give Calendar rows an explicit type, a venue and a next action. Show why farm work matters to the score using the player's actual crops, lots and animals. |
| [Rune Factory 5 manual](https://www.marv.jp/onlinemnl/rf5/page13/) | Known birthdays appear with resident portraits. Calendar festival details include date, place and organizer. Performance can earn prizes and SEED points. | Pair the face with a Birthday or Anniversary action. Use an identifiable organizer and place. Show gold, Farm Rank and crew credit on the receipt. |
| [Rune Factory 4 official systems](https://www.marv.jp/special/game/3ds/runefactory4/system/fantasy.html) | Requests connect the player’s daily life to civic progress. Earned points can fund orders for festivals and facility expansions. | Give the existing Requests board a preparation view. Use current Farm Rank, assets and job orders. Keep annual festival dates free and public. |

## The year and the five contests

Use the resolved story pack dates everywhere. The table gives the default 30-day-season dates. A legacy short season keeps its recorded day mapping through the existing calendar conversion. The five contests can run in an established save on the next eligible date with no reset.

| Default | Host and venue to author | Free activity | Contest and preparation |
|---|---|---|---|
| Spring 19 · Flower Show | Grower or Bell Keeper at Festival Ground | Walk the spring exhibit and talk to the featured Umas | Donate one exact graded, starred crop or orchard fruit. Show an eligible Warehouse entry and the marked-tile path. Offer **Mark a plot** during the existing ten-day tending window. Plan panel shows actual growth, next tending date and the five-date score cap. |
| Summer 21 · Fishing Derby | Fishery staff at the dock or marked Derby venue | Visit the weigh-in and see Umas' catches | Three casts at an open spot. Solo is always a legitimate entry at an open spot. Offer two distinct eligible casters, show booked actions, and preserve ordinary fish grade and length discoveries. |
| Autumn 22 · Cooking Contest | Chef at the Kitchen | Visit the judging table and chat with the cooks | Live cooking of a known contest recipe. Show Kitchen lock, one recipe, two exact lots of its main and one of its side, with navigation to the actual sources. Register with the farmer or an eligible cook. |
| Winter 12 · Animal Show | Ranch host at Show Pens | See the animals and talk to ranch Umas | Use one existing animal, its actual feeding, hearts and dated care. Show **Feed today** and the remaining care dates. Owner still buys the animal and builds the Coop or Barn. |
| Winter 28 · Harvest Cup | Town market host at Festival Ground | Browse the exhibits and catch up with the crew | Choose exact Warehouse lots from three distinct categories. Show more than one attainable trio and each missing category. Link from a category to field, ranch, fishery, forest, workshop or kitchen. Presenters need recent real work in the category. |

Host names and venue routes are proposed assignments. Use the authored profession roster to select the host and a counterpart for away shifts. Keep a shared venue panel and original art. Dialogue and published splashes follow the established private story and art paths.

Today a ranked entry spends three event/regular actions, uses existing contest scoring and records, and never buys a project, animal, tool or ingredient on the player's behalf. Current Farm Rank 1, Year 1 first prizes are 500g for Flower, 700g for Derby, 1,800g for default Autumn Cooking, 900g for Animal and 1,200g for the Cup. The other four use rank and capped year scaling. Cooking scales by season and year. Ranked placements give 150, 75 or 25 Farm Rank points. Crew may get contest relationship and Legend challenge credit under their specific role and judged result. The first balance pass retains the amounts. Use the yearly net cost study below before changing the multiplier or payout cap.

## The player’s daily path

```text
Start Day
  TODAY      Fishing Derby · Dock                    View event ›
  WITH AN UMA   Birthday · one known Uma              Celebrate ›
  FARM REPORT                                         Expand
                                                       Start the day

Festival detail
  SUMMER 21  ·  DOCK  ·  OPEN TODAY
  Visit free       See the dock and talk to the host
  Enter · 3        3 festival actions available              Enter ›
  Your plan        Farmer + 2 cast slots       Change crew ›
  Crew impact      1 action each · Check Work Calendar ›
  Rewards          Ranked gold · Farm Rank · Catch discoveries

Work Calendar for Summer 21
  Morning essentials      Feed and water covered
  Optional event booking   Caster A · 1 action · Accepted
  Work after booking       One fewer optional fish haul
```

### Today, Coming up and Results

- **Today** shows at most one community card and one personal occasion group alongside the current Ready scenes. A community card exposes `Visit`, `Prepare`, `Enter`, `Continue`, `Results`, or `See what’s missing` according to state. Title, actual date, venue, one-line goal, cost and CTA appear above the background. No pop-up takes over the whole day or spends actions.
- **Coming up** shows the next major event on Calendar and the Bell Keeper’s Town noticeboard. At seven days remaining show a quiet inline reminder in What's Next. Shows with longer prep windows may be pinned from Calendar before the reminder. At two days remaining put one compact planning link in Start Day. One reminder per surface and date by construction, with daily dismissal for optional reminders. The festival's actual venue is marked that day in Town or on the Farm map. The calendar title and today's date chip must still lead back after the player dismisses Start Day. No push alerts required.
- **Results** presents score against rivals, payout, actual consumed stock and awarded Farm Rank and Uma credit. Show current year and prior recorded entries, plus one missing season at a time. Replay from Library if content earned it. Missed dates offer next year and never retroactively award attendance. An abandoned in-progress contest uses the existing settlement rules and can be resumed when the specific contest already supports it.
- **Personal occasions** distinguish Birthday, Anniversary, Wedding, and other authored scenes from open relationship milestones. An unmarried met Uma with no scripted birthday gets a small original greeting and a choice to give one held gift. Use existing gift preference and daily gift usage. Birthday XP budget is one claim per Uma/year, with a proposal of +25 points for completing that greeting or gift, whichever is first, and no automatic material/gold prize. New writing for all 50 should respect personality and current relationship. Spend the event cost once and accept a plain greeting without inventory. If an authored birthday scene exists, use it in the same slot and award path. Existing formal birthday and anniversary night visits keep their outfit unlocks, spouse-only eligibility, five shared visits and Library memory identifiers. Their display states are `Tonight`, `Visit`, `Played` and `Unavailable` with the specific reason. A rollover anniversary offer is separately labeled from today’s dated anniversary.
- **Special celebrations** show New Year, the current five-wedding milestone scenes, the 50th wedding soft ending, the Greater Festival one calendar year later, and the subsequent Festival of Vows. Wedding eligibility and scheduled days remain owned by the proposal/wedding flow. Attach reminders to actual computed dates and show pending celebrations together if they overlap a contest. Rules for repeatable nights and Greater Festival pledges keep their existing clocks and limits.

### Funding on event days

Keep 5 Morning actions, 5 Afternoon actions and 5 married-life visits. Default seasonal contest dates offer an earmarked **3 contest-action pool** and one free social scene. Present `Contest 3/3`, `Personal 1/1` and `Morning 5/5` separately. One earned Birthday action funds its own Uma’s birthday action. New Year's keeps its three event actions for its own category. Household celebrations use their existing rule. Once destination-bound free grants are used, expose the exact regular-action fallback before any charge. Entering the day's contest after a birthday or a common chat still shows its three dedicated actions. A legacy day already started can use its existing pooled grant through day end. Every day thereafter uses the dedicated ledger.

Keep free venue visits separate from the paid interaction. Player can watch, read rules and talk to the host with no farm action. Award at most one attendance record per event occurrence. Limit any free story scene bonuses to first attendance per event or per character as specified per authored scene. A birthday gift and an authored festival scene use their own grant and benefit once. Their payments cannot be duplicated by a generic town greeting, repeated navigation, Save reload, or replays. Date-based content remains available all day unless it is clearly a Year-end, Night visit or celebration with an existing slot restriction.

### Preparation and the existing crew

- One pinned event per farm to start. Pinning has no price and can be cleared. Open the exact plot, animal, reach or saved item option from each step. Offer solo alternatives such as one personal cast, a Warehouse exhibit, or use of the existing Kitchen. A player without the required asset sees **Visit free** plus the exact project, cost and prerequisites.
- Opt in before holding inventory. Use a common reservation check through surplus shipping, cooking, station processing, requests and expedition equipment. A reserved count carries the exact grade, star, source and the occurrence identifier. Replace or release it atomically. The Flower Show display box remains the source for marked-tile evidence. Reserve only the number the entry consumes. Expiry releases leftovers, including after a missed date. Manual spending can release a reservation with an explicit prompt; loading the event screen has no side effect.
- A pinned goal may rank a productive optional job such as growing an exhibit, getting an animal's documented care dates, or bringing one missing-category lot. Feeding, watering, pantry meals and urgent shipping keep first claim on available farm time. No worker can be auto-booked into a contest just because they grew the entry. Show eligibility, conflicting town/farm work and precise displaced work in Work Calendar before the player confirms. Recompute from the actual morning shift. The present rules distinguish growing, tending, casting, handling and presenting. Credit the contributor who did the recorded work and keep co-presenters distinct.
- Funded job forecasts show **Protected entry**, **Working toward entry**, **Waiting for supplies** and **Owner step** in Work Calendar and What's Next. Optional low-value repeat gathering can move later on a day with a high-priority preparation order. Crew buys feed only under the normal ranch rule. Cash, schedule, animal purchases and project approvals stay with the player.

### Rewards and economy

Use three visible receipts. **Attendance** keeps a date and venue in the Diary. **Ranked participation** records score and placing, even where an existing rule gives no payout. **Personal occasion** keeps the participating Uma’s Library memory. Add first-entry ribbons and personal bests as farm milestones with no resale value. Bind existing special wardrobe memories to their canonical scene IDs. Any new venue dialogue replays use the published year-independent scene variant that played. Record consumptions and awards once, with references linking the venue, participant and Library replay.

Show proceeds under `Festival prizes` by event date and spending under the original purchase or category. Entry receipt shows the items consumed with their ordinary shipping value. Compare incremental cash, replacement time and displaced shifts. The preparation planner should explain when an available entry is a good low-cost choice. Keep the prize valuable to a solo farm without making a 50-worker farm depend on prize income. A balanced year should see clear competition rewards without loan borrowing or an auto-entry strategy. Run a Year 1–3 comparison with and without entries, and verify that first prizes don’t grow into an outsized share on mature saves. Proposed balance review thresholds are an expected positive net reward for a competent Rank 1 solo entry and an annual prize share below 15% in a staffed steady-state farm. Measure before tuning.

## Implementation sequence

1. **Read model.** Add a Farm-owned event listing beside the domain calendar, with stable occurrence keys `rule-or-story-id + resolved turn` and include Uma ID for personal occasions. Resolve display through `calendarDay`, `festivalsOf`, `occasionWith`, `festivalEntryLock`, `contestBlock`, `householdReady` and existing Night visit eligibility. Keep types for venue, phase, readiness, blocked reason, funding, optional preparatory task and results distinct. Tests cover a moved festival, an anniversary rollover, a wedding and overlapping birthdays. Use the row's own event count and funding balance as separate values.
2. **Routes and first-year on-ramp.** Add a shared event detail with free `Visit` and authoritative `Enter` or `Continue`. Land from Start Day, Calendar and the map without requiring a second search. The same description and action eligibility appear on all three. Add concise first-year rules previews triggered by a user tap. Preserve existing Festival and Kitchen contest deep links. In each landscape size reserve room for the date, venue, summary and primary action while keeping the 6×2 calendar. Opening an event and closing it return to the selected date.
3. **Plans and execution.** Add optional reservations and narrowly scoped event action funding. Use the same transaction/parse paths as work, booking, and entry. Forward carry an older in-progress action session and keep historical turns. Link Requests and What's Next to stateful owner steps and compatible work orders. Add a short Work Calendar difference view for the chosen crew booking. Confirm before player inventory or cash is used.
4. **Content.** Author free starter scenes and host greetings for each public date, compact arrival descriptions, original venue key art, and the 50 birthday fallback lines through the established story process. Plan seasonal group rotations around eligible professions and schedule. Write variants for no entry, entry and exit without placement or with placement. Review birth and anniversary paths for pre- and post-marriage, due and rollover, solo and duo. Use the published formal wardrobe and dialogue backdrops. A missing optional asset shows the usual fallback with playable text.
5. **Receipts and tuning.** Build Diary season results and links to credits and records. Adjust prizes, if measured, in a separate proven balance change. Update generated mechanics pages and test current and older saves. Review on both supported landscape layouts and on the owner's installed iPhone PWA.

## Acceptance playthroughs

| Case | Pass condition |
|---|---|
| Fresh Year 1, solo, no calendar opened by hand | See the first festival coming and reach its venue from Start Day or map. Enter Flower or Derby by following real instructions. Visit every date even with missing assets. After results see what was spent and received. |
| 10, 20, 30 and 50 workers | Complete the year with auto-work covering essentials, eligible contributors credited, visible displaced shifts, and positive attendance across seasons. Repeat a contest with a changed roster and prove its individual credited work. Log crew actions, field/ranch shortages, competition proceeds, consumption value, fees and surplus income. |
| Market, planting, birthday and contest on one day | Have zero regular actions remaining. Open map and Calendar and use the separate birthday and contest funds. Replay or reload and prove once-only claims. Leave an event unentered to verify expiry and stock release. |
| Old save, story move and weather or an away Uma | Preserve historical entries and Calendar identity, display the resolved date, explain actual eligibility, and keep a solo path open where the underlying rule allows it. |
| 5th and 50th wedding, Greater Festival and Vows | Show milestone eligibility and venue without conflating it with the yearly contest. The 50th wedding closes the main story that year. The Greater Festival fires on its scheduled date the next year. Credits and replays remain viewable afterward. |
| 667×375, 844×390, installed phone landscape | In each size find date, venue, cost and primary CTA from Start Day, town/farm map and Calendar. Keep day-part and work-calendar context after back navigation. Confirm no clipped date, CTA or reward. |

Ship by updating the roadmap, handoff and generated mechanics through the usual PR checks. Private content and personal save snapshots remain outside Git. Use synthetic fixtures and local playthroughs.
