# F113 — Town and professions

**Status · Full authoring packet for review.** The first implementation slice is Town Library → Kitchen → Café plus the shared Requests board. The remaining locations, all 25 professions, the district map, and the Harbour Inn residence model are specified below.

## The design

Give each public place a service that connects to a system the player already uses. Town shifts can post a real order, publish a report, teach a recipe, or prepare a plan. A service credits the Uma who performed it. The player can follow the result from the relevant screen or make a special trip to see her.

Town starts with 50 playable Umas in 25 two-person professions. The paired schedule stays three town shifts, three farm shifts after hiring, and one profession-specific day off. A profession’s town contribution uses its town shifts. Farm work uses its farm shifts. Existing morning and afternoon occupation windows and date checks continue to read the same schedule. A marriage moves her home when a farm room is assigned and keeps her profession, town days, farm days, and day off. The mayor keeps the office.

[Existing town and shifts](../../game-mechanics.md#town-professions-and-the-week) · [Work board and calendar](../../game-mechanics.md#the-work-board) · [Story publishing](../../story-pack.md#how-the-story-reaches-the-game)

## The town map

The overview is a painted, tap-to-enter town. A district opens its own map with every public building visible on one surface. The selected building opens an information panel with its main service and the Umas there now. The map stays available while changing buildings. **People** remains available from both levels and opens the correct building for an Uma who is there.

```text
                         HILLTOP
                   Track · Expedition post
                             │
    SMITHY & RANCH ─────── PLAZA ───────── LIBRARY & CAFÉ
    Smithy · Garage        Mayor’s Office   Library · Café
    Rancher’s              Estate Office
                           Little Studio
                             │
                          MARKET ───────── HARBOUR
                          General Store    Harbour · Harbour Inn
                          Little Bakery
                          Salon
```

| District | Public destinations | Landmark and connections |
|---|---|---|
| Plaza | Plaza and its Requests noticeboard, Mayor’s Office, Estate Office, Little Studio | Fountain at the farm-road entrance. Routes to Market, Hilltop, Smithy & Ranch, and Library & Café. |
| Market | Market stalls, General Store, Little Bakery, Salon | Canvas awnings and an alley of doors. Routes to Plaza and Harbour. |
| Library & Café | Town Library, Café | Two distinct doors across a short lane. Route to Plaza. |
| Harbour | Harbour, Harbour Inn | Waterfront along the lower edge, Inn facing the quay. Route to Market. The farm’s Dock and Boat remain farm projects. |
| Smithy & Ranch | Smithy, Garage, Rancher’s | Workshop court with a paddock at the edge. Route to Plaza. |
| Hilltop | Hilltop Track, Expedition post | Running oval and trailhead. Route to Plaza. Show the post’s Rank 7 build requirement before it opens. |

**Navigation.** Town opens at the overview. The first **Back** from a service returns to its district and selected building. **All town** returns to the overview. Routes such as a date, calendar entry, or former town location still resolve to their intended place. A link to a known building selects it and opens its district. A jump from the town panel into Kitchen, Work, a recipe, or a build keeps a return path. Map navigation is free.

**Building panel.** Show the building’s title, primary service, and people present. An eligible staff row says **On shift · [name]** and opens her existing conversation. An uncovered counter says **Self-service** and still opens its service. The existing pinned Talk, Gift, Date, and Event actions stay in the conversation view.

**Art.** Produce one town overview and six district paintings from a shared top-down or straight-on overhead camera. Use a broad readable path and a recognizable silhouette for each door. Keep door labels, staff status, face pins, and selectable footprints in the UI. The art brief includes editable layers, day and dusk values, doorway coordinates, silhouette references shared with conversation backdrops, and a simple tile list for low-memory devices. Load each district on demand. Review 844×390 and 667×375 in landscape with 44 pt targets and safe areas. The overview district cards and every district’s building list remain usable while its painting loads.

## Harbour Inn and residence

**Harbour Inn is the shared town residence.** Reuse the existing Inn location. The lobby is a public destination and the Innkeeper’s service counter. The resident directory and rooms are reached through the lobby. Rooms are individual visit settings inside that building, without separate public map lots or a room-by-room public map. The roster can show **Lives at the Harbour Inn**, **Out today**, or **Lives on the farm** as appropriate.

- All 50 launch Umas start with lodging. Later cast members can live there when their pack arrives. Town shifts, authored public outings, and expeditions take precedence over presence at the Inn. Show actual whereabouts and next available time from the same schedule as **People** and the Calendar.
- An un-met Uma in the lobby can be introduced through the normal meeting flow. A private visit requires an existing meeting, actual availability, and any scene’s requirements. Off-duty visits use the existing date slots and eligibility. Room encounters and conversations keep their existing rules.
- She remains an Inn resident while married and waiting for a farm room. The assignment of a room triggers move-in and her directory moves to the farm. Housed spouses can visit the Inn for their own job, a public outing, or a scene. The Inn continues serving meals and trip provisions after its residents move out.
- Retire the 45 standalone home markers in story release 23 from the public map in the first map release. Resolve existing home references individually in private story authoring. Scheduling references for ordinary residences go to her Inn lodging. Explicit scene settings, remembered locations, replay context, and location-specific route requirements get an authored mapping by scene. A public deep link based on a former home routes to the Inn and preserves the associated person if present. Existing story history and Library entries keep their original identity.
- Room identity comes from the Uma, without an arbitrary public slot count or a separate move-in ledger. Farm residence comes from the existing house assignment. Active town jobs continue to come from the profession schedule. Use private story IDs for aliases and scenes, with invented locations in Git fixtures.

**Story beats.** Author an Inn arrival greeting, a short lobby conversation for a free day, a room visit invitation where the route calls for it, move-out acknowledgement after a farm room is assigned, and an optional return visit once she lives on the farm. Choose or adapt per Uma through the story authoring workflow. Shared context carries the service and availability copy.

## First slice · Library, Kitchen, Café

**Day 1 · Browse the Town Library.** The **Cookbook** shows Kitchen recipes with **Known**, **Learn**, or **Build the Kitchen**, and a link to the real source and the current Warehouse. **Restaurant recipes** shows the 120 existing recipes by service stage. Its cards show **Clear stage [n]**, required exact-grade discoveries including component chains, and current ingredient stock. Learning proof and stock needed to cook are separate fields. **Field guides** show crop seasons, fish spots, and forage sources from game data. Town notes remain readable through the Diary and get a reference link here.

**Farm Rank 3 · Get a real recipe.** When the Kitchen stands, the Librarian offers **Trout Grill** at its existing 500g shop price. A one-time Library lesson can instead teach it if the exact Trout discovery is recorded. Catching the Trout with the farmer or a farmhand qualifies. A purchased fish matches stock only. Both routes call the existing permanent Kitchen recipe unlock and grant the same recipe ID. Keep the General Store’s recipe shelf, the three known starter dishes, and signature-dish grants. If Trout Grill is already known, the lesson offers its source and **Open Kitchen**.

**Use the real Kitchen.** Trout Grill takes two Trout or Trout Fillets and one herb or spice. Link to its ordinary Kitchen recipe, using actual stock and stove scoring. The Café tutorial asks for one portion of it at any star quality. The player can use the dish for regular meals, serve it at the Restaurant once available, or deliver it on the shared board. The request remains available while the player pursues other goals.

**Fulfil the featured order.** The two public entry points, Plaza or Café in Town and Requests on the farm, open the same board. When the board’s five-Umas-met gate opens and the Kitchen stands, the persistent **Trout Grill for the Café** tutorial appears. It counts against the food slot while accepted. The Cook authors the featured order and the Café Host can acknowledge the delivery. A self-service hand-in works on their days off. The first completed delivery records one tutorial milestone, uses the normal request payment, and lets the weekly food slot rotate.

**Restaurant example.** After Stage 1 clears, **Basil Carp Parcels** learns from the farm’s exact Carp G1 and Basil G1 discoveries. The Library shows which one is missing and its source, including where the Farm Rank or zone is locked. The Kitchen cooks the known recipe with actual Carp and Basil. A sell, meal, or later recipe uses that same dish stock lot. Use the existing recipe pin to protect ingredients and What Next or Work to show collection. Higher stage clearing, grade proof, and the Restaurant’s normal service all remain required.

| Screen or state | Player copy |
|---|---|
| Town Library | **Cookbook** · **Restaurant recipes** · **Field guides** |
| Cookbook lesson | **Trout Grill** · **Learn from your Trout discovery** · **Buy recipe · 500g** · **Open Kitchen** |
| Recipe source | **Discovered** · **In the Warehouse** · **Find ingredient** |
| Locked Restaurant recipe | **Clear Restaurant Stage 1** · **Produce Carp G1** · **Gather Basil G1** |
| Café hand-in | **Featured order** · **Trout Grill · 1 portion** · **Deliver · 1 action** |
| Confirmation | **Trout Grill delivered. Payment tonight.** |

[Kitchen recipe rules](../../game-mechanics.md#the-kitchen) · [Restaurant learning and cooking](../../game-mechanics.md#learning-and-cooking)

## Shared Requests board

Open after meeting **five Umas**, from the farm’s board or the Plaza noticeboard. Offer up to **three weekly requests** in **Food**, **Makers**, and **Town**. Each has an exact good and quantity, minimum stars if relevant, any actual discovery proof, the posting role, the reward estimate, and its due day. A new request can open by Farm Rank, working facility, season, or completed stage. Browse anytime, plan in Work, and deliver in one action. The player’s household and romance events stay on their own paths.

- Anchor weeks to the game’s present seven-day calendar. Populate a slot with an eligible request on its first eligible day in the week. Credit the actual on-duty worker, or use the establishment when the pair is off or away. Display the available roster and eligibility on the same rules for each surface. One offer per slot per week, using distinct request keys and a deterministic rotation. Slots with no eligible offer stay empty.
- Accepting or cancelling is free. Accepted recurring requests expire at the end of their seventh game day including acceptance, or earlier if fulfilled. The tutorial remains available without expiry. One active offer per slot. A request carried across a week keeps its slot until resolved. Cancellation and expiry simply release the goods hold.
- Accept puts a count hold on the exact item and minimum-star cutoff. Multiple accepted requests sum the quantities that can use the same lots. Existing food and production protections still apply. Show any competition for stock and allow the existing explicit player-use paths. Surplus shipping cannot take a lot it must hold for an accepted order. Acceptance tracks holds. Delivery moves stock. The Work board can propose a gathering or station task using real availability.
- **Deliver** chooses eligible lots from the Warehouse and shows the exact payment. Use the same day’s bin valuation for shippable lots and the existing Restaurant plate price for original Kitchen dishes. Add a 10% bonus rounded down and capped at 250g per request. Delivery commits the lots, one action and one completion atomically. Count the normal shipping-equivalent Farm Rank credit once, from base value. Settle the income that night through the normal bills and repayment sequence. Show **Town orders** in the nightly receipt and Ledger. Remove holds and record attribution and reward from the same completed delivery.
- A farm-produced proof is the existing discovery of an exact item or grade. After proof, eligible acquired stock can satisfy a delivery. Every lot still has to match the request. Record deliveries independently of farm discoveries and farming challenge credit.
- The board’s role record names the actual worker on duty when the order was posted or assisted. Completion is per farm, even if the other partner receives the goods. Accepted orders persist through a worker’s absence, marriage, or replacement. Optional follow-up dialogue uses actual presence and can be skipped.

### Launch request catalogue

These are authored offers using existing stock and rules. Quantity is per delivery. Eligibility is additional to the board unlock. **Proof** means the farm must have discovered the same input or dish. Marketplace flavor lines come from the named role at release.

| Slot | Offer and posting role | Goods | Opens and rotations |
|---|---|---|---|
| Food | Trout Grill for the Café · Cook | 1 Trout Grill | Tutorial after Kitchen, persistent |
| Food | A platter for the window table · Café host | 2 Carrot Salads | Kitchen, Spring or stored same goods, dish proof |
| Food | Soup for the evening rush · Cook | 2 Button Mushroom Soups | Kitchen, dish proof |
| Food | Bread for the morning counter · Baker | 2 Wheat Breads | Kitchen, dish proof |
| Food | A harbour lunch · Café host | 2 Basil Carp Parcels | Restaurant Stage 1 clear and dish proof |
| Makers | Flour before opening · Baker | 6 Wheat Flour | Mill, flour proof |
| Makers | Fruit for the preserves shelf · Miller | 4 Apples | Orchard, Apple proof |
| Makers | Planks for a handrail · Carpenter | 6 Pine Planks | Sawmill, plank proof |
| Makers | Copper for a small repair · Smith | 4 Copper Ingots | Smelter, ingot proof |
| Makers | Fillets for the harbour counter · Fisher | 4 Carp Fillets | Smokehouse, fillet proof |
| Makers | Honey for the stall · Beekeeper | 3 Honey | Mill, honey proof |
| Town | Eggs for a neighbour · Rancher | 4 Eggs | Coop, Egg proof |
| Town | Milk for the inn kitchen · Innkeeper | 4 Milk | Barn, Milk proof |
| Town | Fresh herbs for the display · Florist | 4 Basil | Spring or known stock, Basil proof |
| Town | Timber for the noticeboard · Courier | 6 Pine Logs | Board open, Pine Log proof |
| Town | A basket for the guide · Woodland guide | 4 Button Mushrooms | Board open, Button Mushroom proof |
| Town | A quay provisions order · Dock steward | 4 Sardines | Dock, Sardine proof |
| Town | Honeycomb for the tasting stand · Beekeeper | 3 Honeycomb | Spring or known stock, Honeycomb proof |

Use recipe and good IDs from the catalogue when wiring these names. Match the correct raw or processed item, grade and form. If a seasonal source has closed and there is no eligible stock, offer a different request. Requests for a crop or a cooked dish should remain possible for a solo farm once its prerequisites are met. Prices, limited volume, and actual inventory constrain payouts at 10, 20, and 50 workers.

## All public buildings and services

| Place | Service to author | Reuses |
|---|---|---|
| Plaza | Shared noticeboard, festival brief, and announcements from the bell keeper | Requests, regular Calendar and event entry links |
| Mayor’s Office | Building permits, credit and repayment, and a prepared project summary | Existing build and credit screens |
| Estate Office | Project plans, needed materials by family and source, and loan comparison | What Next, Warehouse counts, passed-in build ID at the mayor |
| Little Studio | Rotating exhibition of earned festival awards or farm milestones, with a brief authored scene when a display first changes | Existing contest records, Diary and scene playback |
| Market | Seasonal crop, seed grade, tree, herb, and refined-good guide, plus Requests | Seed and row plans, farm sources, the same board and Workshop links |
| General Store | Seed checkout and recipe purchases, with a list from missing stock | Current Shop, prices and restock |
| Little Bakery | Bread recipes and real flour or finished-bread orders | Kitchen and shared request payouts |
| Salon | Wardrobe previews with exact unlocked looks and requirement hints | Uma Library galleries, outfit unlocks and eligibility |
| Town Library | Cookbook, recipe proof index and field guides | Kitchen, Restaurant, Diary, Warehouse and discovery data |
| Café | Featured dish, requests, and a route into Breakfast together or Dinner in town when eligible | Kitchen dishes, Requests, existing Date selector |
| Harbour | Catch report, coastal access and Dock or Boat material estimates | Fishery, Derby, Dock and Boat projects |
| Harbour Inn | Lobby, resident directory, meal or expedition planning | Town presence, pantry and expedition provisions |
| Smithy | Tool, ring and heirloom estimates, plus carpenter material consultation | Forge, Ring Bench, Warehouse and build plans |
| Garage | Shared tool benefits and remaining charges, with service links | Same tool tiers and Forge commissions |
| Rancher’s | Animal and fodder purchase, housing and feed forecast, and care review | Ranch, Work Calendar, What Next |
| Hilltop Track | A festival preparation panel with entry help and seasonal trail advice | Existing contest rules and Forest gathering |
| Expedition post | Party and supply planning, farm coverage and dispatch | Existing expedition powers, route, duration and work coverage |

An unopened building has one clear requirement and its direct link. A residential chat or an unstaffed service uses the same actions and costs as the underlying flow. Each building service can be reached from its map and from its existing farm screen when the relevant place is built.

## All 25 professions

A profession has a visible service and a contribution from its town shifts. **Post** records a request or report once per scheduled occurrence. **Consult** calculates advice from current game state. **Host** uses a real event or visit. Existing on-duty speaker substitution still resolves the performer for authored scenes. Each contribution can show the provider’s name in the corresponding panel and be read after her shift.

| Profession | Service location | Contribution to author | Player-facing entry |
|---|---|---|---|
| Grocer | General Store | Prepare a buy list from active seasonal rows, inventory and seed prices | **Seed restock** |
| Rancher | Rancher’s | Quote animal and fodder purchases with open stalls and rank requirements | **Animals & feed** |
| Smith | Smithy | Compare missing materials for the selected tool, ring or heirloom | **Commission estimate** |
| Cook | Café | Post the featured dish and teach supported technique through the real Kitchen | **Featured dish** |
| Dock steward | Harbour | Publish open waters, seasonal pier notices and progress toward Dock or Boat | **Harbour report** |
| Baker | Little Bakery | Post a flour or bread order, and point to the required recipe | **Bakery orders** |
| Tailor | Salon | Preview available looks and show the actual outfit milestones | **Wardrobe preview** |
| Seed merchant | Market | Compare planting windows, crop seasons and available seed grades | **Seasonal seeds** |
| Courier | Plaza | Post commissions and record deliveries on the shared board | **Town requests** |
| Café host | Café | Show the current food order and open a café outing when eligible | **Visit the café** |
| Innkeeper | Harbour Inn | Update resident presence and offer meal or provision planning | **Rooms & provisions** |
| Musician | Plaza and Little Studio | Host seasonal gathering scenes and introduce earned exhibitions | **What’s on** |
| Florist | Market | Post herb orders and help the player prepare an eligible Flower Show entry | **Flower Show prep** |
| Carpenter | Smithy and Estate Office | Check build shortages and open the appropriate resource plan or request | **Building materials** |
| Librarian | Town Library | Offer the eligible Kitchen lesson and existing cookbook purchase | **Cookbook** |
| Archivist | Town Library | Trace exact-grade recipe proofs and place stories already discovered in the reference index | **Recipe discoveries** |
| Bell keeper | Plaza | Post festival date, entry status and schedule links from the Calendar | **Upcoming festivals** |
| Animal nurse | Rancher’s | Review feeding, affection and gaps in the crew’s seven-day care coverage | **Ranch check** |
| Orchard keeper | Market | Review seasonal timing, mature trees, fruit grades and row plans | **Orchard guide** |
| Woodland guide | Hilltop Track | Show forest finds by area, rank and season using existing source tables | **Trail notes** |
| Beekeeper | Market | Post Honeycomb or Honey orders and show the real gather-to-Mill chain | **Honey guide** |
| Fisher | Harbour | Compare catch sources and grades and feature Fishing Derby prep | **Catch report** |
| Boatwright | Harbour | Quote Dock prerequisite, Boat materials and the resulting access | **Boat plans** |
| Miller | Market | Show conversions, remaining station loads, exact targets and their pins | **Mill orders** |
| Expedition outfitter | Expedition post and Hilltop Track | Preview party power, supplies, return day and lost farm shifts | **Plan a party** |

The Bakery, Salon, and Inn move the existing service destination from the bundled schedule’s General Store, Market, and Plaza respectively. The outfitter’s counter points to the post once available. These changes preserve each pair’s actual weekday assignment and give affected story routines an explicit review. The gear, ingredient, talent and facility rules stay with their existing systems. Guides can be consulted on other pages and services stay self-service when a role is off duty.

## Service dialogue

These shared lines are the baseline when a worker-specific take has yet to be authored. Each opening names the service she really provides. Replace bracketed text from the current game state and use the shared fallback for any missing value.

| Profession | At her counter | After opening her service |
|---|---|---|
| Grocer | “Let’s check your seed shelf before I pack anything.” | “Your [crop] row calls for [count] more seeds. Shall we open the shop?” |
| Rancher | “What are you bringing out to the paddock today?” | “You have [spaces] open stalls and feed for [days] nights.” |
| Smith | “Tell me what you want the workshop to make.” | “Here’s the material list for [commission]. I marked what you still need.” |
| Cook | “I’m putting one dish on the board for tonight.” | “We need [count] portions of [dish]. Bring them to the Café or hand them in at the farm.” |
| Dock steward | “Let’s see which waters your farm can reach.” | “The next route opens with [project]. Here’s the work still to do.” |
| Baker | “The ovens are warming up. What have you brought from the Mill?” | “This week’s order takes [count] [good]. You can check the recipe here.” |
| Tailor | “Want to see how that outfit looks on her?” | “You can preview [look] here. Its next requirement is [milestone].” |
| Seed merchant | “Let’s see how much of the season you have left.” | “[Crop] can go in this season. Here are the grades you can buy or save.” |
| Courier | “I have the town’s orders here.” | “Your delivery is on the books. Check tonight’s Ledger for the payment.” |
| Café host | “The window table’s free. Would you like a look at today’s order?” | “Here’s the featured dish. If you’re inviting someone, I can take you to the Date menu.” |
| Innkeeper | “Welcome in. I can tell you who’s here or help pack for a trip.” | “Here are the residents in today and the supplies your party can take.” |
| Musician | “Come see what the town’s getting ready for.” | “We’re putting [milestone] on display at the Little Studio.” |
| Florist | “Are you preparing something for the Flower Show?” | “Here’s what your entry needs. I’ve marked the supplies you already have.” |
| Carpenter | “Show me the project you have in mind.” | “You still need [materials]. The farm can start on these jobs.” |
| Librarian | “What would you like to learn to cook?” | “Trout Grill is in the cookbook. I can show you the lesson or the recipe shelf.” |
| Archivist | “Let’s follow that recipe back to the farm.” | “The missing discovery is [good and grade]. Here’s where you can find it.” |
| Bell keeper | “I’ve put the upcoming dates on the noticeboard.” | “[Festival] is on [date]. I’ll show you the entry and who’s available.” |
| Animal nurse | “Let’s look in on the animals and their feeding plan.” | “There’s a gap on [date]. We can open that shift in the Work Calendar.” |
| Orchard keeper | “How are the trees coming along?” | “Here are the planting season and the next fruit window for [tree].” |
| Woodland guide | “Which part of the Forest are you headed to?” | “[Good] is available in [area] this season. Here’s when the trail opens.” |
| Beekeeper | “Looking for Honeycomb, or something from the Mill?” | “Here’s the Honey chain and the amount your order needs.” |
| Fisher | “What are you hoping to catch today?” | “[Fish] can be found at [spot] in [season]. I’ll show you the grade requirements.” |
| Boatwright | “Let’s look at the Dock before we lay out the Boat.” | “Your next Boat requirement is [requirement]. The build order has the full list.” |
| Miller | “What should the Mill keep in stock?” | “You have [loads] loads left. Here are the ingredients needed for [target].” |
| Expedition outfitter | “Tell me where you want the party to go.” | “They’d return on [date]. Here are the provisions and farm shifts to check.” |

| Shared state | Copy |
|---|---|
| Unstaffed counter | **Self-service** · **View [service]** |
| Missing stock | **Need [count] [good]** · **Find source** |
| Waiting on rank or building | **Opens at Farm Rank [rank]** or **Build [place]** |
| No weekly order | **Check back next week** |
| Picked up a lead | **Pinned in What Next?** |
| Inn arrival | **Welcome to the Harbour Inn. See who’s in the lobby today.** |
| Visit unavailable | **She’s [at work / out / away]** · **Find her** |
| Farm move-in | **[Name] moved into her farm room.** |

## Authored presentation and publishing

- Define district and service IDs, map footprints, unlock keys, public shortcuts, and route links in the Farm project. Keep the domain responsible for inventories, recipe grants, work schedules, request payout, and day settlement. Use the existing save envelope with optional request state and parse existing farms that have no such state.
- The private Farm story pack owns playable cast identities, the complete 25-pair profession manifest, workplace or residence aliases, authored service lines and resident scenes. Validate each playable Uma once across profiles, her established shift block, her current partner, and all scene references. Base-role fixtures use invented people. Publish through the existing story authoring workflow.
- Use the authored service dialogue above with the actual game state and place. Add per-Uma versions through her private authoring files where the role benefits from her personality. The on-duty attribution comes from the schedule and can have no named worker.
- Publish map art through the existing art flow. The first art batch includes the district overview, Library & Café, and Plaza panels, plus matching Library, Café counter and Harbour Inn lobby backgrounds. Finish all six sub-maps, use existing conversation backgrounds as appropriate, and use one shared room setting with a few resident props for appropriate scenes.
- Ship the app’s residence and alias readers before publishing the private pack that uses them. Review the alias report and cutover in the Story Sandbox before the normal content publish.
- Town requests use stable definition IDs with saved acceptance data and settlement snapshots. Updating authored text, providers or future rotations can leave a loaded accepted request with its original terms. Closing and reopening the app preserves progress. Any cross-device concurrent order follows the existing farm save revision rule. Advance timers on in-game turns.

## Implementation sequence and acceptance

| Slice | Deliver | Acceptance |
|---|---|---|
| A · Library, Kitchen, Café, Requests | Day 1 browsing, real learning, exact proof display, Café order, common board and income receipt | Fresh solo farm meets five Umas, catches Trout, builds Kitchen, learns and cooks Trout Grill, accepts and delivers it once. Repeat with known recipe, correct grade, wrong grade, processed inputs, insufficient actions, expired order, concurrent shipment and reload. Verify Restaurant stage and exact-grade gates, ingredients protected, and normal meals and sales still work. |
| B · District maps and Harbour Inn | Town overview, six sub-maps, public building panels, People routes, one shared residence, artwork and legacy links | Inspect all 17 public destinations at both landscape sizes. Route every old home or workplace reference through the intended migration. Check 50 residents at launch, available lobby encounters, a married Uma waiting for a room, a housed spouse with the same shift, and a 50-spouse town whose Inn still provides services. Play the affected authored scenes and their Library replays. |
| C · Plaza, Market, Bakery and Rancher | Orders and completion credit, projects, restock, seed and ranch services, studio exhibition | Deliver each launch offer with eligible stock in its normal season on actual farms. Confirm correct worker credited with alternating partners, a shared rest day, expeditions and marriage. Confirm week, season and year rollover, mature farm caps and daily care links. |
| D · Harbour, Smithy, Salon, Hilltop and Expedition post | Remaining services, tools and wardrobe links, catch and trail reports, complete profession rotation | Check Dock and Boat unlocks, Ring Bench independence, unavailable outfits and correct heirloom gates. Send a party from the town map and check crew coverage. Ensure 25 professions each expose their authored service, matching the on-duty worker or self-service. |

**Release checks.** Run the calendar, retirement aliases, story-backed profession validation, recipes, request and save tests. Simulate the reward and stock paths for solo, 10-, 20- and 50-Uma farms across all four seasons. Confirm the earliest request can be finished without a hired Uma, the 50-Uma farm stays within the bonus and order volume caps, and request payouts feed the regular nightly accounting once. Inspect both landscape widths with long authored content and legacy scene links. The packet ships when the town and all 25 professions are playable through their real entry points.

[Current town schedule and places](../../game-mechanics.md#the-town) · [Save and app architecture](../../technical/architecture.md) · [Shared credit](../../game-mechanics.md#loans)
