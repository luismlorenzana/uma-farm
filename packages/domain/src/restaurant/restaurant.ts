import { availableDishes } from '../expeditions/stock'
import { activeContest, festivalBooked } from '../festivals/state'
import { bookedForExpedition } from '../expeditions/presence'
import { actionCost, actionsLeft, spend } from '../farm/actions'
import { draw, mulberry32 } from '../farm/draw'
import { addMeals, BATCH_MEALS } from '../farm/food'
import { handDay } from '../farm/farmhands'
import { placeBuilt } from '../farm/places'
import { countChallenge } from '../farm/rank-rules'
import { round5 } from '../farm/round'
import { talentsD, type TalentOf } from '../farm/talents'
import { goodOf, GOODS } from '../goods/ids'
import { starFactor, starPrice } from '../goods/prices'
import { recipeOf } from '../kitchen/recipes'
import { seedFrom, tierOf } from '../kitchen/stove'
import { perkLineOf } from '../romance/perks'
import { atHerLine, choresOf, hasPerk, onFarmForPerks, type PerkPack } from '../romance/perk-terms'
import { GOLD_SHIPPED } from '../save/bin'
import { earnGold } from '../save/gold'
import { SaveRuleError } from '../save/rules'
import { isDishId, MENU_RECIPES, type FarmSave } from '../save/v4'
import { addGoods, parseStockKey, takeGoods } from '../save/warehouse'
import { worksOn } from '../town/town'
import { knownRestaurantRecipes, knowsRestaurantRecipe, restaurantRecipe } from './recipes'
import {
  isRestaurantDish, LAST_STAGE, MAX_TRAY, restaurantStage, WRONG_PLATE_MS,
  type RestaurantResult, type RestaurantShift, type ServiceTicket, type StockPortions,
} from './rules'

const GRACE_MS = 4000
const PLAYS = 'plays'

export interface ServingContext {
  readonly talentOf?: TalentOf
  readonly story?: PerkPack | null
}

const dishAt = (key: string) => parseStockKey(key)?.id ?? ''

export const nextRestaurantStage = (save: Pick<FarmSave, 'workshops'>): number =>
  Math.min(LAST_STAGE, (save.workshops.restaurant?.cleared ?? 0) + 1)

export function serverLock(save: FarmSave, id: string, story: PerkPack | null = null): string | null {
  const day = handDay(save, id)
  if (!day) return 'Only a farmhand can serve.'
  if (bookedForExpedition(save, id)) return 'She’s in an expedition party.'
  if (!worksOn(save, story, id)) return 'She’s in town today.'
  if (day.kitchen || save.today.server === id || festivalBooked(save, id)) return 'She’s booked today.'
  return day.actions < 1 ? 'She has no action left tonight.' : null
}

function previouslyLearned(save: FarmSave, id: string, stage: number): boolean {
  const recipe = restaurantRecipe(id)
  return recipe !== undefined && recipe.grade < stage && knowsRestaurantRecipe(save, recipe)
}

export function shiftBlock(save: FarmSave, stage: number, tray: readonly StockPortions[], server: string | null = null, story: PerkPack | null = null): string | null {
  if (!placeBuilt(save, 'restaurant')) return 'Build the Restaurant first.'
  if (!placeBuilt(save, 'kitchen')) return 'Build the Kitchen first.'
  if (save.workshops.current || save.workshops.restaurant?.shift || activeContest(save)) return 'A play is under way.'
  if (save.workshops.played.restaurant === save.calendar.day) return 'One shift per day.'
  if (actionsLeft(save) < actionCost('restaurant')) return 'No actions left today.'
  const rule = restaurantStage(stage)
  if (!rule || stage > nextRestaurantStage(save)) return 'Clear the previous stage first.'
  const ids = new Set<string>()
  const keys = new Set<string>()
  let count = 0
  for (const line of tray) {
    const id = dishAt(line.key)
    if (!isDishId(id) || keys.has(line.key) || !Number.isInteger(line.count) || line.count < 1 || line.count > MAX_TRAY) return 'Choose portions from the Warehouse.'
    if (availableDishes(save, line.key) < line.count) return 'Not enough available dishes.'
    ids.add(id)
    keys.add(line.key)
    count += line.count
  }
  if (ids.size > MENU_RECIPES || count > MAX_TRAY) return 'Stock up to 12 portions of three dishes.'
  if (ids.size < rule.types) return `Stock at least ${rule.types} dish ${rule.types === 1 ? 'type' : 'types'}.`
  if (count < rule.tickets) return `Stock at least ${rule.tickets} portions.`
  if (stage >= 3 && ![...ids].some((id) => previouslyLearned(save, id, stage))) return 'Stock a learned dish from an earlier stage.'
  return server ? serverLock(save, server, story) : null
}

