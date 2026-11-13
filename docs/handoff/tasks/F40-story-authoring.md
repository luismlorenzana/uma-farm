# F40 — The story: free authoring

**The story session, with the owner · open as long as the story is written · Needs: nothing ·
[Roadmap](../../roadmap.md#what-this-game-is): the story fills the game over time**

> The story session is free. It builds the world, the backgrounds and the characters however it wants, and much of it
> may never appear in the game: it informs the dialogue that does. There are no layers, waves, counts or required
> shapes. This page only says how the story's work reaches the game.

## What's yours

- **Everything about the story:**
  - world building, backgrounds and histories;
  - characters and their voices, relationships, routes and scenes.

  Any form, any length, any order, and as many characters as the story wants.
- **Where it lives:** `content/story/` on this Mac, which git ignores. Organise it as you like. The game reads only
  the pack's files (below), and anything else there is yours.
- **Reading:** the owner reads in the Farm Story Sandbox (`pnpm stories`, http://127.0.0.1:4321). Its Review panels
  write the owner's verdicts to `content/story/reviews.json`.

## How it reaches the game

- **The game reads a pack:** `cast.json`, `ties.json`, `umas/<characterId>.json`, `routes/<characterId>.json`,
  `pairs/<a>-<b>.json` and `household.json`, in the shapes `packages/domain/src/story/authored.ts` reads.
  - Once [F61](F61-open-story-pack.md) ships, `docs/story-pack.md` lists everything the game can read. Every item is
    optional, and each comes with what plays when it's missing.
  - Write into the pack only what you want the game to show. Anything missing plays as a placeholder
    ([F62](F62-story-placeholders.md)), and each new pack adds what it has.
- **Until F61 ships,** the checker still complains about fixed counts:
  - the opening three and their order;
  - list sizes;
  - an arrival scene's one choice;
  - a bible for every cast Uma.

  Ignore those complaints: they're being removed, and they never block your writing.
- **Characters:**
  - **Who:** any character in master data, by her `characterId`.
  - **The welcome list:** the pack names who welcomes the farmer in the first days. It can be any number, in order,
    and the first five in the cast are the default.
  - **Her trigger:** how her story begins is the story's choice, from the trigger menu ([F65](F65-meeting-her.md)),
    or the default: three days' talks in town.
- **Going live:** when the owner wants a pack in the game, `pnpm story:release` builds it, and Claude publishes it
  (`pnpm story:publish`) to the farm's private bucket. Any pack can go; a partial one is normal.

## What the game itself assumes

These are the owner's standing direction for anything that reaches the screen:
- adults only, tender and never explicit;
- the farmer is "you": named by the player, never drawn and never gendered;
- a gift names a good the game has (`goods/ids.ts`); a new good is a request to the game, not a rule.

## Privacy

- **The story names real franchise characters,** so it never goes in git or in uma-art. `content/story/` is ignored by
  git. `docs/story/` holds only original drafts, with no franchise names.
- **No character or outfit names** in code, tests, docs, commit messages or pull request bodies. The private-content
  guard runs in CI.
- **Optional helpers, from uma-platform:** `pnpm story:push farm` backs up the drafts, and
  `pnpm story:pull farm --drafts` brings them to this Mac.

## Deliver

Nothing to deliver as a packet: this page stays open while the story is written. Commit only tools or original
drafts (`docs/story/`), never the private pack.
