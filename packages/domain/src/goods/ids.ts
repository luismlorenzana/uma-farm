// The Warehouse's ids: the goods priced by the ladder or as crops, plus seeds.
// Written from uma-art 2.21.0's `items/atlas.json`: every good's id, family and grade are uma-art's own, so names and
// icons come from ids as today (a web test checks each id is on the atlas). 284 goods: 27 crops and 10 flours, the
// forest's 113, mining's 60, fishing's 20, expeditions' 30, and the ranch's: uma-art's fibers (20, the Barn's wool and
// fleeces and their cloth) and the Coop's and the Barn's eggs and milk (4, `EGGS_MILK`, on uma-art's atlas from 2.30.0 as
// the `ranch` kind's `eggs-milk` line). The dishes' and the Forge's goods join
// with their screens. Each gets its price ★1 by the one rule (`rule.ts`) and a refined good its input.
//
// **The rings** are the catalogue's own family: the ten, `ring-g1` …
// `ring-g10`, at its ★1 prices, made at the ring bench (`romance/bench.ts`) and drawn on uma-art's `accessory-setting`
// frames. They're apart from `GOODS` (the 284): `goodOf` prices and names a ring, `isGoodId` is the 284's, and
// `isGoodOrRingId` takes the rings too (the bin, the Diary).
import { itemNameOf } from '../items/lines'
import { CROP_PRICES, ladderPrice, refinedPrice, type LadderFamily } from './rule'
import { round5 } from '../farm/round'
import { PLANTABLE_ADDITIONS, RARE_CROPS, type NewCropId } from '../fields/plantables'
import { ANIMAL_PRODUCTS, FOOD_CONVERSIONS } from './production-catalogue'
import { restaurantDishName } from '../restaurant/recipe-rows'
import { isRestaurantDish } from '../restaurant/rules'

/** The families the 284 goods come from: uma-art's fifteen, then the ranch's eggs and milk (uma-art's `eggs-milk` line,
 * a family of the farm's). */
export const GOOD_FAMILIES = [
  'grains', 'vegetables', 'herbs-spices', 'nuts-seeds', 'sweets', 'fruits', 'mushrooms', 'woods',
  'ores', 'stones', 'crystals', 'fish', 'fibers', 'hides-scales', 'bones-horns', 'essences', 'eggs-milk',
] as const
/** The rings' family, never in `GOOD_FAMILIES`. */
export const RING_FAMILY = 'rings'
/** A family of the 284 goods. */
export type GoodsFamily = typeof GOOD_FAMILIES[number]
/** A good's family: the fifteen, and the rings. */
export type GoodFamily = GoodsFamily | typeof RING_FAMILY
/** Each family in the player's words. */
export const FAMILY_NAMES: Readonly<Record<GoodFamily, string>> = {
  grains: 'Grains', vegetables: 'Vegetables', 'herbs-spices': 'Herbs and spices', 'nuts-seeds': 'Nuts and seeds', sweets: 'Sweets', fruits: 'Fruits',
  mushrooms: 'Mushrooms', woods: 'Woods', ores: 'Ores', stones: 'Stones', crystals: 'Crystals', fish: 'Fish', fibers: 'Fibers', 'hides-scales': 'Hides and scales',
  'bones-horns': 'Bones and horns', essences: 'Essences', 'eggs-milk': 'Eggs and milk', rings: 'Rings',
}

/** The ranch's eggs and milk, G1 → G4: on uma-art's items atlas from 2.30.0, row 38. */
export const EGGS_MILK = ['egg', 'milk', 'duck-egg', 'goat-milk'] as const
export const ANIMAL_PRODUCT_IDS = Object.values(ANIMAL_PRODUCTS)
const animalProducts: ReadonlySet<string> = new Set(ANIMAL_PRODUCT_IDS)
export const isAnimalProduct = (id: string): boolean => animalProducts.has(id)

/** Each family's ten raw ids, G1 → G10, and their refined forms where the farm keeps them (the vegetables' refined forms
 * leave the game; the expeditions' loot is raw only). */
