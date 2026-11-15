// Food: everyone who eats on the farm eats twice a day, from day one. What isn't cooked is bought in as takeout, at a
// price you feel from the first night; cooking turns the Warehouse's goods into meals in batches.
//
//   who eats     the farmer, everyone living on the farm (home in the Dorm, a spouse in her house) and every farmhand who
//                works that day (spends an action tonight); two meals each, at night
//   the pantry   cooked meals wait here, by the day they were cooked and their stars (`farm.pantry`). A meal keeps two
//                days: cooked today, it's eaten tonight or tomorrow night, then it spoils
//   the night    step 2, after the farmhands work: each mouth eats two meals from the pantry, the Umas first (the
//                farmhands in their order, then the rest of the farm), the farmer last; the oldest meals first, the best
//                of those. What's short is **takeout**, 15g a meal, charged with the upkeep (`settleAccounts`)
//   cooking      the farmer: **Cook a batch** in the farmhouse kitchen (the homestead's sheet), 1 action: four meals from
//                two goods of food; a household meal cooks one too. A farmhand on **Cook**: a batch an action, 4 meals at
//                Cooking 1 up to 12 at Cooking 10, from two goods, until the pantry holds tonight's meals
//   stars        a batch's meals have its two goods' stars, averaged and rounded down. An Uma who eats a ★2+ meal is
//                well fed tomorrow (the household meal's well fed: it never stacks and never shortens one running)
//   the goods    the food families, raw or refined: grains, vegetables, herbs and spices, nuts and seeds, sweets,
//                fruits, mushrooms, fish, eggs and milk. The plain rule takes the two cheapest goods of ★2 or more, so
//                the meals feed well; with fewer than two held, the two cheapest. Cheapest is the price at its stars,
//                out of demand. The farmer may choose any two
//
// **The Kitchen (Phase 2.3)** adds the cooking minigame: a batch the farmer cooks there plays it, and its grade lifts the
// meals (`cookBatch`'s `lift`, 0 until then). Pure; never stamps. Loaded with the night, the Book and the homestead.
import { spend } from './actions'
import { goodOf, type GoodsFamily } from '../goods/ids'
import { starPrice } from '../goods/prices'
import { SaveRuleError } from '../save/rules'
import { farmHome, type FarmSave, type PantryLot } from '../save/v4'
import { MAX_STARS, parseStockKey, stockKey, takeGoods } from '../save/warehouse'

/** Each mouth eats two meals a night. */
export const MEALS_A_DAY = 2
/** A meal bought in, for each the pantry is short. */
export const TAKEOUT_PRICE = 15
/** A meal keeps this many days: the day it's cooked and the next. */
export const MEAL_KEEPS = 2
/** The farmer's batch: four meals from two goods. */
export const BATCH_MEALS = 4
export const BATCH_GOODS = 2
/** A farmhand's batch by her Cooking level, 1–10: 4 meals, up to 12, from the same two goods. */
export const COOK_BATCH: readonly number[] = [4, 5, 6, 7, 8, 8, 9, 10, 11, 12]
/** A meal of this many stars or more leaves an Uma who eats it well fed. */
export const WELL_FED_STARS = 2
/** Well fed from a good meal: through tomorrow, as a household meal's (`MEAL_DAYS`). The night counts it down once, so
 * she's well fed in the morning and her work tomorrow night is too. */
export const PANTRY_FED_DAYS = 2

/** The families that are food, raw or refined. Woods, ores, stones, crystals, fibers, hides, bones and essences aren't. */
export const FOOD_FAMILIES: readonly GoodsFamily[] = ['grains', 'vegetables', 'herbs-spices', 'nuts-seeds', 'sweets', 'fruits', 'mushrooms', 'fish', 'eggs-milk']
const FOOD: ReadonlySet<string> = new Set(FOOD_FAMILIES)
/** Whether a good is food: one of the food families' goods, raw or refined (never a seed, a ring or a dish). */
export const isFoodId = (id: string): boolean => FOOD.has(goodOf(id)?.family ?? '')

/** A farmhand's batch at her Cooking level. */
export const cookBatchAt = (level: number): number => COOK_BATCH[Math.max(1, Math.min(COOK_BATCH.length, level)) - 1]!

// --- The pantry ------------------------------------------------------------------------------------------------------

