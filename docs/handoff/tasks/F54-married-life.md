# F54 — Married life: the homestead, rooms, the night's house, its morning, household milestones and the finale

**uma-farm · Claude · L · Needs: F53 · Pins: F55's uma-art release if it's out and unpinned · Unblocks: F56 ·
Milestone: the romance core**

## Why

Married life is where farm romances usually go quiet; the owner's houses (D43) make it something you play. A homestead
row grows behind the yard: the Farmhouse from day 1 and six houses you build, name and extend; each spouse gets a room,
spouses sharing a house bond faster, and each night you pick where to sleep, so the morning is that house's: breakfast,
morning gifts, +30 for each resident, a line between them. The spouse ladder's quiet levels come at night, the
household's milestones at 5, 10 and 15 married bring their scenes, and the twentieth wedding opens the finale. The game
goes on after it.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM41–RM47** whole with the homestead's mockup; RM22's "Sleep at"
  row and the Tonight mockup; RM23's "Before 1", step 6 (S2, S4), step 8 (household milestones) and step 9 (the house's
  morning); RM11 and RM55 (S2 and S4 at night, their card in the morning); RM35 (breakfast); RM48 (+10 a night for a
  shared house); RM57's third and fifth lines; RM58 (`wishes`, `household.json`); RM62 (the houses' pixel art, F55);
  RM65's rows for FC28, CS3 and CS38; RM67's F54 row.
- [core-loop.md](../../design/core-loop.md): FC28 (the map's rows). [core-spec.md](../../design/core-spec.md): CS3,
  CS22, CS46 (templates by temperament).
- [decisions.md](../../decisions.md): D31 (g: the map's tiles and rows), D37 (the Dorm, `onFarm`), D43 (the houses, W15,
  W16), D45, D46, D47, and the D-decisions F46–F53 logged.
- F55's pieces, done in uma-art 2.26.0 ([the Done row](../README.md#done), and uma-platform's `packages/art/README.md`, "The romance core's marks and places"), for the pieces this packet pins.
- The manual: [hearts.md](../../game/hearts.md), [days.md](../../game/days.md) (the map, Tonight, the night),
  [roster.md](../../game/roster.md) (the Dorm, who's on the farm).
- Code: `farm/places.ts` (`FARM_PLACES`, `FARM_MAP_ROWS`, `PlaceOpens`), `loop/farm-map.ts` (`placeAt`,
  `FARM_MAP_TILES`, `lockOf`, `PLACE_SCREENS`), `loop/FarmMap.tsx`, `save/v3.ts` (`onFarm`), `farm/dorm.ts`,
  `night/end-day.ts`, F46's `homestead` slot and `arrive`, F47's `advance`, `addLove` and anniversaries, F48's profile
  and Hearts header, F49's player and stage-up, F50's Tonight and `marriedCount`, F51's `breakfast` and morning items,
  F52's `addBond` and `closestFriend`, F53's wedding.

## Decisions made

### From the spec

- **RM41, the homestead:** a new row on the farm map behind the yard (FC28 grows): **the Farmhouse** and **six house
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

  You name each house when it's built; its exterior is pixel art, one drawing in two sizes (F55). Never a gate: a
  wedding never waits for a room.
- **RM42, rooms and moving:** at her wedding she takes a free room; you pick the house, defaulting to the one where her
  closest tie lives. With no room free she **keeps her Dorm bed**, her profile says "Needs a room", and she moves in the
  morning after one is built. **Move any spouse** to a free room any morning, free (a swap within the homestead too).
  **Pairs sharing a house earn +10 bond points a night.** Spouses leave the Dorm for the houses, freeing their beds
  (RM5).
- **RM43, the night's house and its morning:** each night you pick a house (Tonight's **Sleep at**); **the morning is
  that house's:** each resident **+30** to her spouse bar; **her breakfast** (S1) if no meal runs; **her morning item**
  (S2), on top of her own count; **a house line** (authored household lines from the pack; CS46-style templates by
  temperament until written). **A house you haven't slept in for 8 nights** invites you warmly in the morning summary
  ("Willow House misses you"); "Another night" costs nothing. No neglect penalty, ever.
- **RM22's Sleep at** (once married): the Farmhouse or a house, each with who's home, a ☕ when a resident's breakfast is
  on, "8 nights" for one you haven't visited lately; the default is the house you've visited least lately.