const FAMILY_IDS: Readonly<Record<GoodsFamily, { raw: readonly string[]; refined: readonly string[] | null }>> = {
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
  fibers: {
    raw: ['flax', 'jute', 'hemp', 'cotton', 'wool', 'alpaca-fleece', 'cashmere-fleece', 'silk-cocoon', 'moonsilk-cocoon', 'cloudfleece'],
    refined: ['linen', 'burlap', 'hemp-cloth', 'cotton-cloth', 'wool-cloth', 'alpaca-cloth', 'cashmere-cloth', 'silk', 'moonsilk', 'cloudweave'],
  },
  'eggs-milk': { raw: EGGS_MILK, refined: null },
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

/** The 27 crops: 22 from the shop and 5 rare ones. Seven are also the forest's (Basil, Mint, Ginger, Mandrake,
 * Peanut, Sunflower Seed, Sugar Beet) and keep their crop price wherever they come from. */
export const LEGACY_CROP_IDS = [
  'carrot', 'potato', 'mint', 'onion', 'cabbage', 'asparagus',
  'tomato', 'basil', 'bell-pepper', 'eggplant', 'sunflower-seed', 'corn',
  'wheat', 'peanut', 'rice', 'sugar-beet', 'emperor-pumpkin',
  'buckwheat', 'oats', 'barley', 'rye', 'ginger',
  'golden-carrot', 'sunwheat', 'moonrice', 'wild-rice', 'mandrake',
] as const
export type LegacyCropId = typeof LEGACY_CROP_IDS[number]
export type CropId = LegacyCropId | NewCropId
export const CROP_IDS: readonly CropId[] = [...LEGACY_CROP_IDS, ...PLANTABLE_ADDITIONS.map(([id]) => id)]
const CROPS: ReadonlySet<string> = new Set(CROP_IDS)
export const isCropId = (id: string): id is CropId => CROPS.has(id)
const rareCrops: ReadonlySet<string> = new Set(RARE_CROPS)
export const canSaveCropSeed = (crop: CropId): boolean => !rareCrops.has(crop)

/** A good in the Warehouse: uma-art's family and grade, raw or refined, whether it's a crop, its price ★1
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
  /** A variant shares its ingredient and market crate with this stable base ID. */
  base?: string
  conversion?: { job: typeof FOOD_CONVERSIONS[number]['job']; level: number; units: number }
}

/** A raw good's price ★1: a crop's own, else the ladder's. Grains and vegetables are all crops. */
function rawPrice(id: string, family: GoodsFamily, grade: number): number {
  if (Object.hasOwn(CROP_PRICES, id)) return CROP_PRICES[id as LegacyCropId]
  if (family === 'grains' || family === 'vegetables') throw new RangeError(`${id} is a ${family} good but not a crop`)
  return ladderPrice(family as LadderFamily, grade)
}

/** The 284 goods, family by family, raw G1–G10 then refined G1–G10 (the eggs and milk G1–G4). */
export const GOODS: readonly Good[] = GOOD_FAMILIES.flatMap((family) => {
  const { raw, refined } = FAMILY_IDS[family]
  const raws = raw.map((id, i): Good => ({ id, family, grade: i + 1, refined: false, crop: CROPS.has(id), price: rawPrice(id, family, i + 1), input: null }))
  const refineds = (refined ?? []).map((id, i): Good => {
    const input = raws[i]!
    return { id, family, grade: i + 1, refined: true, crop: false, price: refinedPrice(input.price), input: input.id }
  })
  return [...raws, ...refineds]
})
export const CARROT_GRADES = [1, 2, 3] as const
export type CarrotGrade = typeof CARROT_GRADES[number]
export const CARROT_GOODS = ['carrot', 'carrot-grade-2', 'carrot-grade-3'] as const
export const carrotGood = (grade: CarrotGrade): typeof CARROT_GOODS[number] => CARROT_GOODS[grade - 1]!
const oldGoods = new Set(GOODS.map((g) => g.id))
const addedGoods: Good[] = PLANTABLE_ADDITIONS.filter(([id]) => !oldGoods.has(id)).map(([id, p]) => ({
  id, family: p.price === undefined ? 'fruits' : 'vegetables', grade: p.grade, crop: true, refined: false, input: null,
  price: p.price ?? ladderPrice('fruits', p.grade),
}))
const gradedCrops = new Map<string, { crop: CropId; grade: number }>()
const cropsByGrade = new Map<CropId, readonly Good[]>()
const rawLadders = new Map<string, readonly Good[]>()
const gradedId = (id: string, grade: number): string => `${id}-grade-${grade}`

function rawGrades(good: Good): readonly Good[] {
  const ladder: Good[] = [good]
  for (let step = 1; step <= 2 && good.grade + step <= 10; step++) {
    ladder.push({ ...good, base: good.id, id: gradedId(good.id, good.grade + step), grade: good.grade + step,
      price: round5(good.price * (step === 1 ? 1.2 : 1.45)) })
  }
  return ladder
}

function refinedGrades(base: Good, inputs: readonly Good[]): Good[] {
  const units = base.conversion?.units ?? 1
  return inputs.map((input, i) => ({
    ...base, ...(i === 0 ? {} : { base: base.id }), id: i === 0 ? base.id : gradedId(base.id, input.grade),
    grade: input.grade, input: input.id, price: units === 1 ? refinedPrice(input.price) : round5(input.price * units * 1.25),
  }))
}

