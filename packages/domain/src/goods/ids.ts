// The v3 Warehouse's ids (F17 decision 7; core spec CS19): the goods CS19 prices by the ladder or as crops, plus seeds.
// Written from uma-art 2.21.0's `items/atlas.json`: every good's id, family and grade are uma-art's own, so names and
// icons come from ids as today (a web test checks each id is on the atlas). 260 goods: 27 crops and 10 flours, the
// forest's 113, mining's 60, fishing's 20 and expeditions' 30. The ranch's, the dishes' and the Forge's goods join with
// their packets (F27, F8, F36). Prices, seasons and stations are F19's, F20's and F22's.

/** uma-art's families the v3 goods come from. */
export const GOOD_FAMILIES = [
  'grains', 'vegetables', 'herbs-spices', 'nuts-seeds', 'sweets', 'fruits', 'mushrooms', 'woods',
  'ores', 'stones', 'crystals', 'fish', 'hides-scales', 'bones-horns', 'essences',
] as const
export type GoodFamily = typeof GOOD_FAMILIES[number]

/** Each family's ten raw ids, G1 → G10, and their refined forms where the farm keeps them (the vegetables' refined forms
 * leave the game, D28; the expeditions' loot is raw only). */
const FAMILY_IDS: Readonly<Record<GoodFamily, { raw: readonly string[]; refined: readonly string[] | null }>> = {
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

/** A good in the v3 Warehouse: uma-art's family and grade, raw or refined, and whether it's a crop. */
export interface Good {
  id: string
  family: GoodFamily
  grade: number
  refined: boolean
  crop: boolean
}

/** The 260 goods, family by family, raw G1–G10 then refined G1–G10. */
export const GOODS: readonly Good[] = GOOD_FAMILIES.flatMap((family) => {
  const { raw, refined } = FAMILY_IDS[family]
  const of = (ids: readonly string[], isRefined: boolean): Good[] =>
    ids.map((id, i) => ({ id, family, grade: i + 1, refined: isRefined, crop: CROPS.has(id) }))
  return [...of(raw, false), ...of(refined ?? [], true)]
})
const GOOD_BY_ID = new Map(GOODS.map((g) => [g.id, g]))
export const GOOD_IDS: readonly string[] = GOODS.map((g) => g.id)
export const goodOf = (id: string): Good | undefined => GOOD_BY_ID.get(id)
export const isGoodId = (id: string): boolean => GOOD_BY_ID.has(id)

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
