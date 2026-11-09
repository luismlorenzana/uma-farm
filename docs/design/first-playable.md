# uma-farm: the first playable farm

> **Status: 2026-11-08 (D6).** The requirements and the planned tasks for uma-farm, from the hello app to the Wilds
> playing on your phone, then the Forge and the first parcels. Phase 1's cloud is live (F1, F2). **This doc is the brief
> a uma-farm session turns into packets**, one per task, keeping the ids here. Visual page:
> [previews/first-playable.html](previews/first-playable.html).
>
> It refines [plan.md](plan.md) (Phases 1–5, FM1–FM26) and adds FW1–FW13. Where they differ, this doc is current.

## The short answer

- **The first playable farm is uma-rpg's Wilds as its own app:** every Uma working the five lines (gather, process,
  make), offline progress, and notifications when work is done. It's portrait, on uma-kit's shell, like uma-rpg's Wilds.
- **Five milestones,** the first three being the first playable farm:

  | Milestone | What you get | Tasks |
  |---|---|---|
  | **M1, stood up** | The hello app: signed in, its save synced | F3 |
  | **M2, the Wilds play** | The rules, the screens and push | F4, F5, F6 |
  | **M3, the design spec** | Written beside M2, finished with its play | F7 |
  | **M4, the Forge** | The minigame that turns base items into a game's final item | F8, plus the art packet F9 |
  | **M5, parcels** | The Forge's items reach uma-quest, one way | F10, uma-platform's PO1 and uma-quest's receiver |

- **The work:** 8 uma-farm tasks, 7 of them Claude's and 1 an art packet for ChatGPT. uma-platform owes `uma-post`
  (PO1) before M5.
- **Ready now:** F3 (the hello app) and F4 (copying the rules, pure domain).
- **Your steps:**
  - a phone check at M1;
  - turning notifications on at F6;
  - a few days of play at M2;
  - reading the spec at M3;
  - the Forge's look and a play at M4.

## What you'll play (M1–M2)

1. **Install and sign in.** The farm sits on your Home Screen in portrait, signs in with your Google account and syncs
   its save.
2. **Home is the Wilds.** Fifteen places in five rows of three, one row a line: Metal, Vegetables, Wood, Fish and Stone.
   Each row runs gather, then process, then make. They sit on uma-kit's Hub map, with the Forge and the Post standing as
   placeholders until M4.
3. **Put Umas to work.** Every outfit on master data's release can work, picked from uma-kit's album. A place has four
   slots, so 60 at most. Her calling sets her trade.
4. **Jobs run while the app is closed.** Raw items become refined ones, then uma-rpg's five made kinds, from G1 to G10.
   Craft Level grows, and the Warehouse fills.
5. **Notifications** tell you when work is done.

## Where things stand

| Done | |
|---|---|
| The plan | [plan.md](plan.md), FM1–FM26, and the cloud plan's part |
| F1, the workspace | D4 |
| F2, the cloud and the pipeline | D5: `farm-api`, the `farm` database, site `uma-farm`, the deployer, sign-in, and push created paused; isolation checked; the ping refuses everyone but `quest-api-runtime` |
| The sign-in entries | You added them on 2026-11-08 |

## Requirements

Each requirement has an id, where it comes from, and the task that checks it. A packet copies the requirements it covers into its Decisions and its Done-when.

### What it does

| Id | Requirement | From | Checked by |
|---|---|---|---|
| R1 | Installs on the Home Screen; signs in with Google for the one allowed email; shows the update prompt; keeps save v1 local first in Dexie and synced through `farm-api` | FM16, IN3 | F3 |
| R2 | uma-rpg's Wilds rules, copied at a recorded commit with their tests: the five lines and their ten grades (the fifty raw and refined pairs), the fifteen places, Craft Level and its pace, the calling rule, the job kinds on `uma-work`, and the Warehouse | FM2, FM3, FM7 | F4 |
| R3 | Every outfit on the release can work, with 60 slots (15 places × 4) | FM6 | F4, F5 |
| R4 | The making places make uma-rpg's five made kinds with uma-rpg's ids and recipes | FM8 | F4 |
| R5 | Save v2: each Uma's Craft Level, the Warehouse and the work rows, migrated from v1 | Plan F4 | F4 |
| R6 | Home is the Wilds on uma-kit's Hub map (five rows of three) with uma-art's buildings; each place's page on `uma-kit/work` (slot rows, the job sheet, queues, Recall, Repeat, quick looks); the Warehouse; the worker picker on uma-kit's album | FM5, FM19 | F5 |
| R7 | Jobs progress while the app is closed and settle on opening, as on `uma-work`. **Reversed for the reworked loop (D25):** days advance only when the owner ends them | FM5 | F4, F5 |
| R8 | "Work done" push notifications: the push route, `farm-push-tick` resumed, the VAPID secret, copied from uma-rpg's `push/` | FM17 | F6 |
| R9 | The manual's `materials.md` and `loops.md`, generated from the code as uma-rpg's are | Plan F4 | F4 |
| R10 | The design spec settles who works, targets, the farm's own economy, the Forge, each game's accept list and caps, the Post's screens and the Phase 4–5 queue | Plan Phase 3 | F7 |
| R11 | The Forge: a place whose short minigame (about 30 seconds, skill over luck, never losing inputs) turns base items into a chosen game's final item, into the outbox | FM9 | F8 |
| R12 | Parcels, one way: the outbox in the save; `farm-api` writes a parcel only after accepting a save holding it; games fetch and confirm with their own tokens; a parcel is claimed exactly once | FM10, FM11, IN18 | F10 |

