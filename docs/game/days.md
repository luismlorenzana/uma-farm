# The days: the calendar, End the day and the farm map

**Built in F18, live from F24.** Time is turns
(D25): nothing on the farm moves until the player ends the day. This page is the calendar, End the day and its nine-step
night, the morning summary, the nudge, the farm map and the bars, as built. The rules are in `@farm/domain`
(`farm/calendar.ts`, `farm/places.ts`, `work/loop-env.ts`, `save/loop-work.ts`, `night/`); the screens in
`apps/web/src/loop/` and `shell/`. The spec is [core-spec.md](../design/core-spec.md) CS4–CS8; the calls are D31.

```
 ┌──────────────────────────────────┐
 │ (L)        ● 3   g 500  FR 1 sync │  the account bar: the date (the calendar), gold (the bin), the Farm Rank
 ├──────────────────────────────────┤
 │                                  │
 │   /          the farm map        │  eight rows of three; ?peek=<place> a quick look
 │   /roster    the whole roster    │  talents and ranks (F21); home or away, hearts (F23)
 │   /diary     the chapter         │  its goals and the Farm Rank (F24)
 │   /account   Account             │  Notifications: "Off: days are turns"
 │                                  │
 │   ?sheet=end       End the day   │  over any page
 │   ?sheet=calendar  the calendar  │
 │   ?sheet=rank      the Farm Rank │  F24
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
| `farmEnvV3(kinds)` | The v3 work places (the Forest, the Fishery, the Mill, the Sawmill, the Smokehouse; the Mine, the Quarry, the Smelter and the Cutter from M5), four slots each at speed 1, no upgrades, no Speed Tickets; who may work is who's home (`dorm.home`); work pays no EXP (ranks come at night, F21); the kinds are F22's `loopKinds(talentOf)`, with master data's talents (`LOOP_KINDS` reads everyone D) |
| `LoopKind` | A work kind: its request (its places and its parse, `LoopRequestKind`; the save's parse reads `LOOP_REQUESTS`), its uma-work rules and `multiDay` (a making job, the Mill's preserves, an expedition); F22's are foraging, fishing and the stations' six jobs ([gathering.md](gathering.md)) |
| `loopWorld(save)` | uma-work's state over a v3 save: the Warehouse as `<id>@<stars>` keys (F17's bridge), no building levels, the work rows, and the save around them for the kinds to read |
| The operations | `startLoopJob`, `editLoopQueue`, `collectLoopWorker`, `collectLoopAll`, `recallLoopWorker`, `repeatLoopJob`, `restartLoopStopped`, `dismissLoopStopped`: each at `workNow(save)`, stamped with the time given |
| The readings | `settleLoopWork`, `loopWorking`: no stamp, nothing stored; a settle during the day starts nothing new. `loopReadyWork`, `loopReadyItems` and the nudge read the stored rows without settling (F22, `save/work-readings.ts`): every stored save is settled at its day's start, so the bars and the Menu never load the kinds' rules |
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
| Has work | She holds a running job, or tends a block with a growing plot (F20; later a carer or an assistant) |
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
| 2 | `growCrops` | Crops grow: 1 a night untended, the tender’s rate tended; plots that reach their days − 0.5 turn Ready | F20 |
| 3 | `tendAnimals` | Animals are fed, affection moves, products are laid | M5 (F27) |
| 4 | `moveJobs` | Jobs move a day on: a quarter day for the well fed, then what finishes by the morning is read | F18 |
| 4 | `countHauls` | Tonight’s hauls count toward each forager’s and angler’s challenge; the best catch is noted | F22 |
| 5 | `resetWorkshops` | Each workshop may be played again tomorrow | M5 (F8) |
| 6 | `tickRanks` | Rank points for every Uma who worked, one activity each; rank-ups where points and the challenge are met | F21 |
| 6 | `tickBonds` | Bond points for pairs who shared a place | M6 (F33) |
| 6 | `countWellFed` | The well-fed days count down | F18 |
| 7 | `witherCrops` | On a season’s last night, crops still growing that don’t grow in the next season wither; Ready crops wait | F20 |
| 7 | `turnCalendar` | The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the day’s chats and gifts clear | F18 |
| 8 | `settleDorm` | The Dorm’s level bought takes effect; swaps arrive, each Uma away coming home in the place of one leaving | F23 |
| 8 | `gateVisitors` | A visitor who has waited 6 days leaves; every 4th morning one comes to the Gate while a bed is free and none waits | F23 |
| 8 | `checkGoals` | The Diary pays its milestones and rows, the Farm Rank is recomputed, and a chapter whose goals are met completes: its gold, plans and recruit | F24 |
| 9 | `buildSummary` | The morning summary, from what changed | F18 |
<!-- /live -->

```
 uma-work's clock    day d starts                                   day d + 1 starts
                     (d − 1) × 86,400,000                           d × 86,400,000
                     │ every tap of day d runs here                 │ every tap of day d + 1 runs here
 ────────────────────┼──────────────────────────────────────────────┼──────────────────
 End the day:        step 4: well fed's quarter day (speedUp here)  │
                     step 4: read what finishes by ─────────────────► (a copy, not stored)
                     step 6: ranks tick (F21, ranks.md)             │
                     step 7: the date turns; the settle is stored ──► queues start here,
                                                                       planned with tonight's ranks
