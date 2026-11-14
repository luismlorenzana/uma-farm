# F72 — Ship the story: one command, numbered releases, a line in the game

**uma-farm · Claude · S · Needs: nothing · Unblocks: regular story releases, F73 ·
[Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas)**

> One command where the story is written puts the latest story on the owner's phone: `pnpm story:ship`. Every ship is
> numbered, dated and says what's new, and the game tells the owner when a new story has arrived.

## Why

The story hasn't reached the game because:
- it's written on one machine and published from another;
- nobody owns the step between;
- nothing shows when a release lands.

Since F61 any partial pack can be released, so the only things missing are one routine and one command.

## Decided

1. **`pnpm story:ship [--note "…"] [--dry-run]`** does, in order:
   1. reads the pack and prints its notes (nothing blocks);
   2. builds the release (`story:release`);
   3. publishes it to the farm's private bucket, with the hash-named files first and `story.json` last (`story:publish`'s
      rule);
   4. backs the drafts up to uma-platform with `pnpm story:push farm`, run in the sibling `../uma-platform` checkout when
      it's there; skipped with a note when it isn't.
   5. prints the release's number and what's new.
2. **It runs on the machine where the story is written,** Mac or Windows:
   - a Node script, not bash;
   - gcloud is called with the environment only, never changing the active account or its configuration;
   - the configuration name comes from `STORY_GCLOUD_CONFIG` (default `default`) and the project from
     `STORY_GCLOUD_PROJECT` (default `uma-rpg`);
   - the bucket comes from `STORY_BUCKET` (default `uma-farm-content`).
3. **Numbered releases:** `story.json` gains:
   - `number`: one more than the bucket's current `story.json`, or 1;
   - `shippedAt`: the date;
   - `note`: the `--note` text, or the first line of `content/story/ship.md` if it exists, or none.

   The reader accepts an index without them, as today.
4. **The game says so:**
   - the first morning after a new release reaches the phone shows "New story arrived" and its note, tagged New;
   - Account shows "Story: release *n*, *date*", or "No story yet".
5. **Rolling back:** `pnpm story:ship --release <number>` publishes the index of an earlier release again. The bucket
   keeps 10 versions and every hash-named file, so its files are still there. The number goes up and the note says
   "Rolled back to *n*".
6. **`story:publish` stays** as the publish step alone, for the Mac's own use; `story:ship` is the routine.

## Do

1. `scripts/story/ship.mjs`, with tests:
   - the steps run in order;
   - the number comes from the bucket's current index, using a stubbed gcloud;
   - the note is read;
   - a dry run uploads nothing;
   - a rollback works.
2. The index's `number`, `shippedAt` and `note` in `release.ts` and `release.mjs`, all optional to the reader.
3. The web: the morning's "New story arrived" line (once per release, kept in the save's morning summary as other lines
   are), and Account's story line.
4. Docs:
   - `docs/story-pack.md` ("Shipping");
   - [the game mechanics](../../game-mechanics.md);
   - [architecture.md](../../technical/architecture.md);
   - `AGENTS.md`'s command table;
   - F40's ship routine.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- `pnpm story:ship --dry-run` on the stand-in (`--from` the stand-in) lists what it would upload, with a number and a
  note.
- On the dev server, a new release's morning shows "New story arrived" once, and Account shows its number.
- **The first real ship:** when the story session runs `pnpm story:ship` on its machine, the phone shows the story's
  opening on a new farm and the morning line on the existing one. The isolation checks (signed out 401, signed in 200, an
  unlisted path 404) go into [infrastructure.md](../../technical/infrastructure.md) then.

## Deliver

Branch `feat/f72-story-ship` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the morning line's exact words;
- how Account shows the release.
