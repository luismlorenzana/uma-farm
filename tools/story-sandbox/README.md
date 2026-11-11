# Farm Story Sandbox

A local page for reading, playing and reviewing uma-farm's story: F40's authored cast, their ties and routes (the
romance, D40), and the chapters' scenes. It is the farm's sibling of uma-quest's Story Sandbox
(`../uma-quest/tools/story-sandbox/`). Calls: D42.

```bash
pnpm stories:import-pack   # the Umas' faces and art, from uma-quest's cast pack (once per Studio export)
pnpm stories               # http://127.0.0.1:4321
```

- **No dependencies:** Node 22's `http` and the page as plain modules. `pnpm stories` passes `--experimental-strip-types`
  so the sandbox reads `@farm/domain` in place (Node 22.18 and later need no flag).
- **What it reads, on every request** (edit a file, come back to the page):
  - **F40's story, private, in the ignored `content/story/`:** `world.md`, `cast.json`, `ties.json`, `umas/<id>.json`,
    `routes/<id>.json`, `pairs/<a>-<b>.json`, checked by the domain's own validator (`story/authored.ts`), and
    `pack/<id>/` for the Umas' pictures.
  - **The chapter drafts, original and in git:** `docs/story/chapters/chapter-<n>.json` (the town's scenes in the game's
    `Beat` shape), `beats.json` and `conversations.json` (CS45's and CS46's templates, the fallback for pairs without an
    authored conversation).
  - **The game's story as built:** `story/cast.ts`, every `story/chapter-*.ts`, the places, temperaments and activities.
- **Pages:** Characters (the cast in arrival order) · each Uma (her paragraph, her route as a 27-rung ladder, her arrival first, her ties) ·
  Relationships (the ties as a ring and a table) · World (the world bible) · Chapters and their scene player · Town ·
  Bonds · Farm · Format.
- **Reviews:** every Review panel writes the owner's verdict (liked, rework, question, a note) to the private
  `content/story/reviews.json`, which the next writing session reads first.
- **Safety:** binds to 127.0.0.1, refuses other hosts, a same-origin content policy, images served only when the pack
  lists them, and the only write is the reviews file, from the page itself.
- **Tests:** `lib/model.test.mjs` and `lib/pack.test.mjs` (invented records), part of `pnpm test`; the domain's
  `story/authored.test.ts` tests the format on the stand-in.

`UMA_FARM_STORY_PORT` changes the port, `UMA_FARM_STORY` the drafts' folder, `UMA_FARM_CONTENT` the private one, and
`UMA_QUEST_STORIES` where the pack import reads from.
