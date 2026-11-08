# Handoff: open work

> **Status: 2026-11-08, after D6.** Phase 1's cloud is live at https://uma-farm.web.app (F1, F2). **The current
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
| M1, stood up | F3 | [The hello app](tasks/F3-hello-app.md): uma-rpg's stack, Google sign-in, save v1 synced, the update prompt, the Home Screen | Claude | M | F2 ✓, the sign-in entries ✓ | **Ready** |
| M2, the Wilds play | F4 | The rules copied at a recorded commit; save v2; the manual's generated pages | Claude | M | F1 ✓ | **Ready** (no packet yet) |
| | F5 | The screens: the Wilds map, each place's page, the Warehouse, the worker picker | Claude | M | F3, F4 | To write |
| | F6 | Push: the route, `farm-push-tick` resumed, "work done" | Claude | S | F5 | To write |
| M3, the design spec | F7 | Who works, targets, the farm's economy, the Forge, accept lists and caps, the Post; the M4–M5 queue | Claude | L | F4 (to start), your play (to finish) | To write |
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
| F3 | The phone check: install, sign in, see the save sync |
| F6 | Allow notifications when asked; play a few days |
| F7 | Read and answer the design spec |
| M4, M5 | The Forge's look and a play; your go for uma-rpg's receiver |

## Done

Packets finished go here, newest first.

| Id | Task | Commit |
|---|---|---|
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
