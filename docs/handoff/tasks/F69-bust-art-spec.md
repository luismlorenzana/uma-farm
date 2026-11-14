# F69 — The bust art: a bust per outfit, a face per expression

**ChatGPT (character art) · L, in batches · Needs: uma-platform's private bust family for delivery (requested 2026-11-13) ·
Unblocks: F70, F71 · Design: [her-look.md](../../design/her-look.md)**

> Two kinds of pictures for each Uma: **a bust for each outfit**, and **a face for each expression**. The game puts the
> face over the bust, so any expression shows on any outfit. That's 9 busts and 17 faces per Uma (her neutral face is the bust's own), not 162 pictures.

## Why

Scenes show one still bust per outfit today, with no expressions. The owner wants:
- dialogue and romance events to show her feelings;
- her outfit to change with the season and the occasion: a kimono, a dinner dress, a wedding dress and pajamas.

## What to draw

### 1. A bust for each outfit

- **Framing:** her head and shoulders, down to mid-chest, ears included. She looks at the viewer with her calm, neutral
  face.
- **Style:** the same as her new full character art.
- **Background:** transparent, with no shadow or frame.
- **The same head in every outfit.** In all nine busts, her head is the same size, at the same spot, at the same angle,
  with the same bangs. Only what's below the neck (and anything she wears on her head) changes. This is what lets one set
  of faces fit every outfit.
- **Same size:** every bust of an Uma is the same picture size, 1024 × 1280 is a good default, with her head near the
  top.

### 2. A face for each expression

- **A square picture of just her face,** for example 512 × 512. It runs from her brow to her chin and from cheek to
  cheek, with her bangs as they fall over her forehead. It's drawn to sit exactly over the face of her bust.
- **Its edges blend into the bust:** soft or clean, so no seam shows where it meets her hair and skin. Outside her face
  it's transparent.
- **Drawn once, on her own bust,** and it fits all nine because her head never changes.
- **Where it goes:** note once, per Uma, where the face square sits on her busts: its left and top edge, in pixels. It's
  the same for every outfit.

## The expressions (18)

| Expression | Looks like | Set |
|---|---|---|
| `neutral` | Calm, mouth relaxed (the bust's own face, so no extra picture is needed) | Core |
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
| `own` | Her own outfit, as in her full art |
| `spring` | Light layers, a cardigan or a light jacket, her colours in pastel |
| `summer` | A sundress or light top, airy |
| `autumn` | A knit sweater, a scarf, warm tones |
| `winter` | A coat, a scarf, a winter accessory |
| `kimono` | A festival kimono with its obi; hair up at the back, with a kanzashi; bangs as always |
| `dinner` | An elegant evening dress for a dinner date |
| `wedding` | A white wedding dress and veil, the veil clear of her face |
| `pajamas` | Soft, modest pajamas or a nightgown; hair loose at the back; bangs as always |

She keeps her own look in every outfit: her colours, her accessories, her personality. Every Uma is drawn as an adult,
and every outfit is tasteful: the pajamas and the dresses are modest, never revealing.

## Files and delivery

- **One folder per Uma,** named by her character id. A sister is named `s<outfitId>`.
- **The files:**
  - `bust-<outfit>.png` for each outfit drawn;
  - `face-<expression>.png` for each expression drawn;
  - `manifest.json`, which lists each file with its outfit or expression and its approval date, and gives the face
    square's position: `{ "face": { "left": …, "top": …, "size": … } }`.
- **Never in git:** these are real franchise characters. They're approved by the owner and published privately through
  uma-platform's bust family, like the sprite sets and the universe looks.
- **A review sheet per Uma:** every bust with her neutral face, and every face on her own bust, so a misfit shows at a
  glance.

## Order

1. **The pilot:** the two Umas with the new full art, with every bust and every face. They set the bar, and the owner
   approves them before the rest start.
2. **The welcome list's five:** her own bust and the core faces first, then the seasons, then the special outfits.
3. **The rest, in the Uma Ranker's order:** her own bust and the core faces first.

## Done when

- The pilot's two Umas have every bust and face.
- Every face sits cleanly on every bust.
- The owner has approved their review sheets, and they're published through uma-platform's bust family.
