# F82 — The calendar

**uma-farm · Claude · M · Needs: F75, F77 · [Design](../../design/game-design.md#the-calendar) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14): step 9**

> The year at a glance: festivals, birthdays, the story's holidays and customs, and the faces of the Umas who have an
> event on each day. Special days lift the action budget for events, and play the occasion scenes the story wrote.

## Why

The owner: "the calendar … very visible, with many events"; "for things like new years events … execute at least a few
of Umas events in those dates even if time-wise it shouldn't be possible"; "Umas faces appearing on all the dates they
have valid events".

## Decided

1. **The calendar screen** (from the bar's date): the season's 12 days as a grid in landscape, with the year's other
   seasons a tap away.
2. **Each day shows:**
   - its festival, from the pack's world file or the game's;
   - birthdays;
   - the story's holidays and minor days (`world.json`; a new optional `days` list on the pack's menu);
   - **the faces of the Umas with an event that day:** her event Ready on that date, a birthday, an anniversary, or an
     occasion scene.
3. **Special days:** New Year's, the festivals and her birthday add event-only actions (F77 grants them), so several
   Umas' events fit that day.
4. **Occasion scenes on their day:** the story's `new-year` (from the second year), `derby-night` and `flower-show` play
   on their days. F79 has the evenings and the wedding night.
5. **The morning** names today's and tomorrow's.

## Do

1. The domain: a day's entries, the faces' rule, the occasions' scheduling and the special days, with tests.
2. The web: the calendar screen and the day's panel.
3. The pack's `days` in `docs/story-pack.md`.
4. Update [the game mechanics](../../game-mechanics.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- The calendar shows a season's festivals, birthdays and the faces of Umas with events. On a festival day, the extra
  event actions let you play two Umas' events past the budget.

## Deliver

Branch `feat/f82-calendar` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the grid's look;
- how many faces a day shows before "+n".
