# F47 — The ladders and points: her route, costs, chats, gifts, praise, birthdays, anniversaries, Ready

**uma-farm · Claude · M · Needs: F46 · Unblocks: F48 and F52 (side by side), then F49 · Milestone: the romance core**

## Why

F46 put each Uma on the farm with an empty `love`. This packet gives it its rules: one track per Uma from Friendship 1 to
Spouse 5, the cost of every heart, the points every act pays (shown before or as they're earned), banking with no decay,
gifts by her own tastes, praise, her line at night, birthdays and anniversaries, the rank-point factor her friendship
gives, and when her next event is Ready. Every later screen and event reads these numbers.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM11–RM18** whole, **RM23** (steps 6, 7 and 9's Hearts lines),
  **RM24** (when an event is Ready), RM13's worked examples, RM31's F1, F5, F7 and F10 rows (chats, rank points, tastes),
  RM32's morning-item column (what "a good of her line" is), RM36 (a place not open waits), RM65's rows for FC26, CS29
  and CS45, RM67's F47 row.
- [core-spec.md](../../design/core-spec.md): CS44 (bond hearts' thresholds), CS45 (praise's causes), CS29 (rank points),
  CS1 (the 48-day year).
- [decisions.md](../../decisions.md): D35 (e: hearts' factor; `rankPoints`' terms), D37 (l, m, n: chats, gifts, lines),
  D42, D43, D46, D47, and the D-decision F46 logged.
- [F46-save-v4-start.md](F46-save-v4-start.md), if it's still open, for v4, the pack and the switch; otherwise F46's
  D-decision and [hearts.md](../../game/hearts.md).
- The manual: [hearts.md](../../game/hearts.md), [roster.md](../../game/roster.md) (affinity, gifts, chats as v3 has
  them), [ranks.md](../../game/ranks.md) (rank points), [days.md](../../game/days.md) (the night, the morning).
- Code: `farm/visitors.ts` (`chat`, `gift`, `CHAT_LINES`, `chatLine`, `GIFT_POINTS`), `farm/rank-rules.ts`
  (`rankPoints`, `PointTerms`, `affinityPoints`, `tickRankRules`, `PLACE_ACTIVITY`), `farm/calendar.ts` (`dateOf`,
  festivals), `night/end-day.ts` (steps 4, 6, 7, 9), `fields/fields.ts` (`harvest`'s receipt), `gathering/kinds.ts`
  (`MadeTonight`, quality), F46's `romance/` and `story/pack.ts`; on the web `loop/Affinity.tsx` (the gift sheet),
  `loop/RosterPage.tsx` (her sheet), `loop/actions.ts`, `loop/summary-words.ts`, `master/master.ts` (the characters set,
  for birthdays).

## Decisions made

### From the spec

- **RM11, one track per Uma:** **Friendship 1–10 → her confession → Romance 1–10 → the proposal → the wedding → Spouse
  1–5**, 26 rungs. **A level is its event:** her bar fills, her event becomes Ready, and the level comes when you play
  it (the Persona rule). S2 and S4 have no event: they come at night when their bar fills (F54). The bar's colour carries
  the stage: **coral** friendship, **rose** romance, **gold** spouse.
- **RM12, the costs:** heart *n* on friendship and romance costs **160 + 40n**; a spouse level **600**. The three waiting
  rungs cost nothing: each is Ready **the day after the rung before** (the proposal also needs a ring, RM39).

  | Heart | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | Ladder |
  |---|---|---|---|---|---|---|---|---|---|---|---|
  | **Friendship or romance** | 200 | 240 | 280 | 320 | 360 | 400 | 440 | 480 | 520 | 560 | **3,800** |
  | **Spouse** | 600 | 600 | 600 | 600 | 600 | | | | | | **3,000** |

  A whole route is **10,600 points and 26 events**.
- **RM13, points,** each shown on screen before or as it's earned (a "+N" floats from her face):

  | Act | Points | Limit |
  |---|---|---|
  | Chat (tap her) | +15 | Once a day each |
  | Gift | Loved **+60**, liked **+30**, neutral **+10**, disliked **0**; × (1 + 0.1 a star above ★1) | One a day each; ×3 on her birthday |
  | Praise (after a ★3+ day's work, a rank-up or a Fine play) | +20 | Once a day each |
  | Her line (she worked it today) | +10 | Paid at night |
  | A festival together (its team or entry) | +50 | Each festival |
  | The evening · an invitation said yes · a house morning | (F50 · F50 · F54) | |
  | Her arrival scene | +50 and its choice (F46) | Once |
  | A heart event | +50, its choices, its play's grade (F49) | One of hers a day |

  Worked: a ★3 liked good is 30 × 1.2 = **36**; a ★5 loved dish on her birthday is 60 × 1.4 × 3 = **252**. A typical
  opening Uma: arrival **+75**; day 1 a chat, a liked gift and her line **+55** (130); day 2 **+55** (185); day 3 a chat
  and a gift by midday **+45** (230 ≥ 200): **Friendship 1 is Ready on day 3**; it plays, +87, and Friendship 2 starts at
  30 banked + 87 = **117 of 240**.
- **RM14, no decay and banking:** points never fall; nothing is lost or locked. **Points past a full bar are banked**
  ("+120 banked") and carry into the next bar when the event plays. Points go to the ladder she's on: friendship until
  her confession is accepted, romance after, spouse after the wedding; while the confession, the proposal or the wedding
  waits, they bank into the next ladder.
- **RM15, gifts:** one a day each, no weekly cap. **Her loved gift shows from Friendship 1;** a liked or disliked one
  shows the first time you give it; **all her tastes show at Friendship 7.** The picker lists the Warehouse with each
  good's points for her at the stars you pick ("?" for one you haven't tried). Disliked gives 0 and a line from her, never
  a loss. Loved and liked goods are any star; stars multiply.
- **RM16, birthdays:** master data's character set (`birthday: { month, day }`), read at runtime, never in git; the cast
  file may carry `birthday` for a character the set lacks. March–May Spring, June–August Summer, September–November
  Autumn, December–February Winter; each month four farm days by quarters (1–8, 9–16, 17–24, 25–31):
  `season day = 4 × (the month's place in its season, 0–2) + ⌈min(day, 31) ÷ 8⌉`, held to 1–4. 1 March → Spring 1;
  1 April → Spring 5; 31 May → Spring 12; 14 February → Winter 10; 15 August → Summer 10; 31 December → Winter 4. On her
  birthday: **gifts ×3**, an evening **×1.5** (on top of her kind), a ★ line in the morning the day before and on the day.
  Two Umas may share a day; a birthday on a festival day is both.
- **RM17, anniversaries:** each year on her wedding's day of the year, from year 2 of her marriage: **2× points with
  her that day**, she leaves a **★5 item of her line** in the Warehouse, an evening with her is **×1.5**; the morning says
  so the day before.
- **RM18, affinity becomes love:** `levelOf(love)` replaces `heartsOf(affinity)`; rank points **×1.05 from Friendship 5
  and ×1.10 from Friendship 10 on**, through romance and spouse; no falls (disliked is 0); `STAY_AFFINITY` gone;
  `CHAT_LINES` by temperament kept as the fallback, and from Friendship 1 she speaks her authored chat set.
- **RM23's steps here:** step 6 pays **her line +10**; step 7's clearing takes `today`'s praise, events, evenings and
  invitations with the chats and gifts; step 9 writes **birthdays and anniversaries today and tomorrow**.
- **RM24, when an event is Ready,** all four: (1) **her bar is full** for the rung, or for a waiting rung it's the day
  after the rung before; (2) **she's home** (away shows "Swap her home"); (3) **she hasn't played an event today**
  (RM21); (4) **its one setup is met,** if it has one: she works a named place today; a named good is in the Warehouse;
  her bond with a named Uma has reached a level; a chapter has been reached. **Never an hour, the weather, a season or a
  festival.** What isn't met is said ("Romance 5 · the Pond, when she works it"; "Opens with chapter 3"); a setup that
  names a place not open says "Opens with chapter *n*" and waits.

### Decided here (the spec left these open)

1. **RM24's rule is written here, not in F49.** The spec and the handoff rows give RM24 to F49, but F48's Ready chips,
   its sort and its filter come first and need it, and Ready is the ladder's own state. So `readiness(save, pack, id)`
   lands here with the ladders; F49 plays what it says Ready and words its setups at playback (RM54).
2. **The ladder model** (`romance/love.ts`): `nextRung(love)` (an id from F46's `RUNGS`, or null once S5 has played),
   `costOf(rung)`, `bar(love) → { points, cost, banked, full }`, `levelWords(love)` ("Friend · F7", "Partner · R4",
   "Spouse · S2", "Close friend" for `friend`), the stage's colour, and **`advance(love, day)`**, which F49 calls when an
   event plays: the cost leaves `points` (the rest stays banked), the level or stage moves, `last` is the day. F10
   leaves her at stage `confession` (level 10), R10 at `proposal`, the proposal at `wedding`, the wedding at `spouse` 0;
   S5 completes the route. Points are **whole**: every pay rounds once, half up, after its factors.
3. **`addLove(save, id, points, source)`** is the one way points move: it applies the day's factors (decision 7), adds
   to `points`, never below 0, and does nothing once her route is complete. Its result says what was paid, for the "+N".
4. **Chats on v4:** +15 once a day each, home or away. Her line: before Friendship 1, `CHAT_LINES` by her temperament
   (from her outfit, F46's resolver); from Friendship 1, her authored set for her stage: `friend` through the
   confession, `partner` from Romance 1 to the wedding, `spouse` after it; drawn by `draw(uid, day, 'chat:<id>', 0)`, the
   same all day. A bible without `chats` keeps the temperament lines.
5. **Gifts on v4:** her taste is F46's `tasteOf` (RM7). Points = base × (1 + 0.1 × (★ − 1)) × 3 on her birthday × the
   anniversary's 2, rounded. The good leaves the Warehouse; seeds aren't gifts ("That isn't a gift."). The given good's
   taste joins `love.known` (learnt); her loved good counts as known from Friendship 1, everything from Friendship 7
   (derived, not stored). The picker shows each good's points at the chosen stars, or **?** where her taste for it isn't
   known; a disliked gift says one fixed original line ("She thanks you, a little puzzled.") and pays 0.
6. **Praise:** `today.praise` lists who has earned it today; `today.praised` who's been praised. She earns it when (a)
   her work that finished overnight made a ★3+ item (step 4's `made`, set at step 9 for the morning), (b) a harvest
   today from the block she tends gave a ★3+ crop, (c) she ranked up last night, or (d) she assisted a Fine-or-better
   workshop play today (M5's packets call `earnPraise`). **Praise +20** shows on her sheet only while earned and unpaid.
7. **The day's factors multiply once each:** a gift ×3 on her birthday; **on an anniversary every act pays ×2 except the
   evening, which takes its own ×1.5 instead** (RM17 lists both; ×2 and ×1.5 together would be ×3, which RM17 doesn't
   say). F50 applies the evening's factors (her kind, her birthday, her anniversary).
8. **Her line, +10 at step 6:** for each Uma who worked today (step 4's `worked` by `PLACE_ACTIVITY`, or tended a growing
   block) at one of her line's places (F46's `linePlaces`): the forest or the Sawmill for a forager, and so on. One +10 a
   night.
9. **A festival together, +50,** is a rule with tests here (`festivalTogether(save, ids, festival, year)`, once a festival
   a year each); nothing calls it until a festival has a team or entry (F39 in M5, F32 in M6).
10. **Birthdays:** `farmBirthday(month, day) → 1–48` (the day of the year); `MasterView` gains `birthdays` by character
    id from the characters set it already loads; the cast's optional `birthday` wins where present. `NightContext` gains
    `birthdays`. The stand-in cast gives 9000001 a birthday, invented, so the dark build shows one.
11. **Anniversaries** read `love.wed`: the days `wed + 48k`, k ≥ 1. That morning (step 9) she leaves a ★5 item of her
    line: **`lineGood(save, pack, id, stars)`**, RM32's morning-item column, written here and reused by F51's morning
    items: a crop of the season (farming), a good of her rank's deepest area this season (foraging), a fish of her
    deepest spot (fishing), an ore, stone or gem of her deepest floor (mining, M5), an egg, milk or fleece (ranch, M5), a
    dish of a known recipe (cooking, M5), a dish (serving, M6), a Fitting (forging, M6); each pick a seeded draw. **When
    her line's place isn't open yet, the anniversary leaves a ★5 crop of the season** (an anniversary is never empty).
12. **The rank-point factor:** `PointTerms` takes `heartsFactor` instead of `affinity`; v3 passes `affinityPoints`, v4
    ×1.05 from Friendship 5 (or any later stage) and ×1.10 from Friendship 10.
13. **`readiness(save, pack, id)`** returns `{ rung, ready, waits }`, `waits` one of `bar`, `day`, `ring`, `away`,
    `today`, `setup` (with the setup), `opens` (a chapter), `unwritten` (her event isn't scripted in the pack yet: "Her
    story is still being written") or `done`. Home is `dorm.home` (F54 adds housed spouses); a setup reads the beat's
    `trigger`: `working` a running job at a place of that activity or a tended growing block for farming; `item` any
    stars in the Warehouse; `bond` `bondHearts(points)` ≥ its level, CS44's 50/150/300/500/750 (`farm/bonds.ts`, which
    F52 grows); `chapter` the farm at or past it. A working setup on the ranch, mining, cooking, serving or forging
    before its chapter (2, 3, 4, 6, 7) is `opens`. The proposal's ring is any `ring-g1`…`ring-g10` in the Warehouse
    (F53's goods).
14. **The morning's Hearts lines here:** `{ kind: 'birthday', id, when }` and `{ kind: 'anniversary', id, when, item }`
    (`when` today or tomorrow), strictly parsed. Ready lines aren't stored: F48 reads them live, since Ready changes by
    day.
15. **Screens, for now:** until F48's profile, her sheet in the romance build (`/roster?uma=<id>`) shows her level words,
    her bar in the stage's colour with points over the cost and "+N banked", her Ready state and its words, **Chat +15**,
    **Gift** (the picker with points and "?"), **Praise +20** when earned, and the "+N" float; the morning card's Hearts
    section words F47's lines. F48 moves the sheet into the Hearts tab.
16. **Format additions** (validator and tests, the stand-in pack updated, a line in F40's D47 note):
    - **`chats`** in her bible: `{ friend: string[]; partner: string[]; spouse: string[] }`, 3–20 lines each, ≤ 160
      characters, the line rules (`{farmer}` only, no gendered or school words);
    - **`birthday`** in a cast entry, optional, `{ month: 1–12, day: 1–31 }`, a real date.

## Do

1. **The ladders** (decisions 2, 3): `romance/love.ts` with the costs, `nextRung`, `bar`, `advance`, `addLove`, the
   words and colours.
2. **The acts** (decisions 4–9): chat, gift (tastes, the picker's points, learning), praise and its causes, her line at
   step 6, festivals together, step 7's clearing.
3. **Birthdays and anniversaries** (decisions 10, 11): `farmBirthday`, master data's birthdays, `lineGood`, step 9's
   lines and the anniversary's item.
4. **The rank-point factor** (decision 12).
5. **Ready** (decisions 1, 13).
6. **The morning's lines and the sheet** (decisions 14, 15); the format's additions (decision 16).
7. **The manual:** [hearts.md](../../game/hearts.md)'s "Her route" and "Points" sections with live blocks (the costs
   table, the points table, the gift table with stars, the birthday mapping, Ready's four conditions);
   [ranks.md](../../game/ranks.md) (the factor on v4); [days.md](../../game/days.md) (steps 6, 7 and 9 on v4);
   [roster.md](../../game/roster.md) (v3's affinity marked M4's).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **costs:** RM12's table, 3,800 a ladder, 600 a spouse level, 10,600 a route; the waiting rungs free and Ready the
    day after; the proposal not Ready without a ring;
  - **RM13's worked days:** +75, +55, +55, +45 make Friendship 1 Ready on day 3 at 230; it plays (+87 through `advance`)
    and Friendship 2 shows 117 of 240;
  - **gifts:** a ★3 liked 36, a ★5 loved on her birthday 252, a disliked 0 and never a fall; one a day; the loved shown
    from F1, a given taste learnt, everything shown at F7; seeds refused;
  - **chats:** temperament lines before F1, her set by stage from F1, the same line all day;
  - **praise:** each cause earns it, it pays +20 once, it clears at night;
  - **her line:** +10 for a day at one of her line's places, nothing elsewhere, tending counts for farming;
  - **banking:** points past the bar stay banked and carry over; nothing decays; nothing is added once S5 has played;
  - **birthdays:** RM16's six dates; gifts ×3 that day; the lines the day before and on the day;
  - **anniversaries:** none in her wedding's year, ×2 that day from year 2 on (the evening's ×1.5 apart), a ★5 item of
    her line, a ★5 crop when her line isn't open, the line the day before;
  - **rank points:** ×1.05 from F5, ×1.10 from F10, on v4; v3's affinity factor unchanged;
  - **Ready:** each condition alone, each setup kind, `opens` for a place before its chapter, `unwritten` for an
    unscripted event (9000002's F1 in the stand-in pack);
  - **the summary:** the new lines parse; an Uma off the roster, a line twice and words are refused.
- Web tests (flag on): her sheet's bar and level, Chat, the gift picker's points and "?", Praise appearing after a
  rank-up, the morning's birthday line.
- Locally at 390×844 (and 375×667), the dev server with the flag on: chat with 9000001 and give a liked gift (+36 at ★3),
  learn it, praise her after a rank-up, end days until her Friendship 1 shows Ready, see her birthday line the day
  before; 9000002's Friendship 1 says "Her story is still being written". `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f47-ladders-points`, and a pull request for the main session to merge and deploy (`feat: the
ladders and points, dark (F47)`; `git status` and the private-content guard first). In the same branch: delete this
packet, mark its queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and log the
packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–16 and
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
- **The save:** v4 (F46) grows in place while the romance core is dark; each addition lands with parse tests. F56 ships
  v4; any change after it is v5, and M5 takes v5–v8. v3 and the M4 build stay as live until F56. `account.updatedAt`
  moves only on a player's change; no server writes into a save.
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

## Left to the worker

The modules' layout; the "+N" float's motion; the bar's drawing until F48; the disliked gift's line (original, kind);
how `lineGood` weights its seeded picks; the words of each `waits`.
