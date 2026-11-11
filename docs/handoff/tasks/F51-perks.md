# F51 — Perks and their caps: a perk on every level, the line effects, night chores, morning items, breakfasts

**uma-farm · Claude · M · Needs: F49 · Unblocks: F53 (with F50), F54 · Beside: F50 · Milestone: the romance core**

## Why

Every level of her route gives something you can feel on the farm (research b3): more from her work at her line, a
chore done at night, an item left in the morning, a recipe, a keepsake. F48 listed them in words; this packet makes each
one act, written once as templates by her favourite line, with the three bespoke ones (her signature dish, keepsake and
dream) read from her bible. One table of caps keeps the married household the farm's endgame without running away
(about +40% once all 20 are married, RM64).

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM31–RM36** whole; RM39 (the ring's bonus, inside her own cap; F53
  gives the ring); RM42 and RM43 (a morning in her house, F54); RM45 (the household's +5% and +5%); RM63's "where year
  5's lift comes from"; RM65's rows for FC14, FC15, CS17, CS21, CS22, CS26 and CS29; RM67's F51 row.
- [core-spec.md](../../design/core-spec.md): CS17 (a day's haul), CS18 (stations), CS21 (the dishes: Salad
  `dish-vegetables-*`, Bread `dish-grains-*`, Tart `dish-fruits-*`, Grill `dish-fish-*`, Curry `dish-herbs-spices-*`,
  Soup `dish-mushrooms-*`, Cake `dish-sweets-*`, Cookies `dish-nuts-seeds-*`), CS22 (well fed, the staff meal), CS26
  (the star formula's sources), CS29 (rank points).
- [decisions.md](../../decisions.md): D31 (d: well fed is uma-work's `speedUp`), D32 (b: quality's sources), D34 (the
  Fields' harvest and growth), D36 (c: talents in planning; a haul is planned at the job's start), D46, D47, and the
  D-decisions F46–F49 and F52 logged.
- The manual: [hearts.md](../../game/hearts.md), [gathering.md](../../game/gathering.md), [fields.md](../../game/fields.md),
  [ranks.md](../../game/ranks.md), [goods.md](../../game/goods.md) (stars), [days.md](../../game/days.md).
- Code: `gathering/kinds.ts` (`WorkTerms`, `planHaul`, `gatherQuality`, `stationRate`), `gathering/tables.ts`,
  `fields/fields.ts` (`harvest`, `growFields`), `goods/stars.ts` (`quality`), `farm/rank-rules.ts` (`tickRankRules`),
  `night/end-day.ts` (steps 2–6, 9), F52's `nightExtras` and `closestFriend`, F47's `lineGood`, `addLove` and the
  rank-point factor, F48's `romance/perks.ts` (the words) and profile, F49's `playEvent`, F50's `marriedCount`.
- F52 is in the order beside F48, before F49, so its bonds and `nightExtras` are there when this starts.

## Decisions made

### From the spec

- **RM31, a perk on every level,** templates by her favourite line; only her signature dish (F4), her keepsake (F10,
  upgraded at S5) and her dream (S3's event) are bespoke. Every perk is on her profile before it's reached.

  | Level | Friendship | Romance | Spouse |
  |---|---|---|---|
  | **1** | Her loved gift shown; her own chat set | Dates open; her pet name for you | **Breakfast** on a morning in her house (RM35) |
  | **2** | Hangouts open | **Morning item** every 4th morning: a ★2+ good of her line | Her morning item **every 2nd morning** (★3+), and every morning in her house |
  | **3** | **+10% at her line** | Date kind: stargazing | **Her dream** event; **+5%** for anyone at her line's place |
  | **4** | **Her signature dish's recipe** | Her bond with her closest friend **×1.5** | A **third night chore** |
  | **5** | **×1.05 rank points** | **+10% more** at her line (+20%) | Vow renewal; **her keepsake upgrades** |
  | **6** | **Night chore:** one item at her line each night | Date kinds: dance and boat | |
  | **7** | All her tastes shown, and her closest friend's loved gift | A **second night chore** | |
  | **8** | **In her element:** ×1.2 beside a 3-heart partner at her line | Her ring's engraving (F53) | |
  | **9** | **Mentor:** +10% rank points for Umas at her place | Date kind: footrace (M6) | |
  | **10** | **Her keepsake**; **×1.10 rank points**; then her confession | The proposal | |

  - **Her signature dish:** her loved good when it's a dish; otherwise her line's dish kind (farming Salad, ranch Cake,
    mining Curry, fishing Grill, foraging Soup, cooking Tart, serving Cookies, forging Bread) at the grade of her line's
    best place. Before the Kitchen (chapter 4) the recipe waits in the Kitchen's list.
  - **Her keepsake:** a named item (bespoke name and line), **+0.25 quality at her line, +0.5 from S5**; on her profile,
    not in the Warehouse.
  - **Her dream:** her S3 event (bespoke); its effect is the template's, +5% for the crew at her line.
- **RM32, what "her line" means:**

  | Her line | +10% at her line (F3, R5) | A night chore (F6, R7, S4) | A morning item (R2, S2) |
  |---|---|---|---|
  | Farming | Each plot she tends: +10% chance of an extra crop at harvest | +0.25 growth on one untended block (else hers), step 2 | A ★2+ crop of the season |
  | Foraging | Her haul ×1.1, and her Sawmill batch ×1.1 | 1 item from her rank's deepest area | A ★2+ good from that area |
  | Fishing | Her catch ×1.1, and her Smokehouse batch ×1.1 | 1 fish from her deepest spot | A ★2+ fish |
  | Mining (Mine or Quarry) | Her haul ×1.1, and her Smelter or Cutter batch ×1.1 | 1 ore, stone or gem from her deepest floor | A ★2+ ore, stone or gem |
  | Ranch | Her pen: +10% chance of an extra product | +5 affection to her pen, step 3 | A ★2+ egg, milk or fleece |
  | Cooking | +10% dishes as the Kitchen's assistant | +1 dish on the next play | A ★2+ dish of a known recipe |
  | Serving | +10% tips as the Restaurant's server | +1 cover on the next shift | A ★2+ dish |
  | Forging | +10% goods as the Forge's assistant | +5% refund on the next tool | A ★2+ Fitting |

  Counts are expected values: a fraction becomes a whole item by a seeded draw (`draw(uid, day, 'perk:<id>', n)`). Night
  chores and morning items go straight to the Warehouse; the morning says "Night chores · 3 items".
- **RM33, the shared effects:** in her element ×1.2 on CS17's bond term; mentor +10% rank points at her place, one a
  place; keepsake +0.25/+0.5 quality (CS26's sources); her dream +5% items for anyone at her line's place; the
  household +5% crew-wide at 5 married and +5% more at 15; breakfast (RM35).
- **RM34, the caps:** her own line bonuses (F3 +10%, R5 +10%, her ring +1–15%) **+35%**; the crew's (a dream's +5%, the
  best at a place, never summed; the household's +5% and +5%) **+15%**; **all romance bonuses on any one job, added,
  +40%**; night chores **3 items a night** each; morning items **1 a day** each, **+1** on a morning in her house; one
  mentor a place; rank points from her ladder ×1.10. Worked: a married forager with F3, R5 and a grade-8 ring has +28%;
  a dream at the forest and 15 married add +15%; together **+43%, held to +40%**.
- **RM35, breakfasts:** a spouse's S1 perk: on a morning in her house, **the whole crew starts well fed for the day**
  (×1.25, as a Rough meal: one day), **only when no meal is running.** A staff meal served the same day replaces it; a
  breakfast never counts as a staff meal (chapter 4's goal).
- **RM36:** a perk at a place not open yet shows "Opens with chapter *n*" and works from that day; in the romance core
  alone, the Mine and Quarry Umas' line perks wait for M5's chapter 3.

### Decided here (the spec left these open)

1. **Most perks are read from her level,** not stored: each effect asks `hasPerk(love, rung)`. Only the signature dish
   writes state (its recipe into `workshops.recipes`, once, when F4 plays, through F49's `playEvent`). F1, F2, F5, F7's
   tastes, F10's ×1.10, R1's dates, R3, R6 and R9 are F47's and F50's, already acting.
2. **The romance term is one capped number,** `romanceBonus(save, pack, id, place)`: her own (F3 + R5 + her ring, if
   this place is her line's) capped at 35%, plus the crew's (the best dream whose line's place this is, plus the
   household's 5% and 5% by `marriedCount`) capped at 15%, the sum capped at 40%. **In her element stays in the bond
   term,** outside the cap, as RM34's worked example has it.
3. **It pays through F52's `nightExtras` at step 4:** her items finished tonight × (the bond term × (1 + the romance
   term)) − her items, as seeded copies of her night's items (the same goods and stars), straight into the Warehouse.
   That covers RM32's hauls and station batches (forest, Fishery, Sawmill, Smokehouse; the Mine's and the Quarry's from
   M5) with no change to a job's plan. **Farming** is at harvest instead: a harvested plot of a tended block has that
   chance (her own if farming is her line, plus the crew's) of one extra crop, at the plot's stars. The household and
   dreams lift work an Uma does (jobs and tending); an untended block's harvest gets nothing.
4. **In her element** (F8): F52's ×1.1 becomes ×1.2 for her when she's at her line's place beside an Uma she has 3+ bond
   hearts with.
5. **Night chores:** 1 from F6, 2 from R7, 3 from S4, for an Uma on the farm (home or housed), each its own seeded pick:
   farming adds +0.25 growth (step 2) to the untended block with the most growing plots, else hers; foraging one item
   from her rank's deepest forest area this season, at the stars of a day's haul for her; fishing one fish from her
   deepest spot, the same way; mining, ranch, cooking, serving and forging wait for their chapters (M5, M6), saying
   "Opens with chapter *n*". The morning's Hearts line is "Night chores · 3 items" (the house's morning in RM57's
   order).
6. **Morning items:** at step 9, `lineGood` (F47) at ★2 or more from R2, every 4th morning counted from the day she
   reached R2; from S2, every 2nd morning counted from S2, at ★3 or more (S2 replaces R2's count); one a day by her
   count, and F54 adds +1 on a morning in her house. The stars are her line's quality draw, held at the minimum. On the
   farm only.
7. **Mentor** (F9): at step 6, Umas who worked her line's place today while she worked there too earn +10% rank points;
   the mentor herself doesn't; one mentor's bonus a place, whoever has the most hearts first.
8. **Her keepsake** (F10) is a planning-time quality source: CS26 gains `keepsake`, +0.25 at her line's place (+0.5 from
   S5), read when her job is planned or when the block she tends is harvested. Its name and line come from her bible
   (format addition below) and show on her profile from F10.
9. **Her signature dish** (F4): `isDishId(loved)` → that dish; else her line's dish kind at the top grade of the deepest
   place her line has opened on the farm when F4 plays (the forest's deepest area anyone has worked, the Fishery's
   deepest spot, the highest seed tier in the shop for farming; mining and the workshops from their chapters). The recipe
   joins `workshops.recipes`; the Kitchen (M5's F8) reads the list.
10. **Her dream** (S3) acts once her S3 event is in `memories`.
11. **Breakfast** is `breakfast(save, day)`: every Uma on the farm with no well-fed days left starts the day well fed
    for one day (a Rough meal); it never replaces or extends a meal's days, and it isn't a staff meal. F54's house
    morning calls it; F52's +5 a pair is paid for the crew it feeds.
12. **Her profile's Perks** (F48's section): reached ✓ with what it does now ("+20% at the forest · +8% ring"), the next
    one, the rest greyed; a perk at a place not open says "Opens with chapter 3"; her keepsake and pet name show once
    reached; Friendship 7 adds her closest friend's loved gift to Gifts.
13. **Format additions** (validator, stand-in bible, a line in F40's D47 note): **`keepsake: { name, line }`** in her
    bible (RM58 asks for it); **`petName`** in her bible, a short string shown from Romance 1 (RM8 and RM31 call it
    authored per route; RM58's list of seven doesn't name it).

## Do

1. **The perks' effects** (decisions 1, 12) over F48's words, and `hasPerk`.
2. **The romance term** (decisions 2–4): `romanceBonus` with its caps; `nightExtras`' romance term; farming's extra crop
   at harvest; in her element.
3. **Night chores and morning items** (decisions 5, 6) at steps 2, 4 and 9, with the morning's lines.
4. **Mentor, keepsake, signature dish, dream, breakfast** (decisions 7–11).
5. **The format's additions** (decision 13).
6. **The manual:** [hearts.md](../../game/hearts.md)'s "Perks" section with live blocks (RM31's table by line, RM32's
   meanings, RM34's caps); [gathering.md](../../game/gathering.md), [fields.md](../../game/fields.md) and
   [ranks.md](../../game/ranks.md) (the romance term, the extra crop, the mentor); [goods.md](../../game/goods.md)
   (the keepsake's quality); [days.md](../../game/days.md) (the steps on v4).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **caps:** RM34's worked forager (+43% held to +40%); her own at 35% (F3, R5 and a +15% ring); the crew at 15%; two
    dreams at one place count once; in her element outside the cap;
  - **the line effects:** a forager's night items ×1.1 at F3 and ×1.2 at R5 (exact counts over a seeded sample, same
    goods and stars); a Sawmill batch the same; a tended plot's extra crop at 10%; nothing for an untended block; a
    miner's +10% "Opens with chapter 3" and inert;
  - **night chores:** 1, 2 and 3 at F6, R7 and S4; growth on the right block; an item from the deepest area or spot;
    never more than 3; away does none;
  - **morning items:** every 4th morning from R2 at ★2+, every 2nd from S2 at ★3+, one a day by her count;
  - **mentor:** +10% for the others at her place while she works there, one a place;
  - **keepsake:** +0.25 quality at her line from F10, +0.5 from S5, nowhere else;
  - **signature dish:** a loved dish taken as is; else the line's kind at the rule's grade, once, into
    `workshops.recipes`;
  - **breakfast:** the crew well fed one day when none is; nobody's meal shortened or extended; not a staff meal;
  - **the format:** `keepsake` and `petName` validated; the stand-in bible has both.
- Locally at 390×844 (and 375×667), the dev server with the flag on: a dev save puts 9000002 (a forager) at R5 with a
  ring bonus set by hand: her forest night shows the extras; at F6 a night chore's item lands; at R2 a morning item; her
  profile's Perks show what each does now and a miner's "Opens with chapter 3". `VITE_FARM_ROMANCE=0 pnpm web` plays M4.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f51-perks`, and a pull request for the main session to merge and deploy (`feat: perks and their
caps, dark (F51)`; `git status` and the private-content guard first). In the same branch: delete this packet, mark its
queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and log the packet's D-decision
in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–13 and anything settled
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
- **The save:** v4 (F46) grows in place while the romance core is dark; each addition lands with parse tests. F56 ships
  v4; any change after it is v5, and M5 takes v5–v8. v3 and the M4 build stay as live until F56. `account.updatedAt`
  moves only on a player's change; no server writes into a save.
- **Dark until F56:** the romance plays only with `VITE_FARM_ROMANCE=1`; production deploys the M4 build. Inside
  `@farm/domain`, what the romance changes keys off the save's version, never the flag: v3's hauls, harvests and ranks
  are unchanged.
- **Main JS ≤ 180 KB gzip in both builds** (164.0 KB live, as CI measures it): every new table and rule loads on demand
  (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **`uma-work` and `uma-kit` aren't forked:** the romance term pays as night extras, never by changing uma-work's plans;
  anything else they lack is a "Both apps" request, sent by the main session and pinned when released.
- **Nights are seeded** (`draw(uid, day, what, n)`); every number the player earns shows on screen before or as it's
  earned (RM13).
- **The manual changes in the same commit as each rule,** marked "romance build; live from F56"; live blocks through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets, safe areas; player-facing text short, rules behind a help
  button.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

The modules' layout; the perks' "now" wording on her profile; the seeded picks' weights (a chore's area goods by the
season's shares is the natural one); the morning lines' grouping; how the mentor's tie between two Umas is broken beyond
hearts.
