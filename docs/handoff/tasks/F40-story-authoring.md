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
  - [The story pack's menu](../../story-pack.md) lists everything the game can read. Every item is optional, and each
    comes with what plays when it's missing.
  - Write into the pack only what you want the game to show. Anything missing plays as the game's own placeholder
    ([what plays without the story](../../game-mechanics.md#what-plays-without-the-story)), and each new pack adds what
    it has. The sandbox marks, for each character, what's written and what's still a placeholder.
- **The checker blocks nothing.** Errors are only what the game can't read (a file that isn't JSON, a value it can't
  use, a line longer than its screen), and each skips only the part it's in. Everything else is a note. No counts or
  orders are fixed: any opening, any number of lines, gifts or wedding places, any arrival scene.
- **Characters:**
  - **Who:** any character in master data, by her `characterId`.
  - **The welcome list:** the pack names who welcomes the farmer in the first days. It can be any number, in order,
    and the first five in the cast are the default.
  - **Her trigger:** how her story begins is the story's choice, from the trigger menu ([meeting her](../../game-mechanics.md#meeting-her)),
    or the default: three days' talks in town.
  - **Her chapters:** how many, their titles and which of her events each holds are the story's choice too, all
    optional ([F68](F68-her-chapters.md)); with none, she has four default chapters.
- **Going live:** when the owner wants a pack in the game, `pnpm story:release` builds it (it prints what it skipped and
  the notes), and Claude publishes it (`pnpm story:publish`) to the farm's private bucket. Any pack can go; a partial one
  is normal.

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

## From the story: the hundred (2026-11-13)

**Group scenes: asked of the game, for a later packet.** The story's web of the Uma Ranker's 100 holds groups as well as
pairs:

- **10 families:** sets of sisters, and houses that share a family name.
- **17 crews:** generations that raced together.

Every character is in at least one. They're in `content/story/circles.json` (the story's own), each with an `id`, a
`name`, a `shape` (`family` or `crew`), its `members` and a line `about` it.

- **Today:** the pack plays conversations between two characters only (`pairs/<a>-<b>.json`) and the household's
  scenes.
- **Asked:** a pack file for scenes with three or more characters, played when enough of a group is met or living on
  the farm:
  - a family's scenes;
  - a crew's reunion;
  - a whole group at a festival.
- **Left to the game:**
  - when it fits the roadmap (Phase 2's long game is the natural place);
  - how a group scene is triggered;
  - what it pays.
- **Until then:** the story writes the duos first. The web has 70 strength-3 ties, and they become pair conversations.

## Deliver

Nothing to deliver as a packet: this page stays open while the story is written. Commit only tools or original
drafts (`docs/story/`), never the private pack.
