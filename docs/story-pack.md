# The story pack: a menu

**For the story session.** This page lists everything the game can read from a story pack: what each part does in play,
and what plays when it's missing. It's a menu, not a checklist:

- **every part is optional;**
- **any number of characters is fine,** in any order, including none;
- **nothing is counted:** no fixed opening, list sizes, rungs or places;
- **a partial pack is the normal case,** and any pack can be released.

Write only what you want the game to show. Everything else in `content/story/` is yours: the game never reads it. How
your work reaches the game is in [F40](handoff/tasks/F40-story-authoring.md); how the game plays is in
[the game mechanics](game-mechanics.md#the-cast-and-the-story-pack). The page view is
[story-pack.html](pages/story-pack.html).

## How the game reads a pack

### The files

The pack is a folder of JSON files in `content/story/`. Every file is optional.

| File | What it holds | Without it |
|---|---|---|
| `cast.json` | Who the pack holds, in its order, and what's given of each | No characters |
| `ties.json` | The ties between characters | No ties |
| `umas/<characterId>.json` | Her bible: her favourite line, gifts, route beats, chats and more | Her calling gives her line, every gift is neutral, she chats in her temperament's lines |
| `routes/<characterId>.json` | Her scripted events, by rung | Her arrival is the game's own short scene; her other events wait ("Her story is still being written") |
| `pairs/<a>-<b>.json` | A tie's conversations, by bond level | The tie's line stands in |
| `household.json` | The household scenes, house lines and the finale | No household scenes; house lines come from her temperament |

Any other file (`world.md`, `tags.json`, `reviews.json`, notes, drafts) is the story's own. The sandbox shows some of
them; the game never reads them, and a release never includes them.

### Errors and notes

The game's reader, shared by the game, the release and the Farm Story Sandbox, finds two kinds of things.

| | What it is | What happens |
|---|---|---|
| **An error** | Only what the game can't read: a file that isn't JSON or isn't the shape the game reads, a value the game can't use where it reads it, or a line longer than its screen | **It skips the one part it's in,** and the rest of the pack plays. The part is the smallest that can go: a line in a list, a field, a beat, an event, a level, a tie, a character, or at most one file |
| **A note** | Everything else: something not written yet, an unusual count, a word that genders the farmer, a bible and the tag sheet that disagree | **Nothing.** Notes block nothing; they tell you what plays instead |

What an error skips, by where it is:

| Where the error is | What's skipped |
|---|---|
| A file that isn't JSON | That file |
| A file that isn't the shape the game reads (a cast that isn't an object, a route with no `events` list) | That file |
| A character with no `characterId`, or one listed twice | That character (the later one) |
| A field the game can't use (a calling, place or trigger that isn't on the menu, a birthday that isn't a real date) | That field: what plays without it plays |
| A chat line or a house line too long for its screen | That line |
| A step in an event the game can't play (a line too long, a choice with no options, a flag the save can't keep) | That event |
| A step in a pair's conversation | That bond level |
| A step in a household scene | That scene's part (its `open`, `close` or one spouse's beat) |

### Line lengths

Each limit is what its screen shows. A longer line is an error.

| Text | At most |
|---|---|
| A line in a scene: said, narrated or thought | 400 characters |
| A choice's option | 160 |
| A play's prompt | 120 |
| A chat line | 160 |
| A house line | 120 |
| A beat's hint (her profile's Next card) | 160 |
| A beat's caption (the Memory) | 400 |
| A tie's line | 400 |
| Her keepsake's name, and its line | 40, and 160 |
| Her pet name for you | 24 |
| An unlock's perk, in words | 200 |
| A chapter's title | 40 |
| A flag's name | 64, in lowercase letters, digits and `- . : _` (the save keeps it) |

### The words

These are notes, and the owner's standing direction for anything on screen:

- `{farmer}` is the one placeholder: the farmer's name, filled as the line shows. Any other `{…}` shows as written.
- No word genders the farmer (husband, wife, boyfriend, girlfriend, groom, sir and the like, in anyone's lines; bride in
  the farmer's own).
- Nothing reads as school.

## The cast: `cast.json`

### The file

```json
{
  "welcome": ["9000007", "9000002"],
  "opening": ["9000004", "9000002"],
  "umas": [{ "characterId": "9000001" }, { "characterId": "9000002", "outfitId": "900000201" }]
}
```

| Field | What it does in play | Without it |
|---|---|---|
| `umas` | The cast, in its order: every character the pack holds. The order breaks ties wherever the game needs one | No characters |
| `welcome` | **The welcome list:** who comes to the farm in the first days, in order, any number. Read now; meeting her in town (F67) brings them | The first five of the cast, in its order |
| `opening` | Who comes up the road at the opening, in order, any number. Read now; it retires with the lean start (F65) | Those whose `arrives` is the opening; else the welcome list. With nobody, the opening ends on chapter 1's card |
| `version`, `export`, `ranker` | The story's own (the sandbox's) | Nothing |

A `welcome` or `opening` id that isn't in the cast is a note.

### Each character

Only her `characterId` is needed: master data's id for her, a positive integer. Everything else is optional, and any
field the game doesn't read is kept for the story.

