# Hearts: the authored cast and the romance

> **Romance build; live from F56.** The romance core is built dark behind `VITE_FARM_ROMANCE=1` (the dev server and the
> size-checked `romance` build) on **save v4** and the invented **stand-in pack**. Production keeps playing M4 on save v3
> ([roster.md](roster.md), [goals.md](goals.md)) until F56 ships the private story and the wipe together. Each romance
> packet adds its section here.

**Built from F46.** The farm's Umas are only the **authored cast**: each one character, keyed by her **character id**,
playing one outfit, who **walks in when the story says**. You name the farmer, the opening brings the owner's three
priority Umas, and each Uma's **arrival scene** pays the first points into her route. The rules are in `@farm/domain`
(`save/v4.ts`, `save/parse-v4.ts`, `story/pack.ts`, `story/stand-in.ts`, `story/opening-v4.ts`, `romance/farmer.ts`,
`romance/arrivals.ts`, `romance/love.ts`, night step 8 in `night/end-day.ts`); the screens in `apps/web/src/`
(`loop/NameSheet.tsx`, `loop/ScenePlayer.tsx`, `loop/GatePeek.tsx`, `loop/DormPage.tsx`, `home/AccountView.tsx`, and
`story/` for the pack). The spec is [romance-spec.md](../design/romance-spec.md) RM1–RM10, RM58 and RM59; the calls are
F46's (D51).

**Built from F47.** Each Uma's route is **one track**: Friendship 1–10, her confession, Romance 1–10, the proposal, the
wedding and Spouse 1–5. **A level is its event:** her bar fills from chats, gifts by her own tastes, praise and a day at
her line, her next event turns **Ready**, and the level comes when it plays (F49). Points never fall; past a full bar
they're **banked**. Birthdays triple a gift; anniversaries double the day. The rules are in `romance/love.ts` (the
ladders, `bar`, `advance`, `addLove`), `romance/acts.ts` (chats, gifts, praise, her line, festivals), `romance/praise.ts`,
`romance/days.ts` (birthdays, anniversaries, `lineGood`), `romance/ready.ts` (`readiness`) and `farm/bonds.ts`; her sheet
is `loop/Love.tsx`. The spec is RM11–RM18, RM23 and RM24; the calls are F47's (D52).

**Built from F48.** **Hearts** is the Umas' tab in place of Roster: a row an Uma with her stage, her ladder's hearts and
what's Ready, filters for where each stands, and **her profile** with the whole route as one track and the next rung
spelled out; the roster's album is the tab's **Work** view. The morning's **Hearts** section is in RM57's order, and a
Ready Uma's pip on the map carries **♥**: the morning, her Ready chip and her pip are the romance's only signals. The
perks' words are `romance/perks.ts`; the screens `loop/HeartsPage.tsx`, `loop/HeartProfile.tsx`, `loop/hearts-view.ts`,
`loop/HeartMarks.tsx`, `loop/RosterAlbum.tsx` and `loop/Love.tsx` (the acts). The spec is RM31's words, RM51–RM53 and
RM57; the calls are F48's (D53).

```
 a fresh v4 farm (or any v1–v3, wiped)
   │
   ▼
 "What should they call you?" ──► the farmer's name (the first stamp)
   │
   ▼
 "The Overgrown Farm", re-cut: the Mayor greets you by name … "Three Umas come up the road."
   │   read or skipped: the cast's opening three join, home, at Friendship 0
   ▼
 her arrival scene × 3, in order: a farmer, a forager, a fisher
   │   each: +50, and her one choice (+30 the best, +10 the rest), shown on the button
   ▼
 chapter 1's card ──► Plant the carrots
   …
 each night, step 8: the Dorm settles ──► arriveUmas (festivals, Dorm levels, events) ──► checkGoals (chapter n's arrival)
   │   the morning's Hearts: "Stand-in 4 arrived · away"
   ▼
 her arrival scene plays once the summary is put away
```

## The cast and the pack (RM1–RM3, RM58, RM59)

- **Only the cast.** No 272-outfit pool, no start picks and no redraw, no Gate visitors, no chapter recruit drawn for
  the weakest activity: on v4 none of `startSheet`, `gateNight` or `recruitFor` runs. The live M4 build keeps them until
  F56 deletes them.
- **Keyed by character id** (RM3): `roster`, `love`, `dorm.home`, `work` (uma-work's `outfitId` field holds the key, an
  opaque id), `bonds` (`pairKey` of character ids, numeric order), `today`, `memories` and `arrivals`.
- **One outfit each** (RM2): the cast file's `outfitId`, required. Her face, bust, talents and temperament read that
  outfit; her name is her character's. Talents aren't saved, so a changed `outfitId` shows on the next boot.
- **One resolver**, `outfitOf(id)`: the pack's cast on v4, identity on v3. The web sees master data through it (each
  cast Uma's character id gets her outfit's album row and stats), and the album's art reads through it, so faces, busts,
  names, talents, temperaments and pickers need nothing else.
- **A character master data doesn't hold** (the stand-ins, or one a release drops) shows a **lettered disc** ("S1" for
  Stand-in 1, coloured by her id) and reads **D** talents.
- **The pack at runtime** (`StoryPack`): the cast, the ties, her bible by character id, and which events each route
  scripts; the scripts load on demand (`route(id)`). The game checks it with F40's validator as it loads, routes in the
  **partial** mode (an unscripted beat waits: "still being written"); the story sandbox keeps the strict report.
