# F63 — The lean start

**uma-farm · Claude · S · Needs: F62 · Unblocks: F65 · [Roadmap](../../roadmap.md#phase-1-live-with-the-storys-frame):
Phase 1, step 1.3**

> A new farm takes under a minute: name your farmer, read a few lines, and you're on the farm.

## Why

The owner wants the start super lean: pick the character's name, see a very few dialogs, then go into the game fully.
The romance build's start re-cuts the old opening around a fixed three; that goes.

## Decided

1. **The start, on a v4 save:**
   1. the farmer's name;
   2. the opening's lines: the pack's own opening if it has one, at any length the story wants; otherwise three
      placeholder lines;
   3. Home, day 1.

   No picks, no redraw, no opening three, no tutorial.
2. **Day 1's first helper:** until F65 lands, the welcome list's first character joins when the opening ends, so the farm
   has someone to work. F65 turns that into her visit and trigger.
3. **Skip** is on the opening's lines from the first one.
4. **v3 keeps its start** (the picks) until the go-live: rules follow the save's version.
5. **No save version change:** v4 is dark and grows in place.

## Do

1. The v4 new-farm flow in `apps/web`: the name, the opening's lines, then Home.
2. Retire the v4 opening three: `joinOpening` in `romance/arrivals.ts`, the opening's kind, and the opening scene's
   recut in `story/opening-v4.ts`. Keep only what decision 2 needs.
3. Tests, and the mechanics document's start.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- In the romance build at 390×844, a new farm is on Home in three taps after the name.
- The deployed build (v3) is unchanged.

## Deliver

Branch `feat/f63-lean-start` and a pull request. In it:
- the packet deleted;
- the roadmap's step 1.3 removed;
- [the handoff](../README.md) updated;
- [the game mechanics](../../game-mechanics.md) updated.

## Left to the worker

- the placeholder opening's three lines;
- the name screen's look, within uma-kit.
