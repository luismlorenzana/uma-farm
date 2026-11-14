# F69 — The bust art: outfits and expressions

**ChatGPT (character art) · L, in batches · Unblocks: F70, F71 · Design: [her-look.md](../../design/her-look.md)**

> Busts for the farm's dialogue and romance scenes: each Uma in her outfits, and her face in every feeling the story
> needs. The technical format is worked out together once the first pictures are in Uma Character Art.

## What to draw

For each Uma:
- **A bust in each outfit:** head and shoulders, in the style of her new full character art, with a calm face.
- **Her face in each expression** (below), so the game can show her feelings on whatever she's wearing.

Draw her the same way in every outfit, with the same pose and angle, so her faces can be reused across outfits.

## The outfits

| Outfit | Notes |
|---|---|
| **Spring** | Her default outfit, the one she wears unless another fits: light layers, a cardigan or a light jacket, her colours in pastel |
| **Summer** | A sundress or light top, airy |
| **Autumn** | A knit sweater, a scarf, warm tones |
| **Winter** | A coat, a scarf, a winter accessory |
| **Kimono** | A festival kimono with its obi, hair up, a kanzashi |
| **Dinner** | An elegant evening dress, for a dinner date |
| **Wedding** | A white wedding dress and veil |
| **Pajamas** | Soft, modest pajamas or a nightgown, hair loose, for night visits |
| **Work clothes** | For farm work: practical, her colours |
| **Garden party** | A light party dress, for the spring festival, picnics and teas |
| **Wedding night** | Tender and modest, for the night after her wedding |
| **Swimsuit** | For the summer shore, modest |

She keeps her own look in every outfit: her colours, her accessories, her personality. Every Uma is drawn as an adult,
and every outfit is tasteful: the dresses and the pajamas are modest, never revealing.

## The expressions

The heart of this packet. Each one is a feeling the story will ask for, so each should read at a glance, small on a
phone, and stay in her character: a reserved Uma's joy is quieter than a bright one's.

### Core: every Uma who speaks

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

### Romance: every Uma with a route

| Expression | Eyes and brows | Mouth and marks | The story uses it for |
|---|---|---|---|
| **Shy** | Looking down or away | A small smile; light blush | A compliment, a first date, being noticed |
| **Tender** | Soft, warm, a little lowered | A gentle smile; faint blush | Quiet moments, evenings together |
| **Flustered** | Darting, wide or squeezed shut | A wavy mouth; deep blush, maybe steam or sweat | The confession, a near kiss, being caught staring |
| **Loving** | Half-lidded, glowing | A soft smile; blush | Saying yes, married mornings, "I'm glad it's you" |
| **Tearful joy** | Bright, wet, tears at the corners | Smiling through them | The proposal, the wedding, a promise come true |
| **Sleepy** | Half-closed, heavy | A yawn or a drowsy smile | Night visits, early mornings, a nap on your shoulder |

### Extra: when there's time

| Expression | Eyes and brows | Mouth and marks | The story uses it for |
|---|---|---|---|
| **Crying** | Brows up, eyes shut or welling | Trembling; tears running | Real sorrow, a farewell, relief after fear |
| **Teasing** | One eye winking | A sly, lopsided smile | Flirting, a trick, a secret between you |
| **Smug** | Half-lidded, confident | A smirk | Winning, showing off a harvest, a rivalry |
| **Embarrassed** | Squeezed shut or looking away | A forced laugh; a big sweat drop | A blunder, being called out |
| **Startled** | Tiny pupils, wide | Open in a gasp; maybe a jolt mark | A scare, a sudden noise, a ghost story |
| **Dreamy** | Unfocused, looking up | A faint smile; sparkles | Daydreaming, a wish, the festival lights |

### The range, at a glance

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

## Order

1. **The pilot is done:** the two Umas with the new full art have 12 outfit portraits and 15 faces each, published in
   Uma Character Art's Farm Life. The game's dialogue engine ([its rules](../../game-mechanics.md#the-dialogue-engine)) is built on them. The six
   extra faces (crying, teasing, smug, embarrassed, startled, dreamy) can follow for both.
2. **Next, in the Uma Ranker's order:** her spring outfit and the core faces first, then the romance faces, then the
   other outfits. Until an Uma has her art, the game shows a blank bust ([F76](F76-default-uma.md)).

## Where they go

Deliver them as you deliver the universe looks: a collection named `dialogue-busts`, approved by the owner in its local
gallery, then published with `pnpm art:push dialogue-busts`. Each picture then shows on her page in Uma Character Art,
under "Dialogue Busts".

## Done when

Each Uma is in Uma Character Art, in every outfit and every core and romance face, approved by the owner. The pilot's
two already are.
