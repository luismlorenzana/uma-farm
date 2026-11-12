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

**Built from F52.** The Umas' **bonds with each other** grow when two work one place the same day, and five **bond
hearts** come at CS44's thresholds. The 31 authored **ties seed** them when both Umas are on the farm, her **closest
friend** is her strongest tie, Romance 4 grows that bond ×1.5, and at 3 hearts two Umas work **side by side** (+10% of a
night's items, ×1.1 growth). Each new heart opens the pair's **conversation**: an authored one for a tie's pair, read
from the morning, her profile or the Diary. The rules are `farm/bonds.ts` and night steps 2, 4, 6, 8 and 9; the screens
her profile's Ties, `loop/PairPlayer.tsx` and the Diary's `loop/Conversations.tsx`. The spec is RM48–RM50; the calls are
F52's (D54).

**Built from F49.** **A level is its event**, and each one now plays: from her row's **● Ready**, her profile's **Play ›**
or the morning's Ready line, a full-screen **event player** over the map shows the place card with her bust and an
emote bubble, her lines in a bubble, choices with their gain on the button, and one short **play** the farmer and she
do together (**Cast, Pick, Rhythm, Walk** or **Choose**), graded Fine, Great or Perfect and never failed. It ends on the
**level-up card**: +50, the choices and the grade into her next bar, the rung's perk, a **Memory** and any unlock. Her
**confession** ends on Yes (romance opens, with the stage-up screen) or **Not yet**, which costs nothing (**Ask her**,
once a day). **Memories** keep an album an Uma and replay any event from any choice, paying nothing. The rules are
`romance/events.ts` (`playEvent`, `askHer`, the replays) and `romance/plays/` (the five plays at both lengths and RM26's
map); the screens `loop/EventPlayer.tsx`, `loop/PlaySheet.tsx`, `loop/EventCards.tsx`, `loop/Memories.tsx`,
`loop/MemoriesShelf.tsx` and `loop/event-view.ts`. uma-art 2.26.0 is pinned (the emote bubbles, F25's and F55's marks).
The spec is RM24–RM30 and RM54–RM56; the calls are F49's (D55).

**Built from F50.** The day has **one evening**, its one scarce choice: a **hangout** with an Uma at Friendship 2 or
more, a **date** from Romance 1, or any kind with a spouse, played as one of D42's date games at its evening length
(F49's plays) and paid by its grade, **×1.5 in her favourite kind**, her birthday and her anniversary. A second evening
comes every fourth day from 10 married, and **festival night** on each festival day. Each morning **one Uma may invite
you** ("Walk at dusk tonight?"): **Yes, tonight** adds +20 to her evening. End the day opens **Tonight** while an
evening is free, and the night is a **fade** straight to the morning. The rules are `romance/evening.ts` and night step
9's `drawInvitations`; the screens `loop/EveningPlayer.tsx`, `loop/Tonight.tsx`, `loop/InviteAnswer.tsx`,
`loop/evening-view.ts` and `loop/night-fade.ts`, with **Evening ›** in `loop/Love.tsx` and the header's marks in
`loop/HeartsPage.tsx`. The spec is RM19–RM22 and RM37; the calls are F50's (D56).

**Built from F51.** **Every perk acts**, read from her level, never stored: **+10% at her line** from Friendship 3 and
+20% from Romance 5 (with her ring once married, the best dream at a place and the household's +5% and +5%, all held to
**+40%** on any one job), **night chores** (an item from her deepest area or spot, or +0.25 growth on a block),
**morning items** of her line, **in her element** (side by side ×1.2), the **mentor**'s +10% rank points, **her
keepsake**'s +0.25 quality, **her signature dish**'s recipe and **breakfast**. They pay as night extras and seeded items
(uma-work's plans untouched), and her profile says what each does now. The rules are `romance/perk-terms.ts` (the terms
the shared rules read) and `romance/perk-effects.ts` (the night's effects and the bespoke three), with night steps 2, 4,
6 and 9; the screens her profile's Perks, **From her** and Gifts (`loop/hearts-view.ts`, `loop/HeartProfile.tsx`), the
morning's lines and the level-up card's recipe. The spec is RM31–RM36; the calls are F51's (D57).

**Built from F53.** **The ring and the wedding.** The night after the first Romance 8 event anyone plays, Ida Stone comes
up from town and opens the old **Forge as a ring bench**: three refined goods of one grade make a ring of that grade, no
gold, one a day. **Any ring makes the proposal Ready** the day after Romance 10: you pick which, it plays and always
succeeds, and she's **engaged**; her ring's grade is kept (`love.ring`). **The wedding** waits until you play it: you
choose **the place** (one of her three), play it with **every spouse and her two closest friends** as guests and **your
vows**, then **the reception** (a dish in the Warehouse, or Marta's cake), and she's your **spouse**: her ring adds **+1%
a grade** at her line, and a better ring can be given any day. The rings join v4's catalogue (they sell, and form a Diary
row). The rules are `romance/bench.ts`, `romance/wedding.ts`, `playEvent`'s proposal and wedding (`romance/events.ts`),
`story/bench.ts` and night steps 8 and 9; the screens `loop/BenchSheet.tsx`, `loop/BenchScene.tsx`, the event player's
pickers and `loop/EventCards.tsx`'s Engaged and Married, and her profile's **Ring**. The spec is RM30 and RM38–RM40; the
calls are F53's (D58).

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
- **The pack at runtime** (`StoryPack`): the cast, the ties, her bible by character id, which events each route scripts,
  and which bond levels each tie's pair has a conversation at (`pairs`, F52); the scripts and the pairs' conversations
  load on demand (`route(id)`, `pair(a, b)`). The game checks it with F40's validator as it loads, routes and pairs in
  the **partial** mode (an unscripted beat waits: "still being written"; a pair's unwritten level gets the tie's line);
  the story sandbox keeps the strict report. A pair file is `pairs/<a>-<b>.json`, the two ids in numeric order, for a
  tie's pair only, each level 1–5 at most once.
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
the line with `{farmer}` filled; the emote as a word: the emote bubbles load only with the event player), `narrate`, `thought` (italic), `place` (the
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
  night step 6), the mark on her face card and **+10 a night at her line** (F47, [below](#her-line-rm6-rm13)), and her
  perks there (F51, [below](#perks-rm31rm36)).
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
| The evening (a hangout from F2, a date from R1) | Fine +60, Great +100, Perfect +150; ×1.5 in her favourite kind, on her birthday and on her anniversary, each once | One evening a day across all the Umas (RM19’s more below) | `spendEvening` (F50) |
| An invitation said yes | +20 | With her first evening that day | `spendEvening` (F50) |
| A house morning | +30 each resident | The house you slept in | F54 |
| **On her anniversary** | ×2 on every act but the evening (×1.5 instead) | From year 2 of her marriage | `addLove` |
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
│ Hearts  Married 0/3  ☾ Evening ○     (i) │  ○ free, ● spent: a mark a slot today
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

- **A row an Uma** on the roster, home or away, 72 pt: her face (master data), her name and chips (**✉** her invitation
  while it stands: unanswered, or said yes and not yet spent; **Away**), and at its end **● Ready** in her stage's colour, which plays her event (F49; a tap elsewhere opens
  her profile); her level in words, the **filling heart** and **her ladder's
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
  Beside it, **☾ Evening** with a mark a slot today (F50): **○** free, **●** spent, the evenings first, then festival
  night's in its festival's season colour; each mark's name says who it was spent with.
- **The (i)** holds five lines: points and bars, Ready, one event a day, gifts and tastes, and the evening (F50, in her
  route's stages' place): "One evening a day with someone home: a hangout from Friendship 2, a date from Romance 1. Fine
  +60, Great +100, Perfect +150, ×1.5 in her favourite kind, and +20 when she asked you."
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
│ Perks   F1–F10 ✓ · R1 ✓                  │
│         F3  +10% chance of an extra crop │  what each does now (F51)
│         Next · R2 · …     All 25 perks   │
│ From her Calls you “Sprout” · Bent Trowel│  her pet name and keepsake (F51)
│ Gifts   Loved ? +60 · Liked ??? +30 · Disliked ?? 0 · Others +10
│ Ties    Stand-in 2 · Friends ♥♥ · Stand-in 3 · Rivals
│ Memories 0 of 26                         │
│ Ring    Her ring will read: ‘Always the…’│  from Romance 8 (F53)
├──────────────────────────────────────────┤
│ [ Chat +15 ] [ Gift ] [ ☾ Evening › ]    │  48 pt, in the thumb zone
│ [        Praise +20        ]             │  while she's earned it
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
  her route is complete: "Her route is complete". **Play ›** (48 pt, in her ladder's colour) when her event is Ready
  plays it (F49); a setup not met says what to do ("Assign her to the Fishery, then come back."); after a "Not yet",
  **Ask her ›** (once a day; "You asked her today. Ask again tomorrow." once asked).
- **Perks:** the reached ones by ladder ("F1–F10 ✓ · R1–R4 ✓"), **what the reached ones do now** (F51, [below](#on-screen-decision-12)),
  the next, and **All 25 perks** on a tap (reached ✓ with "Now · …", the next in bold, the rest greyed).
- **From her** (F51): her **pet name** for you from Romance 1 ("Calls you “Sprout”") and her **keepsake** from Friendship
  10 (its name, "+0.25 quality at the Fields", +0.5 from Spouse 5, and her line about it), both from her bible.
- **Gifts:** her loved, liked and disliked goods as learnt (RM15: her loved from Friendship 1, any once given, all from
  Friendship 7; "?" until then), each group's points at ★1, and "Others +10". An Uma without a bible: "Any gift +10".
  From Friendship 7, **her closest friend's loved gift** with its icon ("Stand-in 1 loves Golden Carrot", F51).
- **Ties:** her ties from the pack in `tiesOf`'s order, the one `closestFriend` reads (strongest first, then the most
  bond points, then the ties' order), each with the other Uma's face, its kind ("Friends", "Rivals", "Mentor",
  "Teammates", "Sisters", "Close") and **bond hearts** (CS44's, from `save.bonds`, moving as bonds grow); her closest
  friend first with a **Closest** chip; "Friends · 150/300", the points to the next heart; **Read** (44 pt) while an
  authored conversation of theirs is opened and unread; a tie whose Uma isn't on the farm yet says "Not here yet"
  (F52, [below](#bonds-between-umas-rm48rm50)).
- **Memories:** her count, "15 of 26", and **Album ›**, her album (F49, [below](#memories-rm28-rm56)).
- **Ring** (F53, [below](#the-ring-and-the-wedding-rm30-rm38rm40)): from Romance 8 "Her ring will read: ‘…’", the
  engraving (her R8 beat's line); from the proposal her ring with its bonus ("Iron Ring · +3% at the Fields once you're
  married", then "+3% at the Fields"), "Her ring reads: ‘…’", and **Give her the Cobalt Ring ›** for each better ring in
  the Warehouse. While the proposal waits for a ring, the Next card's "Needs a ring" has **Make one at the Forge's bench ›**.
- **The actions,** 48 pt in the sheet's foot: **Chat +15** (then her line for the day), **Gift** (the picker with each
  good's points for her today or "?"), and **Praise +20** while she's earned it; what an act pays floats up from her face
  as "+N" (still, with reduced motion) and a note says it ("She likes it. +36"). **☾ Evening ›** (F50) opens her
  [evening](#the-evening-rm19rm22-rm37) while she can spend one; otherwise it says why, greyed: "Evening ✓" (spent with
  her today), "Evening · F2" (below Friendship 2), "Away tonight", "Evening spent" (with someone else). Chat, Gift and
  Evening sit side by side ("Chat ✓", "Gift ✓" once done); **Praise +20** takes the row under them while earned.
- **Hearts | Work:** the Work side is F21's sheet: her favourite line, the day she joined, where she is and her nine
  activities with talent, rank, points and the next challenge.
- **The marks are stand-ins** (decision 11): the stage hearts, the bar's segments, the track's diamonds and the Ready,
  banked and invitation marks are CSS shapes and glyphs in the ladders' colours until the packet that pins F55's uma-art
  2.26.0 swaps in its `hearts/*` marks (F54 at the latest).

## The perks' words (RM31, RM32, RM36)

**Romance build; live from F56** (F48 decision 7). A perk on every level, 25 in all, **words and ids only**: her profile
lists them and F49's level-up card names the one an event brings; **F51 makes each do what it says**
([Perks](#perks-rm31rm36)). They're written
once as templates by her favourite line (`perksFor(line, chapter)`, `perkLineOf`, `romance/perks.ts`); her signature
dish, her keepsake and her dream are named generically here; F51 names her dish on the card and her profile, and reads
her keepsake (and her pet name) from her bible. A perk at her line's place
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

## Perks (RM31–RM36)

**Romance build; live from F56** (F51 decisions 1–13). A perk on every level, and each acts: **read from her level, never
stored** (`hasPerk(love, rung)`: its event has played; S2 and S4 at night). Only her signature dish writes state. The terms
the shared rules read (a haul's plan, a harvest, a block's growth, the night's extras) are `romance/perk-terms.ts`; the
night's own effects and the bespoke three are `romance/perk-effects.ts`. Save v4 with the pack only: v3's hauls,
harvests, growth and rank points are unchanged, and a test runs a v3 night with and without the pack to prove it.

<!-- live:perk-effects -->
| Level | Perk | What it does | Where it acts |
|---|---|---|---|
| F1 | Her loved gift shown; her own chats | Her loved gift shows on her profile; she speaks her authored chats | Her profile, Chat (F47) |
| F2 | Hangouts in the evening | The evening opens: hangouts | Tonight (F50) |
| F3 | +10% at the forest | +10% at her line: copies of her night’s items there (a farmer: a tended plot’s chance of an extra crop) | Night step 4, a harvest (F51) |
| F4 | Her signature dish’s recipe | Her signature dish’s recipe into the Kitchen’s list, once | `playEvent` (F51) |
| F5 | ×1.05 rank points | ×1.05 her rank points | Night step 6 (F47) |
| F6 | One item from the forest each night | One night chore | Night steps 2 and 4 (F51) |
| F7 | All her tastes shown, and her closest friend’s loved gift | All her tastes, and her closest friend’s loved gift, on her profile | Her profile (F47, F51) |
| F8 | In her element: ×1.2 at the forest beside a 3-heart friend | Side by side ×1.2 in place of ×1.1 at her line, outside the cap | Night steps 2 and 4 (F51) |
| F9 | Mentor: +10% rank points for Umas at the forest | ×1.1 rank points for the others at her place while she works there; one mentor a place | Night step 6 (F51) |
| F10 | Her keepsake; ×1.10 rank points | Her keepsake: +0.25 quality at her line; ×1.10 rank points | A job planned, a harvest (F51); step 6 (F47) |
| R1 | Dates; her pet name for you | Dates open; her pet name for you on her profile | Tonight (F50), her profile (F51) |
| R2 | A ★2+ good from the forest every 4th morning | A ★2+ good of her line every 4th morning | Night step 9 (F51) |
| R3 | Date: stargazing | Date: stargazing | Tonight (F50) |
| R4 | ×1.5 bond with her closest friend | ×1.5 on her bond with her closest friend | `addBond` (F52) |
| R5 | +10% more at the forest (+20%) | +10% more at her line (+20%) | Night step 4, a harvest (F51) |
| R6 | Dates: dance and boat | Dates: dance and boat | Tonight (F50) |
| R7 | A second night chore | A second night chore | Night steps 2 and 4 (F51) |
| R8 | Her ring’s engraving | Her ring’s engraving shows | The ring bench (F53) |
| R9 | Date: footrace | Date: footrace | Tonight, with its game (F32) |
| R10 | The proposal | The proposal | F53 |
| S1 | Breakfast: the crew starts well fed on a morning in her house | Breakfast: the crew well fed 1 day on a morning in her house, when no meal runs | `breakfast`, called by her house’s morning (F54) |
| S2 | A ★3+ good from the forest every 2nd morning, and each morning in her house | A ★3+ good of her line every 2nd morning (and each morning in her house, F54) | Night step 9 (F51) |
| S3 | Her dream; +5% for anyone at the forest | Her dream: +5% for anyone at her line’s place, once her S3 is in her Memories | Night step 4, a harvest (F51) |
| S4 | A third night chore | A third night chore | Night steps 2 and 4 (F51) |
| S5 | Vow renewal; her keepsake grows | Vow renewal; her keepsake grows to +0.5 | F53 (the vows); F51 (the keepsake) |
<!-- /live -->

### Her line (RM32; decisions 3 and 5)

Each template means one thing at each line's place. **Farming, foraging and fishing act now;** mining (the Mine or the
Quarry), the ranch, cooking, serving and forging act with their places' packets (M5, M6), their profile saying "Opens with
chapter n" until the chapter opens (RM36: in the romance core, the Mine and Quarry Umas' line perks wait for chapter 3).

<!-- live:perk-lines -->
| Her line | +10% at her line (F3, R5) | A night chore (F6, R7, S4) | A morning item (R2, S2) | Acts |
|---|---|---|---|---|
| Farming | Each plot she tends: +10% chance of an extra crop at harvest, at the plot’s stars | +0.25 growth on the untended block with the most growing plots, else hers (step 2) | A ★2+ crop of the season | Now |
| Foraging | Her haul ×1.1, and her Sawmill batch ×1.1 | One item from her rank’s deepest area this season, at a day’s haul’s stars (step 4) | A ★2+ good from the forest | Now |
| Fishing | Her catch ×1.1, and her Smokehouse batch ×1.1 | One fish from her deepest spot this season, at a day’s haul’s stars (step 4) | A ★2+ fish | Now |
| Mining (the Mine) | Her haul ×1.1, and her Smelter batch ×1.1 | One ore from her deepest floor | A ★2+ ore (a crop of the season until its place opens) | With chapter 3 (its packet) |
| Mining (the Quarry) | Her haul ×1.1, and her Cutter batch ×1.1 | One stone or gem from her deepest floor | A ★2+ stone or gem (a crop of the season until its place opens) | With chapter 3 (its packet) |
| Ranch | Her pen: +10% chance of an extra product | +5 affection to her pen (step 3) | A ★2+ egg, milk or fleece (a crop of the season until its place opens) | With chapter 2 (its packet) |
| Cooking | +10% dishes as the Kitchen’s assistant | +1 dish on the Kitchen’s next play | A ★2+ dish (a crop of the season until its place opens) | With chapter 4 (its packet) |
| Serving | +10% tips as the Restaurant’s server | +1 cover on the Restaurant’s next shift | A ★2+ dish (a crop of the season until its place opens) | With chapter 6 (its packet) |
| Forging | +10% goods as the Forge’s assistant | +5% refund on the Forge’s next tool | A ★2+ Fitting (a crop of the season until its place opens) | With chapter 7 (its packet) |
<!-- /live -->

- **Expected values:** a fraction becomes a whole item by a seeded draw, so a night replays the same (CS8): the perks'
  extras `draw(uid, day, 'perk:<id>', n)`, a chore `perk:<id>:chore`, a morning item's stars `perk:<id>:item`, a
  harvest's extra crop `perk:harvest:<block>:<plot>`.
- **Gathering and stations pay at night:** her items finished tonight at her line's place come to × (bond × (1 +
  romance)): side by side's pot first (F52's, ×1.1, or ×1.2 in her element), then **the perks' pot**, the bond term × the
  romance term of the same items, seeded copies (the same goods and stars) straight into the Warehouse (`nightExtras`,
  `extrasTonight`, `perksShare`). A forager's Sawmill batch and a fisher's Smokehouse batch count the same.
  uma-work's plans are never touched ([gathering.md](gathering.md)).
- **Farming pays at harvest:** each harvested plot of a tended block has the romance term on its tender's work at the Fields
  as the chance of **one extra crop** at the plot's stars (her own when farming is her line, plus the crew's). An
  untended block's harvest gets nothing ([fields.md](fields.md)).

### The romance term and its caps (RM33, RM34; decision 2)

<!-- live:perk-caps -->
| What | Cap | How |
|---|---|---|
| Her own line bonuses: F3 +10%, R5 +10%, her ring +1–15% once married | +35% | At her line’s place only (`romanceTerms`) |
| The crew’s: a dream’s +5% (the best at a place, never summed), the household’s +5% at 5 and +5% at 15 married | +15% | Anyone working the place (the household anywhere) |
| All romance bonuses on any one job, added | +40% | The romance term (`romanceBonus`) |
| In her element (×1.2) | Outside the cap | The bond term (`extrasShare`) |
| Night chores | 3 a night each | F6, R7, S4 |
| Morning items | 1 a day each by her count, +1 on a morning in her house (F54) | Every 4th from R2, every 2nd from S2 |
| Mentor | One a place | The most hearts, then the cast’s order |
| Rank points from her ladder | ×1.10 | F5 ×1.05, F10 ×1.10 (`loveRankFactor`) |

Worked (RM34): a married forager with F3, R5 and a grade-8 ring has +28% of her own (28% after her cap); a dream at the forest (+5%) and 15 married (+10%) add +15%; together +43%, **held to +40%**. Beside a 3-heart partner in her element her night’s items come to ×1.2 × 1.4 = ×1.68.
<!-- /live -->

- **One capped number on any one job** (`romanceTerms`, `romanceBonus`): her own (F3 + R5 + her ring, only at her line's
  place, open) held to 35%, plus the crew's (the best dream whose line's place this is, plus the household's 5% and 5%
  by `marriedCount`) held to 15%, the sum held to 40%. Her ring counts once she's married (`love.ring`, F53).
- **The household and dreams lift work an Uma does** (jobs and tending): a dream at its dreamer's line's place for
  anyone there, the household anywhere.
- **In her element** (Friendship 8) stays in the bond term, outside the cap: side by side ×1.2 in place of ×1.1 for her at
  her line's place beside an Uma she has 3+ bond hearts with, on the work places' extras and a farmer's tended growth.

### Night chores (RM32; decision 5)

- **1 from Friendship 6, 2 from Romance 7, 3 from Spouse 4**, never more, for an Uma **on the farm** (home in the Dorm, or
  housed); **away does none**. Each is its own seeded pick (`choresTonight`).
- **Farming** (step 2, `fieldChores`): **+0.25 growth** on the untended block with the most growing plots (a tie by a
  seeded pick), else on the block she tends while it has a growing plot; it joins the block's rate tonight.
- **Foraging and fishing** (step 4, `gatherChores`, after the extras): one item from her rank's **deepest forest area**
  this season, or one fish from her **deepest spot** (`deepestOpen`), by the season's shares, at **a day's haul's stars**
  for her there (her rank, talent, tool, well fed and keepsake), straight into the Warehouse.
- The morning says them in one line: "Night chores · 3 items", "Night chores · 2 items · +0.25 growth".

### Morning items (RM31's R2 and S2; decision 6)

- From **Romance 2** she leaves **a ★2+ good of her line every 4th morning**, counted from the day she reached Romance 2;
  from **Spouse 2**, **every 2nd morning at ★3+**, counted from the day she reached Spouse 2 (it replaces R2's count). One
  a day by her count; F54 adds +1 on a morning in her house. On the farm only.
- **The good** is `lineGood` with its own `n` (1): a crop of the season for a farmer, a good of her rank's deepest area
  for a forager, a fish of her deepest spot for a fisher (a crop of the season while her line's place waits). **Its
  stars** are her line's quality draw (`lineQuality`: a day's work at her line, keepsake included), held at the minimum.
- Night step 9 (`morningItems`), after the birthdays and anniversaries; the morning says "♥ Stand-in 2 left you ★3
  Shiitake", opening her profile. **Save v4 grows `love.morning`**, the day her count started, set by `advance` at R2 and
  at S2.

### The mentor (RM33; decision 7)

At night step 6, at each place worked today (the Fields' tenders as one place), an Uma at **Friendship 9** whose line's
place it is mentors the others who worked there: **×1.10 rank points** for the day (`mentorsTonight`,
`PointTerms.mentor`). **One mentor a place**: the most hearts (her place along her route), then the cast's order, then
her id; she earns no bonus herself, and a second Friendship 9 Uma there is mentored too ([ranks.md](ranks.md)).

### Her keepsake (RM31, RM33; decisions 8 and 13)

From **Friendship 10** her keepsake adds **+0.25 quality** (CS26's `keepsake` source) to her work at her line's place,
**+0.5 from Spouse 5** (her vow renewal); nowhere else. It's read when her job is planned (`planHaul`, through
`loopKinds(talentOf, pack)`) and when the block she tends is harvested (`tenderTerms`), and by her night chores and
morning items ([goods.md](goods.md#stars-cs26)). Its **name and her line about it** are her bible's `keepsake` (F40's
format, below); it shows on her profile under **From her**, never in the Warehouse.

### Her signature dish (RM31's F4; decision 9)

<!-- live:signature-dish -->
| Her line | Her dish kind | Its grade | At G1 |
|---|---|---|---|
| Farming | Salad | The top grade of the shop’s vegetables at its open seed tiers (Farm Rank 1: G6; 2: G7; 4: G10) | Carrot Salad |
| Foraging | Soup | The top grade of the deepest forest area anyone has worked (the Woods G2 … the World Tree G10) | Button Mushroom Soup |
| Fishing | Grill | The top grade of the deepest spot anyone has worked, its fish at 10% or more (the Pond G2) | Carp Grill |
| Mining (the Mine) | Curry | G1 until chapter 3’s packet | Basil Curry |
| Mining (the Quarry) | Curry | G1 until chapter 3’s packet | Basil Curry |
| Ranch | Cake | G1 until chapter 2’s packet | Honeycomb Cake |
| Cooking | Tart | G1 until chapter 4’s packet | Apple Tart |
| Serving | Cookies | G1 until chapter 6’s packet | Peanut Cookies |
| Forging | Bread | G1 until chapter 7’s packet | Wheat Bread |

Her loved good, when it’s a dish, is her signature dish as it is. The recipe joins `workshops.recipes` once (a recipe the farm knows stays once) and her route keeps its id (`love.dish`).
<!-- /live -->

`playEvent` gives it when Friendship 4 plays (`giveSignatureDish`): the recipe joins **`workshops.recipes`**, the
Kitchen's list (the Kitchen reads it from chapter 4, F8), once, and **save v4 grows `love.dish`** so her profile names it.
The level-up card says "Recipe · Bell Pepper Salad · in the Kitchen's list"; her profile's F4 says "Bell Pepper Salad ·
in the Kitchen's list". The names are uma-art's dishes atlas's (`dishName`: the family's raw good of that grade, then the
kind).

### Her dream (S3; decision 10)

Her dream is her **S3 event** (bespoke content); its effect is the template's: **+5% for anyone at her line's place**, in
the crew's term, **once her S3 event is in her Memories** (`dreamActs`). Two dreams at one place count once.

### Breakfast (RM35; decision 11)

A spouse's S1 perk: on a morning in her house (F54's house morning calls `breakfast(save, pack)`), **every Uma on the
farm with no well-fed days left starts the day well fed for one day** (as a Rough meal, ×1.25, so step 4's speed-up and
step 6's points read it that night). A meal running is **never shortened or extended**, and a breakfast **isn't a staff
meal** (no count moves: chapter 4's goal stays the Kitchen's). Each pair it feeds earns +5 bond (`addBond`, F52's
breakfast source).

### On screen (decision 12)

- **Her profile's Perks:** under the reached ones by ladder, what each reached perk does now, the later perk taking the
  earlier one's line (R5's replaces F3's): "R5 · +28% at the forest · +8% ring" (with "+5% crew" and "held to its cap"
  when they apply; a farmer's "+20% chance of an extra crop"), "R7 · 2 items each night" (a farmer's "+0.5 growth each
  night"; "None while she's away"), "R2 · Next tomorrow" ("Next in 3 mornings", the whole count once today's is in; "None while she's away"), "F4 · Bell
  Pepper Salad · in the Kitchen's list", "F8 · Beside Stand-in 1" ("No 3-heart friend yet"), "F10 · Bent Trowel · +0.25
  quality at the Fields", "R1 · She calls you “Sprout”", "R4 · With Stand-in 1". The full list shows each as "Now · …".
  A perk at a place not open says "Opens with chapter 3" and nothing now.
- **From her:** her pet name from Romance 1 and her keepsake from Friendship 10, with its line.
- **Gifts:** from Friendship 7, her closest friend's loved gift ("Stand-in 1 loves Golden Carrot").
- **The morning** (§4, RM57): "♥ Stand-in 2 left you ★3 Shiitake" and "Night chores · 3 items · +0.25 growth" in the
  third place (the house's morning), "Perks · +2 items" in the sixth before side by side.
- **A harvest's note:** "+3 Carrot (★1 × 2, ★2 × 1) · 1 from perks · 1 seed back".

### The story format (decision 13)

Her bible gains two optional fields, in F40's format and validator, and the stand-in's 9000001 has both (invented):

- **`keepsake: { name, line }`** (RM58): the name 1–40 characters, the line 1–160, both under the line rules; without it
  her profile says "Her keepsake".
- **`petName`** (RM8, RM31): 1–24 characters, no placeholder, never gendered (the farmer's own words' rule); without it
  her R1 perk says nothing more.

## Heart events (RM24, RM28, RM29, RM54)

**Romance build; live from F56** (F49 decisions 1–4 and 8). A level is its event: once her next event is
[Ready](#ready-rm24) it waits, forever, for you to play it, and **nothing fires on its own**.

- **Three ways in:** her Hearts row's **● Ready**, her profile's **Play ›** (on the Next card), and the morning's Ready line
  (its **Play** tag), each opening the player over the page: `?event=<characterId>`. A setup not met says what to do on
  her Next card: "Assign her to the Fishery, then come back.", "Have her tend a block on the Fields, then come back.", "Put
  Carrot in the Warehouse, then come back.", "Let her and Stand-in 2 work side by side until bond 3."
- **Nothing is saved while it plays.** Her script loads on demand (the pack's `route(id)`); the player waits for it and
  for master data, and Auto, Skip and Log work meanwhile. At the end **one rule, `playEvent(save, pack, id, outcome)`,** pays
  it and moves her on, and the app commits it once, stamped. **An event left halfway pays nothing and stays Ready.**
- **One of hers a day** (RM21): played, she isn't Ready again until tomorrow, however full her bar.

```
┌──────────────────────────────────────────┐
│ The Fields · Friendship 1  Auto Skip Log │  the place and the rung; the controls away from the taps
│ ╭──────────────────────────────────────╮ │
│ │  (the Fields' frame)        ♪ (bust) │ │  the place card, ~45%: its frame on the season's
│ │  on spring's ground                  │ │  ground, her bust, the emote bubble beside it
│ ╰──────────────────────────────────────╯ │
│ ┌──────────────────────────────────────┐ │
│ │ Stand-in 1                           │ │  her bubble: three lines at most, typed out
│ │ Hello, Robin. Some of these are      │ │
│ │ ready. Help me pick?                 │ │
│ └──────────────────────────────────────┘ │
│ [ Show me which ones.             +30 ]  │  48 pt choices, each with its gain
│ [ Race you to the end of the row. +10 ]  │
└──────────────────────────────────────────┘
```

- **The place card** (decision 3) fills the top: a farm place's map frame (`FARM_PLACES`' uma-art building) on the
  season's ground, or a romance backdrop's borrowed frame and tint; a `{ place }` step changes it mid-scene, and the title
  reads "The Fields · Friendship 1", "The Pond at night · Romance 5". Her **bust** is master data's (uma-kit's `UmaBust`; a
  lettered disc for a stand-in), or whichever Uma is speaking; a town cast member speaks with their disc.

  | Backdrop | Borrowed frame | Tint |
  |---|---|---|
  | `pond-night` | `fishery`, under a night sky | `#33456f` |
  | `overlook` | `observatory` | `#f0c493` |
  | `orchard-bench` | `orchard` | `#f3dca6` |
  | `dorm-porch` | `dorm` | `#ebc79f` |
  | `harbour-wall` | `warehouse` | `#bcd6e2` |
  | `chapel-bell` | `cleric-chapel` | `#f5e6bd` |
  | `town` | `exchange` | `#f0d4b2` |
  | `hilltop-track` | `racecourse` | `#d2e7b7` |
  | `sea-pier` | `fishery-workbench` | `#9fc6de` |

  A farm place's ground by season: spring `#dcefc7`, summer `#f6e7b0`, autumn `#f2d3b0`, winter `#e3ebf3`.
- **The emote mark** (decision 4) is uma-art's `emote` bubble (64 px, drawn at 48) beside her bust, until expression art
  exists (RM62): happy and laughing `music`, shy `sweat`, sad `ellipsis`, angry `anger`, surprised `exclaim`, thinking
  `question`, tender `heart`. The atlas loads only with the player.
- **Her bubble:** at most three lines at 16 pt, typed out; **a tap finishes the line, the next goes on, a hold skips**.
  Narration and thoughts are italic. A `wait` goes on by itself (≤ 5 s).
- **Skip** (and a hold on the bubble) jumps to the next choice or play, **never past one**. **Auto** goes on after a
  reading pause (1.2 s and 35 ms a character). **Log** lists the lines so far and your answers.
- **Which play** (decision 6): its route's `play` step, by [RM26's map](#the-plays-rm25-rm26) (`play.as` picks Pick or
  Rhythm for farming, Pick by default); with no `play` step anywhere in it, its beat's `together` plays at the scene's
  end; `help` and `talk` have no play.

## The plays (RM25, RM26)

**Romance build; live from F56** (F49 decision 5). What the farmer and she do together is one short play on a flat sheet
in the middle of the player. Each shows what to aim for first (her favourites, her beat, the place she loves), takes one
thumb (timing from `pointerdown`), takes nothing from the Warehouse, and closes on its grade. **Never failed:** a missed
tap still lands, as a Fine. The rules are pure and tested first (`romance/plays/`, FR22), seeded by `draw(uid, day,
'play:<id>:<rung>', n)` so the same day plays the same, and **both lengths are built**: an event's and an evening's, so
F50 only wires evenings.

<!-- live:plays -->
| Play | You | Graded by | In an event | As an evening (F50) |
|---|---|---|---|---|
| Cast | Tap as a closing ring meets the mark; the line lands every time | Timing | 1 cast | 3 casts |
| Pick | Tap her favourites (starred) among the goods popping up on a 3 × 3 field | Right picks | 1 round of 10 | 3 rounds |
| Rhythm | Tap on her beat with the activity’s mark (a hoe, a brush, a step, an oar…) | Timing | 8 beats after her 4 | 3 × 8 beats |
| Walk | Walk with her past today’s farm places; at each fork take a turn | Her favourite turns found | 2 forks | 4 forks |
| Choose | Pick one good of three for her | Her taste | 1 pick | — |
<!-- /live -->

<!-- live:play-grades -->
| Grade | Score | An event adds | An evening pays (F50) |
|---|---|---|---|
| Fine | 0–59 | +0 | +60 |
| Great | 60–89 | +15 | +100 |
| Perfect | 90–100 | +30 | +150 |
<!-- /live -->

**What plays as what** (RM26). An activity whose game isn't built yet plays **Rhythm with its mark** (the fallback), the
same grades; when the real game ships, the event plays it and Memories' replays use the best that exists. The marks are
words until art draws them; the play's icon is uma-art's `play/*`.

<!-- live:play-map -->
| `together` (or a `play` step’s `game`) | Plays as |
|---|---|
| `work: farming` | Pick |
| `work: ranch` | Rhythm with the brush |
| `work: mining` | Rhythm with the pick |
| `work: fishing` | Cast |
| `work: foraging` | Pick |
| `work: cooking` | Rhythm with the pot (the fallback until its game ships) |
| `work: serving` | Rhythm with the tray (the fallback until its game ships) |
| `work: forging` | Rhythm with the anvil (the fallback until its game ships) |
| `work: expeditions` | Rhythm with the pack (the fallback until its game ships) |
| `work: farming` with `play.as: rhythm` | Rhythm with the hoe |
| `date: fishing` | Cast |
| `date: walk` | Walk |
| `date: boat` | Rhythm with the oar |
| `date: picnic` | Pick |
| `date: market` | Pick |
| `date: stargazing` | Pick |
| `date: dance` | Rhythm with her step |
| `date: crafting` | Rhythm with your hands |
| `date: cooking` | Rhythm with the pot (the fallback until its game ships) |
| `date: footrace` | Rhythm with the track (the fallback until its game ships) |
| `gift` | Choose |
| `help`, `talk` | No play: the grade is the best choice’s |
<!-- /live -->

**The windows and numbers** (decision 5, the worker's): a careful tap lands Perfect, a casual one usually Great.

<!-- live:play-windows -->
| A tap this far from the moment | Scores | Grade |
|---|---|---|
| ≤ 80 ms | 100 | Perfect |
| 81–160 ms | 99 → 90 | Perfect |
| 161–360 ms | 89 → 60 | Great |
| 361–719 ms | 58 → 0 | Fine |
| 720 ms or more, or no tap | 0 | Fine |

| Play | Seeded (`play:<id>:<rung>`) | Scored |
|---|---|---|
| Cast | The ring meets the mark 1.6 s–2.8 s after each cast starts | The tap’s timing; casts score their mean |
| Rhythm | A beat every 700–1000 ms; her 4 first, then 8 to tap | Each beat by its nearest tap’s timing (within half a beat), their mean; a tap that matches no beat −5; rounds score their mean |
| Pick | 10 goods a round, one every 1.1 s, each showing 1 s–1.4 s; 4 starred (her loved and liked, else her line’s first goods) | The starred tapped while showing, their share of 100; a tap on an unstarred one −10; rounds score their mean |
| Walk | At each fork her place and another open farm place, left or right; 8 s a fork | Her place’s turn full, the other half, none 0: their share of 100 (two forks 50, 75 or 100) |
| Choose | Three goods, one of her loved or liked; 10 s | Loved 100, liked 75, anything else 40, none 0; the taste is learnt |
<!-- /live -->

- **Walk's place:** her line's first place when it's open today, else a seeded one of the open farm places her beats use,
  else the Fields. The path passes today's open farm places (not the Gate or the town edge). Before it she says "I love the
  Fields."
- **Pick and Choose's goods:** her loved and liked goods, starred; the others are the rest of their families' raw goods,
  grades 1–5. An Uma without a bible stars her line's first goods (and Choose finds every good neutral).

## Choices and rewards (RM27, RM28)

**Romance build; live from F56** (F49 decisions 1, 7 and 9). Each event has 1–2 choice points of 2–3 options, and **every
option shows its gain on the button before the tap**: +30 for the best (the highest authored gain, each one tied at the
top), +10 for the others. **A romantic option** (`romance` above 0) carries a **♥**. An option may also:

- **cost goods** (`gives: { good, count }`): "+10 · 1 Basil" on the button, taken at any stars, lowest first; greyed with
  **"Need 1 Basil"** when the Warehouse is short;
- **reveal a taste** (`reveals`, one of her gifts): "· learns a like" ("a love", "a dislike"), learnt into `love.known`;
- **set a flag** (a `flag` step in its `then`) that changes later wording only: a `when` step plays its steps while the
  flag is set (`else` otherwise).

No option scores below zero, removes a later event or changes the route.

<!-- live:event-pay -->
| An event | Points into her next bar |
|---|---|
| Played to its end | +50 |
| Each choice: the option with the highest authored gain (each one tied at the top) | +30 |
| Each choice: any other option | +10 |
| Each play: Fine, Great, Perfect | +0, +15, +30 |
| No play (help, talk): the best option taken a Perfect, any other a Great | +30 or +15 |
| A heart event’s limits | 1–2 choice points, at most 1 play |
| The confession’s, the proposal’s and the wedding’s limits | 1–3 choice points, at most 3 plays |
<!-- /live -->

**Into her next bar, through `addLove`**, so an anniversary's ×2 applies; then `advance`. The event also gives:

- **its rung's perk** (F48's words; F51 makes it act): Friendship 4's writes **her signature dish's recipe** into the
  Kitchen's list here, and the card says "Recipe · Bell Pepper Salad · in the Kitchen's list";
- **a Memory:** the rung into `memories[id]`, its caption her beat's `beat` line;
- **its unlock**, if any: an item lands in the Warehouse (★1); a place or a perk line is the card's;
- any taste a `reveals` or a Choose learnt, and the path's flags into `love.flags`;
- her id into `today.events`, and `love.last` today.

## The level-up and stage-up cards (RM55)

**Romance build; live from F56** (F49 decisions 9 and 11).

```
┌──────────────────────────────────────────┐
│          ♥  Friendship 5  ♥              │  a short sparkle (still with reduced motion)
│   (bust)  “This bench is ours now.”      │  her last line of the event
├──────────────────────────────────────────┤
│ +50 event · +30 choice · +30 Perfect     │
│   = +110 toward Friendship 6 (+40 banked)│  "(+N banked)": what was past her full bar before
├──────────────────────────────────────────┤
│ Perk  ×1.05 rank points                  │
│ Memory ▢ “The long way round.” saved     │
│ Unlocked  New place · the orchard bench  │
├──────────────────────────────────────────┤
│ Next: Friendship 6 · 400 points          │
│ 150 / 400                                │
│ The Fields, with a Carrot in the Wareh…  │  the next beat's hint: its place and setup
│ Opens: +0.25 growth on a block each night│  the next rung's perk
│              [ Continue ]                │
└──────────────────────────────────────────┘
```

- **The sum:** "+50 event", the choices ("+30 choice", "+40 choices"), each play's grade ("+15 Great"), or with no play the
  best choice's grade; "= +N toward ‹next rung›", "(×2 anniversary)" on her anniversary, and "(+N banked)".
- **The stage-up screen** closes the confession's Yes: "Partners", the route's track re-coloured, **Opens now** (the
  romance ladder; R1's dates and her pet name; her partner chats; R3's stargazing; R6's dance and boat; R9's footrace) and
  what's banked toward Romance 1, with one **Continue**.
- **F53:** the proposal closes on **Engaged** ("A ring, and a yes. Your wedding comes next."; Opens now: "Your wedding:
  tomorrow, whenever you're ready", her ring and its bonus once you're married, a better ring any day), and the wedding on
  **Married** ("Your wedding is done. Her bar turns gold."; the spouse ladder, her ring at her line, every evening kind
  her ladders opened, S1's breakfast, "Your anniversary: Summer 9, each year", then RM45's "Married 1/20 · next household
  scene at 5"). Their level-up cards add "Ring · Iron Ring · hers now" and "Wedding · The Fields · Marta's bakery sends a
  cake · everyone well fed 1 day".

## The confession (RM30)

**Romance build; live from F56** (F49 decision 10). Ready the day after Friendship 10, at its own place; **3–5 minutes**,
with up to three plays and three choice points, its **last choice point** marked: one option `answer: 'yes'`, one
`answer: 'not-yet'` (the validator's rule). Either way it **pays like any event** and **counts as her event that day**.

- **Yes** moves her to romance (`advance`: Romance 0, her banked points toward R1) and shows the stage-up screen.
- **Not yet** keeps her a **close friend** (`love.friend`, "Close friend" in words): nothing is lost, her points keep
  banking toward Romance 1, and her confession isn't Ready again.
- **Ask her** (her profile's Next card, while she's a close friend) plays the confession again from her line before its
  answer, without its plays, **once a day** (`today.asked`), **paying nothing** and **not her event** (`love.last` and
  `today.events` stay). **Yes** there clears `friend` and shows the stage-up; Not yet: "Whenever you're ready. Ask again
  tomorrow."
- Deterministic: she always confesses. The author may write her saying "not yet" in an earlier scene's words, at no cost.

## Memories (RM28, RM56)

**Romance build; live from F56** (F49 decision 12). **Her album** (`?album=<characterId>`, from her profile's **Album ›**
and the Diary's **Memories** shelf): 26 tiles, one a rung with an event, in four filters (**Friend**: F1–F10 and her
confession; **Romance**: R1–R10; **Wed**: the proposal and the wedding; **Spouse**: S1, S3, S5), each on uma-art's Memory
frame: played ones with their caption, **the next** marked, the rest locked. **Her arrival ›** replays her arrival scene.

- **A replay** starts from the top or from any choice point picked from its list ("Choice 1 · “Show me which ones.”"),
  at `?memory=<id>:<rung>[@<n>]`: the scene plays with its plays, **every option is open** (no cost, no gain shown),
  **nothing is paid, taken or saved**, and it ends "A Memory, replayed. Replays give no points."
- **The Diary's shelf** lists each Uma on the farm with "n of 26", opening her album.

## The stand-in route (decision 13)

9000001's 26 events are invented and exercise everything: every play, the fallback, a cost, a taste, a flag and its
`when`, three setups, three unlock kinds and a confession with two plays and Yes and Not yet.

<!-- live:stand-in-route -->
| Rung | Place | Together | Plays | Setup | Also |
|---|---|---|---|---|---|
| F1 | fields | work: farming | Pick |  |  |
| F2 | fields | work: farming | Rhythm with the hoe |  | unlocks item |
| F3 | fishery | work: fishing | Cast | works fishing |  |
| F4 | dorm-porch | work: cooking | Rhythm with the pot (the fallback until its game ships), from its together |  | a cost |
| F5 | orchard-bench | date: walk | Walk, from its together |  | unlocks place |
| F6 | fields | gift: carrot | Choose, from its together | carrot held |  |
| F7 | dorm-porch | talk | No play: the grade is the best choice’s |  | a taste |
| F8 | forest | help: 9000002 | No play: the grade is the best choice’s |  | a flag |
| F9 | fields | work: farming | Pick |  | a `when` |
| F10 | pond-night | date: stargazing | Pick |  |  |
| Confession | overlook | talk | Walk; Pick |  | Yes / Not yet |
| R1 | orchard-bench | date: picnic | Pick |  | unlocks perk |
| R2 | pond-night | date: fishing | Cast |  |  |
| R3 | overlook | date: stargazing | Pick |  |  |
| R4 | fishery | help: 9000003 | No play: the grade is the best choice’s | bond 3 with 9000002 |  |
| R5 | pond-night | date: boat | Rhythm with the oar |  |  |
| R6 | town | date: dance | Rhythm with her step |  |  |
| R7 | barn | work: ranch | Rhythm with the brush |  |  |
| R8 | town | date: crafting | Rhythm with your hands |  |  |
| R9 | hilltop-track | date: footrace | Rhythm with the track (the fallback until its game ships) |  |  |
| R10 | orchard-bench | date: walk | Walk |  |  |
| Proposal | chapel-bell | talk | Walk |  |  |
| Wedding | chapel-bell | talk | Rhythm with her step |  |  |
| S1 | fields | work: farming | Pick |  |  |
| S3 | dorm-porch | gift: golden-carrot | Choose, from its together |  |  |
| S5 | overlook | date: stargazing | Pick |  |  |
<!-- /live -->

## The evening (RM19–RM22, RM37)

**Romance build; live from F56** (F50 decisions 1–10). **One evening a day across all the Umas**, any time in the day,
from her profile (**☾ Evening ›**) or Tonight's row; an evening left empty costs nothing. It's a short play together,
graded **Fine, Great or Perfect** and never failed (a miss is a Fine), that pays well, and more in her favourite kind.

### Who and the kinds (RM19, RM37; decisions 1–3)

- **Who:** a **hangout** with an Uma at Friendship 2 or more (her confession's wait and Romance 0 included), a **date** from
  Romance 1 (the proposal's and the wedding's waits included), and **every kind her ladders opened with a spouse**. She
  must be **home** (`homeTonight`: the Dorm's list, and from F54 a spouse in her house).
- **The kinds** are D42's ten date games, opened by her ladder and by their game; **cooking together** waits for F8's
  practice mode and **the footrace** for F32's track play, so until their packets they aren't offered (a favourite kind
  that isn't offered still counts as hers, and she doesn't invite you to it). **Festival night** is a festival day's own
  slot (below).
- **Her favourite kind** is the date game her bible's beats use most (`together.kind === 'date'`); **walk on a tie at the
  top, or with none** (no bible, no date beats). It pays ×1.5 and it's what her invitations ask for.

<!-- live:evening-kinds -->
| Kind | As a hangout | As a date | Plays as (RM26) | Its game | Her invitation |
|---|---|---|---|---|---|
| Walk at dusk | F2 | R1 | Walk | Now | “Walk at dusk tonight?” |
| Fishing at the Pond | F2 | R1 | Cast | Now | “Fishing tonight?” |
| A picnic | F2 | R1 | Pick | Now | “A picnic tonight?” |
| The market in town | F2 | R1 | Pick | Now | “The market in town tonight?” |
| Cooking together | F2 | R1 | Rhythm with the pot (the fallback until its game ships) | M5 (F8); not offered until then | “Cook with me tonight?” |
| Crafting | — | R1 | Rhythm with your hands | Now | “Make something with me tonight?” |
| Stargazing at the overlook | — | R3 | Pick | Now | “Stargazing tonight?” |
| Dancing | — | R6 | Rhythm with her step | Now | “Dance with me tonight?” |
| A boat on the lake | — | R6 | Rhythm with the oar | Now | “A boat on the lake tonight?” |
| A footrace | — | R9 | Rhythm with the track (the fallback until its game ships) | M6 (F32); not offered until then | “Race me tonight?” |
| Festival night | Festival days, F2 | Festival days, R1 | Walk, at the festival ground | Now | — (never asked for) |

Who: a hangout from Friendship 2 (her confession’s wait and Romance 0 included), a date from Romance 1 (the proposal’s and the wedding’s waits included), and every kind her ladders opened with a spouse; she must be home. The stand-in’s favourite kinds: 9000001 stargazing, 9000002 walk, 9000003 walk.
<!-- /live -->

### The points (RM13, RM16, RM17; decision 4)

**The grade's 60, 100 or 150, × 1.5 in her favourite kind, × 1.5 on her birthday, × 1.5 on her anniversary**: each once,
multiplied, rounded half up, into her bar through `addLove` (D48: an anniversary evening is ×1.5, not the day's ×2 as
well). Her kinds sheet shows each kind's three numbers for her today before the tap ("Perfect +225"), and the play shows
them under it.

<!-- live:evening-points -->
| Grade | Any kind | Her favourite kind (×1.5) | Her kind, on her birthday | Her kind, on her birthday and anniversary |
|---|---|---|---|---|
| Fine | +60 | +90 | +135 | +203 |
| Great | +100 | +150 | +225 | +338 |
| Perfect | +150 | +225 | +338 | +506 |

An invitation said yes adds **+20** with her first evening that day, whatever the kind; it’s an act of its own, so her anniversary doubles it (+40).
<!-- /live -->

### The slots and the invitations (RM19, RM20, RM45; decisions 5 and 7)

<!-- live:evening-slots -->
| Today | Evenings | Festival night | Invitations this morning |
|---|---|---|---|
| Any day | 1 | — | 1 |
| From 10 married | 2 on days divisible by 4, else 1 | — | 2 |
| A festival day (Spring 10, Summer 10, Autumn 10, Winter 10, Winter 12) | As any day | 1 more, its own slot: only festival night fills it | As any day |

An invitation’s draw: `draw(uid, day, 'invite', n)` among the Umas home at Friendship 2+ whose favourite kind is open to them, each weighted 1 + the days since her last evening (or since she arrived), up to 14; a second invitation is never the first’s Uma.
<!-- /live -->

- **One evening a day; a second on days divisible by 4 from 10 married** (`eveningsOn`, `marriedCount`); **festival
  night** is its own slot on a festival day, filled only by its kind (a walk at the festival ground, with anyone at
  Friendship 2 or more). An Uma may spend more than one slot in a day; the invitation's +20 comes with her first.
- **Invitations:** night step 9 (`drawInvitations`, after `heartsMorning`) draws this morning's into `today.invites`,
  unanswered, and §4's second place; step 7 cleared yesterday's. **Yes, tonight** makes her Tonight's evening (refused
  once the evening is spent); **Another day** costs nothing, and she may ask again another morning. Once each.

### On screen (decisions 6, 8 and 9)

```
┌──────────────────────────────────────────┐  ?evening=9000002 (her profile's Evening ›)
│ An evening with Stand-in 2             ✕ │
│ (face) A hangout · Friend · F2           │
│        ✉ She asked you: +20 with the evening
├──────────────────────────────────────────┤
│ [walk] Walk at dusk ★                    │  her favourite, ×1.5
│        Fine +90 · Great +150 · Perfect +225
│ [cast] Fishing at the Pond               │
│        Fine +60 · Great +100 · Perfect +150
│ [pick] A picnic · [pick] The market in town
│ ░ Crafting           At Romance 1        │  greyed: her ladder hasn't opened it
│ ░ Stargazing at the overlook  At Romance 3
│ ░ Dancing · A boat on the lake  At Romance 6
└──────────────────────────────────────────┘
```

- **Her kinds sheet** (`?evening=<characterId>`): her role and level, the invitation's +20 when she asked and you said
  yes, "★ Her birthday: ×1.5 tonight"; the kinds open to her now in RM37's order (festival night last on a festival day),
  each with its play's mark and **her three numbers today**, ★ and a rose edge on her favourite; then the kinds her ladder
  hasn't opened, greyed with their rung. A tap plays it.
- **The play** is F49's at its **evening length** (three casts, three rounds of Pick or Rhythm, four forks of Walk), over
  everything on a dusk wash, seeded by `draw(uid, day, 'evening:<id>:<kind>', n)`; its legend and result show her own
  numbers ("Perfect · +225"). A ✕ leaves it, spending nothing: **nothing is saved until it ends**.
- **The card:** the kind and "with ‹Name›", the grade, the sum ("+150 Perfect × 1.5 her favourite = +225", "+20 for saying
  yes", "= +245 toward Friendship 3 (+40 banked)") and her bar in her ladder's colour, one **Continue**. `spendEvening`
  commits it once, stamped: the points, `love.evening` today, and the slot in `today.evenings`.
- **Tonight's picker** (`?evening=pick`): the Umas who can spend an evening now, a yes first, then an unanswered
  invitation, then the cast's order, each with her level, ★ her favourite kind and ✉.

```
┌──────────────────────────────────────────┐
│ Tonight · Spring 6                       │
├──────────────────────────────────────────┤
│ ☾ Evening   with Stand-in 2 · Walk ✓     │  spent
│ ☾ Evening   ✉ Stand-in 3 · Walk [Play ›] │  (or) she said yes
│                         Someone else ›   │
│ ☾ Evening   [     Pick someone ›     ]   │  (or) free
│ ☾ Festival night [ Pick someone › ]      │  a festival day's own row
├──────────────────────────────────────────┤
│ 2 Umas idle · 3 to collect               │  CS6's line
│        [ Back ]   [ End the day ]        │
└──────────────────────────────────────────┘
```

- **Tonight** is End the day's sheet on v4 in the romance build whenever a slot is free and someone can spend it
  (`tonightOpens`; F54 adds a house to pick); otherwise F18's rule stands (all set or the Menu's switch off: the day ends
  at once; else the one line). Whether it opens is settled once as the sheet opens, so coming back from a played evening
  shows its row ✓ and never ends the day by itself. **End the day never waits on the evening.**
- **The night is a fade:** End the day dims the whole screen to dusk (`#2b3557`, 450 ms), the night runs under it with
  nothing shown, and the morning comes up from it (650 ms); with reduced motion, a plain cut. A failed night lifts it at
  once and says **Try again**.
- **The morning's invitation** sits in §4's second place: "✉ Stand-in 2: “Walk at dusk tonight?”" with **Yes, tonight**
  and **Another day** (44 pt); said yes, "Tonight ✓" with **Play ›**; declined, "Another day". Her row's ✉ stands while
  it's unanswered, or yes and not yet spent.
- **The header's marks:** "☾ Evening" with ○ or ● a slot (decision 9).

**The save** (v4, grown in place): `today.evenings` holds what's spent (`{ with, kind }`, one a slot: at most the day's
evenings, and festival night's only on a festival day), `today.invites` this morning's invitations (`{ id, kind, answer }`,
at most one, two from 10 married, each a different Uma, `kind` a date game, never festival night), and `love.evening`
her last evening's day. Step 7 clears both lists; the parse refuses anything else.

## The ring and the wedding (RM30, RM38–RM40)

**Romance build; live from F56** (F53 decisions 1–13). The proposal needs a ring (RS6), but the Forge's merge game is M6's
while the first weddings come in the first year (RM63), so on save v4 the Forge opens early **as a bench, with no game**.

```
 an Uma's first Romance 8 event ──night step 8──► buildings.forge = 0 (the bench; chapter 7 still lights the fire, M6)
   │                                               the morning: Ida Stone's scene, "The Ring Bench" (once, scene:bench)
   ▼
 the Forge's quick look ──► ?sheet=bench: 3 refined goods of grade g ──► ring-g<g> ★1 in the Warehouse (one a day)
   │
 Romance 10 played ──the next day, a ring held──► the proposal: which ring? ──► played, always yes ──► Engaged
   │                                              the ring leaves the Warehouse; love.ring = its grade
   ▼
 the next day, and any day after ──► the wedding: where? (her three) ──► played on that card, guests and vows
   │                                  ──► the reception (a dish, or Marta's cake) ──► Married: wed = today, spouse 0
   ▼
 night step 9: everyone on the farm well fed from tomorrow · her ring +1% a grade at her line, inside her own +35%
```

### The ring bench (RM38, RM40; decisions 3–5)

<!-- live:bench-recipe -->
|  | The ring bench (v4) |
|---|---|
| Opens | The night after the first Romance 8 event anyone plays: `buildings.forge = 0`, and Ida Stone’s scene the next morning |
| A ring of grade g | 3 refined goods of grade g, any family, any mix; the mining families’ (ingots, blocks, cut gems) from chapter 3 |
| Cost | The goods only: no gold, no game, no assistant, no score |
| Out | The ring, ★1 (a Rough make), into the Warehouse |
| How often | One ring a day (`today.ring`) |
| Her bonus once married | +1% at her line a grade, inside her own +35%; M6’s merge game adds +1, +3 or +5 for a Fine, Great or Masterwork make |
| Refusals | “The ring bench opens with your first Romance 8.” · “Three refined goods of one grade.” · “Ingots, blocks and cut gems open with chapter 3.” · “One ring a day.” · “Not enough in the Warehouse.” |
<!-- /live -->

- **On the map:** on v4 the Forge's lock says "Opens with your first Romance 8" until the bench stands; then it's open,
  its quick look reads **Ring bench · one ring a day** with **Make a ring ›** (`farm/ring-bench`'s mark), and its blurb
  "The ring bench: a ring from three refined goods of one grade, one a day." v3's Forge waits for chapter 7, as M4 has
  it ([days.md](days.md#the-farm-map-fc28-decision-5)).
- **Ida Stone's scene** ([goals.md](goals.md#the-ring-benchs-scene-f53)): the morning after, once the summary is put away
  (after any chapter scene, before arrivals), seven short lines and a card, **See the bench** or **Later**; read once.
- **The sheet** (`?sheet=bench`), RM38's mockup: Ida Stone's disc and the rule; one row a grade you can make now, lowest
  first, each with **the three goods it would take** (the lowest-value refined goods of that grade, fewer stars first,
  any family, any mix), "→ Iron Ring" and "+3% once married"; a tap on one of the three lists the grade's other goods held
  ("Sardine Fillet ★1 · 2 left · 100g") and swaps it in; a tap on a row chooses it; CS25's recipe greyed "From chapter 3:
  2 ingots + 1 cut gem · Opens with chapter 3" (from chapter 3 "CS25's recipe works too", with the chosen grade's pair);
  "Her bonus once married: +1% a grade (+0 / +1 / +3 / +5 for the merge, M6)"; and **Make an Iron Ring · 1 a day**. Made,
  "Iron Ring · in the Warehouse, ★1", and the foot says "One ring a day. Iron Ring made today ✓". Nothing to make: "Three
  refined goods of one grade make a ring: planks from the Sawmill, fillets from the Smokehouse, flour from the Mill."

### The rings (CS25; decision 2)

<!-- live:rings -->
| Grade | Ring | Id | ★1 | ★5 | Her bonus once married | Cheapest at the bench (chapter 1) | CS25’s recipe (from chapter 3) |
|---|---|---|---|---|---|---|---|
| G1 | Copper Ring | `ring-g1` | 205g | 410g | +1% | 3 Pine Plank (40g each) | 2 Copper Ingot + 1 Cut Quartz |
| G2 | Tin Ring | `ring-g2` | 275g | 550g | +2% | 3 Birch Plank (45g each) | 2 Tin Ingot + 1 Cut Amethyst |
| G3 | Iron Ring | `ring-g3` | 340g | 680g | +3% | 3 Cedar Plank (60g each) | 2 Iron Ingot + 1 Cut Citrine |
| G4 | Silver Ring | `ring-g4` | 450g | 900g | +4% | 3 Polished Rice (75g each) | 2 Silver Ingot + 1 Cut Garnet |
| G5 | Cobalt Ring | `ring-g5` | 580g | 1,160g | +5% | 3 Oak Plank (105g each) | 2 Cobalt Ingot + 1 Cut Emerald |
| G6 | Gold Ring | `ring-g6` | 745g | 1,490g | +6% | 3 Rye Flour (90g each) | 2 Gold Ingot + 1 Cut Sapphire |
| G7 | Platinum Ring | `ring-g7` | 950g | 1,900g | +7% | 3 Buckwheat Flour (115g each) | 2 Platinum Ingot + 1 Cut Ruby |
| G8 | Titanium Ring | `ring-g8` | 1,220g | 2,440g | +8% | 3 Ebony Plank (220g each) | 2 Titanium Ingot + 1 Cut Diamond |
| G9 | Mythril Ring | `ring-g9` | 1,555g | 3,110g | +9% | 3 Elderwood Plank (280g each) | 2 Mythril Ingot + 1 Cut Starstone |
| G10 | Orichalcum Ring | `ring-g10` | 2,025g | 4,050g | +10% | 3 Yggdrasil Plank (360g each) | 2 Orichalcum Ingot + 1 Cut Philosopher's Stone |
<!-- /live -->

They're v4's catalogue only (v3 can't hold one): additive goods of the family `rings`, sold at the bin like any good (no
season's demand), drawn with uma-art's `accessory-setting` frames, on the Warehouse's **Rings** tab while one is held, and
a **Diary row** of their own (`row:rings`, 500g once all ten have shipped; each ring shipped is an entry). One a day from
goods worth a little less keeps the bench a ring maker, not a mint (the Iron Ring: 180g of planks → 340g).

### The proposal (RM30, RM39; decision 8)

Ready by F47's rule: the day after Romance 10, **with any ring in the Warehouse** ("Needs a ring" until then). **Play ›**
first asks **which ring**, the best grade preselected ("Propose with the Iron Ring ›"); then her authored event plays
(up to three plays and 1–3 choice points). It **always succeeds**: the ring leaves the Warehouse (lowest stars first),
`love.ring` is its grade, `advance` makes her **engaged** (the wedding's wait), and the stage-up reads **Engaged**.

**Her ring** (decision 6): every ring is a Rough make until M6's merge game, so `love.ring` holds its grade, 1–10, and
once she's your spouse it's her bonus in % at her line (+1% a grade, F51's `ringBonus`, inside her own +35%). **A better
ring** any day from the proposal on: her profile offers each higher-grade ring in the Warehouse; she keeps it, and her old
one (`ring-g<old>`, ★1) comes back. A lower or equal one is refused. **The engraving** (decision 7): from Romance 8 her
profile shows "Her ring will read: ‘…’", her R8 beat's line (her Memory's caption); no new field.

### The wedding (RM30, RM42, RM45; decision 9)

Ready the day after the proposal, and **it waits until you play it**. **Play ›** asks **the place** first (her bible's
three `wedding.places`, each on its place card); her authored event then plays on that place's card (its own place steps
give way), **the guests' faces** along its top and one line of narration first ("Stand-in 2 and Stand-in 3 came, in
their best."; with none, "Just the two of you, and the whole farm quiet around you."). **The guests** are every spouse on
the farm (the cast's order), then her two closest friends on the farm (F52's order); they have no lines. **The vow line**
is its last choice point, paying as any choice; your words are kept as the flag `vow:<n>` and the place as
`wedding:<place>` (wording only). Then **the reception**:

<!-- live:reception -->
| The reception | Well fed from tomorrow, everyone on the farm |
|---|---|
| A ★1 dish | 1 day |
| A ★2 dish | 1 day |
| A ★3 dish | 2 days |
| A ★4 dish | 2 days |
| A ★5 dish | 3 days |
| No dish in the Warehouse: Marta’s bakery sends a cake | 1 day (a Rough meal) |

A meal already running is never shortened. **The guests:** every spouse on the farm, then her 2 closest friends on the farm (F52’s order); they have no lines. **The places:** her bible’s `wedding.places`, else her wedding beat’s place and `chapel-bell`, `fields`, `overlook`, `orchard-bench`, three different. **Household milestones** at 5, 10, 15, 20 married (RM45).
<!-- /live -->

The dish is used; `today.reception` holds its days and night step 9 feeds everyone on the farm (home, or a spouse in her
house) from tomorrow. Then `advance` makes her your **spouse** (`wed` is today, so F47's anniversaries follow a year on),
and the stage-up is **Married**: the track gold, the spouse ladder, her ring at her line, her anniversary's date, and
"Married n/N · next household scene at 5". Until F54 she keeps her Dorm bed.

**The words** (decision 10): every string the bench, the proposal and the wedding write says spouse, partner, vows, your
wedding, you; a domain test and a web test scan them, and the stand-in's proposal and wedding, with the validator's
gendered list (`gendersFarmer`).

**The save** (v4, grown in place): `today.ring` (the grade made today, 0 none) and `today.reception` (0–3 days), both
cleared at step 7; `love.ring` 1–10 from the proposal on (the wedding's wait and a spouse); the v4 Warehouse holds rings
and dishes, the bin, the Diary and the morning's bin lines take rings; `buildings.forge = 0` is the bench. The parse
refuses anything else, and v3's refuses a ring or a dish anywhere.

**The format** (decision 11): her bible may carry **`wedding: { places: [place, place, place] }`**, three different story
places; without it the wedding offers her wedding beat's place and the farm's (`chapel-bell`, `fields`, `overlook`,
`orchard-bench`), three different. The stand-in 9000001's are the chapel bell, the orchard bench and the Fields; her
proposal and wedding are written with plays and choices (decision 12).

## Bonds between Umas (RM48–RM50)

**Romance build; live from F56** (F52 decisions 1–11). Each pair of Umas holds **bond points** (`save.bonds`, by `pairKey`
of their character ids, numeric order), **whole**, that **never fall**. They grow when two share a place, five **bond
hearts** come at CS44's thresholds, the authored ties **seed** them, and each new heart opens the pair's
**conversation**. Save v4 only: M4 (save v3) has no bonds, and its `tickBonds` stays a no-op. The rules are
`farm/bonds.ts`.

```
 day 1: the opening brings the three ──► their ties seed: 9000001 & 9000002 150 (♥♥), 9000001 & 9000003 50 (♥)
   │                                      the next morning: "♥♥ Stand-in 1 & Stand-in 2 · bond 2 · Read"
   ▼
 two Umas at the forest all day ──► step 6: +10 a pair (+15 if both favour foraging; ×1.5 more at Romance 4)
   │                                 290 → 300: ♥♥♥, the morning lists "bond 3"
   ▼
 the next night, at the forest again ──► step 4: +10% of each one's night's items, copies into the Warehouse
                                          the morning: "Side by side · +1 item"
```

### Points (RM48; decisions 1–4)

<!-- live:bond-points -->
| Shared | Points | Paid by |
|---|---|---|
| Working the same place the same day (the Fields’ tenders together) | +10 a pair; ×1.5 when both favour that place’s line | `bondsTonight`, night step 6 |
| An expedition party, a day away | +15 a pair | `addBond`, F28 (M5) |
| A festival team | +20 a pair | `addBond`, F32 (M6) |
| The same staff meal, or the same breakfast | +5 a pair | `addBond`, F8 and F54 |
| The same house, a night | +10 a pair | `addBond`, F54 |
| **Romance 4:** her bond with her closest friend | ×1.5 on any of these, once (never ×2.25 when both qualify) | `bondFactor`, in `addBond` |
<!-- /live -->

- **The same place the same day** (decision 2, night step 6, `tickBonds` → `bondsTonight`): every pair among the Umas who
  worked one place today earns +10, once a night: a running job at the day's start (step 4's `worked`), the Fields'
  tenders with a growing block counting as the Fields. **×1.5** when both have the same favourite line (`favouriteOf`)
  and it's that place's (`PLACE_ACTIVITY`; farming for the Fields): two foragers at the forest or the Sawmill, two farmers
  tending. An Uma works one place a day, so a pair earns this once. A v4 night without the pack ticks none.
- **Every other source** is a rule with tests, called by its packet: `addBond(save, pack, a, b, points)` is the one way a
  bond grows (both Umas on the roster, two of them; points ≥ 0).
- **Romance 4** (decision 4): what a pair earns is **×1.5** when either Uma is at Romance 4 or later and the other is her
  closest friend; once, never ×2.25 when both are (`bondFactor`, inside `addBond`).
- **Whole:** each pay rounds once, half up, after its factors: two foragers at Romance 4 and closest friends earn 10 ×
  1.5 × 1.5 = 22.5, so **23**. The parse refuses a fraction on v4 (v3's bonds may be fractional, D30).

### Hearts (CS44)

<!-- live:bond-hearts -->
| Hearts | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Points | 50 | 150 | 300 | 500 | 750 |
| Two at one place every day (+10) | Day 5 | Day 15 | Day 30 | Day 50 | Day 75 |
| Sharing a favourite line there (+15) | Day 4 | Day 10 | Day 20 | Day 34 | Day 50 |
<!-- /live -->

Bonds never fall, and points go on past 750. A **duo move** at 5 hearts is M5's (F28 reads `bondHearts` ≥ 5). A bond
setup on her route ("Bond 3 with Stand-in 2", F47's Ready) reads these hearts.

### The ties' seeds and her closest friend (RM49; decisions 5 and 6)

<!-- live:tie-seeds -->
| Tie strength | Bond starts at | Hearts |
|---|---|---|
| 3 | 150 | 2 |
| 2 | 50 | 1 |
| 1 | 0 | 0 |

The stand-in pack’s ties (invented):

| Pair | Kind | Strength | Seeded at | Authored conversations |
|---|---|---|---|---|
| 9000001 & 9000002 | friends | 3 | 150 | Bond 1, 2, 3, 4, 5 |
| 9000001 & 9000003 | rivals | 2 | 50 | — (the tie’s line) |
| 9000002 & 9000003 | teammates | 1 | 0 | — (the tie’s line) |
<!-- /live -->

- **When both are on the farm:** `arrive` seeds each of her ties whose other Uma is on the farm to `max(points, seed)`
  (`seedTies`): the opening three on day 1 (`joinOpening`), a night's arrivals at step 8 (`arriveUmas`), the chapter's in
  `checkGoals`. Not before: an Uma whose friend hasn't come has no bond yet. **A seed never lowers a bond.**
- **A seeded heart is a new heart:** its conversation opens, and the next morning lists it, so an arriving Uma comes with
  what her closest ties already share.
- **Her closest friend** (`closestFriend(pack, save, id)`): over all her ties, on the farm or not (every Uma has two):
  the strongest, then the most bond points, then `ties.json`'s order. One comparator, `tiesOf`, orders her profile's Ties
  the same way. F51's Friendship 7 perk shows her closest friend's loved gift in Gifts; F54's wedding room defaults to her
  house.

### Side by side (CS17, CS44; decision 7)

<!-- live:side-by-side -->
| Where | Beside a 3-heart partner | How |
|---|---|---|
| A work place (gathering, a station) | +10% of her night’s items | Night step 4 (`nightExtras`), after the hauls: copies of the items her work finished tonight, the same goods and stars, `share × n` whole and one more by `draw(uid, day, 'bond:<id>', 0)`, each picked by `draw(…, k)`; into the Warehouse. Her partner worked the same place today |
| The Fields | Tended growth ×1.1 | Night step 2 (`blockGrowth`): her partner tends another block with a growing plot |
<!-- /live -->

- **Why at night:** a day's haul is planned when its job starts, so a ×1.1 at planning would miss a partner who starts
  later. Side by side pays as a **night extra** at step 4, after the hauls (`nightExtras`, `extrasTonight`), reading the
  bonds as they stand then: a pair whose bond reaches 3 hearts at tonight's step 6 works side by side from the next night.
  uma-work's plans and outputs are untouched. **F51 extends this step** with in her element (×1.2 in place of ×1.1,
  `extrasShare`) and the perks' own pot, the capped romance term ([Perks](#perks-rm31rm36)).
- **The Fields** read it inside `blockGrowth`, so the page and step 2 agree: the block's card says "· side by side" and
  the nights left count it ([fields.md](fields.md#tending-cs12-cs28-cs31-decisions-1-and-2)). Her partner's block must
  have a growing plot: a tender of an empty block isn't working beside her.
- **The morning** says "Side by side · +3 items", the night's extras in all, opening the Warehouse.

### Pair conversations (RM50; decisions 9 and 10)

- **Each new heart opens one conversation**, the pair's at that level. **An authored one** is the pack's
  `pairs/<a>-<b>.json` (RS12: each Uma's two closest ties, at all five levels), named by the two ids in `pairKey` order,
  for a tie's pair only; the game reads it in a partial mode (any levels written so far, each once), and the pack says
  which levels each pair holds (`pack.pairs`, loaded on demand through `pack.pair(a, b)`). The stand-in pack holds
  9000001 & 9000002's five (invented); 9000001 & 9000003 have none, so their tie's line stands in.
- **Without an authored one**, the heart's line is the tie's `line` for a tie's pair, or "<a> and <b> are closer now" for
  another, with no scene. CS46's templates for other pairs stay M6's (F33).
- **Read** plays the pair's opened and unread levels in turn in the scene player (`?read=<a>-<b>:<levels>` over any page,
  `PairPlayer.tsx`): "Stand-in 1 & Stand-in 2 · Bond 1 (1/2) · Fields", each line a tap, the speaker's bust; a choice
  is **wording only**, its options with no gain. The end, or **Skip**, marks every level read, once, into `diary.read` as
  `pair:<a>-<b>:<hearts>` (`readPair`). **It pays nothing.** A replay from the Diary marks nothing new.
- **The morning** lists the bond hearts reached since the last morning, **one line a pair at its highest heart**, in the
  cast's order: "♥♥ Stand-in 1 & Stand-in 2 · bond 2" with **Read** while an authored conversation up to that heart waits
  (a seed from 0 to 2 plays bonds 1 and 2), the heart alone once read, or the tie's line or the generic words. `today.bonds`
  notes each pair's hearts before its first move since the last morning (the opening's day-1 seeds included); step 9
  lists against it, else last night's bonds, and empties it.

### On screen (decision 11)

- **Her profile's Ties** ([above](#her-profile-rm53)): her closest friend first with **Closest**, each bond's hearts and
  "150/300" to the next, and **Read**.
- **The morning** (§4's sixth place): side by side, then the bond hearts.
- **The Diary's Conversations** ([goals.md](goals.md#the-screens)): one row a pair with a heart, its conversations read
  as **Bond n** replays and **♥♥ Read** for the unread.
- **The Fields:** "· side by side" on a block growing ×1.1.

## The night and the morning on v4

What a v4 night adds or changes from v3's ([days.md](days.md) lists the rest):

<!-- live:night-v4 -->
| Step | Function | What happens | Filled by |
|---|---|---|---|
| 2 | `growCrops` | Crops grow: 1 a night untended, the tender’s rate tended, ×1.1 side by side (her tender has a 3-heart partner tending another growing block), ×1.2 for a farmer in her element (Friendship 8); a farmer’s night chores add +0.25 growth each to the untended block with the most growing plots, else hers; plots that reach their days − 0.5 turn Ready | F20, F52, F51 |
| 4 | `nightExtras` | Side by side: an Uma whose work finished items tonight where a 3-heart partner also worked today gets 10% of them again (20% in her element), seeded copies straight into the Warehouse; then the perks’ extras: the bond term × the romance term of the same items (her line’s +10% and +20%, her ring, a dream, the household; held to 40%), their own seeded copies | F52, F51 |
| 4 | `nightChores` | Night chores: a forager’s bring one item each from her rank’s deepest forest area this season, a fisher’s one fish each from her deepest spot, at a day’s haul’s stars, into the Warehouse; 1 from F6, 2 from R7, 3 from S4, on the farm only | F51 |
| 6 | `tickRanks` | Rank points for every Uma who worked, one activity each, ×1.05 from her Friendship 5 and ×1.10 from Friendship 10, ×1.10 more beside a mentor (an Uma at Friendship 9 at her line’s place; one a place, never herself); rank-ups where points and the challenge are met | F21, F47, F51 |
| 6 | `tickBonds` | Bonds: +10 to each pair who worked one place today (the Fields’ tenders together), once a night; ×1.5 sharing a favourite line of that place’s; ×1.5 more when one is at Romance 4 and the other her closest friend | F52 |
| 6 | `payLine` | Her line: +10 to each Uma who worked today at one of her line’s places (a tended block for a farmer), once a night | F47 |
| 7 | `turnCalendar` | The date moves, and the work clock with it: finished jobs turn Ready, queues start their next job; the whole of `today` clears: chats, gifts, praise earned and paid, events, Ask her, evenings and invitations, the ring made and the reception | F18, F47, F49, F53 |
| 8 | `arriveUmas` | Every cast Uma whose authored arrival holds joins, in the cast’s order: home while a bed is free, else away; each of her ties whose other Uma is on the farm starts at its seed (strength 3 → 150, 2 → 50) | F46, F52 |
| 8 | `openRingBench` | The ring bench: the night after the first Romance 8 event anyone played, the Forge stands as the bench (`buildings.forge = 0`), and Ida Stone’s scene is due in the morning | F53 |
| 9 | `serveTheReception` | A wedding’s reception: everyone on the farm well fed from tomorrow for its days (a dish ★1–2 one, ★3–4 two, ★5 three; Marta’s cake one), never shortening a meal already running | F53 |
| 9 | `heartsMorning` | Praise earned overnight (a ★3+ item, a rank-up); birthdays and anniversaries today and tomorrow, an anniversary leaving a ★5 item of her line in the Warehouse | F47 |
| 9 | `morningItems` | Morning items: each Uma on the farm leaves a good of her line in the Warehouse every 4th morning from Romance 2 (★2+), every 2nd from Spouse 2 (★3+) | F51 |
| 9 | `drawInvitations` | Invitations: one Uma asks you for her favourite kind tonight (two from 10 married), drawn by `draw(uid, day, 'invite', n)` among those home at Friendship 2+ whose favourite kind is open to them, weighted 1 + days since her last evening (up to 14) | F50 |
| 9 | `buildSummary` | The morning summary, from what changed; §4 Hearts lists the invitations, the morning items and night chores, the perks’ and side by side’s extras and each pair’s bond hearts reached since the last morning | F18, F50, F52, F51 |
<!-- /live -->

On v4 `checkGoals`' recruit is the chapter's authored arrival, her ties seeded like any arrival's. Step 7 clears v4's whole `today`. The morning's §4 is
**Hearts**, after Ranks, in **RM57's order** (F48 decisions 1 and 9), each line a tap to her profile:

| # | Line | Words | Filled by |
|---|---|---|---|
| 1 | **Ready**, read live from `readiness` as the card shows (never stored): up to three, in the tab's order, then "+N more" (the tab filtered on Ready); a tap plays her event over the morning (`/?event=`, F49) | "● Ready · Stand-in 1 · Friendship 1 · the Fields" with a **Play** tag, "+2 more" | F48, F49 |
| 2 | `{ kind: 'invite', id, evening }`: her invitation this morning (`today.invites`, step 9), with **Yes, tonight** and **Another day**; answered, "Tonight ✓" with **Play ›** (her evening over the morning) or "Another day" | "✉ Stand-in 2: “Walk at dusk tonight?”" | F50 |
| 3 | The house's morning: breakfast and +30s (F54); `{ kind: 'item', id, items }`: her morning item (R2, S2), its stock keys; `{ kind: 'chores', items, growth }`: the night's chores in all, once a night | "♥ Stand-in 2 left you ★3 Shiitake" (her profile); "Night chores · 3 items · +0.25 growth" (the Warehouse, or the Fields for growth alone) | F54, F51 |
| 4 | `{ kind: 'birthday', id, when }` | "★ Stand-in 1's birthday today", "★ Tomorrow: Stand-in 1's birthday" | F47 |
| 4 | `{ kind: 'anniversary', id, when, item }` | "♥ Stand-in 1's anniversary · ★5 Carrot left for you" (`item` the good; null the day before), "♥ Tomorrow: Stand-in 1's anniversary" | F47 |
| 5 | Levels reached overnight (S2, S4) | — | F54 |
| 5 | `{ kind: 'arrived', id, home }` | "Stand-in 4 arrived · away" | F46 |
| 6 | `{ kind: 'perks', items }`: the perks' extras tonight, by the romance term | "Perks · +2 items" (opens the Warehouse) | F51 |
| 6 | `{ kind: 'side', items }`: side by side's extras tonight | "Side by side · +3 items" (opens the Warehouse) | F52 |
| 6 | `{ kind: 'bond', a, b, hearts }`: a pair's bond reached `hearts` since the last morning, one line a pair | "♥♥ Stand-in 1 & Stand-in 2 · bond 2" with **Read**; without a conversation written, "♥♥ Stand-in 1 & Stand-in 3 · bond 1 · Old rivals." (the tie's line) or "♥♥ Stand-in 2 and Stand-in 4 are closer now · bond 1" | F52 |

Within a place the night's order holds: today's lines before tomorrow's, birthdays before anniversaries, each Uma in the
cast's order; morning items before the chores; the perks' extras before side by side before the bond hearts, the pairs in the
cast's order. The section shows whenever a stored line or a Ready Uma is there; an Uma who played an event today isn't
Ready. **There's no pop-up per event:** the morning, her ● Ready chip and **♥ on her pip** wherever the map draws her (a
tender on the Fields, in place of her block's letter; a worker at a place) are the only signals. Pips stay their places'
taps.
The parse refuses an Uma off the roster, a kind twice for one Uma, a morning item with no goods or more than three (or a
stock key that isn't a good at ★1–5), chores twice, with neither items nor growth or growth off a quarter, perks' extras
twice or with no items, an invitation for festival night or an unknown kind, an anniversary's item the day before (or an unknown
good on the day), side by side twice or with no items, a bond line twice for a pair, out of `pairKey` order or outside
1–5 hearts, and words. §5 drops v3's `joined`, Gate and `left` lines.

## For later packets

- **F49 is built** ([heart events](#heart-events-rm24-rm28-rm29-rm54)); its seams for the packets after it are
  [below](#for-f50f56-the-event-players-seams). **F50 is built** ([the evening](#the-evening-rm19rm22-rm37)); its seams
  are [below](#for-f51f56-the-evenings-seams). **F51 is built** ([perks](#perks-rm31rm36)); its seams are
  [below](#for-f53f56-the-perks-seams). **F53 is built** ([the ring and the wedding](#the-ring-and-the-wedding-rm30-rm38rm40));
  its seams are [below](#for-f54f56-the-rings-and-the-weddings-seams). **F54** the homestead (`homestead`,
  `love.house`), her house on the row and the profile, the marks from uma-art 2.26.0; a shared house's +10 a night and the
  same breakfast's +5 a pair go through `addBond`, and a wedding's room defaults to her closest friend's house. **F28,
  F32, F8** pay an expedition party (+15 a day away), a festival team (+20) and the same staff meal (+5 a pair) through
  `addBond`; F28's duo move reads `bondHearts` ≥ 5.
- **A new §4 line:** add its kind to `HeartLine` (`night/summary.ts`) with its parse, give it RM57's place in
  `HEARTS_ORDER` and its words in `heartLine` (`loop/summary-words.ts`).
- Save v4 grows in place until F56; any change after F56 is v5.

### For F50–F56: the event player's seams

- **Rules** (`@farm/domain`): `playEvent(save, pack, id, { event: { id, steps }, picks, plays })` → `{ save, card }`
  (`EventCard`: `event`, `choices`, `plays`, `chosen`, `sum`, `paid`, `carried`, `learnt`, `taken`, `perk`, `memory`,
  `unlock`, `answer`, `stage`, `line`, `next`); `askHer(save, id, answer)`, `canAsk`, `askSteps`; `walkScene(steps, picks,
  { flags, plays })` / `sceneSteps` (`when`, plays' `good` and `miss`); `extraPlay`, `pathPlays`, `optionViews`,
  `takeLowest`, `choicePointsOf`, `replaySteps`, `beatOf`, `EVENT_POINTS`. The plays: `castPlan`/`castScore`,
  `rhythmPlan`/`rhythmScore`, `pickGoods`/`pickPlan`/`pickScore`, `walkFavourite`/`walkPlacesOpen`/`walkPlan`/`walkScore`,
  `choosePlan`/`chooseScore`, each with an `event` and an `evening` length; `gradeOf`, `EVENT_GRADE_POINTS`,
  `EVENING_GRADE_POINTS`, `timingScore`, `playSeed(uid, day, id, rung, k)`; `PLAY_MAP`, `playOf`, `togetherPlay`.
- **Screens** (`apps/web/src/loop/`): `PlaySheet` with `playSpec(save, pack, id, as, 'evening', seed)` plays any of the
  five at an evening's length (**F50**); `LevelUpCard` (any `EventCard`, so **F54**'s night levels can show one) and
  `StageUpScreen` (`EventCards.tsx`; **F53** adds the proposal's and the wedding's stages); the player's
  `?event=`, `?ask=` and `?memory=` (`memoryParam`) over any page; `event-view.ts`'s `placeCard`, `eventTitle`,
  `optionWords`, `sumWords`, `stageOpens`, `setupAdvice`, `albumTiles`.
- **F53:** `playEvent` plays the proposal and the wedding as any event until F53 adds the ring's use, the wedding's place,
  dish and vow, and their stage-up screens; their limits (three plays, 1–3 choice points) are the validator's.
- **F51:** the signature dish's recipe (F4) is written where `playEvent` gives the rung's perk.
- Save v4 grows `today.asked` (Ask her once a day), cleared at step 7.

### For F53–F56: the perks' seams

- **Rules** (`@farm/domain`, `romance/perk-terms.ts`): `routeIndex(love)`, `hasPerk(love, rung)`, `rungOfPerk(id)`,
  `homeOrHoused(save, id)`, `linePlaceOpen(save, pack, id)`, `atHerLine(save, pack, id, place)`; `romanceTerms(save, pack, id,
  place)` → `{ line, ring, own, dream, household, crew, total, held }` and `romanceBonus` (its `total`), `ringBonus(love)`,
  `householdBonus(married)`, `dreamActs`, `dreamAt`; `inElement`, `IN_ELEMENT`; `keepsakeQuality(save, pack, id, place)`,
  `KEEPSAKE_QUALITY`, `KEEPSAKE_GROWN`; `choresOf(love)`, `MAX_CHORES`; `morningRule(love)` → `{ every, stars, from }`,
  `morningDue(rule, day)`, `morningsToItem(rule, day)`, `MORNING_ITEMS`; the caps `LINE_BONUS`, `OWN_CAP`, `DREAM_BONUS`,
  `HOUSEHOLD`, `CREW_CAP`, `ROMANCE_CAP`. `romance/perk-effects.ts`: `choresTonight`, `fieldChores(save, pack)`,
  `gatherChores(save, pack, talentOf)`, `lineQuality`, `leaveMorningItems(save, pack, talentOf)`, `MORNING_ITEM_N` (1),
  `mentorsTonight`, `mentorAt`, `MENTOR_POINTS`, `signatureDish`, `giveSignatureDish`, `lineGrade`, `dishId`, `dishName`,
  `LINE_DISH`, `DISH_WORDS`, `breakfast(save, pack)` → `{ save, fed }`, `BREAKFAST_DAYS`, `CHORE_LINES`, `CHORE_GROWTH`. The
  shared rules take the pack where a perk reaches them: `loopKinds(talentOf, pack)`, `planHaul(…, pack)`,
  `harvest(…, talentOf, pack)`, `harvestAll(…, talentOf, pack)`, `growFields(save, talentOf, pack, chores)`,
  `blockGrowth(…, talentOf, pack)`, `tenderTerms(…, talentOf, pack)`, `extraCropChance`, `extrasShare(…, pack)`,
  `perksShare`, `extrasTonight(…, pack)` → `{ save, extras, perks }`; `PointTerms.mentor`; `WorkTerms.keepsake`,
  `TenderTerms.keepsake`, `QualitySources.keepsake`; `HarvestReceipt.perks`; `EventCard.recipe`.
- **F53:** her ring's bonus is `love.ring` in her own term from the wedding (`ringBonus`, inside her 35%); S5's vow
  renewal grows her keepsake by level alone (`hasPerk(love, 's5')`), and R8's engraving is the bench's words.
- **F54:** her house's morning calls `breakfast(save, pack)` for a resident with S1 (`hasPerk(love, 's1')`), and leaves her
  house's extra morning item with `lineGood(…, n = 2)` into her `item` line (`items` holds up to three); the house's
  `+30`s go before the items in §4's third place. `homeOrHoused` already counts a spouse in her house (`love.house`) for
  chores, morning items and breakfast; S2 at night goes through `advance`, which starts her every-2nd-morning count.
- **M5, M6:** the Mine's and the Quarry's chores and +10% (chapter 3), the ranch's pen (chapter 2) and the workshops'
  (+10% as the assistant, +1 dish, +1 cover, 5% back) join `CHORE_LINES` and the romance term's places when their packets
  build the places; the Kitchen (F8) reads `workshops.recipes`, her signature dish among them, and a staff meal replaces a
  breakfast.
- **Save v4 grows** `love.morning` (from R2) and `love.dish` (from F4), and §4's `item`, `chores` and `perks` lines.

### For F51–F56: the evening's seams

- **Rules** (`@farm/domain`, `romance/evening.ts`): `EVENINGS` (RM37's table: `name`, `short`, `hangout`, `date`, `play`,
  `waits`, `question`), `kindBuilt(kind)`, `kindOpens(love, kind)`, `eveningRole(love)` → `'hangout' | 'date' | 'spouse'
  | null`, `homeTonight(save, id)`, `favouriteKind(pack, id)`, `eveningSlots(save)` → `{ evenings, festival }`,
  `slotsLeft(save)`, `eveningMarks(save)`, `kindsNow(save, id)`, `eveningUmas(save, pack)`, `tonightOpens(save, pack)`,
  `eveningFactors`, `eveningPoints(grade, factors)`, `eveningPreview`, `inviteDue`, `invitePoints`, `eveningSeed(uid, day,
  id, kind)`, `spendEvening(save, pack, id, kind, score, birthday)` → `{ save, card }` (`EveningCard`), `inviteWeight`,
  `inviteCandidates`, `drawInvites(save, pack)`, `answerInvite(save, id, answer)`, `invitedNow(save, id)`; in `save/v4.ts`
  `EVENING_KINDS`, `FESTIVAL_NIGHT`, `InviteKind`, `marriedCount(save)`, `eveningsOn(day, married)`, `invitesFor(married)`,
  `TWO_EVENINGS_MARRIED` and `SECOND_EVENING_EVERY`.
- **F54:** `homeTonight` already counts a spouse in her house (`love.house`); `tonightOpens` is where "a house waits to be
  picked" joins (Tonight's **Sleep at** row goes between the Evening rows and CS6's line in `loop/Tonight.tsx`), and
  `marriedCount` is RM45's count. **F8** and **F32** clear `waits` on cooking and the footrace when their games ship
  (the kinds then offer themselves, and their invitations with them). **M7** moves the evening's play onto the stage.
- **Screens** (`apps/web/src/loop/`): `?evening=pick` and `?evening=<characterId>` over any page (`EveningPlayer.tsx`),
  `Tonight` (End the day's sheet on v4 while `tonightOpens`), `InviteAnswer` under the morning's invitation line,
  `withNightFade(night, reduced)` around every v4 night, and `PlaySheet`'s `pays` for an evening's own numbers.

### For F54–F56: the ring's and the wedding's seams

- **Rules** (`@farm/domain`): `romance/bench.ts`: `benchOpen(save)`, `benchDue`, `openBench` (night step 8's
  `openRingBench`), `BENCH_RUNG`, `RING_INPUTS`, `MINING_FAMILIES`, `MINING_CHAPTER`, `forgeRecipe(grade)`, `benchTakes(chapter,
  id)`, `benchStock(save, grade)`, `benchPick(save, grade)`, `benchGrades(save)`, `benchRefusal`, `makeRing(save, inputs)` →
  `{ save, ring }`, `BENCH_WORDS`, `RING_PERCENT_A_GRADE`, `MAKE_BONUS`, `ringPercent(grade)`, `heldRings(save)`,
  `betterRings(save, id)`, `giveRing(save, id, ring)`, `takeOne`. `romance/wedding.ts`: `weddingPlaces(pack, id)`,
  `WEDDING_DEFAULTS`, `weddingPlaceFlag`, `weddingPlaceOf(flags)`, `vowFlag(n)`, `receptionDays(stars)`, `CAKE_DAYS`,
  `Reception`, `receptionDishes(save)`, `receptionOf(save, reception)`, `serveReception(save, days)` (night step 9's
  `serveTheReception`), `WEDDING_FRIENDS`, `weddingGuests(save, pack, id)`, `anniversaryOf(wed)`, `HOUSEHOLD_AT`,
  `nextHousehold(married)`, `ringHeld`. `playEvent`'s `EventOutcome` takes `ring`, `place` and `reception`; its `EventCard`
  gives `stage` (`'romance' | 'engaged' | 'married'`, `StageUp`), `ring` and `wedding` (`WeddingCard`: `place`, `dish`,
  `stars`, `days`, `guests`); `EventPack` now holds the ties. The goods: `RING_FAMILY`, `GOOD_FAMILIES_V4`, `RING_PRICES`,
  `RING_IDS`, `RING_GOODS`, `ringId`, `isRingId`, `ringGrade`, `ringName`, `isGoodIdV4`, `dishName` and `DISH_WORDS` (moved
  from the perks), `isWarehouseIdV4` and `isStockId`; the Diary's `RING_ROW`, `DIARY_ROWS_V4` and `diaryRowsOf(version)`;
  `story/bench.ts`' `BENCH_SCENE_LINES`, `scenes.ts`' `BENCH_SCENE`; the format's `gendersFarmer(text)` and `WeddingPlan`.
- **F54:** a wedding's room (RM42) defaults to her closest tie's house; the Married screen's "Opens now" is where "her
  room" and "house mornings with her" join (`stageOpens('married', …)` in `loop/event-view.ts`), and the reception's
  `serveReception` already counts a spouse in her house. The household milestones read `marriedCount` and `nextHousehold`.
- **M5, M6:** F26 (chapter 3) opens the mining families' refined goods at the bench, which is CS25's own recipe; F8's
  Kitchen puts dishes in the Warehouse, which the reception already serves; F36 stores a ring's make with its +1/+3/+5 (a
  v5-or-later change), and chapter 7 lights the Forge's fire beside the bench.
- **Screens** (`apps/web/src/loop/`): `?sheet=bench` (`BenchSheet.tsx`, its `BenchPeek` the Forge's quick look on v4),
  `BenchScene.tsx` (from `ScenePlayer.tsx`), `bench-view.ts`, `bench-actions.ts` (`makeRingOnce`, `giveBetterRing`,
  `readBenchScene`), the event player's `RingPicker`, `PlacePicker` and `ReceptionPicker`, `StageUpScreen`'s `stage` and
  `married`, `event-view.ts`' `STAGE_WORDS`, `stageOpens(stage, line, facts)`, `marriedWords`, `guestsLine`,
  `receptionWords`, `PICKER_WORDS`, and `hearts-view.ts`' `ringView` and `engravingOf`; `farm-map.ts`' `BENCH_LOCK`.
