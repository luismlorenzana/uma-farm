# F59 — The farm's tag sheet, and its ties on the cast book

**uma-farm · the story session (Claude) · M · Needs: F58; uma-platform's US2 for the tie pointers · Unblocks: F60, then
layer 2 · Content: private, in the ignored `content/story/`**

> Written 2026-11-12 (D64) from uma-platform's
> [story.md](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/story.md) (its P141, calls AP65,
> AP66 and AP70). It mirrors uma-quest's Q58 and Q59.

## Why

uma-quest tags every Uma before it writes her story, then counts the tags and balances. The farm's like for like is
small and worth doing before 20 bibles are written: each Uma's favourite line, season, festival and loved gift decide
where her events happen and what the player brings her. Seen on one screen first, a crowded line or a gift five Umas
love is fixed in a minute, not in a rewrite.

The farm's 31 ties and uma-quest's crossings are drawn from the same real careers. uma-platform's Cast book (its US2)
will hold those real relationships once, with their facts checked; the farm's ties point at them.

## Context (read first)

- [F40](F40-story-authoring.md): RS5, RS10, RS11, RS12 and the formats. [goods.md](../../game/goods.md) for goods ids.
- uma-platform's [story.md](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/story.md), "The
  cast book" and "The mirror".
- The private `cast.json` (each Uma's calling: four Umas a calling today) and `ties.json`.

## Decisions made

1. **`content/story/tags.json`** (private), one entry a cast Uma: her **favourite line** (the bible's eight), her
   **season**, her **festival** and her **loved gift** (a goods id; a dish where it fits), each with a one-line reason
   from her career and her character. Her line fits her calling and her stats (RS10).
2. **Nothing is forced to a quota** before the counts (F60).
3. **The bibles carry the same values.** When an Uma has both, the validator checks her bible agrees with the sheet.
4. **Her personality isn't a farm tag.** It's read from the Cast book for her voice and her emotes. The game's
   temperament stays as built, from her stats (CS46).
5. **A tie says where it comes from:** `source: 'real' | 'story'`, and for a real one `from`, the Cast book's
   relationship id. Both are optional in the format. A real tie's fact is checked against public records. The line,
   the strength and the history stay the farm's own.
6. **Until the Cast book has ids,** ties carry `source` only; `from` is filled when US2 lands.
7. **Every Uma keeps at least two ties** (RS12's two closest). It holds today: two to four each.

## Do

1. **In git** (a branch and a pull request): the tag sheet's type and parser, the two optional tie fields, the
   bible-agrees check, on the stand-in pack, with tests.
2. **Private:** `tags.json` for all 20, in the Ranker's order; `ties.json` with `source` on every tie.
3. Run the strict report; back up as F40 does.

## Done when

- All 20 Umas have four tags with reasons; every tie has its source; the validator passes.
- `pnpm lint`, `pnpm test` and `pnpm build` pass; the private-content guard passes; no name or tag assignment in git.

## Deliver

The format by pull request to `main`; the content never committed. Delete this packet, add a Done row in
[the handoff](../README.md), log the D-decision (fetch `main` first), and go on to F60.

## Rules that hold

F40's: no original-game content in git; RS2, RS3 and RS4 in every line; gifts use goods ids that exist, and a new good
is a proposal, flagged, never invented silently.
