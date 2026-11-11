# F40 — Author the farm's story: the cast, their lives, and a romance for every Uma

**uma-farm · the story session (Claude) · L · Needs: the Studio's SS export (the owner's Playable Umas board) ·
Unblocks: the romance spec (F41) and the farm's story packets · Content: private, in uma-farm's ignored `content/story/`**

## Why

The owner is turning uma-farm into a **romance simulation** (D40, 2026-11-10). You play the farmer, a point of view who
is never drawn, and you can befriend and then romance **every Uma** in the cast. **Maxing every romance and unlocking
each wedding scene is the game's long goal.** The romance runs beside the farm's loop: farming, the ranch, mining,
fishing, cooking, festivals and expeditions are where it grows.

Today a new farm starts with three random Umas from six cards (core spec CS2). The owner doesn't want random. Like
uma-quest, the cast is **the owner's own authored characters**: the SS tier of the Studio's Playable Umas board.

This packet writes the story's foundation:
- the world;
- the cast's lives in it;
- who knows whom;
- what each Uma loves;
- the shape of every route;
- three routes in full, as a pilot.

The owner reads each layer before the next is written. The farm's code packets (F41 on) are written from it afterwards.

## Context (read first)

**The farm, as built and planned** (uma-farm, this repo):
- [core-loop.md](../../design/core-loop.md): the loop.
  - FC16: Umas joining over time.
  - FC22: festivals.
  - FC24: eight light chapters, an original town cast, Umas in roles.
  - FC25: bonds between Umas.
  - FC26: your affinity with each Uma.
  - FC27: conversations from templates.
  - FC5, FC33: time is turns.
- [core-spec.md](../../design/core-spec.md): the numbers.
  - CS35, CS45: visitors and affinity.
  - CS41: the original cast of eleven.
  - CS42, CS43: chapter 1 and chapters 2–8.
  - CS44, CS46, CS47: bonds, conversation templates and example lines.
  - CS21, CS25: the Kitchen's dishes, and the Forge's Rings.
- [decisions.md](../../decisions.md): D37, D38, D40.
  - D37 (F23): the roster, chats, gifts, the Gate, `CHAT_LINES`.
  - D38 (F24): Farm Rank, the Diary, chapter 1, the scene player.
  - D40: this direction.
- The manual: [roster.md](../../game/roster.md), [goals.md](../../game/goals.md), [goods.md](../../game/goods.md) for the
  goods ids, [days.md](../../game/days.md).
- The code you'll write to and read from:
  - `packages/domain/src/story/` (`cast.ts`, `chapters.ts`, `scenes.ts`, `chapter-1.ts`): the scene shape the game plays
    today;
  - `packages/domain/src/farm/visitors.ts`: affinity, hearts, gift tastes, chats;
  - `packages/domain/src/goods/ids.ts`: every good's id.

**uma-quest, the model** (`~/workspace/uma-quest`, read only):
- `docs/design/campaign.md`: CM16 (stories are private content), CM17 (scenes as data), CM18 (bibles first).
- `docs/design/story-sandbox.md`: SB1–SB15, especially:
  - SB2, the cast as a pack made from the Studio's tier export;
  - SB9, four layers, each read before the next;
  - SB13, the owner's reviews saved for the next session.
- Its script format, `packages/domain/src/story/script.ts`.
- Its adult travelers, D38 and D41: Umas drawn as grown women.

**uma-platform, the cast's source** (`~/workspace/uma-platform`, read only):
- `docs/authoring/tiers.md`: the Studio, the Playable Umas board, SS–F tiers ranked per character, the export (TS12).
- `docs/sprites/format.md`: which outfits have HD-2D sprite sets.

## Decisions made

> **Added 2026-11-11 (D47): the romance spec is accepted, and asks seven additions of the story** ([romance-spec.md](../../design/romance-spec.md), RM58).
> Write to them from layer 2 on. The format and validator gain them in the romance core's packets (F46–F54):
> - **`arrival`:** one scripted event per route, a 27th scene before friendship 1 (RM4), worth +50 and one choice;
> - **`chats`** in her bible: about 10 lines a stage (friend, partner, spouse), the F1 perk's chat set (RM31);
> - **`wishes`** in her bible, optional: `own-house`, `birthday-alone` (RM44);
> - **`keepsake`** in her bible: a name and a line (RM31);
> - **`wedding.places`:** the three places her wedding offers (RM30);
> - **`household.json`:** three household scenes (at 5, 10 and 15 married), house lines, and the finale, the Great
>   Harvest (RM43, RM45, RM46);
> - **`birthday`** in the cast file, only where master data has none (RM16).
>
> F41 also settles what the story wrote around: arrivals are the authored ones only (RM1, RM4); events never wait on a
> season, festival or hour (RM24); the farmer is never gendered at the wedding (RM30); one ring bench at the Forge opens
> after the first romance 8 (RM38).


