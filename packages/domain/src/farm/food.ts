// Food: everyone who eats on the farm eats twice a day, from day one. What isn't cooked is bought in as takeout, at a
// price you feel from the first night; cooking turns the Warehouse's goods into meals in batches.
//
//   who eats     the farmer, every spouse in her room (who lives on the farm) and every farmhand on her farm day (on the
//                farm that day, `town/town.ts`'s `worksOn`); two meals each, at night. A farmhand on a town day eats in
//                town, and costs the farm nothing
//   the pantry   cooked meals wait here, by the day they were cooked and their stars (`farm.pantry`). A meal keeps three
//                days: cooked today, it's eaten tonight, tomorrow night or the night after, then it spoils; so a farmer
//                alone eats all six of a batch
//   the night    step 2, after the farmhands work: each mouth eats two meals from the pantry, the Umas first (the
//                farmhands in their order, then the rest of the farm), the farmer last; the oldest meals first, the best
//                of those. What's short is **takeout**, 15g a meal, charged with the upkeep (`settleAccounts`)
//   cooking      the farmer: **Cook a batch** in the farmhouse kitchen (the homestead's sheet), 1 action: six meals from
//                two goods of food (90g of takeout from two goods worth 60–80g: cooking saves gold); a household meal
//                cooks one too. A farmhand on **Cook**: a batch an action, 6 meals at Cooking 1 up to 12 at Cooking 10,
//                from two goods, until the pantry holds tonight's meals
//   stars        a batch's meals have its two goods' stars, averaged and rounded down. An Uma who eats a ★2+ meal is
//                well fed tomorrow (the household meal's well fed: it never stacks and never shortens one running)
//   the goods    the food families, raw or refined: grains, vegetables, herbs and spices, nuts and seeds, sweets,
//                fruits, mushrooms, fish, eggs and milk. The plain rule takes the cheapest pair outside stock floors
//                that averages ★2 or more, or the cheapest available pair if none qualifies. Price uses the good's
//                stars outside demand. The farmer may choose any two
//
//   the stove    **At the stove · 1**, beside the plain batch: the same batch played at the stove, its tier lifting its
//                meals' count and stars (`kitchen/kitchen.ts`); never worse than the plain batch
//   staff meal   served at the Kitchen, its mouths eat it tonight in place of their two meals (`today.staff`)
//
// Pure; never stamps. Loaded with the night, the Book and the homestead.
import { awayOn, leavingOn } from '../expeditions/presence'
import type { Expedition } from '../save/v4'
import { spend } from './actions'
import { routineStockFloors } from './production'
import { goodOf, type GoodsFamily } from '../goods/ids'
import { starPrice } from '../goods/prices'
import { SaveRuleError } from '../save/rules'
import { farmHome, MEAL_KEEPS, type FarmSave, type PantryLot } from '../save/v4'
import { goodCount, MAX_STARS, parseStockKey, stockKey, takeGoods } from '../save/warehouse'
import { worksOn, type SchedulePack } from '../town/town'

/** Each mouth eats two meals a night. */
export const MEALS_A_DAY = 2
/** A meal bought in, for each the pantry is short. */
export const TAKEOUT_PRICE = 15
/** The farmer's batch: six meals from two goods, so a batch of the cheapest goods saves gold against takeout. */
export const BATCH_MEALS = 6
export const BATCH_GOODS = 2
/** A farmhand's batch by her Cooking level, 1–10: 6 meals, up to 12, from the same two goods (6 + 6 × (level − 1) / 9,
 * rounded). */
export const COOK_BATCH: readonly number[] = [6, 7, 7, 8, 9, 9, 10, 11, 11, 12]
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

type TableSave = Pick<FarmSave, 'love' | 'roster'> & Partial<Pick<FarmSave, 'calendar' | 'expeditions'>>
type ScheduledTable = TableSave & Pick<FarmSave, 'calendar'>

/** The Umas who eat tonight, in the order they eat: the farmhands on the farm today in their order (`working`), then
 * everyone else who lives there (the spouses in their rooms). The farmer eats last. */
export function umasAtTable(save: TableSave, working: readonly string[]): string[] {
  const today = save.calendar?.day
  const leaving = new Set(today === undefined ? [] : leavingOn(save, today).flatMap((trip) => trip.party))
  return [...new Set([...working, ...farmHome(save)])].filter((id) =>
    save.roster[id] && !leaving.has(id) && (today === undefined || !awayOn(save, id, today)))
}
/** The mouths tonight: the Umas at the table and the farmer. */
export const mouthsTonight = (save: TableSave, working: readonly string[]): number => umasAtTable(save, working).length + 1

/** The farmhands on the farm today, who eat there tonight: each on her farm day (`worksOn`; every one with no pack to read
 * their schedules). A cook reads her table by them. */
export const handsAtTable = (save: ScheduledTable, pack: SchedulePack | null): string[] =>
  Object.keys(save.roster).filter((id) => worksOn(save, pack, id))

export const expeditionMeals = (trip: Pick<Expedition, 'left' | 'back' | 'party'>): number =>
  MEALS_A_DAY * trip.party.length * (trip.back - trip.left)

const mealsToPack = (save: ScheduledTable): number =>
  leavingOn(save, save.calendar.day).reduce((sum, trip) => sum + expeditionMeals(trip), 0)

/** The meals tonight's table needs (a cook stops once the pantry holds them): two a mouth, but for the mouths a staff
 * meal feeds tonight. */
export const mealsNeeded = (save: ScheduledTable & Partial<Pick<FarmSave, 'today'>>, pack: SchedulePack | null): number =>
  MEALS_A_DAY * Math.max(0, mouthsTonight(save, handsAtTable(save, pack)) - (save.today?.staff?.mouths ?? 0)) + mealsToPack(save)

