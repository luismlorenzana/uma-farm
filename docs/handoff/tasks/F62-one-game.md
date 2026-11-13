# F62 — One game: one build, save v4 only

**uma-farm · Claude · L · Needs: nothing (F61 may land first or after) · Unblocks: F63–F68 · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas):
Phase 1, step 1.2**

> There's one game. The romance switch goes, every farm plays on save v4, and the older save versions and the code only
> they need are retired. The owner's yes, 2026-11-13: "I don't care about the live game, we're building it still, fully
> rework it."

## Why

Two builds, two save versions and the code kept for a third make every change twice as hard. The deployed farm is a
work in progress, so the farm moves to the one game being built.

## Decided

1. **One build:**
   - the romance switch goes: `VITE_FARM_ROMANCE`, `romanceOn`, the romance build and its size check;
   - `VITE_FARM_STORY` stays, for the tests' stand-in pack;
   - the deployed site is the game.
2. **Save v4 is the only save.**
   - A new farm starts on v4.
   - A device holding an older save shows one card: "Your farm starts over in the new version". Then the new start
     (F65; until it lands, today's v4 start).
   - The server already copies the stored save to `saveBackups/{uid}-v{n}` the first time a newer version replaces it,
     so the owner's v3 is kept there.
   - The newer-save refusal stays.
3. **Retire what only older saves need:**
   - the v2 and v3 parsers and migrations;
   - the work engine copied from uma-rpg, as far as v4 doesn't use it;
   - v3's roster draws, picks, recruits and chapter 1 goals;
   - every `version === 3` branch;
   - the save-v3 tests.

   Rules no longer branch on the version: they're v4's.
4. **Production saves:** no server writes into a save, and nothing moves `save.account.updatedAt` by hand. The owner's
   device replaces its own save, and the server backs up what it replaces.
5. **Size:** the main JS stays ≤ 180 KB gzip, and should drop.

## Do

1. Remove the switch and the second build: `apps/web` (`romance.ts`, the env files, the build scripts), the
   `deploy.yml` steps, and `scripts/check-size.mjs`'s romance pass.
2. The boot: an older save becomes decision 2's card, then a fresh v4.
3. Retire decision 3's code. Delete what nothing in v4 reads, until lint, tests and the build are clean. Look for
   left-over exports.
4. The docs:
   - [the game mechanics](../../game-mechanics.md) loses its v3 notes, and its v4 notes become the rules;
   - [architecture.md](../../technical/architecture.md) loses the two builds and the older versions.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass with one build.
- A device with a v3 save shows the card, then a fresh v4 farm, and the server holds `saveBackups/{uid}-v3`.
- A fresh device starts on v4.
- After the deploy:
  - health shows the commit;
  - the owner's save read (read-only) is v4;
  - the backup exists;
  - `saveRescues` holds nothing new.
- **The owner's phone check:** "Open uma-farm.web.app, see the start-over card, start the new farm, and play a day."

## Deliver

Branch `feat/f62-one-game` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the card's words;
- what of the copied work engine v4 still needs (it may be nothing).
