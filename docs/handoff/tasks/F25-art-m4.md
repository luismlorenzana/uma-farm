# F25 — Chapter 1's art: the pixel pieces and the town cast's busts

**uma-platform's `packages/art` (uma-art) · Part A: Claude (shipped) · Part B: ChatGPT · M · Unblocks: the scene player
draws the busts, once a farm change pins part B's release · [Roadmap](../../roadmap.md#phase-1-one-game-not-three):
Phase 1, step 1.6**

> **Two parts, two workers.** ChatGPT draws character art only; Claude draws everything else in code. **Part A, the
> pixel pieces** (the Dorm, the shipping bin, the seed-packet badge and the nine marks), is code-drawn pixel art, so it
> was Claude's in a uma-platform session. **Part B, the three busts,** is character art, so it's ChatGPT's ("Take F25,
> part B"). Each part ships its own uma-art minor; neither waits on the other.
>
> **Part A has shipped** (uma-art 2.25.0), and the farm draws the Dorm, the shipping bin, the seed-packet badge and the
> marks. **Only part B is left:** the three busts. Whoever pins part B's release takes the farm side for the busts: the
> scene player's lettered discs give way to them.

## Why

The farm's loop needed a little new art and borrows everything else from uma-art: two Hub buildings for the yard, a
badge that turns a crop's icon into its seeds, nine small marks for the account bar and the goods, and busts for the
three townsfolk who speak in chapter 1's scenes. Each part is drawn, versioned and published as a uma-art release by its
worker, and the first uma-farm change that uses it pins it.

## Context (read first)

