# F78 — The town map

**uma-farm · Claude · M · Needs: F74, F77 · Unblocks: F79 · [Design](../../design/game-design.md#the-town) ·
[Roadmap](../../roadmap.md#the-rework-2026-11-14): step 5**

> A town map you move around in landscape. Each location shows who's there now, and each Uma has a menu of things to
> do with her, each costing actions. Every Uma is in town from day one, waiting to be introduced to.

## Why

The owner: "author a full town map that is navigatable to different locations, then have menus to show currently present
Umas in those locations"; "All Umas should be initially available in the town map for the PoV character to introduce
himself to them"; "their current place in town, goals and objectives can be found authored by Uma Story".

## Decided

1. **The map:**
   - the town's spots: the plaza, the market, the café, the harbour, the library and the hilltop track (their names and
     lines from the pack's `town.json` and `world.json`);
   - the town's shops and offices: the general store, the rancher's, the mayor's office (loans from F81), the smith;
   - the Umas' homes and workplaces the story adds;
   - tap a location to go there; the town's own Umas are at their posts.
2. **Going into town costs 1 action.** Moving between locations once there is free, and so is shopping, ordering a build,
   or borrowing.
3. **Who's where:**
   - each Uma's place comes from the story: her home, her part-time job and where it is, the spots she likes, and when
     (new optional pack fields, `home`, `job` and `routine`, added to the menu);
   - an Uma with none is placed by today's seeded draw, as F66 does;
   - a location lists who's there now, with faces.
4. **Her menu** (each item costs the design's actions):
   - introduce yourself, if you haven't met;
   - talk;
   - give a gift;
   - invite her to a hangout (friend) or a date (sweetheart);
   - invite her to work (friend);
   - her event, when it's ready.

   Talks, gifts and events play through F75.
5. **No welcome week** (the owner, 2026-11-14): nobody comes to the Gate on her own, and meeting is introducing
   yourself. Triggers to meet retire. Her chapters' gates stay.
6. **The save:** per Uma, met or not, and her last talk and gift day. v4 grows in place, or starts over with F77's
   start-over.

## Do

1. The domain: locations, presence from routines or the draw, her menu's rules and costs, and introductions, with tests.
2. The web: the town map, a location's panel, her menu.
3. The pack's new fields in `docs/story-pack.md` and the reader.
4. Update [the game mechanics](../../game-mechanics.md).

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass.
- At 844×390:
  - you go into town, move between locations, introduce yourself to an Uma, talk and give a gift;
  - each costs its action;
  - an Uma with a routine is where it says.
- **The owner's phone check:** "Go into town and meet three Umas you choose."

## Deliver

Branch `feat/f78-town-map` and a pull request; merge and deploy. In it:
- the packet deleted;
- the roadmap's step removed;
- [the handoff](../README.md) updated.

## Left to the worker

- the map's layout and look, until art;
- how a crowded location lists its Umas.
