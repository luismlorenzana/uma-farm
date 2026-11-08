# uma-farm: the plan

> **Status: 2026-11-07, the starting plan. The repo exists; nothing is built yet.** On 2026-11-06 the owner asked to split
> the farm out of uma-rpg into its own app:
> - Umas gather, process and make there;
> - a minigame turns those base items into each game's final items, for uma-rpg, uma-quest and uma-racer.
>
> The shape was talked through in chat that day: copy the Wilds rather than cut them, one-way parcels, the cloud inside
> the `uma-rpg` project. The cloud is uma-rpg's
> [cloud plan](https://github.com/luismlorenzana/uma-rpg/blob/main/docs/design/cloud/plan.md) (IN1–IN26). This page is
> the order of work, with the calls FM1–FM26. Phase 1 is in [the handoff](../handoff/README.md): **F1** is ready now.
> Visual page: [previews/plan.html](previews/plan.html).

> **2026-11-08 (D6):** Phases 2–5 are now planned task by task in [first-playable.md](first-playable.md): F4–F6 as
> below, Phase 3's spec as F7, the Forge as F8 with its art F9, and the sender as F10.

## The short answer

- **The farm is uma-rpg's Wilds, copied into its own app,** with a new **Forge** at the end. Umas work the five lines:
  - **gather** raw items;
  - **process** them into refined ones;
  - **make** uma-rpg's five made kinds.

  The Forge's minigame then turns those base items into a chosen game's final items. uma-rpg keeps its own Wilds
  unchanged.
- **Parcels carry the items to the games, one way only.** The farm sends and the games receive. No server ever writes
  into a save, and a parcel is claimed exactly once.
- **The order:**
  - **Phase 1:** the cloud and a hello app, now;
  - **Phase 2:** the Wilds copied;
  - **Phase 3:** the design spec, beside Phase 2;
  - **Phase 4:** the Forge;
  - **Phase 5:** parcels, to uma-quest first, then uma-rpg and uma-racer.
- **The bill:** the `farm` database and its recovery, a few cents a month. Everything else stays in free tiers.
- **Your steps:**
  - one word: make the repo public or keep it private;
  - five GitHub package-access entries for F1;
  - a go for the cloud, then two Cloud console sign-in entries for F2;
  - a phone check at F3.

## The loop

```
 every outfit on the release (60 slots: 15 places × 4)
        │
        ▼
 the five lines, a row each:  gather ─► process ─► make  (copied from uma-rpg's Wilds)
   Metal · Vegetables · Wood · Fish · Stone              │
                                                         ▼
                                   the Forge: a short minigame, a game chosen first
                                                         │
                                                         ▼
                                   the Post: the outbox in the farm's save
                                                         │  one way, claimed once
                         ┌───────────────────────────────┼───────────────────────────────┐
                         ▼                               ▼                               ▼
                   uma-quest                         uma-rpg                         uma-racer
              DN14's consumables              its made items, as-is                 flair only
```

## The calls

| Id | Call |
|---|---|
| FM1 | The name is **uma-farm**: repo `luismlorenzana/uma-farm`, created private on 2026-11-07, public on the owner's word like the others (IN14, D1) |
| FM2 | **Copy, don't cut:** the farm starts from a copy of uma-rpg's Wilds rules and screens, taken at a recorded commit with their tests. uma-rpg keeps its own Wilds; nothing there moves or breaks |
| FM3 | **What's copied:** the five lines and their ten grades (the fifty raw and refined pairs, with uma-art's item icons); the fifteen places (gather, process, make); Craft Level and its pace; the step times and job sizes; queues, Recall, Repeat and stopped queues; the Warehouse |
| FM4 | **What stays behind:** fights, classes and promotion, gear and its grades, Extra Stats, Laurels, the Exchange, Speed Tickets, Uma Tickets, tiers and worlds, and uma-rpg's other pages. Targets wait for Phase 3, since today they name gear needs |
| FM5 | **One engine:** jobs run on `@luismlorenzana/uma-work` and the screens on `uma-kit/work`, the same as in uma-rpg and uma-racer. Any change to them is a platform release, never a fork |
| FM6 | **Who works:** every outfit on master data's release is in the farm from day one, with no tickets and no gacha. The limit is the 60 slots (15 places × 4). Phase 3 revisits it |
| FM7 | **A trade without classes:** her calling, read from her best running styles as in uma-rpg's rule (CV19, `roster/template.ts`), sets her trade. So the five trades, their three places each and the open shop carry over unchanged |
| FM8 | **The making places make base items:** uma-rpg's five made kinds (Arms Gems, Tome Ink, Armor Fittings, Accessory Settings, Planet and Moon Jewels), with uma-rpg's ids and recipes. They wait in the Warehouse for the Forge |
| FM9 | **The Forge** is a new place: a short minigame turns base items (made, and possibly refined) into one game's final item, and the game is chosen first. Its rules are Phase 3's. Two hold from now: a play never loses its inputs, and better play makes more |
| FM10 | **Parcels are one-way:** the farm sends, the games receive, never back. No game's save reaches the farm, and no server writes into any save (uma-rpg's production-save rule) |
| FM11 | **The parcel flow** ([below](#how-a-parcel-travels)): an outbox in the farm's save; `farm-api` writes a parcel only after accepting a save that holds it; a game's API fetches its parcels server to server; the game's app adds the items and records the parcel's id; the game's API confirms the claim only after accepting a save that holds that id |
| FM12 | **`@luismlorenzana/uma-post`**, in uma-platform, holds the parcel format and each game's accept list, so the Forge offers only what a game takes. A uma-platform session builds it, before Phase 5 |
| FM13 | **What each game takes:** uma-rpg its made items as they are (FM8's ids); uma-quest DN14's consumables (a tonic, a party meal and a revive; uma-quest D4); uma-racer flair only, since its one currency is Training Tickets. Each game's own session settles its list |
| FM14 | **Each game caps what it takes,** in its accept list: a ceiling a day for each item, so the farm can never flood a game's economy. The game sets it, not the farm |
| FM15 | **Receivers in order:** uma-quest first, once its Phase 4 names its items; then uma-rpg, a packet there after the owner's go, since it will be frozen; then uma-racer, in its own project, whose `racer-api-runtime` joins the farm's `POST_CALLERS` |
| FM16 | **A fresh save v1,** local first in Dexie and synced through `uma-server`. Nothing carries over from uma-rpg's Wilds or Warehouse (P4) |
| FM17 | **Push:** jobs finish while the app is closed, so the farm has push notifications from Phase 2. `farm-vapid`, `farm-push-scheduler` and `farm-push-tick` are created paused in F2 and resumed when the push route ships (IN17) |
| FM18 | **Portrait, phone first,** on uma-kit's shell unchanged: the farm is menus and maps, like uma-rpg's Wilds |
| FM19 | **Home is the Wilds:** the fifteen places in five rows of three, a row a line, on uma-kit's Hub map as uma-rpg draws them, with the Forge and the Post beside them. The Hub's art is uma-art's; any new building is a ChatGPT art packet |
| FM20 | Main JS ≤ 180 KB gzip, the platform's rule |
| FM21 | Local ports 8101 (API) and 5194 (web), beside uma-rpg's and uma-quest's (IN22) |
| FM22 | Every push to `main` checks and deploys, from F2 on, as in uma-rpg |
| FM23 | Packets are F-numbered from F1, and decisions D-numbered from D1 |
| FM24 | **The order:** the cloud and the hello app now; the Wilds copy next; the design spec beside it; then the Forge; then parcels, once a receiver's list exists |
| FM25 | **The cloud** is the cloud plan's: database `farm` (`saves`, `saveRescues`, `parcels`, `push`), `farm-api`, `farm-api-runtime`, `farm-deploy`, provider `uma-farm`, site `uma-farm`, the paused push pieces, and no private bucket (IN16) |
| FM26 | **uma-platform's P89** records the farm and its parcels, amending P3's "share no economy" |

## Phase 0: the logs (done, 2026-11-07)

- **uma-platform:** P88 puts three apps in the `uma-rpg` project. P89 adds uma-farm and its one-way parcels, amending P3.
  The repos table, the master-data readers and the roadmap rows are updated.
- **uma-rpg:** D308 (the project hosts the other two apps, and H169 hardens it first).
- **Here:** D1–D3.

## Phase 1: the repo, the cloud and the hello app (Claude, S + M + M)

| Id | What | Needs | The owner |
|---|---|---|---|
| F1 | [The workspace and its checks](../handoff/tasks/F1-workspace.md): pnpm, turbo, and `@farm/web`, `@farm/api` and `@farm/domain` as placeholders installing all five packages. `/api/post/ping` checks the caller's Google token (its tests); then lint, test, build, the size and private-content checks, and ports 8101 and 5194 | — | Five GitHub package-access entries |
| F2 | [The cloud, the pipeline and the ping](../handoff/tasks/F2-cloud.md): `infra/bootstrap.sh`'s nine pieces with the paused push pieces, the deploy workflow, the site check, `POST_CALLERS`, and the isolation matrix's uma-farm rows | F1, uma-rpg's H169 | The go for the cloud; two sign-in entries |
| F3 | [The hello app](../handoff/tasks/F3-hello-app.md): uma-rpg's stack, Google sign-in, save v1 in Dexie synced through `uma-server`, the update prompt, the Home Screen install | F2 | The phone check |

**Exit:** uma-farm on your iPhone's Home Screen, signed in, its save synced, and uma-rpg and uma-quest untouched.

## Phase 2: the Wilds copied (Claude, M + M + S)

- **F4, the rules.** uma-rpg's Wilds rules, copied at a recorded commit with their tests:
  - the lines, grades and items (`items/lines.ts`, `made-id.ts`, `made.ts`, `made-v4.ts`);
  - the places and trades (`economy/places-v4.ts`, `professions.ts`, `grades.ts`);
  - Craft Level, the calling rule (FM7), the job kinds on `uma-work`, and the Warehouse.

  Save v2 adds each Uma's Craft Level, the Warehouse and the work rows. Every outfit on the release is in it (FM6).
  The manual starts its `materials.md` and `loops.md` pages, generated from the code as uma-rpg's are.
- **F5, the screens.** Home, the Wilds map of fifteen places (FM19), and each place's page on `uma-kit/work`: slot rows,
  the job sheet, queues, Recall, Repeat, quick looks. Also the Warehouse. The worker picker is uma-kit's album over every
  outfit.
- **F6, push.** The push route, resuming `farm-push-tick`, and a "work done" notification, copied from uma-rpg's
  `push/`.

**Exit:** the farm plays as uma-rpg's Wilds do, minus fights: every line from G1 to G10, offline progress, and
notifications.

## Phase 3: the design spec (Claude, docs, M)

It starts beside Phase 2 and is finished with Phase 2's play. The spec goes in `docs/design/`, with preview pages at
uma-rpg's class-progression.md standard. It settles:
- **who works:** FM6 measured against play, and whether the farm grows its crew;
- **targets:** what replaces them, for example a game's order: "uma-quest wants 10 tonics";
- **the farm's own economy:** what it earns and spends with no fights (selling surplus, the Forge's costs), and whether
  Speed Tickets return;
- **the Forge:**
  - its minigame (one short play, about 30 seconds, skill over luck, never losing inputs);
  - what better play gives;
  - its screen;
- **each game's accept list and caps** (FM13, FM14), written with each game's session, and the `uma-post` format
  (FM12);
- **the Post's screens:** the outbox, sent parcels and their claims;
- **the queue of packets** for Phases 4 and 5.

## Phase 4: the Forge (Claude, M; art by ChatGPT)

The Forge's place, its minigame on a small canvas scene loaded on demand, its results into the outbox (FM9). Its art (a
building, the minigame's pieces) is a ChatGPT art packet in uma-art. The packet that first uses it pins the release.

## Phase 5: parcels (Claude across repos, M)

1. **uma-platform:** `uma-post` 0.1.0: the parcel type, its parser, each game's accept list and caps, and their tests.
2. **The farm, the sender:**
   - the outbox in the save;
   - `farm-api`'s `parcels` collection, written only from an accepted save;
   - `/api/post/parcels` (a game fetches its own) and `/api/post/claims` (a game confirms), both checked by token (IN18).
3. **uma-quest, the first receiver** (a Q-packet there): fetch, add, record, confirm.
4. **uma-rpg** (an H-packet there, after the owner's go), then **uma-racer** (a packet there, with `racer-api-runtime` on
   `POST_CALLERS`).

## How a parcel travels

Every step is safe to repeat, and an id is never claimed twice.

| # | Where | What happens |
|---|---|---|
| 1 | The farm's app | The Forge's result goes into the outbox: a parcel id, its game, its items and counts, and its date. The save syncs |
| 2 | `farm-api` | It accepts the save, then writes each new outbox parcel into `parcels/{id}` with the state `sent`. It never writes the save |
| 3 | The game's API | With its own Google ID token (audience: the farm's URL), it asks `farm-api` for its parcels in the state `sent` |
| 4 | `farm-api` | It checks the token: Google-signed, the right audience, an account on `POST_CALLERS`, and that account's game. Then it answers with that game's parcels only |
| 5 | The game's app | It gets the parcels from its API, adds the items within the game's caps, records each parcel id in the game's save, and syncs |
| 6 | The game's API | It accepts the save, sees the new ids, and confirms them to `farm-api` |
| 7 | `farm-api` | It marks each parcel `claimed`. A parcel already claimed stays claimed, and a repeat is a no-op |
| 8 | The farm's app | The Post shows the parcel claimed, at its next sync |

**Why this shape:**
- A save is only ever written by its own app, so an unsynced phone never loses progress to a server write (uma-rpg's
  2026-10-30 incident).
- A lost reply just repeats a step.
- A game's id list makes a second claim impossible.

## What it costs

| Added to the `uma-rpg` project | Free tier | At one player |
|---|---|---|
| Firestore `farm`, with recovery | None: the free quota covers only `(default)` | A few cents a month |
| Cloud Run `farm-api` | 2M requests and 180k vCPU-seconds a month, shared across the billing account | $0 |
| Hosting site `uma-farm` | 10 GB stored and 360 MB a day, shared by the project's sites | $0 |
| Images `farm` | 0.5 GB, shared | $0 |
| `farm-push-tick` | 3 jobs free a billing account; uma-rpg's tick is 1 | $0 |
| `farm-vapid` | 6 secret versions free; uma-rpg's is 1 | $0 |
| Parcel calls | Inside Cloud Run's free requests | $0 |

Sources: [Firestore pricing](https://cloud.google.com/firestore/pricing),
[Cloud Run pricing](https://cloud.google.com/run/pricing),
[Cloud Scheduler pricing](https://cloud.google.com/scheduler/pricing),
[Secret Manager pricing](https://cloud.google.com/secret-manager/pricing). The cloud plan's bill covers all three apps:
under $1 a month added, most likely under 25 cents.

## Risks

| Risk | What keeps it small |
|---|---|
| The copy drifts from uma-rpg's Wilds | Expected (FM2): the farm owns its rules from the copy on. The engine, `uma-work`, stays shared, so its fixes reach both |
| Parcels flood a game's economy | Each game's caps (FM14), set by that game |
| A parcel is lost or claimed twice | The flow's ids and its confirm-after-save rule; every step is safe to repeat |
| A server writes into a save | Never (FM10). Parcels live in the farm's `parcels`, and claims in each game's own save |
| uma-rpg is frozen when its turn comes | Its receiver is one packet there, run only on the owner's go (FM15) |
| 272 outfits in a picker | uma-kit's album already sorts and filters every Uma list in both games |
| The Forge's minigame isn't fun | Phase 3 designs it and Phase 4 builds one; the owner plays it before parcels depend on it |
