# F61 — An open story pack

**uma-farm · Claude · M · Needs: nothing · Unblocks: the story session, F62–F65 · [Roadmap](../../roadmap.md#phase-1-live-with-the-storys-frame):
Phase 1, step 1.1**

> The story drives the game; the game never drives the story. A pack is a menu of what the game can read, not a
> checklist: every part is optional, any number of characters is fine, and the checker blocks only what the game
> can't read.

## Why

The story session has been blocked by the checker. It refuses a pack unless:
- the opening is exactly three Umas, in the order farmer, forager, fisher;
- every chat set has 3–20 lines;
- every Uma has three liked gifts and two disliked;
- the wedding has three places;
- an arrival scene has exactly one choice;
- every cast Uma has her bible and arrival scene.

The owner wants to define as many characters as the story needs, in any order, and to release whatever is written.

## Decided

1. **Only a character's id is required:** her `characterId`, from master data. Everything else about her is optional. A
   cast of any size is fine, including none. Fields the game doesn't read are ignored and kept, for the story's own use.
2. **Two levels of checks.**
   - **Errors** are only what the game can't read:
     - a file that isn't JSON, or isn't the shape the game reads where it reads it;
     - a line over the length the screen can show.

     An error skips the one part it's in (that line, that event, that character), never the whole pack.
   - **Notes** are everything else: an unusual count, a missing bible, a bible and a tag sheet that disagree, an
     unwritten route. The sandbox shows them; they block nothing.
3. **No fixed counts or orders anywhere:**
   - the opening three and their order go;
   - so do the fixed sizes of the cast, chat sets, gift lists, the wedding's places and the route's rungs.

   Where the game needs a number, it uses what the pack gives and fills the rest from its placeholders (F62).
4. **A welcome list:** the pack may name characters, any number, in order, who come to the farm early (F65). With none
   named, it's the first five characters in the pack's cast order.
5. **Any pack can be released.** `pnpm story:release` prints the notes and refuses only a pack whose index can't be
   written. A partial pack is the normal case.
6. **The menu is written down:** `docs/story-pack.md` lists everything the game can read from a pack. For each item it
   gives what it does in play and what plays when it's missing. It's a menu for the story session, never a requirement.
   It gets a page in `docs/pages/`, through `scripts/docs-pages.mjs`'s list.
7. **No save change.** v4 is still dark; nothing here touches a save.

## Do

1. **The checker:** `packages/domain/src/story/authored.ts` and `pack.ts`. Split every rule into an error or a note, as
   decision 2 says, and remove decision 3's fixed counts. The pack reader skips a part with an error and keeps the rest.
2. **The release:** `scripts/story/release.mjs` releases with notes and refuses on index errors only. Update its tests.
3. **The sandbox** (`tools/story-sandbox/`): its checks show as notes, with a count. Nothing in it blocks writing,
   reading or releasing.
4. **The welcome list** in the cast's format (decision 4), read by `pack.ts` with its default.
5. **`docs/story-pack.md`** (decision 6) and the mechanics document's story-pack section.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- A pack with five opening characters in any order, one with forty characters, and one with a single character and no
  routes all read and release, with notes only.
- A pack with one broken event loses only that event.
- The sandbox opens each of those packs and shows its notes.
- The deployed build (v3) is unchanged.

## Deliver

Branch `feat/f61-open-story-pack` and a pull request. In it:
- the packet deleted;
- the roadmap's step 1.1 removed;
- [the handoff](../README.md) updated;
- [the game mechanics](../../game-mechanics.md) updated.

The commit says the calls made. Then tell the story session, in one message, that the checker no longer blocks it,
with a link to `docs/story-pack.md`.

## Left to the worker

- the notes' wording;
- the exact line-length limits, from the screens;
- how the welcome list is spelled in the cast file.
