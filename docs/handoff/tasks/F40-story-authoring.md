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
    optional, with an optional farm gate each ([her chapters](../../game-mechanics.md#her-chapters)); with none, she has
    four default chapters.
- **Going live:** see the ship routine below. Any pack can go; a partial one is normal.

## The ship routine (from 2026-11-14)

The owner wants the story to reach the game regularly. So:

- **At the end of every writing session, ship:** `pnpm story:ship --note "what's new, in one line"`, run in this repo's
  checkout where the story is written (macOS or Windows; Node 22.18 or later).
  - It does, in order:
    1. **check:** reads the pack with the game's own reader and prints what it skips and its notes (nothing blocks);
    2. **release:** builds it into the ignored `content/story-release/`;
    3. **publish:** numbers it (one more than the bucket's current release, or 1), dates it, and uploads the
       hash-named files first and `story.json` last to the farm's private bucket;
    4. **back up:** runs `pnpm story:push farm` in the sibling `../uma-platform` checkout, or skips it with a note when
       there's none;
    5. prints the release's number and the note.
  - **The note:** `--note "…"`, else the first line of `content/story/ship.md`, else none. One line, at most 160
    characters (the morning's line). A longer one stops the ship before anything is uploaded.
  - **A pack the game already plays isn't published again:** shipping twice with no change keeps the number, and still
    backs up. So a ship that stopped halfway (say, at the backup) is safe to run again.
  - **The phone** picks it up on its next open. The next morning on an existing farm says **"New story arrived"** with
    your note, once; a new farm meets it in its opening. Account shows **Story: Release *n*, *date***.
  - `pnpm story:ship --dry-run` reads the bucket for the number and lists what it would upload, uploading nothing.
- **The machine:** gcloud signed in with the owner's account. The ship never changes the account or its configuration:
  every gcloud call is scoped by the environment.

  | Variable | Default | What |
  |---|---|---|
  | `STORY_GCLOUD_CONFIG` | `default` | The gcloud configuration signed in as the owner (`CLOUDSDK_ACTIVE_CONFIG_NAME`) |
  | `STORY_GCLOUD_PROJECT` | `uma-rpg` | The project (`CLOUDSDK_CORE_PROJECT`) |
  | `STORY_BUCKET` | `uma-farm-content` | The farm's private bucket |
  | `STORY_PLATFORM_DIR` | `../uma-platform` | The uma-platform checkout for the backup |

  uma-platform's `story:push` uses the `default` configuration whatever `STORY_GCLOUD_CONFIG` says.
- **Ship partial work freely.** A pack only ever adds to what the game already plays.
- **Rolling back:** `pnpm story:ship --release <n>` publishes release *n*'s index again, with a new number and the note
  "Rolled back to *n*". The bucket keeps every file and the last ten indexes, so any of those can come back.
- **`pnpm story:publish`** stays as the publish step alone, for the Mac's own use: unnumbered, so the morning doesn't
  announce it.
- **The owner can ask for a ship at any time** ("ship it").

## The World Book (from 2026-11-14)

The world building informs the game too, in two ways:

- **What the player sees: `content/story/world.json` in the pack**, every part optional, and the game reads it today:
  - the town's, the farm's and the region's names: the map, the town's screen, the opening's title line, the morning
    and the Diary;
  - the farm's history: the Diary's first page, "The farm";
  - the festivals (name, day as a season and a day, what happens): rename, move or add them. One of the game's five
    keeps its game rule under the story's name, wherever it falls (its festival night, its triggers, its contest when
    the festivals are built); one of the story's own is a festival day. One festival a day;
  - each place's name and line: the map, its quick look and its Build card;
  - a line for each season: under "Spring begins" on its first morning;
  - **Town notes**: short pieces of the world, each unlocked once by a trigger from the menu (meeting someone, a spot
    visited, a season, a festival, a place built, a Farm Rank, a good shipped) at a talk, a visit or the night, and
    kept. The Diary lists them; the morning names the night's.

  [The story pack's menu](../../story-pack.md#the-world-worldjson) has the exact shape, and the Farm Story Sandbox's
  World page shows what the game will use of it, beside the world bible. `pnpm story:ship` carries it with the pack.
- **What shapes the game: the World Book,** `content/story/world-book.md`, kept up to date and shipped with every pack
  (it travels with `story:push farm`). It holds:
  - the world bible and its history;
  - every character's background, the families and crews, the town and its places;
  - **"For the game":** what the story wants the game to support, one item each, with why.

  The game's sessions read it before designing anything (`pnpm story:pull farm` on the Mac), and the owner reads it on
  Uma Story's World page, https://uma-platform.web.app/story/farm/world (owner only; live since uma-platform's P167),
  where "For the game" stands apart as "What the story asks of the game". `story:push farm` reads the drafts from
  `../uma-farm/content/story`, or from `STORY_FARM_DIR`; `story:ship` sets it for you. "For the game" replaces scattering requests across packets: the game's side picks
  them up from there into its own packets.
- **Private as always:** the World Book names real characters, so it never goes in git.

## The rework (2026-11-14): what changes for the story

The owner reworked the game ([the game's design](../../design/game-design.md)). For the story:

- **The protagonist is a man.** The old rule (never gendered, every line "you") is lifted. He's still never drawn: the
  player's eyes.
- **No welcome week.** The player goes to the Umas he wants to meet, introducing himself in town, and nobody comes to
  the Gate on her own.
  - `welcome` and `meet` retire once [F78](F78-town-map.md) lands; her chapters' gates stay.
  - The opening's last line ("someone's waiting at the Gate") wants a new ending.
- **Her life in town:** each Uma is a retired racer with her own life. New optional fields say where she is ([F78](F78-town-map.md)):
  - `home`;
  - `job`: her part-time job and where it is;
  - `routine`: where she is, when.

  Her goals and objectives live in her bible as before.
- **The Uma loop's stages** ([F79](F79-uma-loop.md)): acquaintance, friend, farmhand, sweetheart, engaged, married. New
  scenes the story may write:
  - the invitation to work;
  - moving in;
  - the night's companion's morning greetings;
  - the household's meals.

  The wedding night already has its own.
- **"For the game", answered:**

  | The story asked | Answer |
  |---|---|
  | The occasion scenes (dinners, nights in, the wedding night) | [F79](F79-uma-loop.md) |
  | New Year's, the Fishing Derby night, the Flower Show | [F82](F82-calendar.md), which also reads a `days` list of the story's holidays |
  | An outfit on every scene, and the occasions' outfits | the dialogue engine ([its rules](../../game-mechanics.md#outfits-by-context)) |
  | The world on screen | Shipped as [F73](../../game-mechanics.md#the-world-in-the-pack); it shows once a release carries `world.json` (Release 1 didn't) |
  | Group scenes | Later |

- **The default Uma** (F76, done): the game plays a complete default story for every Uma. Hers replaces it piece by
  piece (an event by its id, her chat set by stage, her tastes), so ship whatever's written
  ([the story pack's menu](../../story-pack.md#her-route-routescharacteridjson) lists the event ids it reads).

## What the game itself assumes

These are the owner's standing direction for anything that reaches the screen:
- adults only, tender and never explicit;
- **the protagonist is a man** (the owner, 2026-11-14): named by the player, never drawn; lines may say he, her
  husband, the groom;
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
