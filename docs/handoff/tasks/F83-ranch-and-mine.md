# F83 — The ranch and the mine

**uma-farm · Claude · L · Needs: F77, F80 · [Design](../../design/game-design.md#the-farm-loop) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14): step 10**

> The rest of the farm in the farm loop's style: animals you feed, care for and collect from, and a mine you work floor
> by floor. Both are open to farmhands' tasks and aptitudes.

## Why

The owner's farm loop lists animal farming and mining among the actions.

## Decided

1. **The coop and the barn,** built by Farm Rank as today:
   - buy animals at the rancher's in town;
   - each day an animal wants feeding and care (1 action each), and gives eggs, milk or wool when collected;
   - fondness grows with care and lifts the goods' stars;
   - an animal left unfed loses fondness, and never dies.
2. **The mine and the quarry,** built by Farm Rank:
   - work a face (1 action) for ore, stone or gems, rarer with depth;
   - take the stairs (free) to go deeper;
   - the deepest floor reached is kept.
3. **The Smelter and the Cutter** take loads (1 action), as stations do.
4. **Farmhands can be set to any of these tasks;** their aptitude grows as everywhere.
5. **Feed:** grass cut from the fields and fodder bought in town. A silo stores it.

## Do

1. The domain: animals, care, fondness and goods; the mine's floors and finds; the stations, with tests.
2. The web: the coop and barn panels, the mine's floor view, and the rancher's shop.
3. Update [the game mechanics](../../game-mechanics.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- You can buy a chicken, care for it and collect eggs, and work three floors of the mine. A farmhand can be set to both.

## Deliver

Branch `feat/f83-ranch-and-mine` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the animals' list and goods within the existing goods catalogue;
- the floors' depth and finds.
