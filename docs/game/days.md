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

- **The date chip** sits in the account bar: the season's mark and the day of the season. The mark is uma-art's
  `season/spring` … `season/winter` (F25's part A, uma-art 2.25.0, pinned from F49); without it the chip draws a dot in the
  season's colour (Spring green, Summer gold, Autumn orange, Winter blue). Its name for VoiceOver is the whole date and the next festival:
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
moved on meanwhile, ends nothing more.

**On save v4, Tonight** (romance build; live from F56; F50 decision 8, F54 decision 5, RM22): the tap opens **Tonight**
first whenever an evening slot is free and someone can spend it, or anyone is married (`tonightOpens`): its **Evening**
row ("with Stand-in 2 · Walk ✓" once spent, the Uma who said yes with **Play ›**, else **Pick someone ›**; festival
night's own row on a festival day or the Festival of Vows), **Sleep at** once married (the Farmhouse and each house with
someone home, "· 3 home", ☕ for tomorrow's breakfast, "8 nights" for one you haven't slept in lately, "Her room" on a
birthday-alone wisher's birthday; the house slept in least lately preselected, a tap picks one at once), CS6's line, and
**End the day** / **Back**. End the day never waits on the evening. Otherwise the
rule above stands. **The night is a fade:** the screen dims to dusk, the night runs with nothing shown, and the morning
comes up from it (a plain cut with reduced motion). See [hearts.md](hearts.md#the-evening-rm19rm22-rm37). The night reads master data, which the farm loads as it opens; if it can't load,
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

**On save v4** (romance build; live from F56; F46, F47, F52, F50 and F51), the night runs these steps with v4's own where
the romance changes them (`nightStepsOf`, `NIGHT_STEPS_V4`):

- **Step 2** grows a tended block **×1.1 side by side** when its tender has a 3-heart partner tending another growing
  block (F52), **×1.2 for a farmer in her element**, and adds the farmers' **night chores**, +0.25 growth each to the
  untended block with the most growing plots, else hers (F51).
- **Step 4**, after the hauls, pays **side by side's extras** (`nightExtras`, F52): 10% of an Uma's night's items again
  (20% in her element, F51), seeded copies into the Warehouse, when a 3-heart partner worked the same place today; then
  **the perks' extras** (F51): the bond term × the romance term (her line's +10% and +20%, her ring, a dream, the
  household; held to 40%) of the same items, their own copies. Then **night chores** (`nightChores`, F51): a forager's
  and a fisher's bring one item each from her deepest area or spot. The planned hauls are untouched.
- **Step 6** pays rank points with her friendship's factor and **a mentor's ×1.10** (F51: an Uma at Friendship 9 at her
  line's place lifts the others there, one a place), **ticks bonds** (`tickBonds`, F52: +10 a pair at one place,
  ×1.5 sharing a favourite line of that place's, Romance 4's ×1.5 with her closest friend) and pays **her line's +10**.
  The bonds tick before her line, after the ranks.
- **Step 7** clears the whole of v4's `today` (chats, gifts, praise earned and paid, events, evenings, invitations, and
  the bond hearts noted since the last morning).
- **Step 8** runs `arriveUmas` in the Gate's place; each arrival's ties are **seeded** (F52).
- **Before step 1** (F54), once anyone is married, **tonight's house** is noted: your pick from Sleep at, else the house
  slept in least lately. **Step 6** (F54) also pays **+10 bond a night to each pair sharing a house** and brings a
  spouse's **S2 or S4** when its 600 is full. **Step 8** (F54) notes the **household milestones** (news at 1, 5, 10, 15
  and 20 married; the furniture set at 5; the finale's morning at 20). **Step 9** (F54) gives **the house's morning** first
  after a wedding's reception (+30 each resident, her breakfast, one more morning item each from S2), moves spouses
  waiting for a room into one, and holds the **Festival of Vows** on the finale's day each later year.
- **Step 9** notes **praise earned overnight** and **birthdays and anniversaries today and tomorrow**, leaves **this
  morning's items** (`morningItems`, F51: every 4th morning from Romance 2, every 2nd from Spouse 2), then draws **this
  morning's invitation** (`drawInvitations`, F50: one Uma home at Friendship 2+ whose favourite kind is open to her, two
  from 10 married, weighted toward the least seen, by `draw(uid, day, 'invite', n)`) before the summary, whose §4 lists
  the invitation, the morning items and night chores, the perks' and **side by side**'s extras and each pair's **bond
  hearts** reached since the last morning.

