// The v3 Warehouse's ids (F17 decision 7; core spec CS19): the goods CS19 prices by the ladder or as crops, plus seeds.
// Written from uma-art 2.21.0's `items/atlas.json`: every good's id, family and grade are uma-art's own, so names and
// icons come from ids as today (a web test checks each id is on the atlas). 260 goods: 27 crops and 10 flours, the
// forest's 113, mining's 60, fishing's 20 and expeditions' 30. The ranch's, the dishes' and the Forge's goods join with
// their packets (F27, F8, F36). F19 gives each its price ★1 by the one rule (`rule.ts`, CS9) and a refined good its
// input; seasons and stations are F20's and F22's.
//
// **The rings** (F53 decision 2; romance spec RM38, CS25) are the v4 catalogue's own family: CS25's ten, `ring-g1` …
// `ring-g10`, at its ★1 prices, made at the ring bench (`romance/bench.ts`) and drawn on uma-art's `accessory-setting`
// frames. They're apart from `GOODS`, so v3's catalogue (its families, its Diary rows, its parse) is M4's as live:
// `goodOf` prices and names a ring, `isGoodId` stays v3's, and v4 reads `isGoodIdV4`.
import { itemNameOf } from '../items/lines'
import { CROP_PRICES, ladderPrice, refinedPrice, type LadderFamily } from './rule'

/** uma-art's families the v3 goods come from. */
export const GOOD_FAMILIES = [
  'grains', 'vegetables', 'herbs-spices', 'nuts-seeds', 'sweets', 'fruits', 'mushrooms', 'woods',
  'ores', 'stones', 'crystals', 'fish', 'hides-scales', 'bones-horns', 'essences',
] as const
/** The rings' family (F53 decision 2): the v4 catalogue's only, never in `GOOD_FAMILIES`. */
export const RING_FAMILY = 'rings'
/** A family of v3's catalogue. */
export type GoodFamilyV3 = typeof GOOD_FAMILIES[number]
/** A good's family: v3's fifteen, and the rings on v4. */
export type GoodFamily = GoodFamilyV3 | typeof RING_FAMILY
/** The v4 catalogue's families: v3's, then the rings (F53). */
export const GOOD_FAMILIES_V4: readonly GoodFamily[] = [...GOOD_FAMILIES, RING_FAMILY]
/** Each family in the player's words. */
export const FAMILY_NAMES: Readonly<Record<GoodFamily, string>> = {
  grains: 'Grains', vegetables: 'Vegetables', 'herbs-spices': 'Herbs and spices', 'nuts-seeds': 'Nuts and seeds', sweets: 'Sweets', fruits: 'Fruits',
  mushrooms: 'Mushrooms', woods: 'Woods', ores: 'Ores', stones: 'Stones', crystals: 'Crystals', fish: 'Fish', 'hides-scales': 'Hides and scales',
  'bones-horns': 'Bones and horns', essences: 'Essences', rings: 'Rings',
}

/** Each family's ten raw ids, G1 → G10, and their refined forms where the farm keeps them (the vegetables' refined forms
 * leave the game, D28; the expeditions' loot is raw only). */
