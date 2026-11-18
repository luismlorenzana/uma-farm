import { isDishId, type FarmSave } from '../save/v4'
import { parseStockKey } from '../save/warehouse'
import { leavingOn } from './presence'

type DishStock = Pick<FarmSave, 'items'> & Partial<Pick<FarmSave, 'calendar' | 'expeditions'>>

export function supplyOf(key: string) {
  const at = parseStockKey(key)
  return at && isDishId(at.id) ? at : null
}

/** Dishes stay in the Warehouse until departure, but cannot be promised twice. */
export function availableDishes(save: DishStock, key: string): number {
  const at = supplyOf(key)
  if (!at) return 0
  const reserved = save.calendar ? leavingOn(save, save.calendar.day).flatMap((trip) => trip.supplies).filter((s) => s === key).length : 0
  return Math.max(0, (save.items[at.id]?.[at.stars - 1] ?? 0) - reserved)
}
