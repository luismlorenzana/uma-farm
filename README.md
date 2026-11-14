# uma-farm

A personal farm game inspired by *Umamusume: Pretty Derby*, played on the owner's iPhone as a Home Screen web app at
https://uma-farm.web.app. It's never public: only the owner's Google account can sign in. Days are turns: you plant,
gather, process and ship with a roster of Umas, end the day, and read the morning. Next, per the roadmap: every
character lives in town, you choose who to meet, and her story, written by the owner over time, unlocks as story packs
arrive. It's played with the phone held sideways, and the rework in [the roadmap](docs/roadmap.md) is turning it into a
day of actions on a tile farm.

## Where things are

| Path | What |
|---|---|
| [docs/roadmap.md](docs/roadmap.md) | **Start here:** where the farm stands, what a full game means, and the phases to it ([page](docs/pages/roadmap.html)) |
| [docs/design/game-design.md](docs/design/game-design.md) | What the game is to play: the fantasy, a sitting, the rhythm, the arc, the first real season ([page](docs/pages/game-design.html)) |
| [docs/game-mechanics.md](docs/game-mechanics.md) | How the game works today, with its tables generated from the code ([page](docs/pages/game-mechanics.html)) |
| [docs/handoff/README.md](docs/handoff/README.md) | What's being built now, the open packets, and the owner's steps ([page](docs/pages/handoff.html)) |
| [docs/technical/architecture.md](docs/technical/architecture.md) | The app, the API, the save and its sync, builds, deploy, local setup ([page](docs/pages/architecture.html)) |
| [docs/technical/infrastructure.md](docs/technical/infrastructure.md) | Every cloud value ([page](docs/pages/infrastructure.html)) |
| [docs/design/her-look.md](docs/design/her-look.md) | Her outfits and the 22 expressions the busts show ([page](docs/pages/her-look.html)) |
| `docs/story/` | The story's original drafts, read by the Farm Story Sandbox |
| [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) | How to work here |

## Layout

| Path | What |
|---|---|
| `apps/web` | `@farm/web`: React 19, Vite, Zustand, Dexie and uma-kit, an installable web app, laid out in landscape |
| `apps/api` | `@farm/api`: NestJS on Cloud Run behind uma-server's owner guard: the save, the story pack, push and the parcel ping |
| `packages/domain` | `@farm/domain`: the game's rules, pure, no I/O |
| `scripts/` | The size budget, the private-content guard, the hosting-site check, the story pack's release and publish, the docs' pages |
| `tools/story-sandbox` | The Farm Story Sandbox: write and read the story locally (`pnpm stories`) |
| `infra/bootstrap.sh` | The cloud's setup, safe to re-run |
| `.github/workflows/deploy.yml` | Lint, test and build on every push and pull request; every push to `main` deploys |

## The other Uma repos

- **uma-platform:** the shared master data and packages (uma-data, uma-kit, uma-work, uma-server, uma-art).
- **uma-quest:** the HD-2D travelers RPG; it shares the story's way of working.
- **uma-rpg:** the party RPG, frozen. Its GCP project hosts the farm's cloud.
- **uma-racer:** the racing game.
