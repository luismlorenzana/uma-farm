// The shop (F19 decision 7; core spec CS3, CS4): lines of things to buy, each with a price and an optional gate, bought
// with gold into the Warehouse at ★1. F19 made the frame and F20 the season's seeds by tier: the first three from Farm
// Rank 1, the next two from FR2, the last from FR4. The list changes on a season's first day and never runs out (F20
// decision 8); land, beds and stations are bought at their own places. Like `spendGold`, `buy` doesn't stamp `updatedAt`.
import { seedLines } from '../fields/fields'
import { opened, type PlaceOpens } from '../farm/places'
import { spendGold } from './gold'
import { SaveRuleError } from './rules'
import type { SaveV3 } from './v3'
import { addGoods } from './warehouse'

/** The most of one line a purchase takes. */
export const MAX_BUY = 99

/** A line in the shop: a Warehouse id it sells at ★1, its price each, and what opens it (a Farm Rank, a chapter), or
 * day 1. */
export interface ShopLine {
  id: string
  price: number
  opens: PlaceOpens
}

/** What the shop sells on this save, in its order: the season's six seeds (F20), each at its tier's Farm Rank. A line
 * shut by its rank still shows, with its gate. */
export function shopLines(save: Pick<SaveV3, 'calendar' | 'farm'>): ShopLine[] {
  return seedLines(save)
}

/** Whether a line can be bought on this save yet. */
export const lineOpen = (save: Pick<SaveV3, 'farm'>, line: ShopLine): boolean => opened(save, line.opens)

/** Buys `count` of a line: its price × count from gold, the goods into the Warehouse at ★1. Refused before its gate
 * (`locked`), for a count outside 1–99 (`bad-count`) and when gold is short (`no-gold`). */
export function buy<S extends Pick<SaveV3, 'gold' | 'items' | 'farm'>>(save: S, line: ShopLine, count: number): S {
  if (!lineOpen(save, line)) throw new SaveRuleError('locked', 'Not in the shop yet')
  if (!Number.isInteger(count) || count < 1 || count > MAX_BUY) throw new SaveRuleError('bad-count', `Buy 1 to ${MAX_BUY}`)
  const paid = spendGold(save, line.price * count)
  return { ...paid, items: addGoods(paid.items, line.id, 1, count) }
}
