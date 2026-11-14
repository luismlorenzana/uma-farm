# The story pack: a menu

**For the story session.** This page lists everything the game can read from a story pack: what each part does in play,
and what plays when it's missing. It's a menu, not a checklist:

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
written. The Farm Story Sandbox marks, for each character, what's written and what's still the default. How your work reaches the game is in
[F40](handoff/tasks/F40-story-authoring.md); how the game plays is in
[the game mechanics](game-mechanics.md#the-cast-and-the-story-pack). The page view is
[story-pack.html](pages/story-pack.html).

## How the game reads a pack

### The files

The pack is a folder of JSON files in `content/story/`. Every file is optional.

| File | What it holds | Without it |
|---|---|---|
| `cast.json` | Who the pack holds, in its order, and what's given of each | Master data's first five characters, on the default story |
| `ties.json` | The ties between characters | No ties |
| `umas/<characterId>.json` | Her bible: her favourite line, gifts, route beats, chats, town lines and more | Her calling gives her line (else her stats in master data), she loves her line's favourite good and finds the rest neutral, she talks in the default story's lines and in town in the game's |
| `routes/<characterId>.json` | Her scripted events, by id: the rungs, her life's events, her occasions and the evenings' scenes | Each plays the default story's, which pays as a written one does |
| `pairs/<a>-<b>.json` | A tie's conversations, by bond level | Two short lines, one each, at every level |
| `household.json` | The household scenes, house lines and the finale | The game's short cards; house lines come from her temperament |
| `opening.json` | The opening: the start's lines, after the farmer's name | The game's three short lines |
| `town.json` | The town's people (Umas in the town's roles) and its six spots | Master data's characters fill the roles; the game's own six spots |
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
| A field the game can't use (a calling, place or trigger that isn't on the menu, a birthday that isn't a real date) | That field: what plays without it plays |
| A chat line or a house line too long for its screen | That line |
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
| A chat line | 160 |
| A house line | 120 |
| A beat's hint (her profile's Next card) | 160 |
| A beat's caption (the Memory) | 400 |
| A tie's line | 400 |
| Her keepsake's name, and its line | 40, and 160 |
| Her pet name for you | 24 |
| A town line | 160 |
| A sister's name, a town spot's name | 40 |
| A town spot's line, what one of the town's people does | 160 |
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
- **The protagonist is a man** (the owner, 2026-11-14): named by the player, never drawn. A line may say he, her
  husband, the groom; no word about him is a note any more.
- Nothing reads as school.

## The cast: `cast.json`

### The file

```json
{
  "welcome": ["9000007", "9000002"],
  "umas": [{ "characterId": "9000001", "spot": "cafe" }, { "characterId": "9000002", "outfitId": "900000201" }, { "characterId": "s900000202", "name": "Her name" }]
}
```

| Field | What it does in play | Without it |
|---|---|---|
| `umas` | The cast, in its order: every character the pack holds. The order breaks ties wherever the game needs one | Master data's first five characters, by id |
| `welcome` | **The welcome list:** who comes to the farm in the first days, in order, any number. From day 1, one a morning visits the Gate (the first on day 1, the next the morning after the one before her is met), and each meets you on her first talk, whatever her trigger. Her arrival scene is her Gate visit. Day 1's is the farm's first helper | The first five of the cast, in its order (sisters aside) |
| `version`, `export`, `ranker` | The story's own (the sandbox's) | Nothing |

A `welcome` id that isn't in the cast is a note, and she never visits the Gate. A cast file's old `opening` list is
noted and dropped: the opening brings nobody, and the welcome list visits the Gate.

### Each character

Only her `characterId` is needed: master data's id for her, a positive integer, or a sister's id (below). Everything
else is optional, and any field the game doesn't read is kept for the story.

