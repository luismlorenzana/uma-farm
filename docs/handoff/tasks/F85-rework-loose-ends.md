# F85 — The rework's loose ends

**uma-farm · Claude · M · Needs: F79, F80, F83 (all in) · [Design](../../design/game-design.md) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14)**

> What the rework's pieces left half done: the ranch's and the Mine's Umas get their perks, her invitation to work and
> married life's second and fourth levels play a scene, and the farm's eggs and milk take their icons once uma-art draws
> them.

## Why

Each rework piece shipped with a short "left open" list. These are the ones that belong to the rework itself, not to a
later phase:
- F83 built the Coop, the Barn, the Mine and the Quarry, but a ranch or mining Uma's line perks still read "Not yet: its
  line's perks come later" ([her perks](../../game-mechanics.md)).
- F79's invitation to work has her say one line and no scene.
- Spouse levels 2 and 4 come at night with no event, though a route or the default story may write `s2` and `s4`.
- F83 draws the four new goods (Egg, Milk, Duck Egg, Goat Milk) in code until uma-art has them; uma-platform has been
  asked.

## Decided

1. **The ranch's and mining's perks act,** as the perk table already words them:
   - Mining (the Mine): her haul ×1.1 and her Smelter batch ×1.1; the morning item is one ore from her deepest floor;
     her signature dish's grade is a ★2+ ore.
   - Mining (the Quarry): the same with stone or gems and the Cutter.
   - The ranch: her building's animals have a +10% chance of an extra good; +5 fondness to her building's animals at
     night; a ★2+ egg, milk or fleece as her signature.
   - "Her line" is the task she's set to on the work board (F80), or the place she works, whichever the other lines use
     today. The table's "Not yet" rows become live rows.
2. **The invitation to work plays a scene:** the story's `invited-to-work` event in her route, else the default story's
   (written here, a short scene in her everyday outfit at the farm gate). It plays when you invite her, after the action
   is spent.
3. **Spouse levels 2 and 4 play their events when written:** when her route (or the default story) has `s2` or `s4`, the
   morning's night-level card plays it in place of "Her bar filled overnight: no event". The default story writes both.
   Without one, the card stays as built.
4. **The eggs' and milk's icons:** when uma-platform replies with the uma-art version and the frames, pin it and draw
   them from the atlas; the frames test that waits for them turns green. If the reply hasn't come when the rest is
   done, ship without it and leave this one line in the handoff.

## Do

1. The domain: the perks (tests per line), the invitation's scene lookup and the default's scene, the night levels'
   events, with tests.
2. The web: the invitation's scene, and the night-level card's scene.
3. Update [the game mechanics](../../game-mechanics.md) (the perk table, her life's events, the default story) and
   `docs/story-pack.md` (the `invited-to-work` event on the menu).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- A ranch Uma's building gives extra goods, a mining Uma's haul is larger, and the perk table shows no "Not yet" row for
  a line whose place stands.
- Inviting her to work plays a scene; Spouse 2 plays the default's `s2` from the morning.

## Deliver

Branch `feat/f85-rework-loose-ends` and a pull request; merge and deploy. In it:
- the packet deleted;
- [the handoff](../README.md) updated.

## Left to the worker

- the default scenes' words;
- where the extra good shows in the morning's ranch line.
