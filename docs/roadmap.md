# The road to a full game

Start here for the shipped game and the work still open. [Game mechanics](game-mechanics.md) is the rules reference, including generated tables. [Handoff](handoff/README.md) lists active checks. [Architecture](technical/architecture.md) explains the app and its releases. [Page view](pages/roadmap.html).

## What this game is

Uma Farm is the owner's private, landscape Home Screen game. Start by tending the farm and meeting the Umas in town. Invite friends to join the crew. As they take over daily work, the farmer has more time for town, outings and married life. Farms keep progressing after the closing celebration. Save v6 grows in place, with device safety copies and cloud sync.

## Where we are

| Part | Shipped game |
|---|---|
| Days and calendar | Seasons have 30 days. Five Morning actions are followed by the crew shift and five Afternoon actions. Night opens up to five shared spouse visits. Town travel is free. Calendar and Work Calendar use six columns and two rows per page. [Days and actions](game-mechanics.md#a-day-ten-actions) · [Calendar](game-mechanics.md#the-calendar-screen) |
| Farm, town and rooms | Painted Farm and Town overviews lead into farm sections, town districts and destinations. Indoor rooms have a fixed-facing HD-2D camera, Walk and Close views, 64×88 sprite cells, and Balanced as the default with Saver available. The farm has eight playable HD-2D plots with a Grid view. [Home](game-mechanics.md#home-the-farm-map) · [Town](game-mechanics.md#the-town) |
| Production and work | The farm grows 51 seasonal crops and orchard plants, raises seven species, fishes, gathers and processes graded goods. Work and its calendar show coordinated jobs, demand and missed coverage. The crew can buy approved supplies and use equipped Tool Rack copies. [Catalogue](game-mechanics.md#the-catalogue) · [Farmhands](game-mechanics.md#farmhands) |
| Farm Rank and finance | What Next links to the next action, production and building prerequisites, credit, rooms and relationships. The mayor offers up to three shared loans with partial repayment. Standard surplus policies ship excess stock automatically. [What Next](game-mechanics.md#what-next) · [Upkeep and loans](game-mechanics.md#upkeep-and-loans) |
| Food and cooking | The farm kitchen covers daily meals. The Kitchen cooks its original catalogue and learned Restaurant dishes. The Restaurant has eight stages and 120 recipes tied to exact-grade ingredient discoveries. Dishes can be sold, used in other recipes or saved for meals. [Food](game-mechanics.md#food) · [Restaurant](game-mechanics.md#the-restaurant) |
| Town and events | Fifty launch Umas fill 25 paired professions with staggered days off. Friends can work farm shifts and married Umas move from the Inn while keeping their weekly schedules. Library → Kitchen → Café connects to the shared Requests board. The Festival agenda links Calendar, Start Day, Town, What Next and Work Calendar to the day’s events, four Festival Ground contests and the Cooking Contest. [Town professions](game-mechanics.md#town-professions-and-the-week) · [Festival agenda](game-mechanics.md#festival-agenda) |
| Relationships and marriage | Talks, gifts, outings and chapters develop each relationship. Routes have alternate scenes when a farm prerequisite blocks the original. A wedding date is chosen after a proposal. The Ring Bench offers ten rings. The Forge makes tools and four heirlooms. [Her chapters](game-mechanics.md#her-chapters) · [Forge](game-mechanics.md#the-forge-workshop) |
| Married life | Greater Love opens numbered night looks. True Love opens solo or duo visits where eligible. The story roster has 75 pairs. The 50th wedding opens the closing celebration in that year, with the Greater Festival on the same date the following year. [Greater Love and True Love](game-mechanics.md#greater-love-and-true-love) · [Celebrations](game-mechanics.md#celebrations-and-the-greater-festival) |
| Library, story and art | Books open on Relationship, with sorting for met Umas and a By tier view. The books track scenes, art, histories, discoveries and jewelry. All 50 launch Umas have dialogue portraits, scene art and three walking wardrobes. Story and art arrive as private releases. Scene cards use small previews, and scenes and replays use full-size artwork. [Library](game-mechanics.md#uma-library) · [Story releases](story-pack.md#how-the-story-reaches-the-game) |
| Guidance and recovery | Contextual Farm guides and the Menu explain decisions in place. Account shows build and release versions, cloud sync status and device safety copies. [Farm guides](game-mechanics.md#farm-guides) · [Save architecture](technical/architecture.md#dexie) |

## The finish line

The core progression is playable through the Restaurant, contests, expeditions, marriage and the 50-spouse celebration. Remaining release work is to confirm the installed iPhone's performance, finish farm-work feedback, and exercise recovery and deployment checks. [Open checks](handoff/README.md#open-packets)

## The phases

### Phase 0: Clean slate (done)

Established one save, one private deployment and the mechanics reference. Git retains the earlier specs and finished packets.

### Phase 1: One game, built around the Umas (done)

Shipped the landscape loop, building progression, town introductions, individual routes, default story and the shared dialogue engine.

### Phase 2: The whole farm

The ranch, mines, sea, expeditions, Restaurant, contests, Library, Forge and long-game milestones are in. [Current mechanics](game-mechanics.md) describe their rules. [The early scaling studies](design/game-design.md#the-farm-at-scale-2026-11-15) record the rules and results at the time. [Four-season crew balance](design/seasonal-crew-balance.md) covers the later automatic work scheduler.

### Phase 3: Feel and polish

| Step | Open work |
|---|---|
| 3.2 Farm-work animation | Finish visible task feedback and item flights where needed. |
| 3.6 Speed and 3.7 HD-2D polish | Measure cold and warm startup, Library and replay memory, and frame times on an installed iPhone. Include the densest rooms and field plots in Walk and Close, in Balanced and Saver. [Device review](handoff/README.md#open-packets) |

### Phase 4: Steady

| Step | Open work |
|---|---|
| 4.1 Error reporting | Verify operational alerts reach the owner. |
| 4.2 Save reliability | Exercise a recovery on a disposable test save, including safety copies, interrupted sync and a renewed connection. Confirm scheduled exports and a restore procedure. |
| 4.4 Release visibility | Build, master data and story versions appear in Account. Add concise release notes in-game. |

### Deferred

- Sound and music.
- Accessibility review, including VoiceOver, reduced motion and text size.
- Browser playthrough in CI.

### Later: release packs

Add sets of Umas beyond the 50-person launch cast after the core game is steady. The next packet will define how packs are selected, published and opened on existing farms.

### Later: parcels to the other games

The one-way export to sibling games is parked while work focuses on the Farm.

## How we work from here

- Update [game mechanics](game-mechanics.md) with rule changes and regenerate docs with `pnpm docs:update`.
- Keep the roadmap for planned work and the [handoff](handoff/README.md) for active checks. Git keeps finished packets.
- Follow the standing [story guide](story-pack.md) and [art guide](design/her-look.md). Publish their private content separately from app code.

## Your steps now

Play the installed game and report what feels off. The [handoff](handoff/README.md#your-steps) has the current phone checks.
