// Her trade on the web (from uma-rpg apps/web/src/save/trade.ts at 30a322a, F5): every outfit's trade comes from master
// data's roster (`farmRoster`, her best running styles, FM7), so the facet, the picker's order and the open shop read the
// same roster the rules gate by. uma-rpg's world-scoped resolver stays behind: every outfit is the farm's (FM6).
import { openShop, PLACES_V4, placeSpecV4, tradeLine, TRADE_IDS, type FarmOutfit, type TradeId } from '@farm/domain'
import { LINE_WORD } from '../items/words'

/** A trade by its line: "Metal". */
export const tradeLabel = (trade: TradeId): string => LINE_WORD[tradeLine(trade)]

/** The trades in the map's row order (Metal, Vegetables, Wood, Fish, Stone). */
export const TRADES_BY_ROW: readonly TradeId[] = [...TRADE_IDS].sort((a, b) =>
  PLACES_V4.findIndex((p) => p.line === tradeLine(a)) - PLACES_V4.findIndex((p) => p.line === tradeLine(b)))

/** Whether a place is an open shop: no outfit on the roster has its trade, so everyone works it. */
export function isOpenShop(placeId: string, roster: readonly FarmOutfit[]): boolean {
  if (!placeSpecV4(placeId)) return false
  const trades = new Map(roster.map((o) => [o.outfitId, o.trade]))
  return openShop({ umas: {} }, placeId, (id) => trades.get(id) ?? null, new Set(trades.keys()))
}

/** Who may take a slot here (uma-rpg's `whoAt`, PP16): her trade's Umas first; anyone else is greyed "Another trade",
 * unless the place is an open shop. An outfit the roster doesn't hold is never greyed. */
export function whoAt(placeId: string, roster: readonly FarmOutfit[]): { first: (outfitId: string) => boolean; reason: (outfitId: string) => string | null } {
  const line = placeSpecV4(placeId)?.line
  const trades = new Map(roster.map((o) => [o.outfitId, o]))
  const open = isOpenShop(placeId, roster)
  const first = (outfitId: string) => open || trades.get(outfitId)?.line === line
  return { first, reason: (outfitId) => (first(outfitId) || !trades.has(outfitId) ? null : 'Another trade') }
}
