// Copied from uma-rpg apps/web/src/items/frames.ts at 30a322a, cut to the farm's goods and seeds. Where an icon sits on
// uma-art's items atlas, computed from the ids so the atlas index never ships in the main chunk; frames.test.ts pins
// every position against it.
import { goodOf, seedOf, type GoodFamily } from '@farm/domain'

export const ATLAS_CELL = 32
export type Sheet = 'items'
export const SHEET_SIZE: Readonly<Record<Sheet, { w: number; h: number }>> = {
  // uma-art 2.13.0 appends R2's made items after the racer rows; no earlier frame moves.
  items: { w: 320, h: 1216 },
}

export interface IconFrame { sheet: Sheet; x: number; y: number }

/** The loop's goods: each uma-art family's raw row, its refined row below it (`items/atlas.json`); v4's rings
 * draw uma-art's `accessory-setting-g1…g10` row, the renamed frames. */
const GOOD_ROW: Readonly<Record<GoodFamily, number>> = {
  grains: 0, fruits: 2, fish: 4, 'herbs-spices': 6, vegetables: 8, mushrooms: 10, sweets: 12, 'nuts-seeds': 14, 'hides-scales': 16, essences: 18,
  ores: 20, crystals: 22, stones: 24, woods: 28, 'bones-horns': 30, rings: 36,
}

/** A good's icon, a seed's crop until the seed-packet badge ships, or null for an id the farm doesn't hold. */
export function iconFrame(id: string): IconFrame | null {
  const good = goodOf(seedOf(id)?.crop ?? id)
  if (good) return { sheet: 'items', x: (good.grade - 1) * ATLAS_CELL, y: (GOOD_ROW[good.family] + (good.refined ? 1 : 0)) * ATLAS_CELL }
  return null
}
