# uma-farm: the design spec

> **Refocused, 2026-11-08 (D20):** [hd2d-farm.md](hd2d-farm.md) moves the farm to the HD-2D engine and replaces §4 (the Forge's smithing game, FS12–FS21) with workshops and genre minigames, and FS32's queue with FR24's. §1–§3, §5 and §6 stand until F7 is rewritten.
>
> **Status: draft, 2026-11-08 (D16). Nothing here is built.** The spec F7 owes (R10, FW12): what the farm becomes beyond
> its copy of uma-rpg's Wilds. Calls are **FS1–FS32**, each with a recommendation; there are no open questions, only
> [questions for the owner](#questions-for-the-owner) phrased as decisions with an answer ready. Visual page:
> [previews/spec.html](previews/spec.html) (the Forge's play is there to try).
>
> - **Drafted whole:** targets (§2), the economy (§3), the Forge (§4), the Post (§6) and the queue (§7).
> - **Finished after the play:** who works (§1), measured from the save after the owner's few days; and §3's surplus
>   trigger, which reads §1's numbers.
> - **uma-quest's list ships interim (D19, uma-platform P107):** `uma-post` 0.1.0 carries §5.2's proposal as version 1 once
>   uma-quest's session agrees, and its Q17 confirms or changes it in a minor. uma-rpg's and uma-racer's lists ship empty
>   (version 0) and are proposed for their own sessions (§5.3, §5.4).
>
> The brief is [first-playable.md](first-playable.md) (F7, M3); the plan's calls are FM1–FM26 in [plan.md](plan.md).
> Every number comes from the copied rules in `packages/domain/src` (`economy/pacing.ts`, `economy/places-v4.ts`,
> `items/made-v4.ts`) and the manual ([loops](../game/loops.md), [materials](../game/materials.md)).

## The short answer

- **Who works stays as built** (FM6): every outfit on the release (272 today), 60 slots, her trade by her calling. The
  caps of all three games need about **4 to 10 Umas** working; the other 50 slots are headroom for Craft Levels. The
  play measures it; the recommendation is no change (§1).
- **Targets become orders:** one standing order per item a game accepts, sized to its daily cap ("uma-quest wants
  10 Tonics a day"). Every place shows what the orders still need, through uma-rpg's own target cascade (§2).
- **No currency.** The farm's economy is time and items: Umas' hours make items, the Forge turns made items into the
  games' items, and the games' caps set the demand. Nothing sells. **Speed Tickets come back only as the Forge's
  reward:** one for each Masterwork play, ten held at most (§3).
- **The Forge is a 25–30 second smithing game:** hold to heat, twelve hammer strikes on the item's own rhythm, one
  quench. Timing only, no dice. A score of 0–100 makes the base yield (Rough) up to double (Masterwork). Its inputs
  are never lost: an unfinished play counts as Rough (§4).
- **Four Forge items:** uma-quest's Tonic, Party Meal and Revive, and uma-racer's Rosette (flair). uma-rpg takes its
  made items as they are, straight from the Post (§4, §5).
- **The Post sends one parcel a game a day,** within that game's caps, with one tap. A parcel shows Packed, Sent,
  Claimed or Refused; a refused one can be taken back (§6).
- **Next:** F8 the Forge (with orders and tickets, save v3), F9 its art (ChatGPT), F10 the Post and the sender (save v4),
  and uma-platform's PO1, `uma-post` 0.1.0 (§7).

## What waits on what

| Section | State | Waits on |
|---|---|---|
| [1. Who works](#1-who-works-fs1fs3) | Rule written; **finished after the play** | The owner's few days of play since F6 (2026-11-08), then a read-only measure of the save |
| [2. Targets become orders](#2-targets-become-orders-fs4fs7) | Drafted whole | The owner's answers |
| [3. The farm's economy](#3-the-farms-economy-fs8fs11) | Drafted whole; the surplus trigger (FS11) reads §1 | The owner's answers; §1's numbers for FS11 |
| [4. The Forge](#4-the-forge-fs12fs21) | Drafted whole | The owner's answers; then the owner's play of it in M4 |
| [5. Accept lists and caps](#5-accept-lists-and-caps-fs22fs27) | The rules and `uma-post`'s shape drafted; the three lists proposed | The owner's answers; uma-quest's session agreeing to §5.2 as an interim list (Q17 settles it later, D19); uma-rpg's session after the owner's go (FM15); uma-racer's session |
| [6. The Post](#6-the-post-fs28fs31) | Drafted whole | The owner's answers |
| [7. The queue](#7-the-queue-fs32) | Scoped | The owner's answers; F8–F10 are written as packets after them, and PO1 (written ahead by uma-platform, P107) is built from them |

## 0. At a glance

| | As built (F4–F6) | This spec |
|---|---|---|
| **Who works** | Every outfit on the release, 60 slots, trade by calling (FM6, FM7) | The same, measured against the play (FS1–FS3) |
| **What the places aim at** | Nothing: uma-rpg's targets stayed behind (FM4) | **Orders:** each accepted item at its daily cap, two days ahead, cascaded to every place (FS4–FS7) |
| **Currency** | None | None: no selling, no buying (FS8) |
| **Speed Tickets** | None; the speed-up control hidden (D12) | **One per Masterwork Forge play**, ten held; uma-rpg's Finish and Finish all (FS9) |
| **Surplus** | Piles up in the Warehouse | Made items to uma-rpg as they are; the outbox holds a week of each item at most; the rest stays (FS10, FS11) |
| **The Forge** | A locked placeholder | A place without slots: four recipes, a 25–30 s timing game, four tiers of yield (FS12–FS21) |
| **What each game takes** | Named in the plan (FM13) | uma-quest Tonic 10, Party Meal 5, Revive 3 a day; uma-rpg its 50 made ids, one Uma's grade step a day; uma-racer a Rosette a day (FS22–FS26) |
| **`uma-post`** | Planned (FM12) | Its 0.1.0 shape: `Parcel`, `AcceptList`, `parseParcel`, `checkParcel`, the fetch and claim shapes (FS27) |
| **The Post** | A locked placeholder | A card per game, Send once a day, the sent list with states, uma-rpg's made items added by hand (FS28–FS31) |
| **The save** | v2 | v3 (F8): `forge`, `outbox`, `orders`, `tickets`; v4 (F10): `parcels` |

```
 every outfit on the release (60 slots)                                   the orders: each accepted item
        │  her trade by her calling                                       at its daily cap, two days ahead
        ▼                                                                         │ cascade (uma-rpg's targets)
 the five lines:  gather ─► process ─► make  ◄────────────────────────────────────┘
                                         │ made items (the Warehouse)
                    ┌────────────────────┼─────────────────────────────┐
                    ▼                    ▼                             ▼
          the Forge (a 30 s play)   as they are (FM13)           surplus stays in
          Tonic · Party Meal ·            │                       the Warehouse
          Revive · Rosette                │
          Masterwork → 1 Speed Ticket     │
                    │                     │
                    ▼                     ▼
          the outbox (a week of caps at most, per item)
                    │  Send: one parcel a game a day, within its caps
                    ▼
          the Post ── farm-api `parcels` ──► uma-quest · uma-rpg · uma-racer  (each claims once)
```

## 1. Who works (FS1–FS3)

**Finished after the play.** The rule is written now; the numbers come from the owner's save after a few days.

### 1.1 As built (FS1)

FM6 and FM7 as F4 and F5 built them ([loops](../game/loops.md#who-works), D10, D12):

- **Every outfit on master data's release can work,** from day one, with no tickets and no gacha. The picker is
  uma-kit's album over all of them.
- **The limit is the slots:** fifteen places of four, 60 Umas at once, each place ×1.25 from day one.
- **Her trade is her calling's line,** from her best running styles, so she works her line's three places; a place
  whose trade nobody on the roster has is an open shop.

The release today has **272 outfits**, and every line has at least its twelve slots' worth:

| Line | Outfits on the release | Its slots | Outfits per slot |
|---|---|---|---|
| Metal | 48 | 12 | 4.0 |
| Vegetables | 46 | 12 | 3.8 |
| Wood | 72 | 12 | 6.0 |
| Fish | 34 | 12 | 2.8 |
| Stone | 72 | 12 | 6.0 |
| **All** | **272** | **60** | **4.5** |

Counted with the farm's calling rule (`umaCallingRowV3`) over the local release; counts only, no names.

### 1.2 What the play measures (FS2)

After the owner's few days, the session finishing F7 reads the save once, **read-only**, with the scoped gcloud
(`saves/{uid}` in the `farm` database), and computes these locally. Numbers only go into git, never an outfit's id or
name.

| Measure | How it's read from the save | Why |
|---|---|---|
| **Umas used** | Keys of `umas` (an Uma has a row from her first job), by line | Does the owner rotate many Umas or keep a few? |
| **Slot-hours worked** | Every Uma's Craft EXP to date ÷ **150** (2 EXP a base minute × 1.25 × 60), plus each running work row's elapsed time | The real work done, whatever was collected |
| **Average busy slots (B)** | Slot-hours ÷ hours since the first job | How full the farm is kept: the main number |
| **Busy slots now** | Work rows running or finished at the read | A spot check of B |
| **Craft Levels** | Highest, median, and the highest per line; grades open | Is the pace felt? The copy's pace: Lv 3 after a day of work, Lv 10 after four, G2 open at about two days |
| **Warehouse** | Raw, refined and made items held, by line and grade | Where surplus is piling |
| **The owner's word** | One line: what felt slow, what felt pointless | The rule's tie-breaker |

The copy's pace, for reading the levels (continuous work, from `professionExpToNext` and 150 EXP a real hour):

| Days of continuous work | 1 | 2 | 3 | 4 | 5 | 7 | 10 | 14 | 21 | 28 |
|---|---|---|---|---|---|---|---|---|---|---|
| Craft Level reached | 3 | 5 | 8 | 10 | 12 | 17 | 23 | 31 | 44 | 50 |

| Grade | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Opens at Craft Lv | 1 | 6 | 11 | 16 | 21 | 26 | 31 | 36 | 41 | 46 |
| Days of continuous work | 0 | 2.0 | 4.2 | 6.4 | 8.8 | 11.3 | 13.8 | 16.5 | 19.3 | 22.1 |
| One step, real minutes | 19.2 | 18.6 | 17.9 | 17.2 | 16.6 | 15.9 | 15.3 | 14.6 | 14.0 | 13.3 |

### 1.3 The decision rule (FS3)

The demand side is §3.3: **the three games' caps take 4 to 10 Umas working continuously** (10 at rank I and Rough, 4 at
rank V and Masterwork). The rule reads the play against it.

| Reading | Call |
|---|---|
| **B below 15** | Slots aren't the limit. **No change.** If the owner names starting jobs as the chore, F11 adds **Fill**: one tap on a place starts its free slots with its trade's free Umas, each on her last job there |
| **B from 15 to 50** | **No change.** The farm is played as built, with headroom |
| **B above 50, and the owner wants more** | The crew grows by **one slot at each gathering place** (65), the only place where more hands help every line. Never fewer slots: nothing the owner plays is taken away |
| **Made items held above a week of the caps' need on any line** | Surplus is piling: FS11's choice goes to the owner |
| **Craft Levels** | Reported against the pace table. The pace changes only on the owner's word: a few days of one player's play don't re-tune a copied curve |

### 1.4 The recommendation as it stands

**No change: 60 slots, every outfit, trade by calling, and the crew doesn't grow.** The caps need a sixth of the
slots at most, so the slots will never be the farm's limit; the rest raise Craft Levels, which open the grades that
make the Forge yield more (FS14). The rule above confirms or changes it after the play.

## 2. Targets become orders (FS4–FS7)

### 2.1 What uma-rpg's targets did

In uma-rpg, up to ten Umas a world were marked as targets, and every place listed what maxing them still took
(`save/targets.ts` at `30a322a`): the made items for her weapons, armor and accessories to G10 and her Extra Stats, then
the refined items those need, then the raw ones. The engine is `planRequirements` in `uma-work` (shared): it nets the
demand against the Warehouse and what jobs will still make, top level first, so only what's short flows down. F4 left
targets behind (FM4), because the farm has no gear to max.

The farm's demand is different: it's what the games take, and each game caps it by the day (FM14).

### 2.2 Orders (FS4)

**An order is a game's item and a count a day.** There is one standing order for every item on a game's accept list,
sized to that game's daily cap:

| Order | A day | From |
|---|---|---|
| uma-quest wants Tonics | 10 | uma-quest's cap (FS24) |
| uma-quest wants Party Meals | 5 | |
| uma-quest wants Revives | 3 | |
| uma-rpg wants Arms Gems | 3 | uma-rpg's caps (FS25), any grade |
| uma-rpg wants Tome Ink | 3 | |
| uma-rpg wants Armor Fittings | 5 | |
| uma-rpg wants Accessory Settings | 3 | |
| uma-rpg wants Jewels | 2 | |
| uma-racer wants a Rosette | 1 | uma-racer's cap (FS26) |

- **On by default** for a game whose receiver is live (uma-quest first, FM15); off for the others until theirs are.
- **The player can switch an order off or lower it** (0 up to its cap) on the Forge's order card, or raise its grade.
  Nothing else to set: no Umas to mark.
- **Orders are the farm's own,** built from the accept lists in `uma-post`; no game sends the farm anything (FM10).

### 2.3 The cascade (FS5)

**An order asks for two days of its item in the outbox:** today's parcel and tomorrow's. What's short goes down the
chain, through uma-rpg's target code copied and fed by orders instead of gear (`save/orders.ts`):

```
 order: uma-quest · Tonic · 10 a day · G3                 two days: 20
   outbox holds 6 ───────────────────────────────────────► 14 short
   the Forge, Rough base at rank II: 6 a play ───────────► 3 plays (⌈14 ÷ 6⌉)
   each play: 1 Tome Ink G3 + 1 Accessory Setting G3 ────► Tome Ink G3 × 3, Accessory Setting G3 × 3
        │  planRequirements (uma-work, unchanged): nets the Warehouse and running jobs, top level first
        ▼
   Tome Forge:       Tome Ink G3, 3 − 1 held − 0 coming = 2 short
   Fields Workbench: Shredded Cabbage, 2 × 10 = 20 − 8 held = 12 short
   Fields:           Cabbage, 12 − 5 held − 4 coming = 3 short
   (and the Fish line the same for the Accessory Settings)
```

- **The plan uses the Rough base yield,** so better play only ever over-delivers.
- **uma-rpg's orders skip the Forge:** their item is the made item itself, at the order's grade.
- **Stock held by queued jobs isn't free,** and a queued job counts as coming only if its inputs are covered, as in
  uma-rpg.
- **Several orders add up,** and an order leaves the strips once the outbox holds its two days.

### 2.4 Where they show (FS6)

- **Each place's page** shows uma-kit's `TargetsStrip`, unchanged (FW11): "For orders", a tile per item still short,
  with its grade chip and the shortfall. A tap opens the job sheet on that item.
- **The Forge** shows an order card per item: what the outbox holds against two days, its grade, on or off.
- **The Wilds map's quick look** of a place shows its strip's first tiles.

```
 ‹  Fields Workbench                         (i)
 ┌──────────────────────────────────────────────┐
 │ Prepping · 4 slots · ×1.25                    │
 │ For orders  [cabbage G3 · 12] [potato G2 · 4] │  the kit's TargetsStrip
 └──────────────────────────────────────────────┘
 [face] [cut] ×10 · 3/10  1h 52m            (…)
 (+) Free
```

### 2.5 The order's grade (FS7)

An order's grade is the **highest grade open to at least one Uma at every place its recipe touches** (for a Tonic: the
Fields, the Fields Workbench, the Tome Forge, the Fishery, the Fishery Workbench and the Charm Forge). The player can
lower or raise it on the order card. A higher grade costs the same steps and yields more at the Forge (FS14), so the
default is the best open.

**Alternatives considered:** player-set orders only, with nothing standing (more taps for the same result); orders read
from each game's own wants (a game would send the farm data, breaking FM10); keeping uma-rpg's Uma targets (the farm
has no gear).

## 3. The farm's economy (FS8–FS11)

### 3.1 The numbers it runs on

From `economy/pacing.ts`, `economy/professions.ts` and `items/made-v4.ts`, as copied:

| Rule | Value |
|---|---|
| One step (gather one raw, process one, or one refined item in a make) | 24 min at Craft Lv 1, falling evenly to 16 at Lv 50, **÷ 1.25** at every place: **19.2 to 12.8 real minutes** |
| Steps a slot works in a day | **75** at Lv 1, 90 at Lv 25, 112.5 at Lv 50 |
| The whole farm, 60 slots | 4,500 steps a day at Lv 1, 6,750 at Lv 50 |
| Grades | G g opens at Craft Lv 5g − 4 (1, 6 … 46), the same steps at every grade |
| Craft EXP | 2 a base minute: **150 a real hour**; Lv 1 → 2 takes 9.6 real hours, Lv 46 takes 531 in all (22 days) |
| Job sizes | ×1–×30 to gather or process; a make up to about 30 steps (an Arms Gem ×3, Armor Fittings ×10, a Setting or jewel ×6); three more queued |

What a made item costs, gathering and processing included:

| Made item | Recipe | Steps (gather + process + make) | Slot-hours at Lv 1 | At Lv 50 | A full line (12 Umas) a day at Lv 1 |
|---|---|---|---|---|---|
| Arms Gem | 10 refined Metal | 30 | 9.6 | 6.4 | 30 |
| Tome Ink | 10 refined Vegetables | 30 | 9.6 | 6.4 | 30 |
| Armor Fittings | 3 refined Wood | 9 | 2.9 | 1.9 | 100 |
| Accessory Setting | 5 refined Fish | 15 | 4.8 | 3.2 | 60 |
| Planet or Moon Jewel | 5 refined Stone | 15 | 4.8 | 3.2 | 60 |

### 3.2 What it earns and spends (FS8)

**No currency.** The farm earns items and Craft EXP from its Umas' time, and spends made items at the Forge. Nothing
sells and nothing is bought: uma-rpg's Exchange, Laurels and prices stay behind (FM4).

```
            time (the Umas' hours)
                    │
        ┌───────────┴─────────────┐
        ▼                         ▼
   Craft EXP                 items: raw → refined → made
   opens grades ──────────►       │
   (more yield a play)            ├──► the Forge ──► the outbox ──► the Post ──► the games (capped)
                                  │       │
                                  │       └──► Masterwork: +1 Speed Ticket (10 held)
                                  │                    │
                                  │                    └──► 30 min off a running job
                                  ├──► uma-rpg as they are ──► the outbox
                                  └──► the rest stays in the Warehouse (no limit)
```

Why no currency: the farm's demand is capped by the games, so coins could only buy speed or raw materials, and
§3.5 shows what that does to the pace. The farm's own progress is its Craft Levels, the grades they open, its Forge
bests, and the parcels claimed.

### 3.3 Demand: what the caps take

With the proposed caps (§5) and the Forge's yields (§4.3), a day of all three games' caps takes:

| Rank (grades) | Opens at Craft Lv | Forge tier | uma-quest's caps, steps | + uma-rpg's | + uma-racer's | **All, steps a day** | **Umas working, continuously** | Forge plays a day |
|---|---|---|---|---|---|---|---|---|
| I (G1–G2) | 1 | Rough | 315 | 300 | 99 | **714** | **9.5** | 7.5 |
| I | 1 | Masterwork | 158 | 300 | 50 | 507 | 6.8 | 3.8 |
| II (G3–G4) | 11 | Rough | 210 | 300 | 99 | 609 | 7.6 | 5.3 |
| III (G5–G6) | 21 | Rough | 158 | 300 | 99 | 557 | 6.4 | 4.3 |
| IV (G7–G8) | 31 | Rough | 126 | 300 | 99 | 525 | 5.6 | 3.6 |
| V (G9–G10) | 41 | Rough | 105 | 300 | 99 | 504 | 4.9 | 3.2 |
| V | 41 | Masterwork | 53 | 300 | 50 | **402** | **3.9** | 1.6 |

By line, at rank I and Rough, the made items a day against what a full line (12 Umas) makes:

| Made item | uma-quest | uma-rpg | uma-racer | All a day | A full line makes | Umas it takes |
|---|---|---|---|---|---|---|
| Arms Gems | 1.5 | 3 | 1 | 5.5 | 30 | 2.2 |
| Tome Ink | 5 | 3 | 1 | 9 | 30 | 3.6 |
| Armor Fittings | 2.5 | 5 | 1 | 8.5 | 100 | 1.0 |
| Accessory Settings | 5 | 3 | 1 | 9 | 60 | 1.8 |
| Jewels | 1.5 | 2 | 1 | 4.5 | 60 | 0.9 |
| **All** | | | | | | **9.5 of 60** |

**The finding: supply is six to fifteen times demand.** A farm kept half full (30 Umas, 2,250 steps a day at Lv 1)
makes about three days of every cap each day. Whatever the farm adds, it must not depend on the games taking more.

### 3.4 Speed Tickets (FS9)

**They come back, only as the Forge's reward:**

| Rule | Value |
|---|---|
| Earned | **1 for each Masterwork play** (score 90+); never in Practice; never bought, never sent |
| Held | **10 at most**; at 10, the result says "Tickets full" and none is added |
| Spent | uma-rpg's rule, copied back: each takes 30 minutes off a running job, never more than finish it; **Finish** spends ⌈remaining ÷ 30 min⌉, **Finish all** on a place after a confirm naming the total |
| Shown | uma-kit's speed-up control on the slot rows, hidden today because the balance is 0 (D12), with the farm's ticket offer |

The bound: the outbox holds a week of each item at most (FS10), and the orders take about two to eight plays a day, so a
perfect player earns **at most about 4 tickets a day**, two hours off jobs. That's a reward for skill that finishes the
job a Forge play is waiting on, and it can't run the farm: a slot's day is 24 hours, and the Craft EXP of two finished
hours is 300, a twelfth of one Uma's day.

### 3.5 Selling surplus: why not now (FS11)

uma-rpg's Exchange paid 4 Laurels for a raw G1–G5 item (11 for G6–G10, refined twice that, a made item 6 + 6 × its
grade) and sold a Speed Ticket for 10. With no fights, selling is the only income, and the farm's spare slots are large:

| If the farm sold surplus at uma-rpg's prices | At Lv 1, G1 | At Lv 46, G10 |
|---|---|---|
| 48 spare slots gathering raw for sale | 3,600 items, 14,400 Laurels a day | 5,188 items, 57,071 Laurels a day |
| As Speed Tickets at 10 | 1,440 tickets | 5,707 tickets |
| Hours taken off jobs | **720 a day** | **2,854 a day** |

That's every job on the farm finished at once, every day: the timers stop meaning anything, and Craft Levels, paid by
the job's time, would race. A Market without Speed Tickets only trades lines at 5 to 1 (sell at 4, buy at 20), which
moving an Uma does for free.

**So no Market now.** If the play shows surplus piling up and the owner minds it (FS3's surplus reading), the owner
picks one of two, and it becomes a packet:

| Option | What it does | Cost |
|---|---|---|
| **A. Dearer recipes** (recommended if it comes to it) | Every Forge recipe takes ×2 its made items; the caps then take 8 to 20 Umas | A number in `forge/recipes.ts` |
| B. A Market without tickets | Sell surplus for Coins at uma-rpg's prices; Coins buy raw materials at 20 and 53; no tickets for sale | A currency, a page and save fields |

### 3.6 Where surplus goes (FS10)

1. **Made items to uma-rpg, as they are,** within its caps (FS25), once its receiver is live.
2. **The outbox holds at most a week of each item's cap** (70 Tonics, 35 Party Meals, 21 Revives, 7 Rosettes, and a
   week of each uma-rpg group). The Forge greys an item at its week ("A week's worth is waiting"), and the Post's "Add"
   stops there.
3. **Everything else stays in the Warehouse,** which has no limit. The order strips make spare stock visible: anything
   held beyond what the orders ask is spare, and the Warehouse can mark it.

## 4. The Forge (FS12–FS21)

### 4.1 What it is (FS12)

**A place without slots, on the Wilds map's sixth row** where its placeholder stands (D12). **The player is the
smith:** no Uma works it, so nothing about the play depends on who's on the roster. It makes uma-quest's and
uma-racer's items. **uma-rpg's items don't go through it:** FM13 says uma-rpg takes its made items as they are, so they
go to the outbox from the Post (FS30), and the Forge says so on uma-rpg's chip.

**A game is chosen first** (FM9): the Forge page opens on its game chips, then that game's items.

### 4.2 Recipes (FS13)

**A recipe takes made items only, one each of two to five made kinds, all at one grade g.** Refined items stay the
making places' inputs, so every one of the fifteen places feeds the Forge:

| Forge item | For | Takes, at grade g | Lines | Steps | Why these |
|---|---|---|---|---|---|
| **Tonic** | uma-quest | 1 Tome Ink + 1 Accessory Setting | Vegetables, Fish | 45 | An essence in a set flask (Tome Ink is drawn on uma-art's essences row) |
| **Party Meal** | uma-quest | 1 Tome Ink + 1 Armor Fittings + 1 Accessory Setting | Vegetables, Wood, Fish | 54 | Five shares: three lines, the dearest per item |
| **Revive** | uma-quest | 1 Arms Gem + the grade's jewel (a Planet Jewel at an odd grade, a Moon Jewel at an even one) | Metal, Stone | 45 | A charm: a jewel set in metal |
| **Rosette** | uma-racer | 1 each: Arms Gem, Tome Ink, Armor Fittings, Accessory Setting, the grade's jewel | All five | 99 | Flair that shows the whole farm's work |

The jewel rule reads the farm's own: Planet Jewel n is grade 2n − 1, Moon Jewel n grade 2n
([materials](../game/materials.md#made-items)). So a Revive at G1 takes Arms Gem G1 and Planet Jewel I; at G2, Arms Gem
G2 and Moon Jewel I.

Every line feeds a uma-quest item: Vegetables and Fish the Tonic and the Party Meal, Wood the Party Meal, Metal and Stone
the Revive.

### 4.3 Yield (FS14)

**A recipe's rank is r = ⌈g ÷ 2⌉** (G1–G2 rank I … G9–G10 rank V), and its **base yield** grows with the rank:
base × (1 + r) ÷ 2. The tier (§4.5) multiplies it, rounded half up, never below the base:

| Forge item | Base at rank I | Rank I (R · G · F · M) | Rank II | Rank III | Rank IV | Rank V |
|---|---|---|---|---|---|---|
| Tonic | 4 | 4 · 5 · 6 · 8 | 6 · 8 · 9 · 12 | 8 · 10 · 12 · 16 | 10 · 13 · 15 · 20 | 12 · 15 · 18 · 24 |
| Party Meal | 2 | 2 · 3 · 3 · 4 | 3 · 4 · 5 · 6 | 4 · 5 · 6 · 8 | 5 · 6 · 8 · 10 | 6 · 8 · 9 · 12 |
| Revive | 2 | 2 · 3 · 3 · 4 | 3 · 4 · 5 · 6 | 4 · 5 · 6 · 8 | 5 · 6 · 8 · 10 | 6 · 8 · 9 · 12 |
| Rosette | 1 | 1 · 1 · 2 · 2 at every rank; **its rank is its tier**: I Bronze, II Silver, III Gold, IV Platinum, V Rainbow (uma-racer's ladder) | | | | |

- **A rank opens at Craft Lv 10r − 9** (1, 11, 21, 31, 41): the grade 2r − 1's gate. That matches uma-quest's bands,
  which start at levels 1, 11, 21, 31 and 41.
- **Higher grades cost the same steps** (every step is equal), so progress shows as more per play: a rank V Tonic play
  makes three times a rank I one.
- **uma-quest's items aren't ranked:** a Tonic is a Tonic (FS24), so its grade only sets the yield. The Rosette is
  ranked because uma-racer's flair has tiers.

Per item at Rough: a rank I Tonic costs 11.3 steps (3.6 slot-hours at Lv 1), a Party Meal 27 (8.6 h), a Revive 22.5
(7.2 h), a Rosette 99 (31.7 h). The relative values follow the items: a meal serves five, a revive saves a run.

### 4.4 The play, second by second (FS15)

**About 25 seconds of play, about 30 with the pick and the result.** Three phases, all timing, one thumb:

```
 0 s        1.5 s               ~4 s                                       ~16 s              ~19 s   ~22 s
 │ Ready… │ HEAT: hold, release │ HAMMER: 12 strikes on the item's rhythm │ QUENCH: one tap │ result │
 │        │ in the band  (20)   │ a ring closes on each beat     (72)     │ at the shade (8)│        │
```

| Phase | What the player does | What's judged | Points |
|---|---|---|---|
| **Heat** (up to 5 s) | Press and hold anywhere in the thumb zone: the bellows pump and the needle climbs from cold to white-hot in **1.6 s**. Release once | Where the needle stops, against the band at **85%**: within **±5** Perfect, within **±12** Good, else Miss (too cold, or pinned at the top). No press in 5 s is a Miss | Perfect 20 · Good 10 · Miss 0 |
| **Hammer** (about 12 s) | Twelve beats on the item's rhythm (§4.6). For each, a ring appears **0.9 s** early and closes onto the strike mark exactly on the beat. Tap anywhere in the thumb zone as it closes | A beat takes the **first tap within ±200 ms** of it: within **±50 ms** Perfect, within **±110 ms** Good, else Miss. A beat with no tap is a Miss. **A tap no beat takes is a slip: −3** | Perfect 6 · Good 3 · Miss 0, × 12 = 72; slips −3 each |
| **Quench** (about 3 s) | The piece slides from white through orange to dark along a shade bar over **2.4 s**; the target shade (cherry red) is marked. Tap once as it reaches it | The tap's time against the target moment: within **±80 ms** Perfect, within **±160 ms** Good, else Miss; no tap is a Miss | Perfect 8 · Good 4 · Miss 0 |

**The score is 0–100** (floored at 0 after slips). The phases don't feed each other: each is learnt alone.

**Why these three:** each is one gesture a thumb does without looking down (a hold, taps, one tap), each reads at a
glance on a phone, and together they're a smith's work. Slips make mashing worthless: tapping ten times a second, the
first tap in each window lands about 150 ms early (a Miss) and the rest are slips, so a masher scores 0.

### 4.5 Tiers, and what better play makes (FS16)

| Score | Tier | Yield | Also |
|---|---|---|---|
| 0–49 | **Rough** | The base | |
| 50–74 | **Good** | Base × 1.25 | |
| 75–89 | **Fine** | Base × 1.5 | |
| 90–100 | **Masterwork** | Base × 2 | +1 Speed Ticket (FS9) |

Worked plays (a rank I Tonic, base 4):

| Player | Heat | Hammer | Quench | Score | Tier | Tonics |
|---|---|---|---|---|---|---|
| First try | Miss 0 | 3 Perfect, 5 Good, 4 Miss, 1 slip: 18 + 15 − 3 = 30 | Miss 0 | **30** | Rough | 4 |
| Casual | Good 10 | 6 Perfect, 4 Good, 2 Miss: 36 + 12 = 48 | Good 4 | **62** | Good | 5 |
| Practised | Perfect 20 | 8 Perfect, 2 Good, 2 Miss: 48 + 6 = 54 | Perfect 8 | **82** | Fine | 6 |
| Learnt the rhythm | Perfect 20 | 10 Perfect, 2 Good: 60 + 6 = 66 | Perfect 8 | **94** | Masterwork | 8, and a ticket |

### 4.6 Rhythms: skill over luck (FS18)

**Each item has its own fixed rhythm**, the same every play, so it can be learnt; nothing in the play is random. The
first beat falls 1.0 s into the hammer phase; the gaps between beats:

| Item | Feel | Gaps between the 12 beats (s) | Length |
|---|---|---|---|
| Tonic | Steady | 1.0 × 11 | 11.0 s |
| Party Meal | Waltz: long, short, short | 1.4, 0.7, 0.7, 1.4, 0.7, 0.7, 1.4, 0.7, 0.7, 1.4, 0.7 | 11.2 s |
| Revive | Heartbeat: pairs | 0.6, 1.4, 0.6, 1.4, 0.6, 1.4, 0.6, 1.4, 0.6, 1.4, 0.6 | 11.0 s |
| Rosette | Gallop: short, short, long | 0.6, 0.6, 1.2, 0.6, 0.6, 1.2, 0.6, 0.6, 1.2, 0.6, 0.6 | 8.4 s |

No gap is under 0.6 s, so two beats' ±200 ms windows never overlap. The grade doesn't change the tempo: progress
shouldn't make the game harder.

- **Practice** plays any item with no inputs and makes nothing: no yield, no ticket, no best.
- **The best score for each item** is kept in the save and shown on the Forge page ("Best 86 · Fine").

### 4.7 Never losing inputs (FS17)

FM9: a play never loses its inputs. Built so it can't:

1. **Start** moves the recipe's inputs from the Warehouse into the save's `forge.current` (the item, grade and inputs,
   and when it started), one commit.
2. **The result** clears `forge.current` and puts the tier's yield into the outbox, one commit. Nothing else moves the
   inputs.
3. **A play left unfinished** (the app closed, hidden mid-play, crashed, or stopped with ✕ after a confirm) **settles as
   Rough** the next time the Forge opens: the base yield goes to the outbox and the page says "Your last play stopped:
   4 Tonics, Rough".
4. **No retries:** since the inputs are committed at Start, closing a bad play only makes it Rough. The worst case is
   always the base yield, never less and never a free second try.

### 4.8 On the phone (FS19)

**Portrait at 390 × 844, one thumb.** The scene fills the top 60%; the **thumb zone** is the lower 40%, all of it one
target, so no tap ever needs aiming. Text is short (N9); how the Forge works is behind its help button.

**The Forge's page** (the game first, then the item, its grade, what it takes):

```
 ┌──────────────────────────────────────────┐
 │ ‹  Forge                             (i) │
 ├──────────────────────────────────────────┤
 │ For   (uma-quest)  (uma-racer)  (uma-rpg)│  uma-rpg's chip: "As they are: add them in the Post"
 │                                          │
 │ ┌ Tonic ──────┐┌ Party Meal ┐┌ Revive ──┐│  order cards: the outbox against two days
 │ │ [icon] 6/20 ││ [icon] 3/10 ││ [icon] 6/6││  6/6: covered
 │ └─────────────┘└────────────┘└──────────┘│
 │ Grade  (G1)(G2)(G3)(G4)(G5)               │  two rows of five; a grade not open says
 │        (G6)(G7)(G8)(G9)(G10)              │  "From Craft Lv 21"
 │                                          │
 │ Takes  [ink] Tome Ink G3         4 held  │
 │        [set] Accessory Setting G3 2 held │
 │ Makes  6 · 8 · 9 · 12                    │  Rough · Good · Fine · Masterwork
 │ Best   86 · Fine        Tickets 3/10     │
 │                                          │
 │ [        Forge · about 30 s        ]     │  44 pt, the accent
 │ [ Practice ]                             │
 └──────────────────────────────────────────┘
```

**The play:**

```
 ┌──────────────────────────────────────────┐
 │ ✕                Tonic · G3       41     │  ✕ stops (Rough, after a confirm); the running score
 │ ┌──────────────────────────────────────┐ │
 │ │ HEAT ▕██████████████▒▒░░░▏           │ │  phase 1: the gauge, the band marked at 85%
 │ │                                      │ │
 │ │               ╭───────╮              │ │
 │ │            ╭──┤   ◉   ├──╮           │ │  the ring closing on the strike mark
 │ │            │  ╰───────╯  │           │ │
 │ │        ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄        │ │  the anvil; the piece glows by its heat
 │ │           ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀           │ │
 │ │  ● ● ● ◐ ● ○ · · · · · ·             │ │  12 beat pips: ● Perfect ◐ Good ○ Miss
 │ │  QUENCH ▕white▒▒▒▓▓▓██▼██dark▏       │ │  phase 3: the shade bar, ▼ the target
 │ └──────────────────────────────────────┘ │
 │ ┌──────────────────────────────────────┐ │
 │ │                                      │ │
 │ │            Hold to heat              │ │  the thumb zone (lower 40%): "Hold to heat",
 │ │                                      │ │  then "Tap", then "Quench"
 │ └──────────────────────────────────────┘ │
 └──────────────────────────────────────────┘
```

**The result** (a sheet over the scene; rank II, so base 6 and Fine ×1.5 = 9):

```
 ┌──────────────────────────────────────────┐
 │               Fine · 82                  │
 │   Heat Perfect 20 · Hammer 54 · Quench 8 │
 │   ● ● ● ● ◐ ● ● ○ ● ● ◐ ○                │
 │   9 Tonics → the outbox                  │
 │   Best 86                                │
 │   [ Again ]                  [ Done ]    │
 └──────────────────────────────────────────┘
```

- **Timing is read from `pointerdown`'s timestamp,** in the same clock as the scene's frames, so a dropped frame never
  moves a judgement.
- **No haptics:** iOS web apps have no vibration. **Sound** is a short synthesized clang a strike and a hiss for the
  quench (Web Audio, no audio files), on by default, with a switch behind the help button.
- **Reduced motion** keeps the ring and the gauge (they're the game) and drops sparks and shake.
- **Hidden mid-play** (a call, the app switcher) ends the play as unfinished: Rough (FS17).

### 4.9 The scene and the code (FS20)

- **A Phaser scene,** like the Hub map: Phaser is already on the device by the time the Forge opens, since Home is the
  map. The scene is its own chunk (`forge/ForgeScene.ts`), loaded on demand and listed in `LAZY_MODULES` (N1, FM20).
- **The rules are pure domain code** in `@farm/domain` (`forge/`): the recipes and yields, the rhythms, and
  **`scoreForge(item, presses)`**, which scores a play from its press and release times alone. The scene only draws and
  reports times, so the scoring is tested without a canvas (N8).
- **Placeholders until F9:** uma-art's `forge` building on the map (as today), the item icons it already has (`tonic-n`
  for the Tonic, a `feast-n` platter for the Party Meal), and code-drawn shapes for the anvil, ring, gauge and shade
  bar. F8 ships playable on them; F9's art replaces them by frame name.

### 4.10 What it costs (FS21)

**Its inputs, and nothing else:** no fee, no cooldown, no Uma. A play is about 30 seconds of the player's attention.
What bounds it is the outbox's week (FS10): an item at a week's worth greys out until parcels go.

### 4.11 Alternatives considered

| Alternative | Why not |
|---|---|
| A one-phase timing bar (stop the marker in the zone) | Too thin for 30 s and gets learnt in a day; the three phases give the item rhythms something to vary |
| A rhythm lane with falling notes | Needs aiming at lanes; the thumb zone's one target is kinder in one hand |
| A drag game (pour, sort) | Drags fight the scroll and the edge gestures on iOS; holds and taps don't |
| An Uma working the Forge, her Craft Level widening the windows | Ties skill to the roster; the farm's Umas already have fifteen places |
| Random beat patterns | Luck; FM9 asks skill over luck, and fixed rhythms are learnable |
| A coin fee per play | There is no currency (FS8), and a fee would only tax the fun part |
| Retries, keeping the inputs until the end | Every play would become Masterwork with patience; Rough on abandon keeps skill meaningful |

## 5. Accept lists and caps (FS22–FS27)

### 5.1 The rules every list follows (FS22, FS23)

- **Each game owns its list and caps** (FM13, FM14), written by its own session into `uma-post`. The farm proposes; it
  never sets another game's numbers.
- **Both sides check the same way:** the farm offers only what a list holds and packs within its caps; the receiver
  runs the same `checkParcel` from `uma-post` before it adds anything.
- **A cap is a ceiling a day for a cap group:** one item or several (uma-rpg's ten Arms Gem grades share one).
- **A day is the farm's local date, stamped on the parcel** (`day: '2026-11-15'`). **The farm sends at most one parcel a
  game a day,** each within that day's caps. So however late a game fetches, it never takes more than its caps for any
  one day, and it can claim several days' parcels at once.
- **Ids are the game's own;** the farm maps its Forge items to them.

### 5.2 uma-quest (FS24) — interim until uma-quest's Q17

**Proposed for Q17 to settle.** uma-quest's D4 moved its jobs to the farm and its DN14 names three field items from the
farm's surplus: a tonic, a party meal and a revive, no MP item. Q17 (its design spec, not yet written) settles its
consumables and this list. Until then, F8 builds on this proposal (FS32), and the session finishing F7 replaces it with
Q17's.

| Id (proposed) | Name | Effect (uma-quest's to set; proposed) | Cap group | Cap a day | Forge recipe (FS13) |
|---|---|---|---|---|---|
| `tonic` | Tonic | One Uma: +30% of her max HP | `tonic` | **10** | Tome Ink + Accessory Setting |
| `party-meal` | Party Meal | All five: +15% of max HP | `party-meal` | **5** | Tome Ink + Armor Fittings + Accessory Setting |
| `revive` | Revive | A downed Uma stands at 25% HP, as a cast revive does | `revive` | **3** | Arms Gem + the grade's jewel |

- **Unranked, by percentage:** the items scale with her max HP, so uma-quest needs no ranks by band, and the farm's
  grade only sets how many a play makes.
- **The caps are a supplement:** about one dungeon run's top-ups a day (two full-party tonics, a meal each floor, three
  saves). uma-quest's shop sells the same three (its R13), so parcels never replace it.
- **Where they land:** uma-quest's inventory, used on the field like DN13's casts; its receiver (after F10) adds them
  within these caps and records the parcel id.

### 5.3 uma-rpg (FS25) — for its session, after the owner's go

**Proposed for a uma-rpg H-session**, after the owner's go, since uma-rpg is frozen (FM15). FM13: uma-rpg takes its
made items as they are, by FM8's ids.

| Ids | Cap group | Cap a day (proposed) |
|---|---|---|
| `weapon-gem-g1` … `weapon-gem-g10` (Arms Gems) | `weapon-gem` | **3** |
| `tome-ink-g1` … `tome-ink-g10` | `tome-ink` | **3** |
| `armor-fittings-g1` … `armor-fittings-g10` | `armor-fittings` | **5** |
| `accessory-setting-g1` … `accessory-setting-g10` | `accessory-setting` | **3** |
| `jewel-planet-1` … `-5`, `jewel-moon-1` … `-5` | `jewel` | **2** |

- **The rule behind the numbers: one Uma's grade step a day.** In uma-rpg a grade raise takes one made item: her three
  weapons (Arms Gems or Tome Ink by her class), five armor slots and three accessory slots. A day's caps raise one Uma
  one grade everywhere, plus two jewels toward her Extra Stats.
- **Next to uma-rpg's own Wilds,** where a full Metal line makes 30 Arms Gems a day, that's a tenth: help, not a flood.
- **Where they land:** its active world's Warehouse (proposed; uma-rpg's call, since each world has its own).

### 5.4 uma-racer (FS26) — for its session

**Proposed for uma-racer's session.** FM13: flair only, since Training Tickets are its one currency and its badges
"never pay tickets" (uma-racer's badges doc).

| Ids | Name | Cap group | Cap a day |
|---|---|---|---|
| `farm-rosette-1` … `farm-rosette-5` | Farm Rosette: Bronze, Silver, Gold, Platinum, Rainbow | `rosette` | **1** |

A rosette is a trophy on the trainer's wall: pure flair, counted by tier, never a ticket, a stat or a shard. Its tier is
the Forge's rank (§4.3), on uma-racer's own Bronze → Rainbow ladder.

### 5.5 `uma-post` 0.1.0's shape (FS27)

What PO1 builds in uma-platform's `packages/post`, so the farm (F10) and each receiver share one format and one check:

```ts
// @luismlorenzana/uma-post 0.1.0: the parcel format and the games' accept lists (FM12, FM14; uma-platform P89)

export const POST_GAMES = ['uma-quest', 'uma-rpg', 'uma-racer'] as const
export type PostGame = (typeof POST_GAMES)[number]

/** One line of a parcel: an id on the game's accept list and a count. */
export interface ParcelLine { item: string; qty: number }   // qty 1 … the item's cap

export interface Parcel {
  v: 1                    // the format's version
  id: string              // 'p-' + 20 base32 characters, made by the farm, unique for good
  to: PostGame
  day: string             // 'YYYY-MM-DD': the farm's local date it was packed; one parcel a game a day
  items: ParcelLine[]     // at least one line, each item once, sorted by id
  packedAt: string        // ISO time
}

/** farm-api's record of a parcel; never part of any save. */
export type ParcelState = 'sent' | 'claimed' | 'refused'
export type RefusalReason = 'unknown-item' | 'over-cap' | 'bad-qty' | 'repeated-item' | 'wrong-game' | 'repeated-day'

export interface Accepted {
  item: string            // the game's own id
  name: string            // what the farm shows: "Tonic"
  group: string           // the cap group it counts toward
  tier?: number           // a ranked item's rank (the Rosette's)
}
export interface AcceptList {
  game: PostGame
  version: number         // the game bumps it when it changes its list
  items: readonly Accepted[]
  caps: Readonly<Record<string, number>>   // group → most a day
}
export const ACCEPT_LISTS: Readonly<Record<PostGame, AcceptList>>

export function parseParcel(x: unknown): Parcel                                   // throws ParcelParseError
export function checkParcel(p: Parcel, list?: AcceptList): RefusalReason | null   // the list defaults to p.to's
export function capsLeft(list: AcceptList, lines: readonly ParcelLine[]): Record<string, number>

/** GET /api/post/parcels (a game's API, its own Google ID token): its parcels in the state `sent`. */
export interface ParcelsReply { parcels: Parcel[] }
/** POST /api/post/claims: what the game added (after accepting a save holding the ids) and what it refused. */
export interface ClaimsRequest { claimed: string[]; refused?: { id: string; reason: RefusalReason }[] }
export interface ClaimsReply { claimed: string[]; refused: string[]; unknown: string[] }   // repeats are no-ops
```

- **0.1.0 carries uma-quest's list** as §5.2 proposes it, interim (version 1), once uma-quest's session agrees; Q17 confirms
  or changes it in a minor (P107, D19). uma-rpg's and uma-racer's ship empty (version 0) and arrive as minors when their
  sessions settle them; the farm offers only what's on a list.
- **Tests with synthetic parcels, no network:** every refusal, caps across lines of one group, `repeated-day` given the
  days already claimed.

## 6. The Post (FS28–FS31)

### 6.1 The Post's page (FS28)

**A place without slots beside the Forge,** where its placeholder stands. A card per game, then what's been sent:

```
 ┌──────────────────────────────────────────┐
 │ ‹  Post                              (i) │
 ├──────────────────────────────────────────┤
 │ Today · Sun 15 Nov                       │
 │ ┌──────────────────────────────────────┐ │
 │ │ (Q) uma-quest                  Ready │ │
 │ │ Tonic        10 of 10 · 14 waiting   │ │  today's parcel against the caps,
 │ │ Party Meal    5 of 5  ·  6 waiting   │ │  and what the outbox holds
 │ │ Revive        2 of 3  ·  2 waiting   │ │
 │ │ [       Send today's parcel      ]   │ │  44 pt
 │ └──────────────────────────────────────┘ │
 │ ┌──────────────────────────────────────┐ │
 │ │ (R) uma-rpg                  Not yet │ │  "Opens when uma-rpg receives."
 │ │ [ Add made items ]                   │ │  (FS30; it can fill its outbox early)
 │ └──────────────────────────────────────┘ │
 │ ┌──────────────────────────────────────┐ │
 │ │ (C) uma-racer                Not yet │ │
 │ └──────────────────────────────────────┘ │
 │ Sent                                     │
 │ 15 Nov  uma-quest  17 items      Packed  │
 │ 14 Nov  uma-quest  18 items        Sent  │
 │ 13 Nov  uma-quest  18 items     Claimed  │
 └──────────────────────────────────────────┘
```

- **A game's mark** is a letter tile like the apps' icons (Q, R, C), drawn in code: no art needed.
- **After Send,** the card reads "Sent today · the next one goes tomorrow".
- **A game whose receiver isn't live** shows "Not yet": its outbox can fill, nothing goes. The farm keeps the list of
  live receivers itself (`post/receivers.ts`), flipped by the packet that ships each one.

### 6.2 Send (FS29)

**One tap a day a game.** Send packs one parcel from the outbox, as much of each item as today's caps allow, oldest
first; the rest waits.

```
 ┌──────────────────────────────────────────┐
 │ Send to uma-quest                        │
 │ [tonic] 10  [meal] 5  [revive] 2         │
 │ Today's parcel. The next goes tomorrow.  │
 │ [ Send ]                     [ Cancel ]  │
 └──────────────────────────────────────────┘
```

**A parcel's states:**

```
  Packed ──── the save syncs; farm-api accepts it ────► Sent ──── the game claims ────► Claimed
  (in the save)                                    (parcels/{id})    (after its save holds the id)
                                                         │
                                 farm-api's own check,   │   or the game refuses
                                 or the game's ──────────┴──► Refused (a reason) ── Take back ──► the outbox
```

- **Packed:** in the farm's save, not yet accepted by farm-api (seconds, or until the phone is online).
- **Sent:** farm-api accepted a save holding it and wrote `parcels/{id}` (FM11). It runs `checkParcel` first, and the
  one-a-day rule; a parcel that fails is written **Refused** with its reason instead.
- **Claimed:** the game confirmed it after accepting a save that holds the id. A repeat is a no-op.
- **Refused:** **Take back** returns its items to the outbox (a change in the farm's own save, by the player), so a
  refusal loses nothing.
- **No cancel once Sent:** a game may already have fetched it.

**A parcel's detail** (tap a row):

```
 ┌──────────────────────────────────────────┐
 │ ‹  Parcel · 13 Nov · uma-quest           │
 │ [tonic] 10   [meal] 5   [revive] 3       │
 │ ● Packed    13 Nov 08:12                 │
 │ ● Sent      13 Nov 08:12                 │
 │ ● Claimed   13 Nov 21:04                 │
 │ p-7q2k…                                  │
 └──────────────────────────────────────────┘
```

### 6.3 uma-rpg's made items (FS30)

uma-rpg's items skip the Forge. **Add made items** opens the Warehouse's made items, grouped by uma-rpg's cap groups,
and moves the picked ones into uma-rpg's outbox (a week of its caps at most):

```
 ┌──────────────────────────────────────────┐
 │ Add to uma-rpg's outbox                  │
 │ As they are · a week holds 21 Arms Gems  │
 │ Arms Gems        3 waiting               │
 │   [G1 ×12] [G2 ×4] [G3 ×1]               │  a tap adds one; a long press the most
 │ Armor Fittings  10 waiting               │
 │   [G1 ×40] [G2 ×9]                       │
 │ Jewels           0 waiting               │
 │   [Planet I ×6] [Moon I ×2]              │
 │ [ Add 4 ]                                │
 └──────────────────────────────────────────┘
```

### 6.4 What the save keeps (FS31)

- **The outbox** (v3): each game's waiting items and counts.
- **Parcels** (v4): every parcel not yet claimed, and the newest 20 claimed; older ones drop at the next change.
- **States are never written into the save** (FM10): the app reads them from farm-api (`GET /api/post/status`, behind
  the owner guard), and shows them merged with the save's parcels.

## 7. The queue (FS32)

The packets and the platform request, scoped. They're written in full after the owner answers this spec (FW1), from
this section and the calls.

| Id | What | Who | Size | Covers | Needs |
|---|---|---|---|---|---|
| **F8** | The Forge, orders and tickets | Claude | L | R11, N1, N5, N8, N9; FS4–FS7, FS9, FS10, FS12–FS21 | F7 answered; F9 for art (placeholders until then) |
| **F9** | Art: the Forge, its game and the Post (uma-art) | ChatGPT | M | R11; FS19, FS20, FS28 | F7 answered |
| **F10** | The Post and the sender | Claude | L | R12, N5, N7; FS22, FS23, FS28–FS31; FW9, FW10 | F8, PO1 |
| **PO1** | `uma-post` 0.1.0 *(uma-platform)* | Claude | M | uma-platform's R9; FS22–FS27 | F7 answered (P107, D19) |

**F8, the Forge.** The Forge place opens on the map (no slots; its quick look shows the orders). Its page, the Phaser
scene loaded on demand, and the pure rules in `@farm/domain/forge`: the four recipes and their yields by rank and tier,
the rhythms, `scoreForge`, Practice and bests. Save v3 adds `forge` (the play in progress, bests), `outbox`, `orders`
(only the player's changes; the defaults come from the lists) and `tickets`, migrated from v2 without moving
`updatedAt`. Orders: `save/orders.ts` copied from uma-rpg's `save/targets.ts` at `30a322a` and fed by orders, with the
kit's `TargetsStrip` on every place. Speed Tickets: uma-rpg's speed-up and finish wrappers copied back (cut in F4), the
kit's control shown. F8 builds on this spec's proposed lists, kept in one farm module (`forge/lists.ts`). **Done when**
the owner plays the Forge on the phone and its results reach the outbox; an abandoned play settles as Rough; the scene
isn't in the main JS.

**F9, the art (ChatGPT's packet for uma-art).** A Post building (48 × 48, the Hub's style; there's none today) and the
Forge's own building, so the farm's Forge reads apart from the Weapon Forge (the lean option, keeping uma-art's `forge`,
is a question below). The game's pieces: the anvil, the hammer, the piece at four heats (cold, red, orange, white), the
bellows, the heat gauge and its band, the strike ring, the shade bar, sparks. Icons for the Revive and the five Rosette
tiers (the Tonic and the Party Meal reuse `tonic-n` and a `feast-n`), and a parcel icon. A uma-art minor that F8, or the
first packet after it, pins. **Done when** the release is published and pinned, and the owner approved its look.

**F10, the Post and the sender.** The Post place and its page (§6), Send, the parcel detail, Take back and uma-rpg's
Add. Save v4 adds `parcels`. `farm-api` writes `parcels/{id}` (state `sent`, or `refused` with a reason) only after
accepting a save that holds the parcel, never the save itself; `GET /api/post/parcels` and `POST /api/post/claims` for
the games' APIs by their own tokens (IN18, `POST_CALLERS`), and `GET /api/post/status` for the farm's app. F10 swaps
F8's proposed lists for `uma-post`'s, with a test that every Forge item is on a list. Every step repeats safely.
**Done when** a parcel sent from the farm is added in uma-quest and shows Claimed; a repeated fetch or claim changes
nothing.

**PO1, `uma-post` 0.1.0 (uma-platform).** `packages/post` with §5.5's types, `parseParcel`, `checkParcel`, `capsLeft`,
the API shapes and uma-quest's interim list (§5.2); tests with synthetic parcels, no network; released through
Changesets. **Written ahead** by uma-platform ([PO1](https://github.com/luismlorenzana/uma-platform/blob/main/docs/handoff/tasks/PO1-uma-post.md), [P107](https://github.com/luismlorenzana/uma-platform/blob/main/docs/decisions.md)); its first step re-reads §5 after the owner's answers, which F7's finish sends it.

**After them:** uma-quest's receiver (a Q-packet after F10), then uma-rpg's (an H-packet on the owner's go), then
uma-racer's, each adding its list to `uma-post` if 0.1.0 didn't carry it, and flipping the farm's `post/receivers.ts`.
**F11, Fill** (FS3) is written only if the play asks for it.

```
 F7 answered ──┬──► F9 (art, ChatGPT) ──────────┐
               ├──► F8 (Forge, orders, tickets) ┴──► the owner plays the Forge
               └──► PO1 (uma-platform; uma-quest's list interim, Q17 later)
                               │
                    F8 + PO1 ──► F10 (Post, sender) ──► uma-quest's receiver ──► uma-rpg's (your go) ──► uma-racer's
```

**Owed with F7's finish, not a new packet:** the manual's desktop HTML pages (D13), once the play settles the Wilds'
pages.

## 8. Save impact

| Version | Packet | Adds | Migration |
|---|---|---|---|
| v3 | F8 | `forge: { current: ForgePlay \| null, best: Record<item, score>, plays }`, `outbox: Record<game, Record<item, count>>`, `orders: Record<'game:item', { on, perDay, grade }>` (changes only), `tickets: 0–10` | From v2: empty, null, zero; `account.updatedAt` unchanged (N5) |
| v4 | F10 | `parcels: Record<id, Parcel & { takenBack?: true }>` | From v3: empty |

```ts
interface ForgePlay { item: string; game: PostGame; grade: number; inputs: { item: string; qty: number }[]; startedAt: string }
```

## 9. Calls

| Call | Recommendation | Alternatives, briefly | Why |
|---|---|---|---|
| **FS1** Who works, as built | Every outfit on the release (272: Metal 48, Vegetables 46, Wood 72, Fish 34, Stone 72), 60 slots, trade by calling, no tickets or gacha. **Finished after the play** | Fewer slots; a hired crew | It's what the owner plays; every line has 34+ outfits for its 12 slots |
| **FS2** What the play measures | One read-only read of the save after the play: Umas used, slot-hours (Craft EXP ÷ 150, plus running rows), average busy slots, Craft Levels, Warehouse holdings, and the owner's one line; numbers only in git | Logging play events (new code); asking the owner only | Craft EXP already records every hour worked |
| **FS3** The decision rule | Below 15 busy: no change (Fill if setting jobs is the chore); 15–50: no change; above 50 and wanted: +1 slot at each gathering place; surplus over a week: FS11; pace changes only on the owner's word. **As it stands: no change** | Growth by milestones; fewer slots | The caps need 4–10 Umas; the slots are never the limit |
| **FS4** Orders replace targets | One standing order per accepted item, its daily cap a day, on for live receivers; the player can switch one off, lower it or change its grade | Player-set orders only; orders read from the games; Uma targets | The owner's "uma-quest wants 10 tonics", with nothing to set |
| **FS5** The cascade | Two days in the outbox, through the Forge recipe at Rough base, then uma-rpg's target code (copied as `save/orders.ts`) on `planRequirements` | One day; the yield of the best tier so far | Today's parcel and tomorrow's; plans never under-deliver |
| **FS6** Where orders show | uma-kit's `TargetsStrip` on each place (unchanged kit), the Forge's order cards, the quick look | A separate orders page | The kit already draws it; the need shows where the work starts |
| **FS7** An order's grade | The highest grade open at every place its recipe touches, changeable | Always G1; the player picks every time | Higher grades cost the same and yield more |
| **FS8** No currency | Time and items only: no selling, no buying; uma-rpg's Exchange stays behind | Coins from selling (FS11's B) | Demand is capped; coins would only buy speed |
| **FS9** Speed Tickets | **Return only as the Forge's reward:** 1 per Masterwork, 10 held; uma-rpg's Finish and Finish all, copied back; the kit's control shown | None at all; bought with Coins | Skill keeps paying once the outbox is full; at most about 4 a day, it can't run the farm |
| **FS10** Surplus | Made items to uma-rpg as they are, within its caps; the outbox holds a week of each item at most; the rest stays in the Warehouse, unlimited | A Warehouse cap; selling | Nothing is wasted or forced; the week stops pointless Forge plays |
| **FS11** If surplus piles | No Market now (720 hours off jobs a day at Lv 1); if the play shows surplus that bothers the owner: **A, recipes ×2** (recommended), or B, a Market without tickets | A Market now | The numbers in §3.5 |
| **FS12** The Forge's place | A place without slots on the sixth row; the player is the smith; uma-quest's and uma-racer's items; a game chosen first; uma-rpg's go through the Post | An Uma at the Forge; the Forge for every game | FM9's game first; FM13's "as they are" |
| **FS13** Recipes | Made items only, one each of two to five kinds at one grade: Tonic (Tome Ink, Accessory Setting), Party Meal (Tome Ink, Armor Fittings, Accessory Setting), Revive (Arms Gem, the grade's jewel), Rosette (all five) | Refined items as well (FM9 allows them); one made kind each | Every place feeds the Forge; every line feeds a uma-quest item |
| **FS14** Yield by rank | Rank ⌈g ÷ 2⌉; base × (1 + rank) ÷ 2 (Tonic 4 → 12, Meal and Revive 2 → 6, Rosette 1 with its rank as its tier); a rank opens at Craft Lv 10r − 9 | Ranked items by band; one yield at every grade | Progress shows as more per play; uma-quest's items stay simple |
| **FS15** The play | Heat (hold, release at 85% ±5/±12: 20), hammer (12 beats, ±50/±110 ms in a ±200 ms catch: 6 each, slips −3), quench (one tap, ±80/±160 ms: 8); about 25 s | One timing bar; falling notes; drags | Three thumb gestures, a smith's work, mashing worthless |
| **FS16** Tiers | Rough < 50 ×1, Good 50–74 ×1.25, Fine 75–89 ×1.5, Masterwork 90+ ×2 and a ticket; never below the base | A linear yield on the score | Four readable steps; the floor keeps FM9's promise |
| **FS17** Never losing inputs | Inputs move into `forge.current` at Start; the result commits at the end; an unfinished play settles as Rough; no retries | Inputs taken at the end (free retries) | The worst case is the base yield, and skill still counts |
| **FS18** Rhythms, Practice, bests | Each item its own fixed rhythm (Tonic steady, Party Meal waltz, Revive heartbeat, Rosette gallop), never random, the tempo fixed by grade; Practice with no inputs; a best a item | Random patterns; faster at higher grades | Skill over luck: learnable, and progress never makes it harder |
| **FS19** On the phone | Portrait 390 × 844; scene above, the lower 40% one thumb target; `pointerdown` timestamps; no haptics; a synthesized clang, a Sound switch; reduced motion keeps the ring and gauge | Tap targets on the scene; audio files | One-handed and unaimed; nothing to download |
| **FS20** The scene and the code | A Phaser scene in its own lazy chunk (`LAZY_MODULES`); `scoreForge` and the rules pure in `@farm/domain`; uma-art and code-drawn placeholders until F9 | Canvas 2D by hand | Phaser is already on the device from the map; the scoring is tested without a canvas |
| **FS21** What it costs | Its inputs only: no fee, no cooldown, no Uma; bounded by the outbox's week | A fee; a cooldown | Nothing taxes the fun part |
| **FS22** Who owns the lists | Each game, in `uma-post`; the farm offers only what a list holds; both sides run `checkParcel` | The farm sets caps | FM13, FM14 |
| **FS23** Caps and days | A ceiling a day per cap group; the day is the farm's local date stamped on the parcel; one parcel a game a day; several days may be claimed at once | Sums per day across parcels; UTC days | The receiver's check is one id list and one day list |
| **FS24** uma-quest's list | **Interim until Q17** (D19). Proposed: `tonic` 10, `party-meal` 5, `revive` 3 a day, unranked, by percentage (+30% one, +15% all, up at 25%) | Ranked by band | DN14's three; a supplement to its shop |
| **FS25** uma-rpg's list | **For its session, after the owner's go.** Its 50 made ids as they are; caps by kind: Arms Gems 3, Tome Ink 3, Armor Fittings 5, Accessory Settings 3, jewels 2 (one Uma's grade step a day); its active world's Warehouse | Caps per id; a party's step a day | FM13; a tenth of its own Wilds' line |
| **FS26** uma-racer's list | **For its session.** Flair only: `farm-rosette-1`–`5` (Bronze → Rainbow), one a day | Per-Uma flair | FM13; its badges never pay tickets |
| **FS27** `uma-post` 0.1.0 | §5.5: `Parcel` (v, id, to, day, items, packedAt), `AcceptList` with cap groups, `parseParcel`, `checkParcel`, `capsLeft`, the fetch and claim shapes; uma-quest's list first | Only the type and parser | One check on both sides; the API shapes shared |
| **FS28** The Post's page | A place without slots; a card per game (today's parcel against its caps, what waits, Send; "Not yet" for a receiver that isn't live); the sent list | A tab in the Warehouse | One place for the outbox, as FM19's map has it |
| **FS29** Send and states | One tap packs one parcel a game a day within caps, oldest first; Packed → Sent → Claimed, or Refused with Take back; no cancel once Sent | Automatic daily sends; several a day | A daily moment; nothing lost; no race with a fetch |
| **FS30** uma-rpg's Add | The Post's "Add made items" moves made items into uma-rpg's outbox, by cap group, a week at most | Through the Forge | FM13's "as they are" |
| **FS31** What the save keeps | The outbox (v3); unclaimed parcels and the newest 20 claimed (v4); states read from `GET /api/post/status`, never written into the save | Every parcel for good | FM10, and a save that stays small |
| **FS32** The queue | F8 (Forge, orders, tickets, save v3), F9 (art), F10 (Post, sender, save v4), PO1 (`uma-post`); F8 builds on the proposed lists, F10 swaps in `uma-post`'s | Wait for Q17 before F8 | M4 needn't wait on another repo; one module to swap |

## Questions for the owner

Each is a decision with the answer ready; accept it or change it. The session finishing F7 takes the answers into the
calls.

| # | Decision | Recommended answer | Calls |
|---|---|---|---|
| 1 | Keep every outfit and 60 slots, with no crew growth? | **Yes**, confirmed or changed by the play's numbers (§1.3) | FS1–FS3 |
| 2 | Replace targets with standing orders at each game's daily cap, two days ahead? | **Yes** | FS4–FS7 |
| 3 | No currency: nothing sells, nothing is bought? | **Yes**; dearer recipes if surplus ever bothers you | FS8, FS11 |
| 4 | Bring Speed Tickets back only as the Forge's Masterwork reward (1 each, 10 held)? | **Yes** | FS9 |
| 5 | The Forge's game: heat, twelve strikes on the item's rhythm, quench, in about 30 seconds? | **Yes**; try it on [the page](previews/spec.html#try) | FS15, FS18 |
| 6 | Better play: ×1, ×1.25, ×1.5, ×2 by tier, never below the base? | **Yes** | FS16 |
| 7 | An abandoned play counts as Rough, with no retries? | **Yes** | FS17 |
| 8 | uma-rpg's made items skip the Forge and go as they are? | **Yes** | FS12, FS30 |
| 9 | The Forge's recipes (Tonic, Party Meal, Revive, Rosette) and yields by rank? | **Yes** | FS13, FS14 |
| 10 | Propose uma-quest 10 Tonics, 5 Party Meals and 3 Revives a day, unranked, to its Q17? | **Yes** | FS24 |
| 11 | Propose uma-rpg "one Uma's grade step a day" and uma-racer "a Rosette a day" to their sessions? | **Yes** | FS25, FS26 |
| 12 | One parcel a game a day, sent with one tap? | **Yes** | FS23, FS29 |
| 13 | F9 draws the Forge its own building, or keeps uma-art's `forge` and draws only the Post? | **Its own building**, so it reads apart from the Weapon Forge | F9 |
