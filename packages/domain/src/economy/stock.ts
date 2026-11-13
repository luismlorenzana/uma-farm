// Copied from uma-rpg packages/domain/src/economy/stock.ts at 30a322a, with its Wilds-only parts cut.
// A display name for anything a v28+ Warehouse holds: the farm by line's hundred line items and the made items
//. A v28+ world holds no v1 id (the parse refuses one, `isStockItemId`), so the v1 items', Star Gems' and gear's
// names load on demand: `stockNameV1` (items/names-v1.ts) is this chain with them, for the v1 screens and tests.
import { lineItem } from '../items/lines'
import { madeName } from '../items/made'

export const stockName = (id: string): string => lineItem(id)?.name ?? madeName(id) ?? id
