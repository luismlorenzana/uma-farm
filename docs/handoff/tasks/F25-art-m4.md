# F25 — Art for M4

**uma-platform's `packages/art` (uma-art) · Part A: Claude · Part B: ChatGPT (uma-platform P126, uma-farm D45) · M ·
Needs: F7 read · Unblocks: the first M4 packet built after its release pins it · Milestone M4, the loop on today's map**

> **Two parts, two workers (P126, 2026-11-11).** The owner moved ChatGPT onto character art. **Part A, the pixel pieces**
> (the Dorm, the shipping bin, the seed-packet badge and the nine marks), is code-drawn pixel art, so it's Claude's in a
> uma-platform session ("Take F25, part A"). **Part B, the three busts**, is character art, so it stays ChatGPT's ("Take
> F25, part B"). Each part ships its own uma-art minor; neither waits on the other.

## Why

M4's loop needs a little new art and borrows everything else from uma-art 2.21.0 (CS19): two Hub buildings for the
yard, a badge that turns a crop's icon into its seeds, nine small marks for the account bar and the goods, and busts
for the three townsfolk who speak in chapter 1's scenes. Each part is drawn, versioned and published as a uma-art
release by its worker (P126), and the first uma-farm packet that uses it pins it.

## Context (read first)

- [core-spec.md](../../design/core-spec.md): **CS19** ("What needs new art", its M4 rows), CS41 (the town's cast),
  CS42 (chapter 1's scenes), CS4 (the seasons), CS26 (stars), CS39 (the Farm Rank), CS44 and CS45 (bond and affinity
  hearts), CS55's F25 row.
- [core-loop.md](../../design/core-loop.md): FC24 (an original cast; Umas only in roles), FC28 (the map's rows).
- uma-platform: its [change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)
  ("Art: the game's session writes a ChatGPT packet, and the art ships in uma-art"), `packages/art/README.md` (every
  family's sheet and index format), `packages/art/CHANGELOG.md` (2.24.0 is the newest on 2026-11-08), the pixel
  families' source in `scripts/pixel-art` (`pnpm art:draw`), the authored families' in `scripts/authored-art`
  (`pnpm art:props`), and UA8's held items and emote bubbles as the model for an authored, full-colour family.
- uma-farm today: it pins uma-art **2.21.0**; the Hub map (uma-kit's `HubMap`) draws `buildings` frames at 48×48; the
  account bar's chips draw `ui` marks through uma-kit's `UiMark` (16×16 currency marks); item icons are 32×32 from
  `items`.

## Decisions made

### From the spec

- **M4's rows of CS19's art table** (the rest is F29's in M5 and F38's in M6):

  | For | Art | Milestone |
  |---|---|---|
  | Places on today's map | **Dorm**, **shipping bin** (Hub buildings, 48×48) | M4 |
  | Shop goods | a **seed packet** badge drawn over a crop's icon | M4 |
  | UI marks | **gold coin, star, heart (bond), heart (affinity), Farm Rank crest, calendar seasons ×4** | M4 |
  | The town's cast | **Mayor Hollis Pryor, Marta Quill, Old Ben Carver**: bust portraits for scenes | M4 |
- **Not in this packet:** Egg, Duck Egg, Milk and Goat Milk, Chicken Feed and Fodder, the seven animals, the Coop and
  the expedition post, four more cast busts (F29, M5); the tools in five tiers, the requests board, trophies, ribbons,
  decorations and the last four busts (F38, M6). Everything else on the map reuses uma-art's buildings (CS19).
- **The cast is original** (CS41): their names and looks live in git. No Uma, no character from the original game, and
  no likeness of one.
  - **Mayor Hollis Pryor** runs the town and opens each chapter: an older, kindly civic figure.
  - **Marta Quill** keeps the general store: brisk and warm, a shopkeeper's apron.
  - **Old Ben Carver** kept the farm before you and gives the first seeds: weathered, a straw hat, a farmer's hands.
- **Every existing frame stays byte-identical,** as in every uma-art release.

### Decided here (the spec left these open)

1. **The pieces, their sizes and families:**

   | Piece | Key | Size | Family (atlas) | Style | Part |
   |---|---|---|---|---|---|
   | Dorm | `dorm` | 48×48 | `buildings`, page `farmlands`, with `anchorY` (and `smoke` if it has a chimney) | Pixel, the Hub buildings' palette and light | A, Claude |
   | Shipping bin | `shipping-bin` | 48×48 | `buildings`, page `farmlands`, with `anchorY` | Pixel; a wooden bin with a lid, readable at 48 px | A, Claude |
   | Seed packet badge | `farm/seed-packet` | 16×16 | `ui` | Pixel; a small paper packet, drawn at the bottom-right of a 32×32 crop icon, readable over any of the 27 | A, Claude |
   | Gold coin | `currency/gold` | 16×16 | `ui` | Pixel, beside the existing currency marks | A, Claude |
   | Star | `farm/star` | 16×16 | `ui` | Pixel; a goods' quality star | A, Claude |
   | Heart, bond | `farm/heart-bond` | 16×16 | `ui` | Pixel; between two Umas, warm red | A, Claude |
   | Heart, affinity | `farm/heart-affinity` | 16×16 | `ui` | Pixel; yours with one Uma, a different hue from the bond heart | A, Claude |
   | Farm Rank crest | `farm/rank` | 16×16 | `ui` | Pixel; a farm's crest, distinct from the `tier/*` crests | A, Claude |
   | Seasons | `season/spring`, `season/summer`, `season/autumn`, `season/winter` | 16×16 each | `ui` | Pixel; a blossom, a sun, a leaf, a snowflake, each in its season's colour | A, Claude |
   | Mayor Hollis Pryor | `cast/hollis-pryor` | 256×256 | a new `cast` atlas | Authored full colour, UA8's method | B, ChatGPT |
   | Marta Quill | `cast/marta-quill` | 256×256 | `cast` | Authored full colour | B, ChatGPT |
   | Old Ben Carver | `cast/ben-carver` | 256×256 | `cast` | Authored full colour | B, ChatGPT |
2. **The busts are full colour,** since they speak beside Umas' busts from master data (full-colour art); pixel art next
   to them would clash. Head and shoulders, facing three-quarters toward image-right, transparent background, the light
   from the top front-left as in UA8, framed so a 128 pt circle or square crop keeps the face.
3. **The `cast` atlas** is a 4 × 3 grid of 256×256 cells (1024×768), so M5's and M6's eight busts fill it without moving
   these three. Its index follows the other authored families: `{ schemaVersion: 1, cell, width, height, frames }`, each
   frame `{ x, y, w, h, name }` keyed `cast/<id>`.
4. **The `ui` sheet grows** for the nine marks and the badge, with new groups `farm` and `season` and the coin in
   `currency`. Positions come from the JSON, never assumed.
5. **The buildings sheet grows** for its two frames; the farm reads frames by key.
6. **Versioning:** each part is a minor after whatever uma-art is current when it lands (2.25.0 for the first if nothing
   comes first), with a changeset naming the farm's M4 art and the part.
7. **Review:** a page in `packages/art/assets/previews/` with every piece at native size and 2×, on light and dark
   grounds, the badge over five crop icons, the marks in a mock account bar (coin, season and crest chips) (part A), and
   the busts in a mock scene box (part B adds them). No owner gate: the owner sees them at the next phone check.

### Rules that hold (every M4 packet, as they touch art)

- No original-game content: no Uma, no original character or likeness, no master-data art in uma-art's sources or
  masters; screenshots with original art stay local.
- The farm runs on today's map, uma-kit's Phaser Hub, until M7: the buildings are Hub frames, not the HD-2D kit (FR16's
  `kit-farm` is M7's).
- Lean assets: the cheapest art that looks fine; no new pipeline.
- uma-farm's main JS stays ≤ 180 KB gzip: the `cast` atlas loads only with a scene, and the marks and buildings sheets
  stay small.
- `uma-work` and `uma-kit` aren't touched by this packet.
- The farm's manual changes when the packet that pins the art uses it, not here.

### Left to each part's worker

The drawing itself, within the decisions; the review page's layout; anything the art pipeline needs that the farm doesn't
see.

## Do

**Part A, Claude (a uma-platform session):**

1. Draw the pixel pieces in `scripts/pixel-art` (decision 1), exported by `pnpm art:draw`, with tests like the other
   pixel families' (sizes, keys, every earlier frame byte-identical).
2. Update `packages/art/README.md` (the new `ui` groups and the two buildings) and add the changeset.
3. Build the review page (decision 7, without the busts).
4. Commit and push to uma-platform's `main` (its CLAUDE.md), then `pnpm version-packages`, push, and read the published
   release back.

**Part B, ChatGPT:**

1. Draw the three busts as authored masters with their prompts and provenance, exported by `pnpm art:props` into the new
   `cast` atlas (decisions 2, 3).
2. Add the `cast` family to `packages/art/README.md`, the busts to the review page, and the changeset.
3. Open a pull request in uma-platform, merge it once its checks pass, version and publish uma-art, and read the
   release back.

## Done when

- uma-art's checks pass, and every frame published before is byte-identical.
- The releases are on GitHub Packages, and their `buildings`, `ui` (part A) and `cast` (part B) indexes list every key in
  decision 1.
- The review page shows every piece at 1× and 2× on both grounds.
- The farm side, for whoever pins it: `@luismlorenzana/uma-art` at the new version installs in uma-farm, and its
  `pnpm lint`, `pnpm test` and `pnpm build` pass unchanged.

## Deliver

Each part: in uma-platform, its uma-art release published by its own worker (P126, uma-farm's
[CLAUDE.md](../../../CLAUDE.md)) and a P-decision. Then in uma-farm: a Done row in [the handoff](../README.md) for the part
with the release's version and the review page, and the part's D-decision in [decisions.md](../../decisions.md) (fetch
`main` first for the number); Claude pushes to `main`, ChatGPT uses a branch and a pull request it merges itself. The
second part to finish deletes this packet. The first uma-farm packet that draws the art pins the version.
