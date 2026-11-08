# uma-farm: the farm's own loop

> **Status: 2026-11-08, a draft for the owner's review (D22).** The owner's rework: the farm comes first with **its own
> loop**, and sending items to the other games waits until later. The loop is defined against three references: *Harvest
> Moon: Friends of Mineral Town*, *Rune Factory 4* and *Fantasy Life*. It keeps what the owner wants:
> - farming into selling into progression;
> - many activities: farming, animals, mining, fishing, combat expeditions;
> - ranks in many things, achievements and competitions;
> - a light story with objectives;
> - relationships that grow as characters work together.
>
> It changes one thing on purpose: **no active exploration or real-time combat; a wide roster of Umas dispatched on
> jobs** instead. Calls are **FC1–FC32**, each with a recommendation. Visual page:
> [previews/core-loop.html](previews/core-loop.html).
>
> **It builds on [hd2d-farm.md](hd2d-farm.md)** (FR1–FR24), which the owner accepted whole (D21): the HD-2D engine, Umas
> walking as sprites, taps to assign work, and workshops with genre minigames. **It changes:**
> - [plan.md](plan.md): FM6, FM8, and FM9–FM15 (parcels, now later);
> - [spec.md](spec.md): FS4–FS11 (orders and no currency become selling and gold);
> - FR19: the Restaurant earns gold, and the crew's boost moves to the Kitchen.
>
> Nothing is built or requested before the owner answers.

## The short answer

- **The loop is a farm day:**
  1. plant, tend and assign;
  2. the Umas work while you're away;
  3. collect and ship;
  4. the bin pays at 17:00;
  5. spend the gold on seeds, animals, upgrades, land and beds;
  6. the farm grows, Umas rank up, chapters and festivals come round.
- **Seven activities, all dispatched, none real-time:**
  - farming, the ranch, mining, fishing and foraging;
  - the **workshops**: the Kitchen (cooking), the Restaurant (serving) and the Forge (merge);
  - **expeditions:** parties of three or four Umas sent to a region for hours, resolved by their numbers, with a story log.
- **Many things to rank up:**
  - the farm's Rank;
  - each Uma's rank in each activity, with talents from her own stats;
  - tools and buildings;
  - crop and product quality;
  - animals' affection;
  - bonds between Umas, and your affinity with each Uma.
- **Something always to aim for:**
  - a requests board;
  - a Farm Diary of collections and milestones;
  - a festival every season: crop show, cooking contest, animal show, fishing derby, and a race cup;
  - eight light story chapters, each a short goal list.
- **Relationships grow by working together.** Umas who share a place, a party or a festival team build a bond, and each
  level opens a short conversation between them. You build your own affinity with each Uma by chatting, gifting and
  praising her work.
- **The order:** the loop's rules and screens on today's map first, so it plays soon; the HD-2D farm when the shared
  stage exists (FR2); the other games later.

## 1. The three references

What each does, and what Uma Farm takes, changes or leaves.

### 1.1 Their cores side by side

| Pillar | Friends of Mineral Town | Rune Factory 4 | Fantasy Life |
|---|---|---|---|
| **Core loop** | Grow crops and raise animals, ship them for gold at the day's end, upgrade tools and the house | The same farm loop, plus dungeons that feed forging, cooking and crafting | Pick a "Life" (a class), do its work, rank it up, switch Lives freely |
| **Activities** | Farming, animals, a mine, fishing, foraging, cooking | Farming, monster barns, dungeons with real-time combat, mining, fishing, forging, crafting, cooking, chemistry | Twelve Lives: four fighting, three gathering (mine, wood, fish), five crafting |
| **Time** | A day clock and four 30-day seasons; crops and fish by season | Days and seasons; seasonal festivals | A day-night clock; little seasonal structure |
| **Progression** | Tool tiers (from ore), house upgrades, the shipping log, stamina items | Dozens of skills that each level by being done, crop levels from replanting, town development bought with points | Each Life climbs eight ranks through its masters' challenges; "Bliss" points unlock comforts |
| **Helpers** | The **harvest sprites**: befriend them, then send them to water, harvest or tend the animals | **Tamed monsters** in barns produce items and help on the farm | Friends join your party; no dispatch |
| **Goals** | Few given; self-set targets, the shipping list, the seasons' festivals | Story chapters, a requests board, town orders | Story chapters, Life challenges, requests |
| **Competitions** | A festival calendar: crop and animal shows, a cooking festival, races | Contests at festivals (cooking, fishing, monster shows) | Little |
| **Relationships** | Heart levels with villagers, from talking and gifts; heart events | Friendship from talking, gifts and requests; dates and events | Townsfolk become friends; light |
| **Story** | Minimal: restore the farm | A light main plot in chapters | A light, comic plot in chapters |

