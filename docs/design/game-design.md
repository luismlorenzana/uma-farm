# The game's design

**Second pass: the owner's rework (2026-11-14), with the owner's answers folded in, and all built (F74–F85).** What the
farm is to play, rebuilt around the owner's input:
- a landscape game with a farm map and a navigable town;
- a dialogue engine with busts, faces and outfits;
- a day of limited actions, and a farming loop in the spirit of the classic farm-life games;
- Umas who take the farm's work over and get better at it;
- upkeep and loans;
- a calendar you can see;
- the Uma loop from meeting to married life;
- a default Uma, so every character plays fully before her story and art land.

It builds on what exists wherever it can, and says plainly where something is replaced. It names no character and none
of the story's places. How each built system works today is in [the game mechanics](../game-mechanics.md). The page
view is [game-design.html](../pages/game-design.html).

## The game in one line

**You take over a farm gone to weed in a quiet valley. Day by day you work it with your own hands, meet the retired
racers who've made the valley their home, bring them onto the farm, where they take the work over and grow better at
it, and fall in love, until your days belong to the people more than the fields.**

## Pillars

| Pillar | What it means in play |
|---|---|
| **Your day is precious** | A day holds a fixed number of actions. Every farm task and every outing costs one. What you spend them on is the game |
| **From fields to people** | At first you do the farm's work yourself. As Umas join the farm they take it over, and your actions turn to the valley: talks, gifts, hangouts, dates |
| **Practice makes her better** | Every Uma can do every task, and the more she does one the better she gets at it: more yield, better quality, fewer actions |
| **Her life is her own** | Every Uma is a retired racer with a life in town: a place, a part-time job, goals of her own (the story's). The farm is one part of her day |
| **A farm that must pay its way** | Buildings and residents cost upkeep. Loans let you build ahead, and the daily work pays them back |
| **Always complete** | Every Uma plays her whole story from day one, from a default the game provides, replaced piece by piece as her story and art arrive |

## The screens (landscape)

The whole game turns to **landscape**: the phone held sideways.

| Screen | What it is |
|---|---|
| **The farm** | The farm as a map you look across: fields as tiles you till, plant, water and harvest; the coop and barn; the woods' edge and the pond; the mine's mouth; the buildings. Tap a tile or a place to act on it |
| **The town** | A town map you move around: the plaza, the market, the café, the harbour, the library, the hilltop track, and the homes and spots the story adds. Each location shows **who's there now**; tap one to interact |
| **A scene** | The dialogue engine: her bust in the outfit the moment calls for, her face changing line by line, choices at the bottom |
| **The calendar** | The season's days at a glance: festivals, birthdays, her events, with the faces of the Umas who have something that day |
| **The farm's book** | Money, upkeep and loans; the work board; the people; the Diary |

A thin bar is always visible: the day and season, the actions left, and the gold.

**On the look:**
- the farm map starts as a clean, readable tile map, built to be fast and clear for acting on single tiles;
- the HD-2D stage comes later, when uma-platform's new look path reaches the bar the owner wants;
- the old portrait HD-2D preview, and the programmer art drawn for it, retire.

## A day: limited actions

- **The protagonist** (a man, the player's own) has **10 actions a day** to start. More come from the farm's upgrades and
  the household.
- **Free:** looking. The map, the calendar, the book and menus cost nothing.
- **The day ends** when the actions run out or you end it. The night settles everything, as it does today.
- **Special days give extra event actions:** New Year's, the festivals, her birthday. On those days you can play several
  Umas' events past the usual budget, so a holiday's scenes all fit.

**What costs an action** (the owner: "propose everything that takes actions"):

| Where | Action | Cost |
|---|---|---|
| **The fields** | Clear a tile (weeds, a stone, a stump), till it, plant it, water it, harvest it | 1 each |
| | Water a row, once a farmhand or you have the aptitude | 1 |
| **Animals** | Feed, brush or care for one, collect eggs, milk or wool, let them out or bring them in | 1 each |
| | Buy an animal (at the rancher's) | Free, once in town |
| **The woods and the water** | Forage once, chop a log, fish once | 1 each |
| **The mine** | Work a face once; take the stairs | 1 / free |
| **Stations** | Start a load (flour, planks, fillets, ingots, cut gems) | 1 |
| **The bin** | Ship what you choose | 1 |
| **The town** | Go into town | 1 |
| | Shop, order a build, borrow or repay at the mayor's office | Free, once in town |
| **The Umas** | Introduce yourself, talk, give a gift, invite her to work | 1 each |
| | A hangout or a date | 2 |
| | Her event, when it's ready | 1 |
| **A festival** | Join it | 3, and it opens its own events |
| **The household** (married life) | Cook a meal for the household (breakfast or dinner: the farm works better well fed) | 1 |
| | Choose tonight's companion | Free, at the day's end |

## The farm loop

In the spirit of the classic farm-life games, with the owner's additions.

| Area | Your actions | What the day does |
|---|---|---|
| **The fields** | Till a tile, plant seeds, water it (every day), harvest it | Watered crops grow a stage each night; dry ones don't; a season's end withers what's left |
| **Animals** (the coop and the barn) | Feed, brush or care, collect eggs or milk or wool | Cared-for animals grow fond and give better goods; animals left unfed grow unhappy |
| **Fishing** | Cast once at the pond or the bay | The season and the spot decide the catch |
| **Foraging** | Search the woods or the hills once | The season's finds |
| **Mining** | Work a floor's face once; the stairs go deeper | Ore, stone and gems, rarer with depth |
| **Stations** | Process a load: grain to flour, logs to planks, fish to fillets, ore to ingots | Ready the next morning |
| **Shipping** | Put goods in the bin | Paid that night |

**What's built and kept:**
- the crops and their seasons, the prices and stars;
- the forest areas and fishing spots and their finds;
- the stations' recipes, the bin and the night's settling;
- building places by Farm Rank.

**What changes:**
- **the fields** become tiles acted on one at a time, with daily watering, instead of blocks an Uma tends for days;
- **gathering** becomes one action for one haul, instead of jobs that last days;
- **the ranch and the mine,** never built, are built this way.

## Umas at work

- **Inviting her:** once you're friends, you can invite an Uma to work on the farm. She's then a **farmhand**.
- **Her day:**
  - she keeps her own life: her **part-time job** in town (the story says what it is) comes first;
  - then she gives the farm **a few actions a day**, 3 to start, more as she settles in and once you're married;
  - the actions go to the tasks on the **work board**.
- **The work board:** you set each farmhand's tasks: water these tiles, care for the coop, fish, mine. Every Uma can do
  every task.
- **Aptitude:** each task has a level for each Uma that grows with practice. A higher level means more yield, better
  stars, a task done in fewer actions, and new tricks (watering a row at once).
  - **What's kept:** today's talents and rank points become the start: her stats set where each aptitude begins, and
    work raises it.
- **You're freed:** as farmhands take the farm's tasks, the board fills, your own actions turn to the valley, and the
  game becomes about the people.

## The Uma loop

```text
 meet ─► acquaintance ─► friend ─► farmhand ─► sweetheart ─► proposal ─► wedding ─► wedding night ─► moving in ─► married life
         (gifts)         (hangouts) (works the   (dates)                                                 (her room, or
                                    farm)                                                                 a house)
```

| Stage | How you reach it | What it opens |
|---|---|---|
| **Meet** | Introduce yourself to her in town. Every Uma is in town from day one | Talks, and gifts |
| **Acquaintance** | Talks and gifts | Friend gifts move her toward friendship |
| **Friend** | Her friendship grows | Hangouts; her friendship events |
| **Farmhand** | Invite her to work, as a friend | She works the farm part-time; her aptitudes grow |
| **Sweetheart** | Her confession | Dates; her romance events |
| **Proposal** | Her romance at its height, and a ring | The wedding |
| **Wedding**, then **the wedding night** | The day you set | A tender scene that fades to morning |
| **Moving in** | After the wedding | She moves to the farm: your home, or a house built for her |
| **Married life** | Living together | Her married life's events and the household's scenes. More of her actions for the farm. **Cooking meals** for the household. **The night's companion:** each night you choose one Uma to spend it with, tender and never explicit, and she greets you in the morning |

**What's kept:**
- the whole romance: her ladders, points, events and plays, perks, evenings, the ring, the wedding, houses, the
  household, bonds between Umas;
- her chapters, framing her story along these stages.

**What changes:**
- meeting becomes **introducing yourself**, an action in town, with every Uma there from day one. **There's no welcome
  week** (the owner: "I will go to the Umas I want to meet"): nobody comes to the Gate on her own;
- **farmhand** is a new stage between friend and sweetheart;
- the wedding night and moving in become stages of their own.

## The town

- **A town map,** navigable in landscape: walk between locations by tapping them.
- **Who's where:** each Uma has her own place and routine from the story: where she works, where she likes to be, when.
  Each location lists who's there **now**. With no routine written for her, the game places her by today's draw.
- **Tap an Uma** for her menu. Each item costs an action:
  - introduce yourself;
  - talk;
  - give a gift;
  - invite to a hangout or a date;
  - invite to work on the farm;
  - her event, when it's ready.
- **The town's people,** the shopkeepers and the mayor, are at their posts, with their own menus: buy seeds, sell,
  build, borrow.

## The dialogue engine

- **Every scene** (meetings, talks, events, hangouts, dates, festivals, the wedding) plays through one engine:
  - her **bust** in the right outfit;
  - her **face** changing with each line's emote;
  - the speaker's name;
  - **choices**;
  - for some scenes, a backdrop of the place.
- **The art:**
  - three Umas have their portraits: 12 outfits and 15 faces each;
  - each face sits over each outfit's portrait;
  - neutral is the portrait's own face;
  - a face the art hasn't drawn yet shows its nearest one.
- **Outfits by context:** the scene's own outfit when the story names one, else the moment's:
  - work clothes at work;
  - the season's outfit on an ordinary day;
  - the garden party dress at the spring festival, a picnic or a tea;
  - the kimono on festival nights and New Year's;
  - the dinner dress at dinners;
  - the wedding dress, then the wedding night outfit;
  - pajamas at night;
  - the swimsuit at the summer shore.
- **Special events** can set any outfit.
- **Her big moments, full screen:** meeting her, a day at the beach, the confession, the wedding, the wedding night, a
  quiet evening in and the morning after open onto her illustration, the text box over its lower edge. Each one seen
  is kept in a gallery on her profile.

## The economy

- **Income:** the bin's sales each night, and the stations' goods sold.
- **Upkeep:** each building, each Dorm room and each resident costs a little gold each day. The book shows the daily
  total against an average day's income, so the farm has to grow its work to grow its people.
  - **Short of upkeep:** a warning first. Then the farm runs at half pace (fewer actions for farmhands) until it's paid.
    No one leaves, and nothing is lost.
- **Loans:** borrow from the town (the mayor's office) to build a place or a house ahead of the gold. Repaid a little
  each day from the night's income. One loan at a time, then two as the Farm Rank grows; a small fee.
- **Goals:** each loan is a goal: the projects list shows what's owed and when it's clear.

## The calendar

- **Always in reach:** a calendar screen, and the bar's date opens it.
- **Every day shows:**
  - its festival;
  - birthdays;
  - the occasion scenes the story wrote for it (New Year's, the festival nights, the flower show);
  - **the faces of the Umas who have an event that day.**
- **More events:**
  - the story's holidays and customs (the year's first bell, market days, the valley's minor days) from the world file;
  - weather days later.
- **Special days** lift the action budget for events (above).

## The default Uma

Story packs and art will take a long time to land, so every Uma plays fully before hers does:

- **A blank bust and profile:**
  - **the bust:** a soft silhouette of an Uma (ears, hair, shoulders) in each outfit's colours;
  - **the face:** a simple face for each of the 22 expressions;
  - **the profile:** a plain profile card;
  - all drawn by Claude in code, and replaced the moment her art is published.
- **A default story, complete:**
  - talks for every stage, by her temperament;
  - reactions to gifts;
  - hangouts and dates;
  - an event for every step from meeting to married life, the proposal and the wedding night included;
  - festival and birthday scenes;
  - married life's events.

  These are written once for the game, warm and short, with her name, her favourite things and her temperament filled
  in. The protagonist is a man. They're replaced piece by piece as her story pack lands.
- **This builds on what's there:** today's placeholders become this default, much richer.

## Keep, build on, replace

| System today | In the rework |
|---|---|
| The save, sync, the cloud, the story pack and its shipping, the world file | **Kept** |
| Days as turns, the night's settling, the morning summary | **Kept**, with an action budget added |
| Crops, prices, the bin, stations' recipes, forest areas, fishing spots | **Kept** as the farm loop's content |
| The fields' blocks and tending; gathering jobs in days | **Replaced** by tile actions and one-action hauls |
| The work board (jobs by place) | **Built on:** farmhands' tasks with a daily action budget |
| Talents and ranks | **Built on:** they start each aptitude, which grows with practice |
| Building by Farm Rank, the projects list | **Kept**, with loans and upkeep added |
| The town screen and its spots | **Built on:** a navigable town map, routines from the story |
| Meeting by triggers; the welcome week | **Changed:** introductions in town; no welcome week |
| The romance: ladders, events, evenings, perks, the ring, weddings, houses, household | **Kept**, re-staged into the new loop with farmhand, wedding night and moving in |
| Her chapters | **Kept** |
| Busts in scenes; the scene, event and pair players | **Replaced** by the dialogue engine |
| Placeholders | **Built on** into the full default Uma |
| The portrait app layout | **Replaced** by landscape |
| The HD-2D portrait preview and its kit | **Retired**, until the new look path |

## The rework, in order

| Step | What | Why this order |
|---|---|---|
| **1. Landscape** | The app turns sideways: the bar, the screens, sheets and menus | Everything after is drawn in it |
| **2. The dialogue engine** | Busts, faces, outfits by context; the pilot's kits; the blank bust | The art is ready, and every scene runs through it |
| **3. The default Uma** | The full default story and profile | Every Uma plays fully from then on |
| **4. A day of actions, and the farm loop** | The action budget; fields as tiles with watering; one-action fishing and foraging; shipping | The heart of a day |
| **5. The town map** | Locations, who's there now, her menu | Where the people are |
| **6. The Uma loop** | Acquaintance gifts, hangouts, farmhand, the wedding night, moving in | The people's arc |
| **7. Umas at work** | Farmhands' daily actions, the work board, aptitudes | The shift from fields to people |
| **8. The economy** | Upkeep and loans | The farm must pay its way |
| **9. The calendar** | The calendar screen, faces on event days, special days | Seeing the year |
| **10. The ranch and the mine** | Animals and floors in the farm loop's style | The rest of the farm |

**After step 5, a day can be played end to end.** Each step is built, merged and deployed in turn, with a phone check
at steps 2, 4, 5 and 7.

## Settled with the owner (2026-11-14)

1. **The protagonist is a man.** The story's old rule (the farmer never gendered, every line "you") is lifted: lines may
   say he, her husband, the groom. He's still never drawn: the player's eyes.
2. **No welcome week.** You go to the Umas you want to meet; nobody comes to the Gate on her own. The opening ends with
   the farm, not a visitor.
3. **Everything that takes an action** is in the table above, and married life adds cooking meals and the night's
   companion, who greets you in the morning.
4. **The numbers:** 10 actions a day for the protagonist, 3 for a farmhand, more once married, and a little daily upkeep
   per building and resident, all tuned by playing.
5. **The farm map's look:** a clean tile map now, the HD-2D look when uma-platform's look path is ready.

## The farm at scale (2026-11-15)

The owner asked: "when we have 10 Umas, then 20 Umas, then 50 Umas, do all those stages support all Umas fully working?"
**Today, no: about 10 to 20 can hold real jobs, and every Uma past that can only gather.**

**What the farm can employ today,** fully built (Farm Rank 5 and up), in a farmhand's actions a day:

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

1. **Fields that grow, shown as their own screen** (F89, built: [the field's screen](../game-mechanics.md#the-fields-screen)).
   The farm map shows a small field sign; a tap opens the field full screen, one plot (8 × 5) a page. The farm starts
   with one plot and clears more as the Farm Rank rises (plot 2 at Farm Rank 3 today; F91 takes it up to eight): up to
   320 tiles of real work.
2. **Food for everyone: an upkeep felt from day one** (F90, built: [food](../game-mechanics.md#food)). Everyone who eats on the
   farm eats twice a day. Takeout, bought in at night, costs gold for every meal not cooked. Cooking turns the
   Warehouse's goods into meals in batches: the farmer cooks with an action, and an Uma on the Kitchen's task cooks a
   batch that grows with her **Cooking** aptitude, so one cook feeds many. The more Umas live and work on the farm, the
   more meals: the kitchen becomes real jobs.
3. **Work that keeps scale** ([F91](../handoff/tasks/F91-work-at-scale.md)). Each station's level adds a load a day.
   Each gathering area and fishing spot gives full hauls a few times a day, then thin ones. A good shipped by the crate
   eases its own price for a few days. Gathering stops absorbing endless hands, and gold stops running away.
4. **Expeditions, the Restaurant and the Forge** (Phase 2.4 and 2.5): parties of four away for days, service staff, a
   smithy's crew. These are the big employers past 20.
5. **The targets,** checked by a simulation at each stage: **10 Umas** in year 1–2, all in real jobs, with one plot or
   two, the ranch and the first stations; **20** in year 2–3, with four plots, the Kitchen, station levels and the
   Mine; **50** in year 4 and after, with eight plots, expeditions, the Restaurant and the Forge, and none idle.

## The maps (2026-11-15)

The owner asked for a real hand-drawn town map and farm map with clickable places. **Not planned until now:** the town
is a list of places, and the farm is a clean tile map. The plan, as Phase 3's step 3.7:

- **Two painted maps, landscape:** the town (Willowmere, its six spots, its shops and offices, the homes the story
  names) and the farm (its buildings, fields, woods, pond and mine), each one large painting, panned when it's wider
  than the screen, tinted by season and time of day.
- **Clickable places** are data, not drawing: each place is a shape over the painting (a polygon in the map's pixels),
  with its name, its badge for who's there, and its page. A new building appears as its own painted piece placed on
  the farm map, so the farm still grows.
- **Who paints:** under the art split, ChatGPT draws only characters and Claude draws in code, which can't paint. A
  painted map needs the owner's call (below).
