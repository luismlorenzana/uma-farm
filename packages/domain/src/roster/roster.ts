// The farm's roster (R3): every outfit on master data's release can work, from day one, with no tickets. Each
// has her trade, from her calling (her best running styles, `template.ts`), and so her line's three places. The farm reads
// master data by stable ids only (P8): names and art stay in the app, from the release.
import type { Outfit } from '@luismlorenzana/uma-data'
import { placeSpecV4 } from '../economy/places-v4'
import { tradePlaces, umaTrade, type TradeId, type TradeOf } from '../economy/professions'
import type { MaterialLine } from '../items/lines'
import type { WorkContext } from '../work/env-v3'

/** A master outfit id, as master data's stable key for an Uma (P8). */
export const OUTFIT_ID = /^[1-9]\d{0,11}$/
export const isOutfitId = (id: string): boolean => OUTFIT_ID.test(id)

/** One outfit as the farm sees her: her id, her trade and its line. */
export interface FarmOutfit {
  outfitId: string
  trade: TradeId
  /** Her trade's line: the Mine's metal, the Fields' vegetables, the Forest's wood, the Fishery's fish, the Den's stone. */
  line: MaterialLine
}

/** A trade's line: its gathering place's. */
export const tradeLine = (trade: TradeId): MaterialLine => placeSpecV4(tradePlaces(trade)[0])!.line

/** Every outfit on the release, in its order, each with her trade. An id that isn't a stable outfit id is skipped. */
export function farmRoster(data: { outfits: readonly Pick<Outfit, 'id' | 'aptitudes'>[] }): FarmOutfit[] {
  return data.outfits.flatMap((o) => {
    const outfitId = String(o.id)
    if (!isOutfitId(outfitId)) return []
    const trade = umaTrade(o)
    return [{ outfitId, trade, line: tradeLine(trade) }]
  })
}

/** What the work rules take from a roster: each outfit's trade, for the trade gate, and who may work at all. Settles and
 * the API's parse pass none: then every well-formed outfit may work and the gate is open. */
export function rosterContext(roster: readonly FarmOutfit[]): WorkContext & { tradeOf: TradeOf; roster: ReadonlySet<string> } {
  const trades = new Map(roster.map((o) => [o.outfitId, o.trade]))
  return { tradeOf: (outfitId) => trades.get(outfitId) ?? null, roster: new Set(trades.keys()) }
}
