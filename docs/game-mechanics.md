# Game mechanics

How uma-farm works today, as the code runs it. This is the one description of the game: every rule change updates it in
the same commit, and where it and the code ever differ, the code wins and this document is fixed. The page view is
[game-mechanics.html](pages/game-mechanics.html); where the game is going is in [the roadmap](roadmap.md).

**What's live and what isn't.** The deployed game is one game on **save v5**: a day of ten actions on a tile farm the
farmer works by hand, its places, the farm growing by building, and the **romance** (Part 3), played from the story
pack, and played whole without one: wherever the pack is silent, the default story plays, and every Uma without
portraits plays on the blank bust (see [What plays without the story](#what-plays-without-the-story)). The game is
laid out **sideways**, for a phone held in landscape (see [the frame](#the-frame-landscape)). A save from before v5
starts over (see [Save versions](#save-versions)).

**The tables are generated.** Every table between `<!-- live:… -->` markers is written from the rules by
`packages/domain/src/docs/render.ts`. A test fails when one is stale, and `pnpm docs:update` rewrites them. Edit the
prose here; change a table by changing the rule.

**Contents**

- **[Part 1 — The farm's days and work](#part-1--the-farms-days-and-work)**
  - [The calendar and the day](#the-calendar-and-the-day)
  - [The farm map and the bars](#the-farm-map-and-the-bars)
  - [The field](#the-field)
  - [Gathering](#gathering)
  - [The stations](#the-stations)
  - [Goods and gold](#goods-and-gold)
- **[Part 2 — The Umas and the farm's progress](#part-2--the-umas-and-the-farms-progress)**
  - [The roster](#the-roster)
  - [The town](#the-town)
  - [Talents and ranks](#talents-and-ranks)
  - [The farm's progress](#the-farms-progress)
- **[Part 3 — Hearts: the cast and the romance](#part-3--hearts-the-cast-and-the-romance)**
  - [The dialogue engine](#the-dialogue-engine)
  - [The cast and the story pack](#the-cast-and-the-story-pack)
  - [What plays without the story](#what-plays-without-the-story)
  - [The opening, the farmer's name, and meeting her](#the-opening-the-farmers-name-and-meeting-her)
  - [Her favourite line and tastes](#her-favourite-line-and-tastes)
  - [Her route](#her-route)
  - [Perks](#perks)
  - [Heart events and plays](#heart-events-and-plays)
  - [The evening](#the-evening)
  - [The ring, the wedding, and married life](#the-ring-the-wedding-and-married-life)
- **[Part 4 — The save](#part-4--the-save)**
  - [The save, as a player meets it](#the-save-as-a-player-meets-it)

## Part 1 — The farm's days and work

A farm day is a turn of **ten actions**. The farmer works the farm alone, by hand: each tile cleared, tilled, planted,
watered or harvested, each forage, chop or catch, each load started at a station, each crate shipped and going into
town takes one. Nothing on the farm moves until you end the day, whether the app is open, closed or left alone for a
week. Ending the day runs the night: the bin pays, watered crops grow a stage, the stations' loads finish and the date
turns. The morning opens on a card of what the night brought, and ten actions again.

```
 the day: 10 actions, one a tap                    End the day ──► the night, in order
   clear · till · plant · water · harvest   a tile               1 the bin pays
   forage · chop                    the woods' edge              2 watered crops grow a stage
   fish                             the pond's edge              3 animals (none on the farm)
   start a load                     a station                    4 the stations' loads finish
   ship a crate                     the bin                      5 workshops (none open)
   go into town                     the road (the shop, the town) 6 ranks and bonds (nobody works yet)
   free: building, the Dorm, talks, the evening                  7 crops wither; the date turns
                                                                 8 the Dorm, the goals, meeting her
 the morning: the summary card ◄──────────────────────────────── 9 the morning summary
   the bin · work done · hearts · new today · today
   [Start the day] ──► the next day, ten actions again
```

### The calendar and the day

#### Seasons, days and the year

Four seasons of 12 days make a 48-day year. Day 1 is Spring 1 of year 1, and day *d* falls in:
- **its year:** ⌈*d* ÷ 48⌉;
- **its season:** ⌊((*d* − 1) mod 48) ÷ 12⌋, counting Spring 0, Summer 1, Autumn 2 and Winter 3;
- **its day of the season:** ((*d* − 1) mod 12) + 1.

The season sets:
- **what you can plant** and which seeds the shop sells (the field);
- **what the woods' edge and the pond's edge bring home** (Gathering);
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

- **The date chip** in the bar shows the season's mark and the date ("Spring 3"); without the mark it draws a dot in
  the season's colour (Spring green, Summer gold, Autumn orange, Winter blue). Its spoken name is the whole date and the
  next festival: "Calendar: Spring 3, year 1 · Flower Show in 7 days". A tap opens the calendar.
- **The calendar** shows the day and the year ("Spring 3 · Year 1"); the four seasons with this one marked; the season's
  12 days, past days faded, today in the accent colour and a festival day ringed with a trophy; the season's festivals
  ("Flower Show · Spring 10"), each with what happens at it under it when the story says; the next festival with its
  countdown ("Flower Show · Spring 10 · in 7 days"); and the day of the year ("Day 3 of 48. Days move only when you end
  them.").
- **The next festival** is the first one on or after today, running on into the next year: on Spring 10 it's the Flower
  Show, today; on Spring 11 it's the Fishing Derby on Summer 10, in 11 days.

#### Festivals

Each season's 10th day holds its festival, and Winter 12, the year's last day, also holds the Harvest Cup. Festivals are
dates only: the calendar marks them, the morning says "Flower Show tomorrow" the day before and "Flower Show today" on
the day, and the Festival ground on the map stays locked ("Opens soon"). No contest is played and no prize is given.

**The story's festivals.** The pack's `world.json` may rename, move or add festivals ([the world in the
pack](#the-world-in-the-pack)); the year is then the story's everywhere: the calendar, the date chip, the morning,
festival night, and `festival` triggers and gates.
- **One of the game's five keeps its game rule under the story's name, wherever it falls:** its festival night, its news,
  the triggers and gates naming it, and the contest its rank challenge counts once the festivals are built. A moved one
  plays all of it on its new day every year, and none on its old day.
- **One of the story's own** is a festival day and nothing more: marked, said, its night, and its triggers.
- **One festival a day:** a move onto a day another holds is skipped, and that festival keeps the game's day.

A festival day also opens a festival night for the evening, and once the household's finale is reached, the Festival
of Vows returns on its day each year. Both are the romance's.

#### A day: ten actions

- **The day holds 10 actions.** The bar's actions chip counts what's left ("7/10"), every button that spends one says so
  ("Water · 1 action", "Fish · 1"), and a side panel says "7 actions left of 10". With none left, an action is refused
  ("No actions left today.") and its buttons are greyed.
- **One tap of work is one action:** a tile cleared, tilled, planted, watered or harvested; a forage, a chop or a catch;
  a station's load started; a crate shipped; going into town. Looking is free, and so are building a place, the Dorm,
  talks, gifts, her events and the evening; the shop is free once you're in town.
- **Going into town** takes one action and opens the town and its shop for the rest of the day.
- **The last action** opens a card over whatever page it was spent on, once: "Out of actions · The day's work is done."
  with **End the day** and **Not yet** (to build or spend the evening first). The day never ends by itself.
- **Special days** grant actions for events only, on top of the ten: New Year's, each festival, and the birthday of each
  Uma you've met. The save counts them apart (`today.eventActions`), and nothing shows or spends them yet: they wait for
  the festivals' and the town's events.
- **Nothing reads the device's clock.** A load is ready the next morning and a watered tile grows at night, so reopening
  the app moves nothing.
- **Your changes are stamped with the real time**, which syncing between devices compares; that stamp never moves the
  date.

The day's budget and the special days' event actions:

<!-- live:day-budget -->
|  | Actions |
|---|---|
| Every day | 10 |
| New Year’s (each year’s Spring 1) | +3 for events |
| A festival day | +3 for events |
| Each birthday of an Uma you’ve met | +1 for events |
<!-- /live -->

Every action in the game's design, with its cost. "Now" is charged today; the rest come with the part of the game they
belong to, and until then cost nothing or aren't there yet:

<!-- live:actions -->
| Where | Action | Cost | Charged |
|---|---|---|---|
| The fields | Clear a tile: weeds, a stone or a stump | 1 | Now |
| The fields | Till a tile | 1 | Now |
| The fields | Plant a tile | 1 | Now |
| The fields | Water a tile | 1 | Now |
| The fields | Harvest a tile | 1 | Now |
| The fields | Water a row, with the aptitude | 1 | With farmhands |
| Animals | Feed, brush or care for one; collect eggs, milk or wool; let them out or bring them in | 1 | With the ranch |
| Animals | Buy an animal, at the rancher’s in town | Free | With the ranch |
| The woods and the water | Forage once | 1 | Now |
| The woods and the water | Chop a log | 1 | Now |
| The woods and the water | Fish once | 1 | Now |
| The mine | Work a face once | 1 | With the mine |
| The mine | Take the stairs | Free | With the mine |
| Stations | Start a load | 1 | Now |
| The bin | Ship what you choose | 1 | Now |
| The town | Go into town | 1 | Now |
| The town | Shop, order a build, borrow or repay, once in town | Free | Now |
| The Umas | Introduce yourself | 1 | With the town map |
| The Umas | Talk | 1 | With the town map |
| The Umas | Give a gift | 1 | With the town map |
| The Umas | Invite her to work | 1 | With the Uma loop |
| The Umas | A hangout or a date | 2 | With the Uma loop |
| The Umas | Her event, when it’s ready | 1 | With the town map |
| A festival | Join it; it opens its own events | 3 | With the calendar |
| The household | Cook a meal for the household | 1 | With the Uma loop |
| The household | Choose tonight’s companion, at the day’s end | Free | With the Uma loop |
<!-- /live -->

#### End the day

**End the day**, the gold button at the bar's right end, ends the day.

**The nudge.** The button reads **All set** and glows once the day's actions are spent (a still glow under reduced
motion); before that it reads **End day**. Its spoken name says what's left: "End the day: 4 actions left · 2 dry · 1
ripe".

| Counts as | When |
|---|---|
| Actions left | The day's ten less those spent |
| Dry | A tile growing a crop, not ripe and not watered today: it won't grow tonight |
| Ripe | A ripe tile waiting to be harvested |

The nudge reads the save as it stands, so every device shows the same.

**The tap** opens the End-the-day sheet over whatever page you're on:
- **All set, or the Menu's "Ask before ending the day" switched off:** the day ends at once.
- **Otherwise** one line says what's left, "4 actions left · 2 dry", with **End anyway** and **Back**.

Either way the morning opens on the farm map. The tap holds the day it was meant for: a second tap, or a save that
another device has already moved on, ends nothing more. The night reads the game's master data (each Uma's talents and
birthday) and the story pack (her favourite line, her trigger to meet, the ties), which the farm loads as it opens; if
either can't load, the sheet says so with **Try again**.

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
2. **Crops grow.** Each growing tile watered today grows one stage, and one whose stages reach its days − 0.5 turns
   ripe; a dry tile doesn't grow. A farmer Uma's night chores each water a dry growing tile first. Then every tile dries
   for the next day.
3. **Animals.** Nothing changes: no animals live on the farm.
4. **The stations' loads finish.** Every load started today is done: its goods go into the Warehouse at their stars and
   the station is free for the morning. Side by side's and the perks' extras and foragers' and fishers' night chores go
   straight into the Warehouse too.
5. **Workshops.** Nothing changes: no workshop is open.
6. **Ranks and bonds.** Every Uma who worked today earns a day's rank points and ranks up where her challenge is met;
   bonds tick and her line pays. Nobody works yet (the farmer works alone, and the farmhands come later), so none of
   these move. Shared houses pay, spouses level, and well-fed days count down by one.
7. **The date turns.** On a season's last night, growing crops that don't grow next season wither first. Then the date
   moves on, and the whole of today's record clears: the day's actions and event actions, going into town, the places
   worked, chats, gifts, praise, events, evenings and invitations.
8. **The farm's news.** The places paid for yesterday stand; a Dorm level you bought takes effect and swaps arrive; the
   Diary pays its milestones and rows and the Farm Rank is recomputed; anyone in town whose trigger the farm now holds
   is met; the ring bench opens the night after the first Romance 8, and the household's milestones are noted.
9. **The morning.** A wedding's reception is served, the house's morning given, spouses move into rooms, the Festival
   of Vows is held, praise, birthdays and anniversaries are noted, morning items are left and the morning's invitations
   drawn; then the morning summary is built from what changed.

A night without the story pack runs the farm's steps and skips the romance's: no meetings, no favourites, no bonds and
no line pay. The farm waits for the pack before it ends a day, so in play every night has it.

The steps as the game lists them:

<!-- live:night -->
| Step | Function | What happens |
|---|---|---|
| 1 | `noteTonight` | Before the bin, once anyone is married: tonight’s house is noted (its last night slept is today), your pick from Sleep at or else the house slept in least lately; the pick clears for tomorrow |
| 1 | `payTheBin` | The bin pays: everything shipped today, at price × stars × demand |
| 2 | `growCrops` | Crops grow: each growing tile watered today grows a stage, and one whose stages reach its days − 0.5 turns ripe; a dry tile doesn’t grow; a farmer’s night chores each water a dry growing tile first; then every tile dries for the next day |
| 3 | `tendAnimals` | Animals: nothing happens until the ranch is built |
| 4 | `finishTheLoads` | Stations: every load started today is done, its goods into the Warehouse at their stars, the station free for the morning |
| 4 | `nightExtras` | Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again (20% in her element), seeded copies straight into the Warehouse; then the perks’ extras: the bond term × the romance term of the same items (her line’s +10% and +20%, her ring, a dream, the household; held to 40%), their own seeded copies. None until the farmhands work |
| 4 | `nightChores` | Night chores: a forager’s bring one item each from her rank’s deepest forest area this season, a fisher’s one fish each from her deepest spot, at a day’s haul’s stars, into the Warehouse; 1 from F6, 2 from R7, 3 from S4, on the farm only |
| 5 | `resetWorkshops` | Each workshop may be played again tomorrow |
| 6 | `tickRanks` | Rank points for every Uma who worked, one activity each, ×1.05 from her Friendship 5 and ×1.10 from Friendship 10, ×1.10 more beside a mentor (an Uma at Friendship 9 at her line’s place; one a place, never herself); rank-ups where points and the challenge are met. None until the farmhands work |
| 6 | `tickBonds` | Bonds: +10 to each pair who worked one place today, once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend. None until the farmhands work |
| 6 | `payLine` | Her line: +10 to each Uma who worked today at one of her line’s places, once a night. None until the farmhands work |
| 6 | `shareTheHouses` | Shared houses: +10 bond a night to each pair of spouses with rooms in the same house |
| 6 | `levelAtNight` | Spouse levels: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, no event (S2 starts her every-2nd-morning item); never S3 or S5 |
| 6 | `countWellFed` | The well-fed days count down |
| 7 | `witherCrops` | On a season’s last night, crops still growing that don’t grow in the next season wither, their soil left tilled; ripe crops wait |
| 7 | `turnCalendar` | The date moves; the whole of `today` clears: the day’s actions and event actions, going into town, the areas worked, chats, gifts, praise earned and paid, events, Ask her, evenings and invitations, the ring made and the reception |
| 8 | `raiseBuildings` | Places built: every place paid for yesterday stands this morning (`buildings[id] = 1`), each one news |
| 8 | `settleDorm` | The Dorm’s level bought takes effect; swaps arrive, each Uma in town coming home in the place of one leaving |
| 8 | `checkGoals` | The Diary pays its milestones and rows, and the Farm Rank is recomputed from income and resources |
| 8 | `meetUmas` | Meeting her: everyone in town not met yet whose trigger the farm now holds (a Farm Rank, a place built, a good shipped, another’s event; never the welcome list’s) is met, the cast’s order first: home while a bed is free, else she lives in town; each of her ties with someone met starts at its seed (strength 3 → 150, 2 → 50) |
| 8 | `unlockTownNotes` | Town notes: each of the world’s notes not yet unlocked whose unlock holds on the morning’s date (a season, a festival, a Farm Rank, a place built, a good shipped, another’s event) unlocks, once; the morning names them |
| 8 | `openRingBench` | The ring bench: the night after the first Romance 8 event anyone played, the Forge stands as the bench (`buildings.forge = 0`), and the smith’s scene is due in the morning |
| 8 | `householdMilestones` | Household milestones: as the married count passes 1, 5, 10, 15 and 20, each is news once; 5 brings the furniture set, 20 the finale’s morning; household scenes are Ready from this morning |
| 9 | `serveTheReception` | A wedding’s reception: everyone on the farm well fed from tomorrow for its days (a dish ★1–2 one, ★3–4 two, ★5 three; the bakery’s cake one), never shortening a meal already running |
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
- **Rank-ups show in the morning,** never mid-night (none until the farmhands work).
- **The night is one change.** Its steps write nothing on their own; the save is stamped once, with the real time, after
  step 9.
- Ranks, the Dorm, the goals and meeting her are described with the Umas and the farm's progress, and the romance's steps
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
| Work done | Each station's load done, "Sawmill · Pine Plank ★1 × 8"; the field's growth, "The field · 5 crops grew · 2 ripe"; what withered, "The field · 3 Onion withered" | The station's panel; the farm map |
| Ranks | Rank-ups, "*Name* · Farming Hand", tagged **Rank up**; points that filled tonight with the challenge still to meet, "*Name* · Fishing · Catch 30 fish · 12/30", tagged **Points full** | Her profile's Work side |
| Hearts | Who's Ready for her event (read live, up to three, then "+N more"), the morning's invitation, the house's morning, morning items and night chores, birthdays and anniversaries, levels reached overnight and those the night met ("Met *Name* · in town", or in the town the world names, tagged **New**), a chapter that opened ("A new chapter with *Name* · Together", tagged **New**), the perks' and side by side's extras, and bond hearts | Her event, her profile, or where the line says |
| New today | First, "New story arrived · *its note*", tagged **New**, the morning after a new story release reaches the phone ([below](#how-the-app-gets-the-pack)); "Summer begins", the world's line for the season under it; "Flower Show tomorrow" or "today" (the story's name for it); the Town notes the night unlocked, "*title*" (or "*title* +2 more"), tagged **Town note**; a place built overnight, a Farm Rank reached and a Diary milestone, each tagged; the household's milestones, tagged; "Dorm level 2 · 5 beds"; "*Name* is home" | The People page; the calendar; the Festival ground; the note in the Diary; the Diary; the Farm Rank; the household's scene or the homestead; the Dorm |
| Today | "3 tiles to water" (the growing tiles this morning); "9 tiles to plant" (empty tilled tiles that the season's seeds you hold could fill) | The farm map |

Hearts shows whenever it has a line or someone is Ready. The romance describes its lines.

#### Notifications

The farm sends no notifications. With days as turns nothing finishes while the app is closed, so Account's Notifications
card reads "Off: days are turns".

### The farm map and the bars

#### Home: the farm map

The farm map is Home: a landscape tile map you look across, seven cells tall (a cell is 44 points, 40 on a short screen)
and wider than the screen, so it scrolls sideways. From the left: the woods' edge, the field's 40 tiles over the pond's
edge, a path, then the farm's places on lots of two by two, three to a column, and the road to town at the far end.

```
 ◄────────────────────────────── scrolls sideways ──────────────────────────────►
 ┌────────┬─────────────────┬─┬───────────┬───────────┬────────────┬─────────┬────┐
 │        │ ▣ ▣ ▣ ≈ ≈ ○ ≈ ▲ │ │ Shipping  │ Farmhouse │ Mill       │ Gate    │    │
 │ the    │ ▣ ▣ ▣ ≈ ○ ≈ ≈ ≈ │p│ bin       │           │            │         │ To │
 │ woods' │ ▣ ▣ ▣ ≈ ≈ ▲ ≈ ○ │a│ Warehouse │ a house   │ Sawmill    │ Board   │    │
 │ edge   │ ≈ ○ ≈ ≈ ≈ ≈ ▲ ≈ │t│           │           │            │         │town│
 │        │ ≈ ≈ ≈ ▲ ≈ ≈ ≈ ○ │h│ Dorm      │ a house   │ Smokehouse │ Dock    │    │
 │        │ the pond's edge │ │           │           │            │ …and 4  │    │
 │        │                 │ │           │           │            │ columns │    │
 └────────┴─────────────────┴─┴───────────┴───────────┴────────────┴─────────┴────┘
   ▣ cleared on day 1 · ≈ weeds · ○ a stone · ▲ a stump: the rest of the field is the account's own draw
```

- **The woods' edge** (two columns down the left side) is where you forage and chop; **the pond's edge** (under the
  field) is where you fish. Both are drawn with the forest's and the Fishery's art and take the world's names when it
  gives them.
- **The field** is eight tiles across and five down, each drawn as what's on it: weeds, a stone, a stump, cleared
  ground, tilled soil (darker, with a droplet, once watered), then the crop: seeds, a sprout, its own icon growing, and
  ringed once ripe (see [the field](#the-field)).
- **The lots,** column by column: the yard (the Shipping bin, the Warehouse, the Dorm); the homestead's houses (the
  Farmhouse and two lots from day 1, more columns as the household grows); the stations (the Mill, the Sawmill, the
  Smokehouse); the Gate, the Requests board and the Dock; the ranch (the Coop, the Barn, the Kitchen); the Mine, the
  Smelter and the Restaurant; the Quarry, the Cutter and the Forge.
- **The road to town** closes the map: a tap opens the town's screen. The town's places (the shop, the festival ground,
  the expedition post, the town itself) are in town, and the Menu lists them.
- **Opening a tile or a place** scrolls the map so the tile stays in view beside its panel.

Each place's building and what opens it (the Boat is moored at the Dock and drawn there):

<!-- live:farm-map -->
| Place | Building (uma-art) | Opens |
|---|---|---|
| Fields | `vegetable-garden` | Day 1 |
| Mill | `fields-workbench` | Farm Rank 1, then built |
| Coop | `meadow` (borrowed) | Farm Rank 2, then built (not built yet) |
| Forest | `forest` | Day 1 |
| Sawmill | `forest-workbench` | Farm Rank 3, then built |
| Barn | `stable` | Farm Rank 3, then built (not built yet) |
| Fishery | `fishery` | Day 1 |
| Smokehouse | `fishery-workbench` | Farm Rank 3, then built |
| Kitchen | `kitchen` | Farm Rank 5, then built (not built yet) |
| Mine | `mine` | Farm Rank 4, then built (not built yet) |
| Smelter | `mine-workbench` | Farm Rank 4, then built (not built yet) |
| Restaurant | `party-hall` | Farm Rank 7, then built (not built yet) |
| Quarry | `quarry` | Farm Rank 5, then built (not built yet) |
| Cutter | `den-workbench` | Farm Rank 5, then built (not built yet) |
| Forge | `forge` | Farm Rank 8, then built (not built yet) |
| Shipping bin | `shipping-bin` | Day 1 |
| Warehouse | `warehouse` | Day 1 |
| Dorm | `dorm` | Day 1 |
| Requests board | `card-library` (borrowed) | 5 Umas met |
| Gate | `scenario-gate` | Day 1 |
| Dock | `ley-spring` (borrowed) | Farm Rank 6, then built |
| Shop | `exchange` | Day 1 |
| Festival ground | `racecourse` | Not built yet |
| Expedition post | `rangers-lodge` (borrowed) | Farm Rank 7, then built (not built yet) |
| Town | `trophy-hall` (borrowed) | Day 1 |
| Boat | At the Dock | Farm Rank 6, then built after the Dock |
<!-- /live -->

What a tap does:

| Where | A tap opens |
|---|---|
| A field tile | Its panel, at the right: what's on it, how far it's grown, and its one action (`/?tile=<n>`). Another tile's tap moves the panel to it |
| The woods' edge | Its panel: each area in reach, with its season's finds, **Forage · 1** and **Chop · 1** |
| The pond's edge | Its panel: each spot in reach, with its season's fish and **Fish · 1** |
| The Mill, the Sawmill, the Smokehouse, built | Its panel: today's load, or what it can make, each with **Load 8** (or all that's held, if fewer) |
| The Shipping bin | The bin's sheet |
| The Warehouse | The Warehouse |
| The Dorm | The Dorm's page |
| The Gate | Its quick look: the welcome list's visitor of the day, and Say hello |
| The Dock | Its quick look: its Build card, then the Boat's |
| The road to town | The town's screen: Go into town · 1 action, then who's out today and the People list (see [the town](#the-town)) |
| Every other place | Its quick look: what it is, and what opens it; a place to build, its Build card |

**Locks.** A locked place shows a lock, and its quick look says why:
- **A place to build** (see [Building](#building)): "Farm Rank 3" before its rank offers it; "Not built" once it does,
  its quick look showing its Build card; "Builds tonight" once paid; and **"Not built yet"** for a place whose game isn't
  built (the ranch, the Mine and the Quarry and their stations, the Kitchen, the Restaurant, the expedition post, the
  Forge's merge game), whose Build card shows its cost and can't be bought.
- **The Requests board:** "Opens with 5 Umas met"; then "Opens soon", its game not built.
- **"Opens soon":** its rule is met but it has nothing to do yet: the Festival ground, and a place that stands with no
  game.
- **The Forge** opens as the ring bench the night after the first Romance 8 event ("Opens with your first Romance 8"
  before that); its merge game is a build at Farm Rank 8, not built yet.

**Tags.** A station with a load today says **Ready tomorrow**; the Gate says **Visiting** while the welcome list's
visitor waits. A ripe tile shows its crop ripe, and the Menu counts the ripe tiles.

**The help button** says how the farm works in five short lines: a day holds 10 actions, one a task; looking and
building are free, and the shop once you're in town; a watered tile grows a stage at night and a season's end withers
what still grows; when the actions run out, end the day; tap the date for the calendar.

**The morning card** covers the map after each night until you put it away.

**The homestead's columns** sit after the yard (the Farmhouse and two lots from day 1, the second column from three
married, the third from six; three to a column), the other lots moving along, so the map grows a column at a time. A
house carries its residents' faces, with ♥ for one Ready. The Gate is where the welcome list visits, one a morning, and
wears **Visiting** while one waits. Both are the romance's.

#### Quick looks

A quick look is a side panel over the map: the place's name, its one-line description, and what you can do there. A
place's name (on the map and in its quick look) and its line are the world's when `world.json` gives
them, else the game's own; the Town takes the town's name ([the world in the pack](#the-world-in-the-pack)).
- **A locked place:** "Opens with 5 Umas met" (or "Opens soon"), and its description.
- **A place to build, not standing:** its Build card: its cost in gold and goods, each with what the farm holds ("20
  logs · 25 held", a check when there's enough), what stands in the way ("Opens at Farm Rank 3", "Need 400g and 12 logs
  more", "Not built yet", "Builds tonight") and **Build · 1,000g · 20 logs**; after paying, "The Mill stands tomorrow."
  (the place by the world's name)
- **The Dock, built:** "The Sea Pier is open at the pond's edge. The Boat takes you to the Deep Sea." and the Boat's
  Build card; with both built, "The Sea Pier and the Deep Sea are open at the pond's edge."
- **The woods' edge, the pond's edge and a built station:** their panels (above; see [Gathering](#gathering) and [the
  stations](#the-stations)), each closing with the day's actions left.
- **A station not built:** what it does, and its Build card (see The stations).
- **The Gate:** today's visitor ("‹name› is at the Gate." and **Say hello**); once met, "‹name› came by today.";
  then "Someone new comes tomorrow." while the welcome list has more, else "Meet everyone else in town." (the town by
  its name when the world gives one; see [meeting her](#meeting-her)). A hello that unlocks a Town note says "Town note
  · *title* ›", a tap to it in the Diary.
- **The Forge,** once the ring bench stands: the bench's quick look (see the romance).

#### The frame (landscape)

The game is laid out for a phone held sideways: designed at 844 × 390 points and checked at 667 × 375. The installed
app asks for landscape.

```
┌──────┬──────────────────────────────────────────────────────────────┐
│      │ ● Spring 3  ⏱ 7/10  ● 1,240            [ ☾ End day ]  ☰ Menu │  the bar
│ Farm ├──────────────────────────────────────────────────────────────┤
│ Town │                                                              │
│People│                     the page                  ┌─────────────┤
│ Book │                                               │ a sheet, as │
│ Diary│                                               │ a panel from│
│      │                                               │ the right   │
└──────┴───────────────────────────────────────────────┴─────────────┘
```

- **Held upright,** a card covers the game: "Turn your phone sideways · Uma Farm plays in landscape". Nothing underneath
  moves or reloads, and turning the phone back shows the game as it was.
- **Sheets are side panels** that slide in from the right edge, over the page, the page dimmed behind: the Menu, the
  morning, the calendar, the bin and the shop, the Farm Rank, her profile, her Memories, the pickers, a talk in town and
  every other sheet. A swipe right, a tap on the dimmed page or the close button closes one.
- **Scenes are full screen:** the opening, meeting her, the event, pair and household players, the evening's plays and
  cards, a level reached overnight. Each is laid out sideways: her bust on the left, the lines and the choices on the
  right; a play's name and legend on its left, the play on its right.
- **Lists sit in two columns** where they fit: the Hearts rows and the Town's People, the Town's spots, the
  Warehouse's goods, the Dorm's and the Diary's panels, the Book's cards and Account's panels; the Work view's faces sit
  five or six across.
- **The farm map's panels** (a tile's, the woods', the pond's, a station's) sit at the right without dimming the map, so
  the next tile is one tap away.
- **Safe areas:** the rail keeps clear of the notch's side, and the page of the other side and the home indicator.

#### The bar

A thin bar along the top of the page, always there. From the left:
- **The date chip**, the season's mark and the date ("Spring 3"), opens the calendar.
- **Actions left**, a stopwatch and "7/10" ("Actions left: 7 of 10"), greyed at 0. It opens nothing.
- **The gold chip**, the gold coin and your gold ("Gold: 1,240g. The bin"), opens the shipping bin.
- **The sync chip** shows only while offline ("Offline") or paused ("Sync paused"), and opens Account.
- **End the day**, at the right end: see [End the day](#end-the-day).
- **Menu:** every place.

#### The rail

**Farm · Town · People · Book · Diary**, down the left edge. The page you're on is lit: a marker on the rail's inner edge
and its two-tone icon. A farm place's page (the Warehouse, the Dorm …) keeps Farm lit.
- **Farm:** the farm map.
- **Town:** the town's screen (see [the town](#the-town)).
- **People:** everyone you've met, on the farm or in town, by their route; its Work view is the roster's album, with their
  talents and ranks (see [the People page](#the-people-page)). `/roster` lands on the Work view.
- **Book:** the farm's book (below).
- **Diary:** the farm's projects, the Farm Rank, the milestones, each Uma's Memories and the pairs' Conversations.

#### The Book

The farm's accounts at a glance, six cards, each a tap to its place:

| Card | Shows | A tap opens |
|---|---|---|
| Gold | The farm's gold | The bin |
| Farm Rank | The rank and its points | The Farm Rank's sheet |
| Goods | Every good the Warehouse holds | The Warehouse |
| Umas on the farm | Who lives on the farm, and how many you've met | People's Work view |
| Dorm | Beds used of beds | The Dorm |
| To build | The places offered at this Farm Rank | The Diary's projects |

#### The Menu

"Every place" lists the 25 places on the map in six groups (Gathering, Stations, The ranch, Workshops, The yard, The town), each
with its count (the Fields count their ripe tiles) and locked ones marked; a tap goes where a tap on the map goes (the
Fields to the map itself). Then
Account, the "Ask before ending the day" switch, and the build's number.

### The field

Farming is by hand, one tile and one action at a time. The field starts overgrown, with a small patch cleared: you clear
a tile, till it, plant a seed, water it each day it grows, and harvest it once it's ripe. A watered tile grows one stage
a night; a dry one waits. Harvests sometimes give a seed back, and every harvest raises the crop's level on the farm.

```
 weeds · a stone · a stump ──clear · 1──► cleared ──till · 1──► tilled ──plant · 1 (in season)──► a crop, stage 0
   (a stone leaves a Limestone ★1,                                                                    │
    a stump a Pine Log ★1)                                  water · 1 ──► watered: tonight it grows a stage
                                                                                                       ▼ its stages reach its days − 0.5
 the tile stays tilled ◄── harvest · 1: each crop draws its stars into the Warehouse ◄────────────── ripe
                           crop points +1 (+2 from own seeds) · 5%: an own seed back
                           a regrowing crop starts again at stage 0, in season
 a season's last night: growing crops that don't grow next season wither, the soil left tilled; ripe ones wait
```

#### The field's tiles

The field is a grid of 40 tiles, eight across and five down, beside the woods' edge and over the pond's. On day 1 a
patch of nine at its top left is cleared; every other tile is overgrown, drawn once for the account (`draw(uid, 0,
'ground', i)`), so a farm always starts on the same field. Each tile holds its ground (weeds, a stone, a stump, cleared
or tilled), its crop, its stage, whether it's ripe, regrowing or from own seeds, and whether it's watered today.

<!-- live:field -->
|  | The field |
|---|---|
| Tiles | 40: 8 across, 5 down |
| Cleared on day 1 | 9, three by three at the top left |
| Weeds | 55% of the rest; clearing leaves nothing |
| A stone | 25% of the rest; clearing leaves a Limestone ★1 |
| A stump | 20% of the rest; clearing leaves a Pine Log ★1 |
<!-- /live -->

#### The crops

There are 27 crops: 22 from the shop, and 5 rare ones whose seeds the shop never sells and nothing on the farm hands
out. A crop is planted only in its seasons. In the table, "Shop" is the Farm Rank its seed sells from, "Seed" its price,
and "Stages" the watered nights from planting to ripe. "Yield" is the crops a tile gives each harvest, "Regrows" how
many watered nights a regrowing crop takes to ripen again, "Price ★1" what one sells for, and "Refined at" the station
that turns it into a good worth ×1.5.

<!-- live:crops -->
| Crop | Id | Seasons | Shop | Seed | Stages | Yield | Regrows | Price ★1 | Refined at |
|---|---|---|---|---|---|---|---|---|---|
| Carrot | `carrot` | Spring | Farm Rank 1 | 20g | 4 | 1 | — | 60g | — |
| Potato | `potato` | Spring | Farm Rank 1 | 35g | 6 | 2 | — | 55g | — |
| Mint | `mint` | Spring | Farm Rank 1 | 40g | 4 | 1 | every 3 | 45g | Dried Mint (Sawmill) |
| Onion | `onion` | Spring, Autumn | Farm Rank 2 | 30g | 5 | 1 | — | 100g | — |
| Cabbage | `cabbage` | Spring, Winter | Farm Rank 2 | 90g | 8 | 1 | — | 260g | — |
| Asparagus | `asparagus` | Spring | Farm Rank 4 | 150g | 10 | 1 | — | 480g | — |
| Tomato | `tomato` | Summer | Farm Rank 1 | 50g | 7 | 1 | every 3 | 70g | — |
| Basil | `basil` | Summer | Farm Rank 1 | 40g | 4 | 1 | every 3 | 45g | Dried Basil (Sawmill) |
| Bell Pepper | `bell-pepper` | Summer | Farm Rank 1 | 60g | 6 | 1 | every 3 | 60g | — |
| Eggplant | `eggplant` | Summer | Farm Rank 2 | 70g | 6 | 1 | every 4 | 95g | — |
| Sunflower Seed | `sunflower-seed` | Summer | Farm Rank 2 | 70g | 8 | 3 | — | 75g | Sunflower Oil (Mill) |
| Corn | `corn` | Summer, Autumn | Farm Rank 4 | 80g | 9 | 1 | every 4 | 140g | Cornmeal (Mill) |
| Wheat | `wheat` | Autumn | Farm Rank 1 | 25g | 5 | 2 | — | 40g | Wheat Flour (Mill) |
| Peanut | `peanut` | Autumn | Farm Rank 1 | 30g | 4 | 2 | — | 35g | Peanut Butter (Mill) |
| Rice | `rice` | Autumn | Farm Rank 1 | 35g | 6 | 2 | — | 50g | Polished Rice (Mill) |
| Sugar Beet | `sugar-beet` | Autumn | Farm Rank 2 | 40g | 6 | 1 | — | 120g | Beet Sugar (Mill) |
| Emperor Pumpkin | `emperor-pumpkin` | Autumn | Farm Rank 4 | 250g | 10 | 1 | — | 600g | — |
| Buckwheat | `buckwheat` | Winter | Farm Rank 1 | 30g | 4 | 1 | — | 75g | Buckwheat Flour (Mill) |
| Oats | `oats` | Winter | Farm Rank 1 | 25g | 5 | 2 | — | 40g | Rolled Oats (Mill) |
| Barley | `barley` | Winter | Farm Rank 1 | 30g | 5 | 2 | — | 45g | Pearl Barley (Mill) |
| Rye | `rye` | Winter | Farm Rank 2 | 40g | 6 | 2 | — | 60g | Rye Flour (Mill) |
| Ginger | `ginger` | Winter | Farm Rank 4 | 120g | 9 | 2 | — | 200g | Ground Ginger (Sawmill) |
| Golden Carrot | `golden-carrot` | Spring | Rare | — | 6 | 1 | — | 600g | — |
| Sunwheat | `sunwheat` | Summer | Rare | — | 7 | 2 | — | 260g | Sunwheat Flour (Mill) |
| Moonrice | `moonrice` | Autumn | Rare | — | 7 | 2 | — | 240g | Moonrice Flour (Mill) |
| Wild Rice | `wild-rice` | Summer | Rare | — | 6 | 2 | — | 160g | Hulled Wild Rice (Mill) |
| Mandrake | `mandrake` | Winter | Rare | — | 8 | 1 | — | 520g | Mandrake Powder (Sawmill) |
<!-- /live -->

#### The shop's seeds

The shop, in town, sells the season's six seeds: the first three from day 1, the next two from Farm Rank 2 and the last
from Farm Rank 4. A line shut by its rank still shows, with "From Farm Rank 2". The list changes on a season's first
day and never runs out. Onion sells in Spring and Autumn and Cabbage in Spring and Winter; Corn sells in Summer only,
though it grows on into Autumn. Seeds go into the Warehouse at ★1, and never sell at the bin.

The season's seeds by the Farm Rank that opens them:

<!-- live:shop-seeds -->
| Season | Farm Rank 1 | Farm Rank 2 | Farm Rank 4 |
|---|---|---|---|
| Spring | Carrot 20g, Potato 35g, Mint 40g | Onion 30g, Cabbage 90g | Asparagus 150g |
| Summer | Tomato 50g, Basil 40g, Bell Pepper 60g | Eggplant 70g, Sunflower Seed 70g | Corn 80g |
| Autumn | Wheat 25g, Peanut 30g, Rice 35g | Sugar Beet 40g, Onion 30g | Emperor Pumpkin 250g |
| Winter | Buckwheat 30g, Oats 25g, Barley 30g | Rye 40g, Cabbage 90g | Ginger 120g |
<!-- /live -->

#### A tile's actions

A tap on a tile opens its panel: its ground or crop, where it is ("Row 2, tile 3"), a line on what it takes next, its
one action, and the day's actions left. Each action is one of the day's ten, and says what it did:

| On the tile | Its line | The action | What it does |
|---|---|---|---|
| Weeds, a stone, a stump | "Clear it to till it. It leaves a Limestone." | **Clear · 1 action** | Cleared ground; a stone leaves a Limestone ★1 and a stump a Pine Log ★1 in the Warehouse ("Cleared · +1 Pine Log") |
| Cleared ground | "Till it to plant it." | **Till · 1 action** | Tilled soil |
| Tilled soil, empty | "Plant a seed, then water it." | **Plant**, on a row for each seed held | The seed leaves the Warehouse and the crop starts at stage 0 |
| A growing crop, dry | "2 of 4 nights · dry: water it to grow tonight" | **Water · 1 action** | Watered: it grows a stage tonight ("Watered: it grows tonight") |
| A growing crop, watered | "2 of 4 nights · watered: it grows tonight" | None | — |
| A ripe crop | "Ripe: harvest it." | **Harvest · 1 action** | Its crops into the Warehouse ("+2 Potato · 1 seed back") |

- **Refused, with why:** clearing what's clear ("It's clear already."), tilling what's overgrown ("Clear it first.") or
  tilled, planting untilled ground ("Till it first.") or a planted tile, a seed out of season ("Tomato grows in
  Summer."), watering nothing ("Nothing grows there."), a ripe crop or a tile watered today ("Watered today."),
  harvesting what isn't ripe ("Not ripe yet."), and anything with no actions left.
- **Planting:** the panel lists each seed held that plants today, own seeds first, with its count and "4 watered nights
  to ripe", or "Won't ripen this season" when the season ends first. With none: "No seeds for Spring." and **Seeds at
  the shop, in town**. The first planting of a crop adds it to the farm's crops at level 1.
- **Own seeds** come back from harvests and are kept apart from the shop's; a tile planted from them raises the crop's
  level twice as fast.
- **On a season's last day** a growing tile that won't ripen by the morning says "Withers tonight: it won't ripen before
  the season ends."
- **Every draw is seeded** by the account, the day and the tile, so a harvest replays the same on every device.
- The farm counts tiles cleared, planted and harvested (`farm.counts`).

#### Growing

- **A watered tile grows one stage a night** (night step 2), and turns **ripe once its stages reach its days − 0.5**: a
  4-day Carrot is ripe after four watered nights, a 10-day Asparagus after ten. A dry tile doesn't grow, and loses
  nothing.
- **Every tile dries overnight,** so a crop takes one Water a day it grows: a Carrot costs a plant, four waters and a
  harvest, six actions for its one crop.
- **Ripe crops wait** as long as you like, and are never watered.
- **A farmer Uma's night chores** water a dry growing tile each (see [the romance in the field](#the-romance-in-the-field)).

#### Harvesting

- **Each crop draws its own stars.** A tile gives its yield in crops, and each draws its stars from the harvest's
  quality points: the crop's level (+0.1 a level above 1) and the Hoe (+0.25 a tier above Basic). At crop level 1
  that's always ★1. Every farm has the Basic Hoe, and nothing on the farm upgrades it yet.
- **Seeds back:** each harvest may drop one own seed of its crop: 5%, and +5% a Hoe tier above Basic.
- **Crop points:** each harvested tile adds 1 point to its crop, or 2 if it was planted from own seeds.
- **The tile stays tilled** and empty, ready to plant again.

A harvest's stars by the crop's level, and the chance of a seed back:

<!-- live:harvest-stars -->
| Crop level | Quality | Stars | Seed back |
|---|---|---|---|
| 1 | +0 | ★1 100% | 5% |
| 2 | +0.1 | ★1 90%, ★2 10% | 5% |
| 4 | +0.3 | ★1 70%, ★2 30% | 5% |
| 6 | +0.5 | ★1 50%, ★2 50% | 5% |
| 8 | +0.7 | ★1 30%, ★2 70% | 5% |
| 10 | +0.9 | ★1 10%, ★2 90% | 5% |
<!-- /live -->

#### Regrowing

Mint, Tomato, Basil and Bell Pepper regrow in 3 watered nights, Eggplant and Corn in 4. After a harvest the tile keeps
its crop and starts again at stage 0, so it needs watering again. It keeps its seed's kind, own or the shop's, for its
crop points. Out of its season a regrowing crop doesn't start again: a ripe Tomato harvested on Autumn 1 leaves the tile
empty.

#### Withering

On a season's last night, after the night's growth and before the date turns, every crop still growing (a regrowing one
too) that doesn't grow in the next season withers, and its tile is left tilled and empty. Ripe crops never wither: they
wait to be harvested. Only Corn (Summer into Autumn) and Cabbage (Winter into Spring) carry over. Onion grows in Spring
and Autumn, which don't meet, so a growing Onion withers at the end of both.

#### Crop levels

Each crop has a level from 1 to 10 on the farm, from its crop points. Going from level *L* to *L* + 1 takes 20 × *L*
points, and each level above 1 adds +0.1 quality to the crop's harvests. A harvest's stars use the crop's level before
its own points are added.

The points each level starts at, and its quality:

<!-- live:crop-levels -->
| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 20 | 60 | 120 | 200 | 300 | 420 | 560 | 720 | 900 |
| Quality | +0 | +0.1 | +0.2 | +0.3 | +0.4 | +0.5 | +0.6 | +0.7 | +0.8 | +0.9 |
<!-- /live -->

#### Farming's challenges

Each Uma's farming rank needs its points and its challenge. They wait for the farmhands: the farmer works the field
alone, and his harvests count toward no Uma's challenge. Ranks are described with the Umas and the farm's progress.

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

#### The field at night

- **Step 2:** every growing tile watered today grows a stage; one whose stages reach its days − 0.5 turns ripe. Then
  every tile dries.
- **Step 7:** on a season's last night, crops that don't grow next season wither.
- **The morning** says "The field · 5 crops grew · 2 ripe", then what withered ("The field · 3 Onion withered"), each
  opening the farm map; and under Today, "5 tiles to water" while crops grow, and "9 tiles to plant" while seeds you
  hold for the season could fill empty tilled tiles.

#### The romance in the field

The romance's perks reach the field only through the night: the farmer works it alone, so the perks that ride on an
Uma's work there (side by side, an extra crop, her keepsake on her harvests, bonds at work) wait for the farmhands.
- **Night chores:** each of a farmer Uma's chores waters a dry growing tile tonight, a seeded pick, so it grows; the
  morning says "Night chores · 2 tiles watered".
- **Praise:** a ★3+ crop doesn't earn anyone praise while the farmer harvests alone.

### Gathering

The farmer gathers by hand at the farm's edges: the woods' edge, where he forages and chops, and the pond's edge, where
he fishes. Each is one action and brings its goods home at once, straight into the Warehouse. The Farm Rank opens deeper
areas and spots, whose goods are worth more.

```
 the woods' edge ──Forage · 1──► 2 of the area's season's finds  ─┐
                 ──Chop · 1────► 2 logs of the area's woods       ├─► the Warehouse, at their stars, now
 the pond's edge ──Fish · 1────► 1 fish, measured as it lands    ─┘   (a record when it's the biggest of its kind)
 the Farm Rank opens each deeper area and spot (the sea's also wait for the Dock and the Boat)
```

#### A forage, a chop, a catch

- **One action, one haul,** at one area or one spot, as often as the day's actions allow. What it brings goes into the
  Warehouse at once, and the panel says so: "Foraged · +Pine Log, Shiitake", "Chopped · +Pine Log, Birch Log", "Carp ★1
  · 38.4 cm".
- **What comes:** each good drawn by its share in the area's or the spot's season (below), its stars from the farmer's
  quality, a Novice with a D talent and the farm's Axe or Rod: ★1 with the Basic tools every farm has.
- **His reach is the Farm Rank's:** each depth an Uma's rank opened (Novice to Legend) opens for the farmer at Farm Rank
  1, 2, 4, 6, 8 and 10. An area or spot past his reach shows greyed with "Opens at Farm Rank 2". The sea's two spots
  also wait for their place built: the Sea Pier for the Dock ("Needs the Dock"), the Deep Sea for the Boat ("Needs the
  Boat"), both offered at Farm Rank 6.
- **Every draw is seeded** by the account, the day and the farm's lifetime count of what came home from there, so each
  haul draws anew and every device draws alike.
- **The farm counts** what comes home from the woods and the pond and the logs chopped (`farm.counts`), and notes each
  area and spot worked today (`today.gathered`): the Diary pays 500g the first night one past the Woods or the Pond is
  worked.

What each action brings:

<!-- live:farmer-hauls -->
| Action | Brings | Stars, with the Basic Axe or Rod | Counted |
|---|---|---|---|
| Forage an area | 2 of its season’s finds, each by its share | ★1 100% | `home:forest` |
| Chop at an area | 2 logs of its season’s woods, each by its share | ★1 100% | `logs-chopped` and `home:forest` |
| Fish a spot | One fish of its season’s, by its share, measured as it lands (k = 1.35) | ★1 100% | `home:fishery` |
<!-- /live -->

#### The forest's areas

Six areas, each yielding its family's two grades about 65/35: woods 40%, mushrooms 30%, herbs and spices 15%, and the
season's family 15% (Spring sweets, Summer fruits, Autumn nuts and seeds, Winter more mushrooms). Seven crops are forest
goods too (Basil, Mint, Ginger, Mandrake, Peanut, Sunflower Seed and Sugar Beet): gathered, each is the same good as
harvested, at the crop's price. Chopping draws only the area's woods.

Each area's Farm Rank for the farmer (and the rank an Uma needs, for the farmhands), its grades and its goods by season,
with their shares:

<!-- live:forest-areas -->
| Area | Id | Opens at | An Uma at | Grades | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|---|---|
| The Woods | `woods` | Farm Rank 1 | Novice | G1–G2 | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Honeycomb 10%, Mint 5%, Sugarcane 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Apple 10%, Mint 5%, Pear 5% | Pine Log 26%, Button Mushroom 20%, Birch Log 14%, Shiitake 10%, Basil 10%, Peanut 10%, Mint 5%, Sunflower Seed 5% | Button Mushroom 29%, Pine Log 26%, Shiitake 16%, Birch Log 14%, Basil 10%, Mint 5% |
| The Hills | `hills` | Farm Rank 2 | Hand | G3–G4 | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sugar Beet 10%, Thyme 5%, Maple Sap 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Peach 10%, Thyme 5%, Plum 5% | Cedar Log 26%, Oyster Mushroom 20%, Maple Log 14%, Enoki 10%, Rosemary 10%, Sesame 10%, Thyme 5%, Walnut 5% | Oyster Mushroom 29%, Cedar Log 26%, Enoki 16%, Maple Log 14%, Rosemary 10%, Thyme 5% |
| The Old Forest | `old-forest` | Farm Rank 4 | Skilled | G4–G5 | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Maple Sap 10%, Ginger 5%, Cacao Pod 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Plum 10%, Ginger 5%, Orange 5% | Maple Log 26%, Enoki 20%, Oak Log 14%, Chanterelle 10%, Thyme 10%, Walnut 10%, Ginger 5%, Chestnut 5% | Enoki 29%, Maple Log 26%, Chanterelle 16%, Oak Log 14%, Thyme 10%, Ginger 5% |
| The Mountain | `mountain` | Farm Rank 6 | Expert | G6–G7 | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Vanilla Pod 10%, Cinnamon 5%, Agave Heart 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Grape 10%, Cinnamon 5%, Mango 5% | Cherry Log 26%, Porcini 20%, Mahogany Log 14%, Morel 10%, Peppercorn 10%, Almond 10%, Cinnamon 5%, Pistachio 5% | Porcini 29%, Cherry Log 26%, Morel 16%, Mahogany Log 14%, Peppercorn 10%, Cinnamon 5% |
| The Misty Vale | `misty-vale` | Farm Rank 8 | Master | G8–G9 | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Palm Sap 10%, Mandrake 5%, Fairy Honeycomb 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Pomegranate 10%, Mandrake 5%, Starpeach 5% | Ebony Log 26%, Truffle 20%, Elderwood Log 14%, Glowcap 10%, Saffron 10%, Macadamia 10%, Mandrake 5%, Thundernut 5% | Truffle 29%, Ebony Log 26%, Glowcap 16%, Elderwood Log 14%, Saffron 10%, Mandrake 5% |
| The World Tree | `world-tree` | Farm Rank 10 | Legend | G9–G10 | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Fairy Honeycomb 10%, Phoenix Pepper 5%, Ambrosia Blossom 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Starpeach 10%, Phoenix Pepper 5%, Golden Apple 5% | Elderwood Log 26%, Glowcap 20%, Yggdrasil Branch 14%, King Reishi 10%, Mandrake 10%, Thundernut 10%, Phoenix Pepper 5%, Worldseed 5% | Glowcap 29%, Elderwood Log 26%, King Reishi 16%, Yggdrasil Branch 14%, Mandrake 10%, Phoenix Pepper 5% |
<!-- /live -->

#### The Fishery's spots

Seven spots, each with its fish by season and their shares, and the Farm Rank that opens it for the farmer:

<!-- live:fishing-spots -->
| Spot | Id | Opens at | An Uma at | Spring | Summer | Autumn | Winter |
|---|---|---|---|---|---|---|---|
| The Pond | `pond` | Farm Rank 1 | Novice | Carp 60%, Trout 40% | Carp 98%, Rainbow Koi 2% | Carp 60%, Trout 40% | Carp 70%, Trout 30% |
| The River | `river` | Farm Rank 2 | Hand | Trout 40%, Carp 20%, Salmon 40% | Eel 40%, Trout 40%, Carp 20% | Salmon 50%, Trout 50% | Trout 60%, Salmon 20%, Carp 20% |
| The Lake | `lake` | Farm Rank 4 | Skilled | Salmon 50%, Trout 20%, Eel 30% | Eel 50%, Salmon 47%, Rainbow Koi 3% | Salmon 50%, Eel 30%, Silverfin 20% | Silverfin 20%, Trout 30%, Salmon 50% |
| The Falls | `falls` | Farm Rank 6 | Expert | Eel 50%, Salmon 25%, Silverfin 20%, Rainbow Koi 5% | Eel 60%, Silverfin 30%, Rainbow Koi 10% | Silverfin 30%, Salmon 40%, Eel 25%, Rainbow Koi 5% | Silverfin 40%, Trout 50%, Rainbow Koi 10% |
| The Moon Pool | `moon-pool` | Farm Rank 10 | Legend | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% | Rainbow Koi 60%, Silverfin 40% |
| The Sea Pier | `sea-pier` | Farm Rank 2 + the Dock built | Hand | Sardine 60%, Sea Bream 40% | Sardine 50%, Mackerel 20%, Sea Bream 30% | Mackerel 60%, Sea Bream 40% | Mackerel 70%, Sardine 30% |
| The Deep Sea | `deep-sea` | Farm Rank 8 + the Boat built | Master | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 30%, Sea Bream 10% | Tuna 50%, Silverfin 40%, Rainbow Koi 10% | Tuna 60%, Silverfin 40% |
<!-- /live -->

#### Catch sizes and records

Each fish is measured as it lands:

- **Size** = min + (max − min) × u^(8 ÷ k), in cm to a tenth.
- **k** = 1 + 0.25 × the fisher's rank (Novice 0 to Legend 5) + 0.1 × the talent's step (G 0 to S 7) + 0.05 × the Rod's
  tier: the farmer's is the table's above.
- **u** is seeded by the account, the day and the farm's count of fish home, so the same catch always measures
  the same.
- **Records:** the farm keeps the biggest of each kind, and a catch that beats it says "…, a record". No screen lists
  the records.

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

#### Well fed

Well fed is a number of days on an Uma. It counts down by one each night, and a new meal only raises it to the meal's
own length; it never stacks. A wedding's reception and a spouse's breakfast feed the Umas (the romance's); nothing else
does yet, and it lifts nothing while the farmer works alone.

#### The woods' and the pond's panels

- **A tap on the woods' edge** opens its panel at the right: each forest area with its name, its season's finds as
  icons, and **Forage · 1** and **Chop · 1**, or why it's shut ("Opens at Farm Rank 2"); then the day's actions left.
- **A tap on the pond's edge** opens the same for its spots, with **Fish · 1**.
- **The help (i)** of the map says how the day's actions work.

#### The romance in gathering

The perks that ride on an Uma's work (side by side, the perks' extras, her keepsake on a haul, bonds at work) wait for
the farmhands. One reaches the Warehouse every night:
- **Night chores:** a forager brings one item a chore from her deepest open area this season, a fisher one fish from her
  deepest open spot, at a day's haul's stars, straight into the Warehouse (1 chore from Friendship 6, 2 from Romance 7, 3
  from Spouse 4). The morning's Hearts section says "Night chores · 3 items". The perks are the romance's.

### The stations

A station turns one raw good into its refined form, one for one, keeping its stars; the refined good sells for ×1.5.
Three stations work: the Mill, the Sawmill and the Smokehouse, on the farm map's stations column. The Smelter and the
Cutter wait for mining's game: "Not built yet".

```
 a built station ──Load · 1──► up to 8 of one good at one star leave the Warehouse
                               ──the night──► the same count of its refined form, at those stars, into the Warehouse
 one load a station a day; it's free again in the morning
```

#### Building a station

A station is built like every place (see [Building](#building)): the Farm Rank offers it (the Mill at 1, the Sawmill and
the Smokehouse at 3), you pay its gold and goods at its quick look, and it stands the next morning. Building takes no
action.

Each station, what builds it, what opens it, its jobs and a load:

<!-- live:stations -->
| Station | Builds for | Opens | Jobs | A load |
|---|---|---|---|---|
| Mill | 1,000g · 20 logs | Farm Rank 1 | Flour: grains · Sugars and oils: sweets, nuts and seeds · Preserves: fruits | 1 to 8, ready the next morning |
| Sawmill | 1,500g · 40 logs | Farm Rank 3 | Planks: woods · Drying: mushrooms, herbs and spices | 1 to 8, ready the next morning |
| Smokehouse | 2,000g · 30 logs · 20 fish | Farm Rank 3 | Smoking: fish | 1 to 8, ready the next morning |
<!-- /live -->

#### A load

- **One action starts a load** of 1 to 8 of one good at one star: its inputs leave the Warehouse now. A load bigger
  than the Warehouse holds is refused ("Not enough in the Warehouse."), and so is one the station doesn't make ("It
  doesn't make that.").
- **It's ready the next morning:** night step 4 puts the same count of the refined good, at the same stars, into the
  Warehouse, and the station is free again.
- **One load a station a day:** a second is refused ("It's busy until morning."). Each built station can take its own.
- **Work done** in the morning lists each load done: "Sawmill · Pine Plank ★1 × 8", opening the station's panel.

#### The stations' panels

- **Not built:** the quick look says what it does ("Turns logs, mushrooms or herbs into goods worth half again as much,
  keeping their stars.") and shows its Build card: what stands in the way ("Opens at Farm Rank 3", "Need 300g and 12
  logs more", "Builds tonight") and **Build · 1,500g · 40 logs**.
- **Built:** its panel lists what it can make now, each output at its stars with its input and what's held ("Pine Plank
  ★1 · From Pine Log · 12 held") and **Load 8** (or all that's held, if fewer); with nothing: "Nothing to process yet:
  bring its goods home first." Once loaded: "Pine Plank ★1 × 8 · Ready tomorrow morning", and the map tags it **Ready
  tomorrow**.

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

The bin takes anything with a price and pays at night. There's no cap on selling, and nothing is ever bought back.

- **Ship a crate · 1 action:** pick what to ship in the Warehouse's pick mode, as many goods and stars as you like, and
  one action puts the whole crate in today's bin. Shipping again the same day is another crate and another action.
  Seeds and dishes don't sell ("That doesn't sell").
- **Ship all · 1 action:** a good's sheet in the Warehouse ships every star of it as one crate.
- **Take back:** a whole line from the bin back to the Warehouse, free, any time until the night. After the night, a
  sale is final.
- **The estimate:** "About 1,240g tonight", at today's prices.
- **The bin's sheet** (from the bin on the map, the gold chip or a morning line): "About 1,240g tonight", today's lines
  (icon, "Carrot ★2 × 3", the line's gold, **In demand**), each with **Take back**, and **Ship · 1 action**, which opens
  the Warehouse to pick a crate. Empty, it says "Empty" and "Tap Ship to pick goods. They pay tonight." Its help (i)
  says the rule in three lines.

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
- **Earned:** the bin, and the Diary's milestones and collection rows.
- **Spent:** seeds at the shop, places to build at their quick looks, Dorm levels at the Dorm, and houses on the
  homestead.

The gold chip in the bar shows the coin and your gold, and opens the bin.

#### The shop

The shop is in town: its sheet (from the town's **Shop**, the Menu, or a tile's **Seeds at the shop, in town**) first
asks you to go in, "The shop is in town." with **Go into town · 1 action**; once you're in town today, it's open, free,
for the rest of the day. It lists the season's six seeds, each with its icon, name and price and, while shut, its gate
("From Farm Rank 2"). A tap opens a buy sheet: ×1, ×5, ×10, ×25 or a typed count, up to 99, and **Buy 9 · 180g**, held
back with "Need 30g more" when gold is short. What you buy goes in the Warehouse at ★1. The shop checks its lines again
as you buy, so a sheet left open past a season's turn can't buy last season's seeds. Beds and stations are bought at
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
  when in demand, its five stars and **Ship all · 665g · 1 action**. Seeds say "Seeds: they don't sell"; a dish says "A
  dish: for a meal"; a ring's form is "made at the ring bench".
- **Pick mode** (from the bin's **Ship**): "Ship to the bin". A tap on a star puts one in the crate (marked "+2" on the
  star, its count what's left), **All** puts every star of a good in, and a bar says "Crate: 3 · about 425g" with
  **Clear** and **Ship · 1 action**, which ships the crate and goes back to the bin. With nothing picked it says "Tap a
  star to put one in the crate." (or what's in the bin tonight). It opens on the first tab holding something that
  sells.

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

Every character lives in the town, where a different few are out each day for a talk, and you meet her there when her
trigger is met; the welcome list comes to the Gate, one a morning, from day 1. Once met, she moves into the Dorm while a
bed is free, else she lives in town until you invite her. The Dorm's beds cap who lives and works on the farm at once.
Every Uma has a talent, G to S, in each of nine activities, read from her stats, and climbs six ranks in each by working
and meeting a challenge. The farm climbs a ladder of its own, the Farm Rank, from what it earns and grows, and grows by
building: the rank offers each place, and you build it with gold and the farm's goods. There are no global chapters and
no farm-wide story.

```
 day 1: your name ──► the opening's lines ──► Home: day 1's visitor at the Gate ──► Say hello: met, home (3 beds)
 the town: talk with her on 3 days (or her trigger) ──► met ──► a bed free? ──► the Dorm, working
                                                                    └── no ──► she lives in town ── a bed frees ──► Invite to the farm
 the Dorm: Upgrade · 1,000g ── night ──► 5 beds (beds only)
 swap: one Uma home ⇄ one in town ── night ──► she's home
```

### The roster

The roster is everyone you've met, and her `joined` the day you met her. Who is **home** (on the farm) is capped by the
Dorm's beds; everyone else on the roster **lives in town** as a friend. A spouse in her house is on the farm too,
without a Dorm bed. Only Umas on the farm play their events and evenings (and will work, once the farmhands come);
chats and gifts reach everyone you've met, on the farm or in town.

#### How Umas join

You meet her in town, when her trigger is met, or at the Gate, the welcome list's, one a morning: see
[meeting her](#meeting-her). Met, she joins the roster at Friendship 0: home while a bed is free, else she lives in town,
and **Invite to the farm** on her profile brings her into a free bed at once. There's no cap on how many you meet.
Nothing is drawn.

#### The Dorm's levels and beds

Beds cap who lives and works on the farm at once. Level 1 comes with the farm; each later level is bought at the Dorm.
The Dorm for 20: its eight levels, their beds, what each costs, and the Farm Rank it needs. The levels bring beds only:

<!-- live:dorm-levels -->
| Level | Beds | Costs | Farm Rank | Cumulative |
|---|---|---|---|---|
| 1 | 3 | — | — | 0g |
| 2 | 5 | 1,000g | 1 | 1,000g |
| 3 | 7 | 3,000g | 2 | 4,000g |
| 4 | 9 | 8,000g | 3 | 12,000g |
| 5 | 11 | 15,000g | 4 | 27,000g |
| 6 | 14 | 28,000g | 5 | 55,000g |
| 7 | 17 | 50,000g | 6 | 105,000g |
| 8 | 20 | 85,000g | 7 | 190,000g |
<!-- /live -->

- **Buying:** the gold goes now; the beds come the next morning. A purchase is refused at the top level ("The Dorm is
  at its top level."), before its Farm Rank ("Opens at Farm Rank 2.") and when gold is short. A level bought today can
  be followed by the next one the same day; both arrive the next morning.
- **Beds free** are the level in effect's beds less the Umas home. A level bought today doesn't count until it takes
  effect.
- **What waits for a free bed:** anyone met comes home only while one is free; otherwise she lives in town, and
  **Invite to the farm** on her profile brings her once a bed is free (at once), or a swap the next morning.
- **Invite to the farm:** one you've met who lives in town moves into a free Dorm bed now and can work today. Refused
  with no bed free ("No bed is free: upgrade the Dorm, or swap."), for one arriving by a swap tomorrow, and for one on the
  farm already.

#### Living in town, and swaps

Everyone on the roster past the beds **lives in town**. She keeps her ranks and her route, and earns nothing: no rank
points, no events or evenings. Chats and gifts still reach her, and she's out in town on her days like
anyone (see [the town](#the-town)).

- **A swap** sends one Uma home to town and brings one from town home in her place. It is free and unlimited, and it
  happens the next morning: the one leaving goes to town and the one arriving takes her bed.
- **Who can go to town:** any Uma home. Refused: one already leaving ("She leaves tomorrow.") and anyone not home ("She
  isn't on the farm.").
- **Who can come home:** anyone on the roster who lives in town and isn't already arriving ("She arrives tomorrow."). One home
  already is refused ("She's on the farm already."), and so is a spouse in her house ("She lives in her house.").
- **Leaving tomorrow:** until the night, the swap picker shows an Uma a swap takes out greyed out with "Leaves
  tomorrow".
- **Calling off:** a swap can be called off any time before the night; she stays.

#### The night's roster step and the morning's news

Night step 8 runs, in order, after the calendar has turned:

1. **The Dorm settles:** a level bought takes effect, then each swap: the Uma leaving goes to town and the one arriving
   comes home in her place.
2. **The goals** (see [the night's goals check](#the-nights-goals-check)).
3. **Meeting her:** everyone in town not met yet whose trigger the farm now holds is met (see
   [meeting her](#meeting-her)).

The places paid for yesterday stand first, before the Dorm settles. The morning's **New today** lists, after the
season, festival, built, Farm Rank, milestone and household lines:

| Line | When | Opens |
|---|---|---|
| "Dorm level 2 · 5 beds" | A level bought took effect | The Dorm |
| "{name} is home", or "3 Umas are home" | Swaps brought Umas home | The Dorm |

Those the night met are listed under **Hearts** ("Met {name} · moved in", or "· in town" with no bed). `{name}` is her
name, from master data.

#### The roster's screens

- **The Dorm** (the Dorm on the map):
  - its level and "3 of 5 beds"; with a bed free and someone in town, "A bed is free: invite someone from town on her
    profile."; after buying, "Level 3 tomorrow · 7 beds";
  - the next level, "Level 3 · 7 beds", with "· Farm Rank 2" while it's locked, and **Upgrade · 3,000g** (disabled
    until the Farm Rank is reached and the gold is there; "Need 500g more" when only gold is short); at the top, "The
    Dorm is at its top level.";
  - **Levels:** the eight, each "Built", "Tomorrow", or its cost and Farm Rank;
  - **Tomorrow:** each swap as two faces with "… arrives tomorrow" and **Call off**;
  - **On the farm · n:** each Uma with her best rank and "Idle" (nobody works yet) or "Leaves tomorrow";
  - **Swap** (or "Swap · nobody in town"), enabled when someone home can go and someone in town can come: a picker over
    the Umas home ("Who goes to town?", one leaving greyed out with why), then over those in town ("Who comes home for
    {name}?");
  - **In town · n:** each Uma with "In town" or "Arrives tomorrow", or "Nobody you’ve met lives in town." Every row opens
    her profile.
- **The Gate** (its quick look on the map): the welcome list's visitor of the day (see [meeting her](#meeting-her)).
- **The roster** is the People page's **Work** view (`/hearts?view=work`; `/roster` lands there): everyone on the roster,
  on the farm or in town, as an album of cards in three columns, under the line "3 on the farm · 2 in town · by joined".
  - **Her face** carries her favourite line's mark top left (a Carrot farming, a Pine Log foraging, a Carp fishing,
    Copper Ore mining, on a light disc), her best talent's grade bottom right on a coloured chip (S gold, A coral, B
    blue, C green, D and below grey), and her level in words top right ("F7", "R4", "S2").
  - **Her card** says her best rank ("Hand · Farming", or "Novice" before her first points) and her best talent
    ("Fishing A"). Sorted by an activity, it says her rank and talent in it ("Hand · C") and the activity, with her
    points when sorted by them ("Fishing · 52 pts"). An Uma in town is dimmed, and her second line says "In town".
  - **Search** by name.
  - **Filters:** Where (On the farm, In town); Favourite line (Farming, Mining, Fishing, Foraging); her talent in each
    activity (C+, B+, A+, S); her rank in each activity (Novice … Legend).
  - **Sorts:** Joined (the default, oldest first), Talent and Rank points (each in a chosen activity, the sort sheet's
    "In" chips, Farming until one is chosen; highest first), and Name.
  - **A tap on her card** opens her profile on its Work side: "Favourite · Fishing (×1.2 rank points)", "Joined Spring
    1", and "On the farm" or "In town · the Dorm"; then her nine activities, each with its talent chip, her
    favourite mark on her favourite, "Hand · 52 / 160" (her points alone at Legend), and a line below: "Next: Catch 10
    fish at the River · 3/10", "Points full · …", or "Ranks up tonight · …". A challenge whose target is 1 shows without
    a count.

The Hearts view, her profile's Hearts side, Chat and Gift are the romance's: see [the People page](#the-people-page) and
[her profile](#her-profile).

### The town

Every character lives in town from day 1: everyone in master data, once each, in her default outfit or the pack's
outfit for her, and the pack's sisters. The town's people, fourteen Umas in the town's roles, keep its spots. Each day a
different few are out at the six spots, and you choose who to talk to. Talking with her on three days, or her own
trigger, is how her story begins: see [meeting her](#meeting-her).

```
 the farm map ──► the Town ──► Today: six spots, each with its keeper and up to four out
                                 tap one ──► her face, her name and her line ──► one talk a day counts
                                                                             └── her trigger met ──► her meeting scene
                          └──► People: everyone, met or not, where she is today · find by name · met first or by name
```

#### Who's out today

- **Everyone in town:** master data's characters and the pack's sisters, less the town's people (they keep their spots),
  the welcome list not met yet (she comes to the Gate on her morning; the day's visitor stays out of town that day), and
  the Umas living on the farm (they're at the farm; each keeps her place in the draw,
  unseen, so the day's town never shifts when someone moves in). One you've met who lives in town is out like anyone.
- **A draw seeded by the player and the day,** so the same day always shows the same town, and tomorrow a different few.
  The rest are at home.
- **A favourite spot:** a cast entry's `spot`. She's there more often than anywhere else.

<!-- live:town-draw -->
|  | The rule |
|---|---|
| At each spot | Up to 4 a day: 24 in all, the rest at home |
| Who’s out | Everyone in town but the town’s people and the welcome list not met yet (they come to the Gate; the day’s visitor stays out of town that day), in the order of `draw(uid, day, 'town:<id>', 0)`, lowest first, until every spot is full; an Uma living on the farm keeps her place, unseen, so the day never shifts when someone moves in |
| Where she stands | Her favourite spot (her cast entry’s `spot`) while it has room, 60% of the time (`draw(…, 1)`); else a spot with room (`draw(…, 2)`) |
| A talk | Once a day each: her talks so far and the last day, in the save’s `town`. It costs nothing and takes no time, and it meets her when it meets her trigger |
| Her line | One a day (`draw(uid, day, 'town-line:<id>', 0)`) of her bible’s `townLines`, else the game’s 6: “Oh, hello! Out for a walk too?” “Lovely day for it, isn’t it?” “You’re from the farm up the road, aren’t you?” “I come here when I need to think.” “Good to see you, {farmer}.” “Busy day? Mine’s only just starting.” |
<!-- /live -->

#### The spots

Six spots, by the story's ids, so a `spot` trigger can name one. `town.json` names each, gives it a line and a keeper;
whatever it leaves, the game's own plays:

<!-- live:town-spots -->
| Spot (`spot`) | The game’s name | Its line | Kept by |
|---|---|---|---|
| `plaza` | The Plaza | The fountain at the heart of the town. Everyone passes through. | The mayor |
| `market` | The Market | The season’s stalls, open from first light. | The shopkeeper |
| `cafe` | The Café | Tea, cake and a seat by the window. | The cook |
| `harbour` | The Harbour | Boats, nets and the salt wind off the sea. | The captain |
| `library` | The Library | Quiet rooms, and old maps of the roads past the town. | The guide |
| `track` | The Hilltop Track | A running track above the rooftops. | The courier |
<!-- /live -->

#### The town's screen

- **The Town** on the farm map opens `/town`, loaded on demand: **Today** and **People** in tabs (`?view=people`). Its
  title is the town's name when the world gives one, else "Town".
- **Today:** "24 out today · a different few tomorrow"; each spot a card with its name, its line, the few out there
  (their faces and names, ✓ on one you've talked with today), and its keeper at its foot, her name and her role ("· The
  smith"). An empty spot says "No one’s here today."
- **Tap one to talk** (`?talk=<id>`): a sheet with her bust, her name, the spot, her line for the day (`{farmer}` your
  name), and "Your first talk", then "Talked 3 days · today ✓". The tap is the talk: it counts once a day, costs nothing
  and takes no time. When she's tied to the spot's keeper, the tie's line shows with the keeper's face.
- **A talk that meets her trigger** plays her meeting scene at once, over the town (see [meeting her](#meeting-her)).
- **A talk or a gift that unlocks a Town note** says "Town note · *title* ›" on the sheet, a tap to it in the Diary: a
  talk at a spot visits it ([Town notes](#town-notes)).
- **Give a gift**, under the talk, for one you haven't met: one good from the Warehouse at its stars (its points show
  "?"). It meets her when her trigger is a gift she likes or the good it names; else she says "She likes it.", "She
  thanks you." and the like, and the good is spent all the same.
- **One you've met who lives in town:** her line and the talk as anyone's, with **Met** and **Her profile ›** (where
  Invite to the farm is).
- **A keeper's sheet:** her role, what she does and the spot she keeps, and her ties with the cast, each with its line.
  Talking with her counts nothing: the town's people have no story to begin.
- **People:** everyone in town and the town's people, each with her face and name and where she is today ("At the
  Café today", "At home", "On the farm", "At the Gate today" for the day's visitor, "At the Café, most days" for a
  keeper, "In town"), the days talked, and **Met**
  for anyone you've met, on the farm or in town. **Find by name** (any case, accents aside) and a sort: **Met first**
  (met, then talked most, then by name) or **Name**. One at home says "At home today. Look for her another day."; the
  day's visitor "She’s at the Gate today." with **The Gate ›**; one on the farm links her profile.
- **Lean:** faces load as they scroll into view.

#### The save

The save's `town` holds, per character (a character id, or a sister's `s<outfitId>`), her talks so far and the last day
talked: nothing else. Say hello at the Gate counts there as a talk. Who you've met is the roster (`roster[id].joined` the day you met her).

### Talents and ranks

Every Uma is a specialist. Her **talent** in each activity, G to S, is read from her own stats by one rule, the same for
everyone; it's why one Uma suits the Fields and another the Pond. Her **rank** in each activity, Novice to Legend, is
earned by working and meeting a challenge; ranks are how the farm goes deeper and better.

**Nobody works yet.** The farmer works the farm alone: the work board, multi-day jobs and the Fields' tenders are
retired, and the Umas come back to work as the farmhands, later. Until then no Uma earns rank points or counts toward a
challenge, her ranks stand where they are, and the farmer's own reach is the Farm Rank's. The rules below are the
ranks' own, kept for the farmhands.

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

- **Yield** multiplies what her gathering and station work brings.
- **Quality points** add to the star draw of what she makes or grows.
- **Rank points** multiply every pay of rank points.
- **Tended growth** was a block's growth a night under her care (B and up only), kept for the farmhands.
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

Nobody works a day yet: the farmer works alone. When the farmhands come, where an Uma worked sets the activity it
pays:

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

- **One day pays one activity.**
- An Uma living in town earns nothing.
- The Mine, the Quarry, the Smelter and the Cutter wait for mining's game, so in play only farming, foraging and
  fishing earn rank points.

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
- **What counts it:** her own work, once the farmhands work. The farmer's harvests, hauls and catches count toward no
  Uma's challenge. Each challenge reads only its own kind of event; an Uma off the roster or at Legend counts nothing.
- **In play:** only farming's, foraging's and fishing's challenges are counted. The others wait for places that aren't
  open. Farming's and fishing's Legend challenges are festival wins, and no festival is held, so those two climbs stop
  at Master; foraging can reach Legend.

#### Rank-ups at night

Night step 6:

1. **Points:** each Uma who worked earns a day's points in its activity, with her factors as she worked (well fed is
   read before the night counts it down).
2. **Rank-ups:** every Uma on the roster, in every activity, ranks up where her points have reached the next rank's and
   its challenge is met. One rank a night per activity; the challenge's count resets. A challenge met during the day
   waits for that night. A rank skipped by points still takes its challenges one at a time, a rank a night.
3. **Lines:** the rank-ups first, then **points full**: an Uma whose points for her next rank filled tonight with its
   challenge still to meet. It's said once, the night they fill (or the night a rank-up leaves the next rank already
   full); her sheet keeps saying "Points full" until she ranks up.

A rank reached tonight lifts her work from tomorrow.

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

- **Yield** multiplies her gathering and station work.
- **Tended growth** was a block's growth a night under her care, kept for the farmhands.
- **Quality** adds to the star draw of what she grows or makes.
- **Deepest** is the last area, spot and floor her rank lets her work.
- **Seeds back** is her harvest's chance of a seed, before the Hoe.
- Expedition power, affection a day and workshop yield are defined for places that aren't open in play.

#### Her favourite line

Her favourite line is her story bible's, else her cast entry's calling (a quarry calling is mining, at the Quarry), read
from the story pack: **farming, foraging, fishing or mining**. She earns ×1.2 rank points there. The mark on her face is
her favourite line's.

- **She can work anywhere.** Her favourite only speeds her ranks; nothing refuses her elsewhere.
- The ranch, the workshops and expeditions are nobody's favourite.
- What else her line does (her perks, her tastes in gifts) is the romance's: see
  [her favourite line and tastes](#her-favourite-line-and-tastes).

### The farm's progress

The farm grows by what you earn and grow, and by your life with the Umas. There are no global chapters and no
farm-wide story: the story lives in each Uma, in her own chapters. Four parts, all checked at night:
- **the Farm Rank,** the farm's own ladder from 1 to 10, from income and resources only;
- **the Diary,** which counts what you ship and pays milestones;
- **building:** the Farm Rank offers each place past the start, and you build it with gold and the farm's goods;
- **the milestones with the Umas,** which open the homestead and the town.

The Diary's **projects** gather them: what you can build now, what the next rank offers, and the milestones with the
Umas.

```
 the day: plant, water, gather, ship ──► the Farm Rank offers a place ──► its Build card: gold + goods ──► Build
                                                                                                         │
 End the day ──► night step 8: ─────────────────────────────────────────────────────────────────────────┘
                   1. the places paid for stand ("Built overnight · the Mill")
                   2. the Diary pays what's reached (milestones, rows)
                   3. the Farm Rank's points are recomputed; a new rank offers more
                   4. the ring bench, the night after the first Romance 8
                   ▼
 the morning: "Built overnight · the Mill", "Farm Rank 2 · The Coop to build (not built yet), …", "First Uma at Hand · +300g"

 your life with the Umas: the n-th wedding ──► House n · 3 married ──► the homestead's second row · 5 met ──► the board
```

#### The Farm Rank

The farm's own rank, 1 to 10. Its points are recomputed from the save each night at step 8, from income and resources
only:

> **⌊gold shipped ÷ 100⌋ + 5 × Diary entries + 25 × milestones**

Every term only grows, so the rank never falls. During the day the rank stays as last night left it: what you ship
today counts tonight. Where the points come from:

<!-- live:farm-rank-points -->
| Source | Points | Read from |
|---|---|---|
| Gold shipped at the bin | 1 per 100g | `farm.counts['gold-shipped']` |
| A Diary entry: a good shipped once | 5 | `diary.shipped` |
| A milestone | 25 | `diary.milestones` |
<!-- /live -->

Festivals and decorations add nothing in play: neither exists. The points each rank needs, tuned when Umas worked the
farm so the ranks came at the pace they came at when each global chapter added 250 points (the farmer's pace alone is
[the simulated first season](#the-pacing)'s, and retuning waits for the farmhands):

<!-- live:farm-ranks -->
| Farm Rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 150 | 250 | 950 | 2,150 | 3,750 | 6,250 | 9,750 | 14,750 | 21,750 |
<!-- /live -->

What each rank opens is read from the rules that gate on it (the places it offers to build, the Fields' blocks, the
Dorm's levels, the shop's seed tiers), so the sheet and the morning can't drift from the game:

<!-- live:farm-rank-opens -->
| Farm Rank | Points | Opens |
|---|---|---|
| 1 | 0 | Block A and tier-1 seeds (the start), The Mill to build (1,000g · 20 logs), Dorm level 2 (5 beds) |
| 2 | 150 | The Coop to build (not built yet), The Hills, The River, The Sea Pier (with the Dock), Dorm level 3 (7 beds), New seeds at the shop |
| 3 | 250 | The Sawmill to build (1,500g · 40 logs), The Barn to build (not built yet), The Smokehouse to build (2,000g · 30 logs · 20 fish), Dorm level 4 (9 beds) |
| 4 | 950 | The Mine to build (not built yet), The Smelter to build (not built yet), The Old Forest, The Lake, Dorm level 5 (11 beds), New seeds at the shop |
| 5 | 2,150 | The Kitchen to build (not built yet), The Quarry to build (not built yet), The Cutter to build (not built yet), Dorm level 6 (14 beds) |
| 6 | 3,750 | The Dock to build (20,000g · 80 planks), The Boat to build (30,000g · 60 planks · 30 fillets), The Mountain, The Falls, Dorm level 7 (17 beds) |
| 7 | 6,250 | The Restaurant to build (not built yet), The Expedition post to build (not built yet), Dorm level 8 (20 beds) |
| 8 | 9,750 | The Forge to build (not built yet), The Misty Vale, The Deep Sea (with the Boat) |
| 9 | 14,750 |  |
| 10 | 21,750 | The World Tree, The Moon Pool, The farm’s gold crest |
<!-- /live -->

- **A rank-up is news:** the morning's New today says "Farm Rank 2 · The Coop to build (not built yet), Block B (800g),
  Dorm level 3 (7 beds), New seeds at the shop", tagged Farm Rank, opening the rank's sheet. Two ranks in one night are
  two lines, lowest first.

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
- **Umas on the roster** counts everyone you've met, on the farm or in town, day 1's visitor included, so a fifth Uma
  pays 300g.
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

#### Building

Every place past the start is offered at its Farm Rank and built with gold and the farm's own goods:

1. **Offered:** the Farm Rank reaches its rank (the Boat once the Dock stands too).
2. **Paid:** its Build card (the place's quick look, or a station's page) takes its gold and goods now. Each goods line
   takes any grade and any stars of its family, the cheapest first (★1 price × the star's factor, then fewer stars, then
   the catalogue's order). The place waits in `farm.builds`.
3. **Built:** the next morning, night step 8 sets `buildings[id]` to 1 before anything else, and New today says "Built
   overnight · the Mill", tagged Built, opening its quick look (the Boat's opens the Dock's).

A place whose game isn't built yet shows what it'll be: its Build card has its cost, "Not built yet", and a disabled
**Not built yet** button. It can't be bought. The places, their ranks and their costs:

<!-- live:builds -->
| Place | Farm Rank | Gold | Goods | Can be bought |
|---|---|---|---|---|
| Mill | 1 | 1,000g | 20 logs | Yes |
| Coop | 2 | 2,000g | 30 logs, 20 vegetables | Not built yet |
| Sawmill | 3 | 1,500g | 40 logs | Yes |
| Barn | 3 | 3,500g | 30 logs, 20 vegetables | Not built yet |
| Smokehouse | 3 | 2,000g | 30 logs, 20 fish | Yes |
| Mine | 4 | 10,000g | 60 planks | Not built yet |
| Smelter | 4 | 8,000g | 40 planks, 40 logs | Not built yet |
| Kitchen | 5 | 15,000g | 50 planks, 30 vegetables | Not built yet |
| Quarry | 5 | 12,000g | 50 planks | Not built yet |
| Cutter | 5 | 10,000g | 40 planks, 40 logs | Not built yet |
| Dock | 6 | 20,000g | 80 planks | Yes |
| Boat | 6 | 30,000g | 60 planks, 30 fillets | Yes, after the Dock |
| Restaurant | 7 | 40,000g | 80 planks, 40 fillets, 30 vegetables | Not built yet |
| Expedition post | 7 | 25,000g | 60 planks, 40 fillets | Not built yet |
| Forge | 8 | 60,000g | 120 planks, 60 logs | Not built yet |
<!-- /live -->

- **Refusals:** built already or paid today ("Builds tonight."); not built yet ("Not built yet."); its Farm Rank ("Opens
  at Farm Rank 3."); the place before it ("After the Dock."); short ("Need 400g and 12 logs more.").
- **The Dock and the Boat** open the sea: the Sea Pier needs the Dock, the Deep Sea the Boat (see
  [the Fishery's spots](#the-fisherys-spots)). The Dock stands beside the Gate; the Boat moors there, built from the
  Dock's quick look. Both have place ids, so a story's `built` gate can name them.
- **What used a chapter now uses the place it meant:** the ring bench takes ingots and cut gems once the Smelter and the
  Cutter stand; a perk or a working setup at her line's place says "Opens when the Kitchen is built" (or her place); the
  sea's spots need the Dock and the Boat.
- **Never stamped by the rule:** paying is the player's change, stamped once by the app.

#### The milestones with the Umas

Your life with the Umas opens the homestead and the town:

<!-- live:uma-milestones -->
| Milestone | Opens | Read from |
|---|---|---|
| The first Romance 8 anyone plays | The ring bench at the Forge (the night after) | `memories`, then `buildings.forge = 0` |
| The first wedding | House 1 to build (8,000g), the house before it standing | Spouses in `love` |
| The second wedding | House 2 to build (20,000g), the house before it standing | Spouses in `love` |
| The third wedding | House 3 to build (40,000g), the house before it standing | Spouses in `love` |
| The fourth wedding | House 4 to build (70,000g), the house before it standing | Spouses in `love` |
| The fifth wedding | House 5 to build (110,000g), the house before it standing | Spouses in `love` |
| The sixth wedding | House 6 to build (160,000g), the house before it standing | Spouses in `love` |
| 3 married | The homestead's second row on the map | Spouses in `love` |
| 6 married | The homestead's third row on the map | Spouses in `love` |
| 5 Umas met | The Requests board’s place (its game comes later) | Umas on the roster |
<!-- /live -->

- **"Met"** is everyone on the roster today, on the farm or in town (see [meeting her](#meeting-her)).
- **The ring bench** is the romance's: see [the ring bench](#the-ring-bench).
- **The houses and the rows** are the homestead's: see [the homestead](#the-homestead).

#### The farm's projects

The Diary's **Projects** card gathers what's next:
- **Build now:** every place offered at your rank and not standing, whose game is built: its name, its cost ("1,000g · 20
  logs"), and what it still lacks ("Need 400g and 12 logs more"), "Builds tonight" once paid, or **Build ›**. A tap
  opens its quick look and Build card. With none: "Nothing to build at this rank."
- **Not built yet:** the places offered at your rank whose games aren't built, in one line ("Not built yet: the Coop,
  the Barn").
- **At Farm Rank 3 · 250 points:** what the next rank offers, each with its cost or "Not built yet".
- **With the Umas:** each milestone, a check when it's done, what it waits for and how far along you are: "The ring
  bench · The first Romance 8 · Not yet", "House 1 · Your first wedding · 0 / 1 married", "The homestead's second row ·
  3 married · 1 / 3 married", "The Requests board · 5 Umas met · 3 / 5 met". The house shown is the next to open.

#### The pacing

A test (`packages/domain/src/farm/season.test.ts`) plays the first season on the game's own rules, the farmer alone, by a
plain bot, ten actions a day. Each morning it harvests what's ripe, waters what grows, plants the tilled soil it has
seeds for, tills and clears a little more while fewer than five tiles grow, ships once there's a crate's worth, goes
into town for seeds when they run out, and spends what's left fishing and foraging. It checks:
- **every day spends exactly its ten actions,** and every morning has ten again;
- **watered crops grow and dry ones don't,** and something is harvested;
- **the season's last night withers what's left** (only Corn and Cabbage carry over);
- **the bin pays:** over 1,000g shipped, gold above the 500g start, and Farm Rank points earned;
- **every morning's save parses** as v5.

The run as it stands (`SEASON=1` prints it):

| Spring | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Planted and watered | 0 | 5 | 0 | 0 | 0 | 2 | 2 | 1 | 0 | 0 | 0 | 0 |
| Watered, besides the day's plantings | 0 | 0 | 5 | 5 | 5 | 0 | 2 | 4 | 5 | 3 | 1 | 0 |
| Harvested | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 2 | 2 | 1 |
| Gold, morning | 500 | 500 | 500 | 780 | 965 | 1,200 | 1,760 | 1,760 | 1,785 | 1,785 | 2,330 | 2,675 |

Summer 1 opens on 3,060g, 2,740g shipped, 10 tiles harvested and 82 Farm Rank points. Fishing and foraging carry the
season: an action at the water or the woods pays about what a Carrot's whole run of six actions does, so the farm's
balance waits on the farmhands and the tools.

#### The night's goals check

Night step 8 runs, in order:

1. **The places paid for yesterday stand** (`raiseBuildings`), each a line of news.
2. **The Dorm settles** (see [the roster](#the-roster)).
3. **The Diary pays** every milestone and row reached and not yet paid.
4. **The Farm Rank's points** are recomputed; **the ranks reached tonight** are noted, lowest first.
5. **Meeting her:** everyone in town whose trigger the farm now holds is met (see [meeting her](#meeting-her)).
6. **The ring bench** opens the night after the first Romance 8.

The morning's New today then lists, in order: the season and festivals, each place built, each Farm Rank reached, each
milestone and row paid, then the household's milestones and the Dorm's news.

#### The town's people

The town's people are Umas: fourteen roles, each played by a character from master data. The story's `town.json` says
who plays each role, by her character id (its `game` is the role's id below); a role it leaves goes to one of master
data's characters, from the last in its order, never one of the cast. Her name and bust are master data's, at run time,
so no name is in git. They live in town, never on the farm, and keep its spots (see [the town](#the-town)).

<!-- live:cast -->
| Role | Id (`game`) | Does |
|---|---|---|
| The mayor | `hollis-pryor` | Runs the town; welcomes you at the start |
| The shopkeeper | `marta-quill` | Keeps the general store (the shop) and its bakery |
| The farm’s last keeper | `ben-carver` | Kept the farm before you; gives the first seeds |
| The rancher | `dale-hart` | Sells animals and feed |
| The old miner | `gus-talbot` | Knows the Mine and the Quarry |
| The cook | `rosa-bell` | Judges the Cooking Contest |
| The guide | `juno-park` | Knows the roads past the town |
| The smith | `ida-stone` | Sets up the ring bench |
| The captain | `nils-berg` | Sails the boat to the deep sea |
| The orchard’s keeper | `wren-ashby` | A rival: the orchard over the hill, crops and cooking |
| The ranch’s keeper | `cole-varga` | A rival: the ranch down the road, animals and fishing |
| The courier | `courier` | Carries the post and the parcels |
| The musician | `musician` | Plays in the town’s squares |
| The bell’s keeper | `bell-keeper` | Keeps the chapel bell |
<!-- /live -->

- **In a scene,** a `say` by one of them, by her character id or by her role's (`ida-stone`), shows her name and bust.
  With no one playing a role (no master data), the role speaks in words ("The smith") on a lettered disc.
- **The smith** speaks at the ring bench. The others have no lines of the game's; the opening is the story's, and any of
  the town's people may speak in it.
- **A tie** with one of them builds no bond: its line shows on the cast Uma's profile ("In town ›") and on the town
  person's sheet.

#### The scenes

Each scene plays once: played through or skipped, it's marked read and never plays again. Which scene plays now:

- **Nothing plays until the farmer is named.**
- **The opening's lines,** on day 1, once you're named: the pack's `opening.json`, any length, else the game's three
  (below). Reading them or skipping them opens the farm on Home, day 1's visitor at the Gate: no card, no tutorial.
- **The ring bench's scene,** the morning after the first Romance 8 event, once the summary is put away: after the
  opening, before the meeting scenes.
- **Meeting scenes,** after those, in the order you met them: at once after Say hello at the Gate or a talk or gift in
  town that met her; the morning after the night met her, once the summary is put away.

#### The opening's lines

The pack's `opening.json` is the opening, at any length (see [the opening](#the-opening)). Without one, the game's own
three play, one to a tap; the last only when someone is coming (day 1's visitor):

<!-- live:scenes -->
| # | Kind | Line |
|---|---|---|
| 1 | Narration | Morning, {farmer}. The farm is yours now, weeds and all. |
| 2 | Narration | One block is tilled, and nine Carrot seeds wait in the Fields. |
| 3 | Narration | And someone is already waiting at the Gate. |
<!-- /live -->

The town's smith first appears at the ring bench, by her master-data name. The romance part covers the bench; its scene's lines are:

<!-- live:bench-scene -->
**The Ring Bench** (`scene:bench`)

| # | Who | Line |
|---|---|---|
| 1 | (narration) | A cart creaks up from town and stops at the old Forge. |
| 2 | The smith | “I keep the smithy down in town. They told me this Forge was still standing.” |
| 3 | (narration) | She runs a hand along the cold hearth, then looks at you. |
| 4 | The smith | “The fire can wait for another year. But a bench by the door, that I can set up today.” |
| 5 | The smith | “Bring three refined goods of one grade, and you’ll make a ring of that grade. Planks, fillets, flour: whatever you have.” |
| 6 | The smith | “One ring a day, and no charge. Word in town is that someone on this farm has your heart.” |
| 7 | (narration) | The Forge’s door stays open. A small bench waits inside, by the light. |
<!-- /live -->

#### The Diary tab

The Diary tab (`/diary`) holds the world's pages, the farm's projects, the Farm Rank and the milestones.

- **The farm** (first, when the world names the farm, the town or the region, or gives a history): the farm's name
  (else "The farm"), the town and the region under it, and the farm's history, a paragraph a line.
- **Town notes** (when the world writes any): the notes you know, in the pack's order, each a tap to read its lines
  (`?note=<id>` opens one, as the morning's line does), "None yet." before the first, and "2 of 5 found".
- **Projects:** what to build now, what's not built yet, the next rank's offers and the milestones with the Umas (see
  [the farm's projects](#the-farms-projects)).
- **Farm Rank · 400 points ›** opens the rank's sheet.
- **Milestones:** each milestone and row paid, in the order paid, with its gold ("10,000g shipped · +300g"), or "None
  yet."; then "12 goods shipped so far".
- **Memories** (each Uma's) and **Conversations** (the pairs'): the romance part covers them.
- Its help says how building, the milestones with the Umas, the Diary's milestones, Memories and Conversations work.

#### The Farm Rank's card and sheet

- **The card** is the Book's second, after the gold: the rank and its points ("1 · 47 points"); a tap opens the sheet.
  The Diary's Farm Rank row opens it too.
- **The sheet** opens over any page: "Farm Rank 2", the points, a bar to the next rank with "50 more for Farm Rank 3
  (250)" (or "The top rank"), what the next rank opens (the places to build first), and the points so far by source:
  Shipping (1 per 100g), Diary entries (5 each), Milestones (25 each). Its help explains where points come from.

#### The scene player

- **A full-screen sheet** over the farm and its bars, on [the dialogue engine](#the-dialogue-engine): the scene's title
  and **Skip** at the top; on the left the speaker's bust (her portrait in the day's season with the line's face, else
  her bust from master data; a role's disc; none for narration); on the right the speaker's name in the accent colour and
  the line (narration in italics), and "Tap to go on · 3/12". A tap on the line or the bust goes on.
- **It loads master data itself** (names, busts and portraits), since a new farm's boot doesn't wait for it. **Skip**
  works without it, and skipping marks the scene read.
- **The opening** plays its lines with the title line "Day 1" (the world's farm and town after it when it names them,
  "Day 1 · Thistle Farm, Fernwick"; a place once a `place` step names one: "Day 1 · Gate"), "Tap to go on · 1/3". Its last tap, or **Skip** on any line from the first, reads it and opens **Home**:
  three taps after the name for the game's own three.
- The same player plays the meeting scenes and the ring bench's scene; heart events play in their own player. The
  romance part covers them.

## Part 3 — Hearts: the cast and the romance

> **The romance is the game's.** It plays on save v5 from the story pack, and with the default story wherever the pack is
> silent: anyone in town can be met, the welcome list (the pack's, or with no pack master data's first five) at the Gate
> in the first days, and **People** is the rail's third page (Farm · Town · People · Book · Diary), with the
> roster's album as its Work view. A save from before v5 starts over as a new farm (see
> [Save versions](#save-versions)).

### The dialogue engine

One engine plays every scene: the opening, meeting her, the ring bench's scene, heart events (and Ask her, and a Memory
replayed), the wedding night, pair conversations, and the household's scenes and the finale. The evenings and the plays
have no lines yet; the evenings' and the calendar's own scenes (dinners, nights in, the festival nights) will play on it
as their packets land, handing it their moment, and the default story already writes each one
([what plays without the story](#what-plays-without-the-story)). The story's steps are the same in every scene (`say`, `narrate`, `thought`,
`choice`, `play`, …).

```
┌──────────────────────────────────────────────────────────────────────┐
│ The Fields · Friendship 2                             Auto  Skip  Log │
│ ╭──────────────────────────╮                                         │
│ │ (the place's    ┌──────┐ │                                         │  her portrait in the scene's
│ │  backdrop,      │ her  │ │                                         │  outfit, her face the line's
│ │  heart events   │portr-│ │  ┌──────────────────────────────────┐   │  emote
│ │  only)          │ ait  │ │  │ Her name                         │   │
│ │                 │      │ │  │ Her line, typed out in an event. │   │
│ │                 └──────┘ │  └──────────────────────────────────┘   │  the line, or the choices
│ ╰──────────────────────────╯                                         │
└──────────────────────────────────────────────────────────────────────┘
```

- **Landscape:** her bust on the left, the line or the choices on the right, both resting on the foot. A heart event
  puts the place card behind her bust (the backdrop); the other scenes stay plain until place art exists. A tap on the
  line (or on her bust) goes on; a heart event's line is typed out, three lines at most, as before.
- **Who's on the stage:** the speaker; narration and thoughts show no one, except in a heart event, where she stays on
  the stage with the face of her last line. At a choice the last one to speak stays; meeting her ends on her smiling
  ("Welcome, ‹her name›").
- **Her bust** is her portrait in the outfit the scene calls for, with the line's face over it:
  - **a line's face** is its `emote`; a line without one shows **neutral**, the portrait's own face;
  - **only the face changes** from line to line: the portrait stays put while the new face fades in over the last (140
    ms; at once with reduced motion), and neutral fades the last face away; until a new face has loaded, the last one
    stays;
  - **the next line's** portrait and face load while this line shows.
- **Without her portraits** she shows **the blank bust**: the silhouette of an Uma in the outfit the scene calls for,
  with a face for every one of the 22 expressions, so her face changes line by line like a portrait's
  ([the blank bust](#the-blank-bust)). A role no one plays shows its lettered disc.

#### Her portraits

Master data's private `dialogue-portraits` family holds them, keyed by her character id: **a portrait per outfit** (525 ×
700, her face neutral), with where the face sits on it, and **a face per expression** (224 × 224, with alpha), drawn to
sit over any of her portraits. The game draws the face over the portrait at that portrait's face position, unscaled,
in straight alpha. Her portraits load the first time she's on a stage, then each picture by its path: checked against
the release and cached on the device by its hash, so a scene plays offline once seen. The pilot is two Umas with 12
outfits and 15 faces each; the next follow in the Uma Ranker's order. An outfit or a face not drawn for her yet falls
back (below), so a story can name one before its art exists.

#### Outfits by context

**What she wears** is the scene's own `outfit` when the story names one (an event's, a pair level's, a household scene's
or the finale's); else the moment's, by the first rule that holds; else the day's season. An outfit not drawn for her
shows her first in the art's order: spring.

<!-- live:outfit-rules -->
| # | The moment | Her outfit | The base |
|---|---|---|---|
| — | The scene’s own `outfit`, when the story names one | Its own | Its art name, below |
| 1 | A wedding (`wedding`) | `wedding` | `wedding` |
| 2 | Its night (`wedding-night`) | `wedding-night` | `wedding-night` |
| 3 | A dinner (`dinner`) | `dinner` | `dinner` |
| 4 | A festival night (`festival-night`) | `kimono` | `kimono` |
| 5 | A picnic, a tea or the spring festival (`picnic`, `tea`, `spring-festival`) | `garden-party` | `garden-party` |
| 6 | A night in, or a night she can’t sleep (`night-in`, `sleepless`) | `pajamas` | `pajamas-playful` |
| 7 | Her work (`work`) | `work` | `farm-work` |
| 8 | The summer shore (`shore`) | `swimsuit` | `swimsuit` |
| 9 | Else | `season` | The day’s season’s |

A wedding’s guests wear the moment’s other outfit (`wedding` and `wedding-night` are the scene’s own Umas’ only). The heart events’ moments: the wedding rung, a beat whose `together` is work, a picnic date, and `sea-pier` in summer. A household scene is a dinner and the finale a festival night; the other moments are the evenings’ and the calendar’s scenes’ to hand in.
<!-- /live -->

**The story's outfit ids** and the art's names for them:

<!-- live:outfit-ids -->
| The story’s `outfit` | The art’s base |
|---|---|
| `season` | `spring`, `summer`, `fall`, `winter` by the day |
| `spring` | `spring` |
| `summer` | `summer` |
| `autumn` | `fall` |
| `winter` | `winter` |
| `work` | `farm-work` |
| `garden-party` | `garden-party` |
| `kimono` | `kimono` |
| `dinner` | `dinner` |
| `wedding` | `wedding` |
| `wedding-night` | `wedding-night` |
| `pajamas` | `pajamas-playful` |
| `swimsuit` | `swimsuit` |
<!-- /live -->

- **Who wears it:** the scene's own Umas (the event's, the pair, her in her meeting scene, every spouse in a household
  scene); anyone else in the scene wears the same, unless it's a wedding's.
- **The sprites don't change:** her chibi set on the farm map is master data's, whatever she wears in a scene.

#### Her faces

The story's `emote` names one of **22 expressions** in three sets: core for every Uma who speaks, romance for every Uma
with a route, extra when there's time. A face not drawn for her yet shows its nearest, ending at neutral; an emote off
the menu shows neutral (the story's check notes it).

<!-- live:expressions -->
| Expression | Set | Falls back to | Shown while not drawn |
|---|---|---|---|
| `neutral` | Core | — | The base’s own face |
| `happy` | Core | `neutral` | `neutral` |
| `laughing` | Core | `happy` | `happy` → `neutral` |
| `surprised` | Core | `neutral` | `neutral` |
| `thinking` | Core | `neutral` | `neutral` |
| `sad` | Core | `neutral` | `neutral` |
| `angry` | Core | `neutral` | `neutral` |
| `worried` | Core | `sad` | `sad` → `neutral` |
| `determined` | Core | `happy` | `happy` → `neutral` |
| `pouting` | Core | `angry` | `angry` → `neutral` |
| `shy` | Romance | `happy` | `happy` → `neutral` |
| `tender` | Romance | `happy` | `happy` → `neutral` |
| `flustered` | Romance | `shy` | `shy` → `happy` → `neutral` |
| `loving` | Romance | `tender` | `tender` → `happy` → `neutral` |
| `tearful-joy` | Romance | `loving` | `loving` → `tender` → `happy` → `neutral` |
| `sleepy` | Romance | `tender` | `tender` → `happy` → `neutral` |
| `crying` | Extra | `sad` | `sad` → `neutral` |
| `teasing` | Extra | `happy` | `happy` → `neutral` |
| `smug` | Extra | `determined` | `determined` → `happy` → `neutral` |
| `embarrassed` | Extra | `flustered` | `flustered` → `shy` → `happy` → `neutral` |
| `startled` | Extra | `surprised` | `surprised` → `neutral` |
| `dreamy` | Extra | `tender` | `tender` → `happy` → `neutral` |
<!-- /live -->

#### The blank bust

Every Uma without portraits plays every scene on **the blank bust**, drawn in the web app's code (`dialogue/blank.tsx`),
so it needs no release and is replaced the moment her portraits are published.

- **The fallback order on a stage:** her portraits, else the blank bust, else (a role no one plays) the role's lettered
  disc. The blank bust comes before her master-data bust because a scene's point is her face changing line by line,
  and the master-data bust has no faces. Her master-data face and bust stay where they always were: cards, lists, the
  town's sheets and her profile.
- **The base:** a soft silhouette of an Uma (her ears, her long hair, her shoulders) at a portrait's size (525 × 700),
  in the scene's outfit by [outfits by context](#outfits-by-context): each of the 12 has its colours and its mark (the
  kimono's crossed collar and gold obi, the wedding dress's veil and gold flowers, the wedding night outfit's soft robe
  with blush lace, work clothes' overalls, pajamas' dots, and so on).
- **Her tint:** her hair is her theme colour from master data's character set, softened toward a hair tone; her eyes
  and her ear ribbon take her second colour. Without one (a stand-in), a tone picked by her id, the same every time.
- **The face:** a simple face for each of the 22 expressions (224 × 224), laid over the base at its face position (150,
  188), exactly as a portrait's face is, and swapped with the same 140 ms fade (at once with reduced motion). All 22
  are drawn, so an emote shows as written; an unknown one shows neutral.

  | Expression | Her eyes | Her mouth | Its marks |
  |---|---|---|---|
  | `neutral` | Open | A small smile | — |
  | `happy` | Smiling arcs | A smile | A light blush |
  | `laughing` | Squeezed shut | Open, laughing | A light blush |
  | `surprised` | Wide | A small “o” | Brows high |
  | `thinking` | Looking up | To one side | Thought dots, one brow up |
  | `sad` | Drooping | A frown | Worried brows |
  | `angry` | Glaring | A frown | An anger mark |
  | `worried` | Open | Wavy | A sweat drop |
  | `determined` | Set | Firm | A sparkle |
  | `pouting` | Half-lidded | Pursed | A puffed cheek, a light blush |
  | `shy` | Looking down | A small smile | A deep blush |
  | `tender` | Softly closed | A smile | A light blush |
  | `flustered` | Wide | Wavy | A deep blush, blush lines |
  | `loving` | Smiling arcs | A smile | A deep blush, a heart |
  | `tearful-joy` | Smiling arcs | Open, smiling | Tears |
  | `sleepy` | Closed | A yawn | Z's |
  | `crying` | Shut tight | Open, sobbing | Streams of tears |
  | `teasing` | A wink | A cat's smile | A light blush |
  | `smug` | Half-lidded | A smirk | One brow up |
  | `embarrassed` | Squeezed shut | Wavy | A deep blush, blush lines, a sweat drop |
  | `startled` | Wide, small pupils | A big “O” | Alarm lines |
  | `dreamy` | Half-lidded, looking up | A smile | Sparkles, a light blush |

- **Her place holds while her portraits load,** so a pilot's bust never flashes blank before her portrait.
- **The blank profile:** where master data has no face for her (a stand-in, or one it doesn't hold), lists and cards
  show the same head and shoulders on her colour, with her letters ("S1"). Where master data has her face and name,
  those show, as before.

### The cast and the story pack

Everyone you've met is one of **the cast**: one character each, keyed by her character id everywhere the save names an
Uma (the roster, her route, the Dorm, work, bonds, Memories and meeting scenes). She plays one outfit, is met when her
trigger holds, and has a route of her own. One you meet whom the pack doesn't hold joins the cast bare, on the default story.

#### What the pack holds

The pack is a folder of JSON files, kept out of git. **It's a menu, not a checklist:** every part is optional, any number
of characters is fine, in any order, and nothing is counted. [The story pack's menu](story-pack.md) lists every field the
game reads, what it does in play, and what plays when it's missing.

| File | Holds | Without it |
|---|---|---|
| Cast | The cast, in its order: each character's id (a sister's `s<outfitId>`, with her name) and, optionally, her outfit, calling, birthday, favourite spot, trigger to meet, chapters and arrival; the welcome list | No characters |
| Ties | Each tie: two characters (a sister, or one of the town's people, among them) and, optionally, its kind, a strength of 1–3 and a line | No ties |
| Her bible (one per Uma) | Optionally her favourite line, gifts (loved, liked, disliked, any number each), her route's beats, chat sets, town lines, keepsake, pet name, wedding places and wishes. Her profile texts, season and festival are the story's own | Her calling's line (else her stats'), the default story's tastes (her line's favourite good loved) and talks, the game's town lines |
| Her route (one per Uma) | Her scripted events, by id (the rungs, her life's events, her occasions, the evenings' scenes), any of them | Each plays the default story's, which pays as a written one does |
| A pair's conversations | Conversations at bond levels 1–5 for a tie's two Umas | The game's two-line card at each level |
| The household | Household scenes at 5, 10 and 15 married, house lines and the finale, every part optional | The game's short cards; house lines from her temperament |
| The opening | The start's lines, any number: said, narrated, thought, pauses and the title line's place | The game's three lines |
| The town | The town's people (each an Uma of master data's in a role) and its six spots (name, line, keeper) | Master data fills the roles; the game's own six spots |
| The world | The town's, the farm's and the region's names, the farm's history, the festivals, each place's name and line, a line for each season, and Town notes ([below](#the-world-in-the-pack)) | The game's own words: its five festivals, its places' names and lines, and no Town notes |

**One reader, two kinds of findings.** The game, the release and the Farm Story Sandbox read a pack with one reader
(`readStoryPack`):

| | What | What happens |
|---|---|---|
| **An error** | Only what the game can't read: a file that isn't JSON or isn't the shape the game reads, a value the game can't use where it reads it, or a line longer than its screen | It skips the one part it's in (a line, a field, a beat, an event, a bond level, a tie, a character, at most a file); the rest plays |
| **A note** | Everything else: what isn't written yet, an unusual count, a bible and the tag sheet disagreeing | Nothing: notes block nothing |

**The game's backbone** stays as built, and the story writes any of it: her arrival ("event zero"), Friendship 1–10,
her confession, Romance 1–10, the proposal, the wedding and Spouse 1, 3 and 5 are the 27 rungs the game plays an event
at. A beat says, each optional:

- **its setup:** her full bar only, or one thing the player controls: she works an activity, a named good is in the
  Warehouse, or her bond with a named Uma reaches a level 1–5. Never an hour, the weather, a
  season or a festival;
- **what you do together:** talk, work an activity, one of the ten date games (fishing, cooking, stargazing, footrace,
  dance, picnic, market, boat, walk, crafting), give a named good, or help another cast Uma;
- **its caption** (the Memory's line), **its hint** (what her profile says while it's next), its place, and **an
  unlock:** an item, a place or a perk in words.

**A scripted event** is a list of steps: a line said by a cast Uma or one of the town's people, by her id or her role's
(with an optional emote, one of [the 22 expressions](#her-faces)), narration, a thought, a pause, a change of place, a
flag, a branch on a flag, a choice, or a play. The event may name its own `outfit` ([outfits by
context](#outfits-by-context)).

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

**Every line** is within its screen's length (an error otherwise) and, as notes, follows two rules: `{farmer}` is the
only placeholder, and nothing reads as school. **The protagonist is a man** (the owner, 2026-11-14): a line may say he,
her husband, the groom, and no word about him is a note any more. A flag's name is one the save can keep (lowercase
letters, digits and `- . : _`), and an option's cost and reveal name goods the game has: the save keeps them, so each is
an error otherwise.

**Her events past the rungs:** a route may also write her life's events (`wedding-night`, `moving-in`, `s2`, `s4`), her
occasions (`birthday`, `new-year` and the five festivals by id) and the evenings' scenes (`hangout-<kind>`,
`date-<kind>`, `dinner-in-town`, `a-night-in`). Each replaces the default story's scene of that id; they pay nothing,
so their choices are wording only, and the usual sizes don't apply. Any other id is a note, kept for the story.

#### The menu's welcome list, her trigger and her chapters

The cast file also gives, all optional, three things, all acting now: the welcome list and her trigger ([meeting
her](#meeting-her)), and her chapters ([her chapters](#her-chapters)):

| Item | What it is | Without it |
|---|---|---|
| **The welcome list** (`welcome`) | Who visits the Gate in the first days, one a morning, in order, any number; each meets you on her first talk | The first five of the cast, in its order |
| **Her trigger to meet** (`meet`) | From the trigger menu: talks on *n* days, a gift, a town spot, a season, a festival, a Farm Rank, a place built, a good shipped, or after another character's event | Talk with her on three different days |
| **Her chapters** (`chapters`) | Their titles, which of her rungs each holds, and an optional gate from the same menu (the farm's kinds, a season or a festival) | Four: "Getting to know her" (her arrival, F1–F10, the confession), "Together" (R1–R10, the proposal), "The wedding", "Married life" (S1, S3, S5) |

The domain reads them through `welcomeOf`, `meetOf` and `chaptersOf`, each with its default; `herChapters` lays her
chapters along her route.

#### The world in the pack

The pack's `world.json` puts the world the story builds on screen; every part is optional, and anything missing keeps the
game's own words ([the story pack's menu](story-pack.md#the-world-worldjson) has its exact shape). The domain reads it
through the placeholders' lookups: `worldNamesOf`, `historyOf`, `festivalsOf`, `placeWordsOf`, `seasonLineOf` and
`townNotesOf`.

| Part | In play | Without it |
|---|---|---|
| The town's name | The Town on the map and its screen's title, the opening's title line, the Gate's "Meet everyone else in *Fernwick*", the morning's "Met *name* · in *Fernwick*", the Diary's "The farm" | "Town" on the map and its screen; "in town" |
| The farm's name | The opening's title line, the Diary's "The farm" | "The farm"; the opening says "Day 1" |
| The region's name | The Diary's "The farm", after the town | None |
| The farm's history | The Diary's "The farm" page | None |
| The festivals | Renamed, moved or added: the calendar, the date chip, the morning, festival night, `festival` triggers and gates ([festivals](#festivals)) | The game's five |
| A place's name and line | The map, its quick look, its Build card | The game's own |
| A season's line | Under "*Spring* begins" on the season's first morning | "Spring begins" alone |
| Town notes | The Diary's Town notes, filling as you play; the morning names the night's ([below](#town-notes)) | None |

#### Town notes

Short pieces of the world that unlock as you play. Each unlocks once and stays.

```
 world.json's notes ──► no unlock ──────────────────────────────► known from the start
                    └─► an unlock from the menu ──► it holds at a talk, a gift, Say hello ──► "Town note · title ›" there
                                                    └─ or at night (step 8) ─────────────────► the morning names it
                                                                         both ──► the Diary's Town notes, kept
```

| Unlock | Holds | Checked |
|---|---|---|
| None | From the start | — |
| `event` (`<characterId>:arrival` is meeting her) | That event has played | A talk or a gift in town, Say hello at the Gate, and every night |
| `spot` | A talk with anyone out at that town spot: a visit | A talk in town |
| `season` | All that season | A talk, a gift, Say hello, and every night |
| `festival` | That festival's day, as the story puts it | A talk, a gift, Say hello, and every night |
| `farm-rank`, `built`, `shipped` | What the farm holds | A talk, a gift, Say hello, and every night |

- **The night** checks after meeting her (step 8, `unlockTownNotes`) on the morning's date, so a season's note comes with
  its first morning, a festival's with its morning, and one for meeting someone the night after her meeting scene.
- **The save** keeps only the ids unlocked, in the order they unlocked (`diary.notes`); the words are the pack's. A note
  with no unlock never enters the save. A note the pack drops leaves the list; one it brings back returns.
- **The Diary** lists the notes you know in the pack's order, each a tap to read; **the morning** names the night's in
  New today, the first by its title ("*title* +2 more"), tagged **Town note**; **a talk, a gift or Say hello** that
  unlocks one says "Town note · *title* ›" there and then.

#### The pack at runtime

The game holds the cast, the ties, each bible by character id, the event ids each route scripts, the bond levels each
tie's pair has a conversation at, the household, the opening, the town and the world. Routes and pairs' conversations load on demand, the first time
they're needed.

- **Read, never refused.** Every part is read on its own: a part with an error is skipped and the rest plays, so a pack
  never stops the game.
- **Never waited on.** Every read of the pack goes through one lookup, the pack's or the default
  (`story/placeholders.ts`, the default story's home), so a part the pack doesn't write plays the game's own: an
  unscripted rung plays the default story's event, a pair's unwritten level its two lines, a household beat its one
  line. Nothing is gated on the story. The next section lists every default.
- **The save holds ids only:** her character id, rung ids, flags, counts. Never a line of the story.

#### One outfit each, and the resolver

- **Her outfit** is the cast file's: the game never chooses one over it. Her face, bust, talents and temperament come
  from that outfit; her name is her character's. Talents aren't saved, so a changed outfit shows on the next boot.
  Without one, she plays **her default outfit from master data**: her first original outfit (no variant, the lowest id),
  else her lowest. (What she wears in a scene is her portraits' outfit, by [context](#outfits-by-context): a different
  thing.)
- **One resolver** turns a roster id into the outfit it plays: the cast's outfit, else master data's default for her,
  else the id itself for someone master data doesn't hold. The app sees
  master data through it, so faces, busts, names, talents, temperaments and pickers all follow the cast with nothing else
  to change.
- **A sister** (`s<outfitId>`, the Ranker's) is an outfit of an Uma, presented as a character of her own: she plays that
  outfit (its face, bust, talents and temperament), and her name is the pack's cast entry's `name`, never in git (without
  one, her elder's name as her sister). She lives in town and is met like anyone; the roster takes her id.
- **Anyone in town** meets master data through the same resolver: one of the town's people, or any other character,
  plays her default outfit; a role, the Uma who plays it. A character with no outfit shows master data's character face,
  else her name's letters on a disc.
- **A character master data doesn't hold** shows her blank profile (the silhouette of an Uma on her colour, with her
  name's first letter and its number, "S1") and reads
  D talents in every activity. The stand-ins are named "Stand-in 1" to "Stand-in 3"; any other unknown character is "An
  Uma".
- **Everyone on the farm stays in the cast.** An Uma on the roster the pack doesn't hold (one a release dropped, or one
  from an older story) joins the cast bare as the save comes in, at its end, and plays on the default story: her name and
  face from master data's default outfit for her, or her blank profile.

#### The stand-in pack

The repo carries an invented stand-in pack in the private pack's layout, so the romance is built and tested without a real
character, name or line. It's the tests' only: no production build holds it, and the dev server plays no pack unless a
release is there (`pnpm story:release --stand-in` writes one). Its first Uma, a farmer, has her whole route and every
optional field; the forager and the fisher have only their arrival scenes and no bible, so the default story and the
calling's line are exercised. Its opening is four invented lines, three narrated and then the farmer's thought, ending
on someone at the Gate; it names no welcome list, so its three are the welcome list and its first is day 1's visitor. None of the three outfits is in master data, so all three show their blank profiles. The three
stand-ins:

<!-- live:stand-in -->
| Character | Outfit | Calling | Favourite line | Welcome list | Bible | Scripted |
|---|---|---|---|---|---|---|
| 9000001 | 900000101 | farming | farming | 1st: day 1’s visitor | Yes | 27 of 27 |
| 9000002 | 900000201 | foraging | foraging | 2nd | No (her calling stands in) | 1 of 27 |
| 9000003 | 900000301 | fishing | fishing | 3rd | No (her calling stands in) | 1 of 27 |
<!-- /live -->

#### How the app gets the pack

- **The release** reads the private pack with the game's own reader and **releases any pack**, partial or not: it lists
  what it skipped (the errors) and the notes, and refuses only when there's no pack folder. It holds the pack as the game
  reads it, every broken part already skipped and every other field kept, and always a cast and a ties file (empty when
  the pack has none). It writes each file minified, named with the first 8 hex of its SHA-256
  (`story/<name>.<hash8>.json`), and an index, `story.json`: every file with its path, size and hash, the event ids each
  route scripts, and the bond levels each pair holds. The same pack gives the same release.
- **The ship** (`pnpm story:ship`, run where the story is written) checks the pack, builds the release, publishes it and
  backs the drafts up. Every ship is **numbered** (one more than the release the bucket held, or 1), **dated**, and has
  a **note** saying what's new (one line, 160 characters at most). The publish uploads the hash-named files first and
  the index last, to a private bucket. Old files stay, so a phone holding an older index still reads it, and a rollback
  publishes an earlier index again under a new number, its note "Rolled back to *n*". A pack the bucket already plays
  isn't published again.
- **farm-api serves it** to the owner only: the index fresh on every read, the hash-named files cached for good, and
  nothing else (404).
- **On the phone,** the boot reads the index, then the cast, the ties, the bibles, the household, the opening, the town
  and the world; each route and pair
  loads when it's first needed. Every file is checked against the index's hash and kept in the content cache, so a
  release's file downloads once. The boot and the night wait for the pack, as they wait for master data.
- **The last good index stays on the phone.** When the index can't be read (offline, or the server failing), the boot
  plays the last version kept. The phone reads each file with the same reader, so a broken part is skipped there too. A
  release that can't load (no index and none kept, a file whose hash doesn't match, a route or pair that isn't what the
  index lists) stops the boot with **Try again**.
- **No pack published plays no pack:** when farm-api serves none at all (a 404 for the index), the game plays with no
  pack, on the default story: master data's first five are the cast, so a fresh farm opens and plays whole. The boot waits
  for master data as well as the index, since the default story reads it.
- **"New story arrived."** A fresh index whose number isn't the one the phone kept last is a new release. Once its pack
  has loaded, the phone keeps its number (`farm.story-news`, a few bytes) until the next night, which opens the
  morning's New today with **"New story arrived · *its note*"**, tagged **New**; a tap opens the People page. It shows
  once a release on each phone; a release that arrives before the night replaces the one waiting. The save keeps the
  line's number only, never the note: the card reads the note from the release the game plays, and says "New story
  arrived" alone for another one. A new farm starts with none waiting, since its opening plays the story. An offline
  boot on the kept index, and a release published unnumbered (`story:publish`), say nothing.
- **Account's Story row** shows the release the game plays: **"Release 4, 14 Nov 2026"** (its number and the day it
  shipped; an unnumbered one by its id and build date), or **"No story yet"** when none plays.

### What plays without the story

The game plays whole with no story at all. Wherever it would read the pack, it plays **the default story**: written
once for the game, warm and short, adults only, tender and never explicit, with her name, her favourite good and her
line's work filled in at run time and nobody named. The protagonist is a man: it may say he, her husband, the groom.
So every Uma plays her whole story from day one, from meeting her to married life, and nothing is blank. It reads as
the game's own voice, with no "placeholder" label in play; the Farm Story Sandbox marks, for each character, what's
written and what's the default ("In the game" on her page). Her own story replaces it **piece by piece**: her bible's
chat set replaces the talks for its stage, her route's event of an id replaces that event (a rung, the wedding night,
an occasion, an evening's scene), her bible's gifts replace her tastes; anything her pack leaves out stays default.
Every ladder, event, perk, evening, proposal, wedding and household runs end to end without one.

**The default story** (`story/default-story.ts`, loaded with the story pack, never in the initial JS):

<!-- live:default-story -->
| Piece | What the default holds | Replaced by the story’s |
|---|---|---|
| Her talks | 120: 4 for each stage (acquaintance, friend, farmhand, sweetheart, engaged, married) and temperament (breezy, steady, bold, gritty, clever) | Her bible’s `chats` set for the stage |
| Her gift reactions | 3 for each taste (loved, liked, neutral, disliked) | — |
| Her meeting | At the Gate (the welcome list’s), or in town, where you introduce yourself | Her route’s `arrival` |
| Her events | Every rung (27), and her life’s: `wedding-night`, `moving-in`, `s2`, `s4` | Her route’s event of that id |
| Her occasions | `birthday`, `new-year`, `flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`, `harvest-cup` | Her route’s event of that id |
| The evenings’ scenes | `hangout-walk`, `hangout-fishing`, `hangout-picnic`, `hangout-market`, `hangout-cooking`, `hangout-festival`, `date-walk`, `date-fishing`, `date-picnic`, `date-market`, `date-cooking`, `date-crafting`, `date-stargazing`, `date-dance`, `date-boat`, `date-footrace`, `date-festival`, `dinner-in-town`, `a-night-in` | Her route’s event of that id |
| The night’s companion | 3 morning greetings for each temperament | — |
| Meals | 3 lines for breakfast and 3 for dinner | — |
| Her favourite good (`{good}`), the gift she loves | Farming Peach, Ranch Honey, Mining Amethyst, Fishing Seashell, Foraging Chestnut, Cooking Cinnamon, Serving Chocolate, Forging Garnet | Her bible’s loved gift |
| Her line’s work (`{work}`) | Farming “farming”, Ranch “tending the animals”, Mining “mining”, Fishing “fishing”, Foraging “foraging”, Cooking “cooking”, Serving “serving”, Forging “forging” | Her line (her bible’s, her calling’s) |
<!-- /live -->

The default scenes that name their outfit (the rest wear the moment's, by [outfits by context](#outfits-by-context)):

<!-- live:default-outfits -->
| Scene | Her outfit |
|---|---|
| `r3` | `garden-party` |
| `wedding-night` | `wedding-night` |
| `birthday` | `dinner` |
| `new-year` | `kimono` |
| `flower-show` | `garden-party` |
| `fishing-derby` | `kimono` |
| `harvest-cup` | `kimono` |
| `hangout-picnic` | `garden-party` |
| `hangout-festival` | `kimono` |
| `date-picnic` | `garden-party` |
| `date-festival` | `kimono` |
| `dinner-in-town` | `dinner` |
| `a-night-in` | `pajamas` |
<!-- /live -->

- **Her stage, as her talks follow it,** is the Uma loop's ([F79](handoff/tasks/F79-uma-loop.md) builds the rest):
  acquaintance to Friendship 2; friend from Friendship 3 through the confession's wait (farmhand once she works the
  farm); sweetheart from the confession through the proposal's wait; engaged until the wedding; married after it.
- **The wedding night** plays right after the wedding's card, before the Married stage-up: her route's `wedding-night`,
  else the default's, in the wedding night outfit on a night backdrop, tender and fading to morning. It pays nothing
  and saves nothing; Skip ends it.
- **What waits for its packet:** moving in, married life 2 and 4, the occasions, the evenings' scenes, the morning
  greetings and the meal lines are written and read through the same lookup (`eventOf`, `morningGreetingsOf`,
  `mealLinesOf`); they play when the Uma loop (F79) and the calendar (F82) give them their moment.

Every other part of the story, and what plays without it:

<!-- live:placeholders -->
| What the story can give | What plays without it |
|---|---|
| The cast | Master data’s first 5 characters, in its order (the welcome list’s size) |
| The opening | Three short lines: the farm, its nine Carrot seeds, and someone waiting at the Gate (that line only when someone is coming) |
| Her name and outfit | Her master-data name and default outfit (her first original one) |
| Her chat lines, by stage | The default story’s talks: 4 a stage (acquaintance, friend, farmhand, sweetheart, engaged, married) for each of her 5 temperaments |
| Her gift reactions | The default story’s: 3 lines for each taste (loved, liked, neutral, disliked) |
| Her meeting scene | The default story’s: at the Gate for the welcome list, in town (you introduce yourself) for anyone else; it pays as a written one does. A written one with no choice gets the hello |
| A heart event | The default story’s: her moment, her lines with their faces and your reply; its points and rewards pay as written |
| The wedding night, moving in, married life 2 and 4 | The default story’s: the wedding night in its outfit, tender and fading to morning; they pay nothing |
| Her occasions | The default story’s 7: her birthday, the five festivals and New Year’s |
| Her evenings’ scenes | The default story’s 19: a hangout’s and a date’s for each kind, Dinner in town and A night in |
| Her morning greetings and meal lines | The default story’s: 3 greetings for each temperament, and 3 lines for each meal |
| A play’s prompt | Its game’s: “Cast the line together.” |
| Her chapters | “Getting to know her”, “Together”, “The wedding”, “Married life” |
| Her trigger to meet | Talk with her on three different days |
| Her favourite line | Her line from master data: the work her stats suit best |
| Her tastes | Her favourite good loved (by her line: a Peach for farming, a Seashell for fishing…), every other gift neutral |
| Her birthday | Master data’s, or none |
| Her pet name for you | Your name |
| Her keepsake | “Her keepsake”, with a plain line |
| Her ring’s words | “Yours, always.” |
| Her wedding places | Her wedding beat’s place and the farm’s: the chapel bell, the Fields, the overlook |
| A tie’s kind, strength and line | “Close”, strength 1, “Closer now” |
| A pair’s conversation | Two short lines, one each, at every bond level of a tie; it pays nothing, as written |
| A household scene or the finale | A short card: a line, each spouse’s line, a line; the finale’s dance. It pays nothing, as written |
| Her house lines | Her temperament’s |
| The welcome list | The cast’s first 5, in its order: one a morning at the Gate from day 1, each met on her first talk |
| The town’s people | Master data’s characters fill the 14 roles, from the last in its order, never one of the cast |
| The town’s spots | The game’s 6: The Plaza, The Market, The Café, The Harbour, The Library, The Hilltop Track |
| Her favourite spot | None: she’s out at any spot alike |
| Her town line | 6 short lines, one a day |
| A sister’s name | Her elder’s name, as her sister |
| The town’s, the farm’s and the region’s names | “Town” on the map, “The farm” in the Diary, no region; the opening names none |
| The farm’s history | None |
| The festivals | The game’s 5: Flower Show, Fishing Derby, Cooking Contest, Animal Show, Harvest Cup, on each season’s 10th day and Winter 12 |
| A place’s name and line | The map’s own name, and its quick look’s line |
| A season’s line | None: the morning says “Spring begins” alone |
| Town notes | None |
<!-- /live -->

- **No pack at all** (none published, or a pack whose cast names nobody): the cast is master data's first five
  characters by id, the welcome list's size, each in her default outfit with her master-data name. The game's three
  lines open the farm, and the five visit the Gate one a morning, master data's first on day 1. Everyone else is met in
  town, on three days' talks.
- **Her line from master data** is the work her stats suit best, by the talents' one rule: each activity reads one stat
  (Stamina farming, Guts the ranch, Power mining, Wit fishing, Speed foraging), and a tie goes to the first in that
  order. A line whose places aren't built yet waits as a written one does ("Opens when the Mine is built").
- **A heart event's default** is her moment, her lines with their faces and your reply: the warmer reply pays +30, the other +10, and with
  no play the best reply is a Perfect, so a card pays +50, +30 and +30 at best, as a written heart event does. Her beat's
  setup, place, play and unlock still apply when her bible has them. The big rungs keep their shape: her confession's
  reply holds Yes and Not yet, the proposal follows the ring you chose, and the wedding's last choice is the vows.
- **Her meeting scene** is the default story's at the Gate for the welcome list, or in town for anyone else, where you
  introduce yourself: +50 and the reply's +30 or +10. A written one with no choice gets the Gate's hello, so every meeting pays
  as one with a choice does.
- **A tie's pair** has a conversation at every bond level: the pack's where it writes one, else two short lines, one
  each. A pair the ties don't hold has none ("‹a› and ‹b› are closer now").
- **The household** plays its scenes at 5, 10 and 15 married and the finale at 20 whatever the pack holds: the pack's
  `open` and `close` where written, else a line each; each spouse's beat, else her one line; the finale's dance.

Each default event's first line, which is also its Memory's caption when her beat gives none:

<!-- live:placeholder-moments -->
| Rung | The default event’s first line (and its Memory’s caption) |
|---|---|
| Her meeting scene | Someone new is waiting at the Gate. |
| Friendship 1 | A quiet afternoon with her. |
| Friendship 2 | She shows you her favourite corner of the farm. |
| Friendship 3 | You share a snack on the fence rail. |
| Friendship 4 | She asks how the farm came to be yours. |
| Friendship 5 | You work side by side until the light turns gold. |
| Friendship 6 | She laughs at a joke you didn’t mean to make. |
| Friendship 7 | A long walk home, talking the whole way. |
| Friendship 8 | She tells you something she hasn’t told anyone here. |
| Friendship 9 | You mend a broken gate together. |
| Friendship 10 | She waits for you at the end of the day. |
| Her confession | She asks you to stay after everyone else has gone. |
| Romance 1 | Your first evening together, just the two of you. |
| Romance 2 | She holds your hand all the way home. |
| Romance 3 | A picnic for two, with far too much food. |
| Romance 4 | She leans on your shoulder and watches the clouds. |
| Romance 5 | You cook supper together and only burn a little. |
| Romance 6 | A slow dance with no music at all. |
| Romance 7 | She saves you the best seat by the fire. |
| Romance 8 | You count the stars until you both lose track. |
| Romance 9 | She talks about the years ahead, and you’re in all of them. |
| Romance 10 | A quiet night when nothing needs saying. |
| The proposal | You find a quiet moment and hold out the ring. |
| The wedding | The bell rings, and everyone you love is here. |
| Spouse 1 | Your first morning at home together. |
| Spouse 3 | A lazy afternoon with nowhere to be. |
| Spouse 5 | You renew your vows on a quiet evening. |
<!-- /live -->

### The opening, the farmer's name, and meeting her

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

No pronouns are asked: the protagonist is a man (the owner, 2026-11-14), never drawn. Lines say "you", and may say he,
her husband, the groom.

#### The opening

A new farm takes under a minute: your name, a few lines, and you're on the farm. Day 1 runs in this order:

```
 the name sheet ──► the opening's lines, one to a tap ──► Home, day 1
                     the pack's opening.json, any length;      day 1's visitor at the Gate:
                     else the game's three                     the Gate's quick look → Say hello → met → her meeting scene
                     Skip from the first line ─────────────────┘
```

1. **The name sheet.** Nothing else plays while the farmer is unnamed.
2. **The opening's lines:** the pack's `opening.json` (any number of steps: said, narrated, thought, pauses and the
   title line's place), else [the game's three](#the-openings-lines). `{farmer}` is filled as each shows. The title
   line names where you are when the world names it, "Day 1 · Thistle Farm, Fernwick" (the farm, the town, or either
   alone), until a `place` step names a place ("Day 1 · Gate"); else "Day 1".
3. **Its last tap, or Skip on any line from the first,** reads it once and opens **Home** on day 1: three taps after
   the name for the game's own three. No picks, no card, no tutorial.
4. **Day 1's visitor waits at the Gate:** the welcome list's first in the cast (with no pack, master data's first).
   The Gate on the map wears a **Visiting** badge, and its quick look says "‹name› is at the Gate." with **Say hello**,
   her first talk: it meets her, she moves into the Dorm (three beds) at Friendship 0 so the farm has someone to work,
   and her meeting scene plays. The rest of the welcome list comes one a morning (see [meeting her](#meeting-her)). A
   cast with nobody brings nobody, and the game's opening drops its Gate line.

Nothing is picked or drawn. The farm has no global chapters, so the opening is the farm's first morning, never a plot.
A farm whose opening was already read never plays it again, and keeps everyone it has.

#### Meeting her

Every character lives in town, and her story begins when her trigger is met. From then on she has the whole romance:
her ladders, heart events, perks, evenings, the proposal, the wedding and married life, in [her own
chapters](#her-chapters); she shows on the People page. There's no cap on how many you meet: the Dorm's beds cap only who lives on the farm.

```
 the welcome list ──► the Gate, one a morning from day 1 ──► Say hello: her first talk ──┐
 anyone else in town ──► her trigger: talks on 3 days (or the pack's `meet`) ──────────────┼──► met: her meeting scene
 the farm holds her trigger (a Farm Rank, a place built, a good shipped, another's event) ─┘          │
                                                                                a bed free? ──► the Dorm, working
                                                                                    └── no ──► she lives in town
                                                                                      a bed frees ──► Invite to the farm
```

- **Her trigger** is her cast entry's `meet`, from [the trigger menu](story-pack.md#the-trigger-menu); with none, **talk
  with her on three different days**. Her progress is the town's talks (`town[id].talks`), a talk counting once a day.
- **The welcome list** (the pack's `welcome`, else the cast's first five) meets you on her first talk, whatever her
  trigger. From day 1, **one a morning** visits the Gate, in the list's order: today's visitor is the list's first not
  met before today, so the next comes the morning after the one before her is met, and one you don't greet waits there
  the next day too. Her meeting scene is her Gate visit, so she isn't out in town until she's met. The Gate wears
  **Visiting**; its quick look says "‹name› is at the Gate." with **Say hello**, her first talk (it counts in `town`),
  which meets her. Day 1's visitor is the farm's first helper: with three beds, she moves in and works the farm that
  day.
- **When it's checked**, by kind:

<!-- live:meet-kinds -->
| Trigger (`meet`) | What meets her | Checked |
|---|---|---|
| `talks` | Talk with her on this many different days (3 without a trigger) | A talk in town |
| `gift` | Give her a gift she likes or loves in town, or the good it names | A gift in town |
| `spot` | Talk with her at this town spot | A talk in town |
| `season` | Talk with her in this season | A talk in town |
| `festival` | Talk with her on this festival’s day, any year | A talk in town |
| `farm-rank` | The Farm Rank reaches this rank | A talk or a gift in town, and every night |
| `built` | This place of the farm is built | A talk or a gift in town, and every night |
| `shipped` | This many of a good shipped, in all | A talk or a gift in town, and every night |
| `event` | Another character’s event has played (`<characterId>:<event>`; `arrival` is her meeting scene), or an event id: anyone’s | A talk or a gift in town, and every night |
<!-- /live -->

- **Met:** she joins the roster that day (`roster[id].joined`) at Friendship 0 with 0 points: **home in the Dorm** while a
  bed is free, so she can work at once; **else she lives in town** as a friend, out on her days like anyone, with her
  chats and gifts, and **Invite to the farm** on her profile moves her in at once while a bed is free. Each of her
  ties with someone met starts at its seed. Her events and evenings need her on the farm.
- **Her meeting scene** plays at once after the talk, the gift or Say hello that met her; one the night met plays the
  morning after, once the summary is put away. Several the same night meet in the cast's order, then the town's.
- **Never met:** the town's people (they keep their roles), or anyone met already. A sister (`s<outfitId>`) is met like
  anyone: the roster takes her id.
- **The morning** names one the night met in the Hearts section, "Met ‹name› · moved in" (or "· in town") with **New**,
  a tap opening her profile.
- **Everyone on the roster counts as met,** the day she joined the day you met her. The retired `arrives` of a cast
  entry (a festival, the Dorm's beds, after an event) is noted and dropped: her `meet` says when you meet her, and the
  Dorm's levels bring beds only.

#### Her meeting scene

Her meeting scene is her route's arrival scene, and plays as soon as she's met (above), after the opening and the ring
bench's scene, in the order you met them (by day, then the cast's order). The scene player shows her lines with her bust
(her portrait in the scene's own outfit, else the day's season, her face the line's emote; else the blank bust in that
outfit with the same face, or a role's disc) and `{farmer}` filled, narration, thoughts in italics, a title line ("Meeting
Stand-in 1 · Gate"), pauses, flags (wording only) and **her choice**: usually one; written with none she pays +50 alone,
and with more the first pays.

- **Each option shows its gain on the button** before the tap.
- **Skip** jumps to the choice, never past it; after the choice, to the end. So every meeting pays.
- It ends on her bust, smiling, "♥ +80" (or +60), where she lives ("She moves into the Dorm." or "No bed free: she lives in town
  for now.") and **Welcome, ‹her name›**, and the farm stays where it was.

What it pays into her Friendship 1 bar:

<!-- live:arrival-pay -->
| Her meeting scene | Points into her bar |
|---|---|
| Played or skipped to its end | +50 |
| Its choice: the option with the highest authored gain (each one tied at the top) | +30 |
| Its choice: any other option | +10 |
| Written with no choice | The game’s hello is added, so its choice pays as above |
| Written with more than one choice | The first pays; the rest are words only |
<!-- /live -->

It pays once and is stamped once (`arrivals`). A route without her arrival scene plays the default story's, its reply
worth +30 or +10: for the welcome list, at the Gate; for anyone else, in town, where you introduce yourself ("You
introduce yourself, and the time slips by."). A written one with no choice ends on the Gate's hello. Any pack can leave
one unwritten: the release notes it, and the default plays.

### Her favourite line and tastes

- **Her favourite line** is her bible's, else her calling's (a quarry calling is mining, at the Quarry), else her line
  from master data: the work her outfit's stats suit best. It is never master data's running strategy. It gives her **×1.2 rank points** in that activity, the mark on her face card, **+10 a
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

- **Her tastes** are her bible's: loved, liked and disliked goods, any number of each. Everything else is neutral, and a good
  not in the game yet counts as neutral. An Uma whose bible names no taste has the default story's: **her favourite good
  loved** (by her line: a Peach for farming, a Seashell for fishing, the full list in [what plays without the
  story](#what-plays-without-the-story)), every other good neutral. Her favourite good is what the default story's
  lines call `{good}`.
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
| Chat (tap her) | +15 | Once a day each, on the farm or in town | `chatV4` |
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
- **Chat** (tap her): +15, once a day each, on the farm or in town ("You've talked today."). Her line for the day is drawn by the
  account, the day and her id, so it's the same all day. From Friendship 1 her bible's chat set for her stage plays when
  it holds any: friend through her confession (Romance 0 included), partner from Romance 1 to the wedding, spouse after
  it. Anything else plays the default story's talks for her stage in the Uma loop and her temperament, her favourite
  good and her line's work in.
- **Gift:** one good from the Warehouse at the stars you choose, once a day each, on the farm or in town ("One gift a day."; a seed
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

A disliked gift pays 0 and never takes points away. She says one of the default story’s lines for her taste (“{name} thanks you, a little puzzled.”).
<!-- /live -->

- **The gift picker** lists the Warehouse by family, each good at each star held, with **its points for her today**
  (the birthday's ×3 and the anniversary's ×2 included), or **"?"** where her taste for it isn't known.
- **Praise:** she earns it for the day when her work that finished overnight made a ★3+ item, when she ranked up last
  night, or (once the farmhands work) when a harvest of hers today gave a ★3+ crop. Assisting a Fine-or-better workshop play is a
  cause too, but nothing pays that cause yet. **Praise +20** shows on her profile only while earned and
  unpaid, pays once, and both lists clear at night.
- **Her line:** at night, +10 to each Uma who worked today at one of her line's places. One a night each; a day
  elsewhere pays nothing. Nobody works until the farmhands come, so it pays nothing yet.
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
  Warehouse, on the farm or in town: a crop of the season for a farmer, a good of her foraging rank's deepest open area this season
  for a forager, a fish of her deepest open spot for a fisher, and a crop of the season for any line whose place isn't
  built yet, so an anniversary is never empty. The morning says so the day before and on the day.

#### Ready

Her next event is **Ready** when all five of these hold:

<!-- live:ready-rules -->
| # | Ready needs | Not met |
|---|---|---|
| 1 | Her bar is full for the rung; a waiting rung (the confession, the proposal, the wedding) is Ready the day after the rung before, and the proposal needs a ring in the Warehouse | `bar`, `day`, `ring` |
| 2 | She’s home (on the Dorm’s list, or a spouse in her house) | `away`: “Invite her to the farm” |
| 3 | She hasn’t played one of her events today | `today` |
| 4 | Its one setup is met, if it has one: she works a named activity today (a running job there, or a tended growing block for farming), a named good is in the Warehouse at any stars, her bond with a named Uma has reached a level | `setup`; `opens` for the ranch, mining, cooking, expeditions, serving or forging before their place is built (the Coop, the Mine, the Kitchen, the expedition post, the Restaurant, the Forge) |
| 5 | Her chapter is open: when her next event is the first of her chapter, the chapter’s gate holds, if it has one (a place built, a Farm Rank, a good shipped, another’s event, a season or a festival) | `gate`: “Opens when the Kitchen is built” |
<!-- /live -->

A setup is never an hour, the weather, a season or a festival; her chapter's gate may be a season or a festival (see
[her chapters](#her-chapters)). When she isn't Ready, the first of these in the way is the one shown:

<!-- live:ready-waits -->
| Order | `waits` | When |
|---|---|---|
| 1 | `done` | Her route is complete (S5 has played) |
| 2 | `night` | S2 or S4, bar full: no event, the level comes at night; short of it, `bar` |
| 3 | `friend` | She said “Not yet” at her confession: you ask her again from her profile |
| 4 | `gate` | Her next event opens her chapter, and its gate doesn’t hold yet |
| 5 | `opens` | A working setup at a place not built yet |
| 6 | `bar` | Her bar isn’t full for the rung |
| 7 | `day` | A waiting rung, on the day the rung before played |
| 8 | `ring` | The proposal, with no ring in the Warehouse |
| 9 | `away` | She lives in town |
| 10 | `today` | She played one of her events today |
| 11 | `setup` | Its day setup isn’t met today |
<!-- /live -->

- **A setup** is her bible's beat's setup for the rung; an Uma without a bible has none. A working setup ("she works
  the Fishery today") is met every day while the farmer works alone, so her event never waits on work she can't do; at
  a place not built yet it shows "Opens when the Mine is built" (her place) ahead of a short bar. A pack's beat that still names a
  chapter setup is noted and read as her bar alone: the farm has no global chapters, and a gate goes on one of [her
  chapters](#her-chapters).
- **Her bond setup** reads bond hearts (50, 150, 300, 500 and 750 points). **The proposal's ring** is any ring in the
  Warehouse.
- **Ready is read live,** never stored, since it changes by the day: her Hearts row, her profile, the morning's Ready lines
  and her pip on the map all read it as they show.

#### The People page

**People** (`/hearts`, the rail's third page) is the Umas' page: one row an Uma you've met, on the farm or in town, two to
a row where they fit, a filter row, and her profile on a tap. It has no badge. Its two views ride in the URL: Hearts (the
default) and **Work**, the roster's album with **her level in words** ("F7", "R4", "S2") in each face's corner.
`/roster` lands on the Work view.

```
┌──────────────────────────────────────────┐
│ People  Married 0/3  ☾ Evening ○     (i) │  ○ free, ● spent: a mark a slot today
│ [ Hearts ]  Work                         │
│ [Ready 1] [Friends 3] [Partners] [Married] [In town]
├──────────────────────────────────────────┤
│ (face) Stand-in 1  Ch. 1 · Getting… ● Ready │  her chapter at a glance
│        New friend ♥ ▣□□□□□□□□□  200/200  │  the ladder's hearts, the next filling
│        Ready · Friendship 1 · the Fields · +2 banked   ✓chat
├──────────────────────────────────────────┤
│ (face) Stand-in 3  Ch. 1 · Getting to…   │
│        New friend ♥ ▣□□□□□□□□□   80/200  │
│                                          │
└──────────────────────────────────────────┘
```

- **A row:** her face, her name, **her chapter at a glance** ("Ch. 2 · Together"; "Married life ✓" once her last has
  closed) and chips (**✉** while her invitation stands, unanswered or said yes and not yet spent; **In town**), and at its
  end **● Ready** in her stage's colour, which plays her event; a tap elsewhere opens her profile.
  Under it, her level in words, a filling heart, **her ladder's hearts as a bar** (ten for friendship and romance, five
  as a spouse: the levels played full, the next filling by points over its cost, the rest empty) and "points/cost". A
  waiting rung shows every heart full with its mark, **◆** her confession or **◇** the proposal and the wedding, and
  "Tomorrow" or "Ready".
- **The row's line:** Ready, her rung and where it plays ("Ready · Romance 5 · the Pond at night"); in town, "Invite her
  to the farm to play her events"; a short bar, nothing more (the bar says it); otherwise what her next event waits for ("Friendship 3
  · the Fields, when she works there", or her chapter's gate: "Friendship 7 · Opens when the Kitchen is built"); with none of these, a spouse's house ("Rose Cottage") or "Needs a room". Then "+N banked" (cut first on a narrow row), and today's **✓chat** and **✓gift**.
- **The sort:** Ready first, then the least progress (her next rung's place on the route, then her points), then the
  cast's order.
- **The filters,** one at a time, each with its count: **Ready**; **Friends** (friendship, and her confession's wait);
  **Partners** (romance, and the proposal's and the wedding's waits); **Married**; **In town**.
- **With no one met yet:** "No one yet. Say hello at the Gate, or meet someone in town."
- **The header:** "Married n/N", N everyone you've met (3 with the stand-ins); a household scene or the finale's chip while one
  is Ready ("⌂ Scene 1 ›", "⌂ Harvest ›"); and **☾ Evening** with a mark a slot today, **○** free or **●** spent, the
  evenings first and then festival night's.
- **The (i)** has six lines: how her bar fills and banks; Ready and setups; one event a day; her chapters ("A chapter
  may wait for the farm first"); gifts and tastes; and the evening ("One evening a day with someone home: a hangout from Friendship 2, a date from Romance 1. Fine +60, Great +100,
  Perfect +150, ×1.5 in her favourite kind, and +20 when she asked you.").

#### Her profile

Her profile is a side panel over the page, opened from her row, a Work card, the morning's lines, the Dorm's list and
the town.
Each part shows only what exists; nothing says "Soon". One who lives in town has, under her face, **Lives in town** and
**Invite to the farm** while a bed is free (she moves in at once), else "No bed free." and **The Dorm ›**.

```
┌──────────────────────────────────────────┐
│ Stand-in 1                             ✕ │
│ (face) New friend  ● Ready               │  the "+N" floats up from her face
│        Farming · ★ Spring 4              │  her line, birthday and house
│ [ Hearts ]  Work                         │  held at the panel's top as it scrolls
│ ▣□□□□□□□□□◇□□□□□□□□□□◇◇□□□□□             │  the route as one track
│ ┌ Next: Friendship 1 ────────────────────┐│
│ │ Perk · Her loved gift shown; her own chats
│ │ Event · The Fields, while she works them.
│ │ ████████████████████  200 / 200  +2 banked
│ │ Ready                                  ││
│ └────────────────────────────────────────┘│
│ Chapters                                 │
│  1 Getting to know her              1/12 │  the one she's in, in her ladder's colour
│    [✓ Meeting] [F1] [F2] … [Confession]  │  its events, played ✓ and to come
│  2 Together                         0/11 │
│  3 The wedding                       0/1 │
│  4 Married life                      0/3 │
│ Next · Together · After her confession   │  what opens the next (and its gate)
│ Perks   F1–F10 ✓ · R1 ✓                  │
│         F3  +10% chance of an extra crop │  what each reached perk does now
│         Next · R2 · …     All 25 perks   │
│ From her Calls you “Sprout” · Bent Trowel│  her pet name and keepsake
│ Gifts   Loved ? +60 · Liked ??? +30 · Disliked ?? 0 · Others +10
│ Ties    Stand-in 2 · Friends ♥♥ · Stand-in 3 · Rivals
│ Memories 0 of 26                         │
│ Ring    Her ring will read: ‘…’          │  from Romance 8
├──────────────────────────────────────────┤
│ [ Chat +15 ] [ Gift ] [ ☾ Evening › ]    │  48 pt, the panel's foot
│ [        Praise +20        ]             │  while she's earned it
└──────────────────────────────────────────┘
```

- **Her heading:** her face, her level in words in her stage's colour, her **● Ready** chip; under them her favourite
  line, her birthday as a farm day ("★ Spring 4") and her house once she has one. A spouse waiting for a room says "Needs
  a room", and an own-house wisher sharing or waiting says softly "She'd love her own house".
- **The route as one track:** F1–F10, ◆, R1–R10, ◇, ◇, S1–S5 (28 steps), the played ones filled in their ladder's
  colour, the next filling by her bar, the rest empty, a waiting rung drawn as a diamond. It wraps to two rows of 14 on a
  narrow phone.
- **The Next card:** "Next: Romance 5"; its perk in her line's words (with "Opens when the Mine is built" where her
  line's place waits); her beat's hint for the rung (where and how it opens); the bar with "points / cost" and "+N banked"; and what it
  waits for: "Ready", "123 to go", "Tomorrow", "Needs a ring", "Invite her to the farm" (a link to the Dorm), "Tomorrow: one event
  a day", "The Fields, when she works there", "With Carrot in the Warehouse", "Bond 3 with Stand-in 2", "Opens when the
  Mine is built", "Opens when the Kitchen is built" (her chapter's gate), "She said “Not yet”", "Comes tonight", and
  once her route is done "Her route is complete". It never waits
  on the story: an event the pack doesn't script plays the game's card.
  - **Play ›** (48 pt, in her ladder's colour) plays her Ready event.
  - **A setup not met** says what to do: "Put Carrot in the Warehouse, then come back.", "Let her and Stand-in 2 work
    side by side until bond 3."
  - **After a Not yet,** **Ask her ›**, once a day ("You asked her today. Ask again tomorrow.").
  - **While the proposal needs a ring** and the ring bench stands, **Make one at the Forge's bench ›**.
- **Chapters:** [her chapters](#her-chapters), each with its number (✓ once every event has played), its title and its
  events played of all ("3/12"). The one she's in is in her ladder's colour, with its events as chips, played ✓ and to
  come; a chapter whose gate doesn't hold yet says what it needs ("Opens when the Kitchen is built"). Under them, what
  opens the next: "Next · Kitchen days · After Friendship 6 · Opens when the Kitchen is built". Once her route is
  complete: "Her last chapter is closed. Life at home goes on."
- **Perks:** the reached ones by ladder ("F1–F10 ✓ · R1–R4 ✓"), what each reached one does now, the next, and **All 25
  perks** on a tap (reached ✓ with "Now · …", the next in bold, the rest greyed).
- **From her:** her pet name for you from Romance 1 ("Calls you “Sprout”"; without her bible's, your own name), and her
  keepsake from Friendship 10 with its effect and her line about it (without her bible's, "Her keepsake" and a plain
  line).
- **Gifts:** her loved, liked and disliked goods as learnt ("?" until then), each group's points at ★1, and "Others +10";
  with no tastes written, "Any gift +10". From Friendship 7, her closest friend's loved gift ("Stand-in 1 loves Golden Carrot").
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
  "Evening · F2" below Friendship 2, "In town", "Evening spent" with someone else), and **Praise +20** on the row
  under them while she's earned it. What an act pays floats up from her face, and a note says it ("She likes it. +36").
- **Hearts | Work:** the Work side is her work sheet: her favourite line, the day she joined, where she is, and her nine
  activities with talent, rank, points and the next challenge.

### Her chapters

Each Uma's story is hers, in her own chapters, from the day you meet her to married life. There's no farm-wide story.
Her chapters frame her route; the backbone stays as built (her arrival, friendship F1–F10 and the confession, romance
R1–R10, the proposal and the wedding, married life S1–S5), and so do the points, the perks and the evenings along it.

```
 her cast entry's `chapters` ──► her chapters along her route ──► the one she's in: the chapter holding her next rung
   (else the four defaults)       in the order of their first events      │
                                                                          ▼
 a chapter's gate (optional) ──► holds back its first event ──► Ready says "gate": "Opens when the Kitchen is built"
                                    │ the gate holds and the rung before has played
                                    ▼
                        the chapter opens ──► the morning: "A new chapter with ‹name› · Kitchen days"
                                    │ its events play as Ready allows
                                    ▼
                        Spouse 5 ──► her last chapter closes; the household goes on after it
```

- **Her chapters** are her cast entry's `chapters`: how many, their titles, which of her rungs each holds and an
  optional gate ([the story pack's menu](story-pack.md#her-chapters)). With none, the four defaults:

<!-- live:default-chapters -->
| # | Chapter | Its events |
|---|---|---|
| 1 | Getting to know her | Her meeting scene, F1–F10, her confession |
| 2 | Together | R1–R10, the proposal |
| 3 | The wedding | The wedding |
| 4 | Married life | S1, S3, S5 |
<!-- /live -->

- **Along her route:** a chapter's events are its rungs in the route's order, and her chapters run in the order of their
  first events. A rung the pack leaves out counts in the chapter before it along the route (else the first), a rung in
  two counts in the first, and a chapter holding no rung the game plays is left out. A chapter without a title shows
  as "Chapter 2". S2 and S4, which have no event, count with S1 and S3.
- **The one she's in** is the chapter holding her next rung. **A chapter opens when its first event can play:** the
  rung before it has played and its gate holds.
- **A chapter's gate** asks the farm for something, from [the trigger menu](story-pack.md#the-trigger-menu): a place
  built, a Farm Rank, a good shipped, another's event, a season or a festival (the town's kinds, talks, a gift and a
  spot, are meeting her own: a gate of one is an error, and skipped). Until it holds, the chapter's first event waits,
  whatever her bar: Ready's `gate` says it ahead of a short bar. Once that event has played the chapter is open, and its
  other events follow as Ready allows, even when a season's or a festival's day has passed. A gate on the chapter
  holding her meeting scene never holds the scene back (her `meet` says when she's met): it holds her first event.

<!-- live:chapter-gates -->
| Gate (`gate`) | Holds | Her profile says |
|---|---|---|
| `built` | This place of the farm is built: it stands the night after it’s paid for | “Opens when the Kitchen is built” |
| `farm-rank` | The Farm Rank reaches this rank, at night | “Opens at Farm Rank 4” |
| `shipped` | This many of a good shipped, in all: the bin pays at night | “Opens when you’ve shipped 50 Carrot” |
| `event` | Another character’s event has played (`<characterId>:<event>`; `arrival` is her meeting scene), or an event id: anyone’s | “Opens after Stand-in 2’s Friendship 3” |
| `season` | This season: from its first morning to its last | “Opens in Winter” |
| `festival` | This festival’s day, any year | “Opens on the Harvest Cup” |
<!-- /live -->

- **Where you see them:**
  - **her profile's Chapters:** every chapter, the one she's in with its events played and to come, a gate's words,
    and what opens the next ([her profile](#her-profile));
  - **the People page:** her chapter at a glance on her row, "Ch. 2 · Together" ([the People page](#the-people-page));
  - **the morning:** "A new chapter with ‹name› · Together", tagged **New**, the morning one opens: the morning after
    the event before it played (one event a day, so its first can't play sooner), or the morning its gate begins to
    hold. Her first chapter opens with meeting her, which the morning says as "Met ‹name›".
- **Her ending:** her last chapter closes when Spouse 5 plays, in married life. The household's scenes, the evenings and
  the house go on after it.
- **The save holds nothing new for them:** her chapter is worked out from her route and the gates as it shows. The
  morning's line keeps her id and the chapter's number; its title is read from the pack.

### Perks

A perk comes with every level, 25 in all, and every perk acts. **A perk is read from her level, never stored:** she has a
rung's perk once its event has played (S2 and S4 once they've come at night). Only her signature dish writes anything to
the save.

**While the farmer works alone,** the perks that ride on an Uma's own work (the romance term on a harvest or a haul,
side by side, her line's pay, the mentor, bonds at work) have nothing to act on, and wait for the farmhands. The night
chores, morning items, meals, her keepsake on her chores and the household's act as written.

#### The perks' words

The words are templates by her favourite line. A perk that works at her line's place says **"Opens when the Kitchen is
built"** (her place) while that place isn't built, and does nothing until then. The first table words each perk for a forager; the second
shows what the place-bound ones say for every line.

<!-- live:perk-words -->
| Level | Perk id | Words (a forager’s) | At her line’s place |
|---|---|---|---|
| F1 | `tastes-loved` | Her loved gift shown; her own chats |  |
| F2 | `hangouts` | Hangouts in the evening |  |
| F3 | `line-10` | +10% at the forest | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| F4 | `signature-dish` | Her signature dish’s recipe |  |
| F5 | `rank-105` | ×1.05 rank points |  |
| F6 | `night-chore` | One item from the forest each night | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| F7 | `tastes-all` | All her tastes shown, and her closest friend’s loved gift |  |
| F8 | `in-element` | In her element: ×1.2 at the forest beside a 3-heart friend | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| F9 | `mentor` | Mentor: +10% rank points for Umas at the forest | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| F10 | `keepsake` | Her keepsake; ×1.10 rank points |  |
| R1 | `dates` | Dates; her pet name for you |  |
| R2 | `morning-item` | A ★2+ good from the forest every 4th morning |  |
| R3 | `date-stargazing` | Date: stargazing |  |
| R4 | `closest-bond` | ×1.5 bond with her closest friend |  |
| R5 | `line-20` | +10% more at the forest (+20%) | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| R6 | `date-dance-boat` | Dates: dance and boat |  |
| R7 | `night-chore-2` | A second night chore | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| R8 | `engraving` | Her ring’s engraving |  |
| R9 | `date-footrace` | Date: footrace |  |
| R10 | `proposal` | The proposal |  |
| S1 | `breakfast` | Breakfast: the crew starts well fed on a morning in her house |  |
| S2 | `morning-item-2` | A ★3+ good from the forest every 2nd morning, and each morning in her house |  |
| S3 | `dream` | Her dream; +5% for anyone at the forest | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| S4 | `night-chore-3` | A third night chore | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| S5 | `vow-renewal` | Vow renewal; her keepsake grows |  |

| Her line | Her place | +10% (F3) | A night chore (F6) | A morning item (R2) | Opens with |
|---|---|---|---|---|---|
| Farming | the Fields | +10% at the Fields | Waters a dry tile each night | A ★2+ crop of the season | Day 1 |
| Foraging | the forest | +10% at the forest | One item from the forest each night | A ★2+ good from the forest | Day 1 |
| Fishing | the Fishery | +10% at the Fishery | One fish from the Fishery each night | A ★2+ fish | Day 1 |
| Mining (the Mine) | the Mine | +10% at the Mine | One ore from the Mine each night | A ★2+ ore | When the Mine is built |
| Mining (the Quarry) | the Quarry | +10% at the Quarry | One stone or gem from the Quarry each night | A ★2+ stone or gem | When the Quarry is built |
| Ranch | the ranch | +10% at the ranch | +5 affection to her pen each night | A ★2+ egg, milk or fleece | When the Coop is built |
| Cooking | the Kitchen | +10% at the Kitchen | One more dish on the Kitchen’s next play | A ★2+ dish | When the Kitchen is built |
| Serving | the Restaurant | +10% at the Restaurant | One more cover on the Restaurant’s next shift | A ★2+ dish | When the Restaurant is built |
| Forging | the Forge | +10% at the Forge | 5% back on the Forge’s next tool | A ★2+ Fitting | When the Forge is built |
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
| Farming | Each plot she tends: +10% chance of an extra crop at harvest, at the plot’s stars | Waters one dry growing tile (step 2) | A ★2+ crop of the season | Yes |
| Foraging | Her haul ×1.1, and her Sawmill batch ×1.1 | One item from her rank’s deepest area this season, at a day’s haul’s stars (step 4) | A ★2+ good from the forest | Yes |
| Fishing | Her catch ×1.1, and her Smokehouse batch ×1.1 | One fish from her deepest spot this season, at a day’s haul’s stars (step 4) | A ★2+ fish | Yes |
| Mining (the Mine) | Her haul ×1.1, and her Smelter batch ×1.1 | One ore from her deepest floor | A ★2+ ore (a crop of the season until its place opens) | Not yet: once the Mine’s game is built |
| Mining (the Quarry) | Her haul ×1.1, and her Cutter batch ×1.1 | One stone or gem from her deepest floor | A ★2+ stone or gem (a crop of the season until its place opens) | Not yet: once the Quarry’s game is built |
| Ranch | Her pen: +10% chance of an extra product | +5 affection to her pen (step 3) | A ★2+ egg, milk or fleece (a crop of the season until its place opens) | Not yet: once the Coop’s game is built |
| Cooking | +10% dishes as the Kitchen’s assistant | +1 dish on the Kitchen’s next play | A ★2+ dish (a crop of the season until its place opens) | Not yet: once the Kitchen’s game is built |
| Serving | +10% tips as the Restaurant’s server | +1 cover on the Restaurant’s next shift | A ★2+ dish (a crop of the season until its place opens) | Not yet: once the Restaurant’s game is built |
| Forging | +10% goods as the Forge’s assistant | +5% refund on the Forge’s next tool | A ★2+ Fitting (a crop of the season until its place opens) | Not yet: once the Forge’s game is built |
<!-- /live -->

- **Seeded:** a fraction becomes a whole item by a seeded draw on the account, the day and her id, so a night replays the
  same.
- **Gathering and stations pay at night:** the items an Uma's work finished tonight come to × (bond × (1 + romance)) in
  all. Side by side's pot pays first (×1.1, or ×1.2 in her element), then **the perks' pot**: the bond term × the romance
  term of the same items (her own bonuses only at her line's place, the crew's anywhere), as seeded copies (the same goods
  and stars) straight into the Warehouse. A forager's Sawmill batch and a fisher's Smokehouse batch count as her line.
  The job's own plan never changes.
- **Farming would pay at harvest,** an extra crop by her romance term on her own harvests; the farmer harvests alone,
  so the field's harvests get none until the farmhands work.

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
  spouse in her house) whose line's place is open. **One in town does none.** Each chore is its own seeded pick.
- **Farming** (at night, as crops grow): each chore waters one dry growing tile, a seeded pick, so it grows a stage
  tonight; with none dry, the chore does nothing. The morning says "Night chores · 2 tiles watered".
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

At night, at each place worked today (none until the farmhands work), an Uma at **Friendship 9** whose line's place it
is mentors the others who worked there: **×1.10 rank points** for the day. **One mentor a place:** the most
hearts (the furthest along her route), then the cast's order, then her id. She earns no bonus herself; a second Friendship
9 Uma there is mentored too.

#### Her keepsake

From **Friendship 10** her keepsake adds **+0.25 quality** to her work at her line's place, **+0.5 from Spouse 5** (her
vow renewal), and nowhere else. It's read by her night chores and morning items, and by her work once the farmhands
work. Its name and her line about it are her bible's (without one, "Her keepsake" and a plain line,
“Keep it close. It’s for luck.”). It shows on her
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
| Mining (the Mine) | Curry | G1 until the Mine’s game is built | Basil Curry |
| Mining (the Quarry) | Curry | G1 until the Quarry’s game is built | Basil Curry |
| Ranch | Cake | G1 until the ranch’s game is built | Honeycomb Cake |
| Cooking | Tart | G1 until the Kitchen’s game is built | Apple Tart |
| Serving | Cookies | G1 until the Restaurant’s game is built | Peanut Cookies |
| Forging | Bread | G1 until the Forge’s game is built | Wheat Bread |

Her loved good, when it’s a dish, is her signature dish as it is. The recipe joins `workshops.recipes` once (a recipe the farm knows stays once) and her route keeps its id (`love.dish`).
<!-- /live -->

#### Her dream and breakfast

- **Her dream** is her Spouse 3 event. Once it's in her Memories it acts: **+5% for anyone at her line's place,** in the
  crew's term. Two dreams at one place count once.
- **Breakfast** is a spouse's Spouse 1 perk, served on a morning in her house: every Uma on the farm with no well-fed days
  left starts the day **well fed for one day** (a Rough meal, so that day's work speeds up and earns more rank points). A
  meal already running is never shortened or extended, and a breakfast isn't a staff meal (no staff-meal count moves). Each
  pair it feeds earns +5 bond.

#### On her profile

Her profile's Perks shows what each reached perk does now, a later perk taking the earlier one's line (Romance 5's
replaces Friendship 3's): "R5 · +28% at the forest · +8% ring" (with "+5% crew" and "held to its cap" when they apply;
a farmer's "+20% chance of an extra crop"), "R7 · 2 items each night" (a farmer's "+0.5 growth each night"; "None while
she lives in town"), "R2 · Next tomorrow" or "Next in 3 mornings", "F4 · ‹dish› · in the Kitchen's list", "F8 · Beside
Stand-in 1" ("No 3-heart friend yet"), "F10 · Bent Trowel · +0.25 quality at the Fields", "R1 · She calls you
“Sprout”", "R4 · With Stand-in 1", "R8 · “‹engraving›”". A perk whose place isn't built says "Opens when the Mine is
built" (her place) and nothing now.

### Heart events and plays

#### Heart events

A level is its event. Once her next event is Ready it waits for you, for good: **nothing fires on its own.**

- **Three ways in:** her Hearts row's **● Ready**, her profile's **Play ›**, and the morning's Ready line (its **Play**
  tag). Each opens the event player over the page.
- **Her script or the game's card.** Her route's event for the rung loads on demand; a rung the pack doesn't script
  plays the game's short card (her moment, her line, your reply), which pays as a written event does. A play with no
  prompt shows its game's ("Cast the line together.").
- **Nothing is saved while it plays.** The player waits for the script and for master data. At the end one rule pays the
  event and moves her on, and the app commits it once, stamped. **An event left halfway pays nothing and
  stays Ready.**
- **One of hers a day:** after one plays she isn't Ready again until tomorrow, however full her bar.

```
┌──────────────────────────────────────────────────────────────────────┐
│ The Fields · Friendship 1                             Auto  Skip  Log │  the controls away from the taps
│ ╭────────────────────────────╮                                       │
│ │               ┌────────┐   │  ┌─────────────────────────────────┐  │  her bubble: three lines at
│ │ (the Fields'  │  her   │   │  │ Stand-in 1                      │  │  most, typed out
│ │  frame)       │portrait│   │  │ Hello, Robin. Some of these are │  │
│ │ on spring's   │ (face) │   │  │ ready. Help me pick?            │  │
│ │ ground        │        │   │  └─────────────────────────────────┘  │
│ │               │        │   │  [ Show me which ones.         +30 ]  │  48 pt choices, each with its
│ ╰───────────────┴────────┴───╯  [ Race you to the end of the row. +10 ] gain
└──────────────────────────────────────────────────────────────────────┘
```

- **The place card** fills the left, behind her bust ([the dialogue engine](#the-dialogue-engine)'s backdrop): a farm
  place's building frame on the season's ground (spring `#dcefc7`, summer `#f6e7b0`, autumn `#f2d3b0`, winter
  `#e3ebf3`), or a romance backdrop's borrowed frame and tint. A place step changes it mid-scene, and the title follows:
  "The Fields · Friendship 1", "The Pond at night · Romance 5". The speaker's bust is her portrait in the event's outfit
  (its own `outfit`, else its moment's: her wedding, her work, a picnic, the summer shore; else the day's season), her
  face the line's emote; during narration she keeps her last line's face. Without portraits, the blank bust (one of the
  town's people's too; a lettered disc for a role no one plays). A wedding's guests wear the day's season.

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

- **The emote** is her face: her portrait's, else the blank bust's ([the dialogue engine](#the-dialogue-engine)).
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
  else the Fields. The path passes today's open farm places (not the Gate or the town). Before it she says "I love
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
│ Opens: Waters a dry tile each night      │  the next rung's perk
│              [ Continue ]                │
└──────────────────────────────────────────┘
```

- **The sum:** "+50 event", the choices ("+30 choice", "+40 choices"), each play's grade ("+15 Great") or, with no play,
  the best choice's grade; then "= +N toward ‹next rung›", "(×2 anniversary)" on her anniversary, and "(+N banked)". After
  a Not yet it reads "= +N, banked for Romance 1".
- **The rest:** the perk, the Memory, any unlock, the recipe (Friendship 4), the ring (the proposal: "Iron Ring · hers
  now"), the wedding ("The Fields · the town’s bakery sends a cake · everyone well fed 1 day"), and the next rung with its
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
│ 4 actions left · 2 dry                   │
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
   │                                              the morning: the smith's scene, "The Ring Bench" (once)
   ▼
 the Forge's quick look ──► the bench: 3 refined goods of grade g ──► a grade-g ring ★1 in the Warehouse (one a day)
   │
 Romance 10 played ──the next day, a ring held──► the proposal: which ring? ──► played, always yes ──► Engaged
   │                                              the ring leaves the Warehouse; its grade is hers
   ▼
 the next day, or any day after ──► the wedding: where? (her three) ──► played there, guests and vows
   │                                  ──► the reception (a dish, or the bakery's cake) ──► Married: a spouse at S0
   ▼
 her room at once · that night everyone on the farm is well fed from tomorrow · her ring +1% a grade at her line
```

#### The ring bench

The bench's rule, in full:

<!-- live:bench-recipe -->
|  | The ring bench |
|---|---|
| Opens | The night after the first Romance 8 event anyone plays: `buildings.forge = 0`, and the smith’s scene the next morning |
| A ring of grade g | 3 refined goods of grade g, any family, any mix; the mining families’ (ingots, blocks, cut gems) once the Smelter and the Cutter stand |
| Cost | The goods only: no gold, no game, no assistant, no score |
| Out | The ring, ★1 (a Rough make), into the Warehouse |
| How often | One ring a day (`today.ring`) |
| Her bonus once married | +1% at her line a grade, inside her own +35%; the Forge’s merge game (not built yet) adds +1, +3 or +5 for a Fine, Great or Masterwork make |
| Refusals | “The ring bench opens with your first Romance 8.” · “Three refined goods of one grade.” · “Ingots, blocks and cut gems open when the Smelter and the Cutter are built.” · “One ring a day.” · “Not enough in the Warehouse.” |
<!-- /live -->

- **On the map:** until the bench stands the Forge's lock says "Opens with your first Romance 8". Then its quick look
  reads **Ring bench · one ring a day** with **Make a ring ›** ("See the bench ›" once today's is made).
- **The smith's scene:** the morning after, once the summary is put away (after the opening, before the meeting scenes), seven
  short lines and a card with **See the bench** or **Later**; read once.
- **The bench's sheet:** the smith's face and name (the Uma who plays the role) and the rule; one row a grade you can make now, lowest first, each with **the
  three goods it would take** (the lowest-value refined goods of that grade, fewer stars first, any family, any mix),
  "→ Iron Ring" and "+3% once married". A tap on one of the three lists the grade's other goods held and swaps it in; a
  tap on a row chooses it. The Forge's own recipe shows greyed, "2 ingots + 1 cut gem · Opens when the Smelter and the Cutter are built"; then "Her bonus
  once married: +1% a grade", and **Make an Iron Ring · 1 a day**. Made, the ring is "in the Warehouse, ★1", and the foot
  says "One ring a day. Iron Ring made today ✓" until tomorrow. With nothing to make: "Nothing to make yet. Three refined
  goods of one grade make a ring: planks from the Sawmill, fillets from the Smokehouse, flour from the Mill."

#### The rings

The ten rings, one a grade:

<!-- live:rings -->
| Grade | Ring | Id | ★1 | ★5 | Her bonus once married | Cheapest at the bench | Its own recipe (once the Smelter and the Cutter stand) |
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
  the town's bakery send a cake. The dish is used. What it feeds:

<!-- live:reception -->
| The reception | Well fed from tomorrow, everyone on the farm |
|---|---|
| A ★1 dish | 1 day |
| A ★2 dish | 1 day |
| A ★3 dish | 2 days |
| A ★4 dish | 2 days |
| A ★5 dish | 3 days |
| No dish in the Warehouse: the town’s bakery sends a cake | 1 day (a Rough meal) |

A meal already running is never shortened. **The guests:** every spouse on the farm, then her 2 closest friends on the farm (by bond); they have no lines. **The places:** her bible’s `wedding.places`, else her wedding beat’s place and `chapel-bell`, `fields`, `overlook`, `orchard-bench`, three different. **Household milestones** at 5, 10, 15, 20 married.
<!-- /live -->

- **She becomes your spouse** at Spouse 0, her wedding day noted (her anniversaries follow a year on), and takes **her
  room** at once (see Rooms and moves, below). That night everyone on the farm is well fed from tomorrow; two weddings
  in one day feed the farm by the longer reception.
- **The words** of the bench, the proposal and the wedding say spouse, partner, vows, your wedding and you; the
  protagonist is a man, so a line may say the groom.
- **The wedding night** follows the wedding's card, before the Married stage-up: her route's `wedding-night`, else the
  default story's, in the wedding night outfit, tender and fading to morning. It pays nothing and saves nothing.

#### The homestead

Behind the yard the map grows the homestead: **the Farmhouse,** your own home with two rooms, from day 1, and **six
houses** you build, name and extend.

<!-- live:houses -->
|  | Rooms | Build | Extend | Opens |
|---|---|---|---|---|
| The Farmhouse | 2 (your own home) | — | — | Day 1 |
| House 1 | 2, or 4 extended | 8,000g | 4,000g | The first wedding |
| House 2 | 2, or 4 extended | 20,000g | 10,000g | The second wedding, House 1 built |
| House 3 | 2, or 4 extended | 40,000g | 20,000g | The third wedding, House 2 built |
| House 4 | 2, or 4 extended | 70,000g | 35,000g | The fourth wedding, House 3 built |
| House 5 | 2, or 4 extended | 110,000g | 55,000g | The fifth wedding, House 4 built |
| House 6 | 2, or 4 extended | 160,000g | 80,000g | The sixth wedding, House 5 built |
| **All** | **26 rooms** | **408,000g** | **612,000g extended** |  |
<!-- /live -->

- **House *n* opens to build with the *n*-th wedding,** the one before it standing (they're built in turn). A house **stands at
  once** when bought, named there: 1–20 characters under the farmer's letters rule, a grey "Rose Cottage" placeholder, no
  two alike. **An extension** adds two rooms at once for half the house's price. The Farmhouse is never renamed or
  extended.
- **Never a gate:** a wedding never waits for a room.
- **On the map:** the homestead's rows sit after the yard and before the town edge and the Town, which stay the map's
  last rows. A
  row shows once it's open, its lots with it: the first (the Farmhouse, Houses 1 and 2) from day 1, the second (Houses
  3–5) with three married, the third (House 6) with six; a house built shows whatever its row. A house's pips are its
  residents' faces (♥ on a Ready one) and its free rooms' dots; a tap opens the homestead's sheet at that house. The
  next lot shows the cottage dimmed and locked, "Build · 8,000g" once its wedding has come; a lot before its wedding
  says so ("Opens with your second wedding").

The homestead's rows on the map:

<!-- live:homestead-map -->
| Row | Places | Shows from |
|---|---|---|
| 8 | Farmhouse (`farmhouse`) · House 1 (`homestead-house`) · House 2 (`homestead-house`) | Day 1 |
| 9 | House 3 (`homestead-house`) · House 4 (`homestead-house`) · House 5 (`homestead-house`) | 3 married |
| 10 | House 6 (`homestead-house`) | 6 married |
| After the last shown | The town edge: Shop · Festival ground · Expedition post | Day 1 |
| Then | The Town, in the middle: Town | Day 1 |
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
│ ⌂ Lots 3–6 · one a wedding, in turn      │
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
  **in wedding order,** by the same default, and the morning says so ("⌂ Stand-in 2 moved into Rose Cottage"). One who
  lives in town waits until she's home. You can also move her into a free room by hand at once.
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
  and the Hearts header show them, and they play over any page: the opening, each spouse's beat in **wedding order**,
  then the close, the pack's where written and the game's short card where not (a line, her one line, a line). Every
  spouse wears the scene's own `outfit`, else the dinner dress (the finale: the kimono). A choice in them is wording
  only. They **pay nothing,** are read once, and the Diary's Memories shelf replays them. Every scene
  is offered, written or not.
- **The finale, the Great Harvest,** is Ready the morning after the wedding that makes **20 married,** once: its opening
  at the festival ground, its dance (a play whose grade pays nothing; without the pack's, "Dance with everyone under the
  lanterns."), each spouse's beat, its close, and then **the game's last stage-up card,** "The Great Harvest", with every spouse's face. **The game goes on.**
- **The Festival of Vows** falls each later year on the finale's day: every spouse **+50** that morning (a Hearts line,
  "♥ The Festival of Vows · 20 spouses · ♥ +1000 · festival night tonight") and a **festival night** that evening, in its
  own slot.

#### Bonds and ties

Each pair of Umas on the farm holds **bond points**, whole, that **never fall.** They grow when two share a place, five
**bond hearts** come at fixed thresholds, the authored ties **seed** them, and each new heart opens the pair's
**conversation**. While the farmer works alone, bonds grow from the ties' seeds and shared houses only: work together
waits for the farmhands.

```
 Stand-in 2 joins Stand-in 1 ──► their tie seeds: Stand-in 1 & 2 at 150 (♥♥); Stand-in 3 joins: 1 & 3 at 50 (♥)
   │                                the next morning: "♥♥ Stand-in 1 & Stand-in 2 · bond 2 · Read"
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
lowers a bond). An Uma whose tie you haven't met has no bond with her yet.

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
| A work place (gathering, a station) | +10% of her night’s items | Night step 4 (`nightExtras`): copies of the items her work finished tonight, the same goods and stars, `share × n` whole and one more by `draw(uid, day, 'bond:<id>', 0)`, each picked by `draw(…, k)`; into the Warehouse. Her partner worked the same place today. None until the farmhands work |
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

- **Each new heart opens one conversation,** a tie's pair's at that level: the pack's pair file where it writes the
  level, else the game's card, two short lines, one each. The stand-in's first two Umas have all five written; her farmer
  and fisher, and her forager and fisher, play the cards.
- **A pair with no tie** has no conversation: the heart's line is "‹a› and ‹b› are closer now", with no scene.
- **Read** plays the pair's opened and unread levels in turn in the scene player ("Stand-in 1 & Stand-in 2 · Bond 1
  (1/2) · Fields"), each line a tap, the speaker's bust (both in the level's own `outfit`, else the day's season; her face
  the line's emote). A choice is wording only. The end, or **Skip**, marks every level
  read, once. **It pays nothing.** A replay from the Diary marks nothing new.
- **The morning** lists the bond hearts reached since the last morning, one line a pair at its highest heart, in the
  cast's order: "♥♥ Stand-in 1 & Stand-in 2 · bond 2" with **Read** while a conversation up to that heart waits (a seed
  from 0 to 2 plays bonds 1 and 2), the heart alone once read, or the generic words for a pair with no tie.
- **The Diary's Conversations** lists every pair with a heart (the most hearts first), its conversations read as **Bond
  n** replays and **♥♥ Read** for the unread.

#### The romance at night

Every step of the night, the romance's among them, is in [the calendar and the day](#the-night-step-by-step). An
authored arrival joins with her ties seeded, and the night clears the whole of the day's romance record.

**The morning's Hearts section** comes after Ranks. Each line is a tap to her profile (or where it says), in this order:

| Order | Lines |
|---|---|
| 1 | **Ready**, read live: up to three in the People page's order ("● Ready · Stand-in 1 · Friendship 1 · the Fields", with **Play**), then "+2 more" (People filtered on Ready); then the household's Ready offers ("⌂ Household scene 1 · Ready", with **Play**) |
| 2 | This morning's invitations, with **Yes, tonight** and **Another day** |
| 3 | The house's morning ("⌂ Farmhouse · Stand-in 1 · ♥ +30 · ☕ 3 fed · +1 item") with its house line under it; a spouse who moved into a room; "‹house› misses you" with **Tonight ›** and **Another night**; morning items ("♥ Stand-in 2 left you ★3 Shiitake"); the night's chores |
| 4 | Birthdays and anniversaries, today's before tomorrow's, birthdays first ("★ Stand-in 1's birthday today", "♥ Stand-in 1's anniversary · ★5 Carrot left for you"); the Festival of Vows |
| 5 | Levels reached overnight ("♥ Stand-in 1 · Spouse 2, reached overnight", **New**, opening her card); those the night met ("Met ‹name› · in town", **New**) |
| 6 | The perks' extras ("Perks · +2 items"), then side by side ("Side by side · +3 items"), then each pair's bond hearts |

Within a place the night's order holds, each Uma in the cast's order. The section shows whenever a stored line or a Ready
Uma is there. **There's no pop-up per event:** the morning, her ● Ready chip and **♥ on her pip** wherever the map draws
her are the romance's only signals, and pips stay their places' taps. The household milestones are news in the morning's
section after it.

## Part 4 — The save

### The save, as a player meets it

#### One save, on the phone first

- **One save per player:** the signed-in Google account's farm, one copy on the phone and one on the server.
- **Every change is saved on the phone at once.** Play never waits on the network once the phone holds a save.
- **A sync follows** 1.5 seconds after the last change, when the app comes back to the foreground, when the network
  returns, and as the app opens.
- **Opening the app:** splash, then Google sign-in, then the farm. The app opens the phone's save for this account; with
  none, the server's; with none there either, a new farm on day 1. A save from before v5 stops at the start-over card
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
- a save it can't read (a bad shape, unknown keys, or a version other than v5: an old build's older save);
- a save belonging to another account;
- a save of an older version than the one it holds.

Each refused upload is kept on the server as a rescue copy (the newest one), so play that couldn't be uploaded isn't
lost; nothing restores it automatically. The phone keeps its changes, and Account says "Sync paused".

#### What the app says

| State | Account's "Save" row | The bar's sync chip |
|---|---|---|
| Syncing | Syncing… | — |
| Offline | Offline · saved on this phone | Offline |
| A sync failed, changes waiting | Sync paused · saved on this phone | Sync paused |
| A sync failed, nothing waiting | Sync paused | Sync paused |
| Changes waiting for the next sync | Saved on this phone | — |
| The server holds everything | Synced | — |
| Never synced | Not synced yet | — |

- Account also shows **Last synced**, the build, master data's release and the story's (**Story**: "Release 4, 14 Nov
  2026", or "No story yet"). Account scrolls, its panels two to a row where they fit. The chip opens Account.
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
- A copy this build can't play does nothing on Restore. A copy older than v5 shows **Kept** instead of Restore, since
  restoring it would only start a new farm again.

#### The update prompt

The app keeps itself on the phone. A new build downloads in the background and waits: a card at the top says **Update
ready**, "Restart to use the new build.", with a **Restart** button. Nothing reloads until Restart is tapped. The card
sits outside the opening screens, so it shows even when the app stopped while opening.

#### Save versions

| Version | What it is | What a player meets |
|---|---|---|
| v5 | The farm: the one save, its field a grid of tiles and its day a budget of actions | Every new farm starts on it, and the app plays and writes it |
| v4 | The farm of blocks and Umas' jobs, before the day of actions | **The start-over card,** then a new farm on v5 |
| v1, v2, v3 | Older formats, from before the farm started over the first time | **The start-over card,** then a new farm on v5 |
| Newer than v5 | — | Refused: this build doesn't read it |

- **Why a new version, not a v4 change.** The field's blocks became tiles, the work board's jobs and the stations'
  multi-day jobs became the day's actions and a station's one load, and `today` counts the actions: a played v4 can't
  be read as a tile farm. A new version lets the rules that already guard an older save do the work: the start-over
  card, the safety copy, the server's backup, and an older build refusing a v5 rather than misreading it.
- **The start-over card.** When the phone's save, or on a new phone the server's, is older than v5, the opening stops at
  one card: **"Your farm starts over"**, "This version of the game begins a new farm on day 1.", and **Start the new
  farm**. Nothing changes until the button is tapped.
- **The new farm** is day 1 on v5: 500g, 9 Carrot seeds, the field overgrown but for its cleared patch of nine, no
  station loads, ten actions, the Dorm at level 1, the Farmhouse, nobody on the roster and the farmer's name empty.
  Only the account carries over, its "last changed" time with it, so the farmer's name is the new farm's first change.
  Then the opening runs as on any new farm.
- **v5 reads what v4 grew into:** a save with no `diary.notes` loads with no Town notes unlocked, a morning's "New story
  arrived" line is only on a morning after a new release, her chapter is read from her route, and the save takes
  festival night on any day (once at most) and a festival's news by any festival's id, since the story says which days
  hold one.
- **Nothing goes silently:** a phone save with unsynced play is kept first as a "Before the new farm" safety copy (if it
  can't be kept, nothing changes and the card says so, with the button to try again). The new farm syncs up as it is,
  and the first time the server stores a v5 over the older save it copies the older one, whole, to a backup
  (`saveBackups/{uid}-v4` for a v4). The server never writes into a save.
- **An older save met later** (the server's in a sync, or in a conflict) becomes the same new farm and uploads.

#### A newer save on an older build

A save newer than v5 comes only from a newer build. When this one meets it:
- **As it opens** (the phone's save, or on a new phone the server's): the opening screen says **"This save is from a
  newer version of the farm."** with Try again, and the app asks for the new build at once, so the update prompt comes
  up; Restart brings a build that can play it.
- **On the server, at a sync:** the sync stops before any upload ("Sync paused"), so nothing writes over the newer save.
- **An upload of an older version the server receives anyway** is refused and kept as a rescue copy.

A save the app can't read at all on the phone is kept as a "Couldn't be read" safety copy, and the app opens the server's
save instead.
