import { itemNameOf } from '../items/lines'
import { restaurantDishName } from '../restaurant/recipe-rows'
import { goodOf, GOODS, isRingId, ringName, seedOf } from './ids'

/** Each dish kind's word, by its family. */
export const DISH_WORDS = {
  vegetables: 'Salad', grains: 'Bread', fruits: 'Tart', fish: 'Grill', 'herbs-spices': 'Curry', mushrooms: 'Soup', sweets: 'Cake', 'nuts-seeds': 'Cookies',
} as const
/** A dish in words (`dish-<family>-<grade>`): its family's raw good of its grade, then its kind ("Carrot Salad", "Button
 * Mushroom Soup"), as uma-art's atlas names them. Anything else by its id's words. */
export function dishName(id: string): string {
  const restaurant = restaurantDishName(id)
  if (restaurant) return restaurant
  const m = /^dish-([a-z-]+)-(10|[1-9])$/.exec(id)
  const word = m ? (DISH_WORDS as Readonly<Record<string, string>>)[m[1]!] : undefined
  if (!m || !word) return itemNameOf(id)
  const raw = GOODS.find((g) => g.family === m[1] && !g.refined && g.grade === Number(m[2]))
  return `${raw ? itemNameOf(raw.id) : itemNameOf(m[1]!)} ${word}`
}

/** A Warehouse item in the player's words: a good by its uma-art id ("Sunflower Seed"), a seed by its crop
 * ("Carrot seeds", "Carrot seeds (own)"), a ring by its name ("Iron Ring") and a dish by its kind ("Carp Grill"). */
export function goodName(id: string): string {
  const seed = seedOf(id)
  if (seed) return `${itemNameOf(seed.crop)}${seed.grade ? ` G${seed.grade}` : ''} seeds${seed.own ? ' (own)' : ''}`
  const variant = goodOf(id)
  if (variant?.base) return `${itemNameOf(variant.base)} G${variant.grade}`
  if (isRingId(id)) return ringName(variant!.grade)
  return id.startsWith('dish-') ? dishName(id) : itemNameOf(id)
}
