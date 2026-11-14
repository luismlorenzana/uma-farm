# Her look: outfits and expressions

**A plan, for the owner's go (2026-11-13).** Each Uma gets a wardrobe (four seasonal outfits, spring her default, a
kimono, a dinner dress, a wedding dress and pajamas) and busts that change expression in dialogue. ChatGPT draws a bust for each
outfit and a face for each expression; the game puts the face over the bust. The page view is
[her-look.html](../pages/her-look.html).

## What came in

### From the story session

| Asked | Where | When |
|---|---|---|
| The welcome list's five arrival scenes are written as Gate visits on mornings one to five; eleven Umas have their own trigger to meet | [Meeting her](../game-mechanics.md#meeting-her) | Shipped (F67) |
| The town's people are all Umas from the Uma Ranker's NPC board, mapped role for role (14 roles); the town's six spots and each Uma's favourite spot come from the pack | [The town](../game-mechanics.md#the-town); the menu's [`town.json`](../story-pack.md#the-town-townjson) | Shipped (F66) |
| The Ranker's 24 sisters (an outfit presented as her own character, id `s<outfitId>`) in the town, the cast and the ties | The menu's [sisters](../story-pack.md#sisters): her name in her cast entry, her art her outfit's | Shipped (F66) |
| Ties may name one of the town's people (no bond, a line on both profiles) | The menu's [ties](../story-pack.md#the-ties-tiesjson) | Shipped (F66) |
| Chapters gated on builds (the Mine, the Quarry, the Cutter, the Kitchen, the Restaurant, the Forge), and ids for the dock and the boat | [Building](../game-mechanics.md#building): `dock` and `boat` are place ids a `built` gate can name | Shipped (F64) |
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
same style, as busts and faces.

### What the farm shows today

| Where | Art | Expressions |
|---|---|---|
| Cards, the HD-2D farm's standees, lists | Her face (`outfit-faces`) | — |
| Every scene (the dialogue engine, F75) | Her portrait in the scene's outfit (master data's `dialogue-portraits`, the pilot's two Umas); else her bust (`outfit-busts`) | Her face changes with each line's emote, by the 22 expressions' fallbacks; without portraits, the emote's bubble |
| The HD-2D farm | Her chibi sprite set | The sprite's own actions |

## Her wardrobe

| Outfit | Shows in | Default rule |
|---|---|---|
| **Spring** | Her default: daytime in spring, and whenever nothing else applies or the outfit asked for isn't drawn yet | The season of the day, and the fallback |
| **Summer, autumn, winter** | Daytime scenes, talks and heart events in that season | The season of the day |
| **Kimono** | Festival nights, and the year's first day | Festival night in summer and winter (the Fishing Derby's and the Harvest Cup's nights), and New Year's visit. The story may name other days |
| **Dinner dress** | "Dinner in town", a new date kind; the proposal if the story sets it at dinner; anniversary dinners | Dinner in town opens with Romance 3 |
| **Wedding dress** | The wedding, its replay in Memories, the first anniversary's scene | Always at the wedding |
| **Pajamas** | "A night in", a new evening kind for night visits; the household's night scenes | A night in opens with Romance 6, and at home once married. Tender, never explicit |

- **What a scene wears:** the scene's own choice if the story names one (`outfit` on an event or scene); else the
  default rule above; else spring.
- **Placeholders hold:** an outfit not yet drawn for her shows her spring bust, so a story can use an outfit before its art
  exists.
- **The sprites stay as they are:** her chibi set (master data's) is what she wears everywhere on the HD-2D farm. Seasonal sprite sets
  would multiply the heaviest art for little gain; it's a later choice, if ever.
- **Her profile:** a Wardrobe row shows the outfits drawn for her, and which one she's wearing today.

## Busts that change expression

### A bust per outfit, a face per expression

- **The bust:** her head and shoulders in one outfit, with her calm neutral face, on a transparent background. One for
  each outfit.
- **The face:** a square picture of just her face (brow to chin, cheek to cheek, with her bangs) in one expression,
  drawn to sit exactly over the face of her bust. One for each expression.
- **Why one set of faces fits every outfit:** her head is the same in every bust (same size, spot, angle and bangs).
  Only what's below the neck, and what she wears on her head, changes with the outfit.
- **The format is settled later:** sizes, and how a face sits on a bust, are worked out once the pilot's pictures are in
  Uma Character Art. Until then the pictures go up as a universe-looks collection, `dialogue-busts`, with
  `pnpm art:push` (uma-platform P163): nothing new is built there yet, and its earlier draft of a bust family is parked
  until the format is settled.
- **The game composes them:** the bust, with the face over it, swapped when the expression changes. Both are
  cached on the device.
- **Fallbacks:**
  - a face not drawn yet shows its fallback (the table below), ending at the bust's own neutral face;
  - a bust not drawn yet for that outfit shows her spring bust;
  - an Uma with none shows her single master-data bust, as today.

### The expressions

Twenty-two, in three sets. **Core** is needed for every Uma who speaks; **romance** for every Uma with a route; **extra**
comes when there's time. [F69](../handoff/tasks/F69-bust-art-spec.md) describes each one for the art. The story's
`emote` names them, and an unknown or undrawn one shows its fallback.

| Expression | Set | Falls back to |
|---|---|---|
| `neutral` | Core | — |
| `happy` | Core | `neutral` |
| `laughing` | Core | `happy` |
| `surprised` | Core | `neutral` |
| `thinking` | Core | `neutral` |
| `sad` | Core | `neutral` |
| `angry` | Core | `neutral` |
| `worried` | Core | `sad` |
| `determined` | Core | `happy` |
| `pouting` | Core | `angry` |
| `shy` | Romance | `happy` |
| `tender` | Romance | `happy` |
| `flustered` | Romance | `shy` |
| `loving` | Romance | `tender` |
| `tearful-joy` | Romance | `loving` |
| `sleepy` | Romance | `tender` |
| `crying` | Extra | `sad` |
| `teasing` | Extra | `happy` |
| `smug` | Extra | `determined` |
| `embarrassed` | Extra | `flustered` |
| `startled` | Extra | `surprised` |
| `dreamy` | Extra | `tender` |

### What one Uma needs

| Piece | Count |
|---|---|
| Busts | Four seasons (spring the default), kimono, dinner dress, wedding dress, pajamas: 8 |
| Faces | 10 core, 6 romance, 6 extra: 22 |

**Order:**
1. the two Umas with the new full art, as the pilot that sets the spec;
2. the welcome list's five;
3. the rest in the Uma Ranker's order.

Her spring bust and the core faces come first for each, then the seasons, then the special outfits.

## The work

Folded into the owner's rework ([the game's design](game-design.md), 2026-11-14):

| Packet | What | Who |
|---|---|---|
| [F69](../handoff/tasks/F69-bust-art-spec.md) | **The bust art:** her outfits and faces. The pilot is done (12 outfit portraits and 15 faces for each of two Umas); the rest follow | ChatGPT (character art) |
| F75, done | **The dialogue engine:** the face over the outfit's portrait, the story's `emote` picks the face, outfits by context, every fallback, on master data's `dialogue-portraits` family ([the rules](../game-mechanics.md#the-dialogue-engine)) | Claude |
| [F76](../handoff/tasks/F76-default-uma.md) | **The default Uma:** a blank bust with 22 faces for every Uma without art | Claude |
| [F79](../handoff/tasks/F79-uma-loop.md) | **The evenings:** Dinner in town and A night in, the wedding night, the night's companion | Claude |

The wardrobe now has 12 outfits, matching the art: the four seasons (spring the default), work clothes, the garden party
dress, the kimono, the dinner dress, the wedding dress, the wedding night outfit, pajamas and the swimsuit.

**For the story:**
- the `emote` menu grows to the 22 expressions;
- a scene or event may name an `outfit`;
- night visits and dinner dates become evening scenes the story can write.

The owner cross-references the outfits with the story, so each has scenes to show it.
