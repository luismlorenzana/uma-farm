# The uma-farm manual

What the game **is**, as built and as it runs on https://uma-farm.web.app. Every packet that ships a rule writes or
updates its page in the same commit.

| Page | What |
|---|---|
| [architecture.md](architecture.md) | The app, the API, the save and its sync, "work done" notifications, deploy and local setup (F3, F6); save v3, the dark launch and the v2 → v3 migration (F17, live from F24) |
| [days.md](days.md) | The calendar and its festivals, work in days, End the day and the night's nine steps, the nudge, the morning summary, the farm map and the bars (F18, live from F24) |
| [fields.md](fields.md) | The Fields: the 27 crops, the shop's seeds by season and tier, the four blocks, planting and harvesting, tending and growth by rank and talent, seeds back, crop levels, farming's challenges, the night's growth and withering, the Fields' screens (F20, live from F24) |
| [goods.md](goods.md) | Goods: the one price rule and every family's prices, stars (CS26), demand by season, the shipping bin and its night, gold, the shop's frame and the Warehouse by stars (F19, live from F24) |
| [gathering.md](gathering.md) | Gathering: the forest's six areas and the Fishery's seven spots by season, a job in days and its haul by rank, talent, tool and well fed, stars, collecting by stars, a catch's size and the Diary's records, the night's hauls toward the challenges and the best catch, the Mill, the Sawmill and the Smokehouse with their jobs, rates, recipes and building, talents in planning, the screens (F22, live from F24) |
| [roster.md](roster.md) | The roster: the start's six cards, one redraw and three picks, the Dorm's levels and beds, the off-season and swaps, visitors at the Gate, chats and gifts with likes by favourite line, joining at 2 hearts, chapter recruits, the night's step 8 and the morning's news, the screens (F23, live from F24) |
| [ranks.md](ranks.md) | Talents and ranks: the stat → talent rule and its cut-offs, what a talent gives, temperament, rank points a day, the nine activities' challenges, rank-ups at night, what a rank gives, the favourite line, the morning's ranks, the roster's cards, filters and sorts (F21, live from F24) |
| [loops.md](loops.md) | The Wilds' loop: who works, the fifteen places, Craft Level, a job, the Warehouse, the save (F4) |
| [materials.md](materials.md) | The five lines, their fifty raw and refined pairs, and the made items with their recipes (F4) |
| [wilds.md](wilds.md) | The Wilds' screens: the map, a place's page and its job sheet, the worker picker, the Warehouse, settling (F5) |

Specs and intent live in [docs/design/](../design/). Where they differ from this manual, the manual and the code win.

## How these docs stay true

- **Lists are generated from the code** once there are rules, as in uma-rpg's manual: a renderer writes each block
  between `<!-- live:<key> -->` and `<!-- /live -->`, a test fails on a stale page, and `pnpm docs:update` rewrites
  them.
- **Hand-written parts** change in the same commit as the code they describe.
- **Original-game content stays out:** no outfit, character or scenario names from master data, and no franchise cast.
