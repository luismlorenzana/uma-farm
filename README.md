# uma-farm

A personal, never-distributed farm inspired by *Umamusume: Pretty Derby*, played on the owner's iPhone as a Home Screen
web app. Umas gather, process and make across five lines, as in uma-rpg's Wilds. A Forge minigame then turns those base
items into the other Uma games' items, sent as one-way parcels to uma-quest, uma-rpg and uma-racer.

**Status (2026-11-07):** the repo, its plan and its private-content guard exist; there's no code yet. Phase 1 is
current: F1, the workspace, is ready.

## Where things are

| Path | What |
|---|---|
| [docs/handoff/README.md](docs/handoff/README.md) | **Start here:** the current phase, its packets and the owner's steps |
| [docs/design/plan.md](docs/design/plan.md) | The plan: Phases 0–5, the calls FM1–FM26, how a parcel travels ([page](docs/design/previews/plan.html)) |
| [docs/decisions.md](docs/decisions.md) | The decision log, from D1 |
| [docs/technical/infrastructure.md](docs/technical/infrastructure.md) | Every cloud value (planned until F2) |
| [docs/game/](docs/game/README.md) | The manual of the game as built, from F3 |
| [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) | How to work here |

## The other Uma repos

- **uma-platform:** the cross-game plan (`docs/architecture.md`, `roadmap.md`, `decisions.md`), master data, and the
  shared packages uma-data, uma-kit, uma-work, uma-server and uma-art. `uma-post`, the parcel format, will live there.
- **uma-rpg:** the live party RPG, whose Wilds the farm copies (FM2). Its GCP project hosts the farm's cloud, and its
  [cloud plan](https://github.com/luismlorenzana/uma-rpg/blob/main/docs/design/cloud/plan.md) sets up all three apps.
- **uma-quest:** the HD-2D travelers RPG, the farm's first receiver (DN14's consumables).
- **uma-racer:** the racing game, which receives flair only, last.
