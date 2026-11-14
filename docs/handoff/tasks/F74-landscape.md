# F74 — Landscape

**uma-farm · Claude · L · Needs: nothing · Unblocks: every rework packet · [Design](../../design/game-design.md#the-screens-landscape)
· [Roadmap](../../roadmap.md#the-rework-2026-11-14): step 1**

> The whole game turns sideways. Every screen is laid out for a phone held in landscape, with a thin bar that always
> shows the day, the season, the actions left and the gold.

## Why

The owner's rework: "We have to go into full landscape/horizontal rework as it would be a lot better to render the farm
map."

## Decided

1. **Orientation:** the installed app opens in landscape (the web manifest's `orientation`). The layouts are designed at
   844×390 and checked at 667×375. On a phone held upright, a short "Turn your phone sideways" card shows instead of the
   game.
2. **The frame:**
   - **the bar:** a thin top bar with the date and season (a tap opens the calendar from F82), the actions left (a
     placeholder until F77), the gold, and the menu;
   - **the rail:** a slim navigation rail on the left: Farm, Town, People, Book, and Diary.
3. **Sheets become side panels** that slide in from the right, over the screen, instead of bottom sheets. Lists sit in
   two columns where they fit.
4. **Scenes are full screen:** the scene and event players stay as they are until F75 replaces them, laid out
   landscape.
5. **Home, for now,** is today's farm map laid out landscape. F77 replaces it with the tile farm.
6. **The HD-2D portrait preview retires:** the switch, the stage chunk and its route. Its code and the `uma-stage` pin
   stay only if F77 or later use them; otherwise they go.
7. **uma-kit is shared:**
   - where a kit component is portrait-only (the bars, the sheets, the place map), send uma-platform a request for its
     landscape variant;
   - never fork the kit;
   - until the variant ships, the farm wraps it.

## Do

1. The manifest, the portrait guard card, the bar and the rail.
2. Every screen re-laid out for landscape: Home, the Fields, places, the Warehouse, People and Hearts, profiles, the
   Diary, the Town, Account, the start and the opening.
3. Retire the HD-2D preview (decision 6). Its art contract, `kit-farm.md`, is already retired (it's in git's history).
4. The uma-platform request for any kit pieces that need a landscape variant.
5. Update [the game mechanics](../../game-mechanics.md) and [architecture.md](../../technical/architecture.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- Every screen is usable at 844×390 and 667×375, with no clipped or portrait-only layout.
- **The owner's phone check:** "Open the app sideways and visit every screen."

## Deliver

Branch `feat/f74-landscape` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the bar's and the rail's look, within uma-kit;
- which lists go two columns.