/** Keep legacy family and grade lookups on GOODS. Inventory uses the full catalogue. */
const bases = [...GOODS, ...addedGoods]
for (const good of bases) {
  if (good.refined) continue
  const { id } = good
  const ladder = (isCropId(id) && canSaveCropSeed(id)) || isAnimalProduct(id) || good.family === 'fish' ? rawGrades(good) : [good]
  rawLadders.set(id, ladder)
  if (!isCropId(id)) continue
  cropsByGrade.set(id, ladder)
  for (const variant of ladder) gradedCrops.set(variant.id, { crop: id, grade: variant.grade })
}
const conversions = FOOD_CONVERSIONS.flatMap(({ input, output, ...conversion }) => {
  const inputs = rawLadders.get(input)!
  return refinedGrades({ ...inputs[0]!, id: output, crop: false, refined: true, conversion }, inputs)
})
const standardCatalogue = bases.flatMap((good) => good.input ? refinedGrades(good, rawLadders.get(good.input)!) : [...rawLadders.get(good.id)!])
export const CATALOGUE = [...standardCatalogue, ...conversions]
export const cropGradeOf = (id: string) => gradedCrops.get(id)
export const cropGrades = (crop: CropId): readonly Good[] => cropsByGrade.get(crop)!
export const cropBaseGrade = (crop: CropId): number => cropGrades(crop)[0]!.grade
export const cropGoodId = (crop: CropId, grade: number): string | undefined => cropGrades(crop).find((g) => g.grade === grade)?.id
const GOOD_BY_ID = new Map(CATALOGUE.map((g) => [g.id, g]))
export const baseGoodId = (id: string): string => GOOD_BY_ID.get(id)?.base ?? id
export const gradeVariants = (id: string): readonly Good[] => rawLadders.get(id) ?? []
export const gradeStepId = (id: string, step: number): string => rawLadders.get(id)?.[step]?.id ?? id
export const isBaseFish = (id: string): boolean => rawLadders.get(id)?.[0]?.family === 'fish'
export const GOOD_IDS: readonly string[] = CATALOGUE.map((g) => g.id)

// --- The rings ---------------------------------------------------------------------------------

/** The rings' ★1 prices, G1 → G10. */
export const RING_PRICES = [205, 275, 340, 450, 580, 745, 950, 1220, 1555, 2025] as const
/** The names: Copper to Orichalcum Ring, by grade. */
const RING_METALS = ['Copper', 'Tin', 'Iron', 'Silver', 'Cobalt', 'Gold', 'Platinum', 'Titanium', 'Mythril', 'Orichalcum'] as const
/** A ring's id by its grade (1–10): `ring-g3`. */
export const ringId = (grade: number): string => `ring-g${grade}`
/** The ten rings, G1 → G10 (`ring-g1` … `ring-g10`): the proposal's ring is any of them. */
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
 * here too, so the bin prices them and the screens name them. */
export const goodOf = (id: string): Good | undefined => GOOD_BY_ID.get(id) ?? RING_BY_ID.get(id)
const REFINED_OF = new Map(standardCatalogue.flatMap((g) => (g.input ? [[g.input, g.id] as const] : [])))
for (const good of conversions) if (!REFINED_OF.has(good.input!)) REFINED_OF.set(good.input!, good.id)
/** What a raw good refines into at a station, or null (the vegetables' and the expeditions' have none). */
export const refinedOf = (id: string): string | null => REFINED_OF.get(id) ?? null
/** One of the 284 goods (the rings apart). */
export const isGoodId = (id: string): boolean => GOOD_BY_ID.has(id)
/** A good or a ring: what the bin ships and the Diary counts. */
export const isGoodOrRingId = (id: string): boolean => GOOD_BY_ID.has(id) || RING_BY_ID.has(id)
export const isShippableId = (id: string): boolean => isGoodOrRingId(id) || isRestaurantDish(id)

/** Seeds are Warehouse items with farm ids: `seed-<crop>` from the shop and `seed-<crop>-own` from
 * harvests, held at ★1 only. They have no bin price. */
export const seedId = (crop: CropId, own = false): string => `seed-${crop}${own ? '-own' : ''}`
export const cropSeedId = (crop: CropId, own: boolean, grade = cropBaseGrade(crop)): string => {
  const id = cropGoodId(crop, grade)
  if (!id || (!own && id !== crop)) throw new RangeError('Unknown crop seed')
  return `seed-${id}${own ? '-own' : ''}`
}
export const carrotSeed = (grade: CarrotGrade): string => cropSeedId('carrot', true, grade)
const SEEDS = new Map<string, { crop: CropId; own: boolean; grade?: number }>()
for (const crop of CROP_IDS) {
  SEEDS.set(seedId(crop), { crop, own: false })
  SEEDS.set(seedId(crop, true), { crop, own: true })
  for (const good of cropGrades(crop).slice(1)) SEEDS.set(cropSeedId(crop, true, good.grade), { crop, own: true, grade: good.grade })
}
export const SEED_IDS: readonly string[] = [...SEEDS.keys()]
export const isSeedId = (id: string): boolean => SEEDS.has(id)
/** A seed's crop and whether it's an own seed, or undefined for any other id. */
export const seedOf = (id: string) => SEEDS.get(id)

/** A good or a seed (the rings and dishes apart: `isStockId`). */
export const isWarehouseId = (id: string): boolean => GOOD_BY_ID.has(id) || SEEDS.has(id)

