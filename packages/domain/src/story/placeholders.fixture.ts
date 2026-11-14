// Invented master data for the placeholders: six characters, 9100001–9100006, each top in one stat (the sixth ties Speed
// and Wit), the first with a variant outfit listed before her original one. No original-game content.
import { masterCastFrom, type MasterOutfit } from './placeholders'

export const stat = (speed: number, stamina: number, power: number, guts: number, wit: number) => ({ speed, stamina, power, guts, wit })
export const NONE = stat(0, 0, 0, 0, 0)
/** Their outfits: one each, the first with a variant listed first and the sixth with only a variant. */
export const MASTER_OUTFITS: readonly MasterOutfit[] = [
  { id: '910000102', characterId: '9100001', variant: 'summer', stats: { star5: stat(90, 100, 90, 90, 90) }, growthRatePercents: NONE },
  { id: '910000101', characterId: '9100001', variant: null, stats: { star5: stat(90, 120, 90, 90, 90) }, growthRatePercents: NONE },
  { id: '910000201', characterId: '9100002', variant: null, stats: { star5: stat(130, 90, 90, 90, 90) }, growthRatePercents: NONE },
  { id: '910000301', characterId: '9100003', variant: null, stats: { star5: stat(90, 90, 90, 90, 125) }, growthRatePercents: NONE },
  { id: '910000401', characterId: '9100004', variant: null, stats: { star5: stat(90, 90, 118, 90, 90) }, growthRatePercents: NONE },
  { id: '910000501', characterId: '9100005', variant: null, stats: { star5: stat(90, 90, 90, 110, 90) }, growthRatePercents: stat(0, 0, 0, 20, 0) },
  { id: '910000601', characterId: '9100006', variant: 'wedding', stats: { star5: stat(100, 90, 90, 90, 100) }, growthRatePercents: NONE },
]
export const MASTER = masterCastFrom(MASTER_OUTFITS)
/** Their birthdays, as master data's character set gives them: the first on the farm's Spring 2, the rest none. */
export const MASTER_BIRTHDAYS: ReadonlyMap<string, { month: number; day: number }> = new Map([['9100001', { month: 3, day: 12 }]])
