# F64 — The farm grows by building

**uma-farm · Claude · L · Needs: F62 · Unblocks: F65–F68, the workshops · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas):
Phase 1, step 1.4 · Design: [progression.md](../../design/progression.md)**

> No global chapters and no farm-wide story. The Farm Rank, earned by income and farmed goods, says what you may
> build; you build it with gold and goods. The homestead and the town grow with your life with the Umas.

## Why

The owner's call (2026-11-13): no global chapters or global story. The story lives in each Uma, and the farm's unlocks
come from income, farmed resources and relationship milestones ("x married Umas unlocks a new house").

## Decided

1. **Global chapters go:**
   - `farm.chapter`;
   - the chapters' goals, rewards, scenes, hello lines and recruits;
   - the Diary's chapter card;
   - the arrivals by chapter.

   The town's cast stays as the town's people, with no plot.
2. **Farm Rank is income and resources:** 1 point per 100g shipped, a Diary entry for each good first shipped, and the
   Diary's milestones. Chapter points go. The thresholds are re-tuned so the ranks come at a similar pace without them.
3. **Every place past the start opens by Farm Rank and a build:**
   - the rank offers it;
   - you pay its cost in gold and the farm's goods;
   - it stands the next morning.

   The starting draft, tuned by the simulation in decision 7:

   | Farm Rank | Offers |
   |---|---|
   | 1 | The Mill |
   | 2 | The Coop |
   | 3 | The Barn, the Sawmill, the Smokehouse |
   | 4 | The Mine, the Smelter |
   | 5 | The Quarry, the Cutter, the Kitchen |
   | 6 | The dock, then the boat (the sea's spots) |
   | 7 | The expedition post, the Restaurant |
   | 8 | The Forge's merge game |

   Fields blocks, the Dorm's levels and seeds keep their rank openings. Places whose games aren't built yet show what
   they'll be, as "Not built yet", and can't be bought.
4. **Milestones with the Umas:**
   - the ring bench opens the first time anyone plays a Romance 8 event, as it does today;
   - the *n*-th wedding opens house *n*;
   - three married open the homestead's second row;
   - five Umas met opens the Requests board's place (its game comes later).
5. **What used a chapter now uses the place it meant:**
   - the ring bench takes ingots and cut gems once the Smelter and the Cutter stand;
   - a perk at her line's place says "Opens when the Kitchen is built" (or her place);
   - the sea's spots need the dock and the boat.
6. **The farm's projects replace the Diary's chapter card:**
   - what you can build now, with its cost and what you still lack;
   - what the next rank offers;
   - the milestones with the Umas, with how far along you are.
7. **The pacing:** a test simulates a run to Farm Rank 8, and checks each place's offer day and that its cost is
   affordable within about a season of its offer.
8. **Save:** v4 grows in place. `farm.chapter` goes, and built places stay in `buildings`.

## Do

1. The domain: decisions 1–5 and 8, with the simulation of decision 7.
2. The web:
   - the farm's projects (decision 6), where the Diary's chapter card was;
   - each place's "Build" sheet, with its cost;
   - the morning's "Built overnight" line.
3. [The game mechanics](../../game-mechanics.md): the chapters' sections become the farm's projects, building and the
   milestones. [progression.md](../../design/progression.md) is then built and deleted, its content now in the mechanics.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass; the simulation passes.
- At 390×844:
  - Farm Rank 1 offers the Mill, and paying builds it overnight;
  - the projects list shows the next offers;
  - the first wedding opens house 1.

## From the story (2026-11-13)

The story's launch pass gates its characters' chapters on the farm's builds (`built` from the trigger menu): the
Mine, the Quarry, the Cutter, the Kitchen, the Restaurant and the Forge. One chapter waits on the boat, and the pack names
**Farm Rank 6** for it because the farm has no place id for the dock or the boat yet.

- **Asked:** give the dock and the boat place ids in `FARM_PLACE_IDS` when they become places you build, so a `built`
  gate can name them. The story then switches that chapter's gate to the boat.

## Deliver

Branch `feat/f64-farm-by-building` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- each place's cost, within the simulation's checks;
- the projects list's layout, within uma-kit;
- the threshold numbers.
