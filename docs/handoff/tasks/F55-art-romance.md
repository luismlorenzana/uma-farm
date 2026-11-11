# F55 — Art for the romance core: the homestead, the ring bench's mark, the Hearts marks, the plays' icons

**uma-platform's `packages/art` (uma-art) · Claude, in a uma-platform session (D45, P126) · S · Needs: F41 read
(accepted whole, D47) · Unblocks: F54 pins it (or the first romance-core packet built after its release) · Milestone:
the romance core**

> **Take it in a uma-platform session** ("Take F55"): the pieces are code-drawn pixel art in uma-platform's
> `scripts/pixel-art`, so they're Claude's end to end there (D45), and that session versions and publishes the uma-art
> minor. Character art (busts, expressions, event illustrations) is **not** here: it's private, later, ChatGPT's, and
> ships in the story pack, never in uma-art (RM61). It can start any time; nothing in the farm waits on it.

## Why

The romance core draws a few new things on the phone: the Farmhouse and the houses on the map, a mark for the ring
bench, the Hearts tab's marks (a heart for each stage, banked, Ready, the evening, an invitation, a Memory's frame) and
an icon for each of the five plays. Each is small, pixel, and drawn the way uma-art's pixel families already are. The
farm builds on stand-ins and pins this release when it lands (RM62).

## Context (read first)

- uma-farm's [romance-spec.md](../../design/romance-spec.md): **RM62** (the pixel pieces and their fallbacks), RM41 (the
  homestead and its houses: "one drawing in two sizes"), RM38 and RM40 (the ring bench at the Forge), RM11 (the stages'
  colours: coral, rose, gold), RM52 and RM53 (where the Hearts marks sit, with mockups), RM25 (the five plays), RM56
  (Memories' tiles), RM61 (character art is not uma-art's).
- uma-farm's [F25-art-m4.md](F25-art-m4.md) part A: the model for a Claude pixel packet (its `farm` group in `ui`, its
  sizes, its review page). If F25's part A has shipped, its `farm/*` marks (the bond and affinity hearts among them) are
  the style to match.
