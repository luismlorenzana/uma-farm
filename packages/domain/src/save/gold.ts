// Gold (F17; core spec CS1): whole numbers. Spending refuses when the farm is short; neither stamps `updatedAt`, which the
// player's operation does around them.
import { SaveRuleError } from './rules'
import type { SaveV3 } from './v3'
import type { FarmSave } from './v4'

function whole(gold: number): void {
  if (!Number.isSafeInteger(gold) || gold < 0) throw new RangeError(`Gold is whole and never negative: ${gold}`)
}

/** The save with `gold` spent, or a refusal (`no-gold`) when there isn't that much. */
export function spendGold<S extends Pick<FarmSave, 'gold'>>(save: S, gold: number): S {
  whole(gold)
  if (save.gold < gold) throw new SaveRuleError('no-gold', 'Not enough gold')
  return { ...save, gold: save.gold - gold }
}

/** The save with `gold` earned. */
export function earnGold<S extends Pick<FarmSave, 'gold'>>(save: S, gold: number): S {
  whole(gold)
  return { ...save, gold: save.gold + gold }
}
