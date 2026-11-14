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
**A day of actions (F77) is built,** in review: ten actions a day, the tile farm worked by hand with daily watering,
one-action foraging, chopping and fishing, a station's one load, a crate shipped for one action, and going into town for
the shop; save v5, so a farm from before it starts over.

| Piece | Who | State |
|---|---|---|
| F77 **A day of actions, and the farm loop** | Claude | Built, in review: the pull request `feat/f77-actions-and-farm-loop` |
| [F78](tasks/F78-town-map.md) **The town map** | Claude | After F77 |
| [F79](tasks/F79-uma-loop.md) **The Uma loop** | Claude | After F78 |
| [F80](tasks/F80-farmhands.md) **Farmhands** | Claude | After F77 and F79 |
| [F81](tasks/F81-economy.md) **Upkeep and loans** | Claude | After F77 |
| [F82](tasks/F82-calendar.md) **The calendar** | Claude | After F77 |
| [F83](tasks/F83-ranch-and-mine.md) **The ranch and the mine** | Claude | After F77 and F80 |
| [F69](tasks/F69-bust-art-spec.md) **The bust art**, the next Umas | ChatGPT | The pilot is done; the rest in the Ranker's order |
| [F40](tasks/F40-story-authoring.md) **The story**, and its ship routine | The story session | Release 1 shipped; Release 2 brings `world.json` |

## Open packets

The table above is the queue. A packet is deleted when it ships, and git keeps the history.

## Your steps

| What | Where |
|---|---|
| **The landscape phone check:** open the app sideways and visit every screen; held upright, it asks you to turn it | [uma-farm.web.app](https://uma-farm.web.app) |
| **The dialogue engine's phone check:** meet the pilot's Umas and watch their faces and outfits change | [uma-farm.web.app](https://uma-farm.web.app) |
| **Once F77 is deployed, play three days:** start the new farm on the card, clear, till, plant and water, forage and fish, start a load and ship, run out of actions and end the day | [uma-farm.web.app](https://uma-farm.web.app), and [the day's rules](../game-mechanics.md#a-day-ten-actions) |
| **The default Uma's look:** meet an Uma without art and play a talk and an event: the blank bust's faces and the default story | [uma-farm.web.app](https://uma-farm.web.app) |
| **Write the story and ship it.** F40 lists what the rework changes for it: the protagonist is a man, there's no welcome week, and her life in town | [F40](tasks/F40-story-authoring.md) |
| **The next Umas' art:** hand [F69](tasks/F69-bust-art-spec.md) to the character art session | Uma Character Art |

## Across the repos

- **uma-platform** holds the shared pieces: master data, uma-kit, uma-work, uma-server, uma-art, and the HD-2D stage
  `@luismlorenzana/uma-stage`, which the farm no longer uses (its portrait preview retired with landscape). Shared
  changes go there as requests
  ([change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)).
  - **uma-kit's landscape pieces:** the farm asked for its layout on a landscape stage (a thin top bar, a left rail, the
    Account page and the place map). Until they ship, the farm draws its own bar and rail from the kit's pieces.
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
