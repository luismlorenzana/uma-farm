// The shop, in town: lines of things to buy, each with a price and an optional gate, bought
// with gold into the Warehouse at ★1, free once you've gone into town today. The season's seeds come by tier: the first three from Farm
// Rank 1, the next two from Farm Rank 2, the last from Farm Rank 4. The list changes on a season's first day and never
// runs out; land, beds and stations are bought at their own places. Like `spendGold`, `buy` doesn't stamp `updatedAt`.
import { seedLines } from '../fields/fields'
import { opened, type PlaceOpens } from '../farm/places'
import { spendGold } from './gold'
import { SaveRuleError } from './rules'
import { addGoods } from './warehouse'
import type { FarmSave } from './v4'

/** The most of one line a purchase takes. */
export const MAX_BUY = 99

/** A line in the shop: a Warehouse id it sells at ★1, its price each, and what opens it (a Farm Rank), or
 * day 1. */
export interface ShopLine {
  id: string
  price: number
  opens: PlaceOpens
}

/** What the shop sells on this save, in its order: the season's six seeds, each at its tier's Farm Rank. A line
 * shut by its rank still shows, with its gate. */
export function shopLines(save: Pick<FarmSave, 'calendar' | 'farm'>): ShopLine[] {
  return seedLines(save)
}

/** Whether a line can be bought on this save yet. */
export const lineOpen = (save: Pick<FarmSave, 'farm'>, line: ShopLine): boolean => opened(save, line.opens)

/** Buys `count` of a line: its price × count from gold, the goods into the Warehouse at ★1. Free, once you're in town
 * today. Refused out of town (`locked`), before its gate (`locked`), for a count outside 1–99 (`bad-count`) and when
 * gold is short (`no-gold`). */
export function buy<S extends Pick<FarmSave, 'gold' | 'items' | 'farm' | 'today'>>(save: S, line: ShopLine, count: number): S {
  if (!save.today.town) throw new SaveRuleError('locked', 'The shop is in town.')
  if (!lineOpen(save, line)) throw new SaveRuleError('locked', 'Not in the shop yet')
  if (!Number.isInteger(count) || count < 1 || count > MAX_BUY) throw new SaveRuleError('bad-count', `Buy 1 to ${MAX_BUY}`)
  const paid = spendGold(save, line.price * count)
  return { ...paid, items: addGoods(paid.items, line.id, 1, count) }
}
