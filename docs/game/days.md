# The days: the calendar, End the day and the farm map

**Built in F18, live from F24** (dark until then: the loop plays only with `VITE_FARM_LOOP=1`, D29). Time is turns
(D25): nothing on the farm moves until the player ends the day. This page is the calendar, End the day and its nine-step
night, the morning summary, the nudge, the farm map and the bars, as built. The rules are in `@farm/domain`
(`farm/calendar.ts`, `farm/places.ts`, `work/loop-env.ts`, `save/loop-work.ts`, `night/`); the screens in
`apps/web/src/loop/` and `shell/`. The spec is [core-spec.md](../design/core-spec.md) CS4–CS8; the calls are D31.

```
 ┌──────────────────────────────────┐
 │ (L)                    ● 3  sync │  the account bar: the date chip (season, day) opens the calendar
 ├──────────────────────────────────┤
 │                                  │
 │   /          the farm map        │  eight rows of three; ?peek=<place> a quick look
 │   /roster    the Umas home       │  a plain album until F21 and F23
 │   /diary     the chapter         │  its goals come with F24
 │   /account   Account             │  Notifications: "Off: days are turns"
 │                                  │
 │   ?sheet=end       End the day   │  over any page
 │   ?sheet=calendar  the calendar  │
 │   ?sheet=menu      Every place   │  with "Ask before ending the day"
 ├──────────────────────────────────┤
 │ Farm  Roster  (End day)  Diary  Menu │  End the day is the raised centre
 └──────────────────────────────────┘
```

## The calendar (CS4)

A season is 12 days and a year 48. Day *d* is year ⌈*d*/48⌉, season ⌊((*d*−1) mod 48)/12⌋, day ((*d*−1) mod 12) + 1
(`dateOf`). The festivals fall on each season's 10th day, and the Harvest Cup on Winter 12, the year's last day. In M4
they're dates only: the festival ground shows "Soon" (they come in M6, F32). The season's demand is F19's
([goods.md](goods.md#demand-by-season-cs4-decision-3)); its seeds, fish and forest family belong to F20 and F22.

<!-- live:calendar -->
| Season | Days (year 1) | Festival |
|---|---|---|
| Spring | 1–12 | Flower Show, Spring 10 (day 10) |
| Summer | 13–24 | Fishing Derby, Summer 10 (day 22) |
| Autumn | 25–36 | Cooking Contest, Autumn 10 (day 34) |
| Winter | 37–48 | Animal Show, Winter 10 (day 46); Harvest Cup, Winter 12 (day 48) |
<!-- /live -->

- **The date chip** sits in the account bar: the season's mark and the day of the season ("● 3"). uma-art's season marks
  (`season/spring` … `season/winter`) come with F25; until then the chip draws a dot in the season's colour (Spring
  green, Summer gold, Autumn orange, Winter blue). Its name for VoiceOver is the whole date and the next festival:
  "Calendar: Spring 3, year 1 · Flower Show in 7 days".
- **The calendar** (`?sheet=calendar`, from the chip): the day and the year, the four seasons with this one marked, the
  season's 12 days (past ones faded, today in the accent, the festival day ringed with a trophy), the season's festivals,
  the next festival with its countdown ("Flower Show · Spring 10 · in 7 days"), and the day of the year.
- **`nextFestival(day)`** is the first festival on or after a day, into the next year: on Spring 10 it's the Flower Show
  today; on Spring 11, the Fishing Derby on Summer 10, in 11 days.

## Work in days (FC6, decisions 1 and 4)

uma-work runs on the calendar: day *d* starts at (*d* − 1) × 86,400,000 ms (`workNow`), and **every work operation runs
then**. Nothing in the loop reads the device's clock for work, so reopening the app, or leaving it closed for a week,
moves nothing. A player's change is still stamped with real time (`account.updatedAt`), which the sync's conflict rule
needs. The loop has no 15-second settle ticks.

| Piece | What |
|---|---|
| `farmEnvV3(kinds)` | The v3 work places (the Forest, the Fishery, the Mill, the Sawmill, the Smokehouse; the Mine, the Quarry, the Smelter and the Cutter from M5), four slots each at speed 1, no upgrades, no Speed Tickets; who may work is who's home (`dorm.home`); work pays no EXP (ranks come at night, F21); the kinds are `LOOP_KINDS`, which F22 fills |
| `LoopKind` | A work kind: its places, its request's parse, its uma-work rules and `multiDay` (a making job, the Mill's preserves, an expedition) |
| `loopWorld(save)` | uma-work's state over a v3 save: the Warehouse as `<id>@<stars>` keys (F17's bridge), no building levels, the work rows, and the save around them for the kinds to read |
| The operations | `startLoopJob`, `editLoopQueue`, `collectLoopWorker`, `collectLoopAll`, `recallLoopWorker`, `repeatLoopJob`, `restartLoopStopped`, `dismissLoopStopped`: each at `workNow(save)`, stamped with the time given |
| The readings | `settleLoopWork`, `loopWorking`, `loopReadyWork`, `loopReadyItems`: no stamp, nothing stored; a settle during the day starts nothing new |
| Refusals | In the loop's words: "She isn't on the farm.", "She is busy for another 2 days.", "Short 1 Wheat." (a good's name is F19's `goodName`) |