const FAMILY_IDS: Readonly<Record<GoodFamilyV3, { raw: readonly string[]; refined: readonly string[] | null }>> = {
  grains: {
    raw: ['wheat', 'oats', 'barley', 'rice', 'corn', 'rye', 'buckwheat', 'wild-rice', 'moonrice', 'sunwheat'],
    refined: ['wheat-flour', 'rolled-oats', 'pearl-barley', 'polished-rice', 'cornmeal', 'rye-flour', 'buckwheat-flour', 'hulled-wild-rice',
      'moonrice-flour', 'sunwheat-flour'],
  },
  vegetables: {
    raw: ['carrot', 'potato', 'cabbage', 'onion', 'tomato', 'bell-pepper', 'eggplant', 'asparagus', 'golden-carrot', 'emperor-pumpkin'],
    refined: null,
  },
  'herbs-spices': {
    raw: ['basil', 'mint', 'rosemary', 'thyme', 'ginger', 'peppercorn', 'cinnamon', 'saffron', 'mandrake', 'phoenix-pepper'],
    refined: ['dried-basil', 'dried-mint', 'dried-rosemary', 'dried-thyme', 'ground-ginger', 'ground-pepper', 'ground-cinnamon', 'saffron-threads',
      'mandrake-powder', 'phoenix-spice'],
  },
  'nuts-seeds': {
    raw: ['peanut', 'sunflower-seed', 'sesame', 'walnut', 'chestnut', 'almond', 'pistachio', 'macadamia', 'thundernut', 'worldseed'],
    refined: ['peanut-butter', 'sunflower-oil', 'sesame-paste', 'walnut-paste', 'chestnut-paste', 'almond-paste', 'pistachio-paste',
      'macadamia-butter', 'thundernut-oil', 'worldseed-oil'],
  },
  sweets: {
    raw: ['honeycomb', 'sugarcane', 'sugar-beet', 'maple-sap', 'cacao-pod', 'vanilla-pod', 'agave-heart', 'palm-sap', 'fairy-honeycomb', 'ambrosia-blossom'],
    refined: ['honey', 'cane-sugar', 'beet-sugar', 'maple-syrup', 'chocolate', 'vanilla-extract', 'agave-syrup', 'palm-sugar', 'fairy-honey', 'ambrosia'],
  },
  fruits: {
    raw: ['apple', 'pear', 'peach', 'plum', 'orange', 'grape', 'mango', 'pomegranate', 'starpeach', 'golden-apple'],
    refined: ['apple-preserve', 'pear-preserve', 'peach-preserve', 'plum-preserve', 'orange-marmalade', 'grape-jelly', 'mango-pulp',
      'pomegranate-molasses', 'starpeach-nectar', 'golden-apple-preserve'],
  },
  mushrooms: {
    raw: ['button-mushroom', 'shiitake', 'oyster-mushroom', 'enoki', 'chanterelle', 'porcini', 'morel', 'truffle', 'glowcap', 'king-reishi'],
    refined: ['dried-button-mushroom', 'dried-shiitake', 'dried-oyster-mushroom', 'dried-enoki', 'dried-chanterelle', 'dried-porcini', 'dried-morel',
      'shaved-truffle', 'glowcap-powder', 'reishi-powder'],
  },
  woods: {
    raw: ['pine-log', 'birch-log', 'cedar-log', 'maple-log', 'oak-log', 'cherry-log', 'mahogany-log', 'ebony-log', 'elderwood-log', 'yggdrasil-branch'],
    refined: ['pine-plank', 'birch-plank', 'cedar-plank', 'maple-plank', 'oak-plank', 'cherry-plank', 'mahogany-plank', 'ebony-plank',
      'elderwood-plank', 'yggdrasil-plank'],
  },
  ores: {
    raw: ['copper-ore', 'tin-ore', 'iron-ore', 'silver-ore', 'cobalt-ore', 'gold-ore', 'platinum-ore', 'titanium-ore', 'mythril-ore', 'orichalcum-ore'],
    refined: ['copper-ingot', 'tin-ingot', 'iron-ingot', 'silver-ingot', 'cobalt-ingot', 'gold-ingot', 'platinum-ingot', 'titanium-ingot',
      'mythril-ingot', 'orichalcum-ingot'],
  },
  stones: {
    raw: ['limestone', 'sandstone', 'slate', 'granite', 'basalt', 'marble', 'obsidian', 'jade', 'runestone', 'meteorite'],
    refined: ['limestone-block', 'sandstone-block', 'slate-block', 'granite-block', 'basalt-block', 'marble-block', 'obsidian-block', 'jade-block',
      'runestone-block', 'meteorite-block'],
  },
  crystals: {
    raw: ['quartz', 'amethyst', 'citrine', 'garnet', 'emerald', 'sapphire', 'ruby', 'diamond', 'starstone', 'philosophers-stone'],
    refined: ['cut-quartz', 'cut-amethyst', 'cut-citrine', 'cut-garnet', 'cut-emerald', 'cut-sapphire', 'cut-ruby', 'cut-diamond', 'cut-starstone',
      'cut-philosophers-stone'],
  },
  fish: {
    raw: ['carp', 'trout', 'sardine', 'mackerel', 'salmon', 'sea-bream', 'eel', 'tuna', 'silverfin', 'rainbow-koi'],
    refined: ['carp-fillet', 'trout-fillet', 'sardine-fillet', 'mackerel-fillet', 'salmon-fillet', 'sea-bream-fillet', 'eel-fillet', 'tuna-fillet',
      'silverfin-fillet', 'rainbow-koi-fillet'],
  },
  'hides-scales': {
    raw: ['puffbun-pelt', 'boarling-hide', 'wolfkin-pelt', 'rock-lizard-scale', 'ironback-hide', 'basilisk-scale', 'manticore-hide', 'behemoth-hide',
      'wyvern-scale', 'dragon-scale'],
    refined: null,
  },
  'bones-horns': {
    raw: ['seashell', 'ammonite', 'trilobite', 'fossil-bone', 'mammoth-tusk', 'saber-fang', 'raptor-claw', 'tyrant-tooth', 'titan-bone', 'unicorn-horn'],
    refined: null,
  },
  essences: {
    raw: ['mist-essence', 'dew-essence', 'breeze-essence', 'ember-essence', 'tide-essence', 'spark-essence', 'glimmer-essence', 'shadow-essence', 'aether',
      'prismatic-essence'],
    refined: null,
  },
}

