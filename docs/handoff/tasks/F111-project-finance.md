# F111 — Project finance, wedding rings, and farm handoffs

**Status · Ready for implementation.** The numbers in this packet are the opening balance targets. Record any changes made in the playthroughs before updating the live rules.

## Player outcomes

- A solo farmer can save for and commission a real wedding ring through normal farming and courtship. The ring costs enough to be a milestone, and the farm can pay down its balance as it grows.
- The mayor can finance a 100,000g project. Three loans let the player combine gold, materials and milestone purchases. A good harvest can go toward whichever debt the player chooses.
- The Warehouse starts with a surplus policy for every item. Work, the bin and nighttime accounts use that policy with zero setup. The player can change an individual rule whenever they want.
- **What Next?**, Work and the ledger give the player a clear handoff between crew work, shortages to cover personally and decisions that need approval.

## Where the game stands

The mayor lends gold toward eligible buildings and the next cottage, with rank limits of 1,000g to 160,000g per loan and one slot before Rank 4, then two. The farmer brings the materials. Nightly payments are capped at roughly a tenth of the original balance per loan and the only manual payment is full payoff. A new farm starts with 500g and nine Carrot Seeds. The Mill costs 1,000g and 20 logs. It can be a normal early cash purchase.

The Ring Bench opens the morning after the first played Romance 8. A six-Pine-Log Copper Ring currently supports solo marriage. The Forge workshop separately opens at Rank 3 and has seven shared tools and four anniversary heirlooms. Its commissions give a price reference of 24,000g–96,000g in fees plus exact materials. The first cottage costs 8,000g and opens after the first wedding. The fifth costs 110,000g. These are examples of a larger purchase scale.

Hands can already work fields, save seed, care for animals, forage, chop, fish, mine, refine, cook household meals and ship qualifying surplus. Surplus shipping today takes a configured list and assignment and shares one crate of up to 50 items. The player buys shop seed and fodder, chooses builds and upgrades, hires and assigns the crew, runs authored activities and approves household and business decisions. Existing planting, cooking, station and grade controls remain the entry points for that work.

