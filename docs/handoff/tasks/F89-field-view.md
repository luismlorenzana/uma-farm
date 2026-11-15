# F89 — The field, on its own screen, in plots

**uma-farm · Claude · M · Needs: nothing · [Design](../../design/game-design.md#the-farm-at-scale-2026-11-15)**

> The farm map stops spending its space on 40 tiles. It shows a small field sign; a tap opens the field full screen,
> one plot a page, with room for the farm to clear more plots as it grows.

## Why

The owner (2026-11-15): "the farm plots visible in the farm is a big no no, we need to have a significantly smaller area
representing the plots that after a simple tap it would open full screen the full plot with even things like pages for
plots and such."

## Decided

1. **On the farm map:** the field is one small sign, about a building's size, showing what matters at a glance: tiles
   to water, ripe to harvest, empty to plant ("6 to water · 2 ripe"). The space the 40 tiles held goes back to the map.
2. **The field screen:** a tap opens it full screen in landscape. One plot (8 × 5) fills the page with big tiles; the
   tile's sheet works as now (till, plant, water, harvest, each its action). Rows show their row action where a
   farmhand's trick or the farmer's tool allows it.
3. **Plots as pages:** the save holds the field as a list of plots, each 8 × 5. The farm starts with the one it has
   (the live field becomes plot 1, unchanged). Page dots and arrows, or a swipe, move between plots; a plot not yet
   cleared shows locked with what opens it.
4. **More plots** come with F91's scale: this packet builds the pages and the save shape, with plot 2 opening at Farm
   Rank 3 (cleared like a building: its gold and an action) so a second page exists from the start of the farm's
   growth.
5. **Farmhands:** a field task names its plot and rows; the work board lists each plot's rows.

## Do

1. The domain: plots in the save (v5 in place: the live field read as plot 1), the plot rules, plot 2's clearing, the
   farmhands' field tasks by plot, with tests.
2. The web: the field sign on the farm map, the full-screen field with pages, the work board's plot rows.
3. [The game mechanics](../../game-mechanics.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the main JS ≤ 180 KB gzip.
- A live save opens with its field as plot 1, unchanged; the farm map shows the sign; the field screen pages to a
  locked plot 2, which opens at Farm Rank 3.

## Left to the worker

The sign's look, the page control, and how a row action shows.
