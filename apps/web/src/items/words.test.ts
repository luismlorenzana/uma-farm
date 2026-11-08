// The items in the player's words: a material's line, grade and pair; a made item's line and grade.
import { describe, expect, it } from 'vitest'
import { itemFacts, madeFacts, materialFacts, materialPair } from './words'

describe('item words', () => {
  it('says a material\'s line, grade and pair', () => {
    expect(materialFacts('iron-ingot')).toBe('Metal · G3 · refined')
    expect(materialFacts('trout')).toBe('Fish · G2 · raw')
    expect(materialPair('diced-potato')).toBe('Refined from Potato')
    expect(materialPair('copper-ore')).toBe('Refines into Copper Ingot')
    expect(materialFacts('weapon-gem-g1')).toBeNull()
  })

  it('says a made item\'s line and grade, a jewel by its grade', () => {
    expect(madeFacts('weapon-gem-g3')).toBe('Metal · G3 · made')
    expect(madeFacts('tome-ink-g1')).toBe('Vegetables · G1 · made')
    expect(madeFacts('jewel-moon-2')).toBe('Stone · G4 · made')
    expect(itemFacts('armor-fittings-g10')).toBe('Wood · G10 · made')
    expect(itemFacts('nothing')).toBeNull()
  })
})
