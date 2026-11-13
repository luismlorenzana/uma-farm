# F60 — The farm story's counts, the owner's read, the balance

**uma-farm · the story session (Claude), then the owner · S · Needs: the tag sheet and the ties' sources · Unblocks:
layer 2's next waves ([F40](F40-story-authoring.md))**

> The counts are a page in the Farm Story Sandbox, where the owner reviews. No report file is written for uma-platform.

## Why

Once every Uma is tagged and tied, the owner reads the counts and decides what to balance, before the bibles are
written around them.

## Context (read first)

- The tag sheet, `content/story/tags.json` (each Uma's favourite line, season, festival and loved gift, a reason each),
  and each tie's source (`real` or `story`) in `ties.json`.
- `tools/story-sandbox/` (`lib/model.mjs`, `lib/counts.mjs`, `public/views.js`, and how it reads the domain's validator
  in place) and `story/authored.ts`.

## Decisions made

1. **A Counts page in the Farm Story Sandbox,** built from what it already reads (the cast, the tag sheet, the ties,
   and the bibles and routes as they come). No new file.
2. **The counts,** each listing the Umas behind it: Umas per calling, favourite line, season, festival and loved good;
   arrivals by kind; ties an Uma, the least tied first; and, once bibles exist, every liked and disliked good, pair
   conversations written against F40's RS12 (two an Uma), and events scripted of 27 an Uma.
3. **A short private summary** of what looks unbalanced, with a recommendation each.
4. **The balance comes after the read:** retags, new ties. No quotas before.
5. **One read, three parts.** The owner asked for layer 2's first wave before reading the counts, so the counts, layer
   1 and that first wave are read together, and any balance the read asks for applies to all three.

## Do

1. The page and its model function, with tests on invented records (in `pnpm test`). Built.
2. Open it on the private pack; write the summary. Written.
3. Ask the owner in one line to read the Counts page (with layer 1 and the first wave); apply the answer; then go on
   with layer 2.

## Done when

- The Counts page shows every count with the Umas behind it, on the stand-in and on the private pack.
- The owner has read it, and the tag sheet and ties hold the answer.
- `pnpm lint`, `pnpm test` and `pnpm build` pass; the private-content guard passes.

## Deliver

The page is in git; the summary is never committed. Once the owner's answer is applied: delete this packet and take its
rows out of [the handoff](../README.md), say in the commit what the read changed (ids and counts only, no names), and
go on with F40's layer 2.

## Rules that hold

F40's: no original-game content in git; scoped gcloud, never `gcloud config set`.
