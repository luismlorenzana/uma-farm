# F96 — The launch cast: the Ranker's Tier 1–5

**uma-farm · Claude · S · Needs: — · [The cast and the story pack](../../game-mechanics.md#the-cast-and-the-story-pack)**

> The game opens with 50 Umas, the Uma Ranker's Tier 1–5. Only they are in town, on the People page, met, on the calendar
> and in the romance. Later releases add sets of Umas as release packs (the roadmap's note).

## Why

The owner (2026-11-17): "I'm downsizing a bit this initial release, where I want us to consider only 50 Umas available
in the game based on the latest Ranker information … The current full List is Tier 1- Tier 5 from the ranker, those are
the only Umas that should be visible/present in the game." Today the cast is the story's, which holds 100 Umas (Tiers
1–10); without a story, it's every character in master data.

## Decided

1. **The 50:** the live Ranker plan (`gs://uma-platform-content/ranker/plan.json`, generated 2026-11-16, profiles
   revision 6): its `identities` whose `tier` is `T1`–`T5`.
   - That's 44 characters and 6 sisters (`s<outfitId>`, as the farm's ids already are).
   - They're kept as ids only, no names, in `packages/domain/src/story/launch.ts` (`LAUNCH_CAST`, in the Ranker's
     order).
   - The three Umas on the owner's farm are all in Tier 1.
2. **Applied where the app forms its cast** (`loadStoryPack`):
   - the story's cast, else master data's placeholder cast, is kept to the 50, in the pack's own order;
   - the story pack keeps all 100, and the story session keeps writing what it likes;
   - the game reads only these 50;
   - the invented stand-in pack, used by tests and `VITE_FARM_STORY=stand-in`, is left whole.
3. **An Uma already on a farm's roster stays** (`withCast`): a save grows in place.
4. **The town's 14 people keep their posts.** They're the town's roles (the shopkeeper, the mayor and the rest), not
   the romance cast; 10 of them are Umas the Ranker leaves out of its playable tiers.
5. **Everything that reads the cast reads the 50:** the town and People, meeting her, the calendar's birthdays and
   occasions, ties, and the story's status in the game. A tie with an Uma outside the 50 never shows, because she's never
   met.
6. **Release packs are a later step** (the roadmap's "Later: release packs"). How a pack is defined, published and opened
   on a farm already playing is worked out when it starts.

## Do

1. Add `LAUNCH_CAST` and a pure `launchCast(pack, ids)`, which keeps the cast to the ids, in the pack's order. Apply it in
   `loadStoryPack` after `storyOf`, before the roster's `withCast`.
2. Tests with invented ids:
   - the cast is kept to the list;
   - the order is the pack's;
   - a roster Uma outside the list stays;
   - the town's people are untouched.
3. **Docs:**
   - [The game mechanics](../../game-mechanics.md): the cast's section gets "the launch cast";
   - [the story pack](../../story-pack.md): the game plays the launch cast's Umas;
   - the roadmap (the cast row, and "Later: release packs") and [the handoff](../README.md);
   - every page, with `pnpm docs:update`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- **A local run:** People lists 50 Umas and the town's people.
- **The owner's phone look:** the People page lists 50 Umas.

## Deliver

Pushed to `main`; the packet deleted; the roadmap and the handoff updated.
