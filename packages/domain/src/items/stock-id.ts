// Copied from uma-rpg packages/domain/src/items/stock-id.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// What the Warehouse may hold (D208; H77): the hundred line items and the made items, which live beside them (R2's build
// decision 5). Ids only, for the save's parse.
import { isLineItemId } from './lines'
import { isMadeId } from './made-id'

export function isStockItemId(id: string): boolean {
  return isLineItemId(id) || isMadeId(id)
}
