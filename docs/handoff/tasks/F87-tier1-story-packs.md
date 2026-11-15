# F87 — Tier 1's complete story packs

**uma-farm · Claude · M · Needs: F86 and the docs pass (both touch `docs/story-pack.md`) ·
[Story pack](../../story-pack.md)**

> Every piece of story the game reads for an Uma, laid out for the owner's ten Tier 1 Umas, filled with the default
> story and marked as such, so the story session sees each one whole, rewrites what it wants, checks what's left and
> ships complete packs on its own.

## Why

The owner (2026-11-14): "setup for my Tier 1 Umas (the first 10 from ranker) the complete story upload and structure
based on the default story so that my Story authoring session can look at it fully and publish complete story packs to
where they need to go without your intervention."

Today the pack is sparse by design: anything missing plays the default story, so the story session never sees the whole
of what an Uma needs. Five of Tier 1 have a route; the other five have only her bible. None has `home`, `job` or
`routine`, so each is in town about one day in seven (the town's draw), which makes her hard to meet and court.

**Tier 1** is the Uma Ranker's T1 board row, by character id, read from the private plan
`../uma-platform/content/authoring/ranker/plan.json` (the `umas` board's `order`, `tier: "T1"`). No name goes in git.

## Decided

1. **A complete Uma** is every piece the game reads for her, in the pack's own shapes ([the menu](../../story-pack.md)):
   - **her cast entry:** `home`, `job`, `routine` and her chapters;
   - **her bible** (`umas/<id>.json`): her talks for each stage, her gift reactions, `mornings`, `meals`, and the rest
     the menu lists for a bible;
   - **her route** (`routes/<id>.json`):
     - her meeting;
     - Friendship 1–10, the confession, Romance 1–10, the proposal, the wedding;
     - `wedding-night`, `moving-in`, Spouse 1–5 (`s2` and `s4` included), `invited-to-work`;
     - each evening's scene (`hangout-<kind>`, `date-<kind>`, `dinner-in-town`, `a-night-in`);
     - her occasions (New Year's, the Flower Show, the Fishing Derby's night, her birthday).
2. **`pnpm story:scaffold`** (`--tier 1`, or `--ids <id,…>`; `--dry-run` lists without writing):
   - writes into `content/story/` (or `STORY_DIR`) **only what's missing** for each Uma. Never overwrites a piece
     already written; a re-run fills only what's still missing;
   - fills each piece from the default story, rendered for her: her name from master data, `{farmer}` kept as the
     placeholder, her temperament from her bible (else the default);
   - marks each piece it writes `"draft": "default"`;
   - gives her cast entry a starter `home`, `job` and `routine` (marked the same): her favourite spot (`spot`) on four
     days of each season, offset by her order on the board so Tier 1 isn't all out on the same days;
   - copies every file it changes to a dated backup under the ignored `content/story-backups/` before writing;
   - prints, per Uma, what it wrote.
3. **The marker:**
   - the reader accepts `draft: "default"` on any piece and plays the piece as written. The marker changes nothing in
     play;
   - the checker counts a marked piece as "default, not hers yet";
   - a marked piece whose words differ from the default's gets a note ("rewritten? remove the marker").
4. **`pnpm story:status`** (`--tier 1`, `--ids`, or all with a route), per Uma, as a table:
   - hers, default and missing, by part (cast, bible, route);
   - the list of what's left.

   `story:ship`'s check prints the same for every Uma it ships, and the Farm Story Sandbox shows it on each character.
5. **The story-pack doc** gains "A complete Uma": the checklist, the marker, and the routine: scaffold, rewrite, status,
   ship. Nothing else needs the game's sessions: `story:ship` already publishes to the bucket and backs up.
6. **After merge,** the main session runs the scaffold for Tier 1 in the main checkout (a dry run first) and tells the
   story session it's there.

Nothing in the game's rules changes. A pack with markers plays exactly as the same pack without them.

## Do

1. The reader and checker: the marker, and the default-versus-hers count (domain, with tests).
2. `scripts/story/scaffold.mjs` and `scripts/story/status.mjs`, with tests on a synthetic cast (no private content).
3. The sandbox's per-character status.
4. [The story pack's menu](../../story-pack.md): "A complete Uma".

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- On a copy of the pack: `story:scaffold --tier 1 --dry-run` lists every missing piece for the ten. The real run
  writes them, and a second run writes nothing. `story:status --tier 1` shows each Uma complete, the new pieces as
  default.
- The scaffolded pack's check reports no errors, and the game plays a scaffolded Uma exactly as before.

## Deliver

Branch `feat/f87-tier1-story-packs` and a pull request; merge and deploy. In it:
- the packet deleted;
- [the handoff](../README.md) updated.

## Left to the worker

- how the sandbox shows the status;
- the starter routine's exact days.