/** What the farm ate tonight. */
export interface Eaten<S extends FarmSave> {
  save: S
  /** Everyone who ate: the Umas at the table and the farmer. */
  mouths: number
  /** Meals eaten from the pantry. */
  pantry: number
  /** Meals the pantry was short: takeout. */
  takeout: number
  /** Meals past their three days, left uneaten: gone. */
  spoiled: number
  /** The Umas a ★2+ meal left well fed, in the order they ate. */
  fed: string[]
  /** Tonight's staff meal: the mouths who ate it in place of their meals, and its well-fed days; null with none. */
  staff: { mouths: number; days: number } | null
}

/**
 * Night step 2, after the farmhands work: **the farm eats.** Each mouth eats two meals from the pantry: the Umas first
 * (`working`, the farmhands on the farm today in their order, then the spouses who live there), the farmer last; the oldest
 * meals first and the best of those. An Uma who eats a ★2+ meal is well fed through tomorrow (never shortened). What's
 * short is takeout, charged with the upkeep. Meals cooked today or yesterday keep for tomorrow night; older ones left over
 * spoil. **Tonight's staff meal** (`today.staff`, served at the Kitchen) feeds its mouths first, in place of their two
 * meals: the farmer, then the Umas in the table's order; mouths past those it was served for eat from the pantry. Every Uma
 * who eats it is well fed for its days from tomorrow (`days` + 1 tonight, as the night counts it down once), never
 * shortened.
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
  const staff = save.today.staff ?? null
  const served = staff ? Math.min(staff.mouths, umas.length + 1) : 0
  const staffed = new Set(umas.slice(0, Math.max(0, served - 1)))
  let pantry = 0
  let takeout = 0
  const fed: string[] = []
  for (const mouth of [...umas, null]) {
    if (mouth === null ? served > 0 : staffed.has(mouth)) continue
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
  // Pack the party's meals after the home table, before any unused food spoils.
  for (let i = 0, n = mealsToPack(save); i < n; i++) {
    if (take() === null) takeout++
    else pantry++
  }
  // A lot cooked on day D is eaten on nights D to D + MEAL_KEEPS − 1; after tonight, the lots past that spoil.
  const keeps = (l: PantryLot) => l.day > today - MEAL_KEEPS + 1
  const spoiled = lots.filter((l) => !keeps(l)).reduce((n, l) => n + l.meals, 0)
  const kept = lots.filter((l) => keeps(l) && l.meals > 0)
  let roster = fed.length === 0 ? save.roster
    : { ...save.roster, ...Object.fromEntries(fed.map((id) => [id, { ...save.roster[id]!, wellFed: Math.max(save.roster[id]!.wellFed, PANTRY_FED_DAYS) }])) }
  if (staff && staffed.size > 0) roster = { ...roster, ...Object.fromEntries([...staffed].map((id) => [id, { ...roster[id]!, wellFed: Math.max(roster[id]!.wellFed, staff.days + 1) }])) }
  return {
    save: { ...save, roster, farm: { ...save.farm, pantry: kept } }, mouths: umas.length + 1, pantry, takeout, spoiled, fed,
    staff: staff && served > 0 ? { mouths: served, days: staff.days } : null,
  }
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

/** The cheapest pair that averages ★2, or the cheapest pair when none can. Routine cooking keeps stock floors. */
export function plainBatch(save: Pick<FarmSave, 'items'> & Partial<Pick<FarmSave, 'farm'>>): string[] | null {
  const available = new Map(Object.entries(routineStockFloors(save.farm)).map(([id, floor]) => [id, Math.max(0, goodCount(save.items, id) - floor)]))
  const units = foodHeld(save).flatMap((r) => {
    const remaining = available.get(r.id)
    const count = Math.min(r.count, remaining ?? r.count)
    if (remaining !== undefined) available.set(r.id, remaining - count)
    return Array.from({ length: Math.min(count, BATCH_GOODS) }, () => r)
  })
  if (units.length < BATCH_GOODS) return null
  const cheap = units.slice(0, BATCH_GOODS)
  const good = units.filter(row => row.stars >= WELL_FED_STARS).slice(0, BATCH_GOODS)
  const one = units.find(row => row.stars === 1)
  const three = units.find(row => row.stars >= WELL_FED_STARS * 2 - 1)
  const pair = one && three && (good.length < BATCH_GOODS || one.price + three.price < good[0]!.price + good[1]!.price) ? [one, three]
    : good.length === BATCH_GOODS ? good : cheap
  return pair.map(row => row.key)
}

/** A batch's meals' stars: its goods' stars, averaged and rounded down, plus a lift (the stove's tier: +0, +0, +1, +2),
 * held to ★5. */
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
 * none) out of the Warehouse, six meals at their stars into the pantry, cooked today. `lift` lifts their stars (the
 * plain batch's is 0; the stove's play settles its own, `kitchen/kitchen.ts`). Refused with fewer than two goods of food held or a pick not held (`no-items`),
 * a pick that isn't food (`bad-job`), anything but two picks (`bad-count`), and with no action left. Never stamps. */
export function cookBatch<S extends FarmSave>(save: S, picks: readonly string[] | null = null, lift = 0): S {
  const block = batchBlock(save, picks)
  if (block) throw new SaveRuleError(block === 'A batch takes two goods.' ? 'bad-count' : block === 'Only food goes in a batch.' ? 'bad-job' : 'no-items', block)
  return addBatch(spend(save, 'batch'), picks ?? plainBatch(save)!, BATCH_MEALS, lift)
}
