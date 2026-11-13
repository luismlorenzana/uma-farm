# Progression without global chapters

**Adopted by the owner, 2026-11-13** ("this progression and update makes sense to me"). The farm has no global chapters
and no global story. The farm grows by what you earn and grow, and by the lives you build with the Umas. The story lives
in each Uma, in her own chapters. It's built by [F64](../handoff/tasks/F64-farm-by-building.md) and
[F68](../handoff/tasks/F68-her-chapters.md), and moves into [the game mechanics](../game-mechanics.md) as it lands. The
page view is [progression.html](../pages/progression.html).

## The idea

| | Today | Proposed |
|---|---|---|
| **The story** | One farm story in chapters 1–7, told with the town's cast, plus each Uma's route | Each Uma's own story, in her own chapters. No farm-wide story |
| **What opens places** | Mostly global chapters: the Coop and the Barn at 2, the Mine at 3, the Kitchen at 4, the Restaurant at 6, the Forge at 7 | **Income and farmed goods:** the Farm Rank says what you may build, and you build it with gold and goods |
| **What opens the homestead** | Houses: the first after the first wedding, each next one after the last is built | **Your life with the Umas:** the *n*-th wedding opens house *n*, and other milestones open other things |
| **Farm Rank** | Gold shipped, Diary entries, milestones, and 250 a chapter | Gold shipped, Diary entries and milestones only: income and resources |
| **The ending** | Chapter 5's end, then the long game | Each Uma's story has its own end, in married life. The farm has no ending: you build it out, and it keeps going |

## What global chapters do today, and what replaces each

Everything below is in the code today; the deployed farm (v3) has chapter 1 only.

| Today, gated by a global chapter | Proposed |
|---|---|
| Chapter 1's six goals and its reward: 500g, the Mill's plans, a recruit, 250 Farm Rank points | The Mill is the first thing you build, at Farm Rank 1. New people come from the town, by meeting them ([F67](../handoff/tasks/F67-meeting-her.md)) |
| The Coop and the Barn, at chapter 2 | Built, from Farm Rank 2 and 3 |
| The Mine, the Quarry, the Smelter and the Cutter, at chapter 3 | Built, from Farm Rank 4 and 5 |
| The Kitchen, at chapter 4 | Built, from Farm Rank 5 |
| Expeditions, at chapter 5 | The expedition post, built from Farm Rank 7 |
| The Restaurant, at chapter 6 | Built, from Farm Rank 7 |
| The Forge's merge game, at chapter 7 | Built, from Farm Rank 8 |
| The sea's two fishing spots, at chapter 7, with the boat | The dock, then the boat, built from Farm Rank 6 |
| The ring bench takes ingots and cut gems from chapter 3 | It takes them once the Smelter and the Cutter stand |
| A perk at her line's place says "Opens with chapter *n*" | "Opens when the Kitchen is built" (or her place) |
| Arrivals by chapter, and a recruit as each chapter's reward | Gone: you meet people in town |
| The chapter scenes with the town's cast (the mayor and the rest), and their hello lines | Gone as a plot. The town's cast stays as the town's people: the shop, the mayor's welcome at the start |
| Farm Rank's 250 points a chapter | Gone. The rank's thresholds are re-tuned to income alone |
| The Diary's chapter card and its goals | **The farm's projects:** what you can build next, its cost, and what you still need |

## The farm's unlocks: three kinds

### 1. The Farm Rank says what you may build

The rank comes from income and resources only: gold shipped (1 point per 100g), a Diary entry for each good first
shipped, and the Diary's milestones. A draft of what each rank offers; the numbers get tuned by a simulation of a whole
run:

