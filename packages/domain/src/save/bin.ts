// The shipping bin (night step 1): you pick what to ship and one action ships it all (`shipCrate`); it comes back out
// for free until the night if you change your mind, and pays at night at price × stars × demand. There's no selling cap
// and nothing is ever bought back. The bin is `save.bin`, star counts like the Warehouse's. None of these stamp
// `updatedAt`: shipping and taking back are the player's operations, which stamp around them, and the night stamps once
// after its nine steps.
import { spend } from '../farm/actions'
import { baseGoodId, GOOD_IDS } from '../goods/ids'
import { easedGroup, easedPercent, easeOf, type Market } from '../goods/market'
import { hasPrice, inDemand } from '../goods/prices'
import type { BinSale } from '../night/summary'
import { earnGold } from './gold'
import { SaveRuleError } from './rules'
import type { StarCounts, Warehouse } from './v4'
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

/** One line of a crate for the bin: a good at its stars, and how many. */
export interface CrateLine {
  id: string
  stars: number
  count: number
}

/** Ships a crate: one of the day's actions for everything you picked, each line from the Warehouse into today's bin, paid
 * tonight. Refused with nothing picked (`bad-count`), for anything without a price (`no-price`), when the Warehouse is
 * short (`no-items`), and with no action left (`no-actions`). */
export function shipCrate<S extends BinSave & Pick<FarmSave, 'calendar' | 'today'>>(save: S, lines: readonly CrateLine[]): S {
  const picked = lines.filter((line) => line.count > 0)
  if (picked.length === 0) throw new SaveRuleError('bad-count', 'Pick something to ship.')
  const shipped = picked.reduce((next, line) => ship(next, line.id, line.stars, line.count), save)
  return spend(shipped, 'ship')
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
 * order, ★1 first. With the farm's market, a good eased by a flood sells at its ease, and past a crate of it each crate
 * more a step lower (`goods/market.ts`): its lines say how far (`eased`, in percent). */
export function binSales(bin: Warehouse, day: number, market: Market = {}): BinSale[] {
  const groups = new Map<string, [string, StarCounts][]>()
  for (const [id, row] of Object.entries(bin)) {
    const key = baseGoodId(id)
    const group = groups.get(key)
    if (group) group.push([id, row])
    else groups.set(key, [[id, row]])
  }
  return [...groups].flatMap(([key, rows]) => easedGroup(rows, day, easeOf(market, key)))
    .sort((a, b) => (ORDER.get(a.id) ?? Infinity) - (ORDER.get(b.id) ?? Infinity) || a.stars - b.stars)
    .map((line) => ({
      kind: 'sold', id: line.id, stars: line.stars, count: line.count, gold: line.gold, demand: inDemand(line.id, day),
      ...(line.steps > 0 ? { eased: easedPercent(line.steps) } : {}),
    }))
}

/** What the bin pays tonight if nothing changes: the bin sheet's "About 1,240g tonight". */
export const binTotal = (bin: Warehouse, day: number, market: Market = {}): number => binSales(bin, day, market).reduce((sum, sale) => sum + sale.gold, 0)

/** What a crate adds to tonight's bin, at the market as it stands: the Warehouse's pick bar's "about 425g". */
export function crateWorth(save: Pick<FarmSave, 'bin' | 'calendar' | 'farm'>, lines: readonly CrateLine[]): number {
  let bin = save.bin
  for (const line of lines) if (line.count > 0 && hasPrice(line.id)) bin = addGoods(bin, line.id, line.stars, line.count)
  return binTotal(bin, save.calendar.day, save.farm.market) - binTotal(save.bin, save.calendar.day, save.farm.market)
}

/** What one night's bin paid. */
export interface BinPayout<S> {
  save: S
  sales: BinSale[]
  gold: number
}

/**
 * Night step 1: everything in the bin pays at price × stars × demand on `day`, the day it was shipped, at the market's
 * ease (`goods/market.ts`). The gold goes to `gold` and to `farm.counts['gold-shipped']` (the Farm Rank and milestones),
 * each good's count to `diary.shipped` (the Diary's collections), and the bin empties. An empty bin pays nothing and
 * changes nothing. The market moves after it (`easeTheMarket`).
 */
export function payBin<S extends Pick<FarmSave, 'bin' | 'gold' | 'farm' | 'diary'>>(save: S, day: number): BinPayout<S> {
  const sales = binSales(save.bin, day, save.farm.market)
  if (sales.length === 0) return { save, sales, gold: 0 }
  const gold = sales.reduce((sum, sale) => sum + sale.gold, 0)
  const shipped = { ...save.diary.shipped }
  for (const sale of sales) shipped[sale.id] = (shipped[sale.id] ?? 0) + sale.count
  const counts = { ...save.farm.counts, [GOLD_SHIPPED]: (save.farm.counts[GOLD_SHIPPED] ?? 0) + gold }
  const paid = earnGold({ ...save, bin: {}, diary: { ...save.diary, shipped }, farm: { ...save.farm, counts } }, gold)
  return { save: paid, sales, gold }
}
