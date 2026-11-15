# Open work

What's being built right now, and what's waiting on you. Where the game is going is in [the roadmap](../roadmap.md); how
it works today is in [the game mechanics](../game-mechanics.md). The page view is [handoff.html](../pages/handoff.html).

## Now

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

**The real game's fixes are in** (F86): no route dead-ends on a setup, scene links play only what's earned, and
[a route to marriage](../game-mechanics.md#a-route-to-marriage) is simulated.

**She's where you can find her** (F88): only your cast lives in town, with the town's people at their posts. Every Uma
keeps a fixed schedule, hers from the story or the default (her favourite spot every third day), shown on her profile
("Where to find her") and on the calendar's days; nobody appears at random. A farmhand is on the farm by day, you can
ask an Uma you meet in town out for an evening, and every default gift can be had in the first Spring. Faces are
rounded squares cut from her portraits in the season's outfit ([her picture](../game-mechanics.md#her-picture)).

**The field has its own screen, in plots** (F89): the farm map shows the field as a small sign with its counts ("6 to
water · 2 ripe"), and a tap opens the field full screen, one plot of 8 × 5 big tiles a page, with page dots, arrows and
a swipe. Your field is plot 1, exactly as it was. Plot 2 opens at Farm Rank 3: clear it for 2,500g and an action, and
it's yours at once, wild ground with no upkeep. A farmhand's field task names its plot and rows, and each row's tab
shows who works it ([the field's plots](../game-mechanics.md#the-fields-plots),
[the field's screen](../game-mechanics.md#the-fields-screen)).

**Everyone eats, from day one** (F90): the farmer, everyone living on the farm and every farmhand who works that day eat
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
Umas over four years: 10 and 20 are fully in real jobs, and 50 run past the farm's jobs by about ten Umas, the work
Phase 2's employers bring ([the farm at scale](../game-mechanics.md#the-farm-at-scale-10-20-and-50-umas),
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

**Next: the sea and expeditions** (Phase 2.4): the Dock's and the Boat's spots; regions, parties and their power,
results and loot, and the log ([the roadmap](../roadmap.md#phase-2-the-whole-farm)). Its packet is written when it starts,
numbered from F94.

## Open packets

None. A packet is written from the roadmap when its step starts, is deleted when it ships, and git keeps the history.

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
| **Play your farm.** Start the new farm once, on its card when the app opens: it's the last start-over, and the farm it starts is the one you keep. Then play days as they come, and tell me what feels off | [uma-farm.web.app](https://uma-farm.web.app) |
| **Write the story and ship it** | [How the story reaches the game](../story-pack.md#how-the-story-reaches-the-game) |
| **The next Umas' art:** hand the art brief to the character art session | [The art brief](../design/her-look.md#the-art-brief), in Uma Character Art |

**What's new to notice** as you play:

- **Sideways:** the bar, the rail and side panels; held upright, it asks you to turn it ([the frame](../game-mechanics.md#the-frame-landscape)).
- **Ten actions a day** on the tile farm: clear, till, plant, water every day, harvest ([a day](../game-mechanics.md#a-day-ten-actions)).
- **The field's own screen:** the field's sign on the farm, then a plot a page, full screen; plots 2 to 8 from Farm Rank 3 to 9 ([the field's screen](../game-mechanics.md#the-fields-screen)).
- **Work at scale:** a station's level and loads, an area or a spot going thin after four hauls, and a good eased after a flood ([thin](../game-mechanics.md#thin-four-full-hauls-a-place-a-day), [the market](../game-mechanics.md#the-market-feels-a-flood)).
- **The town map:** walk between places, see who's there now, and meet whoever you like by introducing yourself ([the town](../game-mechanics.md#the-town)).
- **Her stages,** acquaintance to married: hangouts and dates at two actions, Dinner in town, A night in ([the Uma loop](../game-mechanics.md#the-uma-loop)).
- **Farmhands:** invite a friend to work, set her tasks on the Book's work board, and watch her aptitudes rise ([farmhands](../game-mechanics.md#farmhands)).
- **Upkeep and loans:** the Book's money, and the mayor's office in town ([upkeep and loans](../game-mechanics.md#upkeep-and-loans)).
- **Food:** the morning's "Takeout" and "From the pantry", the Farmhouse's kitchen, and Cook on the work board ([food](../game-mechanics.md#food)).
- **The stove and the Kitchen:** At the stove in the Farmhouse's kitchen; the Kitchen from Farm Rank 3, its recipes at the shop, and the staff meal ([the Kitchen](../game-mechanics.md#the-kitchen)).
- **The Cooking Contest:** Autumn 10's card at the Kitchen, one dish live, the cook's judging and the board; the Farm Rank's sheet lists Festivals ([the Cooking Contest](../game-mechanics.md#the-cooking-contest)).
- **The calendar:** tap the date ([the calendar](../game-mechanics.md#the-calendar-screen)).
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
