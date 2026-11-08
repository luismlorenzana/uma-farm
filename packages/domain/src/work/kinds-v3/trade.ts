// Copied from uma-rpg packages/domain/src/work/kinds-v3/trade.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// Who may take a slot (R2, PP15–PP16; H77): her trade's two places take any of their jobs; any other place refuses
// "Another trade", unless the open shop holds: a world with no Uma of the place's trade opens it to every Uma, every job,
// until one arrives. Her trade comes from the caller (`TradeOf`, from her template's calling, H80): rules that can't say
// (settles, queue starts already accepted, the API's parse) pass none, and the gate is open (D208).
import { refuse, type Refusal } from '@luismlorenzana/uma-work'
import { placeSpecV4 } from '../../economy/places-v4'
import { tradeProfessions, type TradeOf } from '../../economy/professions'
import type { FarmWorld } from '../world'

/** The trade gate's refusal code and words (`refusalText` maps it). */
export const TRADE_REFUSAL = 'trade'
export const ANOTHER_TRADE = 'Another trade'

/** Whether a place is an open shop in this world: no owned Uma (by `tradeOf`) has a trade with its profession. An Uma
 * whose trade the caller can't say counts for none. The farm's Umas are its whole roster when the caller has it (FM6). */
export function openShop(world: Pick<FarmWorld, 'umas'>, placeId: string, tradeOf: TradeOf, roster?: ReadonlySet<string>): boolean {
  const profession = placeSpecV4(placeId)?.profession
  if (!profession) return false
  return ![...(roster ?? Object.keys(world.umas))].some((id) => {
    const trade = tradeOf(id)
    return trade !== null && tradeProfessions(trade).includes(profession)
  })
}

/** Why she can't work at this place, or null: her trade's places and an open shop take her, and so does every place when
 * the caller can't say her trade. */
export function tradeBlock(world: Pick<FarmWorld, 'umas'>, outfitId: string, placeId: string, tradeOf?: TradeOf, roster?: ReadonlySet<string>): Refusal | null {
  const trade = tradeOf?.(outfitId) ?? null
  if (!tradeOf || trade === null) return null
  const profession = placeSpecV4(placeId)?.profession
  if (!profession || tradeProfessions(trade).includes(profession) || openShop(world, placeId, tradeOf, roster)) return null
  return refuse(TRADE_REFUSAL, ANOTHER_TRADE)
}
