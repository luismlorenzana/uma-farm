# The story pack: a menu

**For the story session.** This page is the story's standing guide: first how the story reaches the game, then
everything the game can read from a story pack, what each part does in play, and what plays when it's missing. It's a
menu, not a checklist:

- **every part is optional;**
- **any number of characters is fine,** in any order, including none;
- **nothing is counted:** no fixed opening, list sizes, rungs or places;
- **a partial pack is the normal case,** and any pack can be released.

Write only what you want the game to show. Everything else in `content/story/` is yours: the game never reads it.
**Whatever you leave out, the game plays its default story:** a complete story every Uma plays from day one (talks
by stage and temperament, gift reactions, every event from meeting her to married life, the wedding night, her
occasions, the evenings' scenes, morning greetings and meals), written once for the game with her name, her favourite
good and her line's work filled in. It plays whole and pays as written ones do, so nothing waits on the story (the
full list is in [what plays without the story](game-mechanics.md#what-plays-without-the-story)). **Your writing replaces
it piece by piece:** her chat set for a stage replaces the default talks for it, an event of an id replaces that
event, her gifts replace her default tastes, and anything you haven't written stays the default, so ship whatever's
written. The Farm Story Sandbox marks, for each character, what's written and what's still the default. How your work
reaches the game is the first part, [below](#how-the-story-reaches-the-game); how the game plays is in
[the game mechanics](game-mechanics.md#the-cast-and-the-story-pack). The page view is
[story-pack.html](pages/story-pack.html).

## How the story reaches the game

The story session is free. It builds the world, the backgrounds and the characters however it wants, and much of it may
never appear in the game: it informs the dialogue that does. There are no layers, waves, counts or required shapes. This
part says how the story's work reaches the game; the rest of the page is the menu of what the game reads.

### What's the story's

- **Everything about the story:** world building, backgrounds and histories; characters and their voices,
  relationships, routes and scenes. Any form, any length, any order, and as many characters as the story wants.
- **Who:** any character in master data, by her `characterId`, and the Uma Ranker's sisters ([sisters](#sisters)).
- **Her life:** her chapters, her home, her job and her routine, her scenes and her words are the story's choice, every
  one optional ([the cast](#the-cast-castjson)).

### Where it lives

`content/story/`, on the machine where the story is written, which git ignores. Organise it as you like: the game reads
only the pack's files ([the files](#the-files)), and anything else there is yours.

### Reading it: the Farm Story Sandbox

The Farm Story Sandbox is the story's reading tool, served on the machine where the story is written (`pnpm stories`,
http://127.0.0.1:4321). It reads the pack with the game's own reader:

- **each character:** her story piece by piece, hers, the default and missing, as `pnpm story:status` shows it
  ([a complete Uma](#a-complete-uma)); what's written and what still plays the default story, her chapters, her route
  and her bible;
- **the World page:** what the game will use of `world.json`, beside the world bible;
- **the pack's errors and notes** ([errors and notes](#errors-and-notes));
- **Review panels:** the owner reads there, and each panel writes the owner's verdict to `content/story/reviews.json`.

### Shipping it

**The routine, at the end of every writing session,** in this repo's checkout where the story is written (macOS or
Windows; Node 22.18 or later):

| Step | Command | What it says when it worked |
|---|---|---|
| 1. Status | `pnpm story:status --tier 1` | Each Uma's pieces, hers · default · missing; "10 of 10 complete" once Tier 1 is whole |
| 2. Ship | `pnpm story:ship --note "what's new, in one line"` | Its last line: **"Release *n* shipped, *date*: *note*"** |
| 3. Confirm | `pnpm story:ship --dry-run` | **"The bucket already plays this pack as release *n*: nothing to publish"** |
| 4. Say | Tell the owner "Release *n* is out" | On their phone, Account shows **Story: Release *n*, *date***, and the next morning opens with **"New story arrived"** |

- **The ship is the publish.** The live game's API reads the bucket's `story.json` on every request, so a release is
  live the moment step 2 ends: no deploy, no commit and no pull request. The story never goes into git.
- **"Nothing new shipped"** means the bucket already plays this pack: there's nothing to publish.
- **Ship partial work freely:** a pack only ever adds to what the game already plays. The owner can ask for a ship at any
  time ("ship it").
- **Ship from one machine,** the one where the story is written. A ship publishes the folder it reads, so a ship from an
  older copy publishes the older pack as a new release and backs its drafts up over the newer ones. On any other
  machine, bring the shipped drafts first: `pnpm story:pull farm --drafts --force` in `../uma-platform`, which replaces
  this machine's copy with the last ship's. The tell: on a machine that's current, step 3 says "already plays" before
  anything's written there.

**What the ship does,** step by step:

| Step | What happens |
|---|---|
| 1. Check | Reads `content/story/` with the game's own reader and prints what it skips (the errors) and the notes, then each Uma with a route as `pnpm story:status` shows her ([a complete Uma](#a-complete-uma)). Nothing blocks |
| 2. Release | Builds the release into the ignored `content/story-release/`: the pack as the game reads it, every broken part already skipped, every other field kept |
| 3. Publish | Numbers the release (one more than the bucket's current one, or 1), dates it and gives it its note, then uploads the new hash-named files first and `story.json` last to the farm's private bucket |
| 4. Back up | `pnpm story:push farm` in the sibling `../uma-platform` checkout, when it's there; skipped with a note when it isn't |
| 5. Say | The release's number, its date and its note |

- **The note** is `--note "…"`, else the first line of `ship.md` in the pack's folder, else none. It's one line of at
  most 160 characters, since the morning shows it; a longer one stops the ship before anything is uploaded.
- **On the phone:** the phone picks the release up on its next open. The next morning on an existing farm opens New
  today with **"New story arrived · *your note*"**, once a release, and Account shows **Story: Release *n*, *date***. A
  new farm meets the story in its opening.
- **Nothing new, nothing published:** a pack the bucket already plays keeps its number, and the drafts are still
  backed up. A ship that stopped partway (say, at the backup) is safe to run again.
- **`--dry-run`** reads the bucket (the number, which files are there) and lists what it would upload, uploading
  nothing.
- **Rolling back:** `pnpm story:ship --release <n>` publishes release *n*'s index again, numbered anew, with the note
  "Rolled back to *n*". The bucket keeps every file and the last ten indexes, so any of those can come back.
- **The steps alone:** `pnpm story:release` builds the release (any pack releases; it refuses only when there's no pack
  folder), and `pnpm story:publish` uploads it, unnumbered, so the morning doesn't announce it. The ship is the routine.

**The machine:** gcloud signed in with the owner's account. The ship never changes the account or its configuration:
every gcloud call is scoped by the environment.

| Variable | Default | What |
|---|---|---|
| `STORY_GCLOUD_CONFIG` | `default` | The gcloud configuration signed in as the owner (`CLOUDSDK_ACTIVE_CONFIG_NAME`) |
| `STORY_GCLOUD_PROJECT` | `uma-rpg` | The project (`CLOUDSDK_CORE_PROJECT`) |
| `STORY_BUCKET` | `uma-farm-content` | The farm's private bucket |
| `STORY_PLATFORM_DIR` | `../uma-platform` | The uma-platform checkout for the backup |

uma-platform's `story:push` uses the `default` configuration whatever `STORY_GCLOUD_CONFIG` says.

### A complete Uma

The menu stays a menu: a partial Uma plays whole, and nothing waits on the story. But the story can also lay an Uma out
**whole**, every piece the game reads for her, so it sees all of her at once, rewrites what it wants and ships her
complete. `pnpm story:scaffold` writes the pieces she's missing from the default story, marked as the default's;
`pnpm story:status` says, for each Uma, which pieces are hers, which are still the default and which are missing.

**The checklist:** 107 pieces, in the pack's own shapes (the rest of this page), and one more for each day `world.json`
adds with a scene of its own; a festival's night counts too when she has one written. It's everything the game plays:

| Part | Its pieces |
|---|---|
| Her cast entry, `cast.json` | her **schedule** (her `home`, `job` and `routine` together, one piece: what her profile and the calendar show, [her life in town](#her-life-in-town)), `chapters` ([her chapters](#her-chapters)) |
| Her bible, `umas/<id>.json` | `favouriteLine`, `gifts`, `chats`, `townLines`, `mornings`, `meals`, `keepsake`, `petName`, `wedding`, `wishes`, `greetings`, `smallTalk`, `giftLines`, and a beat for each of the 27 rungs in her `route` |
| Her route, `routes/<id>.json` | 65 events: her meeting (`arrival`), `f1`–`f10`, `confession`, `r1`–`r10`, `proposal`, `wedding`; `invited-to-work`, `wedding-night`, `moving-in`, `s1`–`s5`; each evening's scene (the six `hangout-<kind>`, the eleven `date-<kind>`, `dinner-in-town`, `a-night-in`); and every occasion a route can write ([her occasions](#her-occasions)): `new-year`; the five festivals' days (`flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`, `harvest-cup`); `birthday`; `anniversary`; and each of the story's days' scenes (the game's six, [the story's days](#the-storys-days), and any `world.json` adds). Then each festival's night she has written, an optional piece |

**A festival's night is optional:** written (`<festival>-night`, or `derby-night` and `harvest-moon` for the Fishing
Derby's and the Cooking Contest's), it plays and counts as hers, once under whichever of its ids is written; not
written, the festival has no night scene, and that's never missing. The story's standard writes the Fishing Derby's,
the Cooking Contest's and the Harvest Cup's.

**The marker, `"draft": "default"`:** a piece that still holds the default story's words.

- **Where it sits:** on the piece itself when it's an object: an event, a beat, a chapter, her `job`, each `routine`
  stop, her `chats`, `gifts`, `meals`, `keepsake` and `wedding`. A piece that's a plain value or a list of lines (her
  `home`; her bible's `favouriteLine`, `townLines`, `mornings`, `petName`, `wishes`) can't hold a key, so its marker
  sits on its file's own object: `"draft": { "mornings": "default" }` on her bible, `"draft": { "home": "default" }` on
  her cast entry. Her routine and her chapters are the default while every stop or chapter is marked, and her schedule
  while each of her home, job and routine that's there is marked (any one unmarked makes it hers).
- **It changes nothing in play.** The game reads a marked piece as written, and a marked pack plays exactly as the same
  pack unmarked; a release carries the marker as it is.
- **The check counts it:** a marked piece is "default, not hers yet". **Rewrite a piece, then remove its marker:** a
  marked piece whose words aren't the default's is a note, "rewritten? remove the marker". A `draft` with any other
  value is a note too, and the piece counts as hers.

```json
{ "id": "f3", "draft": "default", "steps": [{ "narrate": "You share a snack on the fence rail." }] }
```

```json
{ "characterId": "9000001", "mornings": ["“I’ll put the kettle on. Don’t move.”"], "draft": { "mornings": "default" } }
```

**The routine,** on the machine where the story is written:

| Step | Command | What it does |
|---|---|---|
| 1. Scaffold | `pnpm story:scaffold --tier 1 --dry-run`, then without `--dry-run` | Lists, then writes, every missing piece for the Ranker's Tier 1 (or `--ids <id,…>`), marked. Only what's missing: a piece that's there, hers or marked, is never touched, and a second run writes nothing. Every file it changes is copied first to the ignored `content/story-backups/<time>/` |
| 2. Rewrite | Your editor | Write her in her own words, piece by piece, removing each marker as you go. Any order, any pace |
| 3. Status | `pnpm story:status --tier 1` (or `--ids`, `--all`; with none, every Uma with a route) | Per Uma, a table of hers · default · missing by part, what's left of her, and the marker's notes. The sandbox shows the same on each character |
| 4. Ship | `pnpm story:ship --note "…"` | As always ([shipping it](#shipping-it)): its check prints the same status for each Uma with a route |

**What the scaffold writes,** from the default story rendered for her:

- **Her words:** her name from master data (a sister's from her cast entry), her favourite good and her line's work as
  the game fills them; `{farmer}` stays the placeholder. Her temperament (her talks' and her mornings' lines) is her
  bible's own `temperament` when it gives one, else her outfit's from master data, else steady, as the game plays.
- **Her chats:** the default story's friend, sweetheart and married talks for her temperament, as her `friend`,
  `partner` and `spouse` sets. The sets are coarser than the default's six stages, so from Friendship 1 to 2, as a
  farmhand and while engaged she says her friend and partner lines, where the default had lines of their own.
- **Her schedule,** when she has none: **the game's own default schedule**, the same function's output the game plays
  (`scheduleOf`, [who's where](game-mechanics.md#whos-where)), written as her `routine`, one stop marked default: her
  favourite spot (her `spot`; else the six in turn by her place in the cast) on every third day of each season, the first
  on day 1, 2 or 3 by her place in the cast. **No `home` and no `job`:** she's at home off the map her other days, so she
  plays exactly where she did. Give her a home, a job and days of her own as the story finds them, and remove the marker.
- **Everything else** is the default as the game already plays it: her events and their pays, her chapters, her tastes,
  her mornings and meals, her town lines, her keepsake, her pet name (your name, `{farmer}`), her wedding's places, no
  wishes, and a beat with only its id for each rung; her occasions the default story has a scene for (New Year's, the
  five festivals' days, her birthday), and the one festival's night it has, the Fishing Derby's, as `derby-night`.
- **What the default story has no words for stays missing,** hers to write: her `greetings`, `smallTalk` and
  `giftLines`; her `anniversary`; and the story's days' scenes. So a scaffolded Uma is "missing pieces" until the story
  writes them, and "complete" means everything the game plays is there. The other festivals' nights are optional, so
  the scaffold writes none.

| Variable | Default | What |
|---|---|---|
| `STORY_DIR` | `content/story` | The pack the scaffold writes and the status reads (`--from <dir>` too) |
| `STORY_RANKER_PLAN` | `../uma-platform/content/authoring/ranker/plan.json` | The Ranker's plan: `--tier n` is its `umas` board's Tn row, in its order. Without it, name the Umas with `--ids` |
| `STORY_MASTER_DIR` | `../uma-platform/content/release` | Master data's local release: her name and her outfit's stats |
| `STORY_PLATFORM_DIR` | `../uma-platform` | The uma-platform checkout the two above default into |

### The World Book, and `world.json`

The world building reaches the game in two ways:

- **What the player sees: `world.json`** in the pack, every part optional: the town's, the farm's and the region's
  names, the farm's history, the festivals, the story's days, each place's name and line, a line for each season, and
  Town notes. [The world](#the-world-worldjson) has its shape, and `pnpm story:ship` carries it with the pack.
- **What shapes the game: the World Book,** `content/story/world-book.md`, kept up to date and shipped with every pack
  (it travels with `story:push farm`). It holds:
  - the world bible and its history;
  - every character's background, the families and crews, the town and its places;
  - **"For the game":** what the story wants the game to support, one item each, with why.
- **Who reads it:** the game's sessions read it before designing anything (`pnpm story:pull farm`), and the owner reads
  it on Uma Story's World page, https://uma-platform.web.app/story/farm/world (owner only), where "For the game" stands
  apart as "What the story asks of the game". `story:push farm` reads the drafts from `../uma-farm/content/story`, or
  from `STORY_FARM_DIR`; `story:ship` sets it for you.
- **"For the game" is where the story asks.** The game's side picks each item up into the roadmap or a packet, and once
  it's built, this menu says how to write for it. Group scenes, for the families and crews, are on the roadmap's long
  game ([Phase 2](roadmap.md#phase-2-the-whole-farm)).

### What the game assumes

The owner's standing direction for anything that reaches the screen:

- **adults only,** tender and never explicit;
- **the protagonist is a man** (the owner, 2026-11-14): named by the player and never drawn, the player's eyes. Lines may
  say he, her husband, the groom;
- **a gift names a good the game has** (`goods/ids.ts`); a new good is a request to the game (her bible's
  `gifts.proposed`), not a rule.

### Privacy

- **The story names real franchise characters,** so it never goes in git or in uma-art. `content/story/` is ignored by
  git, and `docs/story/` holds only original drafts, with no franchise names.
- **No character or outfit names** in code, tests, docs, commit messages or pull request bodies. The private-content
  guard runs in CI.
- **Commit only tools or original drafts** (`docs/story/`), never the private pack.
- **Backups, from uma-platform:** `pnpm story:push farm` backs up the drafts (the ship runs it), and
  `pnpm story:pull farm --drafts` brings them to this Mac.

### How changes reach the story

- **Each rule change updates this menu in the same commit** as the code and [the game mechanics](game-mechanics.md), so
  this page is always what the game reads today.
- **The main session messages the story session** when something it can use ships: a new field, a new scene to write,
  a new event id.

## How the game reads a pack

### The files

The pack is a folder of JSON files in `content/story/`. Every file is optional.

| File | What it holds | Without it |
|---|---|---|
| `cast.json` | Who the pack holds, in its order, and what's given of each: her outfit, her life in town (home, job, routine: her schedule, what her profile and the calendar show), her chapters | Master data's first five characters, on the default story and the default schedule |
| `ties.json` | The ties between characters | No ties |
| `umas/<characterId>.json` | Her bible: her favourite line, gifts, route beats, chats, town lines and more | Her calling gives her line (else her stats in master data), she loves her line's favourite good and finds the rest neutral, she talks in the default story's lines and in town in the game's |
| `routes/<characterId>.json` | Her scripted events, by id: the rungs, her life's events, her occasions and the evenings' scenes | Each plays the default story's, which pays as a written one does |
| `pairs/<a>-<b>.json` | A tie's conversations, by bond level | Two short lines, one each, at every level |
| `household.json` | The household scenes, house lines and the finale | The game's short cards; house lines come from her temperament |
| `opening.json` | The opening: the start's lines, after the farmer's name | The game's two short lines |
| `town.json` | The town's people (Umas in the town's roles), its six spots, and the homes and workplaces the story adds to the town map | Master data's characters fill the roles; the game's own six spots and four shops |
| `world.json` | The world: the town's, the farm's and the region's names, the farm's history, the festivals, the story's holidays and minor days, each place's name and line, a line for each season, and Town notes | The game's own words: its five festivals, its places' names and lines, no days of the story's own, and no Town notes |

Any other file (`world.md`, `world-book.md`, `tags.json`, `reviews.json`, notes, drafts) is the story's own. The sandbox shows some of
them; the game never reads them, and a release never includes them.

### Errors and notes

The game's reader, shared by the game, the release and the Farm Story Sandbox, finds two kinds of things.

| | What it is | What happens |
|---|---|---|
| **An error** | Only what the game can't read: a file that isn't JSON or isn't the shape the game reads, a value the game can't use where it reads it, or a line longer than its screen | **It skips the one part it's in,** and the rest of the pack plays. The part is the smallest that can go: a line in a list, a field, a beat, an event, a level, a tie, a character, or at most one file |
| **A note** | Everything else: something not written yet, an unusual count, a bible and the tag sheet that disagree | **Nothing.** Notes block nothing; they tell you what plays instead |

What an error skips, by where it is:

| Where the error is | What's skipped |
|---|---|
| A file that isn't JSON | That file |
| A file that isn't the shape the game reads (a cast that isn't an object, a route with no `events` list) | That file |
| A character with no `characterId`, or one listed twice | That character (the later one) |
| One of the town's people with no `characterId`, or listed twice | That person (the later one) |
| A town person's role someone already has, a spot's `keeper` who isn't one of the town's people | That field |
| A town spot whose `id` isn't one of the six, or listed twice | That spot (the later one) |
| A town location with no `id` (lowercase words joined by `-`), no `name`, an id twice or one of the game's own | That location (the later one) |
| Her `home`, her job's `at` or a routine stop's `at` that isn't a location of the town map; a `days` or `seasons` that isn't a list of days of the season (1–30) or seasons | That field, or that stop: what plays without it plays |
| A field the game can't use (a calling, place or trigger that isn't on the menu, a birthday that isn't a real date) | That field: what plays without it plays |
| A chat line, a greeting, a gift line or a house line too long for its screen | That line |
| A small talk with an error (a speaker who isn't her or `you`, a line too long, a tag the game can't read) | That small talk |
| A greetings or gift lines set that isn't a list | That set |
| A step in an event the game can't play (a line too long, a choice with no options, a flag the save can't keep) | That event |
| A step in a pair's conversation | That bond level |
| A step in a household scene | That scene's part (its `open`, `close` or one spouse's beat) |
| A step in the opening (a line too long, a choice, a play, a flag or a branch: the opening has no picks) | That step: the rest of the opening plays |
| A world name, a history line, a place's name or line, a season's line, or what happens at a festival, that the game can't read | That name or line: the game's own words play |
| A festival with no `id`, an id twice, or one of the story's own without its name, season and day | That festival (the later one) |
| A festival moved onto a day another festival holds | Its move: one of the game's keeps the game's day; one of the story's own is skipped |
| A place id that isn't one of the farm's, or a season that isn't one of the four | That entry |
| A Town note with no `id`, an id twice, no title, or no line the game can read | That note (the later one) |
| A Town note's `unlock` that isn't on its menu | That unlock: the note is known from the start |

### Line lengths

Each limit is what its screen shows. A longer line is an error.

| Text | At most |
|---|---|
| A line in a scene or the opening: said, narrated or thought | 400 characters |
| A choice's option | 160 |
| A play's prompt | 120 |
| A chat line, a greeting, a small talk's line, a gift line | 160 |
| A house line | 120 |
| A beat's hint (her profile's Next card) | 160 |
| A beat's caption (the Memory) | 400 |
| A tie's line | 400 |
| Her keepsake's name, and its line | 40, and 160 |
| Her pet name for you | 24 |
| A town line | 160 |
| A sister's name, a town spot's name, a town location's name | 40 |
| A town spot's line, what one of the town's people does, a town location's line | 160 |
| Her job, in words (`job.what`) | 60 |
| An unlock's perk, in words | 200 |
| A chapter's title | 40 |
| A flag's name | 64, in lowercase letters, digits and `- . : _` (the save keeps it) |
| The town's, the farm's and the region's names, a place's name, a festival's name | 40 |
| A place's line, a season's line, what happens at a festival | 160 |
| A line of the farm's history, a line of a Town note | 400 |
| A Town note's title | 40 |
| A Town note's id, a festival of the story's own's id | 64 and 40, in lowercase words joined by `-` (the save keeps them) |

### The words

The owner's standing direction for anything on screen (the placeholder and school are notes):

- `{farmer}` is the one placeholder: the farmer's name, filled as the line shows. Any other `{…}` shows as written.
- **The protagonist is a man** ([what the game assumes](#what-the-game-assumes)): a line may say he, her husband, the
  groom, and no word about him is a note any more.
- Nothing reads as school.

## The cast: `cast.json`

### The file

```json
{
  "umas": [{ "characterId": "9000001", "spot": "cafe", "home": "blue-cottage" }, { "characterId": "9000002", "outfitId": "900000201" }, { "characterId": "s900000202", "name": "Her name" }]
}
```

| Field | What it does in play | Without it |
|---|---|---|
| `umas` | The cast, in its order: every character the pack holds. The order breaks ties wherever the game needs one. **The game plays the launch cast's 50 only** (the Ranker's Tier 1–5, [the launch cast](game-mechanics.md#the-launch-cast)): a character outside it stays in the pack and plays nowhere | The launch cast's 50, bare, on the default story |
| `welcome` | **Retired** (the owner, 2026-11-14: no welcome week). Nobody comes to the Gate: you meet everyone by introducing yourself in town. A `welcome` is still read, and noted as retired; it acts on nothing | — |
| `version`, `export`, `ranker` | The story's own (the sandbox's) | Nothing |

A cast file's old `opening` list is noted and dropped: the opening brings nobody.

### Each character

Only her `characterId` is needed: master data's id for her, a positive integer, or a sister's id (below). Everything
else is optional, and any field the game doesn't read is kept for the story.

| Field | What it does in play | Without it |
|---|---|---|
| `characterId` | Who she is | The character is skipped (an error) |
| `outfitId` | The one outfit she plays as: her face, bust, talents and temperament | Her default outfit from master data: her first original one |
| `calling` | Her line when her bible gives none: `farming`, `foraging`, `fishing`, `mining`, or `quarry` (mining at the Quarry) | Her bible's `favouriteLine`; with neither, the work her stats in master data suit best |
| `spot` | **Her favourite of the town's spots** (`plaza`, `market`, `cafe`, `harbour`, `library`, `track`): the default schedule's place for her, and her default part-time job's | One of the six by her place in the cast, three Umas each |
| `home` | **Her home,** a location of the town map (below): where she is on a day nothing else in her life holds | None: at home off the map |
| `job` | **Her part-time job** and where it is: `{ "what": "Bakes the morning bread", "at": "bakery", "days": [1, 2, 3, 4, 5, 6] }`. She's there on its days | None |
| `routine` | **Where she is, when:** a list of stops, each `{ "at": "library", "days": [3, 9], "seasons": ["spring"] }`. The first that holds today wins, before her job and her home | With none of `home`, `job` and `routine`: the default schedule, her `spot` every third day |
| `name` | **A sister's name** (read for a sister only): master data has none for her | Her elder's name, as her sister |
| `birthday` | `{ "month": 1–12, "day": … }` orders her among the balanced dates for the launch cast | Master data's birthday, then cast order when absent |
| `meet` | **Retired** (no welcome week): you meet her by introducing yourself in town ([meeting her](game-mechanics.md#meeting-her)). A `meet` is still read (an error in it is still an error) and noted once, as retired; it acts on nothing | — |
| `chapters` | **Her chapters,** below: they frame her route on her profile, the People page and the morning ([her chapters](game-mechanics.md#her-chapters)) | The four default chapters |
| `arrives` | **Retired:** meeting her replaced it. Any `arrives` is noted and dropped; her `meet` says when you meet her (a festival, another's event and a Farm Rank are on the menu), and the Dorm is retired | — |
| `paragraph` | The story's own: the sandbox shows it | Nothing |

### Sisters

A sister is an outfit of an Uma, presented as a character of her own, with her own name and profile: the Uma Ranker's,
named `s<outfitId>` (`s` and her outfit's id). The pack takes her id wherever it takes a character's: the cast, the
retired welcome list, a tie's `a` or `b`, her bible `umas/s<outfitId>.json`, her route `routes/s<outfitId>.json` and a pair's file.

- **Her face, bust, talents and temperament** are her outfit's, from master data: an `outfitId` on her entry is ignored
  (a note).
- **Her name** is her entry's `name`, from the pack's private release at run time, never git. Without one, she shows
  as her elder's sister (a note).
- **She lives in town** and is out there like everyone else, with her own `home`, `job` and `routine` if you give her
  them, and is met like anyone: by introducing yourself in town.

### Her life in town

Every Uma is a retired racer with a life in town: a home, a part-time job, the places she likes. Three optional fields
on her cast entry say where she is, when: **her schedule**. **They are exactly what the player sees:** her profile's
"Where to find her" (today, and this season's days and places), the calendar's "In town" on every day, and the town map's
who's at each place **now** ([who's where](game-mechanics.md#whos-where)). Nothing is placed at random. **Until hers is
written, the game's default schedule plays:** her favourite spot (`spot`) on every third day of each season, at home off
the map the rest. Days are turns and nothing reads a clock, so "when" is days of the season and seasons:

```json
{
  "characterId": "9000001",
  "home": "blue-cottage",
  "job": { "what": "Bakes the morning bread", "at": "bakery", "days": [1, 2, 3, 4, 5, 6, 7, 8] },
  "routine": [
    { "at": "library", "days": [9, 10] },
    { "at": "harbour", "seasons": ["summer"], "days": [11, 12] }
  ]
}
```

| Field | Its shape | What it does |
|---|---|---|
| `home` | A location id | She's at home on a day nothing else holds: you can visit her there |
| `job` | `{ "what", "at", "days", "seasons" }`: `what` her job in a few words (60 at most; under her name in town), `at` a location id, `days` days of the season (1–30) and `seasons`, each optional (every day, every season) | She's at work on its days, "at work" on the People list |
| `routine` | A list of stops, each `{ "at", "days", "seasons" }` | Its first stop that holds today wins. A stop with neither `days` nor `seasons` holds every day, so the stops after it never do (a note) |

- **The order each day:** her routine's first stop that holds, else her job on its days, else her home. With none of
  them for today, she's at home, off the map: once you write any of the three, the schedule is all yours (the default
  no longer fills her other days). With none written (or none on the map), she keeps the default schedule.
- **What the player reads:** her profile says "Today · The Bakery, at work" and "Spring · The Bakery, at work · 1–8 ·
  The Library · 9, 10 · Blue Cottage · the other days"; the calendar lists her on each of those days under her place.
- **A farmhand** (a friend invited to work) is on the farm by day after her job, whatever her schedule says; her job
  still shows on her profile.
- **`pnpm story:status`** counts her schedule as one piece of a complete Uma ([a complete Uma](#a-complete-uma)), and
  `pnpm story:scaffold` writes the default schedule as her routine, marked, when she has none.
- **A location** is one of the town map's: the six spots (`plaza`, `market`, `cafe`, `harbour`, `library`, `track`),
  the four shops and offices (`store`, `rancher`, `mayor`, `smith`), or one `town.json` adds ([below](#the-towns-locations)).
  One the map doesn't hold is an error that skips the field (or the stop).
- **Families and crews** can share a home: name the same location.
- Her goals and objectives live in her bible, as before.

### The trigger menu

One menu for a chapter's gate (`gate`) and a Town note's `unlock` (and the retired `meet`, still read). Each is an object
with its `kind`. A gate takes what the farm holds (`built`, `farm-rank`, `shipped`, `event`), a `season` or a
`festival`; the town's kinds (`talks`, `gift`, `spot`) were meeting her own, so a gate of one is an error and the chapter
plays without it:

| Spelling | Meaning |
|---|---|
| `{ "kind": "talks", "days": 3 }` | Talk with her on this many different days |
| `{ "kind": "gift" }` | Give her a gift she likes |
| `{ "kind": "gift", "good": "carrot" }` | Give her this good |
| `{ "kind": "spot", "spot": "plaza" }` | Talk with her at one of the town's spots: `plaza`, `market`, `cafe`, `harbour`, `library` or `track` |
| `{ "kind": "season", "season": "winter" }` | Talk with her in a season: `spring`, `summer`, `autumn` or `winter` |
| `{ "kind": "festival", "festival": "harvest-cup" }` | Talk with her on a festival: `flower-show`, `fishing-derby`, `cooking-contest`, `animal-show` or `harvest-cup`, or one of the story's own (`world.json`), on its day as the story puts it |
| `{ "kind": "farm-rank", "rank": 4 }` | Reach a Farm Rank, 1–10 |
| `{ "kind": "built", "place": "kitchen" }` | Have one of the farm's places built |
| `{ "kind": "shipped", "good": "carrot", "count": 50 }` | Ship this many of a good, in all |
| `{ "kind": "event", "after": "9000002:f3" }` | After another character's event plays (`<characterId>:<event>`, or an event id: anyone's). `<characterId>:arrival` is after her meeting |

A trigger that isn't on the menu is an error: the default plays. One that can never hold (Farm Rank 12, a good the game
doesn't have yet) is a note.

### Her chapters

Her story is hers, in her own chapters, from meeting her to married life. A chapter groups her events along the game's
backbone: friendship F1–F10 and the confession, romance R1–R10, the proposal and the wedding, then married life. Her
profile lists them with the one she's in, the People page shows her chapter on her row, and the morning a chapter opens
says "A new chapter with ‹name›" ([her chapters](game-mechanics.md#her-chapters)).

```json
"chapters": [
  { "title": "A new face", "events": ["arrival", "f1", "f2", "f3"] },
  { "title": "Kitchen days", "events": ["f4", "f5"], "gate": { "kind": "built", "place": "kitchen" } }
]
```

| Field | What it does in play | Without it |
|---|---|---|
| `title` | Its title on her profile, the People page and the morning | "Chapter 2" (a note) |
| `events` | Her rungs it holds: they play in the route's order, whatever order you list them in | It holds none, and is left out (a note) |
| `gate` | What the farm must have first, from the trigger menu (the farm's kinds, a season or a festival). The original first scene uses this requirement. An alternate scene advances the same relationship rung when the requirement is unmet. The Library offers the original once the requirement holds | It opens when its first event can play: the rung before it has played |

- **Her chapters run in the order of their first events** along the route, whatever their order in the file.
- **A rung in two chapters** plays in the first (a note). **Rungs in none** are listed in a note, and still play: each
  counts in the chapter before it along the route (or the first).
- **A gate on the chapter holding her arrival** never holds her meeting scene back (her `meet` says when she's met): it
  holds her first event after it.
- **Her last chapter closes** when Spouse 5 plays; the household's scenes go on after it.

With no `chapters`, or none that holds a rung the game plays, she has the four defaults:

| Chapter | Its events |
|---|---|
| Getting to know her | Her arrival, F1–F10, the confession |
| Together | R1–R10, the proposal |
| The wedding | The wedding |
| Married life | S1, S3, S5 |

## The ties: `ties.json`

```json
{ "ties": [{ "a": "9000001", "b": "9000002", "kind": "friends", "strength": 3, "line": "Old friends." }] }
```

A tie needs only its two characters, `a` and `b`. A pair tied twice keeps the first. Either may be a sister
(`s<outfitId>`), or one of the town's people (`town.json`'s): a tie with one of the town's people **builds no bond**,
since she never lives on the farm, and is never her closest friend; its line shows on both profiles (the cast Uma's
Ties, and the town person's sheet in town), and on the talk sheet when the cast Uma stands at the spot she keeps.

| Field | What it does in play | Without it |
|---|---|---|
| `a`, `b` | The two characters: a character id, a sister's, or one of the town's people's. A tie to someone outside the cast and the town never starts (a note) | The tie is skipped (an error) |
| `kind` | Its word on her profile: `friends`, `rivals`, `mentor`, `teammates`, `sisters`, or `other` ("Close") | "Close" |
| `strength` | 1–3: the bond it starts at when both are on the farm (0, 50 or 150 points), and her closest friends | 1: known, starting at 0 |
| `line` | Its line on her profile | "Closer now" |
| `history`, `source`, `from` | The story's own | Nothing |

No character needs a number of ties.

## Her bible: `umas/<characterId>.json`

The file's name says whose bible it is. A `characterId` inside that disagrees is a note.

| Field | What it does in play | Without it |
|---|---|---|
| `favouriteLine` | Her favourite work: `farming`, `ranch`, `mining`, `fishing`, `foraging`, `cooking`, `serving` or `forging`. ×1.2 rank points there, +10 a night, her perks at her line's places | Her calling's line |
| `gifts.loved`, `gifts.liked`, `gifts.disliked` | Her tastes, any number of each: a goods id each. A good not in the game yet is neutral until it is. Her loved good is also what the default story's lines call her favourite | The default story's: her line's favourite good loved (a Carrot for farming, a Trout for fishing…, each one the first season gives), the rest neutral |
| `gifts.proposed` | The story's list of goods it would like added: a request to the game | Nothing |
| `route` | Her beats, by rung (below) | Each event plays with the game's defaults |
| `chats.friend`, `chats.partner`, `chats.spouse` | Her chat lines by stage, any number, one a day: friend from Friendship 1 to the confession, partner from Romance 1 to the wedding, spouse after it | The default story's talks for her stage (acquaintance, friend, farmhand, sweetheart, engaged, married) and her temperament |
| `townLines` | What she says when you talk with her in town, any number, one a day, `{farmer}` your name | The game's six short lines |
| `mornings` | Her morning greetings as the night's companion (married life), any number, one a morning: narration before the first quote, then what she says inside the quotes (`{name}` hers, `{farmer}` yours). It plays in pajamas, the morning after you choose her ([the night's companion](game-mechanics.md#the-nights-companion)) | The default story's three for her temperament |
| `meals.breakfast`, `meals.dinner` | Her lines at the household's meals, any number of each, one as you sit down (the same shape as `mornings`) | The default story's three for each meal |
| `keepsake.name`, `keepsake.line` | The keepsake she gives at Friendship 10, on her profile | "Her keepsake", with a plain line |
| `petName` | What she calls you from Romance 1, on her profile. No placeholder | Your name |
| `wedding.places` | Where your wedding may be held, any number, the first first: the game's places | Her wedding beat's place and the farm's: the chapel bell, the Fields, the overlook |
| `wishes` | `own-house` (she's happiest alone in her house) and `birthday-alone` (her birthday morning is hers) | Neither |
| `expeditionReturns` | Short lines by result: `great`, `success`, or `retreat`, each a list. The morning card takes one line from the first returning party member who has lines for that result. | A default line for the result |
| `greetings` | Her greeting, opening a chat and a talk in town. On her birthday, one of her `birthday` lines alone. Otherwise one drawn from every set that applies now, their lines together: `places.<id>` (where you're talking: her location in town, else `places.town`; on the farm her work's place), `seasons.<season>`, and `times.morning`, `times.evening` (after an evening with her) or `times.night` (after a night in with her, or as tonight's companion), so every set plays over time. Each a list of lines; one drawn a day. `weather.rain` and `weather.snow` are read and kept: they play once the game has weather ([talk that knows the day](game-mechanics.md#talk-that-knows-the-day)) | None: the talk opens on her line |
| `smallTalk` | Short exchanges a chat may play instead of her line: a list of `{ "lines": [["<her id>", "…"], ["you", "…"], ["<her id>", "…"]], "at", "season", "stage" }`. A chat draws from her stage's lines and the small talks that fit together; one fits when every tag it carries matches: `at` the place (a farm place, a town spot or location, or `town` anywhere in town), `season`, `stage` her chat set (`friend`, `partner`, `spouse`). It plays on the dialogue engine, `you` under your name | Her line alone |
| `giftLines` | Her line at a gift: `loved`, `liked`, `neutral`, `disliked` by its taste, and `birthday` first on her birthday, each a list of lines | The default story's reactions for the taste |
| `voice` | The story's own notes on how she talks: never shown | Nothing |
| `blurb` | Her short biography in the Uma Library from the first meeting | No biography entry |
| `profileFacts` | Optional personal discoveries in her Library profile | No authored facts |
| `now`, `whyTheFarm`, `dream`, `laughs`, `hurts`, `season`, `festival`, `outfitId` | The story's own: the sandbox shows them | Nothing |

Each `profileFacts` entry has a stable slug `id`, its `text`, and a `reveal` of `"met"`, `{ "rung": "f1" }`,
or `{ "taste": "carrot" }`. Use the existing route IDs and goods IDs. The Library shows only discovered text
and a neutral slot before its gate. Keep the ID when revising a fact. A removed fact with saved proof appears in
the archive.

### Her route's beats

```json
{ "id": "f3", "trigger": { "kind": "working", "activity": "fishing" }, "place": "fishery", "together": { "kind": "date", "game": "fishing" },
  "beat": "The first fish she let go.", "hint": "When she fishes with you at the Fishery." }
```

A beat needs only its `id`: the rung it's for. The rungs the game plays an event at are `arrival`, `f1`–`f10`,
`confession`, `r1`–`r10`, `proposal`, `wedding`, `s1`, `s3` and `s5`, in any order and any number of them. A beat for
another id is kept for the story (a note).

| Field | What it does in play | Without it |
|---|---|---|
| `trigger` | Its setup besides her full bar: `hearts`, she's `working` an activity, an `item` is in the Warehouse, a `bond` with someone reaches a level. A `working` setup is met every day, whether or not its place is built (the Restaurant, the Forge, the Kitchen, the Mine), so it never holds her event back: a route never dead-ends on a setup. To tie the original scene to a place or a Farm Rank, put a `gate` on [her chapter](#her-chapters). Missing item and bond setups also allow an alternate scene, with the original available later through the Library. A `chapter` setup is noted and read as her full bar: the farm has no global chapters. Never a clock, the weather, a season or a festival | Her full bar only |
| `place` | Where it plays, on her Next card and the Memory | No place shown |
| `together` | What you do together: `talk`, `work` an activity, a `date` game (fishing, cooking, stargazing, footrace, dance, picnic, market, boat, walk, crafting), a `gift` of a good, or `help` someone. A work, a date or a gift adds a play when the event scripts none | No play added: the best choice taken is the grade |
| `beat` | Its Memory's caption | The game's card's first line ("A quiet afternoon with her.") |
| `hint` | What her profile says while it's next | None |
| `unlock` | An `item` (a good, into the Warehouse), a `place` or a `perk` in words, on the level-up card | None |
| `ladder`, `hearts` | The story's own | Nothing |

## Her route: `routes/<characterId>.json`

```json
{ "events": [{ "id": "arrival", "steps": [{ "narrate": "Someone new looks up from the market stall." }, { "say": "9000004", "line": "You’re from the farm, aren’t you?" }] }] }
```

Each event is one of the game's, by its `id`, with its `steps`. Any number of events, in any order. An event with an
error is skipped, and the rest of her route plays. **Each one you write replaces the default story's of that id; each
one you leave out plays the default.**

| `id` | What it is | When it plays |
|---|---|---|
| `arrival` | Meeting her | As soon as she's met |
| `f1` … `f10`, `confession`, `r1` … `r10`, `proposal`, `wedding`, `s1`, `s3`, `s5` | Her route's rungs | When she's Ready; they pay |
| `invited-to-work` | The invitation to work: she says yes to working the farm. The default is at the farm gate, in the day's outfit (her everyday one), unless you name another | As soon as you invite her to work (her menu in town, or her profile), the action spent ([the invitation to work](game-mechanics.md#the-invitation-to-work)) |
| `wedding-night` | The wedding night: tender, fading to morning, in the wedding night outfit unless you name another | Right after the wedding, before the Married card |
| `moving-in` | Moving in: she moves to the farm, into your home or a house built for her | Right after the wedding night, before the Married card, once she has a room; one who waits for a room plays it from the morning she moves in ("moved into", **Play**) |
| `s2`, `s4` | Married life 2 and 4 | The morning after the level comes at night (her bar full): the morning's "reached overnight" line plays it, then her level-up card ([the level-up cards](game-mechanics.md#the-level-up-and-stage-up-cards)) |
| `new-year`, the festivals' ids, `<festival>-night` (and `derby-night`, `harvest-moon`), `birthday`, `anniversary`, the story's days' scenes | Her occasions ([her occasions](#her-occasions)) | On their day, from the calendar, one action each ([occasion scenes](game-mechanics.md#occasion-scenes)) |
| `hangout-<kind>`, `date-<kind>`, `dinner-in-town`, `a-night-in` | An evening's scene: a hangout's for walk, fishing, picnic, market, cooking and festival; a date's for every kind; Dinner in town's and A night in's own | After each evening's play, before its card: a friend's `hangout-<kind>`, a sweetheart's or a spouse's `date-<kind>`, and the two evenings of their own (Dinner in town from Romance 3, A night in from Romance 6) ([the evening](game-mechanics.md#the-evening)) |

The rungs pay as written (below). The rest pay nothing: their choices are wording only, and the usual sizes don't apply
to them. Any other id is a note, kept for the story.

**The Uma loop's scenes** ([the Uma loop](game-mechanics.md#the-uma-loop)): her stages run acquaintance, friend,
farmhand, sweetheart, engaged and married. Her rungs run along all of them, and each stage adds scenes of its own:

| Her stage | Its scenes |
|---|---|
| Acquaintance | Her meeting scene (`arrival`), as you introduce yourself in town |
| Friend | The hangouts' scenes (`hangout-<kind>`) |
| Farmhand | The invitation to work (`invited-to-work`) |
| Sweetheart, and on | The dates' scenes (`date-<kind>`), `dinner-in-town` (from Romance 3) and `a-night-in` (from Romance 6) |
| Married | `wedding-night` and `moving-in` after the wedding, then `s2` and `s4`; her bible's `mornings` (the night's companion) and `meals` |

### Morning outing scenes

The launch cast has six Morning outings. Author both `hangout-<kind>` and `date-<kind>` for `morning-walk`, `breakfast`,
`tea-by-the-pond`, `flower-market`, `sunrise-sketch` and `bakery-stop`. The hangout plays for friends. The date plays
for partners and spouses. Each has its own route scene and reuses the existing activity games. The scene begins after
its outing has been recorded and can be replayed from the Library.

### Her occasions

**An occasion scene** is a scene for a day of the year, played with each Uma who has it written on that day, from the
calendar: one action (a special day's event actions first), paying nothing, whatever her stage, so write it for a friend
and a wife alike.

| Occasion | Its event id | Its day | Who | Unwritten |
|---|---|---|---|---|
| New Year's | `new-year` | Spring 1, from the second year | Everyone met | The default story's |
| A festival's day | its game rule's id: `flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`, `harvest-cup` | The festival's day, wherever the story puts it | Everyone met | The default story's for the Flower Show; none for the others |
| A festival's night | `<festival>-night`; the story's names stay as aliases: `derby-night` (the Fishing Derby's), `harvest-moon` (the Cooking Contest's) | The festival's day, its night | Everyone met | The default story's for `derby-night`; none for the others |
| Her birthday | `birthday` | Her birthday | Her, once you've met | None |
| Her anniversary | `anniversary` | Her wedding's date, each year from the first anniversary | Her, once married | None |
| A story day | the day's `scene`, else its `id` | `world.json`'s `days`, and the game's own six ([the story's days](#the-storys-days)) | Everyone met | None |

- **A festival's night is optional:** it plays when written, and one not written is never missing
  ([a complete Uma](#a-complete-uma)).
- **A day with several of hers plays one,** in this order: her birthday, her anniversary, New Year's or the festival's
  day, a story day. A festival's night is a second slot, after its day's, so a festival day can play both of hers.
- **A festival of the story's own** plays no occasion: the day's scenes are the game's five's.
- **Without an `outfit`** she wears the kimono at New Year's and a festival's night, the garden party dress at the Flower
  Show, the dinner dress on her birthday and her anniversary, and the season's on another festival's day or a story
  day.
- **Every id is read by name,** so a release that adds Umas, scenes or days plays them on publish, with no deploy.

### The scene's outfit

An event may name what she wears in it, `"outfit": "work"` beside its `id`; so may a pair level, a household scene and
the finale. Without one the game dresses her for the moment (her wedding, a dinner, a festival night, a picnic or a tea,
a night in, her work, the summer shore), else the day's season: [outfits by context](game-mechanics.md#outfits-by-context).

| `outfit` | Her portrait |
|---|---|
| `season` | The day's season: `spring`, `summer`, `fall`, `winter` |
| `spring`, `summer`, `autumn`, `winter` | That season's (`autumn` is the art's `fall`) |
| `work` | `farm-work` |
| `garden-party`, `kimono`, `dinner`, `wedding`, `wedding-night`, `swimsuit` | The same name |
| `pajamas` | `pajamas-playful` |

An id off the menu is a note, and the moment's plays; a value that isn't an id is an error that skips the field only. An
outfit not drawn for her yet shows her spring portrait, so the story can name one before its art exists.

### Steps

| Step | What it plays |
|---|---|
| `{ "say": "<who>", "line": "…", "emote": "happy" }` | A line, with the speaker's bust. Who speaks: anyone in the cast, or one of the town's people by her character id or her role's (`ida-stone`): her master-data name and bust show (an id outside them shows as "An Uma", a note). The emote is her face in the line, one of the 22 expressions: `neutral`, `happy`, `laughing`, `surprised`, `thinking`, `sad`, `angry`, `worried`, `determined`, `pouting`, `shy`, `tender`, `flustered`, `loving`, `tearful-joy`, `sleepy`, `crying`, `teasing`, `smug`, `embarrassed`, `startled`, `dreamy`. One not drawn for her yet shows its nearest ([the fallbacks](game-mechanics.md#her-faces)); none, or one off the menu (a note), shows neutral |
| `{ "narrate": "…" }` | Narration, in italics |
| `{ "thought": "…" }` | The farmer's thought, in italics |
| `{ "wait": 600 }` | A pause, in ms, 0–5000 |
| `{ "place": "fishery" }` | The title line's place from here on |
| `{ "illustration": "<her scene's id>" }` | Her illustration, full screen, from here on: one of her scenes by its id (master data's, as uma-platform's illustrations page lists hers), up until the next `illustration` step or the scene's end; `none` takes it down and brings her bust back. In her route's events only (anywhere else it's a note, and nothing shows). A scene that names one plays only its own; one that names none plays the game's moments (meeting her, a summer date at the shore, the confession's question and her yes, the wedding, the wedding night as it begins and as it fades, a night in, the morning after the night's companion: [her illustrations](game-mechanics.md#her-illustrations)). An id she has no scene for shows her bust; a value that isn't an id (lowercase words joined by `-`) is a note |
| `{ "flag": "shared-lunch" }` | A flag she keeps: wording only, for a later `when` |
| `{ "when": "shared-lunch", "then": […], "else": […] }` | Steps for while the flag is set, `else` otherwise |
| `{ "choice": [ … ] }` | A choice, any number of options (two or three read best) |
| `{ "play": { "game": "fishing", "prompt": "…", "good": […], "miss": […] } }` | A play the farmer acts out: a date game or an activity (`as: "rhythm"` makes a farming play Rhythm). `good` follows a Great or Perfect, `miss` a Fine |

### A choice's options

| Field | What it does | Without it |
|---|---|---|
| `text` | The button | The event is skipped (an error) |
| `friendship`, `romance` | Its gain, which ranks the options: the highest pays +30, the rest +10 | 0 |
| `tone` | `warm`, `playful` or `honest`: the story's own | None |
| `then` | Steps after it's picked | None |
| `gives` | `{ "good": "basil", "count": 1 }`: it costs goods from the Warehouse ("Need 1 Basil" without them) | No cost |
| `reveals` | A good whose taste it teaches | None |
| `answer` | The confession's last choice point: `yes` or `not-yet` | Counts as Yes |

### Sizes that are usual, never required

The game plays any event. Outside these sizes is a note:

| Event | Usual |
|---|---|
| A heart event | 1–2 choice points on every path, at most one play |
| The confession, the proposal, the wedding | 1–3 choice points, at most three plays |
| The confession | Its last choice point holds one `yes` and one `not-yet` |
| Her arrival | One choice point and no play. With none, the game's hello ends it; with more, the first pays |

## A pair's conversations: `pairs/<a>-<b>.json`

Named by the two ids in numeric order, `<a>-<b>`: the game finds it by that name, so another name is skipped.

```json
{ "a": "9000001", "b": "9000002", "levels": [{ "hearts": 1, "place": "fields", "steps": [ … ] }] }
```

| Field | What it does | Without it |
|---|---|---|
| `levels[].hearts` | The bond level 1–5 it plays at, once each | — |
| `levels[].place` | Its title line's place | No place shown |
| `levels[].outfit` | What both wear in it ([the scene's outfit](#the-scenes-outfit)) | The day's season |
| `levels[].steps` | The conversation: the two speak (anyone else is a note) | — |

Any levels, in any order. A level not written plays the game's two short lines. A pair the ties don't hold never plays (a
note).

Scenes with three or more (a family's, a crew's reunion) aren't read yet: they're on the roadmap's long game
([Phase 2](roadmap.md#phase-2-the-whole-farm)).

## The household: `household.json`

The long game reads three optional fields here. The rest of the household file still plays its earlier scenes
and mornings.

- `celebrations` is keyed by `cohort:5`, `cohort:10` and each successive multiple of five through `cohort:50`,
  plus `greater-festival`. Each has optional `open`, `each`, `close` and `outfit`, in the household scene
  format. The game picks participants from the save's actual wedding order. The fiftieth wedding is the
  closing chapter. The Greater Festival falls on the same calendar date the following year.
- `duos` is a list of two-character arrays. Both directions come from one entry. Use distinct cast IDs, including
  a sister's `s<outfitId>` if appropriate. Each Uma can have three partners. The Homestead's Night visits sheet
  has a Duo editor with an export you can copy into the household file. In-game edits are local to the save.
- `duoLines` maps each canonical pair key, such as `9000001:9000002`, to scripts under each participant's ID.
  Each script can override her `sitting`, `bedside`, `farewell`, `morning`, `emotes`, `outfit` and `illustration`.
  Authors can check the input through the regular pack reader and preview it from Night visits on a save where both
  partners have True Love.

Each Uma's bible can add `marriedLife.pajamas` with keys `"1"` through `"10"`, and `marriedLife.birthday` and
`marriedLife.anniversary` with keys `"1"` through `"5"`. Birthday and anniversary scripts each read their own
dialogue for the shared formal look. Each slot takes up to 160 characters per beat. `emotes` maps a beat to a
[story expression](#steps). A duo override can set one beat without replacing her other faces.

```json
{
  "marriedLife": {
    "birthday": {
      "1": {
        "sitting": "I saved a little of my birthday just for us.",
        "bedside": "I’m glad you’re here.",
        "emotes": { "sitting": "neutral", "bedside": "loving" }
      }
    }
  }
}
```

Without a script outfit override, the portrait resolver tries `pajamas-playful` for pajama slot 1, `pajamas-2`
through `pajamas-10` for later slots and `wedding-anniversary-1` through `wedding-anniversary-5` for formal slots.
`outfit` can instead choose a supported story outfit. `illustration` names a scene ID from her private gallery
manifest. Missing lines and portrait assets use their defaults. Follow the [expression packet](design/her-look.md#approved-expression-authoring-packet)
when preparing and reviewing the art.
Use `pnpm story:scaffold --ids <id> --married-life` to generate missing look scripts marked as defaults.
`pnpm story:status --ids <id> --married-life` reports authored, default and missing slots.

The launch set uses `household.json` `duos` for the 75 mutual assignments. Its `duoLines` records index by canonical pair
key and then by speaker. They provide the four casual beats. The game uses each speaker’s pajamas slot for gaps.
On a birthday or anniversary, the host uses her occasion slot and her guest uses her own pajamas slot. The same
pair can play in either order, with the occasion host first.

In Uma Studio, **Save draft** saves a separate `duo-draft.json`. **Apply draft to story** checks the saved canonical
revision before replacing the assignments. Other household content stays in place. Selected pairs show their bond
levels and each member’s authored night beats, with a link to the Farm Duo preview in the Story Sandbox.

Run `pnpm story:duos --from <story directory>` for the launch roster, ties, five bond levels and both members’ four
night beats. Use `--launch-duos` on `pnpm story:ship` to require that coverage before publishing an approved launch
edit. Ordinary development packs can be incomplete. After shipping, `pnpm story:duos --release <readback directory>`
checks the index, asset hashes and playable pair files from a downloaded release.

| Field | What it does | Without it |
|---|---|---|
| `scenes` | The household scenes at 5, 10 and 15 married, each `{ "at": 5, "open": […], "each": { "<id>": […] }, "close": […] }`. `open` and `close` speak through narration and the town's people; `each` is one spouse's beat | The game's short card at each: a line, each spouse's line, a line |
| `scenes[].each` | Each spouse's beat, in wedding order | Her one line |
| `scenes[].outfit`, `finale.outfit` | What every spouse wears in it ([the scene's outfit](#the-scenes-outfit)) | The dinner dress; the finale the kimono |
| `houseLines` | `{ "<id>": ["…"] }`: a spouse's morning lines in her house, any number | Her temperament's lines |
| `finale` | The Great Harvest: `open`, `play`, `each`, `close` | The game's short card, with a dance |

## The opening: `opening.json`

The start's lines: after the farmer's name, they play one to a tap, then the farm opens on Home on day 1. Skip works from
the first line. Any length the story wants.

```json
{ "about": "The first morning.", "steps": [{ "narrate": "Morning on the farm." }, { "thought": "The fields can wait a minute." }] }
```

| Field | What it does in play | Without it |
|---|---|---|
| `steps` | The lines, in a route's steps: `narrate`, `say` (anyone in the cast or the town's people), `thought` and `wait`, and `place` for the title line ("Day 1 · Gate"). Each line has a scene's limit (400) and `{farmer}` | The game's two short lines: the farm, and its nine Carrot seeds |
| `about` | The story's own: kept, never shown | Nothing |

- **No picks:** a `choice`, a `play`, a `flag` or a `when` is an error that skips that step; the rest plays.
- **With no line left** (every step skipped, or only pauses), the game's two play (a note).
- **What the opening brings:** nobody, and nobody comes to the Gate (no welcome week): as it ends, the farm opens on
  day 1 with everyone in town, met by introducing yourself there. A line that tells the farmer someone is waiting at
  the Gate no longer reads true: the opening wants an ending of its own.

## The town: `town.json`

### Weekly professions

The launch cast uses a bundled roster of two Umas per profession until a complete authored plan replaces it.
Set `professions` in the town file. Each row has a unique `id`, a short `name`, the workplace's map ID in
`at`, an `off` weekday in lowercase, and two `partners` from `cast.json`. The first partner works the first
three of the remaining weekdays in town. The second partner works the last three. Both take the listed
day off. In a complete launch plan each of the 50 Umas appears once.

```json
{
  "id": "grocer",
  "name": "Grocer",
  "at": "store",
  "off": "wednesday",
  "partners": ["9000101", "9000102"],
  "role": "marta-quill"
}
```

`role` is optional. Use it for the role whose counter or scene this profession handles. For instance,
the store reads `marta-quill`, the Cooking Contest reads `rosa-bell`, and the ring bench reads `ida-stone`.
Keep `hollis-pryor` in `people` for the mayor. The other professions appear as romanceable cast members.
An unavailable worker leaves the counter's services open. An invalid or incomplete launch schedule uses
the bundled roster.

An optional `freeAt` on an Uma's cast entry gives her a place to visit on her profession's day off, including
after marriage. The existing `home` and `routine` give her places on personal days. Her fixed shifts take
precedence over old part-time job hours. In town lines and chats, `{address}` displays the farmer's name
before marriage and “husband” afterward.

The town's people, its six spots, and the locations the story adds to the town map. Every part is optional.

```json
{
  "people": [{ "characterId": "9000101", "does": "Keeps the smithy down in town.", "game": "ida-stone" }],
  "spots": [{ "id": "cafe", "name": "The Café", "blurb": "Tea, cake and a seat by the window.", "keeper": "9000101" }],
  "locations": [
    { "id": "blue-cottage", "name": "The Blue Cottage", "line": "Shutters the colour of the sea.", "kind": "home" },
    { "id": "bakery", "name": "The Bakery", "line": "Warm bread from first light.", "kind": "work" }
  ]
}
```

### The town's people

Each is an Uma from master data, by her `characterId`, in one of the game's fourteen roles. Her name and bust come from
master data at run time, so no name is in the pack's words. She lives in town, never on the farm, never among those out
for a talk, and keeps her spots.

| Field | What it does in play | Without it |
|---|---|---|
| `characterId` | Who she is: master data's id | The person is skipped (an error) |
| `game` | **Her role,** by the game's id: `hollis-pryor` (the mayor), `marta-quill` (the shopkeeper), `ben-carver` (the farm's last keeper), `dale-hart` (the rancher), `gus-talbot` (the old miner), `rosa-bell` (the cook), `juno-park` (the guide), `ida-stone` (the smith), `nils-berg` (the captain), `wren-ashby` and `cole-varga` (the two rivals), `courier`, `musician`, `bell-keeper`. A scene's `say` by the role speaks as her. A role taken already is an error that skips the field; one not on the list is a note: she's one of the town's people all the same | A role of the story's own |
| `does` | What she does, in a line, on her sheet in town | Her role's words |

A role no one in `town.json` plays goes to one of master data's characters, from the last in its order, never one of
the cast (a note), so every role is filled.

### The spots

| Field | What it does in play | Without it |
|---|---|---|
| `id` | Which spot: `plaza`, `market`, `cafe`, `harbour`, `library` or `track`. A cast entry's `spot` and a `spot` trigger name them | The spot is skipped (an error) |
| `name` | Its name on the town's screen | The game's: The Plaza, The Market, The Café, The Harbour, The Library, The Hilltop Track |
| `blurb` | Its line under the name | The game's line |
| `keeper` | Who's there, at her post: one of the town's people, by her `characterId` or her role's id. A keeper `town.json` names stands at the spot, before her role's shop | The game's keeper for it: the mayor, the shopkeeper, the cook, the captain, the guide, the courier. The mayor and the shopkeeper are at their office and their store, so the game's plaza and market show no keeper |

A spot `town.json` doesn't name plays the game's own (a note).

### The town's locations

The town map holds the six spots and the game's four shops and offices (`store` the general store, `rancher` the
rancher's, `mayor` the mayor's office, `smith` the smithy, each kept by its role's Uma). `locations` adds the story's
own: the homes and workplaces its Umas' `home`, `job` and `routine` name, and any other spot.

| Field | What it does in play | Without it |
|---|---|---|
| `id` | Its id, lowercase words joined by `-` (40 at most), named by a cast entry's `home`, `job.at` or a routine's `at`. Not one of the game's own | The location is skipped (an error) |
| `name` | Its name on the town map | The location is skipped (an error) |
| `line` | Its line, under its name where you are | None |
| `kind` | `home`, `work` or `spot`: the map's group (Homes, Workplaces, Elsewhere) | `spot` |

## The world: `world.json`

Optional `expansionCast` lists additional character IDs already present in `cast.json`. Authors can give them
bibles, routes and paired professions in the same release. These characters join the playable cast once the
fiftieth-wedding closing celebration is held. Characters already on a device's roster remain present if a later
release retires them.

The world the story builds, on screen. **Every part is optional,** and anything missing keeps the game's own words. A
part with an error is skipped (the smallest part: a name, a line, a festival, a place, a note), the rest plays, and notes
block nothing. Any other field is kept for the story.

```json
{
  "names": { "town": "Fernwick", "farm": "Thistle Farm", "region": "the Marrow Vale" },
  "history": ["Three families farmed this hill before you.", "The last of them left the gate unlatched."],
  "festivals": [
    { "id": "harvest-cup", "name": "The Long Run", "season": "winter", "day": 11, "happens": "Everyone races the ridge road at dawn." },
    { "id": "flower-show", "name": "Bloom Fair" },
    { "id": "lantern-walk", "name": "Lantern Walk", "season": "summer", "day": 4, "happens": "Paper lanterns float down the river." }
  ],
  "days": [
    { "id": "first-bell", "name": "The first bell", "kind": "holiday", "season": "spring", "day": 1, "line": "The bell rings twelve times at midnight." },
    { "id": "market-day", "name": "Market day", "day": [4, 8, 12], "line": "Stalls fill the square." }
  ],
  "places": { "gate": { "line": "The old gate, latched at last." }, "fields": { "name": "Low Fields" } },
  "seasons": { "spring": "The thaw runs off the hills.", "winter": "Frost on the fence rails." },
  "notes": [
    { "id": "old-well", "title": "The old well", "lines": ["Nobody remembers who dug it."] },
    { "id": "first-friend", "title": "A first friend", "lines": ["She knew the farm before you did."], "unlock": { "kind": "event", "after": "9000001:arrival" } },
    { "id": "cafe-window", "title": "The café window", "lines": ["The best seat faces the hills."], "unlock": { "kind": "spot", "spot": "cafe" } }
  ]
}
```

| Part | What it does in play | Without it |
|---|---|---|
| `names.town` | The town's name: the Town on the map (its place's own `name` first) and its screen's title, the opening's title line, the Gate's "Meet everyone else in *Fernwick*", and the Diary's "The farm" page | "Town" on the map and its screen; "in town" in the words |
| `names.farm` | The farm's name: the opening's title line ("Day 1 · Thistle Farm, Fernwick") and the Diary's "The farm" page | "The farm"; the opening's title line says "Day 1" |
| `names.region` | Under the farm's name on the Diary's "The farm" page, after the town | None |
| `history` | A few lines of the farm's past: the Diary's first page, **"The farm"**. `{farmer}` is filled | None: the page shows the names alone, and with no names either there's no page |
| `festivals` | The year's festivals: the calendar, the date chip, the morning's "*Festival* tomorrow" and "today", festival night, and `festival` triggers and gates | The game's five, on their days |
| `days` | The story's holidays and minor days: the calendar marks each day and lists them with their lines, the morning says "*Market day* tomorrow" and "today", and each plays its scene with each Uma who has it written | The game's own six small days |
| `places` | By place id: each place's `name` (the map, its quick look's title, its Build card's "The *name* stands tomorrow.") and its one `line` (its quick look) | The game's own name and line |
| `seasons` | By season: a line under "*Spring* begins" on the morning that opens it | "Spring begins" alone |
| `notes` | **Town notes:** a list in the Diary that fills as you play, each unlocked once by its `unlock` and kept; the morning names the night's | None |

### The festivals

Each festival is `{ "id", "name", "season", "day", "happens" }`, its day a season and a day of it, 1–30.
Use `"calendarDays": 30` in `world.json` for newly authored calendars. An older pack’s original contest dates follow
the expanded defaults and keep their names and descriptions. Authored moves to other dates keep those dates.
The Story Sandbox and game use the same reader. The game also extends the legacy every-third-day town routines
through day 30.

- **One of the game's five, by its id** (`flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`,
  `harvest-cup`): renamed by its `name`, moved by its `season` and `day` (each defaulting to the game's), and
  `happens` says what happens. **It keeps its game rule under the story's name, wherever it falls:** its festival night,
  the morning's news, a `festival` trigger or gate naming its id, and the contest its rank challenge counts (the Flower
  Show's, the Fishing Derby's, the Cooking Contest's, the Animal Show's) when the festivals are built. A moved one plays
  all of it on its new day, every year, and none on its old one. The game's five are never removed.
- **Any other id is one of the story's own,** added: it needs its `name`, `season` and `day`. It's a festival day: the
  calendar marks it, the morning says it, festival night opens, and a `festival` trigger or gate may name its id. It has
  no contest.
- **One festival a day.** The game's five take their days first (where the story puts them); a move onto a day another
  holds is skipped, and that festival keeps the game's day. Then the story's own, in the file's order: one on a day
  already held is skipped.
- The calendar lists each with its `happens` under it.

### The story's days

`days` is a list of the story's holidays and minor days: its customs, the valley's small days, a market. Each is
`{ "id", "name", "kind", "season", "day", "line" }`:

| Field | What it is | Without it |
|---|---|---|
| `id` | Lowercase words joined by `-`, at most 40 characters, each once | The day is skipped |
| `name` | On the calendar's day and in the morning, at most 40 characters | The day is skipped |
| `kind` | `holiday` (a ribbon on the calendar, listed first) or `minor` (a dot) | `minor` |
| `season` | `spring`, `summer`, `autumn` or `winter` | Every season |
| `day` | Its day of the season, 1–30, or a list of them (`[4, 8, 12]` for a weekly market) | The day is skipped |
| `line` | What happens, under its name on the calendar, at most 160 characters | None |
| `scene` | The event id it plays with each Uma whose route writes it (lowercase words joined by `-`, at most 40 characters) | Its `id` |

- **A day is the story's own:** it may share a festival's day or another day's. It's marked and said, and plays its
  scene with each Uma who has it written ([her occasions](#her-occasions)); a day with no scene written for anyone is
  marked and said, and nothing more. The special days that give event actions are New Year's, the festivals and her
  birthday.
- **The game's own six small days** play without `world.json`: each a minor day with its own scene, its id. A day of
  `world.json`'s with one of their ids moves or renames it (its season, day, name, kind, line and scene are the story's);
  any other id adds a day.

  | Day | `id` (its scene) | When |
  |---|---|---|
  | Blossom viewing | `blossom-viewing` | Spring 6 |
  | The wishing night | `wishing-night` | Summer 6 |
  | The first cold evening | `first-cold-evening` | Autumn 4 |
  | The first snow | `first-snow` | Winter 2 |
  | The longest night | `longest-night` | Winter 6 |
  | The sweets day | `sweets-day` | Winter 8 |
- **The morning** names the day's and the next day's: "*Market day* today", or "*Market day* +1 more tomorrow".

### The places

`places` is an object by place id: `fields`, `mill`, `coop`, `forest`, `sawmill`, `barn`, `fishery`, `smokehouse`,
`kitchen`, `mine`, `smelter`, `restaurant`, `quarry`, `cutter`, `forge`, `bin`, `warehouse`, `board`, `gate`,
`dock`, `shop`, `festival`, `expeditions`, `town` and `boat`. Each holds an optional `name` and an optional `line`; one
it leaves out keeps the game's own. `dorm`, the retired Dorm's, is read and not shown (a note, not an error); a scene
may still name `dorm` as its backdrop. The Town's name falls back on `names.town`, then "Town".

### Town notes

A note is `{ "id", "title", "lines", "unlock" }`: its id (lowercase words joined by `-`, which the save keeps), its
title in the Diary's list, its lines (`{farmer}` filled), and what unlocks it, from the trigger menu:

| Unlock | Holds | Checked |
|---|---|---|
| None | From the start: the note is known as soon as the pack plays | — |
| `{ "kind": "event", "after": "9000001:arrival" }` | **Meeting someone:** her meeting scene has played (any event of anyone's, as the menu reads it) | An introduction, a talk or a gift in town, and every night |
| `{ "kind": "spot", "spot": "cafe" }` | **A spot visited:** an introduction or a talk with anyone at that spot | An introduction or a talk in town |
| `{ "kind": "season", "season": "winter" }` | All that season | An introduction, a talk, a gift, and every night: the first morning of the season |
| `{ "kind": "festival", "festival": "lantern-walk" }` | On that festival's day (the game's or the story's own, as the story puts it) | An introduction, a talk, a gift, and every night: the festival's morning |
| `{ "kind": "farm-rank", "rank": 4 }`, `{ "kind": "built", "place": "mill" }`, `{ "kind": "shipped", "good": "carrot", "count": 50 }` | What the farm holds | An introduction, a talk, a gift, and every night |

- **Talks and a gift** were meeting her own: as an unlock they're an error, and the note is known from the start.
- **Each unlocks once and stays.** The save keeps only the ids unlocked, never a word of the note: a note the pack
  later drops is gone from the list, and one it brings back returns.
- **Where it shows:** the Diary's **Town notes**, in the file's order, each a tap to read; an introduction, a talk or a gift that
  unlocks one says "Town note · *title* ›" there and then; the night's are named the next morning in New today ("*title*",
  tagged **Town note**, or "*title* +2 more"), a tap opening the note in the Diary.

## What reads now, and what acts on it later

| Item | Read now | Acts in play |
|---|---|---|
| Her outfit, calling, birthday, bible, route, ties, pairs, household, the opening | Yes | Yes, today |
| A scene's `outfit`, a line's `emote` | Yes | Yes, today: [the dialogue engine](game-mechanics.md#the-dialogue-engine) dresses her and changes her face, for the Umas whose portraits are published |
| An `illustration` step | Yes | Yes, today: her illustration full screen, for the Umas whose illustrations are published ([her illustrations](game-mechanics.md#her-illustrations)) |
| The town's people, spots and locations, her favourite spot, her home, job and routine, her town lines, a sister's name | Yes | Yes, today: [the town](game-mechanics.md#the-town) |
| The welcome list, her trigger to meet | Yes, noted as retired | No: retired with the welcome week; you meet her by introducing yourself ([meeting her](game-mechanics.md#meeting-her)) |
| The world: names, history, festivals, places, seasons, Town notes | Yes | Yes, today: [the world](game-mechanics.md#the-world-in-the-pack) |
| Her chapters and their gates | Yes | Yes, today: [her chapters](game-mechanics.md#her-chapters) |
| What plays when a part is missing | The default story for every read | Yes, today: [what plays without the story](game-mechanics.md#what-plays-without-the-story) |
| The wedding night (`wedding-night`) | Yes | Yes, today: after the wedding |
| Her occasion scenes: New Year's, the festivals' days and nights, her birthday, her anniversary, the story's days | Yes | Yes, today: on their days, from the calendar ([occasion scenes](game-mechanics.md#occasion-scenes)) |
| The world's `days`, and a day's `scene` | Yes | Yes, today: [the calendar](game-mechanics.md#the-calendar-screen), the morning, and its scene |
| Her `greetings`, `smallTalk` and `giftLines` | Yes | Yes, today: a chat and a talk in town, and a gift ([talk that knows the day](game-mechanics.md#talk-that-knows-the-day)) |
| Her `greetings.weather` | Yes, and kept | When the game has weather |
| Her `voice` | Kept | Never: the story's own |
| Moving in (`moving-in`), the evenings' scenes, her `mornings` and `meals` | Yes | Yes, today: after the wedding night, after each evening's play, the morning after you choose her as the night's companion, and as you sit down to a meal ([the Uma loop](game-mechanics.md#the-uma-loop)) |
| The invitation to work (`invited-to-work`) | Yes | Yes, today: as you invite her to work |
| Married life 2 and 4 (`s2`, `s4`) | Yes | Yes, today: from the morning's line, the morning after the level comes at night |
| The marker, `"draft": "default"` ([a complete Uma](#a-complete-uma)) | Yes, and kept | Never: a marked pack plays exactly as the same pack unmarked |
