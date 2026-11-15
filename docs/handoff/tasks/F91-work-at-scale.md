# F91 — Work at scale: 10, 20 and 50 Umas, all working

**uma-farm · Claude · L · Needs: F89, F90 · [Design](../../design/game-design.md#the-farm-at-scale-2026-11-15)**

> The farm's work grows with its people: more plots, station levels that take more loads, gathering that thins after a
> few hauls, and a market that feels a flood. A simulation checks each stage: 10, 20 and 50 Umas, none idle.

## Why

The owner (2026-11-15): "when we have 10 Umas, then 20 Umas, then 50 Umas, do all those stages support all Umas fully
working?" Today about 10–20 can hold real jobs; past that, every Uma only gathers, and gold runs away
([the analysis](../../design/game-design.md#the-farm-at-scale-2026-11-15)).

## Decided

1. **Plots:** up to eight (F89's pages), each cleared at a Farm Rank (plot 2 at 3, then 4, 5, 6, 7, 8, 9), with its
   gold and an action.
2. **Station levels:** a station's level adds a load a day (level 1, one load; level 5, five).
3. **Gathering thins:** each area and spot gives full hauls the first four times a day, then half hauls.
4. **The market feels a flood:** a good shipped past a crate in a day eases its price by a step for the next few days,
   recovering a step a night.
5. **The simulation:** the season test plays three farms, with 10, 20 and 50 Umas brought in over years 1–4, the
   farmhands assigned by a plain rule (the field and the animals first, then the stations, the kitchen, then gathering).
   It reports for each stage: the actions a day the farm can use, the Umas in real jobs and the idle, the gold and the
   upkeep and food. Phase 2's employers (expeditions, the Restaurant, the Forge) are counted as "to come".
6. **Retune** only what the simulation shows broken, and say what changed.

## Do

1. The domain: plots by rank, station loads by level, gathering's thinning, the market's ease, with tests; the three-farm
   simulation and its tables.
2. The web: the station's loads, the area's "thin" mark, the bin's eased price.
3. [The game mechanics](../../game-mechanics.md), with the simulation's tables.

## Done when

- The simulation shows 10 and 20 Umas fully in real jobs, and says what 50 still needs from Phase 2.
