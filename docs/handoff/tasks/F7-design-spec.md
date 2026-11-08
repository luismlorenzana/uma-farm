# F7 — The design spec

**uma-farm · Claude · L · Needs: F4 (to start), the owner's play after F6 (to finish) · Unblocks: F8, F9, F10, uma-platform's PO1 · Milestone M3**

## Why

F4–F6 make the farm a faithful copy of uma-rpg's Wilds. This spec decides what the farm becomes beyond the copy: who
works, what replaces targets, its own economy with no fights, the Forge, what each game accepts, and the Post. M4's and
M5's packets are written from it (FW1).

## Context (read first)

- [first-playable.md](../../design/first-playable.md): R10, FW1, FW10, FW12, and M4–M5's tasks; [plan.md](../../design/plan.md)
  Phase 3, FM6, FM9–FM14, and [how a parcel travels](../../design/plan.md#how-a-parcel-travels).
- `docs/game/` as built after F6, and the owner's few days of play.
- **The bar:** uma-rpg's `docs/design/tier-rework/class-progression.md` (read at `30a322a`): ids on every call, tables,
  worked numbers, a preview page.
- uma-quest's design spec (its Q17) for its accept list: the tonic, the party meal and the revive (its D4, DN14).
- uma-platform's [new-apps doc](https://github.com/luismlorenzana/uma-platform/blob/main/docs/new-apps/README.md):
  PO1's shape.

## Decisions made

- **The spec is one doc,** `docs/design/spec.md` (calls FS1…), with its page `docs/design/previews/spec.html`, each
  section a requirement of R10:
  1. **Who works:** FM6 measured against the play (how many Umas were used, how many slots stayed empty), and whether
     the crew grows;
  2. **Targets:** what replaces uma-rpg's gear targets, for example a game's order ("uma-quest wants 10 tonics");
  3. **The farm's economy:** what it earns and spends with no fights, whether Speed Tickets return, and where surplus
     goes;
  4. **The Forge:** its minigame (about 30 seconds, skill over luck, never losing inputs; FM9), what better play gives,
     its screen as a mockup, and what it costs;
  5. **Accept lists and caps (FM13, FM14):** each game's list as that game's session writes it; uma-quest's from its
     Q17, uma-rpg's and uma-racer's proposed for their sessions;
  6. **The Post:** the outbox, sent parcels and their claims, as screens;
  7. **The queue:** F8, F9 and F10 as packets, and the request for PO1.
- **Start early, finish after play:** sections 2–4 and 6 can be drafted from F4's rules; sections 1 and 5 wait for the
  play and for uma-quest's Q17. A section that can't be settled yet says what it waits on.
- **No open questions (the owner's rule):** every choice is a call with a recommendation. The owner reads the spec and
  answers it once.

## Do

1. Draft the spec and its page beside F4–F6, section by section.
2. After the owner's play: measure FM6 from the save (Umas used, slots filled, Craft Levels reached), and finish
   sections 1 and 5.
3. Ask the owner to read it, in one line with the page's link; take the answers into the calls.
4. Write F8, F9 (ChatGPT's art packet, for uma-art) and F10 in `docs/handoff/tasks/`, and send uma-platform the PO1
   request through its change protocol, once uma-quest's accept list exists.

## Done when

- The owner has read and answered the spec.
- The Forge's minigame is designed, with its screen.
- F8, F9 and F10 are written as packets; PO1 is requested from uma-platform.

## Deliver

Commit to `main` (`docs(design): …`), push. Delete this packet, add a Done row in [the handoff](../README.md), and log
the packet's D-decision (fetch `main` first).