| Field | What it does in play | Without it |
|---|---|---|
| `characterId` | Who she is | The character is skipped (an error) |
| `outfitId` | The one outfit she plays as: her face, bust, talents and temperament | A lettered disc named "An Uma", with D talents (placeholders give her master data's default outfit, F63) |
| `calling` | Her line when her bible gives none: `farming`, `foraging`, `fishing`, `mining`, or `quarry` (mining at the Quarry) | Her bible's `favouriteLine`; with neither, she has no line: no ×1.2 and no perk at her line |
| `birthday` | `{ "month": 1–12, "day": … }` on a real date, when master data has none | Master data's birthday, or none |
| `meet` | **Her trigger to meet,** from the trigger menu below. Read now; meeting her (F67) acts on it | Talk with her on three different days |
| `chapters` | **Her chapters,** below. Read now; her chapters' screens (F68) act on them | The four default chapters |
| `arrives` | How she comes to the farm today: `opening`, a `chapter`, a `festival` (and a `year`), the Dorm's `beds`, or after an `event`. Meeting her (F67) replaces it | She doesn't come to the farm on her own until meeting her lands (unless the opening brings her) |
| `paragraph` | The story's own: the sandbox shows it | Nothing |

### The trigger menu

One menu for her trigger to meet (`meet`) and a chapter's gate (`gate`). Each is an object with its `kind`:

| Spelling | Meaning |
|---|---|
| `{ "kind": "talks", "days": 3 }` | Talk with her on this many different days |
| `{ "kind": "gift" }` | Give her a gift she likes |
| `{ "kind": "gift", "good": "carrot" }` | Give her this good |
| `{ "kind": "spot", "spot": "plaza" }` | Talk with her at one of the town's spots (the town, F66, names them) |
| `{ "kind": "season", "season": "winter" }` | Talk with her in a season: `spring`, `summer`, `autumn` or `winter` |
| `{ "kind": "festival", "festival": "harvest-cup" }` | Talk with her on a festival: `flower-show`, `fishing-derby`, `cooking-contest`, `animal-show` or `harvest-cup` |
| `{ "kind": "farm-rank", "rank": 4 }` | Reach a Farm Rank, 1–10 |
| `{ "kind": "built", "place": "kitchen" }` | Have one of the farm's places built |
| `{ "kind": "shipped", "good": "carrot", "count": 50 }` | Ship this many of a good, in all |
| `{ "kind": "event", "after": "9000002:f3" }` | After another character's event plays (`<characterId>:<event>`, or an event id: anyone's) |

A trigger that isn't on the menu is an error: the default plays. One that can never hold (Farm Rank 12, a good the game
doesn't have yet) is a note. A character on the welcome list meets you on her first talk, whatever her trigger (F67).

### Her chapters

Her story is hers, in her own chapters, from meeting her to married life. A chapter groups her events along the game's
backbone: friendship F1–F10 and the confession, romance R1–R10, the proposal and the wedding, then married life.

```json
"chapters": [
  { "title": "A new face", "events": ["arrival", "f1", "f2", "f3"] },
  { "title": "Kitchen days", "events": ["f4", "f5"], "gate": { "kind": "built", "place": "kitchen" } }
]
```

| Field | What it does in play | Without it |
|---|---|---|
| `title` | Its title on her profile | No title (a note) |
| `events` | Her rungs it holds, in order | It holds none (a note) |
| `gate` | What the farm must have first, from the trigger menu. Until it holds, her events in it wait: "Opens when the Kitchen is built" | It opens when its first event can play |

A rung in two chapters plays in the first (a note); rungs in none of her chapters are listed in a note. With no
`chapters`, she has the four defaults:

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

A tie needs only its two characters, `a` and `b`. A pair tied twice keeps the first.

| Field | What it does in play | Without it |
|---|---|---|
| `a`, `b` | The two characters. A tie to someone outside the cast never starts (a note) | The tie is skipped (an error) |
| `kind` | Its word on her profile: `friends`, `rivals`, `mentor`, `teammates`, `sisters`, or `other` ("Close") | "Close" |
| `strength` | 1–3: the bond it starts at when both are on the farm (0, 50 or 150 points), and her closest friends | 1: known, starting at 0 |
| `line` | Its line on her profile and where a pair conversation isn't written | "Closer now" |
| `history`, `source`, `from` | The story's own | Nothing |

No character needs a number of ties.

## Her bible: `umas/<characterId>.json`

The file's name says whose bible it is. A `characterId` inside that disagrees is a note.

