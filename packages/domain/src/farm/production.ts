import { goodOf, isGoodId, isRingId, isShippableId } from '../goods/ids'
import { isRestaurantDish } from '../restaurant/rules'
import { restaurantRecipe } from '../restaurant/recipes'
import { HEIRLOOMS, TOOL_RECIPES } from '../forge/catalogue'
import { nextToolTier } from '../forge/state'
import { stationJobUnits } from '../gathering/ids'
import { LOAD_SIZE } from '../gathering/stations'
import { heldFor, pickFor } from './builds'
import { farmPlace, isBuildPlace, placeBuilt, type FarmPlaceId } from './places'
import { MAX_PRODUCTION_TARGET, MAX_SURPLUS } from '../goods/production-catalogue'
import { requestHolds } from '../town/request-stock'
import { ship, shipCrate, type CrateLine } from '../save/bin'
import { mealsNeeded, pantryMeals, plainBatch } from './food'
import { SaveRuleError } from '../save/rules'
import type { FarmSave, SurplusPlan, ToolId } from '../save/v4'
import { goodCount, parseStockKey } from '../save/warehouse'

const SHIP_DAY = 'surplus-crate-day'
export const KEEP_ALL = 100
export const SURPLUS_LIMIT_MAX = 250

export const availableStock = (save: Pick<FarmSave, 'items'> & Partial<Pick<FarmSave, 'farm'>>, id: string): number =>
  Math.max(0, goodCount(save.items, id) - (save.farm?.reserves?.[id] ?? 0))

/** Routine meals and sales leave the planned stock and inputs for its next load on hand. */
export function routineStockFloors(farm: Pick<FarmSave['farm'], 'reserves' | 'stationPlans'> | undefined): Record<string, number> {
  const floors = { ...farm?.reserves }
  for (const plan of Object.values(farm?.stationPlans ?? {})) for (const { output, target } of plan) {
    floors[output] = Math.max(floors[output] ?? 0, target)
  }
  for (const plan of Object.values(farm?.stationPlans ?? {})) for (const { output, target } of plan) {
    const input = goodOf(output)?.input
    if (input) floors[input] = (floors[input] ?? 0) + Math.min(LOAD_SIZE, target) * stationJobUnits(output)
  }
  return floors
}

export function usesReserve(save: Pick<FarmSave, 'items' | 'farm'>, picks: readonly string[]): boolean {
  const totals = new Map<string, number>()
  for (const key of picks) {
    const stock = parseStockKey(key)
    if (stock) totals.set(stock.id, (totals.get(stock.id) ?? 0) + 1)
  }
  return [...totals].some(([id, units]) => (save.farm.reserves?.[id] ?? 0) > 0 && units > availableStock(save, id))
}

export function setStockReserve<S extends FarmSave>(save: S, id: string, count: number): S {
  if (!isGoodId(id) || !Number.isInteger(count) || count < 0 || count > MAX_PRODUCTION_TARGET) {
    throw new SaveRuleError('bad-count', 'Keep 0 to 99 of an exact grade.')
  }
  const reserves = { ...save.farm.reserves }
  if (count > 0) reserves[id] = count
  else delete reserves[id]
  return { ...save, farm: { ...save.farm, reserves } }
}

export function setSurplusPlan<S extends FarmSave>(save: S, plan: SurplusPlan | null): S {
  const farm = { ...save.farm }
  if (plan === null) {
    delete farm.surplus
    return { ...save, farm }
  }
  const { goods, limit } = plan
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SURPLUS || goods.length < 1 || goods.length > MAX_SURPLUS
    || new Set(goods).size !== goods.length || goods.some((id) => !isGoodId(id))) {
    throw new SaveRuleError('bad-count', 'Choose the goods and a crate size from 1 to 50.')
  }
  return { ...save, farm: { ...farm, surplus: { goods: [...goods], limit } } }
}

export function defaultSurplusFloor(id: string): number {
  if (isRingId(id) || !isShippableId(id)) return KEEP_ALL
  if (isRestaurantDish(id)) return 4
  const good = goodOf(id)!
  if (id === 'pine-log') return 20
  if (good.refined) return 6
  if (good.crop && good.grade <= 3) return 12
  if (good.grade <= 3 && ['vegetables', 'grains', 'fruits', 'fish', 'mushrooms', 'eggs-milk', 'herbs-spices'].includes(good.family)) return 8
  return 6
}

