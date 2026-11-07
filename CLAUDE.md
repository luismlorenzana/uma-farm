# uma-farm — working notes for Claude

- Before working here, read the cross-game plan in the sibling repo: `../uma-platform/docs/architecture.md`,
  `roadmap.md` and `decisions.md` (also on GitHub at `luismlorenzana/uma-platform`).
- **Start with [docs/handoff/README.md](docs/handoff/README.md):** the current phase, the packet queue and the owner's
  steps. The plan is [docs/design/plan.md](docs/design/plan.md); its calls keep their ids (FM, and IN for the cloud).
  New decisions go in `docs/decisions.md` from D4 (fetch `main` first). Packets are F-numbered from F4.
- **`docs/game/` is the manual of the game as built.** It starts with F3. Every rule change keeps it in step.
- This game stands alone: its own save, rules and economy. It reads master data from uma-platform by stable IDs only,
  and never imports from uma-rpg, uma-racer or uma-quest at runtime.
  - The Wilds are copied from uma-rpg at a recorded commit with their tests (FM2), never imported. uma-rpg keeps its own.
  - **Parcels are one-way** (P89, FM10): the farm sends and the games receive. No server ever writes into a save, the
    farm's or a game's. Each game's accept list and caps (FM14) are that game's to set.
- Shared changes (master data schema, shared packages, `uma-work`, `uma-kit/work`, `uma-post`, original art) happen in a
  uma-platform session as a request ([change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)),
  never a fork here.
- **Original-game content never goes in git:** no master data, outfit or character names, or Uma art. Test fixtures come
  from `@luismlorenzana/uma-data/testing`. Check `git status` before every commit;
  `scripts/check-private-content.test.mjs` runs in CI.
- **Claude commits and pushes to `main`** in Conventional Commits style. Delegated agents use a branch and a pull request.
  Claude merges and deploys its own packets unasked; ChatGPT may merge its own. When Claude reviews a ChatGPT pull
  request, it sends back only must-fixes (a broken rule, original-game content, a failing check, a real bug).
- **Art is ChatGPT's end to end:** every art packet goes to ChatGPT, which draws, merges, versions and publishes the
  uma-art release. The uma-farm packet that first uses the art pins it. Claude never publishes uma-art. If a ChatGPT
  code packet blocks a release, Claude takes it; art stays ChatGPT's.

## How the owner works

- **No open questions:** decide with a recommendation when a sensible default exists, and log it.
- **Plain answers:** answer the literal question first. Prefer the smallest fix over a redesign, and use a task table
  when work spreads.
- **Scope:** build the owner's spec literally, with no inherited filters. Deferred topics are discussion only.
- **The owner runs nothing:** never hand them a command. Ask a one-line go-ahead before a production publish, then run it
  yourself. Creating cloud resources, changing IAM and anything public need their go.
- **Reviews and status messages:**
  - list every HTML page and doc as a clickable link;
  - present every call (its id and one line), not highlights.
- **Docs:** clear, visual, full depth, each with a desktop HTML page. uma-rpg's
  `docs/design/tier-rework/class-progression.md` is the bar.
- **Lean assets:** features first, and the cheapest art that looks fine; no heavy pipelines.
- **Cloud cost up front:** a free-tier cost table whenever a cloud resource is added.
- **Production saves:**
  - never move `save.account.updatedAt`;
  - never write into a save from a server;
  - a stale server date means stop and ask.

  These come from uma-rpg's 2026-10-30 incident, where a hand grant wiped unsynced progress.

## Building and running

Nothing runs yet. F1 adds the workspace and its commands (in `AGENTS.md`), and `.claude/launch.json` with `farm-api`
(:8101) and `farm-web` (:5194). The preview pane can't screenshot WebGL: open the Hub with `?canvas`, as in uma-rpg, once
the Wilds map arrives (F5).

## Production (from F2)

[docs/technical/infrastructure.md](docs/technical/infrastructure.md) has every value. The cloud lives in GCP project
`uma-rpg`, beside uma-rpg and uma-quest, each app isolated: site https://uma-farm.web.app, Cloud Run `farm-api`, and
Firestore database `farm`. From F2, every push to `main` verifies and deploys; watch it with
`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`.

**Never change the active gcloud account.** Scope commands with
`CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg`, and never run `gcloud config set`. Never touch
uma-rpg's or uma-quest's pieces in that project. Never type credentials into sign-in pages.