- [Game mechanics](../../game-mechanics.md):
  - [the town's cast](../../game-mechanics.md#the-towns-cast): who they are, original to the game; Umas appear in scenes
    only in roles;
  - [the scenes](../../game-mechanics.md#the-scenes) and [the scene player](../../game-mechanics.md#the-scene-player),
    where the busts show beside the line;
  - for part A's marks: the [seasons](../../game-mechanics.md#seasons-days-and-the-year), goods'
    [stars](../../game-mechanics.md#stars-and-prices), the [Farm Rank](../../game-mechanics.md#the-farm-rank), bonds
    and [affinity](../../game-mechanics.md#affinity), and the [map's rows](../../game-mechanics.md#home-the-farm-map).
- uma-platform: its [change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md)
  ("Art: the game's session writes a ChatGPT packet, and the art ships in uma-art"), `packages/art/README.md` (every
  family's sheet and index format), `packages/art/CHANGELOG.md`, the pixel families' source in `scripts/pixel-art`
  (`pnpm art:draw`), the authored families' in `scripts/authored-art` (`pnpm art:props`), and UA8's held items and emote
  bubbles (uma-art 2.22.0) as the model for an authored, full-colour family.
- uma-farm today: it pins uma-art **2.27.0**; the Hub map (uma-kit's `HubMap`) draws `buildings` frames at 48×48; the
  account bar's chips draw `ui` marks through uma-kit's `UiMark` (16×16 currency marks); item icons are 32×32 from
  `items`; the scene player shows each town cast member as a lettered disc until the busts come.

## Decisions made

### From the game

- **Chapter 1's art** (the rest comes with the workshops):

  | For | Art | Part |
  |---|---|---|
  | Places on today's map | **Dorm**, **shipping bin** (Hub buildings, 48×48) | A, shipped |
  | Shop goods | a **seed packet** badge drawn over a crop's icon | A, shipped |
  | UI marks | **gold coin, star, heart (bond), heart (affinity), Farm Rank crest, calendar seasons ×4** | A, shipped |
  | The town's cast | **Mayor Hollis Pryor, Marta Quill, Old Ben Carver**: bust portraits for scenes | B |
- **Not in this packet:** Egg, Duck Egg, Milk and Goat Milk, Chicken Feed and Fodder, the seven animals, the Coop and
  the expedition post, and four more cast busts (the ranch's art); the tools in five tiers, the requests board,
  trophies, ribbons, decorations and the last four busts (the later chapters' art). Each comes with its workshop
  ([the roadmap](../../roadmap.md#phase-2-the-whole-farm)). Everything else on the map reuses uma-art's buildings.
- **The cast is original:** their names and looks live in git. No Uma, no character from the original game, and no
  likeness of one.
  - **Mayor Hollis Pryor** runs the town and opens each chapter: an older, kindly civic figure.
  - **Marta Quill** keeps the general store: brisk and warm, a shopkeeper's apron.
  - **Old Ben Carver** kept the farm before you and gives the first seeds: weathered, a straw hat, a farmer's hands.
- **Every existing frame stays byte-identical,** as in every uma-art release.

### Decided here

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
3. **The `cast` atlas** is a 4 × 3 grid of 256×256 cells (1024×768), so the other eight busts fill it later without
   moving these three. Its index follows the other authored families:
   `{ schemaVersion: 1, cell, width, height, frames }`, each frame `{ x, y, w, h, name }` keyed `cast/<id>`.
4. **The `ui` sheet grows** for the nine marks and the badge, with new groups `farm` and `season` and the coin in
   `currency`. Positions come from the JSON, never assumed.
5. **The buildings sheet grows** for its two frames; the farm reads frames by key.
6. **Versioning:** each part is a minor after whatever uma-art is current when it lands, with a changeset naming the
   farm's chapter 1 art and the part.
7. **Review:** part A's page, uma-platform's `assets/previews/farm-m4.html`, shows every piece at native size and 2×, on
   light and dark grounds, the badge over five crop icons, and the marks in a mock account bar (coin, season and crest
   chips). Part B adds the busts in a mock scene box. No owner gate: the owner sees them at the next phone check.

### Rules that hold

- No original-game content: no Uma, no original character or likeness, no master-data art in uma-art's sources or
  masters; screenshots with original art stay local.
- This is the 2D Hub's and the scene player's art, not the HD-2D farm's kit: `kit-farm` is [F9](F9-kit-farm.md)'s.
- Lean assets: the cheapest art that looks fine; no new pipeline.
- uma-farm's main JS stays ≤ 180 KB gzip: the `cast` atlas loads only with a scene, and the marks and buildings sheets
  stay small.
- `uma-work` and `uma-kit` aren't touched by this packet.
- [The game mechanics](../../game-mechanics.md) change when the farm change that pins the art uses it, not here.

### Left to each part's worker

The drawing itself, within the decisions; the review page's layout; anything the art pipeline needs that the farm
doesn't see.

## Do

**Part A, Claude (a uma-platform session):** shipped. Its pieces are in `scripts/pixel-art`, and its review page is the
one part B adds to (decision 7).

**Part B, ChatGPT:**

1. Draw the three busts as authored masters with their prompts and provenance, exported by `pnpm art:props` into the new
   `cast` atlas (decisions 2, 3).
2. Add the `cast` family to `packages/art/README.md`, the busts to the review page, and the changeset.
3. Open a pull request in uma-platform, merge it once its checks pass, version and publish uma-art, and read the
   release back.

## Done when

- uma-art's checks pass, and every frame published before is byte-identical.
- The releases are on GitHub Packages, and their `buildings`, `ui` (part A) and `cast` (part B) indexes list every key
  in decision 1.
- The review page shows every piece at 1× and 2× on both grounds.
- The farm side, for whoever pins it: `@luismlorenzana/uma-art` at the new version installs in uma-farm, and its
  `pnpm lint`, `pnpm test` and `pnpm build` pass unchanged.

## Deliver

Part B: in uma-platform, its uma-art release published by ChatGPT itself (uma-farm's [CLAUDE.md](../../../CLAUDE.md)),
with a decision in uma-platform's log. Then in uma-farm, on a branch and a pull request ChatGPT merges itself: this
packet deleted (part B is the second part to finish), its rows taken out of [the handoff](../README.md) and step 1.6 out
of [the roadmap](../../roadmap.md#phase-1-one-game-not-three), and the release's version and the review page named in
the pull request. The first uma-farm change that draws the busts pins the version.