export function servingPerk(save: FarmSave, id: string, pack: PerkPack | null): number {
  if (!pack || !atHerLine(save, pack, id, 'restaurant')) return 0
  return 10 * (Number(hasPerk(save.love[id], 'f2')) + Number(hasPerk(save.love[id], 'r5')))
}

function servingTerms(save: FarmSave, server: string | null, context: ServingContext) {
  const pack = context.story ?? null
  const talent = server ? (context.talentOf ?? talentsD)(server, 'serving') : 0
  const rank = server ? save.roster[server]!.ranks.serving.rank : 0
  const perk = server ? servingPerk(save, server, pack) : 0
  const graces = pack ? Object.keys(save.roster)
    .filter((id) => perkLineOf(pack, id) === 'serving' && onFarmForPerks(save, pack, id))
    .reduce((n, id) => n + choresOf(save.love[id]), 0) : 0
  return { slack: talent * 350 + rank * 250 + perk * 75, tipRate: Math.min(25, 5 + talent + rank + perk), graces: Math.min(MAX_TRAY, graces) }
}

function ticketsFor(tray: readonly StockPortions[], stage: number, seed: number, slack: number, qualifies: (id: string) => boolean): ServiceTicket[] {
  const rule = restaurantStage(stage)!
  let step = seed
  const random = () => mulberry32(step++)
  const units = tray.flatMap(({ count }, plate) => Array.from({ length: count }, () => plate))
  // Draw without replacement. Include each stocked dish once, then fill the remaining tickets from the tray.
  const take = (index: number) => units.splice(index, 1)[0]!
  const chosen = [...new Set(tray.map((line) => dishAt(line.key)))].map((id) => take(units.findIndex((plate) => dishAt(tray[plate]!.key) === id)))
  while (chosen.length < rule.tickets) chosen.push(take(Math.floor(random() * units.length)))
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[chosen[i], chosen[j]] = [chosen[j]!, chosen[i]!]
  }
  // Keep a qualifying order within reach even if the last wave elapses.
  if (stage >= 3) {
    const i = chosen.findIndex((plate) => qualifies(dishAt(tray[plate]!.key)))
    if (i > 1) [chosen[1], chosen[i]] = [chosen[i]!, chosen[1]!]
  }
  const length = rule.seconds * 1000
  const spacing = Math.floor((length - 9000) / (rule.tickets - 1))
  return chosen.map((plate, i) => {
    const opens = i * spacing
    return { plate, opens, closes: Math.min(length, opens + 9000 + slack) }
  })
}

export function startRestaurantShift<S extends FarmSave>(save: S, stage: number, tray: readonly StockPortions[], server: string | null, now: number, context: ServingContext = {}): S {
  const block = shiftBlock(save, stage, tray, server, context.story ?? null)
  if (block) throw new SaveRuleError('bad-job', block)
  if (!Number.isSafeInteger(now) || now < 0) throw new SaveRuleError('bad-job', 'Invalid shift time.')
  const spent = spend(save, 'restaurant')
  const day = save.calendar.day
  const plays = (save.farm.counts[PLAYS] ?? 0) + 1
  const seed = seedFrom(draw(save.account.uid, day, 'restaurant', plays))
  const { slack, tipRate, graces } = servingTerms(save, server, context)
  let items = spent.items
  for (const line of tray) {
    const at = parseStockKey(line.key)!
    items = takeGoods(items, at.id, at.stars, line.count)
  }
  const shift: RestaurantShift = {
    day, stage, seed, started: now, tray: tray.map((line) => ({ ...line })),
    tickets: ticketsFor(tray, stage, seed, slack, (id) => previouslyLearned(save, id, stage)), served: [], penalty: 0, graces, tipRate,
  }
  const before = save.workshops.restaurant
  const workshops = { ...spent.workshops, played: { ...spent.workshops.played, restaurant: day }, restaurant: { cleared: before?.cleared ?? 0, shift, last: before?.last ?? null } }
  return { ...spent, items, workshops, farm: { ...spent.farm, counts: { ...spent.farm.counts, [PLAYS]: plays } },
    today: server ? { ...spent.today, server } : spent.today }
}

export const shiftTime = (shift: RestaurantShift, now: number): number => Math.max(0, now - shift.started) + shift.penalty
export const shiftLength = (shift: RestaurantShift): number => restaurantStage(shift.stage)!.seconds * 1000

export function ticketOpen(shift: RestaurantShift, index: number, elapsed: number): boolean {
  const ticket = shift.tickets[index]
  return !!ticket && !shift.served.includes(index) && elapsed >= ticket.opens && elapsed < shiftLength(shift)
    && elapsed < ticket.closes + (shift.graces > 0 ? GRACE_MS : 0)
}