- **RM44, her own house and her birthday alone:** an Uma whose bible says so (`wishes: ['own-house',
  'birthday-alone']`) asks in her S1 event for a house to herself; she's happiest with no other resident, and until one
  is free her profile says, softly, "She'd love her own house"; nothing is lost while she waits. **Her birthday alone:**
  on her birthday Tonight offers "her room"; that morning is hers alone (only her +30, breakfast and item).
- **RM45, household milestones,** with **"Married n/20"** always on the Hearts header:

  | Married | Opens |
  |---|---|
  | **1** | The homestead; the night's house; anniversaries |
  | **5** | **Household scene 1**; a furniture set (5 decorations for the houses); **+5% items crew-wide** |
  | **10** | **Household scene 2**; **two evenings every fourth day**; two invitations a morning |
  | **15** | **Household scene 3**; **+5% more items** crew-wide |
  | **20** | **The finale** |

  The household scenes are authored (the pack's `household.json`), each with every spouse so far and at least one line
  each.
- **RM46, the finale at 20 of 20:** the morning after the 20th wedding, **the Great Harvest** is Ready: a farm-wide
  celebration at the festival ground where every spouse has her own moment and line (3–5 minutes with a play, then one
  beat per spouse, then the whole household). Its Memory is the game's last stage-up card. **The game goes on;** each
  year on its day a **Festival of Vows** gives every spouse +50 and an evening's festival night.
- **RM47, waves after the 20:** the header becomes **"Married n/N"** with the cast at the time; the finale plays once, at
  the first 20 of 20; each later wave adds its own household scene when its Umas are all married, and its own lots.
- **RM11, RM55:** S2 and S4 come at night when their bar fills (600 each), with a level-up card in the morning.

### Decided here (the spec left these open)

1. **`homestead`'s shape** (F46's slot, refined in place): `houses: { name, extended }[]` with **house 0 the Farmhouse**
   (two rooms, never extended) from day 1 and houses 1–6 appended as they're built; `tonight` (the house picked for
   tonight, or null); `slept[i]` (the last night slept there, 0 never); `furniture: (number | null)[]` (five pieces, the
   house each stands in). **Who lives where is one source, `love.house`;** a house's rooms are 2, or 4 extended, and the
   parse refuses more residents than rooms, a house for anyone but a spouse, and names outside the rule.
2. **On the map:** on v4 the homestead's places sit in new rows after the yard, before the town edge, which stays the
   map's last row: the Farmhouse, House 1 and House 2; Houses 3–5; House 6. Built houses and the next lot show; later
   lots don't, so the map grows a row at a time. A house's pips are its residents' faces (Ready ones badged, F48); a tap
   opens the homestead's sheet at that house; an unbuilt lot shows the house's frame locked with "Build · 8,000g". v3's
   map is unchanged. `FARM_PLACES` gains v4-only places and `PlaceOpens` a `{ by: 'house', n }`.
3. **Building and naming:** a house is bought at its quick look or the homestead's sheet, stands at once (unlike the
   Dorm, nothing waits for a morning), and is named there: 1–20 characters, F46's letters rule, a grey "Rose Cottage"
   placeholder. An extension is bought the same way and adds two rooms at once. House 1 opens to build at the first
   wedding, each later one when the one before is built.
4. **Rooms:** at the wedding (F53's stage-up gains the step) you pick her house among those with a free room, the default
   the house where her closest friend lives (F52's order) when it has room, else the first with room, the Farmhouse
   first. With none free she keeps her Dorm bed ("Needs a room"), and at step 9 after a house is built, spouses waiting
   take free rooms in wedding order by the same default. **Moves happen at once,** any time, free: tap a face, then a
   free room or another face to swap. A housed spouse leaves `dorm.home`, freeing her bed; **"on the farm" on v4 is
   `dorm.home` plus housed spouses** (`onFarm`, F47's "home", F50's eligibility). An own-house wisher's default prefers
   an empty house.
5. **Tonight's Sleep at** (F50's sheet gains the row once anyone is married): each built house with its residents'
   faces ("· 3 home"), ☕ when a resident at S1 or more would breakfast tomorrow and no meal runs, "8 nights" when it
   hasn't been slept in for 8 or more; preselected, **the house slept in least lately** (ties: the lower number); on her
   birthday, an own-birthday wisher's "Her room" row. The pick is `homestead.tonight`; End the day never waits on it (the
   default stands).
