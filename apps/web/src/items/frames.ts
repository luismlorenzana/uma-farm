// Copied from uma-rpg apps/web/src/items/frames.ts at 30a322a (F5, FM2), cut to the farm's items: the hundred line items
// and the fifty made ones. Where an icon sits on uma-art's atlases (P37–P38), computed from the ids so the atlas indexes
// never ship in the main chunk; frames.test.ts pins every position against them. Gear, Star Gems, v1 items and the
// Branch Gem stay behind.
import { goodOf, lineItem, madeIdentity, seedOf, type GoodFamily } from '@farm/domain'

export const ATLAS_CELL = 32
export type Sheet = 'items' | 'gems'
export const SHEET_SIZE: Readonly<Record<Sheet, { w: number; h: number }>> = {
  // uma-art 2.13.0 appends R2's made items after the racer rows; no earlier frame moves.
  items: { w: 320, h: 1216 },
  gems: { w: 320, h: 320 },
}

export interface IconFrame { sheet: Sheet; x: number; y: number }

/** Each line's uma-art family: a raw row, then its refined row below it. */
const MATERIAL_ROW = { fish: 4, vegetables: 8, ores: 20, crystals: 22, woods: 28 } as const
/** The loop's goods (F19): each uma-art family's raw row, its refined row below it (`items/atlas.json`); v4's rings (F53)
 * draw uma-art's `accessory-setting-g1…g10` row, CS25's renamed frames. */
const GOOD_ROW: Readonly<Record<GoodFamily, number>> = {
  grains: 0, fruits: 2, fish: 4, 'herbs-spices': 6, vegetables: 8, mushrooms: 10, sweets: 12, 'nuts-seeds': 14, 'hides-scales': 16, essences: 18,
  ores: 20, crystals: 22, stones: 24, woods: 28, 'bones-horns': 30, rings: 36,
}

/** The made items' rows; Tome Ink (uma-rpg's FL15) borrows uma-art's essences refined row, the infusion bottles. */
const MADE_ROW = { 'weapon-gem': 34, 'armor-fittings': 35, 'accessory-setting': 36, 'tome-ink': 19 } as const
/** The jewels draw uma-art's gem sheet: Planet Jewels its sun gems, Moon Jewels its limit gems, by node. Positions on the
 * 320 × 320 sheet, ten across. */
const PLANET_JEWEL_ART = [{ x: 192, y: 288 }, { x: 192, y: 288 }, { x: 224, y: 288 }, { x: 256, y: 288 }, { x: 288, y: 288 }] as const
const MOON_JEWEL_ART = [{ x: 32, y: 224 }, { x: 96, y: 224 }, { x: 160, y: 224 }, { x: 224, y: 224 }, { x: 288, y: 224 }] as const

/** A line or made item's own icon, a v3 good's (F19), a seed's crop until F25's seed-packet badge, or null for an id the
 * farm doesn't hold. */
export function iconFrame(id: string): IconFrame | null {
  const good = goodOf(seedOf(id)?.crop ?? id)
  if (good) return { sheet: 'items', x: (good.grade - 1) * ATLAS_CELL, y: (GOOD_ROW[good.family] + (good.refined ? 1 : 0)) * ATLAS_CELL }
  // A line item (the Wilds' hundred): its family's row at its grade.
  const line = lineItem(id)
  if (line) return { sheet: 'items', x: (line.art.grade - 1) * ATLAS_CELL, y: (MATERIAL_ROW[line.art.family] + (line.refined ? 1 : 0)) * ATLAS_CELL }
  const made = madeIdentity(id)
  if (!made) return null
  if (made.line === 'jewel-planet' || made.line === 'jewel-moon') {
    const art = (made.line === 'jewel-planet' ? PLANET_JEWEL_ART : MOON_JEWEL_ART)[Math.ceil(made.grade / 2) - 1]
    return art ? { sheet: 'gems', ...art } : null
  }
  return { sheet: 'items', x: (made.grade - 1) * ATLAS_CELL, y: MADE_ROW[made.line] * ATLAS_CELL }
}
