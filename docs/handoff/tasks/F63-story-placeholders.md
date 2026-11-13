# F63 — Placeholders everywhere

**uma-farm · Claude · M · Needs: F61, F62 · Unblocks: F65–F68 · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas):
Phase 1, step 1.3**

> The game plays whole with no story at all. Wherever it would read the story, it has a plain placeholder, so a
> character, an event or a scene that isn't written yet still plays and still pays.

## Why

The owner writes the story in long form over a long time. The game should be built whole and played live from the
start: each pack fills in more of what's already there, and nothing waits for the story to be finished.

## Decided

1. **A placeholder for every read.** Each thing the game reads from a pack has a fallback built into the game:

   | What the story can give | What plays without it |
   |---|---|
   | Her name and outfit | Her master-data name and default outfit |
   | Her chat lines, by stage | A few short, neutral lines for that stage, written for the game |
   | Her meeting scene | Two short lines and a hello; it pays as a written one does |
   | A heart event or play | A short card ("A quiet afternoon with her."); its points and rewards pay as written |
   | Her chapters | Four: "Getting to know her" (friendship, to the confession), "Together" (romance, to the proposal), "The wedding", "Married life" |
   | Her favourite line, tastes | Her line from master data; neutral tastes |
   | Her birthday | Master data's, or none |
   | Pet names, keepsakes, wedding places | Plain defaults |
   | The opening's lines | Three short lines (F65) |
   | Pairs and household scenes | A short card that pays as written |

2. **Placeholders read as the game's voice,** plain and short, with no "placeholder" label in play. The Farm Story
   Sandbox shows, for each character, what's written and what's still a placeholder.
3. **Nothing is gated on the story.** Every ladder, event, perk, evening, proposal, wedding and household runs end to end
   on placeholders. A pack only adds words, scenes and her own chapters.
4. **The stand-in pack stays for tests only.** The dev server and a fresh device run on "no pack": the placeholders.

## What F61 left for this packet

The open pack (F61) made every part optional and put a stopgap wherever the game needed a value the pack no longer
guarantees. Each is to become a proper placeholder here:

| Stopgap today | Where |
|---|---|
| A cast Uma with no `outfitId` plays as her character id: a lettered disc named "An Uma", D talents | `outfitOf` (`story/pack.ts`), the web's `castLens` |
| No calling and no bible's `favouriteLine`: she has no line (no ×1.2, no perk at her line) | `favouriteOf`, `linePlaces` |
| No `opening`: those who arrive at it, else the welcome list come up the road; the last line counts them; with nobody, the opening ends on chapter 1's card | `openingOf`, `chapterScene`'s `roadLine`, the scene player |
| No `arrives` and not in the opening: she never comes to the farm (F67's meeting replaces this) | `arrivalsTonight`, `nextArrivals` |
| An arrival scene written with no choice pays +50 alone; with several, the first pays | `finishArrival`, the scene player's arrival |
| No arrival scene: `FALLBACK_ARRIVAL` (a new face at the Gate) | The scene player, the event player |
| An empty `wedding.places`: her wedding beat's place and the farm's | `weddingPlaces` |
| A tie with no `kind` or `strength`: "Close", strength 1 | `tieKind`, `tieStrength` |
| A pair level, a household part or a play prompt not written: none shown, the scene goes on | The pair, household and event players |
| No chapters: `DEFAULT_CHAPTERS`, with their titles | `chaptersOf` |
| No pack published at all: the invented stand-in's cast plays, in production too, so the farm opens | `loadStoryPack` (`apps/web/src/story/load.ts`) |

## Do

1. One module of placeholders in `packages/domain/src/story/`, and one lookup: "the pack's, or the placeholder".
2. Every read of the pack goes through that lookup: lines, scenes, events, plays, chapters, tastes, birthdays, names and
   household.
3. The sandbox's per-character view marks what's placeholder.
4. A test that plays a run, days 1 to 60, with no pack at all, through events, a confession, a wedding and the
   household's first scenes.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- With no pack, every screen shows sensible words, and no screen shows a blank or an error.

## Deliver

Branch `feat/f63-story-placeholders` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated;
- [the game mechanics](../../game-mechanics.md) updated: what plays without the story.

## Left to the worker

- the placeholder lines themselves: short, warm and original;
- where the module lives.
