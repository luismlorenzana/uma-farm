# F69 — The bust art: layers, expressions and outfits

**ChatGPT (character art) · L, in batches · Needs: the owner's go, and uma-platform's bust family for delivery ·
Unblocks: F70, F71 · Design: [her-look.md](../../design/her-look.md)**

> Busts for dialogue, drawn in layers so the game can put any expression on any outfit. One head pose per Uma, a face
> layer per expression, a body layer per outfit. This packet is the full spec for the character art session.

## Why

Scenes show one bust per outfit today, with no expressions. The owner wants:
- dialogue and romance events to show her feelings;
- her outfit to change with the season and the occasion: a kimono, a dinner dress, a wedding dress and pajamas.

Drawing every expression on every outfit would be 18 × 9 pictures per Uma. Drawing them as layers needs 18 faces plus 9
outfits, and the game composes the rest.

## Style

- **Match the new full character art** (the two pilot Umas' art in Uma Character Art): the same line, colour and
  rendering, cut to a bust.
- **Pose and framing:**
  - three-quarter view, facing slightly to the viewer's left, eyes to the viewer;
  - head and shoulders down to mid-chest;
  - her Uma ears always in frame.
- **Lighting:**
  - soft light from the top left, the same on every layer;
  - no cast shadow;
  - no background, frame or glow.
- **Every Uma is drawn as an adult.** Every outfit is tasteful: the pajamas and the dresses are modest, never revealing.

## The canvas

- **Format:** 1024 × 1280 PNG, RGBA, sRGB, transparent background.
- **Every layer is the full canvas, already in place.** Stacking the files in layer order must give the finished bust,
  with no offsets.
- **Placement:**
  - her head's top sits about 100 px from the top;
  - her chin about 600 px down;
  - she's centred horizontally;
  - the body runs off the bottom edge.
- **Clean edges:** anti-aliased, no stray pixels outside the drawing, no white fringe.

## The layers, back to front

| # | Layer | One per | Holds | Must not hold |
|---|---|---|---|---|
| 1 | `back` (optional) | Outfit | A veil's back, a hood, ornaments behind the head | Anything in front of her |
| 2 | `body` | Outfit | Shoulders, chest, arms, neck | Her head |
| 3 | `head` | Uma (or an outfit's restyled hair) | Her face's skin and nose, the back of her hair, her ears | Eyes, brows, mouth, bangs |
| 4 | `face` | Uma × expression | Eyes (iris, highlights, lashes), brows, mouth, and that expression's blush, tears or sweat | Hair, skin outside the features |
| 5 | `hair` | Uma (or an outfit's restyled hair) | Bangs and the locks that fall over her face and shoulders | The back of her hair |
| 6 | `front` (optional) | Outfit | A hat, a kanzashi, a veil's front, a nightcap | — |

- **The head never moves.** Every `head`, `face` and `hair` of an Uma shares one pose and one position, so every face
  fits every outfit. Only the body below the neck changes between outfits.
- **An outfit may restyle her hair:** an updo with the kimono, loose hair with pajamas. It does so with its own `head`
  and `hair`, in the same pose.

## The expressions (18)

| Expression | Looks like | Set |
|---|---|---|
| `neutral` | Calm, mouth relaxed | Core |
| `happy` | Warm smile, eyes open | Core |
| `laughing` | Eyes closed in a smile, mouth open | Core |
| `surprised` | Eyes wide, brows up, mouth open | Core |
| `thinking` | Eyes aside, mouth small | Core |
| `sad` | Brows up and in, eyes down, mouth down | Core |
| `angry` | Brows down, a frown | Core |
| `worried` | Uneasy brows, a small sweat drop | Core |
| `determined` | Focused eyes, a set smile | Core |
| `pout` | Puffed cheek, eyes aside | Core |
| `shy` | Eyes averted, light blush | Romance |
| `tender` | Soft eyes, small smile, light blush | Romance |
| `flustered` | Deep blush, wavy mouth, eyes darting | Romance |
| `loving` | Half-lidded soft eyes, warm smile, blush | Romance |
| `tearful-joy` | Happy tears, smiling | Romance |
| `sleepy` | Half-closed eyes, a yawn or a small smile | Romance |
| `crying` | Tears, brows up | Extra |
| `teasing` | A wink, a sly smile | Extra |

Each expression is in her character: a reserved Uma's `happy` is quieter than a bright one's.

## The outfits (9)

| Outfit | Notes |
|---|---|
| `own` | Her own outfit, as in master data and her full art |
| `spring` | Light layers, a cardigan or a light jacket, her colours in pastel |
| `summer` | A sundress or light top, airy |
| `autumn` | A knit sweater, a scarf, warm tones |
| `winter` | A coat, a scarf, a winter accessory |
| `kimono` | A festival kimono with its obi; hair up, with a kanzashi on `front` |
| `dinner` | An elegant evening dress for a dinner date |
| `wedding` | A white wedding dress; the veil split into `back` and `front` |
| `pajamas` | Soft, modest pajamas or a nightgown; hair loose |

She keeps her own look in every outfit: her colours, her accessories, her personality. The story's tags (her favourite
season, her loved gift) are good hints.

## Files and delivery

- **One folder per Uma,** named by her character id. A sister is named `s<outfitId>`.
- **The files:**
  - `head.png` and `hair.png`;
  - `face-<expression>.png`;
  - `body-<outfit>.png`;
  - `back-<outfit>.png` and `front-<outfit>.png` where used;
  - `head-<outfit>.png` and `hair-<outfit>.png` for a restyled outfit;
  - `manifest.json`, listing every file with its layer, outfit or expression, size, SHA-256 and approval date.
- **Never in git:** the busts show real franchise characters. They're approved by the owner in a local gallery and
  published privately through uma-platform's bust family, which uma-platform adds on request, like the sprite sets and
  the universe looks.
- **A review sheet per Uma:** every outfit with `neutral`, and every expression on `own`, so a misfit shows at a glance.

## Order

1. **The pilot:** the two Umas with the new full art, with every piece. They set the bar; the owner approves them before
   the rest start.
2. **The welcome list's five:** core faces and `own` first, then the seasons, then the special outfits.
3. **The rest, in the Uma Ranker's order:** core faces and `own` first.

## Done when

- The pilot's two Umas have every piece, the stack test is clean (every face on every body), and the owner has approved
  their review sheets.
- They're published through uma-platform's bust family.
- Each later batch follows the same checks.
