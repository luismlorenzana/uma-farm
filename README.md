# uma-farm

A personal, never-distributed farm inspired by *Umamusume: Pretty Derby*, played on the owner's iPhone as a Home Screen
web app. Umas gather, process and make across five lines, as in uma-rpg's Wilds. A Forge minigame then turns those base
items into the other Uma games' items, sent as one-way parcels to uma-quest, uma-rpg and uma-racer.

**Status (2026-11-08):** the workspace and its checks are in (F1): a placeholder web page, an API behind the owner
guard, and the domain package, installing all five platform packages. Next is F2, the cloud.

## Layout

| Path | What |
|---|---|
| `apps/web` | `@farm/web`: Vite, React 19 and uma-kit's theme. A placeholder page until F3 |
| `apps/api` | `@farm/api`: NestJS 11 behind uma-server's owner guard: `/api/health`, `/api/save` and `/api/post/ping` (its own token check) |
| `packages/domain` | `@farm/domain`: the game's rules, pure, no I/O |
| `scripts/` | The 180 KB size check and the private-content guard, each with tests |
| `.github/workflows/deploy.yml` | Verify on every push and pull request; the deploy job comes with F2 |

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
