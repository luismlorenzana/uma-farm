# F104 — Thirty-day seasons

**Status · Authoring and balance.** The target is four 30-day seasons and a 120-day year. The current save
and rules use 12-day seasons and a 48-day year. Implement the calendar change with the content, balance and save
conversion together.

## Why

The same harvests, birthdays, festivals and weddings compete for time in a 48-day year. Give ordinary
farm days room and let players choose when to spend a day in town. Mineral Town puts recurring events
and birthdays on its calendar and keeps tutorials on the farmhouse bookshelf. Uma Farm can use the same
division between scheduled occasions and always-available reference material. [Mineral Town manual](https://www.marv.jp/onlinemnl/bokujo/saikai/xbox/page08.html)

Read [the calendar](../../game-mechanics.md#the-calendar), [the farm at Rank 10](../../game-mechanics.md#progression-balance-through-farm-rank-10),
[the save contract](../../technical/architecture.md#state) and [F103](F103-hd2d-farm.md) for the preview's season
and light inputs.

## Draft year

| Season | Early | Middle | Late |
|---|---|---|---|
| Spring | 1 New Year from Year 2, 8 Blossom viewing | 19 Flower Show | Spring crop harvest and shipping |
| Summer | 9 Wishing night | Fish and prepare entries | 21 Fishing Derby |
| Autumn | 8 First cold evening | Grain, recipes and contest preparation | 22 Cooking Contest |
| Winter | 4 First snow | 12 Animal Show, 17 Longest night | 22 Sweets day, 28 Harvest Cup |

The date moves are a first draft. The existing IDs, contest rules and night-scene aliases travel with the dates.
The local story release and current authoring file both override the five contest dates. They put the first four
on day 10 of their seasons and the Harvest Cup on Winter 12. Both have zero custom fixed-day entries. A new
default calendar alone would leave the overrides in force. Update the story pack and the Story Sandbox with
the same dates, and test stock rules as well as loaded and cached story releases.

Plan for 13, 13, 12 and 12 launch birthdays. Use one birthday per day, exclude public event dates,
and reserve at least one date per seven-day week with no fixed public event or launch birthday. Keep birthdays
stable release to release. Allocate spots from the cast's real birthdays, including their seasonal affinity,
then publish the allocation with its tests. As a draft, five contests, six small days, one New Year and 50
birthdays occupy 62 of 120 days when placed separately. Player-chosen weddings and anniversaries may share dates.
Flag busy dates at booking and give players a way to see the two events before choosing.

An allocation check with the dates above placed all 50 test birthdays outside public events and a reserved quiet
date in each of the 18 seven-day blocks, including the final partial block. It left 58 days clear, with a longest
run of three busy dates. The test used evenly spaced seasonal slots. Applying them to real cast birthdays is
part of authoring.

Two birthday rules need explicit edits in [the current allocator](../../../packages/domain/src/romance/days.ts).
The real-date conversion assigns four days to each month. The allocator uses year length to decide whether the
launch cast should be spread out. With a 120-day year, the current branch would place the 50-Uma cast on the
unbalanced small-pack path.

## Timing and balance

| System | Rule to carry into the 120-day trial | What to measure or author |
|---|---|---|
| Daily actions and town | Ten actions. Town visits are free. Existing events can use their dedicated action grants. | There is time for the farm and some relationship work on ordinary days. The calendar highlights the next occasion and shows optional entries separately. |
| Crops, orchards and fishing | First carrots still take four watered nights. Longer windows give crops more rotations and orchard fruit one annual bearing opportunity. | Recheck all 51 crops, seed costs, yield, regrowth, grade progression and orchard wait. Play a season boundary with a field in each growth stage. Review fish, forage and demand by season. |
| Farmhands, animals and crafting | Town professions keep a 7-day week with staggered days off. Farm work, feed, shifts, aptitude practice and station loads run on completed days. | Check coverage gaps over four-plus weeks per season, overflow stock, watering, meals and exact-grade station supply. Play 10, 20 and 50 Umas and one large calendar with staggered festivals, weddings and expeditions. |
| Shipping, rank, loans and upkeep | Simulate cash per night and over a 120-day year. Loans use nightly sales and the existing fee. Preserve the early path to a solvent farm. | Recalibrate sale values, market recovery, Farm Rank targets, construction costs and opening days from results. Use gold and cash pressure per turn as well as seasonal totals. |
| Kitchen, Restaurant and expeditions | Pantry spoilage, recipe play and expedition duration count completed days. Unlock recipes from exact-grade discovery. | Re-run 120 Restaurant unlocks at all eight stages, including dish sales, nested uses and meals. Check seasonal grade inventory, expedition supply and absence effects on farm coverage. |
| Romance, marriage and household | Relationship ranks and Greater Love reward interactions. Keep the 50-spouse soft ending. The final celebration is in the year of the fiftieth wedding and the Greater Festival is one new calendar year later. | Review courtship and marriage dates, anniversary playback, five-spouse celebrations and outfit progression. Short occasion windows can ease conflicts. Verify outcomes and event credits at all 50-Uma scales. |
| Library, Diary, story and UI | Date lines retain real ties to events and report dates. Show 30 selectable dates with season swipe, day navigation and a stable scroll area. | Update hard-coded date copy, story preview ranges, route validators, birthday and festival highlights, gallery and history labels, and save/restore details. Fit both landscape sizes. |

Measure schedule density separately from work throughput. Count fixed events per day, the longest stretch of
busy dates, and the number of quiet weeks for a first-year farm and a 50-spouse farm. Compare days to Farm Rank 10
and the 120 days after it with 0, 10, 20 and 50 Umas. Record what was skipped voluntarily, what could not be done
because of conflicts, and how much time remained for the farm. Use those results to tune the event slots and
the resource rules.

## Save conversion

Design and test a new calendar-aware save version. Keep a full reader for the existing v5 save and convert on the
client through the existing revision-controlled sync. Preserve account timestamps, the current visible season
and year, today's spent actions and all inventory and progress. Keep a consistent definition of the displayed
calendar date and the number of actual farm turns that elapsed.

- **Dates already read or promised:** migrate diary and Library dates, meetings, weddings, wedding plans,
  celebration receipts, seasonal field plans and signed schedule choices. Preserve their event identities and
  visible season/day where applicable. For a recurring anniversary, keep the wedding's seasonal date.
- **Live durations:** preserve remaining expedition days, pantry lifetime, loans and other countdowns. Preserve
  completed growth, skill, relationship cooldowns and time accrued toward employment perks. Audit the fields
  used for both a receipt and a duration and give each role an explicit conversion.
- **Recurrence and weekly phase:** migrate year-indexed mastery, orchard fruit, event-used keys and seasonal
  counters. Keep the displayed weekly shift usable on the day of conversion. Signed and shipped events use the
  coordinate space that matches their release, so a newly interpreted date cannot replay an earned event.
- **Mixed versions:** cover local-only, cloud-only, dirty device, later revision on a second device and a retry
  after interrupted conversion. The first successful upgrade travels through the normal API and stops an older
  client from overwriting it. Verify on copied fixtures before enabling the new version.

## Done when

The story and game agree on dates. A 120-day year plays end to end across the four roster sizes and the agreed
benchmarks hold. Converted saves keep their progress and active commitments. Calendar and important shop,
relationship and festival routes work at 844 × 390 and 667 × 375. Update the published rules and guide cards
with the verified date and balance results.
