# F52 — Bonds between Umas, seeded by the ties: points, hearts, side by side, pair conversations

**uma-farm · Claude · M · Needs: F47 · Unblocks: F51 (in her element, her closest friend) and F54 (a shared house) ·
Beside: F48 · Milestone: the romance core**

## Why

The romance core leans on the Umas' bonds with each other: a perk works beside a 3-heart partner, Romance 4 strengthens
her closest friend's bond, and spouses sharing a house bond faster. Bonds were M6's (F33); RM48 moves them here. The 31
authored ties start them where the story says they stand, a new bond heart opens the pair's authored conversation, and
the night finally ticks them.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM48–RM50** whole; RM31's R4 row; RM33 (in her element, F51's);
  RM42 (+10 a night for a shared house, F54's); RM57's sixth line (bond hearts with **Read**); RM65's rows for FC25,
  FC27, CS17, CS38, CS44 and CS46; RM67's F52 row.
- [core-spec.md](../../design/core-spec.md): **CS44** (points, hearts, ×1.1 at 3, a duo move at 5), CS17 (the bond
  factor), CS46 (templates, M6's), CS38 (the Diary).
- [decisions.md](../../decisions.md): D30 (i: bond keys by `pairKey`, numeric order), D31 (b: `tickBonds` a no-op), D42
  (the 31 ties; strength 3 marks a closest tie; every Uma has at least two), D46, D47, and the D-decisions F46 and F47
  logged.
- [F40-story-authoring.md](F40-story-authoring.md): `ties.json` and `pairs/<a>-<b>.json` (RS11, RS12).
- The manual: [hearts.md](../../game/hearts.md), [days.md](../../game/days.md) (step 6), [gathering.md](../../game/gathering.md)
  (a day's haul), [fields.md](../../game/fields.md) (tended growth), [goals.md](../../game/goals.md) (the Diary).
- Code: `save/v3.ts` (`pairKey`), `night/end-day.ts` (`tickBonds`, steps 2, 4, 6, `NightNotes.worked`, `tended`,
  `made`), `fields/fields.ts` (`growFields`), `gathering/kinds.ts` (`MadeTonight`), F46's `arrive` and `story/pack.ts`,
  F47's `farm/bonds.ts` (`bondHearts`) and `readiness`, F46's scene player; on the web the profile's Ties (F48, if
  landed), `loop/DiaryPage.tsx`, `loop/summary-words.ts`.

## Decisions made

### From the spec

- **RM48, bonds move into the romance core** (FC25, CS44):

  | Shared | Points | |
  |---|---|---|
  | Working the same place the same day | +10 (×1.5 in a favourite line they share) | CS44 |
  | An expedition party, a day away | +15 | CS44 (M5) |
  | A festival team | +20 | CS44 (M6) |
  | The same staff meal, or the same breakfast | +5 | CS44, RM35 |
  | The same house, a night | +10 | RM42 (F54) |

  Hearts at **50, 150, 300, 500 and 750**; **×1.1 side by side at 3 hearts** (CS17); a **duo move at 5** on expeditions
  (CS49, M5). Bonds never fall. Step 6's `tickBonds` stops being a no-op.
- **RM49, the ties seed them:** when both Umas of an authored tie are on the farm, their bond starts at its strength:
  **3 → 150 (2 hearts), 2 → 50 (1 heart), 1 → 0** (known, with a line). **Her closest friend** is her strongest tie,
  then the most bond points, then the tie's order. **Romance 4 gives her bond with her closest friend ×1.5** points.
- **RM50, pair conversations:** each new bond heart opens a short conversation: **an authored one** for a tie's pair
  (each Uma's two closest ties, at all five levels, from the pack); CS46's templates for other pairs stay M6's (F33), so
  until then a pair without an authored conversation gets the heart's line and no scene; the morning lists new bond
  hearts with **Read**; the Diary keeps them.

### Decided here (the spec left these open)

1. **The bonds are `save.bonds`** (v3's field, `pairKey` of character ids on v4). `farm/bonds.ts` (F47 put
   `bondHearts` there) gains `addBond(save, a, b, points)` (never below what's there), `tickBonds` on v4 (v3 stays the
   no-op: M4 has no bonds), `closestFriend(pack, save, id)` and the seeds. Bond points are whole.
2. **The same place the same day:** every pair among the Umas who worked one place today (step 4's `worked` by place;
   the Fields' tenders with a growing block count as the Fields) earns **+10** once a night, **×1.5** when both have
   the same favourite activity (F46's `favouriteOf`) and it's that place's (`PLACE_ACTIVITY`, farming for the Fields).
   An Uma works one place a day, so a pair earns this once.
3. **The other sources are rules with tests, called by their packets:** `addBond` for an expedition party (+15 a day
   away, F28 revised), a festival team (+20, F32), the same staff meal (+5 each pair fed, F8 revised) and the same
   breakfast (+5 each pair of the crew it feeds, F54), and a shared house (+10 a night, F54).
4. **Romance 4's ×1.5:** points a pair earns are ×1.5 when either Uma is at Romance 4 or later and the other is her
   closest friend; once, never ×2.25 when both are.
5. **Seeds:** `arrive` (F46) seeds each of her ties whose other Uma is on the farm to `max(points, seed)`. **A seeded
   heart is a new heart:** its conversation opens and the morning lists it, so an arriving Uma comes with what her
   closest ties already share.
6. **Her closest friend** is defined over all her ties, on the farm or not (every Uma has two): strength, then bond
   points, then `ties.json`'s order. F51's Friendship 7 perk shows that Uma's loved gift.
7. **Side by side at 3 hearts, as a night extra.** A day's haul is planned when its job starts, so a ×1.1 at planning
   would miss a partner who starts later. So the bond factor pays **at step 4, after the hauls:** an Uma whose work
   finished items tonight (`made`) at a place where an Uma she has 3+ hearts with also worked today gets **+10% of those
   items as extras**: seeded copies of her night's items (the same good and stars, `draw(uid, day, 'bond:<id>', n)` for
   the fraction), straight into the Warehouse. A tended block grows **×1.1** at step 2 when its tender has a 3+-heart
   partner tending another block. The morning says "Side by side · +3 items". **This is `nightExtras`**, the step F51
   extends with in her element (×1.2 instead of ×1.1) and the capped romance bonus; uma-work's plans and outputs are
   untouched.
8. **The duo move at 5** is M5's to use (F28 reads `bondHearts` ≥ 5); nothing here.
9. **Pair conversations:** a heart reached tonight (by points or a seed) is a summary line `{ kind: 'bond', a, b,
   hearts }` in RM57's sixth place, with **Read** when the pack holds that pair's level (`pairs/<a>-<b>`, ids in
   `pairKey` order). Read plays it in F46's scene player; it pays nothing; a choice in it is wording only. Without an
   authored one, the line is the tie's `line` for a tie's pair, or "<a> and <b> are closer now" for another, with no
   scene. A read conversation goes in `diary.read` as `pair:<a>-<b>:<hearts>`.
10. **The pack** gains `pairs` (which pair files exist, and their levels), loaded on demand; **the stand-in pack** gains
    its pair (9000001 and 9000002, five levels, invented lines). 9000001 and 9000002's tie is strength 3 and 9000001 and
    9000003's strength 2, so the opening seeds them to 150 and 50 on day 1.
11. **On screen:** her profile's Ties (F48's section) show each tie's hearts moving and **Read** for a conversation
    opened and unread; the Diary gains **Conversations**: one row a pair with its hearts and the conversations read,
    each replayable. The morning's words: "♥♥ Stand-in & Stand-in two · bond 3 · Read".

## Do

1. **The rules** (decisions 1–6): `addBond`, `tickBonds` on v4 at step 6, R4's ×1.5, seeds in `arrive`, `closestFriend`.
2. **Side by side** (decision 7): `nightExtras` at step 4 with the bond term, tended growth at step 2, the morning's
   line.
3. **Pair conversations** (decisions 9, 10): the summary line and its parse, Read, the pack's pairs, the stand-in pair.
4. **The screens** (decision 11): the profile's Ties, the Diary's Conversations, the morning's words.
5. **The manual:** [hearts.md](../../game/hearts.md)'s "Bonds" section with live blocks (CS44's sources, the hearts'
   thresholds, the seeds); [days.md](../../game/days.md) (steps 2, 4 and 6 on v4);
   [gathering.md](../../game/gathering.md) and [fields.md](../../game/fields.md) (side by side);
   [goals.md](../../game/goals.md) (the Diary's conversations).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **points:** +10 a pair at one place, ×1.5 with a shared favourite at its place, once a night, the Fields' tenders
    counted; every other source through `addBond`; never a fall;
  - **hearts:** 50, 150, 300, 500 and 750 at their edges; two at one place every day reach hearts on CS44's days (5, 15,
    30, 50, 75);
  - **seeds:** 3 → 150, 2 → 50, 1 → 0 when the second Uma arrives, not before; a seed never lowers a bond; a seeded heart
    opens its conversation;
  - **closest friend:** strength, then points, then order; R4's ×1.5, once when both qualify;
  - **side by side:** +10% of a night's items at 3 hearts (an exact count over a seeded sample), none at 2, the same
    goods and stars; a tended block ×1.1 with a 3-heart partner tending another;
  - **conversations:** a new heart's line with Read when authored, the tie's line or the generic one when not, Read once
    into `diary.read`, the summary line's parse.
- Locally at 390×844 (and 375×667), the dev server with the flag on: on day 1, 9000001 and 9000002 show 2 hearts and the
  morning lists their conversations with Read; a dev save at 290 points between two Umas sent to the forest together
  reaches 3 hearts that night, and the next night's morning shows "Side by side"; the Diary lists the pair.
  `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f52-bonds`, and a pull request for the main session to merge and deploy (`feat: bonds between
Umas, dark (F52)`; `git status` and the private-content guard first). In the same branch: delete this packet, mark its
queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and log the packet's D-decision
in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–11 and anything settled
while building. The main session merges, watches the deploy and adds the run's link.

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
  packet adds a summary line). F56 ships v4; any change after it is v5, and M5 takes v5–v8. v3 and the M4 build stay as
  live until F56. `account.updatedAt` moves only on a player's change; no server writes into a save.
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

The modules' layout; the generic heart line's words (original); the Diary's Conversations drawing; how the morning
groups several new hearts of one pair; the stand-in pair's lines (original, invented).