What v4 adds or changes:

<!-- live:night-v4 -->
| Step | Function | What happens | Filled by |
|---|---|---|---|
| 1 | `noteTonight` | Before the bin, once anyone is married: tonight’s house is noted (its last night slept is today), your pick from Sleep at or else the house slept in least lately; the pick clears for tomorrow | F54 |
| 2 | `growCrops` | Crops grow: 1 a night untended, the tender’s rate tended, ×1.1 side by side (her tender has a 3-heart partner tending another growing block), ×1.2 for a farmer in her element (Friendship 8); a farmer’s night chores add +0.25 growth each to the untended block with the most growing plots, else hers; plots that reach their days − 0.5 turn Ready | F20, F52, F51 |
| 4 | `nightExtras` | Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again (20% in her element), seeded copies straight into the Warehouse; then the perks’ extras: the bond term × the romance term of the same items (her line’s +10% and +20%, her ring, a dream, the household; held to 40%), their own seeded copies | F52, F51 |
| 4 | `nightChores` | Night chores: a forager’s bring one item each from her rank’s deepest forest area this season, a fisher’s one fish each from her deepest spot, at a day’s haul’s stars, into the Warehouse; 1 from F6, 2 from R7, 3 from S4, on the farm only | F51 |
| 6 | `tickRanks` | Rank points for every Uma who worked, one activity each, ×1.05 from her Friendship 5 and ×1.10 from Friendship 10, ×1.10 more beside a mentor (an Uma at Friendship 9 at her line’s place; one a place, never herself); rank-ups where points and the challenge are met | F21, F47, F51 |
| 6 | `tickBonds` | Bonds: +10 to each pair who worked one place today (the Fields’ tenders together), once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend | F52 |
| 6 | `payLine` | Her line: +10 to each Uma who worked today at one of her line’s places (a tended block for a farmer), once a night | F47 |
| 6 | `shareTheHouses` | Shared houses: +10 bond a night to each pair of spouses with rooms in the same house | F54 |
| 6 | `levelAtNight` | Spouse levels: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, no event (S2 starts her every-2nd-morning item); never S3 or S5 | F54 |
| 7 | `turnCalendar` | The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the whole of `today` clears: chats, gifts, praise earned and paid, events, Ask her, evenings and invitations, the ring made and the reception | F18, F47, F49, F53 |
| 8 | `arriveUmas` | Every cast Uma whose authored arrival holds joins, in the cast’s order: home while a bed is free, else away; each of her ties whose other Uma is on the farm starts at its seed (strength 3 → 150, 2 → 50) | F46, F52 |
| 8 | `openRingBench` | The ring bench: the night after the first Romance 8 event anyone played, the Forge stands as the bench (`buildings.forge = 0`), and Ida Stone’s scene is due in the morning | F53 |
| 8 | `householdMilestones` | Household milestones: as the married count passes 1, 5, 10, 15 and 20, each is news once; 5 brings the furniture set, 20 the finale’s morning; household scenes are Ready from this morning | F54 |
| 9 | `serveTheReception` | A wedding’s reception: everyone on the farm well fed from tomorrow for its days (a dish ★1–2 one, ★3–4 two, ★5 three; Marta’s cake one), never shortening a meal already running | F53 |
| 9 | `houseMorningStep` | The house’s morning: each resident of the house slept in +30 (only hers on a birthday-alone night); her breakfast (S1) feeds everyone on the farm with no meal left; each resident at S2+ leaves one more morning item; a house with residents not slept in for 8 nights misses you | F54 |
| 9 | `moveInRooms` | Rooms: spouses home in the Dorm who wait for a room take one, in wedding order, by the same default as a wedding’s | F54 |
| 9 | `vowsMorning` | The Festival of Vows: on the finale’s day of the year, each later year, every spouse +50 and a festival night tonight | F54 |
| 9 | `heartsMorning` | Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse | F47 |
| 9 | `morningItems` | Morning items: each Uma on the farm leaves a good of her line in the Warehouse every 4th morning from Romance 2 (★2+), every 2nd from Spouse 2 (★3+) | F51 |
| 9 | `drawInvitations` | Invitations: one Uma asks you for her favourite kind tonight (two from 10 married), drawn by `draw(uid, day, 'invite', n)` among those home at Friendship 2+ whose favourite kind is open to them, weighted 1 + days since her last evening (up to 14) | F50 |
| 9 | `buildSummary` | The morning summary, from what changed; §4 Hearts lists the invitations, the Festival of Vows, the night’s levels, the house’s morning, rooms taken and a house that misses you, the morning items and night chores, the perks’ and side by side’s extras and each pair’s bond hearts reached since the last morning; §5 the household milestones | F18, F50, F52, F51, F54 |
<!-- /live -->

