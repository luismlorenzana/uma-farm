# F81 — Upkeep and loans

**uma-farm · Claude · M · Needs: F77 · [Design](../../design/game-design.md#the-economy) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14): step 8**

> The farm has to pay its way: each building, room and resident costs a little each day. Loans from the mayor's office let
> you build ahead, and the daily work pays them back.

## Why

The owner: "some form of upkeep that would require a minimum amount of currency being produced to support the
infrastructure and the number of farm residents"; "loans to build additional housing or additional farm structures".

## Decided

1. **Upkeep,** charged at night after the bin pays:
   - a small amount per building;
   - per Dorm room;
   - per resident living on the farm.
2. **The Book** shows the daily upkeep beside an average day's income over the last seven days, so you see whether the
   farm can grow.
3. **Short of upkeep:**
   - first a warning in the morning;
   - from the second short night, farmhands work at half their actions until it's paid;
   - nobody leaves, and nothing is lost.
4. **Loans,** at the mayor's office in town:
   - borrow toward a build or a house, up to a limit by Farm Rank;
   - one loan at a time, two from Farm Rank 4;
   - a small fee;
   - repaid a little each night from income, before upkeep.

   The projects list shows what's owed and when it clears.
5. **Numbers to start:** set so a first-season farm runs a small surplus, then tuned by a simulation and the owner's play.

## Do

1. The domain: upkeep, shortfall and recovery, loans and repayment, with tests and a simulated first year.
2. The web: the Book's money page, the mayor's office's loan menu, and the morning's lines.
3. Update [the game mechanics](../../game-mechanics.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the simulation shows a first year paying its way.
- A loan builds a house early and clears over the following days.

## Deliver

Branch `feat/f81-economy` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the amounts, within the simulation's checks.
