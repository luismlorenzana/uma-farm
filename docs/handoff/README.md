# Open work

What's being built right now, and what's waiting on you. Where the game is going is in [the roadmap](../roadmap.md); how
it works today is in [the game mechanics](../game-mechanics.md). The page view is [handoff.html](../pages/handoff.html).

## Now

The farm is in the roadmap's **Phase 1, one game, not three**, on two tracks, one piece at a time each.

| Track | Piece | Who | State |
|---|---|---|---|
| **HD-2D farm** | **The working nod:** an Uma at work nods every 4–7 seconds, seeded by her id, none with reduced motion, on uma-stage 0.5.0's `emote` | Claude | Next: small, no packet |
| **HD-2D farm** | **The kit's second wave:** the 30 frames the stand-in still draws, painted in code | Claude, in a uma-platform session | [F9](tasks/F9-kit-farm.md): waits for your go |
| **Story** | **Layer 2:** each Uma's route, with her arrival scene, written and read in the Farm Story Sandbox | You and the story session | [F40](tasks/F40-story-authoring.md); the Counts page ([F60](tasks/F60-story-counts.md)) waits for your read |
| **Romance** | **The go-live:** publish the story pack, remove the romance switch, move the save to v4 with a backup | Claude | [F56](tasks/F56-story-delivery.md): its scripts, route, loader and bucket are done; the rest waits for the pack |
| **Art** | **The town cast's busts** | ChatGPT | [F25](tasks/F25-art-m4.md), part B |

## Open packets

A packet is written when a piece starts and deleted when it ships. Git keeps the history.

| Packet | What | Who |
|---|---|---|
| [F9](tasks/F9-kit-farm.md) | The farm kit's art, drawn in code: wave 2 (wave 1 shipped and is pinned) | Claude, in a uma-platform session |
| [F25](tasks/F25-art-m4.md) | The town cast's busts (part B; part A shipped) | ChatGPT |
| [F40](tasks/F40-story-authoring.md) | The story, written in layers in the Farm Story Sandbox | The story session, and you |
| [F56](tasks/F56-story-delivery.md) | The private story's delivery and the romance's go-live | Claude |
| [F60](tasks/F60-story-counts.md) | The story's counts in the sandbox: your read and the balance | The story session, then you |

## Your steps

| What | Where |
|---|---|
| **Read the roadmap,** and give one word on its audience gate: private first (recommended), or public later | [roadmap.md](../roadmap.md#the-audience-gate) |
| **The HD-2D farm on your phone:** turn on Account → HD-2D farm, put an Uma to work and watch her walk, end the day, tap her bubble in the morning. Then say how the walk and the bubble feel, and whether the pips can go | [uma-farm.web.app](https://uma-farm.web.app) |
| **Read in the Farm Story Sandbox:** layer 1, the Counts page and wave 1's five Umas | The sandbox on this Mac (`pnpm stories`) |
| **The kit's second wave:** your go, when you want it | [F9](tasks/F9-kit-farm.md) |

## Across the repos

- **uma-platform** holds the shared pieces: master data, uma-kit, uma-work, uma-server, uma-art, and the HD-2D stage
  `@luismlorenzana/uma-stage`. The farm pins 0.4.0; 0.5.0 adds `emote` for the nod. Shared changes go there as requests
  ([change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)).
- **The art split:** ChatGPT draws character art (Uma sprites, poses, busts, portraits). Claude draws everything else in
  code (items, UI marks, buildings, the HD-2D kits) in a uma-platform session.
- **uma-quest** shares the story's way of working (the Uma Ranker's cast, tags and ties), read as local files on the
  owner's PC, and the HD-2D stage.
- **uma-rpg** is frozen. The farm's v2 save engine was copied from it, never imported.
- **Parcels** to uma-quest, uma-rpg and uma-racer are parked until the farm's own game is done. uma-quest's accept list
  is final in [its spec](https://github.com/luismlorenzana/uma-quest/blob/main/docs/design/spec/05-accept-list.md).

## How a packet reads

A packet is one piece of work, written from the roadmap when it starts:
- **Why**, and what to read first;
- **Decided**: the calls already made, so the worker doesn't re-decide them;
- **Do**: the steps;
- **Done when**: the checks, including the owner's phone look when there is one;
- **Deliver**: the branch, the pull request, [the game mechanics](../game-mechanics.md) updated for any rule change,
  and the packet deleted.
