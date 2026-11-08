// Copied from uma-rpg apps/web/src/items/v3-words.ts at 30a322a (F5, FM2): the items in the player's words. A line item's
// line and grade ("Metal · G3 · raw") and its pair ("Refined from Iron Ore"). uma-rpg's uses for made items ("Raises a
// weapon one grade") stay behind: the farm's made items wait for the Forge (M4), so they say their line and grade.
import { lineItem, madeIdentity, madeName, stockName, type MadeLine, type MaterialLine } from '@farm/domain'

/** A material line by its trade's work: the Warehouse's shelves and the trade facet. */
export const LINE_WORD: Readonly<Record<MaterialLine, string>> = { metal: 'Metal', wood: 'Wood', vegetables: 'Vegetables', fish: 'Fish', stone: 'Stone' }

/** The made lines' plural names, as their shelves and places say them. */
export const MADE_PLURAL: Readonly<Record<MadeLine, string>> = {
  'weapon-gem': 'Arms Gems', 'armor-fittings': 'Armor Fittings', 'accessory-setting': 'Accessory Settings',
  'jewel-planet': 'Planet Jewels', 'jewel-moon': 'Moon Jewels', 'tome-ink': 'Tome Ink',
}

/** Each made line's material line. */
const MADE_MATERIAL: Readonly<Record<MadeLine, MaterialLine>> = {
  'weapon-gem': 'metal', 'tome-ink': 'vegetables', 'armor-fittings': 'wood', 'accessory-setting': 'fish', 'jewel-planet': 'stone', 'jewel-moon': 'stone',
}

/** "Metal · G3 · raw", or null for an id that isn't a material. */
export function materialFacts(id: string): string | null {
  const line = lineItem(id)
  return line ? `${LINE_WORD[line.line]} · G${line.grade} · ${line.refined ? 'refined' : 'raw'}` : null
}

/** "Refines into Iron Ingot" or "Refined from Iron Ore". */
export function materialPair(id: string): string | null {
  const m = lineItem(id)
  return m ? `${m.refined ? 'Refined from' : 'Refines into'} ${stockName(m.pair)}` : null
}

/** "Metal · G3 · made", or null for an id that isn't a made item. */
export function madeFacts(id: string): string | null {
  const made = madeIdentity(id)
  return made && madeName(id) ? `${LINE_WORD[MADE_MATERIAL[made.line]]} · G${made.grade} · made` : null
}

/** A line or made item's facts. */
export const itemFacts = (id: string): string | null => materialFacts(id) ?? madeFacts(id)
