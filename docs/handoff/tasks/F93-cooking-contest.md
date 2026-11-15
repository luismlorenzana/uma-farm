# F93 — The Cooking Contest: the first festival you play

**uma-farm · Claude · M · Needs: F92 · [Roadmap step 2.3](../../roadmap.md#phase-2-the-whole-farm)**

> Autumn 10 stops being a date. You cook a dish live at the stove, the town's cook judges it against the two rival farms,
> and the places pay gold and Farm Rank points.

## Why

Roadmap step 2.3 ends with "the Cooking Contest as a festival". Today a festival is a special day: three actions for
events, its occasion scenes, and "no contest is played, no prize is given" ([festivals](../../game-mechanics.md#festivals)).
The Contest is the first played one; the Flower Show, the Fishing Derby, the Animal Show and the Harvest Cup follow with
their places in 2.6.

## Read first

- [Festivals](../../game-mechanics.md#festivals) (the story may rename or move a festival: the Contest's rule follows
  its `rule: 'cooking-contest'` wherever it falls), [the Farm Rank](../../game-mechanics.md#the-farm-rank),
  [the town's people](../../game-mechanics.md#the-towns-people) (`rosa-bell` judges; `wren-ashby` and `cole-varga`
  are the rival farms), cooking's Legend challenge (`won('cooking-contest')` in `farm/rank-rules.ts`).
- F92's stove and the Kitchen.
- What's in the save: `farm.festivals` (`FestivalResult`: id, day, score, place), `diary.records`.
- The old packet: `git show 70071ac:docs/handoff/tasks/F39-cooking-contest.md`. Its numbers are kept below; its
  recruits and visitors at the Gate are gone with the rework.

## Decided

1. **The entry:** on the Contest's day, the Kitchen (and the morning's "Cooking Contest today" line) shows **Enter the
   Cooking Contest · 3**: three actions, the festival day's three. It needs the Kitchen built ("Build the Kitchen to
   enter"). One entry a Contest.
2. **You cook it live:** pick one known recipe and its ingredients (as the menu does), and an optional cook (a farmhand,
   as F92's assistant). A 60 s stove round makes **one dish**, at its stars by F92's rule. It goes into the Warehouse
   after judging, and isn't the Kitchen's daily play.
3. **The score:** 10 × the dish's ★ + 0.5 × the play's score, 0–100.
4. **The rivals:**
   - the orchard (`wren-ashby`, cooking its specialty): 40 + 6 × the Farm Rank;
   - the ranch (`cole-varga`): 26 + 7 × the Farm Rank.

   Each is capped at 96, and ties go to you. At Farm Rank 3 they're 58 and 47: a ★2 dish and a Good play of 76 makes
   58, 1st on the tie.
5. **The prizes,** paid at once:

   | Place | Gold | Farm Rank points |
   |---|---|---|
   | 1st | 600g × the season's number (Autumn is 3) × the year: 1,800g in year 1 | 150 |
   | 2nd | Half of it | 75 |
   | 3rd | A fifth of it | 25 |

   - **The Farm Rank's points gain festivals:** the sum of each result's points. Recomputed at night as ever; the
     rank's sheet lists them.
   - `farm.festivals` gets `{ id: 'cooking-contest', day, score, place }`, and `diary.records['festival:cooking-contest']`
     keeps the best score.
   - **The cook's Legend:** a 1st counts `won` for the cook.
6. **The judging is a short scene at the play's end,** on the dialogue engine. The town's cook tastes it and says a line
   by your place (a few original lines, written here, the town's people speaking in their roles). Then the board:
   "1st · You 78 · the orchard 70 · the ranch 61", with the gold and the points.
7. **The morning lines:** "Cooking Contest tomorrow" and "Cooking Contest today · +3 for events" open the Kitchen. The
   Festival ground keeps "Opens soon" for the others.
8. **The save:** nothing new; `farm.festivals` and `diary.records` carry it.

## Do

1. The domain: the Contest's rule (the entry, the score, the rivals, the places, the prizes, the points), the Farm
   Rank's festival points, and the Legend; with tests.
2. The web: the Kitchen's Contest card on its day, the entry's sheet, the play (F92's screen), the judging scene and the
   board; the morning lines.
3. [The game mechanics](../../game-mechanics.md): Festivals (the Contest played), the Farm Rank's points, and the
   challenges. Run `pnpm docs:update`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the private-content guard passes.
- Tests:
  - the score and the rivals at Farm Rank 3 and 10, ties to you;
  - each place's gold in year 1 and year 2, and its points;
  - one entry a Contest;
  - no entry without the Kitchen;
  - a story that moves the Contest plays it on its new day;
  - the cook's Legend on a 1st.
- Locally, in landscape, a Contest entered and judged, on a simulated farm loaded into the local app only.
- Production after the deploy: health shows the commit.