- **One loader seam** (`apps/web/src/story/load.ts`, `loadStoryPack()`): the stand-in now; F56 points it at the private
  pack. The romance build's boot waits for it, as the loop waits for master data.

The stand-in pack in git (`packages/domain/src/story/stand-in/`, the private pack's layout), invented and original:

<!-- live:stand-in -->
| Character | Outfit | Calling | Favourite line | Arrives | Bible | Scripted |
|---|---|---|---|---|---|---|
| 9000001 | 900000101 | farming | farming | opening | Yes | 27 of 27 |
| 9000002 | 900000201 | foraging | foraging | opening | No (her calling stands in) | 1 of 27 |
| 9000003 | 900000301 | fishing | fishing | opening | No (her calling stands in) | 1 of 27 |
<!-- /live -->

The format's 27 rungs start with `arrival` (her arrival scene, "event zero": hearts 0, a hearts trigger, exactly one
choice point and no play), then friendship 1–10, the confession, romance 1–10, the proposal, the wedding and spouse 1, 3
and 5. Tests build larger invented casts (9000004 on) for chapter, festival, Dorm and event arrivals.

## The farmer's name (RM8)

The first screen on a fresh v4 farm, covering everything until it's entered: **"What should they call you?"**, one field
and **Continue**, which stays off until the name fits; the words under the field say why ("Letters, spaces, ' and -
only"). Entering it is the fresh farm's first player change, stamped once. **Menu → Account → Your name** renames it
under the same rule (a player's change).

<!-- live:farmer-name -->
| Rule | Detail |
|---|---|
| Characters | Letters of any script (with their accents), spaces, apostrophes (' and ’) and hyphens |
| Length | 1–16 characters, after trimming and collapsing inner runs of spaces |
| Default | None: an empty field with a grey “Farmer” |
| Where it shows | `{farmer}` in every line, filled when the line shows; the save holds the name, never story text |
<!-- /live -->

No pronouns and no gender are asked, and the farmer is never drawn (RS2): lines say "you".

## The opening (RM9)

On day 1, in order: (1) the name; (2) **"The Overgrown Farm"**, re-cut: the Mayor at the gate welcomes you by name once,
Old Ben's nine Carrot seeds and the tended row, Marta's shop and the bin, ending as three Umas come up the road; (3)
**reading or skipping it brings the opening three** (the cast file's `opening`: a farmer, a forager and a fisher, the
owner's priority Umas), home at Friendship 0, a player's change; (4) each one's **arrival scene**, in that order; the
third ends on **chapter 1's card** and **Plant the carrots**. No hello lines, no picks.

<!-- live:opening-v4 -->
| # | Who | Line |
|---|---|---|
| 1 | (narration) | Morning at the farm gate. The weeds stand as high as the fence. |
| 2 | Mayor Hollis Pryor | “Welcome, {farmer}! I’m Hollis Pryor, mayor of the town down the road.” |
| 3 | Mayor Hollis Pryor | “This farm has stood empty since Old Ben retired. The whole town hopes you can wake it up.” |
| 4 | Old Ben Carver | “I kept one block tilled, just in case. Here: nine Carrot seeds to start you off.” |
| 5 | Old Ben Carver | “A tended row grows faster. Tap a plot, then pick who tends it.” |
| 6 | Marta Quill | “Marta Quill, from the general store at the town edge. The shop is open whenever you need seeds.” |
| 7 | Marta Quill | “And that’s the shipping bin. Anything you put in pays tonight.” |
| 8 | Mayor Hollis Pryor | “You’ll want help with all this. I hear some is on its way.” |
| 9 | (narration) | Three Umas come up the road. |
<!-- /live -->

The closing scene ("First Shipment") plays as on v3, its newest hand being **chapter 1's authored arrival** by her name
from master data (nobody when the cast has none); her own arrival scene follows it.

## Arrivals (RM4)

Each Uma's arrival is the cast file's `arrives`. Arrivals are **state checked each night at step 8**, after the Dorm
settles: every cast Uma not on the roster whose arrival holds joins.

<!-- live:arrivals -->
| Arrival | When she arrives | Checked |
|---|---|---|
| `opening` | The opening scene, day 1: read or skipped, it brings the cast file’s opening three, a farmer, a forager and a fisher | The opening scene |
| `chapter` | The night chapter *n* completes, in place of a drawn recruit (chapter 1 now; 2–7 with M5 and M6) | Night step 8, `checkGoals` |
| `festival` | The morning of that festival’s day in its year (year 1 unless the cast names one), built or not | Night step 8, `arriveUmas` |
| `beds` | The morning the Dorm’s level *n* takes effect (levels 4–8) | Night step 8, `arriveUmas` |
| `event` | The morning after another Uma’s named event plays (`<characterId>:<eventId>`, or an event id: anyone’s) | Night step 8, `arriveUmas` |
<!-- /live -->

- **She joins** (`arrive`) home while a bed is free, else **away** on her off-season (CS36 kept; the Dorm's swap
  brings her home), with her route at **Friendship 0, 0 points**. Her chats and gifts (F47) work from that day; her
  events and evenings (F49, F50) need her home.
- **In the cast's order** when several arrive the same night; **once each** (the roster guards it). A trigger already
  passed (a later wave's) holds the next night, so she arrives then.
- **The chapter's arrival** joins inside `completeChapter`, so the Diary's "Umas recruited" counts her the same night.
  Those milestones stop at 20 by themselves: the cast is 20.
- **The Gate** is where she walks in. Its quick look says what brings the next arrivals, never who, up to three, most
  likely first: "Next: chapter 2's end · the Dorm's level 4 · the Fishing Derby"; "Everyone is here" once the whole cast
  is on the farm. The map's blurb reads "Umas arrive here."
- **The morning** names her in §4, **Hearts**: "Stand-in 4 arrived · away" (a tap opens her card); her arrival scene
  plays the next time the farm opens with the summary put away, in arrival order, after any chapter scene due.

## Her arrival scene (RM4, RM13)

A short scripted scene from her route (`arrival`), played full-screen by the scene player: `say` (her bust, or her disc;
the line with `{farmer}` filled; the emote as a word until F49's marks), `narrate`, `thought` (italic), `place` (the
title line: "Stand-in 1 arrives · Gate"), `wait`, `flag` (into `love.flags`, wording only) and its **one choice**.
**Each option shows its gain on the button before the tap.** **Skip** jumps to the choice, never past it, so every
arrival pays. A choice's `then` plays after it.

<!-- live:arrival-pay -->
| Her arrival scene | Points into her bar |
|---|---|
| Played or skipped to its end | +50 |
| Its choice: the option with the highest authored gain (each one tied at the top) | +30 |
| Its choice: any other option | +10 |
<!-- /live -->

It pays once (her id goes into `arrivals`) and stamps once. A route that doesn't script her arrival yet plays a short
stand-in scene with the same choice and pay. Its points go into her Friendship 1 bar through `addLove`, as every act's do.

## Her favourite line and tastes (RM6, RM7)

- **Her favourite line** is her bible's `favouriteLine`, else her cast entry's `calling` (`quarry` is mining, at the
  Quarry): never master data's strategy. It sets ×1.2 rank points in that activity (CS33 kept, read from the pack at
  night step 6), the mark on her face card and **+10 a night at her line** (F47, [below](#her-line-rm6-rm13)); F51 adds
  her perks there.
- **Her line's places:** farming the Fields; foraging the forest and the Sawmill; fishing the Fishery and the
  Smokehouse; mining the Mine and the Smelter, or the Quarry and the Cutter when her calling is `quarry`; ranch the Coop
  and the Barn; cooking, serving and forging the Kitchen, the Restaurant and the Forge.
- **Her tastes** are her bible's: one loved, three liked and two disliked by goods id; everything else neutral, and a
  proposed good neutral until it's in `goods/ids.ts` (`tasteOf`, for F47's gifts).
- **Her tastes show** as RM15 says: her loved good from Friendship 1, a good's taste once you've given it (`love.known`),
  every taste from Friendship 7 ([gifts](#gifts-rm15-rm16)).

## Her route (RM11, RM12, RM14)

**Romance build; live from F56** (F47 decisions 2 and 3). One track per Uma, 26 rungs with an event, and the spouse
levels S2 and S4, which have none and come at night when their bar fills (F54):

```
 F1 F2 F3 F4 F5 F6 F7 F8 F9 F10   ◆    R1 R2 … R8 R9 R10   ◇      ◇       S1  S2  S3  S4  S5
 ─────── friendship ─────────  confession ── romance ─────  proposal wedding ──── spouse ─────
 200 240 280 … 560 (3,800)        0     200 … 560 (3,800)     0       0      600 600 600 600 600
 an event at every level          an event                   events: ring   events at S1, S3, S5
```

<!-- live:route-costs -->
| Heart | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Ladder |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Friendship or romance** | 200 | 240 | 280 | 320 | 360 | 400 | 440 | 480 | 520 | 560 | **3,800** |
| Cumulative | 200 | 440 | 720 | 1,040 | 1,400 | 1,800 | 2,240 | 2,720 | 3,240 | 3,800 |  |
| **Spouse** | 600 | 600 | 600 | 600 | 600 |  |  |  |  |  | **3,000** |
| **A route**: the three waiting rungs cost 0 |  |  |  |  |  |  |  |  |  |  | **10,600** |
<!-- /live -->

- **A level is its event** (the Persona rule): her bar fills, her event becomes Ready, and the level comes when it plays.
  `advance(love, day)` is the one move, called by F49 when an event plays and by F54 for S2 and S4 at night: the cost
  leaves her points, the rest stays banked, and `last` is the day. **F10** leaves her at her confession (level 10); her
  confession accepted starts romance at 0; **R10** leaves her at the proposal, the proposal at the wedding, and the
  wedding makes her a spouse at 0 (`wed` is the day); **S5** completes the route.
- **The waiting rungs cost nothing:** the confession, the proposal and the wedding are each Ready the day after the rung
  before (the proposal also needs a ring).
- **Points never fall, and nothing is lost or locked** (RM14). Past a full bar they're **banked** ("+120 banked") and
  carry into the next bar when the event plays. While a waiting rung waits, every point banks into the next ladder.
- **Points are whole:** each pay rounds once, half up, after its factors. Once S5 has played nothing more is added.
- **Her level in words** (`levelWords`): "New friend" at F0, "Friend · F7", "Friend · F10" while her confession waits,
  "Close friend" after a "Not yet", "Partner" at R0, "Partner · R4", "Partner · R10", "Engaged" while the wedding waits,
  "Spouse", "Spouse · S2". **The bar's colour carries the ladder:**

<!-- live:ladder-colours -->
| Ladder | Stages | Bar |
|---|---|---|
| Friendship | F0–F10, and her confession while it waits | coral `#f07a5c` |
| Romance | R0–R10, the proposal and the wedding while they wait | rose `#e0567a` |
| Spouse | S0–S5 (600 a level) | gold `#d9a227` |
<!-- /live -->

- **The save** (v4, grown in place): `love.level` is 0–9 on friendship and romance, 10 while a waiting rung waits, 0–5
  as a spouse; `love.points` whole; `love.festivals` the festivals she's been at with you (`<festival>:<year>`), each
  strictly parsed.

## Points (RM13, RM15, RM18)

**Romance build; live from F56** (F47 decisions 3–9). Every number shows on screen before or as it's earned: the button
says it ("Chat +15", "Praise +20", each gift's points in the picker) and a **"+N" floats from her face**. `addLove` is
the one way points move; it applies the day's factors and says what it paid.

<!-- live:love-points -->
| Act | Points | Limit | Paid by |
|---|---|---|---|
| Chat (tap her) | +15 | Once a day each, home or away | `chatV4` |
| Gift (one good, its stars your choice) | Loved +60, Liked +30, Neutral +10, Disliked 0; × (1 + 0.1 a star above ★1) | One a day each; ×3 on her birthday | `giftV4` |
| Praise (a ★3+ day’s work, a rank-up, a Fine play) | +20 | Once a day, when earned | `praiseV4` |
| Her line (she worked it today) | +10 | Paid at night, step 6 | `payLines` |
| A festival together (its team or entry) | +50 | Once a festival a year each | `festivalTogether` (F39, F32 call it) |
| Her arrival scene | +50, and its choice (+10 or +30) | Once | `finishArrival` (F46) |
| A heart event | +50, its choices and its play’s grade | One of hers a day | F49 |
| The evening · an invitation said yes · a house morning | F50 · F50 · F54 |  |  |
| **On her anniversary** | ×2 on every act but the evening (×1.5 instead, F50) | From year 2 of her marriage | `addLove` |
<!-- /live -->

- **The day's factors multiply once each** (decision 7): a gift **×3 on her birthday**; on her **anniversary every act
  ×2** except the evening, which takes its own ×1.5 instead (F50).

### Chats (RM18)

**Chat** (tap her) pays +15 once a day, home or away (`chatV4`; refused "You've talked today."). Her line for the day
(`chatLineV4`, drawn by `draw(uid, day, 'chat:<id>', 0)`, the same all day): before Friendship 1, her temperament's
`CHAT_LINES` (v3's, kept as the fallback); **from Friendship 1, her own authored set** for her stage (her bible's
`chats`: `friend` through the confession, `partner` from Romance 1 to the wedding, `spouse` after it). A bible without
`chats` keeps the temperament lines. `{farmer}` and `{name}` are filled when the line shows.

### Gifts (RM15, RM16)

**Gift** takes one good from the Warehouse at the stars you choose, once a day each, home or away (`giftV4`; "One gift a
day."; seeds: "That isn't a gift."). Her taste is her bible's (`tasteOf`: one loved, three liked, two disliked, the rest
neutral; no bible, all neutral). **Stars multiply:**

<!-- live:gift-stars -->
| Her taste | ★1 | ★2 | ★3 | ★4 | ★5 |
|---|---|---|---|---|---|
| Loved | 60 | 66 | 72 | 78 | 84 |
| Liked | 30 | 33 | 36 | 39 | 42 |
| Neutral | 10 | 11 | 12 | 13 | 14 |
| Disliked | 0 | 0 | 0 | 0 | 0 |
| Loved, on her birthday (×3) | 180 | 198 | 216 | 234 | 252 |
| Liked, on her birthday (×3) | 90 | 99 | 108 | 117 | 126 |
| Neutral, on her birthday (×3) | 30 | 33 | 36 | 39 | 42 |

A disliked gift pays 0 and she says one line: “She thanks you, a little puzzled.”
<!-- /live -->

- **Her tastes show** (`tasteKnown`): her **loved** good from Friendship 1; any good's taste **once you've given it**
  (learnt into `love.known`); **every taste from Friendship 7**. The last two are derived, never stored.
- **The picker** lists the Warehouse by family, each good at each star held, with **its points for her today** at those
  stars (`giftPreview`: the birthday's ×3 and the anniversary's ×2 included) or **"?"** where her taste for it isn't known.

### Praise (RM13)

She **earns praise** for the day (`today.praise`, `earnPraise`) when (a) her work that finished overnight made a ★3+
item, or (c) she ranked up last night (both at night step 9, `praiseOvernight`); (b) a harvest today from the block she
tends gave a ★3+ crop (`harvest`); or (d) she assisted a Fine-or-better workshop play today (M5's packets call it).
**Praise +20** shows on her sheet only while earned and unpaid (`canPraise`), pays once (`praiseV4`, `today.praised`),
and both lists clear at night step 7.

### Her line (RM6, RM13)

Night step 6 (`payLine`, `payLines`): **+10** to each Uma who worked today at one of her line's places (`linePlaces`): a
running job there, or for a farmer a tended block with a growing plot. One a night each; nothing for a day elsewhere (a
farmer at the Mill earns nothing, as the Mill isn't the Fields).

### A festival together

`festivalTogether(save, ids, festival, year)` pays **+50** to each Uma on a festival's team or entry, once a festival a
year each (`love.festivals`). Nothing calls it yet: F39 (M5) and F32 (M6) give festivals their teams and entries.

## Birthdays and anniversaries (RM16, RM17)

**Romance build; live from F56** (F47 decisions 10 and 11).

**Her birthday** is master data's character set (`birthday: { month, day }`, read at runtime into `MasterView.birthdays`,
never in git); the cast file's optional `birthday` wins where present (the stand-in cast gives 9000001 an invented one,
28 March: Spring 4). A real date maps onto the 48-day year by quarters of its month (`farmBirthday`):
`season day = 4 × (the month's place in its season, 0–2) + ⌈min(day, 31) ÷ 8⌉`, held to 1–4.

<!-- live:birthday-map -->
| Month | Days 1–8 | 9–16 | 17–24 | 25–31 |
|---|---|---|---|---|
| March | Spring 1 | Spring 2 | Spring 3 | Spring 4 |
| April | Spring 5 | Spring 6 | Spring 7 | Spring 8 |
| May | Spring 9 | Spring 10 | Spring 11 | Spring 12 |
| June | Summer 1 | Summer 2 | Summer 3 | Summer 4 |
| July | Summer 5 | Summer 6 | Summer 7 | Summer 8 |
| August | Summer 9 | Summer 10 | Summer 11 | Summer 12 |
| September | Autumn 1 | Autumn 2 | Autumn 3 | Autumn 4 |
| October | Autumn 5 | Autumn 6 | Autumn 7 | Autumn 8 |
| November | Autumn 9 | Autumn 10 | Autumn 11 | Autumn 12 |
| December | Winter 1 | Winter 2 | Winter 3 | Winter 4 |
| January | Winter 5 | Winter 6 | Winter 7 | Winter 8 |
| February | Winter 9 | Winter 10 | Winter 11 | Winter 12 |
<!-- /live -->

On her birthday a **gift pays ×3** (and an evening ×1.5, F50); the morning says so **the day before and on the day**. Two
Umas may share a day; a birthday on a festival day is both.

**Her anniversary** is her wedding's day of the year, **from year 2 of her marriage** (`isAnniversary`: the days
`wed + 48k`, k ≥ 1). That day **every act pays ×2** (the evening ×1.5 instead), and that morning **she leaves a ★5 item
of her line** in the Warehouse (`lineGood`, a seeded draw: a crop of the season for a farmer, a good of her foraging
rank's deepest area this season for a forager, a fish of her deepest spot for a fisher; her line's own once M5 and M6
open mining, the ranch and the workshops, and **a ★5 crop of the season whenever her line's place isn't open**, so an
anniversary is never empty). The morning says so the day before and on the day.

## Ready (RM24)

**Romance build; live from F56** (F47 decisions 1 and 13). `readiness(save, pack, id)` says whether her next event can
play today: `{ rung, ready, waits }`. All four:

<!-- live:ready-rules -->
| # | Ready needs | Not met |
|---|---|---|
| 1 | Her bar is full for the rung; a waiting rung (the confession, the proposal, the wedding) is Ready the day after the rung before, and the proposal needs a ring in the Warehouse | `bar`, `day`, `ring` |
| 2 | She’s home (on the Dorm’s list; F54 adds the houses) | `away`: “Swap her home” |
| 3 | She hasn’t played one of her events today (RM21) | `today` |
| 4 | Its one setup is met, if it has one: she works a named activity today (a running job there, or a tended growing block for farming), a named good is in the Warehouse at any stars, her bond with a named Uma has reached a level, a chapter has been reached | `setup`; `opens` for a chapter, or for the ranch, mining, cooking, expeditions, serving or forging before their chapters (2, 3, 4, 5, 6, 7) |
<!-- /live -->

**Never an hour, the weather, a season or a festival.** What isn't met is the first of these, in order:

<!-- live:ready-waits -->
| Order | `waits` | When |
|---|---|---|
| 1 | `done` | Her route is complete (S5 has played) |
| 2 | `night` | S2 or S4, bar full: no event, the level comes at night (F54); short of it, `bar` |
| 3 | `unwritten` | The pack doesn’t script the event yet: “Her story is still being written” |
| 4 | `friend` | She said “Not yet” at her confession: you ask her again from her profile (F49) |
| 5 | `opens` | A chapter setup not reached, or a working setup at a place before its chapter |
| 6 | `bar` | Her bar isn’t full for the rung |
| 7 | `day` | A waiting rung, on the day the rung before played |
| 8 | `ring` | The proposal, with no ring in the Warehouse |
| 9 | `away` | She’s away on her off-season |
| 10 | `today` | She played one of her events today |
| 11 | `setup` | Its day setup isn’t met today |
<!-- /live -->

A setup is her bible's beat's `trigger` for the rung (none without a bible). Bond hearts are CS44's (`bondHearts`: 50,
150, 300, 500 and 750 points). The proposal's ring is any `ring-g1`…`ring-g10` in the Warehouse (F53's goods). Ready
lines aren't stored in the morning: Ready changes by day, so F48 reads them live.

## The Hearts tab (RM51, RM52)

**Romance build; live from F56** (F48 decisions 2–5 and 8). The bottom bar reads **Farm · Hearts · End the day · Diary ·
Menu**: Hearts (uma-kit's heart, **no badge**) replaces Roster. The M4 build keeps Roster.

| Route | Shows |
|---|---|
| `/hearts` | The Hearts view (the default) |
| `/hearts?view=work` | The Work view: the roster's album, F21's and F23's whole ([ranks.md](ranks.md#the-screens-decision-7)) |
| `/hearts?filter=ready` | The Hearts view on a filter (`ready`, `friends`, `partners`, `married`, `away`) |
| `?uma=<characterId>` on either | Her profile, on the side the view names |
| `/roster` | Lands on `/hearts?view=work`, her `?uma=` kept |

```
┌──────────────────────────────────────────┐
│ Hearts  Married 0/3                  (i) │
│ [ Hearts ]  Work                         │
│ [Ready 1] [Friends 3] [Partners] [Married] [Away]
├──────────────────────────────────────────┤
│ (face) Stand-in 1                ● Ready │
│        New friend ♥ ▣□□□□□□□□□  200/200  │  the ladder's hearts, the next filling
│        Ready · Friendship 1 · the Fields · +2 banked   ✓chat
├──────────────────────────────────────────┤
│ (face) Stand-in 3                        │
│        New friend ♥ ▣□□□□□□□□□   80/200  │
│        Her story is still being written  │
└──────────────────────────────────────────┘
```

- **A row an Uma** on the roster, home or away, 72 pt: her face (master data), her name and chips (**● Ready** in her
  stage's colour, **✉** an invitation from F50, **Away**); her level in words, the **filling heart** and **her ladder's
  hearts as a bar** (ten for friendship and romance, five as a spouse: the levels played full, the next filling by points
  over its cost, the rest empty) with "points/cost"; then **the most useful line**, "+N banked" (a narrow row cuts it
  first) and today's **✓chat** and **✓gift**. A waiting rung shows all ten hearts and its mark, **◆** her confession or **◇** the proposal and the
  wedding, with "Tomorrow" or "Ready".
- **The most useful line:** Ready, her rung and where it plays ("Ready · Romance 5 · the Pond at night"); away, "Swap her
  home to play her events"; her bar short, nothing more (the bar says it); else what her next event waits for, in F47's
  words ("Friendship 3 · the Fields, when she works there", "Her story is still being written"). F54 adds her house.
- **The sort:** Ready first, then **the least progress** (her next rung's place on the route, then her points), then the
  cast's order.
- **The filters,** one at a time, each with its count: **Ready**; **Friends** (friendship, and her confession's wait);
  **Partners** (romance, the proposal's and the wedding's waits); **Married** (spouse); **Away**.
- **The header:** "Married n/N", N the cast's size (20 on the real pack, 3 on the stand-in; RM47's later waves raise it).
  F50 adds the evening's ○/●.
- **The (i)** holds five lines: points and bars, Ready, one event a day, gifts and tastes, and her route's stages (F50 puts
  the evening's line in the last place).
- **The Work view** is the roster's album moved whole: the same cards, filters and sorts, with **her level in words**
  ("F7", "R4", "S2") in each face's corner in place of v3's hearts. A card opens her profile on its Work side.
- **Hearts | Work** sits under the title, beside the (i): the page's foot is under End the day's raised disc. It's one
  switch with her profile's: the view rides in the URL.

## Her profile (RM53)

**Romance build; live from F56** (F48 decisions 6, 7 and 11). A sheet over the tab at `?uma=<characterId>`, opened from a
row, a card in the Work view, the morning's lines and the Dorm's list. Each section shows only what exists; nothing says
"Soon".

```
┌──────────────────────────────────────────┐
│ Stand-in 1                             ✕ │
│ (face) New friend  ● Ready               │  the "+N" floats up from her face
│        Farming · ★ Spring 4              │  her line, birthday and house
│ ▣□□□□□□□□□◇□□□□□□□□□□◇◇□□□□□             │  the route as one track
│ ┌ Next: Friendship 1 ────────────────────┐│
│ │ Perk · Her loved gift shown; her own chats
│ │ Event · The Fields, while she works them.
│ │ ████████████████████  200 / 200  +2 banked
│ │ Ready                                  ││
│ └────────────────────────────────────────┘│
│ Perks   Next · F1 · …     All 25 perks   │
│ Gifts   Loved ? +60 · Liked ??? +30 · Disliked ?? 0 · Others +10
│ Ties    Stand-in 2 · Friends ♥♥ · Stand-in 3 · Rivals
│ Memories 0 of 26                         │
├──────────────────────────────────────────┤
│ [ Chat +15 ] [ Gift ] [ Praise +20 ]     │  48 pt, in the thumb zone
│ [ Hearts ]  Work                         │
└──────────────────────────────────────────┘
```

- **Her face, her level in words** in her stage's colour and her **● Ready** chip; under them her favourite line, her
  birthday as a farm day ("★ Spring 4") and her house once she has one (F54).
- **The route as one track:** F1–F10, ◆, R1–R10, ◇, ◇, S1–S5 (28 steps with S2 and S4), the played ones filled in their
  ladder's colour (coral, rose, gold), the next filling by her bar, the rest empty; a waiting rung is a diamond. It wraps
  to two rows of 14 under 375 pt.
- **The Next card:** "Next: Romance 5"; its **perk** in her line's words (and "Opens with chapter 3" where her line's
  place waits); **the event's place and setup**, her bible's `hint` for the rung (D43); the bar with "points / cost" and
  "+N banked"; and what it waits for: "Ready", "123 to go", "Tomorrow", "Needs a ring", "Swap her home" (a link to the
  Dorm), "Tomorrow: one event a day", "The Fields, when she works there", "With Carrot in the Warehouse", "Bond 3 with
  Stand-in 2", "Opens with chapter 3", "Her story is still being written", "She said “Not yet”", "Comes tonight". Once
  her route is complete: "Her route is complete". F49 adds **Play ›**.
- **Perks:** the reached ones by ladder ("F1–F10 ✓ · R1–R4 ✓"), the next, and **All 25 perks** on a tap (reached ✓, the
  next in bold, the rest greyed). F51 makes each do what it says and adds what it does now.
- **Gifts:** her loved, liked and disliked goods as learnt (RM15: her loved from Friendship 1, any once given, all from
  Friendship 7; "?" until then), each group's points at ★1, and "Others +10". An Uma without a bible: "Any gift +10".
- **Ties:** her ties from the pack, strongest first (then the most bond points, then the ties' order: her closest friend
  first), each with the other Uma's face, its kind ("Friends", "Rivals", "Mentor", "Teammates", "Sisters", "Close") and
  **bond hearts** (CS44's, from `save.bonds`); a tie whose Uma isn't on the farm yet says "Not here yet". F52 makes the
  hearts move and adds **Read**.
- **Memories:** her count, "15 of 26" (F49 adds the album and replay); her **ring** once given ("+6% at her line", F53).
- **The actions,** 48 pt in the sheet's foot: **Chat +15** (then her line for the day), **Gift** (the picker with each
  good's points for her today or "?"), and **Praise +20** while she's earned it; what an act pays floats up from her face
  as "+N" (still, with reduced motion) and a note says it ("She likes it. +36"). F50 adds **Evening ›**.
- **Hearts | Work:** the Work side is F21's sheet: her favourite line, the day she joined, where she is and her nine
  activities with talent, rank, points and the next challenge.
- **The marks are stand-ins** (decision 11): the stage hearts, the bar's segments, the track's diamonds and the Ready,
  banked and invitation marks are CSS shapes and glyphs in the ladders' colours until the packet that pins F55's uma-art
  2.26.0 swaps in its `hearts/*` marks (F54 at the latest).

## The perks' words (RM31, RM32, RM36)

**Romance build; live from F56** (F48 decision 7). A perk on every level, 25 in all, **words and ids only**: her profile
lists them and F49's level-up card names the one an event brings; **F51 makes each do what it says.** They're written
once as templates by her favourite line (`perksFor(line, chapter)`, `perkLineOf`, `romance/perks.ts`); her signature
dish, her keepsake and her dream are named generically until F51 reads them from her bible. A perk at her line's place
says **"Opens with chapter n"** while that place waits for its chapter (RM36: a miner's +10% before chapter 3).

<!-- live:perk-words -->
| Level | Perk id | Words (a forager’s) | At her line’s place |
|---|---|---|---|
| F1 | `tastes-loved` | Her loved gift shown; her own chats |  |
| F2 | `hangouts` | Hangouts in the evening |  |
| F3 | `line-10` | +10% at the forest | Yes: “Opens with chapter n” until it opens |
| F4 | `signature-dish` | Her signature dish’s recipe |  |
| F5 | `rank-105` | ×1.05 rank points |  |
| F6 | `night-chore` | One item from the forest each night | Yes: “Opens with chapter n” until it opens |
| F7 | `tastes-all` | All her tastes shown, and her closest friend’s loved gift |  |
| F8 | `in-element` | In her element: ×1.2 at the forest beside a 3-heart friend | Yes: “Opens with chapter n” until it opens |
| F9 | `mentor` | Mentor: +10% rank points for Umas at the forest | Yes: “Opens with chapter n” until it opens |
| F10 | `keepsake` | Her keepsake; ×1.10 rank points |  |
| R1 | `dates` | Dates; her pet name for you |  |
| R2 | `morning-item` | A ★2+ good from the forest every 4th morning |  |
| R3 | `date-stargazing` | Date: stargazing |  |
| R4 | `closest-bond` | ×1.5 bond with her closest friend |  |
| R5 | `line-20` | +10% more at the forest (+20%) | Yes: “Opens with chapter n” until it opens |
| R6 | `date-dance-boat` | Dates: dance and boat |  |
| R7 | `night-chore-2` | A second night chore | Yes: “Opens with chapter n” until it opens |
| R8 | `engraving` | Her ring’s engraving |  |
| R9 | `date-footrace` | Date: footrace |  |
| R10 | `proposal` | The proposal |  |
| S1 | `breakfast` | Breakfast: the crew starts well fed on a morning in her house |  |
| S2 | `morning-item-2` | A ★3+ good from the forest every 2nd morning, and each morning in her house |  |
| S3 | `dream` | Her dream; +5% for anyone at the forest | Yes: “Opens with chapter n” until it opens |
| S4 | `night-chore-3` | A third night chore | Yes: “Opens with chapter n” until it opens |
| S5 | `vow-renewal` | Vow renewal; her keepsake grows |  |

| Her line | Her place | +10% (F3) | A night chore (F6) | A morning item (R2) | Opens with |
|---|---|---|---|---|---|
| Farming | the Fields | +10% at the Fields | +0.25 growth on a block each night | A ★2+ crop of the season | Day 1 |
| Foraging | the forest | +10% at the forest | One item from the forest each night | A ★2+ good from the forest | Day 1 |
| Fishing | the Fishery | +10% at the Fishery | One fish from the Fishery each night | A ★2+ fish | Day 1 |
| Mining (the Mine) | the Mine | +10% at the Mine | One ore from the Mine each night | A ★2+ ore | Chapter 3 |
| Mining (the Quarry) | the Quarry | +10% at the Quarry | One stone or gem from the Quarry each night | A ★2+ stone or gem | Chapter 3 |
| Ranch | the ranch | +10% at the ranch | +5 affection to her pen each night | A ★2+ egg, milk or fleece | Chapter 2 |
| Cooking | the Kitchen | +10% at the Kitchen | One more dish on the Kitchen’s next play | A ★2+ dish | Chapter 4 |
| Serving | the Restaurant | +10% at the Restaurant | One more cover on the Restaurant’s next shift | A ★2+ dish | Chapter 6 |
| Forging | the Forge | +10% at the Forge | 5% back on the Forge’s next tool | A ★2+ Fitting | Chapter 7 |
<!-- /live -->

## The night and the morning on v4

What a v4 night adds or changes from v3's ([days.md](days.md) lists the rest):

<!-- live:night-v4 -->
| Step | Function | What happens | Filled by |
|---|---|---|---|
| 6 | `tickRanks` | Rank points for every Uma who worked, one activity each, ×1.05 from her Friendship 5 and ×1.10 from Friendship 10; rank-ups where points and the challenge are met | F21, F47 |
| 6 | `payLine` | Her line: +10 to each Uma who worked today at one of her line’s places (a tended block for a farmer), once a night | F47 |
| 7 | `turnCalendar` | The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the whole of `today` clears: chats, gifts, praise earned and paid, events, evenings and invitations | F18, F47 |
| 8 | `arriveUmas` | Every cast Uma whose authored arrival holds joins, in the cast’s order: home while a bed is free, else away | F46 |
| 9 | `heartsMorning` | Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse | F47 |
<!-- /live -->

On v4 `checkGoals`' recruit is the chapter's authored arrival. Step 7 clears v4's whole `today`. The morning's §4 is
**Hearts**, after Ranks, in **RM57's order** (F48 decisions 1 and 9), each line a tap to her profile:

| # | Line | Words | Filled by |
|---|---|---|---|
| 1 | **Ready**, read live from `readiness` as the card shows (never stored): up to three, in the tab's order, then "+N more" (the tab filtered on Ready) | "● Ready · Stand-in 1 · Friendship 1 · the Fields", "+2 more" | F48 |
| 2 | The invitation, with **Yes, tonight / Another day** | — | F50 |
| 3 | The house's morning: breakfast, +30s, items, night chores | — | F54 |
| 4 | `{ kind: 'birthday', id, when }` | "★ Stand-in 1's birthday today", "★ Tomorrow: Stand-in 1's birthday" | F47 |
| 4 | `{ kind: 'anniversary', id, when, item }` | "♥ Stand-in 1's anniversary · ★5 Carrot left for you" (`item` the good; null the day before), "♥ Tomorrow: Stand-in 1's anniversary" | F47 |
| 5 | Levels reached overnight (S2, S4) | — | F54 |
| 5 | `{ kind: 'arrived', id, home }` | "Stand-in 4 arrived · away" | F46 |
| 6 | Bond hearts, with **Read** | — | F52 |

Within a place the night's order holds: today's lines before tomorrow's, birthdays before anniversaries, each Uma in the
cast's order. The section shows whenever a stored line or a Ready Uma is there; an Uma who played an event today isn't
Ready. **There's no pop-up per event:** the morning, her ● Ready chip and **♥ on her pip** wherever the map draws her (a
tender on the Fields, in place of her block's letter; a worker at a place) are the only signals. Pips stay their places'
taps.
The parse refuses an Uma off the roster, a kind twice for one Uma, an anniversary's item the day before (or an unknown
good on the day), and words. §5 drops v3's `joined`, Gate and `left` lines.

## For later packets

- **F49** heart events and Memories (`memories`): the Next card's **Play ›**, her row's ● Ready and the morning's Ready
  line start one, and her confession's **Ask her**; the level-up card names F48's perk words. **F50** the evening and
  invitations (`today.evenings`, `today.invites`): **Evening ›**, the header's ○/● and the row's ✉ (`HeartRow.invited`
  reads `today.invites` already). **F51** the perks' effects over `romance/perks.ts`. **F52** bonds from the ties: the
  profile's Ties (`tieRows`) move with `save.bonds`. **F53** the ring and the wedding. **F54** the homestead (`homestead`,
  `love.house`), her house on the row and the profile, the marks from uma-art 2.26.0.
- **A new §4 line:** add its kind to `HeartLine` (`night/summary.ts`) with its parse, give it RM57's place in
  `HEARTS_ORDER` and its words in `heartLine` (`loop/summary-words.ts`).
- Save v4 grows in place until F56; any change after F56 is v5.
