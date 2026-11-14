# Open work

What's being built right now, and what's waiting on you. Where the game is going is in [the roadmap](../roadmap.md); how
it works today is in [the game mechanics](../game-mechanics.md). The page view is [handoff.html](../pages/handoff.html).

## Now

The farm is in the roadmap's **Phase 1, one game, built around the Umas**, on two tracks, one piece at a time each. The
deployed site is the work in progress: saves can start over whenever the game needs it.

| Track | Piece | Who | State |
|---|---|---|---|
| **Game's frame** | **Done.** Shipped: placeholders everywhere, the farm grows by building ([the farm's progress](../game-mechanics.md#the-farms-progress)), the lean start ([the opening](../game-mechanics.md#the-opening)), the town ([the town](../game-mechanics.md#the-town)), meeting her ([meeting her](../game-mechanics.md#meeting-her)), and her chapters ([her chapters](../game-mechanics.md#her-chapters)). Next: the workshops (Phase 2) | Claude | Waits for your go |
| **HD-2D farm** | **Done:** the working nod. An Uma at work drawn as a sprite nods every 4–7 seconds, seeded by her id, none with reduced motion, on uma-stage's `emote` ([the Umas on the farm](../game-mechanics.md#the-umas-on-the-farm)). Next on this track: the kit's second wave, then the farm reaches the Hub | Claude | Shipped |
| **Story's way in** | **Done:** ship the story. `pnpm story:ship` checks, releases, publishes and backs up in one command; each release is numbered with a note, the morning says "New story arrived" once, and Account shows the release ([how the app gets the pack](../game-mechanics.md#how-the-app-gets-the-pack)). Next: **the world in the pack** (`world.json`, Town notes) | Claude | [F73](tasks/F73-world-in-the-pack.md) next |
| **Story's way in** | **The ship routine and the World Book:** ship at the end of every writing session (`pnpm story:ship --note "…"`; the first real ship is yours); keep the World Book with "For the game" | The story session | [F40](tasks/F40-story-authoring.md) |
| **Design** | **The game's design:** one clear document for your review, drawing on the World Book | Claude | Next (F72 is in) |
| **HD-2D farm** | **The kit's second wave:** the 30 frames the stand-in still draws, painted in code | Claude, in a uma-platform session | [F9](tasks/F9-kit-farm.md): waits for your go |
| **Story** | **Free authoring:** the world, the backgrounds, the characters, however the story wants. The pack is open: every part optional, notes instead of blocks | You and the story session | [F40](tasks/F40-story-authoring.md): how it reaches the game; [the pack's menu](../story-pack.md) |
| **Her look** | **The bust art:** her outfits (8) and her expressions (22); the pilot is the two Umas with the new full art | ChatGPT | [F69](tasks/F69-bust-art-spec.md): ready to hand over |
| **Her look** | Busts that change expression, then her wardrobe | Claude | [F70](tasks/F70-expressive-busts.md) after F69's pilot, [F71](tasks/F71-her-wardrobe.md) after F70 |

## Open packets

A packet is written when a piece is next and deleted when it ships. Git keeps the history.

| Packet | What | Who |
|---|---|---|
| [F73](tasks/F73-world-in-the-pack.md) | The world in the pack: names, history, festivals, places, seasons, Town notes | Claude |
| [F69](tasks/F69-bust-art-spec.md) | The bust art: her outfits and her expressions; the pilot first | ChatGPT |
| [F70](tasks/F70-expressive-busts.md) | Busts that change expression: the game puts the face over the bust; the story's `emote` picks the face | Claude |
| [F71](tasks/F71-her-wardrobe.md) | Her wardrobe: the occasion picks the outfit; Dinner in town and A night in | Claude |
| [F9](tasks/F9-kit-farm.md) | The farm kit's art, drawn in code: wave 2 (wave 1 shipped and is pinned) | Claude, in a uma-platform session |
| [F40](tasks/F40-story-authoring.md) | The story: free authoring, and how it reaches the game | The story session, and you |

## Your steps

| What | Where |
|---|---|
| **Her look:** read [her-look.md](../design/her-look.md), and hand [F69](tasks/F69-bust-art-spec.md) to the character art session. The bust family's request is sent to uma-platform (2026-11-13) | [her-look.md](../design/her-look.md) |
| **The farm starts over on your phone:** open the site, see the start-over card, start the new farm, and play a day | [uma-farm.web.app](https://uma-farm.web.app) |
| **The farm with no story on your phone:** master data's first five are the welcome list, one a morning at the Gate, and every event, chat and scene plays the game's own short words until the story fills them | [uma-farm.web.app](https://uma-farm.web.app) |
| **The farm grows by building on your phone:** after the deploy, open the Diary's projects, build the Mill at the Mill's quick look, end the day and see it stand. A live farm keeps loading: what its chapter had opened stays open | [uma-farm.web.app](https://uma-farm.web.app) |
| **The lean start on your phone:** on a new farm (a fresh account, or the start-over card), name your farmer, read the lines, and you're on Home in three taps (Skip works from the first line). The Gate wears **Visiting**: open it and **Say hello** to day 1's visitor, who moves in. A live farm keeps loading and never replays its opening. The pack's own `opening.json` plays once a release with it is published | [uma-farm.web.app](https://uma-farm.web.app) |
| **The town on your phone:** after the deploy, tap the Town at the foot of the farm map (below the Shop's row). See about two dozen out at the six spots, tap one to talk (her line, "Your first talk"), tap her again (no second count today), and find anyone in People. Tomorrow, a different few. Once the story's `town.json` and the sisters are in a published release, its fourteen people keep the spots by their master-data names, and the sisters are out with everyone else | [uma-farm.web.app](https://uma-farm.web.app) |
| **Meeting her on your phone:** after the deploy, open the Gate, **Say hello** to the morning's visitor (her scene plays, and she moves in), end the day and see the next one there. In the Town, talk with one on three days: on the third her scene plays and she moves in while a bed is free, else she lives in town (her profile's **Invite to the farm** once a bed frees). A live farm keeps loading: everyone on it counts as met, and a day-1 helper never greeted has her scene play once | [uma-farm.web.app](https://uma-farm.web.app) |
| **Her chapters on your phone:** after the deploy, open an Uma's profile on the Hearts tab: her four chapters (her own once the story writes them), the one she's in with its events, and what opens the next; her row says "Ch. 1 · Getting to know her". The morning after her confession says "A new chapter with ‹name› · Together". A live farm keeps loading | [uma-farm.web.app](https://uma-farm.web.app) |
| **The story's first ship on your phone:** once the story session runs `pnpm story:ship` on its machine, open the site. Your farm's next morning says "New story arrived" with its note (once), and Account shows "Story · Release 1" with its date. A new farm plays the story's opening | [uma-farm.web.app](https://uma-farm.web.app) |
| **Say go on the workshops** (Phase 2), which her chapters unblock | [roadmap.md](../roadmap.md#phase-2-the-whole-farm) |
| **The HD-2D farm on your phone:** turn on Account → HD-2D farm, put an Uma to work and watch her walk, see an Uma at work drawn as a sprite nod every few seconds, end the day, tap her bubble in the morning. Then say how the walk, the nod and the bubble feel, and whether the pips can go | [uma-farm.web.app](https://uma-farm.web.app) |
| **Write the story** however you like | The Farm Story Sandbox on this Mac (`pnpm stories`) |
| **The kit's second wave:** your go, when you want it | [F9](tasks/F9-kit-farm.md) |

## Across the repos

- **uma-platform** holds the shared pieces: master data, uma-kit, uma-work, uma-server, uma-art, and the HD-2D stage
  `@luismlorenzana/uma-stage`. The farm pins 0.6.0: 0.5.0's `emote` plays the nod, and 0.6.0's opt-in `/look` isn't
  used yet. Shared changes go there as requests
  ([change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)).
- **The art split:** ChatGPT draws character art (Uma sprites, poses, busts, portraits). Claude draws everything else in
  code (items, UI marks, buildings, the HD-2D kits) in a uma-platform session.
- **uma-quest** shares the story's way of working (the Uma Ranker's cast, tags and ties), read as local files on the
  owner's PC, and the HD-2D stage.
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