| Field | What it does in play | Without it |
|---|---|---|
| `characterId` | Who she is | The character is skipped (an error) |
| `outfitId` | The one outfit she plays as: her face, bust, talents and temperament | Her default outfit from master data: her first original one |
| `calling` | Her line when her bible gives none: `farming`, `foraging`, `fishing`, `mining`, or `quarry` (mining at the Quarry) | Her bible's `favouriteLine`; with neither, the work her stats in master data suit best |
| `spot` | **Her favourite of the town's spots** (`plaza`, `market`, `cafe`, `harbour`, `library`, `track`): she's out there more often than anywhere else | None: she's out at any spot alike |
| `name` | **A sister's name** (read for a sister only): master data has none for her | Her elder's name, as her sister |
| `birthday` | `{ "month": 1–12, "day": … }` on a real date, when master data has none | Master data's birthday, or none |
| `meet` | **Her trigger to meet,** from the trigger menu below: when it's met, her story begins ([meeting her](game-mechanics.md#meeting-her)). Not read for the welcome list's, who meet you on their first talk | Talk with her on three different days |
| `chapters` | **Her chapters,** below: they frame her route on her profile, the People page and the morning ([her chapters](game-mechanics.md#her-chapters)) | The four default chapters |
| `arrives` | **Retired:** meeting her replaced it. Any `arrives` is noted and dropped; her `meet` says when you meet her (a festival, another's event and a Farm Rank are on the menu), and the Dorm's levels bring beds only | — |
| `paragraph` | The story's own: the sandbox shows it | Nothing |

### Sisters

A sister is an outfit of an Uma, presented as a character of her own, with her own name and profile: the Uma Ranker's,
named `s<outfitId>` (`s` and her outfit's id). The pack takes her id wherever it takes a character's: the cast, the
welcome list, a tie's `a` or `b`, her bible `umas/s<outfitId>.json`, her route `routes/s<outfitId>.json` and a pair's file.

- **Her face, bust, talents and temperament** are her outfit's, from master data: an `outfitId` on her entry is ignored
  (a note).
- **Her name** is her entry's `name`, from the pack's private release at run time, never git. Without one, she shows
  as her elder's sister (a note).
- **She lives in town** and is out there like everyone else, and is met like anyone: by her `meet`, else three days'
  talks. Met, she moves into the Dorm while a bed is free, as anyone does. The default welcome list leaves sisters out;
  a pack's `welcome` may name one.

### The trigger menu

One menu for her trigger to meet (`meet`) and a chapter's gate (`gate`). Each is an object with its `kind`. A gate
takes what the farm holds (`built`, `farm-rank`, `shipped`, `event`), a `season` or a `festival`; the town's kinds
(`talks`, `gift`, `spot`) are meeting her own, so a gate of one is an error and the chapter plays without it:

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
doesn't have yet) is a note. A character on the welcome list meets you on her first talk, whatever her trigger.

**When each is checked** in play: talks, a spot, a season and a festival on a talk in town; a gift on a gift in town
(after that day's talk; it spends the good); a Farm Rank, a place built, a good shipped and another's event on a talk or
a gift, and every night, so she's met the morning after it holds. Her meeting scene plays as soon as she's met.

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
| `gate` | What the farm must have first, from the trigger menu (the farm's kinds, a season or a festival). Until it holds, the chapter's first event waits, and her profile says what's needed: "Opens when the Kitchen is built". Once that event has played, the rest follow | It opens when its first event can play: the rung before it has played |

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
| `gifts.loved`, `gifts.liked`, `gifts.disliked` | Her tastes, any number of each: a goods id each. A good not in the game yet is neutral until it is. Her loved good is also what the default story's lines call her favourite | The default story's: her line's favourite good loved (a Peach for farming, a Seashell for fishing…), the rest neutral |
| `gifts.proposed` | The story's list of goods it would like added: a request to the game | Nothing |
| `route` | Her beats, by rung (below) | Each event plays with the game's defaults |
| `chats.friend`, `chats.partner`, `chats.spouse` | Her chat lines by stage, any number, one a day: friend from Friendship 1 to the confession, partner from Romance 1 to the wedding, spouse after it | The default story's talks for her stage (acquaintance, friend, farmhand, sweetheart, engaged, married) and her temperament |
| `townLines` | What she says when you talk with her in town, any number, one a day, `{farmer}` your name | The game's six short lines |
| `keepsake.name`, `keepsake.line` | The keepsake she gives at Friendship 10, on her profile | "Her keepsake", with a plain line |
| `petName` | What she calls you from Romance 1, on her profile. No placeholder | Your name |
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
| `trigger` | Its setup besides her full bar: `hearts`, she's `working` an activity, an `item` is in the Warehouse, a `bond` with someone reaches a level. A `chapter` setup is noted and read as her full bar: the farm has no global chapters. Never a clock, the weather, a season or a festival | Her full bar only |
| `place` | Where it plays, on her Next card and the Memory | No place shown |
| `together` | What you do together: `talk`, `work` an activity, a `date` game (fishing, cooking, stargazing, footrace, dance, picnic, market, boat, walk, crafting), a `gift` of a good, or `help` someone. A work, a date or a gift adds a play when the event scripts none | No play added: the best choice taken is the grade |
| `beat` | Its Memory's caption | The game's card's first line ("A quiet afternoon with her.") |
| `hint` | What her profile says while it's next | None |
| `unlock` | An `item` (a good, into the Warehouse), a `place` or a `perk` in words, on the level-up card | None |
| `ladder`, `hearts` | The story's own | Nothing |

## Her route: `routes/<characterId>.json`

```json
{ "events": [{ "id": "arrival", "steps": [{ "narrate": "Someone new leans on the Gate." }, { "say": "9000004", "line": "Is this the farm?" }] }] }
```

Each event is one of the game's, by its `id`, with its `steps`. Any number of events, in any order. An event with an
error is skipped, and the rest of her route plays. **Each one you write replaces the default story's of that id; each
one you leave out plays the default.**

| `id` | What it is | When it plays |
|---|---|---|
| `arrival` | Meeting her | As soon as she's met |
| `f1` … `f10`, `confession`, `r1` … `r10`, `proposal`, `wedding`, `s1`, `s3`, `s5` | Her route's rungs | When she's Ready; they pay |
| `wedding-night` | The wedding night: tender, fading to morning, in the wedding night outfit unless you name another | Right after the wedding, before the Married card |
| `moving-in`, `s2`, `s4` | Moving in, married life 2 and 4 | When the Uma loop (F79) gives them their moment |
| `new-year`, `flower-show`, `derby-night` | Her occasion scenes: New Year's, the Flower Show and the Fishing Derby's night | On their day, from the calendar, with each Uma you've met: New Year's from the second year, the two festivals where the story puts them ([occasion scenes](game-mechanics.md#occasion-scenes)) |
| `birthday`, `fishing-derby`, `cooking-contest`, `animal-show`, `harvest-cup` | Her other occasions: her birthday, the Fishing Derby's day and the other festivals | Read and kept; they play when their moments are built |
| `hangout-<kind>`, `date-<kind>`, `dinner-in-town`, `a-night-in` | An evening's scene: a hangout's for walk, fishing, picnic, market, cooking and festival; a date's for every kind | When the evenings (F79) play their lines |

The rungs pay as written (below). The rest pay nothing: their choices are wording only, and the usual sizes don't apply
to them. Any other id is a note, kept for the story.

**An occasion scene** costs the player one action (a special day's event actions first) and pays nothing. It plays once
a day with each Uma, whatever her stage, so write it for a friend and a wife alike. Without an `outfit` she wears the
kimono at New Year's and on the derby night, and the garden party dress at the Flower Show.

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

## The household: `household.json`

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
{ "about": "The first morning.", "steps": [{ "narrate": "Morning on the farm." }, { "thought": "Someone's already at the Gate." }] }
```

| Field | What it does in play | Without it |
|---|---|---|
| `steps` | The lines, in a route's steps: `narrate`, `say` (anyone in the cast or the town's people), `thought` and `wait`, and `place` for the title line ("Day 1 · Gate"). Each line has a scene's limit (400) and `{farmer}` | The game's three short lines: the farm, its nine Carrot seeds, and someone waiting at the Gate |
| `about` | The story's own: kept, never shown | Nothing |

- **No picks:** a `choice`, a `play`, a `flag` or a `when` is an error that skips that step; the rest plays.
- **With no line left** (every step skipped, or only pauses), the game's three play (a note).
- **What the opening brings:** nobody. As it ends (read or skipped), the welcome list's first is at the Gate, day 1's
  visitor; Say hello there meets her, she moves in as the farm's first helper, and her arrival scene plays. A line that
  tells the farmer someone is waiting at the Gate reads true.

## The town: `town.json`

The town's people and its six spots. Every part is optional.

```json
{
  "people": [{ "characterId": "9000101", "does": "Keeps the smithy down in town.", "game": "ida-stone" }],
  "spots": [{ "id": "cafe", "name": "The Café", "blurb": "Tea, cake and a seat by the window.", "keeper": "9000101" }]
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
| `keeper` | Who's usually there: one of the town's people, by her `characterId` or her role's id | The game's keeper for it: the mayor, the shopkeeper, the cook, the captain, the guide, the courier |

A spot `town.json` doesn't name plays the game's own (a note).

## The world: `world.json`

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
| `names.town` | The town's name: the Town on the map (its place's own `name` first) and its screen's title, the opening's title line, the Gate's "Meet everyone else in *Fernwick*", the morning's "Met *name* · in *Fernwick*", and the Diary's "The farm" page | "Town" on the map and its screen; "in town" in the words |
| `names.farm` | The farm's name: the opening's title line ("Day 1 · Thistle Farm, Fernwick") and the Diary's "The farm" page | "The farm"; the opening's title line says "Day 1" |
| `names.region` | Under the farm's name on the Diary's "The farm" page, after the town | None |
| `history` | A few lines of the farm's past: the Diary's first page, **"The farm"**. `{farmer}` is filled | None: the page shows the names alone, and with no names either there's no page |
| `festivals` | The year's festivals: the calendar, the date chip, the morning's "*Festival* tomorrow" and "today", festival night, and `festival` triggers and gates | The game's five, on their days |
| `days` | The story's holidays and minor days: the calendar marks each day and lists them with their lines, and the morning says "*Market day* tomorrow" and "today" | None |
| `places` | By place id: each place's `name` (the map, its quick look's title, its Build card's "The *name* stands tomorrow.") and its one `line` (its quick look) | The game's own name and line |
| `seasons` | By season: a line under "*Spring* begins" on the morning that opens it | "Spring begins" alone |
| `notes` | **Town notes:** a list in the Diary that fills as you play, each unlocked once by its `unlock` and kept; the morning names the night's | None |

### The festivals

Each festival is `{ "id", "name", "season", "day", "happens" }`, its day a season and a day of it, 1–12.

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
| `day` | Its day of the season, 1–12, or a list of them (`[4, 8, 12]` for a weekly market) | The day is skipped |
| `line` | What happens, under its name on the calendar, at most 160 characters | None |

- **A day is the story's own:** it may share a festival's day or another day's. It's marked and said, and plays nothing
  of its own; the special days that give event actions are New Year's, the festivals and her birthday.
- **The morning** names the day's and the next day's: "*Market day* today", or "*Market day* +1 more tomorrow".

### The places

`places` is an object by place id: `fields`, `mill`, `coop`, `forest`, `sawmill`, `barn`, `fishery`, `smokehouse`,
`kitchen`, `mine`, `smelter`, `restaurant`, `quarry`, `cutter`, `forge`, `bin`, `warehouse`, `dorm`, `board`, `gate`,
`dock`, `shop`, `festival`, `expeditions`, `town` and `boat`. Each holds an optional `name` and an optional `line`; one
it leaves out keeps the game's own. The Town's name falls back on `names.town`, then "Town".

### Town notes

A note is `{ "id", "title", "lines", "unlock" }`: its id (lowercase words joined by `-`, which the save keeps), its
title in the Diary's list, its lines (`{farmer}` filled), and what unlocks it, from the trigger menu:

| Unlock | Holds | Checked |
|---|---|---|
| None | From the start: the note is known as soon as the pack plays | — |
| `{ "kind": "event", "after": "9000001:arrival" }` | **Meeting someone:** her meeting scene has played (any event of anyone's, as the menu reads it) | A talk or a gift in town, Say hello at the Gate, and every night |
| `{ "kind": "spot", "spot": "cafe" }` | **A spot visited:** a talk with anyone out at that spot | A talk in town |
| `{ "kind": "season", "season": "winter" }` | All that season | A talk, a gift, Say hello, and every night: the first morning of the season |
| `{ "kind": "festival", "festival": "lantern-walk" }` | On that festival's day (the game's or the story's own, as the story puts it) | A talk, a gift, Say hello, and every night: the festival's morning |
| `{ "kind": "farm-rank", "rank": 4 }`, `{ "kind": "built", "place": "mill" }`, `{ "kind": "shipped", "good": "carrot", "count": 50 }` | What the farm holds | A talk, a gift, Say hello, and every night |

- **Talks and a gift** are meeting her own: as an unlock they're an error, and the note is known from the start.
- **Each unlocks once and stays.** The save keeps only the ids unlocked, never a word of the note: a note the pack
  later drops is gone from the list, and one it brings back returns.
- **Where it shows:** the Diary's **Town notes**, in the file's order, each a tap to read; a talk or Say hello that
  unlocks one says "Town note · *title* ›" there and then; the night's are named the next morning in New today ("*title*",
  tagged **Town note**, or "*title* +2 more"), a tap opening the note in the Diary.

## Shipping

**`pnpm story:ship --note "what's new, in one line"`** puts the pack on the owner's phone. Run it at the end of every
writing session, on the machine where the story is written (macOS or Windows). In order:

| Step | What happens |
|---|---|
| 1. Check | Reads `content/story/` with the game's own reader and prints what it skips (the errors) and the notes. Nothing blocks |
| 2. Release | Builds the release into the ignored `content/story-release/`: the pack as the game reads it, every broken part already skipped, every other field kept |
| 3. Publish | Numbers the release (one more than the bucket's current one, or 1), dates it and gives it its note, then uploads the new hash-named files first and `story.json` last to the farm's private bucket |
| 4. Back up | `pnpm story:push farm` in the sibling `../uma-platform` checkout, when it's there; skipped with a note when it isn't |
| 5. Say | The release's number, its date and its note |

- **The note** is `--note "…"`, else the first line of `ship.md` in the pack's folder, else none. It's one line of at
  most 160 characters, since the morning shows it; a longer one stops the ship before anything is uploaded.
- **On the phone:** the next morning on an existing farm opens New today with **"New story arrived · *your note*"**,
  once a release, and Account shows **Story: Release *n*, *date***. A new farm meets the story in its opening.
- **Nothing new, nothing published:** a pack the bucket already plays keeps its number, and the drafts are still
  backed up. A ship that stopped partway is safe to run again.
- **`--dry-run`** reads the bucket (the number, which files are there) and lists what it would upload, uploading
  nothing.
- **Rolling back:** `pnpm story:ship --release <n>` publishes release *n*'s index again, numbered anew, with the note
  "Rolled back to *n*". The bucket keeps every file and the last ten indexes.
- **The machine:** gcloud is called with the environment only, never changing the account or its configuration.
  `STORY_GCLOUD_CONFIG` names the configuration (default `default`), `STORY_GCLOUD_PROJECT` the project (`uma-rpg`),
  `STORY_BUCKET` the bucket (`uma-farm-content`) and `STORY_PLATFORM_DIR` the uma-platform checkout
  (`../uma-platform`).
- **The steps alone:** `pnpm story:release` builds the release (any pack releases; it refuses only when there's no pack
  folder), and `pnpm story:publish` uploads it, unnumbered, so the morning doesn't announce it. The ship is the routine.

## What reads now, and what acts on it later

| Item | Read now | Acts in play |
|---|---|---|
| Her outfit, calling, birthday, bible, route, ties, pairs, household, the opening | Yes | Yes, today |
| A scene's `outfit`, a line's `emote` | Yes | Yes, today: [the dialogue engine](game-mechanics.md#the-dialogue-engine) dresses her and changes her face, for the Umas whose portraits are published |
| The town's people and spots, her favourite spot, her town lines, a sister's name | Yes | Yes, today: [the town](game-mechanics.md#the-town) |
| The welcome list, her trigger to meet | Yes | Yes, today: [meeting her](game-mechanics.md#meeting-her) |
| The world: names, history, festivals, places, seasons, Town notes | Yes | Yes, today: [the world](game-mechanics.md#the-world-in-the-pack) |
| Her chapters and their gates | Yes | Yes, today: [her chapters](game-mechanics.md#her-chapters) |
| What plays when a part is missing | The default story for every read | Yes, today: [what plays without the story](game-mechanics.md#what-plays-without-the-story) |
| The wedding night (`wedding-night`) | Yes | Yes, today: after the wedding |
| Her occasion scenes: `new-year`, `flower-show`, `derby-night` | Yes | Yes, today: on their days, from the calendar ([occasion scenes](game-mechanics.md#occasion-scenes)) |
| The world's `days` | Yes | Yes, today: [the calendar](game-mechanics.md#the-calendar-screen) and the morning |
| Moving in, married life 2 and 4, her other occasions, the evenings' scenes | Yes | When the Uma loop (F79) and the festivals land; the default story writes each until then |