/** The meals in the pantry, every lot. */
export const pantryMeals = (save: Pick<FarmSave, 'farm'>): number => save.farm.pantry.reduce((n, l) => n + l.meals, 0)

/** The pantry with `meals` more cooked on `day` at `stars`: one lot a day and star, the oldest first, the best first
 * within a day. */
export function addMeals(pantry: readonly PantryLot[], day: number, stars: number, meals: number): PantryLot[] {
  if (meals <= 0) return [...pantry]
  const same = pantry.find((l) => l.day === day && l.stars === stars)
  const lots = same ? pantry.map((l) => (l === same ? { ...l, meals: l.meals + meals } : l)) : [...pantry, { day, stars, meals }]
  return lots.sort((a, b) => a.day - b.day || b.stars - a.stars)
}

/** The Umas who eat tonight, in the order they eat: the farmhands who work tonight in their order, then everyone else
 * living on the farm. The farmer eats last. */
export function umasAtTable(save: Pick<FarmSave, 'dorm' | 'love' | 'roster'>, working: readonly string[]): string[] {
  return [...new Set([...working, ...farmHome(save)])].filter((id) => save.roster[id])
}
/** The mouths tonight: the Umas at the table and the farmer. */
export const mouthsTonight = (save: Pick<FarmSave, 'dorm' | 'love' | 'roster'>, working: readonly string[]): number => umasAtTable(save, working).length + 1

/** The farmhands who'll work tonight as the board stands: every one with a task on it. A cook reads her table by them. */
export const handsWithTasks = (save: Pick<FarmSave, 'roster'>): string[] =>
  Object.keys(save.roster).filter((id) => save.roster[id]!.farmhand !== undefined && (save.roster[id]!.tasks ?? []).length > 0)

/** The meals tonight's table needs, as the board stands (a cook stops once the pantry holds them). */
export const mealsNeeded = (save: Pick<FarmSave, 'dorm' | 'love' | 'roster'>): number => MEALS_A_DAY * mouthsTonight(save, handsWithTasks(save))

/** What the farm ate tonight. */
export interface Eaten<S extends FarmSave> {
  save: S
  /** Everyone who ate: the Umas at the table and the farmer. */
  mouths: number
  /** Meals eaten from the pantry. */
  pantry: number
  /** Meals the pantry was short: takeout. */
  takeout: number
  /** Meals two days old, left uneaten: gone. */
  spoiled: number
  /** The Umas a ★2+ meal left well fed, in the order they ate. */
  fed: string[]
}

/**
 * Night step 2, after the farmhands work: **the farm eats.** Each mouth eats two meals from the pantry: the Umas first
 * (`working`, the farmhands who worked tonight in their order, then the rest of the farm), the farmer last; the oldest
 * meals first and the best of those. An Uma who eats a ★2+ meal is well fed through tomorrow (never shortened). What's
 * short is takeout, charged with the upkeep. Meals cooked today keep for tomorrow night; older ones left over spoil.
 */
export function eatTonight<S extends FarmSave>(save: S, working: readonly string[]): Eaten<S> {
  const today = save.calendar.day
  const lots = save.farm.pantry.map((l) => ({ ...l })).sort((a, b) => a.day - b.day || b.stars - a.stars)
  const take = (): number | null => {
    const lot = lots.find((l) => l.meals > 0)
    if (!lot) return null
    lot.meals -= 1
    return lot.stars
  }
  const umas = umasAtTable(save, working)
  let pantry = 0
  let takeout = 0
  const fed: string[] = []
  for (const mouth of [...umas, null]) {
    let good = false
    for (let n = 0; n < MEALS_A_DAY; n++) {
      const stars = take()
      if (stars === null) takeout++
      else {
        pantry++
        if (stars >= WELL_FED_STARS) good = true
      }
    }
    if (good && mouth !== null) fed.push(mouth)
  }
  const spoiled = lots.filter((l) => l.day < today).reduce((n, l) => n + l.meals, 0)
  const kept = lots.filter((l) => l.day >= today && l.meals > 0)
  const roster = fed.length === 0 ? save.roster
    : { ...save.roster, ...Object.fromEntries(fed.map((id) => [id, { ...save.roster[id]!, wellFed: Math.max(save.roster[id]!.wellFed, PANTRY_FED_DAYS) }])) }
  return { save: { ...save, roster, farm: { ...save.farm, pantry: kept } }, mouths: umas.length + 1, pantry, takeout, spoiled, fed }
}

