// Copied from uma-rpg packages/domain/src/items/made.test.ts at 30a322a, with its Wilds-only parts cut.
// The made items (the farm by line since H112): names, places and grades. Their recipes, one line
// each, are `made-v4.ts`' (checked in `work/kinds-v4.test.ts`).
import { describe, expect, it } from 'vitest'
import { madeName, madePlace } from './made'
import { jewelId, MADE_IDENTITIES, MADE_LINES, madeIdentity } from './made-id'

describe('made items: names, places and grades', () => {
  it('names every line: the Weapon Gem reads Arms Gem, and Tome Ink is its own line', () => {
    expect(['weapon-gem-g3', 'tome-ink-g3', 'armor-fittings-g3', 'accessory-setting-g3', 'jewel-planet-3', 'jewel-moon-2', 'weapon-gem-g10']
      .map(madeName)).toEqual(['Arms Gem G3', 'Tome Ink G3', 'Armor Fittings G3', 'Accessory Setting G3', 'Planet Jewel III', 'Moon Jewel II',
      'Arms Gem G10'])
    expect([1, 2, 3, 4, 5].map((n) => madeName(jewelId('planet', n)))).toEqual(['Planet Jewel I', 'Planet Jewel II', 'Planet Jewel III', 'Planet Jewel IV', 'Planet Jewel V'])
    expect(madeName('copper-ore')).toBeUndefined()
    expect(new Set(MADE_IDENTITIES.map((m) => madeName(m.id))).size).toBe(MADE_IDENTITIES.length)
  })

  it('makes each line at its own place (FL3), a jewel at its node\'s grade', () => {
    expect(MADE_LINES.map((l) => madePlace(l))).toEqual(['weapon-forge', 'armorer', 'charm-forge', 'lapidary', 'lapidary', 'tome-forge'])
    expect([1, 2, 3, 4, 5].map((n) => madeIdentity(jewelId('planet', n))!.grade)).toEqual([1, 3, 5, 7, 9])
    expect([1, 2, 3, 4, 5].map((n) => madeIdentity(jewelId('moon', n))!.grade)).toEqual([2, 4, 6, 8, 10])
    // R2's forty and Tome Ink's ten.
    expect(MADE_IDENTITIES).toHaveLength(50)
  })
})
