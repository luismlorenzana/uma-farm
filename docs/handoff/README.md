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

**Next:** Phase 2's workshops, one at a time on your go, the Kitchen first.

| Piece | Who | State |
|---|---|---|
| Nothing open: Phase 2's workshops wait on your go | — | — |

## Open packets

The table above is the queue. A packet is deleted when it ships, and git keeps the history.

## Standing work

Not packets: each has a standing guide that changes as the game does.

| Work | Who | Its guide |
|---|---|---|
| **The story,** written freely and shipped at the end of every writing session | The story session | [How the story reaches the game](../story-pack.md#how-the-story-reaches-the-game) |
| **The next Umas' art:** portraits, faces and illustrations | ChatGPT (character art) | [The art brief](../design/her-look.md#the-art-brief) |

## Your steps

| What | Where |
|---|---|
| **Play your farm.** Start the new farm once, on its card when the app opens: it's the last start-over, and the farm it starts is the one you keep. Then play days as they come, and tell me what feels off | [uma-farm.web.app](https://uma-farm.web.app) |
| **Write the story and ship it** | [How the story reaches the game](../story-pack.md#how-the-story-reaches-the-game) |
| **The next Umas' art:** hand the art brief to the character art session | [The art brief](../design/her-look.md#the-art-brief), in Uma Character Art |

**What's new to notice** as you play:

- **Sideways:** the bar, the rail and side panels; held upright, it asks you to turn it ([the frame](../game-mechanics.md#the-frame-landscape)).
- **Ten actions a day** on the tile farm: clear, till, plant, water every day, harvest ([a day](../game-mechanics.md#a-day-ten-actions)).
- **The town map:** walk between places, see who's there now, and meet whoever you like by introducing yourself ([the town](../game-mechanics.md#the-town)).
- **Her stages,** acquaintance to married: hangouts and dates at two actions, Dinner in town, A night in ([the Uma loop](../game-mechanics.md#the-uma-loop)).
- **Farmhands:** invite a friend to work, set her tasks on the Book's work board, and watch her aptitudes rise ([farmhands](../game-mechanics.md#farmhands)).
- **Upkeep and loans:** the Book's money, and the mayor's office in town ([upkeep and loans](../game-mechanics.md#upkeep-and-loans)).
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
