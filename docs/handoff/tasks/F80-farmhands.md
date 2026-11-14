# F80 — Farmhands and aptitudes

**uma-farm · Claude · L · Needs: F77, F79 · [Design](../../design/game-design.md#umas-at-work) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14): step 7**

> A friend you invite becomes a farmhand. After her part-time job in town, she gives the farm a few actions a day on the
> tasks you set. Every Uma can do every task, and the more she does one the better she gets at it. As the farmhands take
> the work over, your own day turns to the people.

## Why

The owner: "Umas working part-time at the farm to take over all farm actions completely and slowly build up aptitudes";
"all Umas can perform every task"; "Umas would do their part-time job, and then they would do the allocated farm
actions".

## Decided

1. **A farmhand's day:**
   - her part-time job comes first: the story's `job`, else a default;
   - then **3 farm actions** a day, plus more as she settles in and **once you're married**;
   - she does them overnight, settled in the night before the morning, so the morning reports her work.
2. **The work board:**
   - you set each farmhand's tasks: a list of tiles to water, the coop to care for, a spot to fish, a face to mine;
   - **any Uma can do any task**;
   - tasks repeat each day until you change them.
3. **Aptitude:**
   - a level for each task, for each Uma, rising with each action she spends on it;
   - higher levels give more yield, better stars, sometimes a task done in fewer actions, and new tricks (a row watered
     in one action);
   - her stats and today's talents set where each starts. This builds on talents and rank points.
4. **You're freed:** a task on the board is the farmhand's, so the protagonist's own actions stay free for the valley.
5. **Well fed:** a household meal (F79) gives every farmhand one more action the next day.
6. **The save:** each farmhand's tasks and aptitude levels. v4 grows in place.

## Do

1. The domain: the farmhand's daily actions and job, the work board, aptitude growth and effects, with tests and a
   simulation of a farm worked by farmhands.
2. The web: the work board in the Book, her aptitudes on her profile, and the morning's report of the farmhands' work.
3. Update [the game mechanics](../../game-mechanics.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- With two farmhands on the board, a day passes with the fields watered and the coop cared for without your actions,
  and their aptitudes rise over days.
- **The owner's phone check:** "Hire two Umas, set their tasks, and spend a day only in town."

## Deliver

Branch `feat/f80-farmhands` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the aptitude curve;
- the tricks, and when each one opens.
