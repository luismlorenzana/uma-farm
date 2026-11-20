# Her look: outfits, expressions and illustrations

Each Uma has a standard wardrobe of 12 outfits and a dialogue menu of 22 expressions. The engine shows her portrait in
the outfit the moment calls for, with her face changing line by line. Her big moments open onto full-screen
illustrations. ChatGPT draws them (character art), and the game composes them. How the game plays them is
[the dialogue engine](../game-mechanics.md#the-dialogue-engine); what's drawn next is [the art brief](#the-art-brief),
below. The page view is [her-look.html](../pages/her-look.html).

## What came in

### From the story session

| Asked | Where | When |
|---|---|---|
| The welcome list's five arrival scenes as Gate visits, and her own trigger to meet | [Meeting her](../game-mechanics.md#meeting-her) | Shipped (F67), then retired with the welcome week (2026-11-14): you meet her by introducing yourself in town |
| The town's people are all Umas from the Uma Ranker's NPC board, mapped role for role (14 roles); the town's six spots and each Uma's favourite spot come from the pack | [The town](../game-mechanics.md#the-town); the menu's [`town.json`](../story-pack.md#the-town-townjson) | Shipped (F66) |
| The Ranker's 24 sisters (an outfit presented as her own character, id `s<outfitId>`) in the town, the cast and the ties | The menu's [sisters](../story-pack.md#sisters): her name in her cast entry, her art her outfit's | Shipped (F66) |
| Ties may name one of the town's people (no bond, a line on both profiles) | The menu's [ties](../story-pack.md#the-ties-tiesjson) | Shipped (F66) |
| Chapters gated on builds (the Mine, the Quarry, the Cutter, the Kitchen, the Restaurant, the Forge), and ids for the dock and the boat | [Building](../game-mechanics.md#building): `dock` and `boat` are place ids a `built` gate can name | Shipped (F64) |
| Group scenes for 10 families and 17 crews | [The roadmap's long game](../roadmap.md#phase-2-the-whole-farm) | Later, with Phase 2's long game |

The story has a baseline for all 100 of the Ranker's characters: tags, a web of 257 ties, and 76 in the pack's cast with
thin bibles.

### From the character art

uma-platform's **Uma Character Art** (https://uma-platform.web.app/art) holds, for each Uma:

- master data's face, bust and chibi sprite set;
- the full-body 3D render (`outfit-renders`, 768×1024);
- the **universe looks**: ChatGPT's owner-approved pictures of an Uma in another world, Farm Life among them.

Farm Life is where the farm's art comes from: **twelve Umas have their dialogue portraits** (12 outfits and 15 faces
each) **and all nine of their illustrations**. Master data carries them to the game, with no farm release.

### What the farm shows today

| Where | Art | Expressions |
|---|---|---|
| Cards, lists, the town's sheets, her profile | Her face (`outfit-faces`) and her master-data bust | — |
| Every scene (the dialogue engine) | Her portrait in the scene's outfit (master data's `dialogue-portraits`, twelve Umas so far); else the blank bust: her silhouette in the outfit's colours | Her face changes with each line's emote: her portrait's by the 22 expressions' fallbacks, else the blank bust's own face for each of the 22 |
| Her big moments | Her illustration, full screen (master data's `illustrations`, twelve Umas' nine so far); else her bust | — |
| Her profile's Gallery | Each illustration she's shown, kept for good; the rest locked, with their titles | — |

## Her wardrobe

| Outfit | Shows in |
|---|---|
| **Spring** | Daytime in spring, and whenever the outfit asked for isn't drawn for her yet |
| **Summer, autumn, winter** | Daytime scenes, talks and heart events in that season |
| **Work clothes** | Her work, and a heart event about it |
| **Garden party** | A picnic, a tea, and the spring festival (the Flower Show) |
| **Kimono** | Festival nights and New Year's |
| **Dinner dress** | Dinner in town (from Romance 3), and the household's scenes |
| **Wedding dress** | The wedding |
| **Wedding night** | The wedding night |
| **Pajamas** | A night in (from Romance 6), and the night's companion in the morning |
| **Swimsuit** | The summer shore |

- **What a scene wears:** the scene's own choice if the story names one (`outfit` on an event or scene); else the
  moment's ([outfits by context](../game-mechanics.md#outfits-by-context)); else the day's season.
- **Placeholders hold:** an outfit not yet drawn for her shows her spring portrait, so a story can use an outfit before
  its art exists.

## Busts that change expression

### A portrait per outfit, a face per expression

- **The portrait:** her head and shoulders in one outfit, with her calm neutral face. One for each outfit.
- **The face:** just her face in one expression, drawn to sit exactly over the face of any of her portraits. One for
  each expression.
- **Why one set of faces fits every outfit:** her head is the same in every portrait (same size, spot, angle and bangs).
  Only what's below the neck, and what she wears on her head, changes with the outfit.
- **The game composes them:** the portrait, with the face over it, swapped when the expression changes. Both are cached
  on the device ([her portraits](../game-mechanics.md#her-portraits)).
- **Fallbacks:**
  - a face not drawn yet shows its fallback (the table below), ending at the portrait's own neutral face;
  - an outfit not drawn yet shows her spring portrait;
  - an Uma with none shows the blank bust in the outfit's colours, with its own 22 faces; her master-data bust stays on
    cards and lists.

### Minimum facial expressions by outfit

Approve a **neutral bust** for each outfit, then preview the listed shared face layers on that bust. The state count
includes neutral. Reuse a layer across outfits when it lines up with each base. For a specific Uma, read her scenes and
reachable choice branches before review. Add an exact expression when it carries a beat that would read differently
with the fallback.

| Outfit or look slots | Scene coverage | Minimum layers to preview after neutral | States per outfit |
|---|---|---|---:|
| `spring`, `summer`, `fall`, `winter` | Town greetings, gifts, heart events, ordinary evenings and wedding guests. Spring also covers missing bases. | `happy`, `laughing`, `surprised`, `thinking`, `sad`, `angry`, `worried`, `determined`, `pouting`, `shy`, `tender`, `flustered`, `loving`, `tearful-joy` | 15 each |
| `farm-work` | Farm help, crafting, work-related heart events and pair conversations | `happy`, `laughing`, `surprised`, `thinking`, `determined`, `shy`, `tender`, `loving`, `tearful-joy` | 10 |
| `garden-party` | Picnics, teas, Flower Show, blossom viewing and first dates | `happy`, `laughing`, `surprised`, `thinking`, `determined`, `shy`, `tender`, `flustered`, `loving` | 10 |
| `kimono` | New Year, festival nights and authored confession scenes | `happy`, `laughing`, `thinking`, `determined`, `shy`, `tender`, `flustered`, `loving`, `tearful-joy` | 10 |
| `dinner` | Dinner dates, birthdays, calendar anniversary scenes and household dinners | `happy`, `laughing`, `surprised`, `thinking`, `shy`, `tender`, `loving`, `tearful-joy` | 9 |
| `wedding` | Ceremony, vows and player replies | `happy`, `laughing`, `tender`, `loving`, `tearful-joy` | 6 |
| **`wedding-night`** | The wedding-day scene. Shy opening, flustered realization, quiet affection and the default morning beat. | `shy`, `flustered`, `tender`, `loving`, `sleepy` | **6** |
| **`pajamas-playful` and pajama slot 1** | A night in, ordinary morning greetings, the first night-visit look and authored nighttime heart events | `happy`, `laughing`, `surprised`, `thinking`, `sad`, `tender`, `loving`, `tearful-joy`, `sleepy` | **10** |
| **Pajama slots 2–10** (`marriedLife.pajamas`) | Numbered Night visits and their morning continuation. The player requests `tender` for each beat, including the morning. | `tender` | **2 each** |
| **Wedding Anniversary slots 1–5** (`marriedLife.anniversary`) | Numbered anniversary-night visits. The anniversary host wears this look. A duo guest uses her pajama look. | `tender` | **2 each** |
| `swimsuit` | Summer shore dialogue around the beach illustration | `happy`, `laughing`, `tender`, `loving` | 5 |

The matrix uses 50 local authored Farm routes and 76 pair files, checked against the default scenes and scene players.
The wedding-night routes call for `loving` or `flustered` on 153 of 171 spoken steps. The `a-night-in` scenes call
for `tender`, `laughing` or `sleepy` on 126 of 164 spoken steps. The baseline pajamas also appear in scenes with more
emotional range, including nighttime heart events. A named calendar `anniversary` scene normally wears `dinner`.
The five numbered anniversary-night looks belong to the separate married-life player.

**When a scene calls for more.** Start with the actual fallback. `dreamy` and `sleepy` can use `tender`, `teasing`
can use `happy`, and `worried` can use `sad`. Approve the exact composition when it supplies the punchline or changes
the mood. Add `sleepy` to a numbered look when a future wake-up scene explicitly asks for it. A splash illustration
carries its own pose and expression.

**How to apply it in Facial Expressions.** Use the row as the per-base `outputs` approval checklist. Keep at least one
approved non-neutral composition per new base so the portrait packer has an explicit face position. Carry forward
existing approvals. The current release packs one shared layer per expression for the character, so other shared
expressions remain available in the game when a scene requests them. The matrix sets the preview and approval workload.
Numbered wardrobe art also needs a slot-to-portrait mapping before it appears in the game. The
[married-life story contract](../story-pack.md#the-household-householdjson) lists the current story keys.

The nine additional pajama looks and five anniversary looks call for **28 previews per Uma**. At the standard 16 states
per outfit, those same 14 looks would call for 224 previews.

### The expressions

The 22 expression IDs are grouped as **core**, **romance** and **extra**. [The matrix](#minimum-facial-expressions-by-outfit)
sets the approval list for each outfit. [The art brief](#the-art-brief) describes how each face should read. The story's
`emote` names it, and an unknown or undrawn expression shows its fallback.

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
| Portrait bases | One neutral bust for each outfit used in dialogue, starting with the 12 standard outfits |
| Shared face layers | One per expression needed by the scenes. Reuse it across outfits and preview the combinations in the matrix. |
| Illustrations | One per big moment: 9 |

## What's built

| Packet | What |
|---|---|
| F75 | **The dialogue engine:** the face over the outfit's portrait, the story's `emote` picks the face, outfits by context, every fallback, on master data's `dialogue-portraits` ([the rules](../game-mechanics.md#the-dialogue-engine)) |
| F76 | **The default Uma:** a blank bust with 22 faces for every Uma without art, and the default story ([the blank bust](../game-mechanics.md#the-blank-bust)) |
| F79 | **The evenings:** Dinner in town and A night in, the wedding night, the night's companion in pajamas ([the Uma loop](../game-mechanics.md#the-uma-loop)) |
| F84 | **Her illustrations:** her big moments full screen, and her gallery ([her illustrations](../game-mechanics.md#her-illustrations)) |

**For the story:** the `emote` menu has the 22 expressions, a scene or event may name an `outfit` or an `illustration`,
and the evenings and the night's companion are scenes the story can write ([the story pack's
steps](../story-pack.md#steps)). The owner cross-references the outfits with the story, so each has scenes to show it.

## The art brief

**For the character-art session (ChatGPT), standing guidance for each Uma's dialogue and big moments.**

**Where it stands:** twelve Umas have their portraits (12 outfits and 15 faces each) and all nine of their
illustrations. Until an Uma has hers, the game plays her on the blank bust, so nothing waits on the art.

### What to draw

For each Uma:

- **a bust in each outfit:** head and shoulders, in the style of her full character art, with a calm face;
- **shared facial expressions** for the outfits and scenes in [the approval matrix](#minimum-facial-expressions-by-outfit);
- **her illustrations,** one for each big moment (below).

Draw her the same way in every outfit, with the same pose and angle, so her faces can be reused across outfits. Every
Uma is drawn as an adult, and every picture is tasteful: tender, never explicit.

### The outfits

| Outfit | Notes |
|---|---|
| **Spring** | Her default outfit, the one she wears unless another fits: light layers, a cardigan or a light jacket, her colours in pastel |
| **Summer** | A sundress or light top, airy |
| **Autumn** | A knit sweater, a scarf, warm tones |
| **Winter** | A coat, a scarf, a winter accessory |
| **Kimono** | A festival kimono with its obi, hair up, a kanzashi |
| **Dinner** | An elegant evening dress, for a dinner date |
| **Wedding** | A white wedding dress and veil |
| **Pajamas** | Soft, modest pajamas or a nightgown, hair loose, for nights in and the morning after |
| **Work clothes** | For farm work: practical, her colours |
| **Garden party** | A light party dress, for the spring festival, picnics and teas |
| **Wedding night** | Tender and modest, for the night after her wedding |
| **Swimsuit** | For the summer shore, modest |

She keeps her own look in every outfit: her colours, her accessories, her personality. The dresses and the pajamas are
modest, never revealing.

### The expressions to draw

Each one is a feeling the story will ask for, so each should read at a glance, small on a phone, and stay in her
character: a reserved Uma's joy is quieter than a bright one's.

**Core expressions**

| Expression | Eyes and brows | Mouth and marks | The story uses it for |
|---|---|---|---|
| **Neutral** | Open, relaxed | Closed, relaxed | Plain talk; the default |
| **Happy** | Bright, slightly narrowed by the smile | A warm open smile | Greetings, good news, a gift she likes |
| **Laughing** | Closed in curves | Wide open, laughing | A joke, festival fun, teasing that lands |
| **Surprised** | Wide, brows high | A small round "oh" | News, a reveal, a gift she didn't expect |
| **Thinking** | Looking aside or up, one brow raised | Small, pursed or to one side | Plans, puzzles, choosing |
| **Sad** | Lowered, brows up and pinched in | Turned down | Bad news, missing someone, a loss |
| **Angry** | Narrowed, brows down hard | A frown or clenched | A rival, a wrong done, a race lost |
| **Worried** | Uneasy, brows tilted up | A wobbly line; a small sweat drop | Nerves, a hard day, before a race |
| **Determined** | Focused, brows set | A firm small smile | Work, training, a promise kept |
| **Pouting** | Looking away, brows down | Puffed cheek, lips pushed out | Playful annoyance, being teased |

**Romance expressions**

| Expression | Eyes and brows | Mouth and marks | The story uses it for |
|---|---|---|---|
| **Shy** | Looking down or away | A small smile; light blush | A compliment, a first date, being noticed |
| **Tender** | Soft, warm, a little lowered | A gentle smile; faint blush | Quiet moments, evenings together |
| **Flustered** | Darting, wide or squeezed shut | A wavy mouth; deep blush, maybe steam or sweat | The confession, a near kiss, being caught staring |
| **Loving** | Half-lidded, glowing | A soft smile; blush | Saying yes, married mornings, "I'm glad it's you" |
| **Tearful joy** | Bright, wet, tears at the corners | Smiling through them | The proposal, the wedding, a promise come true |
| **Sleepy** | Half-closed, heavy | A yawn or a drowsy smile | Nights in, early mornings, a nap on your shoulder |

**Extra expressions for specific scenes**

| Expression | Eyes and brows | Mouth and marks | The story uses it for |
|---|---|---|---|
| **Crying** | Brows up, eyes shut or welling | Trembling; tears running | Real sorrow, a farewell, relief after fear |
| **Teasing** | One eye winking | A sly, lopsided smile | Flirting, a trick, a secret between you |
| **Smug** | Half-lidded, confident | A smirk | Winning, showing off a harvest, a rivalry |
| **Embarrassed** | Squeezed shut or looking away | A forced laugh; a big sweat drop | A blunder, being called out |
| **Startled** | Tiny pupils, wide | Open in a gasp; maybe a jolt mark | A scare, a sudden noise, a ghost story |
| **Dreamy** | Unfocused, looking up | A faint smile; sparkles | Daydreaming, a wish, the festival lights |

**The range, at a glance**

| Feeling | Light | Strong |
|---|---|---|
| Joy | Happy | Laughing, Tearful joy |
| Affection | Tender, Shy | Loving, Flustered |
| Sadness | Sad | Crying |
| Anger | Pouting | Angry |
| Fear and nerves | Worried | Startled |
| Surprise | Surprised | Startled |
| Thought | Thinking | Dreamy |
| Confidence | Determined | Smug |
| Play | Teasing | Laughing |
| Rest | Sleepy | — |
| Awkwardness | Embarrassed | Flustered |

If the story asks for a face that isn't drawn yet, the game shows the nearest one, so the expressions can come in any
order.

### The illustrations

A splash illustration for each of her big moments: a landscape picture that fills the phone's screen, with the scene's
text over its lower edge. Each one she's shown joins her gallery for good
([her illustrations](../game-mechanics.md#her-illustrations)).

| Moment | What it is | She wears |
|---|---|---|
| `meeting` | Meeting her: you introduce yourself in town, and she greets you for the first time | The day's season |
| `beach` | A summer date at the shore, once you're sweethearts | The swimsuit |
| `confession` | Her confession, as she asks | The day's season |
| `confession-yes` | Her yes | The day's season |
| `wedding` | The wedding | The wedding dress |
| `wedding-night` | The wedding night, as it begins | The wedding night outfit |
| `wedding-night-end` | The wedding night, as it fades to morning | The wedding night outfit |
| `night-in` | A night in: an evening at home together | Pajamas |
| `companion` | The morning after she was the night's companion, before she greets you | Pajamas |

The story may name other scenes of hers for its own moments; these nine are the ones the game shows by itself.

### The order

1. **Done:** twelve Umas' portraits, 12 outfits and 15 faces each, and their nine illustrations each (master data
   `00598e1d125e`, 2026-11-17). The six extra faces can follow for all twelve.
2. **Next, in the Uma Ranker's order:** her spring outfit and the core faces first, then the romance faces, then the
   other outfits, then her illustrations.

### Delivery

Published to Uma Character Art's Farm Life universe, approved by the owner. Master data carries them to the game from
there: no farm release.
