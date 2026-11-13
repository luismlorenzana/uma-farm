# uma-farm

A personal farm game inspired by *Umamusume: Pretty Derby*, played on the owner's iPhone as a Home Screen web app at
https://uma-farm.web.app. Days are turns: you plant, gather, process and ship with a roster of Umas, end the day, and
read the morning. The farm's Umas are an authored cast with a romance to each, written by the owner (built, switched off
until the story ships), and the farm is moving onto an HD-2D stage (an opt-in preview today).

## Where things are

| Path | What |
|---|---|
| [docs/roadmap.md](docs/roadmap.md) | **Start here:** where the farm stands, what a full game means, and the phases to it ([page](docs/pages/roadmap.html)) |
| [docs/game-mechanics.md](docs/game-mechanics.md) | How the game works today, with its tables generated from the code ([page](docs/pages/game-mechanics.html)) |
| [docs/handoff/README.md](docs/handoff/README.md) | What's being built now, the open packets, and the owner's steps ([page](docs/pages/handoff.html)) |
| [docs/technical/architecture.md](docs/technical/architecture.md) | The app, the API, the save and its sync, builds, deploy, local setup ([page](docs/pages/architecture.html)) |
| [docs/technical/infrastructure.md](docs/technical/infrastructure.md) | Every cloud value ([page](docs/pages/infrastructure.html)) |
| [docs/design/kit-farm.md](docs/design/kit-farm.md) | The HD-2D farm kit's art contract ([page](docs/pages/kit-farm.html)) |
| `docs/story/` | The story's original drafts, read by the Farm Story Sandbox |
| [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) | How to work here |

## Layout

| Path | What |
|---|---|
| `apps/web` | `@farm/web`: React 19, Vite, Zustand, Dexie and uma-kit, an installable web app; the HD-2D stage loads on demand |
| `apps/api` | `@farm/api`: NestJS on Cloud Run behind uma-server's owner guard: the save, the story pack, push and the parcel ping |
| `packages/domain` | `@farm/domain`: the game's rules, pure, no I/O |
| `scripts/` | The size budget, the private-content guard, the hosting-site check, the story pack's release and publish, the docs' pages |
| `tools/story-sandbox` | The Farm Story Sandbox: write and read the story locally (`pnpm stories`) |
| `infra/bootstrap.sh` | The cloud's setup, safe to re-run |
| `.github/workflows/deploy.yml` | Lint, test and build on every push and pull request; every push to `main` deploys |

## The other Uma repos

- **uma-platform:** the shared master data and packages (uma-data, uma-kit, uma-work, uma-server, uma-art, uma-stage).
- **uma-quest:** the HD-2D travelers RPG; it shares the stage and the story's way of working.
- **uma-rpg:** the party RPG, frozen. Its GCP project hosts the farm's cloud.
- **uma-racer:** the racing game.
