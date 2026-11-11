# F46 — Save v4 and the authored start: the wipe, the farmer's name, the opening, arrivals, the Dorm for 20

**uma-farm · Claude · L · Needs: F41 read (accepted whole, D47) · Unblocks: F47, and through it every romance-core
packet; F56 ships what this starts · Milestone: the romance core**

## Why

The romance core (RM66) turns the farm from three random picks into the owner's authored cast: twenty Umas who arrive
when the story says, each one character keyed by her character id, each with a route. Everything after this packet
reads what it lays down: save v4 (the wipe, the new keys, the romance's slots), the story pack's runtime shape with the
stand-in in git, the dark switch that keeps production on M4, the farmer's name, the opening with the three priority
Umas, authored arrivals in place of the Gate and the chapter recruits, and the Dorm for 20. It's the first save change
since the go-live, and it sets the pattern F47–F55 follow while the romance core is built dark.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM1–RM10** whole, **RM58** and **RM59** (the pack and the dark
  build), RM65's rows for FC16, FC17, FC24, FC31, CS2, CS3, CS33–CS36, CS42, CS43, CS53 and CS54, RM67's F46 row, and §0's
  words. RM11, RM13 and RM14 for what the arrival scene pays into.
- [core-spec.md](../../design/core-spec.md): CS2, CS3, CS33–CS36, CS42, CS43, CS53, CS54, as RM65 amends them.
  [core-loop.md](../../design/core-loop.md): FC16, FC17, FC24, FC31.
- [decisions.md](../../decisions.md): **D29** (the dark launch; v3 grew in place), **D30** (v3's shape, `newSave`, the
  strict parse, `StoredSave`, the boot's migration committed without stamping), D37 (`joinRoster`, the Dorm, the Gate,
  `recruitFor`, F23's (k)), D38 (the scene player, chapter 1, the go-live's owner-save tests), **D42** (the format, the
  validator, the arrival plan, the opening's three), D43 (26 rungs), **D44** (the wipe, the priority Umas), D46, D47.
- [F40-story-authoring.md](F40-story-authoring.md): the formats and D47's seven additions; this packet makes the first
  (`arrival`).
- The manual: [roster.md](../../game/roster.md), [goals.md](../../game/goals.md) (chapter 1, the scenes),
  [architecture.md](../../game/architecture.md) (save history, v3's shape, the go-live, the production-save rules),
  [days.md](../../game/days.md) (the night's step 8, the morning), [ranks.md](../../game/ranks.md) (the favourite line).
- Code:
  - `packages/domain/src/save/`: `v3.ts` (`SaveV3`, `newSave`, `RosterUma`, `pairKey`, `picksLeft`, `onFarm`),
    `save.ts` (`SAVE_VERSION`, `NEWEST_SAVE_VERSION`, `StoredSave`, `parseSave`, `versionOf`, `touched`), `parse.ts`,
    `parse-v3.ts` (`SAVE_V3_KEYS`, `parseSummary`), `migrate-v3.ts` (the pattern);
  - `packages/domain/src/farm/`: `farm.ts` (`BEDS`, `bedsAt`, `dormLevelFor`), `dorm.ts` (`DORM_LEVELS`, `joinRoster`,
    `settleDormNight`), `start.ts`, `visitors.ts` (`gateNight`, `recruitFor`, `giftTaste`, `CHAT_LINES`), `talents.ts`
    (`talentResolver`, `temperament`), `rank-rules.ts` (`favouriteActivity`, `tickRankRules`, `affinityPoints`),
    `places.ts`, `milestones.ts`, `diary.ts`;
  - `packages/domain/src/story/`: `authored.ts` (the format and validator), `authored.fixture.ts` (the stand-in),
    `cast.ts`, `chapters.ts` (`completeChapter`, `checkGoalsNight`), `scenes.ts` (`sceneDue`, `readScene`),
    `chapter-1.ts` (`OPENING_SCENE`, `CLOSING_SCENE`, `sceneLines`, roles);
  - `packages/domain/src/night/`: `end-day.ts` (`NightContext`, the nine steps, `gateVisitors`, `checkGoals`,
    `rosterNews`), `summary.ts`;
  - `apps/web/src/`: `save/game.ts` (`boot`, `playable`, `commit`, safety copies), `loop/boot.ts`, `loop/actions.ts`
    (`change()`, `endTheDay`), `loop/talents.ts`, `master/master.ts` (`MasterView`), `shell/Shell.tsx`, `shell/Bars.tsx`,
    `loop/StartPicks.tsx`, `loop/ScenePlayer.tsx`, `loop/GatePeek.tsx`, `loop/DormPage.tsx`, `loop/RosterPage.tsx`,
    `loop/Affinity.tsx`, `loop/summary-words.ts`, `home/AccountView.tsx`, `vite.config.ts`, `package.json`'s `build`;
  - `apps/api/src/save/` (the repositories' version-bump backup and rescue, and their tests);
  - `scripts/check-size.mjs` (`LAZY_MODULES`); `tools/story-sandbox/` (it validates with the domain's code);
  - `git show 3d2e0b5:apps/web/src/app/loop.ts`, `.env.loop` and `vite.config.ts`: F17's switch, the model here.

## Decisions made

### From the spec

- **RM1, the farm's Umas are only the authored cast:** the 20 SS Umas now (D42), S and A later in waves. What goes:

  | What | Where it was | Now |
  |---|---|---|
  | The 272-outfit pool | FC16, CS35, `gateNight`'s draw | Gone: only the cast's characters are on the farm |
  | Six start cards, three picks, one redraw | CS2, `startSheet`, `StartPicks.tsx` | Gone: the opening three are authored (RM9) |
  | A Gate visitor every fourth morning, staying at 2 hearts | CS35, `gateNight`, `GatePeek.tsx`, `STAY_AFFINITY` | Gone: arrivals are authored (RM4); the Gate is where she walks in |
  | A chapter's recruit for the weakest activity | CS35, `recruitFor` | The chapter's authored arrival |
  | Festival, request and expedition recruits | CS40, CS37, CS49 | Gone (their packets are M5's and M6's; nothing to remove here) |
- **RM2, one outfit per character:** the cast file's `outfitId` names it; her face, talents (CS27) and temperament
  (CS46) read that outfit. When the story session changes it, her talents follow on the next boot (talents aren't saved).
- **RM3, the roster is keyed by character id:** `roster`, `dorm.home`, `work`, `bonds`, `love`, `today`. Her outfit is a
  lookup, `outfitOf(characterId)`, from the pack. `pairKey` keeps its numeric sort. A character the release doesn't hold
  (the stand-in, or one a release drops) shows a lettered disc and reads D talents.
- **RM4, arrivals are authored:** each Uma's `arrives` (F40's `Arrival`), checked each night at step 8:

  | Arrival | When she arrives |
  |---|---|
  | `opening` | The opening scene, day 1 (RM9) |
  | `chapter` *n* | The night chapter *n* completes, in place of `recruitFor` (chapter 1 now; 2–7 with M5 and M6) |
  | `festival` | The morning of that festival's day (year 1's Flower Show, Fishing Derby, Cooking Contest and Harvest Cup; year 2's Flower Show), built or not |
  | `beds` *n* | The morning the Dorm's level *n* takes effect (levels 4–8) |
  | `event` | The morning after another Uma's named event plays |

  - **Her arrival scene** plays the next time you open the farm: a short scripted scene, "event zero" of her route, that
    pays **+50 and its choice (+10 or +30)**.
  - **No bed free:** she joins away (CS36 kept), and the Dorm's swap brings her home. Her chats and gifts work from the
    day she joins; her events and evenings need her home.
  - **The Gate's quick look** says what brings the next arrival, never who: "Next: chapter 2's end · the Dorm's level 4
    · the Fishing Derby".
- **RM5, the Dorm for 20:** eight levels; CS34's prices kept level for level; levels 4–8 each bring an arrival; spouses
  leave the Dorm for the houses later (F54).

  | Level | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  |---|---|---|---|---|---|---|---|---|
  | **Beds** | 3 | 5 | 7 | 9 | 11 | 14 | 17 | 20 |
  | **Costs** | — | 1,000 | 3,000 | 8,000 | 15,000 | 28,000 | 50,000 | 85,000 |
  | **Farm Rank** | — | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
  | **Brings** | | | | an arrival | an arrival | an arrival | an arrival | an arrival |
- **RM6, her favourite line is her bible's `favouriteLine`;** the cast file's `calling` is the fallback (a missing
  bible: the stand-in) and places a miner at the Mine or the Quarry. `favouriteActivity(outfit.line)` goes. It sets ×1.2
  rank points in that activity (CS33 kept), +10 a night at her line (F47), her perks' place (F51) and the mark on her
  face card. Her line's place: farming the Fields; foraging the forest and the Sawmill; fishing the Fishery and the
  Smokehouse; mining the Mine and the Smelter, or the Quarry and the Cutter when her calling is `quarry`; ranch the Coop
  and the Barn; cooking, serving and forging the Kitchen, the Restaurant and the Forge.
- **RM7, her tastes are her bible's:** one loved, three liked, two disliked, by goods id; everything else neutral.
  CS45's family rule (`giftTaste`) and F8's dish-by-stat rule go. A proposed good counts once it's in `goods/ids.ts`;
  until then that slot is neutral.
- **RM8, the farmer's name:** the first screen on a fresh farm is one field, "What should they call you?": 1–16
  characters (letters, spaces, apostrophes, hyphens), trimmed, no default (a grey "Farmer" placeholder). Stored as
  `farmer.name`, it fills `{farmer}` in every line; renamed any time from Menu → Account. No pronouns, no gender, never
  drawn.
- **RM9, the opening,** day 1: (1) the name; (2) "The Overgrown Farm", re-cut: the Mayor at the gate, Old Ben's nine
  Carrot seeds and the tended row, Marta's shop and the bin; its lines are original and stay in git; (3) the opening
  three walk in one at a time, each with her arrival scene: the cast file's `opening`, a farmer, a forager and a fisher,
  the owner's priority Umas (D44); (4) chapter 1's card, and the first tap is planting. No picks and no redraw.
- **RM10, save v4 is a wipe:** any v1, v2 or v3 becomes a fresh v4: day 1, 500g, Block A, 9 Carrot seeds, the farmer's
  name empty. `account` is kept exactly as stored, so `updatedAt` doesn't move until the player's first change (the
  name). The server's version-bump backup copies the stored v3 to `saveBackups/{uid}-v3` on the first v4 write; a v3
  upload over a stored v4 is refused into `saveRescues`. Nobody edits production by hand. **v4 grows in place while the
  romance core is dark (D29); M5 then takes v5–v8.**

  | | v4 |
  |---|---|
  | **Adds** | `farmer: { name }` · `love` · `homestead` · `memories` · `arrivals` · `today`: + `praised`, `events`, `evenings`, `invites` |
  | **Re-keys** | `roster`, `dorm.home`, `work`, `bonds` by character id |
  | **Drops** | `start` (picks), `visitors` (the Gate), `RosterUma.affinity` (now `love`) |
  | **Keeps** | Everything else in v3 |

  ```ts
  interface Love {
    stage: 'friendship' | 'confession' | 'romance' | 'proposal' | 'wedding' | 'spouse'
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
- **RM59, built dark on the stand-in:** behind `VITE_FARM_ROMANCE=1` (D29's pattern), production on M4 while it's built.
  In git: the format, the validator and a stand-in pack (9000001–9000003: a cast, ties, one full route of 26 events plus
  an arrival, a pair and a household file; the pair and the household file come with F52 and F54). Production turns on
  with F56.

### Decided here (the spec left these open)

1. **The save-version call, for the whole romance core:** **v4 is the wipe, and it grows in place from F46 to F55 while
   the romance core is dark**, as v3 did in M4 (D29, RM10). Each packet's additions land with parse tests; a dev save
   from an earlier packet may need resetting. **F56 ships v4; any change after F56 is v5,** and M5's packets take
   v5–v8 (RM65). Every romance-core packet says so.
2. **The wipe runs in the app, not in `parseSave`.** RM10 words it as the parse returning a fresh v4; built that way,
   the API (shared with production and deployed on every push) would hand the live M4 build a v4 it can't play, and a
   server would be handing out a save it made (FM10). So, D29's pattern:
   - `parseSave` returns the save as stored, `StoredSave = SaveV2 | SaveV3 | SaveV4` (a v1 still reads as v2);
     `NEWEST_SAVE_VERSION` is 4; **`SAVE_VERSION` stays 3** (what production writes) until F56.
   - `freshV4(stored)` is pure: `newSaveV4` with the stored `account` copied whole (uid, `createdAt`, `updatedAt`).
     The romance build's boot (`playable`) turns any v1–v3 it meets (on the device, from the server, in a 409, from a
     safety copy) into it and commits it **without stamping**, so it uploads and the server backs up the v3. The first
     stamp is the name (decision 11).
   - **A dirty v3 on the device is kept first** as a safety copy (the store's `addSafetyCopy`, reason `wiped`), so
     unsynced progress never disappears silently. Account lists it; a pre-v4 copy offers no Restore (it would wipe
     again).
   - The M4 build stops at a v4 with the update prompt, as the Wilds' build stopped at a v3 (F17 e).
3. **One domain, two versions, while dark.** v3's rules, tables and tests stay exactly as live: the M4 build plays
   them. What the romance changes keys off the save's version (a v4 rule, table or branch), **never the flag**, which
   only picks the web's build. The shared rules (the Fields, gathering, stations, ranks, the bin, the night) take
   `FarmSave = SaveV3 | SaveV4` or a base both satisfy. F56 deletes v3's play (the start, the Gate, affinity, CS34's ten
   levels) once v3 is only ever wiped; v1–v3's parse stays, since the API reads the owner's stored v3 and refuses stale
   uploads.
4. **The switch,** as F17's: `romanceOn()` in `apps/web/src/app/romance.ts`, read at call time; `VITE_FARM_ROMANCE=1` in
   `apps/web/.env.development` (the dev server) and a new `.env.romance` (both tracked with `!` lines in `.gitignore`,
   as F17 did; `dist-romance/` ignored); `pnpm build` size-checks the deployed build, then `vite build --mode romance
   --outDir dist-romance` with `check-size.mjs dist-romance`. **Vitest's default is off,** so M4's 106 web tests run
   unchanged; the romance's web tests turn it on per file (`vi.stubEnv`). `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
5. **The roster's key and one resolver.** The shared rules call the roster's key `UmaId` (an outfit id on v3, a
   character id on v4; both the same form, `isOutfitId`'s pattern). Every place a roster id meets master data (faces,
   busts, names, talents, temperaments, pickers) goes through one resolver, `outfitOf(id)`: identity on v3, the pack's
   cast on v4. `talentsFor` becomes the release's table composed with it, so the night, the Fields and the pickers read
   the right outfit with no other change. uma-work's `outfitId` field holds the roster's key; it's an opaque id, so
   nothing is forked.
6. **The pack at runtime.** `StoryPack` in `@farm/domain/story`: the cast, the ties, the bibles by character id, and
   which events are scripted (`scripted: Map<characterId, Set<eventId>>`); the scripts themselves (`routes/<id>`) load on
   demand. Pairs (F52) and the household file (F54) join it with their packets.
   - **The stand-in pack lives in git** in the pack's layout (cast, ties, `umas/<id>`, `routes/<id>`), invented and
     original: 9000001 (a farmer, outfit `900000101`) with her whole route (the arrival and 26 events), 9000002 (a
     forager, `900000201`) and 9000003 (a fisher, `900000301`) with their arrival scenes only, so "still being
     written" is exercised. None of the three outfits is in master data: they show lettered discs and read D talents
     (RM3). `authored.fixture.ts` reads from it. Tests build larger invented casts (9000004 onward) where they need
     chapter, festival and beds arrivals.
   - **The dark build loads the stand-in** from a lazy module through one loader seam (`loadStoryPack()`); F56 swaps
     the seam to the private pack. The boot waits for the pack where it needs the cast (the opening, the night), as it
     waits for master data.
7. **v4's shape, written whole now from RM10** (F17's pattern), the later packets' slots included, so each fills its own:

   ```ts
   type CharacterId = string                       // master data's character id (P8)
   interface SaveV4 {
     version: 4
     account: Account                              // as stored; the wipe never changes it
     farmer: { name: string }                      // '' until the name sheet
     calendar, gold, items, bin, work, fields, crops, ranch, places, buildings, tools, workshops, expeditions,
     board, diary, farm                            // as v3 (`work` keyed by character id)
     today: { chats: CharacterId[]; gifts: CharacterId[]; praise: CharacterId[]; praised: CharacterId[]
              events: CharacterId[]; evenings: { with: CharacterId; kind: string }[]
              invites: { id: CharacterId; kind: string; answer: 'yes' | 'no' | null }[] }
     roster: Record<CharacterId, { joined: number; ranks: Record<Activity, RankState>; wellFed: number }>
     love: Record<CharacterId, Love>               // one per roster Uma, from the day she joins
     dorm: { level: number; home: CharacterId[]; swaps: DormSwap[] }     // levels 1–8
     homestead: { houses: { name: string; extended: boolean }[]; tonight: number | null; slept: number[] }
     memories: Record<CharacterId, string[]>       // her route's event ids played, in order
     arrivals: CharacterId[]                       // arrival scenes played or skipped
     bonds: Record<string, number>                 // pairKey of character ids
     summary: MorningSummaryV4 | null              // v3's, with §4 `bonds: []` replaced by `hearts`
   }
   ```

   - `today.praise` (who earned praise today) is beyond RM10's list: F47 needs it, since praise is earned overnight or
     by day and the summary can be put away. The element types of `evenings` and `invites` are F50's to refine in
     place; `homestead` is F54's (house 0 is the Farmhouse; `slept[i]` the last night slept there, 0 never).
   - **The parse** is strict as v3's: unknown keys refused, ids by form, `love` exactly the roster's keys, `memories`
     and `arrivals` within the roster, Love's fields in range (a level 0–10, spouse 0–5; points finite and ≥ 0; `last`
     and `evening` ≤ today; `friend` only while the confession waits; `ring` only from the proposal on; `wed` and
     `house` only for a spouse), `farmer.name` empty or within decision 11's rule, the Dorm's level 1–8 with home ≤ its
     beds, and v3-only keys (`start`, `visitors`, `affinity`) refused. Each later packet adds the checks for what it
     fills.
8. **Arrivals are state, checked at step 8.** On a v4 save, step 8 is `settleDorm` → **`arriveUmas`** (in place of
   `gateVisitors`) → `checkGoals`. `arriveUmas` joins every cast Uma not on the roster whose arrival holds: a festival's
   day has come (`calendar.day` ≥ that festival's day in its year), the Dorm's level in effect is at least *n*, or the
   named event is in another Uma's `memories`; a chapter's arrival joins inside `completeChapter` (its `recruit` on v4 is
   the chapter's authored arrival), so the Diary's "Umas recruited" counts her the same night, as F24 has it. Each Uma
   arrives once (the roster guards it); several arriving the same night join in the cast's order. A cast Uma whose
   trigger has already passed (a later wave's) arrives the next night. Joining is `arrive(save, id)`: `joinRoster`
   (home while a bed is free, else away) and her `love` entry at Friendship 0 with 0 points. The opening three join
   when the opening scene is read (decision 9). "Umas recruited" milestones stop at 20 by themselves (a cast of 20):
   no table change.
9. **The opening's order:** while `farmer.name` is empty the **name sheet** covers everything (as F23's picks did);
   then `scene:1:open`, re-cut for v4 (no hello lines; the Mayor's welcome says `{farmer}` once; it ends "Three Umas
   come up the road."); **reading or skipping it joins the opening three** (a player's change, stamped, as F24's scene
   reads are); then each one's arrival scene, `arrival:<id>`, in the cast's `opening` order, the third ending on
   chapter 1's card and **Plant the carrots**. Later arrival scenes play the next time the farm opens with the morning
   summary put away, in arrival order, after any chapter scene due. On v4 `sceneDue` reads this order; v3's is unchanged.
   The closing scene's "newest hand" is chapter 1's authored arrival, by her name from master data; her arrival scene
   follows it.
10. **The arrival scene plays authored steps.** F24's scene player grows to play the format's steps: `say` (her bust
    from master data, or a disc; the line with `{farmer}` filled; the emote as a word chip until F49's marks), `narrate`,
    `thought` (italic), `place` (the scene's title line), `wait`, `flag` (into `love.flags`) and `choice`. **Choices show
    their gain on the button before the tap:** the option with the highest authored gain pays **+30**, every other
    **+10** (a tie at the top pays +30 to each); a choice's `then` plays after it. **Skip jumps to the next choice,
    never past it,** so every arrival pays. On its end it pays **+50 and the choice** into her `love.points` (through
    `addLove`, which F47 grows), adds her to `arrivals`, and stamps once. An arrival event has exactly one choice point
    and no `play` step (the validator says so).
11. **The farmer's name:** letters of any script (`\p{L}`), spaces, apostrophes (`'` and `’`) and hyphens; trimmed, inner
    runs of spaces collapsed to one; 1–16 characters after that. **Continue** is disabled until it's valid; the words
    say why ("Letters, spaces, ' and - only"). Entering it is the fresh farm's first player change, stamped once. Menu →
    Account gains **Your name** with the same rule (a player's change, stamped). `{farmer}` is filled at display time;
    the save holds ids and the name, never story text.
12. **The Dorm on v4** reads RM5's table (`DORM_LEVELS_V4`): `buyDorm`, `bedsAt`, `nextDorm`, `farmRankOpens` and the
    parse by version; v3 keeps CS34's ten levels. The Dorm's page says "Level 4 · 9 beds · someone new arrives" for a
    level that brings an arrival (never who).
13. **Her favourite line and tastes on v4:** `favouriteOf(pack, id)` (bible, else the calling: `quarry` is mining at
    the Quarry) and `linePlaces(pack, id)` (RM6's table) feed the night's ×1.2 (`NightContext` gains `story`, and step 6
    reads favourites from it on v4) and the face card's mark. `tasteOf(pack, id, good)` is RM7's rule for F47's gifts;
    F23's `chat` and `gift` stay v3's, so the romance build hides Chat, Gift and hearts until F47, and step 6's hearts
    factor is ×1 on v4 until F47 (RM18).
14. **The Gate on v4:** its quick look lists up to three next arrival triggers in the order they're likely ("Next:
    chapter 2's end · the Dorm's level 4 · the Fishing Derby"; "Everyone is here" when the cast is all on the farm). The
    map's blurb reads "Umas arrive here" on v4.
15. **The morning on v4:** the summary's §4 becomes `hearts` (CS5 as RM57 amends it). F46's line is
    `{ kind: 'arrived', id, home }` in place of v3's news `joined` ("Stand-in arrived · away", her scene waiting); F47,
    F49–F52 and F54 add theirs in place; F48 orders and draws the section (RM57). The parse refuses an Uma off the roster,
    a line twice and words.
16. **The format and validator** (`story/authored.ts`), with their tests on the stand-in pack:
    - **`arrival`** is a rung and a ladder: `RUNGS` starts with it (27 rungs), `LADDERS` gains it; its beat has hearts
      0 and a `hearts` trigger; its event has exactly one choice point and no `play`.
    - **`outfitId` is required** in every cast entry (RM2: the game never chooses). A null is an issue: "Name her outfit
      (RM2)".
    - **Partial routes:** `routeIssues` gains a partial mode (a route file may script some beats; the unscripted ones
      are listed, not refused), which the game's loader and F56's release use; the sandbox keeps the strict report.
    - The sandbox's ladder shows 27 rungs. Add one line to F40's D47 note saying `outfitId` is now required, so the
      story session's cast file follows.
17. **The M4 build is untouched:** StartPicks, the Gate's visitors, Affinity and the roster's hearts stay for it until
    F56 deletes them; its tests don't change.

## Do

1. **The switch** (decision 4): `romanceOn()`, the env files and their `!` lines, the second build and size check,
   Vitest's default off.
2. **Save v4** (decisions 1, 2, 7): `SaveV4`, `newSaveV4`, `freshV4`, the strict parse with its tests, `StoredSave`,
   `NEWEST_SAVE_VERSION` 4; the API's types and its tests (a v4 over a stored v3 backs it up to
   `saveBackups/{uid}-v3`; a v3 over a stored v4 is refused and rescued); the web's store and boot (the romance build
   holds v4, wipes v1–v3 after keeping a dirty one, never stamps the wipe; the M4 build stops at a v4).
3. **The pack** (decisions 6, 16): `StoryPack`, the stand-in pack in git, the validator's changes, partial routes, the
   loader seam, the sandbox's 27 rungs.
4. **The resolver** (decision 5) across faces, busts, names, talents, temperaments and pickers, and the night's context.
5. **Arrivals and the Dorm for 20** (decisions 8, 12): `arrive`, `arriveUmas`, `completeChapter` on v4, step 8's order on
   v4, `DORM_LEVELS_V4`.
6. **The start** (decisions 9–11): the name sheet, the re-cut opening, the arrival scenes in the grown player, chapter
   1's card at the end, Account's **Your name**, `sceneDue` on v4.
7. **Her favourite line and tastes** (decision 13).
8. **The morning, the Gate and the Dorm's page** (decisions 14, 15, 12).
9. **The manual:**
   - a new [docs/game/hearts.md](../../game/hearts.md), "Hearts: the authored cast and the romance" (romance build;
     live from F56), with its first sections: the cast and the pack, the opening, arrivals (a live block of the five
     kinds), the farmer's name; each later packet adds its section; its row in [the manual's index](../../game/README.md);
   - [roster.md](../../game/roster.md) (on v4: no start sheet or Gate, the Dorm for 20 as a live block, arrivals);
   - [goals.md](../../game/goals.md) (the re-cut opening, arrival scenes, the chapter's authored arrival);
   - [days.md](../../game/days.md) (step 8 on v4, the morning's `arrived` line);
   - [ranks.md](../../game/ranks.md) (the favourite line from the bible);
   - [architecture.md](../../game/architecture.md) (v4's shape and parse, the wipe and its backup, the dark switch, the
     two builds, the pack's runtime shape).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; **both** size checks are ≤ 180 KB gzip (the numbers in the pull
  request); the private-content guard passes and `git grep` finds no character name or name-tied id.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **the wipe:** a v1, a v2 and a v3 each become `freshV4` with `uid`, `createdAt` and `updatedAt` unchanged; day 1,
    500g, Block A's 9 empty plots, 9 Carrot seeds, Dorm 1 (3 beds), an empty roster, `love`, `memories` and `arrivals`,
    the name empty;
  - **v4's parse:** a v4 round-trips; it refuses an unknown key, a v3-only key, a roster key not of the form, `love`
    missing for a roster Uma or held for one off it, a bad name, a level outside its ladder, the Dorm at 9, home past
    the beds, `memories` or `arrivals` off the roster; `parseSave` returns v2, v3 and v4 as stored;
  - **arrivals:** reading the opening scene joins the opening three home, once; chapter 1 completing joins its authored
    arrival with no `recruitFor`; a festival arrival joins the morning of its day, a beds arrival the morning its level
    takes effect, an event arrival the morning after the named event; with no bed she joins away; each joins once; a
    later wave's Uma with a past trigger arrives the next night; nothing on v4 calls `gateNight` or `startSheet`;
  - **the arrival scene:** +50 and +30 for the best option, +10 for another, once; a tie at the top pays +30; Skip
    lands on the choice; the validator refuses an arrival with a play or two choice points;
  - **the Dorm on v4:** eight levels at RM5's beds, costs and Farm Ranks; v3's Dorm unchanged;
  - **favourite line and tastes:** the bible's, else the calling's (quarry → mining at the Quarry), ×1.2 rank points
    there; loved, liked and disliked by the bible, the rest neutral, a proposed good neutral until it exists;
  - **the name:** the rule's edges (16 letters, 17, an empty trim, apostrophes, hyphens, another script, a digit
    refused);
  - **the validator:** the stand-in pack validates (partial routes for 9000002 and 9000003); a null `outfitId` and a
    missing `arrival` rung are issues.
- Web tests (flag on): a fresh account's name sheet, the opening, three arrival scenes paying their points, chapter 1's
  card; a v3 on the device and on the server each wiped once with `updatedAt` unchanged and the first upload unstamped,
  a dirty one kept as a safety copy first; the M4 build (flag off) stopping at a v4; the Gate's words.
- Locally at 390×844 (and 375×667), the dev server with the flag on: a new account names the farmer, sees the opening,
  meets the three stand-ins in turn (lettered discs), picks a choice in each, plants the carrots; the Dorm's page shows
  eight levels; the Gate's quick look names the next triggers; a dev v3 save wipes once (its `updatedAt` unchanged
  until the name). `VITE_FARM_ROMANCE=0 pnpm web` plays M4 as before.
- Production, after the merge's deploy: health shows the commit, and production still plays M4 (a read-only check with
  the scoped gcloud: `saves/{uid}` is still v3 at its revision). A stale or wrong date: stop and ask.

## Deliver

On a branch, `feat/f46-save-v4-start`, and a pull request for the main session to merge and deploy (`feat: save v4 and
the authored start, dark (F46)`; `git status` and the private-content guard first). In the same branch: delete this
packet, mark its queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and log the
packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–17 and
anything settled while building. The main session merges, watches the deploy (`gh run watch <id> -R
luismlorenzana/uma-farm --exit-status`) and adds the run's link to the Done row.

## Rules that hold (every romance-core packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. Tests and the dark
  build use the stand-in pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`; names,
  titles, birthdays and art come from master data at runtime, story text from the private pack at runtime. Run
  `git status`, `pnpm test` after staging (the private-content guard reads the git index) and `git grep` for names
  before committing.
- **RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit, with a
  fade before anything more; the farmer is never gendered and never drawn, lines say "you", and `{farmer}` is the only
  placeholder. Original lines the code writes (the town's scenes, button words) follow the same rules.
- **The save:** v4 grows in place while the romance core is dark (decision 1); each addition lands with parse tests. F56
  ships v4; any change after it is v5, and M5 takes v5–v8. v3 and the M4 build stay as live until F56.
  `account.updatedAt` moves only on a player's change; no server writes into a save.
- **Dark until F56:** the romance plays only with `VITE_FARM_ROMANCE=1`; production deploys the M4 build. Inside
  `@farm/domain`, what the romance changes keys off the save's version, never the flag.
- **Main JS ≤ 180 KB gzip in both builds** (164.0 KB live, as CI measures it): every new screen, table and rule loads on
  demand (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a "Both apps" request to uma-platform, sent by the
  main session and pinned when released.
- **Nights are seeded** (`draw(uid, day, what, n)`); every number the player earns shows on screen before or as it's
  earned (RM13).
- **The manual changes in the same commit as each rule,** marked "romance build; live from F56"; live blocks through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short, rules behind a help
  button.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.
- The copied uma-rpg code stays copied, never imported.

## Left to the worker

The modules' layout (`romance/` for the love rules and `story/pack.ts` for the runtime pack are the obvious homes); the
stand-in pack's file form (JSON in the pack's layout or a module); the name sheet's drawing; the re-cut opening's lines
within RM9's beats (original, short); the Gate's and the Dorm's words; the disc's letter for a character master data
lacks; how the boot waits for the pack.
