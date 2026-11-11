# F53 — The ring bench, the proposal and the wedding

**uma-farm · Claude · M · Needs: F50, F51 · Unblocks: F54 · Milestone: the romance core**

## Why

At Romance 10 the farmer proposes with a ring they made (RS6), and the wedding follows. The Forge's merge game is M6's,
but the first weddings come long before (day 34 for a focused player, RM63), so the Forge opens early as a **ring
bench**: three refined goods of a grade make that grade's ring, no gold and no game. This packet builds the bench and
Ida Stone's scene that opens it, the ring's bonus, the proposal, and the wedding with its three choices and its
stage-up, in words that never gender the farmer.

## Context (read first)

- [romance-spec.md](../../design/romance-spec.md): **RM30** (the proposal and the wedding), **RM38–RM40** whole with the
  bench's mockup; RM31's R8 and R10 rows; RM34 (her ring inside her own +35%); RM41–RM42 (her room, F54's); RM45
  ("Married n/20"); RM55's stage-up screen and its "Married" mockup; RM65's rows for FC13, CS25 and CS41; RM67's F53 row.
- [core-spec.md](../../design/core-spec.md): **CS25** (the rings `ring-g1…g10`, their ★1 prices and uma-art frames
  `accessory-setting-g1…g10`), CS22 (a meal's days by tier), CS41 (Ida Stone), CS3 (the Forge at chapter 7).
- [decisions.md](../../decisions.md): D30 (5: a building absent is locked, 0 is "held, not built"), D32 (the catalogue,
  the bin), D38 (j: a scene's read is a player's change), D46, D47, and the D-decisions F46–F52 logged.
- The manual: [hearts.md](../../game/hearts.md), [goods.md](../../game/goods.md), [goals.md](../../game/goals.md) (the
  cast, scenes), [days.md](../../game/days.md) (the map).
- Code: `goods/ids.ts` and `goods/rule.ts` (the catalogue and prices), `save/warehouse.ts`, `farm/places.ts` (the
  Forge's place), `loop/farm-map.ts` (`PLACE_SCREENS`, `lockOf`), `story/cast.ts` (`ida-stone`), F46's `sceneDue` on v4
  and the scene player, F47's `readiness` (the proposal's ring) and `advance`, F49's player, `playEvent` and stage-up
  screen, F50's `marriedCount`, F51's `romanceBonus` (her ring in her own term) and `breakfast`, F52's `closestFriend`,
  `items/ItemIcon.tsx` and `items/frames.ts` (the icon atlas).

## Decisions made

### From the spec

- **RM38, the ring bench:**
  - **When:** the morning after your **first Romance 8** event, Ida Stone (CS41's smith) comes up from town in a short
    scene and opens the Forge's building on the workshop row as **the ring bench**. Chapter 7's opening (the merge game
    and tools) stays.
  - **The recipe:** **a ring of grade *g* from 3 refined goods of grade *g*,** any family (planks, fillets, flours,
    preserves, dried goods; ingots and cut gems later). From chapter 3 (M5), CS25's own recipe works too: 2 ingots + 1
    cut gem of the grade. The rings are CS25's ten, `ring-g1…g10`, so no new good or art.
  - **Cost:** the goods only. **No gold, no gate, one ring a day,** no assistant, no score (a Rough make).
  - Worked: 3 Cedar Planks (G3, 60g each) make an **Iron Ring** (`ring-g3`, 340g); 3 Salmon Fillets (G5) a **Cobalt
    Ring** (`ring-g5`).
- **RM39, the ring's bonus:** **any ring** makes the proposal Ready. Once she's married, **her ring adds +1% at her line
  a grade (1–10)**, plus +0, +1, +3 or +5 for a Rough, Fine, Great or Masterwork make from M6's merge game: **up to
  +15%**, inside her own cap. **Give her a better ring** at the bench any day: she keeps the best, the old one returns to
  the Warehouse. One ring each; rings are unlimited; **no house, bed, gold or calendar gate on a proposal.** At Romance 8
  her profile shows the engraving her ring will carry (a line from her route).
- **RM40, the Forge's timeline:** the Forge's building opens with the ring bench instead of chapter 7; chapter 7 (M6)
  lights its fire for the merge game, tool upgrades and Rings and Fittings to sell. Ida Stone's first scene moves to the
  bench's opening; CS41's "first seen: chapter 7" becomes "the first Romance 8".
- **RM30, the proposal and the wedding,** each **3–5 minutes** with 2–3 plays or choices with visible effects and a
  **stage-up screen**:
  - **the proposal** is Ready the day after Romance 10 **with a ring in the Warehouse** and always succeeds; the ring is
    used;
  - **the wedding** is Ready the morning after the proposal and **waits until you play it.** Three choices: **the place**
    (one of three farm places her route names); **the reception dish** (any dish in the Warehouse: the whole crew is well
    fed tomorrow at that dish's tier; with no Kitchen yet, Marta's bakery sends a cake, a Rough meal); **the vow line**
    (wording only). Every spouse and her two closest friends among the Umas attend. She then takes a room (RM42) and her
    ring's bonus starts.
  - **Words:** "spouse", "partner", "vows", "your wedding"; never bride, groom, husband or wife for the farmer (RS2;
    F40's validator lists them).

### Decided here (the spec left these open)

1. **The covers and Needs:** this packet builds RM38–RM40 and RM30's proposal and wedding; RM37 (the handoff row's range
   starts there) is F50's evening kinds. **The Needs stay the handoff row's, F50 and F51** (the spec has F49 and F51):
   the stage-up lists the evenings a spouse opens, the ring's bonus sits in F51's cap, and the order lands both first.
2. **The rings join the catalogue:** a family `rings`, ten raw goods `ring-g1…g10` at CS25's ★1 prices (205, 275, 340,
   450, 580, 745, 950, 1,220, 1,555, 2,025), named Copper to Orichalcum Ring as CS25 has them, drawn with uma-art's
   `accessory-setting-g1…g10` item frames. They're additive (no v3 rule makes one), they sell at the bin like any good,
   and they form a Diary row like any family. One a day from goods worth a little less keeps the bench a ring maker, not
   a mint (the worked Iron Ring: 180g of planks → 340g).
3. **The bench is `buildings.forge = 0`** on v4: the building stands, its fire unlit (D30's "0 is held, not built",
   read as RM40's "opens as the bench"); chapter 7 (M6) sets 1. On v4 the map's Forge opens when `buildings.forge` is
   set, its quick look reads "Ring bench · one ring a day", and before that "Opens with your first Romance 8". v3's Forge
   is unchanged. One ring a day is `today.ring` (v4 in place, cleared at step 7).
4. **The opening:** the night after any Uma's first Romance 8 event (an `r8` in `memories`), step 8 sets the bench and
   makes `scene:bench` due; it plays the next time the farm opens with the summary put away (F46's order), once
   (`diary.read`). Its lines are original and short, in git (`story/bench.ts`): Ida Stone up from town, the old Forge, a
   bench by the door, "a ring of any grade from three refined goods of that grade". Her bust is a lettered disc until
   her art is pinned.
5. **The bench's sheet** (`?sheet=bench` from the Forge's quick look), RM38's mockup: one row a grade you can make now,
   each with the three goods it would take (the lowest-value refined goods of that grade, lowest stars first, any
   family, any mix; a tap swaps them), "→ Iron Ring"; CS25's recipe greyed "Opens with chapter 3" (it works from then,
   with ingots and cut gems of the grade); "Her bonus once married: +1% a grade"; **Make an Iron Ring · 1 a day**. A made
   ring is ★1 (a Rough make) in the Warehouse. Refusals: "Three refined goods of one grade.", "One ring a day.".
6. **Her ring's bonus on v4 is its grade:** every ring is Rough until M6's merge game, so `love.ring` holds the grade
   (1–10), set at the proposal; F51's own term reads it once she's a spouse. M6's F36 stores a ring's make when it adds
   the play's +1/+3/+5 (a v5-or-later change). **Give a better ring:** from the proposal on, her profile's Ring row offers
   any higher-grade ring in the Warehouse; the new one leaves it and the old (`ring-g<old>`, ★1) comes back.
7. **The engraving** (R8): her profile shows "Her ring will read: ‘…’" from Romance 8, with her R8 beat's line (its
   `beat`, her Memory's caption), so no new field is needed; the story session can write that beat with it in mind.
8. **The proposal:** Ready by F47's rule; **Play ›** first asks which ring (the best grade preselected), then F49's
   player plays the authored event (up to three plays or choices); it always succeeds: the ring leaves the Warehouse,
   `love.ring` is its grade, `advance` moves her to the wedding's wait, and the stage-up screen reads **Engaged** and
   lists "Your wedding: tomorrow, whenever you're ready".
9. **The wedding:** Ready the next day and waiting; **Play ›** asks the place first (the three of her bible's
   `wedding.places`, each with its place card), then the authored event plays on that place's card (its vow line is its
   authored choice point, paying as any choice, its words kept as a flag), then the reception: any dish in the Warehouse
   (`isDishId`), used, makes the crew well fed tomorrow for 1 day at ★1–2, 2 at ★3–4 and 3 at ★5 (CS22's 1–3 days, read
   from the dish's stars, since the Warehouse holds no play tier); with no dish (no Kitchen before M5), **Marta's bakery
   sends a cake**: one day. The meal is `today.reception` (v4 in place), applied at step 9 to everyone on the farm,
   never shortening a meal already running. **The guests** are every spouse and her two closest friends (F52's
   order), on the farm, shown as faces on the card with a line of narration; they have no lines. Then `advance` makes
   her a spouse (`wed` is today, so F47's anniversaries follow), and the stage-up screen is RM55's "Married": the
   track turns gold, "Opens now" lists the spouse ladder, her ring's bonus at her line, house mornings (once F54's
   homestead is in), her anniversary's date, and "Married n/N · next household scene at 5". Until F54 she keeps her
   Dorm bed.
10. **The words:** every string this packet writes says spouse, partner, vows, your wedding, you; a test scans the
    bench's, the proposal's and the wedding's code strings and the stand-in's events with the validator's gendered list.
11. **Format addition** (validator, stand-in bible, a line in F40's D47 note): **`wedding: { places: [place, place,
    place] }`** in her bible, three different story places (RM58).
12. **The stand-in route's** proposal and wedding events are written (invented, original) with plays and choices, so the
    whole path plays on 9000001.
13. **The ring bench's mark** is F55's (`farm/ring-bench`); a stand-in until its release is pinned.

## Do

1. **The rings** (decision 2) in the catalogue, prices, icons, the Diary's row.
2. **The bench** (decisions 3–5): its state, the night's opening, `scene:bench`, the sheet, making a ring, the map.
3. **The ring's bonus and a better ring** (decision 6); the engraving (decision 7).
4. **The proposal and the wedding** (decisions 8, 9) on F49's player, the reception at step 9, the stage-up screens.
5. **The words' test and the format's addition** (decisions 10, 11); the stand-in route (decision 12).
6. **The manual:** [hearts.md](../../game/hearts.md)'s "The ring and the wedding" section (live blocks: the bench's
   recipe, the rings and their prices, the reception's days); [goods.md](../../game/goods.md) (the rings);
   [goals.md](../../game/goals.md) (Ida Stone first seen at the bench; the bench's scene); [days.md](../../game/days.md)
   (the Forge on v4).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks ≤ 180 KB gzip (the numbers in the pull request); the
  private-content guard passes and `git grep` finds no character name.
- `pnpm docs:update` leaves every live page unchanged.
- Domain tests:
  - **the bench:** opens the morning after the first R8, once, and never before; its scene plays once; 3 Cedar Planks
    make an Iron Ring and 3 Salmon Fillets a Cobalt Ring; any mix of refined goods of one grade works; two goods, raw
    goods or mixed grades are refused; one a day; no gold moves; CS25's recipe refused before chapter 3 and working
    after;
  - **the rings:** ten goods at CS25's prices, sold at the bin, a Diary row;
  - **the proposal:** not Ready without a ring or before the day after R10; the chosen ring used; `love.ring` its grade;
    always a success;
  - **a better ring:** the old one back in the Warehouse, the bonus up; a lower one refused;
  - **the wedding:** Ready the next day and waiting; the place from `wedding.places`; a ★3 dish gives two days and is
    used; no dish gives Marta's cake, one day; a running meal never shortened; the guests; `wed` set, the stage spouse,
    her ring's bonus in F51's term, her anniversary a year on;
  - **the words:** no gendered word for the farmer anywhere this packet writes;
  - **the format:** `wedding.places` validated (three, different, known places).
- Web tests (flag on): the bench's sheet makes a ring; the proposal's ring picker; the wedding's place, scene, reception
  and "Married" stage-up.
- Locally at 390×844 (and 375×667), the dev server with the flag on: a dev save with 9000001 at Romance 8 played: the
  next morning Ida's scene, the bench at the Forge, a ring from planks; at Romance 10 the next day the proposal, the
  following day the wedding at a place of three with Marta's cake, the stage-up; "Married 1/3" in the Hearts header.
  `VITE_FARM_ROMANCE=0 pnpm web` plays M4 with its Forge locked as before.
- Production, after the merge's deploy: health shows the commit, and production still plays M4.

## Deliver

On a branch, `feat/f53-ring-wedding`, and a pull request for the main session to merge and deploy (`feat: the ring
bench, the proposal and the wedding, dark (F53)`; `git status` and the private-content guard first). In the same branch:
delete this packet, mark its queue row Done and add a Done row in [the handoff](../README.md) with the pull request, and
log the packet's D-decision in [decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions
1–13 and anything settled while building. The main session merges, watches the deploy and adds the run's link.

## Rules that hold (every romance-core packet)

- **No original-game content in git:** no outfit or character names, no character or outfit id tied to a name, nothing
  that quotes or paraphrases the private story, in code, tests, docs, commits or pull request bodies. Tests and the dark
  build use the stand-in pack (9000001–9000003), other invented ids and `@luismlorenzana/uma-data/testing`; names,
  titles, birthdays and art come from master data at runtime, story text from the private pack at runtime. Run
  `git status`, `pnpm test` after staging (the private-content guard reads the git index) and `git grep` for names
  before committing.
- **RS2, RS3 and RS4 hold in every line and screen:** every Uma is an adult; romance is tender and non-explicit, with a
  fade before anything more; the farmer is never gendered and never drawn, lines say "you", and `{farmer}` is the only
  placeholder. Ida Stone's lines and every wedding word this packet writes follow the same rules.
- **The save:** v4 (F46) grows in place while the romance core is dark; each addition lands with parse tests (this
  packet adds `today.ring` and `today.reception`, and fills `love.ring` and `love.wed`). F56 ships v4; any change after
  it is v5, and M5 takes v5–v8. v3 and the M4 build stay as live until F56. `account.updatedAt` moves only on a player's
  change; no server writes into a save.
- **Dark until F56:** the romance plays only with `VITE_FARM_ROMANCE=1`; production deploys the M4 build. Inside
  `@farm/domain`, what the romance changes keys off the save's version, never the flag.
- **Main JS ≤ 180 KB gzip in both builds** (164.0 KB live, as CI measures it): the bench, the scenes and the stage-up load
  on demand (`LAZY_MODULES`); anything that must load at start is measured in the pull request.
- **`uma-work` and `uma-kit` aren't forked:** anything they lack is a "Both apps" request to uma-platform, sent by the
  main session and pinned when released.
- **Nights are seeded** (`draw(uid, day, what, n)`); every number the player earns shows on screen before or as it's
  earned (RM13).
- **The manual changes in the same commit as each rule,** marked "romance build; live from F56"; live blocks through
  `pnpm docs:update`.
- **Portrait 390×844 first** (check 375×667), 44 pt targets and 48 pt choices, safe areas; player-facing text short,
  rules behind a help button.
- **Production saves:** never move `save.account.updatedAt`, never write into a save from a server, and a stale server
  date means stop and ask.

## Left to the worker

The modules' layout; Ida Stone's lines (original, short, within decision 4); the bench's and the reception's drawing; how
the three goods are swapped on the bench; the guests' narration line; the stand-in's proposal and wedding lines.
