# F66 — The town

**uma-farm · Claude · M · Needs: F63 · Unblocks: F67 · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas):
Phase 1, step 1.6**

> Every character lives in town from day 1. Each day a different few are out at the town's spots, and you choose who
> to talk to.

## Why

The owner wants agency over which characters to chat with and grow close to. Every character, about a hundred of them,
should be present in the town, and a character's full story should begin when you've talked with her in the right way
(F67).

## Decided

1. **Who lives in town:** every character in master data, once each, in her default outfit, or the pack's outfit for her.
   The town's own cast (the mayor and the rest) stays as the town's people.
2. **The town is a place on the farm map,** opening a town screen with a handful of original spots, such as the Plaza,
   the Market, the Café, the Riverside, the Track and the Library.
3. **Who's out today:**
   - each day, up to four characters stand at each spot, about two dozen in all;
   - they're picked by a draw seeded by the player and the day, so the same day always shows the same town;
   - a character the pack gives a favourite spot is there more often;
   - the rest are at home.
4. **Tap her to talk:**
   - a short sheet shows her face, her name and one line: the pack's town line for her, or a placeholder;
   - a talk counts once per character per day, toward her trigger (F67);
   - talking costs nothing and takes no time.
5. **The People list:**
   - everyone, with her face and name, met or not yet, and where she is today ("At the Café today", "At home");
   - a search, and a sort by met first or by name.
6. **Lean:** faces load as they scroll into view. The town is a 2D screen built with uma-kit; the town on the HD-2D stage
   comes later.
7. **The save (v4, growing in place):** per character, the talks so far and the last day talked. Nothing else.
8. **No names in git:** master data's names stay out of code and tests; fixtures come from
   `@luismlorenzana/uma-data/testing`.

## Do

1. The domain: the spots, the day's draw, a talk, and the save's fields, with tests.
2. The web: the town place on the map, the town screen, the talk sheet, and the People list.
3. The mechanics document's town section.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip (the town loads on demand if it
  needs to).
- At 390×844:
  - the town shows about two dozen characters a day, and a different set tomorrow;
  - a talk counts once a day;
  - the People list finds anyone by name.

## From the story (2026-11-13)

**The town's people (the owner's direction):** no character in the game is a man, and every townsperson is an Uma from
the Uma Ranker's NPC board. That changes decision 1's "the town's own cast stays".

- **Today:** the game's eleven original townsfolk (`CAST` in `story/cast.ts`: Mayor Hollis Pryor, Marta Quill, Old Ben
  Carver and the rest) include several men.
- **Asked:**
  - the town's people become characters from master data, role for role, by `characterId`;
  - their names and busts come from master data at run time, so no name enters git;
  - a scene's `say` by one of them shows her name and bust, not "An Uma";
  - the story sandbox's Town page shows them.
- **The mapping is the story's:** `content/story/town.json`'s `people` lists 14 roles. Each has a `characterId`, `does`
  (one line), and `game`, the townsfolk id it replaces (`hollis-pryor`, `marta-quill`, `ben-carver`, `dale-hart`,
  `gus-talbot`, `rosa-bell`, `juno-park`, `ida-stone`, `nils-berg`, `wren-ashby`, `cole-varga`). Three roles are
  new: the courier, the musician and the chapel bell's keeper.
- Until this lands, the routes speak the town's people in narration.

**The spots:** the pack names the town's spots, for decision 3 and "left to the worker: the spots' names".

- `town.json`'s `spots`: `plaza`, `market`, `cafe`, `harbour`, `library`, `track`. Each has a `name` ("The
  Plaza", "The Hilltop Track"), a `blurb`, and a `keeper`: the townsperson usually there.
- Each cast entry in `cast.json` has `spot`: her favourite spot, the one she's at more often. It's the story's own
  field today.
- **Asked:**
  - use these ids and names for the town's spots;
  - read `spot` as her favourite;
  - add both to [the pack's menu](../../story-pack.md), so a `spot` trigger can name them.

## Deliver

Branch `feat/f66-the-town` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated;
- [the game mechanics](../../game-mechanics.md) updated.

## Left to the worker

- the spots' names and look;
- the draw's weights;
- the talk sheet's layout, within uma-kit.
