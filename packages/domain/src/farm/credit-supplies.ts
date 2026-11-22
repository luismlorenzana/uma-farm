import { GOODS, goodOf } from '../goods/ids'
import { goodName } from '../goods/names'
import { discovered } from '../goods/discovery'
import { basePrice } from '../goods/prices'
import { recordPurchase } from './purchases'
import { issueCredit } from './credit'
import { SaveRuleError } from '../save/rules'
import type { FarmSave } from '../save/v4'
import { addGoods } from '../save/warehouse'

export interface MaterialQuote { id: string; count: number; unit: number }

export const materialAvailable = (save: FarmSave, id: string): boolean =>
  id === 'pine-log' || id === 'limestone' || discovered(save, id)

export function materialQuote(save: FarmSave, id: string, count: number): MaterialQuote | null {
  if (!goodOf(id) || !materialAvailable(save, id) || !Number.isSafeInteger(count) || count < 1 || count > 999) return null
  return { id, count, unit: basePrice(id) * 2 }
}

export function materialOptions(save: FarmSave): MaterialQuote[] {
  return GOODS.flatMap(good => {
    const quote = materialQuote(save, good.id, 1)
    return quote ? [quote] : []
  })
}

export function borrowMaterials<S extends FarmSave>(save: S, id: string, count: number): S {
  if (!save.today.town) throw new SaveRuleError('locked', 'Loans are at the mayor’s office.')
  const quote = materialQuote(save, id, count)
  if (!quote) throw new SaveRuleError('locked', 'This exact material is not available from a supplier yet.')
  const title = `${count} × ${goodName(id)}`
  const principal = quote.count * quote.unit
  const issued = issueCredit(save, title, 'goods', principal, 0)
  const stocked = { ...issued, items: addGoods(issued.items, id, 1, quote.count) }
  return recordPurchase(stocked, title, principal)
}
