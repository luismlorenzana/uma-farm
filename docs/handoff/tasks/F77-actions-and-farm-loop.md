# F77 — A day of actions, and the farm loop

**uma-farm · Claude · L · Needs: F74 · Unblocks: F78, F80, F83 · [Design](../../design/game-design.md#a-day-limited-actions)
· [Roadmap](../../roadmap.md#the-rework-2026-11-14): step 4**

> The protagonist has 10 actions a day, and the farm is a landscape tile map he works by hand: clear, till, plant,
> water, harvest, forage, fish, process and ship, in the spirit of the classic farm-life games.

## Why

The owner: "There is a limited amount of Time actions per day, the player character can use an action to perform a farm
action (planting, watering, harvesting, selling, …)"; and the farming loop is to be "very closely" in the classic
farm-life games' spirit.

## Decided

1. **The action budget:**
   - 10 a day, shown in the bar;
   - [the design's table](../../design/game-design.md#a-day-limited-actions) prices every action, including the
     valley's, which F78 and F79 build;
   - the day ends when the actions run out or you end it.
2. **The farm map,** a landscape tile map:
   - the fields as a grid of tiles, starting overgrown with weeds, stones and stumps, a small patch cleared;
   - the buildings, the bin, the pond's edge and the woods' edge as places on it;
   - tap a tile for its actions.
3. **The fields:**
   - a tile is cleared, then tilled, then planted;
   - a tile watered that day grows one stage that night; a dry one doesn't; the season's end withers what's left;
   - harvest when ripe;
   - crops, seasons, prices, stars and seed shops stay as built. A crop's stages come from its growth days.
4. **Gathering:**
   - forage the woods or the hills: one action, one haul from the season's finds;
   - fish the pond or the sea's spots: one action, one catch;
   - the areas and spots, their seasons and finds stay as built.
5. **Stations:** one action starts a load, which is ready the next morning. Recipes stay as built.
6. **Shipping:** one action ships what you pick, paid that night as today.
7. **The protagonist works alone** until farmhands arrive (F80). Today's work board and multi-day jobs retire, with
   their content kept.
8. **Special days give extra event actions:** New Year's, the festivals and her birthday each add actions that only
   events can use. F82 shows them; this packet grants them.
9. **The save:** tiles replace blocks. An existing farm starts over, with the card and the server's backup, as when v4
   arrived.

## Do

1. The domain:
   - the budget and its costs;
   - tiles: clearing, tilling, planting, watering, growth and withering;
   - one-action gathering, stations and shipping;
   - the save's tiles, with a start-over for older farms.

   All with tests, including a simulated first season.
2. The web: the tile farm map in landscape, the tile's action menu, the bar's actions, and the gathering and station
   menus.
3. Update [the game mechanics](../../game-mechanics.md): the day, the Fields, gathering, stations, shipping.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- At 844×390 you can play a day:
  - clear, till, plant and water some tiles;
  - forage and fish;
  - start a load and ship;
  - see the actions run out and End the day;
  - wake to grown crops and the bin's gold.
- **The owner's phone check:** "Play three days of farming on your own."

## Deliver

Branch `feat/f77-actions-and-farm-loop` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the field's size and the starting clear patch;
- the tile art from the existing item icons;
- the crop stages' look.