function hardSurplusFloors(save: FarmSave): Record<string, number> {
  const floors = routineStockFloors(save.farm)
  const protect = (id: string, count: number) => { floors[id] = (floors[id] ?? 0) + count }
  for (const plan of Object.values(save.farm.stationPlans ?? {})) for (const target of plan) {
    const source = goodOf(target.output)?.input
    if (!source) continue
    const inProcess = Object.values(save.loads).flat().reduce((sum, load) =>
      parseStockKey(load.item)?.id === target.output ? sum + load.count : sum, 0)
    const missing = Math.max(0, target.target - goodCount(save.items, target.output) - inProcess)
    // The routine floor already covers one load. Protect the rest of a larger order when it is short.
    const extra = Math.max(0, missing - Math.min(LOAD_SIZE, target.target))
    protect(source, extra * stationJobUnits(target.output))
  }
  const recipe = restaurantRecipe(save.farm.recipePin ?? '')
  for (const line of recipe?.ingredients ?? []) protect(line.id, line.count)
  const tool = save.farm.toolPin
  const tier = tool ? nextToolTier(save.tools[tool]) : null
  if (tier && save.forge?.tool?.tool !== tool) for (const line of TOOL_RECIPES[tier].materials) protect(line.id, line.count)
  const pin = farmPlace(save.farm.projectPin ?? '')
  if (isBuildPlace(pin) && !placeBuilt(save, pin.id) && !save.farm.builds.includes(pin.id)) {
    for (const line of pin.opens.cost.goods) {
      for (const row of pickFor(save.items, { ...line, count: Math.min(line.count, heldFor(save.items, line)) }) ?? []) {
        protect(row.id, row.count)
      }
    }
  }
  const track = save.forge?.tracked
  if (track && !save.forge?.heirlooms.some(order => order.piece === track.piece && order.recipient === track.recipient)) {
    for (const { id, count } of HEIRLOOMS[track.piece].materials) protect(id, count)
  }
  if (!save.farm.surplus && pantryMeals(save) < mealsNeeded(save, null)) {
    const ingredients = plainBatch(save) ?? []
    for (const key of ingredients) {
      const stock = parseStockKey(key)
      if (stock) floors[stock.id] = (floors[stock.id] ?? 0) + 1
    }
  }
  return floors
}

export function surplusStock(save: FarmSave, id: string, floors = hardSurplusFloors(save)) {
  const standard = defaultSurplusFloor(id)
  const settings = save.farm.surplusSettings
  const override = settings?.floors?.[id]
  const protectedStock = floors[id] ?? 0
  const holds = requestHolds(save, id)
  const reserved = [...holds.values()].reduce((sum, count) => sum + count, 0)
  const count = goodCount(save.items, id) - reserved
  const keepAll = standard === KEEP_ALL || override === KEEP_ALL
  const base = override ?? (save.farm.surplus ? 0 : standard)
  const heldStars = settings?.minStars?.[id] ?? 6
  const low = (save.items[id] ?? []).slice(0, heldStars - 1).reduce((sum, n, index) => sum + n - (holds.get(index + 1) ?? 0), 0)
  return { standard, override, protectedStock: protectedStock + reserved, heldStars, available: keepAll ? 0 : Math.min(low, Math.max(0, count - Math.max(base, protectedStock))) }
}

export function configureSurplus<S extends FarmSave>(save: S, settings: { paused?: boolean; limit?: number; reset?: boolean }): S {
  if (settings.limit !== undefined && (!Number.isSafeInteger(settings.limit) || settings.limit < 1 || settings.limit > SURPLUS_LIMIT_MAX)) {
    throw new SaveRuleError('bad-count', 'Choose a crate limit from 1 to 250.')
  }
  const farm = { ...save.farm }
  if (settings.reset) {
    delete farm.surplus
    delete farm.surplusSettings
  } else {
    const next = { ...farm.surplusSettings }
    if (settings.limit !== undefined) next.limit = settings.limit
    if (settings.paused === true) next.paused = true
    if (settings.paused === false) delete next.paused
    farm.surplusSettings = next
  }
  return { ...save, farm }
}

