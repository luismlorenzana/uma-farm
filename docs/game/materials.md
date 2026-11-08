# Materials and made items

Everything an Uma gathers, processes or makes. The lists are generated from `packages/domain/src/items/` (`lines.ts`,
`made-id.ts`, `made.ts`, `made-v4.ts`) and `economy/` (`places-v4.ts`, `professions.ts`); `pnpm docs:update` rewrites
them and a test fails on a stale page. How a job runs, Craft Level and the trades are in [loops](loops.md). These are
uma-rpg's Wilds as copied at `30a322a` (F4, FM2): [the copy's manifest](../technical/wilds-copy.md) says what came and
what stayed behind.

## Lines

Five lines, each one trade's. A line is worked at three places in a row: its **gathering place** gathers raw items, its
**workbench** processes them, and its **making place** makes the line's item from refined ones. Each place does one kind
of job, and no place touches another line. Each line has **ten grades**, a raw item and its refined form each, from one
uma-art family. Grade g opens at **Craft Lv 5g − 4** to gather, to process and to make.

<!-- live:families -->
| Line | Gathered by | Processed at | Made at | Makes | Raw, G1 → G10 |
|---|---|---|---|---|---|
| Metal | Mining, the Mine | the Mine Workbench (Smelting) | the Weapon Forge (Arms Crafting) | Arms Gems | Copper Ore, Tin Ore, Iron Ore, Silver Ore, Cobalt Ore, Gold Ore, Platinum Ore, Titanium Ore, Mythril Ore, Orichalcum Ore |
| Wood | Wood Chopping, the Forest | the Forest Workbench (Sawing) | the Armorer (Armor Crafting) | Armor Fittings | Pine Log, Birch Log, Cedar Log, Maple Log, Oak Log, Cherry Log, Mahogany Log, Ebony Log, Elderwood Log, Yggdrasil Branch |
| Vegetables | Farming, the Fields | the Fields Workbench (Prepping) | the Tome Forge (Tome Crafting) | Tome Ink | Carrot, Potato, Cabbage, Onion, Tomato, Bell Pepper, Eggplant, Asparagus, Golden Carrot, Emperor Pumpkin |
| Fish | Fishing, the Fishery | the Fishery Workbench (Filleting) | the Charm Forge (Accessory Crafting) | Accessory Settings | Carp, Trout, Sardine, Mackerel, Salmon, Sea Bream, Eel, Tuna, Silverfin, Rainbow Koi |
| Stone | Hunting, the Monster Den | the Den Workbench (Stonecutting) | the Lapidary (Jewel Crafting) | Planet Jewels and Moon Jewels | Quartz, Amethyst, Citrine, Garnet, Emerald, Sapphire, Ruby, Diamond, Starstone, Philosopher's Stone |
<!-- /live -->

- **Processing** turns one raw item into its refined form.
- **A made item of grade g** takes its line's refined items of grade g only. A jewel's grade is its node's in uma-rpg:
  Planet Jewel n is grade 2n − 1, Moon Jewel n grade 2n.
- **Every step is equal:** gathering one raw item, processing one, and each refined item in a recipe all take one step,
  24 minutes at Craft Lv 1 falling to 16 at Lv 50, before the place's ×1.25.

## Items by line

Ids are uma-art's own (its `items` atlas), each name comes from its id ("Tomato Purée"), and each icon is its family's
frame at its grade.

<!-- live:items -->
### Metal (Mining, the Mine; the Mine Workbench (Smelting); the Weapon Forge (Arms Crafting))

| Grade | Raw | Refined | Opens at Craft Lv |
|---|---|---|---|
| G1 | Copper Ore (`copper-ore`) | Copper Ingot (`copper-ingot`) | 1 |
| G2 | Tin Ore (`tin-ore`) | Tin Ingot (`tin-ingot`) | 6 |
| G3 | Iron Ore (`iron-ore`) | Iron Ingot (`iron-ingot`) | 11 |
| G4 | Silver Ore (`silver-ore`) | Silver Ingot (`silver-ingot`) | 16 |
| G5 | Cobalt Ore (`cobalt-ore`) | Cobalt Ingot (`cobalt-ingot`) | 21 |
| G6 | Gold Ore (`gold-ore`) | Gold Ingot (`gold-ingot`) | 26 |
| G7 | Platinum Ore (`platinum-ore`) | Platinum Ingot (`platinum-ingot`) | 31 |
| G8 | Titanium Ore (`titanium-ore`) | Titanium Ingot (`titanium-ingot`) | 36 |
| G9 | Mythril Ore (`mythril-ore`) | Mythril Ingot (`mythril-ingot`) | 41 |
| G10 | Orichalcum Ore (`orichalcum-ore`) | Orichalcum Ingot (`orichalcum-ingot`) | 46 |

