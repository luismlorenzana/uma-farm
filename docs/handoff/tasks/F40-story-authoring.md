# F40 — Author the farm's story: the cast, their lives, and a romance for every Uma

**uma-farm · the story session (Claude), and the owner · L · Needs: the cast on the Uma Ranker · Unblocks: the story's
release and the romance's go-live ([F56](F56-story-delivery.md)) · Content: private, in uma-farm's ignored
`content/story/` · [Roadmap](../../roadmap.md#phase-1-one-game-not-three): Phase 1, step 1.1**

## Why

The owner is making uma-farm a **romance simulation**. You play the farmer, a point of view who is never drawn, and you
can befriend and then romance **every Uma** in the cast. **Maxing every romance and unlocking each wedding scene is the
game's long goal.** The romance runs beside the farm's loop: farming, the ranch, mining, fishing, cooking, festivals and
expeditions are where it grows.

The deployed game still starts a farm with three random Umas from six cards. The owner doesn't want random. Like
uma-quest, the cast is **the owner's own authored characters**: the 20 Umas on the owner's Uma Ranker, in its order. The
romance build already plays an authored cast from the story pack
([game mechanics](../../game-mechanics.md#the-cast-and-the-story-pack)).

This packet writes the story's foundation:
- the world;
- the cast's lives in it;
- who knows whom;
- what each Uma loves;
- the shape of every route;
- three routes in full, as a pilot.

The owner reads each layer before the next is written. The game's romance is built and plays the pack; the story's
release ([F56](F56-story-delivery.md)) needs every Uma's bible and arrival scene.

## Context (read first)

**The farm, as built** (uma-farm, this repo): [the game mechanics](../../game-mechanics.md), above all
[Part 3, Hearts](../../game-mechanics.md#part-3--hearts-the-cast-and-the-romance).
- Umas joining over time: [the roster](../../game-mechanics.md#the-roster) and
  [arrivals](../../game-mechanics.md#arrivals).
- Festivals: [festivals](../../game-mechanics.md#festivals).
- The chapters, the original town cast, Umas in roles: [the chapters](../../game-mechanics.md#the-chapters),
  [the town's cast](../../game-mechanics.md#the-towns-cast), [the scenes](../../game-mechanics.md#the-scenes).
- Bonds between Umas: [bonds and ties](../../game-mechanics.md#bonds-and-ties).
- Your affinity and hearts with each Uma: [affinity](../../game-mechanics.md#affinity),
  [her route](../../game-mechanics.md#her-route).
- Conversations from templates, and pair conversations:
  [pair conversations](../../game-mechanics.md#pair-conversations).
- Time is turns: [work is measured in days](../../game-mechanics.md#work-is-measured-in-days).
- The rings and dishes: [the ring bench](../../game-mechanics.md#the-ring-bench),
  [her signature dish](../../game-mechanics.md#her-signature-dish).
- The pack's files and the validator's rules, from the game's side:
  [what the pack holds](../../game-mechanics.md#what-the-pack-holds).
- The goods: [the catalogue](../../game-mechanics.md#the-catalogue), and every id in `goods/ids.ts`.
- The code you'll write to and read from:
  - `packages/domain/src/story/` (`authored.ts` and its validator, `pack.ts`, `cast.ts`, `chapters.ts`, `scenes.ts`,
    `chapter-1.ts`): the format, and the scene shape the game plays;
  - `packages/domain/src/farm/visitors.ts`: affinity, hearts, gift tastes, chats;
  - `packages/domain/src/goods/ids.ts`: every good's id;
  - `tools/story-sandbox/`: the Farm Story Sandbox (`pnpm stories`).

**uma-quest, the model** (`~/workspace/uma-quest`, read only):
- Its way with stories: stories are private content, scenes are data, and bibles come first (RS15, RS18 and RS17 below
  take them from it).
- `docs/design/story-sandbox.md`: SB1–SB15, especially:
  - SB2, the cast as a private pack, built from the owner's ranking;
  - SB9, the layers, each read before the next;
  - SB13, the owner's reviews saved for the next session.
- Its script format, `packages/domain/src/story/script.ts`.
- Its adult travelers: every Uma drawn as a grown woman.

**uma-platform, the cast's source** (`~/workspace/uma-platform`, read only):
- The Uma Ranker ([platform-app](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/README.md)),
  read with `pnpm ranker:pull`: the owner's tiers, ranked per character. `docs/authoring/tiers.md` has the tiers it
  grew from.
- `docs/sprites/format.md`: which outfits have HD-2D sprite sets.
- [Uma Story](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/story.md#local-first-p150): the
  site is parked, since the story is written and read locally first.

## Decisions made

### The cast, the order, and where it's read

- **The cast's source is the Uma Ranker:** the Studio's boards retired into it. The 20 cast Umas stand; the Ranker's
  order is the authoring order and the owner's priority. `cast.json` records the Ranker read it was checked against
  (`ranker`: the board's and the profiles' revisions, and when).
- **The owner's priority Umas come first.** The opening three and the three pilot routes go to them, taken from the
  Ranker's order, or from a list the owner gives.
- **Tags before bibles.** `content/story/tags.json` holds each Uma's favourite line, season, festival and loved gift,
  with a one-line reason each from her career and character; her bible agrees with it, and the validator checks. Each
  tie says whether it's **real** (from the real careers, checked against public records) or the **story's** (`source`);
  a real one carries uma-quest's relationship id (`from`) once uma-quest has written them.
- **The counts, then the owner's read** ([F60](F60-story-counts.md)): the balance follows the read, with no quotas
  before.
- **Layer 2 includes each Uma's arrival scene.** F56's release refuses a pack where any cast Uma lacks her bible or her
  arrival scene, so the go-live needs all 20 of both and none of the pilot's full routes.
- **Layer 2 is written in waves of five,** in the Ranker's order (the private `notes.md` lists them).
- **Reading and verdicts stay in the Farm Story Sandbox:** the owner reviews there, and its Review panels write
  `content/story/reviews.json`, read before each next layer. uma-platform's Uma Story site is parked. Two optional
  helpers, run from uma-platform: `pnpm story:push farm` backs up the text, and `pnpm story:pull farm --drafts` takes
  the drafts to the Mac for F56. The game still reads only its own release (F56).
- **No shared format with uma-quest:** the two games keep their own formats, and share the cast and the player's stage.
- **F40 builds no art.** It writes text only. Character art (busts, expressions, event illustrations) is a separate,
  later effort, private in the pack.
- **The owner's live save is wiped** when the romance goes live (F56), so the authored start needs no migration path
  for an existing farm.

### What the romance reads: the fields and their rules

The romance asks these of the story, beyond the first shapes below. Write to them from layer 2 on. The validator in
`story/authored.ts` checks every one, and [the game mechanics](../../game-mechanics.md#what-the-pack-holds) has the
same rules from the game's side.

**The cast file**
- **`outfitId` is required** on every cast entry: a null reads "Name her outfit". It's the one outfit she plays as.
- **`birthday`**, only for a character master data's set lacks: `{ month: 1–12, day }` on a real date (29 February
  allowed). It wins where present.
- **Arrivals:** a `beds` arrival names a Dorm level 2–8 (the Dorm for 20); an `event` arrival's `after` is
  `<characterId>:<eventId>` (or a bare event id: anyone's).

**Her route**
- **`arrival`:** one scripted event per route, a 27th scene before Friendship 1, worth +50 and one choice. Routes have
  **27 rungs**, `arrival` first (hearts 0, a hearts trigger, exactly one choice point, no play).
- The game reads routes in a **partial mode** (an unscripted beat waits); the sandbox keeps the strict report.
- A beat's `trigger` is read for Ready: `working` (a running job at a place of that activity, or a tended block for
  farming), `item` (any stars in the Warehouse), `bond` (the pair's bond hearts) and `chapter`.

**Plays, choices and flags**
- **`play.as: 'pick' | 'rhythm'`** on a farming play only, so the author picks Pick or Rhythm (Pick by default).
- On a choice option, **`gives: { good, count: 1–5 }`**: an item cost, a good that exists, taken at any stars, lowest
  first, the option greyed "Need 1 Basil" without it. And **`reveals: '<good>'`**: one of her gifts (her loved, liked or
  disliked) that the option reveals.
- **`answer: 'yes' | 'not-yet'`** on **the confession's last top-level choice point only**, one of each, with no choice
  point after it.
- A step **`{ when: '<flag>', then: Step[], else?: Step[] }`** plays its steps while the flag is set. Flags change
  wording only.
- **Per event, on every path:** a heart event has **1–2 choice points** and **at most one play**; the confession, the
  proposal and the wedding **1–3 choice points** and **up to three plays**.
- A play's own `friendship` and `romance` are ignored (its grade pays). Its `good` steps play after a Great or Perfect,
  `miss` after a Fine. With no `play` step, the beat's `together` plays at the event's end (help and talk have none).
- Ask her replays the confession from her line before its answer, so write that line as her question.

**Her bible's optional fields**
- **`chats`**, her Friendship 1 perk's chat set: `{ friend: string[]; partner: string[]; spouse: string[] }`, about 10
  lines a stage, **3–20 lines each**, each at most **160 characters**, under the line rules (`{farmer}` the only
  placeholder, no gendered or school words). `friend` plays from Friendship 1 through the confession, `partner` from
  Romance 1 to the wedding, `spouse` after it. Without `chats` she keeps her temperament's lines.
- **`keepsake: { name, line }`**: the name 1–40 characters, the line 1–160, both under the line rules. She gives it at
  Friendship 10 and it grows at Spouse 5; it shows on her profile, never in the Warehouse.
- **`petName`**: her pet name for you from Romance 1: 1–24 characters, no placeholder, never gendered, as the farmer's
  own words.
- Both are optional: without them her profile says "Her keepsake" and her R1 perk says nothing more.
- **Her signature dish needs no field:** it's her `gifts.loved` when that's a dish id (`dish-<family>-<grade>`, listed
  under `proposed` until dishes are goods), else her line's dish kind. **Her dream** is her `s3` event, its effect the
  template's.
- **`wishes: ('own-house' | 'birthday-alone')[]`**: own-house asks for a house to herself in her S1 event (write it
  there); birthday-alone makes her birthday's morning hers alone.

**The wedding**
- Her bible may carry **`wedding: { places: [place, place, place] }`**: the three places your wedding may be held at,
  the player's first choice, each a story place (`STORY_PLACES`), all three different, nothing else in the object.
  Optional: without it the game offers her wedding beat's place and two of the farm's.
- Her **wedding** event's own `place` steps give way to the chosen place, so write it place-free (or let a place step
  stand only as a fallback).
- Its **last top-level choice point is the vow line**, paying as any choice, kept as the flag `vow:<n>` (1–3, the
  option's position), and the place as `wedding:<place>`, so later scenes may echo them with `when`.
- Her **R8** beat's `beat` line is the engraving her ring carries ("Her ring will read: ‘…’" on her profile from Romance
  8), so write it with that in mind.
- Every line of the proposal and the wedding says spouse, partner, vows, your wedding, you; never bride, groom, husband
  or wife for the farmer (the validator's gendered list).

**Pairs: `pairs/<a>-<b>.json`**
- The file's name and its `a`, `b` are the two character ids **in numeric order**; it's for **a tie's pair only**
  (RS12).
- Each level's `hearts` is 1–5 and written **at most once**. The game reads a pair **partial** (any levels written so
  far: an unwritten level gets the tie's `line`); the sandbox keeps the strict report.
- Each new bond heart opens that level; the player reads it from the morning, her profile or the Diary.
- **A choice in a pair's conversation is wording only:** it pays nothing and its flags aren't kept, though the validator
  still asks one option to carry a gain.
- A tie's `line` shows in the morning when the pair has no conversation at that heart, so write it as a short phrase
  ("Old rivals.").

**The household: `household.json`**
- `{ scenes: [{ at: 5 | 10 | 15, open, each, close }], houseLines, finale: { open, play, each, close } }`: three
  household scenes (at 5, 10 and 15 married), house lines, and the finale, the Great Harvest. Each scene once.
- Write it so it works whoever is married: `open` and `close` speak only through narration and the town's cast; `each`
  is `{ <characterId>: steps }`, with **a beat for every cast Uma** in every scene and the finale (she and the town's
  cast may speak; the game plays them in wedding order and skips one not written).
- The finale's `play` is one play step's `{ game, prompt }` (a dance at the festival ground on the stand-in).
- Choices are wording only (nothing pays) and carry no answer.
- `houseLines` is `{ <characterId>: 1–10 lines of 1–120 characters }`, said on a morning in her house (`{farmer}`
  allowed); an Uma without hers gets her temperament's original template. Mornings only in house lines (W16).

**What the story writes around:** arrivals are the authored ones only; events never wait on a season, festival or hour;
the farmer is never gendered at the wedding; one ring bench at the Forge opens after the first Romance 8.

### The owner's direction, RS1–RS20

The owner's direction, and the calls that make it writable. Each has an id, **RS1–RS20**, that the story's work cites.

**The cast**
- **RS1, the cast is the owner's Umas on the Uma Ranker:** the 20, ranked per character, in the Ranker's order.
  - Take the Ranker's read as uma-quest's sandbox does (SB2). The Ranker is the source of truth, and its order is the
    authoring order.
  - Umas beyond the 20 join later, in their own work; the sisters wait. Uma NPCs and boss boards aren't in this story.
  - Each Uma is a character, not an outfit. Her look in the farm is the outfit the cast file names: her sprite set's
    outfit where she has one, else her best-ranked outfit.
- **RS2, the farmer is you.** The player character is a point of view only, never drawn and never voiced.
  - The player names them at the start (`{farmer}` in lines). Lines say "you".
  - **Written to read for any farmer:** no gendered words for the farmer, ever.
  - The farmer's side of a conversation is their choices (2–3 short options), not monologue.
- **RS3, every Uma is an adult.** In uma-farm's universe each Uma is a grown woman, years past her racing days, with an
  adult life: work, a home, plans.
  - No school setting.
  - Nothing that reads under 18: no school uniforms as daily wear, no classes, no "senpai" framing.
  - Her profile says what she does now. Her racing career is her past, told as memories.
- **RS4, romance stays tender and non-explicit.** Warmth, teasing, dates, a confession, a first kiss at most, a proposal
  and a wedding. Fade before anything more. No sexual content.
  - Consent is clear in every romantic step.
  - She can say "not yet". The farmer can stay friends.
- **RS5, her canon personality, a new life.** Each Uma keeps who she is: her voice, her quirks, her dreams, her ties to
  other Umas from her racing career. All of it is set in the farm's world: why she came to the countryside, what she
  does here, what she wants next.

**How a route runs**
- **RS6, friendship becomes romance, on two ladders.**
  - **Friendship hearts 0–10:** your affinity with her
    ([game mechanics](../../game-mechanics.md#points-from-every-source)), from chats, gifts, praise, working together
    and festivals.
  - **At friendship 10, her confession event.** If the farmer accepts, the **romance hearts 0–10** open. Declining keeps
    her a close friend, and the farmer can ask again later.
  - **At romance 10, the proposal,** with a ring the farmer makes at the Forge
    ([game mechanics](../../game-mechanics.md#the-ring-bench); the Forge's Masterwork gives the best one), then **her
    wedding scene**.
- **RS7, heart events at every rung.** After her arrival scene, each Uma has 26 (27 rungs in all):
  - 10 friendship events;
  - the confession;
  - 10 romance events (dates among them);
  - the proposal;
  - the wedding;
  - three spouse events after it (S1, S3, S5), so married life goes on.

  Each event says when it opens (her bar full, plus at most one setup the player controls: she works a place today, an
  item in the Warehouse, another Uma's bond with her, a chapter; never an hour, the weather, a season or a festival),
  where (a place on the farm: the Fields, the Mine, the Kitchen, the festival ground, the pond at night), what the
  farmer and she do together, and the one-line hint her profile shows while it's next.
- **RS8, the romance grows while you work together.** Her events favour the places of her favourite work. Assigning her
  there, praising her, working beside her and taking her to festivals raise hearts, as well as chats and gifts. Some
  events need a shared job or an item: the farm's loop is the romance's stage. Seasons and festivals colour the words.
- **RS9, every route is her own, and they run side by side.**
  - Every Uma can be romanced and married in her own route. There's no exclusivity and no jealousy mechanic; the routes
    are parallel.
  - Each wedding is her own scene.
  - **Marrying every Uma opens the game's final scene,** a farm-wide celebration, the long goal.
  - **Confirmed by the owner: full polyamory.** The Umas' own world treats a household of many hearts as ordinary,
    shown lightly in every route (world bible W15), and the farmer shares several houses with them, choosing who lives
    where and where to spend each night, a cozy fade to morning (W16, RS4).

**What you author**
- **RS10, each Uma's profile in the farm's world:**
  - who she is now and why she came to the farm;
  - her favourite work line (it should fit her calling and her stats);
  - **her gifts by goods id:**
    - one **loved** (a dish id where it fits: her signature dish, above);
    - three **liked**;
    - two **disliked**;
  - her favourite season and festival;
  - her dream;
  - a short public blurb;
  - the one thing that makes her laugh, and the one that hurts her.
- **RS11, the cast's relationships, as one graph:**
  - who are friends, old rivals, mentor and protégée, former teammates, or sisters in all but name. Draw on their real
    racing careers, as uma-quest's ties do;
  - each tie has a strength and a short line;
  - these drive the pair conversations ([game mechanics](../../game-mechanics.md#pair-conversations)) and some heart
    events (her best friend helps the confession).
- **RS12, pair conversations for the strongest ties.** Each Uma's two closest ties get authored pair conversations at
  each of the five bond levels. Every other pair keeps the game's conversation templates, chosen by place, bond level
  and temperament.
- **RS13, the arrivals are authored, not drawn.**
  - The opening scene brings the first three Umas: the bible picks them, one each for farming, foraging and fishing,
    matching chapter 1 ([game mechanics](../../game-mechanics.md#the-opening)).
  - The rest arrive in the bible's order, each with a short arrival scene, tied to chapters, festivals and the farm's
    growth (Dorm beds).
  - On a v4 save this replaces the random start and the Gate's random draws for the cast
    ([game mechanics](../../game-mechanics.md#arrivals)).
- **RS14, the original town cast stays.** The town's eleven ([game mechanics](../../game-mechanics.md#the-towns-cast):
  the mayor, the shopkeepers, the rival farmers) host events and give the world its people. They are not romanceable:
  the romance is the Umas'. Keep their names and roles as the game has them, or propose changes.

**Where it lives**
- **RS15, all of it is private.**
  - **Location:** the story lives in uma-farm's ignored `content/story/`, never in git, never in uma-art, never on a
    public URL. It names real characters and draws on their canon, so it's original-game content (CLAUDE.md).
  - **Git holds only:**
    - the format (types and a validator, with no names);
    - a tiny stand-in pack with invented Umas (placeholder ids such as 9000001, the name "Stand-in") for tests;
    - any local tool that has no names in it.
  - **Shipping:** the story reaches the game through a private bucket and farm-api's private pack route, as uma-rpg's
    and uma-quest's stories do ([F56](F56-story-delivery.md)). This packet needs no cloud.
- **RS16, keyed by ids.** Every file keys an Uma by her character id from master data, plus the outfit id her sprite set
  uses where she has one. Inside the private files you may write her name in lines, since they're private. Display names
  in the game still come from master data at runtime.

**How it's written**
- **RS17, four layers, each read before the next** (uma-quest's SB9):
  1. **Skeleton:** the world bible, and one paragraph per Uma with her arrival order and ties.
  2. **Bible:** each Uma's profile, gifts, ties and her route as about 23 one-line beats, with her arrival scene.
  3. **Pilot:** three routes scripted end to end, from the first chat to the wedding.
  4. **Waves:** the rest scripted in waves of five.

  **This packet delivers layers 1–3.** Layer 4 is a packet per wave, written after the owner reads the pilot.
- **RS18, the scene format extends the farm's own** (`story/`: speaker, line). The JSON shapes are below, and the
  validator in git checks them. Steps:
  - `say`: a speaker and a line, with an emote;
  - `choice`: 2–3 farmer options, each with an affinity or romance change and an optional branch;
  - `narrate`;
  - `thought`: the farmer's, in italics;
  - `wait`: a beat;
  - `place`: set the scene;
  - `flag`: set a story flag;
  - and the romance's `play` and `when` (above).

  It stays close to uma-quest's script steps (SB11), but each game keeps its own format.
- **RS19, the farmer's voice.** Kind, a little dry, curious about each Uma. Choices offer warm, playful and honest
  options. None is cruel, and none is a wrong answer that locks a route; a cold answer only gains less.
- **RS20, the size.** About 150 words an event × 23 events is about 3,500 words a route, so the 20 routes come to about
  70,000 words. The pilot is about 10,000 words, plus 20 bibles of about 600 words each.

## The formats (in git as types; content in `content/story/`)

```text
content/story/                          (ignored by git)
  export/                               the Studio's SS export, as handed over (read only)
  world.md                              the world bible (layer 1)
  cast.json                             the cast: ids, arrival order, opening three, a paragraph each (layer 1)
  ties.json                             the relationships graph (layer 1, refined in layer 2)
  tags.json                             each Uma's favourite line, season, festival and loved gift, a reason each
  umas/<characterId>.json               her profile, gifts and route beats (layer 2)
  routes/<characterId>.json             her scripted events: her arrival scene (layer 2), whole routes (layer 3 on)
  pairs/<characterIdA>-<characterIdB>.json   pair conversations for the strongest ties (layer 3 for the pilot's ties)
  household.json                        the household scenes, house lines and the finale
  reviews.json                          the owner's verdicts per file and event (liked, rework, question, note)
  notes.md                              the session's private notes: the waves, the counts' summary
```

These are the first shapes this packet set. The shapes as built, with every field above (`calling`, `ranker`, a tie's
`source` and `from`, `together`, `hint`, `unlock`, plays, tones and the rest), are in
`packages/domain/src/story/authored.ts`, and they win.

```ts
// cast.json
interface Cast {
  version: 1
  export: { file: string; exportedAt: string; tier: 'SS' }   // which Studio export this was built from
  opening: [string, string, string]                          // character ids: farming, foraging, fishing (RS13)
  umas: { characterId: string; outfitId: string | null; arrives: Arrival; paragraph: string }[]   // in arrival order
}
type Arrival = { kind: 'opening' } | { kind: 'chapter'; chapter: number } | { kind: 'festival'; festival: string }
  | { kind: 'beds'; dormLevel: number } | { kind: 'event'; after: string }   // after another event's id

// ties.json
interface Tie { a: string; b: string; kind: 'friends' | 'rivals' | 'mentor' | 'teammates' | 'sisters' | 'other';
  strength: 1 | 2 | 3; line: string; history: string }

// umas/<characterId>.json
interface UmaBible {
  characterId: string; outfitId: string | null
  now: string; whyTheFarm: string; dream: string; blurb: string     // RS3, RS5, RS10
  favouriteLine: 'farming' | 'ranch' | 'mining' | 'fishing' | 'foraging' | 'cooking' | 'serving' | 'forging'
  season: 'spring' | 'summer' | 'autumn' | 'winter'; festival: string
  gifts: { loved: string; liked: [string, string, string]; disliked: [string, string] }   // goods ids (goods/ids.ts)
  laughs: string; hurts: string
  route: Beat[]                                                      // 27 in order: her arrival, then RS7's 26
}
// As built, a beat also has together, hint and an optional unlock; events have play steps and tones.
interface Beat { id: string; ladder: 'friendship' | 'confession' | 'romance' | 'proposal' | 'wedding' | 'spouse'
  hearts: number; trigger: Trigger; place: string; together: Together; beat: string; hint: string; unlock?: Unlock }
type Trigger = { kind: 'hearts' } | { kind: 'working'; activity: string } | { kind: 'item'; good: string }
  | { kind: 'bond'; with: string; level: number } | { kind: 'chapter'; chapter: number }

// routes/<characterId>.json  (layer 3)
interface Route { characterId: string; events: { id: string; steps: Step[] }[] }   // ids match the bible's beats
type Step =   // say: a character id or a town cast id
  | { say: string; line: string; emote?: 'happy' | 'shy' | 'sad' | 'angry' | 'surprised' | 'thinking' }
  | { choice: { text: string; friendship?: number; romance?: number; then?: Step[] }[] }
  | { narrate: string } | { thought: string } | { wait: number } | { place: string } | { flag: string }
```

The validator checks:
- every id exists in master data or the cast;
- every goods id exists in `goods/ids.ts`;
- every beat has its event in a scripted route;
- choices have 2–3 options;
- no farmer line uses a gendered word (a word list in the validator).

## Do

1. **The cast:** read from the Uma Ranker into `cast.json`, in its order. Done; `cast.json` records the read.
2. **The format and the validator in git:**
   - `packages/domain/src/story/authored.ts` (the types above) and its validator, with tests on the stand-in pack
     (RS15). Built; a field the story needs is added there first, with tests;
   - the review tool: the Farm Story Sandbox, `tools/story-sandbox/`, a dependency-free local page on loopback that
     shows the private `content/story/` files and writes the owner's verdicts to `reviews.json`, as uma-quest's Story
     Sandbox does (SB1, SB13). Built.

   No names in any of it.
3. **Layer 1:**
   - `world.md`: the farm's countryside, the town, the seasons, why Umas come here, the tone, and RS3 and RS4 stated as
     the world's rules;
   - `cast.json`, with the opening three and an arrival for every Uma;
   - `ties.json`, and the tag sheet.

   Written. Ask the owner to read it, in one line (with F60's counts).
4. **Layer 2:** `umas/<id>.json` for every Uma in the cast, each with her full profile, gifts and her route's 27 beats,
   and her arrival scene in `routes/<id>.json`, in waves of five. Ask the owner to read them; a wave of ten at a time is fine.
   The first wave is written.
5. **Layer 3, the pilot:**
   - three routes scripted end to end, from the first chat to the wedding;
   - the pair conversations for their two closest ties.

   Pick the three for range: three different playstyles, three different favourite lines, and at least one of the
   opening three. Ask the owner to read the pilot.
6. **Write up:**
   - say in the commit every call you made (ids and counts only, never a name);
   - list what the owner's verdicts ask of the game's romance rules (the hearts' numbers, the confession's trigger, how
     gifts and work pay romance, the wedding's place in the loop, and the final scene's trigger), for a code change and
     [the game mechanics](../../game-mechanics.md).

## Done when

- `content/story/` holds:
  - the world, the cast with arrivals for every cast Uma, the ties and the tag sheet;
  - a bible and an arrival scene for every cast Uma;
  - three pilot routes and their pair conversations;

  and all of it passes the validator.
- The owner has read layers 1, 2 and 3, and `reviews.json` holds their verdicts.
- Git holds only the format, the validator, the stand-in pack and the sandbox. `pnpm test`, with the private-content
  guard, passes, and `git grep` finds no character name.
- The content is backed up as a dated copy in uma-platform's private authoring bucket
  (`gs://uma-platform-authoring/authoring/farm-story/<date>/`, or `pnpm story:push farm`). Delivering it to the game
  (a private bucket and farm-api's private pack route) is [F56](F56-story-delivery.md)'s.

## Deliver

- The format and tools: a branch and a pull request to `main`, as delegated work does (CLAUDE.md). The main session
  merges.
- The content: never committed.
- When the owner has read the pilot:
  - delete this packet;
  - take its rows out of [the handoff](../README.md);
  - say in the commit what was written and read (ids and counts only).

## Rules that hold

- **No original-game content in git:**
  - no outfit or character names in code, tests, docs, commit messages or PR bodies;
  - no Uma art;
  - no lines that name or quote a character.

  The private-content guard reads the git index; run `pnpm test` after staging.
- **RS3 and RS4 hold in every line:** adults only, tender and non-explicit.
- **The farmer is never gendered and never drawn** (RS2).
- **Gifts use goods ids that exist** (`goods/ids.ts`); new goods are proposals, flagged, never invented silently.
- **Nothing here changes the game's rules or save.** A rule change the story asks for is a code change of its own.

## Left to the worker

- The world's details: the town's and the region's names, and why Umas come here.
- The arrival order beyond the opening three, and each arrival's reason.
- The pilot's three Umas (RS17's range).
- The emote list, if the format's (`EMOTES`) are too few.
- What the sandbox shows, as the reading needs it.
- New goods worth proposing as loved gifts.