The romance's points, birthdays and anniversaries are [hearts.md](hearts.md#points-rm13-rm15-rm18)'s; bonds are
[hearts.md](hearts.md#bonds-between-umas-rm48rm50)'s.

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

> **On save v4 (romance build; live from F56; F46 decision 15, F47 decision 14, F48 decisions 1 and 9):** §4 is **Hearts**
> in place of Bonds, in RM57's order: (1) **Ready** lines read live from `readiness` as the card shows, never stored, up
> to three, then "+N more" (the Hearts tab on Ready); (2) the invitation (`{ kind: 'invite', id, evening }`, "✉ Stand-in
> 2: “Walk at dusk tonight?”" with **Yes, tonight** and **Another day**, F50); (3) the house's morning (F54: "⌂ Farmhouse
> · Stand-in 1 · ♥ +30 · ☕ 3 fed · +1 item" with its house line, a move-in, "⌂ Rose Cottage misses you" with **Tonight ›**
> and **Another night**), with her
> morning items (`{ kind: 'item', id, items }`, "♥ Stand-in 2 left you ★3 Shiitake") and the night's chores (`{ kind:
> 'chores', items, growth }`, "Night chores · 3 items · +0.25 growth", F51); (4)
> birthdays and anniversaries today and tomorrow (`{ kind: 'birthday', id, when }`, `{ kind: 'anniversary', id, when,
> item }`, "★ Tomorrow: Stand-in 1's birthday"; the Festival of Vows, F54); (5) levels reached overnight (F54: "♥ Stand-in
> 1 · Spouse 2, reached overnight", her level-up card) and arrivals (`{ kind: 'arrived', id,
> home }`, "Stand-in 4 arrived · away", her arrival scene waiting); (6) the perks' extras (`{ kind: 'perks', items }`,
> "Perks · +2 items", F51), side by side's extras (`{ kind: 'side', items }`,
> "Side by side · +3 items", opening the Warehouse) and bond hearts (`{ kind: 'bond', a, b, hearts }`, "♥♥ Stand-in 1 &
> Stand-in 2 · bond 2" with **Read** while a conversation waits, F52). The section shows
> whenever a stored line or a Ready Uma is there, and every line opens her profile (`/hearts?uma=`); a rank's line opens
> its Work side (`/hearts?view=work&uma=`) and "2 Umas idle" the Work view. The household's Ready offers ("⌂ Household
> scene 1 · Ready") follow the Ready lines, live (F54). §5 drops the roster's `joined`, Gate and `left` lines and adds the
> household milestones ("Married 5 · Household scene 1, the furniture set, +5% items", F54); and night step 8 runs `arriveUmas` in place of `gateVisitors`
> ([hearts.md](hearts.md#the-night-and-the-morning-on-v4)). The table below is v3's.

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
| Shipping bin | `shipping-bin` | Day 1 |
| Warehouse | `warehouse` | Day 1 |
| Dorm | `dorm` | Day 1 |
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
- **The homestead on v4** (romance build; live from F56; F54 decision 2, RM41): rows after the yard and before the town
  edge, which moves down to stay the map's last row: the Farmhouse, House 1 and House 2 (row 8); Houses 3–5 (row 9); House
  6 (row 10). Built houses and the next lot show, so the map grows a row at a time (40 tiles with one homestead row, 48
  with three). A house's pips are its residents' faces (♥ on a Ready one) and its free rooms' dots; a tap opens the
  homestead's sheet at that house (`/?sheet=homestead&house=<n>`); the next lot is the cottage dimmed and locked, "Build ·
  8,000g". The rows and their frames are in [hearts.md](hearts.md#the-homestead-rm41-decisions-13). v3's map is the eight
  rows above, unchanged.
- **The Forge on v4** (romance build; live from F56; F53 decision 3): it opens as **the ring bench** the night after the
  first Romance 8 (`buildings.forge = 0`, D30's "held, not built"), not with chapter 7; locked before that, its quick look
  says "Opens with your first Romance 8". Open, its quick look reads **Ring bench · one ring a day** with **Make a ring ›**
  (`?sheet=bench`, [hearts.md](hearts.md#the-ring-bench-rm38-rm40-decisions-35)). Chapter 7 (M6) still lights its fire for
  the merge game and tools. v3's Forge is M4's: "Opens with Chapter 7".
- **Borrowed buildings:** the Coop, the board and the expedition post stand on unused uma-art buildings until their own
  ship (F29, F38). The bin and the Dorm draw F25's own `shipping-bin` and `dorm` (uma-art 2.25.0, pinned from F49).
- **Pips** hang over a work place's building in a half arch (FR7): each working Uma's face ringed by her job's progress,
  or a free dot. A locked place with no one working shows none.
- **Ready badges and Collect all** stay (FR7): a place with finished work says Ready, and the pill collects every
  finished job on the farm (`collectLoopAll`). F20 adds Ready plots: the Fields say Ready while one is, Collect all
  counts them and harvests every block, and the Fields' pips are their blocks' tenders.
- **The help button** says how the farm works in five short lines.

### The HD-2D farm: the map's second look (F11, a preview)

**Built in F11 (D71), off by default; the Umas on it in F12 (D77).** Home can draw the same farm on the shared HD-2D stage
([uma-stage](https://github.com/luismlorenzana/uma-platform/blob/main/packages/stage/README.md) 0.4.0) instead of
uma-kit's Hub: **Account → HD-2D farm (preview)**, this device only, or `?stage=1` (`?stage=0` turns it off) in the
address at boot. Off, Home is the Hub above, unchanged. Rules never read the switch and the save never changes because of
it (FR14). It works in the deployed build and the romance build alike.

```
  9 tiles across (fit to width on a 2× phone), the camera pitched 35°, panning up and down only, settling on a band
 ┌─ x 0 ──── 2 │ 3 ──── 5 │ 6 ──── 8 ─┐
 │  plot        │ L  bldg   │ L  bldg   │  z 0–1  a plot's back rows: its building (flush right in the middle and right
 │  plot      L │ L  bldg   │ L  bldg   │         columns, left in the left one) or its ground and landmarks
 │  apron  ▲    │ ▲  apron  │ ▲  apron  │  z 2    the apron: its `place` marker in the middle (▲), its slots
 │  path ───────┴──────────┴────────── │  z 3    the path row under every band
 └──────────────────────────────────────┘
   L = a lane at each column's edge, laid as path where the recipe leaves it free; the Gate's plot (row 7, middle) is path
