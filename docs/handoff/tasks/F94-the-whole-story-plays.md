# F94 — The whole story plays: every occasion, the story's days, and talk that knows the day

**uma-farm · Claude · M · Needs: F93 · [The story's way in](../../story-pack.md#how-the-story-reaches-the-game)**

> Everything the story writes for a moment the game has, plays. Her birthday, her anniversary, every festival's day and
> night, and the story's small days get their scenes; her chats open with a greeting for the place, the season and the
> hour, small talk plays as a short exchange, and a gift gets her own words. All of it is read by id from the pack, so a
> later release with more Umas or more scenes plays without a change to the game.

## Why

The owner (2026-11-15): connect the story "in a way that when more story is published this is available". Tier 1's ten
are complete and live (release 8), but the game plays 54 of each Uma's 68 scenes and none of her greetings, small talk or
gift lines. `pnpm story:ship --dry-run` notes the other 14 scenes as "kept for the story", and `story:status` calls her
complete because it counts only what the game reads. That's 140 scenes, 900 greetings, 220 small talks and 10 sets of gift
lines waiting. The story's World Book asks for this in its "For the game" section; this packet is the game's answer.

## Read first

- [The story pack](../../story-pack.md): the bible's fields, routes and events, `world.json`, errors and notes.
- `packages/domain/src/story/authored.ts`, the reader:
  - `STORY_EVENTS`, `OCCASIONS`, `UmaBible`, `WorldDay`;
  - its comment "Fields the game doesn't read are ignored and kept".
- `story/complete.ts`, what "complete" counts, and `story/placeholders.ts`:
  - `eventOf`, `chatLinesOf`, `giftReactionsOf`, `townLinesOf`;
  - the story's days, `festivalsOf`.
- `romance/occasions.ts`, which plays three occasions today (`new-year`, `flower-show`, `derby-night`) from the calendar:
  one action each, the day's event actions first, once a day with each Uma (`today.occasions`), paying nothing.
- `romance/acts.ts`: `chatLineV4` and `giftLineV4`. Also `town/town.ts`'s town line, and the calendar's view of the
  story's days and anniversaries.
- What the pack holds now: each Tier 1 route writes 68 events. Each Tier 1 bible adds four fields the game ignores:
  - `greetings`: `birthday`, `places.<place>`, `seasons.<season>`, `times.morning|evening|night` and
    `weather.rain|snow`, each a list of lines;
  - `smallTalk`: a list of `{ lines: [[speaker, line] × 3], at?, season?, stage? }`. The speaker is her character id or
    `you`; `stage` is `friend`, `partner` or `spouse`;
  - `giftLines`: `loved`, `liked`, `neutral`, `disliked` and `birthday`, each a list of lines;
  - `voice`.
- **Never read the story's text:**
  - work from field names and ids, as above;
  - write tests from `@luismlorenzana/uma-data/testing` and the invented stand-in pack;
  - no story line, Uma name or outfit name goes in git.

## Decided

### 1. Every occasion plays on its day

An **occasion** is a scene for a day of the year, played with each Uma who has one, as the three are today:
- from the calendar's day and the morning's line;
- one action each, the day's event actions first;
- paying nothing, and never needing her Ready.

The game plays these occasions, each from her route when written:

| Occasion | Its event id | Its day | Who | Unwritten |
|---|---|---|---|---|
| New Year's | `new-year` | Spring 1, from year 2 | Everyone met | The default story's (as now) |
| A festival's day | its rule's id: `flower-show`, `fishing-derby`, `cooking-contest`, `animal-show`, `harvest-cup` | The festival's day, wherever the story puts it | Everyone met | The default story's for the Flower Show (as now); none for the others |
| A festival's night | `<festival>-night`; the story's names stay as aliases: `derby-night` (the Fishing Derby's), `harvest-moon` (the Cooking Contest's) | The festival's day, its night | Everyone met | The default story's for `derby-night` (as now); none for the others |
| Her birthday | `birthday` | Her birthday | Her, once you've met | None |
| Her anniversary | `anniversary` | Her wedding's date, each year from the first anniversary | Her, once married | None |
| A story day | the day's `scene`, else its `id` | `world.json`'s `days` (and the game's own, below) | Everyone met | None |

- **A day with several of hers** plays one of them, chosen in this order: her birthday, her anniversary, the
  festival's day, a story day. A festival's night is a second slot, played after its day, so a festival day can play
  both of hers. `today.occasions` grows in place to hold the occasion's id with hers. An entry in the old form, her id
  alone, means the day's one occasion.
- **The game's own small days.** These play today's pack now. The story moves or renames one, or adds any other, by
  `id` in `world.json`'s `days`.

  | Day | `id` (its scene) | When |
  |---|---|---|
  | Blossom viewing | `blossom-viewing` | Spring 6 |
  | The wishing night | `wishing-night` | Summer 6 |
  | The first cold evening | `first-cold-evening` | Autumn 4 |
  | The first snow | `first-snow` | Winter 2 |
  | The longest night | `longest-night` | Winter 6 |
  | The sweets day | `sweets-day` | Winter 8 |

- **`WorldDay` gains an optional `scene`:** the event id it plays, which defaults to its `id`. A day with no scene
  written for anyone shows on the calendar as now.
- **Outfits** are as ever: the scene's `outfit`, else its moment's:
  - a festival's night, the kimono;
  - her birthday's evening and her anniversary, the dinner dress;
  - a small day, the season's.

### 2. Talk that knows the day

These bible fields become fields the game reads, each with the reader's usual errors (an error skips only that field)
and a row in the story pack's bible table:

- **`giftLines`:** a gift draws her line for its taste from her own lines when she has any, else the default story's.
  On her birthday it uses `giftLines.birthday` first.
- **`greetings`:** a chat, and a talk in town, opens with her greeting, then her line as today. The greeting comes from
  the most specific set that applies and holds lines:
  1. her birthday;
  2. the place where you're talking, `places.<id>`: her town spot or location in town, or the farm's place where she
     works or lives;
  3. the season;
  4. the hour: `morning` by day, `evening` at an evening, `night` at a night in and as the night's companion.

  Each is drawn by the account, the day and her id, so it holds all day.
- **`smallTalk`:** a chat draws from her stage's lines and the small talks that fit the moment together. A small talk
  fits when every tag it carries matches: `at` the place, `season` the season, `stage` her chat set. A drawn small talk
  plays as its three lines on the dialogue engine, her line, yours and hers, with `you` as the farmer.
- **`greetings.weather`** is read and kept. It plays once the game has weather, which it doesn't today: a note says
  so.
- **`voice`** is the story's own: notes on how she talks, never shown.

### 3. The reader, the status and the docs count it all

- **The game's events grow:**
  - `STORY_EVENTS` gains the festivals' nights, `birthday`, `anniversary`, and the story days' scenes (the game's six,
    and any day in `world.json`);
  - an event id the game has no moment for still notes "kept for the story".
- **`complete.ts`'s parts** count the occasions a route can write, plus the greetings, small talk and gift lines. So
  `pnpm story:status` and `story:ship`'s check say "complete" only when everything the game plays is hers.
- **Nothing is keyed on a tier or an Uma.** A release that adds Umas, scenes, greetings or days plays them on publish,
  with no deploy.

### 4. The save

v5 grows in place:
- `today.occasions` holds an occasion's id with hers;
- a save from before reads as it did.

Nothing moves `updatedAt`.

### Not in this packet

Group scenes for the families and crews (`circles.json`): the roadmap's 2.6 has the story's ask. Weather.

## Do

1. **The domain:**
   - the occasions and their order;
   - the festivals' nights, birthday and anniversary;
   - the game's small days and `WorldDay.scene`;
   - greetings, small talk and gift lines;
   - the reader, `complete.ts` and the save;
   - with tests.
2. **The web:**
   - the calendar's day and the morning's line for every occasion;
   - the chat and the town talk with a greeting;
   - small talk as a three-line exchange;
   - her gift line.
3. **Docs:**
   - [the story pack](../../story-pack.md): the bible's new read fields, the occasions' ids and days,
     `WorldDay.scene`, and what "complete" counts;
   - [the game mechanics](../../game-mechanics.md): the occasions table and talk;
   - run `pnpm docs:update`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the main chunk stays in its budget; the private-content guard passes.
- **Tests,** on the stand-in pack:
  - **occasions:**
    - each occasion on its day, including a festival the story moves and a `world.json` day that moves a small day;
    - birthday and anniversary, the anniversary only from the first;
    - a festival day playing both its day and its night;
    - several on one day playing one, in the order above;
  - **talk:**
    - gift lines, her own and else the default's, and the birthday's;
    - greetings in the order above;
    - small talk only when its tags fit;
  - **the reader and the save:**
    - the reader no longer notes the occasions' ids;
    - `complete.ts` counts the new parts;
    - an older save loads, and a new one round-trips.
- **`pnpm story:ship --dry-run` on the current drafts:**
  - no "kept for the story" note for the 14 events;
  - every Tier 1 Uma complete, or listed with exactly what she's missing.
- **Locally, in landscape,** on release 8's pack (served read-only, never shipped from here), on a simulated farm loaded
  into the local app only:
  - a festival day with its day and night scenes;
  - a small day's scene;
  - a chat with a greeting and a small talk;
  - a gift line.
- Production after the deploy: health shows the commit. The pack needs no new ship: release 8 holds it all.
