# AGENTS.md — guide for AI coding agents

uma-farm is a personal farm game inspired by *Umamusume: Pretty Derby*, played on the owner's iPhone as a Home Screen
web app. Days are turns: Umas plant, gather, process and ship, and an authored cast brings a romance to each. Read this
before changing anything.

## Read first

1. `docs/handoff/README.md`: what's being built now. Your task is a packet in `docs/handoff/tasks/`.
2. `docs/roadmap.md`: where the game is going, phase by phase.
3. `docs/game-mechanics.md`: how the game works today. Look up any rule or screen there first. Its tables are generated
   from the code.
4. `docs/technical/architecture.md` and `docs/technical/infrastructure.md`: how it's built and where it runs.

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
- **Never import from uma-rpg, uma-racer or uma-quest.** The few pieces copied from uma-rpg (the save's envelope and
  sync, the API's save and push modules) say so at their top and are owned here.
- **No server ever writes into a save.** Parcels, when they come, are one-way: the farm sends and the games receive.
- **Docs stay true:** a rule change updates `docs/game-mechanics.md` in the same commit (`pnpm docs:update` regenerates
  its tables and every page in `docs/pages/`). A finished packet is deleted in the commit that finishes it, and its
  roadmap step leaves the roadmap. There's no decision log: the commit says what changed and why.

## Commands

Node 22+ and pnpm 10. The `@luismlorenzana/*` packages come from GitHub Packages, so export
`NODE_AUTH_TOKEN=$(gh auth token)` before installing.

| Command | What |
|---|---|
| `pnpm install` | Install the workspace |
| `pnpm lint` | Type-check every package |
| `pnpm test` | The script checks (size, private content, hosting site, the docs' pages, the story tools), then every package's Vitest |
| `pnpm build` | Build everything; the web build ends with the 180 KB size check |
| `pnpm api` | The API on :8101, auth off (`AUTH_MODE=disabled`) |
| `pnpm web` | The web app on :5194, `/api` proxied to :8101 |
| `pnpm docs:update` | Regenerate the mechanics document's tables from the rules, then the HTML pages in `docs/pages/` |
| `pnpm stories` | The Farm Story Sandbox on http://127.0.0.1:4321 (`pnpm stories:import-pack` brings uma-quest's pictures) |
| `pnpm story:release` | The story pack's release: reads the ignored `content/story/` as the game does (any pack releases; it prints what it skipped and the notes) and writes `content/story-release/` (`--stand-in` releases the invented stand-in; `--number <n> [--note "…"]` numbers the local index, for the dev server's "New story arrived") |
| `pnpm story:ship` | The story's routine, where it's written (macOS or Windows): check, release, publish (numbered one past the bucket's, dated, with `--note` or `ship.md`'s first line; files first, `story.json` last), then `story:push farm` in `../uma-platform` when it's there. `--dry-run` reads the bucket and uploads nothing; `--release <n>` rolls back. gcloud is scoped by `STORY_GCLOUD_CONFIG` (default `default`) and `STORY_GCLOUD_PROJECT` (`uma-rpg`); the bucket is `STORY_BUCKET` (`uma-farm-content`) |
| `pnpm story:publish` | The publish step alone, unnumbered: the release, uploaded to the private `gs://uma-farm-content` with the scoped gcloud (`--dry-run` lists it) |

The preview pane starts both from `.claude/launch.json` (`farm-api`, `farm-web`). To try the guard locally, run the
built API with `ALLOWED_EMAIL` set and no `AUTH_MODE`. farm-api serves the story pack's release from
`content/story-release/` (`STORY_DIR`); with none there, the dev server plays no pack: master data's first five on
the game's placeholders, as a fresh phone does.

## Conventions

- TypeScript strict with `noUncheckedIndexedAccess`; Vitest next to the code; no network in tests.
- **Landscape first at 844×390** (check 667×375): the phone held sideways, 44 pt targets, safe areas on every side.
  Sheets are side panels from the right, lists go two columns where they fit, and held upright the app shows the
  "Turn your phone sideways" card.
- **Main JS ≤ 180 KB gzip.** The Hub map and every page but Account load on demand.
- **Player-facing text is short:** labels, counts, buttons and plain empty states. Explanations go behind a help button.
- Conventional Commits; the body explains why.