```

- **The rows are the map's:** the eight rows above, the homestead's 0–3 after the yard on v4 in the romance build, then
  the town edge; 32 tiles deep, 44 with three homestead rows. Each band is a 3 × 3 plot a place and a path row.
- **Each place is its recipe** (kit-farm.md KF4): walls, roof, width × storeys, door and mounted pieces, with its
  landmarks. A place stands once CS3 opens it and, for a station, once it's built; before that it's an **overgrown lot**
  (weeds, brambles, a broken fence; KF7) with its name and lock. The Coop and the Barn stand from chapter 2 though their
  screens are still "Soon". The Mine's cliff is rock at its plot's back; the pond and the quarry's pit sit a level down.
- **The Fields' crops:** their soil's eight tiles around the scarecrow show the first eight plots in the Fields' screen's
  order (block A first): a sprout, then growing from half its growth, then its family's ripe frame once Ready (KF6's
  twelve families for the 27 crops); the morning after a season's end, the withered ones while the summary is up.
- **The homestead on v4:** the Farmhouse, each built house (one drawing for all, RM41) and the next lot's stakes.
- **Names, locks, Ready badges and pips are uma-kit's,** the very models the Hub's place links carry, laid over the stage
  and following the camera: the pips in a half arch over the plot, the Ready badge at its foot, the name pill under the
  apron with a locked place's lock in it.
- **A tap opens what the Hub's place opens** (`placeLink`; a house its sheet): whatever is drawn nearest under the finger,
  a building, a landmark, a crop or a marker, else the plot under the ground. **A long-press** (half a second) opens any
  place's quick look (`?peek=`), the Warehouse's and the Dorm's too; a drag never taps.
- **What stands in front fades only for what you're looking at:** at rest nothing is faded, but a roof or a tree in front
  of a Ready Uma (below); with a place's quick look open, a roof or a tree in front of its slots fades to a third (ST3's
  fade, its markers narrowed to that place's slots; ST4's figure filter counting the Ready Umas only).
- **The seasons are the light** (KF10): spring fresh and soft, summer bright and warm, autumn amber, winter cold and pale
  with the lamps up. The morning after a season's last night eases to the next over a second (at once with reduced motion).
- **The camera** opens on the band of the first place with a Ready badge, else the Fields', and keeps its place between
  visits for the session.
- **Battery** (FR13): saver's 30 fps, and the stage stops once it says it's at rest (the camera, every walk, every fade
  and the light still; uma-stage 0.4.0's `onSettled`), while the app is in the background and while a full-screen scene is
  over Home. Phaser's Hub never loads with it on (FR4).
- **The kit** is F9's painted `kit-farm` (uma-art 2.27.0, wave 1, the owner's look approved; D73), loaded the first time the
  stage shows. What it doesn't draw yet (wave 2: the stone set, the Mine's cliff and mouth, the Quarry, the ranch's pieces,
  the Forge's, the Restaurant's and the town's landmarks) is the flat stand-in until wave 2 ships (KF14). Window boxes hang
  just under the ground floor's windows. On a slow first load the stand-in shows after a second and a half, then the kit;
  the kit and the stage are kept on the phone after their first load, so they work offline, and a player with the switch
  off never downloads them.

#### The Umas on the stage (F12)

**Built in F12 (D77; hd2d-farm FR9–FR14, kit-farm KF5).** The places keep one look, and the Umas show the work. Days are
turns (D25): nobody moves while the app is closed, work is settled at night, and Ready is the morning's Ready.

```
  the yard (band 6)                         a work place (the Mill: its lane and apron)
 ┌ Shipping bin ┬ Warehouse ┬ Dorm ──────┐  ┌ x 3 ┬ 4 ─ 5 ┐
 │              │           │   bldg     │  │ ①→  │ bldg  │  z 0   ① ② ③ face the building (right)
 │              │           │   bldg     │  │ ②→  │ bldg  │  z 1
 │              │           │ ② ① ③      │  │ ③↗  │ ④↑    │  z 2   ④ in front of it faces it (back)
 │ ⑫ ⑪ ⑩ ⑨ ⑧ ⑦  ─────────── ⑤ ④ ⑥ ─────│  └─────┴───────┘
 └──────────────── then the open ground beside the Gate (⑬…, its free tiles)
   ① … the idle Umas in order, each keeping her spot while she stays idle; a spouse on v4 stands on her house's apron
