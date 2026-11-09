# The roster

**Built in F23, live from F24.** Umas join the farm
over time: you start with **three you pick from six**, the **Dorm's beds** cap who lives and works on the farm at once,
and **visitors** come to the Gate and stay once you've won them over with chats and gifts. A chapter's end brings a
recruit for the farm's weakest activity. The roster can grow past the beds: everyone beyond them is **away on her
off-season**, and a **swap** at the Dorm brings her home. This page is the roster as built. The rules are in
`@farm/domain` (`farm/start.ts`, `farm/dorm.ts`, `farm/visitors.ts`, night step 8 in `night/end-day.ts`, the save's
helpers `picksLeft`, `leaving` and `onFarm` in `save/v3.ts`); the screens in `apps/web/src/loop/` (`StartPicks.tsx`,
`DormPage.tsx`, `GatePeek.tsx`, `Affinity.tsx`, `RosterPage.tsx`). The spec is [core-spec.md](../design/core-spec.md) CS2,
CS34–CS36 and CS45; the calls are D37.

```
 day 1: the start's sheet ──► pick 3 of 6 ──► home (3 beds)
                                                 │
 the Dorm: Upgrade · 1,000g ── night ──► 5 beds ─┤ free bed? ── every 4th morning ──► a visitor at the Gate
                                                 │                                        │ chat +15 · gift +30
 roster > beds ──► the rest away (off-season)    │                                        ▼ 200 points (2 ♥)
 swap: one idle home ⇄ one away ── night ──► she's home                       "She'd like to stay" ──► roster
                                                                              (home if a bed is free, else away)
 a chapter's end ──► recruitFor: the weakest open activity ──► joins at once (goals.md)
```

## The start (CS2)

