# F68 — Her chapters

**uma-farm · Claude · M · Needs: F63, F67 · Unblocks: the workshops · [Roadmap](../../roadmap.md#phase-1-one-game-built-around-the-umas):
Phase 1, step 1.8 · Design: [progression.md](../../design/progression.md#her-chapters)**

> Each Uma's story is hers, in her own chapters, from the day you meet her to married life. There's no farm-wide story.

## Why

The owner's call (2026-11-13): focus on the Umas' individual stories, each with its own chapters to follow through.

## Decided

1. **Her chapters come from the story:**
   - how many there are, their titles, and which of her events each holds;
   - all optional (F61);
   - with none given, the four default chapters (F63): "Getting to know her", "Together", "The wedding", "Married life".
2. **The backbone stays as built:**
   - friendship F1–F10, then the confession;
   - romance R1–R10, then the proposal and the wedding;
   - married life S1–S5;
   - the points, the perks and the evenings along the way.

   A chapter groups her events along it. A chapter opens when its first event can play.
3. **A chapter may ask the farm for something,** if the story gives it a gate from the trigger menu (F67): a place built,
   a Farm Rank, a good shipped, a season or a festival. Until the gate holds, her events in that chapter wait. Her
   profile shows what's needed: "Opens when the Kitchen is built".
4. **Where you see it:**
   - **her profile:** her chapters, the one she's in, its events played and to come, and what opens the next;
   - **the Hearts tab:** each Uma's chapter at a glance;
   - **the morning:** "A new chapter with *Name*" the day one opens.
5. **Her ending:** her last chapter closes in married life. The household's scenes go on after it.
6. **The save:** none new. Her chapter is worked out from her route and the gates.

## Do

1. The domain: chapters from the pack or the defaults, the gates, and which chapter she's in, with tests.
2. The web: the profile's chapters, the Hearts tab's chapter, and the morning's line.
3. [The game mechanics](../../game-mechanics.md): "her chapters" in the romance part.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- With no pack, she shows the four default chapters.
- With a pack giving her six chapters and a Kitchen gate on the third, she shows six, and the third waits until the
  Kitchen is built.

## Deliver

Branch `feat/f68-her-chapters` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the chapter list's look on her profile, within uma-kit;
- the morning line's words.
