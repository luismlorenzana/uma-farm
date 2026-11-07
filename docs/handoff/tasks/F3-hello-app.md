# F3 — The hello app

**uma-farm · Claude · M · Needs: F2 (and the owner's two sign-in entries) · Unblocks: F4 and everything after**

## Why

This is the bootstrap that follows the cloud plan (IN26, D3). It takes F1's placeholders to a real app on the owner's
iPhone: Google sign-in, a save that syncs, the update prompt and the Home Screen install. Phase 2 then copies the Wilds
into a working app instead of into placeholders.

## Context (read first)

- [The plan](../../design/plan.md): FM16, FM18, FM19, FM20 and Phase 1.
- **uma-rpg is the model, copied rather than imported:**
  - `apps/web`: `main.tsx`, `app/`, `save/`, `content/`, `master/`, the PWA setup in `vite.config.ts`, and the update
    prompt;
  - `apps/api/src/save`: the save service, its Firestore and local JSON stores, and the rescue copy;
  - `docs/technical/infrastructure.md` and `CLAUDE.md`: the production-save rules.

  Read uma-rpg's code; never import it.
- **The kit gives most of it:** `uma-kit`'s `/shell`, `/auth` and `/content`, and `uma-server`'s `/auth` and `/content`.
  Look at how uma-rpg wires each, and use the same entry points.

## Decisions made

- **The stack (P13, FM16):**
  - web: React 19, Vite, Tailwind 4, Zustand, Dexie, `react-router`, `vite-plugin-pwa` and `workbox-window`, uma-kit's
    theme, shell, auth and content;
  - api: NestJS with `uma-server`'s guard and content proxy, and the save service.

  No canvas engine yet: the Hub map arrives with the Wilds in F5, on uma-kit's `/hub`.
- **Save v1 (FM16):** `{ version: 1, account: { uid, createdAt, updatedAt } }`. It is local first in Dexie, then synced
  through `GET` and `PUT /api/save` with uma-rpg's conflict rule (the newer `account.updatedAt` wins, and the older copy
  goes to `saveRescues/{uid}`). It lives in the `farm` database under `saves/{uid}`, and in a local JSON file in dev.
  Nothing carries over from uma-rpg (P4).
- **One login for all three apps** (IN3): the same Firebase Auth, Google sign-in and `ALLOWED_EMAIL`.
- **The screens:** sign-in, then a single Home page drawn in uma-kit's shell, portrait (FM18). It shows "uma-farm", the
  signed-in account, the save's sync state, and the build id in the menu. The Wilds map replaces Home's body in F5.
- **Master data:** loaded through uma-kit's content loader and uma-server's proxy, as uma-rpg does. Home shows only the
  release's version, which proves the path. Nothing from it is drawn yet.
- **The icon:** a plain generated mark (the letter F on uma-kit's accent), the cheapest art that looks fine. Real art is
  ChatGPT's later.
- **Updates:** the kit's **Update ready · Restart** prompt, with the app shell served `no-cache` (F2's `firebase.json`).

## Do

1. Replace F1's placeholders with the stack above, keeping F1's checks and the ping route. The main JS must stay ≤ 180 KB gzip.
2. The save: `packages/domain`'s save v1 type and parser with tests; the API's save service on `FIRESTORE_DATABASE`; the
   web's Dexie store and sync.
3. Sign-in, Home and the update prompt; the PWA manifest and icons; `apps/web/.env.production` with F2's public Firebase
   config.
4. Copy uma-rpg's production-save rules into [infrastructure.md](../../technical/infrastructure.md) and `CLAUDE.md`:
   - never move `save.account.updatedAt`;
   - no server ever writes into a save;
   - a stale server date means stop and ask.
5. Start `docs/game/`: a first page, `architecture.md`, describing the app as built (pages, the save, sync, deploy, local
   setup), on uma-rpg's manual's model.

## Done when

- Locally, with auth off: the app runs on 5194 against 8101, and the save round-trips through the local store.
- In production, after the push:
  - sign-in works in Safari;
  - the save syncs (the doc appears in the `farm` database's `saves`);
  - a second deploy shows **Update ready · Restart**;
  - the workflow's checks pass.
- **The owner's phone check:** add it to the Home Screen, sign in inside the installed app, and see the save synced. Ask
  for it in one line, with the link.
- uma-rpg's and uma-quest's sites and saves are unchanged.

## Deliver

Commit to `main` (`feat(app): …`), delete this packet, add a Done row in [the handoff](../README.md) with the workflow
link, and log the packet's D-decision (fetch `main` first).