export function portionsLeft(shift: RestaurantShift): StockPortions[] {
  const left = shift.tray.map((line) => ({ ...line }))
  for (const index of shift.served) left[shift.tickets[index]!.plate]!.count--
  return left
}

/** A tap uses a particular ticket and dish. Expired or already paid tickets ignore delayed taps. */
export function serveTicket<S extends FarmSave>(save: S, index: number, dish: string, now: number): S {
  const restaurant = save.workshops.restaurant
  const shift = restaurant?.shift
  if (!restaurant || !shift || !Number.isSafeInteger(now)) return save
  const elapsed = shiftTime(shift, now)
  if (!ticketOpen(shift, index, elapsed)) return save
  const ticket = shift.tickets[index]!
  const correct = dishAt(shift.tray[ticket.plate]!.key) === dish
  if (!correct && !portionsLeft(shift).some((line) => line.count > 0 && dishAt(line.key) === dish)) return save
  const next = correct
    ? { ...shift, served: [...shift.served, index], graces: shift.graces - Number(elapsed >= ticket.closes) }
    : { ...shift, penalty: shift.penalty + WRONG_PLATE_MS }
  return { ...save, workshops: { ...save.workshops, restaurant: { ...restaurant, shift: next } } }
}

export function platePrice(id: string, stars: number): number {
  if (isRestaurantDish(id)) return starPrice(id, stars)
  const recipe = recipeOf(id)!
  const side = Math.min(...GOODS.filter((good) => good.family === recipe.side).map((good) => good.price))
  const base = round5((2 * goodOf(recipe.mains[0]!)!.price + side) * 1.15)
  return round5(base * starFactor(stars))
}

/** Return the unused stock and pay the completed tickets, including on a quit or at night. */
export function settleRestaurant<S extends FarmSave>(save: S): S {
  const restaurant = save.workshops.restaurant
  const shift = restaurant?.shift
  if (!restaurant || !shift) return save
  const covers = shift.served.length
  const sold = shift.served.map((index) => parseStockKey(shift.tray[shift.tickets[index]!.plate]!.key)!)
  const sales = sold.reduce((n, plate) => n + platePrice(plate.id, plate.stars), 0)
  const tips = Math.floor(sales * shift.tipRate / 100)
  const grade = tierOf(covers * 100 / shift.tickets.length).grade
  const cleared = covers >= restaurantStage(shift.stage)!.target
    && (shift.stage < 3 || sold.some(({ id }) => previouslyLearned(save, id, shift.stage)))
  const opened = cleared && shift.stage > restaurant.cleared
  const clearedTo = opened ? shift.stage : restaurant.cleared
  const shipped = { ...save.diary.shipped }
  for (const plate of sold) shipped[plate.id] = (shipped[plate.id] ?? 0) + 1
  let items = save.items
  for (const line of portionsLeft(shift)) {
    if (!line.count) continue
    const at = parseStockKey(line.key)!
    items = addGoods(items, at.id, at.stars, line.count)
  }
  const progress = { ...restaurant, cleared: clearedTo }
  const openedSave = { ...save, workshops: { ...save.workshops, restaurant: progress } }
  const learned = opened ? knownRestaurantRecipes(openedSave).filter((recipe) => recipe.grade === shift.stage).length : 0
  const result: RestaurantResult = { day: shift.day, stage: shift.stage, covers, sales, tips, grade, cleared, opened, learned }
  const gross = sales + tips
  const counts = { ...save.farm.counts, [GOLD_SHIPPED]: (save.farm.counts[GOLD_SHIPPED] ?? 0) + gross }
  let next = earnGold({ ...save, items, diary: { ...save.diary, shipped }, farm: { ...save.farm, counts },
    workshops: { ...save.workshops, restaurant: { cleared: clearedTo, shift: null, last: result } } }, gross)
  if (save.today.server && covers > 0) {
    next = countChallenge(next, save.today.server, 'serving', { kind: 'play', grade })
    next = countChallenge(next, save.today.server, 'serving', { kind: 'guests', guests: covers })
  }
  return next
}

/** Convert an available dish into six portions under the normal pantry expiry rules. */
export function saveDishForMeals<S extends FarmSave>(save: S, key: string): S {
  const at = parseStockKey(key)
  if (!at || !isDishId(at.id) || availableDishes(save, key) < 1) throw new SaveRuleError('no-items', 'Choose an available dish.')
  const items = takeGoods(save.items, at.id, at.stars, 1)
  const pantry = addMeals(save.farm.pantry, save.calendar.day, at.stars, BATCH_MEALS)
  return { ...save, items, farm: { ...save.farm, pantry } }
}
