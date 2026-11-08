# The Wilds' screens

What the player sees and taps, as built in F5: Home is the Wilds map, every place has its page, the Warehouse holds
what's made, and any outfit can be put to work. The rules behind every number are in [loops](loops.md) and
[materials](materials.md); the code is in `apps/web/src/` (paths below). The screens are uma-rpg's at `30a322a`, copied
and cut (FM2): no tiers, Speed Tickets, Laurels, targets, Exchange, fights or upgrades.

## The pages

```
 ┌──────────────────────────────┐
 │ (L)                    sync  │  the account bar: the initial opens Account
 ├──────────────────────────────┤
 │                              │
 │   /             the Wilds    │  Home: the map, ?peek=<place> a quick look
 │   /wilds/<place> a place     │  its slots, the job sheet, queues, Recall, Repeat
 │   /warehouse    the Warehouse│  what's held, by line and grade
 │   /account      Account      │  notifications, sign-in, save, safety copies, build
 │                              │
 ├──────────────────────────────┤
 │  Wilds (n)   Warehouse  Menu │  the bottom bar; (n) slots ready to collect
 └──────────────────────────────┘
```

| Page | Where | What |
|---|---|---|
| The Wilds | `/`, `wilds/WildsScreen.tsx` (loads on demand) | uma-kit's Hub map: the fifteen places and two placeholders, the Collect all pill, the help button. `?peek=<place>` opens a place's quick look in the side panel |
| A place | `/wilds/<place>`, `places/PlacePage.tsx` and `places/work/` (loads on demand) | uma-kit's place header over its work page: four slot rows, the job sheet, stopped queues |
| The Warehouse | `/warehouse`, `places/warehouse/` (loads on demand) | uma-kit's shelf view of every held item |
| Account | `/account`, `home/AccountView.tsx` | F3's Account, now also showing master data's release (Home's row before F5), and the Notifications switch (F6, [architecture](architecture.md#notifications-f6)) |
| The menu | `?sheet=menu` on any page, `shell/MenuSheet.tsx` | "Every place": the fifteen with their Ready counts, the Forge and the Post (locked), the Warehouse, Account, the build |

`/wilds` goes to `/`; an unknown place or a placeholder's page goes to its quick look; anything else goes to `/`.

## The map

Five rows of three, one line a row in uma-rpg's order, gathering, processing and making left to right, each place on its
uma-art building. The Forge and the Post stand in a sixth row as placeholders.

```
   Mine           Mine Workbench      Weapon Forge        Metal
   Fields         Fields Workbench    Tome Forge          Vegetables
   Forest         Forest Workbench    Armorer             Wood
   Fishery        Fishery Workbench   Charm Forge         Fish
   Monster Den    Den Workbench       Lapidary            Stone
          Forge · Soon        Post · Soon                 (M4, M5)
 (i)                                    Collect all · 3 ready
```

- **A place's pips** hang over its building in a half arch: one per slot, a free dot or the working Uma's face ringed by
  her job's progress, with her Craft Level and a "+N" for her queue. A place with something to collect shows **Ready**.
- **Tap a place** for its quick look: its line, the open shop if it is one, its four rows (Start, Collect, Repeat, a
  queue) and **Enter the …**, which opens its page.
- **Collect all** (bottom right) collects every finished job in the Wilds; it shows only when something is ready.
- **The help button** (bottom left) says how the Wilds work, in six short lines.
- **The Forge and the Post** borrow uma-art's `forge` and `card-library` buildings, with a lock and "Soon". Their quick look
  says what they'll do and that they open in M4 (the Forge, F8) and M5 (the Post, F10). F9 brings their own art.
- **Height:** the map is at least 600 px tall (25 rows of 24 px), so the trios keep uma-rpg's four rows apart and the
  placeholders fit below them. On a 390 × 844 phone it fits the screen; on a 375 × 667 one it scrolls by about 40 px,
  with the help button, the pill and the quick look fixed.
- **The map's art is Phaser,** which loads only when the map first mounts (`createHubGame`, about 377 KB gzip, never in
  the main JS).

## A place's page

```
 ‹  Mine                                  (i)   blurb
 ┌─────────────────────────────────────────┐
 │ Mining · 4 slots · ×1.25           (i)  │  help: what it makes, who works here
 │                          [Collect here] │  when something's ready
 └─────────────────────────────────────────┘
 [face] [ore] ×2 · 1/2  19m             (…)   running: More holds Queue next and Recall
 [face] [ore] ×1 · 1/1  Done      [↓1] (↻)    done: Collect, Repeat
 (+) Free                                     Start a job
 (+) Free
 [Uma]'s queue stopped · Short 1 Copper Ore   Restart · Dismiss
```