### 1.2 What Uma Farm takes, changes and leaves

| From | Uma Farm **takes** | **Changes** | **Leaves** |
|---|---|---|---|
| Friends of Mineral Town | The daily shipping bin and its payout; the season calendar; festivals with shows and contests; helpers sent to do farm chores; animal affection lifting product quality; tool and building upgrades | The helpers are the whole roster of Umas, and the player plants and harvests by tapping instead of walking the field | Stamina and walking the farm in real time |
| Rune Factory 4 | Many skills that level by doing; crop quality that grows; a requests board; contests at festivals; a light chaptered story | Dungeons and combat become **expeditions**: parties dispatched for hours and resolved by numbers | Real-time combat and dungeon exploration |
| Fantasy Life | Ranks per job, earned through challenges; switching freely between jobs; crafting as hands-on play (here, the workshops' minigames, FR17) | Each Uma, not the player, holds the ranks: a roster of specialists instead of one hero | The player-character Lives and party fights |

## 2. The loop (FC1–FC4)

**FC1: a farm day,** about five minutes of taps, then hours of the Umas' work:

```
            ┌───────────────────────────── gold ◄── 17:00 payout ◄── the shipping bin ◄──┐
            ▼                                                                              │
  SPEND: seeds · feed · animals · tool and building upgrades · land · beds · recipes       │
            │                                                                              │
            ▼                                                                              │
  PLAN (taps): plant plots · assign Umas: tend, ranch, mine, fish, forage, cook · send     │
               an expedition party · play a workshop                                       │
            │                                                                              │
            ▼                                                                              │
  WORK (real time, app closed): Umas walk to their jobs; pairs build bonds; ranks grow     │
            │                                                                              │
            ▼                                                                              │
  COLLECT (taps): Ready bubbles · harvests · products · catches · ore · expedition loot ───┘
            │                                                                  (ship, or keep for cooking,
            ▼                                                                   requests and festivals)
  GROW: Farm Rank · Uma ranks · chapters · the Diary · festivals · bonds and conversations
```

**FC2: gold is the farm's currency.** It reverses FS8 ("no currency"), since selling is now the loop. Gold comes from:
- the shipping bin (FC3);
- the requests board (FC20);
- the Restaurant (FC14);
- festival prizes (FC22).

It goes to seeds, feed and animals, upgrades, land, beds for new Umas, recipes and decorations. There are no premium
currencies or purchases.

**FC3: the shipping bin.** Drop anything sellable at any time, and the bin pays once a day at **17:00 local** with a
summary of the day's shipments (Friends of Mineral Town's daily rhythm). Each item has a base price, raised by its
quality (FC10), with this week's season (FC5) lifting some prices.

**FC4: always something to tap.** Planting and harvesting, Ready bubbles, chats with Umas (FC26), the bin and the board
are all taps, as the owner asked (FR9).

## 3. Time (FC5–FC6)

**FC5: one season per real week, a four-week year.** Spring, Summer, Autumn and Winter each last one week. A season
decides:
- which seeds grow;
- which fish bite;
- which festival comes round (FC22);
- which goods are in demand (FC3).

