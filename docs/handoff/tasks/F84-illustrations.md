# F84 — Illustrations: her big moments, full screen

**uma-farm · Claude · M · Needs: F79 · [Design](../../design/game-design.md#the-dialogue-engine) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14)**

> At her big moments the scene opens onto a full-screen illustration in landscape: meeting her, a day at the beach, the
> confession, the wedding, the wedding night, a quiet evening in. Each one you've seen is kept in a gallery on her
> profile.

## Why

The art session has finished the first Uma's illustrations: nine landscape scenes, 1672×941, owner-approved and
published in Uma Character Art's Farm Life universe, as its new "splash" kind (uma-platform P175). The owner wants them
in the game.

| Scene | Her outfit | Its moment |
|---|---|---|
| Greeting at the farm | Spring | Meeting her |
| A day at the beach (sunbathing) | Swimsuit | A summer date at the shore |
| The confession: flustered, then loving | Kimono | Her confession: the question, then her answer |
| The wedding: tearful joy | Wedding | The wedding |
| The wedding night: two scenes | Wedding night | The wedding night, as it begins and as it fades |
| A quiet evening in | Pajamas | A night in |
| Pajamas: a recline | Pajamas | The night's companion, the night before her morning greeting |

## Decided

1. **Getting the art to the farm:**
   - ask uma-platform to carry the illustrations in master data's private release, as it did the portraits;
   - a family, for example `illustrations`, keyed by character id;
   - each with its id, title, outfit and **moment** (`meeting`, `beach`, `confession`, `confession-yes`, `wedding`,
     `wedding-night`, `wedding-night-end`, `night-in`, `companion`, open for more);
   - never in git; farm-api already reads master data.
2. **A scene shows an illustration** in either case:
   - **the story names one:** a step `illustration: <id>` (a new pack field on the menu);
   - **by default:** the scene's moment matches one of hers. The default mapping:
     - her meeting scene opens on `meeting`;
     - a summer date at the shore opens on `beach`;
     - her confession shows `confession` at the question and `confession-yes` after her yes;
     - the wedding shows `wedding`;
     - the wedding night shows `wedding-night`, then `wedding-night-end` as it fades;
     - a night in shows `night-in`;
     - the night's companion shows `companion` before the morning greeting.
3. **How it shows:**
   - full screen in landscape, the text box over its lower edge, no bust while it's up;
   - a tap advances the lines as usual;
   - it fades in and out, and simply swaps under reduced motion;
   - tender, never explicit: the owner approved every scene.
4. **Her gallery:** an illustration you've seen is unlocked for good. Her profile gets a **Gallery** of her unlocked
   ones (the rest show as locked silhouettes with their titles), each one opening full screen. The save keeps the ids
   seen.
5. **Without illustrations** for her, scenes play as they do now: bust and face.
6. **Lean:** each illustration loads only when its scene starts, and is cached on the device by hash.

## Do

1. The uma-platform request (decision 1).
2. The domain: the moments, the default mapping, the pack's `illustration` step, and the gallery's unlocks, with tests.
3. The web: the full-screen illustration in F75's engine, and the gallery on her profile.
4. Update [the game mechanics](../../game-mechanics.md) and `docs/story-pack.md`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- With the first Uma's illustrations:
  - her meeting opens on the greeting;
  - her confession shows both moods;
  - the wedding and the wedding night show theirs;
  - each then appears in her gallery.
- An Uma without illustrations plays as before.

## Deliver

Branch `feat/f84-illustrations` and a pull request; merge and deploy. In it:
- the packet deleted;
- [the handoff](../README.md) updated.

## Left to the worker

- the text box's look over an illustration;
- the gallery's layout.
