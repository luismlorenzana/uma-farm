# F39 — The Cooking Contest: chapter 4's last goal

**uma-farm · Claude · S · Needs: F8 · Unblocks: F28 (chapter 5 opens when chapter 4 completes) · Milestone M5, more to
do (the Cooking Contest pulled forward from M6's F32)**

## Why

Chapter 4 ends at the Cooking Contest on Autumn 10 (CS43; the sim finishes it on day 34, the Contest's day). Festivals
are M6's (F32), and D24 #2 says a goal that needs a later feature waits for it. But a chapter completes only when every
goal is met, so chapter 4 would stay open until M6, and with it chapter 5, the expedition post and all of F28: M5 would
ship an activity nobody can reach. **This packet builds that one festival now, by CS40's own rule,** so chapters 2–5 all
play in M5 as FC32 and CS55 order. F32 later builds the festival ground and the other four festivals on it.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS40** (the Cooking Contest's row, the rivals, prizes, ties), CS39
  (festival points 150 / 75 / 25), CS35 (a festival's recruit and visitor), CS38 (each festival's best score a record;
  festivals won are M6's milestones), CS30 (cooking's Legend), **CS43** (chapter 4's goal), CS4 (Autumn 10), CS41 (Rosa
  Bell judges; Wren Ashby and Cole Varga), CS5 (the morning's festival lines), CS55.
- [core-loop.md](../../design/core-loop.md): FC22, FC33 ("a festival day is the festival"), and "Notes from drawing the
  page" #1–#3.
- [decisions.md](../../decisions.md): D24 #2, D25, D37 (the Gate, `joinRoster`, `recruitFor`), D38 (`farmPointsOf`),
  and F8's decisions 1–3, 6 and 15 (`workshops.last`, the contract, the assistant, chapter 4's goal 4).
- The manual: [kitchen.md](../../game/kitchen.md) (F8), [days.md](../../game/days.md) (festivals as dates, the
  morning's festival line), [goals.md](../../game/goals.md), [roster.md](../../game/roster.md) (the Gate).
- Code: F8's `workshops/` (the play's finish), `save/v3.ts` (`farm.festivals`, `FestivalResult`, `visitors`,
  `VISITOR_FROM`), `farm/calendar.ts` (`nextFestival`, the festivals' days), `farm/diary.ts` (`farmPointsOf`),
  `farm/visitors.ts` (`recruitFor`), `farm/dorm.ts` (`joinRoster`), `farm/rank-rules.ts` (`countChallenge`'s `won`),
  `story/chapters.ts`; on the web the Kitchen's play and result (F8), `GatePeek.tsx`, the rank's sheet in
  `LoopSheets.tsx`, `summary-words.ts`.

## Decisions made

### From the spec

- **The Cooking Contest (CS40):** on **Autumn 10** (day 34 in year 1, day 82 in year 2), you enter **a dish cooked
  live: a Kitchen play** (it uses the day's play). **Your score = 10 × the dish's ★ + 0.5 × the play's score.** The
  rivals: **Ashby Orchards** (Wren Ashby) **34 + 6 × FR + 6** (cooking is its specialty), **Varga Ranch** (Cole Varga)
  **26 + 7 × FR**, each capped at **96**. **Ties go to you.**
- **Prizes (CS40):** 1st **600g × the season's number × the year** (Autumn is 3: **1,800g** in year 1), a trophy, a
  decoration and a recruit; 2nd half the gold and a visitor at the Gate; 3rd a fifth of it and a ribbon.
- **Farm Rank points (CS39):** **150 / 75 / 25** for a 1st / 2nd / 3rd.
- **The year's worked Contest (CS40):** 70 against 70 and 61, 1st on the tie (the sim's FR5).
- **Cooking's Legend (CS30):** 1st at a Cooking Contest as the cook.
- **Chapter 4's last goal (CS43):** enter the Cooking Contest.

### Decided here (the spec left these open)

1. **The disagreement, settled:** D24 #2 (chapter 4's festival goal waits for M6) against FC32 and CS55 (chapters 2–5
   ship in M5). Following D24 #2 would lock chapter 5 and the expeditions until M6, so the Cooking Contest comes
   forward into M5, built exactly as CS40 has it. F32 keeps the festival ground, the Flower Show, the Fishing Derby, the
   Animal Show, the Harvest Cup, trophies, ribbons and decorations, and generalises this one.
2. **The entry is the day's Kitchen play on Autumn 10.** That day the menu sheet says **"Cooking Contest today: this
   play is your entry"**, on by default (switched off before Start, the play is just a play). **The cook is the play's
   assistant;** with none, the entry still counts but nobody earns the Legend challenge. Practice is never an entry.
   One entry a Contest.
3. **The dish judged is the play's best:** the most stars it made, then the dearest at ★1, then the menu's order. It
   isn't used up.
4. **Judged at the play's end, in the day** (FC33: the festival day is the festival). After the play's result, a card:
   **"Cooking Contest · 1st · You 78 · Ashby 70 · Varga 61"**, and the prizes are paid at once, a player's change
   stamped with the play: the gold; for a 1st, a recruit (`recruitFor` + `joinRoster`, home or away); for a 2nd, a
   visitor at the Gate (`from: 'festival'`, waiting her six days like any), **even if a Gate visitor already waits**:
   the Gate's quick look lists each one waiting; a 3rd, the gold alone. Trophies, decorations and ribbons are M6's (F32,
   F38): the result is kept so M6 can show them.
5. **What's kept:** `farm.festivals` gets `{ id: 'cooking-contest', day, score, place }`; `diary.records
   ['festival:cooking-contest']` keeps the best score; **the Farm Rank's points gain festivals** (150 / 75 / 25 a
   result) in `farmPointsOf`, recomputed at night as ever, and the rank's sheet lists them as a source; `farmRankOpens`
   is unchanged.
6. **No save change:** `farm.festivals`, `visitors` and `diary.records` are v3's, and the result is seen in the day, not
   in the morning, so this packet keeps v6. (If building shows a morning line is wanted, it's the next version, and F28
   takes the one after.)
7. **Chapter 4's goal 4** reads `farm.festivals` for a Cooking Contest entry on a day since chapter 4 opened, at any
   place (F8 decision 15). **If chapter 4 opens after Autumn 10, the goal waits for the next year's Contest,** 48 days
   on: recorded in the D-decision with the day chapter 4 opened in the dev play, not changed.
8. **The cook's Legend:** a 1st counts `{ kind: 'won', festival: 'cooking-contest' }` for the cook.
9. **The morning's lines:** "Cooking Contest tomorrow" and "Cooking Contest today" (F18's festival lines) open the
   Kitchen; the festival ground keeps its "Soon" until F32.
10. **The rivals are the original cast** (CS41): the card names their farms, and Rosa Bell's verdict line on the card is
    one of a few original lines by place (left to the worker).

### Rules that hold (every M5 packet)

- **No original-game content in git:** no outfit or character names in code, tests, docs, commits or pull request
  bodies; names, titles and art come from master data at runtime only; tests use `@luismlorenzana/uma-data/testing`
  fixtures or invented ids. Scenes speak with the original cast (CS41) and name Umas only as runtime roles. Run
  `git status` and the private-content guard before committing.
- **Main JS ≤ 180 KB gzip** (164.0 KB live after F24): new screens, tables, scenes and rules load lazily
  (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **Every save change is a new version** (v4 or later, F27's pattern) with its migration and tests;
  `account.updatedAt` never moves in a migration; no server writes a save.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a uma-platform request the main session sends,
  pinned when released.
- **Each minigame is an original game in its genre,** never a recreation of a specific title; its rules are pure and
  tested in `@farm/domain` before any scene draws them (FR22).
- **The farm runs on today's map** (uma-kit's Phaser Hub) until M7; M5's scenes are flat; the HD-2D scenes and
  `kit-farm` are M7's.
- **Nights are seeded** (`draw(uid, day, what, n)`): the same save always gives the same morning.
- **The manual (`docs/game/`) changes in the same commit as each rule;** live blocks through `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short, explanations behind
  a help button.
- **Art:** the first packet built after F25's uma-art release pins it and drops F24's stand-ins; the first after F29's
  pins that; stand-ins until then.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.
- The copied uma-rpg code stays copied, never imported.

### Left to the worker

The result card's drawing; Rosa's verdict lines; where the contest's rules live (a `festivals/` folder that F32 grows is
the obvious home).

## Do

1. **The Contest's rule** in `@farm/domain` (CS40's row, decisions 3 and 5): the score, the rivals, the place, the
   prizes, the points.
2. **The entry** (decision 2) in F8's play, and **the judging** at its end (decision 4), with the Gate's list.
3. **Chapter 4's goal 4** reads it (decision 7); the cook's Legend (decision 8); the morning's lines open the Kitchen
   (decision 9).
4. **The manual:** a new [docs/game/festivals.md](../../game/festivals.md) (the five festivals' dates, the Cooking
   Contest's rule, the rivals and the prizes, live blocks; F32 grows it) and its row in
   [the manual's index](../../game/README.md); [goals.md](../../game/goals.md) (chapter 4's last goal, festival
   points), [kitchen.md](../../game/kitchen.md) (the entry), [roster.md](../../game/roster.md) (a festival's recruit
   and visitor; the Gate's list), [days.md](../../game/days.md) (the festival lines' taps).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the size check is ≤ 180 KB gzip (the number in the pull request);
  the private-content guard passes.
- Domain tests:
  - CS40's worked Contest: at FR5, a ★3 dish from a play of 80 scores 70 against Ashby 70 and Varga 61, and places
    1st on the tie;
  - ties go to you at every place; the rivals cap at 96 (at FR10 Ashby's 100 is 96);
  - prizes: 1,800g in year 1 and 3,600g in year 2 for a 1st, with a recruit; 900g and a Gate visitor for a 2nd, beside
    a visitor already waiting; 360g for a 3rd; 150 / 75 / 25 Farm Rank points at the next night;
  - an entry only on Autumn 10, only once, never from Practice; the dish judged is the play's best, and it's kept;
  - the cook's Legend counts on a 1st; chapter 4's goal 4 is met by an entry and not by one before the chapter opened.
- `pnpm docs:update` leaves every live page unchanged.
- Locally at 390×844 (and 375×667): a dev save on Autumn 9 in chapter 4: the morning says "Cooking Contest tomorrow";
  end the day; "Cooking Contest today" opens the Kitchen; the play is the entry; the result card; the prizes; that
  night chapter 4 completes, and the next morning its closing scene plays (then chapter 5's opening once F28 has
  landed, else "Soon").
- Production, after the merge's deploy: health shows the commit; the save stays v6.

## Deliver

On a branch, `feat/f39-cooking-contest`, and a pull request for the main session to merge and deploy (`feat: the
Cooking Contest, chapter 4's last goal (F39)`; `git status` and the private-content guard first). In the same branch:
delete this packet, add a Done row in [the handoff](../README.md) with the pull request, and log the packet's D-decision
in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–10. The main session
merges, watches the deploy (`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`) and adds the run's link to the
Done row.
