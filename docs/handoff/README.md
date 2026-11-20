# Open work

What's being built right now, and what's waiting on you. Where the game is going is in [the roadmap](../roadmap.md); how
it works today is in [the game mechanics](../game-mechanics.md). The page view is [handoff.html](../pages/handoff.html).

## Now

Town opens for free. The calendar grid swipes between seasons, with day arrows and a separately scrolling
details pane. Optional [Farm guides](../game-mechanics.md#farm-guides) cover the major systems behind info buttons
and in the Menu.

Birthday and anniversary nights use the shared formal wardrobe. The calendar carries the evenly spread birthdays,
travel and crew schedules, and wedding dates chosen after confession. The [approved expression
packet](../design/her-look.md#approved-expression-authoring-packet) covers each face and the review steps for numbered looks.

**The rework is in** (the owner, 2026-11-14; F74–F85): the game plays sideways, a day of ten actions on the tile farm,
the town map where you meet her by introducing yourself, the Uma loop to married life, farmhands and their aptitudes,
upkeep and loans, the calendar, the ranch and the mine, the dialogue engine, the default Uma, and her illustrations.
[The roadmap](../roadmap.md#where-we-are) says what each one is, and [the game mechanics](../game-mechanics.md) how it
plays.

**Your farm is kept from here** (the owner, 2026-11-14): save v5 is the farm you play and keep. A later change grows it
in place or migrates it, never a start-over, and the game has no testing tools: it's the real game, and you only play.

**Tier 1's complete story packs are in** (F87): `pnpm story:scaffold --tier 1` lays out every piece of story the game
reads for each of the Ranker's Tier 1, filled from the default story and marked `"draft": "default"`, and
`pnpm story:status` shows each Uma's pieces, hers, the default and missing; `story:ship`'s check and the Farm Story
Sandbox show the same. [A complete Uma](../story-pack.md#a-complete-uma) is the story session's routine.
**Tier 1 is written whole and live** (2026-11-15): release 8 plays all ten, every piece hers, nothing skipped. Each
writing session ends with [the ship's routine](../story-pack.md#shipping-it): status, ship, confirm, say.

**The real game's fixes are in** (F86): no route dead-ends on a setup, scene links play only what's earned, and
[a route to marriage](../game-mechanics.md#a-route-to-marriage) is simulated.

**She's where you can find her** (F88): only your cast lives in town, with the town's people at their posts. Every Uma
keeps a fixed schedule, hers from the story or the default (her favourite spot every third day), shown on her profile
("Where to find her") and on the calendar's days; nobody appears at random. A farmhand is on the farm on her farm days (F95), you can
ask an Uma you meet in town out for an evening, and every default gift can be had in the first Spring. Faces are
rounded squares cut from her portraits in the season's outfit ([her picture](../game-mechanics.md#her-picture)).

**The field has its own screen, in plots** (F89): the farm map shows the field as a small sign with its counts ("6 to
water · 2 ripe"), and a tap opens the field full screen, one plot of 8 × 5 big tiles a page, with page dots, arrows and
a swipe. Your field is plot 1, exactly as it was. Plot 2 opens at Farm Rank 3: clear it for 2,500g and an action, and
it's yours at once, wild ground with no upkeep. A farmhand's field task names its plot and rows, and each row's tab
shows who works it ([the field's plots](../game-mechanics.md#the-fields-plots),
[the field's screen](../game-mechanics.md#the-fields-screen)).

**Everyone eats, from day one** (F90): the farmer, every spouse in her room and every farmhand on her farm day eat
two meals a night, from the pantry first; what it's short is takeout, 15g a meal, charged with the upkeep, so a new
farm's first morning says "Takeout · 30g". Cook a batch in the farmhouse kitchen (the homestead's sheet, or **Kitchen ›**
in the Book): an action, two goods of food, six meals that keep three days, 90g of takeout saved. A household meal cooks
a batch too, and a farmhand on **Cook** cooks for everyone, 6 to 12 meals a batch by her new **Cooking**. A ★2+ meal leaves an Uma well
fed. The Book shows tonight's food beside the upkeep ([food](../game-mechanics.md#food), [what food costs, and what
cooking saves](../game-mechanics.md#what-food-costs-and-what-cooking-saves)).

**The farm holds 10 and 20 Umas at work** (F91): the field clears up to eight plots, one a Farm Rank from 3 to 9
(2,500g to 50,000g); a station's level is a load a day, levels 2 to 5 bought at the station from Farm Rank 3 to 6
(2,000g to 20,000g, the level the next morning); each forest area, fishing spot and dig gives four full hauls a day,
then thin ones (half), and its panel says "3 full hauls left", then **Thin · half hauls**; and a good shipped past a
crate of 50 in a night eases −10% a crate, down to half, recovering a step a night: the bin and the Warehouse say
**Eased −20%**. Well fed keeps its extra action but no longer lifts a haul's count. A simulation plays 10, 20 and 50
Umas over four years: on their farm days (F95) two thirds of them are on the farm a day, all in real jobs with real
work still waiting, 50 included ([the farm at scale](../game-mechanics.md#the-farm-at-scale-10-20-and-50-umas),
[thin](../game-mechanics.md#thin-four-full-hauls-a-place-a-day), [the market](../game-mechanics.md#the-market-feels-a-flood),
[a station's levels](../game-mechanics.md#its-levels)).

**The Kitchen cooks** (F92): every batch you cook can be played **at the stove**, from day one: **At the stove · 1**
beside **Cook a batch · 1** in the farmhouse kitchen, a 30-second cooking game of three burners, a ticket rail and the
pass, whose tier makes 6, 8, 9 or 12 meals, a star or two more from Fine. **The Kitchen** stands from Farm Rank 3
(3,000g · 40 logs · 20 vegetables), its levels 6 to 15 dishes a play bought there: once a day, an action and 60 s at the
stove cook a menu of up to three known recipes, with a farmhand as its assistant if you like. Carrot Salad, Carp Grill
and Button Mushroom Soup are known when it stands, the rest of the 80 at the shop's Recipes shelf in town. Dishes don't
ship: **the staff meal** serves tonight's table, a dish for every three mouths, in place of their meals, and leaves
everyone well fed by its stars; dishes are gifts and a wedding's reception too. A play left unfinished counts as Rough
([the Kitchen](../game-mechanics.md#the-kitchen), [the stove](../game-mechanics.md#the-stove-the-cooking-game),
[the staff meal](../game-mechanics.md#the-staff-meal)).

**The first festival you play** (F93): on Autumn 10 (or wherever the story puts it), the Kitchen's card says
**Enter the Cooking Contest · 3**: the day's three event actions, a known recipe and its goods, and a farmhand to cook
with you if you like. You cook one dish live at the stove for 60 seconds; the town's cook tastes it beside the
orchard's and the ranch's, says her piece, and the board goes up: 1st pays 1,800g in year 1 (600g × the season's
number × the year) and 150 Farm Rank points, 2nd half the gold and 75, 3rd a fifth and 25. The rivals grow with your
Farm Rank (58 and 47 at Farm Rank 3, 96 and 96 at 10), so a ★5 dish and your best play are what win late. The morning
says "Cooking Contest tomorrow" and "Cooking Contest today · +3 for events", each a tap to the Kitchen; the Farm Rank
counts the festivals' places, and a 1st counts toward the cook's cooking Legend
([the Cooking Contest](../game-mechanics.md#the-cooking-contest)).

**The whole story plays** (F94): every scene the story writes for a day of the year plays on it, from the calendar, one
action each: New Year's, each festival's day and then its night where one is written (the derby's and the contest's
under the story's own names too), her birthday, her anniversary from the first, and the story's days, the game's own six small days among
them (Blossom viewing on Spring 6 to the sweets day on Winter 8, moved or renamed by `world.json`). A day with several
of hers plays one: her birthday, her anniversary, the festival's day, then a story day. A chat or a talk in town plays
on the dialogue engine: her birthday's greeting on her birthday, else one drawn from the place's, the season's and the
hour's together, then her line or a small talk, your line under your name; a gift gets her own line, her birthday's
first. `pnpm story:status` counts it all (a festival's night only when written), so "complete" means everything the
game plays is hers: Tier 1 reads 10 of 10. All read by id, so a later release plays on publish
([occasion scenes](../game-mechanics.md#occasion-scenes), [talk that knows the
day](../game-mechanics.md#talk-that-knows-the-day), [her occasions](../story-pack.md#her-occasions)).

**The launch cast** (F96): the game's Umas are the Uma Ranker's Tier 1–5, 50 of them (44 characters and 6 sisters).
Only they are in town, on People, met, on the calendar and in the romance; the story's other Umas stay in the pack for
a later release pack, and the town's people keep their posts ([the launch cast](../game-mechanics.md#the-launch-cast)).

**Farm days, and home after the wedding** (F95): nobody lives on the farm until she marries you, and then she has her
room in a house ("Needs a room" in town until one frees). A farmhand comes to work on her farm days, the days her town
life leaves free (eight of each season's twelve on the default schedule): there she's in front of you, works overnight
and eats her two meals, her only cost; on her town days she's at her place in town. Her profile's **Where to find her**
and the Book's work board show her farm days ("In town today · back Spring 5"). The Dorm is retired: its page, its tile,
Invite to the farm, beds, swaps and upkeep are gone, and your farm's Uma in the Dorm lives in town, everything else
kept ([farmhands](../game-mechanics.md#farmhands), [the retired Dorm](../game-mechanics.md#the-retired-dorm)).

**Expeditions are in** (F97). Build the Expedition post in town from Farm Rank 7, then send up to four farmhands to one
of seven regions for two to five days. They bring loot, rank points and bonds home. The morning and the post's log show
the result ([expeditions](../game-mechanics.md#expeditions)).

**The Restaurant is in** (F98). Build at Farm Rank 7, clear eight shifts to open 120 recipes, and learn each
one through the farm's exact ingredient discoveries. Sell cooked dishes, cook with them, or save them for meals.
[The Restaurant](../game-mechanics.md#the-restaurant) records the rules and the roster playthroughs.

The four [Festival ground contests](../game-mechanics.md#festival-contests) are complete (F100). The rules include
the first-year solo playthrough and results from crews of 10, 20 and 50.

**The Uma Library is in** (F101). Its five launch Tier shelves hold two rows of five portrait books each. The books
collect scenes, discoveries and personal histories. Farm-wide achievements are in the Diary.
[Uma Library](../game-mechanics.md#uma-library) has the rules.

## Open packets

| Packet | Work | Status |
|---|---|---|
| [F103](tasks/F103-hd2d-farm.md) | HD-2D farm, starting with the Field and Pond slice | The shared-renderer pilot is implemented. The iPhone measurements and look review are open. |
| [F104](tasks/F104-longer-seasons.md) | 30-day seasons, calendar pacing and whole-farm balance | Draft seasonal schedule, system audit and save conversion scope. The 120-day playthroughs and implementation are open. |

The Forge is [deferred pending a redesign](../roadmap.md#deferred).

The [Phase 3.5 balance trials](../game-mechanics.md#progression-balance-through-farm-rank-10) ran from a solo start
through Farm Rank 10 and one more year. They record staffing, food, bills and exact-grade stock at each roster size.

A packet is written from the roadmap when its step starts, is deleted when it ships, and git keeps the history.

## Standing work

Not packets: each has a standing guide that changes as the game does.

| Work | Who | Its guide |
|---|---|---|
| **The story,** written freely and shipped at the end of every writing session | The story session | [How the story reaches the game](../story-pack.md#how-the-story-reaches-the-game) |
| **The next Umas' art:** portraits, faces and illustrations | ChatGPT (character art) | [The art brief](../design/her-look.md#the-art-brief) |

## Your steps

| What | Where |
|---|---|
| **Look at the field's screen on your phone:** tap the field's sign on the farm, page to plot 2 and back with a swipe, and tell me if the tiles feel big enough | [uma-farm.web.app](https://uma-farm.web.app) |
| **Look at the farm at scale on your phone:** forage the Woods four times and see it go **Thin**; open the Mill and see its level and loads (its next level from Farm Rank 3); ship a crate of 60 of one good and see the bin say **Eased −10%** | [uma-farm.web.app](https://uma-farm.web.app) |
| **Eat on your phone:** read the morning's "Takeout" line, cook a batch on the Farmhouse's sheet, and set a farmhand to Cook on the Book's work board; tell me if takeout bites as it should | [uma-farm.web.app](https://uma-farm.web.app) |
| **Cook at the stove on your phone:** on the Farmhouse's sheet tap **At the stove · 1** and play the 30 seconds held sideways (tell me if the burners and the tickets are big enough for your thumb, and the timing feels fair); once the Farm Rank offers it, build the Kitchen, play its menu, serve the staff meal, and read the next morning's "Staff meal" line | [uma-farm.web.app](https://uma-farm.web.app) |
| **Enter the Cooking Contest on your phone,** on Autumn 10 with the Kitchen built: pick a dish and a cook, play the 60 seconds held sideways, read the cook's judging and the board, and the next morning see the Farm Rank's points; tell me if the rivals feel fair at your Farm Rank | [uma-farm.web.app](https://uma-farm.web.app) |
| **See farm days on your phone:** open the Uma who lived in the Dorm: her profile says **Lives in town** with Where to find her; the farm map has no Dorm. Once you have a farmhand, the Book's work board shows her farm days | [uma-farm.web.app](https://uma-farm.web.app) |
| **Play your farm.** Start the new farm once, on its card when the app opens: it's the last start-over, and the farm it starts is the one you keep. Then play days as they come, and tell me what feels off | [uma-farm.web.app](https://uma-farm.web.app) |
| **Play the whole story on your phone:** on a festival day open the calendar and play an Uma's **Play · 1** twice, her day's scene then its night's; on Spring 6 play her Blossom viewing; Chat with her on her profile and read her greeting and, some days, a small talk with your line under your name; give her a gift and read her own line. Tell me if the greeting and the small talk read right where you are | [uma-farm.web.app](https://uma-farm.web.app) |
| **Meet Tier 1's story on your phone:** open the game and see Account's **Story: Release 8, Nov 15, 2026**; the next morning opens with **New story arrived**. Then play, and meet them as they come | [uma-farm.web.app](https://uma-farm.web.app) |
| **Try an expedition on your phone.** From Farm Rank 7, build the post in town and send a party. Check the away date in People and the work board, then open the return log when they're back. | [uma-farm.web.app](https://uma-farm.web.app) |
| **Write the story and ship it** | [How the story reaches the game](../story-pack.md#how-the-story-reaches-the-game) |
| **The next Umas' art:** hand the art brief to the character art session | [The art brief](../design/her-look.md#the-art-brief), in Uma Character Art |

**What's new to notice** as you play:

- **Sideways:** the bar, the rail and side panels; held upright, it asks you to turn it ([the frame](../game-mechanics.md#the-frame-landscape)).
- **Ten actions a day** on the tile farm: clear, till, plant, water every day, harvest ([a day](../game-mechanics.md#a-day-ten-actions)).
- **The field's own screen:** the field's sign on the farm, then a plot a page, full screen; plots 2 to 8 from Farm Rank 3 to 9 ([the field's screen](../game-mechanics.md#the-fields-screen)).
- **Work at scale:** a station's level and loads, an area or a spot going thin after four hauls, and a good eased after a flood ([thin](../game-mechanics.md#thin-four-full-hauls-a-place-a-day), [the market](../game-mechanics.md#the-market-feels-a-flood)).
- **The town map:** walk between places, see who's there now, and meet whoever you like by introducing yourself ([the town](../game-mechanics.md#the-town)).
- **Her stages,** acquaintance to married: hangouts and dates at two actions, Dinner in town, A night in ([the Uma loop](../game-mechanics.md#the-uma-loop)).
- **Farmhands:** invite a friend to work, set her tasks on the Book's work board, and watch her aptitudes rise; she comes on her farm days ([farmhands](../game-mechanics.md#farmhands)).
- **Home after the wedding:** nobody lives on the farm until she marries you; the Dorm is retired ([the retired Dorm](../game-mechanics.md#the-retired-dorm)).
- **Upkeep and loans:** the Book's money, and the mayor's office in town ([upkeep and loans](../game-mechanics.md#upkeep-and-loans)).
- **Food:** the morning's "Takeout" and "From the pantry", the Farmhouse's kitchen, and Cook on the work board ([food](../game-mechanics.md#food)).
- **The stove and the Kitchen:** At the stove in the Farmhouse's kitchen; the Kitchen from Farm Rank 3, its recipes at the shop, and the staff meal ([the Kitchen](../game-mechanics.md#the-kitchen)).
- **The Cooking Contest:** Autumn 10's card at the Kitchen, one dish live, the cook's judging and the board; the Farm Rank's sheet lists Festivals ([the Cooking Contest](../game-mechanics.md#the-cooking-contest)).
- **The calendar:** tap the date ([the calendar](../game-mechanics.md#the-calendar-screen)); every occasion she has plays from its day ([occasion scenes](../game-mechanics.md#occasion-scenes)).
- **Talk that knows the day:** her greeting, small talk and her own gift lines ([talk that knows the day](../game-mechanics.md#talk-that-knows-the-day)).
- **The ranch and the mine,** once the Farm Rank offers them ([the ranch](../game-mechanics.md#the-ranch), [the Mine and the Quarry](../game-mechanics.md#the-mine-and-the-quarry)).
- **Faces and outfits** that change line by line, and the blank bust for an Uma without art ([the dialogue engine](../game-mechanics.md#the-dialogue-engine)).
- **Her illustrations** at her big moments, and her gallery on her profile ([her illustrations](../game-mechanics.md#her-illustrations)).
- **Married life:** the household's meals, and the night's companion, who greets you in the morning ([married life](../game-mechanics.md#the-households-meals)).

## Across the repos

- **uma-platform** holds the shared pieces: master data, uma-kit, uma-work, uma-server, uma-art, and the HD-2D stage
  `@luismlorenzana/uma-stage`, which the farm no longer uses (its portrait preview retired with landscape). Shared
  changes go there as requests
  ([change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)).
  - **uma-kit's landscape pieces** shipped in uma-kit 0.20.0, and the farm draws its frame with them: the left rail, the
    thin top bar, the wide side panels, Account's two columns and the update prompt clear of the sides. The place map
    that runs across (`HubMap flow="across"`) is there for a map that needs it; the farm's own tile map doesn't.
- **The art split:** ChatGPT draws character art (Uma sprites, poses, busts, portraits, illustrations). Claude draws
  everything else in code (items, UI marks, buildings, the HD-2D kits) in a uma-platform session.
- **uma-quest** shares the story's way of working (the Uma Ranker's cast, tags and ties), read as local files on the
  owner's PC.
- **uma-rpg** is frozen. The farm's v2 save engine was copied from it, never imported.
- **Parcels** to uma-quest, uma-rpg and uma-racer are parked until the farm's own game is done. uma-quest's accept list
  is in [its spec at `a88838b`](https://github.com/luismlorenzana/uma-quest/blob/a88838b/docs/design/spec/05-accept-list.md)
  (its clean slate removed it from `main`).

## How a packet reads

A packet is one piece of work, written from the roadmap when it starts:

- **Why**, and what to read first;
- **Decided**: the calls already made, so the worker doesn't re-decide them;
- **Do**: the steps;
- **Done when**: the checks, including the owner's phone look when there is one;
- **Deliver**: the branch, the pull request, [the game mechanics](../game-mechanics.md) updated for any rule change,
  and the packet deleted.
