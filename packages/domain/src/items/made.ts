// Copied from uma-rpg packages/domain/src/items/made.ts at 30a322a, with its Wilds-only parts cut.
// The made items' names and places (the farm by line's). Their ids are `made-id.ts`'s, their recipes `made-v4.ts`' (one
// line each). The Weapon Gem's id stays and reads Arms Gem: it raises Arms only, Tome Ink raises Tomes. A jewel's grade
// is its node's (Planet n 2n − 1, Moon n 2n).
import type { PlaceIdV3 } from '../economy/professions'
import { madeIdentity, type MadeLine } from './made-id'

const NUMERALS = ['I', 'II', 'III', 'IV', 'V'] as const
const LINE_NAME: Readonly<Record<MadeLine, string>> = {
  'weapon-gem': 'Arms Gem', 'armor-fittings': 'Armor Fittings', 'accessory-setting': 'Accessory Setting',
  'jewel-planet': 'Planet Jewel', 'jewel-moon': 'Moon Jewel', 'tome-ink': 'Tome Ink',
}

/** "Arms Gem G3", "Tome Ink G3", "Armor Fittings G3", "Accessory Setting G3", "Planet Jewel III", "Moon Jewel II". */
export function madeName(id: string): string | undefined {
  const made = madeIdentity(id)
  if (!made) return undefined
  if (made.line === 'jewel-planet' || made.line === 'jewel-moon') return `${LINE_NAME[made.line]} ${NUMERALS[Math.ceil(made.grade / 2) - 1]}`
  return `${LINE_NAME[made.line]} G${made.grade}`
}

const LINE_PLACE: Readonly<Record<MadeLine, PlaceIdV3>> = {
  'weapon-gem': 'weapon-forge', 'tome-ink': 'tome-forge', 'armor-fittings': 'armorer', 'accessory-setting': 'charm-forge',
  'jewel-planet': 'lapidary', 'jewel-moon': 'lapidary',
}
/** The making place of a line: the Forge, the Workbench, the Armorer, the Charm Shop or the Lapidary. */
export const madePlace = (line: MadeLine): PlaceIdV3 => LINE_PLACE[line]
