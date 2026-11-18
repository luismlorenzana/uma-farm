// The price rule's numbers: one ladder of ten grades × the family's
// factor, refined ×1.5, made goods ×1.25 their inputs, crops at their own prices, +25% a star (never compounded), and +20%
// for the season's demand. Data and arithmetic only: `ids.ts` gives every good its price ★1 from here, and `prices.ts`
// adds stars and demand.
import type { Season } from '../farm/calendar'
import { round5 } from '../farm/round'
import type { LegacyCropId, GoodFamily, GoodsFamily } from './ids'

/** A grade's base price, G1 → G10. */
export const LADDER = [30, 40, 50, 65, 85, 110, 140, 180, 230, 300] as const

/** The families the ladder prices. Grains and vegetables are all crops, which have their own prices. */
export type LadderFamily = Exclude<GoodsFamily, 'grains' | 'vegetables'>

/** Each family's factor on the ladder. */
export const FAMILY_FACTOR: Readonly<Record<LadderFamily, number>> = {
  ores: 1.0, stones: 0.8, crystals: 1.6, woods: 0.8, mushrooms: 1.0, 'herbs-spices': 0.9, fruits: 1.1, 'nuts-seeds': 1.0,
  sweets: 1.1, fish: 1.3, fibers: 1.2, 'hides-scales': 1.5, 'bones-horns': 1.6, essences: 1.8, 'eggs-milk': 2.0,
}

/** A station's 1 → 1 output sells at ×1.5 its input. */
export const REFINED_FACTOR = 1.5
/** Made goods and dishes sell at ×1.25 the sum of their inputs at ★1. */
export const MADE_FACTOR = 1.25
/** Each star above ★1 adds a quarter of the base, never compounded: ★5 is exactly twice ★1. */
export const STAR_STEP = 0.25
/** The season's demand adds a fifth, on top of the stars. */
export const DEMAND_LIFT = 0.2

/** The crops' own prices ★1, wherever they come from: the seven that are also forest goods keep them. */
export const CROP_PRICES: Readonly<Record<LegacyCropId, number>> = {
  carrot: 60, potato: 55, mint: 45, onion: 100, cabbage: 260, asparagus: 480,
  tomato: 70, basil: 45, 'bell-pepper': 60, eggplant: 95, 'sunflower-seed': 75, corn: 140,
  wheat: 40, peanut: 35, rice: 50, 'sugar-beet': 120, 'emperor-pumpkin': 600,
  buckwheat: 75, oats: 40, barley: 45, rye: 60, ginger: 200,
  'golden-carrot': 600, sunwheat: 260, moonrice: 240, 'wild-rice': 160, mandrake: 520,
}

/** A family's raw good of grade `grade` (1–10) on the ladder: `LADDER[g] × factor`, to 5g. */
export function ladderPrice(family: LadderFamily, grade: number): number {
  const base = LADDER[grade - 1]
  if (base === undefined) throw new RangeError(`No grade ${grade}`)
  return round5(base * FAMILY_FACTOR[family])
}

/** A refined good's price from its input's rounded price: ×1.5, to 5g. */
export const refinedPrice = (inputPrice: number): number => round5(inputPrice * REFINED_FACTOR)

/** A season's demand rule: an uma-art family, all of it or only its refined row. */
export interface DemandRule {
  /** A good's family, or `dishes`. */
  family: GoodFamily | 'dishes'
  /** Only the refined row: Winter's preserves (fruits) and cloth (fibers). */
  refined?: true
  /** The rule in the player's words. */
  name: string
}

/** The season's demand: its families' raw and refined goods; Winter's preserves and cloth are a refined row, and
 * dishes every dish. A good is in demand once, however many rules name it. */
export const DEMAND: Readonly<Record<Season, readonly DemandRule[]>> = {
  spring: [{ family: 'vegetables', name: 'Vegetables' }, { family: 'sweets', name: 'Sweets' }],
  summer: [{ family: 'fruits', name: 'Fruits' }, { family: 'fish', name: 'Fish' }],
  autumn: [{ family: 'grains', name: 'Grains' }, { family: 'mushrooms', name: 'Mushrooms' }, { family: 'nuts-seeds', name: 'Nuts and seeds' }],
  winter: [{ family: 'dishes', name: 'Dishes' }, { family: 'fibers', refined: true, name: 'Cloth' }, { family: 'fruits', refined: true, name: 'Preserves' }],
}
