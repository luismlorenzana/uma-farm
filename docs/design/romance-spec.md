# uma-farm: the romance spec

> **Accepted whole by the owner, 2026-11-11 (D47).** Every call stands as written; the romance core's packets are written from it.
>
> **Status: drafted 2026-11-11 (D46), F41.** The owner said "Write F41" on 2026-11-11. This spec turns the romance
> direction (D40), full polyamory and the houses (D43), the wipe and priority Umas (D44) and the art split (D45) into
> calls and numbers that can be built on what's live (M4, F17–F24). Calls are **RM1–RM67**, each decided; there are no
> questions for the owner. Visual page: [previews/romance-spec.html](previews/romance-spec.html).
>
> - **It decides the research's proposals.** [romance-research.md](romance-research.md)'s recommendations (a)–(d) are
>   kept, with the changes said where each is made and listed in [§16](#16-the-researchs-recommendations-decided).
> - **It amends** [core-loop.md](core-loop.md) (FC1, FC13–FC17, FC19, FC22, FC24–FC29, FC31–FC33) and
>   [core-spec.md](core-spec.md) (CS2, CS3, CS5, CS7, CS17, CS21, CS22, CS25, CS29, CS33–CS38, CS40–CS46, CS49, CS51–CS55), and
>   revises M5's packets ([§14](#14-what-it-revises-rm65)).
> - **No original-game content:** no character or outfit name, no character id tied to a name, no story text. Umas are
>   "her", "an Uma", or the stand-ins 9000001–9000003. The story is private (RS15, D41) and reaches the game as a pack
>   (§11).
> - **RS3 and RS4 hold:** every Uma is an adult; romance is tender and non-explicit, with a fade before anything more.
>   **The farmer is never gendered** (RS2): the wedding's words are "spouse", "partner", "vows" and "you".
> - **The numbers are checked by a sim** (§13): the core spec's throwaway year-1 sim, carried to five years with the
>   authored roster and the romance layer, 30 runs each of a light, a typical and a focused player, beside a baseline
>   with no romance.

## The short answer

- **The cast is only the authored cast:** the 20 SS Umas (D42) now, S and A in later waves. No random pool, no start
  picks, no Gate drop-ins. Each is one character with one outfit, keyed by **character id** (RM1–RM7).
- **The start:** you name the farmer, the opening scene brings the owner's three priority Umas, and chapter 1 opens.
  **Save v4 is a wipe:** any older save starts a fresh farm; the server keeps the old one as a backup (RM8–RM10).
- **Every Uma's route is one track:** Friendship 1–10 → her confession → Romance 1–10 → the proposal → the wedding →
  Spouse 1–5. Heart *n* costs **160 + 40n** points (200 → 560); a spouse level 600. **A level is its event:** hearts
  come only when her heart event plays. **No decay; points past a full bar are banked** (RM11–RM18).
- **The day gains an evening:** one hangout or date a day across all Umas, played whenever you like, plus a morning
  invitation you can take or leave. Each Uma plays at most one of her events a day. Once married, End the day asks
  where you'll sleep (RM19–RM23).
- **Heart events** are offers you take on your turn: her bar full, plus at most one setup you control. Each is 60–120
  s: a place card, 3–5 beats, one **10–30 s play** graded Fine, Great or Perfect and never failed, and choices with
  their gain on the button. Five plays are built now; cooking, forging and the footrace come with their milestones
  (RM24–RM30).
- **A perk on every level,** written once as templates by her favourite line: +10% at her line, night chores, morning
  items, in her element, mentor, breakfast. Only her signature dish, keepsake and dream are bespoke. **Capped:** +40%
  on any one job (RM31–RM36).
- **The ring** is forged at the Forge's **ring bench**, which opens the morning after your first Romance 8: three
  refined goods of a grade make that grade's ring, no gold and no game; M6's merge game adds the play's bonus later
  (RM37–RM40).
- **Married life:** a homestead row with the Farmhouse and six houses (2 rooms, 4 extended, 8,000g → 160,000g); you
  give each spouse a room and pick a house each night; its morning is hers: breakfast, gifts, +30 points.
  Anniversaries, household scenes at 5, 10 and 15, and **the finale at 20 of 20** (RM41–RM47).
- **Bonds between Umas** move into the romance core, seeded by the 31 authored ties (RM48–RM50).
- **The screens:** a **Hearts** tab replaces Roster (the roster's album becomes its Work view), her profile sheet, the
  event player, level-up and stage-up cards, Memories, and Hearts lines in the morning summary (RM51–RM57).
- **The story ships later as a private pack** (a private bucket and farm-api's `PrivatePackModule`); the romance core is
  built dark on the stand-in first (RM58–RM60). Character art comes later and nothing waits on it (RM61–RM62).
- **The sim (30 runs each):** a typical player sees the **first heart event on day 3, her first confession on day 38,
  the first wedding on day 84, and all 20 married on day 158** (year 4); a focused player day 2, 18, 34 and 140; a light
  one day 4, 54, 124 and 205. Romance lifts a year's income **+4% in year 1, +8% in year 2, +24% in year 3 and about
  +40% once all 20 are married**, when gold buys only decorations (RM63–RM64).
- **The order:** the **romance core** on today's map (F46–F55, dark), then **the private delivery and go-live with the
  wipe** (F56), then **M5 revised** (save v5–v8), then M6 and M7 (RM66, RM67).

## 0. Words used here

| Word | Means |
|---|---|
| **Her route** | Everything between her and the farmer: three ladders and three waiting rungs, 26 rungs in all (D43) |
| **Ladder, level** | Friendship (F1–F10), Romance (R1–R10), Spouse (S1–S5). A level is reached when its event plays |
| **Rung** | One step of the route: a level, or the confession, the proposal or the wedding |
| **Bar** | Her points toward the next rung. **Banked** points are those past a full bar |
| **Ready** | Her next event can play today (RM24) |
| **Her line** | Her favourite line's place (RM6): the Fields, the forest, the Fishery, the Mine, the Quarry, the Coop or Barn, or a workshop |
| **The evening** | The one hangout or date of the day (RM19) |
| **The pack** | The private story files, as the game reads them (RM58) |
| **The romance core** | The milestone this spec plans (MR): F46–F55 on today's map, then F56 |

## 1. The cast and the roster (RM1–RM7)

**RM1: the farm's Umas are only the authored cast.** The cast is the Studio's SS export as the story session wrote it
(D42): **20 Umas**, four per playstyle. S and A join later in waves, each its own story packet with its bibles, routes
and arrivals, and its own code change if it needs one (more beds, RM5). What goes:

| What | Where it was | Now |
|---|---|---|
| The 272-outfit pool | FC16, CS35, `gateNight`'s release draw | Gone. Only the cast's characters exist on the farm |
| Six start cards, three picks, one redraw | CS2, F23's `startSheet`, `StartPicks.tsx` | Gone: the opening three are authored (RM9) |
| A visitor at the Gate every fourth morning, staying at 2 hearts | CS35, `gateNight`, `GatePeek.tsx`, `STAY_AFFINITY` | Gone: arrivals are authored (RM4). The Gate is where she walks in |
| A chapter's recruit for the weakest activity | CS35, `recruitFor` | The chapter's authored arrival |
| A festival's recruit (1st) or Gate visitor (2nd) | CS40 | A festival's arrival comes on its day, whatever the placing (RM4); 1st and 2nd pay gold and the trophy only |
| A request's recruit extra (1 in 5 extras) | CS37 | Gone; the extras are a recipe (45%), rare seeds (35%) or an animal (20%) |
| An expedition Great's visitor | CS35, CS49 | A second special-find roll |

Why: the owner's direction (D40) and RS13. A random Uma has no route, no gifts and no ties, so she can't be romanced.

**RM2: one outfit per character.** Each Uma plays as **one outfit**: her sprite set's outfit where she has one, else
her best-ranked outfit on the Playable Umas board (the export's per-character order, RS1). The cast file names it
(`outfitId`; F40's format already has it), so the game never chooses. Her face, talents (CS27) and temperament (CS46)
read that outfit. When a sprite set lands for her later, the story session changes `outfitId`, and her talents follow
on the next boot (talents aren't saved).

**RM3: the roster is keyed by character id.** Save v4 keys every Uma by her **character id** from master data
(`roster`, `dorm.home`, `work`, `bonds`, `love`, `today`). Her outfit is a lookup, `outfitOf(characterId)`, from the
pack. Why: the story keys by character (RS16); an outfit may change under her (RM2); and the wipe (RM10) means nothing
needs migrating. `pairKey` keeps its numeric sort on character ids. A character the release doesn't hold (the
stand-in, or one a release drops) shows a lettered disc and reads D talents, as `talentResolver` does today.

**RM4: arrivals are authored.** Each Uma's arrival is the cast file's `arrives` (F40's `Arrival`), checked each night
at step 8:

| Arrival | When she arrives | D42's plan | In the romance core alone |
|---|---|---|---|
| `opening` | The opening scene, day 1 (RM9) | 3 | 3 |
| `chapter` *n* | The night chapter *n* completes, in place of `recruitFor` | 7 (chapters 1–7) | 1 (chapter 1); chapters 2–7 come with M5 and M6 |
| `festival` | The morning of that festival's day (year 1's Flower Show, Fishing Derby, Cooking Contest and Harvest Cup; year 2's Flower Show), built or not | 5 | 5 (the dates exist from F18) |
| `beds` *n* | The morning the Dorm's level *n* takes effect (levels 4–8) | 5 | 5 |
| `event` | The morning after another Uma's named event plays | 0 | 0 |

- **Her arrival scene** plays the next time you open the farm: a short scripted scene (a proposed 27th event per route,
  `arrival`, RM58's format additions) that pays **+50 and its choice (+10 or +30)**, "event zero" of her route.
- **No bed free:** she joins away on her off-season (CS36 kept) and the Dorm's swap brings her home. Her chats and gifts
  work from the day she joins; her events and evenings need her home.
- **The Gate's quick look** says what brings the next arrival, never who: "Next: chapter 2's end · the Dorm's level 4
  · the Fishing Derby".
- **Pace:** the sim's arrivals land on days 1, 10–11, 20–24, 34–35, 43, 48–51, 58–59 and 67–76; all 20 are on the farm
  by **day 67–68** in most runs (year 2, Summer), as D42 planned; as late as day 112 when chapter 7 slips.

**RM5: the Dorm, rescaled for 20.** Beds cap who lives and works on the farm at once (CS34's rule kept). Eight levels,
the last at 20 beds; levels 4–8 each bring an authored arrival. Spouses leave the Dorm for the houses (RM42), freeing
their beds.

| Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| **Beds** | 3 | 5 | 7 | 9 | 11 | 14 | 17 | 20 |
| **Costs** | — | 1,000 | 3,000 | 8,000 | 15,000 | 28,000 | 50,000 | 85,000 |
| **Farm Rank** | — | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| **Brings** | | | | an arrival | an arrival | an arrival | an arrival | an arrival |

190,000g in all (CS34's ten levels were 520,000g). CS34's prices are kept level for level, so the year-1 sinks don't
move; levels 9 and 10 come back with the S wave, with the beds it needs. The sim buys level 4 around day 20 and level 8
around day 59.

**RM6: her favourite line comes from the story.** Her favourite line is her bible's **`favouriteLine`** (an activity,
RS10); the cast file's **`calling`** (D42, by FM7's rule) is the fallback when a bible is missing (the stand-in) and
places a mining line at the Mine or the Quarry. It's never computed from master data's strategy any more
(`favouriteActivity(outfit.line)` goes). It sets:
- **×1.2 rank points** in that activity (CS33 kept);
- **+10 points** to her bar on a night she worked it (RM13);
- **her line's place** for her perks (RM32) and the default place of her events;
- the mark on her face card.

| `favouriteLine` | Her line's place | Notes |
|---|---|---|
| farming | the Fields (her block) | Tending counts as working it |
| foraging | the forest (any area) and the Sawmill | |
| fishing | the Fishery (any spot) and the Smokehouse | |
| mining | the Mine and the Smelter, or **the Quarry and the Cutter** when her calling is `quarry` | Opens with chapter 3 (M5) |
| ranch | the Coop and the Barn | Opens with chapter 2 (M5) |
| cooking · serving · forging | the Kitchen · the Restaurant · the Forge, as the assistant | Chapter 4 (M5) · 6 · 7 (M6) |

**RM7: her tastes come from her bible.** One **loved**, three **liked** and two **disliked** goods by id (RS10);
every other good is **neutral**. CS45's family rule (`giftTaste`: liked = her line's families, disliked = raw stone and
feed) and F8's "loved is the dish kind of her best talent" both go: the authored list is the whole rule. A proposed good
(`gifts.proposed`, F40) counts once it exists in `goods/ids.ts`; until then that slot is neutral.

## 2. The start (RM8–RM10)

**RM8: the farmer's name.** The first screen on a fresh farm is one field: "What should they call you?" Rules: 1–16
characters (letters, spaces, apostrophes and hyphens), trimmed, no default (a grey "Farmer" placeholder). It's stored as
`farmer.name` and fills `{farmer}` in every line, the only placeholder the format allows (D42). It's renamed any time
from Menu → Account. Nothing else is asked: **no pronouns, no gender, never drawn** (RS2). Lines say "you". An Uma's
pet name for you at Romance 1 (RM31) is authored per route and shown on her profile.

**RM9: the opening.** In order, on day 1:
1. **The name** (RM8).
2. **"The Overgrown Farm"** (CS42's opening scene, re-cut): Mayor Hollis Pryor at the gate, Old Ben's nine Carrot seeds
   and the tended row, Marta's shop and the bin. Its cast lines are original and stay in git (`chapter-1.ts`); "your
   first hands" become the three authored Umas.
3. **The opening three walk in,** one at a time, each with her **arrival scene** (RM4): +50 and her choice. They are
   the cast file's `opening`: a farmer, a forager and a fisher, in that order (RS13, CS42), **the owner's priority
   Umas** (D44), set by the story session from the board's SS order.
4. **Chapter 1's card,** and the first tap is planting, as today.

No picks and no redraw: `start.redraws` and the start's sheet go. The hello lines "from her temperament's templates"
(CS42 step 3) become her arrival scene.

**RM10: save v4 is a wipe.** The romance core's save is **v4**. `parseSave` reads v1, v2 and v3 and returns a **fresh
v4** (`newSave`): day 1, 500g, Block A, 9 Carrot seeds, the farmer's name empty. Nothing else carries over (D44: the
owner's v3 save is day 2 with three random picks).
- **`account` is kept exactly as stored,** so `updatedAt` doesn't move until the player's first change (the
  production-save rule). The fresh farm is the player's first change, stamped once when the name is entered.
- **The server's version-bump backup** copies the stored v3 document to `saveBackups/{uid}-v3` on the first v4 write
  (D9's pattern, as v2 → v3 did). A v3 upload over a stored v4 is refused into `saveRescues`, and the live v3 build
  already stops at a newer save with the update prompt.
- **Nobody edits production by hand.** The owner's phone check after go-live (F56) confirms the backup and the fresh
  farm, read-only.
- While the romance core is dark (RM59), v4 grows in place, as v3 did in M4 (D29). M5's packets then take v5–v8.

What v4 adds and drops (the shape is F46's to write):

| | v4 |
|---|---|
| **Adds** | `farmer: { name }` · `love: Record<CharacterId, Love>` (RM11) · `homestead` (RM41: houses, rooms, tonight's house, last visits) · `memories: Record<CharacterId, string[]>` (event ids played) · `arrivals: string[]` (done) · `today`: + `praised`, `events`, `evenings`, `invites` |
| **Re-keys** | `roster`, `dorm.home`, `work`, `bonds` by character id (RM3) |
| **Drops** | `start` (picks), `visitors` (the Gate), `RosterUma.affinity` (now `love`) |
| **Keeps** | Everything else in v3: calendar, gold, Warehouse, bin, fields, crops, ranch, places, buildings, tools, workshops, expeditions, board, Diary, farm, summary |

```ts
interface Love {
  stage: 'friendship' | 'confession' | 'romance' | 'proposal' | 'wedding' | 'spouse' // the ladder she's on, or the rung that waits
  level: number        // events played on this ladder: 0–10 (spouse 0–5)
  points: number       // toward the next rung; past it, banked
  last: number         // the day of her last event (one a day, RM21)
  friend?: true        // "Not yet" at her confession (RM30)
  ring?: number        // her ring's bonus in %, once given (RM39)
  wed?: number         // the wedding's day
  house?: number       // her room's house (RM42)
  known: string[]      // goods ids whose taste you've learnt (RM15)
  flags: string[]      // set by choices; they change wording only (RM27)
  evening: number      // the day of her last evening
}
```

## 3. The ladders and points (RM11–RM18)

**RM11: one track per Uma.** **Friendship 1–10 → her confession → Romance 1–10 → the proposal → the wedding → Spouse
1–5**: 26 rungs (D43). **A level is its event:** her bar fills, her event becomes Ready, and the level comes when you
play it, with its perk (the Persona rule, research a). S2 and S4 have no event: they come at night when their bar
fills, with a level-up card in the morning. The bar's colour carries the stage: **coral** for friendship, **rose** for
romance, **gold** for spouse.

```
 F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   ◆    R1 R2 … R8 R9 R10   ◇      ◇       S1  S2  S3  S4  S5
 ─────── friendship ─────────  confession ── romance ─────  proposal wedding ──── spouse ─────
 200 240 280 … 560 (3,800)        0     200 … 560 (3,800)     0       0      600 600 600 600 600
 an event at every level          an event                   events: ring   events at S1, S3, S5
```

**RM12: the costs.** Heart *n* on friendship and romance costs **160 + 40n points**; a spouse level costs **600**.
The three waiting rungs cost no points: each is Ready **the day after the rung before** (the proposal also needs a
ring, RM39). Kept from research b1: early hearts come in two or three days and late ones in a week or more, as the
newer games do it, and the sim confirms the pace (RM64).

| Heart | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Ladder |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Friendship or romance** | 200 | 240 | 280 | 320 | 360 | 400 | 440 | 480 | 520 | 560 | **3,800** |
| Cumulative | 200 | 440 | 720 | 1,040 | 1,400 | 1,800 | 2,240 | 2,720 | 3,240 | 3,800 | |
| **Spouse** | 600 | 600 | 600 | 600 | 600 | | | | | | **3,000** |

A whole route is **10,600 points and 26 events**.

**RM13: points.** Every number shows on screen before or as it's earned (a "+N" floats from her face).

| Act | Points | Limit |
|---|---|---|
| **Chat** (tap her) | +15 | Once a day each |
| **Gift** | Loved **+60**, liked **+30**, neutral **+10**, disliked **0**; × (1 + 0.1 a star above ★1) | One a day each, no weekly cap; ×3 on her birthday (RM16) |
| **Praise** (after a ★3+ day's work, a rank-up or a Fine play: CS45's rule) | +20 | Once a day each |
| **Her line** (she worked it today) | +10 | Paid at night |
| **A festival together** (on its team or entry) | +50 | Each festival |
| **The evening** (RM19) | Fine **+60**, Great **+100**, Perfect **+150**; ×1.5 in her favourite kind | One evening a day across all Umas |
| **An invitation, said yes** (RM20) | +20 | With the evening |
| **A house morning** (spouses, RM43) | +30 | Each resident of the house you slept in |
| **Her arrival scene** (RM4) | +50, and its choice (+10 or +30) | Once |
| **A heart event** | +50, its choices (+10 or +30 each), its play's grade (+0, +15 or +30) | One of hers a day (RM21) |

Worked, a gift: a ★3 liked good is 30 × 1.2 = **36**; a ★5 loved dish on her birthday is 60 × 1.4 × 3 = **252**.

Worked, a typical opening Uma's first days: her arrival scene **+75**; day 1, a chat, a liked gift and a day at her
line, **+55** (130); day 2, **+55** (185); day 3, a chat and a gift by midday, **+45** (230 ≥ 200): **Friendship 1 is
Ready on day 3.** It plays, +87 on average (+50, the choice, the play's grade), and her bar starts
Friendship 2 at 30 banked + 87 = **117 of 240**.

Worked, a focused day once she's at Friendship 2: chat 15, a ★2 loved gift 66, praise 20, her line 10, the evening
(Great, her kind) 150 = **261**, plus an event about every second day (+100): about 300 a day.

**RM14: no decay, banking, and where points go.** Points never fall and nothing is ever lost or locked. **Points past
a full bar are banked**: the bar shows "+120 banked", and they carry into the next bar when the event plays. Coral
Island's hard lock ("extra gifts cannot push past a locked tier") is what this avoids. Points go to the ladder she's
on: **friendship** until her confession is accepted, **romance** after it, **spouse** after the wedding. While the
confession, the proposal or the wedding waits, points bank into the next ladder.

**RM15: gifts.** One gift a day each, no weekly cap: with twenty Umas the real limit is goods. **Her loved gift shows
from Friendship 1;** a liked or disliked one shows the first time you give it, and **all her tastes show at Friendship
7.** The gift picker lists the Warehouse with **each good's points for her** at the stars you pick ("?" for one you
haven't tried). A disliked gift gives 0 and a line from her, never a loss (CS45's −20 goes). A good she loves or likes
is any star; stars multiply.

**RM16: birthdays.** From master data's character set (`birthday: { month, day }`, uma-data's `characters`), read at
runtime like her name, never in git. The cast file may carry an optional `birthday` for a character the set lacks.
**Mapping to the 48-day year:** March–May are Spring, June–August Summer, September–November Autumn and
December–February Winter; each month is four farm days, by quarters of the month (days 1–8, 9–16, 17–24, 25–31).

`season day = 4 × (the month's place in its season, 0–2) + ⌈min(day, 31) ÷ 8⌉, held to 1–4`

| Birthday | Farm day | | Birthday | Farm day |
|---|---|---|---|---|
| 1 March | Spring 1 | | 1 April | Spring 5 |
| 31 May | Spring 12 | | 14 February | Winter 10 (the Animal Show) |
| 15 August | Summer 10 (the Derby) | | 31 December | Winter 4 |

On her birthday: **gifts ×3**, an evening with her **×1.5** (on top of her kind), a ★ line in the morning summary the day
before and on the day. Two Umas may share a farm day; a birthday on a festival day is both.

**RM17: anniversaries.** Each year on her wedding's day of the year (from year 2 of her marriage): **2× points with
her that day**, she leaves a **★5 item of her line** in the Warehouse, and an evening with her is ×1.5. The morning
summary says so the day before. Kept from research b8 (Coral Island's buff), never the old anniversary quiz.

**RM18: today's affinity becomes the route.** `RosterUma.affinity` (0–1,000) becomes `love` (RM10). What reads it
changes:

| Today (F21, F23) | Romance core |
|---|---|
| `heartsOf(affinity)` = ⌊affinity ÷ 100⌋ | `levelOf(love)`: her ladder and level |
| Rank points ×1.05 from 5 hearts, ×1.10 at 10 (D35 e, CS45) | **×1.05 from Friendship 5, ×1.10 from Friendship 10 on**, through romance and spouse (the F5 and F10 perks) |
| `addAffinity` holds a fall at the hearts reached; `GIFT_POINTS.disliked` −20 | No falls at all: disliked is 0 |
| `STAY_AFFINITY` (a visitor stays at 2 hearts) | Gone with the visitors |
| `CHAT_LINES` by temperament | Kept as the fallback; from Friendship 1 she speaks her authored chat set (RM31) |

## 4. The day (RM19–RM23)

**RM19: one evening a day.** The day's one scarce choice (research b2, b6): **one evening activity across all Umas.**
- **Who:** a **hangout** with an Uma at Friendship 2 or more; a **date** from Romance 1; any spouse. She must be home.
- **What:** one of the evening kinds (RM37), a play of **30–60 s**, graded **Fine, Great or Perfect** and never
  failed: +60, +100 or +150, ×1.5 in her favourite kind.
- **When:** any time in the day, from her profile (**Evening ›**) or from End the day's **Tonight** row (RM22). Once
  played, the Hearts header shows "Evening ●". An evening left empty costs nothing.
- **More evenings:** **two on every fourth day** from 10 married (RM45), and a second, **festival night**, on each
  festival day (a walk at the festival ground with anyone at Friendship 2+).

**RM20: morning invitations.** Each morning **at most one Uma invites you** (two from 10 married): "Fishing tonight?"
She's drawn by seed (`draw(uid, day, 'invite', n)`) from the Umas at Friendship 2+ who are home and whose favourite
kind is open today, weighted to those you've spent the fewest recent evenings with. **Yes** makes her tonight's evening
in her kind (×1.5) with **+20**; **Another day** costs nothing, and she may ask again. Kept from research b2, made a
choice in the morning summary rather than a chance after a chat.

**RM21: one of her events a day.** Each Uma plays at most one of her events a day, so banked points can't rush a
route; there's **no cap across Umas.** Ready events wait forever and never fire on their own: each is an offer you take
on your turn. The sim's typical player plays **about 4 events a day** from day 40 to day 120 (at most 9), none of them due
that day: an event left for tomorrow only slows her route.

**RM22: End the day becomes "Tonight".** Tapping End the day opens one sheet, then the night:
1. **Evening:** today's, if unspent: "with … · Walk ✓" or **Pick someone ›** (skippable).
2. **Sleep at** (once married): the Farmhouse or a house, each with who's home, a ☕ when a resident's breakfast
   (RM35) is on, and "8 nights" for one you haven't visited lately. The default is the house you've visited least
   lately.
3. CS6's line ("2 Umas idle · 3 to collect") and **End the day / Back**. Menu's switch still skips the sheet when
   nothing waits.

The night is **a cozy fade straight to morning** (RS4, W16): nothing is shown between End the day and the morning.

```
┌──────────────────────────────────────────┐
│ Tonight                         Spring 6 │
├──────────────────────────────────────────┤
│ Evening   with Stand-in two · Walk  ✓    │
│           (or) [ Pick someone › ]        │
├──────────────────────────────────────────┤
│ Sleep at                                 │
│  ( ) the Farmhouse   · 2 home            │
│  (•) Rose Cottage    · 4 home · S1 ☕     │  breakfast tomorrow
│  ( ) Willow House    · 3 home · 8 nights │  not visited for 8 nights: asks warmly
├──────────────────────────────────────────┤
│ 2 Umas idle · 3 to collect               │
│                                          │
│         [ End the day ]   [ Back ]       │
└──────────────────────────────────────────┘
```

**RM23: the night's steps.** CS7's nine steps keep their order; the romance core fills them:

| Step | Today (F18–F24) | Adds |
|---|---|---|
| Before 1 | — | The house you picked is noted (`homestead.tonight`, its last visit) |
| 1 The bin | Pays | — |
| 2 Crops | Grow | Farming night chores: +0.25 growth on one untended block, else hers (RM32) |
| 3 Animals | (M5) | Ranch night chores: +5 affection on her pen (M5) |
| 4 Jobs | Move a day on; hauls count | Gathering night chores: 1 item a chore at her line's deepest place, into the Warehouse |
| 5 Workshops | Reset | Workshop night chores: +1 to the next play's yield (M5, M6) |
| 6 Ranks, bonds | Ranks; bonds a no-op until M6 | Rank points with her ladder's factor and a mentor's (RM18, RM33); **bonds tick** (RM48); **her line +10**; spouse levels S2 and S4 that filled; well fed counts down |
| 7 Calendar | Turns; `today` clears | `today` also clears praise, events played, evenings and invitations |
| 8 Goals | Dorm, Gate, chapters, Diary, Farm Rank | **Arrivals** (RM4) in place of the Gate; household milestones (RM45) |
| 9 Summary | Built | **The house's morning** (RM43): +30s, breakfast, morning items; R2 and S2 morning items; birthdays and anniversaries today and tomorrow; **invitations drawn**; the **Hearts** section (RM57) |

Every draw stays `draw(uid, day, what, n)` (CS8), so the same save gives the same morning, invitations included.

## 5. Heart events (RM24–RM30)

**RM24: when an event is Ready.** All four:
1. **Her bar is full** for the rung (or, for the confession, the proposal and the wedding, it's the day after the rung
   before);
2. **she's home** (an Uma away on her off-season shows "Swap her home");
3. **she hasn't played an event today** (RM21);
4. **its one setup is met,** if it has one (D43): she works a named place today; a named good is in the Warehouse;
   her bond with a named Uma has reached a level; a chapter has been reached.

**Never an hour, the weather, a season or a festival** (D43): those may colour the words, never whether it plays. What
isn't met is said on her profile and in the morning ("Romance 5 · the Pond, when she works it"; "Opens with chapter
3"). A setup that names a place not built yet (the Mine before chapter 3) shows "Opens with chapter 3" and waits.

**RM25: the five plays.** What the farmer and she *do* together (F40's `together`, D42) is one short play, built in
the romance core as the farm's own small games, each on a flat sheet over the map:

| Play | You | Graded by | In an event | As an evening |
|---|---|---|---|---|
| **Cast** | Tap as a closing ring meets the mark; the line lands every time | Timing | 1 cast, 10–15 s | 3 casts, 40 s |
| **Pick** | Tap the ripe ones (the stars, her favourites) among the rest as they show | Right picks | 1 round, 15 s | 3 rounds, 45 s |
| **Rhythm** | Tap on her beat (a hoe, a brush, a step, an oar) | Timing | 8 beats, 12 s | 3 × 8 beats, 45 s |
| **Walk** | Walk a route on today's farm map with her, two forks to choose | Her favourite turns found | 2 forks, 20 s | 4 forks, 50 s |
| **Choose** | Pick one good from three for her (the gift picker, narrowed) | Her taste | 1 pick, 10 s | — |

- **Grades:** each play scores 0–100: **Fine below 60, Great 60–89, Perfect 90+.** An event adds **+0, +15 or +30**;
  an evening pays 60, 100 or 150. **Never failed:** a missed tap still lands, as a Fine.
- They follow FR21's contract where it fits: a seed shown first, one thumb, timing from `pointerdown`, no inputs taken
  (dates never cost goods). They're the HD-2D stage's later, as M7's.

**RM26: what plays as what, now and later.** F40's `together` kinds and D42's ten date games map to the five plays,
or to a milestone's own game when it exists. **The fallback** for an activity whose game isn't built: **Rhythm with
that activity's mark** (a pot, an anvil, a running track), the same grades. When the real game ships, the event plays
it; Memories' replays use the best that exists.

| `together` | Plays as now (romance core) | Later |
|---|---|---|
| `work: farming` | Pick (harvest the ripe ones) or Rhythm (tend), by the author | — |
| `work: foraging` | Pick | — |
| `work: fishing` | Cast | — |
| `work: mining` | Rhythm (swing in time) | — |
| `work: ranch` | Rhythm (brush) | — |
| `work: cooking` | Rhythm with a pot | **The Kitchen's game in practice mode** (F8, M5): no inputs, no yield, graded by its score |
| `work: serving` | Rhythm with a tray | The Restaurant's game, practice mode (F35, M6) |
| `work: forging` | Rhythm with an anvil | The Forge's merge game, practice mode (F36, M6) |
| `date: fishing` | Cast | — |
| `date: walk` · `boat` | Walk · Rhythm (row in time) | The stage (M7) |
| `date: picnic` · `market` · `stargazing` | Pick | — |
| `date: dance` · `crafting` | Rhythm | — |
| `date: cooking` | (not offered as an evening until M5) | The Kitchen's practice mode (F8) |
| `date: footrace` | (not offered as an evening until M6) | **The track play** (a pacing tap race), with the Harvest Cup (F32, M6) |
| `gift` | Choose | — |
| `help` · `talk` | No play: the choices alone; the grade is the best choice's | — |

**RM27: choices with visible gains.** Each event has **1–2 choice points of 2–3 options** (F40's format, ≤40
characters). **Every option shows its gain on the button before the tap:** +30 for the best, +10 for the others, or
the taste it reveals, or the item it costs (an option that gives a good takes it from the Warehouse, shown as "· 1 Herb";
greyed with "Need 1 Herb" when you don't have it). **Romantic options carry a heart tag.** No option scores below zero,
removes a later event or changes the route; a choice may set a **flag** that changes later wording only (RS19).

**RM28: rewards and Memories.** Every event pays **+50** on completion, its choices and its grade (RM13), into the
next bar; gives the rung's **perk** (RM31); and saves one **Memory**: the place card, her bust and the event's
caption (its `beat` line). An optional `unlock` (F40's format: an item, a place or a perk line) is given too. The
**level-up card** lists all of it, then the next rung's cost, place and setup. **Memories** keep an album per Uma
(RM56); any event replays from any choice, with **no points** for replays.

**RM29: the event player, on today's map.** The HD-2D stage is M7's, so an event plays as a **full-screen sheet**,
CS42's scene player grown:
- **the place card** fills the top ~45%: the place's Hub art from uma-art, tinted by season, with her **bust** from
  master data (uma-kit's `UmaBust`) and a small **emote mark** beside it (the format's eight emotes) until expression art
  exists (RM62);
- **her bubble** below: at most 3 lines, about 36 characters a line at 16pt; one tap finishes the line, the next
  advances, a hold skips;
- **choices** are full-width 48pt buttons in the thumb zone, each with its gain (RM27);
- **the play** opens as a sheet in the middle and closes on its grade;
- **auto, skip and log** sit top right, away from the taps; while a scene plays, input is only advance, choose, play,
  auto, skip and log.

A heart event is **60–120 s**: a place card, 3–5 beats, one play, 1–2 choices, the level-up card.

```
┌──────────────────────────────────────────┐
│ The Pond · Romance 5    auto  skip  log  │
│                                          │
│   ╭──────────────────────────────╮       │
│   │  the Pond: its place card    │       │
│   │        (bust)  ◔ shy         │       │  master data bust + emote mark
│   ╰──────────────────────────────╯       │
│ ┌──────────────────────────────────────┐ │
│ │ Stand-in: You cast like you mean it  │ │
│ │ now. Who taught you that?            │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ ♥ "You did."                     +30 │ │  ♥ a romantic option
│ ├──────────────────────────────────────┤ │
│ │ "The fish, mostly."              +10 │ │
│ ├──────────────────────────────────────┤ │
│ │ "Cook it together?"  +10 · 1 Herb    │ │  what it costs, before the tap
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────┐
│ Together: one cast              0:12     │
│                                          │
│        ·  ·  ·  ◯  ·  ·  ·               │  Cast: tap as the ring meets the mark
│           the ring closes…               │
│                                          │
│              [ CAST ]                    │
│                                          │
│ Fine +0   ·   Great +15   ·   Perfect +30│
│ Never a miss: every cast lands a fish.   │
└──────────────────────────────────────────┘
```

**RM30: the confession, the proposal and the wedding.** Each **3–5 minutes**, with 2–3 plays or choices with visible
effects, and a **stage-up screen** at the end (RM55).
- **The confession** is Ready the day after Friendship 10. Its last choice is **Yes**, which opens romance, or **Not
  yet**, which keeps her a close friend (`love.friend`): her points keep banking and **Ask her** on her profile plays
  the confession's last beat again any day. The author may write her saying "not yet" in an earlier romance scene's
  words, at no cost (RS4, research b5). Deterministic: a full bar means yes.
- **The proposal** is Ready the day after Romance 10 **with a ring in the Warehouse** (RM39) and always succeeds. The
  ring is used.
- **The wedding** is Ready the morning after the proposal and **waits until you play it**. You make three choices with
  visible effects: **the place** (one of three farm places her route names); **the reception dish** (any dish in the
  Warehouse: the whole crew is well fed tomorrow at that dish's tier; with no Kitchen yet, Marta's bakery sends a cake,
  a Rough meal); and **the vow line** (wording only). Every spouse and her two closest friends among the Umas attend.
  She then takes a room (RM42) and her ring's bonus starts. **Words:** "spouse", "partner", "vows", "your wedding";
  never bride, groom, husband or wife for the farmer (RS2; F40's validator lists them).

## 6. Perks (RM31–RM36)

**RM31: a perk on every level,** written once as **templates keyed by her favourite line** (research b3, with four
changes said below). Only three are bespoke per Uma: **her signature dish** (F4), **her keepsake** (F10, upgraded at
S5) and **her dream** (S3's event). Every perk is on her profile's list before it's reached.

| Level | Friendship | Romance | Spouse |
|---|---|---|---|
| **1** | Her loved gift is shown; her own chat set opens | Dates open; her pet name for you | **Breakfast:** on a morning in her house, the crew starts well fed (RM35) |
| **2** | Hangouts open (the evening) | **Morning item** every 4th morning: a ★2+ good of her line | Her morning item **every 2nd morning** (★3+), and every morning in her house |
| **3** | **+10% at her line** | Date kind: stargazing | **Her dream** event; **+5%** for anyone at her line's place |
| **4** | **Her signature dish's recipe** | Her bond with her closest friend gains **×1.5** | A **third night chore** |
| **5** | **×1.05 rank points** | **+10% more** at her line (+20%) | Vow renewal; **her keepsake upgrades** |
| **6** | **Night chore:** one item at her line each night | Date kinds: dance and boat | |
| **7** | All her tastes shown, and her closest friend's loved gift | A **second night chore** | |
| **8** | **In her element:** ×1.2 beside a 3-heart partner at her line | Her ring's engraving (the bench opens the first time, RM38) | |
| **9** | **Mentor:** +10% rank points for Umas at her place | Date kind: footrace (with M6's track) | |
| **10** | **Her keepsake**; **×1.10 rank points**; then her confession | The proposal | |

- **Her signature dish** is her loved good when it's a dish; otherwise her line's dish kind (CS45's list: farming
  Salad, ranch Cake, mining Curry, fishing Grill, foraging Soup, cooking Tart, serving Cookies, forging Bread) at the
  grade of her line's best place. Before the Kitchen (chapter 4) the recipe waits in the Kitchen's list.
- **Her keepsake** is a named item (bespoke name and line) with a template effect: **+0.25 quality at her line**, +0.5
  from S5. It stays in her profile, not the Warehouse.
- **Her dream** is her S3 event (bespoke content); its effect is the template's (+5% for the crew at her line).
- **Changed from research b3:** S4 is a **third night chore**, not "her night chores double" (a cap); S3's crew bonus
  is **+5%**, not +10%; **in her element is ×1.2, not ×1.5**; R3, R6 and R9 open D42's date games (stargazing; dance and
  boat; footrace) in place of fishing, forging and running, since fishing is a hangout from F2 and forging is an event
  activity (RM26). The sim's caps (RM34) needed the first three.

**RM32: what "her line" means, line by line.** Each template has one meaning per line, in the farm's own terms:

| Her line | +10% at her line (F3, R5) | A night chore (F6, R7, S4) | A morning item (R2, S2) |
|---|---|---|---|
| **Farming** | Each plot she tends: +10% chance of an extra crop at harvest | +0.25 growth on one untended block (else hers), step 2 | A ★2+ crop of the season |
| **Foraging** | Her haul ×1.1 (CS17), and her Sawmill batch ×1.1 | 1 item from her rank's deepest area | A ★2+ good from that area |
| **Fishing** | Her catch ×1.1, and her Smokehouse batch ×1.1 | 1 fish from her deepest spot | A ★2+ fish |
| **Mining** (Mine or Quarry) | Her haul ×1.1, and her Smelter or Cutter batch ×1.1 | 1 ore, or a stone or gem, from her deepest floor | A ★2+ ore, stone or gem |
| **Ranch** | Her pen: +10% chance of an extra product | +5 affection to her pen, step 3 | A ★2+ egg, milk or fleece |
| **Cooking** | +10% dishes as the Kitchen's assistant | +1 dish on the next play | A ★2+ dish of a known recipe |
| **Serving** | +10% tips as the Restaurant's server | +1 cover on the next shift | A ★2+ dish |
| **Forging** | +10% goods as the Forge's assistant | +5% refund on the next tool | A ★2+ Fitting |

Counts are expected values: a fraction becomes a whole item by a seeded draw (`draw(uid, day, 'perk:<id>', n)`), so
nights replay the same (CS8). Night chores and morning items go straight to the Warehouse, and the morning says
"Night chores · 3 items".

**RM33: the shared effects.**

| Perk | Effect | Where it acts |
|---|---|---|
| **In her element** (F8) | Her bond factor is **×1.2** instead of CS17's ×1.1, at her line, beside an Uma she has 3+ bond hearts with | CS17's `bond` term |
| **Mentor** (F9) | Umas working at **her place** the same day earn **+10% rank points** | Step 6; one mentor's bonus a place |
| **Rank points** (F5, F10) | ×1.05 from F5, ×1.10 from F10 (RM18) | Her own points, step 6 |
| **Keepsake** (F10, S5) | +0.25 quality at her line, +0.5 from S5 | CS26's sources |
| **Her dream** (S3) | +5% items for **anyone** at her line's place | The crew term (RM34) |
| **Household** (5 and 15 married) | +5% items crew-wide, then +5% more | The crew term (RM34) |
| **Breakfast** (S1) | RM35 | Well fed |

**RM34: the caps.** So the economy can't run away:

| What | Cap |
|---|---|
| **Her own** line bonuses: F3 +10%, R5 +10%, her ring +1–15% | **+35%** |
| **The crew's**: a dream's +5% (the best one at a place, never summed) and the household's +5% and +5% | **+15%** |
| **All romance bonuses on any one job,** added | **+40%** |
| Night chores | **3 items a night** each (F6, R7, S4) |
| Morning items | **1 a day** each by her count, **+1** on a morning in her house |
| Mentor | One a place |
| Rank points from her ladder | ×1.10 |

Worked, the cap: a married forager with F3, R5 and a grade-8 ring (+8%) has +28% of her own; with a dream at the
forest (+5%) and 15 married (+10%) the crew adds +15%; together **+43%, held to +40%**. An Expert C forager at the
Mountain brings home about 1,722g a day (CS17); +40% is +689g, and her three night chores add about 3 × 165g = 495g.

**RM35: breakfasts and the staff meal (FC15).** A **breakfast** is a spouse's S1 perk: on a morning in her house,
**the whole crew starts well fed for the day** (×1.25, as a **Rough** meal: one day), **only when no meal is running.**
- **A staff meal replaces it:** serving one the same day starts the meal's 1–3 days (CS22), so the Kitchen's Fine and
  Masterwork meals stay worth cooking.
- **A breakfast never counts as a staff meal** (chapter 4's goal, "serve a staff meal").
- Before the Kitchen (chapter 4), breakfasts are the farm's only well fed; after it, they cover the mornings a meal has
  run out, and a meal served that day replaces them. In the sim they add under 1% to a year's income.

**RM36: a perk at a place not open yet waits.** A perk whose place isn't open (a miner's +10% before chapter 3; a
cook's before the Kitchen) shows "Opens with chapter 3" on her profile and works from that day. It's no loss: her
points and levels don't depend on it. In the romance core alone (before M5), the eight Mine and Quarry Umas' line perks
wait for M5's chapter 3.

## 7. Dates and the ring (RM37–RM40)

**RM37: the evening kinds.** D42's ten date games are the evening's kinds, opened by her ladder and by their game:

| Kind | As a hangout | As a date | Plays as (RM25) | Its game |
|---|---|---|---|---|
| Walk at dusk | F2 | R1 | Walk | Now |
| Fishing at the Pond | F2 | R1 | Cast | Now |
| A picnic | F2 | R1 | Pick | Now |
| The market in town | F2 | R1 | Pick | Now |
| Cooking together | F2 | R1 | The Kitchen's practice mode | M5 (F8) |
| Crafting | — | R1 | Rhythm | Now |
| Stargazing at the overlook | — | R3 | Pick | Now |
| Dancing | — | R6 | Rhythm | Now |
| A boat on the lake | — | R6 | Rhythm | Now |
| A footrace | — | R9 | The track play | M6 (F32) |
| Festival night | Festival days, F2 | Festival days, R1 | Walk at the festival ground | Now (the second evening, RM19) |

**Her favourite kind** is the date game her route's beats use most (`together.date`), walk on a tie, so no new field
is needed; it pays ×1.5 and is what her invitations ask for. Every kind is 30–60 s, graded, never failed (research b6:
"a date that is a scored activity with a big payout feels like play").

**RM38: the ring bench.** The proposal needs a ring (RS6), but the Forge's merge game is M6 while the sim's first
wedding comes on day 34 (focused) to 124 (light). So the Forge opens early, **as a bench, with no game:**
- **When:** the morning after your **first Romance 8** event, Ida Stone (CS41's smith) comes up from town in a short
  scene and opens the Forge's building on the workshop row as **the ring bench**. Its chapter 7 opening (the merge game
  and tools, CS43) stays.
- **The recipe:** **a ring of grade *g* from 3 refined goods of grade *g*,** any family (planks, fillets, flours,
  preserves, dried goods; ingots and cut gems later). From chapter 3 (M5), CS25's own recipe works too: 2 ingots + 1 cut
  gem of the grade. The rings are CS25's ten, `ring-g1…g10` (uma-art's renamed frames), so no new good or art.
- **Cost:** the goods only. **No gold, no gate, one ring a day,** no assistant, no score (a Rough make).

Worked: 3 Cedar Planks (G3, 60g each, 180g of goods) make an **Iron Ring** (`ring-g3`, 340g); 3 Salmon Fillets (G5,
165g each) make a **Cobalt Ring** (`ring-g5`). The sim's first ring is made on day 30 (focused) to 75 (typical).

```
┌──────────────────────────────────────────┐
│ The Forge · ring bench          Ida Stone│
├──────────────────────────────────────────┤
│ A ring of grade g: 3 refined goods of g  │
│   ▢▢▢ Cedar Plank ×3 (G3)   → Iron Ring  │
│   ▢▢▢ Salmon Fillet ×3 (G5) → Cobalt Ring│
│ From chapter 3: 2 ingots + 1 cut gem     │
├──────────────────────────────────────────┤
│ Her bonus once married: +1% a grade      │
│   (+0 / +1 / +3 / +5 for the merge, M6)  │
│                                          │
│      [ Make an Iron Ring · 1 a day ]     │
└──────────────────────────────────────────┘
```

**RM39: the ring's bonus.** **Any ring** makes the proposal Ready (research b7). Once she's married, **her ring adds
+1% at her line a grade (1–10)**, plus **+0, +1, +3 or +5** for a Rough, Fine, Great or Masterwork make from M6's merge
game: **up to +15%**, inside her own cap (RM34). **Give her a better ring** at the bench any day: she keeps the best,
and the old one returns to the Warehouse. One ring each; rings are unlimited; **no house, bed, gold or calendar gate on
a proposal.** At Romance 8 her profile shows the engraving her ring will carry (a line from her route).

**RM40: the Forge's timeline.** The Forge's building opens with the ring bench (RM38) instead of chapter 7; chapter 7
(M6) lights its fire for the merge game, tool upgrades and Rings and Fittings to sell (CS24, CS25 unchanged). Ida
Stone's first scene moves to the bench's opening; CS41's "first seen: chapter 7" becomes "the first Romance 8".

## 8. Married life (RM41–RM47)

**RM41: the homestead.** A new row on the farm map, behind the yard (FC28 grows): **the Farmhouse** and **six house
lots.**

| | Rooms | Costs | Opens |
|---|---|---|---|
| **The Farmhouse** | 2 spouse rooms (the farmer's own home) | — | Day 1 |
| **House 1** | 2, or 4 extended | 8,000g, extension 4,000g | The first wedding |
| **House 2** | 2 / 4 | 20,000g · 10,000g | House 1 built |
| **House 3** | 2 / 4 | 40,000g · 20,000g | House 2 built |
| **House 4** | 2 / 4 | 70,000g · 35,000g | House 3 built |
| **House 5** | 2 / 4 | 110,000g · 55,000g | House 4 built |
| **House 6** | 2 / 4 | 160,000g · 80,000g | House 5 built |
| **All** | **26 rooms** for 20 spouses and own-house wishes | **408,000g, 612,000g extended** | |

- You name each house when it's built (Rose Cottage, Willow House …); its exterior is pixel art, one drawing in two
  sizes (F55).
- **Prices** follow the core spec's rule (a purchase costs 1–4 days of that season's income): in the sim, House 1
  costs about **0.3 days** of income when it's bought (day ~95–105) and House 5 about **2 days** (day ~156–165). They
  replace the Dorm's dropped levels 9 and 10 (330,000g) as year 3's sink.
- **Never a gate:** a wedding never waits for a room (RM42).

```
┌──────────────────────────────────────────┐
│ The homestead              Married 9/20  │
├──────────────────────────────────────────┤
│ ⌂ Farmhouse     ▣▣         2/2  yours    │
│ ⌂ Rose Cottage  ▣▣▣▣       4/4           │
│ ⌂ Willow House  ▣▣▣▢       3/4           │
│ ⌂ Lot 3         ▢▢  Build · 40,000g      │
│ ⌂ Lot 4–6       locked to build in turn  │
├──────────────────────────────────────────┤
│ Needs a room: none                       │
│ Move: tap a face, then a free room.      │
│ Shared houses: +10 bond a night a pair.  │
└──────────────────────────────────────────┘
```

**RM42: rooms and moving.** At her wedding she takes a free room; you pick the house, defaulting to the one where her
closest tie lives (RM49). With no room free she **keeps her Dorm bed** and her profile says "Needs a room"; she moves
in the morning after one is built. **Move any spouse** to a free room any morning, free (a swap within the homestead
too). **Pairs sharing a house earn +10 bond points a night** (CS44's shared-place rate), so a strong tie under one roof
bonds faster (D43).

**RM43: the night's house and its morning.** Each night you pick a house (RM22); **the morning is that house's** (D43,
replacing the research's three-spouses-home rotation):
- **each resident: +30 points** to her spouse bar;
- **her breakfast** (S1): the crew well fed for the day, if no meal runs (RM35);
- **her morning item** (S2), on top of her own count;
- **a house line:** a short exchange among the residents (authored household lines in the pack; CS46-style templates by
  temperament until written).

**A house you haven't slept in for 8 nights** invites you warmly in the morning summary ("Willow House misses you"); it
costs nothing to say "Another night". There is no neglect penalty, ever.

**RM44: her own house, and her birthday alone** (D43, W15). An Uma whose bible says so (a proposed optional field,
`wishes: ['own-house', 'birthday-alone']`) asks in her S1 event for **a house to herself**: she's happiest in a house
with no other resident, and until one is free her profile says, softly, "She'd love her own house". Nothing is lost
while she waits. **Her birthday alone:** on her birthday, Tonight offers "her room" as the place to sleep; that morning
is hers alone (only her +30, breakfast and item). House 6 exists mostly for these wishes (26 rooms for 20).

**RM45: household milestones.** The Hearts header always shows **"Married n/20"**.

| Married | Opens |
|---|---|
| **1** | The homestead (RM41); the night's house; anniversaries |
| **5** | **Household scene 1**; a furniture set (5 decorations for the houses); **+5% items crew-wide** |
| **10** | **Household scene 2**; **two evenings every fourth day**; two invitations a morning |
| **15** | **Household scene 3**; **+5% more items** crew-wide |
| **20** | **The finale** (RM46) |

The household scenes are authored (the pack's `household.json`, RM58), each with every spouse so far and at least one
line each.

**RM46: the finale at 20 of 20.** The morning after the 20th wedding, **the Great Harvest** (W14, D42) is Ready: a
farm-wide celebration at the festival ground in which **every spouse has her own moment and line** (3–5 minutes with a
play, then one beat per spouse, then the whole household). Its Memory is the game's last stage-up card. **The game
goes on:** the farm, the calendar, festivals and anniversaries continue, and each year on its day a **Festival of
Vows** gives every spouse +50 and an evening's festival night. Research (b9) and the otome lessons: a visible
checklist (the header) and a finale where every spouse matters.

**RM47: waves after the 20.** When S and A join (RS1), the header becomes **"Married n/N"** with the cast at the time;
the finale plays once, at the first 20 of 20; each later wave adds its own household scene when its Umas are all
married. Houses 1–6 hold 26; a later wave adds lots with its beds.

## 9. Bonds between Umas (RM48–RM50)

**RM48: bonds move into the romance core** (FC25, CS44; they were M6's F33). Perks lean on them (in her element, the
closest friend's ×1.5, sharing a house), so they come now:

| Shared | Points | |
|---|---|---|
| Working the same place the same day | +10 (×1.5 in a favourite line they share) | CS44 |
| An expedition party, a day away | +15 | CS44 (M5) |
| A festival team | +20 | CS44 (M6) |
| The same staff meal, or the same breakfast | +5 | CS44, and RM35 |
| **The same house, a night** | **+10** | RM42 |

Hearts at 50, 150, 300, 500 and 750 (CS44); **×1.1 side by side at 3 hearts** (CS17); a **duo move at 5** on
expeditions (CS49, M5). Bonds never fall. Night step 6's `tickBonds` stops being a no-op.

**RM49: the 31 ties seed them.** When both Umas of an authored tie are on the farm, their bond starts at its
strength: **3 → 150 (2 hearts), 2 → 50 (1 heart), 1 → 0** (known, with a line). Every Uma has at least two ties (D42),
so **her closest friend** is always defined: her strongest tie, then the most bond points, then the tie's order.
Romance 4 gives her bond with her closest friend **×1.5** points.

**RM50: pair conversations.** Each new bond heart opens a short pair conversation (FC27):
- **an authored one** for a tie's pair (RS12: each Uma's two closest ties, at all five levels, from the pack);
- **CS46's templates** for other pairs, which stay M6's (F33, 250 templates); until then a pair without an authored
  conversation gets the heart's line and no scene;
- the morning's Hearts section lists new bond hearts with **Read** (RM57); the Diary keeps them.

## 10. The screens (RM51–RM57)

**RM51: the bottom bar.** **Farm · Hearts · End the day · Diary · Menu** (FC29 amended). **Hearts replaces Roster:**
it's the Umas' tab, with two views, **Hearts** (the default, RM52) and **Work** (today's roster album: talents, ranks,
filters and sorts, as F21 and F23 built it). Her sheet opens from either, from her sprite on the map, and from the
morning, at `?uma=<characterId>`. The Diary keeps the chapter's goals.

**RM52: the Hearts tab.** One **72pt row per Uma**: her face (master data), name, stage and level, the bar in the
stage's colour with the filling heart, points over the next cost, "+N banked", today's chat and gift ticks, and chips:
**● Ready**, **✉** an invitation, **Away**. **Ready rows sort first,** then by the least progress. Filter chips: Ready,
Friends, Partners, Married, Away. The header: "Married n/20" and the evening's state (○ free, ● spent). The (i) opens
the rules in five lines (FC30).

```
┌──────────────────────────────────────────┐
│ Hearts            Married 3/20  Evening ○│
│ [Ready 2] [Friends] [Partners] [Married] │
├──────────────────────────────────────────┤
│ (face) Stand-in            ● Ready  ✉    │
│        Partner · R4  ■■■■▣□□□□□          │  ▣ the heart filling
│        250/360 · +40 banked · ✓chat ✓gift│  points/next · banked
├──────────────────────────────────────────┤
│ (face) Stand-in two        ● Ready       │
│        Friend · F7   ■■■■■■■▣□□          │
│        480/480 · works the Pond today    │
├──────────────────────────────────────────┤
│ (face) Stand-in three      ♥ Spouse      │
│        Spouse · S2   ■■▣□□               │
│        310/600 · Rose Cottage · ✓chat    │  her house
├──────────────────────────────────────────┤
│ (face) …                   Away          │
│        Friend · F2   ■■▣□□□□□□□          │
│        Swap her home to play her events  │
├──────────────────────────────────────────┤
│ [ Hearts ]  Work                    (i)  │
└──────────────────────────────────────────┘
```

**RM53: her profile sheet.** From the top:
- **the route as one track** (F ◆ R ◇ S, the filling heart);
- her line, birthday and house;
- **the Next card:** the rung, its perk, its place and setup ("the Pond, when she works it" or "Opens with chapter 3"),
  the bar and what's banked;
- **Perks** (reached ✓, the next, the rest greyed); **Gifts** (loved, liked, disliked as learnt; others +10);
  **Ties** (her bonds with hearts); **Memories** (count, replay); her pet name, keepsake and ring once given;
- **Chat +15 · Gift · Evening ›** (and **Praise +20** when she's earned it), 48pt in the thumb zone; **Hearts | Work**
  switches to her talents and ranks (F21's sheet).

```
┌──────────────────────────────────────────┐
│ ‹ Stand-in                       Partner │
│ F■■■■■■■■■■◆R■■■■▣□□□□□◇S□□□□□           │  the whole route, one track
│ Fishing · ★ Spring 5 · Rose Cottage      │
│ ┌─ Next: Romance 5 ────────────────────┐ │
│ │ Perk: +10% more at her line (now 10) │ │
│ │ Event: the Pond, when she works it   │ │
│ │ 250/360 ██████████░░░░ +40 banked    │ │  banked points carry over
│ └──────────────────────────────────────┘ │
│ Perks   F1–F10 ✓ · R1–R4 ✓ · next R5     │
│ Gifts   Loved ▢ +60 · Liked ▢▢▢ +30      │
│         Disliked ▢▢ 0 · others +10       │
│ Ties    Stand-in two ♥♥♥ · Stand-in 3 ♥  │
│ Memories 15 · replay any                 │
├──────────────────────────────────────────┤
│ [ Chat +15 ] [ Gift ] [ Evening › ]      │
│ [ Praise +20 ]          Hearts | Work    │
└──────────────────────────────────────────┘
```

**RM54: event playback.** RM29's player (mockup above). Ready events start from her row's **● Ready**, her profile's
Next card or the morning's line; a setup not met says what to do ("Assign her to the Pond, then come back").

**RM55: the level-up and stage-up cards.** **The level-up card** closes every event: the heart fills with a short
sparkle and she says one line; then the sum (+50, the choice, the grade), the **perk** card, the **Memory**, and the
next rung's cost, place and setup, with one **Continue**. **The stage-up screen** closes the confession, the proposal
and the wedding: the track re-colours (coral → rose → gold) and lists everything the stage opens. A night level (S2,
S4) shows its card in the morning.

```
┌──────────────────────────────────────────┐
│          ♥  Romance 5  ♥                 │
│      (bust) "Same time tomorrow?"        │
├──────────────────────────────────────────┤
│ +50 event · +30 choice · +15 Great       │
│   = +95 toward Romance 6 (+40 banked)    │
├──────────────────────────────────────────┤
│ PERK  +10% more at her line  (now +20%)  │
│ MEMORY "First catch" ▢ saved             │
├──────────────────────────────────────────┤
│ Next: Romance 6 · 400 points             │
│   the Overlook · any day                 │
│ Opens: date kinds dance and boat         │
│                                          │
│              [ Continue ]                │
└──────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────┐
│            Married                       │
│   F■■■■■■■■■■ ◆ R■■■■■■■■■■ ◇ S□□□□□     │
│   the bar turns gold                     │
├──────────────────────────────────────────┤
│ Opens now                                │
│  · the spouse ladder, S1–S5              │
│  · her room: Rose Cottage (2 of 4)       │
│  · her ring: +6% at her line             │
│  · house mornings with her               │
│  · her anniversary: Summer 3             │
├──────────────────────────────────────────┤
│ Married 4/20 · next household scene at 5 │
│              [ Continue ]                │
└──────────────────────────────────────────┘
```

**RM56: Memories.** An album per Uma, opened from her profile (and a Memories shelf in the Diary): one tile a rung,
played ones with their caption, the next marked, the rest locked. A tap **replays from any choice**: the scene plays,
every option is open, and nothing pays.

```
┌──────────────────────────────────────────┐
│ ‹ Stand-in · Memories          15 of 26  │
│ [Friend] [Romance] [Wed] [Spouse]        │
├──────────────────────────────────────────┤
│ ▢F1     ▢F2     ▢F3     ▢F4              │
│ First   Rows    Rain    Her              │
│ hello   at dawn porch   recipe           │
│ ▢F5     ▢F6     ▢F7     ▢F8              │
│ …                                        │
│ ▢R4     ░R5     ░R6     ░R7              │
│         next    locked  locked           │
├──────────────────────────────────────────┤
│ Tap a Memory: replay from any choice.    │
│ Replays give no points.                  │
└──────────────────────────────────────────┘
```

**RM57: the morning summary's Hearts section.** CS5's §4 ("Bonds and affinity") becomes **Hearts**, after Ranks, in
this order, each line a tap to its place:
1. **Ready** lines, up to three ("Ready · Romance 5 · the Pond, when she works it"), then "+2 more" (opens Hearts on
   Ready);
2. **the invitation** with **Yes, tonight / Another day** (RM20);
3. **the house's morning:** breakfast, +30s, items, night chores;
4. **birthdays and anniversaries,** today and tomorrow;
5. **levels reached overnight** (S2, S4) and arrivals' scenes waiting;
6. **bond hearts** with **Read**.

There's **no pop-up per event**: the summary, a badge on her sprite and her Ready chip are the only signals (research c).

```
┌──────────────────────────────────────────┐
│ Spring 6 · Year 2                 ✕      │
├──────────────────────────────────────────┤
│ Sold  1,840g  …                          │
│ Work  Forest 3 jobs · Block A 9 ready    │
│ Ranks Stand-in two → Skilled fishing     │
├──────────────────────────────────────────┤
│ Hearts                                   │
│ ● Ready · Stand-in · Romance 5           │  up to three Ready lines, then "+2 more"
│   the Pond, when she works it        ›   │
│ ● Ready · Stand-in two · Friendship 8 ›  │
│ ✉ Stand-in three: "Stargazing tonight?"  │
│     [ Yes, tonight ]   [ Another day ]   │
│ ♥ Rose Cottage: breakfast, crew fed      │
│   +30 each · 2 morning items · 3 chores  │
│ ★ Tomorrow: Stand-in two's birthday      │
│ ♥♥ Stand-in & Stand-in two: bond 3 · Read│
├──────────────────────────────────────────┤
│ New   Spring 6 · chapter 3 · …           │
│ Today 2 idle · 9 plots to plant          │
└──────────────────────────────────────────┘
```

## 11. Content delivery (RM58–RM60)

**RM58: the story ships as a private pack.** The authored story is private (RS15, D41): it names real characters and
draws on their canon. It reaches the game the way uma-rpg's enemy pack does:
- **a private bucket,** `gs://uma-farm-content` (`us-central1`, uniform access, public access prevented, versioned,
  labelled `app=farm`);
- **farm-api's `PrivatePackModule`** (uma-server's `content`, as uma-rpg's `app.module.ts` uses it) at
  **`/api/story/…`**, behind the owner guard, serving an allowlist: the index `story.json` and hash-named files
  (`story/<name>.<hash8>.json`); `STORY_BUCKET` in production, `STORY_DIR` (the ignored `content/story-release/`)
  locally;
- **the web app** fetches the index at boot, then each file by hash, cached immutably in IndexedDB; **the save keys ids
  only and never stores text.**

The pack holds, by F40's format: `cast.json`, `ties.json`, `umas/<characterId>.json` (bibles), `routes/<characterId>.json`
(scripted events), `pairs/<a>-<b>.json`, and the romance core's additions:

| Addition (asked of the story session; the format and validator change in F46–F54) | For |
|---|---|
| `arrival` event per route (a 27th scripted scene) | RM4 |
| `chats` in her bible: about 10 lines a stage (friend, partner, spouse) | RM31's F1 perk |
| `wishes` in her bible: `own-house`, `birthday-alone` (optional) | RM44 |
| `keepsake` in her bible: a name and a line | RM31 |
| `wedding.places`: the three places her wedding offers | RM30 |
| `household.json`: three household scenes, house lines, the finale | RM43, RM45, RM46 |
| `birthday` in the cast file, only where master data lacks one | RM16 |

**RM59: built dark, on the stand-in.** The romance core is built behind **`VITE_FARM_ROMANCE=1`** (D29's pattern):
production stays on M4 while it's built.
- **In git:** the format, the validator and a **stand-in pack** (9000001–9000003: a cast, ties, one full route of 26
  events plus an arrival, a pair, a household file), with stand-in lines. Tests run on it with
  `@luismlorenzana/uma-data/testing` fixtures; a stand-in missing from master data shows a lettered disc and reads D
  talents (RM3).
- **Locally,** farm-api's `STORY_DIR` can point at a build of the private `content/story/`, so the owner's real routes
  can be played on the dev server before any cloud.
- **Production** turns on with F56, which ships the pack and the wipe together.

**RM60: the delivery packet (F56) and its cost.** Scope: create the bucket and grant `farm-api-runtime`
`roles/storage.objectViewer` on it (an `infra/bootstrap.sh` step, idempotent); a `pnpm story:publish` script that
validates `content/story/` with the domain's validator, writes the hashed release and uploads it with the scoped
gcloud; the API module and route with tests; the web loader and cache; then **the go-live**: the flag on, save v4 and
the wipe, and the owner's phone check. **Creating a bucket and changing IAM need the owner's yes in one line**
(CLAUDE.md), asked when F56 is written, with this table:

| Resource | Use | Free tier (always free) | Expected | Cost |
|---|---|---|---|---|
| Cloud Storage, `gs://uma-farm-content`, Standard, `us-central1` | The story pack, all versions | 5 GB-months | About 3 MB a version (140,000 words of JSON), under 50 MB with history | **$0** |
| Class A operations (writes) | Publishing a version | 5,000 a month | About 100 a publish | **$0** |
| Class B operations (reads) | farm-api reading files | 50,000 a month | A few hundred (hash-named files cache forever) | **$0** |
| Egress | To Cloud Run, same region | Free in-region | — | **$0** |
| Cloud Run `farm-api` | One more route | 2 million requests a month | A few a day | **$0** |
| IAM | One binding on the bucket | Free | — | **$0** |

## 12. Character art, later (RM61–RM62)

**RM61: where character art would sit.** Character art is authored later and privately (D44), ChatGPT's end to end
(D45), priority Umas first. Its slots, so nothing has to move when it arrives:

| Slot | Shown in | Size | Count |
|---|---|---|---|
| **Bust** | The event player, her profile's header, the level-up card | 512 × 640 | 1 an Uma |
| **Expressions** | The event player, by the line's emote | The bust's frame | 8 an Uma (F40's emotes) |
| **Event illustrations** | The stage-up screens (confession, proposal, wedding), the finale, Memories' covers | 1080 × 1350 | 3 an Uma, plus the finale and 3 household scenes |

They are original-game-derived, so they ship in the **story pack's art folder** (`story/art/<characterId>-<slot>.<hash8>.webp`,
the same private route), never in uma-art.

**RM62: the fallbacks, so nothing waits.** Until a slot has art: the **bust** is master data's art through uma-kit's
`UmaBust`, the face is `FaceTile`, as today; an **expression** is the bust with a small emote mark; an **illustration**
is the place card with her bust. **Pixel pieces are Claude's** (D45): the homestead's Farmhouse and house in two sizes,
the ring bench's mark, the Hearts marks (three stage hearts, banked, Ready, evening, invitation, Memory frame), and the
five plays' small icons (F55, uma-platform's `scripts/pixel-art`).

## 13. The economy, re-simulated (RM63–RM64)

**RM63: the sim.** The core spec's throwaway sim (`data.py`, `sim.py`; not in git) carried to five years (240 days),
**30 runs** of each player with the same farm draws:
- **the roster is authored:** 20 Umas drawn from the release four per line by D42's playstyle rule (four farmers,
  foragers and fishers, four for the Mine, four for the Quarry), arriving by D42's plan (RM4): the opening three, chapters
  1–7, five festivals and Dorm levels 4–8; the Dorm for 20 (RM5); no Gate;
- **the farm is played as CS51 does** (the sensible player: best crops, tending, places by talent, chapters, Fine
  workshop plays, beds and buildings as ranks open them), with chapters 6–7 approximated, a sensible player keeping one
  Uma at the Quarry while chapter 3 asks for its floor 5, and expected values throughout;
- **the romance layer** is this spec: costs (RM12), points (RM13), banking (RM14), one event a day each (RM21) with a
  40% chance a setup waits a day, the evening and invitations (RM19, RM20), the perks and caps (RM31–RM35), the ring bench
  (RM38), houses (RM41) and household milestones (RM45). Gifts cost their goods, rings their goods, houses their gold.
- **Four players:** **none** (the same authored farm, no romance: the baseline); **light** (chats with 70% of the Umas,
  gifts to 30%, an evening on 70% of days, half its invitations taken); **typical** (chats with all, gifts to 60%, an
  evening every day, 70% of invitations); **focused** (chats and ★2 gifts to all, loved gifts to her, every evening on
  one Uma until she's married, then the next).

**The romance milestones by day** (median of 30, lowest–highest), against research b2's estimate:

| Milestone | Research: focused | **Sim: focused** | Research: typical | **Sim: typical** | **Sim: light** |
|---|---|---|---|---|---|
| First heart event | Day 2 | **2** (2–3) | Day 3–4 | **3** (2–4) | **4** (2–6) |
| First confession | About day 20 | **18** (15–21) | About day 40–45 | **38** (27–46) | **54** (35–71) |
| First ring | — | **30** (25–34) | — | **75** (55–86) | **111** (84–128) |
| First wedding | About day 40 | **34** (28–37) | About day 85 | **84** (64–97) | **124** (99–140) |
| 5 married | — | **82** (78–85) | — | **110** (95–118) | **156** (143–170) |
| 10 married | — | **104** (101–109) | — | **131** (119–141) | **180** (169–190) |
| 15 married | — | **120** (117–126) | — | **150** (141–161) | **196** (190–210) |
| **All 20 married** | n/a | **140** (136–160) | Year 4–5 (days 190–240) | **158** (151–187), year 4 | **205** (198–221), year 5 |

**Gold and income by day** (median of 30):

| Day | None: gold | Typical: gold | Focused: gold | None: the bin a day | Typical: the bin a day | Umas | Married (typical) |
|---|---|---|---|---|---|---|---|
| 12 | 4,952 | 3,661 | 3,483 | 2,007 | 2,127 | 5 | 0 |
| 24 | 9,774 | 8,197 | 7,214 | 1,596 | 2,074 | 9 | 0 |
| 36 | 12,351 | 13,195 | 15,690 | 4,842 | 5,870 | 11 | 0 |
| 48 | 32,641 | 33,828 | 23,408 | 9,136 | 9,436 | 14 | 0 |
| 96 | 269,281 | 298,999 | 312,362 | 26,118 | 29,011 | 20 | 2 |
| 144 | 417,986 | 535,825 | 558,235 | 37,417 | 47,132 | 20 | 13 |
| 192 | 494,692 | 718,123 | 721,808 | 46,247 | 64,000 | 20 | 20 |
| 240 | 555,808 | 764,740 | 760,132 | 49,913 | 67,570 | 20 | 20 |

**Earned a year** (the bin, median of 30), and romance's lift over the baseline:

| Year | None | Light | **Typical** | Focused |
|---|---|---|---|---|
| 1 | 215,740 | 221,249 (+3%) | **224,707 (+4%)** | 227,373 (+5%) |
| 2 | 994,731 | 1,035,423 (+4%) | **1,076,697 (+8%)** | 1,156,939 (+16%) |
| 3 | 1,743,290 | 1,963,711 (+13%) | **2,158,466 (+24%)** | 2,308,574 (+32%) |
| 4 | 2,116,727 | 2,751,570 (+30%) | **2,997,709 (+42%)** | 3,097,264 (+46%) |
| 5 | 2,579,350 | 3,545,240 (+37%) | **3,568,670 (+38%)** | 3,534,935 (+37%) |

**Where year 5's lift comes from** (typical, each family switched off in turn; year 5's +989,000g):

| Family | Share of a year's income |
|---|---|
| Night chores (F6, R7, S4) | +15% |
| Her own line bonus and her ring (F3, R5) | +8% |
| The household (+5%, +5%) | +7% |
| In her element (×1.2) | +4% |
| Her keepsake's quality | +4% |
| Her dream's crew bonus | +3% |
| Morning items (outside the bin) | about +2% |
| Breakfasts, mentor, rank points | under 1% each |

The families overlap (a night chore's item is worth more with a keepsake's stars), so their shares add to more than
the lift.

**What romance costs** (typical, 240 days): gifts given **331,000g of goods** (3% of the bin; a focused player 754,000g);
rings **7,000g** of goods; houses **317,000g**. Romance points by source (typical, all Umas, 240 days): gifts 35%,
chats 20%, heart events 14%, evenings 13%, praise 12%, house mornings 4%, her line and festivals 1% each.

**The median typical run, Spring of year 1** (seed 4): the first heart event plays on day 3; 14 events play by day 12.

| Day | Umas | Events today | The bin paid | Gold at night's end | Farm Rank |
|---|---|---|---|---|---|
| 1 | 3 | 0 (three arrival scenes) | 30 | 346 | 1 |
| 2 | 3 | 0 | 355 | 602 | 1 |
| 3 | 3 | 1 (the first Friendship 1) | 372 | 938 | 1 |
| 4 | 3 | 2 | 1,019 | 1,795 | 1 |
| 5 | 3 (5 beds) | 2 | 411 | 1,026 | 1 |
| 6 | 3 | 0 | 597 | 1,544 | 1 |
| 7 | 3 | 2 | 805 | 2,270 | 1 |
| 8 | 3 | 2 | 2,227 | 3,923 | 1 |
| 9 | 3 | 0 | 894 | 4,781 | 1 |
| 10 | 4 (the Flower Show's arrival) | 3 | 1,067 | 6,332 | 2 |
| 11 | 5 (chapter 1's arrival) | 1 | 1,077 | 3,749 | 3 |
| 12 | 5 | 1 | 2,315 | 3,531 | 3 |

The same run by year: 102 events played in year 1 (14 Umas), the first wedding on day 64, 5 married on day 104, 20 on
day 164; 520 events by the end (20 × 26).

**RM64: the verdict.**
- **The romance pace matches the research** where it gave a number (first event, first confession, first wedding), and
  **all 20 married lands in year 4 for a typical player and year 5 for a light one**: the long goal stays long. The
  research's costs (b1) and points (b2) are kept.
- **Year 1 stays the core spec's year, slightly richer:** +4% for a typical player. Gifts cost goods (day 12's gold is
  3,661 against 4,952 with no romance), but every purchase still lands within 1–4 days of income.
- **The authored roster, not romance, is year 1's big change:** 14 Umas at day 48 instead of CS52's 20, so year 1 earns
  about **216,000g against CS52's 303,000g**, and chapters 1–5 finish on days 11, 20, 24, 34 and 43 (CS43's sim: 8, 14,
  19, 34, 41). Never stingy: gold never runs out, and the Dorm's prices are CS34's level for level.
- **Never runaway where gold matters:** romance adds +4% in year 1 and +8% in year 2, when Dorm levels, buildings and
  workshops are bought. It adds **about +40% once all 20 are married** (years 4–5), by design: the Umas are the
  workforce, so the married household is the farm's endgame economy (research's conclusion). By then the Farm Rank is
  10 (day ~120) and gold buys only houses and decorations. Every romance bonus sits in one table with its cap (RM34),
  so tuning is one change.

## 14. What it revises (RM65)

**RM65: the amended calls,** one line each. Each doc gets a status note naming them; their text is left as history.

**[core-loop.md](core-loop.md):**

| Call | Amended |
|---|---|
| FC1 | The day gains an evening (RM19) and, once married, a house for the night (RM22) |
| FC13 | The Forge opens early as the ring bench at the first Romance 8 (RM38, RM40) |
| FC14 | The Kitchen also cooks loved gifts and signature dishes, and its game's practice mode is the cook-together date and event play (RM26, RM31) |
| FC15 | A spouse's breakfast is a one-day well fed when no meal runs; a staff meal replaces it (RM35) |
| FC16 | Umas join only as the authored cast's arrivals: no start picks, no Gate, no random recruits (RM1, RM4) |
| FC17 | Her favourite line comes from her bible, not from her calling as computed (RM6) |
| FC19 | The roster's album becomes the Hearts tab's Work view (RM51) |
| FC22 | A festival's arrival comes on its day; a festival team gets +50; festival night is a second evening; prizes no longer bring recruits (RM4, RM13, RM19) |
| FC24 | Umas are authored characters with routes, not runtime roles; arrival scenes join the chapters (RM4, RM9) |
| FC25 | Bonds come in the romance core, seeded by the 31 ties, with a shared house earning +10 a night (RM48, RM49) |
| FC26 | Affinity becomes her route: friendship, the confession, romance, the proposal, the wedding and spouse ladders (RM11–RM18) |
| FC27 | Ties' pairs get authored conversations from the pack; templates cover the rest (RM50) |
| FC28 | The map gains the homestead row (RM41) |
| FC29 | The bottom bar is Farm · Hearts · End the day · Diary · Menu (RM51) |
| FC31 | v4 is a wipe, not a carry-over (RM10) |
| FC32 | The order gains the romance core before M5, then the private delivery (RM66) |
| FC33 | End the day opens Tonight; the morning gains the Hearts section (RM22, RM57) |

**[core-spec.md](core-spec.md):**

| Call | Amended |
|---|---|
| CS2 | No start picks: the farmer's name, then the authored opening three (RM8, RM9) |
| CS3 | Day 1 also has the Farmhouse; the start's three are authored (RM9, RM41) |
| CS5 | §4 becomes Hearts: Ready lines, the invitation, the house's morning, birthdays, levels, bond hearts (RM57) |
| CS7 | The night's steps gain night chores, bonds, her line, spouse levels, arrivals, the house's morning and invitations (RM23) |
| CS17 | The bond factor can be ×1.2 (in her element), and a romance bonus term joins, capped at +40% (RM33, RM34) |
| CS21 | Recipes also come as signature dishes (F4); dishes are loved gifts (RM7, RM31) |
| CS22 | The staff meal replaces a breakfast and is the only meal chapter 4 counts (RM35) |
| CS25 | Rings are also made at the ring bench from 3 refined goods of a grade, before chapter 7 (RM38) |
| CS29 | Rank points' hearts factor reads her friendship level; a mentor adds +10% at her place (RM18, RM33) |
| CS33 | Her favourite line is her bible's (RM6) |
| CS34 | The Dorm has eight levels to 20 beds, 190,000g; levels 4–8 bring arrivals (RM5) |
| CS35 | Visitors and random recruits are gone; arrivals are authored (RM1, RM4) |
| CS36 | The off-season stays for arrivals with no bed (RM4) |
| CS37 | A request's extras lose the recruit (RM1) |
| CS38 | The Diary gains Memories and conversations by pair; "Umas recruited" milestones stop at 20 (RM50, RM56) |
| CS40 | 1st and 2nd place pay gold and trophies, not recruits (RM1) |
| CS41 | Ida Stone is first seen at the ring bench (RM40) |
| CS42 | The opening scene brings the authored three after the name; the closing scene's recruit is chapter 1's arrival (RM4, RM9) |
| CS43 | Each chapter's recruit is its authored arrival; chapters' scenes come from `docs/story/chapters/` (RM4) |
| CS44 | Bonds come in the romance core, seeded by ties, with +10 a night for a shared house (RM48, RM49) |
| CS45 | Replaced by the ladders, points and gifts (RM11–RM18) |
| CS46 | Templates stay for pairs without an authored conversation; her story beats by temperament are replaced by her heart events (RM50) |
| CS49 | An expedition Great's visitor becomes a second special-find roll (RM1) |
| CS51, CS52 | Re-run with the authored roster and romance: §13's tables (RM63) |
| CS53 | Save v4's shape (RM10) |
| CS54 | v3 → v4 is a wipe with the server's backup (RM10) |
| CS55 | The romance core (F46–F56) comes before M5; M5's versions move to v5–v8 (RM66, RM67) |

**M5's packets** (paused, D39), each revised when its turn comes:

| Packet | Changes |
|---|---|
| **F27** the ranch, chapter 2 | **Save v5** (not v4). Chapter 2's recruit is its authored arrival. Its scenes come from [chapter-2.json](../story/chapters/chapter-2.json) as scripted there. `giftTaste`'s feed dislike goes (bibles decide). The ranch line's perks go live (RM32: products, +5 affection chores); `work: ranch` events keep Rhythm |
| **F26** the Mine and the Quarry, chapter 3 | **Save v6.** Chapter 3's arrival. Scenes from `chapter-3.json`. The eight Mine and Quarry Umas' line perks go live (RM36), and their `working: mining` setups open. The ring bench gains CS25's ingot and cut-gem recipe (RM38) |
| **F8** the Kitchen and the staff meal, chapter 4 | **Save v7.** The loved-by-stat rule goes (RM7). Signature recipes join the Kitchen's list (RM31). **The cooking game's practice mode is the cook-together evening and the `cooking` event play** (RM26, RM37). The staff meal replaces a breakfast and alone counts for chapter 4 (RM35). Chapter 4's arrival; scenes from `chapter-4.json` |
| **F39** the Cooking Contest | Year 1's Contest arrival comes on its day whatever the placing (RM4); its team gets +50 (RM13); 1st no longer recruits, 2nd no longer sends a visitor (RM1). Keeps v7 |
| **F28** expeditions, chapter 5 | **Save v8.** Chapter 5's arrival. A Great's visitor is a second special-find roll (RM1). Duo moves read the romance core's bonds; a party earns +15 a day away (RM48). Scenes from `chapter-5.json` |
| **F29** art for M5 | Unchanged in content; part A follows F55's romance art (or joins its release) |

**M6's packets** (one line each, written later): **F32** festivals also give their arrival, +50 for the team and the
festival night (RM19), and build the track play (RM37); **F33** keeps only the 250 conversation templates (bonds are
F52's); **F34** is retired (praise is F47's, story beats are heart events); **F35** and **F36** add their games' practice
mode as event plays (RM26), and F36 adds the ring's play bonus (RM39); **F37** chapters 6–7 bring their arrivals;
**F38** unchanged. **M7:** heart events and evenings move onto the stage (FR11's poses, the place's map stage, her
sprite) when it exists.

## 15. The order and the packets (RM66–RM67)

**RM66: the order.**
1. **MR, the romance core, on today's map** (F46–F55), built dark behind `VITE_FARM_ROMANCE=1` on the stand-in pack:
   the farmer and the authored start (save v4, the wipe), the ladders and points, heart events and their plays, the
   Hearts tab, the evening, perks, bonds, the ring bench and the proposal, married life and the houses.
2. **F56, the private delivery and the go-live:** the bucket, the pack route, the publish script, then the flag on with
   the wipe and the owner's phone check. The owner's yes for the bucket is asked when F56 is written.
3. **M5, revised** (F27 v5, F26 v6, F8 v7, F39, F28 v8, F29), whose chapters bring six more arrivals.
4. **M6** (chapters 6–8, festivals, the Restaurant and the Forge's games) and **M7** (the HD-2D farm).

Why the romance core first: it is the game the owner asked for (D40), it builds only on what's live, and M5's packets
are cheaper to write once the save, the arrivals and the perks exist.

**RM67: the romance core's packets,** F46 on (F41 is this spec; F42–F45 stay free). Each ships its rules in
`@farm/domain` with tests, its screens, and its manual page in `docs/game/` in the same change, as CS55's did.

| Id | What | Covers | Needs | Size |
|---|---|---|---|---|
| **F46** | **Save v4 and the authored start:** the pack's types and loader (cast, bibles, ties) with the stand-in pack; the roster by character id; `parseSave` v1–v3 → a fresh v4 (the wipe); the farmer's name step; the opening scene with the opening three and arrival scenes; authored arrivals at step 8 in place of the Gate, the start's picks and `recruitFor`; the Dorm for 20; her favourite line and tastes from her bible; the flag | RM1–RM10 | This spec | L |
| **F47** | **The ladders and points:** `love`, costs, chat, gifts with the picker's points, praise, her line, festival teams, banking, no decay, birthdays and anniversaries, the rank-point factor; the night's Hearts lines | RM11–RM18, RM23 (part) | F46 | M |
| **F48** | **The Hearts tab and her profile:** the bottom bar's change, the Hearts list, chips and sorts, the profile sheet, the Work view (the roster's album moved), the morning's Hearts section | RM51–RM53, RM57 | F47 | M |
| **F49** | **Heart events:** Ready rules and setups, the event player, the five plays (Cast, Pick, Rhythm, Walk, Choose) and the Rhythm fallback, choices with gains, rewards, the level-up and stage-up cards, Memories and replay, the confession | RM24–RM30 (the confession), RM54–RM56 | F48 | L |
| **F50** | **The evening and invitations:** one evening a day, hangouts and dates by kind and ladder, her favourite kind, festival night, invitations, End the day's Tonight sheet | RM19–RM22, RM37 | F49 | M |
| **F51** | **Perks:** the perk table as templates by line, the line effects, night chores, morning items, in her element, mentor, keepsake, dream, breakfasts and the staff meal, the caps | RM31–RM36 | F49 | M |
| **F52** | **Bonds:** CS44's points and hearts ticking at step 6, the ties' seed, the closest friend, Romance 4's ×1.5, the morning's bond hearts, authored pair conversations from the pack | RM48–RM50 | F47 | M |
| **F53** | **The ring bench, the proposal and the wedding:** Ida Stone's scene, the bench's recipe, the ring's bonus, the proposal and the wedding with their choices and stage-up | RM30 (proposal, wedding), RM38–RM40 | F49, F51 | M |
| **F54** | **Married life:** the homestead row, the Farmhouse and six houses, rooms and moves, the night's house and its morning, the spouse ladder's night levels, wishes, household milestones and scenes, the finale and the Festival of Vows | RM41–RM47 | F50, F53 | L |
| **F55** | **Art for the romance core (Claude, pixel, in uma-platform):** the Farmhouse and the house in two sizes, the ring bench's mark, the Hearts marks, the five plays' icons; a uma-art minor that F54 pins | RM62 | This spec | S |
| **F56** | **The private delivery and the go-live:** `gs://uma-farm-content` and its IAM (the owner's yes), `pnpm story:publish`, farm-api's `PrivatePackModule` at `/api/story`, the web's loader and cache, then the flag on, the wipe, and the owner's phone check | RM58–RM60 | F46–F55, the owner's yes | M |

**Order:** F46 first; F47; then F48 and F52 side by side; F49; F50 and F51 side by side; F53; F54; F55 any time from
now; F56 last.

## 16. The research's recommendations, decided

| Recommendation | Decided | Why |
|---|---|---|
| **(a)** What every event specifies: rung, Ready when, place, together, beats, choices, rewards, next hint | **Kept whole** (F40's format already holds it, D42–D43), with the five plays as `together`'s games (RM25) and an `arrival` scene added (RM58) | It's the owner's "game-like, not tap next" made checkable |
| **(b1)** The ladders: 160 + 40n, F1–F10, R1–R10, S1–S5 at 600 | **Kept** (RM11, RM12) | The sim lands on the research's own targets (RM63) |
| **(b2)** Points: chat 15, gifts ×stars, praise 20, her line 10, festival 50, evenings 60/100/150 ×1.5, events; no decay; banking; one evening a day; invitations | **Kept, with three additions:** her arrival scene (+50 and a choice), an invitation's +20, a house morning's +30 | So F1 arrives on day 2–3 as targeted, invitations are worth saying yes to, and the night's house matters |
| **(b3)** A perk on every level, templates by her line | **Kept, four changed:** a third night chore at S4 (not double), S3's crew bonus +5%, in her element ×1.2, date kinds from D42's games | The caps (RM34) keep the married economy at about +40% rather than more |
| **(b4)** Gifts: one a day, no weekly cap, tastes shown, never a loss | **Kept** (RM15) | — |
| **(b5)** Nothing missable or random; "Not yet" and "Ask her"; Memories replay | **Kept** (RM14, RM28, RM30) | — |
| **(b6)** Dates as 30–60 s activities with her favourite kind ×1.5 | **Kept, re-mapped** to D42's ten date games and five plays; forge and run become event plays and the footrace (RM26, RM37) | D42's games are what the routes are written in |
| **(b7)** Any ring, any day, re-forge, +1% a grade + the play to +15% | **Kept,** with **the ring bench** so rings exist before M6's Forge (RM38, RM39) | The first wedding comes on day 34–124 in the sim; the Forge is year 2 |
| **(b8)** The wedding's three choices; three spouses home by rotation | **Choices kept; the rotation replaced** by the houses and the night's pick (D43), with +30 house mornings (RM41–RM43) | The owner's houses (D43) |
| **(b9)** Milestones at 1, 5, 10, 15 and the finale at 20 | **Kept,** with the +10% item bonus split +5% and +5% (RM45) | Within the crew cap |
| **(c)** The Hearts tab, profile, playback, cards, Ready signals, replay | **Kept,** with Hearts replacing the Roster tab and the roster's album as its Work view (RM51) | Five tabs stay five |
| **(d)** Twelve genre limits to remove | **All removed** (no hidden values, decay, clock triggers, missables, silent gates, random confessions, gold or calendar gates, weekly caps, jealousy, static married life, hunting, punishing answers) | D43 |

## Questions for the owner

None. Every call has a sensible default and is decided here. Two things wait on the owner's hands, neither a
question: the priority order of the SS Umas (D44), which the story session uses for the opening three, and a one-line
yes for the bucket when F56 is written (RM60).

## Calls

| Id | Call |
|---|---|
| RM1 | The farm's Umas are only the authored cast: the 20 SS now, S and A in later waves; the random pool, the start's picks, the Gate's visitors and every random recruit go |
| RM2 | One outfit per character: her sprite set's, else her best-ranked on the board, named in the cast file; her face, talents and temperament read it |
| RM3 | The roster, bonds, work and love are keyed by character id; her outfit is a lookup; a character missing from master data shows a disc and D talents |
| RM4 | Arrivals are authored: the opening three, chapters 1–7, five festival days, Dorm levels 4–8; each with an arrival scene (+50 and a choice); no bed means away |
| RM5 | The Dorm for 20: eight levels, 3/5/7/9/11/14/17/20 beds, CS34's prices (190,000g); levels 4–8 bring arrivals; 9–10 return with the S wave |
| RM6 | Her favourite line is her bible's favouriteLine (the cast file's calling as fallback, and to place a miner at the Mine or the Quarry): ×1.2 rank points, +10 a night, her perks' place |
| RM7 | Her tastes are her bible's: 1 loved, 3 liked, 2 disliked by goods id, the rest neutral; CS45's family rule and F8's dish-by-stat rule go |
| RM8 | The farmer's name first: 1–16 characters, {farmer} in lines, renamed in Menu; no pronouns, no gender, never drawn |
| RM9 | The opening: the name, "The Overgrown Farm", the opening three (the owner's priority Umas) walking in with their arrival scenes, chapter 1's card; no picks |
| RM10 | Save v4 is a wipe: v1–v3 parse to a fresh v4, account kept as stored, the v3 backed up on the first v4 write; v4 adds farmer, love, homestead, memories, arrivals; keyed by character |
| RM11 | One track per Uma: F1–F10, the confession, R1–R10, the proposal, the wedding, S1–S5 (26 rungs); a level is its event; S2 and S4 come at night |
| RM12 | Heart n costs 160 + 40n on friendship and romance (3,800 a ladder), 600 a spouse level; the three waiting rungs cost nothing and are Ready the day after |
| RM13 | Points: chat 15, gifts 60/30/10/0 × stars, praise 20, her line 10, festival team 50, evening 60/100/150 ×1.5, invitation +20, house morning 30, arrival +50, event +50 + choices + grade |
| RM14 | No decay; points past a full bar are banked and carry over; points go to her current ladder and bank into the next while a rung waits |
| RM15 | One gift a day each, no weekly cap; loved shown at F1, the rest when given or at F7; the picker shows her points; disliked gives 0 |
| RM16 | Birthdays from master data's character birthday, each month four farm days by quarters (Mar–May Spring …); gifts ×3 and an evening ×1.5 on the day |
| RM17 | Anniversaries: each year on her wedding's day, 2× points with her, a ★5 item of her line, an evening ×1.5 |
| RM18 | Affinity becomes love: the rank-point factor is ×1.05 from F5 and ×1.10 from F10 on (D35 e amended); falls, STAY_AFFINITY and hearts-by-hundreds go |
| RM19 | One evening a day across all Umas (two every 4th day from 10 married, plus festival night): hangouts from F2, dates from R1, spouses; any time; 30–60 s, graded, never failed |
| RM20 | Morning invitations: at most one a morning (two from 10 married), her favourite kind, seeded among the least-seen; yes +20, declining costs nothing |
| RM21 | Each Uma plays at most one of her events a day; no cap across Umas; Ready events wait forever and never fire on their own |
| RM22 | End the day opens Tonight: the evening if unspent, where to sleep once married (default the least visited), then a cozy fade to morning |
| RM23 | The night's nine steps gain night chores (2, 3, 4, 5), bonds, her line and spouse levels (6), clearing (7), arrivals and milestones (8), the house's morning and invitations (9) |
| RM24 | Ready: her bar full (or the day after for a waiting rung), she's home, none of hers today, and its one setup met; never a clock, weather, season or festival |
| RM25 | Five plays built now: Cast, Pick, Rhythm, Walk, Choose; 10–30 s in events, 30–60 s as evenings; Fine below 60, Great 60–89, Perfect 90+; never failed |
| RM26 | Every together kind maps to a play; cooking, serving, forging and the footrace use their milestone's game in practice mode later; the fallback is Rhythm with the activity's mark |
| RM27 | Choices: 1–2 points of 2–3 options, the gain on each button (+30 best, +10 others, a taste, an item's cost), a heart on romantic ones; nothing below zero; flags change wording only |
| RM28 | Rewards: +50, the perk, one Memory (place card, bust, caption), any unlock; listed on the level-up card; replays from any choice pay nothing |
| RM29 | The event player is a full-screen sheet on today's map: place card, master data bust with an emote mark, 3-line bubbles, 48pt choices, auto, skip and log; 60–120 s |
| RM30 | Confession (Yes, or Not yet with Ask her any day), proposal (R10 and any ring, always yes) and wedding (place, reception dish, vow line; everyone attends): 3–5 min each; no gendered word for the farmer |
| RM31 | A perk on every level, templates by her favourite line; bespoke only her signature dish (F4), keepsake (F10, S5) and dream (S3) |
| RM32 | Each line's meaning of +10% at her line, a night chore (1 item, or growth, affection, a dish) and a morning item; fractions by seeded draw |
| RM33 | Shared effects: in her element ×1.2 bond factor, mentor +10% rank points at her place, keepsake +0.25/+0.5 quality, dream +5% crew, household +5% and +5% |
| RM34 | Caps: her own +35%, the crew's +15%, any one job +40%; 3 night chores; one morning item a day (+1 in her house); one mentor a place |
| RM35 | A breakfast (S1) is a one-day Rough well fed for the crew when no meal runs; a staff meal replaces it; it never counts as one |
| RM36 | A perk at a place not open yet shows "Opens with chapter n" and works from then |
| RM37 | The evening kinds are D42's ten date games by ladder and by their game; her favourite kind is the one her route uses most; festival night on festival days |
| RM38 | The Forge's ring bench opens the morning after the first Romance 8: a ring of grade g from 3 refined goods of grade g, CS25's recipe from chapter 3; no gold, one a day |
| RM39 | Any ring makes the proposal Ready; married, it adds +1% a grade at her line plus the merge's +0/1/3/5 from M6, to +15%; a better ring any day; no gates |
| RM40 | The Forge's building opens with the bench; chapter 7 brings its merge game and tools; Ida Stone's first scene moves to the bench |
| RM41 | The homestead row: the Farmhouse (2 rooms) and six houses of 2 rooms, 4 extended, 8,000 → 160,000g (408,000g, 612,000g extended), 26 rooms, opening at the first wedding |
| RM42 | At her wedding she takes a free room (default her closest tie's house) or keeps her Dorm bed; move spouses any morning; a shared house +10 bond a night |
| RM43 | The night's house's morning: +30 each resident, her breakfast, her morning item, a house line; a house unvisited 8 nights invites warmly; never a penalty |
| RM44 | Her own house and her birthday alone (W15) are honoured from her bible's wishes, softly, with nothing lost while she waits |
| RM45 | Household milestones: 1 the homestead; 5 scene 1, furniture, +5% crew; 10 scene 2, two evenings every 4th day; 15 scene 3, +5% more; 20 the finale; "Married n/20" always shown |
| RM46 | The finale, the Great Harvest, the morning after the 20th wedding: every spouse has her moment; the game goes on, with a yearly Festival of Vows |
| RM47 | Later waves count as "Married n/N"; the finale plays once; each wave adds its own household scene and its lots |
| RM48 | Bonds move into the romance core: CS44's points and hearts, ×1.1 at 3, duo moves at 5, +10 a night for a shared house |
| RM49 | The 31 ties seed bonds (strength 3 → 2 hearts, 2 → 1, 1 → 0); her closest friend is her strongest tie; R4 gives that bond ×1.5 |
| RM50 | A bond heart opens an authored conversation for a tie's pair, CS46's templates (M6) for the rest; the morning lists them with Read |
| RM51 | The bottom bar is Farm · Hearts · End the day · Diary · Menu; Hearts replaces Roster, whose album becomes its Work view |
| RM52 | The Hearts tab: a 72pt row per Uma with her stage, bar, banked points and chips; Ready first; filters Ready, Friends, Partners, Married, Away |
| RM53 | Her profile: the route as one track, the Next card, perks, gifts, ties, Memories, Chat · Gift · Evening and Praise, and the Work view |
| RM54 | Event playback starts from her row, her Next card or the morning, and says what a setup needs |
| RM55 | The level-up card closes every event; the stage-up screen closes the confession, proposal and wedding, re-colouring the track |
| RM56 | Memories: an album per Uma (and a Diary shelf); replay from any choice, no points |
| RM57 | The morning's §4 becomes Hearts: Ready lines, the invitation, the house's morning, birthdays, overnight levels, bond hearts; no pop-ups |
| RM58 | The story ships as a private pack: gs://uma-farm-content and farm-api's PrivatePackModule at /api/story, hash-named files cached by the web; the save keeps ids only; seven format additions |
| RM59 | The romance core is built dark (VITE_FARM_ROMANCE) on a stand-in pack in git; local dev may read the private pack; production turns on with F56 |
| RM60 | F56 delivers: the bucket and its IAM (the owner's yes), pnpm story:publish, the route, the loader, the go-live with the wipe; all within the free tier, $0 |
| RM61 | Character art's slots: a bust, eight expressions, three illustrations an Uma and the finale's, private in the pack, ChatGPT's, priority Umas first |
| RM62 | Until then master data's art, an emote mark and the place card stand in; pixel pieces (houses, bench, Hearts marks, plays) are Claude's F55 |
| RM63 | The sim: five years, 30 runs each of none, light, typical and focused players on the authored roster with this spec's numbers; its tables |
| RM64 | The verdict: the research's pace holds (typical first wedding day 84, all 20 day 158); romance adds +4% in year 1, +8% in year 2, about +40% once all are married |
| RM65 | The amended calls in core-loop, core-spec and M5's and M6's packets, one line each |
| RM66 | The order: the romance core (dark), then the private delivery and go-live with the wipe, then M5 revised (v5–v8), then M6 and M7 |
| RM67 | The romance core is eleven packets, F46–F56 |
