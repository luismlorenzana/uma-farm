// Copied from uma-rpg apps/web/src/items/frames.ts at 30a322a, cut to the farm's goods and seeds, and the Kitchen's
// dishes. Where an icon sits on uma-art's items and dishes atlases, computed from the ids so the atlas index never ships
// in the main chunk; frames.test.ts pins every position against them.
import { baseGoodId, goodOf, seedOf, type GoodFamily } from '@farm/domain'

export const ATLAS_CELL = 32
export type Sheet = 'items' | 'dishes'
export const SHEET_SIZE: Readonly<Record<Sheet, { w: number; h: number }>> = {
  // uma-art 2.13.0 appends R2's made items after the racer rows; 2.30.0 the ranch's eggs and milk on row 38. No earlier
  // frame moves.
  items: { w: 320, h: 1248 },
  dishes: { w: 320, h: 320 },
}

export interface IconFrame { sheet: Sheet; x: number; y: number }

/** The loop's goods: each uma-art family's raw row, its refined row below it (`items/atlas.json`); the rings
 * draw uma-art's `accessory-setting-g1…g10` row, the renamed frames; the ranch's eggs and milk are row 38, G1–G4, raw
 * only. */
const GOOD_ROW: Readonly<Record<GoodFamily, number>> = {
  grains: 0, fruits: 2, fish: 4, 'herbs-spices': 6, vegetables: 8, mushrooms: 10, sweets: 12, 'nuts-seeds': 14, 'hides-scales': 16, essences: 18,
  ores: 20, crystals: 22, stones: 24, fibers: 26, woods: 28, 'bones-horns': 30, rings: 36, 'eggs-milk': 38,
}

/** The dishes atlas (`dishes/atlas.json`): a row a dish's family, G1 → G10 across. */
const DISH_ROW: Readonly<Record<string, number>> = {
  grains: 0, fruits: 1, fish: 2, 'herbs-spices': 3, vegetables: 4, mushrooms: 5, sweets: 6, 'nuts-seeds': 7,
}

/** A good's icon, a seed's crop until the seed-packet badge ships, a dish's (`dish-<family>-<grade>`), or null for an id
 * the farm doesn't hold. */
export function iconFrame(id: string): IconFrame | null {
  const dish = /^dish-([a-z-]+)-(10|[1-9])$/.exec(id)
  const row = dish ? DISH_ROW[dish[1]!] : undefined
  if (dish && row !== undefined) return { sheet: 'dishes', x: (Number(dish[2]) - 1) * ATLAS_CELL, y: row * ATLAS_CELL }
  const good = goodOf(seedOf(id)?.crop ?? baseGoodId(id))
  return good ? { sheet: 'items', x: (good.grade - 1) * ATLAS_CELL, y: (GOOD_ROW[good.family] + (good.refined ? 1 : 0)) * ATLAS_CELL } : null
}
