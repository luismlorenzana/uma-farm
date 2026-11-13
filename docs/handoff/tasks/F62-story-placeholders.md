# F62 — Placeholders everywhere

**uma-farm · Claude · M · Needs: F61 · Unblocks: F63–F65, the go-live (F56) · [Roadmap](../../roadmap.md#phase-1-live-with-the-storys-frame):
Phase 1, step 1.2**

> The game plays whole with no story at all. Wherever it would read the story, it has a plain placeholder, so a
> character, an event or a scene that isn't written yet still plays and still pays.

## Why

The owner writes the story in long form over a long time. The game should be built whole and played live from the start:
each pack fills in more of what's already there, and nothing waits for the story to be finished.

## Decided

1. **A placeholder for every read.** Each thing the game reads from a pack has a fallback built into the game:

   | What the story can give | What plays without it |
   |---|---|
   | Her name and outfit | Her master-data name and default outfit |
   | Her chat lines, by stage | A few short, neutral lines for that stage, written for the game |
   | Her meeting scene | Two short lines and a hello; it pays as a written one does |
   | A heart event or play | A short card ("A quiet afternoon with her."); its points and rewards pay as written |
   | Her favourite line, tastes | Her line from master data; neutral tastes |
   | Her birthday | Master data's, or none |
   | Pet names, keepsakes, wedding places | Plain defaults |
   | The opening's lines | Three short lines (F63) |
   | Pairs and household scenes | A short card that pays as written |

2. **Placeholders read as the game's voice,** plain and short, with no "placeholder" label in play. The Farm Story
   Sandbox shows, for each character, what's written and what's still a placeholder.
3. **Nothing is gated on the story.** Every ladder, event, perk, evening, proposal, wedding and household runs end to end
   on placeholders. A pack only adds words and scenes.
4. **The stand-in pack stays for tests only.** The dev server and a fresh device run on "no pack": the placeholders.
5. **No save change.**

## Do

1. One module of placeholders in `packages/domain/src/story/`, and one lookup: "the pack's, or the placeholder".
2. Every read of the pack goes through that lookup: lines, scenes, events, plays, tastes, birthdays, names and
   household.
3. The sandbox's per-character view marks what's placeholder (it can reuse the Counts page).
4. A test that plays a v4 run, days 1 to 60, with no pack at all, through events, a confession, a wedding and the
   household's first scenes.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- In the romance build with no pack, every screen shows sensible words, and no screen shows a blank or an error.
- The deployed build (v3) is unchanged.

## Deliver

Branch `feat/f62-story-placeholders` and a pull request. In it:
- the packet deleted;
- the roadmap's step 1.2 removed;
- [the handoff](../README.md) updated;
- [the game mechanics](../../game-mechanics.md) updated: what plays without the story.

## Left to the worker

- the placeholder lines themselves: short, warm and original;
- where the module lives.
