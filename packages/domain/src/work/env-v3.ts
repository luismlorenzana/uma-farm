// Copied from uma-rpg packages/domain/src/work/env-v3.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// What the work rules take from the caller, and the trade gate's words. uma-rpg's generation switch (`liveWorkEnv`) stays
// behind: the farm has only the Wilds' env (`env-v4.ts`).
import type { TradeOf } from '../economy/professions'

export { openShop, tradeBlock, ANOTHER_TRADE, TRADE_REFUSAL } from './kinds-v3/trade'

export { PLACE_SLOTS_V3, PLACE_SPEED_V3 } from '../economy/professions'

/** What the caller knows beyond the save: each Uma's trade (from her template's calling), for the trade gate. */
export interface WorkContext { tradeOf?: TradeOf }