6. **The night:** **before step 1** the house picked is noted (`slept`); **step 6** pays +10 bond a night to each pair of
   residents sharing a house (F52's `addBond`) and levels a spouse at S1 or S3 whose 600 is full to S2 or S4 (F47's
   `advance`, no event); **step 8** checks the household milestones; **step 9** gives the house's morning.
7. **The house's morning** (step 9): each resident **+30** through `addLove` (an anniversary's ×2 applies); a resident at
   S1+ triggers **breakfast** (F51's, once, if no meal runs; F52's +5 a pair for the crew it feeds); each resident at
   S2+ leaves **one more morning item** (F51's, on top of her count); **a house line**: one resident's line from the
   pack's `houseLines` for her, else from original templates by temperament written here (three a temperament, `{name}`
   filled at runtime). On a birthday-alone night only she counts. The summary's line is `{ kind: 'house', house, umas,
   breakfast, items }` in RM57's third place, and `{ kind: 'house-misses', house }` for one not slept in for 8 nights,
   with **Tonight ›** (sets `tonight`) and **Another night** (hides it for the day).
8. **Night levels:** `{ kind: 'level', id, rung }` in RM57's fifth place; opening it shows F49's level-up card (S2: her
   morning item every second morning; S4: a third night chore).
9. **Household milestones** at step 8, as news lines when the married count passes 1, 5, 10, 15 and 20: 1 opens House 1;
   5 opens household scene 1 and gives the **furniture set** (five pieces with original names, placed one a house from
   the homestead's sheet as words, no art or effect until M6's decorations draw them); 5 and 15 are F51's crew +5%; 10
   is F50's second evening and invitation. "Married n/N" counts spouses over the cast's size.
10. **Household scenes and the finale are Ready offers,** never auto-played: the morning's line and the Hearts header
    show them, they play in F49's player and replay from the Diary's Memories shelf. A household scene pays nothing; the
    finale's play pays nothing either, since every route is complete by then.
11. **`household.json`'s shape** (RM58's addition; validator, stand-in file, a line in F40's D47 note), built for a
    household the author can't know in advance:
    ```ts
    interface Household {
      scenes: { at: 5 | 10 | 15; open: Step[]; each: Record<CharacterId, Step[]>; close: Step[] }[]
      houseLines: Record<CharacterId, string[]>          // 1–10 short lines each
      finale: { open: Step[]; play: Play; each: Record<CharacterId, Step[]>; close: Step[] }
    }
    ```
    The game plays `open`, then each married Uma's `each` in wedding order, then `close`; `open` and `close` speak only
    through narration and the town's cast, since who is married varies. The validator wants an `each` for every cast
    Uma in every scene and the finale, and the line rules everywhere.
12. **`wishes`** in her bible (RM58): `('own-house' | 'birthday-alone')[]`, optional; validated; the stand-in bible gives
    9000003 `own-house`.
13. **The finale** is Ready the morning after the wedding that makes 20 married, once (`diary.read`, `finale`): its
    `open`, its play (F49's, at the festival ground's card), each spouse's beat, its `close`, then the last stage-up
    card, "The Great Harvest", with every spouse's face. **The Festival of Vows** falls each later year on the finale's
    day of the year: every spouse +50 that morning (a summary line) and a festival-night slot that evening (F50's slot
    rule). Later waves' household scenes come with their story packets.
14. **The homestead's sheet** (RM41's mockup): one row a house with its rooms (▣ taken, ▢ free), its name, **Build** or
    **Extend** with its price ("Need 300g more"), "Needs a room: …", "Move: tap a face, then a free room.", "Shared
    houses: +10 bond a night a pair", and the furniture's places. Her profile (F48) shows her house, or "Needs a room",
    or "She'd love her own house".
15. **The art:** if F55's uma-art release is out and unpinned, this packet pins it and swaps every stand-in from F48–F53
    (the stage hearts, Ready, banked, evening, invitation, the Memory frame, the plays' icons, the bench's mark) and
    draws the houses and the Farmhouse with it; otherwise the houses borrow a uma-art building (the worker picks, listed
    in the manual) and the first packet after F55's release pins it (F24's rule).

## Do

1. **The shape and the map** (decisions 1, 2): `homestead` in place, the parse, the new places and rows.
2. **Building, naming, rooms and moves** (decisions 3, 4), with `onFarm` on v4 and the wedding's room step.
3. **Tonight's Sleep at and the night** (decisions 5, 6): the pick, the shared-house bonds, S2 and S4.
4. **The house's morning** (decisions 7, 8) and its summary lines.
5. **Wishes, milestones, the furniture, household scenes and the finale** (decisions 9–13), with `household.json`'s
   validator and the stand-in file.
6. **The homestead's sheet and her profile's house** (decision 14).
7. **The art** (decision 15).
8. **The manual:** [hearts.md](../../game/hearts.md)'s "Married life" section (live blocks: RM41's houses, RM45's
   milestones, the house's morning); [days.md](../../game/days.md) (the map's homestead rows, Sleep at, the steps on v4);
   [roster.md](../../game/roster.md) (who's on the farm: the Dorm and the houses).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **houses:** RM41's prices and order (408,000g, 612,000g extended); 2 rooms, 4 extended, the Farmhouse's 2 from day
    1; a name's rule; nothing built before the first wedding but the Farmhouse;
  - **rooms:** the closest friend's house by default, the Farmhouse first among the rest; no room keeps her Dorm bed and
    she moves the morning after one is built; a move and a swap at once; a housed spouse frees her bed and is still on
    the farm (jobs, Ready, evenings); the parse refuses a full house's extra resident;
  - **the night:** Sleep at's default (least lately, then the lower number); +10 a pair sharing a house; S2 and S4 at a
    full 600 with their morning line, never S3 or S5;
  - **the morning:** +30 each resident; breakfast once and only with no meal; one more morning item each at S2; a house
    line from the pack or the templates; the 8-night line; birthday-alone gives only hers;
  - **milestones:** each at its count, once; the furniture placed; scenes Ready at 5, 10 and 15; the finale once the
    morning after the 20th wedding; the Festival of Vows a year later, +50 each and a festival night;
  - **`household.json` and `wishes`:** validated on the stand-in; a missing `each` is an issue.
- Web tests (flag on): building and naming House 1, a room at the wedding, a move, Tonight's Sleep at, the morning's
  house line.
- Locally at 390×844 (and 375×667), the dev server with the flag on: a dev save with 9000001 married: the Farmhouse
  room, Sleep at the Farmhouse, the morning's +30 and breakfast; House 1 built and named, 9000001 moved there; a dev
  save with a larger invented cast at 4 married, the fifth wedding opening household scene 1; the homestead rows on the
  map. `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f54-married-life`, and a pull request for the main session to merge and deploy (`feat: married