A queue means "keep at this for N days": each job starts the moment the one before ends, at a night's boundary.

**Well fed (CS22):** a well-fed Uma's running job of a multi-day kind gains **a quarter day a night**. The night calls
uma-work's own `speedUp` with 12 Speed Tickets on a night-only env whose tickets cost nothing: 12 × 30 minutes = 21,600,000
ms, a quarter of a day, clamped by uma-work to the time the job has left, at tonight's start. A 1-day kind gains no time:
its plan makes ×1.25 items instead (F22). The well-fed days count down each night, and never stack. Nothing sets them in
M4 but tests; the staff meal is M5's (F8).

## End the day (CS6, CS7, CS8)

**The nudge.** End the day reads **"All set"** when every Uma on the farm has work, nothing waits to be collected, and
each open workshop has been played or lacks inputs (`daySetState`):

| Counts as | Rule |
|---|---|
| Has work | She holds a running job, or tends a block with a growing plot (later a carer or an assistant) |
| Idle | An Uma home with no work. A Ready Uma is idle too until she has work again |
| To collect | Each Uma with finished items, and each Ready plot |
| The badge | Idle Umas plus things to collect |
| Workshops | None open in M4, so the clause always holds; M5 (F8) adds it |

**The tap.** The raised tab opens `?sheet=end` over the page it's on:
- all set, or the Menu's switch off: the day ends at once;
- otherwise one line says what's left, **"2 Umas idle · 3 to collect"**, with **End anyway** and **Back**.

Either way the morning opens on the farm (`/`). The tap holds the day it meant, so a second tap, or a save another device
moved on meanwhile, ends nothing more. The night reads master data, which the farm loads as it opens; if it can't load,
the sheet says so with **Try again**. The game never ends a day by itself.

**The Menu's switch**, "Ask before ending the day", is a device setting (`farm.ask-end-day`), on by default and never in
the save.

**The night** is one pure function, `endDay(save, context, now)`: nine steps in CS7's order, then one stamp with real
time. A step whose packet hasn't landed passes the night on unchanged, and each packet fills its own:

<!-- live:night -->
| Step | Function | What happens | Filled by |
|---|---|---|---|
| 1 | `payTheBin` | The bin pays: everything shipped today, at price × stars × demand | F19 |
| 2 | `growCrops` | Crops grow; plots that reach their days turn Ready | F20 |
| 3 | `tendAnimals` | Animals are fed, affection moves, products are laid | M5 (F27) |
| 4 | `moveJobs` | Jobs move a day on: a quarter day for the well fed, then what finishes by the morning is read | F18 |
| 5 | `resetWorkshops` | Each workshop may be played again tomorrow | M5 (F8) |
| 6 | `tickRanks` | Rank points for every Uma who worked; rank-ups | F21 |
| 6 | `tickBonds` | Bond points for pairs who shared a place | M6 (F33) |
| 6 | `countWellFed` | The well-fed days count down | F18 |
| 7 | `turnCalendar` | The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the day’s chats and gifts clear; on a season’s last night, crops out of season wither (F20) | F18 |
| 8 | `checkGoals` | Visitors come and go; chapter goals, Diary milestones and the Farm Rank | F23, F24 |
| 9 | `buildSummary` | The morning summary, from what changed | F18 |
<!-- /live -->

