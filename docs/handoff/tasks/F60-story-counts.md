# F60 — The farm story's counts, the owner's read, the balance

**uma-farm · the story session (Claude), then the owner · S · Needs: F59 · Unblocks: layer 2 (F40)**

> Written 2026-11-12 (D64). It mirrors uma-quest's Q60.
>
> **Amended 2026-11-12 (D72, local first):** the counts are a page in the Farm Story Sandbox, where the owner reviews.
> No report file is written for uma-platform.

## Why

Once every Uma is tagged and tied, the owner reads the counts and decides what to balance, before the bibles are
written around them.

## Context (read first)

- [F59](F59-tags-and-ties.md): the tag sheet and each tie's source.
- `tools/story-sandbox/` (`lib/model.mjs`, `public/views.js`, and how it reads the domain's validator in place) and
  `story/authored.ts`.

## Decisions made

1. **A Counts page in the Farm Story Sandbox,** built from what it already reads (the cast, the tag sheet, the ties,
   and the bibles and routes as they come). No new file.
2. **The counts,** each listing the Umas behind it: Umas per calling, favourite line, season, festival and loved good;
   arrivals by kind; ties an Uma, the least tied first; and, once bibles exist, every liked and disliked good, pair
   conversations written against RS12's two an Uma, and events scripted of 27 an Uma.
3. **A short private summary** of what looks unbalanced, with a recommendation each.
4. **The balance comes after the read:** retags, new ties. No quotas before.

## Do

1. The page and its model function, with tests on invented records (in `pnpm test`).
2. Open it on the private pack; write the summary.
3. Ask the owner in one line to read the Counts page; apply the answer; then layer 2.

## Done when

- The Counts page shows every count with the Umas behind it, on the stand-in and on the private pack.
- The owner has read it, and the tag sheet and ties hold the answer.
- `pnpm lint`, `pnpm test` and `pnpm build` pass; the private-content guard passes.

## Deliver

The page by pull request to `main`; the summary never committed. Delete this packet, add a Done row in
[the handoff](../README.md), log the D-decision (fetch `main` first), and go on to F40's layer 2.

## Rules that hold

F40's: no original-game content in git; scoped gcloud, never `gcloud config set`.