> **Added 2026-11-11 (D44), from the owner:** (1) **the owner's priority Umas come first.** The opening three and the
> three pilot routes go to them. Take the priority from the SS tier's order on the Studio's Playable Umas board, which the
> owner sets (the board's order is the authoring order), or from a list the owner gives. Revisit D42's opening three
> against it. (2) **F40 builds no art.** It writes text only. Character art (busts, expressions, event illustrations)
> is a separate, later effort; F41 plans where it would sit. (3) **The owner's live save will be wiped** when the romance
> core ships, so the authored start needs no migration path for an existing farm.


The owner's direction (D40), and the calls that make it writable. Each has an id, **RS1–RS20**, for the romance spec.

**The cast**
- **RS1, the cast is the Studio's SS export.** The SS tier of the Playable Umas board, ranked per character: 40 at the
  board's first state, eight per playstyle.
  - Take the export the owner hands you, as uma-quest's sandbox does (SB2). The board is the source of truth, and its
    order is the authoring order.
  - S and A join later in their own packets. Uma NPCs and boss boards aren't in this story.
  - Each Uma is a character, not an outfit. Her look in the farm is her sprite set's outfit where she has one, else her
    best-ranked outfit.
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
  other Umas from her racing career. All of it is set in the farm's world: why she came to the countryside, what she does
  here, what she wants next.

**How a route runs**
- **RS6, friendship becomes romance, on two ladders.**
  - **Friendship hearts 0–10:** today's affinity (FC26, CS45), from chats, gifts, praise, working together and festivals.
  - **At friendship 10, her confession event.** If the farmer accepts, the **romance hearts 0–10** open. Declining keeps
    her a close friend, and the farmer can ask again later.
  - **At romance 10, the proposal,** with a ring the farmer forges (CS25's Rings: the Forge's Masterwork gives the best
    one), then **her wedding scene**.
- **RS7, heart events at every rung.** Each Uma has 26 (D43 adds the spouse ladder):
  - 10 friendship events;
  - the confession;
  - 10 romance events (dates among them);
  - the proposal;
  - the wedding;
  - three spouse events after it (S1, S3, S5), so married life goes on.

  Each event says when it opens (D43: her bar full, plus at most one setup the player controls: she works a place today,
  an item in the Warehouse, another Uma's bond with her, a chapter; never an hour, the weather, a season or a festival),
  where (a place on the farm: the Fields, the Mine, the Kitchen, the festival ground, the pond at night), what the farmer
  and she do together, and the one-line hint her profile shows while it's next.
- **RS8, the romance grows while you work together.** Her events favour the places of her favourite work. Assigning her
  there, praising her, working beside her and taking her to festivals raise hearts, as well as chats and gifts. Some
  events need a shared job or an item: the farm's loop is the romance's stage. Seasons and festivals colour the words.
- **RS9, every route is her own, and they run side by side.**
  - Every Uma can be romanced and married in her own route. There's no exclusivity and no jealousy mechanic; the routes
    are parallel.
  - Each wedding is her own scene.
  - **Marrying every Uma opens the game's final scene,** a farm-wide celebration, the long goal.
  - **Confirmed by the owner (D43): full polyamory.** The Umas' own world treats a household of many hearts as ordinary,
    shown lightly in every route (world bible W15), and the farmer shares several houses with them, choosing who lives
    where and where to spend each night, a cozy fade to morning (W16, RS4).

**What you author**
- **RS10, each Uma's profile in the farm's world:**
  - who she is now and why she came to the farm;
  - her favourite work line (it should fit her calling, FM7, and her stats);
  - **her gifts by goods id:**
    - one **loved** (a dish id from CS21 where it fits);
    - three **liked**;
    - two **disliked**;
  - her favourite season and festival;
  - her dream;
  - a short public blurb;
  - the one thing that makes her laugh, and the one that hurts her.
- **RS11, the cast's relationships, as one graph:**
  - who are friends, old rivals, mentor and protégée, former teammates, or sisters in all but name. Draw on their real
    racing careers, as uma-quest's ties do (D36);
  - each tie has a strength and a short line;
  - these drive the pair conversations (FC25, FC27) and some heart events (her best friend helps the confession).
- **RS12, pair conversations for the strongest ties.** Each Uma's two closest ties get authored pair conversations at
  each of the five bond levels. Every other pair keeps CS46's templates, chosen by place, bond level and temperament.
- **RS13, the arrivals are authored, not drawn.**
  - The opening scene brings the first three Umas: the bible picks them, one each for farming, foraging and fishing,
    matching chapter 1 (CS42).
  - The rest arrive in the bible's order, each with a short arrival scene, tied to chapters, festivals and the farm's
    growth (Dorm beds, CS34).
  - This replaces CS2's random start and CS35's random Gate draws for the cast. The code change is F41's.
- **RS14, the original town cast stays.** CS41's eleven (the mayor, the shopkeepers, the rival farmers) host events and
  give the world its people. They are not romanceable: the romance is the Umas'. Keep their names and roles as CS41 has
  them, or propose changes.

**Where it lives**
- **RS15, all of it is private.**
  - **Location:** the story lives in uma-farm's ignored `content/story/`, never in git, never in uma-art, never on a
    public URL. It names real characters and draws on their canon, so it's original-game content (CLAUDE.md).
  - **Git holds only:**
    - the format (types and a validator, with no names);
    - a tiny stand-in route with an invented Uma (a placeholder outfit id such as 9000001, the name "Stand-in") for tests;
    - any local tool that has no names in it.
  - **Shipping:** how the story reaches the game (a private bucket and farm-api's private pack route, as uma-rpg's and
    uma-quest's stories do) is decided later (D41). This packet needs no cloud.
- **RS16, keyed by ids.** Every file keys an Uma by her character id from master data, plus the outfit id her sprite set
  uses where she has one. Inside the private files you may write her name in lines, since they're private. Display names
  in the game still come from master data at runtime.

**How it's written**
- **RS17, four layers, each read before the next** (uma-quest's SB9):
  1. **Skeleton:** the world bible, and one paragraph per Uma with her arrival order and ties.
  2. **Bible:** each Uma's profile, gifts, ties and her route as about 23 one-line beats.
  3. **Pilot:** three routes scripted end to end, from the first chat to the wedding.
  4. **Waves:** the rest scripted in waves of five.

  **This packet delivers layers 1–3.** Layer 4 is a packet per wave, written after the owner reads the pilot.
- **RS18, the scene format extends the farm's own** (`story/` today: speaker, line). The JSON shapes are below, and the
  validator in git checks them. Steps:
  - `say`: a speaker and a line, with an emote;
  - `choice`: 2–3 farmer options, each with an affinity or romance change and an optional branch;
  - `narrate`;
  - `thought`: the farmer's, in italics;
  - `wait`: a beat;
  - `place`: set the scene;
  - `flag`: set a story flag.

  It stays close to uma-quest's script steps (CM17, SB11), so a later shared format is easy.
- **RS19, the farmer's voice.** Kind, a little dry, curious about each Uma. Choices offer warm, playful and honest
  options. None is cruel, and none is a wrong answer that locks a route; a cold answer only gains less.
- **RS20, the size.** About 150 words an event × 23 events is about 3,500 words a route, so 40 routes come to about
  140,000 words. The pilot is about 10,000 words, plus 40 bibles of about 600 words each.

## The formats (in git as types; content in `content/story/`)

```text
content/story/                          (ignored by git)
  export/                               the Studio's SS export, as handed over (read only)
  world.md                              the world bible (layer 1)
  cast.json                             the cast: ids, arrival order, opening three, a paragraph each (layer 1)
  ties.json                             the relationships graph (layer 1, refined in layer 2)
  umas/<characterId>.json               her profile, gifts and route beats (layer 2)
  routes/<characterId>.json             her scripted events (layer 3: three pilot routes)
  pairs/<characterIdA>-<characterIdB>.json   pair conversations for the strongest ties (layer 3 for the pilot's ties)
  reviews.json                          the owner's verdicts per file and event (liked, rework, question, note)
```

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
  gifts: { loved: string; liked: [string, string, string]; disliked: [string, string] }   // goods ids (goods.md)
  laughs: string; hurts: string
  route: Beat[]                                                      // 26, in order (RS7, D43)
}
// The shapes as built: packages/domain/src/story/authored.ts (D42, D43), with together, hint, unlock, play steps, tones.
interface Beat { id: string; ladder: 'friendship' | 'confession' | 'romance' | 'proposal' | 'wedding' | 'spouse'
  hearts: number; trigger: Trigger; place: string; together: Together; beat: string; hint: string; unlock?: Unlock }
type Trigger = { kind: 'hearts' } | { kind: 'working'; activity: string } | { kind: 'item'; good: string }
  | { kind: 'bond'; with: string; level: number } | { kind: 'chapter'; chapter: number }

// routes/<characterId>.json  (layer 3)
interface Route { characterId: string; events: { id: string; steps: Step[] }[] }   // ids match the bible's beats
type Step =
  | { say: string; line: string; emote?: 'happy' | 'shy' | 'sad' | 'angry' | 'surprised' | 'thinking' }  // say: a character id or a CS41 cast id
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

1. **Ask the owner for the Studio's SS export.** It's the Playable Umas board's export from `pnpm studio` in
   uma-platform. Put it in `content/story/export/` and read the board's SS tier in its order.
2. **Write the format and the validator in git:**
   - `packages/domain/src/story/authored.ts` (the types above) and its validator, with tests on the stand-in route
     (RS15);
   - optionally `tools/story-review/`: a dependency-free local page on loopback that shows the private
     `content/story/` files and writes the owner's verdicts to `reviews.json`, as uma-quest's Story Sandbox does (SB1,
     SB13).

   No names in any of it.
3. **Layer 1:**
   - `world.md`: the farm's countryside, the town, the seasons, why Umas come here, the tone, and RS3 and RS4 stated as
     the world's rules;
   - `cast.json`, with the opening three and an arrival for every Uma;
   - `ties.json`.

   Ask the owner to read it, in one line.
4. **Layer 2:** `umas/<id>.json` for every Uma in the export, each with her full profile, gifts and about 23 beats. Ask
   the owner to read them; a wave of ten at a time is fine.
5. **Layer 3, the pilot:**
   - three routes scripted end to end, from the first chat to the wedding;
   - the pair conversations for their two closest ties.

   Pick the three for range: three different playstyles, three different favourite lines, and at least one of the
   opening three. Ask the owner to read the pilot.
6. **Write up:**
   - log the packet's D-decision with every call you made;
   - list what the romance spec (F41) must decide from the owner's verdicts: the hearts' numbers, the confession's
     trigger, how gifts and work pay romance, the wedding's place in the loop, and the final scene's trigger.

## Done when

- `content/story/` holds:
  - the world, the cast with arrivals for every SS Uma, and the ties;
  - a bible for every SS Uma;
  - three pilot routes and their pair conversations;

  and all of it passes the validator.
- The owner has read layers 1, 2 and 3, and `reviews.json` holds their verdicts.
- Git holds only the format, the validator, the stand-in route and any review tool. `pnpm test`, with the private-content
  guard, passes, and `git grep` finds no character name.
- The content is backed up as a dated copy in uma-platform's backed-up `content/authoring/` (P96). Delivering it to the
  game (a private bucket and farm-api's private pack route) is later, the owner's call (D41).

## Deliver

- The format and tools: a branch and a pull request to `main`, as delegated work does (CLAUDE.md). The main session
  merges.
- The content: never committed.
- When the owner has read the pilot:
  - delete this packet;
  - add a Done row in [the handoff](../README.md);
  - log the D-decision (fetch `main` first).

## Rules that hold

- **No original-game content in git:**
  - no outfit or character names in code, tests, docs, commit messages or PR bodies;
  - no Uma art;
  - no lines that name or quote a character.

  The private-content guard reads the git index; run `pnpm test` after staging.
- **RS3 and RS4 hold in every line:** adults only, tender and non-explicit.
- **The farmer is never gendered and never drawn** (RS2).
- **Gifts use goods ids that exist** (`goods.md`); new goods are proposals, flagged, never invented silently.
- **Nothing here changes the game's code or save.** That's F41's and the story packets'.

## Left to the worker

- The world's details: the town's and the region's names, and why Umas come here.
- The arrival order beyond the opening three, and each arrival's reason.
- The pilot's three Umas (RS17's range).
- The emote list, if the six above are too few.
- Whether to write the review tool or read the files as markdown with the owner.
- New goods worth proposing as loved gifts.