life, the houses and the finale, dark (F54)`; `git status` and the private-content guard first). In the same branch:
delete this packet, mark its queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and
log the packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions
1–15 and anything settled while building, and the uma-art version pinned. The main session merges, watches the deploy
and adds the run's link.

## Rules that hold (every romance-core packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. Tests and the dark
  build use the stand-in pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`; names,
  titles, birthdays and art come from master data at runtime, story text from the private pack at runtime. Run
  `git status`, `pnpm test` after staging (the private-content guard reads the git index) and `git grep` for names
  before committing.
- **RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit; **the
  night is a cozy fade, and a house's morning shows only the morning** (W16); the farmer is never gendered and never
  drawn, lines say "you", and `{farmer}` is the only placeholder. The templates and furniture names this packet writes
  follow the same rules.
- **The save:** v4 (F46) grows in place while the romance core is dark; each addition lands with parse tests. F56 ships
  v4; any change after it is v5, and M5 takes v5–v8. v3 and the M4 build stay as live until F56. `account.updatedAt`
  moves only on a player's change; no server writes into a save.
- **Dark until F56:** the romance plays only with `VITE_FARM_ROMANCE=1`; production deploys the M4 build. Inside
  `@farm/domain`, what the romance changes keys off the save's version, never the flag.
- **Main JS ≤ 180 KB gzip in both builds** (164.0 KB live, as CI measures it): the homestead's sheet and rules load on
  demand (`LAZY_MODULES`); the map's extra places are measured in the pull request.
- **`uma-work` and `uma-kit` aren't forked:** the map's rows are the farm's data on the kit's Hub; anything it lacks is a
  "Both apps" request to uma-platform, sent by the main session and pinned when released.
- **Nights are seeded** (`draw(uid, day, what, n)`); every number the player earns shows on screen before or as it's
  earned (RM13).
- **The manual changes in the same commit as each rule,** marked "romance build; live from F56"; live blocks through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short, rules behind a help
  button.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

The modules' layout; the homestead's rows' exact tiles; the templates' and the furniture's words (original); the
sheet's drawing; the borrowed building if F55 isn't out; how a long list of guests or spouses wraps on a narrow screen.
