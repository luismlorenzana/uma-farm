# Game mechanics

How uma-farm works today, as the code runs it. This is the one description of the game: every rule change updates it in
the same commit, and where it and the code ever differ, the code wins and this document is fixed. The page view is
[game-mechanics.html](pages/game-mechanics.html); where the game is going is in [the roadmap](roadmap.md).

**What's live and what isn't.** The deployed game is one game on **save v4**: the farm's loop, its places, chapter 1
and the **romance** (Part 3), played from the story pack. The **HD-2D farm** (Part 4) is an opt-in preview. A save from
before v4 starts over (see [Save versions](#save-versions)).

**The tables are generated.** Every table between `<!-- live:… -->` markers is written from the rules by
`packages/domain/src/docs/render.ts`. A test fails when one is stale, and `pnpm docs:update` rewrites them. Edit the
prose here; change a table by changing the rule.

**Contents**

- **[Part 1 — The farm's days and work](#part-1--the-farms-days-and-work)**
  - [The calendar and the day](#the-calendar-and-the-day)
  - [The farm map and the bars](#the-farm-map-and-the-bars)
  - [The Fields](#the-fields)
  - [Gathering](#gathering)
  - [The stations](#the-stations)
  - [Goods and gold](#goods-and-gold)
- **[Part 2 — The Umas and the farm's progress](#part-2--the-umas-and-the-farms-progress)**
  - [The roster](#the-roster)
  - [Talents and ranks](#talents-and-ranks)
  - [Goals](#goals)
- **[Part 3 — Hearts: the cast and the romance](#part-3--hearts-the-cast-and-the-romance)**
  - [The cast and the story pack](#the-cast-and-the-story-pack)
  - [The opening, the farmer's name, and arrivals](#the-opening-the-farmers-name-and-arrivals)
  - [Her favourite line and tastes](#her-favourite-line-and-tastes)
  - [Her route](#her-route)
  - [Perks](#perks)
  - [Heart events and plays](#heart-events-and-plays)
  - [The evening](#the-evening)
  - [The ring, the wedding, and married life](#the-ring-the-wedding-and-married-life)
- **[Part 4 — The HD-2D farm and the save](#part-4--the-hd-2d-farm-and-the-save)**
  - [The HD-2D farm (an opt-in preview)](#the-hd-2d-farm-an-opt-in-preview)
  - [The save, as a player meets it](#the-save-as-a-player-meets-it)

## Part 1 — The farm's days and work

A farm day is a turn. Nothing on the farm moves until you end the day, whether the app is open, closed or left alone for
a week. In the day you plant and harvest the Fields, send Umas to the forest, the Fishery and the stations, collect what
they bring home, ship goods and spend gold. Ending the day runs the night: the bin pays, crops grow, jobs move a day on,
Umas rank up and the date turns. The morning opens on a card of what the night brought.

```
 the day: nothing moves on its own              End the day ──► the night, in order
   plant · tend · harvest       the Fields                       1 the bin pays
   start · queue · collect      the work places                  2 crops grow
   ship · take back             the bin                          3 animals (none on the farm)
   buy seeds, land, stations    gold                             4 jobs move a day on; hauls count
                                                                 5 workshops (none open)
 the morning: the summary card ◄──────────────────────────────── 6 rank points and rank-ups
   the bin · work done · ranks · hearts · new today · today      7 crops wither; the date turns
   [Start the day] ──► the next day                              8 the Dorm, arrivals, the goals
                                                                 9 the morning summary
```

### The calendar and the day

#### Seasons, days and the year

Four seasons of 12 days make a 48-day year. Day 1 is Spring 1 of year 1, and day *d* falls in:
- **its year:** ⌈*d* ÷ 48⌉;
- **its season:** ⌊((*d* − 1) mod 48) ÷ 12⌋, counting Spring 0, Summer 1, Autumn 2 and Winter 3;
- **its day of the season:** ((*d* − 1) mod 12) + 1.

The season sets:
- **what you can plant** and which seeds the shop sells (the Fields);
- **what the forest and the Fishery bring home** (Gathering);
- **which goods are in demand** at the bin (Goods and gold);
- **what withers**: on a season's last night, growing crops that don't grow in the next season wither.

The year's seasons, with their days in year 1 and their festivals:

<!-- live:calendar -->
| Season | Days (year 1) | Festival |
|---|---|---|
| Spring | 1–12 | Flower Show, Spring 10 (day 10) |
| Summer | 13–24 | Fishing Derby, Summer 10 (day 22) |
| Autumn | 25–36 | Cooking Contest, Autumn 10 (day 34) |
| Winter | 37–48 | Animal Show, Winter 10 (day 46); Harvest Cup, Winter 12 (day 48) |
<!-- /live -->

- **The date chip** in the top bar shows the season's mark and the day of the season; without the mark it draws a dot in
  the season's colour (Spring green, Summer gold, Autumn orange, Winter blue). Its spoken name is the whole date and the
  next festival: "Calendar: Spring 3, year 1 · Flower Show in 7 days". A tap opens the calendar.
- **The calendar** shows the day and the year ("Spring 3 · Year 1"); the four seasons with this one marked; the season's
  12 days, past days faded, today in the accent colour and a festival day ringed with a trophy; the season's festivals
  ("Flower Show · Spring 10"); the next festival with its countdown ("Flower Show · Spring 10 · in 7 days"); and the day
  of the year ("Day 3 of 48. Days move only when you end them.").
- **The next festival** is the first one on or after today, running on into the next year: on Spring 10 it's the Flower
  Show, today; on Spring 11 it's the Fishing Derby on Summer 10, in 11 days.

#### Festivals

Each season's 10th day holds its festival, and Winter 12, the year's last day, also holds the Harvest Cup. Festivals are
dates only: the calendar marks them, the morning says "Flower Show tomorrow" the day before and "Flower Show today" on
the day, and the Festival ground on the map stays locked ("Opens soon"). No contest is played and no prize is given.

A festival day also opens a festival night for the evening, and once the household's finale is reached, the Festival
of Vows returns on its day each year. Both are the romance's.

#### Work is measured in days

- **The work clock is the calendar.** Day *d* starts at (*d* − 1) whole days on the work clock, and every work action
  you take that day (start, queue, collect, recall, repeat) happens at that moment. Nothing reads the device's clock for
  work, so reopening the app moves nothing.
- **Jobs last whole days.** A gathering job runs 1 to 4 days; a station job runs as many days as her rate needs (at
  least 2 for preserves). A day's work is done by the next morning.
- **Crops grow by the night:** 1 growth a night untended, more with a tender.
- **A queue means "keep at this for N days".** Up to three jobs wait behind the running one, at the same place; each
  starts the moment the one before ends, at a night's boundary.
- **The screens speak in days:** "Tomorrow", "In 2 days", "1 day", "3 days", "stopped yesterday". Nothing shows hours.
- **Your changes are stamped with the real time**, which syncing between devices compares; that stamp never moves the
  date.

#### End the day

The raised moon disc in the middle of the bottom bar ends the day.

**The nudge.** The disc reads **All set** and glows when nothing waits; otherwise it reads **End day** with a count on
it. Its spoken name says what's left: "End the day: 2 Umas idle · 3 to collect".

| Counts as | When |
|---|---|
| Has work | She holds a running job, or she tends a block that has a growing plot |
| Idle | She's on the farm with no work. An Uma whose job has ended with nothing queued is idle until she has work again; tending an empty or all-Ready block is idle. An Uma leaving tomorrow on a swap isn't counted |
| To collect | Each Uma with finished items not yet collected (a running job's finished days included), and each Ready plot |
| The count | Idle Umas plus things to collect |

The nudge reads the save as the day started, so every device shows the same count.

**The tap** opens the End-the-day sheet over whatever page you're on:
- **All set, or the Menu's "Ask before ending the day" switched off:** the day ends at once.
- **Otherwise** one line says what's left, "2 Umas idle · 3 to collect", with **End anyway** and **Back**.

Either way the morning opens on the farm map. The tap holds the day it was meant for: a second tap, or a save that
another device has already moved on, ends nothing more. The night reads the game's master data (each Uma's talents and
birthday) and the story pack (her favourite line, the arrivals, the ties), which the farm loads as it opens; if either
can't load, the sheet says so with **Try again**. The game never ends a day by itself.

**"Ask before ending the day"** is a switch in the Menu: on by default, kept on the device and never in the save.

**Tonight.** The tap first opens **Tonight** whenever an evening can be spent with someone or anyone is married: the
evening's row, where you sleep once married, the nudge's line, and **End the day** / **Back**. Ending the day never
waits on the evening. The night plays as a fade: the screen dims to dusk and the morning comes up from it (a plain cut
with reduced motion). Tonight is the romance's.

#### The night, step by step

The night is one fixed run of steps over the save:

1. **The bin pays.** Everything shipped today pays at its price × stars × demand on the day it was shipped, so a
   season's last night still pays that season's demand. Gold rises and the bin empties. Before it, once anyone is
   married, tonight's house is noted.
2. **Crops grow.** Each planted plot that isn't Ready grows by its block's rate, and a plot whose growth reaches its
   days − 0.5 turns Ready. A tender whose block had a growing plot worked tonight. A tended block grows ×1.1 side by
   side and ×1.2 for a farmer in her element, and farmers' night chores add +0.25 growth each.
3. **Animals.** Nothing changes: no animals live on the farm.
4. **Jobs move a day on.** A well-fed Uma's running multi-day job first gains a quarter day. Then the night reads what
   finishes by the morning: each day's haul, each station batch, each job that ends. Tonight's hauls count toward each
   forager's and angler's rank challenge, and the night's best catch is noted. Side by side's and the perks' extra items
   and foragers' and fishers' night chores go straight into the Warehouse.
5. **Workshops.** Nothing changes: no workshop is open.
6. **Ranks.** Every Uma who worked today earns a day's rank points in that work's activity, once a night, with her
   friendship's and a mentor's factors; then every Uma whose points and challenge are both met ranks up, one rank a
   night. Bonds tick, her line pays +10, shared houses pay, spouses level, and well-fed days count down by one.
7. **The date turns.** On a season's last night, growing crops that don't grow next season wither first. Then the date
   moves on and the work clock with it: finished jobs turn Ready, and queued jobs start, planned with tonight's ranks. A
   queued job whose inputs the Warehouse can't cover stops its queue. The whole of today's record clears: chats, gifts,
   praise, events, evenings and invitations.
8. **The farm's news.** A Dorm level you bought takes effect and swaps arrive; the cast's Umas whose arrival holds join;
   the Diary pays its milestones and rows, the Farm Rank is recomputed, and a chapter whose goals are all met completes;
   the ring bench opens the night after the first Romance 8, and the household's milestones are noted.
9. **The morning.** A wedding's reception is served, the house's morning given, spouses move into rooms, the Festival
   of Vows is held, praise, birthdays and anniversaries are noted, morning items are left and the morning's invitations
   drawn; then the morning summary is built from what changed.

A night without the story pack runs the farm's steps and skips the romance's: no arrivals, no favourites, no bonds and
no line pay. The farm waits for the pack before it ends a day, so in play every night has it.

The steps as the game lists them:

<!-- live:night -->
| Step | Function | What happens |
|---|---|---|
| 1 | `noteTonight` | Before the bin, once anyone is married: tonight’s house is noted (its last night slept is today), your pick from Sleep at or else the house slept in least lately; the pick clears for tomorrow |
| 1 | `payTheBin` | The bin pays: everything shipped today, at price × stars × demand |
| 2 | `growCrops` | Crops grow: 1 a night untended, the tender’s rate tended, ×1.1 side by side (her tender has a 3-heart partner tending another growing block), ×1.2 for a farmer in her element (Friendship 8); a farmer’s night chores add +0.25 growth each to the untended block with the most growing plots, else hers; plots that reach their days − 0.5 turn Ready |
| 3 | `tendAnimals` | Animals: nothing happens until the ranch is built |
| 4 | `moveJobs` | Jobs move a day on: a quarter day for the well fed, then what finishes by the morning is read |
| 4 | `countHauls` | Tonight’s hauls count toward each forager’s and angler’s challenge; the best catch is noted |
| 4 | `nightExtras` | Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again (20% in her element), seeded copies straight into the Warehouse; then the perks’ extras: the bond term × the romance term of the same items (her line’s +10% and +20%, her ring, a dream, the household; held to 40%), their own seeded copies |
| 4 | `nightChores` | Night chores: a forager’s bring one item each from her rank’s deepest forest area this season, a fisher’s one fish each from her deepest spot, at a day’s haul’s stars, into the Warehouse; 1 from F6, 2 from R7, 3 from S4, on the farm only |
| 5 | `resetWorkshops` | Each workshop may be played again tomorrow |
| 6 | `tickRanks` | Rank points for every Uma who worked, one activity each, ×1.05 from her Friendship 5 and ×1.10 from Friendship 10, ×1.10 more beside a mentor (an Uma at Friendship 9 at her line’s place; one a place, never herself); rank-ups where points and the challenge are met |
| 6 | `tickBonds` | Bonds: +10 to each pair who worked one place today (the Fields’ tenders together), once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend |
| 6 | `payLine` | Her line: +10 to each Uma who worked today at one of her line’s places (a tended block for a farmer), once a night |
| 6 | `shareTheHouses` | Shared houses: +10 bond a night to each pair of spouses with rooms in the same house |
| 6 | `levelAtNight` | Spouse levels: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, no event (S2 starts her every-2nd-morning item); never S3 or S5 |
| 6 | `countWellFed` | The well-fed days count down |
| 7 | `witherCrops` | On a season’s last night, crops still growing that don’t grow in the next season wither; Ready crops wait |
| 7 | `turnCalendar` | The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the whole of `today` clears: chats, gifts, praise earned and paid, events, Ask her, evenings and invitations, the ring made and the reception |
| 8 | `settleDorm` | The Dorm’s level bought takes effect; swaps arrive, each Uma away coming home in the place of one leaving |
| 8 | `arriveUmas` | Every cast Uma whose authored arrival holds joins, in the cast’s order: home while a bed is free, else away; each of her ties whose other Uma is on the farm starts at its seed (strength 3 → 150, 2 → 50) |
| 8 | `checkGoals` | The Diary pays its milestones and rows, the Farm Rank is recomputed, and a chapter whose goals are met completes: its gold, plans and authored arrival |
| 8 | `openRingBench` | The ring bench: the night after the first Romance 8 event anyone played, the Forge stands as the bench (`buildings.forge = 0`), and Ida Stone’s scene is due in the morning |
| 8 | `householdMilestones` | Household milestones: as the married count passes 1, 5, 10, 15 and 20, each is news once; 5 brings the furniture set, 20 the finale’s morning; household scenes are Ready from this morning |
| 9 | `serveTheReception` | A wedding’s reception: everyone on the farm well fed from tomorrow for its days (a dish ★1–2 one, ★3–4 two, ★5 three; Marta’s cake one), never shortening a meal already running |
| 9 | `houseMorningStep` | The house’s morning: each resident of the house slept in +30 (only hers on a birthday-alone night); her breakfast (S1) feeds everyone on the farm with no meal left; each resident at S2+ leaves one more morning item; a house with residents not slept in for 8 nights misses you |
| 9 | `moveInRooms` | Rooms: spouses home in the Dorm who wait for a room take one, in wedding order, by the same default as a wedding’s |
| 9 | `vowsMorning` | The Festival of Vows: on the finale’s day of the year, each later year, every spouse +50 and a festival night tonight |
| 9 | `heartsMorning` | Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse |
| 9 | `morningItems` | Morning items: each Uma on the farm leaves a good of her line in the Warehouse every 4th morning from Romance 2 (★2+), every 2nd from Spouse 2 (★3+) |
| 9 | `drawInvitations` | Invitations: one Uma asks you for her favourite kind tonight (two from 10 married), drawn by `draw(uid, day, 'invite', n)` among those home at Friendship 2+ whose favourite kind is open to them, weighted 1 + days since her last evening (up to 14) |
| 9 | `buildSummary` | The morning summary, from what changed; §4 Hearts lists the invitations, the Festival of Vows, the night’s levels, the house’s morning, rooms taken and a house that misses you, the morning items and night chores, the perks’ and side by side’s extras and each pair’s bond hearts reached since the last morning; §5 the household milestones |
<!-- /live -->

- **Every draw is seeded** by the account, the day and what's drawn, so ending the same save on two devices gives the
  same morning. The save holds no random state.
- **Rank-ups show in the morning,** never mid-night. A rank reached tonight already counts for a queued job that starts
  at tonight's boundary, since the date turns after the ranks.
- **The night is one change.** Its steps write nothing on their own; the save is stamped once, with the real time, after
  step 9.
- Ranks, the Dorm, arrivals and the goals are described with the Umas and the farm's progress, and the romance's steps
  in Part 3.

#### The morning summary

After every night a card opens over the farm map, titled with the date ("Morning · Spring 3"). It holds what the night
brought in sections, in order; an empty section is hidden, and a card with nothing in it says "A quiet night." Every
line is a tap to its place.

- **Start the day**, the close button or a drag down puts the card away for good.
- **A tap on a line** opens its place and keeps the card, which comes back on the farm map once no quick look or sheet
  is open.
- **The next night** replaces it.

| Section | Lines | A tap opens |
|---|---|---|
| The bin | Each good and star sold, "Salmon ★2 × 3 · 495g", tagged **In demand** when the season lifted it; then "Total · 545g" | The bin |
| Work done | Jobs that ended tonight, by place, "Forest · 2 jobs done · 9 items" (each job's whole haul); the night's best catch, "Best catch · Rainbow Koi ★2"; plots that turned Ready, by block, "Block A · 9 crops ready"; what withered, "Block A · 3 Onion withered" | The place's quick look; the Fishery's quick look; the Fields |
| Ranks | Rank-ups, "*Name* · Farming Hand", tagged **Rank up**; points that filled tonight with the challenge still to meet, "*Name* · Fishing · Catch 30 fish · 12/30", tagged **Points full** | Her profile's Work side |
| Hearts | Who's Ready for her event (read live, up to three, then "+N more"), the morning's invitation, the house's morning, morning items and night chores, birthdays and anniversaries, levels reached overnight and arrivals ("*Name* arrived · away", tagged **New**), the perks' and side by side's extras, and bond hearts | Her event, her profile, or where the line says |
| New today | "Summer begins"; "Flower Show tomorrow" or "today"; a chapter done, a Farm Rank reached and a Diary milestone, each tagged; the household's milestones, tagged; "Dorm level 2 · 5 beds"; "*Name* is home" | The calendar; the Festival ground; the Diary; the Farm Rank; the household's scene or the homestead; the Dorm |
| Today | "2 Umas idle"; "9 plots to plant" (empty plots that the season's seeds you hold could fill today) | The Hearts tab's Work view; the Fields |

Hearts shows whenever it has a line or someone is Ready. The romance describes its lines.

#### Notifications

The farm sends no notifications. With days as turns nothing finishes while the app is closed, so Account's Notifications
card reads "Off: days are turns".

### The farm map and the bars

#### Home: the farm map

The farm map is Home: 23 places on eight rows of up to three, on farmland, taller than a phone's screen, so it scrolls
up and down. Rows 1 to 5 each run a gathering place, its station, then the ranch or a workshop; rows 6 and 7 are the
yard; row 8 is the town. The help button (bottom left) and the Collect all pill stay put as it scrolls.

The rows, and each place's building and what opens it:

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
| Requests board | `card-library` (borrowed) | Not built yet |
| Gate | `scenario-gate` | Day 1 |
| Shop | `exchange` | Day 1 |
| Festival ground | `racecourse` | Not built yet |
| Expedition post | `rangers-lodge` (borrowed) | Chapter 5 |
<!-- /live -->

What a tap on a place does:

| Place | A tap opens |
|---|---|
| The Fields | Their quick look, which opens the Fields' page |
| The Forest, the Fishery, the Mill, the Sawmill, the Smokehouse | The place's quick look, which opens its page |
| The Shipping bin | The bin's sheet |
| The Shop | The shop's sheet |
| The Warehouse | The Warehouse |
| The Dorm | The Dorm's page |
| The Gate | Its quick look: what brings the next arrivals |
| Every other place | Its quick look: what it is, and what opens it |

**Locks.** A locked place shows a lock, and its quick look says why:
- **Before its rule:** "Opens with Chapter 3", "Opens with Farm Rank 3", "Opens with Chapter 1's reward". A chapter's
  places open once it starts, the Mill once chapter 1 is done, and a Farm Rank's once it's reached. The Forge opens as
  the ring bench the night after the first Romance 8 event ("Opens with your first Romance 8" before that), not with
  chapter 7.
- **"Opens soon":** its rule is met (or it has none) but it has nothing to do: the Coop and the Barn from chapter 2, the
  Requests board and the Festival ground.
- **A station not built** shows locked on the map once its rule is met, and its quick look offers **Build**.

The chapters reach chapter 2, so the places that open with chapter 3 or later (the Mine, the Smelter, the Quarry, the
Cutter, the Kitchen, the Expedition post and the Restaurant) stay locked; the Forge opens early as the ring bench.

**Pips.** A half arch of pips hangs over each work place, one a slot: a working Uma's face ringed by her job's progress
(with her queued jobs counted), a Ready Uma's face, or a free dot. The Fields have one pip a block bought: its tender's
face, ringed by the block's growth toward Ready and marked with the block's letter, or a dot for an untended block. A
Ready Uma's pip carries ♥ wherever the map draws her. A locked place with nobody working shows none.

**Ready.** A place with something to collect says **Ready**: a work place while any of its Umas has finished items, the
Fields while any plot is Ready.

**Collect all.** While anything waits, a floating pill reads "Collect all · 5 ready" (each Uma with finished items, plus
each Ready plot). One tap collects every finished job on the farm into the Warehouse and harvests every Ready plot of
every block, then says "+23 collected" for a moment.

**The help button** says how the farm works in five short lines: a day is a turn; plant, put Umas to work and end the
day; the night settles everything; places open with chapters and the Farm Rank; tap the date for the calendar.

**The morning card** covers the map after each night until you put it away.

**The homestead's rows** sit after the yard (the Farmhouse, each house built and the next lot, three to a row) with the
town row moved below them, so the map grows a row at a time. The Gate is where the cast's Umas arrive. Both are the
romance's.

The HD-2D farm, an opt-in preview set in Account on each device, draws this same farm on an HD-2D stage; it has its own
part.

#### Quick looks

A quick look is a side panel over the map: the place's name, its one-line description, and what you can do there.
- **A locked place:** "Opens with Chapter 3" (or "Opens soon"), and its description.
- **The Fields:** a row a block, **Harvest all** and **Open the Fields** (see The Fields).
- **The Forest, the Fishery and a built station:** its line ("Foraging · 4 slots"), its four slot rows, any stopped
  queues, and **Open the Forest** (see Gathering).
- **A station not built:** what it does, what stands in the way, and **Build** (see The stations).
- **The Gate:** "Umas arrive here." and what brings the next arrivals ("Next: chapter 2's end · the Dorm's level 4"),
  never who, or "Everyone is here."
- **The Forge,** once the ring bench stands: the bench's quick look (see the romance).

#### The top bar

From the left:
- **Your initial** opens Account.
- **The date chip** opens the calendar.
- **The gold chip**, the gold coin and your gold ("Gold: 1,240g. The bin"), opens the shipping bin.
- **The Farm Rank chip**, its crest and the rank ("Farm Rank 2: 300 points"), opens the Farm Rank's sheet.
- **The sync chip** shows only while offline ("Offline") or paused ("Sync paused"), and opens Account.

#### The bottom bar

**Farm · Hearts · End the day · Diary · Menu.**
- **Farm:** the farm map.
- **Hearts:** everyone on the roster, home or away, by their route; its Work view is the roster's album, with their
  talents and ranks. `/roster` lands on the Work view.
- **End the day:** the raised moon disc.
- **Diary:** the chapter, its goals, the Farm Rank, the milestones, each Uma's Memories and the pairs' Conversations.
- **Menu:** every place.

#### The Menu

"Every place" lists the 23 places in six groups (Gathering, Stations, The ranch, Workshops, The yard, The town), each
with its Ready count (the Fields count Ready plots) and locked ones marked; a tap goes where a tap on the map goes. Then
Account, the "Ask before ending the day" switch, and the build's number.

### The Fields

Farming is hands-on. You buy seeds at the shop, tap a plot to plant and tap a Ready plot to harvest. An Uma who tends a
block makes it grow faster and its crops better. Harvests sometimes give seeds back, and every harvest raises the crop's
level on the farm.

```
 the shop ──buy──► seeds at ★1 ──plant, in season──► a growing plot
                                                       │ each night: + its block's rate (1 untended, 1.25–1.9 tended)
                                                       ▼ its growth reaches its days − 0.5
                                                     Ready ──tap──► each crop draws its stars, into the Warehouse
                                                                    crop points +1 (+2 from own seeds)
                                                                    the tender's challenge counts
                                                                    5–35%: an own seed back
                                                                    a regrowing crop starts again at 0, in season
 a season's last night: growing crops that don't grow next season wither; Ready ones wait
```

#### The crops

There are 27 crops: 22 from the shop, and 5 rare ones whose seeds the shop never sells and nothing on the farm hands
out. A crop is planted only in its seasons. In the table, "Shop" is the Farm Rank its seed sells from, "Seed" its price,
and "Days" the nights to Ready untended, with a Novice tender and with an Expert. "Yield" is the crops a plot gives each
harvest, "Regrows" how soon a regrowing crop is Ready again, "Price ★1" what one sells for, and "Refined at" the station
that turns it into a good worth ×1.5.

<!-- live:crops -->
| Crop | Id | Seasons | Shop | Seed | Days: untended · Novice · Expert | Yield | Regrows | Price ★1 | Refined at |
|---|---|---|---|---|---|---|---|---|---|
| Carrot | `carrot` | Spring | Farm Rank 1 | 20g | 4 · 3 · 3 | 1 | — | 60g | — |
| Potato | `potato` | Spring | Farm Rank 1 | 35g | 6 · 5 · 4 | 2 | — | 55g | — |
| Mint | `mint` | Spring | Farm Rank 1 | 40g | 4 · 3 · 3 | 1 | every 3 | 45g | Dried Mint (Sawmill) |
| Onion | `onion` | Spring, Autumn | Farm Rank 2 | 30g | 5 · 4 · 3 | 1 | — | 100g | — |
| Cabbage | `cabbage` | Spring, Winter | Farm Rank 2 | 90g | 8 · 6 · 5 | 1 | — | 260g | — |
| Asparagus | `asparagus` | Spring | Farm Rank 4 | 150g | 10 · 8 · 7 | 1 | — | 480g | — |
| Tomato | `tomato` | Summer | Farm Rank 1 | 50g | 7 · 6 · 5 | 1 | every 3 | 70g | — |
| Basil | `basil` | Summer | Farm Rank 1 | 40g | 4 · 3 · 3 | 1 | every 3 | 45g | Dried Basil (Sawmill) |
| Bell Pepper | `bell-pepper` | Summer | Farm Rank 1 | 60g | 6 · 5 · 4 | 1 | every 3 | 60g | — |
| Eggplant | `eggplant` | Summer | Farm Rank 2 | 70g | 6 · 5 · 4 | 1 | every 4 | 95g | — |
| Sunflower Seed | `sunflower-seed` | Summer | Farm Rank 2 | 70g | 8 · 6 · 5 | 3 | — | 75g | Sunflower Oil (Mill) |
| Corn | `corn` | Summer, Autumn | Farm Rank 4 | 80g | 9 · 7 · 6 | 1 | every 4 | 140g | Cornmeal (Mill) |
| Wheat | `wheat` | Autumn | Farm Rank 1 | 25g | 5 · 4 · 3 | 2 | — | 40g | Wheat Flour (Mill) |
| Peanut | `peanut` | Autumn | Farm Rank 1 | 30g | 4 · 3 · 3 | 2 | — | 35g | Peanut Butter (Mill) |
| Rice | `rice` | Autumn | Farm Rank 1 | 35g | 6 · 5 · 4 | 2 | — | 50g | Polished Rice (Mill) |
| Sugar Beet | `sugar-beet` | Autumn | Farm Rank 2 | 40g | 6 · 5 · 4 | 1 | — | 120g | Beet Sugar (Mill) |
| Emperor Pumpkin | `emperor-pumpkin` | Autumn | Farm Rank 4 | 250g | 10 · 8 · 7 | 1 | — | 600g | — |
| Buckwheat | `buckwheat` | Winter | Farm Rank 1 | 30g | 4 · 3 · 3 | 1 | — | 75g | Buckwheat Flour (Mill) |
| Oats | `oats` | Winter | Farm Rank 1 | 25g | 5 · 4 · 3 | 2 | — | 40g | Rolled Oats (Mill) |
| Barley | `barley` | Winter | Farm Rank 1 | 30g | 5 · 4 · 3 | 2 | — | 45g | Pearl Barley (Mill) |
| Rye | `rye` | Winter | Farm Rank 2 | 40g | 6 · 5 · 4 | 2 | — | 60g | Rye Flour (Mill) |
| Ginger | `ginger` | Winter | Farm Rank 4 | 120g | 9 · 7 · 6 | 2 | — | 200g | Ground Ginger (Sawmill) |
| Golden Carrot | `golden-carrot` | Spring | Rare | — | 6 · 5 · 4 | 1 | — | 600g | — |
| Sunwheat | `sunwheat` | Summer | Rare | — | 7 · 6 · 5 | 2 | — | 260g | Sunwheat Flour (Mill) |
| Moonrice | `moonrice` | Autumn | Rare | — | 7 · 6 · 5 | 2 | — | 240g | Moonrice Flour (Mill) |
| Wild Rice | `wild-rice` | Summer | Rare | — | 6 · 5 · 4 | 2 | — | 160g | Hulled Wild Rice (Mill) |
| Mandrake | `mandrake` | Winter | Rare | — | 8 · 6 · 5 | 1 | — | 520g | Mandrake Powder (Sawmill) |
<!-- /live -->

#### The shop's seeds

The shop sells the season's six seeds: the first three from day 1, the next two from Farm Rank 2 and the last from Farm
Rank 4. A line shut by its rank still shows, with "From Farm Rank 2". The list changes on a season's first day and never
runs out. Onion sells in Spring and Autumn and Cabbage in Spring and Winter; Corn sells in Summer only, though it grows
on into Autumn. Seeds go into the Warehouse at ★1, and never sell at the bin.

The season's seeds by the Farm Rank that opens them:

<!-- live:shop-seeds -->
| Season | Farm Rank 1 | Farm Rank 2 | Farm Rank 4 |
|---|---|---|---|
| Spring | Carrot 20g, Potato 35g, Mint 40g | Onion 30g, Cabbage 90g | Asparagus 150g |
| Summer | Tomato 50g, Basil 40g, Bell Pepper 60g | Eggplant 70g, Sunflower Seed 70g | Corn 80g |
| Autumn | Wheat 25g, Peanut 30g, Rice 35g | Sugar Beet 40g, Onion 30g | Emperor Pumpkin 250g |
| Winter | Buckwheat 30g, Oats 25g, Barley 30g | Rye 40g, Cabbage 90g | Ginger 120g |
<!-- /live -->

#### Blocks

The Fields are four blocks of nine plots. Block A is tilled on day 1. The others are bought on the Fields' page once the
Farm Rank is reached, and come tilled and empty; a block is refused before its rank ("Opens at Farm Rank 2."), when gold
is short, and once it's yours.

The blocks, what opens each and what it costs:

<!-- live:blocks -->
| Block | Plots | Opens at | Costs |
|---|---|---|---|
| A | 9 | Day 1 | — |
| B | 9 | Farm Rank 2 | 800g |
| C | 9 | Farm Rank 4 | 3,000g |
| D | 9 | Farm Rank 6 | 8,000g |
<!-- /live -->

#### Planting

- **One plot:** tap an empty plot, then a seed. A seed plants only in its crop's seasons ("Tomato grows in Summer."),
  and leaves the Warehouse.
- **Plant all:** fills every empty plot of a block with one crop, your own seeds first and then the shop's, until the
  plots or the seeds run out.
- **Own seeds** come back from harvests and are kept apart from the shop's. A plot planted from own seeds carries a
  green dot, and its harvests raise the crop's level twice as fast.
- **The first planting** of a crop adds it to the farm's crops at level 1.

#### Tending

A block's tender is an Uma who stays on it, night after night, until you move her. Each block takes one tender.

- **Who may tend:** an Uma on the farm with no running job who isn't leaving tomorrow on a swap ("She isn't on the
  farm.", "She's working.", "She leaves tomorrow."). Picking the tender of another block moves her.
- **Busy both ways:** a tender can't take a job anywhere ("She tends Block A."), and an Uma with a running job can't
  tend.
- **She works a night only while her block has a growing plot.** Then she earns a day of farming rank points and has
  work for the nudge. Tending an empty or all-Ready block is idle.
- **Her farming rank and talent** set her block's growth, its crops' stars and its chance of seeds back.

**Growth a night:** untended, **1**; tended, **(her rank's rate + her talent's) × the Watering Can × 1.25 while she's
well fed**.

| Term | Values |
|---|---|
| Her rank's rate | Novice 1.25, Hand 1.35, Skilled 1.45, Expert 1.55, Master 1.65, Legend 1.75 |
| Her farming talent | +0.05 at B, +0.10 at A, +0.15 at S; nothing below B |
| The Watering Can | +10% a tier above Basic |
| Well fed | ×1.25 |

A crop turns **Ready once its growth reaches its days − 0.5**, so tending rounds to the nearest night: a 4-day Carrot
takes 4 nights untended and 3 tended; a 10-day Asparagus takes 8 with a Novice and 7 with an Expert. Growth is kept to a
millionth, so 3 × 1.35 reaches 4.05.

Every farm has Basic tools, and nothing on the farm upgrades them, so the Watering Can and the Hoe add nothing in play.

Growth by the tender's rank and talent, the stars a D tender's harvests draw at crop level 1, and the chance of seeds
back:

<!-- live:tending -->
| Tender | Growth, G | Growth, D | Growth, C | Growth, B | Growth, A | Growth, S | Stars, a D tender | Seeds back |
|---|---|---|---|---|---|---|---|---|
| Untended | 1 | 1 | 1 | 1 | 1 | 1 | ★1 100% | 5% |
| Novice | 1.25 | 1.25 | 1.25 | 1.3 | 1.35 | 1.4 | ★1 75%, ★2 25% | 10% |
| Hand | 1.35 | 1.35 | 1.35 | 1.4 | 1.45 | 1.5 | ★1 25%, ★2 75% | 15% |
| Skilled | 1.45 | 1.45 | 1.45 | 1.5 | 1.55 | 1.6 | ★2 75%, ★3 25% | 20% |
| Expert | 1.55 | 1.55 | 1.55 | 1.6 | 1.65 | 1.7 | ★2 25%, ★3 75% | 25% |
| Master | 1.65 | 1.65 | 1.65 | 1.7 | 1.75 | 1.8 | ★3 75%, ★4 25% | 30% |
| Legend | 1.75 | 1.75 | 1.75 | 1.8 | 1.85 | 1.9 | ★3 25%, ★4 75% | 35% |
<!-- /live -->

#### Harvesting

Tap a Ready plot to harvest it. **Harvest all** does a block on the Fields' page, and every block in the quick look and
with Collect all.

- **Each crop draws its own stars.** A plot gives its yield in crops, and each draws its stars from the harvest's
  quality points.
- **Quality, tended:** her rank (+0.5 a rank, Novice 0 to Legend 2.5), her talent (G −0.75 to S +1, D 0), +0.25 for
  being tended, the crop's level (+0.1 a level above 1), the Hoe (+0.25 a tier above Basic) and +0.25 while she's well
  fed.
- **Quality, untended:** only the crop's level and the Hoe. At crop level 1 that's always ★1.
- **The tender at harvest counts.** Stars, seeds back and the challenge read whoever tends the block when you harvest,
  not who tended it as it grew; a block with nobody on it harvests untended.
- **Seeds back:** each harvested plot may drop one own seed of its crop: 5% untended; tended, 10% at Novice and +5% a
  rank (35% at Legend); and +5% a Hoe tier above Basic either way.
- **Crop points:** each harvested plot adds 1 point to its crop, or 2 if it was planted from own seeds.
- **The challenge:** the crops harvested count toward the tender's next farming rank's challenge (below).
- **The note** says what came home: "+9 Carrot (★1 × 7, ★2 × 2) · 1 seed back".
- **Every draw is seeded** by the account, the day and the plot, so a harvest replays the same on every device.
- The farm counts plots planted and harvested for the chapters' goals.

#### Regrowing

Mint, Tomato, Basil and Bell Pepper regrow every 3 days, Eggplant and Corn every 4. After a harvest the plot keeps its
crop and starts again from 0, turning Ready at its regrow days − 0.5 at the block's rate, so tending speeds regrowth
too. It keeps its seed's kind, own or the shop's, for its crop points. Out of its season a regrowing crop doesn't start
again: a Ready Tomato harvested on Autumn 1 leaves the plot empty.

#### Withering

On a season's last night, after the night's growth and before the date turns, every crop still growing (a regrowing one
too) that doesn't grow in the next season withers, and its plot empties. Ready crops never wither: they wait to be
harvested. Only Corn (Summer into Autumn) and Cabbage (Winter into Spring) carry over. Onion grows in Spring and Autumn,
which don't meet, so a growing Onion withers at the end of both. On a season's last day the Fields mark each plot that
won't be Ready by the morning and will wither: "Withers tonight".

#### Crop levels

Each crop has a level from 1 to 10 on the farm, from its crop points. Going from level *L* to *L* + 1 takes 20 × *L*
points, and each level above 1 adds +0.1 quality to the crop's harvests, tended or not. A harvest's stars use the crop's
level before its own points are added.

The points each level starts at, and its quality:

<!-- live:crop-levels -->
| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 20 | 60 | 120 | 200 | 300 | 420 | 560 | 720 | 900 |
| Quality | +0 | +0.1 | +0.2 | +0.3 | +0.4 | +0.5 | +0.6 | +0.7 | +0.8 | +0.9 |
<!-- /live -->

#### Farming's challenges

Each farming rank needs its points and its challenge. The challenge counts at harvest, for the block's tender, from her
last rank-up, and stops at its target; "crops" are crops harvested, not plots, so a Potato plot counts 2. The rank-up
itself comes at night. Ranks are described with the Umas and the farm's progress.

The challenge toward each farming rank:

<!-- live:farming-challenges -->
| Toward | Challenge | Counted |
|---|---|---|
| Hand | Harvest 30 crops she tended | At harvest, for the tender |
| Skilled | 40 crops of ★3+ she tended | At harvest, for the tender |
| Expert | Tend a crop of level 4+ to harvest | At harvest, for the tender |
| Master | 30 crops of ★5 | At harvest, for the tender |
| Legend | 1st at a Flower Show with a crop she tended | A festival win (festivals aren’t built yet) |
<!-- /live -->

The Legend challenge can't be met while festivals are dates only.

#### The Fields at night

- **Step 2:** every planted plot that isn't Ready grows by its block's rate tonight; one that reaches its days − 0.5
  turns Ready. Ready plots stop growing and wait. A tender whose block had a growing plot worked the night.
- **Step 7:** on a season's last night, crops that don't grow next season wither.
- **The morning** lists plots that turned Ready by block ("Block A · 9 crops ready"), then what withered ("Block A · 3
  Onion withered"), each opening the Fields; and under Today, "9 plots to plant" while seeds you hold for the season
  could fill empty plots.

#### The Fields' screens

- **The quick look:** a row a block, with its tender's face (a dash untended, a lock for a block not bought) and its
  line: "9 growing · ready in 2 nights", "3 ready", "Empty", or a block not bought's "Farm Rank 2 · 800g". Under them,
  **Harvest all · 3** (every block) and **Open the Fields**.
- **The Fields' page:** four block cards, A to D.
  - **A block you own:** "Block A" and "Tended · 1.25 a night" or "Untended · 1 a night"; **Plant all** while a plot is
    empty and **Harvest all · 3** while one is Ready; its tender's row (face, name, "Hand · B · Farming") with **Stop**
    and **Change**, or "No tender · Grows 1 a night, at ★1" with **Tend**; and its 3 × 3 plots.
  - **A plot:** empty (a dashed "+": a tap plants), growing (the crop, "2 nights" and a growth bar, or "Withers
    tonight": a tap shows it), or Ready (a tap harvests). A green dot marks own seeds.
  - **A block not bought:** "Opens at Farm Rank 2", "Need 300g more" or "9 plots", with **Buy · 800g**.
- **The plant sheet:** each seed you hold that plants today, own seeds first, with its count, "Ready in 4 nights
  untended", its yield and its regrowth. Plant all lists each crop with all its seeds. With none: "No seeds for Spring."
  and **Shop**.
- **A growing plot's sheet:** the crop; "Ready in 2 nights" (or "Withers tonight", with why); the block and plot,
  "regrowing" and "own seeds" when so; who tends it and the block's rate; its yield and regrowth.
- **The tender's picker:** the Umas on the farm, each with her farming rank and talent ("Hand · B"), or "Tends Block B"
  or "Leaves tomorrow", free ones first, then by farming. A working Uma shows "Working" and can't be picked.
- **The help (i)** says how the Fields work in five lines.

#### The romance in the Fields

The romance adds to the Fields; its perks and bonds are the romance's.
- **Side by side:** a tended block grows ×1.1 while its tender has a partner she has 3+ bond hearts with tending another
  block that has a growing plot (×1.2 for a farmer in her element, at Friendship 8). Its card adds "· side by side", and
  its plots' nights left count it.
- **Night chores:** each of a farmer's chores adds +0.25 growth tonight to the untended block with the most growing
  plots, else to her own while it grows; the morning says "Night chores · +0.5 growth".
- **An extra crop:** each harvested plot of a tended block has a chance of one more crop at the plot's stars, equal to
  the romance term on its tender's work there (held to 40%). The note says "· 1 from perks". An untended harvest gets
  none.
- **Her keepsake** (Friendship 10): +0.25 quality on her block's harvests when the Fields are her line's place (+0.5
  from Spouse 5).
- **Praise:** a ★3+ crop from the block she tends earns her praise for the day.
- **Bonds:** two tenders earn bond points together at night, the Fields counting as one place.
- **A spouse in her house** is on the farm, so she may tend.

### Gathering

The forest and the Fishery are where Umas go for days at a time. Each day of a job brings home a haul, ready the next
morning, and an Uma's rank opens deeper places, whose goods are worth more.

```
 the job sheet: Who ──► Where (her rank opens it) ──► How many days (1–4)
     │ planned at the start: each day's items = round(base × rank × talent × tool × well fed),
     │ each good and its stars drawn
     ▼
 the night: a day's haul is done ──► it counts toward her challenge; the best catch is noted
     ▼
 the morning: Ready ──Collect──► the Warehouse at its stars; each fish measured: "+5 · ★1 × 4, ★2 × 1"
```

#### A gathering job

- **A job is 1 to 4 days** at one forest area or one fishing spot, in one of the place's four slots. Up to three more
  jobs can queue behind it at the same place.
- **The haul is planned when the job starts:** each day's items from her rank, talent, tool and well-fed days as they
  stand then, each good and its stars drawn and seeded by the account and the day, so the same save always plans the
  same haul. A rank-up mid-job doesn't change it. A queued job is planned when it starts, at the night's boundary, with
  that night's ranks.
- **Each day's haul is ready the next morning**, and can be collected while the job runs on.
- **Her rank opens deeper places:** an area or spot her rank hasn't opened is refused ("Opens at Hand."). The sea's two
  spots also wait for chapter 7 ("Opens with Chapter 7.") and the Deep Sea for the boat ("Needs the boat."), so the five
  freshwater spots are the ones in play.
- **Who may go:** an Uma on the farm who isn't tending a block ("She tends Block A."), isn't leaving tomorrow, and isn't
  busy ("She is busy for another 2 days.").
- **Starting a job** for an Uma with finished work collects it first.
- **Repeat** starts her last job again this morning, in her slot or another free one there; on a finished job it
  collects and repeats in one tap.
- **Recall** collects what's finished, ends her job and drops her queue; she's free at once, and Repeat won't restart a
  recalled job.
- **A stopped queue:** when a queued job can't start, the rest of the queue stops and shows as a card ("Forest · stopped
  yesterday") with Restart and Dismiss.
- **A day at the forest** earns foraging rank points, a day at the Fishery fishing points.

#### The forest's areas

Six areas, each yielding its family's two grades about 65/35: woods 40%, mushrooms 30%, herbs and spices 15%, and the
season's family 15% (Spring sweets, Summer fruits, Autumn nuts and seeds, Winter more mushrooms). Seven crops are forest
goods too (Basil, Mint, Ginger, Mandrake, Peanut, Sunflower Seed and Sugar Beet): gathered, each is the same good as
harvested, at the crop's price.

Each area's rank, grades and goods by season, with their shares:

<!-- live:forest-areas -->
| Area | Id | Opens at | Grades | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|---|
| The Woods | `woods` | Novice | G1–G2 | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Honeycomb 10%, Mint 5%, Sugarcane 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Apple 10%, Mint 5%, Pear 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Peanut 10%, Mint 5%, Sunflower Seed 5% | Button Mushroom 29%, Pine Log 26%, Shiitake 16%, Birch Log 14%, Basil 10%, Mint 5% |
| The Hills | `hills` | Hand | G3–G4 | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sugar Beet 10%, Thyme 5%, Maple Sap 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Peach 10%, Thyme 5%, Plum 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sesame 10%, Thyme 5%, Walnut 5% | Oyster Mushroom 29%, Cedar Log 26%, Enoki 16%, Maple Log 14%, Rosemary 10%, Thyme 5% |
| The Old Forest | `old-forest` | Skilled | G4–G5 | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Maple Sap 10%, Ginger 5%, Cacao Pod 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Plum 10%, Ginger 5%, Orange 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Walnut 10%, Ginger 5%, Chestnut 5% | Enoki 29%, Maple Log 26%, Chanterelle 16%, Oak Log 14%, Thyme 10%, Ginger 5% |
| The Mountain | `mountain` | Expert | G6–G7 | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Vanilla Pod 10%, Cinnamon 5%, Agave Heart 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Grape 10%, Cinnamon 5%, Mango 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Almond 10%, Cinnamon 5%, Pistachio 5% | Porcini 29%, Cherry Log 26%, Morel 16%, Mahogany Log 14%, Peppercorn 10%, Cinnamon 5% |
| The Misty Vale | `misty-vale` | Master | G8–G9 | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Palm Sap 10%, Mandrake 5%, Fairy Honeycomb 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Pomegranate 10%, Mandrake 5%, Starpeach 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Macadamia 10%, Mandrake 5%, Thundernut 5% | Truffle 29%, Ebony Log 26%, Glowcap 16%, Elderwood Log 14%, Saffron 10%, Mandrake 5% |
| The World Tree | `world-tree` | Legend | G9–G10 | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Fairy Honeycomb 10%, Phoenix Pepper 5%, Ambrosia Blossom 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Starpeach 10%, Phoenix Pepper 5%, Golden Apple 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Thundernut 10%, Phoenix Pepper 5%, Worldseed 5% | Glowcap 29%, Elderwood Log 26%, King Reishi 16%, Yggdrasil Branch 14%, Mandrake 10%, Phoenix Pepper 5% |
<!-- /live -->

#### The Fishery's spots

Seven spots, each with its fish by season and their shares:

<!-- live:fishing-spots -->
| Spot | Id | Opens at | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|
| The Pond | `pond` | Novice | Carp 60%, Trout 40% | Carp 98%, Rainbow Koi 2% | Carp 60%, Trout 40% | Carp 70%, Trout 30% |
| The River | `river` | Hand | Trout 40%, Carp 20%, Salmon 40% | Eel 40%, Trout 40%, Carp 20% | Salmon 50%, Trout 50% | Trout 60%, Salmon 20%, Carp 20% |
| The Lake | `lake` | Skilled | Salmon 50%, Trout 20%, Eel 30% | Eel 50%, Salmon 47%, Rainbow Koi 3% | Salmon 50%, Eel 30%, Silverfin 20% | Silverfin 20%, Trout 30%, Salmon 50% |
| The Falls | `falls` | Expert | Eel 50%, Salmon 25%, Silverfin 20%, Rainbow Koi 5% | Eel 60%, Silverfin 30%, Rainbow Koi 10% | Silverfin 30%, Salmon 40%, Eel 25%, Rainbow Koi 5% | Silverfin 40%, Trout 50%, Rainbow Koi 10% |
| The Moon Pool | `moon-pool` | Legend | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% |
| The Sea Pier | `sea-pier` | Hand + chapter 7 | Sardine 60%, Sea Bream 40% | Sardine 50%, Mackerel 20%, Sea Bream 30% | Mackerel 60%, Sea Bream 40% | Mackerel 70%, Sardine 30% |
| The Deep Sea | `deep-sea` | Master + chapter 7 + the boat | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 30%, Sea Bream 10% | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 40% |
<!-- /live -->

#### What a day brings home

Items a day = round(base × rank × talent × tool × well fed), rounded half up and never below 1. The base is 5 in the
forest and 3 at the Fishery; the tool is the Axe in the forest and the Rod at the Fishery, every one Basic today; well
fed counts on each day she's well fed.

The factors:

<!-- live:haul-factors -->
| Factor | Values |
|---|---|
| Base, at Novice | The forest 5, the Fishery 3 |
| Rank | ×1 · ×1.15 · ×1.3 · ×1.5 · ×1.7 · ×2 |
| Talent, G → S | ×0.85 · ×0.9 · ×0.95 · ×1 · ×1.05 · ×1.1 · ×1.15 · ×1.2 |
| Tool (the Axe, the Rod), Basic → Mythril | ×1 · ×1.15 · ×1.3 · ×1.45 · ×1.6 |
| Well fed | ×1.25 |
<!-- /live -->

Items a day with the Basic tool, by rank and talent:

<!-- live:haul-day -->
| Rank | Yield | Forest D | Forest C | Forest S | Fishery D | Fishery C | Fishery S | Forest C, well fed |
|---|---|---|---|---|---|---|---|---|
| Novice | ×1 | 5 | 5 | 6 | 3 | 3 | 4 | 7 |
| Hand | ×1.15 | 6 | 6 | 7 | 3 | 4 | 4 | 8 |
| Skilled | ×1.3 | 7 | 7 | 8 | 4 | 4 | 5 | 9 |
| Expert | ×1.5 | 8 | 8 | 9 | 5 | 5 | 5 | 10 |
| Master | ×1.7 | 9 | 9 | 10 | 5 | 5 | 6 | 11 |
| Legend | ×2 | 10 | 11 | 12 | 6 | 6 | 7 | 13 |
<!-- /live -->

Worked: a Novice C forager in the Woods brings round(5 × 1 × 1.05) = **5** a day; a Hand C angler at the River brings
round(3 × 1.15 × 1.05) = **4**.

#### Stars

Every gathered good draws its own stars from her quality points: +0.5 a rank (Novice 0 to Legend 2.5), her talent (G
−0.75 to S +1, D 0), +0.25 a tool tier above Basic, and +0.25 on a day she's well fed. How stars are drawn is under
Goods and gold.

Quality and stars by rank, with the Basic tool:

<!-- live:gather-quality -->
| Rank | Q at D | Q at C | Q at S | Stars at C | Stars at C, well fed |
|---|---|---|---|---|---|
| Novice | 0 | 0.25 | 1 | ★1 75%, ★2 25% | ★1 50%, ★2 50% |
| Hand | 0.5 | 0.75 | 1.5 | ★1 25%, ★2 75% | ★2 100% |
| Skilled | 1 | 1.25 | 2 | ★2 75%, ★3 25% | ★2 50%, ★3 50% |
| Expert | 1.5 | 1.75 | 2.5 | ★2 25%, ★3 75% | ★3 100% |
| Master | 2 | 2.25 | 3 | ★3 75%, ★4 25% | ★3 50%, ★4 50% |
| Legend | 2.5 | 2.75 | 3.5 | ★3 25%, ★4 75% | ★4 100% |
<!-- /live -->

#### Well fed

Well fed is a number of days on an Uma. It counts down by one each night, and a new meal only raises it to the meal's
own length; it never stacks.

| Where | Well fed gives |
|---|---|
| A gathering job | ×1.25 items and +0.25 quality on each day of the job she'll be well fed, counted from its start |
| A 1-day station job | ×1.25 her rate on each day she'll be well fed |
| A multi-day job (the Mill's preserves) | A quarter day a night: each night she's well fed, her running job moves a quarter day further, so more of the batch is done each morning and four such nights save a day |
| A tended block | ×1.25 growth on a night she's well fed, and +0.25 quality on a harvest while she is |
| Rank points | ×1.25 on a day she's well fed |

A wedding's reception and a spouse's breakfast feed the Umas (the romance's); nothing else does yet.

#### Collecting

- **Collect** (a slot's button, **Collect here** on the page, or **Collect all** on the map) puts her finished goods in
  the Warehouse at their stars and says what came home: "+5 · ★1 × 4, ★2 × 1". Finished goods wait as long as you like.
- **Her slot frees** once her job is over and collected.
- **The farm counts** what comes home from the forest and the Fishery, for the chapters' goals.
- **The Diary** pays 500g the first time a haul comes from each area past the Woods and each spot past the Pond, on the
  night the haul is done.

#### Catch sizes and records

Each fish is measured when it's collected:

- **Size** = min + (max − min) × u^(8 ÷ k), in cm to a tenth.
- **k** = 1 + 0.25 × her fishing rank (Novice 0 to Legend 5) + 0.1 × her fishing talent's step (G 0 to S 7) + 0.05 × the
  Rod's tier, all as they stand at the collect. A rank-up before you collect lands bigger fish.
- **u** is seeded by the account, the collect's day, the Uma and the fish's place in the farm's catches, so the same
  collect always measures the same.
- **Records:** the farm keeps the biggest of each kind. The collect's note names the biggest fish it brought, "Carp 41.2
  cm, a record" when it beats the farm's record. No screen lists the records.

Each fish's size range, its price and its fillet's:

<!-- live:fish-sizes -->
| Fish | Id | Size | Price ★1 | At the Smokehouse | Price ★1 |
|---|---|---|---|---|---|
| Carp | `carp` | 20–60 cm | 40g | Carp Fillet | 60g |
| Trout | `trout` | 25–70 cm | 50g | Trout Fillet | 75g |
| Sardine | `sardine` | 12–25 cm | 65g | Sardine Fillet | 100g |
| Mackerel | `mackerel` | 25–50 cm | 85g | Mackerel Fillet | 130g |
| Salmon | `salmon` | 50–120 cm | 110g | Salmon Fillet | 165g |
| Sea Bream | `sea-bream` | 30–70 cm | 145g | Sea Bream Fillet | 220g |
| Eel | `eel` | 40–120 cm | 180g | Eel Fillet | 270g |
| Tuna | `tuna` | 80–250 cm | 235g | Tuna Fillet | 355g |
| Silverfin | `silverfin` | 40–90 cm | 300g | Silverfin Fillet | 450g |
| Rainbow Koi | `rainbow-koi` | 40–100 cm | 390g | Rainbow Koi Fillet | 585g |
<!-- /live -->

Better anglers land bigger fish: u^(8 ÷ k) leans small, less so as k grows. Her k by rank and talent, and the average
catch it gives:

<!-- live:size-skill -->
| Rank | k at D | k at C | k at S | Average at C | A Carp at C, on average |
|---|---|---|---|---|---|
| Novice | 1.35 | 1.45 | 1.75 | 15% | 26.1 cm |
| Hand | 1.6 | 1.7 | 2 | 18% | 27.0 cm |
| Skilled | 1.85 | 1.95 | 2.25 | 20% | 27.8 cm |
| Expert | 2.1 | 2.2 | 2.5 | 22% | 28.6 cm |
| Master | 2.35 | 2.45 | 2.75 | 23% | 29.4 cm |
| Legend | 2.6 | 2.7 | 3 | 25% | 30.1 cm |
<!-- /live -->

#### The night's hauls

- **Step 4** reads every day's haul that finished tonight.
- **Each haul counts toward its Uma's next rank's challenge,** items in an area for foraging and fish at a spot for
  fishing, whether or not it's collected. Each challenge reads only what it asks: "Catch 10 fish at the River" counts
  the River's. They count before step 6, so a challenge met tonight ranks her up tonight.
- **The best catch** is the most valuable fish caught tonight at its stars (out of demand; more stars on a tie): the
  morning's "Best catch · Rainbow Koi ★2", which opens the Fishery's quick look.
- **Work done** lists the jobs that ended tonight by place, "Forest · 1 job done · 5 items", with each job's whole haul.
  A job still running isn't listed, though its day's haul is ready to collect.

#### The forest's and the Fishery's screens

- **The quick look:** "Foraging · 4 slots" (or "Fishing · 4 slots"), the four slot rows (a free one opens the job
  sheet), any stopped queues, and **Open the Forest**.
- **The page:** its line and **Collect here** while anything's ready; the four slot rows with Collect, Repeat, the queue
  and Recall; stopped queues; and the job sheet.
  - **Who:** the Umas on the farm, each with her rank and talent in the activity ("Hand · B"), free ones first, then by
    rank. A tender shows "Tends Block A" and an Uma leaving tomorrow "Leaves tomorrow", and neither can be picked. With
    nobody free: "No Uma is free."
  - **Where:** every area or spot with this season's goods, those her rank hasn't opened greyed ("From Hand", "Chapter
    7"), each with "About 5 a day" for her and, in the forest, its grades ("G1–G2"). It opens on the deepest place she
    can go.
  - **How many:** in days, as her haul after 1, 2, 3 or 4 days ("×5 · 1 day", "×10 · 2 days"), with "10 to bring home".
- **Days, never hours:** what's left ("Tomorrow", "In 2 days"), a job's length ("1 day"), a stopped queue's age ("Forest
  · stopped yesterday").
- **The help (i)** says how the place works in four or five lines.

#### The romance in gathering

- **Her keepsake** (Friendship 10) adds +0.25 quality to a haul at her line's place as it's planned (+0.5 from Spouse
  5). A forager's line is the forest and the Sawmill, a fisher's the Fishery and the Smokehouse.
- **Side by side's extras:** at night, an Uma whose work finished items tonight where a partner she has 3+ bond hearts
  with also worked today gets 10% of them again (20% in her element), as seeded copies straight into the Warehouse.
  Stations count too.
- **The perks' extras:** a share of the same items by the romance term (held to 40%, and lifted by side by side's factor
  where it applies), as their own copies.
- **Night chores:** a forager brings one item a chore from her deepest open area this season, a fisher one fish from her
  deepest open spot, at a day's haul's stars, straight into the Warehouse (1 chore from Friendship 6, 2 from Romance 7,
  3 from Spouse 4).
- **The planned hauls are untouched;** the morning's Hearts section says "Side by side · +3 items", "Perks · +2 items"
  and "Night chores · 3 items". The perks are the romance's.

### The stations

A station turns one raw good into its refined form, one for one, keeping its stars; the refined good sells for ×1.5.
Three stations work: the Mill beside the Fields, the Sawmill beside the Forest and the Smokehouse beside the Fishery.
The Smelter and the Cutter stand beside the Mine and the Quarry, but open with chapter 3 and have no jobs.

#### Building a station

A station is locked until built. The Mill needs its plans, chapter 1's reward; the Sawmill and the Smokehouse need Farm
Rank 3. Once that's met, its quick look and its page offer **Build** for its gold ("Need 300g more" when short). A
station is built once: it has four slots and no upgrades.

Each station's place, the rank it uses, its cost, what opens it and its jobs:

<!-- live:stations -->
| Station | At | Rank used | Builds for | Opens | Jobs |
|---|---|---|---|---|---|
| Mill | Fields | Farming | 1,200g | Its plans: chapter 1’s reward | Flour (1 day): grains · Sugars and oils (1 day): sweets, nuts and seeds · Preserves (2 days): fruits |
| Sawmill | Forest | Foraging | 1,500g | Farm Rank 3 | Planks (1 day): woods · Drying (1 day): mushrooms, herbs and spices |
| Smokehouse | Fishery | Fishing | 2,000g | Farm Rank 3 | Smoking (1 day): fish |
<!-- /live -->

#### Station jobs and rates

- **A job is items:** one output at one star, 1 to 100 of them, each taking one of its raw good at the same stars. The
  inputs leave the Warehouse when the job starts; a job bigger than the Warehouse holds is refused ("Short 3 Pine
  Log."). **Recall** collects what's made and gives back the inputs of everything not yet made.
- **Her rate** is round(8 × her rank × her talent × well fed) items a day, rounded half up, from her rank and talent in
  the station's activity: farming at the Mill, foraging at the Sawmill, fishing at the Smokehouse. A day at a station
  earns that activity's rank points.
- **Days:** a 1-day job fills each day at that day's rate (10 logs at 10 a day is 1 day; 12 is 2 days), each day's batch
  ready the next morning. Preserves take at least 2 days: the batch spreads evenly over the larger of 2 and ⌈items ÷ her
  rate⌉ days.
- **Well fed** lifts a 1-day job's rate ×1.25 on her well-fed days; the preserves gain a quarter day a night instead.
- **Queues** work as at the forest: a queued job takes its inputs when it starts, and if the Warehouse can't cover it
  then, the queue stops.
- **Work done** in the morning counts a station's jobs that ended tonight, like the forest's.

Items a day by rank and talent:

<!-- live:station-day -->
| Rank | D | C | S | C, well fed |
|---|---|---|---|---|
| Novice | 8 | 8 | 10 | 11 |
| Hand | 9 | 10 | 11 | 12 |
| Skilled | 10 | 11 | 12 | 14 |
| Expert | 12 | 13 | 14 | 16 |
| Master | 14 | 14 | 16 | 18 |
| Legend | 16 | 17 | 19 | 21 |
<!-- /live -->

Worked: a Hand C forager saws round(8 × 1.15 × 1.05) = **10** logs a day, and ★3 logs make ★3 planks.

#### The stations' screens

- **Not built:** the quick look and the page say what it does ("Turns logs, mushrooms or herbs into goods worth half
  again as much, keeping their stars."), what stands in the way ("Needs its plans: chapter 1's reward.", "Opens at Farm
  Rank 3.", "Need 300g more.") and **Build · 1,500g**.
- **Built:** it works like the forest, with its line ("Foraging · 4 slots"), the slot rows, **Collect here**, stopped
  queues and the job sheet.
- **What:** its jobs ("Planks", "Drying"), each with what the Warehouse holds for it at each star ("Pine Plank ★3 · 12
  held"). With nothing: "Nothing to process yet: bring logs, mushrooms or herbs home first." (the Mill asks for grain,
  sweets, nuts or fruit, the Smokehouse for fish).
- **How many:** a day's batch at her rate ("×8 · 1 day"; the preserves' two days), twice that, and all held, at most
  100, with "8 to make".
- **The help (i)** says how it works in three or four lines.

#### Recipes

The vegetables have no station. Each job's recipes, by grade, with their ★1 prices in and out:

<!-- live:station-recipes -->
##### Flour (Mill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Wheat | 40g | Wheat Flour | 60g |
| G2 | Oats | 40g | Rolled Oats | 60g |
| G3 | Barley | 45g | Pearl Barley | 70g |
| G4 | Rice | 50g | Polished Rice | 75g |
| G5 | Corn | 140g | Cornmeal | 210g |
| G6 | Rye | 60g | Rye Flour | 90g |
| G7 | Buckwheat | 75g | Buckwheat Flour | 115g |
| G8 | Wild Rice | 160g | Hulled Wild Rice | 240g |
| G9 | Moonrice | 240g | Moonrice Flour | 360g |
| G10 | Sunwheat | 260g | Sunwheat Flour | 390g |

##### Sugars and oils (Mill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Peanut | 35g | Peanut Butter | 55g |
| G2 | Sunflower Seed | 75g | Sunflower Oil | 115g |
| G3 | Sesame | 50g | Sesame Paste | 75g |
| G4 | Walnut | 65g | Walnut Paste | 100g |
| G5 | Chestnut | 85g | Chestnut Paste | 130g |
| G6 | Almond | 110g | Almond Paste | 165g |
| G7 | Pistachio | 140g | Pistachio Paste | 210g |
| G8 | Macadamia | 180g | Macadamia Butter | 270g |
| G9 | Thundernut | 230g | Thundernut Oil | 345g |
| G10 | Worldseed | 300g | Worldseed Oil | 450g |
| G1 | Honeycomb | 35g | Honey | 55g |
| G2 | Sugarcane | 45g | Cane Sugar | 70g |
| G3 | Sugar Beet | 120g | Beet Sugar | 180g |
| G4 | Maple Sap | 70g | Maple Syrup | 105g |
| G5 | Cacao Pod | 95g | Chocolate | 145g |
| G6 | Vanilla Pod | 120g | Vanilla Extract | 180g |
| G7 | Agave Heart | 155g | Agave Syrup | 235g |
| G8 | Palm Sap | 200g | Palm Sugar | 300g |
| G9 | Fairy Honeycomb | 255g | Fairy Honey | 385g |
| G10 | Ambrosia Blossom | 330g | Ambrosia | 495g |

##### Preserves (Mill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Apple | 35g | Apple Preserve | 55g |
| G2 | Pear | 45g | Pear Preserve | 70g |
| G3 | Peach | 55g | Peach Preserve | 85g |
| G4 | Plum | 70g | Plum Preserve | 105g |
| G5 | Orange | 95g | Orange Marmalade | 145g |
| G6 | Grape | 120g | Grape Jelly | 180g |
| G7 | Mango | 155g | Mango Pulp | 235g |
| G8 | Pomegranate | 200g | Pomegranate Molasses | 300g |
| G9 | Starpeach | 255g | Starpeach Nectar | 385g |
| G10 | Golden Apple | 330g | Golden Apple Preserve | 495g |

##### Planks (Sawmill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Pine Log | 25g | Pine Plank | 40g |
| G2 | Birch Log | 30g | Birch Plank | 45g |
| G3 | Cedar Log | 40g | Cedar Plank | 60g |
| G4 | Maple Log | 50g | Maple Plank | 75g |
| G5 | Oak Log | 70g | Oak Plank | 105g |
| G6 | Cherry Log | 90g | Cherry Plank | 135g |
| G7 | Mahogany Log | 110g | Mahogany Plank | 165g |
| G8 | Ebony Log | 145g | Ebony Plank | 220g |
| G9 | Elderwood Log | 185g | Elderwood Plank | 280g |
| G10 | Yggdrasil Branch | 240g | Yggdrasil Plank | 360g |

##### Drying (Sawmill)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Basil | 45g | Dried Basil | 70g |
| G2 | Mint | 45g | Dried Mint | 70g |
| G3 | Rosemary | 45g | Dried Rosemary | 70g |
| G4 | Thyme | 60g | Dried Thyme | 90g |
| G5 | Ginger | 200g | Ground Ginger | 300g |
| G6 | Peppercorn | 100g | Ground Pepper | 150g |
| G7 | Cinnamon | 125g | Ground Cinnamon | 190g |
| G8 | Saffron | 160g | Saffron Threads | 240g |
| G9 | Mandrake | 520g | Mandrake Powder | 780g |
| G10 | Phoenix Pepper | 270g | Phoenix Spice | 405g |
| G1 | Button Mushroom | 30g | Dried Button Mushroom | 45g |
| G2 | Shiitake | 40g | Dried Shiitake | 60g |
| G3 | Oyster Mushroom | 50g | Dried Oyster Mushroom | 75g |
| G4 | Enoki | 65g | Dried Enoki | 100g |
| G5 | Chanterelle | 85g | Dried Chanterelle | 130g |
| G6 | Porcini | 110g | Dried Porcini | 165g |
| G7 | Morel | 140g | Dried Morel | 210g |
| G8 | Truffle | 180g | Shaved Truffle | 270g |
| G9 | Glowcap | 230g | Glowcap Powder | 345g |
| G10 | King Reishi | 300g | Reishi Powder | 450g |

##### Smoking (Smokehouse)

| Grade | In | ★1 | Out | ★1 |
|---|---|---|---|---|
| G1 | Carp | 40g | Carp Fillet | 60g |
| G2 | Trout | 50g | Trout Fillet | 75g |
| G3 | Sardine | 65g | Sardine Fillet | 100g |
| G4 | Mackerel | 85g | Mackerel Fillet | 130g |
| G5 | Salmon | 110g | Salmon Fillet | 165g |
| G6 | Sea Bream | 145g | Sea Bream Fillet | 220g |
| G7 | Eel | 180g | Eel Fillet | 270g |
| G8 | Tuna | 235g | Tuna Fillet | 355g |
| G9 | Silverfin | 300g | Silverfin Fillet | 450g |
| G10 | Rainbow Koi | 390g | Rainbow Koi Fillet | 585g |
<!-- /live -->

### Goods and gold

Selling is the farm's spine: what it grows, gathers and refines goes in the shipping bin, the bin pays overnight, and
the gold buys seeds, land, beds and buildings.

```
 the Warehouse ──Ship──► the bin ──End the day (step 1)──► gold, the farm's gold shipped, the Diary's shipped goods
       ▲                    │
       └────Take back───────┘  until the night; after it, final
```

#### One price rule

Every good's price at ★1 comes from one rule:
1. **The ladder:** a family's grade G sells at the ladder's price × the family's factor, rounded to 5g.
2. **Refined goods** (a station's output) sell at ×1.5 their input's price, rounded to 5g.
3. **Made goods** sell at ×1.25 the sum of their inputs at ★1, rounded to 5g. The rings are priced this way (a Copper
   Ring is 2 Copper Ingots and a Cut Quartz: 165g × 1.25 = 205g); dishes have no price.
4. **Crops have their own prices** wherever they come from, so the seven crops that are also forest goods keep them. A
   crop's refined form is ×1.5.
5. **Stars add +25% a star, never compounded:** ★1 ×1, ★2 ×1.25, ★3 ×1.5, ★4 ×1.75, ★5 ×2.
6. **Demand adds +20%** to the season's families, on top of the stars.

**Rounding:** a unit's price after stars and demand rounds to 5g once (half up), then it's × the count. A ★2 Salmon in
Summer is 110 × 1.25 × 1.2 = **165g**, and three are **495g**.

The ladder, and each family's factor, origin and prices:

<!-- live:price-ladder -->
| Grade | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 |
|---|---|---|---|---|---|---|---|---|---|---|
| The ladder | 30g | 40g | 50g | 65g | 85g | 110g | 140g | 180g | 230g | 300g |

| Family | Factor | Where from | Raw G1 → G10, ★1 | Refined |
|---|---|---|---|---|
| Grains | Each crop its own | The Fields | 40 · 40 · 45 · 50 · 140 · 60 · 75 · 160 · 240 · 260 | ×1.5 |
| Vegetables | Each crop its own | The Fields | 60 · 55 · 260 · 100 · 70 · 60 · 95 · 480 · 600 · 600 | — |
| Herbs and spices | ×0.9 | The forest, some crops | 45 · 45 · 45 · 60 · 200 · 100 · 125 · 160 · 520 · 270 | ×1.5 |
| Nuts and seeds | ×1.0 | The forest (Autumn), two crops | 35 · 75 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | ×1.5 |
| Sweets | ×1.1 | The forest (Spring), Sugar Beet | 35 · 45 · 120 · 70 · 95 · 120 · 155 · 200 · 255 · 330 | ×1.5 |
| Fruits | ×1.1 | The forest (Summer) | 35 · 45 · 55 · 70 · 95 · 120 · 155 · 200 · 255 · 330 | ×1.5 |
| Mushrooms | ×1.0 | The forest | 30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | ×1.5 |
| Woods | ×0.8 | The forest | 25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240 | ×1.5 |
| Ores | ×1.0 | The Mine | 30 · 40 · 50 · 65 · 85 · 110 · 140 · 180 · 230 · 300 | ×1.5 |
| Stones | ×0.8 | The Quarry | 25 · 30 · 40 · 50 · 70 · 90 · 110 · 145 · 185 · 240 | ×1.5 |
| Crystals | ×1.6 | The Quarry | 50 · 65 · 80 · 105 · 135 · 175 · 225 · 290 · 370 · 480 | ×1.5 |
| Fish | ×1.3 | The Fishery | 40 · 50 · 65 · 85 · 110 · 145 · 180 · 235 · 300 · 390 | ×1.5 |
| Hides and scales | ×1.5 | Expeditions | 45 · 60 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450 | — |
| Bones and horns | ×1.6 | Expeditions | 50 · 65 · 80 · 105 · 135 · 175 · 225 · 290 · 370 · 480 | — |
| Essences | ×1.8 | Expeditions | 55 · 70 · 90 · 115 · 155 · 200 · 250 · 325 · 415 · 540 | — |
<!-- /live -->

| Worked | Price |
|---|---|
| Silver Ore (ores G4) | 65 × 1.0 = **65g** |
| Silver Ingot | 65 × 1.5 = 97.5 → **100g** |
| ★3 Silver Ingot | 100 × 1.5 = **150g** |
| Salmon (fish G5) | 85 × 1.3 = 110.5 → **110g** |
| ★2 Salmon in Summer | 110 × 1.25 × 1.2 = **165g** |

#### Stars and prices

How the stars, and the season's demand, lift three goods:

<!-- live:star-prices -->
| Stars | Factor | Silver Ingot | Salmon, Summer (in demand) | Carrot, Summer |
|---|---|---|---|---|
| ★1 | ×1 | 100g | 130g | 60g |
| ★2 | ×1.25 | 125g | 165g | 75g |
| ★3 | ×1.5 | 150g | 200g | 90g |
| ★4 | ×1.75 | 175g | 230g | 105g |
| ★5 | ×2 | 200g | 265g | 120g |
<!-- /live -->

#### How stars are drawn

Every good adds up quality points, Q, from its sources, then draws its stars: **stars = 1 + ⌊Q + u⌋**, held to ★1–★5,
with u a seeded draw from 0 up to (not including) 1. The expected stars are 1 + Q: Q of 0.25 gives ★1 75% and ★2 25%,
and Q of 4 or more is always ★5. Every good of a haul or a harvest draws its own.

| Source | Gathering | Farming, tended | Farming, untended | Stations |
|---|---|---|---|---|
| Her rank | +0.5 a rank (Novice 0 to Legend 2.5) | The tender's | — | — |
| Her talent | G −0.75, F −0.5, E −0.25, D 0, C +0.25, B +0.5, A +0.75, S +1 | The tender's | — | — |
| Tended | — | +0.25 | — | — |
| The crop's level | — | +0.1 a level above 1 | +0.1 a level above 1 | — |
| The tool | The Axe or the Rod, +0.25 a tier above Basic | The Hoe, +0.25 a tier | The Hoe, +0.25 a tier | — |
| Well fed | +0.25 | +0.25 | — | — |
| Her keepsake | +0.25 at her line's place from Friendship 10, +0.5 from Spouse 5 | The same, when the Fields are her line's | — | — |
| The input | — | — | — | The output keeps its input's stars |

| Worked | Q | Stars |
|---|---|---|
| A Novice C forager | 0 + 0.25 = **0.25** | ★1 75%, ★2 25% |
| An untended block, crop level 1 | **0** | ★1 |
| An Expert A tender, a level-4 crop, well fed | 1.5 + 0.75 + 0.25 + 0.3 + 0.25 = **3.05** | ★4 95%, ★5 5% |

#### Demand by season

Each season lifts some families by +20%, their raw and refined goods alike. A crop follows its family: Sugar Beet is a
sweet (Spring), Peanut and Sunflower Seed are nuts and seeds (Autumn), Corn and the other grains are Autumn's, every
vegetable is Spring's whatever season it grows in, and the herb crops (Basil, Mint, Ginger, Mandrake) are never in
demand. Winter lifts dishes, cloth and the preserves (the fruits' refined row only); no dish or cloth sells at the bin,
so in Winter just the ten preserves are lifted. Woods, herbs and spices, ores, stones, crystals, the expeditions' goods
and the rings are never in demand. A good is in demand once, however many rules name it. "In demand" shows on the good
in the Warehouse, on its bin line and in the morning.

Each season's families, and how many goods they lift:

<!-- live:demand -->
| Season | In demand (+20%) | Goods lifted |
|---|---|---|
| Spring | Vegetables, Sweets | 30 of 260 |
| Summer | Fruits, Fish | 40 of 260 |
| Autumn | Grains, Mushrooms, Nuts and seeds | 60 of 260 |
| Winter | Dishes, Cloth (the refined row), Preserves (the refined row) | 10 of 260 |
<!-- /live -->

#### The catalogue

The catalogue holds 260 goods in 15 families, each with ten raw grades (G1–G10) and their refined forms where a station
makes them: 27 crops and 10 flours, the forest's 113, mining's 60, fishing's 20 and the expeditions' 30. The farm brings
in the shop's crops, the forest's goods (Mandrake among them), the freshwater fish and the three stations' forms of
them; the rest are priced, but nothing on the farm brings them in. Seeds aren't goods: they have no price and the bin
won't take them.

The crops' own prices, their refined forms and their season of demand:

<!-- live:crop-prices -->
| Crop | Id | Family | Price ★1 | Refined | Its price ★1 | In demand |
|---|---|---|---|---|---|---|
| Carrot | `carrot` | Vegetables | 60g | — | — | Spring |
| Potato | `potato` | Vegetables | 55g | — | — | Spring |
| Mint | `mint` | Herbs and spices | 45g | Dried Mint | 70g | — |
| Onion | `onion` | Vegetables | 100g | — | — | Spring |
| Cabbage | `cabbage` | Vegetables | 260g | — | — | Spring |
| Asparagus | `asparagus` | Vegetables | 480g | — | — | Spring |
| Tomato | `tomato` | Vegetables | 70g | — | — | Spring |
| Basil | `basil` | Herbs and spices | 45g | Dried Basil | 70g | — |
| Bell Pepper | `bell-pepper` | Vegetables | 60g | — | — | Spring |
| Eggplant | `eggplant` | Vegetables | 95g | — | — | Spring |
| Sunflower Seed | `sunflower-seed` | Nuts and seeds | 75g | Sunflower Oil | 115g | Autumn |
| Corn | `corn` | Grains | 140g | Cornmeal | 210g | Autumn |
| Wheat | `wheat` | Grains | 40g | Wheat Flour | 60g | Autumn |
| Peanut | `peanut` | Nuts and seeds | 35g | Peanut Butter | 55g | Autumn |
| Rice | `rice` | Grains | 50g | Polished Rice | 75g | Autumn |
| Sugar Beet | `sugar-beet` | Sweets | 120g | Beet Sugar | 180g | Spring |
| Emperor Pumpkin | `emperor-pumpkin` | Vegetables | 600g | — | — | Spring |
| Buckwheat | `buckwheat` | Grains | 75g | Buckwheat Flour | 115g | Autumn |
| Oats | `oats` | Grains | 40g | Rolled Oats | 60g | Autumn |
| Barley | `barley` | Grains | 45g | Pearl Barley | 70g | Autumn |
| Rye | `rye` | Grains | 60g | Rye Flour | 90g | Autumn |
| Ginger | `ginger` | Herbs and spices | 200g | Ground Ginger | 300g | — |
| Golden Carrot | `golden-carrot` | Vegetables | 600g | — | — | Spring |
| Sunwheat | `sunwheat` | Grains | 260g | Sunwheat Flour | 390g | Autumn |
| Moonrice | `moonrice` | Grains | 240g | Moonrice Flour | 360g | Autumn |
| Wild Rice | `wild-rice` | Grains | 160g | Hulled Wild Rice | 240g | Autumn |
| Mandrake | `mandrake` | Herbs and spices | 520g | Mandrake Powder | 780g | — |
<!-- /live -->

#### Rings

The catalogue's 16th family is the rings: ten of them, made at the ring bench from three refined goods of their grade,
always at ★1. They sell at the bin like any good, never in demand, and sit on the
Warehouse's Rings tab while one is held. The ring bench is the romance's.

The ten rings, their grades, prices and bonuses are in [the ring, the wedding, and married life](#the-ring-the-wedding-and-married-life).

#### The shipping bin

The bin takes anything with a price, at any time in the day, and pays at night. There's no cap on selling, and nothing
is ever bought back.

- **Ship:** from the Warehouse into today's bin: a tap on a star ships one, and **Ship all** ships every star of a good.
  Seeds and dishes don't sell ("That doesn't sell").
- **Take back:** a whole line from the bin back to the Warehouse, any time until the night. After the night, a sale is
  final.
- **The estimate:** "About 1,240g tonight", at today's prices.
- **The bin's sheet** (from the bin on the map, the gold chip or a morning line): "About 1,240g tonight", today's lines
  (icon, "Carrot ★2 × 3", the line's gold, **In demand**), each with **Take back**, and **Ship**, which opens the
  Warehouse to pick from. Empty, it says "Empty" and "Tap Ship to put goods in. They pay tonight." Its help (i) says the
  rule in three lines.

**At night (step 1):**
- each good and star pays price × stars × demand on the day it was shipped, rounded to 5g a unit, × the count;
- gold rises by the total;
- the farm's gold shipped rises by the same (the Farm Rank's points, 1 per 100g, and its shipping milestones);
- each good's count joins the Diary's shipped goods;
- the bin empties.

The morning's bin section lists each good and star sold, with its gold and **In demand**, then the total. A line's gold
is the night's own and is never priced again.

#### Gold

Gold is whole and never goes below 0; a purchase short of gold is refused ("Need 30g more"). A new farm starts with 500g
and 9 Carrot seeds.
- **Earned:** the bin, chapter rewards (500g for chapter 1), and the Diary's milestones and collection rows.
- **Spent:** seeds at the shop, blocks on the Fields' page, stations at their places, Dorm levels at the Dorm, and
  houses on the homestead.

The gold chip in the top bar shows the coin and your gold, and opens the bin.

#### The shop

The shop's sheet lists the season's six seeds, each with its icon, name and price and, while shut, its gate ("From Farm
Rank 2"). A tap opens a buy sheet: ×1, ×5, ×10, ×25 or a typed count, up to 99, and **Buy 9 · 180g**, held back with
"Need 30g more" when gold is short. What you buy goes in the Warehouse at ★1. The shop checks its lines again as you
buy, so a sheet left open past a season's turn can't buy last season's seeds. Land, beds and stations are bought at
their own places.

#### The Warehouse

The Warehouse holds everything the farm owns, by stars: each good has five counts, ★1 to ★5. It has no limit.

- **Tabs**, in a row that scrolls sideways, each with its count: **Crops** (the 27 crops and the grains' refined forms),
  **Woods**, **Mushrooms**, **Herbs and spices**, **Fruits**, **Nuts and seeds**, **Sweets**, **Fish**, **Mining**
  (ores, stones and crystals) and **Seeds**; and **Loot** (the expeditions' goods), **Rings** and **Dishes** only while
  something is on them. A crop's refined form sits on its family's tab (Dried Basil on Herbs and spices, Peanut Butter
  on Nuts and seeds).
- **Each good:** its icon, name, **In demand**, its total, and its five stars, each with its count and today's price.
- **A good's sheet:** its family, grade and form ("Fish · G5 · raw"), what it refines into or from, "+20% this season"
  when in demand, its five stars (a tap on one ships one) and **Ship all · 665g**. Seeds say "Seeds: they don't sell"; a
  dish says "A dish: for a meal"; a ring's form is "made at the ring bench".
- **Pick mode** (from the bin's **Ship**): "Ship to the bin". Each star ships one, each good has **Ship all**, and a bar
  says "In the bin: about 1,240g tonight" (or "Tap a star to ship one.") with **Done**, back to the bin. It opens on the
  first tab holding something that sells.

#### Every family's prices

Each family's goods, raw and refined, at ★1 and ★5, out of demand; in demand, ×1.2 and rounded to 5g again.

<!-- live:goods-prices -->
##### Grains

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Wheat (crop) | 40g | 80g | Wheat Flour | 60g | 120g |
| G2 | Oats (crop) | 40g | 80g | Rolled Oats | 60g | 120g |
| G3 | Barley (crop) | 45g | 90g | Pearl Barley | 70g | 140g |
| G4 | Rice (crop) | 50g | 100g | Polished Rice | 75g | 150g |
| G5 | Corn (crop) | 140g | 280g | Cornmeal | 210g | 420g |
| G6 | Rye (crop) | 60g | 120g | Rye Flour | 90g | 180g |
| G7 | Buckwheat (crop) | 75g | 150g | Buckwheat Flour | 115g | 230g |
| G8 | Wild Rice (crop) | 160g | 320g | Hulled Wild Rice | 240g | 480g |
| G9 | Moonrice (crop) | 240g | 480g | Moonrice Flour | 360g | 720g |
| G10 | Sunwheat (crop) | 260g | 520g | Sunwheat Flour | 390g | 780g |

##### Vegetables

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Carrot (crop) | 60g | 120g |
| G2 | Potato (crop) | 55g | 110g |
| G3 | Cabbage (crop) | 260g | 520g |
| G4 | Onion (crop) | 100g | 200g |
| G5 | Tomato (crop) | 70g | 140g |
| G6 | Bell Pepper (crop) | 60g | 120g |
| G7 | Eggplant (crop) | 95g | 190g |
| G8 | Asparagus (crop) | 480g | 960g |
| G9 | Golden Carrot (crop) | 600g | 1,200g |
| G10 | Emperor Pumpkin (crop) | 600g | 1,200g |

##### Herbs and spices

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Basil (crop) | 45g | 90g | Dried Basil | 70g | 140g |
| G2 | Mint (crop) | 45g | 90g | Dried Mint | 70g | 140g |
| G3 | Rosemary | 45g | 90g | Dried Rosemary | 70g | 140g |
| G4 | Thyme | 60g | 120g | Dried Thyme | 90g | 180g |
| G5 | Ginger (crop) | 200g | 400g | Ground Ginger | 300g | 600g |
| G6 | Peppercorn | 100g | 200g | Ground Pepper | 150g | 300g |
| G7 | Cinnamon | 125g | 250g | Ground Cinnamon | 190g | 380g |
| G8 | Saffron | 160g | 320g | Saffron Threads | 240g | 480g |
| G9 | Mandrake (crop) | 520g | 1,040g | Mandrake Powder | 780g | 1,560g |
| G10 | Phoenix Pepper | 270g | 540g | Phoenix Spice | 405g | 810g |

##### Nuts and seeds

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Peanut (crop) | 35g | 70g | Peanut Butter | 55g | 110g |
| G2 | Sunflower Seed (crop) | 75g | 150g | Sunflower Oil | 115g | 230g |
| G3 | Sesame | 50g | 100g | Sesame Paste | 75g | 150g |
| G4 | Walnut | 65g | 130g | Walnut Paste | 100g | 200g |
| G5 | Chestnut | 85g | 170g | Chestnut Paste | 130g | 260g |
| G6 | Almond | 110g | 220g | Almond Paste | 165g | 330g |
| G7 | Pistachio | 140g | 280g | Pistachio Paste | 210g | 420g |
| G8 | Macadamia | 180g | 360g | Macadamia Butter | 270g | 540g |
| G9 | Thundernut | 230g | 460g | Thundernut Oil | 345g | 690g |
| G10 | Worldseed | 300g | 600g | Worldseed Oil | 450g | 900g |

##### Sweets

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Honeycomb | 35g | 70g | Honey | 55g | 110g |
| G2 | Sugarcane | 45g | 90g | Cane Sugar | 70g | 140g |
| G3 | Sugar Beet (crop) | 120g | 240g | Beet Sugar | 180g | 360g |
| G4 | Maple Sap | 70g | 140g | Maple Syrup | 105g | 210g |
| G5 | Cacao Pod | 95g | 190g | Chocolate | 145g | 290g |
| G6 | Vanilla Pod | 120g | 240g | Vanilla Extract | 180g | 360g |
| G7 | Agave Heart | 155g | 310g | Agave Syrup | 235g | 470g |
| G8 | Palm Sap | 200g | 400g | Palm Sugar | 300g | 600g |
| G9 | Fairy Honeycomb | 255g | 510g | Fairy Honey | 385g | 770g |
| G10 | Ambrosia Blossom | 330g | 660g | Ambrosia | 495g | 990g |

##### Fruits

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Apple | 35g | 70g | Apple Preserve | 55g | 110g |
| G2 | Pear | 45g | 90g | Pear Preserve | 70g | 140g |
| G3 | Peach | 55g | 110g | Peach Preserve | 85g | 170g |
| G4 | Plum | 70g | 140g | Plum Preserve | 105g | 210g |
| G5 | Orange | 95g | 190g | Orange Marmalade | 145g | 290g |
| G6 | Grape | 120g | 240g | Grape Jelly | 180g | 360g |
| G7 | Mango | 155g | 310g | Mango Pulp | 235g | 470g |
| G8 | Pomegranate | 200g | 400g | Pomegranate Molasses | 300g | 600g |
| G9 | Starpeach | 255g | 510g | Starpeach Nectar | 385g | 770g |
| G10 | Golden Apple | 330g | 660g | Golden Apple Preserve | 495g | 990g |

##### Mushrooms

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Button Mushroom | 30g | 60g | Dried Button Mushroom | 45g | 90g |
| G2 | Shiitake | 40g | 80g | Dried Shiitake | 60g | 120g |
| G3 | Oyster Mushroom | 50g | 100g | Dried Oyster Mushroom | 75g | 150g |
| G4 | Enoki | 65g | 130g | Dried Enoki | 100g | 200g |
| G5 | Chanterelle | 85g | 170g | Dried Chanterelle | 130g | 260g |
| G6 | Porcini | 110g | 220g | Dried Porcini | 165g | 330g |
| G7 | Morel | 140g | 280g | Dried Morel | 210g | 420g |
| G8 | Truffle | 180g | 360g | Shaved Truffle | 270g | 540g |
| G9 | Glowcap | 230g | 460g | Glowcap Powder | 345g | 690g |
| G10 | King Reishi | 300g | 600g | Reishi Powder | 450g | 900g |

##### Woods

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Pine Log | 25g | 50g | Pine Plank | 40g | 80g |
| G2 | Birch Log | 30g | 60g | Birch Plank | 45g | 90g |
| G3 | Cedar Log | 40g | 80g | Cedar Plank | 60g | 120g |
| G4 | Maple Log | 50g | 100g | Maple Plank | 75g | 150g |
| G5 | Oak Log | 70g | 140g | Oak Plank | 105g | 210g |
| G6 | Cherry Log | 90g | 180g | Cherry Plank | 135g | 270g |
| G7 | Mahogany Log | 110g | 220g | Mahogany Plank | 165g | 330g |
| G8 | Ebony Log | 145g | 290g | Ebony Plank | 220g | 440g |
| G9 | Elderwood Log | 185g | 370g | Elderwood Plank | 280g | 560g |
| G10 | Yggdrasil Branch | 240g | 480g | Yggdrasil Plank | 360g | 720g |

##### Ores

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Copper Ore | 30g | 60g | Copper Ingot | 45g | 90g |
| G2 | Tin Ore | 40g | 80g | Tin Ingot | 60g | 120g |
| G3 | Iron Ore | 50g | 100g | Iron Ingot | 75g | 150g |
| G4 | Silver Ore | 65g | 130g | Silver Ingot | 100g | 200g |
| G5 | Cobalt Ore | 85g | 170g | Cobalt Ingot | 130g | 260g |
| G6 | Gold Ore | 110g | 220g | Gold Ingot | 165g | 330g |
| G7 | Platinum Ore | 140g | 280g | Platinum Ingot | 210g | 420g |
| G8 | Titanium Ore | 180g | 360g | Titanium Ingot | 270g | 540g |
| G9 | Mythril Ore | 230g | 460g | Mythril Ingot | 345g | 690g |
| G10 | Orichalcum Ore | 300g | 600g | Orichalcum Ingot | 450g | 900g |

##### Stones

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Limestone | 25g | 50g | Limestone Block | 40g | 80g |
| G2 | Sandstone | 30g | 60g | Sandstone Block | 45g | 90g |
| G3 | Slate | 40g | 80g | Slate Block | 60g | 120g |
| G4 | Granite | 50g | 100g | Granite Block | 75g | 150g |
| G5 | Basalt | 70g | 140g | Basalt Block | 105g | 210g |
| G6 | Marble | 90g | 180g | Marble Block | 135g | 270g |
| G7 | Obsidian | 110g | 220g | Obsidian Block | 165g | 330g |
| G8 | Jade | 145g | 290g | Jade Block | 220g | 440g |
| G9 | Runestone | 185g | 370g | Runestone Block | 280g | 560g |
| G10 | Meteorite | 240g | 480g | Meteorite Block | 360g | 720g |

##### Crystals

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Quartz | 50g | 100g | Cut Quartz | 75g | 150g |
| G2 | Amethyst | 65g | 130g | Cut Amethyst | 100g | 200g |
| G3 | Citrine | 80g | 160g | Cut Citrine | 120g | 240g |
| G4 | Garnet | 105g | 210g | Cut Garnet | 160g | 320g |
| G5 | Emerald | 135g | 270g | Cut Emerald | 205g | 410g |
| G6 | Sapphire | 175g | 350g | Cut Sapphire | 265g | 530g |
| G7 | Ruby | 225g | 450g | Cut Ruby | 340g | 680g |
| G8 | Diamond | 290g | 580g | Cut Diamond | 435g | 870g |
| G9 | Starstone | 370g | 740g | Cut Starstone | 555g | 1,110g |
| G10 | Philosopher's Stone | 480g | 960g | Cut Philosopher's Stone | 720g | 1,440g |

##### Fish

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Carp | 40g | 80g | Carp Fillet | 60g | 120g |
| G2 | Trout | 50g | 100g | Trout Fillet | 75g | 150g |
| G3 | Sardine | 65g | 130g | Sardine Fillet | 100g | 200g |
| G4 | Mackerel | 85g | 170g | Mackerel Fillet | 130g | 260g |
| G5 | Salmon | 110g | 220g | Salmon Fillet | 165g | 330g |
| G6 | Sea Bream | 145g | 290g | Sea Bream Fillet | 220g | 440g |
| G7 | Eel | 180g | 360g | Eel Fillet | 270g | 540g |
| G8 | Tuna | 235g | 470g | Tuna Fillet | 355g | 710g |
| G9 | Silverfin | 300g | 600g | Silverfin Fillet | 450g | 900g |
| G10 | Rainbow Koi | 390g | 780g | Rainbow Koi Fillet | 585g | 1,170g |

##### Hides and scales

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Puffbun Pelt | 45g | 90g |
| G2 | Boarling Hide | 60g | 120g |
| G3 | Wolfkin Pelt | 75g | 150g |
| G4 | Rock Lizard Scale | 100g | 200g |
| G5 | Ironback Hide | 130g | 260g |
| G6 | Basilisk Scale | 165g | 330g |
| G7 | Manticore Hide | 210g | 420g |
| G8 | Behemoth Hide | 270g | 540g |
| G9 | Wyvern Scale | 345g | 690g |
| G10 | Dragon Scale | 450g | 900g |

##### Bones and horns

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Seashell | 50g | 100g |
| G2 | Ammonite | 65g | 130g |
| G3 | Trilobite | 80g | 160g |
| G4 | Fossil Bone | 105g | 210g |
| G5 | Mammoth Tusk | 135g | 270g |
| G6 | Saber Fang | 175g | 350g |
| G7 | Raptor Claw | 225g | 450g |
| G8 | Tyrant Tooth | 290g | 580g |
| G9 | Titan Bone | 370g | 740g |
| G10 | Unicorn Horn | 480g | 960g |

##### Essences

| Grade | Raw | ★1 | ★5 |
|---|---|---|---|
| G1 | Mist Essence | 55g | 110g |
| G2 | Dew Essence | 70g | 140g |
| G3 | Breeze Essence | 90g | 180g |
| G4 | Ember Essence | 115g | 230g |
| G5 | Tide Essence | 155g | 310g |
| G6 | Spark Essence | 200g | 400g |
| G7 | Glimmer Essence | 250g | 500g |
| G8 | Shadow Essence | 325g | 650g |
| G9 | Aether | 415g | 830g |
| G10 | Prismatic Essence | 540g | 1,080g |
<!-- /live -->

## Part 2 — The Umas and the farm's progress

Umas join the farm when the story says: the opening brings three, and the rest arrive with a chapter's end, a festival,
a Dorm level or another Uma's event. The Dorm's beds cap who lives and works on the farm at once. Every Uma has a talent,
G to S, in each of nine activities, read from her stats, and climbs six ranks in each by working and meeting a
challenge. The farm climbs a ladder of its own, the Farm Rank, fed by shipping, the Diary and the story's chapters.

```
 day 1: your name ──► the opening scene ──► the opening three arrive ──► home (3 beds) ──► chapter 1's goals
                                                                          │
 the Dorm: Upgrade · 1,000g ── night ──► 5 beds ──────────────────────────┤ Dorm levels 4–8 each bring an arrival
                                                                          │
 roster > beds ──► the rest are away                                      │
 swap: one idle Uma home ⇄ one away ── night ──► she's home               │
 a chapter's end, a festival, another Uma's event ──► the cast's arrival joins that night
```

### The roster

The roster is every Uma who has joined the farm. Who is **home** (on the farm) is capped by the Dorm's beds; everyone
else on the roster is **away** on her off-season. A spouse in her house is on the farm too, without a Dorm bed. Only
Umas on the farm can work or tend; chats and gifts reach everyone on the roster, home or away.

#### How Umas join

Every Uma on the farm is one of the story pack's cast, and each walks in when her authored arrival says: the opening
three when the opening scene is read, then the rest with a chapter's end, a festival, a Dorm level or another Uma's
event. She joins home while a bed is free, else away, at Friendship 0. Nothing is drawn. The arrivals and their scenes
are the romance's: see [the opening, the farmer's name, and arrivals](#the-opening-the-farmers-name-and-arrivals).

#### The Dorm's levels and beds

Beds cap who lives and works on the farm at once. Level 1 comes with the farm; each later level is bought at the Dorm.
The Dorm for 20: its eight levels, their beds, what each costs, the Farm Rank it needs, and the levels whose arrival
comes the morning they take effect:

<!-- live:dorm-levels -->
| Level | Beds | Costs | Farm Rank | Cumulative | Brings |
|---|---|---|---|---|---|
| 1 | 3 | — | — | 0g | — |
| 2 | 5 | 1,000g | 1 | 1,000g | — |
| 3 | 7 | 3,000g | 2 | 4,000g | — |
| 4 | 9 | 8,000g | 3 | 12,000g | An arrival |
| 5 | 11 | 15,000g | 4 | 27,000g | An arrival |
| 6 | 14 | 28,000g | 5 | 55,000g | An arrival |
| 7 | 17 | 50,000g | 6 | 105,000g | An arrival |
| 8 | 20 | 85,000g | 7 | 190,000g | An arrival |
<!-- /live -->

- **Buying:** the gold goes now; the beds come the next morning. A purchase is refused at the top level ("The Dorm is
  at its top level."), before its Farm Rank ("Opens at Farm Rank 2.") and when gold is short. A level bought today can
  be followed by the next one the same day; both arrive the next morning.
- **Beds free** are the level in effect's beds less the Umas home. A level bought today doesn't count until it takes
  effect.
- **What waits for a free bed:** anyone who joins comes home only while one is free; otherwise she joins away, and a
  swap brings her home.
- **A level's arrival:** levels 4 to 8 each bring an authored arrival the morning they take effect. The Dorm's page says
  "· someone new arrives" on a level whose arrival hasn't come, never who.

#### The off-season and swaps

Everyone on the roster past the beds is **away on her off-season**. She keeps her ranks and her route, and earns
nothing: no work, no tending, no rank points. Chats and gifts still reach her.

- **A swap** sends one Uma home away and brings one away home in her place. It is free and unlimited, and it happens the
  next morning: the one leaving goes away and the one arriving takes her bed.
- **Who can go away:** an Uma home with no running job who tends no block. Refused: a working Uma ("She's working."), a
  tender ("She tends Block A."), one already leaving ("She leaves tomorrow."), anyone not home ("She isn't on the
  farm.").
- **Who can come home:** anyone on the roster who is away and not already arriving ("She arrives tomorrow."). One home
  already is refused ("She's on the farm already."), and so is a spouse in her house ("She lives in her house.").
- **Leaving tomorrow:** until the night, an Uma a swap takes out can't take a job, a queue or a block ("She leaves
  tomorrow."). The pickers show her greyed out with "Leaves tomorrow", and she doesn't count as idle. Work she has
  finished can still be collected.
- **Calling off:** a swap can be called off any time before the night; she stays.
- At night, a tender who isn't home after the swaps loses her block (none can be: a tender can't swap out). A spouse in
  her house tends on.

#### Chapter arrivals

Each chapter's end brings the cast's authored arrival for that chapter, if the cast has one, the night its last goal is
met: home while a bed is free, else away, her ties seeded. Nothing is drawn. The chapter's reward names "a new hand"
only when there is one, and never who. The morning lists her under Hearts ("… arrived", "· away" with no bed).

#### The night's roster step and the morning's news

Night step 8 runs, in order, after the calendar has turned:

1. **The Dorm settles:** a level bought takes effect, then each swap: the Uma leaving goes away and the one arriving
   comes home in her place.
2. **Arrivals:** every cast Uma not on the roster whose authored arrival holds joins, in the cast's order.
3. **The goals** (see *The night's goals check* under Goals), which may bring a chapter's arrival.

The morning's **New today** lists, after the season, festival, chapter, Farm Rank, milestone and household lines:

| Line | When | Opens |
|---|---|---|
| "Dorm level 2 · 5 beds" | A level bought took effect | The Dorm |
| "{name} is home", or "3 Umas are home" | Swaps brought Umas home | The Dorm |

Arrivals are listed under **Hearts** ("{name} arrived", "· away" with no bed). `{name}` is her name, from master data.
The morning's **Today** section counts idle Umas ("2 Umas idle", opening the Hearts tab's Work view): an Uma on the farm
with no running job, tending no growing block, and not leaving tomorrow.

#### The roster's screens

- **The Dorm** (the Dorm on the map):
  - its level and "3 of 5 beds"; after buying, "Level 3 tomorrow · 7 beds", with "· someone new arrives" when the level
    brings one;
  - the next level, "Level 3 · 7 beds", with "· Farm Rank 2" while it's locked, and **Upgrade · 3,000g** (disabled
    until the Farm Rank is reached and the gold is there; "Need 500g more" when only gold is short); at the top, "The
    Dorm is at its top level.";
  - **Levels:** the eight, each "Built", "Tomorrow", or its cost and Farm Rank, and "· someone new arrives" on a level
    whose arrival hasn't come;
  - **Tomorrow:** each swap as two faces with "… arrives tomorrow" and **Call off**;
  - **On the farm · n:** each Uma with her best rank and what she's doing (Idle, Working, Tends Block A, Leaves
    tomorrow);
  - **Swap** (or "Swap · nobody away"), enabled when someone home can go and someone away can come: a picker over the
    Umas home ("Who goes away?", busy ones greyed out with why), then over those away ("Who comes home for {name}?");
  - **Away · n:** each Uma with "Away" or "Arrives tomorrow", or "Nobody away." Every row opens her profile.
- **The Gate** (its quick look on the map): "Umas arrive here." and what brings the next arrivals ("Next: chapter 2's
  end · the Dorm's level 4"), never who, or "Everyone is here."
- **The roster** is the Hearts tab's **Work** view (`/hearts?view=work`; `/roster` lands there): everyone on the roster,
  home or away, as an album of cards in three columns, under the line "3 on the farm · 2 away · by joined".
  - **Her face** carries her favourite line's mark top left (a Carrot farming, a Pine Log foraging, a Carp fishing,
    Copper Ore mining, on a light disc), her best talent's grade bottom right on a coloured chip (S gold, A coral, B
    blue, C green, D and below grey), and her level in words top right ("F7", "R4", "S2").
  - **Her card** says her best rank ("Hand · Farming", or "Novice" before her first points) and her best talent
    ("Fishing A"). Sorted by an activity, it says her rank and talent in it ("Hand · C") and the activity, with her
    points when sorted by them ("Fishing · 52 pts"). An Uma away is dimmed, and her second line says "Away".
  - **Search** by name.
  - **Filters:** Where (On the farm, Away); Favourite line (Farming, Mining, Fishing, Foraging); her talent in each
    activity (C+, B+, A+, S); her rank in each activity (Novice … Legend).
  - **Sorts:** Joined (the default, oldest first), Talent and Rank points (each in a chosen activity, the sort sheet's
    "In" chips, Farming until one is chosen; highest first), and Name.
  - **A tap on her card** opens her profile on its Work side: "Favourite · Fishing (×1.2 rank points)", "Joined Spring
    1", and "On the farm" or "Away · swap at the Dorm"; then her nine activities, each with its talent chip, her
    favourite mark on her favourite, "Hand · 52 / 160" (her points alone at Legend), and a line below: "Next: Catch 10
    fish at the River · 3/10", "Points full · …", or "Ranks up tonight · …". A challenge whose target is 1 shows without
    a count.
- **The pickers for a place** (the Fields' tender, a job's Uma): the Umas home, each card her rank and talent in the
  place's activity ("Hand · B"), the same face marks, the filters above (without Where), and the sorts "<Activity>
  talent", "<Activity> points", Joined and Name. They open ordered by the place's activity: rank, then points, then talent
  score, then name. In the tender's picker a working Uma or one leaving tomorrow is shown but can't be picked (a
  tender of another block can, and moves here), and working Umas sort last. In a job's picker a tender or an Uma leaving
  tomorrow can't be picked.

The Hearts view, her profile's Hearts side, Chat and Gift are the romance's: see [the Hearts tab](#the-hearts-tab) and
[her profile](#her-profile).

### Talents and ranks

Every Uma is a specialist. Her **talent** in each activity, G to S, is read from her own stats by one rule, the same for
everyone; it's why one Uma suits the Fields and another the Pond. Her **rank** in each activity, Novice to Legend, is
earned by working and meeting a challenge; ranks are how the farm goes deeper and better.

#### Talents

For each activity, her **talent score** is her 5★ base stat × (100 + her growth rate for that stat, in percent) ÷ 100,
read from master data's outfit and kept to a millionth. Expeditions read the mean of her three best stat scores. Which
stat each activity reads, and the temperament each top stat gives:

<!-- live:talent-stats -->
| Stat | Activities | Temperament (her top stat) |
|---|---|---|
| Speed | Foraging, Serving | Breezy |
| Stamina | Farming | Steady |
| Power | Mining, Forging | Bold |
| Guts | Ranch | Gritty |
| Wit | Fishing, Cooking | Clever |
| All five: the mean of her three best scores | Expeditions | — |
<!-- /live -->

The cut-offs are the same for everyone (150 is S; 149.9 is A):

<!-- live:talent-cutoffs -->
| Grade | S | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|---|
| A stat’s score | ≥ 150 | ≥ 138 | ≥ 126 | ≥ 114 | ≥ 104 | ≥ 96 | ≥ 88 | < 88 |
| Expeditions (mean of best three) | ≥ 136 | ≥ 132 | ≥ 129 | ≥ 126 | ≥ 124 | ≥ 122 | ≥ 120 | < 120 |
<!-- /live -->

- **Her best talent** (the chip on her face) is her highest grade among the eight one-stat activities, then the higher
  score, then the activities' order (farming, the ranch, mining, fishing, foraging, cooking, serving, forging).
  Expeditions, on their own scale, don't count.
- **Talents aren't saved.** A fixed release always gives the same talents; the app computes the whole table once per
  release, and the night, the harvests and the screens all read it. An outfit a later release drops reads D everywhere.
- On screen, until master data loads, everyone reads D.

#### Temperament

Her temperament is her top stat score's: Speed **breezy**, Stamina **steady**, Power **bold**, Guts **gritty**, Wit
**clever**. A tie goes Speed, Stamina, Power, Guts, Wit. Her fallback chat lines (before her authored ones) read it.

#### What a talent gives

Each grade is a step, G 0 to S 7, and each step lifts her work:

<!-- live:talent-gives -->
| Talent | G | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| Step | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| Yield (gathering, stations) | ×0.85 | ×0.90 | ×0.95 | ×1.00 | ×1.05 | ×1.10 | ×1.15 | ×1.20 |
| Quality points | −0.75 | −0.5 | −0.25 | 0 | +0.25 | +0.5 | +0.75 | +1 |
| Rank points | ×0.8 | ×0.85 | ×0.9 | ×1 | ×1.1 | ×1.2 | ×1.3 | ×1.5 |
| Tended growth | — | — | — | — | — | +0.05 | +0.1 | +0.15 |
| Affection a day (ranch) | +0 | +1 | +2 | +3 | +4 | +5 | +6 | +7 |
| Expedition power | +0 | +2 | +4 | +6 | +8 | +10 | +12 | +14 |
<!-- /live -->

- **Yield** multiplies what her gathering and station jobs bring.
- **Quality points** add to the star draw of what she makes or grows.
- **Rank points** multiply every pay of rank points.
- **Tended growth** adds to a block's growth a night when she tends it (B and up only).
- Affection a day (the ranch) and expedition power are defined, but the ranch and expeditions aren't open in play.

#### Rank points

Six ranks in each of the nine activities: **Novice, Hand, Skilled, Expert, Master, Legend**. A day of work pays rank
points in its activity:

> **10 points × her talent's rank-point factor × 1.2 in her favourite line × 1.25 well fed × the hearts' factor**

Points are kept to a millionth and shown whole. Every pay of rank points takes the same factors; a workshop play pays its
assistant 10 and an expedition 10 a day (+10 on a Success, +20 on a Great), but no workshop or expedition is open in
play. The ranch, the workshops and expeditions are nobody's favourite, so ×1.2 never applies there.

- **Well fed:** an Uma with a meal's days left: a wedding's reception or a spouse's breakfast feeds the farm. The days
  count down each night.
- **The hearts' factor** reads her friendship level:

<!-- live:hearts-factor -->
| ×1 | ×1.05 | ×1.10 |
|---|---|---|
| F0–F4 | F5–F9 | F10 on: her confession, romance and spouse |
<!-- /live -->

Ranks come at **40, 160, 400, 900 and 2,000 points**. Days of work to reach each, by talent (in her favourite line in
brackets), with every challenge met as it comes:

<!-- live:rank-points -->
| Rank | Points | G | D | C | A | S |
|---|---|---|---|---|---|---|
| Novice | 0 | — | — | — | — | — |
| Hand | 40 | 5 (5) | 4 (4) | 4 (4) | 4 (3) | 3 (3) |
| Skilled | 160 | 20 (17) | 16 (14) | 15 (13) | 13 (11) | 11 (9) |
| Expert | 400 | 50 (42) | 40 (34) | 37 (31) | 31 (26) | 27 (23) |
| Master | 900 | 113 (94) | 90 (75) | 82 (69) | 70 (58) | 60 (50) |
| Legend | 2,000 | 250 (209) | 200 (167) | 182 (152) | 154 (129) | 134 (112) |
<!-- /live -->

Points go on past a threshold while the challenge waits; they also keep counting at Legend.

- **A mentor:** an Uma at Friendship 9 working her line's place mentors the others who worked there that day: they earn
  ×1.10 rank points, she doesn't, one mentor a place. A day at her line also pays into her route. The romance part covers
  both.

#### Who worked today

An Uma works a day when a job of hers runs through it, or when she tends a block with a growing plot (a tender of an
empty or all-Ready block earns nothing). Where she worked sets the activity it pays:

<!-- live:place-activity -->
| Where she worked | Pays rank points in |
|---|---|
| The Fields, tending a block with a growing plot | Farming |
| Forest | Foraging |
| Sawmill | Foraging |
| Fishery | Fishing |
| Smokehouse | Fishing |
| Mill | Farming |
| Mine | Mining |
| Quarry | Mining |
| Smelter | Mining |
| Cutter | Mining |
<!-- /live -->

- **One day pays one activity:** her job's if she has one, else her tending's. An Uma can't hold both anyway: a tender
  can't take a job, and a working Uma can't tend.
- An Uma away earns nothing.
- The Mine, the Quarry, the Smelter and the Cutter open with chapter 3, so in play only farming, foraging and fishing
  earn rank points.

#### The challenges

A rank comes when its points are reached **and** its challenge is met. Each depth challenge is "work the deepest place
your rank allows", so ranking up is how the farm goes deeper. The challenge toward each rank, by activity:

<!-- live:challenges -->
| Activity | Hand | Skilled | Expert | Master | Legend | Counted by |
|---|---|---|---|---|---|---|
| Farming | Harvest 30 crops she tended | 40 crops of ★3+ she tended | Tend a crop of level 4+ to harvest | 30 crops of ★5 | 1st at a Flower Show with a crop she tended | At harvest, for the tender; a festival win (festivals aren’t built yet) |
| Ranch | Care for animals 10 days | An animal in her care reaches 4 hearts | An animal in her care reaches 7 hearts | An animal in her care reaches 10 hearts | 1st at an Animal Show with an animal in her care | The ranch (not built yet); a festival win (festivals aren’t built yet) |
| Mining | Dig 40 ores or stones | Dig at floor 10 | Dig at floor 15 | Dig at floor 20 | Dig at floor 25 | The Mine and the Quarry (not built yet) |
| Fishing | Catch 30 fish | Catch 10 fish at the River | Catch 10 fish at the Lake | Catch 10 fish at the Falls | 1st at a Fishing Derby, on the team | The night’s catches (night step 4); a festival win (festivals aren’t built yet) |
| Foraging | Gather 50 items | Gather 20 items in the Hills | Gather 20 items in the Old Forest | Gather 20 items on the Mountain | Gather 20 items in the Misty Vale | The night’s hauls (night step 4) |
| Cooking | Assist 5 Kitchen plays | Assist a Fine play | Make 10 dishes of ★4+ | Assist a Masterwork | 1st at a Cooking Contest as the cook | The Kitchen (not built yet); a festival win (festivals aren’t built yet) |
| Serving | Assist 5 shifts | Assist a Fine shift | Serve 100 guests | Assist a Masterwork shift | Serve 1,000 guests | The Restaurant (not built yet) |
| Forging | Assist 5 Forge plays | Assist a Fine merge | Forge a tool upgrade | Assist a Masterwork | Forge a Mythril tool | The Forge’s workshop (not built yet) |
| Expeditions | Return from 2 expeditions | A Success at level 10+ | A Success at level 20+ | A Great at level 20+ | A Success at the Sky Ruins | Expeditions (not built yet) |
<!-- /live -->

- **One challenge at a time:** her count is toward her next rank's challenge only, from her joining or her last rank-up
  in that activity. It stops at the target and resets to 0 at the rank-up.
- **What counts it:** a harvest counts toward the block's tender at the moment of harvest (its crops, by star and the
  crop's level). A forest haul's items and a catch's fish count toward the forager's and the angler's challenges, by
  area and spot, at night step 4 as they finish, so a challenge met tonight ranks her up tonight. Each challenge
  reads only its own kind of event; an Uma off the roster or at Legend counts nothing.
- **In play:** only farming's, foraging's and fishing's challenges are counted. The others wait for places that aren't
  open. Farming's and fishing's Legend challenges are festival wins, and no festival is held, so those two climbs stop
  at Master; foraging can reach Legend.

#### Rank-ups at night

Night step 6, before the day's jobs settle into tomorrow:

1. **Points:** each Uma who worked earns a day's points in its activity, with her factors as she worked (well fed is
   read before the night counts it down).
2. **Rank-ups:** every Uma on the roster, in every activity, ranks up where her points have reached the next rank's and
   its challenge is met. One rank a night per activity; the challenge's count resets. A challenge met during the day
   waits for that night. A rank skipped by points still takes its challenges one at a time, a rank a night.
3. **Lines:** the rank-ups first, then **points full**: an Uma whose points for her next rank filled tonight with its
   challenge still to meet. It's said once, the night they fill (or the night a rank-up leaves the next rank already
   full); her sheet keeps saying "Points full" until she ranks up.

A rank reached tonight already lifts tomorrow's work, including a queued job that starts at tonight's boundary.

The morning's **Ranks** section lists the night's lines, each opening her sheet:

| Line | Words |
|---|---|
| A rank-up | "{name} · Farming Hand", tagged **Rank up** |
| Points full | "{name} · Fishing · Catch 30 fish · 12/30", tagged **Points full**: the challenge in its own words with her count; a one-off challenge has no count ("Dig at floor 10") |

#### What a rank gives

<!-- live:rank-gives -->
| Rank | Yield | Tended growth | Quality | Deepest: Mine and Quarry · forest · Fishery | Expedition power | Seeds back | Affection a day | Workshop yield |
|---|---|---|---|---|---|---|---|---|
| Novice | ×1 | 1.25 | +0 | Floor 5 · The Woods · The Pond | 10 | 10% | +0 | ×1 |
| Hand | ×1.15 | 1.35 | +0.5 | Floor 10 · The Hills · The River | 20 | 15% | +3 | ×1.1 |
| Skilled | ×1.3 | 1.45 | +1 | Floor 15 · The Old Forest · The Lake | 30 | 20% | +6 | ×1.2 |
| Expert | ×1.5 | 1.55 | +1.5 | Floor 20 · The Mountain · The Falls | 40 | 25% | +9 | ×1.3 |
| Master | ×1.7 | 1.65 | +2 | Floor 25 · The Misty Vale · The Deep Sea | 50 | 30% | +12 | ×1.4 |
| Legend | ×2 | 1.75 | +2.5 | Floor 30 · The World Tree · The Moon Pool | 60 | 35% | +15 | ×1.5 |
<!-- /live -->

- **Yield** multiplies her gathering and station jobs.
- **Tended growth** is a block's growth a night when she tends it, before her talent and the Watering Can.
- **Quality** adds to the star draw of what she grows or makes.
- **Deepest** is the last area, spot and floor her rank lets her work.
- **Seeds back** is a tended harvest's chance of a seed, before the Hoe.
- Expedition power, affection a day and workshop yield are defined for places that aren't open in play.

#### Her favourite line

Her favourite line is her story bible's, else her cast entry's calling (a quarry calling is mining, at the Quarry), read
from the story pack: **farming, foraging, fishing or mining**. She earns ×1.2 rank points there. The mark on her face is
her favourite line's.

- **She can work anywhere.** Her favourite only speeds her ranks; nothing refuses her elsewhere.
- The ranch, the workshops and expeditions are nobody's favourite.
- What else her line does (her perks, her tastes in gifts) is the romance's: see
  [her favourite line and tastes](#her-favourite-line-and-tastes).

### Goals

The farm's progress has three parts: the **Farm Rank**, its own ladder from 1 to 10; the **Diary**, which counts what
you ship and pays milestones; and the story's **chapters**, which set goals and pay rewards. All three are checked at
night.

```
 the day: plant, tend, ship, gather ──► End the day ──► night step 8, the goals check:
                                                          1. the Diary pays what's reached (milestones, rows)
                                                          2. the Farm Rank's points are recomputed
                                                          3. every goal met? the chapter completes: 500g, the Mill's
                                                             plans, its arrival; the next chapter opens
                                                          4. the Diary and the rank again (her arrival, +250 points)
                                                          ▼
 the morning: "Chapter 1 done", "Farm Rank 2 · …", "First Uma at Hand · +300g" ──► the closing scene
```

#### The Farm Rank

The farm's own rank, 1 to 10. Its points are recomputed from the save each night at step 8:

> **⌊gold shipped ÷ 100⌋ + 5 × Diary entries + 25 × milestones + 250 × chapters done**

Every term only grows, so the rank never falls. During the day the rank stays as last night left it: what you ship
today counts tonight. Where the points come from:

<!-- live:farm-rank-points -->
| Source | Points | Read from |
|---|---|---|
| Gold shipped at the bin | 1 per 100g | `farm.counts['gold-shipped']` |
| A Diary entry: a good shipped once | 5 | `diary.shipped` |
| A milestone | 25 | `diary.milestones` |
| A chapter done | 250 | `farm.chapter` − 1 |
<!-- /live -->

Festivals and decorations add nothing in play: neither exists. The points each rank needs:

<!-- live:farm-ranks -->
| Farm Rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 150 | 500 | 1,200 | 2,400 | 4,000 | 6,500 | 10,000 | 15,000 | 22,000 |
<!-- /live -->

What each rank opens is read from the rules that gate on it (the Fields' blocks, the Dorm's levels, the shop's seed
tiers, the stations), so the sheet and the morning can't drift from the game. A new rank opens more of what's already
open, not new places:

<!-- live:farm-rank-opens -->
| Farm Rank | Points | Opens |
|---|---|---|
| 1 | 0 | Block A, tier-1 seeds (the start); Dorm level 2 |
| 2 | 150 | Block B (800g), Dorm level 3 (7 beds), New seeds at the shop |
| 3 | 500 | Dorm level 4 (9 beds), The Sawmill (1,500g), The Smokehouse (2,000g) |
| 4 | 1,200 | Block C (3,000g), Dorm level 5 (11 beds), New seeds at the shop |
| 5 | 2,400 | Dorm level 6 (14 beds) |
| 6 | 4,000 | Block D (8,000g), Dorm level 7 (17 beds) |
| 7 | 6,500 | Dorm level 8 (20 beds) |
| 8 | 10,000 |  |
| 9 | 15,000 |  |
| 10 | 22,000 | The farm’s gold crest |
<!-- /live -->

- **A rank-up is news:** the morning's New today says "Farm Rank 2 · Block B (800g), Dorm level 3 (8 beds), New seeds at
  the shop", tagged Farm Rank, opening the rank's sheet. Two ranks in one night are two lines, lowest first.

#### The Diary

The Diary counts what the farm has shipped and pays for it.

- **Entries:** each good shipped at least once is an entry, worth **5 Farm Rank points**. Seeds never ship, so they're
  never entries.
- **Collection rows:** a family's ten raw goods, or its ten refined ones, each shipped at least once, completes a row;
  the ten rings are a row of their own, the 27th. A row pays **500g once**. It isn't a milestone and adds no points of
  its own (its goods are already entries). Each ring shipped is an entry.
- **Milestones** each pay their gold **once** and are worth **25 Farm Rank points**.
- **When they pay:** milestones and rows are checked at night step 8 and paid that night, their gold with the bin's,
  milestones first in their list order, then rows. Each is listed in the morning's New today ("10,000g shipped · +300g",
  "Woods: every grade shipped · +500g"), tagged Milestone, opening the Diary.
- **Umas on the roster** counts the whole roster, the opening three included, so a fifth Uma pays 300g.
- **Depth** counts each forest area and fishing spot past the first. It pays the first night a haul comes home from
  there; the Woods and the Pond are open on day 1 and pay none.
- **Ranks** pay for the first Uma to reach each rank in any activity.

The milestones:

<!-- live:milestones -->
| Milestone | Id | Gold | Points |
|---|---|---|---|
| 10,000g shipped at the bin | `shipped:10000` | 300g | 25 |
| 50,000g shipped at the bin | `shipped:50000` | 1,000g | 25 |
| 100,000g shipped at the bin | `shipped:100000` | 2,000g | 25 |
| 250,000g shipped at the bin | `shipped:250000` | 4,000g | 25 |
| 500,000g shipped at the bin | `shipped:500000` | 8,000g | 25 |
| 1,000,000g shipped at the bin | `shipped:1000000` | 15,000g | 25 |
| 5 Umas on the roster (the starters count) | `recruited:5` | 300g | 25 |
| 10 Umas on the roster (the starters count) | `recruited:10` | 1,000g | 25 |
| 20 Umas on the roster (the starters count) | `recruited:20` | 2,500g | 25 |
| 40 Umas on the roster (the starters count) | `recruited:40` | 6,000g | 25 |
| 60 Umas on the roster (the starters count) | `recruited:60` | 10,000g | 25 |
| The first Uma at Hand, in any activity | `rank:hand` | 300g | 25 |
| The first Uma at Skilled, in any activity | `rank:skilled` | 600g | 25 |
| The first Uma at Expert, in any activity | `rank:expert` | 900g | 25 |
| The first Uma at Master, in any activity | `rank:master` | 1,200g | 25 |
| The first Uma at Legend, in any activity | `rank:legend` | 1,500g | 25 |
| The first haul from the Hills | `depth:hills` | 500g | 25 |
| The first haul from the Old Forest | `depth:old-forest` | 500g | 25 |
| The first haul from the Mountain | `depth:mountain` | 500g | 25 |
| The first haul from the Misty Vale | `depth:misty-vale` | 500g | 25 |
| The first haul from the World Tree | `depth:world-tree` | 500g | 25 |
| The first haul from the River | `depth:river` | 500g | 25 |
| The first haul from the Lake | `depth:lake` | 500g | 25 |
| The first haul from the Falls | `depth:falls` | 500g | 25 |
| The first haul from the Moon Pool | `depth:moon-pool` | 500g | 25 |
| The first haul from the Sea Pier | `depth:sea-pier` | 500g | 25 |
| The first haul from the Deep Sea | `depth:deep-sea` | 500g | 25 |
| The first crop at level 5 | `crop-level:5` | 500g | 25 |
| The first crop at level 10 | `crop-level:10` | 500g | 25 |
<!-- /live -->

The collection rows:

<!-- live:diary-rows -->
| Row | Id | Its ten goods | Gold |
|---|---|---|---|
| Grains | `row:grains` | Wheat, Oats, Barley, Rice, Corn, Rye, Buckwheat, Wild Rice, Moonrice, Sunwheat | 500g |
| Vegetables | `row:vegetables` | Carrot, Potato, Cabbage, Onion, Tomato, Bell Pepper, Eggplant, Asparagus, Golden Carrot, Emperor Pumpkin | 500g |
| Herbs and spices | `row:herbs-spices` | Basil, Mint, Rosemary, Thyme, Ginger, Peppercorn, Cinnamon, Saffron, Mandrake, Phoenix Pepper | 500g |
| Nuts and seeds | `row:nuts-seeds` | Peanut, Sunflower Seed, Sesame, Walnut, Chestnut, Almond, Pistachio, Macadamia, Thundernut, Worldseed | 500g |
| Sweets | `row:sweets` | Honeycomb, Sugarcane, Sugar Beet, Maple Sap, Cacao Pod, Vanilla Pod, Agave Heart, Palm Sap, Fairy Honeycomb, Ambrosia Blossom | 500g |
| Fruits | `row:fruits` | Apple, Pear, Peach, Plum, Orange, Grape, Mango, Pomegranate, Starpeach, Golden Apple | 500g |
| Mushrooms | `row:mushrooms` | Button Mushroom, Shiitake, Oyster Mushroom, Enoki, Chanterelle, Porcini, Morel, Truffle, Glowcap, King Reishi | 500g |
| Woods | `row:woods` | Pine Log, Birch Log, Cedar Log, Maple Log, Oak Log, Cherry Log, Mahogany Log, Ebony Log, Elderwood Log, Yggdrasil Branch | 500g |
| Ores | `row:ores` | Copper Ore, Tin Ore, Iron Ore, Silver Ore, Cobalt Ore, Gold Ore, Platinum Ore, Titanium Ore, Mythril Ore, Orichalcum Ore | 500g |
| Stones | `row:stones` | Limestone, Sandstone, Slate, Granite, Basalt, Marble, Obsidian, Jade, Runestone, Meteorite | 500g |
| Crystals | `row:crystals` | Quartz, Amethyst, Citrine, Garnet, Emerald, Sapphire, Ruby, Diamond, Starstone, Philosopher's Stone | 500g |
| Fish | `row:fish` | Carp, Trout, Sardine, Mackerel, Salmon, Sea Bream, Eel, Tuna, Silverfin, Rainbow Koi | 500g |
| Hides and scales | `row:hides-scales` | Puffbun Pelt, Boarling Hide, Wolfkin Pelt, Rock Lizard Scale, Ironback Hide, Basilisk Scale, Manticore Hide, Behemoth Hide, Wyvern Scale, Dragon Scale | 500g |
| Bones and horns | `row:bones-horns` | Seashell, Ammonite, Trilobite, Fossil Bone, Mammoth Tusk, Saber Fang, Raptor Claw, Tyrant Tooth, Titan Bone, Unicorn Horn | 500g |
| Essences | `row:essences` | Mist Essence, Dew Essence, Breeze Essence, Ember Essence, Tide Essence, Spark Essence, Glimmer Essence, Shadow Essence, Aether, Prismatic Essence | 500g |
| Grains, refined | `row:grains:refined` | Wheat Flour, Rolled Oats, Pearl Barley, Polished Rice, Cornmeal, Rye Flour, Buckwheat Flour, Hulled Wild Rice, Moonrice Flour, Sunwheat Flour | 500g |
| Herbs and spices, refined | `row:herbs-spices:refined` | Dried Basil, Dried Mint, Dried Rosemary, Dried Thyme, Ground Ginger, Ground Pepper, Ground Cinnamon, Saffron Threads, Mandrake Powder, Phoenix Spice | 500g |
| Nuts and seeds, refined | `row:nuts-seeds:refined` | Peanut Butter, Sunflower Oil, Sesame Paste, Walnut Paste, Chestnut Paste, Almond Paste, Pistachio Paste, Macadamia Butter, Thundernut Oil, Worldseed Oil | 500g |
| Sweets, refined | `row:sweets:refined` | Honey, Cane Sugar, Beet Sugar, Maple Syrup, Chocolate, Vanilla Extract, Agave Syrup, Palm Sugar, Fairy Honey, Ambrosia | 500g |
| Fruits, refined | `row:fruits:refined` | Apple Preserve, Pear Preserve, Peach Preserve, Plum Preserve, Orange Marmalade, Grape Jelly, Mango Pulp, Pomegranate Molasses, Starpeach Nectar, Golden Apple Preserve | 500g |
| Mushrooms, refined | `row:mushrooms:refined` | Dried Button Mushroom, Dried Shiitake, Dried Oyster Mushroom, Dried Enoki, Dried Chanterelle, Dried Porcini, Dried Morel, Shaved Truffle, Glowcap Powder, Reishi Powder | 500g |
| Woods, refined | `row:woods:refined` | Pine Plank, Birch Plank, Cedar Plank, Maple Plank, Oak Plank, Cherry Plank, Mahogany Plank, Ebony Plank, Elderwood Plank, Yggdrasil Plank | 500g |
| Ores, refined | `row:ores:refined` | Copper Ingot, Tin Ingot, Iron Ingot, Silver Ingot, Cobalt Ingot, Gold Ingot, Platinum Ingot, Titanium Ingot, Mythril Ingot, Orichalcum Ingot | 500g |
| Stones, refined | `row:stones:refined` | Limestone Block, Sandstone Block, Slate Block, Granite Block, Basalt Block, Marble Block, Obsidian Block, Jade Block, Runestone Block, Meteorite Block | 500g |
| Crystals, refined | `row:crystals:refined` | Cut Quartz, Cut Amethyst, Cut Citrine, Cut Garnet, Cut Emerald, Cut Sapphire, Cut Ruby, Cut Diamond, Cut Starstone, Cut Philosopher's Stone | 500g |
| Fish, refined | `row:fish:refined` | Carp Fillet, Trout Fillet, Sardine Fillet, Mackerel Fillet, Salmon Fillet, Sea Bream Fillet, Eel Fillet, Tuna Fillet, Silverfin Fillet, Rainbow Koi Fillet | 500g |
| Rings | `row:rings` | Ring G1, Ring G2, Ring G3, Ring G4, Ring G5, Ring G6, Ring G7, Ring G8, Ring G9, Ring G10 | 500g |
<!-- /live -->

#### The chapters

The story runs in chapters. Chapter 1 opens on day 1. Each goal reads a lifetime counter or the save; a counter counts
**from the chapter's start**, so a later chapter's goals start from zero.

**Chapter 1, "A Field Again":**

<!-- live:chapter-1 -->
| # | Goal | Done at | Read from | Teaches |
|---|---|---|---|---|
| 1 | Plant and harvest 9 crops | 9 | `farm.counts['plots-harvested']` since the chapter opened | Planting, tending, Ready plots |
| 2 | Ship 1,000g at the bin | 1,000g | `farm.counts['gold-shipped']` since the chapter opened | The bin, the overnight payout |
| 3 | Bring home 10 things from the Woods or the Pond | 10 | `farm.counts['home:forest']` + `['home:fishery']` since the chapter opened | Assigning, the job sheet, collecting |
| 4 | Grow a second kind of crop | 2 | Kinds planted: entries in `crops` | The shop |
| 5 | Rank an Uma up to Hand | 1 | Any Uma at Hand or above, in any activity | Ranks and challenges |
| 6 | Reach Farm Rank 2 | 2 | The Farm Rank from `farm.points` | The Farm’s Rank, Block B |
<!-- /live -->

- **Goal 4 is planting:** a second kind planted counts, ready or not.
- **Goal 3** counts everything collected from the forest or the Fishery since the chapter opened.
- **Goal 5** counts any Uma at Hand or above in any activity, whenever she got there.
- **The chapter completes at night step 8** the night its last goal is met, whether the goal was met during the day (a
  ninth harvest) or by the night itself (the bin's payout, a rank-up at step 6, Farm Rank 2 from tonight's milestones).
- **Its reward is paid at once:** **500g**, **the Mill's plans** (the Mill's quick look then offers Build · 1,200g;
  plans already held are left alone), **the chapter's arrival** (see *Chapter arrivals*), and the chapter's **250 Farm
  Rank points**. Then chapter 2 opens.
- **The morning** says "Chapter 1 done · +500g, the Mill's plans, a new hand, 250 Farm Rank points", tagged Chapter,
  opening the Diary, and her arrival is listed under Hearts. "A new hand" shows only when the cast has an Uma who
  arrives with chapter 1, on chapter 1's card, the Diary's card and the morning's line alike; with none the reward reads
  "+500g, the Mill's plans, 250 Farm Rank points".

The chapters as built:

<!-- live:chapters -->
| Chapter | Title | Opens with | Goals | Reward |
|---|---|---|---|---|
| 1 | A Field Again | The Fields, the Woods and the Pond | 6 | 500g, the Mill's plans (`buildings.mill = 0`), the chapter’s authored arrival, 250 Farm Rank points |
| 2 | Feathers and Fences | The Coop and two chickens (Dale Hart) | Not built yet | — |
<!-- /live -->

- **Chapter 2** has a title and an opening line but no goals: its card says **Soon**, and no chapter completes again.
- Reaching chapter 2 opens the Coop and the Barn on the map, which say Soon. Later chapters would open the rest (the
  Mine and the Quarry with 3, the Kitchen 4, the expedition post 5, the Restaurant 6, the Forge 7).

#### The night's goals check

Night step 8's goals check runs after the Dorm and the arrivals:

1. **The Diary pays** every milestone and row reached and not yet paid.
2. **The Farm Rank's points** are recomputed.
3. **The chapter:** if every goal of the current chapter is met, it completes (its gold, plans, arrival and the next
   chapter), then the Diary pays and the points are recomputed again, so her arrival counts toward "Umas on the roster"
   and the chapter's 250 points toward the rank.
4. **The ranks reached tonight** are noted, lowest first, from the rank before the night.

The morning's New today then lists, in order: the season and festivals, the chapter done, each Farm Rank reached, each
milestone and row paid, then the household's milestones and the Dorm's news.

#### The town's cast

The town's people are original to the game, and their names and lines are part of it. In a chapter scene an Uma speaks
only in a **role** the app fills at runtime; her own lines are her arrival scene and her events, from the story pack.

<!-- live:cast -->
| Who | Is | From chapter | Bust |
|---|---|---|---|
| Mayor Hollis Pryor | Runs the town; opens each chapter | 1 | `cast/hollis-pryor` |
| Marta Quill | Keeps the general store (the shop) | 1 | `cast/marta-quill` |
| Old Ben Carver | Kept the farm before you; gives the first seeds | 1 | `cast/ben-carver` |
| Dale Hart | Rancher; sells animals and feed | 2 | `cast/dale-hart` |
| Gus Talbot | Retired miner; reopens the Mine and the Quarry | 3 | `cast/gus-talbot` |
| Rosa Bell | Cook; judges the Cooking Contest, first guest at the Restaurant | 4 | `cast/rosa-bell` |
| Juno Park | Runs the expedition post | 5 | `cast/juno-park` |
| Ida Stone | Smith; lights the Forge | 7 | `cast/ida-stone` |
| Captain Nils Berg | Sails the boat to the deep sea | 7 | `cast/nils-berg` |
| Wren Ashby | Rival: Ashby Orchards, crops and cooking | 1 | `cast/wren-ashby` |
| Cole Varga | Rival: Varga Ranch, animals and fishing | 1 | `cast/cole-varga` |
<!-- /live -->

- **Your newest hand** is the role in the closing scene: chapter 1's authored arrival. With none, her line is left out.
- Chapter 1's scenes speak three of the cast (the Mayor, Marta Quill and Old Ben Carver) and name a fourth (Dale Hart);
  Ida Stone speaks at the ring bench. The others are defined, with the chapter that first brings them, but have no
  scenes.
- Each cast member shows as a coloured disc with the first letter of their given name.

#### The scenes

Each scene plays once: played through or skipped, it's marked read and never plays again. Which scene plays now:

- **Nothing plays until the farmer is named.**
- **The opening scene, "The Overgrown Farm",** on day 1, once you're named. The Mayor greets you by name, Old Ben gives
  the nine Carrot seeds, Marta shows the shop and the bin, and the opening's Umas come up the road: its last line counts
  them ("Three Umas come up the road." for the stand-in's three; "An Uma comes up the road." for one). Reading it or
  skipping it brings them, and each then plays her own arrival scene, the last ending on chapter 1's card. An opening
  that brings nobody drops that line and ends on chapter 1's card.
- **The closing scene, "First Shipment",** the morning after chapter 1 completes, once the morning summary is put away.
  Its newest hand is chapter 1's authored arrival.
- **The ring bench's scene,** the morning after the first Romance 8 event, once the summary is put away: after any
  chapter scene, before arrivals.
- **Arrival scenes,** after those, in the order the Umas joined.

The lines, one to a tap:

<!-- live:scenes -->
**The Overgrown Farm** (`scene:1:open`)

| # | Who | Line |
|---|---|---|
| 1 | (narration) | Morning at the farm gate. The weeds stand as high as the fence. |
| 2 | Mayor Hollis Pryor | “Welcome, {farmer}! I’m Hollis Pryor, mayor of the town down the road.” |
| 3 | Mayor Hollis Pryor | “This farm has stood empty since Old Ben retired. The whole town hopes you can wake it up.” |
| 4 | Old Ben Carver | “I kept one block tilled, just in case. Here: nine Carrot seeds to start you off.” |
| 5 | Old Ben Carver | “A tended row grows faster. Tap a plot, then pick who tends it.” |
| 6 | Marta Quill | “Marta Quill, from the general store at the town edge. The shop is open whenever you need seeds.” |
| 7 | Marta Quill | “And that’s the shipping bin. Anything you put in pays tonight.” |
| 8 | Mayor Hollis Pryor | “You’ll want help with all this. I hear some is on its way.” |
| 9 | (narration) | Three Umas come up the road. |

**First Shipment** (`scene:1:close`)

| # | Who | Line |
|---|---|---|
| 1 | (narration) | Word of the farm’s shipments has reached the town. |
| 2 | Mayor Hollis Pryor | “Marta and I couldn’t stay away. The whole town heard about that bin!” |
| 3 | Marta Quill | “Keep it full, and my shelves will follow.” |
| 4 | (narration) | Old Ben unrolls a set of plans. |
| 5 | Old Ben Carver | “A mill. Build it beside the Fields, and your grain comes back as flour.” |
| 6 | (narration) | A visitor walks in at the Gate. |
| 7 | Your newest hand | “I’m {name}. I heard this farm is coming back to life. May I stay?” |
| 8 | (narration) | A wagon rattles up the road. |
| 9 | Mayor Hollis Pryor | “That’ll be Dale Hart, the rancher. He’ll bring you two chickens once there’s a coop to keep them in.” |
<!-- /live -->

Ida Stone first appears at the ring bench. The romance part covers the bench; its scene's lines are:

<!-- live:bench-scene -->
**The Ring Bench** (`scene:bench`)

| # | Who | Line |
|---|---|---|
| 1 | (narration) | A cart creaks up from town and stops at the old Forge. |
| 2 | Ida Stone | “Ida Stone. I keep the smithy down in town. Old Ben said this Forge was still standing.” |
| 3 | (narration) | She runs a hand along the cold hearth, then looks at you. |
| 4 | Ida Stone | “The fire can wait for another year. But a bench by the door, that I can set up today.” |
| 5 | Ida Stone | “Bring three refined goods of one grade, and you’ll make a ring of that grade. Planks, fillets, flour: whatever you have.” |
| 6 | Ida Stone | “One ring a day, and no charge. Word in town is that someone on this farm has your heart.” |
| 7 | (narration) | The Forge’s door stays open. A small bench waits inside, by the light. |
<!-- /live -->

#### The Diary tab

The Diary tab (`/diary`) holds the current chapter, the Farm Rank and the milestones.

- **The chapter's card:** "Chapter 1", its title and "4 of 6"; each goal with a check when met and its count in its own
  unit: "4 / 9" (harvests and things brought home), "620g / 1,000g", "1 / 2 kinds", "Not yet" or "Done" (the Hand goal),
  "Farm Rank 1 / 2". Counts stop at the goal. Then "Reward: +500g, the Mill's plans, a new hand, 250 Farm Rank points".
- **Once chapter 1 is done:** "Chapter 1 done · …" with its reward, chapter 2's title and **Soon**.
- **Farm Rank · 400 points ›** opens the rank's sheet.
- **Milestones:** each milestone and row paid, in the order paid, with its gold ("10,000g shipped · +300g"), or "None
  yet."; then "12 goods shipped so far".
- **Memories** (each Uma's) and **Conversations** (the pairs'): the romance part covers them.
- Its help says how chapters, goals, milestones, Memories and Conversations work.

#### The Farm Rank's chip and sheet

- **The chip** is the account bar's third, after the date and the gold: the Farm Rank's crest (a green "FR" shield
  when the art can't load) and the rank. It reads "Farm Rank 2: 400 points" to a screen reader, and a tap opens the
  sheet.
- **The sheet** opens over any page: "Farm Rank 2", the points, a bar to the next rank with "100 more for Farm Rank 3
  (500)" (or "The top rank"), what the next rank opens, and the points so far by source: Shipping (1 per 100g), Diary
  entries (5 each), Milestones (25 each), Chapters (250 each). Its help explains where points come from.

#### The scene player

- **A full-screen sheet** over the farm and its bars: the scene's title and **Skip** at the top; a bust (a cast
  member's disc, an Uma's bust from master data, none for narration); the speaker's name in the accent colour and the
  line (narration in italics); and "Tap to go on · 3/12". A tap anywhere goes on.
- **Roles are filled once,** when the scene starts.
- **It loads master data itself** (names and busts), since a new farm's boot doesn't wait for it. **Skip** works
  without it, and skipping marks the scene read.
- **The opening ends** as the three come up the road: reading it brings them, and their arrival scenes play next. The
  third ends on **chapter 1's card:** its six goals, its reward and **Plant the carrots**, which opens the Fields.
- **The closing scene ends on** "Chapter 1 done", its reward, chapter 2's title with **Soon**, and **Start the day**.
- The same player plays the arrival scenes and the ring bench's scene; heart events play in their own player. The
  romance part covers them.

## Part 3 — Hearts: the cast and the romance

> **The romance is the game's.** It plays on save v4 from the story pack: the farm's Umas are only the authored cast,
> who walk in when the story says, and **Hearts** is the bottom bar's second tab (Farm · Hearts · End the day · Diary ·
> Menu), with the roster's album as its Work view. A save from before v4 starts over as a new farm (see
> [Save versions](#save-versions)).

### The cast and the story pack

Every Uma on the farm is one of **the cast**: one character each, keyed by her character id everywhere the
save names an Uma (the roster, her route, the Dorm, work, bonds, Memories and arrivals). She plays one outfit, walks in
when the story says, and has a route of her own.

#### What the pack holds

The pack is a folder of JSON files, kept out of git. **It's a menu, not a checklist:** every part is optional, any number
of characters is fine, in any order, and nothing is counted. [The story pack's menu](story-pack.md) lists every field the
game reads, what it does in play, and what plays when it's missing.

| File | Holds | Without it |
|---|---|---|
| Cast | The cast, in its order: each character's id and, optionally, her outfit, calling, birthday, trigger to meet, chapters and arrival; the welcome list; the opening | No characters |
| Ties | Each tie: two characters and, optionally, its kind, a strength of 1–3 and a line | No ties |
| Her bible (one per Uma) | Optionally her favourite line, gifts (loved, liked, disliked, any number each), her route's beats, chat sets, keepsake, pet name, wedding places and wishes. Her profile texts, season and festival are the story's own | Her calling's line, neutral tastes, her temperament's chats |
| Her route (one per Uma) | Her scripted events, by rung, any of them | Her arrival is the game's own short scene; her other events wait |
| A pair's conversations | Conversations at bond levels 1–5 for a tie's two Umas | The tie's line |
| The household | Household scenes at 5, 10 and 15 married, house lines and the finale, every part optional | No household scenes; house lines from her temperament |

**One reader, two kinds of findings.** The game, the release and the Farm Story Sandbox read a pack with one reader
(`readStoryPack`):

| | What | What happens |
|---|---|---|
| **An error** | Only what the game can't read: a file that isn't JSON or isn't the shape the game reads, a value the game can't use where it reads it, or a line longer than its screen | It skips the one part it's in (a line, a field, a beat, an event, a bond level, a tie, a character, at most a file); the rest plays |
| **A note** | Everything else: what isn't written yet, an unusual count, a word that genders the farmer, a bible and the tag sheet disagreeing | Nothing: notes block nothing |

**The game's backbone** stays as built, and the story writes any of it: her arrival ("event zero"), Friendship 1–10,
her confession, Romance 1–10, the proposal, the wedding and Spouse 1, 3 and 5 are the 27 rungs the game plays an event
at. A beat says, each optional:

- **its setup:** her full bar only, or one thing the player controls: she works an activity, a named good is in the
  Warehouse, her bond with a named Uma reaches a level 1–5, or a chapter 1–8 is reached. Never an hour, the weather, a
  season or a festival;
- **what you do together:** talk, work an activity, one of the ten date games (fishing, cooking, stargazing, footrace,
  dance, picnic, market, boat, walk, crafting), give a named good, or help another cast Uma;
- **its caption** (the Memory's line), **its hint** (what her profile says while it's next), its place, and **an
  unlock:** an item, a place or a perk in words.

**A scripted event** is a list of steps: a line said by a cast Uma or the town's cast (with an optional emote: happy, shy,
sad, angry, surprised, thinking, laughing or tender), narration, a thought, a pause, a change of place, a flag, a branch
on a flag, a choice, or a play.

- **A choice** has any number of options, each with its text, an optional tone (warm, playful or honest) and an authored
  gain that ranks the options. An option may cost a count of a good, reveal one of her gift tastes, or carry steps that
  follow it.
- **The usual sizes,** a note when an event leaves them, never a refusal: a heart event has 1–2 choice points and at most
  one play on every path; the confession, the proposal and the wedding 1–3 choice points and at most three plays; a
  choice two or three options.
- **The confession's last choice point** holds one Yes and one Not yet. An option there without an answer counts as
  Yes; answers anywhere else are ignored (a note).
- **Her arrival** usually has one choice point and no play. Written with none it pays +50 alone; with more, the first
  pays.

**Every line** is within its screen's length (an error otherwise) and, as notes, follows three rules: `{farmer}` is the
only placeholder; no word genders the farmer (husband, wife, boyfriend, girlfriend, groom, sir and the like, in anyone's
lines, and bride in the farmer's own); nothing reads as school. A flag's name is one the save can keep (lowercase
letters, digits and `- . : _`), and an option's cost and reveal name goods the game has: the save keeps them, so each is
an error otherwise.

#### The menu's welcome list, her trigger and her chapters

The cast file also gives, all optional, three things the game reads now and acts on as meeting her and her chapters
land:

| Item | What it is | Without it |
|---|---|---|
| **The welcome list** (`welcome`) | Who comes to the farm in the first days, in order, any number | The first five of the cast, in its order |
| **Her trigger to meet** (`meet`) | From the trigger menu: talks on *n* days, a gift, a town spot, a season, a festival, a Farm Rank, a place built, a good shipped, or after another character's event | Talk with her on three different days |
| **Her chapters** (`chapters`) | Their titles, which of her rungs each holds, and an optional gate from the same menu | Four: "Getting to know her" (her arrival, F1–F10, the confession), "Together" (R1–R10, the proposal), "The wedding", "Married life" (S1, S3, S5) |

The domain reads them through `welcomeOf`, `meetOf` and `chaptersOf`, each with its default.

#### The pack at runtime

The game holds the cast, the ties, each bible by character id, the event ids each route scripts, the bond levels each
tie's pair has a conversation at, and the household. Routes and pairs' conversations load on demand, the first time
they're needed.

- **Read, never refused.** Every part is read on its own: a part with an error is skipped and the rest plays, so a pack
  never stops the game. An unscripted rung waits ("Her story is still being written"), a pair's unwritten level gets the
  tie's line, a household beat not yet written is skipped, and a character without a bible plays on her calling.
- **What a missing part plays today:** a missing outfit shows a lettered disc ("An Uma"); a missing calling and favourite
  line leave her with no line; a missing arrival leaves her off the farm until the opening or meeting her brings her; a
  missing arrival scene plays the game's own; missing wedding places play the farm's. Placeholders for every read come
  next.
- **The save holds ids only:** her character id, rung ids, flags, counts. Never a line of the story.

#### One outfit each, and the resolver

- **Her outfit** is the cast file's: the game never chooses. Her face, bust, talents and temperament come from that
  outfit; her name is her character's. Talents aren't saved, so a changed outfit shows on the next boot. Without one, she
  plays as her character id, which master data doesn't hold as an outfit, so she shows a lettered disc.
- **One resolver** turns a roster id into the outfit it plays: the cast's outfit, or the id itself for someone the cast
  doesn't hold. The app sees
  master data through it, so faces, busts, names, talents, temperaments and pickers all follow the cast with nothing else
  to change.
- **A character master data doesn't hold** shows a lettered disc (her name's first letter and its number, "S1") and reads
  D talents in every activity. The stand-ins are named "Stand-in 1" to "Stand-in 3"; any other unknown character (one a
  release drops, or one with no outfit) is "An Uma".

#### The stand-in pack

The repo carries an invented stand-in pack in the private pack's layout, so the romance is built and tested without a real
character, name or line. Its first Uma, a farmer, has her whole route and every optional field; the forager and the fisher
have only their arrival scenes and no bible, so "still being written" and the calling's fallback are exercised. None of
the three outfits is in master data, so all three show lettered discs. The three stand-ins:

<!-- live:stand-in -->
| Character | Outfit | Calling | Favourite line | Arrives | Bible | Scripted |
|---|---|---|---|---|---|---|
| 9000001 | 900000101 | farming | farming | opening | Yes | 27 of 27 |
| 9000002 | 900000201 | foraging | foraging | opening | No (her calling stands in) | 1 of 27 |
| 9000003 | 900000301 | fishing | fishing | opening | No (her calling stands in) | 1 of 27 |
<!-- /live -->

#### How the app gets the pack

- **The release** reads the private pack with the game's own reader and **releases any pack**, partial or not: it lists
  what it skipped (the errors) and the notes, and refuses only when there's no pack folder. It holds the pack as the game
  reads it, every broken part already skipped and every other field kept, and always a cast and a ties file (empty when
  the pack has none). It writes each file minified, named with the first 8 hex of its SHA-256
  (`story/<name>.<hash8>.json`), and an index, `story.json`: every file with its path, size and hash, the event ids each
  route scripts, and the bond levels each pair holds. The same pack gives the same release.
- **The publish** uploads the hash-named files first and the index last, to a private bucket. Old files stay, so a phone
  holding an older index still reads it.
- **farm-api serves it** to the owner only: the index fresh on every read, the hash-named files cached for good, and
  nothing else (404).
- **On the phone,** the boot reads the index, then the cast, the ties, the bibles and the household; each route and pair
  loads when it's first needed. Every file is checked against the index's hash and kept in the content cache, so a
  release's file downloads once. The boot and the night wait for the pack, as they wait for master data.
- **The last good index stays on the phone.** When the index can't be read (offline, or the server failing), the boot
  plays the last version kept. The phone reads each file with the same reader, so a broken part is skipped there too. A
  release that can't load (no index and none kept, a file whose hash doesn't match, a route or pair that isn't what the
  index lists) stops the boot with **Try again**.
- **The stand-in is the dev server's only:** it plays when farm-api serves no pack, or when it's asked for (as the tests
  do). The production build holds none of it, and the build's size check refuses one that does.

### The opening, the farmer's name, and arrivals

#### The farmer's name

The first screen on a new farm covers everything until it's entered: **"What should they call you?"**, one field and
**Continue**, which stays off until the name fits. The words under the field say why ("Enter a name", "Letters, spaces, '
and - only", "16 characters at most"). Entering it is the farm's first player change. **Menu → Account → Your name**
renames the farmer under the same rule.

The rule, and where the name shows:

<!-- live:farmer-name -->
| Rule | Detail |
|---|---|
| Characters | Letters of any script (with their accents), spaces, apostrophes (' and ’) and hyphens |
| Length | 1–16 characters, after trimming and collapsing inner runs of spaces |
| Default | None: an empty field with a grey “Farmer” |
| Where it shows | `{farmer}` in every line, filled when the line shows; the save holds the name, never story text |
<!-- /live -->

No pronouns and no gender are asked, and the farmer is never drawn: lines say "you".

#### The opening

Day 1 runs in this order:

1. **The name sheet.** Nothing else plays while the farmer is unnamed.
2. **"The Overgrown Farm".** The Mayor at the gate welcomes you by name, Old Ben gives the nine Carrot seeds and
   explains the tended row, Marta shows the shop and the bin, and three Umas come up the road.
3. **Reading it or skipping it brings the opening's Umas,** any number, in order: the cast file's `opening`, else those
   whose arrival is the opening, else the welcome list. They're home in the Dorm at Friendship 0 while a bed is free
   (day 1 has three), the rest away, their ties seeded. Its last line counts them ("An Uma comes up the road.", "Five
   Umas come up the road.").
4. **Each one's arrival scene,** in the cast's order. The last ends on chapter 1's card and **Plant the carrots**, which
   opens the Fields. An opening that brings nobody ends on chapter 1's card itself.

Nothing is picked or drawn. Chapter 1's reward names **a new hand** only when the cast has an Uma who arrives
with chapter 1, and never says who; with none it reads "+500g, the Mill's plans, 250 Farm Rank points", and the Diary and
the morning's "Chapter 1 done" line say the same. The closing scene, "First Shipment", names chapter 1's arrival as your
newest hand; with none, her line is left out.

The opening's lines are in [the scenes](#the-scenes).

#### Arrivals

Each Uma's arrival is her cast entry's, and it's optional. The five kinds, and when each one is checked:

<!-- live:arrivals -->
| Arrival | When she arrives | Checked |
|---|---|---|
| `opening` | The opening scene, day 1: read or skipped, it brings the opening’s Umas: the cast file’s `opening` list, else those whose arrival is the opening, else the welcome list | The opening scene |
| `chapter` | The night chapter *n* completes, in place of a drawn recruit (chapter 1 today; chapters 2–7 once they’re built) | Night step 8, `checkGoals` |
| `festival` | The morning of that festival’s day in its year (year 1 unless the cast names one), built or not | Night step 8, `arriveUmas` |
| `beds` | The morning the Dorm’s level *n* takes effect (levels 4–8) | Night step 8, `arriveUmas` |
| `event` | The morning after another Uma’s named event plays (`<characterId>:<eventId>`, or an event id: anyone’s) | Night step 8, `arriveUmas` |
<!-- /live -->

- **No arrival:** a cast Uma with none, and not in the opening, stays off the farm until meeting her in town brings her.
- **A state, checked each night** at step 8, after the Dorm settles: every cast Uma not on the roster whose arrival holds
  joins. A trigger already passed holds too, so she arrives that night.
- **She joins** home while a bed is free, else away on her off-season (the Dorm's swap brings her home), at Friendship 0
  with 0 points. Each of her ties whose other Uma is on the farm starts at its seed. Her chats and gifts work from that
  day; her events and evenings need her home.
- **In the cast's order** when several arrive the same night, and **once each.**
- **A chapter's arrival** joins inside the chapter's completion, the night its last goal is met, so the Diary's "Umas
  on the roster" counts her that night. It's the first cast Uma named for that chapter; any other named for it joins the next
  night with the step 8 check.
- **A Dorm-level arrival** may name any level 2–8; the design gives levels 4–8 one each. The Dorm's page marks a level
  that will bring someone ("Level 4 · 9 beds · someone new arrives"), never who.
- **The Gate** is where she walks in. Its quick look says "Umas arrive here." and what brings the next arrivals, never
  who, up to three: the next chapter, the next Dorm level and the next festival by date first, then a story event, then
  the rest ("Next: chapter 2's end · the Dorm's level 4 · the Fishing Derby"; a story event reads "a story event"). Once
  the whole cast is here it says "Everyone is here."
- **The morning** names her in the Hearts section, "‹name› arrived · away" with **New**, a tap opening her profile.

#### Her arrival scene

Her arrival scene plays the next time the farm opens with the morning summary put away: after the opening, any chapter
scene due and the ring bench's scene, in the order the Umas joined (by day, then the cast's order). The scene player shows
her lines with her bust (or her disc) and `{farmer}` filled, her emote as a word, narration, thoughts in italics, a title
line ("Stand-in 1 arrives · Gate"), pauses, flags (wording only) and **her choice**: usually one; written with none she
pays +50 alone, and with more the first pays.

- **Each option shows its gain on the button** before the tap.
- **Skip** jumps to the choice, never past it; after the choice, to the end. So every arrival pays.
- It ends on her bust, "♥ +80" (or +60) and **Welcome, ‹her name›**; the last of the opening's Umas ends on chapter 1's
  card instead.

What it pays into her Friendship 1 bar:

<!-- live:arrival-pay -->
| Her arrival scene | Points into her bar |
|---|---|
| Played or skipped to its end | +50 |
| Its choice: the option with the highest authored gain (each one tied at the top) | +30 |
| Its choice: any other option | +10 |
| Written with no choice | Nothing more |
| Written with more than one choice | The first pays; the rest are words only |
<!-- /live -->

It pays once and is stamped once. A route without her arrival scene plays a short fallback (a new face at the Gate, two
options worth +30 and +10). Any pack can leave one unwritten: the release notes it, and the fallback plays.

### Her favourite line and tastes

- **Her favourite line** is her bible's, else her calling's (a quarry calling is mining, at the Quarry). It is never
  master data's running strategy. It gives her **×1.2 rank points** in that activity, the mark on her face card, **+10 a
  night** when she works it, and every perk that works "at her line". Her anniversary item, morning items, night chores,
  signature dish, mentoring and the place a Walk favours all read it.
- **Her line's places:**

| Her line | Her places |
|---|---|
| Farming | The Fields (a block she tends) |
| Foraging | The forest and the Sawmill |
| Fishing | The Fishery and the Smokehouse |
| Mining | The Mine and the Smelter; with a quarry calling, the Quarry and the Cutter |
| Ranch | The Coop and the Barn |
| Cooking | The Kitchen |
| Serving | The Restaurant |
| Forging | The Forge |

- **Her tastes** are her bible's: loved, liked and disliked goods, any number of each. Everything else is neutral, a good not in
  the game yet counts as neutral, and an Uma without a bible finds every good neutral.
- **Her tastes show** in steps: her loved good from Friendship 1; any good once you've given it, or once an event's option
  or a Choose play has revealed it; every taste from Friendship 7.

### Her route

#### Stages and costs

One track per Uma, 26 rungs with an event, plus the spouse levels S2 and S4, which have no event and come at night when
their bar fills:

```
 F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   ◆    R1 R2 … R8 R9 R10   ◇      ◇       S1  S2  S3  S4  S5
 ─────── friendship ─────────  confession ── romance ─────  proposal wedding ──── spouse ─────
 200 240 280 … 560 (3,800)        0     200 … 560 (3,800)     0       0      600 600 600 600 600
 an event at every level          an event                   events: ring   events at S1, S3, S5
```

A friendship or romance heart costs 160 + 40 × its number; a spouse level costs 600:

<!-- live:route-costs -->
| Heart | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Ladder |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Friendship or romance** | 200 | 240 | 280 | 320 | 360 | 400 | 440 | 480 | 520 | 560 | **3,800** |
| Cumulative | 200 | 440 | 720 | 1,040 | 1,400 | 1,800 | 2,240 | 2,720 | 3,240 | 3,800 |  |
| **Spouse** | 600 | 600 | 600 | 600 | 600 |  |  |  |  |  | **3,000** |
| **A route**: the three waiting rungs cost 0 |  |  |  |  |  |  |  |  |  |  | **10,600** |
<!-- /live -->

- **A level is its event.** Her bar fills, her next event turns Ready, and the level comes when it plays. The cost
  leaves her points and the rest stays banked.
- **The moves:** Friendship 10 played leaves her waiting at her confession. Its Yes starts romance at Romance 0. Romance
  10 leaves her waiting for the proposal; the proposal makes her engaged, waiting for the wedding; the wedding makes her a
  spouse at Spouse 0 and marks her wedding day. Spouse 5 completes the route.
- **The waiting rungs cost nothing.** The confession, the proposal and the wedding are each Ready the day after the rung
  before; the proposal also needs a ring in the Warehouse.
- **Points never fall, and nothing is lost or locked.** Past a full bar they're **banked** ("+120 banked") and carry into
  the next bar when the event plays. While a waiting rung waits, every point banks into the next ladder.
- **Points are whole:** each pay rounds once, half up, after its factors. Once Spouse 5 has played nothing more is added.
- **Her level in words:** "New friend" at F0, "Friend · F7", "Friend · F10" while her confession waits, "Close friend"
  after a Not yet, "Partner" at R0, "Partner · R4", "Partner · R10" while the proposal waits, "Engaged" while the wedding
  waits, "Spouse", "Spouse · S2".

The bar's colour carries the ladder:

<!-- live:ladder-colours -->
| Ladder | Stages | Bar |
|---|---|---|
| Friendship | F0–F10, and her confession while it waits | coral `#f07a5c` |
| Romance | R0–R10, the proposal and the wedding while they wait | rose `#e0567a` |
| Spouse | S0–S5 (600 a level) | gold `#d9a227` |
<!-- /live -->

#### Points from every source

Every number shows before or as it's earned: the buttons say it ("Chat +15", "Praise +20"), the gift picker shows each
good's points, and a **"+N" floats from her face** (still, with reduced motion). Every act pays through one rule, which
applies the day's factors and says what it paid. The acts, what each pays and how often:

<!-- live:love-points -->
| Act | Points | Limit | Paid by |
|---|---|---|---|
| Chat (tap her) | +15 | Once a day each, home or away | `chatV4` |
| Gift (one good, its stars your choice) | Loved +60, Liked +30, Neutral +10, Disliked 0; × (1 + 0.1 a star above ★1) | One a day each; ×3 on her birthday | `giftV4` |
| Praise (a ★3+ day’s work, a rank-up, a Fine play) | +20 | Once a day, when earned | `praiseV4` |
| Her line (she worked it today) | +10 | Paid at night, step 6 | `payLines` |
| A festival together (its team or entry) | +50 | Once a festival a year each | `festivalTogether` (festivals aren’t built yet) |
| Her arrival scene | +50, and its choice (+10 or +30) | Once | `finishArrival` |
| A heart event | +50, its choices and its play’s grade | One of hers a day | `playEvent` |
| The evening (a hangout from F2, a date from R1) | Fine +60, Great +100, Perfect +150; ×1.5 in her favourite kind, on her birthday and on her anniversary, each once | One evening a day across all the Umas; two on some days from 10 married | `spendEvening` |
| An invitation said yes | +20 | With her first evening that day | `spendEvening` |
| A house morning | +30 each resident | The house you slept in | `houseMorning`, night step 9 |
| **On her anniversary** | ×2 on every act but the evening (×1.5 instead) | From year 2 of her marriage | `addLove` |
<!-- /live -->

- **The day's factors multiply once each:** a gift ×3 on her birthday; on her anniversary every act ×2 except the
  evening, which takes its own ×1.5 instead.
- **Chat** (tap her): +15, once a day each, home or away ("You've talked today."). Her line for the day is drawn by the
  account, the day and her id, so it's the same all day. Before Friendship 1 she speaks her temperament's lines; from
  Friendship 1, her own chat set for her stage: friend through her confession (Romance 0 included), partner from Romance 1
  to the wedding, spouse after it. A bible without chat sets keeps the temperament's lines.
- **Gift:** one good from the Warehouse at the stars you choose, once a day each, home or away ("One gift a day."; a seed
  is "That isn't a gift."). The good is used, and its taste is learnt. Stars multiply by 1 + 0.1 a star above ★1:

<!-- live:gift-stars -->
| Her taste | ★1 | ★2 | ★3 | ★4 | ★5 |
|---|---|---|---|---|---|
| Loved | 60 | 66 | 72 | 78 | 84 |
| Liked | 30 | 33 | 36 | 39 | 42 |
| Neutral | 10 | 11 | 12 | 13 | 14 |
| Disliked | 0 | 0 | 0 | 0 | 0 |
| Loved, on her birthday (×3) | 180 | 198 | 216 | 234 | 252 |
| Liked, on her birthday (×3) | 90 | 99 | 108 | 117 | 126 |
| Neutral, on her birthday (×3) | 30 | 33 | 36 | 39 | 42 |

A disliked gift pays 0 and she says one line: “She thanks you, a little puzzled.”
<!-- /live -->

- **The gift picker** lists the Warehouse by family, each good at each star held, with **its points for her today**
  (the birthday's ×3 and the anniversary's ×2 included), or **"?"** where her taste for it isn't known.
- **Praise:** she earns it for the day when her work that finished overnight made a ★3+ item, when she ranked up last
  night, or when a harvest today from the block she tends gave a ★3+ crop. Assisting a Fine-or-better workshop play is a
  cause too, but nothing pays that cause yet. **Praise +20** shows on her profile only while earned and
  unpaid, pays once, and both lists clear at night.
- **Her line:** at night, +10 to each Uma who worked today at one of her line's places (a running job there, or for a
  farmer a tended block with a growing plot). One a night each; a day elsewhere pays nothing.
- **A festival together:** +50 to each Uma on a festival's team or entry, once a festival a year each. The rule is
  written, but no festival pays it yet.

#### Birthdays and anniversaries

**Her birthday** is master data's date for her character, read at runtime; a birthday in her cast entry wins where
present. A real date maps onto the farm's 48-day year by quarters of its month: season day = 4 × (the month's place in its
season, 0–2) + ⌈min(day, 31) ÷ 8⌉, held to 1–4.

<!-- live:birthday-map -->
| Month | Days 1–8 | 9–16 | 17–24 | 25–31 |
|---|---|---|---|---|
| March | Spring 1 | Spring 2 | Spring 3 | Spring 4 |
| April | Spring 5 | Spring 6 | Spring 7 | Spring 8 |
| May | Spring 9 | Spring 10 | Spring 11 | Spring 12 |
| June | Summer 1 | Summer 2 | Summer 3 | Summer 4 |
| July | Summer 5 | Summer 6 | Summer 7 | Summer 8 |
| August | Summer 9 | Summer 10 | Summer 11 | Summer 12 |
| September | Autumn 1 | Autumn 2 | Autumn 3 | Autumn 4 |
| October | Autumn 5 | Autumn 6 | Autumn 7 | Autumn 8 |
| November | Autumn 9 | Autumn 10 | Autumn 11 | Autumn 12 |
| December | Winter 1 | Winter 2 | Winter 3 | Winter 4 |
| January | Winter 5 | Winter 6 | Winter 7 | Winter 8 |
| February | Winter 9 | Winter 10 | Winter 11 | Winter 12 |
<!-- /live -->

- **On her birthday** a gift pays ×3 and an evening ×1.5. The morning says so the day before and on the day. Two Umas
  may share a birthday; a birthday on a festival day is both.
- **Her anniversary** is her wedding's day of the year, from a year after the wedding on (every 48 days after it). That
  day every act pays ×2 (the evening ×1.5 instead), and that morning **she leaves a ★5 item of her line** in the
  Warehouse, home or away: a crop of the season for a farmer, a good of her foraging rank's deepest open area this season
  for a forager, a fish of her deepest open spot for a fisher, and a crop of the season for any line whose place isn't
  built yet, so an anniversary is never empty. The morning says so the day before and on the day.

#### Ready

Her next event is **Ready** when all four of these hold:

<!-- live:ready-rules -->
| # | Ready needs | Not met |
|---|---|---|
| 1 | Her bar is full for the rung; a waiting rung (the confession, the proposal, the wedding) is Ready the day after the rung before, and the proposal needs a ring in the Warehouse | `bar`, `day`, `ring` |
| 2 | She’s home (on the Dorm’s list, or a spouse in her house) | `away`: “Swap her home” |
| 3 | She hasn’t played one of her events today | `today` |
| 4 | Its one setup is met, if it has one: she works a named activity today (a running job there, or a tended growing block for farming), a named good is in the Warehouse at any stars, her bond with a named Uma has reached a level, a chapter has been reached | `setup`; `opens` for a chapter, or for the ranch, mining, cooking, expeditions, serving or forging before their chapters (2, 3, 4, 5, 6, 7) |
<!-- /live -->

Never an hour, the weather, a season or a festival. When she isn't Ready, the first of these in the way is the one shown:

<!-- live:ready-waits -->
| Order | `waits` | When |
|---|---|---|
| 1 | `done` | Her route is complete (S5 has played) |
| 2 | `night` | S2 or S4, bar full: no event, the level comes at night; short of it, `bar` |
| 3 | `unwritten` | The pack doesn’t script the event yet: “Her story is still being written” |
| 4 | `friend` | She said “Not yet” at her confession: you ask her again from her profile |
| 5 | `opens` | A chapter setup not reached, or a working setup at a place before its chapter |
| 6 | `bar` | Her bar isn’t full for the rung |
| 7 | `day` | A waiting rung, on the day the rung before played |
| 8 | `ring` | The proposal, with no ring in the Warehouse |
| 9 | `away` | She’s away on her off-season |
| 10 | `today` | She played one of her events today |
| 11 | `setup` | Its day setup isn’t met today |
<!-- /live -->

- **A setup** is her bible's beat's setup for the rung; an Uma without a bible has none. A chapter setup, or a working
  setup at a place whose chapter hasn't come, shows "Opens with chapter n" ahead of a short bar.
- **Her bond setup** reads bond hearts (50, 150, 300, 500 and 750 points). **The proposal's ring** is any ring in the
  Warehouse.
- **Ready is read live,** never stored, since it changes by the day: her Hearts row, her profile, the morning's Ready lines
  and her pip on the map all read it as they show.

#### The Hearts tab

**Hearts** is the Umas' tab: one row an Uma on the roster, home or away, a filter row, and her profile on a tap. It
has no badge. Its two views ride in the URL: Hearts (the default) and **Work**, the roster's album with **her level in
words** ("F7", "R4", "S2") in each face's corner. `/roster` lands on the Work view.

```
┌──────────────────────────────────────────┐
│ Hearts  Married 0/3  ☾ Evening ○     (i) │  ○ free, ● spent: a mark a slot today
│ [ Hearts ]  Work                         │
│ [Ready 1] [Friends 3] [Partners] [Married] [Away]
├──────────────────────────────────────────┤
│ (face) Stand-in 1                ● Ready │
│        New friend ♥ ▣□□□□□□□□□  200/200  │  the ladder's hearts, the next filling
│        Ready · Friendship 1 · the Fields · +2 banked   ✓chat
├──────────────────────────────────────────┤
│ (face) Stand-in 3                        │
│        New friend ♥ ▣□□□□□□□□□   80/200  │
│        Her story is still being written  │
└──────────────────────────────────────────┘
```

- **A row:** her face, her name and chips (**✉** while her invitation stands, unanswered or said yes and not yet spent;
  **Away**), and at its end **● Ready** in her stage's colour, which plays her event; a tap elsewhere opens her profile.
  Under it, her level in words, a filling heart, **her ladder's hearts as a bar** (ten for friendship and romance, five
  as a spouse: the levels played full, the next filling by points over its cost, the rest empty) and "points/cost". A
  waiting rung shows every heart full with its mark, **◆** her confession or **◇** the proposal and the wedding, and
  "Tomorrow" or "Ready".
- **The row's line:** Ready, her rung and where it plays ("Ready · Romance 5 · the Pond at night"); away, "Swap her home
  to play her events"; a short bar, nothing more (the bar says it); otherwise what her next event waits for ("Friendship 3
  · the Fields, when she works there", "Her story is still being written"); with none of these, a spouse's house ("Rose
  Cottage") or "Needs a room". Then "+N banked" (cut first on a narrow row), and today's **✓chat** and **✓gift**.
- **The sort:** Ready first, then the least progress (her next rung's place on the route, then her points), then the
  cast's order.
- **The filters,** one at a time, each with its count: **Ready**; **Friends** (friendship, and her confession's wait);
  **Partners** (romance, and the proposal's and the wedding's waits); **Married**; **Away**.
- **The header:** "Married n/N", N the cast's size (3 on the stand-in); a household scene or the finale's chip while one
  is Ready ("⌂ Scene 1 ›", "⌂ Harvest ›"); and **☾ Evening** with a mark a slot today, **○** free or **●** spent, the
  evenings first and then festival night's.
- **The (i)** has five lines: how her bar fills and banks; Ready and setups; one event a day; gifts and tastes; and the
  evening ("One evening a day with someone home: a hangout from Friendship 2, a date from Romance 1. Fine +60, Great +100,
  Perfect +150, ×1.5 in her favourite kind, and +20 when she asked you.").

#### Her profile

Her profile is a sheet over the tab, opened from her row, a Work card, the morning's lines and the Dorm's list. Each part
shows only what exists; nothing says "Soon".

```
┌──────────────────────────────────────────┐
│ Stand-in 1                             ✕ │
│ (face) New friend  ● Ready               │  the "+N" floats up from her face
│        Farming · ★ Spring 4              │  her line, birthday and house
│ ▣□□□□□□□□□◇□□□□□□□□□□◇◇□□□□□             │  the route as one track
│ ┌ Next: Friendship 1 ────────────────────┐│
│ │ Perk · Her loved gift shown; her own chats
│ │ Event · The Fields, while she works them.
│ │ ████████████████████  200 / 200  +2 banked
│ │ Ready                                  ││
│ └────────────────────────────────────────┘│
│ Perks   F1–F10 ✓ · R1 ✓                  │
│         F3  +10% chance of an extra crop │  what each reached perk does now
│         Next · R2 · …     All 25 perks   │
│ From her Calls you “Sprout” · Bent Trowel│  her pet name and keepsake
│ Gifts   Loved ? +60 · Liked ??? +30 · Disliked ?? 0 · Others +10
│ Ties    Stand-in 2 · Friends ♥♥ · Stand-in 3 · Rivals
│ Memories 0 of 26                         │
│ Ring    Her ring will read: ‘…’          │  from Romance 8
├──────────────────────────────────────────┤
│ [ Chat +15 ] [ Gift ] [ ☾ Evening › ]    │  48 pt, in the thumb zone
│ [        Praise +20        ]             │  while she's earned it
│ [ Hearts ]  Work                         │
└──────────────────────────────────────────┘
```

- **Her heading:** her face, her level in words in her stage's colour, her **● Ready** chip; under them her favourite
  line, her birthday as a farm day ("★ Spring 4") and her house once she has one. A spouse waiting for a room says "Needs
  a room", and an own-house wisher sharing or waiting says softly "She'd love her own house".
- **The route as one track:** F1–F10, ◆, R1–R10, ◇, ◇, S1–S5 (28 steps), the played ones filled in their ladder's
  colour, the next filling by her bar, the rest empty, a waiting rung drawn as a diamond. It wraps to two rows of 14 on a
  narrow phone.
- **The Next card:** "Next: Romance 5"; its perk in her line's words (with "Opens with chapter n" where her line's place
  waits); her beat's hint for the rung (where and how it opens); the bar with "points / cost" and "+N banked"; and what it
  waits for: "Ready", "123 to go", "Tomorrow", "Needs a ring", "Swap her home" (a link to the Dorm), "Tomorrow: one event
  a day", "The Fields, when she works there", "With Carrot in the Warehouse", "Bond 3 with Stand-in 2", "Opens with
  chapter 3", "Her story is still being written", "She said “Not yet”", "Comes tonight", and once her route is done "Her
  route is complete".
  - **Play ›** (48 pt, in her ladder's colour) plays her Ready event.
  - **A setup not met** says what to do: "Assign her to the Fishery, then come back.", "Have her tend a block on the
    Fields, then come back.", "Put Carrot in the Warehouse, then come back.", "Let her and Stand-in 2 work side by side
    until bond 3."
  - **After a Not yet,** **Ask her ›**, once a day ("You asked her today. Ask again tomorrow.").
  - **While the proposal needs a ring** and the ring bench stands, **Make one at the Forge's bench ›**.
- **Perks:** the reached ones by ladder ("F1–F10 ✓ · R1–R4 ✓"), what each reached one does now, the next, and **All 25
  perks** on a tap (reached ✓ with "Now · …", the next in bold, the rest greyed).
- **From her:** her pet name for you from Romance 1 ("Calls you “Sprout”"), and her keepsake from Friendship 10 with its
  effect and her line about it.
- **Gifts:** her loved, liked and disliked goods as learnt ("?" until then), each group's points at ★1, and "Others +10";
  without a bible, "Any gift +10". From Friendship 7, her closest friend's loved gift ("Stand-in 1 loves Golden Carrot").
- **Ties:** each tie with the other Uma's face, its kind (Friends, Rivals, Mentor, Teammates, Sisters, Close) and their
  bond hearts, closest first (the strongest tie, then the most bond points, then the ties' order), her closest friend
  marked **Closest**; the points to the next heart ("Friends · 150/300"); **Read** while a conversation of theirs is
  opened and unread; "Not here yet" for an Uma not on the farm.
- **Memories:** her count ("15 of 26") and **Album ›**.
- **Ring:** from Romance 8, "Her ring will read: ‘…’" (the engraving, her Romance 8 beat's caption); from the proposal,
  her ring with its bonus ("Iron Ring · +3% at the Fields once you're married", then "+3% at the Fields"), "Her ring
  reads: ‘…’", and **Give her the ‹ring› ›** for each better ring in the Warehouse.
- **The actions,** 48 pt in the sheet's foot: **Chat +15** (then her line for the day; "Chat ✓" once done), **Gift** (the
  picker; "Gift ✓"), **☾ Evening ›** while she can spend one (otherwise greyed with why: "Evening ✓" spent with her,
  "Evening · F2" below Friendship 2, "Away tonight", "Evening spent" with someone else), and **Praise +20** on the row
  under them while she's earned it. What an act pays floats up from her face, and a note says it ("She likes it. +36").
- **Hearts | Work:** the Work side is her work sheet: her favourite line, the day she joined, where she is, and her nine
  activities with talent, rank, points and the next challenge.

### Perks

A perk comes with every level, 25 in all, and every perk acts. **A perk is read from her level, never stored:** she has a
rung's perk once its event has played (S2 and S4 once they've come at night). Only her signature dish writes anything to
the save.

#### The perks' words

The words are templates by her favourite line. A perk that works at her line's place says **"Opens with chapter n"** while
that place waits for its chapter, and does nothing until then. The first table words each perk for a forager; the second
shows what the place-bound ones say for every line.

<!-- live:perk-words -->
| Level | Perk id | Words (a forager’s) | At her line’s place |
|---|---|---|---|
| F1 | `tastes-loved` | Her loved gift shown; her own chats |  |
| F2 | `hangouts` | Hangouts in the evening |  |
| F3 | `line-10` | +10% at the forest | Yes: “Opens with chapter n” until it opens |
| F4 | `signature-dish` | Her signature dish’s recipe |  |
| F5 | `rank-105` | ×1.05 rank points |  |
| F6 | `night-chore` | One item from the forest each night | Yes: “Opens with chapter n” until it opens |
| F7 | `tastes-all` | All her tastes shown, and her closest friend’s loved gift |  |
| F8 | `in-element` | In her element: ×1.2 at the forest beside a 3-heart friend | Yes: “Opens with chapter n” until it opens |
| F9 | `mentor` | Mentor: +10% rank points for Umas at the forest | Yes: “Opens with chapter n” until it opens |
| F10 | `keepsake` | Her keepsake; ×1.10 rank points |  |
| R1 | `dates` | Dates; her pet name for you |  |
| R2 | `morning-item` | A ★2+ good from the forest every 4th morning |  |
| R3 | `date-stargazing` | Date: stargazing |  |
| R4 | `closest-bond` | ×1.5 bond with her closest friend |  |
| R5 | `line-20` | +10% more at the forest (+20%) | Yes: “Opens with chapter n” until it opens |
| R6 | `date-dance-boat` | Dates: dance and boat |  |
| R7 | `night-chore-2` | A second night chore | Yes: “Opens with chapter n” until it opens |
| R8 | `engraving` | Her ring’s engraving |  |
| R9 | `date-footrace` | Date: footrace |  |
| R10 | `proposal` | The proposal |  |
| S1 | `breakfast` | Breakfast: the crew starts well fed on a morning in her house |  |
| S2 | `morning-item-2` | A ★3+ good from the forest every 2nd morning, and each morning in her house |  |
| S3 | `dream` | Her dream; +5% for anyone at the forest | Yes: “Opens with chapter n” until it opens |
| S4 | `night-chore-3` | A third night chore | Yes: “Opens with chapter n” until it opens |
| S5 | `vow-renewal` | Vow renewal; her keepsake grows |  |

| Her line | Her place | +10% (F3) | A night chore (F6) | A morning item (R2) | Opens with |
|---|---|---|---|---|---|
| Farming | the Fields | +10% at the Fields | +0.25 growth on a block each night | A ★2+ crop of the season | Day 1 |
| Foraging | the forest | +10% at the forest | One item from the forest each night | A ★2+ good from the forest | Day 1 |
| Fishing | the Fishery | +10% at the Fishery | One fish from the Fishery each night | A ★2+ fish | Day 1 |
| Mining (the Mine) | the Mine | +10% at the Mine | One ore from the Mine each night | A ★2+ ore | Chapter 3 |
| Mining (the Quarry) | the Quarry | +10% at the Quarry | One stone or gem from the Quarry each night | A ★2+ stone or gem | Chapter 3 |
| Ranch | the ranch | +10% at the ranch | +5 affection to her pen each night | A ★2+ egg, milk or fleece | Chapter 2 |
| Cooking | the Kitchen | +10% at the Kitchen | One more dish on the Kitchen’s next play | A ★2+ dish | Chapter 4 |
| Serving | the Restaurant | +10% at the Restaurant | One more cover on the Restaurant’s next shift | A ★2+ dish | Chapter 6 |
| Forging | the Forge | +10% at the Forge | 5% back on the Forge’s next tool | A ★2+ Fitting | Chapter 7 |
<!-- /live -->

#### What each perk does

Each perk, what it does, and where in the day it acts:

<!-- live:perk-effects -->
| Level | Perk | What it does | Where it acts |
|---|---|---|---|
| F1 | Her loved gift shown; her own chats | Her loved gift shows on her profile; she speaks her authored chats | Her profile, Chat |
| F2 | Hangouts in the evening | The evening opens: hangouts | Tonight |
| F3 | +10% at the forest | +10% at her line: copies of her night’s items there (a farmer: a tended plot’s chance of an extra crop) | Night step 4, a harvest |
| F4 | Her signature dish’s recipe | Her signature dish’s recipe into the Kitchen’s list, once | `playEvent` |
| F5 | ×1.05 rank points | ×1.05 her rank points | Night step 6 |
| F6 | One item from the forest each night | One night chore | Night steps 2 and 4 |
| F7 | All her tastes shown, and her closest friend’s loved gift | All her tastes, and her closest friend’s loved gift, on her profile | Her profile |
| F8 | In her element: ×1.2 at the forest beside a 3-heart friend | Side by side ×1.2 in place of ×1.1 at her line, outside the cap | Night steps 2 and 4 |
| F9 | Mentor: +10% rank points for Umas at the forest | ×1.1 rank points for the others at her place while she works there; one mentor a place | Night step 6 |
| F10 | Her keepsake; ×1.10 rank points | Her keepsake: +0.25 quality at her line; ×1.10 rank points | A job planned, a harvest; night step 6 |
| R1 | Dates; her pet name for you | Dates open; her pet name for you on her profile | Tonight, her profile |
| R2 | A ★2+ good from the forest every 4th morning | A ★2+ good of her line every 4th morning | Night step 9 |
| R3 | Date: stargazing | Date: stargazing | Tonight |
| R4 | ×1.5 bond with her closest friend | ×1.5 on her bond with her closest friend | `addBond` |
| R5 | +10% more at the forest (+20%) | +10% more at her line (+20%) | Night step 4, a harvest |
| R6 | Dates: dance and boat | Dates: dance and boat | Tonight |
| R7 | A second night chore | A second night chore | Night steps 2 and 4 |
| R8 | Her ring’s engraving | Her ring’s engraving shows | The ring bench |
| R9 | Date: footrace | Date: footrace | Tonight, once the footrace is built |
| R10 | The proposal | The proposal | Her proposal event (`playEvent`) |
| S1 | Breakfast: the crew starts well fed on a morning in her house | Breakfast: the crew well fed 1 day on a morning in her house, when no meal runs | `breakfast`, called by her house’s morning |
| S2 | A ★3+ good from the forest every 2nd morning, and each morning in her house | A ★3+ good of her line every 2nd morning (and each morning in her house) | Night step 9 |
| S3 | Her dream; +5% for anyone at the forest | Her dream: +5% for anyone at her line’s place, once her S3 is in her Memories | Night step 4, a harvest |
| S4 | A third night chore | A third night chore | Night steps 2 and 4 |
| S5 | Vow renewal; her keepsake grows | Vow renewal; her keepsake grows to +0.5 | Her S5 event (the vows); her keepsake at her line |
<!-- /live -->

#### At her line

Each place-bound template means one thing at each line's place. **Farming, foraging and fishing act now;** the other lines'
places aren't built yet, so their perks wait, and a morning item of theirs is a crop of the season meanwhile.

<!-- live:perk-lines -->
| Her line | +10% at her line (F3, R5) | A night chore (F6, R7, S4) | A morning item (R2, S2) | Acts |
|---|---|---|---|---|
| Farming | Each plot she tends: +10% chance of an extra crop at harvest, at the plot’s stars | +0.25 growth on the untended block with the most growing plots, else hers (step 2) | A ★2+ crop of the season | Yes |
| Foraging | Her haul ×1.1, and her Sawmill batch ×1.1 | One item from her rank’s deepest area this season, at a day’s haul’s stars (step 4) | A ★2+ good from the forest | Yes |
| Fishing | Her catch ×1.1, and her Smokehouse batch ×1.1 | One fish from her deepest spot this season, at a day’s haul’s stars (step 4) | A ★2+ fish | Yes |
| Mining (the Mine) | Her haul ×1.1, and her Smelter batch ×1.1 | One ore from her deepest floor | A ★2+ ore (a crop of the season until its place opens) | Not yet: from chapter 3, once its place is built |
| Mining (the Quarry) | Her haul ×1.1, and her Cutter batch ×1.1 | One stone or gem from her deepest floor | A ★2+ stone or gem (a crop of the season until its place opens) | Not yet: from chapter 3, once its place is built |
| Ranch | Her pen: +10% chance of an extra product | +5 affection to her pen (step 3) | A ★2+ egg, milk or fleece (a crop of the season until its place opens) | Not yet: from chapter 2, once its place is built |
| Cooking | +10% dishes as the Kitchen’s assistant | +1 dish on the Kitchen’s next play | A ★2+ dish (a crop of the season until its place opens) | Not yet: from chapter 4, once its place is built |
| Serving | +10% tips as the Restaurant’s server | +1 cover on the Restaurant’s next shift | A ★2+ dish (a crop of the season until its place opens) | Not yet: from chapter 6, once its place is built |
| Forging | +10% goods as the Forge’s assistant | +5% refund on the Forge’s next tool | A ★2+ Fitting (a crop of the season until its place opens) | Not yet: from chapter 7, once its place is built |
<!-- /live -->

- **Seeded:** a fraction becomes a whole item by a seeded draw on the account, the day and her id, so a night replays the
  same.
- **Gathering and stations pay at night:** the items an Uma's work finished tonight come to × (bond × (1 + romance)) in
  all. Side by side's pot pays first (×1.1, or ×1.2 in her element), then **the perks' pot**: the bond term × the romance
  term of the same items (her own bonuses only at her line's place, the crew's anywhere), as seeded copies (the same goods
  and stars) straight into the Warehouse. A forager's Sawmill batch and a fisher's Smokehouse batch count as her line.
  The job's own plan never changes.
- **Farming pays at harvest:** each harvested plot of a tended block has its tender's romance term at the Fields as the
  chance of **one extra crop** at the plot's stars (her own bonuses when farming is her line, plus the crew's). An
  untended block gets nothing. A harvest's note says it: "+3 Carrot (★1 × 2, ★2 × 1) · 1 from perks · 1 seed back".

#### The romance term and its caps

Every romance bonus on one job is one capped number:

<!-- live:perk-caps -->
| What | Cap | How |
|---|---|---|
| Her own line bonuses: F3 +10%, R5 +10%, her ring +1–15% once married | +35% | At her line’s place only (`romanceTerms`) |
| The crew’s: a dream’s +5% (the best at a place, never summed), the household’s +5% at 5 and +5% at 15 married | +15% | Anyone working the place (the household anywhere) |
| All romance bonuses on any one job, added | +40% | The romance term (`romanceBonus`) |
| In her element (×1.2) | Outside the cap | The bond term (`extrasShare`) |
| Night chores | 3 a night each | F6, R7, S4 |
| Morning items | 1 a day each by her count, +1 on a morning in her house | Every 4th from R2, every 2nd from S2 |
| Mentor | One a place | The most hearts, then the cast’s order |
| Rank points from her ladder | ×1.10 | F5 ×1.05, F10 ×1.10 (`loveRankFactor`) |

Worked: a married forager with F3, R5 and a grade-8 ring has +28% of her own (28% after her cap); a dream at the forest (+5%) and 15 married (+10%) add +15%; together +43%, **held to +40%**. Beside a 3-heart partner in her element her night’s items come to ×1.2 × 1.4 = ×1.68.
<!-- /live -->

- **Her own** (Friendship 3's +10%, Romance 5's +10% and her ring once married) counts only at her line's place, and only
  once that place is open. It's held to +35%.
- **The crew's** (the best dream at this place, never summed; the household's +5% from 5 married and +5% more from 15)
  counts for anyone working there, the household anywhere. It's held to +15%.
- **Together** they're held to +40%.
- **In her element** (Friendship 8) sits outside the cap, in the bond term: side by side ×1.2 in place of ×1.1 for her
  at her line's place beside an Uma she has 3+ bond hearts with, on her night's extras and on a farmer's tended growth.

#### Night chores

- **1 from Friendship 6, 2 from Romance 7, 3 from Spouse 4,** never more, for an Uma on the farm (home in the Dorm, or a
  spouse in her house) whose line's place is open. **Away does none.** Each chore is its own seeded pick.
- **Farming** (at night, as crops grow): **+0.25 growth** on the untended block with the most growing plots (a tie by a
  seeded pick), else on the block she tends while it has a growing plot; it joins that block's rate tonight.
- **Foraging and fishing** (at night, after the hauls): one item from her rank's **deepest open forest area** this
  season, or one fish from her **deepest open spot**, by the season's shares, at the stars a day's haul there would have
  (her rank, talent, tool, well fed and keepsake), straight into the Warehouse.
- **The morning** says them in one line: "Night chores · 3 items", "Night chores · 2 items · +0.5 growth".

#### Morning items

- **From Romance 2** she leaves **a ★2+ good of her line every 4th morning,** counted from the day she reached Romance 2.
  **From Spouse 2** it's **every 2nd morning at ★3+,** counted from the day she reached Spouse 2.
- **One a day by her count, on the farm only.** A morning in her house brings one more (see the house's morning, below).
- **The good** is her line's (as her anniversary item, with its own draw). **Its stars** are a seeded draw of a day's work
  at her line, keepsake included, held at the minimum (★2, or ★3 from Spouse 2).
- **The morning** says "♥ Stand-in 2 left you ★3 Shiitake", opening her profile.

#### The mentor

At night, at each place worked today (the Fields' tenders count as one place), an Uma at **Friendship 9** whose line's
place it is mentors the others who worked there: **×1.10 rank points** for the day. **One mentor a place:** the most
hearts (the furthest along her route), then the cast's order, then her id. She earns no bonus herself; a second Friendship
9 Uma there is mentored too.

#### Her keepsake

From **Friendship 10** her keepsake adds **+0.25 quality** to her work at her line's place, **+0.5 from Spouse 5** (her
vow renewal), and nowhere else. It's read when her job is planned, when the block she tends is harvested, and by her night
chores and morning items. Its name and her line about it are her bible's (without one, "Her keepsake"). It shows on her
profile under From her, never in the Warehouse.

#### Her signature dish

**Friendship 4's event** writes her signature dish's recipe into the Kitchen's list, once (a recipe the farm already
knows stays once), and her route keeps the dish so her profile can name it. The level-up card says "Recipe · ‹dish› · in
the Kitchen's list". The dish is her loved good when that's a dish; otherwise her line's dish kind at the grade of her
line's best place now:

<!-- live:signature-dish -->
| Her line | Her dish kind | Its grade | At G1 |
|---|---|---|---|
| Farming | Salad | The top grade of the shop’s vegetables at its open seed tiers (Farm Rank 1: G6; 2: G7; 4: G10) | Carrot Salad |
| Foraging | Soup | The top grade of the deepest forest area anyone has worked (the Woods G2 … the World Tree G10) | Button Mushroom Soup |
| Fishing | Grill | The top grade of the deepest spot anyone has worked, its fish at 10% or more (the Pond G2) | Carp Grill |
| Mining (the Mine) | Curry | G1 until the Mine is built (chapter 3) | Basil Curry |
| Mining (the Quarry) | Curry | G1 until the Quarry is built (chapter 3) | Basil Curry |
| Ranch | Cake | G1 until the ranch is built (chapter 2) | Honeycomb Cake |
| Cooking | Tart | G1 until the Kitchen is built (chapter 4) | Apple Tart |
| Serving | Cookies | G1 until the Restaurant is built (chapter 6) | Peanut Cookies |
| Forging | Bread | G1 until the Forge is built (chapter 7) | Wheat Bread |

Her loved good, when it’s a dish, is her signature dish as it is. The recipe joins `workshops.recipes` once (a recipe the farm knows stays once) and her route keeps its id (`love.dish`).
<!-- /live -->

#### Her dream and breakfast

- **Her dream** is her Spouse 3 event. Once it's in her Memories it acts: **+5% for anyone at her line's place,** in the
  crew's term. Two dreams at one place count once.
- **Breakfast** is a spouse's Spouse 1 perk, served on a morning in her house: every Uma on the farm with no well-fed days
  left starts the day **well fed for one day** (a Rough meal, so that day's work speeds up and earns more rank points). A
  meal already running is never shortened or extended, and a breakfast isn't a staff meal (no chapter count moves). Each
  pair it feeds earns +5 bond.

#### On her profile

Her profile's Perks shows what each reached perk does now, a later perk taking the earlier one's line (Romance 5's
replaces Friendship 3's): "R5 · +28% at the forest · +8% ring" (with "+5% crew" and "held to its cap" when they apply;
a farmer's "+20% chance of an extra crop"), "R7 · 2 items each night" (a farmer's "+0.5 growth each night"; "None while
she's away"), "R2 · Next tomorrow" or "Next in 3 mornings", "F4 · ‹dish› · in the Kitchen's list", "F8 · Beside
Stand-in 1" ("No 3-heart friend yet"), "F10 · Bent Trowel · +0.25 quality at the Fields", "R1 · She calls you
“Sprout”", "R4 · With Stand-in 1", "R8 · “‹engraving›”". A perk whose place isn't open says "Opens with chapter n" and
nothing now.

### Heart events and plays

#### Heart events

A level is its event. Once her next event is Ready it waits for you, for good: **nothing fires on its own.**

- **Three ways in:** her Hearts row's **● Ready**, her profile's **Play ›**, and the morning's Ready line (its **Play**
  tag). Each opens the event player over the page.
- **Nothing is saved while it plays.** Her script loads on demand; the player waits for it and for master data. At the end
  one rule pays the event and moves her on, and the app commits it once, stamped. **An event left halfway pays nothing and
  stays Ready.**
- **One of hers a day:** after one plays she isn't Ready again until tomorrow, however full her bar.

```
┌──────────────────────────────────────────┐
│ The Fields · Friendship 1  Auto Skip Log │  the place and the rung; the controls away from the taps
│ ╭──────────────────────────────────────╮ │
│ │  (the Fields' frame)        ♪ (bust) │ │  the place card: its frame on the season's
│ │  on spring's ground                  │ │  ground, her bust, the emote bubble beside it
│ ╰──────────────────────────────────────╯ │
│ ┌──────────────────────────────────────┐ │
│ │ Stand-in 1                           │ │  her bubble: three lines at most, typed out
│ │ Hello, Robin. Some of these are      │ │
│ │ ready. Help me pick?                 │ │
│ └──────────────────────────────────────┘ │
│ [ Show me which ones.             +30 ]  │  48 pt choices, each with its gain
│ [ Race you to the end of the row. +10 ]  │
└──────────────────────────────────────────┘
```

- **The place card** fills the top: a farm place's building frame on the season's ground (spring `#dcefc7`, summer
  `#f6e7b0`, autumn `#f2d3b0`, winter `#e3ebf3`), or a romance backdrop's borrowed frame and tint. A place step changes it
  mid-scene, and the title follows: "The Fields · Friendship 1", "The Pond at night · Romance 5". The speaker's bust is
  master data's (a lettered disc for a stand-in or a town cast member).

  | Backdrop | Borrowed frame | Tint |
  |---|---|---|
  | The Pond at night | The Fishery's, under a night sky | `#33456f` |
  | The Overlook | The observatory's | `#f0c493` |
  | The orchard bench | The orchard's | `#f3dca6` |
  | The Dorm porch | The Dorm's | `#ebc79f` |
  | The harbour wall | The Warehouse's | `#bcd6e2` |
  | The chapel bell | The chapel's | `#f5e6bd` |
  | The town | The exchange's | `#f0d4b2` |
  | The hilltop track | The racecourse's | `#d2e7b7` |
  | The sea pier | The fishery workbench's | `#9fc6de` |

- **The emote** is a bubble beside her bust: happy and laughing a music note, shy a sweat drop, sad an ellipsis, angry an
  anger mark, surprised an exclamation, thinking a question mark, tender a heart.
- **Her bubble** holds three lines at most, at 16 pt, typed out: **a tap finishes the line, the next tap goes on, a hold
  skips.** Narration and thoughts are italic. A pause goes on by itself (5 s at most).
- **Skip** (or a hold on the bubble) jumps to the next choice or play, **never past one.** **Auto** goes on after a
  reading pause of 1.2 s plus 35 ms a character. **Log** lists the lines so far and your answers.
- **Which play:** each play step in her script plays by the map below (a farming play may choose Pick, the default, or
  Rhythm with the hoe). With no play step anywhere in the event, her beat's "together" plays at the scene's end. Help and
  talk have no play. A play's good steps follow a Great or Perfect; its miss steps follow a Fine.

#### The plays

What the farmer and she do together is one short play on a flat sheet in the middle of the player. Each shows what to aim
for first, takes one thumb (timing from the touch), takes nothing from the Warehouse, and closes on its grade. **Never
failed:** a missed tap still lands, as a Fine. Every play is seeded by the account, the day, her id and the rung, so the
same day plays the same. The five plays, at both lengths:

<!-- live:plays -->
| Play | You | Graded by | In an event | As an evening |
|---|---|---|---|---|
| Cast | Tap as a closing ring meets the mark; the line lands every time | Timing | 1 cast | 3 casts |
| Pick | Tap her favourites (starred) among the goods popping up on a 3 × 3 field | Right picks | 1 round of 10 | 3 rounds |
| Rhythm | Tap on her beat with the activity’s mark (a hoe, a brush, a step, an oar…) | Timing | 8 beats after her 4 | 3 × 8 beats |
| Walk | Walk with her past today’s farm places; at each fork take a turn | Her favourite turns found | 2 forks | 4 forks |
| Choose | Pick one good of three for her | Her taste | 1 pick | — |
<!-- /live -->

A play scores 0–100 and grades by it:

<!-- live:play-grades -->
| Grade | Score | An event adds | An evening pays |
|---|---|---|---|
| Fine | 0–59 | +0 | +60 |
| Great | 60–89 | +15 | +100 |
| Perfect | 90–100 | +30 | +150 |
<!-- /live -->

**What plays as what.** An activity whose game isn't built yet plays **Rhythm with its mark** (the fallback), with the
same grades; when the real game ships, the event plays it. The marks are words until art draws them.

<!-- live:play-map -->
| `together` (or a `play` step’s `game`) | Plays as |
|---|---|
| `work: farming` | Pick |
| `work: ranch` | Rhythm with the brush |
| `work: mining` | Rhythm with the pick |
| `work: fishing` | Cast |
| `work: foraging` | Pick |
| `work: cooking` | Rhythm with the pot (the fallback until its game ships) |
| `work: serving` | Rhythm with the tray (the fallback until its game ships) |
| `work: forging` | Rhythm with the anvil (the fallback until its game ships) |
| `work: expeditions` | Rhythm with the pack (the fallback until its game ships) |
| `work: farming` with `play.as: rhythm` | Rhythm with the hoe |
| `date: fishing` | Cast |
| `date: walk` | Walk |
| `date: boat` | Rhythm with the oar |
| `date: picnic` | Pick |
| `date: market` | Pick |
| `date: stargazing` | Pick |
| `date: dance` | Rhythm with her step |
| `date: crafting` | Rhythm with your hands |
| `date: cooking` | Rhythm with the pot (the fallback until its game ships) |
| `date: footrace` | Rhythm with the track (the fallback until its game ships) |
| `gift` | Choose |
| `help`, `talk` | No play: the grade is the best choice’s |
<!-- /live -->

**The windows and numbers:** a careful tap lands Perfect, a casual one usually Great.

<!-- live:play-windows -->
| A tap this far from the moment | Scores | Grade |
|---|---|---|
| ≤ 80 ms | 100 | Perfect |
| 81–160 ms | 99 → 90 | Perfect |
| 161–360 ms | 89 → 60 | Great |
| 361–719 ms | 58 → 0 | Fine |
| 720 ms or more, or no tap | 0 | Fine |

| Play | Seeded (`play:<id>:<rung>`) | Scored |
|---|---|---|
| Cast | The ring meets the mark 1.6 s–2.8 s after each cast starts | The tap’s timing; casts score their mean |
| Rhythm | A beat every 700–1000 ms; her 4 first, then 8 to tap | Each beat by its nearest tap’s timing (within half a beat), their mean; a tap that matches no beat −5; rounds score their mean |
| Pick | 10 goods a round, one every 1.1 s, each showing 1 s–1.4 s; 4 starred (her loved and liked, else her line’s first goods) | The starred tapped while showing, their share of 100; a tap on an unstarred one −10; rounds score their mean |
| Walk | At each fork her place and another open farm place, left or right; 8 s a fork | Her place’s turn full, the other half, none 0: their share of 100 (two forks 50, 75 or 100) |
| Choose | Three goods, one of her loved or liked; 10 s | Loved 100, liked 75, anything else 40, none 0; the taste is learnt |
<!-- /live -->

- **Walk's place:** her line's first place when it's open today, else a seeded one of the open farm places her beats use,
  else the Fields. The path passes today's open farm places (not the Gate or the town edge). Before it she says "I love
  the Fields."
- **Pick's and Choose's goods:** her loved and liked goods, starred; the others are the rest of their families' raw
  goods, grades 1–5, never one she dislikes. An Uma without a bible stars her line's first goods (and Choose finds every
  good neutral).

#### Choices and rewards

Each event has 1–2 choice points of 2–3 options (the confession, the proposal and the wedding up to 3), and **every
option shows its gain on the button before the tap**: +30 for the best (the highest authored gain, each one tied at the
top), +10 for the others. **A romantic option** carries a **♥**. An option may also:

- **cost goods:** "+10 · 1 Basil" on the button, taken at any stars, lowest first; greyed with **"Need 1 Basil"** when
  the Warehouse is short;
- **reveal a taste:** "· learns a like" ("a love", "a dislike"), while that taste isn't known yet;
- **set a flag** that changes later wording only: a later step plays one branch while the flag is set, the other
  otherwise.

No option scores below zero, removes a later event or changes the route. What an event pays, and its limits:

<!-- live:event-pay -->
| An event | Points into her next bar |
|---|---|
| Played to its end | +50 |
| Each choice: the option with the highest authored gain (each one tied at the top) | +30 |
| Each choice: any other option | +10 |
| Each play: Fine, Great, Perfect | +0, +15, +30 |
| No play (help, talk): the best option taken a Perfect, any other a Great | +30 or +15 |
| A heart event’s usual size (any other is a note, and plays) | 1–2 choice points, at most 1 play |
| The confession’s, the proposal’s and the wedding’s usual size | 1–3 choice points, at most 3 plays |
<!-- /live -->

The sum goes **into her next bar** through the same rule as every act, so her anniversary's ×2 applies; then she moves up.
The event also gives:

- **its rung's perk** (Friendship 4's writes her signature dish's recipe here);
- **a Memory:** the rung into her album, its caption her beat's line;
- **its unlock,** if any: an item lands in the Warehouse at ★1; a place or a perk line is the card's to say;
- any taste revealed or learnt by a Choose, and the path's flags;
- her place in today's events (she's done for the day).

#### The level-up and stage-up cards

```
┌──────────────────────────────────────────┐
│          ♥  Friendship 5  ♥              │  a short sparkle (still with reduced motion)
│   (bust)  “This bench is ours now.”      │  her last line of the event
├──────────────────────────────────────────┤
│ +50 event · +30 choice · +30 Perfect     │
│   = +110 toward Friendship 6 (+40 banked)│  "(+N banked)": what was past her full bar before
├──────────────────────────────────────────┤
│ Perk  ×1.05 rank points                  │
│ Memory ▢ “The long way round.” saved     │
│ Unlocked  New place · the orchard bench  │
├──────────────────────────────────────────┤
│ Next: Friendship 6 · 400 points          │
│ 150 / 400                                │
│ The Fields, with a Carrot in the Wareh…  │  the next beat's hint
│ Opens: +0.25 growth on a block each night│  the next rung's perk
│              [ Continue ]                │
└──────────────────────────────────────────┘
```

- **The sum:** "+50 event", the choices ("+30 choice", "+40 choices"), each play's grade ("+15 Great") or, with no play,
  the best choice's grade; then "= +N toward ‹next rung›", "(×2 anniversary)" on her anniversary, and "(+N banked)". After
  a Not yet it reads "= +N, banked for Romance 1".
- **The rest:** the perk, the Memory, any unlock, the recipe (Friendship 4), the ring (the proposal: "Iron Ring · hers
  now"), the wedding ("The Fields · Marta's bakery sends a cake · everyone well fed 1 day"), and the next rung with its
  points, its hint and its perk.
- **The stage-up screens** follow three events, each with one **Continue**:
  - **Partners** (the confession's Yes): "Romance opens. Her bar turns rose.", the track re-coloured, and **Opens now**:
    the romance ladder, Romance 1's dates and her pet name, her partner chats, Romance 3's stargazing, Romance 6's dance
    and boat, Romance 9's footrace.
  - **Engaged** (the proposal): "A ring, and a yes. Your wedding comes next."; your wedding tomorrow, whenever you're
    ready; her ring and its bonus once you're married; a better ring any day, from her profile.
  - **Married** (the wedding): "Your wedding is done. Her bar turns gold."; the spouse ladder; her ring's bonus at her
    line; every evening kind her ladders opened; Spouse 1's breakfast; "Your anniversary: Summer 9, each year"; her room
    ("Her room: Farmhouse", or none free yet, so she keeps her Dorm bed) with buttons to move her to another house with a
    free room; "House mornings: +30 for her each morning you sleep there"; and "Married 1/20 · next household scene at 5"
    ("household scene 1 tomorrow" on a milestone's own wedding, "the Great Harvest tomorrow" on the 20th).
- **A night level** (Spouse 2 or 4) opens the same card from the morning: "Her bar filled overnight: no event, the level
  comes by itself", its perk and her next rung.

#### The confession

Her confession is Ready the day after Friendship 10, at its own place: a longer scene with up to three plays and three
choice points, its **last choice point** holding one Yes and one Not yet. Either way it **pays like any event** and
**counts as her event that day.**

- **Yes** moves her to romance at Romance 0, her banked points toward Romance 1, and shows Partners.
- **Not yet** keeps her a **close friend** ("Close friend" in words). Nothing is lost: her points keep banking toward
  Romance 1, and her confession isn't Ready again.
- **Ask her ›** (her profile's Next card, while she's a close friend) plays the confession again from her line before its
  answer, without its plays, **once a day,** **paying nothing,** and **not as her event:** after a Yes there, her Romance
  1 can play the same day if her bar is full and she hasn't played an event today. Yes clears the Not yet and shows
  Partners; Not yet: "Whenever you're ready. Ask again tomorrow."
- She always confesses. An author may have her say "not yet" in an earlier scene's words, at no cost.

#### Memories

**Her album** (from her profile's **Album ›** and the Diary's **Memories** shelf) has 26 tiles, one a rung with an event,
under four filters: **Friend** (Friendship 1–10 and her confession), **Romance** (Romance 1–10), **Wed** (the proposal and
the wedding) and **Spouse** (Spouse 1, 3 and 5). Played tiles show their caption, **the next** is marked, the rest are
locked. **Her arrival ›** replays her arrival scene.

- **A replay** starts from the top or from any choice point picked from its list ("Choice 1 · “Show me which ones.”"). It
  plays with its plays, **every option is open** (no cost, no gain shown), **nothing is paid, taken or saved,** and it
  ends "A Memory, replayed. Replays give no points."
- **The Diary's shelf** lists each Uma on the farm with "n of 26", opening her album, and the household scenes and the
  finale once played.

#### The stand-in route

The stand-in farmer's 26 events are invented and exercise everything: every play, the fallback, a cost, a taste, a flag
and its branch, three setups, three kinds of unlock, and a confession with two plays and both answers.

<!-- live:stand-in-route -->
| Rung | Place | Together | Plays | Setup | Also |
|---|---|---|---|---|---|
| F1 | fields | work: farming | Pick |  |  |
| F2 | fields | work: farming | Rhythm with the hoe |  | unlocks item |
| F3 | fishery | work: fishing | Cast | works fishing |  |
| F4 | dorm-porch | work: cooking | Rhythm with the pot (the fallback until its game ships), from its together |  | a cost |
| F5 | orchard-bench | date: walk | Walk, from its together |  | unlocks place |
| F6 | fields | gift: carrot | Choose, from its together | carrot held |  |
| F7 | dorm-porch | talk | No play: the grade is the best choice’s |  | a taste |
| F8 | forest | help: 9000002 | No play: the grade is the best choice’s |  | a flag |
| F9 | fields | work: farming | Pick |  | a `when` |
| F10 | pond-night | date: stargazing | Pick |  |  |
| Confession | overlook | talk | Walk; Pick |  | Yes / Not yet |
| R1 | orchard-bench | date: picnic | Pick |  | unlocks perk |
| R2 | pond-night | date: fishing | Cast |  |  |
| R3 | overlook | date: stargazing | Pick |  |  |
| R4 | fishery | help: 9000003 | No play: the grade is the best choice’s | bond 3 with 9000002 |  |
| R5 | pond-night | date: boat | Rhythm with the oar |  |  |
| R6 | town | date: dance | Rhythm with her step |  |  |
| R7 | barn | work: ranch | Rhythm with the brush |  |  |
| R8 | town | date: crafting | Rhythm with your hands |  |  |
| R9 | hilltop-track | date: footrace | Rhythm with the track (the fallback until its game ships) |  |  |
| R10 | orchard-bench | date: walk | Walk |  |  |
| Proposal | chapel-bell | talk | Walk |  |  |
| Wedding | chapel-bell | talk | Rhythm with her step |  |  |
| S1 | fields | work: farming | Pick |  |  |
| S3 | dorm-porch | gift: golden-carrot | Choose, from its together |  |  |
| S5 | overlook | date: stargazing | Pick |  |  |
<!-- /live -->

### The evening

The day has **one evening across all the Umas,** spent any time in the day from her profile (**☾ Evening ›**) or
Tonight's row; an evening left empty costs nothing. It's a short play together at its evening length, graded **Fine,
Great or Perfect** and never failed, that pays well, and more in her favourite kind.

#### Who and the kinds

- **Who:** a **hangout** with an Uma at Friendship 2 or more (her confession's wait and Romance 0 included), a **date**
  from Romance 1 (the proposal's and the wedding's waits included), and **every kind** with a spouse ("An evening at
  home"). She must be **home** tonight: on the Dorm's list, or a spouse in her house.
- **The kinds** are the ten date games, opened by her ladder and by their game. **Cooking together** and **the
  footrace** wait for their games, so they aren't offered yet (a favourite kind not offered still counts as hers, and she
  doesn't invite you to it). **Festival night** is a festival day's own slot.
- **Her favourite kind** is the date game her bible's beats use most; **walk** on a tie at the top, or with no date beats
  (or no bible). It pays ×1.5 and it's what her invitations ask for. Festival night is never her favourite.

The kinds, the rung that opens each, and how each plays:

<!-- live:evening-kinds -->
| Kind | As a hangout | As a date | Plays as | Offered | Her invitation |
|---|---|---|---|---|---|
| Walk at dusk | F2 | R1 | Walk | Yes | “Walk at dusk tonight?” |
| Fishing at the Pond | F2 | R1 | Cast | Yes | “Fishing tonight?” |
| A picnic | F2 | R1 | Pick | Yes | “A picnic tonight?” |
| The market in town | F2 | R1 | Pick | Yes | “The market in town tonight?” |
| Cooking together | F2 | R1 | Rhythm with the pot (the fallback until its game ships) | Not yet: waits for the Kitchen | “Cook with me tonight?” |
| Crafting | — | R1 | Rhythm with your hands | Yes | “Make something with me tonight?” |
| Stargazing at the overlook | — | R3 | Pick | Yes | “Stargazing tonight?” |
| Dancing | — | R6 | Rhythm with her step | Yes | “Dance with me tonight?” |
| A boat on the lake | — | R6 | Rhythm with the oar | Yes | “A boat on the lake tonight?” |
| A footrace | — | R9 | Rhythm with the track (the fallback until its game ships) | Not yet: waits for the footrace | “Race me tonight?” |
| Festival night | Festival days, F2 | Festival days, R1 | Walk, at the festival ground | Yes | — (never asked for) |

Who: a hangout from Friendship 2 (her confession’s wait and Romance 0 included), a date from Romance 1 (the proposal’s and the wedding’s waits included), and every kind her ladders opened with a spouse; she must be home. The stand-in’s favourite kinds: 9000001 stargazing, 9000002 walk, 9000003 walk.
<!-- /live -->

#### The points

**The grade's 60, 100 or 150, ×1.5 in her favourite kind, ×1.5 on her birthday, ×1.5 on her anniversary:** each once,
multiplied, rounded half up, into her bar. An anniversary evening is ×1.5, not the day's ×2 as well. Her kinds sheet shows
each kind's three numbers for her today before the tap ("Perfect +225"), and the play shows them under it. What each
grade pays:

<!-- live:evening-points -->
| Grade | Any kind | Her favourite kind (×1.5) | Her kind, on her birthday | Her kind, on her birthday and anniversary |
|---|---|---|---|---|
| Fine | +60 | +90 | +135 | +203 |
| Great | +100 | +150 | +225 | +338 |
| Perfect | +150 | +225 | +338 | +506 |

An invitation said yes adds **+20** with her first evening that day, whatever the kind; it’s an act of its own, so her anniversary doubles it (+40).
<!-- /live -->

#### The slots and the invitations

Today's evening slots and this morning's invitations:

<!-- live:evening-slots -->
| Today | Evenings | Festival night | Invitations this morning |
|---|---|---|---|
| Any day | 1 | — | 1 |
| From 10 married | 2 on days divisible by 4, else 1 | — | 2 |
| A festival day (Spring 10, Summer 10, Autumn 10, Winter 10, Winter 12) | As any day | 1 more, its own slot: only festival night fills it | As any day |

An invitation’s draw: `draw(uid, day, 'invite', n)` among the Umas home at Friendship 2+ whose favourite kind is open to them, each weighted 1 + the days since her last evening (or since she arrived), up to 14; a second invitation is never the first’s Uma.
<!-- /live -->

- **The slots:** one evening a day; from 10 married, a second on days divisible by 4. **Festival night** is its own slot
  on a festival day (and on the Festival of Vows), filled only by its kind: a walk at the festival ground with anyone at
  Friendship 2 or more. An Uma may spend more than one slot in a day; the invitation's +20 comes with her first.
- **Invitations:** each morning one Uma (two from 10 married, never the same one twice) asks you for her favourite kind
  tonight. **Yes, tonight** makes her Tonight's evening (refused once the evening is spent); **Another day** costs
  nothing, and she may ask again another morning. Each is answered once, and yesterday's clear at night.

#### On screen

```
┌──────────────────────────────────────────┐  her profile's Evening ›
│ An evening with Stand-in 2             ✕ │
│ (face) A hangout · Friend · F2           │
│        ✉ She asked you: +20 with the evening
├──────────────────────────────────────────┤
│ [walk] Walk at dusk ★                    │  her favourite, ×1.5
│        Fine +90 · Great +150 · Perfect +225
│ [cast] Fishing at the Pond               │
│        Fine +60 · Great +100 · Perfect +150
│ [pick] A picnic · [pick] The market in town
│ ░ Crafting           At Romance 1        │  greyed: her ladder hasn't opened it
│ ░ Stargazing at the overlook  At Romance 3
│ ░ Dancing · A boat on the lake  At Romance 6
└──────────────────────────────────────────┘
```

- **Her kinds sheet:** her role and level, the invitation's +20 when she asked and you said yes, "★ Her birthday: ×1.5
  tonight"; the kinds open to her now in order (festival night last on a festival day), each with its play's mark and her
  three numbers today, ★ and a rose edge on her favourite; then the kinds her ladder hasn't opened, greyed with their
  rung. A tap plays it.
- **The play** is the event's play at its evening length (three casts, three rounds of Pick or Rhythm, four forks of
  Walk) on a dusk wash, seeded by the day, her id and the kind. A ✕ leaves it, spending nothing: **nothing is saved until
  it ends.**
- **The card:** the kind "with ‹her name›", the grade, the sum ("+150 Perfect × 1.5 her favourite = +225", "+20 for
  saying yes", "= +245 toward Friendship 3 (+40 banked)") and her bar in her ladder's colour, then **Continue**. It
  commits once: the points, her last evening's day, and the slot spent.
- **Tonight's picker:** the Umas who can spend an evening now, a yes first, then an unanswered invitation, then the cast's
  order, each with her level, ★ her favourite kind and ✉.

```
┌──────────────────────────────────────────┐
│ Tonight · Spring 6                       │
├──────────────────────────────────────────┤
│ ☾ Evening   with Stand-in 2 · Walk ✓     │  spent
│ ☾ Evening   ✉ Stand-in 3 · Walk [Play ›] │  (or) she said yes
│                         Someone else ›   │
│ ☾ Evening   [     Pick someone ›     ]   │  (or) free
│ ☾ Festival night [ Pick someone › ]      │  a festival day's own row
├──────────────────────────────────────────┤
│ 2 Umas idle · 3 to collect               │
│        [ Back ]   [ End the day ]        │
└──────────────────────────────────────────┘
```

- **Tonight** is End the day's sheet whenever a slot is free and someone can spend it, or anyone is
  married (then **Sleep at** sits between the evening rows and the day's what's-left line). Otherwise the day ends as it
  does without the romance: at once when all is set, or after the one line. Whether Tonight opens is settled once, as the
  sheet opens, so coming back from a played evening shows its row ✓ and never ends the day by itself. **End the day never
  waits on the evening.**
- **The night is a fade:** End the day dims the whole screen to dusk (`#2b3557`, 450 ms), the night runs under it with
  nothing shown, and the morning comes up from it (650 ms); with reduced motion, a plain cut. A failed night lifts it at
  once and says **Try again**.
- **The morning's invitation:** "✉ Stand-in 2: “Walk at dusk tonight?”" with **Yes, tonight** and **Another day**; said
  yes, "Tonight ✓" with **Play ›** (her evening over the morning); declined, "Another day". Her row's ✉ stands while it's
  unanswered, or yes and not yet spent.

### The ring, the wedding, and married life

The proposal needs a ring, so the old Forge opens early as a ring bench with no game. After the wedding a
spouse moves into the homestead, and married life goes on to the household's finale.

```
 an Uma's first Romance 8 event ──that night──► the Forge stands as the ring bench
   │                                              the morning: Ida Stone's scene, "The Ring Bench" (once)
   ▼
 the Forge's quick look ──► the bench: 3 refined goods of grade g ──► a grade-g ring ★1 in the Warehouse (one a day)
   │
 Romance 10 played ──the next day, a ring held──► the proposal: which ring? ──► played, always yes ──► Engaged
   │                                              the ring leaves the Warehouse; its grade is hers
   ▼
 the next day, or any day after ──► the wedding: where? (her three) ──► played there, guests and vows
   │                                  ──► the reception (a dish, or Marta's cake) ──► Married: a spouse at S0
   ▼
 her room at once · that night everyone on the farm is well fed from tomorrow · her ring +1% a grade at her line
```

#### The ring bench

The bench's rule, in full:

<!-- live:bench-recipe -->
|  | The ring bench |
|---|---|
| Opens | The night after the first Romance 8 event anyone plays: `buildings.forge = 0`, and Ida Stone’s scene the next morning |
| A ring of grade g | 3 refined goods of grade g, any family, any mix; the mining families’ (ingots, blocks, cut gems) from chapter 3 |
| Cost | The goods only: no gold, no game, no assistant, no score |
| Out | The ring, ★1 (a Rough make), into the Warehouse |
| How often | One ring a day (`today.ring`) |
| Her bonus once married | +1% at her line a grade, inside her own +35%; the Forge’s merge game (not built yet) adds +1, +3 or +5 for a Fine, Great or Masterwork make |
| Refusals | “The ring bench opens with your first Romance 8.” · “Three refined goods of one grade.” · “Ingots, blocks and cut gems open with chapter 3.” · “One ring a day.” · “Not enough in the Warehouse.” |
<!-- /live -->

- **On the map:** until the bench stands the Forge's lock says "Opens with your first Romance 8". Then its quick look
  reads **Ring bench · one ring a day** with **Make a ring ›** ("See the bench ›" once today's is made).
- **Ida Stone's scene:** the morning after, once the summary is put away (after any chapter scene, before arrivals), seven
  short lines and a card with **See the bench** or **Later**; read once.
- **The bench's sheet:** Ida Stone's disc and the rule; one row a grade you can make now, lowest first, each with **the
  three goods it would take** (the lowest-value refined goods of that grade, fewer stars first, any family, any mix),
  "→ Iron Ring" and "+3% once married". A tap on one of the three lists the grade's other goods held and swaps it in; a
  tap on a row chooses it. The Forge's own recipe shows greyed, "From chapter 3: 2 ingots + 1 cut gem"; then "Her bonus
  once married: +1% a grade", and **Make an Iron Ring · 1 a day**. Made, the ring is "in the Warehouse, ★1", and the foot
  says "One ring a day. Iron Ring made today ✓" until tomorrow. With nothing to make: "Nothing to make yet. Three refined
  goods of one grade make a ring: planks from the Sawmill, fillets from the Smokehouse, flour from the Mill."

#### The rings

The ten rings, one a grade:

<!-- live:rings -->
| Grade | Ring | Id | ★1 | ★5 | Her bonus once married | Cheapest at the bench (chapter 1) | Its own recipe (from chapter 3) |
|---|---|---|---|---|---|---|---|
| G1 | Copper Ring | `ring-g1` | 205g | 410g | +1% | 3 Pine Plank (40g each) | 2 Copper Ingot + 1 Cut Quartz |
| G2 | Tin Ring | `ring-g2` | 275g | 550g | +2% | 3 Birch Plank (45g each) | 2 Tin Ingot + 1 Cut Amethyst |
| G3 | Iron Ring | `ring-g3` | 340g | 680g | +3% | 3 Cedar Plank (60g each) | 2 Iron Ingot + 1 Cut Citrine |
| G4 | Silver Ring | `ring-g4` | 450g | 900g | +4% | 3 Polished Rice (75g each) | 2 Silver Ingot + 1 Cut Garnet |
| G5 | Cobalt Ring | `ring-g5` | 580g | 1,160g | +5% | 3 Oak Plank (105g each) | 2 Cobalt Ingot + 1 Cut Emerald |
| G6 | Gold Ring | `ring-g6` | 745g | 1,490g | +6% | 3 Rye Flour (90g each) | 2 Gold Ingot + 1 Cut Sapphire |
| G7 | Platinum Ring | `ring-g7` | 950g | 1,900g | +7% | 3 Buckwheat Flour (115g each) | 2 Platinum Ingot + 1 Cut Ruby |
| G8 | Titanium Ring | `ring-g8` | 1,220g | 2,440g | +8% | 3 Ebony Plank (220g each) | 2 Titanium Ingot + 1 Cut Diamond |
| G9 | Mythril Ring | `ring-g9` | 1,555g | 3,110g | +9% | 3 Elderwood Plank (280g each) | 2 Mythril Ingot + 1 Cut Starstone |
| G10 | Orichalcum Ring | `ring-g10` | 2,025g | 4,050g | +10% | 3 Yggdrasil Plank (360g each) | 2 Orichalcum Ingot + 1 Cut Philosopher's Stone |
<!-- /live -->

Rings are goods of their own family: sold at the bin like any good (no season's demand), on the Warehouse's
**Rings** tab while one is held, and a **Diary row** of their own (500g once all ten have shipped). One a day from goods
worth a little less keeps the bench a ring maker, not a mint (an Iron Ring: 180g of planks becomes 340g).

#### The proposal

- **Ready** the day after Romance 10, **with any ring in the Warehouse** ("Needs a ring" until then).
- **Play ›** first asks **which ring,** the best grade preselected; then her event plays (up to three plays and 1–3
  choice points). It **always succeeds:** the ring leaves the Warehouse (lowest stars first), its grade becomes hers, she's
  **engaged,** and the stage-up reads **Engaged**.
- **Her ring:** every ring is a Rough make, so her ring is its grade, 1–10, and once she's your spouse it's her bonus at
  her line, **+1% a grade,** inside her own +35%.
- **A better ring,** any day from the proposal on: her profile offers each higher-grade ring in the Warehouse; she keeps
  it, and her old one comes back to the Warehouse at ★1. A lower or equal ring is refused.
- **The engraving:** from Romance 8 her profile shows "Her ring will read: ‘…’", her Romance 8 beat's caption.

#### The wedding and the reception

- **Ready** the day after the proposal, and it **waits until you play it.**
- **Play ›** asks **the place** first: her bible's wedding places (any number), else her wedding beat's place and the farm's
  defaults (the chapel bell, the Fields, the Overlook, the orchard bench), three different. Her event then plays on that
  place's card.
- **The guests** are every spouse on the farm (the cast's order), then her two closest friends on the farm. Their faces
  line the top, they have no lines, and one line of narration comes first ("Stand-in 2 and Stand-in 3 came, in their
  best."; with none, "Just the two of you, and the whole farm quiet around you.").
- **The vows** are its last choice point, paying as any choice. Your words and the place are kept as flags for later
  wording.
- **Then the reception:** pick a dish from the Warehouse (the most well-fed days first); only with no dish held does
  Marta's bakery send a cake. The dish is used. What it feeds:

<!-- live:reception -->
| The reception | Well fed from tomorrow, everyone on the farm |
|---|---|
| A ★1 dish | 1 day |
| A ★2 dish | 1 day |
| A ★3 dish | 2 days |
| A ★4 dish | 2 days |
| A ★5 dish | 3 days |
| No dish in the Warehouse: Marta’s bakery sends a cake | 1 day (a Rough meal) |

A meal already running is never shortened. **The guests:** every spouse on the farm, then her 2 closest friends on the farm (by bond); they have no lines. **The places:** her bible’s `wedding.places`, else her wedding beat’s place and `chapel-bell`, `fields`, `overlook`, `orchard-bench`, three different. **Household milestones** at 5, 10, 15, 20 married.
<!-- /live -->

- **She becomes your spouse** at Spouse 0, her wedding day noted (her anniversaries follow a year on), and takes **her
  room** at once (see Rooms and moves, below). That night everyone on the farm is well fed from tomorrow; two weddings
  in one day feed the farm by the longer reception.
- **The words** of the bench, the proposal and the wedding say spouse, partner, vows, your wedding and you; never a word
  that genders the farmer.

#### The homestead

Behind the yard the map grows the homestead: **the Farmhouse,** your own home with two rooms, from day 1, and **six
houses** you build, name and extend.

<!-- live:houses -->
|  | Rooms | Build | Extend | Opens |
|---|---|---|---|---|
| The Farmhouse | 2 (your own home) | — | — | Day 1 |
| House 1 | 2, or 4 extended | 8,000g | 4,000g | The first wedding |
| House 2 | 2, or 4 extended | 20,000g | 10,000g | House 1 built |
| House 3 | 2, or 4 extended | 40,000g | 20,000g | House 2 built |
| House 4 | 2, or 4 extended | 70,000g | 35,000g | House 3 built |
| House 5 | 2, or 4 extended | 110,000g | 55,000g | House 4 built |
| House 6 | 2, or 4 extended | 160,000g | 80,000g | House 5 built |
| **All** | **26 rooms** | **408,000g** | **612,000g extended** |  |
<!-- /live -->

- **House 1 opens to build at the first wedding,** each later house once the one before stands. A house **stands at
  once** when bought, named there: 1–20 characters under the farmer's letters rule, a grey "Rose Cottage" placeholder, no
  two alike. **An extension** adds two rooms at once for half the house's price. The Farmhouse is never renamed or
  extended.
- **Never a gate:** a wedding never waits for a room.
- **On the map:** the homestead's rows sit after the yard and before the town edge, which stays the map's last row. Built
  houses and the next lot show; later lots don't, so the map grows a row at a time. A house's pips are its residents'
  faces (♥ on a Ready one) and its free rooms' dots; a tap opens the homestead's sheet at that house. The next lot shows
  the cottage dimmed and locked, "Build · 8,000g" (before the first wedding, "Opens with your first wedding").

The homestead's rows on the map:

<!-- live:homestead-map -->
| Row | Places |
|---|---|
| 8 | Farmhouse (`farmhouse`) · House 1 (`homestead-house`) · House 2 (`homestead-house`) |
| 9 | House 3 (`homestead-house`) · House 4 (`homestead-house`) · House 5 (`homestead-house`) |
| 10 | House 6 (`homestead-house`) |
| After the last shown | The town edge: Shop · Festival ground · Expedition post |
<!-- /live -->

```
┌──────────────────────────────────────────┐
│ The homestead                       (i)  │
│ Married 3/3 · 3/4 rooms                  │
├──────────────────────────────────────────┤
│ ⌂ Farmhouse        [S1][S2]   2/2 · yours│
│ ⌂ Rose Cottage     [S3][ ▢ ]  1/2        │
│                         [ Extend · 4,000g ]
│ ⌂ Lot 2  ▢▢  [ Willow House ] [Build · 20,000g]
│ ⌂ Lots 3–6 · built in turn               │
├──────────────────────────────────────────┤
│ Needs a room: none                       │
│ Shared houses: +10 bond a night a pair.  │
│ Move: tap a face, then a free room.      │
└──────────────────────────────────────────┘
```

#### Rooms and moves

- **At her wedding** she takes a room at once: **her default** is the house where her **closest friend** lives when it has
  room, else the first house with room, **the Farmhouse first.** An **own-house wisher** takes an empty house first, and
  everyone else's default passes over a house she lives in while another has room. The Married screen names her room and
  offers the other houses with a free room.
- **With no room free** she keeps her Dorm bed, and her profile and Hearts row say **"Needs a room"**. Each night, once a
  room is free (a house built or extended, or a room moved out of), every spouse home in the Dorm who waits takes one,
  **in wedding order,** by the same default, and the morning says so ("⌂ Stand-in 2 moved into Rose Cottage"). One who's
  away waits until she's swapped home. You can also move her into a free room by hand at once.
- **Moves are at once and free,** any time: on the homestead's sheet tap a face, then a free room in another house (a
  move) or another house's face (a swap). A spouse leaving or arriving by a Dorm swap waits for the morning.
- **A spouse in her house has no Dorm bed,** so her bed is free for the next arrival, and **she's on the farm:** she
  takes jobs and tends, plays her events, spends evenings, does her chores, leaves her morning items, and eats breakfast
  and the reception with everyone.
- **Her own house:** an own-house wisher is happiest alone in a house; while she shares or waits her profile says, softly,
  **"She'd love her own house"**. Nothing is lost while she waits.

#### The night's house and its morning

- **Sleep at** (Tonight, once anyone is married, so Tonight then opens every night): the Farmhouse and each house with
  someone home ("· 3 home"), **☕** when a resident at Spouse 1+ would serve breakfast tomorrow (someone's meal ends tonight
  and no reception is coming), and the nights since ("9 nights") on one you haven't slept in for 8 nights or more. Preselected is **the
  house slept in least lately** (one never slept in first; ties the lower number); with no one housed, the Farmhouse. On a
  **birthday-alone** wisher's birthday, **"Her room"** too ("· ‹her name›, just you two"). A tap picks it at once; End the
  day never waits on it.
- **That night**, before the bin, the house is noted as slept in and the pick clears for tomorrow. Later in the night each
  pair sharing a house earns **+10 bond**, and a spouse at Spouse 1 or 3 whose 600 is full reaches **Spouse 2 or 4,** with
  no event (Spouse 2 starts her every-2nd-morning count). Spouse 3 and 5 are always events.
- **The morning is that house's:**

<!-- live:house-morning -->
|  | The morning of the house you slept in |
|---|---|
| Each resident | +30 to her spouse bar (`addLove`, an anniversary’s ×2 applies) |
| A resident at S1+ | Her breakfast: everyone on the farm with no meal left well fed one day, once; +5 bond a pair it feeds |
| Each resident at S2+ | One more morning item of her line, ★3+ (`lineGood`, n = 2), in her own item line |
| A house line | One resident’s line from the pack’s `houseLines`, else her temperament’s template |
| Her birthday alone | Her room: only her +30, breakfast and item |
| Not slept in for 8 nights | “Rose Cottage misses you”, with Tonight › and Another night; never a penalty |
| Shared houses | Every night, +10 bond to each pair of residents (step 6) |
| The Festival of Vows | The finale’s day, each later year: every spouse +50, and a festival night |
<!-- /live -->

- **The house line** is one resident's, drawn by the day: her own house lines from the pack, else her temperament's
  template with her name filled. Mornings only. The templates, original:

<!-- live:house-lines -->
| Temperament | House lines (`{name}` hers) |
|---|---|
| Breezy | {name} is already out the door: “Race you to the porch!”<br>{name} hums at the window, toast in one hand. “Morning! The sky’s showing off.”<br>{name} swings in with the post. “Up, up. The day’s waiting for us.” |
| Steady | {name} sets two cups down without a word and slides yours closer.<br>{name} has swept the step and folded the blankets. “Slept well? Good.”<br>{name} pours the tea. “No rush this morning. Sit a while.” |
| Bold | {name} hauls in an armful of firewood. “Breakfast after. Chores first, together.”<br>{name} plants a hand on the table. “Big plans today. You’re in, right?”<br>{name} grins over her mug. “I was up an hour ago. Took you long enough.” |
| Gritty | {name} is mending a chair by the hearth. “Almost done. Then we eat.”<br>{name} shakes the frost off her boots. “Cold one. Kettle’s on for you.”<br>{name} nods at the door. “Rain later. We’ll beat it if we start now.” |
| Clever | {name} looks up from her notes. “I’ve planned the whole day. Want to hear it?”<br>{name} slides the almanac over. “Look: perfect weather for the east rows.”<br>{name} taps the window. “The swallows are back early. Good sign.” |
<!-- /live -->

- **"Rose Cottage misses you"** names the house with residents slept in least lately once it's been 8 nights or more
  (a house you've never slept in doesn't), with **Tonight ›** (it becomes tonight's house) and **Another night** (the
  line put away for the day). Never a penalty.

#### Household milestones

The married count opens the household's milestones, each news once in the morning as the count passes it ("Married 5 ·
Household scene 1, the furniture set, +5% items"). The crew's +5%s and the second evening read the count live. The Hearts
header always says **"Married n/N"**.

<!-- live:household-milestones -->
| Married | Opens |
|---|---|
| 1 | The homestead (House 1 to build); the night’s house (Sleep at); anniversaries |
| 5 | Household scene 1; the furniture set (five pieces); +5% items crew-wide |
| 10 | Household scene 2; two evenings every fourth day; two invitations a morning |
| 15 | Household scene 3; +5% more items crew-wide |
| 20 | The finale, the Great Harvest; then the Festival of Vows each year |
<!-- /live -->

**The furniture set** comes at 5 married: five pieces, placed one a house from the homestead's sheet, as words until
decorations draw them:

<!-- live:furniture -->
1. Patchwork Armchair
2. Pine Bookcase
3. Copper Kettle Stand
4. Window-Seat Cushions
5. Braided Hearth Rug
<!-- /live -->

#### Household scenes, the finale and the Festival of Vows

- **Household scenes** (at 5, 10 and 15 married) and **the finale** (20) are **Ready offers,** never auto-played. From the
  morning after the wedding that reaches them, the morning's Hearts lines ("⌂ Household scene 1 · Ready", with **Play**)
  and the Hearts header show them, and they play over any page: the pack's opening, each spouse's beat in **wedding
  order** (one whose beat isn't written is skipped), then its close. A choice in them is wording only. They **pay
  nothing,** are read once, and the Diary's Memories shelf replays them. Only scenes the pack holds are offered.
- **The finale, the Great Harvest,** is Ready the morning after the wedding that makes **20 married,** once: its opening
  at the festival ground, its dance (a play whose grade pays nothing), each spouse's beat, its close, and then **the game's
  last stage-up card,** "The Great Harvest", with every spouse's face. **The game goes on.**
- **The Festival of Vows** falls each later year on the finale's day: every spouse **+50** that morning (a Hearts line,
  "♥ The Festival of Vows · 20 spouses · ♥ +1000 · festival night tonight") and a **festival night** that evening, in its
  own slot.

#### Bonds and ties

Each pair of Umas on the farm holds **bond points**, whole, that **never fall.** They grow when two share a place, five
**bond hearts** come at fixed thresholds, the authored ties **seed** them, and each new heart opens the pair's
**conversation**.

```
 day 1: the opening brings the three ──► their ties seed: Stand-in 1 & 2 at 150 (♥♥), Stand-in 1 & 3 at 50 (♥)
   │                                      the next morning: "♥♥ Stand-in 1 & Stand-in 2 · bond 2 · Read"
   ▼
 two Umas at the forest all day ──► that night: +10 a pair (+15 if both favour foraging; ×1.5 more at Romance 4)
   │                                 290 → 300: ♥♥♥, the morning lists "bond 3"
   ▼
 the next night, at the forest again ──► +10% of each one's night's items, copies into the Warehouse
                                          the morning: "Side by side · +1 item"
```

What a pair earns:

<!-- live:bond-points -->
| Shared | Points | Paid by |
|---|---|---|
| Working the same place the same day (the Fields’ tenders together) | +10 a pair; ×1.5 when both favour that place’s line | `bondsTonight`, night step 6 |
| An expedition party, a day away | +15 a pair | `addBond`, from expeditions (not built yet) |
| A festival team | +20 a pair | `addBond`, from the festivals (not built yet) |
| The same staff meal, or the same breakfast | +5 a pair | `addBond`: breakfast at a house’s morning; the staff meal once the Kitchen is built |
| The same house, a night | +10 a pair | `shareTheHouses`, night step 6 |
| **Romance 4:** her bond with her closest friend | ×1.5 on any of these, once (never ×2.25 when both qualify) | `bondFactor`, in `addBond` |
<!-- /live -->

- **The same place the same day:** every pair among the Umas who worked one place today earns +10, once a night (a
  running job, or the Fields' tenders with a growing block, who count as one place). **×1.5** when both have the same
  favourite line and it's that place's (two foragers at the forest or the Sawmill, two farmers tending). An Uma works one
  place a day, so a pair earns this once.
- **What pays today:** the same place, the same breakfast and the same house. An expedition party, a festival team and a
  staff meal pay once those features exist.
- **Romance 4:** what a pair earns is ×1.5 when either Uma is at Romance 4 or later and the other is her closest friend;
  once, never ×2.25 when both are.
- **Whole:** each pay rounds once, half up, after its factors: two foragers who are closest friends, one at Romance 4,
  earn 10 × 1.5 × 1.5 = 22.5, so **23**.

The hearts, and how long two Umas at one place every day take to reach them:

<!-- live:bond-hearts -->
| Hearts | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Points | 50 | 150 | 300 | 500 | 750 |
| Two at one place every day (+10) | Day 5 | Day 15 | Day 30 | Day 50 | Day 75 |
| Sharing a favourite line there (+15) | Day 4 | Day 10 | Day 20 | Day 34 | Day 50 |
<!-- /live -->

Points go on past 750. A bond setup on her route ("Bond 3 with Stand-in 2") reads these hearts.

**The ties' seeds.** When she joins, each of her ties whose other Uma is on the farm starts at its seed (a seed never
lowers a bond). An Uma whose tie hasn't arrived has no bond with her yet.

<!-- live:tie-seeds -->
| Tie strength | Bond starts at | Hearts |
|---|---|---|
| 3 | 150 | 2 |
| 2 | 50 | 1 |
| 1 | 0 | 0 |

The stand-in pack’s ties (invented):

| Pair | Kind | Strength | Seeded at | Authored conversations |
|---|---|---|---|---|
| 9000001 & 9000002 | friends | 3 | 150 | Bond 1, 2, 3, 4, 5 |
| 9000001 & 9000003 | rivals | 2 | 50 | — (the tie’s line) |
| 9000002 & 9000003 | teammates | 1 | 0 | — (the tie’s line) |
<!-- /live -->

- **A seeded heart is a new heart:** its conversation opens and the next morning lists it, so an arriving Uma comes with
  what her closest ties already share.
- **Her closest friend** is her first tie by one order, over all her ties, on the farm or not: the strongest, then the
  most bond points, then the ties' order. Her profile's Ties use the same order. Her closest friend's loved gift shows
  from Friendship 7, Romance 4 grows their bond, her wedding room defaults to her friend's house, and her two closest
  friends on the farm are her wedding guests.

#### Side by side

At 3 bond hearts two Umas work **side by side:**

<!-- live:side-by-side -->
| Where | Beside a 3-heart partner | How |
|---|---|---|
| A work place (gathering, a station) | +10% of her night’s items | Night step 4 (`nightExtras`), after the hauls: copies of the items her work finished tonight, the same goods and stars, `share × n` whole and one more by `draw(uid, day, 'bond:<id>', 0)`, each picked by `draw(…, k)`; into the Warehouse. Her partner worked the same place today |
| The Fields | Tended growth ×1.1 | Night step 2 (`blockGrowth`): her partner tends another block with a growing plot |
<!-- /live -->

- **Why at night:** a day's haul is planned when its job starts, so a bonus at planning would miss a partner who starts
  later. Side by side pays as a night extra, after the hauls, reading the bonds as they stand then: a pair who reach 3
  hearts tonight work side by side from the next night. The job's own plan never changes.
- **In her element** (Friendship 8) makes it ×1.2 for her at her line's place; the perks' own pot follows it (see the
  perks at her line, above).
- **The Fields:** her partner's block must have a growing plot. The block's card says "· side by side", and its nights
  left count it.
- **The morning** says "Side by side · +3 items", the night's extras in all, opening the Warehouse.

#### Pair conversations

- **Each new heart opens one conversation,** the pair's at that level. **An authored one** comes from the pack's pair
  file, for a tie's pair only; the pack may hold any of the five levels. The stand-in's first two Umas have all five; the
  stand-in's farmer and fisher have none, so their tie's line stands in.
- **Without an authored one,** the heart's line is the tie's line, or "‹a› and ‹b› are closer now" for a pair with no tie,
  with no scene.
- **Read** plays the pair's opened and unread levels in turn in the scene player ("Stand-in 1 & Stand-in 2 · Bond 1
  (1/2) · Fields"), each line a tap, the speaker's bust. A choice is wording only. The end, or **Skip**, marks every level
  read, once. **It pays nothing.** A replay from the Diary marks nothing new.
- **The morning** lists the bond hearts reached since the last morning, one line a pair at its highest heart, in the
  cast's order: "♥♥ Stand-in 1 & Stand-in 2 · bond 2" with **Read** while a conversation up to that heart waits (a seed
  from 0 to 2 plays bonds 1 and 2), the heart alone once read, or the tie's line or the generic words.
- **The Diary's Conversations** lists every pair with a heart (the most hearts first), its conversations read as **Bond
  n** replays and **♥♥ Read** for the unread.

#### The romance at night

Every step of the night, the romance's among them, is in [the calendar and the day](#the-night-step-by-step). A
completed chapter brings its authored arrival, her ties seeded like any arrival's, and the night clears the whole of the
day's romance record.

**The morning's Hearts section** comes after Ranks. Each line is a tap to her profile (or where it says), in this order:

| Order | Lines |
|---|---|
| 1 | **Ready**, read live: up to three in the tab's order ("● Ready · Stand-in 1 · Friendship 1 · the Fields", with **Play**), then "+2 more" (the tab filtered on Ready); then the household's Ready offers ("⌂ Household scene 1 · Ready", with **Play**) |
| 2 | This morning's invitations, with **Yes, tonight** and **Another day** |
| 3 | The house's morning ("⌂ Farmhouse · Stand-in 1 · ♥ +30 · ☕ 3 fed · +1 item") with its house line under it; a spouse who moved into a room; "‹house› misses you" with **Tonight ›** and **Another night**; morning items ("♥ Stand-in 2 left you ★3 Shiitake"); the night's chores |
| 4 | Birthdays and anniversaries, today's before tomorrow's, birthdays first ("★ Stand-in 1's birthday today", "♥ Stand-in 1's anniversary · ★5 Carrot left for you"); the Festival of Vows |
| 5 | Levels reached overnight ("♥ Stand-in 1 · Spouse 2, reached overnight", **New**, opening her card); arrivals ("‹name› arrived · away", **New**) |
| 6 | The perks' extras ("Perks · +2 items"), then side by side ("Side by side · +3 items"), then each pair's bond hearts |

Within a place the night's order holds, each Uma in the cast's order. The section shows whenever a stored line or a Ready
Uma is there. **There's no pop-up per event:** the morning, her ● Ready chip and **♥ on her pip** wherever the map draws
her are the romance's only signals, and pips stay their places' taps. The household milestones are news in the morning's
section after it.

## Part 4 — The HD-2D farm and the save

### The HD-2D farm (an opt-in preview)

Home can draw the farm on the shared HD-2D stage: flat painted pieces in a lit 3D diorama, seen from above at an angle.
It's a preview, off by default and set per device. With it off, Home is the usual farm map. The stage only shows the
save: no rule reads the switch, and nothing on the stage changes a count or the save.

#### Turning it on

- **Account → HD-2D farm (preview)** is a switch, labelled "This device only". Home follows it as soon as it's flipped.
- **`?stage=1` in the address** turns it on as the app opens, and **`?stage=0`** turns it off. The app then drops the
  parameter from the address, so a reload keeps the device's choice.
- **The choice is kept on the device**, with the app's other device preferences. Where the browser blocks storage (a
  private window), it reads as off.
- **Nothing downloads until it's on.** The stage's code (with its 3D engine) and its art load the first time Home draws
  with the switch on. Once loaded they stay on the phone, so the stage works offline from then on. A player with the
  switch off never downloads them.
- **One engine at a time:** with the switch on, Home doesn't load the usual map's engine.

#### The farm, laid out from the save

The stage builds the whole farm from the save, and rebuilds it whenever the save changes (a crop grows, a place opens, a
house is built). The camera, and every walk whose path still stands, carry across a rebuild.

- **Portrait, 9 tiles across**, fitted to the phone's width. The camera looks down at 35° and pans up and down only; a
  flick glides to the nearest band and settles there.
- **Bands of three plots.** A band is three 3 × 3 plots side by side, one per column, with a path row under them: 4
  tiles deep. In each plot the back two rows hold the building (or the place's ground and landmarks), and the front row is
  the **apron**, where the place's Umas work and its name hangs.
- **Lanes.** Each column keeps a lane of path at one edge where its plot's layout leaves room: the left column at its
  right edge, the middle and right columns at their left edges. Buildings stand flush to the other side. The lanes and the
  path rows join every apron to the Gate.
- **The Gate's plot is all path:** the spine from the yard down to the town, the Gate's arch over its apron, fences on
  either side.
- **Ground levels:** the ground is level 1; the Fishery's pond and the Quarry's pit sit a level down, and the Mine's back
  row is a rock wall.

```
  x 0 ─── 2 │ 3 ─── 5 │ 6 ─── 8
  ┌─────────┬─────────┬─────────┐
  │ bldg  L │ L  bldg │ L  bldg │  back row     the building (flush away from the lane),
  │ bldg  L │ L  bldg │ L  bldg │  back row     or the place's ground and landmarks
  │  apron  │  apron  │  apron  │  front row    where Umas work; the name pill hangs under it
  ├─────────┴─────────┴─────────┤
  │ path ────────────────────── │  path row     under every band
  └─────────────────────────────┘
   L = the lane, laid as path where the plot leaves it free
```

**The bands, top to bottom:**

| Band | Left | Middle | Right |
|---|---|---|---|
| 1 | Fields | Mill | Coop |
| 2 | Forest | Sawmill | Barn |
| 3 | Fishery | Smokehouse | Kitchen |
| 4 | Mine | Smelter | Restaurant |
| 5 | Quarry | Cutter | Forge |
| 6 | Shipping bin | Warehouse | Dorm |
| 7 | Requests board | Gate | Open ground |
| Homestead | Farmhouse · Houses 1–6 and the next lot, three a band | | |
| Last | Shop | Festival ground | Expedition post |

The homestead's one to three bands sit between the yard and the town, so the farm is 36, 40 or 44 tiles deep, the town
edge last.

**Each place is a recipe:** walls, roof, width × storeys and door, with one or two landmarks, so each place reads
differently from its neighbours. No signs and no words are painted on the farm.

| Place | What stands | Ground and landmarks | Where its Umas work |
|---|---|---|---|
| Fields | No building | Tilled soil; a scarecrow in the middle and the crops on the other eight tiles | One tender per owned block: the apron's three tiles, then one behind its right end |
| Mill | Plaster, thatch, 2 wide, 1 storey; sails on its front | Grass | The lane's three tiles and the apron's middle |
| Coop | Plank, shingle, 2 wide, 1 storey | Paddock; a trough | — |
| Forest | No building | Forest floor; three trees, a stump, a mushroom patch, a herb patch | The apron's three tiles and one behind its right end |
| Sawmill | Plank, shingle, 2 wide, 1 storey, open-fronted (windows, no door) | Grass; a log pile | The lane's three tiles and the apron's middle |
| Barn | Plank, red roof, 3 wide, 2 storeys, double doors | Paddock; a hay bale | — |
| Fishery | No building | A pond over the back two rows' left two tiles, reeds, a dock | The apron's three tiles and one behind its right end |
| Smokehouse | Plank, slate, 2 wide, 1 storey | Grass; a smoker | The lane's three tiles and the apron's middle |
| Kitchen | Plaster, red roof, 2 wide, 1 storey; a chimney, a herb box under the window | Grass | — |
| Mine | No building | A rock wall across the back row; the mine's mouth, an ore cart, a lantern | The apron's three tiles and the mine's mouth |
| Smelter | Stone, slate, 2 wide, 1 storey | Grass; a furnace | The lane's three tiles and the apron's middle |
| Restaurant | Plaster, shingle, 3 wide, 2 storeys; an awning | Paving; a café table | — |
| Quarry | No building | A pit over the back two rows' left two tiles, two rocks, a stone stack | The apron's three tiles and one behind its right end |
| Cutter | Stone, slate, 2 wide, 1 storey | Grass; a grindstone | The lane's three tiles and the apron's middle |
| Forge | Stone, slate, 2 wide, 1 storey; a forge chimney | Grass; an anvil, and the ring bench beside it | — |
| Shipping bin | No building | Grass; a sack, a barrel, the bin | — |
| Warehouse | Plank, red roof, 3 wide, 2 storeys, double doors | Grass; crates | — |
| Dorm | Plaster, red roof, 3 wide, 2 storeys; flower boxes under two windows | Grass | — (the yard's idle Umas start on its apron) |
| Requests board | No building | Grass; the notice board | — |
| Gate | No building | All path; the arch, fences either side | — |
| Shop | Plaster, shingle, 2 wide, 1 storey; a shop door | Paving; a stall awning | — |
| Festival ground | No building | Paving; bunting, a flagpole | — |
| Expedition post | Plank, shingle, 2 wide, 1 storey | Grass; a flagpole, a signpost | — |
| Open ground | No building | Grass, flowers, a bush | — (idle Umas when the yard is full) |

A place's work slots face the work: an Uma at a slot beside a building faces it, and one in front of it faces into it.

**When a place stands.** A place's recipe stands once the place is open (by its chapter, Farm Rank or reward, as its
lock says) and, for the three stations (the Mill, the Sawmill and the Smokehouse), once it's built. The Forge stands
once its ring bench does. Until then the plot is an **overgrown lot:** two clumps of weeds, brambles and a broken
fence on grass, its lane left clear, with the place's name and lock over it. A place can stand and still be locked: one
that's open but has no screen yet keeps its lock, which says "Soon".

**The homestead.** The Farmhouse is a 3-wide, 2-storey plaster house with a red roof, a
chimney, flower boxes under two windows and a porch. Every other house is the same cottage: plaster and thatch, 2 wide,
1 storey, a chimney and a flower box, its door on the lane's side. The houses fill the homestead's bands three to a band
(the Farmhouse, House 1 and House 2 first; Houses 3–5; House 6). The built houses show, and so does the next lot, marked
by stakes, so the farm grows a band at a time.

**The Fields' crops.** The soil's eight tiles around the scarecrow show the first eight plots in the Fields' own order:
Block A's plots 1 to 8. The other blocks' plots aren't drawn. A plot shows nothing while empty, a sprout while young, a
growing crop from half its growth to Ready, and its family's ripe crop once Ready. The morning after plots wither, as
many of the block's empty plots show a withered crop as the morning summary lists, for as long as the summary is up.

| Ripe family | Crops |
|---|---|
| Root | Carrot, Potato, Onion, Sugar Beet, Ginger, Peanut, Golden Carrot, Mandrake |
| Leafy | Cabbage |
| Herb | Mint, Basil |
| Grain | Wheat, Oats, Barley, Rye, Buckwheat, Sunwheat |
| Rice | Rice, Moonrice, Wild Rice |
| Staked, red | Tomato |
| Staked, green | Bell Pepper |
| Staked, purple | Eggplant |
| Corn | Corn |
| Sunflower | Sunflower Seed |
| Spear | Asparagus |
| Gourd | Emperor Pumpkin |

#### The kit

The farm is painted with the `kit-farm` art kit: one 2048 × 2048 page of 87 frames, loaded the first time the stage
shows. The farm names every piece it draws, and the names are the contract: a piece the kit doesn't paint yet is drawn
from the stage's own flat **stand-in kit** under the same name, copied onto the kit's page so the farm builds from one
page. The stand-in draws the 30 pieces the kit doesn't paint:

- the stone walls, windows and door (the Smelter, the Cutter and the Forge);
- the Mine's rock wall, its mouth and the ore cart;
- the Quarry's pit, its rocks and the stone stack;
- the grindstone, the furnace, the anvil, the forge chimney, the ring bench, the awning, the café table and the herb box;
- the paddock, the trough and the hay bale;
- the notice board, the signpost, the flagpole and the bunting.

On a first load, Home waits up to a second and a half for the kit's page, draws the stand-in alone if it hasn't
arrived, and swaps to the kit when it does. If the kit can't be read or its page fails, the stand-in draws the farm for
the rest of the session.

#### Names, locks, badges and pips

Over the stage sit the same models the usual map's places carry, following the camera:

- **The name pill** hangs under each plot's apron. A locked place has the lock in its pill and its name greyed.
- **The Ready badge** sits at the plot's foot while the place has finished work to collect (or, on the Fields, a Ready
  plot).
- **The pips** hang in a half arch over the plot: each working Uma's face ringed by her job's progress, or a free dot;
  the Fields' tenders; a house's residents and its free rooms.
- The open ground has none. Overlays off screen hide.
- **Collect all**, the help button, the quick look and the morning summary sit over the stage as they do over the map.

#### Taps

- **A tap opens what the usual map's place opens:** the place's screen, its quick look, its sheet (the shipping bin, the
  shop), or, for a house or the next lot, the homestead's sheet at that house. The tap takes whatever is drawn nearest
  under the finger (a building, a landmark, a crop or the apron), else the plot of the ground under it. A path or the open
  ground opens nothing.
- **A tap on an Uma opens her profile** on the Hearts tab. An Uma drawn in front
  of a building wins the tap.
- **A long-press** (half a second, without moving) opens any place's quick look, the Warehouse's and the Dorm's too; on a
  house it opens the homestead's sheet, as a tap does.
- **A drag pans** and never taps. The phone's own long-press menu is turned off on the stage.
- For VoiceOver, every place and every Uma on the farm is also a link, to where a tap on it goes.

#### Light, fade and the camera

- **The season is the light.** Spring is fresh and soft, summer bright and warm, autumn an amber tint with the lamps a
  little lit, winter cold and pale with the lamps stronger. The sky behind the farm's top and sides takes the season's
  colour. When a morning brings a new season, the light eases over a second (at once with reduced motion).
- **What stands in front fades only for what you're looking at.** At rest nothing is faded, except that a roof or a tree
  in front of an Uma with a Ready bubble fades so she shows through. With a place's quick look open, a roof or a tree in
  front of that place's work slots fades to about a third.
- **The camera opens** with the band of the first place showing a Ready badge (in map order) at the top of the view,
  else the Fields'. It keeps its place between visits to Home for the rest of the session. A new screen size settles it on
  a band again.
- If the stage refuses to build the farm, Home shows the error in a line over it.

#### The Umas on the farm

The places keep one look; the Umas show the work. Days are turns, so nobody moves while the app is closed: the farm
shows where the save puts everyone now.

**Who stands where.** The same Umas the pips show:
- **At work:** every Uma whose job holds a slot stands on that slot, facing her work; every tender stands on her block's
  slot on the Fields.
- **Idle:** everyone else on the farm stands in the yard, facing you. The spots fill in this order: the Dorm's apron
  (middle, left, right), the path in front of it (middle, left, right), the path row on toward the shipping bin, then
  the free tiles of the open ground beside the Gate. A tile under a building or a solid landmark, or in water, rock or the
  pit, is never a spot. With more Umas than spots, they share spots from the first. An idle Uma keeps her spot while it's still
  free, so putting one Uma to work never shuffles the others.
- **A spouse in her house** stands on her house's apron, then on the path in front of it.
- **Nobody who's away.**

**How they move.**
- **At the app's start, on a new morning, and when a sync brings a save this phone didn't make, everyone stands where
  she belongs at once.** The counts never wait on a walk.
- **A change made on this phone the same day moves only who moved:** an Uma put to work (from a quick look, a place's
  page or the Fields) walks from where she stood to her slot; one recalled, or collected with nothing queued next, runs
  home; one who joins the farm walks in from the Gate; one who leaves runs out of it. Walking is 3 tiles a second,
  running 5.4.
- **A walk started away from Home plays when Home comes back:** Home keeps what it last showed for the session, so a job
  started on a place's page walks her to her slot on return. One still walking when Home closed walks again from where
  she set out.
- **A walk a rebuild can't keep** (a crop grows, a place opens) starts again from where she stands. One with no way
  through stands on her tile at once.

**Ready bubbles.** A round card with a tail over a Ready Uma's head, rising as it appears (no rise with reduced motion):
- **Her work's item** when she has something to collect (a station's output; the Forest's or the Fishery's haul each
  morning of a longer job). A place has as many bubbles as it has slots with something to collect.
- **The crop** over a tender whose block has a Ready plot.
- **♥** in the corner of either when her heart event is Ready too, or **♥ alone** over an Uma with nothing to
  collect.
- Nothing while she simply works.

**A bubble's tap** (a 44 pt target, kept inside the stage's edges):
- **Her work's bubble collects her work.** The items rise in an arc to the Warehouse (up to three icons and the count;
  none with reduced motion), then she starts her queued job or runs home.
- **A crop bubble harvests her block,** the crop and its count rising the same way.
- **A ♥ bubble plays her event.**
- A collect the rules refuse changes nothing, and the bubble stays.

**How they look.**
- **A sprite** for an Uma whose outfit has a sprite set in master data, once her set is live. At most **8 sets are live
  at once**, for the Umas in view nearest the middle of the view; a set that's live stays live while one of its Umas is in
  view, and the rest wait as standees until a set frees up. Sets download the first time they're needed and stay on the
  phone.
- **A standee** for everyone else, and for an Uma while her set loads: her face on an upright card on a small wooden base,
  gliding with a small bob. A plain card shows until her face arrives, or when master data has none.
- An Uma's look comes from her outfit in the story pack's cast.

#### Battery

- The stage runs at 30 frames a second.
- **The loop stops at rest.** It runs only while something moves (a finger, the camera, a walk, a fade, a set loading,
  the light easing) and stops once the stage reports it's still, no finger is down and nobody walks; the still frame is
  drawn once.
- It also stops while the app is in the background, and while a full-screen scene or sheet covers Home (an event, a
  conversation, the evening, a level-up, the household and the like).

#### Not there yet

- **The working nod.** A working Uma stands still at her slot. A small nod while she works waits on a stage feature that
  can play an action on a figure.
- **The farm-work animations** (Umas digging, fishing, hammering) aren't built.
- **The workshops' games** (the Kitchen, the Restaurant and the Forge) aren't built, on the stage or off it.

### The save, as a player meets it

#### One save, on the phone first

- **One save per player:** the signed-in Google account's farm, one copy on the phone and one on the server.
- **Every change is saved on the phone at once.** Play never waits on the network once the phone holds a save.
- **A sync follows** 1.5 seconds after the last change, when the app comes back to the foreground, when the network
  returns, and as the app opens.
- **Opening the app:** splash, then Google sign-in, then the farm. The app opens the phone's save for this account; with
  none, the server's; with none there either, a new farm on day 1. A save from before v4 stops at the start-over card
  first (see [Save versions](#save-versions)).
- **The app waits for the story pack** as it opens; if the pack can't load, the app stops and offers Try again.
- **A new phone needs the server once.** Offline with no save on the phone, the app stops with "The game couldn't open on
  this phone." and Try again, since a new farm made offline could later outrank the real one.
- **Only a player's own change moves the save's "last changed" time.** Starting the new farm over an older save and
  syncing never do.

#### What a sync does

A sync reads the server's save, then does one of three things:

| The phone | The server | What happens |
|---|---|---|
| No changes since the last sync | Newer than the phone's | The phone takes the server's save |
| No changes since the last sync | The same | Nothing |
| Changes waiting | Unchanged since the phone's last sync, or empty | The phone uploads; the server stores it as the next revision |
| Changes waiting | Changed by another device | **The conflict rule** (below) |

- **Someone else wrote first:** if the server moved on between the read and the upload, the app checks again against
  what's stored now and retries, up to three times in one sync. Changes still unsent after that wait for the next sync,
  and Account says "Sync paused".
- **A change made during a sync** starts another sync right after.

**The conflict rule.** When the phone and the server both changed, the save changed last wins whole; a tie keeps this
phone's. If the server's wins, this phone's unsynced save is kept first as a safety copy ("Replaced by a newer save"),
and every page says **"A newer save replaced this device's changes. They're kept in Account."** until Account is opened.
If the copy can't be kept, nothing is replaced and the sync pauses.

**A refused upload.** The server stores what the app sends and never edits a save. It refuses:
- a save it can't read (a bad shape, unknown keys, or a version other than v4: an old build's older save);
- a save belonging to another account;
- a save of an older version than the one it holds.

Each refused upload is kept on the server as a rescue copy (the newest one), so play that couldn't be uploaded isn't
lost; nothing restores it automatically. The phone keeps its changes, and Account says "Sync paused".

#### What the app says

| State | Account's "Save" row | The account bar's chip |
|---|---|---|
| Syncing | Syncing… | — |
| Offline | Offline · saved on this phone | Offline |
| A sync failed, changes waiting | Sync paused · saved on this phone | Sync paused |
| A sync failed, nothing waiting | Sync paused | Sync paused |
| Changes waiting for the next sync | Saved on this phone | — |
| The server holds everything | Synced | — |
| Never synced | Not synced yet | — |

- Account also shows **Last synced**, the build and master data's release. The chip opens Account.
- **"Not backed up since …"** shows on every page once a sync has failed (not merely offline) with changes waiting and
  the last good sync is ten minutes old or more: "Not backed up since 8 Nov, 14:05. Your progress is only on this
  device." It opens Account.

#### Safety copies

Account lists the newest five safety copies this phone keeps for the account, each with why and when:

| Reason | When it's kept |
|---|---|
| Replaced by a newer save | A sync replaced unsynced changes on this phone |
| Before a restore | A restore replaced the save that was playing |
| Couldn't be read | The phone's save couldn't be read (it's kept as it was, and the app opens the server's) |
| Before the new farm | The farm started over from an older save that held unsynced play |

- **Restore** puts a copy back as the newest change, so it uploads over the server's. The save it replaces becomes a
  "Before a restore" copy first, so a restore can be undone.
- A copy this build can't play does nothing on Restore. A copy older than v4 shows **Kept** instead of Restore, since
  restoring it would only start a new farm again.

#### The update prompt

The app keeps itself on the phone. A new build downloads in the background and waits: a card at the top says **Update
ready**, "Restart to use the new build.", with a **Restart** button. Nothing reloads until Restart is tapped. The card
sits outside the opening screens, so it shows even when the app stopped while opening.

#### Save versions

| Version | What it is | What a player meets |
|---|---|---|
| v4 | The farm: the one save | Every new farm starts on it, and the app plays and writes it |
| v1, v2, v3 | Older formats, from before the farm started over | **The start-over card,** then a new farm on v4 |
| Newer than v4 | — | Refused: this build doesn't read it |

- **The start-over card.** When the phone's save, or on a new phone the server's, is older than v4, the opening stops at
  one card: **"Your farm starts over"**, "This version of the game begins a new farm on day 1.", and **Start the new
  farm**. Nothing changes until the button is tapped.
- **The new farm** is day 1 on v4: 500g, 9 Carrot seeds, Block A, the Dorm at level 1, the Farmhouse, nobody on the
  roster and the farmer's name empty. Only the account carries over, its "last changed" time with it, so the farmer's
  name is the new farm's first change. Then the opening runs as on any new farm.
- **Nothing goes silently:** a phone save with unsynced play is kept first as a "Before the new farm" safety copy (if it
  can't be kept, nothing changes and the card says so, with the button to try again). The new farm syncs up as it is,
  and the first time the server stores a v4 over the older save it copies the older one, whole, to a backup.
- **An older save met later** (the server's in a sync, or in a conflict) becomes the same new farm and uploads.

#### A newer save on an older build

A save newer than v4 comes only from a newer build. When this one meets it:
- **As it opens** (the phone's save, or on a new phone the server's): the opening screen says **"This save is from a
  newer version of the farm."** with Try again, and the app asks for the new build at once, so the update prompt comes
  up; Restart brings a build that can play it.
- **On the server, at a sync:** the sync stops before any upload ("Sync paused"), so nothing writes over the newer save.
- **An upload of an older version the server receives anyway** is refused and kept as a rescue copy.

A save the app can't read at all on the phone is kept as a "Couldn't be read" safety copy, and the app opens the server's
save instead.
