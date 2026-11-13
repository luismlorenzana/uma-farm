// The Warehouse by stars meets uma-work's flat stock through one bridge. The save stores `items[id]` as
// counts by ★1 … ★5; uma-work reads a `Record<string, number>`. The engine sees a view keyed `<id>@<stars>` (`carp@2`),
// built by `workStock` and folded back by `fromWorkStock`; work rows store those keys in their inputs and outputs.
// Nothing else reads the view. Seeds are held at ★1 only.
//
// The bridge and the operations take anything the Warehouse may hold (`isStockId`): the goods and seeds, the rings (the
// ring bench's) and dishes (the wedding's reception reads them; the Kitchen makes them).
import type { ItemStock } from '@luismlorenzana/uma-work'
import { isRingId, isSeedId, isWarehouseId } from '../goods/ids'
import { SaveRuleError } from './rules'
import { isDishId, type StarCounts, type Warehouse } from './v4'

export const MAX_STARS = 5

/** Anything the Warehouse may hold: the goods and seeds, the rings and dishes. What the engine's bridge and the
 * Warehouse's operations take. */
export const isStockId = (id: string): boolean => isWarehouseId(id) || isRingId(id) || isDishId(id)

/** The engine's key for a good at its stars. */
export const stockKey = (id: string, stars: number): string => `${id}@${stars}`

/** A stock key's good and stars, or null when it isn't one the Warehouse can hold. */
export function parseStockKey(key: string): { id: string; stars: number } | null {
  const at = key.lastIndexOf('@')
  if (at <= 0) return null
  const id = key.slice(0, at)
  const stars = Number(key.slice(at + 1))
  if (!/^[1-5]$/.test(key.slice(at + 1)) || !isStockId(id) || (isSeedId(id) && stars !== 1)) return null
  return { id, stars }
}

function check(id: string, stars: number, count: number): void {
  if (!isStockId(id)) throw new RangeError(`${id} isn't a Warehouse item`)
  if (!Number.isInteger(stars) || stars < 1 || stars > MAX_STARS || (isSeedId(id) && stars !== 1)) throw new RangeError(`${id} can't be ★${stars}`)
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError(`Bad count ${count}`)
}

/** The engine's view of a Warehouse: `<id>@<stars>` → count, with no zero entries. */
export function workStock(items: Warehouse): Record<string, number> {
  const view: Record<string, number> = {}
  for (const [id, row] of Object.entries(items)) {
    row.forEach((n, i) => {
      if (n > 0) view[stockKey(id, i + 1)] = n
    })
  }
  return view
}

/** A Warehouse from the engine's view: every key a good at its stars, every count whole. Rows of all zeros are dropped. */
export function fromWorkStock(view: ItemStock): Warehouse {
  const items: Warehouse = {}
  for (const [key, n] of Object.entries(view)) {
    const at = parseStockKey(key)
    if (!at) throw new RangeError(`${key} isn't a stock key`)
    if (!Number.isSafeInteger(n) || n < 0) throw new RangeError(`Bad count ${n} for ${key}`)
    if (n === 0) continue
    const row: StarCounts = items[at.id] ?? [0, 0, 0, 0, 0]
    row[at.stars - 1] = row[at.stars - 1]! + n
    items[at.id] = row
  }
  return items
}

/** A good's count across its stars. */
export const goodCount = (items: Warehouse, id: string): number => (items[id] ?? [0, 0, 0, 0, 0]).reduce((a, b) => a + b, 0)
/** Everything in a Warehouse (or the bin), every star. */
export const stockTotal = (items: Warehouse): number => Object.values(items).reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0)

/** `count` more of a good at its stars. Works on `items` or `bin`, and gives a new record. */
export function addGoods(items: Warehouse, id: string, stars: number, count: number): Warehouse {
  check(id, stars, count)
  if (count === 0) return items
  const row: StarCounts = [...(items[id] ?? [0, 0, 0, 0, 0])]
  row[stars - 1] = row[stars - 1]! + count
  return { ...items, [id]: row }
}

/** `count` fewer of a good at its stars; refused (`no-items`) when there aren't that many. A row that empties leaves. */
export function takeGoods(items: Warehouse, id: string, stars: number, count: number): Warehouse {
  check(id, stars, count)
  if (count === 0) return items
  const row: StarCounts = [...(items[id] ?? [0, 0, 0, 0, 0])]
  if (row[stars - 1]! < count) throw new SaveRuleError('no-items', 'Not enough in the Warehouse')
  row[stars - 1] = row[stars - 1]! - count
  const rest = { ...items }
  if (row.every((n) => n === 0)) delete rest[id]
  else rest[id] = row
  return rest
}
