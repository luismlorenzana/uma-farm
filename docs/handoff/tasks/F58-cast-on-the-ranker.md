# F58 — The farm's cast on the Ranker

**uma-farm · the story session (Claude) · S · Needs: nothing · Unblocks: F59, and the owner's read of layer 1 ·
Content: private, in the ignored `content/story/`**

> Written 2026-11-12 (D64) from uma-platform's
> [story.md](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/story.md) (its P141, calls AP63
> and AP71). It mirrors uma-quest's Q57.

## Why

F40's cast was read from the Studio's SS export of 2026-11-09. The Studio's boards have since retired into the Uma
Ranker (uma-platform P131), where the owner ranked every Uma on ten tiers, and uma-quest's story cast now comes from it.
F40 asks for the owner's priority Umas first, "from the SS tier's order on the Studio's board" (D44). That board is
gone: the Ranker's order is the priority now.

## Context (read first)

- [F40](F40-story-authoring.md): RS1, RS13, RS17 and D44's note. [F56](F56-story-delivery.md), decision 12.
- uma-platform's [story.md](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/story.md) and
  [platform-app](https://github.com/luismlorenzana/uma-platform/blob/main/docs/platform-app/README.md) (AP25–AP33: the
  ten tiers, the plan's `identities`). `pnpm ranker:pull` there writes the plan to its ignored `content/authoring/`.
- The private `content/story/cast.json` and `world.md`; the format, `packages/domain/src/story/authored.ts`.

## What the Ranker says today

Read on 2026-11-12, at the board's revision 337 and the profiles' revision 6:
- **All 20 cast Umas are in the ten tiers:** the whole of T1 (10), six of T2, and one each in T3, T4, T8 and T9.
- Every cast entry's outfit is her default outfit on the Ranker.
- The opening three are T1's fifth, eighth and tenth.
- Seven of the Ranker's 24 sisters are sisters of cast Umas. None is in the farm's cast.

## Decisions made

1. **The 20 stand.** Nobody is added or dropped: layer 1 is written around them, and the romance core is sized for 20
   (RM5). A larger cast is the romance spec's call, and the sisters wait (discussion only).
2. **The cast file records the Ranker:** `ranker: { boardRevision, profilesRevision, pulledAt }` beside `export`,
   optional in the format and checked by the validator when present.
3. **The authoring order is the Ranker's.** Bibles, arrival scenes and waves go T1 first, in the board's order. The
   arrival order stays the story's own.
4. **The opening three are re-checked:** the highest-ranked Uma of each of the three opening callings (farming,
   foraging, fishing; RS13), by the cast file's callings. If one moves, her arrival and the opening scene in `world.md`
   move with her.
5. **The pilot's three are re-checked:** the highest-ranked three that keep RS17's range (three callings, three
   favourite lines, at least one of the opening three).
6. **Each arrival scene is written with her bible,** in layer 2. F56's release refuses a pack where any cast Uma lacks
   her bible or her arrival scene, so the go-live needs all 20 of both, and none of the pilot's full routes.
7. **Pictures and the sandbox stay as they are** until uma-platform's Farm book is live (its US4).

## Do

1. Pull the Ranker's plan, read only, and note its revisions.
2. **In git** (a branch and a pull request, as F40's Deliver): the optional `ranker` field in the format and the
   validator, on the stand-in cast, with tests.
3. **Private:** `cast.json` gains `ranker`; apply decisions 4 and 5, with one line of reason for each Uma that moves.
4. Run the sandbox's strict report; back up as F40 does.
5. Ask the owner in one line to read layer 1 in the Farm Story Sandbox.

## Done when

- `cast.json` records the Ranker's revisions and passes the validator; the opening three and the pilot's three each
  have their reason against the Ranker's order.
- `pnpm lint`, `pnpm test` and `pnpm build` pass; the private-content guard passes; no name in git.

## Deliver

The format by pull request to `main`; the content never committed. Delete this packet, add a Done row in
[the handoff](../README.md), log the D-decision (fetch `main` first), and go on to F59.

## Rules that hold

F40's: no original-game content in git (no names, no id tied to a name, nothing that quotes the private story); RS2, RS3
and RS4 in every line; scoped gcloud, never `gcloud config set`.