### Wood (Wood Chopping, the Forest; the Forest Workbench (Sawing); the Armorer (Armor Crafting))

| Grade | Raw | Refined | Opens at Craft Lv |
|---|---|---|---|
| G1 | Pine Log (`pine-log`) | Pine Plank (`pine-plank`) | 1 |
| G2 | Birch Log (`birch-log`) | Birch Plank (`birch-plank`) | 6 |
| G3 | Cedar Log (`cedar-log`) | Cedar Plank (`cedar-plank`) | 11 |
| G4 | Maple Log (`maple-log`) | Maple Plank (`maple-plank`) | 16 |
| G5 | Oak Log (`oak-log`) | Oak Plank (`oak-plank`) | 21 |
| G6 | Cherry Log (`cherry-log`) | Cherry Plank (`cherry-plank`) | 26 |
| G7 | Mahogany Log (`mahogany-log`) | Mahogany Plank (`mahogany-plank`) | 31 |
| G8 | Ebony Log (`ebony-log`) | Ebony Plank (`ebony-plank`) | 36 |
| G9 | Elderwood Log (`elderwood-log`) | Elderwood Plank (`elderwood-plank`) | 41 |
| G10 | Yggdrasil Branch (`yggdrasil-branch`) | Yggdrasil Plank (`yggdrasil-plank`) | 46 |

### Vegetables (Farming, the Fields; the Fields Workbench (Prepping); the Tome Forge (Tome Crafting))

| Grade | Raw | Refined | Opens at Craft Lv |
|---|---|---|---|
| G1 | Carrot (`carrot`) | Chopped Carrot (`chopped-carrot`) | 1 |
| G2 | Potato (`potato`) | Diced Potato (`diced-potato`) | 6 |
| G3 | Cabbage (`cabbage`) | Shredded Cabbage (`shredded-cabbage`) | 11 |
| G4 | Onion (`onion`) | Diced Onion (`diced-onion`) | 16 |
| G5 | Tomato (`tomato`) | Tomato Purée (`tomato-puree`) | 21 |
| G6 | Bell Pepper (`bell-pepper`) | Sliced Bell Pepper (`sliced-bell-pepper`) | 26 |
| G7 | Eggplant (`eggplant`) | Sliced Eggplant (`sliced-eggplant`) | 31 |
| G8 | Asparagus (`asparagus`) | Trimmed Asparagus (`trimmed-asparagus`) | 36 |
| G9 | Golden Carrot (`golden-carrot`) | Golden Carrot Purée (`golden-carrot-puree`) | 41 |
| G10 | Emperor Pumpkin (`emperor-pumpkin`) | Pumpkin Purée (`pumpkin-puree`) | 46 |

### Fish (Fishing, the Fishery; the Fishery Workbench (Filleting); the Charm Forge (Accessory Crafting))

| Grade | Raw | Refined | Opens at Craft Lv |
|---|---|---|---|
| G1 | Carp (`carp`) | Carp Fillet (`carp-fillet`) | 1 |
| G2 | Trout (`trout`) | Trout Fillet (`trout-fillet`) | 6 |
| G3 | Sardine (`sardine`) | Sardine Fillet (`sardine-fillet`) | 11 |
| G4 | Mackerel (`mackerel`) | Mackerel Fillet (`mackerel-fillet`) | 16 |
| G5 | Salmon (`salmon`) | Salmon Fillet (`salmon-fillet`) | 21 |
| G6 | Sea Bream (`sea-bream`) | Sea Bream Fillet (`sea-bream-fillet`) | 26 |
| G7 | Eel (`eel`) | Eel Fillet (`eel-fillet`) | 31 |
| G8 | Tuna (`tuna`) | Tuna Fillet (`tuna-fillet`) | 36 |
| G9 | Silverfin (`silverfin`) | Silverfin Fillet (`silverfin-fillet`) | 41 |
| G10 | Rainbow Koi (`rainbow-koi`) | Rainbow Koi Fillet (`rainbow-koi-fillet`) | 46 |

