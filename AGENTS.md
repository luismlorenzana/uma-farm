# AGENTS.md — guide for AI coding agents

uma-farm is a personal, never-distributed farm inspired by *Umamusume: Pretty Derby*, played on the owner's iPhone as a
Home Screen web app. Umas gather, process and make, and a Forge sends the other Uma games their items as one-way
parcels. Read this before changing anything.

## Read first

1. `docs/handoff/README.md`: the current phase and its queue. Your task is a packet in `docs/handoff/tasks/`.
   The current initiative is `docs/design/core-loop.md` (the farm's own loop, D26) on `docs/design/hd2d-farm.md` (D21);
   `docs/design/first-playable.md` is M1–M2's brief, done.
2. `docs/game/`: the manual of the game as built. It is empty until F3; after that, look up any rule or screen there first.
3. `docs/design/`: the plan, its specs and intent. When a design changes a rule, update the manual in the
   same change.
4. `docs/decisions.md` (append-only, from D1), and the cross-game plan in uma-platform `docs/architecture.md`.

## Hard rules

- **Original-game content never goes in git.**
  - Master data comes from uma-platform's private release, and test fixtures from `@luismlorenzana/uma-data/testing`.
  - Screenshots showing original art stay local.
  - `scripts/check-private-content.test.mjs` runs in CI.
- **Don't push to `main`.** Work on `feat/…`, `fix/…` or `docs/…` and open a pull request. CI must pass.
- **Owner-authorized agent delivery:** use `gh` only for GitHub. After CI passes, merge the pull request and publish any
  needed uma-art release; no further owner approval is needed. Never bypass repository protection. Use worktrees outside
  `~/workspace`, and remove them after merging, preserving unfinished work.
- **Don't touch production infrastructure** unless your task says so: `.github/workflows/`, `infra/`, `firebase.json`,
  `.env.production` and `apps/api/Dockerfile`. GCP project `uma-rpg` also runs uma-rpg and uma-quest: never touch their
  pieces.
- **Never import from uma-rpg, uma-racer or uma-quest.** The Wilds' rules are copied from uma-rpg at a recorded commit,
  with their tests (FM2); their screens were retired in F24, and the rules stay for save v2's migration.
- **Parcels are one-way, and no server writes into a save** (FM10, FM11). A parcel lives in `farm-api`'s `parcels` and is
  claimed exactly once.
- **Logs:** append decision rows and never edit old ones. A finished packet is deleted in the commit that finishes it,
  with a Done row in the handoff README.

## Commands

Node 22+ and pnpm 10. The `@luismlorenzana/*` packages come from GitHub Packages, so export
`NODE_AUTH_TOKEN=$(gh auth token)` before installing.

| Command | What |
|---|---|
| `pnpm install` | Install the workspace |
| `pnpm lint` | Type-check every package |
| `pnpm test` | The script checks (size, private content), then every package's Vitest |
| `pnpm build` | Build everything; the web build ends with the 180 KB size check |
| `pnpm api` | The API on :8101, auth off (`AUTH_MODE=disabled`) |
| `pnpm web` | The web app on :5194, `/api` proxied to :8101 |
| `pnpm story:release` | The story pack's release: checks the ignored `content/story/` and writes `content/story-release/` (`--stand-in` releases the invented stand-in) |
| `pnpm story:publish` | The release, uploaded to the private `gs://uma-farm-content` with the scoped gcloud (`--dry-run` lists it) |

The preview pane starts both from `.claude/launch.json` (`farm-api`, `farm-web`). To try the guard locally, run the
built API with `ALLOWED_EMAIL` set and no `AUTH_MODE`. farm-api serves the story pack's release from
`content/story-release/` (`STORY_DIR`); with none there, the dev server plays the invented stand-in.

## Conventions

- TypeScript strict with `noUncheckedIndexedAccess`; Vitest next to the code; no network in tests.
- **Mobile first at 390×844 portrait** (check 375×667): 44 pt targets, safe areas, `h-dvh` (FM18).
- **Main JS ≤ 180 KB gzip** (FM20). The Hub map and the Forge's scene load on demand.
- **Player-facing text is short:** labels, counts, buttons and plain empty states. Explanations go behind a help button.
- Conventional Commits; the body explains why.