The first boot shows **six candidates**, each a face card with her three day-1 talents (farming, foraging, fishing) and
her favourite line's mark. You **pick any three**; **one free redraw** replaces all six. Picking is the first tap of the
game: until the roster holds three, the start's sheet covers the farm; then the opening scene plays
([goals.md](goals.md#the-scenes-cs41-cs42-decisions-6-and-7)).

- **The six** (decision 1, `startSheet`): the release's outfits not on the roster, in the order a seeded Fisher–Yates
  shuffle gives them (`draw(uid, 0, 'start:<redraws>', n)`), taken in turn, except that **a card which would leave too few
  places for a C-or-better farmer (Stamina), forager (Speed) and fisher (Wit) is passed over for the next draw that fills
  one**. So the sheet always holds all three, and the same account, release and redraws always show the same six. The
  sheet isn't saved: it's drawn again from `start.redraws`.
- **The redraw** (`redrawStart`): `start.redraws` goes to 1 and sheet 1 is drawn with the first sheet's six moved last in
  the order, so it shows six new faces unless only an earlier card fills a need. Refused once used ("No redraws left.").
- **Picks pending** (decision 2, `picksLeft`): whenever the roster holds fewer than three. A new account picks three; a
  migrated save with *k* Umas picks 3 − *k* from a sheet without them. `pickStart` takes exactly that many ids from the
  sheet; each joins today, home while a bed is free.
- F17's temporary picks (a seeded fill to three at boot) are gone: a new account starts with nobody, and the boot no
  longer waits for master data unless a v2 save needs migrating.

## The Dorm (CS34)

Beds cap who lives and works on the farm at once (D24 #11). Upgrades are bought at the Dorm and take effect the next
morning.

<!-- live:dorm-levels -->
| Level | Beds | Costs | Farm Rank | Cumulative |
|---|---|---|---|---|
| 1 | 3 | — | — | 0g |
| 2 | 5 | 1,000g | 1 | 1,000g |
| 3 | 8 | 3,000g | 2 | 4,000g |
| 4 | 12 | 8,000g | 3 | 12,000g |
| 5 | 16 | 15,000g | 4 | 27,000g |
| 6 | 22 | 28,000g | 5 | 55,000g |
| 7 | 30 | 50,000g | 6 | 105,000g |
| 8 | 40 | 85,000g | 7 | 190,000g |
| 9 | 50 | 130,000g | 8 | 320,000g |
| 10 | 60 | 200,000g | 9 | 520,000g |
<!-- /live -->

- **Buying** (decision 3, `buyDorm`): sets `buildings.dorm` (the level bought) and spends the gold now; refused at level
  10, before its Farm Rank ("Opens at Farm Rank 2.") and when gold is short. A level bought today can be followed by the
  next.
- **The next morning** (night step 8, `settleDorm`): `dorm.level` rises to the level bought, and the morning's news says
  "Dorm level 2 · 5 beds".
- **Beds free** (`freeBeds`): the level in effect's beds less who's home. A visitor comes only while one is free, and a
  recruit joins home only while one is.

## The off-season and swaps (CS36)

The roster grows past the beds. Who's home is `dorm.home`; **everyone else on the roster is away** on her off-season,
keeping her ranks and your affinity, earning nothing. Only work and tending need her home: chats and gifts reach every Uma
on the roster and every visitor.

- **A swap** (decision 4, `swapDorm`): one Uma home with no running job and no block to tend (F20's `isBusy`) for one
  away. It goes in `dorm.swaps`; she arrives the next morning in the place of the one leaving (`settleDorm`), and the
  morning says "Aster is home". Swaps are free and unlimited; one can be called off until the night (`cancelSwap`).
- **Leaving tomorrow** (`leaving`, `onFarm`): an Uma a swap takes out can't take a job, a queue or a block meanwhile.
  uma-work's `isWorker` reads `onFarm`, `setTender` refuses her ("She leaves tomorrow."), the pickers show her disabled,
  and she isn't counted idle. Her finished work can still be collected.
- Refused: a working Uma ("She's working."), a tender ("She tends Block A."), one leaving already, one arriving already,
  one home asked to come home, anyone off the roster.
- A tender who isn't home after the swaps is cleared (none can be, since a tender can't swap out).

## How Umas join (CS35)

<!-- live:roster-ways -->
| Way | Who | When she joins |
|---|---|---|
| The start (CS2) | 6 candidates, a C or better in farming, foraging, fishing among them; one free redraw | You pick 3 (3 − the Umas a migrated save brings) |
| The Gate | While a bed is free and no visitor waits, one stops by every 4th morning (days 4, 8, 12 …), drawn from the release's outfits not on the roster and not waiting | At 200 affinity (2 hearts), the moment a chat or a gift reaches it. She waits 6 days, then leaves; she may come again |
| Chapters | Each chapter's end: drawn C or better in the open activity whose best rank on the roster is lowest, then whose best talent is | At once (F24 calls it) |
| Festivals, requests, expeditions | M5 and M6 | — |
<!-- /live -->

- **The Gate** (decision 5, `gateVisitors`, night step 8 after the Dorm): first a waiting visitor whose six days are up
  leaves (`leaves` is her first day + 6; the morning says "Ember left the Gate"); then, on a morning divisible by 4,
  while a bed is free and no Gate visitor waits, one arrives (`draw(uid, day, 'gate', 0)` over the release's outfits not
  on the roster and not waiting, in master data's order), with "Ember is at the Gate". Visitors can't work.
- **Joining** (decision 6, `joinRoster`): the moment a chat or a gift takes a visitor to **200 points**, she's on the
  roster with `joined` today and her affinity kept, home while a bed is free, else away; the screen shows **She'd like to
  stay**.
- **A chapter's recruit** (decision 10, `recruitFor`): the open activity (`openActivities`: farming, foraging and fishing
  from day 1, the ranch with chapter 2, mining 3, cooking 4, expeditions 5, serving 6, forging 7) whose best rank on the
  roster is lowest, then whose best talent is lowest (`weakestActivity`), then an outfit not on the roster and not
  waiting with **C or better** in it, drawn by `draw(uid, day, 'recruit:<chapter>', 0)`. F24 calls it for chapter 1's
  reward ([goals.md](goals.md)) and joins her with `joinRoster`; a recruit who joined in the night shows in the morning as "Fable joined", with
  "· away" when no bed was free.

## Affinity (CS45)

Your affinity with each Uma runs **0–10 hearts, 100 points each** (`RosterUma.affinity`, a visitor's `affinity`).

<!-- live:affinity-acts -->
| Act | Points | Limit |
|---|---|---|
| Chat (tap her) | +15 | Once a day each |
| Gift (one good, its stars your choice) | Loved +60, Liked +30, Neutral +10, Disliked −20 | One a day each |
| Praise | +20 | M6 (F34) |
<!-- /live -->

- **Once a day each** (decision 9): `today.chats` and `today.gifts` hold who's been talked to and given to; the night
  clears them at step 7.
- **Affinity never falls a heart** (decision 7, `addAffinity`): a disliked gift takes up to 20 points but never below the
  hearts she's reached (2 hearts and 5 points less 20 is 2 hearts); nothing decays. It tops out at 1,000.
- **2 hearts:** a visitor asks to stay (above). **5 hearts:** +5% rank points; **10 hearts:** +10% (F21's
  `affinityPoints`). Story beats at 2, 4, 6, 8 and 10 hearts, and praise, are M6's (F34).

### Gifts (decision 8)

A gift takes **one good from the Warehouse**, the player choosing its stars (`gift`). Seeds aren't gifts. What she thinks
of it (`giftTaste`) reads her favourite line from master data:

<!-- live:gift-likes -->
| Favourite line | Likes (+30) | Dislikes (−20) |
|---|---|---|
| Metal | Ores (10 raw, 10 refined) | — |
| Stone | Stones (10 raw, 10 refined); Crystals (10 raw, 10 refined) | — |
| Wood | Herbs and spices (10 raw, 10 refined); Nuts and seeds (10 raw, 10 refined); Sweets (10 raw, 10 refined); Fruits (10 raw, 10 refined); Mushrooms (10 raw, 10 refined); Woods (10 raw, 10 refined) | Stones (10 raw) |
| Fish | Fish (10 raw, 10 refined) | Stones (10 raw) |
| Vegetables | Grains (10 raw, 10 refined); Vegetables (10 raw); Herbs and spices (4 raw, 4 refined); Nuts and seeds (2 raw, 2 refined); Sweets (1 raw, 1 refined) | Stones (10 raw) |
<!-- /live -->

**Loved** (+60) is the dish kind of her best talent, when dishes come in M5 (F8); feed joins the dislikes with the ranch
(F27). Everything else is neutral (+10).

### Chats (decision 9)

A chat shows **one short line by her temperament** (F21's `temperament`: breezy, steady, bold, gritty, clever), five
lines each (`CHAT_LINES`), original text with her name filled in by the app (`{name}`). Today's line is drawn by
`draw(uid, day, 'chat:<id>', 0)`, so it's the same all day on every device (`chatLine`). M6's conversations replace them.

## The night (step 8) and the morning

Night step 8 runs `settleDorm` (the level bought takes effect, swaps arrive), then `gateVisitors` (leaving, then
arriving), then F24's `checkGoals` ([goals.md](goals.md#the-nights-step-8-checkgoals)). The morning's **New today** lists, after the season and festivals (CS5): the Dorm's
new level and beds, who a swap brought home (one by name, or "3 Umas are home"), each recruit who joined in the night
(anyone on the roster who wasn't last evening), a visitor at the Gate, and one who left. Each line opens the Dorm, her
sheet or the Gate. The summary's parse refuses a Dorm level below 2, Umas home or recruits off the roster, an id that
isn't an outfit's, and a line twice.

## The screens

- **The start's sheet** (`StartPicks.tsx`, over everything while picks are pending): six cards in two columns, each her
  face with her favourite line's mark, her name and outfit title (master data) and three talent chips with the Carrot,
  Pine Log and Carp marks; a tap chooses (three at most), **Pick 3** starts the farm, **Redraw (1 left)** shows six more.
  The rules behind the (i).
- **The Dorm** (`/dorm`, the Dorm on the map): the level and "3 of 5 beds", "Level 3 tomorrow · 8 beds" after buying,
  the next level with **Upgrade · 3,000g** (its Farm Rank, or "Need 500g more"), the swaps arriving tomorrow with **Call
  off**, who's on the farm (Idle, Working, Tends Block A, Leaves tomorrow) and who's away (Away, Arrives tomorrow), each
  row opening her sheet, and **Swap**: uma-kit's picker over the Umas home ("Who goes away?"), then over those away ("Who
  comes home for Aster?").
- **The Gate** (`/?peek=gate`, the Gate's quick look; her face as the Gate's pip, ringed by her way to staying): the
  visitor, "5 days left" or "Last day", her hearts, a bar to 200, **Chat** (then her line) and **Gift** (the Warehouse's
  goods by family and star). With nobody there: when the next one may come, or "Upgrade the Dorm" when no bed is free.
- **The roster** (`/roster`): everyone on the roster, home or away, with F21's talents and ranks, a heart count on her
  face once she has one, "Away" dimmed; a **Where** filter (on the farm, away). Her sheet (`?uma=`) adds her hearts,
  **Chat** and **Gift**, and where she is (with a link to swap at the Dorm).
- The job and tender pickers list the Umas home, an Uma leaving tomorrow disabled.