| Farm Rank | You may build (new) | Also opens |
|---|---|---|
| 1 | The Mill | Block A, the Dorm's first levels, the town |
| 2 | The Coop | Block B, new seeds |
| 3 | The Barn, the Sawmill, the Smokehouse | The Dorm's next levels |
| 4 | The Mine, the Smelter | Block C, new seeds |
| 5 | The Quarry, the Cutter, the Kitchen | |
| 6 | The dock, then the boat (the sea's spots) | Block D |
| 7 | The expedition post, the Restaurant | |
| 8 | The Forge's merge game | |
| 9–10 | — | The farm's gold crest at 10 |

### 2. You build it with gold and farmed goods

- **A cost each:** every place has its cost in gold and the farm's own goods. For example, the Coop might be
  3,000g + 40 planks, and the Mine 6,000g + 60 planks + 20 stone blocks; the numbers get tuned.
- **Built overnight:** a place you pay for stands the next morning.
- **What's next:** the farm's projects list shows what you can build and what's still missing.
- **The same rule as today:** the Sawmill and the Smokehouse already work this way (Farm Rank 3, then gold). This makes it
  the rule for every place.

### 3. Your life with the Umas opens the homestead and the romance's places

| Milestone | Opens |
|---|---|
| **The first time anyone is ready to propose** | The ring bench. Today it opens with the first Romance 8 event anyone plays, so this already works |
| **The *n*-th wedding** | House *n* can be built (the owner's example). Today a house opens after the first wedding and then the house before |
| **3 married** | The homestead's second row of houses |
| **5 people met** | The Requests board: the town's requests |
| **10 people met** | A town festival day where everyone you've met comes to the farm (a later idea) |

These are drafts. The rule is the point: **the homestead and the town grow with the people in your life, and the farm's
working places grow with what you earn.**

## Her chapters

- **Her story is hers:** her own chapters, from the day you meet her to married life.
- **The story decides them:**
  - how many there are, their titles, and which of her events each holds;
  - nothing is required (the [open pack](../handoff/tasks/F61-open-story-pack.md));
  - a chapter is the story's grouping of her events along the game's backbone.
- **The game's backbone stays as built:**
  - friendship F1–F10, then the confession;
  - romance R1–R10, then the proposal and the wedding;
  - married life S1–S5;
  - the points, the perks and the evenings along the way.
- **Default chapters,** when the story gives none:
  1. "Getting to know her": friendship, to the confession;
  2. "Together": romance, to the proposal;
  3. "The wedding";
  4. "Married life".
- **A chapter may ask the farm for something:** the story's choice, and optional. For example, "her third chapter begins
  once the Kitchen is built", or "once you've shipped 50 of her favourite good". This ties her story to the farm without
  a global plot. The gates come from the same menu as her trigger to meet.
- **Where you see it:**
  - her profile shows her chapters, the one she's in, and what opens the next;
  - the Hearts tab shows each Uma's chapter at a glance;
  - the morning says when a chapter opens ("A new chapter with her").
- **Her ending:** her last chapter closes in married life. The household's scenes go on after it.

## The long game

There's no global ending. Instead:
- **the farm:** every place built, every block, the Dorm's last level, Farm Rank 10's gold crest;
- **the people:** as many stories as you choose to follow, each to its own end, and a homestead full of houses;
- **the years:** festivals, seasons, records, and the household's milestones.

## Where it's built

| Packet | What it builds of this |
|---|---|
| [F61](../handoff/tasks/F61-open-story-pack.md), the open pack | Her chapters, her trigger and the welcome list in the pack's menu, all optional |
| [F62](../handoff/tasks/F62-one-game.md), one game | One build on save v4: the live farm's chapter 1 and v3 go |
| [F63](../handoff/tasks/F63-story-placeholders.md), placeholders | The four default chapters |
| [F64](../handoff/tasks/F64-farm-by-building.md), the farm by building | Global chapters removed, Farm Rank from income alone, every place by rank and build, the milestones with the Umas, the farm's projects |
| [F67](../handoff/tasks/F67-meeting-her.md), meeting her | Triggers include "a place built" and "a Farm Rank" |
| [F68](../handoff/tasks/F68-her-chapters.md), her chapters | Her chapters on her profile and the Hearts tab, their gates, and the morning's line |

The [roadmap](../roadmap.md#phase-1-one-game-built-around-the-umas) has the order: F61, F62, F63, F64, F65, F66, F67,
F68.