// --- Cooking ---------------------------------------------------------------------------------------------------------

/** One good of food held, at its stars: its stock key, and what one sells for there (out of demand). */
export interface FoodHeld {
  key: string
  id: string
  stars: number
  count: number
  price: number
}
/** The food in the Warehouse, a row a good and star: by the plain rule's order within a star, the cheapest first, then
 * by id. */
export function foodHeld(save: Pick<FarmSave, 'items'>): FoodHeld[] {
  return Object.entries(save.items).flatMap(([id, row]) => (isFoodId(id)
    ? row.flatMap((count, s) => (count > 0 ? [{ key: stockKey(id, s + 1), id, stars: s + 1, count, price: starPrice(id, s + 1) }] : []))
    : []))
    .sort((a, b) => a.price - b.price || a.id.localeCompare(b.id) || a.stars - b.stars)
}

/** The plain rule's two goods for a batch, as stock keys (one key twice when two of it are held): the two cheapest goods
 * of ★2 or more, so the meals feed well; with fewer than two held, the two cheapest. Cheapest is the price at its stars
 * out of demand, then the id. Null with fewer than two goods of food. */
export function plainBatch(save: Pick<FarmSave, 'items'>): string[] | null {
  const units = foodHeld(save).flatMap((r) => Array.from({ length: Math.min(r.count, BATCH_GOODS) }, () => r))
  if (units.length < BATCH_GOODS) return null
  const good = units.filter((u) => u.stars >= WELL_FED_STARS)
  return (good.length >= BATCH_GOODS ? good : units).slice(0, BATCH_GOODS).map((u) => u.key)
}

/** A batch's meals' stars: its goods' stars, averaged and rounded down, plus a lift (the Kitchen's play, later), held to
 * ★5. */
export const batchStars = (keys: readonly string[], lift = 0): number =>
  Math.min(MAX_STARS, Math.floor(keys.reduce((n, k) => n + (parseStockKey(k)?.stars ?? 1), 0) / Math.max(1, keys.length)) + lift)

/** Why the farmer can't cook a batch of these goods (the plain rule's when none are named), or null. */
export function batchBlock(save: Pick<FarmSave, 'items'>, picks: readonly string[] | null = null): string | null {
  const keys = picks ?? plainBatch(save)
  if (!keys) return 'Two goods of food make a batch: crops, fish, eggs and milk, mushrooms, fruits, nuts or sweets.'
  if (keys.length !== BATCH_GOODS) return 'A batch takes two goods.'
  for (const key of keys) {
    const at = parseStockKey(key)
    if (!at || !isFoodId(at.id)) return 'Only food goes in a batch.'
    if ((save.items[at.id]?.[at.stars - 1] ?? 0) < keys.filter((k) => k === key).length) return 'Not enough in the Warehouse.'
  }
  return null
}

/** The goods out of the Warehouse and the batch's meals into the pantry, cooked today. */
export function addBatch<S extends FarmSave>(save: S, keys: readonly string[], meals: number, lift = 0): S {
  let items = save.items
  for (const key of keys) {
    const at = parseStockKey(key)!
    items = takeGoods(items, at.id, at.stars, 1)
  }
  return { ...save, items, farm: { ...save.farm, pantry: addMeals(save.farm.pantry, save.calendar.day, batchStars(keys, lift), meals) } }
}

/** **Cook a batch**, in the farmhouse kitchen: one action; two goods of food (`picks`, stock keys; the plain rule's when
 * none) out of the Warehouse, four meals at their stars into the pantry, cooked today. `lift` is the Kitchen's play's
 * grade (Phase 2.3), 0 until it stands. Refused with fewer than two goods of food held or a pick not held (`no-items`),
 * a pick that isn't food (`bad-job`), anything but two picks (`bad-count`), and with no action left. Never stamps. */
export function cookBatch<S extends FarmSave>(save: S, picks: readonly string[] | null = null, lift = 0): S {
  const block = batchBlock(save, picks)
  if (block) throw new SaveRuleError(block === 'A batch takes two goods.' ? 'bad-count' : block === 'Only food goes in a batch.' ? 'bad-job' : 'no-items', block)
  return addBatch(spend(save, 'batch'), picks ?? plainBatch(save)!, BATCH_MEALS, lift)
}