- uma-farm's [decisions.md](../../decisions.md): D45 (pixel art is Claude's, in uma-platform), D46, D47.
- uma-platform: its CLAUDE.md and [change protocol](https://github.com/luismlorenzana/uma-platform/blob/main/docs/change-protocol.md);
  `packages/art/README.md` (the `buildings` and `ui` families' sheets and index formats; read positions from the JSON,
  never assume them); `packages/art/CHANGELOG.md` (2.24.0 is the newest as this is written); `scripts/pixel-art`
  (`pnpm art:draw`), its tests and legacy freezes.
- uma-farm today: it pins uma-art 2.21.0; the Hub map draws `buildings` frames at 48×48; marks are drawn through
  uma-kit's `UiMark` at native size or a whole-number scale.

## Decisions made

### From the spec

- **RM62:** pixel pieces are Claude's (D45): **the homestead's Farmhouse and house in two sizes, the ring bench's mark,
  the Hearts marks (three stage hearts, banked, Ready, evening, invitation, Memory frame), and the five plays' small
  icons**, drawn in uma-platform's `scripts/pixel-art`. Until they ship, the farm uses stand-ins, and nothing waits on
  them.
- **RM41:** six houses share one exterior, drawn once; each is named by the player, so nothing about a house is written
  on its art.
- **RM11:** the stage colours are coral (friendship), rose (romance) and gold (spouse).
- **RM61:** busts, expressions and event illustrations are private and later, in the story pack's art folder, never in
  uma-art.

### Decided here (the spec left these open)

1. **The pieces, their keys, sizes and families:**

   | Piece | Key | Size | Family (atlas) | Notes |
   |---|---|---|---|---|
   | The Farmhouse | `farmhouse` | 48×48 | `buildings`, page `farmlands`, with `anchorY` and `smoke` | The farmer's home: a modest two-storey farmhouse with a porch and a chimney, warmer than the Dorm |
   | A house | `homestead-house` | 48×48 | `buildings`, page `farmlands`, with `anchorY` and `smoke` | One cottage for all six lots; reads well dimmed (an unbuilt lot is this frame locked) |
   | The Farmhouse, small | `homestead/farmhouse` | 24×24 | `ui`, new group `homestead` | The same drawing reduced for lists (the homestead's sheet, Tonight's Sleep at) |
   | A house, small | `homestead/house` | 24×24 | `ui`, `homestead` | The same |
   | The ring bench | `farm/ring-bench` | 24×24 | `ui`, group `farm` (F25 starts it; create it if F25 hasn't shipped) | A small anvil with a ring on it |
   | Friendship heart | `hearts/friendship` | 16×16 | `ui`, new group `hearts` | Coral |
   | Romance heart | `hearts/romance` | 16×16 | `ui`, `hearts` | Rose |
   | Spouse heart | `hearts/spouse` | 16×16 | `ui`, `hearts` | Gold, with a small band or ring |
   | Banked | `hearts/banked` | 16×16 | `ui`, `hearts` | A heart with a small stack beside it: points past a full bar |
   | Ready | `hearts/ready` | 16×16 | `ui`, `hearts` | A heart with a bright dot or spark: her event can play |
   | Evening | `hearts/evening` | 16×16 | `ui`, `hearts` | A crescent moon with a small heart |
   | Invitation | `hearts/invitation` | 16×16 | `ui`, `hearts` | An envelope sealed with a heart |
   | Memory frame | `hearts/memory-frame` | 48×48 | `ui`, `hearts` | A frame for a Memory's tile, transparent inside, its border usable as a 12 px nine-slice |
   | Cast | `play/cast` | 16×16 | `ui`, new group `play` | A rod and line |
   | Pick | `play/pick` | 16×16 | `ui`, `play` | A basket with a star |
   | Rhythm | `play/rhythm` | 16×16 | `ui`, `play` | A beat: a small drum or two notes |
   | Walk | `play/walk` | 16×16 | `ui`, `play` | A forked path |
   | Choose | `play/choose` | 16×16 | `ui`, `play` | Three small boxes, one ringed |

   Eighteen pieces: two Hub buildings and sixteen `ui` frames.
2. **The style:** the Hub buildings' palette and light (top front-left) for the two buildings and their small versions;
   the `ui` marks' outline and contrast for the rest, readable on the farm's light and dark grounds at 1× and 2×. The
   three stage hearts share one shape so only the colour changes stage; the coral, rose and gold sit apart from F25's
   bond and affinity hearts.
3. **Not here, said so the farm doesn't wait:** furniture (F54 shows its five pieces as words until M6's decorations),
   the Rhythm fallback's activity marks (a pot, an anvil, a tray, a track: F49 draws them as words), place cards for the
   romance backdrops (F49 borrows building frames), emote marks (uma-art 2.22.0's `emote` bubbles serve, F49), and any
   character art (RM61).
4. **The sheets grow without moving anything:** the `ui` sheet appends the new groups (positions from the JSON), and the
   `buildings` sheet appends its two frames; every frame published before stays byte-identical, frozen by a legacy test
   as the earlier releases did.
5. **Versioning:** a uma-art minor after whatever is current when it lands (2.25.0 if nothing comes first, or after
   F25's and F29's parts), with a changeset naming the farm's romance-core art.
6. **Review:** a page in `packages/art/assets/previews/` with every piece at 1× and 2× on light and dark grounds, the
   stage hearts in a mock Hearts row (a bar of segments), the plays' icons in a mock picker, the Memory frame around a
   sample tile, and the two buildings in a mock map row with one dimmed as a locked lot. No owner gate: the owner sees
   them at the go-live phone check (F56).

## Do

1. **Draw** the eighteen pieces in `scripts/pixel-art` (decisions 1, 2), exported by `pnpm art:draw`, with tests like the
   other pixel families' (sizes, keys, groups, every earlier frame byte-identical).
2. **Document** the new `ui` groups and the two buildings in `packages/art/README.md`; add the changeset.
3. **Build the review page** (decision 6).
4. **Release:** commit and push to uma-platform's `main` as its CLAUDE.md says, then `pnpm version-packages`, push, and
   read the published release back (its `buildings` and `ui` indexes list every key in decision 1). Log the P-decision.

## Done when

- uma-art's checks pass, and every frame published before is byte-identical.
- The release is on GitHub Packages, and its `buildings` and `ui` indexes list all eighteen keys at their sizes and
  groups.
- The review page shows every piece at 1× and 2× on both grounds.
- The farm side, for whoever pins it: `@luismlorenzana/uma-art` at the new version installs in uma-farm, and its
  `pnpm lint`, `pnpm test` and `pnpm build` pass unchanged (both size checks while the romance core is dark).

## Deliver

In uma-platform: the uma-art release, published by this session (D45, P126), and a P-decision. Then in uma-farm, on a
branch and a pull request for the main session to merge: delete this packet, mark its queue row Done and add a Done row
in [the handoff](../README.md) with the release's version and the review page, and log the D-decision in
[decisions.md](../../decisions.md) (fetch `main` first for the number). The first uma-farm packet that draws the art
pins the version: F54 at the latest (RM67), or F56 if F54 has already merged.

## Rules that hold

- **No original-game content:** no Uma, no original character or likeness, no master-data art in uma-art's sources or
  masters; screenshots with original art stay local. These pieces are buildings, marks and icons only.
- **RS2 holds in art too:** the farmer is never drawn; nothing in these pieces depicts the farmer or an Uma.
- **Lean assets:** the cheapest art that looks fine; no new pipeline, only `scripts/pixel-art`.
- **The farm runs on today's map,** uma-kit's Phaser Hub, until M7: the buildings are Hub frames, not the HD-2D kit.
- **uma-farm's main JS stays ≤ 180 KB gzip:** the `ui` sheet grows by a few small frames; the farm loads the marks with
  the screens that draw them.
- **`uma-work` and `uma-kit` aren't touched** by this packet.
- **The farm's manual changes when the packet that pins the art uses it,** not here.
- **The save, the dark switch and the romance's rules** are the farm's packets' business; this packet only publishes art.

## Left to the worker

The drawing itself, within decisions 1 and 2; the exact coral, rose and gold within the Hub's palette; the review page's
layout; anything the art pipeline needs that the farm doesn't see.
