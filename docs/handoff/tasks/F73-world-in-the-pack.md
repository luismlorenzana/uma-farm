# F73 — The world in the pack: `world.json` and Town notes

**uma-farm · Claude · M · Needs: nothing (`story:ship` is in) · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas)**

> The world the story builds reaches the screen: the town's and the farm's names, the farm's history, the festivals,
> every place's description, a line for each season, and **Town notes**, short pieces of the world that unlock as you
> meet people and visit places. Everything is optional, and anything missing keeps the game's own words.

## Why

The story session builds a whole world: its history, the town, the festivals, the people's backgrounds. Today only the
characters' lines reach the game. The town, the places and the festivals speak in the game's placeholder words, and the
world is invisible. The owner wants the world building to inform the game.

## Decided

1. **A new pack file, `content/story/world.json`, every part optional:**

   | Part | What it does in play | Without it |
   |---|---|---|
   | `names`: the town, the farm, the region | Shown wherever the game names them: the opening, the map, the morning, the Diary | The game's own names |
   | `history`: a few lines of the farm's past | The Diary's first page, "The farm"; the opening may quote it | None |
   | `festivals`: per festival, its name, its day (season and day), and what happens | The calendar, the morning's "Festival tomorrow", festival nights, `festival` triggers | The game's five festivals |
   | `places`: per place id, its name and its one line | The map's names, quick looks and build cards | The game's own blurbs |
   | `seasons`: per season, a line | The morning that opens the season | The game's own line |
   | `notes`: Town notes, each with a title, a few lines, and what unlocks it (from the trigger menu: meeting someone, a spot visited, a place built, a season, a festival, a Farm Rank) | A **Town notes** list in the Diary that fills as you play; a note unlocked shows in the morning | None |

2. **The festival list can come from the story:** a pack may rename, move or add festivals. Their day is a season and a
   day. A festival the farm's rules need (the Cooking Contest's, the Harvest Cup's) keeps its game rule under the story's
   name.
3. **Town notes unlock once and stay.** Their unlock reuses F67's trigger checks, at a talk, a visit or the night.
4. **No names in git:** names come from the private pack at run time. Fixtures use invented words.
5. **The save** keeps only which notes have unlocked (their ids). v4 grows in place.

## Do

1. The domain:
   - `world.json`'s reader in `story/` (errors skip the part, notes block nothing);
   - its lookups, the pack's or the placeholder (F63's module);
   - the note unlocks and the festival list from the pack, with tests.
2. The release and the sandbox: `world.json` in `story:release`, and a World page in the Farm Story Sandbox showing what
   the game will use.
3. The web: names, places, festivals and seasons through the lookups; the Diary's "The farm" page and Town notes; the
   morning's unlocked note.
4. Docs:
   - `docs/story-pack.md`;
   - [the game mechanics](../../game-mechanics.md);
   - F40's World Book section.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- With no `world.json`, the game reads as today.
- With a test `world.json`, these come from it:
  - the town's name in the opening and on the map;
  - a renamed festival in the calendar;
  - a place's line in its quick look;
  - a Town note that unlocks on meeting someone and shows in the Diary and the morning.

## Deliver

Branch `feat/f73-world-in-the-pack` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the Diary page's layout;
- how many Town notes show on one morning;
- the sandbox World page's look.
