# F75 — The dialogue engine

**uma-farm · Claude · L · Needs: F74 · Unblocks: F76, every scene after · [Design](../../design/game-design.md#the-dialogue-engine)
· [Roadmap](../../roadmap.md#the-rework-2026-11-14): step 2**

> One engine plays every scene. Her bust is in the outfit the moment calls for, and her face changes with each line.
> It's built on the pilot's published kits, and Umas without art fall back to their master-data bust, then to F76's
> blank bust.

## Why

The owner: "a dialogue engine, that would render Umas busts with facial expressions according to the scene authoring";
"outfits for dialogue should be contextual to their location and activity"; "special events can have specific outfits".

## What's published

uma-platform's Farm Life art, in `gs://uma-platform-content/art/universes/farm-life/portraits/`, has the pilot's two
Umas:
- **`bases/<name>-<outfit>`:** 12 outfit portraits, 525×700, opaque. The outfits are spring, summer, fall, winter,
  swimsuit, kimono, dinner, wedding, farm-work, garden-party, pajamas-playful and wedding-night. The base's own face is
  neutral.
- **`faces/<name>-<expression>`:** 15 faces each, 224×224 with alpha: angry, determined, flustered, happy, laughing,
  loving, pouting, sad, shy, sleepy, surprised, tearful-joy, tender, thinking and worried.

## Decided

1. **Getting the art to the farm.** Send uma-platform the request it parked: a private family in master data's release,
   keyed by character, holding each portrait base and face. Each Uma's manifest gives where the face square sits on her
   bases.
   - The art session's manifest records that position. If it doesn't, uma-platform fits it once, by matching the face
     against the base.
   - farm-api already reads master data, so nothing new is needed in the cloud.
   - The bucket path above is the source, never git.
2. **One player for every scene:** meetings, talks, heart events, plays, pair talks, hangouts, dates, evenings, the
   household's scenes and festivals. The step formats stay as they are (`say`, `narrate`, `thought`, `choice`, `play`,
   …).
3. **A line's bust:**
   - the speaker's portrait base for the scene's outfit, with the face of the line's `emote` placed over it;
   - a line with no `emote` shows neutral;
   - the face swaps line by line without moving the base.
4. **Outfits by context:** the scene's own `outfit` when the story names one (the story already tags all 165 of the
   welcome five's scenes and 35 pair levels); otherwise the moment's, in this order:
   1. a wedding, then its night;
   2. a dinner;
   3. a festival night;
   4. a picnic, a tea or the spring festival: the garden party dress;
   5. a night in, or a night she can't sleep: pajamas;
   6. her work: farm-work;
   7. the summer shore: the swimsuit;
   8. else the day's season.

   The story's outfit ids (`season`, `spring`, `summer`, `autumn`, `winter`, `work`, `garden-party`, `kimono`, `dinner`,
   `wedding`, `wedding-night`, `pajamas`) map to the art's names (`fall`, `farm-work`, `pajamas-playful`).
5. **Fallbacks:**
   1. a face not drawn yet: its nearest, by [the expressions table](../../design/her-look.md#the-expressions), ending at
      the base's neutral;
   2. an outfit not drawn yet: spring;
   3. no kit for her: her master-data bust, without faces;
   4. after F76: her blank bust.
6. **Backdrops:** an optional place backdrop behind the bust. The look stays plain until art exists.
7. **Cached on the device by hash:** the next line's face is preloaded; reduced motion swaps the face without a fade.
8. **Occasion scenes the story wrote are played by** F79 (dinners, nights in, the wedding night) and F82 (New Year's,
   the festival nights, the flower show). This packet plays whatever they hand it.

## Do

1. The uma-platform request (decision 1). Build against the pilot's files from a local copy while it's in flight.
2. The domain: outfit by context, the outfit ids and their art names, and the face fallbacks, with tests.
3. The web: the one scene player in landscape, its bust compositor, the cache and preload; every scene moved onto it.
4. Update [the game mechanics](../../game-mechanics.md) and `docs/story-pack.md` (the outfit ids).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the main JS stays ≤ 180 KB gzip.
- The pilot's Umas show:
  - every face on every outfit;
  - the right outfit by context;
  - a scene's own outfit when the story names one.
- An Uma with no kit shows her master-data bust.
- **The owner's phone check:** "Meet the pilot's Umas and watch their faces and outfits change."

## Deliver

Branch `feat/f75-dialogue-engine` and a pull request; merge and deploy. In it:
- the packet deleted, with F70 and F71's art parts folded in;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the scene's layout in landscape: the bust's side, the text box, the choices;
- the swap's timing.
