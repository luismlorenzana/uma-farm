# F48 — The Hearts tab and her profile: the bottom bar, the Hearts list, the Work view, the morning's Hearts

**uma-farm · Claude · M · Needs: F47 · Unblocks: F49 · Beside: F52 · Milestone: the romance core**

## Why

The romance needs a home on the phone. This packet makes **Hearts** the Umas' tab in place of Roster: one row per Uma
with her stage, her bar and what's Ready, filters for where each stands, her profile with the whole route as one track
and the next rung spelled out, and the roster's album kept as the tab's Work view. It also orders the morning's Hearts
section, so every signal the romance gives lives in three places only: the morning, her Ready chip and a badge on her
face on the map (RM57).

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM51–RM53** and **RM57** whole, with their mockups; RM31's table
  (the perks' words), RM45 ("Married n/20"), RM47 ("Married n/N"), RM56 (Memories, a count here), RM62 (the Hearts marks
  are F55's), RM65's rows for FC19, FC29 and CS5, RM67's F48 row.
- [core-loop.md](../../design/core-loop.md): FC19 (the roster's album), FC29 (the bottom bar), FC30 (the (i)).
- [decisions.md](../../decisions.md): D31 (j: the tabs), D33 (the kit's badge and glow), D35 (k, l: the roster's album,
  its cards, filters and sorts), D37 (p: the roster's sheet, the Where facet), D46, D47, and the D-decisions F46 and F47
  logged.
- The open packets [F46-save-v4-start.md](F46-save-v4-start.md) and [F47-ladders-points.md](F47-ladders-points.md) if
  they're still in the queue; otherwise their D-decisions and [hearts.md](../../game/hearts.md).
- The manual: [hearts.md](../../game/hearts.md), [days.md](../../game/days.md) (the bars, the morning summary),
  [ranks.md](../../game/ranks.md) (the roster's cards, filters and sorts), [roster.md](../../game/roster.md) (the
  roster's screens).
- Code: `shell/Bars.tsx` (`FarmBottomBar`), `shell/Shell.tsx` (`PAGES`), `app/router.tsx`, `loop/RosterPage.tsx`,
  `loop/roster-view.ts` (`umaRows`, `ROSTER_FACETS`, `ROSTER_SORTS`), `loop/UmaMarks.tsx`, `loop/summary-words.ts`
  (`summaryParts`, `umaSheet`), `loop/FarmMap.tsx` and `loop/fields-view.ts` (pips), F47's `romance/love.ts`
  (`readiness`, `bar`, `levelWords`) and the sheet it built; uma-kit's `BottomBar`, `AlbumChrome`, `FaceTile`, `Chip`,
  `Sheet`, `HelpButton`, `HeartIcon`, and the Hub's `PipModel.badge`.

## Decisions made

### From the spec

- **RM51, the bottom bar:** **Farm · Hearts · End the day · Diary · Menu** (FC29 amended). Hearts replaces Roster: two
  views, **Hearts** (the default) and **Work** (today's roster album: talents, ranks, filters and sorts, as F21 and F23
  built it). Her sheet opens from either, from her face on the farm, and from the morning, at `?uma=<characterId>`. The
  Diary keeps the chapter's goals.
- **RM52, the Hearts tab:** one **72pt row per Uma**: her face (master data), name, stage and level, the bar in the
  stage's colour with the filling heart, points over the next cost, "+N banked", today's chat and gift ticks, and chips
  **● Ready**, **✉** an invitation, **Away**. **Ready rows sort first,** then by the least progress. Filter chips:
  **Ready, Friends, Partners, Married, Away.** The header: **"Married n/20"** and the evening's state (○ free, ● spent).
  The (i) opens the rules in five lines (FC30).
- **RM53, her profile,** from the top: **the route as one track** (F ◆ R ◇ S, the filling heart); her line, birthday and
  house; **the Next card** (the rung, its perk, its place and setup, the bar and what's banked); **Perks** (reached ✓,
  the next, the rest greyed); **Gifts** (loved, liked, disliked as learnt; others +10); **Ties** (her bonds with hearts);
  **Memories** (count, replay); her pet name, keepsake and ring once given; **Chat +15 · Gift · Evening ›** and **Praise
  +20** when she's earned it, 48pt in the thumb zone; **Hearts | Work** switches to her talents and ranks (F21's sheet).
- **RM57, the morning's Hearts section** (CS5's §4), after Ranks, each line a tap to its place: (1) **Ready** lines, up
  to three ("Ready · Romance 5 · the Pond, when she works it"), then "+2 more" (opens Hearts on Ready); (2) **the
  invitation** with **Yes, tonight / Another day**; (3) **the house's morning**; (4) **birthdays and anniversaries,** today
  and tomorrow; (5) **levels reached overnight** (S2, S4) and **arrivals' scenes waiting**; (6) **bond hearts** with
  **Read**. **No pop-up per event:** the summary, a badge on her sprite and her Ready chip are the only signals.
- **RM31's perks** are listed on her profile before they're reached (the table is in [F51](F51-perks.md) and RM31).
- **RM62:** the Hearts marks (three stage hearts, banked, Ready, evening, invitation, Memory frame) are F55's pixel art;
  until its release is pinned, stand-ins.

### Decided here (the spec left these open)

1. **RM57 is built here.** The handoff row lists RM51–RM53 for F48; the spec's F48 row adds RM57, and the morning's
   order needs the tab's targets, so it lands here. Each later packet adds its own line into this order: the invitation
   (F50), the house's morning (F54), overnight levels (F54), bond hearts (F52); birthdays, anniversaries (F47) and
   arrivals (F46) are already there.
2. **Routes:** `/hearts` (the Hearts view) and `/hearts?view=work` (the Work view); her profile is `?uma=<characterId>`
   on either; in the romance build `/roster` goes to the Work view, and the morning's `umaSheet` links `/hearts?uma=`.
   The M4 build keeps `/roster` and its bar.
3. **The tab** uses uma-kit's `HeartIcon` and **no badge**: RM57 names the only signals, and a tab badge isn't one of
   them.
4. **The rows** are a view model in the web (`loop/hearts-view.ts`), from F47's `readiness`, `bar` and `levelWords`:
   - the bar is the ladder's hearts as segments (ten for friendship and romance, five for spouse): levels played full,
     the next one filling by points over its cost, in the stage's colour (coral, rose, gold); a waiting rung shows its
     mark (◆ the confession, ◇ the proposal and the wedding) with "Tomorrow" or "Ready";
   - the second line is the most useful of: her Ready rung and its place ("Ready · Romance 5 · the Pond"), what her
     setup needs ("works the Pond today"), "Swap her home to play her events" when away, "Her story is still being
     written", her house (F54);
   - **sort:** Ready first, then by the least progress (her rung's index along the route, then her points), then the
     cast's order;
   - **filters:** Ready; **Friends** = friendship and the confession's wait; **Partners** = romance, the proposal and
     the wedding's wait; **Married** = spouse; Away. A filter chip shows its count ("Ready 2").
5. **The header:** "Married n/N" with N the cast's size from the pack (20 on the real pack, 3 on the stand-in; RM47 asks
   for N once later waves join, so it's N from the start). The evening's ○/● is F50's: until it lands, the header shows
   only "Married n/N". The (i) holds five lines: points and bars, Ready, events one a day, gifts and tastes, the
   evening.
6. **Her profile** is a sheet over the tab with sections later packets fill: the Next card's **Play ›** (F49), Memories'
   replay (F49), **Evening ›** (F50), the perks' effects and the pet name and keepsake (F51), the ties' hearts moving
   (F52), the ring (F53), her house (F54). Each section shows only what exists; nothing says "Soon".
   - **The track:** one row, F1–F10, ◆, R1–R10, ◇, ◇, S1–S5, played rungs filled in their stage's colour, the next
     filling, the rest empty; it wraps to two rows under 375 pt.
   - **The Next card:** the rung's name, its perk (decision 7), **its place and setup in the bible's `hint`** (D43: the
     line her profile shows while it's next), the bar, "+N banked", and F47's `waits` in words ("Opens with chapter 3",
     "Tomorrow", "Needs a ring", "Swap her home", "Her story is still being written").
   - **Gifts:** her loved good once Friendship 1, the others once learnt, all from Friendship 7, each with its points at
     ★1, and "Others +10"; the unknown slots as "?".
   - **Ties:** her ties from the pack, each with the other Uma's face, its kind's word and bond hearts (`bondHearts` of
     `save.bonds`, which F52 makes move); a tie with an Uma not yet on the farm shows "Not here yet".
7. **The perks' words land here** as data (`romance/perks.ts`): RM31's table, each level's perk id and its words,
   templated by her line in the farm's words ("+10% at the forest", "One item from the forest each night"); the
   bespoke three named generically until F51 reads them (her signature dish, her keepsake, her dream). The profile and
   F49's cards read them; **F51 makes each do what it says.** A perk at a place not open yet says "Opens with chapter
   *n*" (RM36).
8. **The Work view** is F21's and F23's album moved whole, on the roster's ids through F46's resolver; each card's
   corner shows her level words ("F7") in place of v3's hearts; her sheet's Work side is F21's nine activities. The M4
   build keeps the old page.
9. **The morning's Ready lines** are read live from `readiness` when the card shows (they aren't stored, as F47 decided):
   up to three, each opening her profile's Next card; "+N more" opens `/hearts` filtered to Ready.
10. **A badge on her sprite:** wherever the map draws her as a pip (a tender on the Fields, a worker at a place), a Ready
    Uma's pip carries the kit's `badge` "♥" (`PipModel.badge`). Pips stay the place's taps, as the kit has them; her face
    in a quick look or a page opens her profile.
11. **Stand-ins until F55:** the stage hearts and the Ready, banked, evening and invitation marks are CSS glyphs in the
    stage colours; the packet that pins F55's release swaps them (F54 at the latest).

## Do

1. **The bar and routes** (decisions 2, 3): the romance build's tabs, `/hearts`, the Work view, `/roster`'s redirect,
   `umaSheet`.
2. **The Hearts view** (decisions 4, 5): the rows, sort, filters with counts, the header, the (i).
3. **Her profile** (decision 6): the track, line, birthday, the Next card, Perks, Gifts, Ties, Memories' count, the
   actions (Chat, Gift and Praise from F47's sheet, moved), Hearts | Work.
4. **The perks' words** (decision 7) in `@farm/domain`.
5. **The morning's Hearts section** (decisions 1, 9) in RM57's order.
6. **The pips' badge** (decision 10) and the stand-in marks (decision 11).
7. **`LAZY_MODULES`** gains the tab, the profile, the view model and the perks' table.
8. **The manual:** [hearts.md](../../game/hearts.md)'s "The Hearts tab" and "Her profile" sections, with a live block of
   the perks' words by line; [days.md](../../game/days.md) (the bar on v4, the morning's Hearts section);
   [ranks.md](../../game/ranks.md) (the album is the Work view on v4).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Tests:
  - **rows:** Ready first, then least progress, then the cast's order; each filter's members and counts; the segments
    for F7 with 300 of 480, R4 with 40 banked, S2; a waiting rung's mark and words;
  - **the profile:** the track's filled rungs at each stage; the Next card's words for each of F47's `waits`; gifts
    shown by Friendship 1, learnt and Friendship 7;
  - **the perks' words:** each line's templates (farming, foraging, fishing, mining at the Mine and at the Quarry,
    ranch, cooking); "Opens with chapter 3" for a miner's +10%;
  - **the morning:** RM57's order with every line present; three Ready lines and "+2 more"; no Ready line for an Uma who
    played an event today;
  - **routes:** the romance build's bar reads Farm · Hearts · End the day · Diary · Menu; `/roster` lands on the Work
    view; the M4 build's bar is unchanged.
- Locally at 390×844 (and 375×667), the dev server with the flag on: the Hearts tab with the three stand-ins, 9000001
  Ready first; filter to Friends; open her profile, read the track and the Next card, chat and gift from it, switch to
  Work; the morning's Hearts lines tap to her profile; her pip on the Fields carries ♥ while she's Ready.
  `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f48-hearts-tab`, and a pull request for the main session to merge and deploy (`feat: the Hearts tab
and her profile, dark (F48)`; `git status` and the private-content guard first). In the same branch: delete this
packet, mark its queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and log the
packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–11 and
anything settled while building. The main session merges, watches the deploy and adds the run's link.

## Rules that hold (every romance-core packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. Tests and the dark
  build use the stand-in pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`; names,
  titles, birthdays and art come from master data at runtime, story text from the private pack at runtime. Run
  `git status`, `pnpm test` after staging (the private-content guard reads the git index) and `git grep` for names
  before committing.
- **RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit, with a
  fade before anything more; the farmer is never gendered and never drawn, lines say "you", and `{farmer}` is the only
  placeholder. Original lines the code writes follow the same rules.
- **The save:** v4 (F46) grows in place while the romance core is dark; each addition lands with parse tests (this
  packet adds none). F56 ships v4; any change after it is v5, and M5 takes v5–v8. v3 and the M4 build stay as live until
  F56. `account.updatedAt` moves only on a player's change; no server writes into a save.
- **Dark until F56:** the romance plays only with `VITE_FARM_ROMANCE=1`; production deploys the M4 build. Inside
  `@farm/domain`, what the romance changes keys off the save's version, never the flag.
- **Main JS ≤ 180 KB gzip in both builds** (164.0 KB live, as CI measures it): the tab and the profile load on demand
  (`LAZY_MODULES`); the bar's change is the only start-up code, measured in the pull request.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a "Both apps" request to uma-platform, sent by the
  main session and pinned when released.
- **Nights are seeded** (`draw(uid, day, what, n)`); every number the player earns shows on screen before or as it's
  earned (RM13).
- **The manual changes in the same commit as each rule,** marked "romance build; live from F56"; live blocks through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets (48 pt for the profile's actions, RM53), safe areas;
  player-facing text short, rules behind a help button.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

The rows' and the profile's drawing within RM52's and RM53's mockups; the (i)'s five lines; the perks' exact words in
the farm's voice; how the track wraps on a narrow screen; the stand-in glyphs.
