# AGENTS.md — guide for AI coding agents

uma-farm is a personal, never-distributed farm inspired by *Umamusume: Pretty Derby*, played on the owner's iPhone as a
Home Screen web app. Umas gather, process and make, and a Forge sends the other Uma games their items as one-way
parcels. Read this before changing anything.

## Read first

1. `docs/handoff/README.md`: the current phase and its queue. Your task is a packet in `docs/handoff/tasks/`.
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
- **Never import from uma-rpg, uma-racer or uma-quest.** The Wilds are copied from uma-rpg at a recorded commit, with
  their tests (FM2).
- **Parcels are one-way, and no server writes into a save** (FM10, FM11). A parcel lives in `farm-api`'s `parcels` and is
  claimed exactly once.
- **Logs:** append decision rows and never edit old ones. A finished packet is deleted in the commit that finishes it,
  with a Done row in the handoff README.

## Commands

None yet. F1 adds the workspace (Node 22+ and pnpm 10, with `@luismlorenzana/*` packages from GitHub Packages) and
lists its commands here.

## Conventions

- TypeScript strict with `noUncheckedIndexedAccess`; Vitest next to the code; no network in tests.
- **Mobile first at 390×844 portrait** (check 375×667): 44 pt targets, safe areas, `h-dvh` (FM18).
- **Main JS ≤ 180 KB gzip** (FM20). The Hub map and the Forge's scene load on demand.
- **Player-facing text is short:** labels, counts, buttons and plain empty states. Explanations go behind a help button.
- Conventional Commits; the body explains why.
