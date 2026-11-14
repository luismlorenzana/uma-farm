# Open work

What's being built right now, and what's waiting on you. Where the game is going is in [the roadmap](../roadmap.md); how
it works today is in [the game mechanics](../game-mechanics.md). The page view is [handoff.html](../pages/handoff.html).

## Now

**The rework** (the owner, 2026-11-14): the game turns landscape, with a day of actions, a farm loop in the classic
farm-life spirit, farmhands who take the work over, a navigable town, the dialogue engine, upkeep and loans, a visible
calendar, and a default Uma. The design is [game-design.md](../design/game-design.md), and the steps are in
[the roadmap](../roadmap.md#the-rework-2026-11-14). Built one at a time, each merged and deployed before the next.
**Landscape (F74) is in:** the app plays sideways, with the bar, the rail and side panels, and the portrait HD-2D
preview is retired. **The dialogue engine (F75) is in:** every scene plays on one engine, the pilot's two Umas show
their portraits from master data, their faces change with each line's emote and their outfits follow the scene
([the dialogue engine](../game-mechanics.md#the-dialogue-engine)). **The default Uma (F76) is in:** every Uma without
portraits plays on the blank bust, a silhouette in the outfit's colours with a face for each of the 22 expressions, and
every Uma without her story plays the complete default story, from meeting her through the wedding night to married
life, each piece replaced the moment hers lands ([what plays without the story](../game-mechanics.md#what-plays-without-the-story)).
**A day of actions (F77) is in:** ten actions a day, the tile farm worked by hand with daily watering,
one-action foraging, chopping and fishing, a station's one load, a crate shipped for one action, and going into town for
the shop; save v5, so a farm from before it starts over. **The calendar (F82) is in:** the bar's date
opens the year on one screen, each day with its festival, New Year's, the story's holidays and minor days, birthdays,
anniversaries and the faces of the Umas with an event that day; her event costs an action, a special day's event
actions first, so several Umas' events fit a festival; and the occasion scenes play on their days (New Year's from the
second year, the Flower Show, the Fishing Derby's night) ([the calendar](../game-mechanics.md#the-calendar-screen)).
**The town map (F78) is in:** a map you walk
around in landscape, who's at each place now (the story's `home`, `job` and `routine`, else the day's draw), the town's
people at their posts, and her menu at the design's costs: introduce yourself, talk and give a gift, an action each, her
evening as built, her event when it's Ready; no welcome week ([the town](../game-mechanics.md#the-town)).
**Upkeep and loans (F81) is in:** each night, after the bin pays, the loans take their share of the
night's income and the upkeep is charged (15g a place or house built, 5g a Dorm bed past the first three, 10g an Uma
living on the farm; a new farm owes nothing); short of it, the rest is owed, the morning warns, and from the second
short night the farmhands work at half pace (a flag F80 reads) until it's paid. The mayor's office in town lends what a
build, a Dorm level or a house is short of gold, ordered in the same tap (a 10% fee, a tenth a night from income, up to
1,000g at Farm Rank 1, two loans from Farm Rank 4). Ordering a build with your own gold stays on its card, free. The
Book shows the upkeep beside the last seven nights' income; the projects list shows each loan and when it clears
([upkeep and loans](../game-mechanics.md#upkeep-and-loans)). A simulated first year pays its way: the Mill early on a
loan, never a short night, a fifth of the income to upkeep.
**The Uma loop (F79) is in:** her stage from acquaintance to married on her profile and her menu (a friend
at Friendship 3, a farmhand once you invite her to work, an action), hangouts and dates at two actions with her scene
after the play, Dinner in town (Romance 3) and A night in (Romance 6), moving in after the wedding night, and married
life's meals (breakfast or dinner, an action each: everyone well fed and +10) and the night's companion, chosen at
Tonight, who greets you in the morning in pajamas. Talks, gifts and the invitation to work need her in front of you: on
the farm, or in town where she is today; her Ready event plays from anywhere ([the Uma
loop](../game-mechanics.md#the-uma-loop)).
**Illustrations (F84) are in:** at her big moments the scene opens onto her illustration, full screen in landscape,
the text box over its lower edge and no bust while it's up: meeting her, a summer date at the shore, her confession
(the question, then her yes), the wedding, the wedding night as it begins and as it fades, a night in, and the morning
after the night's companion; the story can name one with an `illustration` step. Each one seen joins her gallery for
good, which her profile opens; the rest show locked with their titles. The first Uma's nine are master data's (uma-data
1.8.0); an Uma without any plays as before ([her illustrations](../game-mechanics.md#her-illustrations)).

| Piece | Who | State |
|---|---|---|
| [F80](tasks/F80-farmhands.md) **Farmhands** | Claude | Next |
| [F83](tasks/F83-ranch-and-mine.md) **The ranch and the mine** | Claude | After F80 |
| [F69](tasks/F69-bust-art-spec.md) **The bust art**, the next Umas | ChatGPT | The pilot is done; the rest in the Ranker's order |
| [F40](tasks/F40-story-authoring.md) **The story**, and its ship routine | The story session | Release 1 shipped; Release 2 brings `world.json` |

## Open packets

The table above is the queue. A packet is deleted when it ships, and git keeps the history.

## Your steps

| What | Where |
|---|---|
| **The landscape phone check:** open the app sideways and visit every screen; held upright, it asks you to turn it | [uma-farm.web.app](https://uma-farm.web.app) |
| **The dialogue engine's phone check:** meet the pilot's Umas and watch their faces and outfits change | [uma-farm.web.app](https://uma-farm.web.app) |
| **Open the calendar:** tap the date, look across a season and its faces, and on the Flower Show play two Umas' scenes with the festival's event actions | [uma-farm.web.app](https://uma-farm.web.app), and [the calendar](../game-mechanics.md#the-calendar-screen) |
| **Play three days:** start the new farm on the card, clear, till, plant and water, forage and fish, start a load and ship, run out of actions and end the day | [uma-farm.web.app](https://uma-farm.web.app), and [the day's rules](../game-mechanics.md#a-day-ten-actions) |
| **The default Uma's look:** meet an Uma without art and play a talk and an event: the blank bust's faces and the default story | [uma-farm.web.app](https://uma-farm.web.app) |
| **Borrow toward the Mill:** with 20 logs held, go into town, open the mayor's office, tap **Borrow · Build**; end the day and see the Mill stand, then watch the Book's money and the morning's loan line until it clears | [uma-farm.web.app](https://uma-farm.web.app), and [upkeep and loans](../game-mechanics.md#upkeep-and-loans) |
| **Go into town and meet three Umas you choose:** walk between the places, introduce yourself, talk and give a gift, each an action | [uma-farm.web.app](https://uma-farm.web.app), and [the town](../game-mechanics.md#the-town) |
| **Take one Uma to married life:** meet her, befriend her, invite her to work, a hangout and a date (two actions each), Dinner in town; after the wedding, watch the wedding night and moving in, cook a meal, choose tonight's companion and see her greet you in the morning | [uma-farm.web.app](https://uma-farm.web.app), and [the Uma loop](../game-mechanics.md#the-uma-loop) |
| **Her illustrations' phone check:** meet the first Uma and see her greeting full screen; play her confession, both moods; open her profile's Gallery and see it fill as you go | [uma-farm.web.app](https://uma-farm.web.app), and [her illustrations](../game-mechanics.md#her-illustrations) |
| **Write the story and ship it.** F40 lists what the rework changes for it: the protagonist is a man, there's no welcome week, and her life in town (`home`, `job`, `routine`, and `town.json`'s `locations`) | [F40](tasks/F40-story-authoring.md) |
| **The next Umas' art:** hand [F69](tasks/F69-bust-art-spec.md) to the character art session | Uma Character Art |

## Across the repos

- **uma-platform** holds the shared pieces: master data, uma-kit, uma-work, uma-server, uma-art, and the HD-2D stage
  `@luismlorenzana/uma-stage`, which the farm no longer uses (its portrait preview retired with landscape). Shared
  changes go there as requests
  ([change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)).
  - **uma-kit's landscape pieces** shipped in uma-kit 0.20.0, and the farm draws its frame with them: the left rail, the
    thin top bar, the wide side panels, Account's two columns and the update prompt clear of the sides. The place map
    that runs across (`HubMap flow="across"`) is there for a map that needs it; the farm's own tile map doesn't.
- **The art split:** ChatGPT draws character art (Uma sprites, poses, busts, portraits). Claude draws everything else in
  code (items, UI marks, buildings, the HD-2D kits) in a uma-platform session.
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