A real week gives a phone game a rhythm you can follow without daily pressure. The farm's calendar shows today, the
season and the next festival.

**FC6: jobs run on real time,** as `uma-work` does today: minutes to hours, finished while the app is closed, collected
on opening. Crops grow over hours, not farm days; a tended plot grows faster (FC8).

## 4. The activities (FC7–FC15)

Every activity is a place on the farm (FR5's map grows into it) with slots for Umas, except planting, the workshops and
expeditions, which are played or sent.

| Activity | Place | You do | Umas do | Comes out | Reference |
|---|---|---|---|---|---|
| **Farming** | Fields: plots in blocks | Buy seeds, tap to plant, tap to harvest | Tend: speed growth, lift quality | Crops, seeds back | Harvest sprites; crop levels |
| **The ranch** | Coop, Barn | Buy animals and feed | Care for them daily: affection | Eggs, milk, wool, by quality | Animal affection |
| **Mining** | The Mine, floor by floor | Pick the floor | Dig: a timed job | Ore, stone, gems | The mine's floors; the Miner Life |
| **Fishing** | Pond, River, then the Sea | Pick the spot | Fish: a timed job | Fish by spot and season | The angler; the fishing derby |
| **Foraging** | Forest, Hills | Pick the area | Gather: a timed job | Lumber, herbs, mushrooms, fruit | Foraging; the Woodcutter Life |
| **Workshops** | Kitchen, Restaurant, Forge | **Play the minigame** (FR17–FR21) | Assist: their rank lifts the yield | Dishes, gold, tools and goods | Cooking and forging, hands-on |
| **Expeditions** | Regions on a map | Pick a region and a party, pack supplies | Go for hours; numbers decide | Monster materials, rare seeds, animals, story items | Dungeons and fighting Lives, as dispatch |

**FC7: the five gathering places carry over** from the copy (F4): Mine, Fields, Forest, Fishery and Monster Den. Each
keeps four slots, a timed job and its queue, Recall and Repeat on `uma-work`. What changes is their content:
- **the farm's own goods** replace uma-rpg's materials and made items (FC31);
- the workbench places become the **workshops** and the stations of each line: a mill for flour, a smokehouse for fish, a
  smelter for ore.

**FC8: farming is hands-on.**
- You tap a plot to plant (a seed from the shop) and tap it to harvest.
- An Uma assigned to a block of plots tends it: it grows faster, and its quality rises with her talent and rank.
- Harvested crops sometimes give seeds back. Replanting your own seeds raises that crop's level over time (Rune Factory's
  idea), so a line of crops gets better the longer you keep it.

**FC9: the ranch.**
- You buy chickens, cows and sheep, and their feed.
- An Uma on the ranch is their carer for the day: her talent and rank, and days in a row with the same carer, lift each
  animal's **affection** from 0 to 10 hearts.
- Affection sets the product's quality. Animals with 10 hearts can enter the animal show (FC22).

This is Friends of Mineral Town's care loop, run by the roster.

**FC10: quality is stars, 1 to 5,** on every crop, product, catch and dish. It comes from:
- the Uma's talent and rank;
- care or tending;
- the crop's level;
- the "well fed" boost (FC15).

A star raises the price (about +25% each) and the score at shows and contests.

**FC11: mining, fishing and foraging go deeper with rank.**
- The Mine has floors, the Fishery new spots and the forest new areas, each opened by its best Uma's rank or by a chapter.
- Deeper means rarer: gems on low floors, sea fish from a boat (an upgrade).

**FC12: expeditions are the combat, without real-time play.**
- You send a party of 3–4 Umas to a region (a ruined fort, a cave, an old racetrack in the hills) for 2–8 hours.
- Its **power** is the party's expedition ranks and their stats against the region's level, plus supplies (dishes from the
  Kitchen, FC14) and duo bonds (FC25).
