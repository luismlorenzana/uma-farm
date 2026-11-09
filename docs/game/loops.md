# Game loops

How the farm plays: who works, where, how a job runs, and how Craft Level grows. The tables are generated from
`packages/domain/src/` (`economy/`, `roster/`, `work/`, `save/work.ts`); `pnpm docs:update` rewrites them and a test fails
on a stale page. The items are in [materials](materials.md). These are uma-rpg's Wilds as copied at `30a322a` (F4, FM2),
minus fights, gear, Speed Tickets and Laurels ([the copy's manifest](../technical/wilds-copy.md)).

## The loop

```
 every outfit on the release (60 slots: 15 places × 4)
        │  her best running styles name her trade
        ▼
 her line's three places:  gather ─► process ─► make
        │                                         │
        ▼                                         ▼
 Craft Level grows from every job          the Warehouse holds what's made
```

## Who works

**Every outfit on master data's release can work,** from day one, with no tickets (FM6). The limit is the slots: fifteen
places of four, so 60 Umas at once. An Uma has no row in the save until her first job; she starts at Craft Lv 1.

**Her trade** comes from her calling, read from her best running styles as in uma-rpg's live rule (FM7, its CV19), and
names one line. Its three places are hers:

<!-- live:callings -->
| Row | Her best running styles | Her trade's line | Her places |
|---|---|---|---|
| 1 | Front among them | Metal | Mine, Mine Workbench, Weapon Forge |
| 2 | Pace alone | Wood | Forest, Forest Workbench, Armorer |
| 3 | Pace with Late or End | Stone | Monster Den, Den Workbench, Lapidary |
| 4 | End among them (End, or Late and End) | Fish | Fishery, Fishery Workbench, Charm Forge |
| 5 | Late alone | Vegetables | Fields, Fields Workbench, Tome Forge |

Her best running styles are every style at her top grade. Distance, Power and Wit don't count.
<!-- /live -->

- Another trade's places refuse her ("Another trade"), unless no Uma on the roster has that trade: then the place is an
  **open shop** and takes everyone.
- Her trade never changes: it comes from her outfit alone.
- **In the loop (F21, dark until F24)** the same calling names her **favourite line**, not a gate: Metal and Stone
  mining, Wood foraging, Fish fishing, Vegetables farming, where she earns ×1.2 rank points; she can work anywhere, and
  "Another trade" and the open shop stay with the Wilds' code until F24 ([ranks.md](ranks.md#her-favourite-line-cs33-decision-6)).

## The places

<!-- live:facilities -->
| Place | Id | Profession | Job | What it does | Its trade |
|---|---|---|---|---|---|
| Mine | `mine` | Mining | Gathering | Gathers metal, G1–G10 | Metal |
| Mine Workbench | `mine-workbench` | Smelting | Processing | Processes metal raw into refined, one for one | Metal |
| Weapon Forge | `weapon-forge` | Arms Crafting | Making | Makes Arms Gems | Metal |
| Fields | `fields` | Farming | Gathering | Gathers vegetables, G1–G10 | Vegetables |
| Fields Workbench | `fields-workbench` | Prepping | Processing | Processes vegetables raw into refined, one for one | Vegetables |
| Tome Forge | `tome-forge` | Tome Crafting | Making | Makes Tome Ink | Vegetables |
| Forest | `forest` | Wood Chopping | Gathering | Gathers wood, G1–G10 | Wood |
| Forest Workbench | `forest-workbench` | Sawing | Processing | Processes wood raw into refined, one for one | Wood |
| Armorer | `armorer` | Armor Crafting | Making | Makes Armor Fittings | Wood |
| Fishery | `fishery` | Fishing | Gathering | Gathers fish, G1–G10 | Fish |
| Fishery Workbench | `fishery-workbench` | Filleting | Processing | Processes fish raw into refined, one for one | Fish |
| Charm Forge | `charm-forge` | Accessory Crafting | Making | Makes Accessory Settings | Fish |
| Monster Den | `monster-den` | Hunting | Gathering | Gathers stone, G1–G10 | Stone |
| Den Workbench | `den-workbench` | Stonecutting | Processing | Processes stone raw into refined, one for one | Stone |
| Lapidary | `lapidary` | Jewel Crafting | Making | Makes Planet Jewels and Moon Jewels | Stone |

Every place has 4 slots at ×1.25 from day one, and nothing to upgrade. An Uma works her trade's three places; a place whose trade has no Uma on the roster is an open shop, taking everyone.
<!-- /live -->

## Craft Level

Each Uma has one level, **Craft Level** (save key `craft`), raised by every job at the fifteen places.

- **Grades:** every line has ten, G1–G10; grade g opens at Craft Lv 5g − 4 (1, 6, 11 … 46) to gather, to process and to
  make.
- **Speed:** set by her Craft Level alone, the same for every item and grade. One step takes 24 minutes at Lv 1, falling
  evenly to 16 at Lv 50, before the place's ×1.25. Gathering one raw item is one step; processing it is one step; making
  is one step per refined item in its recipe.
- **Pace:** Craft EXP is 2 a minute of the job at her level, before the place's speed, whatever it makes, so every job
  levels at the same rate an hour.

<!-- live:levels -->
| Craft Level | Craft EXP to next |
|---|---|
| 1 | 1,440 |
| 8 | 1,545 |
| 15 | 1,650 |
| 22 | 1,755 |
| 29 | 1,860 |
| 36 | 1,965 |
| 43 | 2,070 |

Craft EXP to next: 1,425 + 15 × level, up to Lv 50; jobs pay 2 EXP per base minute of work, so a level takes 12 base hours at Lv1 and 18 at Lv49.
<!-- /live -->

## A job

- An Uma makes a job's items one after another. Her work is her own row: she holds one slot from the moment a job starts
  until Collect frees her or she's recalled, so she works in one place at most. Starting a job on an Uma whose work is
  finished collects it first.
- Every job runs in the shared work engine, `@luismlorenzana/uma-work`, the same code as uma-rpg's and uma-racer's; the
  farm supplies its kinds (gather, process, make), its fifteen places and its Craft Level (FM5).
- Inputs leave the Warehouse when the job starts. Outputs go to the Warehouse when collected.
- **Queues:** up to three more jobs wait behind the current one, for the same Uma at the same place. Each starts the
  moment the one before ends and takes its inputs then, so a chain catches up however late it's collected. If the
  Warehouse can't cover the next one, the queue **stops**: it waits on the place's page to be restarted or dismissed.
- **Offline:** everything runs from start times, so jobs finish while the app is closed, and settle when it opens.
- **Recall:** pays what's finished and returns the inputs of everything unfinished, the item in progress included. The
  queue drops and Repeat forgets her last job. Only the time is lost.
- **Repeat:** starts her last job again where she did it, or in another free slot there if hers is taken; on an Uma whose
  work is finished it collects first.
- **No Speed Tickets** and **no place levels:** every place has its four slots at ×1.25 from day one.

<!-- live:jobs -->
| Setting | Value |
|---|---|
| One step | gather one raw or process one raw into one refined: 24 min at Craft Lv1, falling evenly to 16 min at Lv50 (ten in 4 h and 2.7 h) |
| Make one item | one step for each refined item in it: an Arms Gem or Tome Ink 10, Armor Fittings 3, an Accessory Setting 5, a Planet Jewel 5, a Moon Jewel 5 (an Arms Gem 4 h at Lv1, 2.7 h at Lv50) |
| Opens | grade g at Craft Lv 5g − 4, to gather, to process and to make |
| Craft EXP | 2 per minute of the job at her level, before the place's speed |
| Sizes | ×1, ×2, ×3, ×5, ×10, ×15, ×20, ×30 to gather or process; a make up to about 30 steps (8 h at Craft Lv25): Armor Fittings ×10, a Moon Jewel ×6, an Arms Gem or Tome Ink ×3, an Accessory Setting or a Planet Jewel ×6 |
| Jobs queued after it | 3 |
| Places | 4 Uma slots each, speed ×1.25, from day one; no upgrades |
<!-- /live -->

## The Warehouse

The Warehouse (save key `items`) holds the line items and the made items, free to use: a job takes its inputs from it
when the job starts, and its outputs arrive when they're collected. Nothing sells yet; the farm's own economy is the
design spec's (F7).

## The save

Save v2 (F4) is the account and the Wilds' world, whole: `{ version, account, umas, items, buildings, work }`.
- `umas` holds each Uma who has worked, by outfit id, with her Craft Level.
- `items` is the Warehouse.
- `work` is uma-work's rows, by outfit id.
- `buildings` stays empty, since places have no levels.

A v1 save migrates by adding the empty Wilds and keeps `account.updatedAt` where it was.

Save v3 (F17) is the farm's own loop, built and dark until F24: its shape, the dark launch and the v2 → v3 migration are
in [architecture.md](architecture.md#the-shape-v3-the-loops-built-in-f17).