### How it must behave

| Id | Requirement | From | Checked by |
|---|---|---|---|
| N1 | Main JS ≤ 180 KB gzip; the Forge's canvas scene loads on demand | FM20 | every packet |
| N2 | Portrait, phone first, on uma-kit's shell unchanged; 44 pt targets; safe areas | FM18 | F3, F5 |
| N3 | No original-game content in git; the private-content guard runs in CI | CLAUDE.md | every packet |
| N4 | Code from uma-rpg is copied at a recorded commit with its tests, never imported; the farm owns its rules from then on | FM2 | F4, F5, F6 |
| N5 | Every save change is a new version with its migration and tests; the production-save rules hold from F3 (never move `account.updatedAt`; no server writes into a save) | FM10, FM16 | F3, F4, F10 |
| N6 | `uma-work` and `uma-kit/work` stay shared and unchanged; anything they lack is a platform release | FM5 | F4, F5 |
| N7 | Only uma-farm's cloud pieces; every push to `main` checks and deploys; push stays inside the free tiers | FM22, FM25 | every packet |
| N8 | Vitest beside the code; no network in tests; the copied tests pass unchanged before any farm change | AGENTS.md | F4 |
| N9 | Player-facing text is short; explanations behind a help button | AGENTS.md | F5 |

## Milestones

Each milestone ends with exit checks you can see on the phone. M4 and M5 are planned here; their packets are written once F7 settles their rules (FW1).

### M1 · Stood up

uma-farm becomes a real app on your iPhone: installed, signed in, its save syncing.

