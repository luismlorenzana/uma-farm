# F65 — The lean start

**uma-farm · Claude · S · Needs: F63, F64 · Unblocks: F67 · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas):
Phase 1, step 1.5**

> A new farm takes under a minute: name your farmer, read a few lines, and you're on the farm.

## Why

The owner wants the start super lean: pick the character's name, see a very few dialogs, then go into the game fully.
Today's start re-cuts an old opening around a fixed three; that goes.

## Decided

1. **The start:**
   1. the farmer's name;
   2. the opening's lines: the pack's own opening if it has one, at any length the story wants; otherwise three
      placeholder lines;
   3. Home, day 1.

   No picks, no redraw, no opening three, no tutorial.
2. **Day 1's first helper:** until F67 lands, the welcome list's first character joins when the opening ends, so the farm
   has someone to work. F67 turns that into her visit and her trigger.
3. **Skip** is on the opening's lines from the first one.

## Do

1. The new-farm flow in `apps/web`: the name, the opening's lines, then Home.
2. Retire the opening three: `joinOpening` in `romance/arrivals.ts`, the opening's arrival kind, and the opening scene's
   lines in `story/chapter-1.ts` (`OPENING_SCENE`, `chapterScene`). Keep only what decision 2 needs.
3. Tests, and the mechanics document's start.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- At 390×844, a new farm is on Home in three taps after the name.

## From the story (2026-11-13)

The pack has its own opening now, for decision 1's "the pack's own opening":

- **Where:** `content/story/opening.json`, `{ "about"?: string, "steps": [ … ] }`, with steps in a route's shape
  (`narrate`, `say`, `thought`, `wait`). Today it's four lines: three narrated, then the farmer's thought. It ends
  with the farmer told that someone is already waiting at the Gate: the welcome list's first visitor (F67).
- **Asked:**
  - read it as the opening's lines, with the three placeholder lines when it's missing;
  - add it to [the pack's menu](../../story-pack.md) and to `story:release`;
  - check it with the same line limits as a scene.
- The pack no longer has `opening` or an `arrives` of `opening`. Until this packet lands, the welcome list walks up
  the road at the old opening (the reader's note says so).

## Deliver

Branch `feat/f65-lean-start` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated;
- [the game mechanics](../../game-mechanics.md) updated.

## Left to the worker

- the placeholder opening's three lines;
- the name screen's look, within uma-kit.
