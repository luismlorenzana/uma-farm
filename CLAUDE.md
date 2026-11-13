# uma-farm — working notes for Claude

- Before working here, read the cross-game plan in the sibling repo: `../uma-platform/docs/architecture.md`,
  `roadmap.md` and `decisions.md` (also on GitHub at `luismlorenzana/uma-platform`).
- **Where the game is going: [the roadmap](docs/roadmap.md),** from today's sandbox to a full game in Phases 0–5. **How
  it works today: [the game mechanics](docs/game-mechanics.md),** with its tables generated from the code.
- **Start with [docs/handoff/README.md](docs/handoff/README.md):** what's being built now, the open packets and the
  owner's steps. Packets are written from the roadmap, one per piece, as each starts; new ones are numbered from F61.
- **There's no decision log.** A call the owner makes goes into the roadmap or the mechanics document it changes, and
  the commit says what changed and why. Git keeps the history; old docs are never restored into the tree.
- **`docs/game-mechanics.md` is the game as built.** Every rule change updates it in the same commit, and
  `pnpm docs:update` regenerates its tables and every HTML page in `docs/pages/`.
- This game stands alone: its own save, rules and economy. It reads master data from uma-platform by stable IDs only,
  and never imports from uma-rpg, uma-racer or uma-quest at runtime.
  - Save v4 is the only save: an older one starts over on the device, and the server keeps it in `saveBackups`.
  - **Parcels are one-way** (parked until the farm's own game is done): the farm sends and the games receive. No server
    ever writes into a save, the farm's or a game's. Each game's accept list and caps are that game's to set.
- Shared changes (master data schema, shared packages, `uma-work`, `uma-kit/work`, `uma-post`, original art) happen in a
  uma-platform session as a request ([change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)),
  never a fork here.
- **Original-game content never goes in git:** no master data, outfit or character names, or Uma art. Test fixtures come
  from `@luismlorenzana/uma-data/testing`. Check `git status` before every commit;
  `scripts/check-private-content.test.mjs` runs in CI.
- **Claude commits and pushes to `main`** in Conventional Commits style. Delegated agents use a branch and a pull request.
  Claude merges and deploys its own packets unasked; ChatGPT may merge its own. When Claude reviews a ChatGPT pull
  request, it sends back only must-fixes (a broken rule, original-game content, a failing check, a real bug).
- **Art is split by kind (the owner, 2026-11-11 and 2026-11-12):** **ChatGPT draws
  character art only, end to end** (Uma sprites and keys, farm-work poses, enemies, the cast's busts and any other
  character portrait), and publishes those uma-art releases. **Claude draws all other art in code** (uma-platform's
  `scripts/pixel-art`: items, UI marks, crests, 48 px buildings, animal icons; and the HD-2D kits such as `kit-farm`)
  **and the art tools,** and versions and publishes those uma-art releases in a uma-platform session. A packet with both splits into parts, one per worker. The uma-farm packet that first uses the art pins it. If
  a ChatGPT code packet blocks a release, Claude takes it.

## Autonomy: what you do without asking

The owner gave every session full autonomy to commit, publish and deploy (2026-11-08). Do the work end to end:
- **Commit and push to `main`** (Conventional Commits; `git status` first). Every push to `main` checks and deploys
  production at https://uma-farm.web.app. Watch the run with `gh run watch <id> -R luismlorenzana/uma-farm --exit-status`,
  and fix forward if it fails.
- **Write packets ahead:** the next piece's packet from the roadmap before it starts. Then work them one at a time:
  delete each packet when it ships, and take its step off the roadmap.
- **Merge your own pull requests,** and review ChatGPT's with must-fixes only. Take a ChatGPT code packet that blocks you.
- **Read the cloud freely** with the scoped gcloud (logs, describes, the troubleshooter), and re-run `infra/bootstrap.sh`,
  which changes nothing once in place.
- **Sibling repos** sit beside this one in `~/workspace/` (uma-platform, uma-rpg, uma-quest). Read them freely. Change one
  only for a step a packet names (for example uma-rpg's freeze notes, or a "Both apps" request to uma-platform),
  following that repo's CLAUDE.md. If this session can't reach it, say in one line which session should take it.

**Ask in one line, then do it yourself:**
- creating or deleting cloud resources, or changing IAM, beyond what a packet already lists, with a free-tier cost
  table;
- making anything public: a repo, a bucket, a URL to private data;
- editing production data by hand, saves above all (see the production-save rules below);
- any change to uma-rpg beyond its freeze notes or a packet the owner approved, since it's frozen from uma-quest's Q4; the parcel receivers in uma-rpg and uma-racer need it too.

**Never:** change the active gcloud account, type credentials into a sign-in page, or commit original-game content.

## How the owner works

- **No open questions:** decide with a recommendation when a sensible default exists, and record it in the roadmap or
  the mechanics document it changes.
- **Plain answers:** answer the literal question first. Prefer the smallest fix over a redesign, and use a task table
  when work spreads.
- **Scope:** build the owner's spec literally, with no inherited filters. Deferred topics are discussion only.
- **The owner runs nothing:** never hand them a command. Their steps are only what needs their hands: a phone check, a
  review, a play, or a console entry with no API. Ask for one in one line, with the link.
- **Packets ahead:** keep the next piece written ahead of the work, so a session can always pick it up.
- **Reviews and status messages:**
  - list every HTML page and doc as a clickable link;
  - present every call (its id and one line), not highlights.
- **Docs:** clear, visual, full depth, each with a desktop HTML page (generated in `docs/pages/` by
  `scripts/docs-pages.mjs`). uma-rpg's `docs/design/tier-rework/class-progression.md` is the bar.
- **Lean assets:** features first, and the cheapest art that looks fine; no heavy pipelines.
- **Cloud cost up front:** a free-tier cost table whenever a cloud resource is added.
- **Production saves:**
  - never move `save.account.updatedAt`;
  - never write into a save from a server;
  - a stale server date means stop and ask.

  These come from uma-rpg's 2026-10-30 incident, where a hand grant wiped unsynced progress.

## Building and running

`AGENTS.md` has the commands (`NODE_AUTH_TOKEN=$(gh auth token) pnpm install`, then `pnpm lint`, `pnpm test`,
`pnpm build`). `.claude/launch.json` starts `farm-api` (:8101, auth off) and `farm-web` (:5194, `/api` proxied). To try
the owner guard locally, run the built API with `ALLOWED_EMAIL` set and no `AUTH_MODE`. The HD-2D farm is `?stage=1`;
the preview pane may not screenshot WebGL, so check it with `read_page` and the dev-only `window.__farmStage`.

## Production (live since 2026-11-08)

[docs/technical/infrastructure.md](docs/technical/infrastructure.md) has every value. The cloud lives in GCP project
`uma-rpg`, beside uma-rpg and uma-quest, each app isolated: site https://uma-farm.web.app, Cloud Run `farm-api`, and
Firestore database `farm`. Every push to `main` verifies and deploys; watch it with
`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`.

**Never change the active gcloud account.** Scope commands with
`CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg`, and never run `gcloud config set`. Never touch
uma-rpg's or uma-quest's pieces in that project. Never type credentials into sign-in pages.
