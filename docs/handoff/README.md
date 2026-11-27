# Open work

This is the active queue. [Game mechanics](../game-mechanics.md) describes shipped behavior. [Roadmap](../roadmap.md) tracks planned work. [Page view](../pages/handoff.html).

## Now

The latest changes add lightweight previews to the Uma Library and gallery grids. Live scenes, full-screen art and replays open the matching full-size file. Private images use a single verified disk copy with a byte budget. Follow the [art release guide](../design/her-look.md#delivery) and [cache design](../technical/architecture.md#the-pwa-and-the-precache) for follow-up work.

The deployed game includes the 50-character, 25-profession town, morning crew scheduling, the Festival agenda, and 75 authored True Love duos. [Current game](../roadmap.md#where-we-are)

## Open packets

| Work | What remains |
|---|---|
| Installed iPhone review | Run one device pass for the [Field and Pond](tasks/F103-hd2d-farm.md), [painted maps and doors](tasks/F115-hd2d-map-navigation.md), and [indoor camera and lighting](tasks/F120-hd2d-interior-renderer.md). Measure startup, room frame times, memory and cached storage. Check a field, the Library room, a crowded room, a gallery page and a full-size solo or duo replay. Verify both landscape sizes, Balanced and Saver, and a warm offline launch. |
| Farm-work feedback | Review which farm jobs still need in-world animation or item feedback. [Roadmap Phase 3](../roadmap.md#phase-3-feel-and-polish) |
| Save reliability and release visibility | Verify alerts, scheduled exports and a restore exercise on a disposable save. Add in-app release notes. [Roadmap Phase 4](../roadmap.md#phase-4-steady) |

Sound, accessibility and a browser playthrough in CI remain [deferred](../roadmap.md#deferred).

## Standing work

| Work | Guide |
|---|---|
| Story authoring and private releases | [How the story reaches the game](../story-pack.md#how-the-story-reaches-the-game) |
| New looks, walking sets and illustration delivery | [The art brief](../design/her-look.md#the-art-brief) |
| Crew and economy balance | [Four-season crew balance](../design/seasonal-crew-balance.md) and [progression balance through Rank 10](../game-mechanics.md#progression-balance-through-farm-rank-10) |

## Your steps

Open [Uma Farm](https://uma-farm.web.app) on the installed iPhone. Use **Update ready → Restart** if the app offers it. Open an Uma's **Scenes → Illustrations**, then open an earned picture or replay. On the farm and in town, open a room and try Walk and Close. Report the device, view and location if scrolling, scene loading or movement hitches.

## Across the repos

- **uma-platform** publishes master art and the shared packages. Farm uses uma-stage for HD-2D and uma-kit for the app frame, sign-in and private content.
- **uma-story-authoring** holds the private drafts and the Farm Story Sandbox. The story and game ship independently. See [story delivery](../story-pack.md#how-the-story-reaches-the-game).
- **uma-farm** owns farm rules, the app, the API and save behavior. Private art and story material stay in ignored content folders and private buckets.

## How a packet reads

State why the work matters, what the owner decided, what to implement and what a playthrough must verify. Update the mechanics when rules change and remove the finished packet after delivery. Historical playthroughs stay dated in the mechanics and design documents.