### Stone (Hunting, the Monster Den; the Den Workbench (Stonecutting); the Lapidary (Jewel Crafting))

| Grade | Raw | Refined | Opens at Craft Lv |
|---|---|---|---|
| G1 | Quartz (`quartz`) | Cut Quartz (`cut-quartz`) | 1 |
| G2 | Amethyst (`amethyst`) | Cut Amethyst (`cut-amethyst`) | 6 |
| G3 | Citrine (`citrine`) | Cut Citrine (`cut-citrine`) | 11 |
| G4 | Garnet (`garnet`) | Cut Garnet (`cut-garnet`) | 16 |
| G5 | Emerald (`emerald`) | Cut Emerald (`cut-emerald`) | 21 |
| G6 | Sapphire (`sapphire`) | Cut Sapphire (`cut-sapphire`) | 26 |
| G7 | Ruby (`ruby`) | Cut Ruby (`cut-ruby`) | 31 |
| G8 | Diamond (`diamond`) | Cut Diamond (`cut-diamond`) | 36 |
| G9 | Starstone (`starstone`) | Cut Starstone (`cut-starstone`) | 41 |
| G10 | Philosopher's Stone (`philosophers-stone`) | Cut Philosopher's Stone (`cut-philosophers-stone`) | 46 |
<!-- /live -->

## Made items

uma-rpg's five made kinds, with uma-rpg's ids and recipes (FM8): Arms Gems, Tome Ink, Armor Fittings, Accessory Settings,
and Planet and Moon Jewels. They wait in the Warehouse for the Forge (M4), which turns them into a game's final items.
The Branch Gem, uma-rpg's never-live R3 item, stayed behind.

