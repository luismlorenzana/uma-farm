# F18 — The calendar and End the day

**uma-farm · Claude · M · Needs: F17 · Beside: F19, F21 · Unblocks: F20, F24 · Milestone M4, the loop on today's map**

## Why

Time is turns (D25): nothing moves until the player ends the day. This packet makes the day the loop's clock: uma-work
runs on it, End the day settles the night in nine fixed steps, and the morning opens on a summary. It also gives the
loop its frame: the farm map in the core loop's rows, the bottom bar with End the day as its raised centre, and the
date in the account bar.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS4, CS5, CS6, CS7, CS8**; CS1 (units), CS3 (what's open and locked on
  day 1), CS22 (well fed), CS53 (`calendar`, `summary`, `work`, `RosterUma.wellFed`), CS55.
- [core-loop.md](../../design/core-loop.md): **FC5, FC6, FC28, FC29, FC33**, FC15, and "Notes from drawing the page"
  #1, #3, #5.
- [hd2d-farm.md](../../design/hd2d-farm.md): FR5–FR9 (the map's rows, the bars, a place's sheet, the taps; their
  timers read as days left, D25).
- [decisions.md](../../decisions.md): **D25**, D26, D27, D28.
- The manual: [wilds.md](../../game/wilds.md) (the map, a place's page, settling as a reading, every action one commit)
  and [architecture.md](../../game/architecture.md) (push; the save as F17 left it).
- Code:
  - `packages/domain/src/save/` (F17's v3, `workNow`, `draw`, `DAY_MS`), `save/work.ts` (the wrappers over uma-work),
    `work/env-v4.ts` and `work/env.ts` (how an env is built), `hub/places.ts` (the place registry), `save/notify.ts`;
  - `apps/web/src/save/game.ts` (`edit`, `commit`), `shell/Bars.tsx`, `shell/Shell.tsx`, `shell/MenuSheet.tsx`,
    `shell/useNow.ts`, `wilds/WildsScreen.tsx` (the Hub map, quick looks, Collect all, help), `wilds/ready.ts`,
    `wilds/soon.ts`, `places/work/`, `push/`, `home/AccountView.tsx`, `app/router.tsx`;
  - uma-kit 0.17.0: `shell/BottomBar.d.ts` (`BarTab.raised`, `badge`), `shell/AccountBar.d.ts` (`CurrencyChip`: a mark,
    a number, `extra`), `hub` (`HubMap`), `work/words.d.ts` (`durationText` prints minutes and hours);
  - uma-work 0.1.0: `settle`, `speedUp`, `SPEED_TICKET_MS` (30 minutes), `TicketRules`, `Entry.acceleratedMs`.

## Decisions made

### From the spec

- **The calendar (CS4):** four seasons of 12 days, a 48-day year. A festival on each season's **day 10**: the Flower
  Show (Spring), the Fishing Derby (Summer), the Cooking Contest (Autumn), the Animal Show (Winter), and the
  **Harvest Cup on Winter 12**. The account bar shows the date, the season and the next festival. In M4 the festivals
  are dates only: the festival ground shows "Soon" (CS3; they come in M6). The season's seeds (F20), fish and forest
  family (F22) and demand (F19) belong to those packets.
- **The morning summary (CS5)** opens after every night, one card, each line a tap to its place, in this order:
  1. the bin: yesterday's sales by item (count, stars, gold) and the total, the season's demand marked;
  2. work done: jobs finished by place, crops ready by block (and later animal products, an expedition home);
  3. ranks: rank-ups, and Umas whose points are full, with their challenge named;
  4. bonds and affinity: new hearts (M6);
  5. new today: visitors at the Gate, a chapter scene, a festival today or tomorrow, the season's first day (new seeds,
     fish, demand), Diary milestones (and later requests);
  6. today's nudges: idle Umas, empty plots with seeds in the Warehouse (later, a workshop not played).
- **The nudge (CS6):** End the day shows **"All set"** when every Uma on the farm has work, nothing waits to be
  collected, and each open workshop has been played or lacks inputs. Otherwise it shows a count badge (idle Umas plus
  uncollected bubbles). Tapping it with something left opens a one-line sheet, "2 Umas idle · 3 to collect", with
  **End anyway** and **Back**. Menu has a switch to skip that sheet. The game never ends a day by itself.
- **The night (CS7),** one pass and one save write, in this order:

  | Step | What | Filled by |
  |---|---|---|
  | 1 | The bin pays: everything shipped today, at price × stars × demand | F19 |
  | 2 | Crops grow; plots that reach their days turn Ready | F20 |
  | 3 | Animals: fed, affection, products | M5 (F27) |
  | 4 | Jobs move a day on: uma-work's clock advances one day (86,400,000 ms); finished jobs turn Ready; queues start their next job (later, expeditions) | **F18**, kinds from F22 |
  | 5 | Workshops reset | M5 |
  | 6 | Ranks, bonds and affinity tick: rank points for every Uma who worked, the well-fed days count down (bonds M6) | F21; **F18** for well fed |
  | 7 | The calendar turns; on a season's last night out-of-season crops wither; the shop restocks | **F18**; F20 for withering |
  | 8 | Goals: visitors come and go, chapter goals, Diary milestones, the Farm Rank recomputed (requests M6) | F23, F24 |
  | 9 | The morning summary is built from what changed | **F18** |

  Rank-ups and conversations show in the morning, never mid-night. A rank reached tonight speeds tomorrow's work.
- **Seeded nights (CS8):** every draw is `draw(uid, day, what, n)` (F17); ending the same save twice, on two devices,
  gives the same morning; the save holds no random state.
- **Work in days (FC6):** gathering and processing take 1 day, making 2–3, crops 4–10 (D28), expeditions 2–5. A queue
  means "keep at this for N days"; Repeat starts the same job the next morning. Nothing moves while the app is closed.
- **Well fed (CS22, FC15):** 1-day jobs make ×1.25 their day's items (F22 plans that); longer work gains **a quarter
  day a night, through uma-work's `acceleratedMs`**; it lasts 1, 2 or 3 days and never stacks. The staff meal that gives
  it is M5's (F8).
- **The bottom bar (FC29):** Farm · Roster · **End the day** (the raised centre button) · Diary · Menu. The Diary tab
  holds the chapter's goals until M6 (F24). The calendar opens from the account bar; the shop and the festival ground
  from the town edge.
- **`farm-push-tick` stays paused** (D25, CS55).

### Decided here (the spec left these open)

1. **The work clock is the calendar.** Every work operation runs at `workNow(save)`; nothing in the loop reads the
   device's clock for work, so reopening the app never moves anything. `account.updatedAt` is still stamped with real
   time on every player's change. The loop drops F5's 15-second settle ticks.
2. **The night is one pure function,** `endDay(save, context) → save`, with the nine steps as named functions in
   order. A step whose packet hasn't landed is a no-op; each packet fills its own and nothing else. The context is
   what the night reads beyond the save: master data's roster and talents (F21). End the day waits for master data.
3. **Step 4 and "a rank reached tonight speeds tomorrow's work" (CS7):** the night reads what finished by settling at
   the next morning's moment (`day × DAY_MS`), ticks ranks at step 6, and only then stores the settle from the
   post-tick save. A queued job that starts at tonight's boundary is therefore planned with tonight's ranks, and any
   reading during the next day settles nothing new.
4. **Well fed through `acceleratedMs`:** for each Uma with `wellFed > 0` and a running entry of a multi-day kind
   (making; in M4 the Mill's preserves; later expeditions), the night calls uma-work's `speedUp` with **12 Speed
   Tickets** on a night-only env whose tickets cost nothing: 12 × 30 minutes = 6 hours, exactly a quarter of 86,400,000
   ms, clamped by uma-work to the time left. Then `wellFed` counts down. Nothing sets it in M4 but tests. If `speedUp`
   can't do this cleanly, it's a uma-platform request, never a fork.
5. **The farm map** (CS55 gave the re-layout to no packet, so it's here): uma-kit's `HubMap`, three columns, scrolling
   up and down (FR6), FC28's rows:

   | Row | Left | Centre | Right |
   |---|---|---|---|
   | 1 | Fields | Mill | Coop |
   | 2 | Forest | Sawmill | Barn |
   | 3 | Fishery | Smokehouse | Kitchen |
   | 4 | Mine | Smelter | Restaurant |
   | 5 | Quarry | Cutter | Forge |
   | 6 | Shipping bin | Warehouse | Dorm |
   | 7 | Requests board | Gate | — |
   | 8 | Shop | Festival ground | Expedition post |

   - Frames are uma-art's (CS19): `vegetable-garden` the Fields, `fields-workbench` the Mill, `forest`,
     `forest-workbench` the Sawmill, `fishery`, `fishery-workbench` the Smokehouse, `mine`, `mine-workbench` the
     Smelter, `quarry`, `den-workbench` the Cutter, `stable` the Barn, `kitchen`, `party-hall` the Restaurant, `forge`,
     `warehouse`, `scenario-gate` the Gate, `exchange` the shop, `racecourse` the festival ground. The Dorm, the bin, the
     Coop, the board and the expedition post borrow an unused building until their art ships (F25, F29, F38).
   - A place whose packet hasn't landed, or that CS3 locks, shows its lock and, in its quick look, what opens it
     ("Chapter 3", "Farm Rank 3"). Open places wire up as F19, F20, F22 and F23 land.
   - The Ready badges and Collect all stay (FR7). The map is taller than one screen at 390×844 and scrolls; the help
     button, the pill and the quick look stay put.
6. **End the day on the kit's bar:** a tab is a link, so the raised tab opens `?sheet=end`. That route ends the day at
   once when it's all set or the Menu switch skips the sheet; otherwise it shows CS6's one-line sheet. The tab reads
   **"All set"** when all set, else **"End day"** with the count badge. The kit has no glow, so F18 sends uma-platform a
   **"Both apps:"** request for a `glow` option on `BarTab`, pinned when released; the label and badge carry the nudge
   until then.
7. **Days on the work screens:** uma-kit/work prints "24h" (`durationText`). F18 sends uma-platform a **"Both apps:"**
   request for a `formatDuration` option on `WorkProvider` so the farm can say "1 day", "2 days" and "Tomorrow", pinned
   when released. The farm's own screens say days now.
8. **The date in the account bar:** a chip with the season's mark (F25; a coloured dot until then) and the day of the
   season, its label "Spring 3, year 1 · Flower Show in 7 days". A kit chip holds one number, so the next festival is in
   the label and the **calendar sheet** (`?sheet=calendar`): the year, the season, the 12-day strip with today and the
   festival day marked, and the next festival with its countdown.
9. **"All set" and the badge (CS6), counted:** an Uma has work when she holds a running uma-work entry or tends a block
   with a growing plot (F20; later a carer or an assistant). "To collect" is every Uma with ready items plus every Ready
   plot. The badge is idle Umas plus to-collect. With no workshops open in M4, that clause is always met.
10. **The skip switch** is a device setting (uma-kit's `farm.` keys), in the Menu sheet: "Ask before ending the day". It
    isn't in the save.
11. **The summary is data:** `save.summary` holds ids, counts and routes, never sentences; the app words it. It's
    replaced each night and set to null when dismissed (a player's change). Empty sections are hidden.
12. **Push in the loop:** day-clock times would mean nothing to the tick, so the loop never sends a push schedule, and
    Account's Notifications card says "Off: days are turns". The server's push code is untouched.
13. **One stamp a night:** End the day is the player's change, stamped once with real time after all nine steps.

### Rules that hold (every M4 packet)

- No original-game content in git: names, titles and art come from master data at runtime only; tests use
  `@luismlorenzana/uma-data/testing` fixtures or invented ids. Run `git status` and the private-content guard before
  committing.
- Main JS ≤ 180 KB gzip, in both builds while M4 is dark (F17).
- The farm runs on today's map, uma-kit's Phaser Hub, until M7.
- Portrait 390×844 first (check 375×667), 44 pt targets, safe areas.
- Player-facing text is short; explanations go behind a help button.
- `uma-work` and `uma-kit/work` aren't forked: anything they lack is a uma-platform request, pinned when released.
- Every save change is a new version with its migration and tests, and `account.updatedAt` never moves in a migration.
  v3 is unreleased until F24, so an M4 packet may extend v3 in place, with parse tests; from F24 on, a change is v4.
- The copied uma-rpg code stays copied, never imported.
- The manual (`docs/game/`) changes in the same commit as each rule.

### Left to the worker

The summary's data shape (decision 11's limits hold); the calendar sheet's drawing; the night's step functions' names;
the borrowed frames; the uma-platform requests' wording (send them through its
[change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md); if this session
can't reach uma-platform, say in one line which session takes them).

## Do

1. **The calendar data** in `@farm/domain`: season names, festivals and their days, `nextFestival(day)`.
2. **The v3 work env** (`farmEnvV3`): the v3 work places of F17's decision 11, four slots each at speed 1 (a day is a
   day), no upgrades, no tickets, `isWorker` = Umas home on the farm, `exp` a no-op (ranks come at night), and the kind
   registry F22 fills. Every work wrapper takes `workNow(save)` for its `now` and real time for its stamp.
3. **`endDay`** (decisions 2–4, 13) with steps 4, 6's well-fed count, 7 and 9 filled, and the others as no-ops.
4. **The nudge** (`daySetState(save)`: all set, idle, to collect) and **the summary builder** (CS5's order).
5. **The loop's screens:** the farm map (decision 5) with its quick looks and the existing Collect all; the bottom bar
   (decision 6); `?sheet=end` and the morning summary card; the date chip and `?sheet=calendar` (decision 8); the Menu
   sheet's places and its switch (decision 10); `/roster` as a plain album of the Umas on the farm until F21 and F23;
   `/diary` as a placeholder until F24; Account without Notifications (decision 12).
6. **The two uma-platform requests** (decisions 6, 7).
7. **The manual:** a new [docs/game/days.md](../../game/days.md) (the calendar, End the day, the night's steps and who
   fills them, the summary, the nudge, the map and the bars; "built in F18, live from F24"), and its row in
   [the manual's index](../../game/README.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; both size checks are ≤ 180 KB gzip; the private-content guard passes.
- Domain tests:
  - `endDay` on the same save twice gives deep-equal results (CS8), and the save holds no random state;
  - with a stub kind, a 1-day job started on day *d* is Ready after one night and not before, a 3-day job after three,
    and a queued job starts at the boundary planned with the rank step 6 gave that night;
  - a well-fed Uma's 2-day making entry gains exactly 21,600,000 ms of `acceleratedMs` a night, clamped at its end, and
    `wellFed` counts down to 0; a 1-day entry gains none;
  - settling the same save at two device times gives the same state: nothing moves while the app is closed;
  - day 12 → 13 turns Spring into Summer; day 48 → 49 turns the year; the next festival after day 10 is Summer 10;
  - the nudge counts idle Umas and things to collect; the summary keeps CS5's order and hides empty sections;
  - one night stamps `updatedAt` once.
- Locally (loop build) at 390×844, from `.claude/launch.json`:
  - the map shows the eight rows; locked places say what opens them;
  - with an idle Uma, End day shows its badge, then "1 Uma idle", End anyway, and the morning summary; the date chip
    reads Spring 2;
  - with every Uma working (a stub job in a dev save) the tab reads "All set" and ends the day at once; the Menu switch
    skips the sheet;
  - reloading the app, or waiting, moves nothing.
- The two uma-platform requests are sent, linked in the Done row.
- Production: the deploy passes, health shows the commit, and https://uma-farm.web.app plays the Wilds as before.

## Deliver

Commit to `main` (`feat: the calendar and End the day (F18)`, `git status` first), push, and watch the run
(`gh run watch <id> -R luismlorenzana/uma-farm --exit-status`); fix forward if it fails. Delete this packet, add a Done
row in [the handoff](../README.md) with the run's link and the two requests, and log the packet's D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number), naming decisions 1–13.
