# The uma-farm manual

What the game **is**, as built and as it runs on https://uma-farm.web.app. **It is empty for now: there are no rules
yet.** F3 writes its first page (`architecture.md`: the app, the save, sync, deploy and local setup), F4 the
Wilds' pages (`materials.md`, `loops.md`),, and every packet
that ships a rule writes or updates its page in the same commit.

Specs and intent live in [docs/design/](../design/). Where they differ from this manual, the manual and the code win.

## How these docs stay true

- **Lists are generated from the code** once there are rules, as in uma-rpg's manual: a renderer writes each block
  between `<!-- live:<key> -->` and `<!-- /live -->`, a test fails on a stale page, and `pnpm docs:update` rewrites
  them.
- **Hand-written parts** change in the same commit as the code they describe.
- **Original-game content stays out:** no outfit, character or scenario names from master data, and no franchise cast.
