# Handoff: open work

> **Status: 2026-11-07, after D3.** The repo exists with its plan and its private-content guard. There is no code yet.
> **The current phase is Phase 1: the repo, the cloud and the hello app** ([the plan](../design/plan.md#phase-1-the-repo-the-cloud-and-the-hello-app-claude-s--m--m)).
>
> - **The manual of the game as built** will be [docs/game/](../game/README.md). It starts with F3.
> - Each task is a self-contained packet in [tasks/](tasks/). Start a worker, Claude or ChatGPT, with uma-platform's
>   [master prompt](https://github.com/luismlorenzana/uma-platform/blob/main/docs/handoff/master-prompt.md) and name the
>   packet: "Take F1".
> - Workers decide what a packet leaves open, record it, and flag their own packets done: delete the packet and add a
>   Done row below. Claude merges and deploys its own finished packets; ChatGPT merges its own.

## Phase 1: the repo, the cloud and the hello app

Packet ids continue from F7 (F4–F6 are the plan's); decision numbers from D4.

| Id | What | Who | Size | Needs | State |
|---|---|---|---|---|---|
| F1 | [The workspace and its checks](tasks/F1-workspace.md): placeholders installing all five platform packages, `/api/post/ping`'s token check, CI, ports 8101 and 5194 | Claude | S | The owner's five package-access entries, for CI | **Ready** |
| F2 | [The cloud, the pipeline and the ping](tasks/F2-cloud.md): `infra/bootstrap.sh`'s nine pieces in the `uma-rpg` project, push paused, the deploy, the site check, `POST_CALLERS`, the isolation rows | Claude | M | F1; uma-rpg's H169; the owner's go | Waiting on H169 |
| F3 | [The hello app](tasks/F3-hello-app.md): uma-rpg's stack, Google sign-in, save v1 synced, the update prompt, the Home Screen | Claude | M | F2; the owner's two sign-in entries | After F2 |

**Order:** F1 can start now, in parallel with uma-rpg's H169 and uma-quest's Q1. F2 follows H169; uma-quest's Q2 then
calls its ping. F3 follows F2.

## Later phases

Each phase's packets are written when it starts, from [the plan](../design/plan.md):

| Id | What | Who | Needs |
|---|---|---|---|
| F4 | The Wilds' rules copied from uma-rpg at a recorded commit: lines, grades, items, places, trades, Craft Level, jobs on `uma-work`, the Warehouse; save v2 | Claude | F3 |
| F5 | The Wilds' screens: Home as the Wilds map, each place's page on `uma-kit/work`, the Warehouse | Claude | F4 |
| F6 | Push: the route, `farm-push-tick` resumed, "work done" | Claude | F5 |
| — | Phase 3, the design spec: who works, targets, the farm's economy, the Forge, each game's accept list and caps, the Post | Claude, docs | Beside F4–F6 |
| — | Phase 4, the Forge; its art | Claude; ChatGPT | Phase 3 |
| — | Phase 5, parcels: `uma-post` in uma-platform, the sender here, then each game's receiver | Claude across repos | Phase 4; uma-quest's item list |

## Across the repos

- **uma-rpg:** H169 (its project hardened) comes before F2. Its receiver is a packet there, after the owner's go (FM15).
- **uma-quest:** its Q2 calls the ping; its Phase 4 names the consumables it takes (its D4), which opens Phase 5.
- **uma-platform:** P88 and P89 are logged. `uma-post` (FM12) is built there before Phase 5, and any `uma-work` or
  `uma-kit/work` change is a platform release (FM5).
- **uma-racer:** its receiver comes last, flair only (FM13), with `racer-api-runtime` added to `POST_CALLERS`.

## The owner's steps

| When | What |
|---|---|
| Now | One word: make the repo public (FM1, IN14, free Actions minutes) or keep it private |
| For F1's CI | On GitHub, for `uma-data`, `uma-kit`, `uma-work`, `uma-server` and `uma-art`: Package settings → **Manage Actions access** → add `uma-farm` with **Read** |
| F2 | The go for the cloud; then the two sign-in entries for `uma-farm.web.app` in the Cloud console |
| F3 | The phone check: install, sign in, see the save sync |

## Done

Packets finished go here, newest first.

| Id | Task | Commit |
|---|---|---|

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