```

- **Rank-ups and conversations show in the morning,** never mid-night. A rank reached tonight speeds tomorrow's work,
  because the settle that starts a queued job is stored only after step 6.
- **Seeded and replayable (CS8):** every draw a step makes is `draw(uid, day, what, n)` (F17), so ending the same save
  twice, on two devices, gives the same morning; the save holds no random state.
- **One stamp a night:** no step moves `account.updatedAt`; `endDay` stamps it once, after step 9.
- **What the night passes along:** `notes.sold` (step 1's sales, by good and star: the summary's bin section, F19),
  `notes.worked` (who held a running job at the day's start, and where: step 6 pays rank points from it) and
  `notes.finished` (each job finished by the morning, with its items); F20's `notes.tended` (tenders whose block had a
  growing plot: step 6 pays farming's points from it), `notes.ripened` (plots that turned Ready, by block) and
  `notes.withered` (by block and crop), [fields.md](fields.md#the-night-cs7-steps-2-and-7-cs4s-last-night); F21's
  `notes.ranks` (step 6's rank-ups and points full: the summary's ranks section, [ranks.md](ranks.md#the-night-step-6-decisions-2-and-3)).
- `NightContext` is what the night reads beyond the save: master data's roster (her line, so her favourite) and every
  Uma's talents (`talentOf`, F21's table from master data; D for everyone when left out, in tests).

## The morning summary (CS5, decision 11)

`save.summary` holds ids and counts, never sentences, and the app words them. It's the morning it opens on (its `day` is
the save's), replaced each night, and set to null when the player puts it away: **Start the day**, the close button or a
drag down, a player's change. CS5's six sections, in order; an empty one is hidden, and an empty card says "A quiet
night."

| Section | Lines (as built) | Words | A tap goes to | Filled by |
|---|---|---|---|---|
| The bin | `{ kind: 'sold', id, stars, count, gold, demand }`, then the total | "Salmon ★2 × 3 · 495g" (In demand), "Total · 545g" | the bin | F19 ([goods.md](goods.md#the-shipping-bin-cs10-cs7-step-1-decisions-46)) |
| Work done | `{ kind: 'jobs', place, jobs, items }`; `{ kind: 'crops', block, plots }`; `{ kind: 'withered', block, crop, plots }` | "Forest · 2 jobs done · 9 items", "Block A · 9 crops ready", "Block A · 3 Onion withered" | the place's quick look; the Fields | F18; F20 ([fields.md](fields.md#the-night-cs7-steps-2-and-7-cs4s-last-night)) |
| Ranks | `{ kind: 'rank-up', outfitId, activity, rank }`; `{ kind: 'full', outfitId, activity, rank, challenge }` (points filled tonight, the challenge to meet) | "Aster · Farming Hand" (Rank up), "Beryl · Fishing · Catch 30 fish · 12/30" (Points full) | her sheet on the roster | F21 ([ranks.md](ranks.md#the-morning-summary-cs5-cs7)) |
| Bonds | new hearts | — | — | M6 |
| New today | `{ kind: 'season', season }`, `{ kind: 'festival', festival, when }`; F23's `{ kind: 'dorm', level }`, `{ kind: 'home', umas }`, `{ kind: 'joined', outfitId, home }`, `{ kind: 'gate', outfitId }`, `{ kind: 'left', outfitId }` | "Summer begins", "Flower Show tomorrow", "Dorm level 2 · 5 beds", "Aster is home", "Fable joined · away", "Ember is at the Gate", "Ember left the Gate" | the calendar; the festival ground; the Dorm; her sheet; the Gate; the Diary; the rank's sheet | F18; F23 ([roster.md](roster.md#the-night-step-8-and-the-morning)); F24's `{ kind: 'chapter', chapter }`, `{ kind: 'farm-rank', rank }`, `{ kind: 'milestone', id }` ([goals.md](goals.md#the-nights-step-8-checkgoals)) |
| Today | `{ kind: 'idle', umas }`; `{ kind: 'seeds', plots }` (empty plots the seeds held could fill today) | "2 Umas idle", "9 plots to plant" | the roster; the Fields | F18; F20 |

M4's packets extended the shape in place while v3 was unreleased; from F24, v3 is live and a new line is v4. The parse is strict: unknown
keys, a line in words, a place without work slots, a place twice, an unknown festival, an Uma off the roster, a section
before its packet, a plot count outside 1–9, an unknown block or crop, a rank outside Hand–Legend, an unknown activity,
or a summary of another day are each refused with their path. The lines' words are `loop/summary-words.ts`, loaded with the farm map, so they stay out of the initial JS.

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
  ([goods.md](goods.md#the-screens)). F20 opened the Fields: a tap opens their quick look (`/?peek=fields`), which opens
  `/fields` ([fields.md](fields.md#the-screens-decision-11)). F22 opened the Forest, the Fishery and the three
  stations: a tap opens their quick look (`/?peek=forest` …), whose slot rows and Open lead to their pages; a station is
  locked until built ("Not built"), its quick look offering Build once what opens it has
  ([gathering.md](gathering.md#the-screens-decisions-5-and-8)). F23 opened the Dorm (`/dorm`) and the Gate (its quick
  look, `/?peek=gate`, with the visitor's face as its pip; [roster.md](roster.md#the-screens)). Every other place keeps
  its plain quick look.
- **Borrowed buildings:** the Coop, the bin, the Dorm, the board and the expedition post stand on unused uma-art buildings
  until their own ship (F25, F29, F38).
- **Pips** hang over a work place's building in a half arch (FR7): each working Uma's face ringed by her job's progress,
  or a free dot. A locked place with no one working shows none.
- **Ready badges and Collect all** stay (FR7): a place with finished work says Ready, and the pill collects every
  finished job on the farm (`collectLoopAll`). F20 adds Ready plots: the Fields say Ready while one is, Collect all
  counts them and harvests every block, and the Fields' pips are their blocks' tenders.
- **The help button** says how the farm works in five short lines.

## The bars (FC29, decisions 6 and 8)

- **The bottom bar:** Farm · Roster · **End the day** · Diary · Menu. End the day is uma-kit's raised centre disc, with
  the moon; it reads "All set" and glows when nothing waits, else "End day" with the count on the disc. The badge and the
  glow are uma-kit 0.19.0's (uma-platform P112, from F18's request), and the tab's name carries the count ("End the day:
  2 Umas idle · 3 to collect"). The same release lets the work screens print days (F22 uses it).
- **Days on the work screens:** the farm's own screens say days ("1 day", "in 7 days", "tomorrow"), and from F22 the
  kit's rows, sheets and chips do too, through uma-kit 0.19.0's `formatDuration`: "Tomorrow", "In 2 days", "1 day",
  "stopped yesterday" ([gathering.md](gathering.md#the-screens-decisions-5-and-8)).
- **The account bar:** the initial (Account), the date chip, F19's gold chip (it opens the bin,
  [goods.md](goods.md#gold-and-the-account-bar-decision-10)), F24's Farm Rank chip (it opens the rank's sheet,
  [goals.md](goals.md#the-farm-rank-cs39-decisions-1-and-8)), the sync chip.
- **Roster** (`/roster`) is the album of everyone on the roster, home or away, with F21's talents and ranks, filters and
  sorts, and her sheet ([ranks.md](ranks.md#the-screens-decision-7)); F23 adds where she is, your hearts with her, and
  Chat and Gift ([roster.md](roster.md#the-screens)). **Diary** (`/diary`) holds the chapter's card, its goals and their counts, the Farm Rank and the milestones paid ([goals.md](goals.md#the-screens)).
- **The Menu** lists the 23 places by FC28's rows (gathering, stations, the ranch, workshops, the yard, the town), each
  opening its quick look, locked ones marked; then Account, the switch and the build.

## Notifications (decision 12)

With days as turns nothing finishes while the app is closed, so the app sends no push schedule, and Account's
Notifications card says **"Off: days are turns"**. The Wilds' switch and schedule left with them in F24; the server's push
code and `farm-push-tick` are untouched ([architecture.md](architecture.md#notifications-f6)).
