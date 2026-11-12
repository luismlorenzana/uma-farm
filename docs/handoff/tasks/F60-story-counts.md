# F60 — The farm story's counts, the owner's read, the balance

**uma-farm · the story session (Claude), then the owner · S · Needs: F59 · Unblocks: layer 2 (F40), and the Farm book's
Counts page (uma-platform US4)**

> Written 2026-11-12 (D64) from uma-platform's
> [story.md](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/story.md) (its P141, calls AP57
> and AP69). It mirrors uma-quest's Q60.

## Why

Once every Uma is tagged and tied, the owner reads the counts and decides what to balance, before the bibles are
written around them.

## Context (read first)

- [F59](F59-tags-and-ties.md). uma-platform's
  [US1](https://github.com/luismlorenzana/uma-platform/blob/main/docs/handoff/tasks/US1-uma-story-shell.md), decision 6:
  the report's shape.
- `tools/story-sandbox/` (how it reads the domain's validator in place) and `story/authored.ts`.

## Decisions made

1. **`pnpm story:check`** (`scripts/story/check.mjs`) runs the domain's validator on `content/story/`, as the sandbox
   does, and writes the strict report to the private `content/story/checks.json` in uma-platform's report shape: each
   file's hash, every finding, each Uma's layer, and the counts. Uma Story's push and its Farm book read this file, so
   the game's rules stay in the game.
2. **The counts:** Umas per calling, favourite line, season, festival and loved good; arrivals by kind; ties an Uma,
   the least tied first; and, once bibles exist, every liked and disliked good with the Umas behind it, pair
   conversations written against RS12's two an Uma, and events scripted of 27 an Uma.
3. **A short private summary** of what looks unbalanced, with a recommendation each.
4. **Where the owner reads them:** the Farm book's Counts page once uma-platform's US4 is live; until then the summary
   and the sandbox.
5. **The balance comes after the read:** retags, new ties. No quotas before.

## Do

1. The script, with tests on the stand-in pack (in `pnpm test`); `package.json` and AGENTS.md's commands gain it.
2. Run it on the private pack; write the summary.
3. Ask the owner in one line to read the counts; apply the answer; then layer 2.

## Done when

- `pnpm story:check` writes the report for the stand-in and for the private pack, and the same inputs give the same
  file.
- The owner has read the counts, and the tag sheet and ties hold the answer.
- `pnpm lint`, `pnpm test` and `pnpm build` pass; the private-content guard passes.

## Deliver

The script by pull request to `main`; the report and the summary never committed. Delete this packet, add a Done row in
[the handoff](../README.md), log the D-decision (fetch `main` first), and go on to F40's layer 2.

## Rules that hold

F40's: no original-game content in git; scoped gcloud, never `gcloud config set`.