| Id | Task | Who | Size | Needs | State |
|---|---|---|---|---|---|
| [F3](#f3) | **The hello app**: uma-rpg's stack copied: Google sign-in, save v1 synced, the update prompt and the Home Screen install. | Claude | M | F2 ✓, the sign-in entries ✓ | Ready |

**Exit:**

- You install it from `uma-farm.web.app`, sign in, and see the save sync
- uma-rpg and uma-quest are unchanged

### M2 · The Wilds play

The farm plays as uma-rpg's Wilds do, minus fights: every line from G1 to G10, offline progress and notifications.

| Id | Task | Who | Size | Needs | State |
|---|---|---|---|---|---|
| [F4](#f4) | **The rules**: uma-rpg's Wilds rules copied at a recorded commit with their tests; save v2; the manual's generated pages. | Claude | M | F1 ✓ | Ready |
| [F5](#f5) | **The screens**: Home and the Wilds map of fifteen places, each place's page on `uma-kit/work`, the Warehouse, and the worker picker. | Claude | M | F3, F4 | Waiting |
| [F6](#f6) | **Push**: The push route, resuming `farm-push-tick`, and a "work done" notification, copied from uma-rpg's `push/`. | Claude | S | F5 | Waiting |

**Exit:**

- Every line runs from gather to make, G1 to G10
- Jobs finish while the app is closed, and a notification says so
- Every outfit on the release can be put to work, 60 at once
- The copied tests pass, and the manual's pages are generated

### M3 · The design spec

The spec settles what the farm becomes beyond the copy: who works, targets, its own economy, the Forge, the accept lists and the Post.

| Id | Task | Who | Size | Needs | State |
|---|---|---|---|---|---|
| [F7](#f7) | **The design spec**: Plan Phase 3: who works, targets, the farm's economy, the Forge, accept lists and caps, the Post's screens, and the queue for M4 and M5. | Claude | L | F4 (to start), F6 play (to finish) | Waiting |

**Exit:**

- You've read and answered it
- The Forge's minigame is designed, with its screen
- M4 and M5 have their packets written

### M4 · The Forge

The Forge's place and minigame turn base items into a game's final items, waiting in the outbox.

| Id | Task | Who | Size | Needs | State |
|---|---|---|---|---|---|
| [F8](#f8) | **The Forge**: The Forge's place, its minigame on a small canvas scene loaded on demand, and its results into the outbox. | Claude | M | F7, F9 (placeholders until then) | Later |
| [F9](#f9) | **Art: the Forge and the Post**: The Forge's building and the minigame's pieces, and the Post's building, released in uma-art. | ChatGPT | M | F7 | Later |

**Exit:**

- You play the Forge, and the results go to the outbox
- Its art is uma-art's, pinned

### M5 · Parcels

The Forge's items reach uma-quest: sent from the outbox, fetched and confirmed by uma-quest's API, claimed exactly once.

| Id | Task | Who | Size | Needs | State |
|---|---|---|---|---|---|
| PO1 | **`uma-post` 0.1.0** *(uma-platform)*: The parcel type, its parser, each game's accept list and caps, and their tests (FM12). Written ahead: [PO1](https://github.com/luismlorenzana/uma-platform/blob/main/docs/handoff/tasks/PO1-uma-post.md) | Claude | M | F7 answered (P107, D19) | Later |
| [F10](#f10) | **Parcels, the sender**: The outbox in the save; `farm-api`'s `parcels` collection written only from an accepted save; `/api/post/parcels` and `/api/post/claims`, checked by token. | Claude | M | F8, PO1 | Later |
| Q-receiver | **uma-quest's receiver** *(uma-quest)*: A uma-quest packet after its slice: fetch, add within caps, record the ids in its save, confirm. | Claude | M | F10, PO1 | Later |
| H-receiver | **uma-rpg's receiver** *(uma-rpg)*: An H-packet in uma-rpg after your go, since it's frozen (FM15). uma-racer's follows, in its own project. | Claude | M | Q-receiver, your go | Later |

**Exit:**

- A parcel sent from the farm is added in uma-quest and shows claimed in the Post
- A repeated fetch or confirm changes nothing

## The tasks in detail

What each task delivers, what it covers, and how we know it's done. The packet adds the context to read, the exact files and the Deliver steps, from [the handoff's template](../handoff/README.md#how-a-packet-reads).

### F3

**The hello app** · Claude · M · Needs: F2 ✓, the sign-in entries ✓ · Ready

The packet exists: [tasks/F3-hello-app.md](../handoff/tasks/F3-hello-app.md). It's ready now.

**Delivers:**

- The web app on uma-kit's shell, auth and content, as uma-rpg's
- Save v1, local first, synced with uma-rpg's conflict rule and `saveRescues`
- `apps/web/.env.production` with the "Uma Farm web" app's public config
- The manual's first page

**Covers:** R1, N2, N4, N5

**Done when:**

- You install it, sign in and see the save sync on the phone

### F4

**The rules** · Claude · M · Needs: F1 ✓ · Ready

**Delivers:**

- From uma-rpg: `items/lines.ts`, `made-id.ts`, `made.ts`, `made-v4.ts`; `economy/places-v4.ts`, `professions.ts`, `grades.ts`; Craft Level, the calling rule (FM7), the job kinds on `uma-work`, the Warehouse
- Their tests, passing unchanged first
- Save v2: each Uma's Craft Level, the Warehouse and the work rows, with the migration from v1
- Every outfit on the release in the roster (FM6)
- `docs/game/materials.md` and `loops.md`, generated

**Covers:** R2, R3, R4, R5, R7, R9, N4, N5, N6, N8, FW3, FW4

**Done when:**

- The copied tests pass, then the farm's own
- Save v2 migrates v1 and round-trips
- Nothing imports from uma-rpg

**Notes for its packet:**

- Pure domain: it can start now, beside F3 (FW4). Save v1's shape is set in F3's packet, so the migration can be written against it before F3 lands
- Copy before uma-rpg freezes (uma-quest's Q4), or record the frozen commit (FW3)

### F5

**The screens** · Claude · M · Needs: F3, F4 · Waiting

**Delivers:**

- Home: the Wilds on uma-kit's Hub map, five rows of three, with uma-art's buildings; the Forge and the Post as placeholders
- Each place's page: slot rows, the job sheet, queues, Recall, Repeat and quick looks, from `uma-kit/work`
- The Warehouse
- The worker picker on uma-kit's album over every outfit

**Covers:** R3, R6, R7, N2, N6, N9, FW6, FW7

**Done when:**

- Every line plays from gather to make on the phone
- Jobs settle after the app was closed

### F6

**Push** · Claude · S · Needs: F5 · Waiting

**Delivers:**

- `/api/push/tick` behind its own OIDC check
- The subscription flow and the "work done" notification
- `farm-push-tick` resumed (`gcloud scheduler jobs resume`)

**Covers:** R8, N7, FW8

**Done when:**

- A job finishing while the app is closed notifies the phone
- The tick answers within the free tiers

### F7

**The design spec** · Claude · L · Needs: F4 (to start), F6 play (to finish) · Waiting

**Drafted (D16):** [spec.md](spec.md) (FS1–FS32) and its page [previews/spec.html](previews/spec.html). **Farm first (D22):** [core-loop.md](core-loop.md) (FC1–FC32) defines the farm's own loop against three farm-life references; parcels wait. **Refocused (D20, accepted D21):** [hd2d-farm.md](hd2d-farm.md) (FR1–FR24) moves the farm to the HD-2D engine and replaces §4's Forge with workshops and genre minigames; F7 is rewritten once the owner has reviewed it.

**Delivers:**

- The spec in `docs/design/` at uma-rpg's class-progression.md standard, with preview pages
- FM6 measured against your play: does the crew grow?
- Targets: what replaces them (for example "uma-quest wants 10 tonics")
- The farm's own economy without fights: what it earns and spends, and whether Speed Tickets return
- The Forge: its minigame, what better play gives, its screen
- Each game's accept list and caps, written with that game's session (uma-quest's from its Q17)
- The Post's screens
- The packets for M4 and M5

**Covers:** R10, FW12

**Done when:**

- You've read and answered it
- F8, F9 and F10 are written as packets

**Notes for its packet:**

- Start it beside F4; finish it after your play

### F8

**The Forge** · Claude · M · Needs: F7, F9 (placeholders until then) · Later

**Delivers:**

- The Forge place and its page
- The minigame scene, lazy
- Results into the outbox in the save (save v3)

**Covers:** R11, N1, N5

**Done when:**

- You play the Forge and its results reach the outbox

**Notes for its packet:**

- Written as a packet after F7 (FW1)

### F9

**Art: the Forge and the Post** · ChatGPT · M · Needs: F7 · Later

**Delivers:**

- Buildings for the Hub map
- The minigame's pieces
- A uma-art minor release

**Covers:** R11

**Done when:**

- The release is published and pinned by F8
- You approved its look

**Notes for its packet:**

- This repo's session writes the packet for ChatGPT; the art ships in uma-art (change protocol)

### F10

**Parcels, the sender** · Claude · M · Needs: F8, PO1 · Later

**Delivers:**

- The outbox and the Post's screens
- `parcels/{id}` written after a save is accepted, never the save itself
- `/api/post/parcels` (a game fetches its own `sent` parcels) and `/api/post/claims` (it confirms), both by token (IN18)
- Idempotent steps, tested

**Covers:** R12, N5, FW9, FW10

**Done when:**

- A parcel reaches uma-quest and shows claimed
- Repeats change nothing

## What other repos owe

| From | What | Needed by | State |
|---|---|---|---|
| uma-rpg | The Wilds code and tests to copy, at one recorded commit | F4, F5, F6 | Available; it freezes with uma-quest's Q4 |
| uma-platform | `uma-work` and `uma-kit/work` unchanged | F4, F5 | In place |
| uma-platform (uma-art) | The Hub's buildings for the fifteen places | F5 | In place |
| uma-platform (uma-art) | The release for F9: the Forge, the Post and the minigame's pieces | F8 | After F7 |
| uma-platform | **PO1:** `uma-post` 0.1.0, the parcel format and accept lists | F10 | Packet written (P107); built after F7's answers |
| uma-quest | Its accept list (DN14's tonic, party meal and revive) and caps | F7, PO1 | Interim from the spec's FS24 once its session agrees; its Q17 settles it later (D19) |
| uma-quest | Its receiver packet | M5 | After F10 |

uma-platform's side is in its [new-apps doc](https://github.com/luismlorenzana/uma-platform/blob/main/docs/new-apps/README.md), and uma-quest's in its
[first-slice doc](https://github.com/luismlorenzana/uma-quest/blob/main/docs/design/first-slice.md).

## The order

```
M1  F3 ──────────────┐
     F4 (now) ────────┤
M2  F5 ◄── F3 + F4    │
     F6 ◄── F5        │
M3  F7 (started beside F4) ◄── your play after F6
M4  F9 (art) ◄── F7     F8 ◄── F7 (+ F9)
M5  PO1 (uma-platform) ◄── F7 answered   (uma-quest's list interim; Q17 later, D19)
     F10 ◄── F8 + PO1   →   uma-quest's receiver   →   uma-rpg's (your go)   →   uma-racer's
```

## Your steps

| When | Step | State |
|---|---|---|
| Now | The four sign-in entries | Done 2026-11-08 |
| After F3 | The phone check: install, sign in, see the save sync | Waiting |
| At F6 | Allow notifications when asked; play a few days | Waiting |
| After F7 | Read and answer the design spec | Waiting |
| At M4 | The Forge's look when ChatGPT asks; a play of the Forge | Later |
| At M5 | Your go for uma-rpg's receiver, since it's frozen | Later |

## Risks

| Risk | What keeps it small |
|---|---|
| The copy drifts from uma-rpg's Wilds | Expected (FM2): the farm owns its rules from the copy on; `uma-work` stays shared |
| uma-rpg freezes mid-copy | Pick one commit at F4's start and record it (FW3) |
| 272 outfits in a picker | uma-kit's album sorts and filters |
| The Forge isn't fun | F7 designs it and you play it in M4 before parcels depend on it |
| Parcels flood a game | Each game's caps (FM14), set by that game |
| A parcel is lost or claimed twice | The confirm-after-save rule and the game's id list; every step repeats safely |

## For the session that writes the packets

- **Read first:** this doc, [plan.md](plan.md), [decisions.md](../decisions.md), the [handoff](../handoff/README.md),
  and uma-rpg's Wilds code: its `packages/domain/src/items`, `economy` and `save`, and its web `places` and `push`.
- **One packet per task** here, keeping its id: F4–F10. F3 exists already.
  - Each follows the handoff's "How a packet reads".
  - Copy in the requirements a packet covers (R, N), the calls it rests on (FW, FM) and its Done-when checks.
- **M1–M3's packets now; M4 and M5's once F7 settles their rules** (FW1). Write each milestone's before it starts, and
  revise a written packet when an earlier one changes its inputs.
- **Art is ChatGPT's:** F9 is written here and ships in uma-art. The first uma-farm packet that uses it pins it.
- **Decisions** go in [decisions.md](../decisions.md) from D8 (fetch `main` first).
- **Across repos:** PO1 is a uma-platform task, written ahead (P107); it's built once F7 is answered (D19).

## Calls

The farm's calls for this stretch. They join FM1–FM26, and D6 logs them.

| Id | Call |
|---|---|
| FW1 | Five milestones: **M1** stood up (F3), **M2** the Wilds play (F4–F6), **M3** the design spec (F7), **M4** the Forge (F8, F9), **M5** parcels (F10, uma-platform's PO1, and the receivers). M1–M3 are the first playable farm; M4 and M5's packets are written after F7 |
| FW2 | Packets are written by uma-farm's own session from this doc, one per task, keeping its ids |
| FW3 | The copy comes from uma-rpg at one recorded commit, picked when F4 starts, before uma-rpg freezes with uma-quest's Q4 or at the frozen commit; the farm owns its rules from then on |
| FW4 | F4 can start now, beside F3: the rules are pure domain |
| FW5 | Save v2 (F4) adds Craft Level, the Warehouse and the work rows; v3 (F8) the outbox. The production-save rules hold from F3 |
| FW6 | Portrait on uma-kit's shell unchanged (FM18); Home is the Wilds map (FM19) with uma-art's existing buildings; the Forge and the Post stand as placeholders until F9 |
| FW7 | Every outfit on the release can work, with 60 slots (FM6); the worker picker is uma-kit's album; F7 revisits the crew |
| FW8 | Push resumes in F6: the paused `farm-push-tick`, the `farm-vapid` secret, and a "work done" notification copied from uma-rpg's `push/` |
| FW9 | No new cloud resources until parcels: the `parcels` collection arrives with F10, in the `farm` database |
| FW10 | Parcels wait for uma-quest's accept list (its Q17) and `uma-post` 0.1.0 (uma-platform's PO1); uma-quest receives first, then uma-rpg on your go, then uma-racer (FM15). **Amended by D19:** PO1 waits only on F7's answers, with uma-quest's list interim until Q17 |
| FW11 | `uma-work` and `uma-kit/work` stay shared and unchanged; anything they lack is a "Both apps" platform release (FM5) |
| FW12 | The design spec (F7) meets uma-rpg's class-progression.md standard and settles who works, targets, the farm's economy, the Forge, accept lists and caps, the Post and the M4–M5 queue |
| FW13 | The manual's `materials.md` and `loops.md` are generated from the code (F4), as uma-rpg's are |