export function setSurplusReserve<S extends FarmSave>(save: S, id: string, floor: number | null, stars?: number): S {
  if (!isShippableId(id) || floor !== null && (!Number.isSafeInteger(floor) || floor < 0 || floor > KEEP_ALL)
    || stars !== undefined && (!Number.isSafeInteger(stars) || stars < 2 || stars > 6)) {
    throw new SaveRuleError('bad-count', 'Choose a reserve from 0 to 99, or Keep all.')
  }
  const settings = save.farm.surplusSettings ?? {}
  const floors = { ...settings.floors }
  const minStars = { ...settings.minStars }
  if (floor === null) delete floors[id]
  else floors[id] = floor
  if (stars === 6) delete minStars[id]
  else if (stars !== undefined) minStars[id] = stars
  return { ...save, farm: { ...save.farm, surplusSettings: { ...settings, floors, minStars } } }
}

export function pinSupplyProject<S extends FarmSave>(save: S, id: FarmPlaceId): S {
  if (!isBuildPlace(farmPlace(id))) throw new SaveRuleError('locked', 'This project cannot be pinned.')
  const farm = { ...save.farm }
  if (farm.projectPin === id) delete farm.projectPin
  else farm.projectPin = id
  return { ...save, farm }
}

export function pinRecipeStock<S extends FarmSave>(save: S, id: string): S {
  if (!restaurantRecipe(id)) throw new SaveRuleError('bad-job', 'Choose a Restaurant recipe.')
  const farm = { ...save.farm }
  if (farm.recipePin === id) delete farm.recipePin
  else farm.recipePin = id
  return { ...save, farm }
}

export function pinToolStock<S extends FarmSave>(save: S, tool: ToolId): S {
  const farm = { ...save.farm }
  if (farm.toolPin === tool) delete farm.toolPin
  else if (nextToolTier(save.tools[tool])) farm.toolPin = tool
  return { ...save, farm }
}

export function defaultCrateLimit(save: FarmSave): number {
  const crew = Object.values(save.roster).filter(uma => (uma.farmhand ?? 0) > 0).length
  return crew >= 35 ? 200 : crew >= 15 ? 100 : MAX_SURPLUS
}

/** One farm-wide crate, with a rotating first good under the standard plan. */
export function surplusCrate(save: FarmSave, manual = false): CrateLine[] {
  const plan = save.farm.surplus
  if (!manual && save.farm.surplusSettings?.paused || save.farm.counts[SHIP_DAY] === save.calendar.day) return []
  let room = save.farm.surplusSettings?.limit ?? plan?.limit ?? defaultCrateLimit(save)
  const lines: CrateLine[] = []
  const floors = hardSurplusFloors(save)
  const candidates = Object.keys(save.items).filter(isShippableId).sort()
  const start = candidates.length ? save.calendar.day % candidates.length : 0
  const goods = plan?.goods ?? [...candidates.slice(start), ...candidates.slice(0, start)]
  for (const id of goods) {
    if (room === 0) break
    const stock = surplusStock(save, id, floors)
    const holds = requestHolds(save, id)
    let left = Math.min(room, stock.available)
    for (const [i, held] of (save.items[id] ?? []).entries()) {
      if (left === 0 || i + 1 >= stock.heldStars) break
      const count = Math.min(held - (holds.get(i + 1) ?? 0), left)
      if (count > 0) lines.push({ id, stars: i + 1, count })
      left -= count
      room -= count
    }
  }
  return lines
}

export function shipSuggestedSurplus<S extends FarmSave>(save: S): S {
  const shipped = shipCrate(save, surplusCrate(save, true))
  return { ...shipped, farm: { ...shipped.farm, counts: { ...shipped.farm.counts, [SHIP_DAY]: save.calendar.day } } }
}

export function shipSurplus<S extends FarmSave>(save: S): { save: S; count: number } | null {
  const crate = surplusCrate(save)
  if (crate.length === 0) return null
  const shipped = crate.reduce((next, { id, stars, count }) => ship(next, id, stars, count), save)
  return {
    save: { ...shipped, farm: { ...shipped.farm, counts: { ...shipped.farm.counts, [SHIP_DAY]: save.calendar.day } } },
    count: crate.reduce((total, line) => total + line.count, 0),
  }
}
