# F1 — The workspace and its checks

**uma-farm · Claude · S · Needs: the owner's package access (below) · Unblocks: F2**

## Why

F2's pipeline needs something to build and deploy, and CI must prove that this repo can install the five platform
packages before any cloud exists. This is the cloud plan's Step 2 for uma-farm
([uma-rpg docs/design/cloud/plan.md](https://github.com/luismlorenzana/uma-rpg/blob/main/docs/design/cloud/plan.md),
IN14, IN20, IN22). It is placeholders only: the real stack arrives in F3.

## Context (read first)

- [The plan](../../design/plan.md), Phase 1 and FM1–FM26, and the decisions D1–D3.
- **uma-rpg is the model:** its root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.npmrc`,
  `scripts/check-size.mjs` (its budget is 230 KB; uma-farm's is 180 KB, FM20), `apps/api` (NestJS, `uma-server`'s
  `AuthGuard`, `/api/health`), and the `verify` job of `.github/workflows/deploy.yml`. Copy, never import.
- **The packages**, all on GitHub Packages under `@luismlorenzana`. Today's versions are `uma-data` 1.3.0, `uma-kit`
  0.17.0, `uma-work` 0.1.0, `uma-server` 0.2.0 and `uma-art` 2.21.0. Check for newer ones when you start, and pin exact
  versions.
- **What exists:** `.gitignore`, `.nvmrc`, `.npmrc`, `scripts/check-private-content.test.mjs` and `.github/workflows/check.yml`
  (the guard alone).

## Decisions made

- **Names:** `@farm/web`, `@farm/api` and `@farm/domain`. pnpm 10.33.0, Node 22 and turbo, as in uma-rpg.
- **`apps/web`:** Vite and React 19, with one static page that says "uma-farm" in uma-kit's theme (import
  `@luismlorenzana/uma-kit/theme.css`). It is not yet a PWA.
- **`apps/api`:** NestJS 11 with `uma-server`'s `AuthGuard` on every route except health:
  - `GET /api/health` → `{ ok: true, build }`, where `build` is `BUILD_ID` or `"local"`;
  - `GET /api/save` → 401 without a token (there is no save yet);
  - `POST /api/post/ping`, **outside** the owner guard, checked by its own token instead (IN18). It answers
    `{ ok: true }` only for a Google-signed ID token whose audience is `FARM_API_URL` (its own URL) and whose
    `email` is on `POST_CALLERS`, a comma list. Otherwise it answers 401. Verify with `google-auth-library`'s
    `OAuth2Client.verifyIdToken`.
  - Its tests use no network: an injected verifier covers no token, a bad signature, the wrong audience, an account
    off the list and the right one. Unset `POST_CALLERS` refuses everyone.
- **`packages/domain`:** one exported constant and one Vitest test. It depends on `uma-data`, `uma-work` and `uma-art` so
  all five packages install (`uma-kit` from the web, `uma-server` from the API).
- **Auth off locally,** as in uma-rpg: `ALLOWED_EMAIL` unset and a dev flag let the local API answer without a token.
  Copy uma-rpg's approach exactly.
- **Checks:**
  - `pnpm lint` (tsc), `pnpm test`, `pnpm build`;
  - `scripts/check-size.mjs` at 180 KB, with its test;
  - the private-content guard.

  `pnpm test` runs the `scripts/` tests first, as uma-rpg's does.
- **CI:** replace `check.yml` with `deploy.yml`, holding uma-rpg's `verify` job only (install, lint, `test:ci`, build).
  It needs `packages: read` and `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`. The deploy job arrives in F2.
- **Local running:** `.claude/launch.json` with `farm-api` (`pnpm --filter @farm/api dev`, port 8101) and `farm-web`
  (`pnpm --filter @farm/web dev`, port 5194, `/api` proxied to 8101).

## Do

1. The workspace root: `package.json` (scripts `dev`, `build`, `lint`, `test`, `test:ci`, `web`, `api`),
   `pnpm-workspace.yaml`, `turbo.json` and `tsconfig.base.json` (strict, `noUncheckedIndexedAccess`).
2. The three placeholders above, each with a test.
3. Copy `check-size.mjs` and its test with the 180 KB budget, and add the step to the web build as uma-rpg does.
4. `deploy.yml` (verify only); delete `check.yml`.
5. `.claude/launch.json`.
6. Write the commands into `AGENTS.md` (its Commands section) and the layout into `README.md`.

## Done when

- Locally: `NODE_AUTH_TOKEN=$(gh auth token) pnpm install`, then `pnpm lint && pnpm test && pnpm build` pass.
- Locally: `/api/health` answers 200 and `/api/save` 401 with auth on (`ALLOWED_EMAIL` set). `/api/post/ping` answers 401 without a
  token. The page loads on 5194, and its `/api/health` comes through the proxy.
- CI is green on `main`. If the install fails with 403 or 404 on `@luismlorenzana/*`, the owner's step below isn't done
  yet: stop and say so in one line.
- `git status` shows no `content/`.

## The owner's step (once, before CI can install)

On GitHub, for each of `uma-data`, `uma-kit`, `uma-work`, `uma-server` and `uma-art`: open the package's
**Package settings** → **Manage Actions access** → **Add repository** → `uma-farm` with **Read**. That's five entries,
and GitHub has no API for it. uma-quest's Q1 needs the same five, so the owner can do all ten in one sitting.

## Deliver

Commit to `main` (Conventional Commits, `feat(workspace): …`). Then delete this packet, add a Done row in
[the handoff](../README.md), and log a D-decision for anything you decided (fetch `main` first).