- The result is a success grade with loot and a short **log** of what happened, written from templates with the Umas'
  names filled in at runtime.
- Failure brings the party home early with a little loot and nothing lost.

Expeditions bring monster materials for the Forge, rare seeds, new animals and story items. A fight scene can come later
(the shared stage could play one back); the numbers decide.

**FC13: the Forge is the merge game** (FR20, the owner's answer). It turns ore, gems and monster materials into:
- **tool upgrades:** a better hoe or watering can for planting; a pick, rod or axe set for each place, lifting all its
  jobs;
- **goods:** jewellery and fittings that sell well.

Fantasy Life's Blacksmith, played as merge.

**FC14: the Kitchen and the Restaurant** (FR18, FR19, amended):
- **the Kitchen's cooking game** turns crops, products and fish into dishes:
  - to sell;
  - to pack as expedition supplies;
  - to enter in the cooking contest;
  - and the **staff meal** (FC15).
- **the Restaurant's serving game earns gold** from guests, for the dishes you serve them. It's the best price for a
  dish, and the Restaurant's tips are its score. **Amends FR19:** the crew's boost moves to the staff meal, because
  selling is now the loop's spine.

**FC15: the staff meal.** Serving the crew a meal from the Kitchen gives them **"well fed": ×1.25 work speed for 4 hours**
(more for higher tiers, FR21). This is FR19's boost kept, now one tap after a cook.

## 5. The roster (FC16–FC19)

**FC16: Umas join the farm over time.** This changes FM6 ("every outfit from day one"):
- **the start:** you pick 3 from a short list;
- **recruiting:** more arrive as the farm grows:
  - beds: the Dorm's upgrades raise how many can live on the farm, 3 → 60;
  - chapters, festivals and requests: each brings a visitor;
  - your **affinity** with a visitor: chat with her and she asks to stay (FC26).

Every outfit on the release can join in the end. A wide roster still matters: a bigger crew runs more places and more
expeditions. Growing it is part of the progression, as the harvest sprites and Rune Factory's monsters were. The
alternative is FM6 as it stands, all 272 at once, with only slots as the limit; it's easier, but the roster stops being
something you build.

**FC17: talents from her stats.** Each Uma has a **talent grade (S to G) in each activity**, read from her master-data
stats by one rule, the same for everyone. It's data, so no names are in git:
- Power → mining and the Forge;
- Stamina → farming and the ranch;
- Wit → cooking, fishing and serving;
- Speed → foraging;
- all five → expeditions.

A talent speeds her work and lifts quality. Her running-style **calling** (FM7, built in F4) stays as her favourite: she
works that line a little happier, bonding faster.

**FC18: ranks per activity, earned by doing.** Each Uma climbs **six ranks in each activity**: Novice, Hand, Skilled,
Expert, Master, Legend. It's Fantasy Life's idea, with the farm's own names, held by each Uma rather than the player:
- **work raises it:** each job adds rank points, as Craft Level does today;
- **a challenge clears it:** each rank-up asks for one (ship 20 crops of 3 stars; reach Mine floor 10; win a contest
  entry).
- **it pays:** a rank is faster work, better quality and deeper places.

Today's single **Craft Level becomes her rank in her calling's line**, so the save carries over (FC31).

**FC19: the roster screens are uma-kit's album,** with talents and ranks as filters and sorts. Each Uma's card shows:
- her ranks and talents;
- her bonds with others;
- your affinity with her;
- her favourite job.

## 6. Goals (FC20–FC24)

**FC20: the requests board.** Townsfolk post requests ("10 eggs, 2 stars or better, by Sunday") at a premium in gold,
sometimes with a recruit, a recipe or an animal. Three to five are open at a time, refreshed daily. This replaces the
spec's game orders (FS4–FS7): the same "something to aim at", from inside the farm.

**FC21: the Farm Diary** is the achievements:
- **collections:** every crop, product, fish, ore, dish and good, each shipped once;
- **milestones:** gold shipped, Umas recruited, ranks reached, contests won;
- **records:** the biggest fish, the best dish score.

Milestones pay gold, decorations, and now and then a recruit.

**FC22: one festival a week,** on Saturday, each season's own, with your entries scored against two rival farms. Rivals'
scores are set by the season and your Farm Rank, so they stay a match:

| Season | Festival | Your entry | Scored by |
|---|---|---|---|
| Spring | **Flower Show** | Your best crop of the season | Its quality and level |
| Summer | **Fishing Derby** | Anglers sent for the derby's 2 hours | The biggest catch |
| Autumn | **Cooking Contest** | A dish cooked live in the Kitchen's game | The dish's quality × the play's score |
| Winter | **Animal Show** | Your best animal | Affection and product quality |
| Every 4th week | **Harvest Cup** | A team of 3 Umas in a short race, run by their stats and bonds | A light race, played back on the stage |

Prizes are gold, decorations, a trophy for the Diary, and often a recruit. The Harvest Cup is a light nod to who the
Umas are; uma-racer stays the racing game.

**FC23: the Farm's Rank,** from gold shipped, the Diary, festivals and chapters, opens:
- land: new plot blocks and new places;
- buildings: the Coop, the Barn, the Dorm's rooms, the Restaurant;
- higher-level regions for expeditions.

It's the farm's own level, shown in the account bar.

**FC24: the story, light and present.** Eight chapters, each a short **goal list** of 3–6 goals with a scene at its start
and end:
- **the premise:** the trainer takes over an overgrown countryside farm where Umas spend their off-season, and brings it
  back to life with them;
- **chapters open the activities** in order: 1 the fields and the bin; 2 the ranch; 3 the mine; 4 the Kitchen and the
  first festival; 5 expeditions; 6 the Restaurant; 7 the Forge and the sea; 8 the Harvest Cup final.
- **the town's cast is original:** the mayor, the shopkeepers, the rival farmers. They aren't Umas, so their lines can live
  in git.
- **Umas appear in roles filled at runtime:** "your first hand", "your best cook", "the Uma you're closest to". Their
  names come from master data and never from git.

## 7. Relationships (FC25–FC27)

**FC25: bonds grow by working together.**
- Two Umas earn bond points when they work the same place at the same time, share an expedition party or a festival
  team, or eat the same staff meal.
- A pair climbs **five hearts**.
- High bonds help: a pair at 3 hearts or more works 10% faster side by side, and on an expedition a pair at 5 hearts has
  a **duo move** that lifts the party's power.

**FC26: your affinity with each Uma,** zero to ten hearts, from three things:
- a daily **chat**: tap her, and she says a line;
- a **gift**: her favourite things follow her talents and calling;
- **praise** after a good job.

Affinity opens her **story beats**, a few short personal scenes written from templates, and it decides when a visitor asks
to stay (FC16). It's Friends of Mineral Town's hearts, aimed at the crew.

**FC27: conversations come from templates.**
- **What a conversation is:** at each bond level a pair has a short exchange of 3–6 lines. It shows as a chat bubble over
  them while they work, and stays in the Diary to reread.
- **How lines are chosen:** each line is chosen by:
  - the place they're at (lines about the mine at the Mine);
  - the bond level;
  - each Uma's temperament, read from her master data (her calling, best distance and top stat).
- **Names:** filled in at runtime.
- **Scale:** this covers any of the tens of thousands of pairs and keeps the rule that no outfit or character names go
  in git.
- **Later, optional:** hand-written scenes for particular pairs would be private content, authored in uma-platform's
  private `content/` like the sprites.

## 8. How the screens hold it (FC28–FC30)

**FC28: the farm map grows** from FR5's rows:

| Row | Places |
|---|---|
| Gathering | Fields, Mine, Forest, Fishery, Monster Den, each with its station |
| The ranch | Coop, Barn |
| Workshops | Kitchen, Restaurant, Forge |
| The yard | The shipping bin, the board, the Dorm, the Warehouse, the Gate |
| The town edge | The shop, the festival ground, the expedition post |

It scrolls up and down as FR6 says. The **calendar and the Farm Rank** sit in the account bar.

**FC29: one tap away.** The bottom bar is Farm · Roster · Diary · Menu:
- the board, the shop and the calendar open from the yard;
- expeditions open from the expedition post.

**FC30: the help is short.** Each place has a help button; chapter goals teach the rest. There's no tutorial wall.

## 9. What changes in what's built and planned (FC31–FC32)

**FC31: the save and rules carry over; the content is re-authored.**

| Piece | Kept | Changed |
|---|---|---|
| `uma-work`, slots, queues, Recall, Repeat (F4) | Yes | — |
| Save sync, revisions, safety copies (F3) | Yes | — |
| The places and the work screens (F5) | Yes | The places' content and names (FC7) |
| uma-rpg's materials and made items (F4, FM8) | Their engine | Replaced by the farm's own goods; uma-rpg's made items return only if parcels do |
| Craft Level (F4) | Her progress | Becomes her rank in her calling's line (FC18) |
| The calling rule (FM7) | Yes | Her favourite line, not her only one (FC17) |
| Every outfit from day one (FM6) | — | Recruitment over time (FC16) |
| No currency (FS8) | — | Gold (FC2) |
| Orders for the games (FS4–FS7) | The idea | The requests board (FC20) |
| Parcels to the games (FM9–FM15, FR23, F10, PO1) | The design, parked | **Later**, once the farm's own loop stands |
| The HD-2D farm (FR1–FR24) | Yes, whole | FR19's boost moves to the staff meal (FC14, FC15) |

A save version with its migration carries today's saves over: Craft Levels become ranks, and the Warehouse's materials
are refunded as gold at their price.

**FC32: the order.** Each step is playable before the next. In order:

1. **M3, the spec:** this doc answered, then F7 rewritten as the core spec with its numbers: prices, times, ranks and
   rewards, worked as the class-progression bar asks.
2. **M4, the loop, on today's map:** fields and planting, the bin and gold, the shop, ranks and talents, the first
   recruits, chapter 1.
3. **M5, more to do:** the ranch, mining floors, fishing spots, foraging, the Kitchen's game and the staff meal,
   expeditions.
4. **M6, the life around it:** the board, the Diary, festivals, bonds and conversations, affinity, chapters 2–8, the
   Restaurant and the Forge's games.
5. **M7, the HD-2D farm** (FR1–FR16), once uma-platform's shared stage exists (FR2). The rules and screens of M4–M6 carry
   over.
6. **Later, the other games:** parcels (F10, PO1), when the owner says so.

The minigames' rules (FR22) and the farm kit's contract (FR16) can start in M4.

## Questions for the owner

Each has a recommended answer; accepting it or changing it is enough.

| # | Question | Recommended |
|---|---|---|
| 1 | Umas join over time (start with 3; beds, chapters, festivals and affinity bring more), instead of all 272 from day one? | **Yes, recruit over time** (FC16) |
| 2 | One season per real week, a four-week year, a festival every Saturday? | **Yes** (FC5, FC22) |
| 3 | A shipping bin that pays daily at 17:00, plus a requests board? | **Yes** (FC3, FC20) |
| 4 | You plant and harvest by tapping; Umas tend, care, dig, fish and forage? | **Yes** (FC8) |
| 5 | Expeditions are dispatched parties resolved by numbers, with a log, and no real-time combat? | **Yes** (FC12) |
| 6 | Each Uma has talents from her stats and six ranks in each activity, earned by doing and a challenge? | **Yes** (FC17, FC18) |
| 7 | Bonds from working together, with conversations written from templates and names filled in at runtime? | **Yes** (FC25, FC27) |
| 8 | Your own affinity with each Uma, from chats, gifts and praise? | **Yes** (FC26) |
| 9 | Eight light chapters, an original town cast, and Umas in roles? | **Yes** (FC24) |
| 10 | The five festivals: Flower Show, Fishing Derby, Cooking Contest, Animal Show, Harvest Cup? | **Yes** (FC22) |
| 11 | The Restaurant earns gold, and the crew's boost becomes the Kitchen's staff meal? | **Yes** (FC14, FC15) |
| 12 | The Forge's merge game makes tool upgrades and goods to sell? | **Yes** (FC13) |
| 13 | Build the loop on today's map first, then move to HD-2D? | **Yes** (FC32) |
| 14 | Park parcels to the other games until the farm's own loop stands? | **Yes** (FC31) |

## Calls

| Id | Call |
|---|---|
| FC1 | The loop is a farm day: plan with taps, Umas work in real time, collect, ship, spend, grow |
| FC2 | Gold is the farm's currency (reverses FS8); no premium currency |
| FC3 | The shipping bin pays once a day at 17:00 local, by price × quality × the season's demand |
| FC4 | Every step is a tap: planting, harvests, bubbles, chats, the bin, the board |
| FC5 | One season per real week, a four-week year; seasons set seeds, fish, festivals and demand |
| FC6 | Jobs run on real time, as `uma-work` does; tending speeds crops |
| FC7 | The five gathering places carry over with the farm's own goods; workbenches become line stations |
| FC8 | You plant and harvest by tapping; tending Umas speed growth and lift quality; replanting raises a crop's level |
| FC9 | The ranch: animals bought, a carer each day, affection 0–10 hearts sets product quality |
| FC10 | Quality is 1–5 stars on everything, from talent, rank, care, crop level and boosts |
| FC11 | Mine floors, fishing spots and forest areas open with rank and chapters |
| FC12 | Expeditions: parties of 3–4 sent for 2–8 h, resolved by power, with a templated log; nothing lost on failure |
| FC13 | The Forge's merge game makes tool upgrades and goods |
| FC14 | The Kitchen cooks for selling, supplies, contests and the staff meal; the Restaurant's game earns gold (amends FR19) |
| FC15 | The staff meal gives "well fed": ×1.25 work speed for 4 h, more for higher tiers |
| FC16 | Umas join over time: 3 to start, more through beds, chapters, festivals, requests and affinity (amends FM6) |
| FC17 | Talents S–G per activity from her stats by one rule; her calling becomes her favourite line |
| FC18 | Six ranks per activity per Uma (Novice to Legend), by work and a challenge; Craft Level becomes her calling's rank |
| FC19 | The roster is uma-kit's album with talents, ranks, bonds and affinity |
| FC20 | A requests board: 3–5 open, daily, for gold, recruits, recipes or animals (replaces FS4–FS7) |
| FC21 | The Farm Diary: collections, milestones, records, with rewards |
| FC22 | A festival every Saturday: Flower Show, Fishing Derby, Cooking Contest, Animal Show, and the Harvest Cup every fourth week |
| FC23 | The Farm's Rank opens land, buildings and expedition regions |
| FC24 | Eight light chapters with goal lists; an original town cast; Umas in roles filled at runtime |
| FC25 | Bonds grow when Umas work, travel or eat together; five hearts; side-by-side speed and duo moves |
| FC26 | Your affinity with each Uma from chats, gifts and praise; it opens her story beats and recruits visitors |
| FC27 | Conversations come from templates chosen by place, bond level and temperament, names filled in at runtime |
| FC28 | The farm map grows: gathering rows, the ranch, workshops, the yard, the town edge |
| FC29 | The bottom bar is Farm, Roster, Diary, Menu |
| FC30 | Short help per place; chapter goals teach |
| FC31 | The save and rules carry over; the content is re-authored; parcels are parked |
| FC32 | The order: M3 the spec, M4 the loop on today's map, M5 more activities, M6 the life around it, M7 HD-2D, then parcels |