```
 uma-work's clock    day d starts                                   day d + 1 starts
                     (d − 1) × 86,400,000                           d × 86,400,000
                     │ every tap of day d runs here                 │ every tap of day d + 1 runs here
 ────────────────────┼──────────────────────────────────────────────┼──────────────────
 End the day:        step 4: well fed's quarter day (speedUp here)  │
                     step 4: read what finishes by ─────────────────► (a copy, not stored)
                     step 6: ranks tick (F21)                       │
                     step 7: the date turns; the settle is stored ──► queues start here,
                                                                       planned with tonight's ranks
```

- **Rank-ups and conversations show in the morning,** never mid-night. A rank reached tonight speeds tomorrow's work,
  because the settle that starts a queued job is stored only after step 6.
- **Seeded and replayable (CS8):** every draw a step makes is `draw(uid, day, what, n)` (F17), so ending the same save
  twice, on two devices, gives the same morning; the save holds no random state.
- **One stamp a night:** no step moves `account.updatedAt`; `endDay` stamps it once, after step 9.
- **What the night passes along:** `notes.sold` (step 1's sales, by good and star: the summary's bin section, F19),
  `notes.worked` (who held a running job at the day's start, and where: F21 pays rank points from it) and
  `notes.finished` (each job finished by the morning, with its items). Later packets add their own notes (F20 what
  withered).
- `NightContext` is what the night reads beyond the save: master data's roster (F21 adds talents).

## The morning summary (CS5, decision 11)

`save.summary` holds ids and counts, never sentences, and the app words them. It's the morning it opens on (its `day` is
the save's), replaced each night, and set to null when the player puts it away: **Start the day**, the close button or a
drag down, a player's change. CS5's six sections, in order; an empty one is hidden, and an empty card says "A quiet
night."

| Section | Lines (as built) | Words | A tap goes to | Filled by |
|---|---|---|---|---|
| The bin | `{ kind: 'sold', id, stars, count, gold, demand }`, then the total | "Salmon ★2 × 3 · 495g" (In demand), "Total · 545g" | the bin | F19 ([goods.md](goods.md#the-shipping-bin-cs10-cs7-step-1-decisions-46)) |
| Work done | `{ kind: 'jobs', place, jobs, items }` | "Forest · 2 jobs done · 9 items" | the place's quick look | F18 (crops by block: F20) |
| Ranks | rank-ups, full points | — | — | F21 |
| Bonds | new hearts | — | — | M6 |
| New today | `{ kind: 'season', season }`, `{ kind: 'festival', festival, when }` | "Summer begins", "Flower Show tomorrow" | the calendar; the festival ground | F18 (visitors F23, scenes and milestones F24) |
| Today | `{ kind: 'idle', umas }` | "2 Umas idle" | the roster | F18 (seeds waiting F20) |

While v3 is unreleased (until F24) each packet extends the shape in place, with parse tests. The parse is strict: unknown
keys, a line in words, a place without work slots, a place twice, an unknown festival, an Uma off the roster, a section
before its packet, or a summary of another day are each refused with their path.

The card is a sheet over the farm. It shows on `/` whenever a summary is held and no quick look or other sheet is open,
so a tap on a line opens its place and Back brings the card back.

## The farm map (FC28, decision 5)

uma-kit's Hub map (`HubMap`) on the farmlands ground, three columns, scrolling up and down (FR6). It's 36 tiles tall
(864 px on a phone), so at 390 × 844 it scrolls by a row or two; the help button, the Collect all pill and the quick look
stay put.

<!-- live:farm-map -->
| Row | Left | Centre | Right |
|---|---|---|---|
| 1 | Fields | Mill | Coop |
| 2 | Forest | Sawmill | Barn |
| 3 | Fishery | Smokehouse | Kitchen |
| 4 | Mine | Smelter | Restaurant |
| 5 | Quarry | Cutter | Forge |
| 6 | Shipping bin | Warehouse | Dorm |
| 7 | Requests board | Gate | — |
| 8 | Shop | Festival ground | Expedition post |

| Place | Building (uma-art) | Opens |
|---|---|---|
| Fields | `vegetable-garden` | Day 1 |
| Mill | `fields-workbench` | Chapter 1's reward |
| Coop | `meadow` (borrowed) | Chapter 2 |
| Forest | `forest` | Day 1 |
| Sawmill | `forest-workbench` | Farm Rank 3 |
| Barn | `stable` | Chapter 2 |
| Fishery | `fishery` | Day 1 |
| Smokehouse | `fishery-workbench` | Farm Rank 3 |
| Kitchen | `kitchen` | Chapter 4 |
| Mine | `mine` | Chapter 3 |
| Smelter | `mine-workbench` | Chapter 3 |
| Restaurant | `party-hall` | Chapter 6 |
| Quarry | `quarry` | Chapter 3 |
| Cutter | `den-workbench` | Chapter 3 |
| Forge | `forge` | Chapter 7 |
| Shipping bin | `workbench` (borrowed) | Day 1 |
| Warehouse | `warehouse` | Day 1 |
| Dorm | `pantry` (borrowed) | Day 1 |
| Requests board | `card-library` (borrowed) | M6 |
| Gate | `scenario-gate` | Day 1 |
| Shop | `exchange` | Day 1 |
| Festival ground | `racecourse` | M6 |
| Expedition post | `rangers-lodge` (borrowed) | Chapter 5 |
<!-- /live -->

- **Rows are four tiles apart,** each place on its row's ground line, so a building, its pips' arch and its name fit.
- **A locked place** shows the kit's lock, and its quick look says what opens it: "Opens with Chapter 3", "Opens with
  Farm Rank 3", "Opens with Chapter 1's reward" (`placeOpen`: a chapter once it starts, the Mill once chapter 1 is done, a
  Farm Rank once reached). A place CS3 opens on day 1 whose screen hasn't landed says "Opens soon"; F19, F20, F22 and F23
  wire theirs up (`PLACE_SCREENS`, each with where a tap goes). F19 opened the shipping bin (`?sheet=bin`), the
  Warehouse (`/warehouse`) and the shop (`?sheet=shop`): a tap on the map or in the Menu goes straight there
  ([goods.md](goods.md#the-screens)); every other place keeps its quick look.
- **Borrowed buildings:** the Coop, the bin, the Dorm, the board and the expedition post stand on unused uma-art buildings
  until their own ship (F25, F29, F38).
- **Pips** hang over a work place's building in a half arch (FR7): each working Uma's face ringed by her job's progress,
  or a free dot. A locked place with no one working shows none.
- **Ready badges and Collect all** stay (FR7): a place with finished work says Ready, and the pill collects every
  finished job on the farm (`collectLoopAll`). Ready plots join with F20.
- **The help button** says how the farm works in five short lines.

## The bars (FC29, decisions 6 and 8)

- **The bottom bar:** Farm · Roster · **End the day** · Diary · Menu. End the day is uma-kit's raised centre disc, with
  the moon; it reads "All set" and glows when nothing waits, else "End day" with the count on the disc. The badge and the
  glow are uma-kit 0.19.0's (uma-platform P112, from F18's request), and the tab's name carries the count ("End the day:
  2 Umas idle · 3 to collect"). The same release lets the work screens print days (F22 uses it).
- **Days on the work screens:** uma-kit/work prints "24h" for a day. The farm's own screens say days ("1 day", "in 7
  days", "tomorrow"); the kit's rows follow once its duration option ships.
- **The account bar:** the initial (Account), the date chip, F19's gold chip (it opens the bin,
  [goods.md](goods.md#gold-and-the-account-bar-decision-10)), the sync chip.
- **Roster** (`/roster`) is a plain album of the Umas home with their best rank, and how many are away, until F21's ranks
  and F23's Dorm. **Diary** (`/diary`) holds the chapter until F24 gives it its goals.
- **The Menu** lists the 23 places by FC28's rows (gathering, stations, the ranch, workshops, the yard, the town), each
  opening its quick look, locked ones marked; then Account, the switch and the build.

## Notifications (decision 12)

With days as turns nothing finishes while the app is closed, so the loop never sends a push schedule, and Account's
Notifications card says **"Off: days are turns"**. `farm-push-tick` stays paused (D25), and the server's push code is
untouched: the Wilds keep theirs until F24.
