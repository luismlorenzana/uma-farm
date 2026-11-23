# F114 · Tier 1 walking sprites and HD-2D

**Status · Live.** The Tier 1 batch and app deployment were verified. The next navigation and dialogue staging changes are specified in [F115](F115-hd2d-map-navigation.md).

F114 continues [Field and Pond](F103-hd2d-farm.md) and the painted town introduced in F113. The painted overview opens the six district maps. Their building footprints remain interactive. Each district can show its current residents and on-duty staff by the entrances. The Inn lobby and farm commons use current presence and room assignments. Date and festival walk-ons and solo and duo visits use the same wardrobe and animation timing.

| Scene | Wardrobe | Who can appear |
| --- | --- | --- |
| Field and Pond | Farm Work | Crew assigned to jobs on the visible field, woods, pond or shipping bin during the morning. The actual shift receipt supplies locations and action counts. |
| Painted town and outings | Spring | Umas in the current district and the cast of the active outing. |
| Inn lobby | Spring | Town residents currently at the Inn. |
| Farm commons | Spring by day, Pajamas at night | Farm residents present for the relevant part of the day. |
| Spouse visits and replays | Pajamas | The one or two participants saved on the visit. Birthday and anniversary dialogue can still use its own portraits, formal outfits and splashes. |

Each identity has Spring, Farm Work and Pajamas. The three variants use individual transparent, lossless WebP atlas pages. Each includes four distinct standing facings and four distinct walking loops. The shared player consumes the source timings, while the renderer positions boots relative to the drawn foot anchor. Scene assets load from the authenticated master data release. Field and Pond retains stand-ins for missing art. Town and indoor screens retain their people lists, established portraits and interactive controls.

## Acceptance and release

- Character Art receives the approved review sheets. Platform packs the separate runtime assets, writes a private verification receipt, and composes a candidate over the current live master release. Keep all approvals, image bytes and receipts in ignored content.
- Exercise all ten identities and all three variants using the candidate. Verify timing, actual crew work, day off and expedition behavior, doors and scene controls, changing residence, duo visits and Library replays. Run solo and 10-, 20- and 50-Uma saves at 844 × 390 and 667 × 375. Check uncached and partial loads plus background and resume.
- Merge Platform and release the exact readers. Pin them in Farm and deploy through the standard CI. Promote the checked private candidate with its expected parent generation. Verify the deployed owner-signed-in app and measure on iPhone before raising actor limits.

## Next HD-2D surfaces

[F115](F115-hd2d-map-navigation.md) defines the six Farm regions, local HD-2D scenes, building interiors and direct sprite taps. F103 tracks the iPhone environment and performance review.
