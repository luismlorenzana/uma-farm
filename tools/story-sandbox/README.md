# Farm Story Sandbox

A local page for reading, playing and reviewing uma-farm's story: the authored cast, their ties and routes (the
romance), and the chapters' scenes. It is the farm's sibling of uma-quest's Story Sandbox
(`../uma-quest/tools/story-sandbox/`).

```bash
pnpm stories:import-pack   # the Umas' faces and art, from uma-quest's cast pack (once per Studio export)
pnpm stories               # http://127.0.0.1:4321
```

- **No dependencies:** Node 22's `http` and the page as plain modules. `pnpm stories` passes `--experimental-strip-types`
  so the sandbox reads `@farm/domain` in place (Node 22.18 and later need no flag).
- **What it reads, on every request** (edit a file, come back to the page):
  - **The authored story, private, in the ignored `content/story/`:** `world.md`, `cast.json`, `ties.json`, `tags.json`
    (the tag sheet), `umas/<id>.json`, `routes/<id>.json`, `pairs/<a>-<b>.json` and `household.json`, every one optional,
    read by the game's own reader (`story/pack.ts`'s `readStoryPack`, as the game and the release read it), and
    `pack/<id>/` for the Umas' pictures. [`docs/story-pack.md`](../../docs/story-pack.md) is the menu of what it reads.
  - **Two kinds of findings, each with a count:** **errors**, only what the game can't read, each skipping the one part
    it's in (the rest plays); and **notes**, everything else (what isn't written yet and what plays instead, unusual
    counts, the line rules, a bible and her tags disagreeing). Nothing blocks writing, reading or releasing.
  - **The chapter drafts, original and in git:** `docs/story/chapters/chapter-<n>.json` (the town's scenes in the game's
    `Beat` shape), `beats.json` and `conversations.json` (the story-beat and conversation templates, the fallback for
    pairs without an authored conversation).
  - **The game's story as built:** `story/cast.ts`, every `story/chapter-*.ts`, the places, temperaments and activities.
- **Pages:** Characters (the cast in its order, the pack's errors and notes, the welcome list marked) · each Uma (her
  paragraph, her tags with their reasons, **In the game**: every part the game reads of her, marked written or
  placeholder with what plays instead (the domain's `writtenOf`), her trigger to meet and her chapters, the pack's or the
  defaults, her route as a 27-rung ladder with how much is scripted, her bible, her ties and their sources, and her
  errors and notes) · Relationships (the ties as a ring
  and a table) · Counts (callings, favourite lines, seasons, festivals, loved goods, arrivals, ties an Uma, and as
  the layers fill, gifts, pairs and scripted events, each with its Umas; `lib/counts.mjs`) · World (the world bible) ·
  Chapters and their scene player · Town · Bonds · Farm · Format.
- **Reviews:** every Review panel writes the owner's verdict (liked, rework, question, a note) to the private
  `content/story/reviews.json`, which the next writing session reads first.
- **Safety:** binds to 127.0.0.1, refuses other hosts, a same-origin content policy, images served only when the pack
  lists them, and the only write is the reviews file, from the page itself.
- **Tests:** `lib/model.test.mjs`, `lib/pack.test.mjs` and `lib/counts.test.mjs` (invented records), part of `pnpm test`; the
  domain's `story/authored.test.ts` and `story/pack.test.ts` test the reader on the stand-in and invented casts.

`UMA_FARM_STORY_PORT` changes the port, `UMA_FARM_STORY` the drafts' folder, `UMA_FARM_CONTENT` the private one, and
`UMA_QUEST_STORIES` where the pack import reads from.
