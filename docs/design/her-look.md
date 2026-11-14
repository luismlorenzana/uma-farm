# Her look: outfits and expressions

**A plan, for the owner's go (2026-11-13).** Each Uma gets a wardrobe (her own outfit, four seasonal outfits, a kimono,
a dinner dress, a wedding dress and pajamas) and busts that change expression in dialogue. The bust is composed in the
game from layers: the outfit's body, her head, and an expression's face. The page view is
[her-look.html](../pages/her-look.html).

## What came in

### From the story session

| Asked | Where | When |
|---|---|---|
| The welcome list's five arrival scenes are written as Gate visits on mornings one to five; eleven Umas have their own trigger to meet | [F67](../handoff/tasks/F67-meeting-her.md) | With F67 |
| The town's people are all Umas from the Uma Ranker's NPC board, mapped role for role (14 roles); the town's six spots and each Uma's favourite spot come from the pack | [F66](../handoff/tasks/F66-the-town.md) | With F66 |
| The Ranker's 24 sisters (an outfit presented as her own character, id `s<outfitId>`) in the town, the cast and the ties | [F66](../handoff/tasks/F66-the-town.md) | With F66 |
| Ties may name one of the town's people (no bond, a line on both profiles) | [F66](../handoff/tasks/F66-the-town.md) | With F66 |
| Chapters gated on builds (the Mine, the Quarry, the Cutter, the Kitchen, the Restaurant, the Forge), and ids for the dock and the boat | [F64](../handoff/tasks/F64-farm-by-building.md) | With F64 |
| Group scenes for 10 families and 17 crews | [F40](../handoff/tasks/F40-story-authoring.md) | Later, with Phase 2's long game |

The story has a baseline for all 100 of the Ranker's characters: tags, a web of 257 ties, and 76 in the pack's cast with
thin bibles.

### From the character art

uma-platform's **Uma Character Art** (https://uma-platform.web.app/art) holds, for each Uma:
- master data's face, bust and chibi sprite set;
- the full-body 3D render (`outfit-renders`, 768×1024);
- the **universe looks**: ChatGPT's owner-approved pictures of an Uma in another world, Farm Life among them (18 looks
  published).

Two Umas have the new full character art, and bust-type art packets are on their way. This plan builds on that art: the
same style, cut to busts in layers.

### What the farm shows today

| Where | Art | Expressions |
|---|---|---|
| Cards, the HD-2D farm's standees, lists | Her face (`outfit-faces`) | — |
| Scenes, heart events, pair talks | Her bust (`outfit-busts`), one picture per outfit | None: the story's eight emotes (happy, shy, sad, angry, surprised, thinking, laughing, tender) show as words |
| The HD-2D farm | Her chibi sprite set | The sprite's own actions |

## Her wardrobe

| Outfit | Shows in | Default rule |
|---|---|---|
| **Her own** | Everything, and always on the HD-2D farm's sprites | When nothing else applies, or when the outfit asked for isn't drawn yet |
| **Spring, summer, autumn, winter** | Daytime scenes, talks and heart events | The season of the day |
| **Kimono** | Festival nights, and the year's first day | Festival night in summer and winter (the Fishing Derby's and the Harvest Cup's nights), and New Year's visit. The story may name other days |
| **Dinner dress** | "Dinner in town", a new date kind; the proposal if the story sets it at dinner; anniversary dinners | Dinner in town opens with Romance 3 |
| **Wedding dress** | The wedding, its replay in Memories, the first anniversary's scene | Always at the wedding |
| **Pajamas** | "A night in", a new evening kind for night visits; the household's night scenes | A night in opens with Romance 6, and at home once married. Tender, never explicit |

- **What a scene wears:** the scene's own choice if the story names one (`outfit` on an event or scene); else the
  default rule above; else her own outfit.
- **Placeholders hold:** an outfit not yet drawn for her shows her own bust, so a story can use an outfit before its art
  exists.
- **The sprites stay as they are:** her chibi set is her own outfit everywhere on the HD-2D farm. Seasonal sprite sets
  would multiply the heaviest art for little gain; it's a later choice, if ever.
- **Her profile:** a Wardrobe row shows the outfits drawn for her, and which one she's wearing today.

## Busts that change expression

### The layers

A bust is six layers, back to front. Every layer is a full canvas, already in place, so the game only stacks them.

| # | Layer | One per | Holds |
|---|---|---|---|
| 1 | `back` (optional) | Outfit | What sits behind her: a veil's back, a hood, hair ornaments behind the head |
| 2 | `body` | Outfit | Shoulders, chest, arms and neck, in that outfit |
| 3 | `head` | Uma, or an outfit that restyles her hair | Her face's skin and nose, the back of her hair, and her ears: **no eyes, brows or mouth** |
| 4 | `face` | Uma × expression | Eyes, brows, mouth, and the expression's marks: blush, tears, sweat |
| 5 | `hair` | Uma, or an outfit that restyles her hair | Her bangs and the locks that fall over her face, so they sit over the eyes and brows |
| 6 | `front` (optional) | Outfit | What sits over her hair: a hat, a kanzashi, a veil's front, a nightcap |

