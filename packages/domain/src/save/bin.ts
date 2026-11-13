// The shipping bin (CS7 step 1): anything with a price goes in at any time in the
// day, comes back out until the night if the player changes their mind, and pays at night at price × stars × demand.
// There's no selling cap and nothing is ever bought back. The bin is `save.bin`, star counts like the Warehouse's.
// None of these stamp `updatedAt`: shipping and taking back are the player's operations, which stamp around them, and
// the night stamps once after its nine steps.
import { GOOD_IDS } from '../goods/ids'
import { hasPrice, inDemand, priceOf } from '../goods/prices'
import type { BinSale } from '../night/summary'
import { earnGold } from './gold'
import { SaveRuleError } from './rules'
import type { SaveV3, Warehouse } from './v3'
import { addGoods, takeGoods } from './warehouse'
import type { FarmSave } from './v4'

/** The counter the bin's gold adds to, for the Farm Rank and its milestones. */
export const GOLD_SHIPPED = 'gold-shipped'

type BinSave = Pick<FarmSave, 'items' | 'bin'>

function priced(id: string): void {
  if (!hasPrice(id)) throw new SaveRuleError('no-price', 'That doesn’t sell')
}

/** `count` of a good at `stars` from the Warehouse into today's bin. Refused for anything without a price (`no-price`:
 * seeds) and when the Warehouse is short (`no-items`). */
export function ship<S extends BinSave>(save: S, id: string, stars: number, count: number): S {
  priced(id)
  if (!Number.isInteger(count) || count < 1) throw new SaveRuleError('bad-count', 'Ship at least one')
  return { ...save, items: takeGoods(save.items, id, stars, count), bin: addGoods(save.bin, id, stars, count) }
}

/** Every star of a good from the Warehouse into the bin ("Ship all"). Refused when there's none (`no-items`). */
export function shipAll<S extends BinSave>(save: S, id: string): S {
  priced(id)
  const row = save.items[id]
  if (!row || row.every((n) => n === 0)) throw new SaveRuleError('no-items', 'Not enough in the Warehouse')
  return row.reduce((next, n, i) => (n > 0 ? ship(next, id, i + 1, n) : next), save)
}

/** `count` of a good at `stars` from today's bin back to the Warehouse. Refused when the bin holds fewer
 * (`no-items`). Once the night pays, it's final. */
export function takeBack<S extends BinSave>(save: S, id: string, stars: number, count: number): S {
  if (!Number.isInteger(count) || count < 1) throw new SaveRuleError('bad-count', 'Take back at least one')
  if ((save.bin[id]?.[stars - 1] ?? 0) < count) throw new SaveRuleError('no-items', 'Not that many in the bin')
  return { ...save, bin: takeGoods(save.bin, id, stars, count), items: addGoods(save.items, id, stars, count) }
}

const ORDER = new Map(GOOD_IDS.map((id, i) => [id, i]))

/** The bin's lines on `day`: each good at each star, its count, its gold and whether it's in demand, in the catalogue's
 * order, ★1 first. */
export function binSales(bin: Warehouse, day: number): BinSale[] {
  return Object.entries(bin)
    .sort(([a], [b]) => (ORDER.get(a) ?? Infinity) - (ORDER.get(b) ?? Infinity))
    .flatMap(([id, row]) => row.flatMap((count, i): BinSale[] => (count > 0
      ? [{ kind: 'sold', id, stars: i + 1, count, gold: priceOf(id, i + 1, day) * count, demand: inDemand(id, day) }]
      : [])))
}

/** What the bin pays tonight if nothing changes: the bin sheet's "About 1,240g tonight". */
export const binTotal = (bin: Warehouse, day: number): number => binSales(bin, day).reduce((sum, sale) => sum + sale.gold, 0)

/** What one night's bin paid. */
export interface BinPayout<S> {
  save: S
  sales: BinSale[]
  gold: number
}

/**
 * Night step 1: everything in the bin pays at price × stars × demand on `day`, the day it was shipped.
 * The gold goes to `gold` and to `farm.counts['gold-shipped']` (F24's Farm Rank and milestones), each good's count to
 * `diary.shipped` (the Diary's collections), and the bin empties. An empty bin pays nothing and changes nothing.
 */
export function payBin<S extends Pick<FarmSave, 'bin' | 'gold' | 'farm' | 'diary'>>(save: S, day: number): BinPayout<S> {
  const sales = binSales(save.bin, day)
  if (sales.length === 0) return { save, sales, gold: 0 }
  const gold = sales.reduce((sum, sale) => sum + sale.gold, 0)
  const shipped = { ...save.diary.shipped }
  for (const sale of sales) shipped[sale.id] = (shipped[sale.id] ?? 0) + sale.count
  const counts = { ...save.farm.counts, [GOLD_SHIPPED]: (save.farm.counts[GOLD_SHIPPED] ?? 0) + gold }
  const paid = earnGold({ ...save, bin: {}, diary: { ...save.diary, shipped }, farm: { ...save.farm, counts } }, gold)
  return { save: paid, sales, gold }
}
