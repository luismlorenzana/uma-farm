# F71 — Her wardrobe

**uma-farm · Claude · M · Needs: F68, F70 · Design: [her-look.md](../../design/her-look.md#her-wardrobe)**

> Each Uma has four seasonal outfits (spring her default), a kimono, a dinner dress, a wedding dress and pajamas. The
> occasion picks what a scene shows, the story can choose, and an outfit not drawn yet falls back to spring.

## Why

The owner wants seasonal outfits, special-event outfits (a kimono, a fancy dinner, a wedding dress) and pajamas for night
visits, with story content for each.

## Decided

1. **The outfits:** `spring` (her default), `summer`, `autumn`, `winter`, `kimono`, `dinner`, `wedding` and `pajamas`.
2. **What a scene wears:**
   1. the story's `outfit` on the event or scene, if it names one;
   2. else the occasion:

      | Occasion | Outfit |
      |---|---|
      | Daytime | The season's outfit |
      | Festival nights in summer and winter, and the year's first day | Kimono |
      | Dinner in town | Dinner |
      | The wedding, its replay, the first anniversary's scene | Wedding |
      | A night in, and the household's night scenes | Pajamas |

   3. else `spring`;
   4. an outfit with no bust drawn for her falls back to `spring`.
3. **Two new evening kinds:**
   - **Dinner in town:** a date, from Romance 3; plays as Pick; her invitation is "Dinner in town tonight?"
   - **A night in:** a date, from Romance 6, and at home once married; plays as a scene, not a game; tender, never
     explicit.

   Both go on [the evening's table](../../game-mechanics.md#the-evening) with their points, like the others.
4. **The HD-2D farm's sprites stay as they are:** her chibi set from master data.
5. **Her profile gains a Wardrobe row:** the outfits drawn for her, and today's.
6. **The pack's menu gains `outfit`** on events and scenes, and the two new evening kinds' scenes, all optional.

## Do

1. The domain: the outfit rule, the two evening kinds, and the pack's `outfit`, with tests.
2. The web: the scene, event and evening players pass the outfit to F70's bust, plus the profile's Wardrobe row.
3. [The game mechanics](../../game-mechanics.md) and `docs/story-pack.md`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- With the pilot's busts:
  - a summer day's talk shows her summer outfit;
  - a summer festival night shows the kimono;
  - Dinner in town shows the dinner dress;
  - the wedding shows the wedding dress;
  - A night in shows pajamas;
  - an outfit not drawn falls back to spring.

## Deliver

Branch `feat/f71-her-wardrobe` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the evening kinds' points, within the evening's balance;
- the Wardrobe row's look.