- **One head pose per Uma:** the head never moves between outfits or expressions, so every face fits every body. Only
  the body below the neck changes with the outfit.
- **An outfit may restyle her hair** (an updo for the kimono, loose hair for pajamas) with its own `head` and `hair`,
  drawn in the same pose, so the faces still fit.
- **The game composes them:** it stacks the layers, caches the result by its parts' hashes, and swaps only the face when
  the expression changes. Any missing layer falls back: no `face` for that expression means her nearest one (the table
  below), and no layers at all means her single master-data bust.

### The expressions

Eighteen, in three sets. **Core** is needed for every Uma who speaks; **romance** for every Uma with a route; **extra**
comes later. The story's `emote` names them, and an unknown or undrawn one shows its fallback.

| Expression | Looks like | Used for | Falls back to | Set |
|---|---|---|---|---|
| `neutral` | Calm, mouth relaxed | Plain talk, the default | — | Core |
| `happy` | Warm smile, eyes open | Greetings, good news, gifts liked | `neutral` | Core |
| `laughing` | Eyes closed in a smile, mouth open | Jokes, festival fun | `happy` | Core |
| `surprised` | Eyes wide, brows up, mouth open | News, gifts, reveals | `neutral` | Core |
| `thinking` | Eyes aside, mouth small | Plans, puzzles, choices | `neutral` | Core |
| `sad` | Brows up and in, eyes down, mouth down | Bad news, missing someone | `neutral` | Core |
| `angry` | Brows down, a frown | Rivalry, a wrong done | `neutral` | Core |
| `worried` | Uneasy brows, small sweat drop | Nerves, a hard day, races | `sad` | Core |
| `determined` | Focused eyes, a set smile | Work, races, a promise | `happy` | Core |
| `pout` | Puffed cheek, eyes aside | Playful annoyance, teasing back | `angry` | Core |
| `shy` | Eyes averted, light blush | Compliments, first dates | `happy` | Romance |
| `tender` | Soft eyes, small smile, light blush | Quiet moments, evenings | `happy` | Romance |
| `flustered` | Deep blush, wavy mouth, eyes darting | The confession, a near kiss | `shy` | Romance |
| `loving` | Half-lidded soft eyes, warm smile, blush | Saying yes, after the confession, married life | `tender` | Romance |
| `tearful-joy` | Happy tears, smiling | The proposal, the wedding | `loving` | Romance |
| `sleepy` | Half-closed eyes, a yawn or small smile | Night visits, early mornings | `tender` | Romance |
| `crying` | Tears, brows up | Real sorrow, farewells | `sad` | Extra |
| `teasing` | One eye closed (a wink), a sly smile | Flirting, tricks | `happy` | Extra |

Optional later, per expression: a `-talk` face with the mouth open, for a talking flap, and a `blink` face shared by all.

### What one Uma needs

| Piece | Count |
|---|---|
| `head` and `hair` | 1 each, plus any outfit's restyled hair |
| `face` | 10 core, 6 romance, 2 extra: 18 |
| Outfit layers (`body`, and `back`/`front` where needed) | Her own, four seasons, kimono, dinner dress, wedding dress, pajamas: 9 outfits |

**Order:**
1. the two Umas with the new full art, as the pilot that sets the spec;
2. the welcome list's five;
3. the rest in the Uma Ranker's order.

Core faces and her own outfit come first for each, then the seasons, then the special outfits.

## The work

| Packet | What | Who |
|---|---|---|
| [F69](../handoff/tasks/F69-bust-art-spec.md) | **The bust art spec:** layers, canvas, alignment, the 18 expressions, the 9 outfits, file names, delivery, the pilot | ChatGPT (character art) |
| uma-platform request | **A private art family for bust layers,** delivered like the sprite sets: in master data's private release, keyed by character and outfit, names never in git | uma-platform session, on the owner's go |
| [F70](../handoff/tasks/F70-expressive-busts.md) | **Busts that change expression:** the game composes the layers, the story's `emote` picks the face, every fallback | Claude |
| [F71](../handoff/tasks/F71-her-wardrobe.md) | **Her wardrobe:** the outfit rules, the scene's `outfit`, the two new evening kinds (Dinner in town, A night in), the profile's Wardrobe | Claude |

**Order:**
- F69 can start now with the pilot, and the uma-platform request goes with it;
- F70 follows once the pilot's layers are published;
- F71 follows F68 and F70.

**For the story:**
- the `emote` menu grows to the 18 expressions;
- a scene or event may name an `outfit`;
- night visits and dinner dates become evening scenes the story can write.

The owner cross-references the outfits with the story, so each has scenes to show it.