```

- **Who stands on the farm** (decision 1), the same Umas the Hub's pips show: every Uma whose job holds a slot at that
  slot (a place's four slots: its lane's three tiles and the apron's middle beside a building, or the apron's three and
  one behind its end), every tender on her block's slot on the Fields, and everyone else on the farm (`farmHome`) idle in
  the yard: on the Dorm's apron, the path in front of it, the path row on toward the bin, then the open ground beside the
  Gate. A spouse in her house (v4, the romance build) stands on her house's apron. Nobody who's away. A visitor waiting
  at the Gate stays its pip (she isn't on the farm yet). The pips stay in the chips too.
- **They face the work:** a building beside a slot (or beside the tile behind it), else into the place, away from the
  camera; the idle face you.
- **Walks** (decisions 2, 3): an Uma you put to work (from a place's quick look, its page or the Fields) walks from where
  she stood to her slot; one recalled, or collected with nothing queued next, runs home; one who joins walks in from the
  Gate, and one who leaves runs out of it. Only who moved moves: the farm compares where everyone stood before and after
  each change made on this device today, and a walk started while you were on a place's page plays when Home comes back.
  **At boot, in the morning and after a sync from another device, everyone stands where she belongs at once** (FR14: the
  counts never wait on a walk). A walk that a rebuild (a crop growing, a place opening) couldn't keep starts again from
  where she stands. The walk is uma-quest's field speed, the run its dash.
- **Ready bubbles** (decision 4): a round card over her head, with a tail to her, rising as it appears: her work's item
  whenever she has something to collect (the Forest's and the Fishery's haul each morning of a longer job, so a place has
  as many bubbles as its Ready badge counts; a station's output), the crop over a tender whose block has Ready plots, with
  ♥ in its corner when her heart event is Ready too (v4), or ♥ alone over an Uma with nothing to collect. Nothing while
  she works. **A Ready Uma counts for the fade,** so a roof or a tree in front of her fades and she shows through.
- **Taps** (decision 5), the Umas first: **a bubble** collects her work (`collectJob`) or harvests her block, the items
  rising to the Warehouse with their count (none with reduced motion), and she starts her queued job or runs home; a ♥
  bubble plays her event (`?event=`); **an Uma** opens her sheet (her roster sheet on v3, her profile on the Hearts tab on
  v4); anything else is a tap as before. Collect all still collects everything.
- **How they look** (decision 7, FR12, FR13): an Uma whose outfit has a sprite set in master data walks as a sprite once
  her set is live, at most 8 sets at once, those nearest the view's middle; the rest, and every outfit without a set, are
  **standees**: her face on a card on a small base, gliding with a bob. Sets download the first time they're needed and
  stay on the phone.
- **Not yet: the nod.** Decision 8's gentle `nod` every 4–7 seconds while she works waits on uma-stage: its band stage
  can't play an action on a figure yet (D77's stage ask). Until then a working Uma stands still at her slot.

## The bars (FC29, decisions 6 and 8)

- **The bottom bar:** Farm · Roster · **End the day** · Diary · Menu; **on the romance build, Farm · Hearts · End the day ·
  Diary · Menu** (romance build; live from F56; F48 decision 3): Hearts, uma-kit's heart with no badge, is the Umas' tab
  with the roster's album as its Work view ([hearts.md](hearts.md#the-hearts-tab-rm51-rm52)). End the day is uma-kit's raised centre disc, with
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
  Chat and Gift ([roster.md](roster.md#the-screens)). On the romance build `/roster` lands on **Hearts**' Work view
  (`/hearts?view=work`). **Diary** (`/diary`) holds the chapter's card, its goals and their counts, the Farm Rank and the milestones paid ([goals.md](goals.md#the-screens)).
- **The Menu** lists the 23 places by FC28's rows (gathering, stations, the ranch, workshops, the yard, the town), each
  opening its quick look, locked ones marked; then Account, the switch and the build.

## Notifications (decision 12)

With days as turns nothing finishes while the app is closed, so the app sends no push schedule, and Account's
Notifications card says **"Off: days are turns"**. The Wilds' switch and schedule left with them in F24; the server's push
code and `farm-push-tick` are untouched ([architecture.md](architecture.md#notifications-f6)).
