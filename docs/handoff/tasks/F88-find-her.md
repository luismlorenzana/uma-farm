# F88 — She's where you can find her

**uma-farm · Claude · L, two parts · Needs: F86, F87 (in) · Integration branch `feat/f88-find-her`, one deploy ·
[Roadmap](../../roadmap.md)**

> Only your cast lives in town. Every Uma keeps a fixed schedule you can read on her profile and the calendar, with no
> random appearances. A farmhand is on the farm by day. An evening can be spent with an Uma in front of you in town.
> Every default gift can be found early. Her profile picture is a square crop of her own portrait, in the season's
> outfit.

## Why

The owner's first play (2026-11-14):
- "I go to town, and there's a ton of random umas that shouldn't even be in the game."
- "Does every Uma have a fixed calendar with specific day appearances? are we doing random assignment for appearances in
  town?"
- "can we look into authoring profile picks based on crops of Umas in-game authored art? that also renders the profile
  according to the season?"
- "Maybe we do a square profile pic as opposed to circle, so notifications and counts don't cover the actual uma face if
  they're placed in the corners."
- "yes, build everything together."

F86's marriage simulation showed the rest. An Uma who stays in town is in front of you on about one day in four, never
has an evening, and isn't easier to reach once she's a farmhand. Her wedding comes in year 4–7. Two default loved gifts
(a fishing Uma's and a farming Uma's) can't be had early, or at all.

## Decided

**Part 1: the game.**

1. **Only the cast lives in town:** already on this branch (270cc73). The town's population is the story's cast,
   sisters included, plus the town's people at their posts. Nobody else from master data is in the game.
2. **A fixed schedule for every Uma, with no draw:**
   - her schedule is the story's when written (`routine`, `job`, `home`, as today);
   - an Uma the story hasn't scheduled keeps **the default schedule**: at her favourite spot (her cast `spot`, else one
     of the six by her place in the cast) on **every third day of each season**, starting on day 1, 2 or 3 by her place
     in the cast, and at home the other days;
   - the seeded draw is gone, so nobody appears at random;
   - a spot holds everyone the schedules put there (no cap of four). Say how the town map shows a crowded spot.
3. **You can see her schedule:**
   - her profile shows "Where to find her": the days and places this season, and today's;
   - the calendar's day shows who's in town that day, and where. Her face on an event day stays as built.
4. **A farmhand is on the farm by day,** after her part-time job: in front of you every day from the invitation on, for
   talks, gifts and her evening. Her job still shows on her profile.
5. **An evening with an Uma in front of you in town:** ask her out from her menu, 2 actions, one evening a day as now.
   The hangout and date kinds and their scenes are unchanged; F86's link guards hold.
6. **Every default loved or liked good can be had early,** in Spring of year 1. A fishing default-story Uma's loved
   Seashell, which nothing gives, and a farming one's loved Peach, which grows only in the Hills in Summer, change to
   goods the first season gives.
7. **The marriage simulation re-runs** with all of this. The mechanics doc's tables and its findings are rewritten. No
   retune beyond the above.

**Part 2: her picture.**

8. **Square profile pictures:**
   - a rounded square everywhere an Uma's face shows as an avatar (the town, People, the calendar, her menu, the work
     board, the morning lines and the rest);
   - her face is centred with a margin, so corner badges and counts sit over her shoulders or the background;
   - the blank profile becomes a square too.
9. **Cut from her own portraits, in the season's outfit:**
   - her picture is a head-and-shoulders crop of her portrait base for **today's season** (spring, summer, autumn,
     winter; spring when that base is missing), with her calm face;
   - **for now the game crops in place:** from the base it already loads for her scenes, using the base's `face`
     position;
   - **when uma-platform publishes small square crops** (asked: about 192 px, made from the bases, under master data's
     `dialogue-portraits` or its own family), the game reads those instead, so a long list stays light;
   - an Uma without portraits shows the blank profile in the season's colours.

**Part 3: the story.**

10. **Her schedule is a piece of a complete Uma:**
    - the story-pack menu says plainly that her `routine`, `job` and `home` are what her profile and the calendar show,
      and that the default schedule plays until hers is written;
    - `story:status` counts her schedule;
    - F87's scaffold writes **the game's own default schedule** (decision 2), marked default, in place of its starter
      `home` and `job` at her spot, which put her in town every day.

## Do

1. **Part 1 and Part 3** (one worker, on `feat/f88-find-her`): the domain, the web views (her profile's schedule, the
   calendar's day, her menu's evening), the gifts, the simulation, the scaffold and the docs.
2. **Part 2** (one worker, on its own branch, with its pull request into `feat/f88-find-her`): the avatar component, the
   seasonal crop, and the switch to uma-platform's crops when they exist.
3. The main session asks uma-platform for the crops, merges Part 2 into the branch, and opens **one** pull request to
   `main`. It deploys once.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- The town lists only the cast and its people.
- No placement anywhere is random. Each Uma's profile shows where she'll be, and the calendar's days show who's in town.
- A farmhand is in front of you every day. An evening plays with an Uma met in town.
- The simulation's wedding with her living in town comes well inside the routes' current year 4–7.
- Avatars are squares cut from her portraits in the season's outfit, with the blank square without art.

## Left to the workers

- how a crowded spot shows on the map;
- the calendar day's list;
- the crop's exact framing.
