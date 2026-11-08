# Handoff: open work

> **Status: 2026-11-08, after D18.** M1 is met (D13). M2 is live: the Wilds play at [uma-farm.web.app](https://uma-farm.web.app) (F4, F5) and push is deployed (F6), with notifications off by the owner's choice (D18). **Next: the owner answers F7's draft spec** ([spec.md](../design/spec.md), [page](../design/previews/spec.html)), whose Forge, economy, accept-list and Post calls unblock M4's and M5's packets (F8–F10); who works (FS1–FS3) is settled later from the play.
> initiative is [the first playable farm](../design/first-playable.md)** (FW1–FW13,
> [page](../design/previews/first-playable.html)): its requirements and every planned task, from the hello app (F3) to the
> Wilds playing, the design spec, then the Forge and parcels.
>
> - **The manual of the game as built** will be [docs/game/](../game/README.md). It starts with F3.
> - Each task is a self-contained packet in [tasks/](tasks/). Start a worker, Claude or ChatGPT, with uma-platform's
>   [master prompt](https://github.com/luismlorenzana/uma-platform/blob/main/docs/handoff/master-prompt.md) and name the
>   packet: "Take F1".
> - Workers decide what a packet leaves open, record it, and flag their own packets done: delete the packet and add a
>   Done row below. Claude merges and deploys its own finished packets; ChatGPT merges its own.

## The first playable farm

Each task becomes a packet in [tasks/](tasks/), written by a uma-farm session from
[first-playable.md](../design/first-playable.md), which has every task's deliverables and checks. Packet ids continue
from F11 (F3–F10 are the doc's); decision numbers from D8.

| Milestone | Id | What | Who | Size | Needs | State |
|---|---|---|---|---|---|---|
| M1, stood up | F3 | The hello app: uma-rpg's stack, Google sign-in, save v1 synced, the update prompt, the Home Screen | Claude | M | F2 ✓, the sign-in entries ✓ | **Done** (D9); phone check passed (D13) |
| M2, the Wilds play | F4 | The rules: uma-rpg's Wilds rules copied at `30a322a` with their tests; save v2; the manual's generated pages | Claude | M | F1 ✓ | **Done** (D10) |
| | F5 | The screens: the Wilds map, each place's page, the Warehouse, the worker picker | Claude | M | F3 ✓, F4 ✓ | **Done** (D12) |
| | F6 | Push: the route, `farm-push-tick` resumed, "work done" | Claude | S | F5 ✓ | **Done** (D14); the tick runs (D15) |
| M3, the design spec | F7 | [The design spec](tasks/F7-design-spec.md): who works, targets, the farm's economy, the Forge, accept lists and caps, the Post; the M4–M5 queue. The draft: [spec.md](../design/spec.md) (FS1–FS32), [its page](../design/previews/spec.html) | Claude | L | F4 (to start), your play (to finish) | **Drafted** (D16), waits on the owner's play and uma-quest's Q17 |
| M4, the Forge | F8 | The Forge's place and minigame, results into the outbox | Claude | M | F7 | After F7 |
| | F9 | Art: the Forge and the Post (ChatGPT, uma-art) | ChatGPT | M | F7 | After F7 |
| M5, parcels | F10 | The sender: the outbox, `parcels`, `/api/post/parcels` and `/api/post/claims` | Claude | M | F8, uma-platform PO1 | After F7 |

**Order:** F3 first, and F4 beside it. The full order is in [the doc](../design/first-playable.md#the-order).

## Across the repos

- **uma-rpg:** H169 (its project hardened) is done (uma-rpg D311). Its receiver is a packet there, after the owner's go (FM15).
- **uma-quest:** its Q2 calls the ping (live with its Q14); its Q17, the design spec, names the consumables it takes (its D4), which opens M5.
- **uma-platform:** P88 and P89 are logged. `uma-post` (FM12) is its PO1, built before M5 ([its new-apps doc](https://github.com/luismlorenzana/uma-platform/blob/main/docs/new-apps/README.md)), and any `uma-work` or
  `uma-kit/work` change is a platform release (FM5).
- **uma-racer:** its receiver comes last, flair only (FM13), with `racer-api-runtime` added to `POST_CALLERS`.

## The owner's steps

| When | What |
|---|---|
| ~~Now~~ Done 2026-11-08 | **Kept private** (the owner's word; D-decision below). One word: make the repo public (FM1, IN14, free Actions minutes) or keep it private |
| ~~For F1's CI~~ Done 2026-11-08 | On GitHub, for `uma-data`, `uma-kit`, `uma-work`, `uma-server` and `uma-art`: Package settings → **Manage Actions access** → add `uma-farm` with **Read** |
| ~~F2~~ Done 2026-11-08 | The go for the cloud, and the two sign-in entries for `uma-farm.web.app` (added by the owner) |
| ~~F3~~ Done 2026-11-08 | The phone check: installed from Safari, signed in inside the Home Screen app, the save synced (D13) |
| ~~F5~~ Done 2026-11-08 | The Wilds on the phone: the owner's word, "Wilds work" (D15) |
| ~~F6~~ Declined 2026-11-08 | Notifications: not now, the owner's choice (D18). The tick stays deployed and sends nothing while no phone subscribes |
| **F7, now** | **Read and answer the design spec:** [spec.md](../design/spec.md) and [its page](../design/previews/spec.html). Its questions 2–13 (the Forge, orders, the economy, accept lists, the Post) can be answered now; question 1 (who works) waits for a few days of play |
| M4, M5 | The Forge's look and a play; your go for uma-rpg's receiver |

## Done

Packets finished go here, newest first.

| Id | Task | Commit |
|---|---|---|
| F6 | Push (D14, [architecture.md](../game/architecture.md#notifications-f6)): uma-rpg's push copied at `30a322a` and cut so the server never reads a save (FM10). The app sends `pushSchedule` (every slot going idle, with the badge then) after every sync and as it goes to the background; `PUT /api/push/schedule` keeps it in `push/{uid}` in the `farm` database. The tick (`POST /api/push/tick`, public at the owner guard, its own OIDC guard: 401 unsigned, 403 another account) makes one "Work done" notification by place ("Mine: 2 jobs done") of what came due and drops dead devices. Account's Notifications switch subscribes after the owner allows them, with **Send a test**; `push-sw.js` through Workbox's `importScripts`; the badge clears on open. `GET /api/push/key` and `POST /api/push/test` added. Main JS 155 KB gzip. Checked locally: the routes answer cleanly without VAPID keys, the card shows, the schedule goes out after a sync and on going to the background. **The tick resumes after the deploy** (the main session: the unsigned 401, then `gcloud scheduler jobs resume`). [Pull request #3](https://github.com/luismlorenzana/uma-farm/pull/3) [The deploy](https://github.com/luismlorenzana/uma-farm/actions/runs/42513756743) passed; the tick refused unsigned and forged calls, was resumed, and its first run answered 200 (D15) | `63e8991` |
| F5 | The screens (D12, [wilds.md](../game/wilds.md)): Home is the Wilds on uma-kit's Hub map, five rows of three on uma-art's buildings with arch pips, Ready badges, Collect all and a help button, the Forge and the Post as "Soon" placeholders in a sixth row; each place's page on uma-kit/work (four slot rows, the job sheet, queues, Recall, Repeat, stopped queues, quick looks), no speed-up; the Warehouse on the kit's shelf view, no selling; the worker picker on the kit's album over all 272 outfits on the release, her trade first, the rest "Another trade", Trade as a facet. Copied from uma-rpg's web at `30a322a` and cut ([wilds-copy.md](../technical/wilds-copy.md)); every action reads the save right before its rule (`edit`). Dismiss now settles first (a domain fix). The map and pages load on demand, Phaser in `LAZY_MODULES`; main JS 153 KB gzip. Checked locally at 390 × 844 and 375 × 667: an Uma at each of the fifteen places, a gather → process → make chain into the Warehouse, a queue, Repeat, Recall, Dismiss, settling after reopening. [Pull request #2](https://github.com/luismlorenzana/uma-farm/pull/2); the phone check waits on its deploy [The deploy](https://github.com/luismlorenzana/uma-farm/actions/runs/42511774814) passed (D13) | `feat/f5-screens` |
| F4 | The rules (D10): uma-rpg's Wilds copied at `30a322a` into `@farm/domain`, the live generation only, every cut in [wilds-copy.md](../technical/wilds-copy.md); the copied tests green in their own commit (43) before the farm's changes. Save v2 (`umas`, `items`, `buildings`, `work`) migrates v1 without moving `account.updatedAt`; every outfit on the release may work, her trade from her best running styles; the work operations take the save and stamp each change. A domain test runs every line G1 → G10. The manual's [materials.md](../game/materials.md) and [loops.md](../game/loops.md) are generated (`pnpm docs:update`). 62 domain tests. [Pull request #1](https://github.com/luismlorenzana/uma-farm/pull/1) [The deploy](https://github.com/luismlorenzana/uma-farm/actions/runs/42508150423) passed; the update prompt and Restart were checked on it (D11) | `feat/f4-rules` |
| F3 | The hello app (D9): uma-kit's gates, shell and Account; save v1 local first in Dexie and synced through `GET`/`PUT /api/save` on the `farm` database with uma-rpg's revisions, conflict rule, safety copies, `saveRescues` and `saveBackups`; master data through uma-server's proxy; the PWA (portrait, standalone, a pixel F icon) with the kit's update prompt; main JS 137 KB gzip. [The deploy](https://github.com/luismlorenzana/uma-farm/actions/runs/42506978543) passed every check. The manual starts: [architecture.md](../game/architecture.md). The owner's phone check passed on 2026-11-08 (D13) | `3ca2387` |
| F2 | The cloud, the pipeline and the ping (D5): `infra/bootstrap.sh` made every piece (database `farm`, `farm-api-runtime`, images `farm`, `farm-api`, `farm-deploy`, provider `uma-farm`, site `uma-farm`, web app, authorized domain, `farm-vapid`, `farm-push-scheduler` and `farm-push-tick`, paused). [The first deploy](https://github.com/luismlorenzana/uma-farm/actions/runs/42498869774) passed every check: health 200 with the commit directly and through the site, `/api/save` 401, the shell `no-cache`, uma-rpg still answering. Every isolation cell came back as planned ([infrastructure.md](../technical/infrastructure.md)). `/api/post/ping` answers 401 without a token and for the owner's own token (not on `POST_CALLERS`); its success is uma-quest's Q2 calling it, which landed second and waits on Q14's sign-in for its live call. The budget still lists the project | `cddd6e7` |
| F1 | The workspace and its checks (D4): pnpm 10.33.0 and turbo; `@farm/web`, `@farm/api` and `@farm/domain`, installing uma-data 1.4.0, uma-kit 0.17.0, uma-work 0.1.0, uma-server 0.2.0 and uma-art 2.21.0; lint, tests, build, the 180 KB size check (69.4 KB) and the private-content guard; CI's verify job. Locally with the guard on: health 200, save 401, ping 401, the page and its proxied health on :5194 | `this commit` |

## How a packet reads

Each packet stands alone:
- **Why** the work matters;
- **Context:** what to read and what exists;
- **Decisions made:** the decisions already taken;
- **Do:** the work;
- **Done when:** checks anyone can run;
- **Deliver:** the commit or pull request, and how to flag it done.

A worker decides anything a packet leaves open, records it under Decisions, and logs the packet's D-decision in
[decisions.md](../decisions.md) (fetch `main` first for the number).
