# The game's design

Uma Farm is a private landscape farm-life game. You reclaim a farm, meet the retired racers who live in town, and invite them to help. As they build up their skills and take over routine jobs, the farmer can spend more of the day with them. [Game mechanics](../game-mechanics.md) sets out the current rules, costs and unlocks. [Page view](../pages/game-design.html).

## The game in one line

Grow a farm with the Umas you meet in town, then build a life with them as their work frees up yours.

## Pillars

| Pillar | What it means in play |
|---|---|
| Time makes choices matter | Five Morning and five Afternoon actions share the work of the farm and town. Most farm jobs take a regular action. Outings and festival entries have their own costs. |
| A working roster changes the day | The farmer starts by hand. Hired Umas run a morning shift on their farm days. Set orders or let Auto Work cover priority jobs. Aptitudes, tools and available stock affect what a shift accomplishes. |
| Each Uma keeps her own life | The 50 launch Umas share 25 jobs with staggered days off. Scheduled outings read their availability. Moving to the farm after marriage keeps the weekly work schedule. |
| The farm funds its own growth | Rank opens projects. What Next links to the actual materials, stock, crew and cash you need. Food, upkeep and repayments matter. Surplus policies preserve useful stock and ship the rest. |
| Relationships have a history | Each Uma has her own chapters and dates. The Library keeps earned scenes, discoveries and milestones. Birthdays, anniversaries and visiting at night keep married life active. |

## The screens (landscape)

| Screen | What you do there |
|---|---|
| Farm | Open a painted map, choose an HD-2D area, and enter a building or work a plot. Grid mode offers direct tile controls. Work, Work Calendar and What Next are available from the farm. |
| Town | Choose a district and a destination. Use the service, check who is on site, or tap a person's portrait or sprite to open a full-screen conversation. Travel is free. |
| Calendar | Browse 30 days per season in two rows of six. Choose a date to read its events and relevant Umas. The Work Calendar uses the same format for appointments, completed orders and gaps. |
| Uma Library | Sort unlocked books by relationship, cast order or name, or browse by tier. Books open to Relationship and include abilities, scenes, history, discoveries and jewelry. |
| Ledger and Diary | Check stock, cash flow and industry in the Ledger. See dated farm achievements, festival results and household memories in the Diary. |

## A day: limited actions

1. Start Day links to ready Uma scenes and current festivals, with work and settlement results available in its details.
2. Spend the five Morning actions. Before Afternoon, the crew works on crops, animals, cooking, gathering, processing and restocking as assigned.
3. Use the five Afternoon actions on the farm, town, or an available outing. Holidays and birthdays have their own event pools. The calendar and festival agenda show what is available.
4. At Night, spend up to five shared visits with eligible spouses at home, then end the day. Shipping, meals, upkeep and repayments settle overnight.

## The farm loop and economy

