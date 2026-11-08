# The uma-farm manual

What the game **is**, as built and as it runs on https://uma-farm.web.app. Every packet that ships a rule writes or
updates its page in the same commit.

| Page | What |
|---|---|
| [architecture.md](architecture.md) | The app, the API, the save and its sync, deploy and local setup (F3) |
| [loops.md](loops.md) | The Wilds' loop: who works, the fifteen places, Craft Level, a job, the Warehouse, the save (F4) |
| [materials.md](materials.md) | The five lines, their fifty raw and refined pairs, and the made items with their recipes (F4) |

The Wilds' screens arrive with F5; until then the rules run in the domain and its tests only.

Specs and intent live in [docs/design/](../design/). Where they differ from this manual, the manual and the code win.

## How these docs stay true

- **Lists are generated from the code** once there are rules, as in uma-rpg's manual: a renderer writes each block
  between `<!-- live:<key> -->` and `<!-- /live -->`, a test fails on a stale page, and `pnpm docs:update` rewrites
  them.
- **Hand-written parts** change in the same commit as the code they describe.
- **Original-game content stays out:** no outfit, character or scenario names from master data, and no franchise cast.
