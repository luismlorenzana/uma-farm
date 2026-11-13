// Copied from uma-rpg packages/domain/src/items/stock-id.ts at 30a322a, with its Wilds-only parts cut.
// What the Warehouse may hold: the hundred line items and the made items, which live beside them (R2's build
// decision 5). Ids only, for the save's parse.
import { isLineItemId } from './lines'
import { isMadeId } from './made-id'

export function isStockItemId(id: string): boolean {
  return isLineItemId(id) || isMadeId(id)
}
