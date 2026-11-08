# F6 — Push

**uma-farm · Claude · S · Needs: F5 · Unblocks: the owner's play, then F7's finish · Milestone M2**

## Why

Jobs run for hours while the app is closed (R7). A notification when work is done is what makes the farm playable from
the Home Screen. F2 created the push pieces paused (FM17, IN17); this packet ships the route and resumes them.

## Context (read first)

- [first-playable.md](../../design/first-playable.md): R8, N7 and FW8.
- [infrastructure.md](../../technical/infrastructure.md): `farm-vapid`, `farm-push-scheduler`, `farm-push-tick`
  (paused), `PUSH_AUDIENCE`, and the `push/{uid}` collection in the `farm` database.
- **uma-rpg at `30a322a`**, copied rather than imported:
  - `apps/api/src/push/`: `push.controller.ts`, `push.service.ts` (and its test), `push.repository.ts`,
    `push.sender.ts`, `scheduler.guard.ts`, `push.module.ts`;
  - `apps/web/src/push/`: `push.ts`, `NotificationsCard.tsx`; `apps/web/public/push-sw.js`;
  - `packages/domain/src/save/notify.ts` (F4 copied it as the farm's "what finishes when").

## Decisions made

- **The flow, as uma-rpg's (D63):**
  - the app subscribes after the owner allows notifications;
  - on every sync it sends the next "work done" time from F4's notify rules;
  - the tick, every five minutes, sends what's due.

  Nothing reads or writes a save on the server (FM10): the app sends only the times.
- **Routes:** `POST /api/push/subscription` and `PUT /api/push/schedule` behind the owner guard; `POST /api/push/tick`
  public at the guard and checked by its own OIDC guard (audience `PUSH_AUDIENCE`, caller `farm-push-scheduler`).
- **Storage:** `push/{uid}` in the `farm` database: the subscription and the due times. No new cloud resources (FW9).
- **The notification:** "Work done" with the place and the Uma's outfit-free wording ("Mine: 2 jobs done"), one at a time,
  and a badge cleared on open.
- **Resume, scoped (FW8):** `CLOUDSDK_ACTIVE_CONFIG_NAME=default CLOUDSDK_CORE_PROJECT=uma-rpg gcloud scheduler jobs resume
  farm-push-tick --location=us-central1`, after the route is deployed and answers 401 to an unsigned tick. The owner
  authorized resuming it (2026-11-08).
- **Free tiers (N7):** the tick is the billing account's second of three free scheduler jobs, at about 8,640 calls a
  month, inside Cloud Run's 2M free requests; `farm-vapid` is one secret version.

## Do

1. Copy the API's push module and its test, cut to the farm; register it in `AppModule`.
2. Copy the web's push client, the service worker's handlers (`push-sw.js` via Workbox's `importScripts`) and the
   Notifications card on the Account page; send the schedule on every sync.
3. Deploy, check the tick's refusals (no token 401, wrong caller 403), then resume `farm-push-tick` and read its first
   runs in the logs.
4. Update `docs/technical/infrastructure.md` (push live) and `docs/game/architecture.md` (notifications).

## Done when

- `pnpm lint`, `pnpm test`, `pnpm build` pass; the push service's tests cover due, not due, and a dead subscription.
- In production: the tick answers 200 to `farm-push-scheduler` and 401 unsigned; its runs show in Cloud Logging.
- **The owner's step:** allow notifications in the installed app, start a short job, close the app, and see "Work done".
  Ask for it in one line, with the link, then a few days of play (F7 measures it).

## Deliver

Commit to `main` (`feat(push): …`), push, and watch the run. Delete this packet, add a Done row in
[the handoff](../README.md) with the run's link, and log the packet's D-decision (fetch `main` first).