Seasonal growing, animal care, fishing, gathering and processing unlock exact grades. The Restaurant turns those discoveries into 120 recipe unlocks across eight stages. Keep dishes for meals, use them in other recipes or sell them. Set up projects as Rank and relationships open them. The mayor shares credit across up to three loans, with partial repayments. The Forge upgrades copies of working tools and crafts four heirlooms, while the Ring Bench handles wedding rings. [Progression and projects](../game-mechanics.md#the-farms-progress) · [Upkeep and loans](../game-mechanics.md#upkeep-and-loans)

## The Uma loop

Meet her in town, build Friendship, and invite her to work when ready. Continue through confession, Romance and proposal, and then choose a wedding date. If an original chapter needs a farm unlock, an alternate can keep the relationship moving. Night visits build Greater Love and unlock numbered looks. At True Love, eligible pairs can share a visit with both voices, and birthdays and anniversaries offer special scenes. The 50th marriage opens the closing celebration. The Greater Festival follows a year later. [Uma loop](../game-mechanics.md#the-uma-loop) · [Married life](../game-mechanics.md#greater-love-and-true-love)

## The dialogue engine and art

The full-screen dialogue engine takes over from maps and rooms. It uses the location backdrop, portrait outfit and expression, or the full-size scene painting for its authored beat. The 50 launch Umas have published art. Gallery cards load small thumbnails and the viewer and replays load the full-size art. Dialogue expressions, gallery scenes and movement wardrobes are separate art sets. See [her look](her-look.md) and [the story pack](../story-pack.md) for authoring.

## Historical studies

The dated reports below record the rules and test results at the time. For current schedules, costs, and views use [Game mechanics](../game-mechanics.md) and the [roadmap](../roadmap.md#where-we-are).

## The farm at scale (2026-11-15)

The owner asked: "when we have 10 Umas, then 20 Umas, then 50 Umas, do all those stages support all Umas fully working?"
**Before F91, no: about 10 to 20 could hold real jobs, and every Uma past that could only gather. Since F91, 10 and 20
are fully in real jobs, and 50 run past the farm's jobs by about ten Umas, the work Phase 2's employers bring**
([the results](#what-f91-found-2026-11-15)).

**What the farm could employ before F91,** fully built (Farm Rank 5 and up), in a farmhand's actions a day:

| Work | Actions a day, new hands | Actions a day, skilled hands | Its limit |
|---|---|---|---|
| The field: 40 tiles (8 × 5), watered daily, planted and harvested as they ripen | about 56 | about 13 (a row watered in one action, two tiles a harvest or a planting) | One field, fixed |
| The animals: up to 16 (8 in the Coop, 8 in the Barn), fed and cared for | about 34 | about 18 | 8 a building, 2 buildings |
| The stations: the Mill, Sawmill, Smokehouse, Smelter and Cutter | 5 | 5 | One load a day each |
| Foraging, chopping, fishing, a mine face | Any number | Any number | **None:** every haul pays, and the bin pays the same however much you ship |

A farmhand brings 3 to 7 actions a day (3, then 4 settled in, 6 married, 7 well fed), about 4 on average.

| Umas | Their actions a day | What happens |
|---|---|---|
| **10** | about 40 | Every one has a real job: the field, the animals, the stations. As their aptitudes grow, the jobs shrink to about 36 actions, and one or two drift to gathering |
| **20** | about 80 | The jobs fill at about 36–95 actions; 10 or more only gather or mine |
| **50** | about 200 | About 40 only gather or mine; gold grows without limit; only 27 can live on the farm (20 Dorm beds, 7 houses), the rest in town |

So the farm must **grow its work with its people**, and **give the people something to cost**. Five levers, each its own
packet or Phase 2 step:

1. **Fields that grow, shown as their own screen** (F89 and F91, built: [the field's screen](../game-mechanics.md#the-fields-screen),
   [the field's plots](../game-mechanics.md#the-fields-plots)). The farm map shows a small field sign; a tap opens the
   field full screen, one plot (8 × 5) a page. The farm starts with one plot and clears more as the Farm Rank rises, up
   to eight (one a rank from 3 to 9, 2,500g to 50,000g): 320 tiles of real work.
2. **Food for everyone: an upkeep felt from day one** (F90, built: [food](../game-mechanics.md#food)). Everyone who eats on the
   farm eats twice a day. Takeout, bought in at night, costs gold for every meal not cooked. Cooking turns the
   Warehouse's goods into meals in batches: the farmer cooks with an action, and an Uma on the Kitchen's task cooks a
   batch that grows with her **Cooking** aptitude, so one cook feeds many. The more Umas live and work on the farm, the
   more meals: the kitchen becomes real jobs.
3. **Work that keeps scale** (F91, built). Each station's level adds a load a day ([its levels](../game-mechanics.md#its-levels)).
   Each gathering area, fishing spot and dig gives four full hauls a day, then thin ones
   ([thin](../game-mechanics.md#thin-four-full-hauls-a-place-a-day)). A good shipped past a crate eases its own price
   for a few days ([the market](../game-mechanics.md#the-market-feels-a-flood)). Gathering stops absorbing endless hands,
   and gold grows with the farm's places, not its people.
4. **Expeditions, the Restaurant and the Forge** (Phase 2.4 and 2.5): parties of four away for days, service staff, a
   smithy's crew. These are the big employers past 20.
5. **The targets,** checked by a simulation at each stage: **10 Umas** in year 1–2, all in real jobs, with one plot or
   two, the ranch and the first stations; **20** in year 2–3, with four plots, the Kitchen, station levels and the
   Mine; **50** in year 4 and after, with eight plots, expeditions, the Restaurant and the Forge, and none idle.

### What F91 found (2026-11-15)

A simulation plays three farms for four years on the game's rules, bringing in 10, 20 and 50 Umas over years 1–4, the
farmhands set by a plain rule (the field, the animals, the stations, the kitchen, then gathering and mining, four full
hauls a place). The full tables are in [the farm at scale](../game-mechanics.md#the-farm-at-scale-10-20-and-50-umas).
In year 4:

| Umas | Their actions a day | In real jobs · idle-ish | Thin or idle actions | Real work still waiting | The bin, the year | Upkeep and takeout | Plots · station levels | Housing (Dorm · in town) |
|---|---|---|---|---|---|---|---|---|
| **10** | 46 | **10 · 0** | 3 | 56 | 495,710g | 18,315g | 2 · 15 | 10 · 0 |
| **20** | 94 | **20 · 0** | 5 | 60 | 874,685g | 28,920g | 4 · 20 | 20 · 0 |
| **50** | 228 | **38 · 11** | 43 | 46 (days the rule can't fit it) | 1,533,260g | 51,075g | 8 · 25 | 20 · 30 |

- **10 and 20 are fully in real jobs,** with work to spare: the farm at 10 keeps two plots, the ranch, the stations and
  the kitchen; at 20, four plots.
- **50 still needs Phase 2:** about ten Umas, some 45 actions a day, only gather where it's thin. Expeditions, the
  Restaurant's service and the Forge's crew are the employers that take them.
- **Two retunes the run showed:** well fed no longer lifts a haul's count (with it, a ★2 meal a night nearly doubled a
  farm's income), and the digs thin as the areas and spots do (before, the surplus at 50 mined without limit: 1.32M of
  a 2.8M year).
- **Gold** grows with the farm's places: upkeep and takeout are a few percent of the bin at every stage, and each farm
  ends year 4 with little left to buy. Phase 2's workshops are what's left to buy and to staff.

## The maps (2026-11-15)

The current navigation design is in [F115](../handoff/tasks/F115-hd2d-map-navigation.md). Phase 3.7 uses painted
landscape overviews for both sides of the road, then lets the player enter the relevant place.

- **Farm** opens to a painted overview with six regions. A region opens a local HD-2D exterior with live farm state.
  A building door opens its interior. An outdoor target opens its activity.
- **Town** opens to F113's painted overview and six district maps. Building doors open illustrated interiors with
  standing residents and the location's services.
- **People** are placed according to current work, shifts, outings and residence. Living lists every farm resident
  under her assigned house, with current whereabouts for those away.
- **Conversation** takes over the full screen when the player taps an available Uma. The existing dialogue engine
  plays its portraits, dialogue and splashes, then returns to the originating place.
