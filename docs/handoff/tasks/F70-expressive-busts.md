# F70 — Busts that change expression

**uma-farm · Claude · M · Needs: F69's pilot published (uma-platform's bust family) · Unblocks: F71 · Design:
[her-look.md](../../design/her-look.md#busts-that-change-expression)**

> The game puts an expression's face over her outfit's bust. The story's `emote` picks the face, and every missing
> piece falls back.

## Why

Scenes show one still bust per outfit. The owner wants dialogue and romance events to show her feelings, on whatever
she's wearing.

## Decided

1. **Reading the art:**
   - the busts and faces come from master data's private release, uma-platform's bust family (F69's delivery), keyed by
     character;
   - the format (how her busts and faces are listed, and where a face sits) is settled with uma-platform once the
     pilot's pictures are in Uma Character Art;
   - no name or art enters git.
2. **Composing:**
   - the outfit's bust, with the expression's face placed over it;
   - a changed expression swaps only the face;
   - both are cached on the device by hash, and the next line's face is preloaded.
3. **The emote menu grows to the 22 expressions:**
   - the story's eight keep their names;
   - `docs/story-pack.md` lists them all, with what each looks like;
   - an unknown name shows its word as today.
4. **Fallbacks, in order:**
   1. the expression's fallback chain ([the table](../../design/her-look.md#the-expressions)), ending at the bust's own
      neutral face;
   2. no bust for that outfit: her own outfit's bust;
   3. none for her at all: her single master-data bust;
   4. no bust: her lettered disc.
5. **Her outfit:** `own` until F71 picks one.
6. **Reduced motion:** the face swaps without a fade.

## Do

1. **Settle the format with the owner and uma-platform** from the pilot's pictures in Uma Character Art (the
   `dialogue-busts` collection), then send uma-platform the request for the bust family. Its earlier draft is parked,
   ready to build from.
2. **The domain:** the 22 expressions, their fallback chains, and the pack's `emote` menu, with tests.
3. **The web:** the composed bust in the scene, event and pair players, its cache and preload.
4. [The game mechanics](../../game-mechanics.md) and `docs/story-pack.md`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip (the compositor loads with the
  players).
- With the pilot's busts and faces, a scene shows each drawn expression on every outfit, and a missing face falls
  back.
- An Uma with none shows her single bust, as today.

## Deliver

Branch `feat/f70-expressive-busts` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the swap's timing;
- the bust's size on each screen.