- **Slot rows** are uma-kit/work's `SlotRow`: a free slot starts a job; a running one shows its count, what's made and the
  time left, with **More** (Queue next, Recall); a finished one shows **Collect** (↓ and how many) and **Repeat** (↻:
  collect, then the same job again). There is no speed-up control: the farm has no Speed Tickets (FM4), so the kit hides
  it.
- **The header** names the profession, the four slots and the ×1.25 speed; **Open shop: anyone works here** shows when no
  outfit on the release has the place's trade. **Collect here** collects the place's ready slots.
- **A queue** waits behind a running job: up to three more for the same Uma at the same place. When the Warehouse can't
  cover the next one at its turn, it stops: the card says what's short, with **Restart** (once it's covered) and
  **Dismiss**.
- **Recall** asks first and says what comes back ("2 Copper Ore come back") and what's lost.

### The job sheet

Opened by a free slot (`?job=&slot=<n>`) or by Queue next (`?job=&uma=<id>&queue=1`); `job` and `count` may name the
item and size in a link.

| Step | What |
|---|---|
| Who works here? | The Uma, chosen in the picker below; her Craft Level |
| How many | The sizes, each with its time: ×1 … ×30 to gather or process, a make's by its refined items (an Arms Gem ×1–×3) |
| What | A gathering place's ten raw items or a workbench's ten refined ones, G1–G10, in two rows of five; a making place's ten grades (the Lapidary's Planet and Moon I–V). A grade she can't take yet is greyed "From Craft Lv 11". The picked item's card: its line and grade, what's held, and a make's recipe with what's held of each input |
| Inputs and EXP | What the job takes against what's held (red when short), and the Craft EXP it pays |
| Start / Queue next | "Start · ×2 · 39m"; under it, why it can't start ("Short 4 Cut Quartz.") |

### The worker picker

uma-kit's album over every outfit on the release (FW7): faces five across, each with her Craft Level (C1 before her first
job) and her trade's line under her name.

- **Order:** her trade's Umas first, then free ones, then the highest Craft Level (the kit's `workOrder`), then newest.
- **Greyed:** "Another trade" for an Uma whose line isn't the place's, unless it's an open shop; "Busy" for one working
  elsewhere.
- **Filters:** Trade (Metal, Vegetables, Wood, Fish, Stone, with each one's count), Free now, Has worked, Rarity, and A+
  running styles, distances and surfaces. **Sorts:** Craft Level (the opening order), Release date, Name, Rarity.
  **Search** by name or title.

## The Warehouse

uma-kit's `ShelfView` as an icon grid: **All**, the five lines and **Made items**, with grade chips (every grade, the
highest held, or one grade). Each line lists its raw items G1–G10 then its refined ones; Made items lists Arms Gems, Tome
Ink, Armor Fittings, Accessory Settings, then Planet and Moon Jewels. A tap shows the item's line ("Metal · G3 · raw ·
Refines into Iron Ingot", "Stone · G2 · made"). The header totals materials and made items. Nothing sells (FM4).

## Item icons

Every icon is uma-art's (`items` and `gems` atlases), placed from the item's id (`items/frames.ts`), never from the atlas
index, so the main JS stays small: a line item at its family's raw or refined row and its grade, a made item at its own
row, Tome Ink on the essences' refined row, and the jewels on the gem sheet (Planet Jewels the sun gems, Moon Jewels the
limit gems). Outfit faces come from master data's art at runtime (`master/album-art.tsx`), never from git.

## Settling and saving

- **Settling is a reading.** Every screen settles the save at the clock (`useNow`): when the app opens, when it comes
  back into view, and every 15 s while a page is open. A queued job starts at its turn and a short one stops, finished
  items wait for Collect, and nothing is written until the player changes something; that change carries the settled
  state, stamped.
- **Every action is one commit.** Start, Queue next, Recall, Collect, Collect all, Repeat, Restart and Dismiss each read
  the save right before the rule runs (`save/game.ts`, uma-rpg's `edit`), then commit it to the store and the device and
  sync it 1.5 s later. Two quick taps each apply to the other's result. A rule's refusal changes nothing, and the kit
  shows its words.
- **The trade gate** reads master data's roster (`workContext`): before the roster loads, the place pages wait for it.

## Text

Short labels and counts on screen (N9); how each place works is behind its help button, and how the Wilds work behind
the map's.
