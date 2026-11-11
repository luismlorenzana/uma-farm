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
stand-in scene with the same choice and pay. F47 grows `addLove` with the ladders' costs and banking.

## Her favourite line and tastes (RM6, RM7)

- **Her favourite line** is her bible's `favouriteLine`, else her cast entry's `calling` (`quarry` is mining, at the
  Quarry): never master data's strategy. It sets ×1.2 rank points in that activity (CS33 kept, read from the pack at
  night step 6) and the mark on her face card; F47 adds +10 a night at her line, F51 her perks there.
- **Her line's places:** farming the Fields; foraging the forest and the Sawmill; fishing the Fishery and the
  Smokehouse; mining the Mine and the Smelter, or the Quarry and the Cutter when her calling is `quarry`; ranch the Coop
  and the Barn; cooking, serving and forging the Kitchen, the Restaurant and the Forge.
- **Her tastes** are her bible's: one loved, three liked and two disliked by goods id; everything else neutral, and a
  proposed good neutral until it's in `goods/ids.ts` (`tasteOf`, for F47's gifts).
- **Until F47** the romance build hides Chat, Gift and the hearts on the roster, and step 6's hearts factor is ×1.

## The night and the morning on v4

Step 8 on a v4 save (the other steps as [days.md](days.md) lists them):

<!-- live:night-v4 -->
| Step | Function | What happens | Filled by |
|---|---|---|---|
| 8 | `settleDorm` | The Dorm’s level bought takes effect; swaps arrive, each Uma away coming home in the place of one leaving | F23 |
| 8 | `arriveUmas` | Every cast Uma whose authored arrival holds joins, in the cast’s order: home while a bed is free, else away | F46 |
| 8 | `checkGoals` | The Diary pays its milestones and rows, the Farm Rank is recomputed, and a chapter whose goals are met completes: its gold, plans and recruit | F24 |
<!-- /live -->

On v4 `checkGoals`' recruit is the chapter's authored arrival. Step 7 clears v4's whole `today`. The morning's §4 is
**Hearts** (`arrived` lines; F47–F54 add theirs and F48 draws the section), and §5 drops v3's `joined`, Gate and `left`
lines.

## For later packets

- **F47** grows `love` (the ladders, costs, banking, chats, gifts with `tasteOf`, praise, her line's +10) and the
  hearts factor; **F48** the Hearts tab, her profile and the morning's Hearts section; **F49** heart events and Memories
  (`memories`); **F50** the evening and invitations (`today.evenings`, `today.invites`); **F52** bonds from the ties;
  **F53** the ring and the wedding; **F54** the homestead (`homestead`, `love.house`).
- Save v4 grows in place until F56; any change after F56 is v5.
