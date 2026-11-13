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

## From the story: the hundred (2026-11-13)

The story now has a baseline for the Uma Ranker's whole cast of 100 (its ten tiers): tags for every one, and a web of
257 ties in which everyone has at least three ties and one closest. The 76 who are Umas in master data are in the pack's
cast with their Ranker outfit and favourite spot, and each has a thin bible with her favourite line and loved gift. Two
things the town touches can't reach the game yet.

**1. Sisters.** 24 of the 100 are the Ranker's sisters. A sister is an outfit of an Uma, presented as her own character
with her own name and profile (the Ranker keeps them in uma-platform's private `ranker/profiles.json`, and its cast
export names them `s<outfitId>`).

- **Today:**
  - the pack keys a character by her `characterId`, and a sister shares her elder's, so a sister can't be in the cast;
  - a tie's `a` and `b` must be digits, so a tie with a sister can't be read;
  - master data has no sister, so the town can't hold one.
- **Waiting in the pack:** the story keeps the sisters' tags in `tags.json`'s `waiting` and their 84 ties in
  `ties.json`'s `waiting`, so the pack checks clean.
- **Asked:**
  - the town holds the sisters as characters of their own;
  - the pack accepts a sister's id (`s<outfitId>`) in the cast, the ties and her bible and route files;
  - her name, face and bust come from a private source at run time, never git: the story pack's release or master
    data's private release (left to the worker).
- **When it lands:** the story moves the sisters into `cast.json` and `ties`.

**2. The town's people in the web.** The town's 14 people (`town.json`) aren't in the web yet.

- **Asked:**
  - `ties.json` may name one of the town's people;
  - such a tie never builds a bond, since she doesn't live on the farm;
  - its line shows on both profiles, and on the town's talk sheet if that fits.
- **When it lands:** the story writes those ties.

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
