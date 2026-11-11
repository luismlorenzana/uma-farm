# F29 — Art for M5

**uma-platform's `packages/art` (uma-art) · Part A: Claude · Part B: ChatGPT (uma-platform P126, uma-farm D45) · M ·
Needs: part A, F25's part A (the `ui` groups); part B, F25's part B (its `cast` atlas) · Unblocks: the first M5 packet
built after its release pins it · Milestone M5, more to do**

> **Two parts, two workers (P126, 2026-11-11).** The owner moved ChatGPT onto character art. **Part A, the pixel pieces**
> (the products and feeds, the seven animal icons, the Coop and the expedition post, the story items and the tools'
> tints), is code-drawn pixel art, so it's Claude's in a uma-platform session ("Take F29, part A"). **Part B, the four
> busts**, is character art, so it stays ChatGPT's ("Take F29, part B"). Each part ships its own uma-art minor. M5's
> packets wait on the romance spec (F41), which may revise this list before either part starts.

## Why

M5 adds the ranch, mining, the Kitchen and expeditions, and four chapters with four new townsfolk. Most of what they
show is already in uma-art (the Barn, the Kitchen, the Mine and the Quarry with their workbenches, the 80 dishes, the
wool and cloths, the ores, stones, crystals and the expeditions' loot). What isn't: four products and two feeds, seven
animals, two buildings, four cast busts, four chapters' story items, and the farm's seven tools in their five tiers.
Each part is drawn, versioned and published as a uma-art release by its worker (P126), and the first uma-farm packet that
uses it pins it.

**F25's status (2026-11-09):** M4's art (the Dorm, the bin, the seed badge, nine marks, three busts) isn't released yet;
uma-farm still runs on F24's stand-ins and pins uma-art 2.21.0. This packet builds on F25's `cast` atlas.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS19** ("What needs new art", its M5 rows), CS13 (the animals, their
  products and feed), CS41 (the town's cast), CS43 (chapters 2–5), CS48 (the expedition post's regions), CS25 (the
  tools' five tiers), CS21 (the dishes are uma-art's), CS14 (the Mine and the Quarry reuse uma-art's), CS55's F29 row.
- [core-loop.md](../../design/core-loop.md): FC24 (an original cast; Umas only in roles), FC28 (the map's rows).
- [F25's packet](F25-art-m4.md): the `cast` atlas (a 4 × 3 grid of 256×256 cells, F25's three busts first), the busts'
  look, the `ui` groups, the review page's model.
- The M5 packets that use this art: [F27](F27-ranch.md) (products, feed, animals, the Coop, Dale Hart, the cowbell),
  [F26](F26-mine-quarry.md) (Gus Talbot, the lamp), [F8](F8-kitchen.md) (Rosa Bell, the recipe card),
  [F28](F28-expeditions.md) (the expedition post, Juno Park, the old map).
- uma-farm's [goals.md](../../game/goals.md) (the cast's table and bust keys).
- uma-platform: its [change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)
  ("Art: the game's session writes a ChatGPT packet, and the art ships in uma-art"), `packages/art/README.md` (every
  family's sheet and index format), `packages/art/CHANGELOG.md`, the pixel families' source in `scripts/pixel-art`
  (`pnpm art:draw`), the authored families' in `scripts/authored-art` (`pnpm art:props`), and UA8's held items as the
  model for an authored, full-colour family.
- uma-farm today: it pins uma-art **2.21.0**; the Hub map (uma-kit's `HubMap`) draws `buildings` frames at 48×48; item
  icons are 32×32 from `items`; dishes from `dishes`.

## Decisions made

### From the spec

- **M5's rows of CS19's art table:**

  | For | Art | Milestone |
  |---|---|---|
  | Goods | **Egg, Duck Egg, Milk, Goat Milk** (items, 32×32) | M5 |
  | Shop goods | **Chicken Feed, Fodder** (32×32) | M5 |
  | Animals | **Chicken, Duck, Cow, Goat, Sheep, Alpaca, Cashmere Goat**, portrait icons (48×48) | M5 |
  | Places on today's map | **Coop, expedition post** (Hub buildings, 48×48); the rest reuse uma-art's: `stable` the Barn, `kitchen`, `mine`, `quarry`, the workbenches the stations | M5 |
  | The town's cast | **Dale Hart, Gus Talbot, Rosa Bell, Juno Park**: bust portraits for scenes | M5 |
  | Story and Diary | story items, one a chapter (CS55's "chapter items") | M5 (chapters 2–5) |

- **The cast is original** (CS41): their names and looks live in git. No Uma, no character from the original game, and
  no likeness of one.
  - **Dale Hart** is the rancher who sells animals and feed: friendly, sun-browned, middle-aged, a wide-brimmed hat,
    a work shirt and a neckerchief.
  - **Gus Talbot** is the retired miner who reopens the Mine and the Quarry: older, a grey beard, a miner's helmet
    with its lamp pushed back, a smudge of soot; gruff and warm.
  - **Rosa Bell** is the town's cook, who judges the Cooking Contest: cheerful, in her forties, a cook's white jacket,
    hair tied up under a kerchief.
  - **Juno Park** runs the expedition post: a young guide in a travel jacket, a map case on a strap, goggles pushed up
    on her head.
- **Every existing frame stays byte-identical,** as in every uma-art release.

### Decided here (the spec left these open)

1. **The pieces:**

   | Piece | Key | Size | Family (atlas) | Style | Status |
   |---|---|---|---|---|---|
   | Egg | `egg` | 32×32 | `items` | Pixel, the items' palette | **New** |
   | Duck Egg | `duck-egg` | 32×32 | `items` | Pixel; larger, a blue-green shell | **New** |
   | Milk | `milk` | 32×32 | `items` | Pixel; a glass bottle | **New** |
   | Goat Milk | `goat-milk` | 32×32 | `items` | Pixel; a small jug, unlike Milk's bottle | **New** |
   | Chicken Feed | `chicken-feed` | 32×32 | `items` | Pixel; a small grain sack | **New** |
   | Fodder | `fodder` | 32×32 | `items` | Pixel; a bound hay bundle | **New** |
   | Chicken, Duck, Cow, Goat, Sheep, Alpaca, Cashmere Goat | `chicken`, `duck`, `cow`, `goat`, `sheep`, `alpaca`, `cashmere-goat` | 48×48 each | a new `animals` atlas | Pixel portrait icons, head and shoulders, facing image-right, transparent; the Cashmere Goat's long cream coat sets it apart from the Goat | **New** |
   | Coop | `coop` | 48×48 | `buildings`, page `farmlands`, with `anchorY` | Pixel, the Hub buildings' palette and light; a hen house with a run | **New** |
   | Expedition post | `expedition-post` | 48×48 | `buildings`, page `farmlands`, with `anchorY` | Pixel; a timber post house with a signboard and a flag | **New** |
   | Dale Hart | `cast/dale-hart` | 256×256 | `cast` | Authored full colour, F25's look | **New** |
   | Gus Talbot | `cast/gus-talbot` | 256×256 | `cast` | Authored full colour | **New** |
   | Rosa Bell | `cast/rosa-bell` | 256×256 | `cast` | Authored full colour | **New** |
   | Juno Park | `cast/juno-park` | 256×256 | `cast` | Authored full colour | **New** |
   | Chapter 2: Dale's cowbell | `story-cowbell` | 32×32 | `items` | Pixel | **New** |
   | Chapter 3: Gus's lamp | `story-miners-lamp` | 32×32 | `items` | Pixel | **New** |
   | Chapter 4: Rosa's recipe card | `story-recipe-card` | 32×32 | `items` | Pixel | **New** |
   | Chapter 5: an old map | `story-old-map` | 32×32 | `items` | Pixel | **New** |
   | Tools: Watering Can, Hoe, Brush, Pick, Hammer, Rod, Axe, five tiers each | `tool-<id>-<tier>` (`tool-pick-1` … `tool-pick-5`) | 32×32 | `items` | Pixel; one drawing a tool, tinted Basic (wood and dull iron), Copper, Iron, Gold, Mythril (a pale teal sheen) | **New** (35 frames) |
   | Barn | `stable` | 48×48 | `buildings` | — | Existing |
   | Kitchen | `kitchen` | 48×48 | `buildings` | — | Existing |
   | Mine, Quarry | `mine`, `quarry` | 48×48 | `buildings` | — | Existing |
   | Smelter, Cutter (and the Mill for cloth) | `mine-workbench`, `den-workbench`, `fields-workbench` | 48×48 | `buildings` | — | Existing |
   | The 80 dishes | `dish-<family>-<grade>` (eight families × G1–G10) | 32×32 | `dishes` | — | Existing |
   | Wool, the fleeces and the cloths | `wool`, `alpaca-fleece`, `cashmere-fleece`, `wool-cloth`, `alpaca-cloth`, `cashmere-cloth` | 32×32 | `items` | — | Existing |
   | Ores, stones, crystals and their refined forms | their 60 ids | 32×32 | `items` | — | Existing |
   | Hides and scales, bones and horns, essences | their 30 ids | 32×32 | `items` | — | Existing |
   | The rare crops' seeds | their crops' icons with F25's `farm/seed-packet` badge | — | `items`, `ui` | — | Existing (with F25) |

2. **The tools are drawn here, though CS19 put them in M6 (F38):** the brief for M5's art lists them, and as one drawing
   a tool with four tints they're cheap now and let the Forge (F36) start without waiting for art. No M5 screen shows
   them yet (every tool is Basic until the Forge). F38 keeps the requests board, the trophies, ribbons, decorations,
   chapters 6–8's story items and the last four busts.
3. **The busts follow F25's look** (its decision 2): full colour, since they speak beside Umas' busts from master data;
   head and shoulders, three-quarters toward image-right, transparent background, the light from the top front-left as
   in UA8, framed so a 128 pt circle or square crop keeps the face. They take the `cast` atlas's next four cells after
   F25's three, positions read from the JSON, never assumed.
4. **The `animals` atlas** follows the pixel families' index (`{ schemaVersion: 1, cell, width, height, frames }`), a
   48×48 grid, frames keyed by the farm's animal ids, so `AnimalKind` reads them directly.
5. **The `items` and `buildings` sheets grow** for their new frames; the farm reads frames by key.
6. **The story items** are keepsakes, not goods: the `story-` prefix keeps them apart from anything the farm sells.
   Each chapter's closing scene shows its item, and M6's Diary keeps them.
7. **Versioning:** each part is a minor after whatever uma-art is current when it lands, with a changeset naming the
   farm's M5 art and the part. Part A can carry F25's part A in one release if neither is out; part B the same with F25's
   part B. Each packet's decisions stand.
8. **Review:** a page in `packages/art/assets/previews/` with every new piece at native size and 2×, on light and dark
   grounds: the animals in a mock pen card of four; the products and feeds in a mock Warehouse row; the Coop and the
   post beside the Hub's farmlands buildings; each tool's five tints in a row; the story items (part A); the busts in a
   mock scene box beside F25's three (part B adds them). No owner gate: the owner sees them in play.

### Rules that hold (every art packet)

- No original-game content: no Uma, no original character or likeness, no master-data art in uma-art's sources or
  masters; screenshots with original art stay local.
- The farm runs on today's map, uma-kit's Phaser Hub, until M7: the buildings are Hub frames, not the HD-2D kit
  (FR16's `kit-farm` is M7's).
- Lean assets: the cheapest art that looks fine; no new pipeline.
- uma-farm's main JS stays ≤ 180 KB gzip: the `cast` atlas loads only with a scene and `animals` only with the ranch,
  and the items and buildings sheets stay small.
- `uma-work` and `uma-kit` aren't touched by this packet.
- The farm's manual changes when the packet that pins the art uses it, not here.

### Left to each part's worker

The drawing itself, within the decisions; the review page's layout; anything the art pipeline needs that the farm
doesn't see.

## Do

**Part A, Claude (a uma-platform session):**

1. Draw the pixel pieces in `scripts/pixel-art` (decision 1: the products, feeds, story items and tools in `items`;
   the animals in the new `animals` atlas; the Coop and the post in `buildings`), exported by `pnpm art:draw`, with tests
   like the other pixel families' (sizes, keys, every earlier frame byte-identical).
2. Update `packages/art/README.md` (the `animals` family, the new `items` and `buildings` frames) and add the changeset.
3. Build the review page (decision 8, without the busts).
4. Commit and push to uma-platform's `main` (its CLAUDE.md), then `pnpm version-packages`, push, and read the published
   release back.

**Part B, ChatGPT:**

1. Draw the four busts as authored masters with their prompts and provenance, exported by `pnpm art:props` into the
   `cast` atlas (decisions 3 and the cast's looks).
2. Add the `cast` atlas's next cells to `packages/art/README.md`, the busts to the review page, and the changeset.
3. Open a pull request in uma-platform, merge it once its checks pass, version and publish uma-art, and read the
   release back.

## Done when

- uma-art's checks pass, and every frame published before is byte-identical.
- The releases are on GitHub Packages, and their `items`, `animals`, `buildings` (part A) and `cast` (part B) indexes
  list every key in decision 1 marked New.
- The review page shows every new piece at 1× and 2× on both grounds.
- The farm side, for whoever pins it: `@luismlorenzana/uma-art` at the new version installs in uma-farm, and its
  `pnpm lint`, `pnpm test` and `pnpm build` pass unchanged.

## Deliver

Each part: in uma-platform, its uma-art release published by its own worker (P126, uma-farm's
[CLAUDE.md](../../../CLAUDE.md)) and a P-decision. Then in uma-farm: a Done row in [the handoff](../README.md) for the part
with the release's version and the review page, and the part's D-decision in [decisions.md](../../decisions.md) (fetch
`main` first for the number); Claude pushes to `main`, ChatGPT uses a branch and a pull request it merges itself. The
second part to finish deletes this packet. The first uma-farm packet built after the release pins the version and drops
the stand-ins its M5 predecessors left.