| Field | What it does in play | Without it |
|---|---|---|
| `favouriteLine` | Her favourite work: `farming`, `ranch`, `mining`, `fishing`, `foraging`, `cooking`, `serving` or `forging`. ×1.2 rank points there, +10 a night, her perks at her line's places | Her calling's line |
| `gifts.loved`, `gifts.liked`, `gifts.disliked` | Her tastes, any number of each: a goods id each. A good not in the game yet is neutral until it is | Every gift neutral |
| `gifts.proposed` | The story's list of goods it would like added: a request to the game | Nothing |
| `route` | Her beats, by rung (below) | Each event plays with the game's defaults |
| `chats.friend`, `chats.partner`, `chats.spouse` | Her chat lines by stage, any number, one a day: friend from Friendship 1 to the confession, partner from Romance 1 to the wedding, spouse after it | Her temperament's lines |
| `keepsake.name`, `keepsake.line` | The keepsake she gives at Friendship 10, on her profile | "Her keepsake", with no line |
| `petName` | What she calls you from Romance 1, on her profile. Never gendered, no placeholder | None |
| `wedding.places` | Where your wedding may be held, any number, the first first: the game's places | Her wedding beat's place and the farm's: the chapel bell, the Fields, the overlook |
| `wishes` | `own-house` (she's happiest alone in her house) and `birthday-alone` (her birthday morning is hers) | Neither |
| `now`, `whyTheFarm`, `dream`, `blurb`, `laughs`, `hurts`, `season`, `festival`, `outfitId` | The story's own: the sandbox shows them | Nothing |

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
| `trigger` | Its setup besides her full bar: `hearts`, she's `working` an activity, an `item` is in the Warehouse, a `bond` with someone reaches a level, a `chapter`. Never a clock, the weather, a season or a festival | Her full bar only |
| `place` | Where it plays, on her Next card and the Memory | No place shown |
| `together` | What you do together: `talk`, `work` an activity, a `date` game (fishing, cooking, stargazing, footrace, dance, picnic, market, boat, walk, crafting), a `gift` of a good, or `help` someone. A work, a date or a gift adds a play when the event scripts none | No play added: the best choice taken is the grade |
| `beat` | Its Memory's caption | The rung's name |
| `hint` | What her profile says while it's next | None |
| `unlock` | An `item` (a good, into the Warehouse), a `place` or a `perk` in words, on the level-up card | None |
| `ladder`, `hearts` | The story's own | Nothing |

## Her route: `routes/<characterId>.json`

```json
{ "events": [{ "id": "arrival", "steps": [{ "narrate": "Someone new leans on the Gate." }, { "say": "9000004", "line": "Is this the farm?" }] }] }
```

Each event is a rung's, by its `id`, with its `steps`. Any number of events, in any order. An event with an error is
skipped, and the rest of her route plays.

### Steps

| Step | What it plays |
|---|---|
| `{ "say": "<who>", "line": "…", "emote": "happy" }` | A line, with the speaker's bust. Who speaks: anyone in the cast or the town's people (an id outside them shows as "An Uma", a note). The emote shows as its word: `happy`, `shy`, `sad`, `angry`, `surprised`, `thinking`, `laughing`, `tender` |
| `{ "narrate": "…" }` | Narration, in italics |
| `{ "thought": "…" }` | The farmer's thought, in italics |
| `{ "wait": 600 }` | A pause, in ms, 0–5000 |
| `{ "place": "fishery" }` | The title line's place from here on |
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
| Her arrival | One choice point and no play. With none it pays +50 alone; with more, the first pays |

## A pair's conversations: `pairs/<a>-<b>.json`

Named by the two ids in numeric order, `<a>-<b>`: the game finds it by that name, so another name is skipped.

```json
{ "a": "9000001", "b": "9000002", "levels": [{ "hearts": 1, "place": "fields", "steps": [ … ] }] }
```

| Field | What it does | Without it |
|---|---|---|
| `levels[].hearts` | The bond level 1–5 it plays at, once each | — |
| `levels[].place` | Its title line's place | No place shown |
| `levels[].steps` | The conversation: the two speak (anyone else is a note) | — |

Any levels, in any order. A level not written plays the tie's line. A pair the ties don't hold never plays (a note).

## The household: `household.json`

| Field | What it does | Without it |
|---|---|---|
| `scenes` | The household scenes at 5, 10 and 15 married, each `{ "at": 5, "open": […], "each": { "<id>": […] }, "close": […] }`. `open` and `close` speak through narration and the town's people; `each` is one spouse's beat | No household scene plays |
| `scenes[].each` | Each spouse's beat, in wedding order | Her beat is skipped |
| `houseLines` | `{ "<id>": ["…"] }`: a spouse's morning lines in her house, any number | Her temperament's lines |
| `finale` | The Great Harvest: `open`, `play`, `each`, `close` | No finale plays |

## Releasing a pack

- **`pnpm story:release`** reads `content/story/` with the game's own reader and writes the release. Any pack releases:
  it lists what it skipped (the errors) and the notes, and refuses only when there's no pack folder.
- **What's released** is the pack as the game reads it: every broken part already skipped, every other field kept.
- **`pnpm story:publish`** sends a release to the farm's private bucket when the owner wants a pack in the game. Claude
  runs it.

## What reads now, and what acts on it later

| Item | Read now | Acts in play |
|---|---|---|
| Her outfit, calling, birthday, bible, route, ties, pairs, household | Yes | Yes, today |
| The welcome list, her trigger to meet | Yes | When meeting her lands (F67) |
| Her chapters and their gates | Yes | When her chapters land (F68) |
| What plays when a part is missing | Today's fallbacks | Placeholders for every read (F63) |