<!-- live:made -->
| Made item | Id | Grade | Opens at Craft Lv | Made at | Recipe |
|---|---|---|---|---|---|
| Arms Gem G1 | `weapon-gem-g1` | 1 | 1 | Weapon Forge | 10× Copper Ingot |
| Arms Gem G2 | `weapon-gem-g2` | 2 | 6 | Weapon Forge | 10× Tin Ingot |
| Arms Gem G3 | `weapon-gem-g3` | 3 | 11 | Weapon Forge | 10× Iron Ingot |
| Arms Gem G4 | `weapon-gem-g4` | 4 | 16 | Weapon Forge | 10× Silver Ingot |
| Arms Gem G5 | `weapon-gem-g5` | 5 | 21 | Weapon Forge | 10× Cobalt Ingot |
| Arms Gem G6 | `weapon-gem-g6` | 6 | 26 | Weapon Forge | 10× Gold Ingot |
| Arms Gem G7 | `weapon-gem-g7` | 7 | 31 | Weapon Forge | 10× Platinum Ingot |
| Arms Gem G8 | `weapon-gem-g8` | 8 | 36 | Weapon Forge | 10× Titanium Ingot |
| Arms Gem G9 | `weapon-gem-g9` | 9 | 41 | Weapon Forge | 10× Mythril Ingot |
| Arms Gem G10 | `weapon-gem-g10` | 10 | 46 | Weapon Forge | 10× Orichalcum Ingot |
| Armor Fittings G1 | `armor-fittings-g1` | 1 | 1 | Armorer | 3× Pine Plank |
| Armor Fittings G2 | `armor-fittings-g2` | 2 | 6 | Armorer | 3× Birch Plank |
| Armor Fittings G3 | `armor-fittings-g3` | 3 | 11 | Armorer | 3× Cedar Plank |
| Armor Fittings G4 | `armor-fittings-g4` | 4 | 16 | Armorer | 3× Maple Plank |
| Armor Fittings G5 | `armor-fittings-g5` | 5 | 21 | Armorer | 3× Oak Plank |
| Armor Fittings G6 | `armor-fittings-g6` | 6 | 26 | Armorer | 3× Cherry Plank |
| Armor Fittings G7 | `armor-fittings-g7` | 7 | 31 | Armorer | 3× Mahogany Plank |
| Armor Fittings G8 | `armor-fittings-g8` | 8 | 36 | Armorer | 3× Ebony Plank |
| Armor Fittings G9 | `armor-fittings-g9` | 9 | 41 | Armorer | 3× Elderwood Plank |
| Armor Fittings G10 | `armor-fittings-g10` | 10 | 46 | Armorer | 3× Yggdrasil Plank |
| Accessory Setting G1 | `accessory-setting-g1` | 1 | 1 | Charm Forge | 5× Carp Fillet |
| Accessory Setting G2 | `accessory-setting-g2` | 2 | 6 | Charm Forge | 5× Trout Fillet |
| Accessory Setting G3 | `accessory-setting-g3` | 3 | 11 | Charm Forge | 5× Sardine Fillet |
| Accessory Setting G4 | `accessory-setting-g4` | 4 | 16 | Charm Forge | 5× Mackerel Fillet |
| Accessory Setting G5 | `accessory-setting-g5` | 5 | 21 | Charm Forge | 5× Salmon Fillet |
| Accessory Setting G6 | `accessory-setting-g6` | 6 | 26 | Charm Forge | 5× Sea Bream Fillet |
| Accessory Setting G7 | `accessory-setting-g7` | 7 | 31 | Charm Forge | 5× Eel Fillet |
| Accessory Setting G8 | `accessory-setting-g8` | 8 | 36 | Charm Forge | 5× Tuna Fillet |
| Accessory Setting G9 | `accessory-setting-g9` | 9 | 41 | Charm Forge | 5× Silverfin Fillet |
| Accessory Setting G10 | `accessory-setting-g10` | 10 | 46 | Charm Forge | 5× Rainbow Koi Fillet |
| Planet Jewel I | `jewel-planet-1` | 1 | 1 | Lapidary | 5× Cut Quartz |
| Planet Jewel II | `jewel-planet-2` | 3 | 11 | Lapidary | 5× Cut Citrine |
| Planet Jewel III | `jewel-planet-3` | 5 | 21 | Lapidary | 5× Cut Emerald |
| Planet Jewel IV | `jewel-planet-4` | 7 | 31 | Lapidary | 5× Cut Ruby |
| Planet Jewel V | `jewel-planet-5` | 9 | 41 | Lapidary | 5× Cut Starstone |
| Moon Jewel I | `jewel-moon-1` | 2 | 6 | Lapidary | 5× Cut Amethyst |
| Moon Jewel II | `jewel-moon-2` | 4 | 16 | Lapidary | 5× Cut Garnet |
| Moon Jewel III | `jewel-moon-3` | 6 | 26 | Lapidary | 5× Cut Sapphire |
| Moon Jewel IV | `jewel-moon-4` | 8 | 36 | Lapidary | 5× Cut Diamond |
| Moon Jewel V | `jewel-moon-5` | 10 | 46 | Lapidary | 5× Cut Philosopher's Stone |
| Tome Ink G1 | `tome-ink-g1` | 1 | 1 | Tome Forge | 10× Chopped Carrot |
| Tome Ink G2 | `tome-ink-g2` | 2 | 6 | Tome Forge | 10× Diced Potato |
| Tome Ink G3 | `tome-ink-g3` | 3 | 11 | Tome Forge | 10× Shredded Cabbage |
| Tome Ink G4 | `tome-ink-g4` | 4 | 16 | Tome Forge | 10× Diced Onion |
| Tome Ink G5 | `tome-ink-g5` | 5 | 21 | Tome Forge | 10× Tomato Purée |
| Tome Ink G6 | `tome-ink-g6` | 6 | 26 | Tome Forge | 10× Sliced Bell Pepper |
| Tome Ink G7 | `tome-ink-g7` | 7 | 31 | Tome Forge | 10× Sliced Eggplant |
| Tome Ink G8 | `tome-ink-g8` | 8 | 36 | Tome Forge | 10× Trimmed Asparagus |
| Tome Ink G9 | `tome-ink-g9` | 9 | 41 | Tome Forge | 10× Golden Carrot Purée |
| Tome Ink G10 | `tome-ink-g10` | 10 | 46 | Tome Forge | 10× Pumpkin Purée |
<!-- /live -->