/** The 27 crops (CS11): 22 from the shop and 5 rare ones. Seven are also the forest's (Basil, Mint, Ginger, Mandrake,
 * Peanut, Sunflower Seed, Sugar Beet) and keep their crop price wherever they come from (CS16). */
export const CROP_IDS = [
  'carrot', 'potato', 'mint', 'onion', 'cabbage', 'asparagus',
  'tomato', 'basil', 'bell-pepper', 'eggplant', 'sunflower-seed', 'corn',
  'wheat', 'peanut', 'rice', 'sugar-beet', 'emperor-pumpkin',
  'buckwheat', 'oats', 'barley', 'rye', 'ginger',
  'golden-carrot', 'sunwheat', 'moonrice', 'wild-rice', 'mandrake',
] as const
export type CropId = typeof CROP_IDS[number]
const CROPS: ReadonlySet<string> = new Set(CROP_IDS)
export const isCropId = (id: string): id is CropId => CROPS.has(id)

/** A good in the v3 Warehouse: uma-art's family and grade, raw or refined, whether it's a crop, its price ★1 (F19, CS9)
 * and, for a refined good, the raw good a station makes it from. */
export interface Good {
  id: string
  family: GoodFamily
  grade: number
  refined: boolean
  crop: boolean
  /** What one sells for at ★1, out of demand: a crop's own price, else the ladder × its family's factor; refined ×1.5. */
  price: number
  /** A refined good's input (its family's raw good of the same grade), or null for a raw one. */
  input: string | null
}

/** A raw good's price ★1: a crop's own (CS11), else the ladder's (CS9). Grains and vegetables are all crops. */
function rawPrice(id: string, family: GoodFamilyV3, grade: number): number {
  if (CROPS.has(id)) return CROP_PRICES[id as CropId]
  if (family === 'grains' || family === 'vegetables') throw new RangeError(`${id} is a ${family} good but not a crop`)
  return ladderPrice(family as LadderFamily, grade)
}

/** The 260 goods, family by family, raw G1–G10 then refined G1–G10. */
export const GOODS: readonly Good[] = GOOD_FAMILIES.flatMap((family) => {
  const { raw, refined } = FAMILY_IDS[family]
  const raws = raw.map((id, i): Good => ({ id, family, grade: i + 1, refined: false, crop: CROPS.has(id), price: rawPrice(id, family, i + 1), input: null }))
  const refineds = (refined ?? []).map((id, i): Good => {
    const input = raws[i]!
    return { id, family, grade: i + 1, refined: true, crop: false, price: refinedPrice(input.price), input: input.id }
  })
  return [...raws, ...refineds]
})
const GOOD_BY_ID = new Map(GOODS.map((g) => [g.id, g]))
export const GOOD_IDS: readonly string[] = GOODS.map((g) => g.id)

// --- The rings (F53 decision 2; CS25) ---------------------------------------------------------------------------------

/** CS25's rings' ★1 prices, G1 → G10. */
export const RING_PRICES = [205, 275, 340, 450, 580, 745, 950, 1220, 1555, 2025] as const
/** CS25's names: Copper to Orichalcum Ring, by grade. */
const RING_METALS = ['Copper', 'Tin', 'Iron', 'Silver', 'Cobalt', 'Gold', 'Platinum', 'Titanium', 'Mythril', 'Orichalcum'] as const
/** A ring's id by its grade (1–10): `ring-g3`. */
export const ringId = (grade: number): string => `ring-g${grade}`
/** The ten rings, G1 → G10 (`ring-g1` … `ring-g10`): the proposal's ring is any of them (RM39). */
export const RING_IDS: readonly string[] = RING_PRICES.map((_, i) => ringId(i + 1))
/** The rings as goods: raw, never crops, no input; made at the ring bench, sold at the bin like any good. */
export const RING_GOODS: readonly Good[] = RING_IDS.map((id, i): Good => ({ id, family: RING_FAMILY, grade: i + 1, refined: false, crop: false, price: RING_PRICES[i]!, input: null }))
const RING_BY_ID = new Map(RING_GOODS.map((g) => [g.id, g]))
export const isRingId = (id: string): boolean => RING_BY_ID.has(id)
/** A ring's grade (1–10), or 0 for anything else. */
export const ringGrade = (id: string): number => RING_BY_ID.get(id)?.grade ?? 0
/** A ring in words: "Iron Ring". */
export const ringName = (grade: number): string => `${RING_METALS[grade - 1] ?? 'A'} Ring`

