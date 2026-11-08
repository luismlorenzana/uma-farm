# F5 — The screens

**uma-farm · Claude · M · Needs: F3, F4 · Unblocks: F6 · Milestone M2**

## Why

F4 gives the farm its rules and F3 its app. This packet puts the Wilds on the phone: Home is the Wilds map, every place
has its page on `uma-kit/work`, the Warehouse shows what's made, and any outfit can be put to work. After it, the farm
plays.

## Context (read first)

- [first-playable.md](../../design/first-playable.md): R3, R6, R7, N1, N2, N6, N9 and FW6, FW7, FW11.
- [plan.md](../../design/plan.md): FM5, FM6, FM18–FM20.
- `docs/game/`: the manual as F3 and F4 left it, and `docs/technical/wilds-copy.md` (F4's manifest).
- **uma-rpg at `30a322a`** (F4's commit), copied rather than imported:
  - `apps/web/src/hub/`: `HubScreen.tsx`, `buildings.test.ts`, `grounds.ts`, `ready.ts`, `navigation.ts` (the Wilds page
    on uma-kit's Hub map);
  - `apps/web/src/places/work/`: `PlaceV4.tsx`, `FacilityPage.tsx`, `place-view-v4.ts` and its tests (a place's page);
  - `apps/web/src/places/warehouse/`: `WarehousePage.tsx`, `warehouse-shelves.ts` and its v4 test;
  - `apps/web/src/album/PickerStep.tsx`, `rows.ts`, `trade-facet.test.ts` (the worker picker on the kit's album);
  - `apps/web/src/items/ItemIcon.tsx`, `frames.ts` (uma-art's item icons);
  - `apps/web/src/master/album-art.tsx` and `save/trade.ts`.
- **uma-kit 0.17.0:** `/hub` (the map, buildings, place buttons), `/work` (slot rows, the job sheet, queues, Recall,
  Repeat, quick looks), `/album`, `/places`; **uma-art 2.21.0:** the `buildings`, `tiles`, `ui` and `items` atlases.

## Decisions made

- **Home is the Wilds (FM19, FW6):** one Hub page, five rows of three (Metal, Vegetables, Wood, Fish, Stone, as uma-rpg's
  `PLACES_V4` orders them), gather → process → make left to right, with uma-art's existing buildings for the fifteen.
  The Forge and the Post stand on the map as placeholders: an existing uma-art building, a "Soon" label, and a tap that
  says it opens in M4 or M5. No new art (F9 brings it).
- **Pages:** `/` is the Wilds, `/wilds/:placeId` a place's page, `/warehouse` and `/account`. The bottom bar holds Wilds,
  Warehouse and Menu. The menu lists every place with its Ready count, as uma-rpg's.
- **A place's page** is `uma-kit/work`'s, as uma-rpg's `PlaceV4` draws it: four slot rows, the job sheet with the item,
  its size and its time, three queued, Recall, Repeat, stopped queues and quick looks. No Speed Tickets: the speed-up
  control is hidden, since the farm has none (FM4).
- **The worker picker (FW7):** uma-kit's album over every outfit on the release, sorted and filtered as in uma-rpg, with
  her trade as a facet. A slot outside her trade shows "Another trade", unless the place is an open shop.
- **The Warehouse:** raw, refined and made items by line and grade, from `warehouse-shelves.ts`'s v4 shelves. No selling
  (FM4).
- **Settling:** jobs settle on open, on focus, and every 15 s while a page is open, through F4's `settle`; finished
  items wait for Collect, as in uma-rpg.
- **The Hub map is Phaser, loaded on demand:** `LAZY_MODULES` gains the Hub scene, and the main JS stays ≤ 180 KB gzip
  (N1). The preview pane can't screenshot WebGL: check with `?canvas`.
- **Text (N9):** short labels and counts; how the Wilds work goes behind a help button on the Wilds page.

## Do

1. Copy the Hub page, place page, Warehouse, picker and item icons from uma-rpg, cut to the farm: no tiers, tickets,
   Laurels, targets, Exchange or fights.
2. Wire them to F4's rules through F3's store (`startWork`, `queueWork`, `recall`, `collect`, `repeat`, `restart`,
   `dismiss`), each a commit to the save that syncs.
3. Replace Home's body with the Wilds; add the menu, the help sheet and the placeholders.
4. Update the manual: `docs/game/architecture.md`'s pages, and a `docs/game/wilds.md` for the screens.
5. Tests beside the code: place view models, shelves, the picker's trade facet, the ready counts.

## Done when

- `pnpm lint`, `pnpm test`, `pnpm build` pass, with the size check green.
- Locally at 390×844 (and 375×667): put an Uma to work at each of the fifteen places; a gather → process → make chain
  reaches the Warehouse; Recall, Repeat and a queue work; after closing the tab and reopening past a job's end, it has
  settled.
- In production after the push: the same on the phone, with the save syncing.
- The copied screens import nothing from uma-rpg.

## Deliver

Commit to `main` (`feat(web): …`), push, and watch the run. Delete this packet, add a Done row in
[the handoff](../README.md) with the run's link, and log the packet's D-decision (fetch `main` first).
