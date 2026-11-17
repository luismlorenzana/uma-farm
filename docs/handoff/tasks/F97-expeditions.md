# F97 — Expeditions

**uma-farm · Claude · L · Needs: — · [Phase 2.4](../../roadmap.md#phase-2-the-whole-farm), [farmhands](../../game-mechanics.md#farmhands)**

> From Farm Rank 7 you can build the expedition post in town. There you send a party of up to four farmhands to one of
> seven regions, with dishes from the Kitchen packed as supplies. The party is away for two to five days, neither on the
> farm nor in town. It comes back with loot to ship (hides and scales, bones and horns, essences) and a result: Great,
> Success or Retreat. Each member gains Expeditions rank points, and each pair gains bond points. The post keeps a log of
> every return.

## Why

The roadmap's step 2.4, "The sea and expeditions", is the next piece of Phase 2. The dock and the boat's spots are
already in: the Dock opens the Sea Pier, and the Boat opens the Deep Sea
([the Fishery's spots](../../game-mechanics.md#the-fisherys-spots)). So this packet is expeditions alone.

The game already defines a lot of expeditions, and none of it plays yet:

- **The save:** `expeditions` holds up to 3, each with a region, a party of 1–4, 0–8 supplies, and `left` and `back`.
  `REGION_IDS` has the seven regions.
- **The place:** the Expedition post (`expeditions`), in town, offered at Farm Rank 7 for 25,000g, 60 planks and 40
  fillets, drawn with the borrowed `rangers-lodge`.
- **Her power:**
  - her Expeditions talent, the mean of her three best stat scores, on its own cut-offs; its step gives +0 to +14;
  - her Expeditions rank, Novice 10 to Legend 60.
- **What it pays:**
  - the 30 loot goods, ten tiers each of hides and scales (×1.5), bones and horns (×1.6) and essences (×1.8);
  - rank points: 10 a day away, +10 on a Success, +20 on a Great;
  - bonds: +15 a pair for each day away.
- **The Diary:** the Expeditions row ("Return from 2 expeditions" … "A Success at the Sky Ruins").
- **The story:** `work: expeditions`, whose play is a rhythm with the pack.

[The farm at scale](../../game-mechanics.md#the-farm-at-scale-10-20-and-50-umas) after F95: farmhands come on their farm
days, about two thirds of them a day, and all are in real jobs. So expeditions aren't needed to soak up idle hands. They
are a new place to staff and a new kind of income, a few days at a time.

## Read first

- [The game mechanics](../../game-mechanics.md):
  - [farmhands](../../game-mechanics.md#farmhands) and their farm days;
  - [talents](../../game-mechanics.md#talents) and [what a talent gives](../../game-mechanics.md#what-a-talent-gives);
  - [rank points](../../game-mechanics.md#rank-points), [what a rank gives](../../game-mechanics.md#what-a-rank-gives) and
    the Diary's challenges;
  - [bonds](../../game-mechanics.md#bonds-and-ties), [food](../../game-mechanics.md#food) and [the Kitchen](../../game-mechanics.md#the-kitchen) (dishes);
  - goods and prices, and [the farm's progress](../../game-mechanics.md#the-farms-progress) (the post's build card);
  - [occasion scenes](../../game-mechanics.md#occasion-scenes): an occasion is never gated by where she is.
- Code (domain):
  - `save/v4.ts`: `Expedition`, `REGION_IDS`;
  - `save/parse-loop.ts`: `parseExpeditions`;
  - `farm/places.ts` (the post), `farm/talents.ts` (`expeditionScore`, `expeditionTalent`), `farm/ranks.ts`;
  - `farm/rank-rules.ts` (its `expedition` work), `farm/bonds.ts`, `goods/ids.ts` (the loot);
  - `town/town.ts` (`onFarmToday`, `worksOn`, `townDay`), `farm/food.ts`, `night/end-day.ts`.
- Code (web): the town's Menu and its places, `town/MayorSheet.tsx` for a town sheet's shape, the Book's work board,
  `loop/HeartProfile.tsx` (Where to find her) and `loop/summary-words.ts`.
- **Never read the story's text.** Work from field names and ids, and write tests from `@luismlorenzana/uma-data/testing`
  and the invented stand-in pack.

## Decided

1. **The post:** it's built as listed (Farm Rank 7; 25,000g, 60 planks and 40 fillets), and stands in town. It has
   no levels.
   - It sends one party at a time, two from Farm Rank 8, and three from Farm Rank 9. The save's cap is 3.
2. **The regions,** each with a level, its days away and the Farm Rank that opens it:

   | Region | Level | Days away | Opens at | Loot tiers |
   |---|---|---|---|---|
   | Old Fort Ruins | 1 | 2 | Farm Rank 7 | 1–2 |
   | Echo Cave | 5 | 2 | Farm Rank 7 | 2–3 |
   | Hilltop Track | 10 | 3 | Farm Rank 8 | 3–5 |
   | Misty Marsh | 15 | 3 | Farm Rank 8 | 4–6 |
   | Sunken Temple | 20 | 4 | Farm Rank 9 | 5–7 |
   | Ember Peak | 25 | 4 | Farm Rank 9 | 7–9 |
   | Sky Ruins | 30 | 5 | Farm Rank 10 | 8–10 |

   Each region leans to a family: ruins and the temple to bones and horns, the cave and the marsh to hides and scales,
   the track and the peaks to essences. The others still drop, at a lower share.
3. **The party is one to four farmhands:**
   - She's a farmhand, from the Farmhand stage on (spouses too), and not away already.
   - Being away is her only block. Her farm days and town days don't matter: an expedition takes her from both.
   - A party member can't also be the Kitchen's assistant or the Contest's cook on the day she leaves.
4. **Sending a party** costs one action, at the post in town. It leaves that night, after the farmhands' work, and is
   back on the morning of `left + days`.
   - **Its meals go with it:** two meals a member for each day away, from the pantry when it leaves. Takeout covers any
     shortfall, at 15g a meal, on that night's bill.
   - **Supplies** are up to eight dishes from the Kitchen, taken from the Warehouse when it leaves. Each dish adds power
     by its stars (2 a star).
5. **Away:**
   - She isn't on the farm and isn't in town. `onFarmToday` is false, she's off the town's map, she doesn't work the
     board, and she doesn't eat on the farm.
   - Her profile, the town's People list and the work board say "Away · Echo Cave · back Summer 5".
   - **She's never kept from an occasion:** every occasion of hers plays from the calendar as now (F95's rule 8). Add a
     test: a farmhand away on a festival day plays her festival scene.
6. **Power and the result:**
   - **A member's power** is her rank's power plus her talent step's.
   - **The party's power** is the sum of the members' power, plus the supplies.
   - **The region's need** starts at 40 + 8 × its level (48 at level 1, 280 at the Sky Ruins). The simulation sets the
     final numbers.
   - **The result** reads the party's power over the need, times a draw of ±10% (`draw(uid, day, 'expedition', n)`):
     - 1.25 or more is a **Great**;
     - 1 or more is a **Success**;
     - below 1 is a **Retreat**. A Retreat brings half the loot, pays 10 rank points a day and no bonus, and still
       counts as a return.
7. **The loot** goes into the Warehouse on the morning it's back. It ships at its price, never refines, and joins the
   market's flood rule like any good.
   - **How much:** three goods a member for each day away. A Great adds half again.
   - **Which:** the region's tiers, drawn by its family shares.
   - **Its stars:** drawn like a haul's, with the party's mean Expeditions quality, +1 on a Great.
8. **What a return pays:**
   - each member's rank points: 10 a day away, +10 on a Success, +20 on a Great (already defined);
   - +15 bond points a pair for each day away (already defined);
   - each member's Diary count toward her Expeditions challenge.
   - The Farm Rank counts the loot shipped, as it counts any income.
9. **The log:** the post keeps its last 20 returns: the region, the party, the days, the result and the loot. It's a
   new optional save field, `expeditionLog`, and v5 grows in place.
   - The morning names each return in §2 Work done: "Back from Echo Cave · Success · 18 goods".
   - The story's `work: expeditions` lines play there when it writes them. Until then the default story's lines do.
10. **The screens:** the post's sheet in town has three parts:
    - **Regions:** each with its level, days and need, and its loot families. A region not open yet says
      "Farm Rank 8".
    - **Send a party:** pick the farmhands, each with her power; pick the supplies; see the party's power against the
      need, then **Send · 1**.
    - **Away and the log.**

    No new art: the regions are words and their loot's icons, and the post keeps `rangers-lodge`.

## Do

1. **Domain:**
   - The regions table and power.
   - Sending a party, with its blocks; the night it leaves (meals and supplies taken); and the morning it's back
     (result, loot, ranks, bonds, the Diary and the log).
   - "Away" is read by `onFarmToday`, `worksOn`, `townDay`, `whereYouMeet`, who eats and the work board.
   - Parse `expeditionLog`.
2. **Web:** the post's sheet; "Away" on her profile, the People list and the work board; and the morning's line.
3. **Simulations:**
   - Add expeditions to the farm at scale. From the post's Farm Rank on, the bot sends parties of the farmhands with the
     best power to the best region they can succeed at.
   - Set the need's final numbers against these targets:
     - four Novice farmhands with a D talent take a Great at the Old Fort Ruins and a Success at Echo Cave;
     - four Skilled farmhands take a Success at level 10;
     - four Masters take a Success at level 20;
     - the Sky Ruins need Masters with good talents and ★4+ supplies.
   - Write the numbers into the docs: parties a season, their share of income, and their income against what the same
     days earn on the farm.
4. **Docs:**
   - [The game mechanics](../../game-mechanics.md): a new **Expeditions** section, with its live tables (regions, power,
     results, loot).
   - Talents and ranks: expedition power is now read. The Diary row is live.
   - Farmhands: "Away".
   - The roadmap's rows: the workshops still to build, the farm's places, and Phase 2's 2.4.
   - [The handoff](../README.md). Then `pnpm docs:update`.

## Done when

- `pnpm lint`, `pnpm test` and `pnpm build` pass, and the simulation passes, with its numbers in the docs.
- **The rules,** each with a test:
  - sending takes the action, the meals and the supplies, and refuses a member who's away, not a farmhand, or the
    Kitchen's assistant that day;
  - while away she's not on the farm or in town, doesn't work and doesn't eat on the farm;
  - a festival occasion plays while she's away;
  - Great, Success and Retreat at their thresholds, each with its loot, rank points, bonds, Diary count and log line;
  - the number of parties at once by Farm Rank;
  - a save with `expeditions` and `expeditionLog` loads, and `account.updatedAt` is unchanged.
- **A local run:** on the dev farm with the post built, a party leaves, is "Away" on her profile and the town, and comes
  back with loot and a log line.
- **The owner's phone look:** once the farm reaches Farm Rank 7, the post's build card is in town. Nothing changes
  before then.

## Deliver

Branch `f97-expeditions` and a pull request. Claude merges it after review. Every rule change goes into
[the game mechanics](../../game-mechanics.md) in the same change. Delete this packet, and take its step off the roadmap.
