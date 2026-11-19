import { isGoodId } from '../goods/ids'
import { MAX_PRODUCTION_TARGET, MAX_SURPLUS } from '../goods/production-catalogue'
import { ship, type CrateLine } from '../save/bin'
import { SaveRuleError } from '../save/rules'
import type { FarmSave, SurplusPlan } from '../save/v4'
import { goodCount, parseStockKey } from '../save/warehouse'

const SHIP_DAY = 'surplus-crate-day'

export const availableStock = (save: Pick<FarmSave, 'items'> & Partial<Pick<FarmSave, 'farm'>>, id: string): number =>
  Math.max(0, goodCount(save.items, id) - (save.farm?.reserves?.[id] ?? 0))

/** A finished station order is stock the player asked to keep on hand. Routine meals and sales use its excess. */
export function routineStockFloors(farm: Pick<FarmSave['farm'], 'reserves' | 'stationPlans'> | undefined): Record<string, number> {
  const floors = { ...farm?.reserves }
  for (const plan of Object.values(farm?.stationPlans ?? {})) for (const { output, target } of plan) {
    floors[output] = Math.max(floors[output] ?? 0, target)
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

/** One shared crate each night, from the configured exact IDs in order, lowest stars first. */
export function surplusCrate(save: FarmSave): CrateLine[] {
  const plan = save.farm.surplus
  if (!plan || save.farm.counts[SHIP_DAY] === save.calendar.day) return []
  let room = plan.limit
  const lines: CrateLine[] = []
  const floors = routineStockFloors(save.farm)
  for (const id of plan.goods) {
    if (room === 0) break
    let left = Math.min(room, Math.max(0, goodCount(save.items, id) - (floors[id] ?? 0)))
    for (const [i, held] of (save.items[id] ?? []).entries()) {
      if (left === 0) break
      const count = Math.min(held, left)
      if (count > 0) lines.push({ id, stars: i + 1, count })
      left -= count
      room -= count
    }
  }
  return lines
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