[Current loans](../../game-mechanics.md#loans) · [Forge and Ring Bench](../../game-mechanics.md#the-forge-workshop) · [Work](../../game-mechanics.md#farmhands) · [Shipping](../../game-mechanics.md#the-shipping-bin)

## 1. Credit for projects and supplies

| Term | Opening design |
|---|---|
| Shared credit | 100,000g of outstanding principal across the farm, available from Farm Rank 1. Use it through as many as three open loans. |
| Gold | A cash advance goes to the farm's wallet. Its quote shows the fee and total owed. The player's balance report records it as borrowing. |
| Goods | Lend quoted quantities of supplies, materials, refined metals, jewels and gemstones. The order names the exact item, grade, units and gold value. Repay its quoted balance in gold through the same ledger. |
| Named purchase | Finance part or all of the eligible gold bill for a build, expansion or commission. Pay the supplier in the same transaction. For a supported purchase with material shortages, show a combined quote for financed materials and gold. |
| Down payment | Show the cash contribution, financed principal and resulting wallet balance. The ring has its own 2,000g minimum. The 10,000g contribution in the project example is an example choice. |
| Fee | Charge 10% once on each new loan, rounded up to the next 10g as today. Track the fee separately from principal. The total owed includes both. |
| Available credit | Subtract outstanding principal from 100,000g. Payments cover remaining fee first, then restore headroom as they reduce principal. A slot reopens when its full balance reaches zero. |

### Offers and transactions

- Keep existing order eligibility for Farm Rank, buildings, prerequisites, materials, marriage milestones, daytime actions and delivery. Credit lets the player buy an eligible project earlier. The storefront needs to distinguish a money shortage, a material shortage, an unavailable supplier and a locked unlock.
- Start with the mayor's build and next-cottage offers, then quote farm plots, station and Kitchen capacity upgrades, seed and fodder restocks, livestock, Forge tool upgrades, qualifying heirlooms and Ring Bench commissions through their regular order screens. The mayor is the place to see all open debts and take gold or goods advances. Keep the normal cash purchase available.
- Define supplier availability and a single item quote source. Use a fixed unit price per offered exact item with the shop or stock catalogue as its input, and record it when the player confirms. List the actual contents and value of a material advance. Material credit respects the farm's actual unlocks and stock entitlement. The smith-sourced standard ring is the explicit early commission path for its own materials. Use purchases and financing only where the game rules already award the corresponding discovery. Farm-earned discoveries still require their qualifying action.
- Validate current gold, stock, eligibility, action availability, headroom and slots together before applying a purchase. Save the debit, goods or delivered order, debt and player action as one change. A failed quote or order leaves the player's balance, stock and actions intact. Reconfirm changed terms and reuse the normal save conflict rules on a retry.
- Preserve the current working economy. The player can borrow for seeds, fodder, materials, gems or spending gaps. Automatic restock suggestions and routine shipments never open a loan. Each commitment has a player confirmation.
- Provide a detailed quote before confirm with **Total cost**, **Pay now**, **Borrow**, **Fee**, **Total owed**, and **Credit left**. For goods, include each quantity and grade. On an unavailable offer say why and link to the next relevant step.

### Worked project quotes

| Case | Cash today | Principal | Fee | Balance |
|---|---:|---:|---:|---:|
| Build a 100,000g project with 10,000g of savings | 10,000g | 90,000g | 9,000g | 99,000g |
| Build the 110,000g fifth cottage with 10,000g of savings after the required weddings and lots | 10,000g | 100,000g | 10,000g | 110,000g |
| Finance the standard wedding ring after its 2,000g deposit | 2,000g | 18,000g | 1,800g | 19,800g |

A farm with 18,000g of ring principal and 5,000g of supply principal has 77,000g of credit remaining and one free slot. The player can inspect both figures before picking the next project.

## 2. Partial repayment and the ledger

- At the office, open any loan and enter a whole-gold payment up to the lesser of wallet gold and that loan's balance. Offer **Pay any amount** and **Pay off**. For a 99,000g balance, an extra 5,000g payment drops it to 94,000g. Confirm the amount, show the resulting wallet and balance, and free the slot immediately at zero. Manual payments may come from saved gold.
- On a night with positive sales, total actual settled shipping and Restaurant sales. Pay food, upkeep and overdue bills first. Allocate 20% of the remaining sales, rounded down to a whole gold, for all new loans together. Bound it again by the remaining balance and actual available cash. Apply it oldest first, use a stable ordering for same-day loans, and pass any unused portion of the night's payment to the next loan. Each note has the same priority on days its balance is unchanged.
- For example, 1,000g in sales and 300g in bills leave 700g. Repayment is 140g and the farm keeps 560g. With 300g in sales and 300g or more in bills, the automatic payment is 0g. A 20% payment is a deduction from available sales. Only the one-time 10% fee changes the total owed when a loan is issued.
- Keep deposits, manual payments and cash advances out of the automatic sales calculation. Use a shared check for income actually settled this night, so quoted sales, unsold stock, gifts and credit do not cause a payment. There is no missed-payment penalty when no sales remain. Older loans keep their original automatic terms. Apply those payments first, then budget the new sweep from what remains so the two mechanisms share the night's cash without counting the same gold twice.
- In the mayor's office and income/expenses page, show each original principal, fee, balance, available credit, last payment, and a paid-off record. Show shipping and Restaurant sales, seed and livestock purchases when tracked, food, upkeep, arrears, borrowing and repayments as distinct lines. Reconcile the day back to the wallet. Drive payoff estimates from recent amounts genuinely available to repay, with **Waiting for sales** when a date cannot be estimated.
- Refresh the Book, morning report and **What Next?** from the same balances. The morning reports what sold, bills, what went toward each loan, and what's left. Lead with the amounts the player needs to make a decision.

## 3. Wedding ring commissions

### Standard ring and first marriage

1. Play the first Romance 8 and finish the day. The smith introduces the standard commission when the Ring Bench opens the next morning, with a link to its quote in **What Next?**. Her own route still determines when the proposal is ready.
2. Commission a real Copper Ring using **two Copper Ingots and one Cut Quartz**. Start by testing an all-in quote of **20,000g**, with the smith able to supply the materials at this quote. List any matching stock the player can contribute, and test the resulting economics before offering a discount. The smith can complete the order from the solo path without the Mine, Smelter, Quarry, Cutter or Forge workshop.
3. Pay in full or put **2,000g** down and borrow **18,000g** at the quoted starting price. Show the materials, delivery date, total owed and when the ring can be collected before confirming. Use next-dawn delivery for the first balance pass. Keep the Ring Bench's own order allowance independent of Forge tools and heirlooms.
4. Use the finished ring to propose after Romance 10 under the usual relationship and wedding-date rules. The commission balance continues through ordinary repayments after the ring is delivered and the wedding proceeds. Track delivered rings and active proposals so they cannot be sold by automatic shipping or used for a second proposal.
5. Keep a standard commission available for subsequent marriages under the same pricing policy. The chain of 50 weddings should reward sustained production and saving. The price of the standard ring should be understandable before the player reaches Romance 10.

### Premium rings

- Price the top commissions at **100,000g or more**, with a distinct exact metal and cut gemstone requirement. Balance the upper tiers alongside the most expensive anniversary commissions. Use Farm Rank and real supplier or production availability for premium tiers and retain the existing ring-grade relationship and work effects unless the balance pass calls out a change.
- Catalogue the actual exact ingredients, quantities, fee, lead time and any already-supported effect for each premium ring implemented. Grades and material orders should read the current goods ladders. Establish the high-end recipe totals in the balance pass so the gold fee and the materials both matter. Use existing ring art and normal inventory entry points unless a separate asset is needed.
- Update new Ring Bench purchase paths together so an old shortcut cannot create a ring that bypasses the new commission for new orders. Keep rings already held or equipped, engagements and scheduled weddings valid. Existing anniversary heirlooms still use their own four Forge slots and outfit conditions. Manual resale, where offered, shows the actual sale value and keeps a clear distinction between the commission bill and a shipping quote.

## 4. Standard surplus for every item

The effective surplus definition comes from the current catalogue, the player's saved choices, and the farm's current commitments. It exists on the first day for every exact item and grade, including new items added after F111. It takes no work-board setup and requires no bulk save of default values. A count may be zero, an ordinary keep floor, or **Keep all**. The catalogue rule explains the default even for items currently out of stock.

### Starting policy

Use the table as the first pass for balance. Tune category values through the farm playthroughs. Compare grades independently and retain the best stars by default. An explicit line for an item can keep selected stars or the entire item.

| Item or use | Initial standard definition |
|---|---|
| Produce, fruit, ordinary animal goods, food fish and forage | Keep a small useful working stock of each exact item and grade. Start by testing 12 of common crops and 8 of other regular food inputs. |
| Less common ingredients and refined goods | Keep a separate reserve for each exact grade and form. Start by testing 6 each, then increase the protection where recipe or processing targets need more. |
| Ordinary construction materials | Protect an early building stock of logs, a useful batch of planks and fillets, and pinned project quantities. Test at least the first 20 Pine Logs before selling against that baseline. |
| Ores, stones, gems and refined metals, blocks and jewels | Keep stock by exact item and grade, and hold up to the applicable pinned order's requirement when a recipe calls for more than the baseline. Rare stock should remain available for tool and jewelry work. |
| Restaurant dishes | Reserve planned meal and recipe stock first. Allow a sale above that protection for shippable dishes. Track dishes by exact recipe and applicable quality. |
| Seeds, saved seed, fodder, household pantry, wedding rings, heirlooms and unique or story items | Keep all for automatic shipping. Clearly label items that also have special use or sale rules. Advancing a proposal, gifting heirlooms and ordinary stock use keep their existing entry points. |

### How it works

- The Warehouse shows the **standard reserve**, any **player override**, stock **needed for a project**, and the **available surplus**. Keep the base sale floor separate from hard protections so a normal stock target never prevents the farm from feeding itself or preparing an authorized order. Ordinary seed saving, meals and refining keep access to the stock those jobs need under the existing rules.
- For sales, use the player's override in place of the default if one exists. An explicit 0 is a valid override. Separately protect active station targets and quantities needed for pinned builds, meal or recipe goals, and confirmed or tracked tool and jewelry orders. Protect stock until those commitments are filled, completed or cleared. Count already reserved or spent stock once and release protection promptly when it no longer applies. A manual use of protected stock shows what it affects.
- Generate the crate from eligible items actually held, above their combined protections. Ship lower stars first. Make the selection stable and test that high-volume common goods cannot indefinitely crowd other qualifying stock out of the crate. Use the bin's current prices, easing and nightly settlement. Give the player a preview and the existing **Take back** action before settlement. The morning report records the actual amount shipped and sale value.
- On a solo farm, show the suggested crate at the bin. The player approves it in one action using the normal crate flow. On staffed farms, schedule surplus shipping automatically as a shared job for an eligible Uma with an action after the day's higher-priority field, animal, meal and production work. A farmhand stays on her actual rota. The job spends a real crew action, and keeps one farm-wide cap. If everyone is busy, the Work calendar shows **Shipping waits** and the suggested crate remains available.
- Start the balance pass with the existing 50-unit shared cap. Measure excess inventory, price easing, night receipts and crate starvation at 20 and 50 Umas. Tune crate capacity or scheduling where the larger farms repeatedly outgrow it. Preserve manual supplemental crates and the existing market for oversupply. A manual edit or a crew retry cannot queue a second automatic crate for the same turn.
- Let the player change the reserve per item, choose **Keep all**, pause automatic shipping, change the crate limit where supported, or restore standard defaults. Keep a user's explicit favourites and order where they configured a custom plan. Show what changing or restoring a setting affects before the next shipment. Allow new catalogue goods to inherit standards automatically under the standard plan.

## 5. Work handoffs and restocking

| Task | Crew or game helps today | F111 player handoff |
|---|---|---|
| Fields, orchards, and saved seed | Crew clears and tills, plants, irrigates, harvests and saves seed when assigned. | Show uncovered rows and seeds still needed for the current season and selected plantings. Link to the seasonal shop. The player approves the purchase. |
| Animals | Crew feeds from the silo, cuts grass when available, collects and cares. | Show low feed and a suggested buy quantity, current coverage and room in the silo. Link to the rancher. Livestock buys and herd changes remain player decisions. |
| Gathering and refining | Crew fishes, forages, chops, mines, works the Quarry and runs stock-target loads. | Explain missing inputs or unlocked suppliers. Link a pinned project to the right field, gathering spot or station. The player sets project or exact-grade priorities if desired. |
| Meals and Restaurant | Crew prepares routine household meals and can assist in staffed activities. | Hold food before surplus ships. The player runs authored cooking and Restaurant activities, approves what to sell or save, and chooses any specific recipe plan. |
| Shipping | The existing crew task can ship a configured shared crate. | Provide the standard crate automatically. Show who will ship, any uncovered shift, stock held back, and projected versus actual income. The player can add a manual crate or change the policy. |
| Projects and relationships | Crew gathers and processes inputs and can assist at the Forge. | The player chooses what to build, which loans to open or repay, which tools or heirlooms to commission, and when to play relationship and wedding events. |

Use **Assigned**, **Uncovered**, and **Needs your approval** in the Work board, Work calendar and **What Next?** where appropriate. Add a restock list based on actual seasonal shop stock, wanted seed, feed use and available gold. Use costs and warehouse counts from the same rules as the order screens. Let daily forecasts explain the next action and the deadline without requiring the player to set them up to see a suggestion.

## 6. Existing saves and code boundaries

- Bring forward every old loan's identity, date, principal where recorded, fee, outstanding balance and nightly terms. Include old notes in slots and headroom without charging their fees again or requiring a refinance. Preserve exact old balances and legacy project labels, including retired Dorm records.
- Retain existing surplus plans, custom keep counts, explicit zero choices where stored, outstanding crates, Warehouse stock and current production targets. Unconfigured saves derive defaults when the new rules load. Preserve the player's old plan as a custom choice and make a switch to the standard plan explicit. Reopening a save or syncing another device must produce the same effective settings.
- Bring forward rings, Forge jobs, heirloom gifts, engagements, wedding dates, relationship history and prior scene unlocks. Use existing allocations and permissions for new changes. Confirm that quotes, shipments and settled payments remain consistent after reload, a failed save, and multiple device revisions.
- Implement finance and inventory decisions in the shared domain and use its save parsers on both client and API. Use additive fields or an explicit client migration as the existing save protocol requires. Update persisted IDs and parse bounds for three notes, distinguish standard policy from overrides, and test older save fixtures. API storage and private art/story publishing follow the existing protocols.
- Reuse the mayor's office, Ring Bench, Forge, Build cards, ledger, bin, Work, Work calendar and **What Next?**. Keep the main bundle within 180 KB gzip and verify both landscape phone sizes. Keep the live mechanics document as the source for shipped rules when implementation is complete.

[Save and application architecture](../../technical/architecture.md) · [Farm progression and projects](../../game-mechanics.md#what-next)

## 7. Playthrough and exit checks

The existing first-year benchmark starts with 500g and plays 120 days. Its solo farmer shipped 8,170g and ended with 3,180g. Its pre-staffed 10-, 20- and 50-Uma farms ended with 50,055g, 77,725g and 195,815g. Use the staffed fixture for repeatable comparisons and a normal recruitment playthrough for actual player pacing.

| Playthrough | Evidence to capture |
|---|---|
| Fresh solo, with no surplus setup | Start with the usual gold and seeds. Build and finance through normal UI. Reach Romance 8, save the deposit while paying bills and buying the next seed, order and collect a ring, propose and marry. Open the ledger and manually pay part of the debt. Track the in-game date of each milestone, farm rank, cash after the deposit, remaining seedlings or seed money, shipments and overdue nights. The baseline target is a solo Year 1 first ring and reachable wedding through ordinary farming and courtship. |
| Major project | Finance a 100,000g project quote with 10,000g down and verify 99,000g owed. Exercise an actual eligible 110,000g cottage with 100,000g of credit, as well as a materials-and-gold offer. Confirm rank and prerequisite locks, exact stock, delivery, the nightly report and game state on reopen. |
| Three concurrent loans | Mix gold, goods and projects. Verify headroom, rejection of a fourth loan or a quote exceeding available credit, partial payments over fee and principal, full payoff, and reborrowing after a slot clears. Include a night with insufficient sales, a night with no sales, a good sales night, Restaurant-only sales, and legacy and new debts together. |
| Premium rings and Forge | Play the standard and highest available ring options through order and delivery, and use the rings in the existing proposal flow. Verify the ring quote and eligibility, exact materials, concurrent tool and heirloom orders, and one ring allowance. Load older rings and an already-planned wedding. |
| Default shipping at 10, 20 and 50 Umas | Run the same first year, leaving standard reserves and the crate at their defaults. Include a season change, a thin feed day, a missed crew shift and a pinned high-end project. Track restock gaps, bins, exact-grade shortages, meals, sales, market easing, loan progress and excess stock. Follow one mature 50-Uma case long enough to expose a persistent shipping bottleneck. |
| Override and migration | Load unconfigured and customized saves. Check one-item overrides, explicit zero, Keep all, pause, reset, a newly introduced item, existing crate and new category coverage. Verify no double shipment, debit, delivery or debt on repeated callbacks or reload. |
| Phone and delivery | Play the major flows in landscape at 844 × 390 and 667 × 375. Check what the player sees when they have both gold and material shortages, no surplus, no shift, no headroom or a fully repaid note. Run the repository checks, update the live mechanics and generated pages from the final rules, and record balance outcomes before merging the implementation. |

The work is complete when a solo player can earn the deposit and finish the first wedding, major project lending and manual repayment work through normal screens, and a staffed farm earns sales income with default surplus settings while retaining what its crew, recipes and projects need. Record changes to the starter credit, repayment percentage, ring deposit, material quotes and crate capacity with the playthrough evidence.

[First-year balance reference](../../game-mechanics.md#first-year-day-part-pilot) · [Farm at Rank 10 and beyond](../../game-mechanics.md#progression-balance-through-farm-rank-10)
