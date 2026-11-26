# Game mechanics

How uma-farm works today, as the code runs it. This is the one description of the game: every rule change updates it in
the same commit, and where it and the code ever differ, the code wins and this document is fixed. The page view is
[game-mechanics.html](pages/game-mechanics.html); where the game is going is in [the roadmap](roadmap.md).

**What's live and what isn't.** The deployed game is one game on **save v6**: a day of ten actions on a tile farm the
farmer works by hand, the ranch's animals and the Mine's and the Quarry's floors (see [the ranch](#the-ranch) and
[the Mine and the Quarry](#the-mine-and-the-quarry)), and the **farmhands** who work it with him on the morning shift on the tasks he
sets (see [Farmhands](#farmhands)), its places, the farm growing by building, food (everyone eats, from the first
night: see [Food](#food)), cooking at the stove and the Kitchen (see [The Kitchen](#the-kitchen)), upkeep and the mayor's
office's loans, the calendar
with its special days and occasion scenes, and the **romance** (Part 3), played from the story
pack, and played whole without one: wherever the pack is silent, the default story plays, and every Uma without
portraits plays on the blank bust (see [What plays without the story](#what-plays-without-the-story)). The game is
laid out **sideways**, for a phone held in landscape (see [the frame](#the-frame-landscape)). **The farm is kept.**
The phone brings an existing v5 farm into v6 with its progress and current date intact. Only a save
from before v5 still meets the start-over card (see [Save versions](#save-versions)).

**The tables are generated.** Every table between `<!-- live:… -->` markers is written from the rules by
`packages/domain/src/docs/render.ts`. A test fails when one is stale, and `pnpm docs:update` rewrites them. Edit the
prose here; change a table by changing the rule.

**Contents**

- **[Part 1 — The farm's days and work](#part-1--the-farms-days-and-work)**
  - [The calendar and the day](#the-calendar-and-the-day)
  - [The farm map and the bars](#the-farm-map-and-the-bars)
  - [The field](#the-field)
  - [Gathering](#gathering)
  - [The ranch](#the-ranch)
  - [The Mine and the Quarry](#the-mine-and-the-quarry)
  - [The stations](#the-stations)
  - [Goods and gold](#goods-and-gold)
  - [Upkeep and loans](#upkeep-and-loans)
  - [Food](#food)
  - [The Kitchen](#the-kitchen)
- **[Part 2 — The Umas and the farm's progress](#part-2--the-umas-and-the-farms-progress)**
  - [The roster](#the-roster)
  - [The town](#the-town)
  - [Farmhands](#farmhands)
  - [Talents and ranks](#talents-and-ranks)
  - [The farm's progress](#the-farms-progress)
- **[Part 3 — Hearts: the cast and the romance](#part-3--hearts-the-cast-and-the-romance)**
  - [The dialogue engine](#the-dialogue-engine)
  - [The cast and the story pack](#the-cast-and-the-story-pack)
  - [What plays without the story](#what-plays-without-the-story)
  - [The opening, the farmer's name, and meeting her](#the-opening-the-farmers-name-and-meeting-her)
  - [Her favourite line and tastes](#her-favourite-line-and-tastes)
  - [The Uma loop](#the-uma-loop)
  - [Her route](#her-route)
  - [Perks](#perks)
  - [Heart events and plays](#heart-events-and-plays)
  - [The evening](#the-evening)
  - [The ring, the wedding, and married life](#the-ring-the-wedding-and-married-life)
  - [Scene links](#scene-links)
- **[Part 4 — The save](#part-4--the-save)**
  - [The save, as a player meets it](#the-save-as-a-player-meets-it)

## Part 1 — The farm's days and work

A farm day gives the farmer **five Morning actions and five Afternoon actions**. Manual chores keep their usual
costs. Travel and browsing are free. Hangouts and dates still take two actions and use the existing outing slots.
Festival and birthday bonuses count separately.

The **crew shift** runs after the fifth regular action, using each Uma’s town rota, orders, aptitudes, food,
reservations and expedition schedule. **Start afternoon** on the Work
board passes the unused Morning actions and runs the shift. The crew’s produce and gathered goods are ready in the
Warehouse that afternoon. Loads finish and crops grow at night.

Regular outings happen in two daytime slots. At Friendship 3, hang out over a Morning walk, breakfast, tea by the pond,
flowers, a sunrise sketch or a bakery stop. At Romance 1 these outings become dates. Each costs two actions in its own
half-day and the Morning slot is shared across the roster. The Afternoon uses the existing outing allowance.

Each profession’s early-week worker works mornings in town and the late-week worker works afternoons. The other half
is free for outings. Both halves are free on the profession’s off day. An Uma assigned to the farm that day is busy in
both halves, including after her Morning crew work settles. Marriage keeps her shifts. The Relationship page and profile
show her regular week. You can Chat with a met Uma during work hours if you have an action and she is in the valley.
Special scenes keep their own requirements and bonus actions.

**Start night** opens the existing five shared spouse visits. It passes unused daytime actions and runs the crew shift
if needed. Night visits unlock after marriage. The fifth visit can still lead to a stay and an extra Greater Love point the next morning. If the farmer
ends the day early, the crew shift runs before the bin pays. A save already mid-day when this feature arrives finishes
that date with the old timing and switches at the next dawn.

At night the bin pays, the farm eats and covers its bills, watered crops grow a stage, fed animals leave their goods,
the stations’ loads finish, and the date turns. The morning card reports the crew’s work, rank and bond credit.
```
 the day: 10 actions, one a tap                    End the day ──► the night, in order
   clear · till · plant · water · harvest   a tile               1 the bin pays
   cut grass for the silo           a weeds tile                 2 crew report, the bills, and crop growth
   forage · chop                    the woods' edge              3 animals: the fed leave their goods
   fish                             the pond's edge              4 the stations' loads finish
   feed · care · collect            the Coop, the Barn           5 workshops (none open)
   work a face (the stairs free)    the Mine, the Quarry         6 ranks and bonds (the farmhands')
   start a load                     a station                    7 crops wither; the date turns
   ship a crate                     the bin                      8 places built, the goals, the Farm Rank
   go into town                     the road (the shops, the town)
   free: building, the stairs, walking the town, Tonight
 the morning: the summary card ◄──────────────────────────────── 9 the morning summary
   the bin · work done · hearts · new today · today
   [Start the day] ──► the next day, ten actions again
```

### The calendar and the day

#### Seasons, days and the year

Four 30-day seasons make a 120-day year. A fresh farm begins on Spring 1, Year 1. Season and year always
come from the displayed date. Work shifts, crop growth, meals, loan installments, and expedition returns count
actual farm turns. A v5 farm keeps the day of its upgrade and the dates of earlier records. Dates added to a
season already over appear as inactive cells in the calendar.

The season sets:
- **what you can plant** and which seeds the shop sells (the field);
- **what the woods' edge and the pond's edge bring home** (Gathering);
- **which goods are in demand** at the bin (Goods and gold);
- **what withers**: on a season's last night, growing crops that don't grow in the next season wither.

The year's seasons, with their days in year 1 and their festivals:

<!-- live:calendar -->
| Season | Days (year 1) | Festival |
|---|---|---|
| Spring | 1–30 | Flower Show, Spring 19 (day 19) |
| Summer | 31–60 | Fishing Derby, Summer 21 (day 51) |
| Autumn | 61–90 | Cooking Contest, Autumn 22 (day 82) |
| Winter | 91–120 | Animal Show, Winter 12 (day 102); Harvest Cup, Winter 28 (day 118) |
<!-- /live -->

- **The date chip** in the bar shows the season's mark and the date ("Spring 3"); without the mark it draws a dot in
  the season's colour (Spring green, Summer gold, Autumn orange, Winter blue). Its spoken name is the whole date and the
  next festival: "Calendar: Spring 3, year 1 · Flower Show in 16 days". A tap opens the calendar.
- **The calendar** is a screen of its own: the year at a glance, each day with what it holds and the faces of the Umas
  who have an event on it ([the calendar screen](#the-calendar-screen)).
- **The next festival** is the first one on or after today, running on into the next year: on Spring 19 it’s the Flower
  Show. On Spring 20, the Fishing Derby is 31 days away on Summer 21.
- **New Year's** is each year's Spring 1. From the second year it's a special day: three actions for events, and her
  New Year's scene with each Uma you've met. Year 1's is the farm's first morning, and nothing more.

#### Festivals

The year holds one contest in Spring, Summer, and Autumn and two in Winter. A festival
is a special day: the calendar marks it, the morning says "Flower Show tomorrow" the day before and "Flower Show today ·
+3 for events" on the day, it gives three actions for events, and its day and its night play their occasion scenes
with each Uma you've met who has them ([occasion scenes](#occasion-scenes)).

- **The Cooking Contest is played** (Autumn 22, or wherever the story puts it): at the Kitchen, **Enter the Cooking
  Contest · 3** spends the day's three event actions on one dish cooked live at the stove; the town's cook judges it
  against the two rival farms, and the places pay gold and Farm Rank points ([the Cooking
  Contest](#the-cooking-contest)). Its morning lines, "Cooking Contest tomorrow" and "Cooking Contest today · +3 for
  events", open the Kitchen.
- **The Festival ground** opens from the map, the Calendar and the morning's festival notice. Prepare entries
  there for the Flower Show, Fishing Derby, Animal Show and Harvest Cup. The entry opens on the festival's
  resolved day. [Festival contests](#festival-contests) covers preparation, results and farmhand credit.

**The story's festivals.** The pack's `world.json` may rename, move or add festivals ([the world in the
pack](#the-world-in-the-pack)); the year is then the story's everywhere: the calendar, the date chip, the morning,
festival night, and `festival` triggers and gates.
- **One of the game's five keeps its game rule under the story's name, wherever it falls:** its festival night, its news,
  the triggers and gates naming it, its contest and any linked rank challenge. A move shifts all of them to the new day
  every year.
- **One of the story's own** is a festival day and nothing more: marked, said, its night, and its triggers.
- **One festival a day:** a move onto a day another holds is skipped, and that festival keeps the game's day.

A festival day opens a festival night. After the household holds the Greater Festival, the Festival of Vows
returns on its scheduled date each year.

##### Festival agenda

Open **Festivals & occasions** from Start Day, a marked Calendar date, the map, the Bell Keeper, or Town Requests.
**Today** shows venue, host, free attendance, entry requirements, and personal scenes. **Coming up** lists dates and
lets you pin one contest. **Results** keeps season-by-season scores, ribbons, rival scores, prizes, exhibit value,
and eligible Uma credit. Older result records keep their original date and score. Visit free records attendance
once on the event date. You can visit even when you cannot enter.

A ranked date has three actions for its own contest and one action for a social scene. Birthdays each supply their
own Uma's action and New Year's has its own pool. A suitable scene or birthday gift uses its own action first.
The first birthday scene or gift that year can add up to 25 relationship points on top of any regular gift points.
The day's normal ten actions and five Night Visits keep their own limits. A day already in progress on the old
version keeps its old shared event pool until night.

A pinned plan appears in What Next, Requests, and the Work Calendar. Use **Protect these lots** to set aside exact
grade and star quantities. Protected goods leave available Warehouse stock and return when the plan is released,
the entry opens and is submitted, or the date passes. The contest uses only the stock it consumes. The Flower Show's
marked-crop box keeps its separate tending evidence. On an imminent Animal Show, Derby, or Harvest Cup, the automatic
crew can favor useful spare jobs. Assigning a caster, handler, presenter, or cook stays voluntary. The entry and Work
Calendar can preview which jobs lose actions before you confirm.

##### Festival contests

Each entry costs three actions. The game uses its reserved contest actions first, then regular actions if needed. The Festival ground shows what the
farm can enter, the two rival scores and the latest result. The Farm Rank from the morning's settlement fixes
the rival scores and prize when the entry starts. A tie goes to the player.

| Contest | Default day | First rival score at Farm Rank R | Base first prize |
|---|---|---|---:|
| Flower Show | Spring 19 | The orchard · min(88, 36 + 5 × (R − 1)) | 500g |
| Fishing Derby | Summer 21 | The river team · min(82, 34 + 5 × (R − 1)) | 700g |
| Animal Show | Winter 12 | The ranch · min(88, 42 + 5 × (R − 1)) | 900g |
| Harvest Cup | Winter 28 | The valley growers · min(88, 30 + 6 × (R − 1)) | 1,200g |

The second rival scores ten points fewer. First prize scales by `(1 + 0.06 × (R − 1)) × min(2, 1 + 0.15 × (year − 1))`
and rounds to 5g. Second and third pay half and one fifth, rounded to 5g. A judged entry pays immediately
and records its place, score and Diary best. Farm Rank counts 150, 75 or 25 points overnight. Each rule allows
one attempt per year. Derby and Animal Show save each turn. End day judges the work completed so far.
An entry with no landed fish or correct cue has no placement, payout or Diary score.

- **Flower Show.** Donate one exact grade and star lot of raw crop or orchard fruit from the Warehouse or the
  display box. During the ten days through the show, mark one tilled tile and the crop to exhibit. Planting,
  watering that advances growth, and harvesting on that tile earn one tending date each per day. The first real
  harvest of that cycle reserves its best single unit in the box, highest stars first, then grade. The box returns
  to stock on cancellation or when its show closes unused. Score `10 × stars + 2 × grade + 6 × min(5, tending dates)`.
  Name any one Uma who took part in those dated actions to give her the Farming Legend challenge on first place,
  even if she's away. Only the crop in the box carries that work history.
- **Fishing Derby.** Pick one reachable spot and assign its three casts to the farmer and up to two distinct farmhands.
  The current season, Rod, fishing mode and each caster's skills supply the ordinary fishing terms.
  The farmer reels in on the timing ring within four seconds. An Uma takes her cast using her aptitude and rank.
  Each catch scores `40 × size percentile + 8 × stars + 0.20 × timing`, rounded. Average and round the two best
  cast scores, with a missing catch scoring zero. Actual catches enter the Warehouse at settlement with their
  graded IDs and stars, update length records and advance discoveries. Participating Umas get Fishing practice.
  A first-place team gives Fishing Legend credit to each Uma who landed an official catch.
- **Animal Show.** Pick a specific working Coop or Barn animal. Score `3 × hearts + 10 if fed today + 5 × min(4, care dates)
  + 10 × correct cues`. Care dates are successful care on that animal today and in the preceding six days. Name a
  caretaker with at least two of its dates to give her Ranch Legend credit on first place. An available caretaker can
  also act as handler and answer the first cue, or the first two from Animal care 6. Choose Stand, Walk or Brush for
  the remaining cues. Her care practice comes from handling. The animal stays on the farm.
- **Harvest Cup.** Donate three held exact lots from distinct categories. Each scores `4 × stars + grade`. The
  categories are Field (raw plantable crops and orchard fruit), Ranch (raw animal products), Fish (raw fish),
  Wild (remaining edible forage), Workshop (edible station output) and Kitchen (finished dishes). The Kitchen
  exhibit uses its recipe grade, or its Restaurant stage. A presenter adds three points when she did successful
  work in that category on one of the last three completed days. That means harvesting, ranch work, landing a fish,
  bringing home edible forage, starting an edible station load, or cooking a batch or assisting a stove dish,
  respectively. Each Uma presents one category. Reserved expedition dishes stay unavailable.

Booking a caster, handler or presenter commits one of her work actions for that day. The scheduler checks town
days and current Kitchen, Restaurant and expedition bookings. A contestant who performs her role on a judged
entry earns +50 hearts once per contest per year. Naming a grower or caretaker for the Legend challenge is free.

###### Festival year playthroughs

The solo run started on Spring 1 of Year 1, built its own Coop and raised the chicken it showed. The staffed
runs started in Year 2 with established workers, a Coop and a Mill. Each farm played 120 days and produced its
own entries. Each contest result shows place, score, and gold. The staffed runs each assigned six Uma contest actions and
verified that contribution credit followed the dated work and the judges’ results.

| Farm | Farm Ranks at entry | Flower Show | Fishing Derby | Animal Show | Harvest Cup | Uma work actions / contest bookings |
|---|---|---|---|---|---|---:|
| First-year solo | 1, 1, 3, 3 | 3rd · 18 · 100g | 1st · 41 · 700g | 1st · 100 · 1,010g | 2nd · 33 · 675g | 0 / 0 |
| 10 Umas | 3, 4, 5, 6 | 1st · 60 · 645g | 1st · 82 · 950g | 1st · 100 · 1,285g | 1st · 70 · 1,795g | 3,191 / 6 |
| 20 Umas | 6, 6, 7, 7 | 1st · 66 · 750g | 1st · 77 · 1,045g | 1st · 100 · 1,410g | 1st · 85 · 1,875g | 6,392 / 6 |
| 50 Umas | 10, 10, 10, 10 | 3rd · 66 · 175g | 3rd · 64 · 250g | 1st · 100 · 1,595g | 3rd · 70 · 425g | 15,991 / 6 |

The 20-Uma Cup included flour and a presenter who worked the Mill. The 10- and 50-Uma runs used Ranch, Wild
and Fish entries with a recent farm shift for each presenter. The solo run boxed a carrot that was already
growing, so it had fewer dated care points for its Flower Show. The staffed runs each used 41 routine farmer
actions, plus the contest actions.

#### The calendar screen

For an owner-requested restart of the first Spring, the date can return to Spring 1, Year 1 while the farm keeps
completed turns, today's spent actions, earned progress, and running countdowns.

The bar's date opens the calendar over the whole screen; looking is free, and Close (or Back) returns to the page under
it. The days are read live from the save as it stands and the story's year, never stored.

```
┌───────────────────────────────────────────────────────────────────────┐
│ Spring 3 · Year 1    [Spring] Summer  Autumn  Winter      7 actions × │
│ Spring · Year 1                 Today   │ Spring 10 · in 7 days      │
│   1     2    [3]    4     5     6        │ Birthday                  │
│   7     8     9   [10 ♥] 11    12        │ (face) Uma · Birthday      │
│ ‹         Days 1–12 of 30             ›  │ The Plaza   (face) +2     │
└───────────────────────────────────────────────────────────────────────┘
```

- **On top:** the date and the year; the four seasons, this one marked, each a tap away; the day's actions left, with a
  special day's event actions after them (♥+3); and Close.
- **Year controls** move the selected season to the previous or next year. **Today** returns to the current farm date.
- **The season’s 30 days** in a grid of two rows and six columns. Swipe or use the arrows to browse days 1–12,
  13–24 and 25–30. Tap a season tab to change seasons. The arrows next to the chosen date move one day
  at a time, keeping that date in view. Each column shows its number, weekday and marks: a festival's trophy (and a
  ring in the season's colour), New Year's or a celebration's spark, a holiday's ribbon, a minor day's dot and a wedding
  heart. Under them are a compact label and the date’s event actions (♥+3). Full event wording appears in the day panel.
  Each tile can show six portraits, or five and a count when more Umas have an event. Today is in the accent colour,
  and days gone by are faded.
- **The chosen day's panel** (today when the calendar opens): its heading ("Spring 19 · in 16 days"); a special day's
  bonus actions and today’s regular actions left ("2/3 bonus · 7 regular left"); New Year's; its festival, with what
  happens at it when the story says; the story's holidays and minor days, each with its line; then everyone with an
  event that day, her face, her name and why. On a day ahead the list is "With an event, as things stand". Then **In
  town · n**: who's in town that day and where, a row a place in the map's order, its name, its first five faces (met
  first) and "+n", read from every Uma's fixed schedule ([who's where](#whos-where)), so a day ahead shows who'll be
  there. Expand **Farm shift** or **Day off** to see the full names. The panel also lists expedition departures and
  returns, planned or held weddings, and the household's celebration dates. The date and its previous and next day
  buttons stay in place while the day’s details scroll. Selecting a date starts those details at the top.
  At its foot, the next festival and countdown.
- **Today's rows play:** **Play · 1** for her next occasion scene (the day's, then a festival's night; or "No actions"
  with none left of either kind), and **Event ›** for her Ready event. Those who've played an occasion today are listed
  under it ("Played today: …"). Her birthday or her anniversary said by its occasion isn't said twice.
- **Night ›** opens the spouse's Night visits when a birthday or anniversary visit is available. The daytime occasion
  and the night visit have separate costs and receipts.
- **Wedding planner.** After accepting the proposal, choose **Schedule wedding** on the stage card or her profile.
  If you set a date, the ceremony can play on or after it. You can move or clear the date. With no date selected,
  the ceremony opens the day after the proposal. Dates saved before the proposal by older versions are cleared at
  engagement. The day panel also shows other events on the selected date.

**A day holds:**

| Entry | When | From |
|---|---|---|
| New Year's | Each year's Spring 1 | The game |
| Its festival | The game's five on their days, or the story's year | The game's, or `world.json`'s `festivals` |
| The story's holidays and minor days | The days the story names: in one season, or in every season; and the game's own six small days, wherever the story puts them | `world.json`'s `days` ([the story pack's menu](story-pack.md#the-storys-days)), and the game's ([the story's days](#the-storys-days)) |
| Her occasion scenes | New Year's from the second year, each festival's day and its night, her birthday, her anniversary, the story's days | Her route's scene for it, else the default story's for three of them ([occasion scenes](#occasion-scenes)) |
| Birthdays | Each met Uma's balanced farm birthday | The full launch cast's spread across all four seasons ([birthdays](#birthdays-and-anniversaries)) |
| Anniversaries | Each spouse's wedding day of the year, from the second year | Her wedding's day |
| Weddings and celebrations | A scheduled or held wedding, each five-marriage celebration and the Greater Festival | The save |
| Expedition trips | Departure and return dates from active and recently logged trips | The expedition post |
| Event actions | New Year's from the second year, a festival, each met Uma's birthday | [The day's budget](#a-day-ten-actions) |

**The faces: who has an event that day.** Each met Uma once, with every reason she's there:

| Reason | Today | A day ahead | A day gone by |
|---|---|---|---|
| **Her occasions** | Her occasions that day by name (the day's, then a festival's night), until she's played them | Her occasions that day | — |
| **Her birthday** | Yes | Yes | Yes |
| **Your anniversary** | Yes | Yes | Yes |
| **Wedding** | Planned or held | Planned | Planned or held |
| **Her event** | Ready now ("Ready") | Ready on that date as the save stands, the date moved and nothing played ("Likely ready"), her face faint in the day's cell | — |

- **A day ahead is a best guess.** It reads the save as it stands with the date moved: a bar already full shows on
  every day ahead until she plays it, a waiting rung (the confession, the proposal, the wedding) from the day after the
  rung before, and a chapter's season or festival gate on its days. Points she hasn't earned yet don't show.
- **The order:** the date's own faces first (an occasion, a birthday, an anniversary), then those only Ready; each in the
  cast's order.

#### Occasion scenes

Everything the story writes for a day of the year plays on that day, with each Uma who has it: read by id from the pack,
so a release that adds Umas, scenes or days plays them on publish, with no deploy.

<!-- live:occasions -->
| Occasion | Its event id | Its day | Who | Unwritten | She wears, unless the scene names an outfit |
|---|---|---|---|---|---|
| New Year’s | `new-year` | Spring 1, from the second year | Everyone met | The default story’s | `kimono` (`new-year`) |
| A festival’s day | `flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`, `harvest-cup` | The festival’s day, wherever the story puts it | Everyone met | The default story’s for the Flower Show; none for the others | `garden-party` (`spring-festival`) at the Flower Show; the season’s at the others |
| A festival’s night | `flower-show-night`; `fishing-derby-night` or `derby-night`; `cooking-contest-night` or `harvest-moon`; `animal-show-night`; `harvest-cup-night` | The festival’s day, its night: a second slot, after the day’s | Everyone met | The default story’s for `derby-night`; none for the others | `kimono` (`festival-night`) |
| Her birthday | `birthday` | Her birthday | Her, once you’ve met | None | `dinner` (`dinner`) |
| Her anniversary | `anniversary` | Her wedding’s date, each year from the first anniversary | Her, once married | None | `dinner` (`dinner`) |
| A story day | The day’s `scene`, else its `id` | world.json’s `days`, and the game’s own small days | Everyone met | None | The season’s |
<!-- /live -->

- **Hers:** an occasion is hers on its day when her route writes its scene (a festival's night under `<festival>-night`,
  else the story's alias for it), or the default story plays it: New Year's, the Flower Show and the derby night. Every
  other occasion plays only when written. **Who:** everyone you've met, home on the farm or living in town; her birthday
  once you've met her; her anniversary once married, from the first.
- **One a day, and a festival's night:** a day with several of hers plays one, in this order: her birthday, her
  anniversary, New Year's or the festival's day, then a story day (holidays first, then minor days, in the calendar's
  order). A festival's night is a second slot, after its day's, so a festival day can play both of hers.
- **Its cost:** one action each, the day's event actions first. It pays nothing: its choices are wording only, as every
  scene past the rungs.
- **Once each:** played, it leaves her face's list for the day; with the night still to come, her face stays for it.
  `today.occasions` keeps `<her id>:<occasion id>`; a save from before kept her id alone, which reads as the day's one
  occasion then (New Year's, the Flower Show or the derby night), so it never plays twice.
- **It isn't her heart event:** it doesn't need her Ready, and it doesn't stop her event today.
- **Where it plays:** the calendar's day panel, **Play · 1**; on the dialogue engine, her face line by line, in the
  scene's own outfit when the story names one, else the occasion's moment's: the kimono at New Year's and a festival's
  night, the garden party dress at the Flower Show, the dinner dress on her birthday and her anniversary, else the
  season's ([outfits by context](#outfits-by-context)). Its end or Skip spends the action.
- **The morning** names each day ahead of it: New Year's, a festival, the story's days (the game's six among them), her
  birthday and her anniversary, each a tap to the calendar or her profile.

##### The story's days

The game's own six small days, each a minor day on the calendar, named in the morning, with a scene of its own (its id):

| Day | Its `id` (its scene) | When |
|---|---|---|
| Blossom viewing | `blossom-viewing` | Spring 6 |
| The wishing night | `wishing-night` | Summer 6 |
| The first cold evening | `first-cold-evening` | Autumn 4 |
| The first snow | `first-snow` | Winter 2 |
| The longest night | `longest-night` | Winter 6 |
| The sweets day | `sweets-day` | Winter 8 |

`world.json`'s `days` move or rename one by its `id`, or add any other; each day plays its `scene` (else its `id`) with
each Uma who has it written. A day with no scene written for anyone is a marked day and nothing more.

#### A day: ten actions

- **The day holds 10 actions.** The bar's actions chip counts what's left ("7/10"), every button that spends one says so
  ("Water · 1 action", "Fish · 1"), and a side panel says "7 actions left of 10". With none left, an action is refused
  ("No actions left today.") and its buttons are greyed.
- **One tap of work is one action:** a tile cleared, tilled, planted, watered or harvested; a forage, a chop or a catch;
  a station's load started; a crate shipped; with the Umas, introducing yourself, a talk, a gift, the
  invitation to work, her event, or an occasion scene with her; a batch cooked in the farmhouse kitchen; and once
  married, a household meal. **A hangout or a date takes two,** and entering the Cooking Contest three (the festival's
  event actions first). Looking, building, walking around town, shopping and choosing tonight's companion are free.
- **Going into town** is free. Opening Town arrives automatically, even after all ten actions are spent.
- **The last action** opens a card over whatever page it was spent on, once: "Out of actions · The day's work is done."
  with **End the day** and **Not yet** (to build or visit town, for example). The day never ends by itself.
- **Special days** grant actions for events only, on top of the ten: New Year's from the second year, each festival, and
  the birthday of each Uma you've met. The bar shows them after the day's own (♥+3), and so does the calendar. Her
  event, an occasion scene and the Cooking Contest's entry spend them **before the day's own**, so on a festival with
  the ten spent, three more of the Umas' events (or the Contest) still fit. The save counts them apart
  (`today.eventActions`).
- **Her event costs one action:** the special day's event actions first, then the day's. With none left of either, her
  Play says "No actions left today." before it plays, and she stays Ready for tomorrow. Ask her, a Memory, the
  wedding night, moving in and the night's companion's morning greeting take none. An evening never spends a special
  day's event actions: its two are the day's own.
- **Nothing reads the device's clock.** A load is ready the next morning and a watered tile grows at night, so reopening
  the app moves nothing.
- **Your changes are stamped with the real time**, which syncing between devices compares; that stamp never moves the
  date.

The day's budget and the special days' event actions:

<!-- live:day-budget -->
|  | Actions |
|---|---|
| Every day | 10 |
| New Year’s (each year’s Spring 1, from the second year) | +3 for events |
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
| The fields | Water a row: a farmhand’s trick, from Watering 6 | 1 | Now |
| The fields | Save up to four seeds from one grade of produce | 1 | Now |
| The fields | Remove an orchard plant and leave tilled soil | 1 | Now |
| The fields | Cut grass on a weeds tile, for the silo | 1 | Now |
| The fields | Clear a plot: a new page of the field, from its Farm Rank, for its gold | 1 | Now |
| Animals | Feed one, or care for one; collect a building’s eggs, milk or wool | 1 | Now |
| Animals | Buy an animal or fodder, at the rancher’s in town | Free | Now |
| The woods and the water | Forage once | 1 | Now |
| The woods and the water | Chop a log | 1 | Now |
| The woods and the water | Fish once | 1 | Now |
| The mine and the quarry | Work a face once | 1 | Now |
| The mine and the quarry | Take the stairs, once found | Free | Now |
| Stations | Start a load | 1 | Now |
| The bin | Ship what you choose | 1 | Now |
| The town | Go into town | Free | Now |
| The town | Shop, order a build, borrow or repay, once in town | Free | Now |
| The Umas | Introduce yourself | 1 | Now |
| The Umas | Talk | 1 | Now |
| The Umas | Give a gift | 1 | Now |
| The Umas | Invite her to work | 1 | Now |
| The Umas | A hangout or a date | 2 | Now |
| The Umas | Her event, when it’s ready, or an occasion scene with her | 1 | Now |
| A festival | Enter on its day at the Festival ground, or at the Kitchen for the Cooking Contest. Event actions go first | 3 | Now |
| The kitchen | Cook a batch: six meals for the pantry from two goods of food, in the farmhouse kitchen, plain or at the stove | 1 | Now |
| The Kitchen | Play the Kitchen: its dishes from a menu of recipes, at the stove, once a day | 1 | Now |
| The Restaurant | Serve a shift from a stocked menu of dishes, once a day | 1 | Now |
| The Forge | Commission a tool or heirloom | 1 | Now |
| The Expedition post | Send a party for 2–5 days, with up to eight dishes | 1 | Now |
| The household | Cook a meal for the household: breakfast or dinner (it cooks a batch too) | 1 | Now |
| The household | Choose tonight’s companion, at the day’s end | Free | Now |
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
birthday) and the story pack (her favourite line, the ties, the Town notes), which the farm loads as it opens; if
either can't load, the sheet says so with **Try again**.

**"Ask before ending the day"** is a switch in the Menu: on by default, kept on the device and never in the save.

**Tonight.** The tap first opens **Tonight** whenever an evening can be spent with someone (the day has the two actions
it takes) or anyone is married: the evening's row, the night's companion once married, the nudge's line, and **End the
day** / **Back**. Ending the day never waits on the evening. The night plays as a fade: the screen dims to dusk and the
morning comes up from it (a plain cut with reduced motion); once married, it comes up on the night's companion greeting
you ([the night's companion](#the-nights-companion)). Tonight is the romance's.

#### The night, step by step

The night is one fixed run of steps over the save:

1. **The bin pays.** Everything shipped today pays at its price × stars × demand on the day it was shipped, so a
   season's last night still pays that season's demand. Gold rises and the bin empties. Before it, once anyone is
   married, tonight's house is noted.
2. **The farm records the crew shift, eats, pays its bill, then grows crops.** The night reads the recorded shift for
   [Farmhands](#farmhands) or runs an in-progress legacy date’s crew under the old timing. **Then the farm eats:** the farmer, every spouse in
   her room and every farmhand on her farm day, two meals each, from the pantry first; what it's short is takeout
   (see [food](#food)). **Then the bill:** the bin's pay joins the last seven nights' income. Takeout and upkeep are
   covered before any of today's income repays loans (see [upkeep and loans](#upkeep-and-loans)). Then each growing
   tile watered today grows one stage, and one whose stages reach its days − 0.5 turns ripe; a dry tile doesn't grow. A
   farmer Uma's night chores each water a dry growing tile first. Then every tile dries for the next day.
3. **Animals.** Each animal fed today leaves its good in its building, waiting to be collected (one at a time), and
   grows 2 fonder; one left unfed goes hungry: no good, −10 fondness, and it never dies. Then every animal is unfed and
   uncared for the next day (see [the ranch](#the-ranch)).
4. **The stations' loads finish.** Every load started today is done: its goods go into the Warehouse at their stars and
   the station is free for the morning. Side by side's and the perks' extras and foragers' and fishers' night chores go
   straight into the Warehouse too.
5. **Workshops.** Nothing changes on the starter farm.
6. **Ranks and bonds.** Every farmhand who worked today earns a day's rank points in her place's activity and ranks
   up where her challenge is met; farmhands at the same place tick their bonds, and her line pays. Shared houses pay,
   spouses level, and well-fed days count down by one.
7. **The date turns.** On a season's last night, growing crops that don't grow next season wither first. Then the date
   moves on, and the whole of today's record clears: the day's actions and event actions, going into town, the places
   worked, chats, gifts, praise, events, evenings and invitations.
8. **The farm's news.** The places paid for yesterday stand; the
   Diary pays its milestones and rows and the Farm Rank is recomputed; the Town notes whose unlock now holds unlock; the
   ring bench opens the night after the first Romance 8, and the household's milestones are noted.
9. **The morning.** A wedding's reception is served, the house's morning given, spouses move into rooms, the Festival
   of Vows is held, praise, birthdays and anniversaries are noted, morning items are left and the morning's invitations
   drawn; then the morning summary is built from what changed.

A night without the story pack runs the farm's steps and skips the romance's: no meetings, no favourites, no bonds and
no line pay. The farm waits for the pack before it ends a day, so in play every night has it.

The steps as the game lists them:

<!-- live:night -->
| Step | Function | What happens |
|---|---|---|
| 1 | `settleThePlay` | An open Restaurant shift pays its completed tickets and returns the unused dishes. A stove play left unfinished settles as Rough, with its output, assistant’s practice and challenges, or Contest judging and prize |
| 1 | `noteTonight` | Before the bin, once anyone is married: tonight’s house and companion are noted (her house’s last night slept, and hers, are today), your pick of her at Tonight or else the house slept in least lately and its resident who’s been your companion least lately; the picks clear for tomorrow, and she greets you in the morning |
| 1 | `payTheBin` | The bin pays: everything shipped today, at price × stars × demand and the market’s ease (past a crate of 50 of one good, each crate more a step lower: −10% a step, to half); then the market moves: a good shipped past a crate stays eased by the steps it reached, and every other eased good recovers a step |
| 2 | `farmhandsWork` | Read the completed morning shift (or run the crew at night for a legacy date). Farmhands work in invitation order. Cooks and station hands with orders can use spare actions after later workers bring ingredients in. An action gives a point of practice. Goods go to the Warehouse, meals to the pantry, and each Uma’s main place is where she spent the most actions |
| 2 | `theFarmEats` | The farm eats: the farmer, every spouse in her room and every farmhand on her farm day, two meals each from the pantry, the Umas first, the farmer last, the oldest meals first and the best of those; a ★2+ meal leaves an Uma well fed through tomorrow; what’s short is takeout; the parties leaving tonight pack their dishes and two meals per member per day away (takeout if short); a meal keeps three days, then any left over spoil |
| 2 | `settleTheAccounts` | The bin’s pay, town orders, and the Restaurant’s sales and tips join the last seven nights’ income. Takeout (15g a meal), upkeep and arrears have first claim on cash. Loans draw from that night’s income up to the cash left after covering those bills. The farm runs at half pace from a second consecutive short night until the bill is paid |
| 2 | `growCrops` | Crops grow: each growing tile watered today grows a stage, and one whose stages reach its days − 0.5 turns ripe; a dry tile doesn’t grow; a farmer’s night chores each water a dry growing tile first; then every tile dries for the next day |
| 3 | `tendAnimals` | Animals: each animal fed today makes its good, waiting in its building to be collected (one at a time), and grows 2 fonder; one left unfed goes hungry, makes nothing and loses 10 fondness, and never dies; then each is unfed and uncared for the next day |
| 3 | `ranchNightChores` | Ranch chores: a rancher’s night chores each give every animal in her building (the Coop or the Barn she cares for on the work board, else the first that stands) +5 fondness, held to 200; 1 from F6, 2 from R7, 3 from S4, on the farm only |
| 4 | `finishTheLoads` | Stations: every load started today is done, its goods into the Warehouse at their stars, the station free for the morning |
| 4 | `nightExtras` | Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again (20% in her element), seeded copies straight into the Warehouse; then the perks’ extras: the bond term × the romance term of the same items (her line’s +10% and +20%, her ring, a dream, the household; held to 40%), their own seeded copies |
| 4 | `nightChores` | Night chores: a forager’s bring one item each from her rank’s deepest forest area this season, a fisher’s one fish each from her deepest spot, at a day’s haul’s stars, a miner’s one find each from the Mine’s or the Quarry’s deepest floor, at a face’s, into the Warehouse; 1 from F6, 2 from R7, 3 from S4, on the farm only |
| 5 | `resetWorkshops` | Each workshop may be played again tomorrow |
| 6 | `returnTheExpeditions` | Expedition parties due this morning return with loot, Expeditions rank points, challenge credit and bonds; the post logs the return |
| 6 | `tickRanks` | Rank points for each farmhand who worked, in Serving for the Restaurant’s server and in the activity of her main job for everyone else. Friendship 5 gives ×1.05, Friendship 10 gives ×1.10, and a mentor at her place adds ×1.10. Ranks rise when their points and challenge are met |
| 6 | `tickBonds` | Bonds: +10 to each pair of farmhands who worked one place today, once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend |
| 6 | `payLine` | Her line: +10 to each farmhand who worked today at one of her line’s places, once a night |
| 6 | `shareTheHouses` | Shared houses: +10 bond a night to each pair of spouses with rooms in the same house |
| 6 | `levelAtNight` | Spouse levels: a spouse at S1 or S3 whose 600 is full reaches S2 or S4, with no Ready event (S2 starts her every-2nd-morning item); the morning’s line plays its scene and card; never S3 or S5 |
| 6 | `countWellFed` | The well-fed days count down |
| 7 | `witherCrops` | On a season’s last night, crops still growing that don’t grow in the next season wither, their soil left tilled; ripe crops wait |
| 7 | `turnCalendar` | The date moves; the whole of `today` clears: the day’s actions and event actions, going into town, the areas worked, chats, gifts, praise earned and paid, events, Ask her, evenings and invitations, the ring made and the reception, the staff meal, the Kitchen’s assistant and the Contest’s cook |
| 8 | `raiseBuildings` | Places built: every place paid for yesterday stands this morning (`buildings[id] = 1`), and a station’s level bought yesterday comes (its level one more), each one news |
| 8 | `checkGoals` | The Diary pays its milestones and rows, and the Farm Rank is recomputed from income and resources |
| 8 | `unlockTownNotes` | Town notes: each of the world’s notes not yet unlocked whose unlock holds on the morning’s date (a season, a festival, a Farm Rank, a place built, a good shipped, another’s event) unlocks, once; the morning names them |
| 8 | `openRingBench` | The Ring Bench opens the morning after the first Romance 8 event and its smith’s scene becomes due. The tool workshop installs paid orders and completes heirlooms on their due dawn |
| 8 | `householdMilestones` | Household milestones: the first wedding and each set of five through fifty are news once. Five spouses bring the furniture set. The closing celebration is Ready on the fiftieth wedding day. Earlier celebrations open the morning after their milestone wedding |
| 8 | `festivalPreparations` | A pledged Greater Festival contribution uses the next matching exact-grade farmhand output or expedition return in its preparation window and credits its producer or party |
| 9 | `serveTheReception` | A wedding’s reception: everyone who lives on the farm (the spouses in their rooms) well fed from tomorrow for its days (a dish ★1–2 one, ★3–4 two, ★5 three; the bakery’s cake one), never shortening a meal already running |
| 9 | `houseMorningStep` | The house’s morning: each resident of the house slept in +30 (only hers on a birthday-alone night); her breakfast (S1) feeds everyone who lives on the farm with no meal left; each resident at S2+ leaves one more morning item; a house with residents not slept in for 8 nights misses you |
| 9 | `moveInRooms` | Rooms: the spouses waiting for a room, living in town, take one the morning one frees, in wedding order, by the same default as a wedding’s |
| 9 | `vowsMorning` | The Festival of Vows: after the Greater Festival has been held, its scheduled date returns each year for +50 to every spouse and a festival-night slot. Older households keep the former date until they hold the Greater Festival |
| 9 | `heartsMorning` | Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse |
| 9 | `morningItems` | Morning items: each Uma on the farm this morning (a spouse in her room, a farmhand on her farm day) leaves a good of her line in the Warehouse every 4th morning from Romance 2 (★2+), every 2nd from Spouse 2 (★3+) |
| 9 | `drawInvitations` | Invitations: one Uma asks you for her favourite kind tonight (two from 10 married), drawn by `draw(uid, day, 'invite', n)` among the spouses in their rooms (the Umas home) whose favourite kind is open to them, weighted 1 + days since her last evening (up to 14) |
| 9 | `noteTheFed` | The farmhands well fed this morning are noted (`today.fed`): each works one more action today |
| 9 | `buildSummary` | The morning summary, from what changed; §2 Work done opens with each farmhand’s day, then the loads and the Coop’s and the Barn’s nights, §3 Ranks closes with the aptitudes that reached a level; §4 Hearts lists the invitations, the Festival of Vows, the night’s levels, the house’s morning, rooms taken and a house that misses you, the morning items and night chores, the perks’ and side by side’s extras and each pair’s bond hearts reached since the last morning; §5 the household milestones |
<!-- /live -->

- **Every draw is seeded** by the account, the day and what's drawn, so ending the same save on two devices gives the
  same morning. The save holds no random state.
- **Rank-ups show in the morning,** never mid-night, and so do the aptitudes a farmhand reached.
- **The farmhands well fed this morning** are noted last of all (`today.fed`): each works one more action today.
- **The night is one change.** Its steps write nothing on their own; the save is stamped once, with the real time, after
  step 9.
- Ranks, the goals and meeting her are described with the Umas and the farm's progress, and the romance's steps
  in Part 3.

#### The morning summary

After every night a card opens over the farm map, titled with the date ("Morning · Spring 3"). Live Uma events,
invites, household scenes, festival entry links and personal occasions appear at the top alongside the remaining
bonus event actions. A festival within two days gets a planning link. The collapsed **Farm report** holds the night's
work, earnings, deliveries and relationship news. Each line opens its place.

- **Start the day**, the close button or a drag down puts the card away for good.
- **A tap on a line** opens its place and keeps the card, which comes back on the farm map once no quick look or sheet
  is open.
- **The next night** replaces it.

| Section | Lines | A tap opens |
|---|---|---|
| The bin | Each good and star sold, "Salmon ★2 × 3 · 495g", tagged **In demand** when the season lifted it; then "Total · 545g" | The bin |
| Food, upkeep and loans | Each loan's share, "Loan for the Mill · 55g repaid · 440g left" ("· nothing repaid" on a night without a repayment; "· cleared", tagged **Cleared**); the meals the farm ate from the pantry, "From the pantry · 4 meals" ("· 2 spoiled" for meals two days old left over), tagged **Well fed** when a ★2+ meal fed an Uma; the takeout, "Takeout · 30g" (or "10g of 30g" when short); "Upkeep · 45g" (or "5g of 45g" when short); a short night, "Short of upkeep · 40g owed", tagged **Warning** in red, and from the second in a row "· farmhands at half pace", tagged **Half pace**; "Upkeep paid up · 85g owed", tagged **Paid**. A new farm's first morning says "Takeout · 30g". Hidden on a night with nothing eaten or charged | The Book |
| Work done | First each farmhand's night, "*Name* · 4 of 4 actions · watered 6 tiles · caught 1 fish · +1 good", tagged **Well fed** when she had her extra action, **Half pace** in red at half pace, or **No tasks** with "No tasks: set her tasks" ("Nothing to do tonight" when her tasks found nothing); then each station's load done, "Sawmill · Pine Plank ★1 × 8"; the field's growth, "The field · 5 crops grew · 2 ripe"; what withered, "The field · 3 Onion withered" | The work board in the Book; the station's panel; the farm map |
| Ranks | Rank-ups, "*Name* · Farming Hand", tagged **Rank up**; points that filled tonight with the challenge still to meet, "*Name* · Fishing · Catch 30 fish · 12/30", tagged **Points full**; an aptitude a farmhand reached, "*Name* · Watering 3 · Two tiles an action" (with the trick that level opens), tagged **Aptitude** | Her profile's Work side |
| Hearts | First, once married, "☾ Morning with *Name*" (the night's companion, **Play** her greeting); who's Ready for her event (read live, up to three, then "+N more"), the morning's invitation, the house's morning, morning items and night chores, birthdays and anniversaries, levels reached overnight and those the night met ("Met *Name* · in town", or in the town the world names, tagged **New**), a chapter that opened ("A new chapter with *Name* · Together", tagged **New**), the perks' and side by side's extras, and bond hearts | Her event, her profile, or where the line says |
| New today | First, "New story arrived · *its note*", tagged **New**, the morning after a new story release reaches the phone ([below](#how-the-app-gets-the-pack)); "Summer begins", the world's line for the season under it; today's, then tomorrow's: "New Year's today · +3 for events", "Flower Show tomorrow" or "today · +3 for events" (the story's name for it), and the story's holidays and minor days, "Market day tomorrow" (or "Market day +1 more"); the Town notes the night unlocked, "*title*" (or "*title* +2 more"), tagged **Town note**; a place built overnight, a Farm Rank reached and a Diary milestone, each tagged; the household's milestones, tagged | The People page; the calendar (the season, New Year's, the festival and the story's days), but the Kitchen for the Cooking Contest's; the note in the Diary; the Diary; the Farm Rank; the household's scene or the homestead |
| Today | "3 tiles to water" (the growing tiles this morning); "9 tiles to plant" (empty tilled tiles that the season's seeds you hold could fill) | The farm map |

Hearts shows whenever it has a line or someone is Ready. The romance describes its lines.

#### Notifications

The farm sends no notifications. With days as turns nothing finishes while the app is closed, so Account's Notifications
card reads "Off: days are turns".

### Farm guides

The **ⓘ** buttons open help for the place or activity you’re using. Each guide explains what you can do there,
which buttons to use, and which rules matter to that choice. Workflows such as planting use ordered instructions.
Topics such as Farm Rank explain what to check. Examples show how to budget a day, cook enough meals, or price a loan.

**Menu → Farm guides** opens the topic index. **All farm guides** in a help panel opens the same topic in the index.
Back returns to where you were.

### The farm map and the bars

#### Home: the farm map

Home opens on the painted farm map. Tap a marked area or its matching shortcut. Each area opens a local HD-2D scene with a straight overhead path, tappable entrances and a destination list. Drag to pan or tap Zoom in to look closer. The list stays available when 3D is unavailable.

| Area | What you can open |
|---|---|
| **Farm** | Plot and orchard signs, the Mill and the Gate. Crops show their growth and watering state, with totals for ripe tiles, dry plants and empty tilled soil. |
| **Forest** | Trails to the six gathering areas and the Sawmill. The trail list shows which areas you can reach. |
| **Pond** | The existing fishing spots, the Smokehouse and the Dock. The Boat appears at the Dock once built. |
| **Barns** | Coop and Barn doors, the Silo, current animals and how many are fed or have goods ready. |
| **Living** | The Farmhouse and other homes. The directory shows everyone assigned a room and where she is. Tap a resident at home to talk, or follow her location when she is working or in town. |
| **Work** | Production, storage, extraction, shipping, Requests and the Expedition post. The Work board is available here. |

A building door opens a modeled 3D room before its existing activity controls. Rooms have furniture and equipment arranged for their purpose. Outdoor targets open the field, trail, fishing or other action panel directly. The destination list shows why a locked place cannot open. The road opens Town for free. Opening a door or selecting a person is also free.

Morning farmworkers at outdoor jobs are marked by profile pictures from the day's receipt. Inside a playable plot, up to three of that plot’s workers appear as walking sprites along the back of the field. Tap one to open her conversation. Before the work is recorded, their placement is marked as planned. Indoors, Umas stand on the room floor as HD-2D sprites. Housed Umas return to their assigned homes at night, with expeditions accounted for. A person marker or her Here now entry opens the full-screen portrait conversation. Back returns to the same section or room at the previous position. Inside a room, tap the floor or use the arrow keys to walk. The camera follows along the floor at a shallow fixed angle. Uma and livestock sprites face the screen from their planted feet. Furniture and standing Umas block the path. Use **Walk** to follow your position, **Close** for a nearer view, **Whole room** to fit the room, and **Entrance** to walk back to the doorway. A counter or machine can show a shortcut to its normal service. You can also open services and speak to anyone listed in Here now from the side panel. Windows and fixtures light the room differently in the morning, afternoon and at night. **Balanced** is the starting setting for indoor rooms, including on iPhone. Choose Saver, Balanced or High from Room graphics. The game remembers your choice on this device. If 3D fails, the room keeps its portrait view and action links. Use **Retry room** to try 3D again. The Barn and Coop show the animals you own, up to eight in each building and its pen. A green mark shows a fed animal, amber shows one still to feed, and gold shows a product ready to collect. Open the ranch panel to feed, care for and collect from your animals.

The original tile map stays available from Home's map controls. It includes the **Field and Pond** review and **Phone test**, which records FPS, frame gaps, draw calls and estimated graphics memory for the original rendering slice.

Each place's building and what opens it (the Boat is moored at the Dock and drawn there):

<!-- live:farm-map -->
| Place | Building (uma-art) | Opens |
|---|---|---|
| Fields | `vegetable-garden` | Day 1 |
| Mill | `fields-workbench` | Farm Rank 1, then built |
| Coop | `building/coop` | Farm Rank 2, then built |
| Forest | `forest` | Day 1 |
| Sawmill | `forest-workbench` | Farm Rank 3, then built |
| Barn | `stable` | Farm Rank 3, then built |
| Fishery | `fishery` | Day 1 |
| Smokehouse | `fishery-workbench` | Farm Rank 3, then built |
| Kitchen | `kitchen` | Farm Rank 3, then built |
| Mine | `mine` | Farm Rank 4, then built |
| Smelter | `mine-workbench` | Farm Rank 4, then built |
| Restaurant | `party-hall` | Farm Rank 7, then built |
| Quarry | `quarry` | Farm Rank 5, then built |
| Cutter | `den-workbench` | Farm Rank 5, then built |
| Forge | `forge` | Farm Rank 3, then built |
| Shipping bin | `shipping-bin` | Day 1 |
| Warehouse | `warehouse` | Day 1 |
| Requests board | `building/board` | 5 Umas met |
| Gate | `scenario-gate` | Day 1 |
| Dock | `building/dock` | Farm Rank 6, then built |
| Shop | `exchange` | Day 1 |
| Festival ground | `racecourse` | Day 1 |
| Expedition post | `building/expeditions` | Farm Rank 7, then built |
| Town | `building/town` | Day 1 |
| Boat | At the Dock | Farm Rank 6, then built after the Dock |
<!-- /live -->

What a tap does:

| Where | A tap opens |
|---|---|
| The field's sign | The field's screen, full screen: plot 1's page (`/field`; see [the field's screen](#the-fields-screen)) |
| The woods' edge | Its panel: each area in reach, with its season's finds, **Forage · 1** and **Chop · 1** |
| The pond's edge | Its panel: each spot in reach, with its season's fish and **Fish · 1** |
| A station, built (the Mill, the Sawmill, the Smokehouse, the Smelter, the Cutter) | Its panel: today's load, or what it can make, each with **Load 8** (or all that's held, if fewer) |
| The Coop or the Barn, built | Its panel: the silo's feed, **Collect** for the goods waiting, and each animal with its hearts, **Feed · 1** and **Care · 1** (see [the ranch](#the-ranch)); the map tags it "3 to collect" |
| The Mine or the Quarry, built | Its panel: the floor you're on with its finds, **Work a face · 1 action**, and the stairs: their progress, then **Take the stairs · free** (see [the Mine and the Quarry](#the-mine-and-the-quarry)); the map tags it "Floor 3" |
| The Shipping bin | The bin's sheet |
| The Warehouse | The Warehouse |
| The Gate | Its quick look: everyone lives in town, and the Town |
| The Dock | Its quick look: its Build card, then the Boat's |
| The road to town | The town map opens free, with its places, who's there now and the People list (see [the town](#the-town)) |
| Every other place | Its quick look: what it is, and what opens it; a place to build, its Build card |

**Locks.** A locked place shows a lock, and its quick look says why:
- **A place to build** (see [Building](#building)): "Farm Rank 3" before its rank offers it. "Not built" leads to its Build card, and "Builds tonight" marks a paid build.
- **The Requests board:** Meet five Umas, then open the same orders as the Plaza and Café.
- **"Opens soon":** a place that stands while its game is still in development.
- **The Forge** has two entrances on its quick look. The workshop can be restored at Farm Rank 3.
  The Ring Bench opens the morning after the first played Romance 8 event.

**Tags.** A station with a load today says **Ready tomorrow**. A ripe tile shows its crop ripe, and the Menu counts the ripe tiles.

**The help button** says how the farm works in five short lines: a day holds 10 actions, one a task; looking and
building are free, and the shop once you're in town; a watered tile grows a stage at night and a season's end withers
what still grows; when the actions run out, end the day; tap the date for the calendar.

**The morning card** covers the map after each night until you put it away.

**The homestead's columns** sit after the yard (the Farmhouse and two lots from day 1, the second column from three
married, the third from six; three to a column), the other lots moving along, so the map grows a column at a time. A
house carries its residents' faces, with ♥ for one Ready. It's the romance's. Nobody comes to the Gate on her own: you
meet everyone in town.

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
- **The Gate:** "Everyone lives in town." (once you've met someone, "Meet everyone else in town."), the town by its
  name when the world gives one, a tap to the town map (see [meeting her](#meeting-her)).
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
  every other sheet. A swipe right, a tap on the dimmed page or the close button closes one. Her profile, the morning
  and the homestead are wider panels, for all they hold.
- **Scenes are full screen:** the opening, meeting her, the event, pair and household players, the evening's plays and
  cards, a level reached overnight. Each is laid out sideways: her bust on the left, the lines and the choices on the
  right; a play's name and legend on its left, the play on its right.
- **Lists sit in two columns** where they fit: the Hearts rows and the Town's People, the Town's spots, the
  Warehouse's goods, the Diary's panels, the Book's cards and Account's panels; the Work view's faces sit
  five or six across.
- **The farm map's panels** (the woods', the pond's, a station's) sit at the right without dimming the map, and so do the
  field's screen's (a tile's, a row's), so the next tile is one tap away.
- **The field's screen is full screen:** no rail and no bar, its own strip along the top with the day's actions and End
  the day; every sheet and card still opens over it.
- **Safe areas:** the rail keeps clear of the notch's side, and the page of the other side and the home indicator; the
  update prompt keeps clear of both sides.

#### The bar

A thin bar along the top of the page, always there. From the left:
- **The date chip**, the season's mark, the day and the season ("3 Spring"; its spoken name "Calendar: Spring 3, year
  1 …"), opens [the calendar](#the-calendar-screen).
- **The gold chip**, the gold coin and your gold ("Gold: 1,240g. The bin"), opens the shipping bin.
- **The sync chip** shows only while offline ("Offline") or paused ("Sync paused"), and opens Account.

At its right end:
- **Actions left**, a stopwatch and "7/10", greyed at 0. Morning lasts through the first five regular actions,
  Afternoon through the next five. Night is shown when the regular actions run out. On a special day the event actions
  left follow in rose, a heart and "+3" ("Actions left: 0 of 10, and 3 for events"). It opens nothing.
- **End the day:** see [End the day](#end-the-day).
- **Menu:** every place.

#### The rail

**Farm · Town · Library · Ledger · Diary**, down the left edge. The page you're on is lit: a marker on the rail's inner edge
and its two-tone icon. A farm place's page (the Warehouse …) keeps Farm lit.
- **Farm:** the farm map.
- **Town:** the town's screen (see [the town](#the-town)).
- **Library:** every Uma's portrait book, with **People & work** leading to the Ready list and roster album.
- **Ledger:** the Farm Book (below).
- **Diary:** the farm's projects, the Farm Rank, the milestones, each Uma's Memories and the pairs' Conversations.

#### Uma Library

Meeting an Uma unlocks her portrait book. Each shelf holds up to ten books in two rows of five. Use the shelf
arrows or swipe to page through them. The default **Relationship** sort puts the strongest first. **Cast order**
packs unlocked books in roster order and **Name (A–Z)** orders the same books alphabetically. **By tier** keeps
the original launch tiers and their empty positions. Earlier cast members keep their books in every view.
Covers show her current relationship level and, for eligible spouses, Greater Love or True Love beside the collection count.

**Relationship** is the first page when you open a book. Filled hearts show earned levels on her current ladder.
Friendship uses ten small coral hearts, In Love uses ten larger rose hearts, and Spouse uses five gold hearts.
Greater Love has five still larger red hearts, one per 24 points, filled in proportion to progress. At 120 points
all five are full and the label reads True Love. The next scene has its own progress bar. Date links open the Calendar
at her next birthday, anniversary, booked wedding
or expedition return. The page links to her actions, Ready scene and available night visits.

| Page | What fills it |
|---|---|
| Relationship | Current standing, the next scene, talks left today, shared night visits left, Greater Love and upcoming dates |
| Profile | Her name, birthday and schedule as known, gift tastes, signature dish, personal keepsakes and authored facts as their gates are reached |
| Abilities | Her calling, work ranks, skills and current farm role, with a link to her work orders |
| Chapters | Her relationship route and the normal links for Ready scenes and relationship actions |
| Scenes | Completed route chapters, evenings, calendar scenes, home vignettes, shared scenes and seen illustrations |
| Our Story | Dated relationship milestones, individual festival and expedition credits, the latest 32 outings and lifetime first, latest and best results |

The cover count combines the route chapters, playable evening kinds and calendar slots, discoveries and the main
relationship milestones. Variants of an evening share one slot. For instance a hangout, date and spouse evening at the
pond can all be replayed under Fishing. A festival's daytime story, its night story and the festival evening activity have
separate proof. Shared scenes, home vignettes, illustrations and rank or group awards sit outside the cover count. The
Library stamps Our Story with the first day the book was filled through play. Farm-wide achievements live in the Diary.

Locked scenes show a silhouette. Tap an earned tile to replay its scene or view seen illustrations. A replay costs
no actions and leaves scores, hearts, stock and journal history alone. The old Memory player can still collect an
illustration when it actually appears. A story update can move a calendar entry without losing its receipt, or withdraw a
script and leave its earned entry with replay unavailable. Older saves read evidence from the existing Memories,
illustrations and dated milestones. Where an older save has no proven date, the Library says **Date unknown**.

In the fresh-farm playthroughs, the default-story book filled all 55 entries on day 64. The authored book filled
all 59 on day 105, including its anniversary and a personal fact gated on Friendship 1.

#### The Book

**Tonight’s forecast** shows the current cash, the contents of the bin at tonight’s market prices, and the likely
takeout bill after the crew’s cooks work. **Bills due** includes food, upkeep and any arrears. **Cash after bills**
uses the same settlement as the night. Loans draw from shipping income only when enough cash remains to cover
the bills. Any shortfall shows the gold still owed.

**Recent nights** keeps seven settlements with actual shipping, food, upkeep and loan payments and their net.
The shipping chart keeps the older seven-night income history and compares it with today’s food and upkeep.
A new settlement adds the detailed figures even after the morning report is dismissed.

The upkeep breakdown, **Kitchen** link and household table show why the bill is what it is: mouths on the farm,
stocked meals, what the cooks can supply, and what will be bought in. The Book also lists outstanding loans,
estimated repayment dates and whether arrears are slowing your crew.

Then **the work board**: a card for each farmhand with her job, her actions today, what she'll do tonight and her tasks
in your order, and **Add a task** (see [the work board](#the-work-board)); with none, how to get one.

Then six cards, each a tap to its place:

| Card | Shows | A tap opens |
|---|---|---|
| Gold | The farm's gold | The bin |
| Farm Rank | The rank and its points | The Farm Rank's sheet |
| Goods | Every good the Warehouse holds | The Warehouse |
| On the farm today | The spouses in their rooms and the farmhands on their farm day, and how many you've met | People's Work view |
| To build | The places offered at this Farm Rank | The Diary's projects |

Its help says how the upkeep, food, a short night and the loans work, in five lines; the board's says how the
farmhands work and cook.

#### The Menu

"Every place" lists the 25 places on the map in six groups (Gathering, Stations, The ranch, Workshops, The yard, The town), each
with its count (the Fields count their ripe tiles, every plot's) and locked ones marked; a tap goes where a tap on the
map goes (the Fields to the field's screen). Then
Account, the "Ask before ending the day" switch, and the build's number.

### The field

Farming is by hand, one tile and one action at a time. The field is plots of 8 × 5 tiles, each a page of the field's own
screen: the farm starts with one, overgrown but for a small patch cleared, and clears more as it grows. You clear a tile,
till it, plant a seed, water it each day it grows, and harvest it once it's ripe. A watered tile grows one stage a
night; a dry one waits. Harvests sometimes give a seed back, and every harvest raises the crop's level on the farm.

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

The field is plots, each a grid of 40 tiles, eight across and five down. Plot 1 is the field the farm always had: on
day 1 a patch of nine at its top left is cleared, and every other tile is overgrown, drawn once for the account
(`draw(uid, 0, 'ground', i)`), so a farm always starts on the same field. Each tile holds its ground (weeds, a stone, a
stump, cleared or tilled), its crop, its stage, whether it's ripe, regrowing or from own seeds, and whether it's watered
today. The rules number every plot's tiles on from plot 1's (plot 1's 0–39, plot 2's 40–79), so every seeded draw keyed
by a tile (a harvest's stars, a seed back) replays on plot 1 exactly as it always did.

<!-- live:field -->
|  | The field |
|---|---|
| A plot | 40 tiles: 8 across, 5 down |
| Plots | 8: plot 1 from day 1, the rest cleared as the Farm Rank rises |
| Cleared on day 1 | 9, three by three at the top left |
| Weeds | 55% of the rest; clearing leaves nothing |
| A stone | 25% of the rest; clearing leaves a Limestone ★1 |
| A stump | 20% of the rest; clearing leaves a Pine Log ★1 |
<!-- /live -->

#### The field's plots

The field is a list of plots, each 8 × 5, a page each on the field's screen. The farm starts with plot 1 and clears more
as the Farm Rank rises, each after the one before: up to eight, one a Farm Rank from 3 to 9, 320 tiles in all, the
farm's biggest employer at scale ([the farm at scale](#the-farm-at-scale-10-20-and-50-umas)).

<!-- live:plots -->
| Plot | Opens | Costs | Starts |
|---|---|---|---|
| Plot 1 | Day 1 | — | 9 tiles cleared at its top left, the rest overgrown |
| Plot 2 | Farm Rank 3, after Plot 1 | 2,500g and an action; no upkeep | Wild: every tile overgrown, the account’s own draw |
| Plot 3 | Farm Rank 4, after Plot 2 | 5,000g and an action; no upkeep | Wild: every tile overgrown, the account’s own draw |
| Plot 4 | Farm Rank 5, after Plot 3 | 10,000g and an action; no upkeep | Wild: every tile overgrown, the account’s own draw |
| Plot 5 | Farm Rank 6, after Plot 4 | 15,000g and an action; no upkeep | Wild: every tile overgrown, the account’s own draw |
| Plot 6 | Farm Rank 7, after Plot 5 | 25,000g and an action; no upkeep | Wild: every tile overgrown, the account’s own draw |
| Plot 7 | Farm Rank 8, after Plot 6 | 35,000g and an action; no upkeep | Wild: every tile overgrown, the account’s own draw |
| Plot 8 | Farm Rank 9, after Plot 7 | 50,000g and an action; no upkeep | Wild: every tile overgrown, the account’s own draw |
<!-- /live -->

- **Clearing a plot** is like building a place, with an action: from its Farm Rank, its page's **Clear Plot 2 · 2,500g ·
  1 action** pays its gold and spends one of the day's actions, and the plot is the farm's **at once**, the next page of
  the field. "Need 400g more" or "No actions left today" greys the button while either lacks; before its Farm Rank the
  page says "Opens at Farm Rank 3" and shows no button, and from its Farm Rank a plot past the next says "Clear Plot 2
  first".
- **A new plot is wild:** every tile overgrown, weeds, stones and stumps by the account's own draw (`draw(uid, 0,
  'ground', 40 × p + i)`, p its index: `40 + i` for plot 2), with no cleared patch. Clearing its tiles leaves their logs
  and limestone as plot 1's do, and a farmhand's **Clear and till** works it a row at a time.
- **A plot adds no upkeep:** it's land, not a building ([upkeep](#upkeep) counts places built, houses, beds and Umas).
  Its cost is its gold and the work its tiles take.
- **Everything on the field reads every plot:** a tile's actions, the night's growth and withering, the night chores'
  watering, the morning's counts and nudges, the nudge on End the day, the sign's counts and the Menu's ripe tiles.

#### The field's screen

A tap on the field's sign (or the Menu's Fields, or a morning line about the field) opens the field's own screen,
`/field`, **full screen**: no rail and no bar, the plot as big as the phone allows. A cleared plot opens in HD-2D when WebGL is available. Its tiles and row tabs open the same action panels. Choose **Grid** in the header to switch views. The field stays playable in Grid if the 3D view is unavailable. Planted crops develop their own colors and shapes as they grow. Ripe produce shows its item art on the plant. Harvested orchard trees and shrubs keep their branches in the field.

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ‹ Farm   Plot 1                ━ ◦   ⓘ   ⏱ 7/10  [☾ End day]                         │  the strip
│          6 to water · 2 ripe   (page dots: plot 1 lit, plots 2–8 with a lock)        │
├──────────────────────────────────────────────────────────────────┬───────────────────┤
│ (‹)  1 ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢  (›)                                      │ a tile's panel or │
│      2 ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢     big tiles, 36–88 points, as the space  │ a row's, at the   │
│      3 ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢     allows; the plot narrows beside a panel│ right             │
│      4 ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢                                           │                   │
│      5 ▢ ▢ ▢ ▢ ▢ ▢ ▢ ▢     ◄ a swipe across the plot turns the page ►                 │
└──────────────────────────────────────────────────────────────────┴───────────────────┘
```

- **The strip** along the top: **‹ Farm** back to the farm map; the plot's name and its counts ("6 to water · 2 ripe ·
  3 to plant"; with none of those, what it still needs, "31 to clear or till", or "Nothing due"); the **page dots**, a dot a plot (the one shown lit, a lock on one not cleared yet,
  each a tap to its page); the help button; the day's actions left and **End the day**, as the bar has them.
- **A page is a plot:** its five rows of eight tiles, each drawn as on the farm before: weeds, a stone, a stump, cleared
  ground, tilled soil (darker, with a droplet, once watered), then the crop: seeds, a sprout, its own icon growing, and
  ringed once ripe. The tiles are as big as the screen allows, 36 to 88 points (about 62 on an 844 × 390 phone).
- **Turning the page:** the dots, the arrows at the plot's left and right (‹ and ›, each naming the page it goes to;
  they step aside while a panel is open, so the tiles keep their size), a swipe across the plot, or the arrow keys. The page is `?plot=<n>` (plot 1 has none).
- **A tile's tap** opens its panel at the right (`?tile=<i>`, its tile on that plot, 0–39): what's on it, how far it's
  grown, and its one action (see [a tile's actions](#a-tiles-actions)). Another tile's tap moves the panel to it; Close
  or Escape puts it away. The plot narrows to keep every tile beside the panel in view.
- **A plot not cleared yet** shows its wild ground dimmed under a card: its name, a lock, what opens it ("Opens at Farm
  Rank 3", or "Ready to clear" once it can be), "Farm Rank 3 · 2,500g and an action. It opens at once, wild: clear and
  till its tiles. No upkeep.", and, from its Farm Rank, its **Clear** button. Once cleared, its page shows its tiles and
  "Plot 2 is yours: clear and till its tiles."
- **A row's tab,** at the left of each row: its number; the face of the first farmhand whose field task reaches it; and
  a droplet once one of them waters the whole row in one action (Watering 6). A tap opens the **row's panel**
  (`?row=<r>`): what the row holds ("2 to water · 1 ripe"), each farmhand on it with her task, her aptitude and what she
  does there an action ("Watering 6 · the whole row in one action", "Harvesting 2 · a tile an action"), "No farmhand
  works this row." with none, a line that the farmer's own tools work a tile at a time (no tool of his works a row yet),
  and **The work board** in the Book, where her tasks are set.
- **Moving inside the screen** (a page, a tile, a row) replaces where you are rather than adding to it, so **‹ Farm**
  and Back both go to the farm map.
- **Its help** says how the field works in four short lines: plots and pages, a tile's action, a row's tab, and a new
  plot's clearing.

#### The crops

There are 51 plantables, including 46 sold in town and five earned as rare seeds. Annuals grow in their listed
seasons. Trees and shrubs can be planted whenever you have seed and bear fruit in their listed season.
The watered nights column gives the time to an annual's first harvest or to an orchard plant's establishment.
Prices and refined forms in the table are for base-grade produce.

<!-- live:crops -->
| Crop | Id | Kind | Seasons | Grades | Shop | Seed | Watered nights | Yield | Regrows | Price ★1 | Refined at |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Carrot | `carrot` | Annual | Spring | G1–G2–G3 | Farm Rank 1 | 20g | 4 | 1 | — | 60g | Carrot Pickles (Sawmill) |
| Potato | `potato` | Annual | Spring | G2–G3–G4 | Farm Rank 1 | 35g | 6 | 2 | — | 55g | — |
| Mint | `mint` | Annual | Spring | G2–G3–G4 | Farm Rank 1 | 40g | 4 | 1 | every 3 | 45g | Dried Mint (Sawmill) |
| Onion | `onion` | Annual | Spring, Autumn | G4–G5–G6 | Farm Rank 2 | 30g | 5 | 1 | — | 100g | — |
| Cabbage | `cabbage` | Annual | Spring, Winter | G3–G4–G5 | Farm Rank 2 | 90g | 8 | 1 | — | 260g | — |
| Asparagus | `asparagus` | Annual | Spring | G8–G9–G10 | Farm Rank 4 | 150g | 10 | 1 | — | 480g | — |
| Tomato | `tomato` | Annual | Summer | G5–G6–G7 | Farm Rank 1 | 50g | 7 | 1 | every 3 | 70g | Tomato Sauce (Sawmill) |
| Basil | `basil` | Annual | Summer | G1–G2–G3 | Farm Rank 1 | 40g | 4 | 1 | every 3 | 45g | Dried Basil (Sawmill) |
| Bell Pepper | `bell-pepper` | Annual | Summer | G6–G7–G8 | Farm Rank 1 | 60g | 6 | 1 | every 3 | 60g | — |
| Eggplant | `eggplant` | Annual | Summer | G7–G8–G9 | Farm Rank 2 | 70g | 6 | 1 | every 4 | 95g | — |
| Sunflower Seed | `sunflower-seed` | Annual | Summer | G2–G3–G4 | Farm Rank 2 | 70g | 8 | 3 | — | 75g | Sunflower Oil (Mill) |
| Corn | `corn` | Annual | Summer, Autumn | G5–G6–G7 | Farm Rank 4 | 80g | 9 | 1 | every 4 | 140g | Cornmeal (Mill) |
| Wheat | `wheat` | Annual | Autumn | G1–G2–G3 | Farm Rank 1 | 25g | 5 | 2 | — | 40g | Wheat Flour (Mill) |
| Peanut | `peanut` | Annual | Autumn | G1–G2–G3 | Farm Rank 1 | 30g | 4 | 2 | — | 35g | Peanut Butter (Mill) |
| Rice | `rice` | Annual | Autumn | G4–G5–G6 | Farm Rank 1 | 35g | 6 | 2 | — | 50g | Polished Rice (Mill) |
| Sugar Beet | `sugar-beet` | Annual | Autumn | G3–G4–G5 | Farm Rank 2 | 40g | 6 | 1 | — | 120g | Beet Sugar (Mill) |
| Emperor Pumpkin | `emperor-pumpkin` | Annual | Autumn | G10 | Farm Rank 4 | 250g | 10 | 1 | — | 600g | — |
| Buckwheat | `buckwheat` | Annual | Winter | G7–G8–G9 | Farm Rank 1 | 30g | 4 | 1 | — | 75g | Buckwheat Flour (Mill) |
| Oats | `oats` | Annual | Winter | G2–G3–G4 | Farm Rank 1 | 25g | 5 | 2 | — | 40g | Rolled Oats (Mill) |
| Barley | `barley` | Annual | Winter | G3–G4–G5 | Farm Rank 1 | 30g | 5 | 2 | — | 45g | Pearl Barley (Mill) |
| Rye | `rye` | Annual | Winter | G6–G7–G8 | Farm Rank 2 | 40g | 6 | 2 | — | 60g | Rye Flour (Mill) |
| Ginger | `ginger` | Annual | Winter | G5–G6–G7 | Farm Rank 4 | 120g | 9 | 2 | — | 200g | Ground Ginger (Sawmill) |
| Golden Carrot | `golden-carrot` | Annual | Spring | G9 | Rare | — | 6 | 1 | — | 600g | — |
| Sunwheat | `sunwheat` | Annual | Summer | G10 | Rare | — | 7 | 2 | — | 260g | Sunwheat Flour (Mill) |
| Moonrice | `moonrice` | Annual | Autumn | G9 | Rare | — | 7 | 2 | — | 240g | Moonrice Flour (Mill) |
| Wild Rice | `wild-rice` | Annual | Summer | G8 | Rare | — | 6 | 2 | — | 160g | Hulled Wild Rice (Mill) |
| Mandrake | `mandrake` | Annual | Winter | G9 | Rare | — | 8 | 1 | — | 520g | Mandrake Powder (Sawmill) |
| Radish | `radish` | Annual | Spring | G1–G2–G3 | Farm Rank 1 | 20g | 3 | 1 | — | 55g | — |
| Lettuce | `lettuce` | Annual | Spring | G2–G3–G4 | Farm Rank 1 | 30g | 5 | 1 | — | 85g | — |
| Green Peas | `green-peas` | Annual | Spring | G3–G4–G5 | Farm Rank 2 | 50g | 5 | 2 | every 3 | 65g | — |
| Strawberry | `strawberry` | Annual | Spring | G2–G3–G4 | Farm Rank 2 | 65g | 5 | 2 | every 3 | 45g | Strawberry Jam (Mill) |
| Raspberry | `raspberry` | Shrub | Spring | G3–G4–G5 | Farm Rank 3 | 130g | 6 | 3 | each bearing season | 55g | Raspberry Jam (Mill) |
| Plum | `plum` | Tree | Spring | G4–G5–G6 | Farm Rank 4 | 220g | 8 | 3 | each bearing season | 70g | Plum Preserve (Mill) |
| Cucumber | `cucumber` | Annual | Summer | G2–G3–G4 | Farm Rank 1 | 40g | 5 | 1 | every 3 | 85g | — |
| Okra | `okra` | Annual | Summer | G4–G5–G6 | Farm Rank 2 | 55g | 5 | 1 | every 3 | 95g | — |
| Zucchini | `zucchini` | Annual | Summer | G3–G4–G5 | Farm Rank 2 | 50g | 6 | 2 | — | 80g | — |
| Peach | `peach` | Tree | Summer | G3–G4–G5 | Farm Rank 3 | 180g | 7 | 3 | each bearing season | 55g | Peach Preserve (Mill) |
| Blueberry | `blueberry` | Shrub | Summer | G4–G5–G6 | Farm Rank 3 | 150g | 6 | 3 | each bearing season | 70g | Blueberry Jam (Mill) |
| Mango | `mango` | Tree | Summer | G7–G8–G9 | Farm Rank 6 | 360g | 8 | 3 | each bearing season | 155g | Mango Pulp (Mill) |
| Turnip | `turnip` | Annual | Autumn | G1–G2–G3 | Farm Rank 1 | 25g | 4 | 1 | — | 65g | — |
| Sweet Potato | `sweet-potato` | Annual | Autumn | G3–G4–G5 | Farm Rank 2 | 50g | 5 | 2 | — | 80g | — |
| Winter Squash | `winter-squash` | Annual | Autumn | G6–G7–G8 | Farm Rank 4 | 105g | 8 | 2 | — | 160g | — |
| Apple | `apple` | Tree | Autumn | G1–G2–G3 | Farm Rank 2 | 100g | 6 | 3 | each bearing season | 35g | Apple Preserve (Mill) |
| Pear | `pear` | Tree | Autumn | G2–G3–G4 | Farm Rank 3 | 160g | 7 | 3 | each bearing season | 45g | Pear Preserve (Mill) |
| Grape | `grape` | Shrub | Autumn | G6–G7–G8 | Farm Rank 4 | 260g | 7 | 3 | each bearing season | 120g | Grape Jelly (Mill) |
| Leek | `leek` | Annual | Winter | G2–G3–G4 | Farm Rank 1 | 30g | 4 | 1 | — | 75g | — |
| Cauliflower | `cauliflower` | Annual | Winter | G5–G6–G7 | Farm Rank 2 | 65g | 6 | 2 | — | 115g | — |
| Red Beet | `red-beet` | Annual | Winter | G3–G4–G5 | Farm Rank 2 | 45g | 5 | 2 | — | 85g | — |
| Orange | `orange` | Tree | Winter | G5–G6–G7 | Farm Rank 4 | 220g | 7 | 3 | each bearing season | 95g | Orange Marmalade (Mill) |
| Persimmon | `persimmon` | Tree | Winter | G6–G7–G8 | Farm Rank 4 | 245g | 7 | 3 | each bearing season | 120g | Persimmon Preserve (Mill) |
| Pomegranate | `pomegranate` | Tree | Winter | G8–G9–G10 | Farm Rank 6 | 375g | 8 | 3 | each bearing season | 200g | Pomegranate Molasses (Mill) |
<!-- /live -->

#### The shop's seeds

The shop in town offers twelve seeds per season, from Farm Ranks 1, 2, 3, 4 and 6. A line shut by its rank still
shows, with "From Farm Rank 2". The list changes on a season's first
day and never runs out. Onion sells in Spring and Autumn and Cabbage in Spring and Winter; Corn sells in Summer only,
though it grows on into Autumn. Seeds go into the Warehouse at ★1, and never sell at the bin.

From **Farm Rank 6**, the morning awards one seed of each rare crop for its growing season each year.
Spring brings Golden Carrot, Summer brings Sunwheat and Wild Rice, Autumn brings Moonrice, and Winter brings
Mandrake. Save unused seed for a later year. The prize itself grants no crop discovery.

The season's seeds by the Farm Rank that opens them:

<!-- live:shop-seeds -->
| Season | Farm Rank 1 | Farm Rank 2 | Farm Rank 3 | Farm Rank 4 | Farm Rank 6 |
|---|---|---|---|---|---|
| Spring | Carrot 20g, Potato 35g, Mint 40g, Radish 20g, Lettuce 30g | Onion 30g, Cabbage 90g, Green Peas 50g, Strawberry 65g | Raspberry 130g | Asparagus 150g, Plum 220g |  |
| Summer | Tomato 50g, Basil 40g, Bell Pepper 60g, Cucumber 40g | Eggplant 70g, Sunflower Seed 70g, Okra 55g, Zucchini 50g | Peach 180g, Blueberry 150g | Corn 80g | Mango 360g |
| Autumn | Wheat 25g, Peanut 30g, Rice 35g, Turnip 25g | Sugar Beet 40g, Onion 30g, Sweet Potato 50g, Apple 100g | Pear 160g | Emperor Pumpkin 250g, Winter Squash 105g, Grape 260g |  |
| Winter | Buckwheat 30g, Oats 25g, Barley 30g, Leek 30g | Rye 40g, Cabbage 90g, Cauliflower 65g, Red Beet 45g |  | Ginger 120g, Orange 220g, Persimmon 245g | Pomegranate 375g |
<!-- /live -->

#### A tile's actions

A tap on a tile, on the field's screen, opens its panel: its ground or crop, where it is ("Row 2, tile 3", with its plot
once the farm has two: "Plot 2 · Row 2, tile 3"), a line on what it takes next, its one action, and the day's actions
left. A weeds tile's panel also offers **Cut grass for the silo · 1 action** once the silo stands. Each action is one of the day's ten, and says what it did:

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
  the shop, in town** (over the field's screen). The first planting of a crop adds it to the farm's crops at level 1.
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
  quality points: the crop's level (+0.1 a level above 1) and the Hoe (+0.125 a tier above Basic). At crop level 1
  that's always ★1. Every farm starts with a Basic Hoe and can upgrade it at the Forge.
- **Seeds back:** each harvest may drop one own seed of its crop: 5%, and +2 percentage points per Hoe tier above Basic.
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

#### Crop grades and saved seeds

Each shop crop has a base grade and up to two higher grades, capped at G10. Rare crops keep their original single
grade. Each grade has its own produce and seed counts, with ★1–5 quality on the produce. Golden Carrot is its own
crop. Grades of one species take the same time to grow.

- In a crop's Warehouse sheet, **Save** turns up to four units of one grade into the same number of seeds for
  one action, starting with the lowest stars. **Improve** gives seed one grade higher at 3 crop points for the
  first increase and 12 for the second. A random seed return inherits the planting's grade. All own seed doubles
  the knowledge earned when harvested. The five rare crops use seed prizes and natural returns.
- **Save seed** on the Work board names a species, source grade, whether to improve it and how many saved seeds
  to keep. It trains Planting. Multiple Umas use the same stock and stop at the shared target. Put it after Harvest
  and before Plant to use the result in one shift.
- **Reserve** sets a floor for an exact grade across stars. Automatic seed saving, plain meals and station loads
  use the surplus. A manual seed action can spend reserved stock when you choose it explicitly.
- The first harvest of an exact grade is remembered in **Crop discoveries** on the Crops and Fruits tabs and
  appears in the morning. Foraging a shared crop such as a wild Apple proves its base grade too. Produce in stock
  and unplanted seeds grant no proof. Legacy crop points prove a base harvest, with the carrot pilot's exact
  discovery retained.
- Grades ship at their own prices and record separate Diary entries. The first upgrade sells for 1.2× base
  and the second for 1.45× base, rounded to 5g. Grades of one crop share a market crate and easing. Collection rows
  accept any grade of the specified crop.

#### Seasonal row plans

Open a row on the field and choose a season, crop and planting grade. A row with a plan can wait through an unset
season. **Any annual in season** uses base seeds, preferring saved ones. Orchard plants require a named assignment,
so a farmer covering a field does not accidentally plant a permanent tree. Assign the normal field tasks in the
Work board and copy an assignment to a backup as needed. The row panel previews work still outstanding tonight.

**Harvest next grade when skilled** waits for Harvesting 4 at a crop's base grade or 7 at the next grade. A qualified
Uma upgrades one unit per tile and keeps extra yield at the planted grade. A backup can water the row without the
harvest skill. You can still pick the planted grade by hand.

#### The orchard

Trees and woody shrubs occupy ordinary field tiles. A sapling needs its listed watered nights to establish, even
across a season change. After establishment the tile needs no water. It sets a crop on the first morning of its
bearing season or when it establishes during that season. Ripe fruit waits indefinitely. If a pick is still waiting
when the next bearing season starts, it occupies that season's slot.

After a pick the plant stays on its tile through dormancy. **Remove orchard plant**, then confirm, spends one action
and leaves tilled soil. Removing a plant is the way to replace its planted grade. The eight orchard fruits already
found in the woods retain their original goods, prices and forage sources. Their base preserves still use the Mill.

#### Regrowing

Mint, Tomato, Basil, Bell Pepper, Green Peas, Strawberry, Cucumber and Okra regrow in 3 watered nights, Eggplant and Corn in 4. After a harvest the tile keeps
its crop and starts again at stage 0, so it needs watering again. It keeps its seed's kind, own or the shop's, for its
crop points. Out of its season a regrowing crop doesn't start again: a ripe Tomato harvested on Autumn 1 leaves the tile
empty.

#### Withering

On a season's last night, after the night's growth and before the date turns, every annual still growing (a regrowing one
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

Each Uma's farming rank needs its points and its challenge. A farmhand's harvests count toward hers; the farmer's own
count toward no Uma's challenge. Ranks are described with the Umas and the farm's progress.

The challenge toward each farming rank:

<!-- live:farming-challenges -->
| Toward | Challenge | Counted |
|---|---|---|
| Hand | Harvest 30 crops she tended | At harvest, for the tender |
| Skilled | 40 crops of ★3+ she tended | At harvest, for the tender |
| Expert | Tend a crop of level 4+ to harvest | At harvest, for the tender |
| Master | 30 crops of ★5 | At harvest, for the tender |
| Legend | 1st at a Flower Show with a crop she tended | Name her as the grower of a winning boxed harvest |
<!-- /live -->

#### The field at night

- **Step 2:** every growing tile watered today grows a stage; one whose stages reach its days − 0.5 turns ripe. Then
  every tile dries.
- **Step 7:** on a season's last night, crops that don't grow next season wither.
- **The morning** says "The field · 5 crops grew · 2 ripe", then what withered ("The field · 3 Onion withered"), each
  opening the field's screen; and under Today, "5 tiles to water" while crops grow, and "9 tiles to plant" while seeds you
  hold for the season could fill empty tilled tiles.

#### The romance in the field

The romance's perks reach the field through the night and through the farmhands: side by side's and the perks' extras
copy a farmhand's harvest, her keepsake lifts her harvests' stars at her line's place, and farmhands who work the field
the same day build their bond ([farmhands](#farmhands)). The farmer's own harvests get none.
- **Night chores:** each of a farmer Uma's chores waters a dry growing tile tonight, a seeded pick, so it grows; the
  morning says "Night chores · 2 tiles watered".
- **Praise:** a ★3+ crop a farmhand harvests earns her praise; the farmer's earn no one's.

### Gathering

The farmer gathers by hand at the farm's edges: the woods' edge, where he forages and chops, and the pond's edge, where
he fishes. Each is one action and brings its goods home at once, straight into the Warehouse. The Farm Rank opens deeper
areas and spots, whose goods are worth more.

```
 the woods' edge ──Forage · 1──► 2 of the area's season's finds  ─┐
                 ──Chop · 1────► 2 logs of the area's woods       ├─► the Warehouse, at their stars, now
 the pond's edge ──Fish · 1────► 1 fish, measured as it lands    ─┘   (a record when it's the biggest of its kind)
 the Farm Rank opens each deeper area and spot (the sea's also wait for the Dock and the Boat)
 each area and spot: 4 full hauls a day (yours and the farmhands' together), then thin: half hauls
```

#### A forage, a chop, a catch

- **One action, one haul,** at one area or one spot, as often as the day's actions allow: full the first four times a
  day at each place, then thin ([thin](#thin-four-full-hauls-a-place-a-day)). What it brings goes into the Warehouse at
  once, and the panel says so: "Foraged · +Pine Log, Shiitake", "Chopped · +Pine Log, Birch Log", "Carp ★1 · 38.4 cm"; a
  thin spot's cast that lands nothing, "Nothing bit: it's thin here today".
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

#### Thin: four full hauls a place a day

A place gives so much a day. Each forest area, fishing spot and dig gives full hauls the first four times a day, yours by
day and the farmhands' at night together; past them it's **thin**, half hauls. So gathering takes a few hands a place,
not any number, and a farm of many Umas spreads them over its places and its other work
([the farm at scale](#the-farm-at-scale-10-20-and-50-umas)).

<!-- live:thinning -->
|  | The rule |
|---|---|
| A place | Each forest area (6), fishing spot (7) and dig (the Mine, the Quarry): 15 places |
| Full hauls | The first 4 a day at each place: a forage, a chop, a catch or a face, the farmer’s by day and the farmhands’ at night together |
| Thin | Past the 4: half a haul (×0.5), the fraction drawn (`draw(uid, day, 'thin:<place>', n)`): a forage of 2 brings 1, a cast lands a fish half the time |
| Its day | Counted in `today.hauls`, cleared with the day at night step 7: a new day starts every place full |
<!-- /live -->

- **Hauls share one daily limit:** four morning forages of yours at the Woods leave it
  thin for a farmhand foraging there tonight. The work board's **Tonight** shows what she'll bring as the farm stands.
- **Each panel says it:** an area's or a spot's row on the woods' and the pond's panels, and a dig's panel, show "3 full
  hauls left" once a haul is taken today, then **Thin · half hauls** ("half finds" at a dig).
- **Thin isn't nothing:** a thin forage still brings one find, a thin chop one log, and a farmhand's three finds one or
  two; a thin cast lands a fish half the time.
- **The save:** `today.hauls` (each place's hauls today), written once the day's first haul is, and cleared with the day.

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
own length; it never stacks. A wedding's reception, a spouse's breakfast, the household's meals (once married,
[cooked by you](#the-households-meals): everyone on the farm and every farmhand, for today and tomorrow) and **a ★2+
meal from the pantry** (eaten at night: through tomorrow, [food](#food)) and **the staff meal** (by its lowest stars, on
the reception's table: ★1–2 through tomorrow, ★3–4 two days, ★5 three, [the staff meal](#the-staff-meal)) feed the
Umas. A household meal and a good
meal the same night are still two days, counted down once. **A farmhand well fed this morning works one more action today** (once a meal, the day after
it's cooked: [her day](#her-day)), and while she's well fed (the meal's day and the next) her work is too: +0.25
quality and ×1.25 rank points. Her hauls and faces aren't bigger for it: the one more action is the meal's reward (F91 took
off the quarter more on every haul: with it, a ★2 meal a night nearly doubled a farm's income, [the farm at
scale](#the-farm-at-scale-10-20-and-50-umas)).

#### The woods' and the pond's panels

- **A tap on the woods' edge** opens its panel at the right: each forest area with its name, its season's finds as
  icons, and **Forage · 1** and **Chop · 1**, or why it's shut ("Opens at Farm Rank 2"), and today's hauls there ("3 full
  hauls left", then **Thin · half hauls**); then the day's actions left.
- **A tap on the pond's edge** opens the same for its spots, with **Fish · 1**.
- **The help (i)** of the map says how the day's actions work.

#### The romance in gathering

The perks that ride on an Uma's work (side by side, the perks' extras, her keepsake on a haul, bonds at work) wait for
the farmhands. One reaches the Warehouse every night:
- **Night chores:** a forager brings one item a chore from her deepest open area this season, a fisher one fish from her
  deepest open spot, at a day's haul's stars, straight into the Warehouse (1 chore from Friendship 6, 2 from Romance 7, 3
  from Spouse 4). The morning's Hearts section says "Night chores · 3 items". The perks are the romance's.

#### Catch grades

Choose a catch mode at a spot. A Fish assignment can follow that setting or specify its own.

| Mode | Qualification by hand | Uma qualification | Promotion |
|---|---|---|---|
| Standard | Any | Any | Base grade |
| Improved catch | 12 landed manual catches | Fishing 4 | Every third eligible catch of the same species gets one grade higher |
| Select catch | 40 landed manual catches | Fishing 7 | Every fifth eligible catch of the same species gets two grades higher |

Progress is shared across workers and spots for the same species and mode. The game still draws the actual species
and its stars and length as before. A miss, an unqualified cast or a passive night chore adds no promotion progress.
Silverfin can reach G10 with Improved catch. Rainbow Koi is already G10. The Diary keeps the length record by species,
and a record from an older save proves that species' base grade. The Smokehouse makes a fillet at the exact input
grade and stars.

### The ranch

The Coop and the Barn hold the farm's animals. Each day an animal wants feeding and care, an action each, and gives its
good (an egg, milk, wool or fleece) each night it was fed, waiting in its building until you collect it. Care makes it
fonder, and the fonder it is the better its goods' stars. Its feed comes from the silo: grass cut from the field's weeds,
or fodder bought at the rancher's in town.

```
 the rancher's, in town ──Buy (free there)──► an animal, into its home at once (the Coop or the Barn, 8 each)
                        ──Fodder (free there)─► feed into the silo, 10g a feed
 a weeds tile ──Cut grass · 1──► 5 feed into the silo; the weeds grow back
 each animal, each day ──Feed · 1──► a feed from the silo   ──the night──► its good waits in its building; +2 fondness
                       ──Care · 1──► +8 fondness at once      unfed      ──► no good; −10 fondness; it never dies
 a building ──Collect · 1──► every good waiting, into the Warehouse, its stars by the animal's hearts
```

#### Building the Coop and the Barn

The Coop is offered at Farm Rank 2 (2,000g, 30 logs, 20 vegetables) and the Barn at Farm Rank 3 (3,500g, 30 logs, 20
vegetables), built like every place (see [Building](#building)), each 15g of upkeep a night once it stands. The **silo**
stands with the first of them and holds 200 feed for both.

#### The animals

Seven animals, at the rancher's from their Farm Rank once their home stands. Every one gives its good each night it's
fed; the wool and the two fleeces are uma-art's fibers, and the Mill weaves them into cloth. The eggs and milk are the
farm's own goods, on uma-art's items atlas from 2.30.0.

**Collection grade caps** are shared by product. Standard collects the base grade. The first upgrade needs three
hearts. The second needs nine hearts, or seven if the collector has Animal care 6. The cap chooses the highest grade
the animal and collector qualify for. The panel shows the grade waiting for manual collection. Stars still use
fondness and worker quality. A **Feed only** assignment covers feed and grass for the silo and leaves collection
and care for another worker. With an empty silo and no weeds to cut, an automatic worker can spend one action at
10g per ration to buy enough fodder for the animals still hungry today, up to the cash and silo room available.
The purchase appears under **Fodder · crew** in the Ledger. Feeding uses the crew's usual actions afterward.

<!-- live:animals -->
| Animal | Lives in | At the rancher’s | Opens at | Gives, each night it’s fed | ★1 | ★5 (10 hearts) | At the Mill |
|---|---|---|---|---|---|---|---|
| Chicken | The Coop | 500g | Farm Rank 2 | Egg (`egg`) | 60g | 120g | Preserved Egg, 90g |
| Duck | The Coop | 1,200g | Farm Rank 3 | Duck Egg (`duck-egg`) | 100g | 200g | Preserved Duck Egg, 150g |
| Cow | The Barn | 1,500g | Farm Rank 3 | Milk (`milk`) | 80g | 160g | Cultured Yogurt, 120g |
| Goat | The Barn | 2,500g | Farm Rank 4 | Goat Milk (`goat-milk`) | 130g | 260g | Goat Cheese, 325g |
| Sheep | The Barn | 2,000g | Farm Rank 3 | Wool (`wool`) | 100g | 200g | Wool Cloth, 150g |
| Alpaca | The Barn | 3,500g | Farm Rank 5 | Alpaca Fleece (`alpaca-fleece`) | 130g | 260g | Alpaca Cloth, 195g |
| Cashmere Goat | The Barn | 5,000g | Farm Rank 6 | Cashmere Fleece (`cashmere-fleece`) | 170g | 340g | Cashmere Cloth, 255g |
<!-- /live -->

#### Feed, care and fondness

<!-- live:ranch-rules -->
|  | The rule |
|---|---|
| Room | 8 animals in the Coop, 8 in the Barn |
| The silo | Stands with the first of the Coop and the Barn; holds 200 feed |
| Feed | Grass: cut a weeds tile (1 action) for 5, the weeds growing back. Fodder: 10g a feed at the rancher’s, 1 to 99 at a time |
| Feed one | 1 action, one feed from the silo, once a day |
| Care for one | 1 action, once a day: +8 fondness at once (a farmhand’s +1 more a level of Animal care above 1) |
| Collect | 1 action: every good waiting in the building, into the Warehouse |
| A fed night | It makes its good, waiting until collected (one at a time); +2 fondness |
| A hungry night | No good; −10 fondness, never below 0. It never dies |
| Hearts | A heart every 20 fondness, ten at 200 |
| Stars | Its hearts ÷ 2.5 in quality (★1 at 0 hearts, always ★5 at 10), and a farmhand’s +0.1 a level of Animal care above 1 |
<!-- /live -->

- **Buying** needs you in town (going in is its action), the animal's home built, its Farm Rank and room in its home;
  each moves in at once, named by its kind and number ("Chicken 2"), fondness 0. Refusals: "Build the Barn first.",
  "Opens at Farm Rank 3.", "The Coop is full.", "Not enough gold".
- **Feeding** is once a day an animal ("Fed already today."), and needs a feed in the silo ("The silo is empty: cut
  grass or buy fodder."). **Care** is once a day ("Cared for already today."). **Collect** needs a good waiting ("Nothing
  to collect yet.").
- **Grass** needs the silo standing ("Build the Coop or the Barn first: its silo holds the grass.") and room in it ("The
  silo is full."); a cut fills what room is left, up to 5. Only weeds give grass ("Only weeds give grass.").
- **The night** (step 3) makes each fed animal's good and counts its fondness; the morning's Work done says each
  building's night: "The Coop · 3 goods to collect", with "2 went hungry" and a **Feed them** warning when any did.
- **Stars:** each good draws its stars when collected, from its animal's hearts (hearts ÷ 2.5 in quality, so 10 hearts is
  always ★5), seeded by the farm's count of the ranch's goods (`draw(uid, day, 'ranch:<kind>', n)`).

#### The Coop's and the Barn's panels

- **Built:** the silo's feed, with a bar and a nudge when it runs low; **Collect 3 · 1 action** (or "Nothing to collect
  yet"); and each animal: its good's icon, its name, its hearts (ten marks), today's chips (Fed or Hungry, Cared for, its
  good waiting), **Feed · 1** and **Care · 1**. With no animals: "No animals yet. Buy them at the rancher's, in town."
- **The rancher's** (in town, her post's **Buy an animal** or **Buy fodder**): a wide panel with the seven animals, each
  with its home, its good and that good's price, and **Buy · 500g** or why not; and the silo's fodder, 10 or 40 at a
  tap, or **Fill it**, up to its room.

#### The romance at the ranch

A ranch Uma's perks act once the Coop or the Barn stands ([at her line](#at-her-line)): the goods she collects on her
care task come home with her romance term's chance of an extra (+10% at Friendship 2, +20% at Romance 5), and her night
chores give each animal in her building +5 fondness (1 chore from Friendship 6, 2 from Romance 7, 3 from Spouse 4). Her
morning items are eggs, milk and fleece of the animals the farm keeps, and her signature dish's grade is their best
good's. The morning's Hearts section says "Night chores · +10 fondness" and "Perks · +1 item".

### The Mine and the Quarry

The Mine and the Quarry are worked floor by floor. A face is one action on the deepest floor reached and brings two
finds: ores at the Mine, stones and gems at the Quarry, each three floors a grade deeper, so the finds grow rarer as you
go down. The faces you work there find the floor's stairs; taking them is free, and the deepest floor reached is kept.
A dig thins as an area does: four full faces a day, yours and the farmhands', then half finds
([thin](#thin-four-full-hauls-a-place-a-day)); a thin face still counts toward the stairs.

```
 a dig, built ──Work a face · 1──► 2 finds of the floor's grade (or the next) ──► the Warehouse, at their stars, now
                                   and a face more toward the floor's stairs (half the finds past four faces a day)
 the stairs found (after 1 + ⌈floor ÷ 5⌉ faces) ──Take the stairs · free──► the next floor down, as deep as the Farm Rank reaches
 the deepest floor reached is kept: the next face is there
```

#### Building the Mine and the Quarry

The Mine is offered at Farm Rank 4 (10,000g, 60 planks), with its Smelter; the Quarry at Farm Rank 5 (12,000g, 50
planks), with its Cutter. Each is 15g of upkeep a night once it stands.

#### Floors and finds

Thirty floors each. A find's grade is the floor's 70% of the time, the grade below 20% (the floor's own on floors 1–3)
and the grade above 10% (held to G10); at the Quarry it's a stone 70% or a gem 30% of that grade. Each find draws its
stars from the farmer's quality (Novice D and ★1) or the working Uma's terms. Every pick is seeded by the farm's count of finds at the dig (`draw(uid, day, 'dig:<dig>', n)`, its kind
`'dig-kind:<dig>'` and its stars `'dig-stars:<dig>'`).

<!-- live:dig-floors -->
| Floors | Grade | The Mine (ore) | The Quarry (stone 70%, gem 30%) | Faces to the stairs | The farmer reaches it at |
|---|---|---|---|---|---|
| 1–3 | G1 | Copper Ore | Limestone or Quartz | 2 | Farm Rank 1 |
| 4–6 | G2 | Tin Ore | Sandstone or Amethyst | 2 or 3 | Farm Rank 1; floor 6 at 2 |
| 7–9 | G3 | Iron Ore | Slate or Citrine | 3 | Farm Rank 2 |
| 10–12 | G4 | Silver Ore | Granite or Garnet | 3 or 4 | Farm Rank 2; floor 11 at 4 |
| 13–15 | G5 | Cobalt Ore | Basalt or Emerald | 4 | Farm Rank 4 |
| 16–18 | G6 | Gold Ore | Marble or Sapphire | 5 | Farm Rank 6 |
| 19–21 | G7 | Platinum Ore | Obsidian or Ruby | 5 or 6 | Farm Rank 6; floor 21 at 8 |
| 22–24 | G8 | Titanium Ore | Jade or Diamond | 6 | Farm Rank 8 |
| 25–27 | G9 | Mythril Ore | Runestone or Starstone | 6 or 7 | Farm Rank 8; floor 26 at 10 |
| 28–30 | G10 | Orichalcum Ore | Meteorite or Philosopher's Stone | 7 | Farm Rank 10 |
<!-- /live -->

- **The stairs:** each face on the deepest floor counts toward its stairs, 2 faces on floors 1–5 up to 7 on floors 26–29;
  floor 30 has none. A farmhand's faces count too; the farmer takes them. Refusals: "Find the stairs first: 1 more
  face.", "Floor 16 opens at Farm Rank 6.", "This is the deepest floor."
- **The farmer's reach** is the Farm Rank's, as the forest's: floor 15 when the Mine opens at Farm Rank 4, 20 at 6, 25 at
  8, 30 at 10.
- **Its panel:** the floor and its grade, the floor's finds as icons, **Work a face · 1 action** (its note says the
  floor, the finds and "the stairs!" when a face finds them), then the stairs' progress ("2 faces to find them") and
  **Take the stairs · free** once found, or why not.

#### The romance in the Mine

A miner's perks act once her dig stands, the Mine (or a quarrier's Quarry) ([at her line](#at-her-line)): her faces'
finds and her Smelter (Cutter) batch come to ×1.1 at Friendship 2 and ×1.2 at Romance 5, as the perks' extras; her
night chores bring one find each from the deepest floor reached, at a face's stars (1 from Friendship 6, 2 from Romance
7, 3 from Spouse 4); her morning items are finds of that floor; and her signature dish's grade is its top grade.

### The stations

A station turns one exact raw grade into its matching refined grade at the same stars. One-input recipes are
priced at ×1.5 the input. Two-input recipes use whole batches and are priced at ×1.25 their full raw cost.
Five stations work, on the farm map's stations column and beside the digs: the Mill, the Sawmill and the Smokehouse,
the Mine's Smelter and the Quarry's Cutter.

```
 a built station ──Load · 1──► up to 8 of one good at one star leave the Warehouse
                               ──the night──► completed batches, at that grade and stars, into the Warehouse
 a load a day a level (level 1, one; level 5, five); it's free again in the morning
 its next level: at its panel, gold only, from its Farm Rank ──the night──► one more load a day
```

The Mill makes yogurt, butter, cheese and fruit preserves. The Sawmill makes carrot pickles, preserved eggs and
tomato sauce. Each recipe names its station level and exact input below. Traditional one-input loads retain their
farmhand yield bonus. The new food conversions use their stated ratios.

**Roster load targets** let you order up to six exact outputs per station. Each target checks Warehouse stock
and today's committed loads together. Umas use unreserved input, take the first target they can fill, and share the
station's slots. With no targets the most-held eligible input takes priority. Inputs leave stock at load start.
The Warehouse receives output and records its discovery when the load finishes. Manual loading can deliberately
use protected stock from its labelled action.

#### Building a station

A station is built like every place (see [Building](#building)): the Farm Rank offers it (the Mill at 1, the Sawmill and
the Smokehouse at 3, the Smelter at 4, the Cutter at 5), you pay its gold and goods at its quick look, and it stands the
next morning. Building takes no action.

Each station, what builds it, what opens it, its jobs and a load:

<!-- live:stations -->
| Station | Builds for | Opens | Jobs | A load |
|---|---|---|---|---|
| Mill | 1,000g · 20 logs | Farm Rank 1 | Flour: grains · Sugars and oils: sweets, nuts and seeds · Preserves: fruits · Cloth: fibers · Dairy: eggs and milk | 1 to 8, ready the next morning; a load a day a level |
| Sawmill | 1,500g · 40 logs | Farm Rank 3 | Planks: woods · Drying: mushrooms, herbs and spices · Pickles, eggs and sauce: vegetables, eggs and milk | 1 to 8, ready the next morning; a load a day a level |
| Smokehouse | 2,000g · 30 logs · 20 fish | Farm Rank 3 | Smoking: fish | 1 to 8, ready the next morning; a load a day a level |
| Smelter | 8,000g · 40 planks · 40 logs | Farm Rank 4 | Ingots: ores | 1 to 8, ready the next morning; a load a day a level |
| Cutter | 10,000g · 40 planks · 40 logs | Farm Rank 5 | Cut gems: crystals · Stone blocks: stones | 1 to 8, ready the next morning; a load a day a level |
<!-- /live -->

#### Its levels

A station's level is the loads it takes a day: level 1 is the station built, one load a day, and each level after it
one more, up to level 5's five. Its levels are bought at the station, with gold only, from each
level's Farm Rank, and the level comes the next morning.

<!-- live:station-levels -->
| Level | Loads a day | Costs | Farm Rank | Cumulative |
|---|---|---|---|---|
| 1 | 1 | The station’s build | The station’s | 0g |
| 2 | 2 | 2,000g, gold only | 3 | 2,000g |
| 3 | 3 | 5,000g, gold only | 4 | 7,000g |
| 4 | 4 | 10,000g, gold only | 5 | 17,000g |
| 5 | 5 | 20,000g, gold only | 6 | 37,000g |
<!-- /live -->

- **Buying:** its panel's **Level 2 · 2 loads a day** card says what it costs and **Upgrade · 2,000g**; the gold goes now,
  no action, and the card says "Ready tomorrow" until the night raises it (night step 8, with the places built). One
  level a day. Refused before its Farm Rank ("Opens at Farm Rank 4"), short of gold ("Need 400g more"), at its top
  level, and with a level bought today ("Level 3 tomorrow").
- **The morning says so:** "The Mill · level 2 · 2 loads a day", tagged Level, opening the station. A rank-up's news
  names the level it opens ("Station level 3 (3 loads a day)").
- **No upkeep for a level:** a station is one place built, whatever its level; its cost is its gold.
- **The save:** a station's level is `buildings[id]` (1–5), raised by one at night for a level paid today, which waits in
  `farm.builds` as a place paid for does. A save from before levels has every station at level 1.

#### A load

- **One action starts a load** of 1 to 8 of one good at one star: its inputs leave the Warehouse now. A load bigger
  than the Warehouse holds is refused ("Not enough in the Warehouse."), and so is one the station doesn't make ("It
  doesn't make that.").
- **It's ready the next morning:** night step 4 puts the same count of the refined good, at the same stars, into the
  Warehouse, and the station is free again.
- **A load a day a level:** each load is its own, of any good the station makes; one past its level's loads is refused
  ("It's busy until morning."). Each built station takes its own, and a farmhand on its Load task loads it until it
  holds today's loads ([the work board](#the-work-board)).
- **Work done** in the morning lists each load done: "Sawmill · Pine Plank ★1 × 8", opening the station's panel.

#### The stations' panels

- **Not built:** the quick look says what it does ("Turns logs, mushrooms or herbs into goods worth half again as much,
  keeping their stars.") and shows its Build card: what stands in the way ("Opens at Farm Rank 3", "Need 300g and 12
  logs more", "Builds tonight") and **Build · 1,500g · 40 logs**.
- **Built:** its panel heads with its level and today's loads ("Level 2 · 1 of 2 loads today"), lists each load started
  ("Pine Plank ★1 × 8 · Ready tomorrow morning"), then, while it takes more today, what it can make now, each output at
  its stars with its input and what's held ("Pine Plank ★1 · From Pine Log · 12 held") and **Load 8** (or all that's
  held, if fewer); with nothing: "Nothing to process yet: bring its goods home first." Then its next level's card. Once
  loaded, the map tags it **Ready tomorrow**.

#### Recipes

The vegetables and the eggs and milk have no station. The Mill weaves the Barn's wool and fleeces into cloth; the
Smelter smelts ore into ingots; the Cutter cuts gems and squares stone into blocks. Each job's recipes, by grade, with
their ★1 prices in and out:

<!-- live:station-recipes -->
##### Flour (Mill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Wheat | 40g | Wheat Flour | 60g | 1 |
| G2 | 1 × Oats | 40g | Rolled Oats | 60g | 1 |
| G3 | 1 × Barley | 45g | Pearl Barley | 70g | 1 |
| G4 | 1 × Rice | 50g | Polished Rice | 75g | 1 |
| G5 | 1 × Corn | 140g | Cornmeal | 210g | 1 |
| G6 | 1 × Rye | 60g | Rye Flour | 90g | 1 |
| G7 | 1 × Buckwheat | 75g | Buckwheat Flour | 115g | 1 |
| G8 | 1 × Wild Rice | 160g | Hulled Wild Rice | 240g | 1 |
| G9 | 1 × Moonrice | 240g | Moonrice Flour | 360g | 1 |
| G10 | 1 × Sunwheat | 260g | Sunwheat Flour | 390g | 1 |

##### Sugars and oils (Mill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Peanut | 35g | Peanut Butter | 55g | 1 |
| G2 | 1 × Sunflower Seed | 75g | Sunflower Oil | 115g | 1 |
| G3 | 1 × Sesame | 50g | Sesame Paste | 75g | 1 |
| G4 | 1 × Walnut | 65g | Walnut Paste | 100g | 1 |
| G5 | 1 × Chestnut | 85g | Chestnut Paste | 130g | 1 |
| G6 | 1 × Almond | 110g | Almond Paste | 165g | 1 |
| G7 | 1 × Pistachio | 140g | Pistachio Paste | 210g | 1 |
| G8 | 1 × Macadamia | 180g | Macadamia Butter | 270g | 1 |
| G9 | 1 × Thundernut | 230g | Thundernut Oil | 345g | 1 |
| G10 | 1 × Worldseed | 300g | Worldseed Oil | 450g | 1 |
| G1 | 1 × Honeycomb | 35g | Honey | 55g | 1 |
| G2 | 1 × Sugarcane | 45g | Cane Sugar | 70g | 1 |
| G3 | 1 × Sugar Beet | 120g | Beet Sugar | 180g | 1 |
| G4 | 1 × Maple Sap | 70g | Maple Syrup | 105g | 1 |
| G5 | 1 × Cacao Pod | 95g | Chocolate | 145g | 1 |
| G6 | 1 × Vanilla Pod | 120g | Vanilla Extract | 180g | 1 |
| G7 | 1 × Agave Heart | 155g | Agave Syrup | 235g | 1 |
| G8 | 1 × Palm Sap | 200g | Palm Sugar | 300g | 1 |
| G9 | 1 × Fairy Honeycomb | 255g | Fairy Honey | 385g | 1 |
| G10 | 1 × Ambrosia Blossom | 330g | Ambrosia | 495g | 1 |

##### Preserves (Mill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Apple | 35g | Apple Preserve | 55g | 1 |
| G2 | 1 × Pear | 45g | Pear Preserve | 70g | 1 |
| G3 | 1 × Peach | 55g | Peach Preserve | 85g | 1 |
| G4 | 1 × Plum | 70g | Plum Preserve | 105g | 1 |
| G5 | 1 × Orange | 95g | Orange Marmalade | 145g | 1 |
| G6 | 1 × Grape | 120g | Grape Jelly | 180g | 1 |
| G7 | 1 × Mango | 155g | Mango Pulp | 235g | 1 |
| G8 | 1 × Pomegranate | 200g | Pomegranate Molasses | 300g | 1 |
| G9 | 1 × Starpeach | 255g | Starpeach Nectar | 385g | 1 |
| G10 | 1 × Golden Apple | 330g | Golden Apple Preserve | 495g | 1 |
| G2 | 1 × Strawberry | 45g | Strawberry Jam | 70g | 1 |
| G3 | 1 × Raspberry | 55g | Raspberry Jam | 85g | 1 |
| G4 | 1 × Blueberry | 70g | Blueberry Jam | 105g | 1 |
| G6 | 1 × Persimmon | 120g | Persimmon Preserve | 180g | 1 |

##### Cloth (Mill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Flax | 35g | Linen | 55g | 1 |
| G2 | 1 × Jute | 50g | Burlap | 75g | 1 |
| G3 | 1 × Hemp | 60g | Hemp Cloth | 90g | 1 |
| G4 | 1 × Cotton | 80g | Cotton Cloth | 120g | 1 |
| G5 | 1 × Wool | 100g | Wool Cloth | 150g | 1 |
| G6 | 1 × Alpaca Fleece | 130g | Alpaca Cloth | 195g | 1 |
| G7 | 1 × Cashmere Fleece | 170g | Cashmere Cloth | 255g | 1 |
| G8 | 1 × Silk Cocoon | 215g | Silk | 325g | 1 |
| G9 | 1 × Moonsilk Cocoon | 275g | Moonsilk | 415g | 1 |
| G10 | 1 × Cloudfleece | 360g | Cloudweave | 540g | 1 |

##### Dairy (Mill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G2 | 1 × Milk | 80g | Cultured Yogurt | 120g | 1 |
| G2 | 2 × Milk | 80g | Butter | 200g | 2 |
| G2 | 2 × Milk | 80g | Farm Cheese | 200g | 3 |
| G4 | 2 × Goat Milk | 130g | Goat Cheese | 325g | 3 |

##### Planks (Sawmill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Pine Log | 25g | Pine Plank | 40g | 1 |
| G2 | 1 × Birch Log | 30g | Birch Plank | 45g | 1 |
| G3 | 1 × Cedar Log | 40g | Cedar Plank | 60g | 1 |
| G4 | 1 × Maple Log | 50g | Maple Plank | 75g | 1 |
| G5 | 1 × Oak Log | 70g | Oak Plank | 105g | 1 |
| G6 | 1 × Cherry Log | 90g | Cherry Plank | 135g | 1 |
| G7 | 1 × Mahogany Log | 110g | Mahogany Plank | 165g | 1 |
| G8 | 1 × Ebony Log | 145g | Ebony Plank | 220g | 1 |
| G9 | 1 × Elderwood Log | 185g | Elderwood Plank | 280g | 1 |
| G10 | 1 × Yggdrasil Branch | 240g | Yggdrasil Plank | 360g | 1 |

##### Drying (Sawmill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Basil | 45g | Dried Basil | 70g | 1 |
| G2 | 1 × Mint | 45g | Dried Mint | 70g | 1 |
| G3 | 1 × Rosemary | 45g | Dried Rosemary | 70g | 1 |
| G4 | 1 × Thyme | 60g | Dried Thyme | 90g | 1 |
| G5 | 1 × Ginger | 200g | Ground Ginger | 300g | 1 |
| G6 | 1 × Peppercorn | 100g | Ground Pepper | 150g | 1 |
| G7 | 1 × Cinnamon | 125g | Ground Cinnamon | 190g | 1 |
| G8 | 1 × Saffron | 160g | Saffron Threads | 240g | 1 |
| G9 | 1 × Mandrake | 520g | Mandrake Powder | 780g | 1 |
| G10 | 1 × Phoenix Pepper | 270g | Phoenix Spice | 405g | 1 |
| G1 | 1 × Button Mushroom | 30g | Dried Button Mushroom | 45g | 1 |
| G2 | 1 × Shiitake | 40g | Dried Shiitake | 60g | 1 |
| G3 | 1 × Oyster Mushroom | 50g | Dried Oyster Mushroom | 75g | 1 |
| G4 | 1 × Enoki | 65g | Dried Enoki | 100g | 1 |
| G5 | 1 × Chanterelle | 85g | Dried Chanterelle | 130g | 1 |
| G6 | 1 × Porcini | 110g | Dried Porcini | 165g | 1 |
| G7 | 1 × Morel | 140g | Dried Morel | 210g | 1 |
| G8 | 1 × Truffle | 180g | Shaved Truffle | 270g | 1 |
| G9 | 1 × Glowcap | 230g | Glowcap Powder | 345g | 1 |
| G10 | 1 × King Reishi | 300g | Reishi Powder | 450g | 1 |

##### Pickles, eggs and sauce (Sawmill)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 2 × Carrot | 60g | Carrot Pickles | 150g | 2 |
| G1 | 1 × Egg | 60g | Preserved Egg | 90g | 2 |
| G3 | 1 × Duck Egg | 100g | Preserved Duck Egg | 150g | 2 |
| G5 | 2 × Tomato | 70g | Tomato Sauce | 175g | 2 |

##### Smoking (Smokehouse)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Carp | 40g | Carp Fillet | 60g | 1 |
| G2 | 1 × Trout | 50g | Trout Fillet | 75g | 1 |
| G3 | 1 × Sardine | 65g | Sardine Fillet | 100g | 1 |
| G4 | 1 × Mackerel | 85g | Mackerel Fillet | 130g | 1 |
| G5 | 1 × Salmon | 110g | Salmon Fillet | 165g | 1 |
| G6 | 1 × Sea Bream | 145g | Sea Bream Fillet | 220g | 1 |
| G7 | 1 × Eel | 180g | Eel Fillet | 270g | 1 |
| G8 | 1 × Tuna | 235g | Tuna Fillet | 355g | 1 |
| G9 | 1 × Silverfin | 300g | Silverfin Fillet | 450g | 1 |
| G10 | 1 × Rainbow Koi | 390g | Rainbow Koi Fillet | 585g | 1 |

##### Ingots (Smelter)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Copper Ore | 30g | Copper Ingot | 45g | 1 |
| G2 | 1 × Tin Ore | 40g | Tin Ingot | 60g | 1 |
| G3 | 1 × Iron Ore | 50g | Iron Ingot | 75g | 1 |
| G4 | 1 × Silver Ore | 65g | Silver Ingot | 100g | 1 |
| G5 | 1 × Cobalt Ore | 85g | Cobalt Ingot | 130g | 1 |
| G6 | 1 × Gold Ore | 110g | Gold Ingot | 165g | 1 |
| G7 | 1 × Platinum Ore | 140g | Platinum Ingot | 210g | 1 |
| G8 | 1 × Titanium Ore | 180g | Titanium Ingot | 270g | 1 |
| G9 | 1 × Mythril Ore | 230g | Mythril Ingot | 345g | 1 |
| G10 | 1 × Orichalcum Ore | 300g | Orichalcum Ingot | 450g | 1 |

##### Cut gems (Cutter)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Quartz | 50g | Cut Quartz | 75g | 1 |
| G2 | 1 × Amethyst | 65g | Cut Amethyst | 100g | 1 |
| G3 | 1 × Citrine | 80g | Cut Citrine | 120g | 1 |
| G4 | 1 × Garnet | 105g | Cut Garnet | 160g | 1 |
| G5 | 1 × Emerald | 135g | Cut Emerald | 205g | 1 |
| G6 | 1 × Sapphire | 175g | Cut Sapphire | 265g | 1 |
| G7 | 1 × Ruby | 225g | Cut Ruby | 340g | 1 |
| G8 | 1 × Diamond | 290g | Cut Diamond | 435g | 1 |
| G9 | 1 × Starstone | 370g | Cut Starstone | 555g | 1 |
| G10 | 1 × Philosopher's Stone | 480g | Cut Philosopher's Stone | 720g | 1 |

##### Stone blocks (Cutter)

| Base grade | In | ★1 each | Out | ★1 each | Level |
|---|---|---|---|---|---|
| G1 | 1 × Limestone | 25g | Limestone Block | 40g | 1 |
| G2 | 1 × Sandstone | 30g | Sandstone Block | 45g | 1 |
| G3 | 1 × Slate | 40g | Slate Block | 60g | 1 |
| G4 | 1 × Granite | 50g | Granite Block | 75g | 1 |
| G5 | 1 × Basalt | 70g | Basalt Block | 105g | 1 |
| G6 | 1 × Marble | 90g | Marble Block | 135g | 1 |
| G7 | 1 × Obsidian | 110g | Obsidian Block | 165g | 1 |
| G8 | 1 × Jade | 145g | Jade Block | 220g | 1 |
| G9 | 1 × Runestone | 185g | Runestone Block | 280g | 1 |
| G10 | 1 × Meteorite | 240g | Meteorite Block | 360g | 1 |
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
7. **A flood eases it** −10% a step, on top of both, down to half ([the market](#the-market-feels-a-flood)).

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
| Fibers | ×1.2 | The Barn: Wool, Alpaca Fleece, Cashmere Fleece | 35 · 50 · 60 · 80 · 100 · 130 · 170 · 215 · 275 · 360 | ×1.5 |
| Hides and scales | ×1.5 | Expeditions | 45 · 60 · 75 · 100 · 130 · 165 · 210 · 270 · 345 · 450 | — |
| Bones and horns | ×1.6 | Expeditions | 50 · 65 · 80 · 105 · 135 · 175 · 225 · 290 · 370 · 480 | — |
| Essences | ×1.8 | Expeditions | 55 · 70 · 90 · 115 · 155 · 200 · 250 · 325 · 415 · 540 | — |
| Eggs and milk | ×2.0 | The Coop and the Barn | 60 · 80 · 100 · 130 | — |
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
demand. Winter lifts dishes, cloth (the fibers' refined row) and the preserves (the fruits' refined row only); no dish
sells at the bin, so in Winter the ten cloths and the ten preserves are lifted. Woods, herbs and spices, ores, stones,
crystals, the raw fibers, the eggs and milk, the expeditions' goods and the rings are never in demand. A good is in demand once, however many rules name it. "In demand" shows on the good
in the Warehouse, on its bin line and in the morning.

Each season's families, and how many goods they lift:

<!-- live:demand -->
| Season | In demand (+20%) | Goods lifted |
|---|---|---|
| Spring | Vegetables, Sweets | 92 of 522 |
| Summer | Fruits, Fish | 130 of 522 |
| Autumn | Grains, Mushrooms, Nuts and seeds | 96 of 522 |
| Winter | Dishes, Cloth (the refined row), Preserves (the refined row) | 54 of 522 |
<!-- /live -->

#### The catalogue

The catalogue holds 522 goods in 17 families. The 284 original goods keep their IDs. Grades share the ingredient's
art, and the new food conversions use their input's icon. The farm's produce sheet supplies new crops and orchard
silhouettes. The bin takes priced goods. Seeds are stored separately.

The first harvest, collection, catch, forage or completed load or cooking play proves the exact output grade.
The proof stays when the output is used or sold. Purchases, gifts and expedition loot fill stock. Affection
bonuses that copy work still use the same output ID. Verified legacy crop mastery, species length records and
cooking counts prove their historical output IDs. The original Kitchen's recipe lookups keep their existing inputs.

The crops' own prices, their refined forms and their season of demand:

<!-- live:crop-prices -->
| Crop | Id | Family | Price ★1 | Refined | Its price ★1 | In demand |
|---|---|---|---|---|---|---|
| Carrot | `carrot` | Vegetables | 60g | Carrot Pickles | 150g | Spring |
| Potato | `potato` | Vegetables | 55g | — | — | Spring |
| Mint | `mint` | Herbs and spices | 45g | Dried Mint | 70g | — |
| Onion | `onion` | Vegetables | 100g | — | — | Spring |
| Cabbage | `cabbage` | Vegetables | 260g | — | — | Spring |
| Asparagus | `asparagus` | Vegetables | 480g | — | — | Spring |
| Tomato | `tomato` | Vegetables | 70g | Tomato Sauce | 175g | Spring |
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
| Radish | `radish` | Vegetables | 55g | — | — | Spring |
| Lettuce | `lettuce` | Vegetables | 85g | — | — | Spring |
| Green Peas | `green-peas` | Vegetables | 65g | — | — | Spring |
| Strawberry | `strawberry` | Fruits | 45g | Strawberry Jam | 70g | Summer |
| Raspberry | `raspberry` | Fruits | 55g | Raspberry Jam | 85g | Summer |
| Plum | `plum` | Fruits | 70g | Plum Preserve | 105g | Summer |
| Cucumber | `cucumber` | Vegetables | 85g | — | — | Spring |
| Okra | `okra` | Vegetables | 95g | — | — | Spring |
| Zucchini | `zucchini` | Vegetables | 80g | — | — | Spring |
| Peach | `peach` | Fruits | 55g | Peach Preserve | 85g | Summer |
| Blueberry | `blueberry` | Fruits | 70g | Blueberry Jam | 105g | Summer |
| Mango | `mango` | Fruits | 155g | Mango Pulp | 235g | Summer |
| Turnip | `turnip` | Vegetables | 65g | — | — | Spring |
| Sweet Potato | `sweet-potato` | Vegetables | 80g | — | — | Spring |
| Winter Squash | `winter-squash` | Vegetables | 160g | — | — | Spring |
| Apple | `apple` | Fruits | 35g | Apple Preserve | 55g | Summer |
| Pear | `pear` | Fruits | 45g | Pear Preserve | 70g | Summer |
| Grape | `grape` | Fruits | 120g | Grape Jelly | 180g | Summer |
| Leek | `leek` | Vegetables | 75g | — | — | Spring |
| Cauliflower | `cauliflower` | Vegetables | 115g | — | — | Spring |
| Red Beet | `red-beet` | Vegetables | 85g | — | — | Spring |
| Orange | `orange` | Fruits | 95g | Orange Marmalade | 145g | Summer |
| Persimmon | `persimmon` | Fruits | 120g | Persimmon Preserve | 180g | Summer |
| Pomegranate | `pomegranate` | Fruits | 200g | Pomegranate Molasses | 300g | Summer |
<!-- /live -->

#### Rings

The catalogue's 16th family is the rings: ten of them, ordered at the Ring Bench,
always at ★1. They sell at the bin like any good, never in demand, and sit on the
Warehouse's Rings tab while one is held. The ring bench is the romance's.

The ten rings, their grades, prices and bonuses are in [the ring, the wedding, and married life](#the-ring-the-wedding-and-married-life).

#### The shipping bin

The bin takes anything with a price and pays at night. There's no cap on selling, but a flood of one good eases its
price ([the market](#the-market-feels-a-flood)), and nothing is ever bought back.

- **Ship a crate · 1 action:** pick what to ship in the Warehouse's pick mode, as many goods and stars as you like, and
  one action puts the whole crate in today's bin. Shipping again the same day is another crate and another action.
  Seeds and dishes don't sell ("That doesn't sell").
- **Ship all · 1 action:** a good's sheet in the Warehouse ships every star of it as one crate.
- **Take back:** a whole line from the bin back to the Warehouse, free, any time until the night. After the night, a
  sale is final.
- **The estimate:** "About 1,240g tonight", at today's prices and the market's ease.
- **The bin's sheet** (from the bin on the map, the gold chip or a morning line): "About 1,240g tonight", today's lines
  (icon, "Carrot ★2 × 3", the line's gold, **In demand**, **Eased −20%** past a crate or after a flood), each with **Take
  back**, and **Ship · 1 action**, which opens the Warehouse to pick a crate. Empty, it says "Empty" and "Tap Ship to
  pick goods. They pay tonight." Its help (i) says the rule in four lines.

**At night (step 1):**
- each good and star pays price × stars × demand × the market's ease on the day it was shipped, rounded to 5g a unit, ×
  the count; past a crate of one good, each crate more a step lower;
- gold rises by the total;
- the farm's gold shipped rises by the same (the Farm Rank's points, 1 per 100g, and its shipping milestones);
- each good's count joins the Diary's shipped goods;
- the bin empties, and the market moves: a good shipped past a crate stays eased; every other eased good recovers a step.

The morning's bin section lists each good and star sold, with its gold, "eased −20%" and **In demand**, then the total.
A line's gold is the night's own and is never priced again.

#### The market feels a flood

The valley eats only so much of one good. Past a **crate** of it in one night, each crate more sells a step lower, and
the good stays eased for the days after, recovering a step a night. A farm that ships a field of one crop, or a mine's
day of one ore, feels it; one that ships many goods, or spreads a stockpile over days, doesn't.

<!-- live:market -->
|  | The rule |
|---|---|
| A crate | 50 of one good in a night’s bin, any stars, sell at its price today |
| A flood | Past a crate, each 50 more sell a step lower than the ones before: −10% a step, the best stars first |
| The floor | 5 steps: half the price |
| The days after | The good stays eased by the steps its last crate reached; its first crate the next night sells at that ease |
| Recovering | A step back each night it isn’t shipped past a crate, until it’s full price again |
| Shown | On the bin’s line (“Eased −20%”), the Warehouse’s good and its prices, and the morning’s sale |
<!-- /live -->

| Worked: Pine Logs (25g ★1) | Sells | The market after |
|---|---|---|
| 50 in one night | 50 at 25g = 1,250g | Not eased |
| 120 in one night | 50 at 25g, 50 at 22.5 → 25g, 20 at 20g = 2,900g | Eased 2 steps (−20%) |
| The next night, 10 | 10 at 20g = 200g | Eased 1 step |
| 400 in one night | 50 each at 25g, 25g, 20g, 20g, then 15g (half price, 12.5 rounded up): 7,500g | Eased 5 steps, the floor |

- **Where it shows:** a good eased shows **Eased −20%** on its Warehouse line and sheet ("A flood: back a step a night"),
  its star prices eased; the bin's lines and estimate price each crate at its step; the Warehouse's pick bar prices a
  crate at the market as it stands; and the morning's sale says "eased −20%".
- **The best stars first:** a night's units of one good fill its crates ★5 first, so the best sell at the best step.
- **The save:** `farm.market` (each good eased, by its steps, 1–5). A save from before the market has none: nothing
  eased.

#### Gold

Gold is whole and never goes below 0; a purchase short of gold is refused ("Need 30g more"). A new farm starts with 500g
and 9 Carrot seeds.
- **Earned:** the bin, and the Diary's milestones and collection rows; a loan lends toward a build.
- **Spent:** the night's upkeep and loans' shares, seeds at the shop, places to build at their quick looks or the
  mayor's office, and houses on the homestead.

The gold chip in the bar shows the coin and your gold, and opens the bin.

#### The shop

Open the shop from Town, the Menu, or a tile's **Seeds at the shop, in town**. From the farm, **Go into town · Free**
opens its stock if you haven't visited today. Each seed shows its growing seasons or, for orchard plants, when it fruits.
A locked seed also shows the Farm Rank it needs. The buy sheet repeats the season label. Choose ×1, ×5, ×10, ×25 or a
typed count up to 99, and **Buy 9 · 180g**, held
back with "Need 30g more" when gold is short. What you buy goes in the Warehouse at ★1. The shop checks its lines again
as you buy, so a sheet left open past a season's turn can't buy last season's seeds. Beds and stations are bought at
their own places.

#### The Warehouse

The Warehouse holds everything the farm owns, by stars: each good has five counts, ★1 to ★5. It has no limit.

- **Tabs**, in a row that scrolls sideways, each with its count: **Crops** (field produce and the grains' refined forms),
  **Woods**, **Mushrooms**, **Herbs and spices**, **Fruits**, **Nuts and seeds**, **Sweets**, **Ranch**, **Fish**, **Mining**
  (ores, stones and crystals) and **Seeds**; and **Loot** (the expeditions' goods), **Rings** and **Dishes** only while
  something is on them. Orchard and berry produce appears in **Fruits**. The **Grade** picker filters the current tab,
  and **Discoveries** shows exact grades and their sources even when stock is empty. A crop's refined form sits on its family's tab (Dried Basil on Herbs and spices, Peanut Butter
  on Nuts and seeds).
- **Each good:** its icon, name, **In demand**, **Eased −20%** after a flood, its total, and its five stars, each with its
  count and today's price (eased, after a flood).
- **A good's sheet:** its family, grade and form ("Fish · G5 · raw"), what it refines into or from, "+20% this season"
  when in demand, "A flood: back a step a night" when eased, its five stars and **Ship all · 665g · 1 action** (what
  shipping it all tonight pays, past a crate and all). Seeds say "Seeds: they don’t sell"; a dish says "A
  dish: for a meal"; a ring's form is "made at the ring bench".
- **Pick mode** (from the bin's **Ship**): "Ship to the bin". A tap on a star puts one in the crate (marked "+2" on the
  star, its count what’s left), **All** puts every star of a good in, and a bar says "Crate: 3 · about 425g" (what the crate
  adds to tonight's bin, at the market as it stands) with
  **Clear** and **Ship · 1 action**, which ships the crate and goes back to the bin. With nothing picked it says "Tap a
  star to put one in the crate." (or what's in the bin tonight). It opens on the first tab holding something that
  sells.

Each exact ingredient can keep a reserve of up to 99 units across its stars. Roster seed saving, station loads,
plain cooking and surplus shipping use stock above that floor. A station target protects its exact output grade
and inputs for the next regular load from routine cooking and surplus shipping. An explicitly selected recipe, station load
or shipment can still use the goods under its usual rules.
Price easing groups all grades of an ingredient into the same crate and groups each refined form separately.

**Standard surplus** is ready on a new farm. It keeps 12 of common crops, eight of other common food inputs, six of most refined or rare goods, 20 Pine Logs and four of each Restaurant dish. Grades and forms have independent floors. It keeps all seeds, fodder, rings, heirlooms, and other protected goods. Existing custom lists and exact-grade reserves carry forward. The Warehouse shows the standard and your overrides, including zero, Keep all and protection by stars.

Pinned builds and Restaurant recipes, tracked tools and heirlooms, station stock targets, and the next meal ingredients protect stock before shipping. An eligible Uma queues the shared crate after priority work, using one action. The default cap is 50 units on small farms, 100 from 15 hands and 200 from 35. The market still applies easing. On a solo farm, **Suggested surplus** at the bin queues its listed goods with one player action. **Take back** still works until settlement. Work can pause automatic shipping, change its cap or restore standards.

#### Roster production playthrough

The field trials harvested all 51 crops in year one with both 10 and 15 Umas. The 15-Uma orchard bore again in
year two. For the full farm trial, five separate farms ran for four years with fixed assignments. They start with
20,000g, one to five prepared plots, three level-2 stations, a small herd, and practiced workers where assigned.
The two small farms start at Rank 6 and the others at Rank 10. The player buys seed by season and covers uncovered
water and feed when able. The larger rosters each sent the same three specialists away on two five-day expeditions
in year three, for 24 worker-days away between departure and return.

| Umas | Year 4 roster share | Player actions free on a typical day | Year 4 bin sales | Year 4 takeout | Loads used out of 288 | Raw stock at year end |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0% | 0 | 6,210g | 0g | 2 | 95 |
| 3 | 80.4% | 8 | 28,775g | 540g | 34 | 107 |
| 10 | 96.6% | 10 | 183,640g | 0g | 113 | 661 |
| 20 | 99.8% | 10 | 373,560g | 0g | 139 | 5,226 |
| 50 | 99.9% | 10 | 222,945g | 0g | 96 | 26,869 |

The 10-, 20- and 50-Uma farms met the 80% coverage and eight-free-actions targets in all four years. The first
G3 Yogurt arrived on the morning after days 4, 3 and 2 respectively. All three rosters repeated their graded station
outputs. Seasonal seed buys kept the rotation stocked. Irrigation still has occasional gaps after a large planting
shift, and surplus shipping is capped at one crate per night. The 50-Uma farm outproduced that crate and built up
raw stock in several grades, even with spare load slots. The deterministic report records per-season gold, water
and feed gaps, pantry use, exact grade discovery days and end-of-year stock by form.

#### F111 finance and default surplus playthroughs

The fresh solo farm began with 500g, nine Carrot Seeds and zero farmhands. It sold the suggested surplus, bought seasonal seeds, placed a financed Copper Ring order on Summer 2 with 525g left after the deposit, and married on Summer 7 of Year 1. There were no nights in arrears. The wedding-day save still held 961g before a voluntary 100g payment.

The standard defaults ran for all 120 turns without any surplus configuration in the staffed trials. These use synthetic Umas available from the beginning to measure the shipping system at each size.

| Farmhands | Automatic crates | Units shipped | Bin sales | Automatic repayment | Nights in arrears |
|---:|---:|---:|---:|---:|---:|
| 10 | 72 | 789 | 74,260g | 1,000g | 0 |
| 20 | 68 | 1,628 | 199,180g | 1,000g | 0 |
| 50 | 110 | 5,045 | 638,355g | 1,000g | 0 |

Each trial also made a 100g partial payment before the overnight schedule. A separate Rank 10 farm with 50 Umas and the same default policy sold 3,217,115g over one year, finished with 461 raw and 42 refined units in stock, and kept its higher-grade Yogurt target. These are fixture results. The actual schedule depends on assignments, plantings, ingredient choices and demand.

A 100,000g Mythril Ring used 10,000g in savings and 90,000g in credit. Its balance reached 99,000g with the fee and fell to 94,000g after a 5,000g payment. The eligible 110,000g fifth cottage was also built with 10,000g in savings and the full 100,000g credit line. The browser smoke test commissioned a ring, paid part of a loan, approved a suggested surplus crate, and financed the cottage at 844 × 390 and 667 × 375. The simulations are in the domain wedding, credit, and scale tests.

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

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Carrot (crop) | 60g | 120g | Carrot Pickles | 150g | 300g |
| G2 | Potato (crop) | 55g | 110g | — | — | — |
| G3 | Cabbage (crop) | 260g | 520g | — | — | — |
| G4 | Onion (crop) | 100g | 200g | — | — | — |
| G5 | Tomato (crop) | 70g | 140g | Tomato Sauce | 175g | 350g |
| G6 | Bell Pepper (crop) | 60g | 120g | — | — | — |
| G7 | Eggplant (crop) | 95g | 190g | — | — | — |
| G8 | Asparagus (crop) | 480g | 960g | — | — | — |
| G9 | Golden Carrot (crop) | 600g | 1,200g | — | — | — |
| G10 | Emperor Pumpkin (crop) | 600g | 1,200g | — | — | — |

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
| G1 | Apple (crop) | 35g | 70g | Apple Preserve | 55g | 110g |
| G2 | Pear (crop) | 45g | 90g | Pear Preserve | 70g | 140g |
| G3 | Peach (crop) | 55g | 110g | Peach Preserve | 85g | 170g |
| G4 | Plum (crop) | 70g | 140g | Plum Preserve | 105g | 210g |
| G5 | Orange (crop) | 95g | 190g | Orange Marmalade | 145g | 290g |
| G6 | Grape (crop) | 120g | 240g | Grape Jelly | 180g | 360g |
| G7 | Mango (crop) | 155g | 310g | Mango Pulp | 235g | 470g |
| G8 | Pomegranate (crop) | 200g | 400g | Pomegranate Molasses | 300g | 600g |
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

##### Fibers

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Flax | 35g | 70g | Linen | 55g | 110g |
| G2 | Jute | 50g | 100g | Burlap | 75g | 150g |
| G3 | Hemp | 60g | 120g | Hemp Cloth | 90g | 180g |
| G4 | Cotton | 80g | 160g | Cotton Cloth | 120g | 240g |
| G5 | Wool | 100g | 200g | Wool Cloth | 150g | 300g |
| G6 | Alpaca Fleece | 130g | 260g | Alpaca Cloth | 195g | 390g |
| G7 | Cashmere Fleece | 170g | 340g | Cashmere Cloth | 255g | 510g |
| G8 | Silk Cocoon | 215g | 430g | Silk | 325g | 650g |
| G9 | Moonsilk Cocoon | 275g | 550g | Moonsilk | 415g | 830g |
| G10 | Cloudfleece | 360g | 720g | Cloudweave | 540g | 1,080g |

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

##### Eggs and milk

| Grade | Raw | ★1 | ★5 | Refined | ★1 | ★5 |
|---|---|---|---|---|---|---|
| G1 | Egg | 60g | 120g | Preserved Egg | 90g | 180g |
| G2 | Milk | 80g | 160g | Cultured Yogurt | 120g | 240g |
| G3 | Duck Egg | 100g | 200g | Preserved Duck Egg | 150g | 300g |
| G4 | Goat Milk | 130g | 260g | Goat Cheese | 325g | 650g |
<!-- /live -->

### Upkeep and loans

The farm has to pay its way. What you add to it costs a little each night, and the mayor's office lends toward a build
so it can stand ahead of the gold; each night's income pays it back. The rules are `farm/economy.ts`.

```
 the night, step 1:  the bin pays
 the night, step 2:  the farmhands work ──► the farm eats (food) ──► each loan takes its share of the night's income
                                                                     (a tenth of the loan, from income only)
                                                                 ──► the takeout, then the upkeep, with anything owed
                                                                                            │
                     enough gold ───────────────────────────────────────────────────────────┤ all paid
                     short ── what gold there is pays, the rest is owed ──► the morning warns (night 1)
                                                                        ──► half pace (night 2 on), until it's paid
 the day:  Go into town for free ──► the mayor's office: Borrow 400g · Build ──► the build is ordered at once
```

#### Upkeep

Every night the farm covers takeout, upkeep and any arrears first. The remaining cash can pay loans:

<!-- live:upkeep -->
| Counts | A night | Not counted |
|---|---|---|
| Each place built (the stations, the Coop and the Barn, the Mine and the Quarry, the Dock, the Boat, and each later one) | 15g | The start’s own places; the animals, whose cost is their feed |
| Each house built on the homestead | 15g | The Farmhouse |
| Each spouse living on the farm, in her room | 10g | Everyone who lives in town: a farmhand’s cost is her meals on her farm days, and a spouse waiting for a room costs nothing until she moves in |
| Short of it | What gold there is pays; the rest is owed with tomorrow’s | The first short night warns; from night 2 in a row, half pace until it’s paid |
<!-- /live -->

- **What it counts** is read at night step 2, before the night's builds stand: a place paid for today costs from
  tomorrow night, its first night standing, and a house (which stands at once) from tonight. A new farm owes no upkeep:
  it grows with what you build and who marries you. (It pays its farmer's takeout from the first night, and a
  farmhand's meals on her farm days: [food](#food).)
- **No Dorm beds and no farmhand 10g:** the Dorm is retired ([the retired Dorm](#the-retired-dorm)), and a farmhand's
  cost is her two meals on each farm day, from the pantry or takeout, nothing on a town day. Only a spouse in her room is
  a resident.
- **What pays:** cash on hand after the bin and Restaurant pay. Gold never goes below 0.
- **Short of upkeep:** what gold there is pays, takeout first, and the rest is **owed** (`farm.owed`), takeout and
  upkeep alike, added to the next night's upkeep. The short nights in a row are counted (`farm.short`):
  - **the first** warns in the morning ("Short of upkeep · 40g owed", tagged Warning);
  - **from the second**, the farmhands work at **half pace** until it's paid ("· farmhands at half pace"): half their
    actions, rounded down, never below one (`atPace`), from the day after the second short night
    ([her day](#her-day)). The farmer's own ten are never touched;
  - **paid:** a night whose gold covers all that's owed and its own upkeep pays it, says "Upkeep paid up", and the count
    goes back to 0.
  - Nobody leaves, and nothing is lost: no one moves out, no building stops, no good is taken.
- **The book** keeps the bin's pay on each of the last seven nights (`farm.income`), so the Book can set an average
  night's income beside the upkeep.

#### Loans

The mayor’s office offers project quotes, gold advances, and exact-grade supplier materials. An eligible project can finance its gold bill and materials available from a supplier. Seed, livestock, fodder, land, station, Kitchen and Forge purchases offer a quote from their own screens.

<!-- live:loans -->
| Term | The rule |
|---|---|
| Credit | 100,000g shared outstanding principal from Rank 1, across three open loans |
| What it lends | Gold advances, exact supplier goods, and eligible projects and commissions |
| The fee | 10% once, rounded up to 10g |
| Each night | 20% of settled sales left after food, upkeep, and arrears, shared oldest first |
| Repay | Pay any amount at the office. Payments clear the fee first, then free principal. A paid-off loan frees its slot. |
<!-- /live -->

- **Review financing** shows the total, cash to pay now, principal, one-time fee, total owed, and remaining credit. The order and its loan commit together. The usual project gates apply.
- **Suppliers** quote Pine Logs and Limestone from the start, and other exact goods after the farm discovers them. Borrowed goods arrive at ★1. They use the existing discovery requirements.
- **Nightly repayment** shares one budget across new loans. From 1,000g in shipping and Restaurant sales, with 300g in bills, 140g goes to repayment and 560g stays in the wallet. A night with no sales left after bills pays 0g. Legacy loans draw under their original terms before the new budget.
- **Pay any amount** uses whole gold up to the outstanding balance and cash the farm holds. It applies to the note you select. **Pay off** clears the entire balance. The fee is paid first, and the remaining principal determines available credit.
- **Book → Money** shows settled sales from the bin and Restaurant, food, upkeep, automatic payments, and recent finance activity. The mayor shows recent paid-off notes. Payoff estimates use recent available payments. A farm without eligible sales shows **Waiting for sales**.

The save keeps legacy loans with their old balances and terms. New notes store their original principal, fee, remaining balance, and purpose. The recent journal records borrowing, supplier purchases, manual payments and automatic payments.

### Food

Everyone who eats on the farm eats twice a day, from the first night. What isn't cooked is bought in as **takeout**, at a
price you feel from day one; **cooking** turns the Warehouse's goods into meals in batches, and a farmhand on **Cook**
feeds many. The rules are `farm/food.ts`.

```
 your day                                      the night, step 2
   the homestead's sheet (the Farmhouse):        the farmhands work: a cook's batches into the pantry
     Kitchen · Cook a batch · 1                  the farm eats: a staff meal's mouths first (the Kitchen's),
       two goods of food → six meals               then two meals a mouth, from the pantry first,
       or At the stove · 1: 6, 8, 9 or 12          the Umas first, the farmer last, the oldest meals first
     once married: Breakfast · 1, Dinner · 1     ★2+ meal → that Uma is well fed tomorrow (+1 action)
       (each a batch too)                        what's short: takeout, 15g a meal ──► the bill, with the upkeep
   the Book: a farmhand on Cook                  a meal keeps three days, then it spoils
 the morning:  From the pantry · 6 meals · Well fed      Takeout · 30g      Upkeep · 15g
```

<!-- live:food -->
|  | The rule |
|---|---|
| Who eats | The farmer, every spouse in her room (who lives on the farm) and every farmhand on her farm day (on the farm that day, with work or without): 2 meals each, at night. A farmhand on a town day eats in town, and costs the farm nothing |
| The pantry | Cooked meals wait here, by the day cooked and their stars. A meal keeps 3 days: cooked today, it’s eaten tonight, tomorrow night or the night after, then it spoils |
| The night’s meals | Night step 2, after the farmhands work: the Umas eat first (the farmhands on the farm, in their order, then the spouses in their rooms), the farmer last; the oldest meals first, the best of those |
| Takeout | 15g a meal the pantry is short, charged with the upkeep (takeout first); a new farm’s farmer eats 2: 30g a night |
| Short of it | Takeout never goes unpaid: what gold there is pays, the rest is owed with the upkeep, and the short nights count as the upkeep’s |
| Cook a batch | The farmer, in the farmhouse kitchen (the homestead’s sheet): 1 action, 6 meals from 2 goods of food you choose |
| At the stove | The same batch played at the stove (30 s): 6, 8, 9, 12 meals by its tier, its stars +0, +0, +1, +2; never worse than the plain batch |
| The staff meal | Served at the Kitchen, free, once a day. Each selected dish feeds up to 3 mouths in place of their 2 meals. The rest use the pantry or takeout |
| A household meal | Breakfast or dinner once married: the farmer cooking for the household, so it cooks a batch too (6 meals from 2 goods by the plain rule, when the Warehouse holds them) |
| Cook (a farmhand’s task) | A batch an action from 2 goods by the plain rule, its meals by her Cooking (below), until the pantry holds tonight’s meals for everyone |
| A meal’s stars | Its 2 goods’ stars, averaged and rounded down |
| Well fed | An Uma who eats a ★2+ meal is well fed through tomorrow: one more action tomorrow, and her work’s quality and rank points; never stacked, never shortening a meal running longer. A staff meal feeds by its lowest stars: ★1–2 through tomorrow, ★3–4 two days, ★5 three |
| The plain rule | The cheapest pair that averages ★2. If the Warehouse cannot make that pair, use the two cheapest. Explicit reserves and station stock targets are kept |
| Food | Grains, Vegetables, Herbs and spices, Nuts and seeds, Sweets, Fruits, Mushrooms, Fish, Eggs and milk, raw or refined |
<!-- /live -->

A farmhand's batch by her Cooking (her aptitude, [aptitude](#aptitude)):

<!-- live:cook-batch -->
| Cooking | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Meals a batch | 6 | 7 | 7 | 8 | 9 | 9 | 10 | 11 | 11 | 12 |
| Goods a batch | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
<!-- /live -->

- **Who eats:** the farmer, every spouse in her room (who lives on the farm), and every farmhand on her farm day, the
  day being settled, with work on her board or without: she was on the farm by day ([farmhands](#farmhands)). On a town
  day she's in town and eats there: she costs the farm nothing. Her meals are her cost, in place of the farmhands' old
  10g a night of upkeep; a spouse in her room eats and pays her 10g as a resident.
- **A new farm** pays its farmer's two meals of takeout the first night: the first morning says "Takeout · 30g".
- **The pantry** keeps meals by the day they were cooked and their stars (`farm.pantry`). The night eats the oldest
  first and the best of those, so yesterday's meals go before today's. A meal keeps three days: cooked today, it's eaten
  tonight, tomorrow night or the night after; any left after that spoil ("· 2 spoiled"). So a farmer alone eats all six
  of a batch, two a night for three nights.
- **Takeout never goes unpaid:** it's charged with the upkeep, takeout first; what gold can't cover is owed with the
  upkeep's, and the short nights count as the upkeep's ([upkeep](#upkeep)). Nobody goes hungry.
- **Cook a batch** is the farmer's, in the farmhouse kitchen: the **Kitchen** on the homestead's sheet (a tap on the
  Farmhouse on the farm map, or **Kitchen ›** in the Book). It shows the pantry, tonight's table as the farm stands ("4
  at the table · 8 meals"), tonight's takeout or "The pantry covers tonight", and the goods of food held, the plain
  rule's two picked to start: tap to choose any two (a good held twice can be picked twice), and **Cook a batch · 1**
  cooks six meals, "6 meals ★2 from Salmon and Salmon: well fed". Refused with fewer than two goods of food ("Two goods
  of food make a batch: crops, fish, eggs and milk, mushrooms, fruits, nuts or sweets.") and with no action left.
- **Cooking saves gold:** a batch's six meals are 90g of takeout, three nights of the farmer's alone, from two goods the
  bin pays 60–80g for at ★1 (two Button Mushrooms 60g, a Mushroom and a Carp 70g, two Carp 80g): 10–30g a batch better
  than shipping them and buying in. The action is the batch's other cost: for a farmer who'd otherwise spend it on a
  haul (a forage or a catch, about 45–70g), cooking every night he can comes out about even with takeout over a year
  ([what food costs](#what-food-costs-and-what-cooking-saves)).
- **A household meal** (married life: [the household's meals](#the-households-meals)) is the farmer cooking for the
  household, so it cooks a batch too: six meals for the pantry from two goods by the plain rule, when the Warehouse
  holds them; without them it's served as before. Its scene, its +10 and its well fed stay.
- **Cook** is a task on the work board ([the work board](#the-work-board)), with nowhere to choose: in the farmhouse
  kitchen, each action cooks a batch from two goods by the plain rule, its meals by her Cooking (6 at Cooking 1, 12 at
  Cooking 10), until the pantry holds tonight's meals for everyone (as the board stands: the farmer, everyone living on
  the farm and every farmhand with a task), then her other tasks take her actions. Its aptitude is **Cooking**, from
  her cooking talent; her day there pays cooking rank points (the kitchen's place), bonds with another cook, and a
  cooking line's +10.
- **The plain rule** chooses the cheapest pair that averages at least ★2, including a ★1 paired with a ★3 or higher.
  If no such pair is available it chooses the two cheapest eligible goods. It keeps explicit stock reserves and station
  target quantities. Prices use each item's stars at regular demand. **Food** is the food families' goods, raw or
  refined: grains, vegetables, herbs and spices, nuts and seeds, sweets, fruits, mushrooms, fish, eggs and milk (never
  woods, ores, stones, crystals, fibers, hides, bones or essences, a seed, a ring or a dish).
- **A meal's stars** are its two goods' average, rounded down: two ★2 goods make ★2 meals, a ★2 and a ★1 make ★1. An
  Uma who eats a ★2+ meal is **well fed** through tomorrow ([well fed](#well-fed)): one more action tomorrow, and her
  work's quality, hauls and rank points while it lasts. The farmer gets nothing from it, so for him a ★1 meal is as good.
- **At the stove · 1**, beside **Cook a batch · 1**: the same batch played at the stove, a 30-second cooking game
  ([the stove](#the-stove-the-cooking-game)). Its tier makes 6, 8, 9 or 12 meals, their stars the goods' +0, +0, +1 or
  +2, so it's never worse than the plain batch. A household meal and a farmhand's Cook stay plain.
- **The staff meal** (once the Kitchen stands, [the staff meal](#the-staff-meal)): the mouths it was served for eat it
  tonight in place of their two meals, the farmer first, then the Umas in the table's order; the rest eat from the
  pantry. A cook stops once the pantry holds the meals of the mouths it doesn't feed.
- **The save:** `farm.pantry` (each lot: the day cooked, today or yesterday; its stars; its meals; one lot a day and
  star, the oldest first). It grows v5 in place: a save from before food loads with an empty pantry, and nothing moves
  `updatedAt` for it.

#### What food costs, and what cooking saves

The season simulations ([the pacing](#the-pacing)) play the year alone and with two farmhands, once cooking and once on
takeout alone:

| A year | Takeout | Its share of the bin | Meals from the pantry | Short nights | Gold at the year's end |
|---|---|---|---|---|---|
| The farmer alone, on takeout | 1,440g (96 meals) | 16% | 0 | 0 | 4,710g |
| The farmer alone, cooking for a tight night | 1,260g (84 meals) | 14% | 12 | 0 | 4,685g |
| The farmer alone, cooking every night he can | 360g (24 meals) | 5% | 72 | 0 | 4,235g |
| Two farmhands, on takeout (four Umas home by Winter) | 7,470g (498 meals) | 23% | 0 | 0 | 17,405g |
| Two farmhands, the field hand on Cook | 3,825g (255 meals) | 11% | 245 | 0 | 23,410g |

- **Takeout bites and never sinks a farm:** alone it's a sixth of what the bin pays, and never a short night; with two
  farmhands and four idle Umas home it's nearly a quarter.
- **Cooking saves gold:** a ★1 batch saves 10–30g of gold against takeout, alone or not: alone it's three nights of his
  meals. Cooking every night he can, the farmer alone buys a quarter of the takeout (360g), spoils nothing and never runs
  short, and ends the year on 4,235g against 4,710g on takeout: the twelve batches' 1,080g of takeout saved is about
  what their goods and the hauls their actions would have brought (he reaches Farm Rank 2's richer places a little
  later). With a cook, the farm feeds itself from the pantry once the field yields (takeout falls from 1,785g in Summer,
  when the field takes all her actions, to 225g in Winter) and her ★2 meals keep the farmhands well fed (68 well-fed
  nights in Winter), so it ends the year a third richer than on takeout.
- **At scale,** the whole farm's cook (Cooking 6 by its second year) feeds eight a night from the pantry, nearly all of
  it ★2, and buys no takeout in its second year: that year ships 190,885g against 137,600g before food. F90's well fed
  gave every well-fed haul a quarter more on top of the extra action, and the second year shipped 266,525g; F91 took that
  quarter off ([well fed](#well-fed), [the farm at scale](#the-farm-at-scale-10-20-and-50-umas)).

### Expeditions

Before sending a party, the post shows the total farm shifts the selected party would miss and the smallest crew
left on any day before its return. The forecast uses town shifts, days off and other already booked expeditions.

From Farm Rank 7, a build card for the **Expedition post** appears in town. Build it for 25,000g, 60 planks and 40 fillets.
It stands the next morning. The post sends one party at a time at Rank 7, two at Rank 8, and three from Rank 9.

<!-- live:expedition-regions -->
| Region | Level | Days | Farm Rank | Power needed | Loot tiers | Most common |
|---|---|---|---|---|---|---|
| Old Fort Ruins | 1 | 2 | 7 | 46 | 1–2 | Bones and horns |
| Echo Cave | 5 | 2 | 7 | 57 | 2–3 | Hides and scales |
| Hilltop Track | 10 | 3 | 8 | 128 | 3–5 | Essences |
| Misty Marsh | 15 | 3 | 8 | 164 | 4–6 | Hides and scales |
| Sunken Temple | 20 | 4 | 9 | 200 | 5–7 | Bones and horns |
| Ember Peak | 25 | 4 | 9 | 238 | 7–9 | Essences |
| Sky Ruins | 30 | 5 | 10 | 304 | 8–10 | Essences |
<!-- /live -->

- **Send · 1:** Choose one to four farmhands and optionally up to eight Kitchen dishes. A farmhand can leave on a farm
  or town day, and a spouse can go. Anyone already in a party, assisting the Kitchen, or cooking in the Contest that
  day is unavailable. Dishes stay in the Warehouse until departure and are reserved when you send the party.
- **Tonight:** The party leaves after its usual shift. It packs two meals per member per day away. The home table eats
  first, then the party takes what it can from the pantry. Takeout covers the rest at 15g a meal on tonight's bill.
- **Away:** She stays off the map, doesn't work or eat on the farm, and keeps her work board assignments. Her profile,
  People in town, and the work board say **Away**, where she went, and when she's back. Her calendar occasions still play.
- **Power:** Add each member's Expedition rank power and talent power, then the dishes. The return uses a seeded draw
  of ±10% before comparing power to the region's need.

<!-- live:expedition-results -->
| Result | Power after the draw ÷ need | Goods | Expedition rank points per member |
|---|---|---|---|
| Great | ≥ 1.25 | ×1.5 | 10 a day + 20 |
| Success | ≥ 1, below 1.25 | ×1 | 10 a day + 10 |
| Retreat | < 1 | ×0.5 | 10 a day |

A dish adds 2 power per star. Base loot is 3 goods per member per day away, rounded to a whole good after the result’s multiplier.
<!-- /live -->

- **Loot:** Each region draws 60% from its main family and 20% from each other family, within its tiers. Stars use the
  party's mean Expeditions quality, with +1 quality on a Great. Loot goes into the Warehouse and ships under the usual
  market rules. The shipment counts toward income and Farm Rank.
- **Return:** Every result counts for the Diary's return challenge and gives each pair +15 bond points per day away
  through the usual bond rules. Later Expeditions challenges need particular results or regions. The last 20 returns
  stay in the post's log. Work done in the morning names each return and reads a line from the story, with a default
  line when the party has none. The v5 save keeps the optional `expeditionLog` field.

#### What expeditions earn at farm scale

The simulation plays seven years with 10, 20 and 50 Umas. It builds the post with earned gold, planks and fillets. The
bot sends the strongest available party to the deepest region it can meet at average luck, using the fewest dishes
needed. It compares year 7 to the same farm and calendar days with the expedition plan switched off.

| Farmhands | Parties sent, Spring / Summer / Autumn / Winter | Expedition shipments | Share of the bin | Estimated farm output for missed shifts | Whole bin with / without expeditions |
|---|---|---:|---:|---:|---:|
| 10 | 0 / 0 / 0 / 4 | 7,585g | 2.2% | 15,201g | 340,170g / 324,285g |
| 20 | 12 / 12 / 11 / 9 | 331,200g | 55.7% | 353,087g | 595,140g / 893,185g |
| 50 | 9 / 9 / 9 / 9 | 615,385g | 31.3% | 417,948g | 1,963,685g / 2,321,935g |

The missed-shift estimate uses the baseline's gross shipments per farmhand shift. It is a rough comparison, since the
bin also includes the farmer's work and the farm grows differently when farmhands leave. All three runs paid every
night in year 7. Filling every slot can still reduce the whole farm's shipments, especially when a party takes people
away from the fields and workshops. The toughest region requires a strong party and good supplies. The 50-Uma bot
mostly chose Ember Peak with the dishes it had.

### The Kitchen

Cooking gets its game. Every batch the farmer cooks can be played at **the stove**, from day one, and a good play makes
more and better meals. **The Kitchen**, a building from Farm Rank 3, cooks **dishes** from **recipes** once a day, and
serves them as **the staff meal**: the whole farm fed and well fed from one play. The rules are `kitchen/stove.ts`,
`kitchen/recipes.ts` and `kitchen/kitchen.ts`.

```
 the farmhouse kitchen (day 1)               the Kitchen (Farm Rank 3, 3,000g · 40 logs · 20 vegetables)
   Cook a batch · 1   six meals, plain         Play · 1, once a day: a menu of up to three recipes ── the stove, 60 s
   At the stove · 1   the stove, 30 s            Rough 6 · Good 8 · Fine 9 ★+1 · Masterwork 12 ★+2 dishes (level 1)
     Rough 6 · Good 8 · Fine 9 ★+1 ·           an assistant (a farmhand): her Cooking × her rank, one of her actions
     Masterwork 12 ★+2 meals                   Serve the staff meal, free: a dish for every 3 mouths tonight
                                                 ──► they eat it in place of their meals, well fed by its stars
 the stove: tap an empty burner to cook the first ticket's next part; tap it again in the green: Perfect +4, Good +2
```

#### The stove: the cooking game

An original time-management cooking game: three burners, a ticket rail and the pass. Its rules and numbers are the old
sketch's (a careful player 92 over 8 seeds, a casual 73, a first try 34), and the screen draws it from the rules' own
functions:

<!-- live:stove-rules -->
| Rule |  |
|---|---|
| The board | 3 burners, a ticket rail, the pass |
| Tickets | On the play’s seed, every 2.4 s–3.8 s from 0.8 s, none in the last 12 s. Half are three-part (they wait 18 s), half two-part (13 s) |
| Cooking a part | Tap an empty burner: it starts the next part of the first ticket (tap a ticket to put it first). The ring fills (a three-part ticket’s parts 3.2 s, 2.6 s, 2 s; a two-part’s 2.4 s and 1.8 s), then a 1 s green window |
| Pulling it | Tap the burner in the green: its middle (0.35 s–0.65 s in) **Perfect +4**, the rest **Good +2**. Too early: **raw -1**, cook it again. Past the green: **burnt -3**, and the pan smokes 0.7 s |
| Served | A ticket whose parts are all on the pass: **+3 a part**. A ticket whose wait runs out leaves: **late -4**. A part pulled for a ticket that left goes to the oldest open ticket of its shape still needing it |
| The score | Points ÷ the seed’s most (7 a part) × 100, rounded, held to 0–100 |
| The seed | Four digits, `draw(uid, day, 'stove', plays)`: the account, the day and the farm’s count of plays (`farm.counts.plays`), so every play differs and a replay is the same |
| Its length | A batch 30 s; the Kitchen’s play 60 s; the Cooking Contest’s dish 60 s |
<!-- /live -->

<!-- live:play-tiers -->
| Tier | Score | Count | Stars | A batch at the stove | The Kitchen at level 1 (6) | At level 5 (15) |
|---|---|---|---|---|---|---|
| **Rough** | 0–49 | ×1 | +0 | 6 meals | 6 dishes | 15 dishes |
| **Good** | 50–74 | ×1.25 | +0 | 8 meals | 8 dishes | 19 dishes |
| **Fine** | 75–89 | ×1.5 | +1 | 9 meals | 9 dishes | 23 dishes |
| **Masterwork** | 90–100 | ×2 | +2 | 12 meals | 12 dishes | 30 dishes |

Rounded half up and never below the base. A play left unfinished (✕, or the app left mid-play) settles as **Rough**: its base, its inputs never lost.
<!-- /live -->

- **The dressing:** each ticket names what's cooking, and its parts their ingredients. A batch's tickets are "Meal": its
  first good, the first again and the second (three parts), or the first and the second (two). The Kitchen's tickets are
  the menu's recipes in turn: the main, the main and the side, or the main and the side. Names never change the timings.
- **The score is the rules':** the screen plays on the domain's functions, and the play's end replays its taps against
  its seed, so it can only show what the rules award. A tap out of order, or past the end, is ignored.
- **Start is the commitment:** it spends the action, takes the inputs and keeps the play in `workshops.current`. The end
  settles it from the taps. ✕ asks once ("Stop? It counts as Rough.") and settles it Rough. Leaving mid-play (the app
  closed, or its screen left) leaves it under way: it settles as Rough the next time the app finds it, unstamped (the
  night's own rule run early, so a phone that fell behind never outranks a newer save with it), or at the night's start
  (step 1, `settleThePlay`). A play is never resumed or replayed: no retries, and no practice mode.
- **Bots for the tests:** a careful bot (pulls in the green's middle, keeps three burners busy) and a casual bot (pulls
  late in the green, two burners). Over 8 seeds of a batch's 30 s, the careful bot scores **100** and the casual **70**.
  The Kitchen's 60 s brings tickets faster than two burners clear them, so there the casual bot lets some go late and
  scores about **57**, still Good. The bots are the tests' and the simulations' only: no build of the game holds them.

#### At the stove

In the farmhouse kitchen (the homestead's sheet), **At the stove · 1** sits beside **Cook a batch · 1**, on the same two
goods you choose (the plain rule's two picked to start): one action, the two goods taken at Start, and 30 s at the
stove. Its tier makes **6, 8, 9 or 12 meals**, their stars the goods' average **+0, +0, +1, +2** (held to ★5), into the
pantry, cooked today. It's never worse than the plain batch. A household meal and a farmhand's Cook stay plain. While a
play is under way, nothing else cooks.

#### The Kitchen: its build and levels

**Offered at Farm Rank 3** for **3,000g · 40 logs · 20 vegetables**, its game built; its upkeep is any building's
(15g a night). It opens from the farm map (a tap on it, once it stands) and from the Book's food row. Its levels are
bought at the Kitchen as a station's are: gold only, from their Farm Rank, the level the next morning (night step 8),
one a day:

<!-- live:kitchen-levels -->
| Level | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Dishes a play (the base) | 6 | 8 | 10 | 12 | 15 |
| Opens at, costs | Farm Rank 3: the build (3,000g · 40 logs · 20 vegetables) | Farm Rank 4, 5,000g | Farm Rank 5, 10,000g | Farm Rank 6, 20,000g | Farm Rank 7, 40,000g |
<!-- /live -->

#### Recipes

The 80 dishes are `dish-<family>-<grade>` (uma-art's dishes atlas), named by their kind and their main's raw good
("Carrot Salad", "Button Mushroom Soup"). A recipe is **two of its main** (its family's good of its grade, raw or
refined) **and one side** (any grade, raw or refined, any stars):

<!-- live:recipe-kinds -->
| Dish | Main (two a dish) | Side (one a dish) |
|---|---|---|
| Salad | vegetables of its grade, raw or refined | any herb or spice |
| Grill | fish of its grade, raw or refined | any herb or spice |
| Soup | mushrooms of its grade, raw or refined | any vegetable |
| Curry | herbs and spices of its grade, raw or refined | any vegetable |
| Bread | grains of its grade, raw or refined | any egg or milk |
| Cake | sweets of its grade, raw or refined | any egg or milk |
| Tart | fruits of its grade, raw or refined | any grain |
| Cookies | nuts and seeds of its grade, raw or refined | any grain |
<!-- /live -->

- **Known when it stands:** Carrot Salad, Carp Grill and Button Mushroom Soup, all from Farm Rank 1's goods.
- **More:** the shop's **Recipes** shelf once the Kitchen stands (in town, free of actions), each **10 × its main's ★1
  price, to 50g** (Carrot Salad 600g); her Friendship 4 (her signature dish, [her signature
  dish](#her-signature-dish)); a request's recipe extra. A recipe is known for good (`workshops.recipes`; the first
  three are known while the Kitchen stands, never written). The shelf is the workshops' first gold sink.
- All dishes can be served at [the Restaurant](#the-restaurant), saved for meals, given as gifts, served at a
  staff meal or wedding reception, and packed for an expedition. Restaurant dishes can also ship in the bin.
  The original 80 recipes remain the choices at [the Cooking Contest](#the-cooking-contest).

<!-- live:recipes -->
| Dish | Id | Takes | At the shop |
|---|---|---|---|
| **Carrot Salad** | `dish-vegetables-1` | 2 Carrot + any herb or spice | Known once the Kitchen stands |
| Potato Salad | `dish-vegetables-2` | 2 Potato + any herb or spice | 550g |
| Cabbage Salad | `dish-vegetables-3` | 2 Cabbage + any herb or spice | 2,600g |
| Onion Salad | `dish-vegetables-4` | 2 Onion + any herb or spice | 1,000g |
| Tomato Salad | `dish-vegetables-5` | 2 Tomato + any herb or spice | 700g |
| Bell Pepper Salad | `dish-vegetables-6` | 2 Bell Pepper + any herb or spice | 600g |
| Eggplant Salad | `dish-vegetables-7` | 2 Eggplant + any herb or spice | 950g |
| Asparagus Salad | `dish-vegetables-8` | 2 Asparagus + any herb or spice | 4,800g |
| Golden Carrot Salad | `dish-vegetables-9` | 2 Golden Carrot + any herb or spice | 6,000g |
| Emperor Pumpkin Salad | `dish-vegetables-10` | 2 Emperor Pumpkin + any herb or spice | 6,000g |
| **Carp Grill** | `dish-fish-1` | 2 Carp or Carp Fillet + any herb or spice | Known once the Kitchen stands |
| Trout Grill | `dish-fish-2` | 2 Trout or Trout Fillet + any herb or spice | 500g |
| Sardine Grill | `dish-fish-3` | 2 Sardine or Sardine Fillet + any herb or spice | 650g |
| Mackerel Grill | `dish-fish-4` | 2 Mackerel or Mackerel Fillet + any herb or spice | 850g |
| Salmon Grill | `dish-fish-5` | 2 Salmon or Salmon Fillet + any herb or spice | 1,100g |
| Sea Bream Grill | `dish-fish-6` | 2 Sea Bream or Sea Bream Fillet + any herb or spice | 1,450g |
| Eel Grill | `dish-fish-7` | 2 Eel or Eel Fillet + any herb or spice | 1,800g |
| Tuna Grill | `dish-fish-8` | 2 Tuna or Tuna Fillet + any herb or spice | 2,350g |
| Silverfin Grill | `dish-fish-9` | 2 Silverfin or Silverfin Fillet + any herb or spice | 3,000g |
| Rainbow Koi Grill | `dish-fish-10` | 2 Rainbow Koi or Rainbow Koi Fillet + any herb or spice | 3,900g |
| **Button Mushroom Soup** | `dish-mushrooms-1` | 2 Button Mushroom or Dried Button Mushroom + any vegetable | Known once the Kitchen stands |
| Shiitake Soup | `dish-mushrooms-2` | 2 Shiitake or Dried Shiitake + any vegetable | 400g |
| Oyster Mushroom Soup | `dish-mushrooms-3` | 2 Oyster Mushroom or Dried Oyster Mushroom + any vegetable | 500g |
| Enoki Soup | `dish-mushrooms-4` | 2 Enoki or Dried Enoki + any vegetable | 650g |
| Chanterelle Soup | `dish-mushrooms-5` | 2 Chanterelle or Dried Chanterelle + any vegetable | 850g |
| Porcini Soup | `dish-mushrooms-6` | 2 Porcini or Dried Porcini + any vegetable | 1,100g |
| Morel Soup | `dish-mushrooms-7` | 2 Morel or Dried Morel + any vegetable | 1,400g |
| Truffle Soup | `dish-mushrooms-8` | 2 Truffle or Shaved Truffle + any vegetable | 1,800g |
| Glowcap Soup | `dish-mushrooms-9` | 2 Glowcap or Glowcap Powder + any vegetable | 2,300g |
| King Reishi Soup | `dish-mushrooms-10` | 2 King Reishi or Reishi Powder + any vegetable | 3,000g |
| Basil Curry | `dish-herbs-spices-1` | 2 Basil or Dried Basil + any vegetable | 450g |
| Mint Curry | `dish-herbs-spices-2` | 2 Mint or Dried Mint + any vegetable | 450g |
| Rosemary Curry | `dish-herbs-spices-3` | 2 Rosemary or Dried Rosemary + any vegetable | 450g |
| Thyme Curry | `dish-herbs-spices-4` | 2 Thyme or Dried Thyme + any vegetable | 600g |
| Ginger Curry | `dish-herbs-spices-5` | 2 Ginger or Ground Ginger + any vegetable | 2,000g |
| Peppercorn Curry | `dish-herbs-spices-6` | 2 Peppercorn or Ground Pepper + any vegetable | 1,000g |
| Cinnamon Curry | `dish-herbs-spices-7` | 2 Cinnamon or Ground Cinnamon + any vegetable | 1,250g |
| Saffron Curry | `dish-herbs-spices-8` | 2 Saffron or Saffron Threads + any vegetable | 1,600g |
| Mandrake Curry | `dish-herbs-spices-9` | 2 Mandrake or Mandrake Powder + any vegetable | 5,200g |
| Phoenix Pepper Curry | `dish-herbs-spices-10` | 2 Phoenix Pepper or Phoenix Spice + any vegetable | 2,700g |
| Wheat Bread | `dish-grains-1` | 2 Wheat or Wheat Flour + any egg or milk | 400g |
| Oats Bread | `dish-grains-2` | 2 Oats or Rolled Oats + any egg or milk | 400g |
| Barley Bread | `dish-grains-3` | 2 Barley or Pearl Barley + any egg or milk | 450g |
| Rice Bread | `dish-grains-4` | 2 Rice or Polished Rice + any egg or milk | 500g |
| Corn Bread | `dish-grains-5` | 2 Corn or Cornmeal + any egg or milk | 1,400g |
| Rye Bread | `dish-grains-6` | 2 Rye or Rye Flour + any egg or milk | 600g |
| Buckwheat Bread | `dish-grains-7` | 2 Buckwheat or Buckwheat Flour + any egg or milk | 750g |
| Wild Rice Bread | `dish-grains-8` | 2 Wild Rice or Hulled Wild Rice + any egg or milk | 1,600g |
| Moonrice Bread | `dish-grains-9` | 2 Moonrice or Moonrice Flour + any egg or milk | 2,400g |
| Sunwheat Bread | `dish-grains-10` | 2 Sunwheat or Sunwheat Flour + any egg or milk | 2,600g |
| Honeycomb Cake | `dish-sweets-1` | 2 Honeycomb or Honey + any egg or milk | 350g |
| Sugarcane Cake | `dish-sweets-2` | 2 Sugarcane or Cane Sugar + any egg or milk | 450g |
| Sugar Beet Cake | `dish-sweets-3` | 2 Sugar Beet or Beet Sugar + any egg or milk | 1,200g |
| Maple Sap Cake | `dish-sweets-4` | 2 Maple Sap or Maple Syrup + any egg or milk | 700g |
| Cacao Pod Cake | `dish-sweets-5` | 2 Cacao Pod or Chocolate + any egg or milk | 950g |
| Vanilla Pod Cake | `dish-sweets-6` | 2 Vanilla Pod or Vanilla Extract + any egg or milk | 1,200g |
| Agave Heart Cake | `dish-sweets-7` | 2 Agave Heart or Agave Syrup + any egg or milk | 1,550g |
| Palm Sap Cake | `dish-sweets-8` | 2 Palm Sap or Palm Sugar + any egg or milk | 2,000g |
| Fairy Honeycomb Cake | `dish-sweets-9` | 2 Fairy Honeycomb or Fairy Honey + any egg or milk | 2,550g |
| Ambrosia Blossom Cake | `dish-sweets-10` | 2 Ambrosia Blossom or Ambrosia + any egg or milk | 3,300g |
| Apple Tart | `dish-fruits-1` | 2 Apple or Apple Preserve + any grain | 350g |
| Pear Tart | `dish-fruits-2` | 2 Pear or Pear Preserve + any grain | 450g |
| Peach Tart | `dish-fruits-3` | 2 Peach or Peach Preserve + any grain | 550g |
| Plum Tart | `dish-fruits-4` | 2 Plum or Plum Preserve + any grain | 700g |
| Orange Tart | `dish-fruits-5` | 2 Orange or Orange Marmalade + any grain | 950g |
| Grape Tart | `dish-fruits-6` | 2 Grape or Grape Jelly + any grain | 1,200g |
| Mango Tart | `dish-fruits-7` | 2 Mango or Mango Pulp + any grain | 1,550g |
| Pomegranate Tart | `dish-fruits-8` | 2 Pomegranate or Pomegranate Molasses + any grain | 2,000g |
| Starpeach Tart | `dish-fruits-9` | 2 Starpeach or Starpeach Nectar + any grain | 2,550g |
| Golden Apple Tart | `dish-fruits-10` | 2 Golden Apple or Golden Apple Preserve + any grain | 3,300g |
| Peanut Cookies | `dish-nuts-seeds-1` | 2 Peanut or Peanut Butter + any grain | 350g |
| Sunflower Seed Cookies | `dish-nuts-seeds-2` | 2 Sunflower Seed or Sunflower Oil + any grain | 750g |
| Sesame Cookies | `dish-nuts-seeds-3` | 2 Sesame or Sesame Paste + any grain | 500g |
| Walnut Cookies | `dish-nuts-seeds-4` | 2 Walnut or Walnut Paste + any grain | 650g |
| Chestnut Cookies | `dish-nuts-seeds-5` | 2 Chestnut or Chestnut Paste + any grain | 850g |
| Almond Cookies | `dish-nuts-seeds-6` | 2 Almond or Almond Paste + any grain | 1,100g |
| Pistachio Cookies | `dish-nuts-seeds-7` | 2 Pistachio or Pistachio Paste + any grain | 1,400g |
| Macadamia Cookies | `dish-nuts-seeds-8` | 2 Macadamia or Macadamia Butter + any grain | 1,800g |
| Thundernut Cookies | `dish-nuts-seeds-9` | 2 Thundernut or Thundernut Oil + any grain | 2,300g |
| Worldseed Cookies | `dish-nuts-seeds-10` | 2 Worldseed or Worldseed Oil + any grain | 3,000g |

All 80 come to 119,450g at the shop (the three known free).
<!-- /live -->

#### Its play

- **Once a day, 1 action, 60 s** at the stove (`workshops.played.kitchen` keeps its day). **The menu:** up to three
  known recipes, sharing the level's base (evenly to start, the remainder to the first; a stepper each), each ingredient
  at one good and one star from the Warehouse (the star held most to start, ties the lower, passing over one the lines
  above already use up; a tap moves it to the next held). To start, the menu is the recipes the Warehouse can make the
  most of. Start takes two of each main and one of each side a dish.
- **Refusals,** in the loop's words: "Short 2 Carp.", "The menu shares 6 dishes.", "You don't know that recipe.",
  "Choose a recipe.", "The Kitchen plays once a day.", "A play is under way.", "No actions left today.".
- **What it makes:** round(base × the tier's count × the assistant's term) dishes, plus a cook's chores (below); the
  extra over the base is shared by largest remainder (ties to the menu's order). Each dish's stars: its two mains' and
  its side's stars averaged, rounded down, + the tier's lift, held to ★5. They go into the Warehouse;
  `farm.counts['cooked:<dish>']` counts them, and `workshops.best.kitchen` keeps the best score.
- **The worked play:** level 1, no assistant, 3 Carrot Salads and 3 Carp Grills from ★1 goods, Fine: 6 × 1.5 = **9
  dishes**, 5 Carrot Salads and 4 Carp Grills, **★2**.
- **The assistant** (optional): a farmhand on the farm today (her farm day: "She's in town today." otherwise) with an
  action tonight. One of her actions tonight is the play's (the work
  board says "1 at the Kitchen", her night counts it at the Kitchen, and the morning's line says "assisted at the
  Kitchen"). Her term is her Cooking aptitude's yield × her
  cooking rank's workshop yield ([what a rank gives](#what-a-rank-gives)) × her line's +10% (+20% from R5, a cook's).
  She gets a point of Cooking practice and counts toward cooking's challenges: `play` by the tier (assist 5 plays, a Fine
  play, a Masterwork) and `dishes` by the stars made (10 dishes of ★4+).
- **A cook's chores:** each cook (her line cooking) on the farm today (a spouse in her room, or a farmhand on her farm
  day) adds a dish to every play for each of her night
  chores (1 from F6, 2 from R7, 3 from S4). They don't bank: a day without a play makes none.

#### The staff meal

- **At the Kitchen, once a day, free:** serve the dishes you have, one dish for up to three people. The game picks
  the highest-star dishes by default. You can also choose the dishes yourself. The preview shows how many people
  will eat the staff meal, and the remaining mouths use the pantry or takeout.
- **Those mouths eat it tonight in place of their two meals:** no pantry meals and no takeout for them. It feeds the
  farmer first, then the Umas in the table's order; a mouth past those counted when it was served eats from the pantry.
- **Every Uma who eats it is well fed** for the meal's days, by the lowest stars served, on [the reception's
  table](#the-wedding-and-the-reception): one rule for both. Never stacking, never shortening one running.

<!-- live:staff-meal -->
| The lowest stars served | ★1 | ★2 | ★3 | ★4 | ★5 |
|---|---|---|---|---|---|
| Well fed | Through tomorrow | Through tomorrow | 2 days | 2 days | 3 days |
<!-- /live -->

- **The morning says it:** "Staff meal · 12 at the table · well fed 2 days" (tagged Well fed; a tap opens the Kitchen).
  `farm.counts.meals` counts the staff meals served.

#### The Cooking Contest

The first festival you play (`kitchen/contest.ts`). On its day you cook **one dish live** at the Kitchen's stove, the
town's cook (`rosa-bell`) judges it against the two rival farms (`wren-ashby`'s orchard and `cole-varga`'s ranch), and
the places pay gold and Farm Rank points at once.

```
 the morning: "Cooking Contest tomorrow", then "Cooking Contest today · +3 for events" ──► the Kitchen
 the Kitchen's card: Enter the Cooking Contest · 3 ──► the entry: a known recipe, its main and its side, a cook (optional)
   ──► the stove, 60 s: one dish, its stars the Kitchen's ──► the judging: the town's cook tastes the three plates
   ──► the board: 1st · You 78 · the orchard 70 · the ranch 61 · +1,800g · +150 Farm Rank points
```

<!-- live:contest-rules -->
| Rule |  |
|---|---|
| Its day | The festival whose rule is the Cooking Contest: Autumn 22, or wherever the story moves it (under the story’s name) |
| The entry | **Enter the Cooking Contest · 3**, at the Kitchen: 3 actions, the festival day’s event actions first, then the day’s own. The Kitchen built (“Build the Kitchen to enter.”); one entry a Contest; no play under way |
| The dish | One known recipe, two of its main and one side at one good and one star each, out of the Warehouse at the entry; an optional cook, a farmhand with an action tonight (one of her actions tonight is the Contest’s) |
| The play | 60 s at the stove on the play’s seed: one dish, its stars the Kitchen’s (its ingredients’ average, rounded down, + the tier’s lift, held to ★5), into the Warehouse after the judging |
| The score | 10 × the dish’s ★ + 0.5 × the play’s score, rounded half up, 0–100. A ★2 dish and a play of 76: 58 |
| The rivals | The orchard (`wren-ashby`, cooking its specialty): 40 + 6 × the Farm Rank. The ranch (`cole-varga`): 26 + 7 × the Farm Rank. Each held to 96; the Farm Rank as last night left it. **Ties go to you** |
| 1st’s prize, paid at once | 600g × the season’s number (Spring 1, Summer 2, Autumn 3, Winter 4) × the year; 150 Farm Rank points |
| 2nd’s prize, paid at once | Half of 1st’s; 75 Farm Rank points |
| 3rd’s prize, paid at once | A fifth of 1st’s; 25 Farm Rank points |
| The record | `farm.festivals` gets `{ id: 'cooking-contest', day, score, place }`; `diary.records['festival:cooking-contest']` keeps the best score |
| The cook | A point of Cooking practice; a 1st counts `won` toward her cooking challenge (the Legend’s); a festival together’s +50, once a festival a year |
| Left unfinished | Judged as Rough (its play’s score 0) at the next open or the night’s start, its prize paid |
<!-- /live -->

The rivals at each Farm Rank, and the score you need for 1st (a tie is yours):

<!-- live:contest-rivals -->
| Farm Rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| The orchard | 46 | 52 | 58 | 64 | 70 | 76 | 82 | 88 | 94 | 96 |
| The ranch | 33 | 40 | 47 | 54 | 61 | 68 | 75 | 82 | 89 | 96 |
| 1st from | 46 | 52 | 58 | 64 | 70 | 76 | 82 | 88 | 94 | 96 |
<!-- /live -->

<!-- live:contest-prizes -->
| Place | Year 1 | Year 2 | Year 3 | Farm Rank points |
|---|---|---|---|---|
| **1st** | 1,800g | 3,600g | 5,400g | 150 |
| **2nd** | 900g | 1,800g | 2,700g | 75 |
| **3rd** | 360g | 720g | 1,080g | 25 |

On Autumn 22, the game’s day. A Contest the story moves takes its new season’s number: Spring 1, Summer 2, Autumn 3, Winter 4.
<!-- /live -->

- **The worked Contest:** Farm Rank 3, Carrot ★1 and Basil ★1, a play of 76 (Fine: a ★2 Carrot Salad): 20 + 38 =
  **58**, level with the orchard, so **1st**: 1,800g now and 150 Farm Rank points tonight.
- **One entry a Contest:** "One entry a Contest." once its dish is on the stove or judged. Refusals, in the loop's
  words: "No contest today.", "Build the Kitchen to enter.", "A play is under way.", "Entering takes 3 actions.",
  "You don't know that recipe.", "That isn't a main for Carrot Salad.", "Short 1 Carrot.", "Only a farmhand cooks for
  you.", "She has no action left tonight.".
- **The cook** is a farmhand with an action tonight (`today.cook`; the work board counts it "at the Kitchen", beside an
  assistant's), on her farm day or her town day alike: the Contest is a festival in town, and where she is never gates
  it. Her Cooking doesn't change the dish: one dish is made whoever
  cooks. She gets a point of Cooking practice, a 1st counts `won` toward her cooking challenge (only the Legend's reads
  it, [the challenges](#the-challenges)), and her bar gets a festival together's +50, once a festival a year
  ([points from every source](#points-from-every-source)).
- **The Farm Rank's points** come at night: each result in `farm.festivals` adds its place's points when the night
  recomputes the rank ([the Farm Rank](#the-farm-rank)); the gold is paid at the judging.
- **Left unfinished** (✕, or the app left mid-play), the dish is judged as Rough, its play's score 0, at the next open or
  at the night's start (`settleThePlay`), on the Contest's day: a ★1 dish from ★1 goods scores 10, 3rd. The judging's
  scene plays only when the play ends on the stove's screen.
- **A moved Contest** plays on the story's day under the story's name, every year, and nothing on Autumn 22; its 1st
  pays by its new season's number.
- **The stove's bots** (8 seeds of the Contest's 60 s; the careful bot plays 100 on each, the casual 46–67):

| Farm Rank | The goods | The careful bot (100: Masterwork, +2 ★) | The casual bot (46–67: Rough or Good, +0 ★) |
|---|---|---|---|
| 3 (58, 47) | ★1 | ★3 dish, 80: **1st** on every seed | ★1 dish, 33–44: **3rd** on every seed |
| 3 | ★2 | ★4, 90: 1st | ★2, 43–54: 2nd on five seeds of eight, else 3rd |
| 3 | ★3 | ★5, 100: 1st | ★3, 53–64: 1st on five seeds of eight, else 2nd |
| 10 (96, 96) | ★1 | ★3, 80: **3rd** | ★1, 33–44: **3rd** |
| 10 | ★2 | ★4, 90: 3rd | 3rd |
| 10 | ★3 | ★5, 100: **1st** | ★3, 53–64: 3rd |

  At Farm Rank 10 only a ★5 dish and a play of 92 or more win: the Contest asks for your best goods and your best play.

**The judging,** a short scene at the play's end on the dialogue engine: the town's cook (the Uma who plays the role,
her bust in the day's season; her role's disc with no master data) speaks by your place, one line a tap, **Skip** to the
board. The lines are the game's own, original, in git beside the smith's, with no name in them:

<!-- live:contest-scene -->
**The judging** (at the play’s end)

| When | Who | Line |
|---|---|---|
| Always | (narration) | Three covered plates wait on the long table under the lanterns: the orchard’s, the ranch’s and yours. |
| Always | The cook | “Three farms, three plates. I taste them all the same way: slowly, and with a clean spoon each time.” |
| Always | (narration) | She tries the orchard’s, then the ranch’s, then yours, and sets the spoon down. |
| 1st | The cook | “This one. It tastes like it was cooked for the people at home, not for a judge.” |
| 1st | The cook | “First place goes to your farm. Don’t let it go to your head: next year I’ll be hungry again.” |
| 2nd | The cook | “Close. Very close. A little more care at the stove and this is the plate I’d remember.” |
| 2nd | The cook | “Second place for your farm. Bring me another one next year.” |
| 3rd | The cook | “Honest food. I’d be glad of it on any ordinary night.” |
| 3rd | The cook | “But today the other two had more to say. Third place for your farm, and keep cooking.” |
| Always | (narration) | The board goes up beside the table, the chalk still drying. |
<!-- /live -->

#### On screen

- **The stove** (`?stove=1`), full screen, landscape, one thumb: ✕, the seed (four digits) and a time bar in the header,
  the score and its tier on the right; the ticket rail across the top (each ticket its name, its parts as chips, grey to
  cook, orange on a burner, green on the pass, and its wait as a bar; a tap puts it first, outlined); three burners in
  the middle, each a ring that fills orange while its part cooks, then green, its Perfect middle shaded ("Now!"); the
  pass on the right. "Ready…" comes before the clock, which doesn't pause after. The end's card says the tier, the score
  and what it made ("12 meals ★3 into the pantry", "5 Carrot Salad ★2 · 4 Carp Grill ★2"), and **Done**.
- **The Kitchen's sheet** (`?sheet=kitchen`), two columns: **Today's play** (the menu; the assistant, None or each
  farmhand with an action tonight with her Cooking and her term; **Play · 1 · 6 dishes**, with the seed and the actions
  left below it, or the refusal), and **The staff meal** (tonight's table, the dishes held, **Serve the staff meal**, or
  "Served · 12 at the table · well fed 2 days"), **its level** (the next, with Upgrade or what it waits for) and **the
  recipes known**, each with what it takes, the shop's shelf a tap away.
- **The shop's Recipes shelf,** in town, below the seeds once the Kitchen stands: each recipe not known, what it takes
  and its price.
- **The Book's food row** says a staff meal served ("staff meal for 12") and opens the Kitchen once it stands (the
  farmhouse kitchen before).
- **Dishes** sit on the Warehouse's Dishes shelf and in the gift picker's Dishes.
- **The Cooking Contest's card** comes first on the Kitchen's sheet: the day before, "Cooking Contest tomorrow" (enter
  here tomorrow with 3 actions); on its day, "Cooking Contest today" with **Enter the Cooking Contest · 3**, greyed with
  its refusal below ("Build the Kitchen to enter.", with **The Kitchen ›** to its Build card); once judged, the board.
  Before the Kitchen stands, the sheet shows only that card and "Build the Kitchen first: the Farm Rank offers it at
  3.", so the morning's Contest lines always have somewhere to open.
- **The entry** (`?sheet=contest`), a wide side panel in two columns: **Your dish** (the recipes known, a tap each, one
  that can't be made marked Short; its main and its side, a tap for the next held; "Carrot Salad ★1 before the stove ·
  Fine ★2 · Masterwork ★3") and **The judging** (the orchard's and the ranch's scores at today's Farm Rank, the score's
  rule, the cook: None or each farmhand with an action tonight, with her Cooking), then **Enter · 3**, with the seed
  and the actions left below it, or the refusal. Enter opens the stove. Its help says the score, the rivals and the
  prizes. Once judged, it shows the board.
- **The Contest's dish on the stove** plays under the festival's name (the story's, when it renames it), each ticket
  the dish, its parts its main and its side. Its end, or ✕'s Rough, opens **the judging**: the cook's scene over the
  stove, then **the board**: the place, each farm's score (the best first, you ahead on a tie), "+1,800g · +150 Farm
  Rank points", the dish made ("Carrot Salad ★3 · into the Warehouse"), "The Farm Rank points count tonight." and
  **Done**.

#### Its save

v5 grows in place, and nothing moves `updatedAt`:
- `workshops.current` is the play at the stove under way: its workshop, what it is (`play`: `batch`, `kitchen` or
  `contest`), its day, its seed and its length in seconds, the Kitchen's assistant or the Contest's cook, and the inputs
  taken (a batch's two `goods`, the Kitchen's `menu`: each recipe's dish, share, main and side, or the Contest's menu of
  one line and one dish). The shape from before the stove (a workshop, an assistant and a day, which no build ever
  wrote) reads as no play.
- `workshops.played.kitchen` is the day of its last play, `workshops.best.kitchen` its best score and
  `workshops.recipes` the recipes learnt.
- `today.staff` is tonight's staff meal (its mouths and well-fed days), `today.assistant` the Kitchen's assistant
  today and `today.cook` the Cooking Contest's cook; all clear with the day.
- **The Cooking Contest** adds nothing new at the top: its result is `farm.festivals` (`{ id: 'cooking-contest', day,
  score, place }`, one a Contest) and its best score `diary.records['festival:cooking-contest']`; its gold is `gold`.
- The Kitchen's level is `buildings.kitchen` (1–5), a level bought today waiting in `farm.builds`.
- `farm.counts.plays` (the stove's plays: the seed's count), `farm.counts['cooked:<dish>']` and `farm.counts.meals`.
- The morning's `staff` line is a new kind in `summary.money`, a built line may carry the Kitchen's new level, and a
  farmhand's work line her action as its assistant (`summary.work[].kitchen`).

A save from before reads as no play, no staff meal and no cook.

#### What the simulations say

The season and scale simulations build the Kitchen once the Farm Rank offers it (after the Farm Rank 3 stations on the
two-year whole farm; first of the Farm Rank 3 builds at scale), and from then on the farmer plays it every day he can as
the casual bot and serves the staff meal; he buys a recipe on the shop's shelf for what the farm ships most of
([the farm at scale](#the-farm-at-scale-10-20-and-50-umas), [the pacing](#the-pacing)).

| Run | The Kitchen | Plays (score) · dishes | Staff meals | Takeout | Well fed, a night | Gold at the end |
|---|---|---|---|---|---|---|
| The whole farm (two farmhands and the Coop's and the Mine's), its second year | Stands Spring 10 | 5 (Good) · 40 | 13 | 165g | 8 of 8, as with the cook alone | 159,140g (191,300g without it) |
| 10 Umas, year 4 | Since year 3 | 20 (59) · 154 | 32 | 1,125g | 9 of 10 | 612,190g |
| 20 Umas, year 4 | Since year 3 | 32 (59) · 308 | 38 | 3,150g | 18 of 20 | 665,715g |
| 50 Umas, year 4 | Since year 3 | 35 (60) · 637 | 38 | 1,890g | 47 of 50 | 1,188,820g |

- **At scale it feeds the farm:** takeout falls to a few thousand gold a year, and nearly every Uma is well fed every
  night (from 6 of 10, 14 of 20 and 37 of 50 before it). **10 and 20 stay fully in real jobs** in year 4; 50 runs
  further past the farm's jobs (35 in real jobs, from 38), since the staff meal takes the cooks' work.
- **It plays when the Warehouse holds its whole base,** one good and one star an ingredient: a quarter to three quarters
  of the days. Its dishes come out ★1–2 (its inputs' ★1, Good adds no star), so a staff meal feeds through tomorrow.
- **On a small farm it doesn't pay:** two farmhands' goods can't fill an 18-good menu most days, and their cook already
  feeds them; the farm ends its second year about a sixth poorer with it.
- **The stove's bots:** over 8 seeds a batch's 30 s, the careful bot scores 100 and the casual 70; the Kitchen's 60 s,
  100 and 57.

### The Restaurant

The Restaurant opens at **Farm Rank 7**. Order it with **40,000g, 80 planks, 40 fillets and 30 vegetables**.
It stands the next morning. Build the Kitchen to cook the dishes for its shifts.

#### Shifts and recipe pages

Open the Restaurant from the farm map. Choose a stage and stock up to **12 portions of up to three dishes**,
choosing the exact star lots. The tray needs at least as many portions as there are tickets. One shift costs
**one action** and the Restaurant serves once a day. Cleared stages stay open for repeat shifts.

<!-- live:restaurant-stages -->
| Stage | Recipe page | Dish types | Covers to clear | Time |
|---|---|---|---|---|
| 1 | Farm Counter | 1 | 4 of 6 | 45 s |
| 2 | The Pantry | 2 | 5 of 7 | 45 s |
| 3 | From the Water | 2 | 6 of 8 | 50 s |
| 4 | Orchard Table | 2 | 7 of 9 | 50 s |
| 5 | Barn and Mill | 3 | 7 of 10 | 55 s |
| 6 | Woodland Supper | 3 | 8 of 10 | 55 s |
| 7 | Coastal Table | 3 | 9 of 11 | 60 s |
| 8 | House Menu | 3 | 10 of 12 | 60 s |
<!-- /live -->

Tap an open ticket and its matching plate. The seeded queue can order only what's in the tray. A correct plate
uses one portion. A wrong plate costs 2.5 seconds, and an expired order earns nothing. From Stage 3, at least one
correct plate must be a learned Restaurant dish from an earlier stage. The queue includes one of these in the
first two tickets. The cover rate gives a stove grade at the same 50%, 75% and 90% thresholds.

One eligible Uma can serve, spending one work action. She must be on the farm and free of an expedition, Kitchen
play or Cooking Contest. Serving talent adds 0.35 seconds per step to a ticket's nine-second window, and Serving
rank adds 0.25 seconds per rank. The solo tip is 5% of sales. A server adds a percentage point per talent step and
rank. On her Serving line, F2 and R5 each add 0.75 seconds and 10 percentage points to the tip, capped at 25%.
Each Serving chore from a present Uma gives a four-second grace period on one order while the shift is still open.
Actual covers count for her challenges, and the night's rank credit goes to Serving. Story scenes still use tray Rhythm.

The tray, time and successful tickets survive a reload. Return to the Restaurant to resume or end the shift.
Ending the day settles any open shift, pays for completed tickets and returns all remaining portions. Sales and
tips count toward the night's income and Farm Rank. The morning lists the shift and any recipes learned overnight.

#### Learning and cooking

Each first clear opens a page of **15 recipes**. Learn a recipe as soon as the farm has produced its exact inputs,
including the raw goods behind processed inputs and the dishes and their ingredients behind recipe components.
Purchased and gifted stock can be used once the farm has the matching discovery. Grade gates the recipe, and
stars determine the quality of the dish. The Recipes tab shows ready recipes, shortages and sources by stage.

The Kitchen cooks these alongside its original recipes, up to three per play. A menu with a Restaurant recipe
can use any number of dishes up to the Kitchen level's base, including a single dish. Exact ingredients can span
star lots. Input stars are weighted by quantity and rounded down before the stove's lift, up to ★5. The inputs
leave the Warehouse at Start, including any component dishes.

- **Sell.** Use the bin or a Restaurant ticket. A new dish's ★1 base starts at 115% of its immediate ingredients,
  rounded to 5g, capped at 135% of the ingredients with component recipes expanded to their raw or processed
  inputs. Winter demand and crate easing apply at the bin. Tickets pay the out-of-demand price plus the tip.
- **Cook with it.** Use a dish where a later recipe names it. The discovery remains after the dish is spent.
- **Save for meals.** Choose a dish in the Kitchen or Book. It becomes six portions at the same stars, free of
  actions, with the pantry's three-night expiry and ★2+ well-fed benefit. Those six portions can save up to 90g
  of takeout. The separate staff meal still takes one dish per three mouths.

<!-- live:restaurant-recipes -->
| Recipe | Id | Grade | Exact ingredients per dish | ★1 base |
|---|---|---|---|---|
| Mint Carrot Ribbons | `dish-restaurant-001` | G1 | 2 × Carrot G1 + 1 × Mint G2 | 190g |
| Warm Basil Carrots | `dish-restaurant-002` | G1 | 2 × Carrot G1 + 1 × Basil G1 | 190g |
| Crisp Potato Coins | `dish-restaurant-003` | G1 | 2 × Potato G2 + 1 × Rosemary G3 | 180g |
| Warm Cabbage Ribbons | `dish-restaurant-004` | G1 | 2 × Cabbage G3 + 1 × Mint G2 | 650g |
| Slow Onion Cups | `dish-restaurant-005` | G1 | 2 × Onion G4 + 1 × Thyme G4 | 300g |
| Carrot and Egg Skillet | `dish-restaurant-006` | G1 | 1 × Carrot G1 + 1 × Egg G1 | 140g |
| Potato Egg Cake | `dish-restaurant-007` | G1 | 1 × Potato G2 + 1 × Egg G1 | 130g |
| Basil Carp Parcels | `dish-restaurant-008` | G1 | 1 × Carp G1 + 1 × Basil G1 | 100g |
| Mint Trout Bites | `dish-restaurant-009` | G1 | 1 × Trout G2 + 1 × Mint G2 | 110g |
| Button and Onion Broth | `dish-restaurant-010` | G1 | 1 × Button Mushroom G1 + 1 × Onion G4 | 150g |
| Toasted Shiitake | `dish-restaurant-011` | G1 | 2 × Shiitake G2 + 1 × Basil G1 | 145g |
| Carrot Milk Soup | `dish-restaurant-012` | G1 | 1 × Carrot G1 + 1 × Milk G2 | 160g |
| Oat Breakfast Bowl | `dish-restaurant-013` | G1 | 1 × Oats G2 + 1 × Milk G2 | 140g |
| Honey Custard Cup | `dish-restaurant-014` | G1 | 1 × Honeycomb G1 + 1 × Egg G1 + 1 × Milk G2 | 200g |
| Herb Stock | `dish-restaurant-015` | G1 | 1 × Button Mushroom G1 + 1 × Carrot G1 + 1 × Basil G1 | 155g |
| Pear and Oat Cups | `dish-restaurant-016` | G2 | 1 × Pear G2 + 1 × Rolled Oats G2 | 120g |
| Honey Apple Spoon | `dish-restaurant-017` | G2 | 1 × Apple G1 + 1 × Honey G1 | 105g |
| Rye Onion Crisp | `dish-restaurant-018` | G2 | 1 × Rye Flour G6 + 1 × Onion G4 | 220g |
| Wheat and Herb Flatbread | `dish-restaurant-019` | G2 | 1 × Wheat Flour G1 + 1 × Dried Basil G1 | 150g |
| Buckwheat Breakfast Cake | `dish-restaurant-020` | G2 | 1 × Buckwheat Flour G7 + 1 × Egg G1 + 1 × Milk G2 | 295g |
| Apple Hand Pie | `dish-restaurant-021` | G2 | 1 × Apple G1 + 1 × Wheat Flour G1 + 1 × Egg G1 | 180g |
| Pear Milk Pudding | `dish-restaurant-022` | G2 | 1 × Pear G2 + 1 × Milk G2 + 1 × Egg G1 | 215g |
| Barley Mushroom Pilaf | `dish-restaurant-023` | G2 | 1 × Pearl Barley G3 + 1 × Shiitake G2 | 125g |
| Cornmeal Griddle Cakes | `dish-restaurant-024` | G2 | 1 × Cornmeal G5 + 1 × Milk G2 | 335g |
| Peanut Oat Crumble | `dish-restaurant-025` | G2 | 1 × Peanut Butter G1 + 1 × Rolled Oats G2 | 130g |
| Sunflower Carrot Roast | `dish-restaurant-026` | G2 | 1 × Sunflower Oil G2 + 1 × Carrot G2 + 1 × Herb Stock G1 | 390g |
| Herb Cream | `dish-restaurant-027` | G2 | 1 × Milk G2 + 1 × Dried Rosemary G3 | 175g |
| Tomato Pan Sauce | `dish-restaurant-028` | G2 | 2 × Tomato G5 + 1 × Dried Basil G1 | 240g |
| Ginger Beet Glaze | `dish-restaurant-029` | G2 | 1 × Beet Sugar G3 + 1 × Ground Ginger G5 | 550g |
| Plain Pastry Shell | `dish-restaurant-030` | G2 | 1 × Wheat Flour G1 + 1 × Egg G1 | 140g |
| Carp and Herb Rice | `dish-restaurant-031` | G3 | 1 × Carp G1 + 1 × Polished Rice G4 + 1 × Herb Stock G1 | 310g |
| Pepper Trout Toast | `dish-restaurant-032` | G3 | 1 × Trout Fillet G2 + 1 × Bell Pepper G6 + 1 × Wheat and Herb Flatbread G2 | 330g |
| Sardine Potato Plate | `dish-restaurant-033` | G3 | 1 × Sardine G3 + 1 × Potato G2 + 1 × Rosemary G3 | 190g |
| Tomato Sardine Toast | `dish-restaurant-034` | G3 | 1 × Sardine Fillet G3 + 1 × Tomato Pan Sauce G2 + 1 × Wheat and Herb Flatbread G2 | 565g |
| Mackerel with Thyme | `dish-restaurant-035` | G3 | 1 × Mackerel G4 + 1 × Thyme G4 | 165g |
| Mackerel Cream Bake | `dish-restaurant-036` | G3 | 1 × Mackerel Fillet G4 + 1 × Herb Cream G2 + 1 × Potato G2 | 415g |
| Salmon Rice Cakes | `dish-restaurant-037` | G3 | 1 × Salmon G5 + 1 × Polished Rice G4 + 1 × Egg G1 | 280g |
| Ginger Eel Bowl | `dish-restaurant-038` | G3 | 1 × Eel G7 + 1 × Ground Ginger G5 + 1 × Polished Rice G4 | 640g |
| Carp Cabbage Rolls | `dish-restaurant-039` | G3 | 1 × Carp G1 + 1 × Cabbage G3 + 1 × Herb Stock G1 | 525g |
| Trout and Mint Potatoes | `dish-restaurant-040` | G3 | 1 × Trout G2 + 1 × Potato G2 + 1 × Mint G2 | 175g |
| Shiitake Salmon Soup | `dish-restaurant-041` | G3 | 1 × Salmon G5 + 1 × Shiitake G2 + 1 × Herb Stock G1 | 350g |
| Oat Crusted Sardines | `dish-restaurant-042` | G3 | 1 × Sardine G3 + 1 × Rolled Oats G2 + 1 × Egg G1 | 215g |
| Smoked Trout Pastry | `dish-restaurant-043` | G3 | 1 × Trout Fillet G2 + 1 × Plain Pastry Shell G2 + 1 × Onion G4 | 360g |
| Rosemary Fillet Supper | `dish-restaurant-044` | G3 | 1 × Carp Fillet G2 + 1 × Dried Rosemary G3 + 1 × Potato G2 | 230g |
| Harbour Fish Stock | `dish-restaurant-045` | G3 | 1 × Carp Fillet G1 + 1 × Onion G4 + 1 × Thyme G4 | 255g |
| Apple Basket Tart | `dish-restaurant-046` | G4 | 1 × Apple G1 + 1 × Plain Pastry Shell G2 | 200g |
| Honey Pear Galette | `dish-restaurant-047` | G4 | 1 × Pear G2 + 1 × Honey G1 + 1 × Plain Pastry Shell G2 | 275g |
| Peach Custard Tart | `dish-restaurant-048` | G4 | 1 × Peach G3 + 1 × Milk G2 + 1 × Plain Pastry Shell G2 | 315g |
| Plum Oat Squares | `dish-restaurant-049` | G4 | 1 × Plum G4 + 1 × Rolled Oats G2 + 1 × Egg G1 | 220g |
| Orange Peel Cakes | `dish-restaurant-050` | G4 | 1 × Orange G5 + 1 × Wheat Flour G1 + 1 × Cane Sugar G2 | 260g |
| Apple Rye Pudding | `dish-restaurant-051` | G4 | 1 × Apple Preserve G2 + 1 × Rye Flour G6 + 1 × Milk G2 | 265g |
| Peach Dressed Cabbage | `dish-restaurant-052` | G4 | 1 × Peach G3 + 1 × Cabbage G3 + 1 × Mint G2 | 415g |
| Pear Onion Toast | `dish-restaurant-053` | G4 | 1 × Pear G2 + 1 × Onion G4 + 1 × Wheat and Herb Flatbread G2 | 340g |
| Maple Plum Turnover | `dish-restaurant-054` | G4 | 1 × Plum Preserve G4 + 1 × Maple Syrup G4 + 1 × Plain Pastry Shell G2 | 405g |
| Orange Herb Trout | `dish-restaurant-055` | G4 | 1 × Orange G5 + 1 × Trout G2 + 1 × Mint G2 | 220g |
| Milk Poached Pears | `dish-restaurant-056` | G4 | 1 × Pear G2 + 1 × Herb Cream G2 | 255g |
| Ginger Peach Compote | `dish-restaurant-057` | G4 | 1 × Peach G3 + 1 × Ground Ginger G5 + 1 × Cane Sugar G2 | 490g |
| Plum and Onion Chutney | `dish-restaurant-058` | G4 | 1 × Plum G4 + 1 × Onion G4 + 1 × Beet Sugar G3 | 405g |
| Orange Syrup | `dish-restaurant-059` | G4 | 1 × Orange G5 + 1 × Cane Sugar G2 | 190g |
| Apple Oat Filling | `dish-restaurant-060` | G4 | 1 × Apple Preserve G1 + 1 × Rolled Oats G2 | 130g |
| Duck Egg Rye Toast | `dish-restaurant-061` | G5 | 1 × Duck Egg G3 + 1 × Rye Flour G6 + 1 × Tomato Pan Sauce G2 | 495g |
| Goat Milk Barley Bowl | `dish-restaurant-062` | G5 | 1 × Goat Milk G4 + 1 × Pearl Barley G3 | 230g |
| Duck Egg Pepper Custard | `dish-restaurant-063` | G5 | 1 × Duck Egg G3 + 1 × Bell Pepper G6 + 1 × Milk G3 | 295g |
| Goat Milk Onion Gratin | `dish-restaurant-064` | G5 | 1 × Goat Milk G4 + 1 × Onion G4 + 1 × Potato G2 | 330g |
| Goat Milk Herb Tart | `dish-restaurant-065` | G5 | 1 × Goat Milk G4 + 1 × Dried Thyme G4 + 1 × Plain Pastry Shell G2 | 415g |
| Duck Egg Mushroom Parcel | `dish-restaurant-066` | G5 | 1 × Duck Egg G3 + 1 × Oyster Mushroom G3 + 1 × Plain Pastry Shell G2 | 335g |
| Eggplant and Corn Bake | `dish-restaurant-067` | G5 | 1 × Eggplant G7 + 1 × Cornmeal G5 + 1 × Tomato Pan Sauce G2 | 625g |
| Asparagus in Herb Cream | `dish-restaurant-068` | G5 | 1 × Asparagus G8 + 1 × Herb Cream G2 | 755g |
| Roasted Tomato Oats | `dish-restaurant-069` | G5 | 1 × Tomato G5 + 1 × Rolled Oats G2 + 1 × Herb Stock G1 | 330g |
| Walnut Barley Loaf | `dish-restaurant-070` | G5 | 1 × Walnut Paste G4 + 1 × Pearl Barley G3 + 1 × Egg G1 | 265g |
| Chestnut and Oat Cakes | `dish-restaurant-071` | G5 | 1 × Chestnut Paste G5 + 1 × Rolled Oats G2 + 1 × Cane Sugar G2 | 300g |
| Sesame Cabbage Parcels | `dish-restaurant-072` | G5 | 1 × Sesame Paste G3 + 1 × Cabbage G3 + 1 × Polished Rice G4 | 470g |
| Goat Milk Set Custard | `dish-restaurant-073` | G5 | 1 × Goat Milk G4 + 1 × Duck Egg G3 + 1 × Beet Sugar G3 | 470g |
| Roasted Mushroom Filling | `dish-restaurant-074` | G5 | 1 × Oyster Mushroom G3 + 1 × Shiitake G2 + 1 × Onion G4 | 220g |
| Sweet Grain Crust | `dish-restaurant-075` | G5 | 1 × Buckwheat Flour G7 + 1 × Cornmeal G5 + 1 × Honey G1 | 435g |
| Enoki and Thyme Bowl | `dish-restaurant-076` | G6 | 1 × Enoki G4 + 1 × Thyme G4 + 1 × Herb Stock G1 | 320g |
| Chanterelle and Rice Pilaf | `dish-restaurant-077` | G6 | 1 × Chanterelle G5 + 1 × Polished Rice G4 + 1 × Herb Stock G1 | 360g |
| Porcini Cream Pot | `dish-restaurant-078` | G6 | 1 × Porcini G6 + 1 × Herb Cream G2 | 330g |
| Morel and Onion Toast | `dish-restaurant-079` | G6 | 1 × Morel G7 + 1 × Onion G4 + 1 × Wheat and Herb Flatbread G2 | 450g |
| Chanterelle and Goat Milk Bake | `dish-restaurant-080` | G6 | 1 × Chanterelle G5 + 1 × Goat Milk G4 + 1 × Potato G2 | 310g |
| Woodland Pastry Braid | `dish-restaurant-081` | G6 | 1 × Roasted Mushroom Filling G5 + 1 × Plain Pastry Shell G2 + 1 × Duck Egg G3 | 530g |
| Sesame Enoki Ribbons | `dish-restaurant-082` | G6 | 1 × Enoki G4 + 1 × Sesame Paste G3 + 1 × Cabbage G3 | 460g |
| Dried Shiitake Barley Bowl | `dish-restaurant-083` | G6 | 1 × Dried Shiitake G2 + 1 × Pearl Barley G3 + 1 × Herb Stock G1 | 330g |
| Oyster Mushroom Rye Toast | `dish-restaurant-084` | G6 | 1 × Oyster Mushroom G3 + 1 × Rye Flour G6 + 1 × Herb Cream G2 | 360g |
| Asparagus Chanterelle Tart | `dish-restaurant-085` | G6 | 1 × Asparagus G8 + 1 × Chanterelle G5 + 1 × Plain Pastry Shell G2 | 810g |
| Grape and Walnut Bowl | `dish-restaurant-086` | G6 | 1 × Grape G6 + 1 × Walnut Paste G4 + 1 × Rolled Oats G2 | 320g |
| Mango Oat Custard | `dish-restaurant-087` | G6 | 1 × Mango G7 + 1 × Milk G2 + 1 × Egg G1 | 340g |
| Cocoa Chestnut Slice | `dish-restaurant-088` | G6 | 1 × Chocolate G5 + 1 × Chestnut Paste G5 + 1 × Sweet Grain Crust G5 | 815g |
| Cinnamon Apple Cream | `dish-restaurant-089` | G6 | 1 × Ground Cinnamon G7 + 1 × Apple Oat Filling G4 + 1 × Herb Cream G2 | 570g |
| Woodland Gravy | `dish-restaurant-090` | G6 | 1 × Dried Porcini G6 + 1 × Onion G4 + 1 × Herb Stock G1 | 485g |
| Sea Bream with Orange | `dish-restaurant-091` | G7 | 1 × Sea Bream G6 + 1 × Orange G5 + 1 × Thyme G4 | 345g |
| Sea Bream and Cornmeal | `dish-restaurant-092` | G7 | 1 × Sea Bream Fillet G6 + 1 × Cornmeal G5 + 1 × Harbour Fish Stock G3 | 790g |
| Tuna on Herb Flatbread | `dish-restaurant-093` | G7 | 1 × Tuna Fillet G8 + 1 × Wheat and Herb Flatbread G2 + 1 × Basil G1 | 635g |
| Ginger Tuna Rice Plate | `dish-restaurant-094` | G7 | 1 × Tuna G8 + 1 × Polished Rice G4 + 1 × Ground Ginger G5 | 700g |
| Bream and Tomato Parcel | `dish-restaurant-095` | G7 | 1 × Sea Bream G6 + 1 × Tomato Pan Sauce G2 + 1 × Plain Pastry Shell G2 | 605g |
| Eel with Beet Glaze | `dish-restaurant-096` | G7 | 1 × Eel G7 + 1 × Ginger Beet Glaze G2 + 1 × Polished Rice G4 | 925g |
| Salmon and Plum Supper | `dish-restaurant-097` | G7 | 1 × Salmon G5 + 1 × Plum and Onion Chutney G4 + 1 × Harbour Fish Stock G3 | 885g |
| Mackerel Pepper Pilaf | `dish-restaurant-098` | G7 | 1 × Mackerel G4 + 1 × Bell Pepper G6 + 1 × Harbour Fish Stock G3 | 460g |
| Trout and Chanterelle Pie | `dish-restaurant-099` | G7 | 1 × Trout Fillet G2 + 1 × Chanterelle G5 + 1 × Plain Pastry Shell G2 | 345g |
| Tuna and Asparagus Skillet | `dish-restaurant-100` | G7 | 1 × Tuna G8 + 1 × Asparagus G8 + 1 × Herb Cream G2 | 1,025g |
| Tuna and Grape Toast | `dish-restaurant-101` | G7 | 1 × Tuna Fillet G8 + 1 × Grape G6 + 1 × Wheat and Herb Flatbread G2 | 720g |
| Seared Bream with Herb Cream | `dish-restaurant-102` | G7 | 1 × Sea Bream Fillet G6 + 1 × Herb Cream G2 + 1 × Mint G2 | 505g |
| Sardine and Mushroom Tray | `dish-restaurant-103` | G7 | 1 × Sardine Fillet G3 + 1 × Roasted Mushroom Filling G5 + 1 × Potato G2 | 430g |
| Ginger Harbour Stew | `dish-restaurant-104` | G7 | 1 × Mackerel Fillet G4 + 1 × Ground Ginger G5 + 1 × Harbour Fish Stock G3 | 790g |
| Orange Coastal Glaze | `dish-restaurant-105` | G7 | 1 × Orange Syrup G4 + 1 × Harbour Fish Stock G3 + 1 × Dried Thyme G4 | 615g |
| House Pumpkin and Barley | `dish-restaurant-106` | G8 | 1 × Emperor Pumpkin G10 + 1 × Pearl Barley G3 + 1 × Woodland Gravy G6 | 1,330g |
| Pumpkin Woodland Pie | `dish-restaurant-107` | G8 | 1 × Emperor Pumpkin G10 + 1 × Roasted Mushroom Filling G5 + 1 × Plain Pastry Shell G2 | 1,105g |
| Almond Peach Tart | `dish-restaurant-108` | G8 | 1 × Almond Paste G6 + 1 × Ginger Peach Compote G4 + 1 × Plain Pastry Shell G2 | 915g |
| Vanilla Pear Custard | `dish-restaurant-109` | G8 | 1 × Vanilla Extract G6 + 1 × Pear G2 + 1 × Goat Milk Set Custard G5 | 800g |
| Pomegranate Oat Crown | `dish-restaurant-110` | G8 | 1 × Pomegranate G8 + 1 × Sweet Grain Crust G5 + 1 × Goat Milk Set Custard G5 | 1,270g |
| Cocoa Apple Crumble | `dish-restaurant-111` | G8 | 1 × Chocolate G5 + 1 × Apple Oat Filling G4 + 1 × Sweet Grain Crust G5 | 815g |
| Maple Walnut and Rye | `dish-restaurant-112` | G8 | 1 × Maple Syrup G4 + 1 × Walnut Paste G4 + 1 × Rye Flour G6 | 340g |
| Spiced Grape Pastry | `dish-restaurant-113` | G8 | 1 × Grape Jelly G6 + 1 × Ground Cinnamon G7 + 1 × Plain Pastry Shell G2 | 585g |
| Mango and Goat Milk Tart | `dish-restaurant-114` | G8 | 1 × Mango G7 + 1 × Goat Milk G4 + 1 × Plain Pastry Shell G2 | 490g |
| Tuna with Orange Glaze | `dish-restaurant-115` | G8 | 1 × Tuna Fillet G8 + 1 × Orange Coastal Glaze G7 + 1 × Asparagus G8 | 1,670g |
| Porcini Fish Pie | `dish-restaurant-116` | G8 | 1 × Sea Bream Fillet G6 + 1 × Woodland Gravy G6 + 1 × Plain Pastry Shell G2 | 970g |
| Saffron Harbour Rice | `dish-restaurant-117` | G8 | 1 × Saffron Threads G8 + 1 × Harbour Fish Stock G3 + 1 × Polished Rice G4 | 655g |
| Ember Pepper Broth | `dish-restaurant-118` | G8 | 1 × Bell Pepper G6 + 1 × Peppercorn G6 + 1 × Woodland Gravy G6 | 740g |
| Sunday Duck Egg Gratin | `dish-restaurant-119` | G8 | 1 × Duck Egg G3 + 1 × Roasted Mushroom Filling G5 + 1 × Herb Cream G2 | 570g |
| Festival Fruit Board | `dish-restaurant-120` | G8 | 1 × Pomegranate G8 + 1 × Peach G3 + 1 × Orange Syrup G4 | 510g |
<!-- /live -->

#### Roster playthrough

Three established farms ordered the Restaurant on Spring 1 of Year 2. The crews produced the ingredients through
field plans, ranch care and collection, fishing, foraging and station loads across the seasons. The player
scheduled the work, bought supplies, played the stove with an assistant and served tickets.

| Umas | Nights to Stage 8 | Nights to all 120 learned | Days waiting for a shift menu | Nights with missing discoveries on open pages | Ticket sales and tips | Bin test sale | Pantry meals eaten | Missed tickets |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 36 | 53 | 28 | 46 | 19,016g | 235g | 6 | 2 |
| 20 | 28 | 45 | 20 | 33 | 17,797g | 305g | 1,290 | 2 |
| 50 | 24 | 45 | 16 | 38 | 17,249g | 305g | 1,692 | 2 |

Each run shipped one component dish, converted one for meals and cooked components into later recipes. The two
misses were deliberate. Pantry totals include routine Uma cooking on the 20- and 50-Uma farms. More hands helped
stock the shifts, while winter crops and later processing still set the pace of the last discoveries.

## Part 2 — The Umas and the farm's progress

Every character lives in the town from day 1, and you meet her there by introducing yourself, one of the day's actions.
Met, she keeps living in town, where you find her for a talk, a gift and her events. **Nobody lives on the farm until
she marries you:** a friend you invite to work (a farmhand) comes on her **farm days**, the days her life in town leaves
free, and only a spouse moves in, into a room in a house.
Every Uma has a talent, G to S, in each of nine activities, read from her stats, and climbs six ranks in each by working
and meeting a challenge. The farm climbs a ladder of its own, the Farm Rank, from what it earns and grows, and grows by
building: the rank offers each place, and you build it with gold and the farm's goods. There are no global chapters and
no farm-wide story.

```
 day 1: your name ──► the opening's lines ──► Home: nobody met, everyone in town
 the town: Enter for free ──► walk to her ──► Introduce yourself (1 action): met ──► her meeting scene
           she lives in town ──► Friendship 3: Invite her to work (1 action) ──► a farmhand, on the farm on her farm days
 the wedding ──► her room in a house ──► she lives on the farm
             └─► no room free: "Needs a room", in town ── the morning a room frees ──► she moves in
```

### The roster

The roster is everyone you've met, and her `joined` the day you met her. Everyone on it **lives in town**, but a spouse
in her room, who **lives on the farm** (`atHome`, `onFarm` and `farmHome` read a spouse's `love.house` only). A farmhand
is on the farm by day on her farm days and works it those nights ([farmhands](#farmhands)); talks, gifts and her events
reach everyone you've met, wherever she is, an action each.

#### How Umas join

You meet her in town by introducing yourself: see [meeting her](#meeting-her). Met, she joins the roster at Friendship 0
and lives in town. There's no cap on how many you meet. Nothing is drawn.

#### Living in town

Everyone you've met lives in town until she marries you. She keeps her ranks and her route. Talks, gifts, her evening
and her events reach her: you find her in town on her days, where her fixed schedule puts her ([who's
where](#whos-where)), and ask her out there. Once she's a farmhand she's on the farm on her farm days, in front of you
there, and in town on her town days ([farmhands](#farmhands)). After the wedding she takes a room on the homestead and
lives on the farm; with no room free she lives in town, "Needs a room", until the morning one frees ([rooms and
moves](#rooms-and-moves)).

#### The retired Dorm

The Dorm is retired: Invite to the farm, its beds and levels, swaps, its page, its tile on the farm map, its upkeep (5g
a bed past three), its Farm Rank offers and its morning lines are gone. The save keeps `dorm` in its shape (v5 grows in
place):

- **Loading clears `dorm.home` and `dorm.swaps`,** whatever they held. Everyone who lived in the Dorm lives in town from
  then, keeping her ladders, ranks, farmhand flag, perks, gallery and everything else.
- **`dorm.level` and `buildings.dorm` are kept,** still checked on the eight levels, and nothing reads them.
- **A loan** a save still holds toward a Dorm level (`dorm:<level>`) is repaid like any other ("Dorm level 2"); the
  office offers no Dorm level ("The Dorm is retired.").
- **A morning from before** with the Dorm's news ("Dorm level 2 · 5 beds", "{name} is home") is read and those lines
  dropped.
- **A story** may still name `dorm` as a scene's backdrop (the Dorm's building); world.json's words for it are read and
  not shown (a note, not an error).
- **Loading never stamps the save:** `account.updatedAt` doesn't move, and nothing else changes.

#### The roster's screens

- **The Gate** (its quick look on the map): "Everyone lives in town.", with the Town (see [meeting her](#meeting-her)).
- **The roster** is the People page's **Work** view (`/hearts?view=work`; `/roster` lands there): everyone on the roster,
  on the farm today or in town, as an album of cards in three columns, under the line "3 on the farm · 2 in town · by
  joined" (on the farm today: the spouses in their rooms and the farmhands on their farm day).
  - **Her face** carries her favourite line's mark top left (a Carrot farming, a Pine Log foraging, a Carp fishing,
    Copper Ore mining, on a light disc), her best talent's grade bottom right on a coloured chip (S gold, A coral, B
    blue, C green, D and below grey), and her level in words top right ("F7", "R4", "S2").
  - **Her card** says her best rank ("Hand · Farming", or "Novice" before her first points) and her best talent
    ("Fishing A"). Sorted by an activity, it says her rank and talent in it ("Hand · C") and the activity, with her
    points when sorted by them ("Fishing · 52 pts"). An Uma in town today is dimmed, and her second line says "In town".
  - **Search** by name.
  - **Filters:** Where (On the farm, In town: today's); Favourite line (Farming, Mining, Fishing, Foraging); her talent in
    each activity (C+, B+, A+, S); her rank in each activity (Novice … Legend).
  - **Sorts:** Joined (the default, oldest first), Talent and Rank points (each in a chosen activity, the sort sheet's
    "In" chips, Farming until one is chosen; highest first), and Name.
  - **A tap on her card** opens her profile on its Work side: "Favourite · Fishing (×1.2 rank points)", "Joined Spring
    1", and "On the farm today" or "In town today"; then her nine activities, each with its talent chip, her
    favourite mark on her favourite, "Hand · 52 / 160" (her points alone at Legend), and a line below: "Next: Catch 10
    fish at the River · 3/10", "Points full · …", or "Ranks up tonight · …". A challenge whose target is 1 shows without
    a count.

The Hearts view, her profile's Hearts side, Chat and Gift are the romance's: see [the People page](#the-people-page) and
[her profile](#her-profile).

### The town

**The cast lives in town from day 1:** the owner's Umas, the story's cast (sisters included), in her default outfit or
the pack's outfit for her. Enter town and walk between its places for free. Each place lists who's there now. The launch cast works the town's professions in pairs.
The mayor keeps her office. Tap a cast member to introduce yourself, including an Uma you meet on her town shift.

#### Town professions and the week

The week runs continuously from Monday on farm day 1, through the four 30-day seasons and the year boundary.
The two Umas in each profession share a day off. The early partner works the first three of the other weekdays
in town. The late partner covers the last three. Each works the other three days on the farm after hiring.
Before hiring those are personal days. Her profile and Uma Library show town, farm and rest days, the Calendar
shows the weekday, and the Ledger runs farm orders only on scheduled farm shifts.

Marriage changes her residence. Once housed, she commutes to the same town shifts and comes home for meals
and evenings. On her profession's day off she can visit an authored location or spend the day at home. A
spouse who has yet to be hired keeps her personal days. Expeditions take precedence over her daytime
location. The service links at a shop or office are available even if its scheduled worker is off or away.

The launch plan covers 50 Umas in 25 professions. It uses provisional pairs in launch order and distributes
days off across the week. A complete valid story-pack plan can replace those assignments. An older cast member
without a profession uses her legacy schedule. The Cooking Contest goes straight to its result board when
its judge is off, away or entered with the farm. The ring bench leaves a note when the smith is unavailable.

In the four-season shift pilot, both partners in one profession married through the game's wedding rule and
kept their shifts. Both returned for household meals on town and rest days. The prepared plots and Coop received
watering and care over the year, and the same shift cycle continued into Spring of Year 2.

| Hired Umas | Scheduled farm workers per day | Scheduled town workers per day within the hired roster |
|---:|---:|---:|
| 10 | 4–5 | 4–5 |
| 20 | 8–9 | 8–9 |
| 50 | 21–22 | 21–22 |

```
 the farm map ──► the Town opens for free (the town and its shop stay open for the day)
                    the painted map: six districts, seventeen public destinations, and a shared Inn
                      tap a place (free) ──► who's here now, with faces · its keeper at her post, and her post's menu
                        tap an Uma ──► her menu: Introduce yourself · 1 │ Talk · 1 │ Give a gift · 1 │ Ask her out · 2
                                                 │ Invite her to work · 1 │ Her event · 1, when it's Ready
                    People: everyone, met or not, where she is today · find by name · met first or by name
```

#### The map

The painted town overview fills the main canvas, with navigation in a compact sidebar. Tap one of six districts, then tap a building or landmark. A building has a fully modeled room, service controls and HD-2D sprites for people on site. Plaza, Market, Harbour and Track use outdoor views with portraits for people on site. Tap a person in the scene or in the location list to open her full-screen conversation. Back returns to that destination. District and All town buttons take you back through the maps. Walking is free. A direct link opens the destination.

| District | Destinations |
|---|---|
| Plaza | Plaza noticeboard, Mayor's Office, Estate Office, Little Studio |
| Market | Market stalls, General Store, Little Bakery, Salon |
| Library & Café | Town Library, Café |
| Harbour | Quay, Harbour Inn |
| Smithy & Ranch | Smithy, Garage, Rancher's |
| Hilltop | Hilltop Track, Expedition post |

All 25 town professions offer services from the building panel. A working counter names the Uma on her morning or afternoon shift. A self-service counter stays available. The reports use live farm stock, facilities, recipes, seasonal sources, tools, and festival records. Services link to the existing work, gathering, shopping, household and festival screens.

#### Harbour Inn

Every Uma in the town cast lives at the Inn until she takes a farm room. Umas without an outing, town shift or farm shift can be found in the lobby. The directory shows residents where they are today and opens their ordinary conversation and event menu. A spouse waiting for a room stays on the directory. A housed spouse leaves the directory, keeps her weekly town and farm shifts, and comes home to the farm. The Inn still provides meal and expedition planning after its residents move out.

Links that used to go to an authored house open the Inn. An existing story setting, scene id or Library replay keeps its authored location and original history.

#### Town Library, Kitchen and Café

Browse Kitchen recipes, the Restaurant's recipe index, and guides to exact-grade ingredients from Day 1. Once the Kitchen stands at Farm Rank 3, learn Trout Grill permanently for 500g or exchange the farm's exact Trout G2 discovery for the lesson. Possessing a bought Trout alone does not teach it. Select the recipe in the regular Kitchen menu. Each portion takes two Trout or two Trout Fillets of the same quality plus an herb or spice. The first Café order takes one cooked portion. The Restaurant still needs its own stage clears and each exact-grade discovery. Book stock and recipe proof are shown separately.

#### Town Requests

The farm's Requests board, Plaza noticeboard and Café share one book. It opens at five Umas met. The Cafe's first Trout Grill order is available once the Kitchen stands and stays offerable until delivered. Three weekly slots offer Food, Makers and Town orders from 18 authored definitions. Qualifying ingredients and proof use the catalogue's exact item IDs. Recurring orders last seven days from acceptance. Accept and cancel are free. Accept holds eligible stock against automatic surplus shipping. Cancel, expire or deliver to release the hold.

Delivery spends one regular action and takes the exact goods. The player sees the actual posting Uma, where available. The price starts from the warehouse goods' bin value at delivery or the Kitchen dish's base plate value at its stars. An additional 10% is capped at 250g. Base value counts for Farm Rank once. The payout appears under **Town orders** in the next morning's receipt and Ledger, and joins the normal upkeep and loan accounting.

The six spots, by the story's ids, so a `spot` trigger or a Town note can name one. `town.json` names each, gives it a
line and a keeper; whatever it leaves, the game's own plays:

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

The shops and offices are the game's own, each kept by one of the town's people:

<!-- live:town-shops -->
| Location | Its name | Its line | At her post |
|---|---|---|---|
| `store` | The General Store | Seeds for the season, and the town’s bakery. | The shopkeeper |
| `rancher` | The Rancher’s | Animals and feed, out by the paddock. | The rancher |
| `mayor` | The Mayor’s Office | Permits, plans and the town’s ledger. | The mayor |
| `smith` | The Smithy | An anvil, a forge and a bench for fine work. | The smith |
<!-- /live -->

#### Who's where

**Every Uma keeps a fixed schedule.** The town, her profile and the Calendar read the shift and her current
presence through `town/town.ts`. Personal time uses the authored outing, routine or home.

<!-- live:town-schedule -->
|  | The rule |
|---|---|
| Weekly profession | Three town shifts, three farm shifts after hiring and the profession’s day off. The partners alternate town and farm shifts across the six working days |
| Personal time | A free-day outing, else her routine or home. A hired Uma keeps assigned farm days for farm work |
| Legacy schedules | An Uma without a weekly profession uses the story’s routine, job and home. The game’s fallback is her favourite spot on 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 2, 5, 8, 11, 14, 17, 20, 23, 26, 29 or 3, 6, 9, 12, 15, 18, 21, 24, 27, 30 each season, according to cast order |
| Her favourite spot | Her cast entry’s `spot`; else the 6 in turn by her place in the cast, 3 Umas each (the 1st to 3rd at `plaza`, the 4th to 6th at `market`…, the 19th starting again) |
| A spot | Holds everyone the schedules put there, with no cap; nobody is placed at random |
| On the farm | A spouse with a room lives on the farm and commutes on her assigned town days. Farmhand tasks run on her farm shifts. A spouse with a room joins the household at night after town shifts and days off |
| The town’s people | The mayor keeps her post. The romance cast fill the town professions on their shifts. Shop menus work on days off |
| Her line | One a day (`draw(uid, day, 'town-line:<id>', 0)`) of her bible’s `townLines`, else the game’s 6: “Oh, hello! Out for a walk too?” “Lovely day for it, isn’t it?” “You’re from the farm up the road, aren’t you?” “I come here when I need to think.” “Good to see you, {farmer}.” “Busy day? Mine’s only just starting.” |
<!-- /live -->

- **Without a weekly profession,** her story's schedule uses her routine's first stop
  whose days of the season and seasons hold, else her job on its days. Retired houses and days at home resolve to the Harbour Inn.
- **The fallback for an Uma without a profession or written schedule** is her favourite spot (her cast `spot`, else the six in turn by her
  place in the cast) on every third day of each season, starting on day 1, 2 or 3 by her place in the cast. She is at the Inn on her other personal days.
- **Each destination** fits everyone the schedules put there. The door shows a count and the panel lists the Umas.
- **The posts:** the mayor's assigned post is permanent. Town professions show the cast members working that day,
  and an uncovered counter offers self-service. Only a playable Uma or the mayor has a town menu. Old links to
  retired town portraits open the map.
- **On the farm:** a farmhand comes on her farm shifts. A spouse with a room comes home at night, including after
  her town shifts. A spouse waiting for a room keeps her current residence and schedule.

#### Her menu

Tap an Uma (`?uma=<id>`) for her menu, on [the dialogue engine](#the-dialogue-engine): her bust on the left (her portrait
in the day's outfit, her face changing as she answers; else her master-data bust), and on the right her name, how she
stands with you (her stage in [the Uma loop](#the-uma-loop) with her ladder's level: "Not met yet", "Acquaintance · F1",
"Friend · F3", "Farmhand · F5", "Sweetheart · R4", "Engaged", "Married · S2"), where she is (the place, and her job's
words when she's at work), and her dialogue. **Talk**, **Gift**, **Date**, and **Event** stay in a fixed row below the
dialogue. Long greetings and replies scroll above the row. Each item shows its cost and whether it's available.
**Back** returns to the map.

<!-- live:her-menu -->
| Item | Cost | When |
|---|---|---|
| Introduce yourself | 1 action | You haven’t met her: in town today, where she is now. She’s met, and her meeting scene plays |
| Talk | 1 action | Met: once a day each, +15. Her line for the day plays on the dialogue engine |
| Give a gift | 1 action | Met: once a day each, one good from the Warehouse at the stars you choose; her reaction plays on the dialogue engine |
| Ask her out | 2 actions | Her evening, its play and her scene: a hangout with a friend (Friendship 3 and up), a date with a sweetheart (Romance 1 and up) or a spouse. One evening a day across everyone |
| Invite her to work | 1 action | A friend (Friendship 3 and up), once: she’s a farmhand from today, on the farm on her farm days (the days her town schedule leaves free) |
| Her event | 1 action | Met, when her next event is Ready; a special day’s event actions pay first |
<!-- /live -->

- **Her line:** before you talk today, her line for the day in town (her bible's `townLines`, else the game's six);
  a talk plays today's talk over the town ([talk that knows the day](#talk-that-knows-the-day): her greeting for where
  she is, then her line or a small talk), and then her last line stays, her face happy; after a gift, her line for its
  taste ([talk that knows the day](#talk-that-knows-the-day)), her face by her taste. `{farmer}` is your name.
  The authored `{address}` token in town lines and chats uses your name before marriage and “husband” afterward.
- **Introduce yourself** meets her: she joins the roster at Friendship 0 and keeps living in town, and her meeting
  scene plays over the town at once ([her meeting scene](#her-meeting-scene)).
- **Talk** and **Give a gift** are the romance's acts: +15, and her taste's points (see [her route](#her-route)),
  floating as "+15 ♥" by her name. They're the same acts as Chat and Gift on her profile, each an action there too,
  once a day each wherever you do them, and only **where you meet her** (below).
- **Ask her out · 2** opens her evening (`?evening=<id>`) while she's in front of you, it's open to her (a hangout with
  a friend from Friendship 3, a date with a sweetheart from Romance 1 or a spouse) and the day has its two actions:
  one evening a day across everyone, the same kinds and scenes as on the farm ([the evening](#the-evening)). Otherwise
  it says why: "From Friendship 3", "Spent this evening ✓", "Tonight's evening is spent", "That takes 2 actions.".
- **Farm invitation** is a separate offer that stays on the conversation and relationship screens from Friendship 3
  until accepted, including while out of actions. Invite her in person for one action to play her farm invitation
  scene. She joins the crew on her existing farm days and starts on auto work.
- **Event** opens the ready relationship scene directly over the conversation, including while she's at home. It takes
  an action, using the special day's event actions first. The button shows **Not ready** while she has no scene ready.
- **Not out now:** "At home today. Out on Spring 7, at the Library." (her next day out, from her schedule; with her profile once met); one on the farm: "She lives
  on the farm. Her profile ›" (a spouse in her room), or for a farmhand on her farm day "On the farm today, her farm day.
  Her profile ›" (her menu still works there: she's in front of you).
- **One of the town's people** (her face at her post, or on the People list) shows her role, what she does and her
  ties with the cast, each with its line, and her post's menu: the general store's **Buy seeds ›** opens the shop;
  the mayor's office's **Order a build ›** and **Borrow or repay ›** both open the office's sheet, its orders and its
  loans side by side ([loans](#loans)); the rancher's **Buy an animal** waits for the ranch. Talking with her counts
  nothing and costs nothing.
- **A Town note** an introduction, a talk or a gift unlocks says "Town note · *title* ›" there, a tap to it in the
  Diary: an introduction or a talk at a spot visits it ([Town notes](#town-notes)).

**Where you meet her** (the talk-and-gift rule, and the evening's): you talk with her, give her a gift, ask her out and
invite her to work only where she's in front of you: **on the farm** when she lives there (a spouse in her room) or
it's her farm day (a farmhand), else **in town where she is today**, once you've gone into town (`whereYouMeet`).
Her menu in town is always where she is; her profile follows the same rule ([her profile](#her-profile)). **Her Ready
event plays from anywhere** (her menu, her profile, the morning's Ready line, the calendar). Why: going into town takes
no actions and the map shows who's where, so the town is where the day's talks happen, her schedule says
which days, and an Uma on the farm is always in front of you; an event is her route's milestone, offered by the
morning, the calendar and the People page, so a day she's at home never strands it. **Where she is never gates an
occasion** either: her birthday, a festival's day and night and the story's days play from the calendar wherever she is
([occasion scenes](#occasion-scenes)), on a farm day as on a town day.

#### The town's screen

- **The Town** on the farm map opens `/town`, loaded on demand: **Map** and **People** in tabs (`?view=people`), and
  **Shop**. Its title is the town's name when the world gives one, else "Town". It records your arrival on open.
- **People:** everyone in town and the town's people, each with her face and name and where she is today ("At the
  Café today", "At the Bakery, at work today", "At home · out Spring 7" with her next day out, "On the farm" for a
  spouse in her room, "On the farm today" for a farmhand on her farm day, "At the Café, most days" for a keeper, "In
  town"), and **Met** for
  anyone you’ve met. **Find by name** handles case and accents. **Relationship** puts closer Umas first. **Name** is alphabetical. Use **Married**, **Romance**, **Hands** or **Met** to narrow the list while searching. **Met** shows acquaintances and friends who have not joined the crew. A tap goes to her: to her place and her menu when she's out, else her
  menu ("At home today").
- **Lean:** faces load as they scroll into view.

#### The save

The save's `town` holds, per character (a character id, or a sister's `s<outfitId>`), you and her by day: the days
you've talked (`talks`), the last day you talked (`last`) and the last day you gave her a gift (`gift`), each 0 before
any. Met or not is the roster (`roster[id].joined` the day you met her). The gift day grows v5 in place: an older v5's
record reads it as 0, and nothing moves `updatedAt`.

### First-year day-part pilot

Eight 120-day runs used the same seed, 500g opening balance, build priorities and courtship policy. The solo farmer
started fresh. In the staffed fixtures, 10, 20 or 50 synthetic hires were available from the first morning and worked
their staggered town rotas. The bot focused on one invented Uma and spent about four actions a day on that route.

| Farmhands | Friendship 3, old → morning | Confession | First date | Farm Rank | Morning-shift shipping | Ending gold, old → morning | Takeout meals, old → morning |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 10 → 10 | 23 → 23 | 24 → 24 | 2 | 8,170g | 3,180g → 3,180g | 102 → 102 |
| 10 | 9 → 9 | 22 → 21 | 23 → 22 | 4 | 100,345g | 33,455g → 50,055g | 18 → 80 |
| 20 | 10 → 9 | 23 → 21 | 24 → 22 | 6 | 339,640g | 67,845g → 77,725g | 109 → 131 |
| 50 | 10 → 9 | 23 → 21 | 24 → 22 | 7 | 583,605g | 229,830g → 195,815g | 85 → 224 |

The morning-shift runs had zero nights in arrears. The 50-Uma run had 48 tiles wither, down from 60, while shipping
fell from 616,490g to 583,605g. On the 10-Uma run the build policy reached enough exact base-grade milk on 51 afternoons
under the old timing and none under the new timing. The morning-run crew had two or more of the exact higher-grade
carp on 87–110 afternoons across the four sizes. These figures depend on build and stock choices. The run logged all
nine tracked ingredients, action use and every route milestone reached through Romance 10. A separate married run
reached True Love on the twentieth night with five visits and one stay each night.

### Farmhands

Open **Farm → Work → Work calendar** to see 30 days per season in six columns and two rows. Swipe or use the arrows for days 13–24 and 25–30. Green counts show assigned orders,
with up to six portraits of Umas on those orders when the shift details are available. Amber counts show the
priority jobs the shift still leaves open, such as dry crops, harvest, animal care, meals or another station load.
Select a future date to see the Umas on shift, their orders, and the expected gaps using today’s crops, stock and plans.
The forecast uses the selected date’s rota and known expeditions. Crops, purchases and meals produced on intervening
days can change the outcome. The last 120 days of actual records show allocated orders, work performed and jobs still
open when the day ended. Order edits after the shift apply on the Uma’s next farm day. Contests, the Kitchen and the
Restaurant can assign only actions left after crew work and other bookings.

A farmhand who is [away on an expedition](#expeditions) misses her farm shifts. Her jobs stay on the work board while she's away.

A friend you invite to work is a **farmhand** ([the invitation to work](#the-invitation-to-work)). She keeps her life in
town, and comes to the farm on her **farm days**: the days her town schedule (her routine, her part-time job, or the
default schedule's spot) doesn't put her out in town. On a farm day she's on the farm by day, in front of you for talks,
gifts and her evening, and off the town's map; she gives the farm a few actions on the tasks you set her on the **work
board**, in the Book, works them just before Afternoon, and eats her two
meals on the farm. On her **town days** she's at her place in town, by her schedule, and doesn't work, eat on the farm
or cost anything. Nobody but a spouse in her room lives on the farm. Any Uma can do
any task, and each task has an **aptitude**: a level for her that starts from her talents and rises with every action she
spends on it, bringing more goods, better stars and new tricks. As the farmhands take the farm's work over, your own ten
actions turn to the valley and its people. The rules are `farm/farmhands.ts`.

```
 her farm days: the days her town schedule leaves free (20 of 30 on the default schedule; a season with none, the
                default schedule's other eight); a spouse in her room, every day
 your day (5 + 5 actions)              at the start of Afternoon: each farmhand on her farm day, in invitation order
   invite her to work · 1 (a friend)     (on a town day she's in town: no work, no meals on the farm)
   the Book: the work board (free)       her actions today: 3, +1 settled in, +2 a spouse, +1 well fed this morning,
     her tasks, in your order              all at the farm's pace (half, from the second short night of upkeep)
     harvest · water · plant ·           field work, station loads and animal care first, with crop orders coordinated
     clear and till   (a plot's rows)      on shared tiles; gathering and digging share what's left, a turn each
     load (a station)                    every action: a point of practice in its aptitude; her goods into the Warehouse
     forage · chop (an area)             her place today (where she spent the most) pays rank points, bonds, her line
     fish (a spot)                     then the farm eats (her two meals), then the crops grow: her watering counts
     care for animals (the Coop or the Barn) · work a face (the Mine or the Quarry) · cook (the farmhouse kitchen)
 the morning: Work done · "Name · 4 of 4 actions · watered 6 tiles · caught 1 fish · +1 good"; Ranks · "Name · Watering 3"
```

#### Her day

<!-- live:farmhand-day -->
|  | Her actions |
|---|---|
| A farmhand’s farm day (she’s on the farm by day, and works her actions overnight; on a town day she doesn’t work) | 3 |
| Settled in: from 12 days after you invited her (a season) | +1 |
| Once she’s your spouse | +2 |
| Well fed this morning: a ★2+ meal last night, a household meal the day before, a wedding’s reception, a spouse’s breakfast | +1 |
| Half pace: from the second short night of upkeep in a row, until it’s paid | Half of them all, rounded down, never below 1 |
<!-- /live -->

- **Her farm days** are the three weekly shifts from her [town profession](#town-professions-and-the-week).
  The Ledger shows them by weekday. Legacy farmhands without a profession use the days their town routine leaves
  free, including at-home days, and a legacy spouse with a room can work every day.
- **Her town job** is the other three working days, opposite her partner. The Ledger shows town days, her day
  off and her next farm shift separately.
- **On a farm day she's on the farm by day,** in front of you ([where you meet her](#her-menu)): Chat, Gift and her
  evening are on her profile and her menu without going into town. The town's People list says "On the farm today" and
  her profile's **Where to find her** "Today · On the farm", then the season's farm days ("On the farm · 2, 3, 5, 6, 8,
  9, 11, 12") and her town days by place ("The Café · 1, 4, 7, 10"). That night she works her board's tasks and eats two
  meals, the pantry first, then takeout ([food](#food)); at night she goes home to town.
- **On a town day she's at her place in town,** by her schedule: her menu is there once you go into town, and the board
  says "In town today · back Spring 5" (her next farm day). She has no farm work. A spouse with a room still
  comes home to eat. A
  festival or any other occasion never moves her: a farm day on a festival is still a farm day, and every occasion she
  has plays from the calendar wherever she is ([occasion scenes](#occasion-scenes)).
- **Settled in** is a season after you invited her (`roster[id].farmhand`, the day you did). **Married:** once she's
  your spouse.
- **Well fed this morning:** a household meal you cook today keeps everyone well fed today and tomorrow, and a ★2+
  meal she eats from the pantry tonight through tomorrow ([well fed](#well-fed), [food](#food)); the night after notes
  the farmhands still well fed as the morning comes (`today.fed`), and each works one more action that day. So a meal gives one more action the next day, once: two meals
  the same day still give one, and a meal every day gives one every day. A wedding's reception and a spouse's breakfast,
  which feed the farm from the morning, give it that day.
- **Half pace** reads the day as it was left: the night that counts the second short night still works at full pace, and
  the next day's is half ([upkeep](#upkeep)).
- **Her cost is her meals:** two on each farm day, from the pantry or takeout at 15g ([food](#food)). She pays no
  upkeep; once she's a spouse in her room she's a resident, 10g a night as well as her meals ([upkeep](#upkeep)).
- **The farmer's ten are never touched.** A task on her board is hers: you don't spend your actions on it.

#### The work board

**Work** on either Farm view opens the Book’s work board. **Needs coverage** forecasts the current assignments and
lists the work left, with supply shortages marked separately. **Assign next job** picks the highest-priority available
job and a worker with spare actions, using aptitude to break ties. Animal feed, meals, harvest and watering come first.
The number of spare actions and the recommendations update as assignments change. A job link opens the worker picker
for that job, including after the shift when it can be planned for the worker’s next farm day.

**Auto assign jobs** is on for each new farmhand. Existing workers keep their settings and orders. **Enable for
unassigned workers** switches on workers without orders. A worker’s own orders run first. With her remaining actions,
she picks up work with the other automatic workers who are on shift, using the farm’s current stock, plots, buildings
and targets. Animal feeding comes first. The scheduler reserves up to a quarter of spare automatic crew actions, capped at four, for gathering so a busy field still leaves time for wood, forage, fish or mining. Manual gathering counts toward that budget. The crew collects ready animal products early and starts the first ready load at each station with a production target ahead of preparing and sowing more ground. When a skilled worker or upgraded can can water a row at once, the crew fills an eligible seed row before watering it, as long as there is time left. It skips ordinary watering for crops that cannot ripen before withering. Orchard plants, crops that grow in the next season, and the marked festival crop still get watered. Gathering rotates between activities, favors the fullest open areas, and alternates between starting at the deepest open reach and rotating through the other reaches. Mining can use already discovered stairs when Farm Rank allows it. Turn auto work off on her card to use her orders alone.

The [four-season crew balance](design/seasonal-crew-balance.md) records plot capacity by planted rows and every crew job for rosters of 20, 30 and 50.

**Next 7 days** shows which shifts can cover the farm’s daily work and which might be short of workers or supplies. A
job selected on a future date opens the picker with that date’s available workers. The recurring order follows the
chosen Uma’s farm shifts.

**Jobs by place** includes the plots, all forage and chopping areas, fishing spots, mines, animals, station loads,
cooking, seed saving and surplus shipping. **Show all jobs** also shows locked and idle locations. **Quick jobs** repeat
each shift. **Combined plot orders** adds Harvest + water, Plant + water or the full crop routine in one step. The
detailed editor still handles exact seeds, individual rows, collection targets and locations. Buying seeds, buying
animals and authorizing construction are farmer decisions. An automatic worker can buy fodder for animals the farm
already owns. The farmer can take discovered stairs by hand at any open dig.

At Farm Rank 3, auto-workers gather and keep the logs needed to build the Sawmill. Once it is built, they chop logs and queue Sawmill loads for a tracked lumber project or the next available plank project, including the next rank's project. They protect the project's logs and planks from surplus shipping. Feeding, watering, cooking and harvest come first, and a crew goal you assigned takes priority over the automatic lumber goal. You still order each build yourself.

**Mill loads** with unreserved input enter Auto Work even without a production target. Auto Work schedules one
unplanned load per day, after essential work and before surplus shipping. A specific production target still uses the
set recipe and counts output already held or queued.

The **Work calendar** uses the same job list for the selected day. Before a shift it shows the forecast and scheduled
workers. Afterward it shows who used actions on each order when the shift has a detailed record. Free actions and jobs
that still need staff are shown separately from jobs that need supplies. Gathering opportunities show the full hauls
left. Future dates use the crew’s schedules and the farm’s current stock and crops, with daily work reset for the date.
Past dates show their saved totals.

The Book's **Work board** has a card for each farmhand, in the order they work: her face and name (a tap opens her
profile's Work side), her job and the day she started, her farm days this season ("Farm days · 2, 3, 5, 6, 8, 9, 11,
12", "every day" for a spouse in her room); on a farm day her actions today with what adds to them ("+1 settled in", "+1
well fed", "half pace" in red) and **Tonight**, what she'll do as the farm stands now ("3 of 3 actions · watered 3
tiles"); on a town day "In town today · back Spring 5" in their place;
and her tasks in your order, each with her aptitude's level ("Water · rows 1 and 2 · Watering 2"), **↑** to move it up
and **✕** to remove it. **Add a task** (up to six) opens a side panel: what, then where (for the field's tasks, the plot
(each plot cleared, and the next greyed with why: "Opens at Farm Rank 3"), then that plot’s rows, each with what it holds
for that task now, or the whole plot; the seed to plant, or any in season; a built station; the Coop or the Barn, built;
the Mine or the Quarry, built; an area or a spot the farm reaches, the rest greyed with why; Cook has nowhere to choose:
the farmhouse kitchen), and **Add · Water · rows 1 and 2**. **A field task names its plot** and works that plot's tiles only: once the farm has two plots, the board says
which ("Water · plot 2, rows 1 and 2", "Water · all of plot 1"). The field's screen shows the same on each row's tab
([the field's screen](#the-fields-screen)). Setting tasks is free and takes effect
tonight; they repeat each day until you change them. With no farmhands: "No farmhands yet. Once she's a friend
(Friendship 3), invite her to work: her menu in town."

<!-- live:work-board -->
| Task | Over | An action | It stops | Aptitude | Reads |
|---|---|---|---|---|---|
| Harvest | A plot’s tiles you choose (the board offers each plot’s rows) | A ripe tile, its crops by her stars; 2 tiles an action from Harvesting 5 | When none of its tiles needs it | Harvesting | Farming |
| Water | A plot’s tiles you choose (the board offers each plot’s rows) | A dry growing tile; 2 tiles an action from Watering 3; every dry tile of hers in one row from Watering 6 | When none of its tiles needs it | Watering | Farming |
| Plant | A plot’s tiles you choose (the board offers each plot’s rows) | An empty tilled tile, the seed named or any held for the season, own seeds first, that ripens in time; 2 tiles an action from Planting 4 | When none of its tiles needs it | Planting | Farming |
| Clear and till | A plot’s tiles you choose (the board offers each plot’s rows) | A step on a tile: clears an overgrown one, tills a cleared one; both in one from Clearing 4 | When none of its tiles needs it | Clearing | Farming |
| Save seed | One crop and grade in the Warehouse | Up to four units of produce of one grade become saved seed | At the seed target, knowledge threshold, or reserve floor | Planting | Farming |
| Load | A built station | A load toward its exact stock targets, or the eligible input most held, up to 8 (12 with her aptitude). Protects reserves and shares the station’s slots | Once the station holds today’s loads, one a level | Milling, Sawing, Smoking, Smelting or Cutting, by station | Farming, foraging, fishing or mining |
| Forage | An area the farm reaches | A haul of 2 finds (3 from Foraging 5) | Never: her gathering shares what’s left, a turn each | Foraging | Foraging |
| Chop | An area the farm reaches | 2 logs (3 from Chopping 5) | Never: her gathering shares what’s left, a turn each | Chopping | Foraging |
| Fish | A spot the farm reaches | A cast: one fish (two casts from Fishing 6), with grade promotion in the selected mode when qualified | Never: her gathering shares what’s left, a turn each | Fishing | Fishing |
| Care for animals | The Coop’s or the Barn’s animals | A hungry animal fed from the silo (two from Animal care 3), else grass cut on a weeds tile for it; then the building’s goods collected, +0.1 quality a level above 1; then an animal cared for (two from Animal care 5), +1 fondness a level above 1 | When every animal there is fed, collected and cared for | Animal care | Ranch |
| Work a face | The Mine’s or the Quarry’s deepest floor | A face on the deepest floor: 2 finds by her yield (3 from Mining 5), a face more toward its stairs; the farmer takes them | Never: her digging shares what’s left, a turn each | Mining | Mining |
| Cook | The farmhouse kitchen (the Kitchen’s, once it stands) | A batch from 2 goods of food by the plain rule: 6 meals at Cooking 1, up to 12 at Cooking 10, into the pantry | Once the pantry holds tonight’s meals for everyone, or the food runs out | Cooking | Cooking |
| Ship surplus | Exact goods on the surplus plan | Move one shared crate of up to 50 goods into the bin for the following day | After one crate, or when no stock is above reserve | — | — |
<!-- /live -->

- **Her shift, in order:** the field, loads, animal care and cooking usually follow her list. On the same tiles the
  order is harvest, clear and till, plant, then water. Existing boards with a watering order before and after crop
  work keep their explicit water-first routine. An Uma with actions left can finish work opened by another worker later in the
  shift before using those actions on gathering. With nothing ready she idles.
- **Shared orders** read the current farm after every action. The next worker can pick up where the first stopped.
  A watered tile, collected animal product or occupied station slot is already done. Gathering shares daily full
  hauls across workers and the farmer. When those are used, further work on that spot yields thin hauls.
- **Cook:** a batch an action from two goods of food, until the pantry holds tonight's meals; then her other tasks
  ([food](#food)). The morning says "cooked 10 meals". The farm eats right after the farmhands work, so her meals feed
  everyone tonight.
- **Her reach is the farm's:** the areas and spots the Farm Rank opens for the farmer (the sea's once their place
  stands), whatever her rank; at a dig, the deepest floor the farm has reached (her faces find its stairs; the farmer
  takes them).
- **The animals' care:** in one task she feeds the building's hungry animals from the silo (cutting grass on a weeds
  tile when it's empty), collects its goods at her aptitude's quality, then cares for each, +8 fondness and +1 a level of
  Animal care above 1; a night of it counts toward her Ranch challenge, and an animal's hearts after her care toward its
  hearts challenges. The morning says "tended animals 4 times · +2 goods".
- **A face:** her finds are the face's two × her mining rank's yield × her talent's × the Pick's or Hammer's ×
  her aptitude's, the fraction drawn (halved past the dig's four faces a day), at her stars (her rank, talent, the tool,
  well fed, her keepsake, her aptitude);
  each face counts toward her Mining challenges by its finds and its floor. The morning says "worked 3 faces · +7
  goods".
- **Her work's terms:** a harvest draws its stars from the crop's level and the Hoe, her farming rank and talent, her
  care (+0.25), well fed (+0.25), her keepsake at her line's place and her aptitude; a haul's from her rank, talent, the
  tool, well fed, her keepsake and her aptitude. A haul's count is the task's × her rank's yield × her talent's × the
  tool's × her aptitude's, the fraction drawn, then halved at a place past its four a day ([thin](#thin-four-full-hauls-a-place-a-day)). Her seeds back are her rank's
  ([what a rank gives](#what-a-rank-gives)). A load comes out at the input's stars, × her aptitude's yield.
- **What it counts:** each action is a point of practice in its aptitude. Her harvests, hauls and catches count toward
  her challenges ([the challenges](#the-challenges)), and the farm's lifetime counts, records and the Diary's depth
  milestones count her work as the farmer's. Her place today (where she spent the most actions, the first on a tie) pays
  her a day's rank points ([rank points](#rank-points)), bonds with the farmhands who worked it too, her line's +10 and a
  mentor's ×1.10; her goods are side by side's and the perks' to copy, and a ★3+ good earns her praise.
- **Every draw is seeded** by the account, the day and the farm's counts, so a night replays the same on every device.

#### Aptitude

An aptitude is a level from 1 to 10 for each task, for each Uma, read from three parts and never stored as a level:
- **her head start,** by her talent in the task's activity (her stats: [talents](#talents));
- **her rank points** in that activity: a point for every 20 ([rank points](#rank-points));
- **her practice:** a point for each action she spends on the task (`roster[id].practice`).

The points each level starts at, and what it gives (quality on her goods' stars, yield on their count):

<!-- live:aptitude-levels -->
| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 10 | 30 | 60 | 100 | 150 | 210 | 280 | 360 | 450 |
| Quality | +0 | +0.1 | +0.2 | +0.3 | +0.4 | +0.5 | +0.6 | +0.7 | +0.8 | +0.9 |
| Yield | ×1.00 | ×1.05 | ×1.10 | ×1.15 | ×1.20 | ×1.25 | ×1.30 | ×1.35 | ×1.40 | ×1.45 |
<!-- /live -->

Her head start by her talent:

<!-- live:aptitude-start -->
| Talent | G | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| Head start | 0 | 0 | 5 | 10 | 20 | 30 | 45 | 60 |
| Level | 1 | 1 | 1 | 2 | 2 | 3 | 3 | 4 |
<!-- /live -->

The tricks, and the level each opens at:

<!-- live:tricks -->
| Aptitude | From level | The trick |
|---|---|---|
| Harvesting | 5 | Two tiles an action |
| Watering | 3 | Two tiles an action |
| Watering | 6 | A row an action: every dry tile of hers in one row |
| Planting | 4 | Two tiles an action |
| Clearing | 4 | An overgrown tile cleared and tilled in one action |
| Foraging | 5 | A haul of 3 finds |
| Chopping | 5 | 3 logs a chop |
| Fishing | 6 | Two casts an action |
| Milling | 5 | A load of up to 12 |
| Sawing | 5 | A load of up to 12 |
| Smoking | 5 | A load of up to 12 |
| Smelting | 5 | A load of up to 12 |
| Cutting | 5 | A load of up to 12 |
| Animal care | 3 | Two animals fed an action |
| Animal care | 5 | Two animals cared for an action |
| Mining | 5 | 3 finds a face |
<!-- /live -->

- **A row an action** is the design's "Water a row": at Watering 6 one action waters every dry tile of hers in the first
  row that has one.
- **Rising over days:** three actions a day on one task take a D talent's Watering from 2 to 3 in about a week, and to 6
  (the row) in about a year (the simulated year's field hand reaches it in Winter); the morning says each level reached ("*Name* · Watering 3 · Two tiles an
  action", tagged **Aptitude**).
- **Her profile's Work side** lists her fifteen aptitudes with their level, a bar to the next and the trick it opened (or the
  next to come); before she's a farmhand it says "Aptitudes · where she'd start".

#### The save

Each farmhand's board is `roster[id].tasks` (in your order, at most six: the field's over a plot's tiles, 0–39, its plot
`plot` (its index) written from plot 2 on, so a task from before plots, with none, is plot 1's; planting one crop or
any; a station's load; an area's forage or chop; a spot's catch; the Coop's or the Barn's care; a dig's face; Cook; a
task on a plot the farm hasn't cleared is refused), and each Uma's practice is
`roster[id].practice` (actions spent, by aptitude). The farmhands well fed this morning are `today.fed`. They grow v5 in
place: a save from before them reads as no tasks, no practice and nobody well fed, and nothing moves `updatedAt` for it.
A farmhand's load may be bigger than the farmer's, so a station's load holds 1 to 20.

### Talents and ranks

Every Uma is a specialist. Her **talent** in each activity, G to S, is read from her own stats by one rule, the same for
everyone; it's why one Uma suits the Fields and another the Pond. Her **rank** in each activity, Novice to Legend, is
earned by working and meeting a challenge; ranks are how the farm goes deeper and better.

**The farmhands work.** An Uma earns rank points and counts toward her challenges by working the farm as a farmhand
([farmhands](#farmhands)): one day's points a night in her place's activity, and her harvests, hauls and catches toward
her challenges. One who doesn't work stays where she is. The farmer's own work counts toward no Uma's ranks, and his
reach (and a farmhand's) is the Farm Rank's. Her talent also sets where each of her aptitudes starts, and her rank
points add to them.

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
- **Tended growth** was a block's growth a night under her care (B and up only); the field's tiles grow a stage a
  watered night, so nothing reads it now.
- Expedition power adds to her party's power. A farmhand's care reads her Animal care aptitude (which her talent starts).

#### Rank points

Six ranks in each of the nine activities: **Novice, Hand, Skilled, Expert, Master, Legend**. A day of work pays rank
points in its activity:

> **10 points × her talent's rank-point factor × 1.2 in her favourite line × 1.25 well fed × the hearts' factor**

Points are kept to a millionth and shown whole. Expedition returns pay 10 points per day away, plus 10 on a Success or
20 on a Great, without the daily work multipliers. The ranch, workshops, and expeditions are nobody's favourite.

- **Well fed:** an Uma with a meal's days left: a wedding's reception or a spouse's breakfast feeds the spouses who live
  on the farm, a ★2+ meal from the pantry whoever eats it. The days
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

A farmhand's day pays one activity: her place today's, where she spent the most actions (the first she worked on a
tie):

<!-- live:place-activity -->
| Where she worked | Pays rank points in |
|---|---|
| The Fields: harvesting, watering, planting, clearing and tilling | Farming |
| Forest | Foraging |
| Sawmill | Foraging |
| Fishery | Fishing |
| Smokehouse | Fishing |
| Mill | Farming |
| Mine | Mining |
| Quarry | Mining |
| Smelter | Mining |
| Cutter | Mining |
| Coop | Ranch |
| Barn | Ranch |
| Kitchen | Cooking |
| Restaurant | Serving |
<!-- /live -->

- **One day pays one activity.**
- An Uma living in town earns nothing.
- A farmhand's day at the Mine, the Quarry, the Smelter or the Cutter pays mining, and at the Coop or the Barn the ranch;
  serving and forging wait for their games. Cooking and Expeditions count at their places.

#### The challenges

A rank comes when its points are reached **and** its challenge is met. Each depth challenge is "work the deepest place
your rank allows", so ranking up is how the farm goes deeper. The challenge toward each rank, by activity:

<!-- live:challenges -->
| Activity | Hand | Skilled | Expert | Master | Legend | Counted by |
|---|---|---|---|---|---|---|
| Farming | Harvest 30 crops she tended | 40 crops of ★3+ she tended | Tend a crop of level 4+ to harvest | 30 crops of ★5 | 1st at a Flower Show with a crop she tended | At harvest, for the tender; name her as the grower of a winning boxed harvest |
| Ranch | Care for animals 10 days | An animal in her care reaches 4 hearts | An animal in her care reaches 7 hearts | An animal in her care reaches 10 hearts | 1st at an Animal Show with an animal in her care | A farmhand’s night at the Coop or the Barn; a farmhand’s care for an animal; name her as the caretaker of a winning animal |
| Mining | Dig 40 ores or stones | Dig at floor 10 | Dig at floor 15 | Dig at floor 20 | Dig at floor 25 | A farmhand’s faces at the Mine or the Quarry |
| Fishing | Catch 30 fish | Catch 10 fish at the River | Catch 10 fish at the Lake | Catch 10 fish at the Falls | 1st at a Fishing Derby, on the team | The night’s catches (night step 4); have her land an official catch for the winning team |
| Foraging | Gather 50 items | Gather 20 items in the Hills | Gather 20 items in the Old Forest | Gather 20 items on the Mountain | Gather 20 items in the Misty Vale | The night’s hauls (night step 4) |
| Cooking | Assist 5 Kitchen plays | Assist a Fine play | Make 10 dishes of ★4+ | Assist a Masterwork | 1st at a Cooking Contest as the cook | The Kitchen’s play, its assistant; the Cooking Contest’s judging, its cook |
| Serving | Assist 5 shifts | Assist a Fine shift | Serve 100 guests | Assist a Masterwork shift | Serve 1,000 guests | The Restaurant’s shift, its server |
| Forging | Prepare 5 pieces | Prepare 4 Iron or better pieces | Prepare 4 Gold or better pieces | Prepare 4 Mythril pieces | Prepare 6 Mythril pieces | The Forge |
| Expeditions | Return from 2 expeditions | A Success at level 10+ | A Success at level 20+ | A Great at level 20+ | A Success at the Sky Ruins | The Expedition post |
<!-- /live -->

- **One challenge at a time:** her count is toward her next rank's challenge only, from her joining or her last rank-up
  in that activity. It stops at the target and resets to 0 at the rank-up.
- **What counts it:** her own work, once the farmhands work. The farmer's harvests, hauls and catches count toward no
  Uma's challenge. Each challenge reads only its own kind of event; an Uma off the roster or at Legend counts nothing.
- **In play:** farming's, foraging's, fishing's, the ranch's, mining's and cooking's challenges are counted: the ranch's
  by a farmhand's night at the Coop or the Barn and the hearts of an animal she cares for, mining's by her faces' finds
  and floors, cooking's by the Kitchen's play she assists ([its play](#its-play)) and its Legend by the Cooking
  Contest: a 1st, judged at the play's end, counts `won` for its cook ([the Cooking Contest](#the-cooking-contest)).
  The others wait for places that aren't open. Farming's, fishing's and the ranch's Legend challenges are wins at
  festivals not played yet (the Flower Show, the Fishing Derby, the Animal Show), so those climbs stop at Master;
  foraging, mining and cooking can reach Legend.

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
- **Tended growth** was a block's growth a night under her care; nothing reads it now.
- **Quality** adds to the star draw of what she grows or makes.
- **Deepest** is the last area, spot and floor her rank lets her work.
- **Seeds back** is her harvest's chance of a seed, before the Hoe.
- Expedition power is her base power on a party. Workshop yield affects the Kitchen's output. A farmhand's animal care
  reads her Animal care aptitude.

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
 the morning: "Built overnight · the Mill", "Farm Rank 2 · The Coop to build (2,000g · 30 logs · 20 vegetables), …", "First Uma at Hand · +300g"

 your life with the Umas: the n-th wedding ──► House n · 3 married ──► the homestead's second row · 5 met ──► the board
```

#### The Farm Rank

The farm's own rank, 1 to 10. Its points are recomputed from the save each night at step 8, from income, resources and
the festivals' places:

> **⌊gold shipped ÷ 100⌋ + 5 × Diary entries + 25 × milestones + each festival result's points (150 · 75 · 25)**

Every term only grows, so the rank never falls. During the day the rank stays as last night left it: what you ship
today counts tonight, and so does a place at the Cooking Contest (its gold is paid at once). Where the points come
from:

<!-- live:farm-rank-points -->
| Source | Points | Read from |
|---|---|---|
| Gold shipped at the bin | 1 per 100g | `farm.counts['gold-shipped']` |
| A Diary entry: a good shipped once | 5 | `diary.shipped` |
| A milestone | 25 | `diary.milestones` |
| A festival’s place: 1st, 2nd, 3rd | 150, 75, 25 | `farm.festivals` |
<!-- /live -->

A festival's points are each result in `farm.festivals` (only the Cooking Contest's are played yet); decorations add
nothing in play, since none exist. The points each rank needs, tuned when Umas worked the
farm so the ranks came at the pace they came at when each global chapter added 250 points (the farmer's pace alone is
[the simulated first season](#the-pacing)'s, and two farmhands reach Farm Rank 3 by Summer's end: see the pacing):

<!-- live:farm-ranks -->
| Farm Rank | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Points | 0 | 150 | 250 | 950 | 2,150 | 3,750 | 6,250 | 9,750 | 14,750 | 21,750 |
<!-- /live -->

What each rank opens is read from the rules that gate on it (the places it offers to build, the Fields' blocks, the
stations' levels, the shop's seed tiers), so the sheet and the morning can't drift from the game:

<!-- live:farm-rank-opens -->
| Farm Rank | Points | Opens |
|---|---|---|
| 1 | 0 | Block A and tier-1 seeds (the start), The Mill to build (1,000g · 20 logs) |
| 2 | 150 | The Coop to build (2,000g · 30 logs · 20 vegetables), The Hills, The River, The Sea Pier (with the Dock), Chickens at the rancher’s, New seeds at the shop |
| 3 | 250 | The Sawmill to build (1,500g · 40 logs), The Barn to build (3,500g · 30 logs · 20 vegetables), The Smokehouse to build (2,000g · 30 logs · 20 fish), The Kitchen to build (3,000g · 40 logs · 20 vegetables), The Forge to build (1,000g · 12 logs), Plot 2 to clear (2,500g), Station level 2 (2 loads a day), Ducks, Cows and Sheep at the rancher’s, New seeds at the shop |
| 4 | 950 | The Mine to build (10,000g · 60 planks), The Smelter to build (8,000g · 40 planks · 40 logs), Plot 3 to clear (5,000g), Station level 3 (3 loads a day), Kitchen level 2 (8 dishes a play), The Old Forest, The Lake, Goats at the rancher’s, The Mine’s and the Quarry’s floors to 15, New seeds at the shop |
| 5 | 2,150 | The Quarry to build (12,000g · 50 planks), The Cutter to build (10,000g · 40 planks · 40 logs), Plot 4 to clear (10,000g), Station level 4 (4 loads a day), Kitchen level 3 (10 dishes a play), Alpacas at the rancher’s |
| 6 | 3,750 | The Dock to build (20,000g · 80 planks), The Boat to build (30,000g · 60 planks · 30 fillets), Plot 5 to clear (15,000g), Station level 5 (5 loads a day), Kitchen level 4 (12 dishes a play), The Mountain, The Falls, Cashmere Goats at the rancher’s, The Mine’s and the Quarry’s floors to 20, New seeds at the shop |
| 7 | 6,250 | The Restaurant to build (40,000g · 80 planks · 40 fillets · 30 vegetables), The Expedition post to build (25,000g · 60 planks · 40 fillets), Plot 6 to clear (25,000g), Kitchen level 5 (15 dishes a play) |
| 8 | 9,750 | Plot 7 to clear (35,000g), The Misty Vale, The Deep Sea (with the Boat), The Mine’s and the Quarry’s floors to 25 |
| 9 | 14,750 | Plot 8 to clear (50,000g) |
| 10 | 21,750 | The World Tree, The Moon Pool, The Mine’s and the Quarry’s floors to 30, The farm’s gold crest |
<!-- /live -->

- **A rank-up is news:** the morning's New today says "Farm Rank 2 · The Coop to build (2,000g · 30 logs · 20
  vegetables), The Hills, The River, The Sea Pier (with the Dock), Chickens at the rancher’s, New seeds
  at the shop", tagged Farm Rank, opening the rank's sheet. Two ranks in one night are
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
| Fibers | `row:fibers` | Flax, Jute, Hemp, Cotton, Wool, Alpaca Fleece, Cashmere Fleece, Silk Cocoon, Moonsilk Cocoon, Cloudfleece | 500g |
| Hides and scales | `row:hides-scales` | Puffbun Pelt, Boarling Hide, Wolfkin Pelt, Rock Lizard Scale, Ironback Hide, Basilisk Scale, Manticore Hide, Behemoth Hide, Wyvern Scale, Dragon Scale | 500g |
| Bones and horns | `row:bones-horns` | Seashell, Ammonite, Trilobite, Fossil Bone, Mammoth Tusk, Saber Fang, Raptor Claw, Tyrant Tooth, Titan Bone, Unicorn Horn | 500g |
| Essences | `row:essences` | Mist Essence, Dew Essence, Breeze Essence, Ember Essence, Tide Essence, Spark Essence, Glimmer Essence, Shadow Essence, Aether, Prismatic Essence | 500g |
| Eggs and milk | `row:eggs-milk` | Egg, Milk, Duck Egg, Goat Milk | 500g |
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
| Fibers, refined | `row:fibers:refined` | Linen, Burlap, Hemp Cloth, Cotton Cloth, Wool Cloth, Alpaca Cloth, Cashmere Cloth, Silk, Moonsilk, Cloudweave | 500g |
| Rings | `row:rings` | Ring G1, Ring G2, Ring G3, Ring G4, Ring G5, Ring G6, Ring G7, Ring G8, Ring G9, Ring G10 | 500g |
<!-- /live -->

#### Building

Every place past the start is offered at its Farm Rank and built with gold and the farm's own goods:

1. **Offered:** the Farm Rank reaches its rank (the Boat once the Dock stands too).
2. **Paid:** its Build card (the place's quick look, or a station's page), or the mayor's office in town, with your gold
   or a loan for what's short ([loans](#loans)), takes its gold and goods now. Each goods line
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
| Coop | 2 | 2,000g | 30 logs, 20 vegetables | Yes |
| Sawmill | 3 | 1,500g | 40 logs | Yes |
| Barn | 3 | 3,500g | 30 logs, 20 vegetables | Yes |
| Smokehouse | 3 | 2,000g | 30 logs, 20 fish | Yes |
| Kitchen | 3 | 3,000g | 40 logs, 20 vegetables | Yes |
| Forge | 3 | 1,000g | 12 logs | Yes |
| Mine | 4 | 10,000g | 60 planks | Yes |
| Smelter | 4 | 8,000g | 40 planks, 40 logs | Yes |
| Quarry | 5 | 12,000g | 50 planks | Yes |
| Cutter | 5 | 10,000g | 40 planks, 40 logs | Yes |
| Dock | 6 | 20,000g | 80 planks | Yes |
| Boat | 6 | 30,000g | 60 planks, 30 fillets | Yes, after the Dock |
| Restaurant | 7 | 40,000g | 80 planks, 40 fillets, 30 vegetables | Yes |
| Expedition post | 7 | 25,000g | 60 planks, 40 fillets | Yes |
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
| The first Romance 8 anyone plays | The ring bench at the Forge (the night after) | `memories`, then `forge.bench` |
| The first wedding | House 1 to build (8,000g), the house before it standing | Spouses in `love` |
| The second wedding | House 2 to build (20,000g), the house before it standing | Spouses in `love` |
| The third wedding | House 3 to build (40,000g), the house before it standing | Spouses in `love` |
| The fourth wedding | House 4 to build (70,000g), the house before it standing | Spouses in `love` |
| The fifth wedding | House 5 to build (110,000g), the house before it standing | Spouses in `love` |
| The sixth wedding | House 6 to build (160,000g), the house before it standing | Spouses in `love` |
| 3 married | The homestead's second row on the map | Spouses in `love` |
| 6 married | The homestead's third row on the map | Spouses in `love` |
| 5 Umas met | The shared Town Requests board | Umas on the roster |
<!-- /live -->

- **"Met"** is everyone on the roster today, on the farm or in town (see [meeting her](#meeting-her)).
- **The ring bench** is the romance's: see [the ring bench](#the-ring-bench).
- **The houses and the rows** are the homestead's: see [the homestead](#the-homestead).

#### What Next?

Open **What Next?** beside Work or in the menu. **Focus now** shows one action for today. Expand Crew and fields for the shift’s shortfalls, starter goals, restocking and the Work Calendar. Money and credit estimates tonight’s cash after food, upkeep and loan repayments. The remaining sections link to buildings, housing, ranching, recipes, the Tool Rack, relationships, jewelry, and town services.

**Project lumber** shows how many logs the Sawmill still needs, then how many planks the next project needs, with separate counts for stock and overnight loads. The card links directly to the Woods, Sawmill and project.

Track a build, tool, heirloom or Restaurant recipe at its screen to keep supplies in stock. What Next? shows what is still missing and where it comes from. Choose **Assign crew to this goal** to let available auto-workers gather materials or fill an additional station target. The crew keeps its existing orders and daily work priorities. Gold goals use standard surplus shipping. Some ingredients still need you to choose a crop, buy an animal, use a catch mode, or cook a dish. The weekly crew forecast uses today's crops and stock.

**Ranch & homes** shows the Coop and Barn’s costs, the rancher’s purchase prices, feed stock, room capacity,
and the next house and extension. The Coop and its first Chicken open at Rank 2. The Barn opens at Rank 3. House 1
opens at the first wedding for 8,000g. Houses and extensions cost gold, and the Farmhouse has two rooms from day one.

**Farm path** shows all ten ranks, projects, field plots, station and Kitchen upgrades, livestock and seed unlocks.
The Boat needs the Dock. Planks come from the Sawmill and fillets from the Smokehouse. Projects and station upgrades
finish overnight. The homestead and bench follow relationship milestones.

#### The farm's projects

The Diary's **Projects** card gathers what's next:
- **Loans,** first while there are any, each a goal: what it built, "440g owed · 45g a night · clears in about 10 nights
  (Spring 14)"; a tap opens the Book (see [loans](#loans)).
- **Build now:** every place offered at your rank and not standing, whose game is built: its name, its cost ("1,000g · 20
  logs"), and what it still lacks ("Need 400g and 12 logs more"), "Builds tonight" once paid, or **Build ›**. A tap
  opens its quick look and Build card. With none: "Nothing to build at this rank." When a place lacks only gold,
  "Short of gold? The mayor's office lends toward a build. ›" opens the office in town.
- **Not built yet:** the places offered at your rank whose games aren't built, in one line ("Not built yet: the
  Kitchen").
- **At Farm Rank 3 · 250 points:** what the next rank offers, each with its cost or "Not built yet".
- **With the Umas:** each milestone, a check when it's done, what it waits for and how far along you are: "The ring
  bench · The first Romance 8 · Not yet", "House 1 · Your first wedding · 0 / 1 married", "The homestead's second row ·
  3 married · 1 / 3 married", "The Requests board · 5 Umas met · 3 / 5 met". The house shown is the next to open.

#### Progression balance through Farm Rank 10

The Phase 3.5 simulation starts with the normal 500g, nine carrot seeds and no farmhands. All four runs play
the first 12 days solo. Three runs then add invented farmhands in pairs at controlled staffing checkpoints
to compare production independently of romance pacing. The solo reference continues by hand. Work follows
the live weekly shifts. Gold, supplies, builds, grades and rank points come from ordinary actions and nightly
settlement. Each run continues exactly 120 days after reaching Rank 10.

The tuned trial puts watering, feed and meals ahead of expanding fields, works two rows per staffed plot,
adds fallback gathering orders and limits expeditions to one party with enough shifts left on the farm.
The farmer checks which planted tiles will still need watering after the crew works. The trial usually holds
six of each tracked exact grade and orders eight Wheat Flour at the Mill. On staffed farms, it targets a reserve
of 24 each for Carrot and improved Carrot on Spring 1.
The nine goods tracked are Carrot, Wheat, Egg, Milk, Carp, Basil, Wheat Flour, improved Carp and improved Carrot.

| Metric | Solo | 10 Umas | 20 Umas | 50 Umas |
|---|---:|---:|---:|---:|
| Turn Farm Rank 10 opens | 1,389 | 576 | 405 | 288 |
| Turn the trial ends | 1,509 | 696 | 525 | 408 |
| Farm shifts per day in the final year | 0 | 4.3 | 8.6 | 21.4 |
| Farmer actions free per day in the final year | 0 | 3.2 | 3.8 | 3.8 |
| Meals bought as takeout in the final year | 0 / 240 | 0 / 1,438 | 0 / 2,570 | 0 / 5,654 |
| Upkeep in the final year | 3,600g | 23,400g | 23,400g | 23,400g |
| Short nights across the run | 0 | 0 | 0 | 0 |
| Missed individual animal feeds in the final year | 0 | 0 | 0 | 0 |
| Growing tiles missed by watering in the final year | 0% | 5.3% | 3.0% | 1.8% |
| Exact-grade ingredient-days with at least two held, out of 1,080 | 480 | 916 | 860 | 1,015 |

An ingredient-day counts one exact grade on one morning. These are snapshots of the stock available for
recipes. The separate Restaurant playthrough covers all 120 unlocks and actual dish use. The new benchmark
covers farmhands living in town. The loan and household tests cover arrears and resident upkeep separately.

In the earlier 48-day trials, which filled available plots and sent the strongest available expeditions, the
20-Uma farm had about 4.8 farmhands per day and bought 1,292 of 1,562 meals in the year after Rank 10.
The 50-Uma farm bought 1,379 of 2,820 meals. The tuned results combine better work orders and stock policies
with the rule changes above. Seasonal Carrot and Wheat stocks can still be thin on smaller crews. The
solo reference reaches Rank 10 much later and continues to spend its whole day on the farm.

Run `src/farm/scale.test.ts` with `FARM_BALANCE_REPORT=1` and the `Phase 3.5` test filter for the complete totals.

#### The pacing

The older economy examples below were recorded on the original 48-day calendar. The balance table above uses the current calendar.

A test (`packages/domain/src/farm/season.test.ts`) plays the first year on the game's own rules, the farmer working
alone, by a plain bot, ten actions a day. Each morning it harvests what's ripe, waters what grows, plants the tilled soil
it has seeds for, tills and clears a little more while fewer than five tiles grow, ships once there's a crate's worth
(less the logs and fish its next build takes), goes into town for the season's quickest seeds when they run out (keeping
tonight's bill back), and spends what's left fishing, foraging and chopping (chopping first while the next build waits
for logs), each where it isn't thin yet today: the Woods and the Pond first, a deeper area or spot once they're thin and
his reach allows ([thin](#thin-four-full-hauls-a-place-a-day)). It builds as it goes, never into a night it can't pay: **the Mill on a loan** from the mayor's office as soon
as it holds the logs and the gold left covers tonight's bill, then the Farm Rank 3 stations. Nobody lives on the farm
(only a spouse would, in her room). Every night the farm eats, then pays
its bill: the takeout, the upkeep and the loan's share. **The farmer eats takeout** while his gold holds, and cooks a
batch when it won't cover a few nights' takeout. It checks:
- **every day spends exactly its ten actions,** and every morning has ten again;
- **watered crops grow and dry ones don't,** and something is harvested;
- **the season's last night withers what's left** (only Corn and Cabbage carry over);
- **the bin pays:** over 1,000g shipped in Spring, enough cash for the next bill, and Farm Rank points earned;
- **the Mill stands early on a loan,** and Spring runs a surplus over its takeout, upkeep and loan;
- **the bill is always paid:** never a short night, never half pace;
- **every season earns more than its takeout, upkeep and loans take,** and the year ends richer than it started;
- **the loan clears,** and the farmer alone reaches Farm Rank 2;
- **takeout bites from the first night** (the first morning says "Takeout · 30g") and comes to a sixth of what he ships;
  **he cooks to bridge the Mill's tight night,** and the year ends within a tenth of the same farm on takeout alone;
- **cooking every night he can alone:** a third run cooks whenever the pantry won't hold his two meals; he eats every
  meal (nothing spoils), buys under a third of the takeout, never runs short, and ends the year within a fifth of the
  farm on takeout;
- **every morning's save parses** as v5.

With free town visits, the solo farm ships 1,075g in Spring and ends the year with 5,005g. Takeout alone ends
with 5,255g and cooking at every opportunity ends with 4,340g. With two farmhands, cooking cuts takeout from
840g to 480g in Autumn and from 840g to 525g in Winter. Those runs have no short nights. Run the test with
`SEASON=1` to print the current comparisons.

The earlier run, when town visits cost an action, began as follows:

| Spring | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Planted and watered | 0 | 5 | 0 | 0 | 0 | 2 | 2 | 1 | 0 | 0 | 0 | 0 |
| Watered, besides the day's plantings | 0 | 0 | 5 | 5 | 5 | 0 | 2 | 4 | 5 | 3 | 1 | 0 |
| Harvested | 0 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 2 | 2 | 1 |
| Gold, morning | 500 | 470 | 440 | 410 | 380 | 80 | 440 | 425 | 200 | 155 | 110 | 65 |
| His meals | Takeout | Takeout | Takeout | Takeout | A batch | The batch | The batch | Takeout | Takeout | Takeout | Takeout | A batch |
| Built | | | | | The Mill, on a 700g loan | | | | | | | |

The year, season by season (the morning after each season's last night):

| Season | The bin paid | Takeout | Upkeep | The loan's shares | Left | Short nights | Gold after | Upkeep a night, at its end | Farm Rank |
|---|---|---|---|---|---|---|---|---|---|
| Spring | 1,050g | 240g | 105g | 160g | 545g | 0 | 565g | 15g (the Mill) | 1 |
| Summer | 2,165g | 300g | 180g | 400g | 1,285g | 0 | 1,490g | 15g | 1 |
| Autumn | 2,720g | 360g | 180g | 210g | 1,970g | 0 | 2,920g | 15g | 1 |
| Winter | 2,845g | 360g | 180g | — | 2,305g | 0 | 4,685g | 15g | 2 |

- **The loan builds the Mill early:** 20 logs held by Spring 4, but the 10g a loan would leave him that day wouldn't pay
  the night's 30g of takeout, so he waits a day: on Spring 5, 380g of his own and a 700g loan (770g owed, 80g a night),
  and with his gold low he keeps an action for the stove and cooks a batch from the day's hauls: six meals, his next
  three nights'. The Mill stands on Spring 6; the nights' income clears the loan in Autumn. On Spring 12, low again, he
  cooks a second batch.
- **Takeout bites, and never sinks him:** 1,260g of takeout in the year (84 meals) against 8,780g shipped, a seventh,
  with never a short night. On takeout alone (no batch) the year ends on 4,710g; cooking for the tight nights, on 4,685g.
  Cooking every night he can, he buys 360g of takeout (24 meals), eats all 72 meals of his twelve batches, never runs
  short and ends on 4,235g: a batch saves him 90g of takeout for two goods worth 60–70g, and its action is a haul he
  doesn't bring home ([food](#food)).
- **Thin barely touches him:** two places at Farm Rank 1, the Woods and the Pond, give eight full hauls a day between
  them, about what he gathers; the bot spreads his hauls over them, and goes deeper once they're thin and Farm Rank 2
  opens the Hills and the River.
- **Year 2 opens** on 4,685g, 8,780g shipped, 47 tiles harvested and 162 Farm Rank points (Farm Rank 2). The farmer
  alone doesn't reach Farm Rank 3 (250) in a year, so the Sawmill and the Smokehouse wait for the farmhands.
- **Fishing and foraging still carry the farm:** an action at the water or the woods pays about what a Carrot's whole
  run of six actions does.

##### With two farmhands

The same test plays the same year a second time with **two farmhands**, friends from town invited to work on Spring 2.
They live in town and come on their **farm days**, the eight of each season's twelve their default schedule leaves
free (the field hand's town days are 1, 4, 7 and 10, the gatherer's 2, 5, 8 and 11, so one of them is on the farm
every day and both on 3, 6, 9 and 12), and work and eat on the farm those days: their meals are their cost, and they pay
no upkeep. The night reads a pack of the four invented farmhands (`castPack`), for their farm days. One waters the whole
field; the other forages and fishes at the deepest area and spot the farm reaches (the Hills and the River from Farm
Rank 2). Both have a D talent everywhere. Nobody lives on the farm. The farmer keeps a field twice the size (ten tiles
growing), plants and harvests it himself, waters only what she won't reach tonight (as the board's Tonight shows: all
of it on her town days), gathers no more than the four actions a day he did alone (leaving her places to her on her farm
days), and spends the rest of his day with the people in town. **The field hand is the Cook:** her board is the whole
field's watering, then Cook, so once the field's watered her actions left cook a batch each until the pantry holds
tonight's meals; the farmer keeps back from the bin the goods her batches will take. The same farm on takeout alone runs
beside it. It checks:
- **every night's bill is paid,** their meals with it: never a short night, never half pace, on takeout alone too; no
  upkeep for them (only the places built), three mouths on a farm day of both and two on a town day of one;
- **they work on their farm days from Spring 2,** one of them every day, and each morning reports those who worked;
- **every season earns more than its takeout, upkeep and loans take, and more than the farmer alone's;** the year ships
  more and ends richer;
- **his own day is freed:** his watering is under two thirds of what it was alone (her town days are his), more crops
  grow, and over one of his actions a day goes to the people;
- **their aptitudes rise:** the field hand reaches Watering 5 (two tiles an action) by the year's end, and the gatherer
  Foraging 4 and Fishing 4;
- **takeout bites:** on takeout alone it's between a sixth and three tenths of what the farm ships, and never sinks it;
- **cooking pays its way once the field yields:** under two thirds of the takeout
  farm's by Winter, the pantry feeding part of every night from Autumn, the cook at Cooking 2 or more, some well-fed
  nights and nothing spoiled; the year ends richer than on takeout;
- **every morning's save parses** as v5.

| Season | The bin paid | Takeout | Upkeep | Left | Short nights | Gold after | Upkeep a night, at its end | Farm Rank |
|---|---|---|---|---|---|---|---|---|
| Spring | 1,520g | 660g | 105g | 485g | 0 | 605g | 15g (the Mill) | 1 |
| Summer | 4,510g | 780g | 180g | 2,940g | 0 | 3,485g | 15g | 1 |
| Autumn | 5,550g | 585g | 240g | 4,725g | 0 | 8,070g | 30g (the Sawmill) | 3 |
| Winter | 7,990g | 525g | 510g | 6,955g | 0 | 12,485g | 45g (the Smokehouse) | 3 |

The same farm on takeout alone pays 810g, 840g, 840g and 840g of takeout and ends the year on 11,520g. (Left is after
the loans' shares too: 270g in Spring, 610g in Summer.)

- **Farm days halve their year, near enough:** the farmhands spent 227 actions in the year (373 when they came every
  day and paid 10g each a night), and the farm ships 19,570g (34,700g before) and ends on 12,485g (23,410g), still over
  twice the farmer alone's 8,780g shipped. The farmer watered 92 tiles (18 before; 156 alone): on her town days the
  field is his, and he spent 66 actions with the people (105 before).
- **The farm grows a season slower:** Farm Rank 3 by Autumn (Summer before), the Mill on Spring 5 on a loan, the Sawmill
  on Autumn 8 and the Smokehouse on Winter 2, all on his own gold after the Mill, and 445 Farm Rank points by Year 2 (637
  before).
- **Their meals are their cost:** 2,550g of takeout in the year against 3,330g on takeout alone, and no upkeep for them
  (their 20g a night is gone). Two of them on a farm day eat four meals; a town day's farmhand eats in town.
- **The cook pays once the field yields:** in Spring and Summer the field takes most of the field hand's actions on her
  farm days, so the farm buys most of its food; from Autumn her actions left cook, seven meals a batch, and the pantry
  feeds part of every night (52 meals in the year), her ★2 batches leaving a farmhand well fed now and then. She reaches
  Cooking 2, Watering 5; the year ends richer than on takeout (12,485g against 11,520g).
- **Where it comes from:** the gatherer works the Hills and the River once Farm Rank 2 opens them, where a haul is worth
  two or three of the Woods', and her foraging rank reaches Skilled (×1.3 yield, +1 quality) on her challenges.

##### The whole farm: the Coop and the Mine

The same test plays a third run, **three years** of the farm with its two farmhands (the field hand on Cook) that also
builds the ranch, the Kitchen and the Mine: the Coop as soon as the Farm Rank offers it and its logs and vegetables are
held (from Summer, growing vegetables for it), four chickens there with fodder bought in town when the silo runs low
(keeping 600g back), and a third friend invited to care for them the day it stands (feed, collect, care); the Kitchen
once the Farm Rank 3 stations stand, played every day he can as the casual bot and its staff meal served when the dishes
are there, a recipe bought in town on a day it couldn't cook (one a season at most) for what the farm ships most of; then,
once Farm Rank 4 comes, the Mine (its 60 planks sawn from his logs at the Sawmill, a load a day), a fourth friend at its
face, and the stairs taken whenever she finds them. Each farmhand comes on her farm days. (Two years were enough before
farm days; with them, Farm Rank 4 and the Mine come in the third.) The Coop and the Mine add their 15g a night each and
their farmhands' meals on their farm days; the chickens cost their 500g and their feed; the cook feeds them all. It
checks:
- **three years without a short night,** never half pace;
- **every season earns more than its takeout, upkeep and loans take,** and the three years end richer than one year with
  two farmhands;
- **the Coop stands in the first year, the Kitchen in the second and the Mine in the third** (Farm Rank 4), all counted
  in the upkeep, and nobody a resident;
- **the eggs pay more than the Coop's nights cost** (its upkeep, its farmhand's meals on her farm days at takeout's
  price, the hens and their feed), **and the ores more than the Mine's**;
- **each morning after a farm day of both reports the farmhands at the Coop and the Mine** and the Coop's night, nobody
  hungry, and the Mine's deepest floor reaches floor 10 or deeper;
- **every morning's save parses** as v5.

| Season | The bin paid | Takeout | Upkeep | Left | Short nights | Gold after | Upkeep a night, at its end | Farm Rank |
|---|---|---|---|---|---|---|---|---|
| Spring 1 | 2,870g | 660g | 105g | 1,565g | 0 | 1,685g | 15g | 1 |
| Summer 1 | 2,490g | 780g | 180g | 1,190g | 0 | 2,635g | 15g | 1 |
| Autumn 1 | 5,180g | 585g | 180g | 4,415g | 0 | 8,410g | 15g | 3 |
| Winter 1 | 4,185g | 705g | 540g | 2,940g | 0 | 2,910g | 60g (the Coop, the Sawmill, the Smokehouse) | 3 |
| Spring 2 | 6,715g | 660g | 720g | 5,335g | 0 | 7,665g | 60g | 3 |
| Summer 2 | 9,985g | 240g | 780g | 8,965g | 0 | 12,190g | 75g (the Kitchen) | 3 |
| Autumn 2 | 13,720g | 120g | 900g | 12,700g | 0 | 23,450g | 75g | 3 |
| Winter 2 | 12,490g | 75g | 900g | 11,515g | 0 | 35,575g | 75g | 3 |
| Spring 3 | 17,695g | 60g | 1,020g | 16,615g | 0 | 42,180g | 90g (the Mine) | 4 |
| Summer 3 | 29,885g | 15g | 1,080g | 28,790g | 0 | 71,110g | 90g | 4 |
| Autumn 3 | 34,885g | — | 1,080g | 33,805g | 0 | 103,225g | 90g | 4 |
| Winter 3 | 40,100g | 60g | 1,080g | 38,960g | 0 | 139,445g | 90g | 5 |

- **The Coop pays its way twice over:** it is built on Winter 1 of the first year (Autumn 1 before farm days), and over
  its 107 nights its eggs sell for 21,210g against 8,935g of upkeep, its farmhand's meals, the four hens and their
  fodder. Its farmhand reaches Animal care 8 and the ranch's Expert rank.
- **The Kitchen** stands on Summer 8 of the second year, played on the days the Warehouse holds a base, its staff meal
  served 8 nights a season or so from the second year's Autumn; it buys 7 recipes over the three years.
- **The Mine pays at once:** it is built on Spring 4 of the third year, once Farm Rank 4 comes (the second year's Summer
  before farm days); its farmhand's faces and the farmer's free stairs reach floor 15 (the Farm Rank's reach), and over
  its 44 nights its ores sell for 37,625g against 1,560g of its nights' costs.
- **The cook feeds the farm:** from the second year's Autumn the pantry covers nearly every meal (75g of takeout in the
  third year's last three seasons), the cook reaches Cooking 3, and her ★2 batches and the staff meal keep the
  farmhands well fed most nights.
- **The farm in all:** the three years ship 180,200g and end on 139,445g, Farm Rank 5 (2,292 points); every build is
  paid from its own gold, the Mill's loan aside. Two years shipped 199,380g and ended on 159,140g with every farmhand
  there every day: farm days cost the whole farm about a year.

##### The farm at scale: 10, 20 and 50 Umas

The owner asked: "when we have 10 Umas, then 20 Umas, then 50 Umas, do all those stages support all Umas fully
working?" A test (`packages/domain/src/farm/scale.test.ts`) answers it on the game's own rules: three farms play four
years, each bringing in its Umas as farmhands (friends from town, a D talent everywhere) until it works with **10**, **20**
or **50**: two in its first Spring, then ten by year 2's Spring, twenty by year 3's and fifty by year 4's Summer. Each
comes on her **farm days**, the eight of each season's twelve her default schedule leaves free, so about two thirds of
them are on the farm a day (the night reads a pack of the fifty, `castPack`). `SCALE=1` prints the tables below.

- **The farmer** is a plain bot. Each morning he builds what the Farm Rank offers (the stations, the Coop and the Barn,
  the Kitchen, the Mine and the Quarry, the Dock and the Boat), clears **a plot for every five Umas** as the Farm Rank
  opens them, buys each station's next level (and the Kitchen's while the staff meal takes more dishes than a play
  makes), keeps the Coop and the Barn full and the silo fed, buys each plot's seeds in town (a different crop a plot),
  **plays the Kitchen** once it stands (every day he can, as the casual bot: the menu its known recipes can make) and
  **serves the staff meal** when the dishes are there, chops logs for the next build while it's short of them (up to
  four a day), tends the field by hand with what his day leaves, ships a crate of everything the farm can spare (keeping
  the next builds' goods, tonight's loads, the cook's batches and tomorrow's menu back), buys a recipe in town for what the
  farm ships most of, and spends the rest of his day with the people. Every purchase keeps six nights' bill in hand
  (counting every farmhand's meals, a farm day or not).
- **The plain rule** sets the boards of the farmhands **on the farm today** every morning, in the order they came: **the
  field's plots** (harvest, plant, water), **the animals**, **the stations' loads**, **the kitchen** (Cook), then
  **gathering and mining**: an area's, a spot's or a dig's four full hauls a day each, the deepest first, one place each;
  then the field's **new ground** (a row of each plot a day, cleared and tilled). While the next build is short of logs,
  the nearest area's full hauls are chops, and the Sawmill's logs wait for it. Each farmhand takes what her actions fill
  of the first jobs with work left, by her aptitudes (a station's loads as its goods allow; an area's full hauls less
  what the farmer took), and the next takes what's left. Past every job, she gathers where it's thin.
- **How it counts an Uma's night:** her **real work** is the field, the animals, a load, the kitchen, a full haul and a
  full face; **thin** is a haul or a face past its place's four (half a haul: idle-ish); **idle** is an action with
  nothing to do. She's **in a real job** when real work is at least half her actions; else she's **idle-ish**, each of
  the Umas on the farm that day. **Real work on offer** is what the jobs needed that day at the farm's levels, taken and
  still waiting (some waits on days the plain rule can't fit it: one place to gather or dig an Uma). Phase 2's employers
  (the expedition post, the Restaurant and the Forge) are outside this baseline. The expedition comparison runs separately.

It checks: never a short night at any stage; 10 Umas by year 2, 20 by year 3, 50 by year 4; **10 and 20 in real jobs on
their farm days** in year 4, two thirds of them on the farm a day (7 and 13), with real work still waiting and under a
tenth of their actions thin or idle; **50 two thirds a day too** (over 30 on the farm, fewer than 50), nearly all in real
jobs, real work still waiting, under a tenth thin or idle; two plots at 10, four at 20 and six at 50, the five stations
at level 5; **the Kitchen built at every stage, played over a quarter of year 4's days and its staff meal served over half
of them**, Good on average; and every season's save parses as v5.

Each stage in its last year (year 4), a day's actions on average:

|  | 10 Umas | 20 Umas | 50 Umas |
|---|---|---|---|
| Umas working the farm, at the year’s end | 10 | 20 | 50 |
| On the farm a day (their farm days) | 7 | 13 | 32 |
| Their actions a day | 31 | 61 | 140 |
| Real work on offer a day (taken, and waiting) | 100 (30, 70) | 170 (60, 110) | 232 (138, 94) |
| The field: tending and new ground | 14 | 42 | 95 |
| The animals | 13 | 11 | 16 |
| The stations’ loads | 2 | 4 | 9 |
| The kitchen | 0 | 1 | 2 |
| Full hauls (an area’s or a spot’s first four) | 1 | 2 | 13 |
| Faces (a dig’s first four) | 0 | 0 | 1 |
| **Thin** hauls and faces (past the four) | 0 | 0 | 2 |
| **Idle** actions (nothing to do) | 1 | 1 | 2 |
| **Umas in real jobs** · idle-ish | **6** · 0 | **13** · 0 | **32** · 0 |
| The bin, the year | 194,705g | 265,485g | 443,110g |
| Upkeep, the year | 5,760g | 7,485g | 8,385g |
| Takeout, the year | 1,875g | 3,375g | 10,470g |
| Meals from the pantry, the year | 91 | 203 | 560 |
| Well fed, a night | 6 of 7 | 11 of 13 | 25 of 32 |
| The Kitchen: plays (their average score) · dishes made, the year | 17 (60) · 132 | 24 (61) · 186 | 24 (62) · 341 |
| Staff meals served, the year | 34 | 33 | 29 |
| Gold at the year’s end | 142,090g | 192,190g | 237,845g |
| Farm Rank · plots · station levels | 6 · 2 · 20 | 7 · 4 · 25 | 7 · 6 · 25 |
| Goods eased by a flood, a day | 0 | 0 | 0 |

The three farms year by year:

**The farm of 10:**

|  | Year 1 | Year 2 | Year 3 | Year 4 |
|---|---|---|---|---|
| Umas working the farm, at the year’s end | 8 | 10 | 10 | 10 |
| On the farm a day (their farm days) | 3 | 7 | 7 | 7 |
| Their actions a day | 12 | 28 | 29 | 31 |
| Real work on offer a day (taken, and waiting) | 40 (13, 27) | 82 (28, 54) | 85 (29, 56) | 100 (30, 70) |
| The field: tending and new ground | 6 | 15 | 12 | 14 |
| The animals | 0 | 9 | 13 | 13 |
| The stations’ loads | 1 | 1 | 2 | 2 |
| The kitchen | 1 | 1 | 0 | 0 |
| Full hauls (an area’s or a spot’s first four) | 5 | 2 | 1 | 1 |
| Faces (a dig’s first four) | 0 | 0 | 0 | 0 |
| **Thin** hauls and faces (past the four) | 0 | 0 | 0 | 0 |
| **Idle** actions (nothing to do) | 0 | 0 | 1 | 1 |
| **Umas in real jobs** · idle-ish | **3** · 0 | **7** · 0 | **6** · 0 | **6** · 0 |
| The bin, the year | 22,945g | 70,220g | 156,965g | 194,705g |
| Upkeep, the year | 825g | 2,550g | 5,130g | 5,760g |
| Takeout, the year | 1,020g | 4,410g | 3,765g | 1,875g |
| Meals from the pantry, the year | 348 | 382 | 147 | 91 |
| Well fed, a night | 1 of 3 | 3 of 7 | 4 of 7 | 6 of 7 |
| The Kitchen: plays (their average score) · dishes made, the year | 0 (0) · 0 | 2 (57) · 14 | 9 (59) · 68 | 17 (60) · 132 |
| Staff meals served, the year | 0 | 4 | 22 | 34 |
| Short nights | 0 | 0 | 0 | 0 |
| Gold at the year’s end | 7,970g | 16,290g | 56,470g | 142,090g |
| Farm Rank · plots · station levels | 3 · 2 · 4 | 4 · 2 · 9 | 5 · 2 · 16 | 6 · 2 · 20 |
| Goods eased by a flood, a day | 0 | 0 | 0 | 0 |

**The farm of 20:**

|  | Year 1 | Year 2 | Year 3 | Year 4 |
|---|---|---|---|---|
| Umas working the farm, at the year’s end | 8 | 17 | 20 | 20 |
| On the farm a day (their farm days) | 3 | 9 | 13 | 13 |
| Their actions a day | 13 | 37 | 58 | 61 |
| Real work on offer a day (taken, and waiting) | 39 (12, 27) | 94 (36, 58) | 141 (58, 83) | 170 (60, 110) |
| The field: tending and new ground | 5 | 13 | 30 | 42 |
| The animals | 0 | 15 | 16 | 11 |
| The stations’ loads | 1 | 2 | 5 | 4 |
| The kitchen | 1 | 2 | 2 | 1 |
| Full hauls (an area’s or a spot’s first four) | 6 | 4 | 5 | 2 |
| Faces (a dig’s first four) | 0 | 0 | 0 | 0 |
| **Thin** hauls and faces (past the four) | 0 | 0 | 0 | 0 |
| **Idle** actions (nothing to do) | 0 | 0 | 1 | 1 |
| **Umas in real jobs** · idle-ish | **3** · 0 | **9** · 0 | **13** · 0 | **13** · 0 |
| The bin, the year | 24,150g | 109,635g | 223,165g | 265,485g |
| Upkeep, the year | 855g | 2,670g | 6,090g | 7,485g |
| Takeout, the year | 990g | 4,110g | 4,575g | 3,375g |
| Meals from the pantry, the year | 350 | 670 | 611 | 203 |
| Well fed, a night | 2 of 3 | 6 of 9 | 10 of 13 | 11 of 13 |
| The Kitchen: plays (their average score) · dishes made, the year | 0 (0) · 0 | 0 (0) · 0 | 12 (58) · 90 | 24 (61) · 186 |
| Staff meals served, the year | 0 | 0 | 16 | 33 |
| Short nights | 0 | 0 | 0 | 0 |
| Gold at the year’s end | 9,655g | 38,800g | 21,640g | 192,190g |
| Farm Rank · plots · station levels | 3 · 2 · 4 | 4 · 3 · 10 | 6 · 4 · 24 | 7 · 4 · 25 |
| Goods eased by a flood, a day | 0 | 0 | 0 | 0 |

**The farm of 50:**

|  | Year 1 | Year 2 | Year 3 | Year 4 |
|---|---|---|---|---|
| Umas working the farm, at the year’s end | 8 | 17 | 38 | 50 |
| On the farm a day (their farm days) | 3 | 9 | 19 | 32 |
| Their actions a day | 13 | 36 | 82 | 140 |
| Real work on offer a day (taken, and waiting) | 39 (13, 26) | 85 (35, 50) | 152 (82, 70) | 232 (138, 94) |
| The field: tending and new ground | 5 | 14 | 42 | 95 |
| The animals | 0 | 14 | 20 | 16 |
| The stations’ loads | 1 | 2 | 6 | 9 |
| The kitchen | 1 | 1 | 3 | 2 |
| Full hauls (an area’s or a spot’s first four) | 6 | 4 | 9 | 13 |
| Faces (a dig’s first four) | 0 | 0 | 0 | 1 |
| **Thin** hauls and faces (past the four) | 0 | 0 | 0 | 2 |
| **Idle** actions (nothing to do) | 0 | 0 | 2 | 2 |
| **Umas in real jobs** · idle-ish | **3** · 0 | **9** · 0 | **19** · 0 | **32** · 0 |
| The bin, the year | 25,035g | 82,405g | 280,320g | 443,110g |
| Upkeep, the year | 840g | 3,015g | 6,165g | 8,385g |
| Takeout, the year | 1,125g | 6,675g | 8,265g | 10,470g |
| Meals from the pantry, the year | 341 | 499 | 931 | 560 |
| Well fed, a night | 1 of 3 | 4 of 9 | 14 of 19 | 25 of 32 |
| The Kitchen: plays (their average score) · dishes made, the year | 0 (0) · 0 | 0 (0) · 0 | 9 (55) · 89 | 24 (62) · 341 |
| Staff meals served, the year | 0 | 0 | 10 | 29 |
| Short nights | 0 | 0 | 0 | 0 |
| Gold at the year’s end | 10,930g | 9,385g | 28,405g | 237,845g |
| Farm Rank · plots · station levels | 3 · 2 · 4 | 4 · 3 · 11 | 6 · 5 · 23 | 7 · 6 · 25 |
| Goods eased by a flood, a day | 0 | 0 | 0 | 0 |

- **Farm days hold every farm to two thirds of its Umas a day.** Ten Umas put 7 on the farm a day, twenty 13, fifty
  about 32 (44 in year 4's Spring, 50 from Summer): each Uma works eight days of a season's twelve. Their actions a day
  are about two thirds of what they were (31, 61 and 140, from 49, 98 and 237).
- **Every stage now holds, with work to spare.** In year 4 those on the farm are in real jobs at every stage (6 or 7 of
  7, 13 of 13, 32 of 32), real work still waits (70, 110 and 94 actions a day), and thin and idle actions are a few a
  day. **50 Umas no longer run past the farm's real jobs:** before farm days, 35 of 50 were in real jobs and 14 idle-ish;
  now the farm's own jobs take the farmhands who show up. Expeditions take people from this existing work. The Restaurant
  and Forge would add more jobs.
- **The farms grow slower:** year 4 ends on Farm Rank 6, 7 and 7 (8, 9 and 10 before), with two, four and six plots
  (eight before at 50), and the bin pays 195K, 265K and 443K in year 4 (580K, 816K and 1.53M before). Upkeep and takeout
  stay a few percent of the bin, and every farm ends year 4 rich (142K, 192K and 238K).
- **The Kitchen feeds the farm at scale.** Each farm builds it in year 2 or 3, and in year 4 plays it 17, 24 and 24
  days of 48 (about 60, Good) and serves the staff meal 34, 33 and 29 nights. Nearly everyone on the farm is well fed
  every night (6 of 7, 11 of 13, 25 of 32).
- **Nobody lives on the farm** at any stage: the farmhands live in town and come on their farm days, at their meals'
  cost (the Dorm's 20 beds and the 10g a night each are gone). Spouses live in the homestead's houses (up to six, with
  the weddings), which the test doesn't play.
- **The market barely moves here:** the bot plants a different crop a plot and ships every day, so no good passes a crate
  a night (0 eased a day). A farm that plants one crop across its plots, or dumps a season's stock at once, feels it
  ([the market](#the-market-feels-a-flood)).

**What the test changed (F91's retunes):**

- **Well fed no longer lifts a haul's count** (×1.25 before). With the ★2 meals a cook makes, nearly every farmhand is
  well fed every night, and the quarter more on every haul and face, on top of the one more action, nearly doubled a
  farm: the whole farm's two years shipped 292,055g with it against 154,405g with no well fed at all; without the
  quarter they ship 224,765g. At 50 Umas, year 3 shipped 534K with it, 503K without. Well fed keeps one more action,
  +0.25 quality and ×1.25 rank points ([well fed](#well-fed)).
- **The digs thin as the areas and spots do:** four full faces a day each, then half finds. Before, the 50-Uma farm's
  surplus went to the Mine without limit: 44 faces a day, 1.32M of its 2.8M year-4 bin, its deep ores eased three steps
  by the flood and still its best pay ([thin](#thin-four-full-hauls-a-place-a-day)).

##### A route to marriage

How long marriage takes, answered the same way: a test (`packages/domain/src/romance/marriage.test.ts`) plays the
game's own rules with a plain bot, ten actions a day, courting **one default-story Uma** from meeting her to the wedding
night and farming with what's left. `MARRIAGE=1` prints the tables below.

- **The town is honest, and nothing is drawn.** The cast there is a hundred invented characters, as the owner's is,
  each on the default schedule, so about a third are out at the six spots each day and the rest at home, as on the
  phone. She has no `home`, `job` or `routine`, so she keeps **the default schedule**: her favourite spot on four days a
  season (the first in the cast: days 1, 4, 7 and 10). A second way gives her cast entry **a home in town** (a
  `town.json` home on the map), so she's out every day.
- **She's met only by meeting her:** introducing yourself in town, on a day she's out. Talks, gifts, Praise, her evening
  and the invitation to work need her **in front of you**: on the farm when she lives there or it's her farm day (a
  farmhand), else in town where she is today, where the bot asks her out. The bot never forces her into town: a day
  she's at home it farms instead, and those days are counted. Her events play from anywhere.
- **Each day,** while she's in front of you (going into town for her when she's out there): a talk, a gift, Praise when
  she's earned it, and from Friendship 3 **the invitation to work** (a farmhand from then, on the farm on her farm days,
  watering the field and foraging the woods those nights, and in town on her town days, where he goes to find her); her
  morning invitation said yes; **her evening** when it's open (2 actions); **her event** when Ready (the warmest reply,
  Yes at her confession); from Romance 8 **a ring** at the bench from three refined goods the Mill made (the bot keeps
  the Mill's goods from Romance 5); then the proposal and the wedding. Then the farm, as the first year's bot plays it:
  harvest, water what she won't, the Mill on a loan once its logs are held, the season's quickest seeds, a crate
  shipped, and the rest at the woods and the water.
- **Two profiles.** **Devoted:** her loved gift whenever it's held, else a liked one; **Great** evenings in her favourite
  kind. **Casual:** a liked gift; **Fine** evenings, the first kind offered. A default-story Uma loves her line's good
  and likes nothing in particular, so her tastes for the run are a synthetic bible's: loved her line's default (a
  farming Uma: Carrot, the season's quickest seed in Spring), liked four goods of the woods. Her favourite kind is the
  walk, which both profiles take.
- **One home.** She lives in town until the wedding: nobody moves to the farm before it (the Dorm and its Invite to the
  farm are retired). From Friendship 3 she's a farmhand, on the farm on her farm days: the default schedule's other
  eight days of each season's twelve, or every day with a home in town (a day at her home is free).
- **Seven farms each:** the account seeds every draw (stars, hauls, her lines, her invitations), never where she is, so
  every farm meets her on day 1. Each cell is the median of the seven, with their range. A day is the farm's (48 to a
  year).

It checks that **every run reaches the wedding night**, that **nothing dead-ends** (her event only ever waits on her
bar, the day after, a ring or one a day), that devoted is no slower than casual, that a farmhand is in front of you every
day (on the farm on her farm days, two thirds of them on the default schedule and all of them with a home in town; in
town on the rest), that every farm meets her the same day, that a home in town brings her out every day and weds no
later, and that living in town she weds inside the second year.

**She lives in town, a farmhand on her farm days:**

|  | Devoted, the default schedule | Devoted, a home in town | Casual, the default schedule | Casual, a home in town |
|---|---|---|---|---|
| Met her, day | 1 | 1 | 1 | 1 |
| Out of her reach, days | 16 | 0 | 22 | 0 |
| In front of you, before she's a farmhand | 36% of days | 100% of days | 35% of days | 100% of days |
| In front of you, once she's a farmhand | 100% of days | 100% of days | 100% of days | 100% of days |
| On the farm, once she's a farmhand (her farm days) | 68% of days | 100% of days | 67% of days | 100% of days |
| Friendship 3, day | 22 | 10 | 31 | 14 (14–16) |
| A farmhand, day | 25 | 11 | 34 | 15 (15–17) |
| The confession, day | 36 (36–37) | 22 | 51 | 32 (32–34) |
| The proposal, day | 49 (49–69) | 35 (35–36) | 78 (70–78) | 55 (51–58) |
| **The wedding**, day | **50 (50–70): Spring 2, year 2** | **36 (36–37): Autumn 12, year 1** | **79 (71–79): Autumn 7, year 2** | **56 (52–59): Spring 8, year 2** |
| Meeting her to the wedding, days | 49 (49–69) | 35 (35–36) | 78 (70–78) | 55 (51–58) |
| Actions spent on her | 161 (161–248) | 159 (159–163) | 257 (222–257) | 235 (219–245) |
| Evenings | 26 (26–46) | 26 (26–27) | 46 (38–46) | 42 (38–44) |
| Gifts: loved, liked | 10, 22 | 8, 22 | 0, 53 | 0, 47 |
| Gold at the wedding | 5,490g (4,855–9,995) | 5,235g (3,900–6,210) | 7,770g (6,730–9,330) | 10,635g (9,790–13,010) |
| Days her event waited on her bar | 27 (27–28) | 13 | 48 (47–48) | 28 (28–30) |
| Days it waited on a ring | 0 (0–19) | 0 (0–1) | 8 (1–8) | 5 (1–7) |
| Short nights | 1 (1–2) | 1 (1–2) | 1 (1–2) | 7 (1–14) |
| Real time, at 3–5 minutes a day | 3 h–4 h | 108 min–3 h | 4 h–7 h | 3 h–5 h |

- **The wedding comes in the first year or early in the second,** as before: devoted on the default schedule, **day 50
  (Spring 2, year 2), 49 days after meeting her**, some 3–4 hours of play; casual, day 79 (Autumn 7, year 2: 71 before
  farm days). With a home in town, devoted weds on day 36, the farm's own pace, and casual on day 56.
- **The default schedule brings her out a third of the days** (36% before she's a farmhand: four days of each season's
  twelve), the same days every season and on every farm, so you can plan for them: her profile and the calendar show
  them. Those days are the whole of her wait before Friendship 3 (16 days out of reach, devoted).
- **The farmhand is the turn.** Once she's invited to work (day 25, devoted), she's in front of you every day: on the
  farm on her farm days (68% of them on the default schedule), and in town on the rest, where the bot goes in to find
  her. The confession comes 11 days later and the wedding 25 days after she's a farmhand, as when she was on the farm
  every day; the casual farm, spending more of its day on her town days, is slower (the wedding 45 days after, from 37).
- **Her evening plays in town and on the farm.** She has 26 evenings before the wedding, devoted: asked out where she is
  on her days, then every day once she's a farmhand.
- **A home in town** (or any fuller schedule the story writes) is the story's lever for the first weeks: out every day,
  she reaches Friendship 3 on day 10, and as a farmhand every day is her farm day, so she's on the farm every day.
- **Her loved gift is early:** a farming Uma loves Carrot, the first season's quickest seed, so devoted gives it on ten
  days before the wedding. Every default loved good can be had in Spring of year 1 ([her favourite line and
  tastes](#her-favourite-line-and-tastes)).
- **The ring rarely holds her long:** the bench opens the night after Romance 8, and the Mill's goods kept from Romance
  5 make a ring there; the proposal waited on it 0–8 days at the median.
- **Food bites little:** she eats on the farm only on her farm days once she's a farmhand, and costs nothing before; the
  farm runs short of the night's bill on one night at the median (seven, casual with a home in town). The bot cooks
  only for its tight nights; a player who cooks or gathers a little more pays it ([food](#food)). Thin hauls change
  little: the farmer leaves her the Woods' forages on her farm days and fishes the Pond
  ([thin](#thin-four-full-hauls-a-place-a-day)).
- **No retune:** the owner decides the pace after reading it.

#### The night's goals check

Night step 8 runs, in order:

1. **The places paid for yesterday stand** (`raiseBuildings`), each a line of news.
2. **The Diary pays** every milestone and row reached and not yet paid.
3. **The Farm Rank's points** are recomputed; **the ranks reached tonight** are noted, lowest first.
4. **The ring bench** opens the night after the first Romance 8.

The morning's New today then lists, in order: the season and festivals, each place built, each Farm Rank reached, each
milestone and row paid, then the household's milestones.

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

- **In a scene,** a legacy worker's character id or role id resolves to the playable Uma on duty. A vacant
  role uses narration, including when the scheduled worker is the scene's lead or is away. The mayor keeps
  her civic scenes and playable Umas keep their own named lines. Live scenes and Library replays use the same rule.
- **The smith** speaks at the ring bench, and **the cook** judges the Cooking Contest ([its lines](#the-cooking-contest)).
  The others have no lines of the game's; the opening is the story's, and any of
  the town's people may speak in it.
- **A tie** with one of them builds no bond: its line shows on the cast Uma's profile ("In town ›") and on the town
  person's sheet.

#### The scenes

Each scene plays once: played through or skipped, it's marked read and never plays again. Which scene plays now:

- **Nothing plays until the farmer is named.**
- **The opening's lines,** on day 1, once you're named: the pack's `opening.json`, any length, else the game's two
  (below). Reading them or skipping them opens the farm on Home: no card, no tutorial, and nobody at the Gate.
- **The ring bench's scene,** the morning after the first Romance 8 event, once the summary is put away: after the
  opening, before the meeting scenes.
- **Meeting scenes,** after those, in the order you met them: at once after you introduce yourself in town.

#### The opening's lines

The pack's `opening.json` is the opening, at any length (see [the opening](#the-opening)). Without one, the game's own
two play, one to a tap (its old third line, someone at the Gate, is retired with the welcome week):

<!-- live:scenes -->
| # | Kind | Line |
|---|---|---|
| 1 | Narration | Morning, {farmer}. The farm is yours now, weeds and all. |
| 2 | Narration | One block is tilled, and nine Carrot seeds wait in the Fields. |
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
| 5 | The smith | “I can set quartz in copper for your first ring. I’ll bring the metal and stone from town.” |
| 6 | The smith | “You can pay a deposit at the bench and settle the rest with the mayor as your farm grows.” |
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
  Shipping (1 per 100g), Diary entries (5 each), Milestones (25 each), Festivals (150 · 75 · 25 a place). Its help
  explains where points come from.

#### The scene player

- **A full-screen sheet** over the farm and its bars, on [the dialogue engine](#the-dialogue-engine): the scene's title
  and **Skip** at the top; on the left the speaker's bust (her portrait in the day's season with the line's face, else
  her bust from master data; a role's disc; none for narration); on the right the speaker's name in the accent colour and
  the line (narration in italics), and "Tap to go on · 3/12". A tap on the line or the bust goes on.
- **It loads master data itself** (names, busts and portraits), since a new farm's boot doesn't wait for it. **Skip**
  works without it, and skipping marks the scene read.
- **The opening** plays its lines with the title line "Day 1" (the world's farm and town after it when it names them,
  "Day 1 · Thistle Farm, Fernwick"; a place once a `place` step names one: "Day 1 · Gate"), "Tap to go on · 1/2". Its last tap, or **Skip** on any line from the first, reads it and opens **Home**:
  two taps after the name for the game's own two.
- The same player plays the meeting scenes and the ring bench's scene; heart events play in their own player. The
  romance part covers them.

## Part 3 — Hearts: the cast and the romance

> **The romance is the game's.** It plays on save v6 from the story pack, and with the default story wherever the pack is
> silent: anyone in town can be met by introducing yourself there, and **People** is the rail's third page (Farm · Town ·
> People · Book · Diary), with the
> roster's album as its Work view. A save from before v5 starts over as a new farm (see
> [Save versions](#save-versions)).

### Conversation and inventory art

The Farm atlas holds 187 dedicated sprites, including 120 Restaurant dishes, 12 processed foods, 10 wedding rings, 35 tool tiers, four heirlooms, and six locations. The base sprites carry through inventory, recipe inputs, gifts, shipping, Forge and map views. Exact stock grades and stars still come from the farm's goods. Seeds retain the crop icon and packet mark.

### The dialogue engine

One engine plays every scene: the opening, meeting her, the ring bench's scene, heart events (and Ask her, and a Memory
replayed), the wedding night and moving in, pair conversations, the household's scenes and the finale, the calendar's
occasion scenes ([occasion scenes](#occasion-scenes)), and the Uma loop's: each evening's scene after its play (a
hangout's, a date's, Dinner in town's and A night in's, handing in their moment: a picnic, a dinner, a night in, a
festival night), the night's companion's morning greeting (pajamas) and a meal's line ([the Uma loop](#the-uma-loop)).
The plays have no lines. The story's steps are the same in every scene (`say`, `narrate`, `thought`, `choice`, `play`,
…). At her big moments the scene opens onto **her illustration, full screen** ([her illustrations](#her-illustrations)),
and each one seen is kept in **her gallery** ([her gallery](#her-gallery)).

```
┌──────────────────────────────────────────────────────────────────────┐
│ The Fields · Friendship 2                             Auto  Skip  Log │
│ ╭──────────────────────────╮                                         │
│ │ (the place's    ┌──────┐ │                                         │  her portrait in the scene's
│ │  backdrop,      │ her  │ │                                         │  outfit, her face the line's
│ │  scene art      │portr-│ │  ┌──────────────────────────────────┐   │  emote
│ │  across stage)  │ ait  │ │  │ Her name                         │   │
│ │                 │      │ │  │ Her line, typed out in an event. │   │
│ │                 └──────┘ │  └──────────────────────────────────┘   │  the line, or the choices
│ ╰──────────────────────────╯                                         │
└──────────────────────────────────────────────────────────────────────┘
```

- **Landscape:** the setting spans the stage, with her bust on the left and dialogue or choices on a readable panel on the right. A tap on the line or her bust goes on.
- **Environments:** 52 original plates cover the Farm and town places, with dedicated room and time views for married life, café mornings, festivals, and winter fields. Town homes and workplaces can share the appropriate threshold or workroom. A place step changes the backdrop for the branch you're playing. A failed image falls back to a compatible setting and the scene keeps playing. Scene art is loaded on demand and previously opened files can be used offline.
- **Illustrations and replays:** character illustrations take over for their authored beats and return to the scene setting afterward. Gallery receipts still track character illustrations. Replays use the scene's script and recorded day when available.
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
the release and cached on the device by its hash, so a scene plays offline once seen. Twelve Umas have portraits so
far, each with her outfits and her faces; the next follow in the Uma Ranker's order. An outfit or a face not drawn for her yet falls
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
| 4 | A festival night, or New Year’s (`festival-night`, `new-year`) | `kimono` | `kimono` |
| 5 | A picnic, a tea or the spring festival (`picnic`, `tea`, `spring-festival`) | `garden-party` | `garden-party` |
| 6 | A night in, or a night she can’t sleep (`night-in`, `sleepless`) | `pajamas` | `pajamas-playful` |
| 7 | Her work (`work`) | `work` | `farm-work` |
| 8 | The summer shore (`shore`) | `swimsuit` | `swimsuit` |
| 9 | Else | `season` | The day’s season’s |

A wedding’s guests wear the moment’s other outfit (`wedding` and `wedding-night` are the scene’s own Umas’ only). The heart events’ moments: the wedding rung, a beat whose `together` is work, a picnic date, and `sea-pier` in summer. A household scene is a dinner and the finale a festival night; the calendar’s occasion scenes hand in New Year’s, the spring festival and festival night; the other moments are the evenings’ to hand in.
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
  and the master-data bust has no faces. Her master-data bust stays where it always was, on cards and sheets; her small
  face everywhere else is [her picture](#her-picture).
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
- **The blank profile** is the same head and shoulders, small: [her picture](#her-picture) while she has neither
  portraits nor a face in master data.

#### Her picture

Wherever an Uma's face shows small, as an avatar, it's **her picture**, in a rounded square. One avatar shows it
everywhere: the town's map, who's here and its keepers, People in town, the calendar's cells and its day, the Hearts
list, her profile's heading and its ties, the roster's cards, the work board, Tonight, the
evenings, the household, the farm map's houses, a scene's guests, the pair talks and the memories. Her picture is the
first she has of:

1. **Her profile picture** in today's season's outfit: uma-platform's 192 px square cut from her portrait, drawn whole.
   Three Umas have portraits so far, each with a profile picture per outfit.
2. **A crop of her portrait base,** cut in place, for a release made before profile pictures (below).
3. **Master data's face** for her: her outfit's face, or one of the town's people's character face. It shows as it
   always did, in the square instead of the circle. These faces are square (192 px, a character's 128 px), so they fill
   it exactly, neither cropped nor letterboxed.
4. **The blank profile** in the season's colours (below), when master data has no face for her either (a stand-in).

```
╭──────────────────╮
│◆    ╱╲    ╱╲     │  a badge in a corner sits over her hair, her ears,
│    ╭────────╮    │  her shoulders or the backdrop, never her face
│    │  her   │    │
│    │  face  │    │  her face centred, out of the corners
│    ╰────────╯    │
│   ╱ shoulders ╲ B│
╰──────────────────╯  a rounded square: its corners 18% of its side
```

- **The avatar:** a rounded square at the sizes the lists had (20 to 72 pt), its corners 18% of its side at any size,
  never a circle, with a hairline edge. The badges and counts a list puts on her face (her favourite line's mark, her
  best talent, her level, a ♥ or a ✓) keep their corners, 4 pt in, over the picture's edge and never clipped by it.
- **Her profile picture:** her head and shoulders in her portrait's outfit for **today's season** (spring, summer,
  autumn's `fall` or winter), her calm face, the base's own. Master data's `dialogue-portraits` carries one per base
  (uma-data 1.9.0, uma-platform's P180): a 192 × 192 WebP of about 10 KB, cut from a square about 1.5 faces wide (331
  to 336 px of a 525 × 700 base), her face centred and kept out of the corners at 28% of the side. An outfit without
  one shows her first in Farm Life's order that has one, spring first. On the next season's first morning every
  picture changes outfit.
- **Light:** an avatar loads only her profile picture, never her 300 KB base. It's checked against the release and
  cached on the device by its hash, as a scene's pictures are. A list loads nothing of her portraits for an Uma without
  them (the art index says so before anything is fetched): she shows master data's face, as before.
- **A release made before profile pictures:** the avatar cuts the same head and shoulders from her season's base in
  place (spring when that one isn't drawn): the base her scenes load, placed and scaled so a square fills the avatar,
  with no new file and no canvas. The square is 1.6 faces wide (358 px), centred across her face, her face's middle 46%
  down it, kept inside the base.
- **One seam:** a single function picks her picture's source (`pictureSource`, in `dialogue/picture.ts`): her profile
  picture when the release has one, else her base, cut in place.
- **While her portraits are read,** her square stays empty, so a pilot's picture never flashes another first; master
  data's face, too, leaves it empty until it has loaded.
- **Without portraits or a face** she shows **the blank profile**, drawn in code: the blank bust's head and shoulders
  in the season's outfit, on the season's colour (the date chip's) washed light, her hair her theme colour's (else a
  tone by her id), and her letters ("S1") over her shoulders in ink, or white on winter's navy. Her letters come from
  her name.

  | Season | Her picture's outfit | The blank profile's backdrop | Its outfit |
  |---|---|---|---|
  | Spring | `spring` | Pale green | Green, a pink collar |
  | Summer | `summer`, else `spring` | Pale gold | Sky blue, a white collar |
  | Autumn | `fall`, else `spring` | Pale orange | Orange, a russet collar |
  | Winter | `winter`, else `spring` | Pale blue | Navy, a white collar |

- **uma-kit's own pickers** show the same: master data's face as before for an Uma without portraits, and
  her picture for one with them.
- **Her bust stays master data's** on the cards and sheets that show a bust; a bust that hasn't loaded shows her
  picture until it has.

#### Her illustrations

At her big moments the scene opens onto **a full-screen illustration**. Master data's private `illustrations` family
holds them, keyed by her character id: her scenes in the art's order, each with its title, its outfit and its moment
(1672 × 941, from Uma Character Art's Farm Life universe). Twelve Umas' nine each are published. **An Uma without any
plays every scene on her bust and face, exactly as before.**

```
┌──────────────────────────────────────────────────────────────────────┐
│ Meeting ‹her name› · Gate                                       Skip │  the title line, light on a soft shade
│                                                                      │
│                  her illustration, the whole screen                  │  the picture fills the screen; no bust
│                                                                      │  while it's up
│    ╭────────────────────────────────────────────────────────────╮    │
│    │ ‹her name›                                                 │    │  the text box over its lower edge:
│    │ Her line, in white on the dark glass.                      │    │  dark glass, her name in rose, the line
│    │                                         Tap to go on · 3/6 │    │  in white, narration in italics
│    ╰────────────────────────────────────────────────────────────╯    │
└──────────────────────────────────────────────────────────────────────┘
```

- **How it shows:** the picture fills the whole screen in landscape, behind the title line (light over a soft shade)
  and the text box. **The text box** sits over the picture's lower edge: dark translucent glass, up to 46 rem wide, her
  name in rose, her line in white, narration and thoughts in italics. At a choice the line before it and the options
  sit in the same box, the options side by side where they fit. **No bust** while it's up.
- **A tap** goes on as usual: on the line (and in the scenes where a tap on her bust goes on, a tap on the picture).
  Skip, Auto and Log work as before; a play's sheet sits over the picture.
- **It fades** in as it comes up, from one picture to the next, and out as it goes down (450 ms); with reduced motion it
  simply swaps. While her picture loads the screen holds a dark ground, so her bust never flashes before it; a picture
  that can't load (offline, and never seen on this phone) shows her bust.
- **Each loads only when its scene starts:** her manifest the first time a scene of hers cues one (or her gallery
  opens), then every picture the scene can show, checked against the release and cached on the phone by its hash, so a
  scene plays offline once seen. Nothing is fetched for an Uma the art index doesn't list.
- **Tender, never explicit:** the owner approved every scene, and they show as published.
- **The scene ends on her bust:** the meeting's Welcome card, an event's card and the stage-ups show her bust as before;
  the picture fades out.
- **Which, and when.** The story names one with a step in her route's events, `{ "illustration": "<her scene's id>" }`:
  up from there until the next such step (`none` takes it down) or the scene's end ([the story
  pack's steps](story-pack.md#steps)). A scene that names one plays only its own. Every other scene of hers plays **the
  default mapping**, each moment showing her first scene for it:

<!-- live:illustration-rules -->
| The scene | Her illustration’s moment | Up |
|---|---|---|
| Her meeting scene (`arrival`) | `meeting` | From its start to its end |
| A summer date at the shore: her heart event at the sea pier in summer, from Romance 1 on (her Romance and Spouse rungs and the proposal) | `beach` | From its start to its end |
| Her confession (`confession`, and Ask her) | `confession`, then `confession-yes` | `confession` at the question: her lines that lead into her answer’s choice, and the choice. `confession-yes` from her Yes to the end; a Not yet takes it down |
| The wedding (`wedding`) | `wedding` | From its start to its end |
| The wedding night (`wedding-night`) | `wedding-night`, then `wedding-night-end` | `wedding-night` from its start. `wedding-night-end` as it fades: from the lines after its last choice (else that choice’s answers; with no choice, its last line) to the end |
| A night in’s evening scene (`a-night-in`) | `night-in` | From its start to its end |
| The night’s companion’s morning greeting | `companion` | Before her greeting: the morning’s narration, until her first line |

The moments, in story order: `meeting`, `beach`, `confession`, `confession-yes`, `wedding`, `wedding-night`, `wedding-night-end`, `night-in`, `companion`. A scene that names an illustration of its own (`{ "illustration": "<id>" }`) plays only its own; a moment she has no scene for shows her bust, as before.
<!-- /live -->

- **The next Umas** join the same way, with no farm release: when the art pipeline publishes their splash art, the farm
  sends uma-platform each scene's moment, and master data carries them.

#### Her gallery

```
┌──────────────────────────────────────────────────────────────────────┐
│ ‹her name› · Gallery                                     3 of 9    ✕ │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│ │  (her picture) │  │ ░ silhouette ░ │  │  (her picture) │           │  16:9 tiles in the art's order
│ └────────────────┘  └────────────────┘  └────────────────┘           │
│ Its title           Its title, muted    Its title                    │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│ │ ░ silhouette ░ │  │ ░ silhouette ░ │  │ ░ silhouette ░ │           │  locked: an Uma's head and shoulders
│ └────────────────┘  └────────────────┘  └────────────────┘           │  on a dark tile, and a lock
└──────────────────────────────────────────────────────────────────────┘
```

- **Unlocked for good:** each illustration shown in a scene joins her gallery, once, kept in the save (`gallery`: her
  scenes' ids in the order first seen). A Memory replayed counts too: you've seen it.
- **Her profile's Gallery** says "3 of 9" with **Open ›** (`?gallery=<id>`), for an Uma with illustrations only.
- **The gallery** opens full screen on a dark page: her name, "3 of 9" and ✕; every scene of hers in the art's order,
  three to a row (two on a narrow phone), each a 16:9 tile with its title under it. **A seen one** shows its picture;
  **the rest** show a locked silhouette (an Uma's head and shoulders on a dark tile, with a lock) and their titles,
  muted.
- **A tap on a seen one** opens it full screen: the whole picture on black, its title and "1 / 3" at the foot, ‹ › (or
  a swipe, or the arrow keys) to her other seen ones, ✕ (or Escape) back to the grid.
- Titles and pictures are master data's, read at runtime; a seen one's picture comes from the phone's cache.

### The cast and the story pack

Everyone you've met is one of **the cast**: one character each, keyed by her character id everywhere the save names an
Uma (the roster, her route, work, bonds, Memories and meeting scenes). She plays one outfit, is met when you
introduce yourself, and has a route of her own. One you meet whom the pack doesn't hold joins the cast bare, on the
default story.

#### The launch cast

The game opens with **50 Umas: the Uma Ranker's Tier 1–5** (the owner, 2026-11-17), and only they are in the game: in
town, on the People page, met, on the calendar's birthdays and occasions, and in the romance. Later releases add sets of
Umas as release packs ([the roadmap](roadmap.md#later-release-packs)).

| | The rule |
|---|---|
| **The 50** | The live Ranker plan's Tier 1–5 (generated 2026-11-16, profiles revision 6), in its order: 44 characters and 6 sisters, by id (`story/launch.ts`'s `LAUNCH_CAST`) |
| **The cast** | Kept to the 50 as the pack loads (`launchCast`): each one's story entry, in the story's order; one the story lacks joins bare at the end and plays the default story. With no pack, the 50 bare |
| **The rest of the story** | Stays in the pack and plays nowhere: today the story holds 100 Umas (Tiers 1–10), and Tiers 6–10 wait for a release pack |
| **The town's people** | Keep their posts (`town.json`): the town's roles, not the cast. Ten of the fourteen are Umas the Ranker leaves out of its playable tiers |
| **Already met** | An Uma on a farm's roster stays on the cast (`withCast`): a farm grows in place. The owner's three are all Tier 1 |

#### What the pack holds

The pack is a folder of JSON files, kept out of git. **It's a menu, not a checklist:** every part is optional, any number
of characters is fine, in any order, and nothing is counted. [The story pack's menu](story-pack.md) lists every field the
game reads, what it does in play, and what plays when it's missing.

| File | Holds | Without it |
|---|---|---|
| Cast | The cast, in its order: each character's id (a sister's `s<outfitId>`, with her name) and, optionally, her outfit, calling, birthday, favourite spot, her home, job and routine, and chapters; the retired welcome list and trigger to meet are still read | No characters |
| Ties | Each tie: two characters (a sister, or one of the town's people, among them) and, optionally, its kind, a strength of 1–3 and a line | No ties |
| Her bible (one per Uma) | Optionally her favourite line, gifts (loved, liked, disliked, any number each), her route's beats, chat sets, town lines, keepsake, pet name, wedding places and wishes. Her profile texts, season and festival are the story's own | Her calling's line (else her stats'), the default story's tastes (her line's favourite good loved) and talks, the game's town lines |
| Her route (one per Uma) | Her scripted events, by id (the rungs, her life's events, her occasions, the evenings' scenes), any of them | Each plays the default story's, which pays as a written one does |
| A pair's conversations | Conversations at bond levels 1–5 for a tie's two Umas | The game's two-line card at each level |
| The household | Household scenes at 5, 10 and 15 married, house lines and the finale, every part optional | The game's short cards; house lines from her temperament |
| The opening | The start's lines, any number: said, narrated, thought, pauses and the title line's place | The game's two lines |
| The town | The town's people (each an Uma of master data's in a role), its six spots (name, line, keeper), and the homes, workplaces and spots it adds to the map | Master data fills the roles; the game's own six spots and four shops and offices |
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

#### Her chapters, and the retired welcome list and trigger

The cast file also gives her chapters, optional and acting now ([her chapters](#her-chapters)), and two things that are
retired, still read and acting on nothing:

| Item | What it is | Without it |
|---|---|---|
| **Her chapters** (`chapters`) | Their titles, which of her rungs each holds, and an optional gate from the trigger menu (the farm's kinds, a season or a festival) | Four: "Getting to know her" (her arrival, F1–F10, the confession), "Together" (R1–R10, the proposal), "The wedding", "Married life" (S1, S3, S5) |
| **The welcome list** (`welcome`) | Retired: nobody comes to the Gate. Read, noted, and acting on nothing | — |
| **Her trigger to meet** (`meet`) | Retired: you meet her by introducing yourself in town. Read, noted once, and acting on nothing | — |

The domain reads her chapters through `chaptersOf`, with its default; `herChapters` lays them along her route. `welcomeOf`
and `meetOf` still read the retired two, for the Story Sandbox.

#### Her life in town

The cast file's `home`, `job` and `routine` say where she is, when; `town.json`'s `locations` add the homes and
workplaces they name. All optional; [the story pack's menu](story-pack.md#her-life-in-town) has the exact shape, and
[the town](#whos-where) how they place her: her routine's first stop that holds today, else her job on its days, else
her home; on a day none holds, at home off the map. With none of them written, she keeps the game's default schedule (her
favourite spot every third day of each season). They're what her profile's "Where to find her" and the calendar's
"In town" show.

#### The world in the pack

The pack's `world.json` puts the world the story builds on screen; every part is optional, and anything missing keeps the
game's own words ([the story pack's menu](story-pack.md#the-world-worldjson) has its exact shape). The domain reads it
through the placeholders' lookups: `worldNamesOf`, `historyOf`, `festivalsOf`, `storyDaysOf`, `placeWordsOf`, `seasonLineOf` and
`townNotesOf`.

| Part | In play | Without it |
|---|---|---|
| The town's name | The Town on the map and its screen's title, the opening's title line, the Gate's "Meet everyone else in *Fernwick*", the Diary's "The farm" | "Town" on the map and its screen; "in town" |
| The farm's name | The opening's title line, the Diary's "The farm" | "The farm"; the opening says "Day 1" |
| The region's name | The Diary's "The farm", after the town | None |
| The farm's history | The Diary's "The farm" page | None |
| The festivals | Renamed, moved or added: the calendar, the date chip, the morning, festival night, `festival` triggers and gates ([festivals](#festivals)) | The game's five |
| The story's days | Its holidays and minor days, on the calendar with their lines, and the morning's "*Market day* tomorrow" and "today" ([the calendar screen](#the-calendar-screen)); each plays its `scene` with each Uma who has it written, and one with a game's day's id moves or renames it ([the story's days](#the-storys-days)) | The game's own six small days |
| A place's name and line | The map, its quick look, its Build card | The game's own |
| A season's line | Under "*Spring* begins" on the season's first morning | "Spring begins" alone |
| Town notes | The Diary's Town notes, filling as you play; the morning names the night's ([below](#town-notes)) | None |

#### Town notes

Short pieces of the world that unlock as you play. Each unlocks once and stays.

```
 world.json's notes ──► no unlock ──────────────────────────────► known from the start
                    └─► an unlock from the menu ──► it holds at an introduction, a talk, a gift ──► "Town note · title ›" there
                                                    └─ or at night (step 8) ─────────────────► the morning names it
                                                                         both ──► the Diary's Town notes, kept
```

| Unlock | Holds | Checked |
|---|---|---|
| None | From the start | — |
| `event` (`<characterId>:arrival` is meeting her) | That event has played | An introduction, a talk or a gift in town, and every night |
| `spot` | An introduction or a talk with anyone at that town spot: a visit | A talk in town |
| `season` | All that season | An introduction, a talk or a gift in town, and every night |
| `festival` | That festival's day, as the story puts it | An introduction, a talk or a gift in town, and every night |
| `farm-rank`, `built`, `shipped` | What the farm holds | An introduction, a talk or a gift in town, and every night |

- **The night** checks after meeting her (step 8, `unlockTownNotes`) on the morning's date, so a season's note comes with
  its first morning, a festival's with its morning, and one for meeting someone the night after her meeting scene.
- **The save** keeps only the ids unlocked, in the order they unlocked (`diary.notes`); the words are the pack's. A note
  with no unlock never enters the save. A note the pack drops leaves the list; one it brings back returns.
- **The Diary** lists the notes you know in the pack's order, each a tap to read; **the morning** names the night's in
  New today, the first by its title ("*title* +2 more"), tagged **Town note**; **an introduction, a talk or a gift** that
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

- **Her outfit** is the cast file's: the game never chooses one over it. Her bust, talents and temperament come
  from that outfit; her name is her character's; her small face is [her picture](#her-picture): her portraits' crop,
  else that outfit's face. Talents aren't saved, so a changed outfit shows on the next boot.
  Without one, she plays **her default outfit from master data**: her first original outfit (no variant, the lowest id),
  else her lowest. (What she wears in a scene is her portraits' outfit, by [context](#outfits-by-context): a different
  thing.)
- **One resolver** turns a roster id into the outfit it plays: the cast's outfit, else master data's default for her,
  else the id itself for someone master data doesn't hold. The app sees
  master data through it, so faces, busts, names, talents, temperaments and pickers all follow the cast with nothing
  else to change.
- **A sister** (`s<outfitId>`, the Ranker's) is an outfit of an Uma, presented as a character of her own: she plays that
  outfit (its face, bust, talents and temperament), and her name is the pack's cast entry's `name`, never in git (without
  one, her elder's name as her sister). She lives in town and is met like anyone; the roster takes her id.
- **Anyone in town** meets master data through the same resolver: one of the town's people, or any other character,
  plays her default outfit; a role, the Uma who plays it. A character with no outfit shows master data's character face,
  else her blank profile.
- **A character master data doesn't hold** shows her blank profile (the silhouette of an Uma in the season's colours,
  with her name's first letter and its number, "S1") and reads
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
calling's line are exercised. Its opening is four invented lines, three narrated and then the farmer's thought. None of
the three outfits is in master data, so all three show their blank profiles. The three stand-ins:

<!-- live:stand-in -->
| Character | Outfit | Calling | Favourite line | Bible | Scripted |
|---|---|---|---|---|---|
| 9000001 | 900000101 | farming | farming | Yes | 27 of 27 |
| 9000002 | 900000201 | foraging | foraging | No (her calling stands in) | 1 of 27 |
| 9000003 | 900000301 | fishing | fishing | No (her calling stands in) | 1 of 27 |
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
| Her gift reactions | 3 for each taste (loved, liked, neutral, disliked) | Her bible’s `giftLines` for the taste; on her birthday its `birthday` first |
| Her meeting | In town, where you introduce yourself | Her route’s `arrival` |
| Her events | Every rung (27), and her life’s: `invited-to-work`, `wedding-night`, `moving-in`, `s2`, `s4` | Her route’s event of that id |
| Her occasions | `birthday`, `new-year`, `flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`, `harvest-cup`, `derby-night`; it plays `new-year`, `flower-show` and `derby-night` where her route writes none (the rest play only when written: [occasion scenes](#occasion-scenes)) | Her route’s event of that id |
| The evenings’ scenes | `hangout-walk`, `hangout-fishing`, `hangout-picnic`, `hangout-market`, `hangout-cooking`, `hangout-festival`, `date-walk`, `date-fishing`, `date-picnic`, `date-market`, `date-cooking`, `date-crafting`, `date-stargazing`, `date-dance`, `date-boat`, `date-footrace`, `date-festival`, `dinner-in-town`, `a-night-in`, `hangout-morning-walk`, `date-morning-walk`, `hangout-breakfast`, `date-breakfast`, `hangout-tea-by-the-pond`, `date-tea-by-the-pond`, `hangout-flower-market`, `date-flower-market`, `hangout-sunrise-sketch`, `date-sunrise-sketch`, `hangout-bakery-stop`, `date-bakery-stop` | Her route’s event of that id |
| The night’s companion | 3 morning greetings for each temperament | Her bible’s `mornings` |
| Meals | 3 lines for breakfast and 3 for dinner | Her bible’s `meals` (`breakfast`, `dinner`) |
| Her favourite good (`{good}`), the gift she loves | Farming Carrot, Ranch Honeycomb, Mining Button Mushroom, Fishing Trout, Foraging Shiitake, Cooking Basil, Serving Mint, Forging Potato | Her bible’s loved gift |
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
| `derby-night` | `kimono` |
| `harvest-cup` | `kimono` |
| `hangout-picnic` | `garden-party` |
| `hangout-festival` | `kimono` |
| `date-picnic` | `garden-party` |
| `date-festival` | `kimono` |
| `dinner-in-town` | `dinner` |
| `a-night-in` | `pajamas` |
<!-- /live -->

- **Her stage, as her talks follow it,** is [the Uma loop](#the-uma-loop)'s: acquaintance to Friendship 2; friend from
  Friendship 3 through the confession's wait (farmhand once you've invited her to work); sweetheart from the confession
  through the proposal's wait; engaged until the wedding; married after it.
- **The invitation to work** plays as you invite her, after the action is spent: her route's `invited-to-work`, else the
  default's, at the farm gate in the day's outfit ([the invitation to work](#the-invitation-to-work)).
- **The wedding night** plays right after the wedding's card, before the Married stage-up: her route's `wedding-night`,
  else the default's, in the wedding night outfit on a night backdrop, tender and fading to morning. Then **moving in**,
  her route's `moving-in`, else the default's, as she moves into the room she took; one who waited for a room plays it
  from the morning's "moved into" line. They pay nothing and save nothing; Skip ends each.
- **The evenings' scenes** play after each evening's play: her route's `hangout-<kind>` (a friend's), `date-<kind>` (a
  sweetheart's or a spouse's), `dinner-in-town` and `a-night-in`, else the default's ([the evening](#the-evening)).
- **The night's companion's greeting and the meals' lines** are her bible's `mornings` and `meals` when written, else the
  default story's (`morningGreetingsOf`, `mealLinesOf`), drawn by the day ([married life](#the-households-meals)).
- **The occasions the calendar plays:** every occasion her route writes, on its day: New Year's from the second year,
  each festival's day and night, her birthday, her anniversary and the story's days; the default story's New Year's,
  Flower Show and derby night where her route writes none ([occasion scenes](#occasion-scenes)).
- **Her talk** opens with her greeting and may be a small talk, and her gift line is her own, when her bible writes
  them ([talk that knows the day](#talk-that-knows-the-day)).
- **Married life 2 and 4** come at night when her bar fills, with no Ready event: the morning's "reached overnight" line
  plays her route's `s2` or `s4`, else the default's (short and tender), then her level-up card
  ([the level-up cards](#the-level-up-and-stage-up-cards)).
- **What waits for its moment:** the other occasions (her birthday, the Fishing Derby's day, the Cooking Contest, the
  Animal Show, the Harvest Cup): written and read through the same lookup (`eventOf`); they play when the festivals give
  them their moment.

Every other part of the story, and what plays without it:

<!-- live:placeholders -->
| What the story can give | What plays without it |
|---|---|
| The cast | Master data’s first 5 characters, in its order |
| The opening | Two short lines: the farm, and its nine Carrot seeds |
| Her name and outfit | Her master-data name and default outfit (her first original one) |
| Her chat lines, by stage | The default story’s talks: 4 a stage (acquaintance, friend, farmhand, sweetheart, engaged, married) for each of her 5 temperaments |
| Her gift reactions | The default story’s: 3 lines for each taste (loved, liked, neutral, disliked) |
| Her meeting scene | The default story’s, in town, where you introduced yourself; it pays as a written one does. A written one with no choice gets the hello |
| A heart event | The default story’s: her moment, her lines with their faces and your reply; its points and rewards pay as written |
| The wedding night, moving in, married life 2 and 4 | The default story’s: the wedding night in its outfit, tender and fading to morning; they pay nothing |
| Her occasions | The default story’s New Year’s, Flower Show and Fishing Derby night; her birthday, her anniversary, the other festivals’ days and nights and the story’s days play only when written |
| Her greetings | None: a chat or a talk in town opens on her line |
| Her small talk | None: a chat is her line alone |
| Her gift lines | The default story’s gift reactions, by her taste |
| Her evenings’ scenes | The default story’s 31: a hangout’s and a date’s for each kind, Dinner in town and A night in |
| Her morning greetings and meal lines | The default story’s: 3 greetings for each temperament, and 3 lines for each meal |
| A play’s prompt | Its game’s: “Cast the line together.” |
| Her chapters | “Getting to know her”, “Together”, “The wedding”, “Married life” |
| Her favourite line | Her line from master data: the work her stats suit best |
| Her tastes | Her favourite good loved (by her line: a Carrot for farming, a Trout for fishing…, each one the first season gives), every other gift neutral |
| Her birthday | Master data’s, or none |
| Her pet name for you | Your name |
| Her keepsake | “Her keepsake”, with a plain line |
| Her ring’s words | “Yours, always.” |
| Her wedding places | Her wedding beat’s place and the farm’s: the chapel bell, the Fields, the overlook |
| A tie’s kind, strength and line | “Close”, strength 1, “Closer now” |
| A pair’s conversation | Two short lines, one each, at every bond level of a tie; it pays nothing, as written |
| A household scene or the finale | A short card: a line, each spouse’s line, a line; the finale’s dance. It pays nothing, as written |
| Her house lines | Her temperament’s |
| The town’s people | Master data’s characters fill the 14 roles, from the last in its order, never one of the cast |
| The town’s spots | The game’s 6: The Plaza, The Market, The Café, The Harbour, The Library, The Hilltop Track |
| Her favourite spot | One of the six by her place in the cast, three Umas each |
| Her home, her job and her routine | The default schedule: her favourite spot on every third day of each season (from day 1, 2 or 3 by her place in the cast), at home the other days |
| The town’s locations (homes, workplaces) | None: the six spots and the four shops and offices |
| Her town line | 6 short lines, one a day |
| A sister’s name | Her elder’s name, as her sister |
| The town’s, the farm’s and the region’s names | “Town” on the map, “The farm” in the Diary, no region; the opening names none |
| The farm’s history | None |
| The festivals | The game’s 5: Flower Show, Fishing Derby, Cooking Contest, Animal Show, Harvest Cup, on each season’s 10th day and Winter 12 |
| The story’s holidays and minor days | The game’s 6 small days: Blossom viewing (Spring 8), The wishing night (Summer 9), The first cold evening (Autumn 8), The first snow (Winter 4), The longest night (Winter 17), The sweets day (Winter 22) |
| A place’s name and line | The map’s own name, and its quick look’s line |
| A season’s line | None: the morning says “Spring begins” alone |
| Town notes | None |
<!-- /live -->

- **No pack at all** (none published, or a pack whose cast names nobody): the cast is master data's first five
  characters by id, each in her default outfit with her master-data name. The game's two lines open the farm, and
  everyone is met in town by introducing yourself.
- **Her line from master data** is the work her stats suit best, by the talents' one rule: each activity reads one stat
  (Stamina farming, Guts the ranch, Power mining, Wit fishing, Speed foraging), and a tie goes to the first in that
  order. A line whose places aren't built yet waits as a written one does ("Opens when the Mine is built").
- **A heart event's default** is her moment, her lines with their faces and your reply: the warmer reply pays +30, the other +10, and with
  no play the best reply is a Perfect, so a card pays +50, +30 and +30 at best, as a written heart event does. Her beat's
  setup, place, play and unlock still apply when her bible has them. The big rungs keep their shape: her confession's
  reply holds Yes and Not yet, the proposal follows the ring you chose, and the wedding's last choice is the vows.
- **Her meeting scene** is the default story's, in town, where you introduce yourself: +50 and the reply's +30 or
  +10. A written one with no choice gets the game's hello, so every meeting pays as one with a choice does.
- **A tie's pair** has a conversation at every bond level: the pack's where it writes one, else two short lines, one
  each. A pair the ties don't hold has none ("‹a› and ‹b› are closer now").
- **The household** plays its scenes at 5, 10 and 15 married and the finale at 20 whatever the pack holds: the pack's
  `open` and `close` where written, else a line each; each spouse's beat, else her one line; the finale's dance.

Each default event's first line, which is also its Memory's caption when her beat gives none:

<!-- live:placeholder-moments -->
| Rung | The default event’s first line (and its Memory’s caption) |
|---|---|
| Her meeting scene | You introduce yourself, and the time slips by. |
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
 the name sheet ──► the opening's lines, one to a tap ──► Home, day 1: nobody met yet, everyone in town
                     the pack's opening.json, any length;
                     else the game's two
                     Skip from the first line ─────────────┘
```

1. **The name sheet.** Nothing else plays while the farmer is unnamed.
2. **The opening's lines:** the pack's `opening.json` (any number of steps: said, narrated, thought, pauses and the
   title line's place), else [the game's two](#the-openings-lines). `{farmer}` is filled as each shows. The title
   line names where you are when the world names it, "Day 1 · Thistle Farm, Fernwick" (the farm, the town, or either
   alone), until a `place` step names a place ("Day 1 · Gate"); else "Day 1".
3. **Its last tap, or Skip on any line from the first,** reads it once and opens **Home** on day 1: two taps after the
   name for the game's own two. No picks, no card, no tutorial.
4. **Nobody comes to the Gate** (the owner, 2026-11-14): there's no welcome week. Everyone is in town from day 1, and
   you go to the Umas you want to meet ([meeting her](#meeting-her)).

Nothing is picked or drawn. The farm has no global chapters, so the opening is the farm's first morning, never a plot.
A farm whose opening was already read never plays it again, and keeps everyone it has.

#### Meeting her

Every Uma is in town from day 1, and you meet her by **introducing yourself**: one of the day's actions, in town, where
she is now. From then on she has the whole romance: her ladders, heart events, perks, evenings, the proposal, the wedding
and married life, in [her own chapters](#her-chapters); she shows on the People page. There's no cap on how many you
meet, and nobody moves to the farm by meeting her: only a spouse lives there.

```
 the farm ──► Town (free) ──► walk to her (free) ──► her menu: Introduce yourself · 1 ──► met: her meeting scene
                                                                                                  │
                                                       she lives in town ◄─────────────────────────┘
                                                         └── Friendship 3: Invite her to work ──► on the farm on her farm days
```

- **Introduce yourself** is on her menu while you haven't met: you're in town today, she's out there now, and an action
  is left ("Go into town first.", "She isn't out in town now.", "No actions left today." otherwise). One of the town's
  people is never met: she keeps her role.
- **Met:** she joins the roster that day (`roster[id].joined`) at Friendship 0 with 0 points and **lives in town**,
  where you find her on her days for a talk, a gift, her evening and her events. Once she's a friend, the invitation to
  work makes her a farmhand, on the farm on her farm days ([farmhands](#farmhands)); after the wedding she moves into her
  room. Each of her ties with someone met starts at its seed.
- **Her meeting scene** plays at once, over the town, after the introduction.
- **Retired with the welcome week:** the Gate's visitor one a morning, Say hello, her trigger to meet (talks on three
  days, a gift, a spot, a season, a festival, what the farm holds) and the night's meetings. The pack's `welcome` and
  `meet` are still read, and noted as retired. Her chapters' gates stay, on the same trigger menu.
- **A sister** (`s<outfitId>`) is met like anyone: the roster takes her id.
- **Everyone on the roster counts as met,** the day she joined the day you met her.

#### Her meeting scene

Her meeting scene is her route's arrival scene, and plays as soon as you introduce yourself (above), after the opening
and the ring bench's scene, in the order you met them (by day, then the cast's order). The scene player shows her lines
with her bust (her portrait in the scene's own outfit, else the day's season, her face the line's emote; else the blank
bust in that outfit with the same face, or a role's disc) and `{farmer}` filled, narration, thoughts in italics, a title line ("Meeting
Stand-in 1 · Gate"), pauses, flags (wording only) and **her choice**: usually one; written with none she pays +50 alone,
and with more the first pays.

- **Each option shows its gain on the button** before the tap.
- **Skip** jumps to the choice, never past it; after the choice, to the end. So every meeting pays.
- **With her illustrations** it opens on her meeting's picture, full screen, its lines and her choice over it
  ([her illustrations](#her-illustrations)).
- It ends on her bust, smiling, "♥ +80" (or +60), where she lives ("She lives in town: find her there.", or "She lives
  on the farm." for one already there) and **Welcome, ‹her name›**, and the town stays where it was.

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
worth +30 or +10, in town, where you introduce yourself ("You introduce yourself, and the time slips by."). A written
one with no choice ends on the game's hello. Any pack can leave one unwritten: the release notes it, and the default
plays.

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
  loved** (by her line: a Carrot for farming, a Trout for fishing, the full list in [what plays without the
  story](#what-plays-without-the-story)), every other good neutral. Her favourite good is what the default story's
  lines call `{good}`. **Every default can be had in Spring of year 1**, with nothing built: the woods' Spring goods,
  the pond's Spring fish, or a crop of the shop's first Spring seeds (a test checks it against the tables).
- **A dish is a gift** like a good, from the gift picker's Dishes: her taste in it is her bible's (a loved dish pays
  loved), any other dish neutral.
- **Her tastes show** in steps: her loved good from Friendship 1; any good once you've given it, or once an event's option
  or a Choose play has revealed it; every taste from Friendship 7.

### The Uma loop

From meeting her to married life, in the owner's stages. Her points, events, plays, perks, the ring and the wedding are
[her route](#her-route) as built; the loop names the stage she's at, says what each opens, and adds its own acts: the
invitation to work, the evenings at two actions, moving in, the household's meals and the night's companion
(`romance/loop.ts`).

```
 meet ─► acquaintance ─► friend ─────► farmhand ─────► sweetheart ─► engaged ─► married
 (town)  talks, gifts    hangouts · 2   invited to      dates · 2     the        the wedding night, moving in;
         (1 each)        invite to      work · 1        Dinner in     wedding    meals · 1; the night's companion,
                         work · 1       (on the farm    town (R3),               who greets you in the morning;
                                        on her farm     A night in (R6)          only a spouse lives on the farm,
                                        days)                                    in her room
```

#### The stages

<!-- live:uma-stages -->
| Stage | How you reach it | What it opens |
|---|---|---|
| Acquaintance | Met (you introduced yourself), Friendship 0–2 | Talks and gifts, an action each |
| Friend | Friendship 3 and up | Hangouts (2 actions); the invitation to work (1 action) |
| Farmhand | A friend you’ve invited to work | She’s on the farm on her farm days (the days her town schedule leaves free), in front of you there, and works it those nights (the farmhands’ work); her farmhand talks |
| Sweetheart | From her confession’s yes (Romance 0) | Dates (2 actions) from Romance 1; Dinner in town from Romance 3, A night in from Romance 6 |
| Engaged | After the proposal | The wedding |
| Married | After the wedding | The wedding night and moving in: only a spouse lives on the farm, in her room; the household’s meals; the night’s companion |
<!-- /live -->

- **Her stage** shows on her profile, by her level ("Farmhand" beside "Friend · F5"), and on her menu in town ("Farmhand ·
  F5"). It's read from her ladders and one flag, never stored on its own: her ladder's stage, and `roster[id].farmhand`,
  the day you invited her to work.
- **A farmhand** is a farmhand while she's a friend; from her confession on, her ladder's stage shows, and she keeps
  working the farm on her farm days. **Only Stage 3 works the farm:** nobody else does, and nothing else lets an Uma
  work it (the work board takes a farmhand only).
- **Living on the farm** is the married stage's: a spouse in her room. Until then she lives in town, a farmhand coming
  on her farm days. Her talks follow her stage ([what plays without the story](#what-plays-without-the-story)).
- **Hangouts open at Friend**, Friendship 3, her "Hangouts" perk; **dates at Romance 1**, her "Dates" perk. A sweetheart
  at Romance 0 (the day after her confession's yes) still has hangouts.

#### The invitation to work

- **Invite her to work · 1**, on her menu in town or her profile, once she's a friend and where you meet her; once.
- She's a **farmhand** from today and keeps her life in town, and she's **on the farm on her farm days**, the days her
  town schedule leaves free: in front of you there for talks, gifts and her evening, and in town on her town days. On a
  farm day she works the tasks you set her on the work board overnight and eats on the farm, and her aptitudes grow
  ([farmhands](#farmhands)). The flag is also her stage and her talks.
- **Her scene** plays as soon as the action is spent, over her menu or her profile (`?life=invited-to-work:<id>`): her
  route's `invited-to-work`, else the default story's, a short scene at the farm gate in the day's outfit (her everyday
  one) unless hers names another. It pays nothing and saves nothing; Skip, or its end, closes it.

#### The household's meals

<!-- live:married-life -->
|  | Married life |
|---|---|
| A meal | Breakfast or Dinner: 1 action, each once a day, from your first wedding |
| Who eats | Everyone who lives on the farm (the spouses in their rooms) and every farmhand |
| What a meal does | Everyone it feeds well fed for 2 days (today and tomorrow; a meal running longer is never shortened), and +10 to each (`addLove`, an anniversary’s ×2 applies); and a batch for the pantry, 6 meals from 2 goods of food by the plain rule, when the Warehouse holds them |
| Its scene | One spouse’s meal line (`draw(uid, day, 'meal:<meal>', 0)`): her bible’s `meals`, else the default story’s, on the dialogue engine |
| The night’s companion | At Tonight, one spouse with a room: free. Her house is tonight’s house, so its morning is as built |
| Without a pick | Tonight’s house (the morning’s “misses you” Tonight ›, else the house slept in least lately), and its resident who’s been your companion least lately |
| Her room | A birthday-alone wisher chosen on her birthday: her morning hers alone |
| The morning | She greets you: a short scene in pajamas, her bible’s `mornings`, else her temperament’s default greeting (`draw(uid, day, 'morning:<id>', 0)`); then first in Hearts with ☾ |
<!-- /live -->

- **Where:** the homestead's sheet (a house's tap on the map), **Meals**: **Breakfast · 1** and **Dinner · 1**, once each
  a day ("Breakfast ✓"), and how many are at the table.
- **A batch too:** a meal is the farmer cooking for the household, so it puts six meals in the pantry from two goods of
  food by the plain rule, when the Warehouse holds them ([food](#food)).
- **As you sit down,** one spouse's line plays on the dialogue engine, in the day's outfit (`?life=breakfast:<id>`).
- **Well fed** counts down by one each night, so a meal today still feeds everyone tomorrow ([well fed](#well-fed)).

#### The night's companion

- **Tonight with**, on Tonight once anyone is married: one row a spouse with a room, her face, her name and her house,
  ☕ when her house's breakfast is on tomorrow, "9 nights" for a house you haven't slept in for 8 or more, and on a
  birthday-alone wisher's birthday "Her room · her birthday, just you two". The pick, else the night's default, is
  marked; a tap picks her at once, free. **Her house is tonight's house**, so its morning is as built
  ([the night's house and its morning](#the-nights-house-and-its-morning)).
- **Tender, never shown:** the night is the fade, nothing more.
- **In the morning** she greets you: as the morning comes up, a short scene in pajamas on a morning backdrop, her
  greeting her bible's `mornings`, else the default story's for her temperament, drawn by the day
  (`?life=morning:<id>`). With her illustrations the morning's narration plays over `companion`, before her greeting
  on her bust. It pays nothing and saves nothing (a picture seen joins her gallery). The morning's first Hearts line, "☾ Morning with *Name*"
  (**Play**), plays it again.
- **The save:** your pick is `homestead.companion` (with `homestead.tonight` her house) until the night, which notes her
  (`love[id].night`, the night she was last your companion) and clears it.

### Her route

#### Stages and costs

One track per Uma, 26 rungs with an event, plus the spouse levels S2 and S4, which have no Ready event and come at night
when their bar fills (the morning's line plays their scene):

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
- **The waiting rungs cost no points.** Each opens at least one day after the previous rung. The proposal also needs
  a ring, and a ceremony with a saved wedding date opens on or after that date.
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

Every number shows before or as it's earned: the buttons say it ("Chat · 1" with its +15, "Praise +20"), the gift picker shows each
good's points, and a **"+N" floats from her face** (still, with reduced motion). Every act pays through one rule, which
applies the day's factors and says what it paid. The acts, what each pays and how often:

<!-- live:love-points -->
| Act | Points | Limit | Paid by |
|---|---|---|---|
| Talk (her menu, or Chat on her profile) | +15 | One action; once a day each, where you meet her: on the farm, or in town where she is today | `chatV4` |
| Gift (one good, its stars your choice) | Loved +60, Liked +30, Neutral +10, Disliked 0; × (1 + 0.1 a star above ★1) | One action; one a day each, where you meet her; ×3 on her birthday | `giftV4` |
| Praise (a ★3+ day’s work, a rank-up, a Fine play) | +20 | Once a day, when earned | `praiseV4` |
| Her line (she worked it today) | +10 | Paid at night, step 6 | `payLines` |
| A festival together (its team or entry) | +50 | Once a festival a year each | `festivalTogether`: the Cooking Contest’s cook, Derby casters who took their turn, the Animal Show handler and Harvest Cup presenters |
| Her arrival scene | +50, and its choice (+10 or +30) | Once | `finishArrival` |
| A heart event | +50, its choices and its play’s grade | One action (a special day’s event actions first); one of hers a day | `playEvent` |
| The evening (a hangout from F3, a date from R1; 2 actions) | Fine +60, Great +100, Perfect +150; ×1.5 in her favourite kind, on her birthday and on her anniversary, each once | One evening a day across all the Umas; two on some days from 10 married | `spendEvening` |
| An invitation said yes | +20 | With her first evening that day | `spendEvening` |
| A house morning | +30 each resident | The house you slept in | `houseMorning`, night step 9 |
| A household meal (breakfast or dinner) | +10 each who eats it | One action each, once each a day, from your first wedding | `cookMeal` |
| **On her anniversary** | ×2 on every act but the evening (×1.5 instead) | From year 2 of her marriage | `addLove` |
<!-- /live -->

- **The day's factors multiply once each:** a gift ×3 on her birthday; on her anniversary every act ×2 except the
  evening, which takes its own ×1.5 instead.
- **Chat** (tap her): +15, once a day each, on the farm or in town ("You've talked today."). It plays today's talk on the
  dialogue engine ([talk that knows the day](#talk-that-knows-the-day)): her greeting, then her line or a small talk,
  drawn by the account, the day and her id, so it's the same all day. Her line: from Friendship 1 her bible's chat set
  for her stage when it holds any (friend through her confession, Romance 0 included; partner from Romance 1 to the
  wedding; spouse after it); else the default story's talks for her stage in the Uma loop and her temperament (a
  farmhand's once she works the farm), her favourite good and her line's work in.

##### Talk that knows the day

A chat on her profile, and a talk in town, play today's talk over the page (`?life=talk:<id>`, again from her profile
while you've talked today, paying nothing): her greeting, then her line or a small talk. Her words are her bible's
(`greetings`, `smallTalk`, `giftLines`: [the story pack](story-pack.md#her-bible-umascharacteridjson)).

| Piece | What plays | Without hers |
|---|---|---|
| **Her greeting** | On her birthday, her birthday's alone (when she has them). Otherwise one drawn from every set that applies now, their lines together, so each plays over time: the place where you're talking, `places.<id>` (in town her location today, else `places.town`; on the farm the place of her work board's first task, else none); the season's; and the hour's: `morning` by day, `evening` once you've spent an evening with her today, `night` after a night in with her or once she's tonight's companion | None: the talk opens on her line |
| **Her line or a small talk** | One drawn from her stage's lines and her small talks that fit the moment together. A small talk fits when every tag it carries matches: `at` the place (or `town` anywhere in town), `season`, `stage` her chat set. It plays as its lines on the dialogue engine, hers and yours (`you`, under your name), she on the stage throughout | Her line alone |
| **Her gift line** | On her birthday her `giftLines.birthday`; else her `giftLines` for the gift's taste | The default story's reactions for the taste |

- **The same all day:** each is drawn by the account, the day and her id.
- **The weather** (`greetings.weather`) is read and kept: it plays once the game has weather, which it doesn't yet.
- **Her `voice`** is the story's own notes on how she talks, never shown.
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
  night, or when a farmhand's harvest or haul tonight gave a ★3+ good. Assisting a Fine-or-better workshop play is a
  cause too, but nothing pays that cause yet. **Praise +20** shows on her profile only while earned and
  unpaid, pays once, and both lists clear at night.
- **Her line:** at night, +10 to each Uma who worked today at one of her line's places. One a night each; a day
  elsewhere pays nothing. Only farmhands work, so only they earn it.
- **A festival together:** +50 to each Uma who performs her role on a judged entry once per festival per year.
  This includes the [Cooking Contest](#the-cooking-contest) cook and the casters, handler and presenters of the
  [Festival ground contests](#festival-contests).

#### Birthdays and anniversaries

**The launch cast has 50 birthdays across the four seasons.** There are 13 each in Spring and Summer and 12 each
in Autumn and Winter, with one on each selected date. Base festivals, the six small days, and New Year’s have
their own dates. Each seven-day block keeps a date free of those occasions and launch birthdays. The cast entry
or master data supplies the March-to-February order. Additions fill the least occupied dates and the launch
birthdays stay in place. Small story packs use the straightforward date conversion below.

<!-- live:birthday-map -->
| Month | First date | Last date |
|---|---|---|
| March | Spring 1 | Spring 10 |
| April | Spring 11 | Spring 20 |
| May | Spring 21 | Spring 30 |
| June | Summer 1 | Summer 10 |
| July | Summer 11 | Summer 20 |
| August | Summer 21 | Summer 30 |
| September | Autumn 1 | Autumn 10 |
| October | Autumn 11 | Autumn 20 |
| November | Autumn 21 | Autumn 30 |
| December | Winter 1 | Winter 10 |
| January | Winter 11 | Winter 20 |
| February | Winter 21 | Winter 30 |
<!-- /live -->

- **On her birthday** a gift pays ×3 and an evening ×1.5, and the day gives one action for events. The morning says so
  the day before and on the day, and the calendar shows her face on it. Two Umas may share a birthday; a birthday on a
  festival day is both. Once married and housed, she can also host a **Birthday night** visit on that date.
- **Her anniversary** is her wedding's day of the year, from the first following year on the same season and date. That
  day every act pays ×2 (the evening ×1.5 instead), and that morning **she leaves a ★5 item of her line** in the
  Warehouse, on the farm or in town: a crop of the season for a farmer, a good of her foraging rank's deepest open area this season
  for a forager, a fish of her deepest open spot for a fisher, and a crop of the season for any line whose place isn't
  built yet, so an anniversary is never empty. The morning says so the day before and on the day, and the calendar shows
  her face on it.

#### Ready

Her next event is **Ready** when all four of these hold, wherever she lives: it plays from her menu in town, or from her
profile, an action each:

<!-- live:ready-rules -->
| # | Ready needs | Not met |
|---|---|---|
| 1 | Her bar is full for the rung; a waiting rung opens the day after the rung before, the proposal needs a ring, and a planned wedding waits for its date | `bar`, `day`, `ring`, `wedding-day` |
| 2 | She hasn’t played one of her events today | `today` |
| 3 | A chapter requirement or Warehouse item or bond decides the scene version, once the event is Ready | Play an alternate now. The original can be viewed in the Library when its requirements are met. |
<!-- /live -->

A setup is never an hour, the weather, a season or a festival; her chapter's gate may be a season or a festival (see
[her chapters](#her-chapters)). When she isn't Ready, the first of these in the way is the one shown:

<!-- live:ready-waits -->
| Order | `waits` | When |
|---|---|---|
| 1 | `done` | Her route is complete (S5 has played) |
| 2 | `night` | S2 or S4, bar full: no Ready event; the level comes at night, and the morning plays its scene; short of it, `bar` |
| 3 | `friend` | She said “Not yet” at her confession: you ask her again from her profile |
| 4 | `bar` | Her bar isn’t full for the rung |
| 5 | `day` | A waiting rung, on the day the rung before played |
| 6 | `wedding-day` | The wedding is scheduled for a later day |
| 7 | `ring` | The proposal, with no ring in the Warehouse |
| 8 | `today` | She played one of her events today |
<!-- /live -->

- **Scene versions.** A chapter's place, Farm Rank, seasonal requirement, Warehouse item or bond can select the
  alternate scene at the farm gate. It moves the same relationship by one step, costs one action and awards the
  usual milestone or perk. The original can be viewed from that scene's tile in the Library once its requirements
  are met, and earns a first-view date without spending an action or paying again.

#### The People page

**People** (`/hearts`, the rail's third page) is the Umas' page: one row an Uma you've met, on the farm or in town, two to
a row where they fit, a filter row, and her profile on a tap. Married, Romance, Hands and Met appear first. More filters contains Ready, Friends and In town. It has no badge. Its two views ride in the URL: Hearts (the
default) and **Work**, the roster's album with **her level in words** ("F7", "R4", "S2") in each face's corner.
`/roster` lands on the Work view.

```
┌──────────────────────────────────────────┐
│ People  Married 0/3  ☾ Evening ○     (i) │  ○ free, ● spent: a mark a slot today
│ [ Hearts ]  Work                         │
│ [Married] [Romance] [Hands] [Met 3]
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
- **The row's line:** Ready, her rung and where it plays ("Ready · Romance 5 · the Pond at night"); a short bar for one
  who lives in town, "Lives in town: find her there"; a short bar, nothing more (the bar says it); otherwise what her next event waits for ("Friendship 3
  · the Fields, when she works there", or her chapter's gate: "Friendship 7 · Opens when the Kitchen is built"); with none of these, a spouse's house ("Rose Cottage") or "Needs a room". Then "+N banked" (cut first on a narrow row), and today's **✓chat** and **✓gift**.
- **The sort.** Relationship stage comes first. Among spouses, Greater Love comes next. Then compare level and
  current points, with cast order for ties. The Ready filter shows Umas whose next scenes can play.
- **The filters,** one at a time, each with its count: **Ready**; **Friends** (friendship, and her confession's wait);
  **Partners** (romance, and the proposal's and the wedding's waits); **Married**; **In town**.
- **With no one met yet:** "No one yet. Go into town and introduce yourself."
- **The header:** "Married n/N", N everyone you've met (3 with the stand-ins); a household scene or the finale's chip while one
  is Ready ("⌂ Scene 1 ›", "⌂ Harvest ›"); and **☾ Evening** with a mark a slot today, **○** free or **●** spent, the
  evenings first and then festival night's.
- **The (i)** has six lines: how her bar fills and banks; Ready and setups; one event a day; her chapters ("A chapter
  may wait for the farm first"); gifts and tastes; and the evening ("One evening a day with someone home, 2 actions: a hangout from Friendship 3, a date from Romance 1. Fine
  +60, Great +100, Perfect +150, ×1.5 in her favourite kind, and +20 when she asked you.").

#### Her profile

Her profile is a side panel over the page, opened from her row, a Work card, the morning's lines and the town.
Each part shows only what exists; nothing says "Soon". One who lives in town (everyone but a spouse in her room) has,
under her face, **Where to find her**, then **Lives in town · moves to the farm after your wedding** (a spouse waiting
for a room: "… once a room is free"). There's no Invite to the farm: nobody moves in before her wedding.

```
┌──────────────────────────────────────────┐
│ Stand-in 1                             ✕ │
│ (face) [Acquaintance] New friend ● Ready │  her stage, then her level; the "+N" floats from her face
│        Farming · ★ Spring 4              │  her line, birthday and house
│ [ Hearts ]  Work                         │  held at the panel's top as it scrolls
│ WHERE TO FIND HER                        │  one who lives in town: her fixed schedule
│ Today · The Café              Find her › │  (or "At home · next out Spring 4")
│ Spring · The Café · 1, 4, 7, 10          │  this season's days and places
│ At home · the other days                 │
│ Lives in town · moves to the farm after  │
│ your wedding                             │
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
│ Gallery  3 of 9                  Open ›  │  an Uma with illustrations
│ Ring    Her ring will read: ‘…’          │  from Romance 8
├──────────────────────────────────────────┤
│ In town today, at the Café.   Find her › │  not in front of you: where she is
│ [ Chat · 1 ] [ Gift · 1 ] [☾ Evening · 2 ›]  48 pt, the panel's foot
│ [   Invite her to work · 1   ]           │  a friend, not yet working the farm
│ [        Praise +20        ]             │  while she's earned it
└──────────────────────────────────────────┘
```

- **Her heading:** her face, her stage in the Uma loop as a chip ("Acquaintance", "Friend", "Farmhand", "Sweetheart",
  "Engaged", "Married"), her level in words in her stage's colour, her **● Ready** chip; under them her favourite
  line, her birthday as a farm day ("★ Spring 4") and her house once she has one. A spouse waiting for a room says "Needs
  a room", and an own-house wisher sharing or waiting says softly "She'd love her own house".
- **The route as one track:** F1–F10, ◆, R1–R10, ◇, ◇, S1–S5 (28 steps), the played ones filled in their ladder's
  colour, the next filling by her bar, the rest empty, a waiting rung drawn as a diamond. It wraps to two rows of 14 on a
  narrow phone.
- **The Next card:** "Next: Romance 5"; its perk in her line's words (with "Opens when the Mine is built" where her
  line's place waits); her beat's hint for the rung (where and how it opens); the bar with "points / cost" and "+N banked"; and what it
  waits for: "Ready", "123 to go", "Tomorrow", "Needs a ring", "Tomorrow: one event
  a day", "The Fields, when she works there", "With Carrot in the Warehouse", "Bond 3 with Stand-in 2", "Opens when the
  Mine is built", "Opens when the Kitchen is built" (her chapter's gate), "She said “Not yet”", "Comes tonight", and
  once her route is done "Her route is complete". It never waits
  on the story: an event the pack doesn't script plays the game's card.
  - **Play · 1 action ›** (48 pt, in her ladder's colour) plays her Ready event, an action (a special day's event
    actions first).
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
- **Gallery:** for an Uma with illustrations, the ones seen of all hers ("3 of 9") and **Open ›** ([her
  gallery](#her-gallery)).
- **Ring:** from Romance 8, "Her ring will read: ‘…’" (the engraving, her Romance 8 beat's caption); from the proposal,
  her ring with its bonus ("Iron Ring · +3% at the Fields once you're married", then "+3% at the Fields"), "Her ring
  reads: ‘…’", and **Give her the ‹ring› ›** for each better ring in the Warehouse.
- **The actions,** 48 pt in the sheet's foot: **Chat · 1** (an action, +15; then today's talk plays on the dialogue
  engine, and stays above the buttons, your lines under your name; "Chat ✓" once done), **Gift · 1** (an action: the picker; "Gift ✓"), both greyed with no actions left or when she isn't in front of
  you, **☾ Evening · 2 ›** while she can spend one and the day has its two actions (otherwise greyed with why: "Evening ✓"
  spent with her, "Evening · F3" below Friendship 3, "In town" while she's out there and you aren't, "At home" on a day
  she's off the map, "Evening spent" with someone else, "Evening · 2" short of the actions), **Invite her to work · 1**
  on the row under them while she's a friend not yet working the farm, and **Praise +20** while she's earned it. What an
  act pays floats up from her face, and a note says it ("She likes it. +36").
- **Where you meet her:** Chat, Gift, her evening and Invite her to work need her in front of you ([where you meet
  her](#her-menu)): she lives on the farm (a spouse in her room) or it's her farm day (a farmhand), or you've gone into
  town today and she's out there.
  Otherwise a line above them says where she is, "In town today, at the Café. Talks and gifts are in person." with
  **Find her ›** (her menu where she is, `/town?at=<place>&uma=<id>`, where going into town comes first), or "At home
  today. Find her in town on her days.". **Play · 1 action ›** (her Ready event) works from anywhere.
- **Where to find her** (one who lives in town), under her face, read from her fixed schedule ([who's
  where](#whos-where)): **Today**, her place ("The Café", with **Find her ›**), or "At home · next out
  Spring 4"; then this season's days and places in short words, one line a place in the order of its first day: "Spring
  · The Café · 1, 4, 7, 10", her job's "The Bakery, at work · 1–6", and home "At home · the other days" (her story's
  home on the map by its name). A farmhand reads "Today · On the farm" on a farm day (her place in town on a town day),
  then the season's farm days, "Spring · On the farm · 2, 3, 5, 6, 8, 9, 11, 12", and her town days by place, "The
  Café · 1, 4, 7, 10"; a spouse in her room, "Every day · She lives on the farm".
- **Hearts | Work:** the Work side is her work sheet: her favourite line, the day she joined, where she is, "Farmhand
  since Spring 3 · her tasks" (a tap to the work board) once she works the farm, her fourteen aptitudes (each level, a bar to
  the next and the trick it opened; "where she'd start" before she's a farmhand: see [aptitude](#aptitude)), and her
  nine activities with talent, rank, points and the next challenge.

### Her chapters

Each Uma's story is hers, in her own chapters, from the day you meet her to married life. There's no farm-wide story.
Her chapters frame her route; the backbone stays as built (her arrival, friendship F1–F10 and the confession, romance
R1–R10, the proposal and the wedding, married life S1–S5), and so do the points, the perks and the evenings along it.

```
 her cast entry's `chapters` ──► her chapters along her route ──► the one she's in: the chapter holding her next rung
   (else the four defaults)       in the order of their first events      │
                                                                          ▼
 an original scene’s requirement ──► original scene if met, alternate scene otherwise
                                    │ either version records the same relationship step
                                    ▼
           original available later ──► See original scene in the Library
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
  as "Chapter 2". S2 and S4, which come at night, count with S1 and S3.
- **The one she's in** is the chapter holding her next rung. **A chapter opens when its first event can play:** the
  rung before it has played. Requirements choose the scene version.
- **The original scene’s gate** can ask for a built place, Farm Rank, goods shipped, another event, a season or a
  festival. If it is unmet, the chapter can begin with an alternate once the ordinary relationship conditions
  are met. The original opens in the Library when the gate and any item or bond setup hold. The ring bench
  counts as the Forge setting for these scenes. Introductions keep their usual town rules.

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
    hold. Her first chapter opens with meeting her.
- **Her ending:** her last chapter closes when Spouse 5 plays, in married life. The household's scenes, the evenings and
  the house go on after it.
- **The save holds nothing new for them:** her chapter is worked out from her route and the gates as it shows. The
  morning's line keeps her id and the chapter's number; its title is read from the pack.

### Perks

A perk comes with every level, 25 in all, and every perk acts. **A perk is read from her level, never stored:** she has a
rung's perk once its event has played (S2 and S4 once they've come at night). Only her signature dish writes anything to
the save.

**The perks that ride on an Uma's own work** (the romance term on a harvest or a haul, side by side, her line's pay, the
mentor, her keepsake on her work, bonds at work) act on a farmhand's ([farmhands](#farmhands)); an Uma who doesn't work
the farm gets none of them. The night chores, morning items, meals, her keepsake on her chores and the household's act
as written.

#### The perks' words

The words are templates by her favourite line. A perk that works at her line's place says **"Opens when the Kitchen is
built"** (her place) while that place isn't built, and does nothing until then. The first table words each perk for a forager; the second
shows what the place-bound ones say for every line.

<!-- live:perk-words -->
| Level | Perk id | Words (a forager’s) | At her line’s place |
|---|---|---|---|
| F1 | `tastes-loved` | Her loved gift shown; her own chats |  |
| F2 | `line-10` | +10% at the forest | Yes: “Opens when the Kitchen is built” (her place) until it’s built |
| F3 | `hangouts` | Hangouts in the evening |  |
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

| Her line | Her place | +10% (F2) | A night chore (F6) | A morning item (R2) | Opens with |
|---|---|---|---|---|---|
| Farming | the Fields | +10% at the Fields | Waters a dry tile each night | A ★2+ crop of the season | Day 1 |
| Foraging | the forest | +10% at the forest | One item from the forest each night | A ★2+ good from the forest | Day 1 |
| Fishing | the Fishery | +10% at the Fishery | One fish from the Fishery each night | A ★2+ fish | Day 1 |
| Mining (the Mine) | the Mine | +10% at the Mine | One ore from the Mine each night | A ★2+ ore | When the Mine is built |
| Mining (the Quarry) | the Quarry | +10% at the Quarry | One stone or gem from the Quarry each night | A ★2+ stone or gem | When the Quarry is built |
| Ranch | the ranch | +10% at the ranch | +5 fondness to her animals each night | A ★2+ egg, milk or fleece | When the Coop or the Barn is built |
| Cooking | the Kitchen | +10% at the Kitchen | One more dish on the Kitchen’s next play | A ★2+ dish | When the Kitchen is built |
| Serving | the Restaurant | +10% at the Restaurant | One grace order on today’s Restaurant shift | A ★2+ crop of the season | When the Restaurant is built |
| Forging | the Forge | +10% Forging points when assisting | Train Forging by preparing tools or heirlooms | A ★2+ crop of the season | When the Forge is built |
<!-- /live -->

#### What each perk does

Each perk, what it does, and where in the day it acts:

<!-- live:perk-effects -->
| Level | Perk | What it does | Where it acts |
|---|---|---|---|
| F1 | Her loved gift shown; her own chats | Her loved gift shows on her profile; she speaks her authored chats | Her profile, Chat |
| F2 | +10% at the forest | +10% at her line: copies of her night’s items there (a farmer: a tended plot’s chance of an extra crop) | Night step 4, a harvest |
| F3 | Hangouts in the evening | The evening opens: hangouts | Tonight |
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

Each place-bound template means one thing at each line's place. **Every line whose place stands acts:** farming,
foraging and fishing from day 1, mining once the Mine (or a quarrier's Quarry) stands, the ranch once the Coop or the Barn
does, cooking once the Kitchen stands, and Serving once the Restaurant stands. Forging rewards an assistant on a Forge job.
A workshop line's morning item is a crop of the season. **Her
line** is her favourite (her bible's, else her calling's, else master data's), as for every line; her +10% acts where
her work is that line's place (the board's task she's set, at night), and her chores and morning items while she's on
the farm: a spouse in her room every day, a farmhand on her farm days.

<!-- live:perk-lines -->
| Her line | +10% at her line (F2, R5) | A night chore (F6, R7, S4) | A morning item (R2, S2) | Acts |
|---|---|---|---|---|
| Farming | Each plot she tends: +10% chance of an extra crop at harvest, at the plot’s stars | Waters one dry growing tile (step 2) | A ★2+ crop of the season | Yes |
| Foraging | Her haul ×1.1, and her Sawmill batch ×1.1 | One item from her rank’s deepest area this season, at a day’s haul’s stars (step 4) | A ★2+ good of her rank’s deepest forest area this season | Yes |
| Fishing | Her catch ×1.1, and her Smokehouse batch ×1.1 | One fish from her deepest spot this season, at a day’s haul’s stars (step 4) | A ★2+ fish of her deepest spot this season | Yes |
| Mining (the Mine) | Her haul ×1.1, and her Smelter batch ×1.1 | One ore from the Mine’s deepest floor reached, at a face’s stars (step 4) | A ★2+ ore of the Mine’s deepest floor reached | Yes, once the Mine stands |
| Mining (the Quarry) | Her haul ×1.1, and her Cutter batch ×1.1 | One stone or gem from the Quarry’s deepest floor reached, at a face’s stars (step 4) | A ★2+ stone or gem of the Quarry’s deepest floor reached | Yes, once the Quarry stands |
| Ranch | The goods she collects at the Coop or the Barn ×1.1: a +10% chance of an extra each, at its stars | +5 fondness to each animal in her building: the Coop or the Barn she cares for on the work board, else the first that stands (step 3) | A ★2+ egg, milk or fleece of an animal the farm keeps (a crop of the season with none) | Yes, once the Coop or the Barn stands |
| Cooking | As the Kitchen’s assistant, her term ×1.1 (×1.2 from R5): its play makes a tenth more dishes | +1 dish on every Kitchen play while she’s on the farm: a spouse in her room, or a farmhand on her farm day (the chores don’t bank: a day without a play makes none) | A ★2+ dish (a crop of the season for now: the dishes come to the morning items later) | Yes, once the Kitchen stands: its +10% and its chores (the morning item later) |
| Serving | +10 percentage points to the tip rate and +0.75 s per ticket as the Restaurant’s server, again at R5 | One 4 s grace order per chore on the day’s shift | A ★2+ crop of the season | Yes, once the Restaurant stands |
| Forging | +10% Forging points when assisting | Prepare tools, heirlooms or practice fittings | A ★2+ crop of the season | Yes, when she assists at the Forge |
<!-- /live -->

- **Seeded:** a fraction becomes a whole item by a seeded draw on the account, the day and her id, so a night replays the
  same.
- **Gathering and stations pay at night:** the items an Uma's work finished tonight come to × (bond × (1 + romance)) in
  all. Side by side's pot pays first (×1.1, or ×1.2 in her element), then **the perks' pot**: the bond term × the romance
  term of the same items (her own bonuses only at her line's place, the crew's anywhere), as seeded copies (the same goods
  and stars) straight into the Warehouse. A forager's Sawmill batch, a fisher's Smokehouse batch, a miner's Smelter batch
  and a quarrier's Cutter batch count as her line. The job's own plan never changes.
- **Mining pays on a farmhand's faces** the same way: the finds of her faces at the Mine (a quarrier's at the Quarry)
  are her night's items there, so her haul comes to ×1.1 at F2 and ×1.2 at R5, held to the caps.
- **The ranch pays on what she collects:** the goods her care task collects at the Coop or the Barn are her night's items
  there, so each has her romance term's chance (+10% at F2) of an extra at its stars. They show with every line's in
  Hearts' "Perks · +1 item", not in the building's line. Her keepsake lifts the stars of what she collects there too.
- **Farming pays on a farmhand's harvests** the same way: her harvested crops are her night's items at the Fields, so
  the perks' extras copy them by her romance term at night. The farmer's own harvests get none.

#### The romance term and its caps

Every romance bonus on one job is one capped number:

<!-- live:perk-caps -->
| What | Cap | How |
|---|---|---|
| Her own line bonuses: F2 +10%, R5 +10%, her ring +1–15% once married | +35% | At her line’s place only (`romanceTerms`) |
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

- **1 from Friendship 6, 2 from Romance 7, 3 from Spouse 4,** never more, for an Uma on the farm that night (a spouse in
  her room, or a farmhand on her farm day, who works the farm overnight) whose line's place is open. **One in town does
  none** (a farmhand on a town day, a friend who isn't a farmhand, a spouse waiting for a room). Each chore is its own
  seeded pick.
- **Farming** (at night, as crops grow): each chore waters one dry growing tile, a seeded pick, so it grows a stage
  tonight; with none dry, the chore does nothing. The morning says "Night chores · 2 tiles watered".
- **The ranch** (at night, after the animals' night, step 3): each chore gives **every animal in her building +5
  fondness** (held to 200). Her building is the first Coop or Barn she cares for on the work board, else the first of
  them that stands; one with no animals gets nothing.
- **Foraging and fishing** (at night, after the hauls): one item from her rank's **deepest open forest area** this
  season, or one fish from her **deepest open spot**, by the season's shares, at the stars a day's haul there would have
  (her rank, talent, tool, well fed and keepsake), straight into the Warehouse.
- **Mining** (at night, after the hauls): one find from the **deepest floor reached** at the Mine (an ore) or, for a
  quarrier, the Quarry (a stone or a gem), by a face's grade shares, at the stars a face there would have (her rank and
  talent in mining, the Pick or the Hammer, well fed and keepsake), straight into the Warehouse. The dig's count and its
  stairs don't move.
- **The morning** says them in one line: "Night chores · 3 items", "Night chores · 2 items · +0.5 growth", "Night chores
  · +10 fondness".

#### Morning items

- **From Romance 2** she leaves **a ★2+ good of her line every 4th morning,** counted from the day she reached Romance 2.
  **From Spouse 2** it's **every 2nd morning at ★3+,** counted from the day she reached Spouse 2.
- **One a day by her count, on the farm only:** a spouse in her room, or a farmhand on the morning of her farm day. A
  morning in her house brings one more (see the house's morning, below).
- **The good** is her line's (as her anniversary item, with its own draw): a miner's a find of the dig's deepest floor
  reached, a rancher's the good of an animal the farm keeps (its kinds alike). **Its stars** are a seeded draw of a day's
  work at her line, keepsake included (a miner's a face's, a rancher's her building's animals' hearts on average), held at
  the minimum (★2, or ★3 from Spouse 2).
- **The morning** says "♥ Stand-in 2 left you ★3 Shiitake", opening her profile.

#### The mentor

At night, at each place farmhands worked today, an Uma at **Friendship 9** whose line's place it
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
| Mining (the Mine) | Curry | The top grade of the Mine’s deepest floor reached (floors 1–3: G2 … floor 27 on: G10); G1 before it stands | Basil Curry |
| Mining (the Quarry) | Curry | The top grade of the Quarry’s deepest floor reached (floors 1–3: G2 … floor 27 on: G10); G1 before it stands | Basil Curry |
| Ranch | Cake | The top grade of the goods the farm’s animals give (an Egg G1 … Cashmere Fleece G7); G1 with none | Honeycomb Cake |
| Cooking | Tart | The top grade of the dishes the Kitchen has cooked (`farm.counts['cooked:<dish>']`); G1 before its first play | Apple Tart |
| Serving | Cookies | The last Restaurant stage cleared, G1 before the first clear | Peanut Cookies |
| Forging | Bread | G1 crop of the season | Wheat Bread |

Her loved good, when it’s a dish, is her signature dish as it is. The recipe joins `workshops.recipes` once (a recipe the farm knows stays once) and her route keeps its id (`love.dish`).
<!-- /live -->

#### Her dream and breakfast

- **Her dream** is her Spouse 3 event. Once it's in her Memories it acts: **+5% for anyone at her line's place,** in the
  crew's term. Two dreams at one place count once.
- **Breakfast** is a spouse's Spouse 1 perk, served on a morning in her house: every Uma who lives on the farm (the
  spouses in their rooms) with no well-fed days left starts the day **well fed for one day** (a Rough meal, so that day's work speeds up and earns more rank points). A
  meal already running is never shortened or extended, and a breakfast isn't a staff meal (no staff-meal count moves). Each
  pair it feeds earns +5 bond.

#### On her profile

Her profile's Perks shows what each reached perk does now, a later perk taking the earlier one's line (Romance 5's
replaces Friendship 3's): "R5 · +28% at the forest · +8% ring" (with "+5% crew" and "held to its cap" when they apply;
a farmer's "+20% chance of an extra crop", a rancher's "of an extra good"), "R7 · 2 items each night" (a farmer's
"+0.5 growth each night", a rancher's "+10 fondness each night"; "None while she lives in town"), "R2 · Next
tomorrow" or "Next in 3 mornings", "F4 · ‹dish› · in the Kitchen's list", "F8 · Beside Stand-in 1" ("No 3-heart friend
yet"), "F10 · Bent Trowel · +0.25 quality at the Fields", "R1 · She calls you “Sprout”", "R4 · With Stand-in 1", "R8 ·
“‹engraving›”". A perk whose place isn't built says "Opens when the Mine is built" (her place; the ranch's, "Opens when
the Coop is built", opens with the Coop or the Barn) and nothing now.

### Heart events and plays

#### Heart events

A level is its event. Once her next event is Ready it waits for you, for good: **nothing fires on its own.**

- **Four ways in:** her Hearts row's **● Ready**, her profile's **Play · 1 ›**, the morning's Ready line (its **Play**
  tag) and the calendar's **Event ›**. Each opens the event player over the page.
- **It costs one action,** a special day's event actions first, spent as it's saved. With no action left of either
  kind, the player says "No actions left today." before it plays.
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

- **The setting** follows the event's actual place, including the wedding venue the player chose. A place step changes the background and title. The speaker wears the event outfit or the one for its occasion and keeps her last face through narration. Guests appear at the wedding in the day's outfits.

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
| `work: expeditions` | Rhythm with the pack |
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

The level-up card shows the same seasonal profile picture as the Uma's profile.

```
┌──────────────────────────────────────────┐
│          ♥  Friendship 5  ♥              │  a short sparkle (still with reduced motion)
│ (profile) “This bench is ours now.”      │  her last line of the event
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
    ("Her room: Farmhouse", or none free yet, so she lives in town until one frees) with buttons to move her to another house with a
    free room; "House mornings: +30 for her each morning you sleep there"; and "Married 1/20 · next household scene at 5"
    ("household scene 1 tomorrow" on a milestone's own wedding, "the Great Harvest tomorrow" on the 20th).
- **A night level** (Spouse 2 or 4) plays from the morning's line (`?level=<id>:<s2|s4>`): first her level's scene, her
  route's `s2` or `s4`, else the default story's, on the dialogue engine (Skip goes on); then the same card, with her last
  line of the scene, "Her bar filled overnight · now toward Spouse 3", its perk and her next rung. A level with no scene
  to play would show the card alone ("Her bar filled overnight: no event, the level comes by itself"); the default
  story writes both, so it doesn't happen.

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
- **With her illustrations,** her question (her lines into the answer, and the answer's choice) shows `confession`, her
  Yes shows `confession-yes` to the end, and a Not yet brings her bust back. Ask her shows them too.

#### Memories

**Her album** (from the People profile's **Album ›**) has 26 tiles, one a rung with an event,
under four filters: **Friend** (Friendship 1–10 and her confession), **Romance** (Romance 1–10), **Wed** (the proposal and
the wedding) and **Spouse** (Spouse 1, 3 and 5). Played tiles show their caption, **the next** is marked, the rest are
locked. **Her arrival ›** replays her arrival scene.

- **A replay** starts from the top or from any choice point picked from its list ("Choice 1 · “Show me which ones.”"). It
  plays with its plays and her illustrations, **every option is open** (no cost, no gain shown), **nothing is paid,
  taken or saved** (but an illustration seen joins her gallery), and it ends "A Memory, replayed. Replays give no
  points."
- **The Diary's shelf** lists each Uma on the farm with "n of 26", opening her Library book at Scenes. The shelf
  also keeps its links to the household scenes and the finale once read.

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

The day has **one evening across all the Umas,** spent any time in the day from her profile (**☾ Evening · 2 ›**), her
menu (**Ask her out · 2**, in town where she is or on the farm) or Tonight's row; an evening left empty costs nothing.
**It takes 2 of the day's actions** (never a special
day's event actions). It's a short play together at its evening length, graded **Fine, Great or Perfect** and never
failed, that pays well, and more in her favourite kind; then **her scene for it** on the dialogue engine; then the card.

#### Who and the kinds

- **Who:** a **hangout** with a friend, an Uma at Friendship 3 or more (her confession's wait and Romance 0 included), a
  **date** with a sweetheart from Romance 1 (the proposal's and the wedding's waits included), and **every kind** with a
  spouse ("An evening at home"). She must be **in front of you** (`eveningHere`): home on the farm (a spouse in her
  room), a farmhand on the farm on her farm day, or out in town today with you there, where her menu asks her out. The kinds, their scenes and their points are the same wherever you ask her.
- **The kinds** are the ten date games and two evenings of their own, opened by her ladder and by their game:
  **Dinner in town** (a date from Romance 3, in the dinner dress) and **A night in** (a date from Romance 6, in pajamas;
  at home once married), each played as a Pick. **Cooking together** and **the footrace** wait for their games, so they
  aren't offered yet (a favourite kind not offered still counts as hers, and she doesn't invite you to it). **Festival
  night** is a festival day's own slot.
- **Her scene:** after the play, her route's scene for it, else the default story's: `hangout-<kind>` for a friend,
  `date-<kind>` for a sweetheart or a spouse, `dinner-in-town` and `a-night-in` for the two of their own; in its own
  outfit when it names one, else the moment's (a picnic's garden party dress, the dinner dress, pajamas, the kimono on
  festival night; else the day's season). Its choices are wording only, and Skip goes on to the card.
- **Her favourite kind** is the date game her bible's beats use most; **walk** on a tie at the top, or with no date beats
  (or no bible). It pays ×1.5 and it's what her invitations ask for. Festival night is never her favourite.

The kinds, the rung that opens each, and how each plays:

<!-- live:evening-kinds -->
| Kind | As a hangout | As a date | Plays as | Her scene | Offered | Her invitation |
|---|---|---|---|---|---|---|
| Morning walk | F3 | R1 | Walk | `hangout-morning-walk`, `date-morning-walk` | Yes | — (never asked for) |
| Breakfast together | F3 | R1 | Pick | `hangout-breakfast`, `date-breakfast` | Yes | — (never asked for) |
| Tea by the pond | F3 | R1 | Pick | `hangout-tea-by-the-pond`, `date-tea-by-the-pond` | Yes | — (never asked for) |
| Flower market | F3 | R1 | Pick | `hangout-flower-market`, `date-flower-market` | Yes | — (never asked for) |
| Sunrise sketch | F3 | R1 | Rhythm with your hands | `hangout-sunrise-sketch`, `date-sunrise-sketch` | Yes | — (never asked for) |
| Bakery stop | F3 | R1 | Pick | `hangout-bakery-stop`, `date-bakery-stop` | Yes | — (never asked for) |
| Walk at dusk | F3 | R1 | Walk | `hangout-walk`, `date-walk` | Yes | “Walk at dusk tonight?” |
| Fishing at the Pond | F3 | R1 | Cast | `hangout-fishing`, `date-fishing` | Yes | “Fishing tonight?” |
| A picnic | F3 | R1 | Pick | `hangout-picnic`, `date-picnic` (`picnic`) | Yes | “A picnic tonight?” |
| The market in town | F3 | R1 | Pick | `hangout-market`, `date-market` | Yes | “The market in town tonight?” |
| Cooking together | F3 | R1 | Rhythm with the pot (the fallback until its game ships) | `hangout-cooking`, `date-cooking` | Not yet: waits for the Kitchen | “Cook with me tonight?” |
| Crafting | — | R1 | Rhythm with your hands | `date-crafting` | Yes | “Make something with me tonight?” |
| Stargazing at the overlook | — | R3 | Pick | `date-stargazing` | Yes | “Stargazing tonight?” |
| Dinner in town | — | R3 | Pick | `dinner-in-town` (`dinner`) | Yes | — (no one’s favourite) |
| Dancing | — | R6 | Rhythm with her step | `date-dance` | Yes | “Dance with me tonight?” |
| A boat on the lake | — | R6 | Rhythm with the oar | `date-boat` | Yes | “A boat on the lake tonight?” |
| A night in | — | R6 | Pick | `a-night-in` (`night-in`) | Yes | — (no one’s favourite) |
| A footrace | — | R9 | Rhythm with the track (the fallback until its game ships) | `date-footrace` | Not yet: waits for the footrace | “Race me tonight?” |
| Festival night | Festival days, F3 | Festival days, R1 | Walk, at the festival ground | `hangout-festival`, `date-festival` (`festival-night`) | Yes | — (never asked for) |

Who: a hangout from Friendship 3 (her confession’s wait and Romance 0 included), a date from Romance 1 (the proposal’s and the wedding’s waits included), and every kind her ladders opened with a spouse (“An evening at home”); she must be in front of you: home on the farm (a spouse in her room), a farmhand there on her farm day, or out in town today with you there. Each takes 2 of the day’s actions. The stand-in’s favourite kinds: 9000001 stargazing, 9000002 walk, 9000003 walk.
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
| A festival day (Spring 19, Summer 21, Autumn 22, Winter 12, Winter 28) | As any day | 1 more, its own slot: only festival night fills it | As any day |

An invitation’s draw: `draw(uid, day, 'invite', n)` among the Umas home at Friendship 3+ whose favourite kind is open to them, each weighted 1 + the days since her last evening (or since she arrived), up to 14; a second invitation is never the first’s Uma.
<!-- /live -->

- **The slots:** one evening a day; from 10 married, a second on days divisible by 4. **Festival night** is its own slot
  on a festival day (and on the Festival of Vows), filled only by its kind: a walk at the festival ground with anyone at
  Friendship 3 or more, 2 actions like any evening. An Uma may spend more than one slot in a day; the invitation's +20 comes with her first.
- **Invitations:** each morning one Uma (two from 10 married, never the same one twice) asks you for her favourite kind
  tonight. **Yes, tonight** makes her Tonight's evening (refused once the evening is spent); **Another day** costs
  nothing, and she may ask again another morning. Each is answered once, and yesterday's clear at night.

#### On screen

```
┌──────────────────────────────────────────┐  her profile's Evening ›
│ An evening with Stand-in 2             ✕ │
│ (face) A hangout · Friend · F3           │
│        ✉ She asked you: +20 with the evening
├──────────────────────────────────────────┤
│ [walk] Walk at dusk ★                    │  her favourite, ×1.5
│        Fine +90 · Great +150 · Perfect +225
│ [cast] Fishing at the Pond               │
│        Fine +60 · Great +100 · Perfect +150
│ [pick] A picnic · [pick] The market in town
│ ░ Crafting           At Romance 1        │  greyed: her ladder hasn't opened it
│ ░ Stargazing at the overlook · Dinner in town  At Romance 3
│ ░ Dancing · A boat on the lake · A night in  At Romance 6
│ One evening a day, 2 actions. ★ …        │
└──────────────────────────────────────────┘
```

- **Her kinds sheet:** her role and level, the invitation's +20 when she asked and you said yes, "★ Her birthday: ×1.5
  tonight"; the kinds open to her now in order (festival night last on a festival day), each with its play's mark and her
  three numbers today, ★ and a rose edge on her favourite; then the kinds her ladder hasn't opened, greyed with their
  rung. A tap plays it. Short of the two actions, the open kinds are greyed too ("Takes 2 actions").
- **The play** is the event's play at its evening length (three casts, three rounds of Pick or Rhythm, four forks of
  Walk) on a dusk wash, seeded by the day, her id and the kind. A ✕ leaves it, spending nothing: **nothing is saved until
  it ends.**
- **Her scene** follows the play, over everything, titled with the kind and her name ("Walk at dusk · Stand-in 2"): her
  lines on the dialogue engine, she on the stage throughout; **Skip** goes on to the card. A night in's plays over her
  `night-in` illustration, when she has one.
- **The card:** the kind "with ‹her name›", the grade, the sum ("+150 Perfect × 1.5 her favourite = +225", "+20 for
  saying yes", "= +245 toward Friendship 4 (+40 banked)") and her bar in her ladder's colour, then **Continue**. The
  evening commits once, as the play ends: its two actions, the points, her last evening's day, and the slot spent.
- **Tonight's picker:** the Umas who can spend an evening now (in front of you: on the farm, a farmhand, or one out in
  town where you went today), a yes first, then an unanswered invitation, then the cast's
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
│ ☾ Evening   An evening takes 2 actions   │  (or) short of the actions
│ Tonight with                             │  once anyone is married
│ (face) Stand-in 1 ⌂ Farmhouse · ☕     ◉  │  the pick, else the night's default
│ (face) Stand-in 2 ⌂ Rose Cottage       ○  │
├──────────────────────────────────────────┤
│ 4 actions left · 2 dry                   │
│        [ Back ]   [ End the day ]        │
└──────────────────────────────────────────┘
```

- **Tonight** is End the day's sheet whenever a slot is free and someone can spend it (the day has the two actions), or
  anyone is married (then **Tonight with**, [the night's companion](#the-nights-companion), sits between the evening
  rows and the day's what's-left line). Otherwise the day ends as it
  does without the romance: at once when all is set, or after the one line. Whether Tonight opens is settled once, as the
  sheet opens, so coming back from a played evening shows its row ✓ and never ends the day by itself. **End the day never
  waits on the evening.**
- **The night is a fade:** End the day dims the whole screen to dusk (`#2b3557`, 450 ms), the night runs under it with
  nothing shown, and the morning comes up from it (650 ms); with reduced motion, a plain cut; once married, it comes up on
  the night's companion's greeting (`?life=morning:<id>`), over the morning's card. A failed night lifts it at once and
  says **Try again**.
- **The morning's invitation:** "✉ Stand-in 2: “Walk at dusk tonight?”" with **Yes, tonight** and **Another day**; said
  yes, "Tonight ✓" with **Play ›** (her evening over the morning); declined, "Another day". Her row's ✉ stands while it's
  unanswered, or yes and not yet spent.

### The ring, the wedding, and married life

The proposal needs a ring. The Ring Bench at the Forge opens from Romance 8, independently of the tool workshop. After the wedding comes the
wedding night, then she moves in (the homestead), and married life goes on to the household's finale, with the
household's meals and the night's companion ([the Uma loop](#the-uma-loop)) along the way.

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
 the wedding night (fading to morning) ──► moving in (her room) ──► the Married card
   ▼
 her room at once · that night everyone on the farm is well fed from tomorrow · her ring +1% a grade at her line
```

### The Forge workshop

One farm location has a **Forge workshop** and a **Ring Bench**. Restore the workshop at Farm Rank 3 for
1,000g and 12 logs. It opens the next morning and costs 15g in nightly upkeep once built. The Ring Bench opens after
the first played Romance 8 and uses its own daily allowance. Either counter can open first.

#### Shared tools

The Tool Rack starts with Basic tools. Commission a Fitted copy or upgrade one existing copy. Each installed copy
goes to one worker who uses it during her shift. Umas can still work with Basic tools when all copies are assigned.
You use the best available tool by hand. Older saves keep their farm-wide tiers and any pending legacy order.

One order takes one daytime action, exact materials and a fee. Lower stars are spent first and spending reserved
stock needs approval in the order form. Orders install automatically at dawn. The rack lists crew assignments and
previews what the next copy would change. An Uma’s Abilities page shows the copies she uses or is forecast to use today. Work Calendar includes scheduled deliveries in its forecasts.

| Tier | Farm Rank | Materials per copy | Lead time |
|---|---:|---|---|
| Fitted | 3 | 6 Pine Planks | 1 dawn |
| Iron | 4 | 4 Pine Planks and 2 Iron Ingots for Brush, 3 for Axe and Rod, 4 for Watering Can and Hoe, or 5 for Pick and Hammer | 1 dawn |
| Gold | 6 | 6 Gold Ingots and 4 Iron Ingots | 2 dawns |
| Mythril | 8 | 8 Mythril Ingots and 4 Gold Ingots | 2 dawns |

| Tool | Fitted | Iron | Gold | Mythril |
|---|---:|---:|---:|---:|
| Watering Can, Hoe | 300g | 1,200g | 3,600g | 9,000g |
| Brush | 200g | 800g | 2,400g | 6,000g |
| Axe, Rod | 250g | 1,000g | 3,000g | 7,500g |
| Pick, Hammer | 350g | 1,400g | 4,200g | 10,500g |

| Tool | Fitted | Iron | Gold | Mythril |
|---|---|---|---|---|
| Watering Can | 2 dry tiles | 1 dry row | 2 dry rows | 3 dry rows |
| Hoe | 2 clean tiles | 2 clean tiles | 3 clean tiles | 4 clean tiles |
| Brush | 2 animals cared for | 3 animals | 4 animals | 5 animals |
| Axe | 1 extra log/day | 2/day | 3/day | 4/day |
| Pick | 1 extra ore/day | 2/day | 3/day | 4/day |
| Hammer | 1 extra find/day | 2/day | 3/day | 4/day |
| Rod | 1 extra fish/day | 2/day | 3/day | 4/day |

Tile and animal capacities apply per action on one plot or in one animal home, and crew skill can supply a
higher capacity. The Hoe groups clear ground and adds 0.125 quality and 2 percentage points of seed return per
tier above Basic. The Brush affects care, while feed and collection use their own actions. Gathering charges
are shared between player and crew per copy, with at most one extra item per eligible action. Ordinary seasonal and depth draws still
set item grades. An extra catch or log comes from a full haul. Bonus items use separate rolls and ordinary
work alone supplies challenge and stair credit. Fishing modes apply to extra fish too.

The Mine and Quarry can work reached floors by hand or as a Work order. Earlier floors share the day's
thinning and tool charges with the deepest floor. Stair progress comes from the deepest floor. Forge shortages
link to the right supplier and a proposed exact station target. Confirm that target at the station before it
changes crew refining.

Select an eligible farmhand before the Morning shift to reserve one of her actions for the order. Forging
counts that preparation and pays rank points at night. Practice fittings use an assistant action and two Pine
Planks at Fitted, or one Pine Plank and one of the tier's ingots at Iron or higher. Choose a tier already
installed on a tool. Tempering a tool order is optional. Five short Ready cues and three hits earn a
decorative maker's stamp. Skipping, leaving midway or missing the cues delivers the standard finish on time.

#### Heirloom commissions

The workshop's Heirlooms tab opens at Rank 8 with the Mine, Quarry, Smelter and Cutter built. Select a spouse
and one of her four keepsake slots. An order costs one daytime action and consumes its exact materials and fee.
One commission can run at Rank 8 or 9 and two can run at Rank 10, alongside any tool order or daily wedding ring.
The numbered look has to be in the published wardrobe before ordering. Delivery frees its slot, and the
finished piece waits in her book or the workshop for **Give to her**. Gifting is free and marks the gift date.

| Heirloom | Rank | Materials (any stars) | Fee | Lead time | Look |
|---|---:|---|---:|---|---:|
| Diamond Earrings | 8 | 16 Titanium Ingots, 12 Cut Diamonds, 8 Gold Ingots | 24,000g | 2 dawns | 2 |
| Starstone Necklace | 8 | 24 Mythril Ingots, 16 Cut Starstones, 12 Cut Diamonds | 40,000g | 3 dawns | 3 |
| Orichalcum Bracelet | 10 | 32 Orichalcum Ingots, 20 Cut Philosopher's Stones, 12 Mythril Ingots, 12 Runestone Blocks | 64,000g | 4 dawns | 4 |
| Philosopher's Brooch | 10 | 44 Orichalcum Ingots, 28 Cut Philosopher's Stones, 20 Cut Starstones, 16 Meteorite Blocks | 96,000g | 5 dawns | 5 |

#### The ring bench

The Ring Bench opens on the dawn after the first Romance 8. The smith supplies two Copper Ingots and one Cut Quartz for the 20,000g standard commission. Pay outright or put 2,000g down and borrow the remaining 18,000g. The financed total is 19,800g. The ring reaches the Warehouse the next dawn. Propose after Romance 10 using the usual calendar and relationship rules. The farmhouse has room for the wedding.

Copper through Orichalcum each have a dedicated item sprite and matching close-up. The Bench preview, morning delivery and proposal picker resolve the same ring ID. Warehouse, shipping and relationship summaries use the small sprite.

The bench's rule, in full:

<!-- live:bench-recipe -->
| Ring | Farm Rank | Materials | Fee | Delivery |
|---|---|---|---|---|
| Copper Ring | 1 | 2 Copper Ingot + 1 Cut Quartz (provided by smith) | 20,000g | Next dawn |
| Tin Ring | 4 | 2 Tin Ingot + 1 Cut Amethyst | 25,000g | Next dawn |
| Iron Ring | 4 | 2 Iron Ingot + 1 Cut Citrine | 30,000g | Next dawn |
| Silver Ring | 5 | 2 Silver Ingot + 1 Cut Garnet | 38,000g | Next dawn |
| Cobalt Ring | 6 | 2 Cobalt Ingot + 1 Cut Emerald | 48,000g | Next dawn |
| Gold Ring | 7 | 2 Gold Ingot + 1 Cut Sapphire | 60,000g | Next dawn |
| Platinum Ring | 8 | 2 Platinum Ingot + 1 Cut Ruby | 75,000g | Next dawn |
| Titanium Ring | 8 | 2 Titanium Ingot + 1 Cut Diamond | 90,000g | Next dawn |
| Mythril Ring | 9 | 12 Mythril Ingot + 8 Cut Starstone | 100,000g | 2 dawns |
| Orichalcum Ring | 10 | 12 Orichalcum Ingot + 8 Cut Philosopher's Stone | 120,000g | 2 dawns |

The Copper Ring can be financed with 2,000g down. The Ring Bench accepts one pending order independently of the tool and heirloom counters.
<!-- /live -->

- **On the map**, open the Forge and choose **Ring Bench**. Select the grade to see the exact metal and gem, cost, and delivery date. The smith’s introduction plays once when the bench opens.
- **Premium commissions** need the Smelter and Cutter and the exact listed materials. They keep the usual ring bonus of +1% per grade at her line, inside her existing cap. The grade-9 Mythril Ring fee is 100,000g and the grade-10 Orichalcum Ring fee is 120,000g.
- **An order** uses the bench allowance for the day and stays on the bench until its delivery dawn. Paid workshop tool and heirloom orders follow their own schedules. Rings already owned or equipped and weddings already scheduled carry forward.

#### The rings

The ten rings, one a grade:

<!-- live:rings -->
| Grade | Ring | Id | ★1 sale | ★5 sale | Her bonus once married |
|---|---|---|---|---|---|
| G1 | Copper Ring | `ring-g1` | 205g | 410g | +1% |
| G2 | Tin Ring | `ring-g2` | 275g | 550g | +2% |
| G3 | Iron Ring | `ring-g3` | 340g | 680g | +3% |
| G4 | Silver Ring | `ring-g4` | 450g | 900g | +4% |
| G5 | Cobalt Ring | `ring-g5` | 580g | 1,160g | +5% |
| G6 | Gold Ring | `ring-g6` | 745g | 1,490g | +6% |
| G7 | Platinum Ring | `ring-g7` | 950g | 1,900g | +7% |
| G8 | Titanium Ring | `ring-g8` | 1,220g | 2,440g | +8% |
| G9 | Mythril Ring | `ring-g9` | 1,555g | 3,110g | +9% |
| G10 | Orichalcum Ring | `ring-g10` | 2,025g | 4,050g | +10% |
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
- **The guests** are every spouse on the farm, in her room (the cast's order), then her two closest friends among
  everyone you've met, wherever they live: where an Uma is never gates an occasion. Their faces
  line the top, they have no lines, and one line of narration comes first ("Stand-in 2 and Stand-in 3 came, in their
  best."; with none, "Just the two of you, and the whole farm quiet around you.").
- **The vows** are its last choice point, paying as any choice. Your words and the place are kept as flags for later
  wording.
- **Then the reception:** pick a dish from the Warehouse (the most well-fed days first); only with no dish held does
  the town's bakery send a cake. The dish is used. What it feeds:

<!-- live:reception -->
| The reception | Well fed from tomorrow, everyone who lives on the farm (the spouses in their rooms) |
|---|---|
| A ★1 dish | 1 day |
| A ★2 dish | 1 day |
| A ★3 dish | 2 days |
| A ★4 dish | 2 days |
| A ★5 dish | 3 days |
| No dish in the Warehouse: the town’s bakery sends a cake | 1 day (a Rough meal) |

A meal already running is never shortened. **The guests:** every spouse on the farm (in her room), then her 2 closest friends among everyone you’ve met, wherever they live (by bond); they have no lines. **The places:** her bible’s `wedding.places`, else her wedding beat’s place and `chapel-bell`, `fields`, `overlook`, `orchard-bench`, three different. **Household milestones** at 5, 10, 15, 20 married.
<!-- /live -->

- **She becomes your spouse** at Spouse 0, her wedding day noted (her anniversaries follow a year on), and takes **her
  room** at once (see Rooms and moves, below). That night everyone on the farm is well fed from tomorrow; two weddings
  in one day feed the farm by the longer reception.
- **The words** of the bench, the proposal and the wedding say spouse, partner, vows, your wedding and you; the
  protagonist is a man, so a line may say the groom.
- **With her illustrations** the wedding plays over its picture, `wedding`, from the guests' line to the vows' answer
  (the place card and the guests' faces give way to it).
- **The wedding night** follows the wedding's card, before the Married stage-up: her route's `wedding-night`, else the
  default story's, in the wedding night outfit, tender and fading to morning. It pays nothing and saves nothing. With
  her illustrations it opens on `wedding-night`, and `wedding-night-end` comes up as it fades, after its last choice.
- **Moving in** follows it, the morning after, before the Married stage-up: her route's `moving-in`, else the default
  story's ("A cart of her things rolls up the lane to the farm."), titled "Moving in · ‹her name›", as she moves to the
  farm: into the room she took at the wedding, in your home or a house built for her (rooms and moves below). One with
  no room free waits for one and moves in the morning a room is free; that morning's "⌂ ‹her name› moved into ‹house›"
  (**Play**) plays her moving in. It pays nothing and saves nothing; Skip ends it. Living on the farm, she's in the
  night's upkeep as a resident (10g a night, [upkeep](#upkeep)), from the night she has her room; waiting for one, she
  lives in town and costs nothing.

#### The homestead

Behind the yard the map grows the homestead: **the Farmhouse,** your own home with two rooms, from day 1, and **six
houses** you build, name and extend.

<!-- live:houses -->
|  | Rooms | Build | Extend | Opens |
|---|---|---|---|---|
| The Farmhouse | 2 plus residence wings as needed | — | — | Day 1 |
| House 1 | 2, or 4 extended | 8,000g | 4,000g | The first wedding |
| House 2 | 2, or 4 extended | 20,000g | 10,000g | The second wedding, House 1 built |
| House 3 | 2, or 4 extended | 40,000g | 20,000g | The third wedding, House 2 built |
| House 4 | 2, or 4 extended | 70,000g | 35,000g | The fourth wedding, House 3 built |
| House 5 | 2, or 4 extended | 110,000g | 55,000g | The fifth wedding, House 4 built |
| House 6 | 2, or 4 extended | 160,000g | 80,000g | The sixth wedding, House 5 built |
| **Before wings** | **26 rooms** | **408,000g** | **612,000g extended** |  |
<!-- /live -->

- **House *n* opens to build with the *n*-th wedding,** the one before it standing (they're built in turn). A house **stands at
  once** when bought, named there: 1–20 characters under the farmer's letters rule, a grey "Rose Cottage" placeholder, no
  two alike. **An extension** adds two rooms at once for half the house's price. The Farmhouse keeps its name and
  gains five-room residence wings automatically whenever the household runs out of rooms. Morning perks and
  shared-house bonds apply within a wing. Rooms already assigned to cottages keep their house.
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
- **A spouse waiting for a room on an older save** keeps her town schedule and farm shifts. The next morning,
  waiting spouses take rooms in wedding order. The Farmhouse adds a wing if necessary. The morning reports each
  move, and you can also move her into a free room from the Homestead sheet.
- **Moves are at once and free,** any time: on the homestead's sheet tap a face, then a free room in another house (a
  move) or another house's face (a swap).
- **A spouse in her room lives on the farm.** She keeps her weekly town and farm shifts. She returns to the
  household for meals, evenings and the night's companion routine.
- **Her own house:** an own-house wisher is happiest alone in a house; while she shares or waits her profile says, softly,
  **"She'd love her own house"**. Nothing is lost while she waits.

#### The night's house and its morning

- **Tonight's house is the night's companion's** (Tonight, once anyone is married, so Tonight then opens every night):
  **Tonight with** picks a spouse with a room, and her house is tonight's ([the night's
  companion](#the-nights-companion)). Each row shows her house, **☕** when a resident at Spouse 1+ would serve breakfast
  there tomorrow (someone's meal ends tonight and no reception is coming), and the nights since ("9 nights") for a house
  you haven't slept in for 8 nights or more. Without a pick the night takes **the house slept in least lately** (one
  never slept in first; ties the lower number; with no one housed, the Farmhouse) and its resident who's been your
  companion least lately. On a **birthday-alone** wisher's birthday her row is **"Her room"** ("her birthday, just you
  two"): picked, her morning is hers alone. A tap picks her at once; End the day never waits on it. The morning's "misses
  you" **Tonight ›** picks a house (its resident who's been your companion least lately goes with it).
- **That night**, before the bin, the house and the companion are noted (the house's night slept, her `night`) and the
  picks clear for tomorrow. In the morning she greets you. Later in the night each
  pair sharing a house earns **+10 bond**, and a spouse at Spouse 1 or 3 whose 600 is full reaches **Spouse 2 or 4,** with
  no Ready event (Spouse 2 starts her every-2nd-morning count); the morning's line plays its scene, then its card.
  Spouse 3 and 5 are always events.
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
| Shared houses or wings | Every night, +10 bond to each pair sharing a house or Farmhouse wing (step 6) |
| The Festival of Vows | The Greater Festival’s scheduled day each year after it has been held. Every spouse +50 and a festival night |
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

The married count opens the household's milestones. The morning reports the first wedding and every five spouses.
The crew's two +5% item bonuses and the extra evening use the live married count. The People header shows the count.

<!-- live:household-milestones -->
| Married | Opens |
|---|---|
| 1 | The homestead, night visits, the night’s companion, household meals and anniversaries |
| 5 | Welcome to the Homestead, the five-piece furniture set and +5% items crew-wide |
| 10 | Supper for Ten, two evenings every fourth day and two invitations a morning |
| 15 | At the Hearth and +5% more items crew-wide |
| 20 | The Great Harvest and its dance |
| 25, 30, 35, 40, 45 | Market Evening, Lanterns at the Dock, A Garden Walk, A Homecoming and Setting the Tables |
| 50 | The Fiftieth Wedding closing celebration and Greater Festival preparations |
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

#### Celebrations and the Greater Festival

- Every fifth wedding through 50 gives the newest five spouses a scene and a shared Library memory. Earlier
  celebrations are Ready the following morning and stay Ready until played. The Homestead lists each date,
  and the Diary replays completed celebrations. Wedding order freezes the cast even when you play after more
  weddings. On older saves, same-day weddings without a recorded order use the roster join date and stable ID.
- **The Fiftieth Wedding is the soft ending.** Play it from the wedding card on the day of the 50th marriage,
  including Winter 12. It recalls discoveries, farm milestones and the crew. You can keep playing on the same
  save. New release cast in `world.json`'s `expansionCast` becomes available after the closing scene.
- **The Greater Festival is on the same calendar date the year after the 50th marriage.** The Calendar keeps its scheduled
  date if you hold the ceremony later. All 50 have a place in the festival, represented in ten groups.
  Select a tradition from a completed celebration or contribute one exact-grade item per 30-day preparation
  window. A pledge credits the farmhand or expedition party that delivers the selected item. The festival stays
  available with any number of contributions. Contributors earn a keepsake entry in their Library.
- **The Festival of Vows** then returns on the Greater Festival's scheduled date in future years. Every spouse
  earns +50 on her spouse bar and the evening gains a festival-night slot. Older saves retain the original
  Great Harvest memory and their old annual date until they hold the Greater Festival.

#### Greater Love and True Love

Open **Night visits** from Tonight or the Homestead. The farm has five free visits per night. Each completed
visit plays a sitting conversation, a quiet bedside scene and a farewell, then adds one Greater Love point.
On the fifth visit, choose **Stay the night** for one more point the next morning. The spouse has to remain
home and be the overnight companion. Expedition absences and birthday-alone wishes affect eligibility.
Regular evenings keep their own costs and slots.

| Wardrobe | Greater Love points for each look |
|---|---|
| Pajamas | 0, 6, 14, 24, 36, 48, 60, 75, 90, 105 |
| Birthday and anniversary outfits | 0, 24, 48, 72, 96, plus the corresponding heirloom for looks 2–5 |

Each wardrobe rotates in order through its unlocked looks. Birthdays and anniversaries share the formal wardrobe
cursor. The formal baseline comes with marriage. Looks 2 through 5 each need the matching gifted heirloom
and its Greater Love threshold. Choose an eligible formal look when you start an occasion, or use the automatic
rotation. Existing saves retain earlier unlocked looks. The recorded visit preserves the look used in replay. A birthday visit opens on the spouse's birthday once per farm year. Anniversary night opens after a full
farm year and can be played later for the most recent anniversary. If both fall on the same date, each can be played
once and uses one visit slot. Their default scene beats use neutral, tender and loving. A story can choose the
expression for each beat. Numbered portraits load by slot, with the standard pajamas or wedding-night portrait as
fallback. A published pajama look can show a couch and a bedside splash. Birthdays and anniversaries share a formal
bedside splash for the host. Each illustration joins the Scene Gallery when it first appears. Married Life in the Uma
Library shows the looks, earned memories and True Love date. A pajama duo visit has a shared couch conversation, followed by one of two bedtime sequences at random.
Lying down leads to a goodnight kiss. Kneeling leads to a crawling goodnight kiss. Each illustration is earned in both books,
and replay remembers the couch and the selected sequence.
Each shared illustration joins both books when it appears. Replays keep their recorded sequence. Both books and the Diary can replay a shared visit and
its morning after a stay. Replays keep the original participants, host and numbered looks. They cost no slots and grant
no relationship points or visit rewards.

**True Love** is 120 points. Both spouses need True Love, their own rooms and to be home before a duo can visit.
Their Relationship pages show their partners and what still holds a pairing back. The Duo editor starts with the story
roster. Editing creates a custom list of mutual pairs, with up to three partners per Uma. Even an empty custom list
stays in effect until you choose **Use story duos**, which keeps all earned memories and progress.

An eligible duo can share a pajama visit, a birthday, an anniversary or a regular evening. Casual visits play the
pair’s own lines in speaker order. A shared occasion uses one slot, with the celebrant first in her formal look and her
own dialogue. Her guest wears pajamas and keeps her own occasion offer. A spouse who wants a private birthday
can still celebrate solo. A shared evening keeps its original play and payment.

#### Bonds and ties

Each pair of Umas on the farm holds **bond points**, whole, that **never fall.** They grow when two share a place, five
**bond hearts** come at fixed thresholds, the authored ties **seed** them, and each new heart opens the pair's
**conversation**. Farmhands who work the same place the same day build theirs at night; the ties' seeds and shared
houses build the rest.

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
| An expedition party, a day away | +15 a pair | `addBond`, paid on the party’s return |
| A festival team | +20 a pair | `addBond`, from the festivals (not built yet) |
| The same staff meal, or the same breakfast | +5 a pair | `addBond`: breakfast at a house’s morning; the staff meal once the Kitchen is built |
| The same house, a night | +10 a pair | `shareTheHouses`, night step 6 |
| **Romance 4:** her bond with her closest friend | ×1.5 on any of these, once (never ×2.25 when both qualify) | `bondFactor`, in `addBond` |
<!-- /live -->

- **The same place the same day:** every pair among the Umas who worked one place today earns +10, once a night (a
  running job, or the Fields' tenders with a growing block, who count as one place). **×1.5** when both have the same
  favourite line and it's that place's (two foragers at the forest or the Sawmill, two farmers tending). An Uma works one
  place a day, so a pair earns this once.
- **What pays today:** the same place, the same breakfast and the same house. Expedition parties earn bonds on return.
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
| A work place (gathering, a station) | +10% of her night’s items | Night step 4 (`nightExtras`): copies of the items her work finished tonight, the same goods and stars, `share × n` whole and one more by `draw(uid, day, 'bond:<id>', 0)`, each picked by `draw(…, k)`; into the Warehouse. Her partner worked the same place today |
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
| 0 | **The night's companion**, once married: "☾ Morning with Stand-in 1", with **Play** (her greeting again; it played as the morning came up) |
| 1 | **Ready**, read live: up to three in the People page's order ("● Ready · Stand-in 1 · Friendship 1 · the Fields", with **Play**), then "+2 more" (People filtered on Ready); then the household's Ready offers ("⌂ Household scene 1 · Ready", with **Play**) |
| 2 | This morning's invitations, with **Yes, tonight** and **Another day** |
| 3 | The house's morning ("⌂ Farmhouse · Stand-in 1 · ♥ +30 · ☕ 3 fed · +1 item") with its house line under it; a spouse who moved into a room ("⌂ Stand-in 2 moved into Rose Cottage", with **Play**: her moving in); "‹house› misses you" with **Tonight ›** and **Another night**; morning items ("♥ Stand-in 2 left you ★3 Shiitake"); the night's chores |
| 4 | Birthdays and anniversaries, today's before tomorrow's, birthdays first ("★ Stand-in 1's birthday today", "♥ Stand-in 1's anniversary · ★5 Carrot left for you"); the Festival of Vows |
| 5 | Levels reached overnight ("♥ Stand-in 1 · Spouse 2, reached overnight", **New**, playing her scene, then her card) |
| 6 | The perks' extras ("Perks · +2 items"), then side by side ("Side by side · +3 items"), then each pair's bond hearts |

Within a place the night's order holds, each Uma in the cast's order. The section shows whenever a stored line or a Ready
Uma is there. **There's no pop-up per event:** the morning, her ● Ready chip and **♥ on her pip** wherever the map draws
her are the romance's only signals, and pips stay their places' taps. The household milestones are news in the morning's
section after it.

### Scene links

The players open over any page from a query param, so the game's buttons are links. **A link plays only what the game
has given you:** a typed, bookmarked or stale one (yesterday's morning line, a meal from another day, someone you
haven't met) closes quietly as it opens, with no scene, no pay and no picture in her gallery. Each kind has one pure rule
in `romance/links.ts`, read once as its player opens; the game's own buttons only ever open what these allow, so their
flows are unchanged:

<!-- live:scene-links -->
| Link | Plays | Only when |
|---|---|---|
| `?life=morning:<id>` | The night’s companion greets you | The morning after a night she was your companion (`love.night` is yesterday): that morning only |
| `?life=moving-in:<id>` | Moving in | A spouse with a room, on her wedding day or the morning she moved into a room she waited for |
| `?life=invited-to-work:<id>` | The invitation to work | The day you invited her (`roster[id].farmhand` is today) |
| `?life=breakfast:<id>`, `?life=dinner:<id>` | A meal’s line | That meal cooked today, and she’s a spouse who ate it (or the one whose line it plays) |
| `?life=talk:<id>` | Today’s talk with her: her greeting, then her line or a small talk | You’ve talked with her today (it pays nothing) |
| `?event=<id>` | Her heart event | Ready (`readiness`); with no action left it says so and plays nothing |
| `?ask=<id>` | Ask her | She said “Not yet” at her confession, and you haven’t asked today |
| `?memory=<id>:<rung>` | A Memory, paying nothing | A Memory already played: her meeting scene, or a rung of her route |
| `?evening=<id>` | Her kinds sheet, then the evening | Her evening is open to her now: in front of you (home on the farm, a farmhand there on her farm day, or out in town today with you there), a hangout or a date her ladder opened, a slot free |
| `?evening=pick` | Tonight’s picker | Someone can spend an evening now, and the day has its 2 actions |
| `?occasion=<id>` | An occasion scene | Her next occasion today (the day’s, then a festival’s night), with an Uma you’ve met, not yet played |
| `?household=<id>` | A household scene or the finale | Ready (the night saw its count) and not yet read; with `&replay=1`, once read |
| `?level=<id>:<s2\|s4>` | A spouse level’s scene and card | She’s reached it (it pays nothing) |
<!-- /live -->

- **Read once, as it opens:** a scene that has started plays to its end (the evening's play, scene and card; a meal's
  line) whatever the save says after.
- **The morning's ☾ line** plays her greeting again that morning; the next morning it's gone with the night.
- **Pays nothing either way:** the life scenes, Memories, a night level's and a household replay never pay; a heart
  event, Ask her, an evening and an occasion pay only through their own rules (`playEvent`, `askHer`, `spendEvening`,
  `playOccasion`), which refuse the same things.

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
- a save it can't read (a bad shape, unknown keys, or a version other than v6);
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
| v6 | The farm on the 30-day calendar | The app plays and uploads this version |
| v5 | The same farm on the 12-day calendar | The phone converts it automatically and uploads through the existing revision check |
| v4 | The farm of blocks and Umas' jobs, before the day of actions | **The start-over card,** then a new farm on v6 |
| v1, v2, v3 | Older formats, from before the farm started over the first time | **The start-over card,** then a new farm on v6 |
| Newer than v6 | — | Refused: this build doesn't read it |

- **Why a new version, not a v4 change.** The field's blocks became tiles, the work board's jobs and the stations'
  multi-day jobs became the day's actions and a station's one load, and `today` counts the actions: a played v4 can't
  be read as a tile farm. A new version lets the rules that already guard an older save do the work: the start-over
  card, the safety copy, the server's backup, and an older build refusing a v6 upload.
- **The existing farm is kept.** The owner plays the deployed farm as the real game, so no change starts it over: a new
  field is grown in place (an older save reads it as its default, and `updatedAt` never moves for it), and a change a
  default cannot cover migrates the save as it loads. The start-over card applies to saves from before v5.
- **v5 to v6.** The device keeps the current visible date, elapsed farm turns, spent actions, account timestamps,
  items, and progress. Booked weddings keep their promised dates. Earlier season dates remain readable, and active
  growth, upkeep, jobs, and expeditions keep their remaining turns. The first successful v6 upload backs up the full
  v5 record on the server. A second device keeps its unsynced version in a recovery copy if the calendar has already
  been converted by another device.
- **The start-over card.** When the phone's save, or on a new phone the server's, is older than v5, the opening stops at
  one card: **"Your farm starts over"**, "This version of the game begins a new farm on day 1.", and **Start the new
  farm**. Nothing changes until the button is tapped.
- **The new farm** is day 1 on v6: 500g, 9 Carrot seeds, the field overgrown but for its cleared patch of nine, no
  station loads, ten actions, the Farmhouse, nobody on the roster and the farmer's name empty (the retired Dorm kept in
  its shape: level 1, nobody in it).
  Only the account carries over, its "last changed" time with it, so the farmer's name is the new farm's first change.
  Then the opening runs as on any new farm.
- **v5 reads what v4 grew into:** a save with no `diary.notes` loads with no Town notes unlocked, a morning's "New story
  arrived" line is only on a morning after a new release, her chapter is read from her route, and the save takes
  festival night on any day (once at most) and a festival's news by any festival's id, since the story says which days
  hold one.
- **v5 grows in place with upkeep and loans:** `farm.loans`, `farm.owed`, `farm.short` and `farm.income` are new; a
  save without them reads as no loans, nothing owed and no nights, and the morning's upkeep section (`summary.money`)
  is absent on a morning from before them. Nothing migrates, and `updatedAt` never moves for it.
- **v5 grows in place with food:** `farm.pantry` (the pantry's meals, by the day cooked and their stars) is new; a save
  without it loads with an empty pantry, so a live farm's first night with food buys its takeout. The morning's food
  lines (`pantry`, `takeout`) are two more kinds in `summary.money`, a farmhand's board may hold Cook (`{ kind: 'cook' }`)
  and her practice Cooking (`cook`). Nothing migrates, and `updatedAt` never moves for it.
- **v5 grows in place with the calendar:** `today.occasions` (who played today's occasion scene) is written only once
  one plays, and a save without it has played none; the morning's New Year's and story days' lines are two more kinds of
  news. Nothing migrates, and `updatedAt` never moves for it.
- **v5 grows in place with the Uma loop:** each field is written only once it's used, and a save without it reads as
  before: `roster[id].farmhand` (the day you invited her to work; none, no farmhand), `today.meals` (the household's
  meals cooked today; none, none), `homestead.companion` (tonight's pick; none, the night's default), `love[id].night`
  (the night she was last your companion; none, never) and the morning's "☾ Morning with" line (`morning`); and an
  evening may be Dinner in town (`dinner`) or A night in (`night-in`). Nothing migrates, and `updatedAt` never moves for
  it.
- **v5 keeps the retired Dorm in its shape:** `dorm` and `buildings.dorm` stay, `dorm.home` and `dorm.swaps` are
  cleared as the save loads (everyone who lived there lives in town), a morning's Dorm news is read and dropped, and a
  `dorm:<level>` loan still parses and repays ([the retired Dorm](#the-retired-dorm)). Nothing else changes, and
  `updatedAt` never moves for it.
- **v5 grows in place with the illustrations:** `gallery` (her illustrations seen, by her id: the scenes' ids in the
  order first seen) is new; a save without it has seen none. Nothing migrates, and `updatedAt` never moves for it.
- **v5 grows in place with the farmhands:** `roster[id].tasks` (her board; none, no tasks), `roster[id].practice` (her
  actions by aptitude; none, none) and `today.fed` (the farmhands well fed this morning; none, nobody) are written only
  once used; the morning's farmhand (`farmhand`) and aptitude (`aptitude`) lines are new kinds; and a station's load may
  hold up to 20 (a farmhand's bigger load at her yield). Nothing migrates, and `updatedAt` never moves for it.
- **v5 grows in place with the field's plots:** `fields.plots` (each plot's 40 tiles, plot 1 first) holds the field; a
  save from before plots holds one field's tiles (`fields.tiles`) and reads as plot 1, exactly as it was, tile for tile,
  crops, growth and watering untouched; a farmhand's field task with no `plot` is plot 1's. The save is written with
  `fields.plots` from the player's next change, and nothing moves `updatedAt` for it.
- **v5 grows in place with the farm at scale:** the field holds up to eight plots (`fields.plots`, 1–8); a station's
  loads today are a list, one a level (`loads[station]`, 1–5 loads; a save from before levels holds one load, an object,
  and reads as a list of one), and its level is `buildings[station]` (1–5), a level bought today waiting in
  `farm.builds`; `today.hauls` (each area's, spot's and dig's hauls today) is written once the day's first haul is;
  `farm.market` (each good a flood eased, by its steps) reads as nothing eased when it's missing; a morning's sale may
  say how far it was eased (`summary.bin[].eased`) and a morning's built line a station's new level
  (`summary.news[].level`). Nothing migrates, and `updatedAt` never moves for it.
- **v5 grows in place with the Cooking Contest:** a play at the stove may be the Contest's dish (`play: 'contest'`, a
  menu of one line and one dish, its cook as the assistant), `today.cook` is written only once a cook is chosen, and
  the result is `farm.festivals` and `diary.records['festival:cooking-contest']`, both there since v4. Nothing
  migrates, and `updatedAt` moves only with the player's own entry and play.
- **v5 grows in place with the Kitchen:** `workshops.current` (a play at the stove under way), `today.staff` and
  `today.assistant` are written only once used, and a save without them has none; the Kitchen's level is
  `buildings.kitchen`; a morning's `staff` line is a new kind in `summary.money`, and a farmhand's work line may say
  her action as the Kitchen's assistant (`summary.work[].kitchen`); `love[id].known` may name a dish. A
  play from before the stove (never written) reads as none ([the Kitchen](#the-kitchen)). Nothing migrates, and
  `updatedAt` never moves for it.
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