/** A good's family, grade, form, price ★1 and input, or undefined for anything else (a seed has no price). The rings are
 * here too (F53), so the bin prices them and the screens name them. */
export const goodOf = (id: string): Good | undefined => GOOD_BY_ID.get(id) ?? RING_BY_ID.get(id)
const REFINED_OF = new Map(GOODS.flatMap((g) => (g.input ? [[g.input, g.id] as const] : [])))
/** What a raw good refines into at a station, or null (the vegetables' and the expeditions' have none). */
export const refinedOf = (id: string): string | null => REFINED_OF.get(id) ?? null
/** A good of v3's catalogue (M4's 260). */
export const isGoodId = (id: string): boolean => GOOD_BY_ID.has(id)
/** A good of v4's catalogue (F53): v3's and the rings. */
export const isGoodIdV4 = (id: string): boolean => GOOD_BY_ID.has(id) || RING_BY_ID.has(id)

/** Seeds are Warehouse items with farm ids (F17 decision 6): `seed-<crop>` from the shop and `seed-<crop>-own` from
 * harvests, held at ★1 only. They have no bin price. */
export const seedId = (crop: CropId, own = false): string => `seed-${crop}${own ? '-own' : ''}`
export const SEED_IDS: readonly string[] = CROP_IDS.flatMap((crop) => [seedId(crop), seedId(crop, true)])
const SEEDS = new Map<string, { crop: CropId; own: boolean }>(CROP_IDS.flatMap((crop) => [[seedId(crop), { crop, own: false }], [seedId(crop, true), { crop, own: true }]]))
export const isSeedId = (id: string): boolean => SEEDS.has(id)
/** A seed's crop and whether it's an own seed, or undefined for any other id. */
export const seedOf = (id: string): { crop: CropId; own: boolean } | undefined => SEEDS.get(id)

/** Anything the v3 Warehouse may hold: a good or a seed. */
export const isWarehouseId = (id: string): boolean => GOOD_BY_ID.has(id) || SEEDS.has(id)

/** Each dish kind's word (CS21), by its family (F51; here since F53 so the Warehouse names a dish). */
export const DISH_WORDS = {
  vegetables: 'Salad', grains: 'Bread', fruits: 'Tart', fish: 'Grill', 'herbs-spices': 'Curry', mushrooms: 'Soup', sweets: 'Cake', 'nuts-seeds': 'Cookies',
} as const
/** A dish in words (`dish-<family>-<grade>`): its family's raw good of its grade, then its kind ("Carrot Salad", "Button
 * Mushroom Soup"), as uma-art's atlas names them. Anything else by its id's words. */
export function dishName(id: string): string {
  const m = /^dish-([a-z-]+)-(10|[1-9])$/.exec(id)
  const word = m ? (DISH_WORDS as Readonly<Record<string, string>>)[m[1]!] : undefined
  if (!m || !word) return itemNameOf(id)
  const raw = GOODS.find((g) => g.family === m[1] && !g.refined && g.grade === Number(m[2]))
  return `${raw ? itemNameOf(raw.id) : itemNameOf(m[1]!)} ${word}`
}

/** A Warehouse item in the player's words (F19): a good by its uma-art id ("Sunflower Seed"), a seed by its crop
 * ("Carrot seeds", "Carrot seeds (own)"), a ring by CS25's name ("Iron Ring") and a dish by its kind ("Carp Grill"). */
export function goodName(id: string): string {
  const seed = SEEDS.get(id)
  if (seed) return `${itemNameOf(seed.crop)} seeds${seed.own ? ' (own)' : ''}`
  const ring = RING_BY_ID.get(id)
  if (ring) return ringName(ring.grade)
  return id.startsWith('dish-') ? dishName(id) : itemNameOf(id)
}

